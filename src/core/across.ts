/**
 * Reading across a change (ADR 0027 §7): what a page says of the steps the record keeps (`step.ts` makes them).
 *
 * - `stepIn`, `moveSaid`: a step's move in one measure, as a number and in words.
 * - `cutsOf`, `adjusted`: where a series is cut (Q-260, Q-284: only where a change of kind *the business changed* has a
 *   step of its own on it), and the published line with the steps taken out (Q-261).
 * - `asDeclared`, `declaredOf`, `declaredOn`: a first day's findings that are the change's own (Q-263). On the first
 *   day of a declared change, a watched dataset whose series the change moved is read as the day's data was judged the
 *   old way, through the run as it was, and says it is as declared: the change's own step is no finding of the day.
 * - `trialMoves`: what a change alone would have moved on the days it was tried on, before it starts (Q-261).
 * - `redefinedOn`: the days a column's meaning was redefined for a dataset (§3, Q-251): what a chart built on the column
 *   is marked with from then.
 * - `followedThrough`: a value of a closed list or column through an ending (§2, Q-264): what it ended into, and what
 *   ended into it, so its series can be followed to its successor.
 *
 * Pure, and no part of what the build's data is made from: no DOM, no engine.
 */
import type { ChangeSet } from './document.js';
import type { LogEntry } from './log.js';
import type { Ended, FollowedHow, Ontology } from './ontology.js';
import { stepsOf, type StepAbout, type StepLevel, type StepMeasure } from './step.js';

/** A step's move in one measure: with the change less without it; null where it didn't move it, or a side has none. */
export function stepIn(step: Pick<StepAbout, 'moved'> | undefined, measure: string): number | null {
  const m = step?.moved.find((x) => x.measure === measure);
  return m && m.without !== null && m.with !== null ? m.with - m.without : null;
}

/** A place a series is cut: the first day of a change whose own step moved it, and the step. */
export interface Cut {
  day: string;
  change: string;
  step: number;
}

/**
 * Where a series is cut (Q-260, Q-284): on the first day of each change of kind *the business changed* whose own step
 * moved this measure, in day order. A change that moved nothing here, a setting re-tuned, a source that changed and a
 * correction are marks, never cuts: the two sides of a cut aren't one trend, and theirs are.
 */
export function cutsOf(changes: readonly Pick<ChangeSet, 'id' | 'kind' | 'from'>[], steps: ReadonlyMap<string, Pick<StepAbout, 'moved' | 'day'>>, measure: string): Cut[] {
  const out: Cut[] = [];
  for (const c of changes) {
    if (c.kind !== 'business') continue;
    const s = steps.get(c.id);
    const step = stepIn(s, measure);
    if (s && step !== null && Math.abs(step) > 1e-9) out.push({ day: s.day, change: c.id, step });
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.change < b.change ? -1 : 1));
}

/**
 * The published line with the steps taken out (Q-261): each point on or after a cut's day shifted back by that
 * change's own step, so the days before and after a change read on one footing. It is drawn beside the published line,
 * labelled as adjusted, never in its place: nobody published these numbers.
 */
export function adjusted<P extends { day: string; value: number | null }>(points: readonly P[], cuts: readonly Cut[]): P[] {
  return points.map((p) => {
    if (p.value === null) return p;
    const shift = cuts.reduce((t, c) => (c.day <= p.day.slice(0, 10) ? t + c.step : t), 0);
    return shift === 0 ? p : { ...p, value: p.value - shift };
  });
}

const signed = (x: number, digits: number): string => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(digits)}`;

/**
 * A step in a measure, in words: "by −0.3, from 93.0 to 92.7". `digits` is how many decimals the measure is read to.
 * Empty where the change didn't move it.
 */
export function moveSaid(step: Pick<StepAbout, 'moved'> | undefined, measure: string, digits = 1): string {
  const m = step?.moved.find((x) => x.measure === measure);
  if (!m || m.without === null || m.with === null) return '';
  return `by ${signed(m.with - m.without, digits)}, from ${m.without.toFixed(digits)} to ${m.with.toFixed(digits)}`;
}

/** What a run's claim of a watched dataset says where it was read as declared: the change whose own step it is. */
export interface DeclaredClaim {
  source?: string;
  state?: string;
  head?: string;
  declared?: string;
}

const WRONG = new Set(['wrong', 'unusual']);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * The step that moved a watched dataset's series on a day (Q-263): the change run both ways that day whose step names
 * the dataset, with its level. Null where none did.
 */
export function declaredOn(steps: ReadonlyMap<string, Pick<StepAbout, 'day' | 'levels'>>, source: string, day: string): { change: string; level: StepLevel } | null {
  for (const [change, step] of steps) {
    if (step.day !== day.slice(0, 10)) continue;
    const level = step.levels?.find((l) => l.source.toLowerCase() === source.toLowerCase());
    if (level) return { change, level };
  }
  return null;
}

/** The files a run read, as one key: each source with its file's sha256, in order. Empty where its entry names none. */
const filesKey = (about: Record<string, unknown>): string =>
  (Array.isArray(about.files) ? about.files : [])
    .flatMap((f) => (isRecord(f) && typeof f.source === 'string' && typeof f.sha256 === 'string' ? [`${f.source.toLowerCase()}:${f.sha256}`] : []))
    .sort()
    .join('|');

/**
 * The record as read once a change's own step is known (Q-263). On the first day of a declared change, each run of the
 * day on the files the step was measured on (the run the step names, the day's earlier run of the same files, a run of
 * them here) says of a watched dataset the change moved what the day's data said the old way, through the run as it
 * was, in place of what it was told: its state and head are that run's, and `declared` names the change. So a day whose
 * only news was the change's own step reads as a normal day, and trouble the old way saw too stays a finding. A run of
 * the day on other files (a file sent again since) was never judged the old way, and reads as it was told. Entries
 * other than those runs are returned as they are; nothing is written: the record keeps what each run was told.
 */
export function asDeclared<E extends Pick<LogEntry, 'kind' | 'about' | 'seq'>>(entries: readonly E[]): E[] {
  const steps = [...stepsOf(entries).values()].filter((s) => s.levels?.some((l) => l.was));
  if (!steps.length) return entries as E[];
  // Each step with the files its day was run both ways on: those of the run it names.
  const on = steps.flatMap((s) => {
    const ran = entries.find((e) => e.kind === 'run' && isRecord(e.about) && e.about.manifest === s.with.manifest);
    const files = ran && isRecord(ran.about) ? filesKey(ran.about) : '';
    return files ? [{ s, files }] : [];
  });
  if (!on.length) return entries as E[];
  return entries.map((e) => {
    if (e.kind !== 'run' || !isRecord(e.about) || typeof e.about.day !== 'string' || !Array.isArray(e.about.claims)) return e;
    const day = e.about.day.slice(0, 10);
    const files = filesKey(e.about);
    const mine = on.filter((x) => x.s.day === day && x.files === files);
    if (!mine.length) return e;
    let touched = false;
    const claims = (e.about.claims as unknown[]).map((c) => {
      if (!isRecord(c) || typeof c.source !== 'string' || typeof c.state !== 'string' || !WRONG.has(c.state)) return c;
      for (const { s } of mine) {
        const level = s.levels!.find((l) => l.was && l.source.toLowerCase() === (c.source as string).toLowerCase());
        if (!level) continue;
        touched = true;
        return { ...c, state: level.was!.state, head: level.was!.head, declared: s.change };
      }
      return c;
    });
    return touched ? ({ ...e, about: { ...e.about, claims } } as E) : e;
  });
}

/**
 * What a run found that is a declared change's own step (Q-263), from a record read by `asDeclared`: each watched
 * dataset read as declared, with the change. It is no finding: the day picked says it beside the day's own.
 */
export function declaredOf(about: { claims?: readonly DeclaredClaim[] } | null | undefined): { origin: string; change: string }[] {
  const out: { origin: string; change: string }[] = [];
  for (const c of about?.claims ?? []) {
    if (!c.source || !c.declared || out.some((x) => x.origin.toLowerCase() === c.source!.toLowerCase())) continue;
    out.push({ origin: c.source, change: c.declared });
  }
  return out;
}

/** A measure a change would have moved on the days it was tried on: on how many, and its figures on the last of them. */
export interface TrialMove {
  measure: string;
  days: number;
  last: { day: string; without: number | null; with: number | null };
}

/**
 * What a change alone would have moved on the days it was tried on (Q-261: the trial days give the same figures before
 * it starts): each measure it moved on at least one of them, in the order the measures are read, with how many days it
 * moved it on and the last day's figures; and how many days had their measures read both ways.
 */
export function trialMoves(days: readonly { day: string; moved?: readonly StepMeasure[]; measured?: number }[]): { moves: TrialMove[]; read: number } {
  const read = days.filter((d) => d.moved !== undefined);
  const moves: TrialMove[] = [];
  for (const d of [...read].sort((a, b) => (a.day < b.day ? -1 : 1))) {
    for (const m of d.moved ?? []) {
      const at = moves.find((x) => x.measure === m.measure);
      if (at) {
        at.days++;
        at.last = { day: d.day, without: m.without, with: m.with };
      } else moves.push({ measure: m.measure, days: 1, last: { day: d.day, without: m.without, with: m.with } });
    }
  }
  return { moves, read: read.length };
}

/**
 * The days a column's meaning was redefined for a dataset (ADR 0027 §3, Q-251): each change set with a `redefine` of
 * the column that names the dataset, or names none (every dataset that has the column), by its first day, in day
 * order. A chart built on the column is marked from each: the days either side of it don't mean the same.
 */
export function redefinedOn(changes: readonly Pick<ChangeSet, 'id' | 'from' | 'edits'>[], dataset: string, column: string): { day: string; change: string }[] {
  const out: { day: string; change: string }[] = [];
  for (const c of changes) {
    const hit = c.edits.some((e) => e.op === 'redefine' && e.column.toLowerCase() === column.toLowerCase() && (!e.datasets?.length || e.datasets.some((d) => d.toLowerCase() === dataset.toLowerCase())));
    if (hit) out.push({ day: c.from, change: c.id });
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.change < b.change ? -1 : 1));
}

/** A value through an ending: what follows it where it ended, and the values that ended into it. */
export interface Followed {
  /** The value ended: with what follows it, where anything does. */
  ended: { then: { how: FollowedHow; by: string[] } | null } | null;
  /** The values that ended into this one (replaced by it, merged into it, or split into it and others). */
  carries: { key: string; how: FollowedHow }[];
}

/**
 * A value of a closed list or column followed through an ending (ADR 0027 §2, Q-264: nothing is deleted, and a series
 * can be followed through to its successor): from the ontology's record of what ended, whether this value did and what
 * follows it, and which values ended into it. `rules` are the file's closed rules on the column, by id. Null where no
 * ending touches the value.
 */
export function followedThrough(o: Pick<Ontology, 'ended'> | undefined, file: string, rules: readonly string[], value: string): Followed | null {
  const mine = (e: Ended) => e.what === 'entry' && !!e.of && e.of.file.toLowerCase() === file.toLowerCase() && rules.includes(e.of.rule);
  const all = (o?.ended ?? []).filter(mine);
  const own = all.find((e) => e.id === value);
  const carries = all.filter((e) => e.id !== value && e.then?.by.includes(value)).map((e) => ({ key: e.id, how: e.then!.how }));
  if (!own && !carries.length) return null;
  return { ended: own ? { then: own.then ? { how: own.then.how, by: [...own.then.by] } : null } : null, carries };
}
