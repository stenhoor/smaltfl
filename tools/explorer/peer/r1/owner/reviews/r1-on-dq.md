# Owner on dq, round 1: "Same scale, true colour"

**Verdict:** agree. **Score:** 5.

Looked at:

- before and after for 2-problem-fix/03 and 07, and 4b-outlier/02 and 06;
- `v1/compare-odd-vs-serious.png` and `proto/states.png`;
- the phone renders of 2/03 and 4b/06;
- the 4b Decide panel, opened live on dq's app (no page errors).

## Keep

- **One figure, everywhere a day's rows are judged.**
  - It is drawn from zero, on one scale every file shares (the top is 2.2× usual).
  - The 28 days are grey columns, and the day is the one coloured column.
  - The broken limit is one labelled dashed line, and every number sits on its mark (§3.6; §5, Datadog).
  - It answers my first question, how serious it is, from the picture alone: TLS's crimson column reaches 2× usual,
    while Saturday's amber column stands level with its 28 days.
- **Colour that tells the truth.**
  - Amber for mild, crimson for serious.
  - A corrected file is green only inside its limit (`fxWhere`), and "Sent again: still off" is crimson.
  - Every state is drawn from the real function (`states.png`).
- **One function** (`usualFig`) for the paused-day card and the Decide panel.
- **The arithmetic is gone** ("20× the limit" said 20 times the allowed percentage).
- **The video 1 truth fixes:** 2,509, not 2,510, and "15%" no longer printed over "14.4%".

## Change

1. **Most important, for the merge: keep the verdict above the chart in ink.**
   - Today the verdict ("2.0× usual", "None at all", "Sent again: about usual") is coloured like the column.
   - Keep it ink and let the column be the one coloured mark. Three crimson marks for one fact (the severity chip or
     badge, the headline and the column) weaken the highlight (§3.6: grey everything, then highlight one point;
     §3.2).
   - Design and I both set the verdict to ink, so this makes it one rule.
   - Test: `.ufig.dq .uv b` computes to `--ink` in 2/03, 4a/03, 4b/02 and 4b/06.

## Conflicts

- **The known overlap: my Decide figure against yours. Ship yours.**
  - My usual, first and sent-again bars show only the day against its average. Yours shows the normal (the 28 days)
    and the limit on the same scale from zero, so it says "a little odd" or "a real problem" without words.
  - To merge, delete my serious-day figure rules:
    - the `.dcols[data-sev="serious"] .decfig .ufig` grid;
    - the `.u-bars` height;
    - the hiding of `.u-chart`, `.ulg`, `.ulim` and `.urows`, which would hide your `svg.u-chart.u-dq`.
  - Keep my unframed `.decfig`. Your chart then runs full width under my severity badge.
  - It costs about 24 words, so 4b/06 goes from 161 to about 165. The decision stays well under 250.
- **Severity colour, design and dq.** Both ship: your hue (amber or crimson) with design's volume (filled or outlined),
  and the word kept. My Decide badge already uses the same pair: "Serious" filled crimson, "Mild" amber.
- **Design's 11 px floor** on `.ufig .u-ax` will reach your chart labels. Check that "first" and "sent again" stay apart
  at 11 px.
