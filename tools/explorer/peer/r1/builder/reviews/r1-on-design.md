# The builder on design's fix: "One quiet system"

**Verdict:** agree, with change 1. Changes 2 and 3 are merge notes.
**Score:** 4

I looked at `S/peer/r1/design/snap/1-setup/03, 17, 20`, `2-problem-fix/01, 12`, `4a-odd-but-ok/01` and
`4b-outlier/06`, and the phone renders in `phone/`, each against `S/peer/snap/…`. The five walkthroughs keep their 78
captions.

## Keep

- **Ghost kinds grey, not smalt** (`.node.kind.ghost`, `.ds.ghost`, `.ln.ghost`, `.lab.ghost` in `--edge`). On the
  setup map, *Add CMDB ›* is now the one smalt thing. It agrees with my `.pointed` kinds.
- **The 11 px floor on the map** (`max(13px, 11px / --ks)`). The file names were 8.5 px.
- **One magenta thing on the paused day.** `.ds.waiting` is outlined, the held chips are grey, and the hold line no
  longer crosses file names (`holdLine` leaves by the side).
- **Severity as volume.** Serious is filled, mild outlined, and the word stays.
- **A month strip of marks,** numbered only on Mondays and the day shown.
- **The token set:** `--fs-*`, `--sp-*`, `--r-*`, and role names over existing colours.
- **The page behind Decide.** Hiding `#buildpanel` while Decide is open, under a 28% scrim, is the right version of
  that idea; see my review of the owner.

## Change

1. **Mild is amber everywhere, not outlined in magenta.**
   - **What.** `.alert.short:has(.sev.mild)` outlines a mild banner in the pause colour, magenta. The *mild* chip
     beside it is amber, and so is the cause card's 3 px bar. Outline the mild banner in `--warn`, so that magenta
     means serious and amber means mild, on the banner, the cause bar and dq's day column alike.
   - **Why.** §6, colour by role. The banner, the chip and the chart should say "mild" in one colour, with the
     outlined shape as the second cue.
   - **Test.** At 4a-odd-but-ok/01, no magenta stroke remains on the banner. The magenta left is the pause mark and
     the map's line to the held outputs.
2. **A merge note: the setup panel's lists.**
   - Design's `#buildpanel .bf-links li` rule targets a list my fix replaces with `ul.jn-list > li.jn` (join cards).
     In the merge, give `.jn` design's row style: a divider instead of the grey `--sunk` card I gave it to match the
     old `.bf-prop`, since design takes `.bf-prop`'s box away.
   - Keep the one exception I need: a dashed outline (or dashed arrow) on `.jn.later`, a link whose file isn't read
     yet. That is the same dashed-means-not-in language as the map.
3. **A merge note: the map's type floor has to win.** My rule `.node.ds.ghost.pointed .dn { font: 12px var(--mono) }`
   would override design's floor on a shrunk map. In the merge it becomes `font-family: var(--mono)` only. I'll make
   that change on my side.

## Conflicts

- **Design and owner both change the Decide panel.** The owner's structure and content win: 161 to 231 words against
  603. Design's system applies on top: tokens, no frames, motion at 0.24 s eased out, and keyboard numbers on focus.
  For the page behind, design's rule wins over the owner's blank slab.
- **Design and dq both recolour severity. Combine them:** design's shape (serious filled, mild outlined) and dq's colour
  (crimson serious, amber mild, as in change 1). Each state then has a shape, a colour and a word (§6, never colour
  alone).
- **With mine:**
  - The ghost colours agree: grey dashed for what isn't in. My `.pointed` kinds add a transparent fill and a muted
    name, so a kind pointed at but not read sits quieter than the file being read.
  - Design's `.lab .lv` (relations at 400, secondary) sits above my mono `.lab .lwhy` (the columns that join), which
    stays `--ink-2`.
  - `.bf-props` and `.bf-links` are covered by changes 2 and 3.
- **With the newcomer:** none of substance.
