# ADR 0023: The demo as a tour of what a flow can do

- **Status:** accepted, 2026-11-15. The maintainer asked for the demo to be thought through again from what a visitor
  should see, and approved the plan below ("Looks good"). It is built in the slices of §6.
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
- **The sheet decides the held load** (`sheetSubject` in `src/app/main.ts`). On a flow watching several datasets, where
  one source holds the day and has a fill step, the decision sheet draws that source's history, story and rows and
  offers its fills.
  - Its donors are read from the day's other files in the data list (`listedFileOf`).
  - The donor's claim is told from that source's own base (`donorClaim2`).
  - Fills are for one source at a time (`holding`, `heldSources`).
- **The recorder records a fill** (`StoryDecision.fill`; `fillOnce` in `scripts/data/record.ts`):
  - the version's files are pinned again, and the donor's file is pinned as its donor and judged by its own claim;
  - the derived run is staged and recorded, then one decision a held load carrying the repair, then the release;
  - what was pinned before is put back.
- **Larkspur's story fills Wed Mar 6 from Tue 5** (the backup file was Tuesday's again, the export job hadn't run).
  Wednesday's own export, sent overnight, replaces the fill once decided (Q-62, Q-183). `test/fill-whole.test.ts` runs
  the same in the engine on a snapshot: filled whole from the day before, released and verified, then replaced by the
  corrected file.

## Consequences

- **The demo at `/app/` changes:** its month, its story and its walks (`tools/browser/stops/larkspur.json`, `month.json`,
  `decide.json` and the others on Larkspur) are rewritten for the tour, each scene with its own stop.
- **No test vector of today moves for the tour itself:** the full month keeps its answer key, and the tour's is new.
  Q-86 moves what a lasting change does wherever one is held (§6, slice 3), said in its slice.
- **Fills change Larkspur's flow:** a fill step adds `filled_from` to what it passes on, and moves the plan's hash. That
  is said in slice 2.
- **The docs' demo page becomes the tour's,** and the two-minute test (`tools/judges/two-minute.md`) takes its days
  from the tour's scenes.
