# Status

smaltfl is in early development and not published. This page says what is in, as of 2026-11-13. What is built in
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
| The first load | The first day computed ahead by the build and checked by the page and the run, hash for hash: Larkspur's first day in about 4.5 s ([ADR 0019](../adr/0019-ranges-computed-ahead)) | In |
| SQL through smaltql | smaltdb runs plans and smaltql reads the SQL smaltfl writes ([ADR 0017](../adr/0017-stenhoors-repositories-at-main)); next, SQL steps bound to plans through smaltql | In part |
| Publishing to npm | `smaltfl` and `smaltfl/notebook` | After smaltdb 0.9.0 |

## Demos

- [Larkspur](/app/){target="_self"}: a fictional financial-services group, about 2,400 applications, its organisation
  and shared platforms, six months of history and a planted March at every layer, bronze to gold.
- [The control estate](/estate/){target="_self"}: 600 applications, twelve controls, a year of history and a planted
  March; the answer key the gates were built against, kept as a regression.
- [The sign-in log](/signins/){target="_self"}: a year of generated sign-ins, the shared ontology's rules and fixes, and
  two days only the models see.

## Depends on

stenhoor's smalt repositories, each pinned in `packed.json` to the latest commit of its main
([ADR 0017](../adr/0017-stenhoors-repositories-at-main)) until they are on npm: smaltdb 0.9.0 and its plugins, smaltql
for SQL, smaltnb and smaltkit (smaltty) for the notebooks. A change smaltfl needs in another smalt repository is discussed with its owner first
([ADR 0001](../adr/0001-initial-decisions)).
