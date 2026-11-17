/**
 * The join form's cell (src/core/joincell.ts, ADR 0026 §10): a join written as a notebook cell, which the notebook
 * parser derives a step from as it does from any cell. On Larkspur's five flows, and through the engine on a small flow.
 */
import { describe, expect, it } from 'vitest';
import { composeFlow, type FlowFiles } from '../src/core/compose.js';
import { validateDocument, type FlowDocument } from '../src/core/document.js';
import { emitJoin } from '../src/core/emit.js';
import { derive } from '../src/app/derive.js';
import { JOINS_NOTEBOOK, joinedColumns, joinProblems, joinSaid, joinsOf, withJoin, withoutJoin, type JoinSpec } from '../src/core/joincell.js';
import { notebookSectionId } from '../src/core/notebook.js';
import { addFlow } from '../src/core/catalogue.js';
import { flowHash, translate } from '../src/core/plan.js';
import { useOf } from '../src/core/reuse.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

const larkspur = new URL('../examples/larkspur/', import.meta.url);
// What the page does after the form (src/app/derive.ts): the steps derived again from the notebooks as they are now.
const day = { day: '2024-03-12' };

/** Each application with its owning unit's name and level, from HR's units. */
const UNITS: JoinSpec = { name: 'apps_with_units', left: 'apps', right: 'org_units', on: [['owner_team_id', 'org_unit_id']], how: 'left', take: { left: ['app_id', 'name', 'tier'], right: ['name', 'level'] } };

describe('a join as SQL', () => {
  it('takes the columns asked for, names a right column the left has by its dataset, and keeps the rows it says', () => {
    expect(emitJoin(UNITS)).toBe('SELECT l."app_id", l."name", l."tier", r."name" AS "org_units_name", r."level"\nFROM "apps" l\nLEFT JOIN "org_units" r ON l."owner_team_id" = r."org_unit_id"');
    expect(emitJoin({ ...UNITS, how: 'inner', on: [['a', 'b'], ['c', 'c']], take: { left: ['a'], right: [] } }, (d) => `\${${d}}`)).toBe('SELECT l."a"\nFROM ${apps} l\nJOIN ${org_units} r ON l."a" = r."b" AND l."c" = r."c"');
  });

  it('says it in words', () => {
    expect(joinSaid(UNITS)).toBe('Joined apps with org_units on owner_team_id = org_unit_id, as apps_with_units: every row of apps, with name and level from org_units');
    expect(joinSaid({ ...UNITS, how: 'inner', on: [['app_id', 'app_id']], take: { left: ['app_id'], right: [] } })).toBe('Joined apps with org_units on app_id, as apps_with_units: the rows of apps that find a match');
  });
});

describe('a join written into the flow', () => {
  it('writes a cell in a notebook of the flow’s own, and the parser derives the step from it', async () => {
    const doc = await loadFlowDir(larkspur);
    expect(joinProblems(doc, UNITS)).toEqual([]);
    const written = withJoin(doc, UNITS);
    // Only the notebooks changed: one more, with its imports, its cell and what it publishes.
    expect(written.steps).toBe(doc.steps);
    const nb = written.notebooks!.at(-1)!;
    expect(nb.path).toBe(JOINS_NOTEBOOK);
    expect(nb.source).toBe([
      '// Joins made in the app (ADR 0026 §10): each a cell the join form wrote. Edit it as any notebook.',
      "import { cell, sql } from 'smaltnb';",
      "import { publish } from 'smaltfl/notebook';",
      "import { apps } from './applications/apps.nb.js';",
      "import { org_units } from './hr/org.nb.js';",
      '',
      "cell('apps_with_units', { lang: 'sql' });",
      'export const apps_with_units = sql`',
      '  SELECT l."app_id", l."name", l."tier", r."name" AS "org_units_name", r."level"',
      '  FROM ${apps} l',
      '  LEFT JOIN ${org_units} r ON l."owner_team_id" = r."org_unit_id"`;',
      '',
      "cell('published');",
      "publish(apps_with_units, { description: 'apps with org_units, joined on owner_team_id' });",
      '',
    ].join('\n'));
    const next = await derive(written);
    expect(validateDocument(next)).toEqual([]);
    const step = next.steps.find((s) => s.id === 'apps_with_units')!;
    expect(step).toMatchObject({ kind: 'sql', inputs: ['apps', 'org_units'], dataset: { description: 'apps with org_units, joined on owner_team_id' } });
    expect((step as { sql: string }).sql).toContain('FROM apps l');
    expect(next.cells!.apps_with_units).toMatchObject({ notebook: JOINS_NOTEBOOK, cell: 'apps_with_units', lang: 'sql' });
    expect(joinsOf(next)).toEqual(['apps_with_units']);
    // The step is the flow's own: no flow it reads has it, and each of those is as it was.
    expect(next.flows).toEqual(doc.flows);
    // One more node and one more output; every other step as it was derived before.
    const [before, after] = [await translate(doc, day), await translate(next, day)];
    expect([after.nodes.length - before.nodes.length, after.outputs.length - before.outputs.length]).toEqual([1, 1]);
    expect(next.steps.filter((s) => s.id !== 'apps_with_units')).toEqual(doc.steps);
    expect(await flowHash(next)).not.toBe(await flowHash(doc));
  });

  it('gives the notebook a section of its own on the canvas, and leaves every other section as the page arranged it', async () => {
    const doc = await loadFlowDir(larkspur);
    // The page's arrangement: a section unfolded, another recoloured.
    const arranged = { ...doc, groups: doc.groups!.map((g, k) => (k === 0 ? { ...g, collapsed: false } : k === 1 ? { ...g, color: 'rose' as const } : g)) };
    const next = await derive(withJoin(arranged, UNITS));
    const joins = next.groups!.find((g) => g.id === notebookSectionId(JOINS_NOTEBOOK))!;
    expect(joins).toMatchObject({ name: 'Joins', steps: ['apps_with_units'] });
    expect(next.groups!.filter((g) => g !== joins)).toEqual(arranged.groups);
    // Taken out again, its section goes with it.
    const back = await derive(withoutJoin(next, 'apps_with_units'));
    expect(back.groups).toEqual(arranged.groups);
  });

  it('adds a second beside the first, importing each dataset once, and reads a join it wrote', async () => {
    const doc = await loadFlowDir(larkspur);
    const one = await derive(withJoin(doc, UNITS));
    // A file of a flow it reads, and a join the form wrote before.
    const two: JoinSpec = { name: 'units_with_register', left: 'apps_with_units', right: 'cmdb_apps', on: [['app_id', 'app_id']], how: 'inner', take: { left: ['app_id', 'level'], right: ['hosting'] }, description: 'Each application’s level and hosting' };
    expect(joinProblems(one, two)).toEqual([]);
    const next = await derive(withJoin(one, two));
    expect(validateDocument(next)).toEqual([]);
    const text = next.notebooks!.find((n) => n.path === JOINS_NOTEBOOK)!.source;
    expect(text.match(/^import /gm)).toHaveLength(5);
    expect(text).toContain("import { cmdb_apps } from './inventory/bronze.nb.js';");
    expect(text.indexOf("cell('apps_with_units'")).toBeLessThan(text.indexOf("cell('units_with_register'"));
    expect(text.indexOf("cell('units_with_register'")).toBeLessThan(text.indexOf("cell('published');"));
    expect(text).toContain("publish(units_with_register, { description: 'Each application’s level and hosting' });");
    expect(joinsOf(next)).toEqual(['apps_with_units', 'units_with_register']);
    expect(next.steps.find((s) => s.id === 'units_with_register')).toMatchObject({ kind: 'sql', inputs: ['apps_with_units', 'cmdb_apps'] });
  });

  it('joins what a use of a flow gives, imported under the name it has here (ADR 0026 §11)', async () => {
    const [doc, kit] = await Promise.all([loadFlowDir(larkspur), loadFlowDir(new URL('catalogue/by_unit/', larkspur))]);
    const use = await useOf(kit, { as: 'waf_by_unit', inputs: { feed: 'waf_checked', owners: 'app_owners' }, settings: {} }, await flowHash(kit), ts);
    const used = addFlow(doc, use, 'catalogue/by_unit/flow.json', await flowHash(use));
    // The WAF's units with each unit's name, from HR's units. The use's rows come from a feed a held day can fill.
    const named: JoinSpec = { name: 'waf_units_named', left: 'waf_by_unit_units', right: 'org_units', on: [['business_unit_id', 'org_unit_id']], how: 'left', take: { left: ['business_unit_id', 'pass_share', 'behind', 'filled_from'], right: ['name'] } };
    expect(joinProblems(used, named)).toEqual([]);
    expect(joinProblems(used, { ...named, take: { left: ['business_unit_id', 'pass_share'], right: ['name'] } })).toEqual(['waf_by_unit_units is built from a feed a held day can fill from another day: take filled_from, so the rows that came from another day say so']);
    const next = await derive(withJoin(used, named));
    expect(validateDocument(next)).toEqual([]);
    const text = next.notebooks!.find((n) => n.path === JOINS_NOTEBOOK)!.source;
    // The cell's own name in the used flow's notebook, as the name the dataset has here.
    expect(text).toContain("import { units as waf_by_unit_units } from './catalogue/by_unit/by_unit.nb.js';");
    expect(text).toContain('FROM ${waf_by_unit_units} l');
    expect(next.steps.find((s) => s.id === 'waf_units_named')).toMatchObject({ kind: 'sql', inputs: ['waf_by_unit_units', 'org_units'] });
    // The use's own steps are read again as they were: the same ids, the same statements.
    const stepsOf = (d: FlowDocument) => d.steps.filter((s) => s.id.startsWith('waf_by_unit_'));
    expect(stepsOf(next)).toEqual(stepsOf(used));
    expect(next.flows!.at(-1)).toEqual(used.flows!.at(-1));
    // A second join on the same dataset imports it once.
    const again = await derive(withJoin(next, { ...named, name: 'waf_units_again' }));
    expect(again.notebooks!.find((n) => n.path === JOINS_NOTEBOOK)!.source.match(/as waf_by_unit_units/g)).toHaveLength(1);
  });

  it('is taken out again, and the notebook with it once nothing is left', async () => {
    const doc = await loadFlowDir(larkspur);
    const one = await derive(withJoin(doc, UNITS));
    const two = await derive(withJoin(one, { ...UNITS, name: 'apps_units_again' }));
    const back = await derive(withoutJoin(two, 'apps_units_again'));
    expect(joinsOf(back)).toEqual(['apps_with_units']);
    expect(back.steps.map((s) => s.id)).toEqual(one.steps.map((s) => s.id));
    const none = await derive(withoutJoin(back, 'apps_with_units'));
    expect(none.notebooks!.map((n) => n.path)).toEqual(doc.notebooks!.map((n) => n.path));
    expect(none.steps).toEqual(doc.steps);
    expect(await flowHash(none)).toBe(await flowHash(doc));
    expect(withoutJoin(doc, 'nothing')).toBe(doc);
  });

  it('says why a join can’t be written', async () => {
    const doc = await loadFlowDir(larkspur);
    const columns = (d: string) => ({ apps: ['app_id', 'name', 'tier', 'owner_team_id'], org_units: ['org_unit_id', 'name', 'level'] })[d];
    expect(joinProblems(doc, UNITS, columns)).toEqual([]);
    expect(joinProblems(doc, { ...UNITS, name: 'apps' })).toEqual(['apps is a name the flow uses already']);
    expect(joinProblems(doc, { ...UNITS, name: 'Apps With Units' })).toEqual(['Its name is lower-case letters, digits and underscores, and starts with a letter']);
    expect(joinProblems(doc, { ...UNITS, right: 'nowhere' })).toEqual(['nowhere isn’t a dataset of this flow']);
    expect(joinProblems(doc, { ...UNITS, right: 'apps' })).toEqual(['A join is of two datasets: the same one is named twice']);
    expect(joinProblems(doc, { ...UNITS, on: [] })).toEqual(['A join needs a key: a column on each side whose values match']);
    expect(joinProblems(doc, { ...UNITS, take: { left: [], right: [] } })).toEqual(['A join takes at least one column']);
    expect(joinProblems(doc, { ...UNITS, on: [['owner', 'org_unit_id']], take: { left: ['app_id'], right: ['size'] } }, columns)).toEqual(['apps has no column owner', 'org_units has no column size']);
    // A step another flow keeps to itself: read what it publishes.
    const kept = doc.steps.find((s) => s.dataset === undefined && doc.flows!.some((f) => f.steps.includes(s.id)))!;
    const part = doc.flows!.find((f) => f.steps.includes(kept.id))!;
    expect(joinProblems(doc, { ...UNITS, right: kept.id })).toEqual([`${kept.id} is a step ${part.name} keeps to itself: a flow reads what another publishes`]);
  });

  it('refuses two columns under one name, and a join of a fillable feed that leaves filled_from out', async () => {
    const doc = await loadFlowDir(larkspur);
    // The right's name is named after its dataset where the left's is taken too: a left column of that name collides.
    expect(joinedColumns(UNITS)).toEqual(['app_id', 'name', 'tier', 'org_units_name', 'level']);
    expect(joinProblems(doc, { ...UNITS, take: { left: ['app_id', 'name', 'org_units_name'], right: ['name'] } })).toEqual(['org_units_name would be two columns of the join: take one of them']);
    expect(joinProblems(doc, { ...UNITS, take: { left: ['app_id', 'app_id'], right: ['level'] } })).toEqual(['app_id would be two columns of the join: take one of them']);
    // The TLS feed can be filled from another day (ADR 0009 amendment 1): what is built from it carries the mark, or
    // the run stops. The form says so before anything is written.
    const tls: JoinSpec = { name: 'apps_with_tls', left: 'apps', right: 'tls_checked', on: [['app_id', 'app_id']], how: 'left', take: { left: ['app_id', 'name'], right: ['issuer', 'not_after'] } };
    expect(joinProblems(doc, tls)).toEqual(['tls_checked is built from a feed a held day can fill from another day: take filled_from, so the rows that came from another day say so']);
    expect(joinProblems(doc, { ...tls, take: { ...tls.take, right: [...tls.take.right, 'filled_from'] } })).toEqual([]);
    // Two filled feeds: one mark is enough for the run, and each side's is kept under its own name where both are taken.
    const two: JoinSpec = { name: 'tls_with_waf', left: 'tls_checked', right: 'waf_checked', on: [['app_id', 'app_id']], how: 'inner', take: { left: ['app_id', 'issuer'], right: ['status'] } };
    expect(joinProblems(doc, two)).toEqual(['tls_checked and waf_checked are built from a feed a held day can fill from another day: take filled_from, so the rows that came from another day say so']);
    expect(joinedColumns({ ...two, take: { left: ['app_id', 'filled_from'], right: ['status', 'filled_from'] } })).toEqual(['app_id', 'filled_from', 'status', 'waf_checked_filled_from']);
    // A dataset no fill reaches needs none.
    expect(joinProblems(doc, UNITS)).toEqual([]);
  });
});

describe('a join made and run', () => {
  const PARAMS = [{ name: 'day', type: 'text', default: null }];
  const GIVEN: Record<string, unknown> = {
    'flow.json': { smaltfl: 4, id: 'sales', name: 'Sales', parameters: PARAMS, sources: [{ id: 'orders', table: 'orders_file' }, { id: 'customers', table: 'customers_file' }], notebooks: ['sales.nb.ts'] },
    'sales.nb.ts': `import { cell } from 'smaltnb';\nimport { check, publish, source } from 'smaltfl/notebook';\n
cell('orders');
export const orders = source('orders');

cell('customers');
export const customers = source('customers');

cell('orders_checked');
export const orders_checked = check(orders, { rules: [{ name: 'has_id', check: 'order_id IS NOT NULL', onFail: 'drop' }] });

cell('published');
publish(orders_checked);
`,
  };
  const files: FlowFiles = { json: async (p) => structuredClone(GIVEN[p]), text: async (p) => GIVEN[p] as string };

  it('builds the joined dataset from the day’s run, and the run verifies', async () => {
    const db = openEngine();
    db.exec("CREATE TABLE orders_file(order_id INTEGER, day TEXT, customer_id INTEGER); INSERT INTO orders_file VALUES (1,'2024-03-11',1),(2,'2024-03-11',2),(NULL,'2024-03-11',2),(3,'2024-03-11',9)");
    db.exec("CREATE TABLE customers_file(id INTEGER, name TEXT); INSERT INTO customers_file VALUES (1,'Aster'),(2,'Birch')");
    const doc = await composeFlow('flow.json', files, ts);
    const spec: JoinSpec = { name: 'orders_named', left: 'orders_checked', right: 'customers', on: [['customer_id', 'id']], how: 'left', take: { left: ['order_id', 'day'], right: ['name'] } };
    expect(joinProblems(doc, spec)).toEqual([]);
    const next = await derive(withJoin(doc, spec));
    expect(validateDocument(next)).toEqual([]);
    const r = await runFlow(db, next, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' } });
    expect(db.query('SELECT order_id, day, name FROM orders_named ORDER BY order_id').rows).toEqual([[1, '2024-03-11', 'Aster'], [2, '2024-03-11', 'Birch'], [3, '2024-03-11', null]]);
    expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    // Only the rows that match, where the form says so.
    const inner = await derive(withJoin(doc, { ...spec, name: 'orders_matched', how: 'inner' }));
    await runFlow(db, inner, { smaltdb: SMALTDB, parameters: { day: '2024-03-11' } });
    expect(db.query('SELECT count(*) FROM orders_matched').rows).toEqual([[2]]);
  });
});
