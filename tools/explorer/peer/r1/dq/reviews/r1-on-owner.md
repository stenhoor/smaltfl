# dq on owner: "The call first"

**Verdict:** agree, provided change 1 is made when merging.

**Score:** 4

I re-ran `owner/scripts/v4b_outlier.cjs` on `owner/app`: 11 steps, no page errors (`dq/reviews/check/owner-v4b.log`).

## Keep

- **The order.**
  - The badge (a mark and a word).
  - The one number.
  - Her chosen row.
  - One primary button that names what goes on record: "Agree: wait for the file".
  - From 828 words to 218 on 2/07 (§3.5, §3.7, §6).
- **The severity badge's colours.** "Serious" is `--bad` filled and "Mild" is `--warn-wash`. That is the same mapping
  as my figure's column and design's cause bar (amber for mild, magenta for serious), so the three agree.
- **Every number I checked is true and agrees with the rest of the product:**
  - the badge's reasons ("no rows at all", "twice the usual rows") are the banner's;
  - "Recommended … Mon Feb 26, 08:10" and "Thu Mar 21, 14:30" are the before's;
  - "2,318 rows, +0.2% from usual" and the bars 2,314 / 0 / 2,318 are right;
  - the record line says what the receipt then keeps (4b/11: "published the corrected file … 'Every certificate once'
    Sloane Marsden's reason, agreed");
  - the eye lines are the days the old picture's eye pointed at ("Sun Feb 25", "Mon Feb 26, MFA from Sun Feb 25",
    "Mon Feb 26 shows the corrected file").
- **Hiding the ±10% line and its "× the limit" arithmetic on a serious day.** It is the right call: that chart pins a
  100% drop to its edge.
- **The machine's reading never comes chosen (4a/08).** Only a named person's recommendation does.

## Change

1. **Merge condition: delete the rules that hide the chart on a serious day.**
   - **What:** `index.html` lines 1743–1749 and 1828: `.dcols[data-sev="serious"] .decfig .ufig`, `.ufrow`,
     `.u-bars`, and `.u-chart, .ulg, .ulim, .urows { display: none }`.
   - **Why:** with the dq figure merged, `svg.u-chart.u-dq` is the figure's only chart, so these rules leave a serious
     day with a headline and no picture.
   - **Sketch:** `dq/reviews/sketch-owner-merge-as-is.png` is my 4b/06 under the owner's block, and
     `sketch-owner-merge-fixed.png` the same with the rules removed.
   - **Keep 1740–1742:** no frame, a 22 px headline, the headline in ink.
   - **Test:** on 4b/06 and 2/07, `.panel .decfig svg.u-chart` is visible.
   - **Principles:** §7 (every state covered); §3.6 (bars from zero on one scale).
2. **One picture for mild and serious days.**
   - **Today:** a serious day is two or three bars, but a mild day (4a/07 to 11) is the old ±10% chart. The one
     comparison the owner needs most, a little odd against a real problem, is drawn in two encodings.
   - **With change 1 and the dq figure:** both are the same 28-day picture on one shared scale, and the mild one is
     amber.
   - **Test:** 4a/07 and 4b/06 both show `.ufig.dq`.
   - **Principles:** §3.6 (the same scale); §7 (clear hierarchy).
3. **A limit line and a shared scale.** The bars have no limit line, and their scale is the chart's own: usual fills
   the height for MFA and half of it for TLS. The dq figure draws the limit ("±5%: pauses above 853") and puts usual at
   the same height for every file. Change 1 covers this.
4. **A nit: put the strongest evidence in the answer line.**
   - **What:** "↻ A corrected file came at 14:10 · the first with its repeats taken out, row for row · It passed every
     check".
   - **Why:** "both rows identical … the repeats taken out, row for row (1,630 → 815)" is already in `I.fixSaid`. It
     is what tells me the fix is genuine, so it earns the line; the rest stays under "How it compares ›".
   - **Principle:** §3.7 (the answer first).

## Conflicts

- **Mine, the Decide figure.** Ship the dq figure inside the owner's panel, with the owner's layout, headline size and
  badge, minus the rules in change 1.
  - The owner (1742) and design (1786) both set the headline in ink and let the marks carry the colour. I concede it:
    drop my `.ufig.dq.warn .uv.out b` and `.ufig.dq .uv.fixed.still.* b` rules in the merge, and the day's column
    carries the colour.
- **Design, the Decide panel.** Take the owner's structure and words: the chosen pick, the eye lines, the record line,
  the one button. Layer design's tokens on top: the type scale, the 11 px floor, no frames.
  - Both hide the "4 choices" count and the repeated "Done for now". Both hide the page behind (owner: `.app` not
    drawn; design: `#buildpanel` hidden). Keep one: the owner's, which also takes the map's words out.
