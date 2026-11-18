/**
 * Ontology first (ADR 0027 §4, §5; Q-252, Q-254): what a source still needs before a step may read it. Three things
 * are confirmed of a file: **what one row is** (a rows entry, a type whose objects are its rows, or a noun), and
 * **every column**, each either **described** (the ontology says what it holds) or **set aside** (named in
 * `ontology.aside`, and not a column the source declares, so nothing reads it).
 *
 * A document doesn't hold its sources' columns: the data's list does, and a run's file. So this is asked where the
 * columns are known, with them: the build asks it of a format-5 flow and refuses one that isn't described; the page
 * asks it of the day on screen, and of a file someone is adding.
 *
 * - `undescribed`: each source with what it lacks: what a row is, the columns not described, the columns set aside
 *   though the source declares them (a column can't be both taken and set aside).
 * - `undescribedSaid`: one source's, in a sentence.
 * - `asideOf`: the columns a file has set aside; `isAside`.
 * - `awaitedOf`: the datasets described before their data exists (§5, Q-255); `awaitedIssues` holds one to its shape.
 *
 * Pure: no DOM, no engine.
 */
import type { FlowDocument } from './document.js';
import { AWAITED_COLUMN_FIELDS, AWAITED_FIELDS, propertyOf, rowsOf, type AwaitedDataset, type Ontology } from './ontology.js';

const lower = (x: string) => x.toLowerCase();

/** The columns a file has set aside, as the ontology names them. */
export function asideOf(o: Ontology | undefined, file: string): string[] {
  const found = Object.entries(o?.aside ?? {}).find(([f]) => lower(f) === lower(file));
  return found ? [...found[1]] : [];
}

/** Whether a column of a file is set aside. */
export const isAside = (o: Ontology | undefined, file: string, column: string): boolean => asideOf(o, file).some((c) => lower(c) === lower(column));

/** Whether the ontology says what one row of a dataset is: a rows entry, a type whose objects are its rows, or a noun. */
export function rowSaid(o: Ontology | undefined, dataset: string): boolean {
  if (!o) return false;
  return !!rowsOf(o, dataset) || o.objectTypes.some((t) => lower(t.dataset) === lower(dataset)) || Object.keys(o.nouns ?? {}).some((k) => lower(k) === lower(dataset));
}

/** Whether the ontology describes a column of a dataset: it has words for what the column holds. */
export const columnDescribed = (o: Ontology | undefined, dataset: string, column: string): boolean => (propertyOf(o, dataset, column)?.description ?? '').trim() !== '';

/** What a source lacks before the ontology comes first for it. */
export interface Undescribed {
  source: string;
  /** The ontology doesn't say what one row of it is. */
  row: boolean;
  /** The columns it declares that the ontology doesn't describe. */
  columns: string[];
  /** The columns set aside that it declares all the same: set aside, a column isn't taken. */
  taken: string[];
}

/**
 * What each source of a flow lacks (none where the ontology comes first for all of them), given each source's declared
 * columns (`columnsOf`, null where they aren't known: then only what a row is can be said).
 */
export function undescribed(doc: Pick<FlowDocument, 'sources' | 'ontology'>, columnsOf: (source: string) => readonly string[] | null): Undescribed[] {
  const o = doc.ontology;
  return doc.sources.flatMap((s): Undescribed[] => {
    const declared = columnsOf(s.id);
    const aside = asideOf(o, s.id).map(lower);
    const columns = (declared ?? []).filter((c) => !columnDescribed(o, s.id, c));
    const taken = (declared ?? []).filter((c) => aside.includes(lower(c)));
    const row = !rowSaid(o, s.id);
    return row || columns.length || taken.length ? [{ source: s.id, row, columns, taken }] : [];
  });
}

const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** What a source lacks, in a sentence: "tls: what one row is isn't said; expires_on and issuer aren't described". */
export function undescribedSaid(u: Undescribed): string {
  const parts = [
    ...(u.row ? ['what one row is isn’t said'] : []),
    ...(u.columns.length ? [`${listed(u.columns)} ${u.columns.length === 1 ? 'isn’t' : 'aren’t'} described`] : []),
    ...(u.taken.length ? [`${listed(u.taken)} ${u.taken.length === 1 ? 'is' : 'are'} set aside and declared all the same`] : []),
  ];
  return `${u.source}: ${parts.join('; ')}`;
}

/** The datasets the ontology describes ahead of their data (ADR 0027 §5, Q-255), in its order. */
export const awaitedOf = (o: Ontology | undefined): AwaitedDataset[] => o?.awaited ?? [];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const NAME = /^[a-z][a-z0-9_]*$/;

/**
 * What is wrong with a dataset described ahead of its data, each as a path under it and a sentence; none, and it is
 * one: a name the flow could use, what people call it, what one row is, a key of its own columns, and every column
 * named once and described.
 */
export function awaitedIssues(x: unknown): [path: string, message: string][] {
  if (!isRecord(x)) return [['', 'a dataset described ahead of its data: { id, name, row: { one, many }, key, columns }']];
  const out: [string, string][] = [];
  for (const k of Object.keys(x)) if (!(AWAITED_FIELDS as readonly string[]).includes(k)) out.push([`.${k}`, `not a setting of a dataset described ahead: ${AWAITED_FIELDS.join(', ')}`]);
  if (typeof x.id !== 'string' || !NAME.test(x.id)) out.push(['.id', 'the dataset’s name: lower-case letters, digits and underscores, starting with a letter']);
  if (!text(x.name)) out.push(['.name', 'what people call it']);
  if (x.description !== undefined && typeof x.description !== 'string') out.push(['.description', 'what it is, in a line']);
  // A noun, as the ontology keeps one for every dataset: a word or two.
  const noun = (v: unknown) => text(v) && v.trim().split(/\s+/).length <= 2;
  if (!isRecord(x.row) || !noun(x.row.one) || !noun(x.row.many)) out.push(['.row', 'what one row is: { one, many }, one or two words each']);
  const columns = Array.isArray(x.columns) ? x.columns : null;
  if (!columns || columns.length === 0) out.push(['.columns', 'its columns: a list of one or more, each { column, description }']);
  const names: string[] = [];
  (columns ?? []).forEach((c: unknown, i: number) => {
    if (!isRecord(c) || !text(c.column)) return void out.push([`.columns[${i}]`, 'a column: { column, title?, description }']);
    for (const k of Object.keys(c)) if (!(AWAITED_COLUMN_FIELDS as readonly string[]).includes(k)) out.push([`.columns[${i}].${k}`, `not a setting of a described column: ${AWAITED_COLUMN_FIELDS.join(', ')}`]);
    if (!text(c.description)) out.push([`.columns[${i}].description`, `what ${c.column} holds: a described dataset describes every column`]);
    if (c.title !== undefined && !text(c.title)) out.push([`.columns[${i}].title`, 'what people call it']);
    if (names.includes(c.column.toLowerCase())) out.push([`.columns[${i}].column`, `${c.column} is named twice`]);
    names.push(c.column.toLowerCase());
  });
  const key = Array.isArray(x.key) && x.key.length > 0 && x.key.every((k: unknown) => typeof k === 'string') ? (x.key as string[]) : null;
  if (!key) out.push(['.key', 'the columns that tell one row from another: a list of one or more']);
  else {
    for (const k of key) if (names.length && !names.includes(k.toLowerCase())) out.push(['.key', `${k} isn’t one of its columns`]);
    if (new Set(key.map((k) => k.toLowerCase())).size !== key.length) out.push(['.key', 'each key column once']);
  }
  return out;
}
