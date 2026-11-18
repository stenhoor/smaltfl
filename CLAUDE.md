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
| `npm run test:tour` | The tour's answer key (`test/larkspur-tour.test.ts`, ADR 0023): Larkspur's tour, February and March, made at the demo's scale as the build makes it (`scripts/data/make.mjs`), about ten minutes in CI; a CI job of its own. `SMALTFL_TOUR_WORK=<folder>` checks a month made already (the build's cache) | Changes to the judge, the recorder, the generator or the tour's story |
| `npm run build` | `dist/`: the core (`index.js`), the runtime plugin (`plugin/index.js`) and their declarations | Packaging checks |
| `npm run docs:dev` | The site (VitePress, `docs/`, the brand kit copied unchanged into `docs/.vitepress/theme/`); `.github/workflows/docs.yml` deploys it to GitHub Pages with Larkspur's tour at `/app/` (the demo, ADR 0023), Evidence feeds' own page at `/feeds/` (a flow the estate reads, on the tour's files, ADR 0026 §6), Larkspur's planted month at `/larkspur/` (ADR 0020), the control estate at `/estate/` and the sign-ins at `/signins/` (each build writes `index.html` beside `page.html`) | Docs and site changes |
| `npm run bench` | The scenario benchmarks in `bench/`, written to `bench/results/node.json` | Changes that could affect speed |
| `npm run build:app` | The app in `dist/app` on Larkspur (`examples/larkspur/`, its notebooks expanded, shipped as `data/flow.json`, its days generated from its seed); `-- --variant tour --out dist/app-tour` for its tour, February and March, the demo (ADR 0023, the data list's `variants`; its scenes listed on the month screen from `scenes.json`); `-- --flow examples/security-signins/flow.json --out dist/app-signins` for the sign-ins (its generator's `--demo` days from the data list's `generateArgs`); `-- --flow examples/larkspur/feeds/flow.json --out dist/app-feeds` for Evidence feeds' own page; `--page id=address[=name]` names the pages of the site that share a flow with it (ADR 0026 §6). Bundles are named by content (`bundles.json`). A generated flow's days, histories and samples are kept in `node_modules/.cache/smaltfl/data/<hash of what makes them>/`: after a change to the app alone the build takes seconds, not minutes (the docs deploy caches the same folder) | Changes to `src/app` |
| `npm run regress` | The browser regression, in minutes ([ADR 0025](docs/adr/0025-the-browser-regression-in-minutes.md)): builds the five demos (their data cached) and runs every stop set (`tools/browser/sets.json`) once on a phone, as many at once as there are cores, checking each stop's layout at the other sizes by resizing the page; one table of what passed, seven and a half minutes on four cores. `-- overview tour` runs those sets; `-- overview --full --shots all` replays a set at every size with its screenshots; `-- --list` says what each set costs. CI replays every set at every size, a size a job | Before a PR that touches `src/app`; the set a change touches, `--full`, while iterating |

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
  `worker-protocol.test.ts` runs through the smaltdb client and engine server, the path a page takes. The retired taxi
  example's document, data list and XS files are unit-test fixtures (`fixtures/taxi-example.*`, `fixtures/xs/`, Q-208).
- `bench/`: the scenario benchmarks (docs/SCENARIO.md §7).
- `src/app/`: the app. `main.ts` (plain DOM and SVG), `engine.ts` (smaltdb in a worker, `worker.ts`, or in the page,
  `inline.ts`), `layout.ts` (where cards sit), `page.html` (the page's content). `npm run build:app` writes `dist/app`.
- `examples/`: flow documents and their sources, each flow's days generated from a fixed seed (`scripts/data/`).
- `scripts/data/history.ts` measures a flow's history day by day, on the runtime (`node scripts/data/history.mjs --flow
  DOC --watch SOURCE --files LIST.json OUT.json`). The taxi example's data branch (`scripts/data/build.py`,
  `.github/workflows/data.yml`) was retired with it on 2026-11-15 (ADR 0022's addendum, Q-208).
- The day's news (ADR 0008): `src/core/news.ts` finds what is out of the ordinary, `src/core/story.ts` tells it as one
  cause with what follows from it, `src/app/viz.ts` draws it (SVG strings, tested in Node). Words at a glance are
  budgeted (`glanceStrings`, `wordsIn`); a new kind of finding gets its visual there too.
- Integrity (ADR 0006): `src/core/integrity.ts` (a data file against the list), `src/app/fetch-checked.ts`,
  `src/plugin/pinned.ts` (files hashed and served in the engine), run/1 in `src/core/manifest.ts`, verify's levels in
  `src/plugin/verify.ts`, the record (`src/core/log.ts`, RFC 9162; `src/app/record.ts`, IndexedDB), the audit bag
  (`src/core/bag.ts`, `src/core/zip.ts`) and its offline check (`src/core/audit.ts`, `node scripts/audit.mjs check
  BAG.zip`). In the app, with any number of daily sources: a run's record entry keeps every claim the engine judged it
  by (`RunResult.told` beside the page's own); a refused file is its own source's (`sourceOfPath`, `refusedDay`), its
  card's seal broken and its sheet saying so first (`refusedPart`); re-deriving a run pins every file it read again
  (`ownFilesOf`, `pinnedNow`). `tools/browser/stops/integrity.json` checks it all in the browser, on Larkspur, the
  bag through the offline audit (tour.cjs's `tamper`, `expect.download`, `expect.audit`). A new hash encoding goes in an
  ADR first, with test vectors.
- A day that is off is paused, not published (ADR 0009): the document's `publish` block (format 2, plan/1);
  `src/core/hold.ts` says what holds a run (its checks, the story's claim), what waits, and what the record decided;
  `src/plugin/runtime.ts` holds instead of throwing and `src/plugin/release.ts` publishes a held run as a recorded
  decision says; verify's *held* check and `src/core/audit.ts` check both; `src/core/decision.ts` and
  `src/app/viz.ts` `decisionRow` draw and word the decision. The days a demo's story holds are test vectors (its answer
  key; the taxi's real history was one until it was retired, Q-208): a story change that moves them is a decision, not
  a fix.
- Filling a paused day (ADR 0009 amendment 1): the `fill` step marks every row with `filled_from`; `src/core/fill.ts`
  says what is missing, the donor and the derived document; `src/app/fills.ts` pins a donor and stages the derived
  run; the plugin releases it (`stage`, `release.ts`) and withdraws it (Q-61). ◧ filled, ◐ the part alone, stipple for
  another day's rows inside the day (`viz.ts`).
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
  The taxi fixture is format 3 (`exampleDoc()` in `test/helpers/example.ts`, Election Day; `exampleLegacy()` is its
  legacy form). Accept the
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
  `examples/security-signins/`, `examples/control-estate/` and `examples/larkspur/` (`flow.json` and `*.nb.ts`,
  typechecked with the repository).
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
  never in its rows. `examples/larkspur/` is the flow (slice 2: `bronze.nb.ts`, a gate on every daily file, since ADR 0026 a
  `bronze.nb.ts` in each of its flows' folders; the ontology's
  types, links, rows entries and bands; Patch Tuesday in the calendar); `test/larkspur-flow.test.ts` (slow,
  `test/helpers/larkspur-world.ts`) runs six months and March through the engine against the answer key. The `fresh`
  check (Q-172): a file exported before the day it covers is the last load's again (`FileFacts`, the `stale` finding in
  `news.ts`), told with the claim (`StoryClaim2.file`, checked by the run against the snapshot's file, re-told by
  `retell.ts`), from the data list's `exported_at` and `before` (`fileFacts` in the app; `fileTwins` in `viz.ts`); in
  a gated flow a volume change under a twentieth or its rows' floor isn't told, a new value or pair is unusual only on
  the floor's rows, and a written band is read on a value's first day too. Slice 3, silver: the silver days planted too
  (`LARKSPUR_SILVER`), and four notebooks: `hr/org.nb.ts` (the walk up the chain, its rules `no_loop` and `one_root`),
  `applications/apps.nb.ts` (ids conformed, the newest record kept, owner chains with Unassigned, shadow tags), `evidence.nb.ts` (every
  feed as one long table; the vulnerability SLA told from the ledger) and `posture.nb.ts` (what applies, coverage, the
  effective status with its reason, remediation, `platform_impact`, `posture_wide` with the key-rotation needs rule).
  Watched in the engine: `apps`, `effective`, `posture_wide`, `platform_impact`, `shadow_assets` (the world builds their
  histories from runs of the flow, `stepsFrom`). Loose ids (Q-176, said per check since ADR 0022: a rows entry's or a
  gate cell's scope's `ids: 'loose'`) match whatever their case and spaces (`emitScopeCounts`, `emitReconcileCounts`); `publish.reach:
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
- Time (ADR 0021): two screens, the month and the day, over a month the build records. Slice 1: `src/core/month.ts`
  (`smaltfl-month/1`: the build's `run` entries at the story's times, each manifest by hash, the posture's marks;
  `layered` numbers them below the browser's own entries, `knownOn`/`endOfDay` read as known on a moment, `monthOf`,
  `stateOfRun`, `gridOf`/`cellOf`, `checkAgainst` a run here against its record; `test/month.test.ts`);
  `scripts/data/record.ts` (`record.mjs`: each generated month run in order as the page runs a day, the steps' claims
  from `RunResult.told`, written as `month.json`, listed in loads.json as `recorded`, cached with the data). The app
  layers it under its record (`allEntries`, `entryOf`: tails, skips, pauses, levels and readers-see read it; a wait
  from a recorded moment runs to the record's `now`, `storyMs`), opens on the month (`renderMonth`: for the day, as
  known on, the trend band, the calendar by `calendarDay`, the day picked, the grid from 820 px, **Check every day
  here ▶**) and gives each day its screen (`#day/YYYY-MM-DD`, `routeOf`, `openDay`; `renderLoads` is the day's head:
  back, neighbours, `lifecycleOf`, `recordLine`, the pause and Decide, `storyOfDay`). `window.__smaltflMonth` says each
  day as the month does: tools/browser/tour.cjs finds a stop's day by it and opens it by its link;
  `tools/browser/stops/month.json`. Slice 2, first part: a run can correct an earlier run of its day
  (`RunOptions.correction`, the manifest's `correction`), held `by: 'correction'` in `holdsOf` until a decision whatever
  its checks say (Q-183; `test/correction.test.ts`); Replace the file runs as such a correction (Q-155), the day screen
  saying *Sent again* (`tools/browser/stops/fixes.json`, tour.cjs's `upload`). Decisions on a flow watching several
  datasets are one choice recorded as a decision a held load (`heldLoadsOf`, `loadDecisions`, `keysForLoads`,
  `dayPauseOfLoads`; Q-193, ADR 0010 §16; `tools/browser/stops/decide.json`). Slice 2, second part: what we went with
  feeds the history (`learnedMeasures`; a later delivery supersedes what its first run held, `pausesOf` `superseded`;
  `test/delivery.test.ts`); Larkspur's recorded story (`examples/larkspur/story.json`, `smaltfl-story/1`,
  `src/core/timeline.ts` `storyProblems`/`timelineOf`, the data list's `story`): the generator's files sent again
  (`sentAgain`, the writer's `--story`, loads.json `deliveries`), the recorder in time order (each delivery a correction,
  each decision by load, a release beside each that publishes); the app's data list ships `deliveries` (`deliveriesOf`,
  `versionsOfDay`), a day opens on the version readers got (`wentWith`, `correctionFor`; `#day/YYYY-MM-DD/vN`, a tour
  stop's `version`), the month marks a corrected day ↻ with its versions (`correctedOf`, MonthDay `versions`), the day
  screen lists its versions like commits (`versionFacts`, `versionsPart`) and a superseded one isn't decided
  (`supersededBy`); the day on screen is drawn from its own run (`viewTail`); `layered` renumbers what a decision or
  release cites. Slice 3, flip and compare: `src/core/compare.ts` (`compareSummary` from two manifests, `diffKeyOf`,
  `diffOf`) and emit.ts `emitDiff` (rows by key, counted on each side, cells null-safe, keys matched as text; whole rows
  by `emitExcept`), `test/compare.test.ts`; the day screen's **Compare** (`comparing`, `comparePart`, `rowDiffOf`,
  `rowDiffView`), the month grid's filters (`GridFilter`); `tools/browser/stops/compare.json`, a tour stop's `devices`.
  Slice 4, first part, the rules over time (Q-197): dated change sets (`FlowDocument.changes`, `ChangeSet`, `RuleEdit`
  in document.ts); `src/core/inforce.ts` (`applyEdit` replays an edit by the function that made it, `changesOn`,
  `resolve`/`inForce` the rules in force on a day as known at a moment, `rulesHash` under `rules/1` with its vectors in
  `test/inforce.test.ts`, `ruleParts`/`withRuleParts`); `translate`/`runFlow` resolve a document for its day (`forDay`,
  `asOf`), the manifest names `flow.rules` and verify checks it. The app: every rule edit a change set from the day
  **Edits take effect from** says (`editFrom`, `fromBar`, `editRules`; the next day to arrive by default), names and
  labels at once (Q-198); `ruleBase`/`ruleChanges`/`baseDoc` kept and recorded, `resolveDoc`/`versionAsOf` the document
  on screen; the day head's `rulesLine`, the Ontology view's `renderRulesTime`. A back-dated change restates the days it
  reaches (`restatePending`, `restateSheet`, `restateDays`): restated runs (`RunOptions.restates`, hold `restated`,
  outcome `restated`), the month's would-change marks, one `restate` entry (`RestateAbout`, `isRestate`,
  `restatedRuns` in month.ts), noted at once where no day changes (Q-199); a day's versions include its restated ones
  (`Restated`, `restatedKey`, `restatementOf`); `tools/browser/stops/restate.json`, `rules.json` from the day on screen.
  Slice 4, second part: a story's changes to the rules (`StoryFile.changes`, `restatements` in `src/core/timeline.ts`,
  `changesProblems` in document.ts; Larkspur's WAF band from Mon 18 recorded Fri 15, and the findings' values check back
  to hold from Fri 1 recorded Mon 25, restating Sat 16 and Sun 17, Q-201), recorded by the build (`record.ts`: each run
  under its day's rules as known then, `forDay` and `runFlow`'s `asOf`; the days a change set reaches run again as
  restated runs, then the story's restatement or a note at once) and shipped as the flow's own change sets; a restated
  day against what readers got (`restatedOutcome`, `ownHolds` in month.ts: a decision that published a held day carries
  where the same holds say the same, Q-200), shared by the recorder and the page; a change set reaches only days whose
  version readers got ran before it was recorded (`reachedBy`); the Ontology view's versions (`src/core/ruleversions.ts`
  `ruleVersions`, `versionOn`, `rulesDiff`, `diffSaid`; the app's `ruleVersionsPart`: each version's hash, where and
  when it was in force, its runs, the one on screen, now and as known on, any two compared); `recordedRunOf` by version;
  `takenBackDays` for the month's trend; a day noted the same keeps the version readers had (Q-199 amended); pauses
  found under any version of the flow as kept (`flowsKept`, `ofFlowOnScreen`) and runs of one flow by the flow as kept
  (`RunRecord.base`, `sameFlow`), whatever day's rules each ran under; `test/ruleversions.test.ts`,
  `tools/browser/stops/versions.json`. Slice 5, what-if runs (Q-191, Q-202): `RunOptions.whatIf` and the manifest's
  `whatIf`, a `what-if` hold on every output in `holdsOf` (nothing published, no name moved), a release refused
  (`test/whatif.test.ts`); the day screen's *What if… ›* (`whatIfSheet`: each source's files that day and a version of
  the rules; `runWhatIf` through `runLoad`'s `whatIf` and `resolveVersion`), the run kept out of `state.runs` and the
  record and shown while open (`whatIf`, `latest`, `rowsFromBar`), its line (`whatIfPart`, `whatIfHow`: what would make
  it the day's), *Back to the day* (`closeWhatIf`; the day's own files pinned again, `pinLoad`, `pinOwnAgain`, before
  any other run); Compare takes it as a side (`0`) and says what held each side;
  `tools/browser/stops/whatif.json`.
- The answers of 2026-11-14 (ADR 0022). Slice 1, first part: a change set's last day (`ChangeSet.until`, in force from
  its day to then and on no run of no day) and the edit `useVersion` (a version's rules taken whole, `versionRules` and
  `versionSaid` in inforce.ts; `rules/1` unchanged); **Make this the day's ›** on a what-if (Q-202; `whatIfMakes`,
  `makePart`, `makeWhatIfTheDays`): a reason on the same screen, then other files go in as a later delivery decided as
  is (`PinOpts.make`, `loads.correct`, `RunRecord.made`, a version of its own: `madeVersion`, `versionsOfLoad`), and
  other rules as a change set for that day only with the day restated under it; a restatement that changes no day signed
  off with a reason (Q-199, `restateSheet`; the recorder by the story's restatement); a day restated as not published
  left out of learning (`restatedHeld` in `skipOf`); the offline audit of restated runs and restatements
  (`restatedProblems`, each `restate` entry against `restatedOutcome`); `tools/browser/stops/whatif.json`, `rules.json`.
  Slice 1, second part (Q-51): readers stay on the latest day. `_smaltfl_days` keeps each day's version of each output
  (`dayVersionOf`, `keepDay`, `restoreDay`, `latestAfterRestore` in store.ts); `publishVersion` moves a name only where
  no later day shows (`laterShown`, by `periodsOf`, `dayKeyOf`, `periodsAfter` in plan.ts); a run's or a release's
  `behind` names those left on a later day; a release of an earlier day is applied, a withdrawal puts the day's version
  back; verify checks a day's kept versions. `latestPublished` (hold.ts) is readers' day by day; the audit's
  `shownBefore` reads names the same way. No option is off for a later day out, and the receipts say "readers stay on"
  it (`receiptLines`'s `latest`, `passedLine`, `readersLatest`). "Later days too" goes off only when the next day is
  out (`nextDayOut`, the sheet's `nextOut`). Slice 2, first part (Q-109, Q-146): a file whose columns changed.
  `src/core/columns.ts` reads a CSV header (`csvHeader`, `csvColumn`) and says what is gone, new, and read as a gone
  column by name, type and the history's values (`columnChange`, `ColumnMap`, `namesClose`, `familiesAgree`,
  `historyValues`, `columnChangeSaid`); the runtime checks each pinned CSV source's header before reading it
  (`headerChange`): a gone or mapped column refuses the source in any flow with a publish block (`ManifestNode.columns`,
  held under the checks; verify's `changedOnly`), a new column alone is noted. A property's `fromFile` and the edit
  `mapColumn` read the file's name as the column (`readAsOf`, `TableNode.readAs`, `ddlOf`'s `readAs`, the snapshot
  renaming back by place). The day head's **Columns that changed** (`columnsPart`): Read X as Y with a reason, a change
  set from the day and one restatement (`mapColumnOnDay`; `defineTablesFor`, the recorder's `defineTables`); a new
  column noted, Add it to the ontology (`describeNewColumn`; `FileSection.unread`). The sign-ins plant both
  (`ADDED_DAY` Thu Mar 7, `RENAMED_DAY` Fri Mar 22); `test/columns.test.ts`, `test/refused.test.ts`,
  `tools/browser/stops/columns.json`. Slice 2, second part (Q-205, Q-146): where a column is used, `src/core/uses.ts`
  (`columnUses`: the datasets that carry it by name, the joins on it with their other side, the steps that read it, the
  outputs whose rows depend on it; SQL read from smaltql's parsed SELECT, the parser passed in; `usesSaid`, `joinsSaid`,
  `joinImpactSaid`, `joinMatch`; `test/uses.test.ts`). The page loads the parser as its own bundle when asked
  (`src/app/parse.ts`, `parse.js`; `sqlParser`, `usesOf`, `usesReady`). A held join column says its joins, what is
  built from it and today's matches from the day's files (`joinCountOf`, `dayFileText`, `sourceColumnOf`), and its
  mapping asks once more naming every output (`mappingColumn.confirm`); a mapping is declared only where the day's file
  has the name (`readAsIn`, `pinnedHeaders`; the recorder's `headers`), and the run reads a file back on the column's
  own name as declared. The owner's rename form says where the column is used and carries the change to the datasets
  that pass it on (`nameColumnThrough` in flowedit.ts). The control estate plants TLS's app_id called AppID on Mon Mar 18
  (`ESTATE_PLANTED.renamed`; `tools/browser/stops/joins.json`). Slice 3, first part (Q-176, Q-118, Q-119): loose ids
  said per check (a rows entry's `ids`, a gate cell's scope's `ids`; an object type's refused); a published table
  nothing watches reconciles by the key its rows entry gives where its gate cell writes none (`goldGates` through
  `writtenRules`, `GatePlan.reconcile.loose`; `test/reconcile.test.ts`); `ontology.needs` (`NeedsDef`, `needsOf`), each
  rule written once with the datasets it applies to, a gate cell's rule about the same columns overriding it in place
  and its others added (`needsFor`, `WrittenNeeds`; `test/scope-needs.test.ts`). Slice 3, second part (Q-145, Q-144): a
  drawing names a coded value by the ontology's label even where it only repeats the value (`drawnLabel`, `drawnName`,
  `drawnValue`, a finding's in its own dataset), text beside a value keeps `labelFor`; the Ontology page's made datasets
  (`OntologyPage.made`, `FileSection.made` and `readBy`; the app's "Made by the flow", read-only, `readByLine`,
  `openOntologySection`), a hand-set rule saying where it is written (`originSaid`); tour.cjs's `textIn`/`noTextIn`.
  The addendum of 2026-11-15: the taxi example retired (Q-208); Q-132's threshold (Q-207); what it left (Q-217, Q-218):
  the weather views removed (no `weather` finding, no story context, no history weather), the episode chips with
  them, the published-list check kept; *About this flow* shows the flow's own `description` (`#flow-desc`).
  Slice 4, first part (Q-132):
  in a gated flow a learned check's alert (shares, pairs, hours, shape; never the forest or the classifier) that moved at
  least the node's threshold of the day's rows holds it though the check only warns (`gated`'s `day`, `OVERWHELMS`,
  `movedOf`, `Finding.moved` a pair's rows beyond what its columns predict, `Finding.overwhelming`); the threshold is a
  quarter (`OVERWHELMING`) unless the ontology sets the dataset's (`ontology.overwhelming`) or the flow its own
  (`publish.overwhelming`; `overwhelmingOf`, `JudgeSettings.overwhelming`), carried by plan/4's watch only where declared
  (`WatchPlan.overwhelming`); the brief's fact and its proposal to keep the last good day (`overwhelmingSaid`, `fixOf`),
  the bronze verdict (`bronzeOf`) and the issue card say it. Slice 5 (Q-139, the answers Q-213 to Q-216): declarations
  proposed from a file's own data (`src/core/proposals.ts` `proposalsOf`, `valueCandidates`, `shareRange`,
  `watchedFile`): a coded column's values (not a type's key or a link's column, not gapless whole numbers), each common
  value's band (its share's usual range over 28 days, the middle nine in ten, five points either side; gated flows, a
  hundred rows), a likely key (a gated file with no rows entry and no gate key; never blank, never repeated in the
  sample); a file nothing watches is offered nothing. Accepted as the edits `declareValues`, `acceptBand` and
  `declareKey` (`flowedit.ts`: the file its own object type or the type over it, with a rows entry; `writtenRules`
  gives a file tied to the type over itself no scope) in one dated change set (`editRules` takes several edits). The
  app: *Proposed from the data* on the Ontology page (the Discovered list's place; `FileSection.discovered` is gone) and
  under the checks on a bronze file's Quality tab (`proposalsPart`, `proposalCard`, `proposalsFor`; Accept… with a
  reason and the from bar, Not now kept in the browser, `notNow`; `acceptedIn`); `test/proposals.test.ts`,
  `tools/browser/stops/proposals.json`.
- The month at a glance (ADR 0024, docs/research/ui-month-overview.md): the month screen's layout. `src/core/overview.ts`:
  a day's outcome from what the calendar says of it (`outcomeOf`: normal, unusual, waiting, decided with `How`, kept;
  `OUTCOME_WORD`, `HOW_WORD`, `outcomeSaid`), a month counted and said (`summaryOf`, `headlineOf`, `againstSaid`,
  `againstWay`, `monthsOf`), what a run said of its day (`findingsOf`), the month's rows (`healthRows`: a file with the
  steps that read it alone, a step with the files it reads; `healthOf`: a day's cell the worst over its runs, a step's
  `own` days those no file it reads accounts for; `followsFiles`, `worstFirst`, `healthSaid`), and the score read
  (`scoreRead`, `STEADY` half a point, `readSaid`, `moversOf`, `pointsSaid`, `countSaid`); `test/overview.test.ts`. It
  isn't in what the data's cache is keyed by: `month.ts` is. In `renderMonth` (main.ts), in a phone's order: the head
  (‹ › between months, `#month/2024-03`, `routeOf`'s `month`; *As known on*), the scenes behind a bar (`scenesPanel`, a
  `details`, kept by `SCENES_KEY`), what waits in any month with **Decide ›** (`openDecision`, capped at `WAIT_ROWS`),
  the months side by side (`.mo-card`, `barOfOutcome`), the sentence and the counts that filter (`monthView.filter`,
  `.mo-chip`), the calendar (five marks, `outcomeMark`, viz.ts `glyph('decided')`; a word, `dayWord`, and the dataset
  from 820 px; the arrow keys, Page Up and Page Down), the day picked (`dayFindings`, a file's finding before a
  step's; `dayTimeline`: arrivals, files sent again with the sender's reason, decisions with who, how long after and
  why; the score that day), what needed a look (`.mo-log`, `LOG_ROWS`), files and steps as rows of days (viz.ts
  `dayBars`, `barOfCell`; `filesGroup`, `stepsGroup`, `GROUP_ROWS`; a day is named by its file where one of the file's
  own steps said it, `ownFiles`), and the score (`scoreTrend`'s `focus`, the data list's `posture.about` and
  `posture.controls`). The recorder marks each published day's checks and the applications failing each control
  (`PostureMark.checks`, `failing`, `MonthFile.controls`). A day run here reads as its record does where another watched
  dataset was unusual (`calendarDayOf`). `tools/browser/stops/overview.json` walks it on the tour (tour.cjs's `press`).
- Flows in flows (ADR 0026, docs/research/flows-in-flows.md): a flow reads other flows. Slice 1, the core: a flow lists
  the flows it reads by their paths (`flows` in its `flow.json`) and reading brings them in, by reference in the files
  and by value in the document and the flat plan (`src/core/compose.ts` `composeFlow`, `FlowFiles`, `merge`,
  `mergeOntologies`; `scripts/flow.ts` `readFlow`, and `readFlows` each read flow's own document; `loadFlowDir` in the
  tests). The document read has a `FlowPart` a flow (`document.ts` `flows`: its `path`, `id`, its own `hash`, the
  `sources` and `steps` that are its own, the flows it `reads`, `direct`; `flowOwners`, `flowOf`, `givesOf`, `readsOf`),
  hashed with it. An id is one thing across a flow and the flows it reads; a step reads what a listed flow publishes, or
  its sources, and nothing else of another flow (`validateFlows`); one calendar, one set of parameters and publish
  settings, each flow its own watches, gates and contracts; no circle. A notebook imports across folders (`joinPath`,
  `pathFrom`). A flow is known by `flowHash` of the document read from its own folder; a run names the flows read
  (`manifest.flow.reads`) and keeps each one's own document (`runFlow`'s `flows`, `_smaltfl_flows`), and verify's `flows`
  check holds the run's document to them (`flowProblems`). A fill's derived document names its donor in the flow that
  owns the file (`repairDocument`). The app's build ships each read flow (`data/flows/<id>.json`, loads.json `flows`,
  `DataList.flows`). Larkspur is five flows: `hr/`, `inventory/`, `feeds/`, `applications/` and the posture product at
  the root, which lists the four (the same 92 plan nodes, 37 outputs where it had 19; the ontology the estate's own
  document since slice 7); `test/compose.test.ts`. Slice 2, the canvas in levels: `src/core/levels.ts` (pure, not in what the
  data's cache is keyed by): `levelDoc` is the document one flow's canvas lays out, its own files, steps and sections and
  a card a flow it reads itself (`flowCard`, `cardFlow`, `readHere`; a card joined to every flow its flow lists and to
  the step a written rule judges by it; the cards one frameless section, `FLOWS_SECTION`, which `layout.ts` places and
  doesn't draw); `trailOf` the flows entered as a link names them; `flowDay` a flow's day from a run (`RunSaid`: its
  holds and claims as the record keeps them, the outputs kept back, what became of the day), the worst of what is
  inside it by precedence (failed, paused, kept, decided and how, waits on another flow, unusual, not judged, normal),
  `flowSaid` its sentence and `flowLine` its card's line fitted to the card; `givenBy`, `readersOfFlow`. The app:
  `state.level`, `canvasDoc` through `levelDoc`, the card in `renderCanvas` (`FLOW_MARK`, `flowDayOf`, `runSaidNow`),
  the sheet (`renderFlowSheet`), entering (`enterFlow`, `setLevel`, a double-click), the line at the top
  (`renderCrumbs`), links (`routeOf`'s `level`, `levelHash`: `#day/2024-03-27/in/feeds`), a card opened from anywhere
  taking the canvas to its level (`select`, `showLevelOf`); `window.__smaltflLevelOf` for tour.cjs, which goes to the
  level that draws a card (a stop's `in`, `flow`, `dblclick`); `test/levels.test.ts`, `tools/browser/stops/levels.json`.
  Slice 3, the month in tiers: `src/core/tiers.ts` (pure, outside the data's cache key): `tierRows` puts each of the
  month's rows in its flow (a file with its own flow's steps; another flow's step that reads the file alone is that
  flow's, and follows the file), `flowRows` is a row a flow (its cells the worst of its own files and steps; `own` its
  rows' own days, `followedOn` the flows whose files account for the rest; `waited`/`waitedOn` the days a hold of
  another flow kept back what it gives), `flowOff`, `onlyFollowed`, `onlyWaited`, `flowRowSaid`; a flow's own month is
  its scope's (`scopeFlows`, `scopeNodes`: the flow and every flow it reads; `flowMonthOutcome`: a day held in scope is
  the day's own outcome, a day held outside it is the flow's own files' and steps'). In `renderMonth`: the flows' tier
  (`flowsGroup`, `flowRow`: a row opens to its files and steps, `rowIn`; the followers and waiters folded,
  `flows-aside`), `dayBars`' `waited` level, the flow named where a day waits and in a day's findings, and a flow's own
  month (`monthView.flow`, `routeOf`'s `month` with `level`: `#month/2024-03/in/feeds`; `foundOn`, `inSuffix`, the line
  that says whose month it is, no scenes and no score); a flow's card links to *Its month ›* and the day screen inside
  a flow goes back to that flow's month; `test/tiers.test.ts`, `tools/browser/stops/tiers.json`.
  Slice 4, exploring what a flow gives: `src/core/explore.ts` (pure, outside the data's cache key): what a row is
  (`rowSaid`; `rowsKeptFrom`: a rows entry, the type a dataset is the list of, a gate's key, and a dataset that only checks,
  filters or fills another's rows said as that one), what to ask of a column (`askOf`: values, bins on round edges, a
  time by the hour, day, month or year) and its card from what the engine counted (`cardOf`, `ExploreCard`, `Bar`;
  `cardSaid`, `fitSaid`, `pickSaid`, `litSaid`), the datasets it joins (`joinPartners`: its scope's list, the datasets
  of its type, the ontology's links each way; `leads`, `joinWhy`, `joinRead`, `joinSaid`) and its match over the days a
  history keeps (`matchDays`, `matchSaid`). emit.ts writes the queries (`RowPick`, `emitPick`, `emitKept`, `emitLit`,
  `emitValueCounts`, `emitBinCounts`, `emitStampCounts`, `emitFit`, `emitJoinMatch`, `emitUnmatchedKeys`, `emitWhere`,
  `emitKeptCell`). The app: the **Explore** tab on a file or a published dataset (`explorable`, `exploreTab`): a card a
  column redrawn in place (`xpColumns`, `xpCard`), a bar tapped lit in every other column and kept (`xp.pick`,
  `xp.kept`; **Keep only**, **As a cell ›** through `xpAsCell`), **How it joins** (`xpJoins`, `xpJoin`; `matchBars` in
  viz.ts) and **Against another day** (`xpDays`, `xpRunOther`, on `rowDiffOf`, which reads any dataset a run built); a
  flow's sheet has **Explore ›** on what it gives; `test/explore.test.ts`, `tools/browser/stops/explore.json`.
  Slice 5, first step, a decision says whose it is: `src/core/deciding.ts` (in what the data's cache is keyed by: the
  recorder reads it): a hold is the flow's whose file or step holds (`flowIdOf`); `holdGroups` (a hold leads where
  nothing it is built from holds too, else follows the flow that leads above it), `loadRoles` and `withRoles` (each
  held load's decision with its flow, the leaders first), `waitingOn`, `whoseSaid`, `possessive`. A decision by load
  says its flow where a read flow holds it (`DecideAbout.flow`) and, for a load that only follows, the decision it
  carries (`DecideAbout.carried`, renumbered by `layered`); the app's `decideNow` and the recorder's `recordDecisions`
  write them, the audit checks them. The app: `whoseLine` at the head of the decision sheet, `decideAt` on the Decide
  buttons, the day's story, the month's timeline and the record's line (`decidedWhose`), **Decide ›** on the sheet of
  the flow that holds; `test/deciding.test.ts`, `tools/browser/stops/whose.json`.
  Slice 7 (built before slice 6), the estate's ontology and a flow's own handling of a column: `src/core/shared.ts`
  `EstateOntology` (`{ "smaltflOntology": 2, "name", … }`: types, links, rows entries, dependencies, nouns, thresholds
  and what the columns mean; `isEstate`, `asEstate`), imported by a flow in `ontology.import` beside a file's shared
  ontology; `compose.ts` reads each once and `takeEstate` takes what is about the datasets the flow has or reads (no
  written check for a flow with no gate), keeping where it came from in `ontology.estate` (`EstateFrom`: name, path
  and `estateHash`, tag `estate/0`, its vector in `test/estate-ontology.test.ts`), part of the flow hash. A property
  with `override: { reason }` and its own `datasets` is a flow's own handling: the estate's meaning steps aside for
  them; `overrideProblems` refuses a shared column said again without the mark, an override with no reason, of no
  dataset, of another flow's dataset, or of a column no estate describes. Larkspur's is
  `examples/larkspur/ontology.json`, imported by all five flows; Applications handles `owner_team_id` its own way in
  `apps` and `app_owners`. The Ontology page (`ontologypage.ts`: `Handling`, `handlings`, `handlingSaid`, `estateSaid`,
  `OntologyPage.estate` and `handled`, `ColumnCard.own` and `elsewhere`; the app's `renderEstate`,
  `openOntologyColumn`): where the ontology comes from, by name and hash, with the flows that read the same one; each
  handling with its flow, datasets and reason; a note on every card of the column. The build ships each estate's
  ontology (`readEstates` in `scripts/flow.ts`, `data/estates/<n>.json`, loads.json `estates`, `DataList.estates`); the
  names form on a column the estate describes (`estateSays`) asks why and writes the mark (`ColumnChange.override`,
  `nameColumn`, `nameColumnThrough`'s `described`); `test/ontologypage.test.ts`, `test/flowedit.test.ts`,
  `tools/browser/stops/overrides.json`.
  Slice 6 (built after slice 7), a change followed, said and tested: `src/core/attribute.ts` (in what the data's cache
  is keyed by) makes a change at the flow it belongs to: `editTargets`, `withOwnChanges` (a read flow's own document
  with the change sets about a file or step it has or reads), `ownWithEdits` (the name edits made again there,
  `NameOp`, `FlowEdit.name`), `attributeChanges` (the reading document naming each flow by the hash its own document
  has then); `readWithChanges` in `scripts/flow.ts` puts a recorded story's changes where they belong for the build
  and the recorder. `src/core/follow.ts` (pure, outside the data's cache key) is what the page says: `changeFlows`,
  `followersOf`, `flowChanges`, `pinProblem`, `flowDiff`/`diffLines`, `DayTest`, `testCount`, `testSaid`. A pin
  (`compose.ts`): a `flows` entry `{ path, hash }`, any other hash refused with both said, `FlowPart.pin`. The audit
  checks the flows each run names (`flow.reads`, each own document in the bag, `flowProblems`). The app: `followEdits`
  after every edit (`ownDocs`, `flowsToKeep`; the record keeps each own document as a blob), `partChanged` (the card's
  `FLOW · CHANGED`), `flowChangedPart` (the sheet's **What changed**), `testChange` (the last `TEST_DAYS` recorded days
  before a change takes effect, each a what-if run under the day's rules with the change; `tested`),
  `pinnedSaid`; `test/follow.test.ts`, `tools/browser/stops/follow.json`.
  Slice 9 (built before slice 8), building in the app. The catalogue: a flow's folder may hold `catalogue/`, each
  folder a flow made already that reads what the flow's own flows give (`examples/larkspur/catalogue/`: `ownership/`,
  `certificates/`, no file of their own); `scripts/catalogue.ts` `readCatalogue` reads each as any flow, the build ships
  its document (`data/catalogue/<id>.json`, loads.json `catalogue`, `DataList.catalogue`) and leaves the folder out of
  what the data's cache is keyed by. `src/core/catalogue.ts` (pure, outside the key): `CatalogueEntry`, `entryOf`,
  `addProblems`, `addFlow` (the flow's own steps, notebooks, gates and meanings after the document's, the flow listed
  by its path and hash; the plan is the one reading the flow with it listed gives, node for node), `takeOffProblems`,
  `takeOff`. The join form: `src/core/joincell.ts` (`JoinSpec`, `joinProblems`, which refuses two columns under one
  name and a fillable feed joined without `filled_from`, `joinedColumns`, `joinSaid`, `withJoin` writes the cell
  in `JOINS_NOTEBOOK` with its imports and publish line, `withoutJoin`, `joinsOf`) on `emit.ts` `emitJoin`; the step is
  derived by the notebook parser in a bundle of its own (`src/app/derive.ts` → `derive.js`, loaded when someone first
  builds; it keeps the page's sections and gives a new notebook one). The app: `renderBuildBar` (**Add a flow ›**
  above the canvas), `openCatalogue`, `addFromCatalogue`, `takeOffFlow`, `addedHere`, `catalogueDoc`, `builtInto`,
  `joinable`, `joinForm` (from **How it joins**), `writeJoin`, `takeOutJoin`, `loadDerive`; `followEdits` takes a
  catalogue flow's document as a shipped one's; a flow or a join whose own step stops its first run is taken back
  again, the record keeping both (`stoppedAt`). A catalogue's flow is held to the rules of what it reads: one built on
  a filled feed carries `filled_from`. `test/catalogue.test.ts` (Larkspur's two run on days of the estate through the
  engine), `test/joincell.test.ts`, `tools/browser/stops/build.json` on the tour and `alone.json` on the control
  estate, a flow that reads no other.
  Slice 10, the voice: `src/core/voice.ts` (pure, outside the key): `VOICE`, the three playful lines with their plain
  words and the one place each is said (`sealed` under a gold seal on a run with nothing held, `firstPass` after a
  catalogue flow's first day went out as usual, `emptyCatalogue`), `voice(line, plain)`, `NEVER` and `keepsToVoice`
  (what the wordplay never says of audited data). The app: `plainWords`, `wirePlainWords` (**Plain words** in About
  this flow, kept in the browser, or `?plain`), `.seal-voice` in `sealPart`. A new playful line goes in `VOICE`, never
  in the page; none on a paused day, a refused file, a decision, a hash or the audit. `test/voice.test.ts`,
  `tools/browser/stops/voice.json`.
  Slice 8 (built last), inputs and settings: a flow declares open `inputs` (each an id and the columns it needs) and
  `settings` (name, type, default) in its `flow.json` (`InputDef`, `SettingDef` in document.ts); its notebooks bind an
  input with `input('id')` (`src/notebook.ts`) and read a setting as `${params.name}`. A use is a `flows` entry
  `{ path, as, name, inputs, settings, hash }`. `src/core/reuse.ts` (in the key): `UseSpec`, `useProblems`,
  `useOntologyProblems`, `useNames`, `renameOntology`, `flowUse`, `useDocument`, `useOf` (a use's own document: the
  flow read under the use's name), `mapProblems` (a mapped dataset that isn't there, lacks a column or is built from a
  fillable feed without `filled_from` taken), `readsFill`. `notebook.ts` reads a notebook for a use (`NotebookDef.use`,
  its path ending `#<use>`; `usePath`, `filePath`, `usedName`, `usesOf` in document.ts): steps named `<use>_<cell>`,
  an input a step over the mapped dataset's needed columns (`emitPort` in emit.ts), a setting a literal; a flow imports
  what a use gives as `{ big as paid_big }`. `compose.ts`: `composeAll` (the document with each read flow's own
  document), a use a `FlowPart` with `use` (`FlowUse`: `of`, `inputs`, `settings`), its hash its own document's, its
  `reads` the flows that give what is mapped; `validateFlows` lets a use read a dataset of the flow that lists it;
  `translate` refuses a flow with open inputs and a use's own document. The app: the catalogue's **Use it ›**
  (`useForm`, `mappableFor`, `useNameFor`, `addOwn`), `usedDocs`/`useDoc` (a use's own document, read again by
  `derive.js`'s `use`), `usePart` on the sheet, an input's cell on the notebook page, a kept use taken off at start
  where the build ships another flow under its name (`loadFlow`), rule edits on a use refused (`pinProblem` in
  follow.ts). Larkspur's catalogue has *Control by unit* (`catalogue/by_unit/`). `test/reuse.test.ts`,
  `test/catalogue.test.ts`, `tools/browser/stops/use.json`.
  Slice 5, second step (built last of all, Q-245), a decision carried between pages that share a flow: Evidence feeds
  is a page of its own on the tour's files (`examples/larkspur/feeds/data.json`, its data list, and `tour.json`, its
  story: the tour's as far as it is about its files; a reader's data key takes a read flow's `flow.json` and `*.ts`
  only, `dataKey`), deployed at `/feeds/`; the build's `--page` ships where the pages that share a flow are (loads.json
  `pages`, `DataList.pages`; the app's `pageHref`, `readerPages`, **Its own page ›** on a flow's sheet, `#flow-pages`
  in About this flow, the link in `whoseLine`). `src/core/carry.ts` (pure, outside the key): `CarryAbout` (a page's
  decide entry: `base`, the record's own flow as kept when its run ran, `baseOf`; `from`, the entry it was carried
  from, `CarriedFrom`), `originOf`, `madeAt`, `leadingHere`, `decidedElsewhere` (`OtherRecord`, `Elsewhere`,
  `NotCarried`), `givesWay`, `proofOf` and `CarriedProof` (a blob of kind `carried`), `carriedProblems` and
  `baseProblems` (the audit's), `pageOf`, `carriedSaid`, `notCarriedSaid`. `src/app/record.ts`: `FlowRecord.others()`
  (the browser's other records, one a flow, same identity, read and never written: `foreign`, `readOn`, `covering`,
  `kept`; `RecordStore.origins`). The app: `carryDecided` (from `applyDecided` after a held run; `carryNow` when the
  page is looked at again), `decideNow`'s `Carrying` (who made it there, `from` by load, the loads it decides),
  `notePage` and `pagesToRead` (which other records are worth reading: a note in the browser's storage, the flows
  read, the site's pages), `notCarried` said in `whoseLine`, `carriedOf` and `takenBy` on the receipt, `namePage`, `pagePeople`.
  `test/carry.test.ts`, `test/record-others.test.ts` (on `test/helpers/fake-idb.ts`);
  `tools/browser/stops/carry.json` on the two apps served from one origin (tour.cjs's `page`).
- The ontology over time (ADR 0027, docs/research/temporal-ontology.md): the ontology first, every change a dated
  record with a kind and a reason, events as context, a day read under what was in force. Slice 1, the register on
  screen, over the rule changes already dated (no hash moves): `src/core/register.ts` (pure, outside the data's cache
  key): `subjectOf` and `shortOf` (what an edit is about, by key and lane, and what it leaves a thing as), `registerOf`
  (each change set an `Entry`: what it did, its `Tense` for the day read from, `How` it was said, as known at a
  moment), `livesOf` (rows, one a thing: its `Span`s over the days), `sinceOf`, `comingOn`, `howSaid`. viz.ts
  `registerLanes` and `scoreTrend`'s `marks`. In the app: `registerPart` at the Ontology view's head (a list on a
  phone, lanes from 820 px; `registerNow`, `registerToday`, `entryWhen`, `decidedMarks`, `openChange`), `sinceLink`
  on a rule's line (`ruleSubjectKeys`), what was coming on the day's head (`rulesLine`), `changeMarks` on the month's
  score; `test/register.test.ts`, stops in `versions.json` and `follow.json`. Slice 2, reasons, kinds and events (no
  hash a run names moves): a change set's `kind` (`CHANGE_KINDS`), `note` (`ChangeNote`), `decided` and `because` in
  document.ts; `KIND_NAMES`, `defaultKind`, `kindReads` in register.ts; `editRules` asks why wherever no reason came
  with the edit (`askWhy`, `whyFields`, `WhyGiven`); `src/core/events.ts` (`FlowEvent`, `eventsProblems`,
  `latestEvents`, `eventsOn`, `eventDay`), a story's `events` shipped in loads.json (`DataList.events`) and the app's
  own in the record (an `event` entry: `flowEvents`, `eventForm`, `writeEvent`); the register lists both, with each
  kind's mark (`kindMark`), the lanes' *Going on*, the day's `eventsLine`, the month's `eventBands`; a change tried
  from its entry (`testChange` with no flow). `test/events.test.ts`. Slice 3, the gate: a list or column the ontology
  closes is a rule of kind `closed` (`rules.ts`: `defines`, `entries`, `leftOut`; `closedOf`, `isList`, `arrivalOf`,
  `entryDiff`, `engineRules`), enforced by its file's check step (`emitRuleCheck`; a key left out by `emitLeftOut`,
  an `aside` rule `<id>_left_out`, counted apart from the rows the rules drop), named in the plan only where declared
  (`publish.closed`, `ClosedPlan`: no plan version, Q-286); the run names what arrived and what waits for data
  (`countClosed`, `ManifestNode.closed`, `ClosedCounts`; `emitUndeclared`, `emitKeysPresent`), the hold says it
  (`undeclaredSaid`, `Hold.undeclared`) and verify names it again (`closed`). The edits `declareEntry` and `leaveOut`
  (`flowedit.ts`, an entry's own), on the register as one thing (`entry:` subjects, begun on the day first named). The
  app: `gatePart` (*At the gate*: `gateStops` by the rules as known now, `docKnownNow`; `decideAtGate`,
  `declareLeftOut`, `leftOutNow`, `waitingNow`; `rerunAndRestate` shared with a mapped column), *Publish as is* off on
  the sheet, `closedEntries` and the closed kind of `ruleForm` (`entriesOnScreen`) on the Ontology page, `gateMarks`
  (the lanes' *What stopped at the gate*); `latestGot` (hold.ts) is the day readers see once a restatement publishes
  one, and `skipOf` learns from such a day (`restatedGot`: unless the run restated still holds the pause's own file). What an event excuses (§6): `Excuse`, `EXCUSABLE`, `excusesFor`, `ClaimExcuse` in events.ts; `excusedBy`
  (news.ts, `Finding.excused`), `Aside`/`asideOn` (history.ts), `asideBefore` and `StoryClaim2.excuses` (hold.ts),
  `TellFor.excuses`, the story's head *As expected: …*; the recorder writes a story's events into the record
  (`timelineOf`'s `event`) and the audit holds a claim's excuses to them (`retell.ts`); the app's `excusesNow`,
  `excusedLine`, `excusesSaid`, `excusedDays`, and the month's day picked saying what an event explains, no finding
  of the day (`expectedOf`, `AS_EXPECTED` in overview.ts; `dayExpected`). Document format 5 (`document.ts`; `described.ts`: `undescribed`,
  `rowSaid`, `asideOf`; `setAside`; the build's `undescribedIn`; the app's `firstLine`, `asideColumn`): every example
  flow but `examples/controls/`. Larkspur's catalogue is closed (the story declares the SBOM control on Wed 27 and
  plans the agents' reinstall of Sat 9 as an event that excuses); the sign-ins' Method is closed, its month to Mon 25
  (`GATE_DAYS`). `test/closed.test.ts`, `test/excuse.test.ts`, `test/described.test.ts`,
  `tools/browser/stops/gate.json`. Slice 4, the two doors (§5): `src/core/newsource.ts` (pure, outside the key):
  `readFile` (a CSV file read whole: each column's type from every value, blanks, distinct, commonest), `proposeSource`,
  `sourceProblems` and `columnsLacking` (what is still to confirm: what one row is, its key, every column described or
  set aside), `withSource` (the source, its description, and in `SOURCES_NOTEBOOK` its cell, a check step that warns of
  a row without its key, published; `shared` leaves an estate's meanings to the estate), `bindingOfSource`,
  `withoutSource`, `sourcesAdded`, `sourceReaders`; a dataset described ahead of its data (`ontology.awaited`,
  `AwaitedDataset`, `awaitedOf`, `awaitedIssues` in described.ts; the dated edit `describeAhead`; `matchAwaited`,
  `specOfAwaited`, `awaitedProblems`, `waitingForData`); `withRowSaid` (a format-4 flow's file says what one row is).
  `src/app/files.ts` (`FileStore`: the files added here, in a database of their own). The app: *Add a source ›* in
  `renderBuildBar`, `openSource`, `pickFile`, `sourceForm`, `addSource`, `takeOffSource`, `describeForm`, `awaitedNow`,
  `awaitedPart` (the Ontology view's *Described ahead of their data*), `addedSources`/`restoreAdded`/`pinAdded`
  (bindings and files kept in the browser, restored and pinned at start; `bindingOf` reads them), `rowForm` and
  `saveAsFormat5` on `firstLine`. `mergeOntologies` carries `aside` and `awaited`. tour.cjs: a stop's `then` (taps
  after a file was chosen) and `upload`'s third entry. `test/newsource.test.ts`, `test/files.test.ts`,
  `tools/browser/stops/doors.json` on the sign-ins; Larkspur's story describes the SBOM inventory ahead (`versions.json`).
  Slice 5, kinds, relations and meanings over time (§3; no hash tag moves, `rules/1` hashes the ontology whole): six
  dated edits (`RuleEdit` ops `setType`, `setLink`, `setRows`, `setNeeds`, `redefine`, `end`; `flowedit.ts` `setType`,
  `setLink`, `setRows`, `setNeeds`, `redefine`, `endThing`, each saying nothing where the document couldn't be read
  after it, `kept`); what ended is kept (`ontology.ended`, `Ended`, `ENDED_KINDS`: a kind, a relation, a rows entry, a
  dependency, a closed list's entry, a dataset described ahead that still waits; `FOLLOWED`; `endedIssues`); an
  estate's own change sets (`EstateOntology.changes`, `ESTATE_OPS`, brought in by `withEstates` before the flow's own,
  each marked `ChangeSet.estate`; Larkspur's `acting-leader` adds the relation *Acted for by* from Mon 11); the
  register's subjects for them (`type:`, `link:`, `rows:`, `needs:`, `meaning:`, `awaited:`; a thing a change adds
  begins there). Outside the key: `ruleversions.ts` (`RuleDiff`'s kinds for them, `diffSaid`, a closed list's entries
  said by what was declared, `ontologyMap`, `datedDiff` and `diffKey`: each difference with the change that made it)
  and `ontologypage.ts` (`redefinable`, `redefineEdits`, `redefinedWhere`, `Rule.needs`, `endedEntry`,
  `endedArrivalSaid`, `entryCalled`). The app: `kindsPart` on the Ontology view (the map first, viz.ts `kindsMap`;
  `datesCompared`; each thing behind a bar, since when, whose, `comingOfKey`, `ontologyComing`, `kindsKnown`), the
  forms `kindForm`, `linkForm`, `rowsForm`, `needsForm`, `endForm` (any ended kind) through `sendKindEdit` and
  `datedTail`; `editRules` checks an edit that changes nothing on screen on its own first day; the names form's
  *reworded or redefined* (`columnForm`, `meaningSince`); a closed list's entry ended and listed (`closedEntries`,
  `endedAtGate`); a description written ahead changed or ended (`describeForm(had)`, `awaitedNow`'s `ended`). The
  recorder judges a fill's donor under the rules of the day it fills (Q-303). `test/kinds.test.ts`; stops in
  `versions.json` (Larkspur), `estate.json` (the control estate) and `gate.json` (the sign-ins).
- `tools/`: not part of the package or the tests. `tools/browser/` drives the built app at phone, tablet or desktop size (`tour.cjs`, `TOUR_DEVICE`;
  with stop sets and `expect` checks, colour-blind and slicing helpers);
  `tools/judges/` holds the Workflow scripts that judged the views in rounds (tools/README.md).
- The browser regression in minutes (ADR 0025). The tour waits for the page, never a fixed time: the app says when it
  is at work (`window.__smaltflBusy`, `src/app/main.ts`: starting, a run under way, `engineBusy` in `engine.ts`), and
  `tour.cjs` counts what the page started and hasn't finished (`tracker`: fetches, short timers, frames, hashes,
  IndexedDB) and goes on when none is left (`idle`); a check that fails is read once more after 250 ms of stillness. A
  set opens on its first stop's day (`#day/…`, so the first day isn't run and left), the dark scheme is the same page
  (`emulateMedia`; a stop that needs a new browser says `"fresh": true`), screenshots are the tour's default and the
  regression's on failure (`TOUR_SHOTS`). `regress.cjs` replays each set once at its smallest size and takes the page
  to the others by resizing it (`TOUR_SWEEP`: the layout at each, nothing run again); `--full` replays at every size.
  `tools/browser/sets.json` is the manifest and the budget: each set's demo, sizes and the runs the engine may make
  for it (`runs`; on another demo of the same site its stops go to, `with`, counted apart: `carry` on the tour and
  Evidence feeds' page), each demo's cost of a run, `budget.engineSeconds` over their sum; a set that makes more runs,
  a stops file not listed, or a sum over the budget fails the regression. CI's `demos` and `browser` jobs run it.
  Amended on 2026-11-17 for ADR 0026's eleven sets (its §"Amended"; the budget raised with the maintainer's
  agreement, Q-246): 33 sets on five demos, 215 runs, 1,292 of 1,330 engine seconds; the tour finds a set's opening
  day by the list's `slot`.
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
  **Then:** [ADR 0020](docs/adr/0020-the-estate-as-a-company.md), the Larkspur estate (`examples/larkspur/`): a
  fictional company with an organisation, shared infrastructure, a real silver and a gold data product, built in the
  slices of its §8 and judged against its own answer key (§5); all seven are built. Its planted month is deployed at `/larkspur/`
  (`docs/guide/larkspur.md`), and its tour, two months, is the demo at `/app/` (ADR 0023, `docs/guide/demo.md`). The control estate stays as ADR 0014's, deployed at `/estate/` (`docs/guide/estate.md`).
  **Next:** [ADR 0021](docs/adr/0021-time.md), time: a month screen to pick a day (calendar, grid, trend, *for the day*
  and *as known on*) and a day screen (flow, lifecycle, story, versions); March recorded by the build; every version of
  a day kept like a commit, corrections decided; the ontology effective-dated and hashed to each run; what-if runs. In
  the slices of its §9: slice 1, the two screens and the recorded runs, and slice 2, the recorded story (deliveries,
  Larkspur's `story.json`, a day's versions, corrections decided), and slice 3, flip and compare (the compare summary,
  row and cell diffs by key), are built (its §"As built"); slice 4, the rules over time (change sets, the rules-in-force
  hash, back-dating and restatement, the story's changes recorded by the build, the Ontology view's versions), is built
  in two parts, and slice 5, what-if runs, is built: ADR 0021 is done. **Now:**
  [ADR 0022](docs/adr/0022-the-answers-of-2026-11-14.md), the maintainer's answers of 2026-11-14, in the slices of its
  §6: the time follow-ups (a what-if made the day's in one tap, a restatement that changes no day signed off, readers on
  the latest day when a past day is corrected, the audit of restatements), columns that change (a mismatched file
  paused, renames flagged with a suggested mapping and their impact), the ontology as the one place for rules, pausing
  (Q-86, Q-132, Q-84), and proposed declarations (Q-139). Slice 1 is built in two parts (its §"As built"). Slice 2,
  columns that change, was designed in the question prompt (Q-203 to Q-206, built as recommended); both its parts are
  built: a file whose columns changed, and a join column confirmed twice (Q-205) with the owner's own rename carried
  through the steps. Slice 3, the ontology as the one place for rules (Q-176, Q-118, Q-119, Q-145, Q-144), is built in
  two parts: the written rules in the ontology (loose ids per check, a gold key from a rows entry, `ontology.needs`),
  then drawings in the ontology's labels and a made dataset's rules on the Ontology page. Slice 4, pausing (Q-86, Q-132,
  Q-84): its first part, an overwhelming learned finding (Q-132, the threshold Q-207), is built; its second part,
  levels and fills for a slot's load (Q-84), is built: Accept offered for a slot, its level from the slot on in every
  slot's series (`levelDay`, `claimRanges` shared by `loadClaim` and the audit's `retellClaims`), a quarter-hour gap
  named by its whole hours (`missingOf`), a gap over a whole slot filled whole (`wholeLoad`), the level said by its
  hour (`fromShort`) and audited where it is made (`levelFromHere`). Slice 5, proposed declarations (Q-139), was
  designed in the question prompt (Q-213 to Q-216) and is built: a file's values, bands and key proposed from its data
  on the Ontology page and its Quality tab, each accepted with a reason as a dated change set: ADR 0022 is done (Q-35,
  sharing, comes later). The taxi example was
  retired on 2026-11-15, to focus on the generated demos (Q-208, ADR 0022's addendum). **Next:**
  [ADR 0023](docs/adr/0023-the-demo-as-a-tour.md), the demo as a tour of what a flow can do (Q-209 to Q-211): six
  scenes on a tour month of Larkspur (a normal day; a warning and the reactions to it; a hard rule's hold backfilled by
  the file sent again; a statistical anomaly that was real, then accepted; one that was an issue, filled, then
  corrected; fills each way and one file replaced), walked from the app's month screen, in the slices of its §6: fills
  in Larkspur, Q-86 (keep pausing until accepted), the tour month, the scene list. Slice 2 is built (its §"As built"):
  a day filled whole (`Missing` `{ all: true }`, a fill step's `time` optional for a file with no time of day,
  `missingFor`, `wholeDay`, a `whole` offer proposed only after keeping the last good day), a fill cell on each of
  Larkspur's twelve evidence feeds with `filled_from` carried through silver and gold (the five gold contracts it
  reaches at 1.1.0), the mark never measured or kept in a sample, a derived run telling its watched steps of the filled
  rows (`tellStep`, under the held run's flow hash; its release cites the filled file's decision alone), the decision
  sheet deciding the one held source that has a fill (`sheetSubject`), and the recorder recording a story's fill (`StoryDecision.fill`, `fillOnce`): Larkspur's
  story fills Wed Mar 6 from Tue 5, and Wednesday's own export replaces the fill (`test/fill-whole.test.ts` in the
  engine). Slice 3 is built: a lasting change keeps pausing until accepted (Q-86; `quiet` in `news.ts` holds every day
  a value of the mix stands at three times its usual share or a third of it, not its first alone), and the app accepts
  the held file's level on any day of it (`acceptFor`, `subjectFor`). Slice 4 is built: the tour month
  (`LARKSPUR_TOUR_DAYS`, `LARKSPUR_TOUR`, the trouble kinds `migration` and `mislabel`; `scripts/data/larkspur.mjs
  --tour`; `examples/larkspur/tour.json`, the data list's `variants.tour`, `build:app -- --variant tour`), its data made by `scripts/data/make.mjs` (the build's and the answer key's), the recorder's
  `accept` (`levelToAccept`) and a late delivery reading its own day, an accepted level breaking its column's pairs
  (`levelOn`), and its answer key at the demo's scale (`test/larkspur-tour.test.ts`, `npm run test:tour`); amendment 1
  (Q-212) makes the tour's world steady (`LarkspurOptions.steady`: no due dates gathered on the quarter's dates, a
  month's findings found through the weeks to the next Patch Tuesday, posts changing hands evenly with someone acting
  from the first day, new applications hosted as the rest, EDR versions kept) and spreads the scenes over February and
  March (`LARKSPUR_TOUR_FROM`; the month screen a calendar a month, `.mo-cals`, `spanName`), five of the 48 calm days
  left with a note; the classifier leaves out the columns an accepted level moved while its like days reach back before
  it (`HistoryRanges.movedSince`, `columnsOfLevel`, `apartEvidence`'s `moved`). Slice 5 is
  built: the scene list in the app (`src/core/scenes.ts`, `smaltfl-scenes/1`: `scenesProblems`, `lookOf`, `sceneHash`;
  `examples/larkspur/scenes.json`, the variant's `scenes`, shipped in loads.json; the month's **What this demo shows**,
  `scenesPanel`; a look's link `#scene/N/K` opening its day, version, card and tab or decision, `pendingLook`,
  `applyLook`; `test/scenes.test.ts`, `tools/browser/stops/tour.json`), the tour at `/app/` and the planted month at
  `/larkspur/`, `docs/guide/demo.md` the tour and `docs/guide/larkspur.md` the planted month: ADR 0023 is done.
  ADR 0022's slice 5 (Q-139) is built after it. What the taxi example's retirement left: the weather views are removed
  and the episode chips with them, the published-list check kept (Q-217, Q-218, ADR 0022's addendum); the browser
  integrity suite is ported to Larkspur as a stop set (`tools/browser/stops/integrity.json`), with the three fixes it
  found (ADR 0022's addendum). The retirement's list is done. **Then:**
  [ADR 0024](docs/adr/0024-the-month-at-a-glance.md), the month at a glance, from the maintainer's look at the tour's
  month on 2026-11-16 and research into how such screens are best done (docs/research/ui-month-overview.md): built as
  proposed, for the maintainers to confirm (Q-219 to Q-225); its §"Not built" is what it leaves. **And:**
  [ADR 0025](docs/adr/0025-the-browser-regression-in-minutes.md), the browser regression in minutes, from the
  maintainer's request of 2026-11-16 (a regression of 26 minutes): `npm run regress`, minutes on four cores,
  budgeted in the engine's runs and run by CI at every size; built as proposed, for the maintainers to confirm (Q-226
  to Q-230). Its §"Not built" says what stands between five minutes and two (Q-229); its §"Amended" is ADR 0026's
  sets brought in, seven and a half minutes with them (Q-246). **Now:**
  [ADR 0026](docs/adr/0026-flows-in-flows.md), flows in flows (2026-11-17, the maintainer's answers Q-231 to Q-239): a
  flow reads other flows, each a card on its reader's canvas with its day's mark, entered to see its own flow, rolled
  up into the month, in the slices of its §12: the core and Larkspur cut into five; the canvas in levels; the month in
  tiers; exploring what a flow gives; a paused day decided once, at its flow; a change followed, said and tested on the
  days recorded; the ontology's overrides; inputs and settings; building in the app; the voice. All ten are built,
  slice 5 in two steps (its §"As built", which says what each leaves): the second, a decision carried between a read
  flow's own page and its reader's, once the maintainer had chosen the page (Q-245), with Q-240 to Q-244 confirmed as
  built: ADR 0026 is done. What it leaves first is a flow run on its own and read by another (its §"Not built").
  **Next:** [ADR 0027](docs/adr/0027-the-ontology-over-time.md), the ontology over time (2026-11-18, the maintainer's
  answers Q-247 to Q-279, docs/research/temporal-ontology.md): the ontology is the business's rules, meanings and kinds
  of things, and data that changes stays data; the ontology comes first (a source is made with its description, and an
  entry of a closed list or a value of a closed column the ontology doesn't have pauses what it reaches until it is
  declared); every change is a dated record with a kind and a reason; events are context written by people, and may
  say what they excuse; a day is read under what was in force and carries that context. In the slices of its §11:
  slice 1 (the register on screen), slice 2 (reasons, kinds and events), slice 3 (the gate, what an event excuses,
  document format 5), slice 4 (the two doors) and slice 5 (kinds, relations and meanings over time, with the shared
  ontology's own change sets) are built (its §"As built", which says what each leaves); slice 6, reading across a
  change, is next. Its Q-280 to Q-285 are proposed, for the maintainers to confirm as each is built, and Q-286 to
  Q-303 are the choices slices 3, 4 and 5 made as they were built.

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
  never by changing what a phone gets. A change to `src/app` runs the stop set it touches at every size
  (`npm run regress -- <set> --full --shots all`, or `tour.cjs` with `TOUR_DEVICE=phone|tablet|tablet-wide|desktop`),
  looks at the screenshots, and reports no problem the change added; nothing may scroll sideways. From 960 px the page is the desktop split (`src/app/split.ts`, Q-159): the flow
  on the left and the workspace (the sheet) on the right across the window but a band at each edge, a bar between them
  dragged to resize them (`--sheet-w`, kept in the browser) and buttons that give either side the whole window
  (`body[data-split]`); `TOUR_DEVICE=wide` (2560×1440) and `tools/browser/stops/split.json` check it.
- **The browser regression stays in minutes** ([ADR 0025](docs/adr/0025-the-browser-regression-in-minutes.md)). Its
  cost is the engine's runs, and they are budgeted (`tools/browser/sets.json`). A new stop goes beside the stops
  already on its day, so it opens none: such a stop costs a third of a second. A stop that opens a day, decides,
  reloads or runs a what-if is a run: raise its set's `runs` by what it adds, and keep the sum under
  `budget.engineSeconds`, by taking a day out elsewhere if need be. Raising the budget itself is the maintainers' to
  agree. A new stop set is listed in `sets.json` with its demo. A set stays on a day while it has stops there and
  doesn't come back to one it left (a day opened again is a run again); a dark stop is the same page, so it goes
  before the stop that changes what it looks at. No stop waits a fixed time, and `waitFor` is for what many runs
  draw.
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
| `smaltnb` | `smaltnb` | the notebook format and graph (`smaltnb/format`, `smaltnb/graph`, ADR 0011); its cypher cells are no step a flow runs, refused by name (`classify`) |
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
