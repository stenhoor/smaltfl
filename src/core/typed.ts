/**
 * Types computed ahead (ADR 0019 amendment 2): a run types every step before it builds anything, each by compiling its
 * statement with everything before it folded onto the snapshots, which is most of a large flow's run (a hundred steps,
 * the gold ones each compiling every step above them). The types are a pure function of what is typed: the plan's
 * nodes as they stand once the snapshots are read (each source's columns in its node), the nodes the run needs, and
 * the engine and smaltfl versions. The build runs the first loads day once and keeps every node's columns under the
 * sha256 of exactly those (`typesKey`); the run takes them only when its own key is the same, and types every node
 * itself otherwise. A key that matches is the same typing on the same input, so the columns, every hash made from them
 * and the plan's hash are the ones the run would compute; the checks typing makes (a step only reads, reads no
 * external data, names each column once, reads only its inputs) were made by the build on the very same nodes.
 */
import { hashOf } from './hash.js';
import type { KeyEnv } from './keys.js';
import type { Column, FlowPlan } from './plan.js';

/** Where the page pins the types file for the engine. */
export const TYPES_PATH = 'types.json';

/** One typing: its key, and each needed node's columns but the snapshots', by node index. */
export interface TypesEntry {
  key: string;
  /** The day it was computed for, to say which loads it serves; never part of the match. */
  day?: string;
  schemas: [node: number, columns: Column[]][];
}

export interface TypesFile {
  format: 'smaltfl-types/0';
  entries: TypesEntry[];
}

/**
 * The key of a plan's typing: the nodes as they stand when typing starts (only the snapshots' columns filled in), the
 * nodes the run needs, in order, and what executes them.
 */
export function typesKey(plan: Pick<FlowPlan, 'nodes'>, needed: readonly number[], env: KeyEnv): Promise<string> {
  return hashOf('types/0', { nodes: plan.nodes, needed: [...needed], engine: { smaltdb: env.smaltdb, smaltfl: env.smaltfl } });
}

/** A types file, checked to be one: anything else is refused, never half taken. A column's type is the engine's static
 * type as typing returns it (which may be one a declared column folds onto `any`, such as `bool`). */
export function isTypesFile(v: unknown): v is TypesFile {
  const f = v as TypesFile;
  if (typeof f !== 'object' || f === null || f.format !== 'smaltfl-types/0' || !Array.isArray(f.entries)) return false;
  return f.entries.every((e) => typeof e === 'object' && e !== null && typeof e.key === 'string' && (e.day === undefined || typeof e.day === 'string') && Array.isArray(e.schemas)
    && e.schemas.every((s) => Array.isArray(s) && s.length === 2 && Number.isSafeInteger(s[0]) && Array.isArray(s[1])
      && s[1].every((c: unknown) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'string' && typeof c[1] === 'string' && c[1].length > 0)));
}

/**
 * The columns a types file gives for this typing: every needed node's but the snapshots', or null when the file has no
 * entry with this key or the entry leaves a needed node out (then nothing is taken: the run types every node itself).
 */
export function givenTypes(file: TypesFile, key: string, plan: Pick<FlowPlan, 'nodes'>, needed: readonly number[]): Map<number, Column[]> | null {
  const e = file.entries.find((x) => x.key === key);
  if (!e) return null;
  const m = new Map(e.schemas.map(([i, cols]) => [i, cols.map(([n, t]): Column => [n, t])]));
  for (const i of needed) if (plan.nodes[i]!.op !== 'table' && !m.has(i)) return null;
  return m;
}
