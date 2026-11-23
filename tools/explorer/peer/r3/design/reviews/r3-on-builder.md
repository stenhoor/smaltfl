# design on builder's fix: the file's view (5-today 09–10)

## 1. Five seconds, cold (written before reading anything)

Screenshot: `S/peer/r3/builder/shots/5-today-09-after.png`.

- **First noticed:** the Access reviews card in the middle of an otherwise calm map. It has a crimson **Paused today**
  chip, "0 rows today · usually about 1,435" and a blue **Decide ›**.
- **Then:** a crimson arrow out to "⧗ 11 outputs wait on it · If this file is wrong, these show wrong numbers".
- **Quieter around it:** "one row per application · CMDB 100% match" on the left and "evidence for · Quarterly access
  review" below.
- **What I'd do:** press Decide, or first open the 11 to see what waits.

## 2. The seven tests, after reading `proposal.md`

I compared against the before (`S/peer/snap4/5-today/09.png`, 10) and looked at the phone render, the list opened, the
columns opened, and the hover sentences in `snap/5-today/09.html`.

- **Words:** 343 → 88 by my own count (`render.cjs`), on both 09 and 10.
- **No sideways scroll.**

| # | test | | what I saw |
|---|---|---|---|
| 1 | Counts are icons | pass, with a note | What depends on the file is "⧗ 11", its number set large, with the list behind a tap. The eleven "waits" lines are gone. This is the wording the plan asked for on this block ("Used by 11 outputs, 10 waiting ›", value said once). But the head "11 outputs wait on it" repeats the "wait on" words the owner disliked on the map (see the change below). |
| 2 | A link is two to four words | pass | "one row per application" (4), "evidence for" (2). The full sentences are on hover (`title`): "Each row is one application in CMDB, matched on app_id: 1,438 of 1,438 rows on Tue Mar 26…". |
| 3 | One focus | pass | The red-outlined card with "Paused today", **0** rows and the one filled Decide. The red arrow from it ends at ⧗ 11. |
| 4 | Every block has a reason | pass | Each block says what one row is (and that every row is a known application), which control it proves, and what depends on it with why that matters ("If this file is wrong, these show wrong numbers"). The kind tile told the same fact twice and is gone; the key went too. |
| 5 | Pictures before words | pass | The file sits in the middle with what hangs off it on three sides, and the pause's reach is the one red arrow. Each block is one line. |
| 6 | Detail on demand | pass | First comes "0 rows today · usually about 1,435". The columns are behind "6 columns ›", the outputs behind ⧗ 11, and the join and scope on hover. |
| 7 | Today is today | pass | It says "Paused today" and "0 rows today", and no current date appears on the screen. |

**Five seconds against the focus sentence** ("This file, its state, and what depends on it, said simply"): it matches.

## 3. Verdict: agree

1. **The change that matters: make the count's head "⧗ 11 waiting ›",** as the banner says it, and keep the value line
   under it. "11 outputs wait on it" is the owner's disliked map phrase moved to this screen. After the merge the app
   would then say the same count the same way in three places:
   - the map: ⧗ 5 and its tip;
   - the banner: ⧗ 11 waiting;
   - the file: ⧗ 11 waiting.
2. **The sentences are native `title` tooltips,** so they appear on hover only, never on focus or a tap. On a phone a
   tap on the card goes to CMDB instead. After the merge, use the shared tip (`data-tip` with a `TIPS` entry, `#smtip`
   in my fix), so the hover, focus and tap behave as on the map's links.
3. **"100% match · Tue Mar 26" leaves the date unexplained at rest.** Keep "100% match" and move "on Tue Mar 26's file
   (today's is empty)" into the hover.
