/**
 * A flow reused a little differently (src/core/reuse.ts, ADR 0026 §11): its inputs and its settings are what a flow that
 * uses it may change. A flow declares open inputs and settings; a use names it, maps a dataset onto each input and gives
 * the settings a value; each use is a flow of the document, named and hashed apart. On a small estate where one flow is
 * used twice, read from files and run through the engine.
 */
import { describe, expect, it } from 'vitest';
import { composeAll, composeFlow, flowProblems, type FlowFiles } from '../src/core/compose.js';
import { usedName, usePath, validateDocument, type FlowDocument } from '../src/core/document.js';
import { emitPort } from '../src/core/emit.js';
import { levelDoc, flowCard } from '../src/core/levels.js';
import { notebookName, notebookSectionId } from '../src/core/notebook.js';
import { followersOf, pinProblem } from '../src/core/follow.js';
import { flowHash, translate } from '../src/core/plan.js';
import { flowUse, mapProblems, readsFill, renameOntology, useNames, useOf, useProblems, type UseSpec } from '../src/core/reuse.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const PARAMS = [{ name: 'day', type: 'text', default: null }];
const flow = <M extends Record<string, unknown>>(id: string, name: string, more: M) => ({ smaltfl: 4, id, name, parameters: PARAMS, ...more });

/** The flow reused: a tally of any dataset with a status and an amount. One open input, two settings. */
const TALLY = flow('tally', 'Tally', {
  description: 'Rows counted and summed by status, and the statuses whose total reaches a floor.',
  inputs: [{ id: 'rows', description: 'Anything with a status and an amount', columns: ['status', 'amount'] }],
  settings: [
    { name: 'floor', type: 'real', default: 10, description: 'The total a status must reach to be listed' },
    { name: 'label', type: 'text', default: 'all' },
  ],
  sources: [],
  notebooks: ['tally.nb.ts'],
  ontology: {
    objectTypes: [], linkTypes: [], actionTypes: [],
    properties: [{ column: 'total', title: 'Total', description: 'The amounts of the status, summed', datasets: ['by_status', 'big'] }],
    nouns: { by_status: { one: 'status', many: 'statuses' } },
  },
});
const TALLY_NB = `import { cell, md, param, sql } from 'smaltnb';
import { input, publish } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text(''), floor: param.number(10), label: param.text('all') });

cell('about_rows', { lang: 'md' });
md\`What is tallied: any dataset with a status and an amount.\`;

cell('rows');
export const rows = input('rows');

cell('by_status', { lang: 'sql' });
export const by_status = sql\`SELECT status, count(*) AS n, sum(amount) AS total, \${params.label} AS label FROM \${rows} GROUP BY status\`;

cell('big', { lang: 'sql' });
export const big = sql\`SELECT status, total FROM \${by_status} WHERE total >= \${params.floor}\`;

cell('published');
publish(by_status);
publish(big, { description: 'The statuses whose total reaches the floor' });
`;

const ORDERS = flow('orders', 'Orders', { sources: [{ id: 'orders', table: 'orders_file' }], notebooks: ['orders.nb.ts'] });
const ORDERS_NB = `import { cell } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';

cell('orders');
export const orders = source('orders');

cell('orders_checked');
export const orders_checked = check(orders, { rules: [{ name: 'has_id', check: 'order_id IS NOT NULL', onFail: 'drop' }] });

cell('published');
publish(orders_checked);
`;

/** Sales reads Orders, and uses Tally twice: on what Orders gives, with a floor of its own, and on a step of its own. */
const SALES = flow('sales', 'Sales', {
  flows: [
    'orders/flow.json',
    { path: 'kit/tally/flow.json', as: 'paid', inputs: { rows: 'orders_checked' }, settings: { floor: 25, label: 'paid' } },
    { path: 'kit/tally/flow.json', as: 'mine', name: 'My tally', inputs: { rows: 'recent' } },
  ],
  sources: [],
  notebooks: ['sales.nb.ts'],
});
const SALES_NB = `import { cell, param, sql } from 'smaltnb';
import { publish } from 'smaltfl/notebook';
import { orders_checked } from './orders/orders.nb.js';
import { big as paid_big } from './kit/tally/tally.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('recent', { lang: 'sql' });
export const recent = sql\`SELECT status, amount FROM \${orders_checked} WHERE day >= \${params.day}\`;

cell('paid_statuses', { lang: 'sql' });
export const paid_statuses = sql\`SELECT status FROM \${paid_big}\`;

cell('published');
publish(paid_statuses);
`;

const GIVEN: Record<string, unknown> = {
  'flow.json': SALES,
  'sales.nb.ts': SALES_NB,
  'orders/flow.json': ORDERS,
  'orders/orders.nb.ts': ORDERS_NB,
  'kit/tally/flow.json': TALLY,
  'kit/tally/tally.nb.ts': TALLY_NB,
};
const filesOf = (given: Record<string, unknown>): FlowFiles => ({
  json: async (p) => {
    if (!(p in given)) throw new Error(`no file ${p}`);
    return structuredClone(given[p]);
  },
  text: async (p) => given[p] as string,
});
const read = (given: Record<string, unknown> = GIVEN, path = 'flow.json') => composeFlow(path, filesOf(given), ts);
const refused = async (given: Record<string, unknown>, path = 'flow.json'): Promise<string> => read(given, path).then(() => 'read', (e: Error) => e.message);
const step = (doc: FlowDocument, id: string) => doc.steps.find((s) => s.id === id)!;
const sqlOf = (doc: FlowDocument, id: string) => {
  const s = step(doc, id);
  return s.kind === 'sql' ? s.sql : '';
};

describe('a flow with open inputs and settings', () => {
  it('reads on its own with its inputs open and its settings at their defaults, and has no plan alone', async () => {
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    expect(validateDocument(tally)).toEqual([]);
    expect(tally.inputs).toEqual(TALLY.inputs);
    expect(tally.steps.map((s) => [s.id, s.inputs])).toEqual([['by_status', ['rows']], ['big', ['by_status']]]);
    // A setting is written into the statement as its value: the default here, by its type.
    expect(sqlOf(tally, 'by_status')).toBe("SELECT status, count(*) AS n, sum(amount) AS total, 'all' AS label FROM rows GROUP BY status");
    expect(sqlOf(tally, 'big')).toBe('SELECT status, total FROM by_status WHERE total >= 10.0');
    expect(tally.outline![0]!.cells.find((c) => c.kind === 'input')).toMatchObject({ cell: 'rows', input: 'rows' });
    await expect(translate(tally, { day: '2024-03-11' })).rejects.toThrow(/Tally has an open input \(rows\): it runs inside a flow that uses it, which maps one of its own datasets onto each/);
  });

  it('refuses what an input or a setting can’t be', async () => {
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    const issues = (more: Partial<FlowDocument>) => validateDocument({ ...tally, ...more }).map((i) => `${i.path}: ${i.message}`);
    expect(issues({ inputs: [{ id: 'rows', columns: [] }] })[0]).toMatch(/^\$\.inputs\[0\]\.columns: the columns the flow needs of it/);
    expect(issues({ inputs: [{ id: 'rows', columns: ['status', 'Status'] }] })[0]).toMatch(/each once/);
    expect(issues({ inputs: [{ id: 'by_status', columns: ['status'] }] })[0]).toMatch(/duplicate id by_status/);
    expect(issues({ settings: [{ name: 'day', type: 'text', default: 'x' }] })[0]).toMatch(/day is a parameter of the flow: a name is a parameter, the same for every flow in a run, or a setting, each use’s own/);
    expect(issues({ settings: [{ name: 'floor', type: 'real', default: 'ten' as unknown as number }] })[0]).toMatch(/a setting has a default, a real/);
    expect(issues({ settings: [{ name: 'floor', type: 'integer', default: 1.5 }] })[0]).toMatch(/a setting has a default, a integer/);
    // An input the notebook binds must be one the document declares.
    const undeclared = await refused({ ...GIVEN, 'kit/tally/flow.json': { ...TALLY, inputs: [{ id: 'lines', columns: ['status'] }] } }, 'kit/tally/flow.json');
    expect(undeclared).toMatch(/input\(\) names an open input of the flow, and rows isn't one \(inputs: lines\)/);
  });
});

describe('a flow used twice (ADR 0026 §11)', () => {
  it('is two flows of the document: each named after its use, with its own steps', async () => {
    const doc = await read();
    expect(validateDocument(doc)).toEqual([]);
    expect(doc.flows!.map((f) => [f.id, f.name, f.path, f.direct, f.reads, f.steps])).toEqual([
      ['orders', 'Orders', 'orders/flow.json', true, [], ['orders_checked']],
      ['paid', 'Tally: paid', 'kit/tally/flow.json', true, ['orders'], ['paid_rows', 'paid_by_status', 'paid_big']],
      // Mapped onto a step of the flow that lists it: its to map, and no flow the use reads.
      ['mine', 'My tally', 'kit/tally/flow.json', true, [], ['mine_rows', 'mine_by_status', 'mine_big']],
    ]);
    // An input is a step that reads the columns the flow needs of the dataset mapped onto it, and no other.
    expect(step(doc, 'paid_rows')).toMatchObject({ kind: 'sql', inputs: ['orders_checked'], sql: 'SELECT "status", "amount"\nFROM orders_checked', description: 'What is tallied: any dataset with a status and an amount.' });
    expect(sqlOf(doc, 'paid_rows')).toBe(emitPort(['status', 'amount'], 'orders_checked', (d) => d));
    expect(step(doc, 'mine_rows')).toMatchObject({ inputs: ['recent'], sql: 'SELECT "status", "amount"\nFROM recent' });
    expect(step(doc, 'paid_rows').dataset).toBeUndefined();
    // The flow's steps are as written, under each use's names, with each use's settings.
    expect(sqlOf(doc, 'paid_by_status')).toBe("SELECT status, count(*) AS n, sum(amount) AS total, 'paid' AS label FROM paid_rows GROUP BY status");
    expect(sqlOf(doc, 'paid_big')).toBe('SELECT status, total FROM paid_by_status WHERE total >= 25.0');
    expect(sqlOf(doc, 'mine_by_status')).toBe("SELECT status, count(*) AS n, sum(amount) AS total, 'all' AS label FROM mine_rows GROUP BY status");
    expect(sqlOf(doc, 'mine_big')).toBe('SELECT status, total FROM mine_by_status WHERE total >= 10.0');
    expect(step(doc, 'paid_big').dataset).toEqual({ description: 'The statuses whose total reaches the floor' });
    // The flow that uses it reads what a use gives under the name it has here.
    expect(step(doc, 'paid_statuses')).toMatchObject({ inputs: ['paid_big'], sql: 'SELECT status FROM paid_big' });
  });

  it('says of each use what it is a use of, what it maps and what it sets', async () => {
    const doc = await read();
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    const of = { id: 'tally', name: 'Tally', hash: await flowHash(tally) };
    const [paid, mine] = [doc.flows!.find((f) => f.id === 'paid')!, doc.flows!.find((f) => f.id === 'mine')!];
    expect(paid.use).toEqual({
      of,
      inputs: { rows: { to: 'orders_checked', columns: ['status', 'amount'] } },
      settings: { floor: { type: 'real', value: 25, default: 10 }, label: { type: 'text', value: 'paid', default: 'all' } },
    });
    expect(mine.use).toEqual({
      of,
      inputs: { rows: { to: 'recent', columns: ['status', 'amount'] } },
      settings: { floor: { type: 'real', value: 10, default: 10 }, label: { type: 'text', value: 'all', default: 'all' } },
    });
    // Named and hashed apart: two names, two hashes, one flow used.
    expect(paid.hash).not.toBe(mine.hash);
    expect(paid.hash).not.toBe(of.hash);
    expect(paid.description).toBe(TALLY.description);
  });

  it('reads the used flow’s notebook once for each use, as a box of its own', async () => {
    const doc = await read();
    const paths = doc.notebooks!.map((n) => [n.path, n.use ?? null]);
    expect(paths).toEqual([['orders/orders.nb.ts', null], ['kit/tally/tally.nb.ts#paid', 'paid'], ['kit/tally/tally.nb.ts#mine', 'mine'], ['sales.nb.ts', null]]);
    expect(usePath('kit/tally/tally.nb.ts', 'paid')).toBe('kit/tally/tally.nb.ts#paid');
    expect(doc.notebooks![1]!.source).toBe(TALLY_NB);
    expect(doc.cells!.paid_big).toMatchObject({ notebook: 'kit/tally/tally.nb.ts#paid', cell: 'big', lang: 'sql' });
    expect(doc.cells!.paid_rows).toMatchObject({ notebook: 'kit/tally/tally.nb.ts#paid', cell: 'rows' });
    const outline = doc.outline!.find((o) => o.path === 'kit/tally/tally.nb.ts#mine')!;
    expect(outline.cells.filter((c) => c.kind === 'input' || c.kind === 'step').map((c) => [c.cell, c.kind, c.step])).toEqual([['rows', 'input', 'mine_rows'], ['by_status', 'step', 'mine_by_status'], ['big', 'step', 'mine_big']]);
    expect(outline.cells.find((c) => c.kind === 'publish')).toMatchObject({ publishes: ['by_status', 'big'] });
    // A section a use, named as the notebook's file is.
    expect(notebookSectionId('kit/tally/tally.nb.ts#paid')).toBe('nb-kit_tally_tally_paid');
    expect(notebookSectionId('kit/tally/tally.nb.ts')).toBe('nb-kit_tally_tally');
    expect(notebookName('kit/tally/tally.nb.ts#paid')).toBe('Tally');
    expect(doc.groups!.map((g) => [g.id, g.steps])).toEqual([
      ['nb-orders_orders', ['orders_checked']],
      ['nb-kit_tally_tally_paid', ['paid_rows', 'paid_by_status', 'paid_big']],
      ['nb-kit_tally_tally_mine', ['mine_rows', 'mine_by_status', 'mine_big']],
      ['nb-sales', ['recent', 'paid_statuses']],
    ]);
  });

  it('says what the used flow’s ontology says, of each use’s datasets', async () => {
    const doc = await read();
    expect(doc.ontology!.properties).toEqual([
      { column: 'total', title: 'Total', description: 'The amounts of the status, summed', datasets: ['paid_by_status', 'paid_big'] },
      { column: 'total', title: 'Total', description: 'The amounts of the status, summed', datasets: ['mine_by_status', 'mine_big'] },
    ]);
    expect(doc.ontology!.nouns).toEqual({ paid_by_status: { one: 'status', many: 'statuses' }, mine_by_status: { one: 'status', many: 'statuses' } });
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    expect([...useNames(tally, 'paid')]).toEqual([['by_status', 'paid_by_status'], ['big', 'paid_big'], ['rows', 'paid_rows']]);
    expect(renameOntology(undefined, useNames(tally, 'paid'))).toBeUndefined();
    expect(usedName('paid', 'big')).toBe('paid_big');
  });

  it('gives each use an own document, which the reading document holds unchanged and names by its hash', async () => {
    const { doc, owns } = await composeAll('flow.json', filesOf(GIVEN), ts);
    expect(owns.map((o) => o.id)).toEqual(doc.flows!.map((f) => f.id));
    for (const [k, own] of owns.entries()) {
      expect(await flowHash(own), own.id).toBe(doc.flows![k]!.hash);
      expect(flowProblems(doc, own), own.id).toEqual([]);
    }
    const paid = owns[1]!;
    expect(paid).toMatchObject({ id: 'paid', name: 'Tally: paid', sources: [], use: doc.flows![1]!.use });
    expect(paid.inputs).toBeUndefined();
    expect(paid.settings).toBeUndefined();
    expect(paid.steps.map((s) => s.id)).toEqual(['paid_rows', 'paid_by_status', 'paid_big']);
    expect(paid.notebooks).toEqual([{ path: 'tally.nb.ts#paid', source: TALLY_NB, use: 'paid' }]);
    // It reads a dataset it doesn't hold: valid as a document, and never a plan of its own.
    expect(validateDocument(paid)).toEqual([]);
    await expect(translate(paid, { day: '2024-03-11' })).rejects.toThrow(/Tally: paid is a use of Tally: it runs inside the flow that uses it/);
    // The same document from the used flow and what the use says, wherever it is made.
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    const spec: UseSpec = { as: 'paid', inputs: { rows: 'orders_checked' }, settings: { floor: 25, label: 'paid' } };
    expect(await flowHash(await useOf(tally, spec, await flowHash(tally), ts))).toBe(doc.flows![1]!.hash);
    // A change to the used flow moves every use of it: the use holds the flow's hash.
    const changed = { ...GIVEN, 'kit/tally/tally.nb.ts': TALLY_NB.replace('count(*) AS n', 'count(*) AS rows_counted') };
    const after = await read(changed);
    expect(after.flows!.filter((f) => f.use).every((f, k) => f.hash !== doc.flows!.filter((x) => x.use)[k]!.hash)).toBe(true);
    expect(after.flows![0]!.hash).toBe(doc.flows![0]!.hash);
  });

  it('runs: each use built from the dataset mapped onto it, named in the manifest, and verified', async () => {
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER, amount REAL, status TEXT); INSERT INTO orders_file VALUES (1,'2024-03-10',1,20.0,'paid'),(2,'2024-03-11',2,8.0,'paid'),(3,'2024-03-11',2,4.0,'open'),(NULL,'2024-03-11',2,99.0,'open'),(4,'2024-03-12',1,7.0,'open')");
    const { doc, owns } = await composeAll('flow.json', filesOf(GIVEN), ts);
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' }, flows: owns });
    expect(r.manifest.flow.reads).toEqual(doc.flows!.map((f) => [f.id, f.hash]));
    expect(r.published.sort()).toEqual(['mine_big', 'mine_by_status', 'orders_checked', 'paid_big', 'paid_by_status', 'paid_statuses']);
    // paid: every checked order, a floor of 25. paid is 28, open is 11.
    expect(db.query('SELECT status, n, total, label FROM paid_by_status ORDER BY status').rows).toEqual([['open', 2, 11, 'paid'], ['paid', 2, 28, 'paid']]);
    expect(db.query('SELECT status, total FROM paid_big').rows).toEqual([['paid', 28]]);
    // mine: the orders from the day on, the flow's own floor of 10. open is 11, paid is 8.
    expect(db.query('SELECT status, n, total, label FROM mine_by_status ORDER BY status').rows).toEqual([['open', 2, 11, 'all'], ['paid', 1, 8, 'all']]);
    expect(db.query('SELECT status, total FROM mine_big').rows).toEqual([['open', 11]]);
    expect(db.query('SELECT status FROM paid_statuses').rows).toEqual([['paid']]);
    const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
    expect(v.checks.filter((c) => !c.ok)).toEqual([]);
    expect(v.checks.find((c) => c.check === 'flows')).toMatchObject({ ok: true });
  });

  it('stops at the input, by name, where the dataset mapped lacks a column the flow needs', async () => {
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER, amount REAL, status TEXT); INSERT INTO orders_file VALUES (1,'2024-03-10',1,20.0,'paid')");
    // recent no longer carries the amount: the use mapped onto it can't read what Tally needs.
    const { doc, owns } = await composeAll('flow.json', filesOf({ ...GIVEN, 'sales.nb.ts': SALES_NB.replace('SELECT status, amount FROM', 'SELECT status FROM') }), ts);
    await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' }, flows: owns })).rejects.toThrow(/mine_rows/);
    // Where the columns are known beforehand, it is said before anything runs.
    const mine = doc.flows!.find((f) => f.id === 'mine')!;
    expect(mapProblems(doc, mine.name, mine.use!, (d) => (d === 'recent' ? ['status'] : undefined))).toEqual(['recent has no column amount, which Tally needs of its input rows']);
    expect(mapProblems(doc, mine.name, mine.use!, (d) => (d === 'recent' ? ['STATUS', 'Amount'] : undefined))).toEqual([]);
  });

  it('draws each use as a card on the canvas of the flow that lists it, joined to what is mapped and to what reads it', async () => {
    const doc = await read();
    const top = levelDoc(doc);
    const inputsOf = (d: FlowDocument, id: string) => d.steps.find((s) => s.id === id)!.inputs;
    expect(top.steps.map((s) => s.id)).toEqual([flowCard('orders'), flowCard('paid'), flowCard('mine'), 'recent', 'paid_statuses']);
    expect(inputsOf(top, flowCard('paid'))).toEqual([flowCard('orders')]);
    expect(inputsOf(top, flowCard('mine'))).toEqual(['recent']);
    expect(inputsOf(top, 'paid_statuses')).toEqual([flowCard('paid')]);
    // Inside a use: its own steps, and the flow that gives what is mapped onto its input as a card.
    const inside = levelDoc(doc, 'paid');
    expect(inside.steps.map((s) => s.id)).toEqual([flowCard('orders'), 'paid_rows', 'paid_by_status', 'paid_big']);
    expect(inputsOf(inside, 'paid_rows')).toEqual([flowCard('orders')]);
    // A dataset of the listing flow's own mapped onto an input is there as itself, with nothing drawn behind it.
    expect(levelDoc(doc, 'mine').steps.map((s) => [s.id, s.inputs])).toEqual([['recent', []], ['mine_rows', ['recent']], ['mine_by_status', ['mine_rows']], ['mine_big', ['mine_by_status']]]);
    expect(levelDoc(doc, 'mine').groups!.flatMap((g) => g.steps)).not.toContain('recent');
  });
});

describe('what a use can’t be', () => {
  const sales = (flows: unknown[], nb = SALES_NB) => ({ ...GIVEN, 'flow.json': { ...SALES, flows }, 'sales.nb.ts': nb });
  const use = (more: Record<string, unknown>) => ({ path: 'kit/tally/flow.json', as: 'paid', inputs: { rows: 'orders_checked' }, ...more });
  const NO_USES = SALES_NB.replace("import { big as paid_big } from './kit/tally/tally.nb.js';\n", '').replace(/cell\('paid_statuses'[\s\S]*?`;\n\n/, '').replace('publish(paid_statuses);', 'publish(recent);');

  it('says why, in a sentence', async () => {
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    const spec = (more: Partial<UseSpec>): UseSpec => ({ as: 'paid', inputs: { rows: 'orders_checked' }, settings: {}, ...more });
    expect(useProblems(tally, spec({}))).toEqual([]);
    expect(useProblems(tally, spec({ as: 'Paid Orders' }))).toEqual(['A use is named in lower-case letters, digits and underscores, a letter first, 32 at most: Paid Orders isn’t']);
    expect(useProblems(tally, spec({ inputs: {} }))).toEqual(['Tally’s input rows has no dataset mapped onto it']);
    expect(useProblems(tally, spec({ inputs: { rows: 'orders_checked', lines: 'orders_checked' } }))).toEqual(['Tally has no input called lines (its inputs: rows)']);
    expect(useProblems(tally, spec({ settings: { ceiling: 3 } }))).toEqual(['Tally has no setting called ceiling (its settings: floor and label)']);
    expect(useProblems(tally, spec({ settings: { floor: 'high' } }))).toEqual(['Tally’s setting floor is a number: "high" isn’t']);
    expect(useProblems(tally, spec({ settings: { label: 4 } }))).toEqual(['Tally’s setting label is text: 4 isn’t']);
    expect(useProblems(tally, spec({ as: 'a_use_with_a_name_of_thirty_two_c' }))[0]).toMatch(/32 at most/);
    expect(flowUse(tally, spec({ settings: { floor: 25 } }), 'f'.repeat(64)).settings.floor).toEqual({ type: 'real', value: 25, default: 10 });
  });

  it('is refused where it is read', async () => {
    expect(await refused(sales(['orders/flow.json', use({ as: 'Paid' })], NO_USES))).toMatch(/Sales uses Tally as Paid: A use is named in lower-case letters/);
    expect(await refused(sales(['orders/flow.json', use({ inputs: {} })], NO_USES))).toMatch(/Sales uses Tally as paid: Tally’s input rows has no dataset mapped onto it/);
    expect(await refused(sales(['orders/flow.json', use({}), use({ inputs: { rows: 'recent' } })], NO_USES))).toMatch(/two flows are used as paid: a use has a name of its own/);
    expect(await refused(sales(['orders/flow.json', use({ as: 'orders' })], NO_USES))).toMatch(/are both called orders: each flow has its own id/);
    expect(await refused(sales(['orders/flow.json', use({ inputs: { rows: 'nowhere' } })], NO_USES))).toMatch(/Tally: paid maps rows onto nowhere, which isn’t a dataset of Sales/);
    // A flow with an open input listed as any flow is.
    expect(await refused(sales(['orders/flow.json', 'kit/tally/flow.json'], NO_USES))).toMatch(/Tally has an open input \(rows\): use it under a name, as \{ path, as, inputs \}, with a dataset mapped onto it/);
    // A use without a name isn't one.
    expect(await refused(sales(['orders/flow.json', { path: 'kit/tally/flow.json', inputs: { rows: 'orders_checked' } }], NO_USES))).toMatch(/flows is a list of the flows this one reads/);
    // What a flow doesn't publish isn't another flow's to be mapped onto a use.
    const hidden = { ...sales(['orders/flow.json', use({ inputs: { rows: 'orders_kept' } })], NO_USES), 'orders/orders.nb.ts': ORDERS_NB.replace("cell('published');", "cell('orders_kept', { lang: 'sql' });\nexport const orders_kept = sql`SELECT status, amount FROM ${orders_checked}`;\n\ncell('published');").replace("import { cell } from 'smaltnb';", "import { cell, sql } from 'smaltnb';") };
    expect(await refused(hidden)).toMatch(/paid_rows reads orders_kept, a step of Orders that it doesn't publish/);
    // A pin on a use is of the flow used.
    const tally = await read(GIVEN, 'kit/tally/flow.json');
    const pinned = await read(sales(['orders/flow.json', use({ hash: await flowHash(tally) })], NO_USES));
    expect(pinned.flows!.find((f) => f.id === 'paid')!.pin).toEqual(['']);
    expect(await refused(sales(['orders/flow.json', use({ hash: 'a'.repeat(64) })], NO_USES))).toMatch(/Sales pins Tally at a{64}, and kit\/tally\/flow\.json is [0-9a-f]{64} now/);
  });

  it('is of a flow this slice reads under a name: no files, flows or watches of its own, and an ontology of its own datasets', async () => {
    const tallyWith = (more: Record<string, unknown>, nb = TALLY_NB) => ({ ...sales(['orders/flow.json', use({})], NO_USES), 'kit/tally/flow.json': { ...TALLY, ...more }, 'kit/tally/tally.nb.ts': nb });
    const withFile = tallyWith({ sources: [{ id: 'extra', table: 'extra_file' }] }, TALLY_NB.replace("import { input, publish } from 'smaltfl/notebook';", "import { input, publish, source } from 'smaltfl/notebook';").replace("cell('rows');", "cell('extra');\nexport const extra = source('extra');\n\ncell('rows');"));
    expect(await refused(withFile)).toMatch(/Tally has a file of its own \(extra\): a flow used under a name reads what is mapped onto its inputs/);
    expect(await refused(tallyWith({ flows: ['../../orders/flow.json'] }))).toMatch(/Tally reads other flows \(Orders\)/);
    expect(await refused(tallyWith({ ontology: { ...TALLY.ontology, properties: [{ column: 'total', title: 'Total', description: 'Summed' }] } }))).toMatch(/Tally says what total means without saying in which of its datasets/);
    expect(await refused(tallyWith({ ontology: { ...TALLY.ontology, objectTypes: [{ id: 'status', name: 'Status', dataset: 'by_status', key: ['status'], title: 'status' }] } }))).toMatch(/Tally says object types of its own: a flow used under a name says what its columns mean/);
  });

  it('carries the fill mark where it is mapped onto a feed a held day can fill', async () => {
    // Orders' file can be filled from another day: everything built from it says which rows came from another day.
    const filled = ORDERS_NB.replace("import { check, publish, source } from 'smaltfl/notebook';", "import { check, fill, publish, source } from 'smaltfl/notebook';")
      .replace("cell('orders_checked');\nexport const orders_checked = check(orders,", "cell('orders_filled');\nexport const orders_filled = fill(orders, {});\n\ncell('orders_checked');\nexport const orders_checked = check(orders_filled,");
    const given = { ...sales(['orders/flow.json', use({})], NO_USES.replace('SELECT status, amount FROM', 'SELECT status, amount, filled_from FROM')), 'orders/orders.nb.ts': filled };
    expect(await refused(given)).toMatch(/orders_checked is built from a feed a held day can fill from another day, and Tally’s input rows doesn’t take filled_from: what Tally: paid gives couldn’t say which rows came from another day/);
    // A flow that takes the mark and carries it is mapped onto it.
    const marked = { ...given,
      'kit/tally/flow.json': { ...TALLY, inputs: [{ id: 'rows', columns: ['status', 'amount', 'filled_from'] }] },
      'kit/tally/tally.nb.ts': TALLY_NB.replace('${params.label} AS label FROM', '${params.label} AS label, max(filled_from) AS filled_from FROM').replace('SELECT status, total FROM ${by_status}', 'SELECT status, total, filled_from FROM ${by_status}'),
    };
    const doc = await read(marked);
    expect(readsFill(doc, 'paid_big')).toBe(true);
    expect(readsFill(doc, 'orders')).toBe(false);
    expect(sqlOf(doc, 'paid_rows')).toBe('SELECT "status", "amount", "filled_from"\nFROM orders_checked');
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER, amount REAL, status TEXT); INSERT INTO orders_file VALUES (1,'2024-03-11',1,30.0,'paid')");
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' } });
    expect(r.published).toContain('paid_big');
    expect(db.query('SELECT status, total, filled_from FROM paid_big').rows).toEqual([['paid', 30, null]]);
  });
});

describe('a flow with settings and a file of its own', () => {
  const given: Record<string, unknown> = {
    'flow.json': flow('orders', 'Orders', { sources: [{ id: 'orders', table: 'orders_file' }], settings: [{ name: 'least', type: 'integer', default: 5 }], notebooks: ['orders.nb.ts'] }),
    'orders.nb.ts': `import { cell, param, sql } from 'smaltnb';
import { publish, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text(''), least: param.number(5) });

cell('orders');
export const orders = source('orders');

cell('sizeable', { lang: 'sql' });
export const sizeable = sql\`SELECT order_id, amount FROM \${orders} WHERE amount >= \${params.least} AND day = \${params.day}\`;

cell('published');
publish(sizeable);
`,
  };

  it('runs as it is, with its settings at their defaults: a setting is a value in the statement, a parameter the run’s', async () => {
    const doc = await read(given);
    expect(validateDocument(doc)).toEqual([]);
    expect(sqlOf(doc, 'sizeable')).toBe('SELECT order_id, amount FROM orders WHERE amount >= 5 AND day = :day');
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, amount REAL); INSERT INTO orders_file VALUES (1,'2024-03-11',20.0),(2,'2024-03-11',4.0),(3,'2024-03-12',9.0)");
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' } });
    expect(r.manifest.parameters).toEqual({ day: '2024-03-11' });
    expect(db.query('SELECT order_id FROM sizeable').rows).toEqual([[1]]);
    // Read by another flow as it is, it is the same flow: a use under a name is for a flow with no file of its own.
    const reader = { ...given, 'orders/flow.json': given['flow.json'], 'orders/orders.nb.ts': given['orders.nb.ts'],
      'flow.json': flow('sales', 'Sales', { flows: [{ path: 'orders/flow.json', as: 'big', settings: { least: 10 } }], sources: [], notebooks: ['sales.nb.ts'] }),
      'sales.nb.ts': "import { cell } from 'smaltnb';\n" };
    expect(await refused(reader)).toMatch(/Sales uses Orders as big: Orders has a file of its own \(orders\): a flow used under a name reads what is mapped onto its inputs/);
  });
});

describe('a rule isn’t changed on a use (ADR 0026 §11)', () => {
  it('is refused, saying whose its checks and steps are', async () => {
    const doc = await read();
    const nameOf = (id: string) => (id === '' ? doc.name : doc.flows!.find((f) => f.id === id)!.name);
    expect(pinProblem(doc, ['paid'], nameOf)).toBe('Tally: paid is a use of Tally: a use changes its inputs and its settings, and its checks and steps stay as Tally wrote them. Change Tally where it is written, and every use of it follows.');
    // A change of the flow that gives what a use is mapped onto is that flow's: the use follows it.
    expect(pinProblem(doc, ['orders'], nameOf)).toBeNull();
    expect(followersOf(doc, ['orders'])).toEqual(['paid', '']);
  });
});

describe('a flow that uses a flow, read by another (ADR 0026 §11)', () => {
  // Orders uses Tally on its own checked orders; Sales reads Orders, and what its use gives.
  const given: Record<string, unknown> = {
    ...GIVEN,
    'orders/flow.json': { ...ORDERS, flows: [{ path: '../kit/tally/flow.json', as: 'order_tally', inputs: { rows: 'orders_checked' } }] },
    'flow.json': { ...SALES, flows: ['orders/flow.json'] },
    'sales.nb.ts': `import { cell, sql } from 'smaltnb';
import { publish } from 'smaltfl/notebook';
import { big as order_tally_big } from './kit/tally/tally.nb.js';

cell('top', { lang: 'sql' });
export const top = sql\`SELECT status FROM \${order_tally_big}\`;

cell('published');
publish(top);
`,
  };

  it('lists the use before the flow that lists it, which reads it, and lets the reader read what the use gives', async () => {
    const orders = await read(given, 'orders/flow.json');
    expect(orders.flows!.map((f) => [f.id, f.direct, f.reads, f.path])).toEqual([['order_tally', true, [], '../kit/tally/flow.json']]);
    expect(orders.notebooks!.map((n) => n.path)).toEqual(['../kit/tally/tally.nb.ts#order_tally', 'orders.nb.ts']);
    const refusedAs = await refused(given);
    // Sales reads Orders, not its use: what Orders' use gives is read through Orders only where Orders lists it.
    expect(refusedAs).toMatch(/top reads order_tally_big, which is Tally: order_tally's, and Sales doesn't list Tally: order_tally among the flows it reads/);
  });

  it('maps only what the flow that lists it may read: its own, or what a flow it lists gives', async () => {
    // Orders' use mapped onto a step of Sales, the flow that reads Orders: a flow doesn't read back out of its reader.
    const back = { ...given,
      'orders/flow.json': { ...ORDERS, flows: [{ path: '../kit/tally/flow.json', as: 'order_tally', inputs: { rows: 'recent' } }] },
      'sales.nb.ts': SALES_NB.replace("import { big as paid_big } from './kit/tally/tally.nb.js';\n", '').replace(/cell\('paid_statuses'[\s\S]*?`;\n\n/, '').replace('publish(paid_statuses);', 'publish(recent);') };
    // Orders is read as its own folder gives it first, and there it has no such dataset at all.
    expect(await refused(back)).toMatch(/orders\/flow\.json: Tally: order_tally maps rows onto recent, which isn’t a dataset of Orders/);
    expect(await refused(back, 'orders/flow.json')).toMatch(/Tally: order_tally maps rows onto recent, which isn’t a dataset of Orders/);
    // A document that says so all the same is refused where it is checked.
    const reader = await read({ ...given, 'sales.nb.ts': back['sales.nb.ts'] });
    const mapped = { ...reader, flows: reader.flows!.map((f) => (f.use ? { ...f, use: { ...f.use, inputs: { rows: { ...f.use.inputs.rows!, to: 'recent' } } } } : f)) };
    expect(validateDocument(mapped).map((i) => i.message)).toContain("Tally: order_tally maps rows onto recent, which is Sales's: a flow reads the flows it lists, not the flow that reads it");
    // A flow two flows down: Reports reads Sales, which reads Orders. Reports' use of Tally can't be mapped onto what
    // Orders gives until Reports lists Orders itself.
    const deep: Record<string, unknown> = {
      'kit/tally/flow.json': TALLY, 'kit/tally/tally.nb.ts': TALLY_NB,
      'orders/flow.json': ORDERS, 'orders/orders.nb.ts': ORDERS_NB,
      'sales/flow.json': { ...SALES, flows: ['../orders/flow.json'] },
      'sales/sales.nb.ts': `import { cell, sql } from 'smaltnb';\nimport { publish } from 'smaltfl/notebook';\nimport { orders_checked } from '../orders/orders.nb.js';\n\ncell('open_orders', { lang: 'sql' });\nexport const open_orders = sql\`SELECT status, amount FROM \${orders_checked} WHERE status = 'open'\`;\n\ncell('published');\npublish(open_orders);\n`,
      'flow.json': flow('reports', 'Reports', { flows: ['sales/flow.json', { path: 'kit/tally/flow.json', as: 'all_orders', inputs: { rows: 'orders_checked' } }], sources: [], notebooks: ['reports.nb.ts'] }),
      'reports.nb.ts': "import { cell } from 'smaltnb';\n",
    };
    expect(await refused(deep)).toMatch(/Tally: all_orders maps rows onto orders_checked, which is Orders's, and Reports doesn't list Orders among the flows it reads/);
    const listed = { ...deep, 'flow.json': { ...(deep['flow.json'] as object), flows: ['sales/flow.json', 'orders/flow.json', { path: 'kit/tally/flow.json', as: 'all_orders', inputs: { rows: 'orders_checked' } }] } };
    const doc = await read(listed);
    expect(doc.flows!.map((f) => [f.id, f.direct, f.reads])).toEqual([['orders', true, []], ['sales', true, ['orders']], ['all_orders', true, ['orders']]]);
    // What Sales gives is Reports' to map: it lists Sales.
    const onSales = { ...deep, 'flow.json': { ...(deep['flow.json'] as object), flows: ['sales/flow.json', { path: 'kit/tally/flow.json', as: 'open_tally', inputs: { rows: 'open_orders' } }] } };
    expect((await read(onSales)).flows!.find((f) => f.id === 'open_tally')!.reads).toEqual(['sales']);
  });

  it('is in the reader’s document as Orders’ own use, a flow down', async () => {
    const reader = { ...given, 'sales.nb.ts': SALES_NB.replace("import { big as paid_big } from './kit/tally/tally.nb.js';\n", '').replace(/cell\('paid_statuses'[\s\S]*?`;\n\n/, '').replace('publish(paid_statuses);', 'publish(recent);') };
    const { doc, owns } = await composeAll('flow.json', filesOf(reader), ts);
    expect(validateDocument(doc)).toEqual([]);
    expect(doc.flows!.map((f) => [f.id, f.direct, f.reads, f.path])).toEqual([['order_tally', false, [], 'kit/tally/flow.json'], ['orders', true, ['order_tally'], 'orders/flow.json']]);
    expect(doc.flows![0]!.steps).toEqual(['order_tally_rows', 'order_tally_by_status', 'order_tally_big']);
    for (const [k, own] of owns.entries()) expect(await flowHash(own), own.id).toBe(doc.flows![k]!.hash);
    // Orders' canvas has its use as a card, fed by its own checked orders.
    const inside = levelDoc(doc, 'orders');
    expect(inside.steps.map((s) => [s.id, s.inputs])).toEqual([[flowCard('order_tally'), ['orders_checked']], ['orders_checked', ['orders']]]);
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER, amount REAL, status TEXT); INSERT INTO orders_file VALUES (1,'2024-03-11',1,30.0,'paid'),(2,'2024-03-11',1,3.0,'open')");
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' }, flows: owns });
    expect(r.manifest.flow.reads).toEqual(doc.flows!.map((f) => [f.id, f.hash]));
    expect(db.query('SELECT status, total FROM order_tally_big').rows).toEqual([['paid', 30]]);
    const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
    expect(v.checks.filter((c) => !c.ok)).toEqual([]);
  });
});
