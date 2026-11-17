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
| `node tools/browser/tour.cjs <appDir> <outDir> <stops.json>` | Serves the built app and drives it through the stops at phone size (390×844; `TOUR_DEVICE=tablet` 820×1180, `tablet-wide` 1180×820, `desktop` 1440×900, `wide` 2560×1440; `TOUR_SCALE=2` for screenshots a person will look at). It never waits a fixed time: it asks the page when it is at rest (`window.__smaltflBusy`, and a count of what the page started and hasn't finished). It fails any stop where the page or an open sheet scrolls sideways, at its own size and at each size in `TOUR_SWEEP=tablet,desktop` (the same page resized), saves `<name>.png` for each stop (`TOUR_SHOTS=fail` for the failed ones alone, `none`) and writes `metrics.json`: the status line, the visible text, word counts, charts, words before the first chart, and every failed `expect` as a problem. Its last lines are `problems: …` and `cost: {…}` (stops, the times the app was opened, the engine's runs, seconds). The stop format and the `expect` checks are documented at the top of the file: a stop's `tamper` changes a file on its way to the page from that stop on, `fresh` opens a new browser with nothing kept, and `expect.download` and `expect.audit` check what a stop downloaded (its name, and a bag's verdict from `node scripts/audit.mjs check`). A stop's `page` goes to another app of the same site, by the name of its folder beside `<appDir>`: both are served from one origin, so they share the browser's records as a site's pages do (`carry.json`). `TOUR_STACK=1` reports a page error with where it was thrown (build with `SMALTFL_PROFILE=1` to read it by name). |
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
- `levels.json`: flows in flows on the canvas (ADR 0026 §3, §4), on the tour (same build as `overview.json`):
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
- `tiers.json`: the month in tiers (ADR 0026 §5), on the tour (same build as `overview.json`):
  - what waits for a decision naming the flow whose file holds;
  - March's flows as rows of days, the days the top flow only waited on Evidence feeds as outlines;
  - February, where Applications held only where HR's file did: the flows that followed or waited, folded, each
    saying whom;
  - a flow's own month by its link (`#month/2024-03/in/feeds`): its counts, its calendar, the day that waits with what
    it gives alone, no scenes and no score;
  - a day held outside a flow (Inventory, Mon Feb 26), normal there, saying the day as a whole was held by another flow;
  - a flow that reads none (HR organisation), with no tier above its files and steps;
  - the ways in and out: a row's *Its own month ›*, a flow read by a flow, the line at the top going back up, a day
    opened inside the flow, a card's *Its month ›*, the day screen's way back;
  - the dark scheme.

  A stop that stays on the month names its link each time (`"view": "month/2024-03/in/feeds", "viewFirst": true`): the
  tour goes back to the day screen between stops. It must report `problems: none` at every size.
- `explore.json`: exploring a dataset (ADR 0026 §9), on the tour (same build as `overview.json`):
  - a file's columns: what a row is, a card a column over every row, how the rows sit with the values written;
  - a bar tapped, lit in every other column; the same part on the next day; **Keep only**, a part picked within what is
    kept by the keyboard (a stop's `press`), the rows kept as one of the reader's cells, and **Every row**;
  - a published table's numbers in bins, the last bin its largest value;
  - how it joins: its scope's list over the keys in scope with the match day by day, another dataset counted when
    opened, the inventory's links, a link the other way, the day a file came empty, a dataset nothing describes;
  - against another day: the nearest day run in the browser, then a day run by a tap and the day on screen put back;
  - from a flow's sheet to what it gives, and the dark scheme.

  Its stops follow one another on one card: a part picked or kept stays while the page is open. It must report
  `problems: none` at every size.
- `whose.json`: a held day decided at the flow that holds (ADR 0026 §6), on the tour (same build as `overview.json`):
  - at the top, where the estate only waits, the day's button says where: *Decide at Evidence feeds ›*;
  - the decision sheet's head: whose it is, what of it holds, and who waits on it;
  - inside the flow that holds, the button is its own, and its sheet has **Decide ›** too;
  - a day the story decided, in the day's story and the month's timeline: *At Evidence feeds, …*;
  - the day decided, and the record's lines saying whose each decision was and which one a following load carries;
  - the dark scheme.

  It must report `problems: none` at every size.
- `follow.json`: a change followed, said and tested (ADR 0026 §7), on Larkspur's month (same build as `month.json`):
  - the day a recorded change takes effect: Evidence feeds' card says CHANGED, and its sheet what changed, who
    recorded it and why;
  - a flow that reads it: what it follows;
  - the change tested on the days before it: each run again as a what-if, and the sheet says what it found;
  - a change made here: the card and the sheet say it at once, with the hash now and as shipped;
  - the dark scheme.

  It must report `problems: none` at every size.
- `build.json`: building in the app (ADR 0026 §10), on the tour (same build as `overview.json`):
  - **Add a flow ›** above the canvas, and the catalogue: each flow with what it gives and what it is built on;
  - Ownership added: the day runs again, its card is on the canvas, its sheet says it was added here, and what it
    gives is explored;
  - the join form, from Applications' apps: the other dataset, the key on each side, the rows kept, the columns;
  - a join the form refuses before anything is written: the TLS feed, which a held day can fill, joined with
    `filled_from` left out;
  - the join written as a cell and read back by the notebook parser, the day run again, the joined dataset open on
    its Explore tab; the record's two lines;
  - what was made here, the join taken out again; the dark scheme.

  Its stops follow one another: what one adds, the next has. It must report `problems: none` at every size.
- `alone.json`: building in a flow that reads no other and ships no catalogue (ADR 0026 §10, §12), on the control
  estate (same build as `estate.json`):
  - nothing above the canvas, and the join form all the same, from app_scores' How it joins;
  - the join written: the joined dataset on its Explore tab, its notebook a box, and the bar above the canvas there
    now, since something was made here;
  - the empty catalogue: *Nothing upstream yet.* with its plain words under it, and what was made here;
  - plain words ticked in About this flow: the empty catalogue says what it is and no more;
  - the join taken out: the notebook and the bar are gone.

  Its stops follow one another: what one adds, the next has. It must report `problems: none` at every size.
- `use.json`: a flow with open inputs used under a name (ADR 0026 §11), on the tour (same build as `overview.json`):
  - the catalogue's flow with inputs: what each use gives, what it reads of its inputs, what each use sets;
  - the form: a dataset for each input, a value for its setting, a name, and what a use is;
  - used on the TLS feed: its card, and its sheet with what is mapped, its setting as the flow has it, the flows it
    reads and what it gives;
  - used again on the WAF feed with a floor of its own and a name: the setting told from the flow's own, the flow
    used twice;
  - what a use gives explored; a use entered; its notebook read as a page, an input's cell with its rows;
  - what a use gives joined to another dataset; the record's lines; the uses and the join kept across a reload; the
    catalogue saying where the flow is used; one taken off;
  - used on a dataset of the estate's own, and inside that use the dataset itself feeding its input; the dark scheme.

  Its stops follow one another: what one adds, the next has. It must report `problems: none` at every size.
- `carry.json`: a decision carried between two pages that share a flow (ADR 0026 §6, second step), on the tour and
  Evidence feeds' own page built side by side, each told where the other is:
  `npm run build:app -- --variant tour --out dist/app-tour --page feeds=../feeds/` and
  `npm run build:app -- --flow examples/larkspur/feeds/flow.json --out dist/app-feeds --page "larkspur=../tour/=Larkspur estate"`,
  copied to `SITE/tour` and `SITE/feeds`, then `regress.cjs SITE/tour OUT carry`. It checks:
  - the estate's page on the tour's Wed Mar 27: Evidence feeds' to decide, a link to that flow's own page on the
    sheet's head and on the flow's sheet;
  - Evidence feeds' own page: its month, *About this flow* naming the flow that reads it, a file of Inventory's no step
    here reads, its Ontology page, and the same day held by the same file;
  - the day decided there, its receipt saying which page takes the decision, and the estate's page taking it when
    the day runs: published as is, the receipt, the record and the month's timeline saying where it was decided, and
    the same once the page is opened again;
  - the estate's audit bag, with the proof of the decision it carried, held by the offline audit;
  - the other way, in a fresh browser (the dark scheme): decided on the estate's page, carried to Evidence feeds';
    changed there, and the change carried back; Evidence feeds' bag held by the offline audit;
  - in a third browser: the flow edited on its own page, a day decided there under those rules, and the estate's page
    not taking it, the sheet saying why;
  - in a fourth: the day filled on Evidence feeds' page, the estate's page making the same fill from its own offer of
    it and publishing it; its bag held by the offline audit, and again once the page is opened in a new engine; the
    fill withdrawn there, and the estate's page taking that too.

  Its stops follow one another: what one decides, the next finds. It must report `problems: none` at every size.
- `voice.json`: the voice (ADR 0026 §12), on the tour (same build as `overview.json`):
  - a gold dataset's seal on a normal day: what the seal is, then *Worth its smalt.*;
  - Certificates added from the catalogue, its first day here gone out as usual: the status line says so, and the
    line once;
  - a held day: the seal part says why it isn't sealed, and nothing playful;
  - plain words ticked in About this flow, and the same seal with the line left out.

  Its stops follow one another: what one adds, the next has. It must report `problems: none` at every size.
- `overrides.json`: the estate's ontology and a flow's own handling of a column (ADR 0026 §8), on the tour (same build
  as `overview.json`):
  - the head of the Ontology page: the estate's ontology by name, hash and path, the flows that read the same one,
    and the one column a flow handles its own way, with its flow, datasets and reason;
  - a handling's dataset tapped: the column's card, which says it is the flow's own handling and what the estate says;
  - the same column in the register's file, whose card notes where it is handled differently and why;
  - as the owner, a column the estate describes edited: the form asks why, refuses a new name with no reason, and
    with one records the change as the flow's own handling, listed at the head and noted on the card;
  - the dark scheme.

  It must report `problems: none` at every size.
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
