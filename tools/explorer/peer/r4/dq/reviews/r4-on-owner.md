# dq on the owner's decision receipts as timeline rows (round 4)

**Verdict: agree.**

- **Focus sentence:** "What was decided, by whom, when, and what readers saw, in order."
- **Looked at:**
  - after: `S/peer/r4/owner/snap/2-problem-fix/19.png`, `13.png`, `14.png`;
  - `png/4a-odd-but-ok-12.png` and `png/4b-outlier-11.png`;
  - before: `S/peer/snap5/2-problem-fix/19.png` etc.;
  - phone: `png/2-problem-fix-19-phone.png`.

## 1. Five seconds, before reading anything

**19:**

- **What I noticed first:** the framed DECIDED card for Mon Feb 26, "MFA arrived empty". It is four rows down a line of
  marks: Paused (Mon 26, 05:25, ⧗ 11 held), Waited for the file (Alex Kim), Corrected file in (today 02:40, 0 → 2,318
  rows, every check passed), Published the corrected file (Alex Kim). Beside each row is what readers saw: Sun Feb 25,
  then Mon Feb 26 corrected.
- **What I'd do:** nothing more on this day; Wed Feb 28 ›.
- **Matches the focus?** Yes.

**13 and 14** (the same state):

- **What I noticed first:** paused 05:25 with ⧗ 11 held, then Alex Kim waited for the file, with readers on Sun Feb 25.
  "Next: the corrected file, early on Tue Feb 27".
- **What I'd do:** Tue Feb 27 ›.
- **Matches the focus?** Yes.

## 2. The seven tests

| # | test | result | note |
|---|---|---|---|
| 1 | Counts are icons | pass | "⧗ 11 held" / "⧗ 9 held". |
| 2 | A link is two to four words | pass | "Sloane Marsden's words ›", "your words ›", "Change this decision". |
| 3 | One focus | pass | The receipt is the one block, rows down one line of marks. |
| 4 | Every block answers "why is this here?" | pass | when, what, who, what readers saw, whose words, what changed in the corrected file. |
| 5 | Pictures before words | pass | A timeline of shaped marks (⏸ ⧗ ↻ ✓) and an eye for readers. Each row's text is one line. |
| 6 | Detail on demand | pass | Her words, the full "Deciding as" and the corrected file's check result are one tap or hover away. |
| 7 | Today is today | pass | One clock, the story's: "Today" via smDay, other days "Mon 26". The replay's "Nov 23, 17:38" is gone. |

## 3. Every time, name and number, against the record (build.json and the build's ISSUES)

| receipt | record |
|---|---|
| 2-problem-fix: paused Mon 26 **05:25** | Feb 26 `runAt` 2024-02-26T05:25Z ✓ |
| corrected file in **today 02:40** (Tue Feb 27) | story delivery 2024-02-27T02:40Z, `fixAt` "Tue Feb 27, 02:40" ✓ |
| **0 rows → 2,318 rows**, every check passed | `fixRows` 2318, `diff` "0 → 2,318 rows" ✓ |
| **⧗ 11 held** | MFA's 11 builds held ✓ |
| **Alex Kim** decided, wait then publish | the walkthrough's decider (`#dec-who`) ✓ |
| **Sloane Marsden's words** | her recorded reason ✓ |
| readers on **Sun Feb 25**, then **Mon Feb 26, corrected** | the day before; then the day as corrected ✓ |
| 4b: paused **05:25**, corrected file in **14:10** | Mar 21 `runAt` 05:25; story delivery 14:10, `fixAt` "Thu Mar 21, 14:10" ✓ |
| 4b: **1,630 rows, each twice → 815 rows, each once** | `fixRows` 815, `diff` "1,630 → 815 rows" ✓ |
| 4b: ⧗ 11, readers Wed Mar 20, then Thu Mar 21 corrected | ✓ |
| 4a: paused **05:25**, ⧗ 9 | ✓ |
| 4a: "Exceptions −2.6%" | 262 against 269 ✓ |
| 4a: readers Fri Mar 1, then Sat Mar 2 as it arrived | ✓ |

**The decisions carry their day and no time.** That is right: the replay's wall clock isn't the story's, and the
owner's rows no longer pretend it is.

## 4. Change

None needed.

**Nit, not the owner's screen:** on 13 and 14 the banner still says "your call · Decide ›" after the wait was recorded.
The owner names it as the newcomer's one-line edit at the merge.
