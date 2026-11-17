# ADR 0026: Flows in flows

- **Status:** accepted, 2026-11-17: the maintainer's answers to Q-231 to Q-239, asked through the question prompt once
  the research was in. The choices the answers left open were built as proposed and confirmed by the maintainer the
  same day, asked the same way (Q-240 to Q-244), with the one that was open answered (Q-245). Every slice of §12 is
  built.
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

- **Its name is a flow** (Q-238). No new noun: a flow reads other flows, and its card says FLOW. The plain words of the
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
  own (Q-239 did not pick one).
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

### 6. A paused day is decided once, at its flow (Q-231)

- **The hold is the flow's** whose file or step holds, and so is the decision: recorded by load, as now (ADR 0010 §7),
  and saying which flow it is about. A flow that reads it shows *waits on* and is never asked.
- **In two steps.** First inside one page, where there is one record: the sheet, the month and the record say whose the
  decision is. Then between pages of one browser that share a flow (Q-245: a read flow's own page, on its reader's
  files): the decision is kept where it was made, at the paused flow, and the other page's record cites the decision it
  carried, so no flow decides the same file twice.

### 7. A change is followed, said and tested (Q-232)

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

### 8. The ontology owns shared types, and a flow may handle a column its own way (Q-234)

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

### 9. Exploring what a flow gives (Q-235)

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

### 10. Building in the app (Q-236)

- **A catalogue** of the flows shipped with the build. *Add a flow* puts its card on the canvas and makes what it gives
  readable in the reader's own cells and the exploration view.
- **A join form** that writes the join step: two datasets, the key on each side, the columns to take. It writes a
  notebook cell, as the gate toggles write gate cells (ADR 0014 slice 6), kept in the browser with every other edit.

### 11. Reused a little differently (Q-233)

- **Inputs and settings.** A flow may declare an open input, the columns it needs, in place of a file of its own, and
  settings. Each use maps one of its own datasets onto each input and gives the settings. Its checks and steps stay as
  written.
- **Each use is named and hashed apart.** Two uses of one flow are two names on the canvas and two hashes in the run.

### 12. The demo, the voice and the slices

- **Larkspur is cut into five flows** (Q-237): HR organisation, Inventory, Evidence feeds, Applications, and the
  posture product on top, which reads the four. The same steps and the same held days: its answer key stands. What one
  flow reads of another is published there, so the bronze files' checked rows and the organisation's units, leaders and
  closure become datasets the flows give.
- **Plain in the app, smalty where it is safe** (Q-239): a sealed flow may say *Worth its smalt.*, an empty catalogue
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
day of the demos has two. The second step, between pages of one browser that share a flow, was built last, once the
maintainer had chosen the page (Q-245): its own section, below.

### Slice 6: a change followed, said and tested (2026-11-17)

Built after slice 7. *Followed* needed nothing new: reading a flow brings in the flows it lists as they are (slice 1).

- **Whose a change is** (`src/core/follow.ts`, pure). A change set is the flow's whose file or step one of its edits is
  about (`changeFlows`, from `editTargets`); every flow that reads that flow, near or far, *follows* it
  (`followersOf`); `flowChanges` lists what bears on a flow, its own changes and those it follows.
- **A change is made at the flow it belongs to** (`src/core/attribute.ts`). A flow is known by the hash of its own
  document, so a change about one of its files or steps is made there too: a dated change set joins the change sets
  of every flow whose document has the file or step (`withOwnChanges`), a name edit is made again in each
  (`ownWithEdits`), and the reading document names each flow by the hash its own document has then
  (`attributeChanges`). So a flow's hash moves with a change to it or to a flow it reads, and with no other.
  - **The build and the recorder** (`readWithChanges` in `scripts/flow.ts`): a recorded story's change sets are put
    where they belong before the flow is shipped and before a day is run. Larkspur's two (the WAF's band, the
    findings' values check) are Evidence feeds'; Applications and the posture product follow. Every run of March
    names Evidence feeds and Applications by the hashes their documents have with them.
  - **The app** (`followEdits`): after every edit, each read flow's own document is made again from the one shipped.
    A name edit is kept as it was made (`FlowEdit.name`, a `NameOp`), so it can be made again after a reload. The
    next run keeps the documents as they are now (`flowsToKeep`), and the record keeps each by its hash, so an audit
    of a run from an earlier visit still has what the run named.
- **Said.**
  - A flow's card says `FLOW · CHANGED` on the day a change of its own takes effect under the rules on screen, and on
    every day once it was changed here (`partChanged`).
  - Its sheet has **What changed** (`flowChangedPart`): each change set with the day it takes effect from, what it
    did in words (the rules' own words, ADR 0021 §5), who recorded it, when and why, and where it stands for the day
    on screen; then the changes of the flows it reads, each saying which flow it follows; then the names edited
    here. Under them: the flows that read it and follow, and its hash now beside the one it was shipped with.
- **Tested on the days recorded** (`testChange`; `testCount`, `testSaid`). Under each change set, **Test on the 14
  days before it ›** runs each of the last recorded days before the change takes effect again: on the files readers
  got, under the rules its day had with the change added, as a what-if (ADR 0021 §4). Nothing is published, no name
  moves, nothing is recorded. The sheet then says what it found, in the maintainer's shape: *Under the changed
  Evidence feeds, 2 of the last 14 days would have paused: Tue Mar 12 and Mon Mar 18; 12 come out the same.* The days
  that differ are listed, each a link, with what would hold them. The test informs: the change stands either way.
- **Pinned** (`compose.ts`). A flow lists a flow it reads by its path, or by its path and a hash:
  `{ "path": "hr/flow.json", "hash": "…" }`. Reading then refuses any other, saying both hashes: *Sales pins Orders
  at …, and orders/flow.json is … now: move the pin to read the flow as it is, or put the flow back as it was.* The
  part says who pins it (`FlowPart.pin`), the pin is part of the reader's hash, the flow's sheet says it, and an edit
  that would move a pinned flow's hash is refused in the app (`pinProblem`): a change of the flow itself, or of a
  flow it reads.
- **The offline audit** (`audit.ts`, left by slice 1): for each run, the flows its manifest names are its document's;
  each one's own document is in the bag, by the hash the run names it by; and the run's document holds it unchanged
  (`flowProblems`). One that isn't in the bag is said as what can't be checked.
- **What differs between two versions of a flow** (`flowDiff`, `diffLines`): its files, its steps, what it gives, the
  flows it reads, and each difference in its checks, in words. Nothing in the app changes a read flow's steps yet;
  slice 9's catalogue and join form are what it is for.
- **Tests**: `test/follow.test.ts` (whose a change is, who follows, the own documents and their hashes, the pinned
  refusal, a diff's lines, a test's sentence), `test/compose.test.ts` (the pin; the audit of the flows a run names),
  `tools/browser/stops/follow.json` on Larkspur's month and the tour.

**What it leaves:**

- The test runs in the browser, a day at a time: fourteen of Larkspur's days take about a minute. What it finds is
  kept while the page is open.
- It tests the days before a change takes effect. A back-dated change's own days are restated (ADR 0021 §5), which
  already says what each would come to.
- A flow's month doesn't mark the day a change of it took effect: the day's head says what is new on the day.

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
  for one. The record's line says *…, its own way:* and the reason.
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

### Slice 9: building in the app, a catalogue and a join form (2026-11-17)

Built before slice 8: adding a flow as it is comes before adding one with its inputs mapped.

- **The catalogue is a folder.** A flow's folder may hold `catalogue/`, each folder in it a flow (`flow.json` and its
  notebooks) that reads what the flow's own flows give. The build reads each as it reads any flow
  (`scripts/catalogue.ts`, `readCatalogue`) and ships its own document (`data/catalogue/<id>.json`), listed in
  `loads.json` (`catalogue`, `DataList.catalogue`) with what it gives, what it is built on and the hash it is known by
  (`CatalogueEntry`, `entryOf`). No data is made for a catalogue flow, and the folder is no part of what the flow's
  data is keyed by: a flow in the catalogue is built in the page, from the day's run.
- **Larkspur's catalogue** (`examples/larkspur/catalogue/`): *Ownership* (who answers for what: the applications each
  business unit owns, and the ones whose chain of owners doesn't reach the group; it reads Applications and the HR
  organisation) and *Certificates* (the TLS certificates that expire within thirty days, and each certificate
  authority's; it reads the Evidence feeds). Neither has a file of its own.
  - A catalogue's flow is held to the rules of the flows it reads. Certificates reads the TLS feed, which a held day
    can fill from another day, so both its datasets carry `filled_from` (ADR 0009 amendment 1): without it the run
    stops, naming the dataset.
  - Ownership's list of the applications nobody answers for is empty on a day that went out, since Applications holds
    a day with even one. On such a day it is built from the same run and kept back with it: the list to work the day
    from (26 applications the day a team is dissolved, in the tests' estate).
- **Add a flow** (`src/core/catalogue.ts`, pure; the app's `openCatalogue`, `addFromCatalogue`): above the canvas, for
  the owner. The sheet lists each flow with what it gives and what it is built on, and **Add it ›**.
  - `addFlow` puts the flow's own steps, notebooks, gates, contracts and meanings after the document's, and lists the
    flow last among the flows it reads, by its path and hash. What it makes is the document reading a flow that lists
    the added one gives, for everything a run reads: the plan is the same, node for node (`test/catalogue.test.ts`).
  - `addProblems` says why one can't be added, each in a sentence: it is read here already; it is built on a flow this
    one doesn't read, or reads as another flow (by its hash); it has files of its own or watches a dataset, for which a
    build would have to ship data; a name of its own is taken; another calendar, day or way of pausing; policies of
    its own.
  - Added, the day runs again with it. Its card is on the canvas with its day, its sheet says it was added here, what
    it reads and what it gives, and each dataset it gives has **Explore ›** (slice 4). The run names it among the flows
    it read, and keeps its document (`followEdits` takes a catalogue flow's document as it takes a shipped one's).
  - **Take it off** (`takeOff`, `takeOffProblems`), where nothing reads what it gives.
  - **A flow that can't run here is taken off again.** Where the day's run stops at one of the added flow's own steps,
    the flow is taken off at once, the status line says what the engine said, and the record keeps both the adding and
    the taking off (`stoppedAt`). A flow isn't left to fail every run after. A run that stops anywhere else would have
    stopped anyway, and the flow stays.
- **The join form** (`src/core/joincell.ts`; the app's `joinForm`, `writeJoin`): on a dataset's **How it joins**, *Join
  them as a new dataset ›* beside each dataset the ontology says it joins, with the key the ontology gives, and *Join
  it with another dataset ›* for any other. The form has the other dataset, the key on each side, which rows are kept
  (every row of the left, or only those that find a match), the columns to take from each side, a name and a
  description.
  - **It writes a notebook cell** (`withJoin`): in `joins.nb.ts`, a notebook of the flow's own made the first time,
    with each side imported from the notebook that defines it, the join as an SQL cell (`emitJoin` in `emit.ts`: the
    engine's language stays in one place) and the new dataset published. A column both sides have is named after its
    dataset. So a join made in the app is a join written on disk: download the notebook, and reading the flow's folder
    gives the same step.
  - **The step is derived by the notebook parser,** not built by hand: the page loads it the first time someone
    builds (`src/app/derive.ts`, `derive.js`, 132 KB: smaltty's parser and binder, smaltnb's format and graph,
    `expandNotebooks`), as it loads the SQL parser when a screen asks where a column is used. `derive` gives the
    notebook a section of its own on the canvas and leaves every other section as the page arranged it.
  - `joinProblems` says why a join can't be written: a name taken or not a name, a side that isn't a dataset here or
    is a step another flow keeps to itself, the same dataset twice, no key, a column a side doesn't have, nothing
    taken, two columns that would have one name (`joinedColumns`), or a side built from a feed a held day can fill
    with `filled_from` left out, which the run would stop on. The form says each before anything is written.
    **Take it out** (`withoutJoin`) removes the cell, and the notebook with its last one. A join the engine can't run
    all the same is taken out again, as a flow added is.
  - **In any flow written as notebooks.** A flow that reads no other and ships no catalogue has the join form all the
    same (the control estate). The bar above the canvas is there once something was made here, and its sheet then says
    that the build ships no flow to add.
- **Recorded, and kept.** Each is a change of the flow, recorded at once in words (*Added Ownership from the
  catalogue: it gives apps_by_unit and unowned_apps*; *Joined apps with org_units on owner_team_id = org_unit_id, as
  apps_with_org_units: every row of apps, with …*), kept in the browser with every other edit, and listed under
  **Made here** in the catalogue's sheet. *Back to the flow as shipped* takes them all away.
- **Tests**: `test/catalogue.test.ts` (the entries, the plan node for node against the flow read with the added one
  listed, a second flow, the refusals, taking one off, and an added flow run and verified in the engine; then
  Larkspur's two on days of the estate, through the engine: what each gives counted against the day's own files, the
  run refused where Certificates doesn't carry `filled_from`, and Ownership's list on the day Applications holds),
  `test/joincell.test.ts` (the SQL, the notebook's text, the step the parser derives, a second join that reads the
  first, the sections, taking one out, the refusals, and a join run in the engine).
  `tools/browser/stops/build.json` walks it on the tour at every size, and `alone.json` on the control estate, a flow
  that reads no other.
- **Found by running it.** The first Certificates read the TLS feed without the fill mark, and the tests of the plan
  didn't see it: the plan was right and the run stopped. Hence the tests on the estate's own days, and the taking off.
  A flow taken off after a stopped run was checked by hand on a build with the mark removed (no stop set: every flow
  the catalogue ships runs).

**What it leaves:**

- A catalogue flow has no file of its own and no watch: its data would have to be made and shipped by the build. One
  with inputs to map is added with a form (slice 8).
- The join form writes one key pair from its selects; a second pair is written in the cell by hand. It doesn't warn
  of a key that repeats on the other side beyond saying so: **How it joins** counts it.
- A cell isn't edited in the page yet. The parser is there now, so it can be.

### Slice 10: the voice (2026-11-17)

Built with slice 9, whose screens two of its three lines are said on.

- **Three lines, in one place** (`src/core/voice.ts`, pure, outside what the data is keyed by): each with the plain
  words that say the same and the one place it is said.
  - *Worth its smalt.* under a gold dataset's seal, on a run whose every gate passed with nothing held. A seal on a day
    that was held and decided says what it is and no more.
  - *Worth its smalt.* at the end of the status line, once, when a flow added from the catalogue went out as usual on
    its first day here.
  - *Nothing upstream yet.* in the catalogue of a build that ships no flow to add, with the plain words under it.
- **Nothing playful where it could mislead**: not on a paused day, a refused file, a decision, a hash or the audit.
  `NEVER` lists what the family's wordplay doesn't say of audited data (*a grain of smalt*, *a pinch of smalt*,
  *smalted*, *smalt away*), and the tests read every string the page and the sample flows carry against it.
- **Plain words** (`plainWords`, `wirePlainWords`): a tick in *About this flow*, kept in the browser, or `?plain` in
  the address. Each line is then its plain words, or nothing where the screen says them already beside it. The play is
  decoration over a serious surface, and the switch shows it.
- **The sample estate carries two jokes**, in the notebooks of Larkspur's catalogue, where a reader meets them while
  reading a flow and no day's verdict is near: the applications that are *somebody's*, and the browser that reminds
  less politely.
- **Tests**: `test/voice.test.ts` (the lines few and short, their plain words, the phrases never said, and that the
  page says the lines through `voice()` alone). `tools/browser/stops/voice.json` on the tour (the seal on a normal day,
  the first pass, nothing on a held day, plain words) and `alone.json`'s empty catalogue on the control estate.

### Slice 8: inputs and settings (2026-11-17)

Built last: the catalogue (slice 9) is where a flow with inputs is used from the page. The maintainer's answer on a
flow reused "slightly differently" (Q-233): what a flow may change about a flow it reads is its inputs and its
settings, nothing else.

- **A flow declares what is open.** In its `flow.json`, `inputs`: each a dataset it reads in place of a file of its
  own, by an id, with the columns it needs; and `settings`: each a value with a type and a default. In its notebooks,
  `const feed = input('feed')` binds a name to an input (`smaltfl/notebook`), read in SQL as a file is, and
  `${params.floor}` reads a setting where the document declares `floor` as one. A setting is declared in the notebook
  as a parameter is, so the notebook still runs on its own in smaltnb, with the defaults. A name is a parameter, the
  same for every flow in a run, or a setting, each use's own.
- **A use** is an entry of a flow's `flows`:
  `{ "path": "kit/tally/flow.json", "as": "paid", "inputs": { "rows": "orders_checked" }, "settings": { "floor": 25 } }`,
  with an optional `name` for the screen and an optional `hash`, which pins the flow used. It maps one of the reading
  flow's datasets onto each input: one of its own, a file, or what a flow it lists publishes.
- **The flow's notebooks are read under the use's name** (`notebook.ts`; `NotebookDef.use`, the notebook's path then
  ending in `#<use>`), the same text for every use:
  - each step is named after the use: `paid_by_status`, `paid_big`;
  - each input is a step, `paid_rows`, that reads the columns the flow needs of the dataset mapped onto it and no
    other (`emitPort` in `emit.ts`). So a flow reads of an input what it declares, a column the dataset lacks stops the
    run at that step by name, and no plan or runtime learns what an input is;
  - each setting is the use's value, written into the statement as a literal of its type (`literal`, as a parameter's
    is at translation).

  The flow's steps and checks are as written. What its ontology says of its own datasets (what a column means there,
  what its rows are called, what its rows are) it says of the use's (`renameOntology`), and so do its contracts.
- **Each use is named and hashed apart.** A use is a flow of the document, a `FlowPart` whose `use` says what it is a
  use of, by id, name and hash, what is mapped onto each input and each setting's type, value and default
  (`FlowUse`). So it has a card, a row in the month and its own days, like any flow read.
  - Its hash is the flow hash of its own document (`useOf`, `reuse.ts`): the flow's document under the use's name,
    which holds the hash of the flow used. Two uses of one flow have two hashes; a change to the flow moves both, and
    no other flow's. No new hash encoding: it is `flow/1` over a document.
  - A run names each use among the flows it read (`manifest.flow.reads`) and keeps its own document, and verify's
    `flows` check holds the run's document to it, as for any flow (`composeAll` gives the own documents; a use's is
    held by no folder).
  - A use's own document reads datasets it doesn't hold: it is valid, hashed, kept and compared, and never translated
    alone, and neither is a flow with an open input (`translate` refuses both in a sentence).
- **What a use reads.** The flows that give the datasets mapped onto its inputs are the flows it reads (`reads`), so
  its card is joined to theirs, and it waits where they hold. What may be mapped is what the flow that lists the use
  may read itself (`validateFlows`): a dataset of its own, published or not, or what a flow it lists publishes, or
  that flow's files. A flow lists every flow it reads from, and a use is no way round that: a dataset of a flow two
  flows down is mapped once the lister lists that flow.
  Inside a use, every input shows where its rows come from (`levelDoc`): the flow that gives the mapped dataset as a
  card, or, where it is the listing flow's own, that dataset itself.
  A flow reads what a use gives by the name it has there: `import { big as paid_big } from './kit/tally/tally.nb.js'`,
  the alias saying which use. A flow that uses a flow may itself be read by another: its use is then a flow of the
  reader's document, a flow down, and what it gives is the listing flow's to pass on.
- **Refused, each in a sentence** (`useProblems`, `useOntologyProblems`, `mapProblems`): a name that isn't one or is
  taken; an input with nothing mapped, or one the flow doesn't have; a setting the flow doesn't have, or a value not
  of its type; a dataset that isn't there, or lacks a column the flow needs (where the columns are known); a flow with
  an open input listed as it is; and a dataset built from a feed a held day can fill, mapped onto an input that
  doesn't take `filled_from`: what the use gives couldn't say which rows came from another day (ADR 0009 amendment 1).
- **In the app** (`useForm`, `addOwn`, `usePart` in `main.ts`): the catalogue lists a flow with inputs with what each
  use gives, what it reads of its inputs and what each use sets, and **Use it ›**. The form offers, for each input, the
  datasets the day's run built that have its columns; a field for each setting, with the flow's own value; and a name,
  after which what it gives is named. The use is made by the notebook parser the page loads to build (`derive.js`'s
  `use`), added as a catalogue's flow is, recorded in words (*Used Control by unit as waf_by_unit: feed is waf_checked
  and owners is app_owners; floor 99.5. It gives …*), kept in the browser, and taken off the same way. **Use it again ›**
  makes another. A use's sheet says what it is a use of, the dataset mapped onto each input, a tap from its card, each
  setting with a value set here told from the flow's own, the other uses of the same flow, and what a use may change.
  Its notebook reads as a page: the flow's text, with this use's steps and rows.
- **Its checks and steps stay as written, in the app too.** A change to the rules of a use's datasets is refused,
  saying whose they are (`pinProblem` in `follow.ts`). A use kept in a browser is of the flow as it was when it was
  used: where a later build ships another flow under the name, the use is taken off at start, and the list of what
  was made here says so.
- **Larkspur's catalogue has one**: *Control by unit* (`examples/larkspur/catalogue/by_unit/`). One control's evidence
  told by business unit: how many of each unit's applications pass and fail it, the units under a floor (90 percent,
  a setting) and the failing applications. Its inputs are an evidence feed (`app_id`, `status`, `filled_from`) and the
  owners (`app_id`, `name`, `business_unit_id`, `lifecycle`): it names no dataset of the estate.
- **From the package**: `composeAll` beside `composeFlow`, `useOf`, `useProblems`, `mapProblems` and the rest of
  `reuse.ts`, and the document's `FlowUse`, `InputDef` and `SettingDef`: what a host needs to read a flow with uses
  and keep each use's own document with a run.
- **Nothing that was there moved.** Every example flow, read by the code before and after, has the same flow hash, the
  same plan and the same hashes for the flows it reads (computed both ways and compared). The demos' data is made
  again all the same, since what it is keyed by includes the code that reads a flow.
- **Tests**: `test/reuse.test.ts` (a small estate where one flow is used twice, once on a read flow's dataset and once
  on a step of its own: the document, each use's own document and hash, the ontology, the canvas in levels, the run
  through the engine with its manifest and verify, a column the mapped dataset lacks, every refusal, the fill mark, a
  flow with settings and a file of its own, a rule not changed on a use, and a flow that uses a flow read by another);
  `test/catalogue.test.ts` (*Control by unit* used twice on a day of Larkspur, through the engine: each use's units
  and failing applications counted against the day's own, the floor telling them apart, and a use made in the page
  hashing as the same use listed in the estate's `flow.json` does). `tools/browser/stops/use.json` walks it on the tour
  at every size.

**What it leaves:**

- A flow used under a name has no file of its own, reads no flow of its own, watches nothing and has no dated change:
  each is refused. So a use has no history of its own to be judged by yet, and a flow that needs another flow's dataset
  takes it as an input.
- An input's columns are names: their types aren't declared or checked.
- A setting is read in SQL cells. A check's rules are text, and don't read one.
- A use's inputs and settings aren't changed in place in the app: take it off and use it again.
- What a read flow's use gives is read by the flow that lists the use, which passes it on in a step of its own.

### Slice 5, second step: a decision carried between pages (2026-11-17)

§6's second step, built last. It needed two pages of one browser that share a flow and its files, and the site had
none; the maintainer chose which (Q-245): **one read flow's own page**.

- **The page.** Evidence feeds, a flow the estate reads, is a page of its own on the tour's files:
  `examples/larkspur/feeds/data.json` is its data list (the tour's generator and arguments; the seventeen files the
  flow has, its own thirteen and Inventory's four) and `examples/larkspur/feeds/tour.json` its story, the tour's as far
  as it is about this flow's files, each decision its owner's, Wed Mar 27 left to decide as it is in the tour.
  `npm run build:app -- --flow examples/larkspur/feeds/flow.json --out dist/app-feeds` makes its data in about four
  minutes: its own histories, its own recorded months. Its 920 files are the tour's, byte for byte, since one generator
  writes both from one seed. The site deploys it at `/feeds/`, beside the tour at `/app/`.
- **The same flow, by its hash.** The estate knows Evidence feeds by the flow hash of the document read from its own
  folder (§2), and that document is what its own page ships: while neither page has edited it, the flow as kept on its
  own page and the flow the estate names are one hash (`test/carry.test.ts` holds them equal).
- **What a decision says of where it was made** (`src/core/carry.ts`, pure). A decision of a flow the page reads says
  `flow` (the first step). A decision of the page's own flow, made in the browser, now says `base`: the flow as kept
  when the run it decides ran (its document with its change sets, ADR 0021 §5), as the record's `flow` entry before
  that run says. `madeAt` reads either: the flow a decision was made at, by id and hash. The build's recorder writes
  no `base`, so a recorded month is what it was.
- **Found.** After a held run, and when the page is looked at again (another tab may have decided since), each held
  load whose hold leads (`leadingHere`) is looked for in the other records this browser keeps (`FlowRecord.others`:
  one a flow, in one IndexedDB, signed by the same identity; each read and checked as its own page reads it, and never
  written from here). `decidedElsewhere` takes the latest decision about the load made at the same flow: made there,
  not itself carried and not applied under a standing decision, and under a checkpoint its browser signed. A site's
  other demos keep records in the same browser, so only the records that can hold such a decision are read: those of
  the flows the page's flow reads, those of the pages the site names, and those whose page noted, in the browser's
  storage, that it recorded a decision of that flow. The note says where to look and nothing more: what is found is
  checked in the record it is in.
- **Carried.** The decision is recorded here as this record needs it: one decision a held load (ADR 0010 §7), the
  load that leads citing the entry it carried (`from`: the other record's origin, the entry's seq and leaf, and the
  proof kept here), the loads that follow carrying that one as inside one page. It is recorded as made by whoever made
  it there, who must be allowed that decision here (the reader's policies apply, §"Not built"), with the same option,
  scope and reason; then applied as any decision is. A fill is the same remedy made here: the part this page finds
  missing and the donor this page offers (the same file of the same day, by the same rule), judged from this page's
  own history, staged on its own run, and it must pass here. An Accept is carried where the level this page would
  accept is the same. Nobody is asked.
- **The latest decision stands on both pages** (`givesWay`): a decision changed on one page is carried to the other in
  turn, amending the one it had; a decision made here after the other page's stays, and the other page carries it.
- **Not carried, and said** at the head of the decision sheet, with what the other page decided: the flow isn't the
  same there (it was edited on one of the pages, so it is known by another hash: *its rules differ*); the decision
  doesn't say where it was made (made before this was built); its record hasn't signed it yet; whoever made it may not
  decide here; an Accept that wrote a band (it changed the flow's rules there, and a change to a flow's rules isn't
  carried); a remedy that can't be made or doesn't pass here; a day readers already have as is here.
- **Proved, and checked offline.** Beside each carried decision the record keeps a proof (a blob, kind `carried`): the
  entry as its own record keeps it, and its inclusion proof under a checkpoint of that record the browser signed. The
  audit bag carries it, and `audit.ts` checks it without the other record (`carriedProblems`): the citation names
  another flow's record of the same browser; the proof holds that entry, by its leaf, in that record at that size and
  root, under a checkpoint the bag's card signed; and the decision it carries was made at the same flow, about the
  same load, to the same end, by the same person for the same reason, no later than it was carried. Every decision
  that says `base` is held to the record's own `flow` entries (`baseProblems`).
- **Said**: the receipt, *Decided on Evidence feeds’ page, and carried here: nobody was asked twice*; the record's
  line, *· carried from Evidence feeds’ page, its #83*; the month's timeline, *On Evidence feeds’ page, Owner
  published it as is. Carried here.* The other page's flow and people are named from the document its record keeps.
- **The pages link to each other.** Where the pages are is the site's to say, not the flow's: the build's
  `--page id=address` (`--page feeds=../feeds/`; `--page "larkspur=../app/=Larkspur estate"` names a flow the document
  doesn't know) ships them in loads.json (`pages`, `DataList.pages`). A read flow's sheet has **Its own page ›**, the
  decision sheet's head a link to the page of the flow that decides (and, on the flow's own page, to the page that
  takes the decision from it), the receipt of a day decided here says where it is carried to (*Carried to Larkspur
  estate’s page when the day runs there*, a tap away), and *About this flow* says which pages share it.
- **A reader's data is made from its read flows' documents and notebooks only** (`dataKey` in
  `scripts/build-app.mjs`): a read flow's own data list and story are for its own page, and adding them left every
  demo's data as it was. The cache keeps five data sets, since the site deploys five pages.
- **What the new page found.** The Ontology page failed where a type's objects are a file no step of the flow reads
  (Inventory's platform files, which only the estate reads): such a type now shows no count, and the file's Data tab
  says no step here reads it. The month's timeline said a following load's decision as a second line, and measured a
  recorded day's wait by this browser's clock: one line, in the story's time. A flow with no policies names its one
  owner *Owner*.
- **What auditing a fill found.** No stop had audited a bag after a fill on a day where a second load follows the
  filled file (slice 5's first step: the posture's own load, decided with the file's). The audit took that second
  decision for the fill's own decided again, since both are of one run's inputs, and failed the fill's release. With
  several watched sources the same thing decided again is the same load (ADR 0010 §7), as a release that cites loads
  already had it: fixed in `audit.ts`, and the stops now audit a fill, inside one page's record and carried.
- **Tests**: `test/carry.test.ts` (the flow a decision was made at, what a page looks for and finds, which decision
  gives way, the proof and each way it can fail, on Larkspur's estate and on Evidence feeds read from its own folder;
  and the page's data list and story held to the tour's: the same generator and arguments, the estate's bindings, the
  tour's deliveries and decisions as far as they are about its files). `test/record-others.test.ts`: another flow's
  record read as its own page keeps it, read on from where it was left, never written, only the records asked for,
  and the proof exported with what the entries name.
  `tools/browser/stops/carry.json` walks it in a real browser at every size, on the two apps served from one origin
  (tour.cjs's `page`): decided on Evidence feeds' page and carried to the estate's, and applied again when the page is
  opened again; decided on the estate's and carried to Evidence feeds'; changed there and carried back; not carried
  where the rules differ; a fill carried, made again in a new engine, then withdrawn there and here; each page's
  record exported and held by the offline audit, a carried fill's twice. A bag whose proof is taken out,
  changed, or no longer places its entry fails the audit at the decision that cites it (tried by hand on a bag from
  those stops). The whole browser regression on the five pages built from this work, at every size: the tour with
  Evidence feeds' page 60 of 60 jobs, Larkspur's planted month 45 of 45, the control estate 20 of 20, the sign-ins
  12 of 12.

**What it leaves:**

- Carrying is by load: a flow that watches one dataset decides its day, not a load (ADR 0010 §7), and neither carries
  nor is carried.
- Only decisions made in the browser are carried. A month the build recorded is each page's own, from its own story.
- A change to a flow's rules isn't carried between pages (§"Not built", a flow run on its own): after an edit on
  either page the flow is known by two hashes, and a decision made after it isn't carried. The sheet says so.
- A day closed under a standing decision (*later days too*) is closed on the other page by its own rule, once the day
  the standing decision was made on has been carried there.
- A file replaced by an upload is a later delivery on the page it was uploaded to: the other page doesn't have it.
- A page that is open takes a decision made in another tab when it is looked at again, or when the day runs again.
- An Accept and the part alone are carried by the same code as a fill, and aren't walked in a browser: the tour leaves
  one day to decide, and its cause is neither.
- Found on the way, older than this and left as it is: the offline audit fails a bag in which a fill was withdrawn on
  a day whose holds kept back only some outputs (*it doesn't leave … showing the latest day left published*). The
  audit reads what a name showed from the days that published whole, and a held run publishes what its holds don't
  reach. It happens inside one page too (decide a fill on the tour's Wed Mar 27, change the decision to *Keep*,
  export): the withdrawal is right on screen and in the engine, and the audit's reading of it isn't. It is the next
  thing to fix in `audit.ts` (`shownBefore`), with a stop that audits a withdrawal.

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
  part of it has a precedent. §6's second step is the bridge to the other: a read flow has a page of its own, and a
  decision made on either page is carried to the other. What a flow's own page builds, and what it changes in its
  rules, isn't carried yet.
- **A consumer keyed by the content of what it reads,** so a flow rebuilt to the same output disturbs nothing
  downstream. Keys stay as ADR 0004 has them.
- **A flow with policies of its own** inside a reading flow: the reader's apply.

## The questions

Asked through the question prompt, 2026-11-17, in three rounds of three (docs/OPEN_QUESTIONS.md):

- **Q-231:** a paused day of a shared flow is decided once, at that flow.
- **Q-232:** a change is followed and said, and tested on the days already recorded.
- **Q-233:** a flow may change the inputs and settings of a flow it reads, nothing else.
- **Q-234:** the ontology owns shared types; a flow may override a column, hashed and noted.
- **Q-235:** exploring an output: highlight and filter, how it joins, two days compared.
- **Q-236:** building in the app: a catalogue and a join form.
- **Q-237:** the demo: Larkspur cut into flows.
- **Q-238:** the name: a flow.
- **Q-239:** the playful voice: success and empty screens, and the sample estate.

Built as proposed, then asked the same way on 2026-11-17, in two rounds, and confirmed as built:

- **Q-240:** testing a change on the days recorded informs, and holds nothing back.
- **Q-241:** a flow's own handling of a column is written in that flow, marked with its reason.
- **Q-242:** where two flows hold on one day, one choice is recorded as a decision a flow.
- **Q-243:** a use's datasets are named after it, and it is known by the hash of its own document.
- **Q-244:** a flow or a join whose own step stops its first run is taken back at once.

Answered in the same rounds, then built:

- **Q-245:** a decision is carried between a read flow's own page and its reader's: Evidence feeds, on the tour's
  files (§6's second step).
