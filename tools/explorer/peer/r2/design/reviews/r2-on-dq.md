# Design on dq, round 2: "Six gaps on one scale"

**Verdict:** agree.

**Score:** 4.

**Matches the system:** yes.

- Base tokens at 11, 12 and 13 px; weights 400 and 600.
- Amber only on the open finding, with its words; blanks hatched (never colour alone).
- My dividers and links kept.

Paths below are under `S/peer/r2/design/reviews/work/`.

## Keep: the picture of the combined gaps screen

- **One bar a gap on one 0–100% scale.**
  - The gap's true share is filled from zero on a light track.
  - The open finding is the one amber bar.
  - The tags' 0.2% is drawn at a 2 px minimum, not the old fold's rounded 2%.

  It is the clearest picture of "how big, and which one needs a look" in this round (§3.6: one scale; grey
  everything, then highlight the one).
- **The share beside the count, in tabular figures:** "19 of 268 rows · 7.1%".
- **Your rule as a dashed line at 15%,** so the platform gap's 14.4% sits just under it (§5: a threshold is a line).
- **The segment names where the data fills one exactly:** "all non-production", "all SaaS".
- **History's map chips on the cards' scale** (step 27): the same 184 days drawn two ways was a real contradiction.
- **The figure's labels at 11 px or more** in the narrow fold at 820 px.

## Change

1. **In the combination, your bar goes onto the builder's row, not the other way round.**
   - Opened, your row shows the pills and the fold's segment at once, and keeps the nested "Why, and the evidence ›"
     (`gaps-open-3.png`, middle). The builder's row already shows one control and one fold.
   - So graft `span.ag-scale` (`.ag-track`, the fill, `.ag-tol` and `.ag-tl`), the `GAP_SEG` names and the share onto
     the builder's `li.gp`, in place of its `.gp-bar`.
   - **Test:** on 1-setup/21, opening any gap shows one `.seg` and one fold level.
2. **The pills give way to the one control:** Pause · Warn · Note · Off, with Larkspur's pick as a dot, as on the
   Checks step (my round 2).
   - The "Watched by your rule · Warn" chip stays as it is: it replaces the control where your rule decides.
   - **Why:** §7 (one component language).
3. **A nit: drop the axis line** "0 · each gap's share of its file · 100%".
   - Once every bar is labelled with its share, the axis is a legend away from the data. A tooltip on the track can say
     it (§2, §3.6: label directly).
   - **Test:** the panel has no `p.ag-axis`; each `.ag-scale` has `title="share of its file"`.

## Conflicts

- **The gaps screen.** The base is the builder's. Graft from you:
  - the share bar;
  - the share figure;
  - the segment names;
  - the rule's line.

  The newcomer's groups and why, and my control, go on top.
- **The closed-fold rule:** keep one, mine, which is app-wide. Yours is scoped to `#buildpanel` and does the same.
- **Your round-1 verdict colours:** now that the merge sets the verdict in ink, `.uv.fixed.still.(bad|warn) b`
  should not colour it again. Check it once in the merged build.
