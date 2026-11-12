/**
 * The Larkspur estate's data (test/fixtures/larkspur.ts, ADR 0020): the architecture inventory and the twenty daily
 * files of each day, from the fixture's seed, calm (slice 1: nothing planted yet).
 *
 *   node scripts/data/larkspur.mjs OUT_DIR [--from 2024-03-01] [--to 2024-03-31] [--apps 2600] [--seed 7]
 *
 * Writes OUT_DIR/fixed/<file>.csv (platforms, platform_links), OUT_DIR/days/<file>_<day>.csv, and OUT_DIR/loads.json:
 * `{ fixed: { <file>: path }, loads: [{ slot, files: { <file>: { file, rows, exported_at } } }] }`. A file's export
 * time is said beside it, in the list, never in its rows: the bronze metadata's way (ADR 0015 amendment 5). The history
 * days are written the same way, from `--from 2023-03-01`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { csvOf, DAILY_FILES, dayFile, exportedAt, fixedFiles, larkspur, larkspurDays, LARKSPUR_LOADS_FROM, LARKSPUR_TO } from '../../test/fixtures/larkspur.js';

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1]! : fallback;
};
const out = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!out) throw new Error('usage: node scripts/data/larkspur.mjs OUT_DIR [--from DAY] [--to DAY] [--apps N] [--seed N]');
const from = flag('from', LARKSPUR_LOADS_FROM);
const to = flag('to', LARKSPUR_TO);
const started = Date.now();
const w = larkspur({ apps: Number(flag('apps', '2600')), seed: Number(flag('seed', '7')) });

mkdirSync(join(out, 'fixed'), { recursive: true });
mkdirSync(join(out, 'days'), { recursive: true });
const fixed: Record<string, string> = {};
for (const [name, t] of Object.entries(fixedFiles())) {
  const file = resolve(out, 'fixed', `${name}.csv`);
  writeFileSync(file, csvOf(t.columns, t.rows));
  fixed[name] = file;
}
const loads: { slot: string; files: Record<string, { file: string; rows: number; exported_at: string }> }[] = [];
let rows = 0;
let bytes = 0;
for (const day of larkspurDays(from, to)) {
  const files: Record<string, { file: string; rows: number; exported_at: string }> = {};
  for (const name of DAILY_FILES) {
    const t = dayFile(w, name, day);
    const text = csvOf(t.columns, t.rows);
    const file = resolve(out, 'days', `${name}_${day}.csv`);
    writeFileSync(file, text);
    files[name] = { file, rows: t.rows.length, exported_at: exportedAt(name, day) };
    rows += t.rows.length;
    bytes += text.length;
  }
  loads.push({ slot: day, files });
}
writeFileSync(join(out, 'loads.json'), JSON.stringify({ fixed, loads }));
const days = loads.length;
console.log(`${out}: ${days} days (${from} to ${to}), ${DAILY_FILES.length} files a day and ${Object.keys(fixed).length} fixed; ${Math.round(rows / days)} rows and ${(bytes / days / 1e6).toFixed(2)} MB a day, ${(bytes / 1e6).toFixed(0)} MB in all, in ${((Date.now() - started) / 1000).toFixed(0)} s`);
