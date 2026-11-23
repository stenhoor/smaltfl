# Critique: dq (data quality analyst)

My job on these screens: tell "a little odd" from "a real problem" at a glance, trust every number I'm shown, and
check that the banner, the picture, the panel and the receipt say the same thing. Numbers below come from the
snapshots' own markup (`peer/snap/*/NN.html`) and the prototype's code (`explore/build.js`, `usualFig`, `figLimits`).

## Scores, the product as it is now

| easy_to_find | easy_to_do | images_over_words | trust | overall |
|---|---|---|---|---|
| 3 | 3 | 2 | 2 | 3 |

The evidence is rich and mostly consistent. The banners, panels and receipts agree on held outputs (9, 11, 11), rows
(262, 1,630, 0) and who decided. The one picture meant to separate odd from serious fails at it, though, and a few
numbers are worded or rounded in ways I can't take on trust.

## Problems, worst first

### 1. The "how far from usual" chart makes a little odd and a real problem look alike
- **Where:** 4a/03 against 4b/02 and 2/03; the same figure in the Decide panels (4a/07, 4b/06, 2/07, 2/17).
- **What is wrong:** the line chart that says "how far" uses a fixed ±10% scale, and anything beyond it is pinned
  to the edge.
  - Exceptions' −2.6% (262 against 269) is drawn about 10 units from "usual".
  - TLS's +100% (1,630 against 813) and MFA's −100% (0 rows) are a small triangle about 40 units away.
  - So the truth is 38 times as far, but the picture shows 4 times.
  - The only honest mark, the two bars from zero at the left, is the smallest thing on the card.
- **What I was doing:** deciding whether Saturday is worth a pause. I should see "level with usual" for 4a and "twice
  as tall" for 4b before I read a word.
- **Principle:** §3.6 (bars start at zero; plot a change on the same scale as the normal); §5 Datadog (a threshold
  is a line, and the alert says how far beyond the band the value is).

### 2. The picture's colour contradicts the severity word
- **Where:** 4a/03 and 4a/07 against 4b/02 and 2/03.
- **What is wrong:** 4a's chip says **mild** in amber and its card is amber-washed. Its bar, dot and value are still
  crimson (`where = 'bad'` whenever the limit is passed), the same crimson as TLS and MFA. The severity has no shape
  in the picture, only in a chip's word.
- **What I was doing:** reading how serious it is. Two signals on one card disagree.
- **Principle:** §6 (colour by role; never colour alone); §3.2 (the accent goes on the one thing that needs
  attention).

### 3. "1.3× the limit" and "20× the limit" say the wrong thing
- **Where:** 4a/03 ("Past your ±2% limit (1.3× the limit)"), 4b/02 and 2/03 ("Far past the ±5% limit: 20× the
  limit").
- **What is wrong:**
  - It is the overshoot as a multiple of the allowed percentage (100.5% ÷ 5%), but it reads as a multiple of the
    limit itself: 20 × 853 rows would be 17,060.
  - MFA (0 rows, below) and TLS (1,630 rows, above) both get "20× the limit".
  - Rows past the line say it plainly: Saturday is 2 rows past 264.
- **What I was doing:** checking how far past the line it is, in the data's own unit.
- **Principle:** §3.9 (real content, units said once); §3.3 (labels).

### 4. The same number three to five times on one card, and a legend instead of labels
- **Where:** 4a/03, the cause card.
- **What is wrong:**
  - 262 is said five times: the cause line, the caption twice, the bar and the dot.
  - The limit is said three ways: "±2%", "below 264 or above 274", and a note under the card ("Rows check · pauses
    beyond ±2%, as you set it (Larkspur's pauses beyond ±5%)").
  - Three caption lines above the chart restate the chart, and a legend below it explains its lines.
- **What I was doing:** finding the one fact that decides it.
- **Principle:** §2 (the same fact said in three places; words doing a picture's job); §3.6 (label directly, not in a
  legend).

### 5. Off-scale values are labelled at the wrong height
- **Where:** 4b/02, 2/03, 4b/06 and 2/17.
- **What is wrong:**
  - TLS's "1,630" sits at about +6% on a ±10% axis, and MFA's "0" at about −7.5%.
  - In the sent-again pictures, a dashed arrow runs from the pinned triangle to the green dot, as if the first file
    had been 6% high.
  - A number placed on an axis reads as that axis's value.
- **Principle:** §3.6 (annotate the point with its meaning; plot the change on the same scale).

### 6. Video 1: the 184-day test of a rule hides its own evidence
- **Where:** 1/11, 1/12 and 1/13.
- **What is wrong:**
  - The offer "Allow up to 15% blank instead" is not drawn on the history until it is taken.
  - Once taken (1/13), the 15% line sits on the 14.4% series and the labels print over each other ("14.4%" on
    "15%"), so the room it leaves (0.6 points, about 15 rows) can't be read.
  - The offer is a filled primary button in the middle of a sentence that wraps around it.
- **What I was doing:** checking that the tolerance is tight enough to catch a rise and loose enough not to cry wolf.
- **Principle:** §5 (a threshold is a line); §3.8 (show the evidence when the machine infers something).

### 7. Video 1: a range that disagrees with its own check by one row
- **Where:** 1/07, the rule "About as many rows as on a usual day".
- **What is wrong:**
  - It says "usual 2,390, ±5%: 2,271–2,510".
  - 2,510 is +5.02%, which the check pauses (`Math.abs(off) <= L`).
  - The figure for the same limit says "above 2,509" (floor).
  - The rule list rounds where the check and the figure floor.
- **What I was doing:** trusting the boundary numbers. A one-row disagreement at the edge is the kind of thing an
  auditor finds first.
- **Principle:** §3.9 (real numbers); §6 (plain words, said once and the same everywhere).

### 8. The Decide panel for a mild day says why it is mild three times, in about 960 words
- **Where:** 4a/07 and 4a/08.
- **What is wrong:** the panel says it three times:
  - "Larkspur's ±5% wouldn't pause it" in the figure;
  - "Only your ±2% limit paused this … Larkspur's ±5% on none" in the tune box;
  - "inside Larkspur's ±5%" in the recommendation.

  The two numbers that make it a little odd (262 against 264) are on the left, in 9-pixel chart labels.
- **Principle:** §3.7 (the answer first, the evidence one tap away); §2.
