// The browser regression in one command, in minutes (ADR 0025): every stop set the manifest lists (sets.json), each on
// the demo it is written for, as many at once as the machine has cores, one table of what passed.
//
//   npm run regress                              builds the demos (their data cached), then every set
//   npm run regress -- overview tour             those sets alone
//   node tools/browser/regress.cjs [set[@size,…] …] [options]
//
// By default a set is replayed once, at the smallest size it is held to (a phone), and after each stop the same page
// is taken to the other sizes by resizing its window, its layout checked at each (tour.cjs's TOUR_SWEEP): the engine
// runs each day once, not once a size. `--full` replays every set at every one of its sizes, each in its own page, as
// a person at that size would reach it: what CI runs, a size a job, and what a change to a screen's layout runs on the
// set it touches (ADR 0018).
//
//   --full                 replay each set at every one of its sizes (no resizing)
//   --sizes phone,desktop  only these sizes (replayed with --full; else the first replayed, the others resized to)
//   --apps DIR             where the built demos are, a folder a demo (DIR/tour, DIR/larkspur, …);
//                          default node_modules/.cache/smaltfl/apps
//   --out DIR              where each job's log, metrics and screenshots go; default node_modules/.cache/smaltfl/regress
//   --build                build the demos the chosen sets need first (npm run build:app; seconds once their data is cached)
//   --build-only           build them and stop (CI builds them once, for every job that runs them)
//   --shots all|fail|none  screenshots: of every stop, of the stops that failed (default), or none
//   --jobs N               how many run at once (default: the machine's cores)
//   --timed                fail when the whole run took longer than the manifest's budget.seconds (four cores of a
//                          session's machine; CI's are slower, and its job has a time limit of its own)
//   --list                 print the sets with what each costs, and stop
//
// The manifest is also the budget (ADR 0025 §5). Each set says how many runs the engine may make for it (`runs`: a day
// opened is a run, and so is a decision's, a what-if's, a reload's); a set that makes more fails, and so does a stops
// file the manifest doesn't list. Each demo says what a run costs on it (`run`, seconds), and the sum over every set,
// its runs times its demo's cost, may not pass `budget.engineSeconds`: a stop that opens another day is paid for by
// trimming one somewhere, or by raising the budget in a change the maintainers review. A set whose stops go to another
// demo of the same site (a stop's `page`, ADR 0026 §6) says the runs it may make there too (`with`: a demo's name and
// its runs), counted and held to apart, at that demo's cost. Exit 1 on any problem.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repo = path.join(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'sets.json'), 'utf8'));
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v ?? '';
};
const has = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
};
const full = has('--full');
const buildOnly = has('--build-only');
const build = has('--build') || buildOnly;
const timed = has('--timed');
const list = has('--list');
const only = flag('--sizes')?.split(',').filter(Boolean) ?? null;
const appsDir = path.resolve(flag('--apps') ?? path.join(repo, 'node_modules', '.cache', 'smaltfl', 'apps'));
const outDir = path.resolve(flag('--out') ?? path.join(repo, 'node_modules', '.cache', 'smaltfl', 'regress'));
const shots = flag('--shots') ?? 'fail';
const jobs = Number(flag('--jobs') ?? os.availableParallelism?.() ?? os.cpus().length);
const unknown = args.find((a) => a.startsWith('--'));
const usage = (why) => {
  console.error(`${why}\nusage: node tools/browser/regress.cjs [set[@size,…] …] [--full] [--sizes a,b] [--apps DIR] [--out DIR] [--build] [--build-only] [--shots all|fail|none] [--jobs N] [--timed] [--list]`);
  process.exit(2);
};
if (unknown) usage(`no option ${unknown}`);
for (const s of only ?? []) if (!manifest.sizes.includes(s)) usage(`no size "${s}": the sizes are ${manifest.sizes.join(', ')}`);

// ---- The manifest, held to itself before anything runs.
const stopsDir = path.join(__dirname, 'stops');
const wrong = [];
const onDisk = fs.readdirSync(stopsDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
for (const s of onDisk) if (!manifest.sets[s]) wrong.push(`tools/browser/stops/${s}.json isn't in tools/browser/sets.json: list it there with its demo and the runs it may make`);
for (const [s, def] of Object.entries(manifest.sets)) {
  if (!onDisk.includes(s)) wrong.push(`sets.json lists "${s}", and there is no tools/browser/stops/${s}.json`);
  if (!manifest.apps[def.app]) wrong.push(`sets.json: "${s}" is on the demo "${def.app}", which it doesn't list`);
  for (const [a, n] of Object.entries(def.with ?? {})) {
    if (!manifest.apps[a]) wrong.push(`sets.json: "${s}" also goes to the demo "${a}" ("with"), which it doesn't list`);
    if (!Number.isInteger(n) || n < 1) wrong.push(`sets.json: "${s}" needs the runs the engine may make on "${a}" ("with": { "${a}": runs })`);
  }
  if (!Number.isInteger(def.runs) || def.runs < 1) wrong.push(`sets.json: "${s}" needs "runs", the runs the engine may make for it`);
  for (const d of def.sizes ?? []) if (!manifest.sizes.includes(d)) wrong.push(`sets.json: "${s}" names the size "${d}"`);
}
// What a set costs: its runs on its own demo, and on any other it goes to, each at that demo's cost of a run.
const runsOf = (def) => [[def.app, def.runs], ...Object.entries(def.with ?? {})];
const engineSeconds = (s) => runsOf(manifest.sets[s]).reduce((t, [a, n]) => t + n * (manifest.apps[a]?.run ?? 0), 0);
const spent = Object.keys(manifest.sets).reduce((t, s) => t + engineSeconds(s), 0);
if (spent > manifest.budget.engineSeconds) wrong.push(`sets.json: the sets' runs come to ${Math.round(spent)} engine seconds, over the ${manifest.budget.engineSeconds} the regression is held to (budget.engineSeconds): trim a set's days, or raise the budget in a change the maintainers review`);
if (wrong.length) {
  for (const w of wrong) console.error(`regress: ${w}`);
  process.exit(1);
}

// ---- The jobs: a set at a size, with the sizes its page is also resized to.
const chosen = args.length ? args : Object.keys(manifest.sets);
const queue = [];
for (const spec of chosen) {
  const [name, sizesSaid] = spec.split('@');
  const set = path.basename(name, '.json');
  const def = manifest.sets[set];
  if (!def) usage(`no set "${set}": the sets are ${Object.keys(manifest.sets).join(', ')}`);
  // The set's own sizes, in the manifest's order (the smallest first), narrowed by what was asked.
  const asked = sizesSaid ? sizesSaid.split(',') : only;
  const sizes = manifest.sizes.filter((d) => (def.sizes ?? manifest.sizes).includes(d) && (!asked || asked.includes(d)));
  if (!sizes.length) continue;
  const file = path.join(stopsDir, `${set}.json`);
  const stops = JSON.parse(fs.readFileSync(file, 'utf8')).length;
  const job = (device, sweep) => queue.push({ set, app: def.app, file, device, sweep, stops, budget: def.runs, with: def.with ?? {}, weight: engineSeconds(set) + stops * 0.5 * (1 + sweep.length * 0.3) });
  if (full) for (const d of sizes) job(d, []);
  else job(sizes[0], sizes.slice(1));
}
// The longest first, so no long set is left to run alone at the end.
queue.sort((a, b) => b.weight - a.weight);

if (list) {
  console.log('set          demo      sizes                                  runs  engine s');
  for (const [s, def] of Object.entries(manifest.sets)) console.log(`${s.padEnd(12)} ${def.app.padEnd(9)} ${(def.sizes ?? manifest.sizes).join(',').padEnd(38)} ${String(def.runs).padStart(4)}  ${String(Math.round(engineSeconds(s))).padStart(7)}${Object.entries(def.with ?? {}).map(([a, n]) => `  and ${n} on ${a}`).join('')}`);
  console.log(`\n${Object.keys(manifest.sets).length} sets, ${Object.values(manifest.sets).reduce((t, d) => t + runsOf(d).reduce((u, [, n]) => u + n, 0), 0)} runs, ${Math.round(spent)} of ${manifest.budget.engineSeconds} engine seconds; the whole run is held to ${manifest.budget.seconds} s on ${manifest.budget.cores} cores`);
  process.exit(0);
}

// ---- The demos, built where asked: each by `npm run build:app`, into its folder.
// A set's own demo, and any other demo of the same site its stops go to (a set's "with": a stop's "page", ADR 0026 §6).
const apps = [...new Set(queue.flatMap((j) => [j.app, ...Object.keys(j.with)]))];
if (build) {
  for (const app of apps) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'build-app.mjs'), ...manifest.apps[app].build, '--out', path.join(appsDir, app)], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) {
      console.error(`regress: the demo "${app}" didn't build:\n${`${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').slice(-12).join('\n')}`);
      process.exit(1);
    }
    console.log(`built ${app} in ${((Date.now() - t0) / 1000).toFixed(0)} s (${(/reused the generated data/.test(r.stdout) ? 'its data reused' : 'its data made')})`);
  }
}
if (buildOnly) process.exit(0);
for (const app of apps) {
  if (!fs.existsSync(path.join(appsDir, app, 'page.html'))) {
    console.error(`regress: no built demo at ${path.join(appsDir, app)}: run with --build (npm run regress), or build it there (npm run build:app -- ${manifest.apps[app].build.join(' ')} --out ${path.join(appsDir, app)})`);
    process.exit(1);
  }
}

// The browser the tours drive: said once here, not once a job.
try {
  require.resolve('playwright');
} catch {
  console.error('regress: Playwright isn\'t installed where Node finds it (`require(\'playwright\')`): install it with its Chromium (npm install -g playwright && playwright install chromium, and NODE_PATH=$(npm root -g)); tools/README.md');
  process.exit(1);
}

const started = Date.now();
const results = [];
let running = 0;
const runOne = (job) => new Promise((done) => {
  const out = path.join(outDir, `${job.set}-${job.device}`);
  fs.rmSync(out, { recursive: true, force: true });
  const t0 = Date.now();
  const child = spawn(process.execPath, [path.join(__dirname, 'tour.cjs'), path.join(appsDir, job.app), out, job.file], { env: { ...process.env, TOUR_DEVICE: job.device, TOUR_SWEEP: job.sweep.join(','), TOUR_SHOTS: shots }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', (b) => (log += b));
  child.stderr.on('data', (b) => (log += b));
  child.on('close', (code) => {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'tour.log'), log);
    const lines = log.split('\n');
    const line = lines.find((l) => l.startsWith('problems: ')) ?? `problems: the tour exited with ${code}`;
    const problems = line === 'problems: none' ? [] : line.slice('problems: '.length).split(' // ');
    let cost = null;
    try {
      cost = JSON.parse((lines.find((l) => l.startsWith('cost: ')) ?? '').slice('cost: '.length));
    } catch {
      // A tour that stopped before its last line has no cost to hold it to; its exit is a problem above.
    }
    // The set held to the runs it may make: what keeps the regression from growing a day at a time.
    if (cost && cost.runs > job.budget) problems.push(`over its budget: the engine made ${cost.runs} runs and the set may make ${job.budget} (tools/browser/sets.json). Take a day out of the set, or raise its "runs" and keep the sum under budget.engineSeconds`);
    // The same on each other demo its stops go to: a demo the set doesn't say it goes to may make none.
    const elsewhere = Object.entries(cost?.with ?? {});
    for (const [a, n] of elsewhere) if (n > (job.with[a] ?? 0)) problems.push(`over its budget on ${a}: the engine made ${n} runs there and the set may make ${job.with[a] ?? 0} (tools/browser/sets.json, its "with"). Take a day out of the set, or raise its runs there and keep the sum under budget.engineSeconds`);
    const seconds = (Date.now() - t0) / 1000;
    const runs = cost ? cost.runs + elsewhere.reduce((t, [, n]) => t + n, 0) : null;
    results.push({ set: job.set, app: job.app, device: job.device, sweep: job.sweep, stops: job.stops, runs, budget: job.budget, ...(elsewhere.length ? { with: cost.with } : {}), seconds, problems, out });
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${job.set} @ ${job.device}${job.sweep.length ? ` + ${job.sweep.join(', ')}` : ''} (${job.stops} stops, ${cost?.runs ?? '?'} of ${job.budget} runs${Object.keys(job.with).map((a) => `, ${cost?.with?.[a] ?? 0} of ${job.with[a]} on ${a}`).join('')}, ${seconds.toFixed(0)} s)${problems.length ? `: ${problems.length} problem(s)` : ''}`);
    done();
  });
});

(async () => {
  console.log(`${queue.length} jobs, ${jobs} at a time${full ? ', each set replayed at each size' : ''}`);
  await new Promise((finished) => {
    const next = () => {
      if (!queue.length && running === 0) return finished();
      while (running < jobs && queue.length) {
        running++;
        runOne(queue.shift()).then(() => {
          running--;
          next();
        });
      }
    };
    next();
  });
  const failed = results.filter((r) => r.problems.length);
  const took = (Date.now() - started) / 1000;
  const runs = results.reduce((t, r) => t + (r.runs ?? 0), 0);
  console.log(`\n${results.length - failed.length} of ${results.length} jobs passed in ${took.toFixed(0)} s: ${results.reduce((t, r) => t + r.stops, 0)} stops, ${runs} runs of the engine`);
  for (const r of failed) {
    console.log(`\n${r.set} @ ${r.device} (${r.out}):`);
    for (const p of r.problems) console.log(`  - ${p}`);
  }
  // The whole run against the time it is held to on a session's machine: said there, a failure with --timed. CI's
  // machines are slower, and its job has a limit of its own (ci.yml).
  const whole = !args.length && !only && !full;
  let late = false;
  if (whole && took > manifest.budget.seconds && (timed || !process.env.CI)) {
    late = timed;
    console.log(`\n${timed ? 'FAIL' : 'note'}: the regression took ${took.toFixed(0)} s, and it is held to ${manifest.budget.seconds} s on ${manifest.budget.cores} cores (tools/browser/sets.json, ADR 0025 §5)${os.cpus().length < manifest.budget.cores ? `; this machine has ${os.cpus().length}` : ''}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'regress.json'), JSON.stringify({ seconds: took, full, results }, null, 1));
  process.exit(failed.length || late ? 1 : 0);
})();
