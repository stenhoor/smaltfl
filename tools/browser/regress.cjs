// Runs stop sets at several sizes in parallel, and says in one table what passed: the browser regression in one command.
//
//   node tools/browser/regress.cjs <appDir> <outDir> [set ...] [--devices phone,tablet,...] [--jobs N]
//
// Each set is a file in tools/browser/stops/ (by name, without .json) or a path; each set runs once at each device, as
// its own `tour.cjs` process (a set's stops share one page and run in order, so a set is never split). Up to --jobs run
// at once (default: the machine's cores). The longest jobs start first. Exit 1 if any job reported a problem.
//
//   node tools/browser/regress.cjs /tmp/app-estate /tmp/regress estate notebook split@desktop,tablet-wide,wide
//   node tools/browser/regress.cjs /tmp/app-estate /tmp/regress notebook --devices phone,desktop
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const devices = (flag('--devices') ?? 'phone,tablet,tablet-wide,desktop,wide').split(',');
const jobs = Number(flag('--jobs') ?? os.availableParallelism?.() ?? os.cpus().length);
const [appDir, outDir, ...sets] = args;
if (!appDir || !outDir || !sets.length) {
  console.error('usage: node tools/browser/regress.cjs <appDir> <outDir> <set> [set ...] [--devices a,b] [--jobs N]');
  process.exit(2);
}
const setPath = (s) => (fs.existsSync(s) ? path.resolve(s) : path.join(__dirname, 'stops', `${s}.json`));
const queue = [];
for (const spec of sets) {
  // `split@desktop,wide`: a set that only means something at some sizes (the desktop split is 960 px and up).
  const [s, only] = spec.split('@');
  const file = setPath(s);
  const stops = JSON.parse(fs.readFileSync(file, 'utf8')).length;
  for (const d of only ? only.split(',') : devices) queue.push({ set: path.basename(file, '.json'), file, device: d, stops });
}
// The longest first, so no long set is left to run alone at the end.
queue.sort((a, b) => b.stops - a.stops);

const started = Date.now();
const results = [];
let running = 0;
const runOne = (job) => new Promise((done) => {
  const out = path.join(path.resolve(outDir), `${job.set}-${job.device}`);
  const t0 = Date.now();
  const child = spawn(process.execPath, [path.join(__dirname, 'tour.cjs'), path.resolve(appDir), out, job.file], { env: { ...process.env, TOUR_DEVICE: job.device }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', (b) => (log += b));
  child.stderr.on('data', (b) => (log += b));
  child.on('close', (code) => {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'tour.log'), log);
    const line = log.split('\n').find((l) => l.startsWith('problems: ')) ?? `problems: the tour exited with ${code}`;
    const problems = line === 'problems: none' ? [] : line.slice('problems: '.length).split(' // ');
    results.push({ ...job, seconds: (Date.now() - t0) / 1000, problems, out });
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${job.set} @ ${job.device} (${job.stops} stops, ${((Date.now() - t0) / 1000).toFixed(0)} s)${problems.length ? `: ${problems.length} problem(s)` : ''}`);
    done();
  });
});

(async () => {
  console.log(`${queue.length} jobs (${sets.join(', ')} at ${devices.join(', ')}), ${jobs} at a time`);
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
  console.log(`\n${results.length - failed.length} of ${results.length} jobs passed in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  for (const r of failed) {
    console.log(`\n${r.set} @ ${r.device} (${r.out}):`);
    for (const p of r.problems) console.log(`  - ${p}`);
  }
  fs.writeFileSync(path.join(path.resolve(outDir), 'regress.json'), JSON.stringify(results, null, 1));
  process.exit(failed.length ? 1 : 0);
})();
