# Review: design's Decide and the file's view, fresh eyes (5-today 09–12; Decide in 2, 4a, 4b)

Reviewer: newcomer, someone from the business, first time on these screens. Focus sentences (round 3's):

- Decide: "Pick what readers see: the recommended choice is ready."
- The file's view: "This file, its state, and what depends on it, said simply."

## 1. Five seconds, before reading anything

Written down before I opened the proposal (`reviews/five-seconds-r4.txt`).

**Decide (`S/peer/r4/design/snap/5-today/12.png`)**

- **What I noticed first:** the blue RECOMMENDED card beside NOW, and the one blue button "Keep all of Tue Mar 26".
  Above them, "Arrived empty" with rows today 0 against usual 1,435.
- **What I'd do:** press Keep all of Tue Mar 26.
- **Matches the focus: yes.**

**The file's view (`S/peer/r4/design/snap/5-today/09.png`)**

- **What I noticed first:** the pink-outlined Access reviews card, "Paused today", 0 against 1,435, and Decide ›. To its
  right, a red arrow to "⧗ 11 waiting · Readers see Tue Mar 26 until you decide".
- **What else is there:** "Esc steps back" and the little Estate diagram by the breadcrumb.
- **What I'd do:** press Decide ›.
- **Matches the focus: yes.**

## 2. The seven tests

| # | test | Decide | file's view | evidence |
|---|---|---|---|---|
| 1 | Counts are icons | pass | pass | ⧗ 11 is one pill everywhere now (one height, size, weight and edge across five places) |
| 2 | A link is two to four words | pass | pass | "one per in-scope application", "evidence for"; the sentences are in the app's tip |
| 3 | One focus | pass | pass | Decide: the one smalt-framed card holds the one filled button. File: the red-outlined card holds Decide. |
| 4 | Every block says why | pass | **fail** | The file view keeps **"Esc steps back" and the Estate diagram**, and its own audit gives them "where this is, the way back". The breadcrumb beside them, "Data model › Application › Access reviews", says both. Since round 4 the opened kind folds the same two blocks into its "?", so after the merge the two adjacent levels would have different heads. That is two ways for one job, which is the seam this fix sets out to remove. |
| 5 | Pictures before words | pass | pass | today against usual is the same two bars in Decide, on the file and in Ctrl K; now against after is two pictures |
| 6 | Detail on demand | pass | pass | Decide's choices, why it paused and the month are behind More; the file's columns, outputs and sentences are behind a tap or a hover |
| 7 | Today is today | pass | pass | "What should readers see today? Wed Mar 27"; "Today" in the pictures; "Paused today", "rows today" |

**Words:**

- Decide 105 → 104 and the file's view 87 → 83 at 1440. On the phone: Decide 91 → 90, the file's view 66 → 62.
- No sideways scroll.
- The phone renders (`phone-decide-after.png`, `phone-file-after.png`) are clean: Decide stacks NOW over RECOMMENDED,
  with the button at the bottom; the file view leads with its card. On a phone the Esc hint and the diagram are already
  hidden.

**What I like, as a newcomer:**

- One badge, one bars picture, one month strip, one voice mark (✦) and one radius family across the five screens.
- The cost mark is grey, so crimson means only risk and the pause.
- "100% match" no longer carries an unexplained date.

## 3. Verdict: **disagree, on one block pair**

Decide passes all seven. The file view fails test 4.

**The change that would make me agree:** give the file view the opened kind's head. Put the estate's "?" (the marks,
how to point, Esc) in place of "Esc steps back" and the Estate diagram, so the breadcrumb is the one "where am I" on
both levels. In code this means the integrator drops the `S.level === 'dataset'` branch my round-4 patch left for
design's screen, and adds the "?" there as the kind level does. That is a few lines, and nothing else on either screen
moves.

## Re-check after Revision 1: **agree**

**Five seconds first** (the newest `S/peer/r4/design/snap/5-today/09.png`, before reading Revision 1):

- **What I noticed first:** the pink-outlined Access reviews card, "Paused today", 0 against 1,435 and Decide ›. Then the
  red arrow to "⧗ 11 waiting · Readers see Tue Mar 26 until you decide". The head reads "Data model › Application ›
  Access reviews ?", with no "Esc steps back" and no Estate diagram.
- **What I'd do:** press Decide ›.
- **Matches the focus:** yes ("This file, its state, and what depends on it, said simply").

**Test 4: pass.**

- The head is the opened kind's: the breadcrumb is the one "where am I". The "?" holds the marks and this level's way to
  act ("Open its columns, then tap one for its values · Esc steps back").
- The two levels now share one chrome. The hunk is a superset of mine, so the merge keeps one.
- "100% match · Tue Mar 26" is back at rest, on dq's point. I had liked it gone, but the date earns its place: today's
  file has 0 rows, so a bare "100% match" would read as today's. That is a block that answers "why is this here?" by
  keeping the fact true.
- The phone render (`phone-file-after.png`) is the card first, then 11 waiting, CMDB and evidence for. As on the opened
  kind, there is no "?" on a phone, and nothing scrolls sideways.

**All seven pass on both screens, and both five-second answers match their focus sentences.** Nothing left to change.
