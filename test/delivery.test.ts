/**
 * A later delivery of a day in the record (ADR 0021 §1, §2): it closes the pause of the file it sent again, so the day
 * waits on the correction alone (with several watched sources, only the re-sent file's load), and the history learns the
 * day from the version readers got (core/hold.ts pausesOf, learnedMeasures, skipOf). A day a restatement made held is
 * left out of learning, and a day a restatement published is learned from.
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

describe('a day a restatement made held, not published (ADR 0022 §1)', () => {
  it('is left out of learning, until a later run of the day publishes or a later restatement does', () => {
    seq = 0;
    const day = '2024-03-16';
    const at = (auth: string) => ({ flow: 'f'.repeat(64), parameters: { day }, files: { auth } });
    // Published as it ran, then run again under a back-dated change that holds it.
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'ok', day, inputs: at('a'.repeat(64)) });
    const restated = entry('run', { run: 2, manifest: 'm2', outcome: 'restated', day, inputs: at('a'.repeat(64)), restates: { of: 'm1', changes: ['values-hold'] } });
    const notPublished = entry('restate', { changes: ['values-hold'], from: '2024-03-01', days: [{ day, manifest: 'm2', passes: false }], kept: [], same: [] }, 'The scanner didn’t log in');
    expect(skipOf([first, restated], 'day')).toEqual([]);
    expect(skipOf([first, restated, notPublished], 'day')).toEqual([day]);
    // A later delivery of the day that published brings it back.
    const corrected = entry('run', { run: 3, manifest: 'm3', outcome: 'ok', day, inputs: at('b'.repeat(64)), correction: { of: 'm2', sources: ['auth'] } });
    expect(skipOf([first, restated, notPublished, corrected], 'day')).toEqual([]);
    // So does a later restatement that publishes it; a day it restated as passing was never left out.
    const again = entry('restate', { changes: ['values-hold', 'values-warn'], from: '2024-03-01', days: [{ day, manifest: 'm4', passes: true }], kept: [], same: [] }, 'Back to warn');
    expect(skipOf([first, restated, notPublished, again], 'day')).toEqual([]);
    // A run of the day published before the restatement doesn't.
    expect(skipOf([first, restated, notPublished].map((e, i) => ({ ...e, seq: i })), 'day')).toEqual([day]);
  });
});

describe('a day held, then published by a restatement (ADR 0027 §4, Q-291)', () => {
  const day = '2024-03-27';
  const catalog: Load = { source: 'control_catalog', slot: day, sha256: 'c'.repeat(64) };
  const dr: Load = { source: 'dr_exercises', slot: day, sha256: 'd'.repeat(64) };
  const files = { flow: 'f'.repeat(64), parameters: { day }, files: { control_catalog: catalog.sha256, dr_exercises: dr.sha256 } };

  it('is learned from once the run restated under the rules as changed is no longer stopped by what held it', () => {
    seq = 0;
    // Held at the gate by the catalogue alone; declared, run again and restated: published.
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day, inputs: files, loads: [catalog, dr], holds: [hold('checks', 'control_catalog_checked', catalog)], waiting: ['auth_valid'], keys: { auth_valid: 'k1' } });
    const again = entry('run', { run: 2, manifest: 'm2', outcome: 'restated', day, inputs: files, restates: { of: 'm1', changes: ['sbom-declared'] }, holds: [hold('restated', 'run')] });
    const published = entry('restate', { changes: ['sbom-declared'], from: day, days: [{ day, manifest: 'm2', passes: true }], kept: [], same: [] }, 'The board added the control');
    expect(skipOf([first], 'day')).toEqual([day]);
    expect(skipOf([first, again], 'day')).toEqual([day]);
    expect(skipOf([first, again, published], 'day')).toEqual([]);
    // The pause itself is as it was: nobody decided it, the restatement says what readers got.
    expect(pausesOf([first, again, published], 'day').map((p) => p.state)).toEqual(['open']);
    // A restatement since that leaves the day not published takes it out again.
    const back = entry('restate', { changes: ['sbom-declared', 'sbom-withdrawn'], from: day, days: [{ day, manifest: 'm3', passes: false }], kept: [], same: [] }, 'Withdrawn');
    expect(skipOf([first, again, published, back], 'day')).toEqual([day]);
    // A hold that opens after the restatement is its own: a later file of the day, held, keeps the day out.
    const later = entry('run', { run: 4, manifest: 'm4', outcome: 'held', day, inputs: { ...files, files: { ...files.files, dr_exercises: 'e'.repeat(64) } }, loads: [catalog, { ...dr, sha256: 'e'.repeat(64) }], correction: { of: 'm1', sources: ['dr_exercises'] }, holds: [hold('correction', 'dr_exercises', { ...dr, sha256: 'e'.repeat(64) })], waiting: ['auth_valid'], keys: { auth_valid: 'k4' } });
    expect(skipOf([first, again, published, later], 'day')).toEqual([day]);
  });

  it('stays out for the file the restated run still holds: its decision carried, its data as it was', () => {
    seq = 0;
    // Two files held the day; the restated run passes the catalogue and still holds the exercises, which a decision carried.
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day, inputs: files, loads: [catalog, dr], holds: [hold('checks', 'control_catalog_checked', catalog), hold('story', 'dr_exercises', dr)], waiting: ['auth_valid'], keys: { auth_valid: 'k1' } });
    const again = entry('run', { run: 2, manifest: 'm2', outcome: 'restated', day, inputs: files, restates: { of: 'm1', changes: ['sbom-declared'] }, holds: [hold('restated', 'run'), hold('story', 'dr_exercises', dr)] });
    const published = entry('restate', { changes: ['sbom-declared'], from: day, days: [{ day, manifest: 'm2', passes: true }], kept: [], same: [] }, 'The board added the control');
    const all = [first, again, published];
    expect(skipOf(all, 'day')).toEqual([day]);
    expect(skipOf(all, 'day', 'control_catalog')).toEqual([]);
    expect(skipOf(all, 'day', 'dr_exercises')).toEqual([day]);
  });

  it('with one watched dataset, is learned from where the restated run holds nothing of its own', () => {
    seq = 0;
    const one = { flow: 'f'.repeat(64), parameters: { day }, files: { auth: 'a'.repeat(64) } };
    const first = entry('run', { run: 1, manifest: 'm1', outcome: 'held', day, inputs: one, holds: [hold('checks', 'auth_valid')], waiting: ['auth_valid'], keys: { auth_valid: 'k1' } });
    const passes = entry('run', { run: 2, manifest: 'm2', outcome: 'restated', day, inputs: one, restates: { of: 'm1', changes: ['declared'] }, holds: [hold('restated', 'run')] });
    const stopped = entry('run', { run: 2, manifest: 'm2', outcome: 'restated', day, inputs: one, restates: { of: 'm1', changes: ['declared'] }, holds: [hold('restated', 'run'), hold('story', 'auth')] });
    const published = entry('restate', { changes: ['declared'], from: day, days: [{ day, manifest: 'm2', passes: true }], kept: [], same: [] }, 'Declared');
    expect(skipOf([first, passes, published], 'day')).toEqual([]);
    expect(skipOf([first, stopped, published], 'day')).toEqual([day]);
  });
});
