// Runs scripts/data/history.ts: bundles it for Node with esbuild (the smaltdb packages stay in node_modules), then
// runs the bundle, which measures each day in a worker thread of its own.
//
//   node scripts/data/history.mjs DAYS_DIR OUT.json
import { build } from 'esbuild';
import { readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const smaltdb = JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')).version;
// Each run its own bundle, removed when it ends: the app build runs two histories at once, and neither may import the
// other's half-written file (its worker threads load the bundle again while the run lasts).
const outfile = `node_modules/.cache/smaltfl/history.${process.pid}.mjs`;
process.on('exit', () => rmSync(outfile, { force: true }));
await build({
  entryPoints: ['scripts/data/history.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version), __SMALTDB_VERSION__: JSON.stringify(smaltdb) },
  external: ['smaltdb', 'smaltdb/*', '@smaltdb/*', '@smaltworks/*', 'hyparquet', 'hyparquet-compressors'],
  logLevel: 'warning',
});
await import(pathToFileURL(outfile).href);
