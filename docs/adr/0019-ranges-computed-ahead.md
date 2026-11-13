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

## Amendment 2: the first day computed ahead and overlapped (2026-11-13, Q-179)

Larkspur's first day was shown at 11.0 s (ADR 0020 slice 5; 10.0 s on this session's machine), against ADR 0020 §7's
5 s. Q-179 kept the scale and the budget and asked for this ADR's kind of work. Measured first (a profile of the page
with the engine in it, `?engine=page`; the runtime's phases timed in Node; the engine's own timeline stamped in a
scratch build), the first day went on:

- typing every step: each compiled with every step above it folded onto the snapshots, twice (its columns, then what
  it reads), 2.2 s, the gold steps compiling 15,000 to 25,000 characters each;
- the engine measuring and sampling the twenty files before the run so the page could tell their claims, 1.9 s; the run
  then copied and hashed every file again as its snapshot;
- one step, Larkspur's `coverage`, 1.4 s: its ownership check ran a correlated `EXISTS` over the leaders for every
  application, and the statement evaluated it twice;
- the run's own work: building 2.8 s, counting checks 0.7 s, hashing 0.5 s;
- before the run, some 45 requests that hold the engine's lock (a pin, a table), each sent only once the one before it
  was answered, which the page, busy parsing, took late.

Decided, and built (every hash as it was; only Larkspur's flow moved, by its SQL):

1. **Types computed ahead** (`src/core/typed.ts`). The types are a pure function of the nodes as they stand when typing
   starts (the snapshots' columns filled in), the nodes the run needs and the engine and smaltfl versions: `typesKey`
   hashes exactly those. The build runs the first loads day once (`history.mjs --types`, the whole document with its
   parameters as the page sets them) and keeps every node's columns under that key (`types.json`, listed in loads.json,
   checked like every file, pinned as `TYPES_PATH`); the run takes them only under its own key (`givenTypes`), and types
   every node itself otherwise. The checks typing makes were made by the build on the very same nodes.
   `test/typed.test.ts`: the same manifest with and without, and a miss on other parameters, another document, other
   source columns, an entry that leaves a node out, or a file that isn't one.
2. **The first day measured ahead** (`RangesFile.measured`, `measuredAhead`). The history builder measures the first day
   under the settings the page and the run take from the history (`settingsFor` on the history just folded: the
   builder's own settings name every column the ontology lists values for, and the page's only the file's), and ships
   the measures and kept rows in the ranges file. A load's measures are its snapshot's rows in the order they were
   written: a file's order is its bytes', so the page takes them for the very file (its sha256) and settings, and the
   run for the very snapshot (its content hash), settings and file; a step's order is its plan's, so the run takes a
   step's also by its node key. The page asks the engine nothing before the first run.
3. **Sources snapshotted ahead** (`src/plugin/prepared.ts`, the plugin's `prepare`, `prepareRun`). The page asks for
   the day's sources to be snapshotted as soon as its files are pinned, while it reads its histories and tells the
   claims; the run takes each snapshot (and a measure reads it) while the table still reads a pinned file with the
   same sha256 through the same definition and its version is stored, once (`test/prepare.test.ts`: the same manifest;
   other bytes or a table defined again, and the run reads the file). A sample still reads the file: a file's columns
   read as untyped, and the kept rows are what the classifier's keys are made of.
4. **Fewer round trips, sooner.** The engine's worker starts first, while the page reads its lists. A day's files go to
   it in one call (`pinFiles`, the plugin's `pinMany`) and their tables in one statement list; then what the claims and
   the run read, in one more. A history's reference is set when its pin is sent (the pin confirms that sha256 or stops
   the page). The first day's claims are told while the engine finishes (`claimsEarly`): the run takes them for the
   same day, parameters and document. A source's sample isn't pinned (the engine reads only a watched step's), and a
   step's is pinned again only once a day was added to it. The run's columns and the edits' chain are asked while the
   page records the run.
5. **A check that drops nothing reads its folded input once.** A stored check over a folded input read it twice, to
   count its rules and to build its rows; it is evaluated once into a temporary table whose columns are declared `ANY`,
   so no value is converted, and both read it, the rows going into the version in the order they came.
6. **Larkspur's SQL.** The ownership check's correlated `EXISTS` is two `IN` lists of the active leaders, and
   `coverage` is one full join of what applies and the evidence, each side marked, so the evidence is read once. The
   same rows and types on the first day (content hashes compared), and the answer key holds
   (`test/larkspur-flow.test.ts`).
7. **One smaltdb in each bundle** (`scripts/build-app.mjs`). The app's own imports took smaltdb's source by
   tsconfig.json's paths and smaltql took its dist build: two language registries, so the in-page engine
   (`?engine=page`, the fallback without workers) found no SQL, and the worker carried the client twice. Every import
   of smaltdb now resolves to the source.
8. **The dataset hash's text** is written byte by byte while it is plain ASCII, and by TextEncoder from the first unit
   past it (`writeUtf8`): TextEncoder's bytes exactly. `test/dataset-hash.test.ts` holds the hash to its encoding as
   the module's header writes it, against a plain implementation.
9. **The measuring tool** (`tools/browser/load.cjs`) compressed every file before sending it, for its report, which
   delayed the responses a page waits for; it now measures a file's compressed size once, after sending it.

Measured and not taken: column storage (inserting is slower than rows, 95 against 56 ms for 19,000 rows), the
organisation's walk with its parent check moved out of the recursion (slower), a reconciliation's key sets read back
from a table (a key compared under `NOT IN` could compare otherwise).

As built (`tools/browser/load.cjs`'s marks, seven loads of each build interleaved with main's on the same machine, the
median): Larkspur's first day 9.77 s → 4.53 s on a desktop and 10.26 s → 4.80 s on a phone; the control estate's
2.70 s → 1.99 s. On a busier hour the same builds read 0.3 to 0.6 s slower each, which interleaving cancels and a
single batch does not. The types, every watch's first day and every source's snapshot are taken: the engine compiles no
step to type it, measures nothing before the run and copies no file twice.

What is left is the engine's own work, in order: starting (0.3 s), the day's files and their snapshots (about 0.9 s,
while the page reads its histories and tells the claims), then the run (about 3 s: building some 45 datasets, counting
their checks and hashing every one, and telling the watched steps' claims). A first day near 1 s would need the page to
show a day before the browser has run it, the build's run of the same files and flow, and confirm it with its own run
after: a change to what a first day shown means, open as Q-180.
