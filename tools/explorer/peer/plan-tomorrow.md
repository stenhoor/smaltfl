# Retro of the two peer rounds, and the plan for tomorrow

Inputs: the owner's feedback of 2026-11-22 on the estate map, Ctrl K ask and look-inside, the Access reviews dataset
view, and the Decide panel; the five reviewers' final notes (`peer/r2/*/final.md`); `peer/inspiration.md`.

## What went well

- **Working fixes, not mockups.** Every proposal was real code in its own copy, proven by re-running the walkthroughs.
  Two rounds merged with no page errors and nothing broken.
- **A shared brief with a number in it.** The word budget per screen gave the reviewers a target to converge on.
  Decide screens went from up to 830 visible words to 188–247.
- **Review to agreement caught real problems:**
  - the owner's chart and dq's chart conflicted, and dq's won;
  - the round-1 merge shrank the pick dot to 0 px;
  - the word counter counted closed folds;
  - a phone overflow on the checks step;
  - "9 links" against "8 links".
- **Merging was mechanical:** a git branch per fix, CSS blocks joined by script.

## Where it fell short

1. **The journeys left out screens the owner uses.** The videos followed setup and Decide. The owner reviewed:
   - the estate map;
   - Ctrl K ask and look-inside;
   - a dataset's view;
   - Decide on the estate.

   Those were barely in any journey, so the reviewers never saw them. Journeys stay the frame, because walking through a
   whole problem matters. They just have to pass through these screens.
2. **The reviewers weren't calibrated to the owner.** They scored 4 of 5 on screens the owner still finds busy. They
   share my habit of explaining. A count of words is not the owner's test. The owner's tests are:
   - "I don't know what to focus on immediately";
   - "I don't know why this is here";
   - "too many words, just an icon".
3. **Five lenses at once added up to clutter.** Each reviewer kept their own piece, and four of them rebuilt the same
   step. Nobody owned the screen as a whole.
4. **Pictures first was applied to Decide only.** Ask answers, the look-inside preview and the dataset view still lead
   with sentences.
5. **Detail on demand was not the default.** Previews and panels still show everything at once.
6. **Cost.** Each reviewer read 600–900k tokens across the rounds, videos were re-recorded every round, and up to three
   revisions were allowed.

## The owner's rules, as tests every screen must pass

These are the owner's words turned into pass/fail checks. A screen that fails one doesn't score.

1. **Counts are icons.** Nothing on the map says "2 outputs wait on Access reviews": it shows ⧗ 2, and hovering or
   tapping lists them.
2. **A link is two to four words,** such as "made up of", "owned by" or "runs on" ("an organisation is made up of
   people"). The full sentences show on hover.
3. **One focus per screen.** A first-time viewer names it within five seconds, from the screenshot alone.
4. **Every block answers "why is this here?"** in the user's terms (what it tells me, or what I can do). If it can't,
   it folds or goes.
5. **Pictures before words in answers too.** "Why is Wednesday paused?" shows today against usual, as "How has Access
   reviews been this month?" already does. Text is at most one line.
6. **Detail on demand.** First comes what it is, its state and one number. Charts, columns, joins and "built from it"
   wait behind a tap.
7. **Today is today.** The demo's current day reads as "Today", with the date small. The data stays in the past.

## The screens for tomorrow, in order

1. **Estate map (first screen):**
   - "wait on" pills become a ⧗ count badge on each kind, with a hover or tap list;
   - one short label per link, the full sentences on hover;
   - the banner reads: Today · Access reviews came in empty · ⧗ 11 waiting · Decide.
2. **Decide on the estate:** one focal point.
   - The top: what readers see now against after the recommended choice, already chosen, and one button.
   - The picture small, beside it.
   - Behind "More": why it paused, what is held, how it compares, the tools.
   - Test: in five seconds, the viewer says "approve the recommendation" or "wait".
3. **Ctrl K ask answers:**
   - each answer leads with its picture: why paused shows today's bar against the usual band; a month shows the strip;
   - then one line, then "Full answer ›".
4. **Ctrl K look-inside preview (MFA):**
   - Keep "what is this" (the owner likes it), the status chip and "2,329 rows today, usual 2,322".
   - Drop the chart that confuses at first glance.
   - Columns and joins behind Tab ("Look inside ›").
5. **Dataset view (Access reviews):**
   - **Links:** keep only those that say an impact, in plain words. For example, "Each row is a CMDB application (100%
     match)", or "Evidence for the control *Quarterly access review*". Drop or fold the rest.
   - **"Built from it":** collapse to "Used by 11 outputs, 10 waiting ›", with its value said once: "if this file is
     wrong, these outputs show wrong numbers".
6. **Today framing everywhere:** day labels for the demo's current day.

## How the next rounds run (cheaper, and needing the owner less)

1. **Journeys as the frame, screens as the test.**
   - Keep the walkthroughs: each is a whole problem end to end.
   - Add one that starts where the owner starts: a problem shows up today on the estate map, you ask Ctrl K why, open the
     dataset, and decide.
   - Within each journey, every screen it passes gets a one-sentence focus statement and the seven tests.
   - Iterate on snapshots of the journey's steps (snapshot mode); record videos only at the end of a round.
2. **Calibrate to the owner first.**
   - The brief carries the owner's screenshots and comments above as failing examples.
   - A reviewer must name which test a screen fails, quoting it. A score counts only if no test fails.
3. **Two new checks, cheap to run:**
   - a five-second test: shown the screenshot, the reviewer says what they notice first and what they'd do;
   - a purpose audit: every block, and why it's there.
4. **One owner per screen.** That reviewer builds the working fix; two others review it. Three personas (owner,
   newcomer, designer), with dq and builder called in only for their screens. One revision, unless the reviewers
   disagree.
5. **An early check with the owner.** After the first fixes, send three before/after screenshots for a quick yes or no
   before a second round.
6. **Reuse the tools as they are:**
   - snapshot mode (`VX_SNAP`, `VX_NOVIDEO`);
   - `peer/tools/copyapp.sh`, `patch.sh`, `render.cjs` (visible words, sideways-scroll check) and `joincss.py`;
   - a git repo per round for merging.

## Before the reset

The prototype, the tools, the briefs, the reviews and this plan all live in the session's scratchpad, which doesn't
survive the container being reclaimed. The explorer page artifact holds the explorer and the videos, but not the tools.
To be safe, commit them to the branch or publish them, if the owner agrees.

## Done on 2026-11-23: rounds 3 and 4, run as this plan says

- **Round 3, the owner's five screens, one owner each, two reviewers each:**
  - the estate map, with counts as ⧗ badges, links in a few words, and Today from one helper (`window.smDay`);
  - Decide, as one question, now against recommended and one button;
  - Ctrl K answers, picture first;
  - the look-inside, as what it is plus Fine today and one number;
  - the file's view, as its state, what waits and why that matters.

  All five were agreed (the file view after one revision: "held, not wrong").
- **Round 4, fresh eyes on round 3's screens, plus the two screens named next:**
  - setup's checks as one checks × days grid;
  - the receipts as timeline rows;
  - the opened kind (it had failed five tests), Ctrl K's empty palette and search results, and the seams between
    round 3's screens.

  All five were agreed (design's file view after one revision).
- A sixth walkthrough, `v5_today`, starts where the owner starts.

Visible words, mean/max per step, before the peer rounds → now:

| walkthrough | before | now |
|---|---|---|
| setup | 364/490 | 308/370 |
| problem and fix | 521/740 | 228/296 |
| explore | 295/406 | 153/221 |
| a little odd | 597/832 | 241/276 |
| outlier | 541/700 | 248/303 |
| today | 290/492 | 123/184 |

## Next

- Setup is now the wordiest journey: reading a file (keys, rules) and the gaps step at 300–370 words. Hold it to the
  seven tests.
- The build journey's Decide steps (228–248 words) and the day screen's calendar and legend.
- A fresh-eyes pass by a new reviewer on all six journeys, judged only by the seven tests and the five-second test.
- The owner's look at the round 3 and 4 before-and-after sheets (`r3/`, `r4/`).
