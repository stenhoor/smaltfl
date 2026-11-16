// Makes a generated flow's data in a folder (ADR 0010 §9, ADR 0021 §6): its data list's generator writes the daily
// files, the general builder measures a history and keeps a sample for each watch from the days before the loads, the
// first loads day's ranges and types are computed ahead (ADR 0019), and the month is recorded with its story. The app
// build makes it into its cache (scripts/build-app.mjs); the tour's answer key into a folder of its own, at the tests'
// scale (test/larkspur-tour.test.ts), from the command line:
//
//   node scripts/data/make.mjs --flow FLOW --work DIR [--variant NAME] [--more "--apps 650"]
//
// DIR is made empty first. `--variant` takes the data list's variant (its generator's arguments and story, ADR 0023 §2);
// `--more` adds arguments to the generator's.
import { build } from 'esbuild';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** What each watch's files are called: `history.json` for one watch, else `history.<watch>.json`; samples and ranges the
 * same way. */
export function dataNames(watches) {
  const one = watches.length === 1;
  return {
    historyName: (w) => (one ? 'history.json' : `history.${w}.json`),
    sampleName: (w) => (one ? 'sample.json' : `sample.${w}.json`),
    rangesName: (w) => (one ? 'ranges.json' : `ranges.${w}.json`),
  };
}

/**
 * Makes the data of `flowDoc` (read from `flowPath`) in `work`, an empty folder: `generate` writes the daily files and
 * loads.json (with `generateArgs`, and the story's later deliveries with `story`), every watch's history and sample
 * follow, then the first day's ranges and types, then the recorded month (month.json) at `commit`. Throws where a run
 * fails or a history isn't written.
 */
export async function makeData({ flowPath, flowDoc, work, generate, generateArgs = [], story = null, commit = 'dev' }) {
  // The recorded story's later deliveries are written by the generator too (ADR 0021 §6).
  execFileSync('node', [generate, work, ...generateArgs, ...(story ? ['--story', story] : [])], { stdio: 'inherit' });
  // One history a watch (ADR 0013 §5): a control's from its own files (base.<watch>.json, else base.json), a watched
  // step's from a run of the flow on each day's files.
  const watches = Object.keys(flowDoc.publish?.watch ?? {});
  const { historyName, sampleName, rangesName } = dataNames(watches);
  // The generator's fixed sources (an inventory), which a gate's scope rule reads beside each load (ADR 0014 §4).
  const generated = existsSync(join(work, 'loads.json')) ? JSON.parse(readFileSync(join(work, 'loads.json'), 'utf8')) : null;
  const fixedArgs = Object.entries((generated && !Array.isArray(generated) && generated.fixed) || {}).flatMap(([id, path]) => ['--fixed', `${id}=${path}`]);
  // Every watch keeps a sample beside its history, for the classifier (ADR 0014 §5, ADR 0015 §6: it runs wherever a
  // sample is kept, a gate or not).
  const sampled = watches.length > 0;
  // Every metric's range for the first loads day, computed ahead beside each history (ADR 0019): the day's own files,
  // as the history's loads list them.
  const firstLoad = generated && !Array.isArray(generated) ? generated.loads?.[0] : null;
  const nextOf = (w, base) => {
    if (!firstLoad?.files) return null;
    const listed = JSON.parse(readFileSync(base, 'utf8'));
    const shape = Array.isArray(listed) ? listed.at(-1) : null;
    if (!shape) return null;
    // The first day's files as the history's last day lists them: a fixed file is the same file.
    const files = shape.files ? { files: Object.fromEntries(Object.keys(shape.files).map((id) => [id, firstLoad.files[id]?.file ?? shape.files[id]])) } : {};
    if (shape.file !== undefined) return firstLoad.files[w] ? { slot: firstLoad.slot, file: firstLoad.files[w].file, ...files } : null;
    return { slot: firstLoad.slot, ...files };
  };
  // A watch's days: its own list (base.<watch>.json); for a watched step, the steps' (base.steps.json), where the
  // generator gives them fewer days than the files, since each is a run of the flow; else the files' (base.json).
  const isStep = (w) => flowDoc.steps.some((s) => s.id === w && s.dataset !== undefined);
  const baseOf = (w) => [`base.${w}.json`, ...(isStep(w) ? ['base.steps.json'] : []), 'base.json'].map((f) => join(work, f)).find((f) => existsSync(f)) ?? join(work, 'base.json');
  // Two histories at a time (each runs its days on every core); the longest first, the watched steps' (a run of the
  // flow a day) before any file's. The watched steps on the same days are measured from one run of the flow a day
  // (history.mjs --watch a,b,c), each still its own history.
  const groups = [];
  for (const w of watches) {
    const base = baseOf(w);
    const same = isStep(w) && watches.length > 1 ? groups.find((g) => g.step && g.base === base) : undefined;
    if (same) same.ws.push(w);
    else groups.push({ ws: [w], base, step: isStep(w) });
  }
  const runs = groups.map(({ ws, base, step }) => {
    const several = ws.length > 1;
    const name = (of) => (several ? of('{watch}') : of(ws[0]));
    const next = nextOf(ws[0], base);
    const ahead = next ? ['--next', JSON.stringify(next), '--ranges', join(work, name(rangesName))] : [];
    return { w: ws.join(', '), step, size: statSync(base).size, argv: ['scripts/data/history.mjs', '--flow', flowPath, '--watch', ws.join(','), '--files', base, ...fixedArgs, ...(sampled ? ['--sample', join(work, name(sampleName))] : []), ...ahead, join(work, name(historyName))] };
  }).sort((a, b) => Number(b.step) - Number(a.step) || b.size - a.size);
  await inParallel(runs, 2, ({ w, argv }) => new Promise((done, fail) => {
    const child = spawn('node', argv, { stdio: 'inherit' });
    child.on('close', (code) => (code === 0 ? done() : fail(new Error(`the history of ${w} failed (${code})`))));
  }));
  // The first loads day's types computed ahead (ADR 0019 amendment 2): one run of the flow on the day's files, every
  // source's (a daily one's first file, a fixed one's own), as the page runs it.
  if (firstLoad?.files && watches.length) {
    const files = { ...Object.fromEntries(Object.entries(firstLoad.files).map(([id, f]) => [id, f.file])), ...(generated.fixed ?? {}) };
    execFileSync('node', ['scripts/data/history.mjs', '--types', join(work, 'types.json'), '--flow', flowPath, '--next', JSON.stringify({ slot: firstLoad.slot, files })], { stdio: 'inherit' });
  }
  // The month recorded (ADR 0021 §6): every loads day run in order as the page runs one, each run recorded as the page
  // records one, at the story's time; the page draws the month from it and layers it under its own record.
  // With a story, its deliveries and decisions too, at their times.
  if (watches.length) execFileSync('node', ['scripts/data/record.mjs', '--flow', flowPath, '--work', work, '--build', commit, ...(story ? ['--story', story] : []), join(work, 'month.json')], { stdio: 'inherit' });
  // A run that ended without writing its history is a broken build, never a finished one the next build reuses.
  const unwritten = watches.filter((w) => !existsSync(join(work, historyName(w))));
  if (unwritten.length) throw new Error(`no history written for ${unwritten.join(', ')}: ${work} is left unfinished, and is made again`);
}

/** Runs `go` over `items`, at most `n` at a time. */
async function inParallel(items, n, go) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => {
    while (queue.length) await go(queue.shift());
  }));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const at = args.indexOf(`--${name}`);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const flowPath = flag('flow');
  const work = flag('work');
  if (!flowPath || !work) throw new Error('usage: node scripts/data/make.mjs --flow FLOW --work DIR [--variant NAME] [--more "ARGS"]');
  // The flow reader (scripts/flow.ts), bundled for Node as the app build bundles it: a folder's flow.json comes back
  // with its notebooks loaded and its steps derived (ADR 0011).
  const reader = `node_modules/.cache/smaltfl/flow.${process.pid}.mjs`;
  process.on('exit', () => rmSync(reader, { force: true }));
  await build({ entryPoints: ['scripts/flow.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile: reader, logLevel: 'warning' });
  const { readFlow } = await import(pathToFileURL(resolve(reader)).href);
  const listed = JSON.parse(readFileSync(flowPath.endsWith('.smaltfl.json') ? flowPath.replace(/\.smaltfl\.json$/, '.data.json') : join(dirname(flowPath), 'data.json'), 'utf8'));
  const variant = flag('variant');
  if (variant && !listed.variants?.[variant]) throw new Error(`${flowPath}'s data list has no variant ${variant}`);
  const bind = variant ? { ...listed, ...listed.variants[variant] } : listed;
  if (!bind.generate) throw new Error(`${flowPath}'s data list names no generator for its files`);
  const more = (flag('more') ?? '').split(/\s+/).filter(Boolean);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  await makeData({ flowPath, flowDoc: await readFlow(flowPath), work, generate: bind.generate, generateArgs: [...(bind.generateArgs ?? []), ...more], story: bind.story ?? null });
}
