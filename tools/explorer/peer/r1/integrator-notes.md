# Integrator's own read (before seeing the proposals)

Written down so I judge the five proposals against my own view instead of adding them up.

## Setup, after reading the CMDB (1-setup/16)

- Org unit and Platform are already on the map, dashed, with relation sentences ("Applications are owned by units").
  They appeared when the CMDB was read, and the evidence (owner_team_id values found in org_unit_id) is never shown.
  This is the owner's "joined up to a bunch of things and I don't know why".
- The Next card's only hint is "CMDB names 176 units; this file lists them".
- Missing step: show the match between the two columns, ask, then draw the line.

## A paused day (2-problem-fix/02)

The same fact is said several times:

- **Paused**: the banner, the panel title, the cause card's mark and the calendar mark.
- **The 11 held outputs**: as chips on the map's bottom strip and again in the panel.
- **Decide**: the banner's link and the panel's filled button.

Everything else is noise:

- The cause card has a pink tint, a 2 px border, a "serious" chip, five lines of numbers and a ±10% chart.
- The map's relation sentences compete with the decision.
- Two months of calendar cells sit above the cause.

The one focal point should be "MFA came empty: 0 rows where about 2,314 are usual", with the picture beside it and one
action.

## Decide (4b-outlier/06)

- 814 visible words, counting the map behind the panel.
- The panel has two columns of evidence, two choice cards and a recommendation chip.
- The quoted reason appears twice: once in the choice card and again on the record line.
- A whole sentence of evidence: "both rows identical, none conflicting… status changed on 27 rows, 35 the day before…".
- The answer the owner needs: **publish the corrected file (recommended, by Sloane Marsden); readers then see 815
  rows, about usual.** Everything else can be one tap away.

## What I'll hold every proposal to

- Fewer words: a decision screen at 250 or fewer, any other screen at 200 or fewer.
- One accent: smalt for the action. Status colour only on the status mark. No tinted blocks.
- One focal point and one primary action per screen.
- Show the step that is skipped today: the join evidence before the link is drawn.
- Truthful, buildable in `build.js`, `explore.js` and `index.html`, and working on a phone.
