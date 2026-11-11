/**
 * Ranges computed ahead (ADR 0019): every metric's normal range for one day, from a watched history, shipped beside it so
 * the page and the engine judge that day by lookups instead of computing hundreds of ranges (a pair cell each) as the
 * page opens. A day's range is learned from the days before it alone, so the ranges of the first day after a history are
 * the history's own, whatever that day's numbers turn out to be: the build computes them once, exactly as the judge
 * does (`HistoryRanges.of(m).at(day)`), and the judge takes them only for that day, only on that history (by its sha256),
 * under the same settings and with nothing learned between (no tail before the day, no day left out, no level accepted).
 * Anything else, and any metric the file doesn't have, is computed as before. A guess's days learned from, which only a
 * reader of a range asks for, are not shipped: they are computed when read.
 */
import { metricKey, QUANTILES, type HistoryFile, type HistoryRanges, type Metric } from './history.js';
import type { Guess, NormalRange } from './normal.js';

/** A range as shipped: every number of it, its guesses without the days they learned from. */
export type ShippedRange = Omit<NormalRange, 'guesses'> & { guesses: Omit<Guess, 'from'>[] };

export interface RangesFile {
  format: 'smaltfl-ranges/0';
  /** The history the ranges are of: its sha256 and its last day; the day they are for, the first after it. */
  history: { sha256: string; days: number; last: string };
  day: string;
  /** The settings they were computed under (`rangeSettings`). */
  settings: string;
  /** Each metric's range, by `metricKey`; null where the day has none. A metric absent is computed by the judge. */
  ranges: Record<string, ShippedRange | null>;
}

/** What the judge is given: a ranges file, checked against the history it was read with. */
export interface GivenRanges {
  file: RangesFile;
  /** The sha256 of the history the judge was given with it: the ranges are taken only when it is the file's. */
  sha256: string;
}

/** Every metric a history has a series for: what the judge may ask of it. */
export function metricsOf(file: HistoryFile): Metric[] {
  const out: Metric[] = [{ of: 'trips' }, { of: 'dropped' }, { of: 'droppedRows' }];
  for (const r of file.rules ?? []) out.push({ of: 'rule', name: r.name }, { of: 'ruleRows', name: r.name });
  for (const column of file.columns) {
    out.push({ of: 'missing', column }, { of: 'median', column });
    QUANTILES.forEach((_, q) => out.push({ of: 'quantile', column, q }));
  }
  for (const [column, vh] of Object.entries(file.values ?? {})) for (const value of vh.values) out.push({ of: 'value', column, value }, { of: 'count', column, value });
  for (const [pair, vh] of Object.entries(file.pairs ?? {})) for (const value of vh.values) out.push({ of: 'combo', pair, value });
  for (const column of Object.keys(file.due ?? {})) out.push({ of: 'late', column });
  if (file.gate?.scope) out.push({ of: 'scopeOut' }, { of: 'scopeMissing' });
  (file.gate?.needs ?? []).forEach((_, rule) => out.push({ of: 'needs', rule }));
  if (file.gate?.reconcile) for (const count of ['repeats', 'blank', 'missing', 'extra'] as const) out.push({ of: 'reconcile', count });
  return out;
}

const finite = (x: unknown): boolean => {
  if (typeof x === 'number') return Number.isFinite(x);
  if (Array.isArray(x)) return x.every(finite);
  if (x && typeof x === 'object') return Object.values(x).every(finite);
  return true;
};

/** A range without its guesses' days learned from: what is shipped. */
function shipped(r: NormalRange): ShippedRange {
  return { ...r, guesses: r.guesses.map(({ from: _from, ...g }) => g) };
}

/**
 * Every metric's range for `day` on `h`, whose file must hold the day (its numbers are not read: a range is learned from
 * the days before). `history` names the history file the ranges are of (its bytes' sha256, its number of days, its last
 * day): `h`'s file is that history with the day appended. A range with a number JSON can't carry is left out, and the
 * judge computes it.
 */
export function rangesOf(h: HistoryRanges, day: string, history: RangesFile['history']): RangesFile {
  const ranges: Record<string, ShippedRange | null> = {};
  for (const m of metricsOf(h.file)) {
    // A metric the history can't make a series of (drops on a history counted without checks): the judge never asks
    // for it, and would compute it as before if it did.
    let r: NormalRange | null;
    try {
      const nr = h.of(m);
      if (!nr) continue;
      r = nr.at(day);
    } catch {
      continue;
    }
    const s = r ? shipped(r) : null;
    if (s && !finite(s)) continue;
    ranges[metricKey(m)] = s;
  }
  return { format: 'smaltfl-ranges/0', history, day, settings: h.settings, ranges };
}

export const isRangesFile = (x: unknown): x is RangesFile =>
  !!x && typeof x === 'object' && (x as RangesFile).format === 'smaltfl-ranges/0' && typeof (x as RangesFile).day === 'string' && typeof (x as RangesFile).ranges === 'object';

/** Where the page pins a watch's ranges for the engine, beside its history and sample (ADR 0019). */
export const rangesPath = (source: string): string => `ranges.${source}.json`;

