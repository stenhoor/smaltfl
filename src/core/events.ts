/**
 * Events (ADR 0027 §6, Q-249): dated context, written by a person. A reorganisation, a freeze, a migration: what was
 * going on, so that the days can be read. An event explains the data. It isn't a change to the ontology, and by
 * itself it changes nothing a run is judged by.
 *
 * - `FlowEvent`: a span of days, a kind, what it is about, a note, who wrote it and when.
 * - `eventsProblems`: what is wrong with a list of events, as a story file or the record gives one.
 * - `latestEvents`: the events as known at a moment: each by its id as last written by then, one taken back left out.
 * - `eventsOn`: those going on on a day; `eventTense`: coming, going on or over for a day; `eventDay`: which day of it
 *   a day is ("day 3 of 7").
 */

export const EVENT_KINDS = ['reorg', 'freeze', 'migration', 'incident', 'campaign', 'other'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
/** A kind in words, as it follows "Kind:". */
export const EVENT_KIND_NAMES: Record<EventKind, string> = { reorg: 'a reorganisation', freeze: 'a freeze', migration: 'a migration', incident: 'an incident', campaign: 'a campaign', other: 'something else' };

export interface FlowEvent {
  /** Its name among the flow's events: writing an event again under its id changes it. */
  id: string;
  /** What it is called. */
  name: string;
  /** Its first day (YYYY-MM-DD) and, where it has ended or will, its last: both days are in. */
  from: string;
  until?: string;
  kind: EventKind;
  /** The datasets of the flow it is about, by id; none: the whole flow. */
  about?: string[];
  /** What was going on, in its author's words. */
  note?: string;
  /** When it was written down (ISO 8601), and by whom. */
  recorded: string;
  by: string;
  /** Written again as taken back: the event is no longer shown from then. */
  withdrawn?: boolean;
}

const EVENT_FIELDS = ['id', 'name', 'from', 'until', 'kind', 'about', 'note', 'recorded', 'by', 'withdrawn'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v: unknown): v is string => typeof v === 'string' && DAY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const text = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** What is wrong with a list of events (empty when it is good). With `datasets`, what each is about is checked too. */
export function eventsProblems(v: unknown, o: { datasets?: readonly string[] } = {}): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return ['its events are a list'];
  const out: string[] = [];
  const known = o.datasets ? new Set(o.datasets.map((d) => d.toLowerCase())) : null;
  v.forEach((e: unknown, i: number) => {
    const at = `event ${i + 1}`;
    if (typeof e !== 'object' || e === null || Array.isArray(e)) return void out.push(`${at}: an event is { id, name, from, kind, recorded, by }`);
    const ev = e as Record<string, unknown>;
    for (const k of Object.keys(ev)) if (!EVENT_FIELDS.includes(k)) out.push(`${at}: ${k} is not a field of an event (${EVENT_FIELDS.join(', ')})`);
    if (!text(ev.id)) out.push(`${at}: it has an id`);
    if (!text(ev.name)) out.push(`${at}: it has a name`);
    if (!isDay(ev.from)) out.push(`${at}: its first day is YYYY-MM-DD`);
    if (ev.until !== undefined && (!isDay(ev.until) || (isDay(ev.from) && ev.until < ev.from))) out.push(`${at}: its last day is YYYY-MM-DD, on or after its first`);
    if (!(EVENT_KINDS as readonly unknown[]).includes(ev.kind)) out.push(`${at}: its kind is one of ${EVENT_KINDS.join(', ')}`);
    if (ev.about !== undefined) {
      if (!Array.isArray(ev.about) || ev.about.some((d) => !text(d))) out.push(`${at}: what it is about is a list of datasets`);
      else if (known) for (const d of ev.about as string[]) if (!known.has(d.toLowerCase())) out.push(`${at}: ${d} is not a dataset of the flow`);
    }
    if (ev.note !== undefined && typeof ev.note !== 'string') out.push(`${at}: its note is text`);
    if (typeof ev.recorded !== 'string' || Number.isNaN(Date.parse(ev.recorded))) out.push(`${at}: when it was written down is an ISO 8601 time`);
    if (!text(ev.by)) out.push(`${at}: it says who wrote it`);
    if (ev.withdrawn !== undefined && typeof ev.withdrawn !== 'boolean') out.push(`${at}: withdrawn is true or false`);
  });
  return out;
}

/**
 * The events as known at a moment (`asOf`, an ISO time; none: now): each by its id as it was last written by then, one
 * taken back left out, in the order of their first days, then of when they were written.
 */
export function latestEvents(events: readonly FlowEvent[], asOf?: string | null): FlowEvent[] {
  const at = asOf ? Date.parse(asOf) : null;
  const byId = new Map<string, FlowEvent>();
  [...events]
    .map((e, i) => ({ e, i, t: Date.parse(e.recorded) }))
    .filter(({ t }) => at === null || t <= at)
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .forEach(({ e }) => byId.set(e.id, e));
  return [...byId.values()].filter((e) => !e.withdrawn).sort((a, b) => a.from.localeCompare(b.from) || Date.parse(a.recorded) - Date.parse(b.recorded));
}

/** Whether an event covers a day: from its first day to its last, both in; one with no last day goes on. */
export const covers = (e: Pick<FlowEvent, 'from' | 'until'>, day: string): boolean => e.from <= day.slice(0, 10) && (e.until === undefined || day.slice(0, 10) <= e.until);

/** The events going on on a day, as known at a moment. */
export const eventsOn = (events: readonly FlowEvent[], day: string, asOf?: string | null): FlowEvent[] => latestEvents(events, asOf).filter((e) => covers(e, day));

/** Where an event stands for a day: not begun, going on, or over. */
export type EventTense = 'coming' | 'going on' | 'over';
export const eventTense = (e: Pick<FlowEvent, 'from' | 'until'>, day: string): EventTense => (e.from > day.slice(0, 10) ? 'coming' : e.until !== undefined && e.until < day.slice(0, 10) ? 'over' : 'going on');

const dayNumber = (day: string) => Math.round(Date.parse(`${day.slice(0, 10)}T00:00:00Z`) / 86_400_000);

/** How many days an event lasts, both ends in; null while it has no last day. */
export const eventDays = (e: Pick<FlowEvent, 'from' | 'until'>): number | null => (e.until === undefined ? null : dayNumber(e.until) - dayNumber(e.from) + 1);

/** Which day of an event a day is, from one, and of how many; null where the day is outside it. */
export function eventDay(e: Pick<FlowEvent, 'from' | 'until'>, day: string): { n: number; of: number | null } | null {
  return covers(e, day) ? { n: dayNumber(day) - dayNumber(e.from) + 1, of: eventDays(e) } : null;
}

/** Whether an event is about a dataset: it names it, or names none (the whole flow). */
export const isAbout = (e: Pick<FlowEvent, 'about'>, dataset: string): boolean => !e.about?.length || e.about.some((d) => d.toLowerCase() === dataset.toLowerCase());
