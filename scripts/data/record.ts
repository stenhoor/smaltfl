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
 * - **The story** (`--story`, ADR 0021 §6), where the data list names one: the month in time order (core/timeline.ts),
 *   each day's first run at its files' time, then each later delivery of a day's file when it arrived, run as a
 *   correction of the day's latest run (held until a decision, Q-183), and each decision when it was taken, by its
 *   principal: recorded as a decision a held load on a flow that watches several datasets (Q-193), and, to publish,
 *   released in the engine as the page releases one, the release recorded beside it. The history learns each day from
 *   the version published (`learnedMeasures`), and a delivery is judged against the days before its day.
 * - **The rules over time** (ADR 0021 §5), where the story changes them: every run is of the rules in force on its day
 *   as known when it ran (the story's change sets kept as the document keeps them, `forDay`, `runFlow`'s `asOf`). A
 *   change set that reaches days already run (a day from its `from` whose version readers got ran before it was
 *   recorded) runs each of them again when it is recorded, latest first, as the page does: a restated run of the run
 *   readers got (`restates`), held until a restatement, never feeding the history. Where no day's outcome would change
 *   they are noted at once, by whoever made the change (Q-199); else the story's restatement decides them, at its time,
 *   by its principal (Q-190): every day whose outcome would change is restated but those it keeps, the rest noted as the
 *   same (`restatedOutcome`, core/month.ts). The page reads the change sets from the flow the build ships.
 *
 *   node scripts/data/record.mjs --flow DOC --work DIR --build COMMIT [--bind DATA.json] [--story STORY.json] OUT.json
 *
 * DIR is the generated data's folder: the generator's loads.json (its days, each source's file, the export times, the
 * history's last file of each source, the fixed files, the story's deliveries the generator wrote) and the histories and
 * samples history.mjs wrote beside it (history.json and sample.json for one watch, else history.<watch>.json and
 * sample.<watch>.json). A flow whose plan isn't plan/2 or later (the legacy taxi form) has no recorded month: nothing is
 * written.
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
import { forDay, measureLoad, pinFile, releaseRun, runFlow, sampleLoad, translate, validateDocument, type FlowDocument } from '../../src/index.js';
import { appendSample, isSample, samplePath, SAMPLE_KEEP, type SampleFile } from '../../src/core/apart.js';
import { canonicalJSON } from '../../src/core/canonical.js';
import { periodOf, watchHistory } from '../../src/core/document.js';
import { gateChecksOf } from '../../src/core/gates.js';
import { isHistory, type HistoryFile } from '../../src/core/history.js';
import { byLoad, heldLoadsOf, heldOutputs, inputsOf, keysForLoads, learnedMeasures, levelsOf, loadClaim, loadDecisions, loadsOf, skipOf, stagedKeys, tailPath, type Claim, type DecideAbout, type HistoryRef, type Hold, type Inputs, type ReleaseAbout } from '../../src/core/hold.js';
import { entryLeaf, type JSONValue, type LogEntry } from '../../src/core/log.js';
import { settingsFor, tailBefore, type Measures } from '../../src/core/measures.js';
import { MONTH_FORMAT, restatedOutcome, restatedRuns, type MonthFile, type PostureMark, type RestateAbout } from '../../src/core/month.js';
import type { FileFacts } from '../../src/core/news.js';
import { isPublish2, type FlowPlan } from '../../src/core/plan.js';
import { policiesHash, type RunManifest } from '../../src/core/manifest.js';
import { checkDecision } from '../../src/core/policy.js';
import type { ChangeSet } from '../../src/core/document.js';
import { storyProblems, timelineOf, type StoryFile, type StoryRestatement } from '../../src/core/timeline.js';
import { pinnedDdl, type Binding, type DataBindings } from '../../examples/sources.js';
import { bindingsPath, readFlow } from '../flow.js';

declare const __SMALTDB_VERSION__: string | undefined;
const SMALTDB = typeof __SMALTDB_VERSION__ === 'string' ? __SMALTDB_VERSION__ : (JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')) as { version: string }).version;

/** A day of the generator's loads: each daily source's file, its rows and, where the generator says, its export time. */
interface Day {
  slot: string;
  files: Record<string, { file: string; rows?: number; exported_at?: string }>;
}
/** A later delivery the generator wrote for the story (ADR 0021 §6): its day, its number that day, its source and file. */
interface Delivered {
  day: string;
  n: number;
  source: string;
  file: string;
  rows?: number;
  exported_at?: string;
  arrived: string;
}
/** The generator's loads.json: one source's files, or days of several with the fixed files, each history's last and the
 * story's deliveries. */
type Generated = { file: string; slot: string; rows?: number }[] | { fixed?: Record<string, string>; loads: Day[]; before?: Record<string, { slot: string; file: string }>; deliveries?: Delivered[] };

/**
 * A run of a day the recorder made, as a decision and a restatement need it: its run, manifest, inputs, holds and staged
 * keys; when it ran (the moment its rules are known at), whether it passed, each output's content, the day's files and
 * where they came from as it read them, and, for a run of the day again under rules changed since, what it restates.
 */
interface Made {
  run: number;
  manifest: string;
  inputs: Inputs;
  holds: Hold[];
  keys: Record<string, string>;
  at: string;
  ok: boolean;
  contents: Record<string, string>;
  files: Day;
  sources: Record<string, { path: string; from?: string; at: string; sha256: string }>;
  restates?: { of: string; changes: string[] };
}

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
  if (!flowPath || !work || !out || out.startsWith('--')) throw new Error('usage: node scripts/data/record.mjs --flow DOC --work DIR --build COMMIT [--bind DATA.json] [--story STORY.json] OUT.json');
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
  // The story (ADR 0021 §6): its deliveries and decisions, checked against the flow, each delivery's file as written.
  const storyPath = arg(args, 'story');
  const story = storyPath ? readJSON<StoryFile>(storyPath) : null;
  if (story) {
    const problems = storyProblems(story, { sources: daily, principals: doc.policies?.principals.map((p) => p.id) });
    if (problems.length) throw new Error(`${storyPath}: ${problems.join('; ')}`);
  }
  const delivered = Array.isArray(generated) ? [] : (generated.deliveries ?? []);
  // The rules over time (ADR 0021 §5): the story's change sets, kept as the document keeps them, so every run is of the
  // rules in force on its day as known when it ran.
  const changes: ChangeSet[] = story?.changes ?? [];
  const flowDoc: FlowDocument = changes.length ? { ...doc, changes } : doc;
  if (flowDoc !== doc) {
    const issues = validateDocument(flowDoc);
    if (issues.length) throw new Error(`${storyPath}: the flow with the story's change sets has ${issues.length} problem${issues.length === 1 ? '' : 's'}: ${issues[0]!.path}: ${issues[0]!.message}`);
  }
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
    // A day's files pinned before the tables exist the first time: an external table reads its file when defined. A day's
    // first files are all of its daily sources'; a later delivery pins only the file sent again, in place of the day's.
    // A day run again under rules changed since (ADR 0021 §5) pins its files again and says they came from where they did
    // (`keep`): nothing was pulled in anew.
    const pinDay = async (d: Day, at: string, ids: readonly string[] = daily, keep = false): Promise<Record<string, string>> => {
      const shas: Record<string, string> = {};
      for (const id of ids) {
        const f = d.files[id];
        const b = bind.sources[id];
        if (!f || !b || !doc.sources.some((x) => x.id === id)) continue;
        const bytes = new Uint8Array(readFileSync(f.file));
        const sha = sha256(bytes);
        await pinFile(db, b.file, bytes, sha);
        shas[id] = sha;
        if (!keep) sources[id] = { path: `loads/${basename(f.file)}`, ...(bind.generate ? { from: bind.generate } : {}), at, sha256: sha };
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

    // Each watched dataset's tail: its measures of each day recorded so far, as the history learns them, from the version
    // of the day that was published (`learnedMeasures`, ADR 0021 §1), else its first run's.
    const tailOf = (source: string): Measures[] => learnedMeasures<Measures>(entries).filter((m) => m.source === source).sort((a, b) => (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0));
    const keepDay = (id: string, day: string, rows: unknown[][]) => {
      const file = samples.get(id);
      if (file && !file.days.includes(day) && (file.days.length === 0 || day > file.days.at(-1)!)) samples.set(id, appendSample(file, day, rows));
    };
    // The facts `fresh` is told from (main.ts fileFacts): the file's sha256, its export time, the load before its day.
    const last: Record<string, { slot: string; sha256: string }> = {};
    for (const [id, b] of Object.entries(before)) last[id] = { slot: b.slot, sha256: sha256(new Uint8Array(readFileSync(b.file))) };
    const lastBefore = new Map<string, Record<string, { slot: string; sha256: string }>>();
    const factsOf = (dayDoc: FlowDocument, id: string, d: Day, sha: string): FileFacts | undefined => {
      const fresh = gateChecksOf(dayDoc, id)?.fresh;
      const exported = d.files[id]?.exported_at;
      if (!fresh || fresh === 'off' || !exported) return undefined;
      const previous = lastBefore.get(d.slot)?.[id];
      return { sha256: sha, exported, ...(previous ? { previous } : {}) };
    };

    const entries: LogEntry[] = [];
    const manifests: Record<string, RunManifest> = {};
    const posture: Record<string, PostureMark> = {};
    const origin = `build:${doc.id}`;
    const nonce = (day: string, k: number) => createHash('sha256').update(`${origin}|${day}|${k}`).digest('hex').slice(0, 32);
    const t0 = Date.now();
    const policies = await policiesHash(doc.policies ?? null);
    // Each day's runs, in the order made: its first files', then each delivery's. Each day's files as the latest delivery
    // left them.
    const made = new Map<string, Made[]>();
    const filesNow = new Map<string, Day>();
    let defined = false;

    // The group's score and coverage, on a day its roll-up was published (ADR 0021 §3): what readers see of the product
    // now, after a run that published it or a release. The organisation is the one readers have then: a release names
    // only what changed, and never moves a name back.
    const markPosture = (day: string, published: readonly string[]) => {
      const units = bind.posture?.units;
      const org = bind.posture?.org;
      if (!units || !org || !published.includes(units)) return;
      const row = db.query(`SELECT p.score, p.coverage FROM ${units} p JOIN ${org} o ON o.org_unit_id = p.org_unit_id WHERE o.level = 'group' AND o.parent_id IS NULL`).rows[0];
      if (row) posture[day] = { score: row[0] === null ? null : Number(row[0]), coverage: row[1] === null ? null : Number(row[1]) };
    };

    /**
     * A run of a day, as the page runs one: its first files, a later delivery (`correction`, the run it corrects and the
     * file sent again), or the day again under rules changed since (`restates`, the run readers got and the change sets,
     * with the files and sources that run read). Each watched file measured and its claim told from the days recorded
     * before its day, under the rules in force on the day as known at `at` (ADR 0021 §5); the flow run, each watched step
     * told in the engine; recorded at `at`. A day's first run keeps its rows in the samples; a restated run publishes
     * nothing and its measures never reach the history.
     */
    const runOnce = async (d: Day, at: string, shas: Record<string, string>, opts: { correction?: { of: { run: number; manifest: string }; sources: string[] }; restates?: { of: string; changes: string[] }; sources?: Made['sources'] } = {}): Promise<void> => {
      const { correction, restates } = opts;
      const day = d.slot;
      const parameters = parametersOf(day);
      // The rules in force on the day as known now (ADR 0021 §5): what the claims are told from and the plan is made of.
      const dayDoc = forDay(flowDoc, parameters, at);
      const plan = await translate(dayDoc, parameters);
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
        const tail = tailOf(w);
        if (plan.nodes[node]!.op !== 'table') {
          // A watched step: the engine tells its claim, from its history, its tail pinned here and its sample.
          const before = tailBefore(tail, day);
          await pinFile(db, tailPath(w), before.length ? new TextEncoder().encode(canonicalJSON(before as unknown as Parameters<typeof canonicalJSON>[0])) : null);
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
        const file = shas[w] ? factsOf(dayDoc, w, d, shas[w]!) : undefined;
        const t = await loadClaim({ doc: dayDoc, source: w, flow: plan.flow.hash, base: known?.file ?? null, baseRef: known?.ref ?? null, tail, measures: m, settings, skip, levels, build, ...(rows && samples.get(w) ? { sample: samples.get(w)!, kept: rows } : {}), ...(file ? { file } : {}) });
        await pinFile(db, tailPath(w), t?.tail.length ? new TextEncoder().encode(canonicalJSON(t.tail as unknown as Parameters<typeof canonicalJSON>[0])) : null);
        if (t) (claims.push(t.claim), told.push(t.claim));
      }
      let entry: LogEntry;
      const read = { ...(opts.sources ?? sources) };
      try {
        const r = await runFlow(db, flowDoc, { smaltdb: SMALTDB, parameters, data: null, asOf: at, ...(claims.length ? { claims } : {}), ...(Object.keys(tell).length ? { tell } : {}), sources: read, ...(correction ? { correction } : {}), ...(restates ? { restates } : {}) });
        if (!correction && !restates) {
          for (const m of r.measures ?? []) {
            const rows = kept.get(m.source);
            if (rows) keepDay(m.source, m.slot, rows);
          }
          for (const [id, rows] of Object.entries(r.kept ?? {})) {
            const m = r.measures?.find((x) => x.source === id);
            if (m && !isSource(id)) keepDay(id, m.slot, rows);
          }
        }
        manifests[r.hash] = r.manifest;
        const typed = db.query('SELECT plan FROM _smaltfl_plans WHERE hash = ?', [r.manifest.plan]).rows[0];
        const typedPlan = typed ? (JSON.parse(String(typed[0])) as FlowPlan) : null;
        const held = r.holds.length > 0;
        const keys = held && typedPlan ? stagedKeys(r.manifest, heldOutputs(typedPlan, r.holds)) : {};
        const files = r.manifest.nodes.filter((n) => n.file).map((n) => ({ source: n.origin, ...n.file! }));
        const inputs = inputsOf(r.manifest);
        entry = {
          smaltflLog: 1, origin, seq: entries.length, kind: 'run', at, by: { card: null, as: 'build' },
          about: {
            run: r.run, manifest: r.hash, load: day, outcome: restates ? 'restated' : held ? 'held' : 'ok', files, data: null, day,
            inputs,
            // A later delivery of its day (ADR 0021 §2): the run it corrects and the files sent again.
            ...(r.manifest.correction ? { correction: r.manifest.correction } : {}),
            // The run it restates and the change sets it ran under (ADR 0021 §5).
            ...(r.manifest.restates ? { restates: r.manifest.restates } : {}),
            // With several watched sources, every load it read (ADR 0010 §7), as the page records it: a load it read and
            // didn't hold passes its pause, and a delivery supersedes the loads it no longer reads.
            ...(typedPlan && byLoad(typedPlan.publish) ? { loads: [...loadsOf(typedPlan, r.manifest).values()] } : {}),
            ...(held ? { holds: r.holds, waiting: r.waiting, keys } : {}),
            // A restated run's measures aren't the history's (ADR 0021 §5).
            ...(r.measures?.length && !restates ? { measures: r.measures } : {}),
            ...(told.length || r.told?.length ? { claims: [...told, ...(r.told ?? [])] } : {}),
          } as unknown as JSONValue,
          reason: null, amends: null, nonce: nonce(day, entries.length),
        };
        const contents = Object.fromEntries(Object.entries(r.manifest.outputs).map(([n, o]) => [n, o.content]));
        made.set(day, [...(made.get(day) ?? []), { run: r.run, manifest: r.hash, inputs, holds: r.holds, keys, at, ok: !held, contents, files: d, sources: read, ...(restates ? { restates } : {}) }]);
        if (!restates) markPosture(day, r.published);
        const said = [...new Set(r.holds.filter((h) => h.by !== 'restated').map((h) => `${h.by === 'checks' ? '' : `${h.by}:`}${h.origin}`))];
        console.log(`${day}${correction ? ` (${correction.sources.join(', ')} sent again)` : restates ? ' (again, under rules changed since)' : ''}: ${said.length ? `held (${said.join(', ')})` : held ? 'restated' : 'ok'}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      } catch (e) {
        if (correction || restates) throw e;
        const error = e instanceof Error ? e.message : String(e);
        entry = { smaltflLog: 1, origin, seq: entries.length, kind: 'run', at, by: { card: null, as: 'build' }, about: { run: null, load: day, outcome: 'failed', error }, reason: null, amends: null, nonce: nonce(day, entries.length) };
        console.log(`${day}: failed: ${error}`);
      }
      entries.push(entry);
    };

    /**
     * A decision of the story (ADR 0021 §6), by its principal at its time, about a day's first files or one of its
     * deliveries: checked against the flow's policies, recorded as the page records one (a decision a held load on a
     * flow that watches several datasets, Q-193), and, to publish, released in the engine, the release recorded beside it.
     */
    const decideOnce = async (day: string, n: number, at: string, by: string, option: DecideAbout['option'], reason: string | null): Promise<void> => {
      const said = `${day}'s ${n ? `delivery ${n}` : 'first files'}`;
      const target = made.get(day)?.filter((x) => !x.restates)[n];
      if (!target) throw new Error(`${storyPath}: a decision about ${said}, which weren't run`);
      if (!target.holds.length) throw new Error(`${storyPath}: a decision about ${said}, which nothing held`);
      if (option !== 'asis' && option !== 'dont') throw new Error(`${storyPath}: a decision about ${said} to ${option}: the recorder publishes as is or keeps back`);
      const may = checkDecision(doc.policies, by, option);
      if (!may.allowed) throw new Error(`${storyPath}: ${by} may not decide ${said}: ${may.reason}`);
      const loads = heldLoadsOf(target.holds);
      const abouts: DecideAbout[] = loads.length
        ? loadDecisions({ run: target.run, manifest: target.manifest, inputs: target.inputs, loads, option, scope: 'day', policies, rule: may.rule ?? null })
        : [{ day, run: target.run, manifest: target.manifest, inputs: target.inputs, outputs: target.keys, option, scope: 'day', policies, rule: may.rule ?? null }];
      const decided = abouts.map((about) => {
        const e: LogEntry = { smaltflLog: 1, origin, seq: entries.length, kind: 'decide', at, by: { card: null, as: by }, about: about as unknown as JSONValue, reason, amends: null, nonce: nonce(day, entries.length) };
        entries.push(e);
        return e;
      });
      console.log(`${day}: ${by} decided ${said}: ${option}${loads.length > 1 ? ` (${loads.length} loads)` : ''}`);
      if (option !== 'asis') return;
      const keys = loads.length ? keysForLoads(target.keys, target.holds, loads) : target.keys;
      const leaf = entryLeaf(decided[0]!);
      const out = await releaseRun(db, { run: target.run, manifest: target.manifest, keys, option, actor: by, reason, decision: leaf, ...(loads.length ? { loads: decided.map((e) => ({ load: (e.about as unknown as DecideAbout).load!, option, actor: by, reason, decision: entryLeaf(e) })) } : {}) });
      const about: ReleaseAbout = { run: target.run, manifest: target.manifest, outputs: keys, decision: decided[0]!.seq, ...(loads.length ? { decisions: decided.map((e) => e.seq) } : {}), leaf, outcome: out.outcome, why: out.why };
      entries.push({ smaltflLog: 1, origin, seq: entries.length, kind: 'release', at, by: { card: null, as: by }, about: about as unknown as JSONValue, reason: null, amends: null, nonce: nonce(day, entries.length) });
      if (out.outcome !== 'applied') throw new Error(`${storyPath}: the release of ${said} was refused: ${out.why}`);
      markPosture(day, out.published);
    };

    // ---------------------------------------------------------------- the rules over time (ADR 0021 §5)

    /**
     * What readers got of a day, by the record so far (ADR 0021 §1, §5): the latest of its runs that was published (it
     * passed, a release published it, or a restatement made it what readers got, published where it passed), else its
     * latest run sent; with whether it was published.
     */
    const gotOf = (day: string): { made: Made; published: boolean } | null => {
      const released = new Set(entries.flatMap((e) => (e.kind === 'release' && (e.about as unknown as ReleaseAbout).outcome === 'applied' ? [(e.about as unknown as ReleaseAbout).manifest] : [])));
      const ticked = restatedRuns(entries);
      let got: { made: Made; published: boolean } | null = null;
      for (const m of made.get(day) ?? []) {
        if (m.restates) {
          if (ticked.has(m.manifest)) got = { made: m, published: ticked.get(m.manifest)! };
          continue;
        }
        const published = m.ok || released.has(m.manifest);
        if (published || !got?.published) got = { made: m, published };
      }
      return got;
    };
    /** The change sets a restatement took up. */
    const restatedChanges = (): Set<string> => new Set(entries.flatMap((e) => (e.kind === 'restate' ? (e.about as unknown as RestateAbout).changes : [])));
    /** The days a change set reaches: each day run so far, from its day, whose version readers got ran before it was
     * recorded, so under rules that didn't have it. */
    const reachedBy = (c: ChangeSet): string[] => [...made.keys()].filter((day) => {
      const g = day >= c.from ? gotOf(day) : null;
      return !!g && Date.parse(g.made.at) < Date.parse(c.recorded);
    }).sort();
    const changesKey = (ids: readonly string[]) => [...ids].sort().join(',');
    /** A day's latest run again under these change sets, and its outcome against what readers got (`restatedOutcome`). */
    const restatingOf = (day: string, ids: readonly string[]) => {
      const run = made.get(day)?.filter((m) => m.restates && changesKey(m.restates.changes) === changesKey(ids)).at(-1);
      const got = gotOf(day);
      if (!run || !got) return null;
      return { day, run, outcome: restatedOutcome({ published: got.published, holds: got.made.holds, contents: got.made.contents }, { holds: run.holds, contents: run.contents }) };
    };
    const restateEntry = (at: string, by: string, about: RestateAbout, reason: string | null) => {
      entries.push({ smaltflLog: 1, origin, seq: entries.length, kind: 'restate', at, by: { card: null, as: by }, about: about as unknown as JSONValue, reason, amends: null, nonce: nonce(`restate:${about.changes.join(',')}`, entries.length) });
    };

    /**
     * A change to the rules people set (ADR 0021 §5), in force from its day as known from when it was recorded: every run
     * after it is of the rules with it. The days it and every other change set no restatement took up reach run again
     * under the rules as known now, latest first, as the page runs them: each a restated run of the run readers got, with
     * its files and their sources. Where no day's outcome would change they are noted at once, by whoever made the change
     * (Q-199); else they wait for the story's restatement.
     */
    const changeOnce = async (c: ChangeSet, at: string): Promise<void> => {
      const taken = restatedChanges();
      const pending = changes.filter((x) => Date.parse(x.recorded) <= Date.parse(at) && !taken.has(x.id) && reachedBy(x).length > 0);
      const reached = [...new Set(pending.flatMap((x) => reachedBy(x)))].sort();
      if (!pending.some((x) => x.id === c.id) || !reached.length) {
        console.log(`${c.id}: in force from ${c.from}, as known from ${at}; it reaches no day already run`);
        return;
      }
      const ids = pending.map((x) => x.id);
      console.log(`${c.id}: in force from ${c.from}, as known from ${at}; ${reached.length} days already run again under it`);
      let t = Date.parse(at);
      for (const day of [...reached].reverse()) {
        const got = gotOf(day)!;
        const runAt = new Date((t += 1000)).toISOString();
        const shas = await pinDay(got.made.files, runAt, daily, true);
        await runOnce(got.made.files, runAt, shas, { restates: { of: got.made.manifest, changes: ids }, sources: got.made.sources });
      }
      const rows = reached.map((day) => restatingOf(day, ids)!);
      if (rows.every((x) => !x.outcome.changed)) {
        restateEntry(new Date(t + 1000).toISOString(), c.by, { changes: ids, from: pending.map((x) => x.from).sort()[0]!, days: [], kept: [], same: rows.map((x) => ({ day: x.day, manifest: x.run.manifest })) }, null);
        console.log(`${c.id}: no day's outcome would change; the ${rows.length} days are noted as the same`);
      } else console.log(`${c.id}: ${rows.filter((x) => x.outcome.changed).map((x) => x.day).join(', ')} would change, waiting for the restatement`);
    };

    /**
     * The story's restatement (ADR 0021 §5, Q-190), by its principal at its time: every day run again under its change
     * sets whose outcome would change is restated (readers get its restated run: published where it passes, not where
     * the new rules hold it) but those it keeps as readers had them; the days that come out the same are noted.
     */
    const restateOnce = async (r: StoryRestatement, at: string): Promise<void> => {
      const said = `the restatement under ${r.changes.join(', ')}`;
      const days = [...made.keys()].filter((day) => made.get(day)!.some((m) => m.restates && changesKey(m.restates.changes) === changesKey(r.changes))).sort();
      if (!days.length) throw new Error(`${storyPath}: ${said}: no day was run again under those change sets (they are restated together with any other the days were run under)`);
      const may = checkDecision(flowDoc.policies, r.by, 'asis');
      if (!may.allowed) throw new Error(`${storyPath}: ${r.by} may not restate days: ${may.reason}`);
      const rows = days.map((day) => restatingOf(day, r.changes)!);
      const changed = rows.filter((x) => x.outcome.changed);
      if (!changed.length) throw new Error(`${storyPath}: ${said} decides nothing: no day's outcome would change, and the days were noted at once`);
      const keep = new Set(r.keep ?? []);
      for (const d of keep) if (!changed.some((x) => x.day === d)) throw new Error(`${storyPath}: ${said} keeps ${d}, whose outcome wouldn't change`);
      const from = changes.filter((c) => r.changes.includes(c.id)).map((c) => c.from).sort()[0]!;
      restateEntry(at, r.by, {
        changes: [...r.changes], from,
        days: changed.filter((x) => !keep.has(x.day)).map((x) => ({ day: x.day, manifest: x.run.manifest, passes: x.outcome.passes })),
        kept: changed.filter((x) => keep.has(x.day)).map((x) => ({ day: x.day, manifest: x.run.manifest })),
        same: rows.filter((x) => !x.outcome.changed).map((x) => ({ day: x.day, manifest: x.run.manifest })),
      }, r.reason);
      console.log(`${r.by} restated ${changed.filter((x) => !keep.has(x.day)).map((x) => `${x.day} (${x.outcome.passes ? 'published' : 'held'})`).join(', ') || 'no day'}${keep.size ? `, kept ${[...keep].join(', ')}` : ''}; ${rows.length - changed.length} days the same`);
    };

    // The month in time order (ADR 0021 §6): each day's first run when its files arrived, each delivery when it arrived,
    // each decision when it was taken, each change to the rules when it was recorded, each restatement when decided.
    const dayOf = new Map(days.map((d) => [d.slot, d]));
    for (const ev of timelineOf(days.map((d) => d.slot), (day) => new Date(Date.parse(arrived(dayOf.get(day)!))).toISOString(), story)) {
      const at = new Date(Date.parse(ev.at)).toISOString();
      if (ev.kind === 'day') {
        const d = dayOf.get(ev.day)!;
        const shas = await pinDay(d, at);
        if (!defined && tables.length) await db.execAsync(tables.join(';\n'));
        defined = true;
        lastBefore.set(ev.day, { ...last });
        filesNow.set(ev.day, d);
        await runOnce(d, at, shas);
        for (const [id, sha] of Object.entries(shas)) last[id] = { slot: ev.day, sha256: sha };
      } else if (ev.kind === 'delivery') {
        // A later delivery (ADR 0021 §2): the day's files with the one sent again in its place, run as a correction of the
        // day's latest run, held until a decision.
        const f = delivered.find((x) => x.day === ev.day && x.n === ev.n);
        const now = filesNow.get(ev.day);
        const latest = made.get(ev.day)?.filter((x) => !x.restates).at(-1);
        if (!f) throw new Error(`${work}/loads.json has no file for ${ev.day}'s delivery ${ev.n}: was it written with --story?`);
        if (!now || !latest) throw new Error(`${storyPath}: ${ev.delivery.file} is sent again for ${ev.day} before the day's first run`);
        const d: Day = { slot: ev.day, files: { ...now.files, [f.source]: { file: f.file, rows: f.rows, exported_at: f.exported_at } } };
        filesNow.set(ev.day, d);
        const shas = await pinDay(d, at, [f.source]);
        await runOnce(d, at, shas, { correction: { of: { run: latest.run, manifest: latest.manifest }, sources: [f.source] } });
      } else if (ev.kind === 'decision') {
        const { day, by, option, reason } = ev.decision;
        await decideOnce(day, ev.n, at, by, option, reason);
      } else if (ev.kind === 'change') {
        await changeOnce(ev.change, at);
      } else {
        await restateOnce(ev.restatement, at);
      }
    }
    for (const c of changes) {
      if (!restatedChanges().has(c.id) && reachedBy(c).length) console.log(`${c.id}: the days it reaches wait for a restatement`);
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
    console.log(`${out}: ${entries.length} entries recorded, ${(size / 1e6).toFixed(2)} MB, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  } finally {
    db.close();
  }
}

await main();
