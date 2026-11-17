# ADR 0025: Flows in flows

- **Status:** accepted, 2026-11-17: the maintainer's answers to Q-226 to Q-234, asked through the question prompt once
  the research was in. The choices the answers leave open are built as proposed, for the maintainers to confirm (Q-235
  on). Built in the slices of §12.
- **Date:** 2026-11-17
- **Builds on:**
  - [ADR 0004](0004-the-flow-plan.md): people say what, the machine decides how; keys hash the plan, never a name.
  - [ADR 0009](0009-paused-not-published.md): a day that is off is paused, and a person decides.
  - [ADR 0011](0011-notebooks-as-the-step-surface.md): a flow is a folder, its steps its notebooks' cells.
  - [ADR 0014](0014-gates.md) and [ADR 0015](0015-the-bronze-layer.md): gates, and a starting file's shared ontology
    (Q-148), which this ADR generalises from a file's rules to a whole flow.
  - [ADR 0020](0020-the-estate-as-a-company.md): Larkspur, cut here into the flows it is made of.
  - [ADR 0021](0021-time.md): change sets, restatement and what-if runs, which the update test of §7 reuses.
  - [ADR 0024](0024-the-month-at-a-glance.md): the month's five marks and its rows of days, which gain a tier.
- **Changes:**
  - ADR 0015 amendment 1 (Q-148): a flow that describes a shared column again was refused. It may now override it for
    its own datasets, said as an override with its reason (§8).
  - ADR 0024 §5: the month's rows gain a tier above files and steps (§5).
- **Research:** [docs/research/flows-in-flows.md](../research/flows-in-flows.md), seven strands, five of them checked
  against the vendors' own pages.

## Context

The maintainer, 2026-11-16:

> Right now the demo that we have is there's a lot going on in the Flow itself. If you look at all of the boxes
> connected to each other, and I think that we probably should start to break those up into reusable components [...]
> you can create a flow that can become a part of a flow. It can become part of more flows, and so you can kind of build
> and stack onto each other. And so if you update one bronze thing, it just kind of flows throughout the rest of it, and
> works seamlessly. [...] the ability to add a previously created flow that has an icon where it can show pass/fail. You
> can double-click into it. It brings up its own flow. As well as from the high level, you have the components of the
> lower level things all connected up, and the outputs coming out, and could be used in joins [...] We need some sort of
> data exploration tool and the things coming out of these components [...] It needs to all roll up into the monthly
> overview snapshots.

**What the app was.** A flow is one document and one canvas. Larkspur's has 22 files, 6 notebooks and about 70 steps:
on a desktop a column of input cards whose edges fan across the screen, on a phone one card and the edge of a section of
32 steps. Its notebooks already read each other by import, and a notebook is already a box, but nothing stands between a
flow and its notebooks.

**What the research found** (the report, and its sources):

1. **No product does the whole of it.** Alteryx's macro is a tool with no status of its own, identified by a path or,
   since Designer 2026.3, by an asset reference that follows the latest version by default and tells nobody. Palantir's
   Pipeline Builder subgraph (generally available 27 October 2026) is one node with named ports, inside one pipeline,
   with no version and no badge.
2. **A placement means one of three things:** a visual group, one live definition every placement follows, or a
   snapshot each placement tracks. The newest designs let each placement choose what it follows (KNIME, Alteryx One,
   Foundry's functions).
3. **A change that arrives silently is the most documented failure** (Alteryx's "hidden breakages", Simulink). Figma has
   the fullest remedy: publish, announce, compare, accept.
4. **Only code-first tools hash.** Identity there is a hash of a unit's own definition and its children's (SQLMesh,
   Dagster, Bazel, Git), with a second hash for the interface alone in dbt and Avro. Neither Alteryx nor Foundry
   documents a content hash of a component, a dataset or a run.
5. **The roll-up that holds up is worst-of with counts** (Dagster, Airflow 3, Dataiku, the OORS draft). Averages
   (Purview, Statuspage's group bar) hide the one that failed.
6. **Nobody holds data.** No product read has a state for a day that was computed, kept and left waiting for a decision.
   Foundry records an upstream failure as a cancelled build, not a failed check.
7. **Enter, don't expand:** double-click to go in and a path to come back is the convention (KNIME, Unreal, Houdini,
   Simulink). The best designs open the placement with its own data, not the bare definition. No documentation read
   covers a phone.
8. **Ontologies travel** as a pinned import, a copy that says where it came from, or a live reference. Bindings to
   physical data never travel. No contract standard hashes the contract.
9. **An unfamiliar table opens on a summary of every column,** with its scope stated, and a join on what did not match.
   No tool read keeps a join's match rate from run to run.
10. **Trusted products write a two-tone rule:** plain where people work, play where they arrive. Features get plain
    names, and tools that began with odd nouns renamed them.

**What smaltfl already has** that the surveyed products lack: keys that leave names out, so the same steps hash the
same wherever they run; an exact hash of every dataset; a held day and a recorded decision; rules dated and hashed; a
what-if run; and a precedent for sharing, the starting file's shared ontology (Q-148): one file, brought in whenever a
flow is read, hashed into each flow that imports it.

## Decision

### 1. A flow reads other flows

- **Its name is a flow** (Q-233). No new noun: a flow reads other flows, and its card says FLOW. The plain words of the
  feature are *reads*, *gives* (the datasets a flow publishes, which other flows may read) and *waits on*.
- **By reference in the files, by value in the plan.** A flow lists the flows it reads by their paths (`flows` in
  `flow.json`). Reading the flow brings them in, as it brings in notebooks and shared ontologies: the document a run
  hashes is the one read, with every flow it reads in it. The plan stays the flat plan it is, so the runtime, the holds,
  verify, the audit and the recorder run a composed flow as they run any other.
- **One definition.** A flow read by two flows is one flow, read once. A change to it is made in its own folder and
  reaches every flow that reads it (§7).
- **Names are the estate's.** A source's or a step's id is unique across a flow and the flows it reads; a clash is
  refused, naming both flows. So `org_chain` is `org_chain` wherever it is read, and no SQL is rewritten.
- **A flow reads what another gives, and its files.** A step may read a published dataset of a flow its own flow reads,
  or one of that flow's sources as it arrived. An unpublished step of another flow is refused, saying which, and that
  publishing it there makes it readable. A flow that reads another's data without listing it is refused.
- **No cycles.** A flow that reads itself, directly or through others, is refused.
- **One calendar, one day, one way of pausing.** A flow and the flows it reads keep the same calendar, the same period
  parameter and the same `publish` settings (what holds, whether a hold reaches the outputs built from it, what closes a
  pause). A flow that says otherwise is refused, saying what differs. Each brings its own watches, gates and contracts.
  Policies are the reading flow's.
- **The same steps, the same keys.** A key covers a step and its inputs' keys, never a name or a place (ADR 0004). So a
  flow's steps have the same keys in every flow that reads it: in one database they are built once and found built by
  the next flow that reads them.

### 2. What a flow is known by

- **Its own hash.** A flow's hash is the flow hash (`flow/1`) of the document read from its own folder, with the flows
  *it* reads in it. No new encoding. The reading flow's document names each flow it reads with that hash, and the
  reading flow's own hash covers them all.
- **Named in every run.** A run's manifest names the flows its flow read, each by its id and hash, only where there are
  any, so every other manifest hashes as it did. An auditor can say which HR organisation made which day.
- **Checked.** The run keeps each read flow's own document by its hash. Verify checks that each hashes to what the
  manifest says and is in the run's document unchanged: every source and step of it, as written.
- **A second hash for what it gives** comes with §7, where it is needed: the outputs' names, columns, types and
  contracts alone, so "what it gives changed" can be told from "how it is made changed". That is a new encoding and
  comes with its test vectors.

### 3. The card

- **One card a flow** on its reader's canvas, where today there is a card a file and a box a notebook. Its kind is said
  by its outline, a second sheet behind the card, and by the word FLOW with the count of what it gives. No sign of its
  own (Q-234 did not pick one).
- **The day's mark, by precedence, with a count.** A flow's day is the worst of what is inside it, in the month's own
  marks (ADR 0024 §3): the run failed; paused, waiting; not published; decided; unusual; not judged yet; normal. The
  words give the extent: *Paused · tls, 1 of 13 files*. Never an average, never a score.
- **Waiting is not failing.** A flow with nothing wrong of its own, whose outputs wait because a flow it reads is
  paused, says *Waits on Evidence feeds*, drawn dashed. The month already tells a step that only followed a file
  (ADR 0024 §5); this is the same rule a tier up.
- **Nothing vital in a hover.** The count and the cause are on the card and its sheet: a phone has no hover.

### 4. Opening a flow

- **A tap opens its sheet:** what its day came to; what holds it, each a link straight to the card inside that holds;
  the flows it reads; what it gives, each with whether today's went out and who reads it; **Explore ›** on each
  output (§9); and **Open the flow ›**.
- **Entering replaces the canvas** with the flow's own: its files, its notebooks, the flows it reads as cards. A line at
  the top says where you are and goes back (*Larkspur estate / Evidence feeds*). On a desktop a double-click enters; on a
  phone the sheet's button does.
- **Inside, it is this run's flow:** every card shows the day on screen, its rows and its checks. Decide, the news, the
  notebook pages and the Ontology work there as at the top.
- **Each level has a link:** `#day/2024-03-12/in/feeds`, `#month/2024-03/in/feeds`.

### 5. The month in tiers

- **A row a flow,** above the files and steps: its bar for a day is the worst any of its files or steps said that day,
  with its days in words. Opening the row shows its files and steps, as the month shows them now.
- **A flow that only waited** on another is said so and folded with the calm ones.
- **What waits for a decision names the flow** whose file or step holds.
- **A flow has a month of its own** once entered: its calendar, its counts, its rows, by what its own files and steps
  and the flows it reads came to.

### 6. A paused day is decided once, at its flow (Q-226)

- **The hold is the flow's** whose file or step holds, and so is the decision: recorded by load, as now (ADR 0010 §7),
  and saying which flow it is about. A flow that reads it shows *waits on* and is never asked.
- **In two steps.** First inside one page, where there is one record: the sheet, the month and the record say whose the
  decision is. Then between flows that share a flow in the same browser: the decision is kept under the paused flow, and
  each reading flow's record cites the decision it carried, so no flow decides the same file twice.

### 7. A change is followed, said and tested (Q-227)

The maintainer: *"I like follow and say so but test what might fail based on previous runs."*

- **Followed.** A flow reads the flows it lists as they are when it is read. Nothing is copied or frozen.
- **Said.** A flow's card says when the flow changed and what changed, in words: its steps, its checks, what it gives.
  Every run names the hashes it ran (§2), so the day a flow changed is on the record.
- **Tested on the days before.** When a flow has changed, the days already recorded can be run again under it as
  what-if runs (ADR 0021 §4), which publish nothing and move no name: *under the new HR organisation, 2 of the last 14
  days would have paused: Tue 12, Mon 18; 12 come out the same.* The test informs; the change is not held back by it.
  (That reading of the answer is this ADR's, for the maintainer to correct.)
- **Pinned where it must not move.** A flow may name the hash of a flow it reads. Reading then refuses any other, saying
  both hashes, until someone moves the pin.

### 8. The ontology owns shared types, and a flow may handle a column its own way (Q-229)

The maintainer: *"I feel like ontology should own that but flows can override it will show up in hash and ontology
notes unique handling of specific column in specific flow."*

- **The estate's ontology is a document of its own:** its object types, links, what each dataset's rows are, its
  dependencies, what the columns mean, their values and bands. Flows import it, and a flow takes from it what is about
  the datasets it has or reads.
- **A flow may override** a column for its own datasets: another meaning, other labels, another band. The override is
  written in the flow, marked as one, with its reason.
- **It shows in the hash.** The override is part of the flow's document, so of its hash, and of every reading flow's.
- **The ontology notes it.** The Ontology page says, on the column's card, where it is handled differently and why.
- **Without the mark, saying a shared column again is still refused:** an accident is not an override.

### 9. Exploring what a flow gives (Q-230)

For someone who has never seen the dataset, on any output a flow gives:

- **What a row is,** in a sentence from the ontology: the count, the key.
- **A card a column,** over the whole file and saying so: a small chart that fits its type, and the shares that fit the
  type, don't, and are empty.
- **Tap to highlight, then keep.** Tapping a bar lights its share in every other column. *Keep only* then filters, and
  the filter can become one of the reader's own cells.
- **How it joins.** The datasets that share its key, how many rows on each side find a match today, the values that
  don't, and that match rate over the month, which smaltfl can keep because it measures every run.
- **Two days compared** by key: rows added, removed and changed (ADR 0021's compare).

Charting two columns against each other is left to smaltbi.

### 10. Building in the app (Q-231)

- **A catalogue** of the flows shipped with the build. *Add a flow* puts its card on the canvas and makes what it gives
  readable in the reader's own cells and the exploration view.
- **A join form** that writes the join step: two datasets, the key on each side, the columns to take. It writes a
  notebook cell, as the gate toggles write gate cells (ADR 0014 slice 6), kept in the browser with every other edit.

### 11. Reused a little differently (Q-228)

- **Inputs and settings.** A flow may declare an open input, the columns it needs, in place of a file of its own, and
  settings. Each use maps one of its own datasets onto each input and gives the settings. Its checks and steps stay as
  written.
- **Each use is named and hashed apart.** Two uses of one flow are two names on the canvas and two hashes in the run.

### 12. The demo, the voice and the slices

- **Larkspur is cut into five flows** (Q-232): HR organisation, Inventory, Evidence feeds, Applications, and the
  posture product on top, which reads the four. The same steps and the same held days: its answer key stands. What one
  flow reads of another is published there, so the bronze files' checked rows and the organisation's units, leaders and
  closure become datasets the flows give.
- **Plain in the app, smalty where it is safe** (Q-234): a sealed flow may say *Worth its smalt.*, an empty catalogue
  *Nothing upstream yet.*; Larkspur's sample world may carry jokes. Nothing playful on a paused day, a refused file, a
  decision, a hash or the audit, and not "a grain of smalt", which says *don't quite believe this*.

The slices, each with its tests, its stop sets at every size and its guide:

1. **The core:** a flow reads flows (§1, §2), and Larkspur cut into five (§12).
2. **The canvas in levels:** the card, its sheet, entering (§3, §4).
3. **The month in tiers** (§5).
4. **Exploring what a flow gives** (§9).
5. **Decided once, at its flow** (§6).
6. **A change followed, said and tested** (§7).
7. **The ontology's overrides** (§8).
8. **Inputs and settings** (§11).
9. **Building in the app** (§10).
10. **The voice** (§12).

## As built

### Slice 1: the core, and Larkspur cut into five (2026-11-17)

- **The document** (`src/core/document.ts`): `FlowDocument.flows`, a `FlowPart` for each flow read, directly or through
  another: its `path` from the reading flow's folder, its `id`, `name` and `description`, its own `hash`, the `sources`
  and `steps` that are its own, the flows it `reads`, and whether the reading flow lists it itself (`direct`). The
  field is part of the flow hash and no display field. `flowOwners`, `flowOf`, `givesOf` (what a flow publishes) and
  `readsOf` (every flow one reads, through others too) read it.
- **The document's own rule** (`validateFlows`, in `validateDocument`): a step reads a published step or a source of a
  flow its own flow lists, and nothing else of another flow. Each refusal says which flows and what would make it
  right: *publish it there*, *list the flow*, or *a flow reads the flows it lists, not the flow that reads it*. A
  gate's scope, reconcile and dependency rules are held to the same. A `flows` list still holding paths is refused: it
  was never read.
- **Reading** (`src/core/compose.ts`, `composeFlow`): pure, the caller reads the files (`FlowFiles`). Each flow's file
  is read once, with its shared ontologies and its notebooks; a circle is refused with its path
  (*a → b → a*); the flows are merged, a flow after the flows it reads; one `expandNotebooks` derives every step;
  each part's steps are the cells of its own notebooks; `syncRuleCells`, then the whole document is validated. Refused
  in `merge`, naming both flows: an id that is two things, another calendar, another way of pausing (naming the
  `publish` settings that differ), a parameter of two types, a part with policies of its own, a contract or a change
  set said twice. `mergeOntologies` joins the flows' ontologies and refuses a thing said twice. A flow that reads none
  is read exactly as before: no hash of any other flow moved.
- **A notebook imports across folders** (`joinPath` in `notebook.ts` keeps a leading `..`): `feeds/bronze.nb.ts` imports
  `cmdb_apps` from `../inventory/bronze.nb.js`. `pathFrom` rebases a part's notebook paths to the reading flow's folder.
- **The hash a flow is known by** is `flowHash` of the document `composeFlow` gives for its own folder. The test holds
  each of Larkspur's four read flows to it: read on its own and read inside the posture product, the same hash.
- **The run** (`src/core/manifest.ts`, `src/plugin/runtime.ts`): `manifest.flow.reads`, each read flow's id and hash,
  only where the document has `flows`. `runFlow`'s option `flows` gives the read flows' own documents; the run keeps
  each by its hash in `_smaltfl_flows`, and refuses one it doesn't read.
- **Verify** (`src/plugin/verify.ts`): a `flows` check on a run whose flow reads any: the manifest names what the
  document does; each kept document hashes to the hash it is named by; and the run's document holds it unchanged
  (`flowProblems`: every source, every step, each gate's written rules, each contract and watch). Left out of that
  comparison, because other checks cover them: a check's mode and a rule's switch (the day's rules, by the rules hash),
  and what a decision fills in a fill step (the repair check).
- **A fill inside a read flow**: `repairDocument` (`fill.ts`) adds the donor to the sources of the flow that owns the
  filled file, so the derived document is still one each flow's part accounts for.
- **The build and the app**: `scripts/flow.ts` reads through `composeFlow` (`readFlow`; `readFlows` gives each read
  flow's own document). `scripts/build-app.mjs` ships them as `data/flows/<id>.json`, listed in `loads.json` (`flows`,
  `DataList.flows`), and keys the data's cache by the read flows' folders too. The page fetches them checked and gives
  them to its first run.
- **Larkspur** (`examples/larkspur/`): `hr/` (HR organisation: two files, seven steps), `inventory/` (four files, two
  steps), `feeds/` (Evidence feeds: thirteen files, twenty-five steps; reads Inventory, for the scope of the findings'
  gate), `applications/` (seven steps and no file; reads the three) and the posture product at the root, which lists
  the four. Eighteen datasets are published that were steps read across notebooks: the organisation's units, leaders
  and closure, and each bronze file's checked rows. The plan has the same 92 nodes with the same inputs, and 37 outputs
  where it had 19. The ontology stays whole in the posture product's `flow.json` until slice 7.
- **Tests**: `test/compose.test.ts` (reading, the refusals, the keys of a flow's steps the same on its own and inside
  another, hashes that move only where they should, and through the engine: the manifest's reads, verify's `flows`
  check, a flow run on its own then *found built* by the flow that reads it, Larkspur as five). The engine's six
  months and March of Larkspur and the tour's answer key pass as they stood, but for the order the watched steps are
  listed in: each flow brings its own watches, so the Applications' three come before the posture product's.

**What slice 1 left for the slices after it:**

- The canvas drew a composed flow flat, its notebooks side by side: slice 2 draws each read flow as a card.
- The offline audit doesn't yet check the flows a run names; verify does. It comes with slice 6, where a change to a
  read flow is said and tested.
- An edit made in the app to a step of a read flow (a column renamed through the steps that pass it on) is an edit of
  the reading flow's copy, and verify's `flows` check says so. Slice 6 makes such an edit at the flow it belongs to.

### Slice 2: the canvas in levels (2026-11-17)

- **A level** (`src/core/levels.ts` `levelDoc`): the document one flow's canvas lays out, derived and never run: the
  flow's own files, steps and sections, and one card for each flow it reads itself (`flowCard`, `cardFlow`,
  `readHere`). What those flows read is inside them. A step that reads two datasets of one flow has one line from that
  flow's card. A flow the viewer has nothing left of has no card.
- **A card is never adrift.** Evidence feeds reads Inventory through its gates alone (each file is counted against the
  inventory's applications): no step takes Inventory's rows. So a flow's card is joined to every flow its flow lists,
  and, on the level of the flow that reads it, to the step a written rule judges by it (`writtenRules`: a scope, a
  dependency, a reconciliation), or, for a judged file, to the first step that reads the file.
- **The flows' cards are laid out together** (`FLOWS_SECTION`, a section with no frame, `src/app/layout.ts`): each
  takes a row that keeps clear the way from the cards before it to what reads them, as a section's steps do, and they
  lead the canvas. A line from one flow's card never runs behind another's.
- **A flow's day** (`flowDay`, from `RunSaid`: the run's holds and claims as its record entry keeps them, the outputs
  kept back, what became of the day): each of its own files and steps as the month reads one (`cellOf`), and the worst
  by precedence: the run failed inside it; paused; kept back; decided, and how; it waits on another flow; unusual; not
  judged yet; normal. A what-if's and a restatement's holds are no flow's; a file sent again holds its flow until
  decided. `flowSaid` is the sentence (*Paused · access_reviews, 1 of 13 files*) and `flowLine` the card's line, fitted
  to the room the card has: the names give way, then the word after the count; the count never does
  (*access_rev… · 1 of 13*).
- **The card** (`renderCanvas`): a second sheet behind it, FLOW and the count of what it gives, the month's marks
  (`FLOW_MARK`: ‖, ☒, ☑, ⚠, ◌, a tick), colour for the day that waits alone, dashed where it waits on another flow.
  The day's trail runs through a card where anything inside it is on it.
- **Its files' seal** (`flowSeal`, ADR 0006): a flow's card carries its files' seals read as one: sealed where every
  file with a seal is checked back to its bytes, broken where any is. On a day a file was tampered with, the card says
  whose file was refused (*tls: file refused*), its seal broken, and its sheet leads to the file's Integrity tab.
- **The sheet** (`renderFlowSheet`): the day in a sentence; **Open the flow ›**; what holds it, each a tap from the
  card inside; the flows it waits on; the flows it reads, each with its own day; what it gives (`givenBy`), each with
  whether today's went out and who reads it; what it has, who reads it (`readersOfFlow`) and the hash it is known by.
- **Entering** (`enterFlow`, `setLevel`, `state.level`): the canvas of the flow, laid out and fitted afresh, with a
  line at the top (`renderCrumbs`: the flows entered, each a link back, and what the flow on screen made of the day).
  A double-click on a card enters; so does the sheet's button. Arranging is the top level's.
- **Links** (`routeOf`, `levelHash`, `trailOf`): `#day/2024-03-27/in/feeds`, `#day/2024-03-27/v1/in/applications/feeds`,
  `#flow/in/feeds`. A trail that isn't one is put right: the shortest way to the last flow it names. The days either
  side and the Day tab keep the level.
- **A card opened from anywhere** (`select` → `showLevelOf`): the canvas goes to the level that shows it, the link
  following without a new entry in the browser's history.
- **The browser tour** (`tools/browser/tour.cjs`): goes to the level that draws a card before it opens it
  (`window.__smaltflLevelOf`), so no stop set had to learn where a card went; a stop's `in`, `flow` and `dblclick`.
  `tools/browser/stops/levels.json` walks all of this on the tour, at every size.
- **Tests**: `test/levels.test.ts`.
- **The stop sets that were there** pass on the new canvas at every size with four changes, none to what a stop
  shows: Larkspur's two notebooks by their new section ids; `integrity.json`'s counts of sealed files, which were
  taken on the one flat canvas and are now taken at the top (three files and three flows' seals) and inside Evidence
  feeds and Inventory, with the tampered day read on the flow's card and its sheet; and, from slice 1's eighteen more
  datasets, the counts three sets quote (*11 of 37 outputs*, the Ontology page's twenty made datasets).

**What slice 2 leaves:** no day of the tour shows *Waits on* on a card at the top, since the flow that waits there is
the posture product itself, whose own notebooks are drawn; the state is tested in `test/levels.test.ts`. **Explore ›**
on each output comes with slice 4; until then a dataset's row opens its card.

### Slice 3: the month in tiers (2026-11-17)

- **A row a flow** (`src/core/tiers.ts` `flowRows`, pure; the month screen's `flowsGroup`, `flowRow`): above the files
  and steps, each flow the document reads and then its own flow, its bar for a day the worst any of its own files or
  steps said (overview.ts `healthOf`), its days in words (`flowRowSaid`). A row opens to the flow's own files and steps,
  as the month shows them for a flow that reads none, set in under it with their days lined up under the flow's.
- **Each row in its flow** (`tierRows`): the month folds a step that reads one file alone into that file's row. Where the
  step is another flow's (Applications conforms the Inventory's register), it is that flow's step instead, which reads
  the file: a flow's rows are its own.
- **A flow's own days** are its rows' own days, the rule of ADR 0024 §5 a tier up: every day a file of it held or was
  unusual, and each day a step of it did that no file the step reads accounts for, whichever flow the file is in. A
  flow that held or was unusual only where a file of another flow did **followed** that flow (`onlyFollowed`,
  `followedOn`): on the tour's Fri Feb 16, HR's file breaks the one-root rule and Applications' owner chains break
  with it, so the month says *2 of 5 held a day on their own account* and lists Applications under *2 flows that only
  followed or waited on another*, as *held on Fri 16, following HR organisation*. This goes a step past §5 as it was
  written, which told apart only a flow that waited: a flow whose own checks failed because the flow under it broke is
  no more the cause than one that waited, and a step is told apart the same way already.
- **A day it only waited** (`waited`, `waitedOn`, `onlyWaited`): no run of the day has the flow holding, and a hold of
  another flow keeps back something it gives (every hold, where the flow publishes together). Drawn as a dashed
  outline at half height (`dayBars`' `waited` level, viz.ts): its rows weren't out, and nothing of its own was wrong.
  Said after the flow's own days, and not twice for a day it was unusual on.
- **What waits for a decision names the flow** whose file or step holds (*Evidence feeds · access_reviews: Almost no
  apps: 0*), and so does each finding of the day picked (*access_reviews file in Evidence feeds*).
- **A flow's own month** (`#month/2024-03/in/feeds`; `monthView.flow`, `scopeFlows`, `scopeNodes`,
  `flowMonthOutcome`): the month screen for the flow entered and every flow it reads. A day something in its scope
  held is the day's own outcome (paused, decided and how, kept back); a day held only outside it is none of its
  business, and is unusual, not judged or normal by what its own files and steps said, with a line that says the day
  as a whole was held by another flow. Its counts, its sentence, its calendar, what needed a look, what waits and what
  a held day held back (of what its scope gives) are the scope's. A flow that reads none has no tier above its files
  and steps. The scenes and the product's score are the top flow's and aren't shown.
- **Ways in and out**: a line at the top says whose month it is and goes back up, a month at a time; a flow's row
  links to *Its own month ›*; a flow's card's sheet to *Its month ›*; inside a flow the day screen's way back to the
  month is that flow's month; a day opened from a flow's month is the day screen inside that flow. The month's pager,
  its cards and its links keep the flow.
- **Tests**: `test/tiers.test.ts`; `dayBars`' waited bar in `test/viz.test.ts`. `tools/browser/stops/tiers.json` walks
  it on the tour; `overview.json` and `month.json` read the rows in their tiers.

### Slice 4: exploring what a flow gives (2026-11-17)

An **Explore** tab on every file and every published dataset (`explorable`, `exploreTab` in main.ts), in three parts.
`src/core/explore.ts` is the pure half: what to ask of each column, what the counts make, and the words. `emit.ts`
writes what the engine is asked. Every count is exact, over every row the viewer may read.

- **What a row is** (`rowSaid`, `rowsKeptFrom`): a sentence from the ontology. *One row is an application, for those where
  exposure is internet or partner and lifecycle is active or retiring: 813 rows, one for each app_id.* From its rows
  entry; from the type it is the list of (the inventory: *One row is an application*); else its key, where a gate
  gives it one, and plainly that nothing says what a row is yet. What a flow gives of a file is the file's rows,
  filled and checked: a dataset made by steps that only check, filter or fill another's rows is said as that one is,
  and says so (*As in mfa, whose rows it keeps.*).
- **A card a column** (`askOf`, `cardOf`; `xpColumns`, `xpCard`): how full it is, then a chart that fits what it holds.
  - A category, a code or text that repeats: its values, the most common first, a bar its share of the rows; past
    eight, the rest as a count. A value of nothing but spaces is named *(blank)*.
  - A number: equal bins on round edges, from the sample's 1st to its 99th percentile so one stray value doesn't
    flatten the rest; the rows under and over as rows of their own. A largest value on a round edge has the last bin
    to itself, and the axis ends on it (a score's bars end at 100).
  - A time: by the hour within two days (a column of dates, never), by the day within two months, by the month within
    five years, else by the year; every stamp between the first and the last is drawn, so a gap is seen as one.
  - The rows with no value are a bar of their own. A column whose every row has its own value names rows and has no
    chart; an empty one says so.
  - Where the ontology writes a column's values, the rows that fit them, hold another, and are empty (`emitFit`,
    `fitSaid`). §9 said *the shares that fit the type*: a column of the engine holds nothing that doesn't fit its
    type, so the values written are what there is to fit.
- **Tap to highlight, then keep** (`RowPick`; `emitPick`, `emitLit`, `emitKept`): a bar tapped is a part of the dataset.
  Every other bar shows how many of its rows are in it, its own rows pale behind them, and the part with its count
  stays at the foot of the screen (*status is Fail · 40 of 813 rows (5%)*). The cards are redrawn in place, so the
  page and the bar under the finger stay put. A part picked is kept while the page is open and across days: a
  question asked of each day stepped to. **Keep only** makes it the rows every count is over, said at the top with a
  way back, each column's axis as it was. **As a cell ›** writes the rows kept as SQL in one of the reader's own
  cells (`emitKeptCell`, `xpAsCell`), under the notebook that makes the dataset, and runs it.
- **By the keyboard**: a number's or a time's bars are one stop in the tab order; the arrow keys, Home and End move
  along them and Enter picks.
- **How it joins** (`joinPartners`, `xpJoins`, `xpJoin`): the datasets the ontology says it joins.
  - The list its scope is counted against (`why: 'scope'`), counted over the keys the scope keeps of it
    (`emitWhere`), as its gate counts them (ADR 0014 §4): *All 814 rows of tls find their application among those in
    scope in cmdb_apps. All 814 keys in scope in cmdb_apps have a row here.* A file of the internet-facing applications
    isn't short of the ones that aren't.
  - Every dataset whose rows are objects of the same type, the type's list first.
  - What the ontology's links tie a type's list to, each way (`why: 'link'`): *Owned by: owner_team_id names an
    organisational unit in hr_org_units.* A link of a type to itself is no join to another dataset.
  - Each is two sentences and two bars, one a side (`emitJoinMatch`, `joinRead`, `joinSaid`), with the first keys
    that find no match (`emitUnmatchedKeys`). What a dataset's rows are looked up in is counted at once (`leads`);
    the others when opened.
  - **The match over the month**, against its scope's list (`matchDays`, `matchSaid`; `matchBars` in viz.ts): each
    run already counts the scope, so the history has the rate with no new measure. Up to the day on screen: a day
    after it isn't known on it.
- **Against another day** (`xpDays`, on ADR 0021 §4's `rowDiffOf`, which now reads any dataset a run built): its rows
  by its key, the earlier day first. Rows are read from both days' runs in the browser; a day not run there yet is one
  tap, which runs it and puts the day on screen back (`xpRunOther`).
- **From a flow's sheet**: each dataset it gives has **Explore ›** beside the way to its card.
- **Tests**: `test/explore.test.ts` asks the in-process engine every query and reads the answers; `matchBars` in
  `test/viz.test.ts`. `tools/browser/stops/explore.json` walks it on the tour at every size.

**What slice 4 leaves:** the joins a flow's own steps make, which `src/core/uses.ts` reads from their SQL, aren't
listed: the ontology's keys and links are. Slice 9's join form wants both. What is kept is every pick at once (and),
never one or another. A step the engine folds into the next has no Explore tab: its rows aren't kept as a table.

### Slice 5, first step: a decision says whose it is (2026-11-17)

§6's first step, inside one page, where there is one record.

- **Whose a hold is** (`src/core/deciding.ts`, pure): the flow's whose file or step holds (`flowIdOf`). `holdGroups`
  reads a run's holds into the decisions its day needs, one a flow that *leads*: a hold leads where no file or step
  its own is built from holds too. Any other hold *follows*, and goes with the flow that leads above it: on the
  tour's Fri Feb 16 the check at Applications' `app_owners` fails because HR's file broke, so it is HR organisation's
  decision, and Applications is never asked.
- **Recorded.** A day is still one choice, recorded as one decision a held load (ADR 0010 §7, Q-193). Each now says
  the flow whose file or step holds its load, by its id and the hash it is known by (`DecideAbout.flow`), where that
  is a flow the document reads; a decision of the document's own flow says none, so a flow that reads none records
  what it always did. A load held only because something it is built from holds is decided with it: its decision
  cites the one it carries, by seq and leaf (`DecideAbout.carried`). The loads that lead are recorded first
  (`loadRoles`, `withRoles`; the app's `decideNow`; the build's recorder, `recordDecisions`). On the tour's Sat Mar 23
  the empty EDR file's decision is Evidence feeds'; the posture's own load, the estate's, carries it.
- **Said**, wherever a decision is:
  - the decision sheet's head: *Evidence feeds’ to decide: access_reviews holds. Larkspur estate waits on it.*
    (`whoseSaid`, `waitingOn`; the app's `whoseLine`);
  - the Decide buttons, where the flow on screen isn't the one that holds: *Decide at Evidence feeds ›* (`decideAt`);
  - the day's story and the month's timeline: *At Evidence feeds, the CISO filled it from Sun 24*;
  - the record: *… · Evidence feeds’ to decide*, and *· with #41* on a decision that carries another;
  - a flow's sheet: **Decide ›** on the flow that holds; on one that only waits, that nothing is asked of it.
- **Checked offline** (`audit.ts`): a decision that names a flow names the one whose file or step holds its load, by
  the hash the run's document knows it by; one that says it carries another cites an earlier decision of the same
  run, to the same end, about the load its own follows. Each line of the audit says whose the decision was.
  `layered` (month.ts) renumbers the decision a carried one cites, as it does every other citation.
- **Tests**: `test/deciding.test.ts`; the layering in `test/month.test.ts`; the audit in `test/several.test.ts`; the
  tour's answer key holds every recorded decision to its flow (`test/larkspur-tour.test.ts`).

**What it leaves:** where two flows lead on one day, the one choice decides both, each recorded as its own flow's; no
day of the demos has two. The second step, between pages of one browser that share a flow, comes after the slices
that build flows from flows: the records already share one IndexedDB and a record's origin names its flow, so a
reading flow's record will cite the decision it carried by that origin, its seq and its leaf.

### Slice 7: the estate's ontology, and a flow's own handling of a column (2026-11-17)

Built before slice 6: a flow read on its own needs its ontology before a change to it can be said to be that flow's.

- **The estate's ontology is a document of its own** (`EstateOntology`, `src/core/shared.ts`):
  `{ "smaltflOntology": 2, "name", … }` with the object types, links and actions, what each dataset's rows are
  (`rows`), the dependencies (`needs`), the nouns, the thresholds (`overwhelming`), and what the columns mean
  (`properties`, with their values, bands and due marks, and the `references` they cite). Version 2 tells it from one
  starting file's shared ontology (version 1, Q-148), which stays what it was. `asEstate` reads it for its shape and
  refuses a part it doesn't know by name. The rules people set on a file and the fixes a held day is offered stay the
  file's own, in the flow or in the file's shared ontology.
- **A flow imports it** in the list that already imports a file's shared ontology: `"ontology": { "import":
  ["../ontology.json"] }`. Reading the flow (`composeFlow`) reads each path once and takes of the estate what is about
  the datasets the flow has or reads (`takeEstate`):
  - a type whose list is here, the links between two types here, the actions on one;
  - a rows entry of a dataset here whose type is here; a dependency, trimmed to the datasets here; a noun; a threshold;
  - a column's meaning: whole where it is for every dataset, else trimmed to the datasets here, its bands and its
    lookup with it; and the references those cite.
  - A flow with no gate has nothing to judge a written check by (ADR 0014, ADR 0015), and takes no rows entry, no
    dependency, no band and no due mark.
- **It travels under a hash of its own**, `estate/0` (`estateHash`): SHA-256 of `smaltfl/estate/0`, a newline, and the
  canonical JSON of the document as read. The flow's document keeps where its estate parts came from
  (`ontology.estate`: each estate's `name`, the `path` the flow gives it by, and its `hash`), which is part of the flow
  hash: two flows read the same estate where the hashes agree, and a change to the estate moves every importing
  flow's hash and no other's. Its test vector (`test/estate-ontology.test.ts`):
  `{"name":"Shop","objectTypes":[{"dataset":"customers","id":"customer","key":["customer_id"],"name":"Customer","title":"name"}],"properties":[{"column":"customer_id","description":"Who bought","title":"Customer"}],"smaltflOntology":2}`
  hashes to `9c2c2afee7b8c541cd75bad233790edcf73b102d9c631390c04f7095fbd0da5a`, computed outside the code from the
  canonical JSON written by hand.
- **A flow's own handling of a column** is a property of its own ontology marked as one: `"override": { "reason": … }`,
  with the `datasets` of its own it is for. The estate's meaning steps aside for those datasets and stands everywhere
  else. Being part of the flow's document, it is in its hash and in every reading flow's.
- **Refused, each in a sentence** (`overrideProblems`): a column the estate describes said again without the mark (*an
  accident is not an override*); an override with no reason; one that names no dataset; one of a dataset that isn't
  the flow's own; one of a column no estate it imports describes. An estate's ontology has no override: it is what is
  overridden. A thing the estate says and a flow says again (a type, a link, a rows entry) is refused as two flows
  saying one thing are (`mergeOntologies`).
- **Larkspur**: `examples/larkspur/ontology.json` is the estate's, and the five flows import it, each `flow.json`
  keeping only what is its own. Applications handles one column its own way, `owner_team_id` in `apps` and
  `app_owners`: the register writes a team's id in any case and repeats an application, and Applications conforms the
  id and keeps the newest record. The composed plan has the same 92 nodes and 37 outputs, byte for byte but for the
  flows' hashes.
- **The Ontology page notes it** (`src/core/ontologypage.ts`: `Handling`, `handlings`, `OntologyPage.estate` and
  `handled`, `ColumnCard.own` and `elsewhere`; the app's `renderEstate`):
  - at its head, where the ontology comes from: the estate's name, its hash and its path, and the flows read here that
    import the same one (the same hash in each one's own document); then every column a flow handles its own way, with
    the flow, its datasets (each a tap to the column's card) and its reason;
  - on the card of the column where the flow handles it: *Applications’ own handling*, the reason, and what the
    estate's ontology says in its place;
  - on every other card of the column: *Handled differently. Applications handles it its own way in apps and
    app_owners: …*
  - A dataset a flow makes whose column is handled so has its section on the page whatever its rules, so the card is
    there to carry the note. Entries that say the same of one flow's datasets are one handling.
- **Made in the app.** The build ships each estate's ontology as its file gives it (`data/estates/<n>.json`,
  `loads.json`'s `estates`, `readEstates` in `scripts/flow.ts`), so the page knows what the estate says of a column in a
  dataset (`estateSays`). A column's names form, on a column the estate describes, asks *Why it’s handled its own way
  here* and says whose handling it would be (the flow that owns the file); saved, the file's own entry is the flow's
  override with that reason (`ColumnChange.override`, `nameColumn`), carried to the datasets that pass the column on
  where the estate describes it there too (`nameColumnThrough`'s `described`). A name saved with no reason is asked
  for one. The record's line says *…, its own way: <reason>*.
- **Tests**: `test/estate-ontology.test.ts` (the shape, the vector, what a flow takes, the refusals, hashes that move
  only where they should, Larkspur's five flows), `test/ontologypage.test.ts` (the handlings and the cards' notes),
  `test/flowedit.test.ts` (the mark made, reworded and carried). `tools/browser/stops/overrides.json` walks the page on
  the tour at every size.

**What it leaves:**

- A band changed in the app is still a dated change set (ADR 0021 §5): it has its reason and its day and is listed with
  the rules over time. It isn't marked as an override, which is what a flow's document says of a column from its first
  day.
- An override made in the app is taken back with every other edit (*Back to the flow as shipped*), not alone.
- The estate's ontology isn't edited in the app, and an estate's ontology imports no other.

## Consequences

- **A flow's document grows.** The app ships the composed document, so a page still opens one file and needs no parser.
- **More datasets are published.** Larkspur gives 18 more: what was an unpublished step read across notebooks is now a
  dataset with a name, a hash and versions. More outputs wait behind a held file; the days that hold are the same.
- **Every demo's data is made again,** since the flow's hash moves.
- **smaltfl is first in five places,** by the research: a hold that passes through nested flows, a card that says both
  that a flow changed and how its day went, a status that drills through tiers over a month, a join's match rate kept
  for every run, and an ontology that travels under a content hash. There is no convention to lean on, so the answer
  keys, the browser regression at every size and the judging rounds carry the proof.

## Not built, and why

- **A flow run on its own and read by another** (a join against what another flow published in its own runs, held where
  the producer holds). §1 runs a read flow inside its reader. Both are wanted in time; this is the first, since every
  part of it has a precedent, and §6's second step is the bridge to the other.
- **A consumer keyed by the content of what it reads,** so a flow rebuilt to the same output disturbs nothing
  downstream. Keys stay as ADR 0004 has them.
- **A flow with policies of its own** inside a reading flow: the reader's apply.

## The questions

Asked through the question prompt, 2026-11-17, in three rounds of three (docs/OPEN_QUESTIONS.md):

- **Q-226:** a paused day of a shared flow is decided once, at that flow.
- **Q-227:** a change is followed and said, and tested on the days already recorded.
- **Q-228:** a flow may change the inputs and settings of a flow it reads, nothing else.
- **Q-229:** the ontology owns shared types; a flow may override a column, hashed and noted.
- **Q-230:** exploring an output: highlight and filter, how it joins, two days compared.
- **Q-231:** building in the app: a catalogue and a join form.
- **Q-232:** the demo: Larkspur cut into flows.
- **Q-233:** the name: a flow.
- **Q-234:** the playful voice: success and empty screens, and the sample estate.
