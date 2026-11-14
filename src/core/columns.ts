/**
 * Columns that change (ADR 0022 §2; Q-109, Q-146, Q-203 to Q-206): a daily file's header against the columns its source
 * declares. A declared column the file lacks is gone; a column the file has that nothing declares is new. Where a new
 * column plainly stands for a gone one, by its name, its type and its values (Q-203), the change suggests reading it as
 * that one; where it can't tell, it says so. A file with nothing gone and something new is noted, not held (Q-204).
 *
 * Pure: the runtime reads the file's bytes and the history, the app words what it found.
 */

/** How a CSV file is written: its delimiter and quote, as its source's table reads it. */
export interface CsvShape {
  delimiter?: string;
  quote?: string;
}

/**
 * A CSV text's records, each its fields as written (a quoted field unquoted, its doubled quotes single), up to `limit`
 * records. A quoted field may hold the delimiter and line breaks; CRLF and LF both end a record.
 */
export function csvRecords(text: string, shape: CsvShape = {}, limit = Infinity): string[][] {
  const delimiter = shape.delimiter ?? ',';
  const quote = shape.quote ?? '"';
  const out: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  let started = false;
  const endField = () => {
    record.push(field);
    field = '';
    started = false;
  };
  for (let i = 0; i < text.length && out.length < limit; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === quote) {
        if (text[i + 1] === quote) {
          field += quote;
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === quote && !started && field === '') {
      quoted = true;
      started = true;
    } else if (c === delimiter) endField();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endField();
      if (!(record.length === 1 && record[0] === '')) out.push(record);
      record = [];
    } else {
      field += c;
      started = true;
    }
  }
  if (out.length < limit && (field !== '' || record.length > 0)) {
    endField();
    out.push(record);
  }
  return out;
}

/** A file's header: its first record's fields, trimmed. Empty for an empty file. */
export function csvHeader(text: string, shape: CsvShape = {}): string[] {
  return (csvRecords(text, shape, 1)[0] ?? []).map((f) => f.trim());
}

/** A column's values in a CSV text with a header, by its name in the header (any case): null for an empty field. */
export function csvColumn(text: string, column: string, shape: CsvShape = {}, limit = 5000): (string | null)[] {
  const records = csvRecords(text, shape, limit + 1);
  const at = (records[0] ?? []).findIndex((f) => f.trim().toLowerCase() === column.toLowerCase());
  if (at < 0) return [];
  return records.slice(1).map((r) => (r[at] === undefined || r[at] === '' ? null : r[at]!));
}

/** What kind of values a column holds, as far as telling one column from another goes. */
export type TypeFamily = 'integer' | 'number' | 'time' | 'boolean' | 'text';

/** A declared SQL type's family: INTEGER, REAL or DOUBLE, DATE or TIMESTAMP, BOOLEAN, else text. */
export function familyOf(declared: string): TypeFamily {
  const t = declared.toUpperCase();
  if (/INT/.test(t)) return 'integer';
  if (/REAL|DOUB|FLOA|NUM|DEC/.test(t)) return 'number';
  if (/DATE|TIME/.test(t)) return 'time';
  if (/BOOL/.test(t)) return 'boolean';
  return 'text';
}

const INTEGER = /^[+-]?\d+$/;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const TIME = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const BOOLEAN = /^(true|false)$/i;

/** The family a column's values read as: the narrowest every value fits, null with no values to go by. */
export function inferFamily(values: readonly (string | null)[]): TypeFamily | null {
  const seen = values.filter((v): v is string => v !== null && v.trim() !== '').map((v) => v.trim());
  if (!seen.length) return null;
  if (seen.every((v) => INTEGER.test(v))) return 'integer';
  if (seen.every((v) => NUMBER.test(v))) return 'number';
  if (seen.every((v) => TIME.test(v))) return 'time';
  if (seen.every((v) => BOOLEAN.test(v))) return 'boolean';
  return 'text';
}

/** Whether a gone column's declared family and a new column's values agree: a text column holds codes and ids that
 * read as numbers, and a number column whole numbers. */
export function familiesAgree(declared: TypeFamily, inferred: TypeFamily | null): boolean {
  if (inferred === null) return true;
  if (declared === inferred) return true;
  if (declared === 'text') return inferred === 'integer';
  if (declared === 'number') return inferred === 'integer';
  return false;
}

/** A name's words: split at spaces, underscores, hyphens, dots and lower-to-upper case turns, lowercased. */
export function wordsOf(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_\-.]+/)
    .filter(Boolean);
}

/** The edit distance between two strings (Levenshtein), stopping once it passes `cap`. */
export function editDistance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      best = Math.min(best, v);
    }
    if (best > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

/**
 * Whether two column names are close (Q-203): the same words once case, spaces, underscores, hyphens and dots are set
 * aside ("CustomerID", "customer_id"), or a letter or two apart ("custmer_id"). Short names need a closer match: two
 * letters apart only from five letters on, one from three.
 */
export function namesClose(a: string, b: string): boolean {
  const wa = wordsOf(a);
  const wb = wordsOf(b);
  const na = wa.join('');
  const nb = wb.join('');
  if (na === nb) return true;
  if (wa.length === wb.length && [...wa].sort().join(' ') === [...wb].sort().join(' ')) return true;
  const d = editDistance(na, nb, 2);
  const short = Math.min(na.length, nb.length);
  return (d <= 2 && short >= 5) || (d <= 1 && short >= 3);
}

/** A new column read as a gone one, with what told them apart from any other pair: its name, its type and, where the
 * gone column has a history of its values, the share of the new column's values seen there. */
export interface ColumnMap {
  /** The new column, as the file names it. */
  from: string;
  /** The gone column, as the source declares it. */
  to: string;
  by: ('name' | 'type' | 'values')[];
  /** The share of the new column's values the gone column's history has seen; null with no history to go by. */
  share: number | null;
}

/** A file's columns against its source's (ADR 0022 §2). */
export interface HeaderChange {
  /** Declared columns the file lacks, but those a mapping reads. */
  gone: string[];
  /** The file's columns nothing declares, but those a mapping reads. */
  added: string[];
  /** A new column read as a gone one (Q-203). */
  maps: ColumnMap[];
}

/** Whether a file's columns hold its day (Q-109, Q-204): a declared column is gone, or would be read from a new one. */
export const columnsHold = (c: HeaderChange): boolean => c.gone.length > 0 || c.maps.length > 0;

/** Most of a new column's values, seen in a gone column's history, make it that column (Q-203). */
export const MAP_SHARE = 0.5;

/**
 * A file's header against its source's declared columns (Q-109, Q-146, Q-203). Names match whatever their case, as the
 * engine reads them. Each new column is offered to each gone one, the closest first; a pair is a mapping when its names
 * are close, its types agree and, where the gone column has a history of its values, most of the new column's values
 * were seen there. A new column that maps to nothing, and a gone one nothing maps to, stay as they are.
 */
export function columnChange(
  declared: readonly (readonly [string, string])[],
  header: readonly string[],
  evidence: { history?: (column: string) => readonly string[] | undefined; today?: (column: string) => readonly (string | null)[] } = {},
): HeaderChange {
  const has = new Set(header.map((h) => h.toLowerCase()));
  const named = new Set(declared.map(([n]) => n.toLowerCase()));
  const gone = declared.filter(([n]) => !has.has(n.toLowerCase()));
  const added = header.filter((h) => h !== '' && !named.has(h.toLowerCase()));
  const pairs: (ColumnMap & { d: number })[] = [];
  for (const a of added) {
    if (!gone.length) break;
    const today = evidence.today?.(a) ?? [];
    const inferred = inferFamily(today);
    for (const [g, type] of gone) {
      if (!namesClose(a, g)) continue;
      if (!familiesAgree(familyOf(type), inferred)) continue;
      const seen = evidence.history?.(g);
      let share: number | null = null;
      if (seen && seen.length) {
        const set = new Set(seen);
        const vals = today.filter((v): v is string => v !== null);
        share = vals.length ? vals.filter((v) => set.has(v)).length / vals.length : null;
        if (share !== null && share < MAP_SHARE) continue;
      }
      const by: ColumnMap['by'] = ['name', 'type', ...(share !== null ? (['values'] as const) : [])];
      pairs.push({ from: a, to: g, by, share, d: editDistance(wordsOf(a).join(''), wordsOf(g).join(''), 9) });
    }
  }
  // The best evidence first: values seen, then the closest names; each column in one mapping at most.
  pairs.sort((x, y) => (y.share ?? -1) - (x.share ?? -1) || x.d - y.d || x.from.localeCompare(y.from));
  const maps: ColumnMap[] = [];
  const taken = new Set<string>();
  for (const p of pairs) {
    if (taken.has(`f:${p.from.toLowerCase()}`) || taken.has(`t:${p.to.toLowerCase()}`)) continue;
    taken.add(`f:${p.from.toLowerCase()}`).add(`t:${p.to.toLowerCase()}`);
    maps.push({ from: p.from, to: p.to, by: p.by, share: p.share });
  }
  return {
    gone: gone.map(([n]) => n).filter((n) => !taken.has(`t:${n.toLowerCase()}`)),
    added: added.filter((a) => !taken.has(`f:${a.toLowerCase()}`)),
    maps,
  };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** Why a mapping was suggested, in words: "its name and type", "its name, type and 97% of its values". */
export function mapWhy(m: ColumnMap): string {
  return m.share !== null ? `its name, type and ${pct(m.share)} of its values` : 'its name and type';
}

/**
 * A file's column change in words (Q-146): "customer_id is gone and cust_id is new: cust_id looks like customer_id (its
 * name and type)"; a gone column nothing stands for, "region is gone"; a new one that stands for nothing it can tell,
 * "can't tell why zone_ref is new"; nothing gone, "a new column: notes". Empty when nothing changed.
 */
export function columnChangeSaid(c: HeaderChange): string {
  const parts: string[] = [];
  for (const m of c.maps) parts.push(`${m.to} is gone and ${m.from} is new: ${m.from} looks like ${m.to} (${mapWhy(m)})`);
  if (c.gone.length) parts.push(`${list(c.gone)} ${c.gone.length === 1 ? 'is' : 'are'} gone`);
  if (c.added.length) parts.push(columnsHold(c) ? `can't tell why ${list(c.added)} ${c.added.length === 1 ? 'is' : 'are'} new` : `${c.added.length === 1 ? 'a new column' : 'new columns'}: ${list(c.added)}`);
  return parts.join('; ');
}
