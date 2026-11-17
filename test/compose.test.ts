/**
 * Flows in flows (src/core/compose.ts, ADR 0026 §1, §2): a flow lists the flows it reads, and reading it brings them
 * in. One definition read once, names that are the estate's, each flow known by its own hash, the same steps with the
 * same keys wherever they are read, and what one flow may read of another: its published datasets and its files.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FlowRecord } from '../src/app/record.js';
import { auditBag } from '../src/core/audit.js';
import { buildBag, type BagFile } from '../src/core/bag.js';
import { canonicalJSON } from '../src/core/canonical.js';
import { composeFlow, flowProblems, pathFrom, type FlowFiles } from '../src/core/compose.js';
import { flowOf, givesOf, readsOf, validateDocument, type FlowDocument } from '../src/core/document.js';
import { repairDocument, type Repair } from '../src/core/fill.js';
import { syncRuleCells } from '../src/core/gatecell.js';
import { nodeKey } from '../src/core/keys.js';
import { expandNotebooks, joinPath, loadNotebooks } from '../src/core/notebook.js';
import { flowHash, translate, type FlowPlan } from '../src/core/plan.js';
import { importOntologies } from '../src/core/shared.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { installFakeIndexedDB } from './helpers/fake-idb.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

/** Files in memory, by path: a flow's document as an object, a notebook as its text. */
const files = (given: Record<string, unknown>): FlowFiles => ({
  json: async (path) => {
    if (!(path in given)) throw new Error(`no file ${path}`);
    return structuredClone(given[path]);
  },
  text: async (path) => {
    if (typeof given[path] !== 'string') throw new Error(`no file ${path}`);
    return given[path] as string;
  },
});

const PARAMS = [{ name: 'day', type: 'text', default: null }];
const flow = (id: string, name: string, more: Record<string, unknown>) => ({ smaltfl: 4, id, name, parameters: PARAMS, ...more });
const nb = (imports: string, body: string) => `import { cell, sql } from 'smaltnb';\nimport { check, publish, source } from 'smaltfl/notebook';\n${imports}\n${body}\n`;

/** Orders: a file, its checked rows (which it gives) and a count a day (which it keeps to itself). */
const ORDERS = {
  'orders/flow.json': flow('orders', 'Orders', { sources: [{ id: 'orders', table: 'orders_file' }], notebooks: ['orders.nb.ts'] }),
  'orders/orders.nb.ts': nb('', `
cell('orders');
export const orders = source('orders');

cell('orders_checked');
export const orders_checked = check(orders, { rules: [{ name: 'has_id', check: 'order_id IS NOT NULL', onFail: 'drop' }] });

cell('orders_daily', { lang: 'sql' });
export const orders_daily = sql\`SELECT day, count(*) AS n FROM \${orders_checked} GROUP BY day\`;

cell('published');
publish(orders_checked);`),
};

/** Sales reads Orders, and joins what it gives to a file of its own. */
const SALES = {
  ...ORDERS,
  'flow.json': flow('sales', 'Sales', { flows: ['orders/flow.json'], sources: [{ id: 'customers', table: 'customers_file' }], notebooks: ['sales.nb.ts'] }),
  'sales.nb.ts': nb("import { orders_checked } from './orders/orders.nb.js';", `
cell('customers');
export const customers = source('customers');

cell('by_customer', { lang: 'sql' });
export const by_customer = sql\`SELECT c.name, count(*) AS n FROM \${orders_checked} o JOIN \${customers} c ON c.id = o.customer_id GROUP BY c.name\`;

cell('published');
publish(by_customer);`),
};

const read = (given: Record<string, unknown>, path = 'flow.json') => composeFlow(path, files(given), ts);
const refused = async (given: Record<string, unknown>, path = 'flow.json'): Promise<string> => read(given, path).then(() => 'read', (e: Error) => e.message);

/** Every node's key, by its origin, with each source's snapshot standing for its table's name: what a run would key. */
async function keys(plan: FlowPlan): Promise<Map<string, string>> {
  const out: string[] = [];
  for (const n of plan.nodes) out.push(await nodeKey(n, n.inputs.map((i) => out[i]!), { smaltdb: 'x', smaltfl: 'y' }, n.op === 'table' ? `content of ${n.table}` : undefined));
  return new Map(plan.nodes.map((n, i) => [n.origin, out[i]!]));
}

describe('a flow reads another flow', () => {
  it('brings it in when it is read: its sources and steps before its own, listed with what is its own and its own hash', async () => {
    const doc = await read(SALES);
    expect(validateDocument(doc)).toEqual([]);
    expect(doc.sources.map((s) => s.id)).toEqual(['orders', 'customers']);
    expect(doc.steps.map((s) => s.id)).toEqual(['orders_checked', 'orders_daily', 'by_customer']);
    expect(doc.notebooks!.map((n) => n.path)).toEqual(['orders/orders.nb.ts', 'sales.nb.ts']);
    const alone = await read(SALES, 'orders/flow.json');
    expect(doc.flows).toEqual([{ path: 'orders/flow.json', id: 'orders', name: 'Orders', hash: await flowHash(alone), sources: ['orders'], steps: ['orders_checked', 'orders_daily'], reads: [], direct: true }]);
    expect(alone.flows).toBeUndefined();
    expect(alone.notebooks!.map((n) => n.path)).toEqual(['orders.nb.ts']);
  });

  it('says whose a source or a step is, what a flow gives and what it reads', async () => {
    const doc = await read(SALES);
    expect(flowOf(doc, 'orders_checked')?.id).toBe('orders');
    expect(flowOf(doc, 'ORDERS')?.id).toBe('orders');
    expect(flowOf(doc, 'by_customer')).toBeUndefined();
    expect(givesOf(doc, 'orders')).toEqual(['orders_checked']);
    expect(givesOf(doc)).toEqual(['by_customer']);
    expect(readsOf(doc)).toEqual(['orders']);
    expect(readsOf(doc, 'orders')).toEqual([]);
  });

  it('keeps the plan flat, and gives the steps of the flow it reads the keys they have on their own', async () => {
    const doc = await read(SALES);
    const plan = await translate(doc, { day: '2024-03-11' });
    expect(plan.nodes.map((n) => n.origin)).toEqual(['orders', 'customers', 'orders_checked', 'orders_daily', 'by_customer']);
    expect(plan.outputs.map((o) => o.name)).toEqual(['by_customer', 'orders_checked']);
    const alone = await keys(await translate(await read(SALES, 'orders/flow.json'), { day: '2024-03-11' }));
    const inside = await keys(plan);
    for (const id of ['orders', 'orders_checked', 'orders_daily']) expect(inside.get(id), id).toBe(alone.get(id));
  });

  it('reads a flow that reads none as it always was read', async () => {
    const dir = new URL('../examples/security-signins/', import.meta.url);
    const raw = await importOntologies(JSON.parse(readFileSync(new URL('flow.json', dir), 'utf8')) as FlowDocument, async (p) => JSON.parse(readFileSync(new URL(p, dir), 'utf8')));
    const loaded = await loadNotebooks(raw, async (p) => readFileSync(new URL(p, dir), 'utf8'));
    expect(await loadFlowDir(dir)).toEqual(syncRuleCells(await expandNotebooks(loaded as FlowDocument, ts)));
  });

  it('moves the reader’s hash with the flow it reads, and not the other way', async () => {
    const before = await read(SALES);
    const changed = { ...SALES, 'orders/orders.nb.ts': (SALES['orders/orders.nb.ts'] as string).replace('order_id IS NOT NULL', 'order_id > 0') };
    const after = await read(changed);
    expect(after.flows![0]!.hash).not.toBe(before.flows![0]!.hash);
    expect(await flowHash(after)).not.toBe(await flowHash(before));
    const own = { ...SALES, 'sales.nb.ts': (SALES['sales.nb.ts'] as string).replace('count(*) AS n FROM ${orders_checked}', 'count(*) AS orders FROM ${orders_checked}') };
    const mine = await read(own);
    expect(mine.flows![0]!.hash).toBe(before.flows![0]!.hash);
    expect(await flowHash(mine)).not.toBe(await flowHash(before));
  });
});

describe('a flow pinned by the flow that reads it (ADR 0026 §7)', () => {
  it('is read as the flow its hash names, and the part says who pins it', async () => {
    const hash = (await read(SALES)).flows![0]!.hash;
    const pinned = { ...SALES, 'flow.json': { ...SALES['flow.json'], flows: [{ path: 'orders/flow.json', hash }] } };
    const doc = await read(pinned);
    expect(doc.flows![0]).toMatchObject({ id: 'orders', hash, pin: [''] });
    expect(validateDocument(doc)).toEqual([]);
    // The pin is the reader's, part of what it is: its hash isn't the unpinned reader's.
    expect(await flowHash(doc)).not.toBe(await flowHash(await read(SALES)));
    // Unpinned, the part says nothing of a pin.
    expect('pin' in (await read(SALES)).flows![0]!).toBe(false);
  });

  it('refuses the flow once it is any other, saying both hashes, until the pin is moved', async () => {
    const hash = (await read(SALES)).flows![0]!.hash;
    const changed = { ...SALES, 'orders/flow.json': { ...ORDERS['orders/flow.json'], description: 'Orders, with a word more said of them' } };
    const now = (await read(changed)).flows![0]!.hash;
    expect(now).not.toBe(hash);
    const pinned = (to: string) => ({ ...changed, 'flow.json': { ...SALES['flow.json'], flows: [{ path: 'orders/flow.json', hash: to }] } });
    expect(await refused(pinned(hash))).toBe(`flow.json: Sales pins Orders at ${hash}, and orders/flow.json is ${now} now: move the pin to read the flow as it is, or put the flow back as it was`);
    expect((await read(pinned(now))).flows![0]!.pin).toEqual(['']);
  });

  it('says who pins a flow read through another, and refuses a pin that isn’t a path and a hash', async () => {
    const hash = (await read(SALES)).flows![0]!.hash;
    // Reports reads Sales, which pins Orders: the pin is Sales', by its id.
    const reports = {
      ...SALES,
      'sales/flow.json': { ...SALES['flow.json'], flows: [{ path: '../orders/flow.json', hash }] },
      'sales/sales.nb.ts': (SALES['sales.nb.ts'] as string).replace('./orders/orders.nb.js', '../orders/orders.nb.js'),
      'flow.json': flow('reports', 'Reports', { flows: ['sales/flow.json'], sources: [], notebooks: ['reports.nb.ts'] }),
      'reports.nb.ts': nb("import { by_customer } from './sales/sales.nb.js';", `
cell('top', { lang: 'sql' });
export const top = sql\`SELECT name FROM \${by_customer} ORDER BY n DESC LIMIT 3\`;

cell('published');
publish(top);`),
    };
    const doc = await read(reports);
    expect(doc.flows!.map((f) => [f.id, f.pin ?? null])).toEqual([['orders', ['sales']], ['sales', null]]);
    for (const bad of [{ path: 'orders/flow.json' }, { path: 'orders/flow.json', hash: 'abc' }, { path: 'orders/flow.json', hash, also: 1 }, 7]) {
      expect(await refused({ ...SALES, 'flow.json': { ...SALES['flow.json'], flows: [bad] } })).toMatch(/flows is a list of the flows this one reads, each by the path of its flow\.json; or \{ path, hash \}/);
    }
  });
});

describe('what one flow may read of another', () => {
  it('reads a file of the flow as it arrived', async () => {
    const given = { ...SALES, 'sales.nb.ts': (SALES['sales.nb.ts'] as string).replaceAll('orders_checked', 'orders') };
    const doc = await read(given);
    expect(doc.steps.find((s) => s.id === 'by_customer')!.inputs).toEqual(['orders', 'customers']);
  });

  it('refuses a step the flow doesn’t publish, and says where to publish it', async () => {
    const given = { ...SALES, 'sales.nb.ts': (SALES['sales.nb.ts'] as string).replaceAll('orders_checked', 'orders_daily') };
    expect(await refused(given)).toContain('by_customer reads orders_daily, a step of Orders that it doesn’t publish: a flow reads what another gives (publish orders_daily there) or its files'.replace('’', "'"));
  });

  it('refuses a flow it doesn’t list, though a flow it reads does', async () => {
    // Sales reads Shipping, which reads Orders; Sales reads Orders' rows without listing Orders.
    const given = {
      ...ORDERS,
      'shipping/flow.json': flow('shipping', 'Shipping', { flows: ['../orders/flow.json'], sources: [], notebooks: ['shipping.nb.ts'] }),
      'shipping/shipping.nb.ts': nb("import { orders_checked } from '../orders/orders.nb.js';", `
cell('shipped', { lang: 'sql' });
export const shipped = sql\`SELECT * FROM \${orders_checked} WHERE shipped_on IS NOT NULL\`;

cell('published');
publish(shipped);`),
      'flow.json': flow('sales', 'Sales', { flows: ['shipping/flow.json'], sources: [], notebooks: ['sales.nb.ts'] }),
      'sales.nb.ts': nb("import { shipped } from './shipping/shipping.nb.js';\nimport { orders_checked } from './orders/orders.nb.js';", `
cell('late', { lang: 'sql' });
export const late = sql\`SELECT o.order_id FROM \${orders_checked} o LEFT JOIN \${shipped} s ON s.order_id = o.order_id WHERE s.order_id IS NULL\`;

cell('published');
publish(late);`),
    };
    expect(await refused(given)).toContain("late reads orders_checked, which is Orders's, and Sales doesn't list Orders among the flows it reads");
    // Listing it reads it once: one Orders, read by Sales and by Shipping.
    const listed = { ...given, 'flow.json': flow('sales', 'Sales', { flows: ['shipping/flow.json', 'orders/flow.json'], sources: [], notebooks: ['sales.nb.ts'] }) };
    const doc = await read(listed);
    expect(doc.flows!.map((f) => [f.id, f.reads, f.direct])).toEqual([['orders', [], true], ['shipping', ['orders'], true]]);
    expect(doc.sources.map((s) => s.id)).toEqual(['orders']);
    expect(readsOf(doc, 'shipping')).toEqual(['orders']);
    // And a flow read only through another is not the reader's to list as its own.
    const through = { ...given, 'sales.nb.ts': nb("import { shipped } from './shipping/shipping.nb.js';", `
cell('late', { lang: 'sql' });
export const late = sql\`SELECT * FROM \${shipped}\`;

cell('published');
publish(late);`) };
    expect((await read(through)).flows!.map((f) => [f.id, f.direct])).toEqual([['orders', false], ['shipping', true]]);
    // Shipping read on its own reaches Orders from its own folder.
    const alone = await read(given, 'shipping/flow.json');
    expect(alone.notebooks!.map((n) => n.path)).toEqual(['../orders/orders.nb.ts', 'shipping.nb.ts']);
    expect(alone.flows!.map((f) => f.path)).toEqual(['../orders/flow.json']);
    expect(doc.flows!.find((f) => f.id === 'shipping')!.hash).toBe(await flowHash(alone));
  });

  it('refuses flows that read each other in a circle', async () => {
    const given = {
      'a/flow.json': flow('a', 'A', { flows: ['../b/flow.json'], sources: [], notebooks: ['a.nb.ts'] }),
      'a/a.nb.ts': nb('', ''),
      'b/flow.json': flow('b', 'B', { flows: ['../a/flow.json'], sources: [], notebooks: ['b.nb.ts'] }),
      'b/b.nb.ts': nb('', ''),
    };
    expect(await refused(given, 'a/flow.json')).toContain('the flows read each other in a circle: a/flow.json → b/flow.json → a/flow.json');
  });

  it('refuses a name two flows use: a name is one thing across a flow and the flows it reads', async () => {
    const given = { ...SALES, 'flow.json': flow('sales', 'Sales', { flows: ['orders/flow.json'], sources: [{ id: 'orders', table: 'other_file' }], notebooks: ['sales.nb.ts'] }) };
    expect(await refused(given)).toContain('orders is a source of Orders and of Sales: a name is one thing across a flow and the flows it reads');
    const twoSteps = { ...SALES, 'sales.nb.ts': (SALES['sales.nb.ts'] as string).replaceAll('by_customer', 'orders_daily').replace("{ orders_checked }", '{ orders_checked }') };
    expect(await refused(twoSteps)).toMatch(/orders_daily/);
  });

  it('refuses a flow that keeps another calendar or pauses another way, and says what differs', async () => {
    const publish = { hold: ['checks'], period: 'day', together: false, reach: 'downstream' };
    const base = { ...SALES, 'flow.json': { ...(SALES['flow.json'] as object), publish } };
    const other = { ...base, 'orders/flow.json': { ...(ORDERS['orders/flow.json'] as object), publish: { ...publish, together: true, reach: undefined } } };
    expect(await refused(other)).toContain('Orders pauses another way than Sales (publish.together, publish.reach): a flow and the flows it reads pause one way');
    const cal = { ...SALES, 'orders/flow.json': { ...(ORDERS['orders/flow.json'] as object), calendar: { base: 'us', zone: 'UTC' } } };
    expect(await refused(cal)).toContain('Orders keeps another calendar than Sales');
    const same = { ...base, 'orders/flow.json': { ...(ORDERS['orders/flow.json'] as object), publish } };
    expect((await read(same)).publish).toEqual(publish);
  });
});

describe('a composed document', () => {
  it('is refused where it still lists paths: it was never read with its flows', () => {
    const issues = validateDocument({ ...(SALES['flow.json'] as object), sources: [], steps: [], notebooks: undefined, smaltfl: 1 });
    expect(issues.map((i) => i.message)).toContain('the flows a flow reads are brought in when it is read (readFlow): this document lists paths it was never read with');
  });

  it('is checked wherever it is read: a step in two flows, a flow before one it reads, a flow that reads itself', async () => {
    const doc = await read(SALES);
    const part = doc.flows![0]!;
    const said = (flows: unknown) => validateDocument({ ...doc, flows }).map((i) => `${i.path}: ${i.message}`);
    expect(said([part, { ...part, id: 'again', name: 'Again', sources: [] }])).toContain("$.flows[1].steps: orders_checked is Orders's and Again's: a source or a step is one flow's");
    expect(said([{ ...part, reads: ['later'] }])).toContain("$.flows[0].reads: Orders reads later, which isn't listed before it: a flow comes after the flows it reads, and none reads itself");
    expect(said([{ ...part, id: 'sales' }])).toContain("$.flows[0].id: sales is this flow's own id: a flow doesn't read itself");
    expect(said([{ ...part, steps: ['orders_checked', 'nothing'] }])).toContain('$.flows[0].steps: no step nothing');
    expect(said([{ ...part, hash: 'abc' }])[0]).toContain('{ path, id, name, hash, sources, steps, reads, direct }');
    // A flow read into another can't read back out of it.
    const back = { ...doc, steps: doc.steps.map((s) => (s.id === 'orders_daily' && s.kind === 'sql' ? { ...s, inputs: ['orders_checked', 'customers'] } : s)) };
    expect(validateDocument(back).map((i) => i.message)).toContain("orders_daily reads customers, which is Sales's: a flow reads the flows it lists, not the flow that reads it");
  });

  it('holds each flow it reads unchanged, and says where it doesn’t', async () => {
    const doc = await read(SALES);
    const alone = await read(SALES, 'orders/flow.json');
    expect(flowProblems(doc, alone)).toEqual([]);
    const tampered = { ...doc, steps: doc.steps.map((s) => (s.id === 'orders_checked' && s.kind === 'expectations' ? { ...s, rules: [] } : s)) };
    expect(flowProblems(tampered, alone)).toEqual(["its step orders_checked isn't as it wrote it"]);
    expect(flowProblems({ ...doc, sources: doc.sources.filter((s) => s.id !== 'orders') }, alone)).toEqual(["its source orders isn't there"]);
  });

  it('names paths from one folder to another', () => {
    expect(pathFrom('', 'orders/flow.json')).toBe('orders/flow.json');
    expect(pathFrom('feeds', 'inventory/bronze.nb.ts')).toBe('../inventory/bronze.nb.ts');
    expect(pathFrom('feeds', 'feeds/bronze.nb.ts')).toBe('bronze.nb.ts');
    expect(pathFrom('a/b', 'a/c/d.json')).toBe('../c/d.json');
    expect(joinPath('feeds', '../inventory/flow.json')).toBe('inventory/flow.json');
    expect(joinPath('', '../shared/flow.json')).toBe('../shared/flow.json');
    expect(joinPath('a', './b/../c.json')).toBe('a/c.json');
  });
});

describe('a run of a flow that reads flows (ADR 0026 §2)', () => {
  const engine = () => {
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER); INSERT INTO orders_file VALUES (1,'2024-03-11',1),(2,'2024-03-11',2),(NULL,'2024-03-11',2),(3,'2024-03-11',1)");
    db.exec("CREATE TABLE customers_file(id INTEGER, name TEXT); INSERT INTO customers_file VALUES (1,'Aster'),(2,'Birch')");
    return db;
  };
  const day = { day: '2024-03-11' };

  it('names each flow it read by its hash, keeps their documents, and verifies that it holds them unchanged', async () => {
    const db = engine();
    const doc = await read(SALES);
    const orders = await read(SALES, 'orders/flow.json');
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, flows: [orders] });
    expect(r.manifest.flow.reads).toEqual([['orders', await flowHash(orders)]]);
    expect(db.query('SELECT name, n FROM by_customer ORDER BY name').rows).toEqual([['Aster', 2], ['Birch', 1]]);
    const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
    expect(v.checks.find((c) => c.check === 'flows')).toMatchObject({ ok: true, origin: 'flow' });
    expect(v.ok).toBe(true);
  });

  it('builds the steps of a flow once: the flow run on its own, then read by another, is found built', async () => {
    const db = engine();
    const orders = await read(SALES, 'orders/flow.json');
    const alone = await runFlow(db, orders, { smaltdb: SMALTDB, parameters: day });
    const made = (m: typeof alone.manifest, origin: string) => m.nodes.find((n) => n.origin === origin)!;
    expect(made(alone.manifest, 'orders_checked').status).toBe('built');
    const inside = await runFlow(db, await read(SALES), { smaltdb: SMALTDB, parameters: day, flows: [orders] });
    expect(made(inside.manifest, 'orders_checked')).toMatchObject({ status: 'reused', key: made(alone.manifest, 'orders_checked').key, content: made(alone.manifest, 'orders_checked').content });
    expect(made(inside.manifest, 'by_customer').status).toBe('built');
  });

  it('says so where a flow’s own document wasn’t kept, and refuses one the run doesn’t read', async () => {
    const db = engine();
    const doc = await read(SALES);
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day });
    expect(r.manifest.flow.reads).toHaveLength(1);
    const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'stored', manifest: r.hash });
    expect(v.checks.find((c) => c.check === 'flows')).toMatchObject({ ok: false, note: "Orders's own document isn't kept with the run" });
    await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, flows: [doc] })).rejects.toThrow("a flow document was given (Sales) that the run's flow doesn't read");
  });

  it('is audited offline: the flows a run names are its document’s, each one’s own in the bag and held unchanged (ADR 0026 §7)', async () => {
    installFakeIndexedDB();
    const enc = new TextEncoder();
    const db = engine();
    const doc = await read(SALES);
    const orders = await read(SALES, 'orders/flow.json');
    const rec = await FlowRecord.open(`flows-${Math.random().toString(36).slice(2)}`);
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, flows: [orders], log: rec.head() });
    const blob = await rec.keep('manifest', r.manifest);
    const plan = await rec.keep('plan', JSON.parse(String(db.query('SELECT plan FROM _smaltfl_plans WHERE hash = ?', [r.manifest.plan]).rows[0]![0])));
    const entry = await rec.append('run', 'owner', { run: r.run, manifest: r.hash, blob, plan, load: null, outcome: 'ok', files: [] });
    // A bag as the app's export makes one: the record, its blobs, the engine's flow documents, a proof a dataset.
    const bag = (tweak: (payload: BagFile[]) => BagFile[] = (x) => x) => {
      const head = rec.head();
      const payload: BagFile[] = [
        { path: 'record/entries.jsonl', bytes: enc.encode(rec.entries.map((e) => canonicalJSON(e as never)).join('\n') + '\n') },
        { path: 'record/checkpoints.jsonl', bytes: enc.encode(rec.checkpoints.map((c) => JSON.stringify(c)).join('\n') + '\n') },
        { path: 'record/card.json', bytes: enc.encode(JSON.stringify(rec.identity.card)) },
        ...db.query('SELECT hash, doc FROM _smaltfl_flows').rows.map(([h, d]) => ({ path: `engine/flows/${String(h)}.json`, bytes: enc.encode(String(d)) })),
        ...Object.entries(r.manifest.outputs).map(([name, o]) => ({ path: `proofs/${name}.json`, bytes: enc.encode(JSON.stringify({ dataset: name, ...o, entry, inclusion: rec.proofOf(entry.seq) })) })),
      ];
      return (async () => buildBag({ name: 'smaltfl-audit-flows', payload: [...tweak(payload), ...(await rec.blobs()).map((b) => ({ path: `blobs/${b.kind}-${b.hash}.json`, bytes: enc.encode(b.json) }))], info: [['External-Identifier', `${head.origin} ${head.size} ${head.root}`]], date: '2026-11-17' }))();
    };
    const failed = async (files: Promise<BagFile[]>) => (await auditBag(await files)).lines.filter((l) => !l.ok).map((l) => l.what);
    expect(await failed(bag())).toEqual([]);
    const ordersHash = await flowHash(orders);
    // Orders' own document left out of the bag: said, as what can't be checked.
    expect((await failed(bag((p) => p.filter((f) => f.path !== `engine/flows/${ordersHash}.json`)))).join(' ')).toContain("Orders's own document isn't in the bag, so that the run holds it unchanged can't be checked");
    // Another document under its name: it doesn't hash to the hash the run names it by.
    const other = enc.encode(JSON.stringify({ ...orders, description: 'Not the Orders the run read' }));
    expect((await failed(bag((p) => p.map((f) => (f.path === `engine/flows/${ordersHash}.json` ? { ...f, bytes: other } : f))))).join(' ')).toContain("Orders's own document doesn't hash to the hash the run names it by");
  });

  it('names no flows in the manifest of a flow that reads none', async () => {
    const db = engine();
    const r = await runFlow(db, await read(SALES, 'orders/flow.json'), { smaltdb: SMALTDB, parameters: day });
    expect('reads' in r.manifest.flow).toBe(false);
    expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'stored', manifest: r.hash })).checks.some((c) => c.check === 'flows')).toBe(false);
  });
});

describe('Larkspur, cut into the flows it is made of (ADR 0026 §12)', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);

  it('is five flows: the posture product reads the organisation, the inventory, the evidence feeds and the applications', async () => {
    const doc = await loadFlowDir(dir);
    expect(validateDocument(doc)).toEqual([]);
    expect(doc.flows!.map((f) => [f.id, f.name, f.sources.length, f.steps.length, f.reads, f.direct])).toEqual([
      ['hr', 'HR organisation', 2, 7, [], true],
      ['inventory', 'Inventory', 4, 2, [], true],
      ['feeds', 'Evidence feeds', 13, 25, ['inventory'], true],
      ['applications', 'Applications', 0, 7, ['inventory', 'hr', 'feeds'], true],
    ]);
    expect(doc.sources).toHaveLength(22);
    expect(doc.sources.filter((s) => !flowOf(doc, s.id)).map((s) => s.id)).toEqual(['control_catalog', 'control_requirements', 'exceptions']);
    expect(givesOf(doc, 'hr')).toEqual(['org_units', 'leaders', 'org_closure', 'org_chain']);
    expect(givesOf(doc, 'inventory')).toEqual(['cmdb_apps_checked', 'cloud_assets_checked']);
    expect(givesOf(doc, 'feeds')).toHaveLength(13);
    expect(givesOf(doc, 'applications')).toEqual(['apps', 'app_owners', 'shadow_assets']);
    expect(givesOf(doc)).toHaveLength(15);
    // Every flow brings its own watches: together, the twenty-eight datasets the estate is judged by.
    expect(Object.keys(doc.publish!.watch!)).toHaveLength(28);
  });

  it('knows each flow by the hash reading its own folder gives, and holds each unchanged', async () => {
    const doc = await loadFlowDir(dir);
    for (const f of doc.flows!) {
      const alone = await loadFlowDir(new URL(f.path.replace(/flow\.json$/, ''), dir));
      expect(f.hash, f.id).toBe(await flowHash(alone));
      expect(flowProblems(doc, alone), f.id).toEqual([]);
    }
    expect(new Set(doc.flows!.map((f) => f.hash)).size).toBe(4);
  });

  it('fills a file of a flow it reads: the donor is that flow’s too, and the flow is still held unchanged', async () => {
    const doc = await loadFlowDir(dir);
    const repair = { kind: 'fill', step: 'tls_filled', source: 'tls', missing: { all: true }, donor: { rule: 'nearest', direction: 'before', day: '2024-03-11', file: { path: 'loads/none', sha256: '0'.repeat(64), bytes: 0 }, claim: {} } } as unknown as Repair;
    const derived = repairDocument(doc, repair);
    expect(validateDocument(derived)).toEqual([]);
    expect(flowOf(derived, 'tls_donor')?.id).toBe('feeds');
    expect(derived.flows!.find((f) => f.id === 'feeds')!.hash).toBe(doc.flows!.find((f) => f.id === 'feeds')!.hash);
    expect(flowProblems(derived, await loadFlowDir(new URL('feeds/', dir)))).toEqual([]);
    // The part alone, of a day nothing fills: the flow document is untouched.
    expect(repairDocument(doc, { ...repair, kind: 'complete', donor: null }).flows).toEqual(doc.flows);
  });

  it('runs as one flat plan: the same 92 nodes, 37 of them published', async () => {
    const plan = await translate(await loadFlowDir(dir), { day: '2024-03-12' });
    expect(plan.nodes).toHaveLength(92);
    expect(plan.outputs).toHaveLength(37);
    expect(plan.smaltflPlan).toBe(4);
  });
});
