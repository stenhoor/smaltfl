# The builder on the owner's fix: "The call first"

**Verdict:** agree, with change 1 made in the merge.
**Score:** 4

I looked at `S/peer/r1/owner/snap/2-problem-fix/07, 11, 13, 17, 18`, `4a-odd-but-ok/08`, `4b-outlier/06` and
`v1/2-problem-fix-07-after-phone.png`, each against `S/peer/snap/…`. Steps 13 to 16 are unchanged, and nothing near
the panel broke.

## Keep

- **The answer first.** *Serious* or *Mild* as a filled or washed badge with the pause mark and a word, its reason in
  grey, then "None at all · usually about 2,314 rows" as the headline.
- **The choice, nothing hidden.** Her pick comes first and already chosen. The record line says what the tap will
  record before it is tapped, and the one primary names the agreement: **Agree: wait for the file**. I hate steps that
  happen unseen, and this one is shown: the pre-choice is labelled with who made it and when, and nothing is recorded
  until the tap.
- **The eye line on each choice.** "👁 Mon Feb 26, MFA from Sun Feb 25" says where readers look after it, in three
  words instead of four near-identical pictures.
- **The choices as one list,** with hairlines and a 6% smalt state layer on the chosen row. The risky row is red and
  needs a reason.
- **The forensics one tap away** ("How it compares ›", "Why it paused ›").
- **Scope and size.** It is 161 to 231 words on every decision step, and scoped to `#layer .panel.decide`, so it merges
  cleanly.

## Change

1. **Don't blank the page behind; dim it.**
   - **What.** Drop the rule that hides the whole page (`body:has(#layer .panel.decide) .app`). Take design's rule
     instead, `body:has(#layer .panel.decide) #buildpanel { visibility: hidden }`, with the 28% scrim. To keep the
     owner's word count, add `body:has(#layer .panel.decide) #stage .lab { visibility: hidden }`.
   - **Why.** At 1440x900 the left 440 px become a flat grey slab, which reads as a page that failed to draw. Under the
     scrim, the map showed what the decision is about: MFA outlined, and its line running to the 11 held outputs.
     That is §3.8 (show the evidence where it is used). The focal point comes from the scrim, not from deleting the
     context (§7, clear hierarchy).
   - **Test.** At 2-problem-fix/07, 1440x900, the left side shows the cards and the magenta hold line, dimmed. The
     relation labels are hidden, and the panel's word count stays within about 20 of 218.
2. **A nit: the owner's two bars give way to dq's figure** (see Conflicts). The 22 px verdict line stays. Under it goes
   dq's chart: the 28 grey days, the day's column and the limit labelled on its line. The bars alone drop the 28 days and
   the limit, which are the evidence for "how far is far".

## Conflicts

- **Owner and dq both redraw the figure in Decide. Ship dq's drawing inside the owner's layout.**
  - dq's `usualFig` is one function, so the paused-day card and the Decide panel show the same picture.
  - Its limit is a labelled line, so the owner can still keep the limit's arithmetic under "Why it paused ›".
  - The owner's serious-day rule hides `.u-chart`, `.ulg`, `.ulim` and `.urows`. Those classes change under dq. Scope
    that rule to the old figure, or delete it, since dq's figure has neither the ±10% chart nor the legend.
- **Design and owner both change the Decide panel. The owner's structure wins:** pre-chosen recommendation, eye lines,
  one list, the Agree button, 161 to 231 words against design's 543 to 628. Design's tokens apply on top: the type
  scale, the 11 px floor, 0.24 s ease-out motion, and keyboard numbers only on focus. The page behind follows design,
  as in change 1.
- **Closed folds.** The owner's `#layer .panel.decide details:not([open]) > :not(summary) { display: none }` and my
  `details.bf-descd:not([open]) > :not(summary)` are the same idea in two places. They could be one rule for the whole
  page.
- **None with mine.** My fix is the Build panel's read view and the map while files are read.
