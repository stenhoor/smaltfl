# Decide and the file's view, fresh eyes: one system across round 3's five screens

**Screens:** Decide (5-today 12, and Decide in 2-problem-fix, 4a and 4b) and the file's view (5-today 09 and 10).

**Focus sentences (round 3's):**

- Decide: "Pick what readers see: the recommended choice is ready."
- The file's view: "This file, its state, and what depends on it, said simply."

I wrote `fresh-eyes.md` before changing anything: the five-second test and the seven tests on the merged screens as
they were. Neither screen failed a test. What I'd question was the system:

- one fact drawn three ways;
- one chart off the type scale;
- one mark in two colours and one voice with two marks;
- two kinds of tip;
- six count badges that each looked slightly different.

So this round subtracts the extra ways, and leaves one of each.

All paths are under `S = /tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.

## Before and after

| | before (`snap5`) | after |
|---|---|---|
| Decide, 5-today 12 | `S/peer/snap5/5-today/12.png` | `S/peer/r4/design/snap/5-today/12.png` |
| the file's view, 5-today 09 | `S/peer/snap5/5-today/09.png` | `S/peer/r4/design/snap/5-today/09.png` |
| a build day's Decide (4b 06, 4a 08, 2-problem-fix 07) | `S/peer/snap5/4b-outlier/06.png` etc. | `S/peer/r4/design/snap/4b-outlier/06.png` etc. |
| Decide's More with the evidence chart (4b 08) | `S/peer/snap5/4b-outlier/08.png` | `S/peer/r4/design/snap/4b-outlier/08.png` |
| phone, 390×844 (`render.cjs` on a live phone snapshot) | `work/phone-decide-before.png`, `work/phone-file-before.png` | `phone-decide-after.png`, `phone-file-after.png` |

Visible words, by `render.cjs`:

| screen | before | after | phone |
|---|---|---|---|
| 5-today 09–11 | 87 | 83 | 66 → 62 |
| 5-today 12 | 105 | 104 | 91 → 90 |

- **Nothing scrolls sideways** at 1440 or 390.
- **Where words rose** (2-problem-fix 11–12, 4a 07, 4b 08–10, More open), the chart shrank to the type scale. The text
  already under it moved into view; no words were added. All per-step counts are in `work/words-compare.txt`.

## The seams, measured

The numbers come from `work/audit.cjs` on the live page (`work/audit-before.json`, `work/audit-after.json`).

| seam | before | after |
|---|---|---|
| **The count badge** (map, banner, Ctrl K answer, opened kind, Decide) | heights 20/22/23, sizes 12 and 13, weights 500/600, two edges (1px `--edge`, inset `--line`), a chevron on one | one pill: 22 px, 12 px, 600, inset `--edge`, no chevron |
| **Today against usual** | two bars in Ctrl K; a sentence in Decide and on the file | the same two bars in all four, labelled `rows Mon 26` looking back, amber when the pause is mild |
| **The month** | Ctrl K's strip; another strip in Decide's More | Ctrl K's strip and its one line in both |
| **Type in Decide** | the evidence chart at 18.6, 22.3 and 24 px and weight 700; "11" at weight 900; the pictures' day names at 13.9 and 15.4 | only 11, 12, 13, 15 and 20 px, weights 400 to 600 |
| **The cost mark** | crimson ✕ on the card, grey ✕ in the list | grey in both; crimson keeps to risk and the pause |
| **smaltfl's voice** | ≈ in Decide, ✦ in Ctrl K | ✦ |
| **Tips** | native `title` on the file's cards | the app's tip, on hover and focus, opening only on a real move |
| **Radius** | 8, 10, 12, 14 and 16 px for cards and controls | `--r-2` (10) for cards and sheets, `--r-1` (6) for controls |

## The seven tests (after)

**Decide (5-today 12):**

| # | test | | how |
|---|---|---|---|
| 1 | Counts are icons | pass | ⧗ 11 is the same pill as on the map and in Ctrl K. |
| 2 | A link is two to four words | pass | There are no relation links. "More ›" and "Write your own reason ›" say where they lead. |
| 3 | One focus | pass | The one smalt-framed card holds the one filled button. |
| 4 | Every block has a reason | pass | The file, the question, the cause drawn against usual, now against after, who recommends it and why ("One whole day, Tuesday's"), the record and the button. |
| 5 | Pictures before words | pass | Today against usual is the bars, now against after is the two pictures, and each line is one line. |
| 6 | Detail on demand | pass | The choices, why it paused, the month (as Ctrl K draws it), the outputs and the name are behind More. |
| 7 | Today is today | pass | "today?" with Wed Mar 27 small, and "Today" in the pictures. Looking back it says "for Mon Feb 26", "readers already see today" and `rows Mon 26`. |

**The file's view (5-today 09–10):**

| # | test | | how |
|---|---|---|---|
| 1 | Counts are icons | pass | ⧗ 11 waiting, with the list behind a tap. |
| 2 | A link is two to four words | pass | "one per in-scope application" and "evidence for". The full sentences are in the app's tip, on hover and focus. |
| 3 | One focus | pass | The red-outlined card holds the one filled Decide. |
| 4 | Every block has a reason | pass | "100% match" says that every row is a known application. The day it was matched on is in the tip, no longer an unexplained date at rest. |
| 5 | Pictures before words | pass | Today against usual is the two bars. |
| 6 | Detail on demand | pass | The columns are behind "6 columns ›", the outputs behind ⧗ 11 and the sentences behind hover. |
| 7 | Today is today | pass | "Paused today", "rows today". |

## Five seconds (my after screenshots, cold)

**Decide.** I saw the question, then an empty red stub at 0 against a long grey bar at 1,435, then the smalt-framed
Recommended card and **Keep all of Tue Mar 26**. I'd press it. That matches the focus sentence.

**The file's view.** I saw the Access reviews card, Paused today, and the same two bars, 0 against 1,435, then Decide and
the crimson arrow to ⧗ 11 waiting. I'd press Decide. That matches.

## Purpose audit

**Decide.** Behind the sheet, the page steps back, as round 3 left it.

| block | why it is here |
|---|---|
| "Access reviews" | which file |
| What should readers see today? Wed Mar 27 | the one question, for which day |
| ✕ | leave without deciding (Esc too) |
| ‖ Arrived empty (or the severity badge and the cause) | what happened, in a few words |
| rows today ▏0, usual ████ 1,435 | how big, drawn as everywhere else |
| Now: the picture, 👁 Tue Mar 26, ‖ Paused ⧗ 11 | what readers see now, and that 11 wait |
| Recommended: the picture, 👁 Tue Mar 26, ◐ Done for now, ✕ the cost, ✦ smaltfl's reading | what readers see after, what becomes of the day, what it costs, who recommends it and why |
| More › other choices, why it paused | everything else, when wanted |
| On record with your tap, Write your own reason › | what goes on record with your name |
| Keep all of Tue Mar 26 ↵ | the decision, one tap |

**The file's view.**

| block | why it is here |
|---|---|
| trail, Esc steps back, Estate map, + Add a dataset | where this is, the way back, the page's quiet action |
| the card: name, Paused today, what it holds | which file, its state, what is in it |
| rows today ▏0, usual ████ 1,435 | the one number against usual, drawn |
| See Tue Mar 26's rows, Decide › | check what readers still see; the one thing to do |
| 6 columns › | the columns, when wanted |
| one per in-scope application · CMDB · 100% match | what one row is, and that every row is known; the sentence in the tip |
| evidence for · Quarterly access review | which control it proves; the sentence in the tip |
| ⧗ 11 waiting › · Readers see Tue Mar 26 until you decide | what depends on it, and what readers see meanwhile |

## Proof

- **The six walkthroughs** ran on `app/` in snapshot mode, each with its seed, and none has page errors (`logs/`):
  `v5_today`, `v2_fix`, `v4a_odd`, `v4b_outlier`, `v3_explore` and `v1_setup`. The scripts are unchanged.
- **`work/proof4.cjs`** runs 30 checks on the live page, and all 30 pass (`work/proof/proof.json`). It waits on the
  page's own state, never a fixed time. It checks:
  - the bars in Decide, on the file and in Ctrl K, and that their sentences are gone;
  - one badge style across five places;
  - the cost mark's grey, the ✦, and the radii;
  - every text size on the scale in Decide, its More and both build days' charts;
  - 4b's crimson 2× bar and 4a's amber near-equal bar;
  - the file's tip on a move and on focus, and none on a view opened under a resting pointer;
  - taps that still open the list and go to CMDB;
  - the phone, and no page errors.

## Not done here

- **The file's ⧗ 11 waiting card** keeps its title as text. It is a card that is itself the button, so a pill inside it
  would read as a second button.
- **Ctrl K's icon glyphs** (✦ › ⋯ at 14–16 px) are icons, not text. Ctrl K is the builder's screen this round.
- **The merged code has two copies of the bars' function** (`nowBarsHere`). Removing one is for the integrator.

## Revision 1 (newcomer and dq on the file's view; Decide passed with both)

### What I took

1. **The file's view has the opened kind's head.** The newcomer and the builder flagged that "Esc steps back" and the
   little estate map repeated the breadcrumb (test 4).
   - **Now:** "Data model › Application › Access reviews ?". The "?" is the estate's key, and its tip says the marks and
     "Open its columns, then tap one for its values · Esc steps back".
   - **Shared with the newcomer.** The newcomer's round-4 head for the opened kind is taken whole in the same hunk, and
     the file level is added (`S.level === 'kind' || S.level === 'dataset'`, and `TIPS.key` by level). The file view and
     the opened kind share one chrome, and at the merge this hunk is a superset of theirs.
2. **The CMDB link keeps "100% match · Tue Mar 26"** (dq). Today's file has 0 rows, so a match without its day reads as
   today's. I put the day back at rest; the tip still says it.

### Proof

- **Walkthroughs:** `v5_today` and `v3_explore` were re-run in snapshot mode with no page errors.
- **`work/proof4.cjs`:** 33 of 33 pass. The new checks are the "?" head on the file and on the opened kind, its tip,
  and the match's day.

### After

| | path | words |
|---|---|---|
| 5-today 09, desktop | `snap/5-today/09.png` | 87 → 82 |
| 5-today 09, phone | `phone-file-after.png` | 66 → 65 |

Nothing scrolls sideways.

**Patch:** `patch.diff`, +95 −28.
