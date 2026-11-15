/**
 * A flow's sources as the engine reads them (ADR 0010 §9): each source's binding, from the flow's data list (its folder's
 * `data.json`), names the external table the document's source reads, the file's format, its name next to the app, and
 * the columns a CSV declares. The engine reads each file registered with `@smaltdb/external` under its name, or pinned
 * by the smaltfl plugin (`pinnedDdl`). The app, the history builder and the tests use the same bindings.
 */

/** One source's binding: its table, the file's format and name, a CSV's header and columns; `context` for a source
 * the news tells as context (the weather). */
export interface Binding {
  table: string;
  format: 'parquet' | 'csv';
  file: string;
  header?: boolean;
  columns?: [name: string, type: string][];
  context?: 'weather';
}

/** A flow's data list of bindings, by source id. */
export interface DataBindings {
  smaltflData: 1;
  flow: string;
  sources: Record<string, Binding>;
  /** A generated example's generator (scripts/data/*.mjs) and its arguments: what writes its daily files. */
  generate?: string;
  generateArgs?: string[];
  /** The watched source or step the app's views follow (ADR 0013 §5), when it isn't the first daily source. */
  judged?: string;
  /** A generated example's recorded story (ADR 0021 §6, core/timeline.ts): its later deliveries, which the generator
   * writes, and its decisions, which the recorder takes at their times. */
  story?: string;
}

/** A source as the engine reads it: its file, its table, and the table's DDL. */
export interface ExampleSource {
  /** The registered file's name, also its name next to the app. */
  file: string;
  /** The external table the flow document's source names. */
  table: string;
  ddl: string;
}

/** Names a CREATE statement quotes: SQL words, and anything that isn't a plain name. */
const WORDS = new Set(['time', 'date', 'user', 'order', 'group', 'select', 'from', 'where', 'table', 'key', 'index', 'values']);
const column = (name: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !WORDS.has(name.toLowerCase()) ? name : `"${name.replace(/"/g, '""')}"`);

/** A binding's external table, reading `location` (its file registered under its name, by default). */
export function ddlOf(b: Binding, location = `file:${b.file}`, readAs: readonly (readonly [string, string])[] = []): string {
  // A column the file names otherwise (ADR 0022 §2, Q-146): declared by the file's name, which the run reads as the
  // column (the plan's table node's `readAs`, from the ontology's `readAsOf`).
  const fileName = (n: string) => readAs.find(([, c]) => c.toLowerCase() === n.toLowerCase())?.[0] ?? n;
  const cols = b.columns?.length ? `(${b.columns.map(([n, t]) => `${column(fileName(n))} ${t}`).join(', ')})` : '';
  const opts = [`location = '${location.replace(/'/g, "''")}'`, `format = '${b.format}'`, ...(b.header ? ['header = true'] : [])];
  return `CREATE EXTERNAL TABLE ${b.table}${cols} WITH (${opts.join(', ')})`;
}

/** A binding as the engine reads it. */
export const sourceOf = (b: Binding): ExampleSource => ({ file: b.file, table: b.table, ddl: ddlOf(b) });

/**
 * The same table, read from a file pinned in the engine by the smaltfl plugin (`pin`, ADR 0006 §3): the engine hashes
 * the bytes, refuses a mismatch, and records which file each run read. The app reads its sources this way.
 */
export const pinnedDdl = (src: ExampleSource | Binding, readAs: readonly (readonly [string, string])[] = []): string => ('ddl' in src ? src.ddl.replace(`'file:${src.file}'`, `'smaltfl:${src.file}'`) : ddlOf(src, `smaltfl:${src.file}`, readAs));

/**
 * The donor a fill reads (ADR 0009 amendment 1 S3, C8): another day's file of a source, pinned only when a fill needs
 * it, read through its own table made from the source's binding: `<table>_donor` over `<source>_donor.<format>`. A
 * derived document names it as the source `<source>_donor` (fill.ts donorSourceOf).
 */
export const donorBinding = (source: string, b: Binding): Binding => ({ ...b, table: `${b.table}_donor`, file: `${source}_donor.${b.format}`, context: undefined });

