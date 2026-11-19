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
 *
 * An event can say what it excuses (§6, Q-267, Q-271): what the checks learned to expect, on a dataset it names. A
 * rise or a drop in how much arrives, a shift in a column's mix, more blanks, another shape. While it lasts a finding
 * it excuses is told as expected and doesn't pause the day, and its days are set aside from what those series are
 * learned from. A rule someone wrote is never excused: only the checks learned from the history can be named.
 *
 * - `EXCUSABLE`, `Excuse`: what may be excused, and an event's word for it.
 * - `excusesFor`: the excuses a dataset's load is told under, as known at a moment: every one of an event about it
 *   that began on or before the load's day. A claim names them, so a run says what it was excused by.
 */

export const EVENT_KINDS = ['reorg', 'freeze', 'migration', 'incident', 'campaign', 'other'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
/** A kind in words, as it follows "Kind:". */
export const EVENT_KIND_NAMES: Record<EventKind, string> = { reorg: 'a reorganisation', freeze: 'a freeze', migration: 'a migration', incident: 'an incident', campaign: 'a campaign', other: 'something else' };

/** The checks an event may excuse (ADR 0027 §6): those learned from the history as a series of its own. `amount`: how
 * many rows arrive. `shares`: a column's mix. `pairs`: how values go together. `blanks`: how full a column is.
 * `shape`: a number's or a time's spread. */
export const EXCUSABLE = ['amount', 'shares', 'pairs', 'blanks', 'shape'] as const;
export type Excusable = (typeof EXCUSABLE)[number];
/** Each in a few words, as it follows "It excuses". */
export const EXCUSABLE_SAID: Record<Excusable, string> = {
  amount: 'a rise or a drop in how much arrives',
  shares: 'a shift in the mix of a column',
  pairs: 'values going together differently',
  blanks: 'more or fewer blanks',
  shape: 'a number’s or a time’s spread',
};

/** What an event excuses: a learned check of a dataset it is about, and, for a check of columns, the one column. */
export interface Excuse {
  dataset: string;
  check: Excusable;
  column?: string;
}

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
  /** What it excuses while it lasts (ADR 0027 §6): learned checks of the datasets it is about. */
  excuses?: Excuse[];
}

const EVENT_FIELDS = ['id', 'name', 'from', 'until', 'kind', 'about', 'note', 'recorded', 'by', 'withdrawn', 'excuses'];
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
    if (ev.excuses !== undefined) {
      if (!Array.isArray(ev.excuses) || ev.excuses.length === 0) out.push(`${at}: what it excuses is a list of { dataset, check, column? }, absent when it excuses nothing`);
      else {
        const about = Array.isArray(ev.about) ? (ev.about as unknown[]).filter(text).map((d) => d.toLowerCase()) : [];
        (ev.excuses as unknown[]).forEach((x, k) => {
          const xat = `${at}, excuse ${k + 1}`;
          if (typeof x !== 'object' || x === null || Array.isArray(x)) return void out.push(`${xat}: { dataset, check, column? }`);
          const ex = x as Record<string, unknown>;
          for (const key of Object.keys(ex)) if (!['dataset', 'check', 'column'].includes(key)) out.push(`${xat}: ${key} is not a field of an excuse (dataset, check, column)`);
          if (!text(ex.dataset)) out.push(`${xat}: it names the dataset whose check it excuses`);
          else if (!about.includes(ex.dataset.toLowerCase())) out.push(`${xat}: ${ex.dataset} isn't a dataset the event is about: an event excuses only what it names`);
          if (!(EXCUSABLE as readonly unknown[]).includes(ex.check)) out.push(`${xat}: its check is one learned from the history (${EXCUSABLE.join(', ')}): a rule someone wrote is never excused`);
          if (ex.column !== undefined && !text(ex.column)) out.push(`${xat}: its column is a name`);
          else if (ex.column !== undefined && ex.check === 'amount') out.push(`${xat}: the amount is the file's, not a column's`);
        });
      }
    }
  });
  return out;
}

/** An excuse as a claim names it (ADR 0027 §6, §12): the event, its name and days, and what it excuses. */
export interface ClaimExcuse {
  event: string;
  name: string;
  from: string;
  until?: string;
  check: Excusable;
  column?: string;
}

const lower = (x: string) => x.toLowerCase();

/**
 * The excuses a dataset's load of a day is told under, as known at a moment (ADR 0027 §6): every excuse of an event
 * about the dataset that began on or before the day, in one order. Those whose event covers the day excuse its
 * findings; the days before it they cover are set aside from learning. An event written after a run excuses nothing
 * of it: `asOf` is the moment the run is told at.
 */
export function excusesFor(events: readonly FlowEvent[], dataset: string, day: string, asOf?: string | null): ClaimExcuse[] {
  const d = day.slice(0, 10);
  const out: ClaimExcuse[] = [];
  for (const e of latestEvents(events, asOf)) {
    if (e.from > d) continue;
    for (const x of e.excuses ?? []) {
      if (lower(x.dataset) !== lower(dataset)) continue;
      out.push({ event: e.id, name: e.name, from: e.from, ...(e.until !== undefined ? { until: e.until } : {}), check: x.check, ...(x.column !== undefined ? { column: x.column } : {}) });
    }
  }
  const key = (x: ClaimExcuse) => [x.from, x.event, x.check, x.column ?? ''].join('\u0000');
  return out.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

/** Whether an excuse covers a day: its event was going on. */
export const excuseCovers = (x: Pick<ClaimExcuse, 'from' | 'until'>, day: string): boolean => covers(x, day);

/** Whether a value is a list of excuses as a claim names them. */
export function isClaimExcuses(v: unknown): v is ClaimExcuse[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => {
    if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
    const e = x as Record<string, unknown>;
    return text(e.event) && text(e.name) && isDay(e.from) && (e.until === undefined || (isDay(e.until) && e.until >= e.from)) && (EXCUSABLE as readonly unknown[]).includes(e.check) && (e.column === undefined || text(e.column))
      && Object.keys(e).every((k) => ['event', 'name', 'from', 'until', 'check', 'column'].includes(k));
  });
}

/** Excuses as a clean copy keeps them: only their own fields. */
export const copyExcuses = (xs: readonly ClaimExcuse[]): ClaimExcuse[] => xs.map((x) => ({ event: x.event, name: x.name, from: x.from, ...(x.until !== undefined ? { until: x.until } : {}), check: x.check, ...(x.column !== undefined ? { column: x.column } : {}) }));

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
