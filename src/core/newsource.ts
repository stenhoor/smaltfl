/**
 * The two doors (ADR 0027 §5; Q-248, Q-254): a source and its description are made together.
 *
 * **Here is the data.** `readFile` reads a CSV file someone adds: its columns as the file names them, each with the
 * type its values read as, how many are blank, how many differ, and its commonest. `proposeSource` proposes the
 * file's description from that, as declarations are proposed from a file's own data (Q-139): a name, what one row is,
 * a likely key, and for each column what the ontology says of it already. Before any step may read the file three
 * things are confirmed, and `sourceProblems` says which aren't yet: **what one row is**, **by which key**, and
 * **every column**, each described or set aside. `withSource` then writes it into the document: the source, its
 * description in the ontology, and in a notebook of the flow's own (`sources.nb.ts`) its cell, a check step that asks
 * each row for its key, and the file as checked, published. As the join form's cell is (ADR 0026 §10), the text is the
 * flow's: the steps are derived from it again by the caller, with the parser that reads any notebook.
 * `withoutSource` takes it out again.
 *
 * **Describe it first.** A dataset the ontology describes ahead of its data (`ontology.awaited`, Q-255) waits for
 * data until a file is bound to it: `matchAwaited` maps the file's columns onto the described ones (a column under
 * another name is read as the described one, as ADR 0022 §2 reads a renamed column), and `specOfAwaited` gives the
 * source the description asks for, the file's other columns left to describe or set aside.
 *
 * Pure: no DOM, no engine, no parser. Nothing the data is made from reads this module.
 */
import { csvRecords, namesClose } from './columns.js';
import { asideOf, awaitedOf } from './described.js';
import type { FlowDocument, NotebookDef } from './document.js';
import { propertyOf, type AwaitedDataset, type Ontology, type PropertyType } from './ontology.js';

/**
 * A source's binding as the engine reads it: the shape of a data list's (`examples/sources.ts` `Binding`), said here so
 * that the core reads nothing outside itself and the package builds from `src` alone.
 */
export interface SourceBinding {
  table: string;
  format: 'parquet' | 'csv';
  file: string;
  header?: boolean;
  columns?: [name: string, type: string][];
}

const lower = (x: string) => x.toLowerCase();
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** The notebook the app writes the sources added in it into, beside the flow's own. */
export const SOURCES_NOTEBOOK = 'sources.nb.ts';

/** The type a file's column is declared as: what its values read as, the narrowest of the three. */
export type FileType = 'INTEGER' | 'REAL' | 'TEXT';

/** The most values of a column that are counted one by one: a column with more is said to have more. */
export const VALUES_COUNTED = 1000;
/** The commonest values of a column kept, to show what it holds. */
export const VALUES_SHOWN = 6;

/** A column of a file someone adds, as the file has it. */
export interface FileColumn {
  /** Its name in the header, trimmed. */
  name: string;
  type: FileType;
  /** The rows where it is blank. */
  blank: number;
  /** How many values it has that differ, counted up to `VALUES_COUNTED`: one more than that says "more". */
  distinct: number;
  /** Never blank and never the same twice: what tells one row from another by itself. */
  unique: boolean;
  /** Its commonest values with their rows, most first; none where it has too many to count. */
  values: [value: string, rows: number][];
}

/** A file someone adds, read. */
export interface FileRead {
  rows: number;
  columns: FileColumn[];
  /** Why it can't be read as a table, each in a sentence; none, and it can. */
  problems: string[];
}

const INTEGER = /^[+-]?\d{1,15}$/;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
/** A whole number written with leading zeros is a code, not a count: "007" stays text. */
const PADDED = /^[+-]?0\d/;

/**
 * A CSV file with a header, read whole: each column's type from every value it has (a type declared from a sample
 * would stop the first run a later row broke it), its blanks, how many values differ and the commonest. A file that
 * can't be read as a table says why: no header, a column with no name, a name twice (whatever its case), or a row
 * that hasn't the header's fields.
 */
export function readFile(text: string): FileRead {
  const records = csvRecords(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  const header = (records[0] ?? []).map((f) => f.trim());
  const problems: string[] = [];
  if (!header.length || header.every((h) => h === '')) return { rows: 0, columns: [], problems: ['The file is empty: its first line names its columns'] };
  const blankAt = header.findIndex((h) => h === '');
  if (blankAt >= 0) problems.push(`Column ${blankAt + 1} has no name in the header`);
  const twice = header.filter((h, i) => h !== '' && header.findIndex((x) => lower(x) === lower(h)) !== i);
  if (twice.length) problems.push(`${listed([...new Set(twice)])} ${new Set(twice.map(lower)).size === 1 ? 'is' : 'are'} named twice in the header`);
  const rows = records.slice(1);
  const ragged = rows.findIndex((r) => r.length !== header.length);
  if (ragged >= 0) problems.push(`Row ${ragged + 1} has ${plural(rows[ragged]!.length, 'field')} where the header has ${header.length}`);
  if (problems.length) return { rows: rows.length, columns: [], problems };
  const columns = header.map((name, at): FileColumn => {
    let integer = true;
    let number = true;
    let blank = 0;
    let more = false;
    // Every value until one repeats, for whether the column is a key; the counts, while they are few.
    let seen: Set<string> | null = new Set();
    const counts = new Map<string, number>();
    for (const r of rows) {
      const raw = r[at]!;
      const v = raw.trim();
      if (v === '') {
        blank++;
        continue;
      }
      if (integer && (!INTEGER.test(v) || PADDED.test(v))) integer = false;
      if (number && (!NUMBER.test(v) || PADDED.test(v))) number = false;
      if (seen) {
        if (seen.has(raw)) seen = null;
        else seen.add(raw);
      }
      const n = counts.get(raw);
      if (n !== undefined) counts.set(raw, n + 1);
      else if (counts.size <= VALUES_COUNTED) counts.set(raw, 1);
      else more = true;
    }
    const filled = rows.length - blank;
    const few = !more && counts.size <= VALUES_COUNTED;
    return {
      name,
      type: filled === 0 ? 'TEXT' : integer ? 'INTEGER' : number ? 'REAL' : 'TEXT',
      blank,
      distinct: few ? counts.size : VALUES_COUNTED + 1,
      unique: filled > 0 && blank === 0 && seen !== null,
      values: few ? [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).slice(0, VALUES_SHOWN) : [],
    };
  });
  return { rows: rows.length, columns, problems: [] };
}

/** How many rows share their key with a row before them: none where the key tells every row apart. */
export function keyRepeats(text: string, key: readonly string[]): number {
  const records = csvRecords(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  const header = (records[0] ?? []).map((f) => lower(f.trim()));
  const at = key.map((k) => header.indexOf(lower(k)));
  if (!at.length || at.some((i) => i < 0)) return 0;
  const seen = new Set<string>();
  let repeats = 0;
  for (const r of records.slice(1)) {
    const k = JSON.stringify(at.map((i) => r[i] ?? ''));
    if (seen.has(k)) repeats++;
    else seen.add(k);
  }
  return repeats;
}

/** One column of a source being added: as the flow will name it, described or set aside. */
export interface SourceColumn {
  column: string;
  type: FileType;
  /** What it holds, in the adder's words: asked for unless the ontology describes the column already or it is set aside. */
  description?: string;
  /** What people call it; made from its name where none is given. */
  title?: string;
  /** Set aside: the file has it and the flow doesn't take it, so no step can read it. */
  aside?: boolean;
  /** The file's name for it, where that isn't the column's: read as the column (binding a dataset described first). */
  fromFile?: string;
}

/** A source and its description, as the form gives them. */
export interface SourceSpec {
  /** The dataset's name in the flow: lower-case letters, digits and underscores. */
  id: string;
  /** What the file is, in a line. */
  description: string;
  /** What one row is, as a count reads: "vendor", "vendors". */
  row: { one: string; many: string };
  /** A kind of thing the ontology has already whose objects these rows are; none, and they are a kind of their own. */
  of?: string;
  /** The columns that tell one row from another. */
  key: string[];
  /** Every column of the file, in the file's order. */
  columns: SourceColumn[];
}

const words = (name: string): string[] => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
/** "vendor contracts" → "vendor contract": what one of them is called, by the plain rules of English plurals. */
export function oneOf(many: string): string {
  const ws = many.split(' ');
  const last = ws.at(-1) ?? '';
  const one = /ies$/.test(last) && last.length > 4 ? `${last.slice(0, -3)}y` : /(ches|shes|sses|xes|zes)$/.test(last) ? last.slice(0, -2) : /s$/.test(last) && !/(ss|us|is)$/.test(last) ? last.slice(0, -1) : last;
  return [...ws.slice(0, -1), one].join(' ');
}
/** "owner_team_id" → "Owner team id": a column's name as a title. */
export const titleOf = (name: string): string => {
  const t = words(name).join(' ');
  return t ? t[0]!.toUpperCase() + t.slice(1) : name;
};

/** A name for a dataset that the flow doesn't use yet, from a file's name: "Vendor List 2024.csv" → `vendor_list_2024`. */
export function sourceName(doc: Pick<FlowDocument, 'sources' | 'steps'>, file: string): string {
  const stem = file.replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]+$/, '');
  const joined = words(stem).join('_').slice(0, 40).replace(/_+$/, '');
  const base = /^[a-z]/.test(joined) ? joined : `file_${joined}`.replace(/_+$/, '');
  const taken = new Set([...doc.sources, ...doc.steps].map((x) => lower(x.id)));
  const free = (name: string) => !taken.has(name) && !taken.has(`${name}_checked`);
  let name = base;
  for (let n = 2; !free(name); n++) name = `${base}_${n}`;
  return name;
}

/** How likely a unique column is the key, by its name: an id before a code before anything else. */
const keyRank = (name: string): number => {
  const ws = words(name);
  if (ws.at(-1) === 'id' || ws.join('') === 'id') return 0;
  if (ws.some((w) => w === 'key' || w === 'uuid' || w === 'guid')) return 1;
  if (ws.some((w) => w === 'code' || w === 'number' || w === 'no' || w === 'ref')) return 2;
  return 3;
};

/** Whether the ontology says what a column of a dataset holds already: a meaning every dataset shares, or the estate's. */
export const describedAlready = (o: Ontology | undefined, dataset: string, column: string): PropertyType | null => {
  const p = propertyOf(o, dataset, column);
  return p && p.description.trim() !== '' ? p : null;
};

/**
 * A file's description proposed from its own data (Q-248, Q-139): the dataset named after the file, one row named
 * after the dataset, the key the first column that tells every row apart (an id before a code before any other), and
 * every column with its type. Nothing is described for the person: a column the ontology has a meaning for already
 * needs no words here (`describedAlready`), and the rest are theirs to describe or set aside.
 */
export function proposeSource(doc: Pick<FlowDocument, 'sources' | 'steps' | 'ontology'>, file: string, read: FileRead): SourceSpec {
  const id = sourceName(doc, file);
  // A noun is a word or two (the document asks so): the name's last two words that aren't numbers.
  const named = words(id).filter((w) => !/^\d+$/.test(w) && w !== 'file');
  const many = (named.length ? named : words(id)).slice(-2).join(' ');
  const keys = read.columns.filter((c) => c.unique && c.type !== 'REAL').map((c, i) => ({ c, i })).sort((a, b) => keyRank(a.c.name) - keyRank(b.c.name) || a.i - b.i);
  return {
    id,
    description: '',
    row: { one: oneOf(many), many },
    key: keys.length ? [keys[0]!.c.name] : [],
    columns: read.columns.map((c) => ({ column: c.name, type: c.type })),
  };
}

const NAME = /^[a-z][a-z0-9_]*$/;

/**
 * What is still to confirm before a file may be added (ADR 0027 §5, Q-254), each in a sentence; none, and every step
 * may read it. Its name is one the flow can use; what one row is is said, by a key of columns the flow takes; and every
 * column is described (here, or by the ontology already) or set aside.
 */
export function sourceProblems(doc: Pick<FlowDocument, 'sources' | 'steps' | 'ontology' | 'notebooks' | 'name' | 'gates'>, spec: SourceSpec): string[] {
  const out: string[] = [];
  const taken = new Set([...doc.sources, ...doc.steps].map((x) => lower(x.id)));
  if (!NAME.test(spec.id)) out.push('Its name is lower-case letters, digits and underscores, and starts with a letter');
  else if (taken.has(lower(spec.id)) || taken.has(`${lower(spec.id)}_checked`)) out.push(`${spec.id} is a name the flow uses already`);
  if (!doc.notebooks) out.push(`${doc.name} isn’t written as notebooks: a source is added as a cell`);
  const noun = (x: string) => x.trim() !== '' && x.trim().split(/\s+/).length <= 2;
  if (!spec.row.one.trim() || !spec.row.many.trim()) out.push('Say what one row is: one of them, and many');
  else if (!noun(spec.row.one) || !noun(spec.row.many)) out.push('Say what one row is in a word or two: “vendor” and “vendors”');
  const taking = spec.columns.filter((c) => !c.aside);
  const names = spec.columns.map((c) => lower(c.column));
  const twice = spec.columns.filter((c, i) => names.indexOf(lower(c.column)) !== i).map((c) => c.column);
  if (twice.length) out.push(`${listed([...new Set(twice)])} would be two columns of one name`);
  if (!taking.length) out.push('Every column is set aside: the flow would take nothing of the file');
  if (!spec.key.length) out.push('Say which columns tell one row from another: its key');
  for (const k of spec.key) {
    const c = spec.columns.find((x) => lower(x.column) === lower(k));
    if (!c) out.push(`The key names ${k}, which the file doesn’t have`);
    else if (c.aside) out.push(`${k} is the key and set aside: a key is a column the flow takes`);
  }
  if (spec.of !== undefined) {
    const type = doc.ontology?.objectTypes.find((t) => t.id === spec.of);
    if (!type) out.push(`The ontology has no kind of thing ${spec.of}`);
    // What a dataset's rows are is a gate's written check (ADR 0015): a flow with no gate keeps none.
    else if (!Object.keys(doc.gates ?? {}).length) out.push(`${doc.name} has no gate, so it keeps no rows of a kind the ontology has: its rows are a kind of their own`);
    else if (spec.key.length !== 1) out.push(`One row is ${type.name}: its key is the one column that holds ${type.name}’s ${listed(type.key)}`);
  }
  const lacking = taking.filter((c) => !(c.description ?? '').trim() && !describedAlready(doc.ontology, spec.id, c.column)).map((c) => c.column);
  if (lacking.length) out.push(`${listed(lacking)} ${lacking.length === 1 ? 'is' : 'are'} neither described nor set aside`);
  return out;
}

/** The columns still to describe or set aside: what the form counts down. */
export const columnsLacking = (o: Ontology | undefined, spec: SourceSpec): string[] =>
  spec.columns.filter((c) => !c.aside && !(c.description ?? '').trim() && !describedAlready(o, spec.id, c.column)).map((c) => c.column);

/** The file's name next to the app, and the table its source reads. */
export const fileOfSource = (id: string): string => `${id}.csv`;
const tableOf = (doc: Pick<FlowDocument, 'sources'>, id: string): string => {
  const taken = new Set(doc.sources.map((s) => lower(s.table)));
  let table = `${id}_file`;
  for (let n = 2; taken.has(lower(table)); n++) table = `${id}_file_${n}`;
  return table;
};

/**
 * The binding a source added here is read by (ADR 0010 §9): a CSV file with a header, its table, and the columns the
 * flow takes with their types, by the names the flow gives them. A column set aside isn't declared, so nothing reads
 * it; a column the file names otherwise is declared by the file's name where its table is defined (`readAsOf`).
 */
export function bindingOfSource(doc: Pick<FlowDocument, 'sources'>, spec: SourceSpec): SourceBinding {
  const had = doc.sources.find((s) => lower(s.id) === lower(spec.id));
  return { table: had?.table ?? tableOf(doc, spec.id), format: 'csv', file: fileOfSource(spec.id), header: true, columns: spec.columns.filter((c) => !c.aside).map((c) => [c.column, c.type]) };
}

/** A source added in words, for the record and the sheet: "Added vendors: one row is a vendor, by vendor_id; 5 columns
 * described and 1 set aside". */
export function sourceSaid(spec: SourceSpec): string {
  const aside = spec.columns.filter((c) => c.aside).length;
  const taken = spec.columns.length - aside;
  const an = /^[aeiou]/i.test(spec.row.one) ? 'an' : 'a';
  return `Added ${spec.id}: one row is ${an} ${spec.row.one}, by ${listed(spec.key)}; ${plural(taken, 'column')} described${aside ? ` and ${aside} set aside` : ''}`;
}

const HEAD = `// Sources added in the app (ADR 0027 §5): each a file described before any step reads it. Edit it as any notebook.
import { cell } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';
`;
const PUBLISHED = "cell('published');";
/** A string as a TypeScript single-quoted literal. */
const quoted = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
/** A column as SQL names it: plain where it is a plain name, quoted otherwise. */
const sqlName = (name: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`);
/** The step that checks a source added here, and what it publishes. */
export const checkedOf = (id: string): string => `${id}_checked`;

function cellText(spec: SourceSpec): string {
  const rules = spec.key.map((k) => `{ name: ${quoted(`has_${words(k).join('_') || 'key'}`)}, check: ${quoted(`${sqlName(k)} IS NOT NULL`)}, onFail: 'warn' }`);
  return [
    `cell('${spec.id}');`,
    `export const ${spec.id} = source('${spec.id}');`,
    '',
    `cell('${checkedOf(spec.id)}');`,
    `export const ${checkedOf(spec.id)} = check(${spec.id}, { rules: [${rules.join(', ')}] });`,
    '',
  ].join('\n');
}

/** A kind of thing's id that the ontology doesn't use yet, from what one of them is called. */
function typeId(o: Ontology | undefined, one: string): string {
  const base = words(one).join('_') || 'thing';
  const taken = new Set((o?.objectTypes ?? []).map((t) => lower(t.id)));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
  return id;
}

/**
 * A document with a source written into it (ADR 0027 §5), for a spec `sourceProblems` says nothing against: the
 * source; in the ontology what one row is (a kind of thing of its own, or a rows entry of a kind the ontology has),
 * its noun, each column's meaning as the file's own where the ontology has none, and the columns set aside; in the
 * sources' notebook its cell, the check step that asks every row for its key, and that step published. Only the
 * document's own text changes: the steps are derived from the notebooks again by the caller. `shared` says which
 * columns an estate's ontology describes: their meaning is the estate's, and isn't said again.
 */
export function withSource(doc: FlowDocument, spec: SourceSpec, shared: (column: string) => boolean = () => false): FlowDocument {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  const binding = bindingOfSource(doc, spec);
  const taking = spec.columns.filter((c) => !c.aside);
  const aside = spec.columns.filter((c) => c.aside).map((c) => c.fromFile ?? c.column);
  const properties: PropertyType[] = taking.flatMap((c): PropertyType[] => {
    const had = describedAlready(o, spec.id, c.column);
    const words = (c.description ?? '').trim();
    const reads = c.fromFile !== undefined && lower(c.fromFile) !== lower(c.column) ? c.fromFile : undefined;
    // A meaning an estate shares stands as it is (`shared`, ADR 0026 §8): the file's own entry is written only to read
    // the column under the file's other name, and says so as the override it is.
    if (shared(c.column)) {
      return reads === undefined ? [] : [{ column: c.column, title: had?.title ?? titleOf(c.column), description: had?.description ?? words, datasets: [spec.id], fromFile: reads, override: { reason: `The file names it ${reads}` } }];
    }
    // A meaning the flow's own ontology has for every dataset needs no words here.
    if (words === '' && reads === undefined) return [];
    return [{ column: c.column, title: (c.title ?? '').trim() || had?.title || titleOf(c.column), description: words || had?.description || '', datasets: [spec.id], ...(reads !== undefined ? { fromFile: reads } : {}) }];
  });
  const title = taking.find((c) => ['name', 'title', 'label'].includes(words(c.column).at(-1) ?? ''))?.column ?? spec.key[0]!;
  const one = spec.row.one.trim();
  const ontology: Ontology = {
    ...o,
    objectTypes: spec.of !== undefined ? o.objectTypes : [...o.objectTypes, { id: typeId(o, one), name: one[0]!.toUpperCase() + one.slice(1), dataset: spec.id, key: [...spec.key], title, ...(spec.description.trim() ? { description: spec.description.trim() } : {}) }],
    ...(spec.of !== undefined ? { rows: [...(o.rows ?? []), { dataset: spec.id, of: spec.of, key: spec.key[0]! }] } : {}),
    ...(properties.length ? { properties: [...(o.properties ?? []), ...properties] } : {}),
    nouns: { ...(o.nouns ?? {}), [spec.id]: { one, many: spec.row.many.trim() } },
    ...(aside.length ? { aside: { ...(o.aside ?? {}), [spec.id]: aside } } : {}),
  };
  const notebooks = doc.notebooks ?? [];
  const at = notebooks.findIndex((n) => n.path === SOURCES_NOTEBOOK);
  const lines = (at >= 0 ? notebooks[at]!.source : `${HEAD}\n${PUBLISHED}\n`).split('\n');
  const pub = lines.findIndex((line) => line.trim() === PUBLISHED);
  const head = pub >= 0 ? lines.slice(0, pub) : lines;
  const tail = pub >= 0 ? lines.slice(pub) : [PUBLISHED];
  while (tail.length && tail.at(-1) === '') tail.pop();
  const said = spec.description.trim() || `${spec.row.many.trim()[0]!.toUpperCase()}${spec.row.many.trim().slice(1)}, as the file has them`;
  const text = [...head, ...cellText(spec).split('\n'), ...tail, `publish(${checkedOf(spec.id)}, { description: ${quoted(said)} });`, ''].join('\n');
  const next: NotebookDef = { path: SOURCES_NOTEBOOK, source: text };
  return {
    ...doc,
    sources: [...doc.sources.filter((s) => lower(s.id) !== lower(spec.id)), { id: spec.id, table: binding.table, ...(spec.description.trim() ? { description: spec.description.trim() } : {}) }],
    ontology,
    notebooks: at >= 0 ? notebooks.map((n, i) => (i === at ? next : n)) : [...notebooks, next],
  };
}

/** The sources added here, by name, from the sources' notebook's text: each `source('…')` cell it has. */
export function sourcesAdded(doc: Pick<FlowDocument, 'notebooks'>): string[] {
  const nb = (doc.notebooks ?? []).find((n) => n.path === SOURCES_NOTEBOOK);
  return nb ? [...nb.source.matchAll(/^export const ([a-z][a-z0-9_]*) = source\('\1'\);$/gm)].map((m) => m[1]!) : [];
}

/** The steps that read a source added here, its own check aside: while there are any, it stays. */
export function sourceReaders(doc: Pick<FlowDocument, 'steps'>, id: string): string[] {
  const mine = new Set([lower(id), lower(checkedOf(id))]);
  return doc.steps.filter((s) => !mine.has(lower(s.id)) && s.inputs.some((i) => mine.has(lower(i)))).map((s) => s.id);
}

/**
 * A document without a source added here: its cells and its publish line out of the sources' notebook (the notebook
 * with them once nothing is left in it), the source, and what the ontology says of it alone (its kind of thing, its
 * rows entry, its noun, the meanings that are its own, the columns set aside). A description written ahead of its data
 * stays (`ontology.awaited`): it waits for data again. The steps are derived again by the caller.
 */
export function withoutSource(doc: FlowDocument, id: string): FlowDocument {
  const notebooks = doc.notebooks ?? [];
  const at = notebooks.findIndex((n) => n.path === SOURCES_NOTEBOOK);
  if (at < 0 || !sourcesAdded(doc).some((s) => lower(s) === lower(id))) return doc;
  const checked = checkedOf(id);
  const drop = new Set([`cell('${id}');`, `export const ${id} = source('${id}');`, `cell('${checked}');`]);
  const kept = notebooks[at]!.source.split('\n')
    .filter((line) => !drop.has(line) && !line.startsWith(`export const ${checked} = check(${id},`) && !line.startsWith(`publish(${checked},`) && line !== `publish(${checked});`)
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''));
  const left = kept.some((line) => line.startsWith("cell('") && line.trim() !== PUBLISHED);
  const o = doc.ontology;
  const mine = (x: string) => lower(x) === lower(id);
  const ontology: Ontology | undefined = o && {
    ...o,
    objectTypes: o.objectTypes.filter((t) => !mine(t.dataset)),
    ...(o.rows ? { rows: o.rows.filter((r) => !mine(r.dataset)) } : {}),
    ...(o.properties ? { properties: o.properties.flatMap((p) => (!p.datasets?.some(mine) ? [p] : p.datasets.length === 1 ? [] : [{ ...p, datasets: p.datasets.filter((d) => !mine(d)) }])) } : {}),
    ...(o.nouns ? { nouns: Object.fromEntries(Object.entries(o.nouns).filter(([k]) => !mine(k))) } : {}),
    ...(o.aside ? { aside: Object.fromEntries(Object.entries(o.aside).filter(([k]) => !mine(k))) } : {}),
  };
  // What was the source's alone leaves nothing behind: an emptied list or map goes with it.
  if (ontology?.rows && !ontology.rows.length) delete ontology.rows;
  if (ontology?.aside && !Object.keys(ontology.aside).length) delete ontology.aside;
  if (ontology?.nouns && !Object.keys(ontology.nouns).length) delete ontology.nouns;
  if (ontology?.properties && !ontology.properties.length) delete ontology.properties;
  return {
    ...doc,
    sources: doc.sources.filter((s) => !mine(s.id)),
    ...(ontology ? { ontology } : {}),
    notebooks: left ? notebooks.map((n, i) => (i === at ? { ...n, source: kept.join('\n') } : n)) : notebooks.filter((_, i) => i !== at),
  };
}

// ------------------------------------------------------------------ a flow brought up to format 5

/**
 * A document with what one row of a source is called (ADR 0027 §4): its noun, which says what one row is where the
 * ontology has no kind of thing or rows entry for the file. What a flow in an older format is asked before the
 * ontology comes first for it. A noun is display: no plan and no verdict reads it, so nothing is run again.
 */
export function withRowSaid(doc: FlowDocument, source: string, row: { one: string; many: string }): FlowDocument {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  const id = doc.sources.find((s) => lower(s.id) === lower(source))?.id ?? source;
  return { ...doc, ontology: { ...o, nouns: { ...(o.nouns ?? {}), [id]: { one: row.one.trim(), many: row.many.trim() } } } };
}

/** Why what one row of a source is can't be said so, each in a sentence; none, and it can. */
export function rowProblems(doc: Pick<FlowDocument, 'sources'>, source: string, row: { one: string; many: string }): string[] {
  const out: string[] = [];
  const noun = (x: string) => x.trim() !== '' && x.trim().split(/\s+/).length <= 2;
  if (!doc.sources.some((s) => lower(s.id) === lower(source))) out.push(`${source} isn’t a file of this flow`);
  if (!row.one.trim() || !row.many.trim()) out.push('Say what one row is: one of them, and many');
  else if (!noun(row.one) || !noun(row.many)) out.push('Say what one row is in a word or two: “vendor” and “vendors”');
  return out;
}

// ------------------------------------------------------------------ describe it first

/** A described column and the file's column read as it: the same name, a close one, or none. */
export interface AwaitedMatch {
  column: string;
  /** The file's column read as it; null where the file has none that reads as it. */
  from: string | null;
  /** How it was found: the same name, or a close one (`namesClose`), which a person confirms. */
  by: 'name' | 'close' | null;
}

/**
 * A file's columns mapped onto a description written ahead of it (ADR 0027 §5): each described column takes the
 * file's column of its name (in any case), else the one file column whose name is close and that no described column
 * has by name. A described column the file has nothing for is said so: the file isn't that dataset until every
 * described column is read from one of its own.
 */
export function matchAwaited(awaited: AwaitedDataset, read: FileRead): AwaitedMatch[] {
  const names = read.columns.map((c) => c.name);
  const exact = new Map(awaited.columns.map((c) => [lower(c.column), names.find((n) => lower(n) === lower(c.column)) ?? null] as const));
  const used = new Set([...exact.values()].filter((x): x is string => x !== null).map(lower));
  return awaited.columns.map((c): AwaitedMatch => {
    const same = exact.get(lower(c.column)) ?? null;
    if (same !== null) return { column: c.column, from: same, by: 'name' };
    const close = names.filter((n) => !used.has(lower(n)) && namesClose(n, c.column));
    if (close.length !== 1) return { column: c.column, from: null, by: null };
    used.add(lower(close[0]!));
    return { column: c.column, from: close[0]!, by: 'close' };
  });
}

/**
 * The source a description written ahead asks for, from a file and the mapping a person confirmed (`map`: described
 * column to the file's): the dataset's name, what one row is and its key as described; each described column typed by
 * the file's column it is read from; the file's other columns left to describe or set aside. A described column with
 * nothing mapped is left out, and `awaitedProblems` says so.
 */
export function specOfAwaited(awaited: AwaitedDataset, read: FileRead, map: Readonly<Record<string, string | null>>): SourceSpec {
  const byName = new Map(read.columns.map((c) => [lower(c.name), c] as const));
  const taken = new Set<string>();
  const described: SourceColumn[] = awaited.columns.flatMap((c) => {
    const from = map[c.column] ?? null;
    const f = from !== null ? byName.get(lower(from)) : undefined;
    if (!f) return [];
    taken.add(lower(f.name));
    // A name that differs only in its case is the same column to the engine: nothing to read as another.
    return [{ column: c.column, type: f.type, description: c.description, ...(c.title ? { title: c.title } : {}), ...(lower(f.name) !== lower(c.column) ? { fromFile: f.name } : {}) }];
  });
  const others: SourceColumn[] = read.columns.filter((c) => !taken.has(lower(c.name))).map((c) => ({ column: c.name, type: c.type }));
  // In the file's order, the described ones where their file columns stand.
  const order = new Map(read.columns.map((c, i) => [lower(c.name), i] as const));
  const columns = [...described, ...others].sort((a, b) => order.get(lower(a.fromFile ?? a.column))! - order.get(lower(b.fromFile ?? b.column))!);
  return { id: awaited.id, description: awaited.description ?? '', row: { ...awaited.row }, key: [...awaited.key], columns };
}

/** What stops a file being bound to a description written ahead, beside what stops any source: a described column the
 * file has nothing for, or two described columns read from one of the file's. */
export function awaitedProblems(awaited: AwaitedDataset, map: Readonly<Record<string, string | null>>): string[] {
  const out: string[] = [];
  const missing = awaited.columns.filter((c) => !map[c.column]).map((c) => c.column);
  if (missing.length) out.push(`The file has no column read as ${listed(missing)}: every described column is read from one of the file’s`);
  const from = awaited.columns.flatMap((c) => (map[c.column] ? [lower(map[c.column]!)] : []));
  const twice = [...new Set(from.filter((f, i) => from.indexOf(f) !== i))];
  if (twice.length) out.push(`${listed(twice)} would be read as two described columns`);
  return out;
}

/** The datasets described ahead that still wait for data (Q-255): those no source or step of the flow is yet. */
export function waitingForData(doc: Pick<FlowDocument, 'sources' | 'steps' | 'ontology'>): AwaitedDataset[] {
  const have = new Set([...doc.sources, ...doc.steps].map((x) => lower(x.id)));
  return awaitedOf(doc.ontology).filter((a) => !have.has(lower(a.id)));
}

/** The columns a source added here set aside, as its description keeps them. */
export const asideOfSource = (doc: Pick<FlowDocument, 'ontology'>, id: string): string[] => asideOf(doc.ontology, id);
