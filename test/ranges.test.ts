/**
 * Ranges computed ahead (ADR 0019): a range served from a ranges file is the range the judge computes, every metric of
 * it; a day's range doesn't depend on the day's own numbers (so the build's ranges are the page's, whatever the day
 * brings); and the file is taken only on its own history, under its settings, with nothing learned before the day.
 */
import { describe, expect, it } from 'vitest';
import { HistoryRanges, givenApplies, metricKey, type HistoryFile } from '../src/core/history.js';
import { rangesFor } from '../src/core/hold.js';
import { metricsOf, rangesOf, type GivenRanges } from '../src/core/ranges.js';
import { plusDays } from '../src/core/calendar.js';
import { appendPeriods, emptyHistory, type Measures } from '../src/core/measures.js';
import { random } from '../src/core/quality.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';
import { securityHistory } from './fixtures/security.js';

/** The history with its last day's numbers changed: every series one long a day gets another value on that day. */
function perturbLast(h: HistoryFile): HistoryFile {
  const n = h.days.length;
  const bump = (x: unknown): unknown => (typeof x === 'number' ? Math.round(x * 1.37 + 3) : Array.isArray(x) ? x.map(bump) : x);
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.length === n && x !== h.days ? x.map((v, i) => (i === n - 1 ? bump(v) : v)) : x.map(walk);
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k === 'days' ? v : walk(v)]));
    return x;
  };
  return walk(h) as HistoryFile;
}

/** A range as plain data, its lazily made parts read: compared by value, whatever order its keys were made in. */
const plain = (x: unknown) => JSON.parse(JSON.stringify(x ?? null)) as unknown;

/** Two controls a day over many apps, the pair kept day by day (as test/combos.test.ts builds it): pair cells to judge. */
function postureHistory(days: number): HistoryFile {
  const rnd = random(5);
  const ms: Measures[] = [];
  for (let d = '2024-01-02', i = 0; i < days; d = plusDays(d, 1), i++) {
    const c = { ff: 0, fp: 0, pf: 0, pp: 0 };
    for (let a = 0; a < 400; a++) {
      const f = rnd() < 0.1;
      const e = rnd() < (f ? 0.5 : (0.2 - 0.05) / 0.9);
      c[f ? (e ? 'ff' : 'fp') : e ? 'pf' : 'pp']++;
    }
    const kv = (xs: [string, number][]) => xs.filter(([, x]) => x > 0);
    ms.push({
      smaltflMeasures: 0, source: 'posture', slot: d, every: 'day', file: null, snapshot: 'c'.repeat(64), checks: null,
      columns: ['app_id', 'tls', 'encryption'], types: ['text', 'text', 'text'], kinds: ['category', 'code', 'code'],
      rows: 400, dropped: 0, failed: [], present: [400, 400, 400], p50: [null, null, null], quantiles: [null, null, null], sample: 2000, parts: [],
      values: { tls: kv([['"fail"', c.ff + c.fp], ['"pass"', c.pf + c.pp]]), encryption: kv([['"fail"', c.ff + c.pf], ['"pass"', c.fp + c.pp]]) },
      pairs: { 'tls|encryption': kv([['["fail","fail"]', c.ff], ['["fail","pass"]', c.fp], ['["pass","fail"]', c.pf], ['["pass","pass"]', c.pp]]) },
    } as Measures);
  }
  const settings = { checks: null, counted: ['tls', 'encryption'], followed: [], paired: ['tls', 'encryption'], time: null, zone: null, sample: 2000 };
  return appendPeriods(emptyHistory({ flow: 'controls', source: 'posture', settings, columns: ms[0]!.columns, types: ms[0]!.types, kinds: ms[0]!.kinds, warmup: 14 } as Parameters<typeof emptyHistory>[0]), ms);
}

describe.each([
  ['the sign-in log', async () => ({ file: securityHistory(), options: rangesFor(await loadFlowDir(signinsDir), 'auth') })],
  ['the sign-in log without its incidents', async () => ({ file: securityHistory({ incidents: false }), options: rangesFor(await loadFlowDir(signinsDir), 'auth') })],
  ['a posture with a pair kept day by day', async () => ({ file: postureHistory(120), options: { pattern: 'none' as const, echoes: true } })],
])('%s', (_name, make) => {
  const setup = async () => {
    const { file, options } = await make();
    const day = file.days.at(-1)!;
    const live = new HistoryRanges(file, options);
    const shipped = rangesOf(live, day, { sha256: 'h', days: file.days.length - 1, last: file.days.at(-2)! });
    return { file, day, options, live, shipped, given: { file: shipped, sha256: 'h' } satisfies GivenRanges };
  };

  it('serves every metric’s range as the judge computes it, the days learned from included', async () => {
    const { file, day, options, live, shipped, given } = await setup();
    const served = new HistoryRanges(file, { ...options, given });
    const ms = metricsOf(file);
    expect(Object.keys(shipped.ranges).length).toBeGreaterThan(30);
    let compared = 0;
    for (const m of ms) {
      if (!Object.prototype.hasOwnProperty.call(shipped.ranges, metricKey(m))) continue;
      const a = live.of(m)?.at(day) ?? null;
      const b = served.of(m)?.at(day) ?? null;
      expect(plain(b), metricKey(m)).toEqual(plain(a));
      if (a) compared++;
    }
    expect(compared).toBeGreaterThan(10);
    // Pair cells are where the time goes; they are shipped too.
    const pairCells = ms.filter((m) => m.of === 'combo' && !!live.of(m)?.at(day));
    for (const m of pairCells) expect(shipped.ranges[metricKey(m)], metricKey(m)).toBeTruthy();
    if (Object.keys(file.pairs ?? {}).some((p) => file.pairs[p]!.counts)) expect(pairCells.length).toBeGreaterThan(0);
  });

  it('learns a day’s range from the days before it alone: the day’s own numbers change none of them', async () => {
    const { file, day, options, live } = await setup();
    const other = new HistoryRanges(perturbLast(file), options);
    const { shipped } = await setup();
    for (const m of metricsOf(file)) if (Object.prototype.hasOwnProperty.call(shipped.ranges, metricKey(m))) expect(plain(other.of(m)?.at(day)), metricKey(m)).toEqual(plain(live.of(m)?.at(day)));
  });

  it('is taken only on its own history, under its settings, with nothing learned before the day', async () => {
    const { file, day, options, given } = await setup();
    expect(givenApplies(given, file, options)).toBe(true);
    expect(givenApplies({ ...given, sha256: 'another' }, file, options)).toBe(false);
    expect(givenApplies(given, file, { ...options, skip: new Set([file.days[3]!]) })).toBe(false);
    expect(givenApplies(given, file, { ...options, recorded: new Set([file.days[3]!]) })).toBe(false);
    expect(givenApplies(given, file, { ...options, levels: [{ from: file.days[10]!, metrics: ['trips'] }] })).toBe(false);
    expect(givenApplies(given, file, { ...options, pattern: options.pattern === 'none' ? 'weekly' : 'none' })).toBe(false);
    // A day left out after it changes nothing the day learns from.
    expect(givenApplies(given, file, { ...options, skip: new Set(['2999-01-01']) })).toBe(true);
    // Another day of the file: the judge computes it.
    const served = new HistoryRanges(file, { ...options, given });
    const before = file.days.at(-2)!;
    const live = new HistoryRanges(file, options);
    expect(plain(served.of({ of: 'trips' })?.at(before))).toEqual(plain(live.of({ of: 'trips' })?.at(before)));
    void day;
  });
});
