# The ontology over time: research notes (2026-11-18)

Research behind [ADR 0027](../adr/0027-the-ontology-over-time.md). The maintainer, 2026-11-18:

> What I want you to come up with is a plan, and I want you to interview me and go back and forth on the design
> decisions as much as we need to come up with a temporal ontology. I've never really seen one work well, but I have to
> imagine they're kind of similar to like a temporal network or temporal graph. From a visualization point of view,
> I've never seen one work very well, but if you could go out and do research on that, how can we visualize this to
> show people how things are changing over time. [...] I want to be able to show how the ontology of the data is
> changing over time and why certain things apply at certain dates versus others, and be able to kind of map back to
> the day what was going on at that time, what were the decisions and thought processes and how the business was
> operated and maintained at that time period. [...] it needs to be something that can tie into the data flows and
> perpetuate so that we can do analysis backwards on data where we're always aware of the context of what was happening
> at each updated data slice.

**How it was made.** Eight strands were researched in parallel, in two passes, and synthesised into the report below:
the code as it stands (what smaltfl keeps over time today); temporal data models; temporal ontologies and knowledge
graphs; the systems that answer "what applied on this date" (law, clinical terminologies, statistical classifications,
geography, HR software); data platforms and catalogues; how a graph that changes is drawn, and what the studies
measured; how products people use show history and context; and analysis across a change of definition.

- **The first pass** could search the web but could open almost no page, and ran out of searches. It read standards
  and public repositories first-hand and marked everything else as a search summary or as recall.
- **The second pass,** with twenty more documentation sites allowed, read the primary pages: legislation.gov.uk,
  EUR-Lex, SNOMED International's specifications, Eurostat, Statistics Norway's classification service, the ONS,
  Oracle's and SAP's documentation, Fowler's and Kimball's own pages, Palantir's, DataHub's and OpenMetadata's
  documentation, Our World in Data, and the research papers on arXiv. It checked the first pass claim by claim and
  corrected it where the pages said otherwise.
- **What stayed out of reach:** ALFRED (its server closed every connection), the eCFR's screens and Workday's
  documentation (their hosts weren't allowed), and the files of the ONS's code history database.
- **No product was run.** What a screen looks like comes from documentation and its pictures, and from nine screens
  captured from pages under open licences.

**The scope changed while the research ran.** The maintainer drew the line that became ADR 0027 §1: the ontology is
the business's rules, meanings and kinds of things, and people and teams moving is data. The report follows that line.
What the first pass had gathered on showing an organisation as it was against as it is now was dropped from the
design.

What was decided from the research is ADR 0027. Where the report recommends something the ADR doesn't take, the ADR's
"Not built, and why" says so. Where the maintainer chose otherwise than the recommendation (pausing what an undeclared
arrival reaches, an event that says what it excuses), the ADR records both.

## The pictures the design was agreed on

Drawn on Larkspur's March 2024 for the interview, and redrawn after each round of answers. The dates are the demo's
own. Two April items marked *sketch* aren't in the demo: they show what a coming change would look like. The numbers
in the chart are a sketch, except its two ends.

![Larkspur's March 2024 and the first week of April as lanes over the days: what was going on, what there is and what it means, what we check, what stopped at the gate, what was decided. Left of today is what applied; right of it is what is coming.](temporal-ontology/lanes.svg)

**The month in lanes, with three tenses** (ADR 0027 §9). Each row is one thing's life. Left of today is what applied,
and how the runs of the time were judged where a correction later changed that. Right of it is what is coming: said,
tried on recorded days, not yet in force. A dotted bar is something described that still waits for its data. On a
phone the same entries are a list, what is coming first.

![Larkspur's five kinds of things and their relations as a map, comparing Friday March 1 with Monday April 1: the control list gained an entry, the meaning of an application's exposure changes, and a new relation between a person and a control is coming.](temporal-ontology/map.svg)

**Kinds and relations as a map, between two dates** (§9, Q-269). The temporal graph, held still: two chosen dates, and
only what differs is coloured. It suits the kinds because they are few. It shows no rules and no reasons; the list and
the lanes do.

![Why the WAF band held from Monday 18: an event on Tuesday 12, a held day, a decision, the security lead's choice on Thursday 14, the change recorded on Friday 15 with its trial, in force from Monday 18.](temporal-ontology/why.svg)

**Why did this apply?** (§9). From any rule on any day: the event, the held day, the decision, who chose and when, the
change as it was written down with its trial, and the day it took effect.

![A sketch of the group's posture score over March 2024: the published line is cut on Wednesday 27, where a fifteenth control joins; a dashed line shows the same days with that step taken out; Monday 18 carries a mark for a rule change that moved nothing.](temporal-ontology/chart.svg)

**A chart cut where the business changed** (§7). The first day of the change is run both ways, so the step is split
into what the new control did by itself and what the day's data did. The dashed line is the same days read the old
way. A change that moved nothing on this series is only a mark. The freeze is a band, with what it excuses.

**The phone screens,** in words:

- *The ontology over time, as a list:* what is coming on top, then the month, newest first; each entry with its kind
  and that kind's own mark, its dates, its reason in its author's words, what it reached and its own step.
- *A day in its context:* in force, going on and what it excuses, at the gate, waiting for data, coming, and the day
  read both ways.
- *The data is ahead of the ontology:* what the file has that the ontology doesn't, what waits, and the form that
  declares it: from when, what kind, why, decided by whom; or publish without it; or don't publish.
- *Door one, here is the data:* a file described from its own data; a row, its key and every column confirmed or set
  aside before anything reads it.
- *Door two, describe it first:* what the business needs, in force from its date and waiting for data, with *Bind a
  source ›*.
- *An event that says what it excuses:* its span, kind, what it is about and its note; what it excuses and the days
  excused so far.
- *Two dates compared, in words:* each line one thing, before and after, with its day and its kind.
- *The context read from a notebook cell:* a day's score joined to what changed that day, its kind and its own step.

The full page, with these drawings, the phone screens and nine real screens from elsewhere with their licences, is a
private claude.ai page of the maintainer's: https://claude.ai/artifact/D1mgxKdBKMnna1HcU4RN2x

## What the research found, in brief

The full report, with its sources and how far each was checked, is added to this document once the second pass's
corrections are folded into it. Its conclusions, which the second pass confirmed:

1. **The temporal ontologies that work are registers of dated records, not graphs that move.** A stable identity, the
   day it holds from, the moment it was recorded, a status, a reason, what follows it. Nothing is deleted, and the
   current state is a default view over the history. Law, clinical terminologies and statistical classifications all
   run this way.
2. **Two clocks are settled practice; a third isn't.** When something applied and when it was recorded are in the SQL
   standard and in every serious system. Fowler's way to avoid the full two-clock model is to keep with each action the
   inputs it used, which a hash of the rules on every run already does.
3. **In every data product examined, the facts are in time and the definitions are not.** Palantir's documentation
   says it "cannot provide a snapshot of your Ontology at a historical point in time". No product found reads a past
   day under the definitions of that day.
4. **To see change, sentences, two chosen dates and rows of days beat a graph that plays.** In the controlled studies
   static views were faster than animation; choosing two moments and seeing them together was best for "what changed
   between then and now"; readers preferred charts with the notes on them.
5. **Reading a series across a change of definition is two choices,** which definitions are applied to the past and
   which numbers are shown, and the reader must be told both. The publishers who do it well mark the break, carry both
   series over an overlap or give the adjustment, and never put a restated figure silently in place of the first.
6. **Publishers that others rely on never take anything back; systems operated by their owners offer a guarded
   rewrite.** A tool that is both edited by its owners and relied on by its readers needs the publisher's rule for
   whatever a reader has seen.
