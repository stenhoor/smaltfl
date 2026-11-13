/**
 * Sources snapshotted ahead of their run (ADR 0019 amendment 2). The page asks the engine to snapshot a plan's sources as
 * soon as their files are pinned (the plugin's `prepare`), while it tells the day's claims, and the run takes each
 * snapshot instead of copying and hashing the file again; a measure or a sample before the run reads it too. A
 * snapshot of an external table over a pinned file is the file's rows, in the file's order, as the table's definition
 * decodes them: the same bytes (by their sha256) through the same definition are the same snapshot. So one is taken
 * only for a table that still reads a pinned file with the sha256 it was made from, through the same definition, and
 * only while its version is stored; and by one run alone.
 */
import type { Database } from 'smaltdb/engine';
import type { SourceFile } from '../core/manifest.js';
import type { Column } from '../core/plan.js';
import { PINNED_PREFIX, pinned, pinnedLocation } from './pinned.js';
import { findVersion } from './store.js';

/** A snapshot as the run's own: its key, table, content hash, rows, columns, and the pinned file it read. */
export interface PreparedSnapshot {
  key: string;
  table: string;
  content: string;
  rows: number;
  schema: Column[];
  reused: boolean;
  file?: SourceFile;
}

interface Entry {
  snap: PreparedSnapshot;
  /** The sha256 of the pinned bytes it was read from, and the table's definition then. */
  sha256: string;
  definition: string;
  /** How long it took, for the run's timings. */
  ms: number;
}

/** By database (a process may hold several engines), then by source table. */
const preparedBy = new WeakMap<Database, Map<string, Entry>>();
const preparedIn = (db: Database): Map<string, Entry> => {
  let m = preparedBy.get(db);
  if (!m) preparedBy.set(db, (m = new Map()));
  return m;
};

/** A table's definition as the engine keeps it. */
function definitionOf(db: Database, table: string): string {
  return String(db.query('SELECT sql FROM sqlite_schema WHERE lower(name) = lower(?)', [table]).rows[0]?.[0] ?? '');
}

/** The sha256 of the pinned file a source table reads, or null when it reads none (or not as a source may). */
export function pinnedSha(db: Database, table: string): string | null {
  try {
    const location = pinnedLocation(db, table);
    return location ? (pinned(location.slice(PINNED_PREFIX.length))?.sha256 ?? null) : null;
  } catch {
    return null;
  }
}

/** Keep a source's snapshot for its run, with the pinned bytes and definition it was made from. */
export function keepPrepared(db: Database, table: string, snap: PreparedSnapshot, ms: number): boolean {
  const sha256 = pinnedSha(db, table);
  if (!sha256) return false;
  preparedIn(db).set(table.toLowerCase(), { snap, sha256, definition: definitionOf(db, table), ms });
  return true;
}

/**
 * The snapshot prepared for a table, while it still holds: the table reads a pinned file with the same sha256, through
 * the same definition, and the snapshot's version is stored. `take` hands it to a run, which alone may have it; one that
 * no longer holds is forgotten.
 */
export function preparedFor(db: Database, table: string, take: boolean): { snap: PreparedSnapshot; ms: number } | null {
  const name = table.toLowerCase();
  const prepared = preparedBy.get(db);
  const e = prepared?.get(name);
  if (!prepared || !e) return null;
  const holds = pinnedSha(db, table) === e.sha256 && definitionOf(db, table) === e.definition && findVersion(db, e.snap.key) !== null;
  if (take || !holds) prepared.delete(name);
  return holds ? { snap: structuredClone(e.snap), ms: e.ms } : null;
}
