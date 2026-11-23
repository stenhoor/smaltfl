# dq on design, round 2b: the revised patch (pick dot, fold rule, three weights, 11 px floor, history and checks as rows)

**Verdict:** agree, provided change 1 is made. It is a one-line fix, tested in the sketch below.

**Score:** 4

What I did:
- Read the revised `proposal.md` ("Round 2: took / declined") and `changes.md`.
- Compared `S/peer/snap2/1-setup/27` and `28` with design's `snap/1-setup/27` and `28`, at 1440×900 and 390×844.
- Applied design's `patch.diff` onto a copy of my combined app. Both apply cleanly, with offsets only
  (`reviews/merge-design/app`).

## Does design's `.seg` and pick-dot CSS sit cleanly on my rows? Yes
- **Pixels.** I rendered my gaps step with and without design's CSS, every animation finished
  (`proto/pxsame.cjs`). On the panel, the only change is the control's corner radius, 7 → 6 px: one radius family, as
  intended. The map moves by 0.03 px, a fit artifact.
- **The pick dot.** All five dots on my rows measure 5×5 px either way. My `#buildpanel .seg button .lkdot` rule is
  identical to design's; keep design's (global) and drop mine in the merge.
- **The control's size and the walkthroughs.** It keeps 24 px pills, auto-width columns, and 44 px on a phone. The
  gaps step's selectors are untouched.
- **History with both patches.** My chips on the cards' scale (the map) and design's rows (the panel) render together
  with no page errors (`reviews/merge-design/merged-history.png`).

## Keep
- **Larkspur's pick, visible again** on every segmented control. It had become 0 px wide after the merge.
- **The app-wide closed-fold rule.** It is one rule for the whole app; drop the scoped copies (mine, the owner's, the
  builder's, the newcomer's).
- **Three weights and the 11 px floor**, measured on rendered text:
  - At 27, the panel's 700s are gone and nothing is under 11 px. The merged base had column names at 10.5 px.
  - At 28, the map's check badges reach 11 px or more; they were 8.9 px.
- **History as rows, not 22 tinted tiles.** Each sparkline keeps the cards' honest scale (usual ± the limit, shaded).
- **The checks' paused days as a list read down.** The same eight days as the merged base: Feb 16, Feb 26, Mar 5,
  Mar 6, Mar 11, Mar 21, Mar 23, Mar 27.
- **"Pause · Warn · Note · Off" in the rule list's select.** The same four words as my gaps key.

## Change
1. **Merge condition: on a phone, step 28 now scrolls sideways.**
   - **The cause.** The Learned check's control sits in a second column of its own `.segwrap`. An old rule,
     `.ck-kinds .seg { grid-column: 2 }`, was written when the control was the row's direct child; now it applies
     inside the wrapper. So the control runs from x 232 to 470 on a 390 px screen.
   - **Before your patch** (merged base), `.ck-kinds` clipped it, so Note and Off were cut off and couldn't be tapped.
   - **With `.ck-kinds { overflow: visible }`**, the panel body now scrolls sideways (`scrollWidth` 470 against
     `clientWidth` 390). That breaks the "nothing scrolls sideways" rule; the render tool checks only the page, so it
     didn't flag it.
   - **Fix (one line):** `#buildpanel .ck-kinds .segwrap > .seg { grid-column: 1 / -1; }`.
   - **Sketch:** `reviews/merge-design/design-28-fixed.html` and `sketch-learned-row.png`.
     - At 390: `scrollWidth` 390 = 390, and all four buttons are on screen (59 to 359 px).
     - On the desktop, the only change is the Links control moving 3 px left, into line with the others.
   - **Test:** at 390×844, `#buildpanel .bp-body` `scrollWidth` equals its `clientWidth`, and every `.seg button` is
     inside the viewport.
   - §6 (works on a phone); §7 (ready to ship).
2. **Say what the dot means, once, on screen.**
   - Its only words are a hover `title` and the `.lkw` "Larkspur's" spans, which a base rule hides
     (`display: none !important`). On a phone, nothing says what • means.
   - **What:** add "• Larkspur's pick" once on step 28, for example at the end of the lead line ("Every file is checked
     before anything is built from it."). I'll add the same words to my gaps key.
   - **Test:** on 22 and 28, the words "Larkspur's pick" are visible without hovering.
   - §6 (never a mark alone: a shape and a word); §5 (Carbon).
3. **A nit: the checks' headline is still at 700.** `b.ps-h` ("8 of 56 days paused, Feb 1 to Mar 27") is the one 700
   left in the panels at 27 and 28 (besides the ◆, ¼ and – marks). Set it to 600 to match the "three weights" claim.
4. **A nit, no change needed: "Scanner …" on the map at 28.** The larger badges cut "Scanner findings" to "Scanner …".
   It is the only scanner file, so it stays clear.

## Conflicts
None with my combination. In the merge:
- keep design's dot rule, fold rule and kinds-line rule, and drop my copies;
- keep my gap-row control CSS (pill size, the hidden fold control) and design's radius beside it.
