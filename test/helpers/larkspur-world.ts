/**
 * The Larkspur estate (examples/larkspur/) through the engine, as the app runs it (ADR 0020): every watched file's
 * history built from the days before, then each day's files arriving one a day, each file measured and its claim told
 * as the page tells it, and the flow run on them. The claims told and the measures taken are kept, so a test can ask
 * what a watch said of a day that published as well as what held it.
 */
import { readFileSync } from 'node:fs';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../../src/plugin/index.js';
import { canonicalJSON } from '../../src/core/canonical.js';
import type { FlowDocument } from '../../src/core/document.js';
import { sha256Hex, utf8 } from '../../src/core/hash.js';
import type { HistoryFile } from '../../src/core/history.js';
import { flowStory, loadClaim, tailPath, type Claim, type HistoryRef, type StoryClaim2 } from '../../src/core/hold.js';
import type { Story } from '../../src/core/story.js';
import { appendPeriods, emptyHistory, settingsFor, tailBefore, watchColumns, type Measures } from '../../src/core/measures.js';
import type { RunResult } from '../../src/core/protocol.js';
import { measureLoad, pinFile, runFlow, translate } from '../../src/index.js';
import { pinnedDdl, type DataBindings } from '../../examples/sources.js';
import { addDays, csvOf, DAILY_FILES, dayFile, fixedFiles, larkspur, type Larkspur, type LarkspurOptions } from '../fixtures/larkspur.js';
import { SMALTDB } from './engine.js';
import { loadFlowDir } from './notebooks.js';

export const larkspurDir = new URL('../../examples/larkspur/', import.meta.url);

export interface LarkspurWorld {
  doc: FlowDocument;
  db: Database;
  estate: Larkspur;
  bases: Record<string, HistoryFile>;
  /** Each day's run, or the error that stopped it. */
  results: Map<string, RunResult | Error>;
  /** Each day's claims as the page told them, by file: null where the file couldn't be read as declared. */
  claims: Map<string, Record<string, StoryClaim2 | null>>;
  /** Each day's measures, and each file's story as the page told it (its head, its findings), by file. The ranges a
   * story was told from aren't kept: six months of history for twenty files a day is more than a test needs to hold. */
  measures: Map<string, Record<string, Measures>>;
  stories: Map<string, Record<string, Story>>;
  result(day: string): RunResult;
  close(): void;
}

/** A world: the histories from `baseFrom` to `baseTo`, then every day after `baseTo` to `loadsTo` run as it arrives. */
export async function larkspurWorld(o: LarkspurOptions & { baseFrom: string; baseTo: string; loadsTo: string; warmup?: number }): Promise<LarkspurWorld> {
  const doc = await loadFlowDir(larkspurDir);
  const data = JSON.parse(readFileSync(new URL('data.json', larkspurDir), 'utf8')) as DataBindings;
  const estate = larkspur(o);
  const watched = DAILY_FILES.filter((f) => doc.publish?.watch?.[f]);
  /** An engine with the architecture inventory pinned and every file's table declared. A base day runs in one of its
   * own, dropped after, so the catalog doesn't grow with every run. */
  const open = async (): Promise<Database> => {
    const d = Database.openMemory({ plugins: [io, external, smaltfl] });
    for (const [name, t] of Object.entries(fixedFiles())) await pinFile(d, data.sources[name]!.file, utf8(csvOf(t.columns, t.rows)));
    for (const b of Object.values(data.sources)) await d.execAsync(pinnedDdl(b));
    return d;
  };
  /** A day's files pinned, and what the page says of each: where it came from, when it was exported and its bytes. */
  const pinDay = async (day: string, d: Database) => {
    const sources: NonNullable<Parameters<typeof runFlow>[2]['sources']> = {};
    for (const f of DAILY_FILES) {
      const t = dayFile(estate, f, day);
      const bytes = utf8(csvOf(t.columns, t.rows));
      const sha256 = await sha256Hex(bytes);
      await pinFile(d, data.sources[f]!.file, bytes, sha256);
      sources[f] = { path: `days/${f}_${day}.csv`, from: 'scripts/data/larkspur.mjs', at: `${day}T06:00:00.000Z`, sha256 };
    }
    return sources;
  };
  const plans = new Map<string, Awaited<ReturnType<typeof translate>>>();
  const bases: Record<string, HistoryFile> = {};
  const refs: Record<string, HistoryRef> = {};
  const settingsOf = async (day: string, w: string) => {
    if (!plans.has(day)) plans.set(day, await translate(doc, { day }));
    const plan = plans.get(day)!;
    const node = plan.nodes.findIndex((n) => n.origin === w);
    const s = settingsFor(plan, node, bases[w] ?? null, doc.steps)!;
    if (bases[w]) return { plan, s };
    const c = watchColumns(doc, w);
    return { plan, s: { ...s, counted: c.count, followed: c.follow, paired: c.pair } };
  };
  const tails: Record<string, Measures[]> = Object.fromEntries(watched.map((w) => [w, []]));
  const results = new Map<string, RunResult | Error>();
  const claimsTold = new Map<string, Record<string, StoryClaim2 | null>>();
  const measuresTaken = new Map<string, Record<string, Measures>>();
  const storiesTold = new Map<string, Record<string, Story>>();

  // The histories: each watched file measured on each base day.
  const periods: Record<string, Measures[]> = Object.fromEntries(watched.map((w) => [w, []]));
  for (let day = o.baseFrom; day <= o.baseTo; day = addDays(day, 1)) {
    const d = await open();
    await pinDay(day, d);
    for (const w of watched) periods[w]!.push(await measureLoad(d, data.sources[w]!.table, (await settingsOf(day, w)).s));
    d.close();
  }
  const db = await open();
  for (const w of watched) {
    const ms = periods[w]!;
    const m0 = ms[0]!;
    const c = watchColumns(doc, w);
    const rules = (await settingsOf(o.baseTo, w)).s;
    bases[w] = appendPeriods(emptyHistory({ flow: doc.id, source: w, settings: { checks: m0.checks, counted: c.count, followed: c.follow, paired: c.pair, time: null, zone: null, sample: 2000, ...(rules.due ? { due: rules.due } : {}), ...(rules.scope ? { scope: rules.scope } : {}), ...(rules.needs ? { needs: rules.needs } : {}), ...(rules.reconcile ? { reconcile: rules.reconcile } : {}) }, columns: m0.columns, types: m0.types, kinds: m0.kinds, warmup: o.warmup ?? 14 }), ms);
    const path = `history.${w}.json`;
    const bytes = utf8(JSON.stringify(bases[w]));
    refs[w] = { path, sha256: await sha256Hex(bytes), bytes: bytes.byteLength };
    await pinFile(db, path, bytes, refs[w]!.sha256);
  }

  const arrive = async (day: string): Promise<RunResult> => {
    const sources = await pinDay(day, db);
    const claims: Claim[] = [];
    const told: Record<string, StoryClaim2 | null> = {};
    const measured: Record<string, Measures> = {};
    const stories: Record<string, Story> = {};
    for (const w of watched) {
      const { plan, s } = await settingsOf(day, w);
      let m: Measures;
      try {
        m = await measureLoad(db, data.sources[w]!.table, s);
      } catch {
        // The file can't be read as declared: no claim; the run holds on it (ADR 0014 §2, slice 7).
        told[w] = null;
        continue;
      }
      measured[w] = m;
      await pinFile(db, tailPath(w), utf8(canonicalJSON(tailBefore(tails[w]!, '9999') as unknown as Parameters<typeof canonicalJSON>[0])));
      const t = await loadClaim({ doc, source: w, flow: plan.flow.hash, base: bases[w]!, baseRef: refs[w]!, tail: tails[w]!, measures: m, settings: s, skip: [], build: 'dev' });
      told[w] = t?.claim ?? null;
      if (t) (claims.push(t.claim), (stories[w] = flowStory(t.ranges, day, doc, w)));
    }
    claimsTold.set(day, told);
    measuresTaken.set(day, measured);
    storiesTold.set(day, stories);
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day }, claims, sources });
    for (const w of watched) if (measured[w]) tails[w]!.push(measured[w]!);
    return r;
  };
  for (let day = addDays(o.baseTo, 1); day <= o.loadsTo; day = addDays(day, 1)) {
    try {
      results.set(day, await arrive(day));
    } catch (e) {
      results.set(day, e as Error);
    }
  }
  return {
    doc, db, estate, bases, results, claims: claimsTold, measures: measuresTaken, stories: storiesTold,
    result(day) {
      const r = results.get(day);
      if (!r || r instanceof Error) throw new Error(`${day}: ${r ? r.message : 'not run'}`);
      return r;
    },
    close: () => db.close(),
  };
}

/** A run's holds, as `by:origin`, sorted. */
export const larkspurHolds = (r: RunResult): string[] => r.holds.map((h) => `${h.by}:${h.origin}`).sort();
