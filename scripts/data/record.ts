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
 *   was published, which the month's trend band draws; and, from its scorecards, the checks the score is a share of that
 *   day and the applications failing each control (ADR 0024 §6), with the controls' names where the list says which
 *   dataset names them: what the month says moved the score.
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
 *   readers got (`restates`), held until a restatement, never feeding the history. The story's restatement decides them,
 *   at its time, by its principal (Q-190): every day whose outcome would change is restated but those it keeps, the rest
 *   noted as the same (`restatedOutcome`, core/month.ts); where no day's outcome would change, it signs them off as the
 *   same (Q-199 as the maintainer answered it on 2026-11-14, ADR 0022 §1: never noted at once). The page reads the change
 *   sets from the flow the build ships.
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
import { byLoad, heldLoadsOf, heldOutputs, inputsOf, keysForLoads, learnedMeasures, levelsOf, loadClaim, loadDecisions, loadKey, loadsOf, skipOf, stagedKeys, tailPath, type Claim, type DecideAbout, type HistoryRef, type Hold, type Inputs, type ReleaseAbout } from '../../src/core/hold.js';
import { donorIdOf, levelOf, missingFor, repairDocument, type Repair } from '../../src/core/fill.js';
import type { Story } from '../../src/core/story.js';
import { entryLeaf, type JSONValue, type LogEntry } from '../../src/core/log.js';
import { settingsFor, tailBefore, type Measures } from '../../src/core/measures.js';
import { MONTH_FORMAT, restatedOutcome, restatedRuns, type MonthFile, type PostureMark, type RestateAbout } from '../../src/core/month.js';
import type { FileFacts } from '../../src/core/news.js';
import { isPublish2, type FlowPlan } from '../../src/core/plan.js';
import { policiesHash, type RunManifest } from '../../src/core/manifest.js';
import { checkDecision } from '../../src/core/policy.js';
import { fillStepOf, type ChangeSet } from '../../src/core/document.js';
import { withRoles } from '../../src/core/deciding.js';
import { storyProblems, timelineOf, type StoryFile, type StoryFill, type StoryRestatement } from '../../src/core/timeline.js';
import { donorBinding, pinnedDdl, type Binding, type DataBindings } from '../../examples/sources.js';
import { readAsOf } from '../../src/core/ontology.js';
import { csvHeader, readAsIn } from '../../src/core/columns.js';
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
  /** The claims its watched files were given, and each file's story as told for them: what a fill of it is worked out
   * from, and runs again with (ADR 0023 §5). */
  claims: Claim[];
  stories: Record<string, Story>;
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
  const bind = readJSON<DataBindings & { posture?: { units?: string; org?: string; apps?: string; controls?: string } }>(arg(args, 'bind') ?? bindingsPath(flowPath));
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
    // A column a file names otherwise from a day on (ADR 0022 §2, Q-146): each source's table declares the file's name
    // under the rules a run reads, defined again where that differs from how it stands.
    const tableReadAs = new Map<string, string>();
    // Each source's file as last pinned, its header where it is a CSV file: a mapping is declared only where the day's
    // file gives its name, and a file back on the column's own name is read as declared.
    const headers = new Map<string, string[]>();
    const defineTables = async (d: FlowDocument): Promise<void> => {
      for (const [id, b] of Object.entries(bind.sources)) {
        if (!doc.sources.some((x) => x.id === id)) continue;
        const readAs = readAsIn(readAsOf(d.ontology, id), headers.get(id) ?? null);
        const key = JSON.stringify(readAs);
        if ((tableReadAs.get(id) ?? '[]') === key) continue;
        await db.execAsync(`DROP EXTERNAL TABLE IF EXISTS ${(b as Binding).table}`);
        await db.execAsync(pinnedDdl(b as Binding, readAs));
        tableReadAs.set(id, key);
      }
    };
    // Each source's file as pinned now: what a fill decided after later days ran puts back once its own day's are run.
    const pinnedNow = new Map<string, string>();
    /** The donor tables defined: each reads whatever file is pinned under its donor's name now. */
    const donorTables = new Set<string>();
    const pinDay = async (d: Day, at: string, ids: readonly string[] = daily, keep = false): Promise<Record<string, string>> => {
      const shas: Record<string, string> = {};
      for (const id of ids) {
        const f = d.files[id];
        const b = bind.sources[id];
        if (!f || !b || !doc.sources.some((x) => x.id === id)) continue;
        const bytes = new Uint8Array(readFileSync(f.file));
        const sha = sha256(bytes);
        await pinFile(db, b.file, bytes, sha);
        pinnedNow.set(id, f.file);
        if (/^(csv|tsv)$/i.test((b as Binding).format)) headers.set(id, csvHeader(new TextDecoder().decode(bytes.subarray(0, 1 << 16))));
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
    const controls: Record<string, string> = {};
    const origin = `build:${doc.id}`;
    const nonce = (day: string, k: number) => createHash('sha256').update(`${origin}|${day}|${k}`).digest('hex').slice(0, 32);
    const t0 = Date.now();
    const policies = await policiesHash(doc.policies ?? null);
    // Each day's runs, in the order made: its first files', then each delivery's. Each day's files as the latest delivery
    // left them.
    const made = new Map<string, Made[]>();
    const filesNow = new Map<string, Day>();
    let defined = false;

    // The group's score and coverage, on a day its roll-up was published (ADR 0021 §3), after a run that published it or
    // a release: read from the run's own versions, by key, so a day published once a later one is out marks its own
    // roll-up, the names staying on the later day (Q-51, ADR 0022 §1).
    const markPosture = (day: string, published: readonly string[], keyOf: (name: string) => string | undefined) => {
      const units = bind.posture?.units;
      const org = bind.posture?.org;
      if (!units || !org || !published.includes(units)) return;
      const table = (name: string) => {
        const key = keyOf(name);
        const found = key ? db.query('SELECT tbl FROM _smaltfl_versions WHERE key = ?', [key]).rows[0] : undefined;
        return found ? `"${String(found[0])}"` : name;
      };
      const row = db.query(`SELECT p.score, p.coverage FROM ${table(units)} p JOIN ${table(org)} o ON o.org_unit_id = p.org_unit_id WHERE o.level = 'group' AND o.parent_id IS NULL`).rows[0];
      if (!row) return;
      const mark: PostureMark = { score: row[0] === null ? null : Number(row[0]), coverage: row[1] === null ? null : Number(row[1]) };
      // What the score is a share of that day, and the applications failing each control (ADR 0024 §6), from the
      // product's scorecards: what the month says moved the score between two days. A product whose scorecards don't
      // count their checks has the score alone.
      const apps = bind.posture?.apps;
      if (apps) {
        try {
          const sums = db.query(`SELECT sum(applying), sum(with_evidence), sum(failing) FROM ${table(apps)}`).rows[0];
          if (sums && sums[0] !== null) mark.checks = { applying: Number(sums[0]), evidence: Number(sums[1] ?? 0), failing: Number(sums[2] ?? 0) };
          const failing: Record<string, number> = {};
          for (const [list] of db.query(`SELECT failing_controls FROM ${table(apps)} WHERE failing > 0`).rows) {
            for (const id of String(list ?? '').split(/\s+/).filter(Boolean)) failing[id] = (failing[id] ?? 0) + 1;
          }
          if (mark.checks) mark.failing = Object.fromEntries(Object.entries(failing).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
        } catch {
          // Scorecards of another shape: the score and its coverage alone.
        }
      }
      posture[day] = mark;
      // The controls' names, as the product last published them, where the data list says which dataset names them.
      const named = bind.posture?.controls;
      if (named) {
        try {
          for (const [id, name] of db.query(`SELECT control_id, name FROM ${table(named)}`).rows) if (id !== null && name !== null) controls[String(id)] = String(name);
        } catch {
          // No such dataset in this run: the ids stand for themselves.
        }
      }
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
      const stories: Record<string, Story> = {};
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
        if (t) (claims.push(t.claim), told.push(t.claim), (stories[w] = t.story));
      }
      let entry: LogEntry;
      const read = { ...(opts.sources ?? sources) };
      try {
        await defineTables(forDay(flowDoc, parameters, at));
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
        made.set(day, [...(made.get(day) ?? []), { run: r.run, manifest: r.hash, inputs, holds: r.holds, keys, at, ok: !held, contents, files: d, sources: read, ...(restates ? { restates } : {}), claims: [...claims], stories }]);
        if (!restates) markPosture(day, r.published, (n) => r.manifest.outputs[n]?.key);
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
    /**
     * A day's decisions recorded, one a held load, each saying whose it is (ADR 0025 §6): those whose loads lead first,
     * then those that only follow, each citing the decision it carries. As recorded, in order.
     */
    const recordDecisions = (abouts: readonly DecideAbout[], holds: readonly Hold[], day: string, at: string, by: string, reason: string | null): LogEntry[] => {
      const recorded = new Map<string, LogEntry>();
      return withRoles(doc, holds, abouts).map(({ about, follows }) => {
        const led = follows ? recorded.get(loadKey(follows)) : undefined;
        const full: DecideAbout = led ? { ...about, carried: { seq: led.seq, leaf: entryLeaf(led) } } : about;
        const e: LogEntry = { smaltflLog: 1, origin, seq: entries.length, kind: 'decide', at, by: { card: null, as: by }, about: full as unknown as JSONValue, reason, amends: null, nonce: nonce(day, entries.length) };
        entries.push(e);
        if (about.load) recorded.set(loadKey(about.load), e);
        return e;
      });
    };

    /**
     * A fill of the story (ADR 0023 §5), as the page makes one: the version's own files pinned again, the donor day's
     * file of the source pinned as its donor and judged by its own claim (told as the page tells a donor's, from the
     * history before the donor's day), the missing part the held file's story and claim say (the whole day where its
     * rows are wrong, not short), the derived run staged and recorded, then decided by load and released. What was
     * pinned before is put back, so the month goes on as it was.
     */
    const fillOnce = async (day: string, n: number, at: string, by: string, reason: string | null, fill: StoryFill, target: Made, said: string): Promise<void> => {
      const step = fillStepOf(flowDoc, fill.source);
      if (!step) throw new Error(`${storyPath}: a fill of ${said}: ${fill.source} has no fill step`);
      // The file's load first: its decision is the one the release cites (a fill is about one load); the steps built from
      // it, holding the day too, are decided by the same choice (Q-193).
      const held0 = heldLoadsOf(target.holds);
      const loads = [...held0.filter((l) => l.source.toLowerCase() === fill.source.toLowerCase()), ...held0.filter((l) => l.source.toLowerCase() !== fill.source.toLowerCase())];
      const holding = [...new Set(loads.map((l) => l.source).filter(isSource))];
      if (holding.length !== 1 || holding[0]!.toLowerCase() !== fill.source.toLowerCase()) throw new Error(`${storyPath}: a fill of ${said} fills ${fill.source}, and ${holding.join(', ') || 'no file'} holds it: fills are for one file at a time`);
      const donorDay = filesNow.get(fill.from);
      const donorFile = donorDay?.files[fill.source];
      if (!donorFile) throw new Error(`${storyPath}: a fill of ${said} from ${fill.from}, whose files weren't run`);
      const claim = target.claims.find((c) => c.source.toLowerCase() === fill.source.toLowerCase()) ?? null;
      const story = target.stories[fill.source];
      const missing = story ? missingFor(story, claim, step.time) : null;
      if (!missing) throw new Error(`${storyPath}: a fill of ${said}: ${fill.source}'s story doesn't say a part or a day to fill (it fills a day held as wrong)`);
      const b = bind.sources[fill.source] as Binding | undefined;
      if (!b) throw new Error(`${storyPath}: a fill of ${said}: ${fill.source} has no binding`);
      const saved = new Map(pinnedNow);
      const parameters = parametersOf(day);
      await pinDay(target.files, at, daily, true);
      await defineTables(forDay(flowDoc, parameters, at));
      // The donor's file under its donor binding, and its claim as the page tells a donor's (main.ts donorClaim2).
      const donor = donorBinding(fill.source, b);
      const bytes = new Uint8Array(readFileSync(donorFile.file));
      const sha = sha256(bytes);
      await pinFile(db, donor.file, bytes, sha);
      if (!donorTables.has(donor.table)) (await db.execAsync(pinnedDdl(donor)), donorTables.add(donor.table));
      const dParameters = parametersOf(fill.from);
      const dDoc = forDay(flowDoc, dParameters, at);
      const dPlan = await translate(dDoc, dParameters);
      const node = dPlan.nodes.findIndex((x) => x.op === 'table' && x.origin === fill.source);
      const known = bases.get(fill.source);
      const settings = node >= 0 ? settingsFor(dPlan, node, known?.file ?? null, doc.steps) : null;
      if (!settings) throw new Error(`${storyPath}: a fill of ${said}: ${fill.source} isn't measured`);
      const m = await measureLoad(db, donor.table, settings);
      const told = await loadClaim({ doc: dDoc, source: fill.source, flow: dPlan.flow.hash, base: known?.file ?? null, baseRef: known?.ref ?? null, tail: tailOf(fill.source), measures: m, settings, skip: skipOf(entries, period), levels: levelsOf(entries, fill.source), build });
      if (!told) throw new Error(`${storyPath}: a fill of ${said}: ${fill.from}'s ${fill.source} can't be judged`);
      const donorClaim = { ...told.claim, source: donorIdOf(fill.source) } as Claim;
      const repair: Repair = {
        kind: 'fill', step: step.id, source: fill.source, missing,
        donor: { rule: fill.rule ?? 'nearest', direction: fill.from < day ? 'before' : 'after', day: fill.from, file: { path: `loads/${basename(donorFile.file)}`, sha256: sha, bytes: bytes.length }, claim: donorClaim as never },
      };
      // The watched steps told again by the engine, of the filled day, as a run tells them.
      const plan = await translate(forDay(flowDoc, parameters, at), parameters);
      const tell: Record<string, { skip: string[]; levels: ReturnType<typeof levelsOf> }> = {};
      for (const w of watches) if (plan.nodes.some((x) => x.origin === w && x.op !== 'table')) tell[w] = { skip: skipOf(entries, period), levels: levelsOf(entries, w) };
      const read = { ...target.sources, [donorIdOf(fill.source)]: { path: repair.donor!.file.path, ...(bind.generate ? { from: bind.generate } : {}), at, sha256: sha } };
      const r = await runFlow(db, repairDocument(flowDoc, repair), { smaltdb: SMALTDB, parameters, data: null, asOf: at, claims: [...target.claims, donorClaim], ...(Object.keys(tell).length ? { tell } : {}), sources: read, stage: true, from: { run: target.run, manifest: target.manifest } });
      manifests[r.hash] = r.manifest;
      const typed = db.query('SELECT plan FROM _smaltfl_plans WHERE hash = ?', [r.manifest.plan]).rows[0];
      const typedPlan = typed ? (JSON.parse(String(typed[0])) as FlowPlan) : null;
      if (!typedPlan) throw new Error(`${storyPath}: a fill of ${said}: its plan wasn't kept`);
      const fails = r.holds.some((x) => x.by !== 'story') || (r.derived?.holds ?? []).some((x) => x.by !== 'derived');
      if (fails) throw new Error(`${storyPath}: the fill of ${said} from ${fill.from} can't go: ${[...r.holds, ...(r.derived?.holds ?? [])].filter((x) => x.by !== 'story' && x.by !== 'derived').map((x) => `${x.origin}: ${x.said}`).join('; ')}`);
      const keys = stagedKeys(r.manifest, heldOutputs(typedPlan, [...r.holds, ...(r.derived?.holds ?? [])]));
      const files = r.manifest.nodes.filter((x) => x.file).map((x) => ({ source: x.origin, ...x.file! }));
      // The derived run in the record, as the page records one (fills.ts derivedAbout): the held run it repairs and how.
      const filledNode = r.manifest.nodes.find((x) => x.origin === step.id);
      entries.push({
        smaltflLog: 1, origin, seq: entries.length, kind: 'run', at, by: { card: null, as: 'build' },
        about: {
          run: r.run, manifest: r.hash, outcome: 'derived', day, inputs: inputsOf(r.manifest), holds: [...r.holds, ...(r.derived?.holds ?? [])], waiting: r.waiting, keys,
          from: { run: target.run, manifest: target.manifest }, repair, ...(filledNode?.rows !== undefined ? { rows: filledNode.rows } : {}), load: day, files, data: null,
        } as unknown as JSONValue,
        reason: null, amends: null, nonce: nonce(day, entries.length),
      });
      // One decision a held load (Q-193), each carrying the repair and the derived run whose versions go out.
      const may = checkDecision(doc.policies, by, 'fill');
      if (!may.allowed) throw new Error(`${storyPath}: ${by} may not fill ${said}: ${may.reason}`);
      const derived = { run: r.run, manifest: r.hash, keys };
      const abouts: DecideAbout[] = loads.length
        ? loadDecisions({ run: target.run, manifest: target.manifest, inputs: target.inputs, loads, option: 'fill', scope: 'day', policies, rule: may.rule ?? null }).map((x) => ({ ...x, repair, derived }))
        : [{ day, run: target.run, manifest: target.manifest, inputs: target.inputs, outputs: target.keys, option: 'fill', scope: 'day', policies, rule: may.rule ?? null, repair, derived }];
      const decided = recordDecisions(abouts, target.holds, day, at, by, reason);
      const leaf = entryLeaf(decided[0]!);
      const from = { run: target.run, manifest: target.manifest };
      const ofFile = loads.length ? [decided[0]!] : [];
      const out = await releaseRun(db, { run: r.run, manifest: r.hash, keys, option: 'fill', actor: by, reason, decision: leaf, from, repair, ...(ofFile.length ? { loads: ofFile.map((e) => ({ load: (e.about as unknown as DecideAbout).load!, option: 'fill' as const, actor: by, reason, decision: entryLeaf(e) })) } : {}) });
      const about: ReleaseAbout = { run: r.run, manifest: r.hash, outputs: keys, decision: decided[0]!.seq, ...(ofFile.length ? { decisions: ofFile.map((e) => e.seq) } : {}), leaf, outcome: out.outcome, why: out.why, from, repair, filled: out.filled ?? 0 };
      entries.push({ smaltflLog: 1, origin, seq: entries.length, kind: 'release', at, by: { card: null, as: by }, about: about as unknown as JSONValue, reason: null, amends: null, nonce: nonce(day, entries.length) });
      if (out.outcome !== 'applied') throw new Error(`${storyPath}: the release of the fill of ${said} was refused: ${out.why}`);
      markPosture(day, out.published, (name) => r.manifest.outputs[name]?.key);
      console.log(`${day}: ${by} filled ${said} from ${fill.from} (${'all' in missing ? 'the whole day' : 'its missing part'}), ${out.filled ?? 0} rows carried in`);
      // The files pinned before, back as they were.
      for (const [id, file] of saved) {
        if (pinnedNow.get(id) === file) continue;
        const sb = bind.sources[id] as Binding | undefined;
        if (!sb) continue;
        const again = new Uint8Array(readFileSync(file));
        await pinFile(db, sb.file, again, sha256(again));
        pinnedNow.set(id, file);
        if (/^(csv|tsv)$/i.test(sb.format)) headers.set(id, csvHeader(new TextDecoder().decode(again.subarray(0, 1 << 16))));
      }
    };

    /**
     * The level a story's Accept records (ADR 0009 amendment 1 S6, Q-57, Q-86), as the page works it out (main.ts
     * `acceptFor`): of the one file holding the day, by its story and claim, from the day decided. Later days are judged
     * at it (`levelsOf`), once its release is applied.
     */
    const levelToAccept = (target: Made, day: string, said: string): NonNullable<DecideAbout['level']> => {
      const holding = [...new Set(heldLoadsOf(target.holds).map((l) => l.source).filter(isSource))];
      if (holding.length !== 1) throw new Error(`${storyPath}: an Accept of ${said}, which ${holding.join(', ') || 'no file'} holds: a new level is accepted for one file at a time`);
      const source = holding[0]!;
      const story = Object.entries(target.stories).find(([id]) => id.toLowerCase() === source.toLowerCase())?.[1];
      const claim = target.claims.find((c) => c.source.toLowerCase() === source.toLowerCase()) ?? null;
      const level = story ? levelOf(story, claim, target.holds, day, source) : null;
      if (!level) throw new Error(`${storyPath}: an Accept of ${said}: ${source}'s cause isn't a new level`);
      return level;
    };

    const decideOnce = async (day: string, n: number, at: string, by: string, option: DecideAbout['option'], reason: string | null, fill?: StoryFill): Promise<void> => {
      const said = `${day}'s ${n ? `delivery ${n}` : 'first files'}`;
      const target = made.get(day)?.filter((x) => !x.restates)[n];
      if (!target) throw new Error(`${storyPath}: a decision about ${said}, which weren't run`);
      if (!target.holds.length) throw new Error(`${storyPath}: a decision about ${said}, which nothing held`);
      if (option === 'fill' && fill) return fillOnce(day, n, at, by, reason, fill, target, said);
      if (option !== 'asis' && option !== 'dont' && option !== 'accept') throw new Error(`${storyPath}: a decision about ${said} to ${option}: the recorder publishes as is, accepts a new level, keeps back or fills`);
      const may = checkDecision(doc.policies, by, option);
      if (!may.allowed) throw new Error(`${storyPath}: ${by} may not decide ${said}: ${may.reason}`);
      const level = option === 'accept' ? levelToAccept(target, day, said) : null;
      const loads = heldLoadsOf(target.holds);
      const abouts: DecideAbout[] = loads.length
        ? loadDecisions({ run: target.run, manifest: target.manifest, inputs: target.inputs, loads, option, scope: 'day', policies, rule: may.rule ?? null, level })
        : [{ day, run: target.run, manifest: target.manifest, inputs: target.inputs, outputs: target.keys, option, scope: 'day', policies, rule: may.rule ?? null, ...(level ? { level } : {}) }];
      const decided = recordDecisions(abouts, target.holds, day, at, by, reason);
      console.log(`${day}: ${by} decided ${said}: ${option}${level ? ` (${level.source}'s level from ${level.from}: ${level.metrics.join(', ')})` : ''}${loads.length > 1 ? ` (${loads.length} loads)` : ''}`);
      if (option !== 'asis' && option !== 'accept') return;
      const keys = loads.length ? keysForLoads(target.keys, target.holds, loads) : target.keys;
      const leaf = entryLeaf(decided[0]!);
      const out = await releaseRun(db, { run: target.run, manifest: target.manifest, keys, option, actor: by, reason, decision: leaf, ...(loads.length ? { loads: decided.map((e) => ({ load: (e.about as unknown as DecideAbout).load!, option, actor: by, reason, decision: entryLeaf(e) })) } : {}) });
      const about: ReleaseAbout = { run: target.run, manifest: target.manifest, outputs: keys, decision: decided[0]!.seq, ...(loads.length ? { decisions: decided.map((e) => e.seq) } : {}), leaf, outcome: out.outcome, why: out.why };
      entries.push({ smaltflLog: 1, origin, seq: entries.length, kind: 'release', at, by: { card: null, as: by }, about: about as unknown as JSONValue, reason: null, amends: null, nonce: nonce(day, entries.length) });
      if (out.outcome !== 'applied') throw new Error(`${storyPath}: the release of ${said} was refused: ${out.why}`);
      const ran = db.query('SELECT manifest FROM _smaltfl_runs WHERE id = ?', [target.run]).rows[0];
      const outputs = ran ? (JSON.parse(String(ran[0])) as RunManifest).outputs : {};
      markPosture(day, out.published, (n) => outputs[n]?.key);
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
    /** The days a change set reaches: each day run so far, from its day (to its last, ADR 0022 §1), whose version
     * readers got ran before it was recorded, so under rules that didn't have it. */
    const reachedBy = (c: ChangeSet): string[] => [...made.keys()].filter((day) => {
      const g = day >= c.from && (c.until === undefined || day <= c.until) ? gotOf(day) : null;
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
     * its files and their sources. They wait for the story's restatement, which signs them off where no day's outcome
     * would change (Q-199, ADR 0022 §1).
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
      const changed = rows.filter((x) => x.outcome.changed);
      console.log(`${c.id}: ${changed.length ? `${changed.map((x) => x.day).join(', ')} would change` : `no day's outcome would change (${rows.length} the same)`}, waiting for the restatement`);
    };

    /**
     * The story's restatement (ADR 0021 §5, Q-190), by its principal at its time: every day run again under its change
     * sets whose outcome would change is restated (readers get its restated run: published where it passes, not where
     * the new rules hold it) but those it keeps as readers had them; the days that come out the same are noted. Where
     * none would change, it signs them all off as the same (Q-199, ADR 0022 §1), and keeps none.
     */
    const restateOnce = async (r: StoryRestatement, at: string): Promise<void> => {
      const said = `the restatement under ${r.changes.join(', ')}`;
      const days = [...made.keys()].filter((day) => made.get(day)!.some((m) => m.restates && changesKey(m.restates.changes) === changesKey(r.changes))).sort();
      if (!days.length) throw new Error(`${storyPath}: ${said}: no day was run again under those change sets (they are restated together with any other the days were run under)`);
      const may = checkDecision(flowDoc.policies, r.by, 'asis');
      if (!may.allowed) throw new Error(`${storyPath}: ${r.by} may not restate days: ${may.reason}`);
      const rows = days.map((day) => restatingOf(day, r.changes)!);
      const changed = rows.filter((x) => x.outcome.changed);
      const keep = new Set(r.keep ?? []);
      for (const d of keep) if (!changed.some((x) => x.day === d)) throw new Error(`${storyPath}: ${said} keeps ${d}, whose outcome wouldn't change`);
      const from = changes.filter((c) => r.changes.includes(c.id)).map((c) => c.from).sort()[0]!;
      restateEntry(at, r.by, {
        changes: [...r.changes], from,
        days: changed.filter((x) => !keep.has(x.day)).map((x) => ({ day: x.day, manifest: x.run.manifest, passes: x.outcome.passes })),
        kept: changed.filter((x) => keep.has(x.day)).map((x) => ({ day: x.day, manifest: x.run.manifest })),
        same: rows.filter((x) => !x.outcome.changed).map((x) => ({ day: x.day, manifest: x.run.manifest })),
      }, r.reason);
      console.log(changed.length ? `${r.by} restated ${changed.filter((x) => !keep.has(x.day)).map((x) => `${x.day} (${x.outcome.passes ? 'published' : 'held'})`).join(', ') || 'no day'}${keep.size ? `, kept ${[...keep].join(', ')}` : ''}; ${rows.length - changed.length} days the same` : `${r.by} signed off ${rows.length} days as the same`);
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
        // The day's other files as they were, pinned again: a later day may have run since (a file sent again days after,
        // as the tour's encryption file is, ADR 0023 §1), and its files are the ones pinned. They keep what the day's run
        // said of where each came from; the file sent again says when it arrived.
        await pinDay(d, at, daily.filter((id) => id !== f.source), true);
        const shas = await pinDay(d, at, [f.source]);
        await runOnce(d, at, shas, { correction: { of: { run: latest.run, manifest: latest.manifest }, sources: [f.source] }, sources: { ...latest.sources, [f.source]: sources[f.source]! } });
      } else if (ev.kind === 'decision') {
        const { day, by, option, reason, fill } = ev.decision;
        await decideOnce(day, ev.n, at, by, option, reason, fill);
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
      ...(Object.keys(controls).length ? { controls: Object.fromEntries(Object.entries(controls).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) } : {}),
    };
    writeFileSync(out, JSON.stringify(file) + '\n');
    const size = readFileSync(out).length;
    const marked = Object.values(posture);
    const scored = marked.length ? `; the posture marked on ${marked.length} days, its checks counted on ${marked.filter((p) => p.checks).length}, ${Object.keys(controls).length} controls named` : '';
    console.log(`${out}: ${entries.length} entries recorded, ${(size / 1e6).toFixed(2)} MB, in ${((Date.now() - t0) / 1000).toFixed(0)} s${scored}`);
  } finally {
    db.close();
  }
}

await main();
