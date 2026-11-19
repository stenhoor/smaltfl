/**
 * Ontology first, document format 5 (ADR 0027 §4, §5; Q-252, Q-254, Q-274): a notebook flow whose every source says
 * what one row is, whose every change set says its kind and why, whose closed lists are enforced, and whose files'
 * columns are each described or set aside. Here: what the document accepts, what a source still lacks where its
 * columns are known, the edit that sets a column aside, and every example flow of the repository held to it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { editTargets } from '../src/core/attribute.js';
import { asideOf, awaitedIssues, awaitedOf, columnDescribed, isAside, rowSaid, undescribed, undescribedSaid } from '../src/core/described.js';
import { changesProblems, DOCUMENT_FORMATS, EDIT_OPS, validateDocument, type ChangeSet, type FlowDocument } from '../src/core/document.js';
import { describeAhead, setAside } from '../src/core/flowedit.js';
import { applyEdit, resolve, rulesHash } from '../src/core/inforce.js';
import { expandNotebooks } from '../src/core/notebook.js';
import type { AwaitedDataset } from '../src/core/ontology.js';
import { translate } from '../src/core/plan.js';
import { defaultKind, livesOf, registerOf, shortOf, subjectOf } from '../src/core/register.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

const NB = `import { cell, param, sql } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';
cell('params');
export const params = param({ day: param.text('') });
cell('controls');
export const controls = source('controls');
cell('controls_checked');
export const controls_checked = check(controls, { rules: [{ name: 'has_id', check: "control_id IS NOT NULL", onFail: 'drop' }] });
cell('weights', { lang: 'sql' });
export const weights = sql\`SELECT control_id, weight FROM \${controls_checked}\`;
cell('published');
publish(weights);
`;
const ONTOLOGY = {
  objectTypes: [{ id: 'control', name: 'Control', dataset: 'controls', key: ['control_id'], title: 'name' }], linkTypes: [], actionTypes: [],
  properties: [
    { column: 'control_id', title: 'Control', description: 'The control’s id in the catalogue' },
    { column: 'name', title: 'Name', description: 'What people call it' },
    { column: 'weight', title: 'Weight', description: '' },
  ],
};
const flow = (more: Record<string, unknown> = {}): FlowDocument =>
  ({
    smaltfl: 5, id: 'first', name: 'Ontology first', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
    sources: [{ id: 'controls', table: 'controls_file' }],
    notebooks: [{ path: 'a.nb.ts', source: NB }],
    publish: { hold: ['checks'], period: 'day', watch: {} },
    ontology: ONTOLOGY,
    ...more,
  }) as unknown as FlowDocument;
const doc = (more?: Record<string, unknown>) => expandNotebooks(flow(more), ts);
const messages = (d: FlowDocument) => validateDocument(d).map((i) => `${i.path}: ${i.message}`);
const COLUMNS = ['control_id', 'name', 'weight', 'cadence'];

describe('document format 5', () => {
  it('is a notebook flow’s, read beside the formats before it', async () => {
    expect(DOCUMENT_FORMATS).toEqual([1, 2, 3, 4, 5]);
    expect(validateDocument(await doc())).toEqual([]);
    // The plan is a notebook flow's, whichever of the two formats says so.
    expect((await translate(await doc(), { day: '2024-03-01' })).smaltflPlan).toBe(3);
    const { notebooks: _n, ...bare } = flow();
    expect(validateDocument({ ...bare, steps: [] }).map((i) => i.message)).toContain('expected 2: format 5 is for a document with notebooks, the ontology first');
    // A format-4 document of the same flow is one too, as it always was.
    expect(validateDocument(await doc({ smaltfl: 4 }))).toEqual([]);
  });

  it('asks every source what one row is: a rows entry, a type over it, or a noun', async () => {
    const none = { ...ONTOLOGY, objectTypes: [] };
    expect(messages(await doc({ ontology: none }))).toEqual(['$.sources[0]: the ontology doesn’t say what one row of controls is: a rows entry, a type whose objects are its rows, or a noun (format 5 puts the ontology first)']);
    expect(validateDocument(await doc({ ontology: { ...none, nouns: { controls: { one: 'control', many: 'controls' } } } }))).toEqual([]);
    // Format 4 asks nothing of it.
    expect(validateDocument(await doc({ smaltfl: 4, ontology: none }))).toEqual([]);
  });

  it('asks every change set its kind, and why', async () => {
    const set = (x: Partial<ChangeSet>): ChangeSet => ({ id: 'c', from: '2024-03-05', recorded: '2024-03-05T09:00:00Z', by: 'owner', why: 'The board said so', kind: 'business', edits: [{ op: 'setCheck', node: 'controls', check: 'amount', mode: 'warn' }], ...x });
    expect(validateDocument(await doc({ changes: [set({})] }))).toEqual([]);
    const { kind: _k, ...unkinded } = set({});
    expect(messages(await doc({ changes: [unkinded] }))).toEqual(['$.changes[0].kind: a format-5 change set says its kind: one of business, retuned, corrected, source, described']);
    expect(messages(await doc({ changes: [set({ why: '  ' })] }))).toEqual(['$.changes[0].why: a format-5 change set says why, in a line']);
    expect(validateDocument(await doc({ smaltfl: 4, changes: [unkinded] }))).toEqual([]);
  });

  it('asks a closed list for the check step that enforces it', async () => {
    const closed = { id: 'c_closed', file: 'controls', column: 'control_id', kind: 'closed', entries: [['mfa']], action: 'hold' };
    expect(validateDocument(await doc({ ontology: { ...ONTOLOGY, rules: [closed] } }))).toEqual([]);
    const unchecked = flow({ ontology: { ...ONTOLOGY, rules: [closed] } });
    unchecked.notebooks![0]!.source = NB.replace(/cell\('controls_checked'\);\n.*\n/, '').replace('${controls_checked}', '${controls}');
    expect(messages(await expandNotebooks(unchecked, ts))).toEqual(['$.ontology.rules[0]: no check step reads controls: a closed list is enforced where its file comes into the flow']);
  });

  it('keeps the columns a file has that the flow doesn’t take, by name', async () => {
    expect(validateDocument(await doc({ ontology: { ...ONTOLOGY, aside: { controls: ['notes', 'legacy_id'] } } }))).toEqual([]);
    expect(messages(await doc({ ontology: { ...ONTOLOGY, aside: { feeds: ['x'] } } }))).toEqual(['$.ontology.aside.feeds: no source feeds: a column is set aside in a file']);
    expect(messages(await doc({ ontology: { ...ONTOLOGY, aside: { controls: ['notes', 'Notes'] } } }))).toEqual(['$.ontology.aside.controls: its columns set aside, each once; absent when there are none']);
    expect(messages(await doc({ ontology: { ...ONTOLOGY, aside: { controls: [] } } }))).toEqual(['$.ontology.aside.controls: its columns set aside, each once; absent when there are none']);
    expect(messages(await doc({ smaltfl: 4, ontology: { ...ONTOLOGY, aside: { controls: ['notes'] } } }))).toEqual(['$.ontology.aside: the columns set aside are a format-5 document’s (the ontology first)']);
  });
});

describe('what a source still lacks, where its columns are known', () => {
  it('says each column not described, and each set aside that is declared all the same', async () => {
    const d = await doc();
    expect(rowSaid(d.ontology, 'controls')).toBe(true);
    expect([columnDescribed(d.ontology, 'controls', 'name'), columnDescribed(d.ontology, 'controls', 'weight'), columnDescribed(d.ontology, 'controls', 'cadence')]).toEqual([true, false, false]);
    const lacking = undescribed(d, () => COLUMNS);
    expect(lacking).toEqual([{ source: 'controls', row: false, columns: ['weight', 'cadence'], taken: [] }]);
    expect(undescribedSaid(lacking[0]!)).toBe('controls: weight and cadence aren’t described');
    // Without its columns, only what a row is can be asked.
    expect(undescribed(d, () => null)).toEqual([]);
    const aside = await doc({ ontology: { ...ONTOLOGY, objectTypes: [], nouns: {}, aside: { controls: ['name'] } } });
    expect(undescribed(aside, () => COLUMNS).map(undescribedSaid)).toEqual(['controls: what one row is isn’t said; weight and cadence aren’t described; name is set aside and declared all the same']);
  });

  it('sets a column aside and takes it back, the ontology’s own, in the rules in force', async () => {
    const d = await doc();
    const aside = setAside(d, 'Controls', 'legacy_id', true);
    expect(aside.said).toBe('Set controls’s column legacy_id aside: the flow doesn’t take it');
    expect(asideOf(aside.doc.ontology, 'controls')).toEqual(['legacy_id']);
    expect(isAside(aside.doc.ontology, 'CONTROLS', 'Legacy_ID')).toBe(true);
    expect(validateDocument(aside.doc)).toEqual([]);
    expect(setAside(aside.doc, 'controls', 'LEGACY_ID', true)).toEqual({ doc: aside.doc, said: null });
    expect(await rulesHash(aside.doc)).not.toBe(await rulesHash(d));
    const back = setAside(aside.doc, 'controls', 'legacy_id', false);
    expect(back.said).toBe('Took controls’s column legacy_id back from aside');
    expect(back.doc.ontology).not.toHaveProperty('aside');
    expect(await rulesHash(back.doc)).toBe(await rulesHash(d));
  });
});

describe('a dataset described before its data exists (ADR 0027 §5, Q-255)', () => {
  const SBOM: AwaitedDataset = {
    id: 'sbom_inventory', name: 'SBOM inventory', description: 'Each application’s bill of materials', row: { one: 'component list', many: 'component lists' }, key: ['app_id'],
    columns: [{ column: 'app_id', title: 'Application', description: 'The application it is of' }, { column: 'components', description: 'How many components it lists' }],
  };
  const withAwaited = (awaited: unknown) => doc({ ontology: { ...ONTOLOGY, awaited } });

  it('is the ontology’s, in a format-5 document: well formed, and each once', async () => {
    expect(validateDocument(await withAwaited([SBOM]))).toEqual([]);
    expect(awaitedOf((await withAwaited([SBOM])).ontology).map((a) => a.id)).toEqual(['sbom_inventory']);
    expect(awaitedOf((await doc()).ontology)).toEqual([]);
    expect(messages(await doc({ smaltfl: 4, ontology: { ...ONTOLOGY, awaited: [SBOM] } }))).toEqual(['$.ontology.awaited: a dataset described ahead of its data is a format-5 document’s (the ontology first)']);
    expect(messages(await withAwaited([]))).toEqual(['$.ontology.awaited: the datasets described ahead of their data: a list of one or more; absent when there are none']);
    expect(messages(await withAwaited([SBOM, { ...SBOM, name: 'Again' }]))).toEqual(['$.ontology.awaited[1].id: sbom_inventory is described ahead twice']);
    // One whose name is a dataset of the flow has its data: it stays, the record of what was asked for.
    expect(validateDocument(await withAwaited([{ ...SBOM, id: 'controls' }]))).toEqual([]);
  });

  it('says what one lacks, field by field', () => {
    const lacks = (x: Record<string, unknown>) => awaitedIssues({ ...SBOM, ...x }).map(([path, message]) => `${path}: ${message}`);
    expect(awaitedIssues(SBOM)).toEqual([]);
    expect(awaitedIssues('sbom')).toEqual([['', 'a dataset described ahead of its data: { id, name, row: { one, many }, key, columns }']]);
    expect(lacks({ id: 'SBOM inventory' })).toEqual(['.id: the dataset’s name: lower-case letters, digits and underscores, starting with a letter']);
    expect(lacks({ name: ' ' })).toEqual(['.name: what people call it']);
    expect(lacks({ row: { one: 'bill' } })).toEqual(['.row: what one row is: { one, many }, one or two words each']);
    expect(lacks({ row: { one: 'bill of materials', many: 'bills of materials' } })).toEqual(['.row: what one row is: { one, many }, one or two words each']);
    expect(lacks({ key: [] })).toEqual(['.key: the columns that tell one row from another: a list of one or more']);
    expect(lacks({ key: ['app'] })).toEqual(['.key: app isn’t one of its columns']);
    expect(lacks({ key: ['app_id', 'APP_ID'] })).toEqual(['.key: each key column once']);
    expect(lacks({ columns: [] })).toEqual(['.columns: its columns: a list of one or more, each { column, description }']);
    expect(lacks({ columns: [{ column: 'app_id', description: '' }] })).toEqual(['.columns[0].description: what app_id holds: a described dataset describes every column']);
    expect(lacks({ columns: [...SBOM.columns, { column: 'App_ID', description: 'Again' }] })).toEqual(['.columns[2].column: App_ID is named twice']);
    expect(lacks({ columns: [{ column: 'app_id', description: 'x', type: 'TEXT' }] })).toEqual(['.columns[0].type: not a setting of a described column: column, title, description']);
    expect(lacks({ from: '2024-03-27' })).toEqual(['.from: not a setting of a dataset described ahead: id, name, description, row, key, columns']);
  });

  it('is written by an edit, said in words, and replaced by a later description of the same dataset', async () => {
    const d = await doc();
    const first = describeAhead(d, { ...SBOM, name: ' SBOM inventory ' });
    expect(first.said).toBe('Described sbom_inventory ahead of its data: one row is a component list, by app_id; 2 columns');
    expect(first.doc.ontology!.awaited).toEqual([SBOM]);
    expect(validateDocument(first.doc)).toEqual([]);
    expect(describeAhead(first.doc, SBOM)).toEqual({ doc: first.doc, said: null });
    const again = describeAhead(first.doc, { ...SBOM, key: ['app_id', 'components'], row: { one: 'entry', many: 'entries' } });
    expect(again.said).toBe('Described sbom_inventory again, still ahead of its data: one row is an entry, by app_id and components; 2 columns');
    expect(again.doc.ontology!.awaited).toHaveLength(1);
    // Another dataset is another entry, after it.
    expect(describeAhead(first.doc, { ...SBOM, id: 'licences', name: 'Licences' }).doc.ontology!.awaited!.map((a) => a.id)).toEqual(['sbom_inventory', 'licences']);
  });

  it('is a dated change: in force from its day, as known when it was recorded, and part of the rules in force', async () => {
    expect(EDIT_OPS).toContain('describeAhead');
    const change: ChangeSet = { id: 'sbom-described', from: '2024-03-27', recorded: '2024-03-27T09:10:00Z', by: 'owner', why: 'The board asked for it before any tool reports on it', kind: 'business', edits: [{ op: 'describeAhead', dataset: SBOM }], agreed: [{ by: 'owner', at: '2024-03-27T09:10:00Z' }] };
    expect(changesProblems([change])).toEqual([]);
    expect(changesProblems([{ ...change, edits: [{ op: 'describeAhead', dataset: { ...SBOM, key: [] } }] } as ChangeSet]).map((i) => `${i.path}: ${i.message}`))
      .toEqual(['$.changes[0].edits[0].dataset.key: the columns that tell one row from another: a list of one or more']);
    const d = await doc({ changes: [change] });
    expect(validateDocument(d)).toEqual([]);
    expect(awaitedOf(resolve(d, '2024-03-26').doc.ontology)).toEqual([]);
    expect(awaitedOf(resolve(d, '2024-03-27').doc.ontology).map((a) => a.id)).toEqual(['sbom_inventory']);
    expect(awaitedOf(resolve(d, '2024-03-28', '2024-03-27T09:00:00Z').doc.ontology)).toEqual([]);
    expect(resolve(d, '2024-03-27').applied.map((a) => a.said)).toEqual([['Described sbom_inventory ahead of its data: one row is a component list, by app_id; 2 columns']]);
    const bare = await doc();
    expect(applyEdit(bare, change.edits[0]!)!.said).toBe('Described sbom_inventory ahead of its data: one row is a component list, by app_id; 2 columns');
    expect(await rulesHash(resolve(d, '2024-03-27').doc)).not.toBe(await rulesHash(bare));
    expect(await rulesHash(resolve(d, '2024-03-26').doc)).toBe(await rulesHash(bare));
    // Nothing reads it yet: the plan is what it was.
    expect((await translate(d, { day: '2024-03-27' })).nodes.map((n) => n.origin)).toEqual((await translate(bare, { day: '2024-03-27' })).nodes.map((n) => n.origin));
  });

  it('hashes with the rules in force as the ontology writes it (rules/1): the vector', async () => {
    const small = { smaltfl: 5, id: 'f', name: 'F', sources: [], steps: [], ontology: { objectTypes: [], linkTypes: [], actionTypes: [], awaited: [{ id: 'sbom_inventory', name: 'SBOM inventory', row: { one: 'component list', many: 'component lists' }, key: ['app_id'], columns: [{ column: 'app_id', description: 'The application it is of' }] }] } } as unknown as FlowDocument;
    expect(await rulesHash(small)).toBe('330a5021ffbb273c8c0b49b3f37003ec327340169a28a9e9eeb13fa4714576f4');
  });

  it('is one thing on the register from the day it was described, a first description, and the flow’s own that wrote it', async () => {
    const edit = { op: 'describeAhead', dataset: SBOM } as const;
    expect(subjectOf(edit)).toEqual({ key: 'awaited:sbom_inventory', dataset: 'sbom_inventory', lane: 'is', what: 'described ahead of its data' });
    expect(shortOf(edit)).toBe('described');
    expect(defaultKind([edit])).toBe('described');
    expect(defaultKind([edit, { op: 'declareEntry', file: 'controls', rule: 'c_closed', entry: ['sbom'] }])).toBe('business');
    expect(editTargets(edit)).toEqual([]);
    const change: ChangeSet = { id: 'sbom-described', from: '2024-03-27', recorded: '2024-03-27T09:10:00Z', by: 'owner', why: 'Asked for', kind: 'described', edits: [edit] };
    const d = await doc({ changes: [change] });
    const days = ['2024-03-25', '2024-03-26', '2024-03-27', '2024-03-28'];
    const lives = livesOf(registerOf(d, { today: '2024-03-28' }).entries, days, '2024-03-28');
    expect(lives.map((l) => [l.subject.key, l.spans.map((sp) => [sp.from, sp.short])])).toEqual([['awaited:sbom_inventory', [['2024-03-27', 'described']]]]);
  });
});

describe('the example flows, the ontology first', () => {
  const FLOWS = ['larkspur', 'larkspur/hr', 'larkspur/inventory', 'larkspur/feeds', 'larkspur/applications', 'larkspur/catalogue/ownership', 'larkspur/catalogue/certificates', 'control-estate', 'security-signins', 'security-lockouts'];
  const columnsIn = (folder: string) => {
    const path = new URL(`../examples/${folder}/data.json`, import.meta.url);
    const sources = existsSync(path) ? ((JSON.parse(readFileSync(path, 'utf8')) as { sources?: Record<string, { columns?: [string, string][] }> }).sources ?? {}) : {};
    return (id: string) => sources[id]?.columns?.map((c) => c[0]) ?? null;
  };

  it.each(FLOWS)('%s is format 5: every source says what a row is, and every column its data’s list declares is described', async (folder) => {
    const d = await loadFlowDir(new URL(`../examples/${folder}/`, import.meta.url));
    expect(d.smaltfl).toBe(5);
    expect(validateDocument(d)).toEqual([]);
    expect(undescribed(d, columnsIn(folder)).map(undescribedSaid)).toEqual([]);
  });

  it('leaves the controls posture, an older example, in format 4: it runs as it always did, and says what it would lack', async () => {
    const d = await loadFlowDir(new URL('../examples/controls/', import.meta.url));
    expect(d.smaltfl).toBe(4);
    expect(validateDocument(d)).toEqual([]);
    // Asked as a format-5 flow would be: its inventory doesn't say what one row is.
    expect(validateDocument({ ...d, smaltfl: 5 } as FlowDocument).map((i) => i.path)).toEqual(['$.sources[0]']);
  });

  it('has the stories’ change sets say their kind and why', () => {
    for (const story of ['larkspur/story.json', 'larkspur/tour.json', 'larkspur/feeds/tour.json']) {
      const changes = (JSON.parse(readFileSync(new URL(`../examples/${story}`, import.meta.url), 'utf8')) as { changes?: ChangeSet[] }).changes ?? [];
      for (const c of changes) expect([c.id, !!c.kind, c.why.trim() !== ''], story).toEqual([c.id, true, true]);
    }
  });
});
