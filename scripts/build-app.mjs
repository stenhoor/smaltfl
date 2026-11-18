// Builds the app into dist/app: page.html (the page's content; the artifact host adds the document skeleton), index.html
// (the same page as a document, for a static host such as GitHub Pages),
// app.js (the page), worker.js (the engine worker), inline.js (the engine in the page, for browsers without the
// worker), parse.js (smaltql's SQL parser, loaded when a screen asks where a column is used), derive.js (the notebook
// parser, loaded when someone first builds in the app, ADR 0026 §10), and data/ (a flow's files, listed in
// data/loads.json, format 2: each source's binding with its file or its daily loads and the days a paused one may be
// filled from, and each watched source's history, ADR 0010 §9; the flows it reads, the estates' ontologies it imports
// and the flows of its catalogue, each as its own document, ADR 0026).
//
//   node scripts/build-app.mjs            Larkspur (examples/larkspur/, ADR 0020), the demo
//   node scripts/build-app.mjs --variant tour [--out dist/app-tour]
//                                         Larkspur's tour, February and March (ADR 0023): a variant of its data
//                                         list, its own generator arguments and story
//   node scripts/build-app.mjs --flow examples/larkspur/feeds/flow.json --out dist/app-feeds --page "larkspur=../app/=Larkspur estate"
//                                         a flow the estate reads, as a page of its own on the tour's files (ADR 0026
//                                         §6): `--page` names the pages that share a flow with it, by where the site
//                                         puts them
//   node scripts/build-app.mjs --flow examples/security-signins/flow.json [--out dist/app-signins]
//                                         another example. The flow's data list names a generator; it writes the
//                                         daily files (with the list's `generateArgs`) and the general builder writes
//                                         the history. Every build ships its document as data/flow.json, and a
//                                         folder's flow ships with its notebooks' sources and the steps derived from them
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dataNames, makeData } from './data/make.mjs';

const outAt = process.argv.indexOf('--out');
const out = outAt >= 0 ? process.argv[outAt + 1] : 'dist/app';
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/data`, { recursive: true });
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const git = (...args) => execFileSync('git', args, { maxBuffer: 1 << 28 });
// The commit the code is built from, which every run records (ADR 0006 §4): marked when the tree has changes on top.
let commit = 'dev';
try {
  commit = git('rev-parse', 'HEAD').toString().trim() + (git('status', '--porcelain', '--untracked-files=no').toString().trim() ? '+changes' : '');
} catch {
  // Not a git checkout: dev.
}
const smaltdb = JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')).version;
// One smaltdb in each bundle: the app's own imports take its source by tsconfig.json's paths, and so must every package
// that imports it (smaltql's `smaltdb/language` and `smaltdb`). From node_modules they resolved to its dist build, a second
// copy: its registry is not the engine's (the in-page engine found no SQL), and the worker carried the client twice.
const smaltdbPaths = Object.entries(JSON.parse(readFileSync('tsconfig.json', 'utf8')).compilerOptions.paths).filter(([k]) => k === 'smaltdb' || k.startsWith('smaltdb/'));
const oneSmaltdb = {
  name: 'one-smaltdb',
  setup(b) {
    const to = new Map(smaltdbPaths.map(([k, [v]]) => [k, join(process.cwd(), v)]));
    b.onResolve({ filter: /^smaltdb(\/[a-z-]+)?$/ }, (a) => (to.has(a.path) ? { path: to.get(a.path) } : undefined));
  },
};
const common = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  // SMALTFL_PROFILE=1 keeps the names, for a profile a person can read (tools/browser/load.cjs).
  minify: !process.env.SMALTFL_PROFILE,
  legalComments: 'none',
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version), __SMALTDB_VERSION__: JSON.stringify(smaltdb), __SMALTFL_COMMIT__: JSON.stringify(commit), __SMALTFL_DATA__: 'null' },
  // Only codecs other than Snappy need it (the example's files are Snappy), and the plugin loads it only then.
  external: ['hyparquet-compressors'],
  plugins: [oneSmaltdb],
  logLevel: 'warning',
};

const flowAt = process.argv.indexOf('--flow');
// The demo's flow unless another is named (ADR 0020 §8). The taxi example and its data branch were retired on 2026-11-15
// (Q-208): every flow built here generates its own data.
const flowPath = flowAt >= 0 ? process.argv[flowAt + 1] : 'examples/larkspur/flow.json';
const variantAt = process.argv.indexOf('--variant');
const variant = variantAt >= 0 ? process.argv[variantAt + 1] : null;
// The pages of the site that share a flow with this one (ADR 0026 §6), any number: `--page feeds=../feeds/` for a flow
// it reads that has a page of its own, `--page "larkspur=../app/=Larkspur estate"` for a flow that reads it, named
// since this flow's document doesn't know it. A held day decided on one page is carried to the other, and each links
// to the other. Where the pages are is the site's to say, not the flow's: an argument, and nothing the data is made from.
const pages = Object.fromEntries(process.argv.flatMap((a, i) => {
  const m = a === '--page' ? /^([^=]+)=([^=]+)(?:=(.+))?$/.exec(process.argv[i + 1] ?? '') : null;
  return m ? [[m[1], { href: m[2], ...(m[3] ? { name: m[3] } : {}) }]] : [];
}));
/** A variant the data list doesn't have: refused, with the ones it has. */
const missingVariant = (name, listed) => {
  throw new Error(`${flowPath}'s data list has no variant ${name}: it has ${Object.keys(listed.variants ?? {}).join(', ') || 'none'}`);
};
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
// The flow reader (scripts/flow.ts), bundled for Node: a folder's flow.json comes back with its notebooks loaded and its
// steps derived (ADR 0011); a .smaltfl.json as it is.
const reader = 'node_modules/.cache/smaltfl/flow.mjs';
await build({ entryPoints: ['scripts/flow.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile: reader, logLevel: 'warning' });
const { readFlow, readWithChanges, readEstates, bindingsPath, undescribedIn } = await import(pathToFileURL(reader).href);
// The catalogue's reader (scripts/catalogue.ts), bundled the same way: the flows a flow's `catalogue` folder holds.
const catalogueReader = 'node_modules/.cache/smaltfl/catalogue.mjs';
await build({ entryPoints: ['scripts/catalogue.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile: catalogueReader, logLevel: 'warning' });
const { readCatalogue } = await import(pathToFileURL(catalogueReader).href);
// A flow's bindings (ADR 0010 §9): each source's table, format and file name, which loads.json carries on.
const bindingsOf = (doc) => JSON.parse(readFileSync(bindingsPath(doc), 'utf8'));
/** The document the build ships, as data/flow.json, and its entry in loads.json. With a recorded story (ADR 0021 §6), its
 * changes to the rules people set ship as the document's own change sets (ADR 0021 §5): the page reads them as it reads
 * one made there, and the month's runs were recorded under them. */
const storyChanges = (storyPath) => (storyPath ? (JSON.parse(readFileSync(storyPath, 'utf8')).changes ?? []) : []);
const shipFlow = async (path, storyPath = null) => {
  // Each change set is also the flows' whose file or step it is about (ADR 0026 §7): the document names each flow it
  // reads by the hash that flow's own document has with them, as the recorder's runs do.
  const { doc } = await readWithChanges(path, storyChanges(storyPath));
  const bytes = Buffer.from(JSON.stringify(doc, null, 2) + '\n');
  writeFileSync(`${out}/data/flow.json`, bytes);
  return { path: 'flow.json', from: path, sha256: sha256(bytes), bytes: bytes.length };
};
/** Each flow the flow reads, as its own document (ADR 0026 §2), shipped as data/flows/<id>.json and listed in loads.json:
 * a run keeps them beside its own document, so verify can check that it holds each unchanged. */
const shipFlows = async (path, storyPath = null) => {
  const out_ = {};
  const { doc: read, owns: own } = await readWithChanges(path, storyChanges(storyPath));
  if (own.length) mkdirSync(`${out}/data/flows`, { recursive: true });
  own.forEach((doc, k) => {
    const part = read.flows[k];
    const bytes = Buffer.from(JSON.stringify(doc) + '\n');
    writeFileSync(`${out}/data/flows/${part.id}.json`, bytes);
    out_[part.id] = { path: `flows/${part.id}.json`, from: join(dirname(path), part.path), sha256: sha256(bytes), bytes: bytes.length };
  });
  return out_;
};
/** The estates' ontologies the flow imports (ADR 0026 §8), as their files give them, shipped as data/estates/<n>.json and
 * listed in loads.json by name and hash: the Ontology page reads what the estate says of a column from them. */
const shipEstates = async (path) => {
  const all = await readEstates(path);
  if (all.length) mkdirSync(`${out}/data/estates`, { recursive: true });
  return all.map(({ from, estate }, k) => {
    const bytes = Buffer.from(JSON.stringify(estate) + '\n');
    writeFileSync(`${out}/data/estates/${k}.json`, bytes);
    return { name: from.name, hash: from.hash, path: `estates/${k}.json`, from: join(dirname(path), from.path), sha256: sha256(bytes), bytes: bytes.length };
  });
};
/** The flow's catalogue (ADR 0026 §10): each flow in its `catalogue` folder as its own document, shipped as
 * data/catalogue/<id>.json and listed in loads.json with what it gives and what it is built on. The page adds one to
 * the flow on screen, where it is built from the day's run: no data is made for it here. */
const shipCatalogue = async (path) => {
  const all = await readCatalogue(path);
  if (all.length) mkdirSync(`${out}/data/catalogue`, { recursive: true });
  return all.map(({ entry, doc }) => {
    const bytes = Buffer.from(JSON.stringify(doc) + '\n');
    writeFileSync(`${out}/data/catalogue/${entry.id}.json`, bytes);
    return { ...entry, file: `catalogue/${entry.id}.json`, sha256: sha256(bytes), bytes: bytes.length };
  });
};
// derive.js: the notebook parser, loaded the first time someone builds in the app (a join written as a cell).
await build({ ...common, entryPoints: { app: 'src/app/main.ts', worker: 'src/app/worker.ts', inline: 'src/app/inline.ts', parse: 'src/app/parse.ts', derive: 'src/app/derive.ts' }, outdir: out });
// The bundles named by their content (app.3f2a9c1d.js), so a new build is never served from a browser's cache of the
// last one under the same name: the page's script tag and the page's references to the worker and the in-page engine
// take the new names; so does its reference to the SQL parser, loaded when a screen asks where a column is used.
const hashed = {};
for (const name of ['worker', 'inline', 'parse', 'derive', 'app']) {
  let js = readFileSync(`${out}/${name}.js`, 'utf8');
  for (const [from, to] of Object.entries(hashed)) js = js.split(`./${from}.js`).join(`./${to}`);
  const to = `${name}.${sha256(Buffer.from(js)).slice(0, 8)}.js`;
  writeFileSync(`${out}/${to}`, js);
  rmSync(`${out}/${name}.js`);
  rmSync(`${out}/${name}.js.map`, { force: true });
  hashed[name] = to;
}
// The page's title is the flow's name: the artifact host and the browser tab show it.
const titleOf = (doc) => `${doc.name} · smaltfl`.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'));
// smaltkit's styles (its editor and grid, which the notebook's cells use), from the pinned package, in the page: the
// artifact host serves one page, so a stylesheet beside it would not load.
const kitCss = readFileSync('node_modules/smaltkit/dist/ui.css', 'utf8').replace(/<\/style/gi, '<\\/style');
const pageHtml = readFileSync('src/app/page.html', 'utf8')
  .replace(/<style id="smaltkit-ui">[^<]*<\/style>/, () => `<style id="smaltkit-ui">\n${kitCss}</style>`)
  .replace('src="app.js"', `src="${hashed.app}"`)
  .replace(/<title>[^<]*<\/title>/, `<title>${titleOf(await readFlow(flowPath))}</title>`);
writeFileSync(`${out}/page.html`, pageHtml);
// The same page as a document of its own, for any static host (GitHub Pages serves it at the folder's address).
writeFileSync(`${out}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>\n${pageHtml}\n</body></html>\n`);
writeFileSync(`${out}/bundles.json`, JSON.stringify(hashed, null, 2) + '\n');
{
  // Its data list's generator writes its daily files (generated, never fetched), the general builder measures the
  // history from the days before the loads, and the document ships beside them (ADR 0010 §9). A variant of the data list
  // (`--variant`, the tour's: ADR 0023 §2) generates its own month with its own story.
  const listed = bindingsOf(flowPath);
  const bind = variant ? { ...listed, ...(listed.variants?.[variant] ?? missingVariant(variant, listed)) } : listed;
  if (!bind.generate) throw new Error(`${flowPath}'s data list names no generator for its files`);
  const flowDoc = await readFlow(flowPath);
  // Ontology first (format 5, ADR 0027 §4): a flow whose sources aren't described isn't built. What a row is, and every
  // column its data's list declares, described or set aside.
  const lacking = await undescribedIn(flowPath);
  if (lacking.length) throw new Error(`${flowPath} is format 5, and its ontology doesn't come first yet:\n  ${lacking.join('\n  ')}`);
  // The generated days, histories and samples depend only on the generator, the flow, the runtime and the pins: they
  // are kept by a hash of those (node_modules/.cache/smaltfl/data/<hash>/), so a build after a change to the app alone
  // reuses them, and any change to what makes them makes them again. The generator writes its files' paths into
  // loads.json, so the cache is the folder it writes into, and a folder without `.done` is half made and made again.
  const key = await dataKey(flowPath, bind);
  const work = join('node_modules/.cache/smaltfl/data', key);
  const cached = existsSync(join(work, '.done'));
  const t0 = Date.now();
  // Used now: the cache keeps the data sets used last (below), and the site's deploy uses five.
  if (cached) utimesSync(work, new Date(), new Date());
  if (!cached) {
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    await makeData({ flowPath, flowDoc, work, generate: bind.generate, generateArgs: bind.generateArgs ?? [], story: bind.story ?? null, commit });
    writeFileSync(join(work, '.done'), `${new Date().toISOString()}\n`);
  }
  const watches = Object.keys(flowDoc.publish?.watch ?? {});
  const { historyName, sampleName, rangesName } = dataNames(watches);
  const sampled = watches.length > 0;
  console.log(`${cached ? 'reused' : 'made'} the generated data and ${watches.length} histories (${key.slice(0, 12)}) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  mkdirSync(`${out}/data/loads`, { recursive: true });
  const entry = (name, bytes, from) => {
    writeFileSync(`${out}/data/${name}`, bytes);
    return { path: name, from, sha256: sha256(bytes), bytes: bytes.length };
  };
  const flowEntry = await shipFlow(flowPath, bind.story ?? null);
  const flowEntries = await shipFlows(flowPath, bind.story ?? null);
  const estateEntries = await shipEstates(flowPath);
  const catalogueEntries = await shipCatalogue(flowPath);
  const histories = Object.fromEntries(watches.map((w) => [w, entry(historyName(w), readFileSync(join(work, historyName(w))), `${bind.generate}, scripts/data/history.mjs`)]));
  const samples = sampled ? Object.fromEntries(watches.map((w) => [w, entry(sampleName(w), readFileSync(join(work, sampleName(w))), `${bind.generate}, scripts/data/history.mjs --sample`)])) : {};
  const ranges = Object.fromEntries(watches.filter((w) => existsSync(join(work, rangesName(w)))).map((w) => [w, entry(rangesName(w), readFileSync(join(work, rangesName(w))), 'scripts/data/history.mjs --ranges')]));
  const types = existsSync(join(work, 'types.json')) ? entry('types.json', readFileSync(join(work, 'types.json')), 'scripts/data/history.mjs --types') : null;
  const recorded = existsSync(join(work, 'month.json')) ? entry('month.json', readFileSync(join(work, 'month.json')), 'scripts/data/record.mjs') : null;
  // The generator's loads: a list of one source's files (`[{ file, slot, rows }]`), or days of several daily sources
  // with the fixed files beside them (`{ fixed: { id: path }, loads: [{ slot, files: { id: { file, rows } } }] }`).
  const made = JSON.parse(readFileSync(join(work, 'loads.json'), 'utf8'));
  const sources = {};
  let days = 0;
  if (Array.isArray(made)) {
    const [source, b] = Object.entries(bind.sources)[0];
    const list = made.map((l) => {
      const e = entry(`loads/${basename(l.file)}`, readFileSync(l.file), bind.generate);
      return { slot: l.slot, file: e.path, rows: l.rows, sha256: e.sha256, bytes: e.bytes };
    });
    // What made each daily source's files (ADR 0015 amendment 5): the bronze table's metadata says it.
    sources[source] = { ...b, from: bind.generate, loads: list, donors: [] };
    days = list.length;
  } else {
    for (const [id, b] of Object.entries(bind.sources)) {
      if (made.fixed?.[id]) sources[id] = { ...b, entry: entry(b.file, readFileSync(made.fixed[id]), bind.generate) };
      else {
        const list = made.loads.flatMap((l) => {
          const f = l.files[id];
          if (!f) return [];
          const e = entry(`loads/${basename(f.file)}`, readFileSync(f.file), bind.generate);
          // When its system exported it, where the generator says (Q-172: what `fresh` is told from).
          return [{ slot: l.slot, file: e.path, rows: f.rows, sha256: e.sha256, bytes: e.bytes, ...(f.exported_at ? { exported_at: f.exported_at } : {}) }];
        });
        // The history's last file of the source, the first load's previous (Q-172), by its sha256: never shipped.
        const prior = made.before?.[id];
        const before = prior ? { before: { day: prior.slot, sha256: sha256(readFileSync(prior.file)) } } : {};
        // The story's later deliveries of the source's days (ADR 0021 §6), each a version of its day, shipped beside it.
        const deliveries = (made.deliveries ?? []).filter((x) => x.source === id).map((x) => {
          const e = entry(`loads/${basename(x.file)}`, readFileSync(x.file), bind.generate);
          return { slot: x.day, n: x.n, file: e.path, rows: x.rows, sha256: e.sha256, bytes: e.bytes, ...(x.exported_at ? { exported_at: x.exported_at } : {}), arrived: x.arrived, why: x.why };
        });
        sources[id] = { ...b, from: bind.generate, loads: list, donors: [], ...before, ...(deliveries.length ? { deliveries } : {}) };
      }
    }
    days = made.loads.length;
  }
  // The cache keeps the five data sets used last (the site deploys five pages: Larkspur's two months about 430 MB each,
  // Evidence feeds' own page of the tour's about 300 MB, the others tens of MB): an older one is made again if it is
  // needed.
  const root = 'node_modules/.cache/smaltfl/data';
  const kept = readdirSync(root).map((k) => ({ k, t: statSync(join(root, k)).mtimeMs })).sort((a, b) => b.t - a.t);
  for (const { k } of kept.slice(5)) if (k !== key) rmSync(join(root, k), { recursive: true, force: true });
  const first = Object.values(sources).find((s) => s.loads)?.loads[0];
  // The demo's scenes (ADR 0023 §4): what it shows, the month screen's list, shipped as they are written (the page checks
  // them, core/scenes.ts).
  const scenes = bind.scenes ? JSON.parse(readFileSync(bind.scenes, 'utf8')) : null;
  // What was going on (ADR 0027 §6): the story's events, context the page shows on its days, lanes and charts.
  const events = bind.story ? (JSON.parse(readFileSync(bind.story, 'utf8')).events ?? []) : [];
  const index = { format: 2, month: first?.slot.slice(0, 7), built: new Date().toISOString().slice(0, 19) + 'Z', data: null, flow: flowEntry, ...(Object.keys(flowEntries).length ? { flows: flowEntries } : {}), ...(estateEntries.length ? { estates: estateEntries } : {}), ...(catalogueEntries.length ? { catalogue: catalogueEntries } : {}), sources, histories, ...(Object.keys(samples).length ? { samples } : {}), ...(Object.keys(ranges).length ? { ranges } : {}), ...(types ? { types } : {}), ...(recorded ? { recorded } : {}), ...(bind.judged ? { judged: bind.judged } : {}), ...(bind.posture ? { posture: bind.posture } : {}), ...(scenes ? { scenes } : {}), ...(events.length ? { events } : {}), ...(Object.keys(pages).length ? { pages } : {}) };
  writeFileSync(`${out}/data/loads.json`, JSON.stringify(index, null, 2) + '\n');
  console.log(`built ${out} (${commit.slice(0, 12)}) with ${flowPath}: ${days} days of ${Object.values(sources).filter((s) => s.loads).length} daily source(s) and ${watches.length} histories, generated by ${bind.generate}`);
}

/**
 * What a flow's generated data is made from, hashed: every file of this repository the generator and the history builder
 * import (their import graph, as esbuild reads it: a change to the app alone, or to a module neither reaches, keeps the
 * data), the wrappers that run them, the flow's own files (its folder: the flow, its notebooks, its data list and its
 * story; or a single document and its data list) and what every flow may read beside them (the shared ontologies, the
 * files at the top of examples/), all read at run time, not imported; the pins and the lockfile, and the generator's
 * arguments. Another flow's folder isn't hashed: a change to one demo keeps the others' data.
 */
async function dataKey(flowPath, bind) {
  const entries = [bind.generate.replace(/\.mjs$/, '.ts'), 'scripts/data/history.ts', 'scripts/data/record.ts'].filter((f) => existsSync(f));
  const { metafile } = await build({ entryPoints: entries, bundle: true, write: false, metafile: true, platform: 'node', format: 'esm', outdir: 'node_modules/.cache/smaltfl/keys', packages: 'external', logLevel: 'silent' });
  const files = new Set([...Object.keys(metafile.inputs), bind.generate, 'scripts/data/history.mjs', 'scripts/data/record.mjs', 'packed.json', 'package-lock.json']);
  // A demo's scenes are words the page shows (ADR 0023 §4), nothing the data is made from: a change to them keeps it.
  // So does a change to its catalogue (ADR 0026 §10): the flows in its `catalogue` folder are added in the page, and
  // built there from the day's run.
  // The flows it reads (ADR 0026), wherever their folders are: each one's document and notebooks. A read flow's own data
  // list and story are for a page of its own (ADR 0026 §6), and nothing its reader's data is made from.
  const doc = await readFlow(flowPath);
  const read = new Set((doc.flows ?? []).map((f) => dirname(join(dirname(flowPath), f.path))));
  const ofFlow = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      if (basename(p) !== 'catalogue') for (const e of readdirSync(p)) ofFlow(join(p, e));
    } else if (basename(p) === 'flow.json' || p.endsWith('.ts')) files.add(p);
  };
  const walk = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      if (read.has(p)) ofFlow(p);
      else if (basename(p) !== 'catalogue') for (const e of readdirSync(p)) walk(join(p, e));
    } else if (!p.endsWith('scenes.json')) files.add(p);
  };
  if (flowPath.endsWith('.smaltfl.json')) files.add(flowPath).add(flowPath.replace(/\.smaltfl\.json$/, '.data.json'));
  else walk(dirname(flowPath));
  for (const dir of read) ofFlow(dir);
  // What it reads from outside its own folder: the estates' ontologies it imports (ADR 0026 §8) and its story.
  for (const e of doc.ontology?.estate ?? []) files.add(join(dirname(flowPath), e.path));
  if (bind.story) files.add(bind.story);
  walk('examples/ontologies');
  for (const e of readdirSync('examples')) if (statSync(join('examples', e)).isFile() && !e.endsWith('.smaltfl.json') && !e.endsWith('.data.json')) files.add(join('examples', e));
  const h = createHash('sha256');
  for (const f of [...files].filter((f) => existsSync(f)).sort()) h.update(f).update('\0').update(readFileSync(f)).update('\0');
  h.update(JSON.stringify({ flowPath, generate: bind.generate, args: bind.generateArgs ?? [], story: bind.story ?? null }));
  return h.digest('hex');
}
