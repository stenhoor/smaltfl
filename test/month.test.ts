/**
 * The recorded month (ADR 0021 §6, core/month.ts): each day as known on a moment, by its latest run then; what a run
 * says of its day and of each dataset (the grid); the build's entries layered under this browser's; a run made here
 * checked against the recorded one.
 */
import { describe, expect, it } from 'vitest';
import { cellOf, checkAgainst, endOfDay, gridOf, isMonthFile, knownOn, layered, MONTH_FORMAT, monthOf, ownHolds, restatedOutcome, runsByDay, stateOfRun, versionsOf, worseCell, type MonthFile } from '../src/core/month.js';
import type { Hold } from '../src/core/hold.js';
import type { LogEntry } from '../src/core/log.js';
import type { RunManifest } from '../src/core/manifest.js';

const entry = (seq: number, at: string, about: Record<string, unknown>, as = 'build', kind = 'run'): LogEntry => ({
  smaltflLog: 1, origin: 'build:larkspur', seq, kind, at, by: { card: null, as }, about: about as LogEntry['about'], reason: null, amends: null, nonce: '0'.repeat(32),
} as unknown as LogEntry);

const hold = (origin: string, said: string, by: 'checks' | 'story' = 'checks') => ({ by, node: 1, origin, said, reaches: ['posture'] });
const node = (origin: string, extra: Record<string, unknown> = {}) => ({ node: 0, origin, op: 'table', key: `k-${origin}`, status: 'built', content: `c-${origin}`, rows: 10, ...extra });
const manifest = (nodes: unknown[], plan = 'p1') => ({ plan, nodes } as unknown as RunManifest);

const entries: LogEntry[] = [
  entry(0, '2024-03-01T06:05:00Z', { day: '2024-03-01', outcome: 'ok', manifest: 'm1', claims: [{ source: 'effective', state: 'calm', head: 'A normal Friday' }] }),
  entry(1, '2024-03-02T06:05:00Z', { day: '2024-03-02', outcome: 'ok', manifest: 'm2', claims: [{ source: 'effective', state: 'unusual', head: 'Why: 0.3%' }] }),
  entry(2, '2024-03-03T06:05:00Z', { day: '2024-03-03', outcome: 'held', manifest: 'm3', holds: [hold('waf', 'Status fail: 22.7% (band 0%–15%)')], waiting: ['posture'] }),
  entry(3, '2024-03-04T06:05:00Z', { day: '2024-03-04', outcome: 'ok', manifest: 'm4', claims: [{ source: 'effective', state: 'calm', head: 'calm' }, { source: 'tls', state: 'unusual', head: 'Status fail: 8.9%' }] }),
  entry(4, '2024-03-05T06:05:00Z', { day: '2024-03-05', outcome: 'ok', manifest: 'm5', claims: [{ source: 'effective', state: 'unlearned', head: 'Not judged yet' }] }),
  entry(5, '2024-03-06T06:05:00Z', { run: null, load: '2024-03-06', outcome: 'failed', error: 'no such table' }),
];

describe('the month, day by day', () => {
  const days = ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05', '2024-03-06', '2024-03-07'];

  it('says what became of each day by its latest run, never an average', () => {
    const m = monthOf(days, entries, { judged: 'effective' });
    expect(m.map((d) => d.state)).toEqual(['published', 'unusual', 'paused', 'unusual', 'unlearned', 'failed', 'notRun']);
    expect(m.map((d) => d.headline)).toEqual([null, 'Why: 0.3%', 'waf: Status fail: 22.7% (band 0%–15%)', 'tls: Status fail: 8.9%', 'Not judged yet', 'no such table', null]);
    expect(m[0]).toMatchObject({ at: '2024-03-01T06:05:00Z', runs: 1, versions: 1, manifest: 'm1', by: 'build' });
  });

  it('counts a day’s versions: its first files and each later set sent for it, a run again on the same files none', () => {
    const files = (mfa: string) => ({ flow: 'f', parameters: { day: '2024-03-04' }, files: { mfa, waf: 'w' } });
    const day = [
      entry(0, '2024-03-04T05:25:00Z', { day: '2024-03-04', outcome: 'held', manifest: 'v1', inputs: files('a') }),
      entry(1, '2024-03-05T02:40:00Z', { day: '2024-03-04', outcome: 'held', manifest: 'v2', inputs: files('b'), correction: { of: 'v1', sources: ['mfa'] } }),
      entry(2, '2024-03-06T10:00:00Z', { day: '2024-03-04', outcome: 'held', manifest: 'v1b', inputs: files('a') }, 'owner'),
    ];
    expect(versionsOf(day).map((v) => v.runs.map((e) => (e.about as { manifest: string }).manifest))).toEqual([['v1', 'v1b'], ['v2']]);
    expect(monthOf(['2024-03-04'], day)[0]).toMatchObject({ runs: 3, versions: 2, manifest: 'v1b' });
    expect(monthOf(['2024-03-04'], day, { at: '2024-03-05T00:00:00Z' })[0]).toMatchObject({ runs: 1, versions: 1 });
  });

  it('as known on a moment: a day recorded after it hasn’t arrived; a later run of a day is the day’s state then', () => {
    const more = [...entries, entry(6, '2024-03-04T09:00:00Z', { day: '2024-03-03', outcome: 'ok', manifest: 'm3b', claims: [] }, 'owner')];
    const before = monthOf(days, more, { at: endOfDay('2024-03-03'), judged: 'effective' });
    expect(before.map((d) => d.state)).toEqual(['published', 'unusual', 'paused', 'notArrived', 'notArrived', 'notArrived', 'notRun']);
    const now = monthOf(days, more, { judged: 'effective' });
    expect(now[2]).toMatchObject({ state: 'published', runs: 2, manifest: 'm3b', by: 'here', at: '2024-03-03T06:05:00Z' });
    expect(knownOn(more, '2024-03-02T23:00:00Z')).toHaveLength(2);
    expect(knownOn(more, null)).toHaveLength(more.length);
  });

  it('leaves a derived run (a fill) out of its day’s runs', () => {
    const fill = entry(7, '2024-03-03T10:00:00Z', { day: '2024-03-03', outcome: 'derived' }, 'owner');
    expect(runsByDay([...entries, fill]).get('2024-03-03')).toHaveLength(1);
  });

  it('counts a day run again under rules changed since only once a restatement made it what readers got (ADR 0021 §5)', () => {
    const restated = (seq: number, day: string, manifest: string, holds: unknown[]) => entry(seq, '2026-11-14T10:00:00Z', { day, outcome: 'restated', manifest, restates: { of: 'x', changes: ['c1'] }, holds: [...holds, { by: 'restated', node: -1, origin: 'run', said: 'run again', reaches: ['posture'] }] }, 'owner');
    const again = [restated(7, '2024-03-01', 'r1', [hold('auth_valid', 'method_one_of: 3 rows')]), restated(8, '2024-03-02', 'r2', []), restated(9, '2024-03-04', 'r4', [])];
    // Before the restatement, the restated runs are no day's.
    expect(monthOf(days, [...entries, ...again], { judged: 'effective' }).map((d) => d.state)).toEqual(['published', 'unusual', 'paused', 'unusual', 'unlearned', 'failed', 'notRun']);
    const decision = entry(10, '2026-11-14T10:05:00Z', { changes: ['c1'], from: '2024-03-01', days: [{ day: '2024-03-01', manifest: 'r1', passes: false }, { day: '2024-03-02', manifest: 'r2', passes: true }], kept: [{ day: '2024-03-04', manifest: 'r4' }], same: [] }, 'owner', 'restate');
    const all = [...entries, ...again, decision];
    const m = monthOf(days, all, { judged: 'effective' });
    // Mar 1 is held by the new rule; Mar 2 published as restated; Mar 4, unticked, keeps what readers got.
    expect(m.slice(0, 4).map((d) => [d.state, d.headline, d.manifest])).toEqual([['paused', 'auth_valid: method_one_of: 3 rows', 'r1'], ['published', null, 'r2'], ['paused', 'waf: Status fail: 22.7% (band 0%–15%)', 'm3'], ['unusual', 'tls: Status fail: 8.9%', 'm4']]);
    expect(runsByDay(all).get('2024-03-01')!.at(-1)!.about).toMatchObject({ outcome: 'held', holds: [{ by: 'checks' }] });
    // As known before the restatement, nothing moved.
    expect(monthOf(days, all, { at: '2026-11-14T10:01:00Z', judged: 'effective' }).map((d) => d.state)).toEqual(['published', 'unusual', 'paused', 'unusual', 'unlearned', 'failed', 'notRun']);
  });

  it('keeps a day published by a decision held as its decided run was, once a restatement carries the decision', () => {
    const run = entry(7, '2026-11-14T10:00:00Z', { day: '2024-03-03', outcome: 'restated', manifest: 'r3', restates: { of: 'm3', changes: ['c1'] }, holds: [hold('waf', 'Status fail: 22.7% (band 0%–15%)'), { by: 'restated', node: -1, origin: 'run', said: 'run again', reaches: ['posture'] }] }, 'owner');
    const decision = entry(8, '2026-11-14T10:05:00Z', { changes: ['c1'], from: '2024-03-01', days: [{ day: '2024-03-03', manifest: 'r3', passes: true }], kept: [], same: [] }, 'owner', 'restate');
    expect(runsByDay([...entries, run, decision]).get('2024-03-03')!.at(-1)!.about).toMatchObject({ outcome: 'held', manifest: 'r3', holds: [{ origin: 'waf' }] });
  });

  it('leads a held day with its hold and an unusual day with the judged dataset’s own head', () => {
    expect(stateOfRun({ outcome: 'held', holds: [hold('logging_coverage', 'file has 4 of 5 columns')] }, 'effective')).toEqual({ state: 'paused', headline: 'logging_coverage: file has 4 of 5 columns' });
    expect(stateOfRun({ outcome: 'ok', claims: [{ source: 'Effective', state: 'wrong', head: 'Too few' }] }, 'effective')).toEqual({ state: 'unusual', headline: 'Too few' });
    expect(stateOfRun({ outcome: 'ok', claims: [{ source: 'effective', state: 'notes', head: 'noted' }] }, 'effective')).toEqual({ state: 'published', headline: null });
  });
});

describe('the grid: each dataset on each day', () => {
  const manifests: Record<string, RunManifest> = {
    m1: manifest([node('waf'), node('tls'), node('effective')]),
    m3: manifest([node('waf'), node('tls'), node('effective')]),
    m7: manifest([node('logging_coverage', { status: 'refused', content: undefined, refused: 'the header has 4 fields but 5 columns are declared' })]),
  };

  it('says refused, held, unusual, not judged, fine or absent, the worst first', () => {
    expect(cellOf({ holds: [hold('waf', 'x')] }, manifests.m3, ['waf'])).toBe('held');
    expect(cellOf({ holds: [hold('waf', 'x')] }, manifests.m3, ['tls'])).toBe('ok');
    // A file sent again waits for a decision whatever its data says (Q-183): its cell says its data.
    expect(cellOf({ holds: [{ ...hold('waf', 'a later file for its day: it waits for a decision'), by: 'correction' }] }, manifests.m3, ['waf'])).toBe('ok');
    expect(cellOf({}, manifests.m7, ['logging_coverage'])).toBe('refused');
    expect(cellOf({}, manifests.m7, ['waf'])).toBe('absent');
    expect(cellOf({ claims: [{ source: 'tls', state: 'unusual' }] }, manifests.m1, ['tls', 'waf'])).toBe('unusual');
    expect(cellOf({ claims: [{ source: 'tls', state: 'unlearned' }] }, manifests.m1, ['tls'])).toBe('unlearned');
    expect(worseCell('ok', 'held')).toBe('held');
    expect(worseCell('absent', 'ok')).toBe('ok');
  });

  it('puts the rows against the days by each day’s latest run, null where none', () => {
    const g = gridOf([{ id: 'bronze', label: 'bronze', origins: ['waf', 'tls'] }, { id: 'posture', label: 'posture', origins: ['effective'] }], ['2024-03-01', '2024-03-03', '2024-03-09'], entries, (h) => manifests[h]);
    expect(g).toEqual([['ok', 'held', null], ['ok', 'ok', null]]);
  });
});

describe('the build’s entries under this browser’s', () => {
  it('renumbers them below every entry recorded here, in order, amendments with them', () => {
    const file = { entries: [entries[0]!, { ...entries[1]!, amends: 0 }] };
    const l = layered(file);
    expect(l.map((e) => e.seq)).toEqual([-2, -1]);
    expect(l[1]!.amends).toBe(-2);
    expect(file.entries[0]!.seq).toBe(0);
  });

  it('renumbers what a decision or a release cites with them: its decisions, the standing decision, the withdrawal', () => {
    const file = { entries: [
      entries[2]!,
      entry(1, '2024-03-03T08:00:00Z', { day: '2024-03-03', option: 'dont', scope: 'untilPass' }, 'ciso', 'decide'),
      entry(2, '2024-03-03T08:00:00Z', { day: '2024-03-03', option: 'dont', under: 1 }, 'ciso', 'decide'),
      entry(3, '2024-03-03T09:00:00Z', { run: 1, decision: 2, decisions: [2, 1], under: 1, withdraws: 0, outcome: 'applied' }, 'ciso', 'release'),
      entry(4, '2024-03-03T09:30:00Z', { day: '2024-03-03', outcome: 'ok', manifest: 'm', decision: 3 }),
    ] };
    const l = layered(file);
    expect(l.map((e) => e.seq)).toEqual([-5, -4, -3, -2, -1]);
    expect(l[2]!.about).toMatchObject({ under: -4 });
    expect(l[3]!.about).toEqual({ run: 1, decision: -3, decisions: [-3, -4], under: -4, withdraws: -5, outcome: 'applied' });
    // A run's fields aren't seqs of entries: left as they are.
    expect(l[4]!.about).toMatchObject({ decision: 3 });
    expect(file.entries[3]!.about).toMatchObject({ decision: 2 });
  });

  it('takes only a recorded month', () => {
    const good: MonthFile = { format: MONTH_FORMAT, flow: 'larkspur', build: 'abc', now: '2024-04-01T08:00:00Z', entries, manifests: {} };
    expect(isMonthFile(good)).toBe(true);
    expect(isMonthFile({ ...good, format: 'smaltfl-month/2' })).toBe(false);
    expect(isMonthFile({ ...good, entries: [{ kind: 'run' }] })).toBe(false);
    expect(isMonthFile('nope')).toBe(false);
  });
});

describe('a run made here against its record', () => {
  const recorded = { manifest: manifest([node('waf'), node('effective'), node('folded', { content: undefined, status: 'folded' })]), holds: [hold('waf', 'x')] };

  it('matches on the same plan, contents and holds, whatever else differs', () => {
    const here = { manifest: manifest([node('waf', { ingest: { at: 'now' } }), node('effective'), node('folded', { content: undefined, status: 'folded' })]), holds: [hold('waf', 'said otherwise')] };
    expect(checkAgainst(recorded, here)).toEqual({ matches: true, plan: null, differs: [], holds: { recorded: ['checks:waf'], here: ['checks:waf'] } });
  });

  it('takes each hold once: a check held by load, or spared on loads read before, is the same hold of the day', () => {
    const byLoad = (load: string) => ({ ...hold('app_owners', 'x'), load: { source: load, slot: '2024-03-18', sha256: load } });
    const recordedSplit = { manifest: recorded.manifest, holds: [hold('org_chain', 'y'), byLoad('hr_org_units'), byLoad('cmdb_apps'), byLoad('apps')] };
    const hereSpared = { manifest: recorded.manifest, holds: [hold('org_chain', 'y'), byLoad('hr_org_units')] };
    expect(checkAgainst(recordedSplit, hereSpared)).toMatchObject({ matches: true, holds: { recorded: ['checks:app_owners', 'checks:org_chain'], here: ['checks:app_owners', 'checks:org_chain'] } });
  });

  it('says which dataset differs, a hold that differs, or another plan', () => {
    const here = { manifest: manifest([node('waf'), node('effective', { content: 'c-other' })], 'p2'), holds: [] };
    const c = checkAgainst(recorded, here);
    expect(c.matches).toBe(false);
    expect(c.plan).toEqual({ recorded: 'p1', here: 'p2' });
    expect(c.differs).toEqual([{ origin: 'effective', recorded: 'c-effective', here: 'c-other' }]);
    expect(c.holds).toEqual({ recorded: ['checks:waf'], here: [] });
  });
});

describe('a day run again under rules changed since, against what readers got (ADR 0021 §5)', () => {
  const h = (by: Hold['by'], origin: string, said: string, load?: Hold['load']): Hold => ({ by, node: 1, origin, said, reaches: ['posture'], ...(load ? { load } : {}) });
  const restated = h('restated', 'run', 'run again under rules changed since');
  const band = h('story', 'findings', 'Credentialed no: 4.1% (band 0%–2%)', { source: 'findings', slot: '2024-03-16', sha256: 'f16' });
  const waf = h('story', 'waf', '50 apps out of scope', { source: 'waf', slot: '2024-03-13', sha256: 'w13' });
  const out = { a: 'c1', b: 'c2' };

  it('is published and the same where nothing holds it and every output is as it was', () => {
    expect(restatedOutcome({ published: true, holds: [], contents: out }, { holds: [restated], contents: { ...out } })).toEqual({ passes: true, carried: false, changed: false, differ: 0, fresh: [] });
    expect(restatedOutcome({ published: true, holds: [], contents: out }, { holds: [restated], contents: { ...out, b: 'c3' } })).toMatchObject({ passes: true, changed: true, differ: 1 });
    // An output's content unknown on either side: it may differ.
    expect(restatedOutcome({ published: true, holds: [], contents: null }, { holds: [restated], contents: out })).toMatchObject({ passes: true, changed: true, differ: null });
  });

  it('changes a published day the new rules hold, saying what holds it', () => {
    expect(restatedOutcome({ published: true, holds: [], contents: out }, { holds: [band, restated], contents: out })).toEqual({ passes: false, carried: false, changed: true, differ: 0, fresh: [band] });
  });

  it('carries the decision that published a held day where the same holds say the same', () => {
    const r = restatedOutcome({ published: true, holds: [waf], contents: out }, { holds: [{ ...waf, reaches: ['other'] }, restated], contents: out });
    expect(r).toEqual({ passes: true, carried: true, changed: false, differ: 0, fresh: [] });
    // A hold that says anything new is decided again.
    expect(restatedOutcome({ published: true, holds: [waf], contents: out }, { holds: [{ ...waf, said: '51 apps out of scope' }, restated], contents: out })).toMatchObject({ passes: false, carried: false, changed: true });
    expect(restatedOutcome({ published: true, holds: [waf], contents: out }, { holds: [waf, band, restated], contents: out })).toMatchObject({ passes: false, changed: true, fresh: [band] });
    // The same hold on another load is another hold.
    expect(restatedOutcome({ published: true, holds: [waf], contents: out }, { holds: [{ ...waf, load: { ...waf.load!, sha256: 'w13b' } }], contents: out })).toMatchObject({ passes: false, changed: true });
  });

  it('leaves a day kept back or waiting the same where the same holds hold it, and changes it where nothing does', () => {
    expect(restatedOutcome({ published: false, holds: [waf], contents: out }, { holds: [waf, restated], contents: out })).toMatchObject({ passes: false, carried: false, changed: false });
    expect(restatedOutcome({ published: false, holds: [waf], contents: out }, { holds: [restated], contents: out })).toMatchObject({ passes: true, changed: true });
  });

  it('never compares a later delivery’s or a restated run’s own hold', () => {
    const correction = h('correction', 'tls', 'sent again: waits for a decision');
    expect(ownHolds([correction, restated, band])).toEqual([band]);
    // A correction published by its decision, run again with nothing holding it: published, the same.
    expect(restatedOutcome({ published: true, holds: [correction], contents: out }, { holds: [restated], contents: out })).toMatchObject({ passes: true, carried: false, changed: false });
  });
});
