# The estate map on a paused day: Today, one file, what waits

**Screen:** the estate map, its banner, and Today everywhere (5-today, steps 01 to 03).
**Focus:** "Today one file paused; this is what waits on it."

All paths are under `S = /tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.

| | before | after |
|---|---|---|
| desktop, 1440×900 | `S/peer/snap4/5-today/01.png` | `S/peer/r3/design/snap/5-today/01.png` |
| phone, 390×844 | `S/peer/r3/design/work/phone-before.png` | `S/peer/r3/design/phone-after.png` |
| visible words, steps 01–03 | 192 | 119 |
| visible words, phone | 78 | 72 |

The owner's failing example is `S/peer/r3/owner-feedback/1-estate-map.png`.

## The seven tests

| # | test | | how |
|---|---|---|---|
| 1 | Counts are icons | pass | Each kind shows ⧗ 2, ⧗ 5, ⧗ 1 or ⧗ 3, and the banner shows ⧗ 11 waiting. Hover, focus or a tap lists the outputs (`work/proof/d-hover-count.png`, `d-focus-count.png`, `p-tap-banner.png`). |
| 2 | A link is two to four words | pass | The links read "made up of", "owns", "runs on", "checked by" and "approves exceptions to": three words at most, none reaching four. Hovering one gives its sentences and what carries each (`d-hover-link.png`), and pointing at a kind gives them in full, as before. |
| 3 | One focus | pass | The one tinted line holds Today's state, the file, the count and the one filled button. On the map, Access reviews is the one red chip. |
| 4 | Every block has a reason | pass | See the audit below. The legend and the hint fold into "?", and "See what's built from it" goes. |
| 5 | Pictures before words | pass | The map is the picture. The banner is one line, and each tip is a list. |
| 6 | Detail on demand | pass | At rest you see the state, the file and one number. The lists, link sentences, columns and marks' meanings sit behind a hover, a focus or a tap. |
| 7 | Today is today | pass | The banner reads "Today is paused" with Wed Mar 27 small. Every banner state, the top bar and the Build panel's day say it too, through one helper, `smDay`. The data stays in the past. |

Test 2 note: "owns" is a single word. It is the plain reading of the line from left to right ("Organisational unit owns
Application"). "Owned by" would read backwards there.

## My own five-second test (the after screenshot, cold)

What I noticed first: a pink line saying *Today is paused · Access reviews arrived empty · ⧗ 11 waiting*, with a blue
**Decide ›** at its end. On the map, Access reviews is the one red file.

What I'd do: press Decide, or first point at ⧗ 11 to see what waits.

That matches the focus sentence.

## Purpose audit

| block | why it is here, in the owner's terms | now |
|---|---|---|
| App bar (estate, views, search) | where I am, and Ctrl K to ask | kept |
| "Data model" | which view this is | kept |
| "?" by the title | what the marks mean, when I want to know | new; the legend row and the hint fold into it |
| Legend row (paused, waits on it, warned, planned) | the same as "?" | folded |
| "Point at a kind… tap a sentence to see what carries it" | how to explore the map | folded into "?" as one line |
| "+ Add a dataset" | add a file the model lacks | kept as a text action, so Decide is the one filled button |
| Banner: Today is paused, date small | today's state, the first thing to know | rewritten |
| Banner: Access reviews arrived empty | which file and what happened to it | kept, shorter |
| Banner: ⧗ 11 waiting | how much is held, and on demand which outputs | the sentence became a count |
| Banner: "See what's built from it" | the same as ⧗ 11's list | gone |
| Banner: Decide › | the one thing to do | kept |
| Kinds, each with its count line | what the business is made of | kept |
| Dataset chips | the files; the paused one is the red one, a planned one dashed | kept |
| ⧗ count on each kind | what of that kind waits; its list on demand | the pill sentence became an icon and a number |
| ↻ reports into another unit, ↻ managed by another person | how a kind relates to itself | kept (4 words) |
| Link labels | how two kinds relate, in a few words; the sentences on demand | rewritten |

## What else it shows, proven

- `work/proof.cjs` runs 31 checks on the live page and all 31 pass (`work/proof/proof.json`):
  - at desktop: hover, focus, Enter, Escape, click-to-keep and click-away on the counts;
  - the banner's eleven, by kind;
  - a link's sentences, and pointing at a kind;
  - the "?";
  - an opened kind's ⧗ 5;
  - the top bar's Today;
  - the decided-for-now banner (`d-decided.png`);
  - by touch on a phone, with nothing scrolling sideways;
  - the dark scheme (`dark-hover-banner.png`).

  It waits on the page's own state (frames, the tip's fade), never a fixed time.
- On a narrower window the words still read the right way. 820 wide reads "Person works in Organisational unit",
  "Control checks Application" (`work/tab-820.png`); 1180 wide reads "Organisational unit made up of Person"
  (`work/tab-1180.png`).
- While building, the same words show, and the evidence for each link stays under them: "owns / owner_team_id → not read
  yet" (`snap/1-setup/06.png`). Where another relation leads, the evidence keeps its own sentence: "app_tag · 4 rows not
  found" stays Cloud assets', not "runs on" (`snap/1-setup/22.png`).
- The Build panel's day reads "Today Mon Feb 26" and its banner "Today is paused Mon Feb 26 · … · ⧗ 11 held"
  (`snap/2-problem-fix/01.png`, `snap/4b-outlier/01.png`).
- All six walkthroughs pass on `app/` in snapshot mode, each with its seed, and none has page errors (`logs/`):
  `v5_today`, `v1_setup`, `v2_fix`, `v3_explore`, `v4a_odd`, `v4b_outlier`. Their scripts are unchanged.
- Visible words for every step are in `work/words-compare.txt`: 26,461 before and 24,568 after across the 92 steps. The
  most a step gains is 1, where the top bar now adds the word "Today".

## Not done here

- The kind and file levels keep their legend row. The file view is builder's this round, so the "?" can replace that row
  after the merge (one line).
- At the kind level, the side cards keep their sentences.
- The dates in the Decide panel, Ctrl K and look-inside belong to the owner, newcomer and dq. Each calls `smDay` (see
  `changes.md` §1).
