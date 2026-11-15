/**
 * A day filled whole, then corrected (ADR 0023 §5, scene 5): a daily snapshot with no time of day, held because its rows
 * arrived wrong (not short), is filled whole from the good day before it, every row carried forward and marked with the
 * day it came from; the fill is released and verified; two days later the corrected file arrives, waits for a decision
 * (Q-62, Q-183) and, published, replaces the fill, readers moving from the carried day to the day's own rows.
 */
import { describe, expect, it } from 'vitest';
import type { Database } from 'smaltdb/engine';
import { repairDocument, type Repair } from '../src/core/fill.js';
import { sha256Hex } from '../src/core/hash.js';
import { insertAfter, pinFile, releaseRun, runFlow, verifyRun, type FlowDocument, type ReleaseInput, type RunResult, type StoryClaim } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';

const MON = '2024-03-04'; // published, and the donor: the good day before
const TUE = '2024-03-05'; // its statuses all exported as unknown: wrong, though every row came
const LEAF = 'd'.repeat(64);

type Row = [app: string, status: string, asOf: string];
const apps = Array.from({ length: 40 }, (_, i) => `app-${String(i + 1).padStart(2, '0')}`);
/** A day's snapshot: one row an application, the first `failing` failing. */
const snapshot = (day: string, failing: number, status?: string): Row[] => apps.map((a, i) => [a, status ?? (i < failing ? 'fail' : 'pass'), day]);
const FILES = {
  mon: snapshot(MON, 6),
  wrong: snapshot(TUE, 0, 'unknown'),
  corrected: snapshot(TUE, 5),
};

function engine(): Database {
  const db = openEngine();
  db.exec('CREATE TABLE day_snap(app_id TEXT, status TEXT, as_of TEXT)');
  db.exec('CREATE TABLE day_snap_donor(app_id TEXT, status TEXT, as_of TEXT)');
  return db;
}
function load(db: Database, table: string, rows: Row[]): void {
  db.exec(`DELETE FROM ${table}`);
  const t = db.prepare(`INSERT INTO ${table} VALUES (?, ?, ?)`);
  for (const r of rows) t.run(r);
}

/** A fill with no time column (ADR 0023 §5): it names no hours; the donor's as_of is moved to the day it fills. */
const FILL = { id: 'snap_filled', kind: 'fill' as const, inputs: ['snap'], shift: ['as_of'] };
function flow(history: string): FlowDocument {
  const doc: FlowDocument = {
    smaltfl: 2, id: 'day-controls', name: 'Day controls',
    parameters: [{ name: 'day', type: 'text', default: null }],
    sources: [{ id: 'snap', table: 'day_snap' }],
    steps: [
      { id: 'snap_valid', kind: 'expectations', inputs: ['snap'], rules: [{ name: 'on_day', check: 'as_of = :day', onFail: 'drop' }], maxDropped: 0.1 },
      { id: 'by_status', kind: 'aggregate', inputs: ['snap_valid'], groupBy: [{ name: 'status', expr: 'status' }], measures: [{ name: 'apps', expr: 'count(*)' }, { name: 'filled', expr: 'count(filled_from)' }, { name: 'filled_from', expr: 'max(filled_from)' }], dataset: {} },
    ],
    publish: { hold: ['checks', 'wrong'], watch: { snap: history }, period: 'day' },
  };
  return insertAfter(doc, 'snap', structuredClone(FILL));
}

async function pinHistory(db: Database) {
  const path = `history-${Math.random().toString(36).slice(2)}.json`;
  const bytes = new TextEncoder().encode(JSON.stringify({ path }));
  const sha256 = await sha256Hex(bytes);
  await pinFile(db, path, bytes, sha256);
  return { path, sha256, bytes: bytes.byteLength };
}
const claimOf = (history: StoryClaim['history'], day: string, over: Partial<StoryClaim> = {}): StoryClaim => ({ by: 'story', source: 'snap', day, state: 'calm', below: false, head: 'A normal day', build: 'dev', history, rows: apps.length, ...over });
const WRONG = { state: 'wrong', below: false, head: 'Every status reads unknown' } as const;
const keysOf = (r: RunResult) => Object.fromEntries(Object.entries(r.manifest.outputs).map(([n, o]) => [n, o.key]));
const fails = (v: Awaited<ReturnType<typeof verifyRun>>) => v.checks.filter((c) => !c.ok).map((c) => `${c.origin}:${c.check}${c.note ? ` (${c.note})` : ''}`);
const current = (db: Database, name: string) => db.query('SELECT key FROM _smaltfl_datasets WHERE name = ?', [name]).rows[0]?.[0] ?? null;
const byStatus = (db: Database) => db.query('SELECT status, apps, filled, filled_from FROM by_status ORDER BY status').rows;

describe('a snapshot filled whole, then corrected (ADR 0023 §5)', () => {
  it('fills the day from the day before, every row marked, and the corrected file replaces the fill once decided', async () => {
    const db = engine();
    try {
      const history = await pinHistory(db);
      const doc = flow(history.path);
      load(db, 'day_snap', FILES.mon);
      const mon = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: MON }, claims: [claimOf(history, MON)] });
      expect(mon).toMatchObject({ holds: [], published: ['by_status'] });

      // Tuesday's statuses all arrived as unknown: every row came, so nothing is missing but the day is wrong.
      load(db, 'day_snap', FILES.wrong);
      const tue = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: TUE }, claims: [claimOf(history, TUE, WRONG)] });
      expect(tue.holds.map((h) => [h.by, h.origin])).toEqual([['story', 'snap']]);
      expect(tue.waiting).toEqual(['by_status']);
      expect(current(db, 'by_status')).toBe(mon.manifest.outputs.by_status!.key);

      // Filled forward, whole: Monday carried into Tuesday.
      load(db, 'day_snap_donor', FILES.mon);
      const donorClaim = claimOf(history, MON, { source: 'snap_donor' });
      const repair: Repair = { kind: 'fill', step: 'snap_filled', source: 'snap', missing: { all: true }, donor: { rule: 'nearest', direction: 'before', day: MON, file: { path: 'loads/none', sha256: '0'.repeat(64), bytes: 0 }, claim: donorClaim } };
      const d = repairDocument(doc, repair);
      const filled = await runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: TUE }, claims: [claimOf(history, TUE, WRONG), donorClaim], stage: true, from: { run: tue.run, manifest: tue.hash } });
      expect(filled.derived).toEqual({ holds: [{ by: 'derived', node: 2, origin: 'snap_filled', said: 'fills the whole day from 2024-03-04', reaches: ['by_status'] }], filled: apps.length });
      expect(filled.published).toEqual([]);

      const node = filled.manifest.nodes.find((n) => n.origin === 'snap_donor')!;
      const asRead: Repair = { ...repair, donor: { ...repair.donor!, file: { path: 'day_snap_donor', sha256: node.content!, bytes: node.rows! } } };
      const release: ReleaseInput = { run: filled.run, manifest: filled.hash, keys: keysOf(filled), option: 'fill', actor: 'owner', reason: 'The export bug mislabelled every status: Monday carries forward', decision: LEAF, from: { run: tue.run, manifest: tue.hash }, repair: asRead };
      expect(await releaseRun(db, release)).toMatchObject({ outcome: 'applied', published: ['by_status'], filled: apps.length });
      // Readers have Monday's statuses on Tuesday, every row marked as carried from Monday, its date moved to Tuesday's
      // (the check that a row is of its day passes them all).
      expect(byStatus(db)).toEqual([['fail', 6, 6, MON], ['pass', 34, 34, MON]]);
      expect(fails(await verifyRun(db, filled.run, { smaltdb: SMALTDB, manifest: filled.hash }))).toEqual([]);

      // Two days later the vendor sends Tuesday's file again, corrected: a later delivery of the day, held for a decision
      // though its checks pass; readers keep the fill meanwhile.
      load(db, 'day_snap', FILES.corrected);
      const again = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: TUE }, claims: [claimOf(history, TUE)], correction: { of: { run: tue.run, manifest: tue.hash }, sources: ['snap'] } });
      expect(again.holds.map((h) => [h.by, h.origin, h.said])).toEqual([['correction', 'snap', 'a later file for its day: it waits for a decision']]);
      expect(again.waiting).toEqual(['by_status']);
      expect(current(db, 'by_status')).toBe(filled.manifest.outputs.by_status!.key);
      expect(fails(await verifyRun(db, again.run, { smaltdb: SMALTDB, manifest: again.hash }))).toEqual([]);

      // Published as it came: the corrected file replaces the fill, nothing of it marked.
      const out = await releaseRun(db, { run: again.run, manifest: again.hash, keys: keysOf(again), option: 'asis', actor: 'owner', reason: 'The corrected file arrived', decision: '1'.repeat(64) });
      expect(out).toMatchObject({ outcome: 'applied', published: ['by_status'] });
      expect(current(db, 'by_status')).toBe(again.manifest.outputs.by_status!.key);
      expect(byStatus(db)).toEqual([['fail', 5, 0, null], ['pass', 35, 0, null]]);
      // Both still verify: the fill as what readers had until the correction, and the correction as what they have.
      expect(fails(await verifyRun(db, again.run, { smaltdb: SMALTDB, manifest: again.hash }))).toEqual([]);
      expect(fails(await verifyRun(db, filled.run, { smaltdb: SMALTDB, level: 'stored' }))).toEqual([]);
    } finally {
      db.close();
    }
  }, 60_000);
});
