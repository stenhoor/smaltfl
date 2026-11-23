# dq on design: "One quiet system"

**Verdict:** agree, with change 1 made when merging and the rest as nits.

**Score:** 4

I re-ran `S/scripts/v4a_odd.cjs` on `design/app`: 12 steps, no page errors (`dq/reviews/check/design-v4a.log`).

## Keep

- **Severity as volume on the banner.** Serious is filled with `--bad-wash`, mild is outlined, and waiting, decided
  and done are outlined in `--line` (`v1/banner-states-pair.png`). A glance tells odd from serious before a word is
  read, and it doesn't rest on hue alone (§6). It is the banner half of my lens, done right.
- **The cause card's 3 px bar,** magenta when serious and amber when mild: the same mapping as my figure's column and
  the owner's badge.
- **Magenta for the cause alone** (12% of a serious screen down to about 3%), the 11 px floor on the map and in charts,
  and the held outputs listed once.
- **The verdict in ink at 17 px, the colour on the chart's point** (§3.6: grey everything, then highlight one point).
  I concede this to design; it is also the owner's choice.

## Change

1. **Merge condition: legible labels on the corrected file's chart.**
   - **What:** on 4b/06 and 2/17, the 11 px rule (`.ufig .u-ax`, `.u-v`) applied to the old `svg.u-bars` runs "first"
     and "sent again" into one another ("firstsent again") and crowds 1,630 and 815 (`design/snap/4b-outlier/06.png`).
   - **Fix:** the dq figure places its labels for 11 px (`dq/proto/states-phone-fixed.png`), so this goes when it is
     merged. If the old figure stayed, the rule must leave `.u-bars` text alone.
   - **Test:** no two labels overlap in `.panel .decfig` at 1440×900 and 390×844.
   - **Principles:** §7 (ready to ship); §3.6 (label directly).
2. **Two hues for one severity on one card.**
   - **What:** the kept ±10% chart still pins TLS's +100% and MFA's −100% to its edge. On the mild day, under
     design's amber cause bar, its bar and dot are crimson (`design/snap/4a-odd-but-ok/01.png`, phone too).
   - **Fix:** ship with the dq figure, where the mild day's column is amber.
   - **Test:** on 4a/01, the day's mark and the cause bar share `--warn`.
   - **Principles:** §6 (colour by role); §7 (every state covered).
3. **A nit: number the days a reader looks for on the desktop month strip.**
   - **What:** keep a day's number on every day with a mark (◆ warned, paused, ✓ decided), as well as on Mondays and
     the day shown.
   - **Why:** today, finding "Mon Mar 18 ◆" means counting cells or hovering. The marked days are the points that
     matter.
   - **Principles:** §3.6 (annotate the point that matters); §5 (GitHub strips).
   - The phone's week strip keeps its numbers, so it's fine.
4. **A note on `chainHtml`.** Dropping the cause sentence when a figure exists is safe only while the figure carries
   the numbers. With the dq figure it does: 262 on the column, usual 269 under the axis, and "your ±2%: pauses below
   264" on the line. No change, but the two should merge together.

## Conflicts

- **Severity colour, design against dq.** There is no real conflict: both use amber for mild and magenta (crimson)
  for serious. Ship all of it as one system:
  - the banner's volume (design);
  - the cause card's bar (design);
  - the day's column in the figure (dq);
  - the badge in the Decide panel (owner).
  - The mild banner's magenta outline is right as built: magenta says *paused* (the state) and the amber chip says
    *mild* (the severity). An amber outline would read as "warned ◆", which is a published day.
- **The `.ufig` text sizes.** Design's 11 px for `.u-ax` and `.u-ll` and 12 px for `.u-v` apply to my chart as well,
  and they work: I tested my chart at 11 px. Drop my `@media (max-width: 600px)` bump in the merge, and drop my
  coloured-headline rules in favour of design's ink headline.
- **The Decide panel, with the owner.** The owner's structure and words, with design's tokens on top. Keep only one
  "page behind" rule (owner's `.app` or design's `#buildpanel`).
