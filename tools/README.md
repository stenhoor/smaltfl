# tools

Checks and judging tools used to build and test the app's views (see [docs/HANDOFF.md](../docs/HANDOFF.md)). They
are not part of the package, the tests or the build.

## browser/

They need Playwright with Chromium (`require('playwright')`), and Python 3 with Pillow for the two image scripts.
Build the app first (`npm run build:app`, Larkspur by default; `-- --flow … --out …` for another flow) and copy it
out of `dist/` somewhere, because `npm run build` wipes `dist/`. Pass **absolute** paths.

| Command | What it does |
|---|---|
| `node tools/browser/regress.cjs <appDir> <outDir> <set>[@sizes] ...` | The regression in one command: each named stop set (`estate`, `notebook`, `split@desktop,tablet-wide,wide`, …) at every size, its own `tour.cjs` process, up to one a core at once, the longest first; one line a job and the problems at the end (`regress.json`). `--devices phone,desktop` narrows the sizes, `--jobs N` the parallelism. |
| `node tools/browser/tour.cjs <appDir> <outDir> <stops.json>` | Serves the built app, drives it at phone size (390×844; it waits for the page to stop changing, never a fixed sleep; `TOUR_DEVICE=tablet` 820×1180, `tablet-wide` 1180×820, `desktop` 1440×900, `wide` 2560×1440; `TOUR_SCALE=2` for screenshots a person will look at) through the stops, fails any stop where the page or an open sheet scrolls sideways, saves `<name>.png` for each and writes `metrics.json`: the status line, the visible text, word counts, charts, words before the first chart, and every failed `expect` as a problem. The stop format and the `expect` checks are documented at the top of the file: a stop's `tamper` changes a file on its way to the page from that stop on, and `expect.download` and `expect.audit` check what a stop downloaded (its name, and a bag's verdict from `node scripts/audit.mjs check`). |
| `python3 -I tools/browser/cvd.py <outDir> <png>…` | Greyscale and deuteranopia versions of screenshots (Machado et al. 2009), for the colour check. |
| `python3 -I tools/browser/slices.py <in.png> <out.png> [height] [strips] [start]` | Slices a tall screenshot into side-by-side strips you can read in one image. |

**Stop sets** (`browser/stops/`). The stops in a file run in one session, in order, and later stops depend on what earlier ones ran (which day readers keep, what was decided): run a whole file, not a few stops out of it.
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
- `levels.json`: flows in flows on the canvas (ADR 0025 §3, §4), on the tour (same build as `overview.json`):
  - the top of Larkspur on a normal day: four flows, a card each, with what the posture product has of its own;
  - the day that waits: Evidence feeds paused, its extent counted, the others normal;
  - its sheet: the day in a sentence, what holds it, what it reads, what it gives and who reads it;
  - the holding file a tap away, inside the flow, with the line at the top saying where you are;
  - going back up; entering by a double-click (a stop's `dblclick`, at `desktop` and `wide`) and by the sheet's button;
  - a flow read by two flows, entered through the other (Applications, then Evidence feeds);
  - the next day and a reload, both staying inside the flow on screen;
  - a card inside a read flow opened from the top (the tour goes to the level that draws it: no stop names it);
  - a day decided (Mon Mar 11's first files, filled), and the dark scheme.

  A stop's `in` names the flows to enter first (`"feeds"`, `"applications/feeds"`; `""` is the top) and `flow` the flow
  whose card to open. It must report `problems: none` at every size.
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
