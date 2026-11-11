// Moves the pins in packed.json to the latest commit of each repository's `main` branch, all of them stenhoor's (the
// owner's repositories, never a fork), then installs them with scripts/fetch-packed.mjs.
//
//   node scripts/latest-packed.mjs            move every pin to its repository's main, then run fetch-packed
//   node scripts/latest-packed.mjs --check    say which pins are behind main and change nothing (exit 1 if any are)
//
// It reads `refs/heads/main`, not the repository's HEAD: a repository's default branch can be an old working branch
// (smaltkit's and smaltdf's were, on 2026-11-11), and main is where merged work lands. After a move, run `npm run check`:
// the pins only stay moved if smaltfl is green on them (CLAUDE.md, "The smalt repositories").
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OWNER = 'stenhoor';
const root = process.cwd();
const file = join(root, 'packed.json');
const pins = JSON.parse(readFileSync(file, 'utf8'));
const check = process.argv.includes('--check');

const moves = [];
for (const [name, pin] of Object.entries(pins)) {
  if (pin.path) continue;
  const [owner] = pin.repo.split('/');
  if (owner !== OWNER) fail(`${name} is pinned to ${pin.repo}: smaltfl builds on ${OWNER}'s repositories, not a fork`);
  const main = mainOf(pin.repo);
  if (main !== pin.ref) moves.push({ name, repo: pin.repo, from: pin.ref, to: main });
}

if (moves.length === 0) {
  console.log(`latest-packed: every pin is at its repository's main`);
  process.exit(0);
}
for (const m of moves) console.log(`latest-packed: ${m.name} (${m.repo}) ${m.from.slice(0, 9)} -> ${m.to.slice(0, 9)}`);
if (check) {
  console.log(`latest-packed: ${moves.length} pin(s) behind main; \`npm run deps:latest\` moves them`);
  process.exit(1);
}

for (const m of moves) pins[m.name].ref = m.to;
// One line a pin, as packed.json has always been written.
const lines = Object.entries(pins).map(([n, p]) => `  ${JSON.stringify(n)}: ${JSON.stringify(p).replace(/","/g, '", "').replace(/":"/g, '": "')}`);
writeFileSync(file, `{\n${lines.join(',\n')}\n}\n`);
console.log(`latest-packed: packed.json moved; installing`);
execFileSync('node', ['scripts/fetch-packed.mjs'], { cwd: root, stdio: 'inherit' });
console.log(`latest-packed: done; now run \`npm run check\` and commit packed.json only if it passes`);

function mainOf(repo) {
  const out = execFileSync('git', ['ls-remote', `https://github.com/${repo}.git`, 'refs/heads/main'], { encoding: 'utf8' });
  const sha = out.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha ?? '')) fail(`${repo} has no main branch`);
  return sha;
}

function fail(message) {
  console.error(`latest-packed: ${message}`);
  process.exit(1);
}
