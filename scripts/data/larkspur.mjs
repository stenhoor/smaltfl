// Runs scripts/data/larkspur.ts: bundles it for Node with esbuild, then runs the bundle, which writes the Larkspur
// estate's architecture inventory and daily files from the fixture's seed (ADR 0020).
//
//   node scripts/data/larkspur.mjs OUT_DIR [--from DAY] [--steps-from DAY] [--base-to DAY] [--to DAY] [--apps N] [--seed N]
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';

const outfile = 'node_modules/.cache/smaltfl/larkspur.mjs';
await build({ entryPoints: ['scripts/data/larkspur.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile, logLevel: 'warning' });
await import(pathToFileURL(outfile).href);
