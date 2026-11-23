# dq: what the patch changes, and why

The patch is `peer/r1/dq/patch.diff`, against `explore/`. JS changes are marked `// peer:dq` (one `/* peer:dq */`),
and those of round 1's revision `// peer:dq r1`. The CSS is one block at the end of `index.html`'s `<style>`, between
`/* peer:dq start */` and `/* peer:dq end */`. No other file changes. No class a walkthrough script points at was
renamed or removed: `.ufig`, `.ufig .u-chart`, `.decfig`, `.rdiff`, `.cc.iscause`, `.tune` and `.opt.tile.sug` are all
still there.

## build.js

### 1. `usualFig(fid, H, opts)`: how far from usual, one picture instead of two
This is the figure on the paused-day card and in the Decide panel: 2/03, 2/07 to 2/12, 2/17 and 2/18; 4a/01 to
4a/11; 4b/01 to 4b/10. The facts (`figFacts`), the verdict (`figVerdict`) and the corrected-file verdict are
unchanged. Only the drawing and the words under the verdict are new.

**Removed:**
- the bar pair (`svg.u-bars`, usual against the day);
- the ±10% line chart (`svg.u-chart` with `.u-band`, `.u-zero`, `.u-line`, `.u-dot`, `.u-arrow`, `.u-move`);
- the caption's limit lines (`.ulim` "1.3× the limit", `.urows` "Your limit pauses below 264 rows or above 274 …");
- the legend (`p.ulg`).

**Added:** one `svg.u-chart.u-dq` (viewBox 320×124).

- **Scale.** Rows from zero, on one scale every file shares: usual always sits at the same height, and the top is
  2.2× usual (`vmax`), with a dotted `.u-grid` line labelled "2× usual". A real problem fills the room, and a small
  departure stands level with its 28 days.
- **The 28 days before.** One grey `.u-bu` column each (`x.win`, the same series the old line drew).
- **The day.** One column (`col()`), and it is the figure's only coloured mark (`where`):
  - `warn` (amber) where only your own tighter limit paused it (`figLimits(x).mineOnly`, the same test `sevOf` uses
    for "mild");
  - `bad` (crimson) otherwise;
  - `in` (ink) inside the limit.
  - Before, `where` was `bad` whenever the limit was passed, so mild and serious looked alike.
  - An empty day is a short `.u-bt0` line at the base, with "0".
  - Above 2.2×, the column is cut at the top (`.u-cut`, two white strokes) and still labelled with its true value.
- **A corrected file.** Two columns, "first" and "sent again", at x 228 and 290, far enough apart for their labels at
  every size. The sent-again column is green only inside the limit (`fxWhere`): a file sent again that is still off
  is amber or crimson. Before, it was always green.
- **The limit the day broke.** One dashed `.u-lim` line on the side the day went, at the exact row count the check
  pauses past (`Math.ceil` or `Math.floor`, as before). It is labelled in plain words where it is (round 1): "your
  limit: pauses below 264", "Larkspur's limit: pauses above 853".
- **Labels on their marks.**
  - The day's value sits on its column (`.u-v`), in ink (round 1): the bar alone carries the colour.
  - Under the axis: "the 28 days before · usual 269" and the day.
- **The gap, at the mark (round 1).**
  - Where the day is past its limit by too little to see (a near, in or out verdict, not a corrected file), the gap
    is written just above the line on the day's column: "2 under" (`gap`, `.u-gap`), with the value above it.
  - A far day ("2.0× usual", "None at all") needs no gap label: its column shows the distance, and the verdict says
    it.
- **Labels set by the figure's width (round 1).**
  - The chart scales with its figure, so a label's drawn size is its size in viewBox units times the figure's width
    over 320. The figure is 380 px wide on the desktop card, 442 in the Decide panel, 321 on a phone, 280 on the
    landscape tablet's card and 197 on the portrait tablet's.
  - `.ufig.dq` is a size container, and `@container` steps raise the units as the figure narrows (10, 11, 12.5,
    14.7, 18, then 20; the values 2 more). Every label then draws at 11 px or more, from 442 px down to 176 px.
  - Below 320 px, the short labels take over (`.u-long` and `.u-short`): "pauses below 264", "usual 269" and "again".
  - Labels are placed from their marks in `em` (`dy`), so larger type keeps its spacing.
- **`aria-label`.** One sentence holds it all: the 28 days' range, usual, the day, % from usual, and the limit in plain
  words.

**Words under the verdict** (`sub`):
- near usual: one line, "262–265 rows since Mon 26", with the gap on the mark;
- inside the limit: "· inside your limit" is added;
- far: nothing, since the chart labels every number;
- corrected: "+0.2% from usual".

**Why:** see critique 1 to 5, and round 1's reviews.
- The old ±10% scale pinned +100% and −100% to its edge, so TLS and MFA were drawn about as far from usual as
  Exceptions' −2.6%.
- The colour said "bad" for a mild day.
- "20× the limit" meant 20 times the allowed percentage.
- The card said 262 five times.
- Principles: §3.6 (bars from zero, the change on the normal's scale, label directly, one highlight); §5 (a threshold
  is a line, and the alert says how far beyond it); §6 (colour by role, plain words); §7 (type scale, every state
  covered).

### 2. `figLimits(x)`, the `tm` helper
- "1.3× the limit" is now "1.3× the ±2% allowed".
- The figure no longer prints it, but anything else that does should not say "× the limit": 20 × 853 rows is 17,060.

### 3. The rule list's rows range (the `'amount'` branch, at about line 663)
- `Math.round` became `Math.ceil` and `Math.floor`: "usual 2,390, ±5%: 2,271–2,509", where it said 2,510.
- 2,510 is +5.02%, which the check pauses, and the figure already said "above 2,509".
- Seen at 1/06 and 1/07. Why: critique 7, so the numbers agree everywhere.

### 4. `chainOf(H)`, your own rows limit (the `I.mine && I.kind === 'rows'` cause)
- The cause's `note` ("Rows check · pauses beyond ±2%, as you set it (Larkspur's pauses beyond ±5%)") is now empty
  wherever the figure is drawn.
- The figure labels the limit, and the banner's "mild: only your own tighter limit" says whose. It was the card's
  third mention.
- Seen at 4a/02 to 4a/05. Why: critique 4.

### 5. `shareChart(fid, r0)`: the rule's 184 days (video 1)
- When the tolerance's line and the highest day are within 10 units, the tolerance's label moves above its line and
  the highest day's goes below the series (`near`, `pY`, `hY`).
- Before, "15%" printed over "14.4%" at 1/13, so the room the tolerance leaves couldn't be read.
- Seen at 1/13 and 1/14. Why: critique 6.

## index.html, the `peer:dq` block
- **`.ufig.dq …`:** the figure's marks, all from existing tokens (`--edge` mixed with `--surface`, `--line`, `--ink`,
  `--ink-2`, `--warn`, `--bad`, `--ok`). There is no new colour.
- **The verdict in ink in every state** (`.ufig.dq .uv b`, also `.far`, `.out` and `.fixed`; round 1). The column is
  the one highlight.
- **Text:** 10 units for labels and 12 for values on a wide figure, and 13 px for the line under the verdict. The
  `@container` steps keep every label at 11 px or more as the figure narrows.
- **`grid-template-columns: minmax(0, 1fr)`:** the figure's one column never grows past the figure, so a long line
  under the verdict wraps instead of widening the chart.

## Walkthrough scripts (copies in `peer/r1/dq/scripts/`, the kit required by its absolute path)
Only captions changed, because the picture no longer goes off the scale:
- **`v4a_odd.cjs`, step 3.** "Saturday stands level with the 28 days before, on a scale every file shares. A little
  odd, not a problem." It was "in line with the last 5 days. Exceptions stepped down on Mon 26 …", a step the
  zero-based picture can't show; the line under the verdict says "262–265 rows since Mon 26".
- **`v4b_outlier.cjs`, step 2.** "About 813 rows a day … today 1,630, a column twice as tall on the same scale." It
  was "About 815 rows … off the top of the scale": 815 is the application count, and the picture says usual 813.
- **`v2_fix.cjs`, step 3.** "Today none: serious, an empty column on a scale every file shares." It was "off the
  bottom of a scale".

`v1_setup.cjs` and `v3_explore.cjs` run unchanged.

## Merge notes

How this figure combines with the other four fixes. I copied no one's code; each note says which rule goes where.

- **Owner, the Decide panel.** The owner's panel takes this figure where its bars were.
  - **Delete** the owner's serious-day figure rules: the `.dcols[data-sev="serious"] .decfig .ufig` grid, `.ufrow`,
    the `.u-bars` heights (desktop and the 760 px query), and the hiding of `.u-chart`, `.ulg`, `.ulim` and `.urows`.
    They would hide `svg.u-chart.u-dq`, the figure's only chart (`reviews/sketch-owner-merge-as-is.png` against
    `sketch-owner-merge-fixed.png`).
  - **Keep** the owner's unframed `.decfig` and its 22 px verdict. Its ink verdict rule and mine say the same, so
    keep one.
  - The owner hides `.chg` ("Replaces the first file: 1,630 → 815 rows") where the figure shows the first and
    sent-again files. This figure does show them, so that holds.
- **Design, the system.**
  - **Delete** design's old-chart sizes on `.ufig`: `.u-ax` and `.u-ll` at 11 px, `.u-v` and `.u-bv` at 12 px, and the
    `.u-bars text` nudge. Design agreed in its review. They would set this chart's labels in viewBox units, 13.9 to
    15.2 px on screen, over its own width-aware steps.
  - **Keep** design's `.ufig .uv b` at 17 px in ink: the same colour as mine, with design's size.
  - **Keep** design's `chainHtml` change (the cause line drops its sentence when a figure is drawn): every number is on
    this chart.
  - **Severity is one system.** This figure gives the hue on the day's column: amber for mild, crimson for serious.
    Design gives the volume: a filled serious banner, an outlined mild one, and the cause card's 3 px bar in the same
    hue. The owner's badge gives the word. Design will outline the mild banner in `--warn` (its review), so mild is
    amber everywhere. The pause mark stays magenta, because it marks *paused*, not how serious.
- **Builder.** There is no overlap in code. Use the builder's 28-step `v1_setup.cjs` for the merged walkthrough: this
  fix's video-1 changes (the rule list's range and `shareChart`) sit at its steps 07 and 13, before its two new steps.
- **Newcomer.** No overlap: video 3 has no rows figure.
