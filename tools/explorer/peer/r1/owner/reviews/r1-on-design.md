# Owner on design, round 1: "One quiet system"

**Verdict:** agree, as the system layer, with the three changes below. **Score:** 4.

Looked at:

- before and after for 2-problem-fix/01 and 12, 4a-odd-but-ok/01, and 4b-outlier/01 and 06;
- `v1/banner-states-pair.png`;
- the phone renders of 2/01 and 2/12;
- the 4b Decide panel, opened live on design's app at 1440 and 390: no page errors, 543 and 315 words.

## Keep

- **The paused day has one magenta thing.**
  - The cause file is outlined. The held chips are grey with their hourglass. The cause card has a 3 px bar.
  - Alarm colour falls from 12% to 3% of the screen (§3.2, 60-30-10).
  - A serious day finally has a focal point.
- **Severity by volume in the banner.**
  - Serious is filled, mild is outlined, and waiting, decided and corrected are neutral.
  - A glance tells odd from real: my first question.
- **The system work itself:**
  - the 11 px floor on the map (`--ks`);
  - the month as a strip of marks;
  - `--fs-*`, `--sp-*` and the role tokens;
  - the held line no longer crossing file names.
- **In the Decide panel:**
  - rows instead of boxed tiles;
  - the recommendation as a line;
  - key numbers only while the keyboard is in use;
  - pictures that arrive once, in about 240 ms, eased out (§7, motion).

## Change

1. **Most important: mild must not wear the alarm colour.**
   - On the mild banner (4a/01), the pause mark and "Sat Mar 2 is paused" are still magenta (`--bad`) inside the
     outline. Make them `--warn`, the amber the chip already uses and dq gives the mild column.
   - Serious stays filled `--bad-wash` with a crimson mark. Then shape, hue and word all say how serious (§6, never
     colour alone; §3.2, the accent on the one thing that needs attention).
   - Where: `.alert.short:has(.sev.mild)`, on its `.ai` and its `.at b`.
   - Test: no `--bad` colour in the 4a/01 banner, and 2/01 unchanged.
2. **The corrected file's bars collide at 11 px.**
   - In 4b-outlier/06, "first" and "sent again" run into one label over 1,630 and 815 (`.u-bars text.u-ax`). That is
     the owner's evidence for the fix.
   - Take dq's figure, which replaces `.u-bars`, or give the three bars wider spacing.
   - Test: no two bar labels' boxes overlap.
3. **Put the whole page away while deciding, not only `#buildpanel`.**
   - Use `body:has(#layer .panel.decide) .app { visibility: hidden }`.
   - Under the 28% scrim, the map still shows 179 words (§3.5, one focal point).

## Conflicts

- **The Decide panel, design and mine.**
  - Design restyles the old content: 603 words at 2/12. On a phone the recommendation is still below the fold, the panel
    scrolls past the severity, and nothing comes chosen.
  - Mine changes the content and its order: a severity badge, the number, an eye line a choice, her pick chosen, one
    "Agree" button, 218 words, and the whole decision on a phone's first screen.
  - Ship my structure, with design's system on top:
    - my 22 px verdict goes to design's `--fs-6` (20 px);
    - design's row style for the choices, and its key numbers only with the keyboard;
    - design's 240 ms ease-out.
  - Drop design's `.tfile { display: none }`. My fix hides the after-line, which design relied on, so with both the
    file's fate ("Stays on your list", "Reopens if a file comes") would vanish. My short fate on each row stays.
  - One background rule: mine (`.app`).
- **Severity colour, design and dq.** Both ship, and they don't compete: design gives the volume (filled or outlined),
  dq gives the hue (crimson or amber), and the word stays. My Decide badge already uses that pair.
- **The figure.** Design's 11 px floor on `.ufig .u-ax` will reach dq's new chart. Check its "first" and "sent again"
  labels at 11 px.
- **Builder.** Design's unboxed `.bf-prop` sits beside builder's grey join cards. Make the join card a row, as I asked in
  my builder review.
