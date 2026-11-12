/**
 * A watched source's history (ADR 0010 §6): each load's numbers, measured by the plugin's `measure` on the runtime, the
 * method a run measures its own load with, so a period built offline and the same load measured by its own run are
 * equal; then folded into a smaltfl-history/3 file (core/measures.ts appendPeriods), as a run's tail is folded onto it.
 * Everything comes from the flow document and its data list: the watched source and its binding (the file format, the
 * table), the checks that read it alone (through its fill step), the columns counted value by value, followed for new
 * values and paired, the time column and zone, and the files, each with its slot.
 *
 *   node scripts/data/history.mjs --flow DOC --watch SOURCE --files LIST.json [--bind DATA.json]
 *        [--count a,b] [--follow c,d] [--pair a,b] [--time COLUMN] [--zone ZONE] [--param name={slot}|{slot:7}|value]
 *        [--fixed source=path …] [--sample SAMPLE.json] OUT.json
 *   --fixed: a fixed source's file (an inventory a gate's scope reads, ADR 0014 §4); --sample: write the kept sample
 *   beside the history (ADR 0014 §5: the last eight weeks' loads, a few hundred rows each, stratified by the counted columns)
 *   --watch a,b,c: several watched steps, measured from one run of the flow a day; OUT, --sample and --ranges then name
 *   each watch's file with {watch} (history.{watch}.json)
 *   node scripts/data/history.mjs DAYS_DIR OUT.json      the taxi example, as before: its trips, its legacy columns
 *
 * LIST.json is `[{ "file": path, "slot": "2024-01-31" }, …]`, or each load the day's files (`{ slot, files: { source:
 * path, … } }`), the watched source's own among them and those its rules read beside it. DATA.json is the flow's bindings (default
 * examples/<doc>.data.json). The columns: `--count` (else the watch's `count`, else the ontology's columns that list
 * values or bad codes), `--follow` (else the watch's `follow`, else its serious columns), `--pair` (else the counted
 * columns whose values number 20 or fewer, so any two multiply to 400 or fewer). `--param` sets the document's other
 * parameters for each load, from its slot (the taxi's checks read `:month`). The loads are measured in parallel, one
 * worker thread a core, each with an engine per load.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { HistoryRanges } from '../../src/core/history.js';
import { loadClaim, rangesFor } from '../../src/core/hold.js';
import { rangesOf } from '../../src/core/ranges.js';
import { recordAhead } from '../../src/core/ahead.js';
import { availableParallelism } from 'node:os';
import { basename, join } from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { Database } from 'smaltdb/engine';
import '@smaltworks/smaltql/register';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import parquet from '@smaltdb/parquet';
import smaltfl from '../../src/plugin/index.js';
import { measureLoad, pinFile, runFlow, sampleLoad, translate, type FlowDocument, type WatchDef } from '../../src/index.js';
import { appendSample, emptySample, SAMPLE_KEEP, type SampleFile } from '../../src/core/apart.js';
import { bindingsPath, readFlow } from '../flow.js';
import { type DayError, type HistoryFile } from '../../src/core/history.js';
import { appendPeriods, checksOf, emptyHistory, SAMPLE, settingsFor, watchColumns, type MeasureSettings, type Measures } from '../../src/core/measures.js';
import { pinnedDdl, type Binding, type DataBindings } from '../../examples/sources.js';
import type { Kind } from '../../src/core/quality.js';

/** Days at the start of the history before anything counts as never seen: at first, everything is. */
const WARMUP = 28;
/** The pinned smaltdb's version, which run keys depend on (history.mjs defines it from its package). */
declare const __SMALTDB_VERSION__: string | undefined;
const SMALTDB = typeof __SMALTDB_VERSION__ === 'string' ? __SMALTDB_VERSION__ : (JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')) as { version: string }).version;
/** A history past this size is too big for a page to fetch and fold (ADR 0010, risks). */
const LIMIT = 8 * 1024 * 1024;
/** The taxi example's legacy columns (scripts/data/build.py): the coded columns counted, value by value and in pairs
 * (all but `extra`, whose amounts are many), the zones followed for new values, the trips by pickup hour. */
const TAXI = {
  count: ['VendorID', 'passenger_count', 'RatecodeID', 'store_and_fwd_flag', 'payment_type', 'extra', 'mta_tax', 'improvement_surcharge', 'congestion_surcharge', 'Airport_fee'],
  follow: ['PULocationID', 'DOLocationID'],
  pair: ['VendorID', 'passenger_count', 'RatecodeID', 'store_and_fwd_flag', 'payment_type', 'mta_tax', 'improvement_surcharge', 'congestion_surcharge', 'Airport_fee'],
  time: 'tpep_pickup_datetime',
};

/** A load: a source's file for a slot; for a watched step, each source's file for the slot (ADR 0013 §4). */
interface LoadFiles {
  slot: string;
  file?: string;
  files?: Record<string, string>;
}

interface Job {
  doc: FlowDocument;
  source: string;
  /** The watched source's binding; null for a watched step, whose loads name every source's file. */
  binding: Binding | null;
  bindings: Record<string, Binding>;
  /** Each load's settings but its slot, and the parameters' templates. */
  settings: Omit<MeasureSettings, 'slot' | 'checks' | 'counting'>;
  params: Record<string, string>;
  files: LoadFiles[];
  /** Fixed sources' files (`--fixed id=path`): the inventory a gate's scope rule reads (ADR 0014 §4), pinned beside
   * each load in source mode. */
  fixed: Record<string, string>;
  /** Whether each load's kept rows are taken too (`--sample`), for the sample file beside the history (ADR 0014 §5). */
  sample: boolean;
}

/** What a worker says of a load: its measures, and its kept rows when the job keeps a sample. */
interface Measured {
  measures: Measures;
  kept?: unknown[][];
}

/** What a worker says of a day: each watch's measures of it, by the watch's id. */
interface MeasuredDay {
  slot: string;
  by: Record<string, Measured>;
}

/** A parameter's value for a load: `{slot}`, `{slot:N}` (its first N characters), or as written. */
const valueFor = (template: string, slot: string) => template.replace(/\{slot(?::(\d+))?\}/g, (_, n?: string) => (n ? slot.slice(0, Number(n)) : slot));

/** The flow's parameter values for a load: the job's, with the watch's period set to the slot. */
function valuesFor(job: Job, slot: string): Record<string, string> {
  const watch = job.doc.publish?.watch?.[job.source];
  const period = (typeof watch === 'object' ? (watch as WatchDef).period : undefined) ?? job.doc.publish?.period;
  const values: Record<string, string> = Object.fromEntries(Object.entries(job.params).map(([k, t]) => [k, valueFor(t, slot)]));
  if (period) values[period] = slot;
  return values;
}

/** The marks and the gate's rules a watch's loads are measured with (ADR 0014): as the plan's watch carries them. */
function rulesFor(plan: Awaited<ReturnType<typeof translate>>, node: number, steps: FlowDocument['steps']): Pick<MeasureSettings, 'due' | 'scope' | 'needs' | 'reconcile'> {
  const st = node >= 0 ? settingsFor(plan, node, null, steps) : null;
  return { ...(st?.due ? { due: st.due } : {}), ...(st?.scope ? { scope: st.scope } : {}), ...(st?.needs?.length ? { needs: st.needs } : {}), ...(st?.reconcile ? { reconcile: st.reconcile } : {}) };
}

/**
 * One load measured: a source's file pinned under its binding's name, read through the binding's table, measured by
 * the plugin, with what its rules read beside it; a watched step's load as `measureSteps` measures it.
 */
async function measure(job: Job, load: LoadFiles): Promise<Measured> {
  if (!job.binding) return (await measureSteps([job], load))[job.source]!;
  const db = Database.openMemory({ plugins: [io, external, parquet, smaltfl] });
  try {
    const plan = await translate(job.doc, valuesFor(job, load.slot));
    // Its own file: the load's, or its own among the day's files.
    const own = load.file ?? load.files?.[job.source];
    if (!own) throw new Error(`${load.slot}: a load of ${job.source} names its file`);
    await pinFile(db, job.binding.file, new Uint8Array(readFileSync(own)));
    await db.execAsync(pinnedDdl(job.binding));
    // The fixed sources a gate's rule reads (the inventory), pinned under their own bindings.
    for (const [id, path] of Object.entries(job.fixed)) {
      const b = job.bindings[id];
      if (!b) throw new Error(`--fixed ${id}: ${id} isn't a source the data list binds`);
      await pinFile(db, b.file, new Uint8Array(readFileSync(path)));
      await db.execAsync(pinnedDdl(b));
    }
    const node = plan.nodes.findIndex((n) => n.op === 'table' && n.origin === job.source);
    const rules = rulesFor(plan, node, job.doc.steps);
    // The other daily sources its rules read (a scope counted against the day's inventory, ADR 0014 §4): the day's own
    // file of each, from the load's files, as a run has them beside it.
    const read = new Set([rules.scope?.table, rules.reconcile?.table, ...(rules.needs ?? []).map((n) => n.table)].filter((t): t is string => !!t));
    for (const [id, b] of Object.entries(job.bindings)) {
      if (id === job.source || job.fixed[id] || !read.has(b.table)) continue;
      const path = load.files?.[id];
      if (!path) throw new Error(`${load.slot}: ${job.source}'s rules read ${id}, and its load names no file for it`);
      await pinFile(db, b.file, new Uint8Array(readFileSync(path)));
      await db.execAsync(pinnedDdl(b));
    }
    const c = checksOf(plan, node, job.doc.steps);
    const measures = await measureLoad(db, job.binding.table, { ...job.settings, slot: load.slot, checks: c?.checks ?? null, counting: c?.counting ?? null, ...rules });
    return { measures, ...(job.sample ? { kept: (await sampleLoad(db, job.binding.table, { keep: SAMPLE_KEEP, strata: job.settings.counted })).rows } : {}) };
  } finally {
    db.close();
  }
}

/**
 * Watched steps' loads (ADR 0013 §4): every source's file pinned, the flow run once on them without its publish block
 * (nothing to hold while its history is being built), and the dataset each step built measured as a run measures it:
 * the same numbers, so the history's period and the run's own measures agree. Several steps measured from one run (a
 * run of a large flow takes seconds) share its parameters.
 */
async function measureSteps(jobs: Job[], load: LoadFiles): Promise<Record<string, Measured>> {
  const db = Database.openMemory({ plugins: [io, external, parquet, smaltfl] });
  try {
    const job = jobs[0]!;
    const values = valuesFor(job, load.slot);
    for (const other of jobs) if (JSON.stringify(valuesFor(other, load.slot)) !== JSON.stringify(values)) throw new Error(`${other.source} is run with other parameters than ${job.source}: measure them apart`);
    const plan = await translate(job.doc, values);
    for (const [source, b] of Object.entries(job.bindings)) {
      const path = load.files?.[source];
      if (!path) throw new Error(`${load.slot}: no file for ${source}`);
      await pinFile(db, b.file, new Uint8Array(readFileSync(path)));
      await db.execAsync(pinnedDdl(b));
    }
    const bare: FlowDocument = { ...job.doc };
    delete bare.publish;
    const r = await runFlow(db, bare, { smaltdb: SMALTDB, parameters: values });
    const out: Record<string, Measured> = {};
    for (const j of jobs) {
      if (!r.published.includes(j.source)) throw new Error(`${load.slot}: the run didn't publish ${j.source}`);
      const node = plan.nodes.findIndex((n) => n.origin === j.source);
      const c = checksOf(plan, node, j.doc.steps);
      const measures = await measureLoad(db, j.source, { ...j.settings, slot: load.slot, checks: c?.checks ?? null, counting: c?.counting ?? null, ...rulesFor(plan, node, j.doc.steps) });
      out[j.source] = { measures, ...(j.sample ? { kept: (await sampleLoad(db, j.source, { keep: SAMPLE_KEEP, strata: j.settings.counted })).rows } : {}) };
    }
    return out;
  } finally {
    db.close();
  }
}

/** A day of every job measured: a watched source's load, or every watched step's from one run. */
const measureAll = async (jobs: Job[], load: LoadFiles): Promise<Record<string, Measured>> => (jobs[0]!.binding ? { [jobs[0]!.source]: await measure(jobs[0]!, load) } : measureSteps(jobs, load));

async function worker(): Promise<void> {
  const { jobs, mine } = workerData as { jobs: Job[]; mine: LoadFiles[] };
  for (const load of mine) {
    try {
      parentPort!.postMessage({ slot: load.slot, by: await measureAll(jobs, load) } satisfies MeasuredDay);
    } catch (e) {
      parentPort!.postMessage({ day: load.slot, error: e instanceof Error ? e.message : String(e) } satisfies DayError);
    }
  }
}

const list = (v: string | undefined) => (v === undefined ? undefined : v.split(',').map((x) => x.trim()).filter(Boolean));

/** What to build, from the arguments: one job a watch (several only for watched steps, measured from one run a day). */
async function jobOf(args: string[]): Promise<{ jobs: Job[]; out: string; samplePath?: string; next?: LoadFiles; rangesPath?: string }> {
  const flags = new Map<string, string[]>();
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('--')) {
      flags.set(a.slice(2), [...(flags.get(a.slice(2)) ?? []), args[i + 1] ?? '']);
      i++;
    } else rest.push(a);
  }
  const one = (k: string) => flags.get(k)?.at(-1);
  if (!flags.has('flow')) {
    // The taxi example, as build.py has always called it: a directory of daily files.
    const [dir, out] = rest;
    if (!dir || !out) throw new Error('usage: node scripts/data/history.mjs --flow DOC --watch SOURCE --files LIST.json OUT.json, or DAYS_DIR OUT.json');
    const files = readdirSync(dir).filter((x) => /^yellow_tripdata_\d{4}-\d{2}-\d{2}\.parquet$/.test(x)).sort().map((x) => ({ file: join(dir, x), slot: /(\d{4}-\d{2}-\d{2})/.exec(x)![1]! }));
    return jobOf(['--flow', 'examples/nyc-taxis-weather.smaltfl.json', '--watch', 'trips', '--files', JSON.stringify(files), '--count', TAXI.count.join(','), '--follow', TAXI.follow.join(','), '--pair', TAXI.pair.join(','), '--time', TAXI.time, '--param', 'month={slot:7}', out]);
  }
  const flowPath = one('flow')!;
  const doc = await readFlow(flowPath);
  const sources = list(one('watch')) ?? [Object.keys(doc.publish?.watch ?? {})[0]].filter((x): x is string => !!x);
  if (!sources.length) throw new Error(`${flowPath} watches nothing: name a source or published step with --watch`);
  // A watched step (ADR 0013 §4): its history is built by running the flow on each day's files and measuring the
  // dataset it builds, as a run does.
  const isStep = (id: string) => doc.steps.some((s) => s.id === id && s.dataset !== undefined);
  for (const id of sources) if (!isStep(id) && !doc.sources.some((s) => s.id === id)) throw new Error(`${flowPath} has no source or published step ${id} to watch`);
  const step = isStep(sources[0]!);
  if (sources.length > 1 && !sources.every(isStep)) throw new Error('--watch names several only of watched steps, measured from one run of the flow a day: a source is measured on its own');
  const bindPath = one('bind') ?? bindingsPath(flowPath);
  if (!existsSync(bindPath)) throw new Error(`no data list ${bindPath} for ${basename(flowPath)}: pass --bind`);
  const data = JSON.parse(readFileSync(bindPath, 'utf8')) as DataBindings;
  const binding = step ? null : data.sources[sources[0]!];
  if (!step && !binding) throw new Error(`${bindPath} binds no ${sources[0]}`);
  const filesArg = one('files');
  if (!filesArg) throw new Error(step ? '--files LIST.json: the loads, each { slot, files: { source: path, … } }' : '--files LIST.json: the loads, each { file, slot } or { slot, files: { source: path, … } }');
  const files = (filesArg.trim().startsWith('[') ? JSON.parse(filesArg) : JSON.parse(readFileSync(filesArg, 'utf8'))) as LoadFiles[];
  if (step) for (const f of files) if (!f.files || typeof f.files !== 'object') throw new Error(`${f.slot}: a watched step's load names each source's file: { slot, files: { source: path, … } }`);
  const asked = ['count', 'follow', 'pair', 'time', 'zone'].filter((k) => flags.has(k));
  if (sources.length > 1 && asked.length) throw new Error(`--${asked[0]} names one watch's columns: pass one --watch with it`);
  const params = Object.fromEntries((flags.get('param') ?? []).map((p) => {
    const at = p.indexOf('=');
    return [p.slice(0, at), p.slice(at + 1)];
  }));
  const out = rest[0];
  if (!out) throw new Error('name the history file to write');
  // Several watches write one file each: the names given say where, `{watch}` the watch's id.
  if (sources.length > 1) for (const [what, name] of [['the history', out], ['--sample', one('sample')], ['--ranges', one('ranges')]] as const) if (name !== undefined && !name.includes('{watch}')) throw new Error(`${what} is named for several watches: put {watch} in ${name}`);
  const fixed = Object.fromEntries((flags.get('fixed') ?? []).map((f) => {
    const at = f.indexOf('=');
    if (at <= 0) throw new Error(`--fixed names a source and its file: --fixed apps=path/to/apps.csv (got ${f})`);
    return [f.slice(0, at), f.slice(at + 1)];
  }));
  // The first load after the history (ADR 0019): measured as the page will measure it, to compute every metric's range for
  // its day, written to --ranges.
  const nextArg = one('next');
  const next = nextArg ? (JSON.parse(nextArg.trim().startsWith('{') ? nextArg : readFileSync(nextArg, 'utf8')) as LoadFiles) : undefined;
  const jobs = sources.map((source): Job => {
    const watch = doc.publish?.watch?.[source];
    const w = typeof watch === 'object' ? watch : null;
    const defaults = watchColumns(doc, source);
    const count = list(one('count')) ?? defaults.count;
    const follow = (list(one('follow')) ?? defaults.follow).filter((c) => !count.includes(c));
    const pair = list(one('pair')) ?? defaults.pair;
    return { doc, source, binding: step ? null : binding!, bindings: data.sources, settings: { source, every: 'day', counted: [...new Set(count)], followed: [...new Set(follow)], paired: [...new Set(pair)], time: one('time') ?? w?.time ?? null, zone: one('zone') ?? w?.zone ?? null, sample: SAMPLE }, params, files, fixed, sample: one('sample') !== undefined };
  });
  return { jobs, out, samplePath: one('sample'), next, rangesPath: one('ranges') };
}

async function main(): Promise<void> {
  const { jobs, out, samplePath, next, rangesPath } = await jobOf(process.argv.slice(2));
  const nameOf = (template: string, job: Job) => (jobs.length > 1 ? template.replaceAll('{watch}', job.source) : template);
  const files = [...jobs[0]!.files].sort((a, b) => (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0));
  if (!files.length) throw new Error('no loads to measure');
  const n = Math.max(1, Math.min(availableParallelism(), files.length));
  const started = Date.now();
  const results = new Map<string, Measures[]>(jobs.map((j) => [j.source, []]));
  const kept = new Map<string, Map<string, unknown[][]>>(jobs.map((j) => [j.source, new Map()]));
  const failures: DayError[] = [];
  let measured = 0;
  await Promise.all(Array.from({ length: n }, (_, w) => new Promise<void>((resolve, reject) => {
    // Every n-th load to each worker, so each has loads from the whole span.
    const mine = files.filter((_, k) => k % n === w);
    const t = new Worker(new URL(import.meta.url), { workerData: { jobs, mine } });
    t.on('message', (d: MeasuredDay | DayError) => {
      if ('error' in d) {
        failures.push(d);
        console.log(`${d.day}: not measured: ${d.error}`);
      } else {
        measured++;
        for (const [id, m] of Object.entries(d.by)) {
          results.get(id)!.push(m.measures);
          if (m.kept) kept.get(id)!.set(m.measures.slot, m.kept);
        }
      }
      const done = measured + failures.length;
      if (done % 25 === 0 || done === files.length) console.log(`${done} of ${files.length} loads (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    });
    t.on('error', reject);
    t.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`worker ${w} exited with ${code}`))));
  })));
  failures.sort((a, b) => (a.day < b.day ? -1 : 1));
  // A few loads that couldn't be measured are gaps a normal range steps over; more than a few is a broken history.
  if (!measured || failures.length > files.length / 50) throw new Error(`${failures.length} of ${files.length} loads not measured`);
  // The first load after the history (ADR 0019), measured once for every watch.
  const after = rangesPath && next ? await measureAll(jobs, next) : null;
  for (const job of jobs) await write(job, results.get(job.source)!, kept.get(job.source)!, failures, nameOf(out, job), samplePath === undefined ? undefined : nameOf(samplePath, job), rangesPath === undefined ? undefined : nameOf(rangesPath, job), after?.[job.source], { started, threads: n });
}

/** A watch's history folded from its loads' measures and written, with its sample and its first day's ranges. */
async function write(job: Job, measured: Measures[], keptOf: Map<string, unknown[][]>, failures: DayError[], out: string, samplePath: string | undefined, rangesPath: string | undefined, after: Measured | undefined, run: { started: number; threads: number }): Promise<void> {
  const results = [...measured].sort((a, b) => (a.slot < b.slot ? -1 : 1));
  const first = results[0]!;
  const odd = results.find((r) => JSON.stringify([r.columns, r.types]) !== JSON.stringify([first.columns, first.types]));
  if (odd) throw new Error(`${job.source}: ${odd.slot}'s columns differ from ${first.slot}'s`);
  // The kind a column has on most loads.
  const kinds = first.columns.map((_, k) => {
    const count = new Map<Kind, number>();
    for (const r of results) count.set(r.kinds[k]!, (count.get(r.kinds[k]!) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  });
  const s = job.settings;
  // The marks and the gate's rules (ADR 0014) the history keeps counts for: as the plan's watch carries them.
  const plan = await translate(job.doc, valuesFor(job, first.slot));
  const rules = rulesFor(plan, plan.nodes.findIndex((n) => n.origin === job.source), job.doc.steps);
  const start = emptyHistory({ flow: job.doc.id, source: job.source, settings: { ...s, ...rules, checks: first.checks }, columns: first.columns, types: first.types, kinds, warmup: WARMUP, built: new Date().toISOString().slice(0, 19) + 'Z' });
  const history: HistoryFile = { ...appendPeriods(start, results), kinds, missing: failures };
  // The columns asked for that the files don't have: said, not left out quietly.
  const have = new Set(first.columns);
  history.skipped = [...s.counted, ...s.followed, ...(s.time ? [s.time] : [])].filter((c) => !have.has(c)).map((c): [string, string] => [c, 'not in the files']);
  const text = JSON.stringify(history) + '\n';
  if (text.length > LIMIT) throw new Error(`${out} would be ${(text.length / 1048576).toFixed(1)} MB, past the ${LIMIT / 1048576} MB a page fetches`);
  writeFileSync(out, text);
  // The kept sample (ADR 0014 §5): the last eight weeks' loads' kept rows, in the loads' columns.
  let sampleFile: SampleFile | null = null;
  if (samplePath) {
    sampleFile = emptySample({ flow: job.doc.id, source: job.source, columns: first.columns, kinds, keep: SAMPLE_KEEP });
    for (const r of results) if (keptOf.has(r.slot)) sampleFile = appendSample(sampleFile!, r.slot, keptOf.get(r.slot)!);
    const sampleText = JSON.stringify(sampleFile) + '\n';
    if (sampleText.length > LIMIT) throw new Error(`${samplePath} would be ${(sampleText.length / 1048576).toFixed(1)} MB, past the ${LIMIT / 1048576} MB a page fetches`);
    writeFileSync(samplePath, sampleText);
    console.log(`${samplePath}: ${sampleFile.days.length} days' kept rows of ${job.source}, ${(sampleText.length / 1048576).toFixed(2)} MB`);
  }
  // Every metric's range for the first day after the history (ADR 0019): the day measured, appended, and each range
  // computed by the judge itself; the file names the history by its bytes' sha256, so it is taken on that history alone.
  if (rangesPath && after) {
    const t0 = Date.now();
    const { measures, kept: nextKept } = after;
    const ranges = new HistoryRanges(appendPeriods(history, [measures]), rangesFor(job.doc, job.source));
    const sha256 = createHash('sha256').update(text).digest('hex');
    const made = rangesOf(ranges, measures.slot, { sha256, days: history.days.length, last: history.days.at(-1)! });
    // The classifier's answers for the day, judged ahead (ADR 0019 amendment 1): the day's claim told as the page and
    // the engine tell it, from the history, the sample and the day's kept rows, and every call the classifier made kept
    // by its inputs' sha256.
    if (sampleFile && nextKept) {
      const plan = await translate(job.doc, valuesFor(job, measures.slot));
      const apart = await recordAhead(() => loadClaim({ given: { file: made, sha256 }, doc: job.doc, source: job.source, flow: plan.flow.hash, base: history, baseRef: { path: 'history.json', sha256, bytes: text.length }, tail: [], measures, settings: settingsFor(plan, plan.nodes.findIndex((n) => n.origin === job.source), history, job.doc.steps) ?? { ...job.settings, slot: measures.slot, checks: null, counting: null }, skip: [], levels: [], build: 'ahead', sample: sampleFile, kept: nextKept }));
      if (apart.length) made.apart = apart;
    }
    writeFileSync(rangesPath, JSON.stringify(made) + '\n');
    console.log(`${rangesPath}: ${Object.keys(made.ranges).length} ranges for ${made.day} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  console.log(`${out}: ${results.length} loads of ${job.source}, ${history.days[0]} to ${history.days.at(-1)}, ${(text.length / 1048576).toFixed(2)} MB, in ${((Date.now() - run.started) / 1000).toFixed(0)} s on ${run.threads} threads`);
}

if (isMainThread) await main();
else await worker();
