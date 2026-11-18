/**
 * The gate (ADR 0027 §4): a list or a column the ontology closes. The ontology keeps every entry it has accepted (a
 * closed column's values; a closed list's keys with the columns that define an entry), and a row whose entry it doesn't
 * have stops what the file reaches until a person declares the entry, leaves it out or doesn't publish. Here: what the
 * document accepts, what the plan carries, the two edits, and runs through the engine that hold, name what arrived,
 * leave rows out and verify.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { changesProblems, validateDocument, type ChangeSet, type FlowDocument } from '../src/core/document.js';
import { emitRuleCheck } from '../src/core/emit.js';
import { declareEntry, leaveOut, setRule } from '../src/core/flowedit.js';
import { latestGot, latestPublished, undeclaredSaid } from '../src/core/hold.js';
import { applyEdit, resolve } from '../src/core/inforce.js';
import type { JSONValue } from '../src/core/log.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { translate, validatePlan, type ClosedPlan } from '../src/core/plan.js';
import { defaultKind, livesOf, registerOf, shortOf, subjectOf } from '../src/core/register.js';
import { arrivalOf, closedOf, engineRules, entryDiff, isList, newRuleId, ruleSaid, type OntologyRule } from '../src/core/rules.js';
import { utf8 } from '../src/core/hash.js';
import { pinFile, runFlow, verifyRun } from '../src/index.js';
import { pinnedDdl, type DataBindings } from '../examples/sources.js';
import { csvOf, GATE_DAYS, securityDays, securityRows, SIGNIN_DEMO } from './fixtures/security.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { loadFlowDir, signinsDir, ts } from './helpers/notebooks.js';

const NB = `import { cell, param, sql } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';
cell('params');
export const params = param({ day: param.text('') });
cell('controls');
export const controls = source('controls');
cell('evidence');
export const evidence = source('evidence');
cell('teams');
export const teams = source('teams');
cell('controls_checked');
export const controls_checked = check(controls, { rules: [{ name: 'has_id', check: "control_id IS NOT NULL", onFail: 'drop' }], maxDropped: 0.05 });
cell('evidence_checked');
export const evidence_checked = check(evidence, { rules: [{ name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' }] });
cell('score', { lang: 'sql' });
export const score = sql\`SELECT e.app_id, sum(CASE WHEN e.status = 'pass' THEN c.weight ELSE 0 END) AS passed, sum(c.weight) AS weight FROM \${evidence_checked} e JOIN \${controls_checked} c ON c.control_id = e.control_id GROUP BY e.app_id\`;
cell('team_list', { lang: 'sql' });
export const team_list = sql\`SELECT team FROM \${teams}\`;
cell('published');
publish(score);
publish(team_list);
`;

/** The catalogue: a closed list, each control with the weight and the cadence that define it. */
const LIST: OntologyRule = { id: 'control_id_closed', file: 'controls', column: 'control_id', kind: 'closed', defines: ['weight', 'cadence'], entries: [['mfa', '3', 'daily'], ['tls', '2', 'daily'], ['backup', '1', 'weekly']], action: 'hold' };
/** A status: a closed column, its entries its values. */
const COLUMN: OntologyRule = { id: 'status_closed', file: 'evidence', column: 'status', kind: 'closed', entries: [['pass'], ['fail'], ['na']], action: 'hold' };

const flow = (rules: unknown[] = [LIST, COLUMN], more: Partial<FlowDocument> = {}): FlowDocument =>
  ({
    smaltfl: 4, id: 'gated', name: 'Gated', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
    sources: [{ id: 'controls', table: 'controls_file' }, { id: 'evidence', table: 'evidence_file' }, { id: 'teams', table: 'teams_file' }],
    notebooks: [{ path: 'a.nb.ts', source: NB }],
    publish: { hold: ['checks'], period: 'day', watch: {}, together: false, reach: 'downstream' },
    ontology: { objectTypes: [], linkTypes: [], actionTypes: [], ...(rules.length ? { rules } : {}) },
    ...more,
  }) as FlowDocument;
const doc = (rules?: unknown[], more?: Partial<FlowDocument>) => expandNotebooks(flow(rules, more), ts);
const issues = (d: FlowDocument) => validateDocument(d).map((i) => `${i.path}: ${i.message}`);

describe('a closed list or column in the document', () => {
  it('takes both: a column’s values, and a list’s keys with the columns that define an entry', async () => {
    const d = await doc();
    expect(validateDocument(d)).toEqual([]);
    expect(closedOf(d.ontology, 'controls').map((r) => [r.id, isList(r)])).toEqual([['control_id_closed', true]]);
    expect(closedOf(d.ontology, 'evidence').map((r) => [r.id, isList(r)])).toEqual([['status_closed', false]]);
    expect(newRuleId(d, 'teams', 'team', 'closed')).toBe('team_closed');
  });

  it('says each in words', async () => {
    const d = await doc();
    expect(ruleSaid(d.ontology, LIST)).toBe('control_id is one of the 3 entries the ontology has, each with its weight and cadence as declared');
    expect(ruleSaid(d.ontology, COLUMN)).toBe('status is pass, fail or na, and nothing the ontology doesn’t have');
    expect(ruleSaid(d.ontology, { ...COLUMN, entries: Array.from({ length: 12 }, (_, k) => [`v${k}`]) })).toBe('status is one of the 12 values the ontology has');
    expect(ruleSaid(d.ontology, { ...COLUMN, entries: [] })).toBe('status is a value the ontology has (it has none yet)');
    expect(ruleSaid(d.ontology, { ...LIST, leftOut: ['sbom'] })).toBe('control_id is one of the 3 entries the ontology has, each with its weight and cadence as declared; sbom left out until declared');
  });

  it('refuses one that isn’t well formed, field by field', async () => {
    const bad = async (x: Record<string, unknown>, base: OntologyRule = LIST) => issues(await doc([{ ...base, ...x }]));
    expect(await bad({ action: 'flag' })).toEqual(['$.ontology.rules[0].action: hold: what the ontology doesn’t have waits for a person, who declares it, leaves it out or doesn’t publish']);
    expect(await bad({ entries: undefined })).toEqual(['$.ontology.rules[0].entries: the entries the ontology has: each its key, then what its defining columns hold']);
    expect(await bad({ entries: [['mfa', '3']] })).toEqual(['$.ontology.rules[0].entries[0]: its key, then 2 values: one for each column that defines it']);
    expect(await bad({ entries: [['mfa', '3', 'daily'], ['mfa', '1', 'weekly']] })).toEqual(['$.ontology.rules[0].entries[1]: mfa is declared twice']);
    expect(await bad({ entries: [['', '3', 'daily']] })).toEqual(['$.ontology.rules[0].entries[0]: its key, then 2 values: one for each column that defines it']);
    expect(await bad({ defines: ['weight', 'Control_ID'] })).toEqual(['$.ontology.rules[0].defines: control_id is the entry’s key: the columns that define it are the others']);
    expect(await bad({ defines: ['weight', 'WEIGHT'] })).toContain('$.ontology.rules[0].defines: the columns that define an entry beside its key, each once');
    expect(await bad({ leftOut: [] })).toEqual(['$.ontology.rules[0].leftOut: the keys left out until they are declared, each once; absent when there are none']);
    expect(await bad({ values: ['a'] })).toEqual(['$.ontology.rules[0].values: a closed rule has no values']);
    expect(await bad({ id: 'x_left_out' })).toEqual(['$.ontology.rules[0].id: a name ending _left_out is what a closed rule calls the rows it leaves out']);
    // Another kind has none of a closed rule's settings.
    expect(issues(await doc([{ id: 'r', file: 'evidence', column: 'status', kind: 'required', action: 'flag', entries: [['a']] }]))).toEqual(['$.ontology.rules[0].entries: a required rule has no entries']);
    // A closed rule is a notebook flow's.
    expect(validateDocument({ ...(await doc()), smaltfl: 3 } as unknown as FlowDocument).map((i) => i.message)).toContain('a closed list or column is a notebook flow’s (format 4 or later)');
  });

  it('knows where an arrival stands: new, changed, or the entry the ontology has', () => {
    expect(arrivalOf(LIST, ['sbom', '2', 'daily'])).toBe('new');
    expect(arrivalOf(LIST, ['mfa', '2', 'daily'])).toBe('changed');
    expect(arrivalOf(LIST, ['mfa', '3', 'daily'])).toBe('declared');
    expect(entryDiff(LIST, ['mfa', '2', 'weekly'])).toEqual([['weight', '3', '2'], ['cadence', 'daily', 'weekly']]);
    expect(entryDiff(LIST, ['sbom', '2', 'daily'])).toEqual([]);
    expect(arrivalOf(COLUMN, ['deferred'])).toBe('new');
  });
});

describe('a closed list or column in the plan', () => {
  it('writes the rule for the engine: the row’s entry is one the ontology has, a blank key no entry', () => {
    expect(emitRuleCheck(COLUMN)).toBe(`"status" IS NULL OR trim(CAST("status" AS TEXT)) = '' OR CAST("status" AS TEXT) IN ('pass', 'fail', 'na')`);
    expect(emitRuleCheck({ ...LIST, entries: LIST.entries!.slice(0, 2) })).toBe(
      `"control_id" IS NULL OR trim(CAST("control_id" AS TEXT)) = '' OR (CAST("control_id" AS TEXT) = 'mfa' AND coalesce(CAST("weight" AS TEXT), '') = '3' AND coalesce(CAST("cadence" AS TEXT), '') = 'daily') OR (CAST("control_id" AS TEXT) = 'tls' AND coalesce(CAST("weight" AS TEXT), '') = '2' AND coalesce(CAST("cadence" AS TEXT), '') = 'daily')`,
    );
    // Nothing declared: every key is an arrival. A key left out is none.
    expect(emitRuleCheck({ ...COLUMN, entries: [] })).toBe(`"status" IS NULL OR trim(CAST("status" AS TEXT)) = ''`);
    expect(emitRuleCheck({ ...COLUMN, leftOut: ["it's"] })).toContain(`CAST("status" AS TEXT) IN ('it''s') OR CAST("status" AS TEXT) IN ('pass', 'fail', 'na')`);
  });

  it('adds it to the check step that reads the file, and names it in the publish block by that step’s node', async () => {
    const plan = await translate(await doc(), { day: '2024-03-01' });
    validatePlan(plan);
    const at = (origin: string) => plan.nodes.findIndex((n) => n.origin === origin);
    const rulesAt = (origin: string) => {
      const n = plan.nodes[at(origin)]!;
      return n.op === 'expect' ? n.rules.map(([name, , onFail]) => [name, onFail]) : [];
    };
    expect(rulesAt('controls_checked')).toEqual([['has_id', 'drop'], ['control_id_closed', 'fail']]);
    expect(rulesAt('evidence_checked')).toEqual([['has_app', 'drop'], ['status_closed', 'fail']]);
    const closed = (plan.publish as { closed?: [number, ClosedPlan[]][] }).closed!;
    expect(closed).toEqual([
      [at('controls_checked'), [{ rule: 'control_id_closed', key: 'control_id', defines: ['weight', 'cadence'], keys: ['backup', 'mfa', 'tls'] }]],
      [at('evidence_checked'), [{ rule: 'status_closed', key: 'status', defines: [], keys: ['fail', 'na', 'pass'] }]],
    ].sort((a, b) => (a[0] as number) - (b[0] as number)));
    // The plan of a flow that closes nothing has no field for it, and is the plan it always was.
    const open = await translate(await doc([]), { day: '2024-03-01' });
    expect(open.publish).not.toHaveProperty('closed');
    expect(open.smaltflPlan).toBe(plan.smaltflPlan);
  });

  it('keeps a key left out out of what goes on by a rule of its own, which no person writes', async () => {
    const left = { ...LIST, leftOut: ['sbom'] };
    expect(engineRules(left).map((r) => [r.name, r.onFail])).toEqual([['control_id_closed', 'fail'], ['control_id_closed_left_out', 'aside']]);
    expect(engineRules(left)[1]!.check).toBe(`"control_id" IS NULL OR CAST("control_id" AS TEXT) NOT IN ('sbom')`);
    const plan = await translate(await doc([left, COLUMN]), { day: '2024-03-01' });
    validatePlan(plan);
    const n = plan.nodes.find((x) => x.origin === 'controls_checked')!;
    expect(n.op === 'expect' && n.rules.map(([name, , onFail]) => [name, onFail])).toEqual([['has_id', 'drop'], ['control_id_closed', 'fail'], ['control_id_closed_left_out', 'aside']]);
    // A check cell can't ask for it.
    const written = flow();
    written.notebooks![0]!.source = NB.replace("onFail: 'drop' }], maxDropped", "onFail: 'aside' }], maxDropped");
    await expect(expandNotebooks(written, ts).then(validateDocument)).resolves.not.toEqual([]);
  });

  it('refuses a publish block whose closed rules aren’t rules of a check step that stop the day', async () => {
    const plan = await translate(await doc(), { day: '2024-03-01' });
    const closed = (plan.publish as { closed: [number, ClosedPlan[]][] }).closed;
    const withClosed = (c: unknown) => ({ ...plan, publish: { ...plan.publish!, closed: c } }) as typeof plan;
    expect(() => validatePlan(withClosed([]))).toThrow(/publish.closed is a list of \[node, closed rules\], absent when there are none/);
    expect(() => validatePlan(withClosed([[0, closed[0]![1]]]))).toThrow(/isn't a check step/);
    expect(() => validatePlan(withClosed([[closed[0]![0], [{ ...closed[0]![1][0]!, rule: 'has_id' }]]]))).toThrow(/isn't a rule of controls_checked that stops the day/);
    expect(() => validatePlan(withClosed([closed[1], closed[0]]))).toThrow(/sorted by node/);
  });
});

describe('the edits a decision at the gate makes', () => {
  it('declares an entry: new, changed, or in again after it was left out', async () => {
    const d = await doc();
    const added = declareEntry(d, 'controls', 'control_id_closed', ['sbom', '2', 'daily'])!;
    expect(added.said).toBe('Declared sbom in controls');
    expect(closedOf(added.doc.ontology, 'controls')[0]!.entries!.at(-1)).toEqual(['sbom', '2', 'daily']);
    expect(validateDocument(added.doc)).toEqual([]);
    const changed = declareEntry(d, 'controls', 'control_id_closed', ['mfa', '2', 'daily'])!;
    expect(changed.said).toBe('Changed mfa in controls: weight 3 → 2');
    expect(closedOf(changed.doc.ontology, 'controls')[0]!.entries![0]).toEqual(['mfa', '2', 'daily']);
    // The very entry the ontology has says nothing; an entry of another shape, or of no such rule, doesn't apply.
    expect(declareEntry(d, 'controls', 'control_id_closed', ['mfa', '3', 'daily'])).toEqual({ doc: d, said: null });
    expect(declareEntry(d, 'controls', 'control_id_closed', ['sbom'])).toBeNull();
    expect(declareEntry(d, 'controls', 'nope', ['sbom', '2', 'daily'])).toBeNull();
    expect(declareEntry(d, 'evidence', 'status_closed', ['deferred'])!.said).toBe('Declared deferred in evidence');
  });

  it('leaves a key out until it is declared, and declaring it takes it in again', async () => {
    const d = await doc();
    const left = leaveOut(d, 'controls', 'control_id_closed', 'sbom')!;
    expect(left.said).toBe('Left sbom out of controls until it is declared');
    expect(closedOf(left.doc.ontology, 'controls')[0]!.leftOut).toEqual(['sbom']);
    expect(validateDocument(left.doc)).toEqual([]);
    expect(leaveOut(left.doc, 'controls', 'control_id_closed', 'sbom')).toEqual({ doc: left.doc, said: null });
    const back = declareEntry(left.doc, 'controls', 'control_id_closed', ['sbom', '2', 'daily'])!;
    expect(closedOf(back.doc.ontology, 'controls')[0]).not.toHaveProperty('leftOut');
    expect(back.said).toBe('Declared sbom in controls');
  });

  it('names an entry by the ontology’s word for its key', async () => {
    const d = await doc();
    const worded: FlowDocument = { ...d, ontology: { ...d.ontology!, properties: [{ column: 'control_id', title: 'Control', description: 'The control', values: { sbom: 'Software bill of materials' }, datasets: ['controls'] }] } };
    expect(declareEntry(worded, 'controls', 'control_id_closed', ['sbom', '2', 'daily'])!.said).toBe('Declared Software bill of materials (sbom) in controls');
    expect(leaveOut(worded, 'controls', 'control_id_closed', 'sbom')!.said).toBe('Left Software bill of materials (sbom) out of controls until it is declared');
  });

  it('replays as dated change sets, each entry its own: one recorded later doesn’t undo one recorded before', async () => {
    const base = await doc();
    const set = (id: string, from: string, recorded: string, edits: ChangeSet['edits']): ChangeSet => ({ id, from, recorded, by: 'ciso', why: 'because', edits });
    const changes = [
      set('a', '2024-03-05', '2024-03-05T09:00:00Z', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['sbom', '2', 'daily'] }]),
      // Recorded after, in force from before: the entry it declares and the one above both stand from Mar 5.
      set('b', '2024-03-03', '2024-03-06T09:00:00Z', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['dlp', '1', 'weekly'] }]),
      set('c', '2024-03-04', '2024-03-04T09:00:00Z', [{ op: 'leaveOut', file: 'controls', rule: 'control_id_closed', key: 'sbom' }]),
    ];
    const withChanges = { ...base, changes };
    expect(changesProblems(changes)).toEqual([]);
    const keysOn = (day: string) => closedOf(resolve(withChanges, day).doc.ontology, 'controls')[0]!;
    expect(keysOn('2024-03-02').entries!.map((e) => e[0])).toEqual(['mfa', 'tls', 'backup']);
    expect(keysOn('2024-03-03').entries!.map((e) => e[0])).toEqual(['mfa', 'tls', 'backup', 'dlp']);
    expect(keysOn('2024-03-04').leftOut).toEqual(['sbom']);
    expect(keysOn('2024-03-05').entries!.map((e) => e[0]).sort()).toEqual(['backup', 'dlp', 'mfa', 'sbom', 'tls']);
    expect(keysOn('2024-03-05')).not.toHaveProperty('leftOut');
    // An edit that changes nothing in force doesn't apply.
    expect(applyEdit(base, { op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['mfa', '3', 'daily'] })).toBeNull();
    expect(changesProblems([set('x', '2024-03-05', '2024-03-05T09:00:00Z', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: [] }])]).map((p) => p.message)).toEqual(['the entry: its key, then what each column that defines it holds']);
    expect(changesProblems([set('y', '2024-03-05', '2024-03-05T09:00:00Z', [{ op: 'leaveOut', file: 'controls', rule: 'control_id_closed', key: '' }])]).map((p) => p.message)).toEqual(['the key left out until it is declared']);
  });

  it('is one thing on the register: an entry, left out and then declared; the business changing, or the source ahead', () => {
    const declared: ChangeSet['edits'][number] = { op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['sbom', '2', 'daily'] };
    const left: ChangeSet['edits'][number] = { op: 'leaveOut', file: 'controls', rule: 'control_id_closed', key: 'sbom' };
    expect(subjectOf(declared)).toEqual({ key: 'entry:controls:control_id_closed:sbom', dataset: 'controls', lane: 'is', what: 'sbom, an entry' });
    expect(subjectOf(left).key).toBe(subjectOf(declared).key);
    expect([shortOf(declared), shortOf(left)]).toEqual(['declared', 'left out']);
    expect([defaultKind([declared]), defaultKind([left])]).toEqual(['business', 'source']);
  });

  it('draws a new entry’s life from the day it was first named, and a changed one’s from before, as shipped', async () => {
    const base = await doc();
    const set = (id: string, from: string, edits: ChangeSet['edits']): ChangeSet => ({ id, from, recorded: `${from}T09:00:00Z`, by: 'ciso', why: 'because', kind: 'business', edits });
    const withChanges = { ...base, changes: [
      set('left', '2024-03-04', [{ op: 'leaveOut', file: 'controls', rule: 'control_id_closed', key: 'sbom' }]),
      set('new', '2024-03-06', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['sbom', '2', 'daily'] }]),
      set('moved', '2024-03-05', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['mfa', '2', 'daily'] }]),
    ] };
    const days = Array.from({ length: 8 }, (_, i) => `2024-03-0${i + 1}`);
    const lives = livesOf(registerOf(withChanges, { today: '2024-03-08' }).entries, days, '2024-03-08');
    const spans = (key: string) => lives.find((l) => l.subject.key === key)!.spans.map((x) => [x.from, x.until, x.short]);
    expect(spans('entry:controls:control_id_closed:sbom')).toEqual([['2024-03-04', '2024-03-05', 'left out'], ['2024-03-06', '2024-03-08', 'declared']]);
    expect(spans('entry:controls:control_id_closed:mfa')).toEqual([['2024-03-01', '2024-03-04', 'as shipped'], ['2024-03-05', '2024-03-08', 'declared']]);
  });

  it('sets a closed rule as any rule is set, its entries kept as given', async () => {
    const d = await doc([COLUMN]);
    const r = setRule(d, { file: 'controls', column: 'control_id', kind: 'closed', defines: ['weight'], entries: [['mfa', '3']], action: 'hold' });
    if (!('doc' in r)) throw new Error(r.problem);
    expect(r.said).toBe('Added a rule to controls: control_id is one of the 1 entry the ontology has, each with its weight as declared, else hold the day');
    expect(closedOf(r.doc.ontology, 'controls')[0]).toEqual({ id: 'control_id_closed', file: 'controls', column: 'control_id', kind: 'closed', defines: ['weight'], entries: [['mfa', '3']], action: 'hold' });
  });
});

describe('what stopped at the gate, said', () => {
  const closed: ClosedPlan[] = [{ rule: 'c', key: 'control_id', defines: ['weight'], keys: ['mfa'] }];
  const counts = (failed: number) => ({ rows: 10, dropped: 0, rules: [{ name: 'c', onFail: 'fail' as const, failed }] });

  it('names the new entries first, then those not as the ontology has them, three of each and the rest counted', () => {
    expect(undeclaredSaid(closed, counts(0), undefined)).toBeNull();
    expect(undeclaredSaid(closed, counts(1), [{ rule: 'c', arrivals: [[['sbom', '2'], 1, false]], more: 0 }])).toBe('not in the ontology: control_id sbom (1 row)');
    expect(undeclaredSaid(closed, counts(1234), [{ rule: 'c', arrivals: [[['a', '1'], 1200, false], [['b', '1'], 20, false], [['mfa', '9'], 9, true], [['c', '1'], 3, false], [['d', '1'], 2, false]], more: 4 }]))
      .toBe('not in the ontology: control_id a (1,200 rows), b (20 rows), c (3 rows) and 5 more; not as the ontology has it: control_id mfa (9 rows)');
    // A rule that failed with nothing named still says so, by its rows.
    expect(undeclaredSaid(closed, counts(7), undefined)).toBe('not in the ontology: 7 rows of control_id');
  });
});

describe('the day readers got, once a restatement publishes a day held at the gate', () => {
  const entry = (seq: number, kind: string, about: JSONValue) => ({ seq, kind, at: `2024-03-27T0${seq}:00:00Z`, by: { card: null, as: 'ciso' }, about, reason: null, amends: null });
  const run = (seq: number, day: string, outcome: 'ok' | 'held') => entry(seq, 'run', { run: seq, manifest: `m${seq}`, outcome, day, inputs: { flow: 'f', parameters: { day }, nodes: {} } });
  const restate = (seq: number, days: { day: string; passes: boolean }[]) => entry(seq, 'restate', { changes: ['c'], from: days[0]!.day, days: days.map((d) => ({ ...d, manifest: `r${seq}` })), kept: [], same: [] });

  it('is the day declared and run again, from its restatement on; the names the engine moved stay the day before', () => {
    const entries = [run(0, '2024-03-22', 'ok'), run(1, '2024-03-27', 'held'), restate(2, [{ day: '2024-03-27', passes: true }])];
    expect(latestPublished(entries.slice(0, 2), 'day')).toBe('2024-03-22');
    expect(latestGot(entries.slice(0, 2), 'day')).toBe('2024-03-22');
    expect(latestGot(entries, 'day')).toBe('2024-03-27');
    expect(latestPublished(entries, 'day')).toBe('2024-03-22');
  });

  it('takes back a day restated as not published, and keeps a later day run since', () => {
    const entries = [run(0, '2024-03-15', 'ok'), run(1, '2024-03-16', 'ok'), restate(2, [{ day: '2024-03-16', passes: false }])];
    expect(latestGot(entries, 'day')).toBe('2024-03-15');
    expect(latestGot([...entries, run(3, '2024-03-18', 'ok')], 'day')).toBe('2024-03-18');
    expect(latestGot([], 'day')).toBeNull();
  });
});

describe('the gate in the engine', () => {
  const CONTROLS = "('mfa', 'MFA for admins', 3, 'daily'), ('tls', 'TLS 1.2 or later', 2, 'daily'), ('backup', 'Backups tested', 1, 'weekly')";
  const EVIDENCE = "('a1','mfa','pass'), ('a1','tls','fail'), ('a2','mfa','pass'), ('a2','backup','na')";
  const open = (o: { controls?: string; evidence?: string } = {}) => {
    const db = openEngine();
    db.exec(`CREATE TABLE controls_file(control_id TEXT, name TEXT, weight INTEGER, cadence TEXT); INSERT INTO controls_file VALUES ${o.controls ?? CONTROLS}`);
    db.exec(`CREATE TABLE evidence_file(app_id TEXT, control_id TEXT, status TEXT); INSERT INTO evidence_file VALUES ${o.evidence ?? EVIDENCE}`);
    db.exec("CREATE TABLE teams_file(team TEXT); INSERT INTO teams_file VALUES ('Payments'), ('Retail')");
    return db;
  };
  const go = (db: ReturnType<typeof open>, d: FlowDocument) => runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
  const SBOM = `${CONTROLS}, ('sbom', 'Software bill of materials', 2, 'daily')`;

  it('publishes a day whose every entry the ontology has, and records nothing at the gate', async () => {
    const db = open();
    try {
      const r = await go(db, await doc());
      expect(r.holds).toEqual([]);
      expect(r.published).toEqual(['score', 'team_list']);
      expect(r.manifest.nodes.every((n) => n.closed === undefined)).toBe(true);
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('pauses what a new entry reaches, names it in the manifest, publishes what it doesn’t feed, and verifies', async () => {
    const db = open({ controls: SBOM });
    try {
      const r = await go(db, await doc());
      const node = r.manifest.nodes.find((n) => n.origin === 'controls_checked')!;
      expect(node.closed).toEqual([{ rule: 'control_id_closed', arrivals: [[['sbom', '2', 'daily'], 1, false]], more: 0 }]);
      expect(r.holds).toEqual([{ by: 'checks', node: node.node, origin: 'controls_checked', said: 'not in the ontology: control_id sbom (1 row)', reaches: ['score'], undeclared: true }]);
      expect(r.published).toEqual(['team_list']);
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.checks.find((c) => c.check === 'closed')).toMatchObject({ ok: true, origin: 'controls_checked' });
      expect(v.ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('pauses an entry whose defining column changed, said as not as the ontology has it', async () => {
    const db = open({ controls: CONTROLS.replace("('tls', 'TLS 1.2 or later', 2, 'daily')", "('tls', 'TLS 1.3 only', 3, 'daily')") });
    try {
      const r = await go(db, await doc());
      expect(r.manifest.nodes.find((n) => n.origin === 'controls_checked')!.closed).toEqual([{ rule: 'control_id_closed', arrivals: [[['tls', '3', 'daily'], 1, true]], more: 0 }]);
      expect(r.holds.map((h) => h.said)).toEqual(['not as the ontology has it: control_id tls (1 row)']);
    } finally {
      db.close();
    }
  });

  it('lets a reworded name through: only the columns that define an entry are the ontology’s', async () => {
    const db = open({ controls: CONTROLS.replace('MFA for admins', 'Multi-factor sign-in for administrators') });
    try {
      expect((await go(db, await doc())).holds).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('pauses a new value of a closed column, by its rows', async () => {
    const db = open({ evidence: `${EVIDENCE}, ('a3','mfa','deferred'), ('a3','tls','deferred'), ('a4','mfa','Pass')` });
    try {
      const r = await go(db, await doc());
      expect(r.manifest.nodes.find((n) => n.origin === 'evidence_checked')!.closed).toEqual([{ rule: 'status_closed', arrivals: [[['deferred'], 2, false], [['Pass'], 1, false]], more: 0 }]);
      expect(r.holds.map((h) => [h.origin, h.said, h.reaches])).toEqual([['evidence_checked', 'not in the ontology: status deferred (2 rows), Pass (1 row)', ['score']]]);
    } finally {
      db.close();
    }
  });

  it('names twenty arrivals and counts the rest', async () => {
    const many = Array.from({ length: 27 }, (_, k) => `('a9','mfa','new_${String(k).padStart(2, '0')}')`).join(', ');
    const db = open({ evidence: `${EVIDENCE}, ${many}` });
    try {
      const r = await go(db, await doc());
      const c = r.manifest.nodes.find((n) => n.origin === 'evidence_checked')!.closed![0]!;
      expect([c.arrivals.length, c.more, c.arrivals[0]]).toEqual([20, 7, [['new_00'], 1, false]]);
      expect(r.holds[0]!.said).toBe('not in the ontology: status new_00 (1 row), new_01 (1 row), new_02 (1 row) and 24 more');
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('publishes the day once the entry is declared', async () => {
    const db = open({ controls: SBOM });
    try {
      const declared = declareEntry(await doc(), 'controls', 'control_id_closed', ['sbom', '2', 'daily'])!.doc;
      const r = await go(db, declared);
      expect(r.holds).toEqual([]);
      expect(r.published).toEqual(['score', 'team_list']);
    } finally {
      db.close();
    }
  });

  it('publishes without an entry left out: its rows kept out, counted apart from the rows the rules dropped', async () => {
    const db = open({ controls: SBOM, evidence: `${EVIDENCE}, ('a1','sbom','fail')` });
    try {
      const left = leaveOut(await doc(), 'controls', 'control_id_closed', 'sbom')!.doc;
      const r = await go(db, left);
      // One row of four is a quarter, well past the step's 5% limit on dropped rows: a decision's rows aren't the rules'.
      expect(r.holds).toEqual([]);
      expect(r.manifest.nodes.find((n) => n.origin === 'controls_checked')!.expectations).toEqual({ rows: 4, dropped: 0, rules: [{ name: 'has_id', onFail: 'drop', failed: 0 }, { name: 'control_id_closed', onFail: 'fail', failed: 0 }, { name: 'control_id_closed_left_out', onFail: 'aside', failed: 1 }] });
      expect(r.manifest.nodes.find((n) => n.origin === 'score')!.rows).toBe(2);
      // The score counts what the ontology has: a1's evidence for sbom finds no control and adds nothing.
      expect(db.query("SELECT weight FROM score WHERE app_id = 'a1'").rows[0]![0]).toBe(5);
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('says an entry declared before its data is waiting for it, holds nothing, and stops saying so once a row carries it', async () => {
    const ahead = declareEntry(await doc(), 'controls', 'control_id_closed', ['sbom', '2', 'daily'])!.doc;
    const db = open();
    try {
      const r = await go(db, ahead);
      expect(r.holds).toEqual([]);
      expect(r.published).toEqual(['score', 'team_list']);
      expect(r.manifest.nodes.find((n) => n.origin === 'controls_checked')!.closed).toEqual([{ rule: 'control_id_closed', arrivals: [], more: 0, waiting: ['sbom'] }]);
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.checks.find((c) => c.check === 'closed')).toMatchObject({ ok: true });
      expect(v.ok).toBe(true);
    } finally {
      db.close();
    }
    const there = open({ controls: SBOM });
    try {
      const r = await go(there, ahead);
      expect(r.manifest.nodes.every((n) => n.closed === undefined)).toBe(true);
    } finally {
      there.close();
    }
    // The file brings it with another weight than the ontology declared: at the gate, changed, and not waiting.
    const other = open({ controls: SBOM.replace("'Software bill of materials', 2", "'Software bill of materials', 3") });
    try {
      const r = await go(other, ahead);
      expect(r.manifest.nodes.find((n) => n.origin === 'controls_checked')!.closed).toEqual([{ rule: 'control_id_closed', arrivals: [[['sbom', '3', 'daily'], 1, true]], more: 0 }]);
      expect(r.holds.map((h) => h.said)).toEqual(['not as the ontology has it: control_id sbom (1 row)']);
    } finally {
      other.close();
    }
  });

  it('asks nothing of a closed column’s values that don’t occur: only a list’s entries wait for data', async () => {
    const db = open({ evidence: "('a1','mfa','pass'), ('a2','tls','pass')" });
    try {
      const r = await go(db, await doc());
      expect(r.holds).toEqual([]);
      expect(r.manifest.nodes.find((n) => n.origin === 'evidence_checked')!.closed).toBeUndefined();
    } finally {
      db.close();
    }
  });

  it('still counts a row the rules drop among the rows left in', async () => {
    const db = open({ controls: `${SBOM}, (NULL, 'No id', 1, 'daily')` });
    try {
      const left = leaveOut(await doc(), 'controls', 'control_id_closed', 'sbom')!.doc;
      const r = await go(db, left);
      const e = r.manifest.nodes.find((n) => n.origin === 'controls_checked')!.expectations!;
      expect([e.rows, e.dropped, e.rules.map((x) => x.failed)]).toEqual([5, 1, [1, 0, 1]]);
      // One of five dropped is past the limit: the step's own rule holds the day, as it would have.
      expect(r.holds.map((h) => [h.said, h.undeclared])).toEqual([['dropped 1 of 5 rows (20%), more than the 5% allowed', undefined]]);
    } finally {
      db.close();
    }
  });

  it('stops a flow that holds nothing: the ontology comes first there too', async () => {
    const db = open({ controls: SBOM });
    try {
      const { publish: _p, ...bare } = await doc();
      await expect(go(db, bare as FlowDocument)).rejects.toThrow(/expectations failed: control_id_closed \(1 row\)/);
    } finally {
      db.close();
    }
  });

  it('says another rule that stops the day after what stopped at the gate', async () => {
    const db = open({ controls: SBOM });
    try {
      const d = await doc();
      const r2 = setRule(d, { file: 'controls', column: 'weight', kind: 'range', max: 2, action: 'hold' });
      if (!('doc' in r2)) throw new Error(r2.problem);
      const r = await go(db, r2.doc);
      expect(r.holds.map((h) => h.said)).toEqual(['not in the ontology: control_id sbom (1 row); expectations failed: weight_range (1 row)']);
    } finally {
      db.close();
    }
  });
});

describe('the sign-in log’s closed column (the demo’s last days)', () => {
  const data = JSON.parse(readFileSync(new URL('../examples/security-signins.data.json', import.meta.url), 'utf8')) as DataBindings;
  const runDay = async (day: string, doc: FlowDocument) => {
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    const b = data.sources.auth!;
    await pinFile(db, b.file, utf8(csvOf(securityRows(securityDays(SIGNIN_DEMO).find((p) => p.day === day)!, 0.03))));
    await db.execAsync(pinnedDdl(b));
    // The checks alone hold here: the day's story isn't told in this test.
    const r = await runFlow(db, { ...doc, publish: { hold: ['checks'], period: 'day', watch: {} } } as FlowDocument, { smaltdb: SMALTDB, parameters: { day } });
    db.close();
    return r;
  };
  const arrived = (r: Awaited<ReturnType<typeof runDay>>) => r.manifest.nodes.find((n) => n.origin === 'auth_valid')!.closed?.[0]?.arrivals.map(([entry, , changed]) => [entry[0], changed]);

  it('ships Method closed on its five values, said so', async () => {
    const doc = await loadFlowDir(signinsDir);
    expect(closedOf(doc.ontology, 'auth').map((r) => [r.id, r.entries!.map((e) => e[0])])).toEqual([['method_one_of', ['password', 'sso', 'mfa_push', 'passkey', 'api_key']]]);
  });

  it('stops Sat Mar 23 at the gate for magic links, and Sun Mar 24 for codes by text message once the first is declared', async () => {
    const doc = await loadFlowDir(signinsDir);
    const before = await runDay('2024-03-21', doc);
    expect(before.holds).toEqual([]);
    const sat = await runDay(GATE_DAYS.method, doc);
    expect(arrived(sat)).toEqual([['magic_link', false]]);
    expect(sat.holds.map((h) => [h.origin, h.undeclared, h.said.replace(/\d+ rows/, 'N rows')])).toEqual([['auth_valid', true, 'not in the ontology: method magic_link (N rows)']]);
    const declared = declareEntry(doc, 'auth', 'method_one_of', ['magic_link'])!.doc;
    expect((await runDay(GATE_DAYS.method, declared)).holds).toEqual([]);
    const sun = await runDay(GATE_DAYS.second, declared);
    expect(arrived(sun)).toEqual([['sms_code', false]]);
    // Undeclared, both arrive together on the Sunday, the one with the most rows first.
    expect(arrived(await runDay(GATE_DAYS.second, doc))).toEqual([['magic_link', false], ['sms_code', false]]);
    // Left out, the last day goes on without its rows.
    const without = leaveOut(declared, 'auth', 'method_one_of', 'sms_code')!.doc;
    const last = await runDay(GATE_DAYS.last, without);
    expect(last.holds).toEqual([]);
    expect(last.manifest.nodes.find((n) => n.origin === 'auth_valid')!.expectations!.rules.find((x) => x.name === 'method_one_of_left_out')).toMatchObject({ onFail: 'aside' });
    expect(last.manifest.nodes.find((n) => n.origin === 'auth_valid')!.expectations!.rules.find((x) => x.name === 'method_one_of_left_out')!.failed).toBeGreaterThan(10);
  });
});
