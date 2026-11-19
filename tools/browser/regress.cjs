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
// a person at that size would reach it: what CI runs on main, a size a job a demo, and what a change to a screen's
// layout runs on the set it touches (ADR 0018).
//
//   --full                 replay each set at every one of its sizes (no resizing)
//   --sizes phone,desktop  only these sizes (replayed with --full; else the first replayed, the others resized to)
//   --apps DIR             where the built demos are, a folder a demo (DIR/tour, DIR/larkspur, …);
//                          default node_modules/.cache/smaltfl/apps
//   --out DIR              where each job's log, metrics and screenshots go; default node_modules/.cache/smaltfl/regress
//   --demos tour,estate    only the sets on these demos (sets.json's "apps")
//   --shard 2/4            only the second of four shards: the chosen jobs dealt over four machines, about as long as
//                          each other, every job in exactly one (shards.cjs). What CI runs, a shard a job
//   --build                build the demos the chosen sets need first (npm run build:app; seconds once their data is
//                          cached), up to three side by side where their data has to be made
//   --build-only           build them and stop
//   --build-jobs N         how many demos are built at once (default: three, fewer on fewer cores)
//   --data tour,feeds|all  make these demos' data where it isn't made yet, no app, and stop
//   --stored               with --build, --build-only or --data, in a workflow: take each demo's data from the store
//                          where it has it (store.cjs: made once, by any run on any branch). Outside a workflow it
//                          changes nothing
//   --keep                 with --data and one demo, in a workflow: make sure the store has the demo's data. Nothing is
//                          made or taken where it has; else the data is made here and packed, and the workflow is told
//                          to keep it. What a workflow's first job runs, so every job after it takes the data made
//   --shots all|fail|none  screenshots: of every stop, of the stops that failed (default), or none
//   --jobs N               how many run at once (default: the machine's cores)
//   --timed                fail when the whole run took longer than the manifest's budget.seconds (four cores of a
//                          session's machine; CI's are slower, and its job has a time limit of its own)
//   --list                 print the sets with what each costs (the chosen ones, where some are), and stop
//
// The manifest is also the budget (ADR 0025 §5). Each set says how many runs the engine may make for it (`runs`: a day
// opened is a run, and so is a decision's, a what-if's, a reload's); a set that makes more fails, and so does a stops
// file the manifest doesn't list. Each demo says what a run costs on it (`run`, seconds), and the sum over every set,
// its runs times its demo's cost, may not pass `budget.engineSeconds`: a stop that opens another day is paid for by
// trimming one somewhere, or by raising the budget in a change the maintainers review. A set whose stops go to another
// demo of the same site (a stop's `page`, ADR 0026 §6) says the runs it may make there too (`with`: a demo's name and
// its runs), counted and held to apart, at that demo's cost. Exit 1 on any problem.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const plan = require('./shards.cjs');
const store = require('./store.cjs');

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
const stored = has('--stored');
const keep = has('--keep');
const timed = has('--timed');
const list = has('--list');
const only = flag('--sizes')?.split(',').filter(Boolean) ?? null;
const demos = flag('--demos')?.split(',').filter(Boolean) ?? null;
const dataSaid = flag('--data');
const shardText = flag('--shard');
const appsDir = path.resolve(flag('--apps') ?? path.join(repo, 'node_modules', '.cache', 'smaltfl', 'apps'));
const outDir = path.resolve(flag('--out') ?? path.join(repo, 'node_modules', '.cache', 'smaltfl', 'regress'));
const shots = flag('--shots') ?? 'fail';
const cores = os.availableParallelism?.() ?? os.cpus().length;
const jobs = Number(flag('--jobs') ?? cores);
// A demo's data is made on one core for most of its time (the month recorded a day after the day before), and three
// are Larkspur's and long: three side by side is what four cores carry.
const buildJobs = Number(flag('--build-jobs') ?? Math.max(1, Math.min(3, cores - 1)));
const unknown = args.find((a) => a.startsWith('--'));
const usage = (why) => {
  console.error(`${why}\nusage: node tools/browser/regress.cjs [set[@size,…] …] [--full] [--sizes a,b] [--demos a,b] [--shard K/N] [--apps DIR] [--out DIR] [--build] [--build-only] [--build-jobs N] [--data a,b|all] [--stored] [--keep] [--shots all|fail|none] [--jobs N] [--timed] [--list]`);
  process.exit(2);
};
if (unknown) usage(`no option ${unknown}`);
for (const s of only ?? []) if (!manifest.sizes.includes(s)) usage(`no size "${s}": the sizes are ${manifest.sizes.join(', ')}`);
const demoNames = Object.keys(manifest.apps);
for (const d of demos ?? []) if (!manifest.apps[d]) usage(`no demo "${d}": the demos are ${demoNames.join(', ')}`);
const dataOf = dataSaid === null ? null : dataSaid === 'all' ? demoNames : dataSaid.split(',').filter(Boolean);
for (const d of dataOf ?? []) if (!manifest.apps[d]) usage(`no demo "${d}": the demos are ${demoNames.join(', ')}`);
if (dataOf && !dataOf.length) usage('--data needs the demos whose data to make, or "all"');
if (keep && dataOf?.length !== 1) usage('--keep goes with --data and one demo: the workflow keeps one demo\'s data a job');
const shard = shardText === null ? null : plan.shardSaid(shardText);
if (shardText !== null && !shard) usage(`no shard "${shardText}": a shard is said as 2/4, the second of four`);
if (!Number.isInteger(buildJobs) || buildJobs < 1) usage('--build-jobs needs a number of builds, one or more');

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
const engineSeconds = (s) => plan.engineSeconds(manifest, s);
const spent = Object.keys(manifest.sets).reduce((t, s) => t + engineSeconds(s), 0);
if (spent > manifest.budget.engineSeconds) wrong.push(`sets.json: the sets' runs come to ${Math.round(spent)} engine seconds, over the ${manifest.budget.engineSeconds} the regression is held to (budget.engineSeconds): trim a set's days, or raise the budget in a change the maintainers review`);
if (wrong.length) {
  for (const w of wrong) console.error(`regress: ${w}`);
  process.exit(1);
}

// ---- The jobs: a set at a size, with the sizes its page is also resized to.
let queue = [];
try {
  const stopsOf = (set) => JSON.parse(fs.readFileSync(path.join(stopsDir, `${set}.json`), 'utf8')).length;
  queue = plan.jobsOf(manifest, stopsOf, { sets: args, demos, sizes: only, full }).map((j) => ({ ...j, file: path.join(stopsDir, `${j.set}.json`) }));
} catch (e) {
  usage(e.message);
}
// One shard of them, where asked: the jobs dealt as every machine deals them, each job in exactly one shard (held to
// here as well as by the test, since a job in no shard is a check nobody runs).
let shardWeights = null;
if (shard) {
  const dealt = plan.shardsOf(queue, shard.n);
  const amiss = plan.dealingProblems(queue, dealt);
  if (amiss.length) {
    for (const w of amiss) console.error(`regress: the shards are wrong: ${w}`);
    process.exit(1);
  }
  shardWeights = dealt.map((js) => Math.round(js.reduce((t, j) => t + j.weight, 0)));
  queue = dealt[shard.k - 1];
}
// The longest first, so no long set is left to run alone at the end.
queue.sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : 1));
const narrowed = args.length > 0 || !!only || !!demos || !!shard || full;

if (list) {
  if (!narrowed) {
    console.log('set          demo      sizes                                  runs  engine s');
    for (const [s, def] of Object.entries(manifest.sets)) console.log(`${s.padEnd(12)} ${def.app.padEnd(9)} ${(def.sizes ?? manifest.sizes).join(',').padEnd(38)} ${String(def.runs).padStart(4)}  ${String(Math.round(engineSeconds(s))).padStart(7)}${Object.entries(def.with ?? {}).map(([a, n]) => `  and ${n} on ${a}`).join('')}`);
  } else {
    console.log('set          demo      at           resized to                   runs  engine s  weight');
    for (const j of queue) console.log(`${j.set.padEnd(12)} ${j.app.padEnd(9)} ${j.device.padEnd(12)} ${(j.sweep.join(',') || '-').padEnd(28)} ${String(j.budget).padStart(4)}  ${String(Math.round(engineSeconds(j.set))).padStart(7)}  ${String(Math.round(j.weight)).padStart(6)}${Object.entries(j.with).map(([a, n]) => `  and ${n} on ${a}`).join('')}`);
    console.log(`\n${queue.length} jobs${shard ? `, shard ${shard.k} of ${shard.n} (the shards weigh ${shardWeights.join(', ')})` : ''}: ${queue.reduce((t, j) => t + j.stops, 0)} stops, ${queue.reduce((t, j) => t + j.budget + Object.values(j.with).reduce((u, n) => u + n, 0), 0)} runs, a weight of ${Math.round(queue.reduce((t, j) => t + j.weight, 0))}`);
  }
  console.log(`\n${Object.keys(manifest.sets).length} sets, ${Object.values(manifest.sets).reduce((t, d) => t + runsOf(d).reduce((u, [, n]) => u + n, 0), 0)} runs, ${Math.round(spent)} of ${manifest.budget.engineSeconds} engine seconds; the whole run is held to ${manifest.budget.seconds} s on ${manifest.budget.cores} cores`);
  process.exit(0);
}

// ---- The demos, built where asked: each by `npm run build:app`, into its folder.
/** A command run to its end, with what it said; said here too as it goes, a line at a time under `tag`, where one is given. */
const ran = (argv, tag = null) => new Promise((done) => {
  const child = spawn(process.execPath, argv, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  let line = '';
  const take = (b) => {
    out += b;
    if (!tag) return;
    const lines = (line + b).split('\n');
    line = lines.pop();
    for (const l of lines) if (l.trim()) console.log(`${tag}: ${l}`);
  };
  child.stdout.on('data', take);
  child.stderr.on('data', take);
  child.on('close', (status) => done({ status, out }));
});
/** `go` over `items`, at most `n` at once. */
const atMost = async (items, n, go) => {
  const left = [...items];
  const out = [];
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, left.length)) }, async () => {
    while (left.length) out.push(await go(left.shift()));
  }));
  return out;
};
/**
 * A demo built (or, with `dataOnly`, its data made and no more). In a workflow, with `--stored` its data is taken from
 * the store first where the store has it; with `--keep` nothing is made or taken where the store has it, and data that
 * had to be made here is packed for the workflow to keep there.
 */
const buildOne = async (app, dataOnly) => {
  const t0 = Date.now();
  const how = manifest.apps[app].build;
  let key = null;
  let taken = false;
  try {
    if (keep && store.inWorkflow()) {
      const had = await store.kept(app, how);
      key = had.key;
      if (had.run) {
        console.log(`store: the data of ${app} (${key.slice(0, 12)}) is kept already, by run ${had.run}`);
        return { app, ok: true, made: false, key, kept: null };
      }
      console.log(`store: the data of ${app} (${key.slice(0, 12)}) isn't kept yet: ${had.why}`);
    } else if (stored) {
      const from = await store.restore(app, how);
      key = from.key;
      taken = from.state === 'taken';
      const of = `the data of ${app} (${key.slice(0, 12)})`;
      console.log(taken ? `store: ${of} taken from run ${from.run}${from.bytes ? `, ${(from.bytes / 1e6).toFixed(0)} MB` : ''}, in ${from.seconds.toFixed(0)} s` : from.state === 'here' ? `store: ${of} is here already` : `store: ${of} is made here: ${from.why}`);
    }
  } catch (e) {
    console.log(`store: the data of ${app} is made here: ${e.message}`);
  }
  // What the build says is said here as it goes where data alone is made, and in a workflow: a demo's data can take a
  // quarter of an hour, and a log that says nothing for that long reads as a job that hangs.
  const aloud = dataOnly || !!process.env.CI;
  const r = await ran([path.join(repo, 'scripts', 'build-app.mjs'), ...how, ...(dataOnly ? ['--data-only'] : ['--out', path.join(appsDir, app)])], aloud ? app : null);
  if (r.status !== 0) {
    console.error(`regress: the demo "${app}" didn't build${aloud ? '' : `:\n${r.out.split('\n').slice(-12).join('\n')}`}`);
    return { app, ok: false };
  }
  const made = !/reused the generated data/.test(r.out);
  console.log(`${dataOnly ? 'the data of' : 'built'} ${app} in ${((Date.now() - t0) / 1000).toFixed(0)} s (${made ? 'its data made' : taken ? 'its data taken from the store' : 'its data reused'})`);
  // Asked to keep it, and the store had none: packed for the workflow to keep, whether it was made just now or found here.
  let kept = null;
  if (keep && key && store.inWorkflow()) {
    kept = await store.pack(app, key);
    console.log(`store: the data of ${app} packed to keep as ${kept.name} (${(kept.bytes / 1e6).toFixed(0)} MB)`);
  }
  return { app, ok: true, made, key, kept };
};
/** The demos built side by side, the costliest first; exit 1 where one didn't build, once the others have. */
const buildAll = async (apps, dataOnly) => {
  const order = [...apps].sort((a, b) => manifest.apps[b].run - manifest.apps[a].run);
  const built = await atMost(order, buildJobs, (app) => buildOne(app, dataOnly));
  if (built.some((b) => !b.ok)) process.exit(1);
  return built;
};

(async () => {
  // Data alone, for the demos named. With one demo named, a workflow is told where the data is (`dir`) and, with
  // `--keep`, whether there is data for it to keep in the store (`keep`: it had to be made here), under what name and
  // in which file.
  if (dataOf) {
    const one = dataOf.length === 1;
    const built = await buildAll(dataOf, true);
    if (process.env.GITHUB_OUTPUT && one) {
      const { kept, key } = built[0];
      const dir = store.dirOf(key ?? (await store.keyOf(manifest.apps[dataOf[0]].build)));
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `dir=${path.relative(repo, dir)}\nkeep=${kept ? 'true' : 'false'}\nname=${kept?.name ?? ''}\npath=${kept ? path.relative(repo, kept.path) : ''}\n`);
    }
    process.exit(0);
  }
  // A set's own demo, and any other demo of the same site its stops go to (a set's "with": a stop's "page", ADR 0026 §6).
  const apps = [...new Set(queue.flatMap((j) => [j.app, ...Object.keys(j.with)]))];
  if (build) await buildAll(apps, false);
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

  console.log(`${queue.length} jobs${shard ? ` (shard ${shard.k} of ${shard.n})` : ''}, ${jobs} at a time${full ? ', each set replayed at each size' : ''}`);
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
  const whole = !narrowed;
  let late = false;
  if (whole && took > manifest.budget.seconds && (timed || !process.env.CI)) {
    late = timed;
    console.log(`\n${timed ? 'FAIL' : 'note'}: the regression took ${took.toFixed(0)} s, and it is held to ${manifest.budget.seconds} s on ${manifest.budget.cores} cores (tools/browser/sets.json, ADR 0025 §5)${os.cpus().length < manifest.budget.cores ? `; this machine has ${os.cpus().length}` : ''}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'regress.json'), JSON.stringify({ seconds: took, full, ...(shard ? { shard: `${shard.k}/${shard.n}` } : {}), results }, null, 1));
  process.exit(failed.length || late ? 1 : 0);
})();
