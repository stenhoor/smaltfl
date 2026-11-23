# Design on dq's combined gaps step (round 2b)

**Verdict:** agree.

**Score:** 4.

I looked at:

- `S/peer/r2/dq/snap/1-setup/21` to `28` against `S/peer/snap2`;
- the phone renders `v1/1-setup-22-after-phone.png` and `v1/1-setup-26-after-phone.png`;
- the opened fold `v1/finding-fold-open.png`.

**My revised block, injected into dq's snaps of steps 21, 22, 26, 27 and 28, sits with dq's rows cleanly.**

- On the gaps panel the only pixel difference is the segment's radius, 7 px → 6 px from my `.seg` rule
  (`reviews/work/dq21-vs-mine.png`).
- The pick dot is the same 5 px muted dot, from the same rule.
- The type is on the scale with and without my block (`offscale.cjs`).
- The words are unchanged: 348, 380, 386, 398 and 474.
- Steps 27 and 28 take my history rows and checks list on top of dq's map chips with no overlap.

## Keep

- **One row a gap, read in one order:** name · count, one bar on one scale, its reason, one control, its consequence.
  - The bar is the gap's own dark mark on a pale track, the finding the one amber mark, blanks hatched.
  - It is the clearest picture of "how big, and which one needs a look" in the product (§3.6).
- **The control from the kit at last on the gaps:**
  - Pause · Warn · Note · Off, 196×26 px on a desktop, 12 px at weight 500;
  - Larkspur's pick a visible dot;
  - the fold refines it and never repeats it: 5 controls in view, the fold's own hidden.
- **Each row says what its setting does over the 56 days:** "Warns on 1 of 56 days: Feb 24", "Not checked", "Listed,
  no day marked". The consequence sits where the choice is made, which settles dq's and the builder's objection to
  mine (§3.8). It also puts the state in words, so it never rests on colour (§6).
- **The newcomer's structure:**
  - the why in one line;
  - the key said once, in the four words;
  - "Worth asking about · 1" first;
  - "Accept the 5 explained ›".
- **The builder's map light on pointing** and his truth fix for Note.
- **Weights 400, 500 and 600; tokens only; no new colour.**

## Change

1. **The one that matters most: drop the smalt ring on the chosen segment, on every `.seg`.**
   - Each chosen segment still carries `box-shadow: inset 0 0 0 1.5px var(--action)` (computed). That makes five
     smalt rings in the list around the one filled button, which was the owner's objection to my version, still
     standing.
   - Now that the row says its state in words beside the control, a tonal fill is enough: `--action-wash`, ink text
     at 600, and if a ring is wanted for contrast, 1 px `--ink-2`.
   - Make it a component change (`.seg button.on`), so Checks (step 28) matches the gaps.
   - **Why:** §3.2 (the accent on the one primary action); §4 (a selected segment is a tonal container, not the
     primary); §7 (one primary per view).
   - **Test:** no `.seg button.on` has a smalt `box-shadow` or border. On step 22 the only filled smalt in the panel is
     "Accept the 5 explained ›".
2. **A nit: on a phone, set the control at its own width, not the panel's.**
   - Today it is 354×46: a full-width block on every row, so two gaps fill the screen.
   - At 4 × 64 px and 44 px tall, "Why ›" fits on the same line and a row loses a line.
   - **Why:** §3.3 (secondary looks secondary); the owner's test, more gaps on the first screen.
   - **Test:** at 390×844 each control is at most 260 px wide and 44 px tall.
