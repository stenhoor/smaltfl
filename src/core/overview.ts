/**
 * The month at a glance (ADR 0024): what a month's days came to, counted and said in the few words a reader takes in
 * first; each file's and step's days, the worst first; and the product's score read as steady, up or down, with what
 * moved it. Pure: the page gives the days as the calendar says them and the record's entries, this says what they add
 * up to. Nothing here runs anything, and nothing here is hashed.
 *
 * - **A day's outcome** (`outcomeOf`) is one of a few: normal, unusual, paused and waiting, paused and then decided
 *   (published, with how), paused and kept back. What the checks found and what people then did are two facts, said
 *   apart: the outcome's mark is one of five, and how a decided day went out is a word beside it.
 * - **A month's summary** (`summaryOf`) counts them, and `headlineOf` says the month in a sentence; `againstSaid` sets
 *   it beside the month before.
 * - **A dataset's days** (`healthOf`): a file's or a step's state on each day, the worst over the day's runs, so a file
 *   that broke and was sent again still shows where it broke; `worstFirst` orders them and `healthSaid` words one.
 * - **The score** (`scoreRead`): its first and last values, how far apart, the range it kept to, and a verdict from a
 *   rule (a change under half a point is steady, as `trendSaid` has it); `moversOf` names what moved between two days.
 */
import type { DayState as PauseState } from './days.js';
import type { LogEntry } from './log.js';
import type { RunManifest } from './manifest.js';
import { cellOf, knownOn, runsByDay, worseCell, type CellState, type DayState as MonthState, type GridRow, type RunAbout } from './month.js';

/**
 * What a day came to, for a reader of the month: published with nothing to say; published with something unusual;
 * published though nothing could judge it; paused and still waiting; paused, then published by a decision; paused, then
 * kept back; the run failed; not arrived yet (as known on a past moment); not run.
 */
export type Outcome = 'normal' | 'unusual' | 'unjudged' | 'waiting' | 'decided' | 'kept' | 'failed' | 'notArrived' | 'notRun';

/** How a paused day went out: as it came, filled from another day, with the part that arrived, as a new level, on a
 * file sent again, or restated under rules changed since. */
export type How = 'asis' | 'fill' | 'complete' | 'accepted' | 'corrected' | 'restated';

/** A day as the calendar says it (the page's `calendarDay`): what became of it, what a decision made of it, its count of
 * versions where it was sent again, and whether it was restated. */
export interface DayFacts {
  state: MonthState;
  decided: PauseState | null;
  corrected: number;
  restated?: boolean | undefined;
}

/** A day's outcome, and how it went out where a decision published it. */
export function outcomeOf(f: DayFacts): { outcome: Outcome; how: How | null } {
  if (f.state === 'notArrived' || f.state === 'notRun' || f.state === 'failed') return { outcome: f.state, how: null };
  if (f.restated) return { outcome: f.state === 'published' ? 'decided' : 'kept', how: 'restated' };
  if (f.corrected > 1 && f.state === 'published') return { outcome: 'decided', how: 'corrected' };
  if (f.decided === 'dont') return { outcome: 'kept', how: null };
  if (f.decided && f.decided !== 'waiting') return { outcome: 'decided', how: f.decided };
  if (f.decided === 'waiting' || f.state === 'paused') return { outcome: 'waiting', how: null };
  if (f.state === 'unusual') return { outcome: 'unusual', how: null };
  if (f.state === 'unlearned') return { outcome: 'unjudged', how: null };
  return { outcome: 'normal', how: null };
}

/** An outcome in a word: what the calendar's cell, the summary's count and the key all say. */
export const OUTCOME_WORD: Record<Outcome, string> = {
  normal: 'Normal', unusual: 'Unusual', unjudged: 'Not judged', waiting: 'Paused', decided: 'Decided', kept: 'Not published', failed: 'Failed', notArrived: 'Not arrived', notRun: 'Not run',
};

/** How a decided day went out, in a word or two: what its cell says under its mark. */
export const HOW_WORD: Record<How, string> = { asis: 'As is', fill: 'Filled', complete: 'Part only', accepted: 'New level', corrected: 'Corrected', restated: 'Restated' };

/** What a day came to, in a line a newcomer can read: what the checks made of it, then what was done. */
export function outcomeSaid(outcome: Outcome, how: How | null = null): string {
  switch (outcome) {
    case 'normal': return 'Published: every check passed';
    case 'unusual': return 'Published, with something unusual';
    case 'unjudged': return 'Published, not judged yet: nothing to compare it with';
    case 'waiting': return 'Paused: it waits for a decision';
    case 'kept': return how === 'restated' ? 'Restated under rules changed since: not published' : 'Paused, then kept back: not published';
    case 'failed': return 'The run failed: nothing published';
    case 'notArrived': return 'Not arrived yet';
    case 'notRun': return 'Not run';
    case 'decided':
      return how === 'fill' ? 'Paused, then published filled from another day'
        : how === 'complete' ? 'Paused, then published with the part that arrived'
        : how === 'accepted' ? 'Paused, then published as a new level'
        : how === 'corrected' ? 'Corrected: a file sent again, and published'
        : how === 'restated' ? 'Restated under rules changed since: published'
        : 'Paused, then published as is';
  }
}

/** A day with its outcome. */
export interface DayOutcome {
  day: string;
  outcome: Outcome;
  how: How | null;
}

/** The months a list of days spans (`YYYY-MM`), in order, once each. */
export const monthsOf = (days: readonly string[]): string[] => [...new Set(days.map((d) => d.slice(0, 7)))].sort();

/** A month's days, counted by what they came to. */
export interface MonthSummary {
  month: string;
  /** The days the month lists, and those with a run as known. */
  days: number;
  arrived: number;
  normal: number;
  unusual: number;
  unjudged: number;
  waiting: number;
  decided: number;
  kept: number;
  failed: number;
  /** Days that went out with nobody deciding: normal, unusual, not judged. */
  auto: number;
  /** Days paused for a decision, whatever became of them: waiting, decided, kept back. */
  paused: number;
  /** Days with something to look at: unusual, paused or failed. */
  attention: number;
  /** How the decided days went out. */
  how: Partial<Record<How, number>>;
  /** The days still waiting, in order. */
  waits: string[];
}

/** A month (`YYYY-MM`) of days, counted. Days of another month are left out. */
export function summaryOf(month: string, days: readonly DayOutcome[]): MonthSummary {
  const s: MonthSummary = { month, days: 0, arrived: 0, normal: 0, unusual: 0, unjudged: 0, waiting: 0, decided: 0, kept: 0, failed: 0, auto: 0, paused: 0, attention: 0, how: {}, waits: [] };
  for (const d of days) {
    if (!d.day.startsWith(month)) continue;
    s.days += 1;
    if (d.outcome === 'notArrived' || d.outcome === 'notRun') continue;
    s.arrived += 1;
    s[d.outcome] += 1;
    if (d.outcome === 'decided' && d.how) s.how[d.how] = (s.how[d.how] ?? 0) + 1;
    if (d.outcome === 'waiting') s.waits.push(d.day);
  }
  s.auto = s.normal + s.unusual + s.unjudged;
  s.paused = s.waiting + s.decided + s.kept;
  s.attention = s.unusual + s.paused + s.failed;
  return s;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * A month in a sentence or two, the conclusion first: how many of its days went out on their own, how many were paused
 * for a decision and what became of those. A month with nothing arrived says so; one where every day was normal says
 * that and no more.
 */
export function headlineOf(s: MonthSummary): string {
  if (!s.arrived) return s.days ? 'No day has arrived yet.' : 'No days.';
  const of = `${fmt(s.auto)} of ${plural(s.arrived, 'day')}`;
  if (s.normal === s.arrived) return `Every day went out on its own: ${plural(s.arrived, 'day')}, none with anything unusual.`;
  const own = s.auto === s.arrived ? `Every day went out on its own, ${fmt(s.unusual + s.unjudged)} with something to look at.` : `${of} went out on ${s.auto === 1 ? 'its' : 'their'} own${s.unusual ? `, ${fmt(s.unusual)} with something unusual` : ''}.`;
  const parts: string[] = [];
  if (s.decided) parts.push(`${fmt(s.decided)} published by a decision`);
  if (s.kept) parts.push(`${fmt(s.kept)} kept back`);
  if (s.waiting) parts.push(`${fmt(s.waiting)} still ${s.waiting === 1 ? 'waits' : 'wait'}`);
  const paused = s.paused ? ` ${fmt(s.paused)} ${s.paused === 1 ? 'was' : 'were'} paused for a decision: ${list(parts)}.` : '';
  const failed = s.failed ? ` ${plural(s.failed, 'run')} failed.` : '';
  const pending = s.arrived < s.days ? ` ${plural(s.days - s.arrived, 'day')} had not arrived.` : '';
  return `${own}${paused}${failed}${pending}`;
}

/**
 * A month beside the one before it, in a line: the days that needed looking at, as counts of each month's days, and
 * which way that went. Null without a month before, or where it had no day arrive. Never a percentage of a percentage:
 * two months have different numbers of days, so each count is said with its own total.
 */
export function againstSaid(prev: MonthSummary | null, cur: MonthSummary, name: (month: string) => string): string | null {
  if (!prev || !prev.arrived || !cur.arrived) return null;
  const share = (s: MonthSummary) => s.attention / s.arrived;
  const d = share(cur) - share(prev);
  const way = Math.abs(d) < 0.02 ? 'about the same as' : d < 0 ? 'fewer than' : 'more than';
  return `${fmt(cur.attention)} of ${plural(cur.arrived, 'day')} needed a look, ${way} ${name(prev.month)} (${fmt(prev.attention)} of ${fmt(prev.arrived)}).`;
}

/** Which way a month went against the one before it: better (fewer days needing a look), worse, or the same. */
export function againstWay(prev: MonthSummary | null, cur: MonthSummary): 'better' | 'worse' | 'same' | null {
  if (!prev || !prev.arrived || !cur.arrived) return null;
  const d = cur.attention / cur.arrived - prev.attention / prev.arrived;
  return Math.abs(d) < 0.02 ? 'same' : d < 0 ? 'better' : 'worse';
}

const aboutOf = (e: Pick<LogEntry, 'about'>): RunAbout => (typeof e.about === 'object' && e.about !== null && !Array.isArray(e.about) ? (e.about as unknown as RunAbout) : {});

/** One thing a run said of its day: the dataset, what was said, and whether it held the day, was unusual, or could not be
 * judged. */
export interface DayFinding {
  origin: string;
  said: string;
  level: 'held' | 'unusual' | 'unjudged';
}

const WRONG = new Set(['wrong', 'unusual', 'refused']);

/**
 * What a run said of its day, each thing once, what held it first: each hold of its data (a later delivery's, a restated
 * run's and a what-if's own holds aside: they say nothing of the data), then each watched dataset told something
 * unusual that no hold already names, then those not judged.
 */
export function findingsOf(about: RunAbout): DayFinding[] {
  const out: DayFinding[] = [];
  const seen = new Set<string>();
  const add = (origin: string, said: string, level: DayFinding['level']) => {
    const k = `${origin.toLowerCase()}|${said}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ origin, said, level });
  };
  const held = new Set<string>();
  for (const h of about.holds ?? []) {
    if (h.by === 'correction' || h.by === 'restated' || h.by === 'what-if') continue;
    held.add(h.origin.toLowerCase());
    add(h.origin, h.said, 'held');
  }
  for (const c of about.claims ?? []) {
    if (!c.source || !c.state || !WRONG.has(c.state) || held.has(c.source.toLowerCase())) continue;
    add(c.source, c.head ?? 'something unusual', 'unusual');
  }
  for (const c of about.claims ?? []) if (c.source && c.state === 'unlearned' && !held.has(c.source.toLowerCase())) add(c.source, c.head ?? 'not judged yet', 'unjudged');
  return out;
}

/** A row of the month before its days are read: a file with the steps that read it alone, or a step with the files it
 * reads, directly or through other steps. */
export interface MonthRowDef extends GridRow {
  kind: 'file' | 'step';
  reads?: string[];
}

/** A dataset's row of the month: a file with the steps that read it alone, or a step, and its days. */
export interface HealthRow {
  id: string;
  label: string;
  kind: 'file' | 'step';
  origins: string[];
  /**
   * The days it held or was unusual on its own account, in order. A file's are all of its days. A step's are those no
   * file it reads accounts for: a day it held while none of its files held, or was unusual while none of them held or was
   * unusual. A step that only follows its files has none: the trouble was caught at the door, not inside the flow.
   */
  own: string[];
  /** Its state on each day, the worst over the day's runs; null where the day has no run. */
  cells: (CellState | null)[];
  /** The days it held the flow (or its file was refused), was unusual, and was not judged, in order. */
  held: string[];
  unusual: string[];
  unjudged: string[];
}

/**
 * The month's rows, from the flow (ADR 0024 §5): each source a file, with the steps that read it and nothing else (its
 * own fill and its own checks: what its bronze gate holds it by); then every other step, a row of its own. So "the file
 * broke" and "a step of ours broke" are different rows, and a file's row is everything that judges the file alone.
 */
export function healthRows(doc: { sources: readonly { id: string }[]; steps: readonly { id: string; inputs: readonly string[] }[] }): MonthRowDef[] {
  const steps = new Map(doc.steps.map((x) => [x.id.toLowerCase(), x]));
  const sources = new Map(doc.sources.map((x) => [x.id.toLowerCase(), x.id]));
  const memo = new Map<string, Set<string>>();
  const reads = (id: string, seen: Set<string> = new Set()): Set<string> => {
    const k = id.toLowerCase();
    const known = memo.get(k);
    if (known) return known;
    const step = steps.get(k);
    if (!step) return new Set([k]);
    if (seen.has(k)) return new Set();
    seen.add(k);
    const out = new Set<string>();
    for (const i of step.inputs) for (const x of reads(i, seen)) out.add(x);
    memo.set(k, out);
    return out;
  };
  const own = new Map<string, string[]>(doc.sources.map((x) => [x.id.toLowerCase(), []]));
  const rest: MonthRowDef[] = [];
  for (const st of doc.steps) {
    const from = [...reads(st.id)];
    const file = from.length === 1 ? own.get(from[0]!) : undefined;
    if (file) file.push(st.id);
    else rest.push({ id: st.id, label: st.id, kind: 'step', origins: [st.id], reads: from.flatMap((k) => (sources.has(k) ? [sources.get(k)!] : [])) });
  }
  return [...doc.sources.map((x): MonthRowDef => ({ id: x.id, label: x.id, kind: 'file', origins: [x.id, ...(own.get(x.id.toLowerCase()) ?? [])] })), ...rest];
}

/**
 * Each row's state on each day, the worst over the day's runs as known on a moment: a file that held the day and was
 * sent again right is still held on that day, so the row shows where it broke. (The month's grid, `gridOf`, reads the
 * latest run alone: what stands now.) A run that failed built nothing and says nothing of a dataset.
 */
export function healthOf(rows: readonly MonthRowDef[], days: readonly string[], entries: readonly Pick<LogEntry, 'kind' | 'about' | 'at'>[], manifests: (hash: string) => Pick<RunManifest, 'nodes'> | null | undefined, at?: string | null): HealthRow[] {
  const known = runsByDay(knownOn(entries, at));
  const out = rows.map((row): HealthRow => {
    const cells = days.map((day): CellState | null => {
      let worst: CellState | null = null;
      for (const e of known.get(day) ?? []) {
        const about = aboutOf(e);
        if (about.outcome === 'failed') continue;
        const c = cellOf(about, typeof about.manifest === 'string' ? manifests(about.manifest) : null, row.origins);
        worst = worst === null ? c : worseCell(worst, c);
      }
      return worst;
    });
    const on = (...states: CellState[]) => days.filter((_, i) => cells[i] !== null && states.includes(cells[i]!));
    return { id: row.id, label: row.label, kind: row.kind, origins: [...row.origins], cells, held: on('held', 'refused'), unusual: on('unusual'), unjudged: on('unlearned'), own: [] };
  });
  const files = new Map(out.filter((r) => r.kind === 'file').map((r) => [r.id.toLowerCase(), r]));
  out.forEach((r, i) => {
    const read = r.kind === 'step' ? (rows[i]!.reads ?? []).flatMap((id) => (files.has(id.toLowerCase()) ? [files.get(id.toLowerCase())!] : [])) : [];
    const heldBy = (day: string) => read.some((f) => f.held.includes(day));
    r.own = [...r.held.filter((d) => !heldBy(d)), ...r.unusual.filter((d) => !heldBy(d) && !read.some((f) => f.unusual.includes(d)))].sort();
  });
  return out;
}

/** Whether a row had anything to report: a day held, refused or unusual. A day not judged is nothing wrong with it. */
export const offDays = (r: Pick<HealthRow, 'held' | 'unusual'>): number => r.held.length + r.unusual.length;

/** Whether a step's days off were all its files': it held or was unusual, and never on its own account. */
export const followsFiles = (r: Pick<HealthRow, 'kind' | 'held' | 'unusual' | 'own'>): boolean => r.kind === 'step' && offDays(r) > 0 && r.own.length === 0;

/** The rows, the worst first: a row with a day still waiting, then the most days held, then the most unusual, then by
 * name. `waiting` are the days still waiting for a decision. */
export function worstFirst<R extends Pick<HealthRow, 'label' | 'held' | 'unusual'>>(rows: readonly R[], waiting: ReadonlySet<string> = new Set()): R[] {
  const open = (r: R) => r.held.filter((d) => waiting.has(d)).length;
  return [...rows].sort((a, b) => open(b) - open(a) || b.held.length - a.held.length || b.unusual.length - a.unusual.length || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
}

/**
 * A row's days in words: "held 2 days (Mon 11, Thu 21) · unusual on Tue 19"; "every day fine" where it has nothing to
 * report. At most three days are named of each kind, then counted.
 */
export function healthSaid(r: Pick<HealthRow, 'held' | 'unusual' | 'unjudged' | 'cells'>, dayName: (day: string) => string): string {
  const named = (days: readonly string[]) => `${days.slice(0, 3).map(dayName).join(', ')}${days.length > 3 ? ` and ${fmt(days.length - 3)} more` : ''}`;
  const part = (verb: string, days: readonly string[]) => (days.length === 1 ? `${verb} on ${dayName(days[0]!)}` : `${verb} ${plural(days.length, 'day')} (${named(days)})`);
  const parts = [r.held.length ? part('held', r.held) : '', r.unusual.length ? part('unusual', r.unusual) : ''].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (!r.cells.some((c) => c !== null && c !== 'absent')) return 'not built';
  return r.unjudged.length ? `fine; not judged ${r.unjudged.length === 1 ? `on ${dayName(r.unjudged[0]!)}` : `on ${plural(r.unjudged.length, 'day')}`}` : 'every day fine';
}

/** A change under this many points is steady (core/posture.ts `trendSaid` says the same of a unit's trend). */
export const STEADY = 0.5;

/** A score over the days it was published: where it started and ended, how far apart, the range it kept to, its
 * biggest move from one published day to the next, and what that adds up to. */
export interface ScoreRead {
  first: { day: string; score: number };
  last: { day: string; score: number };
  delta: number;
  low: number;
  high: number;
  /** How many days had a score. */
  days: number;
  /** The biggest move between two days published one after the other; null with fewer than two. */
  biggest: { day: string; from: string; delta: number } | null;
  verdict: 'steady' | 'up' | 'down';
}

/** A score read over its days (null scores left out); null with none. One day is steady, at itself. */
export function scoreRead(points: readonly { day: string; score: number | null }[]): ScoreRead | null {
  const known = points.filter((p): p is { day: string; score: number } => p.score !== null && Number.isFinite(p.score));
  if (!known.length) return null;
  const first = known[0]!;
  const last = known.at(-1)!;
  const delta = last.score - first.score;
  let biggest: ScoreRead['biggest'] = null;
  for (let i = 1; i < known.length; i++) {
    const d = known[i]!.score - known[i - 1]!.score;
    if (!biggest || Math.abs(d) > Math.abs(biggest.delta)) biggest = { day: known[i]!.day, from: known[i - 1]!.day, delta: d };
  }
  const scores = known.map((p) => p.score);
  return { first: { day: first.day, score: first.score }, last: { day: last.day, score: last.score }, delta, low: Math.min(...scores), high: Math.max(...scores), days: known.length, biggest, verdict: Math.abs(delta) < STEADY ? 'steady' : delta > 0 ? 'up' : 'down' };
}

/** A change in points, signed, to one decimal: "+0.4", "−1.6", "0.0" (a true minus, never a hyphen). */
export const pointsSaid = (d: number): string => {
  const r = Math.round(d * 10) / 10;
  return r === 0 ? '0.0' : `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)}`;
};

/** A count's change, signed: "+48", "−41", "0". */
export const countSaid = (d: number): string => (d === 0 ? '0' : `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}`);

/**
 * A score's trend in a sentence, the verdict first: "Steady: between 93.0 and 93.8 over 60 days published, +0.4 from Thu
 * Feb 1 to Sun Mar 31." A verdict is a finding from a rule (`STEADY`), not the sign of the change; one day says so.
 */
export function readSaid(r: ScoreRead, dayName: (day: string) => string): string {
  if (r.days < 2) return `One day published so far: ${r.last.score.toFixed(1)} on ${dayName(r.last.day)}.`;
  const span = `from ${dayName(r.first.day)} to ${dayName(r.last.day)}`;
  if (r.verdict === 'steady') return `Steady: between ${r.low.toFixed(1)} and ${r.high.toFixed(1)} over ${plural(r.days, 'day')} published, ${pointsSaid(r.delta)} ${span}.`;
  return `${r.verdict === 'up' ? 'Up' : 'Down'} ${Math.abs(r.delta).toFixed(1)} points ${span}: ${r.first.score.toFixed(1)} to ${r.last.score.toFixed(1)}, over ${plural(r.days, 'day')} published.`;
}

/** Something counted on two days, and how it changed. */
export interface Mover {
  id: string;
  from: number;
  to: number;
  delta: number;
}

/**
 * What moved between two days' counts (applications failing each control, say): every id either has, with its count on
 * each (none is zero) and the change; the biggest change first, the unchanged left out. `top` keeps the first few.
 */
export function moversOf(from: Readonly<Record<string, number>>, to: Readonly<Record<string, number>>, top = Infinity): Mover[] {
  const ids = [...new Set([...Object.keys(from), ...Object.keys(to)])];
  return ids.map((id) => ({ id, from: from[id] ?? 0, to: to[id] ?? 0, delta: (to[id] ?? 0) - (from[id] ?? 0) }))
    .filter((m) => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, top);
}
