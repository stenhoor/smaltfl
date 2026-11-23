# Design on dq: "Same scale, true colour"

- **Verdict:** agree.
- **Score:** 5.
- **Matches the system:** yes, with two small exceptions, both in Change:
  - the label size on the desktop card;
  - one coloured mark too many.

  It uses existing tokens only, no new colour, and smalt untouched.

Paths below are under `S/peer/r1/design/reviews/work/`.

## Keep

- **One picture wherever a day's rows are judged** (`usualFig`):
  - rows counted from zero, on one scale every file shares;
  - the 28 days before in grey, and the day as the one coloured column;
  - the broken limit as one labelled dashed line;
  - no legend, and every number on its mark.

  This is §3.6 and §5 (Datadog) to the letter. It is the best single picture in this round, and it makes "a little odd"
  and "a real problem" look different before a word is read.
- **Severity by hue on the column.** Amber is mild and crimson is serious. Green appears only when the corrected file
  is inside the limit. Status colours are used for status only (§3.2), and truthfully: "Sent again: still off" is no
  longer green.
- **Words cut.** The figure's words are halved (71 → 35 and 49 → 17), and the wrong "20× the limit" is gone.
- **Every state drawn** from the real function (`S/peer/r1/dq/proto/states.png`).

## Change

1. **Draw labels at 11 px or more.**
   - The chart's labels are 9 SVG units, so their rendered size depends on where the chart sits:

     | Where | Rendered size |
     |---|---|
     | Desktop paused-day card | 10.7 px |
     | Decide panel | 12.4 px |
     | Phone, with your bump | 11 px |

   - On the desktop card that covers "2× usual", "your ±2%: pauses below 264", "Sat 2" and "the 28 days before · usual
     269".
   - Raise the base from 9 units to 10, which renders about 11.9 px on the card and 13.8 px in the panel. Keep your
     phone bump.
   - Principles: §6 (seven sizes, 11 px the smallest) and §7 (type scale).
   - **Test:** every `.u-dq text` renders at 11 px or more at 1440×900 on 4a/03 and 4b/06, and at 390×844
     (`svgtext.cjs`).
2. **Keep the verdict in ink and put colour on the column alone.**
   - Today "2.0× usual" and "Sent again: …" are coloured as well as the column. That gives the figure two coloured marks,
     plus the green ↻ line under it in Decide.
   - An ink headline over a coloured column gives one highlight (§3.6 "grey everything, then highlight the one point";
     §7 clear hierarchy).
   - The owner's panel and my cause card already set the verdict in ink, so the three would agree.
   - **Test:** `.ufig .uv b` computes to `--ink` in every state.

## Conflicts

- **Owner: your figure wins in the Decide panel** (owner change 1).
  - When merging, drop the owner's serious-day rule that hides `.u-chart`, because it hides your chart (tested:
    `m-dq-owner-4b06.png`).
  - The combination works: `sketch-owner-with-dq-4b06.png`, 164 words.
- **Design (mine): severity, the overlap the coordinator flagged.** It is not a conflict but two channels of one rule:
  - **the hue says which.** That is your amber or crimson, and also the owner's badge;
  - **the volume says how loud.** My serious banner is filled and my mild banner outlined, and the cause card carries a
    3 px bar in the same hue.

  Changes on my side:
  - I will change my mild banner's outline from magenta-tinted to amber, so mild is amber everywhere.
  - The pause mark stays magenta on both, since it marks "paused", not how serious.

  Tested together in `m-dq-design-cards.png`: your column with my white cause card and its amber or crimson bar reads as
  one system.
- **My old-chart rules go.** `.ufig .u-ax/.u-ll/.u-v/.u-bv` at 11 to 12 px and the `.u-bars text` nudge enlarge your
  SVG labels to 13.9 to 15.2 px. Your figure keeps its own sizes.
