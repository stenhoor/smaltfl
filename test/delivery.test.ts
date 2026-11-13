/**
 * A later delivery of a day in the record (ADR 0021 §1, §2): it closes the pause of the file it sent again, so the day
 * waits on the correction alone (with several watched sources, only the re-sent file's load), and the history learns the
 * day from the version readers got (core/hold.ts pausesOf, learnedMeasures, skipOf).
 */
import { describe, expect, it } from 'vitest';
import { learnedMeasures, pausesOf, skipOf, type Load } from '../src/core/hold.js';
import type { LogEntry } from '../src/core/log.js';

let seq = 0;
const entry = (kind: string, about: unknown, reason: string | null = null): LogEntry => ({
  smaltflLog: 1, origin: 'test', seq: seq++, kind, at: `2024-03-15T0${Math.min(9, seq)}:00:00Z`, by: { card: null, as: 'owner' }, about, reason, amends: null, nonce: '0'.repeat(32),
} as unknown as LogEntry);
const inputs = (auth: string) => ({ flow: 'f'.repeat(64), parameters: { day: '2024-03-15' }, files: { auth } });
const measures = (rows: number) => ({ smaltflMeasures: 0, source: 'auth', slot: '2024-03-15', every: 'day', rows });
const hold = (by: string, origin: string, load?: Load) => ({ by, node: 1, origin, said: by, reaches: ['auth_valid'], ...(load ? { load } : {}) });

describe('a later delivery of a day in the record', () => {
  it('closes the pause of the file it sent again; the day waits on the correction, then is learned from it', () => {
    seq = 0;
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day: '2024-03-15', inputs: inputs('a'.repeat(64)), holds: [hold('story', 'auth')], waiting: ['auth_valid'], keys: { auth_valid: 'k1' }, measures: [measures(0)] });
    const again = entry('run', { run: 2, manifest: 'm2', outcome: 'held', day: '2024-03-15', inputs: inputs('b'.repeat(64)), correction: { of: 'm1', sources: ['auth'] }, holds: [hold('correction', 'auth')], waiting: ['auth_valid'], keys: { auth_valid: 'k2' }, measures: [measures(6758)] });
    const ps = pausesOf([first, again], 'day');
    expect(ps.map((p) => [p.manifest, p.state])).toEqual([['m1', 'passed'], ['m2', 'open']]);
    expect(skipOf([first, again], 'day')).toEqual(['2024-03-15']);
    // Not yet published: the history still learns the day from its first file.
    expect(learnedMeasures([first, again])).toEqual([measures(0)]);
    const decided = entry('decide', { day: '2024-03-15', run: 2, manifest: 'm2', inputs: inputs('b'.repeat(64)), outputs: { auth_valid: 'k2' }, option: 'asis', scope: 'day', policies: 'p', rule: null }, 'The real export');
    const released = entry('release', { run: 2, manifest: 'm2', outputs: { auth_valid: 'k2' }, decision: decided.seq, leaf: '0'.repeat(64), outcome: 'applied', why: null });
    const all = [first, again, decided, released];
    expect(pausesOf(all, 'day').map((p) => [p.manifest, p.state, p.released])).toEqual([['m1', 'passed', null], ['m2', 'decided', true]]);
    expect(skipOf(all, 'day')).toEqual([]);
    expect(learnedMeasures(all)).toEqual([measures(6758)]);
  });

  it('with several watched sources, closes only the re-sent file’s load: another file that held the day is carried on', () => {
    seq = 0;
    const waf: Load = { source: 'waf', slot: '2024-03-15', sha256: 'a'.repeat(64) };
    const tls: Load = { source: 'tls', slot: '2024-03-15', sha256: 'b'.repeat(64) };
    const waf2: Load = { ...waf, sha256: 'c'.repeat(64) };
    const both = { flow: 'f'.repeat(64), parameters: { day: '2024-03-15' }, files: { waf: waf.sha256, tls: tls.sha256 } };
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day: '2024-03-15', inputs: both, loads: [waf, tls], holds: [hold('checks', 'waf', waf), hold('checks', 'tls', tls)], waiting: ['auth_valid'], keys: { auth_valid: 'k1' } });
    const again = entry('run', { run: 2, manifest: 'm2', outcome: 'held', day: '2024-03-15', inputs: { ...both, files: { ...both.files, waf: waf2.sha256 } }, loads: [waf2, tls], correction: { of: 'm1', sources: ['waf'] }, holds: [hold('correction', 'waf', waf2), hold('checks', 'tls', tls)], waiting: ['auth_valid'], keys: { auth_valid: 'k2' } });
    const ps = pausesOf([first, again], 'day');
    expect(Object.fromEntries(ps.map((p) => [p.load!.sha256.slice(0, 1), p.state]))).toEqual({ a: 'passed', b: 'open', c: 'open' });
    // tls's pause follows the later run, which still holds it.
    expect(ps.find((p) => p.load!.source === 'tls')!.manifest).toBe('m2');
  });

  it('supersedes a watched step’s load the correction changed, and a first file kept back no longer keeps the day out of learning', () => {
    seq = 0;
    const waf: Load = { source: 'waf', slot: '2024-03-15', sha256: 'a'.repeat(64) };
    const step: Load = { source: 'effective', slot: '2024-03-15', sha256: 'e'.repeat(64) };
    const waf2: Load = { ...waf, sha256: 'c'.repeat(64) };
    const step2: Load = { ...step, sha256: 'f'.repeat(64) };
    const files = { flow: 'f'.repeat(64), parameters: { day: '2024-03-15' }, files: { waf: waf.sha256 } };
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day: '2024-03-15', inputs: files, loads: [waf, step], holds: [hold('checks', 'waf', waf), hold('story', 'effective', step)], waiting: ['auth_valid'], keys: { auth_valid: 'k1' } });
    const kept = [waf, step].map((load) => entry('decide', { day: '2024-03-15', run: 1, manifest: 'm1', inputs: files, outputs: {}, option: 'dont', scope: 'day', policies: 'p', rule: null, load }));
    const again = entry('run', { run: 2, manifest: 'm2', outcome: 'held', day: '2024-03-15', inputs: { ...files, files: { waf: waf2.sha256 } }, loads: [waf2, step2], correction: { of: 'm1', sources: ['waf'] }, holds: [hold('correction', 'waf', waf2)], waiting: ['auth_valid'], keys: { auth_valid: 'k2' } });
    const ps = pausesOf([first, ...kept, again], 'day');
    expect(ps.filter((p) => p.manifest === 'm1').map((p) => [p.load!.source, p.state, p.superseded])).toEqual([['waf', 'decided', true], ['effective', 'decided', true]]);
    const published = entry('decide', { day: '2024-03-15', run: 2, manifest: 'm2', inputs: { ...files, files: { waf: waf2.sha256 } }, outputs: {}, option: 'asis', scope: 'day', policies: 'p', rule: null, load: waf2 }, 'The real file');
    const released = entry('release', { run: 2, manifest: 'm2', outputs: { auth_valid: 'k2' }, decision: published.seq, decisions: [published.seq], leaf: '0'.repeat(64), outcome: 'applied', why: null });
    expect(skipOf([first, ...kept, again], 'day')).toEqual(['2024-03-15']);
    expect(skipOf([first, ...kept, again, published, released], 'day')).toEqual([]);
  });
});
