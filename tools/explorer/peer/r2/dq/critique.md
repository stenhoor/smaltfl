# Critique, round 2: dq (data quality analyst), on the merged product

I watched `video/r36` and every step of `peer/snap2` as if for the first time.

## Do the numbers agree after the merge? Yes

Checked step by step, banner → figure → Decide panel → receipt:

| Day | Banner | Figure | Decide panel | Receipt |
|---|---|---|---|---|
| Mon Feb 26 (MFA) | serious: no rows at all · 11 held | 0 rows · usual 2,314 · limit pauses below 2,199 | Serious, "None at all" · readers see Sun Feb 25 | waited, then published · 0 → 2,318 rows |
| Sat Mar 2 (Exceptions) | mild: only your own tighter limit · 9 held | 262 · "2 under" your limit of 264 · usual 269 | Mild · 262–265 since Mon 26 · ±2% paused 3 days | published as is, in the user's words |
| Thu Mar 21 (TLS) | serious: twice the usual rows · 11 held | 1,630 · usual 813 · limit pauses above 853 | Serious · sent again 815, +0.2% | published the corrected file · 1,630 → 815 rows · 11 rebuilt |

Every number agrees.

**My round-1 fix survived the merge as agreed.** The figure is in the day card and the Decide panel, the verdict is in
ink, and the day's column is amber, crimson or green. Its labels measure 11 px or more at 1440, 390 and 1180 px wide.
There is one regression (problem 5).

## Scores, the merged product as it is now

| easy_to_find | easy_to_do | images_over_words | trust | overall |
|---|---|---|---|---|
| 4 | 4 | 3 | 4 | 3 |

The days and the decisions now tell "a little odd" from "a real problem" from the picture alone. Setup's screens after
the files are read still don't: there, the data's own problems are told as sentences. No screen meets the word targets
yet; explore comes closest.

## Problems, worst first

### 1. The gaps reading found are six sentences, and their picture is hidden
- **Where:** 1-setup/21 to 26, the heaviest screen in the product: 724 to 942 counted words.
- **What is wrong:**
  - Each gap's size is a sentence. "4 of 1,830 rows", "675 of 1,830 rows", "19 of 268 rows" and "345 of 2,401
    applications" can't be compared without arithmetic: they are 0.2%, 36.9%, 7.1% and 14.4%.
  - The code already draws each gap as a part-to-whole bar (`.ag-bar`), but puts it inside the closed fold, behind
    "evidence ›". The words show and the picture hides.
  - That hidden bar is also wrong at the small end. `Math.max(2, Math.round(n / of × 100))` draws the tags' 0.2% as
    2%, ten times too wide.
  - Why the two biggest gaps are known conditions sits in a 17- to 26-word sentence ("All 675 are in non-production
    or sandbox accounts; every one of the 1,155 production rows names one"). That is a split of the file into two
    segments, with the gap filling one exactly: a picture.
  - The tally of modes is said twice, in the paragraph above the list and in the footer. "Problems already in the
    data on Feb 1 · 6" sits directly over "These 6 were in the files on Feb 1".
- **What I was trying to do:** decide, at setup, which gaps are how the files are made (accept as known) and which is a
  real finding. It is "a little odd or a real problem" inside setup, decided from prose.
- **Principles:** §3.6 (show, don't tell; one scale), §3.7 (the answer first, the evidence one tap away: here the
  answer is folded), §2 (words doing a picture's job; the same fact in two places).

### 2. The checks are 2,161 px of ten near-identical rows that say their days twice
- **Where:** 1-setup/28, 661 counted words.
- **What is wrong:**
  - Each check draws a strip of 56 days, then lists the same days in words ("Feb 1 to Mar 27: paused Feb 26, Mar 21,
    Mar 23 and Mar 27").
  - Only the summary strip has a date axis, so a check's strip can't be read alone, and two checks that pause the
    same day (Rows and Scope on Feb 26) aren't seen to line up.
- **What I was trying to do:** see how often each check would pause, and whether they double up.
- **Principles:** §3.6 (label directly; one aligned chart with a shared axis, not ten); §2 (the same fact twice).

### 3. History draws the same 184 days on two scales on one screen
- **Where:** 1-setup/27.
- **What is wrong:**
  - The panel's cards share one honest scale (±7% around usual, the ±5% limit shaded).
  - The map's chip sparklines ("On each file: its rows over the 184 days") are each stretched to their own minimum and
    maximum (`build.js` line 376).
  - People moves between a handful of counts around 246 (−0.4% on Feb 1) and zigzags across its chip as wildly as any
    file. A file that grew 3% in six months climbs the whole chip.
- **What I was trying to do:** learn each file's usual size. The map tells me the opposite of the card beside it.
- **Principles:** §3.6 (plot on the same scale as the normal); §5 (the normal band shaded).

### 4. The word counts overstate what is on screen
- **Where:** 1-setup/21 to 28.
- **What is wrong:** the render tool counts text inside closed `<details>`, which is never drawn.
  - The gaps' evidence folds hold 275 to 441 words on 21 to 26, so "913" is 476 drawn.
  - The checks' folds hold 187 words, so "661" is 474 drawn.
  - The owner's round-1 rule hid closed folds in the Decide panel alone.
- **Why it matters to me:** the targets are judged on these numbers. A count that disagrees with the screen sends
  every reviewer to the wrong screen. The coordinator's "history and checks, 913 to 942 words" is in fact the gaps list.
- **Principles:** trust; §6 (said once, and true).

### 5. A small regression of my round-1 fix, in one opened fold on the portrait tablet
- **Where:** 2-problem-fix/16 and 17 at 820×1180, once "what it is ›" (the corrected file's fold) is opened.
- **What is wrong:** the figure in that fold is 172 px wide, and its labels draw at 10.8 px, under the 11 px floor. My
  width steps stopped at 176 px, and the merged spacing made the fold narrower.
  - The fold is closed in the walkthrough, so no step shows it; opening it does.
  - Every figure that is drawn in the walkthroughs measures 11 px or more.
- **Principle:** §7 (type scale; every state covered).

### 6. "Clean: every check passed · 2 gaps still open"
- **Where:** 2-problem-fix/16 and 19 (Tue Feb 27).
- **What is wrong:** the line says every check passed beside two open gaps. The Links check draws an open gap as ◇ open,
  not passed (Sat Mar 2's "Every check today"). Is the day passed, or open?
- **Principle:** trust; §6 (one state, one word).

My fix takes problem 1 and three small truth fixes that ride with it (3, 4 and 5). Problems 2 and 6 are left for the
review round.
