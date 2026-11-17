/**
 * Exploring a dataset (ADR 0026 §9), for someone who has never seen it: what a row is, in a sentence; a card a column
 * over every row, with a small chart that fits what the column holds; a part picked on one column and lit in every
 * other; and how the dataset joins to the others that share its key, counted on both sides.
 *
 * Pure: this says what to ask the engine of each column (`askOf`; emit.ts writes it), reads what comes back into cards
 * (`cardOf`) and into a join's counts (`joinRead`), and words them. Counts are exact, over the whole dataset: only a
 * number's bin edges and a column's kind come from the sample its profile was read from, and the card says so.
 */
import type { FlowDocument } from './document.js';
import type { RowPick } from './emit.js';
import { writtenRules } from './gates.js';
import { rowsOf, type Ontology } from './ontology.js';
import type { Kind, Profile } from './quality.js';

/** How many values a card draws before it folds the rest into one count. */
export const TOP_VALUES = 8;
/** About how many bins a number's card has. */
export const BINS = 12;

/** What to ask the engine of a column: its values counted, its numbers in bins, its times by their stamp, or nothing. */
export type ColumnAsk =
  | { column: string; ask: 'values'; limit: number }
  | { column: string; ask: 'bins'; lo: number; width: number; bins: number }
  | { column: string; ask: 'stamps'; chars: 4 | 7 | 10 | 13 }
  | { column: string; ask: 'none'; why: 'empty' | 'unique' };

/** A step a reader can read on an axis: 1, 2, 2.5 or 5 times a power of ten, the first at or above `raw`. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((x) => x * mag >= raw * (1 - 1e-9)) ?? 10) * mag;
}

const asMs = (v: unknown): number => (typeof v === 'string' ? Date.parse(v.length <= 10 ? `${v}T00:00:00Z` : `${v.replace(' ', 'T')}${/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? '' : 'Z'}`) : NaN);

/**
 * What to ask of a column, from its profile (overview: exact facts, and a sample's shape). A category, a code or text
 * that repeats: its values, the most common first. A measure: equal bins on round edges, over the sample's 1st to 99th
 * percentile where it has them (so one stray value doesn't flatten the rest into a bin), else its smallest to its
 * largest. A time: by the hour within two days (a column of dates, never), by the day within two months, by the month
 * within five years, else by the year: some sixty bars at most, each wide enough to tap. An empty column, and one whose
 * every row has its own value (an id), have nothing to chart.
 */
export function askOf(p: Profile): ColumnAsk {
  const column = p.name;
  if (p.kind === 'empty') return { column, ask: 'none', why: 'empty' };
  if (p.kind === 'measure') {
    const lo0 = p.quantiles?.p01 ?? (typeof p.facts.min === 'number' ? p.facts.min : NaN);
    const hi0 = p.quantiles?.p99 ?? (typeof p.facts.max === 'number' ? p.facts.max : NaN);
    if (!Number.isFinite(lo0) || !Number.isFinite(hi0)) return { column, ask: 'values', limit: TOP_VALUES };
    const width = niceStep((hi0 - lo0) / BINS || 1);
    const lo = Math.floor(lo0 / width + 1e-9) * width;
    const bins = Math.max(1, Math.min(2 * BINS, Math.ceil((hi0 - lo) / width - 1e-9) || 1));
    // A largest value on a bin's edge belongs to the bin it ends: one more bin holds it.
    return { column, ask: 'bins', lo, width, bins: lo + bins * width <= hi0 ? bins + 1 : bins };
  }
  if (p.kind === 'time') {
    const span = asMs(p.facts.max) - asMs(p.facts.min);
    const day = 86_400_000;
    const dates = [p.facts.min, p.facts.max].every((v) => typeof v === 'string' && v.length <= 10);
    return { column, ask: 'stamps', chars: !(span >= 0) ? 7 : span <= 2 * day && !dates ? 13 : span <= 62 * day ? 10 : span <= 5 * 366 * day ? 7 : 4 };
  }
  if (p.kind === 'text' && p.facts.present > 1 && p.facts.distinct >= p.facts.present) return { column, ask: 'none', why: 'unique' };
  return { column, ask: 'values', limit: TOP_VALUES };
}

/** A bar of a column's card: what it is called, the part of the dataset it is (tapping it picks that), its rows, and
 * the rows among them the part picked on another column lights. */
export interface Bar {
  label: string;
  pick: RowPick;
  rows: number;
  lit: number;
}

export interface ExploreCard {
  column: string;
  kind: Kind;
  ask: ColumnAsk['ask'];
  /** The dataset's rows, those with a value in this column, and its distinct values. */
  rows: number;
  present: number;
  distinct: number;
  bars: Bar[];
  /** The values past the ones drawn: how many, and their rows. Null where every value is drawn. */
  rest: { values: number; rows: number } | null;
  /** A number's rows under the first bin and at or over the last one's end: the stray ends the bins leave out. */
  under: Bar | null;
  over: Bar | null;
  /** What the two ends of a number's or a time's bars stand at, as an axis prints them. Null for values. */
  axis: [from: string, to: string] | null;
  /** The rows with no value: a bar of their own to tap, where there are any. */
  empty: Bar | null;
  /** Where values are written for the column (the ontology's): the rows that fit them, that hold another value, and
   * that are empty. Null where none are written. */
  fit: { fits: number; other: number; empty: number } | null;
  /** Why there is nothing to chart, where there isn't. */
  why: 'empty' | 'unique' | null;
}

const n = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

/** What a value of nothing but spaces is called: it is a value, not the absence of one. */
export const BLANK = '(blank)';
const isBlank = (v: unknown): boolean => typeof v === 'string' && v.trim() === '';

/** A number as an axis says it: no more decimals than its step needs. */
export function axisNumber(v: number, step: number): string {
  // As many decimals as the step is written with: 2.5 has one, 0.05 two, 10 none.
  const decimals = (step.toFixed(6).replace(/0+$/, '').split('.')[1] ?? '').length;
  const s = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return s === '-0' ? '0' : s;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A stamp's start as a reader says it: "2024" for a year, "Mar 2024" for a month, "Tue Mar 12" for a day,
 * "Tue 12, 14:00" for an hour. */
export function stampLabel(stamp: string): string {
  if (stamp.length <= 4) return stamp;
  const [y, m, d] = [Number(stamp.slice(0, 4)), Number(stamp.slice(5, 7)), Number(stamp.slice(8, 10))];
  const month = MONTHS[m - 1] ?? stamp.slice(5, 7);
  if (stamp.length <= 7) return `${month} ${y}`;
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
  if (stamp.length <= 10) return `${weekday} ${month} ${d}`;
  return `${weekday} ${d}, ${stamp.slice(11, 13)}:00`;
}

/**
 * A column's card from what the engine counted (ADR 0026 §9): `counted` is the rows of the statement `askOf` asked
 * for (`[value, rows, lit]`, `[bin, rows, lit]` or `[stamp, rows, lit]`), `fit` the row of `emitFit` where values are
 * written for the column. `label` names a coded value as the ontology does. A value's bars are the most common first;
 * a number's and a time's in order, every bin and stamp between the first and the last drawn, the empty ones too, so a
 * gap is seen as a gap. A number's and a time's statements leave out the rows with no value: `emptyLit` is how many of
 * those the pick lights, asked apart where there is a pick.
 */
export function cardOf(p: Profile, ask: ColumnAsk, counted: readonly (readonly unknown[])[], o: { fit?: readonly unknown[] | null; label?: (value: unknown) => string; emptyLit?: number } = {}): ExploreCard {
  const column = p.name;
  const named = o.label ?? ((v: unknown) => String(v));
  // A value that is nothing but spaces is a value all the same: it is named, so its bar isn't a bar with no name.
  const label = (v: unknown) => (isBlank(v) ? BLANK : named(v));
  const card: ExploreCard = { column, kind: p.kind, ask: ask.ask, rows: p.facts.rows, present: p.facts.present, distinct: p.facts.distinct, bars: [], rest: null, under: null, over: null, axis: null, empty: null, fit: null, why: ask.ask === 'none' ? ask.why : null };
  if (o.fit) card.fit = { fits: n(o.fit[0]), other: n(o.fit[1]), empty: n(o.fit[2]) };
  if (ask.ask === 'values') {
    // The statement gives the rows with no value first, where there are any, then one value more than asked where
    // there are none: the values drawn are the first `limit`.
    const present = counted.filter((r) => r[0] !== null && r[0] !== undefined).slice(0, ask.limit);
    const none = counted.find((r) => r[0] === null || r[0] === undefined);
    card.bars = present.map((r) => ({ label: label(r[0]), pick: { column, value: r[0] as string | number }, rows: n(r[1]), lit: n(r[2]) }));
    const drawn = card.bars.reduce((sum, b) => sum + b.rows, 0);
    if (p.facts.distinct > card.bars.length && p.facts.present > drawn) card.rest = { values: p.facts.distinct - card.bars.length, rows: p.facts.present - drawn };
    // The rows with no value, counted exactly where the statement returned them, else from the facts.
    const missing = p.facts.rows - p.facts.present;
    if (missing > 0) card.empty = { label: 'empty', pick: { column, value: null }, rows: missing, lit: none ? n(none[2]) : 0 };
  } else if (ask.ask === 'bins') {
    const by = new Map(counted.map((r) => [n(r[0]), r] as const));
    // A largest value on a round edge has a last bin of its own (askOf): that bin is the value, and the axis ends on it
    // (a score's bars end at 100, never at a 105 no row reaches).
    const max = typeof p.facts.max === 'number' ? p.facts.max : null;
    const lastFrom = ask.lo + (ask.bins - 1) * ask.width;
    const onEdge = max !== null && Math.abs(max - lastFrom) < ask.width * 1e-9;
    for (let k = 0; k < ask.bins; k++) {
      const from = ask.lo + k * ask.width;
      const r = by.get(k);
      // The edge's bin is the largest value, and nothing lies over it: it picks that value up, with no end to explain.
      const edge = onEdge && k === ask.bins - 1;
      const name = edge ? axisNumber(from, ask.width) : `${axisNumber(from, ask.width)} to ${axisNumber(from + ask.width, ask.width)}`;
      card.bars.push({ label: name, pick: { column, from, to: edge ? null : from + ask.width }, rows: r ? n(r[1]) : 0, lit: r ? n(r[2]) : 0 });
    }
    card.axis = [axisNumber(ask.lo, ask.width), axisNumber(onEdge ? lastFrom : ask.lo + ask.bins * ask.width, ask.width)];
    const under = by.get(-1);
    const over = by.get(ask.bins);
    if (under) card.under = { label: `under ${axisNumber(ask.lo, ask.width)}`, pick: { column, from: null, to: ask.lo }, rows: n(under[1]), lit: n(under[2]) };
    if (over) card.over = { label: `${axisNumber(ask.lo + ask.bins * ask.width, ask.width)} and over`, pick: { column, from: ask.lo + ask.bins * ask.width, to: null }, rows: n(over[1]), lit: n(over[2]) };
    const missing = p.facts.rows - p.facts.present;
    if (missing > 0) card.empty = { label: 'empty', pick: { column, value: null }, rows: missing, lit: o.emptyLit ?? 0 };
  } else if (ask.ask === 'stamps') {
    const stamps = counted.map((r) => String(r[0]));
    const by = new Map(counted.map((r) => [String(r[0]), r] as const));
    // Every stamp between the first and the last, and every one counted, whatever it looks like: no row is left out.
    const drawn = [...new Set([...stampsBetween(stamps[0], stamps.at(-1), ask.chars), ...stamps])].sort();
    for (const stamp of drawn) {
      const r = by.get(stamp);
      card.bars.push({ label: stampLabel(stamp), pick: { column, prefix: stamp }, rows: r ? n(r[1]) : 0, lit: r ? n(r[2]) : 0 });
    }
    if (card.bars.length) card.axis = [card.bars[0]!.label, card.bars.at(-1)!.label];
    const missing = p.facts.rows - p.facts.present;
    if (missing > 0) card.empty = { label: 'empty', pick: { column, value: null }, rows: missing, lit: o.emptyLit ?? 0 };
  }
  return card;
}

/** How many bars a time's card draws at most: past that its gaps aren't filled in, and only the stamps with rows are. */
const MAX_STAMPS = 400;

/** Every stamp from one to another, in order: each year, month, day or hour between them, the ones with no row too.
 * An hour is written as the first one is: with a space or a T after its day. */
export function stampsBetween(first: string | undefined, last: string | undefined, chars: 4 | 7 | 10 | 13): string[] {
  if (first === undefined || last === undefined) return [];
  // An end that is no stamp of a time (a column of text taken for one) has nothing between it and the other.
  const stamp = /^\d{4}(-\d{2}(-\d{2}([ T]\d{2})?)?)?$/;
  if (!stamp.test(first) || !stamp.test(last) || first.length !== last.length) return [first, ...(last !== first ? [last] : [])];
  const pad = (x: number) => String(x).padStart(2, '0');
  const out: string[] = [];
  if (chars === 4) {
    const [from, to] = [Number(first.slice(0, 4)), Number(last.slice(0, 4))];
    if (!Number.isInteger(from) || !Number.isInteger(to)) return [first, ...(last !== first ? [last] : [])];
    for (let y = from, k = 0; y <= to && k < MAX_STAMPS; y++, k++) out.push(String(y).padStart(4, '0'));
    return out;
  }
  if (chars === 7) {
    let [y, m] = [Number(first.slice(0, 4)), Number(first.slice(5, 7))];
    for (let k = 0; k < MAX_STAMPS; k++) {
      const s = `${y}-${pad(m)}`;
      out.push(s);
      if (s >= last) break;
      if (++m > 12) [y, m] = [y + 1, 1];
    }
    return out;
  }
  const step = chars === 10 ? 86_400_000 : 3_600_000;
  const start = Date.parse(chars === 10 ? `${first}T00:00:00Z` : `${first.slice(0, 10)}T${first.slice(11, 13)}:00:00Z`);
  if (Number.isNaN(start)) return [first, ...(last !== first ? [last] : [])];
  const sep = first[10] ?? ' ';
  for (let t = start, k = 0; k < MAX_STAMPS; t += step, k++) {
    const d = new Date(t);
    const s = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}${chars === 13 ? `${sep}${pad(d.getUTCHours())}` : ''}`;
    out.push(s);
    if (s >= last) break;
  }
  return out;
}

const fmt = (x: number) => Math.round(x).toLocaleString('en-US');

/** A share as a reader takes it in: whole points, "under 1%" and "over 99%" where it is neither none nor all. */
export function shareSaid(part: number, whole: number): string {
  if (!(whole > 0)) return '0%';
  const s = part / whole;
  return s > 0 && s < 0.01 ? 'under 1%' : s < 1 && s > 0.99 ? 'over 99%' : `${Math.round(s * 100)}%`;
}

/**
 * A column's card in a line, under its name: how full it is, and what it holds. "Every row has one · 4 values";
 * "12 of 600 empty (2%) · 318 values"; "every row its own value"; "empty".
 */
export function cardSaid(c: Pick<ExploreCard, 'rows' | 'present' | 'distinct' | 'why' | 'kind'>): string {
  if (c.why === 'empty' || c.present === 0) return 'empty: no row has a value';
  const missing = c.rows - c.present;
  const full = missing === 0 ? 'every row has one' : `${fmt(missing)} of ${fmt(c.rows)} empty (${shareSaid(missing, c.rows)})`;
  const holds = c.why === 'unique' ? 'every row its own value' : c.distinct === 1 ? 'one value' : `${fmt(c.distinct)} values`;
  return `${full} · ${holds}`;
}

/** How a column's rows sit with the values written for it: "598 fit the 3 values written · 2 hold another (under 1%)". */
export function fitSaid(fit: NonNullable<ExploreCard['fit']>, written: number): string {
  const rows = fit.fits + fit.other + fit.empty;
  const of = `the ${written === 1 ? 'value' : `${fmt(written)} values`} written`;
  if (fit.other === 0) return fit.empty === 0 ? `every row fits ${of}` : `every row with a value fits ${of}`;
  return `${fmt(fit.fits)} fit ${of} · ${fmt(fit.other)} ${fit.other === 1 ? 'holds' : 'hold'} another (${shareSaid(fit.other, rows)})`;
}

/** A part picked, in words: "status is fail"; "status is empty"; "days from 10 up to 20"; "checked_at in Tue Mar 12". */
export function pickSaid(pick: RowPick, label: (value: unknown) => string = String): string {
  if ('prefix' in pick) return `${pick.column} in ${stampLabel(pick.prefix)}`;
  if ('value' in pick) return pick.value === null ? `${pick.column} is empty` : `${pick.column} is ${isBlank(pick.value) ? BLANK : label(pick.value)}`;
  if (pick.from === null) return pick.to === null ? `${pick.column} has a value` : `${pick.column} under ${fmt(pick.to)}`;
  return pick.to === null ? `${pick.column} is ${fmt(pick.from)} or over` : `${pick.column} from ${pick.from.toLocaleString('en-US')} up to ${pick.to.toLocaleString('en-US')}`;
}

/** Whether two picks are the same part. */
export const samePick = (a: RowPick | null, b: RowPick | null): boolean => JSON.stringify(a) === JSON.stringify(b);

/** The part picked, counted: "2 of 8 rows (25%)". */
export const litSaid = (lit: number, rows: number, noun: { one: string; many: string } = { one: 'row', many: 'rows' }): string => `${fmt(lit)} of ${fmt(rows)} ${rows === 1 ? noun.one : noun.many} (${shareSaid(lit, rows)})`;

const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a');

type Described = Partial<Pick<FlowDocument, 'ontology' | 'gates' | 'steps'>>;

/** The type whose own dataset a dataset is: the list of its objects, a row each. */
const listOf = (ontology: Ontology | undefined, dataset: string) => ontology?.objectTypes.find((t) => t.dataset.toLowerCase() === dataset.toLowerCase());

/** Whether anything says what a dataset's rows are: a rows entry, a type it is the list of, or a key a gate gives it. */
const said = (doc: Described, dataset: string): boolean => !!rowsOf(doc.ontology, dataset) || !!listOf(doc.ontology, dataset) || !!writtenRules(doc, dataset).reconcile?.key.length;

/** The steps that keep their input's rows as they are: a check, a filter and a fill pass a row on or leave it out, and
 * never make another thing of it. */
const KEEPS = new Set(['expectations', 'filter', 'fill']);

/**
 * The dataset whose rows a dataset's are (ADR 0026 §9): itself where something says what its rows are; else the one it
 * keeps the rows of, back through the steps that only check, filter or fill them (what a flow gives of a file is the
 * file's rows, checked). Null where nothing says, here or behind it.
 */
export function rowsKeptFrom(doc: Described, dataset: string): string | null {
  let at = dataset;
  for (let hops = 0; hops < 8; hops++) {
    if (said(doc, at)) return at;
    const step = doc.steps?.find((x) => x.id.toLowerCase() === at.toLowerCase());
    if (!step || !KEEPS.has(step.kind) || step.inputs.length !== 1) return null;
    at = step.inputs[0]!;
  }
  return null;
}

/**
 * What a row is (ADR 0026 §9), in a sentence from the ontology: "One row is an application: 600 rows, one for each
 * app_id." A dataset that keeps another's rows (a file, checked) is said as that one is, and says so. Where no rows
 * entry or type says, its key if a gate gives it one, and that nothing says what a row is yet.
 */
export function rowSaid(doc: Described, dataset: string, rows: number): string {
  const from = rowsKeptFrom(doc, dataset) ?? dataset;
  const kept = from.toLowerCase() !== dataset.toLowerCase() ? ` As in ${from}, whose rows it keeps.` : '';
  const of = rowsOf(doc.ontology, from);
  const count = `${fmt(rows)} ${rows === 1 ? 'row' : 'rows'}`;
  if (of) {
    const name = of.type.name.toLowerCase();
    const cond = of.where.length ? `, for those where ${of.where.map(([c, vs]) => `${c} is ${vs.join(' or ')}`).join(' and ')}` : '';
    return `One row is ${article(name)} ${name}${cond}: ${count}${of.own ? `, one for each ${of.own}` : ''}.${kept}`;
  }
  // The list of a type's objects: a row each, by the type's key.
  const list = listOf(doc.ontology, from);
  if (list) {
    const name = list.name.toLowerCase();
    return `One row is ${article(name)} ${name}: ${count}${list.key.length ? `, one for each ${list.key.join(' and ')}` : ''}.${kept}`;
  }
  const key = writtenRules(doc, from).reconcile?.key;
  return key?.length ? `${count}, one for each ${key.join(' and ')}. Nothing in the ontology says what a row is yet.${kept}` : `${count}. Nothing in the ontology says what a row is yet.`;
}

/** A dataset this one joins to, and the key on each side. */
export interface JoinPartner {
  dataset: string;
  /** This dataset's key column, and the partner's. */
  own: string;
  key: string;
  /** Why they join: both hold objects of one type (`type` names it), this dataset's scope is counted against it, or
   * the ontology draws a link between them (`type` names the other's objects). */
  why: 'type' | 'scope' | 'link';
  type: string | null;
  /** Ids compared whatever their case and the spaces around them (Q-176), where either side's entry says so. */
  loose: boolean;
  /** A link's name as the ontology gives it, and its way: `out`, this dataset's column names the other's key (each
   * application is owned by a unit); `in`, the other's column names this one's key. */
  link?: { name: string; way: 'out' | 'in' };
  /** The other dataset is what this one's rows are looked up in: the list its scope is counted against, the list of
   * its type's objects, or the dataset a link of its own names. Counted without being asked; the rest when opened. */
  leads?: true;
}

/**
 * The datasets a dataset joins to (ADR 0026 §9): the one its scope is counted against (the inventory); then every other
 * dataset whose rows are objects of the same type, the type's own dataset first, in the ontology's order; then, for a
 * type's own dataset, the datasets the ontology's links tie it to, a column of one naming the key of the other (a link
 * of a type to itself, a hierarchy, is no join to another dataset and is left out). A dataset that keeps another's rows
 * (`rowsKeptFrom`) joins as that one does, the one it keeps among them. None where nothing says.
 */
export function joinPartners(doc: Described, dataset: string): JoinPartner[] {
  const ontology: Ontology | undefined = doc.ontology;
  const lower = dataset.toLowerCase();
  // A dataset that keeps another's rows (a file, checked) joins as that one does, by the same key; its scope is the
  // file's, counted where the file is judged, so here the list is one more dataset with its key.
  const from = rowsKeptFrom(doc, dataset) ?? dataset;
  const keeps = from.toLowerCase() !== lower;
  const out: JoinPartner[] = [];
  // A dataset once for its key; a link is another join, on its own columns, to a dataset already there or not.
  const add = (p: JoinPartner) => {
    const same = (x: JoinPartner) => x.dataset.toLowerCase() === p.dataset.toLowerCase() && (p.why !== 'link' ? x.why !== 'link' : x.own === p.own && x.key === p.key);
    if (p.dataset.toLowerCase() !== lower && !out.some(same)) out.push(p);
  };
  const scope = keeps ? null : writtenRules(doc, dataset).scope;
  if (scope) {
    // A scope the ontology gives names the type whose objects are counted; a gate cell's own scope names none.
    const typeId = scope.from === 'ontology' ? scope.type : null;
    add({ dataset: scope.of, own: scope.own, key: scope.key, why: 'scope', type: typeId ? (ontology?.objectTypes.find((t) => t.id === typeId)?.name ?? null) : null, loose: !!scope.loose, leads: true });
  }
  const mine = rowsOf(ontology, from);
  // The type whose objects this dataset's rows are; or, for a type's own dataset, that type.
  const list = listOf(ontology, from);
  const type = mine?.type ?? (list && list.key.length === 1 ? list : undefined);
  const own = mine?.own ?? (type && type.key.length === 1 ? type.key[0]! : null);
  if (type && own) {
    const key = type.key.length === 1 ? type.key[0]! : null;
    if (key) add({ dataset: type.dataset, own, key, why: 'type', type: type.name, loose: mine?.entry.ids === 'loose', leads: true });
    for (const r of ontology?.rows ?? []) {
      if (r.of !== type.id) continue;
      const theirs = rowsOf(ontology, r.dataset);
      if (theirs?.own) add({ dataset: r.dataset, own, key: theirs.own, why: 'type', type: type.name, loose: mine?.entry.ids === 'loose' || r.ids === 'loose' });
    }
  }
  for (const l of ontology?.linkTypes ?? []) {
    if (l.on.length !== 1) continue;
    const [fromColumn, toColumn] = l.on[0]!;
    const source = ontology!.objectTypes.find((t) => t.id === l.from);
    const target = ontology!.objectTypes.find((t) => t.id === l.to);
    if (!source || !target) continue;
    const at = from.toLowerCase();
    if (l.from === l.to) continue;
    if (source.dataset.toLowerCase() === at) add({ dataset: target.dataset, own: fromColumn, key: toColumn, why: 'link', type: target.name, loose: false, link: { name: l.name, way: 'out' }, leads: true });
    else if (target.dataset.toLowerCase() === at) add({ dataset: source.dataset, own: toColumn, key: fromColumn, why: 'link', type: source.name, loose: false, link: { name: l.name, way: 'in' } });
  }
  return out;
}

/** Why two datasets join, in a sentence for the join's head (ADR 0026 §9). */
export function joinWhy(dataset: string, p: JoinPartner): string {
  const thing = p.type ? p.type.toLowerCase() : null;
  const a = (word: string) => `${article(word)} ${word}`;
  if (p.why === 'scope') return `What ${dataset} should cover is counted against it: each ${thing ?? 'key'} in scope should have a row here.`;
  if (p.why === 'link' && p.link) return p.link.way === 'out'
    ? `${p.link.name}: ${p.own} names ${thing ? a(thing) : 'a row'} in ${p.dataset}.`
    : `${p.link.name}, from ${p.dataset}: its ${p.key} names a row here.`;
  return `Each row of both is ${thing ? a(thing) : 'one of the same things'}.`;
}

/** One side of a join, counted: its rows, those with no key, those whose key the other side has; its distinct keys and
 * those of them the other side has. */
export interface JoinSide {
  rows: number;
  blank: number;
  matched: number;
  keys: number;
  keysMatched: number;
}

/** A join's counts on both sides, from the one row `emitJoinMatch` gives. */
export function joinRead(row: readonly unknown[]): { a: JoinSide; b: JoinSide } {
  const side = (k: number): JoinSide => ({ rows: n(row[k]), blank: n(row[k + 1]), matched: n(row[k + 2]), keys: n(row[k + 3]), keysMatched: n(row[k + 4]) });
  return { a: side(0), b: side(5) };
}

/**
 * A join in two sentences, one a side (ADR 0026 §9): how many of this dataset's rows find a match there, and how many
 * of the other's keys have a row here. "596 of 600 rows find their application in cmdb_apps (over 99%): 4 don't."
 * "588 of the 612 keys in cmdb_apps have a row here (96%): 24 have none." `scoped`: the other side is counted over
 * the keys this dataset's scope keeps of it, as its gate counts them (ADR 0014 §4), and each sentence says so.
 */
export function joinSaid(dataset: string, partner: Pick<JoinPartner, 'dataset' | 'type' | 'link'>, read: { a: JoinSide; b: JoinSide }, scoped = false): [here: string, there: string] {
  // A link into this dataset: its rows are named by the other's, they don't find "their" anything there.
  if (partner.link?.way === 'in') return linkedSaid(dataset, partner.dataset, read);
  const thing = partner.type ? partner.type.toLowerCase() : 'key';
  const { a, b } = read;
  const among = scoped ? `among those in scope in ${partner.dataset}` : `in ${partner.dataset}`;
  const keys = `${scoped ? 'in scope ' : ''}in ${partner.dataset}`;
  const miss = a.rows - a.matched;
  const here = a.rows === 0 ? `${dataset} has no rows today.`
    : miss === 0 ? `${a.rows === 1 ? 'Its one row finds' : `All ${fmt(a.rows)} rows of ${dataset} find`} ${a.rows === 1 ? 'its' : 'their'} ${thing} ${among}.`
    : `${fmt(a.matched)} of ${fmt(a.rows)} rows find their ${thing} ${among} (${shareSaid(a.matched, a.rows)}): ${fmt(miss)} ${miss === 1 ? "doesn't" : "don't"}${a.blank ? `, ${fmt(a.blank)} of them with no ${thing} at all` : ''}.`;
  const none = b.keys - b.keysMatched;
  const there = b.keys === 0 ? `${partner.dataset} has no keys ${scoped ? 'in scope ' : ''}today.`
    : none === 0 ? `${b.keys === 1 ? `The one key ${keys} has` : `All ${fmt(b.keys)} keys ${keys} have`} a row here.`
    : `${fmt(b.keysMatched)} of the ${fmt(b.keys)} keys ${keys} have a row here (${shareSaid(b.keysMatched, b.keys)}): ${fmt(none)} ${none === 1 ? 'has' : 'have'} none.`;
  return [here, there];
}

/** A link into a dataset, a sentence a side: how many of its rows the other dataset names, and how many of the other's
 * rows name a row here. "176 of 420 rows are named by a row of cmdb_apps (42%): 244 aren't." */
function linkedSaid(dataset: string, other: string, read: { a: JoinSide; b: JoinSide }): [here: string, there: string] {
  const { a, b } = read;
  const not = a.rows - a.matched;
  const here = a.rows === 0 ? `${dataset} has no rows today.`
    : not === 0 ? `${a.rows === 1 ? 'Its one row is' : `All ${fmt(a.rows)} rows of ${dataset} are`} named by a row of ${other}.`
    : `${fmt(a.matched)} of ${fmt(a.rows)} rows are named by a row of ${other} (${shareSaid(a.matched, a.rows)}): ${fmt(not)} ${not === 1 ? "isn't" : "aren't"}.`;
  const lost = b.rows - b.matched;
  const there = b.rows === 0 ? `${other} has no rows today.`
    : lost === 0 ? `${b.rows === 1 ? `The one row of ${other} names` : `All ${fmt(b.rows)} rows of ${other} name`} a row here.`
    : `${fmt(b.matched)} of the ${fmt(b.rows)} rows of ${other} name a row here (${shareSaid(b.matched, b.rows)}): ${fmt(lost)} ${lost === 1 ? "doesn't" : "don't"}${b.blank ? `, ${fmt(b.blank)} of them naming none at all` : ''}.`;
  return [here, there];
}

/** A day's match between a dataset and the one its scope is counted against, as each run measures it. */
export interface MatchDay {
  day: string;
  /** The share of the keys in scope that have a row, 0 to 1; null where the day counted no scope. */
  covered: number | null;
  /** The rows whose key is out of scope, and the keys in scope with no row. */
  out: number;
  missing: number;
  inScope: number;
}

/**
 * A dataset's match with its inventory over the days a history keeps (ADR 0026 §9): each run counts its scope (ADR
 * 0014 §4), so the rate needs no new measure. The `last` days up to `until` (the day on screen: a day after it isn't
 * known on it). Empty where the history counts no scope.
 */
export function matchDays(history: { days: readonly string[]; gate?: { scope?: { out: readonly number[]; missing: readonly number[]; inScope: readonly number[] } } } | null | undefined, last = 31, until?: string): MatchDay[] {
  const s = history?.gate?.scope;
  if (!history || !s) return [];
  const end = until === undefined ? history.days.length : history.days.filter((d) => d <= until).length;
  const from = Math.max(0, end - last);
  return history.days.slice(from, end).map((day, i): MatchDay => {
    const k = from + i;
    const inScope = s.inScope[k] ?? 0;
    const missing = s.missing[k] ?? 0;
    return { day, covered: inScope > 0 ? (inScope - missing) / inScope : null, out: s.out[k] ?? 0, missing, inScope };
  });
}

/** The match over the days kept, in a sentence: "Over 31 days, between 96% and 100% of the keys in scope had a row;
 * today 97%." */
export function matchSaid(days: readonly MatchDay[]): string | null {
  const known = days.filter((d): d is MatchDay & { covered: number } => d.covered !== null);
  if (known.length < 2) return null;
  const lo = Math.min(...known.map((d) => d.covered));
  const hi = Math.max(...known.map((d) => d.covered));
  const pct = (x: number) => (x < 1 && x > 0.995 ? 'over 99%' : `${Math.round(x * 100)}%`);
  const range = pct(lo) === pct(hi) ? `${pct(lo)} of the keys in scope had a row every day` : `between ${pct(lo)} and ${pct(hi)} of the keys in scope had a row`;
  return `Over ${known.length} days, ${range}; on the last, ${pct(known.at(-1)!.covered)}.`;
}
