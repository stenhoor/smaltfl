/**
 * A recorded story (ADR 0021 §6): what happened to a generated month beyond its days' first files, written down so the
 * build can record it. Each later delivery of a day's file, with the time it arrived and why it was sent; each
 * decision, about a day's first files or one of its deliveries, with who took it, when and why. `smaltfl-story/1`.
 *
 * The recorder (scripts/data/record.ts) runs the month in time order: each day's first run at its files' time, each
 * delivery's run when it arrives (a correction of the day's latest run, held until a decision, Q-183), and each decision
 * when it is taken (recorded by load on a flow that watches several datasets, Q-193).
 */
import { DECIDE_OPTIONS, type DecisionOption } from './policy.js';

export const STORY_FORMAT = 'smaltfl-story/1';

/** A later delivery of a day's file: the day it covers, the source whose file it is, when it arrived and why. */
export interface Delivery {
  day: string;
  file: string;
  at: string;
  why: string;
}

/**
 * A decision in the story: the day; which of its versions it is about (0 or absent: its first files; n: its n-th
 * delivery, counted from 1 in the order they arrived); when, by whom (a principal of the flow's policies), the option
 * and the reason.
 */
export interface StoryDecision {
  day: string;
  delivery?: number;
  at: string;
  by: string;
  option: DecisionOption;
  reason: string | null;
}

export interface StoryFile {
  format: typeof STORY_FORMAT;
  flow: string;
  deliveries: Delivery[];
  decisions: StoryDecision[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;

/**
 * What is wrong with a story file, as a list of problems (empty when it is good). With `sources` and `principals`, its
 * files and deciders are checked against the flow too. A delivery arrives after its day began; a decision comes after
 * the version it is about arrived, which the recorder checks against the day's own time.
 */
export function storyProblems(v: unknown, o: { sources?: readonly string[]; principals?: readonly string[] } = {}): string[] {
  const out: string[] = [];
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return ['a story is a JSON object'];
  const s = v as Partial<StoryFile>;
  if (s.format !== STORY_FORMAT) out.push(`its format is ${STORY_FORMAT}`);
  if (typeof s.flow !== 'string' || !s.flow) out.push('it names its flow');
  const deliveries = Array.isArray(s.deliveries) ? s.deliveries : (out.push('it lists its deliveries'), []);
  const decisions = Array.isArray(s.decisions) ? s.decisions : (out.push('it lists its decisions'), []);
  deliveries.forEach((d, i) => {
    const at = `delivery ${i + 1}`;
    if (!d || typeof d.day !== 'string' || !DAY.test(d.day)) return void out.push(`${at}: its day is YYYY-MM-DD`);
    if (typeof d.at !== 'string' || !AT.test(d.at)) out.push(`${at}: it arrived at a UTC time`);
    else if (d.at < `${d.day}T00:00`) out.push(`${at}: it arrived before its day began`);
    if (typeof d.file !== 'string' || !d.file) out.push(`${at}: it names its file's source`);
    else if (o.sources && !o.sources.includes(d.file)) out.push(`${at}: ${d.file} isn't a source of the flow`);
    if (typeof d.why !== 'string' || !d.why.trim()) out.push(`${at}: it says why it was sent`);
  });
  decisions.forEach((d, i) => {
    const at = `decision ${i + 1}`;
    if (!d || typeof d.day !== 'string' || !DAY.test(d.day)) return void out.push(`${at}: its day is YYYY-MM-DD`);
    if (typeof d.at !== 'string' || !AT.test(d.at)) out.push(`${at}: it was taken at a UTC time`);
    if (!(DECIDE_OPTIONS as readonly unknown[]).includes(d.option)) out.push(`${at}: its option is one of ${DECIDE_OPTIONS.join(', ')}`);
    if ((d.option === 'asis' || d.option === 'accept') && (typeof d.reason !== 'string' || !d.reason.trim())) out.push(`${at}: ${d.option === 'asis' ? 'publish as is' : 'accept'} needs a reason`);
    if (typeof d.by !== 'string' || !d.by) out.push(`${at}: it names who decided`);
    else if (o.principals && !o.principals.includes(d.by)) out.push(`${at}: ${d.by} isn't a principal of the flow`);
    const n = d.delivery ?? 0;
    const of = deliveries.filter((x) => x?.day === d.day);
    if (!Number.isInteger(n) || n < 0 || n > of.length) out.push(`${at}: ${d.day} has no delivery ${n}`);
    else if (n > 0 && typeof of[n - 1]?.at === 'string' && typeof d.at === 'string' && d.at <= of[n - 1]!.at) out.push(`${at}: it comes before the delivery it is about arrived`);
  });
  return out;
}

/** Whether a value is a good story file. */
export const isStoryFile = (v: unknown): v is StoryFile => storyProblems(v).length === 0;

/** What happens at a moment of the recorded month, in time order. */
export type StoryEvent =
  | { at: string; kind: 'day'; day: string }
  | { at: string; kind: 'delivery'; day: string; n: number; delivery: Delivery }
  | { at: string; kind: 'decision'; day: string; n: number; decision: StoryDecision };

/**
 * The month in time order: each day's first run at its time (`dayAt`), each delivery when it arrived (numbered from 1
 * within its day, in arrival order), and each decision when it was taken. At the same moment a day's run comes first,
 * then deliveries, then decisions.
 */
export function timelineOf(days: readonly string[], dayAt: (day: string) => string, story: StoryFile | null): StoryEvent[] {
  const out: StoryEvent[] = days.map((day) => ({ at: dayAt(day), kind: 'day', day }));
  const byDay = new Map<string, Delivery[]>();
  for (const d of [...(story?.deliveries ?? [])].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))) byDay.set(d.day, [...(byDay.get(d.day) ?? []), d]);
  for (const [day, ds] of byDay) ds.forEach((delivery, i) => out.push({ at: delivery.at, kind: 'delivery', day, n: i + 1, delivery }));
  for (const decision of story?.decisions ?? []) out.push({ at: decision.at, kind: 'decision', day: decision.day, n: decision.delivery ?? 0, decision });
  const rank = { day: 0, delivery: 1, decision: 2 } as const;
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : rank[a.kind] - rank[b.kind]));
}
