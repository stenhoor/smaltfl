# Same scale, true colour: odd or serious at a glance

**dq, round 1, a working fix.**

Paths are relative to `S` = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.
The app is `peer/r1/dq/app`, the patch is `peer/r1/dq/patch.diff`, and `peer/r1/dq/changes.md` names every change.

![odd against serious, before and after](v1/compare-odd-vs-serious.png)

`peer/r1/dq/v1/compare-odd-vs-serious.png`: the paused-day card for 4a (left) and 4b (right), before (top) and after
(bottom).

## The problem

The "how far from usual" figure is the one picture that should tell **a little odd** (Saturday's 262 rows against
your limit's 264) from **a real problem** (TLS's 1,630 against about 813). Today it doesn't (critique 1 to 5):

- Its ±10% scale pins +100% and −100% to the edge. Exceptions' −2.6% dot and TLS's +100% triangle sit a similar
  distance from "usual".
- The day's mark is crimson in both, though the chip says **mild** in amber.
- "20× the limit" means 20 times the allowed percentage.
- One card says 262 five times, with a legend beneath.

The principles it breaks:
- §3.6: bars from zero; the change on the normal's scale; label directly; grey everything, highlight one point.
- §5 (Datadog): a threshold is a line, and the alert says how far beyond it the value is.
- §6: colour by role, never colour alone.

## The fix: one picture, everywhere a day's rows are judged

One function, `usualFig` in `build.js`, draws the figure on the paused-day card and in the Decide panel. So one
change fixes videos 2, 4a and 4b in both places.

- **Rows from zero, on one scale every file shares.**
  - Usual always sits at the same height, and the top is 2.2× usual, marked "2× usual".
  - A real problem fills the room: TLS's column reaches the 2× line, and MFA's slot is empty.
  - A little odd stands level with its 28 days: Saturday's column is the same height as the grey ones.
  - That is the truth at this scale. 262 against 269 is 2.6%.
- **The 28 days before are grey columns, and the day is the one coloured column.** Its colour is the severity's:
  amber where only your own tighter limit paused it (the test `sevOf` already uses for "mild"), crimson otherwise.
  A corrected file is green only if it is inside the limit.
- **The limit the day broke is one dashed line,** labelled where it is in plain words: "your limit: pauses below
  264", "Larkspur's limit: pauses above 853". There is no legend, and every number sits on its mark.
- **The words, said once.** The verdict, then at most one line:
  - near usual, the recent range ("262–265 rows since Mon 26"), with the gap written on the day's column ("2 under")
    where the picture can't show it;
  - nothing for "2.0× usual" or "None at all", where the chart labels every number;
  - "+0.2% from usual" for a corrected file.

## Screens

The before images are `peer/snap/<video>/NN.png`; the after images are `peer/r1/dq/snap/<video>/NN.png`, from my app
in snapshot mode. Word counts use the render tool's own counting, at 1440×900. "Figure" counts only the figure
(`--clip .ufig`).

### 1. 4a/03: the paused-day card, a little odd (Sat Mar 2)
- **Before:** `peer/snap/4a-odd-but-ok/03.png`
- **After:** `peer/r1/dq/snap/4a-odd-but-ok/03.png`
- **Phone:** `peer/r1/dq/v1/4a-odd-but-ok-03-after-phone.png` (390×844, no sideways scroll)
- **Words:** screen 486 → 439; figure 71 → 31.
- **What changed:**
  - `svg.u-bars`, the ±10% `svg.u-chart` and `p.ulg` are replaced by one `svg.u-chart.u-dq`.
  - `.ulim` and `.urows` are gone.
  - The cause's note `<small>Rows check · pauses beyond ±2% …</small>` is gone (`chainOf`, empty when the figure is
    drawn).
  - The day's column is `.u-bt.warn`.

### 2. 4b/02: the paused-day card, a real problem (Thu Mar 21)
- **Before:** `peer/snap/4b-outlier/02.png`
- **After:** `peer/r1/dq/snap/4b-outlier/02.png`
- **Phone:** `peer/r1/dq/v1/4b-outlier-02-after-phone.png`
- **Words:** screen 457 → 433; figure 49 → 18.
- **What changed:**
  - The same picture: the day's column `.u-bt.bad` reaches the 2× line, and the line reads "Larkspur's limit: pauses
    above 853".
  - The words "1,630 rows against about 813", "Far past the ±5% limit: 20× the limit" and "The limit pauses below
    773 rows or above 853; Thu 21 had 1,630" are now the chart's labels.

### 3. 4b/06: the Decide panel with the corrected file
- **Before:** `peer/snap/4b-outlier/06.png`
- **After:** `peer/r1/dq/snap/4b-outlier/06.png`
- **Phone:** `peer/r1/dq/v1/4b-outlier-06-after-phone.png`
- **Words:** screen 814 → 746; figure 38 → 25.
- **What changed:**
  - "first" and "sent again" are two columns on the same scale. Before, a dashed arrow ran from a pinned triangle
    to a green dot.
  - The sent-again column is `ok` only inside the limit (`fxWhere`). "Sent again: still off" is now amber or crimson
    where it was green.

### The same change on the other screens
- 2/03, MFA empty: screen 425 → 401; figure 50 → 19. Phone: `peer/r1/dq/v1/2-problem-fix-03-after-phone.png`.
- 2/07 to 2/12, the Decide panel: 828–883 → 754–809.
- 2/17 and 2/18, the file sent again: 969 → 898 and 1,009 → 938.
- 4a/07 to 4a/11, the Decide panel: 962–983 → 851–872.
- 4b/07 to 4b/10: 814–836 → 746–768.
- Every step is in `peer/r1/dq/words.tsv`.

### In passing, video 1 (no word change)
- **1/07: a range that agrees with its check.** "usual 2,390, ±5%: 2,271–2,509". It said 2,510, which is +5.02% and
  pauses.
- **1/13: the rule's 184 days.** "15%" no longer prints over "14.4%". The tolerance's label goes above its line, and
  the highest day's goes below the series (`shareChart`).

## Every state, from the real function

`peer/r1/dq/proto/states.png`, made by `proto/states.cjs` from the `usualFig` text in my `build.js`, shows:
- mild (amber);
- serious, above (crimson);
- serious, empty (a crimson stub at the base);
- beyond 2.2× (the column cut at the top, its true value kept);
- inside the limit (ink);
- sent again and fine (green);
- sent again and still off (crimson column and headline).

## Memorisely's four questions (§7)

- **Clear hierarchy.** The verdict, then the day's column, the only coloured mark, then quiet grey support. Nothing
  else on the card competes.
- **Every state covered.** The seven above, plus the existing "no figure" path when a file has fewer than 7 days.
- **Matches the system.**
  - Tokens only, with no new colour: `--edge` mixed with `--surface`, `--line`, `--ink`, `--warn`, `--bad`, `--ok`.
  - Every label draws at 11 px or more at every width the figure takes (round 1).
  - No new button or card, and smalt untouched.
- **Ready to ship.** All five walkthroughs ran end to end on the final code, with no page errors, and the phone shows
  no sideways scroll.

## What I deliberately did not change

- **The facts and the verdicts.** `figFacts`, `figVerdict` and `sevOf` are untouched. The Decide panel's
  recommendation ("262 rows is in line with the last 5 days") and its tune box still read the same numbers as the
  picture.
- **The banner and the severity chip.** Their words are right, and the picture now gives severity its shape. The
  banner's layout is design's and owner's.
- **The rest of the Decide panel.** The choice tiles, the tune box, the reason, and the rows behind the count
  ("10 rows went, 9 expired …") are the owner's. My change is the figure in the panel.
- **No shaded normal band.** On a scale from zero, the 28 days' range (262–272) is under 2 px tall. The 28 grey
  columns are the normal, drawn day by day, and the one threshold that matters is the labelled line. A band thick
  enough to see would misstate the scale.
- **No Larkspur ±5% line in the mild picture.** At this scale it would sit 1 px from yours. "mild: only your own
  tighter limit" in the banner says it, as does the Decide panel's "Larkspur's ±5% on none".
- **The step down on Mon 26.** It isn't visible on a scale from zero (2.6% of a column). The line under the verdict
  says "262–265 rows since Mon 26", and the 4a script's caption 3 now says what the picture shows.
- **Video 1's offer.** The offered 15% is still not drawn on the history before it is taken (1/11). That is the
  builder's screen; I fixed only the overprint.
- **The words target is not met on whole screens.** My fix halves the figure's words, but the screens stay at
  436–454 (cards) and 750–940 (decisions). The rest is the map, the calendar, the held chips and the choice tiles,
  which the other proposals take on. Merged with theirs, the figure costs 18 to 31 words of the 250.

## Proof

- **Scripts.** `v1_setup.cjs` and `v3_explore.cjs` as given. `v2_fix.cjs`, `v4a_odd.cjs` and `v4b_outlier.cjs` are
  copies in `peer/r1/dq/scripts/`, with only three captions changed (the picture no longer goes "off the scale").
  All five end with "no page errors".
- **Step counts.** The same as before: 26, 19, 10, 12 and 11.
- **Patch.** `peer/r1/dq/patch.diff`, 44 lines added and 19 removed, in `index.html` (one `peer:dq` CSS block) and
  `build.js` (each change marked `// peer:dq`).

## Round 1: took / declined, and why

All four reviewers agreed (5, 5, 5, 5). I took all four changes asked of my fix and declined none. Three I took as
asked, and one (the gap) slightly narrower than suggested.

1. **Took: the verdict in ink, the colour on the day's bar alone** (owner, design).
   - `.ufig.dq .uv b`, with `.far`, `.out` and `.fixed`, is `--ink` in every state.
   - The day's value label is ink as well: it lost its colour class.
   - So the one coloured mark in the figure is the bar: amber, crimson or green.
   - My coloured-headline rules and the `still` class are gone (§3.6, one highlight).
2. **Took: the limit in plain words, without "±"** (newcomer). The line now reads "your limit: pauses below 264" or
   "Larkspur's limit: pauses above 853", and the same words go in the `aria-label`. The percentage stays one level
   down, in the Decide panel's "Only your ±2% limit paused this" (§6).
3. **Took, a little narrower than suggested: the gap at the mark** (builder).
   - On 4a, "2 under" sits just above the line, on Saturday's column, with "262" above it. The line under the verdict
     no longer repeats it ("262–265 rows since Mon 26").
   - I wrote "2 under", not "262 · 2 under 264": 264 is already on the line's label, a few millimetres away (said
     once).
   - The gap is written only where the picture can't show it: a day past its limit with a near, in or out verdict. A
     far day's column shows its distance, and its verdict says "2.0× usual" (§5, at the mark; §3.6).
4. **Took, and widened: every label at 11 px or more** (design, newcomer).
   - I raised 9 to 10 units, so the desktop card draws at 11.9 px and the Decide panel at 13.8.
   - The chart scales with its figure, so a single size can't hold everywhere. The tablets draw the card at 280 and
     197 px, which would have put 10 units at 8.8 and 6.2 px.
   - So the figure is a size container: `@container` steps raise the units as it narrows, and below 320 px short
     labels take over ("pauses below 264", "usual 269", "again"). Labels are anchored in `em`, so their spacing grows
     with them.
   - `proto/svgtext.cjs` measures every label as drawn. It passes at 1440×900, 390×844, 1180×820 and 820×1180 on 4a/03,
     4a/07, 4b/02, 4b/06, 2/03 and 2/17: the smallest label is 11.0 px, with no two labels overlapping. Every state
     passes at every width from 442 to 197 px (`proto/states-all.html`).
5. **Took, from the reviews' conflict notes.**
   - "first" and "sent again" stay apart at 11 px and above: the columns moved to x 228 and 290.
   - The figure's single grid column can't grow past it (`minmax(0, 1fr)`), so a long line under the verdict wraps.
   - How the owner's panel and design's system take this figure is in `changes.md`, "Merge notes".
6. **Not mine to change.** Design will outline its mild banner in `--warn`, so mild is amber everywhere (its review).
   The owner deletes its serious-day figure rules when merging.

**Re-proved:** all five walkthroughs ran on the revised app, with no page errors and 26, 19, 10, 12 and 11 steps. The
phone shots are re-rendered in `v1/`, with no sideways scroll; the portrait tablet is
`v1/4a-odd-but-ok-03-after-tablet.png`. The patch is regenerated: 44 lines added and 19 removed.
