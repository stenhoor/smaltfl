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
