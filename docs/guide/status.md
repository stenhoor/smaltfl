# Status

smaltfl is in early development and not published. This page says what is in, as of 2026-11-17. What is built in
detail, how to check it and what is left are in [where the work stands](../HANDOFF).

| Piece | What | State |
|---|---|---|
| Core and runtime | Flow documents, the flow plan and its keys, the smaltdb runtime plugin, signed run manifests, verify, the hash-chained record, audit bags ([ADR 0004](../adr/0004-the-flow-plan), [0006](../adr/0006-integrity)) | In |
| The day's news | One cause a day, drawn visual-first, with word budgets ([ADR 0008](../adr/0008-visual-first-news)) | In |
| Paused, not published | Holds, decisions, fills from another day, accepting a new level ([ADR 0009](../adr/0009-paused-not-published)) | In |
| Any dataset | Calendars, watches, a load's measures, several watched sources ([ADR 0010](../adr/0010-any-dataset)) | In |
| Notebooks | smaltnb notebooks as the step surface; the notebook read as a page with outputs, callouts, models and your own cells ([ADR 0011](../adr/0011-notebooks-as-the-step-surface)) | In |
| The brief | A held day told in SBAR order ([ADR 0012](../adr/0012-visual-first-in-two-minutes)) | In |
| Checks nobody wrote | Pair associations, the isolation forest, the classifier on a kept sample ([ADR 0013](../adr/0013-discovered-checks)) | In |
| Gates | Bronze, silver and gold checks, bands, due dates, scope, dependency and reconciliation rules, the seal ([ADR 0014](../adr/0014-gates)) | In |
| The bronze layer and the ontology | What a dataset's rows are, rules people set, shared ontologies, allowed fixes, the models' columns ([ADR 0015](../adr/0015-the-bronze-layer)) | In |
| The estate as a company | Larkspur: an organisation and its leaders, shared platforms, a conformed silver and a gold data product with contracts, judged against its own answer key; the posture dashboard over it ([ADR 0020](../adr/0020-the-estate-as-a-company)) | In |
| Time | The month to pick a day from and each day's own screen, over a month the build runs and records; a day's versions and corrections, compared by summary and by rows; rules that take effect from a day, back-dated changes restated under one decision, the story's changes recorded by the build, the Ontology view's versions, any two compared, and what-if runs, kept apart from the record ([ADR 0021](../adr/0021-time)) | Built |
| The month at a glance | What waits for a decision above everything; the month in a sentence, beside the month before, with its counts; a pager and a link for each month; five marks on the calendar, and words for what people did; a day told in order (what held it, what it held back, who decided and why); each file and step as a row of the month's days, the worst first, a step that only followed a file told apart from one that broke on its own; the product's score with its definition, a verdict and what moved it ([ADR 0024](../adr/0024-the-month-at-a-glance)) | Built, for the maintainers to confirm |
| Flows in flows | A flow reads other flows: one definition read by many, the plan still flat, each flow known by its own hash and named in every run; on the canvas a card a flow with its day by the month's marks and its extent, a sheet for what holds it and what it gives, and its own canvas a tap in; on the month a row a flow above its files and steps, a flow that only followed or waited on another told apart, and a month of its own for each flow; an Explore tab on every file and published dataset (what a row is, a card a column, a part picked and lit in every other column and kept, how it joins, its rows against another day's); a held day decided once, at the flow that holds, every decision saying whose it is; the estate's ontology in a document of its own, imported by every flow under its own hash, a flow's own handling of a column marked with its reason and noted on the Ontology page; a change made at the flow it belongs to, said on its card and its sheet with the flows that follow it, and tested on the last recorded days as what-if runs; a flow pinned by the hash its reader names; a catalogue of flows made already, added from the page and built from the day's run, and a join form that writes a join as a notebook cell; three lines in the family's voice, on a success seen once and an empty screen, and plain words for anyone who wants none; a flow with open inputs and settings used under a name as often as it is wanted, each use a flow of its own, named and hashed apart; a read flow as a page of its own, a held day decided on it or on its reader's page carried to the other, cited and proved for the offline audit; Larkspur as five flows ([ADR 0026](../adr/0026-flows-in-flows)) | Built |
| The answers of 2026-11-14 | A what-if made the day's in one tap; a restatement that changes no day signed off; the audit of restatements; a day restated as not published left out of learning; readers on the latest day, each day keeping its own version; a file whose columns changed held, a renamed column read by its old name from the day on, a new column noted, a join column's reach said and confirmed twice, a rename carried through the steps; loose ids said per check, a gold table's key and the needs rules written once in the ontology, drawings in the ontology's labels, a made dataset's rules on the Ontology page; a day paused on an overwhelming learned finding, levels and fills for a slot of a day; values, bands and a key proposed from a file's own data, each accepted by the owner with a reason ([ADR 0022](../adr/0022-the-answers-of-2026-11-14)) | Built |
| The first load | The first day computed ahead by the build and checked by the page and the run, hash for hash: Larkspur's first day in about 4.5 s ([ADR 0019](../adr/0019-ranges-computed-ahead)) | In |
| SQL through smaltql | smaltdb runs plans and smaltql reads the SQL smaltfl writes ([ADR 0017](../adr/0017-stenhoors-repositories-at-main)); next, SQL steps bound to plans through smaltql | In part |
| Publishing to npm | `smaltfl` and `smaltfl/notebook` | After smaltdb 0.9.0 |

## Demos

- [The tour](/app/){target="_self"}: Larkspur, a fictional financial-services group, about 2,400 applications, its
  organisation and shared platforms, on a February and March made to show what a flow does, in seven scenes listed on
  its month ([ADR 0023](../adr/0023-the-demo-as-a-tour); the seventh, a change to the ontology, is
  [ADR 0027](../adr/0027-the-ontology-over-time)'s).
- [Evidence feeds' own page](/feeds/){target="_self"}: one of the estate's flows as a page of its own on the tour's
  files; a paused day decided there or on the tour is carried to the other ([ADR 0026](../adr/0026-flows-in-flows) §6).
- [Larkspur's planted month](/larkspur/){target="_self"}: the same group, six months of history and a planted March at
  every layer, bronze to gold; ADR 0020's answer key, the posture over the month and the rules changed over time.
  Its trend is read across a change ([ADR 0027](../adr/0027-the-ontology-over-time) §7): the build ran the first day
  of each change of the business both ways, the coverage is cut on Wed Mar 27 where the catalogue's new control moved
  it by 8.3 points, and the checks learn from the new level from the day after.
- [The control estate](/estate/){target="_self"}: 600 applications, twelve controls, a year of history and a planted
  March; the answer key the gates were built against, kept as a regression, and a day whose TLS file renames the
  column every control is joined on.
- [The sign-in log](/signins/){target="_self"}: a year of generated sign-ins, the shared ontology's rules and fixes,
  two days only the models see, two days whose files changed their columns (a column added on Thu Mar 7, one
  renamed on Fri Mar 22), and three days at the gate ([ADR 0027](../adr/0027-the-ontology-over-time) §4): Method is a
  closed column, magic links arrive on Sat Mar 23 and codes by text message on Sun Mar 24, each waiting for someone
  to declare it, publish without it or not publish. **Add a source ›**, above its canvas, is where a file of your
  own is described and added, or a dataset described before its data (§5). On any of them the Ontology view's
  **Kinds and relations** is where a kind of thing, a relation, what a row is and a dependency are added, changed
  and ended from a day, and a column's card is where its meaning is reworded or redefined (§3).

## Depends on

stenhoor's smalt repositories, each pinned in `packed.json` to the latest commit of its main
([ADR 0017](../adr/0017-stenhoors-repositories-at-main)) until they are on npm: smaltdb 0.9.0 and its plugins, smaltql
for SQL, smaltnb and smaltkit (smaltty) for the notebooks. A change smaltfl needs in another smalt repository is discussed with its owner first
([ADR 0001](../adr/0001-initial-decisions)).
