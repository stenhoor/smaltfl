/**
 * Context that travels (ADR 0027 §8): three tables any cell can join to, made by the run for its day from the flow's
 * dated changes, the events written down and the rules in force, and published like any output. The rows, the
 * notebook's `context()`, a run through the engine whose cells join them, and verify.
 */
import { describe, expect, it } from 'vitest';
import { changeAbout, CONTEXT_COLUMNS, contextOf, contextRows, datasetsOf, NO_CONTEXT, reachOf, stepSaid, type ContextRows } from '../src/core/context.js';
import { CONTEXT_TABLES, validateDocument, type ChangeSet, type FlowDocument } from '../src/core/document.js';
import { emitRows } from '../src/core/emit.js';
import type { FlowEvent } from '../src/core/events.js';
import { inForce, rulesHash } from '../src/core/inforce.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { flowHash, translate } from '../src/core/plan.js';
import type { OntologyRule } from '../src/core/rules.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const NB = `import { cell, param, sql } from 'smaltnb';
import { check, context, publish, source } from 'smaltfl/notebook';
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
cell('context_changes');
export const context_changes = context('changes');
cell('context_events');
export const context_events = context('events');
cell('context_in_force');
export const context_in_force = context('in_force');
cell('score_context', { lang: 'sql' });
export const score_context = sql\`SELECT f.dataset, f.rules, f.changes, (SELECT count(*) FROM \${context_changes} c WHERE c.dataset = f.dataset) AS reached_by, (SELECT count(*) FROM \${context_events} e WHERE e.dataset = f.dataset) AS going_on FROM \${context_in_force} f WHERE f.dataset = 'score'\`;
cell('published');
publish(score);
publish(context_changes);
publish(context_events);
publish(context_in_force);
publish(score_context);
`;
const LIST: OntologyRule = { id: 'control_id_closed', file: 'controls', column: 'control_id', kind: 'closed', defines: ['weight', 'cadence'], entries: [['mfa', '3', 'daily'], ['tls', '2', 'daily'], ['backup', '1', 'weekly']], action: 'hold' };
const flow = (changes: ChangeSet[] = [], nb = NB): FlowDocument =>
  ({
    smaltfl: 4, id: 'travels', name: 'Travels', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-27' }],
    sources: [{ id: 'controls', table: 'controls_file' }, { id: 'evidence', table: 'evidence_file' }],
    notebooks: [{ path: 'a.nb.ts', source: nb }],
    publish: { hold: ['checks'], period: 'day', watch: {}, together: false, reach: 'downstream' },
    ontology: { objectTypes: [], linkTypes: [], actionTypes: [], rules: [LIST] },
    ...(changes.length ? { changes } : {}),
  }) as FlowDocument;
const doc = (changes?: ChangeSet[], nb?: string) => expandNotebooks(flow(changes, nb), ts);
const set = (id: string, from: string, edits: ChangeSet['edits'], more: Partial<ChangeSet> = {}): ChangeSet => ({ id, from, recorded: `${from}T09:10:00Z`, by: 'ciso', why: 'The control board added it', kind: 'business', edits, agreed: [{ by: 'owner', at: `${from}T09:10:00Z` }], ...more });
const SBOM = set('sbom-declared', '2024-03-27', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['sbom', '2', 'daily'] }], { decided: { by: 'board', on: '2024-03-26' }, because: { event: 'audit' } });
// A change about no dataset the flow has: a dataset described ahead of its data.
const LINK = set('acting', '2024-03-11', [{ op: 'describeAhead', dataset: { id: 'sbom_inventory', name: 'SBOM inventory', row: { one: 'component list', many: 'component lists' }, key: ['app_id'], columns: [{ column: 'app_id', description: 'The application' }] } }], { recorded: '2024-03-08T14:00:00Z' });
// One that applies to nothing here (a relation between kinds this flow hasn't): passed over, and no change of it.
const ELSEWHERE = set('elsewhere', '2024-03-12', [{ op: 'setLink', link: { id: 'acted_for_by', name: 'Acted for by', from: 'unit', to: 'person', on: [['acting_leader_id', 'person_id']] } } as never]);
const LATER = set('later', '2024-04-02', [{ op: 'declareEntry', file: 'controls', rule: 'control_id_closed', entry: ['dr', '1', 'yearly'] }]);
const event = (id: string, from: string, until: string | undefined, more: Partial<FlowEvent> = {}): FlowEvent => ({ id, name: id, from, ...(until ? { until } : {}), kind: 'freeze', recorded: '2024-03-20T10:00:00Z', by: 'ciso', ...more });
const col = (table: keyof ContextRows, name: string) => CONTEXT_COLUMNS[table].findIndex(([c]) => c === name);
const pick = (rows: ContextRows, table: keyof ContextRows, ...names: string[]) => rows[table].map((r) => names.map((n) => r[col(table, n)]));

describe('a table written out in the statement', () => {
  it('casts every cell to its column’s type, has its types with no rows, and keeps a text on one line', () => {
    const columns = [['what', 'text'], ['n', 'int']] as const;
    expect(emitRows(columns, [])).toBe('SELECT CAST(NULL AS TEXT) AS "what", CAST(NULL AS INTEGER) AS "n" WHERE 1 = 0');
    expect(emitRows(columns, [['it’s here', 2], [null, null]])).toBe('SELECT CAST(\'it’s here\' AS TEXT) AS "what", CAST(2 AS INTEGER) AS "n"\nUNION ALL\nSELECT CAST(NULL AS TEXT), CAST(NULL AS INTEGER)');
    expect(emitRows(columns, [["a 'quoted'\n  line", 3.9]])).toBe('SELECT CAST(\'a \'\'quoted\'\' line\' AS TEXT) AS "what", CAST(3 AS INTEGER) AS "n"');
  });
});

describe('what a change or an event reaches', () => {
  it('is the datasets it is about and everything built from them, in the flow’s order', async () => {
    const d = await doc();
    expect(datasetsOf(d).map((x) => `${x.is}:${x.id}`)).toEqual(['file:controls', 'file:evidence', 'step:controls_checked', 'step:score', 'step:context_changes', 'step:context_events', 'step:context_in_force', 'step:score_context']);
    // The catalogue, its check and the score built on it; the tables the run makes read nothing of it but the one cell
    // that joins the score's own row doesn't read the score either: it reads the context alone.
    expect(reachOf(d, ['Controls'])).toEqual([{ dataset: 'controls', reach: 'direct' }, { dataset: 'controls_checked', reach: 'downstream' }, { dataset: 'score', reach: 'downstream' }]);
    expect(reachOf(d, ['evidence', 'score'])).toEqual([{ dataset: 'evidence', reach: 'direct' }, { dataset: 'score', reach: 'direct' }]);
    expect(reachOf(d, ['nothing_here'])).toEqual([]);
    expect(changeAbout(SBOM)).toEqual(['controls']);
    expect(changeAbout(LINK)).toEqual([]);
  });
});

describe('a run’s context tables', () => {
  it('lists the changes in force on the day, a row a dataset each reaches, with its reason, who decided and its own step', async () => {
    const d = await doc([LINK, ELSEWHERE, SBOM, LATER]);
    const step = { change: 'sbom-declared', day: '2024-03-27', measured: 2, moved: [{ measure: 'score', without: 77.78, with: 63.64 }, { measure: 'rows:dim', without: 3, with: 4 }] };
    const rows = await contextRows(d, '2024-03-27', null, { steps: [step] });
    // The description written ahead is about no dataset the flow has: one row, the flow's. The new control reaches the
    // catalogue and what is built from it. A change that begins after the day isn't in force, and one that applies to
    // nothing in this flow is no change of it: neither is the day's context.
    expect(pick(rows, 'changes', 'change', 'dataset', 'reach')).toEqual([['acting', null, 'flow'], ['sbom-declared', 'controls', 'direct'], ['sbom-declared', 'controls_checked', 'downstream'], ['sbom-declared', 'score', 'downstream']]);
    const row = Object.fromEntries(CONTEXT_COLUMNS.changes.map(([name], k) => [name, rows.changes[1]![k]]));
    expect(row).toEqual({
      change: 'sbom-declared', dataset: 'controls', reach: 'direct', kind: 'business', from_day: '2024-03-27', until_day: null,
      what: 'Declared sbom in controls', why: 'The control board added it', recorded_at: '2024-03-27T09:10:00Z', recorded_by: 'ciso', decided_by: 'board', decided_on: '2024-03-26', agreed_by: 'owner', agreed_at: '2024-03-27T09:10:00Z', because_of: 'audit', estate: null,
      step_day: '2024-03-27', step_measured: 2, step_moved: 2, step: 'score: 77.78 → 63.64; rows:dim: 3 → 4',
    });
    expect(stepSaid({ moved: [] })).toBe('');
    // A change that wasn't run both ways has no step; one that moved nothing says how many measures were read.
    expect(pick(rows, 'changes', 'step_day', 'step_measured', 'step_moved', 'step')[0]).toEqual([null, null, null, null]);
    const none = await contextRows(d, '2024-03-27', null, { steps: [{ ...step, moved: [] }] });
    expect(pick(none, 'changes', 'step_measured', 'step_moved', 'step')[1]).toEqual([2, 0, null]);
    // As known before the control was declared, and on a day before it began: the relation alone.
    expect(pick(await contextRows(d, '2024-03-27', '2024-03-27T05:25:00Z'), 'changes', 'change')).toEqual([['acting']]);
    expect(pick(await contextRows(d, '2024-03-20', null), 'changes', 'change')).toEqual([['acting']]);
    expect((await contextRows(d, '2024-03-01', null)).changes).toEqual([]);
  });

  it('lists what was going on that day, a row a dataset each event reaches, with which day of it this is and what it excuses', async () => {
    const d = await doc();
    const events = [
      event('freeze', '2024-03-25', '2024-03-31', { name: 'Quarter-end change freeze', note: 'No production change\nwithout the chair' }),
      event('reinstall', '2024-03-27', '2024-03-27', { name: 'Agents reinstalled', kind: 'migration', about: ['evidence'], excuses: [{ dataset: 'evidence', check: 'shares', column: 'status' }, { dataset: 'evidence', check: 'amount' }] }),
      event('over', '2024-03-01', '2024-03-05'),
      event('written-later', '2024-03-27', undefined, { recorded: '2024-03-28T08:00:00Z' }),
    ];
    const rows = await contextRows(d, '2024-03-27', null, { events, eventsAsOf: '2024-03-27T23:00:00Z' });
    expect(pick(rows, 'events', 'event', 'dataset', 'reach', 'day_of', 'days', 'excuses')).toEqual([
      ['freeze', null, 'flow', 3, 7, null],
      ['reinstall', 'evidence', 'direct', 1, 1, 'shares (status), amount'],
      ['reinstall', 'score', 'downstream', 1, 1, null],
    ]);
    expect(pick(rows, 'events', 'name', 'kind', 'from_day', 'until_day', 'note', 'recorded_at', 'recorded_by')[0]).toEqual(['Quarter-end change freeze', 'freeze', '2024-03-25', '2024-03-31', 'No production change\nwithout the chair', '2024-03-20T10:00:00Z', 'ciso']);
    // Every event given, where no moment is: the one written the day after is known too, and goes on with no last day.
    expect(pick(await contextRows(d, '2024-03-27', null, { events }), 'events', 'event', 'day_of', 'days').at(-1)).toEqual(['written-later', 1, null]);
    // A run of no day has nothing going on.
    expect((await contextRows(d, null, null, { events })).events).toEqual([]);
  });

  it('says, for each dataset of the day, the version of the ontology it was read under', async () => {
    const d = await doc([LINK, SBOM]);
    const rows = await contextRows(d, '2024-03-27', null);
    const rules = await rulesHash(inForce(d, '2024-03-27'));
    expect(rows.in_force).toHaveLength(8);
    // By name, whatever order the cells are written in.
    expect(pick(rows, 'in_force', 'dataset', 'is')).toEqual([['context_changes', 'step'], ['context_events', 'step'], ['context_in_force', 'step'], ['controls', 'file'], ['controls_checked', 'step'], ['evidence', 'file'], ['score', 'step'], ['score_context', 'step']]);
    expect(rows.in_force[3]).toEqual(['controls', 'file', null, '2024-03-27', rules, 2, '2024-03-27']);
    // Another day, other rules: one change in force, since its own first day; none, and the flow is as it was written.
    const before = await contextRows(d, '2024-03-20', null);
    expect(before.in_force[0]!.slice(3)).toEqual(['2024-03-20', await rulesHash(inForce(d, '2024-03-20')), 1, '2024-03-11']);
    expect(before.in_force[0]![4]).not.toBe(rules);
    expect((await contextRows(await doc(), '2024-03-27', null)).in_force[0]!.slice(5)).toEqual([0, null]);
    // The same inputs give the same rows.
    expect(await contextRows(d, '2024-03-27', null)).toEqual(rows);
    expect(NO_CONTEXT).toEqual({ changes: [], events: [], in_force: [] });
  });

  it('says what reaches one dataset, for the page', async () => {
    const d = await doc([LINK, SBOM]);
    const events = [event('reinstall', '2024-03-27', '2024-03-27', { about: ['evidence'] }), event('freeze', '2024-03-25', '2024-03-31')];
    const of = (dataset: string) => {
      const c = contextOf(d, dataset, '2024-03-27', null, events);
      return { changes: c.changes.map((x) => [x.change.id, x.reach]), events: c.events.map((x) => [x.event.id, x.reach]) };
    };
    expect(of('score')).toEqual({ changes: [['acting', 'flow'], ['sbom-declared', 'downstream']], events: [['freeze', 'flow'], ['reinstall', 'downstream']] });
    expect(of('controls')).toEqual({ changes: [['acting', 'flow'], ['sbom-declared', 'direct']], events: [['freeze', 'flow']] });
    expect(of('evidence')).toEqual({ changes: [['acting', 'flow']], events: [['freeze', 'flow'], ['reinstall', 'direct']] });
    expect(contextOf(d, 'score', '2024-03-27', null, events).changes[1]!.what).toEqual(['Declared sbom in controls']);
  });
});

describe('a context table in a notebook', () => {
  it('is a step that reads nothing, whose statement says its columns, and that a cell reads by its name', async () => {
    const d = await doc();
    expect(validateDocument(d)).toEqual([]);
    const step = d.steps.find((s) => s.id === 'context_changes')!;
    expect(step).toMatchObject({ kind: 'sql', inputs: [], context: 'changes', dataset: {} });
    expect((step as { sql: string }).sql).toBe(emitRows(CONTEXT_COLUMNS.changes, []));
    expect(d.steps.find((s) => s.id === 'score_context')!.inputs.sort()).toEqual(['context_changes', 'context_events', 'context_in_force']);
    expect([...CONTEXT_TABLES]).toEqual(['changes', 'events', 'in_force']);
  });

  it('is refused under a name that is no context table, and with an input', async () => {
    await expect(doc([], NB.replace("context('events')", "context('decisions')"))).rejects.toThrow(/context\(\) names a context table, and decisions isn't one \(changes, events, in_force\)/);
    const d = await doc();
    const bad = { ...d, notebooks: undefined, steps: d.steps.map((s) => (s.id === 'context_events' ? { ...s, inputs: ['score'], context: 'everything' } : s)) } as unknown as FlowDocument;
    const at = bad.steps.findIndex((s) => s.id === 'context_events');
    const issues = validateDocument(bad).map((i) => `${i.path}: ${i.message}`);
    expect(issues).toContain(`$.steps[${at}].context: one of changes, events, in_force`);
    expect(issues).toContain(`$.steps[${at}].inputs: a context table reads nothing: its rows are made by the run`);
  });

  it('has the day’s rows in its plan, and leaves the flow’s hash and every other plan as they were', async () => {
    const d = await doc([SBOM]);
    const day = { day: '2024-03-27' };
    const plan = await translate(d, day);
    const node = plan.nodes.find((n) => n.origin === 'context_changes')!;
    expect(node).toMatchObject({ op: 'sql', names: [], inputs: [], context: { of: 'changes' } });
    const rows = await contextRows(d, '2024-03-27', null);
    expect((node as { context: { rows: unknown } }).context.rows).toEqual(rows.changes);
    expect((node as { sql: string }).sql).toBe(emitRows(CONTEXT_COLUMNS.changes, rows.changes));
    // Rows a caller made are taken as they are; what the record adds is added to the rows made here.
    const given = await translate(d, day, { context: { ...rows, events: [['e', null, 'flow', 'E', 'freeze', '2024-03-27', null, 1, null, null, null, 't', 'x']] } });
    expect((given.nodes.find((n) => n.origin === 'context_events') as { context: { rows: unknown[] } }).context.rows).toHaveLength(1);
    const added = await translate(d, day, { context: { events: [event('freeze', '2024-03-25', '2024-03-31')] } });
    expect((added.nodes.find((n) => n.origin === 'context_events') as { context: { rows: unknown[][] } }).context.rows.map((r) => r[0])).toEqual(['freeze']);
    // The flow is known by its document under the rules in force, whatever the day's context: the same flow hash.
    expect(given.flow.hash).toBe(plan.flow.hash);
    expect(plan.flow.hash).toBe(await flowHash(inForce(d, '2024-03-27')));
    // A flow with no context table doesn't read the option.
    const plain = await doc([SBOM], NB.replace(/cell\('context_changes'\);[\s\S]*?cell\('published'\);/, "cell('published');").replace(/publish\((context_\w+|score_context)\);\n/g, ''));
    expect(await translate(plain, day, { context: rows })).toEqual(await translate(plain, day));
    expect((await translate(plain, day)).nodes.some((n) => 'context' in n)).toBe(false);
  });
});

describe('a run with its context, through the engine', () => {
  const open = () => {
    const db = openEngine();
    db.exec("CREATE TABLE controls_file(control_id TEXT, name TEXT, weight INTEGER, cadence TEXT); INSERT INTO controls_file VALUES ('mfa', 'MFA for admins', 3, 'daily'), ('tls', 'TLS 1.2 or later', 2, 'daily'), ('backup', 'Backups tested', 1, 'weekly'), ('sbom', 'Software bill of materials', 2, 'daily')");
    db.exec("CREATE TABLE evidence_file(app_id TEXT, control_id TEXT, status TEXT); INSERT INTO evidence_file VALUES ('a1','mfa','pass'), ('a1','tls','fail'), ('a1','sbom','fail'), ('a2','mfa','pass'), ('a2','backup','pass')");
    return db;
  };
  const read = (db: ReturnType<typeof openEngine>, r: Awaited<ReturnType<typeof runFlow>>, name: string, sql = 'SELECT *') => {
    const tbl = String(db.query('SELECT tbl FROM _smaltfl_versions WHERE key = ?', [r.manifest.outputs[name]!.key]).rows[0]![0]);
    return db.query(`${sql} FROM "${tbl}"`).rows;
  };

  it('publishes the three tables with the product, a cell joins them, and verify recomputes them', async () => {
    const db = open();
    try {
      const d = await doc([SBOM]);
      const events = [event('reinstall', '2024-03-27', '2024-03-27', { name: 'Agents reinstalled', about: ['evidence'], excuses: [{ dataset: 'evidence', check: 'amount' }] })];
      const r = await runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: '2024-03-27' }, context: { events } });
      expect(r.holds).toEqual([]);
      expect(r.published.sort()).toEqual(['context_changes', 'context_events', 'context_in_force', 'score', 'score_context']);
      // The rows are the ones the plan carries, as the engine reads them, with their types.
      expect(read(db, r, 'context_changes', 'SELECT "change", "dataset", "reach", "kind", "from_day", "step_measured"')).toEqual([['sbom-declared', 'controls', 'direct', 'business', '2024-03-27', null], ['sbom-declared', 'controls_checked', 'downstream', 'business', '2024-03-27', null], ['sbom-declared', 'score', 'downstream', 'business', '2024-03-27', null]]);
      expect(read(db, r, 'context_events', 'SELECT "event", "dataset", "reach", "day_of", "days", "excuses"')).toEqual([['reinstall', 'evidence', 'direct', 1, 1, 'amount'], ['reinstall', 'score', 'downstream', 1, 1, null]]);
      expect(r.manifest.outputs.context_in_force!.rows).toBe(8);
      const rules = await rulesHash(inForce(d, '2024-03-27'));
      expect(r.manifest.flow.rules).toBe(rules);
      // A cell that joins all three: the score's row of the day's rules, with what reaches it.
      expect(read(db, r, 'score_context')).toEqual([['score', rules, 1, 1, 1]]);
      // Verify recomputes each of them like any output, and holds the plan to the document with the rows it carries.
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.checks.filter((c) => !c.ok)).toEqual([]);
      expect(v.ok).toBe(true);

      // The day before the control was declared, under the rules as known then: no change in force, the entry stops at
      // the gate, and the tables say so of that day. Another plan, the same flow as kept.
      const early = await runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: '2024-03-26' }, context: { events } });
      expect(read(db, early, 'context_in_force', 'SELECT "dataset", "day", "changes", "since_day"')[0]).toEqual(['context_changes', '2024-03-26', 0, null]);
      expect(early.manifest.outputs.context_changes!.rows).toBe(0);
      expect(early.manifest.outputs.context_events!.rows).toBe(0);
      expect(early.manifest.plan).not.toBe(r.manifest.plan);
    } finally {
      db.close();
    }
  });

  it('fails verify where a context table’s statement isn’t its rows written out', async () => {
    const db = open();
    try {
      const d = await doc([SBOM]);
      const r = await runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: '2024-03-27' } });
      const stored = JSON.parse(String(db.query('SELECT plan FROM _smaltfl_plans WHERE hash = ?', [r.manifest.plan]).rows[0]![0])) as { nodes: { origin: string; context?: { rows: unknown[][] } }[] };
      // The rows the plan says it carries are changed, the statement left as it ran: the document no longer translates
      // to the plan.
      stored.nodes.find((n) => n.origin === 'context_changes')!.context!.rows[0]![7] = 'Because someone said so';
      db.exec(`UPDATE _smaltfl_plans SET plan = '${JSON.stringify(stored).replace(/'/g, "''")}' WHERE hash = '${r.manifest.plan}'`);
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'stored', manifest: r.hash });
      expect(v.ok).toBe(false);
      expect(v.checks.filter((c) => !c.ok).map((c) => c.check)).toContain('flow');
    } finally {
      db.close();
    }
  });
});
