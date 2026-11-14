/**
 * A recorded story (ADR 0021 §6): what happened to a generated month beyond its days' first files, written down so the
 * build can record it. Each later delivery of a day's file, with the time it arrived and why it was sent; each
 * decision, about a day's first files or one of its deliveries, with who took it, when and why; each change to the
 * rules people set (a dated change set, ADR 0021 §5, as the page records one), and each restatement of the days a
 * back-dated one reaches, with who decided it, when and why. `smaltfl-story/1`.
 *
 * The recorder (scripts/data/record.ts) runs the month in time order: each day's first run at its files' time, each
 * delivery's run when it arrives (a correction of the day's latest run, held until a decision, Q-183), and each decision
 * when it is taken (recorded by load on a flow that watches several datasets, Q-193). Every run is of the rules in
 * force on its day as known when it ran; a change set reaching days already run runs them again when it is recorded
 * (restated runs), and the story's restatement decides them (Q-190), or, where no day's outcome would change, they are
 * noted at once (Q-199).
 */
import { changesProblems, type ChangeSet } from './document.js';
import { DECIDE_OPTIONS, type DecisionOption } from './policy.js';

export const STORY_FORMAT = 'smaltfl-story/1';

/**
 * A later delivery of a day's file: the day it covers, the source whose file it is, when it arrived and why. `variant`
 * is what the flow's generator draws for it (Larkspur's: `right`, the default, the file as it should have been, or
 * `half`, a doubled file with half its repeats out), for a generated example; a delivery of real data has none.
 */
export interface Delivery {
  day: string;
  file: string;
  at: string;
  why: string;
  variant?: string;
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

/**
 * A restatement in the story (ADR 0021 §5, Q-190): the decision that restates the days its change sets reach, by a
 * principal who may publish a day, at its time, with the reason. Every day whose outcome would change is restated but
 * those it keeps as readers had them (`keep`, unticked); the days whose outcome comes out the same are noted, not
 * decided.
 */
export interface StoryRestatement {
  /** The change sets it restates the days under, by id: those recorded by then that reach days already run. */
  changes: string[];
  at: string;
  by: string;
  reason: string;
  /** The days whose outcome would change that it leaves as readers had them. */
  keep?: string[];
}

export interface StoryFile {
  format: typeof STORY_FORMAT;
  flow: string;
  deliveries: Delivery[];
  decisions: StoryDecision[];
  /** The changes to the rules people set, as the page records them: in force from a day, as known from when recorded. */
  changes?: ChangeSet[];
  restatements?: StoryRestatement[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;

/**
 * What is wrong with a story file, as a list of problems (empty when it is good). With `sources` and `principals`, its
 * files and the people in it are checked against the flow too. A delivery arrives after its day began; a decision comes
 * after the version it is about arrived, which the recorder checks against the day's own time. A change set is checked
 * as the document checks one, and recorded at a UTC time; a restatement comes after the change sets it names were
 * recorded, each change set restated once.
 */
export function storyProblems(v: unknown, o: { sources?: readonly string[]; principals?: readonly string[] } = {}): string[] {
  const out: string[] = [];
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return ['a story is a JSON object'];
  const s = v as Partial<StoryFile>;
  if (s.format !== STORY_FORMAT) out.push(`its format is ${STORY_FORMAT}`);
  if (typeof s.flow !== 'string' || !s.flow) out.push('it names its flow');
  const deliveries = Array.isArray(s.deliveries) ? s.deliveries : (out.push('it lists its deliveries'), []);
  const decisions = Array.isArray(s.decisions) ? s.decisions : (out.push('it lists its decisions'), []);
  const changes = s.changes === undefined ? [] : Array.isArray(s.changes) ? s.changes : (out.push('its changes are a list of change sets'), []);
  const restatements = s.restatements === undefined ? [] : Array.isArray(s.restatements) ? s.restatements : (out.push('its restatements are a list'), []);
  for (const p of changesProblems(changes)) out.push(`${p.path.replace(/^\$\.changes\[(\d+)\]/, (_, i: string) => `change ${Number(i) + 1}`).replace(/^\$\.changes/, 'its changes')}: ${p.message}`);
  changes.forEach((c, i) => {
    const at = `change ${i + 1}`;
    if (!c || typeof c !== 'object') return;
    if (typeof c.recorded === 'string' && !AT.test(c.recorded)) out.push(`${at}: it was recorded at a UTC time`);
    if (typeof c.by === 'string' && o.principals && !o.principals.includes(c.by)) out.push(`${at}: ${c.by} isn't a principal of the flow`);
  });
  const recordedOf = new Map(changes.filter((c) => c && typeof c.id === 'string').map((c) => [c.id, c.recorded] as const));
  const restated = new Set<string>();
  restatements.forEach((r, i) => {
    const at = `restatement ${i + 1}`;
    if (!r || typeof r !== 'object') return void out.push(`${at}: a restatement is { changes, at, by, reason, keep? }`);
    if (!Array.isArray(r.changes) || !r.changes.length) out.push(`${at}: it names the change sets it restates the days under`);
    if (typeof r.at !== 'string' || !AT.test(r.at)) out.push(`${at}: it was decided at a UTC time`);
    for (const id of Array.isArray(r.changes) ? r.changes : []) {
      if (!recordedOf.has(id)) out.push(`${at}: the story has no change set ${String(id)}`);
      else if (restated.has(id)) out.push(`${at}: change set ${id} is restated twice`);
      else {
        restated.add(id);
        const rec = recordedOf.get(id);
        if (typeof rec === 'string' && typeof r.at === 'string' && Date.parse(r.at) <= Date.parse(rec)) out.push(`${at}: it comes before change set ${id} was recorded`);
      }
    }
    if (typeof r.by !== 'string' || !r.by) out.push(`${at}: it names who decided`);
    else if (o.principals && !o.principals.includes(r.by)) out.push(`${at}: ${r.by} isn't a principal of the flow`);
    if (typeof r.reason !== 'string' || !r.reason.trim()) out.push(`${at}: a restatement needs a reason`);
    if (r.keep !== undefined && !(Array.isArray(r.keep) && r.keep.every((d) => typeof d === 'string' && DAY.test(d)))) out.push(`${at}: the days it keeps are YYYY-MM-DD`);
  });
  deliveries.forEach((d, i) => {
    const at = `delivery ${i + 1}`;
    if (!d || typeof d.day !== 'string' || !DAY.test(d.day)) return void out.push(`${at}: its day is YYYY-MM-DD`);
    if (typeof d.at !== 'string' || !AT.test(d.at)) out.push(`${at}: it arrived at a UTC time`);
    else if (d.at < `${d.day}T00:00`) out.push(`${at}: it arrived before its day began`);
    if (typeof d.file !== 'string' || !d.file) out.push(`${at}: it names its file's source`);
    else if (o.sources && !o.sources.includes(d.file)) out.push(`${at}: ${d.file} isn't a source of the flow`);
    if (typeof d.why !== 'string' || !d.why.trim()) out.push(`${at}: it says why it was sent`);
    if (d.variant !== undefined && (typeof d.variant !== 'string' || !d.variant)) out.push(`${at}: its variant is a name`);
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
  | { at: string; kind: 'decision'; day: string; n: number; decision: StoryDecision }
  | { at: string; kind: 'change'; change: ChangeSet }
  | { at: string; kind: 'restate'; restatement: StoryRestatement };

/**
 * The month in time order: each day's first run at its time (`dayAt`), each delivery when it arrived (numbered from 1
 * within its day, in arrival order), each decision when it was taken, each change set when it was recorded, and each
 * restatement when it was decided. At the same moment a day's run comes first, then deliveries, decisions, change sets
 * (in the order the story lists them) and restatements. Times are compared as instants, so two ways of writing one
 * moment are the same moment.
 */
export function timelineOf(days: readonly string[], dayAt: (day: string) => string, story: StoryFile | null): StoryEvent[] {
  const out: StoryEvent[] = days.map((day) => ({ at: dayAt(day), kind: 'day', day }));
  const byDay = new Map<string, Delivery[]>();
  for (const d of [...(story?.deliveries ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) byDay.set(d.day, [...(byDay.get(d.day) ?? []), d]);
  for (const [day, ds] of byDay) ds.forEach((delivery, i) => out.push({ at: delivery.at, kind: 'delivery', day, n: i + 1, delivery }));
  for (const decision of story?.decisions ?? []) out.push({ at: decision.at, kind: 'decision', day: decision.day, n: decision.delivery ?? 0, decision });
  for (const change of story?.changes ?? []) out.push({ at: change.recorded, kind: 'change', change });
  for (const restatement of story?.restatements ?? []) out.push({ at: restatement.at, kind: 'restate', restatement });
  const rank = { day: 0, delivery: 1, decision: 2, change: 3, restate: 4 } as const;
  // A stable sort: events of one kind at one moment keep the order they were added in.
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || rank[a.kind] - rank[b.kind]);
}
