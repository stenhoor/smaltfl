/**
 * The versions of the rules (ADR 0021 §5, core/ruleversions.ts): each set of change sets in force on a day at some
 * moment, with where and when it was; the version in force on a day as known at a moment; and what differs between any
 * two documents' rules, item by item and in words.
 */
import { describe, expect, it } from 'vitest';
import type { ChangeSet, FlowDocument, RuleEdit } from '../src/core/document.js';
import type { ScopeRule } from '../src/core/gates.js';
import { inForce } from '../src/core/inforce.js';
import { diffSaid, ruleVersions, rulesDiff, versionKey, versionOn } from '../src/core/ruleversions.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const change = (id: string, from: string, recorded: string, edits: RuleEdit[]): ChangeSet => ({ id, from, recorded, by: 'owner', why: '', edits });
const latency = (max: number): RuleEdit => ({ op: 'setRule', rule: { id: 'latency_ms_range', file: 'auth', column: 'latency_ms', kind: 'range', min: 0, max, action: 'hold' } });

// Larkspur's story in small: a band from Mon 18 recorded Fri 15, and a change back-dated to Fri 1 recorded Mon 25.
const story = {
  changes: [
    change('band', '2024-03-18', '2024-03-15T16:30:00Z', [latency(20_000)]),
    change('hold', '2024-03-01', '2024-03-25T09:40:00Z', [latency(10_000)]),
  ],
};
const days = ['2024-03-04', '2024-03-17', '2024-03-18', '2024-03-31'];

describe('the versions of the rules', () => {
  it('lists each set of change sets in force on a day at some moment, with the days and moments it was', () => {
    const vs = ruleVersions(story, days);
    expect(vs.map((v) => v.changes)).toEqual([[], ['band'], ['hold'], ['band', 'hold']]);
    // As shipped: on every day until the first change set it reached; then, before Mon 18, until the back-dated one.
    expect(vs[0]!.spans).toEqual([
      { day: '2024-03-04', from: null, to: '2024-03-25T09:40:00.000Z' },
      { day: '2024-03-17', from: null, to: '2024-03-25T09:40:00.000Z' },
      { day: '2024-03-18', from: null, to: '2024-03-15T16:30:00.000Z' },
      { day: '2024-03-31', from: null, to: '2024-03-15T16:30:00.000Z' },
    ]);
    expect(vs[1]!.spans).toEqual([
      { day: '2024-03-18', from: '2024-03-15T16:30:00.000Z', to: '2024-03-25T09:40:00.000Z' },
      { day: '2024-03-31', from: '2024-03-15T16:30:00.000Z', to: '2024-03-25T09:40:00.000Z' },
    ]);
    expect(vs[2]!.spans.map((s) => [s.day, s.from, s.to])).toEqual([['2024-03-04', '2024-03-25T09:40:00.000Z', null], ['2024-03-17', '2024-03-25T09:40:00.000Z', null]]);
    expect(vs[3]!.spans.map((s) => s.day)).toEqual(['2024-03-18', '2024-03-31']);
    // A flow without change sets has one version.
    expect(ruleVersions({}, days)).toEqual([{ changes: [], spans: days.map((day) => ({ day, from: null, to: null })) }]);
  });

  it('says the version in force on a day as known at a moment', () => {
    expect(versionOn(story, '2024-03-20', '2024-03-16T00:00:00Z')).toBe(versionKey(['band']));
    expect(versionOn(story, '2024-03-20', '2024-03-14T00:00:00Z')).toBe(versionKey([]));
    expect(versionOn(story, '2024-03-10', null)).toBe(versionKey(['hold']));
    expect(versionOn(story, '2024-03-20')).toBe(versionKey(['band', 'hold']));
  });
});

describe('what differs between two versions', () => {
  it('names each rule, gate and switch that moved, in words', async () => {
    const doc = await loadFlowDir(signinsDir);
    const base = doc as FlowDocument;
    const edited = inForce({ ...base, changes: [change('c', '2024-03-01', '2024-03-02T00:00:00Z', [
      latency(10_000),
      { op: 'switchRule', file: 'auth', id: 'country_required', on: false },
      { op: 'setCheck', node: 'auth', check: 'shape', mode: 'hold' },
    ])] }, '2024-03-04');
    const d = rulesDiff(base, edited);
    // The sign-ins have no gate: setting a check writes one.
    expect(d.map((x) => x.kind)).toEqual(['rule', 'gate', 'switch']);
    expect(d.map((x) => diffSaid(x, edited.ontology))).toEqual([
      'Rule on auth: Latency is from 0 to 30,000 ms, else flag the row and keep it → Latency is from 0 to 10,000 ms, else hold the day',
      'A gate on auth: bronze, shape hold',
      'country_required in auth_valid: on → off',
    ]);
    // The other way round, each from the other side; the same rules differ in nothing.
    expect(rulesDiff(edited, base).map((x) => diffSaid(x, base.ontology))[2]).toBe('country_required in auth_valid: off → on');
    expect(rulesDiff(base, { ...base })).toEqual([]);
    // A check whose mode moved on a gate both have: the layer's default against the gate's own.
    const again = inForce({ ...edited, changes: [change('d', '2024-03-01', '2024-03-03T00:00:00Z', [{ op: 'setCheck', node: 'auth', check: 'amount', mode: 'warn' }])] }, '2024-03-04');
    expect(rulesDiff(edited, again).map((x) => diffSaid(x))).toEqual(['The amount check on auth: hold → warn']);
  });

  it('says a band whose share moved, one added and one taken out', () => {
    const o = (share: [number, number] | null) => ({
      objectTypes: [], linkTypes: [], actionTypes: [],
      properties: [{ column: 'status', title: 'Status', description: '', values: { fail: 'Fail' }, datasets: ['waf', 'tls'], ...(share ? { expect: [{ value: 'fail', share, datasets: ['waf'] }] } : {}) }],
    });
    const at = (share: [number, number] | null) => ({ ontology: o(share), steps: [] });
    expect(rulesDiff(at([0, 0.15]), at([0, 0.1])).map((x) => diffSaid(x, o(null)))).toEqual(['Band for Status Fail in waf: 0%–15% → 0%–10%']);
    expect(rulesDiff(at(null), at([0, 0.1])).map((x) => diffSaid(x))).toEqual(['Band for Status fail in waf: no band → 0%–10%']);
    expect(rulesDiff(at([0, 0.1]), at(null)).map((x) => diffSaid(x))).toEqual(['Band for Status fail in waf: 0%–10% → no band']);
  });

  it('says what else moved where no item names it', () => {
    const gate = (scope?: ScopeRule) => ({ steps: [], gates: { findings: { layer: 'bronze' as const, checks: {}, ...(scope ? { scope } : {}) } } });
    expect(rulesDiff(gate(), gate({ of: 'cmdb_apps', key: 'app_id', where: "hosting <> 'saas'" })).map((x) => diffSaid(x))).toEqual(['Changed: the written rules of findings’s gate']);
    // A gate where there was none, and the other way round, once each.
    expect(rulesDiff({ steps: [] }, gate()).map((x) => diffSaid(x))).toEqual(['A gate on findings: bronze']);
    expect(rulesDiff({ steps: [], gates: { findings: { layer: 'bronze', checks: { values: 'warn' } } } }, { steps: [] }).map((x) => diffSaid(x))).toEqual(['The gate on findings taken out (it was bronze, values warn)']);
  });
});
