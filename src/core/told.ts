/**
 * Who hears, and the auditor (ADR 0027 §10, Q-278, Q-279). The ontology's changes and what was going on, told for
 * people who weren't there, in one shape every form reads:
 *
 * - `toldOf`: each change set and each event as a `Told`: its days, its kind, what it did and why in its author's
 *   words, who recorded it, who decided and who agreed, what it reaches, and its own step where one was measured.
 * - `inPeriod`: what a week's or a month's telling holds: what began, was said, was agreed to or was going on in it.
 * - `digestText`: a period's telling as text, to copy, as a day's brief is copied.
 * - `feedOf`: the same as an Atom feed (RFC 4287), which the build writes beside the app: the changes, what is
 *   coming first, and the events.
 * - `seenOf`, `sinceSeen`: what a browser saw last time, and what is new or has moved since.
 * - `historyOf`, `historyProblems`: the history for an auditor, over a chosen period: the flow's owners, every change
 *   with all of the above, the events. The audit bag carries it, and the offline check makes it again from the flow
 *   document the record kept and the record's own entries, and holds one to the other.
 *
 * Pure: no DOM, no engine. Outside what the data's cache is keyed by: nothing a run is made from.
 */
import { agreementOf, ownersOf, ownersSaid, partsIn, type OwnedDoc } from './agree.js';
import { canonicalJSON } from './canonical.js';
import { changeAbout, reachOf } from './context.js';
import { dayMid, dayShort } from './days.js';
import type { ChangeKind, ChangeSet, FlowDocument } from './document.js';
import { EVENT_KIND_NAMES, EXCUSABLE_SAID, eventDays, eventTense, latestEvents, type EventKind, type FlowEvent } from './events.js';
import { KIND_NAMES, KIND_NOT_GIVEN, registerOf, type Entry, type How, type Tense } from './register.js';
import type { StepAbout } from './step.js';

/** Where a change stands with the owners of what it touches: it asked for no agreement, has it, has it from its own
 * author (one person held both roles), or waits. */
export type Agreeing = 'none' | 'agreed' | 'same' | 'waiting';

/** One thing told: a change to the ontology, or an event that was going on. */
export interface Told {
  is: 'change' | 'event';
  id: string;
  /** Its first day, and its last where it has one (both in). */
  from: string;
  until?: string;
  /** A change's kind, or an event's; and in words. */
  kind: ChangeKind | EventKind | null;
  kindSaid: string;
  /** What it did, a sentence an edit; an event's name. */
  what: string[];
  /** Why, in its author's words; an event's note. Empty where none was given. */
  why: string;
  /** When it was written down (ISO 8601), by whom (their name), and how that stands to its first day. */
  recorded: string;
  by: string;
  how: How;
  lead: number;
  /** Where it stands for the day read from. An event going on is `in force`, one over `ended`. */
  tense: Tense;
  /** Who chose it and when, where that isn't who recorded it. */
  decided?: { by: string; on?: string };
  /** Who agreed to it, by name, each with the moment; and where it stands. */
  agreed: { by: string; at: string }[];
  agreeing: Agreeing;
  /** Whose agreement it waits for, in words; empty where it waits for none. */
  waitsFor: string;
  /** The datasets it reaches: those it is about, then those built from them. None: the flow as a whole. */
  about: string[];
  downstream: string[];
  /** The event that led to it, by name. */
  because?: string;
  /** The estate whose ontology's change it is. */
  estate?: string;
  /** Its own step (ADR 0027 §7): the day run both ways, how many measures were read, and each it alone moved. */
  step?: { day: string; measured: number; moved: string[] };
  /** What an event excuses, in words. */
  excuses?: string;
}

export interface ToldOptions {
  /** The day read from (YYYY-MM-DD), and the moment (ISO 8601; none: everything recorded). */
  today: string;
  asOf?: string | null;
  events?: readonly FlowEvent[];
  /** Each change's own step, by the change's id (`step.ts` `stepsOf`). */
  steps?: ReadonlyMap<string, Pick<StepAbout, 'day' | 'measured' | 'moved'>>;
  /** What a person is called, by id, where the flow's own principals don't say (someone on another page of the site):
   * the document's principal of that id is asked first, and their id is said where no one knows. */
  name?: (id: string) => string | undefined;
}

/** What a person is called: the flow's principal of that id, else what the caller knows, else `Owner` for a flow with
 * no policies' own owner, else the id. From the document, so anyone who has it says the same names. */
function namer(doc: Pick<FlowDocument, 'policies'>, o: ToldOptions): (id: string) => string {
  return (id) => doc.policies?.principals.find((p) => p.id === id)?.name ?? o.name?.(id) ?? (id === 'owner' && !doc.policies ? 'Owner' : id);
}

const listed = (xs: readonly string[]): string => (xs.length <= 1 ? (xs[0] ?? '') : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const plural = (n: number, one: string, many = `${one}s`): string => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const number = (x: number | null): string => (x === null ? 'none' : Number.isInteger(x) ? x.toLocaleString('en-US') : String(Math.round(x * 100) / 100));

/** A measure a change's own step moved, by its name (`step.ts`), as people read it: a control by its id, since a
 * history is told from the flow and the record alone. */
function measureSaid(measure: string): string {
  if (measure === 'score') return 'the score';
  if (measure === 'coverage') return 'coverage';
  if (measure === 'checks:applying') return 'checks that apply';
  if (measure === 'checks:evidence') return 'checks with evidence';
  if (measure === 'checks:failing') return 'checks failing';
  if (measure.startsWith('failing:')) return `applications failing ${measure.slice(8)}`;
  if (measure.startsWith('rows:')) return `rows of ${measure.slice(5)}`;
  return measure;
}
const movedOne = (m: StepAbout['moved'][number]): string => `${measureSaid(m.measure)} ${number(m.without)} → ${number(m.with)}`;

/** What an event excuses, in words: "shares (status), in findings". */
export function excusesSaid(e: Pick<FlowEvent, 'excuses'>): string {
  const by = new Map<string, string[]>();
  for (const x of e.excuses ?? []) by.set(x.dataset, [...(by.get(x.dataset) ?? []), `${EXCUSABLE_SAID[x.check]}${x.column ? ` (${x.column})` : ''}`]);
  return [...by].map(([dataset, what]) => `${listed(what)}, in ${dataset}`).join('; ');
}

function toldChange(doc: OwnedDoc & Pick<FlowDocument, 'sources' | 'steps'>, e: Entry, o: ToldOptions, eventName: ReadonlyMap<string, string>): Told {
  const c = e.change;
  const name = namer(doc, o);
  const a = e.agreement;
  const ownerName = (id: string) => a.parts.flatMap((p) => p.owners).find((x) => x.id === id)?.name ?? name(id);
  const reached = reachOf(doc, changeAbout(c));
  const step = o.steps?.get(c.id);
  const agreed = a.asked ? [...new Map(a.parts.flatMap((p) => (p.agreed ? [[p.agreed.by, p.agreed] as const] : []))).values()].map((x) => ({ by: ownerName(x.by), at: x.at })) : [];
  return {
    is: 'change',
    id: c.id,
    from: c.from,
    ...(c.until !== undefined ? { until: c.until } : {}),
    kind: e.kind,
    kindSaid: e.kind ? KIND_NAMES[e.kind] : KIND_NOT_GIVEN,
    what: e.said.length ? [...e.said] : ['nothing that applies to the rules of its day'],
    why: c.why,
    recorded: c.recorded,
    by: name(c.by),
    how: e.how,
    lead: e.lead,
    tense: e.tense,
    ...(c.decided ? { decided: c.decided } : {}),
    agreed,
    agreeing: !a.asked ? 'none' : a.waiting.length ? 'waiting' : a.same ? 'same' : 'agreed',
    waitsFor: a.asked && a.waiting.length ? ownersSaid(a.parts.filter((p) => p.agreed === null)) : '',
    about: reached.filter((r) => r.reach === 'direct').map((r) => r.dataset),
    downstream: reached.filter((r) => r.reach === 'downstream').map((r) => r.dataset),
    ...(c.because?.event && eventName.has(c.because.event) ? { because: eventName.get(c.because.event)! } : {}),
    ...(c.estate ? { estate: c.estate } : {}),
    ...(step ? { step: { day: step.day, measured: step.measured, moved: step.moved.map(movedOne) } } : {}),
  };
}

function toldEvent(doc: Pick<FlowDocument, 'sources' | 'steps' | 'policies'>, e: FlowEvent, o: ToldOptions): Told {
  const name = namer(doc, o);
  const reached = reachOf(doc, e.about ?? []);
  const t = eventTense(e, o.today);
  const recordedDay = new Date(Date.parse(e.recorded)).toISOString().slice(0, 10);
  const lead = Math.round((Date.parse(`${e.from}T00:00:00Z`) - Date.parse(`${recordedDay}T00:00:00Z`)) / 86_400_000);
  const excuses = excusesSaid(e);
  return {
    is: 'event',
    id: e.id,
    from: e.from,
    ...(e.until !== undefined ? { until: e.until } : {}),
    kind: e.kind,
    kindSaid: `Going on: ${EVENT_KIND_NAMES[e.kind]}`,
    what: [e.name],
    why: e.note ?? '',
    recorded: e.recorded,
    by: name(e.by),
    how: lead > 0 ? 'ahead' : lead < 0 ? 'back' : 'on',
    lead,
    tense: t === 'coming' ? 'coming' : t === 'over' ? 'ended' : 'in force',
    agreed: [],
    agreeing: 'none',
    waitsFor: '',
    about: reached.filter((r) => r.reach === 'direct').map((r) => r.dataset),
    downstream: reached.filter((r) => r.reach === 'downstream').map((r) => r.dataset),
    ...(excuses ? { excuses } : {}),
  };
}

/**
 * The ontology's changes and what was going on, as known at a moment (Q-278, Q-279): every change set of the flow as
 * kept and every event written down by then, the oldest first day first, a change before an event of its day, those
 * of one day in the order they were written down.
 */
export function toldOf(doc: FlowDocument, o: ToldOptions): Told[] {
  const events = latestEvents(o.events ?? [], o.asOf ?? null);
  const eventName = new Map(events.map((e) => [e.id, e.name]));
  const { entries } = registerOf(doc, { today: o.today, asOf: o.asOf ?? null });
  const out = [...entries.map((e) => toldChange(doc, e, o, eventName)), ...events.map((e) => toldEvent(doc, e, o))];
  return out.sort((a, b) => a.from.localeCompare(b.from) || (a.is === b.is ? 0 : a.is === 'change' ? -1 : 1) || Date.parse(a.recorded) - Date.parse(b.recorded) || a.id.localeCompare(b.id));
}

const dayOf = (iso: string): string => new Date(Date.parse(iso)).toISOString().slice(0, 10);

/**
 * What a period's telling holds (Q-278: a week's or a month's changes), both days in: a change that began in it, was
 * written down in it or was agreed to in it; an event going on at any point of it. What waits for agreement and what
 * is still to come are told with any period that has been reached: someone has something to do, or to expect.
 */
export function inPeriod(told: readonly Told[], from: string, to: string): Told[] {
  const within = (day: string) => from <= day && day <= to;
  return told.filter((t) => {
    if (t.is === 'event') return t.from <= to && (t.until === undefined || from <= t.until);
    return within(t.from) || within(dayOf(t.recorded)) || t.agreed.some((a) => within(dayOf(a.at))) || (t.tense === 'waiting' && dayOf(t.recorded) <= to) || (t.tense === 'coming' && dayOf(t.recorded) <= to);
  });
}

/** A change's or an event's days: "From Mon Mar 18", "Tue Mar 12 only", "Mon Mar 11 to Sun Mar 24". */
export function spanSaid(t: Pick<Told, 'from' | 'until' | 'is'>): string {
  if (t.until === undefined) return t.is === 'event' ? `From ${dayMid(t.from)}, still going on` : `From ${dayMid(t.from)}`;
  return t.until === t.from ? `${dayMid(t.from)}${t.is === 'event' ? '' : ' only'}` : `${dayMid(t.from)} to ${dayMid(t.until)}`;
}

/** How it was said, against its first day: "said Fri 15, 3 days ahead", "written down Mon 25, 9 days after it began". */
export function saidWhen(t: Pick<Told, 'recorded' | 'how' | 'lead' | 'is'>): string {
  const day = dayShort(dayOf(t.recorded));
  const n = Math.abs(t.lead);
  // Something written down long after its days (made in a browser on a demo's days) says its date alone.
  if (n > 92) return `${t.is === 'event' ? 'written down' : 'recorded'} ${dayOf(t.recorded)}`;
  if (t.how === 'ahead') return `said ${day}, ${plural(n, 'day')} ahead`;
  if (t.how === 'back') return t.is === 'event' ? `written down ${day}, ${plural(n, 'day')} after it began` : `recorded ${day}, back-dated ${plural(n, 'day')}`;
  return t.is === 'event' ? 'written down on its first day' : 'recorded on its day';
}

/** Who agreed, or whom it waits for, in a sentence; empty where it asked for no agreement. */
export function agreedSaid(t: Pick<Told, 'agreeing' | 'agreed' | 'waitsFor' | 'by'>): string {
  if (t.agreeing === 'none') return '';
  if (t.agreeing === 'waiting') return `Waits for the agreement of ${t.waitsFor}: in force on no day until then.`;
  if (t.agreeing === 'same') return `Agreed to by ${t.by}, who also made it: one person held both roles.`;
  return `Agreed to by ${listed(t.agreed.map((a) => `${a.by} on ${dayShort(dayOf(a.at))}`))}.`;
}

/** What it reaches, in a sentence: the datasets it is about, and how many are built from them. */
export function reachSaid(t: Pick<Told, 'about' | 'downstream'>): string {
  if (!t.about.length && !t.downstream.length) return 'About the flow as a whole.';
  return `Reaches ${listed(t.about)}${t.downstream.length ? `, and ${plural(t.downstream.length, 'dataset')} built from ${t.about.length === 1 ? 'it' : 'them'}` : ''}.`;
}

/** Its own step, in a sentence; empty where none was measured. */
export function stepToldSaid(t: Pick<Told, 'step'>): string {
  if (!t.step) return '';
  return t.step.moved.length ? `Its own step, ${dayShort(t.step.day)}: run both ways, the change alone moved ${plural(t.step.moved.length, 'measure')} of ${t.step.measured} (${t.step.moved.join('; ')}).` : `Its own step, ${dayShort(t.step.day)}: run both ways, it moved none of ${plural(t.step.measured, 'measure')}.`;
}

/** One thing told, as lines of text: its days and kind, what it did, why, who, what it reaches, its step. */
export function toldLines(t: Told): string[] {
  const who = t.is === 'event' ? `Written down by ${t.by}.` : `Recorded by ${t.by}${t.decided ? `; decided by ${t.decided.by}${t.decided.on ? ` on ${dayShort(t.decided.on)}` : ''}` : ''}.`;
  return [
    `${spanSaid(t)} · ${saidWhen(t)} · ${t.kindSaid}${t.estate ? ` · ${t.estate}’s ontology` : ''}`,
    ...t.what,
    ...(t.why ? [`Why: “${t.why}”`] : []),
    [who, agreedSaid(t)].filter(Boolean).join(' '),
    ...(t.because ? [`Because of: ${t.because}.`] : []),
    [reachSaid(t), t.excuses ? `Excuses ${t.excuses}.` : '', stepToldSaid(t)].filter(Boolean).join(' '),
  ];
}

/** A period in words: "Mon Mar 11 to Sun Mar 17, 2024", "March 2024" for a calendar month. */
export function periodSaid(from: string, to: string): string {
  const d = new Date(`${from}T00:00:00Z`);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  if (from.endsWith('-01') && to === last) return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return from === to ? `${dayMid(from)}, ${from.slice(0, 4)}` : `${dayMid(from)} to ${dayMid(to)}, ${to.slice(0, 4)}`;
}

/** A digest's parts, in the order read: what waits for someone, what is coming, what changed, what was going on. */
export interface Digest {
  flow: string;
  from: string;
  to: string;
  waiting: Told[];
  coming: Told[];
  changed: Told[];
  goingOn: Told[];
}

/**
 * A period's digest (Q-278): the telling of the period, sorted into what a reader does with each. With `today` (the day
 * the telling reads from), a digest of a period that day is in, or of a later one, is one passed on now: it says
 * everything that waits for someone and everything still to come, whenever it was written down. A digest of a period
 * gone by keeps to what was written down by its end.
 */
export function digestOf(flow: string, told: readonly Told[], from: string, to: string, today?: string): Digest {
  const mine = inPeriod(told, from, to);
  const changes = mine.filter((t) => t.is === 'change');
  const ahead = today !== undefined && to >= today ? told.filter((t) => t.is === 'change') : changes;
  return {
    flow, from, to,
    waiting: ahead.filter((t) => t.tense === 'waiting'),
    coming: ahead.filter((t) => t.tense === 'coming'),
    changed: changes.filter((t) => t.tense !== 'waiting' && t.tense !== 'coming').reverse(),
    goingOn: mine.filter((t) => t.is === 'event'),
  };
}

/** A digest in a sentence: how much of each it holds. */
export function digestHead(d: Digest): string {
  const parts = [
    d.changed.length ? plural(d.changed.length, 'change') : '',
    d.coming.length ? `${plural(d.coming.length, 'more')} coming` : '',
    d.waiting.length ? `${d.waiting.length} waiting for agreement` : '',
    d.goingOn.length ? `${plural(d.goingOn.length, 'thing')} going on` : '',
  ].filter(Boolean);
  return parts.length ? `${listed(parts)}.` : 'Nothing changed, and nothing was written down as going on.';
}

/** A digest as text (Q-278), to copy: a heading, the count, then each part with its things, a blank line between. */
export function digestText(d: Digest): string {
  const out = [`${d.flow}: the ontology, ${periodSaid(d.from, d.to)}`, digestHead(d)];
  const part = (title: string, things: readonly Told[]) => {
    if (!things.length) return;
    out.push('', title.toUpperCase());
    things.forEach((t, i) => {
      if (i) out.push('');
      const [head, ...rest] = toldLines(t);
      out.push(`- ${head}`, ...rest.map((l) => `  ${l}`));
    });
  };
  part('Waiting for agreement', d.waiting);
  part('Coming', d.coming);
  part('Changed', d.changed);
  part('Going on', d.goingOn);
  return out.join('\n');
}

// ------------------------------------------------------------------ since you last looked (Q-278)

/** What a browser saw of each thing told, by `change:<id>` or `event:<id>`: enough to tell it has moved since. */
export type Seen = Record<string, string>;

const seenKey = (t: Pick<Told, 'is' | 'id'>): string => `${t.is}:${t.id}`;
/** A thing's state as a browser remembers it: its days, where it stands, who agreed. A rewording isn't a move. */
const seenState = (t: Told): string => [t.from, t.until ?? '', t.tense, t.agreeing, t.agreed.map((a) => a.by).join(',')].join('|');

/** What a browser has seen, once it has looked at this telling. */
export const seenOf = (told: readonly Told[]): Seen => Object.fromEntries(told.map((t) => [seenKey(t), seenState(t)]));

/** What is new since a browser last looked, and what has moved (now in force, agreed to, ended, its days changed). */
export interface SinceSeen {
  fresh: Told[];
  moved: { told: Told; was: { tense: Tense; agreeing: Agreeing } }[];
}

/**
 * What changed since a browser last saw the telling (Q-278): the things it hadn't seen, and those that stand
 * otherwise than they did (a change that was coming and is in force, one that waited and was agreed to, an event that
 * was going on and is over). Null where the browser never looked: everything is new to it, and nothing is news.
 */
export function sinceSeen(told: readonly Told[], seen: Seen | null): SinceSeen | null {
  if (seen === null) return null;
  const fresh: Told[] = [];
  const moved: SinceSeen['moved'] = [];
  for (const t of told) {
    const was = seen[seenKey(t)];
    if (was === undefined) fresh.push(t);
    else if (was !== seenState(t)) {
      const [, , tense, agreeing] = was.split('|');
      moved.push({ told: t, was: { tense: tense as Tense, agreeing: agreeing as Agreeing } });
    }
  }
  return { fresh, moved };
}

/** How a thing moved since it was last seen, in a few words. */
export function movedSaid(m: SinceSeen['moved'][number]): string {
  const t = m.told;
  if (m.was.agreeing === 'waiting' && t.agreeing !== 'waiting') return 'agreed to since';
  if (m.was.tense === 'coming' && t.tense === 'in force') return t.is === 'event' ? 'going on now' : 'in force now';
  if (m.was.tense !== 'ended' && t.tense === 'ended') return t.is === 'event' ? 'over since' : 'ended since';
  return 'changed since';
}

/** Since a browser last looked, in a sentence; empty where nothing is new and nothing moved. */
export function sinceSaid(s: SinceSeen): string {
  const count = (things: readonly Told[], one: string) => (things.length ? plural(things.length, one) : '');
  const fresh = [count(s.fresh.filter((t) => t.is === 'change'), 'change'), count(s.fresh.filter((t) => t.is === 'event'), 'event')].filter(Boolean);
  const parts = [fresh.length ? `${listed(fresh)} new` : '', s.moved.length ? `${s.moved.length} that moved` : ''].filter(Boolean);
  return parts.length ? `${listed(parts)}.` : '';
}

// ------------------------------------------------------------------ the feed (Q-278)

const xml = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface FeedOptions {
  /** What the feed is called, and the flow's id: an entry's id is made from it and the thing's own, and stays as it is
   * from build to build. */
  title: string;
  flow: { id: string };
  /** When the feed was made (ISO 8601): its `updated` where nothing in it is later. */
  made: string;
  /** Where the app is, as the feed's readers reach it; none, and links are relative to the feed. */
  home?: string;
}

/** A thing told as it reads in a feed: its title, and its summary. */
function feedEntry(t: Told): { title: string; summary: string; updated: string } {
  const state = t.tense === 'waiting' ? 'Waits for agreement' : t.tense === 'coming' ? 'Coming' : t.is === 'event' ? (t.tense === 'ended' ? 'Was going on' : 'Going on') : t.tense === 'ended' ? 'Ended' : 'In force';
  const updated = [t.recorded, ...t.agreed.map((a) => a.at)].sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)!;
  return { title: `${state}: ${t.what[0]}${t.what.length > 1 ? `, and ${plural(t.what.length - 1, 'more edit')}` : ''} (${spanSaid(t).replace(/^From /, 'from ')})`, summary: toldLines(t).join('\n'), updated: new Date(Date.parse(updated)).toISOString() };
}

/**
 * The telling as an Atom feed (RFC 4287; Q-278: a feed the site publishes): what waits for agreement and what is
 * coming first, then the rest, newest first day first. An entry's id is made from the flow's id and the thing's own,
 * so it is the same entry in every build; it is updated when the thing was written down, or last agreed to. Links are
 * to the app's Ontology view on the entry (`#ontology/change/<id>`, `#ontology/event/<id>`).
 */
export function feedOf(told: readonly Told[], o: FeedOptions): string {
  const rank = (t: Told) => (t.tense === 'waiting' ? 0 : t.tense === 'coming' ? 1 : 2);
  const ordered = [...told].sort((a, b) => rank(a) - rank(b) || (rank(a) < 2 ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from)) || Date.parse(b.recorded) - Date.parse(a.recorded));
  const home = o.home ?? './';
  const entries = ordered.map((t) => ({ t, ...feedEntry(t) }));
  const updated = entries.map((e) => e.updated).sort().at(-1) ?? new Date(Date.parse(o.made)).toISOString();
  const tag = `urn:smaltfl:${o.flow.id}`;
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${xml(o.title)}</title>`,
    `  <subtitle>${xml('The ontology’s changes, what is coming, and what was going on.')}</subtitle>`,
    `  <id>${xml(tag)}:ontology</id>`,
    `  <updated>${updated}</updated>`,
    `  <link rel="alternate" href="${xml(`${home}#ontology`)}"/>`,
    `  <generator>smaltfl</generator>`,
    ...entries.flatMap(({ t, title, summary, updated: at }) => [
      '  <entry>',
      `    <id>${xml(`${tag}:${t.is}:${t.id}`)}</id>`,
      `    <title>${xml(title)}</title>`,
      `    <updated>${at}</updated>`,
      `    <published>${new Date(Date.parse(t.recorded)).toISOString()}</published>`,
      `    <author><name>${xml(t.by)}</name></author>`,
      `    <category term="${xml(t.is === 'event' ? 'event' : (t.kind ?? 'change'))}" label="${xml(t.kindSaid)}"/>`,
      `    <link rel="alternate" href="${xml(`${home}#ontology/${t.is}/${encodeURIComponent(t.id)}`)}"/>`,
      `    <summary>${xml(summary)}</summary>`,
      '  </entry>',
    ]),
    '</feed>',
    '',
  ].join('\n');
}

// ------------------------------------------------------------------ the history for an auditor (Q-279)

export const HISTORY_FORMAT = 'smaltfl-ontology-history/1';

/** A change's own step as the build measured it, where the record a history is made from doesn't keep the step. */
export interface ShippedStep {
  change: string;
  day: string;
  measured: number;
  moved: string[];
}

/** The ontology's history over a period, for an auditor (Q-279). */
export interface OntologyHistory {
  format: typeof HISTORY_FORMAT;
  /** The flow, by its id and name, and the hash of the flow as kept that it was made from. */
  flow: { id: string; name: string; hash: string };
  /** The period, both days in: every part reads as it stood at the end of it. And the moment it reads as known at
   * (none: everything recorded). */
  from: string;
  to: string;
  asOf: string | null;
  /** Who owns each part of the ontology. */
  owners: { part: string; owners: string[] }[];
  /** The changes of the period, the oldest first, each with everything told of it: from the flow as kept. A change's
   * own step is here where the record keeps it. */
  changes: Told[];
  /** What was written down in the record as going on in it. */
  events: Told[];
  /** What came with the build's data and isn't the record's: the events its story wrote down, and the steps it
   * measured. The page shows them; whoever vouches for the build vouches for them. Absent where there are none. */
  shipped?: { events: Told[]; steps: ShippedStep[] };
}

/** What a history is made from: the record's own events and steps, and those that came with the build's data. */
export interface HistoryGiven {
  asOf?: string | null;
  events?: readonly FlowEvent[];
  steps?: ReadonlyMap<string, Pick<StepAbout, 'day' | 'measured' | 'moved'>>;
  shipped?: { events?: readonly FlowEvent[]; steps?: ReadonlyMap<string, Pick<StepAbout, 'day' | 'measured' | 'moved'>> };
  name?: ToldOptions['name'];
}

/**
 * The history for an auditor (Q-279): who owns the ontology, and the changes and events of a period, each with its
 * kind, its reason, who decided, who agreed, what it reached and its own step. `hash` is the flow as kept's. It reads
 * as things stood on the period's last day.
 */
export function historyOf(doc: FlowDocument, hash: string, from: string, to: string, given: HistoryGiven = {}): OntologyHistory {
  const o: ToldOptions = { today: to, asOf: given.asOf ?? null, ...(given.events ? { events: given.events } : {}), ...(given.steps ? { steps: given.steps } : {}), ...(given.name ? { name: given.name } : {}) };
  const told = inPeriod(toldOf(doc, o), from, to);
  const changes = told.filter((t) => t.is === 'change');
  const own = new Set(told.filter((t) => t.is === 'event').map((t) => t.id));
  // What came with the build: its events that the record doesn't hold, and its steps of the period's changes.
  const shippedEvents = given.shipped?.events?.length ? inPeriod(toldOf({ ...doc, changes: [] } as FlowDocument, { ...o, events: given.shipped.events }), from, to).filter((t) => t.is === 'event' && !own.has(t.id)) : [];
  const shippedSteps: ShippedStep[] = changes.flatMap((c) => {
    const step = c.step ? undefined : given.shipped?.steps?.get(c.id);
    return step ? [{ change: c.id, day: step.day, measured: step.measured, moved: step.moved.map(movedOne) }] : [];
  });
  return {
    format: HISTORY_FORMAT,
    flow: { id: doc.id, name: doc.name, hash },
    from, to,
    asOf: given.asOf ?? null,
    owners: partsIn(doc).map((part) => ({ part: part.name, owners: ownersOf(doc, part).map((x) => x.name) })),
    changes,
    events: told.filter((t) => t.is === 'event'),
    ...(shippedEvents.length || shippedSteps.length ? { shipped: { events: shippedEvents, steps: shippedSteps } } : {}),
  };
}

/** A history's changes and events as a reader sees them: each change with its own step, the record's or the build's,
 * and the events of both, in the order told. */
export function historyTold(h: OntologyHistory): { changes: Told[]; events: (Told & { shipped?: true })[] } {
  const steps = new Map((h.shipped?.steps ?? []).map((s) => [s.change, s]));
  const changes = h.changes.map((c) => {
    const s = c.step ? undefined : steps.get(c.id);
    return s ? { ...c, step: { day: s.day, measured: s.measured, moved: s.moved } } : c;
  });
  const events = [...h.events, ...(h.shipped?.events ?? []).map((e) => ({ ...e, shipped: true as const }))].sort((a, b) => a.from.localeCompare(b.from) || Date.parse(a.recorded) - Date.parse(b.recorded));
  return { changes, events };
}

/** A history's head, in a sentence. */
export function historyHead(h: OntologyHistory): string {
  const asked = h.changes.filter((c) => c.agreeing !== 'none');
  const waits = asked.filter((c) => c.agreeing === 'waiting');
  const events = h.events.length + (h.shipped?.events.length ?? 0);
  return `${plural(h.changes.length, 'change')} to the ontology${asked.length ? `, ${asked.length} asking for an owner’s agreement${waits.length ? ` (${waits.length} still ${waits.length === 1 ? 'waits' : 'wait'})` : `, ${asked.length === 1 ? 'which has it' : 'each with it'}`}` : ''}; ${plural(events, 'event')} written down as going on.`;
}

/** A history as text: its head, who owns what, then every change and event in full. */
export function historyText(h: OntologyHistory): string {
  const out = [`${h.flow.name}: the ontology’s history, ${periodSaid(h.from, h.to)}`, historyHead(h), `Made from the flow as kept, ${h.flow.hash.slice(0, 16)}…${h.asOf ? `, as known at ${h.asOf}` : ''}, as things stood on ${dayMid(h.to)}.`, '', 'WHO OWNS IT', ...h.owners.map((x) => `- ${x.part}: ${listed(x.owners)}`)];
  const told = historyTold(h);
  const part = (title: string, things: readonly (Told & { shipped?: true })[]) => {
    out.push('', title);
    if (!things.length) out.push('- None in the period.');
    things.forEach((t, i) => {
      if (i) out.push('');
      const [head, ...rest] = toldLines(t);
      out.push(`- ${head}`, ...rest.map((l) => `  ${l}`), ...(t.shipped ? ['  Came with the build’s data: not in this record.'] : []));
    });
  };
  part('CHANGES', told.changes);
  part('GOING ON', told.events);
  return out.join('\n');
}

/**
 * Whether a history is the one its flow and its record make (Q-279: the offline check holds it to the signed
 * record): made again from the flow document the record kept (`doc`, whose hash the history names) and the events and
 * steps the record holds, for the same period as known at the same moment, its owners, changes and events must be
 * the same. What came with the build's data (`shipped`) isn't the record's, and isn't held: it is counted for the
 * auditor. The problems found, in words; none, and it holds.
 */
export function historyProblems(h: unknown, doc: FlowDocument, hash: string, given: Pick<HistoryGiven, 'events' | 'steps'> = {}): string[] {
  const rec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!rec(h) || h.format !== HISTORY_FORMAT || !rec(h.flow) || typeof h.from !== 'string' || typeof h.to !== 'string' || !Array.isArray(h.changes) || !Array.isArray(h.events) || !Array.isArray(h.owners)) return [`it isn't shaped as a history (${HISTORY_FORMAT}: flow, from, to, owners, changes, events)`];
  const got = h as unknown as OntologyHistory;
  const out: string[] = [];
  if (got.flow.hash !== hash) out.push(`it says it was made from the flow ${String(got.flow.hash).slice(0, 16)}…, and the flow the record kept is ${hash.slice(0, 16)}…`);
  const again = historyOf(doc, hash, got.from, got.to, { ...given, asOf: typeof got.asOf === 'string' ? got.asOf : null });
  const same = (a: unknown, b: unknown) => canonicalJSON(a as never) === canonicalJSON(b as never);
  for (const [what, mine, theirs] of [['change', again.changes, got.changes], ['event', again.events, got.events]] as const) {
    const said = new Map(theirs.map((t) => [t.id, t]));
    for (const t of mine) {
      const s = said.get(t.id);
      if (!s) out.push(`it leaves out the ${what} ${t.id}`);
      else if (!same(s, t)) out.push(`the ${what} ${t.id} isn't as the flow and the record have it`);
    }
    for (const s of theirs) if (!mine.some((t) => t.id === s.id)) out.push(`it has ${what === 'event' ? 'an event' : 'a change'} ${String(s.id)} the flow and the record don't have in the period`);
  }
  if (!same(got.owners, again.owners)) out.push("the owners it names aren't the flow's");
  return out;
}
