# ADR 0025: The browser regression in minutes

- **Status:** proposed, 2026-11-16, and built as proposed for the maintainers to confirm (Q-226 to Q-230). The
  maintainer asked for the regression to be fast again and to stay fast as stops are added. Amended on 2026-11-17,
  when [ADR 0026](0026-flows-in-flows.md)'s eleven stop sets were brought in (§"Amended", Q-246).
- **Date:** 2026-11-16
- **Builds on:**
  - [ADR 0018](0018-phone-tablet-and-desktop.md): the five sizes, and the check a change to the app owes.
  - [ADR 0019](0019-ranges-computed-ahead.md): the page's marks and the engine's timings, which this ADR measured with.
  - [ADR 0021](0021-time.md) §4: a day's link, which a stop set now opens on.
- **Changes:**
  - ADR 0018 §4 (the check): what runs before a PR, and what CI runs (§3, §6). The four sizes and the rule that a
    change to a screen is looked at on each of them stay.

## Context

The maintainer, 2026-11-16, after the browser regression for the month's new screen took 26 minutes:

> Waiting 30 minutes on a regression test is utterly unacceptable. This needs to be somewhere in the minute range. It
> used to be at that point, and I don't know how we got this value from our baseline. […] fix it so that we can run
> through it at a rate faster, and then come up with a plan on how to make sure that we always keep our test suite
> optimized and running quickly, as this doesn't need to be something that I keep coming back to. This should be part
> of our build and how we move forward with any new features, because we add tests, but the test suite does not
> increase drastically over time.

**What it was**, measured on four cores before any change (`tools/browser/tour.cjs`, `regress.cjs`):

- **22 stop sets, 246 stops, each replayed at five sizes:** 108 jobs, each its own browser. One size took 470 s; the
  five, about 37 minutes. The run of 2026-11-16 (65 jobs) took 25.6 minutes.
- **How it got there.** The time is the engine's runs, and the sets grew with Larkspur. A stop that opens a day runs
  the whole flow in the browser: 0.5 s on the sign-ins, 3 s on the control estate, 7 to 10 s on Larkspur's twenty feeds.
  One pass over the sets is 166 runs, 76 of them Larkspur days; five sizes made it 830.
- **Where one size's 1,836 job-seconds went:**

  | What | Seconds | Why |
  |---|---|---|
  | Waiting for the page to be still | 333 | after every step, 250 ms with no change to the page: six waits a stop |
  | Waiting for a run that never started | 52 | 2.5 s each time a step started none |
  | Screenshots | 174 | every stop's, the window made tall and put back for each; nobody looks at 1,200 pictures |
  | A close button off screen | 60 | two stops of the split waited 30 s each for a button the split had put away |
  | The app opened again | about 80 | a new browser for every change of colour scheme, and the first day run only to be left for the set's own |
  | The engine | the rest | 166 runs, the engine busy for all of each |

- **What the engine's time is** (a Larkspur day opened, alone on the machine, 7 to 10 s): the run itself 5 s, the
  day's claims before it 2.5 s (each of twenty files measured). The engine is busy from end to end. A month recorded
  in Node under the profiler spends 38% of its time in smaltdb, 16% collecting garbage, 7% in smaltql and 25% in
  smaltfl's own code, spread thin (SHA-256 2.4%, the calendar's periods 2.1%, nothing else over 1.5%). Four engines
  side by side on four cores do 3.1 times one's work; no setting of the browser's changed that.

So two things were wrong, and they need different answers. A third of the time was the tool waiting. The rest was
honest work done five times over, and growing with every day a new stop opened.

## Decision

### 1. Ask the page, don't guess

The tour waited by watching: no change to the page for 250 ms meant it was done. It now asks.

- **The page says when it is at work.** `window.__smaltflBusy()` (`src/app/main.ts`): starting, a run under way, or
  the engine asked something it hasn't answered (`engineBusy`, `src/app/engine.ts`). Beside `__smaltflMonth` and
  `__smaltflEngine`, for the browser tools; it changes nothing the page does.
- **The tour counts what the page started.** A script put in the page before its own (`tracker` in `tour.cjs`) counts
  fetches and the reading of what they answer, hashes and signatures, timers of 400 ms or less, animation frames, idle
  callbacks, and IndexedDB's opens and transactions, until each ends. A frame asked for from inside a frame, more than
  three in a row, is a loop (an animation, a look each frame for something to turn up) and isn't counted. It also
  follows what the page imports while it runs (a bundle loaded when first needed).
- **At rest** is: the app not at work, nothing started and unfinished, and no change to the page for 40 ms (a few
  frames, for what a layout pass draws). `idle()` waits for that and no longer. There is no wait for a run to start:
  a step that starts one makes the page busy before the step returns.
- **A page that never comes to rest is a problem,** not a pause: 180 s with the app at work, or 30 s after the app
  stopped while the page went on (what it started and didn't finish is named). Waiting found two such places at
  once (below).
- **A check that fails is read once more**, after the page has been still for the old 250 ms. A stop fails only on
  what stays wrong, so a check read a moment early costs time only when it is about to fail.
- A build with no `__smaltflBusy` (an older one, for a baseline) is waited for as before.
- An app that doesn't start ends the tour there, saying so, where every stop used to wait out its own limit.

A stop that runs nothing took 2 s; it takes 0.3 s.

### 2. Nothing run only to be left

- **A set opens on its first stop's day.** The app runs the day its link names first (ADR 0021 §4), so a set whose
  first stop names a day is opened on `#day/…`, and the first day isn't run and left. The tour finds the day from the
  data's own list (`data/loads.json`).
- **The other colour scheme in the same page** (`emulateMedia`): the colours are the style sheet's, so nothing is
  opened again. A stop that needs a new browser says so: `"fresh": true` (one did, `rules-tab-dark`).
- **Screenshots where they are looked at.** `TOUR_SHOTS=all` (the tour's default: a person or a judge looks), `fail`
  (the regression's default: the stops that reported a problem) or `none`.
- **A close button that isn't on screen isn't clicked**, and isn't waited for.

### 3. One replay, every size: the sweep

The regression replays each set **once**, at the smallest size it is held to (a phone, the base, ADR 0018 §2), and
after each stop takes the same page to the other sizes by resizing its window (`TOUR_SWEEP`), checking the layout at
each: nothing scrolls sideways, the page or an open sheet. The engine runs each day once, not once a size.

- A stop that only some sizes draw (`devices`) runs at the first of them the window is taken to.
- **What it sees:** a layout that breaks at a width (the commonest fault a change to a screen adds), on every stop,
  at every size.
- **What it doesn't:** what the page decides once, when it opens. On a phone rows are cards; taken to a tablet's
  width they are still cards, where a tablet opened on its own draws a table. And the taps are made at one size.
- **So the replay at every size stays** (`--full`): each set, each size, its own page, as a person at that size
  reaches it. CI runs it on every push, a size a job (§6). A change to a screen's layout still runs the set it touches
  at every size and looks at the screenshots (ADR 0018 §4): one set is seconds to a minute.

Resizing is the app's own behaviour (a window resized, a tablet turned): `resize` redraws the canvas and the month to
the new width. The sweep found no stop that scrolls sideways after it.

### 4. One command

`npm run regress` builds the four demos (seconds once their data is cached) and runs every set, as many at once as
the machine has cores. `npm run regress -- overview tour` runs those; `-- overview --full` replays one at every size.
Before, it was four builds copied out of `dist/` and four commands, each with its own list of sets.

`tools/browser/sets.json` is what makes that possible: each set's demo, the sizes it is held to where not all (the
split is 960 px and up), and its budget.

### 5. The budget

What made the regression slow was added one reasonable stop at a time. So the cost is counted, in the unit that
drives it, and the count is held.

- **A set says how many runs the engine may make for it** (`runs` in `sets.json`: a day opened is a run, and so is a
  decision's, a what-if's, a reload's). The tour reports what it made (`cost:` on its last line), and a set that
  makes more **fails**.
- **A demo says what a run costs on it** (`run`, seconds: Larkspur 9, the estate 3, the sign-ins 0.5), and the sum
  over every set may not pass `budget.engineSeconds`. It stands at 802 of 840: room for four more Larkspur days.
  After that a new day is paid for by taking one out, or by raising the budget in a change the maintainers review.
- **A stops file the manifest doesn't list fails**, so no set is outside the count.
- **The whole run's time** is said at the end against `budget.seconds`, a note on a session's machine and a failure
  with `--timed`.

Counts, not seconds, are what fails: they are the same on every machine, and a stop's cost is known when it is
written. A stop that opens no day costs a third of a second, and is free to add.

### 6. Part of the build

`.github/workflows/ci.yml`: `demos` builds the four demos once (their data cached as the docs deploy caches it), and
`browser` runs five jobs beside each other on them: the session's run (`npm run regress`'s, which replays on a phone),
and the replay at each of the other four sizes. The whole matrix takes the time of one pass: on GitHub's machines
the regression itself took 309 to 546 s a job on its first run (the session's pass 407 s, where a session's four
cores take 314; the widest window the longest), about ten minutes from the push to the last job. A job that takes
twenty minutes is stopped as failed. A failure uploads each job's log, its metrics and a screenshot of every stop
that reported a problem.

### 7. What a session does

- **While changing a screen:** the set it touches, at every size, looked at (`npm run regress -- <set> --full --shots
  all`).
- **Before a PR that touches `src/app`:** `npm run regress`.
- **CI:** everything, at every size, on every push.
- **Adding a stop:** beside the stops already on its day, so it opens none. A stop that opens a day is a run: say
  so in `sets.json`, under the budget. A new set is listed there with its demo. No stop waits a fixed time;
  `waitFor` is for what many runs draw.

## As built (2026-11-16)

Measured on the same four cores, every set passing:

| | Before | Now |
|---|---|---|
| The run before a PR: every set, the layout at every size | 26 to 37 min (the replay at every size) | **5 min 18 s** (`npm run regress`, the demos built) |
| One size, every set replayed | 470 s (1,836 job-seconds) | 320 s (1,178: the engine's runs) |
| Every set replayed at every size | about 37 min | 25 min on four cores; in CI a size a job |
| A stop that runs nothing | 2 s | 0.3 s (1 s with the four other sizes swept) |
| One set while working (the month's, 18 stops, desktop) | 81 s | 28 s |

Every set passes each way: the 22 jobs of the session's run, and the 87 of the replay at tablet, tablet-wide, desktop
and wide (977 stops, 638 runs).

**What waiting for the page found**, in two stops that each spent 4 s at a limit before the rule of §1:

- **A notebook's cells look for themselves for half a second each after they are gone.** A notebook's page fills its
  cells one after another, each once it is on the page (`attached`, up to 30 frames). When another sheet has taken
  the notebook's place, every cell still waits its 30 frames in turn: seconds of frames for nothing. Left as it is:
  a loop of frames isn't counted as work (§1). It costs a reader nothing they see.
- **The Models tab computes for six seconds** on the control estate's posture (the forest's record over sixty days,
  in slices). The tour now waits for it, where it used to go on at two.

**The pieces:**

- `tools/browser/tour.cjs`: `tracker`, `idle`, `started`, `go` (a link, once the page has heard of it), `open` (the
  first stop's day, `fresh`, the scheme), `measure`, `expected` (read again once), `capture`, the sweep; `TOUR_SWEEP`,
  `TOUR_SHOTS`; `cost:`; a wait that ended at its limit said with its stop; its paths taken from where it is run.
- `tools/browser/regress.cjs`: the manifest held to itself, the jobs (a set at a size with the sizes it is swept to),
  `--full`, `--sizes`, `--build`, `--build-only`, `--shots`, `--timed`, `--list`; `regress.json`. It says so at
  once where Playwright isn't installed.
- `tools/browser/sets.json`; `npm run regress`.
- `src/app/engine.ts` `engineBusy`, `src/app/main.ts` `__smaltflBusy`.
- `tools/browser/stops/rules.json`: `rules-tab-dark` is `fresh`. No other stop changed.
- `.github/workflows/ci.yml`: `demos`, `browser`.

## Amended (2026-11-17): flows in flows' sets, and what bringing them in found

[ADR 0026](0026-flows-in-flows.md) was built on one branch while this was built on another, with eleven stop sets of
its own, written for the tool as it was before. They were brought in on 2026-11-17, at the maintainer's request that
the regression run as quickly with them. What changed here:

- **A set does open on its first stop's day now (§2).** It didn't: the tour looked for each load's `day` in the data's
  list, which calls it `slot`, so no day was ever found, and every set ran the first day and left it. With the day
  found, eleven of the 22 sets make one run fewer (`decide`, `proposals`, six of the estate's and three of the
  sign-ins'): 149 runs and 764 engine seconds, where the same sets were budgeted 160 and 802. Two things came with it:
  - a day opened by its own link runs its first files first and then the version readers got (ADR 0021 §2). `compare`
    needs Thu Mar 21's first files not run yet, so it has a first stop on the month and opens the day from there, as
    it always had in effect;
  - a fill can't be withdrawn in an engine that has run no other day (docs/HANDOFF.md, found and left): `carry`
    withdraws its fill on a page opened from the month.
- **A set that goes to another demo of the same site** (ADR 0026 §6: two pages that share a flow; a stop's `"page"`)
  says the runs it may make there: `"with": { "feeds": 8 }`. The tour counts each demo's runs apart (`cost.with`), and
  the regression holds each to its number, adds each at its own demo's cost of a run, and builds the demos side by
  side, as a site serves them. Evidence feeds' own page is a fifth demo (`feeds`, 3 s a run).
- **A day isn't left and come back to.** A day opened again is a run again, so ADR 0026's sets were put in the order
  of their days, and their dark stops before the stop that changes the page (its §"In the regression in minutes"):
  five runs fewer in `levels`, `explore`, `voice` and `tiers` than as first written, and one browser fewer in `carry`.
- **Found in the app by the first run here:** a level entered or left on a day whose file was refused fetched the file
  again and recorded the refusal again. Fixed (`openDay`, where a link changes only the level); `integrity`, which
  enters a flow on its tampered day, makes its four runs again.

**The numbers**, on the same four cores, every set passing:

| | Main, 2026-11-16 | With ADR 0026's sets |
|---|---|---|
| Sets, stops | 22, 246 | 33, 395 |
| Demos | 4 | 5 |
| Runs the sets may make | 160 | 215: 149 in the 22, 66 in the eleven |
| Engine seconds | 802 of 840 | 1,292 of 1,330 |
| `npm run regress`, the demos built | 5 min 18 s | **7 min 35 s** (455 s; 466 with the builds) |
| A changed set replayed at every size | | the twelve sets changed here: 60 of 60 jobs, 16 min |

The eleven sets are 528 engine seconds. The dearest: `follow` 153 (its test of a changed flow runs fourteen Larkspur
days again as what-ifs, 126 by itself, the one place that test is walked), `carry` 87, `use` 72, `build` 54.

**The budget is raised for them, and the maintainer agreed it on 2026-11-17 (Q-246, asked through the question
prompt):** `budget.engineSeconds` 1,330, the same room as before (four more Larkspur days), and `budget.seconds` 510.
Raising it is the maintainers' (§5). The other ways were put beside it and not taken: the test of a changed flow run
on a week of days, not a fortnight (63 engine seconds back, and a change to what the app does); or 840 held by taking
sets and days out (the 22 sets alone are 764, so 76 engine seconds are free under it, eight Larkspur runs for eleven
sets). CI's `browser` jobs replay every set at a size: five to nine minutes a job before, eight
to fourteen expected now, under their limit of twenty.

## The questions, for the maintainers

- **Q-226.** The run before a PR replays each set once and resizes for the other sizes; the replay at every size is
  CI's. Built so.
- **Q-227.** The budget is counted in the engine's runs, a set at a time and in sum (840 engine seconds), and the
  whole run's time is a note outside CI. Built so.
- **Q-228.** Playwright is installed for CI's job alone, as a session has it, not a devDependency. Built so.
- **Q-229.** Five minutes is the engine's floor on four cores, not two: Larkspur's 76 days are 3.2 minutes by
  themselves. Which way under it (below)?
- **Q-230.** With the engine in the page (`?engine=page`, what a browser without workers gets), the second day opened
  is paused where the worker publishes it. Found while measuring; not looked into.
- **Q-246.** ADR 0026's eleven sets take the regression from 802 engine seconds to 1,292, and from five minutes to
  seven and a half. The budget raised to 1,330 (and 510 s for the whole run), or sets and days taken out to hold 840?
  Decided by the maintainer, 2026-11-17: raised (§"Amended").

## Not built

- **Two minutes.** The maintainer asked for a couple of minutes, and the whole regression is five. What is left is
  the engine: 97 of the 246 stops run it, 11 s each with four side by side, 1,067 of the run's 1,228 job-seconds.
  Three ways under it, none taken here:
  - **Every day's claims computed ahead by the build,** as the first day's are (ADR 0019): the 2.5 s before each run,
    a third of a Larkspur day, for a visitor to the demo as for the regression. The build runs every day already (the
    recorder).
  - **The engine itself:** smaltdb is 38% of a recorded month's time and the garbage collector 16%. Stenhoor's, first
    (ADR 0001 §12).
  - **Fewer Larkspur days in the sets:** the tour's set alone opens 18. It would take out more than half of them to
    reach two minutes, which is most of what the sets check.
- **More cores** would do it without any of these: CI has them, a job a size. A session's machine has four.
- **Tables at a tablet's width in the session's run** (§3): the sweep reads them as the phone's cards. CI's replay
  reads them as tables.
- **A long set split across pages.** The tour's set is the longest job (212 s); the run is not held up by it while
  the sum is what it is.
