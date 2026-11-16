# ADR 0023: The demo as a tour of what a flow can do

- **Status:** accepted, 2026-11-15. The maintainer asked for the demo to be thought through again from what a visitor
  should see, and approved the plan below ("Looks good"). Built in the slices of §6, all five (§"As built"); amendment
  1, a calmer tour over two months, built 2026-11-16.
- **Date:** 2026-11-15
- **Builds on:**
  - [ADR 0020](0020-the-estate-as-a-company.md): Larkspur, the demo at `/app/`.
  - [ADR 0021](0021-time.md): the month and the day, a day's versions, corrections decided (Q-62, Q-183).
  - [ADR 0022](0022-the-answers-of-2026-11-14.md): its slice 4, pausing. Q-132, an overwhelming learned finding, is built
    (its §"As built"); Q-86 is built here, as the tour's scene 4 needs it.
  - [ADR 0009](0009-paused-not-published.md), amendment 1: fills. Q-57: *Accept the new level*.

## Context

The maintainer, 2026-11-15:

> So I think as far as the demo goes, we need to take a serious think about what we're actually trying to show the
> user. So we'd like to show the user, everything going normally. We would like to show the user some warnings and how
> they could potentially react to that. We would like to show the user when something is flagged from the hard rules
> for a data set, and how that kind of could be backfilled by a data set after the fact. We would like to show the user
> how the rules could show, some statistical anomaly, one of the more machine learning checks, and how those could
> either be approved as, yes, they were unusual, but it was the right thing. It's actually what happened on that day.
> And then also, it was unusual, and yeah, we flagged something that was an issue, and maybe a couple days later
> someone gives us the corrected file and we fill that data in. And I think when we're filling the data in, we need to
> be able to showcase, feed forward, feed backwards, specific days, get certain files to update if that's possible. So
> those are the things we really need to be thinking about [...] I think we need to go back to the drawing board and
> kind of show what we can actually do in flows, if that makes sense.

What the demo is today:

- **Larkspur's March grew a planted day per slice of ADR 0020** (bronze, silver, gold), then the recorded story of ADR
  0021. It reads as a list of incidents: thirteen decisions, eleven days paused since Q-132.
- **It can't fill.** Larkspur's flow has no fill step, so no file is carried forward or back, or stood in from a like
  day. Only the sign-in log fills (forward, backward, replace).
- **No walk is in the app.** The way through it is written in the docs (`docs/guide/demo.md`), not in the app.
- **The control estate pauses every day from Sat 23 to Sun 31.** "Recovery time met: no" is a bad value, and a held day
  isn't learned from, so each later day is judged against the old level. That is Q-86's "keep pausing until accepted"
  with no one there to accept.

## Decision

### 1. What the demo shows: one capability a scene

| # | Scene | What happens | What the visitor sees and does |
|---|---|---|---|
| 1 | **A normal day** | Every file arrives and every check passes. | Nothing to decide; gold is published and sealed. |
| 2 | **A warning, and what to do about it** | A learned check warns (the scanner's upgrade writes its words in capitals). | The day is published, marked. The reactions: *Mark as expected* (the warning goes quiet), *Add a rule*, *Notify the owner*. |
| 3 | **A hard rule holds a file; the corrected file backfills it** | A written check holds a file (the MFA export arrives empty). Readers keep the last good day. | The vendor sends the file again; it is a new version of the day, decided and published, and readers move to it. |
| 4 | **A statistical anomaly that was real** | A learned check holds the day (Q-132): a planned migration moves a third of the applications to another platform. | The day is published as is, with the reason ("the migration happened"). The new level keeps pausing (Q-86) until *Accept the new level*; later days are judged at it. |
| 5 | **A statistical anomaly that was an issue; filled, then corrected** | A learned check holds the day: an export bug mislabels a third of a feed's rows. | The visitor fills it forward (the last good day carried forward, marked). Two days later the corrected file arrives, replaces the fill (Q-62, Q-183) and is published. |
| 6 | **Fills each way, and one file replaced** | Files missing or wrong on other days. | **Backward:** the next good day carried back. **A specific day:** the same weekday a week before stands in, marked as an estimate. **One file replaced:** of a day's twenty files, only the wrong one is sent again. |

Calm days come between the scenes, so the month reads as a story.

### 2. Larkspur, with a tour month

- **The vehicle is Larkspur**, the demo at `/app/`. The demo builds a *tour* month from Larkspur's generator: the scenes
  of §1 planted on their days, and calm days between.
- **Today's month stays the tests'.** It keeps every planted day and its answer key (ADR 0020 §5), run by
  `test/larkspur-flow.test.ts`, so nothing it tests moves.
- **The tour has its own answer key, a test vector**, and its own recorded story: the deliveries and the decisions of
  §1, with a scene or two left for the visitor to decide.
- **Two layering stories stay in the tour as "more to see":** the reorg's join that lost 95 applications, and one cause
  behind two controls. They show silver and gold, which the scenes don't.
- **The control estate and the sign-in log stay as they are.** The estate is ADR 0014's answer key; the sign-in log
  shows the models and its own fills.

### 3. The tour's month (proposed)

The days may move when the month is built, keeping a calm day or more between scenes. Of Larkspur's March:

| Day | Scene |
|---|---|
| Fri 1 | 1, a normal day |
| Mon 4, sent again overnight | 3, the MFA export empty, then corrected |
| Tue 5 | 2, the scanner's capitals |
| Tue 12 to Thu 14 | 4, the migration: published as is, paused again, then accepted |
| Mon 18 to Wed 20 | 5, the export bug: filled forward, then corrected |
| Thu 21 | 6, the TLS file's rows twice: only that file sent again |
| Sat 23 | 6, a weekly export empty: filled back from Mon 25 |
| Wed 27 | 6, a file missing: the same weekday a week before stands in |
| the rest | calm, or the two layering stories |

### 4. In the app: what the demo shows

The month screen lists the scenes, *What this demo shows*. Each scene opens its day and the place to look: the card, the
tab, the decision. The walk the docs describe today becomes the app's own; the docs' page follows it.

### 5. What the tour needs

- **Built:**
  - a normal day and its seal;
  - warnings, with *Mark as expected* and *Add a rule*;
  - written holds;
  - a file sent again, decided as a new version of its day;
  - publishing as is, and keeping the last good day;
  - *Accept the new level*;
  - a learned check holding the day (Q-132);
  - what-if runs and compare.
- **To build:**
  - **fills in Larkspur's flow**, on the files the tour fills, and a correction replacing a fill shown end to end;
  - **Q-86**: a lasting change keeps pausing until someone accepts it;
  - **the tour month:** the generator's preset, the recorded story, the answer key and its test;
  - **the scene list in the app**, the stops for each scene at every size, and the demo guide rewritten as the tour.

### 6. The slices, one PR each

1. This ADR.
2. Fills in Larkspur, and a correction replacing a fill.
3. Q-86, keep pausing until accepted, for any flow.
4. The tour month: the generator's preset, its story, its answer key and test, the app built on it.
5. The scene list in the app, its stops at every size, and `docs/guide/demo.md` rewritten as the tour.

ADR 0022's Q-84 (levels and fills for slots of a day) and slice 5 (Q-139, proposed declarations) come after the tour.

## As built

### Slice 2: fills in Larkspur, and a correction replacing a fill (2026-11-15)

- **A day filled whole.** A fill took only the part a short day was missing (its hours, a part that vanished). It now
  takes the whole day from another where the day's rows all came but are wrong, or where the file came empty (`Missing`
  gains `{ all: true }`; `missingFor`, `wholeDay` in `src/core/fill.ts`).
  - A fill step's `time` is optional: a file with no time of day (a daily snapshot) names none, its plan node's `time`
    is null, and it fills whole or by a part of a column, never by hours (`missingProblem`).
  - Never whole over a value the ontology marks bad (I8, C9).
  - The offer is marked `whole` and offers no part that arrived; the brief proposes keeping the last good day before a
    whole fill, since none of the day's own rows would go out (`fixOf`).
  - `emit.ts` writes the whole day as `1 = 1`; a derived run says "fills the whole day from …".
- **Larkspur's twelve evidence feeds have fill cells** (`bronze.nb.ts`, `fill(tls, {})`), and each feed's check reads its
  fill.
  - No column is shifted: a carried row keeps its dates, the evidence's own.
  - `filled_from` is carried row by row through `results`, `coverage`, `effective`, `remediation` and
    `platform_impact`, and rolled up by `max()` in `posture_wide`, `app_scorecard` and `org_posture`, so no gate's key
    gains a row (Q-65).
  - The five gold contracts the fills reach name it: `fact_control_status`, `app_scorecard`, `org_posture`,
    `remediation_queue` and `failing_by_unit` are at version 1.1.0.
  - The plan's hash moves. No held day of the answer key moves (`test/larkspur-flow.test.ts`).
- **The mark is never measured** (`measureTable`, `sampleTable`). It says where a row came from, not what it says: a
  watched step a fill reaches is judged by its rows alone, and no history or kept sample learns it.
- **A derived run tells its watched steps** (`tellStep` in `src/plugin/runtime.ts`). A fill on a flow that watches a step
  built from the filled file builds that step again from the filled rows, so the engine measures it and tells its claim,
  as a day's own run does, under the held run's flow hash, as the derived run's sources are judged (C4).
  - Its measures are kept with the derived run, and verify reads them from there (`storedMeasuredOf`).
  - The release checks that the derived run's *files* are judged as the held run's; a step's story is its own, and a
    step still held keeps back what it reaches.
  - A fill is about one load: each held load is decided by the same choice (Q-193), and the release cites the decision
    about the file it fills, which comes first. `test/fill-steps.test.ts`.
- **The sheet decides the held load** (`sheetSubject` in `src/app/main.ts`). On a flow watching several datasets, where
  one source holds the day and has a fill step, the decision sheet draws that source's history, story and rows and
  offers its fills.
  - Its donors are read from the day's other files in the data list (`listedFileOf`).
  - The donor's claim is told from that source's own base (`donorClaim2`).
  - Fills are for one source at a time (`holding`, `heldSources`).
  - Its recommendation is told by that file's story, not by the dataset the views follow.
  - After a reload, a recorded fill on such a flow is staged again and released citing the file's decision, never for a
    version a later delivery replaced (`applyDecided`).
  - The day's lifecycle says a fill readers had before a later version replaced it: "Decided: filled from Tue 5".
  - Stops: `month.json`'s Wed 6, and `decide.json` filling Sun 24 from Fri 22 in the sheet, still filled after a reload.
- **The recorder records a fill** (`StoryDecision.fill`; `fillOnce` in `scripts/data/record.ts`):
  - the version's files are pinned again, and the donor's file is pinned as its donor and judged by its own claim;
  - the derived run is staged and recorded, then one decision a held load carrying the repair, then the release;
  - what was pinned before is put back.
- **Larkspur's story fills Wed Mar 6 from Tue 5** (the backup file was Tuesday's again, the export job hadn't run).
  Wednesday's own export, sent overnight, replaces the fill once decided (Q-62, Q-183). `test/fill-whole.test.ts` runs
  the same in the engine on a snapshot: filled whole from the day before, released and verified, then replaced by the
  corrected file.

### Slice 3: Q-86, keep pausing until accepted (2026-11-15)

- **A lasting change keeps pausing until someone accepts it** (`quiet` in `src/core/news.ts`), the owner's answer of
  2026-11-09.
  - In the general form, a value that was a part of the mix (1% or more) is never lowered to a note on a day of its
    lasting change that it stands at three times its usual share or a third of it, on enough rows. It holds as something
    wrong every such day, not the first alone, with Accept the new level offered each day.
  - Once accepted, the ranges learn it from that day (a break), and nothing after it holds. A day published as is is
    learned from too, so the old level gives way as the days go out; a day kept back isn't, so a change nobody accepts
    or publishes keeps holding.
  - In a flow with gates, a learned check caps the alert at a warning, so the change warns every day until accepted,
    unless it moved a quarter of the day's rows (Q-132): then it holds every day, as the tour's scene 4 needs.
  - Smaller lasting changes, codes under 1% and the legacy form's are told as notes, as before.
- **What moves:** the sign-in log's migration to passkeys, unaccepted, holds every day from Sun Jun 9 to Sun Jul 14 (36
  days, passkey's share and then password's at their new levels) until the ranges have learned it; accepted on its first
  day, only that day holds, and accepted on Wed Jun 12, Sun 9 to Wed 12 (`test/security.test.ts`). Larkspur's and the
  control estate's held days don't move (`npm run test:slow`).
- **The app accepts the held file's level** (`acceptFor`, `sheetSubject`, `subjectFor` in `src/app/main.ts`). On a flow
  watching several datasets, where one file holds the day, the sheet decides that file whether or not it has a fill
  step, and Accept the new level reads that file's story and claim, on any day of the change. A card offers "The new
  level" only for the file the decision is about.
- `test/gates.test.ts`: a gated flow's lasting change that moves most of the rows holds every day of two weeks, not its
  first alone, and nothing after the day it is accepted.

### Slice 4: the tour month (2026-11-16)

- **The tour's days** (`LARKSPUR_TOUR_DAYS` and `LARKSPUR_TOUR` in `test/fixtures/larkspur.ts`;
  `scripts/data/larkspur.mjs --tour`). A scene a day, calm days between, two of the month's layering stories kept as
  more to see. The month of ADR 0020 stays the tests', its answer key unmoved.

  | Day | Scene | What arrives | What was decided (`examples/larkspur/tour.json`) |
  |---|---|---|---|
  | Mon 4 | 3, a written check holds a file | the MFA file empty: its amount holds it | kept back; sent again overnight, published |
  | Tue 5 | 2, a warning | the scanner's capitals: findings unusual | published, left for the visitor's reactions |
  | Wed 6 | 1, a normal day | every file as drawn | nothing to decide |
  | Fri 8 | more to see | a department dropped from the HR extract: silver's chain rules hold | sent again that morning, published |
  | Tue 12 | 4, an anomaly that was real | the log pipelines' migration: a third of the logging file moves off the data centres' pipeline | published as is |
  | Wed 13 | 4 | the new level holds again (Q-86) | the owner accepts it |
  | Thu 14 | 4 | judged at the new level | nothing to decide |
  | Mon 18 | 5, an anomaly that was an issue | the backup export writes a third of its completed jobs as partial | filled forward from Sun 17 |
  | Wed 20 | 5 | Monday's backup file sent again | published, replacing the fill |
  | Thu 21 | 6, one file replaced | the TLS file's rows twice: its key, silver's and gold's hold | that file alone sent again, published |
  | Sat 23 | 6, a fill backward | the EDR file empty | filled back from Sun 24 |
  | Mon 25 | more to see | a certificate authority behind TLS and logging | told and published |
  | Wed 27 | 6, the same weekday a week before | the access reviews' file empty | left for the visitor |

- **Two new kinds of trouble.** `migration`: from its day, the data centres' applications send their logs through
  their side's cloud pipeline, but for those whose logging failed or wasn't assessed that day, so the data centres'
  pipeline drops from two fifths of the rows to a twentieth. `mislabel`: an export bug writes one value for another on a
  share of a column's rows, the file sent again right. The log pipeline is labelled in Larkspur's ontology, so its
  shares (and its pairs with the status) are counted.
- **Choices made from §3's plan, as the month was built:**
  - Scene 1 is Wed 6, not Fri 1: Fri 1 tells more pentest findings than usual, a warning on the day meant to have none.
  - Scene 5's bug is on the backup file, not the encryption feed: carried from Sunday, the encryption file's statuses
    contradicted Monday's key rotation for 8 applications, which the posture's needs rule holds, as it should, so no
    fill of it could go.
  - Sat 23 is filled back from Sun 24, the next good day, decided Sunday morning once its file is in.
  - Wed 27 is left for the visitor to fill from the same weekday a week before; the warning's reactions on Tue 5 too.
  - The dropped department is the layering story kept (Fri 8, not the reorg), with the certificate authority (Mon 25).
- **What the recorder learned:**
  - A story's `accept` records the held file's new level as the page works it out (`levelOf`), and publishes the day.
    Larkspur's policies leave it to the owner.
  - A later delivery pins its day's other files again: a file sent again after another day ran was read beside that
    day's files (the backup file sent two days later met the next day's files).
- **An accepted level breaks its column's pairs too** (`levelOn` in `src/core/history.ts`). A level on a column's values
  broke every value and count of the column; the pairs the column is one of were still judged against the days before,
  so the migration's pair of status and pipeline warned the day after it was accepted.
- **The month marks a filled day filled** (`dayPause`, `recordedHeldLoads` in `src/app/main.ts`). A day the record holds
  by load reads its held loads' pauses as one, as a run here does: a fill's release cites its file's decision alone, so
  the steps' loads it decided too left Sat 23 drawn as paused, waiting.
- **Built as a variant of the data list** (`data.json` `variants.tour`; `npm run build:app -- --variant tour --out
  dist/app-tour`), its data made by `scripts/data/make.mjs`, which the build and the answer key share. The docs deploy
  publishes it at `/tour/`, unlinked, until slice 5 puts it at `/app/` with its scene list.
- **The answer key** (`test/larkspur-tour.test.ts`, `npm run test:tour` and a CI job of its own): the month made at the
  demo's own scale, as the build makes it, about twelve minutes, and each scene's day held by the check it shows,
  decided as its story says, every other day published. Not at the tests' scale: there the exceptions register has
  sixty rows, five approvals move it by a twentieth, and a held day isn't learned from, so it holds to the month's end;
  the demo's register never moves so.

### Slice 5: the scene list in the app (2026-11-16)

- **The scenes are data** (`src/core/scenes.ts`, `smaltfl-scenes/1`; `examples/larkspur/scenes.json`, named by the data
  list's variant as `scenes` and shipped in loads.json). A scene has its number (none for the stories kept as more to
  see, after the numbered ones), its title, what happened (`said`) and its places to look. A look is a day, the words of
  its link, and on the day a version of it, a card and its tab, or the day's decision. `scenesProblems` says what is
  wrong with a file, by scene and look, and, given the demo's days and the flow's cards, a day or card it doesn't have;
  the page takes a file with problems as none, and says why in the console.
- **The month lists them**, *What this demo shows*, above the calendar on the month as it is now (not as known on a
  moment): each scene numbered, its title, what happened and a link a look. On a phone the list is one column, from
  820 px two, and from 1180 px it runs the window's width in three.
- **A look's link is `#scene/N/K`** (`sceneHash`, `lookOf`: the scene's place in the list and the look's, from 1). It
  opens the day screen on the look's day and version, and once that day has run, the card on its tab (`openTab`; its
  Quality tab where it has one, else its News) or the day's decision as Decide › opens it (`pendingLook`, `applyLook`).
  A look naming neither is the day screen. A day already on screen in that version runs nothing; its look opens at once.
- **The tour's six scenes and the two stories kept**, fourteen looks (`test/scenes.test.ts` holds each to its day of
  `LARKSPUR_TOUR_DAYS` and each card to the flow; `tools/browser/stops/tour.json` opens each from its link, at every
  size).
- **The tour at `/app/`, and the planted month kept at `/larkspur/`.** The tour takes the demo's place, as §2 says. The
  planted month isn't dropped: it is ADR 0020's answer key, the posture read over a whole month, the rules changed
  twice and a back-dated change restating two days, which the tour doesn't show. It is deployed at `/larkspur/` with
  its own guide (`docs/guide/larkspur.md`, the walk that was the demo's), as the control estate is at `/estate/`, and its
  walks (`larkspur.json`, `month.json`, `decide.json`, `compare.json`, `posture.json`, `versions.json`, `whatif.json`)
  stay its regression rather than being rewritten for the tour (the Consequences below said rewritten); the tour's own
  are `tour.json`, a stop a look.
- **The docs' demo page is the tour's** (`docs/guide/demo.md`): the flow, then a section a scene in the app's order, the
  stories kept, and what the app shows on any day. The two-minute test takes its days from the scenes
  (`tools/judges/two-minute.md`).
- **Found while walking the scenes, and fixed:**
  - *An accepted level leaves the forest too* (`HistoryRanges.movedBy`, `dayFeatures`' day in `src/core/combos.ts`).
    Accepting a level broke every learned check of the metrics it moved, but the isolation forest still read them
    against the days before the level, so Thu 14, judged at the migration's new level, was still *a little unlike the
    days before* by the very shares accepted on Wed 13. From the level's day on, the forest leaves out the shares and
    pairs a level moved (`test/combos.test.ts`).
  - *A fill's receipt says its reason* (`receiptLines` in `src/core/decision.ts`), as every other decision's does:
    Sat 23's fill read as if no reason had been given.
  - *A band's words stay inside its drawing* (`bulletTrack` in `src/app/viz.ts`), clear of the 0 tick, where a band
    near zero ran off the left edge (Mon 4's scope, Tue 12's pair); a count of rows says its band in whole rows, as its
    sentence does (*usually 1*, not *usually 0.5–0.5*), and the sentence says a range whose ends round alike as one
    number (*a day like it has 1*, not *1–1*; `ruleCount` in `src/core/news.ts`).
  - Scene 2's reactions are worded as the card's **More** words them (*Mark as expected*, *Add a check*, *Tell the
    source*), and Mon 25's look opens **News**, where the certificate authority leads.

## Amendment 1 (2026-11-16): a calmer tour

- **The question.** Slice 5's month published every day between its scenes, but 13 of them carried a learned check's
  note, marked unusual on the calendar, where §1 wanted calm days between the scenes. The maintainer, 2026-11-16: *"if
  we need to extend the demo to take two or even [more] months so it's not as busy that's fine"* (Q-212).
- **Why it was busy.** Not the scenes: the world they were planted in. Larkspur's generator gathers due dates on the
  quarter's dates, as work does: half the pentests fall due on Mar 15, three in five DR exercises on Mar 22 and seven in
  ten access reviews on Mar 29, so each control's pass rate drops by a tenth the day after, for the rest of the month.
  And each month's scanner findings are found on Patch Tuesday together, so a month later the late ones fall due
  together and the vulnerability SLA's failing share jumps from about 3.5% to 9% overnight. The judges compare a day with
  the days before it, so each jump and drop reads as unusual. In the answer key's month these are look-alikes, which
  ADR 0020 §5 plants on purpose; in the tour they crowded out the scenes.
- **The tour's world is steady**, the first step (`LarkspurOptions.steady`, `scripts/data/larkspur.mjs --tour`): due
  dates don't gather on the quarter's dates (each application keeps its own anchor), and each month's scanner findings
  are found through the weeks after Patch Tuesday. Measured day by day from the generator, every control's pass rate
  and the SLA's failing share hold steady through February and March. The answer key's month keeps its rhythms.
- **What was left in the one month were the judges' own false alarms**, five days: the forest finding a day unlike any
  of the 180 before it on one of twenty files (a day in 180, on twenty files, is about three a month), a share a row or
  two off its band, and a business unit's share of the failures for two days. They are published and marked unusual,
  as on any long-running flow; quieting them would change the judges, not the demo, and is not done here. The answer key
  (`test/larkspur-tour.test.ts`) held the days between the scenes to at most five notes, none of them something wrong;
  the scenes' days, holds and decisions were as before.
- **Two months, built** (2026-11-16), the amendment's second step. The scenes spread over February and March
  (`LARKSPUR_TOUR_DAYS`, the loads from `LARKSPUR_TOUR_FROM`), a week or so between most of them: Wed Feb 7 the normal
  day; Fri Feb 16 the department dropped (more to see); Tue Feb 20 the scanner's capitals; Mon Feb 26 the empty MFA
  file; Tue Mar 5 to Thu Mar 7 the migration; Mon Mar 11 to Wed Mar 13 the backup export's mislabel; Mon Mar 18 the
  certificate authority (more to see); Thu Mar 21 the doubled TLS file; Sat Mar 23 the empty EDR file; Wed Mar 27 the
  access reviews left to the visitor. The history is the six months before February (the data list's `generateArgs`:
  `--from 2023-08-01 --steps-from 2023-12-21 --base-to 2024-01-31`); the world's span and the answer key's month don't
  move. The story (`tour.json`) and the scenes (`scenes.json`) take the new days, their words as they were. Making and
  recording the two months takes about seventeen minutes on four cores, the CI job about as long.
  - **More of the world made steady.** The first build of the two months noted 18 of their 48 calm days, each traced
    to something in the generator that moves with the span or the calendar, now steady in the tour's world too:
    - the four weeks of January's findings ended a week before February's Patch Tuesday, so the findings' *new* share
      fell to a fifth of its usual for a week: a month's batch is now found through the weeks up to the next Patch
      Tuesday;
    - each ring's EDR sensor and each host's build were drawn again on the first of every month, so the classifier
      told February's rows from January's for eleven days: they stay where they are;
    - posts changed hands at random times, and more did in late February, so twice the usual people were listed as
      left and the forest told the extract apart four times; a vacancy or a leave without anyone acting left a team
      without an owner for days, which the posture and the failures by business unit told: posts now change hands
      evenly through the span, in the order they would have, and someone acts from a vacancy's first day and through
      every leave;
    - new applications were mostly built in the cloud, so the data centres' share fell month by month and the forest
      told the CMDB's and the logging file's pairs with hosting and pipelines: they are hosted as the rest are.

    Measured from the generator a week at a time from August to March, the extract's statuses, the owners, the
    hosting and the sensors hold (`test/larkspur.test.ts`, "is steady (amendment 1)").
  - **The classifier and an accepted level.** Thu Mar 7, the day after the owner accepted the logging file's new
    level, the classifier told its rows apart from the 28 days before (AUC 0.72): 26 of them were before the
    migration. The forest already leaves out what a level moved (`movedBy`); the classifier now leaves out the columns a
    level moved while its like days reach back before the level (`HistoryRanges.movedSince`, `columnsOfLevel`,
    `apartEvidence`'s and `apartColumns`' `moved`), and the Models tab says why the column is left out. It changes only
    days after an accepted level: no recorded day of the answer key's month or the other demos has one.
  - **Presidents' Day.** Mon Feb 19 is the US calendar's holiday, and the history has none before it: every file is
    *not judged yet*, published and marked ◌ in the grid's bronze row (ADR 0010 §1). The views follow `effective`,
    which is judged, so the month marks the day normal. A file's Quality tab said *No quality issues: 11 checks passed*
    that day, though nothing that reads the history's ranges had anything to go by: those checks (the amount, the
    blanks, the shares, shapes, hours and pairs) are now *not judged* on such a day, never passed (`bronzeOf`'s
    `unlearned`, `verdictSaid`; `tools/browser/stops/tour.json`'s `tour-presidents`): *No quality issues: 5 checks
    passed, 6 not judged yet*. A longer history would judge the day by last year's, at twice the data; left as the
    honest mark.
  - **The month screen** draws a calendar a month under its name when the days span months (`.mo-cals`, side by side
    from 1,800 px), names the span (*February–March 2024*), and says the month on the grid's first day of each
    (*Mar 1*) and at the trend's ends (*Thu Feb 1*) (`tools/browser/stops/tour.json`'s `tour-months`).
  - **What is left:** five of the 48 calm days carry a note, each a learned check's, marked unusual: two shares a row
    off their band on the small DR and WAF files (Tue Feb 6, Mon Feb 12), the forest on three days (Sun Mar 10, Sun
    Mar 17, Tue Mar 19) and the classifier on one (Tue Mar 19). A week or more of calm days lies between most scenes.
    The answer key holds the calm days to at most six notes, none of them something wrong; the scenes' holds and
    decisions are as before. Thu Mar 7, a scene's day, carries one note too: the migration's effect a step later,
    `platform_impact`'s share of the day's failures through the data centres' pipeline below its usual.

## Consequences

- **The demo at `/app/` changes:** its month, its story and its walks (`tools/browser/stops/larkspur.json`, `month.json`,
  `decide.json` and the others on Larkspur) are rewritten for the tour, each scene with its own stop.
- **No test vector of today moves for the tour itself:** the full month keeps its answer key, and the tour's is new.
  Q-86 moves what a lasting change does wherever one is held (§6, slice 3), said in its slice.
- **Fills change Larkspur's flow:** a fill step adds `filled_from` to what it passes on, and moves the plan's hash. That
  is said in slice 2.
- **The docs' demo page becomes the tour's,** and the two-minute test (`tools/judges/two-minute.md`) takes its days
  from the tour's scenes.
