# Working in the app

The app is one page that runs a flow in your browser. Everything here works on the demos; on your own flow the same
screens follow its ontology and its notebooks.

## The screen

- **The month** is where a flow with days opens (ADR 0021, laid out by ADR 0024). From the top:
  - **what waits for a decision**, in any month, each with **Decide ›**. It isn't there when nothing waits;
  - **the months side by side**, where there is more than one: each month's days as a row of bars, with its counts;
  - **the month in a sentence**, beside the month before, and its counts: *‖ 1 Paused*, *☑ 5 Decided*, *⚠ 5 Unusual*,
    *✓ 20 Normal*. A count taps to its days;
  - **the calendar**, a day a cell with one of five marks, and **the day picked**: what held it, what it held back,
    what happened with who decided and why, and **Open the day ›**;
  - **what needed a look**, the month's days that weren't simply normal, a line each;
  - **files and steps over the month**, a row each with a bar a day, the worst first;
  - where the flow names a data product, **its score**: the number, whether it is steady, and what moved it.

  The five marks: ✓ normal; ⚠ unusual, published with something to look at; ‖ paused, waiting for a decision; ☑
  decided, paused and then published by a decision; ☒ not published. How a decided day went out is the word beside it:
  *As is*, *Filled*, *New level*, *Corrected*.

  **For the day** names the month, with ‹ and › to the months either side; a month has its own link
  (`#month/2024-03`). **As known on** shows the month as it stood at the end of a past day. The arrow keys move through
  the days. A demo's month was run and recorded by the build: **Check every day here ▶** runs each day again in your
  browser and checks it against its record.
- **The day** is a day's own screen, with its own link (`#day/2024-03-12`):
  - back to the month, and the days either side;
  - what happened to the day: arrived, checked, held or published, decided;
  - the record's line: recorded by the build, and whether its run here gave the same datasets and holds;
  - the day held, with **Decide ›**, and its news;
  - the day's story, each run and decision of it in order;
  - under all that, the canvas.
- **Viewing as** chooses whose eyes you see with. The flow's policies decide what each person may open, what columns
  are masked, and who may decide a held day.
- **Month**, **Day**, **Ontology**, **Policies**, **Results** and **Record** are the views.

## The canvas

A card is a source or a step; a box is a notebook. A card's line says its day in a few words, and a mark says its
news (an alert, a warning, a fill). Drag to move around, pinch to zoom, hold a card to move it. Tap a box to read the
notebook; **Show its steps on the canvas** unfolds it.

### A flow that reads flows

A flow may read other flows ([Writing a flow](./flows#a-flow-that-reads-other-flows)). Each flow it reads is **one
card** on its canvas, a second sheet behind it, with the word FLOW and the count of what it gives.

- **Its line is its day**, the worst of what is inside it, by the month's marks: a tick and what the flow has; **‖**
  and what holds it with its extent (*tls · 1 of 13 files*); how the day went out once it was decided; *Waits on
  Evidence feeds* where nothing of its own is wrong and another flow's hold keeps its outputs back. Never a score.
- **Tap it** for its sheet: the day in a sentence; what holds it, each a tap from the card inside; the flows it reads;
  what it gives, each dataset with whether today's went out and who reads it; and the hash the flow is known by, the
  same wherever it is read.
- **Open the flow ›**, or a double-click on the card, shows the flow's own canvas: its files, its notebooks, and the
  flows *it* reads as cards. A line at the top says where you are (*Larkspur estate / Evidence feeds*) and goes back.
  It is the same run, so every card shows the day on screen, and Decide, the news and the notebook pages work as at
  the top.
- **Each level has a link**: `#day/2024-03-27/in/feeds`. The days either side keep the level.
- A card opened from anywhere else (the day's head, the news, a scene) takes the canvas to the flow that has it.

On the **month**, the flows are rows of days above their files and steps. A flow's bar for a day is the worst any of
its files or steps said. Open a row for those files and steps.

- A flow that held or was unusual only where a file of a flow under it did **followed** that flow, and says whom
  (*held on Fri 16, following HR organisation*). A flow whose outputs another flow's hold kept back **waited**: a
  dashed outline on that day. Both are folded with the calm flows: the flows listed are those with trouble of their
  own.
- **Its own month ›** on a row, or **Its month ›** on a flow's card, is the month of that flow and the flows it reads
  (`#month/2024-03/in/feeds`): its calendar, its counts and its rows. A day held outside it is none of its business
  there, and says so.
- What waits for a decision names the flow whose file or step holds.

## A card's sheet

Tapping a card opens its sheet, the same tabs on every card, the news first:

- **News**: the day's story about the card: one cause, the picture against what is usual, what it reaches, the fix.
- **Data**: its rows, each column's shape on top; a small output opens with its heat table at a glance.
- **Columns**: one column a line, opening into its values and its history.
- **Checks** (a gated card): each check, written or learned, holding, warning or off; toggling one writes the gate
  cell in the notebook.
- **Rules** (a source): the ontology's rules for the file, each switched on or off for this flow.
- **Models** (a watched card): the isolation forest and the classifier, with their records.
- **Dropped** and **Odd rows**: what a check removed, and rows unlike the rest.
- **History**: the day's numbers against the days before.
- **Integrity**: the file against its list, the run's hashes.

## The notebook page

Tap a notebook's box. Each cell reads top to bottom:

- the notebook's text cells as prose, its SQL a tap away;
- under each step, **callouts** for what a written rule caught and for the day's news about it, each opening the
  card's tab where it is told in full;
- the step's **Output**: its first rows (a summary's open from the start, with its heat table);
- on a watched step, **Models**: the forest and the classifier, opened in place.

**Your cells**, at the bottom, are yours: **+ SQL cell** runs SQL over any dataset of the flow by its name, today's
version (`SELECT … FROM app_scores`), with its result and, where it makes a grid, a picture; **+ Note** keeps a note.
They are kept in your browser and are never part of the notebook, the plan or a hash.

## A held day

A held day's card says why. Its News leads with the cause; the decision sheet offers what the file allows (set in the
ontology's `fixes`):

- **Publish as is**: readers get the day as it came, marked.
- **Don't publish**: readers keep the last good day.
- **Fill**: the missing part from another day (carried forward or back, or a like day), every filled row marked with
  `filled_from` and drawn stippled.
- **The part that arrived**, or **Accept the new level** where the day's change is the new normal.
- **Replace the file**, where allowed.

Each choice is a recorded decision. One is recommended, with its reason; publishing is never preselected.

Readers stay on the latest day ([ADR 0022](../adr/0022-the-answers-of-2026-11-14) §1). A day decided, corrected or run
again after a later day is out keeps its own version for its own screen, and readers' data doesn't move back to it. The
receipt says so: "Published as is · readers stay on Sun 31".

## The ontology

The **Ontology** view is laid out by file: what the file is, the rules about it as a whole, and a card a column, with
its meaning, its values and the rules about it. The owner can rename a column, reword its meaning, label its values,
and add, change or remove a rule. A file read by several flows can share one ontology
(`examples/ontologies/auth.json`): change it once, and every flow that reads the file has the change.

A rule edit takes effect from a day ([ADR 0021](../adr/0021-time) §5). **Edits take effect from** offers the next day
to arrive (the default: no day already recorded moves), the day on screen, or any day, and says what a change reaches.
A name or a label takes effect at once, on every day.

Back-dated, a change reaches days already recorded: each runs again under the new rules, the month marks the days whose
outcome would change, and one decision restates them, with a reason. Untick a day to leave it as readers had it; days
that come out the same are noted. Where no day's outcome would change, the restatement still waits: someone who may
publish a day signs the days off as the same, with a reason ([ADR 0022](../adr/0022-the-answers-of-2026-11-14) §1). A
day published as is keeps that decision where the new rules hold it by nothing else. A day restated as not published
isn't learned from by the days after it. A day's screen shows the rules in force on it, by hash, and what is new on the
day.

The Ontology view lists the **versions** of the rules: each set of changes in force on some day at some moment, with
its hash, the days and moments it was in force, and how many recorded runs ran under it. It marks the version on
screen, the one in force on the day as known now, and the one as known on the moment the month is read at. Any two
versions compare rule by rule: a rule added, changed or taken out, a band, a check's mode, a rule switched.

**What if… ›** on a day runs it on any of its files (as it arrived, or as sent again) under any version of the rules:
the whole flow, judged as the day was. A what-if is marked as one, held so nothing of it is published, and never
recorded; it is on screen until **Back to the day**. Its line says what it would have come to, and **Compare** puts it
beside the version readers got. **Make this the day's ›** makes it the day's in one tap, with a reason, on the same
screen ([ADR 0022](../adr/0022-the-answers-of-2026-11-14) §1). It says first what that does:

- **Other files:** they go in as sent again, a version of the day of their own, published as is.
- **Other rules:** the day takes them for that day only and is restated under them, published where they pass.

It asks someone who may publish a day, and the owner where it takes other rules.

Edits are kept across a reload and listed with **Back to the flow as shipped**.

## The record and verify

The **Record** view lists every run made in your browser with its manifest. **Verify** checks a run at three levels, up
to rerunning it from its inputs. Decisions go into a hash-chained record (RFC 9162). **Export for audit** downloads the
bag for an offline check (`node scripts/audit.mjs check BAG.zip`).

A file whose bytes don't match the data's list is refused, whichever source it is for. The day doesn't run, and that
file's card shows a broken seal. Its sheet shows the hash listed beside the hash received, and offers to fetch the
file again.
