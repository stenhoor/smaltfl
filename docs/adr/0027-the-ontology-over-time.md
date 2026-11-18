# ADR 0027: The ontology over time

- **Status:** accepted, 2026-11-18: the maintainer's answers to Q-247 to Q-279, asked through the question prompt in
  seven rounds once the research was in. Nothing of it is built yet: it is built in the slices of §11. The choices the
  answers leave open are proposed here (Q-280 to Q-285), for the maintainers to confirm as each is built.
- **Date:** 2026-11-18
- **Builds on:**
  - [ADR 0006](0006-integrity.md): the record and the audit bag, which keep every change and decision this ADR adds.
  - [ADR 0009](0009-paused-not-published.md): a day that is off is paused, and a person decides. An arrival the
    ontology doesn't have is paused the same way.
  - [ADR 0010](0010-any-dataset.md): the learned checks, the accepted level (Q-57), a day with nothing to compare
    against.
  - [ADR 0014](0014-gates.md) and [ADR 0015](0015-the-bronze-layer.md): gates, the ontology's written rules, the
    Ontology page, and declarations proposed from a file's own data (Q-139).
  - [ADR 0021](0021-time.md): the two clocks, dated change sets, the rules in force hashed to each run, restatement and
    what-if runs. This ADR widens what a change set can date and says how the result is shown.
  - [ADR 0022](0022-the-answers-of-2026-11-14.md): columns that change, and the ontology as the one place for rules.
  - [ADR 0024](0024-the-month-at-a-glance.md): the month's charts, which gain cuts and marks.
  - [ADR 0026](0026-flows-in-flows.md): the estate's ontology shared by several flows, and a change followed, said and
    tested on the days recorded.
- **Changes:**
  - ADR 0021 §"Changes that arrive as data stay data": still so, with one exception the ontology itself declares: a
    closed list or a closed column (§4).
  - Q-198 (a name, a meaning and a label change at once, on every day): a name and a rewording still do. A
    redefinition takes effect from a day (§3, Q-251).
  - ADR 0022 §2 (a new column alone is noted): it is still noted and the day goes on, and nothing may read it until it
    is described or set aside (§4, Q-252).
  - ADR 0010 §"Accept the new level" (Q-57): where a declared change moves a series, declaring it is the acceptance,
    given ahead (§7, Q-263).
- **Research:** [docs/research/temporal-ontology.md](../research/temporal-ontology.md): eight strands in two passes,
  the second checked against the primary pages.

## Context

The maintainer, 2026-11-18:

> What I want you to come up with is a plan, and I want you to interview me and go back and forth on the design
> decisions as much as we need to come up with a temporal ontology. I've never really seen one work well [...] I want to
> be able to show how the ontology of the data is changing over time and why certain things apply at certain dates
> versus others, and be able to kind of map back to the day what was going on at that time, what were the decisions and
> thought processes and how the business was operated and maintained at that time period. So not only does it need to
> be a visual thing, it needs to be something that can tie into the data flows and perpetuate so that we can do analysis
> backwards on data where we're always aware of the context of what was happening at each updated data slice, as well
> as what's going on today and how the current data looks.

And, while the research ran:

> In my mind, ontology more means like the business rules. So if like a new role was created that impacted the
> organization, that would be an ontology update. But just the fact that people moved around in the organization or got
> hired, fired, promoted, whatever, is more of a data change with the incoming data set.

**What smaltfl keeps today.** Rules are dated and almost nothing else is.

| What | Today | What is missing |
| --- | --- | --- |
| Rules, bands, a check's mode, a column read under another name | Dated (ADR 0021): a change set says the day it takes effect from, when it was recorded, by whom and why. A back-dated change restates the days it reaches. Each run names the hash of the rules it ran under | The reason is optional on most edits. Nothing says what kind of change it was, or links it to what caused it |
| A column's name, meaning and value labels | Change at once, on every day (Q-198) | A past day can't show what a column meant then |
| Types, links, what a row is, dependencies | Edited in files only | No dates, no history, no reasons |
| The estate's ontology, shared by Larkspur's five flows | One document with one hash (`estate/0`) | No versions or reasons of its own |
| What was going on: a reorg, a freeze, a migration | Words inside a decision's reason | Nothing an event can be recorded as, or pointed at |
| A list that defines the business: the control catalogue | Arrives as data. A fifteenth control changes what every score counts | No way to say the list is part of the ontology |
| A new source, a new column | Sources are written in the flow's files. A new column is noted and left unread | Nothing makes the description come first |
| Charts over days | The score's line, the month's rows of days | No chart marks where a definition changed |
| Two clocks | *For the day* and *as known on* both exist | Shown as two controls, and not on any chart |

**What the research found** (the research document has the sources and how far each was checked):

1. The temporal ontologies that work are registers of dated records, not graphs that move: a stable identity, the day
   it holds from, the moment it was recorded, a status, a reason, what follows it. Nothing is deleted. The current
   state is a default view over the history. Law, clinical terminologies and statistical classifications all run this
   way.
2. Two clocks are settled practice: when something applied, and when it was recorded. A third has no agreed meaning
   and no working build. Fowler's advice for avoiding the full two-clock model is to keep with each action the inputs
   it used, which the hash of the rules on every run already does.
3. In every data product examined, the facts are in time and the definitions are not. Palantir's documentation says it
   "cannot provide a snapshot of your Ontology at a historical point in time". No product found reads a past day under
   the definitions of that day.
4. To see change, a list of changes said as sentences, a difference between two chosen dates, and rows of things over
   days beat a graph that plays. In the controlled studies, static views were faster than animation; choosing two
   moments and seeing them together was best for "what changed between then and now"; readers preferred charts with the
   notes on them.
5. Reading a series across a change of definition is two choices: which definitions are applied to the past, and which
   numbers are shown. The publishers who do it well mark the break, carry both series over an overlap or give the
   adjustment, and never put a restated figure silently in place of the first. The classic failure is a step at the
   changeover read as a change in the world.
6. Publishers that others rely on never take anything back. Systems operated by their owners offer a guarded way to
   rewrite history. smaltfl is both edited by its owners and relied on by its readers, so whatever a reader has seen
   follows the publisher's rule.

## Decision

### 1. The line (Q-247)

**The ontology is the business's rules, meanings and kinds of things.** A rule that judges data, what a column or a
value means, a kind of thing and how kinds relate, a control the business holds itself to, a role that exists. A
change to any of these is a change to the ontology: it is dated, it has a reason, and it is on the timeline.

**Who and what is where from day to day is data, and stays data.** Someone is hired, a team moves to another business
unit, an application changes owner, a certificate expires. These arrive in the files, are judged by the checks, and
are never on the ontology's timeline.

Between the two sits **context**: a reorg, a freeze, a migration, written down by a person so that the days can be
read (§6). An event explains the data. It isn't a change to the ontology.

### 2. The register: every change is a dated record

A change to the ontology is a change set (ADR 0021), widened. It carries:

- **From, and until.** The first day it is in force and, where it ends, the last (Q-281: both days are in). A day is
  read by what was in force on it.
- **Recorded.** The moment it was written down, and by whom. The two clocks stay as ADR 0021 has them.
- **A kind, and a reason** (Q-256). Both are required. The reason is one line in its author's words. The kind is one
  of four, and it says how history is read afterwards:

  | Kind | What it means | What follows |
  | --- | --- | --- |
  | The business changed | A new or changed definition, rule, kind of thing or entry | Old and new are each right for their own time. A series it moves is cut there (§7) |
  | A setting re-tuned | A band or a threshold moved to follow what is normal. The meaning is the same | Marked, never cut |
  | A mistake corrected | The ontology was wrong | Usually back-dated: the days it reaches are restated, and what was first published is kept beside |
  | The source changed | The file's form changed and its meaning didn't: a column under a new name | Marked, never cut |

  The first description of something isn't a change. It is recorded as the start of its history. A change set written
  before this ADR has no kind: it is shown as "kind not given", and a chart marks it and never cuts.
- **A note, optional** (Q-257), in four parts: what we saw, what we chose and what we turned down, what we expect to
  happen, when to look again. A link carries anything longer. A day to look again shows on the timeline when it comes.
- **Decided by, and on, optional** (Q-258): who chose it and when, where that isn't who recorded it. They are shown
  and can be searched. Nothing is computed from them: there is no third clock.
- **Because of, optional:** an event (§6) or a decision in the record.
- **Agreed by** (§10): who agreed to it, where its kind asks for agreement.

**Nothing is deleted** (Q-264). A thing ends from a day, with a kind and a reason and, where there is one, what follows
it: *replaced by*, *merged into* or *split into*. Past days still read it as it was, and a series can be followed
through to its successor.

**Three tenses** (Q-259). A change whose first day hasn't arrived is *coming*. It is listed ahead of today on the
timeline and on each day before it starts, with what it would have done on the last recorded days: those days are run
under it as what-if runs, as a change to a read flow is already tried (ADR 0026 §7). A change in force is *in force*.
A change that a later one replaced, or that ended, is shown as it was.

### 3. What carries dates

- **Rules** do already. Every rule edit now asks for a kind and a reason.
- **Kinds and relations** (Q-250): types, links, what a row is, dependencies between datasets. They are changed in the
  app as dated edits with the reasons above. Today they are edited in files and have no history.
- **A meaning** (Q-251). When someone edits what a column or a value means, the app asks which it is. *Reworded:* it
  says the same thing better, applies to every day, and the history keeps the old wording. *Redefined:* it means
  something else from a day, with a kind and a reason, and the charts built on it are marked from then. Past days keep
  the meaning they were made under. A name stays a label and changes at once (Q-198), with the history saying what it
  was called before.
- **The shared ontology** (Q-250, Q-265). An estate's ontology gets its own change sets. Every flow that imports it
  follows from the change's date: one truth for the business. Each flow's page shows the change as coming, with what
  it would do there, tried on that flow's own recorded days. A flow that must differ handles a column its own way with
  a stated reason, as it can today (ADR 0026 §8).
- **Not for now:** how steps compute, the calendar, contracts (§"Not built").

### 4. Ontology first: the gate

The maintainer, answering how the ontology should learn of a new control (Q-248):

> If a major change is happening the ontology needs to be updated before any new data gets introduced so as part of the
> creation of a data source the ontology gets created. You should be able to add data from a data engineer perspective
> with here is the data and then forced into adding the appropriate ontology or as a business user describing your data
> and then forced to add the data to a flow.

**The ontology is the gate for data.** Four arrivals must be in the ontology before the data that shows them is let in
(Q-252):

| The arrival | What the ontology says first | Until it does |
| --- | --- | --- |
| A new source | Its description (§5) | No step may read it |
| A new entry in a closed list | The entry, from a day | What the list reaches is paused |
| A changed entry in a closed list (Q-266) | The change, for the columns that define an entry | What the list reaches is paused |
| A new value of a closed column | The value, from a day | What the column reaches is paused |
| A new column in a known file | Its description, or that it is set aside | Nothing may read it. The day goes on |

- **A closed list** is a dataset whose rows are the things of one kind, marked closed by the ontology: the control
  catalogue, a list of roles. The ontology keeps each entry it has accepted, with the columns that define it: a
  control's weight, what it applies to, how often it is checked. A new entry, a missing one or a changed defining
  column is the data ahead of the ontology. A reworded name or description is not.
- **A closed column** is a coded column whose values the ontology lists and marks closed: a status, a tier.
- **An open list** is everything else: applications, people, findings. Its entries are data.

**The data ahead of the ontology pauses what it reaches** (Q-253). Every output built from the list or the column waits
until a person decides. Outputs it doesn't feed publish as usual. The decision is one of three:

- **Declare it,** from a day, with a kind and a reason. The form is filled in from the file. Declared from that day,
  the day is run again under it and published. Declaring it later restates the days it reaches, as any back-dated
  change does.
- **Publish without it.** The entry or the value is left out and the day says so: the score still counts what the
  ontology has. The choice may stand until the entry is declared, and the timeline shows it open until then.
- **Don't publish.** Readers stay on the last day that went out.

**Declared before its data exists** (Q-255). A business user may describe something ahead: a control decided on for a
day whose evidence feed isn't built. It is in force from its date and is shown as *waiting for data*. Every day says
so, and the score shows the control as not evidenced, until a source is bound in a flow. The gap stays on the
timeline: decided for one day, evidenced from another.

**Every flow** (Q-274). Ontology first is how smaltfl works from document format 5. The five demos are brought up to
it in the same piece of work: every column described or set aside, the closed lists marked. A document in an older
format runs as it does today until it is opened and saved in the app, which asks for what is missing.

### 5. The two doors

A source and its description are made together, through either door (Q-248):

- **Here is the data.** Someone adds a file. The app proposes its description from the file's own data, as it
  proposes declarations today (Q-139): what one row is, a likely key, each column's type, the coded columns' values.
  Before any step may read the file, three things are confirmed (Q-254): **what one row is** (which kind of thing, by
  which key), and **every column**, each either described or set aside. A set-aside column can't be read. Lists of
  values, bands and rules can follow. Then the source is added to a flow.
- **Describe it first.** Someone says what the business needs: a kind of thing, its columns, its rules. It is in force
  from its date and waits for data (§4). Binding a source maps a file's columns to it: a column under another name is
  read as the described one, as ADR 0022 §2 reads a renamed column.

### 6. Events

**An event is dated context, written by a person** (Q-249): a span of days, a kind (a reorg, a freeze, a migration, an
incident, a campaign), what it is about (the estate, a flow, a dataset, a kind of thing or named things), and a note.
It is written at the moment someone explains something, or added on the timeline. A decision, a change and a paused
day can each say *because of* one. Days and charts show the events going on.

**An event can say what it excuses** (Q-267, Q-271): what the checks learned to expect, on the datasets it names. A
rise, a drop, a shift in the mix. While the event lasts:

- a finding it excuses is told as expected, with the event's name, and doesn't pause the day;
- **a rule someone wrote is never excused.** It pauses as always, and the person who decides can point at the event;
- **excused days aren't learned from as normal.** They are set aside from the history the checks learn from, for the
  series the event excuses;
- **an event written after it began excuses only the days not yet run.** A run is never judged again because a note
  arrived. Days that already paused are decided by a person.

An event that excuses nothing changes nothing a run is judged by. One that does is part of what the run names (§12).

### 7. Reading across a change

**A change keeps its own step** (Q-261). The first day a change is in force is run both ways: as published, under the
ontology as it is, and as a what-if run under the ontology as it was. The difference in each published measure is kept
with the change: *the new control alone moved the score by −1.3; the day's data moved it +0.1*. The trial days of a
coming change give the same figures before it starts.

**Charts** (Q-260) show what was published each day:

- **Cut where the business changed.** The line is cut, and flagged with the change's name and its own step, where a
  change of that kind moved the series (Q-284). The two sides aren't one trend.
- **Marked** where a change moved nothing on that series, where a setting was re-tuned, and where a source changed.
- **A correction** shows the restated line, with what was first published a tap away.
- **With the steps taken out,** on request: the published line shifted by each change's own step, labelled as
  adjusted, beside the published line and never in its place.
- **Events** are bands over their days, with what they excuse.

**The checks** (Q-263). Where the business changed and the change moves a series, declaring it is the acceptance,
given ahead: from its first day the learned checks on that series learn from the new level, and say so. That first
day's data is still judged, through its run the old way, so real trouble on the day of a change isn't hidden by it.

### 8. Context that travels (Q-262)

A slice of data, one dataset on one day in one version, knows its context: the changes in force, the events going on,
the decisions made, and the same for everything it was built from.

- **In the app:** a change or an event marks every chart and day page of anything built from what it touches, however
  far downstream and in whichever flow reads it (ADR 0026 §7's following, widened from rules to everything dated).
- **In notebook cells:** three read-only tables any cell can join to. `context_changes`: what changed, from which day,
  its kind, why, who decided, what it reaches, its own step. `context_events`: what was going on, its span, its kind,
  what it is about, what it excuses. `context_in_force`: for each dataset of the day, the version of the ontology it
  was read under.
- **Published with the data product:** the same tables go out with the product, under its contract, so whoever reads
  it outside the app has the context too. They are made by the run from the document it names, so verify re-derives
  them like any output.

### 9. How it looks

**No seventh view** (Q-270). It lives in the views smaltfl has:

- **The Ontology view's head is the timeline** (Q-268). On a phone it is a list: what is coming on top, then the
  months, newest first. Each entry says its kind (with its own mark, never by colour alone), its dates, its reason in
  its author's words, what it reaches and its own step. From tablet width the same entries are lanes over the days: what
  is going on, what there is and what it means, what we check, what stopped at the gate, what we decided. Each row is
  one thing's life: a bar while it is in force, hatched while it is coming, dotted while it waits for data, dashed
  where the runs of the time were judged by something a correction later replaced. Today is a line. A filter keeps one
  lane, one kind or one dataset.
- **Since when, by which change,** on every rule and definition, in the Ontology view and on a card's Quality tab. It
  opens to the chain: the event, the held day, the decision, who chose and when, the change as written with its
  trial, the day it took effect.
- **Two dates compared.** In words: each line one thing, before and after, with its day and its kind, and whether the
  two differ by day or by when it was known. And as **a map** (Q-269): kinds as boxes, relations as lines, between two
  chosen dates, with only what differs coloured and what is coming hatched. It suits the kinds and relations because
  they are few. It doesn't show rules or reasons. **No graph that plays.**
- **The Month's charts** carry the cuts, the marks and the events' bands (§7).
- **The Day** shows its context: in force, going on and what it excuses, at the gate, waiting for data, coming, and
  the day read both ways where a change began on it.
- **The two doors:** *Add a source ›* above the canvas, beside *Add a flow ›*, and *Describe ›* on the Ontology page.
- **The two clocks** are one control, asked as a question: with later corrections, or as it was known then (Q-280).

Phone rules stay the base (ADR 0018). The pictures the design was agreed on are in the research document.

### 10. Who decides, who hears, and the auditor (Q-275)

The maintainer added three things the proposal had left for later.

- **Roles are named now, and become binding with sharing** (Q-276). The ontology says who owns each part: the shared
  ontology, and each flow's own. Owners are principals by their identity cards (ADR 0002, Q-31). Every change records
  who made it and who agreed, and the audit checks both against the names. Between several people's browsers it binds
  when sharing is built (Q-35). Until then one person may hold both roles, and the record says so.
- **Agreement** (Q-277). A change of kind *the business changed*, and anything that ends something, takes effect only
  with the agreement of an owner of what it touches. A re-tuned setting, a corrected mistake and a changed source need
  only their author.
- **Telling people** (Q-278), in three forms. *Since you last looked:* in the app, on the Ontology view and on each
  flow's page, what changed and what is coming since this browser last saw it. *A digest:* a week's or a month's
  changes as text, an image or a link, as a day's brief is copied today. *A feed:* the build writes the changes and
  what is coming as a feed file beside the app. Naming readers for a change waits on sharing.
- **A history for an auditor** (Q-279): the ontology's changes over a chosen period, each with its kind, its reason,
  who decided, who agreed, what it reached and its own step. A page that prints cleanly, and the same history in the
  audit bag, where the offline check holds it to the signed record.

### 11. The demo, and the slices

**The demo** (Q-272). Larkspur's tour gains one scene: the catalogue's fifteenth control stops at the gate, is declared
with a reason, and the score is cut with its own step. The freeze, the push and the reorg become events in its story,
and the WAF rule shows as coming for the three days between the day it was said and the day it began. The scene's
stops fit the browser regression's budget as it stands (ADR 0025); if they don't, a day is taken out elsewhere. The
days a demo's story holds are test vectors: the scene moves them, and this ADR is that decision.

**The slices,** in the order the maintainer chose (Q-273): first show what is already kept.

1. **The register on screen.** The timeline on the Ontology view, as a list and as lanes, with what is coming; since
   when and by which change on every rule, with its chain; marks on the Month's charts; the Day's context. All over
   the rule changes smaltfl already dates. Nothing a run is judged by changes, so no hash moves.
2. **Reasons, kinds and events.** A kind and a reason on every change, the note, who decided. Events written in the
   app and in a story, on days, lanes and charts. A coming change's trial.
3. **The gate.** Closed lists and closed columns, the pause on what an undeclared arrival reaches and its three
   decisions, waiting for data, what an event excuses. Document format 5, and the five demos brought up to it.
4. **The two doors.** *Add a source* and *Describe*.
5. **Kinds, relations and meanings over time.** The dated edits for types, links, rows entries and dependencies; a
   meaning reworded or redefined; things ended with what follows; the shared ontology's own change sets, followed by
   every flow; the map and the comparison between two dates.
6. **Reading across a change.** Each change's own step, the cuts, the adjusted line, and a declared change taken as the
   new level.
7. **Context that travels.** The three tables in cells, then published with the product.
8. **Who decides.** Owners in the ontology, agreement recorded, the audit holding one to the other.
9. **Who hears, and the auditor.** Since you last looked, the digest, the feed; the history as a page and in the bag.
10. **The demo.** The scene, the events in Larkspur's story, the stops.

Each slice is one branch and one pull request, checked in the browser at every size, and merged before the next.

### 12. What a run names, and what moves

Hashes are exact (ADR 0004), and a new encoding is decided with its test vectors before it is built. This ADR decides
that these exist; each slice that builds one records its encoding and vectors here, under "As built".

| What | Where it goes | When |
| --- | --- | --- |
| A change set's kind, note, decided by, because of, agreed by | Fields of the change set. The rules in force (`rules/1`) are what the edits make, so no run's hash moves | Slice 2 |
| Events | The flow's document, or the estate's ontology for one the estate's flows share (Q-283). Kept apart from the flow as shipped, as change sets are, so the runs of one flow stay one flow's | Slice 2 |
| What an event excuses | Named by the run only where an event excuses something on its day, so every other run hashes as before | Slice 3 |
| Closed lists and columns, undeclared arrivals | The ontology; the plan (a new plan version, only for a flow that declares one); the manifest's node; a hold of its own kind; the decision in the record | Slice 3 |
| Document format 5 | `smaltfl: 5`: every column described or set aside, a kind on every change | Slice 3 |
| Dated kinds, relations and meanings | New edits of a change set. They change what the ontology in force is on a day, so the rules in force gain a version | Slice 5 |
| The estate's change sets | The estate's ontology document, whose hash gains a version (`estate/0` today) | Slice 5 |
| A change's own step | The record: an entry beside the change, from the two runs of its first day | Slice 6 |
| The context tables | Outputs of the run, hashed like any dataset | Slice 7 |
| Owners and agreement | The ontology; the change set; the audit | Slice 8 |

## As built

### Slice 1: the register on screen (2026-11-18)

Built over the rule changes smaltfl already dates (ADR 0021 §5). Nothing a run is judged by changes, no document
changes, and no hash moves.

- **The core,** `src/core/register.ts`, pure and outside what the data's cache is keyed by. `subjectOf` says what an
  edit is about, as one key for every edit of the same thing, with the lane it is drawn in: what we check (a rule, a
  check's mode, a band) or what there is and what it means (a name, a column read under another name, a column's
  values, a key). `registerOf` makes every change set known at a moment an entry: what each edit did in words, as known
  when it was made; its tense for the day read from (coming, in force, ended); how it was said (ahead of its first day,
  on it, or after it, back-dated); what is coming on top, then newest first. `livesOf` turns the entries into rows, one
  a thing, with the spans of what applied to it over a run of days. `sinceOf` gives the change a thing has stood by
  since, on a day. `comingOn` gives the changes that were coming on a day. `test/register.test.ts`.
- **The drawing,** in `src/app/viz.ts`: `registerLanes`, each row one thing's life (a dashed outline as shipped, a bar in
  force, hatched while coming, a ring on the day a change was said, a dashed line under a back-dated change over the
  days whose runs were judged without it, a diamond a day decided, a filled one a day kept back or restated, today a
  line, the day on screen a wash), and `scoreTrend`'s `marks`.
- **The Ontology view's head** (`registerPart`, in `renderRulesTime`): the change sets as a list, what is coming on
  top, then by month, each with its days and how it was said, what it did, why and by whom, where it stands for the
  day on screen, and the days it reached that had already run. From 820 px the same entries are lanes above the list.
  A bar or a ring opens its entry (`openChange`). It is read as known at the moment the month is read at, so as known
  on Fri Mar 15 the WAF's band is coming and the correction of Mon 25 isn't listed.
- **Since when, by which change,** on a rule's line of the Ontology page (`sinceLink`, `ruleSubjectKeys`): a rule
  people set, a band, a column's values and a file's key say it where a change set made them, and open the change.
- **The day's head** says what was on its way that day (`rulesLine`, `comingOn`): *coming Mon 18*, or *said this day,
  from Mon 18* where the change was said after the day's own run.
- **The month's score** is marked where the rules changed (`changeMarks`), each change named under the chart as a
  link to its entry.
- **Checked:** `npm run check`, 108 files and 1,524 tests. In the browser, on Larkspur and the sign-ins: the sets
  `versions` (five new stops), `follow` (one), `restate` and `rules`, each replayed on a phone and its layout checked
  at tablet, tablet sideways, desktop and wide. The new stops sit beside days their sets already open, so the
  regression's budget is as it was.

**What it leaves.** The chain behind a change stops at the change itself: who, when, why, the days it reached. The
event and the decision that led to it are linked in slice 2. A check's mode set on a gate (`setCheck`) is in the
register and the lanes; its line on a card's Quality tab doesn't say since when yet. The lanes carry no filter. A
rule's "since" line is as known when the Ontology view was drawn: picking another moment in *As known on* redraws the
head, and the rule lines follow at the next visit.

### Slice 2: reasons, kinds and events (2026-11-18)

No run is judged by anything here, and no hash a run names moves. A change set made from now on carries more, so the
hash of a kept document that holds one is its own.

- **A change set says more** (`document.ts`): `kind` (`CHANGE_KINDS`: business, retuned, corrected, source, and
  `described` for a first description), `note` (`ChangeNote`: saw, chose, turnedDown, expect, lookAgain, link),
  `decided` (by, on) and `because` (an event, or a decision by its number). Each is optional in the document and checked
  where it is there; a change set from before has none, and is shown as "kind not given".
- **A kind and a reason on every change** (Q-256). `editRules` asks for both wherever its caller gave no reason: a sheet
  (`askWhy`, `whyFields`) with the four kinds, the one the edit usually is picked (`defaultKind` in `register.ts`: a
  column read under a new name is the source changing, an accepted band a setting re-tuned, values and a key declared
  from the data a first description, a version taken whole a correction, anything else the business changing), one
  line of why, and, folded, who decided and when, what led to it, and the note. Closed without an answer, the change
  isn't made. A switch on a card's Rules tab, a check's mode, a rule set or removed on the Ontology page all ask now.
- **Events** (`src/core/events.ts`, pure): `FlowEvent` (a span of days, both in; a kind: reorg, freeze, migration,
  incident, campaign, other; the datasets it is about, or the whole flow; a note; who wrote it and when),
  `eventsProblems`, `latestEvents` (as known at a moment: written again under its id an event is changed, or taken
  back), `eventsOn`, `eventTense`, `eventDay`. A story lists its events (`StoryFile.events`, checked by
  `storyProblems`), the build ships them in the data list (`loads.json` `events`, `DataList.events`), and the owner
  writes one in the app (`eventForm`, `writeEvent`: an entry of kind `event` in the record). They are context only:
  nothing a run reads.
- **On screen:** the register lists events among the changes (`registerPart`), each change with its kind and the
  kind's own mark (`kindMark` in viz.ts: a filled diamond, an open one, a ring with a dot, a square), who decided, what
  led to it (a link to the event), the thinking, and a day to look again once it has come. The lanes gain *Going on*,
  a bar an event, and each change's bar begins with its kind's mark. The day's head says what was going on, with which
  day of it this is (`eventsLine`). The month's score is banded over each event's days (`scoreTrend`'s `bands`) and
  names them under the chart.
- **A coming change's trial** (Q-259): the register offers *Try it on the days before it* (`testChange`, the test of
  ADR 0026 §7), and says what it found on the change's entry.
- **Larkspur's story** gives its two changes a kind, who decided and what led to them, and five events: the
  remediation push, the reorganisation and its handover, the WAF's day in monitor mode, the scanner's weekend without
  its login, and the quarter-end freeze.

**What it leaves.** A decision can't point at an event yet: that comes with the gate's decisions in slice 3. The
forms that already ask for a reason (accepting a proposal, accepting a band from a decision, reading a column under a
new name, making a what-if the day's) record the kind their edit usually is, without offering the four. Q-283 is
settled as built, not as proposed: events live in the story and the record, beside the document, so that no flow's
hash moves when one is written.

## Consequences

- **A flow can stop for a reason it never could:** the data is ahead of the ontology. That is the point of the gate,
  and it will happen on the day a source adds a status nobody listed. The pause is narrow (what the arrival reaches),
  the form is filled in from the file, and "publish without it" keeps the business running.
- **Describing comes before reading.** Adding a file takes a few minutes more than pointing at it. The proposals from
  the data carry most of the work.
- **A change costs a reason.** Every edit to a rule asks for a kind and a line of why. The accept, rename and
  proposal forms ask already.
- **More runs.** A change of kind *the business changed* is run both ways on its first day, and a coming change is
  tried on recorded days. Each is one more run a day, in the recorder and in the browser regression's budget.
- **Every demo's data is made again** when format 5 lands, since its documents change.
- **smaltfl would be first** in reading a past day under the definitions of that day with the reason attached, by the
  research. There is no convention to lean on, so the answer keys and the browser regression carry the proof.

## Not built, and why

- **How steps compute, over time** (Q-250). A step's change applies to every day, and nothing lists the flow's
  versions by date. The maintainer left it out for now. Each run already names the flow it ran under, so the list can
  be drawn later without a new hash.
- **The calendar and contracts as dated changes** (Q-250). Left out for now.
- **A third clock** (Q-258). Decided by and decided on are fields, not a timeline.
- **A graph that plays** (Q-269), and recomputing the whole history under today's ontology (Q-260). A new control has
  no evidence for the days before it existed. The step is measured on the day of the change instead.
- **Both ways for a month after a change** (Q-261). The first day and the trial days are run both ways.
- **Named readers for a change, and a change passed between browsers as a signed proposal** (Q-276, Q-278). Both wait
  on sharing (Q-35).
- **Events suggested by the app** (Q-249). People write them.

## The choices the answers leave open

Proposed here, for the maintainers to confirm as each is built:

- **Q-280:** *as known on* moves to any moment something was recorded, not only a day's end, is part of a link, and is
  asked as one question: with later corrections, or as it was known then.
- **Q-281:** a change is in force from its first day to its last, both in, as `until` is today. Dates on screen say
  "from" and "until"; no end is shown without making clear that day is in.
- **Q-282:** identity. Types and links have ids already, and a column is known by its name and the datasets it is
  about. A rename is a label and a redefinition keeps the thing, so no new ids are added. What follows a thing is
  named by id.
- **Q-283:** events live beside the flow's document: in its story, which the build ships with the data list, and in the
  record, where one written in the app is kept. Built so in slice 2, so that no flow's hash moves when an event is
  written (the proposal was the flow's document, or the estate's ontology).
- **Q-284:** a chart is cut only where a change of kind *the business changed* has a step of its own on that series. A
  change that moved nothing there is a mark.
- **Q-285:** a closed list's accepted entries are kept in the ontology with the columns that define them, and the
  first description of an existing list is taken from its file as it stands, as the start of its history.

## The questions

Asked through the question prompt, 2026-11-18, in seven rounds, each with its recommendation first
(docs/OPEN_QUESTIONS.md). Marked: *own* where the maintainer wrote or steered the answer, *other* where the answer
differs from the recommendation, *added* where the maintainer added it to the plan.

- **Q-247** (*own*): the ontology is the business's rules, meanings and kinds of things; data that changes is data.
- **Q-248** (*own*): ontology first; a source is created with its description, through either door.
- **Q-249:** events are dated context, written by people.
- **Q-250:** beyond rules, kinds and relations and the shared ontology carry dates; steps, the calendar and contracts
  don't for now.
- **Q-251:** a meaning is reworded or redefined; only a redefinition is dated.
- **Q-252:** declared first: a new source, a new entry in a closed list, a new value of a closed column, a new column.
- **Q-253** (*other*): an undeclared arrival pauses what it reaches.
- **Q-254:** enough before a file is read: what a row is, its key, every column described or set aside.
- **Q-255:** described before its data exists: in force, shown as waiting for data.
- **Q-256:** a reason and a kind on every change, both required.
- **Q-257:** the thinking: one line, and an optional note in four parts.
- **Q-258:** decided by and on, optional; no third clock.
- **Q-259:** a change said ahead shows as coming, with what it would have done.
- **Q-260:** charts show the published line, cut where the business changed.
- **Q-261:** each change keeps its own step, from its first day run both ways.
- **Q-262:** context is readable in the app, in cells and published with the product.
- **Q-263:** a declared change is the new level for the checks, accepted ahead.
- **Q-264:** a thing ends from a day, with what follows it.
- **Q-265:** every flow follows the shared ontology from a change's date, with a trial in each.
- **Q-266:** a closed list's changed entry is guarded for the columns that define it.
- **Q-267** (*other*): an event can say what it excuses.
- **Q-268:** the main picture: a list on a phone, lanes when wide.
- **Q-269:** the map of kinds and relations, between two dates.
- **Q-270:** inside the views we have.
- **Q-271:** an event excuses what is learned, never a written rule; excused days are set aside; a late event excuses
  only days not yet run.
- **Q-272:** the demo: one new scene on Larkspur's tour, and events in its story.
- **Q-273:** first show what is already kept.
- **Q-274:** every flow, from the next document format; the demos brought up to it.
- **Q-275** (*added*): telling people, who may change it, and a history for an auditor are in the plan.
- **Q-276:** roles named now, binding with sharing.
- **Q-277:** agreement where the business changed, and where something ends.
- **Q-278:** telling people: since you last looked, a digest, a feed.
- **Q-279:** for an auditor: a page to print, and in the audit bag.
