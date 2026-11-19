// The browser regression's jobs, and how they are dealt over several machines (ADR 0025, amended 2026-11-19): which
// jobs a choice of sets, demos and sizes makes, what each weighs, and which shard it is in. Pure, so the regression
// (regress.cjs) and its test (test/regress.test.ts) say the same.

/** What a set costs the engine, in seconds (sets.json): its runs on its own demo and on any other it goes to ("with"),
 * each at that demo's cost of a run. */
function engineSeconds(manifest, set) {
  const def = manifest.sets[set];
  return [[def.app, def.runs], ...Object.entries(def.with ?? {})].reduce((t, [a, n]) => t + n * (manifest.apps[a]?.run ?? 0), 0);
}

/**
 * The jobs a choice makes: a set at a size, with the sizes its page is also resized to. `sets` are the sets asked for
 * (`name` or `name@size,…`; all of the manifest's where none), `demos` narrows them to the sets on those demos, `sizes`
 * to those sizes; with `full` a set is a job at each of its sizes, else one job at its smallest, resized to the others.
 * `stopsOf(set)` is how many stops a set has. Throws on a set the manifest doesn't have.
 */
function jobsOf(manifest, stopsOf, { sets = null, demos = null, sizes = null, full = false } = {}) {
  const jobs = [];
  for (const spec of sets?.length ? sets : Object.keys(manifest.sets)) {
    const [name, sizesSaid] = spec.split('@');
    const set = name.replace(/^.*[\\/]/, '').replace(/\.json$/, '');
    const def = manifest.sets[set];
    if (!def) throw new Error(`no set "${set}": the sets are ${Object.keys(manifest.sets).join(', ')}`);
    if (demos && !demos.includes(def.app)) continue;
    // The set's own sizes, in the manifest's order (the smallest first), narrowed by what was asked.
    const asked = sizesSaid ? sizesSaid.split(',') : sizes;
    const at = manifest.sizes.filter((d) => (def.sizes ?? manifest.sizes).includes(d) && (!asked || asked.includes(d)));
    if (!at.length) continue;
    const stops = stopsOf(set);
    const job = (device, sweep) => jobs.push({ id: `${set}@${device}`, set, app: def.app, device, sweep, stops, budget: def.runs, with: def.with ?? {}, weight: weightOf({ engineSeconds: engineSeconds(manifest, set), stops, sweeps: sweep.length, run: manifest.apps[def.app]?.run ?? 0 }) });
    if (full) for (const d of at) job(d, []);
    else job(at[0], at.slice(1));
  }
  return jobs;
}

/**
 * What a job weighs: about the seconds it takes on a session's machine with four jobs side by side. What its runs cost
 * the engine (sets.json: a set's runs times its demo's cost of a run), and a little a stop for what the page does
 * between them: more on a demo whose runs cost more (its pages are the larger ones: `run`, its demo's cost of a run),
 * and more for each size the page is also resized to. Fitted to the whole run of 2026-11-19 (35 sets, each resized to
 * the other four sizes: a mean error of 10 seconds a set, 38 at most), and only ever compared with another job's.
 */
function weightOf({ engineSeconds, stops, sweeps, run }) {
  return ENGINE * engineSeconds + STOP * stops * (1 + SWEEP * sweeps) * (1 + run / 3);
}
const ENGINE = 0.9;
const STOP = 0.29;
const SWEEP = 0.3;

/**
 * The jobs dealt into `n` shards: the heaviest first, each to the shard that weighs least so far (the lowest-numbered
 * of equals), so the shards take about as long as each other. Every job is in exactly one shard, and the same jobs give
 * the same shards on every machine: a job is known by its `id`, and equal weights are ordered by it.
 */
function shardsOf(jobs, n) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`shards: ${n} isn't a number of shards`);
  const shards = Array.from({ length: n }, () => ({ weight: 0, jobs: [] }));
  const dealt = [...jobs].sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const job of dealt) {
    let least = shards[0];
    for (const s of shards) if (s.weight < least.weight) least = s;
    least.jobs.push(job);
    least.weight += job.weight;
  }
  return shards.map((s) => s.jobs);
}

/** A shard as said on the command line, "2/4": which one, of how many. Null where it isn't one. */
function shardSaid(text) {
  const m = /^(\d+)\/(\d+)$/.exec(text ?? '');
  if (!m) return null;
  const [k, n] = [Number(m[1]), Number(m[2])];
  return k >= 1 && k <= n ? { k, n } : null;
}

/** What is wrong with a dealing of `jobs`: a job in no shard, or in two. Nothing, as `shardsOf` deals them. */
function dealingProblems(jobs, shards) {
  const seen = new Map();
  for (const [i, s] of shards.entries()) for (const j of s) seen.set(j.id, [...(seen.get(j.id) ?? []), i + 1]);
  const out = [];
  for (const j of jobs) {
    const at = seen.get(j.id) ?? [];
    if (at.length === 0) out.push(`${j.id} is in no shard`);
    if (at.length > 1) out.push(`${j.id} is in shards ${at.join(' and ')}`);
  }
  if (seen.size > new Set(jobs.map((j) => j.id)).size) out.push('a shard holds a job that wasn\'t dealt');
  return out;
}

module.exports = { engineSeconds, jobsOf, weightOf, shardsOf, shardSaid, dealingProblems };
