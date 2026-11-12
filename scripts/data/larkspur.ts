/**
 * The Larkspur estate's data (test/fixtures/larkspur.ts, ADR 0020): the architecture inventory and the twenty daily
 * files of each day, from the fixture's seed, every planted day of the answer key in them. The days up to the base's end
 * are what each watch's history is built from (scripts/data/history.ts); the days after are the loads the app steps
 * through, March 2024.
 *
 *   node scripts/data/larkspur.mjs OUT_DIR [--from 2023-09-01] [--steps-from 2024-01-19] [--base-to 2024-02-29]
 *        [--to 2024-03-31] [--apps 2600] [--seed 7]
 *
 * Writes OUT_DIR/fixed/<file>.csv (platforms, platform_links), OUT_DIR/days/<file>_<day>.csv and:
 * - OUT_DIR/base.json, each file's history: `[{ slot, files: { <file>: path, … } }]` from `--from`, six months, every
 *   daily file of the day and the fixed ones (a file's history reads its own, and what its rules read beside it: the
 *   CMDB its scope counts against);
 * - OUT_DIR/base.steps.json, the watched steps': the same from `--steps-from`, six weeks (each day a run of the flow);
 * - OUT_DIR/loads.json, the app's loads: `{ fixed: { <file>: path }, loads: [{ slot, files: { <file>: { file, rows,
 *   exported_at } } }], before: { <file>: { slot, file } } }`, each file's export time said beside it, never in its
 *   rows (ADR 0015 amendment 5), and `before` the history's last file of each, the first load's previous (Q-172).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { csvOf, DAILY_FILES, dayFile, exportedAtOf, fixedFiles, larkspur, larkspurDays, LARKSPUR_TO } from '../../test/fixtures/larkspur.js';

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1]! : fallback;
};
const out = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!out) throw new Error('usage: node scripts/data/larkspur.mjs OUT_DIR [--from DAY] [--steps-from DAY] [--base-to DAY] [--to DAY] [--apps N] [--seed N]');
const from = flag('from', '2023-09-01');
const stepsFrom = flag('steps-from', '2024-01-19');
const baseTo = flag('base-to', '2024-02-29');
const to = flag('to', LARKSPUR_TO);
if (!(from <= stepsFrom && stepsFrom <= baseTo && baseTo < to)) throw new Error(`the days must run --from ${from} ≤ --steps-from ${stepsFrom} ≤ --base-to ${baseTo} < --to ${to}`);
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
const base: { slot: string; files: Record<string, string> }[] = [];
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
    files[name] = { file, rows: t.rows.length, exported_at: exportedAtOf(w, name, day) };
    rows += t.rows.length;
    bytes += text.length;
  }
  if (day <= baseTo) base.push({ slot: day, files: { ...Object.fromEntries(Object.entries(files).map(([name, f]) => [name, f.file])), ...fixed } });
  else loads.push({ slot: day, files });
}
const last = base.at(-1)!;
const before = Object.fromEntries(DAILY_FILES.map((name) => [name, { slot: last.slot, file: last.files[name]! }]));
writeFileSync(join(out, 'base.json'), JSON.stringify(base));
writeFileSync(join(out, 'base.steps.json'), JSON.stringify(base.filter((b) => b.slot >= stepsFrom)));
writeFileSync(join(out, 'loads.json'), JSON.stringify({ fixed, loads, before }));
const days = base.length + loads.length;
console.log(`${out}: ${days} days (${from} to ${to}), ${DAILY_FILES.length} files a day and ${Object.keys(fixed).length} fixed; ${base.length} days for the files' histories and ${base.filter((b) => b.slot >= stepsFrom).length} for the steps' (to ${baseTo}), ${loads.length} loads; ${Math.round(rows / days)} rows and ${(bytes / days / 1e6).toFixed(2)} MB a day, ${(bytes / 1e6).toFixed(0)} MB in all, in ${((Date.now() - started) / 1000).toFixed(0)} s`);
