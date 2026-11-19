/**
 * A change's own step (ADR 0027 §7, Q-260, Q-261, Q-263, Q-284): the first day a change of kind *the business changed*
 * is in force is run both ways, and what differs is the change's own. The document as it was, the two runs' measures
 * compared, the series the change moved taken as their new level, where a chart is cut and the line with the steps
 * taken out; and a day run both ways through the engine.
 */
import { describe, expect, it } from 'vitest';
import type { ChangeSet, FlowDocument } from '../src/core/document.js';
import { levelFor, levelsOf } from '../src/core/hold.js';
import { inForce } from '../src/core/inforce.js';
import type { LogEntry } from '../src/core/log.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { closedOf, type OntologyRule } from '../src/core/rules.js';
import { adjusted, asDeclared, changesReaching, cutsOf, declaredOf, declaredOn, followedThrough, moveSaid, redefinedOn, stepIn, trialMoves } from '../src/core/across.js';
import { findingsOf } from '../src/core/overview.js';
import { metricKey, type Metric } from '../src/core/history.js';
import { asItWas, declaredLevels, isStep, seriesIn, stepMeasures, stepsOf, STEP_KIND, type StepAbout, type ToldDay } from '../src/core/step.js';
import type { Story } from '../src/core/story.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const NB = `import { cell, param, sql } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';
cell('params');
export const params = param({ day: param.text('') });
cell('controls');
export const controls = source('controls');
cell('evidence');
export const evidence = source('evidence');
cell('controls_checked');
export const controls_checked = check(controls, { rules: [{ name: 'has_id', check: "control_id IS NOT NULL", onFail: 'drop' }], maxDropped: 0.05 });
cell('score', { lang: 'sql' });
export const score = sql\`SELECT e.app_id, sum(CASE WHEN e.status = 'pass' THEN c.weight ELSE 0 END) AS passed, sum(c.weight) AS weight FROM \${evidence} e JOIN \${controls_checked} c ON c.control_id = e.control_id GROUP BY e.app_id\`;
cell('published');
publish(score);
`;
const LIST: OntologyRule = { id: 'control_id_closed', file: 'controls', column: 'control_id', kind: 'closed', defines: ['weight', 'cadence'], entries: [['mfa', '3', 'daily'], ['tls', '2', 'daily'], ['backup', '1', 'weekly']], action: 'hold' };
const flow = (changes: ChangeSet[] = []): FlowDocument =>
  ({
    smaltfl: 4, id: 'stepped', name: 'Stepped', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-27' }],
    sources: [{ id: 'controls', table: 'controls_file' }, { id: 'evidence', table: 'evidence_file' }],
    notebooks: [{ path: 'a.nb.ts', source: NB }],
    publish: { hold: ['checks'], period: 'day', watch: {}, together: false, reach: 'downstream' },
    ontology: { objectTypes: [], linkTypes: [], actionTypes: [], rules: [LIST] },
    ...(changes.length ? { changes } : {}),
  }) as FlowDocument;
const doc = (changes?: ChangeSet[]) => expandNotebooks(flow(changes), ts);
const set = (id: string, from: string, edits: ChangeSet['edits'], more: Partial<ChangeSet> = {}): ChangeSet => ({ id, from, recorded: `${from}T09:10:00Z`, by: 'ciso', why: 'The control board added it', kind: 'business', edits, agreed: [{ by: 'owner', at: `${from}T09:10:00Z` }], ...more });
const SBOM = set('sbom-declared', '2024-03-27', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['sbom', '2', 'daily'] }]);

describe('the rules as they were, for a change’s first day', () => {
  it('are the flow without the change, each entry it declares left out for that day alone', async () => {
    const d = await doc([SBOM]);
    const { doc: was, leftOut } = asItWas(d, SBOM);
    expect(leftOut).toEqual([{ file: 'controls', rule: 'control_id_closed', keys: ['sbom'] }]);
    expect(was.changes!.map((c) => [c.id, c.from, c.until, c.kind, c.edits])).toEqual([['sbom-declared:as-it-was', '2024-03-27', '2024-03-27', 'corrected', [{ op: 'leaveOut', file: 'controls', rule: 'control_id_closed', key: 'sbom' }]]]);
    // On the day the list has its three entries and leaves the new one out; the day after, the change set has no say.
    const on = (day: string) => closedOf(inForce(was, day).ontology, 'controls')[0]!;
    expect(on('2024-03-27').entries!.map((e) => e[0])).toEqual(['mfa', 'tls', 'backup']);
    expect(on('2024-03-27').leftOut).toEqual(['sbom']);
    expect(on('2024-03-28').leftOut).toBeUndefined();
    // With the change, the list has four and leaves none out.
    expect(closedOf(inForce(d, '2024-03-27').ontology, 'controls')[0]!.entries!.map((e) => e[0])).toEqual(['mfa', 'tls', 'backup', 'sbom']);
  });

  it('keep every other change set, and leave nothing out where the change declares nothing new', async () => {
    const band = set('weekly-backups', '2024-03-20', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['backup', '2', 'weekly'] }], { kind: 'retuned' });
    const d = await doc([band, SBOM]);
    const was = asItWas(d, SBOM);
    expect(was.doc.changes!.map((c) => c.id)).toEqual(['weekly-backups', 'sbom-declared:as-it-was']);
    // An entry whose defining column the change moves is an arrival not as the ontology had it: left out as it was.
    expect(asItWas(d, band).leftOut).toEqual([{ file: 'controls', rule: 'control_id_closed', keys: ['backup'] }]);
    // One that says an entry again as the rules have it, or names no closed rule, leaves nothing out.
    const again = set('again', '2024-03-27', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['mfa', '3', 'daily'] }, { op: 'declareEntry', file: 'controls', rule: 'no_such_rule', entry: ['x'] }]);
    const plain = asItWas(await doc([again]), again);
    expect(plain.leftOut).toEqual([]);
    expect(plain.doc.changes).toEqual([]);
  });
});

describe('the two runs compared', () => {
  it('says the measures the change alone moved, and how many were read', () => {
    const without = { score: 93, coverage: 0.99, checks: { applying: 19259, evidence: 19082, failing: 1277 }, failing: { mfa: 40, tls: 12 }, rows: { fact: 19259, dim_control: 14, dim_app: 2412 } };
    const withIt = { score: 92.7, coverage: 0.99, checks: { applying: 21314, evidence: 19151, failing: 1311 }, failing: { mfa: 40, tls: 12, sbom: 34 }, rows: { fact: 21314, dim_control: 15, dim_app: 2412 } };
    const { moved, measured } = stepMeasures(without, withIt);
    expect(measured).toBe(11);
    expect(moved).toEqual([
      { measure: 'score', without: 93, with: 92.7 },
      { measure: 'checks:applying', without: 19259, with: 21314 },
      { measure: 'checks:evidence', without: 19082, with: 19151 },
      { measure: 'checks:failing', without: 1277, with: 1311 },
      { measure: 'failing:sbom', without: 0, with: 34 },
      { measure: 'rows:dim_control', without: 14, with: 15 },
      { measure: 'rows:fact', without: 19259, with: 21314 },
    ]);
    expect(stepIn({ moved }, 'score')).toBeCloseTo(-0.3, 9);
    expect(stepIn({ moved }, 'coverage')).toBeNull();
    expect(moveSaid({ moved }, 'score')).toBe('by −0.3, from 93.0 to 92.7');
    expect(moveSaid({ moved }, 'rows:fact', 0)).toBe('by +2055, from 19259 to 21314');
    expect(moveSaid({ moved }, 'coverage')).toBe('');
    // The same both ways: nothing moved, and that is said by the count read.
    expect(stepMeasures(without, without)).toEqual({ moved: [], measured: 10 });
    // A flow with no product is read by its outputs' rows alone; an output only one side built is moved.
    expect(stepMeasures({ rows: { a: 1 } }, { rows: { a: 1, b: 2 } })).toEqual({ moved: [{ measure: 'rows:b', without: null, with: 2 }], measured: 2 });
  });

  it('is kept by the record beside its change, the last where a day was measured twice', () => {
    const about = (run: number, score: number): StepAbout => ({ change: 'sbom-declared', day: '2024-03-27', with: { run, manifest: `m${run}` }, without: { run: run + 1, manifest: `m${run + 1}` }, moved: [{ measure: 'score', without: 93, with: score }], measured: 4 });
    const entry = (seq: number, kind: string, a: unknown): LogEntry => ({ smaltflLog: 1, origin: 'o', seq, kind, at: '2024-03-27T09:11:00Z', by: { card: null, as: 'build' }, about: a as never, reason: null, amends: null, nonce: 'n' } as LogEntry);
    const entries = [entry(0, 'run', { run: 1 }), entry(1, STEP_KIND, about(1, 92.9)), entry(2, STEP_KIND, about(3, 92.7)), entry(3, STEP_KIND, { change: 'x' })];
    expect(isStep(entries[1]!.about)).toBe(true);
    expect(isStep(entries[3]!.about)).toBe(false);
    const steps = stepsOf(entries);
    expect([...steps.keys()]).toEqual(['sbom-declared']);
    expect(steps.get('sbom-declared')!.seq).toBe(2);
    expect(stepIn(steps.get('sbom-declared'), 'score')).toBeCloseTo(-0.3, 9);
  });
});

describe('a chart across a change (Q-260, Q-284)', () => {
  const steps = new Map<string, Pick<StepAbout, 'moved' | 'day'>>([
    ['sbom', { day: '2024-03-27', moved: [{ measure: 'score', without: 93, with: 92.7 }] }],
    ['band', { day: '2024-03-18', moved: [] }],
    ['retuned', { day: '2024-03-20', moved: [{ measure: 'score', without: 93, with: 94 }] }],
  ]);
  const changes = [{ id: 'sbom', kind: 'business' as const, from: '2024-03-27' }, { id: 'band', kind: 'business' as const, from: '2024-03-18' }, { id: 'retuned', kind: 'retuned' as const, from: '2024-03-20' }, { id: 'unmeasured', kind: 'business' as const, from: '2024-03-21' }];

  it('is cut only where a change of kind the business changed has a step of its own on the series', () => {
    expect(cutsOf(changes, steps, 'score').map((c) => [c.day, c.change, Number(c.step.toFixed(2))])).toEqual([['2024-03-27', 'sbom', -0.3]]);
    // Another series the change didn't move is marked, not cut; so is a setting re-tuned, whatever it moved.
    expect(cutsOf(changes, steps, 'coverage')).toEqual([]);
  });

  it('has a line with the steps taken out: each day from a cut on shifted back by the change’s own step', () => {
    const line = [{ day: '2024-03-22', value: 93.1 }, { day: '2024-03-26', value: null }, { day: '2024-03-27', value: 92.7 }, { day: '2024-03-29', value: 92.3 }];
    const cuts = cutsOf(changes, steps, 'score');
    expect(adjusted(line, cuts).map((p) => (p.value === null ? null : Number(p.value.toFixed(2))))).toEqual([93.1, null, 93, 92.6]);
    // No cut: the line itself, point for point.
    expect(adjusted(line, [])).toEqual(line);
    // Two cuts add up from the second on.
    const two = [...cuts, { day: '2024-03-29', change: 'other', step: 1 }];
    expect(adjusted(line, two).map((p) => (p.value === null ? null : Number(p.value.toFixed(2))))).toEqual([93.1, null, 93, 91.6]);
  });
});

describe('a declared change as the new level (Q-263)', () => {
  const story = (more: Partial<Story>): Story => ({ state: 'unusual', head: 'More results', hero: 'calm', split: null, cause: null, findings: [], absorbed: [], amount: null, ...more }) as unknown as Story;
  // A day's amount against its range: where it leads the story, it is off; a handful of rows over the range is told of
  // by nothing.
  const amount = (value: number): Partial<Story> => ({ hero: value > 20000 ? 'amount' : 'calm', amount: { value, low: 19244, high: 19306, expected: 19275, change: value / 19275 - 1 } });
  const share = (value: string, severity: 'note' | 'warn', was: 'note' | 'warn' = severity) => ({ kind: 'share', metric: { of: 'value', column: 'status', value }, severity, was, tier: 'sameDay' }) as never;

  // A dataset as a run told it: its story, and each series with its value and whether that is outside what was usual.
  const ROWS: Metric = { of: 'trips' };
  const value = (v: string): Metric => ({ of: 'value', column: 'status', value: v });
  const BLANK: Metric = { of: 'missing', column: 'raw_status' };
  const told = (st: Story, at: [Metric, number, boolean][]): ToldDay => ({ story: st, series: at.map(([m]) => m), at: (m) => { const hit = at.find(([x]) => metricKey(x) === metricKey(m)); return hit ? { value: hit[1], outside: hit[2] } : { value: null, outside: false }; } });

  it('names each series the change moved that stands outside what was usual, and that the old way told nothing of', () => {
    const calm = story({ ...amount(19320), state: 'calm', head: 'As usual' });
    const was = told(calm, [[ROWS, 19320, true], [value('"no_data"'), 0, false], [value('"pass"'), 0.917, false], [value('"fail"'), 0.064, false], [BLANK, 0, false]]);
    // More rows, a value never seen, a share down and blanks, all the change's: each series it gave another value that
    // is outside what was usual. The day's count stood 14 rows over a narrow range both ways, and is still the change's.
    const now = told(story(amount(21314)), [[ROWS, 21314, true], [value('"no_data"'), 0.094, true], [value('"pass"'), 0.832, true], [value('"fail"'), 0.058, false], [BLANK, 0.094, true]]);
    expect(declaredLevels({ effective: now }, { effective: was })).toEqual([{ source: 'effective', metrics: ['count:status="no_data"', 'count:status="pass"', 'missing:raw_status', 'trips', 'value:status="no_data"', 'value:status="pass"'], was: { state: 'calm', head: 'As usual' } }]);
    // A series the change gave the same value is the day's data, whatever the story says of it: the same run both
    // ways names nothing.
    expect(declaredLevels({ effective: now }, { effective: now })).toEqual([]);
    const off = told(story({ ...amount(19320), head: 'More failing', findings: [share('"fail"', 'warn')] }), [[ROWS, 19320, true], [value('"fail"'), 0.11, true]]);
    expect(declaredLevels({ effective: off }, { effective: off })).toEqual([]);
    // What the old way told as off stays a finding, though the change moved it further: no level of the change's.
    const further = told(story(amount(21314)), [[ROWS, 21314, true], [value('"fail"'), 0.12, true]]);
    expect(declaredLevels({ effective: further }, { effective: off })).toEqual([{ source: 'effective', metrics: ['trips'], was: { state: 'unusual', head: 'More failing' } }]);
    // A series only the run under the change has (a value the old way never built) is the change's.
    expect(declaredLevels({ effective: told(story(amount(19320)), [[value('"sbom"'), 0.09, true]]) }, { effective: told(calm, []) })[0]!.metrics).toEqual(['count:status="sbom"', 'value:status="sbom"']);
    // A dataset the run as it was didn't tell says nothing of what the change moved.
    expect(declaredLevels({ effective: now }, {})).toEqual([]);
  });

  it('reads every series a dataset’s history keeps: its rows, blanks, quantiles, each coded value and each pair’s cell', () => {
    const vh = (values: string[], counts: boolean) => ({ values, first: [], last: [], days: [], rows: [], fresh: [], ...(counts ? { counts: [[1]] } : {}) });
    const series = seriesIn({ columns: ['status', 'age'], quantiles: [[null, [1, 2, 3, 4, 5, 6, 7]]], values: { status: vh(['"pass"', '"fail"'], true), app_id: vh(['"a"'], false) }, pairs: { 'status|tier': vh(['["pass","1"]'], true), 'status|app_id': vh(['["pass","a"]'], false) } });
    expect(series.map(metricKey)).toEqual(['trips', 'missing:status', 'missing:age', ...[0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99].map((_, q) => metricKey({ of: 'quantile', column: 'age', q })), 'value:status="pass"', 'value:status="fail"', metricKey({ of: 'combo', pair: 'status|tier', value: '["pass","1"]' })]);
  });

  const step: StepAbout = { change: 'sbom-declared', day: '2024-03-27', with: { run: 5, manifest: 'a' }, without: { run: 6, manifest: 'b' }, moved: [], measured: 3, levels: [{ source: 'effective', metrics: ['trips'], was: { state: 'calm', head: 'As usual' } }, { source: 'posture_wide', metrics: ['value:sbom="no_data"'], was: { state: 'unusual', head: 'More failing' } }] };
  const entry = (seq: number, kind: string, at: string, about: unknown) => ({ seq, kind, at, by: { card: null, as: 'build' }, about: about as never, reason: null, amends: null });

  it('is learned from by the checks from its day, as an accepted level is, and decides no later day', () => {
    const entries = [entry(7, STEP_KIND, '2024-03-27T09:11:00Z', step)];
    expect(levelsOf(entries, 'effective')).toEqual([{ from: '2024-03-27', metrics: ['trips'], decision: 7 }]);
    expect(levelsOf(entries, 'Posture_Wide')).toEqual([{ from: '2024-03-27', metrics: ['value:sbom="no_data"'], decision: 7 }]);
    expect(levelsOf(entries, 'apps')).toEqual([]);
    // A day held later at the same level waits for a person: only an Accept publishes a day under it.
    expect(levelFor(entries, 'effective', '2024-03-29', new Map([['trips', true]]), () => new Map([['trips', true]]))).toBeNull();
  });

  it('reads its first day as the day’s data was judged the old way, and says what is the change’s own', () => {
    const claims = [{ source: 'effective', state: 'unusual', head: 'More results: 21,314 (+11%)' }, { source: 'posture_wide', state: 'unusual', head: 'More of no_data' }, { source: 'control_requirements', state: 'unusual', head: 'More mappings' }, { source: 'apps', state: 'calm', head: 'As usual' }];
    const files = (catalog: string) => [{ source: 'control_catalog', sha256: catalog }, { source: 'evidence', sha256: 'e1' }];
    const run = (seq: number, day: string, at: string, manifest: string, catalog = 'c1') => entry(seq, 'run', at, { run: seq, manifest, day, outcome: 'ok', files: files(catalog), claims });
    // The day's first run, held at the gate; the day run again under the change, which the step names; the step; the
    // same files run here later; the catalogue sent again for the day; and the day after.
    const entries = [run(1, '2024-03-27', '2024-03-27T05:25:00Z', 'held'), run(2, '2024-03-27', '2024-03-27T09:10:01Z', 'a'), entry(3, STEP_KIND, '2024-03-27T09:10:02Z', step), run(4, '2024-03-27', '2024-04-02T10:00:00Z', 'here'), run(5, '2024-03-27', '2024-04-02T11:00:00Z', 'again', 'c2'), run(6, '2024-03-28', '2024-03-28T05:25:00Z', 'next')];
    const read = asDeclared(entries);
    const said = (k: number) => (read[k]!.about as unknown as { claims: { source: string; state: string; head: string; declared?: string }[] }).claims.map((c) => [c.source, c.state, c.head, c.declared]);
    // A run of the day on the files the step was measured on: the dataset the change moved reads as it did the old way;
    // one whose trouble the old way saw too keeps it, as the old way said it; a file's own finding is the day's data.
    const old = [['effective', 'calm', 'As usual', 'sbom-declared'], ['posture_wide', 'unusual', 'More failing', 'sbom-declared'], ['control_requirements', 'unusual', 'More mappings', undefined], ['apps', 'calm', 'As usual', undefined]];
    expect(said(0)).toEqual(old);
    expect(said(1)).toEqual(old);
    expect(said(3)).toEqual(old);
    // A file sent again for the day was never judged the old way, and the day after is no first day: as they were told.
    expect(read[4]).toBe(entries[4]);
    expect(read[5]).toBe(entries[5]);
    expect(read[2]).toBe(entries[2]);
    // The month's findings of the day leave the change's own step out, and the day picked names it.
    expect(findingsOf(read[1]!.about as never).map((f) => [f.origin, f.said])).toEqual([['posture_wide', 'More failing'], ['control_requirements', 'More mappings']]);
    expect(findingsOf(entries[1]!.about as never).map((f) => f.origin)).toEqual(['effective', 'posture_wide', 'control_requirements']);
    expect(declaredOf(read[1]!.about as never)).toEqual([{ origin: 'effective', change: 'sbom-declared' }, { origin: 'posture_wide', change: 'sbom-declared' }]);
    expect(declaredOf(entries[1]!.about as never)).toEqual([]);
    // As known before the step was measured, nothing is read as declared; nor where the run it names isn't on record.
    expect(asDeclared(entries.slice(0, 2))).toEqual(entries.slice(0, 2));
    expect(asDeclared([entries[0]!, entries[2]!])[0]).toBe(entries[0]);
    // The step that moved a dataset on a day.
    const steps = stepsOf(entries);
    expect(declaredOn(steps, 'Effective', '2024-03-27T00:00:00Z')).toEqual({ change: 'sbom-declared', level: step.levels![0] });
    expect(declaredOn(steps, 'effective', '2024-03-28')).toBeNull();
    expect(declaredOn(steps, 'apps', '2024-03-27')).toBeNull();
  });
});

describe('a coming change tried on the days recorded (Q-261)', () => {
  it('gives the same figures before it starts: each measure it would have moved, on how many days, and the last', () => {
    const cov = (without: number, withIt: number) => ({ measure: 'coverage', without, with: withIt });
    const days = [
      { day: '2024-03-21', moved: [cov(99.2, 90.9), { measure: 'rows:effective', without: 19282, with: 21270 }], measured: 56 },
      { day: '2024-03-20', moved: [cov(99.2, 90.8)], measured: 56 },
      { day: '2024-03-22', moved: [], measured: 56 },
      // A day whose measures couldn't be read both ways says nothing.
      { day: '2024-03-19' },
    ];
    expect(trialMoves(days)).toEqual({ read: 3, moves: [{ measure: 'coverage', days: 2, last: { day: '2024-03-21', without: 99.2, with: 90.9 } }, { measure: 'rows:effective', days: 1, last: { day: '2024-03-21', without: 19282, with: 21270 } }] });
    expect(trialMoves([])).toEqual({ read: 0, moves: [] });
  });
});

describe('a chart built on a column across its changes (§2, §3)', () => {
  it('is marked from the day the column’s meaning was redefined for its dataset (Q-251)', () => {
    const redefine = (id: string, from: string, column: string, datasets?: string[]): ChangeSet => set(id, from, [{ op: 'redefine', column, ...(datasets ? { datasets } : {}), change: { description: 'Means something else' } }]);
    const changes = [redefine('later', '2024-03-20', 'status', ['evidence']), redefine('first', '2024-03-11', 'Status'), redefine('other', '2024-03-12', 'status', ['controls']), redefine('weight', '2024-03-13', 'weight', ['evidence']), SBOM];
    // For the dataset: the redefinition of every dataset's column, and the one that names it; not another dataset's,
    // another column's, or a change that redefines nothing.
    expect(redefinedOn(changes, 'Evidence', 'status')).toEqual([{ day: '2024-03-11', change: 'first' }, { day: '2024-03-20', change: 'later' }]);
    expect(redefinedOn(changes, 'controls', 'status').map((x) => x.change)).toEqual(['first', 'other']);
    expect(redefinedOn(changes, 'evidence', 'app_id')).toEqual([]);
  });

  it('follows a value of a closed column through an ending, to what replaced it and back (Q-264)', () => {
    const ended = [
      { what: 'entry' as const, id: 'passkey', of: { file: 'signins', rule: 'method_closed' }, then: { how: 'merged' as const, by: ['mfa_push'] } },
      { what: 'entry' as const, id: 'sms', of: { file: 'signins', rule: 'method_closed' }, then: { how: 'split' as const, by: ['mfa_push', 'totp'] } },
      { what: 'entry' as const, id: 'fax', of: { file: 'signins', rule: 'method_closed' } },
      // Another file's entry of the same name, and a kind that ended, say nothing of this column's values.
      { what: 'entry' as const, id: 'mfa_push', of: { file: 'lockouts', rule: 'method_closed' }, then: { how: 'replaced' as const, by: ['push'] } },
      { what: 'type' as const, id: 'passkey' },
    ];
    const through = (value: string) => followedThrough({ ended }, 'Signins', ['method_closed'], value);
    expect(through('passkey')).toEqual({ ended: { then: { how: 'merged', by: ['mfa_push'] } }, carries: [] });
    expect(through('mfa_push')).toEqual({ ended: null, carries: [{ key: 'passkey', how: 'merged' }, { key: 'sms', how: 'split' }] });
    expect(through('totp')).toEqual({ ended: null, carries: [{ key: 'sms', how: 'split' }] });
    expect(through('fax')).toEqual({ ended: { then: null }, carries: [] });
    expect(through('password')).toBeNull();
    expect(followedThrough({ ended }, 'signins', ['another_rule'], 'passkey')).toBeNull();
    expect(followedThrough(undefined, 'signins', ['method_closed'], 'passkey')).toBeNull();
  });
});

describe('the changes that reach a dataset (ADR 0027 §8)', () => {
  it('are those about it and those about something it is built from, said through what', async () => {
    const d = await doc();
    const band = set('band', '2024-03-18', [{ op: 'acceptBand', source: 'evidence', column: 'status', value: 'fail', share: [0, 0.1] } as never]);
    const link = set('link', '2024-03-11', [{ op: 'setLink', link: { id: 'x', name: 'X', from: 'a', to: 'b', on: [['a', 'b']] } } as never]);
    const of = (dataset: string) => changesReaching(d, [SBOM, band, link], dataset).map((r) => [r.change.id, r.reach, r.through]);
    // The score is built from the catalogue's check and from the evidence: both changes reach it, each through its file.
    expect(of('score')).toEqual([['sbom-declared', 'downstream', ['controls']], ['band', 'downstream', ['evidence']]]);
    expect(of('Controls')).toEqual([['sbom-declared', 'direct', []]]);
    expect(of('controls_checked')).toEqual([['sbom-declared', 'downstream', ['controls']]]);
    expect(of('evidence')).toEqual([['band', 'direct', []]]);
    // A change about no dataset of the flow is the flow's as a whole, and no one dataset's.
    expect(changesReaching(d, [link], 'score')).toEqual([]);
  });
});

describe('a day run both ways through the engine', () => {
  const open = () => {
    const db = openEngine();
    db.exec("CREATE TABLE controls_file(control_id TEXT, name TEXT, weight INTEGER, cadence TEXT); INSERT INTO controls_file VALUES ('mfa', 'MFA for admins', 3, 'daily'), ('tls', 'TLS 1.2 or later', 2, 'daily'), ('backup', 'Backups tested', 1, 'weekly'), ('sbom', 'Software bill of materials', 2, 'daily')");
    db.exec("CREATE TABLE evidence_file(app_id TEXT, control_id TEXT, status TEXT); INSERT INTO evidence_file VALUES ('a1','mfa','pass'), ('a1','tls','fail'), ('a1','sbom','fail'), ('a2','mfa','pass'), ('a2','backup','pass')");
    return db;
  };

  it('gives the change’s own step: the day as published against the day with the new entry left out', async () => {
    const db = open();
    try {
      const d = await doc([SBOM]);
      const day = { day: '2024-03-27' };
      const withIt = await runFlow(db, d, { smaltdb: SMALTDB, parameters: day });
      expect(withIt.holds).toEqual([]);
      const was = asItWas(d, SBOM);
      const without = await runFlow(db, was.doc, { smaltdb: SMALTDB, parameters: day, whatIf: true });
      // The run as it was is a what-if: every output held, nothing published, readers stay on the day as published.
      expect(without.holds.map((h) => h.by)).toEqual(['what-if']);
      expect(without.published).toEqual([]);
      expect(without.manifest.nodes.find((n) => n.origin === 'controls_checked')!.expectations!.rules.find((r) => r.name === 'control_id_closed_left_out')).toEqual({ name: 'control_id_closed_left_out', onFail: 'aside', failed: 1 });
      // Read from each run's own version: the share of the weight passed, over both applications.
      const mark = (r: typeof withIt) => {
        const tbl = String(db.query('SELECT tbl FROM _smaltfl_versions WHERE key = ?', [r.manifest.outputs.score!.key]).rows[0]![0]);
        const [passed, weight] = db.query(`SELECT sum(passed), sum(weight) FROM "${tbl}"`).rows[0]!;
        return { score: (100 * Number(passed)) / Number(weight), rows: { score: r.manifest.nodes.find((n) => n.origin === 'score')!.rows! } };
      };
      const step = stepMeasures(mark(without), mark(withIt));
      // Seven of the nine by weight passed as it was; seven of eleven with the new control, which a1 fails.
      expect(step.measured).toBe(2);
      expect(step.moved).toHaveLength(1);
      expect(moveSaid(step, 'score')).toBe('by −14.1, from 77.8 to 63.6');
      expect((await verifyRun(db, without.run, { smaltdb: SMALTDB, level: 'rerun', manifest: without.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });
});
