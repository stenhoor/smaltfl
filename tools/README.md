# tools

Checks and judging tools used to build and test the app's views (see [docs/HANDOFF.md](../docs/HANDOFF.md)). They
are not part of the package, the tests or the build.

## browser/

They need Playwright with Chromium (`require('playwright')`), and Python 3 with Pillow for the two image scripts.

**The regression is one command: `npm run regress`** (ADR 0025). It builds the four demos into
`node_modules/.cache/smaltfl/apps/` (seconds once their data is cached) and runs every stop set on the demo it is
written for, five minutes on four cores. `npm run regress -- overview tour` runs those sets alone, and `npm run
regress -- overview --full --shots all` replays one at every size with every stop's screenshot, to look at. For the
tour by itself, build the app (`npm run build:app`, Larkspur by default; `-- --flow … --out …` for another flow)
somewhere outside `dist/`, because `npm run build` wipes `dist/`, and pass **absolute** paths.

| Command | What it does |
|---|---|
| `node tools/browser/regress.cjs [set[@sizes] ...]` | The regression (`npm run regress` is this with `--build`): each set the manifest lists (`sets.json`), or those named, its own `tour.cjs` process, up to one a core at once, the longest first; one line a job (its stops, its runs against its budget, its seconds) and the problems at the end (`regress.json`). By default a set is replayed **once**, at its smallest size, and its page is resized to its other sizes after each stop, the layout checked at each; `--full` replays it at every size. `--sizes phone,desktop` narrows the sizes, `--jobs N` the parallelism, `--shots all\|fail\|none` the screenshots (default: the stops that failed), `--apps DIR` and `--out DIR` where the demos are and the results go, `--list` prints each set's cost, `--timed` fails a whole run over the manifest's seconds. |
| `node tools/browser/tour.cjs <appDir> <outDir> <stops.json>` | Serves the built app and drives it through the stops at phone size (390×844; `TOUR_DEVICE=tablet` 820×1180, `tablet-wide` 1180×820, `desktop` 1440×900, `wide` 2560×1440; `TOUR_SCALE=2` for screenshots a person will look at). It never waits a fixed time: it asks the page when it is at rest (`window.__smaltflBusy`, and a count of what the page started and hasn't finished). It fails any stop where the page or an open sheet scrolls sideways, at its own size and at each size in `TOUR_SWEEP=tablet,desktop` (the same page resized), saves `<name>.png` for each stop (`TOUR_SHOTS=fail` for the failed ones alone, `none`) and writes `metrics.json`: the status line, the visible text, word counts, charts, words before the first chart, and every failed `expect` as a problem. Its last lines are `problems: …` and `cost: {…}` (stops, the times the app was opened, the engine's runs, seconds). The stop format and the `expect` checks are documented at the top of the file: a stop's `tamper` changes a file on its way to the page from that stop on, `fresh` opens a new browser with nothing kept, and `expect.download` and `expect.audit` check what a stop downloaded (its name, and a bag's verdict from `node scripts/audit.mjs check`). |
| `python3 -I tools/browser/cvd.py <outDir> <png>…` | Greyscale and deuteranopia versions of screenshots (Machado et al. 2009), for the colour check. |
| `python3 -I tools/browser/slices.py <in.png> <out.png> [height] [strips] [start]` | Slices a tall screenshot into side-by-side strips you can read in one image. |

**Stop sets** (`browser/stops/`). The stops in a file run in one session, in order, and later stops depend on what earlier ones ran (which day readers keep, what was decided): run a whole file, not a few stops out of it. A set whose first stop names a day opens the app on that day.

**The manifest and the budget** (`browser/sets.json`, ADR 0025 §5). Every stop set is listed with the demo it runs on
(`tour`, `larkspur`, `estate`, `signins`), the sizes it is held to where not all, and `runs`: the runs the engine may
make for it. A run is what a stop costs: a day opened, a decision, a what-if, a reload (9 s on Larkspur, 3 s on the
estate, half a second on the sign-ins); a stop that opens no day costs a third of a second. The regression fails a set
that makes more runs than it says, a stops file the manifest doesn't list, and a sum of runs over
`budget.engineSeconds`. So: put a new stop beside the stops already on its day; if it must open a day, raise the set's
`runs` and keep the sum under the budget, taking a day out elsewhere if need be. `node tools/browser/regress.cjs
--list` prints what each set costs.
- `apps.json`: the estate's application scores and the summaries by type of application at a glance (the heat
  tables on the Data tab: control by hosting and criticality, the controls failed together, profiles at risk).
- `bronze.json`: the bronze card (ADR 0015 amendment 2): waf's Quality on the held Tue Mar 12 (the verdict, its issues, every
  check), its Notebook (the file read, the gate, a cell an issue), a clean tls, and the link from a check to its line on
  the Ontology page and back. Run it at every size.
- `split.json`: the desktop split on the control estate (the bar, each side given the whole window and brought back, a
  card opened from the flow's whole window, a notebook in the workspace); run it at `desktop`, `tablet-wide` and `wide`.
- `estate.json`: the control estate's screens (`npm run build:app -- --flow examples/control-estate/flow.json --out
  dist/app-estate`): a calm day, the held days of ADR 0014's answer key, and bronze, silver and gold cards with their
  News, Checks and Data, each stop with a `what` a judge reads. Its days run in order, since a day's due check reads
  the day before. Its first expectations are on the Ontology stops (ADR 0015 amendment 1: the files listed, a
  control's section and the inventory's opened, a file on the day it is refused, a due date's file, a held day's rows
  beside the rules, light and dark); the rest come with the fixes of docs/HANDOFF.md's review.
- `rules.json`: rules set on a file's columns, on the sign-ins (`npm run build:app -- --flow
  examples/security-signins/flow.json --out dist/app-signins`): the Ontology page's rules, a rule added, the import
  card's Rules tab, a rule switched off, a reload and dark. It must report `problems: none`.
- `models.json`: the two models on the sign-ins (same build as `rules.json`): the sign-in file's Models tab on a calm
  day, on Thu Mar 14 (the forest speaks) and Tue Mar 19 (the classifier speaks, the client first), and dark.
- `fixes.json`: the fixes the sign-in file allows, on Fri Mar 15 (its file came empty): the fill carrying Thu 14
  forward, Replace the file, no like day offered as an estimate.
- `decide.json`: deciding held days on Larkspur, a flow that watches several datasets (Q-193, ADR 0010 §16; same build
  as `month.json`). Tue Mar 12 and Mon Mar 18 are published as is, each one choice recorded as a decision for each held
  file and one release citing them, and Wed Mar 13 is kept back. After a reload, the decisions are applied again from
  the record. It must report `problems: none`.
- `month.json`: the month and the day screens on Larkspur (ADR 0021; `npm run build:app -- --flow
  examples/larkspur/flow.json --out dist/app-larkspur`): the recorded March as ADR 0024 lays it out (what waits, the
  month in a sentence, its counts as filters, the files and steps as rows, the score said), Tue Mar 12 picked and
  opened (run here and checked against its record), Mon Mar 18 by its link with its story, and the month as known at
  the end of Fri Mar 15 and back to now. A stop's `day` is found by the month's label (`window.__smaltflMonth`) and
  opened by its link (`#day/YYYY-MM-DD`).
- `overview.json`: the month at a glance (ADR 0024) on the tour (`npm run build:app -- --variant tour --out
  dist/app-tour`):
  - the month as it opens: March on show, the day that waits above everything, the months side by side, the month
    in a sentence beside February, its counts, the scenes behind their bar;
  - a count tapped to its days, and back;
  - a day told in order (Mon Mar 11: held, filled, the corrected file, each with who and why), and the day that waits;
  - the files and steps as rows of days, the steps that followed a file opened, a bar tapped to its day;
  - the score said, with what moved it;
  - February by its link, a day named by its file (Fri Feb 16), Presidents' Day's files not judged in one line;
  - the arrow keys and Page Down (a stop's `press`), the scenes opened, the dark scheme, and **Decide ›** from the month.

  Run it at every size. It must report `problems: none`.
- `integrity.json`: integrity in the browser (ADR 0006) on Larkspur (same build as `month.json`), the taxi's suite
  ported. It checks:
  - the first day's files, each sealed;
  - tls's Integrity tab back to the bytes, and Re-derive from the files;
  - the gold steps sealed once re-derived;
  - the record intact and signed, and each run's files by hash;
  - the audit bag downloaded and held by the offline audit (`expect.audit`), and a checkpoint;
  - the first run re-derived with Tue Mar 5's twenty files pinned;
  - Tue Mar 12's TLS file changed on its way to the page (a stop's `tamper`): the day refused, only tls's seal shown and
    broken, its Quality and Integrity tabs saying so with both hashes' prefixes;
  - the next day sealed again.

  It must report `problems: none` at every size.

## judges/

Claude Code Workflow scripts (run with the Workflow tool, `args: { scratch: '/abs/dir', … }`). The rounds that judged
the retired taxi example's screens (2026-11-15) are in the repository's history; `two-minute.md` is the test, now on
Larkspur.

- `estate-panel.workflow.js`: a panel over a capture of `estate.json` (`args: { metrics: '/abs/capture/metrics.json' }`):
  a leader's ten-second glance, the layers as a flow, ten leadership questions, the options and their trade-offs,
  honesty against ADR 0014's answer key, and the two-minute brief with its grader. First run on 2026-11-10: 29 of 35.

The scripts name the folders the 2026-11 session used inside the scratch directory: captures such as `final-cap5/`,
builds such as `app-vf13/`, and the grader's results `final-result3.json`. Rename them to yours.
