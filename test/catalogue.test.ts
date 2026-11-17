/**
 * The catalogue (src/core/catalogue.ts, ADR 0025 §10): a flow made already, added to a flow that reads what it is built
 * on. What adding makes is, for a run, the document reading a flow that lists the added one gives: the same plan, node
 * for node. On Larkspur and its two catalogue flows, through the engine on a small flow, and Larkspur's two through the
 * engine on days of the estate: a flow made for a catalogue has to run on the days of the flow it is added to.
 */
import { readFileSync } from 'node:fs';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import { describe, expect, it } from 'vitest';
import smaltfl from '../src/plugin/index.js';
import { addFlow, addProblems, entryOf, takeOff, takeOffProblems } from '../src/core/catalogue.js';
import { composeFlow, flowProblems, type FlowFiles } from '../src/core/compose.js';
import { givesOf, validateDocument, type FlowDocument } from '../src/core/document.js';
import { nodeKey } from '../src/core/keys.js';
import { notebookSectionId } from '../src/core/notebook.js';
import { flowHash, translate, type FlowPlan } from '../src/core/plan.js';
import { mapProblems, useOf, useProblems, type UseSpec } from '../src/core/reuse.js';
import { sha256Hex, utf8 } from '../src/core/hash.js';
import { versionTable } from '../src/plugin/store.js';
import { pinFile, runFlow, verifyRun } from '../src/index.js';
import { pinnedDdl, type DataBindings } from '../examples/sources.js';
import { readCatalogue } from '../scripts/catalogue.js';
import { csvOf, DAILY_FILES, dayFile, fixedFiles, larkspur as larkspurEstate, LARKSPUR_SILVER } from './fixtures/larkspur.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

const larkspur = new URL('../examples/larkspur/', import.meta.url);
const catalogue = (id: string) => new URL(`../examples/larkspur/catalogue/${id}/`, import.meta.url);
/** The path the estate's flow would list a catalogue flow by. */
const pathOf = (id: string) => `catalogue/${id}/flow.json`;
const day = { day: '2024-03-12' };

/** Every node's key by its origin, each source's snapshot standing for its table: what a run would key, in any order. */
async function keys(plan: FlowPlan): Promise<Map<string, string>> {
  const out: string[] = [];
  for (const n of plan.nodes) out.push(await nodeKey(n, n.inputs.map((i) => out[i]!), { smaltdb: 'x', smaltfl: 'y' }, n.op === 'table' ? `content of ${n.table}` : undefined));
  return new Map(plan.nodes.map((n, i) => [n.origin, out[i]!]));
}
const sorted = (m: Map<string, string>) => [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

/** Larkspur read from disk with its own flow.json listing more flows: what adding a flow must come to. */
async function listing(more: unknown[]): Promise<FlowDocument> {
  const root = new URL('../examples/', import.meta.url);
  const files: FlowFiles = {
    json: async (p) => {
      const read = JSON.parse(readFileSync(new URL(p, root), 'utf8')) as { flows?: unknown[] };
      return p === 'larkspur/flow.json' ? { ...read, flows: [...(read.flows ?? []), ...more] } : read;
    },
    text: async (p) => readFileSync(new URL(p, root), 'utf8'),
  };
  return composeFlow('larkspur/flow.json', files, ts);
}

describe('a catalogue’s entry', () => {
  it('says what the flow gives, what it is built on and by which hashes', async () => {
    const [doc, own] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership'))]);
    const hash = await flowHash(own);
    const e = entryOf(own, pathOf('ownership'), hash);
    expect(e).toMatchObject({ id: 'ownership', name: 'Ownership', path: 'catalogue/ownership/flow.json', hash, gives: ['apps_by_unit', 'unowned_apps'], files: 0, steps: 2 });
    expect(e.description).toMatch(/^Who answers for what/);
    // It reads the four flows the applications are built on, each as the estate's flow reads it.
    expect(e.reads.map((r) => r.id).sort()).toEqual(['applications', 'feeds', 'hr', 'inventory']);
    for (const r of e.reads) expect(r.hash, r.id).toBe(doc.flows!.find((f) => f.id === r.id)!.hash);
    const certs = await loadFlowDir(catalogue('certificates'));
    expect(entryOf(certs, pathOf('certificates'), await flowHash(certs))).toMatchObject({ gives: ['certs_expiring', 'certs_by_issuer'], files: 0, steps: 2 });
  });
});

describe('a flow’s catalogue on disk', () => {
  it('is the flows in the catalogue folder beside its flow.json, each read as any flow is', async () => {
    const all = await readCatalogue('examples/larkspur/flow.json');
    expect(all.map((x) => [x.entry.id, x.entry.path, x.entry.gives])).toEqual([
      ['by_unit', 'catalogue/by_unit/flow.json', ['units', 'failing']],
      ['certificates', 'catalogue/certificates/flow.json', ['certs_expiring', 'certs_by_issuer']],
      ['ownership', 'catalogue/ownership/flow.json', ['apps_by_unit', 'unowned_apps']],
    ]);
    for (const { entry, doc } of all) expect(entry.hash, entry.id).toBe(await flowHash(doc));
    // Each can be added to the flow whose catalogue it is in: as it is, or, with open inputs, as a use.
    const doc = await loadFlowDir(larkspur);
    for (const x of all.filter((y) => !y.entry.inputs)) expect(addProblems(doc, x.doc), x.entry.id).toEqual([]);
    const kit = all.find((x) => x.entry.id === 'by_unit')!;
    expect(kit.entry.inputs!.map((i) => [i.id, i.columns])).toEqual([['feed', ['app_id', 'status', 'filled_from']], ['owners', ['app_id', 'name', 'business_unit_id', 'lifecycle']]]);
    expect(kit.entry.settings).toEqual([{ name: 'floor', type: 'real', default: 90, description: expect.stringMatching(/^The share of a unit’s applications that must pass/) }]);
    expect(kit.entry).toMatchObject({ files: 0, steps: 3, reads: [] });
    expect(addProblems(doc, kit.doc)).toEqual(['Control by unit has open inputs (feed and owners): it is added as a use, with a dataset mapped onto each']);
    // A flow with no such folder has none.
    expect(await readCatalogue('examples/control-estate/flow.json')).toEqual([]);
  });
});

describe('adding a flow from the catalogue', () => {
  it('makes the plan reading a flow that lists it gives, node for node, and lists the flow with what is its own', async () => {
    const [doc, own] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership'))]);
    expect(addProblems(doc, own)).toEqual([]);
    const hash = await flowHash(own);
    const added = addFlow(doc, own, pathOf('ownership'), hash);
    expect(validateDocument(added)).toEqual([]);
    expect(added.flows!.at(-1)).toEqual({ path: 'catalogue/ownership/flow.json', id: 'ownership', name: 'Ownership', description: own.description, hash, sources: [], steps: ['apps_by_unit', 'unowned_apps'], reads: ['hr', 'applications'], direct: true });
    expect(givesOf(added, 'ownership')).toEqual(['apps_by_unit', 'unowned_apps']);
    // Its notebook, by its path from the estate's folder, with its cells where the page finds them.
    expect(added.notebooks!.at(-1)!.path).toBe('catalogue/ownership/ownership.nb.ts');
    expect(added.cells!.apps_by_unit).toMatchObject({ notebook: 'catalogue/ownership/ownership.nb.ts', cell: 'apps_by_unit', lang: 'sql' });
    expect(added.outline!.at(-1)!.path).toBe('catalogue/ownership/ownership.nb.ts');
    // Its notebook's section is named for the path the document has it by, as every notebook's is.
    expect(added.groups!.at(-1)).toMatchObject({ id: notebookSectionId('catalogue/ownership/ownership.nb.ts'), steps: ['apps_by_unit', 'unowned_apps'] });
    // The same plan as reading the estate with the flow listed: every node by the key a run would give it.
    const read = await listing(['catalogue/ownership/flow.json']);
    const [a, b] = [await translate(added, day), await translate(read, day)];
    expect(a.nodes).toHaveLength(b.nodes.length);
    expect(sorted(await keys(a))).toEqual(sorted(await keys(b)));
    expect(a.outputs.map((o) => o.name).sort()).toEqual(b.outputs.map((o) => o.name).sort());
    // And two more nodes, two more outputs, than the estate alone.
    const alone = await translate(doc, day);
    expect([a.nodes.length - alone.nodes.length, a.outputs.length - alone.outputs.length]).toEqual([2, 2]);
    // What it describes of its own columns came with it; what the estate says stands once.
    expect(added.ontology!.properties!.filter((p) => p.column === 'internet_facing')).toHaveLength(1);
    expect(added.ontology!.objectTypes).toEqual(doc.ontology!.objectTypes);
    expect(added.ontology!.estate).toEqual(doc.ontology!.estate);
  });

  it('adds a second, and the two are the plan of the estate listing both', async () => {
    const [doc, ownership, certs] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership')), loadFlowDir(catalogue('certificates'))]);
    const one = addFlow(doc, ownership, pathOf('ownership'), await flowHash(ownership));
    expect(addProblems(one, certs)).toEqual([]);
    const two = addFlow(one, certs, pathOf('certificates'), await flowHash(certs));
    expect(validateDocument(two)).toEqual([]);
    const read = await listing(['catalogue/ownership/flow.json', 'catalogue/certificates/flow.json']);
    expect(sorted(await keys(await translate(two, day)))).toEqual(sorted(await keys(await translate(read, day))));
    // Each lists the flows it reads itself, in the order its own document has them.
    expect(two.flows!.slice(-2).map((f) => [f.id, f.reads])).toEqual([['ownership', ['hr', 'applications']], ['certificates', ['feeds']]]);
  });

  it('says why a flow can’t be added: read already, built on a flow not read here or read as another, names taken', async () => {
    const [doc, own, hr] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership')), loadFlowDir(new URL('hr/', larkspur))]);
    const added = addFlow(doc, own, pathOf('ownership'), await flowHash(own));
    expect(addProblems(added, own)).toEqual(['Ownership is read here already']);
    expect(addProblems(doc, doc)).toEqual(['Larkspur estate is this flow']);
    // HR reads none of what Ownership is built on.
    expect(addProblems(hr, own)).toEqual(own.flows!.map((f) => `Ownership is built on ${f.name}, which HR organisation doesn’t read`));
    // The estate reads another Applications than the one Ownership was made on.
    const other = { ...doc, flows: doc.flows!.map((f) => (f.id === 'applications' ? { ...f, hash: 'f'.repeat(64) } : f)) };
    const apps = own.flows!.find((f) => f.id === 'applications')!;
    expect(addProblems(other, own)).toEqual([`Ownership reads Applications as ${apps.hash.slice(0, 12)}…, and Larkspur estate reads it as ffffffffffff…: they aren’t the same Applications`]);
    // A name of its own that the flow uses already.
    const taken = { ...doc, steps: [...doc.steps, { ...own.steps.find((s) => s.id === 'unowned_apps')! }] };
    expect(addProblems(taken, own)).toEqual(['unowned_apps is a name Larkspur estate uses already: a name is one thing across a flow and the flows it reads']);
    // Another day, another calendar, policies of its own.
    expect(addProblems(doc, { ...own, calendar: { base: 'none' } as FlowDocument['calendar'] })).toEqual(['Ownership keeps another calendar than Larkspur estate']);
    expect(addProblems(doc, { ...own, publish: { ...own.publish!, together: true } })).toEqual(['Ownership pauses another way than Larkspur estate']);
    expect(addProblems(doc, { ...own, parameters: [{ name: 'month', type: 'text', default: null }] })).toEqual(['Ownership runs for a month, which Larkspur estate doesn’t have']);
  });

  it('is taken off again where nothing reads what it gives, and leaves the plan the flow had', async () => {
    const [doc, own] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership'))]);
    const added = addFlow(doc, own, pathOf('ownership'), await flowHash(own));
    expect(takeOffProblems(added, 'ownership')).toEqual([]);
    const back = takeOff(added, 'ownership');
    expect(validateDocument(back)).toEqual([]);
    expect(back.flows).toEqual(doc.flows);
    expect(back.steps.map((s) => s.id)).toEqual(doc.steps.map((s) => s.id));
    expect(back.notebooks!.map((n) => n.path)).toEqual(doc.notebooks!.map((n) => n.path));
    expect(Object.keys(back.cells!).sort()).toEqual(Object.keys(doc.cells!).sort());
    expect(sorted(await keys(await translate(back, day)))).toEqual(sorted(await keys(await translate(doc, day))));
    // A flow something reads stays: Applications reads the feeds.
    expect(takeOffProblems(doc, 'feeds').join(' ')).toMatch(/read what Evidence feeds gives/);
    expect(takeOffProblems(doc, 'nope')).toEqual(['nope isn’t a flow this one reads']);
  });
});

describe('a flow added and run (ADR 0025 §10)', () => {
  const PARAMS = [{ name: 'day', type: 'text', default: null }];
  const flow = (id: string, name: string, more: Record<string, unknown>) => ({ smaltfl: 4, id, name, parameters: PARAMS, ...more });
  const nb = (imports: string, body: string) => `import { cell, sql } from 'smaltnb';\nimport { check, publish, source } from 'smaltfl/notebook';\n${imports}\n${body}\n`;
  const GIVEN: Record<string, unknown> = {
    'orders/flow.json': flow('orders', 'Orders', { sources: [{ id: 'orders', table: 'orders_file' }], notebooks: ['orders.nb.ts'] }),
    'orders/orders.nb.ts': nb('', `
cell('orders');
export const orders = source('orders');

cell('orders_checked');
export const orders_checked = check(orders, { rules: [{ name: 'has_id', check: 'order_id IS NOT NULL', onFail: 'drop' }] });

cell('published');
publish(orders_checked);`),
    'flow.json': flow('sales', 'Sales', { flows: ['orders/flow.json'], sources: [{ id: 'customers', table: 'customers_file' }], notebooks: ['sales.nb.ts'] }),
    'sales.nb.ts': nb("import { orders_checked } from './orders/orders.nb.js';", `
cell('customers');
export const customers = source('customers');

cell('by_customer', { lang: 'sql' });
export const by_customer = sql\`SELECT c.name, count(*) AS n FROM \${orders_checked} o JOIN \${customers} c ON c.id = o.customer_id GROUP BY c.name\`;

cell('published');
publish(by_customer);`),
    // The catalogue's flow: built on Orders, with no file of its own.
    'catalogue/days/flow.json': flow('days', 'Order days', { flows: ['../../orders/flow.json'], sources: [], notebooks: ['days.nb.ts'] }),
    'catalogue/days/days.nb.ts': nb("import { orders_checked } from '../../orders/orders.nb.js';", `
cell('orders_by_day', { lang: 'sql' });
export const orders_by_day = sql\`SELECT day, count(*) AS n FROM \${orders_checked} GROUP BY day\`;

cell('published');
publish(orders_by_day);`),
  };
  const files: FlowFiles = {
    json: async (p) => {
      if (!(p in GIVEN)) throw new Error(`no file ${p}`);
      return structuredClone(GIVEN[p]);
    },
    text: async (p) => GIVEN[p] as string,
  };
  const read = (path = 'flow.json') => composeFlow(path, files, ts);

  it('builds what the added flow gives from the day’s run, names it in the manifest, and verifies', async () => {
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER); INSERT INTO orders_file VALUES (1,'2024-03-11',1),(2,'2024-03-11',2),(NULL,'2024-03-11',2),(3,'2024-03-12',1)");
    db.exec("CREATE TABLE customers_file(id INTEGER, name TEXT); INSERT INTO customers_file VALUES (1,'Aster'),(2,'Birch')");
    const [sales, orders, days] = await Promise.all([read(), read('orders/flow.json'), read('catalogue/days/flow.json')]);
    expect(addProblems(sales, days)).toEqual([]);
    const hash = await flowHash(days);
    const added = addFlow(sales, days, 'catalogue/days/flow.json', hash);
    expect(validateDocument(added)).toEqual([]);
    const r = await runFlow(db, added, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' }, flows: [orders, days] });
    expect(r.manifest.flow.reads).toEqual([['orders', await flowHash(orders)], ['days', hash]]);
    expect(db.query('SELECT day, n FROM orders_by_day ORDER BY day').rows).toEqual([['2024-03-11', 2], ['2024-03-12', 1]]);
    const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
    expect(v.checks.filter((c) => !c.ok)).toEqual([]);
    expect(v.checks.find((c) => c.check === 'flows')).toMatchObject({ ok: true });
  });
});

describe('Larkspur’s catalogue on days of the estate, through the engine', () => {
  const data = JSON.parse(readFileSync(new URL('data.json', larkspur), 'utf8')) as DataBindings;
  const estate = larkspurEstate({ apps: 650 });
  /** An engine with the estate's fixed files and a day's files pinned, every file's table declared. */
  const engineOn = async (on: string): Promise<Database> => {
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    for (const [name, t] of Object.entries(fixedFiles())) await pinFile(db, data.sources[name]!.file, utf8(csvOf(t.columns, t.rows)));
    for (const b of Object.values(data.sources)) await db.execAsync(pinnedDdl(b));
    for (const f of DAILY_FILES) {
      const t = dayFile(estate, f, on);
      const bytes = utf8(csvOf(t.columns, t.rows));
      await pinFile(db, data.sources[f]!.file, bytes, await sha256Hex(bytes));
    }
    return db;
  };
  /** The estate's flow with both catalogue flows added, and Certificates' own document. */
  const withBoth = async () => {
    const [doc, ownership, certs] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('ownership')), loadFlowDir(catalogue('certificates'))]);
    const one = addFlow(doc, ownership, pathOf('ownership'), await flowHash(ownership));
    return { doc, one, certs, both: addFlow(one, certs, pathOf('certificates'), await flowHash(certs)) };
  };
  const bare = (doc: FlowDocument): FlowDocument => {
    const out = { ...doc };
    delete out.publish;
    return out;
  };
  const rowsOf = async (db: Database, sql: string) => (await db.queryAsync(sql)).rows as unknown[][];
  const one = async (db: Database, sql: string) => Number((await rowsOf(db, sql))[0]![0]);

  it('builds what each gives on a day: the units’ applications and the certificates, counted against the day’s own', async () => {
    const on = '2024-03-12';
    const { both } = await withBoth();
    const db = await engineOn(on);
    const r = await runFlow(db, bare(both), { smaltdb: SMALTDB, parameters: { day: on } });
    for (const name of ['apps_by_unit', 'unowned_apps', 'certs_expiring', 'certs_by_issuer']) expect(r.published, name).toContain(name);

    // Ownership: every application that isn't retired is counted once, under its business unit.
    const units = await rowsOf(db, 'SELECT business_unit_id, business_unit, applications, internet_facing, tier_one FROM apps_by_unit');
    const sum = (i: number) => units.reduce((n, u) => n + Number(u[i]), 0);
    expect(units.length).toBeGreaterThan(5);
    expect(sum(2)).toBe(await one(db, "SELECT count(*) FROM app_owners WHERE lifecycle <> 'retired'"));
    // The tier is text in the CMDB's file: a count that compared it to a number would be none.
    expect(sum(4)).toBe(await one(db, "SELECT count(*) FROM apps WHERE tier = '1' AND lifecycle <> 'retired'"));
    expect(sum(4)).toBeGreaterThan(0);
    expect(sum(3)).toBe(await one(db, "SELECT count(*) FROM apps WHERE exposure = 'internet' AND lifecycle <> 'retired'"));
    expect(sum(3)).toBeGreaterThan(0);
    // A day that went out has nobody's applications: every unit has its name, and the list is empty.
    expect(units.map((u) => u[1])).not.toContain('Unassigned');
    expect(new Set(units.map((u) => u[0])).size).toBe(units.length);
    expect(await one(db, 'SELECT count(*) FROM unowned_apps')).toBe(0);

    // Certificates, against the day's TLS file read in JavaScript: the rows its check keeps, a blank no value.
    const tls = dayFile(estate, 'tls', on);
    const at = (name: string) => tls.columns.indexOf(name);
    const [app, issuer, protocol, after, status] = ['app_id', 'issuer', 'protocol', 'not_after', 'status'].map(at) as [number, number, number, number, number];
    const kept = tls.rows.filter((row) => ['pass', 'fail', 'not_assessed'].includes(String(row[status])) && (row[app] ?? '') !== '');
    const left = (row: unknown[]) => Math.round((Date.parse(`${String(row[after])}T00:00:00Z`) - Date.parse(`${on}T00:00:00Z`)) / 86_400_000);
    const soon = (row: unknown[]) => (row[after] ?? '') !== '' && left(row) >= 0 && left(row) <= 30;
    const expiring = kept.filter(soon);
    expect(expiring.length).toBeGreaterThan(0);
    const got = await rowsOf(db, 'SELECT app_id, not_after, days_left, filled_from FROM certs_expiring ORDER BY app_id');
    expect(got).toEqual(expiring.map((row) => [row[app], row[after], left(row), null]).sort((x, y) => (String(x[0]) < String(y[0]) ? -1 : 1)));
    const issuers = new Map<string, [number, number, number]>();
    for (const row of kept) {
      if ((row[issuer] ?? '') === '') continue;
      const n = issuers.get(String(row[issuer])) ?? [0, 0, 0];
      issuers.set(String(row[issuer]), [n[0] + 1, n[1] + (soon(row) ? 1 : 0), n[2] + (row[protocol] === 'TLS1.0' ? 1 : 0)]);
    }
    expect(issuers.size).toBeGreaterThan(1);
    expect(await rowsOf(db, 'SELECT issuer, certificates, expiring_soon, old_protocol, filled_from FROM certs_by_issuer ORDER BY issuer')).toEqual(
      [...issuers.entries()].sort(([x], [y]) => (x < y ? -1 : 1)).map(([name, n]) => [name, ...n, null]),
    );
    db.close();
  });

  it('refuses a flow built on a filled feed that doesn’t carry filled_from, naming the dataset', async () => {
    // Certificates reads the TLS feed, which a held day can fill from another day (ADR 0009 amendment 1): everything
    // built from it says which rows came from another day, or the run stops. A catalogue's flow is held to it too.
    const on = '2024-03-12';
    const { one, certs } = await withBoth();
    const unmarked: FlowDocument = { ...certs, steps: certs.steps.map((st) => (st.id === 'certs_by_issuer' && st.kind === 'sql' ? { ...st, sql: st.sql.replace(/,\s*max\(filled_from\) AS filled_from/, '') } : st)) };
    expect(unmarked.steps.find((st) => st.id === 'certs_by_issuer')).not.toEqual(certs.steps.find((st) => st.id === 'certs_by_issuer'));
    const added = addFlow(one, unmarked, pathOf('certificates'), await flowHash(unmarked));
    const db = await engineOn(on);
    await expect(runFlow(db, bare(added), { smaltdb: SMALTDB, parameters: { day: on } })).rejects.toThrow(/certs_by_issuer reads tls_filled and doesn't carry filled_from/);
    db.close();
  });

  it('adds a flow with open inputs as a use, twice: two flows named and hashed apart, each built from what is mapped onto it', async () => {
    const on = '2024-03-12';
    const [doc, kit] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(catalogue('by_unit'))]);
    const hash = await flowHash(kit);
    const use = async (spec: UseSpec) => {
      expect(useProblems(kit, spec), spec.as).toEqual([]);
      return useOf(kit, spec, hash, ts);
    };
    const tls = await use({ as: 'tls_by_unit', inputs: { feed: 'tls_checked', owners: 'app_owners' }, settings: {} });
    const waf = await use({ as: 'waf_by_unit', name: 'WAF by unit', inputs: { feed: 'waf_checked', owners: 'app_owners' }, settings: { floor: 99.5 } });
    expect([tls.name, waf.name]).toEqual(['Control by unit: tls_by_unit', 'WAF by unit']);
    expect(addProblems(doc, tls)).toEqual([]);
    expect(mapProblems(doc, tls.name, tls.use!)).toEqual([]);
    const first = addFlow(doc, tls, pathOf('by_unit'), await flowHash(tls));
    expect(addProblems(first, tls)).toEqual(['tls_by_unit is the name of a flow read here already: a use has a name of its own']);
    expect(addProblems(first, waf)).toEqual([]);
    const both = addFlow(first, waf, pathOf('by_unit'), await flowHash(waf));
    expect(validateDocument(both)).toEqual([]);
    // Two flows of the document, each a use of the one flow, reading the flows that give what it maps.
    const parts = both.flows!.slice(-2);
    expect(parts.map((f) => [f.id, f.path, f.reads, f.steps.length, f.use!.of.id, f.use!.settings.floor!.value])).toEqual([
      ['tls_by_unit', 'catalogue/by_unit/flow.json', ['feeds', 'applications'], 5, 'by_unit', 90],
      ['waf_by_unit', 'catalogue/by_unit/flow.json', ['feeds', 'applications'], 5, 'by_unit', 99.5],
    ]);
    expect(parts[0]!.hash).not.toBe(parts[1]!.hash);
    expect(parts.every((f) => f.use!.of.hash === hash)).toBe(true);
    expect(givesOf(both, 'waf_by_unit')).toEqual(['waf_by_unit_units', 'waf_by_unit_failing']);
    expect(both.notebooks!.slice(-2).map((n) => [n.path, n.use])).toEqual([['catalogue/by_unit/by_unit.nb.ts#tls_by_unit', 'tls_by_unit'], ['catalogue/by_unit/by_unit.nb.ts#waf_by_unit', 'waf_by_unit']]);
    // The same plan as reading the estate with the two uses listed in its own flow.json.
    const read = await listing([
      { path: 'catalogue/by_unit/flow.json', as: 'tls_by_unit', inputs: { feed: 'tls_checked', owners: 'app_owners' } },
      { path: 'catalogue/by_unit/flow.json', as: 'waf_by_unit', name: 'WAF by unit', inputs: { feed: 'waf_checked', owners: 'app_owners' }, settings: { floor: 99.5 } },
    ]);
    expect(read.flows!.slice(-2).map((f) => [f.id, f.hash, f.reads])).toEqual(parts.map((f) => [f.id, f.hash, f.reads]));
    expect(sorted(await keys(await translate(both, { day: on })))).toEqual(sorted(await keys(await translate(read, { day: on }))));

    // Through the engine: each use's units and failing applications, counted against the day's own.
    const db = await engineOn(on);
    const r = await runFlow(db, bare(both), { smaltdb: SMALTDB, parameters: { day: on }, flows: [...(await Promise.all(doc.flows!.map((f) => loadFlowDir(new URL(f.path.replace(/flow\.json$/, ''), larkspur))))), tls, waf] });
    expect(r.manifest.flow.reads!.slice(-2)).toEqual(parts.map((f) => [f.id, f.hash]));
    for (const [as, feed, floor] of [['tls_by_unit', 'tls_checked', 90], ['waf_by_unit', 'waf_checked', 99.5]] as const) {
      const judged = `SELECT o.business_unit_id AS unit, f.status AS status FROM ${feed} f JOIN app_owners o ON o.app_id = upper(trim(f.app_id)) WHERE o.lifecycle <> 'retired' AND f.status IN ('pass', 'fail')`;
      const want = await rowsOf(db, `SELECT unit, count(*), sum(CASE WHEN status = 'pass' THEN 1 ELSE 0 END), sum(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) FROM (${judged}) GROUP BY unit ORDER BY unit`);
      expect(want.length, as).toBeGreaterThan(5);
      const got = await rowsOf(db, `SELECT business_unit_id, applications, passing, failing, pass_share, behind, filled_from FROM ${as}_units ORDER BY business_unit_id`);
      expect(got.map((u) => u.slice(0, 4)), as).toEqual(want);
      for (const u of got) {
        const share = (100 * Number(u[2])) / Number(u[1]);
        expect(Number(u[4]), `${as} ${String(u[0])}`).toBeCloseTo(share, 1);
        expect(u[5], `${as} ${String(u[0])}`).toBe(share < floor ? 'yes' : 'no');
        expect(u[6]).toBeNull();
      }
      expect(await one(db, `SELECT count(*) FROM ${as}_failing`), as).toBe(want.reduce((n, u) => n + Number(u[3]), 0));
    }
    // The floor each use sets tells them apart: more units are behind a floor of 99.5 than the flow's own 90.
    expect(await one(db, "SELECT count(*) FROM waf_by_unit_units WHERE behind = 'yes'")).toBeGreaterThan(0);
    // The document holds each use's own document unchanged: what a verifier checks of every flow a run names.
    for (const own of [tls, waf]) expect(flowProblems(both, own), own.id).toEqual([]);
    // Taken off again, one at a time, the estate is as it was.
    const back = takeOff(takeOff(both, 'waf_by_unit'), 'tls_by_unit');
    expect(back.flows).toEqual(doc.flows);
    expect(back.steps.map((s) => s.id)).toEqual(doc.steps.map((s) => s.id));
    expect(back.ontology).toEqual(doc.ontology);
    // What can't be mapped is said before anything runs: a feed with no fill mark to give, a dataset that isn't here.
    const findings = await use({ as: 'findings_by_unit', inputs: { feed: 'findings_checked', owners: 'app_owners' }, settings: {} });
    expect(mapProblems(doc, findings.name, findings.use!, (d) => (d === 'findings_checked' ? ['app_id', 'severity', 'status'] : undefined))).toEqual(['findings_checked has no column filled_from, which Control by unit needs of its input feed']);
    const nowhere = await use({ as: 'x_by_unit', inputs: { feed: 'nowhere', owners: 'app_owners' }, settings: {} });
    expect(mapProblems(doc, nowhere.name, nowhere.use!)).toEqual(['Control by unit: x_by_unit maps feed onto nowhere, which isn’t a dataset of Larkspur estate']);
    db.close();
  });

  it('on a day Applications holds for applications nobody answers for, Ownership lists them', async () => {
    // A team is dissolved (ADR 0020 §5): its applications' chains stop short, and the owner chain's rule holds the day.
    // What the catalogue's flow gives is built from the same run and kept back with it: the list to work the day from.
    const on = LARKSPUR_SILVER.dissolve;
    const { both } = await withBoth();
    const db = await engineOn(on);
    const r = await runFlow(db, both, { smaltdb: SMALTDB, parameters: { day: on } });
    const hold = r.holds.find((h) => h.origin === 'app_owners' && h.by === 'checks');
    const nobodys = Number(/^expectations failed: owner_chain \((\d+) rows\)$/.exec(hold?.said ?? '')?.[1]);
    expect(nobodys).toBeGreaterThan(0);
    expect(r.published).not.toContain('unowned_apps');
    expect(r.waiting).toEqual(expect.arrayContaining(['apps_by_unit', 'unowned_apps']));
    const built = (name: string) => versionTable(r.manifest.outputs[name]!.key);
    expect(r.manifest.outputs.unowned_apps!.rows).toBe(nobodys);
    expect(await rowsOf(db, `SELECT business_unit, applications FROM ${built('apps_by_unit')} WHERE business_unit_id = 'UNASSIGNED'`)).toEqual([['Unassigned', nobodys]]);
    expect(await one(db, `SELECT count(*) FROM ${built('unowned_apps')} WHERE lifecycle = 'retired'`)).toBe(0);
    db.close();
  });
});
