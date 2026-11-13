// Runs scripts/data/record.ts: bundles it for Node with esbuild (the smaltdb packages stay in node_modules), then runs
// the bundle, which records a generated flow's month (ADR 0021 §6).
//
//   node scripts/data/record.mjs --flow DOC --work DIR --build COMMIT [--bind DATA.json] OUT.json
import { build } from 'esbuild';
import { readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const smaltdb = JSON.parse(readFileSync('node_modules/smaltdb/package.json', 'utf8')).version;
// Each run its own bundle, removed when it ends: two builds may record at once.
const outfile = `node_modules/.cache/smaltfl/record.${process.pid}.mjs`;
process.on('exit', () => rmSync(outfile, { force: true }));
await build({
  entryPoints: ['scripts/data/record.ts'],
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
