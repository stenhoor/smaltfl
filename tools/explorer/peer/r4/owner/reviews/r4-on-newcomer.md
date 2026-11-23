# Review of the newcomer's fix (estate map, banner, Today, an opened kind), by owner, round 4

## 1. Five seconds, the after screenshots alone, before reading anything

**3-explore/04, Application opened** (`peer/r4/newcomer/snap/3-explore/04.png`): first the big Application card in the
middle: "2,416 applications · 15 datasets", the red "1 paused" chip and "⧗ 5"; inside it two labelled groups, "The
register: every application" (CMDB, SBOM inventory dashed) and "Evidence about each application · 13", where Access
reviews is the one red chip. Around it Organisational unit ("owns applications", ⧗ 2), Platform ("hosts applications",
⧗ 1) and Control ("checks applications", ⧗ 3); a small "Today is paused · Decide ›" pill top right. What I'd do: tap
the red Access reviews chip, or Decide ›.

**5-today/01, the estate** (`5-today/01.png`): the pink banner first, "**Today is paused** Wed Mar 27 · Access reviews
arrived empty · ⧗ 11 waiting" with the filled Decide ›, then the red Access reviews chip and the ⧗ counts on the kinds.
What I'd do: press Decide ›.

Focus sentence (round 3's): "Today one file paused; this is what waits on it." Both match: today one file (Access
reviews) paused, and what waits is ⧗ 11 in the banner, ⧗ 5 / 2 / 1 / 3 on the kinds.

## 2. The seven tests (after: `snap/3-explore/04.png`, `03.png`, `5-today/01.png`; before: `peer/snap5/3-explore/04.png`; phone `phone/kind.png`, tablet `shots/kind-tablet.png`)

| # | Test | | What I checked |
|---|---|---|---|
| 1 | Counts are icons | pass | ⧗ 5, ⧗ 2, ⧗ 1, ⧗ 3 and "‖ 1 paused"; the neighbours' files as squares. |
| 2 | A link is two to four words | pass | Before: "Applications are owned by units / via CMDB · on owner_team_id", two such pairs on Platform and on Control. After: "owns applications", "hosts applications", "checks applications", the sentences on hover; pointed at on the estate, a link shows its sentences (full sentences on hover, as the test asks). |
| 3 | One focus | pass | The Application card with its one red file; first on a phone and tablet now, Access reviews on the first screen. |
| 4 | Every block answers "why is this here?" | pass | The marks row, the pointing hint, "Esc steps back" and the "Estate" mini map, each repeating the breadcrumb, the cards or "?", fold into "?" or go. |
| 5 | Pictures before words | pass | The files are the picture; each neighbour has one short line. |
| 6 | Detail on demand | pass | "joined on app_id" and every "via … on column" line move to hover; no column name at rest. |
| 7 | Today is today | pass | "Today is paused Wed Mar 27" in the banner and in the bar's pill on the kind (desktop). |

Words: the opened kind 168 → 95, the pointed estate 143 → 127, the estate at rest unchanged (119). Six walkthroughs, no
page errors (`logs/`, checked).

## 3. Verdict: **agree**

All seven pass and my five-second answers match the focus sentence. No change needed. A nit for the merge (design's
helper, not this screen's): below 1440 px the bar's pill shrinks to "‖ Decide ›", so on a phone or tablet the opened kind
names no day at all; "‖ Today · Decide ›" would keep test 7 there too.
