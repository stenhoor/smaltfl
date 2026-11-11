# ADR 0019: Ranges computed ahead, and a first load measured

- **Status:** accepted, 2026-11-11 (Q-163, Q-164: the maintainer's request in a session)
- **Date:** 2026-11-11
- **Builds on:** [ADR 0010](0010-any-dataset.md) (histories, normal ranges, claim/2), [ADR 0013](0013-discovered-checks.md)
  (the pairs and the forest), [ADR 0006](0006-integrity.md) (every file checked against its list).

## Context

The maintainer: *the data loads really slowly when the demo is opened; the control estate is tiny; we need the data
to load in milliseconds in the browser.* Measured on the estate (marks in `src/app/perf.ts`, every engine request timed
in `src/app/engine.ts`, a readable build with `SMALTFL_PROFILE=1`): the first day took 5.9 s on a fast machine, 12.6 s
at 40 ms and 25 Mbit/s. The flow's own run is about half a second; the rest was judging: posture's day alone took a
second to judge, 83% of it the pairs check (a normal range for each of 3,492 metrics, most of them pair cells, each
backtested over 42 days), done twice (in the engine for the run's claim, in the page for the day's story), then each
control's day in the page, while 30 files were fetched one after another.

## Decision

1. **Files fetched together.** Every file the first day needs is fetched when the data list is read; each is still
   checked against the list's hash before use, in the same order.
2. **The judge keeps what it asks again** (no result changes): a day's place in the calendar by calendar, a series'
   dates by first day, whether a day is left out by series, a forest by its training rows; a guess's days learned from
   are made when read.
3. **Ranges computed ahead** (Q-163; `src/core/ranges.ts`). A day's range is learned from the days before it alone
   (tested: changing the day's own numbers changes no range), so the ranges of the first day after a history are the
   history's own. The history builder measures that day as the page will (`--next`), computes every metric's range on
   the history with the day appended (`rangesOf`), and writes `ranges.<watch>.json`, naming the history by its bytes'
   sha256. The build lists it with its hash like every file. The page checks it, keeps it (`givens`) and pins it for the
   engine (`rangesPath`); the judge takes a range from it (`RangeOptions.given`) only for that day, only on that history,
   under the same settings (`rangeSettings`), with no tail, day left out or level accepted before the day
   (`givenApplies`). Every other range is computed as before; a guess's days learned from, not shipped, are computed
   from the same computation when read. Claims, holds and hashes are unchanged: a run's claim names the history it was
   told from, and verify and the audit tell it again from that history, without the ranges file.
4. **First paint** (Q-164): the flow, the day strip and the cards show before the day is judged, as they did; the
   record on the Runs view is drawn when that view is shown.

## As built (2026-11-11)

The estate's first day shown: 5.9 s → 4.0 s on the machine measured (the engine's run 1.6 s → 1.2 s, the page's wait
after it 0.9 s → 0.4 s); downloads overlap. Ranges files: 57 to 118 ranges a control, 3,492 for posture (1 MB, 160 KB
gzipped). `test/ranges.test.ts`: every metric served equals the judge's own, the day's numbers move none, and the file
is refused on another history, another setting, or with a day left out before.

## What is left

The page's claims for the twelve controls (0.9 s, now mostly the classifier on kept samples and the forest), the
engine's run (1.2 s), and start-up (0.7 s). Next candidates: the controls judged in parallel workers, the classifier's
evidence computed ahead for the first day as the ranges are, and the notebook and editor code loaded when first opened.

## Amendment 1: the classifier judged ahead, and the next steps measured (2026-11-11)

The maintainer asked for the three next candidates at once (Q-165). Measured first, on a profile of the page and,
through the debugging protocol, of the engine's worker: the page's thread is idle for 1.9 s of a 3.4 s first day and
the worker for 1.0 s of its 2.7 s, so the engine's work, not the page's, is what the first day waits on.

1. **Judged ahead** (`src/core/ahead.ts`). The classifier is seeded, so the same rows always give the same answer. The
   history builder, with `--ranges`, tells the first day's claim as the page and the engine tell it (`loadClaim`, the
   day's kept rows, the sample) and records every answer the classifier gave (`recordAhead`), keyed by the sha256 of
   its exact inputs: today's rows, each like day's rows (`rowsKey`, made once for the same rows), the columns, their
   kinds and the options. They ship in the ranges file (`RangesFile.apart`), checked and pinned with it; the page and
   the engine take them (`giveAhead`) and `apartEvidence` serves one only for a call with the same key
   (`judgedAhead`). Any other rows, day, pattern, day left out or column left out misses and is computed as before;
   with nothing shipped, nothing is hashed. Claims, holds and hashes are unchanged, and verify and the audit tell
   claims as before. The forest is not shipped: its trees would add about 3 MB, and it is grown once a day already.
2. **The controls judged as their numbers come back.** Every load's measures and kept rows are asked of the engine at
   once; the page judges each as it arrives, so its judging overlaps the engine's measuring. More workers would not
   help: the page is not the thread being waited on, and a second engine would start as cold as the first.
3. **Files pinned together**, waited for once before the run.
4. **What a history's views share**: a series is made once for a history file (`seriesFor`), and folding a tail onto
   a history copies the arrays it grows, not the whole file (`appendPeriods`).
5. **The notebook's code is not split out**: smaltkit's editor, grid and markdown are 32 KB of the 860 KB app bundle.

As built: the estate's first day 3.4 s → 3.06 s on the machine measured (the same machine measured main at 3.4 s;
the 4.0 s above was another session's machine), 12 classifier answers served. The engine's own work remains:
compiling the run's SQL (0.4 s in smaltdb, `compileProgram`), the first queries on a cold engine, and the posture's
forest and pair ranges. `tools/browser/load.cjs APP [runs]` prints each phase's median.
