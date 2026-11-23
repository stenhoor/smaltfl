# Review of design's fix (estate map, banner and Today), by owner, round 3

## 1. Five seconds, the after screenshot alone (`peer/r3/design/snap/5-today/01.png`), before reading anything

First I notice the pink banner across the top: **"Today is paused** · Access reviews arrived empty · ⧗ 11 waiting", with
the filled **Decide ›** at its right end. Then the pink-ringed *Access reviews* chip inside the Application card, and the
small ⧗ badges on the kinds. What I'd do: press **Decide ›** (or tap "⧗ 11 waiting" to see what waits first).

Focus sentence: "Today one file paused; this is what waits on it." My five seconds say exactly that: today is paused,
Access reviews is the file, ⧗ 11 wait, Decide. **Match.**

## 2. The seven tests (after `snap/5-today/01.png`, before `peer/snap4/5-today/01.png`, phone `phone-after.png`, proofs in `work/proof/`)

| # | Test | | What I checked |
|---|---|---|---|
| 1 | Counts are icons | pass | "⧗ 2", "⧗ 5", "⧗ 1", "⧗ 3" on the kinds and "⧗ 11 waiting" in the banner replace "2 outputs wait on Access reviews ›" and "so the 11 outputs built from it wait for your decision". Hover lists the 11 grouped by kind (`d-hover-banner.png`); focus and tap too (`d-focus-count.png`, `p-tap-banner.png`). |
| 2 | A link is two to four words | pass | "made up of", "runs on", "checked by", "approves exceptions to"; the sentences on hover with what carries each (`d-hover-link.png`). Note: "owns" is one word, a literal miss of "two to four", but it reads left to right ("Organisational unit owns Application") and is what the owner asked for (fewer words); I don't count it as a fail. |
| 3 | One focus | pass | The one tinted line with the one filled button; on the map the one red chip. My five seconds landed there. |
| 4 | Every block answers "why is this here?" | pass | The legend row and the hint fold into "?", "See what's built from it" goes (⧗ 11 holds it), "+ Add a dataset" drops to a text action so Decide is the only filled button. Nothing left I'd ask "why?" of. |
| 5 | Pictures before words | pass | The map is the picture; the banner is one line at 1440 (two on a phone, where three facts can't fit one line). |
| 6 | Detail on demand | pass | At rest: the state, the file, one number. Lists, link sentences and the marks' meanings behind hover, focus or tap. |
| 7 | Today is today | pass | "**Today is paused** Wed Mar 27", the date small, through one helper (`smDay`) the rest of us can call. |

Words 192 → 119 (01–03). Six walkthroughs, no page errors (`logs/`, checked).

## 3. Verdict: **agree**

All seven pass and my five-second answer matches the focus sentence. No change needed. Nits, for the merge: the Decide
panel's head should call `smDay` (my panel says "today" from the same day context and is ready for it); and if anyone
reads test 2 to the letter, "owns" is the one label under two words.
