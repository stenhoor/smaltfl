# The decision receipts as timeline rows, on one clock

**Owner, round 4 (a new screen).** 2-problem-fix steps 13, 14 and 19; 4a-odd-but-ok step 12; 4b-outlier step 11.

**Focus sentence:** "What was decided, by whom, when, and what readers saw, in order."

**The problem (fresh eyes, `fresh-eyes.md`):** each receipt was one long sentence ("Decided by Alex Kim, head of IT
controls: waited for the file · at Nov 23, 17:38 · “…” Sloane Marsden's reason, agreed"), dated by the replay's wall
clock beside a story in February and March. Waiting on Monday and publishing on Tuesday both read "Nov 23, 17:38", a
minute apart at most. What readers saw sat in another block, the corrected file in a third. Tests 3, 4, 5, 6 and 7 failed.

**What changed, in one line:** the receipts are timeline rows on the story's clock, oldest first. Each row gives when
(the day, and the time where the record has one), a mark, what happened or was decided, who, what readers saw (under an
eye, on the right), and in whose words (one tap). The paused moment and the corrected file are rows too, so the day
reads in order: paused → waited → corrected file in → published.

```
Mon 26 05:25  ⏸ Paused · ⧗ 11 held                         👁 Sun Feb 25
Mon 26        ⧗ Waited for the file · Alex Kim              👁 Sun Feb 25
                Sloane Marsden's words ›
Today  02:40  ↻ Corrected file in  0 rows → 2,318 rows
                every check passed
Today         ✓ Published the corrected file · Alex Kim     👁 Mon Feb 26, corrected
                Sloane Marsden's words ›
              Change this decision
```

## Before and after

| Step | Before (`peer/snap5/…`) | After (`peer/r4/owner/snap/…`) | Visible words |
|---|---|---|---|
| 2-problem-fix/13, the day waits | `2-problem-fix/13.png` | `2-problem-fix/13.png` | 314 → **257** |
| 2-problem-fix/14, the receipt | `2-problem-fix/14.png` | `2-problem-fix/14.png` | 306 → **249** |
| 2-problem-fix/19, both decisions | `2-problem-fix/19.png` | `2-problem-fix/19.png` | 337 → **296** |
| 4a-odd-but-ok/12, published | `4a-odd-but-ok/12.png` | `4a-odd-but-ok/12.png` | 236 → **225** |
| 4b-outlier/11, resolved | `4b-outlier/11.png` | `4b-outlier/11.png` | 257 → **253** |
| Phone, 390×844 | | `png/2-problem-fix-19-phone.png`, `png/2-problem-fix-14-phone.png`, `png/4b-outlier-11-phone.png` (no sideways scroll) | |

(Whole-screen counts: the map, its strip of held outputs and the calendar sit around the receipts on every step; on 13
and 14 the paused day's chart now folds behind "Why it paused ›" once you have chosen to wait.)

## The seven tests (after; 2-problem-fix/19 is the fullest)

| # | Test | | How |
|---|---|---|---|
| 1 | Counts are icons | pass | The paused row's held outputs are "⧗ 11 held", as the banner says them; no count is a sentence. |
| 2 | A link is two to four words | pass | "Sloane Marsden's words", "your words", "smaltfl's reading", "Change this decision". |
| 3 | One focus | pass | In the decided day's card the rows are the one block: a line of marks down the left, one row a thing. |
| 4 | Every block answers "why is this here?" | pass | The purpose audit below. The replay's clock, the sentence form and the two separate blocks are gone. |
| 5 | Pictures before words | pass | The rows are a timeline: marks on one line (⏸ ⧗ ↻ ✓, each its own shape) and an eye for what readers saw. Each row's text is one line; whose words is a link under it. |
| 6 | Detail on demand | pass | Her words, with her role and story time, behind "Sloane Marsden's words ›"; the corrected file's full check result and who sent it again on hover; the full "Deciding as" on hover. |
| 7 | Today is today | pass | One clock: the story's. Today's rows say "Today" (design's `smDay`), other days "Mon 26"; no replay time anywhere on these steps, the banner's "your call, 17:38" included. |

## My five-second test (19, after, cold)

On the panel, first the framed DECIDED card: four rows down a line of marks, **Paused**, **Waited for the file**,
**Corrected file in**, **Published the corrected file**, dated Mon 26 05:25, Mon 26, Today 02:40, Today, each with an eye
and what readers saw on the right (Sun Feb 25, then Mon Feb 26, corrected). I read: Monday paused, Alex Kim waited, the
corrected file came at 02:40 today, he published it, and readers now see Monday corrected. What I'd do: nothing more
on this day; move on to Wed Feb 28 ›. That is the focus sentence: what was decided, by whom, when, and what readers saw, in
order. (On 14, the same rows, then "Why it paused ›" and "Next: the corrected file, early on Tue Feb 27": I'd press
Tue Feb 27 ›.)

## Purpose audit

| Block | Why it is here, in the owner's terms |
|---|---|
| When: "Mon 26 05:25", "Today" | When it happened, on the story's one clock |
| The marks on a line: ⏸ ⧗ ↻ ✓ (◐ ◧ where they apply) | What kind of thing at a glance, and the order |
| What, in bold: Paused, Waited for the file, Corrected file in, Published the corrected file | What happened or was decided |
| Who: "· Alex Kim" (or You) | Who decided; the full "Deciding as" on hover |
| "⧗ 11 held" on the paused row | How much the pause held |
| 👁 "Sun Feb 25", "Mon Feb 26, corrected" | What readers saw after it |
| "Sloane Marsden's words ›" (or your words, smaltfl's reading) | Whose reason went on the record, one tap away |
| "0 rows → 2,318 rows · every check passed" | What changed in the corrected file, and that it passed |
| "Change this decision" | Undo the last decision |

Gone: "at Nov 23, 17:38" and "on Tue Feb 27 of the replay" (the replay's clock), "Decided by …:" as a sentence, the
separate "Readers see …" block and corrected-file box (now rows), the second day-in-order list on a carried day, and
"your call, 17:38" in the banner.

## What else it touches

- "The day, in order" under More dates your rows "Mon 26" on the story's clock, not "You" with the replay's time.
- A limit you changed or a level you accepted ("If it keeps happening ›") is the same kind of row.
- The banner of a waited day says "your call". The banner is the newcomer's this round: a one-line edit to merge.

## Proof

- All six walkthroughs, snapshot mode, against `peer/r4/owner/app`: `v2_fix` (my copy, 19 steps), and from `scripts/`
  `v4a_odd` (12), `v4b_outlier` (11), `v5_today` (12), `v1_setup` (28) and `v3_explore` (10): every one to the end with
  **no page errors** (`logs/final-*.log`; snapshots in `snap/` and `snap-other/`). Captions as before but v2's step 13
  ("your call, on the record").
- Checked in the live app (`work/live.cjs`): the rows after waiting, after publishing the corrected file, after
  publishing as is and after publishing TLS's corrected file; a limit set back from "If it keeps happening ›" (a
  "Changed Exceptions' limit: ±2% → ±5% · You" row); "The day, in order" under More dating your row "Mon 26"; the dark
  scheme; 390×844 with nothing sideways.

Files: `changes.md`, `patch.diff` (`peer/tools/patch.sh`), `work/apply.py`, `work/outcome.js`, `work/owner.css`,
`fresh-eyes.md`, `scripts/v2_fix.cjs`.

## Polish: took

From design: "Change this decision" in the one link style (smalt, 500, underlined only when pointed at), and the decided
card at the 10 px radius. v2, v4a and v4b re-run with no page errors; patch regenerated.
