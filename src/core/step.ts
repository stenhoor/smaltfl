/**
 * A change's own step (ADR 0027 §7, Q-260, Q-261, Q-263, Q-284).
 *
 * The first day a change of kind *the business changed* is in force is run both ways: as it is published, under the
 * rules with the change, and as a what-if under the rules as they were. What differs between the two, in each
 * published measure, is the change's own step: the change alone moved it, the day's data didn't. The record keeps it
 * beside the change (a `step` entry), so a chart can be cut there and flagged with it, the line can be drawn with the
 * steps taken out, and the learned checks can take the change as the new level of the series it moved.
 *
 * - `asItWas`: the document a change's first day is run under as a what-if: the change set gone, and each entry it
 *   declares in a closed list left out for that day, which is how a day goes out under an ontology that doesn't have
 *   the entry yet (*Publish without it*, §4).
 * - `stepMeasures`: the two runs' published measures compared: the product's score and what it is a share of, the
 *   applications failing each control, each output's rows.
 * - `declaredLevels`: the watched series the change moved (Q-263): each series of a watched step that the two runs give
 *   another value, that stands outside what the days before give it under the change, and that nothing was told of
 *   under the rules as they were; with what the day's data said the old way. `levelsOf` (hold.ts) reads them from the
 *   step's entry as levels from its day. `seriesIn` lists a dataset's series, `toldDay` reads them on the day.
 *
 * What a page reads of a step (where a series is cut, the line with the steps taken out, a first day's findings that
 * are the change's own) is `across.ts`. This file is what the build's recorder makes a step with.
 *
 * Pure: no DOM, no engine.
 */
import type { ChangeSet, FlowDocument } from './document.js';
import { levelMetrics } from './fill.js';
import { metricKey, QUANTILES, type HistoryFile, type HistoryRanges, type Metric } from './history.js';
import { inForce } from './inforce.js';
import type { JSONValue, LogEntry } from './log.js';
import { closedOf } from './rules.js';
import type { Story } from './story.js';

/** One of a day's two runs: the engine's run and its manifest's hash. */
export interface StepSide {
  run: number;
  manifest: string;
}

/** One published measure both ways: under the rules as they were, and with the change. Null where a side has none. */
export interface StepMeasure {
  /** `score`, `coverage`, `checks:applying`, `checks:evidence`, `checks:failing`, `failing:<control>`, `rows:<output>`. */
  measure: string;
  without: number | null;
  with: number | null;
}

/** A change's own step, as the record keeps it (a `step` entry's `about`). */
export interface StepAbout {
  /** The change set whose step it is, and the first day it is in force: the day run both ways. */
  change: string;
  day: string;
  /** The day's run under the rules with the change, and its what-if under the rules as they were. */
  with: StepSide;
  without: StepSide;
  /** The measures the change alone moved, and how many were read both ways: a change that moved none says so. */
  moved: StepMeasure[];
  measured: number;
  /** The entries of a closed list the change declares, left out of the run as it was. */
  leftOut?: { file: string; rule: string; keys: string[] }[];
  /** The watched datasets whose series the change moved (Q-263), each with the metrics off under it that nothing was
   * told of under the rules as they were: its new level, from its first day, which the learned checks learn from; and
   * `was`, what the day's data said of the dataset the old way, which is how the first day's data is judged. */
  levels?: StepLevel[];
}

/** A watched dataset a change's own step moved: the metrics at a new level, and the day's data as judged the old way. */
export interface StepLevel {
  source: string;
  metrics: string[];
  was?: { state: Story['state']; head: string };
}

/** The kind of the record's entry a step is kept as. */
export const STEP_KIND = 'step';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isSide = (v: unknown): v is StepSide => isRecord(v) && Number.isInteger(v.run) && typeof v.manifest === 'string';

/** Whether a record entry's `about` is a step's. */
export function isStep(about: unknown): about is StepAbout {
  return isRecord(about) && typeof about.change === 'string' && typeof about.day === 'string' && isSide(about.with) && isSide(about.without) && Array.isArray(about.moved) && Number.isInteger(about.measured);
}

/** Each change's own step, by the change set's id, as the record keeps it: the last recorded where there are two. */
export function stepsOf(entries: readonly Pick<LogEntry, 'kind' | 'about' | 'seq'>[]): Map<string, StepAbout & { seq: number }> {
  const out = new Map<string, StepAbout & { seq: number }>();
  for (const e of entries) if (e.kind === STEP_KIND && isStep(e.about)) out.set(e.about.change, { ...(e.about as StepAbout), seq: e.seq });
  return out;
}

/**
 * The document a change's first day is run under as it was (Q-261): the flow without that change set, and, where the
 * change declares entries of a closed list or column that the rules without it don't have, a change set for that day
 * alone that leaves them out, recorded at the change's own moment. Under an ontology that doesn't have an entry, its
 * rows stop at the gate; left out, the day goes out without them, which is the business as the ontology knew it.
 */
export function asItWas(doc: FlowDocument, change: ChangeSet): { doc: FlowDocument; leftOut: NonNullable<StepAbout['leftOut']> } {
  const others = (doc.changes ?? []).filter((c) => c.id !== change.id);
  const without: FlowDocument = { ...doc, changes: others };
  const was = inForce(without, change.from, change.recorded);
  const leftOut: NonNullable<StepAbout['leftOut']> = [];
  for (const e of change.edits) {
    if (e.op !== 'declareEntry') continue;
    const key = e.entry[0] ?? '';
    const rule = closedOf(was.ontology, e.file).find((r) => r.id === e.rule);
    if (!rule || key === '' || (rule.leftOut ?? []).includes(key)) continue;
    const had = (rule.entries ?? []).find((x) => x[0] === key);
    // An entry the rules had as declared is no arrival: nothing to leave out.
    if (had && had.length === e.entry.length && had.every((v, k) => v === e.entry[k])) continue;
    const at = leftOut.find((x) => x.file.toLowerCase() === e.file.toLowerCase() && x.rule === e.rule);
    if (at) at.keys.push(key);
    else leftOut.push({ file: e.file, rule: e.rule, keys: [key] });
  }
  if (!leftOut.length) return { doc: without, leftOut };
  const aside: ChangeSet = {
    id: `${change.id}:as-it-was`, from: change.from, until: change.from, recorded: change.recorded, by: change.by, why: `As it was before ${change.id}`, kind: 'corrected',
    edits: leftOut.flatMap((x) => x.keys.map((key) => ({ op: 'leaveOut' as const, file: x.file, rule: x.rule, key }))),
  };
  return { doc: { ...doc, changes: [...others, aside] }, leftOut };
}

/** What a day's run published, as a step reads it: the product's marks where the flow has a product, each output's rows. */
export interface StepMarks {
  score?: number | null;
  coverage?: number | null;
  checks?: { applying: number; evidence: number; failing: number };
  failing?: Record<string, number>;
  rows: Record<string, number>;
}

const differs = (a: number | null, b: number | null): boolean => (a === null || b === null ? a !== b : Math.abs(a - b) > 1e-9);

/**
 * The two runs of a change's first day compared, measure by measure (Q-261): those the change alone moved, and how
 * many were read both ways. A measure one side hasn't is read as none there: a control nothing fails counts none.
 */
export function stepMeasures(without: StepMarks, withIt: StepMarks): { moved: StepMeasure[]; measured: number } {
  const all: StepMeasure[] = [];
  const put = (measure: string, a: number | null | undefined, b: number | null | undefined) => {
    if (a === undefined && b === undefined) return;
    all.push({ measure, without: a ?? null, with: b ?? null });
  };
  put('score', without.score, withIt.score);
  put('coverage', without.coverage, withIt.coverage);
  if (without.checks || withIt.checks) {
    for (const k of ['applying', 'evidence', 'failing'] as const) put(`checks:${k}`, without.checks?.[k], withIt.checks?.[k]);
  }
  if (without.failing || withIt.failing) {
    for (const id of [...new Set([...Object.keys(without.failing ?? {}), ...Object.keys(withIt.failing ?? {})])].sort()) put(`failing:${id}`, without.failing?.[id] ?? 0, withIt.failing?.[id] ?? 0);
  }
  for (const name of [...new Set([...Object.keys(without.rows), ...Object.keys(withIt.rows)])].sort()) put(`rows:${name}`, without.rows[name], withIt.rows[name]);
  return { moved: all.filter((m) => differs(m.without, m.with)), measured: all.length };
}

/**
 * The metrics a story tells as off, loud enough to matter: its lead, what it absorbed, what follows from it, and anything
 * else wrong or unusual. A number that only stands outside its range, of which nothing was told, isn't among them.
 */
const toldOff = (story: Story): Set<string> => new Set(levelMetrics({ hero: story.hero, split: story.split, cause: story.cause, absorbed: story.absorbed, amount: null, findings: story.findings }, false));

/**
 * Every series a dataset's history keeps a day of and a level can name: its rows; each column's blanks and, for a
 * measure or a time, its quantiles; each value of a coded column (its share); each cell of a pair kept day by day.
 */
export function seriesIn(file: Pick<HistoryFile, 'columns' | 'quantiles' | 'values' | 'pairs'>): Metric[] {
  const out: Metric[] = [{ of: 'trips' }];
  const measured = new Set<number>();
  for (const day of file.quantiles) day.forEach((q, j) => (q ? measured.add(j) : undefined));
  file.columns.forEach((column, j) => {
    out.push({ of: 'missing', column });
    if (measured.has(j)) for (let q = 0; q < QUANTILES.length; q++) out.push({ of: 'quantile', column, q });
  });
  for (const [column, vh] of Object.entries(file.values)) if (vh.counts) for (const value of vh.values) out.push({ of: 'value', column, value });
  for (const [pair, vh] of Object.entries(file.pairs)) if (vh.counts) for (const value of vh.values) out.push({ of: 'combo', pair, value });
  return out;
}

/** A watched dataset as one run of a day told it: its story, the series it keeps, and each of them read on the day. */
export interface ToldDay {
  story: Story;
  series: readonly Metric[];
  /** A series on the day: its value, and whether that stands outside what the days before give it (false with no
   * value, or no days to say what is usual). */
  at: (m: Metric) => { value: number | null; outside: boolean };
}

/** A dataset as told on a day, from its story and the ranges it was told by (its history with the day's own numbers). */
export function toldDay(story: Story, ranges: HistoryRanges, day: string): ToldDay {
  return {
    story,
    series: seriesIn(ranges.file),
    at: (m) => {
      const r = ranges.of(m);
      const value = r?.value(day) ?? null;
      const range = value === null ? null : (r?.at(day) ?? null);
      return { value, outside: value !== null && !!range && (value < range.low || value > range.high) };
    },
  };
}

/** The keys a level names a series by: a value's share with its count, as an accepted level names them. */
const keysFor = (m: Metric): string[] => (m.of === 'value' ? [metricKey(m), metricKey({ of: 'count', column: m.column, value: m.value })] : [metricKey(m)]);

/**
 * The watched series a change moved (Q-263). For each watched dataset told both ways, each series that
 *
 * - has another value under the change than under the rules as they were: the change moved it, the same files gave it;
 * - stands outside what the days before give it, under the change: left alone, the checks would tell it, that day or
 *   once the louder ones are learned;
 * - and that nothing was told of under the rules as they were: what the old way told as off is the day's data, and
 *   stays a finding.
 *
 * Each dataset with what the day's data said the old way (`was`): the first day's data is judged through that run, so
 * real trouble on the day of a change isn't hidden by it. Datasets in the order given, none without a series.
 */
export function declaredLevels(withIt: Readonly<Record<string, ToldDay>>, without: Readonly<Record<string, ToldDay>>): StepLevel[] {
  const out: StepLevel[] = [];
  for (const [source, now] of Object.entries(withIt)) {
    const was = without[source];
    // A dataset the run as it was couldn't tell (held before it was built) says nothing of what the change moved.
    if (!was) continue;
    const told = toldOff(was.story);
    const keys = new Set<string>();
    for (const m of now.series) {
      const a = now.at(m);
      if (a.value === null || !a.outside) continue;
      const b = was.at(m);
      if (b.value !== null && !differs(a.value, b.value)) continue;
      for (const k of keysFor(m)) if (!told.has(k)) keys.add(k);
    }
    if (keys.size) out.push({ source, metrics: [...keys].sort(), was: { state: was.story.state, head: was.story.head } });
  }
  return out;
}

/** A step entry's `about` as the record's JSON. */
export const stepAbout = (s: StepAbout): JSONValue => s as unknown as JSONValue;
