# ADR 0027: The ontology over time

- **Status:** accepted, 2026-11-18: the maintainer's answers to Q-247 to Q-279, asked through the question prompt in
  seven rounds once the research was in. It is built in the slices of §11: the first four are (§"As built"). The
  choices the answers leave open are proposed here (Q-280 to Q-285), for the maintainers to confirm as each is built,
  and those a slice made as it was built after them (Q-286 to Q-291, slice 3; Q-292 to Q-296, slice 4).
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

### Slice 3: the gate, what an event excuses, document format 5 (2026-11-18)

Built in three parts. No hash tag gains a version: each new field is written only where a flow uses it, so every plan,
manifest and claim of a flow that closes nothing and is excused by nothing hashes as it did. A build that doesn't read
one of them refuses the plan (`validatePlan` refuses a publish field it doesn't know), which is what a new version
would have been for. The rules in force (`rules/1`) hash a closed list as they hash any rule, as written: for the
ontology `{ objectTypes: [], linkTypes: [], actionTypes: [], rules: [{ id: control_id_closed, file: controls, column:
control_id, kind: closed, defines: [weight], entries: [[mfa, 3], [tls, 2]], leftOut: [sbom], action: hold }], aside: {
controls: [notes] } }`, no gates and no switches, the hash is
`0be5a5742f2df02badfde63045002a7362baf50f86f60ca86b77a824ed0729bd` (`test/closed.test.ts`).

**A closed list or column** (§4) is a rule of the ontology (`src/core/rules.ts`, kind `closed`): the file, its key
column, the columns that define an entry (`defines`; none for a closed column, whose entries are its values), the
entries the ontology has accepted, each as the file writes it, and the keys left out (`leftOut`). It always holds.
The check step that reads the file enforces it, as it does every rule people set:

- `emitRuleCheck` writes it for the engine: a row's entry is one the ontology has, its key and each defining column as
  declared (a blank is `''`). A blank key is no entry. A reworded name passes: only the defining columns are the
  ontology's.
- The plan names it (`publish.closed`, `ClosedPlan`: the rule, its key, its defining columns, the keys the ontology
  has) by the check step's node, only where a flow declares one.
- **The run names what arrived** (`countClosed`, `ManifestNode.closed`, `ClosedCounts`): each entry the ontology
  doesn't have, the rows that carry it, and whether its key is one the ontology has with other defining values (an
  entry *changed*, else *new*); twenty at most, the rest counted. Verify names them again (its `closed` check).
- **The hold says it** (`undeclaredSaid`, `Hold.undeclared`): *not in the ontology: control_id sbom (1 row)*, *not as
  the ontology has it: control_id tls (1 row)*. It is a hold under the checks, as a file whose columns changed is, and
  it reaches what the check step reaches: under `reach: downstream`, what is built from the file. What it doesn't feed
  publishes.
- A flow that holds nothing stops on it: the ontology comes first there too.

**The three decisions** (Q-253) are on the day's head (`gatePart` in the app: *At the gate*), each arrival with what
defines it or what differs, its rows and what waits:

- **Declare it** is the edit `declareEntry` (an entry new, or changed under its key), a dated change set from the day
  with a kind and a reason (the business changed, unless its author says otherwise). The days recorded from that day
  run again under it and one restatement decides them, as a column read under its new name is decided (ADR 0022 §2).
- **Publish without it** is the edit `leaveOut`: the key's rows are kept out of what goes on from the day until the
  entry is declared, by a rule of the check step that no person writes (`aside`, named `<rule>_left_out`). They are
  counted by that rule and not among the rows the rules dropped, so a step's limit on dropped rows isn't spent by a
  decision. Every day says what is left out, how many rows, since when and why, with *Declare it ›*, which reads the
  entry from the rows left out.
- **Don't publish** is the decision sheet's. There, *Publish as is* is off for a day at the gate: what the ontology
  doesn't have isn't published as it came.

Each edit is an entry's own (`declareEntry`, `leaveOut` in `RuleEdit`), not the rule sent whole, so two declarations
recorded in either order both stand. The register gives an entry a row of *What there is* from the day it was first
named (`subjectOf`, `livesOf`), and a new lane, *What stopped at the gate*, marks each day a run stopped (`gateMarks`,
an upright bar). The Ontology page lists a closed rule's entries with since when each (`closedEntries`), closes a
column on the values typed and a list on the entries the load on screen has (`entriesOnScreen`, five hundred at
most), and declares an entry ahead of its data.

**Waiting for data** (Q-255): an entry of a closed list the ontology has that no row of the file carries. The run
names it (`ClosedCounts.waiting`), the day's head and the Ontology page say so, and nothing is held. A closed column's
values needn't all occur, so only a list's entries wait.

**What an event excuses** (§6, `src/core/events.ts`): `Excuse` (a dataset the event is about, a check, a column where
the check is of columns), `EXCUSABLE` (the amount, a column's shares, pairs, blanks, a shape: the checks learned from
the history as series of their own), `excusesFor` (every excuse of an event about a dataset that began on or before a
day, as known at a moment).

- The judge tells a finding an event going on excuses as expected (`excusedBy` in `news.ts`: a note with the event,
  `Finding.excused`); a value the ontology marks bad is never excused, nor any finding of a written check. A day
  whose loud findings are all excused is said by its event: *As expected: Scanner agents reinstalled on eks-prod-4*.
- The days an event covered are set aside from what the series its check reads learn from (`Aside`, `asideOn` in
  `history.ts`; `asideBefore` in `hold.ts`), never the day being judged.
- **A claim names what it was excused by** (`StoryClaim2.excuses`, `ClaimExcuse`), only where an event excuses
  something of its source. The engine tells a watched step's claim under what the page says (`TellFor.excuses`).
- **An event written after a run excuses nothing of it.** A run is told under the events known when its day's files
  first ran; a day run again under rules changed since keeps those. The recorder writes a story's events into the
  record when they were written (`timelineOf`'s `event`), and the offline audit holds each claim's excuses to the
  events written down before it (`retell.ts`).
- In the app the event's form says what it excuses, the day's head and the register say it, and a finding told as
  expected says by which event. The day picked on the month says it apart from what was found (*What an event
  explains*: `expectedOf` in `overview.ts`, the app's `dayExpected`): it is no finding, so the day's mark, the counts
  and the rows of days read it as the normal day it was.

**Document format 5** (§4, Q-274; `src/core/described.ts`): a notebook flow that puts the ontology first.
`validateDocument` asks of it that every source says what one row is (a rows entry, a type whose objects are its
rows, or a noun), that every change set says its kind and why, and that a closed list has the check step that
enforces it. A document doesn't hold its sources' columns, so *every column described or set aside* is asked where
they are known (`undescribed`): the build refuses a format-5 flow with a declared column the ontology doesn't
describe, and the Ontology view says what a flow still lacks, or what a format-4 flow would be asked. **Set aside**
(`ontology.aside`, `setAside`) names the columns a file has that the flow doesn't take: such a column isn't one its
source declares, so no step reads it, and a new column in a file is settled either way on the day's head. Every
example flow is format 5 but the controls posture (ADR 0013), which says what it would lack.

**The demos.** Larkspur's control catalogue is a closed list of its fourteen controls. On Wed 27 the fifteenth stops
the posture product at the gate, and the story declares it that morning: the month's answer key moves there, and
this ADR is that decision (§11). The story also plans the scanner agents' reinstall of Sat 9 as an event that excuses
the findings' mix of statuses, so that day is told as expected. The sign-ins' Method is a closed column, and its
month runs three days longer: magic links arrive on Sat 23 and codes by text message on Sun 24, which is where the
browser regression exercises the three decisions (`tools/browser/stops/gate.json`, nine runs of half a second).

**A day a restatement publishes** (a day held at the gate, declared and run again) is the day readers see from then
(`latestGot` in `hold.ts`), and the recorder marks its posture. Before, only a passing run or a release counted, so
the days after such a day said readers were on an older one. It is learned from too (`restatedGot` in `skipOf`): the
history takes it as it takes a day passed by a later run of the same files, from the restatement on, unless the run
restated still holds the file the pause was about (a decision carried publishes such a day, and its file is as it
was). Before, its pause stood open for good and the days after learned nothing from it (Q-291).

**What it leaves.**

- **No plan version** (Q-286). §12 said a new one; the plan's format number says how its watches are judged, with
  gates or without, and a list is closed by flows of both kinds.
- **A missing entry waits, and isn't paused** (Q-287). §4 named a missing entry beside a new one. A rule reads one
  day's file, and can't tell *not yet* from *no longer*; the ontology ahead of the data is allowed (Q-255), so both
  read as waiting for data. Ending an entry is slice 5's.
- **What may be excused** (Q-288) is the five checks above. The forest, the classifier and the hours of a day learn
  from whole days, not a series, and aren't excused.
- **Waiting for evidence.** Q-255's example is a control with no evidence feed. That is the posture product's own
  coverage column, which says so today. The gate knows a list's own file.
- **The lanes** don't draw a waiting entry dotted, and the register doesn't show a key left out as open until it is
  declared.
- **A format-4 flow isn't brought up in the app.** The Ontology view says what it would be asked; saving it as
  format 5 comes with the two doors (slice 4).
- **The engine's names don't move on a restatement** (ADR 0021 §5, as built there). The record says which day
  readers got; a day declared at the gate is drawn from its own run.
- A decision on the sheet still can't point at an event. A declaration at the gate can.

### Slice 4: the two doors (2026-11-18)

A source and its description are made together, through either door (§5). No hash tag gains a version: a
description written ahead is a field of the ontology, written only where a flow has one, and the rules in force
(`rules/1`) hash it as they hash the rest of the ontology. For the ontology `{ objectTypes: [], linkTypes: [],
actionTypes: [], awaited: [{ id: sbom_inventory, name: SBOM inventory, row: { one: component list, many: component
lists }, key: [app_id], columns: [{ column: app_id, description: The application it is of }] }] }`, no gates and no
switches, the hash is `330a5021ffbb273c8c0b49b3f37003ec327340169a28a9e9eeb13fa4714576f4` (`test/described.test.ts`).

**Here is the data** (`src/core/newsource.ts`, pure, outside what the data's cache is keyed by). Above the canvas,
*Add a source ›* opens the two doors. A CSV file picked is read whole in the browser and sent nowhere (`readFile`):
its columns as the file names them, each typed from every value it has (whole numbers, numbers, text; a number
written with leading zeros is a code), with its blanks, how many values differ and the commonest. Its description
is proposed from that (`proposeSource`): the dataset named after the file, one row named after the dataset, and the
key the first column that tells every row apart, an id before a code. Nothing is described for the person.

- **Three things are confirmed** before any step may read it (Q-254; `sourceProblems`): what one row is, by which
  key, and every column either described or set aside. A column the ontology has a meaning for already needs no
  words. The form counts down what is left, says how many rows share their key with a row before them, and writes
  nothing until nothing is left, and a reason is given.
- **It is written as cells** (`withSource`), as a join made in the app is (ADR 0026 §10): in `sources.nb.ts`, a
  notebook of the flow's own, the source's cell, a check step that asks every row for its key and warns of one
  without, and that step published. In the ontology: what one row is (a kind of thing of its own; in a flow with
  gates, a rows entry of a kind the ontology has, by the one column that holds its key), its noun, each column's
  meaning as the file's own, and the columns set aside. A meaning an estate shares stays the estate's: the file's
  own entry is written only to read the column under the file's other name, marked as the override it is.
- **The file is kept in the browser** (`src/app/files.ts`, a database of its own beside the record), by the flow
  and its sha256, and pinned in the engine as every file is: the engine hashes it again, the run records it, and
  the source's sheet says who added it. The flow as kept is restored with its sources and their files; where a
  file isn't in the browser any more, what was kept of the flow is dropped and the page says so.
- **It is taken off again** from the same sheet where no step but its own check reads it, and a source whose own
  step stops its first run is taken off at once. The record keeps both.

**Describe it first** (Q-255). A dataset the business needs is described before any file exists:
`ontology.awaited`, each entry its name, what one row is, its key and its columns, each with what it holds. It is
written by a dated edit, `describeAhead`, in a change set with a kind (a first description, unless its author says
otherwise) and a reason, so it is in force from its day and is a row of the register from then. It **waits for
data** until a source of its name is in the flow: the Ontology view lists it under *Described ahead of their data*,
with since when, its columns and *Bind a file ›*.

- **Binding a file** maps the file's columns onto the described ones (`matchAwaited`): the column of the same name,
  else the one whose name is close, which a person confirms (*a close name: confirm it*). A column under another
  name is read as the described one, as a renamed column is (ADR 0022 §2). A described column the file has nothing
  for stops the binding; the file's other columns are described or set aside as any are. The source is then added
  as above, under the described name.
- **The description stays** once its data is there: described from one day, evidenced from another, both on
  screen.
- Larkspur's story describes the SBOM inventory ahead, in the decision that declares the fifteenth control: the
  feed the control will be evidenced by, from Wed 27, waiting for data.

**A flow in an older format is brought up in the app** (Q-274, left by slice 3). For its owner the Ontology view's
first line says what format 5 would ask, with the way to say it: what one row of a file is (its noun, `withRowSaid`),
each column on its card. Once nothing is asked, *Save it as format 5 ›* does, recorded as a change of the flow.

**Mended on the way.** A flow that reads flows or imports an estate's ontology lost its own columns set aside when
it was read (`mergeOntologies` carried a list of parts, and slice 3 had added one without it); it carries them
now, and the datasets described ahead. The day's head listed a column the ontology sets aside as a new column
every day; it is no news now. The tour (`tools/browser/tour.cjs`) taps and types after a file was chosen (`then`),
and waits for what the file opens.

**What it leaves.**

- **An added source isn't judged.** It has no watch, so no history and no learned check: its check step warns of a
  row without a key, and that is all. Setting a watch from the app comes with the checks that need a history.
- **One file for every day.** A source added here is a fixed file, read again on each day's run, not a daily feed
  with its own days; a CSV file with a header, in UTF-8, 64 MB at most.
- **The file is the browser's.** It isn't in the audit bag, and a run can't be re-derived after its source was
  taken off: its file check fails, which is true.
- **Adding a source isn't a dated change** (Q-292). It is the flow as kept, for every day run from then, as a join
  or a flow added from the catalogue is; the record keeps it with its reason, and it isn't a row of the register.
- **A description written ahead isn't ended or reworded from the app.** The edit replaces an earlier description
  of the same dataset; ending one is slice 5's.
- **The estate's ontology carries none.** A dataset is described ahead by a flow.
- **A kind the ontology has** is offered only in a flow with gates, which is where a rows entry is kept (ADR 0015).
- **Bringing a flow up** was checked by hand on the controls posture: no demo of the regression is format 4. A
  change set made before kinds were asked for can't be given one in the app.
- **The lanes** draw a described dataset as any thing: not dotted while it waits.

### Slice 5: kinds, relations and meanings over time (2026-11-18)

What there is, and what it means, change by dated changes with reasons, as the rules do (§3). §12 expected the rules
in force and the estate's hash each to gain a version here. Neither did, as with slices 3 and 4: no encoding
changed. The rules in force (`rules/1`) hash the ontology whole, so a kind, a relation, a meaning and the record of
what ended are in it as written; an estate's ontology (`estate/0`) is hashed whole, its own change sets with it; and
a document that has none of them hashes as it did, so every vector stands (Q-297, the maintainers' to confirm). For
the ontology `{ objectTypes: [{ id: application, name: Application, dataset: apps, key: [app_id], title: name }],
linkTypes: [], actionTypes: [], ended: [{ what: link, id: led_by, then: { how: replaced, by: [acted_for_by] } }] }`,
no gates and no switches, the hash is `cf08339f9fc9aa7ed5592c5e58ab57f13b1ff0a0fee262ea42ee4e5b8ab411b6`
(`test/kinds.test.ts`).

**Six dated edits** (`document.ts` `RuleEdit`, replayed by `inforce.ts` through `flowedit.ts`): `setType` (a kind of
thing: its name, the dataset whose rows are one each, its key, the column people call one by), `setLink` (a relation
between two kinds, on the columns that match), `setRows` (what one row of a dataset is: a kind, by which column, for
the ones a condition selects), `setNeeds` (a dependency between columns), `redefine` (what a column means, for the
datasets it is said for) and `end`. Each says what it did in words (*Added the kind Business unit: one row of
by_unit, by business_unit*; *Changed the kind Application: its key app_id → app_id and env*). An edit that would
leave a document the flow can't be read as changes nothing and says nothing, so a change set written for one flow
passes over another that hasn't the datasets it is about.

**Nothing is deleted** (Q-264). `end` takes a thing out of force from its day and writes that it ended in
`ontology.ended`: what it was, and what follows it, *replaced by* one, *merged into* one or *split into* two or
more, each of its own sort and in force. A kind ends once no relation and no rows entry names it and its file still
says what one row is. An entry of a closed list or column leaves its rule, so a row that carries it stops at the
gate from then, and the gate says the ontology ended it, with what follows. What a row is, a dependency, and a
dataset described ahead that still waits for its data end with nothing after them; one that has its data stays, the
record of what was asked for. Set, declared or described again, a thing is one again and the record that it ended
goes. A format-5 document holds each ended thing once, and never one that is in force too.

**A meaning is reworded or redefined** (Q-251). The names form on a column's card asks which it is, once what the
column means or a value's label is edited. *Reworded* is saved as before: at once, for every day, the record keeping
the old wording. *Redefined* is a dated change with its kind and its reason: one `redefine` for each meaning the
ontology keeps for the column in the file and in the datasets that pass it on (`redefineEdits`), so a meaning shared
by several datasets is redefined for all of them, and the form says where it reaches. Its name stays a label and is
saved at once. The card says since when it has meant what it says, and what it will mean from when where a
redefinition is still to come. A column an estate describes isn't offered the choice: the estate redefines it, in
its own change sets, and a flow's own handling of it changes at once with its reason, as ADR 0026 §8 left it.

**The shared ontology has its own change sets** (Q-265). An estate's ontology document carries `changes`, each a
change set of the six edits above but never a flow's rules, a closed list's entry or a dataset described ahead
(`ESTATE_OPS`). Reading a flow brings them in before the flow's own, each marked with the estate's name
(`ChangeSet.estate`), and every flow that imports the estate follows from the change's first day, each taking what
applies to it. A change set of the estate's and one of the flow's under one name are refused. The estate's hash
moves with a change set, and with it every importing flow's. On the register the entry says whose it is, and a flow
tries it on its own recorded days as it tries any change that is coming. Larkspur's estate says one: from Mon 11,
the Monday of the reorganisation, *Acted for by* is a relation of its own between an organisational unit and a
person, said on Fri 8 by the security lead.

**On the Ontology view** (`kindsPart`), under the versions of the rules:

- **The map first** (Q-269; `ontologyMap`, `kindsMap`): a box a kind of thing, a line a relation, in the ontology's
  order. Between the two dates compared, only what differs is marked, by a sign as well as a colour: `+` new, `×`
  ended, `~` changed, hatched where it is still to come.
- **Two dates compared** (`datedDiff`): any two days, the first day against the day on screen unless others are
  picked, as known at the moment the view reads at; a change's first day is offered where it lies ahead of the
  month. Each line is one thing, before and after, with the change that made it: its kind's mark and its day, a tap
  from the change. A closed list says the entries that were declared or are no longer in it, not the whole rule
  twice.
- **Each kind and relation** behind a bar, open or shut as the reader left it: what it is, since when and by which
  change, whose it is where an estate says it, and, where a change is recorded for a later day, the day it begins or
  ends. The owner changes or ends one that is the flow's own, and adds a kind or a relation; the forms name what is
  still to come as well as what is in force, so a relation may be added between a kind that begins the same day.
- **What a row is, and a dependency**, on the file's own checks: *Change* and *End* on the line of one the ontology
  writes, *Say what a row is ›* and *Add a dependency ›* under them, in a flow with gates. Each line says since when.
- **A closed list's entries** each have *End ›*, and the ones that ended are listed with what follows them.
- **A dataset described ahead** that still waits is described again or ended from its line (slice 4 left both here).

Every one of these is `editRules`'s: a change set from the day *Edits take effect from* says, with a kind and a
reason. An edit about a thing still to come changes nothing on the day on screen, so it is checked on its own first
day, under the rules as known now.

**Mended on the way.** The build's recorder judged a fill's donor under the rules of the donor's own day, and the
derived run under the rules of the day it fills: the two were one flow only while no rule changed between them. The
estate's relation begins on Mon 11, the day the tour fills the backups from Sun 10, and the fill was refused (*the
claim was told under another flow than the run's*). The donor is judged under the rules of the day it fills, as the
page has always told it. A tick box or a radio in a form was sized as a text field wherever no rule said otherwise.

**What it leaves.**

- **Charts aren't marked or joined.** A redefinition is on the register and on the card; the charts built on the
  column aren't marked from its day, and a series isn't followed through to what replaced it. Both are slice 6's.
- **An estate's ontology is changed in its file.** The app shows an estate's change sets, says whose they are and
  tries them; it writes none, and changes no kind, relation, rows entry or dependency an estate says.
- **The forms are plain.** A condition is columns and their values, joined by *and*. A dependency read across two
  datasets keeps its other side as written. What a row is and a dependency are edited on a file, not on a dataset
  the flow makes.
- **No cascade.** A kind that a relation or a rows entry names doesn't end until they do; the form says so.
- **A change still to come isn't taken back.** A later change says otherwise, and both stay on the register.
- **The gate's word for an ended entry** is tested as words (`endedArrivalSaid`); on screen it was checked by hand,
  since no demo's story ends an entry.
- **The map** is a grid in the ontology's order, not laid out by its relations, and shows no rule and no reason.
- **Agreement** where something ends (Q-277) is slice 8's.
- **The lanes** name what follows an ended thing by its id.

### Slice 6: reading across a change (2026-11-18)

A change keeps its own step, a chart is cut where the business changed, and a declared change is the new level for
the checks (§7). No hash moves: a step is a record entry of its own, beside its change, and the run it is measured by
is a what-if, which is no part of the record.

**The step** (Q-261; `src/core/step.ts`, the recorder's `stepOnce`). The first day a change of kind *the business
changed* is in force is run both ways by the build: as it is published, under the rules with the change, and as a
what-if on the same files under the rules as they were, judged by the same history. *As they were* (`asItWas`) is the
flow without the change set and, where the change declares entries of a closed list, with those entries left out for
that day: under an ontology that doesn't have an entry the day stops at the gate, and a held day measures nothing, so
the day is read as it would have gone out, without the arrival (Q-305). The two runs are compared measure by measure
(`stepMeasures`): the product's score, its coverage and the checks behind them, the applications failing each control,
and every output's rows. What differs is the change's own, and the record keeps it as an entry of kind `step`: the
change, the day, the two runs, the measures that moved with both figures, how many were read, what was left out. The
what-if's manifest is kept with the month's, so the day can be read both ways from the two.

Only a change of kind *the business changed* is run both ways (Q-304): its step is what a chart is cut by and what
the checks learn from. A re-tuned setting and a changed source are marks whatever they moved, a first description
changes no day, and a correction has its restatement, which says what each day it reaches comes to. A change
that leaves a flow's rules as they were (an estate's change about what another of its flows has) isn't that flow's to
measure, and has no step there.

**On Larkspur.** The story has three such changes, and the record says of each what it alone did. The relation *Acted
for by* (Mon 11) and the WAF rule's band (Mon 18) moved none of the 56 measures read. The catalogue's fifteenth
control (Wed 27) moved six: coverage by −8.3 points, from 99.1 to 90.8, the checks that apply by +1,994 (19,320 to
21,314), and the rows of four tables with them. It didn't move the score: the new control has no evidence yet, and a
check with no evidence isn't in the score. The score's own fall that week, from 93.1 on Fri 22 to 92.7 on Wed 27, is
the data's.

**Charts** (Q-260, Q-284; `src/core/across.ts` `cutsOf`, `adjusted`; viz.ts `scoreTrend`'s `cuts` and `adjusted`). The
month's trend draws what was published each day, and each of its two lines is cut by the changes that moved it:

- **Cut** on the first day of a change of the business whose own step moved that line: the line isn't joined across
  it, a solid rule stands there, and a flag says the line and the step (*coverage −8.3 by the change*). Under the
  chart, *Where a line is cut* names the change with its figures, a tap from its entry, and says that the two sides
  of a cut aren't one trend. On Larkspur the coverage is cut on Wed 27 and the score isn't.
- **Marked** (the diamonds of slice 1) for every change in force, each now with its own step in words: what it moved
  of the score and the coverage, that it moved neither with how much else it did, or that it moved nothing.
- **With the steps taken out**, on request: each cut line drawn again, dotted, shifted back by the steps of the
  changes that cut it, from the last day before the first cut, beside the published line and labelled as adjusted.
- **Corrected since** lists the days a restatement took back and those published again with another score, each with
  what it first published and a link to the day, where its versions are. The recorder keeps what a day first
  published beside what it publishes later (`PostureMark.first`).
- **An event's band** says what the event excuses.
- **A chart built on a column** is marked from the day the column's meaning was redefined (§3, `redefinedOn`): a
  finding's day by day, and the day's lead cause's, has a diamond on that day and a line that names the change. **A
  value that ended** is followed through (§2, `followedThrough`): under its day by day, what it was replaced by,
  merged into or split into, from which day, and under its successor's, what that carries since.

**The checks** (Q-263). The watched series a change moved are found from the same two runs (`declaredLevels`). Each
watched step is told both ways, and every series its history keeps is read on the day both ways (`seriesIn`,
`toldDay`: its rows, each column's blanks and spread, each coded value's share, each pair's cell). A series is the
change's own where the two runs give it another value, where that value stands outside what the days before give it
under the change, and where nothing was told of it under the rules as they were. A series with the same value both
ways is the day's data, whatever the day's story says of it; so is one the old way told as off, though the change
moved it further. The step's entry keeps them as that dataset's new level from the change's first day, with what the
day's data said the old way.

- **From the day after**, the learned checks on those series learn from the change's first day on, as they do from an
  accepted level (`levelsOf` reads the step's entry; a claim names it as the level it learned from, and the audit
  re-tells the claim with it). On Larkspur, `effective` rose 11% with the new control, and 36 of its series are at a
  new level from Wed 27: its rows, the mix of `status`, `reason` and `raw_status`, the blanks of four columns, and
  how those columns go together. Thu 28 to Sun 31 are judged from there, and are calm. No other watched dataset has a
  level from it, and the other two changes gave none.
- **The first day** is judged the old way. Its run under the change says what the change moved, and the record keeps
  that as told; the month reads the dataset's day as the run as it was judged it (`asDeclared`), for the runs of the
  day on the files the step was measured on. So the change's own step is no finding of its first day: the day picked
  lists it under *What a declared change accounts for*, a tap from the change, and trouble the old way saw too stays
  a finding. The dataset's own News says the same first, then what its checks said; on later days it says which
  level its checks learn from, and since when.
- **A file's own finding stays a finding.** The catalogue's mappings file grew with the new control whatever the
  ontology said: it is told unusual both ways, so it is the day's data, and nobody's level until someone accepts it.

**Before it starts** (Q-261). A coming change tried on the recorded days (slice 2's trial) gives the same figures:
each trial day's what-if under the change is compared with what the day published, and the trial says what the change
alone would have moved, on how many of the days, with the last day's figures; or that it would have moved none.

**On the register and the day.** A change's entry says its own step: the day, what the change alone moved (the
trend's lines first, then the measures that moved most), that it didn't move the score where the flow has one, what
was left out as it was, and the series it is the new level of. *The day both ways* opens to the outputs that differ
between the two runs, with their rows each way. The day's head says, on a change's first day, that it was run both
ways and what the change alone moved, a tap from the entry.

**Checked by** `test/step.test.ts` (the rules as they were, the two runs compared, the series a change moved, a first
day read the old way, a trial's figures, a redefinition's mark, a value followed through, and a day run both ways
through the engine), `test/viz.test.ts` (the cuts and the adjusted lines), the tour's answer key on the data made
again, and the browser regression on Larkspur: `month` (the cut and the adjusted line, the day picked, the day's head
and `effective`'s News on Wed 27 and Thu 28), `versions` (each entry's step) and `follow` (the day's head on the WAF
band's first day, a trial's figures). The month set opens one more day for it, Wed 27: in all 35 sets, 243 runs,
1,315 of the 1,330 engine seconds.

**Found on the way, and left.** The brief of a day a restatement published still says its outputs wait: the run on
screen is the restated run, which the browser's engine holds until it is released, and a restatement moves no name
there (ADR 0021 §5). The day's head and the month say it was published.

**What it leaves.**

- **A change made in the app isn't run both ways.** The build measures a recorded change; one made here has no step,
  so no cut and no level, and its entry says so, with how to see the day as it was (*What if… ›* under the rules
  before it). Measuring it is one more run a change, which the browser regression's budget would pay on every stop
  that makes one (Q-311).
- **A first day held by its own change's step waits for a person.** The step names what is the change's own, and
  *Publish as is* or *Accept* is one tap; the declaration isn't yet taken as that decision. No demo holds on one.
- **A later day held at a declared level** waits for a person too: only an Accept carries to a later day.
- **The audit doesn't re-derive a step.** It holds every claim to the level it names; it doesn't run the day as it
  was again.
- **Only the month's trend is cut.** The posture dashboard's own trends and a unit's sparkline aren't; a finding's
  day by day is marked for a redefinition, not cut; a value followed through is said in words, and the two series
  aren't drawn as one line.
- **A trial's figures** read the product's score and coverage only on a trial day that was published, and not the
  applications failing each control.
- **Nothing in the demos redefines a column or ends a value on a day already run**, so the mark and the
  follow-through are tested as functions and were looked at by hand, on the sign-ins: Method redefined and API keys
  merged into single sign-on from Mon 18, the day single sign-on's records rose 70%. No stop walks it, since each such
  change runs the days it reaches again.
- **The day's status line and the dataset's card** still say what its run was told on a declared change's first day.
  The note under the News's head says whose it is, and the brief's status reads *as declared*.
- **A file's series is never a declared level.** Data that changes with the business is data: it is told, and
  accepted by a person.

### Slice 7: context that travels (2026-11-18)

A slice of data knows its context (§8): three tables any cell can join to, published with the product, and every
card saying what reaches it. §12 said the tables are outputs of the run, hashed like any dataset. They are, and
nothing else is new in what a run names: no plan version, no node kind, no hash tag.

**The three tables** (`src/core/context.ts`). A notebook cell writes `context('changes')`, `context('events')` or
`context('in_force')` (`smaltfl/notebook`), and is a step like any other: a cell after it reads it by its name, and
`publish()` publishes it.

- **changes:** the dated changes in force on the run's day, a row a change and a dataset it reaches: its kind, its
  first and last day, what it did and why in its author's words, when and by whom it was recorded, who decided it and
  when, the event that led to it, the estate whose change it is, and its own step (the day it was run both ways, how
  many measures were read, how many it moved, and each of them as it was and with the change).
- **events:** what was going on that day, a row an event and a dataset it reaches: its name, its kind, its days, which
  day of it this is and of how many, its author's note, and what it excuses of that dataset.
- **in_force:** a row a dataset of the day, a file or a step, with the flow it belongs to, the rules in force by their
  hash, how many changes that version is made of, and the day the latest of them began.

**What reaches a dataset** (`reachOf`): a change or an event is about the files and steps it names, and reaches each
of them (`direct`) and every step built from one, however far and in whichever flow it is read from (`downstream`).
One about no dataset of the flow (a relation, a dataset described ahead, an event about the whole flow) is one row
with no dataset, the flow's (`flow`). A change set none of whose edits applies to a flow (an estate's, about what
another of its flows has) is no change of it, and isn't listed. Only what is in force on the day is the day's
context: a change still to come isn't.

**How a run has them** (Q-312, Q-313). In the document a context table is a SQL step that reads nothing, marked
`context`, whose own statement is the table with no rows: it says the columns, and the flow's hash doesn't move with
the day. The rows are made for the run (`contextRows`) from the flow as kept (its change sets, with their reasons),
the day, the moment the rules are known at, and what the record adds: the events written down and each change's own
step, as known then (`contextKnown`, which the build's recorder and the page both ask, so a day run again in a browser
has the context its recorded run had). `translate` puts them in the plan, as that step's statement and beside it as
rows (`SqlNode.context`), so the run builds, hashes and publishes them as it does any output, and verify recomputes
them. Verify also translates the kept document again with the rows the plan carries: a table whose statement isn't
exactly its rows written out fails the *flow* check. The rows are in each table's column order, the changes as the
rules were resolved, the datasets of each by name, so the same flow gives one plan whatever order its steps are
written in. The types computed ahead for a first day (ADR 0019) are keyed without a context table's rows.

**Published with the product.** Larkspur's Control Posture v1 publishes the three, each under a contract of its own
(`context_changes`, `context_events`, `context_in_force`): the product is thirteen datasets where it was ten, the
estate's plan 95 nodes and 40 outputs where it was 92 and 37.

**A context table is no data of its day** (Q-316, Q-318). It says what a run was read under, so it differs wherever
the rules do, by what it is. Counted as data it would make every day a back-dated change reaches a restated day:
the first data made with the tables had Larkspur's March at 22 restated days where three had moved. So a day run
again under rules changed since is compared with what readers got by its other outputs (`restatedOutcome`'s
`context`, the names from `contextTables`; the recorder, the page and the offline audit ask the same), and a day
whose data is the same is noted, as before: readers keep the version they had, and that version's context tables
say the rules it was made under. The tables are kept out of a change's own step, of a trial's figures and of *the
day both ways* for the same reason, and **Compare** counts the outputs that are data and lists a context table
that differs apart, under *Read under another context*, its rows a tap away like any output's. A run checked
against its record is held to all of them: a day run here has the context its recorded run had, or the page says
it differs.

**A fill's own run** (a derived run, ADR 0009) has the context of its own document, the donor it reads among its
datasets, under the rules its held run had, with the events and the steps known at the moment it was made: the
moment the record has it at, for a fill the record decided, so the page makes the same run and releases it.

**In the app.** Every card's sheet, on the tabs that tell its day, has **Context**: the changes in force that reach
the dataset, each with its kind's mark, the day it began, what it did, through which dataset it reaches this one and
why, a tap from its entry; and the events going on that reach it, each with which day of it this is and what it
excuses here. Those about the flow as a whole are counted, and are on the day's head. It is read as known at the
moment the page reads at, as the day's head reads what was going on (Q-319): an event written down after the
version on screen ran, or a change recorded since, is what a reader of the day needs, and each says so, with a line
that the version's own context tables, made when it ran, haven't it. A context table's own sheet says it is made by
the run and not by a query, and its blanks are no news: a blank is how it says *none* (no last day, no step
measured, not an estate's). **A change marks the charts of what it reaches:** on the month, each
file's and step's row has a dashed rule with a diamond where a change that reaches it began; a day by day chart in a
finding's or a cause's detail, and the amount's, has the diamond on that day and a line that names the change and
what it comes through.

**What it leaves.**

- **The audit doesn't hold a run's context to the record.** The bag carries the plan with the rows, and an auditor
  can read them; `audit.ts` doesn't yet make them again from the flow as kept and the record's events and steps
  (slice 8 holds owners and agreement to the record, and this belongs beside it).
- **Decisions aren't a table.** What was decided of a day comes after its run: it is on the day's head and in the
  record, not in the day's own outputs.
- **One version a run.** A run reads one document, so every dataset of a day has the same rules: `in_force` says
  which, for each, and will differ between datasets only once a flow run on its own is read by another (ADR 0026's
  "Not built").
- **Only Larkspur's product publishes them.** Any notebook flow can write the three cells; the other demos don't.
- **Explore doesn't offer them as joins,** and a context table has no gate and no learned check.
- **Marks, not bands, on a dataset's own charts.** An event is said in the card's Context and drawn as a band on the
  month's trend only; the posture dashboard's sparklines and Explore's cards carry no mark.

### Slice 8: who decides (2026-11-19)

The ontology names who owns each of its parts, a change the business made waits for an owner's agreement, and the
audit holds one to the other (§10, Q-276, Q-277). No hash tag gains a version: an owner named is part of the ontology
it is written in, hashed with it as everything in it is, and a document that names none hashes as it did.

**Owners** (`src/core/agree.ts`, Q-320). An ontology is owned part by part: an estate's shared ontology (`owners` in
its document) and each flow's own (`ontology.owners` in its `flow.json`). An owner is a principal by the id the
flows know them by, with a name where the part's document has no principal to take it from, and their identity
card's fingerprint once it is known. A part that names none is its flow's owner's: the principals its policies mark
as owning the flow, and `owner` in a flow with none. Reading flows together keeps each part's owners with it: a read
flow's on its part of the document (`FlowPart.owners`), an estate's on where it came from (`EstateFrom.owners`),
never merged into the reader's own, and verify's *flows* check holds a part's owners to the flow's own document.
Larkspur's estate and its posture product are the security lead's; each flow it reads is its owner's.

**Which changes ask** (`asksAgreement`, Q-321): one of kind *the business changed*, and one that ends something,
whatever its kind. A setting re-tuned, a mistake corrected, a changed source and a first description need only
their author. What a change touches (`partsOf`) is the estate's ontology for the estate's own change, and else the
own ontology of each flow that has a file or step the change is about, the flow's own where it is about none.

**Agreement is the change set's** (`ChangeSet.agreed`: who, when, and by which card where one signed). A change
that asks is in force once an owner of every part it touches has agreed, **from the moment of the last of those
agreements** (`agreementOf`, `knownFrom`, Q-322). The rules in force on a day as known at a moment are the change
sets known from that moment or before, applied in the order they came to be known (`changesOn`), so one agreed to
late comes after one recorded since. A change that still waits is in force on no day: no run has it, no version of
the rules is made of it, and a version that names it (a trial) applies it last. The story's recorder places a
change where it came to be known (`timelineOf`'s `knownFrom`), and the days it reaches that had already run are run
again as for any change back-dated to them. A document refuses an agreement by someone who owns no part the change
touches (`agreedIssues`), and holds an owner whose card is known to that card.

**One person may hold both roles** (Q-323), until sharing is built (Q-35). Whoever makes a change and owns what it
touches agrees by recording it: the agreement names them, and the register says *one person held both roles*.
Larkspur's story has both cases: the WAF's band and the estate's relation were agreed to by their own authors; the
catalogue's fifteenth control was written down by the flow's owner at 09:10 on Wed 27 and agreed to by the security
lead at 09:15, the moment it is in force from.

**In the app.** The Ontology view's register opens with **Who owns it**: each part with its owners, and the rule
above in words. The form that asks why says, as the kind is picked, whose agreement it asks for: none; the
viewer's own, given by recording it; or someone else's, in which case it will wait. A change that waits is first on
the register under its own heading, with whose agreement it waits for and what it would do; the day's head and a
flow's sheet say it waits, never that it is coming; a thing it would add, change or end says *once agreed to*.
Viewing as an owner of a part it waits for, the entry offers **Agree** (`agreeToChange`): whoever owns the part may
agree, the flow's owner or not, while making changes stays the flow's owner's (Q-325). An agreed change says who
agreed, when and how long after it was recorded. A declaration at the gate is a change like any other: made by
someone who owns what it touches, the day runs again under it at once; made by someone else, it waits, the day
stays stopped, and the gate says whose agreement the declaration waits for in place of offering to declare it
again. `context_changes` carries `agreed_by` and `agreed_at` (its
contract at 1.1.0, Q-326).

**The audit** (`audit.ts`, Q-324). For each flow document the record kept: every agreement is by an owner of what
its change touches, as that document names its owners; and a change set or an agreement that came with an entry of
the record was made by whoever made the entry (and by the card that signed it, where the agreement names one), so
who made a change and who agreed to it are the record's to say. It reports how many change sets asked, how many
have their agreement, how many of those from their own author, and which wait. The change sets a flow had when
the record first saw it are held to the names alone.

**What it leaves.**

- **Cards don't bind yet.** An owner's card is held where the ontology gives one, and no demo gives one: between
  several people's browsers it binds when sharing is built (Q-35), as §10 says.
- **Owners are written in the files.** The app shows who owns each part and doesn't change it.
- **A part, not a rule.** Ownership is of an estate's ontology or a flow's own, never of one dataset or one check.
- **The audit doesn't make each run's rules again** from the flow as kept and the run's moment: a run that had a
  change no owner had agreed to fails verify's rules hash in the engine, and isn't looked for offline. It still
  doesn't hold a run's context tables to the record either (slice 7 left it, Q-313): both need the moment a run's
  rules were known at, which a run's entry doesn't keep.
- **A flow with no policies is `owner`'s.** A flow read under another's policies has none of its own, and its own
  document, read alone, takes `owner` for its owner: it holds an agreement its reader's owner gave only where that
  owner is called `owner`, as every demo's is, or where the flow names its owners itself.
- **An agreement isn't withdrawn.** A later change says otherwise, and both stay on the register.
- **A trial of a waiting change** runs under its rules and has it in no context table: the tables are the changes
  in force.
- **Events ask for no agreement:** they are context a person wrote down, and change nothing a run is judged by
  but what they excuse.
- **The story's agreements have no entry of their own** in the month the build records: they are the flow's as
  shipped, on its change sets.

### Slice 9: who hears, and the auditor (2026-11-19)

The ontology's changes and what was going on are told once, and read four ways: what is new since someone last
looked, a period's digest to pass on, a feed the site publishes, and a history for an auditor, on a page that prints
and in the audit bag (§10, Q-278, Q-279). Nothing a run is judged by changes, so no hash moves and no data is made
again.

**Told once** (`src/core/told.ts`, pure). `toldOf` reads the flow as kept and the events written down, as known at
a moment, and says each change set and each event the same way (`Told`): its days, its kind, what it did, why, who
made it, who decided, who agreed and when (or whose agreement it waits for), what it reaches (the datasets it is
about, and those built from them), what it excuses, where it stands, and its own step where the record has one.
Everything below is that list, filtered and worded. A person is said by the name the flow's policies give them.

**Since you last looked** (Q-327). A browser keeps, by flow and by who is viewing, how each thing stood when they
last looked: its days, where it stood, who had agreed (`Seen`, `seenOf`). The next look says what is new and what
has moved (`sinceSeen`): *agreed to since*, *in force now*, *ended since*. It is at the head of the register, each
thing a tap from its entry, with **Got it**; in a line at the top of the home screen; and on a read flow's sheet,
on the change itself. A first look says nothing and takes everything as seen; what someone did themselves (a
change they made, an agreement they gave, an event they wrote) is no news to them; a rewording isn't a move; and
nothing is said while the page reads as known at an earlier moment. In Larkspur's walk the flow's owner ends a
description, the security lead agrees to it, and the owner, back, is told *1 that moved: agreed to since*.

**A digest** (Q-328), under the register, behind **Pass it on**. Over the month on screen, the week of the day on
screen, or every day the page has: what waits for someone's agreement, what is coming, what changed (began, was
written down or was agreed to in the period, the newest first) and what was going on, each in full
(`digestOf`, `digestText`). A digest of the period the page reads from is one passed on now, and says everything
that waits or is coming whenever it was written down; one of a period gone by keeps to what was written down by its
end. Copied as text, as an image, or as a link that opens the same digest (`#ontology/digest/<from>..<to>`), as a
day's brief is.

**A feed** (Q-329). The app's build writes `feed.xml` beside the page (`scripts/feed.ts`, `feedOf`): an Atom feed
(RFC 4287) of every change and event, what waits and what is coming first, read from the last day the build
recorded, from the flow as shipped, its story's events and the steps the build measured. An entry's id is made of
the flow's id and the thing's own (`urn:smaltfl:<flow>:change:<id>`), so it is the same entry from build to build,
and it is updated when the thing was last written down or agreed to. Each links into the Ontology view on its
entry (`#ontology/change/<id>`, `#ontology/event/<id>`). The page links to it in its head, loads.json names it
(`feed`), and the digest's fold shows it. The feed is not in what the data's cache is keyed by.

**The history for an auditor** (Q-330, Q-331). `historyOf` makes it over a period, both days in, as things stood on
its last day: who owns each part of the ontology, every change of the period with its kind, its reason, who made
it, who decided, who agreed, what it reached and its own step, and what was written down as going on
(`smaltfl-ontology-history/1`). What came with the build's data and isn't in the browser's record (the story's
events, the steps the build measured) is kept apart, under `shipped`. *The page* takes the Ontology view's place
(`#ontology/history/<from>..<to>`, or **The history for an auditor, to print ›**): a period picked by two dates,
**Print**, and the same copies as a digest; the page's print rules leave the app's bar, the sheet and the buttons
off the paper. *The bag* carries the history over every day the page has, as known when it was made
(`data/ontology/history.json`), and its README says what it is. *The offline check* makes it again from the flow
document the record kept under the hash the history names, which an entry of the record must say the flow was,
and from the record's own events and steps (`historyProblems`): a change left out or reworded, an agreement the
flow as kept doesn't carry, an event the record doesn't hold, other owners, or another flow fails it. What is
listed as shipped is counted and not held. The export records the flow as it is kept before it names the record's
head, so the document is in the bag (Q-332). The page tells the history from that same document, the flow without
what is only for display, so that the check has what the page had. Such a document has no notebook cell to write a
gate's toggle in, so the register says a toggle there from the gate itself, in the words the page used when it was
made (`register.ts` `checkWithoutCells`); a test holds the kept document's telling to the whole document's.

**What it leaves.**

- **A browser and a viewer, not a person.** What was seen is kept in the browser by who is viewing, the stand-in for
  people until sharing is built (Q-35): another device starts over. Naming readers for a change waits on sharing
  too, as §10 says.
- **The feed is the build's.** A change made in a browser, or an agreement given there, is in that browser's
  register and its digest, and in no feed until the flow as shipped has it: a static site publishes what its
  build knew.
- **What came with the build isn't held offline.** The bag names the data's list, and the list names the recorded
  month by its hash, but the month isn't in the bag: the audit counts a history's shipped events and steps and
  holds none of them.
- **The printed page isn't signed.** It names the hash of the flow it was made from; the history the offline check
  holds is the bag's.
- **A digest's image is its text drawn,** not a chart.
- **One feed a page.** A read flow's own page has its own feed; a page has no feed of one part of its ontology.
- **The audit still doesn't make each run's rules or context again** from the flow as kept (Q-313, Q-324): a
  run's entry doesn't keep the moment its rules were known at. Keeping it changes what the record keeps of a run,
  and wants its own decision.

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
  first description of an existing list is taken from its file as it stands, as the start of its history. Built so in
  slice 3: a rule of kind `closed`, its entries read from the load on screen when a list is closed in the app.

Proposed with slice 3, as built:

- **Q-286:** a closed list adds no plan version: its plan carries `publish.closed` only where a flow declares one, as
  it carries contracts, and a build that doesn't read it refuses the plan.
- **Q-287:** an entry the ontology has and the file doesn't is *waiting for data*, whether it hasn't arrived yet or has
  gone: it is said every day and pauses nothing. An entry is ended in the ontology (slice 5), not by its row going.
- **Q-288:** an event may excuse the amount, a column's mix, pairs, blanks and a shape. Never the forest or the
  classifier, never a value the ontology marks bad, never a written check.
- **Q-289:** *publish without it* stands from its day until the entry is declared, and the rows it leaves out aren't
  counted against a check step's limit on dropped rows.
- **Q-290:** format 5 asks the document what it can answer by itself (what one row is, a kind and a reason on every
  change, a check step for a closed list) and asks for the columns where they are known (the build, the page). A
  column set aside is one the source doesn't declare, named in the ontology.
- **Q-291:** a day a restatement publishes is the day readers see from then, by the record, and a day the history
  learns from, unless the run restated still holds the file its pause was about. The engine's names follow releases
  only, as ADR 0021 §5 left them.

Proposed with slice 4, as built:

- **Q-292:** adding a source isn't a dated change. It is the flow as kept, for every day run from then, as a join or a
  flow added from the catalogue is, recorded with its reason. A description written ahead of its data is a dated
  change, with a kind and a reason, and stays in the ontology once its file is bound.
- **Q-293:** a source added in the app is its cell, a check step that warns of a row without its key, and that step
  published; its description is a kind of thing of its own (or, in a flow with gates, a rows entry of a kind the
  ontology has), a noun, each column's meaning as the file's own, and the columns set aside. It isn't watched.
- **Q-294:** the file is kept in the browser, by the flow and its hash, beside the record and not in it. A flow kept
  with a source whose file is gone is the shipped one again, and the page says so.
- **Q-295:** a meaning an estate shares isn't said again for an added file. Only a name the file gives the column is
  written, marked as an override with that as its reason.
- **Q-296:** a flow in an older format is brought up by its owner in the app: what one row of a file is may be said
  with a noun, and it is saved as format 5 once nothing it would be asked is left.

Proposed with slice 5, as built:

- **Q-297:** no hash tag gains a version for kinds, relations, meanings or what ended. The rules in force hash the
  ontology whole, and an estate's ontology is hashed whole with its change sets, so each is in the hash as written.
- **Q-298:** an estate's change sets hold the ontology's own edits (a kind, a relation, what a row is, a dependency, a
  meaning, the end of one of them) and nothing a flow decides: no rule, no closed list's entry, no dataset described
  ahead. They come in before the flow's own, marked with the estate's name.
- **Q-299:** a thing ends only when nothing in force names it: no cascade. An ended entry leaves its closed list, so
  its rows stop at the gate from that day, and the gate says it was ended and what follows it.
- **Q-300:** a redefinition made from a column's card redefines the meaning wherever the ontology says it: every
  dataset a shared meaning names, and each copy passed on. A reworded meaning stays the file's own.
- **Q-301:** a dated edit about a thing still to come is taken, checked on its own first day under the rules as known
  now, since it changes nothing on the day on screen.
- **Q-302:** a description written ahead ends only while it waits for its data. With its data it stays in the
  ontology, described from one day and evidenced from another.
- **Q-303:** the recorder judges a fill's donor under the rules of the day it fills, as the page does. A story's days
  where a rule changes between a donor's day and the day it fills are recorded so from now on.

Proposed with slice 6, as built:

- **Q-304:** only a change of kind *the business changed* is run both ways. A re-tuned setting and a changed source
  are marks whatever they moved, a first description changes no day, and a correction has its restatement.
- **Q-305:** *as it was*, for a change that declares an entry of a closed list, is the day without the entry (*publish
  without it*), not the day held at the gate: a held day measures nothing.
- **Q-306:** a step reads what the flow publishes: the product's score, coverage and checks, the applications failing
  each control, each output's rows. A line of the trend is cut by its own step: the score's by a step in the score,
  the coverage's by a step in the coverage.
- **Q-307:** a step is an entry of the record, of kind `step`, written by the build beside its change. The what-if
  it names is no recorded run; its manifest is kept with the month's. No hash moves.
- **Q-308:** the series a change moved are those of a watched step that the two runs give another value, that stand
  outside what was usual under the change, and that the old way told nothing of. They are a level from the change's
  first day, learned from like an accepted one. A file's own series is the same both ways, and never one.
- **Q-309:** the record keeps what each run was told. The first day of a declared change is read the old way by the
  month, for the runs of the day on the files the step was measured on.
- **Q-310:** a day published again with another score keeps what it first published beside it.
- **Q-311:** the app doesn't run a change made here both ways. To be decided with the regression's budget: on request
  from the change's entry, or at once when the change's first day has already run.

Proposed with slice 7, as built:

- **Q-312:** a context table is a SQL step that reads nothing, marked in the document, with the day's rows in its
  plan. No plan version, no node kind: a build that doesn't know the mark runs the statement, which has the rows.
- **Q-313:** the rows are the run's input, made from the flow as kept and the record, not from the document the run
  keeps (its rules in force, which have no reasons and no events). Verify holds each table's statement to the rows
  the plan carries, and recomputes the output. Whether the rows are the record's is the audit's to hold, and it
  doesn't yet.
- **Q-314:** the grain is a change (or an event) and a dataset it reaches, directly or downstream, with one row and
  no dataset where it is about the flow as a whole; `in_force` is a row a dataset.
- **Q-315:** a day's context is what is in force and going on that day, as known when its run was made: a change
  still to come isn't in it, and an event written afterwards isn't in that run's rows.
- **Q-316:** the context tables stay out of a change's own step, a trial's figures and *the day both ways*: they
  differ by what they are.
- **Q-317:** the flow's hash doesn't move with the day's context. The plan's does, and the three outputs' do.
- **Q-318:** a day isn't restated where its context tables alone differ under rules changed since: it is compared
  with what readers got by its other outputs, and noted where they are the same. Compare counts the outputs that are
  data and lists a context table that differs apart.
- **Q-319:** a card's Context is read as known at the moment the page reads at, and says what was written down or
  recorded after the version on screen ran. The published tables stay as the run knew them.

Proposed with slice 8, as built:

- **Q-320:** owners are named part by part, in each part's own document: an estate's ontology, and each flow's own.
  An owner is a principal by id, a name where the document has no principal to take it from, and a card's
  fingerprint once known. A part that names none is its flow's owner's. No finer than a part.
- **Q-321:** a change asks for agreement where its kind is *the business changed*, and where one of its edits ends
  something (§2, Q-264), whatever its kind. A rule taken off or a check switched off isn't an ending in that sense:
  it asks by its kind.
- **Q-322:** an agreed change is in force from the moment of the last agreement it needed, and the change sets in
  force are applied in the order they came to be known. One that waits is in force on no day. `rules/1` is as it
  was: the rules in force are what the change sets known make.
- **Q-323:** one person may hold both roles until sharing is built: an author who owns what the change touches
  agrees by recording it, the agreement names them, and the screen and the audit say so.
- **Q-324:** the audit holds each agreement in each flow document the record kept to that document's owners, and
  each change set and agreement that came with an entry to whoever made the entry. It doesn't make a run's rules
  again from the flow as kept.
- **Q-325:** whoever owns a part a change waits for may agree to it in the app, the flow's owner or not; making a
  change stays the flow's owner's.
- **Q-326:** the published `context_changes` says who agreed and when (`agreed_by`, `agreed_at`), a column added:
  its contract is 1.1.0.

Proposed with slice 9, as built:

- **Q-327:** what was seen is kept in the browser by flow and by who is viewing: each thing's days, where it stood
  and who had agreed. A first look says nothing; one's own doings are no news; a rewording isn't a move; nothing is
  said while reading as known at an earlier moment. **Got it** takes what is on screen as seen.
- **Q-328:** a digest is offered over the month on screen, the week of the day on screen and every day the page
  has, and holds what waits for agreement and what is coming whatever its days, what changed in the period and what
  was going on in it. A link carries its period (`#ontology/digest/<from>..<to>`).
- **Q-329:** the feed is Atom, `feed.xml` beside the page, written by the app's build as of the last day it
  recorded. An entry's id is the flow's id and the thing's own, the same from build to build. What is done in a
  browser isn't in it.
- **Q-330:** the history is `smaltfl-ontology-history/1`: the flow by id, name and the hash of the flow as kept, the
  period, the moment it reads as known at, the owners, the changes, the events, and what came with the build kept
  apart. It is a report made again and compared, never hashed into a run: no hash tag is added. In the bag it is
  `data/ontology/history.json`, over every day the page has.
- **Q-331:** the history's page takes the Ontology view's place and is printed by the browser, with print rules
  that leave the app's own furniture off the paper; the app makes no file of it.
- **Q-332:** the export records the flow as kept before it names the record's head, where the record doesn't have
  it yet: the history names that document by its hash, and the offline check finds it in the bag.

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
