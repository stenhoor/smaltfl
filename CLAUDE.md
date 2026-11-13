# CLAUDE.md

This repository is smaltfl, said "smalt-flow": data pipelines for [smaltdb](https://github.com/stenhoor/smaltdb),
built visually and run in the browser, with an ontology, actions, policies and content hashes attached to what they
produce. It is a shared project in the smalt family: the maintainers decide together, in ADRs ([docs/adr/](docs/adr/)),
from the design interview in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md). Several Claude Code sessions may work on
the smalt repos in parallel and cannot see each other: this file is the shared starting point, and its working rules
match smaltdb's `CLAUDE.md`.

## Commands

| Command | What it does | When |
|---|---|---|
| `npm ci && npm run deps` | Installs dependencies, then the pinned builds of stenhoor's smalt repositories in `packed.json` (smaltdb, smaltql, the `@smaltdb/*` plugins, smaltnb, smaltkit) | First, and again after every `npm ci` or `npm install` |
| `npm run deps:latest` | Moves every pin in `packed.json` to the latest commit of its repository's `main` and installs them (`-- --check` only says which are behind). See "The smalt repositories" | At the start of every session, before other work |
| `npm run check` | `npm run typecheck` then `npm test` (vitest, under a minute on four cores) | Before every commit |
| `npm run test:slow` | The month-long engine runs `npm test` leaves out (`SLOW` in `vitest.config.ts`: `test/estate-flow.test.ts`, about 90 s). CI runs it, and `npm run test:isolated` (every file in a fresh module graph), in a job beside `test` | Changes to the runtime, the gates or the estate |
| `npm run build` | `dist/`: the core (`index.js`), the runtime plugin (`plugin/index.js`) and their declarations | Packaging checks |
| `npm run docs:dev` | The site (VitePress, `docs/`, the brand kit copied unchanged into `docs/.vitepress/theme/`); `.github/workflows/docs.yml` deploys it to GitHub Pages with the estate demo at `/app/` and the sign-ins at `/signins/` (each build writes `index.html` beside `page.html`) | Docs and site changes |
| `npm run bench` | The scenario benchmarks in `bench/`, written to `bench/results/node.json` | Changes that could affect speed |
| `npm run build:app` | The app in `dist/app` on `examples/nyc-taxis-weather/` (its notebooks expanded, shipped as `data/flow.json`), with the `data` branch's daily loads if fetched (else the XS fixtures); `-- --flow examples/security-signins/flow.json --out dist/app-signins` for the sign-ins (its generator's `--demo` days from the data list's `generateArgs`). Bundles are named by content (`bundles.json`). A generated flow's days, histories and samples are kept in `node_modules/.cache/smaltfl/data/<hash of what makes them>/`: after a change to the app alone the build takes seconds, not minutes (the docs deploy caches the same folder) | Changes to `src/app` |
| `node tools/browser/regress.cjs APP OUT estate notebook split@desktop,tablet-wide,wide` | The browser regression: each stop set at every size (phone, tablet, tablet-wide, desktop, wide), as many at once as there are cores, one table of what passed; `--devices` narrows the sizes. Copy the built app out of `dist/` first | Before a PR that touches `src/app`; one set and its sizes while iterating |

`npm run typecheck` runs on TypeScript 7: `typescript7`, an npm alias, run as `node node_modules/typescript7/bin/tsc`.
The declarations `npm run build` emits stay on TypeScript 6.0.3 (`typescript`, so `npx tsc` is 6.0.3) for one more
release (smaltty ADR 0030).

## Layout

- `src/core/`: pure TypeScript, no DOM or engine imports. `document.ts`: the flow document, what people write.
  `plan.ts`: its translation into the flow plan, what the machine runs. `optimize.ts`: what runs, and what is stored
  or folded. `emit.ts`: the flow plan as engine SQL, the only module that knows what the engine accepts. `keys.ts`,
  `canonical.ts`, `hash.ts`, `sha256.ts`, `sqltext.ts`; `manifest.ts`: run manifests, identity cards, signatures;
  `protocol.ts`: what the core and the plugin say to each other.
- `src/plugin/`: the runtime plugin (smaltdb plugin API v1). `runtime.ts` runs a plan, `verify.ts` verifies a run,
  `dataset-hash.ts` hashes datasets in the engine, `store.ts` keeps smaltfl's own tables.
- `src/index.ts`: the core's exports, and `runFlow` / `verifyRun`.
- `test/`: vitest on the in-process engine. `fixtures/taxi.ts` is the seeded stand-in for the scenario's data and the
  reference flow; `fixtures/reference.ts` computes the same flow in plain JavaScript to check results against;
  `worker-protocol.test.ts` runs through the smaltdb client and engine server, the path a page takes.
- `bench/`: the scenario benchmarks (docs/SCENARIO.md §7).
- `src/app/`: the app. `main.ts` (plain DOM and SVG), `engine.ts` (smaltdb in a worker, `worker.ts`, or in the page,
  `inline.ts`), `layout.ts` (where cards sit), `page.html` (the page's content). `npm run build:app` writes `dist/app`.
- `examples/`: flow documents and their sources; `fixtures/xs/`: real tier XS data for the tests.
- `scripts/data/build.py` and `.github/workflows/data.yml`: the scenario's data, fetched on a GitHub runner into the
  `data` branch (`git fetch origin data --depth 1`); `scripts/data/history.ts` measures the history's days there, on
  the runtime (`node scripts/data/history.mjs --flow DOC --watch SOURCE --files LIST.json OUT.json`, or `DAYS_DIR
  OUT.json` for the taxi example).
- The day's news (ADR 0008): `src/core/news.ts` finds what is out of the ordinary, `src/core/story.ts` tells it as one
  cause with what follows from it, `src/app/viz.ts` draws it (SVG strings, tested in Node). Words at a glance are
  budgeted (`glanceStrings`, `wordsIn`); a new kind of finding gets its visual there too.
- Integrity (ADR 0006): `src/core/integrity.ts` (a data file against the list), `src/app/fetch-checked.ts`,
  `src/plugin/pinned.ts` (files hashed and served in the engine), run/1 in `src/core/manifest.ts`, verify's levels in
  `src/plugin/verify.ts`, the record (`src/core/log.ts`, RFC 9162; `src/app/record.ts`, IndexedDB), the audit bag
  (`src/core/bag.ts`, `src/core/zip.ts`) and its offline check (`src/core/audit.ts`, `node scripts/audit.mjs check
  BAG.zip`). A new hash encoding goes in an ADR first, with test vectors.
- A day that is off is paused, not published (ADR 0009): the document's `publish` block (format 2, plan/1);
  `src/core/hold.ts` says what holds a run (its checks, the story's claim), what waits, and what the record decided;
  `src/plugin/runtime.ts` holds instead of throwing and `src/plugin/release.ts` publishes a held run as a recorded
  decision says; verify's *held* check and `src/core/audit.ts` check both; `src/core/decision.ts` and
  `src/app/viz.ts` `decisionRow` draw and word the decision. The days `wrong` and `short` hold on the history are a
  test vector (`test/hold-real.test.ts`): a story change that moves them is a decision, not a fix.
- Filling a paused day (ADR 0009 amendment 1): the `fill` step marks every row with `filled_from`; `src/core/fill.ts`
  says what is missing, the donor and the derived document; `src/app/fills.ts` pins a donor and stages the derived
  run; the plugin releases it (`stage`, `release.ts`) and withdraws it (Q-61). ◧ filled, ◐ the part alone, stipple for
  another day's rows inside the day (`viz.ts`). The donor table (`test/fill-real.test.ts`) is a test vector too.
- Any dataset (ADR 0010): `src/core/calendar.ts` takes the flow's calendar (`us-nyc/1`, `us/1`, `none`); format 3 and
  plan/2 say how a watched source is judged (`WatchDef`, `WatchPlan`); `judgeOf` and `flowNames` (news.ts) read the
  watch's settings, the ontology's marks (`bad`, `newValues`, `after`) and its nouns; a day with nothing to compare
  against is `unlearned` (◌, published, marked). `test/fixtures/security.ts` is the sign-in log every phase asserts on
  (`test/security.test.ts`). No new string on screen writes "trips": counts go through `names.noun`. Phase 2: a load's
  measures (`src/core/measures.ts`, the plugin's `measure`), smaltfl-history/3 with a tail appended from each run, and
  claim/2 under plan/2 (`loadClaim`); `scripts/data/history.ts` builds any flow's history (`--flow DOC --watch SOURCE
  --files LIST.json`); sources are bound by id (`examples/<flow>.data.json`, loads.json format 2, `src/app/datalist.ts`);
  `npm run build:app -- --flow examples/security-signins.smaltfl.json` builds the app on the generated sign-ins.
  Phase 3: the calendar's own `days`, `windows` and `dates` (`recurringOf`, `occurrencesBefore`; normal.ts's
  occurrences' guess), the patterns `none` and `monthly`, breaks from accepted levels, the echo fix and `relearn`
  (off unless a watch asks) in `normal.ts`; `rangesFor(doc, source)` (hold.ts) is what a flow's ranges are made with.
  The taxi example is format 3 (Election Day; 25 days under `wrong`; `exampleLegacy()` in `test/helpers/example.ts`
  is its legacy form, 28 days), and `test/backtest-real.test.ts` (`SMALTFL_REAL=all`) prints the variants. Accept the
  new level (`accept`, Q-57): `fill.ts` `acceptable`/`levelMetrics`/`levelWays`, `hold.ts` `levelsOf`/`levelFor`, a
  decide entry's `level`, a claim's `levels`, the step mark `g-level` in `viz.ts`. Phase 4: a watch's `every` (a slot of a
  day, `slotOf`, `partsOf` in calendar.ts; `slotSeries` in history.ts judges a slot from the same slot of each day);
  several watched sources hold, decide and release by load (`Load`, `loadsOf`, `carry`, `decisionForLoad`,
  `standingForLoad` in hold.ts; a release's `loads`); variant E of the sign-in log (`edrHistory`, `twoSourceDoc`) and
  `test/several.test.ts` through the engine.
- Notebooks as the step surface (ADR 0011): a format-4 document's steps are its smaltnb notebooks' cells.
  `src/core/notebook.ts` derives them (`loadNotebooks`, `expandNotebooks`, `stepsOfNotebooks`) with smaltnb's parser
  and graph on smaltty (`smaltkit/typescript`, passed in); `src/notebook.ts` is `smaltfl/notebook`, what a notebook
  imports (`source`, `check`, `fill`); its plan is plan/3 (E14, `test/notebook.test.ts`). A flow is a folder:
  `examples/security-signins/` and `examples/nyc-taxis-weather/` (`flow.json` and `*.nb.ts`, typechecked with the
  repository; `test/notebook-taxi.test.ts` holds them to the JSON forms, which the real-history tests still read).
  `scripts/flow.ts` reads either form from disk for the app build and the history builder. On the canvas a notebook
  is a box (a section folded, `notebookSectionId`), and tapping it opens the notebook read top to bottom
  (`renderNotebookSheet`, `notebookElements`), each cell a tap from its own sheet; `cells`, `groups` and `outline` are
  the display fields `expandNotebooks` fills for it. `packed.json` pins smaltnb and smaltkit beside smaltdb.
- The brief (ADR 0012 §1, §2): `src/core/brief.ts` orders a day's facts in SBAR order (`briefOf`, `briefText`, the
  glance budget `briefWords`, `briefBanned`); `briefSections` in `src/app/main.ts` puts it in the input card's News on
  a day with something to say (status, the sentence, impact, cause, the fix with a tap to propose another, copy as
  text, image or link; `#brief-YYYY-MM-DD` opens a day's). `tools/judges/two-minute.md` is the test it is judged by.
- Checks nobody wrote (ADR 0013): a history keeps each pair's cells day by day while they are few (`PAIR_CELLS`,
  `measures.ts`); `src/core/combos.ts` judges every pair's association against its own history (`comboNews`, the
  `combo` metric: a cell's log odds ratio, `history.ts`) and the day as a whole against the days before by the
  isolation forest (`unlikeNews`); kinds `combo` and `unlike` are findings of the values cell. A `publish.watch` may name
  a published step (its claim told in the engine from `RunContext.tell`, `src/plugin/tell.ts`; its history built by
  `scripts/data/history.ts --watch <step>` running the flow on each day's files). `examples/controls/` is the controls
  posture (six daily control sources, the posture joined and watched, five planted days; `test/fixtures/controls.ts`,
  `scripts/data/controls.ts`, `test/controls.test.ts`; `test/controls-anyday.test.ts` plants the fixture's `Trouble`
  on other days and another seed through `test/helpers/controls-world.ts`); `npm run build:app -- --flow examples/controls/flow.json --out
  dist/app-controls` builds it; loads.json may list several daily sources (read as days) and name the dataset the
  views follow (`judged`). `examples/control-estate/` is the richer dataset (ADR 0013 §8: a typed inventory, twelve
  controls by applicability, five on SLA dates, three layers of planted days; `test/fixtures/estate.ts`,
  `scripts/data/estate.ts`, `test/estate.test.ts` asserts the data's facts; `test/estate-flow.test.ts` runs its March
  through the engine, `test/helpers/estate-world.ts`, against ADR 0014's answer key; `scores.nb.ts` scores each application
  (`app_scores`: controls passed, failed, excepted, the ones failed by name, a standing) and `summary.nb.ts` counts
  them by hosting and criticality (`by_profile`), each control by type (`control_by_type`) and the controls failed
  together (`failed_together`); the generator's hosting effects (`riskOf`) are what they show). A small output's Data
  tab draws it at a glance (`src/app/grid.ts` `gridOf`, `standOut`; `heatGrid` in `viz.ts`; `tools/browser/stops/apps.json`).
  The notebook read as a page, as smaltnb shows one (`renderNotebookSheet`, full screen on a phone; Q-158): smaltnb's
  bar (Run all, + SQL, + Text, Source), each cell a smaltnb cell (`src/app/nbcells.ts` on smaltkit's `editor`, `grid`
  and `markdown`, its `ui.css` inlined by `build-app.mjs` and restyled by `--sk-*` in `page.html`): a header (name,
  chip, status from the run, `flowStatus`), the flow's own code read-only, a step's callouts (what a written rule
  caught, the day's warn and alert news) and its rows in the grid with a small output's picture above (`flowCell`,
  `fillFlowOutput`), **Models** on a watched step; then **Your cells** (`exploreCells`, `runExplore`, `exploreSql`):
  editable SQL and text cells, Ctrl+Enter and Shift+Enter, a cell read by its name from the cells below it, kept in the
  browser and never in the notebook or a hash (`tools/browser/stops/notebook.json`).
- Gates (ADR 0014): `src/core/gates.ts` is the vocabulary (`CHECK_NAMES`, written or learned, `LAYER_DEFAULTS`),
  `gate()` in `src/notebook.ts` the cell (`notebook.ts` derives `doc.gates`, the cell kept as `cells["gate:<node>"]`,
  outline kind `gate`), plan/4 a watch's `checks` (every check's mode, filled in from its layer; only a flow that
  declares a gate is plan/4, every other plan hashes as before), `JudgeSettings.checks` what `newsOf` applies
  (`checkOf` maps a finding's kind to its check, `gated` caps a learned check at warn, drops an off one, never softens
  a bad value; `Finding.check`). The app: the layer on the card's label, a read-only **Checks** tab (`checksTab`,
  `loadFindings` tells another watched load's own news from its base and tail). Slice 2: the ontology's `expect`
  bands and `due` marks (`ontology.ts`, plan/4's watch `expect`/`due`), the `band` finding (a value with a band is
  judged by it alone), the due counts in measures and the history (`Measures.due`, `HistoryFile.due`, only with a
  mark), the `due` finding from yesterday's cohort against the pooled cohort share (`lateAt`, `lateUsual`), Accept
  the new band (`levelOf`'s `band`, `applyBand` in the app). Slice 3: a gate's `scope` and `needs` rules (`ScopeRule`,
  `NeedsRule`; the notebook resolves the datasets they name), counted in the engine (`emitScopeCounts`,
  `emitNeedsCounts`, `Measures.gate`, `HistoryFile.gate`), the `scope` and `needs` findings, and upstream attribution
  (`StoryOptions.upstream`: a step's finding about a source's column follows the source; a wrong source explains the
  step's day). Slice 4: the kept sample (`src/core/apart.ts` `SampleFile`, `keepSample`, `appendSample`; the plugin's
  `sample` op and `sampleLoad`; the builder's `--sample`, loads.json `samples`, the app's `samples`/`keptRows`;
  `RunResult.kept`) and the classifier (`tellApart`, `likeDays`, the `apart` finding, check `classifier`). Slice 5:
  the `reconcile` rule (`ReconcileRule`, `emitReconcileCounts`; a measure on a watched node, `Measures.gate.reconcile`;
  on a gold node plan/4's `publish.gates`, counted by the run into `ManifestNode.gate`, held by `holdsOf` with
  `reconcileSaid`, counted again by verify's `gate` check) and the seal (the app's `sealOfRun`/`sealIfReady`: the
  owner's signature on a run whose gates passed or whose holds were decided and published; `sealPart` on a gold
  card's Checks tab). Slice 6: toggles that write the gate cell (`src/core/gatecell.ts` `toggleCheck`,
  `rewriteGateCall`, `withGateImport`; the app's `setCheck`, `recordFlowChange`) and feedback reasons as decisions
  (`feedbackPart`). Slice 7: a refused file as the schema check's hold in a gated flow (`runPlan` records the source
  as `refused` and builds nothing; `holdsOf`/`refusedSaid`; verify and release know a run that built nothing).
- The bronze layer (ADR 0015): the ontology's `rows` says what a dataset's rows are (`RowsDef`, `rowsOf`,
  `conditionOf` in `ontology.ts`: one row an object of a type, for the objects a condition given as data selects;
  validated in `document.ts`, a gate's written check). `writtenRules` (`gates.ts`) gives a node's scope, dependencies
  and key, the gate cell's own first and the ontology's otherwise, read by the plan (`rulesOf`) and the judge
  (`judgeOf`); `emitMatch` (`emit.ts`) writes the condition, so plan/4's scope keeps its four fields. Bronze holds on
  `reconcile` by default; the story leads an all but empty file with the amount (the scope's missing keys follow) and
  a file with its rows twice with its key (the amount follows where the repeats account for the rise); rows with no
  key lead by the key where the scope reads the same column (`JudgeSettings.scopeKey`). An entry on a dataset nothing
  watches is taken and gives no rule. The estate declares `application` and one `rows` entry a control
  (`test/rows.test.ts`, with a tied watched step run through the engine; `test/estate.test.ts` holds the entries to
  the generator; `test/estate-flow.test.ts`, whose world keeps each day's `measures` and `ranges`); the Ontology page
  reads a type whose objects are a source from the run's file (`renderOntology`). Amendment 1, piece (a): the
  Ontology page is laid out by file, showing today's rules with nothing edited and no hash moved
  (`src/core/ontologypage.ts` `ontologyPage`: a section a source with its own rules, a card a column with its rules
  in words, each rule with an id, a kind and how it came to be, `discovered` empty; the app's `renderFiles` and
  `fileSection` draw a column with the Columns tab's `columnShape`; `test/ontologypage.test.ts`; `estate.json`'s
  ontology stops). A file's rule about a column is listed on that column's card too (`Rule.columns`,
  `ColumnCard.fileRules`), a rule nothing judges says why (`Rule.unchecked`: its check off, a band or a due date
  checked in its place), and a file the run read nothing of has the columns its data list declares (`fileView`). Names
  and labels (piece b, first stage): a label is shown only where it says more than the thing (`saysMore`,
  `meaningBeyond`; `ColumnCard.standFor`, `asWritten`; the app's `labelFor`, one label a bar); the owner renames a
  column, rewords its meaning and labels its values on its card (`columnForm`), written as the file's own property
  (`nameColumn`, `src/core/flowedit.ts`); the edited document is kept across a reload by the shipped flow's hash
  (`keptOf`, `restoreKept`; `saveFlow`, `loadFlow`), every edit recorded at once with its reason (`flowEdited`: a
  rename, a toggle, an accepted band via `applyBand`), listed above the files with **Back to the flow as shipped**
  (`asShipped`, `backToShipped`); `test/flowedit.test.ts`, `estate.json`'s `names-` stops. Rules people set (pieces b
  and c, second stage): `ontology.rules` (`src/core/rules.ts`: a file's own, kinds `required`, `oneOf`, `range`, `when`,
  actions `flag`, `drop`, `hold`), enforced by the check step that reads the file (`enforcedBy` in `translate`,
  `emitRuleCheck`), edited on the Ontology page (`setRule`, `removeRule`; `ruleForm`) and switched on each source's
  **Rules** tab, which writes the check cell's `ontology: { name: 'on' | 'off' }` list (`switchRule`,
  `writeRuleSwitches`, `rewriteCheckCall`; `syncRuleCells` writes every check cell again when the ontology changes;
  `rulesTab`); the sign-in log ships three. A starting file's shared ontology (`src/core/shared.ts`,
  `examples/ontologies/auth.json`): a flow's `ontology.import` is brought in when it is read (`importOntologies` in
  `readFlow` and `loadFlowDir`, then `syncRuleCells`), so every flow reading the file has its rules
  (`examples/security-lockouts/` is the second; `test/shared.test.ts`); `npm run rules:sync` writes the cells on disk.
  The models (§6 as built): the classifier runs wherever a sample is kept (`apartEvidence`, `apartSpeaks`), the forest's
  evidence (`forestEvidence`), the **Models** tab (`modelsTab`; `forestTicks`, `aucTrack`, `rankBars` in `viz.ts`); the
  sign-ins' rows have structure and two days only the models see (`SIGNIN_DEMO`, `DEMO_DAYS`), at `--scale 0.03` with a
  year of history; `test/models.test.ts` (slow set, `test/helpers/signins-world.ts`), `tools/browser/stops/models.json`;
  the columns they leave out (`src/core/modelcols.ts`: ids, keys, free text; a property's `models: 'include'|'exclude'`).
  Amendment 2 (Q-160 to Q-162): one concept, checks. A bronze file's checks are one list (`src/core/bronze.ts`
  `bronzeOf`, `verdictSaid`): the Ontology page's checks with its ids, the contract, what is learned, each with its mode,
  its state for the day and its findings. A source a gated flow judges (`isBronze`) opens to **Quality** (`qualityTab`:
  the verdict, `issueCard`s with `qualityVisual`, notes from today's rows, `checkRow`s by origin) and **Notebook**
  (`notebookTab`: the source cell, the gate cell, the check step, an `issueSql` cell an issue, your cells); no News,
  Checks or Rules there. Each Ontology line shows its state today and "On the card ›" (`ontologyStates`,
  `openCardCheck`); the card's "defined on the Ontology page ›" marks the line (`openOntologyCheck`).
  `test/bronze.test.ts`, `tools/browser/stops/bronze.json`.
  Amendments 3 and 4: the bronze card explained for any dataset (`src/core/explain.ts`: notebook notes, plain check
  names, the models said honestly, `columnRole`/`columnGist`, the missing-data convention `GapWhy`/`gapsOf`, written in
  docs/research/ui-check-visuals.md) and the silver layer (`src/core/silver.ts` `stepStory`: each step's What happened tab,
  `rowFlow`, `RunResult.timings` outside the manifest, `notebookSummary` atop each notebook; `test/silver.test.ts`).
  Amendment 5: the bronze tables' metadata (`RunContext.sources`, `ManifestNode.ingest` bound to the file's sha256,
  `_smaltfl_ingests`; the app's `pulledIn`, `bronzeMeta`, `provenancePart`, metadata columns on a source's Data tab;
  `test/ingest.test.ts`).
  The fixes a held day is offered (`ontology.fixes`, `FIX_KINDS`, `fixesOf`, `fixOfDonor` in `rules.ts`; forward,
  backward, impute, part, replace), filtered in `donorsOf`/`offersOf`, a whole empty day fillable (`missingOf`), Replace
  the file on the decision sheet (`replaceDayFile`); the sign-ins allow forward, backward and replace (`test/fixes.test.ts`,
  `tools/browser/stops/fixes.json`). docs/research/ui-news-models-remedies.md is the UI research;
  `test/rules.test.ts`, `tools/browser/stops/rules.json`.
- First load (ADR 0019): `src/app/perf.ts` marks each phase (`window.__smaltflPerf`, `?perf`) and `engine.ts` times every
  engine request (`window.__smaltflEngine`); `SMALTFL_PROFILE=1` keeps names in the build. Every first-day file is
  fetched at once (`fetchAhead`). Ranges computed ahead (`src/core/ranges.ts`): the history builder's `--next`/`--ranges`
  writes `ranges.<watch>.json` for the first loads day, listed in loads.json (`ranges`), taken by the judge only where
  `givenApplies` (`RangeOptions.given`, `loadClaim`'s `given`, the engine's `rangesPath`); `test/ranges.test.ts`. The
  classifier judged ahead (amendment 1): the builder records its first-day answers by their inputs' sha256 into the ranges
  file (`src/core/ahead.ts`, `RangesFile.apart`, `judgedAhead` in `apartEvidence`); `tools/browser/load.cjs APP` times each
  phase. The first day computed ahead and overlapped (amendment 2, Q-179): types computed ahead (`src/core/typed.ts`:
  `history.mjs --types` writes `types.json`, loads.json's `types`, pinned as `TYPES_PATH`; the run takes `givenTypes` under
  its own `typesKey`), the first day measured ahead (`RangesFile.measured`, `measuredAhead`: the page asks the engine
  nothing before the first run), sources snapshotted ahead (`src/plugin/prepared.ts`, `prepareRun`, the plugin's
  `prepare`, taken by the run for the same pinned bytes through the same definition), a day's files pinned in one call
  (`pinFiles`, the plugin's `pinMany`), the first day's claims told while the engine finishes (`claimsEarly`), a check
  that drops nothing reading its folded input once (`onceTable`); `test/typed.test.ts`, `test/prepare.test.ts`,
  `test/dataset-hash.test.ts`. The app's bundles take one smaltdb (`oneSmaltdb` in `scripts/build-app.mjs`).
- The Larkspur estate (ADR 0020): `test/fixtures/larkspur.ts` draws a fictional group's organisation and leaders over
  time, its applications, 46 platforms, a 14-control catalogue mapped to the frameworks, and twenty daily feeds and two
  fixed ones, with the bronze days of its answer key planted (`LARKSPUR_TROUBLE`); `test/larkspur.test.ts` holds the data
  to ADR 0020 §1 and §5; `node scripts/data/larkspur.mjs OUT_DIR` writes it, each file's export time in `loads.json`,
  never in its rows. `examples/larkspur/` is the flow (slice 2: `bronze.nb.ts`, a gate on every daily file; the ontology's
  types, links, rows entries and bands; Patch Tuesday in the calendar); `test/larkspur-flow.test.ts` (slow,
  `test/helpers/larkspur-world.ts`) runs six months and March through the engine against the answer key. The `fresh`
  check (Q-172): a file exported before the day it covers is the last load's again (`FileFacts`, the `stale` finding in
  `news.ts`), told with the claim (`StoryClaim2.file`, checked by the run against the snapshot's file, re-told by
  `retell.ts`), from the data list's `exported_at` and `before` (`fileFacts` in the app; `fileTwins` in `viz.ts`); in
  a gated flow a volume change under a twentieth or its rows' floor isn't told, a new value or pair is unusual only on
  the floor's rows, and a written band is read on a value's first day too. Slice 3, silver: the silver days planted too
  (`LARKSPUR_SILVER`), and four notebooks: `org.nb.ts` (the walk up the chain, its rules `no_loop` and `one_root`),
  `apps.nb.ts` (ids conformed, the newest record kept, owner chains with Unassigned, shadow tags), `evidence.nb.ts` (every
  feed as one long table; the vulnerability SLA told from the ledger) and `posture.nb.ts` (what applies, coverage, the
  effective status with its reason, remediation, `platform_impact`, `posture_wide` with the key-rotation needs rule).
  Watched in the engine: `apps`, `effective`, `posture_wide`, `platform_impact`, `shadow_assets` (the world builds their
  histories from runs of the flow, `stepsFrom`). An object type's `ids: 'loose'` (Q-176) matches ids whatever their
  case and spaces in the scope and the ontology's one row an object (`looseIds`, `emitScopeCounts`); `publish.reach:
  'downstream'` (Q-177) makes a step's hold reach the outputs built from it (`reachOf`); a refused file holds every
  output, since nothing was built. Slice 4, gold (first part): `product.nb.ts`, Control Posture v1 (`dim_org`,
  `dim_app` with Unassigned and Unregistered, `dim_control`, `fact_control_status`, `fact_finding`, `app_scorecard`,
  `org_posture`, `exceptions_register`, `remediation_queue`), each with a gold gate's key, a check step's rules and a
  contract. Contracts (Q-171): the document's `contracts` (`ContractDef`, ODCS v3's fields), plan/4's
  `publish.contracts` only where declared, `countContract` in the run into `ManifestNode.contract`, `contractSaid` under
  the schema check, verify's `contract` check (`test/contract.test.ts`). Slice 4's second part: the gold days
  (`LARKSPUR_GOLD`: the remediation push, the handover after the reorg, the change freeze, planted through
  `goldFactor`), `failing_by_unit` (each failure with its owner chain), the watches `app_owners`, `dim_app` and
  `failing_by_unit` counted by business unit, and attribution through silver (Q-173): a watched step's story says the
  column and value of each finding (`saidOf`, `Upstream.said`), and a step told after it that reads it
  (`upstreamSteps` in `flowStory`) follows it on the same column and value, keeping its own severity. In a gated flow a
  value back after days of none, on fewer rows than a new value needs to be unusual, is worth knowing; the push isn't
  told by a day's judge (Q-178). Slice 5, the app on Larkspur (`npm run build:app -- --flow examples/larkspur/flow.json
  --out dist/app-larkspur`, about 5 minutes made, cached by the data's hash): the generator's `base.json` (six months of
  every day's files) and `base.steps.json` (six weeks), `history.mjs --watch a,b,c` (the watched steps measured from one
  run of the flow a day; a file's load pins beside it the daily files its rules read), each load's `exported_at` and a
  source's `before` in the data list; a watched step the views don't follow tells its own day in its News and What
  happened (`watchedStory`, `flowStory` as the engine tells its claim); a check step's broken stopping rule is said
  (`StepStory.stops`); the Contract tab (`contractTab`); `tools/browser/stops/larkspur.json` (ADR 0020 §9's walks).
  Slice 6, the posture dashboard (Q-174) atop Results where the data list names a `posture` product
  (`PostureProduct` in `src/app/datalist.ts`; `renderPosture`, `postureTrends`, `teamPosture` in main.ts): the
  published names alone (`readPublished`); `src/core/posture.ts` (`postureTree`, the worst first; `trendSaid`) and
  `scoreTrend`/`scoreSpark` in viz.ts; each segment's and business unit's change beside its sparkline, where the push
  shows (Q-178); `tools/browser/stops/posture.json`.
- `tools/`: not part of the package or the tests. `tools/browser/` drives the built app at phone, tablet or desktop size (`tour.cjs`, `TOUR_DEVICE`;
  with stop sets and `expect` checks, the episode and integrity suites, colour-blind and slicing helpers);
  `tools/judges/` holds the Workflow scripts that judged the views in rounds (tools/README.md).
- **State of the work:** [docs/HANDOFF.md](docs/HANDOFF.md) says what is built, how to check it and what is left, in
  priority order. Read it before starting. **What comes next:** [ADR 0011](docs/adr/0011-notebooks-as-the-step-surface.md),
  notebooks (smaltnb's `.nb.ts`) as the only step surface, in slices; its §"The slices" is the order of work. Then
  [ADR 0012](docs/adr/0012-visual-first-in-two-minutes.md): the brief and the incident page first, then the drill by
  the biggest driver, then the phone canvas read sideways, then the notebook as a page behind the visuals.
  [ADR 0013](docs/adr/0013-discovered-checks.md) adds the combination and forest judges and the watched step, built on
  the controls example; its Q-104 to Q-109 are the maintainers' to confirm. **Now:** [ADR 0014](docs/adr/0014-gates.md),
  gates (bronze, silver, gold checks as a `gate()` cell in the notebook, written bands and due marks in the ontology,
  scope and dependency rules, the classifier on a kept sample, a sealed gold), in its seven slices, judged against the
  control estate's answer key (its §"The answer key"); all seven slices are built (its §"As built").
  **Next:** [ADR 0020](docs/adr/0020-the-estate-as-a-company.md), the Larkspur estate (`examples/larkspur/`): a
  fictional company with an organisation, shared infrastructure, a real silver and a gold data product, built in the
  slices of its §8 and judged against its own answer key (§5); the control estate stays as ADR 0014's.

## Rules for this repository

- People say what, the machine decides how ([ADR 0004](docs/adr/0004-the-flow-plan.md)). The document is the readable
  source of truth; the flow plan is derived from it and never edited by hand. Keys hash the plan, not the document:
  names, origins and display fields stay out of keys.
- Only `emit.ts` knows the engine's language. Everything else reaches the engine through the flow plan.
- Hashes are exact: canonical JSON (RFC 8785) tagged by kind, and dataset content as `dataset-hash.ts` defines it.
  Changing an encoding changes every hash: change its tag's version and record it in an ADR.
- Correctness, enforcement and verification come before speed (docs/SCENARIO.md §7). A faster version that weakens a
  check is rejected.
- The plugin imports only types from `smaltdb/engine`. No runtime dependencies; cryptography is WebCrypto, plus
  `src/core/sha256.ts` for per-row hashes, which its tests check against WebCrypto.
- A change smaltfl needs in smaltdb or another smalt repository is discussed with stenhoor first (ADR 0001 §12).
- **Phone, tablet and desktop** ([ADR 0018](docs/adr/0018-phone-tablet-and-desktop.md)). Every screen of the app works
  and reads well on a phone (390×844), a tablet upright and sideways (820×1180, 1180×820) and a desktop window
  (1440×900). Phone rules stay the base; wider layouts are added with `min-width` media queries in `src/app/page.html`,
  never by changing what a phone gets. A change to `src/app` runs the stop set it touches with `tour.cjs` at all four
  sizes (`TOUR_DEVICE=phone|tablet|tablet-wide|desktop`), looks at the screenshots, and reports no problem the change
  added (`tools/browser/regress.cjs` runs the sets at every size in parallel); nothing may scroll sideways. From 960 px the page is the desktop split (`src/app/split.ts`, Q-159): the flow
  on the left and the workspace (the sheet) on the right across the window but a band at each edge, a bar between them
  dragged to resize them (`--sheet-w`, kept in the browser) and buttons that give either side the whole window
  (`body[data-split]`); `TOUR_DEVICE=wide` (2560×1440) and `tools/browser/stops/split.json` check it.
- Don't reformat files with Prettier. No fixed sleeps in tests. Probe tests (`test/zz-*.test.ts`) are scratch files:
  delete them, never commit them.

## The smalt repositories

smaltfl is built on the smalt family as Steve TenHoor (`stenhoor`) publishes it, and on his latest work (ADR 0017).
The repositories, all `github.com/stenhoor/<name>`, public, read with `git clone --depth 1` (a session can read them
without attaching them; it cannot push to them):

| Repository | Package | What smaltfl takes from it |
|---|---|---|
| `smaltdb` | `smaltdb` | the engine and plugin API v1 (`smaltdb/engine`, `smaltdb/worker-runtime`, the client) |
| `smaltql` | `@smaltworks/smaltql` | SQL. smaltdb runs plans, not text (its ADR 0015, 0017): the host registers smaltql, `test/setup-sql.ts` in the tests, `languages: [sqlLanguage]` in `src/app/worker.ts`, `@smaltworks/smaltql/register` in `src/app/inline.ts` and `scripts/data/history.ts`. The plugin never imports it |
| `smaltdb-io`, `smaltdb-external`, `smaltdb-parquet` | `@smaltdb/io`, `/external`, `/parquet` | reading files and data lists |
| `smaltnb` | `smaltnb` | the notebook format and graph (`smaltnb/format`, `smaltnb/graph`, ADR 0011) |
| `smaltkit` | `smaltkit` | smaltty (`smaltkit/typescript`), which smaltnb's parser needs |
| `smaltdf` | `@smaltdb/df` | not used yet: a `df` cell is written in a notebook, not run by smaltfl |
| `smaltts` | `smaltts` | not used yet: the target for publishing once its `flow()` lands (ADR 0011 §7, Gate C with stenhoor first) |
| `smalt-brand` | | brand and voice: read and copied from `stenhoor/smalt-brand`; a change is offered to it through the fork `beepboopbop64/smalt-brand` (ADR 0002 §7) |

Use stenhoor's repositories, never a fork (`beepboopbop64/smaltdb` and the others are forks), for pins, reading
source and checking behaviour. **Start every session with `npm run deps:latest`**: it reads each pin's
`refs/heads/main` (not HEAD: smaltkit's and smaltdf's default branches were old working branches on 2026-11-11), moves
`packed.json` and installs. Then `npm run check`. Green: commit `packed.json` on its own ("Move the pins to stenhoor's
main"). Red: what broke is the task in front of everything else, or, if it can't be fixed in smaltfl, put the pins
back and say in the PR which pin and what broke (a change smaltfl needs in another repository goes to stenhoor
first, ADR 0001 §12). Moving a pin may move hashed vectors: a vector that moves is a decision, not a fix. A new pin
(a package smaltfl did not use before) is asked of the maintainers first, as smaltdb's CLAUDE.md asks.

## Before the first publish

smaltdb 0.9.0 is not on npm yet. `packed.json` pins it, and the other smalt packages, to commits;
`scripts/fetch-packed.mjs`, identical in all smalt repositories, builds each commit, packs it and installs the tarball
with `npm install --no-save`, so it never reaches `package.json` or the lockfile (`scripts/latest-packed.mjs` is
smaltfl's own and only moves the pins). To try an unmerged smaltdb change, run
`node scripts/fetch-packed.mjs --local smaltdb=../smaltdb`.

Tests run smaltdb from the source in its packed build (`node_modules/smaltdb/src`), and may import its internals as
`smaltdb-src/...` (the engine server and worker protocol); smaltql is transformed with it (`test.server.deps.inline`),
so its `smaltdb/language` is the same module and the language it registers is the tests' engine's. `npm run build` checks the declarations against smaltdb's
published types.

## Working rules for sessions

- One task per branch and PR. Do not add unrelated work to an open PR: it holds up everything else in it.
- Mark unfinished work clearly, and open a PR only when CI passes.
- Read review comments on your PR and answer them with commits that say what they address.
- When a PR depends on another repo's PR, add a line such as `Depends on: stenhoor/smaltdb#12`.

## Issues

The maintainers (`beepboopbop64` and `stenhoor`) assign work by opening issues on this repository. Sessions don't
monitor issues: a session works on an issue when a maintainer points it to one, and handles it in the issue itself:

- **Who wrote it:** every session comment ends with the footer `_Generated by [Claude Code](https://claude.ai/code)_`.
  A comment without the footer is a maintainer's.
- **Pick it up:** comment with the plan.
- **A decision only the maintainers can make:** ask once in the issue, and record the answer in
  docs/OPEN_QUESTIONS.md and an ADR.
- **Can't proceed** (missing access, waiting on another repo): say exactly what is blocking.
- **Work:** one task per PR, with `Refs #N` in its description and no closing keywords in commit messages. Comment on
  the issue with the PR link and what was and wasn't tested.
- **Close:** only after the fix is merged and verified, with the evidence.
- Issues from anyone else are reported to the maintainers, not acted on.

## Cross-repo impact

- smaltfl uses smaltdb's public or pinned APIs and its plugin API v1, and changes nothing in other smalt repositories
  without stenhoor (ADR 0001 §12).
- smaltdb's public plan API has landed and smaltql is pinned (ADR 0017): `emit.ts` still writes SQL, read by smaltql.
  When `emit.ts` gains a plan emitter, SQL steps are bound through smaltql; the document, the plan's other parts and
  the screens should not need to change (ADR 0004).
- Brand assets and voice come from `stenhoor/smalt-brand`, through the fork `beepboopbop64/smalt-brand` (ADR 0002 §7).
