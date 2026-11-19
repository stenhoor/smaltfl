/**
 * The two doors (ADR 0027 §5; core/newsource.ts): a source and its description made together. Here is the data: a file
 * read whole, its description proposed, what is still to confirm said, and the source written into the flow as cells,
 * then run through the engine. Describe it first: a file's columns mapped onto a description written ahead, a column
 * under another name read as the described one.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { undescribed } from '../src/core/described.js';
import { validateDocument, type FlowDocument } from '../src/core/document.js';
import { describeAhead } from '../src/core/flowedit.js';
import { syncRuleCells } from '../src/core/gatecell.js';
import { utf8 } from '../src/core/hash.js';
import {
  awaitedProblems, bindingOfSource, checkedOf, columnsLacking, describedAlready, keyRepeats, matchAwaited, oneOf, proposeSource, readFile, rowProblems, sourceName, sourceProblems, sourceReaders, sourceSaid,
  sourcesAdded, SOURCES_NOTEBOOK, specOfAwaited, titleOf, VALUES_COUNTED, waitingForData, withoutSource, withRowSaid, withSource, type SourceSpec,
} from '../src/core/newsource.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { readAsOf, type AwaitedDataset } from '../src/core/ontology.js';
import { translate } from '../src/core/plan.js';
import { pinFile, runFlow } from '../src/index.js';
import { pinnedDdl, type DataBindings } from '../examples/sources.js';
import { readFileSync } from 'node:fs';
import { csvOf, securityDays, securityRows, SIGNIN_DEMO } from './fixtures/security.js';
import { SMALTDB } from './helpers/engine.js';
import { loadFlowDir, signinsDir, ts } from './helpers/notebooks.js';

const VENDORS = `vendor_id,name,country,tier,Risk Score,contract_no,notes
v-001,Acme Hosting,US,1,7.5,00412,"Renewed, twice"
v-002,Birch Data,DE,2,3,00413,
v-003,Cedar Mail,US,2,4.25,00414,"Two lines
of notes"
v-004,Dune Pay,GB,1,9,00415,
`;

/** The document's steps derived again from its notebooks, as the page's builder does (src/app/derive.ts). */
const derive = async (doc: FlowDocument): Promise<FlowDocument> => {
  const { groups: _groups, ...rest } = doc;
  return syncRuleCells(await expandNotebooks(rest as FlowDocument, ts));
};

describe('a file someone adds, read', () => {
  it('names its columns as the file does, each with the type its values read as, its blanks and what it holds', () => {
    const r = readFile(VENDORS);
    expect(r.problems).toEqual([]);
    expect(r.rows).toBe(4);
    expect(r.columns.map((c) => [c.name, c.type, c.blank, c.distinct, c.unique])).toEqual([
      ['vendor_id', 'TEXT', 0, 4, true],
      ['name', 'TEXT', 0, 4, true],
      ['country', 'TEXT', 0, 3, false],
      ['tier', 'INTEGER', 0, 2, false],
      ['Risk Score', 'REAL', 0, 4, true],
      // Whole numbers written with leading zeros are codes: text.
      ['contract_no', 'TEXT', 0, 4, true],
      ['notes', 'TEXT', 2, 2, false],
    ]);
    // The commonest first, ties by value; a quoted field keeps its comma and its line break.
    expect(r.columns[2]!.values).toEqual([['US', 2], ['DE', 1], ['GB', 1]]);
    expect(r.columns[6]!.values.map((v) => v[0])).toEqual(['Renewed, twice', 'Two lines\nof notes']);
  });

  it('reads a byte-order mark, a file with no rows, and CRLF line ends', () => {
    expect(readFile('\ufeffid,name\r\n1,a\r\n2,b\r\n').columns.map((c) => [c.name, c.type])).toEqual([['id', 'INTEGER'], ['name', 'TEXT']]);
    const empty = readFile('id,name\n');
    expect([empty.rows, empty.problems, empty.columns.map((c) => [c.type, c.unique])]).toEqual([0, [], [['TEXT', false], ['TEXT', false]]]);
  });

  it('counts a column’s values one by one only while they are few', () => {
    const many = readFile(`n\n${Array.from({ length: VALUES_COUNTED + 50 }, (_, i) => i).join('\n')}\n`);
    expect([many.columns[0]!.distinct, many.columns[0]!.values, many.columns[0]!.unique]).toEqual([VALUES_COUNTED + 1, [], true]);
  });

  it('says why a file can’t be read as a table', () => {
    expect(readFile('').problems).toEqual(['The file is empty: its first line names its columns']);
    expect(readFile('a,,c\n1,2,3\n').problems).toEqual(['Column 2 has no name in the header']);
    expect(readFile('a,b,A\n1,2,3\n').problems).toEqual(['A is named twice in the header']);
    expect(readFile('a,b\n1,2\n3\n').problems).toEqual(['Row 2 has 1 field where the header has 2']);
    expect(readFile('a,b\n1,2,3\n').problems).toEqual(['Row 1 has 3 fields where the header has 2']);
  });

  it('counts the rows that share their key with one before', () => {
    expect(keyRepeats(VENDORS, ['vendor_id'])).toBe(0);
    expect(keyRepeats(VENDORS, ['country'])).toBe(1);
    expect(keyRepeats(VENDORS, ['country', 'tier'])).toBe(0);
    expect(keyRepeats(VENDORS, ['nothing'])).toBe(0);
  });
});

describe('its description, proposed from its own data', () => {
  it('names the dataset after the file, one row after the dataset, and the key the id that tells every row apart', async () => {
    const doc = await loadFlowDir(signinsDir);
    const p = proposeSource(doc, 'Vendors.csv', readFile(VENDORS));
    expect(p).toEqual({
      id: 'vendors', description: '', row: { one: 'vendor', many: 'vendors' }, key: ['vendor_id'],
      columns: [
        { column: 'vendor_id', type: 'TEXT' }, { column: 'name', type: 'TEXT' }, { column: 'country', type: 'TEXT' }, { column: 'tier', type: 'INTEGER' },
        { column: 'Risk Score', type: 'REAL' }, { column: 'contract_no', type: 'TEXT' }, { column: 'notes', type: 'TEXT' },
      ],
    });
    // Nothing unique: no key is proposed, and a person says which columns together are one.
    expect(proposeSource(doc, 'x.csv', readFile('a,b\n1,2\n1,2\n')).key).toEqual([]);
    // An id before a code before any other column, whatever their order in the file.
    expect(proposeSource(doc, 'x.csv', readFile('label,ref_code,thing_id\na,r1,t1\nb,r2,t2\n')).key).toEqual(['thing_id']);
    expect(proposeSource(doc, 'x.csv', readFile('label,ref_code\na,r1\nb,r2\n')).key).toEqual(['ref_code']);
  });

  it('gives a name the flow doesn’t use, from whatever the file is called', async () => {
    const doc = await loadFlowDir(signinsDir);
    expect(sourceName(doc, 'exports/Vendor List 2024.csv')).toBe('vendor_list_2024');
    expect(sourceName(doc, 'C:\\data\\auth.CSV')).toBe('auth_2');
    expect(sourceName(doc, '2024-vendors.csv')).toBe('file_2024_vendors');
    expect(sourceName({ sources: [], steps: [{ id: 'vendors_checked' }] } as never, 'vendors.csv')).toBe('vendors_2');
    expect([oneOf('vendor contracts'), oneOf('companies'), oneOf('addresses'), oneOf('boxes'), oneOf('status'), oneOf('analysis'), oneOf('staff')]).toEqual(['vendor contract', 'company', 'address', 'box', 'status', 'analysis', 'staff']);
    expect([titleOf('owner_team_id'), titleOf('Risk Score'), titleOf('appID')]).toEqual(['Owner team id', 'Risk score', 'App id']);
  });

  it('knows a column the ontology has a meaning for already', async () => {
    const doc = await loadFlowDir(signinsDir);
    // The sign-ins' shared ontology describes a country for the sign-in log alone, and an hour for every dataset.
    expect(describedAlready(doc.ontology, 'vendors', 'hour')?.title).toBe('Hour');
    expect(describedAlready(doc.ontology, 'vendors', 'vendor_id')).toBeNull();
  });
});

const spec = (more: Partial<SourceSpec> = {}): SourceSpec => ({
  id: 'vendors', description: 'The vendors we buy from, as procurement lists them', row: { one: 'vendor', many: 'vendors' }, key: ['vendor_id'],
  columns: [
    { column: 'vendor_id', type: 'TEXT', description: 'The vendor’s id in procurement' },
    { column: 'name', type: 'TEXT', description: 'What the vendor is called' },
    { column: 'country', type: 'TEXT', description: 'Where the vendor is registered' },
    { column: 'tier', type: 'INTEGER', description: 'How much we depend on it: 1 the most' },
    { column: 'Risk Score', type: 'REAL', description: 'Procurement’s score, 0 to 10' },
    { column: 'contract_no', type: 'TEXT', aside: true },
    { column: 'notes', type: 'TEXT', aside: true },
  ],
  ...more,
});

describe('what is confirmed before any step may read it', () => {
  it('is what one row is, by which key, and every column described or set aside', async () => {
    const doc = await loadFlowDir(signinsDir);
    expect(sourceProblems(doc, spec())).toEqual([]);
    const proposed = proposeSource(doc, 'vendors.csv', readFile(VENDORS));
    // The sign-ins' ontology says what a country is for every dataset: the file's needs no words here.
    expect(sourceProblems(doc, proposed)).toEqual(['vendor_id, name, tier, Risk Score, contract_no and notes are neither described nor set aside']);
    expect(columnsLacking(doc.ontology, proposed)).toHaveLength(6);
    expect(columnsLacking(doc.ontology, spec())).toEqual([]);
    expect(sourceProblems(doc, spec({ row: { one: '', many: 'vendors' } }))).toEqual(['Say what one row is: one of them, and many']);
    expect(sourceProblems(doc, spec({ row: { one: 'vendor we buy from', many: 'vendors' } }))).toEqual(['Say what one row is in a word or two: “vendor” and “vendors”']);
    expect(sourceProblems(doc, spec({ key: [] }))).toEqual(['Say which columns tell one row from another: its key']);
    expect(sourceProblems(doc, spec({ key: ['notes'] }))).toEqual(['notes is the key and set aside: a key is a column the flow takes']);
    expect(sourceProblems(doc, spec({ key: ['id'] }))).toEqual(['The key names id, which the file doesn’t have']);
    expect(sourceProblems(doc, spec({ id: 'Vendors' }))).toEqual(['Its name is lower-case letters, digits and underscores, and starts with a letter']);
    expect(sourceProblems(doc, spec({ id: 'auth' }))).toEqual(['auth is a name the flow uses already']);
    expect(sourceProblems(doc, spec({ columns: spec().columns.map((c) => ({ ...c, aside: true })) }))).toEqual(['Every column is set aside: the flow would take nothing of the file', 'vendor_id is the key and set aside: a key is a column the flow takes']);
    // A column the ontology describes already needs no words here.
    expect(sourceProblems(doc, spec({ columns: [...spec().columns, { column: 'hour', type: 'INTEGER' }] }))).toEqual([]);
    expect(sourceProblems(doc, spec({ of: 'nothing' }))).toEqual(['The ontology has no kind of thing nothing']);
    // A flow that isn't written as notebooks has no cell to add a source as.
    expect(sourceProblems({ ...doc, notebooks: undefined }, spec())).toEqual(['Sign-ins isn’t written as notebooks: a source is added as a cell']);
  });
});

describe('a source written into the flow', () => {
  it('is its description in the ontology and three cells of a notebook of the flow’s own', async () => {
    const base = await loadFlowDir(signinsDir);
    const next = await derive(withSource(base, spec()));
    expect(validateDocument(next)).toEqual([]);
    expect(next.smaltfl).toBe(5);
    expect(next.sources.at(-1)).toEqual({ id: 'vendors', table: 'vendors_file', description: 'The vendors we buy from, as procurement lists them' });
    expect(next.notebooks!.find((n) => n.path === SOURCES_NOTEBOOK)!.source).toBe(`// Sources added in the app (ADR 0027 §5): each a file described before any step reads it. Edit it as any notebook.
import { cell } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';

cell('vendors');
export const vendors = source('vendors');

cell('vendors_checked');
export const vendors_checked = check(vendors, { rules: [{ name: 'has_vendor_id', check: 'vendor_id IS NOT NULL', onFail: 'warn' }] });

cell('published');
publish(vendors_checked, { description: 'The vendors we buy from, as procurement lists them' });
`);
    expect(sourcesAdded(next)).toEqual(['vendors']);
    expect(next.steps.find((s) => s.id === checkedOf('vendors'))).toMatchObject({ kind: 'expectations', inputs: ['vendors'], dataset: { description: 'The vendors we buy from, as procurement lists them' } });
    const o = next.ontology!;
    expect(o.objectTypes.find((t) => t.dataset === 'vendors')).toEqual({ id: 'vendor', name: 'Vendor', dataset: 'vendors', key: ['vendor_id'], title: 'name', description: 'The vendors we buy from, as procurement lists them' });
    expect(o.nouns!.vendors).toEqual({ one: 'vendor', many: 'vendors' });
    expect(o.aside).toEqual({ vendors: ['contract_no', 'notes'] });
    expect(o.properties!.filter((p) => p.datasets?.[0] === 'vendors').map((p) => [p.column, p.title, p.description])).toEqual([
      ['vendor_id', 'Vendor id', 'The vendor’s id in procurement'], ['name', 'Name', 'What the vendor is called'], ['country', 'Country', 'Where the vendor is registered'],
      ['tier', 'Tier', 'How much we depend on it: 1 the most'], ['Risk Score', 'Risk score', 'Procurement’s score, 0 to 10'],
    ]);
    // Every column the flow takes is described, and nothing set aside is declared: the ontology first.
    const binding = bindingOfSource(base, spec());
    expect(binding).toEqual({ table: 'vendors_file', format: 'csv', file: 'vendors.csv', header: true, columns: [['vendor_id', 'TEXT'], ['name', 'TEXT'], ['country', 'TEXT'], ['tier', 'INTEGER'], ['Risk Score', 'REAL']] });
    expect(undescribed(next, (id) => (id === 'vendors' ? binding.columns!.map((c) => c[0]) : null))).toEqual([]);
    expect(sourceSaid(spec())).toBe('Added vendors: one row is a vendor, by vendor_id; 5 columns described and 2 set aside');
    // The plan reads the file through its check step, and publishes that.
    const plan = await translate(next, { day: '2024-03-12' });
    expect(plan.nodes.filter((n) => n.origin.startsWith('vendors')).map((n) => [n.origin, n.op])).toEqual([['vendors', 'table'], ['vendors_checked', 'expect']]);
  });

  it('adds a second beside the first', async () => {
    const base = await loadFlowDir(signinsDir);
    const one = await derive(withSource(base, spec()));
    const offices: SourceSpec = { id: 'vendor_offices', description: '', row: { one: 'office', many: 'offices' }, key: ['vendor_id', 'city'], columns: [{ column: 'vendor_id', type: 'TEXT' }, { column: 'city', type: 'TEXT', description: 'Where the office is' }] };
    // vendor_id is the vendors' own meaning, so the offices' is theirs to say.
    expect(sourceProblems(one, offices)).toEqual(['vendor_id is neither described nor set aside']);
    offices.columns[0]!.description = 'The vendor whose office it is';
    expect(sourceProblems(one, offices)).toEqual([]);
    const two = await derive(withSource(one, offices));
    expect(validateDocument(two)).toEqual([]);
    expect(sourcesAdded(two)).toEqual(['vendors', 'vendor_offices']);
    expect(two.ontology!.objectTypes.filter((t) => ['vendors', 'vendor_offices'].includes(t.dataset)).map((t) => [t.id, t.key])).toEqual([['vendor', ['vendor_id']], ['office', ['vendor_id', 'city']]]);
    expect(two.notebooks!.find((n) => n.path === SOURCES_NOTEBOOK)!.source.match(/^publish\(/gm)).toHaveLength(2);
    // Its description says what the file is where nobody did.
    expect(two.notebooks!.find((n) => n.path === SOURCES_NOTEBOOK)!.source).toContain("publish(vendor_offices_checked, { description: 'Offices, as the file has them' });");
    // A flow with no gate keeps no rows of a kind the ontology has (ADR 0015): its rows are a kind of their own.
    expect(sourceProblems(one, { ...offices, of: 'vendor', key: ['vendor_id'] })).toEqual(['Sign-ins has no gate, so it keeps no rows of a kind the ontology has: its rows are a kind of their own']);
  });

  it('in a flow with gates, may say its rows are a kind the ontology has, by the one column that holds its key', async () => {
    const estate = await loadFlowDir(new URL('../examples/control-estate/', import.meta.url));
    const contacts: SourceSpec = { id: 'app_contacts', description: 'Who to call about each application', row: { one: 'contact', many: 'contacts' }, of: 'application', key: ['app_id'], columns: [{ column: 'app_id', type: 'TEXT', description: 'The application the contact is for' }, { column: 'on_call', type: 'TEXT', description: 'Who is on call for it' }] };
    expect(sourceProblems(estate, contacts)).toEqual([]);
    expect(sourceProblems(estate, { ...contacts, key: ['app_id', 'on_call'] })).toEqual(['One row is Application: its key is the one column that holds Application’s app_id']);
    const next = await derive(withSource(estate, contacts));
    expect(validateDocument(next)).toEqual([]);
    expect(next.ontology!.rows).toContainEqual({ dataset: 'app_contacts', of: 'application', key: 'app_id' });
    // No kind of thing is made for it: the ontology has the one its rows are.
    expect(next.ontology!.objectTypes.map((t) => t.id)).toEqual(estate.ontology!.objectTypes.map((t) => t.id));
    expect(await derive(withoutSource(next, 'app_contacts')).then((d) => d.ontology)).toEqual(estate.ontology);
  });

  it('leaves a meaning an estate shares to the estate: its own entry is written only to read the column under the file’s name', async () => {
    const base = await loadFlowDir(signinsDir);
    const s = spec({ columns: [...spec().columns.slice(0, 2), { column: 'country', type: 'TEXT', description: 'Our own words for it', fromFile: 'Country Code' }, { column: 'hour', type: 'INTEGER', description: 'More of our own words' }, ...spec().columns.slice(3)] });
    const shared = (c: string) => c === 'country' || c === 'hour';
    const next = await derive(withSource(base, s, shared));
    expect(validateDocument(next)).toEqual([]);
    const own = next.ontology!.properties!.filter((p) => p.datasets?.[0] === 'vendors' && shared(p.column));
    // The hour is the estate's, as it is: nothing is said again. The country is read from the file's other name, and the
    // entry that says so is marked as the override it is, in the estate's words.
    expect(own).toEqual([{ column: 'country', title: 'Country', description: describedAlready(base.ontology, 'vendors', 'country')!.description, datasets: ['vendors'], fromFile: 'Country Code', override: { reason: 'The file names it Country Code' } }]);
    expect(readAsOf(next.ontology, 'vendors')).toEqual([['Country Code', 'country']]);
    // Where no estate says it, the adder's words are the file's own.
    expect((await derive(withSource(base, s))).ontology!.properties!.filter((p) => p.datasets?.[0] === 'vendors' && shared(p.column)).map((p) => [p.column, p.description, p.override])).toEqual([['country', 'Our own words for it', undefined], ['hour', 'More of our own words', undefined]]);
  });

  it('is taken out again, whole, where no step of the flow reads it', async () => {
    const base = await loadFlowDir(signinsDir);
    const one = await derive(withSource(base, spec()));
    expect(sourceReaders(one, 'vendors')).toEqual([]);
    expect(sourceReaders({ steps: [...one.steps, { id: 'by_country', kind: 'sql', inputs: ['vendors_checked'] }] } as never, 'vendors')).toEqual(['by_country']);
    const back = await derive(withoutSource(one, 'vendors'));
    expect(validateDocument(back)).toEqual([]);
    expect(back.sources).toEqual(base.sources);
    expect(back.notebooks!.map((n) => n.path)).toEqual(base.notebooks!.map((n) => n.path));
    expect(back.ontology).toEqual(base.ontology);
    expect(back.steps.map((s) => s.id)).toEqual(base.steps.map((s) => s.id));
    // One of two leaves the other as it was.
    const offices: SourceSpec = { id: 'offices', description: '', row: { one: 'office', many: 'offices' }, key: ['office_id'], columns: [{ column: 'office_id', type: 'TEXT', description: 'The office' }] };
    const two = await derive(withSource(one, offices));
    const left = await derive(withoutSource(two, 'vendors'));
    expect(sourcesAdded(left)).toEqual(['offices']);
    expect(left.ontology!.aside).toBeUndefined();
    expect(left.ontology!.nouns).toEqual({ ...(base.ontology!.nouns ?? {}), offices: { one: 'office', many: 'offices' } });
    // A source the flow shipped with isn't one added here.
    expect(withoutSource(one, 'auth')).toBe(one);
  });
});

describe('a flow in an older format, brought up (ADR 0027 §4, Q-274)', () => {
  it('is asked what one row of each file is, and may say it with a noun', async () => {
    // The controls posture is format 4: its inventory doesn't say what one row is.
    const controls = await loadFlowDir(new URL('../examples/controls/', import.meta.url));
    expect(controls.smaltfl).toBe(4);
    const asked = validateDocument({ ...controls, smaltfl: 5 } as FlowDocument);
    expect(asked.map((i) => i.path)).toEqual(['$.sources[0]']);
    const source = controls.sources[0]!.id;
    expect(rowProblems(controls, source, { one: 'application', many: 'applications' })).toEqual([]);
    expect(rowProblems(controls, source, { one: '', many: 'applications' })).toEqual(['Say what one row is: one of them, and many']);
    expect(rowProblems(controls, source, { one: 'application we run', many: 'applications' })).toEqual(['Say what one row is in a word or two: “vendor” and “vendors”']);
    expect(rowProblems(controls, 'nothing', { one: 'a', many: 'b' })).toEqual(['nothing isn’t a file of this flow']);
    const said = withRowSaid(controls, source.toUpperCase(), { one: ' application ', many: 'applications' });
    expect(said.ontology!.nouns![source]).toEqual({ one: 'application', many: 'applications' });
    // A noun is display: the flow as format 4 is still itself, and as format 5 nothing is asked of the document.
    expect(validateDocument(said)).toEqual([]);
    expect(validateDocument({ ...said, smaltfl: 5 } as FlowDocument)).toEqual([]);
    expect((await translate(said, { day: '2024-03-05' })).nodes).toEqual((await translate(controls, { day: '2024-03-05' })).nodes);
  });
});

describe('a description written ahead, and the file bound to it', () => {
  const SBOM: AwaitedDataset = {
    id: 'sbom_inventory', name: 'SBOM inventory', description: 'Each application’s bill of materials', row: { one: 'component list', many: 'component lists' }, key: ['app_id'],
    columns: [{ column: 'app_id', title: 'Application', description: 'The application it is of' }, { column: 'components', description: 'How many components it lists' }, { column: 'status', description: 'pass or fail' }],
  };
  const FILE = 'AppID,Components,scanner,status\napp-1,120,syft,pass\napp-2,48,syft,fail\n';

  it('waits for data until a source of its name is in the flow', async () => {
    const base = await loadFlowDir(signinsDir);
    const described = describeAhead(base, SBOM).doc;
    expect(waitingForData(described).map((a) => a.id)).toEqual(['sbom_inventory']);
    expect(waitingForData(base)).toEqual([]);
  });

  it('maps the file’s columns onto the described ones: the same name, or the one close name', () => {
    const read = readFile(FILE);
    expect(matchAwaited(SBOM, read)).toEqual([{ column: 'app_id', from: 'AppID', by: 'close' }, { column: 'components', from: 'Components', by: 'name' }, { column: 'status', from: 'status', by: 'name' }]);
    // Two close names for one column: a person says which.
    expect(matchAwaited(SBOM, readFile('app_id2,app_idx,components,status\na,b,1,pass\n'))[0]).toEqual({ column: 'app_id', from: null, by: null });
    expect(awaitedProblems(SBOM, { app_id: 'AppID', components: 'Components', status: 'status' })).toEqual([]);
    expect(awaitedProblems(SBOM, { app_id: null, components: 'Components', status: 'status' })).toEqual(['The file has no column read as app_id: every described column is read from one of the file’s']);
    expect(awaitedProblems(SBOM, { app_id: 'AppID', components: 'AppID', status: 'status' })).toEqual(['appid would be read as two described columns']);
  });

  it('gives the source the description asks for, the file’s other columns left to describe or set aside', async () => {
    const base = describeAhead(await loadFlowDir(signinsDir), SBOM).doc;
    const read = readFile(FILE);
    const s = specOfAwaited(SBOM, read, { app_id: 'AppID', components: 'Components', status: 'status' });
    expect(s).toEqual({
      id: 'sbom_inventory', description: 'Each application’s bill of materials', row: { one: 'component list', many: 'component lists' }, key: ['app_id'],
      columns: [
        { column: 'app_id', type: 'TEXT', description: 'The application it is of', title: 'Application', fromFile: 'AppID' },
        // Its name in the file differs only in its case: the same column, nothing to read as another.
        { column: 'components', type: 'INTEGER', description: 'How many components it lists' },
        { column: 'scanner', type: 'TEXT' },
        { column: 'status', type: 'TEXT', description: 'pass or fail' },
      ],
    });
    expect(sourceProblems(base, s)).toEqual(['scanner is neither described nor set aside']);
    s.columns[2]!.aside = true;
    expect(sourceProblems(base, s)).toEqual([]);
    const next = await derive(withSource(base, s));
    expect(validateDocument(next)).toEqual([]);
    // It has its data: the description stays, the record of what was asked for.
    expect(waitingForData(next)).toEqual([]);
    expect(next.ontology!.awaited!.map((a) => a.id)).toEqual(['sbom_inventory']);
    // The file's names are read as the described ones, and the column set aside is the file's.
    expect(readAsOf(next.ontology, 'sbom_inventory')).toEqual([['AppID', 'app_id']]);
    expect(next.ontology!.aside).toEqual({ sbom_inventory: ['scanner'] });
    expect(bindingOfSource(base, s).columns).toEqual([['app_id', 'TEXT'], ['components', 'INTEGER'], ['status', 'TEXT']]);
    // Taken out again, it waits for data once more.
    expect(waitingForData(await derive(withoutSource(next, 'sbom_inventory'))).map((a) => a.id)).toEqual(['sbom_inventory']);
  });
});

describe('a source added, through the engine', () => {
  const data = JSON.parse(readFileSync(new URL('../examples/security-signins.data.json', import.meta.url), 'utf8')) as DataBindings;
  const DAY = '2024-03-05';
  const open = async () => {
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    const b = data.sources.auth!;
    await pinFile(db, b.file, utf8(csvOf(securityRows(securityDays(SIGNIN_DEMO).find((p) => p.day === DAY)!, 0.03))));
    await db.execAsync(pinnedDdl(b));
    return db;
  };
  // The checks alone hold here: the day's story isn't told in this test.
  const go = (db: Database, doc: FlowDocument) => runFlow(db, { ...doc, publish: { hold: ['checks'], period: 'day', watch: {} } } as FlowDocument, { smaltdb: SMALTDB, parameters: { day: DAY } });

  it('is read by the day’s run and published as checked: the columns the flow takes, a blank key warned of', async () => {
    const base = await loadFlowDir(signinsDir);
    const file = `${VENDORS},No Id Ltd,FR,3,1,00416,\n`;
    const s = spec();
    const next = await derive(withSource(base, s));
    const db = await open();
    try {
      const b = bindingOfSource(base, s);
      await pinFile(db, b.file, utf8(file));
      await db.execAsync(pinnedDdl(b, readAsOf(next.ontology, s.id)));
      const r = await go(db, next);
      expect(r.holds).toEqual([]);
      expect(r.published).toContain('vendors_checked');
      expect(db.query('SELECT vendor_id, name, country, tier, "Risk Score" FROM vendors_checked ORDER BY name').rows).toEqual([
        ['v-001', 'Acme Hosting', 'US', 1, 7.5], ['v-002', 'Birch Data', 'DE', 2, 3], ['v-003', 'Cedar Mail', 'US', 2, 4.25], ['v-004', 'Dune Pay', 'GB', 1, 9], [null, 'No Id Ltd', 'FR', 3, 1],
      ]);
      // A column set aside isn't one the source declares: no step can read it.
      expect(() => db.query('SELECT notes FROM vendors_checked')).toThrow();
      const node = r.manifest.nodes.find((n) => n.origin === 'vendors_checked')!;
      expect(node.expectations).toEqual({ rows: 5, dropped: 0, rules: [{ name: 'has_vendor_id', onFail: 'warn', failed: 1 }] });
      // The file's header has the columns set aside: noted as new by the run, and the ontology says they are set aside.
      expect(r.manifest.nodes.find((n) => n.origin === 'vendors')!.columns?.added).toEqual(['contract_no', 'notes']);
    } finally {
      db.close();
    }
  });

  it('reads a column under the file’s other name as the described one', async () => {
    const SBOM: AwaitedDataset = { id: 'sbom_inventory', name: 'SBOM inventory', row: { one: 'component list', many: 'component lists' }, key: ['app_id'], columns: [{ column: 'app_id', description: 'The application it is of' }, { column: 'components', description: 'How many components it lists' }] };
    const base = describeAhead(await loadFlowDir(signinsDir), SBOM).doc;
    const text = 'AppID,components,scanner\napp-1,120,syft\napp-2,48,syft\n';
    const s = specOfAwaited(SBOM, readFile(text), { app_id: 'AppID', components: 'components' });
    s.columns.find((c) => c.column === 'scanner')!.aside = true;
    const next = await derive(withSource(base, s));
    const db = await open();
    try {
      const b = bindingOfSource(base, s);
      await pinFile(db, b.file, utf8(text));
      await db.execAsync(pinnedDdl(b, readAsOf(next.ontology, s.id)));
      const r = await go(db, next);
      expect(r.holds).toEqual([]);
      expect(db.query('SELECT app_id, components FROM sbom_inventory_checked ORDER BY app_id').rows).toEqual([['app-1', 120], ['app-2', 48]]);
    } finally {
      db.close();
    }
  });
});
