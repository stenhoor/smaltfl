/**
 * Declarations proposed from a file's own data (ADR 0022 §5, Q-139, Q-213 to Q-216): a coded column's values, each common
 * value's band and a likely key, read from the day's rows, the history and the kept sample; nothing applies until the
 * owner accepts it, as the edits of a dated change set, which replay through `resolve` like any rule edit.
 */
import { describe, expect, it } from 'vitest';
import type { SampleFile } from '../src/core/apart.js';
import { plusDays } from '../src/core/calendar.js';
import { changesProblems, validateDocument, type FlowDocument } from '../src/core/document.js';
import { writtenRules } from '../src/core/gates.js';
import type { HistoryFile } from '../src/core/history.js';
import { applyEdit, resolve, rulesHash } from '../src/core/inforce.js';
import { appendPeriods, emptyHistory, measuresOf, watchColumns, type MeasureSettings } from '../src/core/measures.js';
import { marksOn, propertyOf } from '../src/core/ontology.js';
import { ontologyPage } from '../src/core/ontologypage.js';
import { MAX_CODES, proposalsOf, shareRange, valueCandidates, type BandsProposal, type KeyProposal, type Proposal, type ValuesProposal } from '../src/core/proposals.js';
import type { Kind, Profile } from '../src/core/quality.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { ts } from './helpers/notebooks.js';

const SETUP = "import { cell, param, sql } from 'smaltnb';\nimport { gate, publish, source } from 'smaltfl/notebook';\n";
/** The notebook: the day's backup jobs, a gate on them (or none), a step reading them, published. */
const nb = (gateCell: string | null) => `${SETUP}
cell('params');
export const params = param({ day: param.text('') });
cell('jobs');
export const jobs = source('jobs');
${gateCell ? `cell('jobs_gate');\nexport const jobs_gate = ${gateCell};\n` : ''}cell('done', { lang: 'sql' });
export const done = sql\`SELECT job_id, status FROM \${jobs}\`;
cell('published');
publish(done);
`;

/** A backup feed: a job a row, the controller that ran it, how it went; status counted and described, the rest not. */
const doc = (o: { gated?: boolean; values?: 'hold' | 'warn' | 'off'; reconcile?: 'off' } = {}): Promise<FlowDocument> => {
  const checks = { ...(o.values ? { values: o.values } : {}), ...(o.reconcile ? { reconcile: o.reconcile } : {}) };
  return expandNotebooks(
    {
      smaltfl: 4,
      id: 'backups',
      name: 'Backups',
      steps: [],
      parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
      sources: [{ id: 'jobs', table: 'jobs_file', description: 'The backup jobs, one file a day' }],
      notebooks: [{ path: 'a.nb.ts', source: nb(o.gated === false ? null : `gate(jobs, { layer: 'bronze'${Object.keys(checks).length ? `, checks: ${JSON.stringify(checks).replace(/"/g, "'")}` : ''} })`) }],
      publish: { hold: ['wrong'], period: 'day', watch: { jobs: { history: 'history.json' } } },
      ontology: {
        objectTypes: [],
        linkTypes: [],
        actionTypes: [],
        nouns: { jobs: { one: 'job', many: 'jobs' } },
        properties: [{ column: 'status', title: 'Status', description: 'How the job went', values: { ok: 'Succeeded', failed: 'Failed', partial: 'Partly done' }, datasets: ['jobs'] }],
      },
    } as unknown as FlowDocument,
    ts,
  );
};

const fact = (rows: number, present: number, distinct: number): Profile['facts'] => ({ rows, present, distinct, min: null, max: null, mean: null });
const profile = (name: string, kind: Kind, facts: Profile['facts']): Pick<Profile, 'name' | 'kind' | 'facts'> => ({ name, kind, facts });

/** The day's columns as the app counts them: 400 jobs, each id once, three controllers, three statuses, a free note. */
const today = (o: { blankIds?: number; repeatIds?: number; rows?: number } = {}) => {
  const rows = o.rows ?? 400;
  return [
    profile('job_id', 'text', fact(rows, rows - (o.blankIds ?? 0), rows - (o.blankIds ?? 0) - (o.repeatIds ?? 0))),
    profile('controller', 'category', fact(rows, rows, 3)),
    profile('status', 'category', fact(rows, rows, 3)),
    profile('note', 'text', fact(rows, 120, 118)),
    profile('filled_from', 'category', fact(rows, 0, 0)),
  ];
};
const VALUES = new Map<string, readonly string[]>([['controller', ['vault-b', 'vault-a', 'tape']]]);

/** A day's measures: status counted (ok, failed, partial by share), the ids all there unless some are blank. */
function measured(day: string, shares: { ok: number; failed: number; partial: number }, blank = 0) {
  const rows = 400;
  const s: MeasureSettings = { source: 'jobs', slot: day, every: 'day', checks: null, counting: null, counted: ['status'], followed: [], paired: [], time: null, zone: null, sample: 2000 };
  const scan: unknown[][] = [];
  for (const [v, share] of Object.entries(shares)) for (let i = 0; i < Math.round(share * rows); i++) scan.push([v]);
  while (scan.length < rows) scan.push(['ok']);
  scan.length = rows;
  const facts: unknown[] = [rows, rows - blank, rows - blank, null, null, null, rows, 3, null, null, null, rows, 3, null, null, null];
  return measuresOf(s, { file: null, snapshot: 'x'.repeat(64), schema: [['job_id', 'text'], ['controller', 'text'], ['status', 'text']], facts, sample: [], scan, checks: null });
}

/** Thirty days of history before Mar 1: ok between 88% and 92% of jobs, failed 5% to 9%, partial at 3%; one odd day. */
function history(o: { blankOn?: string; oddOn?: string } = {}): HistoryFile {
  const days = Array.from({ length: 30 }, (_, i) => plusDays('2024-01-31', i));
  const ms = days.map((d, i) => {
    const failed = 0.05 + (i % 5) * 0.01;
    const odd = d === o.oddOn;
    return measured(d, odd ? { ok: 0.2, failed: 0.77, partial: 0.03 } : { ok: 0.97 - failed, failed, partial: 0.03 }, d === o.blankOn ? 4 : 0);
  });
  const m0 = ms[0]!;
  return appendPeriods(emptyHistory({ flow: 'backups', source: 'jobs', settings: { checks: null, counted: ['status'], followed: [], paired: [], time: null, zone: null, sample: 2000 }, columns: m0.columns, types: m0.types, kinds: m0.kinds }), ms);
}

/** The kept sample: five days of rows, each id once, the controllers as today's (and on two days, a fourth). */
function sample(o: { fourthOn?: number; repeatOn?: number } = {}): SampleFile {
  const days = ['2024-02-25', '2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29'];
  const rows = days.map((d, k) =>
    Array.from({ length: 20 }, (_, i) => [`J-${d}-${o.repeatOn === k && i === 1 ? 0 : i}`, k >= (o.fourthOn ?? 99) && i === 3 ? 'cloud' : ['vault-a', 'vault-b', 'tape'][i % 3], i % 9 === 0 ? 'failed' : 'ok', null]));
  return { format: 'smaltfl-sample/0', flow: 'backups', source: 'jobs', columns: ['job_id', 'controller', 'status', 'note'], kinds: ['text', 'category', 'category', 'text'], keep: 200, days, rows };
}

const input = (d: FlowDocument, o: Partial<Parameters<typeof proposalsOf>[0]> = {}) => ({ doc: d, file: 'jobs', day: '2024-03-01', profiles: today(), values: VALUES, history: history(), sample: sample(), ...o });
const ofKind = <K extends Proposal['kind']>(ps: Proposal[], kind: K) => ps.filter((p): p is Extract<Proposal, { kind: K }> => p.kind === kind);

describe('a coded column’s values', () => {
  it('proposes the values of a coded column nothing lists, every row one of them, in reading order', async () => {
    const d = await doc();
    expect(valueCandidates(d, 'jobs', today())).toEqual(['controller']);
    const [p] = ofKind(proposalsOf(input(d)), 'values') as ValuesProposal[];
    expect(p).toMatchObject({ id: 'values:jobs:controller', file: 'jobs', column: 'controller', title: 'List the 3 values of controller', values: ['tape', 'vault-a', 'vault-b'] });
    expect(p!.rests).toEqual(['400 rows with a value today, each one of them', 'The kept sample’s last 5 days hold no other']);
    expect(p!.edits).toEqual([{ op: 'declareValues', file: 'jobs', column: 'controller', values: ['tape', 'vault-a', 'vault-b'] }]);
  });

  it('adds a value the kept sample shows on two days or more, absent today; one seen once is left out', async () => {
    const twice = ofKind(proposalsOf(input(await doc(), { sample: sample({ fourthOn: 3 }) })), 'values')[0]!;
    expect(twice.values).toEqual(['cloud', 'tape', 'vault-a', 'vault-b']);
    expect(twice.rests.slice(0, 2)).toEqual(['400 rows with a value today, each one of 3 of them', 'The kept sample’s last 5 days add cloud']);
    const once = ofKind(proposalsOf(input(await doc(), { sample: sample({ fourthOn: 4 }) })), 'values')[0]!;
    expect(once.values).toEqual(['tape', 'vault-a', 'vault-b']);
    expect(once.rests[1]).toBe('The kept sample’s last 5 days hold no other on two days or more');
  });

  it('proposes nothing for a listed column, a free text, too many values, values used once, or the fill’s mark', async () => {
    const d = await doc();
    // status lists its values already; note is free text; filled_from is the fill's own mark.
    expect(valueCandidates(d, 'jobs', today())).not.toContain('status');
    const wide = [profile('region', 'category', fact(400, 400, MAX_CODES + 1)), profile('batch', 'code', fact(40, 40, 30)), profile('kind', 'code', fact(400, 400, 1))];
    expect(valueCandidates(d, 'jobs', wide)).toEqual([]);
    // Values the app read don't match its count (a sample, not the day's): nothing is proposed from them.
    expect(ofKind(proposalsOf(input(d, { values: new Map([['controller', ['tape', 'vault-a']]]) })), 'values')).toEqual([]);
  });

  it('takes whole numbers with no gap between them for a count, not codes; numbers with gaps are codes', async () => {
    const d = await doc();
    const profiles = [profile('open_highs', 'code', fact(400, 400, 4)), profile('rpo_hours', 'code', fact(400, 400, 3))];
    const ps = proposalsOf(input(d, { profiles, values: new Map([['open_highs', ['0', '1', '2', '3']], ['rpo_hours', ['4', '24', '72']]]), sample: null }));
    expect(ofKind(ps, 'values').map((p) => [p.column, p.values])).toEqual([['rpo_hours', ['4', '24', '72']]]);
  });

  it('proposes nothing for a column naming a type’s objects, or in a small file', async () => {
    const d = await doc();
    // controller is the key of a type of controllers: its values are that list's keys, not codes.
    d.ontology!.objectTypes.push({ id: 'controller', name: 'Controller', dataset: 'controllers', key: ['controller'], title: 'controller' });
    expect(valueCandidates(d, 'jobs', today())).toEqual([]);
    expect(valueCandidates(await doc(), 'jobs', today({ rows: 49 }))).toEqual([]);
  });

  it('accepted, lists them as codes meaning themselves, and the history builder counts the column', async () => {
    const d = await doc();
    const [p] = ofKind(proposalsOf(input(d)), 'values');
    expect(watchColumns(d, 'jobs').count).toEqual(['status']);
    const r = applyEdit(d, p!.edits[0]!)!;
    expect(r.said).toBe('Listed controller’s 3 values in jobs: tape, vault-a, vault-b');
    expect(propertyOf(r.doc.ontology, 'jobs', 'controller')).toMatchObject({ column: 'controller', values: { tape: 'tape', 'vault-a': 'vault-a', 'vault-b': 'vault-b' }, datasets: ['jobs'] });
    expect(watchColumns(r.doc, 'jobs').count).toEqual(['status', 'controller']);
    expect(validateDocument(r.doc)).toEqual([]);
    // Listed already: the same edit again changes nothing, and nothing more is proposed for it.
    expect(applyEdit(r.doc, p!.edits[0]!)).toBeNull();
    expect(ofKind(proposalsOf(input(r.doc)), 'values')).toEqual([]);
  });

  it('keeps a code someone worded, and makes a general property the file’s own to list them', async () => {
    const d = await doc();
    d.ontology!.properties!.push({ column: 'controller', title: 'Controller', description: 'What ran the job', values: { tape: 'The tape library' } });
    const r = applyEdit(d, { op: 'declareValues', file: 'jobs', column: 'controller', values: ['tape', 'vault-a'] })!;
    expect(r.said).toBe('Listed controller’s value in jobs: vault-a');
    const own = propertyOf(r.doc.ontology, 'jobs', 'controller')!;
    expect(own).toMatchObject({ title: 'Controller', values: { tape: 'The tape library', 'vault-a': 'vault-a' }, datasets: ['jobs'] });
    expect(r.doc.ontology!.properties!.filter((p) => p.column === 'controller')).toHaveLength(2);
  });
});

describe('each common value’s band', () => {
  it('proposes the usual range over the last 28 days, the middle nine in ten, five points either side', async () => {
    const [p] = ofKind(proposalsOf(input(await doc())), 'bands') as BandsProposal[];
    expect(p).toMatchObject({ id: 'bands:jobs:status', column: 'status', title: 'Bands for the 2 common values of status', days: 28 });
    // ok runs 88% to 92%, failed 5% to 9%; partial, at 3%, is too rare for a band.
    expect(p!.bands.map((b) => [b.value, b.share])).toEqual([['ok', [0.83, 0.97]], ['failed', [0, 0.14]]]);
    expect(p!.bands.map((b) => [b.value, shareRange(b.usual)])).toEqual([['ok', '88%–92%'], ['failed', '5%–9%']]);
    expect(p!.rests).toEqual(['Usual: each value’s share of jobs on the last 28 days, the middle nine days in ten']);
    expect(p!.does).toBe('Each band is its usual range five points either side. A day outside one holds the day, by the values check.');
    expect(p!.edits).toEqual([
      { op: 'acceptBand', source: 'jobs', band: { column: 'status', value: 'ok', share: [0.83, 0.97] } },
      { op: 'acceptBand', source: 'jobs', band: { column: 'status', value: 'failed', share: [0, 0.14] } },
    ]);
  });

  it('leaves out a day the record leaves out of learning, and the middle nine in ten keep one odd day out', async () => {
    const odd = history({ oddOn: '2024-02-20' });
    expect(ofKind(proposalsOf(input(await doc(), { history: odd })), 'bands')[0]!.bands.map((b) => b.share)).toEqual([[0.83, 0.97], [0, 0.14]]);
    // Two days of history left: too few to say what is usual.
    expect(ofKind(proposalsOf(input(await doc(), { day: '2024-02-02' })), 'bands')).toEqual([]);
  });

  it('proposes none on a file of under a hundred rows on its median day; a range rounding to one number is one', async () => {
    const small = history();
    const few = { ...small, rows: small.rows.map(() => 99) };
    expect(ofKind(proposalsOf(input(await doc(), { history: few })), 'bands')).toEqual([]);
    expect(shareRange([0.72, 0.7249])).toBe('72%');
    expect(shareRange([0.05, 0.09])).toBe('5%–9%');
  });

  it('proposes none for a column the day’s rows don’t show: one closed to the viewer is said nothing of', async () => {
    const hidden = today().filter((p) => p.name !== 'status');
    expect(ofKind(proposalsOf(input(await doc(), { profiles: hidden })), 'bands')).toEqual([]);
  });

  it('proposes none in a flow with no gate, where the values check is off, or for a column with a band', async () => {
    expect(ofKind(proposalsOf(input(await doc({ gated: false }))), 'bands')).toEqual([]);
    expect(ofKind(proposalsOf(input(await doc({ values: 'off' }))), 'bands')).toEqual([]);
    expect(ofKind(proposalsOf(input(await doc({ values: 'warn' }))), 'bands')[0]!.does).toMatch(/A day outside one warns, by the values check\.$/);
    const banded = await doc();
    banded.ontology!.properties![0]!.expect = [{ value: 'failed', share: [0, 0.2], datasets: ['jobs'] }];
    expect(ofKind(proposalsOf(input(banded)), 'bands')).toEqual([]);
  });

  it('accepted, each band is the ontology’s for the file, carried by plan/4’s watch', async () => {
    const d = await doc();
    const [p] = ofKind(proposalsOf(input(d)), 'bands');
    let out = d;
    for (const e of p!.edits) out = applyEdit(out, e)!.doc;
    expect(marksOn(out.ontology, 'jobs').expect).toEqual([['status', 'failed', 0, 0.14], ['status', 'ok', 0.83, 0.97]]);
    expect(ofKind(proposalsOf(input(out)), 'bands')).toEqual([]);
  });
});

describe('a likely key', () => {
  it('proposes the column with a different value on every row, never blank in the history nor repeated in the sample', async () => {
    const [p] = ofKind(proposalsOf(input(await doc())), 'key') as KeyProposal[];
    expect(p).toMatchObject({ id: 'key:jobs:job_id', column: 'job_id', rows: 400, type: null, title: 'One row a job, by job_id' });
    expect(p!.rests).toEqual(['400 rows, 400 different job_ids, none blank', 'Never blank on the last 28 days', 'None repeated within a day in the kept sample’s last 5 days']);
    expect(p!.does).toBe('The file becomes the rows of an object type of its own, keyed by job_id. A day that repeats a job_id or leaves one blank holds the day, by the reconcile check.');
    expect(p!.edits).toEqual([{ op: 'declareKey', file: 'jobs', column: 'job_id' }]);
  });

  it('proposes none where the day, the history or the sample shows a blank or a repeat, or the file is small', async () => {
    const d = await doc();
    const none = (o: Partial<Parameters<typeof proposalsOf>[0]>) => ofKind(proposalsOf(input(d, o)), 'key');
    expect(none({ profiles: today({ blankIds: 1 }) })).toEqual([]);
    expect(none({ profiles: today({ repeatIds: 1 }) })).toEqual([]);
    expect(none({ history: history({ blankOn: '2024-02-21' }) })).toEqual([]);
    expect(none({ sample: sample({ repeatOn: 2 }) })).toEqual([]);
    expect(none({ profiles: today({ rows: 9 }) })).toEqual([]);
    // No gate to hold it by, or its reconcile check switched off: a key would judge nothing.
    expect(ofKind(proposalsOf(input(await doc({ gated: false }))), 'key')).toEqual([]);
    expect(ofKind(proposalsOf(input(await doc({ reconcile: 'off' }))), 'key')).toEqual([]);
  });

  it('prefers a column named as an id, and takes the key an object type over the file names', async () => {
    const profiles = [profile('serial', 'text', fact(400, 400, 400)), ...today()];
    expect(ofKind(proposalsOf(input(await doc(), { profiles })), 'key')[0]!.column).toBe('job_id');
    const typed = await doc();
    typed.ontology!.objectTypes.push({ id: 'job', name: 'Backup job', dataset: 'jobs', key: ['serial'], title: 'serial' });
    const [p] = ofKind(proposalsOf(input(typed, { profiles })), 'key');
    expect(p).toMatchObject({ column: 'serial', type: 'Backup job', title: 'One row a backup job, by serial' });
    expect(p!.does).toMatch(/^The file becomes the Backup job type’s rows\./);
  });

  it('accepted, the file is its own object type keyed by the column, held to one row a key and checked against no list', async () => {
    const d = await doc();
    expect(writtenRules(d, 'jobs')).toEqual({ scope: null, needs: [], reconcile: null });
    const r = applyEdit(d, { op: 'declareKey', file: 'jobs', column: 'job_id' })!;
    expect(r.said).toBe('Keyed jobs by job_id: one row a job');
    expect(r.doc.ontology!.objectTypes).toEqual([{ id: 'jobs', name: 'Job', dataset: 'jobs', key: ['job_id'], title: 'job_id' }]);
    expect(r.doc.ontology!.rows).toEqual([{ dataset: 'jobs', of: 'jobs' }]);
    expect(validateDocument(r.doc)).toEqual([]);
    expect(writtenRules(r.doc, 'jobs')).toEqual({ scope: null, needs: [], reconcile: { key: ['job_id'], from: 'ontology' } });
    // The Ontology page names the rules it gives: one row a job, no job id blank or repeated.
    const page = ontologyPage(r.doc, () => undefined);
    expect(page.files[0]!.rules.map((x) => x.said)).toEqual(['One row a job', 'No job_id blank or repeated']);
    // Keyed already: nothing more to propose, and the edit again changes nothing.
    expect(ofKind(proposalsOf(input(r.doc)), 'key')).toEqual([]);
    expect(applyEdit(r.doc, { op: 'declareKey', file: 'jobs', column: 'job_id' })).toBeNull();
  });

  it('ties the file to the type over it, a keyless one keyed by the column; a type keyed by another column stands', async () => {
    const typed = await doc();
    typed.ontology!.objectTypes.push({ id: 'job', name: 'Backup job', dataset: 'jobs', key: [], title: 'job_id' });
    const r = applyEdit(typed, { op: 'declareKey', file: 'jobs', column: 'job_id' })!;
    expect(r.doc.ontology!.objectTypes).toEqual([{ id: 'job', name: 'Backup job', dataset: 'jobs', key: ['job_id'], title: 'job_id' }]);
    expect(r.doc.ontology!.rows).toEqual([{ dataset: 'jobs', of: 'job' }]);
    // Without a noun for the file, a row is called by the type's name.
    const unnamed = await doc();
    unnamed.ontology!.nouns = {};
    unnamed.ontology!.objectTypes.push({ id: 'job', name: 'Backup job', dataset: 'jobs', key: [], title: 'job_id' });
    expect(applyEdit(unnamed, { op: 'declareKey', file: 'jobs', column: 'job_id' })!.said).toBe('Keyed jobs by job_id: one row a backup job');
    const other = await doc();
    other.ontology!.objectTypes.push({ id: 'job', name: 'Backup job', dataset: 'jobs', key: ['serial'], title: 'serial' });
    expect(applyEdit(other, { op: 'declareKey', file: 'jobs', column: 'job_id' })).toBeNull();
    // A type keyed by two columns, one of them this one: its key stands.
    const two = await doc();
    two.ontology!.objectTypes.push({ id: 'job', name: 'Backup job', dataset: 'jobs', key: ['job_id', 'controller'], title: 'job_id' });
    expect(applyEdit(two, { op: 'declareKey', file: 'jobs', column: 'job_id' })).toBeNull();
    // A type of another dataset with the file's own name: the new type takes the next free id.
    const taken = await doc();
    taken.ontology!.objectTypes.push({ id: 'jobs', name: 'Job', dataset: 'elsewhere', key: ['id'], title: 'id' });
    expect(applyEdit(taken, { op: 'declareKey', file: 'jobs', column: 'job_id' })!.doc.ontology!.rows).toEqual([{ dataset: 'jobs', of: 'jobs_2' }]);
  });
});

describe('which files', () => {
  it('offers nothing for a file nothing watches: what it declares would judge nothing there', async () => {
    const d = await doc();
    expect(proposalsOf(input({ ...d, publish: { ...d.publish!, watch: {} } }))).toEqual([]);
  });
});

describe('accepted as a dated change set', () => {
  it('lists the key first, then each column in the file’s order', async () => {
    expect(proposalsOf(input(await doc())).map((p) => p.id)).toEqual(['key:jobs:job_id', 'values:jobs:controller', 'bands:jobs:status']);
  });

  it('replays each proposal’s edits from its day through resolve, moves the rules hash, and leaves nothing to propose', async () => {
    const d = await doc();
    const ps = proposalsOf(input(d));
    const changes = ps.map((p, i) => ({ id: `c${i}`, from: '2024-03-02', recorded: '2024-03-01T12:00:00Z', by: 'owner', why: `Accepted: ${p.title}`, edits: p.edits }));
    expect(changesProblems(changes)).toEqual([]);
    const withChanges = { ...d, changes } as FlowDocument;
    const before = resolve(withChanges, '2024-03-01');
    expect(before.applied).toEqual([]);
    const after = resolve(withChanges, '2024-03-02');
    expect(after.applied.map((a) => a.said)).toEqual([
      ['Keyed jobs by job_id: one row a job'],
      ['Listed controller’s 3 values in jobs: tape, vault-a, vault-b'],
      ['Accepted a new band in jobs: Status Succeeded between 83% and 97%', 'Accepted a new band in jobs: Status Failed between 0% and 14%'],
    ]);
    expect(await rulesHash(after.doc)).not.toBe(await rulesHash(before.doc));
    expect(validateDocument(after.doc)).toEqual([]);
    expect(proposalsOf(input(after.doc))).toEqual([]);
  });

  it('refuses an edit with no values, or with no column', async () => {
    const bad = (edits: unknown[]) => changesProblems([{ id: 'c', from: '2024-03-02', recorded: '2024-03-01T12:00:00Z', by: 'owner', why: '', edits }]);
    expect(bad([{ op: 'declareValues', file: 'jobs', column: 'controller', values: [] }])).not.toEqual([]);
    expect(bad([{ op: 'declareKey', file: 'jobs' }])).not.toEqual([]);
  });
});
