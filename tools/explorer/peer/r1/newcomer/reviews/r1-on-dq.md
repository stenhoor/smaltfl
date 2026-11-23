# The newcomer on dq's "Same scale, true colour"

I judge as someone from the business, learning smaltfl from the videos. The test is whether I could follow each step
without the caption.

**Verdict:** agree, with the changes below.
**Score:** 5

**What I looked at:**

- the proposal and `changes.md`;
- `v1/compare-odd-vs-serious.png` and `proto/states.png`;
- before and after: 4a/03, 4b/06 and 2/03;
- the phone render of 4a/03;
- `v3_explore.cjs` run against `peer/r1/dq/app`: no page errors, and explore is unchanged;
- the label sizes, measured: 10.7 px on the paused-day card and 12.4 px in Decide, against 8.5 px before.

## Keep

- **The picture explains itself without the caption.**
  - 28 grey days and today's one coloured column, on one scale from zero.
  - A little odd stands level with its days; a real problem towers (1,630) or is missing (0).
  - It is the clearest "a little odd or a real problem" in the round (§3.6 bars start at zero; §5 a threshold is a
    line, labelled).
- **One labelled limit line,** with no legend and every number on its mark.
- **The words said once.** "262–265 rows since Mon 26 · past your limit by 2 rows" is a sentence I understand.
- **One function** for the card and the Decide panel, with seven states shown from the real code.
- **A corrected file is green only inside the limit,** which is honest.
- **The labels** went from 8.5 to 10.7 px.

## Change

1. **Say the limit line in plain words, without ±.**
   - **Why:** in "your ±2%: pauses below 264" and "±5%: pauses above 853", the ± percentage is the one technical part
     of the picture, and the row count already says it.
   - **What:** say whose limit it is and its number: "your limit: pauses below 264", "Larkspur's limit: pauses above
     853".
   - **Test:** no "±" in `.u-dq` text.
   - **Principles:** §6 plain words; §3.3 labels are a last resort.
2. **Draw every label at 11 px or more.**
   - **Why:** the card's labels render at 10.7 px at 1440×900 (measured).
   - **What:** every label in the figure at 11 px or more, rendered, on desktop and on a phone. That matches design's
     floor.
   - **Principles:** §7 type scale; ADR 0028's seven sizes.
3. **Let amber mean "a little odd" everywhere on that day.**
   - **Why:** the mild column is amber, but design draws the mild banner outlined in crimson. The card would say "mild"
     in amber inside a crimson frame.
   - **What:** agree one severity system with design; see Conflicts.
   - **Principles:** §6; §5 Carbon.

## Conflicts

- **dq and owner, the figure in Decide.**
  - **dq's figure wins,** placed in the owner's layout: badge, verdict line, figure.
  - The owner's two bars render their labels at 8.5 px, and can't show why a near-usual day paused.
- **dq and design, severity.**
  - Colour from dq: mild amber, serious crimson.
  - Shape from design: the serious banner filled, the mild one outlined.
  - The word always.
  - Design's mild banner turns amber (my review of design, change 1).
- **With mine.** None: I didn't touch the figure. dq's 1/07 and 1/13 changes don't touch the read panel or the map.
