/**
 * Two versions of a day compared (ADR 0021 §4, Q-187).
 *
 * - **The summary**, from the two runs' manifests alone, so it needs no engine and no run here: the files each read and
 *   which differ, whether the same plan ran (the flow, and the rules in force with it), and each output's rows in each
 *   and whether its content changed (content hashes are exact, so the same hash is the same rows).
 * - **An output's rows**: matched by the output's key (its gate's reconciliation key, else its contract's key columns),
 *   else as whole rows, each counted on each side (`diffKeyOf`; the statements are emit.ts `emitDiff`, their answers
 *   read here by `diffOf`).
 */
import type { FlowDocument } from './document.js';
import { writtenRules } from './gates.js';
import type { RunManifest } from './manifest.js';

/** What the summary reads of a run: its plan, its nodes (the sources' files) and its outputs. */
export type ManifestSide = Pick<RunManifest, 'plan' | 'nodes' | 'outputs'>;

/** A source's file as a run read it: its sha256, its rows (none where the engine refused it), and whether it did. */
export interface FileSide {
  sha256: string;
  rows: number | null;
  refused: boolean;
}

/** A source whose file differs between the two versions, as each read it (null: it read none). */
export interface FileChange {
  source: string;
  a: FileSide | null;
  b: FileSide | null;
}

/** An output as a run built it: its rows and its content hash. */
export interface OutputSide {
  rows: number;
  content: string;
}

/** An output in each version (null: not built), and whether its content changed. */
export interface OutputChange {
  name: string;
  a: OutputSide | null;
  b: OutputSide | null;
  changed: boolean;
}

/** Two versions' summary (ADR 0021 §4). */
export interface CompareSummary {
  /** The sources whose files differ, in the order the plans read them; how many read the same file. */
  files: FileChange[];
  same: number;
  /** The plans' hashes, where they differ: another flow, or other rules in force. */
  plan: { a: string; b: string } | null;
  /** Every output either built, those that changed first, then by name. */
  outputs: OutputChange[];
  /** How many outputs changed. */
  changed: number;
}

const filesOf = (m: ManifestSide): Map<string, FileSide> =>
  new Map(m.nodes.filter((n) => n.op === 'table').map((n) => [n.origin, { sha256: n.file?.sha256 ?? n.content ?? '', rows: n.status === 'refused' ? null : (n.rows ?? null), refused: n.status === 'refused' }]));

/** Two versions' summary, from their runs' manifests: `a` the one compared, `b` the one it is compared with. */
export function compareSummary(a: ManifestSide, b: ManifestSide): CompareSummary {
  const fa = filesOf(a);
  const fb = filesOf(b);
  const files: FileChange[] = [];
  let same = 0;
  for (const source of new Set([...fa.keys(), ...fb.keys()])) {
    const x = fa.get(source) ?? null;
    const y = fb.get(source) ?? null;
    if (x && y && x.sha256 === y.sha256 && x.refused === y.refused) same++;
    else files.push({ source, a: x, b: y });
  }
  const side = (r: RunManifest['outputs'][string] | undefined): OutputSide | null => (r ? { rows: r.rows, content: r.content } : null);
  const outputs = [...new Set([...Object.keys(a.outputs), ...Object.keys(b.outputs)])]
    .map((name): OutputChange => {
      const x = side(a.outputs[name]);
      const y = side(b.outputs[name]);
      return { name, a: x, b: y, changed: !x || !y || x.content !== y.content };
    })
    .sort((p, q) => Number(q.changed) - Number(p.changed) || (p.name < q.name ? -1 : p.name > q.name ? 1 : 0));
  return { files, same, plan: a.plan === b.plan ? null : { a: a.plan, b: b.plan }, outputs, changed: outputs.filter((o) => o.changed).length };
}

/**
 * The columns an output's rows are matched by (ADR 0021 §4): its gate's reconciliation key, the gate cell's own or the
 * ontology's one row an object; else its contract's key columns; null where it has neither, and its rows are matched
 * whole.
 */
export function diffKeyOf(doc: Partial<Pick<FlowDocument, 'gates' | 'ontology' | 'contracts'>>, name: string): string[] | null {
  const reconcile = writtenRules(doc, name).reconcile;
  if (reconcile?.key.length) return [...reconcile.key];
  const contract = Object.entries(doc.contracts ?? {}).find(([id]) => id.toLowerCase() === name.toLowerCase())?.[1];
  const key = contract?.columns.filter((c) => c.key).map((c) => c.name) ?? [];
  return key.length ? key : null;
}

/** A cell that changed: its column, and its value in each version. */
export interface CellChange {
  column: string;
  a: unknown;
  b: unknown;
}

/**
 * An output's rows compared (ADR 0021 §4): how many rows are only in `a` (removed) or only in `b` (added); by key, the
 * keys on another number of rows in each (a repeat taken out or added) and the rows each such key has more of on each
 * side, the rows whose key is on one row in each and whose cells differ, and how many rows each column changed on; and
 * the first rows of each kind, by key (or by every column, for whole rows).
 */
export interface RowDiff {
  /** The columns compared (the samples' rows are these), and the key matched by (null: whole rows). */
  all: string[];
  key: string[] | null;
  removed: number;
  added: number;
  repeated: number;
  /** Rows more in `a` than in `b` by its repeated keys, and more in `b` than in `a`. */
  extraA: number;
  extraB: number;
  changed: number;
  /** Each column other than the key's, with the rows it changed on, the most first (only those that changed). */
  columns: { column: string; changed: number }[];
  samples: {
    removed: unknown[][];
    added: unknown[][];
    repeated: { key: unknown[]; a: number; b: number }[];
    changed: { key: unknown[]; cells: CellChange[] }[];
  };
}

/** What `emitDiff`'s statements answered: the counts' one row, and each sample's rows (none for a statement it lacks). */
export interface DiffAnswers {
  counts: readonly unknown[];
  removed: readonly (readonly unknown[])[];
  added: readonly (readonly unknown[])[];
  repeated?: readonly (readonly unknown[])[];
  changed?: readonly (readonly unknown[])[];
}

const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));

/** An output's rows compared, read from `emitDiff`'s answers over the same `columns` and `key`. */
export function diffOf(columns: readonly string[], key: readonly string[] | null, got: DiffAnswers): RowDiff {
  const k = key?.length ? [...key] : null;
  const rest = k ? columns.filter((c) => !k.some((x) => x.toLowerCase() === c.toLowerCase())) : [];
  const [removed, added, repeated, extraA, extraB, changed, ...perColumn] = got.counts.map(num);
  return {
    all: [...columns],
    key: k,
    removed: removed ?? 0,
    added: added ?? 0,
    repeated: repeated ?? 0,
    extraA: extraA ?? 0,
    extraB: extraB ?? 0,
    changed: changed ?? 0,
    columns: rest.map((column, i) => ({ column, changed: perColumn[i] ?? 0 })).filter((c) => c.changed > 0).sort((x, y) => y.changed - x.changed),
    samples: {
      removed: got.removed.map((r) => [...r]),
      added: got.added.map((r) => [...r]),
      repeated: k ? (got.repeated ?? []).map((r) => ({ key: r.slice(0, k.length), a: num(r[k.length]), b: num(r[k.length + 1]) })) : [],
      changed: k
        ? (got.changed ?? []).map((r) => ({
            key: r.slice(0, k.length),
            cells: rest.flatMap((column, i) => {
              const a = r[k.length + 2 * i];
              const b = r[k.length + 2 * i + 1];
              return sameValue(a, b) ? [] : [{ column, a, b }];
            }),
          }))
        : [],
    },
  };
}

/** Whether two cells hold the same value, as the engine's IS DISTINCT FROM would say. */
const sameValue = (a: unknown, b: unknown): boolean => (a === null || a === undefined ? b === null || b === undefined : b !== null && b !== undefined && String(a) === String(b));
