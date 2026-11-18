/**
 * Ontology first, document format 5 (ADR 0027 §4, §5; Q-252, Q-254, Q-274): a notebook flow whose every source says
 * what one row is, whose every change set says its kind and why, whose closed lists are enforced, and whose files'
 * columns are each described or set aside. Here: what the document accepts, what a source still lacks where its
 * columns are known, the edit that sets a column aside, and every example flow of the repository held to it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { asideOf, columnDescribed, isAside, rowSaid, undescribed, undescribedSaid } from '../src/core/described.js';
import { DOCUMENT_FORMATS, validateDocument, type ChangeSet, type FlowDocument } from '../src/core/document.js';
import { setAside } from '../src/core/flowedit.js';
import { rulesHash } from '../src/core/inforce.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { translate } from '../src/core/plan.js';
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
