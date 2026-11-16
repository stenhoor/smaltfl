/**
 * Declarations proposed from a file's own data (ADR 0022 §5, Q-139; the maintainer's answers Q-213 to Q-216): what the
 * ontology doesn't say yet about a source, read from the day's rows, its history and its kept sample. Nothing applies
 * until the owner accepts it into the ontology, as a dated change set like any rule edit (Q-215). Any file with something
 * undeclared is offered them (Q-216), each kind on its own:
 *
 * - **values**: a coded column (a code or a category) with no values listed: the day's values, every row one of them,
 *   two to thirty, each used more than once on average, with any other value the kept sample shows on two days or more;
 *   whole numbers with no gap between them are a count, not codes.
 *   Accepted (`declareValues`), each is a code meaning itself until someone words it, and the column is counted where
 *   the flow's history is built (measures.ts `watchColumns`): its values, their pairs and the forest read it.
 * - **bands**: a counted column with no band, in a gated flow whose `values` check isn't off: each common value's band
 *   (a twentieth of the rows or more on the median day), its share's usual range over the history's last 28 days (the
 *   middle nine days in ten) five points either side, in whole percents (Q-214). Accepted as `acceptBand` edits, judged
 *   by the values check from its day.
 * - **key**: a file with no rows entry and no key in its gate cell, in a gated flow whose `reconcile` check isn't off: a
 *   column with a value on every row of the day, each one different, never blank in the history and never repeated
 *   within a day of the kept sample. Accepted (`declareKey`), the file is an object type's rows, keyed by the column (a
 *   type of its own, or the type over it), and the reconcile check holds a day that repeats one or leaves one blank.
 *
 * A file nothing watches is offered nothing: what it declares judges nothing there. Pure: the app counts the rows (`Profile`), reads a small column's values exactly (`valueCandidates` says which) and
 * hands in the history and the sample it judges the day with.
 */
import type { SampleFile } from './apart.js';
import { FILLED_FROM, type FlowDocument, type RuleEdit } from './document.js';
import { gateChecksOf, type CheckMode } from './gates.js';
import type { HistoryFile } from './history.js';
import { nounOf, propertyOf, saysMore } from './ontology.js';
import { quantile, type Profile } from './quality.js';

/** The most values a coded column is proposed with: more is a list nobody reads as codes. */
export const MAX_CODES = 30;
/** The fewest rows a key is proposed on: below it, every column of a small file is different on every row. */
export const MIN_KEY_ROWS = 10;
/** The fewest rows a column's values are proposed on: in a small reference file every column has few values. */
export const MIN_VALUES_ROWS = 50;
/** The fewest rows a band is proposed on, on the history's median day: a share of a few rows moves by whole steps. */
export const MIN_BAND_ROWS = 100;
/** The days of history a band is read from, and the fewest it needs. */
export const BAND_DAYS = 28;
export const MIN_BAND_DAYS = 14;
/** A value common enough for a band: its share on the median day. */
export const COMMON_SHARE = 0.05;
/** How far a band reaches past the usual range, each side (Q-214): five points. */
export const BAND_MARGIN = 0.05;

interface ProposalBase {
  /** The proposal's own name, a file's column and kind: what Not now remembers. */
  id: string;
  file: string;
  column: string;
  /** The proposal in a few words: "List controller’s 3 values". */
  title: string;
  /** What it rests on, a line each. */
  rests: string[];
  /** What accepting it does. */
  does: string;
  /** The edits it is accepted as, in one change set. */
  edits: RuleEdit[];
}

export interface ValuesProposal extends ProposalBase {
  kind: 'values';
  values: string[];
}

export interface BandsProposal extends ProposalBase {
  kind: 'bands';
  /** Each common value's band: its usual range in the history, and the band proposed. */
  bands: { value: string; usual: [number, number]; share: [number, number] }[];
  days: number;
}

export interface KeyProposal extends ProposalBase {
  kind: 'key';
  rows: number;
  /** The object type the rows become: one over the file already, or null for a new one. */
  type: string | null;
}

export type Proposal = ValuesProposal | BandsProposal | KeyProposal;

/** What the proposals are read from: the rules in force on the day, the day's rows counted, and what came before. */
export interface ProposalInput {
  doc: FlowDocument;
  file: string;
  /** The day the proposals rest on: the history's and the sample's days before it are read. */
  day?: string | null;
  /** The day's columns, counted over every row (`profileColumn`): kind, rows, values present, distinct values. Only
   * these columns are proposed anything: the ones the viewer may read. */
  profiles: readonly Pick<Profile, 'name' | 'kind' | 'facts'>[];
  /** Each small coded column's values that day, exactly, by column (`valueCandidates` names the columns). */
  values?: ReadonlyMap<string, readonly string[]>;
  /** The file's history as the day is judged with it. */
  history?: HistoryFile | null;
  /** The days the record leaves out of learning (`skipOf`). */
  skip?: ReadonlySet<string>;
  /** The kept sample of the file's rows, day by day. */
  sample?: SampleFile | null;
}

const lower = (s: string) => s.toLowerCase();
const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (x: number) => `${Math.round(x * 100)}%`;
/** A range of shares in whole percents: "88%–92%", or one number where the two round the same ("72%"). */
export const shareRange = ([low, high]: readonly [number, number]): string => (pct(low) === pct(high) ? pct(low) : `${pct(low)}–${pct(high)}`);

/** A column's values listed for this file: values, or bad codes, written in the ontology. */
function declared(doc: FlowDocument, file: string, column: string): boolean {
  const p = propertyOf(doc.ontology, file, column);
  return Object.keys(p?.values ?? {}).length > 0 || (p?.bad?.length ?? 0) > 0;
}

/** The name a column is shown by in a proposal: the ontology's title where it says more, else the column. */
function called(doc: FlowDocument, file: string, column: string): string {
  const t = propertyOf(doc.ontology, file, column)?.title;
  return t && saysMore(t, column) ? t : column;
}

/** Whether a column can be coded: a code or a category, and not the fill's mark. */
const coded = (p: Pick<Profile, 'name' | 'kind'>) => (p.kind === 'code' || p.kind === 'category') && lower(p.name) !== FILLED_FROM;

/**
 * Whether a column names objects of a type rather than codes: a type's key column (`control_id`, `platform_id`), a link's
 * column on the file's own type, or a lookup into another dataset. Its values are another list's keys, not codes to list.
 */
function names(doc: FlowDocument, file: string, column: string): boolean {
  const o = doc.ontology;
  if (!o) return false;
  const c = lower(column);
  if (o.objectTypes.some((t) => t.key.some((k) => lower(k) === c))) return true;
  const over = (typeId: string) => o.objectTypes.some((t) => t.id === typeId && lower(t.dataset) === lower(file));
  if (o.linkTypes.some((l) => (over(l.from) && l.on.some(([a]) => lower(a) === c)) || (over(l.to) && l.on.some(([, b]) => lower(b) === c)))) return true;
  return propertyOf(o, file, column)?.lookup !== undefined;
}

/**
 * The columns whose values the app reads exactly for a values proposal: coded, not listed in the ontology and naming no
 * type's objects, two to thirty values, each used more than once on average, in a file of fifty rows or more.
 */
export function valueCandidates(doc: FlowDocument, file: string, profiles: readonly Pick<Profile, 'name' | 'kind' | 'facts'>[]): string[] {
  return profiles.filter((p) => coded(p) && p.facts.rows >= MIN_VALUES_ROWS && !declared(doc, file, p.name) && !names(doc, file, p.name) && p.facts.distinct >= 2 && p.facts.distinct <= MAX_CODES && p.facts.present >= 2 * p.facts.distinct).map((p) => p.name);
}

/** Values in the order a person reads a code list: numbers by size, words alphabetically. */
function ordered(values: readonly string[]): string[] {
  const numbers = values.every((v) => v.trim() !== '' && Number.isFinite(Number(v)));
  return [...values].sort((a, b) => (numbers ? Number(a) - Number(b) : a < b ? -1 : a > b ? 1 : 0));
}

/** A list in words, the first few: "nightly, weekly and monthly", "a, b, c, d, e, f and 3 more". */
function listed(xs: readonly string[], most = 6): string {
  if (xs.length <= 1) return xs.join('');
  const shown = xs.length > most ? xs.slice(0, most) : xs.slice(0, -1);
  return `${shown.join(', ')} and ${xs.length > most ? `${xs.length - most} more` : xs.at(-1)}`;
}

/** The kept sample's days before the day, each with a column's values (as text; blank as null). */
function sampleDays(sample: SampleFile | null | undefined, day: string | null | undefined, column: string): { day: string; values: (string | null)[] }[] {
  if (!sample) return [];
  const c = sample.columns.findIndex((x) => lower(x) === lower(column));
  if (c < 0) return [];
  return sample.days.flatMap((d, k) => (day && d >= day ? [] : [{ day: d, values: (sample.rows[k] ?? []).map((r) => (r[c] === null || r[c] === undefined ? null : String(r[c]))) }]));
}

/** The history's last ordinary days before the day: periods with rows, the record not leaving them out, at most `most`. */
function historyDays(h: HistoryFile, day: string | null | undefined, skip: ReadonlySet<string> | undefined, most = BAND_DAYS): number[] {
  const out: number[] = [];
  for (let k = h.days.length - 1; k >= 0 && out.length < most; k--) {
    const d = h.days[k]!;
    if ((day && d >= day) || skip?.has(d) || !(h.rows[k]! > 0)) continue;
    out.push(k);
  }
  return out.reverse();
}

/** Whether a watch judges the file (`publish.watch`). */
export const watchedFile = (doc: Pick<FlowDocument, 'publish'>, file: string): boolean => Object.keys(doc.publish?.watch ?? {}).some((id) => lower(id) === lower(file));

/** What a check does with what it finds, in words: "holds the day", "warns". */
const doesWord = (mode: CheckMode | undefined) => (mode === 'warn' ? 'warns' : 'holds the day');

function valuesProposal(input: ProposalInput, p: Pick<Profile, 'name' | 'kind' | 'facts'>): ValuesProposal | null {
  const { doc, file } = input;
  if (!valueCandidates(doc, file, [p]).length) return null;
  // Counted already by the history (a watch's own `count`): its values are judged, so listing them changes nothing.
  if (Object.entries(input.history?.values ?? {}).some(([c, vh]) => lower(c) === lower(p.name) && vh.counts)) return null;
  const today = input.values?.get(p.name) ?? [...(input.values?.entries() ?? [])].find(([c]) => lower(c) === lower(p.name))?.[1];
  if (!today || today.length !== p.facts.distinct) return null;
  // Other days of the kept sample: a value seen on two of them or more is one of the codes too, absent today.
  const known = new Set(today);
  const elsewhere = new Map<string, number>();
  const days = sampleDays(input.sample, input.day, p.name);
  let agree = 0;
  for (const d of days) {
    const other = [...new Set(d.values)].filter((v): v is string => v !== null && !known.has(v));
    for (const v of other) elsewhere.set(v, (elsewhere.get(v) ?? 0) + 1);
    if (!other.length) agree++;
  }
  const more = ordered([...elsewhere].filter(([, n]) => n >= 2).map(([v]) => v));
  const values = ordered([...today, ...more]);
  if (values.length > MAX_CODES) return null;
  // Whole numbers with no gap between them (0 to 6 open findings, versions 1 and 2) are a count or an order, not codes:
  // codes written as numbers skip some (4, 24 and 72 hours), and are listed.
  const ints = values.every((v) => /^-?\d+$/.test(v.trim())) ? values.map(Number) : null;
  if (ints && Math.max(...ints) - Math.min(...ints) + 1 === ints.length) return null;
  const name = called(doc, file, p.name);
  const rests = [`${fmtInt(p.facts.present)} rows with a value today, each one of ${more.length ? `${today.length} of them` : 'them'}`];
  if (days.length) rests.push(more.length ? `The kept sample’s last ${days.length} days add ${listed(more)}` : agree === days.length ? `The kept sample’s last ${days.length} days hold no other` : `The kept sample’s last ${days.length} days hold no other on two days or more`);
  if (p.facts.present < p.facts.rows) rests.push(`${fmtInt(p.facts.rows - p.facts.present)} rows blank`);
  return {
    kind: 'values',
    id: `values:${lower(file)}:${lower(p.name)}`,
    file,
    column: p.name,
    title: `List the ${values.length} values of ${name}`,
    values,
    rests,
    does: 'Each is listed as one of its codes, meaning itself until someone words it. From the next history built, the column is counted: its shares, its pairs and the forest are judged.',
    edits: [{ op: 'declareValues', file, column: p.name, values }],
  };
}

function bandsProposals(input: ProposalInput): BandsProposal[] {
  const { doc, file, history: h } = input;
  if (!h) return [];
  const mode = gateChecksOf(doc, file)?.values;
  if (!mode || mode === 'off') return [];
  const days = historyDays(h, input.day, input.skip);
  if (days.length < MIN_BAND_DAYS) return [];
  if (quantile(days.map((k) => h.rows[k]!).sort((a, b) => a - b), 0.5) < MIN_BAND_ROWS) return [];
  const out: BandsProposal[] = [];
  // Only the columns the day's rows show (the viewer's, as the app reads them): the history counts every column, and a
  // column closed to the viewer is proposed nothing, so nothing of it is said.
  const shown = new Set(input.profiles.map((p) => lower(p.name)));
  for (const [column, vh] of Object.entries(h.values ?? {})) {
    if (!vh.counts || !shown.has(lower(column))) continue;
    const prop = propertyOf(doc.ontology, file, column);
    // A band is written on the column's property (`applyBand`): one with none isn't the ontology's to band yet.
    if (!prop) continue;
    if ((prop.expect ?? []).some((b) => !b.datasets || b.datasets.some((d) => lower(d) === lower(file)))) continue;
    const bands: (BandsProposal['bands'][number] & { median: number })[] = [];
    vh.values.forEach((key, i) => {
      if (key === 'null') return;
      const shares = days.map((k) => (vh.counts![k]?.[i] ?? 0) / h.rows[k]!).sort((a, b) => a - b);
      if (quantile(shares, 0.5) < COMMON_SHARE) return;
      const usual: [number, number] = [quantile(shares, 0.05), quantile(shares, 0.95)];
      // Whole percents, outward: a band people read at a glance, never narrower than the usual range and the margin.
      const share: [number, number] = [Math.max(0, Math.floor((usual[0] - BAND_MARGIN) * 100 + 1e-9) / 100), Math.min(1, Math.ceil((usual[1] + BAND_MARGIN) * 100 - 1e-9) / 100)];
      if (share[0] === 0 && share[1] === 1) return;
      let value: string;
      try {
        value = String(JSON.parse(key));
      } catch {
        value = key;
      }
      bands.push({ value, usual, share, median: quantile(shares, 0.5) });
    });
    if (!bands.length) continue;
    // The most common value first.
    bands.sort((a, b) => b.median - a.median);
    const name = called(doc, file, column);
    const noun = nounOf(doc.ontology, file).many;
    out.push({
      kind: 'bands',
      id: `bands:${lower(file)}:${lower(column)}`,
      file,
      column,
      title: `Bands for the ${bands.length === 1 ? 'common value' : `${bands.length} common values`} of ${name}`,
      bands: bands.map(({ value, usual, share }) => ({ value, usual, share })),
      days: days.length,
      rests: [`Usual: each value’s share of ${noun} on the last ${days.length} days, the middle nine days in ten`],
      does: `Each band is its usual range five points either side. A day outside one ${doesWord(mode)}, by the values check.`,
      edits: bands.map((b) => ({ op: 'acceptBand', source: file, band: { column, value: b.value, share: b.share } })),
    });
  }
  return out;
}

/** The name pattern of an id: `id`, `*_id`, `fooId`, `key`, `*_key`. */
const ID_NAME = /^(id|key)$|_(id|key)$|[a-z](Id|ID|Key)$/i;

function keyProposal(input: ProposalInput): KeyProposal | null {
  const { doc, file } = input;
  const mode = gateChecksOf(doc, file)?.reconcile;
  if (!mode || mode === 'off') return null;
  const o = doc.ontology;
  if ((o?.rows ?? []).some((r) => lower(r.dataset) === lower(file))) return null;
  if (Object.entries(doc.gates ?? {}).some(([id, g]) => lower(id) === lower(file) && g.reconcile)) return null;
  const rows = input.profiles[0]?.facts.rows ?? 0;
  if (rows < MIN_KEY_ROWS) return null;
  const type = (o?.objectTypes ?? []).find((t) => lower(t.dataset) === lower(file)) ?? null;
  const h = input.history;
  const days = h ? historyDays(h, input.day, input.skip) : [];
  const never = (column: string): boolean => {
    if (!h) return true;
    const c = h.columns.findIndex((x) => lower(x) === lower(column));
    return c < 0 || days.every((k) => h.present[k]?.[c] === h.rows[k]);
  };
  const sampled = (column: string) => sampleDays(input.sample, input.day, column);
  const unique = (column: string): boolean => sampled(column).every((d) => !d.values.includes(null) && new Set(d.values).size === d.values.length);
  const candidates = input.profiles
    .filter((p) => p.facts.rows === rows && p.facts.present === rows && p.facts.distinct === rows && p.kind !== 'measure' && p.kind !== 'time' && p.kind !== 'empty' && lower(p.name) !== FILLED_FROM)
    // A type over the file already names its key: only that column can be the file's.
    .filter((p) => !type?.key.length || (type.key.length === 1 && lower(type.key[0]!) === lower(p.name)))
    .filter((p) => never(p.name) && unique(p.name));
  if (!candidates.length) return null;
  const order = input.profiles.map((p) => p.name);
  const rank = (name: string) => (ID_NAME.test(name) ? 0 : 1);
  const best = [...candidates].sort((a, b) => rank(a.name) - rank(b.name) || order.indexOf(a.name) - order.indexOf(b.name))[0]!;
  const name = called(doc, file, best.name);
  // The rows become the type's objects: called by its name where a type is over the file, else by the file's noun.
  const noun = type ? type.name.toLowerCase() : nounOf(o, file).one;
  const sample = sampled(best.name).length;
  const rests = [`${fmtInt(rows)} rows, ${fmtInt(rows)} different ${name}s, none blank`];
  if (h && days.length) rests.push(`Never blank on the last ${days.length} days`);
  if (sample) rests.push(`None repeated within a day in the kept sample’s last ${sample} days`);
  return {
    kind: 'key',
    id: `key:${lower(file)}:${lower(best.name)}`,
    file,
    column: best.name,
    rows,
    type: type ? type.name : null,
    title: `One row a ${noun === 'row' ? name : noun}, by ${name}`,
    rests,
    does: `${type ? `The file becomes the ${type.name} type’s rows` : `The file becomes the rows of an object type of its own, keyed by ${name}`}. A day that repeats a ${name} or leaves one blank ${doesWord(mode)}, by the reconcile check.`,
    edits: [{ op: 'declareKey', file, column: best.name }],
  };
}

/**
 * The declarations proposed for a file from its data, the key first, then each column's in the file's order: nothing
 * for a column or a file the ontology already declares, or where the data doesn't show it.
 */
export function proposalsOf(input: ProposalInput): Proposal[] {
  // A file nothing watches is judged by nothing it declares: a key or a band there would check nothing, and nothing
  // builds its history to count a column.
  if (!watchedFile(input.doc, input.file)) return [];
  const out: Proposal[] = [];
  const key = keyProposal(input);
  if (key) out.push(key);
  const bands = bandsProposals(input);
  const order = input.profiles.map((p) => lower(p.name));
  const at = (c: string) => (order.includes(lower(c)) ? order.indexOf(lower(c)) : order.length);
  const columns: Proposal[] = [...input.profiles.flatMap((p) => valuesProposal(input, p) ?? []), ...bands];
  columns.sort((a, b) => at(a.column) - at(b.column) || (a.kind === 'values' ? -1 : 1));
  return [...out, ...columns];
}
