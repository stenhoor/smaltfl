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
