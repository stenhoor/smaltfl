# Look inside a file: what it is, and whether it's fine today

**Screen:** Ctrl K look-inside (journey 5-today, step 07: type "mfa", then Tab). **Focus:** "What this file is and
whether it's fine today." **Owner:** dq.

The owner said: "feels maybe too busy. I like the what is this, the image seems confusing at first glance and I would
rather discover the more in detail stuff if I want to dive in so I am not overwhelmed."

S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`. Every path below is under S.

![before and after](png/5-today-07-before-after.png)

## What changed (subtract first)

1. **The preview now holds three things.**
   - **Its state:** one chip, shape and word. A paused file also shows `⧗ 11`.
   - **Its number:** today's rows against a usual day's, as two bars on one scale from zero, each labelled where it ends
     ("rows today 2,329", "usual 2,322").
   - **What it is:** the line the owner likes, at most two lines.
   - **Gone:** the rows-each-day chart (27 bars of nearly the same height, an axis of 2,438 to 0, a band key and two
     dates); the column list, which repeated the list beside it; the joins; and "11 outputs are built from it; 10 wait on
     Access reviews", which is another file's trouble said on MFA's card.
2. **The list inside a file folds its columns into one line**, "Its columns · 5". Pointing at it lists them in the
   preview; ↵ or a tap lists them in the list, to pick one. "Sort, filter, tap a value" is gone, since "Explore MFA's
   rows" says it.
3. **The rest is one line away and is not repeated:**
   - the month: "How has MFA been this month?", the day strip the owner liked;
   - the joins: "What does MFA join?";
   - what depends on it: "What is built from MFA?", or a tap on a paused file's ⧗;
   - the columns: "Its columns · 5".
4. **Every file's preview gets this**, wherever it shows: a search result, "Open X" inside a file, a file inside a kind.
   On a screen too narrow for the preview pane (phone, tablet upright), the "Open X" line carries the same chip, bars and
   line. Before, a phone saw no state at all.
5. **What's true, fixed on the way:**
   - Requirements' description was cut at "ISO/IEC 27001:" and read "2022, PCI DSS v4.0.1, SOC 2), with how the two
     relate".
   - "Explore Access reviews's rows" now reads "Explore Access reviews' rows".
   - The "Fine today" hover claimed Larkspur's ±5% band. A file can carry a tighter limit of your own, which the
     preview's model doesn't know, so the hover now says only what is always true: "No check stopped or warned on it
     today · 2,329 rows, +0.3% from usual".

## The seven tests

| # | test | result | how |
|---|---|---|---|
| 1 | Counts are icons | **pass** | The one count is a paused file's `⧗ 11`. Hover lists the 11 outputs, a tap opens "What is built from Access reviews?". The sentence "11 outputs are built from it; 10 wait on Access reviews" is gone. |
| 2 | A link is two to four words | **pass** | The palette shows no relation links. The lines behind the scrim are the estate map's, which is design's screen. |
| 3 | One focus | **pass** | "MFA ✓ Fine today" over two bars of the same length, at the top of the preview. "Open MFA" is the one highlighted action. |
| 4 | Every block answers "why is this here?" | **pass** | See the purpose audit. Nothing without a reason is left. |
| 5 | Pictures before words | **pass** | The state is a shape and a word. The number is a picture: same length means a usual day, an empty file is a crimson stub at zero, twice the rows is twice the bar. The one text block is "what is this", at most two lines, kept because the owner asked for it. |
| 6 | Detail on demand | **pass** | First what it is, its state and one number. The month's chart and strip, the columns, the joins and what is built from it are each one line away in the list, not on screen. |
| 7 | Today is today | **pass** | The palette says "today" and shows no date for the current day. The chart's "Fri Mar 1 … Wed Mar 27" and "match on Wed Mar 27's files" are gone. The banner behind is design's. |

## Before and after

| | before | after |
|---|---|---|
| desktop 1440x900 | `peer/snap4/5-today/07.png` | `peer/r3/dq/snap/5-today/07.png` (also `peer/r3/dq/png/5-today-07-after.png`) |
| phone 390x844 | `peer/r3/dq/png/5-today-07-before-phone.png` | `peer/r3/dq/png/5-today-07-after-phone.png` |
| tablet 820x1180 | | `peer/r3/dq/png/5-today-07-after-tablet.png` |
| side by side | `peer/r3/dq/png/5-today-07-before-after.png` | |

**Visible words** (render.cjs):

| | before | after |
|---|---|---|
| whole screen, 1440x900 | 405 | 257 |
| the palette | 213 | 65 |
| its preview | 105 | 27 |
| its list | 95 | 25 |
| phone, 390x844 | 179 | 157 |
| text not hidden under the palette | 322 | 196 |

- **The map behind:** the other 192 words of the whole screen are the map behind the scrim, which is design's screen.
  render.cjs counts it even under the opaque palette. Step 08, the same map with the palette closed, has 217.
- **Not hidden:** the last row counts only text that isn't under the opaque palette (`peer/r3/dq/tools/seen.cjs`).
- **Elsewhere:** no other step of any walkthrough moved (see Works).
- **Sideways scroll:** none at any size.

## Five-second test (my own, cold, on the after screenshot)

**First thing I notice:** in the preview, a dark bar, "rows today 2,329", over an equal grey one, "usual 2,322", under
"MFA ✓ Fine today". MFA is fine today, the same as a usual day.

**What I'd do:** press ↵ to open MFA, or arrow down to ask what it joins or to see its 5 columns.

**Matches the focus sentence?** Yes: "What this file is and whether it's fine today."

**For a paused file** (`work/states/e6-access-inside.png`): "⏸ Paused today ⧗ 11" and a crimson stub at 0 against 1,435.
It says "paused" plainly, by shape, word and colour.

## Purpose audit (every block on the screen)

| block | why it is here, in the user's terms |
|---|---|
| ‹ MFA, in the search bar | Where I am (inside MFA); ‹ or ⌫ steps back out |
| "Search in MFA, act or ask" | I can find something inside MFA, or ask about it |
| Esc | How to close |
| "MFA" over the list | What the lines below act on |
| **Open MFA** · Application (picked, ↵) | The main thing to do: open the file's own view |
| Explore MFA's rows | See the rows themselves |
| What does MFA join? | Its joins, when I want them; pointing at it shows the answer beside the list |
| What is built from MFA? | What depends on it, when I want it |
| How has MFA been this month? | The month as a strip of days, when I want it |
| Its columns · 5 | What it holds: pointing lists the columns beside the list, ↵ lists them to pick one |
| Preview head: MFA · Dataset · Application | What it is: its name and the kind it describes |
| ✓ Fine today (hover: no check stopped it, +0.3% from usual) | Whether it's fine today |
| ⧗ 11, only for a paused file | What waits on it; hover lists them, a tap answers which |
| rows today ▬▬ 2,329 · usual ▬▬ 2,322 | The one number that says so, drawn: same length, same as usual |
| "The identity provider, the share of users registered…" | What is this, in plain words (the owner likes it) |
| ↑ ↓ move · ↵ run · ⌫ back · Esc close | How to drive it from the keyboard |
| ✦ Answers come from this page's data | Where the answers come from |

**Folded or gone, with where each went:**

| block | where it went |
|---|---|
| Rows each day chart, axis, band key, dates | gone; the month is "How has MFA been this month?" |
| ": inside the check's ±5% band" on the chip | gone; the chip's hover says why it's fine |
| Columns · 5 in the preview | folded under "Its columns · 5" |
| Joins · match on Wed Mar 27's files | behind "What does MFA join?", and each column's own preview |
| "11 outputs are built from it; 10 wait on Access reviews" | behind "What is built from MFA?" |
| The list's five column rows with meanings and types | folded under "Its columns · 5" |
| "Sort, filter, tap a value" | gone |

## Every state, checked on the live app

All in `peer/r3/dq/work/states/`. No page errors.

| state | file |
|---|---|
| Fine | `e1-mfa-search.png`, `e2-mfa-inside.png` |
| Columns pointed at | `e3-mfa-columns-pointed.png` |
| Columns listed, a column picked | `e4-mfa-columns-listed.png` |
| Paused, from search | `e5-access-search.png` |
| Paused, inside the file | `e6-access-inside.png` |
| ⧗ tapped, giving the list | `e7-access-wait-tapped.png` |
| Planned, no number | `e8-sbom-planned.png` |
| No usual size, so "46 rows today" | `e9-platform-list.png` |
| The description no longer cut | `e10-requirements-desc.png` |
| Inside a kind | `e11-kind-scope-dataset.png` |
| Dark | `d1-access-inside-dark.png` |
| 1180 wide | `t1-mfa-inside-1180.png` |
| Unusual, decided, noted | `chips-3.png` |

**The build's days, from the walkthroughs' seeds:**

| day | file | what it shows |
|---|---|---|
| Feb 26, MFA empty | `b-feb26-mfa.png` | a stub at 0 against 2,314 |
| Mar 2, Exceptions | `b-mar2-exceptions.png` | 262 against 269, nearly equal bars: a little odd |
| Mar 21, TLS | `b-mar21-tls.png` | 1,630 against 813, today's bar twice as long: a real problem |

The last two tell "a little odd" from "a real problem" at a glance.

**A paused file on a phone, live:** `peer/r3/dq/png/access-reviews-inside-phone-live.png`. No sideways scroll.

The probes are `peer/r3/dq/tools/states.cjs`, `chips.cjs` and `phone.cjs`. They wait for what they change and use no
fixed sleeps.

## Works

**All six walkthroughs ran on `peer/r3/dq/app/` in snapshot mode, unchanged**, each with its seed. Each ends with
"no page errors". Logs are in `peer/r3/dq/logs/`, snapshots in `peer/r3/dq/snap/<walkthrough>/`.

| walkthrough | seed |
|---|---|
| `scripts/v5_today.cjs` | none |
| `v3_explore.cjs` | none |
| `v2_fix.cjs` | `video/seed-feb26.json` |
| `v4a_odd.cjs` | `video/seed-mar2-rows2.json` |
| `v4b_outlier.cjs` | `video/seed-mar21.json` |
| `v1_setup.cjs` | none |

**Nothing else moved.** The six walkthroughs have 92 steps, the same count as before. Of those, 91 keep the visible
words of `peer/words-r37.txt` and `peer/words-r37-today.txt`. Only 5-today/07 changed, 405 → 257
(`peer/r3/dq/work/words-after.txt`).

**v3's path still holds:** Ctrl K, "mfa", ↵ opens MFA's view. That view says "2,329 rows today · usually about 2,322",
the same two numbers as the preview's bars.

No script needed a change: nothing they point at moved.

## Files

| what | path |
|---|---|
| The app | `peer/r3/dq/app/` |
| The patch | `peer/r3/dq/patch.diff` (+89 −21) |
| Each change and where | `peer/r3/dq/changes.md` |
| Snapshots | `peer/r3/dq/snap/<walkthrough>/` |
| Logs | `peer/r3/dq/logs/` |
| Words per step | `peer/r3/dq/work/words-after.txt` |

**Not changed on purpose:**

- the asks' answers (the newcomer's screen);
- the palette's chrome;
- the kind preview;
- a column's own preview;
- the map behind;
- the walkthrough scripts.
