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

## Date the ontology, don't graph it

A temporal ontology that works is not a temporal graph. Wherever "what applied when, and why" is answered in production
(UK legislation, SNOMED CT, statistical classifications, official geography, the Gene Ontology, Wikidata), the thing
that carries time is a plain record: a definition with a stable identifier, the day it takes effect, the moment it was
recorded, a status, a reason, and a pointer to whatever replaced it; nothing is deleted, "current" is a default view
over the history, and every release or run says which state it used. The approaches that put time into the logic or into
the drawing (4D fluents, temporal RDF, semantic diffs, animated node-link graphs) stayed in research: the W3C's own time
ontology lists valid time as "not resolved explicitly", a review counts 28 ontology-change visualisation tools of which
about 12 survive, and controlled studies mostly find static views faster than animation, on phones too. Scope decides
the design. For smaltfl's maintainers the ontology is the business's rules and its understanding of itself (rules,
checks, what things mean, the kinds of things there are), and the research supports their line between a change in those
and a change in instances (people hired, teams moved), which arrives as data and stays data; the grey area is a list
that arrives as data yet defines the business, such as a control catalogue, a list of roles or a code list, where a new
entry behaves like an ontology change and is where breaks in series come from. **smaltfl already holds the core that no
product surveyed has in one place**: dated change sets with who, when and why on two time axes ("for the day" and "as
known on"), a hash of the rules in force named in every run's manifest, restatement as a recorded decision, what-if runs
under any version, and a comparison of two versions of a day. Its gaps are narrower than a new model: only rules are
dated (names, labels, types, links, steps, the calendar, contracts and the estate's shared ontology are not), nothing
records a business event or period as context, no chart marks a change of definition, and a past month cannot be read
under a chosen version without restating it. The design that follows is to extend the register and not replace it: say
where the line between ontology and data runs, widen what a change set can date, give every change a kind, a required
reason and an optional authority, keep a dated list of business events as context beside the calendar, mark and break
series where the rules they depend on changed, and show change as sentences, two-date differences, per-element histories
and rows of days, with the date in the address. The evidence was gathered in two passes, and the report marks it
throughout. The first pass could search the web and mostly could not open pages. A second pass on 18 November 2026
opened the primary pages for law, clinical terms, statistics, geography, HR and ERP systems, Fowler, Kimball, the data
platforms, the statistics publishers and the visualisation studies, and checked the first pass claim by claim. The
conclusions stood. A number of details were corrected, the main ones listed in the last section, and one finding was
added that bears on the design: publishers whose readers rely on what was issued never take anything back, while
operated systems such as HR software offer their maintainers a guarded rewrite of history. A citation followed by
"summary" still rests on a search tool's extract of a page that was not opened, a study marked "abstract" was read no
further than that, and a statement introduced as "recalled" is a lead from memory with no source read. The main areas
still in those grades are US legislation, RxNorm, LOINC and the ICD maps, the accounting standards, finance and
engineering configuration management, Workday, and the literature on visualising ontology change.

### The standards can write an interval down but cannot say when a definition applied

"Temporal ontology" names two different things, and most disappointment comes from buying one and expecting the other.
The first is **facts in time**: a relation (this unit reports into that one, this person leads this team) holds for a
period. The second is **the ontology in time**: the types, links, meanings, labels and rules are themselves revised, and
one wants to know which revision applied on a date. The second is the scope smaltfl's maintainers set, a change in
rules, checks, meanings and the kinds of things there are; the first is the neighbouring problem of data that changes,
and it is reported here because most of the literature and nearly every product addresses it. A temporal graph or
temporal network is the first kind drawn as nodes and edges that exist for intervals. The asker's suspicion that a
temporal ontology is "something like" one is how the research literature treats it, and it is the reading with the worst
record. The W3C's time ontology, OWL-Time, a Recommendation since 19 October 2017, is a vocabulary for instants,
intervals, durations and their ordering. By its own text it "focusses particularly on temporal ordering relationships",
it added one generic property for attaching a time to a thing "for users unwilling or unable to define their own
semantics", and its requirements appendix records "5.56 Valid time: not resolved explicitly" ([W3C, Time Ontology in
OWL](https://www.w3.org/TR/owl-time/)). The data model underneath has no time at all: "The RDF abstract data model is
atemporal: RDF graphs are static snapshots of information" ([RDF 1.2 Concepts](https://www.w3.org/TR/rdf12-concepts/)).
OWL-Time tells a designer how to write an interval down. It does not answer "when did this definition apply".

#### Of five ways to date a fact, the plain record is the one in production

Five patterns exist for a relation that holds only for a while, and only the least clever has production weight. The
**statement node** turns the relation into a record with its own properties: a W3C note of 2006 defines it and states
its cost ("limits the use of many OWL constructs and creates a maintenance problem") ([W3C, Defining N-ary
Relations](https://www.w3.org/TR/swbp-n-aryRelations/)), the W3C Organization Ontology uses it for a membership with a
period, a role and room for "reference to the employment contract" ([W3C, The Organization
Ontology](https://www.w3.org/TR/vocab-org/)), and Wikidata's export is the same pattern at scale. **4D fluents**, which
slice every entity by time, stayed in research; a summary of the original paper reports that the approach cannot express
"at most one manager at a time" in OWL ([reading notes on Welty and
Fikes](https://djradon.github.io/wiki/notes/jxej1bzfm42cbouwzcl0cd4), summary). **Standard reification** is, in the
words of the group that set out to replace it, "verbose and cumbersome" ([RDF-star final community
report](https://www.w3.org/2021/12/rdf-star.html)). **Named graphs** carry a date easily and mean nothing agreed: "no
agreed formal semantics exists for RDF datasets" ([W3C, On Semantics of RDF
Datasets](https://www.w3.org/TR/rdf11-datasets/)). **RDF-star**, proposed in 2014, is the intended standard way to
annotate a statement and is still not a standard: RDF 1.2 Concepts reached Candidate Recommendation on 7 April 2026,
every SPARQL 1.2 document was still a Working Draft on 16 November 2026, and the model changed on the way, so that at
least one store dropped its RDF-star support and migrated its databases ([W3C working group
publications](https://www.w3.org/groups/wg/rdf-star/publications/); [Oxigraph
changelog](https://github.com/oxigraph/oxigraph/blob/main/CHANGELOG.md)). At the W3C's 2019 workshop on graph data the
temporal session ended on a question: "Should time be an intrinsic feature of RDF?" ([workshop
report](https://www.w3.org/Data/events/data-ws-2019/report.html)).

Wikidata is the largest working example of facts in time, and it shows both why the record works and where it bites.
Every statement is a record with a value, qualifiers (start time, end time, replaces, replaced by), references and one
of three ranks, and a statement that stopped being true is ended, never deleted ([Wikibase data
model](https://github.com/wikimedia/mediawiki-extensions-Wikibase/blob/master/docs/topics/json.md)). The trap is the
default view. The convenient "truthy" export holds only best-rank statements ([Wikibase RDF
binding](https://github.com/wikimedia/mediawiki-extensions-Wikibase/blob/master/docs/topics/rdf-binding.md)), rank is a
flag an editor sets and not a function of the dates, and the query service's own example of asking for a current office
holder filters on the absence of an end date, so every user re-implements the interval logic and an editor's omission
silently changes the answer ([Wikidata query
examples](https://github.com/wikimedia/wikidata-query-rdf/blob/master/docs/sparql-query-examples.md)). A knowledge base
that consumes those dates has to special-case properties and guess which undated values are historical ([YAGO
builder](https://github.com/yago-naga/yago-4.5/blob/main/03-make-facts.py)). What to take from Wikidata: end, never
delete; keep a status with its reason apart from the dates; link each record to its successor; put a source on every
record. What to avoid: "current" as a hand-set flag when it can be computed from the dates.

#### Versioning vocabulary no machine acts on, and diff tools nobody kept

For the second meaning, the ontology's own history, the standards give labels and no mechanism. OWL has a version IRI
and annotation properties such as `owl:priorVersion`, of which the specification says "This has no meaning in the
model-theoretic semantics" ([OWL Reference](https://www.w3.org/TR/owl-ref/)). SKOS has free-text history and change
notes, and SKOS itself changed the semantics of `skos:broader` between versions with "no explicit deprecation axioms"
([SKOS Reference](https://www.w3.org/TR/skos-reference/)). DCAT 3 declines to say what a version is ([DCAT
3](https://www.w3.org/TR/vocab-dcat-3/)). The only dates are publication dates; nothing standard says "in force from, in
force until, as known on". The hardest part was named in OWL's requirements in 2004: "it is possible for a revision to
change the intended meaning of an identifier without changing its formal description", so "the ontology author needs to
be able to indicate such changes explicitly" ([OWL Use Cases and Requirements](https://www.w3.org/TR/webont-req/)). **No
diff can see a change of meaning under an unchanged name.** That is the argument for a written reason on every change,
and it is why two decades of diff tools did not close the gap. The semantic diff tools' repositories were last changed
in 2015 (ecco, Protégé's OWL difference plug-in) and 2021 (OWLDiff) ([ecco](https://github.com/rsgoncalves/ecco);
[owl-diff](https://github.com/protegeproject/owl-diff); [OWLDiff](https://github.com/kbss-cvut/owldiff)), while the
maintainers of the largest biomedical ontologies wrote in 2025 that there was still "no single agreed-upon way to
*represent* or *communicate* those changes", citing a 2023 community survey in which **82% of ontology users said
staying informed about changes mattered very or extremely, and 8% were satisfied with the ways of viewing them** ([KGCL
documentation](https://github.com/INCATools/kgcl/blob/main/src/docs/index.md)). Their answer was a small language of
editor-level changes (rename, change a definition, move, obsolete with or without a replacement), each with who, when
and why. It is a change log with a grammar, not a logic.

Storing every version of a graph was benchmarked and did not leave research either. The BEAR benchmark names the three
policies any design faces (whole copies, deltas, a validity stamp on each statement) and measured a general triple store
at **196 to 353 GB for 23 GB of gzipped data** over 58 versions, the timestamp policy the largest ([BEAR technical
report](https://github.com/webdata/BEAR/blob/master/publications/techReportBEAR.pdf)); the dedicated systems remain
prototypes. What reached production is humbler: immutable dated files behind stable addresses, and databases whose
storage is itself a commit log, such as TerminusDB and Fluree ([TerminusDB](https://github.com/terminusdb/terminusdb);
[Fluree](https://github.com/fluree/db)), which give recorded time only.

#### "Temporal graph" names three different products, and in all of them the schema stays outside time

In industry the phrase means one of three things. It is a graph whose edges carry dates as ordinary properties: Neo4j
stores temporal values and offers a change feed, and history is left to the modeller ([Neo4j Cypher
manual](https://github.com/neo4j/docs-cypher/blob/dev/modules/ROOT/pages/values-and-types/temporal.adoc)). Or it is a
graph database that can be read as of an earlier transaction. Or it is a graph whose facts carry both a validity window
and a recorded and expired time. Only the third is bitemporal, and its best-known product, Graphiti, does it in
application code on top of an ordinary graph database: four timestamps on each fact, a rule that a contradicted fact is
"invalidated — not deleted", dates read out of text by a language model, and entity types that are plain code with no
validity or version ([Graphiti README](https://github.com/getzep/graphiti); [Graphiti
edges](https://github.com/getzep/graphiti/blob/main/graphiti_core/edges.py)). The vendor's own benchmark table puts
questions about time at 67.71%, the second-weakest category for a system built around time ([Zep
experiments](https://github.com/getzep/zep-papers/blob/main/kg_architecture_agent_memory/locomo_eval/README.md)). A
relational engine draws the same line in one sentence: "Node and edge tables can't be created as system-versioned
temporal tables" ([SQL Server graph
architecture](https://learn.microsoft.com/en-us/sql/relational-databases/graphs/sql-graph-architecture)). **In every
graph product read, the facts are in time and the schema is outside it.** An engine for facts in time does not give an
ontology in time; that has to be designed separately.

The relational world settled the vocabulary and little else. Two axes are uncontested: when a fact holds in the world
(valid time, "application time" in SQL:2011) and when the database recorded it (transaction or "system" time). The first
is the user's to set; the second is the system's alone, and append-only. SQL:2011 standardises both, yet it "does not
say much about what should happen to a table with system versioning when the table is altered" ([periods extension
README](https://github.com/xocolatl/periods/blob/master/README.md)), and fifteen years on support is partial: SQL Server
has system time only, PostgreSQL 18 has application-time keys and "does not currently support system time", and MariaDB
has both and warns that after a structural change "the history will become incorrect" ([SQL Server temporal
tables](https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables); [PostgreSQL temporal
tables](https://www.postgresql.org/docs/devel/ddl-temporal-tables.html); [MariaDB system-versioned
tables](https://github.com/MariaDB/mariadb-docs/blob/main/server/reference/sql-structure/temporal-tables/system-versioned-tables.md)).
Martin Fowler's account of the technique is the frankest: "we don't see it used that often", it "does complicate a
system quite significantly", and "One of the hardest parts of this is educating users on how bitemporal history works.
Most people don't think of a historical record as something that changes" ([Fowler, Bitemporal
History](https://martinfowler.com/articles/bitemporal-history.html)). He names the two axes actual time, "the time
something happened", and record time, "the time we knew about it", having dropped the words valid and transaction
because "people found them confusing" ([Fowler, Temporal Patterns](https://martinfowler.com/eaaDev/timeNarrative.html);
[Fowler, Bitemporal History](https://martinfowler.com/articles/bitemporal-history.html)). Systems that version
definitions as well as rows fall into three families: definitions kept in the same log as the facts (Datomic,
TerminusDB, Dolt); definitions kept as metadata with stable identifiers and recorded against each snapshot (Iceberg,
Delta Lake, Camunda's process versions); and one current definition through which all history is re-read (SQL Server,
MariaDB, and XTDB, where a column's type is "the join of the types of every value ever written to it") ([Types in
XTDB](https://github.com/xtdb/xtdb/blob/main/docs/src/content/docs/about/types-in-xtdb.md)). The third is the common
default, and it is the one that rewrites the past.

Fowler also deals with rules that change, and the second pass read those pages. His pattern for dated rules keeps the
rules by date, because "Since events often appear later than they occurred, you must also retain the ability to process
old events with old rules". A shipment made on 7 March and reported on 22 March, after the charge rose on 14 March, is
charged "using the rules that were valid on March 7th", and a system without that facility grows "messy conditional date
logic" ([Fowler, Agreement Dispatcher](https://martinfowler.com/eaaDev/AgreementDispatcher.html)). He then sorts changes
to the rules themselves into "new features, defect fixes, and temporal logic". A defect fix means past processing was
wrong, so "all you need to do is make the fix and reprocess the events". A rule that changes on a date is different. It
belongs in the model, which "should be able to run events at any time with the correct rules for the event processing",
so the old rule and the new are both kept. Where a fix and a dated rule overlap he gives a warning: "This may lead into
bi-temporal behavior", and "Clearly this stuff can get very messy, don't go down this path unless you really need to"
([Fowler, Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)). Two points follow for a design. A record
of a change has to say which of the two it is, because they treat the past in opposite ways: a fix means past days are
judged again, and a dated rule leaves them judged as they were. And rules on two time axes are the costly case, worth
entering only where readers have already relied on what was published.

The asker's "never seen one work well" therefore has a precise form. Each failure has a primary source: the time
standard stops short of validity; every way of attaching time to a fact costs something the base language gave free; the
versioning vocabulary has no meaning a machine acts on, while meaning changes with no formal trace; the tools computed
logical differences when users wanted to be told what changed in their own words; and the interval logic lands on
whoever writes the query. What works is recognisably the same across Wikidata, the biomedical ontologies, SNOMED's
server, Graphiti and XTDB, and none of it is temporal logic. The dated thing is a row with from, until, status, reason
and source. Nothing is deleted. "Current" is a default view with the history one step away. Changes are said in the
editor's vocabulary with who, when and why. Changes are announced before they apply. Releases are immutable and
addressable. And where corrections matter there are two times, the one that applied and the one that was known.

### Law, clinical codes, statistics and geography run on one short list of habits

A note on this section's footing. The first pass took its findings on legislation, clinical terminologies, official
statistics and geography from search extracts. The second pass opened the pages: legislation.gov.uk and EUR-Lex, the
SNOMED CT specifications, Eurostat, Statistics Norway's KLASS service, the ONS, and the documentation of PeopleSoft,
Oracle Fusion HCM and SAP. Pages were read as the server sent them, and the legislation.gov.uk provision was also seen
in a browser. Below, a citation with no mark was read on the page it links to. One marked "summary" was not re-opened
and stands as the first pass left it: the US Code, the eCFR's screens, Akoma Ntoso, RxNorm, LOINC, the ICD maps, GSIM,
the US Census Bureau, NHGIS and ALFRED's own definitions. The practice of the curated ontologies (the Gene Ontology, the
OBO Foundry, schema.org) was read first-hand in the projects' own repositories in the first pass.

**Legislation is the clearest working answer to "what applied on this date, and why".** On legislation.gov.uk the date
is the last segment of a provision's address, and the page announces its mode in a status line: "Point in time view as
at 12/02/2019. This version of this provision has been superseded." ([Taxes Management Act 1970, s. 42, at
2019-02-12](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2019-02-12)). The page answers three questions in
three places and never merges them. A "What Version" box offers "Latest available (Revised)", "Point in Time
(12/02/2019)" and "Original (As enacted)". A strip headed "Changes over time for: Section 42" lists the provision's 32
versions from 01/02/1991 to 24/04/2025, each a link to the same provision at that date, with the version on view marked
and a warning above it, "Version Superseded: 14/09/2023". The versions are evenly spaced whatever the time between them,
so the strip is an ordered list of versions and not a scale of time. And a "Changes to legislation" box says how far the
text can be trusted. Any date works in the address. A date between two changes is served as a page of its own, with the
asked-for date marked on the strip and the version that answers it highlighted ([s. 42 at
2020-06-01](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2020-06-01)), and a date before the base date is
redirected to the base date. The why is in a fourth place, the notes under the text. Each change carries a typed note:
F-notes "for amendments, including repeals, where there is authority to change the text", C-notes where "the meaning,
scope or application" changes "without there being any authority to alter the text", I-notes for commencement, and four
rarer types ([legislation.gov.uk, Help](https://www.legislation.gov.uk/help); [Guide to Revised Legislation,
2013](https://www.legislation.gov.uk/pdfs/GuideToRevisedLegislation_Oct_2013.pdf)). A note is a sentence with a fixed
grammar, which says what part, what was done, when, and by which Act and instrument: "F5 Word in s. 42(2) substituted
(17.7.2013) by Finance Act 2013 (c. 29), s. 213(2)", or "S. 202 applied (N.I.) (25.4.1998) by S.I. 1998/1126, art. 6,
Sch. 2" ([example page](https://www.legislation.gov.uk/ukpga/1983/2/part/V/crossheading/interpretation/2001-02-16)). The
help page says what the notes are for: "They are mainly used to provide the authority for amendments or other effects on
the legislation". The site also shows its second clock and its limits. The box on the latest version reads "is up to
date with all changes known to be in force on or before 18 November 2026. There are changes that may be brought into
force at a future date", and a control, "View outstanding changes", opens a list headed "Changes and effects yet to be
applied to Section 42:", each line the same kind of sentence as a note ([s. 42, latest
version](https://www.legislation.gov.uk/ukpga/1970/9/section/42)). The past view says that it knows less: changes yet to
be applied "are therefore not accessible when viewing legislation as at a specific point in time". History is complete
only from a base date of 1 February 1991, or 1 January 2006 for Northern Ireland ([point in time
search](https://www.legislation.gov.uk/search/point-in-time)); the editors aim to apply an amendment "within a maximum
of three months" of its coming into force; and "Wholly revoked items of secondary legislation originally made before
2018 may not be given historical versions". The data behind the page keeps two dates apart, the date the view is for and
the date the editors last changed the record, and writes each version's end as the day its successor starts ([the same
view as XML](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2019-02-12/data.xml)). One documented feature did
not work when tried. The developer pages describe a keyword, `prospective`, in place of the date; on 18 November 2026 it
returned "Page Not Found" at all six addresses tried, the documentation's own examples among them. Text not yet in force
is served at the provision's plain address under the word "Prospective", with the status line "This version of this
provision is prospective." ([Developer, URIs](https://www.legislation.gov.uk/developer/uris); [Equality Act 2010, s.
14](https://www.legislation.gov.uk/ukpga/2010/15/section/14)). Other jurisdictions pick a different unit of time.
EUR-Lex publishes consolidated versions addressed by date, each under a standing notice, "This text is meant purely as a
documentation tool and has no legal effect". Each opens with a table of the acts that amended it and, listed apart, the
acts that corrected it, and a marker before each fragment of the text links to the act it came from ([EUR-Lex, a
consolidated version](https://eur-lex.europa.eu/eli/reg/2006/1893/2025-01-01); [EUR-Lex, Consolidated
texts](https://eur-lex.europa.eu/collection/eu-law/consleg.html)). The US Code names each state by the last public law
incorporated, exceptions included in the name ([prior release
points](https://uscode.house.gov/download/priorreleasepoints.htm), summary). The eCFR, on the first pass's summaries,
gives each provision a timeline, lets any two dates be compared, and had to add a filter because entries where nothing
changed crowded out the ones where something did ([eCFR, timeline
filtering](https://www.ecfr.gov/reader-aids/ecfr-recent-updates/introducing-timeline-filtering), summary). Its screens
could not be opened in the second pass. Its public data service could, and it holds what such a filter needs: every
version of every section is a row with an amendment date, an issue date and a flag for whether the change was
substantive, and of the 422 rows for Title 1, 35 are not ([eCFR API, versions of Title
1](https://www.ecfr.gov/api/versioner/v1/versions/title-1.json)). The interchange format, Akoma Ntoso, makes events the
hub: each modifying event is listed once with its date and the document that caused it, intervals refer to events, and
being in force and being operative are separate intervals ([Akoma Ntoso
1.0](https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html), summary).

**Clinical terminologies show the append-only register in its barest form.** In SNOMED CT's release format every file
starts with the same four columns, an identifier that cannot change, an `effectiveTime`, an `active` flag and a module,
and one rule gives the state on any date: "The current record will be the one with the most recent effectiveTime before
or equal to the date under consideration" ([SNOMED CT concept file
specification](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/component-release-file-specification/4.2-file-format-specifications/4.2.1-concept-file-specification)).
The specification calls this "a 'log style' append-only data model" and promises that "Once released, a row in any of
these files will always remain unchanged" ([SNOMED CT, history
mechanism](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/release-types-packages-and-files/3.1-common-features-of-all-release-files/3.1.5-history-mechanism)).
Nothing is removed: retiring a concept is a new row with `active` false, and the concept stays "for historical purposes"
under "the principle of 'concept permanence'" ([SNOMED CT, meaning of the active
field](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/release-types-packages-and-files/3.1-common-features-of-all-release-files/3.1.4-meaning-of-the-active-field)).
Each file's table also says, column by column, what may change under one identifier and what forces a new one. A
description's wording may be edited, but a change to its concept, its language or its type retires the description and
makes a new one with a new identifier ([SNOMED CT description file
specification](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/component-release-file-specification/4.2-file-format-specifications/4.2.2-description-file-specification)).
A retirement is two facts kept apart, a coded reason and typed links to what stands in its place, and the Editorial
Guide's table pairs each reason with the links it may take and how many, "at the author's discretion": a duplicate takes
exactly one SAME AS; an ambiguous concept one or more POSSIBLY EQUIVALENT TO; an outdated one a REPLACED BY, several
POSSIBLY REPLACED BY, or nothing ([SNOMED CT Editorial Guide, changes to
components](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-editorial-guide/readme/authoring/general-modeling/changes-to-components);
[Extension Guide, inactivating a
concept](https://docs.snomed.org/snomed-ct-practical-guides/snomed-ct-extension-guide/5-key-steps/5.4-authoring/5.4.2-authoring-concepts/5.4.2.3-inactivate-concept-in-an-extension)).
There are eleven kinds of link ([SNOMED CT, historical association reference
sets](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/reference-set-release-file-specification/5.2-reference-set-types/5.2.1-content-reference-sets/5.2.1.4-association-reference-set/5.2.5.1-historical-association-reference-sets)).
The query language folds them into three named choices for reading old records under today's codes, from "only
historical associations that have a one-to-one equivalence with their replacement" to "the highest level of recall,
where precision is not as important", and gives the reason old codes are kept at all: "For legal reasons, it is
important that the concepts used at the time the data was recorded should persist in the health records" ([SNOMED CT,
history
supplements](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-expression-constraint-language/behaviour-specification-with-examples/6.11-history-supplements)).
The format has two limits. It records the state at each release and not the edits between releases. And it has no future
rows: a row's date must not, in general, be later than its release, and a future activation date is sent to a separate
mechanism. LOINC keeps deprecated codes with a status, a coded reason (ambiguous, duplicate, erroneous) and a map to the
superseding code ([NLM, LOINC in the
UMLS](https://nlm.nih.gov/research/umls/sourcereleasedocs/current/LNC/metarepresentation.html), summary). RxNorm's
identifiers "are never reused", and one call answers what became of any identifier with one of six statuses ([RxNorm
release notes](https://www.nlm.nih.gov/research/umls/rxnorm/docs/2023/rxnorm_releasenotes_full_05012023.html), summary;
[RxNav history status](https://lhncbc.nlm.nih.gov/RxNav/APIs/api-RxNorm.getRxcuiHistoryStatus.html), summary). The ICD
transition is the cautionary half. The official maps between ICD-9 and ICD-10 are directional, flagged approximate or
no-map, and many-to-many; one research group classed **36% of diagnosis mappings as "convoluted"**, from 5% in
haematology to 60% in obstetrics and injuries ([Boyd et al., JAMIA
2013](https://academic.oup.com/jamia/article/20/4/708/2909345), summary), and a 2019 presentation on the move to ICD-11
put the lesson in four words: "Mapping is different from equivalence" ([Fung and
Xu](https://data.lhncbc.nlm.nih.gov/public/mor/pubs/pres/20190806-NCVHS_ICD11.pdf), summary).

**Statistical offices name the two regimes a design must choose between.** A *versioned* classification is replaced
whole at each revision, with correspondence tables between versions. A *floating* classification is one version whose
items each carry a validity period, "which will allow the display of the item structure and content at different points
of time" ([UNECE, GSIM Statistical
Classification](https://statswiki.unece.org/display/GSIMclick/Statistical+Classification), summary). In the first a date
selects a version and then everything in it; in the second a date selects items one by one, and a correspondence table
must itself be dated ([GSIM Correspondence
Table](https://statswiki.unece.org/spaces/GSIMclick/pages/86541041/Correspondence+Table), summary). Statistics Norway's
KLASS answers by date with three calls that match a reader's three questions: the codes valid at a date, the changes
between two dates, and the correspondences at a date ([KLASS API
guide](https://data.ssb.no/api/klass/v1/api-guide.html)). Called live in the second pass, it shows how little a list of
changes needs and what it loses. The county classification lists twelve named versions back to 1842 whose windows meet
end to start, under a stated rule, "from is inclusive and to is exclusive" ([KLASS, classification
104](https://data.ssb.no/api/klass/v1/classifications/104.json)). The 317 changes of the municipal reform of 1 January
2020 come as old code, new code and date, with no field for the kind of change or its reason. A merger is several rows
that share a new code, a split is one old code in several rows, and the why is a sentence in a note on the code ([KLASS,
changes in classification
131](https://data.ssb.no/api/klass/v1/classifications/131/changes.json?from=2019-01-01&to=2020-01-02)). Where the map
between versions is many-to-many the offices do not trust the table. For the move to NACE Rev. 2.1 Eurostat will publish
parallel data sets under the new version, made by backcasting, and "For some statistics, there will also be double
reporting, with countries sending statistics broken down by NACE Rev. 2 in parallel to the statistics broken down by
NACE Rev. 2.1 for a certain period" ([Eurostat, NACE transition](https://ec.europa.eu/eurostat/web/nace/transition));
the US Census Bureau publishes concordances in both directions and as "changes only", plus bridge statistics that
measure the map in data ([Census, NAICS concordances](https://www.census.gov/naics/concordances/concordances.html),
summary; [Census bridge tables](https://api.census.gov/data/2022/ecnbridge2/groups/EC2200BRIDGE2.html), summary). The
break is flagged on the observation itself: Eurostat's `b`, "break in time series", and `d`, "definition differs (see
metadata)" ([Eurostat database](https://ec.europa.eu/eurostat/web/main/data/database)). In a live series the flag sits
on the first observation on the new basis (Germany's annual unemployment rate carries it in 2010, 2011 and 2020), its
meaning is sent with the data, and the explanation is in the dataset's reference metadata ([Eurostat data service,
une_rt_a](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_a?format=JSON&lang=EN&geo=DE&sex=T&age=Y15-74&unit=PC_ACT);
[reference metadata](https://ec.europa.eu/eurostat/cache/metadata/en/lfsi_esms.htm)). In print the same break is a
vertical bar, and breaks are among the flags that "should not be omitted" ([Statistics Explained, symbols and
abbreviations](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Tutorial:Symbols_and_abbreviations)).
Where a change of rules is too large for a flag, Eurostat publishes two labelled series: the labour force tables made
under the old regulation were kept, frozen, with the letter "h" for historical added to their codes ([Eurostat,
correction for breaks in time
series](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=EU_labour_force_survey_-_correction_for_breaks_in_time_series)).
Revisions are kept as vintages: in the St. Louis Fed's ALFRED each value has "the time period it applies to, the time
period it is true for, and the date that the information was entered into the database" ([ALFRED, capturing
data](https://alfred.stlouisfed.org:443/docs/alfred_capturing_data.pdf), summary). ALFRED's help page, opened in the
second pass, calls it "a collection of vintage versions of U.S. economic data" that makes it possible "to gather data as
reported by a source on past dates in history" ([ALFRED help](https://alfred.stlouisfed.org/help)).

**Official geography makes identity the first decision.** The ONS's policy for UK statistical geographies gives each
area a nine-character code with "no other intelligence in the code". A new code is made "only when a change occurs to
the boundary of an area instance", since "name changes alone do not initiate a code change for the area instance", and
reuse is forbidden in so many words: "Codes cannot be re-used. The re-use of codes is bad practice and presents risks to
the analyses of time-series geographic data." The policy sets no minimum size of change, "because the interpretation of
such a rule would be inconsistent" ([ONS, Coding and Naming Policy for UK Statistical
Geographies](https://www.ons.gov.uk/file?uri=/methodology/geography/geographicalproducts/namescodesandlookups/codehistorydatabasechd/codingandnamingpolicyforukstatisticalgeographies.zip)).
Redundant codes are archived with their dates and their relation to what replaced them, and the Code History Database
holds the history of changes from 1 January 2009 ([ONS, Code History
Database](https://www.ons.gov.uk/methodology/geography/geographicalproducts/namescodesandlookups/codehistorydatabasechd)).
The same code therefore guarantees the same area in the UK, and only there. Eurostat's NUTS does have a threshold. A
boundary shift "involving less than 1% of the population" is recorded and changes nothing; a larger one gives a new code
under the same name; a renamed region keeps its code; and a code has come back when a merger was undone ("NO072 =
ex-NO072 (pre-2020)") ([Eurostat, NUTS 2021 to NUTS 2024
workbook](https://ec.europa.eu/eurostat/documents/345175/629341/NUTS2021-NUTS2024.xlsx/2b35915f-9c14-6841-8197-353408c4522d?t=1717505289640)).
Norway's municipality list let Stavanger keep its code through a merger that changed its extent ([KLASS, changes in
classification 131](https://data.ssb.no/api/klass/v1/classifications/131/changes.json?from=2019-01-01&to=2020-01-02)).
"The same code" is three different promises in three registers, so an identity rule has to be written down. NUTS ties
each version to a numbered regulation and to the years it applies to (NUTS 2021 for 2021 to 2023, NUTS 2024 for 2024 to
2026) and publishes a list of changes for each pair of versions, in which a successor is written as an equation,
"PT1A0 + PT1B0 = ex-PT170, recalculation by NSI". After an amendment a country "has to replace historical data by time series
based on the new regional breakdown within 2 years", subject to "a feasibility evaluation" ([Eurostat, NUTS
history](https://ec.europa.eu/eurostat/web/nuts/history)). The US historical GIS, NHGIS, names the two honest answers to
"can I compare these years": tables linked by name and code, with a warning that "a single unit code may refer to
distinctly different areas at different times", and tables re-estimated onto fixed boundaries with lower and upper
bounds on each estimate ([NHGIS, time series tables](https://www.nhgis.org/time-series-tables), summary). Where a
boundary ran in a given year is data that changes, the neighbouring problem; what carries over to an ontology is the
identity rule, and the fact that the list of areas is itself a classification, a list delivered as rows that defines
what every statistic is about.

**The large curated ontologies treat the ontology as a published product, and their unit of time is the release.** The
Gene Ontology releases monthly ([GO
downloads](https://github.com/geneontology/geneontology.github.io/blob/master/_docs/download-go-annotations.md)) and
tells users that "it is essential to provide a release version when citing the GO" ([GO
FAQ](https://github.com/geneontology/geneontology.github.io/blob/master/_docs/faq.md)). The OBO Foundry's principles are
promises a machine checks: released files "MUST NOT be changed", version addresses resolve "in perpetuity", and "If a
proposed change to the definition would substantially change its referents, then a new term with new IRI and definition
MUST instead be created" ([OBO Principle
4](https://github.com/OBOFoundry/OBOFoundry.github.io/blob/master/principles/fp-004-versioning.md); [OBO Principle
19](https://github.com/OBOFoundry/OBOFoundry.github.io/blob/master/principles/fp-019-term-stability.md)). A retired term
stays, flagged, with a reason code and a pointer to its replacement where one exists. Often none does: in the Gene
Ontology's editors' file on 17 November 2026, **10,517 of 48,448 terms (21.7%) were obsolete, and 55.7% of those named
neither a replacement nor a candidate** (the research session's own count over
[go-edit.obo](https://github.com/geneontology/go-ontology/blob/master/src/ontology/go-edit.obo)). Change is announced
before it applies. OBO asks for at least seven days' notice; the disease ontology Mondo tags a term "scheduled for
obsoletion on or after" a date at least two months ahead and publishes three machine-readable change files with every
release ([OBO Principle
13](https://github.com/OBOFoundry/OBOFoundry.github.io/blob/master/principles/fp-013-notification.md); [Mondo editors'
guide](https://github.com/monarch-initiative/mondo/blob/master/docs/editors-guide/merging-and-obsoleting.md); [Mondo
changelog
schema](https://github.com/monarch-initiative/mondo/blob/master/docs/editors-guide/changelog-metadata-schema.md));
SNOMED's terminology server holds a future-dated version back until its day
([Snowstorm](https://github.com/IHTSDO/snowstorm/blob/master/docs/code-systems-and-branches.md)). schema.org is the
counter-example. It advises unversioned use and concedes that "term definitions often evolve gradually over time"
([schema.org, How we work](https://github.com/schemaorg/schemaorg/blob/main/docs/howwework.html)), which works for
markup on web pages and would not for rules that judge data. None of these projects expresses validity periods inside
the ontology, and the Gene Ontology retired its SPARQL endpoint in late 2026 with "No replacement SPARQL endpoint is
planned" ([GO archive](https://geneontology.org/docs/go-archives/)). Its users consume files, an API and release notes.

**HR and ERP systems are where ordinary users meet effective dating, and three vendors teach one model in different
words.** The second pass read the documentation of Oracle PeopleSoft, Oracle Fusion HCM and SAP's HR master data;
Workday's own pages were refused. HR effective dating is about instances (a worker's job, a department's manager), so it
belongs to the neighbouring problem of data that changes. It is reported for its conventions, which a register of
definitions shares. All three teach "now" as the divider. PeopleSoft sorts a record's rows into three types by the
system date: one current row, the row dated nearest to today without passing it ("Only one row can be the current row"),
history rows before it and future rows after it ([PeopleSoft, Using Effective
Dates](https://docs.oracle.com/cd/E24150_01/pt851h2/eng/psbooks/tupa/htm/tupa05.htm)). A row therefore moves from future
to current to history without anyone touching it, which is simple to explain and easy to get wrong in a report run
later. All three also name two kinds of change by what they do to history. One adds to it: PeopleSoft's new dated row,
Oracle's Update ("you insert a physical record in the object's history"), SAP's Create and Copy ("A new record is
created while retaining the old record"). The other rewrites it. PeopleSoft's Correct History mode "allows you to change
or correct any row and insert new rows regardless of the effective date", and "is available only to users with the
proper permission"; its two everyday modes, Update/Display and Include History, let only future rows be changed, and a
shaded button says which mode the page is in. Oracle's Correct edits a record in place, after which "Because you
corrected the object, no change history exists". SAP's Change means "You overwrite the old one", and "its history is not
updated" ([Oracle, updating and
correcting](https://docs.oracle.com/en/cloud/saas/human-resources/faucf/what-s-the-difference-between-updating-and-correcting-a-date.html);
[Oracle, examples of
correcting](https://docs.oracle.com/en/cloud/saas/human-resources/faucf/examples-of-correcting-date-effective-objects.html);
[SAP, Processing HR Master
Data](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/fd36e153a217424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002)).
In each product the rewrite is the guarded or the less convenient path, and in none does a correction leave a trace in
the dated records themselves; SAP keeps a separate log of "who (which employee) made changes to infotype records, and
when" ([SAP, logs of changes to infotype
records](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/6436e153a217424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002)).
These systems are effective-dated on one axis. The second, when the system was told, sits outside the record or nowhere,
with one exception known only second-hand: Microsoft's documentation of its connector shows every request to Workday for
worker data carrying both an `As_Of_Effective_Date` and an `As_Of_Entry_DateTime` ([Microsoft Learn, Workday integration
reference](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/workday-integration-reference)).

**SAP declares what a timeline may look like, the products write an interval in different ways, and the future-dated row
is the common trap.** SAP makes the shape of a history a declared property of each kind of record, its time constraint.
Under constraint 1 "exactly one valid infotype record must exist" at every moment and records "must not overlap"; under
2, "No more than one valid record can exist at any one time"; under 3, "Any number of valid records can exist at any one
time" ([SAP, Time Constraints in HR Master
Data](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/cd88dd53c88c424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002)).
The system checks the rule on entry and repairs the neighbouring records itself, "automatically delimiting data records
or issuing error messages", and the rule decides what deleting means: delete a record under constraint 1 and "the
previous record is automatically extended". SNOMED CT ("Only one concept record with the same id field is current at any
point in time") and Oracle's file loader ("no break in the dates can occur") declare rules of the same kind. The
interval itself is written in ways that cannot be mixed safely, as the table shows: half of the systems read end a
period on the day the next one starts, and half on the day before. Kimball Group's own pages use both ([Kimball, Slowly
Changing Dimensions, Part 2](https://www.kimballgroup.com/2008/09/slowly-changing-dimensions-part-2/); [Design Tip
80](https://www.kimballgroup.com/2006/06/design-tip-80-adding-a-row-change-reason-attribute/)). A design has to pick one
convention and say, wherever an end date is shown, whether that day is in or out.

| System | Interval written as | Is the end day included? | Open end |
|---|---|---|---|
| SNOMED CT | A start only (`effectiveTime`) | The row holds until the next row | None needed |
| PeopleSoft | A start only (`EFFDT`), with a sequence number within the day | The row holds until the next row | None needed |
| legislation.gov.uk, in its XML | A start and an end | No: the end is the day the next version starts | No end attribute |
| KLASS | `validFrom` and `validTo` | No: "from is inclusive and to is exclusive" | `validTo` absent |
| Oracle Fusion HCM | Effective start and end dates | Yes: the end is "the day before" the next start | Blank on screen; 31 December 4712 in files |
| SAP HCM | `BEGDA` and `ENDDA` | Yes, as far as the pages show | 31 December 9999 |
| EUR-Lex | "Date of effect" and "Date of end of validity", each a list | Yes, read as last days | "No end date" |
| NUTS | Whole years | Yes | "2027-" |

The future-dated row is where users are caught. In Oracle a future-dated change can block a present action: "to end this
worker's assignment before the promotion takes effect, you must first delete the promotion". A back-dated update is
inserted between existing records and does not carry forward, so the user corrects each later record by hand. And the
file loader's default mode replaces later records, with the vendor's own warning that it "may have unexpected
consequences if you upload less than the complete data for a record" ([Oracle, Date
Effectivity](https://docs.oracle.com/en/cloud/saas/human-resources/faucf/date-effectivity.html); [Oracle, examples of
updating](https://docs.oracle.com/en/cloud/saas/human-resources/faucf/examples-of-updating-date-effective-objects.html);
[Oracle, updating objects with future-dated
records](https://docs.oracle.com/en/cloud/saas/human-resources/fahdl/options-for-updating-date-effective-objects-with-future-dated.html)).
In SAP, copying a record without changing its start date overwrites the record copied ([SAP, Copying an Infotype
Record](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/8b37e153a217424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002)).
Two more conventions carry over to rules. A reference to a dated lookup is resolved as of the referring record's date
and not today's: SAP's control tables are dated, and "the system reads the table record which is valid on the start
date", while PeopleSoft's query tool can ask for the rows "that were effective at the same time as some other record"
([SAP, Time-Dependent Control
Tables](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/0ea2e2539c70424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002);
[PeopleSoft Query, effective date
criteria](https://docs.oracle.com/cd/E24150_01/pt851h2/eng/psbooks/tpsq/htm/tpsq04.htm)). And a change in the past sets
off a recomputation from a date the system works out: SAP's payroll shows it on each employee's record as the "Earliest
Master Data Change Since Last Payroll Run" ([SAP, Process HR Master Data in the Payroll
Past](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/9937e153a217424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002)).

**Finance and engineering are still the thinnest part of this evidence.** Neither pass searched them properly. For the
neighbouring problem of an organisation that changes, Workday has a task named "View Org Chart As Of", and its training
material separates the effective date from the entry date, "The administrative date when the transaction was recorded"
([Workday admin
guide](https://doc.workday.com/admin-guide/en-us/manage-workday/organizations/organization-charts/lah1480533274925.html),
summary; [Miami University, Workday date
concepts](https://miamioh.teamdynamix.com/TDClient/1813/Portal/KB/ArticleDet?ID=168151), summary). ChartHop's "Time
Travel" changes the colour of its bar when the view is not today
([ChartHop](https://www.charthop.com/resource/time-travel-color-update), summary). In finance, read first-hand in the
first pass: an investment data platform separates the two times by name in every call, `effectiveAt` and `asAt` ([LUSID
SDK](https://github.com/finbourne/lusid-sdk-python/blob/main/sdk/docs/PortfoliosApi.md)); Goldman Sachs' open-source
Reladomo calls them business time and processing time and states that "because rows are never deleted, we never lose
history" ([Reladomo
tour](https://github.com/goldmansachs/reladomo-kata/blob/master/reladomo-tour/tour-doc/src/docbook/bitemporal-intro.xml));
and machine-readable accounts keep a restatement as an extra fact on a restatement axis whose member names the cause
([XBRL US Data Quality Committee,
DQC_IFRS_0092](https://github.com/DataQualityCommittee/dqc_us_rules/blob/master/docs/ESEF/DQC_IFRS_0092/DQC_0092.md)).
Recalled and not checked against any source in either pass: the US accounting taxonomy's dated deprecation labels and
typed links to replacement elements; and, in engineering configuration management, effectivity by serial number or lot
(a change that takes effect "from unit 105" before any date is known), change orders that carry a reason and a
disposition for existing stock, and separate as-designed, as-built and as-maintained configurations.

| Pattern | Where to see it | What it shows | Evidence |
|---|---|---|---|
| A provision at a date, the mode announced | [legislation.gov.uk, dated provision](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2019-02-12) | The date in the path; the "What Version" box; a strip of 32 dated versions; the status line "Point in time view as at 12/02/2019" | read, and seen in a browser |
| A date that falls between two changes | [the same provision at 2020-06-01](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2020-06-01) | The asked-for date as a marker, the version that answers it highlighted | read |
| Known changes not yet applied | [legislation.gov.uk, the latest version](https://www.legislation.gov.uk/ukpga/1970/9/section/42) | "View outstanding changes", which opens a list of effects yet to be applied | read |
| Notes that name the authority for each change | [legislation.gov.uk, annotated page](https://www.legislation.gov.uk/ukpga/1983/2/part/V/crossheading/interpretation/2001-02-16) | "S. 202 applied (N.I.) (25.4.1998) by S.I. 1998/1126, art. 6, Sch. 2" | read |
| Text not yet in force | [legislation.gov.uk, Equality Act 2010, s. 14](https://www.legislation.gov.uk/ukpga/2010/15/section/14) | A one-point timeline reading "Prospective", and the label above the text | read |
| Every effect on one Act as a table | [legislation.gov.uk, changes affecting an Act](https://www.legislation.gov.uk/changes/affected/ukpga/1970/9?results-count=10) | What changed, the type of effect, what made it, and whether it has been applied | read |
| A consolidated text that says where each fragment came from | [EUR-Lex, a consolidated version](https://eur-lex.europa.eu/eli/reg/2006/1893/2025-01-01) | A dated list of all versions, the notice that the text has no legal effect, a marker before each fragment | read |
| A provision's timeline; any two dates compared | [eCFR reader aids](https://www.ecfr.gov/reader-aids/using-ecfr/reading-ecfr-content); [the data behind the timeline](https://www.ecfr.gov/api/versioner/v1/versions/title-1.json) | How the timeline and comparison are reached and read; one row for each version of each section, substantive or not | screens: summary, not reachable; data service: read |
| A state named by the last event taken in | [US Code, prior release points](https://uscode.house.gov/download/priorreleasepoints.htm) | "Public Law 118-250 (01/04/2025), except for Public Law 118-159" | summary |
| The state on a date as one rule | [SNOMED CT concept file specification](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/component-release-file-specification/4.2-file-format-specifications/4.2.1-concept-file-specification) | Identifier, effective time, active flag | read |
| One concept's rows growing release by release | [SNOMED CT, history mechanism](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/release-types-packages-and-files/3.1-common-features-of-all-release-files/3.1.5-history-mechanism) | A worked example of four rows over four releases | read |
| Which successor link each retirement reason may take | [SNOMED CT Editorial Guide](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-editorial-guide/readme/authoring/general-modeling/changes-to-components) | A table of reason, kind of link and number of targets | read |
| What became of an identifier | [RxNav history status](https://lhncbc.nlm.nih.gov/RxNav/APIs/api-RxNorm.getRxcuiHistoryStatus.html) | Six statuses, among them Active, Obsolete and Remapped | summary |
| Codes valid on a date; changes between two dates | [Statistics Norway, KLASS, codes at a date](https://data.ssb.no/api/klass/v1/classifications/104/codesAt.json?date=2020-01-01); [changes between two dates](https://data.ssb.no/api/klass/v1/classifications/131/changes.json?from=2019-01-01&to=2020-01-02) | One classification's answer for one date; the 317 code changes of one reform as old code, new code and date | read: called live |
| Old to new in both directions, and changes only | [Census, NAICS concordances](https://www.census.gov/naics/concordances/concordances.html); [Eurostat, NACE tables](https://ec.europa.eu/eurostat/web/nace/correspondence-tables) | Full and changes-only maps | summary; the Eurostat page was read, and the tables it links to were not opened |
| Versions with validity windows and lists of changes | [Eurostat, NUTS history](https://ec.europa.eu/eurostat/web/nuts/history) | NUTS 2021 for 2021 to 2023, NUTS 2024 for 2024 to 2026 | read |
| Old code beside new code, with the kind of change | [Eurostat, NUTS 2021 to NUTS 2024 workbook](https://ec.europa.eu/eurostat/documents/345175/629341/NUTS2021-NUTS2024.xlsx/2b35915f-9c14-6841-8197-353408c4522d?t=1717505289640) | A "Change" column ("New region", "Boundary shift", "Code change", "art. 5(2a)", "Name change", "Merged", "Split") and a successor written as an equation | read |
| One unit's boundaries over time | [A Vision of Britain, a unit's boundaries](https://visionofbritain.org.uk/unit/10041790/boundary) | Each dated boundary of one unit on a map | summary |
| Same name or same area | [NHGIS, time series tables](https://www.nhgis.org/time-series-tables) | Nominal against standardised series | summary |
| A series as published on a past date | [ALFRED, real GDP](https://alfred.stlouisfed.org/series?seid=GDPC1) | Two vintages as two sets of bars, each named by its date in the legend | seen in a browser |
| Current, history and future rows; three page modes | [PeopleSoft, Using Effective Dates](https://docs.oracle.com/cd/E24150_01/pt851h2/eng/psbooks/tupa/htm/tupa05.htm) | Two tables and a worked example | read |
| A history as dated records, with changes entered ahead of time | [Oracle, Date Effectivity](https://docs.oracle.com/en/cloud/saas/human-resources/faucf/date-effectivity.html) | One object as four records with start and end dates; a change entered months before it takes effect | read |
| What a timeline may look like, declared for each kind of record | [SAP, Time Constraints in HR Master Data](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/c6c3ffd90792427a9fee1a19df5b0925/cd88dd53c88c424de10000000a174cb4.html?locale=en-US&state=PRODUCTION&version=2025.002) | Constraints 1, 2 and 3 and four special ones | read |
| A parameter as a table of dated values, each with its legal reference | [OpenFisca Legislation Explorer](https://fr.openfisca.org/legislation) | Periods, values, references, and "not in effect" | source read; live address not opened |
| A retired term with its reason, replacement and issue | [OBO Academy, obsoleting a term](https://oboacademy.github.io/obook/howto/obsolete-term/) | The deprecation wizard step by step | source read |
| Each kind of change as a before-and-after picture | [KGCL visual guide](https://github.com/INCATools/kgcl/blob/main/src/docs/change-types.md) | Rename, move, obsolete with replacement | read as source; the diagrams were not seen drawn |

Read together, and checked against the pages, the publishers agree on seven habits, two of them narrower than the first
pass had them. Identifiers are not reused, and what counts as a new identifier is decided first. The rule differs
between registers (a boundary change and never a rename in the UK, a threshold in NUTS, where a code has also come
back), so it has to be stated. Nothing is deleted; it is ended, inactivated or superseded. That holds for the
publishers, with one stated exception on legislation.gov.uk, and not for HR software, where every product has a second
action that rewrites history. A retirement carries a coded reason and a typed link to its successor, and "no successor"
is a normal outcome; SNOMED CT has both in full, NUTS has a short list of labels and an equation, and KLASS has neither.
A change names the authority that made it wherever something outside the register causes it: an Act, a regulation, a
Statutory Instrument. Where the publisher is itself the authority, as SNOMED International or a statistical office is
for its own lists, the record carries a date and at most a coded reason. Change is published as a product, as a list of
what changed, and announced before it applies. "As of" is part of the address, and the page says which mode it is in; in
HR software the date is a field on a screen. And two clocks are shown apart, when a change takes effect and when the
system took it in: a "valid" date beside a "modified" one in legislation.gov.uk's data, an amendment date beside an
issue date in the eCFR's, a version's window beside its last-modified date in KLASS. The pages add two habits the first
pass did not list. A correction is a different act from a change and is named as one: EUR-Lex lists "Corrected by" apart
from "Amended by", and each HR product has its own verb for it. And the shape of a timeline is declared up front
(exactly one record at every moment, at most one, any number), which lets the system refuse nonsense and decides what
deleting means. The best of them add one more, which is to say what the view cannot show: a base date before which
history is incomplete, a past view that cannot list the changes not yet applied, a notice that a convenient text is not
the authoritative one, an error bound on an estimate.

**The split that explains the differences is between registers that publish and systems that are operated.** A publisher
(legislation, SNOMED CT, Eurostat, the ONS, Statistics Norway) issues states that others have already relied on, so it
cannot take anything back. Nothing is deleted, a correction is labelled as a correction, and the date goes in the
address so that a citation stays good. An operated system serves the people who maintain it, so it offers a rewrite,
guards it with a mode, an action name or a permission, and treats the date as something set on a screen. A tool that is
edited by its owners and also relied on by readers needs the publisher's rules for whatever readers have seen. smaltfl
is such a tool, and it already takes the publisher's side: a day that was published is restated by a recorded decision
and is never rewritten in place.

One distinction runs through all of it, and it is the one smaltfl's maintainers draw. Legislation, the clinical code
systems, the statistical classifications and the curated ontologies version **definitions**: what a rule says, what a
code means, which kinds of thing exist. The HR systems, the historical GIS and the vintage databases version **instances
and values**: who held which job, where a boundary ran, what a figure was. The two use the same machinery, a dated row,
and they are different problems. Between them lies a grey area every one of these fields has had to manage: **a list
that arrives as data but defines the business**. A code list, a classification, a taxonomy of reportable items or a
catalogue of controls is delivered as rows like any other file, yet a new, retired or redefined entry changes what is
being measured or meant. SNOMED CT and NACE are such lists, as the Gene Ontology is for the databases annotated with it,
and their release formats, reason codes, successor links and correspondence tables exist because a change to the list
behaves like a change of definition. It is also, as the section on analysis shows, where breaks in series come from.

### Data platforms log who changed what; none found reads past data under past rules

**Palantir Foundry, the product whose "ontology" is nearest in kind to smaltfl's, keeps a recorded-time history of
definitions and nothing more, and its own documentation says so.** Ontology Manager's History tab shows "a list of all
saved Ontology changes with details on when the changes were made and the user who applied them", in which "Each entry
in the edits history corresponds to a single instance of a user saving changes". An object type can be restored to an
earlier entry; the restore undoes the later changes and takes effect once it is saved ([Palantir, Review and restore
changes](https://www.palantir.com/docs/foundry/ontology-manager/restore-changes/)). The screen, viewed in the second
pass, is a list of dated saves, each with the resources it touched and a badge, "Created" or "Edited", and no message or
reason on an entry; one object type's own history draws a changed value as the old one struck through beside the new one
([history screen](https://www.palantir.com/docs/resources/foundry/ontology-manager/review-restore-history-button.png);
[one object type's
history](https://www.palantir.com/docs/resources/foundry/ontology-manager/review-restore-entity-history-button.png)).
Changes can be made on a branch and reviewed as a proposal, which is "analogous to a Pull Request in a version control
system" and carries a title, a description, a task for each resource, comments and a changelog; a plain save is not
documented as taking any message ([Palantir, Review ontology
proposals](https://www.palantir.com/docs/foundry/ontologies/review-ontology-proposals/); [Palantir, Branching the
ontology](https://www.palantir.com/docs/foundry/ontologies/branching-ontology/)). The public SDK, read first-hand,
confirms the limit: the call that loads the ontology's definitions takes a branch and no date, version or history
parameter ([foundry-platform-python,
Ontology](https://github.com/palantir/foundry-platform-python/blob/41f686a9fc44cb8341272db6430b2e011ba9bbcb/docs/v2/Ontologies/Ontology.md)).
The documentation's one direct statement about the past is a denial. Scenarios, its what-if sandboxes, "are not data
versioning tools. They cannot provide a snapshot of your Ontology at a historical point in time and should not be used
for that purpose" ([Palantir, Scenarios](https://www.palantir.com/docs/foundry/ontology/overview-ontology-scenario/)). A
search of the 36 pages read found no effective-from date on any kind of definition and no way to view the ontology at a
past date. The one forward date a definition carries comes with deprecation, the best-specified change in the product: a
resource of any kind that is marked deprecated has "A description for why it is being deprecated", "A deadline for when
it is expected to be deleted from the system" and, optionally, "The resource that is meant to replace the one that is
deprecated" ([Palantir, Statuses](https://www.palantir.com/docs/foundry/object-link-types/metadata-statuses/);
[DeprecatedPropertyTypeStatus](https://github.com/palantir/foundry-platform-python/blob/41f686a9fc44cb8341272db6430b2e011ba9bbcb/docs/v2/Ontologies/models/DeprecatedPropertyTypeStatus.md)).
When a schema breaks, a save is blocked until a migration is defined, and the migration moves, casts, backfills or drops
the edits users had made, which is the opposite of reading old data under old definitions ([Palantir, Manage schema
changes](https://www.palantir.com/docs/foundry/object-edits/schema-migrations/)). Below the ontology the product does
have what the ontology lacks: a dataset can be inspected "at an earlier point in time" in a beta Time Travel view, and
value types carry explicit versions ([Palantir, Time
Travel](https://www.palantir.com/docs/foundry/dataset-preview/time-travel/); [Palantir, Value type
versions](https://www.palantir.com/docs/foundry/object-link-types/value-types-versions/)). Foundry also keeps the
maintainers' two kinds of change apart, and says which question each record answers. The history of definitions is the
History tab. The history of objects is separate and opt-in: "Edit history records every edit to an object, regardless of
how the edit was made", and switching it off deletes it for good. And the why is captured for decisions about data: "The
action log is designed to capture decisions made by submitting actions and make these decisions available as data in the
Ontology" ([Palantir, Enable user edit history](https://www.palantir.com/docs/foundry/object-edits/user-edit-history/);
[Palantir, Action log](https://www.palantir.com/docs/foundry/action-types/action-log/)). Each Action Log object is
stamped with the "Action type version", a "Version number that auto-increments each time an action type is updated", so
a recorded decision names the version of the definition that produced it. The record of an edit itself has a user, a
time and an action, and no reason field
([ObjectEditHistoryEntry](https://github.com/palantir/foundry-platform-python/blob/41f686a9fc44cb8341272db6430b2e011ba9bbcb/docs/v2/Ontologies/models/ObjectEditHistoryEntry.md)).

**Among catalogs, two go beyond an audit log, and one open-source system has the model without the product.** DataHub
shows a dataset's schema "at any given version" with a per-field view of when each field last changed. Its Timeline API
computes typed change events whose description is "produced by the Differ", not written by a person, and gives each set
of changes a computed semantic version. Glossary terms have had versions since its cloud release of 1 June 2026, through
the API; since the release of 4 November 2026 a new version is made from the term's menu as a draft, and "The current
version stays live until the draft is published". The moment of publication is the only date of effect there is, and it
cannot be set ahead or back. Reasons are optional notes in four places (a proposal, a version's comment, a
certification, a free-text "Decision Log" document), none of them required and none on the change event itself. A linear
timeline of a schema's changes and a viewer for the difference between two versions are listed as planned, and a
point-in-time read of metadata exists only in a developer tool ([DataHub, Schema
History](https://docs.datahub.com/docs/schema-history); [Timeline
API](https://docs.datahub.com/docs/dev-guides/timeline); [release notes
v1.1.0](https://docs.datahub.com/docs/managed-datahub/release-notes/v_1_1_0); [release notes
v2.4.0](https://docs.datahub.com/docs/managed-datahub/release-notes/v_2_4_0); [Change
Proposals](https://docs.datahub.com/docs/managed-datahub/change-proposals); [DataHub
Lite](https://docs.datahub.com/docs/datahub_lite)). OpenMetadata numbers every entity's versions, raising the number by
0.1 for a backward-compatible change and by 1.0 for an incompatible one, and lists old and new values per field ([Data
Asset Versioning](https://docs.open-metadata.org/v2.0.x/how-to-guides/guide-for-data-users/versions); [entityHistory
schema](https://github.com/open-metadata/OpenMetadata/blob/8a7d55493a1605c03100c4914051f4308228ef34/openmetadata-spec/src/main/resources/json/schema/type/entityHistory.json)).
Its ontology releases, which the first pass found only as decision records on the main branch, are now in the published
documentation under an unreleased version label: "Edits to an ontology collect as unpublished changes on its working
draft. Publishing captures them as a numbered, immutable release", and "Only one release is Active at a time". The API
lists the sealed releases, compares one with another, keeps a list of events from captured to activated, and activates a
release or rolls back to an older one; the semantic version and the release notes are both optional ([OpenMetadata,
ontology concepts](https://docs.open-metadata.org/v2.1.x-SNAPSHOT/how-to-guides/ontology/concepts); [ontology API
reference](https://docs.open-metadata.org/v2.1.x-SNAPSHOT/how-to-guides/ontology/api)). The decision records add that a
release is sealed with a SHA-256 hash and that only the active release is served ([decision record on sealed
releases](https://github.com/open-metadata/OpenMetadata/blob/8a7d55493a1605c03100c4914051f4308228ef34/docs/decisions/2026-10-14-ontology-releases-seal-canonical-sql-members.md);
[decision record on the serving
graph](https://github.com/open-metadata/OpenMetadata/blob/8a7d55493a1605c03100c4914051f4308228ef34/docs/decisions/2026-10-15-fuseki-holds-only-the-active-ontology-release.md)).
This is the closest published design to a frozen, reviewed, numbered version of a whole ontology, and it still has one
axis: a release applies from the moment someone activates it, and the eleven pages read contain no effective date, no
"as of" and no query of a past release other than by export or comparison. One default deserves notice: the history of
approval runs is deleted after thirty days unless the setting is changed ([OpenMetadata, data
retention](https://docs.open-metadata.org/v2.1.x-SNAPSHOT/how-to-guides/admin-guide/data-retention)). Collibra, Alation,
Atlan, Microsoft Purview and Google Dataplex showed only change logs and approval workflows in what one search each
returned, which does not rule out more ([Collibra, About
history](https://productresources.collibra.com/docs/collibra/latest/Content/History/co_about-history.htm), summary).
Egeria, an open-source project, is the only metadata system found with effective-from and effective-to dates on every
element beside "what was known at a particular moment in time", though its own conformance profile for effectivity
dating reads "Not yet implemented" ([Egeria, effectivity
dates](https://github.com/odpi/egeria-docs/blob/d55aa0cfc40d95031265d474e39277e28282b0fb/site/docs/features/effectivity-dates/overview.md);
[effectivity dating
profile](https://github.com/odpi/egeria-docs/blob/d55aa0cfc40d95031265d474e39277e28282b0fb/site/docs/guides/cts/repository-workbench/profiles/effectivity-dating.md)).
Egeria also has the only first-class business event found. A Context Event "describes something that happened - in the
past, now, or expected in the future - that affects the performance of systems, people and organizations, and hence the
data they produce. Data does not misbehave for no reason". It has planned and actual dates, links to the data it
affected, and reference dates that can "switch on the governance definitions that implement the regulation and to switch
off the ones it supersedes" ([Egeria, Context
Event](https://github.com/odpi/egeria-docs/blob/d55aa0cfc40d95031265d474e39277e28282b0fb/site/docs/concepts/context-event.md)).

**Transformation tools and storage engines version code and tables, and serve one current definition.** dbt's model
versions keep an old, a latest and a prerelease version built side by side until a `deprecation_date`, which is
versioning an interface for its consumers. Its guidance says that "fixing a bug in an existing column's calculation"
needs no new version, and its semantic layer states that a changed metric "is refreshed everywhere it's invoked" ([dbt,
model
versions](https://github.com/dbt-labs/docs.getdbt.com/blob/f7cd3a0f0531fb5ae512664f1d0520155728aedd/website/docs/docs/mesh/govern/model-versions.md);
[dbt Semantic
Layer](https://github.com/dbt-labs/docs.getdbt.com/blob/f7cd3a0f0531fb5ae512664f1d0520155728aedd/website/docs/docs/use-dbt-semantic-layer/dbt-sl.md)).
Tableau Pulse does the same: "all metrics based on that definition will also reflect the change" ([Tableau
Pulse](https://help.tableau.com/current/online/en-us/pulse_create_metrics.htm)). **The quiet default across this
category is that history is restated without a mark.** Apache Iceberg is the clearest precedent for past data in its
past shape: a time-travel query to a snapshot or a tag uses "the snapshot's schema", while a branch uses the current one
([Iceberg, Spark queries](https://iceberg.apache.org/docs/latest/spark-queries/)). It stops at column names and types,
and when snapshots are expired the default keeps five days of them ([Iceberg
configuration](https://iceberg.apache.org/docs/latest/configuration/)). Delta Lake's past versions last thirty days of
log and seven of data files unless retention is raised, and its vendor warns: "Don't use table history as a long-term
backup solution for data archival" ([Delta Lake
documentation](https://github.com/delta-io/delta/blob/15b622a40c0a240ddc180ab6998ea0c261b52f64/docs/src/content/docs/delta-batch.mdx);
[Azure Databricks, table history](https://learn.microsoft.com/en-us/azure/databricks/delta/history)). Only the
Git-for-data products hold schema and data in one commit; Dolt's diff table flags, for each commit, whether "schema,
data, or both changed" ([Dolt
README](https://github.com/dolthub/dolt/blob/4105a0adc3c767e8b6ae667a4308715f0415140a/README.md)). Their history is
recorded time only and their reason is a commit message. Data observability tools keep rules as code in Git and results
in the product, and nothing read puts "this rule's threshold changed here" on the same timeline as the failures
([Elementary, config as
code](https://github.com/elementary-data/elementary/blob/3fbad8e84fd852ead32dd1537e1501cb811f3b02/docs/features/config-as-code.mdx)).
Monte Carlo, Bigeye, Anomalo and the master-data products (Informatica, Reltio, Semarchy, PoolParty) were not researched
at all.

The "context graph" wave of 2025 and 2026 names a record of why decisions were made, built from the traces agents leave
as they work ([Foundation Capital essay](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context),
summary). Its implementations capture operational decisions and not the history of definitions, and vendors use
"bi-temporal" and "context" well ahead of documented behaviour
([Solidatus](https://www.solidatus.com/blog/lineage-tools-forget-what-your-ai-model-saw/), summary). The nearest
verified machine records of "which rules judged this" are two. Open Policy Agent's decision log keeps for every decision
the input, the result, the time and the revision of each policy bundle used "at the time of evaluation" ([OPA, decision
logs](https://github.com/open-policy-agent/opa/blob/main/docs/docs/management-decision-logs.md)). And Foundry's Action
Log, as described above, stamps each recorded decision with the version of the action type that made it.

So the market splits the problem by layer and no product joins the layers. The history of definitions sits in catalogs
and Git, the history of data in storage engines, reasons in workflow tools and commit messages, business context in
documents. Four things were found in no product screen, and the second pass, reading the vendors' own pages, did not
find them either: the ontology shown over time; a second time axis for when a definition applies; past data read under
the definitions then in force; and a required reason, or a business event, bound to a change of definition. Where a
reason exists it is an optional note on a proposal, a release or a version.

#### Where smaltfl is already ahead

Set against this, smaltfl already does five things that no product read here does in one place. **It dates a change of
the rules on two axes, with a reason.** A change set carries the business day it takes effect from, an optional last
day, the moment it was recorded, who made it and why (`ChangeSet`, `src/core/document.ts`). Among the products read only
Egeria's model has both axes on a definition, and Foundry's nearest equivalent is a deprecation deadline. **It binds the
rules to the run.** Every manifest names a hash of the rules in force on the run's day (`rules/1`: the whole ontology,
the gates and each check step's switches) beside the flow, ontology and policy hashes, and verification checks it. None
of the data-quality result formats read embeds the rule a result was judged by. **It reads a past day under the rules of
that day as known then**, by replaying change sets (`changesOn` and `resolve`, `src/core/inforce.ts`), and under any
other version as a what-if that is never recorded. The market's nearest is a time-travel query that returns old columns.
**It restates in the open.** A back-dated change runs the days it reaches again, and one recorded decision with a
required reason restates them, with a sign-off even when no day changes (Q-190, Q-199), where dbt and Tableau Pulse
restate silently. **It compares two versions of one day** down to rows and cells and says whether the same rules ran.
The claim is bounded on both sides: absence was established only for the products actually read, and smaltfl's behaviour
is taken from a study of its code and ADRs at commit `c5cfa50`, in which nothing was run. The second pass did not change
the comparison. Reading Palantir's, DataHub's and OpenMetadata's own pages confirmed each absence for those three, and
found one near precedent for binding the rules to the run: the version number on each entry of Foundry's Action Log.

### Show change as sentences, two-date differences and rows of days; animate one step at most

A note on this section's footing too. The first pass reported every study from a search summary of its abstract. The
second pass read the main ones in full (the phone study, the graph study of structural and temporal encodings, the study
of choosing one's own time slices, the study of text on charts, a survey of graph experiments and a study of timeline
shape), read the earlier studies' abstracts in the data file of the dynamic-graph survey's own site, and looked at the
pictures: the survey site's thumbnails, the Timelines Revisited gallery, and screens of legislation.gov.uk, Wikipedia,
ALFRED, Grafana, Our World in Data, Palantir, DataHub and OpenMetadata. A study is marked "full text" or "abstract" by
how far it was read. Two older studies (Robertson et al. and Tversky et al.) and the literature on ontology-change tools
were not re-opened and keep their "summary" marks. Guidance from Nielsen Norman Group and the W3C and the product
documentation sources were read first-hand in the first pass unless marked.

#### Controlled studies favour static views, on phones too

The standard taxonomy of dynamic graph visualisation splits techniques first by how time is shown, "mapping time to time
in an animation" or "mapping time to space onto a timeline", and then into views placed side by side, stacked on top of
each other, or merged into one drawing ([dynamicgraphs.fbeck.com, the survey's
tags](https://dynamicgraphs.fbeck.com/data/authorized_tags.js); the journal version, [Beck et al.,
2017](https://diglib.eg.org/handle/10.1111/cgf12791), was not opened). The survey's own site is a count of how thin the
evidence is. Of its 162 publications 71 present a technique, and of those 71, 55 were evaluated by case study and 5 by a
user study ([dynamicgraphs.fbeck.com](https://dynamicgraphs.fbeck.com/); the second pass's count over [its data
file](https://dynamicgraphs.fbeck.com/data/generated/bib.js)). The controlled evidence leans one way. In a study of
dynamic graphs "small multiples gave significantly faster performance than animation overall and for each of our five
graph comprehension tasks", with animation ahead only on errors in saying which nodes or edges were added in the same
time slice ([Archambault, Purchase and Pinaud,
2011](https://research.monash.edu/en/publications/animation-small-multiples-and-the-effect-of-mental-map-preservati/),
abstract). For trends, "both static depictions of trends are significantly faster than animation, and the small
multiples display is more accurate" ([Robertson et al.,
2008](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf), summary); a secondary account gives 83.1 seconds
for animation against 45.7 for small multiples in analysis tasks ([course slides on the
study](https://faculty.cc.gatech.edu/~stasko/7450/11s/Talks/animation.pdf), summary). **On phones, a study of 96 people
found small multiples faster than a looping animation in seven of nine tasks**, by up to 2.8 times. Accuracy showed no
difference on five of the nine tasks and went each way on the others, and the people given the animation rated it easier
to use and felt more confident of their answers ([Brehmer et al., 2020](https://arxiv.org/pdf/1907.03919), full text).
The authors limit the finding to what they tested, sixteen small charts over 25 time steps, and doubt that either form
survives larger data on a phone. The reason animation loses is old: it breaks the principle that a graphic must be
accurately perceived, and it makes the reader remember earlier frames ([Tversky, Morrison and Betrancourt,
2002](https://hci.stanford.edu/courses/cs448b/papers/Tversky_AnimationFacilitate_IJHCS02.pdf), summary).

Three findings cut the other way and set the limits of the rule. A 2022 study of 68 students, on graphs of 35 to 45
nodes with four time slices, found automatic animation the most accurate of four ways of showing time (68.6% of answers
correct, a lead that was significant only over overlaid views at 62.1%) and views side by side the fastest (118 seconds,
against 128 for automatic animation). The authors put the result down to "the graph's size and limited number of
structural changes over time", call node-link drawings with automatic animation "the least practical of the approaches,
however, it also provides the best results", and report participants who "needed to 'screenshot every timestamp to look
at the different connections between the nodes'" ([Filipov et al., 2022](https://arxiv.org/pdf/2208.13716), full text).
Its follow-up found that side-by-side views "showed clear scalability issues in more realistic analysis contexts"
([journal
extension](https://research.tue.nl/en/publications/on-network-structural-and-temporal-encodings-a-space-and-time-ody/),
summary). Where a drawing's layout is not stable and the nodes that matter cannot be highlighted, "animation can improve
task performance when compared to the use of small multiples" ([Archambault and Purchase,
2016](https://cronfa.swansea.ac.uk/Record/cronfa20860), abstract). And showing the difference itself beats leaving the
reader to compare two states. Difference maps "produced significantly fewer errors when determining the number of edges
inserted or removed" and "were significantly preferred on all tasks", and staged, highlighted transitions outperformed
existing ways of moving through time "in terms of both task time and errors for several of these tasks" ([difference
maps](https://www.labri.fr/perso/bpinaud/diffmap), abstract;
[GraphDiaries](https://ieeexplore.ieee.org/document/6658746), abstract). The perceptual ground for all of it is change
blindness. A change away from the reader's focus goes unseen unless it is localised, and the remedies are to "Make one
change at a time" and to "dim the areas of the screen that do not change" ([NN/g, Change
Blindness](https://www.nngroup.com/articles/change-blindness-definition/)).

**A third option beat both in the comparison a history of definitions is asked for most.** In a study of 24 people on a
large touch display, letting the reader pick the moments to compare and see them side by side was more correct and
faster than both animation and small multiples for comparing a network's structure at two moments. For two distant
moments animation was 1.91 times slower and small multiples 2.07 times, and 87.5% of participants preferred it. For
finding a change inside an interval small multiples stayed as fast as anything, and 92% preferred them ([Lee,
Archambault and Nacenta](https://arxiv.org/html/2008.12747), full text). The evidence is narrow in the way that matters
here. A survey of 152 experiments on node-link diagrams found that "three quarters of studies use graphs with 100 nodes
and 200 edges or less", that only 22 used dynamic graphs, and that "Most studies use less than ten timeslices"
([Yoghourdjian et al.](https://arxiv.org/html/1809.00270), full text). None tests a reader following a history of typed,
explained changes.

#### The named temporal-graph techniques answer questions an ontology's history does not ask

The techniques with names (TimeArcs, Massive Sequence Views, parallel edge splatting, Matrix Cubes, Small MultiPiles,
alluvial diagrams, Time Curves) were built for dense networks that change constantly, such as software call graphs,
co-occurrence networks across a decade of text and the dense weighted networks neuroscientists study, and they were
validated by case studies: Matrix Cubes with two domain experts, Small MultiPiles with one group of neuroscientists,
TimeArcs and alluvial diagrams by worked examples ([Cubix](https://www.aviz.fr/Research/Cubix), summary; [Small
MultiPiles](https://www.microsoft.com/en-us/research/publication/small-multipiles-piling-time-explore-temporal-patterns-dynamic-networks/),
summary; [TimeArcs](https://github.com/CreativeCodingLab/TimeArcs)). An ontology that changes a few times a week sits at
the far sparse end of that space, which the surveys do not treat. A sparse history leaves an edge-density timeline
nearly empty, and an animation of it shows nothing in most frames. The survey site's thumbnails, looked at side by side
in the second pass at 100 pixels wide, make the same point by eye. The overlaid and matrix families are
three-dimensional stacks, cubes and dense textures. The ones a non-specialist could read are the difference views, one
node's own timeline and a timeline of edges drawn as bars, and those are the ones built around few changes on a stable
layout ([the survey site's difference views](https://dynamicgraphs.fbeck.com/?q=graph_difference)).

The same judgement holds for the ontology-specific research, which the second pass could not re-open: its hosts were out
of reach, and searches of arXiv's titles and abstracts found no study or survey of showing ontology, knowledge-graph or
schema evolution to readers ([arXiv search, ontology
evolution](https://arxiv.org/search/?query=ontology+evolution&searchtype=title&abstracts=show&order=&size=50)). A
systematic review counts **28 ontology-change visualisation tools, about 12 still available**, most showing a pairwise
difference as a list or a coloured tree, many never implemented ([Pernisch, Dijkstra and
Schlobach](https://www.semantic-web-journal.net/content/visualisation-ontology-changes-and-evolution-systematic-literature-review),
summary; some of these figures reached the research session through reviewer comments on a draft). The one comparison
that looked at scale found that a graph notation which colours every change scales poorly, its footprint growing with
the number of changes, and preferred the methods that summarise ([Chung, Pernisch and Schlobach,
2023](https://2023.eswc-conferences.org/wp-content/uploads/2023/05/paper_Pernisch_2023_Descriptive.pdf), summary). The
strongest user study found, with 36 ontology engineers, that listing applied changes with measures of their effect
improved understanding of a change's impact ([ChImp](https://doi.org/10.1016/j.websem.2022.100715), summary). A study
with taxonomy experts found that lines drawn between two side-by-side hierarchies were preferred for splits, merges,
moves and renames, and that folding both into one tree was least effective ([Sancho-Chavarria et al.,
2020](https://peerj.com/articles/cs-277), summary). Software history tells the same story. The animated views (Gource,
code_swarm) engage, and code_swarm's authors moved to a static storyline to convey the same information
([Gource](https://github.com/acaudwell/Gource); [Software Evolution
Storylines](https://scispace.com/pdf/software-evolution-storylines-20ikni2a7f.pdf), summary), while the views people
work in are a list of commits with messages, a diff, and blame.

#### What ships is list-first, and nine parts recur

The tools ontology and schema communities actually use present change as text. The Knowledge Graph Change Language
writes each change as a sentence (`rename GO:0005635 from 'nuclear envelope' to 'foo bar'`), and its visual guide pairs
each kind of change with a small before-and-after picture of the affected neighbourhood ([KGCL visual
guide](https://github.com/INCATools/kgcl/blob/main/src/docs/change-types.md)). The OBO build tool reports a diff as text
or Markdown ([ROBOT diff](https://github.com/ontodev/robot/blob/master/docs/diff.md)); Foundry's proposals show a
changelog of edits by resource ([Palantir, Review ontology
proposals](https://www.palantir.com/docs/foundry/ontologies/review-ontology-proposals/)); database schema comparison
groups results by action with unchanged objects hidden ([Microsoft schema
compare](https://learn.microsoft.com/en-us/sql/ssdt/how-to-use-schema-compare-to-compare-different-database-definitions)).
Where a graph must be compared with itself, the shipped designs agree: one stable layout, unchanged parts greyed,
changes outlined by kind, and next and previous buttons that walk the differences ([Unreal Engine diff
tool](https://dev.epicgames.com/documentation/en-us/unreal-engine/ue-diff-tool-in-unreal-engine);
[ConVer-G](https://github.com/VCityTeam/ConVer-G/blob/main/joss/paper.md)).

The second pass looked at the history screens of the three ontology and catalog products, and all three show history as
a list of dated saves beside or over the definition, never as a graph that changes. Palantir folds the edits of a save
under the part they changed and draws a changed value as the old one struck through beside the new one. DataHub puts the
history on the schema itself: a version picker, and on each field's row a note such as "Added in v0.0.0, 6 months ago"
or "Modified in v1.0.0". Its own diagram of an entity's timeline is five sentences on a vertical line, each with a
version number computed from the kind of change. OpenMetadata lists versions in a side panel and strikes removed items
through in place, and one entry in its documentation picture is the failure to avoid: a change description generated
from dozens of field paths run together, complete and unreadable ([Palantir, one object type's
history](https://www.palantir.com/docs/resources/foundry/ontology-manager/review-restore-entity-history-button.png);
[DataHub, audit view of a
schema](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/schema-history-audit-activated.png);
[DataHub, entity
timeline](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/timeline/timeline-conceptually.png);
[OpenMetadata, Versions
History](https://docs.open-metadata.org/public/images/how-to-guides/user-guide-for-data-stewards/v2.png)). The
counter-example was viewed too. A tool for versioned knowledge graphs draws the whole graph as dozens of dots in a dense
mass of lines and, beside it, the difference between two versions as a sparse drawing in red, green and grey. The second
is readable because it shows only what changed ([ConVer-G delta
view](https://raw.githubusercontent.com/VCityTeam/ConVer-G/main/joss/delta-viz.png)). No screen was found in any of the
three products that compares two arbitrary versions of an ontology or glossary side by side. DataHub lists a viewer for
the difference between two versions of a dataset as planned, and offers a comparison of two versions of a glossary term
to software agents only ([DataHub MCP server](https://docs.datahub.com/docs/features/feature-guides/mcp)).

For many versions at once two patterns exist. One is a matrix with "one row per table and one column per version of the
schema history", each cell saying whether the table was absent, idle or changed, which "becomes too long to observe with
a single view" unless rows and columns are grouped ([Parallel Lives
Diagram](https://github.com/DAINTINESS-Group/Plutarch_Parallel_Lives)). The other is one element's own history: pick a
line or a term and see only its changes, as GitHub's blame does, with a step labelled "View blame prior to this change"
([GitHub Docs,
blame](https://github.com/github/docs/blob/main/content/repositories/working-with-files/using-files/viewing-and-understanding-files.md)).

Across documents, wikis, code hosts and BI tools the same nine parts recur: a newest-first list with time and author;
named versions to cut noise; a short written reason on each change; two explicit picks to compare; a difference in more
than one form, with words in front of the raw diff (Grafana shows "text descriptions of the differences" before the
JSON); blame; restore as a new version; older and newer steppers; and a permanent link to one version ([MediaWiki
interface strings](https://github.com/wikimedia/mediawiki/blob/master/languages/i18n/en.json); [Grafana, version
history](https://github.com/grafana/grafana/blob/main/docs/sources/visualizations/dashboards/build-dashboards/manage-version-history/index.md)).
Every product that shows a reason keeps it on the change itself. Wikipedia's diff, seen live in the second pass, is the
clearest case: each side is headed by its date and its edit summary, so a reader meets the why before the what, and a
change is marked three ways at once, by a sign, a border colour and highlighted words ([a Wikipedia
diff](https://en.wikipedia.org/w/index.php?title=Gantt_chart&diff=1379039146&oldid=1378929139);
[Help:Diff](https://en.wikipedia.org/wiki/Help:Diff)). Each also says when it is hiding something: MediaWiki prints
"({n} intermediate revisions by the same user not shown)", and GitHub shows a banner naming the file of commits its
blame ignores.

#### A slider is the weakest control, and "as of" is a heading

Design-system guidance is to use a slider only "When the range is more important than precision", always to allow
typing, and to test with touch assistive technology, which may not be able to operate one ([USWDS, range
slider](https://designsystem.digital.gov/components/range-slider/); [W3C, slider
pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)); a calendar picker must never be the only way to give a date
([GOV.UK Design System, Dates](https://design-system.service.gov.uk/patterns/dates/)). The history sliders that ship all
draw something on the track and pair the handle with steppers. Wikipedia's RevisionSlider draws one bar per revision, up
for growth and down for reduction, with two knobs for the pair being compared
([RevisionSlider](https://github.com/wikimedia/mediawiki-extensions-RevisionSlider/blob/master/i18n/en.json)); kepler.gl
draws a histogram of events under its playback window ([kepler.gl,
Playback](https://github.com/keplergl/kepler.gl/blob/master/docs/user-guides/h-playback.md)).

Seen live in the second pass, the RevisionSlider sits folded above the diff until the reader opens it. Each knob is
joined by a line of its own colour to its column of the diff below, and pointing at a bar opens a card with the date,
the user, the edit summary and the size of the change ([a Wikipedia
diff](https://en.wikipedia.org/w/index.php?title=Gantt_chart&diff=1379039146&oldid=1378929139)). Its bars are evenly
spaced, one a revision, as the versions are on legislation.gov.uk's strip: both shipped history strips for sparse change
show a sequence of versions and not a scale of time. A design space built from a survey of 263 timelines says why. On a
chronological axis a sparse history leaves "large swaths of the timeline" empty, and the scale made for it is the
sequential one, with events evenly spaced and the date written beside each, or "sequential + interim duration", which
also draws the time that passed between one event and the next. Its gallery shows the twenty designs the authors hold to
be workable, among them one that cuts time into a band a month and calls out the events that matter in boxed text
([Timelines Revisited, preprint](https://timelinesrevisited.github.io/preprint.pdf);
[gallery](https://timelinesrevisited.github.io/supplemental/gallery/)). The one controlled study of timeline shape, with
192 people, found that shape affects the time a task takes and not its correctness, that straight timelines were faster
than a circle or a spiral in half of its comparisons, and that the horizontal line "was largely chosen as the easiest to
read" ([Di Bartolomeo et al., 2020](https://arxiv.org/abs/2005.06039), full text). Even spacing has a cost: a reader
cannot see that one version lasted years and another weeks, and has to read the dates.

Where "as of" appears in production it is a mode the screen announces and not a filter in a toolbar. On
legislation.gov.uk it is a status line, with "Version Superseded" in red above the strip of versions. In ALFRED the
vintage date is in the title and the legend of the graph, and the editor takes a typed "As-of date" or a pick from a
list of vintages ([ALFRED graph editor](https://alfred.stlouisfed.org/graph/?id=GDPC1)). Both were seen in a browser in
the second pass. For the neighbouring problem of an organisation that changes there is a named task in Workday and a
differently coloured bar in ChartHop (summaries, cited above). A date in the address makes "what applied then" something
that can be linked, quoted and compared. GitHub does the same with one key that rewrites a file's address to its
permanent link, "knowing that anyone you share it with will see exactly what you saw" ([GitHub Docs, permanent
links](https://github.com/github/docs/blob/main/content/repositories/working-with-files/using-files/getting-permanent-links-to-files.md)).

#### A change of definition is drawn differently from an event

Charts over time have a settled grammar for events: a marker on the axis with a vertical line through the plot, a shaded
band for a period, the text on demand, and a side list that repeats every annotation in range ([Grafana,
annotations](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/annotate-visualizations/),
with its pictures of [an annotated panel](https://grafana.com/static/img/docs/v46/annotations.png) and of [the
annotations
list](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-annotations-list-viz-v12.0.png) viewed in
the second pass; [Metabase, events and
timelines](https://github.com/metabase/metabase/blob/master/docs/exploration-and-organization/events-and-timelines.md)).
The better tools feed these from systems as well as from people. Datadog's Change Overlays lay deployments, feature-flag
and configuration changes over any time series ([Datadog, Change
Overlays](https://github.com/DataDog/documentation/blob/master/hugo/content/en/dashboards/change_overlays/_index.md)),
with an option to show only the faulty ones ([Datadog blog](https://www.datadoghq.com/blog/change-overlays/), summary).
Metabase, Superset and Rill keep events as a shared, named calendar that many charts read, "so people (including
yourself three months from now) won't have to figure out (again) why the line chart spiked back in March"
([Metabase](https://github.com/metabase/metabase/blob/master/docs/exploration-and-organization/events-and-timelines.md);
[Superset](https://github.com/apache/superset/blob/master/docs/docs/using-superset/exploring-data.mdx);
[Rill](https://github.com/rilldata/rill/blob/main/docs/docs/developers/build/metrics-view/annotations.md)). Coinciding
events collapse to one mark with a count. The documented failures are of scope and reach: Metabase drops events from
very small cards, and PostHog's annotations appear everywhere "except in shared and embedded views, which never show
annotations" ([PostHog, annotations](https://posthog.com/docs/data/annotations)), which fails the reader with the least
context. One study of 302 people found that "heavily annotated charts were not penalized. In fact, participants
preferred the charts with the largest number of textual annotations over charts with fewer annotations or text alone".
In its full text a note giving outside context made readers 6.1 times as likely to take that context away as a note
describing the axes, and such a note was matched 1.9 times as often when placed at the point as when placed in the
title. Hence one of its four guidelines: "Any external information or context should be positioned by a relevant point".
The authors tested single line charts and name dashboards and phones as future work ([Stokes et al.,
2022](https://arxiv.org/html/2208.01780), full text).

**A definitional change is not an event and is not drawn as one.** The World Bank's poverty charts "only connect poverty
estimates when these are comparable" ([PIP Methodology
Handbook](https://github.com/worldbank/PIP-Methodology/blob/master/02-Constructing-welfare-aggregates.Rmd)). Our World
in Data starts from the other default. It drops points so that each country has one unbroken line, says so under the
chart ("we try to strike a balance between maintaining comparability over time and showing as long a time series as
possible"), and offers a tick box, "Show breaks between less comparable surveys" ([Poverty Data
Explorer](https://ourworldindata.org/explorers/poverty-explorer)). The two exports of one view, looked at in the second
pass, show what the switch does. With it off, Romania is one line that climbs from about 11% to above 90% and falls
back. With it on, the same line is at least four separate runs, coloured by kind of survey, and the subtitle gains a
sentence: "The chart shows breaks in the comparability of the underlying household survey data over time within each
country individually" ([breaks
hidden](https://ourworldindata.org/explorers/poverty-explorer.png?Indicator=Share+in+poverty&Poverty+line=%2410+per+day&Household+survey+data+type=Show+data+from+both+income+and+consumption+surveys&Show+breaks+between+less+comparable+surveys=false&country=ROU~CHN~BLR~PER&tab=line);
[breaks
shown](https://ourworldindata.org/explorers/poverty-explorer.png?Indicator=Share+in+poverty&Poverty+line=%2410+per+day&Household+survey+data+type=Show+data+from+both+income+and+consumption+surveys&Show+breaks+between+less+comparable+surveys=true&country=ROU~CHN~BLR~PER)).
The break is drawn as a gap and a change of colour with no mark on the axis, and the words carry the rest. Where a whole
series is restated under a new definition, the same publisher draws the old and the new as two lines labelled at their
ends, "Latest data (2021 prices)" and "Sep 2024 data (2017 prices)" ([two versions of one
series](https://ourworldindata.org/grapher/number-extreme-poverty-version-comparison)). ALFRED draws a revision as two
sets of bars side by side, one a vintage, each named by its date in the legend ([ALFRED, real
GDP](https://alfred.stlouisfed.org/series?seid=GDPC1), seen in a browser). Chart libraries distinguish a gap from a line
drawn across missing points and warn that filtering missing values "will interpolate between the data points"
([Observable Plot](https://github.com/observablehq/plot/blob/main/docs/marks/line.md);
[Vega-Lite](https://github.com/vega/vega-lite/blob/main/site/docs/invaliddata.md)). By convention dashes already mean
less certain or projected, a band means an interval and a pin means an event ([Tableau, mark
properties](https://help.tableau.com/current/pro/desktop/en-us/viewparts_marks_markproperties.htm)). A break should use
what is left: an interrupted line, a labelled rule at the date, and segments named by the definition they use. No
empirical study of how readers read a break was retrieved in either pass.

#### Nobody draws both time axes for ordinary readers

No mainstream product was found that draws valid time against recorded time for general users. The diagram exists for
specialists: Fowler plots actual time across and record time running down the page ([Fowler's
figure](https://martinfowler.com/articles/bitemporal-history/sally-apr-25.png), viewed in the second pass), Reladomo's
tour draws each stored row as a rectangle on a plane with processing time across and business time on the other axis,
and a patent in the field states that "dealing with bitemporal data is often a source of confusion for many users"
([Reladomo
tour](https://github.com/goldmansachs/reladomo-kata/blob/master/reladomo-tour/tour-doc/src/docbook/bitemporal-intro.xml);
[US patent 8,078,626](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8078626), summary). What ships
instead is two controls asked one at a time, or the old and new figures side by side, or a revision triangle published
as a spreadsheet, which the ONS describes as a "Comparison of gross domestic product (GDP) first estimates against
estimates published later" ([ONS, revisions triangles for monthly
GDP](https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/revisionstrianglesformonthlygdp); the file itself
was not opened). The words matter more than the picture. Fowler says a fact on both axes aloud as one sentence, "on Mar
25th, we thought Sally's salary on Feb 25th was $6500", and labels a whole history at one recorded moment "as known
(recorded) on March 25" ([Fowler, Bitemporal History](https://martinfowler.com/articles/bitemporal-history.html)).
XTDB's documentation tells people to ask one question, "do I want to see corrections?", names the two answers "as best
known" and "as we knew it at the time", reads an open end as "until further notice", and explains a stored row as a
sentence about belief; it reports that questions come in descending order of frequency, the current state first, then
history as now known, then history as believed at the time, and so it looks like an ordinary database until time is
asked for ([Time in XTDB](https://github.com/xtdb/xtdb/blob/main/docs/src/content/docs/about/time-in-xtdb.md)).
Rewriting history is guarded: PeopleSoft's Correct History is a named mode behind a permission, and the everyday path is
a new dated row.

#### Reasons, decisions and "why did this apply" have shipped forms

The record of a decision is short and the same everywhere: a title, a date, a status, the context, the decision, its
consequences, and links both ways between a record and the one that superseded it; "an ADR is immutable. Only its status
can change" ([adr-tools](https://github.com/npryce/adr-tools/blob/master/README.md);
[Log4brains](https://github.com/thomvaill/log4brains/blob/develop/README.md)). Kubernetes ties each proposal to the
release at which each stage applies ([KEP
template](https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/kep.yaml)). Incident tools add a
two-level design: everything that was logged on one side, and on the other the few entries chosen for the telling, each
keeping its evidence ([PagerDuty postmortem
documentation](https://github.com/PagerDuty/postmortem-docs/blob/master/docs/next_steps.md)).

For "what applied on this day" the smallest complete answer is OpenFisca's Legislation Explorer. Each parameter is a
table with one row per period, the value, a legal reference for each value, and an explicit row reading "The legislation
defining this parameter is not in effect" ([OpenFisca, legislation
evolutions](https://github.com/openfisca/openfisca-doc/blob/main/source/coding-the-legislation/40_legislation_evolutions.md);
[Legislation Explorer](https://github.com/openfisca/legislation-explorer)). For "why did this case get this result",
Camunda shows the decision table as authored, with the rows that matched highlighted and that evaluation's values in the
cells ([Camunda Cockpit](https://docs.camunda.org/manual/7.7/webapps/cockpit/dmn/decision-instance-view/), summary). A
reason is compulsory only where a setting or a regulation makes it so, and a reason nobody can find does not help.
GOV.UK found in 2013 that readers did not reach its change notes "because they didn't realise that you could bring up
the change notes by clicking on the date it was last updated", and added a visible link ([Inside
GOV.UK](https://insidegovuk.blog.gov.uk/2013/08/13/redesigning-change-notes-and-measuring-the-result/), summary).

#### On 390 pixels a whole graph cannot be both seen and touched

The accessibility standard asks for touch targets of at least 24 by 24 CSS pixels and, at its enhanced level, 44 ([WCAG
2.2, Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). On a phone 390 pixels wide
that is at most sixteen nodes across, or eight. A node-link drawing of a hundred types cannot be both whole and
touchable, so the phone view has to be a list, one element's neighbourhood, or an aggregate. The usability evidence
supports that, and it supports smaltfl's house rule that nothing scrolls sideways. Comparing needs both things in view,
because switching between them makes people hold a value in working memory. In a wordy table "only 2 columns may fit
legibly on a narrow mobile screen". Static comparison suits "under 5 items". In a sequential control "most people stop
after viewing 3-4 different pages". Scroll-driven sequences left most study participants "at least mildly disoriented"
and were "worse on mobile" ([NN/g, Mobile Tables](https://www.nngroup.com/articles/mobile-tables/); [NN/g, Comparison
Tables](https://www.nngroup.com/articles/comparison-tables/); [NN/g, Carousels on
Mobile](https://www.nngroup.com/articles/mobile-carousels/); [NN/g, Scrolljacking
101](https://www.nngroup.com/articles/scrolljacking-101/)). Colour must not be the only cue for added, removed and
changed, and anything that moves by itself for more than five seconds needs a pause ([WCAG, Use of
Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html); [WCAG, Pause, Stop,
Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).

Hover is the weak point of every desktop annotation design read. The working phone forms are a tap target under the axis
that opens a sheet, a numbered key under the chart (Datawrapper moves annotations there on small screens)
([Datawrapper](https://www.datawrapper.de/blog/better-more-responsive-annotations-in-datawrapper-data-visualizations),
summary), one mark with a count where several coincide, a single-column inline diff, and a before-and-after pair stacked
vertically. No vendor documentation was found in either pass that shows a version history, a blame view, a time slider
or an annotated chart at phone size, so the phone advice here is assembled from general guidance.

| Technique | Question it answers | Evidence for | Evidence against, and limits | On a phone | Where to see one |
|---|---|---|---|---|---|
| Change list in sentences, each with its reason | What changed, when, by whom, why | What ontology, schema and catalog tools ship, as their screens confirm; the one comparison at scale favoured methods that summarise (summary) | No sense of pace; no study of how readers use reasons; a description generated from field paths is complete and unreadable | Native: a vertical list | [KGCL visual guide](https://github.com/INCATools/kgcl/blob/main/src/docs/change-types.md) (read as source); [DataHub's entity timeline as five sentences](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/timeline/timeline-conceptually.png) (viewed); [a GOV.UK page with "See all updates"](https://www.gov.uk/guidance/set-up-a-driver-cpc-training-centre); [Log4brains' decision log](https://thomvaill.github.io/log4brains/adr/) (live pages not opened) |
| Difference between two chosen dates on one stable layout | What differs between then and now | Choosing the two moments oneself beat animation and small multiples (full text); difference maps cut errors (abstract); shipped in Unreal Engine and ConVer-G; linked side-by-side trees preferred by taxonomy experts (summary) | Hides everything between the two dates; colouring a whole graph stops scaling as changes grow (summary) | Stack the pair, or one inline column | [A Wikipedia diff](https://en.wikipedia.org/w/index.php?title=Gantt_chart&diff=1379039146&oldid=1378929139) (seen live); [ConVer-G delta view](https://raw.githubusercontent.com/VCityTeam/ConVer-G/main/joss/delta-viz.png) (viewed); [Unreal Engine diff tool](https://dev.epicgames.com/documentation/en-us/unreal-engine/ue-diff-tool-in-unreal-engine); [Wayback Machine "Changes"](https://blog.archive.org/2019/10/18/the-wayback-machine-fighting-digital-extinction-in-new-ways/) (summary) |
| One element's history (blame, lifeline) | When did this rule or column change, and why | Everyday practice in code hosts, and shipped on schemas and object types; following chosen lines through all revisions beat conventional tools in [its authors' experiments](https://fservant.github.io/papers/2013-VISSOFT.pdf) (summary) | Hides the links between elements | Fits one column | [DataHub's per-field audit view](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/schema-history-audit-activated.png) (viewed); [Palantir, one object type's history](https://www.palantir.com/docs/resources/foundry/ontology-manager/review-restore-entity-history-button.png) (viewed); [GitHub blame, live](https://github.com/electron/electron/blame/main/lib/browser/ipc-main-internal.ts); [OpenFisca explorer](https://fr.openfisca.org/legislation) (the last two not opened) |
| Rows of days or versions, one row an element | Which parts changed when, and which are stable | Used for schema histories, and for class histories and patient records (summary) | Too long without grouping rows and binning time; no controlled study found | Rows scroll down; time binned coarsely | [Parallel Lives Diagram](https://github.com/DAINTINESS-Group/Plutarch_Parallel_Lives) |
| Marks, bands and a side list on a time series | What happened around this point | A settled grammar across Grafana, Datadog, Metabase, Mixpanel and Plausible; heavily annotated charts preferred, and outside context read best beside its point (full text) | Text lives in hover; dropped from small cards; missing from shared views in some tools; the study covered single line charts, not phones | A mark with a count, a sheet on tap, a numbered key below | [Grafana, an annotated panel](https://grafana.com/static/img/docs/v46/annotations.png) (viewed); [Grafana, the annotations list](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-annotations-list-viz-v12.0.png) (viewed); [Metabase's timeline sidebar](https://github.com/metabase/metabase/blob/master/docs/exploration-and-organization/images/timeline-sidebar.png) (viewed); [Plausible's notes on a chart](https://github.com/plausible/docs/blob/master/static/img/annotations-on-traffic-chart.png) (viewed) |
| A line broken into comparable runs | Can these points be compared | World Bank and Our World in Data practice; supported by chart libraries | No reader study retrieved; a break and a gap must look different; with the breaks hidden, a joined line shows a rise and fall that is partly a change of survey | Unchanged | [OWID poverty explorer with breaks shown](https://ourworldindata.org/explorers/poverty-explorer?Indicator=Share+in+poverty&Poverty+line=%2410+per+day&Household+survey+data+type=Show+data+from+both+income+and+consumption+surveys&Show+breaks+between+less+comparable+surveys=true&country=ROU~CHN~BLR~PER) (controls seen in a browser; the chart seen as [the site's own image](https://ourworldindata.org/explorers/poverty-explorer.png?Indicator=Share+in+poverty&Poverty+line=%2410+per+day&Household+survey+data+type=Show+data+from+both+income+and+consumption+surveys&Show+breaks+between+less+comparable+surveys=true&country=ROU~CHN~BLR~PER)); [World Bank PIP](https://pip.worldbank.org) (not opened) |
| Old and new value side by side | What a correction or a new definition changed | ALFRED's default (seen in a browser); Our World in Data's two labelled lines, and its chart diff with approve or reject | Two states only; a revision triangle is a spreadsheet, not a screen | Stack vertically | [ALFRED, real GDP in two vintages](https://alfred.stlouisfed.org/series?seid=GDPC1) (seen in a browser); [OWID, two versions of one series](https://ourworldindata.org/grapher/number-extreme-poverty-version-comparison) (viewed); [OWID chart diff](https://github.com/owid/etl/blob/master/docs/assets/chart-diff.png) (viewed) |
| Small multiples of a few states | How a small thing looked at each of a few dates | Faster than animation in most studies, and in seven of nine tasks on phones (full text) | Fails on scale (summary); the phone result holds for sixteen small charts; under five items; a hundred-node graph is unreadable at phone width | Four or five small states at most | [The phone study's app](https://github.com/microsoft/MobileTrendVis); [its two conditions on a phone](https://raw.githubusercontent.com/microsoft/MobileTrendVis/master/screenshots.png) (viewed) |
| Stepper or slider through versions | Where am I in the history | RevisionSlider and kepler.gl draw the changes on the track; the two shipped strips for sparse change space their versions evenly | A bare slider hides what changed; trouble on touch and with assistive technology; even spacing hides how long a version lasted | Steppers and a typed date, not a two-knob slider | [RevisionSlider on a Wikipedia diff](https://en.wikipedia.org/w/index.php?title=Gantt_chart&diff=1379039146&oldid=1378929139), opened from "Browse history interactively" (seen live); [legislation.gov.uk's strip of versions](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2019-02-12) (seen in a browser) |
| Staged, highlighted transition between two adjacent versions | What changed in this one step | Outperformed existing ways of moving through time on several tasks (abstract); animation made fewer errors on what was added in one step (abstract); automatic animation was the most accurate on small graphs with four steps (full text) | No overview; slower for analysis over many steps; readers have to memorise positions | Short, reader-controlled, with a still alternative | [GraphDiaries](https://ieeexplore.ieee.org/document/6658746) (not opened); [its thumbnail on the survey site](https://dynamicgraphs.fbeck.com/data/papers_img/Bach2014GraphDiaries.png) (viewed) |
| The whole history played as an animation | Nothing analytic; it engages | The most preferred encoding in one study (summary); rated easier to use than small multiples on phones (full text) | Slowest for analysis, by up to 2.8 times on phones (full text); loads memory; its own authors moved to static views (summary) | Avoid | [Gource](https://gource.io) |
| Edge and matrix timelines for dense networks | Patterns in thousands of recurring edges | Case studies on dense networks | Nearly empty for sparse change; need training; matrices scored low with experts (summary); 5 of the 71 techniques in the survey's library have a user study | Avoid | [A TimeArcs example](https://github.com/CreativeCodingLab/TimeArcs/blob/master/Text/images/PoliticalBlogs1.png); [Cubix](https://www.aviz.fr/Research/Cubix) (not opened); [the survey site, one family at a time](https://dynamicgraphs.fbeck.com/?q=graph_difference) (opened) |
| Alluvial flow | How members move between groups, merge and split | A case study on journal clusters, its figure viewed in [the paper](https://arxiv.org/abs/0812.1242) | Shows group membership only; few columns fit | Two or three columns | [Alluvial generator](https://www.mapequation.org/alluvial) (not opened) |
| Both time axes as a plane of rectangles | Which belief held for which day at which moment | Standard in the database literature | Called "a source of confusion for many users" (summary); no user study found | Avoid for general readers | [Reladomo's tour images](https://github.com/goldmansachs/reladomo-kata/tree/master/reladomo-tour/tour-doc/src/docbook/bitemporal-intro) (one viewed); [Fowler's figure](https://martinfowler.com/articles/bitemporal-history/sally-apr-25.png) (viewed) |
| Cohort and age overview | How old the parts are, and where change gathers | A code-history tool's stacked cohorts; stable and unstable regions of an ontology (summary) | Says when and where, not what | One small chart | [git-of-theseus example](https://raw.githubusercontent.com/erikbern/git-of-theseus/master/pics/git-git.png) |

Read together, the table agrees with the asker's experience and shows the way out. The named temporal-graph techniques
were built for dense networks and overview tasks and were checked mostly by case study, and each hides something a
reader of an ontology's history needs: the reason, the element's identity, or the state at a date. The problem at hand
is closer to version control and annotated timelines than to dynamic network analysis. The failure modes that remain are
change blindness and memory, and both have known remedies: one localised, highlighted change at a time, with the before
and the after in view together. The pictures looked at in the second pass agree. None of the examples that work animates
a graph, and none draws a whole ontology at a past date. Each attaches the history to the thing that changed, says the
change in words, and lets the reader pick two moments.

#### Ten examples to open, ranked by how directly each shows definitions changing

The asker has "never seen one work well", so the second pass ranked the examples it could open. The order is by how
directly each shows a set of definitions changing over time in a form a non-specialist reads without help. The first
four are definitions with their history attached, the next two are changes of definition marked on charts, and the last
four are supporting patterns. None was seen at phone size.

| Rank | Example | Why it is on the list | Exact address | How it was looked at |
|---|---|---|---|---|
| 1 | A provision of law as it stood on a date | One page answers what was in force then, what changed, of what kind and on whose authority, and which other versions exist; the date is in the address | [legislation.gov.uk, Taxes Management Act 1970, section 42, as at 12/02/2019](https://www.legislation.gov.uk/ukpga/1970/9/section/42/2019-02-12) | Seen in a browser |
| 2 | One object type's history in an ontology product | Dated saves, edits folded under the part they changed, the old value struck through beside the new one, unsaved changes on top, and a way back | [Palantir, history of one object type](https://www.palantir.com/docs/resources/foundry/ontology-manager/review-restore-entity-history-button.png), explained on [Review and restore changes](https://www.palantir.com/docs/foundry/ontology-manager/restore-changes/) | Picture viewed |
| 3 | A schema with "added in" and "modified in" on every field | The history sits on the definition itself and needs no second screen; a version picker shows the schema as it was | [DataHub, audit view of a schema](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/schema-history-audit-activated.png), explained on [Schema History](https://docs.datahub.com/docs/schema-history) | Picture viewed |
| 4 | One entity's timeline as five sentences | The smallest complete model: a vertical line, a version number computed from the kind of change, and one plain sentence a change | [DataHub, entity timeline diagram](https://raw.githubusercontent.com/datahub-project/static-assets/main/imgs/timeline/timeline-conceptually.png) | Picture viewed |
| 5 | A line broken where the definition behind it changes | It shows the difference between an event on a chart and a change of definition, makes the break a switch the reader controls, and says why the default hides it | [Our World in Data, poverty explorer with breaks shown](https://ourworldindata.org/explorers/poverty-explorer?Indicator=Share+in+poverty&Poverty+line=%2410+per+day&Household+survey+data+type=Show+data+from+both+income+and+consumption+surveys&Show+breaks+between+less+comparable+surveys=true&country=ROU~CHN~BLR~PER) | Controls seen in a browser; the chart seen as the site's own image |
| 6 | The same series as it was known then and as it is known now | Two labelled lines, or two sets of bars, are all it takes to show a revision or a restatement, with the date of each version in the label | [Our World in Data, September 2024 data against latest data](https://ourworldindata.org/grapher/number-extreme-poverty-version-comparison); [ALFRED, two vintages of real GDP](https://alfred.stlouisfed.org/series?seid=GDPC1) | Image viewed; seen in a browser |
| 7 | Two versions side by side with the reason above each, and a strip of every revision | The diff marks a change by sign, border and highlight at once and puts the edit summary first; in the strip each revision's bar is as tall as its change | [Wikipedia, a diff of "Gantt chart"](https://en.wikipedia.org/w/index.php?title=Gantt_chart&diff=1379039146&oldid=1378929139); the strip opens from "Browse history interactively" | Seen live |
| 8 | Twenty workable timelines on one page | A timeline need not be a ruler, and two of the twenty fit sparse change with reasons: time cut into monthly bands with called-out events, and evenly spaced events with the elapsed time drawn between them | [Timelines Revisited gallery](https://timelinesrevisited.github.io/supplemental/gallery/); [monthly bands with callouts](https://timelinesrevisited.github.io/supplemental/gallery/ChronLinSeg.png); [sequence plus elapsed time](https://timelinesrevisited.github.io/supplemental/gallery/SeqIntDurLinUni.png) | Page and images viewed |
| 9 | Each kind of ontology change as a small before-and-after picture with one sentence | It is about ontologies, it draws one change at a time, and the sentence under each picture is what a change list would say | [KGCL visual guide to change types](https://github.com/INCATools/kgcl/blob/main/src/docs/change-types.md); source read at [the raw file](https://raw.githubusercontent.com/INCATools/kgcl/main/src/docs/change-types.md) | Read as source; the diagrams were not seen drawn |
| 10 | An event and a period marked on a chart, with the text a tap away and a list beside | The settled grammar for saying "something happened here" on a time series: a line and a marker on the axis for a moment, a band for a period, a card for the reason, a list of them all | [Grafana, annotated panel](https://grafana.com/static/img/docs/v46/annotations.png); [annotations list](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-annotations-list-viz-v12.0.png) | Pictures viewed |

Five more are worth showing for other purposes: the families of technique at toy size, six panels on one six-node graph
([Filipov et al., Figure 1](https://arxiv.org/html/2208.13716v3/figures/encodings_2.png)); one line chart with no text,
a little text, much text and text alone ([Stokes et al., opening
figure](https://arxiv.org/html/2208.01780v3/teaser_img.png)); animation against small multiples as the phone study's
participants saw them ([study app
screenshots](https://raw.githubusercontent.com/microsoft/MobileTrendVis/master/screenshots.png)); what not to do, a
versioned knowledge graph as a tangle beside its readable difference
([ConVer-G](https://raw.githubusercontent.com/VCityTeam/ConVer-G/main/joss/delta-viz.png)); and a gallery of one
research family at a time ([dynamicgraphs.fbeck.com, difference
views](https://dynamicgraphs.fbeck.com/?q=graph_difference)). The eCFR may be as good an example as the first and is
left off only because its pages could not be opened. Items 1 to 4 read well as one sequence: move through versions, see
one thing's saves, see since when on each part, read the changes as sentences.

### Sound analysis names its basis and never joins a line across a change of definition

Two kinds of change break a series, and the maintainers' line between them is the right first cut. One is **data that
changes**: who belongs to which group, which group reports where. Business intelligence has a settled vocabulary for it.
Past facts can be shown under the structure in force at the time (as-was), under today's (as-is), or under the one valid
on a chosen key date (as-of); Oracle's documentation defines as-is reporting as showing "history as if it had occurred
under the current hierarchy" ([Oracle Retail
Insights](https://docs.oracle.com/cd/E69213_01/pdf/160202/html/user_guide/create_reports.htm), summary). Kimball's
dimension types are a menu for the choice (overwrite, add a dated row, add a column), and his hybrid type 7 is "used to
support both as-was and as-is reporting" from one store by giving each fact two keys. The two readings are "deployed as
separate views", with the current attributes "distinctively labeled to minimize confusion" ([Kimball Group, Type
7](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-7/);
[Design Tip 152](https://www.kimballgroup.com/2013/02/design-tip-152-slowly-changing-dimension-types-0-4-5-6-7/)).
Kimball Group's pages, read in the second pass, are firmer than the summaries on three points. The reader gets a small
fixed menu and not a time machine: the value in effect when the fact occurred, the current value, and, "to a limited,
highly analytic audience" only, the value on a date of the reader's choosing. A dated row carries a reason, and "The
reason text for the change should be drawn from a preplanned list of reasons for a change". And an overwrite is never
free. It "destroys the history of a particular field", it "affects all history, not just the current perspective", it
needs "an explicit, visible policy", and it "should force the dimension version number to be updated" ([Kimball, Slowly
Changing Dimensions](https://www.kimballgroup.com/2008/08/slowly-changing-dimensions/); [Part
2](https://www.kimballgroup.com/2008/09/slowly-changing-dimensions-part-2/); [Ross, Not Always as Easy as 1, 2,
3](https://www.kimballgroup.com/2005/03/slowly-changing-dimensions-are-not-always-as-easy-as-1-2-3/)). SAP's training
warns what a current-structure view does to the past, where after a category is reassigned "it seems as if sales
revenues for the food category went up drastically" ([SAP
Learning](https://learning.sap.com/courses/implementing-modeling-scenarios-in-sap-bw-4hana/identify-tracking-history-scenarios),
summary), yet SAP BW's default is that current view
([SAPinsider](https://sapinsider.org/data-modeling-with-time-dependent-master-data/), summary). This is the neighbouring
problem. smaltfl already treats it as data: each day's run reads that day's files, so the series it publishes is as-was
by construction, and ADR 0021 states the choice, "Changes that arrive as data stay data". Three of its lessons still
carry over to definitions. Every vendor read leaves the reader to know which view they are in; Power BI's advice is to
label each version unambiguously, as in "David Campbell (12/15/2008-06/26/2019)", and to "educate report authors and
consumers" ([Power BI guidance, star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)). Many
versions are "difficult for analysts to comprehend", and a version's dates are the load's, not the world's, unless the
source carries an effective date ([Microsoft Fabric, dimension
tables](https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-dimension-tables)). Dating by the
load is that vendor's guidance. Kimball's own pages date a row by the change in the world and handle a late change by
inserting a row in the past and restating the facts, and they keep no record of what the warehouse said before ([Kimball
Group, Late Arriving
Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/late-arriving-dimension/)).
And no documentation read shows a tool that warns a reader when a trend line crosses a change of structure.

The other kind is **a definition that changes**, which is the temporal ontology's business, and here accounting,
official statistics and the publishers of contested public data have each worked out what sound practice is.

#### Accounting sorts a change before treating it

As search summaries of IAS 8 and of US practice report it, a change of accounting policy and the correction of an error
restate the comparative periods and must disclose the effect on each line, while a change of estimate applies from now
on ([IFRS Foundation, IAS
8](https://www.ifrs.org/content/dam/ifrs/publications/html-standards/english/2026/issued/ias8.html), summary; [Deloitte
roadmap](https://dart.deloitte.com/USDART/home/publications/deloitte/additional-deloitte-guidance/roadmap-initial-public-offerings/chapter-3-financial-statement-preparation-disclosure/3-7-restatements-corrections-accounting-errors),
summary). The restated figure is shown beside the old one, not in place of it. The machine-readable form, read
first-hand, keeps the original fact and adds the adjustment as its own fact on a restatement axis whose member names the
cause: a change required by a standard, a voluntary change of policy, or the correction of an error ([XBRL US,
DQC_IFRS_0092](https://github.com/DataQualityCommittee/dqc_us_rules/blob/master/docs/ESEF/DQC_IFRS_0092/DQC_0092.md);
[DQC_0250](https://github.com/DataQualityCommittee/dqc_us_rules/blob/master/docs/DQC_US_0250/DQC_0250.md)). The
presentation that follows is a bridge: previously reported, plus adjustment by cause, equals restated. The triage
transfers directly to a pipeline. A new definition restates the comparison and says so; a re-estimated setting applies
forward and leaves a marked break; a correction restates and is labelled a correction.

#### Statistics offers a ladder, each rung a longer series on a stronger assumption

The first rung is to flag the observation. The SDMX status list defines `B`, a break, "when different content exist or a
different methodology has been applied to this observation as compared with the preceding one" ([SDMX code
lists](https://github.com/UKGovLD/publishing-statistical-data/blob/master/specs/src/main/vocab/sdmx-code.ttl)). The
second is to publish both values at the break; SDMX has an attribute for the "Observation Pre-break Value" ([SDMX
attributes](https://github.com/UKGovLD/publishing-statistical-data/blob/master/specs/src/main/vocab/sdmx-attribute.ttl)).
The third is to link the two segments by a ratio measured where both definitions were applied to the same records, as
the US National Center for Health Statistics did by coding a sample of 1996 deaths under both ICD revisions ([NCHS,
comparability ratio](https://www.cdc.gov/nchs/hus/sources-definitions/comparability-ratio.htm), summary), with its own
caution that "a ratio determined from a single year may not be applicable to other time periods" ([NCHS file
documentation](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/datasets/Comparability/icd9_icd10/ICD9_ICD10_comparability_file_documentation.pdf),
summary). The fourth is to convert the back series with coefficients estimated where both codings exist. Held constant,
they "would not capture those structural changes in the economy which may take place within" a class, and Eurostat's
guidelines warn that "it cannot be granted that the conversion matrix would remain valid in the past". The fifth is to
recode the individual records, which "has a potential to very well reflect structural changes of the economy", at a cost
that grows with every period recoded ([Eurostat, Backcasting manual, 2025
edition](https://ec.europa.eu/eurostat/documents/3859598/21944188/KS-01-25-030-EN-N.pdf/f20501c4-5907-33dc-6ed1-d3f6751632ae?version=1.0&t=1753177029922);
[ESS guidelines on revision policy](https://ec.europa.eu/eurostat/documents/3859598/5935517/KS-RA-13-016-EN.PDF)). A UN
paper, on a first-pass summary, puts the fifth more bluntly: it "best retains the structural evolution of the economy"
and is "usually very costly and in many cases not feasible" ([UN paper on
backcasting](https://unstats.un.org/unsd/nationalaccount/aeg/2018/M12_8iiib_Backcasting.pdf), summary). Every rung above
the second needs the same piece of evidence, at least one period counted both ways: Eurostat's methods "require that
statistical business registers are double coded according to the old and the new classification for at least one
reference year" ([Eurostat, NACE backcasting](https://ec.europa.eu/eurostat/web/nace/backcasting)).

**Eurostat grades the treatments, and its order is the reverse of their cost.** Its handbook first sorts a change into
three cases: no change; "some changes but not enough to warrant the designation of a break in series", which are
recorded in the metadata; and a break, of which users must "be informed that there has been a break and provided with
the information they need to deal with its consequences". For a break it names three treatments. "The most comprehensive
treatment is to carry forward both series for a period of time and/or to backcast the series". "Another possibility is
to provide the users with transition adjustment factors". And "The least ambitious treatment is to simply describe the
changes that have occurred and provide only qualitative assessments of their probable impact upon the estimates.
Obviously, this is the least satisfactory from the user perspective" ([ESS handbook for quality and metadata
reports](https://ec.europa.eu/eurostat/documents/3859598/13925930/KS-GQ-21-021-EN-N.pdf/143394de-e5a0-31ac-2c90-2aa9c15803f0?t=1639042312202)).
Its revision guidelines grade each practice as best, acceptable or to be avoided. Best is that "the whole time series
for all indicators and components is recalculated according to new standards". To be avoided is a major revision whose
series "are not back-casted or only partially back-casted for a short length". A major revision is announced in advance
and published with the reasons for it, an estimate of its impact and a comparison of the new series with the old. And
contributors should change together: "A staggered introduction of such major revisions across countries should be
avoided as these will cause unpredictable changes to European aggregates and affect data comparability across countries"
([ESS guidelines on revision policy](https://ec.europa.eu/eurostat/documents/3859598/5935517/KS-RA-13-016-EN.PDF)). The
handbook also turns comparability into a number, the "Length of comparable time series", which is the "Number of
reference periods in time series from last break". The 2021 change to the EU labour force survey shows the whole
practice at work, and its limits. A table says what each country supplied and how far back. The old series stay
available under table codes marked "h" for historical. One set of past series was overwritten, and the page says so. The
break does not fall on one date, because countries moved to the new derivation in different months. And because
countries improved their methods at the same time, "it is not possible to make clear statements of the overall impact"
([Eurostat, correction for breaks in time
series](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=EU_labour_force_survey_-_correction_for_breaks_in_time_series)).

**The smallest machine-readable form of a break is the World Bank's.** Its poverty data carry an integer per series, the
comparable spell: "The oldest comparable series in each country starts with the value zero (0). When comparability is
broken, the value changes to one (1) for the year of the break", and a line connects points only within one spell ([PIP
Methodology Handbook](https://github.com/worldbank/PIP-Methodology/blob/master/02-Constructing-welfare-aggregates.Rmd)).
A tool that records the rules in force at every run can derive the spell.

#### A list that defines the business is where breaks come from

The grey area of the previous section, a list delivered as data that defines what is measured, is where the documented
failures cluster. In one worked case from a health-research data model, a "Depressive disorder" concept fell sharply at
the cut-over from ICD-9 to ICD-10 because one new code had not been mapped to it. It was diagnosed only because the
model keeps the code as recorded beside the concept it maps to, so each source code could be drawn as its own small line
across the cut-over ([The Book of OHDSI, data
quality](https://github.com/OHDSI/TheBookOfOhdsi/blob/master/DataQuality.Rmd)). That model treats the vocabulary itself
as dated data: "Vocabularies are rarely permanent corpora with a fixed set of codes. Instead, codes and concepts are
added and get deprecated", so every concept carries a valid-from date, a valid-to date and a reason for becoming invalid
([The Book of OHDSI, standardized
vocabularies](https://github.com/OHDSI/TheBookOfOhdsi/blob/master/StandardizedVocabularies.Rmd)). A crosswalk between
two versions of a list is dated data too, with a hidden default. A widely used concordance package returns only the most
common match unless asked for all matches with their weights ([concordance R
package](https://github.com/insongkim/concordance/blob/master/README.md)); SDMX gives each mapping a validity period
([SDMX information model](https://github.com/sdmx-twg/sdmx-im/blob/master/docs/information_model/10_ItemSchemeMap.md));
and SKOS makes its approximate match non-transitive to avoid "compound errors" when mappings are chained ([SKOS
Reference](https://www.w3.org/TR/skos-reference/)). The classic cautionary case adds a complication. When the FBI
broadened its definition of rape in 2013, agencies adopted it in different years or not at all, so there is no single
break date, and the author of an open guide to the data concludes it is "too flawed to use" ([Kaplan, UCR
guide](https://github.com/jacobkap/ucrbook/blob/main/03_offenses_known.Rmd)). The date a definition changed and the date
each source's data began to follow it are different facts. Eurostat's guidelines name the same hazard, a staggered
introduction, and one of the cases below shows what it does to a national series.

#### Four cautionary cases show four shapes a break can take

The second pass read the classic cases that the first pass could only recall. All four hold up, and three now have sizes
from an official or well-referenced page. **A step on one date.** When Nigeria moved the base year of its GDP from 1990
to 2010 in April 2014, the estimate rose by 89%, from 42.4 to 80.2 trillion naira, where analysts had forecast 40 to 60
per cent, and a ratio built on it, stock market capitalisation to GDP, fell from 33% to 18% ([2014 Nigeria GDP
rebasing](https://en.wikipedia.org/wiki/2014_Nigeria_GDP_rebasing)). **A step with a tail.** In England and Wales the
counting rules of April 1998 raised recorded "violence against the person" by 118%, and the recording standard of April
2002 added an estimated 23% in its first twelve months, an effect "unlikely to be complete within the first 12 months".
The series lost its official designation in 2014, and the ONS now starts its trends after the break and tells readers
that the figures are "better indicators of police activity than crime trends" ([ONS, User guide to crime statistics for
England and
Wales](https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/methodologies/userguidetocrimestatisticsforenglandandwales)).
**A slope with no step.** The United States added a pregnancy checkbox to death certificates state by state between 2003
and 2017. In each state the measured maternal mortality ratio doubled on adoption, on average from 10 to 20 deaths per
100,000 births, and then stayed level. Nationally the result was a rise over fourteen years with no visible step, which
was read for years as a real trend. The chart that explains it lines every state up on its own date of adoption ([Our
World in Data, the rise in reported maternal mortality rates in the
US](https://ourworldindata.org/rise-us-maternal-mortality-rates-measurement)). This is the shape of the FBI case above,
and the one Eurostat warns against. **A long run of small steps.** The UK's count of the unemployed "was changed at
least 31 times between 1979 and 1996", on Wikipedia's account, which cites two books that were not opened; no page read
gives the size of the effect. The ONS now publishes the measure as four dated definitions under one name, the earliest
stretch being "an estimate of the number of people who would have claimed unemployment-related benefits if Jobseeker's
Allowance (JSA) had existed at that time" ([Unemployment in the United
Kingdom](https://en.wikipedia.org/wiki/Unemployment_in_the_United_Kingdom); [ONS, A guide to labour market
statistics](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/aguidetolabourmarketstatistics)).
In every case the label stayed the same. Three of the four changes were improvements, which is the kind made without
ceremony. Size could not have been guessed: on Wikipedia's table of the 1998 changes one offence group rose 118% while
burglary rose 0.1% ([Crime statistics in the United
Kingdom](https://en.wikipedia.org/wiki/Crime_statistics_in_the_United_Kingdom)). And a design that records only the date
on which a definition changed describes the first shape alone.

#### The best publishers keep a dated log of every change, their own included

The two great public COVID-19 datasets show the two honest defaults. Johns Hopkins restated history when a source
restated it and logged each restatement in one format: date, location, change, files affected, reason, source. When the
UK redefined a COVID death on 17 August 2020, its entry reads "We have revised the historical death data to match this
reporting", a loss of "around 5000 deaths from the official tally" ([JHU CSSE data
README](https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/README.md)). The New York Times kept
each number on the day it was announced and published its exceptions as data: a file of **2,510 dated anomalies** with a
date, an end date, a geography, a type, whether to leave the day out of rolling averages, and a description. The list
includes changes to the publisher's own rules ("Our database changed to exclude cases in non-Georgia residents"), and
its test for inclusion is a reader's need: "we judge whether a member of the public would need that note to understand
and put in context that day's case or death count" ([NYT anomalies
file](https://github.com/nytimes/covid-19-data/blob/master/rolling-averages/anomalies.csv); [NYT rolling averages
README](https://github.com/nytimes/covid-19-data/blob/master/rolling-averages/README.md)). Neither left a definitional
change unmarked. Put together from these logs and from the statistical standards, a useful record of a break has a date
and any end date, a scope, a kind (definition, classification, coverage, method, source, correction), a reason in words,
the source of the knowledge, the measured effect if there is one, the treatment (restated or not, kept out of averages
or not, a new spell or not), and who recorded it and when.

**The ONS keeps a revision and a correction apart by name, by policy and by place on the page.** Its policy says
"Revisions should not be confused with the correction of errors; revisions are not published to correct a mistake". A
revision is planned, may come from "changes in concepts, definitions, and classifications", and is told in a notice in
the next release. A correction is a mistake put right, reported "at the top of the affected release in a blue
collapsible banner" titled Correction, with "details of when and why the change was made" ([ONS, Revisions Policy and
Correction of Errors
Policy](https://www.ons.gov.uk/methodology/methodologytopicsandstatisticalconcepts/revisions/guidetostatisticalrevisions)).
For the national accounts the open window is published release by release as one line, "First period being revised", and
a correction to a closed period waits for the next opening ([ONS, National Accounts Revisions
Policy](https://www.ons.gov.uk/methodology/methodologytopicsandstatisticalconcepts/revisions/revisionspoliciesforeconomicstatistics/nationalaccountsrevisionspolicyupdateddecember2017)).
Every dataset keeps its superseded files in a table of three columns, "Superseded files", "Reason for update" and "Date
superseded" ([ONS, previous versions of a
dataset](https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/revisionstrianglesformonthlygdp/current)). And
a step that a change of method leaves in a series gets an article of its own with a fixed shape: the two adjacent
periods between which the step falls, the cause, which series were adjusted so that they "can be assessed without a
discontinuity" and how far back, which were not, and which other outputs inherit the step ([ONS, Impact of reweighting
on Labour Force Survey key
indicators](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/articles/impactofreweightingonlabourforcesurveykeyindicators/2024)).

**Our World in Data shows how to write the article when a definition itself moves.** The first lines say that the number
changed because the measure did: "In June 2025, the World Bank increased its extreme poverty estimates by 125 million
people. This doesn't mean the world has gotten poorer: it reflects a new, higher International Poverty Line of $3 a day,
up from $2.15." The step is then taken apart into its named causes: a change of units, new data, a higher threshold. A
counterfactual sizes the part that is definition alone: had the line risen only with inflation, the new data would show
roughly 540 million people in extreme poverty in 2024, against 817 million under the new line. Old and new are drawn
together, and each quoted figure links to a frozen copy of the chart as it stood ([Our World in Data, $3 a
day](https://ourworldindata.org/new-international-poverty-line-3-dollars-per-day)). A later article on energy says the
two things a reader most needs to hear: "This is purely an accounting change; nothing physical in the energy system has
changed. It applies to the entire historical series of primary energy, not just the most recent year" ([Our World in
Data, primary energy](https://ourworldindata.org/primary-energy-measurement-change)). The frozen copies are a feature in
their own right. An archived chart has a timestamp in its address and "will always show the exact data, text, and other
content as it does on the day of embedding" ([Our World in Data, archived
charts](https://ourworldindata.org/new-feature-embed-archived-charts)), which is the "as known on" reading applied to a
sentence that quotes a number.

#### "As known on" needs a second date on everything, and recomputing needs reproducible runs

Machine learning calls the same discipline point-in-time correctness and adds the detail that makes "as known on"
honest. Filtering on the data's own date is not enough, because "a value that was backfilled or corrected *after* an
entity dataframe timestamp can still be returned for it"; the cure is a second condition on when each value became
available ([Feast, point-in-time
joins](https://github.com/feast-dev/feast/blob/master/docs/getting-started/concepts/point-in-time-joins.md)). Data
engineering has all four responses to a changed definition in documented use, mostly for tables and code and not for the
definitions of measures. Mark what was computed under old logic, as Dagster labels such assets "Unsynced" ([Dagster,
asset
versioning](https://github.com/dagster-io/dagster/blob/master/docs/docs/guides/build/assets/asset-versioning-and-caching.md)).
Recompute history, which is trustworthy only if runs are reproducible: "Never read the latest available data in a task"
([Airflow, best practices](https://github.com/apache/airflow/blob/main/airflow-core/docs/best-practices.rst)). Keep both
and let the reader choose, "two or three, and not more". Or run both in parallel for an announced overlap with an end
date ([dbt, model
versions](https://github.com/dbt-labs/docs.getdbt.com/blob/f7cd3a0f0531fb5ae512664f1d0520155728aedd/website/docs/docs/mesh/govern/model-versions.md)).
**No tool read versions the definition of a measure with a date of effect and labels the series by it.** A weather data
provider states the underlying trade-off most plainly. Its reanalysis, one model run over all past observations, is
"Optimised for long-term consistency rather than day-to-day accuracy", while the stitched record of each day's
operational model "Closely tracks actual conditions" and is "Not suitable for long time series due to model version
changes over time" ([Open-Meteo, historical weather](https://open-meteo.com/en/docs/historical-weather-api);
[Open-Meteo, historical forecast](https://open-meteo.com/en/docs/historical-forecast-api)). The series that was right on
each day is not the series that is consistent across days, and both are worth offering under clear names.

The standards agree on where the context of a slice can sit: on one observation, on a series or slice, on the whole
dataset, and on the run that produced it ([SDMX information
model](https://github.com/sdmx-twg/sdmx-im/blob/master/docs/information_model/4_Data_Structure_Definition_and_Dataset.md);
[RDF Data Cube](https://www.w3.org/TR/vocab-data-cube/);
[OpenLineage](https://github.com/OpenLineage/OpenLineage/blob/main/spec/OpenLineage.md)). The W3C Data Cube's default is
to repeat an attribute on every observation so that observations can "stand alone", which favours a reader who lands on
one number with nothing else. The W3C's best-practice document also draws a line a pipeline tool should hold to: a time
series is not a set of versions, so a new day extends the series, and only a change to a day already published is a new
version of that day ([Data on the Web Best Practices](https://www.w3.org/TR/dwbp/)).

The table gathers the practice by kind of change. It covers changes of definition only; for data that changes, the
as-was and as-is vocabulary above applies and smaltfl's answer is already given.

| What changed | Kind | What stays comparable | Offer first | Also offer | Always show |
|---|---|---|---|---|---|
| A rule, or the definition of a measure | A new definition | Nothing, unless history is recomputed | The series as computed, broken at the change | The series recomputed under the new rule beside the old one over an overlap; the size of the step | The date, the reason, and which rule each stretch of the line used |
| A kind of thing, or an entry in a list that defines the business (a control, a role, a code) | A new definition; the grey area when it arrives as a row | Totals, only where old entries map completely onto new ones | The total, with each entry drawn across the change | A ratio measured where both lists can be applied to the same records; each retired entry's typed successor | The version of the list and its date |
| A learned or estimated setting (a band, a level, a threshold) | A new estimate | The data | The setting applied from the change onward | A what-if of the new setting on past days | The date the setting moved |
| A rule that was wrong | A correction | The corrected series | The corrected series, labelled | What was shown before, and the reconciliation | That it is a correction, and when it was made |

### smaltfl has the register and the hash; the decisions are where the line runs, what to date and what to draw

#### What exists today

ADR 0021 already built the two-axis register for rules. A flow keeps a base and dated change sets. Ten edit operations
exist (set, remove or switch a rule; accept a band; set a check's mode; map a file's column; declare a column's values
or a file's key; take a version whole; and a column rename that nothing yet makes as a dated edit), each replayed by a
pure function. The rules in force on a day, as known at a moment, are the base with every change set whose days cover it
and which was recorded by then. A run resolves its document that way before planning, and its manifest names the hashes.
This is the cheaper pattern Fowler recommends before full bitemporality, an action that "records any necessary input
data", with the two-date question asked only when a past day is run again or compared. He gives the same advice sixteen
years apart, in 2005 ("it's often better to store a detailed trace of the calculations") and in 2021, and his pattern
for dated rules, under which a late event is processed "using the rules that were valid" on its own day, is what
resolving a document for its day does ([Fowler, Temporal Patterns](https://martinfowler.com/eaaDev/timeNarrative.html);
[Fowler, Agreement Dispatcher](https://martinfowler.com/eaaDev/AgreementDispatcher.html)). On screen there is a month
read "as known on" a moment; a day screen with its versions listed like commits and a line saying which rules were in
force and what was new that day; an Ontology view that lists change sets in words with who, when and why and compares
any two versions in sentences; a sheet that shows a back-dated change's effect on each day before one decision restates
them; and a row-and-cell comparison of two versions of a day. Three of the production habits found above are therefore
already house rules. A change defaults to the next day to arrive, so it is announced before it applies (Q-189). A
back-dated change is a decided restatement, never a silent one (Q-190, Q-199). And what a run used is sealed with the
run. The second of these is the publisher's rule from the section on effective dating: what readers have seen is
restated in the open and never rewritten in place.

#### The first decision is where ontology ends and data begins

The maintainers' scope is the business's rules and its understanding of itself: rules, checks, what things mean, and the
kinds of things there are. A new role that changes how the organisation works is an ontology change. People being hired,
moved or promoted, and teams moving within the organisation, are changes in the incoming data. The research supports the
line. It is the difference between the two meanings of "temporal ontology"; the fields surveyed version definitions and
instances with the same machinery and treat them as different problems; and Foundry keeps a history of definitions apart
from its log of object edits. smaltfl's ADR 0021 already states it: "Changes that arrive as data stay data". The
consequence for this report is a boundary. The code study lists as a gap that objects such as organisation units have
identity by key only, with no history and no reading "as of" a date. Under this scope that is not a gap in the temporal
ontology, and nothing here recommends object histories, lifelines for units or owners, or as-was and as-is readings of
them. A day's run reads that day's files, so the organisation as it stood is in that day's data. The organisation can be
drawn as a graph; that is a drawing of data and a separate matter from the ontology.

The research also shows where the line is hard to hold: **a list that arrives as data but defines the business**. The
maintainers' own example sits there, since a new role is likely to arrive as a row in a list of roles. Larkspur already
has a case. On Wednesday the 27th its control catalogue gains a fifteenth control, an SBOM for every hosted application,
with no evidence feed yet, and coverage at the group falls from 99% to 91% with no failure behind it (ADR 0020). smaltfl
tells that today as the day's finding, missing evidence said as no data. It is also a change in what "posture" measures,
and a break in a series caused by a row. The clinical and statistical fields treat exactly this as a change of
definition, with a reason, a successor where there is one, notice, and a dated crosswalk, and the documented failures of
analysis cluster here.

Three options follow. Lists stay data like everything else, and the change shows only as a finding. Or such lists are
moved into the ontology document and edited there, which fights the fact that they have owners elsewhere. Or the
ontology marks which datasets or coded columns are defining lists, the tool compares them day to day as Statistics
Norway's `changes` call does, and an entry added, retired or redefined is proposed to a person, who accepts it into the
register with a reason and a kind, dated from the day the row arrived and recorded when accepted. **The evidence favours
the third**, and it fits a pattern smaltfl has: ADR 0022 proposes a column's values, bands and key from the data, and
each acceptance is a dated change set with a reason. Which lists count is a judgement for people to state in the
ontology and not something to infer, because the same shape of file can be a list of kinds (controls, roles, codes) or a
list of instances (units, people, applications).

#### The gaps, read under that scope

Ten of the code study's eleven gaps remain, and four carry most of the asker's question. **Only rules are dated.** A
column's name, meaning and value labels take effect at once on every day (Q-198), as do an override and every edit to a
step. Object types, links, rows entries, needs rules, fixes, thresholds, the calendar and contracts cannot be edited in
the app at all. The estate's shared ontology, which all five of Larkspur's flows import and which holds the kinds of
things there are, has a hash and no versions, reasons or authors. Because a version is identified by its change sets
over today's base, a past version is shown with today's names, and, as the study reads the code, a rename breaks the
match between a version and the runs recorded under it. **Nothing records a business event or period.** The calendar has
recurring days, yearly windows and one-off named dates, and Larkspur's holds only Patch Tuesday. The reorganisation, the
handover, the change freeze, the migration and the remediation push that explain Larkspur's months exist as kinds of
planted trouble in the test generator and reach the app only as words in a reason or a scene of the tour. **No chart
marks a change of definition.** The score has one mark a day with no time on it, so, as the study reads the code, a past
"as known on" view can show a later correction's score; a flow's month "doesn't mark the day a change of it took effect"
(ADR 0026); and the only breaks are inside the judge, where an accepted level or changed check rules start a new segment
of a learned history. **A past month cannot be read under a chosen version without restating it**, except one what-if
day at a time. The rest are narrower. The comparison of two versions names five kinds of difference and calls anything
else "Changed". "As known on" offers only the ends of days, is not in the link and is not stored with the run. Each fact
has one instant, with no decided-on or announced-on. Reasons are optional on most rule edits, and nothing links a change
to a decision or an event.

#### The decisions, and the position the evidence supports on each

| Decision | Today | Options | Position the evidence supports |
|---|---|---|---|
| Where the line runs | Data stays data (ADR 0021); no notion of a list that defines the business | Everything that arrives stays data; move defining lists into the ontology; mark them, and propose each changed entry for acceptance into the register | Mark them and propose; people say which lists count |
| What an edit can date | Ten operations, all on rules; types, links, rows entries, needs rules, fixes, thresholds, the calendar and contracts not editable; steps change at once | Leave as is; date whatever judges data or says what kinds exist; date everything | Date what judges data and the kinds, one operation at a time, each with validation, replay and vectors |
| Names, meanings and labels | At once on every day (Q-198); a past version shows today's names | Keep, and index the base's history on the record axis; make them effective-dated; add a separate "the thing itself changed" edit | Keep Q-198, index the base, and treat a change of meaning as a new identity |
| Identity | Rules have ids; columns, coded values and types are known by name | Names as identity; stable ids, never reused, with a retired status and a typed successor | Stable ids. It is an encoding change (Q-147 keeps names in the flow hash), so it needs its own ADR |
| Reason, kind and authority | `why` may be empty on most rule edits; nothing links a change to a decision or an event | Optional words; required words; required words with a coded kind and an optional authority | A required reason, a kind from a short list, an optional link |
| A third time | One instant per fact | None; optional decided-on and announced-on fields; a third axis | Two optional fields at most |
| Business events as context | One-off calendar dates; events only as words | Calendar entries, inside the flow hash; an event list in the record; inferred from data | A list in the record, written by people, linked to the changes and decisions it explains; context, not an ontology change |
| A series across a change of rules | No mark; one undated score mark a day; the past under other rules only by restating or one what-if | Mark; mark and break into comparable runs with a switch; add a recomputed series made by the build | Mark and date the marks first, break next, recompute last and name it apart |
| Record time | The ends of days only; not in the link; not in the manifest | As is; the moments when something changed, in the address, with an optional manifest field | The second |
| The estate's ontology | A hash; no versions, reasons or authors; not editable in the app | One shipped copy; its own change sets, each flow pinned or following | Its own change sets, each flow bound to a version by hash, as ADR 0026 pins a flow it reads |
| What to draw | Sentences, a list of versions, a five-kind comparison, the restatement sheet, compare | A temporal graph view; or blame, a full comparison, rows for definitions and marks on charts | The second; a graph only for one change's neighbourhood |

Each position has at least one source read first-hand behind it, and the second pass read the pages behind most of the
rest: legislation, SNOMED CT, the geography codes and the visualisation studies no longer rest on summaries.
Accounting's triage still does, and the sections above carry the marks. The second pass changed no position in the
table. It narrowed two of the habits the positions lean on (that nothing is deleted, and that every change names its
authority), and no position needed either in its wider form. It added evidence for five: a kind on every change, a
stated identity rule, the comparison of two chosen versions, marks that lead on to a recomputed series, and the
publisher's rule for what readers have seen.

**Extend the register; do not build a graph store.** smaltfl's change sets are event sourcing applied to definitions,
the pattern the first section found in every working system, and they answer the three questions the research on
versioned stores asks of one ([Taelman et al.](https://rdfostrich.github.io/article-jws2018-ostrich/)): what changed
between two days, when a definition changed, and, by replay, the state on a day. The work is to widen what an edit can
date. The test for inclusion is the one TerminusDB's "weakening" rule and the event-sourcing guides use: can the change
invalidate or re-judge anything already recorded ([TerminusDB, weakening
schema](https://github.com/terminusdb/terminusdb-docs/blob/main/explanations/weakening-schema.md))? Types and links are
the kinds of things there are, and rows entries, needs rules, fixes and thresholds judge data, so all of them belong
among the dated operations, each with its validation and replay as ADR 0021 requires. The estate's ontology comes first,
because it is where the kinds live and it has no history at all. Names, meanings and labels do not judge data, and
Q-198's answer that they apply at once matches Kimball's overwrite type and the geography rule that a rename keeps the
code. What Q-198 leaves open is the record axis. A past version should be shown with the names it had, which needs the
base's own history indexed, not names made effective-dated. Kimball attaches the same two conditions to any overwrite: a
stated, visible policy for the fields that are overwritten, and a version number that moves, because an overwrite
"affects all history, not just the current perspective". One case is not a rename at all. OBO's Principle 19, Datomic's
"Never remove a name. Never reuse a name" ([Datomic, schema
growth](https://github.com/Datomic/day-of-datomic/blob/master/samples/schema_growth.clj)) and the event-sourcing rule
that "If the semantic meaning of an event changes, then you should treat that as new event type" ([Microsoft, CQRS
Journey](https://learn.microsoft.com/en-us/previous-versions/msp-n-p/jj591577%28v=pandp.10%29)) all say that when the
thing a name refers to changes, it gets a new identity and the old one is retired with a pointer. The name form already
asks for a reason where the estate describes the column. It could ask one question more: is this the same thing under a
new name, or a different thing?

**Identity comes before time.** Iceberg tracks columns by id because "Formats that track columns by name can
inadvertently un-delete a column if a name is reused" ([Iceberg,
evolution](https://iceberg.apache.org/docs/latest/evolution/)), and the registers agree: the ONS forbids the reuse of a
geography code in so many words, SNOMED CT's identifiers are permanent, and RxNorm's "are never reused", on a first-pass
summary. smaltfl's rules have ids, while columns, coded values and types are known by name, with a mapping edit that
reads a file's renamed column back onto the name. Stable ids for those, a retired status with a coded reason, and a
typed successor in which "no successor" is a normal outcome would make every later view safe. A rename stops being a
deletion and an addition in a comparison, and old data is re-read under a new label only where the link says the two are
the same. The pages read in the second pass add two refinements. The rule for what makes a new identity has to be
written down, because "the same code" promises the same boundary in the UK, nearly the same boundary in NUTS and an
administrative successor in Norway. And SNOMED CT shows how to write it: a table that says, field by field, what may
change under one identifier and what forces a new one, and successor links in three shapes, exactly one target, any one
of several, or all of several together.

**The reason carries the meaning, so it should be required and typed.** A hash proves which rules ran; it cannot say
what they meant. Every working register found puts the reason on the change: a legislation note's "by S.I. 1998/1126",
SNOMED's coded reason, which limits the kind and number of successor links, the fields of a change in the biomedical
change language (who, when, the issue, the change set it belongs to). The proposal is a required reason on every dated
change, as restatements and as-is decisions already require one, and a kind chosen at the moment of change from a short
list: a new definition, a re-estimated setting, the correction of an error, a change at the source. The kind decides the
default treatment of history exactly as accounting's triage does, and it is what a chart needs to choose between a mark
and a broken line. The second pass found the same split wherever it looked. Fowler separates a defect fix, after which
past events are processed again, from a rule that changes on a date, under which they stand. The ONS separates a
correction from a revision by name and by place on the page. Kimball wants the reason "drawn from a preplanned list".
And Eurostat adds a state between no change and a break, a change that is recorded in the metadata and does not cut the
series, so the kind should also say whether the change breaks comparability. An optional authority, a link to a
decision, an event or an outside reference, completes it. Optional is the right strength: the pages show an authority on
a change only where something outside the register causes it, an Act or a regulation, and a reason at most where the
publisher is its own authority. A third time axis is not warranted. Fowler's limit applies ("Putting many perspective
dimensions over a history isn't something that's widely useful"), as does his warning that rules on two axes "can get
very messy", a back-dated change set already says "in force from Friday the 1st, recorded Monday the 25th", and the rest
fits in two optional fields, decided on and announced on, as the Nessie catalog keeps an author time beside a commit
time ([Nessie,
about](https://github.com/projectnessie/nessie/blob/9d17c1a14fcbce9c5e299cb4314f1f1bea643e31/site/docs/guides/about.md)).
One inconsistency in today's code deserves a ruling: a band accepted by a decision is dated by the form's "edits take
effect from" setting and not by the decision's own level date, so one acceptance has two dates.

**Business events are context, kept as a list of their own.** A reorganisation, a freeze or a migration, written down by
a person as what was going on, is not an ontology change. It is what a reader needs beside the rules to make sense of a
day. Egeria's Context Event is the only prior design found, and the publishers' logs show how little structure is
needed: a period, a scope (which flows, files or outputs), a kind, the words, the source, who recorded it and when, and
links to the change sets and decisions it explains. Kept in the record, as decisions are, it stays out of every hash of
the rules, honours the rule that display fields stay out of keys, and inherits authorship, the recorded moment and the
audit. Where an event should change how days are judged, an ontology change does that and cites the event: an accepted
level, a calendar date, a new band. Incident tools suggest the reading side: the full log on one hand, and on the other
the few entries someone chose for the telling. With this in place a past day maps back to three things, each from its
own source: the rules in force (the ontology), the events and decisions written down (the context), and the day's own
data, which stays data.

**Mark first, break second, recompute last.** Marks cost no runs. Every change set already has a day, so the month's
score line, the rows of days and each flow's month can carry a mark where the rules a series depends on changed, with a
count where several coincide and the reason one tap away, in the chart itself and not in a hover. The comparable run is
derivable: a new one starts whenever the rules a measure depends on change in a way its kind says affects comparison, or
when an accepted entry in a defining list does, and the judge's histories already start a new segment that way. A line
broken at those points, offered as a switch with a sentence explaining the default, is the World Bank's and Our World in
Data's practice. The two differ on the default. The World Bank joins only comparable points; Our World in Data joins
everything, drops points to do so and offers the breaks as a switch. A reader who acts on day-to-day movements is better
served by the first. Eurostat's measure of comparability, the number of periods since the last break, is derivable in
the same way, as the count of days since the last change a measure depends on. A mark on one date describes only one of
the four shapes a break can take, so a mark needs the end date and the scope that the record of a break already has. The
second series, the past under a chosen version, is the opening the market leaves widest and the costliest here. Each day
is a what-if run, the recorded month is made by the build, and the browser regression has 38 of its 1,330 engine seconds
left. If it is built, the build should compute it ahead, as it computes ranges ahead, and the screen should name the two
series as the weather provider does: the one published each day and the one consistent across days, never the second in
place of the first. It is also the treatment Eurostat ranks first. The order in this paragraph is an order of cost, and
Eurostat grades the same treatments by what they give the reader in the reverse order: describing a break is "the least
satisfactory from the user perspective", and recalculating the series under the new standard, with the old one kept
beside it under a marked name, is best. Marks are therefore where the work starts and not where it should stop. Eurostat
makes the recalculated series the main one, because its readers compare across years; a tool whose readers acted on each
day as it was published has the opposite reason to keep the published series first. The size of a step can meanwhile be
measured and not estimated: every statistical method needs one period counted both ways, and a what-if run of one period
under both versions of the rules is that double count. Two smaller fixes make today's views honest. Each score mark
needs its own time, so that "as known on" filters it. And the as-of moment belongs in the manifest as an optional field,
which keeps older manifests' hashes.

**Draw less than the phrase "temporal graph" suggests.** The base view is the one smaltfl has, change sets as sentences
with who, when and why. Four additions follow from the evidence. On every rule, band, label and type, say since when and
by which change, with a step to the state before it. This is the blame view, and the code study notes its absence: a
rule's line "says how it was set, not since when or by which change". DataHub ships the same idea as one narrow column
on a schema, "Added in" or "Modified in" a version on every field's row. Extend the comparison of two versions to every
kind of difference, grouped by kind, each change opening to a small before-and-after picture of its neighbourhood with
unchanged parts dimmed and a cue besides colour. The second pass strengthens the case for comparing two chosen versions:
letting readers pick the two moments beat both animation and small multiples in the one study that tested it. The one
result in animation's favour came from small graphs with four steps, which is a reason to keep a stepper between
adjacent versions and not a reason to play a history. Put definitions into the rows of days the month already draws for
flows, files and steps: a row for a file's rules with a mark where they changed, grouped and folded as the tiers are.
And put the mode in the heading and the address. The day is already in the link (`#day/2024-03-27`); "as known on" is
view state and should join it, offered at the moments when something changed, as ALFRED's graph editor offers a list of
a series' vintages beside a typed as-of date ([ALFRED graph editor](https://alfred.stlouisfed.org/graph/?id=GDPC1), seen
in a browser; [FRED API, vintage dates](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html), summary).
Versions people must remember deserve a name beside their eight characters of hash, as Power BI labels a version by what
distinguishes it and Figma separates named versions, each with a title and a description, from grouped autosaves ([Figma
help](https://help.figma.com/hc/en-us/articles/360038006754-View-a-file-s-version-history)). The restatement sheet
already applies the eCFR's lesson by separating the days whose outcome would change from those that came out the same.

**Carry the context with each run without swelling the manifest.** A manifest should keep naming what the run used: the
flow, the rules, the ontology, the files, and in future the moment it was resolved at. Reasons, events and decisions
belong in the record, keyed by day and moment, so that the context of a past day can be read both as it was known then
and as it is known now. What leaves the tool (an export, the audit bag, a shared link) should follow the Data Cube's
default that an observation can stand alone: each published day with its version of the rules, its status (as first
published, corrected, restated, filled, level accepted), its comparable run, and the events that cover it. Eurostat's
style guide asks the same of a table, which must explain itself in case a reader arrives at the table and not at the
article, and Our World in Data links each figure it quotes to a frozen copy of the chart. A sentence that quotes a
number should point at the run it came from in the same way.

#### Constraints that set the order of work

Hashes are exact. A changed encoding takes a new tag version and an ADR with test vectors first; `rules/1` and
`estate/0` have pinned vectors; a flow with no change sets must hash as before; and a demo's held days that move are a
decision, not a fix. Every new kind of dated change needs an operation, its validation and a pure replay. The app is
phone first: nothing scrolls sideways and nothing vital sits in a hover. The browser regression's budget is 1,330 engine
seconds with 1,292 used, and a stop that opens a day, decides or restates is a run. The data cache is keyed by what the
generator, the history builder and the recorder import, so display logic in a new pure module (as `overview.ts` and
`tiers.ts` are) keeps every demo's data, while a change to `month.ts`, `timeline.ts` or the estate's `ontology.json`
makes all of it again.

That gives an order by cost. First comes display-only work that moves no hash: marks on existing charts from existing
change sets, since-when on each line, the wider comparison, "as known on" in the address. Then the record side: an index
of the base's history, a dated score mark, the as-of moment in the manifest, a required reason and a kind, and the event
list. Then the new dated operations and the estate's own change sets, each behind an ADR, with defining lists and their
proposals beside them. The recomputed series comes last.

### What the second pass confirmed, what it corrected, and what is still unread

The first pass could search the web and mostly could not open pages, so it left its evidence in three grades: read
first-hand, taken from a search summary, or recalled. On 18 November 2026 a second pass opened the primary pages and
checked the first pass claim by claim, in three parts. The first read legislation.gov.uk, EUR-Lex, the SNOMED CT
specifications, Eurostat, Statistics Norway's KLASS service and the ONS, called their live data services, and read the
HR and ERP documentation of PeopleSoft, Oracle Fusion HCM and SAP, which the first pass had not reached at all. The
second read Fowler and Kimball in the original, the published documentation of DataHub, OpenMetadata and Palantir
Foundry, Eurostat's and the ONS's policies on breaks and revisions, Our World in Data, and the cautionary cases: 288
requests, 247 pages or files returned, and about 750 quotations checked by a script against the downloaded text. The
third opened the dynamic-graph survey's site and the Timelines Revisited gallery, read the main studies in full and the
earlier ones' abstracts, looked at product screens in a browser or as the vendors' own pictures, and ranked the
examples. It also saved ten screenshots from openly licensed pages, which are listed with their licences in the research
notes. Most pages were read as the server sent them, so colours, exact positions and anything a script draws were not
seen; where this report says "seen in a browser" or "seen live", the page was rendered.

**What it confirmed.** The argument, and every position in the table of decisions. On the details: the
legislation.gov.uk page as described, with the date in the address and the mode in a status line; SNOMED CT's four
columns and its one rule for the state on a date, word for word; Eurostat's flags, the NUTS versions with their windows,
and the KLASS calls; the ONS's rule of a new code only on a boundary change and no reuse, now from its own policy;
PeopleSoft's three modes; every quotation from Fowler's article on bitemporal history, now read at the original;
Kimball's types and his type 7; that Foundry, DataHub and OpenMetadata keep recorded-time history only, with no date of
effect on a definition and no reading of the ontology as of a past date, which Palantir's documentation says outright of
its what-if scenarios; the World Bank's and Our World in Data's treatment of breaks; and the direction of the controlled
studies, now with their numbers. The four cautionary cases the first pass could only recall hold up, three of them with
sizes.

**What it corrected.** The corrections that matter are in the table. Smaller ones were made in place: addresses that had
moved, words in quotation marks that were a paraphrase, the last rungs of the statistics ladder re-sourced from
Eurostat's 2025 manual, and a habit of dating rows by the load that belongs to one vendor's guidance and not to Kimball.

| What the first pass had | What the page says |
|---|---|
| legislation.gov.uk shows text not yet in force at an address ending in the keyword `prospective` | The developer pages still say so, and all six addresses tried returned "Page Not Found". The text is at the provision's plain address under the label "Prospective" |
| A box on legislation.gov.uk lists "outstanding changes not yet made by the legislation.gov.uk editorial team" | That sentence was on none of the thirteen pages opened. The box says the text "is up to date with all changes known to be in force on or before" a date, and the latest version offers "View outstanding changes" |
| The habits "nothing is deleted" and "every change names its authority" hold across all the systems | Both are narrower. Publishers delete nothing, and every HR product has an action that rewrites history. An authority is named where a legal act causes the change, and not in SNOMED CT or KLASS |
| In SNOMED CT the retirement reason decides the successor link, with SAME AS, REPLACED BY and MOVED TO as the links, and identifiers are "never reused" | The Editorial Guide pairs each reason with the links it may take and how many, "at the author's discretion". There are eleven kinds of link, and MOVED TO names a namespace, not a replacement. The pages call identifiers permanent and do not use the words "never reused" |
| The UK's coding rule quoted from Wikipedia and the Scottish Government, and one identity rule for geography | The ONS's own policy, in its own words, with no minimum size of change. NUTS has a 1% threshold and has brought a code back, and Norway kept a code through a merger, so the rule differs by register |
| KLASS "runs the floating regime" | Called live, it lists named versions whose windows meet end to start. The three calls are confirmed, two of them by calling them |
| Eurostat's "double reporting" on the NACE overview page; restating history onto new NUTS regions "was not always possible" | The first is on the NACE transition page. The page behind the second has moved, and the sentence gave way to the NUTS history page's rule that restating is subject to "a feasibility evaluation" |
| Palantir's History tab and Action Log, in quotation marks | The first was a paraphrase. The second, "not just what is changing, but why", is not on the page today. Both now carry the page's words. Deprecation with a reason, a deadline and a successor applies to every kind of resource, not to properties only |
| No product binds a reason to a change of definition | Reasons exist as optional notes: a Foundry proposal's title and description, a DataHub proposal note or version comment, an OpenMetadata release note. None is required |
| DataHub added glossary term versions in November 2026; OpenMetadata's ontology releases are a design on its main branch | DataHub's versions date from 1 June 2026 through the API, and the November release put them in the term's menu as drafts. OpenMetadata's releases are in its published documentation under an unreleased version label, with the version bump and the notes optional |
| Fowler's figure plots record time upward | It runs down the page |
| The 2022 graph study found node-link drawings with automatic animation "the quickest and most accurate" | Automatic animation was the most accurate, on graphs of about 40 nodes with four time steps, and views side by side had the lowest times. The authors put the accuracy down to the small graphs |
| Staged transitions "beat both a flip-book and plain interpolation" | The abstract says they outperformed existing techniques for moving through time on several tasks |
| ALFRED "offers only the dates on which a series was revised" | Its graph editor takes a typed as-of date or a pick from a list of vintages |

**What is still unread.** ALFRED's own definitions of its three dates, its saved example graph and its terms of use: the
host answered no plain request in any part of the pass, and the third part opened only its series page (in a browser),
its graph editor and its help page. The eCFR's timeline and comparison screens: the site sends every page to a checking
host that the proxy refuses, and only its data service answered. Workday's documentation: doc.workday.com,
community.workday.com and www.workday.com were refused, so its "as of" task and its ways of correcting rest on summaries
and on one second-hand page. Other hosts the proxy refused or that did not answer: uscode.house.gov (the US Code's
release points), fred.stlouisfed.org, showvoc.op.europa.eu (the NACE correspondence tables), geoportal.statistics.gov.uk
(the Code History Database's files), upload.wikimedia.org and www.mediawiki.org (Wikipedia's images and the slider's
help page), catalog.ourworldindata.org and archive.ourworldindata.org (the interactive and archived charts),
export.arxiv.org, observablehq.com, and palantir.com without "www". Hosts outside the allowed list were not tried, among
them cdc.gov, gov.uk, the UK web archive, books.google.com and sdmx.org. Not attempted, and so as the first pass left
them: Akoma Ntoso; RxNorm, LOINC and the ICD maps; GSIM; the US Census Bureau's concordances; NHGIS and A Vision of
Britain; IAS 8 and US restatement practice; the health comparability ratios; Oracle's and SAP's pages on as-is and
as-was reporting; Collibra and the other catalogs; ChartHop; the systematic review of ontology-change visualisation and
the tools it lists; Robertson et al. and Tversky et al.; finance beyond the three repositories read; and all of
engineering configuration management. No rendered screen of an HR product was seen, and nothing was seen at phone size.

Some specifics need care. The Gene Ontology figures are the research session's own counts over a repository file, as are
the second pass's counts over the survey site's data file and its searches of Palantir's and OpenMetadata's pages for
dates of effect. The count of 28 ontology-change tools reached the session partly through reviewer comments on a draft
of the review. A search summary's claim that PostgreSQL 19 adds `FOR PORTION OF` was contradicted by the release notes
that were read, and is left out. PeopleSoft was read in one old release of its documentation, 8.51, and OpenMetadata's
ontology pages carry an unreleased version label. The count of 31 changes to the UK's unemployment measure is
Wikipedia's, from two books that were not opened, and the table of the 1998 crime changes by offence is Wikipedia's too.
The vendors' own worked examples carry errors (two sets of dates in one PeopleSoft example, one number for two kinds of
record on an SAP page, a SNOMED CT table and its text that disagree), which shows how hard dated examples are to keep
right by hand. Claims of absence ("no product does this") hold only for the products read: Monte Carlo, Bigeye, Anomalo,
Sifflet, Metaplane, Informatica MDM, Reltio, Semarchy, PoolParty, Snowflake's and BigQuery's time travel, LookML,
AtScale, and the 2026 "context layer" offerings of Atlan, Snowflake and Databricks were not checked. The statements
about smaltfl marked "as the study reads the code" (a past "as known on" view showing a later correction's score; a
rename breaking the count of runs under a version) were inferred from source and should be confirmed in the running app.
And three questions still have no evidence at all: how readers read a series with a break, how people cope with two time
axes in one view, and how readers use the reasons attached to changes.

What would add most now is not more reading. It is the eCFR's and Workday's screens looked at from a network that
reaches them, and a small test with the people who will use these screens, on the questions the screens are for: what
changed between two dates, why this rule applied on this day, whether these two months can be compared. Technique-level
evidence does not carry across tasks, and none of it was gathered on change that is sparse, typed and explained.

### Conclusion

The asker's suspicion deserves a sharper statement than "temporal graphs are hard". Temporal graph research solved a
different problem: thousands of edges that appear and vanish, read for patterns. An ontology in the maintainers' sense
changes a few times a week, each change discrete, typed and made by someone for a reason. That is the shape of a statute
book or a commit history, and the fields that have kept such histories for decades converged on a register and not a
network. The same fields show that the first design decision is not about time at all. It is what counts as a change to
the register. Official geography answers that a new boundary makes a new code and a new name does not; the biomedical
ontologies, that a new meaning makes a new term; smaltfl's maintainers, that rules, meanings and kinds count and the
people and teams the data describes do not. The hard cases all sit on that line, in lists that arrive as rows and define
what is measured, and that is where a tool earns trust or loses it.

It follows that smaltfl's temporal ontology is already half built, and that the part most worth building next is the
part no hash can see. A hash proves which rules ran. It cannot say that a column meant one thing until March and another
afterwards; only the kind and the reason on the change say that, with the event that prompted it. A workable test for
every screen comes out of this. For any number on show, a reader should reach four answers in a tap each, on a phone:
which version of the rules judged it and since when; why that version came to be, in someone's words; what was going on
then, in the business and at the source; and whether this is the figure as it ran, as it was later corrected, or as
recomputed under today's rules. smaltfl answers the first and most of the last today. No product read here answers all
four, because the layers that would let one do so, definitions in catalogs and Git, the history of data in storage
engines, reasons in workflow tools, context in documents, are kept apart everywhere except in a tool where the run binds
them by hash. A second reading of the primary pages corrected details and moved none of this. It added one distinction
that explains where the working registers differ: a publisher, whose readers have relied on what it issued, never takes
anything back, and an operated system offers its maintainers a guarded rewrite. smaltfl is both at once, edited by its
owners and read by people who act on its days, which puts the line where it already draws it: at what readers have seen.
