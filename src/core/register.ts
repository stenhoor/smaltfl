/**
 * The register (ADR 0027 §2, §9, slice 1): the ontology's changes as dated records, read from the change sets a flow
 * keeps (ADR 0021 §5). It shows what is kept and changes none of it: no run is judged by anything here, and no hash
 * moves.
 *
 * - `subjectOf`: what an edit is about, as a key two edits of one thing share, with its dataset and the lane it is
 *   drawn in: what we check (a rule, a check's mode, a band), or what there is and what it means (a name, a column read
 *   under another name, a column's values, a key).
 * - `registerOf`: every change set known at a moment as an entry: what each edit did in words, as known when it was
 *   made; its tense for the day read from (coming, in force, ended); how it was said (ahead of its first day, on it,
 *   or after it, back-dated); newest first, what is coming on top.
 * - `livesOf`: the entries as rows, one a subject: the spans of what applied to it over a run of days.
 * - `sinceOf`: the change a subject has stood by since, on a day; none where it stands as shipped.
 * - `comingOn`: the changes that were coming on a day: recorded by its end, in force from a later day.
 * - `tenseSaid`, `howSaid`: the words for a tense and for how a change was said.
 * - `KIND_NAMES`, `kindOf`, `defaultKind`, `kindReads` (ADR 0027 §2, slice 2): a change's kind in words; the kind a
 *   change set gives, none on one made before kinds were asked for; the kind an edit is unless its author says
 *   otherwise; and how history reads across a change of a kind: cut, marked, or restated.
 */
import { canonicalJSON } from './canonical.js';
import type { ChangeKind, ChangeSet, FlowDocument, RuleEdit } from './document.js';
import { applyEdit, changesOn, rulesInForce, versionRules, versionSaid } from './inforce.js';

/** The lane a subject is drawn in: what we check, or what there is and what it means. */
export type Lane = 'check' | 'is';
export const LANE_NAMES: Record<Lane, string> = { is: 'What there is, and what it means', check: 'What we check' };

/** What an edit is about. */
export interface Subject {
  /** One key for every edit of the same thing, lower case. */
  key: string;
  /** The file or step it is about ('' for a version's rules taken whole). */
  dataset: string;
  lane: Lane;
  /** The thing in a few plain words, without its dataset: "rule in_scope", "the values check", "tier's values". */
  what: string;
}

const subject = (key: string, dataset: string, lane: Lane, what: string): Subject => ({ key: key.toLowerCase(), dataset, lane, what });

/** What an edit is about (ADR 0027 §9: each row of the lanes is one thing's life). */
export function subjectOf(edit: RuleEdit): Subject {
  switch (edit.op) {
    case 'setRule':
      return subject(`rule:${edit.rule.file}:${edit.rule.id}`, edit.rule.file, 'check', `rule ${edit.rule.id}`);
    case 'removeRule':
    case 'switchRule':
      return subject(`rule:${edit.file}:${edit.id}`, edit.file, 'check', `rule ${edit.id}`);
    case 'setCheck':
      return subject(`check:${edit.node}:${edit.check}`, edit.node, 'check', `the ${edit.check} check`);
    case 'acceptBand':
      return subject(`band:${edit.source}:${edit.band.column}:${edit.band.value}`, edit.source, 'check', `${edit.band.column} = ${edit.band.value}, its share`);
    case 'nameColumn':
      return subject(`name:${edit.file}:${edit.column}`, edit.file, 'is', `${edit.column}, its name and meaning`);
    case 'mapColumn':
      return subject(`read:${edit.file}:${edit.column}`, edit.file, 'is', `${edit.column}, as the file names it`);
    case 'declareValues':
      return subject(`values:${edit.file}:${edit.column}`, edit.file, 'is', `${edit.column}, its values`);
    case 'declareKey':
      return subject(`key:${edit.file}`, edit.file, 'is', 'its key');
    // An entry of a closed list or a value of a closed column (ADR 0027 §4): one thing, left out and declared.
    case 'declareEntry':
      return subject(`entry:${edit.file}:${edit.rule}:${edit.entry[0] ?? ''}`, edit.file, 'is', `${edit.entry[0] ?? ''}, an entry`);
    case 'leaveOut':
      return subject(`entry:${edit.file}:${edit.rule}:${edit.key}`, edit.file, 'is', `${edit.key}, an entry`);
    case 'useVersion':
      return subject('version', '', 'check', 'the rules, a version taken whole');
  }
}

/** What an edit leaves a thing as, in a word or two: what a bar of the lanes can carry. */
export function shortOf(edit: RuleEdit): string {
  switch (edit.op) {
    case 'setRule':
      return 'set';
    case 'removeRule':
      return 'removed';
    case 'switchRule':
      return edit.on ? 'on' : 'off';
    case 'setCheck':
      return edit.mode;
    case 'acceptBand':
      return `${Math.round(edit.band.share[0] * 100)}–${Math.round(edit.band.share[1] * 100)}%`;
    case 'nameColumn':
      return edit.change.title ? edit.change.title : 'reworded';
    case 'mapColumn':
      return edit.from === null ? 'by its own name' : `read as ${edit.from}`;
    case 'declareValues':
      return `${edit.values.length} ${edit.values.length === 1 ? 'value' : 'values'}`;
    case 'declareKey':
      return `key ${edit.column}`;
    case 'declareEntry':
      return 'declared';
    case 'leaveOut':
      return 'left out';
    case 'useVersion':
      return 'a version';
  }
}

/** A change's kind in words (ADR 0027 §2). */
export const KIND_NAMES: Record<ChangeKind, string> = {
  business: 'The business changed',
  retuned: 'A setting re-tuned',
  corrected: 'A mistake corrected',
  source: 'The source changed',
  described: 'First described',
};
/** The words for a change set with no kind: one made before kinds were asked for. */
export const KIND_NOT_GIVEN = 'Kind not given';
/** The kinds a person chooses between: the first description of something is said by the page, not picked. */
export const KINDS_ASKED: readonly ChangeKind[] = ['business', 'retuned', 'corrected', 'source'];

/** The kind a change set gives; null on one made before kinds were asked for. */
export const kindOf = (c: Pick<ChangeSet, 'kind'>): ChangeKind | null => c.kind ?? null;

/**
 * The kind a set of edits is unless its author says otherwise: a column read under the file's new name, or a key left
 * out until it is declared, is the source changing; an accepted band is a setting re-tuned; values and a key declared from the data are a first description;
 * a version's rules taken whole put right what a day ran under; anything else is the business changing.
 */
export function defaultKind(edits: readonly RuleEdit[]): ChangeKind {
  const ops = new Set(edits.map((e) => e.op));
  // A key left out until it is declared is the file ahead of the ontology: its meaning hasn't changed.
  if (ops.size && [...ops].every((op) => op === 'mapColumn' || op === 'leaveOut')) return 'source';
  if ([...ops].every((op) => op === 'declareValues' || op === 'declareKey' || op === 'acceptBand') && (ops.has('declareValues') || ops.has('declareKey'))) return 'described';
  if (ops.size && [...ops].every((op) => op === 'acceptBand')) return 'retuned';
  if (ops.size && [...ops].every((op) => op === 'useVersion')) return 'corrected';
  return 'business';
}

/**
 * How history reads across a change of a kind (ADR 0027 §2, §7): `cut` where old and new are each right for their own
 * time, `restated` where the old was wrong, `mark` where the meaning is the same or the kind wasn't given.
 */
export const kindReads = (kind: ChangeKind | null): 'cut' | 'mark' | 'restated' => (kind === 'business' ? 'cut' : kind === 'corrected' ? 'restated' : 'mark');

/** Where a change stands for the day read from: not in force yet, in force, or over. */
export type Tense = 'coming' | 'in force' | 'ended';
/** How a change was said: before its first day, on it, or after it (back-dated). */
export type How = 'ahead' | 'on' | 'back';

/** One edit of a change set, as it applied to the rules of its first day as known when it was made. */
export interface EntryEdit {
  edit: RuleEdit;
  subject: Subject;
  /** What it did, in words; null where it didn't apply there, or changed nothing. */
  said: string | null;
  short: string;
}

/** A change set as the register shows it. */
export interface Entry {
  change: ChangeSet;
  /** Its kind; null on a change set made before kinds were asked for. */
  kind: ChangeKind | null;
  edits: EntryEdit[];
  /** What it did, one sentence an edit that applied. */
  said: string[];
  tense: Tense;
  how: How;
  /** The day it was recorded on (UTC, YYYY-MM-DD). */
  recordedDay: string;
  /** The days between the day it was recorded and its first day: above zero, said ahead; below, back-dated. */
  lead: number;
}

const DAY = 86_400_000;
const dayNumber = (day: string) => Math.round(Date.parse(`${day.slice(0, 10)}T00:00:00Z`) / DAY);
/** The day after a day, and the day before it (YYYY-MM-DD). */
export const dayAfter = (day: string): string => new Date((dayNumber(day) + 1) * DAY).toISOString().slice(0, 10);
export const dayBefore = (day: string): string => new Date((dayNumber(day) - 1) * DAY).toISOString().slice(0, 10);

/** A change set's edits replayed on the rules of its first day as known when it was made, one at a time. */
function replay(doc: Pick<FlowDocument, 'changes'> & Partial<FlowDocument>, c: ChangeSet): (string | null)[] {
  const { changes: all, ...base } = doc;
  let out = base as FlowDocument;
  const each: (string | null)[] = [];
  for (const change of changesOn(doc, c.from, c.recorded)) {
    const mine = change.id === c.id;
    for (const e of change.edits) {
      if (e.op === 'useVersion') {
        const next = versionRules(base as FlowDocument, all ?? [], e.changes);
        const same = canonicalJSON(rulesInForce(next)) === canonicalJSON(rulesInForce(out));
        if (!same) out = next;
        if (mine) each.push(same ? null : versionSaid(e.changes));
        continue;
      }
      const r = applyEdit(out, e);
      if (r) out = r.doc;
      if (mine) each.push(r ? r.said : null);
    }
    if (mine) break;
  }
  // One that isn't in force on its own first day as known then (it can't be: it is from that day, recorded by then).
  while (each.length < c.edits.length) each.push(null);
  return each;
}

export interface RegisterOptions {
  /** The day read from (YYYY-MM-DD): the last day that has arrived, or the day on screen. */
  today: string;
  /** Read as known at this moment (ISO 8601): a change recorded later isn't listed. None: everything recorded. */
  asOf?: string | null;
}

/**
 * The register (ADR 0027 §2): every change set known at the moment read from, what is coming first (the soonest on
 * top), then the rest by first day, newest first; change sets of one day in the order they were recorded, newest first.
 * `later` counts those recorded after the moment read from, which aren't listed.
 */
export function registerOf(doc: Pick<FlowDocument, 'changes'> & Partial<FlowDocument>, opts: RegisterOptions): { entries: Entry[]; later: number } {
  const at = opts.asOf ? Date.parse(opts.asOf) : null;
  const today = opts.today.slice(0, 10);
  const all = doc.changes ?? [];
  const known = all.filter((c) => at === null || Date.parse(c.recorded) <= at);
  const entries = known.map((c): Entry => {
    const each = replay(doc, c);
    const edits = c.edits.map((edit, i): EntryEdit => ({ edit, subject: subjectOf(edit), said: each[i] ?? null, short: shortOf(edit) }));
    const recordedDay = new Date(Date.parse(c.recorded)).toISOString().slice(0, 10);
    const lead = dayNumber(c.from) - dayNumber(recordedDay);
    return {
      change: c,
      kind: kindOf(c),
      edits,
      said: edits.flatMap((e) => (e.said ? [e.said] : [])),
      tense: c.from > today ? 'coming' : c.until !== undefined && c.until < today ? 'ended' : 'in force',
      how: lead > 0 ? 'ahead' : lead < 0 ? 'back' : 'on',
      recordedDay,
      lead,
    };
  });
  const t = (e: Entry) => Date.parse(e.change.recorded);
  const coming = entries.filter((e) => e.tense === 'coming').sort((a, b) => a.change.from.localeCompare(b.change.from) || t(a) - t(b));
  const rest = entries.filter((e) => e.tense !== 'coming').sort((a, b) => b.change.from.localeCompare(a.change.from) || t(b) - t(a));
  return { entries: [...coming, ...rest], later: all.length - known.length };
}

/** A run of days over which one change, or none, stood for a subject. */
export interface Span {
  from: string;
  /** Its last day, both in. */
  until: string;
  /** The change set it stood by; null, as shipped. */
  change: string | null;
  /** What it was left as, in a word or two ("hold", "0–10%"); "as shipped" where no change set made it. */
  short: string;
  /** For the day read from: a span that starts after it is coming. */
  coming: boolean;
}

/** One thing's life over a run of days (ADR 0027 §9). */
export interface Life {
  subject: Subject;
  spans: Span[];
  /** The days its changes were recorded on, each with the change and how it was said. */
  said: { day: string; change: string; how: How; kind: ChangeKind | null }[];
}

/**
 * The entries as rows, one a subject, over `days` (in order, each YYYY-MM-DD; they may run past the day read from,
 * to show what is coming): for each day the change the subject stands by is the last recorded of those in force on it
 * that touch it, so a change with a last day gives way again after it. Rows are in the order their subjects first
 * changed, what we check after what there is.
 */
export function livesOf(entries: readonly Entry[], days: readonly string[], today: string): Life[] {
  const bySubject = new Map<string, { subject: Subject; touches: { entry: Entry; short: string }[] }>();
  const inOrder = [...entries].sort((a, b) => Date.parse(a.change.recorded) - Date.parse(b.change.recorded));
  for (const entry of inOrder)
    for (const e of entry.edits) {
      const row = bySubject.get(e.subject.key) ?? { subject: e.subject, touches: [] };
      // Two edits of one thing in one change set: the last says what it was left as.
      const had = row.touches.findIndex((x) => x.entry === entry);
      if (had >= 0) row.touches[had] = { entry, short: e.short };
      else row.touches.push({ entry, short: e.short });
      bySubject.set(e.subject.key, row);
    }
  const now = today.slice(0, 10);
  const lives: Life[] = [];
  for (const { subject: s, touches } of bySubject.values()) {
    const spans: Span[] = [];
    for (const day of days) {
      const d = day.slice(0, 10);
      const standing = touches.filter(({ entry: { change: c } }) => c.from <= d && (c.until === undefined || d <= c.until)).at(-1) ?? null;
      const id = standing ? standing.entry.change.id : null;
      const last = spans.at(-1);
      if (last && last.change === id && dayAfter(last.until) >= d) last.until = d;
      else spans.push({ from: d, until: d, change: id, short: standing ? standing.short : 'as shipped', coming: d > now });
    }
    lives.push({ subject: s, spans, said: touches.map(({ entry }) => ({ day: entry.recordedDay, change: entry.change.id, how: entry.how, kind: entry.kind })) });
  }
  const lane = (l: Life) => (l.subject.lane === 'is' ? 0 : 1);
  return lives.map((l, i) => ({ l, i })).sort((a, b) => lane(a.l) - lane(b.l) || a.i - b.i).map(({ l }) => l);
}

/**
 * The change a subject has stood by since, on a day (ADR 0027 §9: since when, by which change): the last recorded of
 * the entries in force on the day that touch it; null where it stands as shipped.
 */
export function sinceOf(entries: readonly Entry[], key: string, day: string): Entry | null {
  const d = day.slice(0, 10);
  const k = key.toLowerCase();
  return (
    [...entries]
      .filter((e) => e.change.from <= d && (e.change.until === undefined || d <= e.change.until) && e.edits.some((x) => x.subject.key === k && x.said !== null))
      .sort((a, b) => Date.parse(a.change.recorded) - Date.parse(b.change.recorded))
      .at(-1) ?? null
  );
}

/** The changes that were coming on a day: recorded by its end (or by `asOf`, if earlier), in force from a later day. */
export function comingOn(doc: Pick<FlowDocument, 'changes'>, day: string, asOf?: string | null): ChangeSet[] {
  const d = day.slice(0, 10);
  const end = Date.parse(`${d}T23:59:59.999Z`);
  const at = asOf ? Math.min(Date.parse(asOf), end) : end;
  return (doc.changes ?? []).filter((c) => c.from > d && Date.parse(c.recorded) <= at).sort((a, b) => a.from.localeCompare(b.from) || Date.parse(a.recorded) - Date.parse(b.recorded));
}

/** A tense in words. */
export const tenseSaid = (t: Tense): string => (t === 'coming' ? 'coming' : t === 'ended' ? 'ended' : 'in force');

/** How a change was said, in words, with its days: "said 3 days ahead", "back-dated 24 days", "said on its day". */
export function howSaid(e: Pick<Entry, 'how' | 'lead'>): string {
  const n = Math.abs(e.lead);
  const days = `${n} ${n === 1 ? 'day' : 'days'}`;
  return e.how === 'ahead' ? `said ${days} ahead` : e.how === 'back' ? `back-dated ${days}` : 'said on its day';
}
