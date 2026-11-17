/**
 * The month in tiers (ADR 0026 §5): above the files and steps, a row a flow. A flow's bar for a day is the worst any
 * of its own files or steps said that day (`flowRows`), with its days in words (`flowRowSaid`). A flow that held
 * nothing of its own while another flow's hold kept back what it gives only waited: told apart and folded with the
 * calm ones, as a step that only followed a file is (ADR 0024 §5), since waiting is not failing.
 *
 * Pure: the page gives the record's entries, this says what each flow's days came to. Nothing here is hashed.
 */
import { flowOwners, givesOf, readsOf, type FlowDocument } from './document.js';
import type { LogEntry } from './log.js';
import type { RunManifest } from './manifest.js';
import { knownOn, runsByDay, type RunAbout } from './month.js';
import { healthOf, healthRows, healthSaid, offDays, type DayFinding, type DayOutcome, type HealthRow, type MonthRowDef } from './overview.js';

/** A flow's row of the month: its days as a file's or a step's are, and the days it only waited. */
export interface FlowRow extends HealthRow {
  /** The flow: a read flow's id, or '' for the document's own. */
  flow: string;
  /** Its own files and steps, counted. */
  files: number;
  steps: number;
  /**
   * `own` (a row's own days) is, for a flow, its rows' own days (ADR 0024 §5): every day a file of it held or was
   * unusual, and each day a step of it did that no file the step reads accounts for. `followedOn`: the flows whose
   * files account for a day a step of it held or was unusual on, by id in the document's order.
   */
  followedOn: string[];
  /** The days it held nothing of its own and another flow's hold kept back something it gives, in order. */
  waited: string[];
  /** The flows it waited on over those days, by id in the document's order ('' the document's own). */
  waitedOn: string[];
}

/** The ids of a flow's own sources and steps: a read flow's by its id, the document's own for ''. */
export function nodesOf(doc: Pick<FlowDocument, 'flows' | 'sources' | 'steps'>, flow: string): { files: string[]; steps: string[] } {
  const owner = flowOwners(doc);
  const mine = (id: string) => (owner.get(id.toLowerCase()) ?? '') === flow;
  return { files: doc.sources.map((s) => s.id).filter(mine), steps: doc.steps.map((s) => s.id).filter(mine) };
}

/** A row of the month before its days are read, and the flow it is a row of ('' the document's own). */
export interface TierRowDef extends MonthRowDef {
  flow: string;
}

/**
 * The month's rows, each in its flow (ADR 0026 §5): a file with the steps of its own flow that read it alone (its
 * fill, its checks), then every other step. The month folds a step that reads one file alone into that file's row
 * (overview.ts `healthRows`); where the step is another flow's, it is that flow's step instead, which reads the file:
 * so a flow's rows are its own, and a step that only followed another flow's file is still told apart from one with
 * trouble of its own. A document that reads no flow has the rows it had.
 */
export function tierRows(doc: Pick<FlowDocument, 'flows' | 'sources' | 'steps'>): TierRowDef[] {
  const owner = flowOwners(doc);
  const of = (id: string) => owner.get(id.toLowerCase()) ?? '';
  const files: TierRowDef[] = [];
  const steps: TierRowDef[] = [];
  for (const r of healthRows(doc)) {
    const flow = of(r.id);
    if (r.kind === 'step') {
      steps.push({ ...r, flow });
      continue;
    }
    files.push({ ...r, origins: r.origins.filter((o) => of(o) === flow), flow });
    for (const o of r.origins) if (of(o) !== flow) steps.push({ id: o, label: o, kind: 'step', origins: [o], reads: [r.id], flow: of(o) });
  }
  // The steps in the document's order, wherever each came from.
  const at = new Map(doc.steps.map((x, i) => [x.id.toLowerCase(), i]));
  steps.sort((a, b) => (at.get(a.id.toLowerCase()) ?? 0) - (at.get(b.id.toLowerCase()) ?? 0));
  return [...files, ...steps];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const aboutOf = (e: Pick<LogEntry, 'about'>): RunAbout => (isRecord(e.about) ? (e.about as unknown as RunAbout) : {});

/**
 * Each flow's row of the month (ADR 0026 §5): the flows the document reads, in its order, then the document's own flow,
 * which is built on them. A row's cell for a day is the worst over the day's runs of what its own files and steps said
 * (overview.ts `healthOf`). A day it `waited`: no run of the day has it holding, and in one of them a hold of another
 * flow keeps back something it gives (every hold, where the flow publishes together). None for a document that reads no
 * flow: its month is its files and steps, as it was.
 */
export function flowRows(
  doc: Pick<FlowDocument, 'flows' | 'sources' | 'steps' | 'publish' | 'name'>,
  days: readonly string[],
  entries: readonly Pick<LogEntry, 'kind' | 'about' | 'at'>[],
  manifests: (hash: string) => Pick<RunManifest, 'nodes'> | null | undefined,
  at?: string | null,
): FlowRow[] {
  const parts = doc.flows ?? [];
  if (!parts.length) return [];
  const owner = flowOwners(doc);
  const ownerOf = (id: string) => owner.get(id.toLowerCase()) ?? '';
  const flows = [...parts.map((f) => ({ id: f.id, name: f.name })), { id: '', name: doc.name }];
  const order = flows.map((f) => f.id);
  const known = runsByDay(knownOn(entries, at));
  const together = doc.publish?.together !== false;
  const out = flows.flatMap((f): FlowRow[] => {
    const nodes = nodesOf(doc, f.id);
    const origins = [...nodes.files, ...nodes.steps];
    // Nothing of it left to see (closed to the viewer): no row.
    if (!origins.length) return [];
    const row = healthOf([{ id: f.id, label: f.name, kind: 'file', origins }], days, entries, manifests, at)[0]!;
    const gives = new Set(givesOf(doc, f.id === '' ? undefined : f.id).map((x) => x.toLowerCase()));
    const waited: string[] = [];
    const on = new Set<string>();
    for (const day of days) {
      if (row.held.includes(day) || !gives.size) continue;
      const others = new Set<string>();
      for (const e of known.get(day) ?? []) {
        const about = aboutOf(e);
        if (about.outcome === 'failed') continue;
        // A file sent again holds for a decision whatever its data says (Q-183), as a file's own row has it: it says
        // nothing of a flow's data. (A what-if is never recorded, and a restated run's own hold is read out of it.)
        for (const h of about.holds ?? []) {
          if (h.by === 'correction' || h.by === 'restated' || h.by === 'what-if' || ownerOf(h.origin) === f.id) continue;
          if (together || h.reaches.some((name) => gives.has(name.toLowerCase()))) others.add(ownerOf(h.origin));
        }
      }
      if (!others.size) continue;
      waited.push(day);
      for (const o of others) on.add(o);
    }
    return [{ ...row, flow: f.id, files: nodes.files.length, steps: nodes.steps.length, followedOn: [], waited, waitedOn: order.filter((id) => on.has(id)) }];
  });
  // A flow's own days are its rows' own (ADR 0024 §5): every day a file of it held or was unusual, and each day a step
  // of it did that no file the step reads accounts for, whichever flow the file is in. On the rest it followed the
  // flows whose files do account for them: the trouble was theirs first.
  const defs = tierRows(doc);
  const rows = healthOf(defs, days, entries, manifests, at);
  const fileAt = new Map(defs.flatMap((d, i) => (d.kind === 'file' ? [[d.id.toLowerCase(), i] as const] : [])));
  for (const r of out) {
    const followed = new Set<string>();
    const own = new Set<string>();
    rows.forEach((x, i) => {
      if (defs[i]!.flow !== r.flow) return;
      for (const d of x.own) own.add(d);
      for (const id of defs[i]!.reads ?? []) {
        const k = fileAt.get(id.toLowerCase());
        if (k === undefined || defs[k]!.flow === r.flow) continue;
        const file = rows[k]!;
        if (x.held.some((d) => file.held.includes(d)) || x.unusual.some((d) => file.held.includes(d) || file.unusual.includes(d))) followed.add(defs[k]!.flow);
      }
    });
    r.own = [...own].sort();
    r.followedOn = order.filter((id) => followed.has(id));
  }
  return out;
}

/** Whether a flow had a day of its own to report: held or unusual where no flow it reads accounts for it. */
export const flowOff = (r: Pick<FlowRow, 'own'>): boolean => r.own.length > 0;

/** Whether a flow only waited: nothing of its own files and steps to report, and days kept back by another flow's hold. */
export const onlyWaited = (r: Pick<FlowRow, 'held' | 'unusual' | 'waited'>): boolean => offDays(r) === 0 && r.waited.length > 0;

/** Whether a flow only followed: it held or was unusual, and only where a file of another flow that its steps read did. */
export const onlyFollowed = (r: Pick<FlowRow, 'held' | 'unusual' | 'own'>): boolean => offDays(r) > 0 && r.own.length === 0;

/**
 * A flow's days in words: what its own files and steps came to, as a file's row says it ("held 2 days (Mon 11, Wed 27) ·
 * unusual on Tue 19"); for a flow that only followed, whom ("held on Fri 16, following HR organisation"); then the days
 * it waited that aren't said already, and on whom ("waited on Evidence feeds on Wed 27"). A flow with nothing of its
 * own to report that waited says only that.
 */
export function flowRowSaid(r: FlowRow, dayName: (day: string) => string, nameOf: (flow: string) => string): string {
  const list = (ids: readonly string[]) => {
    const names = ids.map(nameOf);
    return names.length <= 1 ? (names[0] ?? 'another flow') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  };
  // A day it was unusual on is said already: the days it waited beside those.
  const days = r.waited.filter((d) => !r.unusual.includes(d));
  const listed = `${days.slice(0, 3).map(dayName).join(', ')}${days.length > 3 ? ` and ${days.length - 3} more` : ''}`;
  const waited = !days.length ? '' : days.length === 1 ? `waited on ${list(r.waitedOn)} on ${dayName(days[0]!)}` : `waited on ${list(r.waitedOn)} ${days.length} days (${listed})`;
  if (!offDays(r)) return waited || healthSaid(r, dayName);
  return [`${healthSaid(r, dayName)}${onlyFollowed(r) ? `, following ${list(r.followedOn)}` : ''}`, waited].filter(Boolean).join(' · ');
}

/**
 * What a flow's own month is about (ADR 0026 §5): the flow, and every flow it reads, itself or through another, by id
 * in the document's order with the flow last, as it is built on them. A flow's month is the month of what it stands on.
 */
export function scopeFlows(doc: Pick<FlowDocument, 'flows'>, flow: string): string[] {
  return [...readsOf(doc, flow), flow];
}

/** The ids of every source and step in a flow's scope: its own, and those of the flows it reads. */
export function scopeNodes(doc: Pick<FlowDocument, 'flows' | 'sources' | 'steps'>, flow: string): string[] {
  return scopeFlows(doc, flow).flatMap((f) => {
    const n = nodesOf(doc, f);
    return [...n.files, ...n.steps];
  });
}

/**
 * A day in a flow's own month (ADR 0026 §5), from the day as the whole month has it and what was found that day inside
 * the flow's scope. A day something in scope held is the day's own: paused, decided or kept back, as the decision
 * made it. A day held only outside its scope is none of its business: unusual, not judged or normal by what its own
 * files and steps said. A day not run, not arrived or failed is that for every flow.
 */
export function flowMonthOutcome(day: DayOutcome, found: readonly Pick<DayFinding, 'level'>[]): DayOutcome {
  if (day.outcome === 'notRun' || day.outcome === 'notArrived' || day.outcome === 'failed') return day;
  if (found.some((x) => x.level === 'held')) {
    // Held in scope, and the day went out on its own all the same (a later run of it passed): something to look at.
    return day.outcome === 'waiting' || day.outcome === 'decided' || day.outcome === 'kept' ? day : { day: day.day, outcome: 'unusual', how: null };
  }
  if (found.some((x) => x.level === 'unusual')) return { day: day.day, outcome: 'unusual', how: null };
  if (found.some((x) => x.level === 'unjudged')) return { day: day.day, outcome: 'unjudged', how: null };
  return { day: day.day, outcome: 'normal', how: null };
}
