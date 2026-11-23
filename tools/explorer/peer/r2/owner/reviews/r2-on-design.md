# Owner on design, round 2: "One kit to the end of setup"

**Verdict:** disagree, until change 1. **Score:** 3.

What I looked at:

- 1-setup/22, 26, 27 and 28, before (`S/peer/snap2`) and after (`S/peer/r2/design/snap`);
- the phone render of 22 (196 words), beside the other three (`r2/owner/reviews/work/phones-22.png`);
- the logs: five walkthroughs, no page errors;
- the gaps' control, measured in your step-22 page (`r2/owner/reviews/work/measure.cjs`):
  - 258×32 px on a desktop, and 282×46 on a phone;
  - the segments are outlined dark (`--ink-2`, the selected one `--ink`), the same box as Checks' own control (255×32);
  - the selected one carries a 1.5 px smalt ring.

## Keep

- **One vocabulary for "what a check does":** Pause · Warn · Note · Off, on the gaps as on Checks, with Larkspur's pick
  visible again as a dot. Before, it was 0 px wide on every segmented control. This is a real system fix (§7, matches
  the system).
- **The control no longer repeated inside the gap's fold.**
- **The intro said in 14 words, not 38;** "✓ Accepted by you … 5 of 6; the finding stays open."
- **History as rows, not 22 tinted tiles** (27). **The checks' paused days as a list read down** (28). **The 11 px
  floor** on the map's check badges and the table heads. **Three weights.**
- **The app-wide closed-fold rule.** Keep it as the one rule; it replaces mine, dq's, the builder's and the newcomer's.

## Change

1. **Most important: the control has become the loudest thing in the list.**
   - Five rows each carry a four-segment control with dark outlines, at 32 px. That is Checks' size, but in a list of
     six it is heavier than the pills it replaces (22 px), and here it repeats down the panel.
   - Each control's choice is ringed in smalt, so the panel holds five smalt marks around one filled button.
   - On a phone each control is 46 px tall and full width, so three gaps fill the screen.
   - What reading found (the finding, its size, its reason) now reads as secondary to the setting.
   - Fix:
     - keep the four words and the dot;
     - set the control at the pills' size on a desktop (22–26 px, 12 px text, `--line` borders);
     - show the selected segment as a tonal fill (`--action-wash` with ink text), not a smalt ring, so the foot's
       button stays the one smalt thing on the screen;
     - on a phone, keep 44 px as a touch target, but on one line beside the title's evidence link, not as a
       full-width block.
   - Why: §3.2 (the accent on the one primary), §3.3 (secondary looks secondary), §7 (one primary per view; clear
     hierarchy).
   - Test: `#buildpanel .ag-gaps .seg` is 28 px tall or less at 1440; its selected segment has no smalt border or ring;
     at 390 at least four gaps start on the first screen.
2. **The titles are still 15- to 20-word sentences.**
   - You left that to content. In the merge, take dq's short name and count ("Exceptions · 8 approvers not in the HR
     file · 19 of 268 rows · 7.1%") and keep your one grid around it.

## Conflicts

- **The gaps screen.**
  - The base should be dq's row: sizes on one scale, the finding the one amber bar.
  - Your pieces graft onto it:
    - the four words with Larkspur's dot, at the pills' size and tonal (change 1);
    - the fold not repeating the control;
    - weight 600.
  - Your shorter intro gives way to the newcomer's why line, which says the consequence ("or it is listed every day").
- **History (27):** your rows and dq's chips on the cards' scale combine. dq changes the map's chips, you change the
  panel's tiles.
- **Mine:**
  - Your critique 4 and 5 are about my Decide panel. Its page behind is settled by my round-2 fix.
  - The now-picture's 8.5 px "Sun 25 / Mon 26" labels are a fair catch. I'll set them at 11 px in my revision.
