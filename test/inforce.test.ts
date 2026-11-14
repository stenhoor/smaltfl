/**
 * The rules over time (ADR 0021 §5, core/inforce.ts): dated change sets on the flow, the rules in force on a day as
 * known at a moment, the edits replayed on whatever document they meet, the rules-in-force hash under `rules/1` with its
 * test vectors, and runs of a day through the engine naming the rules they ran under.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { canonicalJSON } from '../src/core/canonical.js';
import { validateDocument, type ChangeSet, type RuleEdit } from '../src/core/document.js';
import { utf8 } from '../src/core/hash.js';
import { applyEdit, changesOn, dayOf, inForce, resolve, rulesHash, rulesInForce } from '../src/core/inforce.js';
import { rulesOf } from '../src/core/rules.js';
import { flowHash, pinFile, runFlow, translate, verifyRun, type FlowDocument } from '../src/index.js';
import { pinnedDdl, type DataBindings } from '../examples/sources.js';
import { csvOf, securityDays, securityRows } from './fixtures/security.js';
import { SMALTDB } from './helpers/engine.js';
import { estateDir } from './helpers/estate-world.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const data = JSON.parse(readFileSync(new URL('../examples/security-signins.data.json', import.meta.url), 'utf8')) as DataBindings;
const signins = () => loadFlowDir(signinsDir);
const change = (id: string, from: string, recorded: string, edits: RuleEdit[], why = ''): ChangeSet => ({ id, from, recorded, by: 'the security lead', why, edits });
const latency = (max: number): RuleEdit => ({ op: 'setRule', rule: { id: 'latency_ms_range', file: 'auth', column: 'latency_ms', kind: 'range', min: 0, max, action: 'flag' } });

describe('the rules-in-force hash, rules/1', () => {
  it('hashes the canonical JSON of the ontology, the gates and the check cells’ rule switches: its test vectors', async () => {
    // Vector 1: a flow with none of them.
    const none = { steps: [] };
    expect(canonicalJSON(rulesInForce(none))).toBe('{"gates":null,"ontology":null,"switches":{}}');
    expect(await rulesHash(none)).toBe('dde84c220c15b4d3825aca765431d96a27ed3f21ac25e3375c658a069d795de0');
    // Vector 2: one property, one rule, one gate, one switch; a step without switches says nothing.
    const one = {
      ontology: {
        objectTypes: [], linkTypes: [], actionTypes: [],
        properties: [{ column: 'method', title: 'Method', description: 'How they signed in', datasets: ['auth'] }],
        rules: [{ id: 'method_one_of', file: 'auth', column: 'method', kind: 'oneOf' as const, values: ['password', 'sso'], action: 'hold' as const }],
      },
      gates: { auth: { layer: 'bronze' as const, checks: { rules: 'warn' as const } } },
      steps: [
        { id: 'auth_valid', kind: 'expectations' as const, inputs: ['auth'], rules: [], ontology: { method_one_of: 'off' as const } },
        { id: 'daily', kind: 'sql' as const, inputs: ['auth_valid'], sql: 'SELECT 1' },
      ],
    };
    expect(canonicalJSON(rulesInForce(one))).toBe(
      '{"gates":{"auth":{"checks":{"rules":"warn"},"layer":"bronze"}},"ontology":{"actionTypes":[],"linkTypes":[],"objectTypes":[],"properties":[{"column":"method","datasets":["auth"],"description":"How they signed in","title":"Method"}],"rules":[{"action":"hold","column":"method","file":"auth","id":"method_one_of","kind":"oneOf","values":["password","sso"]}]},"switches":{"auth_valid":{"method_one_of":"off"}}}',
    );
    expect(await rulesHash(one)).toBe('12de0a26f45de4b0abe3123964d9f7faa0f4bbd8fa8295772b668757ca85c8bf');
  });

  it('is the same for flows whose steps, notebooks or display differ, and moves with a rule', async () => {
    const doc = await signins();
    const other = { ...doc, steps: doc.steps.map((s) => (s.kind === 'sql' ? { ...s, sql: `${s.sql}\n` } : s)), layout: { auth: [1, 2] as [number, number] }, notebooks: [] };
    expect(await rulesHash(other)).toBe(await rulesHash(doc));
    expect(await rulesHash(applyEdit(doc, latency(20_000))!.doc)).not.toBe(await rulesHash(doc));
  });
});

describe('change sets in force on a day, as known at a moment', () => {
  const doc = {
    changes: [
      change('waf-band', '2024-03-18', '2024-03-15T16:00:00.000Z', [latency(20_000)]),
      change('back-dated', '2024-03-01', '2024-03-25T09:30:00.000Z', [latency(25_000)]),
      change('same-moment', '2024-03-04', '2024-03-15T16:00:00.000Z', [latency(26_000)]),
    ],
  };
  const ids = (cs: ChangeSet[]) => cs.map((c) => c.id);

  it('takes those from the day or before, in the order they were recorded, ties in the order listed', () => {
    expect(ids(changesOn(doc, '2024-02-29'))).toEqual([]);
    expect(ids(changesOn(doc, '2024-03-01'))).toEqual(['back-dated']);
    expect(ids(changesOn(doc, '2024-03-20'))).toEqual(['waf-band', 'same-moment', 'back-dated']);
    // A slot (ADR 0010 §7) is of its day.
    expect(ids(changesOn(doc, '2024-03-18T06'))).toEqual(['waf-band', 'same-moment', 'back-dated']);
    // A run of no day: every change set.
    expect(ids(changesOn(doc, null))).toEqual(['waf-band', 'same-moment', 'back-dated']);
  });

  it('leaves out what was recorded after the moment', () => {
    expect(ids(changesOn(doc, '2024-03-20', '2024-03-20T00:00:00Z'))).toEqual(['waf-band', 'same-moment']);
    expect(ids(changesOn(doc, '2024-03-20', '2024-03-15T15:59:59Z'))).toEqual([]);
    expect(ids(changesOn(doc, '2024-03-05', '2024-03-26T00:00:00Z'))).toEqual(['same-moment', 'back-dated']);
  });
});

describe('the rules in force', () => {
  it('are the document itself without change sets, and its base before every change set, hashing as shipped', async () => {
    const doc = await signins();
    expect(inForce(doc, '2024-03-11')).toBe(doc);
    const dated: FlowDocument = { ...doc, changes: [change('tighter', '2024-03-12', '2024-03-12T08:00:00Z', [latency(20_000)])] };
    const before = inForce(dated, '2024-03-11');
    expect(before).not.toHaveProperty('changes');
    expect(await flowHash(before)).toBe(await flowHash(doc));
    expect(await rulesHash(before)).toBe(await rulesHash(doc));
    const after = inForce(dated, '2024-03-12');
    expect(rulesOf(after.ontology, 'auth').find((r) => r.id === 'latency_ms_range')?.max).toBe(20_000);
    expect(await flowHash(after)).not.toBe(await flowHash(doc));
  });

  it('apply a change recorded later after one recorded earlier, whatever their days, and say what each did', async () => {
    const doc = await signins();
    const dated: FlowDocument = {
      ...doc,
      changes: [change('band', '2024-03-18', '2024-03-15T16:00:00Z', [latency(20_000)]), change('back', '2024-03-01', '2024-03-25T09:30:00Z', [latency(25_000)], 'The vendor’s limit')],
    };
    const max = (d: FlowDocument) => rulesOf(d.ontology, 'auth').find((r) => r.id === 'latency_ms_range')?.max;
    expect(max(inForce(dated, '2024-03-05'))).toBe(25_000);
    // Recorded last, the back-dated change set is applied last on the 20th too.
    expect(max(inForce(dated, '2024-03-20'))).toBe(25_000);
    // As known on the 20th, it hadn't been made.
    expect(max(inForce(dated, '2024-03-20', '2024-03-20T23:59:59Z'))).toBe(20_000);
    expect(max(inForce(dated, '2024-03-05', '2024-03-20T23:59:59Z'))).toBe(30_000);
    const r = resolve(dated, '2024-03-20');
    expect(r.applied.map((a) => [a.change.id, a.said, a.passed])).toEqual([
      ['band', ['Changed a rule in auth: Latency is from 0 to 20,000 ms, else flag the row and keep it (it was: Latency is from 0 to 30,000 ms, else flag the row and keep it)'], 0],
      ['back', ['Changed a rule in auth: Latency is from 0 to 25,000 ms, else flag the row and keep it (it was: Latency is from 0 to 20,000 ms, else flag the row and keep it)'], 0],
    ]);
  });

  it('pass over an edit that doesn’t apply to the rules of the day, and count it', async () => {
    const doc = await signins();
    const added: RuleEdit = { op: 'setRule', rule: { id: 'user_required', file: 'auth', column: 'user', kind: 'required', action: 'flag' } };
    const dated: FlowDocument = {
      ...doc,
      changes: [
        change('add', '2024-03-15', '2024-03-15T09:00:00Z', [added]),
        // Switching off a rule the file has only from the 15th: before then, there is nothing to switch.
        change('quiet', '2024-03-11', '2024-03-16T09:00:00Z', [{ op: 'switchRule', file: 'auth', id: 'user_required', on: false }, { op: 'switchRule', file: 'auth', id: 'country_required', on: false }]),
      ],
    };
    const early = resolve(dated, '2024-03-12');
    expect(early.applied.map((a) => [a.change.id, a.said.length, a.passed])).toEqual([['quiet', 1, 1]]);
    expect(rulesOf(early.doc.ontology, 'auth').map((r) => r.id)).not.toContain('user_required');
    const late = resolve(dated, '2024-03-15');
    expect(late.applied.map((a) => [a.change.id, a.said.length, a.passed])).toEqual([['add', 1, 0], ['quiet', 2, 0]]);
    const step = late.doc.steps.find((s) => s.id === 'auth_valid');
    expect(step?.kind === 'expectations' ? step.ontology : null).toMatchObject({ user_required: 'off', country_required: 'off' });
  });
});

describe('each edit replayed', () => {
  it('adds a rule by its id where the file lacks it, changes it where it has it, and changes nothing where it is so', async () => {
    const doc = await signins();
    const add: RuleEdit = { op: 'setRule', rule: { id: 'user_required', file: 'auth', column: 'user', kind: 'required', action: 'flag' } };
    const a = applyEdit(doc, add)!;
    expect(a.said).toBe('Added a rule to auth: User is never blank, else flag the row and keep it');
    expect(rulesOf(a.doc.ontology, 'auth').at(-1)).toEqual({ id: 'user_required', file: 'auth', column: 'user', kind: 'required', action: 'flag' });
    expect(applyEdit(a.doc, add)).toBeNull();
    expect(applyEdit(a.doc, { op: 'removeRule', file: 'auth', id: 'user_required' })!.said).toBe('Removed a rule from auth: User is never blank');
    expect(applyEdit(doc, { op: 'removeRule', file: 'auth', id: 'user_required' })).toBeNull();
    expect(applyEdit(doc, { op: 'switchRule', file: 'auth', id: 'method_one_of', on: true })).toBeNull();
  });

  it('names a column, accepts a band, and sets a gate’s check, as the app’s edits do', async () => {
    const doc = await signins();
    const named = applyEdit(doc, { op: 'nameColumn', file: 'auth', column: 'method', change: { title: 'Sign-in method' } })!;
    expect(named.said).toBe('Renamed method to Sign-in method in auth');
    const band = applyEdit(doc, { op: 'acceptBand', source: 'auth', band: { column: 'method', value: 'sso', share: [0.2, 0.4] } })!;
    expect(band.said).toMatch(/^Accepted a new band in auth: Method .* between 20% and 40%$/);
    const estate = await loadFlowDir(estateDir);
    const set = applyEdit(estate, { op: 'setCheck', node: 'tls', check: 'classifier', mode: 'warn' })!;
    expect(set.said).toBe('Set the classifier check on tls to warn (it was off)');
    expect(set.doc.gates!.tls!.checks.classifier).toBe('warn');
    expect(applyEdit(set.doc, { op: 'setCheck', node: 'tls', check: 'classifier', mode: 'warn' })).toBeNull();
    // A node no notebook cell defines can't have a gate cell written: it doesn't apply.
    expect(applyEdit(estate, { op: 'setCheck', node: 'nowhere', check: 'forest', mode: 'off' })).toBeNull();
  });
});

describe('a document with change sets', () => {
  it('is checked: each change set named once, dated, with edits this version replays', async () => {
    const doc = await signins();
    const issues = (changes: unknown) => validateDocument({ ...doc, changes } as FlowDocument).filter((i) => i.path.startsWith('$.changes')).map((i) => i.path);
    expect(issues([change('a', '2024-03-12', '2024-03-12T08:00:00Z', [latency(1)])])).toEqual([]);
    expect(issues({})).toEqual(['$.changes']);
    expect(issues([change('a', '2024-3-12', 'yesterday', [])])).toEqual(['$.changes[0].from', '$.changes[0].recorded', '$.changes[0].edits']);
    expect(issues([change('a', '2024-03-12', '2024-03-12T08:00:00Z', [latency(1)]), change('a', '2024-03-13', '2024-03-13T08:00:00Z', [latency(2)])])).toEqual(['$.changes[1].id']);
    expect(issues([{ ...change('a', '2024-03-12', '2024-03-12T08:00:00Z', [latency(1)]), note: 'x' }])).toEqual(['$.changes[0].note']);
    expect(
      issues([
        change('a', '2024-03-12', '2024-03-12T08:00:00Z', [
          { op: 'rename' } as unknown as RuleEdit,
          { op: 'switchRule', file: 'auth', id: 'x' } as unknown as RuleEdit,
          { op: 'setCheck', node: 'auth', check: 'tidiness', mode: 'hold' } as unknown as RuleEdit,
          { op: 'acceptBand', source: 'auth', band: { column: 'method', value: 'sso', share: [0.5, 0.2] } },
        ]),
      ]),
    ).toEqual(['$.changes[0].edits[0]', '$.changes[0].edits[1].on', '$.changes[0].edits[2].check', '$.changes[0].edits[3].band']);
  });

  it('translates to the plan of the rules in force on its run’s day', async () => {
    const doc = await signins();
    const dated: FlowDocument = { ...doc, changes: [change('tighter', '2024-03-12', '2024-03-12T08:00:00Z', [latency(20_000)])] };
    expect(dayOf(dated, { day: '2024-03-12' })).toBe('2024-03-12');
    const shipped = await translate(doc, { day: '2024-03-11' });
    expect(await translate(dated, { day: '2024-03-11' })).toEqual(shipped);
    const tighter = await translate(dated, { day: '2024-03-12' });
    expect(tighter.flow.hash).toBe(await flowHash(inForce(dated, '2024-03-12')));
    expect(tighter.flow.hash).not.toBe(shipped.flow.hash);
    // As known before it was recorded, the 12th ran under the rules as shipped.
    expect((await translate(dated, { day: '2024-03-12' }, { asOf: '2024-03-12T07:59:59Z' })).flow.hash).toBe((await translate(doc, { day: '2024-03-12' })).flow.hash);
  });
});

describe('a day run through the engine under the rules in force', () => {
  const day = securityDays().find((p) => p.day === '2024-03-11')!;
  const at = `${day.day} 10:00:00`;
  const open = async () => {
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    const b = data.sources.auth!;
    await pinFile(db, b.file, utf8(csvOf([...securityRows(day, 0.01), [at, 'success', 'sso', 'US', 'chrome', 25_000, 'planted_1']])));
    await db.execAsync(pinnedDdl(b));
    return db;
  };
  const flagged = (r: Awaited<ReturnType<typeof runFlow>>) => r.manifest.nodes.find((n) => n.origin === 'auth_valid')?.expectations?.rules?.find((x) => x.name === 'latency_ms_range')?.failed;

  it('names the rules it ran under, flags by them, and verifies; a change set recorded later doesn’t reach the run as known before', async () => {
    const doc = await signins();
    const dated: FlowDocument = { ...doc, changes: [change('tighter', '2024-03-01', '2024-03-12T08:00:00Z', [latency(20_000)], 'The vendor’s limit')] };
    const db = await open();
    try {
      const now = await runFlow(db, dated, { smaltdb: SMALTDB, parameters: { day: day.day } });
      expect(now.manifest.flow.rules).toBe(await rulesHash(inForce(dated, day.day)));
      expect(flagged(now)).toBe(1);
      expect((await verifyRun(db, now.run, { smaltdb: SMALTDB, level: 'rerun' })).ok).toBe(true);
      const then = await runFlow(db, dated, { smaltdb: SMALTDB, parameters: { day: day.day }, asOf: '2024-03-11T12:00:00Z' });
      expect(then.manifest.flow.rules).toBe(await rulesHash(doc));
      expect(then.manifest.flow.hash).toBe(await flowHash(doc));
      expect(flagged(then)).toBe(0);
      expect((await verifyRun(db, then.run, { smaltdb: SMALTDB, level: 'rerun' })).ok).toBe(true);
    } finally {
      db.close();
    }
  }, 60_000);
});
