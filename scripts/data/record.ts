/**
 * The recorded month (ADR 0021 §6): every loads day of a generated flow, run in order as the page runs a day, and each
 * run recorded as the page records one, at the story's time.
 *
 * - **A day, as the page runs it** (src/app/main.ts `claimsForRun` and `run`): the day's files pinned under their
 *   bindings and said where they came from (the bronze metadata, amendment 5). Each watched file is measured and its
 *   claim told:
 *   - from its history, the tail of the days recorded before it, the days the record leaves out of learning (`skipOf`)
 *     and the levels accepted (none yet);
 *   - with its file's facts for `fresh`, and its kept rows where it keeps a sample.
 *   Then the flow runs, each watched step's claim told in the engine. Each watched dataset's measures go to its tail,
 *   and each kept day to its sample, in order, as the page adds them.
 * - **A run, as the page records it** (`recordRun`): a `run` entry of the record's shape (log/1), whose fields are the
 *   page's: the manifest's hash, the files read, the day, the inputs, the holds with what waits and the staged keys,
 *   the measures and the claims. Two differences from the page's: every watched step's claim is recorded, held or not
 *   (the engine returns them as `told`), so the month can say what each step was told; and the entry is the build's
 *   (`by.as` is `build`), at the time the day's files arrived: the latest export time the data list gives them, else
 *   six in the morning. Each manifest is kept by its hash beside the entries.
 * - **The posture**, where the data list names a posture product: the group's score and coverage on each day its roll-up
 *   was published, which the month's trend band draws.
 *
 *   node scripts/data/record.mjs --flow DOC --work DIR --build COMMIT [--bind DATA.json] OUT.json
 *
 * DIR is the generated data's folder: the generator's loads.json (its days, each source's file, the export times, the
 * history's last file of each source, the fixed files) and the histories and samples history.mjs wrote beside it
 * (history.json and sample.json for one watch, else history.<watch>.json and sample.<watch>.json). A flow whose plan
 * isn't plan/2 or later (the legacy taxi form) has no recorded month: nothing is written.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Database } from 'smaltdb/engine';
import '@smaltworks/smaltql/register';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import parquet from '@smaltdb/parquet';
import smaltfl from '../../src/plugin/index.js';
import { measureLoad, pinFile, runFlow, sampleLoad, translate, type FlowDocument } from '../../src/index.js';
import { appendSample, isSample, samplePath, SAMPLE_KEEP, type SampleFile } from '../../src/core/apart.js';
import { canonicalJSON } from '../../src/core/canonical.js';
import { periodOf, watchHistory } from '../../src/core/document.js';
import { gateChecksOf } from '../../src/core/gates.js';
import { isHistory, type HistoryFile } from '../../src/core/history.js';
import { heldOutputs, inputsOf, levelsOf, loadClaim, skipOf, stagedKeys, tailPath, type Claim, type HistoryRef } from '../../src/core/hold.js';
import type { JSONValue, LogEntry } from '../../src/core/log.js';
import { settingsFor, tailBefore, type Measures } from '../../src/core/measures.js';
import { MONTH_FORMAT, type MonthFile, type PostureMark } from '../../src/core/month.js';
import type { FileFacts } from '../../src/core/news.js';
import { isPublish2, type FlowPlan } from '../../src/core/plan.js';
import type { RunManifest } from '../../src/core/manifest.js';
import { pinnedDdl, type Binding, type DataBindings } from '../../examples/sources.js';
import { bindingsPath, readFlow } from '../flow.js';

declare const __SMALTDB_VERSION__: string | undefined;
const SMALTDB = typeof __SMALTDB_VERSION__ === 'string' ? __SMALTDB_VERSION__ : (JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')) as { version: string }).version;

/** A day of the generator's loads: each daily source's file, its rows and, where the generator says, its export time. */
interface Day {
  slot: string;
  files: Record<string, { file: string; rows?: number; exported_at?: string }>;
}
/** The generator's loads.json: one source's files, or days of several with the fixed files and each history's last. */
type Generated = { file: string; slot: string; rows?: number }[] | { fixed?: Record<string, string>; loads: Day[]; before?: Record<string, { slot: string; file: string }> };

const arg = (args: string[], k: string) => {
  const at = args.indexOf(`--${k}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const readJSON = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const plusDay = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flowPath = arg(args, 'flow');
  const work = arg(args, 'work');
  const build = arg(args, 'build') ?? 'dev';
  const out = args.at(-1);
  if (!flowPath || !work || !out || out.startsWith('--')) throw new Error('usage: node scripts/data/record.mjs --flow DOC --work DIR --build COMMIT [--bind DATA.json] OUT.json');
  const doc: FlowDocument = await readFlow(flowPath);
  const bind = readJSON<DataBindings & { posture?: { units?: string; org?: string } }>(arg(args, 'bind') ?? bindingsPath(flowPath));
  const generated = readJSON<Generated>(join(work, 'loads.json'));
  const watches = Object.keys(doc.publish?.watch ?? {});
  const one = watches.length === 1;
  const historyName = (w: string) => (one ? 'history.json' : `history.${w}.json`);
  const sampleName = (w: string) => (one ? 'sample.json' : `sample.${w}.json`);

  // The days, as the data list will list them: one source's files, or each day's file of every daily source.
  const daily = Array.isArray(generated) ? [Object.keys(bind.sources)[0]!] : Object.keys(bind.sources).filter((id) => !generated.fixed?.[id]);
  const days: Day[] = Array.isArray(generated) ? generated.map((l) => ({ slot: l.slot, files: { [daily[0]!]: { file: l.file, rows: l.rows } } })) : generated.loads;
  const fixed = Array.isArray(generated) ? {} : (generated.fixed ?? {});
  const before = Array.isArray(generated) ? {} : (generated.before ?? {});
  if (!days.length) throw new Error(`${work}/loads.json lists no days`);
  const judged = bind.judged && watches.some((w) => w.toLowerCase() === bind.judged!.toLowerCase()) ? bind.judged : daily[0]!;
  const period = periodOf(doc, judged) ?? null;
  const has = (name: string) => !!doc.parameters?.some((x) => x.name === name);
  const parametersOf = (day: string): Record<string, string> => ({ ...(has('month') ? { month: day.slice(0, 7) } : {}), ...(period && has(period) ? { [period]: day } : {}) });

  const plan0 = await translate(doc, parametersOf(days[0]!.slot));
  if (!plan0.publish || !isPublish2(plan0.publish)) {
    console.log(`${out}: not written: ${doc.id}'s plan isn't plan/2 or later, so it has no recorded month`);
    return;
  }

  const db = Database.openMemory({ plugins: [io, external, parquet, smaltfl] });
  try {
    // When each day's files arrived: the latest export time the generator gives them, else six in the morning.
    const arrived = (d: Day) => Object.values(d.files).map((f) => f.exported_at).filter((x): x is string => !!x).sort().at(-1) ?? `${d.slot}T06:00:00.000Z`;
    const startAt = new Date(Date.parse(arrived(days[0]!))).toISOString();
    // Every fixed file, and every source's table, once: a day's files are pinned again under the same names.
    const sources: Record<string, { path: string; from?: string; at: string; sha256: string }> = {};
    for (const [id, path] of Object.entries(fixed)) {
      const b = bind.sources[id];
      if (!b || !doc.sources.some((x) => x.id === id)) continue;
      const bytes = new Uint8Array(readFileSync(path));
      const sha = sha256(bytes);
      await pinFile(db, b.file, bytes, sha);
      sources[id] = { path: b.file, ...(bind.generate ? { from: bind.generate } : {}), at: startAt, sha256: sha };
    }
    const tables = Object.entries(bind.sources).filter(([id]) => doc.sources.some((x) => x.id === id)).map(([, b]) => pinnedDdl(b as Binding));
    // A day's files pinned before the tables exist the first time: an external table reads its file when defined.
    const pinDay = async (d: Day): Promise<Record<string, string>> => {
      const shas: Record<string, string> = {};
      for (const id of daily) {
        const f = d.files[id];
        const b = bind.sources[id];
        if (!f || !b || !doc.sources.some((x) => x.id === id)) continue;
        const bytes = new Uint8Array(readFileSync(f.file));
        const sha = sha256(bytes);
        await pinFile(db, b.file, bytes, sha);
        shas[id] = sha;
        sources[id] = { path: `loads/${basename(f.file)}`, ...(bind.generate ? { from: bind.generate } : {}), at: new Date(Date.parse(arrived(d))).toISOString(), sha256: sha };
      }
      return shas;
    };

    // Each watch's history, pinned under the name its watch gives it, and its sample; a step's sample pinned for the
    // engine, which reads it to tell the step's claim.
    const bases = new Map<string, { file: HistoryFile; ref: HistoryRef }>();
    for (const [w, def] of Object.entries(doc.publish?.watch ?? {})) {
      const path = join(work, historyName(w));
      if (!existsSync(path)) continue;
      const bytes = new Uint8Array(readFileSync(path));
      const file = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
      if (!isHistory(file) || !file.days.length) continue;
      const name = watchHistory(def);
      const ref = { path: name, sha256: sha256(bytes), bytes: bytes.length };
      await pinFile(db, name, bytes, ref.sha256);
      bases.set(w, { file, ref });
    }
    const samples = new Map<string, SampleFile>();
    const pinnedSamples = new Map<string, SampleFile>();
    for (const w of watches) {
      const path = join(work, sampleName(w));
      if (!existsSync(path)) continue;
      const file = readJSON<unknown>(path);
      if (isSample(file)) samples.set(w, file);
    }
    const isSource = (id: string) => doc.sources.some((x) => x.id.toLowerCase() === id.toLowerCase());

    const tails = new Map<string, Measures[]>();
    const addToTail = (m: Measures) => {
      const tail = tails.get(m.source) ?? [];
      if (!tail.some((x) => x.slot === m.slot)) tails.set(m.source, [...tail, m]);
    };
    const keepDay = (id: string, day: string, rows: unknown[][]) => {
      const file = samples.get(id);
      if (file && !file.days.includes(day) && (file.days.length === 0 || day > file.days.at(-1)!)) samples.set(id, appendSample(file, day, rows));
    };
    // The facts `fresh` is told from (main.ts fileFacts): the file's sha256, its export time, the load before it.
    const last: Record<string, { slot: string; sha256: string }> = {};
    for (const [id, b] of Object.entries(before)) last[id] = { slot: b.slot, sha256: sha256(new Uint8Array(readFileSync(b.file))) };
    const factsOf = (id: string, d: Day, sha: string): FileFacts | undefined => {
      const fresh = gateChecksOf(doc, id)?.fresh;
      const exported = d.files[id]?.exported_at;
      if (!fresh || fresh === 'off' || !exported) return undefined;
      return { sha256: sha, exported, ...(last[id] ? { previous: last[id]! } : {}) };
    };

    const entries: LogEntry[] = [];
    const manifests: Record<string, RunManifest> = {};
    const posture: Record<string, PostureMark> = {};
    const origin = `build:${doc.id}`;
    const nonce = (day: string, k: number) => createHash('sha256').update(`${origin}|${day}|${k}`).digest('hex').slice(0, 32);
    const t0 = Date.now();

    for (const [k, d] of days.entries()) {
      const day = d.slot;
      const at = new Date(Date.parse(arrived(d))).toISOString();
      const shas = await pinDay(d);
      if (k === 0 && tables.length) await db.execAsync(tables.join(';\n'));
      const parameters = parametersOf(day);
      const plan = await translate(doc, parameters);
      const skip = skipOf(entries, period);
      const claims: Claim[] = [];
      const told: Claim[] = [];
      const tell: Record<string, { skip: string[]; levels: ReturnType<typeof levelsOf> }> = {};
      const kept = new Map<string, unknown[][]>();
      for (const w of watches) {
        const node = plan.nodes.findIndex((n) => n.origin === w);
        if (node < 0) continue;
        const known = bases.get(w);
        const levels = levelsOf(entries, w);
        if (plan.nodes[node]!.op !== 'table') {
          // A watched step: the engine tells its claim, from its history, its tail pinned here and its sample.
          const tail = tailBefore(tails.get(w) ?? [], day);
          await pinFile(db, tailPath(w), tail.length ? new TextEncoder().encode(canonicalJSON(tail as unknown as Parameters<typeof canonicalJSON>[0])) : null);
          const sample = samples.get(w);
          if (sample && pinnedSamples.get(w) !== sample) {
            pinnedSamples.set(w, sample);
            await pinFile(db, samplePath(w), new TextEncoder().encode(JSON.stringify(sample)));
          }
          tell[w] = { skip, levels };
          continue;
        }
        const b = bind.sources[w];
        const settings = b ? settingsFor(plan, node, known?.file ?? null, doc.steps) : null;
        if (!b || !settings) continue;
        let m: Measures;
        try {
          m = await measureLoad(db, b.table, settings);
        } catch {
          // The file can't be read as declared: no claim; the run holds on it under the schema check (ADR 0014 §2).
          continue;
        }
        let rows: unknown[][] | undefined;
        if (samples.has(w)) {
          rows = (await sampleLoad(db, b.table, { keep: SAMPLE_KEEP, strata: settings.counted })).rows;
          kept.set(w, rows);
        }
        const file = shas[w] ? factsOf(w, d, shas[w]!) : undefined;
        const t = await loadClaim({ doc, source: w, flow: plan.flow.hash, base: known?.file ?? null, baseRef: known?.ref ?? null, tail: tails.get(w) ?? [], measures: m, settings, skip, levels, build, ...(rows && samples.get(w) ? { sample: samples.get(w)!, kept: rows } : {}), ...(file ? { file } : {}) });
        await pinFile(db, tailPath(w), t?.tail.length ? new TextEncoder().encode(canonicalJSON(t.tail as unknown as Parameters<typeof canonicalJSON>[0])) : null);
        if (t) (claims.push(t.claim), told.push(t.claim));
      }
      let entry: LogEntry;
      try {
        const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters, data: null, ...(claims.length ? { claims } : {}), ...(Object.keys(tell).length ? { tell } : {}), sources: { ...sources } });
        for (const m of r.measures ?? []) addToTail(m);
        for (const m of r.measures ?? []) {
          const rows = kept.get(m.source);
          if (rows) keepDay(m.source, m.slot, rows);
        }
        for (const [id, rows] of Object.entries(r.kept ?? {})) {
          const m = r.measures?.find((x) => x.source === id);
          if (m && !isSource(id)) keepDay(id, m.slot, rows);
        }
        manifests[r.hash] = r.manifest;
        const typed = db.query('SELECT plan FROM _smaltfl_plans WHERE hash = ?', [r.manifest.plan]).rows[0];
        const typedPlan = typed ? (JSON.parse(String(typed[0])) as FlowPlan) : null;
        const held = r.holds.length > 0;
        const keys = held && typedPlan ? stagedKeys(r.manifest, heldOutputs(typedPlan, r.holds)) : {};
        const files = r.manifest.nodes.filter((n) => n.file).map((n) => ({ source: n.origin, ...n.file! }));
        entry = {
          smaltflLog: 1, origin, seq: entries.length, kind: 'run', at, by: { card: null, as: 'build' },
          about: {
            run: r.run, manifest: r.hash, load: day, outcome: held ? 'held' : 'ok', files, data: null, day,
            inputs: inputsOf(r.manifest),
            ...(held ? { holds: r.holds, waiting: r.waiting, keys } : {}),
            ...(r.measures?.length ? { measures: r.measures } : {}),
            ...(told.length || r.told?.length ? { claims: [...told, ...(r.told ?? [])] } : {}),
          } as unknown as JSONValue,
          reason: null, amends: null, nonce: nonce(day, entries.length),
        };
        // The group's score and coverage, on a day its roll-up and organisation were published (ADR 0021 §3).
        const units = bind.posture?.units;
        const org = bind.posture?.org;
        if (units && org && r.published.includes(units) && r.published.includes(org)) {
          const row = db.query(`SELECT p.score, p.coverage FROM ${units} p JOIN ${org} o ON o.org_unit_id = p.org_unit_id WHERE o.level = 'group' AND o.parent_id IS NULL`).rows[0];
          if (row) posture[day] = { score: row[0] === null ? null : Number(row[0]), coverage: row[1] === null ? null : Number(row[1]) };
        }
        console.log(`${day}: ${held ? `held (${r.holds.map((h) => h.origin).join(', ')})` : 'ok'}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        entry = { smaltflLog: 1, origin, seq: entries.length, kind: 'run', at, by: { card: null, as: 'build' }, about: { run: null, load: day, outcome: 'failed', error }, reason: null, amends: null, nonce: nonce(day, entries.length) };
        console.log(`${day}: failed: ${error}`);
      }
      entries.push(entry);
      for (const [id, sha] of Object.entries(shas)) last[id] = { slot: day, sha256: sha };
    }

    const file: MonthFile = {
      format: MONTH_FORMAT, flow: doc.id, build,
      // The story's now: the morning after the last day.
      now: `${plusDay(days.at(-1)!.slot, 1)}T08:00:00.000Z`,
      entries, manifests,
      ...(Object.keys(posture).length ? { posture } : {}),
    };
    writeFileSync(out, JSON.stringify(file) + '\n');
    const size = readFileSync(out).length;
    console.log(`${out}: ${entries.length} days recorded, ${(size / 1e6).toFixed(2)} MB, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  } finally {
    db.close();
  }
}

await main();
