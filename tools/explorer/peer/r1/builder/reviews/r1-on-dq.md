# The builder on dq's fix: "Same scale, true colour"

**Verdict:** agree.
**Score:** 5

I looked at `S/peer/r1/dq/v1/compare-odd-vs-serious.png`, `snap/4a-odd-but-ok/03`, `4b-outlier/02` and `06`,
`2-problem-fix/03`, `1-setup/07` and `13`, and `v1/4a-odd-but-ok-03-after-phone.png`, each against `S/peer/snap/…`.
`proto/states.png` shows every state the function draws.

## Keep

- **One picture, from one function, everywhere a day's rows are judged** (`usualFig`): rows from zero on a scale every
  file shares.
  - The 28 days are grey columns, and the day is the one coloured column.
  - TLS's 1,630 reaches the 2× line, MFA's slot is empty, and Exceptions' 262 stands level with its 28 days.
  - That is the truth at that scale, and it is the honest way to tell "a little odd" from "a real problem" at a glance.
- **The limit the day broke is one dashed line,** labelled where it is: "your ±2%: pauses below 264". There is no
  legend, and every number sits on its mark (§3.6, §5).
- **A corrected file is green only when it is inside the limit** (`fxWhere`). A file sent again that is still off no
  longer looks fixed.
- **"20× the limit" is gone.** It was 20 times the allowed percentage, not 20 times 853 rows.
- **Two setup fixes in my screens, both right:**
  - the rows range rounds the way the check pauses ("2,271–2,509");
  - "15%" no longer prints over "14.4%" in the rule's 184 days (`shareChart`).

## Change

1. **A nit, the only one: on a little-odd day, show the gap on the picture as well as in words.**
   - **What.** At 4a/03 the 262 column and the 264 line are about a pixel apart. Only "past your limit by 2 rows"
     says why the day paused. Label the day's column "262 · 2 under 264" where the limit line meets it, or keep it as
     it is.
   - **Why.** §5: the alert says how far beyond the threshold the value is, at the mark.
   - **Test.** At 4a/03 the words "2 under" sit on the day's column.

## Conflicts

- **Owner and dq both redraw the figure in Decide. Ship dq's figure inside the owner's panel.** Keep the owner's 22 px
  verdict line and their "Why it paused ›" fold for the arithmetic. Put dq's chart where the owner's two bars are.
  - dq's figure is the same on the paused-day card and in Decide.
  - The owner's two bars drop the 28 days and the limit.
  - The owner's CSS hides `.u-chart`, `.ulg`, `.ulim` and `.urows` on a serious day. Drop it or scope it to the old
    figure, so it doesn't hide `svg.u-chart.u-dq`.
- **Design and dq both recolour severity. Combine them:**
  - dq's colour: an amber column for mild, crimson for serious.
  - design's shape: serious filled, mild outlined.
  - design's mild banner, outlined in magenta today, should be outlined in `--warn` to match dq's amber.
  Each state then has a colour, a shape and a word.
- **None with mine.** dq's video-1 edits (`rulesPart`'s amount range, `shareChart`) sit below my join cards in the read
  panel, in other hunks of `build.js`.
