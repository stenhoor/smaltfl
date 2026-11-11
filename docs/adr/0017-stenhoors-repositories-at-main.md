# ADR 0017: Built on stenhoor's repositories, at their latest main

- **Status:** accepted, 2026-11-11 (Q-156, the maintainer's request in a session; Q-130 brought forward)
- **Date:** 2026-11-11
- **Builds on:** [ADR 0001](0001-initial-decisions.md) §12 (changes in other smalt repositories go to stenhoor first),
  [ADR 0011](0011-notebooks-as-the-step-surface.md) §8 (the pins) and its slice 0b (the engine with the plan API).
- **Amends:** Q-130's order (the engine pin after the work of Q-126): the pins move now.

## Context

smaltfl pinned the engine of Nov 3 (`smaltdb` `a0906b7`) and the smaltnb and smaltkit of Nov 8. The family had moved:
smaltdb's head runs plans, not text, and reads SQL only with smaltql registered (smaltdb's ADR 0015 and 0017), and
every `db.query(sql)` in smaltfl failed on it (ADR 0011 §8, *as built*). The sessions that work on smaltfl see only
this repository unless told otherwise, and the maintainer's GitHub account also holds forks of the family
(`beepboopbop64/smaltdb`, `smaltnb`, `smaltts`, `smaltdf`), which a session could take for the real ones.

The maintainer's words: *make sure we use the smaltdb, smaltts, smaltnb and everything else in the smalt ecosystem in
smaltfl; use the ones owned by Steve TenHoor; move everything so we are using those repos, and update the docs so new
Claude Code sessions reference those repos and always try to grab the latest updates.*

## Decision

1. **stenhoor's repositories, never a fork.** Every pin in `packed.json` names `stenhoor/<repo>`, and
   `scripts/latest-packed.mjs` refuses one that doesn't. Sessions read the family's source from
   `github.com/stenhoor/<repo>` (public, cloned shallow), not from a fork. smalt-brand is read from stenhoor's too; a
   change to it is still offered through its fork (ADR 0002 §7).
2. **At their latest main.** `npm run deps:latest` moves each pin to its repository's `refs/heads/main` and installs
   it; `-- --check` says which are behind. It reads `main`, not the repository's HEAD: on 2026-11-11 smaltkit's
   default branch was an old working branch without `smaltkit/typescript`, and smaltdf's was behind its main. A
   session runs it first, then `npm run check`. Pins stay commits: a run's keys name the engine's version, and a
   build must be repeatable, so "latest" is a commit recorded in `packed.json`, moved on purpose and checked.
3. **When the latest breaks smaltfl**, fixing smaltfl comes before other work. What can't be fixed in smaltfl is
   raised with stenhoor (ADR 0001 §12) and the pin that broke stays where it was, said in the PR. A hashed vector
   that moves with a pin is a decision recorded as such.
4. **smaltql is pinned** (`@smaltworks/smaltql`, `stenhoor/smaltql`), as ADR 0011 slice 0b needed. The host registers
   it: the tests (`test/setup-sql.ts`, with smaltql transformed beside smaltdb's source so both see one registry of
   languages), the app's worker (`serve({ languages: [sqlLanguage], ... })`), the engine in the page and the history
   builder (`@smaltworks/smaltql/register`). The plugin imports only types from `smaltdb/engine`, as before.

## As built (2026-11-11)

The pins moved to: smaltdb `3abee64`, smaltql `706e210`, smaltdb-io `8e151de`, smaltdb-external `66c480c`,
smaltdb-parquet `c6ec00a`, smaltnb `41349b9`, smaltkit `c7d9c5c` (its main; smaltnb pins the same). smaltdb's version
is still 0.9.0, so run keys don't move. On them: typecheck clean; `npm test` 941 passed, as before the move, and `npm run test:isolated` the same; in
`npm run test:slow` the estate's month and the models pass, and the real-history tests fail as Q-133 records (41 days
held under `wrong`, not 25), which CI skips; the
package and the app build; the browser's episode suite gives the same 19 of 20 as the old pins, and the integrity
suite stops at the same step on both (neither is new: docs/HANDOFF.md). smaltdf (`@smaltdb/df`) and smaltts are not
pinned: smaltfl doesn't run either yet (ADR 0011 §7).

## Consequences

- CLAUDE.md's "The smalt repositories" lists the family, what smaltfl takes from each, and the start-of-session rule.
- `scripts/fetch-packed.mjs` stays identical to the family's copy; moving pins is `scripts/latest-packed.mjs`, smaltfl's
  own.
- The smaltql pin is new outside code for this repository: stenhoor reviews it in the PR (ADR 0011 §8 asked the same of
  smaltnb's and smaltkit's).
