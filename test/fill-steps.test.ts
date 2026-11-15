/**
 * A fill on a flow that watches a step (ADR 0023 §5, ADR 0013 §4): the derived run builds the step again from the filled
 * rows, so the engine tells the step's claim of them, as a day's own run tells it, under the held run's flow hash (C4);
 * its measures are kept with the derived run, verify reads them from there, and the fill is released by the decision on
 * each held load. Larkspur's evidence feeds are filled this way, its posture watched downstream of them.
 */
import { describe, expect, it } from 'vitest';
import type { Database } from 'smaltdb/engine';
import { canonicalJSON } from '../src/core/canonical.js';
import { insertAfter, type FlowDocument } from '../src/core/document.js';
import { repairDocument, type Repair } from '../src/core/fill.js';
import { sha256Hex, utf8 } from '../src/core/hash.js';
import { heldLoadsOf, type HistoryRef, type StoryClaim2 } from '../src/core/hold.js';
import type { HistoryFile } from '../src/core/history.js';
import { appendPeriods, emptyHistory, settingsFor, tailBefore, type Measures } from '../src/core/measures.js';
import { loadClaim, measureLoad, pinFile, releaseRun, runFlow, tailPath, translate, verifyRun, type RunResult } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';

const MON = '2024-03-04';
const TUE = '2024-03-05';
const LEAF = 'e'.repeat(64);
const apps = Array.from({ length: 40 }, (_, i) => `app-${String(i + 1).padStart(2, '0')}`);
/** A day's snapshot: one row an application, the first `failing` failing; or every status the export got wrong. */
const snapshot = (failing: number, status?: string): [string, string][] => apps.map((a, i) => [a, status ?? (i < failing ? 'fail' : 'pass')]);

/** A flow that watches its daily snapshot and the step that counts it by status, the snapshot read through its fill. */
const flow = (): FlowDocument => insertAfter({
  smaltfl: 3, id: 'day-controls', name: 'Day controls',
  parameters: [{ name: 'day', type: 'text', default: null }],
  sources: [{ id: 'snap', table: 'day_snap' }],
  steps: [
    { id: 'snap_valid', kind: 'expectations', inputs: ['snap'], rules: [{ name: 'has_app', check: 'app_id IS NOT NULL', onFail: 'drop' }], maxDropped: 0.1 },
    { id: 'by_status', kind: 'aggregate', inputs: ['snap_valid'], groupBy: [{ name: 'status', expr: 'status' }], measures: [{ name: 'apps', expr: 'count(*)' }, { name: 'filled_from', expr: 'max(filled_from)' }], dataset: {} },
  ],
  ontology: { objectTypes: [], linkTypes: [], actionTypes: [] },
  publish: { hold: ['checks', 'wrong'], period: 'day', watch: { snap: { history: 'history.snap.json', pattern: 'none', count: ['status'] }, by_status: { history: 'history.by_status.json', pattern: 'none', count: ['status'] } } },
}, 'snap', { id: 'snap_filled', kind: 'fill', inputs: ['snap'], shift: [] });

function load(db: Database, table: string, rows: [string, string][]): void {
  db.exec(`DELETE FROM ${table}`);
  const t = db.prepare(`INSERT INTO ${table} VALUES (?, ?)`);
  for (const r of rows) t.run(r);
}
const plusDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const keysOf = (r: RunResult) => Object.fromEntries(Object.entries(r.manifest.outputs).map(([n, o]) => [n, o.key]));
const fails = (v: Awaited<ReturnType<typeof verifyRun>>) => v.checks.filter((c) => !c.ok).map((c) => `${c.origin}:${c.check}${c.note ? ` (${c.note})` : ''}`);

describe('a fill on a flow that watches a step built from the filled file (ADR 0023 §5)', () => {
  it('tells the step again of the filled rows, verifies, and is released by the decision on each held load', async () => {
    const db = openEngine();
    try {
      db.exec('CREATE TABLE day_snap(app_id TEXT, status TEXT)');
      db.exec('CREATE TABLE day_snap_donor(app_id TEXT, status TEXT)');
      const doc = flow();
      // The same flow with nothing watched or held: how the step's base is built, a run of each base day.
      const bare: FlowDocument = { ...doc, smaltfl: 1 };
      delete bare.publish;
      const settingsOf = async (day: string, w: string, base: HistoryFile | null) => {
        const plan = await translate(doc, { day });
        const s = settingsFor(plan, plan.nodes.findIndex((n) => n.origin === w), base, doc.steps)!;
        return { plan, s: base ? s : { ...s, counted: ['status'], followed: [], paired: [] } };
      };

      // Four weeks measured into each watch's base: the snapshot as it arrived, the step from a run of the flow on it.
      const periods: Record<string, Measures[]> = { snap: [], by_status: [] };
      for (let day = '2024-02-05', k = 0; day <= '2024-03-03'; day = plusDays(day, 1), k++) {
        load(db, 'day_snap', snapshot(5 + (k % 3)));
        periods.snap!.push(await measureLoad(db, 'day_snap', (await settingsOf(day, 'snap', null)).s));
        await runFlow(db, bare, { smaltdb: SMALTDB, parameters: { day } });
        periods.by_status!.push(await measureLoad(db, 'by_status', (await settingsOf(day, 'by_status', null)).s));
      }
      const bases: Record<string, HistoryFile> = {};
      const refs: Record<string, HistoryRef> = {};
      for (const w of ['snap', 'by_status']) {
        const m0 = periods[w]![0]!;
        bases[w] = appendPeriods(emptyHistory({ flow: doc.id, source: w, settings: { checks: m0.checks, counted: ['status'], followed: [], paired: [], time: null, zone: null, sample: 2000 }, columns: m0.columns, types: m0.types, kinds: m0.kinds, warmup: 7 }), periods[w]!);
        const bytes = utf8(JSON.stringify(bases[w]));
        refs[w] = { path: `history.${w}.json`, sha256: await sha256Hex(bytes), bytes: bytes.byteLength };
        await pinFile(db, refs[w]!.path, bytes, refs[w]!.sha256);
      }
      const tails: Record<string, Measures[]> = { snap: [], by_status: [] };
      const pinTail = async (w: string) => pinFile(db, tailPath(w), tails[w]!.length ? utf8(canonicalJSON(tailBefore(tails[w]!, '9999') as unknown as Parameters<typeof canonicalJSON>[0])) : null);
      const claimOf = async (day: string, table = 'day_snap'): Promise<StoryClaim2> => {
        const { plan, s } = await settingsOf(day, 'snap', bases.snap!);
        const t = await loadClaim({ doc, source: 'snap', flow: plan.flow.hash, base: bases.snap!, baseRef: refs.snap!, tail: tails.snap!, measures: await measureLoad(db, table, s), settings: s, skip: [], build: 'dev' });
        return t!.claim;
      };
      const tell = { by_status: { skip: [], levels: [] } };
      /** A day as it arrives: its claim told, the tails pinned, the flow run, its measures appended to the tails. */
      const arrive = async (day: string, rows: [string, string][]) => {
        load(db, 'day_snap', rows);
        await pinTail('snap');
        await pinTail('by_status');
        const claim = await claimOf(day);
        const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day }, claims: [claim], tell });
        for (const m of r.measures ?? []) tails[m.source]?.push(m);
        return { r, claim };
      };

      const mon = await arrive(MON, snapshot(6));
      expect(mon.r.holds).toEqual([]);
      expect(mon.r.told?.map((c) => [c.source, c.state])).toEqual([['by_status', 'calm']]);
      // Tuesday's export wrote every status as unknown: the file and the step built from it both hold.
      const tue = await arrive(TUE, snapshot(0, 'unknown'));
      expect(tue.claim.state).toBe('wrong');
      expect(tue.r.holds.map((h) => [h.by, h.origin]).sort()).toEqual([['story', 'by_status'], ['story', 'snap']]);

      // Filled whole from Monday: the derived run tells the step again, of Monday's rows carried in.
      load(db, 'day_snap_donor', snapshot(6));
      await pinTail('snap');
      await pinTail('by_status');
      const donor = { ...(await claimOf(MON, 'day_snap_donor')), source: 'snap_donor' };
      const repair: Repair = { kind: 'fill', step: 'snap_filled', source: 'snap', missing: { all: true }, donor: { rule: 'nearest', direction: 'before', day: MON, file: { path: 'loads/none', sha256: '0'.repeat(64), bytes: 0 }, claim: donor as never } };
      const derived = await runFlow(db, repairDocument(doc, repair), { smaltdb: SMALTDB, parameters: { day: TUE }, claims: [tue.claim, donor], tell, stage: true, from: { run: tue.r.run, manifest: tue.r.hash } });
      // Its file still held by the day's own claim; the step told of the filled rows, calm, under the held run's flow.
      expect(derived.holds.map((h) => [h.by, h.origin])).toEqual([['story', 'snap']]);
      expect(derived.told?.map((c) => [c.source, c.state, c.flow])).toEqual([['by_status', 'calm', tue.r.manifest.flow.hash]]);
      expect(derived.derived?.holds.map((h) => h.by)).toEqual(['derived']);
      expect(fails(await verifyRun(db, derived.run, { smaltdb: SMALTDB, manifest: derived.hash }))).toEqual([]);

      // Each held load is decided (Q-193), and the fill is released by the decision about the file it fills: a fill is
      // about one load, the step's day following from it. Readers get Monday's statuses on Tuesday, marked.
      const node = derived.manifest.nodes.find((n) => n.origin === 'snap_donor')!;
      const asRead: Repair = { ...repair, donor: { ...repair.donor!, file: { path: 'day_snap_donor', sha256: node.content!, bytes: node.rows! } } };
      expect(heldLoadsOf(tue.r.holds).map((l) => l.source).sort()).toEqual(['by_status', 'snap']);
      const fileLoad = heldLoadsOf(tue.r.holds).find((l) => l.source === 'snap')!;
      const decision = { load: fileLoad, option: 'fill' as const, actor: 'owner', reason: 'The export wrote every status as unknown', decision: LEAF };
      const both = heldLoadsOf(tue.r.holds).map((load) => ({ ...decision, load }));
      const release = (loads: typeof both) => releaseRun(db, { run: derived.run, manifest: derived.hash, keys: keysOf(derived), option: 'fill', actor: 'owner', reason: decision.reason, decision: LEAF, from: { run: tue.r.run, manifest: tue.r.hash }, repair: asRead, loads });
      // The step's load the held run read isn't the derived run's: its rows were built again from the fill.
      expect((await release(both)).why).toMatch(/^run \d+ didn't read by_status's 2024-03-05 load/);
      const out = await release([decision]);
      expect(out.why).toBeNull();
      expect(out).toMatchObject({ outcome: 'applied', published: ['by_status'], filled: apps.length });
      expect(db.query('SELECT status, apps, filled_from FROM by_status ORDER BY status').rows).toEqual([['fail', 6, MON], ['pass', 34, MON]]);
      expect(fails(await verifyRun(db, derived.run, { smaltdb: SMALTDB, manifest: derived.hash }))).toEqual([]);
    } finally {
      db.close();
    }
  }, 120_000);
});
