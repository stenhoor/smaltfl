// The demos' generated data, made once and kept where every run of the repository's workflows can take it (ADR 0025,
// amended 2026-11-19).
//
// A demo's days, histories and recorded month take minutes to make (the tour's a quarter of an hour), and the app build
// already keeps them in a folder named by a hash of what makes them (scripts/build-app.mjs, `--data-key`). GitHub's
// cache is kept by branch: a branch can't read what another made, and main can't read a branch's, so the same data was
// made again by a branch's push, by its pull request and by main after the merge. Here each folder is kept as an
// artifact of the workflow run that made it, named by the demo and that hash (`nameOf`): artifacts are the
// repository's, whatever the branch, so a later run on any branch finds it by name and takes it. regress.cjs's `--keep` and `--stored` use it;
// outside a workflow nothing is asked and the data is made here, as always.
//
// Only what a run of this repository itself made is taken (`pick`): a pull request from a fork runs in the same artifact
// store and may upload under any name.
const { execFile } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.join(__dirname, '..', '..');
const cache = path.join(repo, 'node_modules', '.cache', 'smaltfl');
const dataRoot = path.join(cache, 'data');
const storeDir = path.join(cache, 'store');

const run = (cmd, args) => new Promise((done, fail) => {
  execFile(cmd, args, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 }, (e, stdout, stderr) => (e ? fail(Object.assign(e, { stdout, stderr })) : done(stdout)));
});
/** The last lines of what a command that failed said, for a message. */
const said = (e) => `${e.stderr ?? ''}${e.stdout ?? ''}`.trim().split('\n').slice(-3).join(' / ') || e.message;

/** What a demo's data is kept by: scripts/build-app.mjs's hash of what makes it, for the arguments that build the demo. */
async function keyOf(buildArgs) {
  const out = await run(process.execPath, [path.join(repo, 'scripts', 'build-app.mjs'), ...buildArgs, '--data-key']);
  const key = out.trim().split('\n').pop() ?? '';
  if (!/^[0-9a-f]{64}$/.test(key)) throw new Error(`scripts/build-app.mjs --data-key gave no key: ${out.trim().slice(-200)}`);
  return key;
}
/**
 * A demo's data in the store: its artifact's name, `data-<demo>-<key>-<place>`. The place is a short hash of the folder
 * the data stands in: the generators write their files' full paths into it (loads.json), so data made in one place is
 * no use in another, and a run somewhere else (the repository renamed, a runner of another kind) keeps its own.
 */
const nameOf = (demo, key, root = dataRoot) => `data-${demo}-${key}-${createHash('sha256').update(root).digest('hex').slice(0, 8)}`;
const dirOf = (key) => path.join(dataRoot, key);
/** Whether the data is made here: its folder with the build's mark of a finished one. */
const madeHere = (key) => fs.existsSync(path.join(dirOf(key), '.done'));
/** The repository a workflow runs in, where it can be asked for its artifacts: nowhere else is the store used. */
const inWorkflow = () => (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY : null);

/**
 * The artifact to take of those GitHub lists under a name: the newest that hasn't expired and that a run of this
 * repository itself made (the run's head is the repository, not a fork of it). None, where there is none.
 */
function pick(artifacts) {
  const own = (artifacts ?? []).filter((a) => a && a.expired === false && a.workflow_run && Number.isInteger(a.workflow_run.id) && Number.isInteger(a.workflow_run.repository_id) && a.workflow_run.head_repository_id === a.workflow_run.repository_id);
  own.sort((a, b) => Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0));
  return own[0] ?? null;
}

/**
 * Whether a data folder was made where it now stands: the generator writes its files' full paths into loads.json, so a
 * folder made in another place names files that aren't here. Workflow runs of one repository share a place; a folder
 * from anywhere else is left, and the data made again.
 */
function madeAt(key) {
  try {
    return fs.readFileSync(path.join(dirOf(key), 'loads.json'), 'utf8').includes(JSON.stringify(dirOf(key) + path.sep).slice(1, -1));
  } catch {
    return false;
  }
}

/**
 * What the store has of a demo's data: the artifact to take (`pick`), or none with why. Asked only in a workflow, of
 * the repository it runs in.
 */
async function find(demo, buildArgs, known = null) {
  const key = known ?? (await keyOf(buildArgs));
  const base = { demo, key, name: nameOf(demo, key) };
  const repository = inWorkflow();
  if (!repository) return { ...base, found: null, why: 'not in a workflow' };
  try {
    const found = pick(JSON.parse(await run('gh', ['api', `repos/${repository}/actions/artifacts?name=${encodeURIComponent(base.name)}&per_page=50`])).artifacts);
    return { ...base, repository, found, why: found ? '' : 'the store has none under that name' };
  } catch (e) {
    return { ...base, repository, found: null, why: `the store couldn't be asked (${said(e)})` };
  }
}

/**
 * Whether the store has a demo's data already, without taking it: the run that keeps it, or none with why. What a
 * workflow's `data` job asks, which only has to make the data where nobody has yet.
 */
async function kept(demo, buildArgs) {
  const { key, name, found, why } = await find(demo, buildArgs);
  return { demo, key, name, run: found?.workflow_run.id ?? null, why };
}

/**
 * A demo's data put in place from the store, where it isn't here and the store has it. Says what it found:
 * `here` (made already), `taken` (from a run's artifact), or `none` with why. It never fails: data that can't be taken
 * is made by the build that follows.
 */
async function restore(demo, buildArgs) {
  const t0 = Date.now();
  const key = await keyOf(buildArgs);
  const name = nameOf(demo, key);
  const base = { demo, key, name };
  if (madeHere(key)) return { ...base, state: 'here' };
  const { repository, found, why } = await find(demo, buildArgs, key);
  if (!found) return { ...base, state: 'none', why };
  const into = path.join(storeDir, `in-${demo}`);
  fs.rmSync(into, { recursive: true, force: true });
  fs.mkdirSync(into, { recursive: true });
  try {
    await run('gh', ['run', 'download', String(found.workflow_run.id), '--repo', repository, '--name', name, '--dir', into]);
    fs.mkdirSync(dataRoot, { recursive: true });
    fs.rmSync(dirOf(key), { recursive: true, force: true });
    await run('tar', ['-C', dataRoot, '--no-same-owner', '-xzf', path.join(into, `${name}.tar.gz`)]);
  } catch (e) {
    fs.rmSync(dirOf(key), { recursive: true, force: true });
    return { ...base, state: 'none', why: `run ${found.workflow_run.id}'s couldn't be taken (${said(e)})` };
  } finally {
    fs.rmSync(into, { recursive: true, force: true });
  }
  if (!madeHere(key) || !madeAt(key)) {
    const amiss = madeHere(key) ? 'was made in another place' : 'holds no finished data';
    fs.rmSync(dirOf(key), { recursive: true, force: true });
    return { ...base, state: 'none', why: `run ${found.workflow_run.id}'s ${amiss}` };
  }
  return { ...base, state: 'taken', run: found.workflow_run.id, bytes: found.size_in_bytes ?? null, seconds: (Date.now() - t0) / 1000 };
}

/** A demo's data made here, packed as the one file its artifact holds: where it is, and its size. */
async function pack(demo, key) {
  if (!madeHere(key)) throw new Error(`${dirOf(key)} holds no finished data to keep`);
  const name = nameOf(demo, key);
  fs.mkdirSync(storeDir, { recursive: true });
  const file = path.join(storeDir, `${name}.tar.gz`);
  await run('tar', ['-C', dataRoot, '-czf', file, key]);
  return { name, path: file, bytes: fs.statSync(file).size };
}

module.exports = { keyOf, nameOf, dirOf, madeHere, madeAt, inWorkflow, pick, kept, restore, pack };
