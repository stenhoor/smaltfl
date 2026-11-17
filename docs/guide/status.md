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
| Flows in flows | A flow reads other flows: one definition read by many, the plan still flat, each flow known by its own hash and named in every run; on the canvas a card a flow with its day by the month's marks and its extent, a sheet for what holds it and what it gives, and its own canvas a tap in; Larkspur as five flows ([ADR 0025](../adr/0025-flows-in-flows)) | In part: the core and the canvas; the month in tiers, exploring, deciding at a flow and the rest to come |
| The answers of 2026-11-14 | A what-if made the day's in one tap; a restatement that changes no day signed off; the audit of restatements; a day restated as not published left out of learning; readers on the latest day, each day keeping its own version; a file whose columns changed held, a renamed column read by its old name from the day on, a new column noted, a join column's reach said and confirmed twice, a rename carried through the steps; loose ids said per check, a gold table's key and the needs rules written once in the ontology, drawings in the ontology's labels, a made dataset's rules on the Ontology page; a day paused on an overwhelming learned finding, levels and fills for a slot of a day; values, bands and a key proposed from a file's own data, each accepted by the owner with a reason ([ADR 0022](../adr/0022-the-answers-of-2026-11-14)) | Built |
| The first load | The first day computed ahead by the build and checked by the page and the run, hash for hash: Larkspur's first day in about 4.5 s ([ADR 0019](../adr/0019-ranges-computed-ahead)) | In |
| SQL through smaltql | smaltdb runs plans and smaltql reads the SQL smaltfl writes ([ADR 0017](../adr/0017-stenhoors-repositories-at-main)); next, SQL steps bound to plans through smaltql | In part |
| Publishing to npm | `smaltfl` and `smaltfl/notebook` | After smaltdb 0.9.0 |

## Demos

- [The tour](/app/){target="_self"}: Larkspur, a fictional financial-services group, about 2,400 applications, its
  organisation and shared platforms, on a February and March made to show what a flow does, in six scenes listed on
  its month ([ADR 0023](../adr/0023-the-demo-as-a-tour)).
- [Larkspur's planted month](/larkspur/){target="_self"}: the same group, six months of history and a planted March at
  every layer, bronze to gold; ADR 0020's answer key, the posture over the month and the rules changed over time.
- [The control estate](/estate/){target="_self"}: 600 applications, twelve controls, a year of history and a planted
  March; the answer key the gates were built against, kept as a regression, and a day whose TLS file renames the
  column every control is joined on.
- [The sign-in log](/signins/){target="_self"}: a year of generated sign-ins, the shared ontology's rules and fixes,
  two days only the models see, and two days whose files changed their columns (a column added on Thu Mar 7, one
  renamed on Fri Mar 22).

## Depends on

stenhoor's smalt repositories, each pinned in `packed.json` to the latest commit of its main
([ADR 0017](../adr/0017-stenhoors-repositories-at-main)) until they are on npm: smaltdb 0.9.0 and its plugins, smaltql
for SQL, smaltnb and smaltkit (smaltty) for the notebooks. A change smaltfl needs in another smalt repository is discussed with its owner first
([ADR 0001](../adr/0001-initial-decisions)).
