/**
 * Fresh (ADR 0020 §2, Q-172): a file its system exported before the day it covers is the last load's again, and hides
 * whatever changed since; the judge says so from the file's facts as the data list gives them (its sha256, its export
 * time, the last load's file), told with the claim. The export time is the proof: the same bytes alone aren't (a
 * catalogue that doesn't change is exported afresh each day with the bytes it had), and a file with no export time
 * isn't judged. A run refuses a claim told of another file than the one its snapshot was read from.
 */
import { describe, expect, it } from 'vitest';
import { NONE, plusDays } from '../src/core/calendar.js';
import { checkOf, LAYER_DEFAULTS } from '../src/core/gates.js';
import { HistoryRanges } from '../src/core/history.js';
import { judgeClaim, type ClaimFacts, type StoryClaim2 } from '../src/core/hold.js';
import { appendPeriods, emptyHistory, measuresOf, type MeasureSettings, type Measures } from '../src/core/measures.js';
import { LEGACY_JUDGE, newsOf, type FileFacts, type JudgeSettings } from '../src/core/news.js';
import { vendorNames } from './helpers/history.js';

/** A day's measures of a file of two hundred rows, nine in ten passing. */
function measured(day: string): Measures {
  const scan: unknown[][] = [];
  for (let i = 0; i < 200; i++) scan.push([i % 10 === 0 ? 'fail' : 'pass']);
  const s: MeasureSettings = { source: 'feed', slot: day, every: 'day', checks: null, counting: null, counted: ['status'], followed: [], paired: [], time: null, zone: null, sample: 2000 };
  return measuresOf(s, { file: null, snapshot: 'x', schema: [['app_id', 'text'], ['status', 'text']], facts: [200, 200, 200, null, null, null, 200, 3, null, null, null], sample: [], scan, checks: null });
}
const DAY = '2024-03-06';
const BEFORE = '2024-03-05';
const first = measured('2024-02-01');
const ms: Measures[] = [];
for (let d = '2024-02-01'; d <= DAY; d = plusDays(d, 1)) ms.push(measured(d));
const h = new HistoryRanges(appendPeriods(emptyHistory({ flow: 'feed', source: 'feed', settings: { checks: null, counted: ['status'], followed: [], paired: [], time: null, zone: null, sample: 2000 }, columns: first.columns, types: first.types, kinds: first.kinds }), ms), { pattern: 'none', calendar: NONE });
const gated = (checks: JudgeSettings['checks'] = LAYER_DEFAULTS.bronze): JudgeSettings => ({ ...LEGACY_JUDGE, legacy: false, calendar: NONE, pattern: 'none', checks });
const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const stale = (file: FileFacts, judge = gated()) => newsOf(h, DAY, vendorNames, { judge, file }).filter((f) => f.kind === 'stale');

describe('a file that isn’t fresh', () => {
  it('is one exported before the day it covers, said as the last load’s file when the bytes are the same too', () => {
    const [same] = stale({ sha256: A, exported: `${BEFORE}T04:55:00Z`, previous: { slot: BEFORE, sha256: A } });
    expect(same).toMatchObject({ key: 'fresh', kind: 'stale', severity: 'alert', check: 'fresh', look: 'integrity', file: { day: DAY, same: true, early: true } });
    expect(same!.title).toBe('The same file as Tue 5’s');
    expect(same!.detail).toBe('Byte for byte the file loaded for Tue Mar 5 (sha256 aaaaaaaaaaaa…), exported Tue Mar 5 at 04:55 UTC: whatever changed since isn’t in it.');
    const [early] = stale({ sha256: B, exported: `${BEFORE}T23:10:00Z`, previous: { slot: BEFORE, sha256: A } });
    expect(early!.title).toBe('Exported Tue 5, before its day');
    expect(early!.detail).toBe('Its system exported Tue Mar 5 at 23:10 UTC, before Wed Mar 6, the day it is loaded for: whatever changed since isn’t in it.');
    expect(checkOf('stale')).toBe('fresh');
  });

  it('is never a file exported on its day, whatever its bytes, nor one with no export time, nor in a flow without gates', () => {
    expect(stale({ sha256: A, exported: `${DAY}T04:55:00Z`, previous: { slot: BEFORE, sha256: A } })).toEqual([]);
    expect(stale({ sha256: A, previous: { slot: BEFORE, sha256: A } })).toEqual([]);
    expect(newsOf(h, DAY, vendorNames, { judge: { ...gated(), checks: null }, file: { sha256: A, exported: `${BEFORE}T04:55:00Z` } }).filter((f) => f.kind === 'stale')).toEqual([]);
    // A day the file doesn't know the load before of still says its export time.
    expect(stale({ sha256: A, exported: `${BEFORE}T04:55:00Z` })[0]!.title).toBe('Exported Tue 5, before its day');
  });

  it('holds by default in bronze, warns when its gate says so, and says nothing when it is off', () => {
    const facts: FileFacts = { sha256: A, exported: `${BEFORE}T04:55:00Z`, previous: { slot: BEFORE, sha256: A } };
    expect(LAYER_DEFAULTS.bronze.fresh).toBe('hold');
    expect([LAYER_DEFAULTS.silver.fresh, LAYER_DEFAULTS.gold.fresh]).toEqual(['off', 'off']);
    expect(stale(facts, gated({ ...LAYER_DEFAULTS.bronze, fresh: 'warn' }))[0]!.severity).toBe('warn');
    expect(stale(facts, gated({ ...LAYER_DEFAULTS.bronze, fresh: 'off' }))).toEqual([]);
  });
});

describe('a claim told of a file', () => {
  const claim = (file?: unknown): Record<string, unknown> => ({
    by: 'story', v: 2, source: 'feed', slot: DAY, every: 'day', state: 'wrong', below: false, head: 'The same file as Tue 5’s', build: 'dev', flow: 'f'.repeat(64),
    history: { base: null, tail: null }, measured: 'c'.repeat(64), rows: 200, skip: [], levels: [], ...(file !== undefined ? { file } : {}),
  });
  const facts = (read: string): ClaimFacts => ({ rows: () => 200, pinned: () => undefined, measured: () => 'c'.repeat(64), flow: 'f'.repeat(64), file: () => read });
  const at = { node: 0, origin: 'feed', file: 'history.feed.json', day: DAY, plan: 2 as const };
  const file = { sha256: A, exported: `${BEFORE}T04:55:00Z`, previous: { slot: BEFORE, sha256: A } };

  it('is judged when it names the file the snapshot was read from, and its record keeps the facts', () => {
    const j = judgeClaim(claim(file), at, facts(A));
    expect('claim' in j && (j.claim as StoryClaim2).file).toEqual(file);
  });

  it('is refused when it names another file, or names one in another shape', () => {
    expect(judgeClaim(claim(file), at, facts(B))).toMatchObject({ unjudged: "the claim was told of another file than the one feed's snapshot was read from" });
    expect(judgeClaim(claim({ sha256: 'not a hash' }), at, facts(A))).toMatchObject({ unjudged: expect.stringMatching(/names a file that isn't a sha256/) });
    // A claim told of no file is judged as every claim before it was.
    expect('claim' in judgeClaim(claim(), at, facts(B))).toBe(true);
  });
});
