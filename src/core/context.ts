/**
 * Context that travels (ADR 0027 §8): a slice of data, one dataset on one day in one version, knows its context.
 *
 * Three tables any cell can join to, made by the run for its day and published with the product like any output:
 *
 * - `changes`: the dated changes in force on the day, a row a change and a dataset it reaches (the file or step it is
 *   about, and everything built from it), with its kind, its first and last day, what it did and why in its author's
 *   words, who recorded it, who decided it and who agreed to it, and its own step where one was measured.
 * - `events`: what was going on that day, a row an event and a dataset it reaches, with which day of it this is and
 *   what it excuses there.
 * - `in_force`: a row a dataset of the day, with the version of the ontology it was read under (the rules in force, by
 *   their hash), how many changes that version is made of, and since which day it has stood.
 *
 * `contextRows` makes the rows from the flow as kept (its change sets), the day, the moment the rules are known at,
 * and what the record adds (the events written down, each change's own step). The plan has them in place of the
 * context steps' own statement (`translate`'s `context`), so a run's outputs are its plan's, and verify recomputes
 * them like any other. `reachOf` and `contextOf` say what reaches a dataset, for the page.
 *
 * Pure: no DOM, no engine.
 */
import { agreementOf } from './agree.js';
import { editTargets, flowOf, type ChangeSet, type ContextTable, type FlowDocument } from './document.js';
import { covers, eventDay, latestEvents, type FlowEvent } from './events.js';
import { resolve, rulesHash, type Applied } from './inforce.js';
import type { LogEntry } from './log.js';
import { stepsOf, type StepAbout } from './step.js';

/** A cell of a context table: text, a whole number, or nothing. */
export type ContextCell = string | number | null;

/** Each context table's columns, in order, with their types. */
export const CONTEXT_COLUMNS: Readonly<Record<ContextTable, readonly (readonly [name: string, type: 'text' | 'int'])[]>> = {
  changes: [
    ['change', 'text'], ['dataset', 'text'], ['reach', 'text'], ['kind', 'text'], ['from_day', 'text'], ['until_day', 'text'], ['what', 'text'], ['why', 'text'],
    ['recorded_at', 'text'], ['recorded_by', 'text'], ['decided_by', 'text'], ['decided_on', 'text'], ['agreed_by', 'text'], ['agreed_at', 'text'], ['because_of', 'text'], ['estate', 'text'],
    ['step_day', 'text'], ['step_measured', 'int'], ['step_moved', 'int'], ['step', 'text'],
  ],
  events: [
    ['event', 'text'], ['dataset', 'text'], ['reach', 'text'], ['name', 'text'], ['kind', 'text'], ['from_day', 'text'], ['until_day', 'text'], ['day_of', 'int'], ['days', 'int'],
    ['note', 'text'], ['excuses', 'text'], ['recorded_at', 'text'], ['recorded_by', 'text'],
  ],
  in_force: [['dataset', 'text'], ['is', 'text'], ['flow', 'text'], ['day', 'text'], ['rules', 'text'], ['changes', 'int'], ['since_day', 'text']],
};

/** How a change or an event reaches a dataset: it is about it, about something it is built from, or about the flow. */
export type Reach = 'direct' | 'downstream' | 'flow';

/** What the record adds to a run's context: the events written down, and each change's own step, as known then. */
export interface ContextGiven {
  events?: readonly FlowEvent[];
  steps?: readonly Pick<StepAbout, 'change' | 'day' | 'moved' | 'measured'>[];
  /** The moment the events are known at (an ISO time); none: every event given. */
  eventsAsOf?: string | null;
}

/**
 * What the record adds to the context of a run made at a moment (`asOf`, an ISO time; none: now): the events as known
 * then, and each change's own step among the entries recorded by then. The build's recorder and the page both ask
 * here, so a day run again in a browser has the context its recorded run had.
 */
export function contextKnown(entries: readonly Pick<LogEntry, 'kind' | 'about' | 'at' | 'seq'>[], events: readonly FlowEvent[], asOf: string | null): ContextGiven {
  const at = asOf ? Date.parse(asOf) : null;
  const known = at === null ? entries : entries.filter((e) => Date.parse(e.at) <= at);
  return { events, eventsAsOf: asOf, steps: [...stepsOf(known).values()].map((s) => ({ change: s.change, day: s.day, moved: s.moved, measured: s.measured })) };
}

/** A run's context tables, as rows in each table's column order. */
export type ContextRows = Record<ContextTable, ContextCell[][]>;

/** No context: a flow with no change, on a day nothing was going on. */
export const NO_CONTEXT: ContextRows = { changes: [], events: [], in_force: [] };

type Graph = Pick<FlowDocument, 'sources' | 'steps'>;
const lower = (x: string) => x.toLowerCase();

/** A flow's datasets, its files then its steps, each by its id as written. */
export function datasetsOf(doc: Graph): { id: string; is: 'file' | 'step' }[] {
  return [...doc.sources.map((s) => ({ id: s.id, is: 'file' as const })), ...doc.steps.map((s) => ({ id: s.id, is: 'step' as const }))];
}

/**
 * The datasets a set of datasets reaches (ADR 0027 §8): each one named that the flow has (`direct`), and every step
 * built from one of them, however far (`downstream`), in the flow's order. Names the flow doesn't have reach nothing.
 */
export function reachOf(doc: Graph, about: readonly string[]): { dataset: string; reach: 'direct' | 'downstream' }[] {
  const all = datasetsOf(doc);
  const direct = new Set(about.map(lower));
  const reached = new Set(all.filter((d) => direct.has(lower(d.id))).map((d) => lower(d.id)));
  // Steps are listed in an order a step may come before what it reads (a notebook's cells): until nothing is added.
  for (let grew = true; grew; ) {
    grew = false;
    for (const s of doc.steps) {
      if (reached.has(lower(s.id)) || !s.inputs.some((i) => reached.has(lower(i)))) continue;
      reached.add(lower(s.id));
      grew = true;
    }
  }
  return all.filter((d) => reached.has(lower(d.id))).map((d) => ({ dataset: d.id, reach: direct.has(lower(d.id)) ? ('direct' as const) : ('downstream' as const) }));
}

/** The datasets a change is about: every file or step one of its edits names, once each, as written. */
export function changeAbout(change: Pick<ChangeSet, 'edits'>): string[] {
  const out: string[] = [];
  for (const d of change.edits.flatMap(editTargets)) if (!out.some((x) => lower(x) === lower(d))) out.push(d);
  return out;
}

const byName = (a: string, b: string): number => (lower(a) < lower(b) ? -1 : lower(a) > lower(b) ? 1 : a < b ? -1 : a > b ? 1 : 0);

/** Where a change or an event reaches, as a table's rows list it: the datasets it is about and what is built from
 * them, by name, whatever order the flow's steps are written in; `flow` where it names none the flow has (a relation,
 * a meaning for every dataset, an event about the whole flow). */
function reaches(doc: Graph, about: readonly string[]): { dataset: string | null; reach: Reach }[] {
  const got = reachOf(doc, about).sort((a, b) => byName(a.dataset, b.dataset));
  return got.length ? got : [{ dataset: null, reach: 'flow' }];
}

const number = (x: number | null): string => (x === null ? 'none' : Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));

/** A change's own step in a line: each measure it moved, as it was and with the change. Empty where it moved none. */
export function stepSaid(step: Pick<StepAbout, 'moved'>): string {
  return step.moved.map((m) => `${m.measure}: ${number(m.without)} → ${number(m.with)}`).join('; ');
}

/**
 * A run's context tables (ADR 0027 §8). `kept` is the flow as kept, with its change sets; the changes are those in
 * force on `day` as known at `asOf` (none: every change recorded), in the order the rules were resolved in; the events
 * those going on on the day, as known at `given.eventsAsOf`; the datasets and the graph are the flow's under the rules
 * in force. The same inputs give the same rows, in one order: the changes as the rules were resolved, the events by
 * their days, and the datasets of each by name.
 */
export async function contextRows(kept: FlowDocument, day: string | null, asOf: string | null, given: ContextGiven = {}): Promise<ContextRows> {
  const resolved = resolve(kept, day, asOf);
  const doc = resolved.doc;
  // A change set none of whose edits applies to this flow (an estate's, about what another of its flows has) is no
  // change of it: the rules in force are the same without it.
  const applied = resolved.applied.filter((a) => a.said.length > 0);
  const d = day === null ? null : day.slice(0, 10);
  const steps = new Map((given.steps ?? []).map((s) => [s.change, s]));
  const changes: ContextCell[][] = [];
  for (const a of applied) {
    const c = a.change;
    const step = steps.get(c.id);
    const what = saidOf(a);
    // Who agreed to it, where its kind asks for agreement (ADR 0027 §10): an owner of each part it touches, and the
    // moment it had them all, from which it is in force.
    const agreement = agreementOf(doc, c);
    const agreedBy = agreement.asked ? [...new Set(agreement.parts.flatMap((p) => (p.agreed ? [p.agreed.by] : [])))].join(', ') || null : null;
    for (const r of reaches(doc, changeAbout(c))) {
      changes.push([
        c.id, r.dataset, r.reach, c.kind ?? null, c.from, c.until ?? null, what, c.why ?? null,
        c.recorded, c.by, c.decided?.by ?? null, c.decided?.on ?? null, agreedBy, agreement.asked ? agreement.since : null, c.because?.event ?? null, c.estate ?? null,
        step?.day ?? null, step ? step.measured : null, step ? step.moved.length : null, step ? stepSaid(step) || null : null,
      ]);
    }
  }
  const events: ContextCell[][] = [];
  // A run of no day has no events going on.
  const on = d;
  for (const e of on === null ? [] : latestEvents(given.events ?? [], given.eventsAsOf ?? null).filter((x) => covers(x, on))) {
    const at = eventDay(e, on ?? e.from);
    for (const r of reaches(doc, e.about ?? [])) {
      const excused = r.dataset === null ? [] : (e.excuses ?? []).filter((x) => lower(x.dataset) === lower(r.dataset!)).map((x) => (x.column ? `${x.check} (${x.column})` : x.check));
      events.push([e.id, r.dataset, r.reach, e.name, e.kind, e.from, e.until ?? null, at?.n ?? null, at?.of ?? null, e.note ?? null, excused.length ? excused.join(', ') : null, e.recorded, e.by]);
    }
  }
  const rules = await rulesHash(doc);
  const since = applied.reduce<string | null>((latest, a) => (latest === null || a.change.from > latest ? a.change.from : latest), null);
  // By name: the same datasets give the same rows whatever order the flow's steps are written in, so a flow added in
  // the app and the same flow read from its files have one plan.
  const inForce: ContextCell[][] = datasetsOf(doc).sort((a, b) => byName(a.id, b.id)).map((x) => [x.id, x.is, flowOf(doc, x.id)?.id ?? null, d, rules, applied.length, since]);
  return { changes, events, in_force: inForce };
}

/** What a change did, in a line: each of its edits as it said itself when it was applied. */
const saidOf = (a: Applied): string | null => (a.said.length ? a.said.join('; ') : null);

/** What reaches a dataset on a day: each change in force and each event going on, with how it reaches it. */
export interface DatasetContext {
  changes: { change: ChangeSet; reach: Reach; what: string[] }[];
  events: { event: FlowEvent; reach: Reach }[];
}

/**
 * A dataset's context on a day (ADR 0027 §8), for the page: the changes in force that reach it (they are about it, or
 * about something it is built from, however far up; one about no dataset of the flow reaches every dataset, as the
 * flow's own) and the events going on that do, as known at `asOf`. In the order the rules were resolved in, and the
 * events' own.
 */
export function contextOf(kept: FlowDocument, dataset: string, day: string, asOf: string | null, events: readonly FlowEvent[] = []): DatasetContext {
  const resolved = resolve(kept, day, asOf);
  const doc = resolved.doc;
  const applied = resolved.applied.filter((a) => a.said.length > 0);
  const mine = (about: readonly string[]): Reach | null => {
    const got = reachOf(doc, about);
    if (!got.length) return 'flow';
    return got.find((r) => lower(r.dataset) === lower(dataset))?.reach ?? null;
  };
  const out: DatasetContext = { changes: [], events: [] };
  for (const a of applied) {
    const reach = mine(changeAbout(a.change));
    if (reach) out.changes.push({ change: a.change, reach, what: a.said });
  }
  for (const e of latestEvents(events, asOf)) {
    if (!covers(e, day)) continue;
    const reach = mine(e.about ?? []);
    if (reach) out.events.push({ event: e, reach });
  }
  return out;
}
