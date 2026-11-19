# Handoff: where smaltfl stands (2026-11-09)

This is the state of the work when the project moved to a new repository. Read it with [CLAUDE.md](../CLAUDE.md) (layout
and rules), [docs/adr/](adr/README.md) (the decisions) and [docs/OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) (the owner's
answers and what is still open).

## Where everything is

| What | Where |
|---|---|
| The code | `beepboopbop64/smaltfl_fork` (a fork of `stenhoor/smaltfl`): `main` is the handoff (`5bdb1b4`); ADRs 0011 to 0014 are on `claude/gallant-mendel-uckiwr` (tip `b37762a`, handed over mid-check); the review of 2026-11-10 is on `claude/jolly-archimedes-og91mn`, on top of it. No PR is open. `beepboopbop64/smaltfl` (`claude/elegant-knuth-r8364a`) is the repository the work moved from |
| stenhoor's initial commit | merged in (remote `stenhoor/main`); the move to `stenhoor/smaltfl` (ADR 0007) was blocked by GitHub access, see "Moving the repository" |
| The data | every demo's days are generated from its seed by the build (`scripts/data/`: Larkspur, the control estate, the sign-in log). The taxi example and its `data` branch were retired on 2026-11-15 (Q-208, ADR 0022's addendum); its document, data list and XS files stay as unit-test fixtures (`test/fixtures/`) |
| The app, published | a private claude.ai artifact (version 22, built from `6be5755`): it doesn't have the last three commits (round 3 below). The notebook form (ADR 0011, slice 4) is published separately: https://claude.ai/artifact/3xkiHJnRGK4viZkT4y5k6u, built from the fork's `claude/gallant-mendel-uckiwr` on the data branch's loads; the sign-ins with the demo's three days (ADR 0012) as a second artifact (https://claude.ai/artifact/YNfh3yNapW9pv4HCtoWdCu), built with `--flow examples/security-signins/flow.json --out dist/app-signins`; the controls posture (ADR 0013) as a third, https://claude.ai/artifact/EaLvZcxsnu5ZNP5kNNCahH, built with `--flow examples/controls/flow.json --out dist/app-controls`; the control estate (ADR 0013 §8) as a fourth, https://claude.ai/artifact/NonRDwrC3eNjLmhfRwEgvP, built with `--flow examples/control-estate/flow.json --out dist/app-estate` |
| Browser checks and judging tools | [tools/](../tools/README.md) (added for this handoff; they lived in a session scratch folder before) |

## The review of 2026-11-10

A new session took the tip (`b37762a`) and reviewed it before the next phase. It built the estate, taxi and sign-ins
apps, captured their screens at phone and desktop size, ran a panel of judges on the estate's screens and had ADR 0014
audited as built, each audit checked by a second reader. The maintainer's answers that followed are Q-120 to Q-131
(docs/OPEN_QUESTIONS.md). The next ADR (0015) is to be written from them.

**What it found**, most important first:

1. **The estate's brief is wrong on a held day.** On Tue Mar 12 the WAF file fails 59.6% against its band of 0–15% and
   holds the day. The brief on the posture card is headed "A normal Tuesday", draws "600 apps, usual 600–600", gives
   the TLS file as the cause and proposes "Publish as is". The head and `fixOf` read the judged dataset's own story,
   which is calm when another load holds the day, and `causeOf` has no fact for a gate finding. The two-minute test on
   the estate scored 29 of 35 (seven days, one reader, graded against ADR 0014's key); the taxi app had scored 40 of 40.
2. **Gate findings have no drawing, and the card that holds the day leads nowhere.** `viz.ts` did not change in ADRs
   0011 to 0014: a band, due, scope, needs, reconcile, pair or classifier finding is a title and a sentence. A bronze
   load that holds shows its verdict over "Nothing out of the ordinary" from its own rows, with no Decide and no brief.
3. **The layers don't read.** The layer is the last word of a card's label, cut to "S…" and "G…" on silver and gold
   cards. A phone shows three of sixteen cards, all bronze; silver and gold sit folded in notebook boxes off screen.
   Nothing says, for the day, where the gates stopped.
4. **Nothing answers a question.** Results is written for the taxi example; for the estate it lists four outputs with
   their hashes. A reader given ten leadership questions answered three in full: a trend, "which applications" and
   anything nobody prepared had no screen.
5. **Options state no gain and no cost.** Each is one line ("readers get the day as it came, marked"), and "Expected
   once" publishes a held day in one tap.
6. **The gates promise more than is enforced.**
   - The seal is the page's state: the same word for a clean pass and for a day published over a failed check, not
     kept across a reload, not checked offline.
   - A watched source's verdict is still told by the page.
   - Gold's reconcile compares keys, not totals: the doubled TLS day passes all three gold gates.
   - The `schema` and `rules` modes don't decide their holds: a refused file holds whatever the mode says, and a
     `check()` step's limit holds by `publish.hold`.
   - A toggle and an accepted band are lost on reload.
   - plan/4 and sample/0 have no pinned vectors, and the kept sample ships rows for every watch.
7. **The base is not green.** CI failed on the last five pushes: `test/fill-general.test.ts` passes vitest's
   five-second default. With `dist/app/data/history.json` from the fork's data, `hold-real` and `story-real` fail six
   tests, and the taxi example holds 41 days under `wrong`, not 25 (Q-133). CI skips those tests. *Closed on 2026-11-15:*
   the real-history tests went with the taxi example (Q-208).
8. **The family has moved.** smaltdb's head has the public plan API, exact percentiles, pivot and typed dates, and
   runs SQL only with smaltql registered. *Done on 2026-11-11 (ADR 0017, Q-156):* every pin is at stenhoor's main and
   smaltql is pinned and registered; sessions move the pins again first (`npm run deps:latest`). The fork of smalt-brand is behind
   upstream, which a reader reports now gives smaltfl the user tools' cerulean in place of teal: to confirm with
   stenhoor.

**The order of work the maintainer chose:**

1. **Make it right** (Q-126): CI green and Q-133; a brief that follows what holds the day; a drawing for each gate
   finding; options with a computed gain, cost and undo (Q-124), a proposal only with what it rests on named (Q-128,
   Q-132); the stage rail (Q-125); the seal as passed or decided (Q-127); then a judging round on the estate.
2. **The engine pin** (Q-130): done on 2026-11-11, brought forward (ADR 0017).
3. **Questions** (Q-122, Q-123): question cells in notebooks, shown as cards on the gold datasets, then the builder.
4. **The other examples** gain their gates one by one (Q-131).

**How to repeat the review:** `tools/browser/stops/estate.json` captures the estate's screens (`tour.cjs` gained
`unfold`, `box` and `what`), and `tools/judges/estate-panel.workflow.js` is the panel that read them
([tools/](../tools/README.md)).

## What is built

Each piece has its ADR, tests, and a line in CLAUDE.md's layout.

- **The core, the runtime and integrity** (ADR 0004, 0006): flow documents and plans, keys, reuse, expectations, signed
  run/1 manifests, verify's levels, the hash-chained record (RFC 9162), audit bags and their offline check.
- **The day's news, drawn** (ADR 0008): one cause per day, told with a head of six words or fewer, one visual and word
  budgets enforced by tests. At phone size the Sep 22, 2023 News tab went from 3,217 words to about 60.
- **A day that is off is paused, not published** (ADR 0009): the `publish` block (format 2, plan/1), holds from the
  checks and the story's claim, the decision sheet (publish as is, keep the last good day, don't publish, until a day
  publishes), releases, verify's *held* check, the audit.
- **Filling a paused day** (ADR 0009 amendment 1): the `fill` step and `filled_from`, donors (same weekday or the
  nearest good day before or after), the part that arrived, withdrawing a fill (the owner, Q-61), versions of a day,
  all recorded and audited.
- **Any dataset** (ADR 0010, phases 1–4):
  - format 3 and plan/2;
  - calendars per flow;
  - patterns (weekly, none, monthly);
  - nouns and marks from the ontology;
  - "Not judged yet";
  - bad values that always alert;
  - a general history builder, and claim/2 from each load's own measures;
  - the app running any flow, with a generated sign-in log as the second example;
  - several sources and slots;
  - Accept the new level.

  The taxi example is format 3 with 25 held days (Q-54).
- **Checks nobody wrote** (ADR 0013, 2026-11-09): a history keeps each pair's cells day by day; the combination
  judge (a pair's log odds ratio against its own history, one finding a pair) and the forest judge (the day against
  the days before, by the isolation forest); a watch on a published step, its claim told in the engine; the history
  builder's step mode; the app on several daily sources, following the dataset the list names; the controls example
  (six controls over 400 applications, five planted days) through the engine (`test/controls.test.ts`) and in the
  app. What the planted days read as is ADR 0013 §6's table. `test/controls-anyday.test.ts` plants seven kinds of
  trouble on other days, other controls and another seed and finds each by the same code, with no false alarm on the
  other days: the judges know no date. Open: Q-104 to Q-109.
- **The control estate** (ADR 0013 §8, 2026-11-09): the richer dataset the maintainer asked for before the next
  round of judges: a typed inventory of 600 applications, twelve controls covering only the applications they apply
  to, five on SLA dates with clustered due dates, four status words, one dependency rule, and three layers of planted
  days (obvious, contradictions and scope, look-alikes beside one real SLA problem). `examples/control-estate/`,
  built with `npm run build:app -- --flow examples/control-estate/flow.json --out dist/app-estate`. **What the flow
  should say of each day is decided**: ADR 0014 (gates), from the maintainer's answers Q-110 to Q-117, with the
  estate's March as its answer key and seven slices in order. `test/estate.test.ts` asserts the data;
  `test/estate-flow.test.ts` runs March through the engine (`test/helpers/estate-world.ts`, about three minutes) and
  asserts what each slice gets right and, explicitly, what it still gets wrong against the key.
- **Gates, slice 1** (ADR 0014 §"As built", 2026-11-10): the `gate()` cell, `doc.gates`, plan/4 (a watch's `checks`),
  the layer defaults, the rule (written checks hold, learned ones warn unless the value is bad, `off` says nothing),
  the layer on the card's label and a read-only Checks tab. Only a flow that declares a gate is plan/4: every other
  flow's hashes and vectors stand. The estate's March under it: the empty, doubled and scope days hold on the amount,
  the WAF collapse by the bad value, the backup outage by its blanks; unusual days publish; the look-alikes and the DR
  day still hold alike by `fail` rising, Patch Tuesday's `next_due` filling in holds the vulnerability file on its
  blanks, and the contradiction publishes: slices 2 and 3's vectors, asserted as such.
- **Gates, slice 2** (ADR 0014 §"As built", 2026-11-10): `expect` bands and `due` marks in the ontology (plan/4 carries
  them), the `band` finding, due counts in measures and the history, the `due` finding from yesterday's cohort against
  the pooled cohort share, Accept the new band. The estate: the WAF collapse and the backup outage hold on their
  bands; the vulnerability and access-review clusters publish as unusual; the pentest cluster and the DR day still
  hold by the bad or new value in the test's short base (the app's year judges them).
- **Gates, slice 3** (ADR 0014 §"As built", 2026-11-10): `scope` and `needs` rules in the gate cell, counted in the
  engine beside every other measure and kept in the history, said in words and holding at five rows past the usual;
  upstream attribution: a step's finding about a source's column follows the source, and a wrong source explains the
  step's day. The estate: the contradiction holds on the posture's dependency, the scope days on the WAF's and TLS's
  scope, and the posture no longer repeats the controls.
- **Gates, slice 4** (ADR 0014 §"As built", 2026-11-10): the kept sample beside each history (two hundred rows a day,
  stratified, eight weeks, `sample.<watch>.json`, pinned and appended by each run) and the classifier (boosted stumps,
  held-out AUC against chance and random labels, explained by permutation), an `apart` finding that warns.
- **Gates, slice 5** (ADR 0014 §"As built", 2026-11-10): the `reconcile` rule in the gate cell, counted in the engine
  (a measure on a watched node; on a gold node the run counts it over what it built, `ManifestNode.gate`, a hold where
  the gate says hold, verify's `gate` check), and the seal in the app (`sealOfRun`: gates passed or holds decided and
  published, signed by the owner without asking; the Checks tab's seal part, the card label's SEALED). The estate's
  posture reconciles with the inventory, each summary by its key; Thu 21 now holds the posture on its rule as the key
  has it.
- **Gates, slice 6** (ADR 0014 §"As built", 2026-11-10): the Checks tab's toggles write the gate cell
  (`src/core/gatecell.ts` `toggleCheck`, the `checks` property alone, a cell made where none was; `test/gate-toggle.test.ts`
  proves smaltnb's parser agrees with the hand-derived document), recorded at once as a `flow` entry with the reason;
  feedback on a finding (expected once → publish as is; the new level → accept; not interesting → the check turned
  down in the cell).
- **Gates, slice 7** (ADR 0014 §"As built", 2026-11-10): a refused file is the schema check's hold, not a failed run,
  in a flow with gates (`ManifestNode.status` `refused`, `holdsOf`/`refusedSaid`, verify coherent on a run that built
  nothing, a release of it refused, the page tells no claim of a load it can't measure). ADR 0014 is built in full:
  against the key only the pentest cluster and the DR day read otherwise, both the short test base's doing. **Next:**
  the maintainer's reactions to the estate app, Q-118 and Q-119, and ADR 0009's remaining pause work (a corrected file
  replacing a fill on its own, Q-62).
- **The bronze layer** (ADR 0015 §"As built", 2026-11-10), on `claude/jolly-archimedes-og91mn`. Slice 1: the
  ontology's `rows` says what a dataset's rows are, and a watched node is held to the objects it covers and to its
  key from it (`writtenRules`); bronze holds on its key by default. Amendment 1 (the maintainer on the published
  app: the Ontology page should be the files, their columns drawn, their rules under them, Q-140 to Q-143), piece
  (a): the Ontology page is laid out by file and shows the rules the ontology has today, with nothing edited and no
  hash moved (`src/core/ontologypage.ts`, `renderFiles` and `fileSection` in `src/app/main.ts`,
  `test/ontologypage.test.ts`, the ontology stops of `tools/browser/stops/estate.json`): a row a file, its section
  opened in place with what the file is, this file's rules, a card a column (its values drawn, its meaning, its
  rules in words, the file's rules about it among them) and Discovered, empty. **Next:** the maintainer looks at
  it in the app; then piece (b), rules as each file's own with their forms and the two ways a range is kept, and
  piece (c), the import card's toggles from those rules. Q-144 (where a joined dataset's rules go on a page laid
  out by file) is open and wants an answer before (b).
- **Rules people set, and the import card's switches** (ADR 0015 amendment 1, pieces b and c, second stage,
  2026-11-10, on `claude/trusting-euler-ogz88y`): `ontology.rules` (`src/core/rules.ts`), each a file's own, enforced by
  the check step that reads the file; added, changed and removed on the Ontology page; switched on each source's
  **Rules** tab; the sign-in log ships three, from the sign-in file's shared ontology (`examples/ontologies/auth.json`),
  which the Sign-ins and Lock-outs flows both import. The two models as visible checks (ADR 0015 §6 as built: the Models
  tab, the classifier on every flow with a sample, two planted days only they see, `test/models.test.ts`; Q-152, Q-153).
  Q-148 decided (defined in the ontology, switched in the check cell, cells rewritten when the ontology changes); open: Q-149 to Q-151 (how a rule is enforced, the
  kinds, the sign-in log's rules) and still Q-144. **Next:** a range derived from the last days, fixed or rolling
  (Q-142); rules on a dataset the flow makes (Q-144); a rule drawn against today's number (§5).
- **Each application scored, and the controls by type of application** (2026-11-11, on `claude/trusting-euler-ogz88y`):
  the estate's `scores.nb.ts` scores every application from the posture (`app_scores`: its standing, passing, failing
  one or two, at risk with three or more, or not settled; the controls it fails by name; passed, excepted, not
  assessed, applicable; worst first, a silver gate reconciling it with the posture), and `summary.nb.ts` adds
  `by_profile` (standings by hosting and criticality), `control_by_type` (each control's failures by hosting and
  criticality) and `failed_together` (for the applications failing each control, how many fail each other), each with
  a gold gate. The generator's hosting effects (`riskOf`: on premises misses backups and central logging, SaaS fails
  MFA) are what they show; ADR 0014's answer key doesn't move. A small output's Data tab draws it at a glance
  (`src/app/grid.ts`: a heat table, the cells most out of line with their row said in words, "MFA · SaaS · High 32% ·
  9% elsewhere"; `test/grid.test.ts`, `tools/browser/stops/apps.json`). `test/estate-flow.test.ts` checks every
  application's score against the generator and the interactions through the engine.
- **The notebook as a page, and the site** (2026-11-11, on `claude/trusting-euler-ogz88y`): a notebook's box opens as a
  page with each step's callouts, output and models under it, and the reader's own SQL and note cells at the bottom
  (kept in the browser). The site (`docs/`, VitePress with smalt-brand's kit copied unchanged): home, Quick start, A walk
  through the demo, Working in the app, Writing a flow, Status, and the design records; `.github/workflows/docs.yml`
  deploys it with the estate demo at `/app/` and the sign-ins at `/signins/` (since ADR 0020's slice 7, 2026-11-13:
  Larkspur at `/app/`, the control estate at `/estate/`; since ADR 0023's slice 5, 2026-11-16: Larkspur's tour at
  `/app/`, two months since its amendment 1, and its planted month at `/larkspur/`). Waiting on the owners: Pages turned on
  for the repository (Source: GitHub Actions), and smalt-brand's product page, status row and `FAMILY` entry for
  smaltfl (its mark and positioning line are owner decisions).
- **Round-3 fixes, partly done** (the last three commits, `f76107b`, `791d07b` and `e42d9ec`):
  - Hour-fall days are told as they were (below).
  - The pause is carried through every view.
  - Closed data is kept from viewers who can't read it, and only someone who may decide can run or publish.

## How to check it

```sh
npm ci && npm run deps                      # then the builds of stenhoor's repositories pinned in packed.json
npm run deps:latest                         # every session first: move the pins to each repository's main (ADR 0017)
npm run check                               # typecheck + about 900 tests, under a minute on four cores
npm run test:slow                           # the estate's month, Larkspur's six months and the models (CI runs it beside)
npm run build                               # declarations; NOTE: wipes dist/, so build the app again after it
npm run build:app                           # dist/app on Larkspur, its days generated; the bundles are named by content (app.<hash>.js), so a
                                            # browser never serves a stale build under the old name (bundles.json says which)
npm run build:app -- --variant tour --out dist/app-tour   # the demo: the tour's two months and their scene list (ADR 0023)
npm run regress                             # the browser regression (ADR 0025): the five demos built, every stop set run, seven
                                            # and a half minutes on four cores; `-- tour` for one set, `-- tour --full` at every size
npm run regress -- carry                    # one set: here the two pages that share a flow (ADR 0026 §6), the tour and
                                            # Evidence feeds' own page, built side by side as the site serves them
```

Results on 2026-11-09, at `e42d9ec` on data `0ca4dd1`:
- **Tests:** 772 passed and 1 skipped with `npx vitest run --testTimeout=30000`.
- **The 5-second default:** under a busy machine, `test/fill-general.test.ts` (and a few others) can time out. They pass
  alone or with the longer timeout; they aren't wrong results.
- **Browser suites:** episode 20/20, integrity 13/13, and the pause stops report no problems (see [tools/](../tools/README.md)).
- **Real-history tests** (`hold-real`, `story-real`, `fill-real`, `backtest-real`) needed `dist/app/data/history.json`.
  They, the episode and integrity suites and the taxi app went with the taxi example on 2026-11-15 (Q-208).

## What is not done

**Now: [ADR 0027](adr/0027-the-ontology-over-time.md), the ontology over time** (designed 2026-11-18, the maintainer's
answers Q-247 to Q-279; slices 1 to 7 of ten are built, its §"As built"). The maintainer asked for a temporal
ontology: how the ontology changes over time, why certain things apply on certain dates, what was going on and what
was decided then, shown visually and carried with the data so that analysis is always aware of its context. The
research is [research/temporal-ontology.md](research/temporal-ontology.md): temporal data models, ontologies and
knowledge graphs, law, clinical terms and statistics, HR systems, data platforms, how change over time is drawn, and
analysis across a change of definition, in two passes, the second against the primary pages. The design was settled in
the question prompt, thirty-three questions in seven rounds. Its shape:

- **The line.** The ontology is the business's rules, meanings and kinds of things. Who and what is where from day to
  day is data. A reorg or a freeze is context, written down as an event.
- **Ontology first.** A source is made with its description. A new entry in a closed list, a new value of a closed
  column or a changed defining column pauses what it reaches until it is declared, from a day, with a kind and a
  reason.
- **Every change is a dated record** with a kind (the business changed, a setting re-tuned, a mistake corrected, the
  source changed), a reason, an optional note, who decided and who agreed. A change said ahead is coming, with what it
  would have done.
- **A day is read under what was in force,** and carries its context: marks on charts, three tables any cell can join
  to, the same tables published with the product. A chart is cut where the business changed, with the change's own
  step.

In the slices of ADR 0027 §11, the first of which moves no hash: (1) the register on screen, over the rule changes
smaltfl already dates; (2) reasons, kinds and events; (3) the gate, and document format 5; (4) the two doors; (5)
kinds, relations and meanings over time, and the shared ontology's own changes; (6) reading across a change; (7)
context that travels; (8) who decides; (9) who hears, and the auditor; (10) the demo's new scene. Q-280 to Q-285 are
the choices the answers leave open, proposed for the maintainers to confirm as each is built; Q-286 to Q-291 are the
ones slice 3 made as it was built, Q-292 to Q-296 slice 4's, Q-297 to Q-303 slice 5's, Q-304 to Q-311 slice 6's,
Q-312 to Q-319 slice 7's, Q-320 to Q-326 slice 8's, Q-327 to Q-332 slice 9's and Q-333 to Q-336 slice 10's. All
ten slices are built: ADR 0027 is done.

Built so far:

- **Slice 1, the register on screen:** every change set as a list and, from tablet width, as lanes; since when and by
  which change on each rule; what was coming on a day's head; marks on the month's score.
- **Slice 2, reasons, kinds and events:** a kind and a reason on every change, the note, who decided; events written
  in a story or in the app, on days, lanes and charts; a coming change tried on the days before it.
- **Slice 3, the gate:** a list or a column the ontology closes (a rule of kind `closed`). What arrives that the
  ontology doesn't have stops what the file reaches, named by the run, with three decisions on the day's head: declare
  it from the day, publish without it, or don't publish. An entry declared before its data waits for it. An event can
  say what it excuses of the learned checks. Document format 5 puts the ontology first, and every example flow but
  the older controls posture is format 5. How to check it: `test/closed.test.ts`, `test/excuse.test.ts`,
  `test/described.test.ts`, Larkspur's answer key (`npm run test:slow`: Wed 27 at the gate and declared, Sat 9 told
  as expected), and `npm run regress -- gate` on the sign-ins.

- **Slice 4, the two doors:** *Add a source ›* above the canvas. *Here is the data*: a CSV file picked is read in the
  browser, its description proposed from what it holds, and nothing is written until what one row is, its key and
  every column (described or set aside) are confirmed, with a reason; it is then cells of `sources.nb.ts`, its file
  kept in the browser, and the day runs with it. *Describe it first*: a dataset described ahead of its data
  (`ontology.awaited`, the dated edit `describeAhead`) waits for data until a file is bound to it, its columns read
  as the described ones. A format-4 flow is brought up to format 5 by its owner on the Ontology view. How to check
  it: `test/newsource.test.ts` (through the engine too), `test/described.test.ts`, `test/files.test.ts`, and
  `npm run regress -- doors` on the sign-ins (a file added, the page loaded again, a dataset described and bound, a
  source taken off); Larkspur's Ontology view lists the SBOM inventory, described ahead from Wed 27
  (`npm run regress -- versions`).

- **Slice 5, kinds, relations and meanings over time:** six dated edits beside the rules' (`setType`, `setLink`,
  `setRows`, `setNeeds`, `redefine`, `end`), each a change set with a kind and a reason. Nothing is deleted: a thing
  ends from a day and the ontology keeps that it ended, with what follows it (`ontology.ended`). A meaning edited on
  a column's card is reworded (at once, every day) or redefined (from a day). An estate's ontology carries its own
  change sets, which every flow that imports it follows: Larkspur's adds the relation *Acted for by* from Mon 11.
  On the Ontology view: the kinds and relations as a map, two dates compared (each line with the change that made
  it), each thing since when and whose, and the forms that add, change and end a kind, a relation, what a row is, a
  dependency, an entry of a closed list and a dataset described ahead. The build's recorder now judges a fill's donor
  under the rules of the day it fills (Q-303), which the tour's fill of Mon Mar 11 needs since the estate's relation
  begins that day. How to check it: `test/kinds.test.ts`, `test/estate-ontology.test.ts`, the tour's answer key
  (`npm run test:tour`, which runs that fill through the recorder), `npm run regress -- versions` on Larkspur (the
  map, the list, the estate's change, two dates, a description written ahead ended), `npm run regress -- estate` on
  the control estate (a meaning redefined, a kind and a relation added and ended, what a row is changed, a dependency
  added, then back to the flow as shipped) and `npm run regress -- gate` on the sign-ins (an entry of a closed column
  ended, merged into another).

- **Slice 6, reading across a change:** the build runs the first day of each change of kind *the business changed*
  both ways (as published, and as a what-if under the rules as they were) and the record keeps what the change alone
  moved as an entry of kind `step` (`src/core/step.ts`, the recorder's `stepOnce`). The month's trend is cut where a
  step moved one of its lines, flagged with the step, with the lines with the steps taken out on request, the days a
  correction replaced listed with what they first published, and each change's own step said beside its mark
  (`src/core/across.ts`, viz.ts `scoreTrend`). The watched series a change moved are a level from its first day,
  which the learned checks learn from; the first day itself is read as the day's data was judged the old way, and
  the month says what the change accounts for. A coming change's trial gives the same figures. A finding's day by
  day is marked where its column was redefined, and a value that ended is followed through to what replaced it. On
  Larkspur: the catalogue's fifteenth control (Wed 27) cut the coverage by 8.3 points and left the score where it
  was; the other two changes moved nothing. How to check it: `test/step.test.ts` (a day run both ways through the
  engine), `test/viz.test.ts` (the cuts and the adjusted lines), the tour's answer key on data made again
  (`npm run test:tour`, whose month the recorder steps through), and `npm run regress -- month versions follow` on
  Larkspur (the cut and the adjusted line, the day picked, the day's head and a dataset's News on a change's first
  day and the day after, each entry's step, a trial's figures). The recorded steps themselves are in each demo's
  `data/month.json`, as entries of kind `step`.

- **Slice 7, context that travels:** three tables any notebook cell can join to (`context('changes')`,
  `context('events')`, `context('in_force')` from `smaltfl/notebook`): the dated changes in force on the run's day
  with what each reaches, why and its own step; what was going on, with what each event reaches and excuses; and the
  version of the ontology each dataset was read under. In the document each is a SQL step that reads nothing, marked
  `context`; the run's rows are made from the flow as kept and the record (`src/core/context.ts` `contextRows`,
  `contextKnown`) and carried by the plan, so the run publishes them like any output and verify recomputes them.
  Larkspur's product publishes the three under contracts: 95 plan nodes and 40 outputs where it had 92 and 37. A
  context table is no data of its day (Q-318): it differs wherever the rules do, so a day run again under rules
  changed since is compared with what readers got by its other outputs (`restatedOutcome`'s `context`), and Compare
  lists a context table that differs apart; counted as data, a back-dated change restated every day it reached. In
  the app every card's sheet says its **Context** (what reaches it, through what, as known now, with what was said
  after the version on screen ran marked as such), and a change marks the charts of what it reaches: the month's rows
  and each day by day chart. How to check it: `test/context.test.ts` (the rows, the notebook's marker, a run through
  the engine whose cell joins all three, verify, and a tampered plan failing it), `test/compose.test.ts` (Larkspur's
  plan), `test/step.test.ts` (`changesReaching`), `test/month.test.ts` and `test/compare.test.ts` (the tables left
  out of a restated day and of Compare's count), the tour's answer key, and `npm run regress -- larkspur month
  compare tour` (the tables' own sheets, a card's context, the rows' marks, a day by day chart's; Larkspur's March
  still three restated days; a fill released as the record decided it).

- **Slice 8, who decides:** the ontology names who owns each of its parts (an estate's shared ontology, `owners` in
  its document; each flow's own, `ontology.owners`; none named, the flow's owner), and a change the business made, or
  one that ends something, is in force only once an owner of every part it touches has agreed, from the moment of
  the last agreement (`src/core/agree.ts`: `asksAgreement`, `partsOf`, `ownersOf`, `agreementOf`, `knownFrom`,
  `agreeTo`, `agreedIssues`; `ChangeSet.agreed`). The rules in force follow a change from then (`changesOn`), so one
  that waits is in force on no day; an author who owns what a change touches agrees by recording it, and the record
  says one person held both roles. Larkspur's estate and its product are the security lead's: the catalogue's
  control was written down at 09:10 on Wed 27 and is in force from her agreement at 09:15. In the app: **Who owns
  it** at the head of the register, whose agreement a kind asks for in the form that asks why, a waiting change
  first on the register with **Agree** for an owner of what it waits for, and who agreed on every entry. The audit
  holds each agreement to the owners its flow document names and to whoever made the record's entry. How to check
  it: `test/agree.test.ts`, `test/audit.test.ts` (the last block), `test/compose.test.ts` (owners travel with their
  flow), and `npm run regress -- versions` on Larkspur (a change that ends something waits, the security lead
  agrees, it is in force).

- **Slice 9, who hears, and the auditor:** the ontology's changes and events are told once (`src/core/told.ts`
  `toldOf`: each with its days, kind, what it did, why, who made, decided and agreed, what it reaches and its own
  step) and read four ways. *Since you last looked:* a browser keeps, by flow and by who is viewing, how each thing
  stood; the register's head, the home screen's top and a read flow's sheet say what is new and what moved, until
  **Got it**. *A digest:* under the register, **Pass it on**, over a month, a week or every day, as text, an image
  or a link. *A feed:* the app's build writes `feed.xml` beside the page (Atom; `scripts/feed.ts`), which the page
  links to. *The history for an auditor:* a page in place of the Ontology view over a period picked, which prints
  as it reads, and `data/ontology/history.json` in the audit bag, which the offline check makes again from the flow
  document the record kept and the record's own events and steps. Nothing a run is judged by changes: no hash
  moves, and no data is made again. How to check it: `test/told.test.ts` (the telling, the digest, since, the feed,
  the history and its check; Larkspur's March and its feed), `test/audit.test.ts` (a bag's history held, and six
  ways it fails), and `npm run regress -- versions` on Larkspur (the owner told what moved once the security lead
  agreed, the digest, the history's page by a button and by a link); `integrity` exports a bag with the history.

- **Slice 10, the demo:** Larkspur's tour has a seventh scene. On Thu Mar 28 the catalogue lists a fifteenth
  control (`LARKSPUR_TOUR`'s `sbom`), which stops at the gate; the story declares it at 09:10 with the board's
  reason, the security lead agrees at 09:15, the day runs again under it and is published restated at 09:25. Its own
  step cuts coverage by 8.3 points (99.1 to 90.8) and leaves the score; `effective` is at a new level from that
  day. A third story is kept as more to see, a rule said ahead: the WAF's band, recorded Fri Mar 22 for Mon Mar 25,
  coming on the three days between (Sat Mar 23's head says so), in the tour's story and in Evidence feeds' own. The
  story writes down what was going on in the tour's world: the department dissolved (Fri Feb 16) and the log
  pipelines' migration (Tue Mar 5). The mappings file grows with the catalogue and is noted by its learned check
  for two days. A day whose lead is a declared change's own step says *as declared* on the status line. Found on
  the way: a story's change to a read flow's file left the catalogue's flows unaddable (built on the folder's flow,
  not the page's); the build now reads the catalogue with the story's changes. How to
  check it: `test/larkspur.test.ts` (the tour's block), `npm run test:tour` (the answer key: 13 tests),
  `test/carry.test.ts` (the two stories), `test/scenes.test.ts`, and `npm run regress -- tour overview` (the scene
  by its link, the dataset as declared, the trend's cut, the register; the tour's set makes 19 runs, 1,324 of 1,330
  engine seconds).

ADR 0027 is done. What it leaves is in its §"As built" under each slice; the audit holds neither a run's rules nor
its context tables to the flow as kept (Q-313, Q-324): both need the moment a run's rules were known at, which a
run's entry doesn't keep, and keeping it wants its own decision.

Slice 6 left the app measuring no step of a change made in it (Q-311), and a first day held by its own
change's step waiting for a person. Found on the way, and left: the brief of a day a restatement published (Larkspur's
Wed 27, on the dataset the views follow) still says its outputs wait, since the run on screen is the restated run,
which the browser's engine holds; the day's head and the month say it was published. And the offline audit doesn't
hold a bag whose run was held at a check step that reads several watched files: the run names the step's hold once a
load it reads (ADR 0010 §7), and `checksHolds` in `src/core/audit.ts` counts it once (*the checks it says held it
aren't what its manifest's counts hold*). To see it: on Larkspur's planted month open Thu Mar 28, export for audit,
`node scripts/audit.mjs check` the bag. Mon 18 and Thu 21 are such days too; the integrity stops audit others. With
`--history`, the audit also can't tell a page's claims again on a recorded month: the tail, the days left out and
the levels they name are the build's entries, which the bag doesn't carry.

**Built: [ADR 0026](adr/0026-flows-in-flows.md), flows in flows** (2026-11-17, the maintainer's answers Q-231 to
Q-245: every slice of its §12, and both steps of slice 5). The maintainer asked for flows that are parts of other flows: build one, read it from many, stack them, change
a bronze flow once and have it reach everything built on it; a card for each flow on its reader's canvas with the day's
pass or fail, opened to see its own flow; a way to explore what a flow gives; all of it rolled up into the month. The
research is [research/flows-in-flows.md](research/flows-in-flows.md): what Alteryx, Palantir, Dataiku, KNIME, dbt, Dagster
and the design tools do, how they roll a status up, how they hash, and what none of them does. The design was settled
in the question prompt, nine questions in three rounds. In the slices of ADR 0026 §12:

1. **The core, and Larkspur cut into five: built** (ADR 0026 §"As built"). A flow lists the flows it reads
   (`flows` in `flow.json`); reading brings them in (`src/core/compose.ts`); the plan stays flat, so every hold, every
   check and the recorder run a composed flow as they run any other. A flow is known by its own flow hash, every run
   names the flows it read, and verify holds the run's document to each one's own. Larkspur is HR organisation,
   Inventory, Evidence feeds, Applications and the posture product, with the same 92 plan nodes and the same answer
   keys (its six months and March through the engine, the tour's two months at the demo's scale).
2. **The canvas in levels: built.** Each flow a flow reads is one card on its canvas, a second sheet behind it, saying
   what its day came to by the month's marks and its extent (*access_rev… · 1 of 13*), never a score; a tap opens its
   sheet (what holds it, what it reads, what it gives and who reads it); **Open the flow ›** or a double-click shows
   its own canvas, with a line at the top that says where you are and goes back; each level has a link
   (`#day/2024-03-27/in/feeds`). `tools/browser/stops/levels.json` walks it on the tour at every size.
3. **The month in tiers: built.** Above the files and steps, a row a flow, its bar for a day the worst any of its files
   or steps said; a row opens to its files and steps. A flow that held only where a flow under it broke *followed*, and
   one whose outputs another flow's hold kept back *waited* (a dashed outline): both are folded with the calm ones.
   What waits for a decision names the flow. A flow has a month of its own (`#month/2024-03/in/feeds`): its calendar,
   its counts and its rows, by what it and the flows it reads came to. `tools/browser/stops/tiers.json`.
4. **Exploring what a flow gives: built.** An **Explore** tab on every file and published dataset: what a row is, in
   a sentence from the ontology; a card a column over every row; a bar tapped lit in every other column, kept
   (**Keep only**) and written as one of the reader's own cells; how it joins (its scope's list counted over the keys
   in scope, the datasets of its type, the ontology's links), with the match day by day; its rows against another
   day's by key. A flow's sheet has **Explore ›** on each dataset it gives. `src/core/explore.ts`,
   `test/explore.test.ts`, `tools/browser/stops/explore.json`.
5. **A paused day decided once, at its flow: built, in two steps.** A hold is the flow's whose file or step
   holds, and so is its decision: each decision by load says its flow, a load held only because one it is built from
   holds carries that one's decision, and the sheet, the Decide buttons, the day's story, the month, the record and the
   audit say whose it is (`src/core/deciding.ts`). The second step (built last, once the maintainer had chosen the
   page, Q-245): Evidence feeds, a flow the estate reads, is a page of its own on the tour's files
   (`examples/larkspur/feeds/data.json` and `tour.json`; the site's `/feeds/`). The two pages are one origin's and keep
   a record each in one store, so a held day decided on either is carried to the other: found after the day's run by
   the file's load and the flow's hash, recorded there by whoever made it, citing the entry it carried with a proof of
   it that the offline audit checks, and applied with nobody asked; a decision changed on one page is carried in turn.
   One made under other rules (the flow edited on one page) isn't carried, and the sheet says so
   (`src/core/carry.ts`, `test/carry.test.ts`, `test/record-others.test.ts`, `tools/browser/stops/carry.json`, on both
   apps served from one origin).
6. **A change followed, said and tested: built** (after slice 7). A change is the flow's whose file or step it is
   about, and is made in that flow's own document too, so its hash moves with it and with the flows it reads, and no
   other (`src/core/attribute.ts`); the build and the recorder put a story's changes where they belong. A flow's card
   says `CHANGED`, and its sheet says what changed, who made it and why, and which flows follow. **Test on the days
   before it ›** runs the last 14 recorded days again under the change as what-if runs and says how many would have
   paused. A flow may pin the hash of a flow it reads; reading refuses any other. The offline audit checks the flows
   each run names. `src/core/follow.ts`, `test/follow.test.ts`, `tools/browser/stops/follow.json`.
7. **The ontology's overrides: built** (before slice 6, which needs a read flow's own ontology). The estate's ontology
   is a document of its own (`examples/larkspur/ontology.json`, `{ "smaltflOntology": 2, … }`): every flow imports it
   and takes what is about its datasets, and it travels under its own hash (`estate/0`), which each flow's document
   keeps. A flow handles a column of its own datasets its own way by saying so, with its reason
   (`"override": { "reason": … }`); saying a shared column again without the mark is refused. The Ontology page says
   where its ontology comes from, lists every column a flow handles its own way, and notes it on each card of the
   column; the names form asks for the reason on a column the estate describes. `src/core/shared.ts`,
   `test/estate-ontology.test.ts`, `tools/browser/stops/overrides.json`.
8. **Inputs and settings: built** (last). A flow declares open `inputs`, each with the columns it needs, and
   `settings`, each with a default; a flow uses it under a name, `{ path, as, inputs, settings }`, mapping one of its
   own datasets onto each input. The used flow's notebooks are read under that name: its steps named after the use,
   each input a step that reads the needed columns of the mapped dataset, each setting the use's value. Each use is a
   flow of the document, named and hashed apart, and a change to the flow moves every use. In the app the catalogue's
   **Use it ›** asks for the datasets, the settings and a name; Larkspur's catalogue has *Control by unit*. A use
   changes its inputs and settings, nothing else: its checks and steps stay as written. `src/core/reuse.ts`,
   `test/reuse.test.ts`, `tools/browser/stops/use.json`.
9. **Building in the app: built** (before slice 8). A flow's folder may hold a `catalogue/` of flows made already,
   which the build ships as they read (`examples/larkspur/catalogue/`: Ownership and Certificates). **Add a flow ›**
   above the canvas lists them; adding one puts its card on the canvas, runs the day with it, and its datasets can be
   explored. On a dataset's **How it joins**, a **join form** writes a join as a cell of `joins.nb.ts`, a notebook of
   the flow's own; the step is derived from the cell by the notebook parser, which the page loads when someone first
   builds (`derive.js`). Both are recorded in words, kept in the browser, and taken back one at a time or all at
   once; one whose own step stops its first run is taken back at once, and the record keeps both. A catalogue's flow
   is held to the rules of what it reads (Certificates carries `filled_from`, since the TLS feed can be filled), and
   Larkspur's two are run on days of the estate through the engine. `src/core/catalogue.ts`, `src/core/joincell.ts`,
   `test/catalogue.test.ts`, `test/joincell.test.ts`, `tools/browser/stops/build.json` on the tour, `alone.json` on
   the control estate.
10. **The voice: built** (with slice 9). Three playful lines, in one place with their plain words and where each is
    said (`src/core/voice.ts`): *Worth its smalt.* under a gold seal on a run with nothing held, and once after a
    flow added from the catalogue went out as usual on its first day; *Nothing upstream yet.* in an empty catalogue.
    Nothing playful on a paused day, a refused file, a decision, a hash or the audit, and the tests read every string
    of the page and the sample flows against what the wordplay never says. **Plain words**, in About this flow or
    `?plain`, leaves them out. `test/voice.test.ts`, `tools/browser/stops/voice.json`.

The choices the maintainer's answers left open were built as proposed, then asked through the question prompt and
confirmed as built on 2026-11-17 (Q-240 to Q-244 in docs/OPEN_QUESTIONS.md): testing a changed flow on the days
recorded *informs* and holds nothing back (§7); an override is written in the flow that makes it, marked with its
reason (§8); two flows that hold on one day are one choice, recorded as a decision a flow (§6); a use's datasets are
named after it and it is known by its own document's hash (§11); a flow or a join whose own step stops its first run
is taken back at once (§10). The one that was open was answered in the same rounds and built: a decision is carried
between a read flow's own page and its reader's (Q-245). What ADR 0026 leaves is in its §"Not built" and under each
slice: first, a flow run on its own and read by another, to which the page of slice 5's second step is the bridge.

**Found while auditing fills, and left** (ADR 0026, slice 5's second step, "What it leaves"): the offline audit fails
a bag in which a fill was withdrawn on a day whose holds kept back only some of the outputs. `shownBefore` in
`src/core/audit.ts` reads what a name showed from the days that published whole; a held run publishes what its holds
don't reach, so the audit expects an older version of those names than the engine, rightly, leaves. To see it: on the
tour, decide Wed Mar 27 with a fill, change the decision to *Keep*, export for audit. The fix belongs with a stop
that audits a withdrawal. (A fill's own release failed the audit on such a day too, and that is fixed.)

**Found while bringing the stop sets into the regression in minutes, and left** (ADR 0025's amendment of 2026-11-17):
a fill can't be withdrawn in an engine that has run no other day. A page opened on a held day's own link
(`#day/2024-03-27`) runs that day first; fill it, then change the decision to *Keep*, and the engine refuses: *nothing
was published for access_reviews_checked before release 1: there is no version to go back to*. The decision is
recorded and the page says the refusal; the filled version stays out in that engine. It is the plugin's
(`src/plugin/release.ts`: a withdrawal puts back the version a name showed before), it is older than flows in flows,
and no stop met it while every set opened on the first day. Opened from the month, where the first day runs, the same
withdrawal goes back to that day (`carry.json`'s last stops). The fix is the engine's to make: a name with nothing
before it shows nothing again.

**For the maintainers to confirm: [ADR 0025](adr/0025-the-browser-regression-in-minutes.md), the browser regression
in minutes** (2026-11-16, Q-226 to Q-230). The maintainer, after a regression of 26 minutes, asked for it in minutes
and for a way to keep it there. Measured first: 22 sets, 246 stops, replayed at five sizes; a third of the time was the
tool waiting (250 ms of stillness after every step, screenshots nobody looked at, the app opened again for the dark
scheme), the rest the engine's 166 runs, done once a size. Built as proposed:

- **`npm run regress`**: the demos built, every set run, one table. Five minutes on four cores for the 22 sets it was
  built on, where it took 26 to 37; seven and a half with ADR 0026's eleven (below). One set while working is seconds
  to a minute.
- **The tour asks the page when it is at rest** (`window.__smaltflBusy`, and a count of what the page started), and
  never waits a fixed time.
- **Each set is replayed once**, on a phone, and its page taken to the other four sizes by resizing it, the layout
  checked at each. CI replays every set at every size, a size a job (`.github/workflows/ci.yml`, `demos` and
  `browser`).
- **The budget** (`tools/browser/sets.json`): the runs each set may make, counted and held; a new stop that opens a
  day is paid for. CLAUDE.md's rule says how a stop is added.
- **Not two minutes.** What is left is the engine: Larkspur's 76 days are 3.2 minutes by themselves on four cores.
  Q-229 lists the ways under it; the first is the build computing every day's claims ahead, as it does the first
  day's.
- **Found on the way** (Q-230): with the engine in the page (`?engine=page`), the second day opened is paused where
  the worker publishes it.
- **Amended on 2026-11-17, with ADR 0026's eleven sets** (its §"Amended"; Q-246, which the maintainer decided): 33
  sets on five demos, 395 stops, 215 runs of the engine, **7 min 35 s** on four cores. The budget is raised from 840
  engine seconds to 1,330 (1,292 used), which only the maintainers do, and the maintainer agreed it; holding 840 would
  have left eight Larkspur runs for the eleven sets. What bringing them in found: a set never did open on its first stop's day (the tour read `day`
  where the data's list says `slot`), which it does now, a run fewer in eleven of the 22 sets; a level entered on a
  refused day fetched the file again, fixed; a fill can't be withdrawn in an engine that has run no other day, left
  (above). A set that goes to another demo of the site says its runs there (`"with"`), and no set leaves a day and
  comes back to it.

**For the maintainers to confirm: [ADR 0024](adr/0024-the-month-at-a-glance.md), the month at a glance** (2026-11-16,
Q-219 to Q-225). The maintainer looked at the tour's month and asked for research into how such a screen is best done,
and a solution: page through the months; the panel for a day didn't say what went on that day; the symbols were
confusing; the score and why it moves weren't explained; the files and steps, opened, were overwhelming. The research
is [research/ui-month-overview.md](research/ui-month-overview.md), in five threads (how tools show the health of many
things over many days, the design literature, status symbols, explaining a score, paging and the panel for a day).
Built as proposed:

- **The month's order**: what waits for a decision, in any month, above everything; the months side by side; the month
  in a sentence beside the month before, with its counts; the calendar and the day picked; what needed a look; each file
  and step as a row of the month's days; the product's score. The scene list is behind a bar, closed at first (Q-221).
- **One month on screen**, with ‹ › and a link of its own (`#month/2024-03`), opening on the latest month with a day
  known and on its first day still waiting (Q-220). The arrow keys move through the days.
- **Five marks, and words** (Q-219): ✓ normal, ⚠ unusual, ‖ paused, ☑ decided, ☒ not published. How a decided day went
  out is a word. Colour is for the day that waits.
- **A day told in order**, from the record: what held it, what it held back, what happened (the files arriving, each
  file sent again with the sender's reason, each decision with who, how long after and why), and the score that day.
- **Rows of days in place of the grid** (Q-222, Q-223): the worst first, the clean folded; a day's bar the worst its
  runs said; a step that only followed a file told apart from a step with trouble of its own.
- **The score said** (Q-224): the number and what it is a share of, steady or not by a rule, what it is in a sentence,
  what moved it. The recorder adds each published day's checks and the applications failing each control, so every
  demo's data is made again.
- **A day reads the same once it has run here** (Q-225): ADR 0023's second point left, below, is closed by it.

`tools/browser/stops/overview.json` walks it on the tour. Not built, in its §"Not built": a link to the day picked, a
year at a time, a usual range for the score, the score split by rate and by mix, days of one cause merged into one
incident.

**Built: [ADR 0023](adr/0023-the-demo-as-a-tour.md), the demo as a tour of what a flow can do** (2026-11-15, Q-209 to
Q-211). The maintainer asked for the demo to be thought through again from what a visitor should see. Six scenes on a
tour month of Larkspur, each showing one capability:
- a normal day;
- a warning, and the reactions to it;
- a hard rule's hold, backfilled by the file sent again;
- a statistical anomaly that was real: published as is, paused again, then the new level accepted;
- one that was an issue: filled forward, then the corrected file replacing the fill;
- fills backward and from a specific day, and one file of a day replaced.

The month screen lists the scenes. Today's month stays the tests'. The slices of its §6, one PR each:
1. the ADR;
2. fills in Larkspur's flow, and a correction replacing a fill: **built** (2026-11-15, ADR 0023 §"As built"). A day
   is filled whole where its rows are wrong or its file came empty, a fill step on a file with no time of day names
   none, Larkspur's twelve evidence feeds have fill cells with `filled_from` carried to gold, the decision sheet fills
   the one held source, and the recorder records a story's fill: Wed Mar 6 is filled from Tue 5, then replaced by
   Wednesday's own export;
3. Q-86, keep pausing until accepted: **built** (2026-11-15, ADR 0023 §"As built"). Every day of a lasting change at
   its new level holds until someone accepts it; the app accepts the held file's level on any day of it;
4. the tour month: **built** (2026-11-16, ADR 0023 §"As built"). A scene a day of Larkspur's March
   (`scripts/data/larkspur.mjs --tour`, `examples/larkspur/tour.json`), built with `npm run build:app -- --variant tour`
   and deployed at `/tour/` until slice 5; its answer key at the demo's scale (`npm run test:tour`, a CI job of its own);
5. the scene list in the app, its stops at every size, and the demo guide rewritten as the tour: **built** (2026-11-16,
   ADR 0023 §"As built"). The month lists *What this demo shows* from the data list's `scenes.json`, each look a link
   (`#scene/N/K`) opening its day, version and card's tab or decision; the tour is at `/app/`, Larkspur's planted month
   at `/larkspur/`, and `docs/guide/demo.md` walks the tour (`docs/guide/larkspur.md` the planted month). ADR 0023 is
   done. Two points left for the maintainers, said in the slice's PR:
   - the tour's days between scenes publish, but 13 carried a learned check's note, marked unusual on the month, where
     §1 wanted them calm. The maintainer allowed two months or more (Q-212). Amendment 1 is built (2026-11-16, ADR 0023
     §"Amendment 1"): the tour's world is steady (`LarkspurOptions.steady`: no due dates gathered on the quarter's
     dates, findings through the weeks to the next Patch Tuesday, posts changing hands evenly with someone acting from
     the first day, new applications hosted as the rest, EDR versions kept), the scenes run over February and March, a
     week or so apart, with a calendar a month on the month screen, and the classifier leaves out what an accepted level
     moved. Five of the 48 calm days carry a note, the judges' own false alarms; Presidents' Day (Mon Feb 19) has no
     day like it in the history, so its files are *not judged yet*;
   - the month marks a day from the record by every watched dataset's claim, but a day run in the browser by the
     dataset the views follow alone (`calendarDayOf` in `src/app/main.ts`, `stateOfRun` in `src/core/month.ts`), so a
     calm day with a file's note (the tour's Tue Feb 6, say) shows ✓ once run where the record says that file was
     unusual. *Closed, 2026-11-16 (ADR 0024 §9, Q-225):* a day run here reads as its record does.

**Built: [ADR 0022](adr/0022-the-answers-of-2026-11-14.md), the maintainer's answers of 2026-11-14:** its last slice,
proposed declarations (Q-139), is built (2026-11-16); sharing as one package file (Q-35) comes later. With ADR 0021
built, the maintainer went through every open question in the question prompt: most were confirmed as built, 34 closed
as decided as built, and the answers that change what is built or add to it are ADR 0022's, built in the slices of its
§6, one PR each:

1. **Time follow-ups.** Built in two parts (2026-11-14, ADR 0022 §"As built"). The first part:
   - a what-if made the day's in one tap, the tap the decision (Q-202): *Make this the day's ›* on the what-if's line
     asks for a reason on the same screen. Other files go in as a later delivery decided as is, a version of the day
     of its own. Other rules are taken for that day only (a change set with `until` and the `useVersion` edit) and the
     day is restated under them;
   - a restatement that changes no day waits for a sign-off with a reason (Q-199), in the page and by the story's
     restatement in the recorder;
   - the offline audit checks restated runs and restatements (`restatedProblems` in `src/core/audit.ts`);
   - a day restated as not published is no longer learned from (`restatedHeld` in `src/core/hold.ts`).

   The second part: readers stay on the latest day (Q-51). Each day keeps its own version (`_smaltfl_days`), and a run,
   a correction or a decision about an earlier day moves no name back. Publish as is, a fill and Accept stay offered
   for it, and the receipts say "readers stay on Sun 31".

2. **Columns that change** (Q-109, Q-146). The design went to the maintainer first (Q-203 to Q-206), and the
   maintainer said to continue: each is built as recommended, for the maintainers to confirm. The first part is built
   (2026-11-15, ADR 0022 §"As built"):
   - the plugin reads each pinned CSV file's header before reading it. A column gone, or a new one read as a gone one,
     holds the day in any flow with a publish block, saying what changed; a new column alone is noted (Q-109, Q-204);
   - a new column is read as a gone one where their names are close, their types agree and most of today's values were
     in the gone column's history (Q-203). The day's head says so, and Read X as Y, with a reason, writes it in the
     ontology as the file's own from that day on (`mapColumn`, a property's `fromFile`), runs the day again under it
     and restates it (Q-206);
   - the sign-ins plant both: Thu Mar 7 adds client_app, and Fri Mar 22 calls result results
     (`tools/browser/stops/columns.json`).

   The second part is built too (2026-11-15):
   - where a column is used, followed by its name through the steps, SQL read from smaltql's parse
     (`src/core/uses.ts`; the page loads the parser as its own bundle when asked);
   - a held join column says each join, what is built from it and how many of today's values still match. Its mapping
     asks once more, naming every output (Q-205; the control estate's Mon Mar 18, `tools/browser/stops/joins.json`);
   - a mapping is declared only where the day's file has the name, so a later file back on the column's own name is
     read as declared;
   - the owner's rename form says where the column is used, joins first, and carries the change to the datasets that
     pass the column on (Q-146).

3. **The ontology as the one place for rules.** The first part is built (2026-11-15, ADR 0022 §"As built"):
   - loose ids are said per check, a rows entry's or a gate cell's scope's `ids` (Q-176), so Larkspur's plan says the
     same;
   - a published table nothing watches reconciles by the key its rows entry gives where its gate cell writes none
     (Q-118); Larkspur's `dim_org`, `dim_control` and `app_scorecard` take theirs from it;
   - `ontology.needs` writes a dependency once, with the datasets it applies to; a gate cell adds one or overrides one
     about the same columns (Q-119). The estate's and Larkspur's rule is the ontology's.

   The second part is built too (2026-11-15):
   - drawings name a coded value by the ontology's label, even where it only repeats the value (Q-145);
   - "Made by the flow" on the Ontology page: a read-only section a dataset a gate judges with rules, laid out as a
     file's, and "Read by" under each file (Q-144);
   - a rule set by hand says where it is written: the ontology or the notebook.

   **Next is slice 4.** On 2026-11-15, before it, the taxi example was retired to focus on the generated demos (Q-208,
   ADR 0022's addendum).
4. **Pausing.** The first part is built (2026-11-15, ADR 0022 §"As built"):
   - an overwhelming learned finding pauses the day (Q-132): in a flow with gates, a learned alert that moved at least
     a quarter of the day's rows holds it though its check only warns, never the forest's or the classifier's. The
     threshold is a parameter of the flow and of a dataset in the ontology (Q-207). A value respelled (case, spaces)
     moves no rows. The brief proposes keeping the last good day, the finding named;
   - Larkspur's DR exercises' file newly holds Sun 24 to Tue 26, waiting for the visitor; the estate holds the days it
     held.

   The second part is built (2026-11-16, ADR 0022 §"As built"): levels and fills for slots of a day (Q-84).
   - A slot's load gets Accept the new level. Its level starts at the slot and holds for every slot after it: in a
     slot's own series, that day for the slots after it in the day, the next day for those before (`levelDay`).
   - A quarter-hour gap is named by the whole hours that hold it, and a gap over every part of a slot is filled whole.
   - The audit tells a slot's claim from its own series again, as the page does (`claimRanges`).
   - No demo watches a slot, so no stop changes.

   Keep pausing until accepted (Q-86) is built, in ADR 0023 slice 3. Slice 4 is done.
5. **Proposed declarations** (Q-139). The design went to the maintainer in the question prompt (Q-213 to Q-216), and it
   is built as answered (2026-11-16, ADR 0022 §"As built"):
   - under each file on the Ontology page and on its Quality tab, *Proposed from the data*: a coded column's values,
     each common value's band (its usual share over 28 days, five points either side) and a likely key, each saying
     what it rests on and what accepting it does (`src/core/proposals.ts`);
   - the owner accepts one with a reason, a dated change set like any rule edit (the next day to arrive by default), or
     sets it aside in this browser (Not now). A key makes the file an object type's rows (a rows entry), so a day that
     repeats one holds; a values list is counted from the next history built;
   - a file nothing watches is offered nothing. Larkspur declares every file's key, so its files are offered values
     and bands; the estate bands and the recovery points; the sign-ins values (`tools/browser/stops/proposals.json`).

   Sharing as one package file (Q-35) comes later. ADR 0022 is done.

Slice 4's Q-132 design was answered on 2026-11-15 (Q-207). Still open: Q-34 and Q-41 (smaltdb's work, with stenhoor
first). Q-75 and Q-133 closed with the taxi example.

**Left by the taxi example's retirement (Q-208), each a small PR of its own:**
- the views no demo reaches: done (2026-11-16, Q-217, Q-218, ADR 0022's addendum). The weather views are removed (the
  card, a day's weather by the hour, the news's weather notes, the history's weather). The check against a published
  data list stays, unused while a demo has no data branch. The episode chips are removed. *About this flow* now gives
  the flow's own description, where it kept the taxi's on every demo;
- the browser integrity suite: done (2026-11-16, ADR 0022's addendum). It is now a stop set on Larkspur
  (`tools/browser/stops/integrity.json`): the seals, the Integrity tab, Re-derive, the record, the audit bag held by
  the offline audit, and a tampered day. Porting it found three things the taxi's single file had hidden, each fixed:
  - a run's record entry dropped the claims the engine told for the watched steps, so the offline audit refused every
    bag of Larkspur;
  - re-deriving a run of another day pinned only one of its twenty files again;
  - a refused file of any source but the loads' own was laid at the judged step's door: the wrong card, no broken seal,
    and nothing said on the file's own Quality tab.

  Not fixed, a flow matter: Larkspur's `app_platforms` (ADR 0020 §3) reads `platform_links`, and nothing reads it or
  publishes it, so no run reads that file and its card has no seal.

**Built: [ADR 0021](adr/0021-time.md), time** (accepted 2026-11-13, Q-181 to Q-192): two screens, a month to pick a
day from (a calendar, a grid of files and steps by day, the posture's trend, *for the day* and *as known on*) and the
day itself (its flow, lifecycle, story and versions); March as recorded history; every version of a day kept like a
commit, corrections decided, compared by summary and by rows; the ontology effective-dated and hashed to each run;
what-if runs. Built in the slices of its §9, the two screens and the recorded runs first. A first day near 1 s waits
(Q-180). Slice 1 is built (2026-11-13, its §"As built"): the build records each generated month (`month.json`,
`scripts/data/record.mjs`), the app opens on the month (`#month`) and gives each day its own screen (`#day/…`), and a
day opened is run here and checked against its record. Next is slice 2, the recorded story: deliveries (late and
corrected files, a day corrected twice), Larkspur's `story.json`, and a day's versions. Found before it and fixed first
(Q-193, ADR 0010 §16): on a flow that watches several datasets (Larkspur, the control estate), Publish as is was refused
by the engine, because the app recorded one decision for the day and released without citing loads. One choice for the
day is now recorded as a decision for each held file and one release citing them all (`tools/browser/stops/decide.json`).
Mon 4 in the story is kept back, then corrected (Q-194). Slice 2's first part is built (ADR 0021 §"As built"): a later
delivery of a day waits for a decision (the correction hold), and Replace the file is one. Its second part is built
(2026-11-13): what we went with feeds the history; Larkspur's recorded story (`examples/larkspur/story.json`: six files
sent again, thirteen decisions, Thu 21 corrected twice, Q-195); the month marks corrected days ↻ with their versions;
a day opens on the version readers got, its versions listed like commits, any other a tap away
(`#day/2024-03-18/v1`). Slice 3, flip and compare, is built (2026-11-13): **Compare** on a day's version gives the
summary from the two runs' manifests (files, rules, decisions, each output's rows and whether it changed), then an
output's rows by its key (removed, added, repeats, cells changed); and the month's grid filters. Slice 4's first part,
the rules over time with back-dating (Q-197), is built (2026-11-14): every rule edit is a dated change set (the next day
to arrive by default, the day on screen, or any day), runs name the rules in force on their day by `rules/1`'s hash,
and a back-dated change runs every recorded day it reaches again and restates them under one decision, any day
untickable, unchanged days noted (`tools/browser/stops/restate.json` on the sign-ins). Names and labels take effect at
once (Q-198); a restatement that changes no day is noted at once (Q-199); both are the maintainers' to confirm. Slice
4's second part is built (2026-11-14): Larkspur's story changes the rules twice (the WAF band at a tenth from Mon 18,
recorded Fri 15; the findings' values check back to hold the day from Fri 1, recorded Mon 25, Q-201), the build records
every run under its day's rules as known then and runs the 25 days the back-dated change reaches again, and the
security lead restates Sat 16 and Sun 17 (the scan that didn't log in) as not published, the other 23 noted the same.
A day published by a decision keeps it when restated where nothing new holds it (Q-200, the maintainers' to confirm).
The Ontology view lists the versions of the rules (four on Larkspur then; seven since ADR 0027's slice 5), marks the one on screen, now and as known on, and
compares any two (`tools/browser/stops/versions.json`). Slice 5, what-if runs, is built (2026-11-14): *What if… ›* on
a day runs it on any of its files under any version of the rules, marked as a what-if in its manifest and held so
nothing of it is published, never recorded, on screen until *Back to the day*, compared with what readers got, and says
what would make it the day's (Q-202, the maintainers' to confirm; `tools/browser/stops/whatif.json`). ADR 0021 is
done. Not yet: a what-if's own link; the offline audit of restated runs and restatements; a day restated as not
published is still learned from by the days after it;
a past day's correction while a later day is out (the engine never moves a name back), and *as known on* a past moment
showing the decisions and corrections recorded by then.

**Then (built): [ADR 0020](adr/0020-the-estate-as-a-company.md), the Larkspur estate** (accepted 2026-11-12, Q-169 to
Q-175). It is built in the slices of its §8: the generator, bronze, silver, gold, the answer key through the engine,
the product view, then the switch that makes it the demo. Slices 1 to 6 are built (its §"As built"): the app builds
on Larkspur (`npm run build:app -- --flow examples/larkspur/flow.json --out dist/app-larkspur`),
`tools/browser/stops/larkspur.json` walks §9's three days at every size, and Results opens on the posture dashboard
(`tools/browser/stops/posture.json`). Three answers were built as recommended for
the maintainers to confirm: an object type's loose ids (Q-176) and `publish.reach: 'downstream'` (Q-177) in slice 3,
and in slice 4 a steady change in gold left to the product view (Q-178: the remediation push isn't told by a day's
judge), and in slice 5 that the switch waits on a faster first day (Q-179: 11 s against a 5 s budget, the engine's
run of the flow 7.3 s of it). The first day's speed is built (ADR 0019 amendment 2: 4.5 s on a desktop, 4.8 s on a
phone, from about 10 s); a first day near 1 s is Q-180, open. Slice 7, the switch, is built (2026-11-13): the docs
deploy builds Larkspur at `/app/` and keeps the control estate at `/estate/`, and the site walks Larkspur
(`docs/guide/demo.md`; the estate's walk is `docs/guide/estate.md`). All seven slices are built. Next, found while
switching: a refused file's day doesn't say why it is paused (Thu 7 on both estates; ADR 0020 slice 7, "Not fixed
here"). Since ADR 0021's slice 1 the month and the day's story say it; the status line, the decision bar and the
file's Quality tab still don't. The items below follow.

Parked behind the notebook surface by the maintainer's decision of 2026-11-09 (Q-87, ADR 0011 §9). In priority order:

1. **The owner's answer of 2026-11-09 is built** (Q-86, ADR 0023 slice 3, 2026-11-15): a deliberate (lasting) change that
   nobody accepts keeps pausing until accepted (`quiet` in `news.ts`). The sign-in log's migration moves on purpose; the
   demos' answer keys don't.
2. **The rest of the round-3 findings.** The judges ranked 37; these are left. They were found on the taxi app, retired on
   2026-11-15 (Q-208): each stands where the same screen shows on a demo (the Results weather card went with it):
   - **Cards that state numbers:**
     - gone with the weather views (Q-217): the Results weather card's false findings and its °C line on the rain axis
       (#5, #24), and Jan 7's snow read as the cause (#8; its filled "Mark as expected" button still invites action);
     - the gate row invites "more bad rows than usual" and hides how close passing checks came (#11);
     - extra trips above usual are drawn in ghost grey (#13);
     - very wide bands aren't said (#25);
     - suggested checks are computed from a broken day (#26);
     - numbers disagree inside cards, and rounding varies (#29);
     - some charts have no scale (#30);
     - side figures pull the eye (#32).
   - **Calm days and keys:**
     - severity is shown by colour alone, and bands are faint in greyscale, deuteranopia and dark mode (#14);
     - "not run" days read as outages (#16);
     - calm days look flagged by hollow circles, "N notes" and a HEALTH label that comes and goes (#17, #18);
     - Flex Fare, Vendor 1 and output names aren't explained (#22);
     - ‖ ⚑ ☒ ✓ and later tiles have no keys (#31);
     - wording and 390-px layout are rough (#34, #35);
     - History fills in slowly (#36);
     - what the old view had is one tap away at most (#27).
   - **Partly done in round 3:**
     - the owner's "Held | Published" toggle and the About facts of a held run (#2, #4);
     - two words skipped for the word budget (#10, #15);
     - #12, #19 and #20 are partial;
     - the privacy commit (`e42d9ec`, #6, #7, #21) was made, but its report wasn't collected: check those three against it.
3. **Re-test.**
   - **What:** after the fixes, run a judge round (round 4) with the corrected answer key (see "How the views were
     tested"). It never ran on the last three commits.
   - **The controls example** (ADR 0013) hasn't had a two-minute round: its five planted days
     (`tools/judges/two-minute.md`, with the controls app) are the next answer key. Known rough edges to judge: the
     posture cell's amount line (400 apps against 400–400, a 10k scale) says nothing and should give way; the canvas
     places the inventory above the controls and the notebook boxes off screen on a phone (Fit brings them in); a
     control's News on a held day shows the engine's verdict over "Nothing out of the ordinary" from its own rows.
     Fixed on the maintainer's first look (2026-11-09): the strip's mark word spilt into the next day's cell (it now
     drops to its own line), and the day's headline led with the posture's symptom ("Patching blank") while the cause
     was the patching file upstream: a held load upstream of the judged dataset now leads the status line and the
     brief, and its card is drawn as the cause with the wrong mark.
   - **The sign-ins' pair.** Its shipped history predates the pair counts: rebuild the sign-ins app and check that
     Wed Mar 20, 2024 now names "result locked with method api_key" (ADR 0012's open point).
   - **Hour-fall days:** check them with fresh five-second readers. The new head ("Only Flex Fare after 13:00") and the
     parts chart replaced the trickle chart, and haven't been judged yet.
4. **Not built, by decision or left for later** (each recorded in its ADR):
   - the hours finding doesn't find surges, only shortfalls (ADR 0010 §8, §15);
   - slice 3 of the pause: re-run when a corrected file arrives, a corrected file replacing a fill on its own (Q-62,
     changed by Q-183: every correction waits for a decision), and a refused file as a pause (Q-109, now ADR 0022 slice 2);
   - holds measured in the engine rather than claimed by the page (ADR 0009, "left for later");
   - a durable engine, notifications, and decisions by more than one person;
   - Accept on slots shorter than a day (Q-84): built in ADR 0022 slice 4, second part (2026-11-16).
5. **Maintainers' open questions:** answered on 2026-11-14 (ADR 0022, docs/OPEN_QUESTIONS.md); still open: Q-34, Q-41,
   Q-75 and Q-133.

## The decisions, and where they are written

- **The owner's answers:** the owner (beepboopbop64) answered a series of questions on 2026-11-08 and 2026-11-09, through
  the question prompt. Each is in `docs/OPEN_QUESTIONS.md` in their words, with the ADR that builds it.
- **Where they changed the design:**
  - a published fill may be withdrawn (Q-61);
  - a day with nothing to compare against publishes, marked (Q-53);
  - new flows start with no calendar (Q-58);
  - the taxi example holds 25 days (Q-54);
  - deliberate changes pause until accepted (Q-57; Q-86, the strict reading, built in ADR 0023 slice 3).
- **Hashes and encodings** have ADRs and test vectors: plan/1 (ADR 0009 E10), plan/2 (ADR 0010 E13), measures/0,
  tail/0. A change to any of them needs a new tag version and an ADR (CLAUDE.md).

### The two-minute test, round 1 (2026-11-09)

Both readers got every day right from the screen alone (tools/judges/two-minute.md; the readers' reports in the session
of that day). What they could not tell, or found confusing, in the order it should be fixed:

1. "trips_valid dropped 10% of rows (limit 10%)" beside "Checks passed: 9.55% dropped": the brief rounded where the
   checks' line didn't (round 3, #29). **Fixed the same day:** the brief says the checks' figure.
2. "Flex Fare held to its usual count" under Cause read as blaming the part that survived. **Fixed:** on an hour-fall
   day with a kept part the fact is "Everything but Flex Fare stopped at 13:00; Flex Fare kept arriving (4.7k today,
   usually 2.8k–5.4k)", and the part gets no fact of its own; the trickle rate ("still ~330/h") stays on the chart.
3. The app proposed *Fill from Tue 1* on day 2 of Vendor 1's outage; the engineer wanted *Without Vendor 1*. **Fixed:**
   a sender that stopped, for the second day running, proposes the part that arrived first.
4. "Paused by trips" (what paused what?), and "Day 2 · ~65k short" beside "−25%" (short over the episode, the day's
   own change): the pause row's and the episode chip's words (ADR 0009 §12, ADR 0008 §6) need a reader who knows them.
5. Who "Flex Fare" is: the gloss is a tap on the head, which a screenshot can't show; the brief's fact could carry the
   ontology's meaning once.
6. The day picker shows no year; the week strip's "not run" days (the days this browser hasn't run) read as outages
   on a calm day (round 3, #16); "8 notes" on a calm day (#17).
7. The Amount health cell not flagged on a day 65% short (the hours are the cause; the amount follows): say so, or
   mark it.
8. The folded value changes ("Extras $2.50 0.01%, usual 12–13%") read as a second problem to both readers: they are
   the arithmetic of the cutoff, and the fold's head should say so.
9. What "marked" means for readers, and whether a decision runs on tapping Decide: a line in the fix's option.

## A correction worth knowing: hour-fall days

On Thu Sep 21, 2023 and Sat Sep 17, 2022 the trips by hour fall about 95% at 13:00 and 15:00. Three rounds of judges read
the chart as "the feed was cut off", which the answer key called a false fact.

The day files show the judges were mostly right:
- **Sep 21:** every trip but Flex Fare (payment type 0) stopped by 13:06; 37 others came in the rest of the day.
- **Sep 17, 2022:** none came after 15:00.
- **Flex Fare** kept arriving, about 150–390 an hour.

The counts are in [tools/judges/hour-fall-truth.md](../tools/judges/hour-fall-truth.md). The story now names the part
that kept arriving, and the answer key in `tools/judges/judge-round.workflow.js` is corrected.

## How the views were tested

The visual-first views were judged in rounds by agents reading phone-size screenshots of the built app on real days:
- **Five-second glances:** an on-call engineer and a newcomer.
- **Masked text:** state and shape read from the visuals alone.
- **Detail:** ten questions.
- **Reconstruction:** each episode told back.
- **False alarms:** the calm days.
- **Honesty:** numbers against the data.
- **Colour:** greyscale and deuteranopia.
- **Old versus new.**
- **The decision sheet.**
- **An adversarial explorer:** drives the app itself.

A grader merged the reports into a ranked fix list, and a fix workflow worked through it in clusters.

| Round (build) | Glance | Masked | Detail | False alarms | Fixes ranked |
|---|---|---|---|---|---|
| 1 (2026-11-08) | 21/26 | 24/24 | 10/10 | — | 32 |
| 2 (pause added) | 19/26 | 25/26 | 9/10 | 2/4 | 43 |
| 3 | 21/26 | state 26/26, shape 19/26 | 10/10 | 4/4 | 37 |
| Two-minute test 1 (ADR 0012 §7, build `00a29d6`): the brief in the input's News, four days, two readers (an on-call engineer, a newcomer), graded on the day and what happened, the number or time, the impact, a fix the app offers, nothing false | 40/40 | | | | 9 below |

In round 3, all five glance misses were hour-fall readings (corrected above) or Jan 7's snow read as the cause.

The tools are in [tools/](../tools/README.md):
- **Browser tools:** `tour.cjs` captures screens and checks expectations; there are the two suites and the stop sets.
- **Workflow scripts:** the judge round and the fix round, run with Claude Code's Workflow tool.

## Moving the repository

> **Done on 2026-11-09** (ADR 0011 §9): `beepboopbop64/smaltfl_fork`, a fork of `stenhoor/smaltfl`, has the code on
> `main` (a fast-forward to `5bdb1b4`: Steve's initial commit is the history's root) and the `data` branch at `0ca4dd1`.
> The pull request to `stenhoor/smaltfl` is opened from the fork. What follows is the account as it was written.

- **What has to move:**
  - **The code branch:** `claude/elegant-knuth-r8364a` has the full history.
  - **The data branch with its history:** runs and audit bags name the data commit they read, so the branch's commits
    must stay fetchable. `data.yml` now adds each build on top of the last, with no force push.
- **The workflow** needs `contents: write`. It runs on any push that touches `scripts/data/**` or the workflow itself.
  Add `[skip ci]` to a commit message to skip it.
- **Two older data commits** were dropped by force pushes before that change:
  - `b7da163` is the one runs and audit bags of 2026-11-06/07 name;
  - `f2c12f85` is older.

  GitHub may still serve them by hash. To keep `b7da163`, push a tag for it from a machine with push rights:
  `git push origin b7da16355b12bbbbd07d37de2de295ee60fed34a:refs/tags/data-b7da163`. A session's permission check
  blocked this.
- **ADR 0007** recorded a move to `stenhoor/smaltfl`. A push there failed with 403 because the Claude GitHub App wasn't
  installed on that repository. If the new home is different, amend ADR 0007.
- **Cloud sessions** can't reach the TLC or Open-Meteo hosts, so the data is only ever built by the workflow on a
  GitHub runner.
