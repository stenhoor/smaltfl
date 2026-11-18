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
- **A flow that changed says so** ([ADR 0026](../adr/0026-flows-in-flows) §7). Its card reads `FLOW · CHANGED` on the
  day a change of its own takes effect, and once it was changed here. Its sheet has **What changed**: each change with
  the day it takes effect from, what it did, who made it and why; the changes of the flows it reads, which it
  *follows*; and the flows that read it and follow in turn. A change is the flow's whose file or step it is about, so
  that flow's hash moves, and its readers' with it.
- **Test on the days before it ›**, under a change, runs the last 14 recorded days again under it, as what-if runs:
  nothing is published and nothing recorded. The sheet says what it found: *Under the changed Evidence feeds, 2 of the
  last 14 days would have paused: Tue Mar 12 and Mon Mar 18; 12 come out the same.* The change stands either way.
- A flow **pinned** by a flow that reads it says so on its sheet, and isn't changed from here until the pin is moved.
- A card opened from anywhere else (the day's head, the news, a scene) takes the canvas to the flow that has it.

#### Building in the app {#building-in-the-app}

The owner can build on the flow from the page ([ADR 0026](../adr/0026-flows-in-flows) §10).

- **Add a flow ›**, above the canvas, opens the catalogue: flows made already and shipped with the build, each with
  what it gives and what it is built on. **Add it ›** puts its card on the canvas and runs the day with it. Its sheet
  says it was added here; each dataset it gives has **Explore ›**. **Take it off** removes it, where nothing reads
  what it gives. A flow whose own step stops its first run here is taken off again at once, and the status line says
  what stopped it.
- **Use it ›**, on a catalogue's flow with inputs ([Flows](./flows#a-flow-used-more-than-once-inputs-and-settings)):
  a form asks for a dataset for each input, among those the day's run built with the columns the flow needs; a value
  for each setting, with the flow's own beside it; and a name. The use is a flow of its own: a card on the canvas, a
  row in the month and its own hash in every run, and what it gives is named after it. **Use it again ›** makes
  another, on other datasets or with other settings. A use's sheet says what it is a use of, what is mapped onto each
  input and what was set here. Its steps and checks stay as the flow wrote them.
- **A join form**, on a dataset's **Explore › How it joins**: *Join them as a new dataset ›* beside a dataset the
  ontology says it joins, or *Join it with another dataset ›*. Pick the other dataset, the key on each side, which
  rows are kept and the columns to take, and name it. The form writes the join as a cell of `joins.nb.ts`, a notebook
  of the flow's own, and the day runs again: the new dataset has a card, and opens on its Explore tab. The cell is
  read back by the same parser that reads a flow's folder, so a join made here is a join written in the flow.
- **Add a source ›**, above the canvas of any flow written as notebooks ([ADR 0027](../adr/0027-the-ontology-over-time)
  §5): a source and its description are made together, through either of two doors.
  - *Here is the data.* Pick a CSV file with a header. It is read in the browser and sent nowhere. The form proposes
    its name, what one row is and its key, and lists every column with what its values read as. Before anything is
    written you confirm what one row is, by which key, and every column: described in your words, or set aside (the
    flow then doesn't take it, and nothing can read it). A column the ontology has a meaning for already needs no
    words. With a reason, **Add it to the flow** writes the source as cells of `sources.nb.ts`, a notebook of the
    flow's own, with a check step that warns of a row without its key; the file is kept in this browser, and the day
    runs again with it.
  - *Describe it first.* Say what the business needs before any file exists: its name, what one row is, its columns
    and its key, with a reason. It is the ontology's from its day and **waits for data**: the Ontology page lists it
    under *Described ahead of their data*. **Bind a file ›** then maps a file's columns onto the described ones: a
    column under another name is read as the described one, a close name is yours to confirm, and the file's other
    columns are described or set aside.
  - A source added here is listed in the same sheet, with **Take it off**, where no step but its own check reads it.
- Each is recorded in words, kept in this browser with every other edit, and listed under **Made here** in the
  catalogue's sheet (a source, in *Add a source*), with the way to take it back. *Back to the flow as shipped*, on the
  Ontology page, takes them all away.
- A flow that reads no other and ships no catalogue has the join form all the same. Once a join is made, **Add a
  flow ›** is above its canvas too, and says the build ships no flow to add.

#### Plain words {#plain-words}

The app is plain where anything is decided, held, hashed or audited. In three places it says a line in the smalt
family's voice ([ADR 0026](../adr/0026-flows-in-flows) §12):

- *Worth its smalt.* under a gold dataset's seal, on a run whose every gate passed with nothing held;
- *Worth its smalt.* once, on the status line, when a flow added from the catalogue went out as usual on its first
  day here;
- *Nothing upstream yet.* in the catalogue of a build that ships no flow to add.

**Plain words**, a tick at the foot of *About this flow* (or `?plain` in the address), leaves them out: each is then
its plain words, or nothing where the screen says them already. The choice is kept in this browser.

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

A held day is **decided once, at the flow that holds**. The decision sheet says whose it is (*Evidence feeds’ to
decide: access_reviews holds. Larkspur estate waits on it.*), and a Decide button outside that flow says where
(*Decide at Evidence feeds ›*). A flow that reads it waits and is never asked: a step of its own held only because the
file under it is, is decided by the file's decision, and the record says so.

A flow another flow reads may have **a page of its own**, on the same files: the site has one for Evidence feeds
([/feeds/](/feeds/){target="_self"}), beside the estate's tour. The two pages share a browser and keep a record each.
A held day decided on either page is **carried to the other**: when the day runs there, the page finds the decision in
the other record, by the file and by the flow's hash, records it as made by whoever made it, citing the entry it
carried, and applies it. Nobody is asked twice; a page left open in another tab takes it when it is looked at again.
The receipt says where it was decided (*Decided on Evidence feeds’ page, and carried here*), and so do the record and
the month; on the page that decided, the receipt says where it is carried to, a tap away. A decision changed on one page is carried in turn. One made under other rules isn't carried: a flow edited
on one of the pages is known by another hash there, and the decision sheet says what was decided and why it isn't
taken. Each page's audit bag carries the proof of what it carried, so the offline audit checks it without the other
record.

## A card's sheet

Tapping a card opens its sheet, the same tabs on every card, the news first:

- **News**: the day's story about the card: one cause, the picture against what is usual, what it reaches, the fix.
- **Data**: its rows, each column's shape on top; a small output opens with its heat table at a glance.
- **Columns**: one column a line, opening into its values and its history.
- **Explore** (a file or a published dataset): the dataset for someone who has never seen it; see below.
- **Checks** (a gated card): each check, written or learned, holding, warning or off; toggling one writes the gate
  cell in the notebook.
- **Rules** (a source): the ontology's rules for the file, each switched on or off for this flow.
- **Models** (a watched card): the isolation forest and the classifier, with their records.
- **Dropped** and **Odd rows**: what a check removed, and rows unlike the rest.
- **History**: the day's numbers against the days before.
- **Integrity**: the file against its list, the run's hashes.

### Exploring a dataset {#explore}

**Explore** starts with what a row is, in a sentence from the ontology: *One row is an application, for those where
exposure is internet or partner and lifecycle is active or retiring: 813 rows, one for each app_id.* Then three parts.

- **Its columns**: a card a column, counted over every row. A category shows its values, the most common first; a
  number its rows in bins; a date its rows over time; the rows with no value are a bar of their own. Where the
  ontology writes a column's values, the card says how the rows sit with them.
  - **Tap a bar** and every other column shows how many of its rows are in that part: tap *Fail* and see which
    protocol the failing certificates use and when they expire. The part and its count stay at the foot of the
    screen. It stays picked as you step through the days.
  - **Keep only** makes the part the rows every count is over. **As a cell ›** writes them as SQL in a cell of your
    own, under the notebook that makes the dataset. **Every row** goes back.
- **How it joins**: the datasets the ontology says share its key or are linked to it. Each is counted on both sides on
  the day's rows: how many of its rows find a match there, how many of the other's keys have a row here, and the first
  keys that find none. Against the list its scope is counted against, only the keys in scope count, and the match is
  drawn day by day.
- **Against another day**: its rows by its key against another day's: rows only in one, and cells that changed. A day
  not run in your browser yet is one tap: it is run, and the day on screen put back.

A flow's sheet has **Explore ›** beside each dataset it gives. What a flow gives of a file is the file's rows, filled
and checked, and is described as the file is.

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

Where the flows share an **estate's ontology** ([ADR 0026](../adr/0026-flows-in-flows) §8), the view says so first:
the estate's name, the hash its ontology travels under, and the flows read here that import the same one. Under it is
every column a flow **handles its own way**: the flow, the datasets of its own it does so in, and why, each dataset a
tap to the column's card. That card says the meaning is the flow's own, and what the estate says in its place; every
other card of the column notes where it is handled differently. Editing a column the estate describes asks why this
flow handles it its own way: the change is saved as that flow's handling, with the reason, and is part of the flow's
hash.

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
