/**
 * The estate's ontology in a document of its own (src/core/shared.ts, compose.ts; ADR 0026 §8): flows import it, each
 * takes what is about the datasets it has or reads, a flow may handle a column of its own datasets its own way where it
 * says so with its reason, and saying a shared column again without that mark is refused.
 */
import { describe, expect, it } from 'vitest';
import { composeFlow, type FlowFiles } from '../src/core/compose.js';
import { contextRows } from '../src/core/context.js';
import { validateDocument, type FlowDocument } from '../src/core/document.js';
import { resolve, rulesHash } from '../src/core/inforce.js';
import { propertyOf, rowsOf } from '../src/core/ontology.js';
import { flowHash, translate } from '../src/core/plan.js';
import { asEstate, estateHash, estateSays, isEstate, overrideProblems, SharedOntologyError, takeEstate, type EstateOntology } from '../src/core/shared.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

const ESTATE: EstateOntology = {
  smaltflOntology: 2,
  name: 'Shop',
  objectTypes: [
    { id: 'customer', name: 'Customer', dataset: 'customers', key: ['customer_id'], title: 'name' },
    { id: 'product', name: 'Product', dataset: 'products', key: ['sku'], title: 'sku' },
  ],
  linkTypes: [{ id: 'bought', name: 'Bought', from: 'customer', to: 'product', on: [['last_sku', 'sku']] }],
  actionTypes: [],
  references: [{ id: 'handbook', title: 'The shop handbook', url: 'https://example.test/handbook' }, { id: 'unused', title: 'Unused', url: 'https://example.test/unused' }],
  nouns: { orders: { one: 'order', many: 'orders' }, products: { one: 'product', many: 'products' } },
  rows: [{ dataset: 'orders', of: 'customer', key: 'customer_id' }, { dataset: 'stock', of: 'product' }],
  needs: [{ id: 'paid_has_date', datasets: ['orders', 'refunds'], when: { status: 'paid' }, then: { paid_on: ['set'] } }],
  properties: [
    { column: 'customer_id', title: 'Customer', description: 'Who bought', sources: ['handbook'] },
    { column: 'status', title: 'Status', description: 'Where an order is', values: { open: 'Open', paid: 'Paid' }, datasets: ['orders', 'refunds'], expect: [{ value: 'paid', share: [0.5, 1], datasets: ['refunds'] }, { value: 'open', share: [0, 0.5] }] },
    { column: 'sku', title: 'Product', description: 'What was bought', lookup: { dataset: 'products', key: 'sku', label: 'name' } },
    { column: 'level', title: 'Stock level', description: 'How many are left', datasets: ['stock'] },
  ],
};

describe('an estate’s ontology, as a document', () => {
  it('is told from a starting file’s, and read for its shape', () => {
    expect(isEstate(ESTATE)).toBe(true);
    expect(isEstate({ smaltflOntology: 1, file: 'auth' })).toBe(false);
    expect(asEstate(ESTATE, 'ontology.json')).toBe(ESTATE);
    expect(() => asEstate({ smaltflOntology: 1, file: 'auth' }, 'x.json')).toThrow(SharedOntologyError);
    expect(() => asEstate({ smaltflOntology: 2 }, 'x.json')).toThrow(/has no name/);
    expect(() => asEstate({ ...ESTATE, rules: [] }, 'x.json')).toThrow(/rules isn't an estate ontology's part/);
    expect(() => asEstate({ ...ESTATE, rows: {} }, 'x.json')).toThrow(/rows is a list/);
    expect(() => asEstate({ ...ESTATE, nouns: [] }, 'x.json')).toThrow(/nouns is a map/);
    // An override is a flow's, of what the estate says: the estate has none.
    expect(() => asEstate({ ...ESTATE, properties: [{ column: 'a', title: 'A', description: '', override: { reason: 'x' } }] }, 'x.json')).toThrow(/the estate's ontology has none/);
  });

  it('is known by its content (estate/0): the vector', async () => {
    const small: EstateOntology = { smaltflOntology: 2, name: 'Shop', objectTypes: [{ id: 'customer', name: 'Customer', dataset: 'customers', key: ['customer_id'], title: 'name' }], properties: [{ column: 'customer_id', title: 'Customer', description: 'Who bought' }] };
    expect(await estateHash(small)).toBe('9c2c2afee7b8c541cd75bad233790edcf73b102d9c631390c04f7095fbd0da5a');
    // The order its parts are written in is no part of it; what it says is.
    expect(await estateHash({ properties: small.properties, name: 'Shop', objectTypes: small.objectTypes, smaltflOntology: 2 } as EstateOntology)).toBe(await estateHash(small));
    expect(await estateHash({ ...small, name: 'Shop two' })).not.toBe(await estateHash(small));
  });
});

describe('what a flow takes of it', () => {
  const take = (ids: string[], over: [string, string][] = []) => takeEstate(ESTATE, new Set(ids.map((x) => x.toLowerCase())), over);

  it('is what is about the datasets it has or reads: types whose list is here, rows of a type that is, links between two', () => {
    const o = take(['customers', 'orders']);
    expect(o.objectTypes.map((t) => t.id)).toEqual(['customer']);
    expect(o.rows).toEqual([{ dataset: 'orders', of: 'customer', key: 'customer_id' }]);
    // A link needs both its types here; a rows entry its type.
    expect(o.linkTypes).toEqual([]);
    expect(take(['customers', 'products', 'stock']).linkTypes.map((l) => l.id)).toEqual(['bought']);
    expect(take(['stock']).rows).toBeUndefined();
    expect(o.nouns).toEqual({ orders: { one: 'order', many: 'orders' } });
  });

  it('takes a column’s meaning whole where it is for every dataset, trimmed where it is for some, its bands and its lookup with it', () => {
    const o = take(['customers', 'orders']);
    expect(o.properties!.map((p) => p.column)).toEqual(['customer_id', 'status', 'sku']);
    // For orders and refunds: here, for orders. The band for refunds alone goes; the one for both stays.
    expect(o.properties![1]).toMatchObject({ column: 'status', datasets: ['orders'], expect: [{ value: 'open', share: [0, 0.5] }] });
    // The products aren't here: the product's name can't be looked up, and the meaning stands without it.
    expect(o.properties![2]).toEqual({ column: 'sku', title: 'Product', description: 'What was bought' });
    expect(take(['products']).properties!.find((p) => p.column === 'sku')!.lookup).toEqual({ dataset: 'products', key: 'sku', label: 'name' });
    // Only the references its meanings cite.
    expect(o.references!.map((r) => r.id)).toEqual(['handbook']);
    // A dependency is trimmed to the datasets here, and gone where none is.
    expect(o.needs).toEqual([{ id: 'paid_has_date', datasets: ['orders'], when: { status: 'paid' }, then: { paid_on: ['set'] } }]);
    expect(take(['customers']).needs).toBeUndefined();
    // Nothing of the estate is changed by taking from it.
    expect(ESTATE.properties![1]!.datasets).toEqual(['orders', 'refunds']);
  });

  it('takes none of the written checks for a flow with no gate to judge by them: no rows entry, no dependency, no band', () => {
    const o = takeEstate(ESTATE, new Set(['customers', 'orders']), [], false);
    expect(o.rows).toBeUndefined();
    expect(o.needs).toBeUndefined();
    expect(o.properties!.find((p) => p.column === 'status')).toEqual({ column: 'status', title: 'Status', description: 'Where an order is', values: { open: 'Open', paid: 'Paid' }, datasets: ['orders'] });
    expect(o.objectTypes.map((t) => t.id)).toEqual(['customer']);
  });

  it('steps aside, for a dataset a flow handles its own way', () => {
    expect(take(['orders', 'refunds'], [['status', 'orders']]).properties!.find((p) => p.column === 'status')!.datasets).toEqual(['refunds']);
    expect(take(['orders'], [['Status', 'ORDERS']]).properties!.some((p) => p.column === 'status')).toBe(false);
    // A meaning for every dataset stays: the flow's own, for its dataset, is the nearer one.
    expect(take(['orders'], [['customer_id', 'orders']]).properties!.some((p) => p.column === 'customer_id')).toBe(true);
  });
});

describe('what the estate says of a column', () => {
  it('is its entry that names the dataset, else the one for every dataset, and nothing where it describes none', () => {
    expect(estateSays([ESTATE], 'orders', 'status')).toEqual({ estate: ESTATE, property: ESTATE.properties![1] });
    expect(estateSays([ESTATE], 'Orders', 'STATUS')?.property.title).toBe('Status');
    expect(estateSays([ESTATE], 'stock', 'status')).toBeUndefined();
    expect(estateSays([ESTATE], 'anything', 'customer_id')?.property.description).toBe('Who bought');
    expect(estateSays([ESTATE], 'orders', 'price')).toBeUndefined();
    expect(estateSays([], 'orders', 'status')).toBeUndefined();
    // The first estate that says it.
    const second: EstateOntology = { smaltflOntology: 2, name: 'Group', properties: [{ column: 'status', title: 'State', description: 'Group-wide' }, { column: 'region', title: 'Region', description: 'Where' }] };
    expect(estateSays([ESTATE, second], 'orders', 'status')?.estate.name).toBe('Shop');
    expect(estateSays([ESTATE, second], 'stock', 'status')?.estate.name).toBe('Group');
    expect(estateSays([ESTATE, second], 'orders', 'region')?.estate.name).toBe('Group');
  });
});

describe('a flow’s own ontology beside the estate’s', () => {
  const mine = new Set(['orders']);
  const own = (properties: unknown[]) => ({ objectTypes: [], linkTypes: [], actionTypes: [], properties }) as never;
  const problems = (properties: unknown[]) => overrideProblems([ESTATE], own(properties), mine, 'Sales');

  it('refuses a column the estate describes said again without the mark: an accident is not an override', () => {
    expect(problems([{ column: 'status', title: 'State', description: '', datasets: ['orders'] }])).toEqual([
      'Sales describes status on orders, which Shop’s ontology describes: an override says so, with its reason ("override": { "reason": … }), or the flow leaves it to the estate',
    ]);
    // Said for every dataset where the estate says it at all; said for a dataset where the estate says it for every one.
    expect(problems([{ column: 'status', title: 'State', description: '' }])[0]).toMatch(/^Sales describes status, which Shop’s ontology describes/);
    expect(problems([{ column: 'customer_id', title: 'Buyer', description: '', datasets: ['orders'] }])[0]).toMatch(/^Sales describes customer_id on orders/);
    // A column the estate doesn't describe is the flow's to describe.
    expect(problems([{ column: 'basket', title: 'Basket', description: '', datasets: ['orders'] }])).toEqual([]);
    expect(overrideProblems([ESTATE], undefined, mine, 'Sales')).toEqual([]);
  });

  it('takes an override of its own datasets, with its reason, of a column the estate describes', () => {
    expect(problems([{ column: 'status', title: 'State', description: '', datasets: ['orders'], override: { reason: 'Sales counts a part-paid order as open' } }])).toEqual([]);
    expect(problems([{ column: 'status', title: 'State', description: '', datasets: ['orders'], override: { reason: ' ' } }])).toEqual(['Sales’s override of status has no reason: why this flow handles the column its own way']);
    expect(problems([{ column: 'status', title: 'State', description: '', override: { reason: 'r' } }])).toEqual(['Sales’s override of status names no dataset: a flow overrides a column for its own datasets']);
    expect(problems([{ column: 'status', title: 'State', description: '', datasets: ['refunds'], override: { reason: 'r' } }])).toEqual(['Sales’s override of status on refunds is of a dataset that isn’t its own: a flow overrides a column for its own datasets']);
    expect(problems([{ column: 'basket', title: 'Basket', description: '', datasets: ['orders'], override: { reason: 'r' } }])).toEqual(['Sales’s override of basket on orders overrides nothing: no estate’s ontology it imports describes it']);
  });
});

// ------------------------------------------------------------------ read with a flow

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
const nb = (imports: string, body: string) => `import { cell, sql } from 'smaltnb';\nimport { check, gate, publish, source } from 'smaltfl/notebook';\n${imports}\n${body}\n`;
const SHOP = (ordersOntology: Record<string, unknown> = {}, salesOntology: Record<string, unknown> | null = { import: ['./ontology.json'] }) => ({
  'ontology.json': ESTATE,
  'orders/flow.json': { smaltfl: 4, id: 'orders_flow', name: 'Orders', parameters: PARAMS, sources: [{ id: 'orders', table: 'orders_file' }, { id: 'customers', table: 'customers_file' }], notebooks: ['orders.nb.ts'], ontology: { import: ['../ontology.json'], ...ordersOntology } },
  'orders/orders.nb.ts': nb('', `
cell('orders');
export const orders = source('orders');

cell('customers');
export const customers = source('customers');

cell('orders_gate');
export const orders_gate = gate(orders, { layer: 'bronze' });

cell('orders_checked');
export const orders_checked = check(orders, { rules: [{ name: 'has_id', check: 'customer_id IS NOT NULL', onFail: 'drop' }] });

cell('published');
publish(orders_checked);`),
  'flow.json': { smaltfl: 4, id: 'sales', name: 'Sales', parameters: PARAMS, flows: ['orders/flow.json'], sources: [{ id: 'products', table: 'products_file' }], notebooks: ['sales.nb.ts'], ...(salesOntology ? { ontology: salesOntology } : {}) },
  'sales.nb.ts': nb("import { orders_checked } from './orders/orders.nb.js';", `
cell('products');
export const products = source('products');

cell('sales_by_sku', { lang: 'sql' });
export const sales_by_sku = sql\`SELECT sku, count(*) AS n FROM \${orders_checked} GROUP BY sku\`;

cell('published');
publish(sales_by_sku);`),
});

describe('a flow read with the estate’s ontology it imports', () => {
  it('takes what is about its datasets, keeps where it came from, and is the same thing in every flow that imports it', async () => {
    const orders = await composeFlow('orders/flow.json', files(SHOP()), ts);
    expect(validateDocument(orders)).toEqual([]);
    const hash = await estateHash(ESTATE);
    expect(orders.ontology!.estate).toEqual([{ name: 'Shop', path: '../ontology.json', hash }]);
    // Orders has the customers' list and its orders: the customer, never the product.
    expect(orders.ontology!.objectTypes.map((t) => t.id)).toEqual(['customer']);
    expect(rowsOf(orders.ontology, 'orders')?.type.id).toBe('customer');
    expect(propertyOf(orders.ontology, 'orders', 'status')?.datasets).toEqual(['orders']);
    // Sales reads Orders and has the products: both types, and the link between them.
    const sales = await composeFlow('flow.json', files(SHOP()), ts);
    expect(validateDocument(sales)).toEqual([]);
    expect(sales.ontology!.estate).toEqual([{ name: 'Shop', path: 'ontology.json', hash }]);
    expect(sales.ontology!.objectTypes.map((t) => t.id)).toEqual(['customer', 'product']);
    expect(sales.ontology!.linkTypes.map((l) => l.id)).toEqual(['bought']);
    // The flow it reads is known by the hash reading it on its own gives, the estate's part in it.
    expect(sales.flows![0]!.hash).toBe(await flowHash(orders));
  });

  it('takes it for a flow that imports none where a flow it reads does', async () => {
    const sales = await composeFlow('flow.json', files(SHOP({}, null)), ts);
    expect(sales.ontology!.estate).toEqual([{ name: 'Shop', path: 'ontology.json', hash: await estateHash(ESTATE) }]);
    expect(sales.ontology!.objectTypes.map((t) => t.id)).toEqual(['customer', 'product']);
  });

  it('moves every importing flow’s hash when the estate changes, and no flow’s when it doesn’t', async () => {
    const before = await flowHash(await composeFlow('flow.json', files(SHOP()), ts));
    expect(await flowHash(await composeFlow('flow.json', files(SHOP()), ts))).toBe(before);
    const changed = { ...SHOP(), 'ontology.json': { ...ESTATE, nouns: { ...ESTATE.nouns, orders: { one: 'sale', many: 'sales' } } } };
    const after = await composeFlow('flow.json', files(changed), ts);
    expect(await flowHash(after)).not.toBe(before);
    expect(after.flows![0]!.hash).not.toBe((await composeFlow('flow.json', files(SHOP()), ts)).flows![0]!.hash);
  });

  it('puts a flow’s own handling in place of what it overrides, in its own hash and in its reader’s', async () => {
    const override = { column: 'status', title: 'State', description: 'Where an order is, as Orders counts it', values: { open: 'Open', paid: 'Paid in full' }, datasets: ['orders'], override: { reason: 'Orders counts a part-paid order as open' } };
    const given = SHOP({ objectTypes: [], linkTypes: [], actionTypes: [], properties: [override] });
    const orders = await composeFlow('orders/flow.json', files(given), ts);
    expect(validateDocument(orders)).toEqual([]);
    expect(propertyOf(orders.ontology, 'orders', 'status')).toEqual(override);
    expect(orders.ontology!.properties!.filter((p) => p.column === 'status')).toEqual([override]);
    const sales = await composeFlow('flow.json', files(given), ts);
    expect(propertyOf(sales.ontology, 'orders', 'status')).toEqual(override);
    // The estate's own meaning stands wherever the flow didn't say otherwise.
    expect(propertyOf(sales.ontology, 'orders', 'customer_id')?.title).toBe('Customer');
    expect(await flowHash(orders)).not.toBe(await flowHash(await composeFlow('orders/flow.json', files(SHOP()), ts)));
    expect(await flowHash(sales)).not.toBe(await flowHash(await composeFlow('flow.json', files(SHOP()), ts)));
  });

  it('keeps what a flow’s own ontology says beside it: the columns set aside, and a dataset described ahead of its data', async () => {
    const five = (x: Record<string, unknown>) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k.endsWith('flow.json') ? { ...(v as object), smaltfl: 5 } : v]));
    const awaited = [{ id: 'returns', name: 'Returns', row: { one: 'return', many: 'returns' }, key: ['return_id'], columns: [{ column: 'return_id', description: 'The return' }, { column: 'sku', description: 'What came back' }] }];
    const given = five(SHOP(
      { objectTypes: [], linkTypes: [], actionTypes: [], aside: { orders: ['notes'] } },
      { import: ['./ontology.json'], objectTypes: [], linkTypes: [], actionTypes: [], aside: { products: ['legacy_sku'] }, awaited },
    ));
    const orders = await composeFlow('orders/flow.json', files(given), ts);
    expect(validateDocument(orders)).toEqual([]);
    expect(orders.ontology!.aside).toEqual({ orders: ['notes'] });
    // The reader has its own, and what the flow it reads set aside in its file.
    const sales = await composeFlow('flow.json', files(given), ts);
    expect(validateDocument(sales)).toEqual([]);
    expect(sales.ontology!.aside).toEqual({ orders: ['notes'], products: ['legacy_sku'] });
    expect(sales.ontology!.awaited).toEqual(awaited);
    expect(sales.ontology!.estate).toHaveLength(1);
    // A dataset described ahead in two flows is said twice.
    const twice = five(SHOP({ objectTypes: [], linkTypes: [], actionTypes: [], awaited }, { import: ['./ontology.json'], objectTypes: [], linkTypes: [], actionTypes: [], awaited }));
    await expect(composeFlow('flow.json', files(twice), ts)).rejects.toThrow(/the dataset described ahead returns is said by Orders and by Sales: the ontology says a thing once/);
  });

  it('refuses a shared column said again without the mark, an override of another flow’s dataset, and a thing the estate says said again', async () => {
    const again = SHOP({ objectTypes: [], linkTypes: [], actionTypes: [], properties: [{ column: 'status', title: 'State', description: '', datasets: ['orders'] }] });
    await expect(composeFlow('orders/flow.json', files(again), ts)).rejects.toThrow(/Orders describes status on orders, which Shop’s ontology describes: an override says so/);
    await expect(composeFlow('flow.json', files(again), ts)).rejects.toThrow(/Orders describes status on orders/);
    const theirs = SHOP({}, { import: ['./ontology.json'], objectTypes: [], linkTypes: [], actionTypes: [], properties: [{ column: 'status', title: 'State', description: '', datasets: ['orders'], override: { reason: 'Sales reads it another way' } }] });
    await expect(composeFlow('flow.json', files(theirs), ts)).rejects.toThrow(/Sales’s override of status on orders is of a dataset that isn’t its own/);
    const rows = SHOP({ objectTypes: [], linkTypes: [], actionTypes: [], rows: [{ dataset: 'orders', of: 'customer', key: 'customer_id' }] });
    await expect(composeFlow('orders/flow.json', files(rows), ts)).rejects.toThrow(/the rows entry orders is said by Shop’s ontology and by Orders: the ontology says a thing once/);
    const twice = { ...SHOP(), 'orders/flow.json': { ...(SHOP()['orders/flow.json'] as object), ontology: { import: ['../ontology.json', '../ontology.json'] } } };
    await expect(composeFlow('orders/flow.json', files(twice), ts)).rejects.toThrow(/imported twice/);
  });
});

describe('Larkspur’s ontology, the estate’s', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);

  it('is one document its five flows import, each taking what is about its datasets', async () => {
    const top = await loadFlowDir(dir);
    expect(top.ontology!.estate).toHaveLength(1);
    const { hash } = top.ontology!.estate![0]!;
    expect(top.ontology!.estate![0]).toEqual({ name: 'Larkspur estate', path: 'ontology.json', hash });
    expect(top.ontology!.objectTypes.map((t) => t.id)).toEqual(['org_unit', 'person', 'application', 'platform', 'control']);
    for (const id of ['hr', 'inventory', 'feeds', 'applications']) {
      const own = await loadFlowDir(new URL(`${id}/`, dir));
      expect(validateDocument(own)).toEqual([]);
      expect(own.ontology!.estate).toEqual([{ name: 'Larkspur estate', path: '../ontology.json', hash }]);
      expect(top.flows!.find((f) => f.id === id)!.hash).toBe(await flowHash(own));
    }
    // HR has its units and its people, and nothing of the applications; the feeds, which read the inventory, have
    // each file's rows as applications, as their gates count them.
    const hr = await loadFlowDir(new URL('hr/', dir));
    expect(hr.ontology!.objectTypes.map((t) => t.id)).toEqual(['org_unit', 'person']);
    expect(hr.ontology!.rows ?? []).toEqual([]);
    const feeds = await loadFlowDir(new URL('feeds/', dir));
    expect(feeds.ontology!.objectTypes.map((t) => t.id)).toEqual(['application', 'platform']);
    expect(rowsOf(feeds.ontology, 'tls')?.type.id).toBe('application');
    expect(Object.keys(feeds.ontology!.nouns ?? {}).every((d) => [...feeds.sources, ...feeds.steps].some((x) => x.id === d))).toBe(true);
  });

  it('notes the one column a flow handles its own way: the owning team, as Applications conforms it', async () => {
    const top = await loadFlowDir(dir);
    const here = propertyOf(top.ontology, 'apps', 'owner_team_id')!;
    expect(here.override?.reason).toMatch(/conforms the id/);
    expect(here.datasets).toEqual(['apps', 'app_owners']);
    // Everywhere else it is as the estate says it.
    expect(propertyOf(top.ontology, 'cmdb_apps', 'owner_team_id')).toEqual({ column: 'owner_team_id', title: 'Owning team', description: 'The team accountable for the application' });
    expect(top.ontology!.properties!.filter((p) => p.override)).toHaveLength(1);
  });

  it('changes the estate’s ontology once in March, and every flow follows from that day: who acts for a unit, a relation from Mon 11', async () => {
    const top = await loadFlowDir(dir);
    // Said on Fri 8 for Mon 11, by the estate: the change is the estate's in every flow that imports it.
    expect(top.changes!.map((c) => [c.id, c.estate, c.from, c.recorded])).toEqual([['acting-leader', 'Larkspur estate', '2024-03-11', '2024-03-08T14:00:00Z']]);
    const links = (d: FlowDocument, day: string, asOf?: string) => resolve(d, day, asOf).doc.ontology!.linkTypes.map((l) => l.id);
    expect(links(top, '2024-03-10')).toEqual(['owned_by', 'reports_into', 'led_by', 'managed_by', 'runs_on']);
    expect(links(top, '2024-03-11')).toEqual(['owned_by', 'reports_into', 'led_by', 'managed_by', 'runs_on', 'acted_for_by']);
    // As known on the morning it was written down, Mon 11 was still read without it.
    expect(links(top, '2024-03-11', '2024-03-08T09:00:00Z')).toEqual(['owned_by', 'reports_into', 'led_by', 'managed_by', 'runs_on']);
    // HR has the units and the people: the relation is its too. The feeds have neither, and are as they were.
    const hr = await loadFlowDir(new URL('hr/', dir));
    expect(links(hr, '2024-03-11')).toEqual(['reports_into', 'led_by', 'managed_by', 'acted_for_by']);
    const feeds = await loadFlowDir(new URL('feeds/', dir));
    expect(feeds.changes!.map((c) => c.id)).toEqual(['acting-leader']);
    expect(await rulesHash(resolve(feeds, '2024-03-11').doc)).toBe(await rulesHash(resolve(feeds, '2024-03-10').doc));
    expect(await rulesHash(resolve(hr, '2024-03-11').doc)).not.toBe(await rulesHash(resolve(hr, '2024-03-10').doc));
    // A relation is no step: the day's plan is the plan it was before the relation was known, but for the tables of
    // the product's context (ADR 0027 §8), which say the change and the version of the rules it makes.
    const nodesOf = async (asOf?: string) => (await translate(top, { day: '2024-03-11' }, asOf ? { asOf } : {})).nodes;
    const [known, before] = [await nodesOf(), await nodesOf('2024-03-08T09:00:00Z')];
    const plain = (nodes: typeof known) => nodes.filter((n) => !(n.op === 'sql' && n.context));
    expect(plain(known)).toEqual(plain(before));
    expect(plain(known)).toHaveLength(known.length - 3);
    const changes = (nodes: typeof known) => (nodes.find((n) => n.origin === 'context_changes') as { context: { rows: unknown[][] } }).context.rows.map((r) => r[0]);
    expect(changes(known)).toEqual(['acting-leader']);
    expect(changes(before)).toEqual([]);
    // The feeds have no part in the relation: it is no change of theirs, and their context has none.
    expect((await contextRows(feeds, '2024-03-11', null)).changes).toEqual([]);
    expect((await contextRows(hr, '2024-03-11', null)).changes.map((r) => r[0])).toEqual(['acting-leader']);
  });
});
