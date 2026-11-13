/**
 * A held day decided with one choice on a flow that watches several sources (Q-193, ADR 0010 §7): one decision a held
 * load, each about its load and naming no keys, and one release citing them all; the day's pause read as its held loads'
 * pauses together (core/hold.ts heldLoadsOf, loadDecisions, keysForLoads, dayPauseOfLoads).
 */
import { describe, expect, it } from 'vitest';
import { dayPauseOfLoads, dayState, heldLoadsOf, keysForLoads, levelsOf, loadDecisions, pausesOf, type Hold, type Load } from '../src/core/hold.js';
import type { LogEntry } from '../src/core/log.js';

const waf: Load = { source: 'waf', slot: '2024-03-12', sha256: 'a'.repeat(64) };
const tls: Load = { source: 'tls', slot: '2024-03-12', sha256: 'b'.repeat(64) };
const inputs = { flow: 'f'.repeat(64), parameters: { day: '2024-03-12' }, files: { waf: waf.sha256, tls: tls.sha256, mfa: 'c'.repeat(64) } };
const hold = (load: Load | undefined, reaches: string[], said = 'off'): Hold => ({ by: 'checks', node: 1, origin: load?.source ?? 'logging', said, reaches, ...(load ? { load } : {}) });
// Two loads hold the run: waf reaches its own output and the posture built from both, tls its own and the posture.
const holds = [hold(waf, ['waf_checked', 'posture']), hold(tls, ['tls_checked', 'posture']), hold(waf, ['posture'], 'again')];
const keys = { waf_checked: 'k1', tls_checked: 'k2', posture: 'k3' };

let seq = 0;
const entry = (kind: string, about: unknown, reason: string | null = null, amends: number | null = null): LogEntry => ({
  smaltflLog: 1, origin: 'test', seq: seq++, kind, at: `2024-03-12T0${Math.min(9, seq)}:00:00Z`, by: { card: null, as: 'ciso' }, about, reason, amends, nonce: '0'.repeat(32),
} as unknown as LogEntry);
const heldRun = () => entry('run', { run: 2, manifest: 'm2', outcome: 'held', day: '2024-03-12', inputs, loads: [waf, tls], holds, waiting: Object.keys(keys), keys });

describe('a day decided once on a flow that watches several sources (Q-193)', () => {
  it('takes each load that holds the run once, in order, and none for a hold of no load', () => {
    expect(heldLoadsOf(holds)).toEqual([waf, tls]);
    expect(heldLoadsOf([hold(undefined, ['posture'])])).toEqual([]);
  });

  it('records one decision a held load: its slot, no keys, the same option, scope and rule; an Accept, its level on each, its own source first', () => {
    const ds = loadDecisions({ run: 2, manifest: 'm2', inputs, loads: [waf, tls], option: 'asis', scope: 'day', policies: 'p', rule: 'leads' });
    expect(ds).toEqual([
      { day: '2024-03-12', run: 2, manifest: 'm2', inputs, outputs: {}, option: 'asis', scope: 'day', policies: 'p', rule: 'leads', load: waf },
      { day: '2024-03-12', run: 2, manifest: 'm2', inputs, outputs: {}, option: 'asis', scope: 'day', policies: 'p', rule: 'leads', load: tls },
    ]);
    const level = { source: 'tls', from: '2024-03-12', metrics: ['values:status'] };
    const accepted = loadDecisions({ run: 2, manifest: 'm2', inputs, loads: [waf, tls], option: 'accept', scope: 'day', policies: 'p', rule: null, level });
    expect(accepted.map((d) => [d.load, d.level])).toEqual([[tls, level], [waf, level]]);
  });

  it('releases only the names every hold of which is about a cited load', () => {
    expect(keysForLoads(keys, holds, [waf, tls])).toEqual(keys);
    expect(keysForLoads(keys, holds, [waf])).toEqual({ waf_checked: 'k1' });
    expect(keysForLoads(keys, [...holds, hold(undefined, ['posture'])], [waf, tls])).toEqual({ waf_checked: 'k1', tls_checked: 'k2' });
  });

  it('reads the day as waiting until every held load is decided, and published once one release cites them all', () => {
    seq = 0;
    const run = heldRun();
    const byKey = (entries: LogEntry[]) => new Map(pausesOf(entries, 'day').map((p) => [p.key, p]));
    const state = (entries: LogEntry[]) => dayState({ holds: holds.length, waiting: 3, released: false }, dayPauseOfLoads(byKey(entries), heldLoadsOf(holds)));
    expect(state([run])).toBe('waiting');
    const [dw, dt] = loadDecisions({ run: 2, manifest: 'm2', inputs, loads: [waf, tls], option: 'asis', scope: 'day', policies: 'p', rule: 'leads' });
    const one = entry('decide', dw, 'A monitor change on one ingress, not a hundred applications');
    expect(state([run, one])).toBe('waiting');
    const two = entry('decide', dt, 'A monitor change on one ingress, not a hundred applications');
    // Both decided to publish, not yet released here: still held back, as a decision to publish is applied by its release.
    expect(dayPauseOfLoads(byKey([run, one, two]), [waf, tls])).toMatchObject({ state: 'decided', released: false });
    const rel = entry('release', { run: 2, manifest: 'm2', outputs: keys, decision: one.seq, decisions: [one.seq, two.seq], leaf: '0'.repeat(64), outcome: 'applied', why: null });
    expect(dayPauseOfLoads(byKey([run, one, two, rel]), [waf, tls])).toMatchObject({ state: 'decided', released: true });
    expect(state([run, one, two, rel])).toBe('asis');
  });

  it('takes an Accept recorded a load as decisions, and its level once, from the release that cites it', () => {
    seq = 0;
    const run = heldRun();
    const level = { source: 'tls', from: '2024-03-12', metrics: ['values:status'] };
    const ds = loadDecisions({ run: 2, manifest: 'm2', inputs, loads: [waf, tls], option: 'accept', scope: 'day', policies: 'p', rule: null, level }).map((d) => entry('decide', d, 'A new normal'));
    const rel = entry('release', { run: 2, manifest: 'm2', outputs: keys, decision: ds[0]!.seq, decisions: ds.map((d) => d.seq), leaf: '0'.repeat(64), outcome: 'applied', why: null });
    const all = [run, ...ds, rel];
    expect(dayState({ holds: holds.length, waiting: 3, released: false }, dayPauseOfLoads(new Map(pausesOf(all, 'day').map((p) => [p.key, p])), [waf, tls]))).toBe('accepted');
    expect(levelsOf(all, 'tls')).toEqual([{ from: '2024-03-12', metrics: ['values:status'], decision: ds[0]!.seq }]);
  });

  it('reads the day as not published when its one choice was not to publish', () => {
    seq = 0;
    const run = heldRun();
    const ds = loadDecisions({ run: 2, manifest: 'm2', inputs, loads: [waf, tls], option: 'dont', scope: 'day', policies: 'p', rule: 'leads' }).map((d) => entry('decide', d));
    expect(dayPauseOfLoads(new Map(pausesOf([run, ...ds], 'day').map((p) => [p.key, p])), [waf, tls])).toMatchObject({ state: 'decided', released: null });
    expect(dayState({ holds: holds.length, waiting: 3, released: false }, dayPauseOfLoads(new Map(pausesOf([run, ...ds], 'day').map((p) => [p.key, p])), [waf, tls]))).toBe('dont');
  });
});
