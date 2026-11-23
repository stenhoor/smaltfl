# Design on owner: "The call first"

**Verdict:** agree.

**Score:** 4.

**Matches the system:** mostly.

- What fits:
  - one primary;
  - smalt only on actions and the chosen row;
  - severity as shape, word and colour;
  - one list with hairlines;
  - one link style;
  - tokens only.
- What is off the scale (measured with `offscale.cjs` on 2/07 and 4b/06):
  - the verdict at 22 px;
  - the avatar's initials at 8 px;
  - the bars' labels at 8.6 px.

Paths below are under `S/peer/r1/design/reviews/work/`.

## Keep

- **The order:** how serious, then the number, then her pick (already chosen), then one primary button that names the
  agreement ("Agree: wait for the file"). One focal point, one primary action (§3.5, §6).
- **The choices as one list:**
  - hairlines between rows, and a smalt state layer on the chosen one (states as layers, §4);
  - the four tile pictures gone;
  - each row's eye line, an SVG eye rather than an emoji, saying where readers look after it.
- **Severity as a badge** with the pause mark and a word: Serious filled `--bad`, Mild `--warn-wash`. It is the same
  rule as dq's and mine: the hue says which, the fill says how loud. Never colour alone (§6).
- **The answer first, the forensics one tap away** ("How it compares ›").
- **Fewer words:**
  - "Done for now" said once;
  - the page behind steps away;
  - 161 to 231 words on every decision step of videos 2 and 4b.

## Change

1. **Put dq's figure in the panel instead of your two bars, and drop your serious-day rule that hides `.u-chart`.**
   - **One picture everywhere.** A single picture should judge a day's rows on the Build card and in Decide, for mild
     and serious days alike (§3.1 one kit; §7 "matches the system" and "every state covered"). Today your 4a still
     shows the old ±10% chart.
   - **Your bars' labels are too small.** Shrunk to 96 px tall, the two bars draw their labels ("usual 2,314", "Mon 26
     0") at 8.6 px, below the 11 px floor (§6). dq's figure draws its labels at 12.4 px in this panel.
   - **Merged as they are, your rule hides dq's chart.** `#layer .panel.decide .dcols[data-sev="serious"] .decfig
     .u-chart { display: none }` hides dq's only chart, `svg.u-chart.u-dq`. Tested in `m-dq-owner-4b06.png`: the figure
     is gone.
   - **The combination works.** `sketch-owner-with-dq-4b06.png` and `-phone.png` show your panel holding dq's figure:
     164 visible words on desktop and 139 on a phone, with no sideways scroll.
   - **Test:** on 4b/06 and 2/07, `.decfig svg.u-chart.u-dq` is drawn, and every text in it renders at 11 px or more.
2. **Take the sizes from the scale (§6, seven sizes).**
   - The verdict goes from 22 px to 24, the display step, so it stays the focal number above the 20 px title.
   - The avatar's initials go from 8 px to 11, or the avatar goes and the name stays (it repeats "Sloane Marsden" in
     letters).
   - **Test:** `offscale.cjs` on the panel lists neither 22 nor 8.
3. **Nit: show the keyboard numbers only while the keyboard is in use.** Today 1 to 4 sit on every row as 10 px badges.
   Use `.opts:has(input:focus-visible) .tk` (my rule; yours currently wins and shows them always). Chrome only when it
   helps (§3.7).

## Conflicts

- **Design (mine), on the Decide panel: ship yours.**
  - Tested: my block on your snap (`m-owner-design-2-07.png`) leaves your panel intact, because your selectors are
    scoped and stronger.
  - In my revision I drop my section 4 (choice rows, recommendation chip, frames, hiding the Build panel). I keep only
    the type tokens and the 200 ms motion rule.
  - Your `body:has(#layer .panel.decide) .app { visibility: hidden }` replaces my `#buildpanel` rule.
- **dq: the figure is dq's** (change 1). Your layout around it stays:
  - no frame on `.decfig`;
  - the verdict in ink as the panel's headline;
  - the corrected file as one green ↻ line plus "How it compares ›".
- **Severity colour: yours, dq's and mine agree** once I change my mild banner's outline from magenta-tinted to amber,
  which I will. Serious is crimson and filled; mild is amber and light; the pause mark is magenta for both.
