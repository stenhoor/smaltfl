# ADR 0024: The month at a glance

- **Status:** proposed, 2026-11-16, and built as proposed for the maintainers to confirm (Q-219 to Q-225). The
  maintainer asked for research into how this kind of screen is best done and for a solution; the research is
  [docs/research/ui-month-overview.md](../research/ui-month-overview.md).
- **Date:** 2026-11-16
- **Builds on:**
  - [ADR 0021](0021-time.md): the month screen and the recorded month. This ADR lays its screen out again.
  - [ADR 0023](0023-the-demo-as-a-tour.md): the tour, two months, and its scene list on the month.
  - [ADR 0020](0020-the-estate-as-a-company.md): the posture product and its score.
  - [ADR 0008](0008-visual-first-news.md): one meaning a mark, words budgeted.
  - [ADR 0018](0018-phone-tablet-and-desktop.md): phone, tablet and desktop.
- **Changes:**
  - ADR 0021 §3: the grid of files and steps by day becomes rows of days (§5), and its filters become the counts'
    (§2). *For the day* gains its arrows.
  - ADR 0023 §4: the scene list sits behind a bar at the head of the month, closed at first (§1).

## Context

The maintainer, 2026-11-16, on the tour's month screen at `/app/`:

> So I like what we're doing here, but there's a few things I think we could do a lot better. I think we should be able
> to page through the different months. That might be nice. If I click on one of the days, the pop-up panel on the
> right isn't particularly helpful at figuring out what was actually going on that day. The symbols are a little
> confusing. Maybe we could work on those a little bit better. I also don't really understand the score and why it's
> fluctuating. And then when we open up the files to see all the different steps, it's just like so much information.
> It's a little overwhelming. And maybe it's worth rearranging some of these things. I'm not exactly sure. I'd like you
> to do a deep dive on best UI practices for this type of stuff and come up with a solution so we can get a very quick
> high-level overview, month over month, which ones are doing well, where did things kind of break, where should we go
> investigate, are things trending the right direction, are our incoming data sets doing well, or are we having bigger
> problems?

**What the screen was**, measured on the tour at desktop size before the change (`tools/browser/tour.cjs`):

- **1,155 words, 437 of them before the first chart.** The scene list filled the first screen: the month began below it.
  On a phone, two screens of scenes came before the calendar.
- **Two months stacked**, with no way from one to the other but scrolling.
- **Ten glyphs in the calendar's one slot** (✓, ⚠, ‖, a flag, a round arrow with a small count, a half box, a stepped
  line, a crossed box, a dashed ring, a hexagon). Two facts shared the slot: what the checks made of the day, and what
  people then did.
- **The day picked said five lines**: a headline cut from the record (`platform_impact: Platform_id log-dc: 9.1%
  (usually 10–13%)`), when the files arrived, a count, *Recorded by the build*, and a button.
- **The score was a line with no words**: no definition, no verdict, an axis from 85 to 100.
- **The grid's first row opened to 60 rows of 60 cells.** About 3,600 cells, some 30 of them carrying a mark. It read
  each day's latest run, so a file that broke and was sent again right showed nothing where it broke.
- **A day changed its mark once opened.** A day whose followed dataset was calm while another file was unusual read ⚠
  from the record and ✓ once it had run in the browser (docs/HANDOFF.md, ADR 0023's second point left).

**What the research says**, in the ten rules it adds up to (the sources are in the research notes):

1. Say the month in a sentence first, with its counts.
2. What waits for a person goes above everything, and is gone when nothing waits.
3. One month on screen, with a pager and a link of its own; the months side by side as small multiples.
4. Calm by default: a normal day is grey and small, and colour is for what needs someone.
5. Five marks and words: what the checks found is the mark, what people did is a word.
6. The key is the count: each mark is taught beside its number.
7. A day's panel in sentences, in a fixed order, with nothing vital in a tooltip.
8. A strip for each file, the worst first, the clean ones folded into a count.
9. A day with no data is drawn as no data, never as fine.
10. The score with its definition, a verdict from a rule, a stated axis and what moved it.

## Decision

### 1. The order of the page

The month answers its reader's questions in the order they are asked. A phone's order is the order of the page; wider
windows set parts side by side (§8).

| # | Part | The question it answers |
|---|---|---|
| 1 | **The month on show**, with ‹ › and *As known on* | which month am I reading, and as known when |
| 2 | **What this demo shows**, a bar that opens (a demo only) | where do I start |
| 3 | **Waiting for a decision**, across every month | what needs me |
| 4 | **The months side by side** (more than one month) | month over month, which way is it going |
| 5 | **The month in a sentence**, with its counts | how did the month go |
| 6 | **The calendar** and **the day picked** | when did things break, and what happened that day |
| 7 | **What needed a look**, a list | where should I go and investigate |
| 8 | **Files and steps over the month** | are the incoming files doing well, or is the trouble ours |
| 9 | **The score** | is what we publish steady |

- **What waits is above everything** and spans every month: it is the one thing on the screen that needs a person. Each
  row is the day, what holds it, how long it has waited, and **Decide ›**. With nothing waiting, the part isn't there.
- **The scene list sits behind a bar**, closed at first, and stays as the visitor left it. Open, it is the list ADR 0023
  §4 built. Closed, it is one line, and the month starts on the first screen.

### 2. The month in a sentence, and its counts

- **One sentence, the conclusion first** (`headlineOf`): *25 of 31 days went out on their own, 5 with something
  unusual. 6 were paused for a decision: 5 published by a decision and 1 still waits.* A month where every day was
  normal says that and no more.
- **Beside the month before** (`againstSaid`): *11 of 31 days needed a look, more than February (5 of 29).* Each count
  is said with its own total, since months differ in length. An arrow and the word say the way, never a colour alone.
- **The counts are the key.** Each mark sits beside the number of days it stands for and its word: *‖ 1 Paused*, *☑ 5
  Decided*, *⚠ 5 Unusual*, *✓ 20 Normal*. Tapping one shows only those days, in the calendar and in the list.
- **The months side by side** are one design each: the month's name, a bar for each of its days (§5's bars), two lines
  of counts and the score's first and last. The one on show is ringed, and each is a link to its month.

### 3. Five marks, and words

A day comes to one of a few outcomes (`outcomeOf`). What the checks found is the mark. What people then did is a word.

| Mark | Word | What it means |
|---|---|---|
| ✓, small and grey | Normal | published, every check passed |
| ⚠ | Unusual | published, with something to look at |
| ‖, in the one filled cell | Paused | it waits for a decision |
| ☑ | Decided | paused, then published by a decision. How is a word beside it: *As is*, *Filled*, *Part only*, *New level*, *Corrected*, *Restated* |
| ☒ | Not published | paused, then kept back |

- **Rare ones keep their own marks** and show only where a month has them: ◌ not judged yet, ⬢ the run failed, a dashed
  cell for a day not arrived or not run.
- **The flag, the half box, the stepped line and the round arrow leave the calendar.** They stay where they sit beside
  their words: the decision sheet's options and a decided day's receipt.
- **☑ is new** (`glyph('decided')`): the box of ☒, ticked. A person's decision is the box, and what is in it says
  whether the day went out.
- **No superscript count.** A day's versions are said in words, on its panel.
- **Colour is for the day that waits**: the one filled cell. A normal day's check is grey, where it was the brightest
  thing on a dark screen. No other cell has a coloured edge.
- **From tablet width a cell has its word and the dataset the day is about.** A normal day has neither. A phone's cell
  has the date and the mark, and the list under the calendar has the words.
- **A day is named by its file** where one of the file's own steps said it (a step that reads that file and nothing
  else: its fill, its checks). Fri Feb 16 is *hr_org_units*, not the step `org_chain` that caught it.

### 4. The day picked

Told in a fixed order, in sentences, from the record alone:

1. **The day and its mark**, with its versions where it has more than one.
2. **What it came to**, in a line (`outcomeSaid`): *Paused, then published filled from another day.*
3. **What held it**, then **what was unusual**: every finding of the day's files as they first arrived, each with its
   dataset, whether it is a file or a step, and what was said. What a file was told leads what a step was told, which
   often only follows it. More than three datasets not judged are said in one line.
4. **What it held back**: how many of the outputs waited behind it, and the first few by name.
5. **What happened**, oldest first (`dayTimeline`): the files arriving and what the checks made of them; each file sent
   again, with the reason the sender gave; each decision, with who took it, how long after the day was held, and why;
   each restatement.
6. **The score that day**, against the day published before it. Where it moved a quarter of a point or more, the
   controls that moved it.
7. **Decide ›** while it waits, and **Open the day ›**.
8. **Where it comes from**: recorded by the build, and whether its run here matched.

On a phone or a tablet the panel sits under the calendar, and a tap on a day brings it into view.

### 5. Files and steps over the month

- **A row is a file or a step, a bar is a day** (`healthOf`, viz.ts `dayBars`). The height says what the day came to: a
  low bar, nothing to report; half height, unusual; full height, it held the day. A held day is solid while it waits
  and hollow once decided. A day not judged is a low hollow bar. A day with no run has no bar: absence is never drawn
  as fine.
- **A day's bar is the worst its runs said**, not the latest. A file that held the day and was sent again right is
  still held on that day: the row shows where it broke.
- **A file's row is everything that judges the file alone**: the source, and the steps that read it and nothing else
  (`healthRows`).
- **The worst first, the clean folded** (`worstFirst`). Rows that held a day lead, then rows that were unusual. Rows with
  nothing to report are one line with their count, which opens to them.
- **A step that only followed a file is folded too.** A step's days are *its own* where no file it reads accounts for
  them: it held while none of its files held, or was unusual while none of them was. The line over the steps says how
  many had a day of their own. That is the answer to *the incoming files, or bigger problems?*: trouble caught at a
  file's own checks is the file's, and trouble only a step's rule caught is inside the flow.
- **Each row says its days in words** beside its bars: *held on Wed 27 · unusual on Sun 10*.
- **A phone has them too.** The grid started at tablet width.

### 6. The score

- **The number, and what it is a share of**: *93.8 of 100 on Sun Mar 31*, then *1,139 of 19,164 checks failing (−33
  since Fri Mar 1) · coverage 99.2%: 19,164 of 19,321 checks have evidence.*
- **A verdict from a rule, not from the sign of the change** (`scoreRead`): a score whose first and last days are under
  half a point apart is *steady*, the rule `trendSaid` already has. *Steady: between 93.0 and 93.8 over 30 days
  published, +0.3 from Fri Mar 1 to Sun Mar 31.* A change is said in points.
- **What it is, in a sentence**, always on screen: the data list's `posture.about`.
- **The line over every month**, the month on show washed and ruled on the axis. The axis is stated at its ends, the
  last value is labelled, and a day not published is a dashed stretch, said in words under it. A phone's sixty days
  are a line with its last point, not sixty dots.
- **What moved it** over the month on show (`moversOf`): the applications failing each control on its first and last
  day published, the biggest change first, the first four.
- **The recorder says what the score is a share of** (`scripts/data/record.ts`): each published day's mark gains the
  checks that apply, those with evidence and those failing, and the applications failing each control, read from the
  product's scorecards; the month file gains the controls' names. All optional: a month recorded before reads as it did.

### 7. Paging and links

- **One month on screen**, with ‹ and › either side of its name. At an end the arrow stays, disabled.
- **A month has its own link**: `#month/2024-03`. `#month` alone is the month last shown, and at first the latest month
  with a day known: a reader of a running flow wants now before then.
- **The day picked** is the one tapped; else the month's first day still waiting; else the day on screen; else the
  latest.
- **The arrow keys move through the days** and the panel follows; Home and End go to the ends of the week; Page Up and
  Page Down turn the month. The calendar is one Tab stop.
- **Back from a day** goes to that day's month.

### 8. Phone, tablet and desktop

- **Phone (390):** one column, in the order of §1. A cell is the date and the mark.
- **Tablet (820):** a cell gains its word and its dataset; a file's row is its name, its bars and its words on one line.
- **Tablet sideways and desktop (from 1180):** the calendar and the list on the left, the day picked on the right. Two
  or three months sit in the head's row, beside the pager.
- **Wide (from 1800):** the calendar, the day picked and the list side by side; the files and steps beside the score.

### 9. What it changes

- **A day reads the same once it has run here.** Where the followed dataset was calm and another watched dataset was
  told something unusual, the day is unusual by it, as its recorded run says (`calendarDayOf`). It read ✓ once run.
- **The grid's filters go** (every day, waiting, corrected, held). The counts filter by outcome; *corrected* is the
  word on a decided day.
- **The month file's posture marks grow**, and the data for every demo is made again (the recorder is part of what the
  data's cache is keyed by).
- **The stop sets that read the month** follow its new parts: `month.json`, `tour.json`, `versions.json`,
  `restate.json`.

## As built (2026-11-16)

- **`src/core/overview.ts`**, pure, with `test/overview.test.ts`:
  - a day's outcome from what the calendar says of it (`outcomeOf`), its word and its line (`OUTCOME_WORD`, `HOW_WORD`,
    `outcomeSaid`);
  - a month counted and said (`summaryOf`, `headlineOf`), and beside the month before (`againstSaid`, `againstWay`: the
    same within two points of a hundred, since a day more or less in a month is noise);
  - what a run said of its day, each thing once (`findingsOf`);
  - the month's rows and their days (`healthRows`, `healthOf`, `followsFiles`, `worstFirst`, `healthSaid`);
  - the score read (`scoreRead`, `readSaid`, `moversOf`, `pointsSaid`, `countSaid`).

  It is not part of what the data's cache is keyed by, so a change to it keeps every demo's data.
- **Drawings** (`src/app/viz.ts`, `test/viz.test.ts`): `glyph('decided')`; `dayBars`, a row of days as bars, each day a
  column to point at or tap; `scoreTrend` takes the month on show (`focus`) and draws a point a day only where the
  days have room for one.
- **The screen** (`renderMonth` in `src/app/main.ts`, `src/app/page.html`):
  - the parts of §1 in order. Each list is capped where a month is troubled, the worst first: three waiting days, twelve
    days that needed a look, eight rows a group, the rest a tap away;
  - `#month/2024-03` (`routeOf`); the day screen's way back goes to its day's month;
  - the scene list is a `details`, its state kept in the browser (`smaltfl:scenes`);
  - **Decide ›** on the month opens the day with its decision, as a scene's look does (`openDecision`);
  - the keyboard's focus is put back where it was after the month is drawn again, and goes with the day picked;
  - a screen reader hears the day and what it came to as the pick moves, not the whole panel.
- **The recorder** (`scripts/data/record.ts`, `src/core/month.ts`): `PostureMark.checks` and `failing`,
  `MonthFile.controls`, from the scorecards and the dataset the data list's `posture.controls` names. Larkspur's data
  list says what the score is (`posture.about`). The tour's month file is 10.81 MB, from 10.79.

**Measured** on the tour (`tools/browser/tour.cjs`'s page, at each size):

| | Before | After |
|---|---|---|
| Words before the calendar | 427 | 123 |
| Where the calendar starts: phone, desktop, wide | 2,161 px, 1,018 px, 875 px | 912 px, 577 px, 577 px |
| Marks the tour's calendar draws | 7 of 10 | 4 of 5 |
| Days on screen | 60, two months stacked | 31, one month, the other a tap away |
| Files and steps, opened | 60 rows of 60 cells for the first notebook | 11 rows of 31 bars: 10 files, 1 step |
| The page's height: phone, desktop, wide | 3,212 px, 2,370 px, 1,761 px | 4,371 px, 2,815 px, 1,781 px |

The page is longer on a phone and a desktop: it has two parts it didn't have (what needed a look, and the files and
steps on a phone) and the day picked says more. What a reader meets first is shorter.

**What it says of the demos:**

- **The tour, March:** *25 of 31 days went out on their own, 5 with something unusual. 6 were paused for a decision: 5
  published by a decision and 1 still waits.* More than February (5 of 29 days needed a look). Five of 22 files held a
  day and five more were unusual on one. One step of 28 had a day of its own; five only followed a file. The score is
  steady: between 93.0 and 93.8.
- **The tour, February:** two paused days, both decided. Fri 16 is the HR file's: one of its own steps held it. No step
  had trouble of its own.
- **Larkspur's planted March:** *15 of 31 days went out on their own, 12 with something unusual. 16 were paused for a
  decision: 8 published by a decision, 4 kept back and 4 still wait.* Seven steps of 28 had a day of their own, as its
  silver and gold days were planted to. The score is down 1.6 points, and what moved it is named: the access reviews
  (17 to 145 applications failing), the vulnerabilities past their SLA (104 to 215), the disaster-recovery exercises
  (5 to 93).
- **The control estate:** 18 days wait; the month lists the three that have waited longest.
- **The sign-ins:** one file, five days waiting; its steps read it alone, so they are its row.

**Checked:**

- `npm run check`: 94 files, 1,278 tests (`test/overview.test.ts` is new; `test/viz.test.ts`, `test/month.test.ts` and
  `test/datalist.test.ts` grew).
- `npm run test:tour` on the tour's month as recorded again (`SMALTFL_TOUR_WORK`): its answer key holds.
- `tools/browser/stops/overview.json`, new, eighteen stops on the tour: the month as it opens, the day that waits, a
  count's filter and back, a day told in order, the rows and their folds, a bar tapped to its day, the score, February
  by its link, a day named by its file, Presidents' Day, the arrow keys and Page Down, the scenes opened, the dark
  scheme, a day that reads the same once it has run here, and **Decide ›** from the month. `tour.cjs` gains `press`.
- `tour.json` opens the scenes from their bar and reads the months as cards; `month.json` reads the counts, the rows
  and the score where it read the grid and its filters; `versions.json` and `restate.json` follow the new words.
- The browser regression (`tools/browser/regress.cjs`), every demo's data made again on this branch's recorder. The
  sets that read the month ran at phone, tablet, tablet-wide, desktop and wide; the others at phone and desktop:

  | Demo | Sets | Jobs passed |
  |---|---|---|
  | The tour | overview, tour, at every size; proposals | 12 of 12 |
  | Larkspur's planted month | month, versions, at every size; decide, larkspur, posture, compare, whatif, integrity | 22 of 22 |
  | The sign-ins | restate, at every size; rules, fixes, models, columns | 13 of 13 |
  | The control estate | estate, notebook, bronze, apps, joins; split from 960 px | 13 of 13 |

**Where the text changed as it was built:**

- **Three caps** (waiting, the list, a group's rows) came from the control estate and Larkspur's planted month, where
  18 waiting days and 28 days needing a look buried the calendar again.
- **A step that only followed a file is folded**, which §5 gained once the rows were on screen: March's six rows of
  steps were five symptoms of three files.
- **A day is named by its file** (§3) for the same reason: the calendar said `org_chain` where the rows said
  `hr_org_units`.

## The questions, for the maintainers

Each is built as proposed (docs/OPEN_QUESTIONS.md):

- **Q-219:** five marks on the month, and how a decided day went out as a word.
- **Q-220:** one month on screen with a pager, opening on the latest month with a day known.
- **Q-221:** the scene list behind a bar, closed at first.
- **Q-222:** files and steps as rows of days in place of the grid: the worst first, the clean folded, a step that only
  followed a file folded.
- **Q-223:** a row's day is the worst its runs said, hollow once decided.
- **Q-224:** the score steady under half a point, with its checks and what moved it recorded by the build.
- **Q-225:** a day run here reads as its record does.

## Not built

- **A link to the day picked** (`#month/2024-03/07`): a month has a link, the pick doesn't.
- **A year at a time.** The months side by side wrap as they grow, and the score's line runs over all of them; nothing
  folds twelve months into quarters.
- **A usual range for the score** (a process-behaviour band): the verdict is by the ends' difference alone.
- **The score split by rate and by mix**: what moved it is counted by control, not by how the applications changed.
- **Days of one cause merged into one incident**: the list has a line a day.
