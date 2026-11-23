# The decision receipts as timeline rows: changes, and where

Owner, round 4. JS is marked `// peer:owner (r4)`; the CSS is one block at the end of `app/index.html`'s `<style>`
(`/* peer:owner start */ … /* peer:owner end */`). `work/apply.py` makes the fix from `explore/` (each edit asserted to
land once); the new receipt code is `work/outcome.js`, the CSS `work/owner.css`.

## build.js

| Change | Where |
|---|---|
| `outcomeOf(H)` draws the day's receipts as timeline rows (`ol` in `div.bd-receipts.bd-tl`): a **paused** row when the files arrived (story time, ⏸, `⧗ n held`, readers on the day before), a **corrected file** row for each delivery in the story (↻, before → after, "every check passed" with the full result on hover, "not out until you choose" while undecided, who sent it again and why on hover), and a **decision** row for each of yours (⧗ wait, ◐ for now, ◧ filled, ✓ final; `YOU[how]`; who: the name you decided as, or You, the full "Deciding as" on hover; what readers saw after it, by date, in the Decide panel's words; in whose words behind a tap: her words with her role and story time, smaltfl's reading, your words, or "no reason given"). Sorted oldest first on the story's clock; a decision is dated by the story's day it was made on (`c.on`) and placed after that day's events. "Change this decision" under the rows. The replay's wall clock (`c.at`, "Nov 23, 17:38") is no longer shown | replaces the old `outcomeOf`; new `FIX_BA`, `fixPassed`, `TL_EYE`, `tlRows`, `tlDay` (design's `smDay.text`: Today, else Mon 26), `tlSees`, `tlRow` |
| "Readers see …" and the corrected-file box step aside where the rows show (their facts are rows) | `readersNow`, `fixLine` (early return); `fixLine` reads `FIX_BA` and `fixPassed`, now shared |
| A day carried to the next no longer adds the two-lane "day in order" list under its rows | `carriedCard` |
| "The day, in order" (under More) dates your rows by the story's day ("Mon 26"), not "You" with the replay's clock | `timelineOf` |
| A limit you changed or a level you accepted: the same rows, on the story's day, in whose words behind a tap | `tuneLine` (returns `div.bd-tl.tuned`) |
| Once you have chosen to wait, the paused day's evidence (the cause and its chart) folds behind "Why it paused ›", as a decided day's already does: the rows say what you decided and what readers see, so the chart no longer outweighs the receipt on the day you waited | `dayCard` (`waited`), `carriedCard` |

## explore.js

| Change | Where |
|---|---|
| The banner of a day you chose to wait on says "your call", without the replay's time beside the story's day | `renderChrome`'s short banner (`your call${…}`). The banner is also the newcomer's this round: a one-line edit to merge |

## index.html, `/* peer:owner start */`

- `.bd-tl`: rows on a 50 px / 18 px / rest grid; the day and time in tabular figures on the left; the marks on one
  hairline; what (600) and who (400) on the left, what readers saw on the right under an eye, in whose words under it
  as a smalt link; the corrected file's old value struck through.
- Tokens only (`--fs-1…4`, `--sp-*`, `--text-*`, `--ok`, `--action`, `--line`); a phone narrows the columns.

## Walkthroughs

- `scripts/v2_fix.cjs` (a copy): step 13's caption reads "your call, on the record" for "your call, with the time".
  Same 19 steps; the rings still find `#buildpanel .bd-receipts`.
- `v4a_odd`, `v4b_outlier`, `v5_today`, `v1_setup`, `v3_explore`: unchanged, run from `scripts/`.

## Polish (after dq's and design's agreement)

- "Change this decision" in the app's one link style: smalt, weight 500, no underline until pointed at, a focus ring
  (`.bd-tl .tl-foot .link`).
- The decided (carried) card on the radius scale, 10 px (`#buildpanel .bd-card.carried`, `--r-2`).
- Re-run: v2 (my copy, 19 steps), v4a (12), v4b (11), no page errors (`logs/polish-*.log`).
