# dq on the builder's fix: the file's view (5-today steps 09 and 10)

**Verdict: disagree.** One line, on exactly the day this screen is about, says the opposite of what is true. The fix is
one line.

- **Focus sentence:** "This file, its state, and what depends on it, said simply."
- **Looked at:**
  - after: `S/peer/r3/builder/shots/5-today-09-after.png`;
  - before: `S/peer/snap4/5-today/09.png`;
  - opened: `shots/open-list-1440.png`;
  - not paused: `shots/tls-1440.png`;
  - phone: `shots/5-today-phone-02.png`.

## 1. Five seconds, before reading anything

**What I noticed first:**

- the red-outlined "Access reviews" card, "Paused today";
- "0 rows today · usually about 1,435" and the blue "Decide ›";
- the red arrow to "⧗ 11 outputs wait on it".

**What I'd do:** press Decide.

**Matches the focus?** Yes.

## 2. The seven tests

| # | test | result | note |
|---|---|---|---|
| 1 | Counts are icons | pass, borderline | ⧗ 11 is the big mark and the list is behind a tap. But "11 outputs wait on it" is the very phrase the owner asked to become an icon ("the things that say wait on are too many words"). "⧗ 11 outputs ›" would say the same, since ⧗ already means "waits". |
| 2 | A link is two to four words | pass | "one row per application", "evidence for", "outputs wait on it". The full sentences are on hover. |
| 3 | One focus | pass | The card, "Paused today", the 0 and the one filled button. |
| 4 | Every block answers "why is this here?" | pass | What it is, its state, what one row is, what it proves, what depends on it. |
| 5 | Pictures before words | pass | The map is the picture, and the red arrow shows where the pause reaches. |
| 6 | Detail on demand | pass | "6 columns ›", the outputs behind ⧗ 11, the join on hover. |
| 7 | Today is today | pass | "Paused today", "0 rows today". The only date is Tuesday's match, which is data in the past. |

## 3. Every number

Every figure is the prototype's own:

| figure | where it comes from |
|---|---|
| 0 today, usual 1,435 | `rowsUsual` [1433, 1437] |
| 1,438 of 1,438 matched on Tue Mar 26 | the join's `match`; Tuesday's count was 1,438 |
| 6 columns | the file's columns |
| 11 outputs | its builds, all waiting |
| Quarterly access review | `controlName` |

On TLS, "Used by 11 outputs · ⧗ 10 held today by Access reviews" corrects the old screen's "10 outputs use it", which
counted only the held ones. Good.

**But one line is untrue on this day.**

**"If this file is wrong, these show wrong numbers"** sits under "⧗ 11 outputs wait on it", and only on the paused file.
TLS shows another line.

- Today the file *is* wrong: it arrived empty.
- Yet the 11 do **not** show wrong numbers. They wait, and readers see Tue Mar 26.
- So the sentence invites the reader to conclude the outputs are wrong now.
- Opened, the card prints both lines one under the other, contradicting itself: "If this file is wrong, these show
  wrong numbers" / "Readers see Tue Mar 26 until you decide".

## 4. The change that would make me agree

**On a paused file, the outputs card's second line should say what is true today:** "Readers see Tue Mar 26 until you
decide". That line already exists, in the opened state.

**Keep "If this file is wrong, these show wrong numbers" for a file that isn't paused**, where it explains why the
outputs matter.

**Smaller, not a condition:** "one row per application" drops the rows entry's scope.

- The rows entry is one application in scope: card, personal or confidential data, live or retiring.
- Tuesday's 1,438 rows cover 1,438 of 2,416 applications.
- Beside "100% match", the label reads as every application covered.
- "one row per application in scope" is the true label, or "per application in scope" in four words.
- The card's own description ("for applications with confidential or regulated data") softens it, so it stays a nit.

---

## Re-check after Revision 1: **agree**

I looked first, cold, at the newest renders: `shots/5-today-09-after.png` (17:17) and `shots/5-today-phone-02.png`.
Then I read the proposal's "Revision 1".

### Five seconds

**What I noticed first:**

- the red-outlined "Access reviews" card, "Paused today";
- "0 rows today · usually about 1,435" and the blue "Decide ›";
- the red arrow to "⧗ 11 waiting · Readers see Tue Mar 26 until you decide".

**What I'd do:** press Decide.

**Matches the focus?** Yes: this file, its state, and what depends on it, said simply.

### My condition is met

- **The paused file says what is true today:** "⧗ 11 waiting" and "Readers see Tue Mar 26 until you decide".
- **The contradiction is gone opened too** (`shots/open-list-1440.png`). The list prints that one line, no longer both.
- **"If this file is wrong, these show wrong numbers" stays only where it holds:** on a file that isn't paused, such as
  Requirements, "Used by 1 output".
- **A file held by another's pause:** TLS and MFA read "Used by 11 outputs · ⧗ 10 held today by Access reviews".

### The seven tests

All pass.

| # | test | now |
|---|---|---|
| 1 | Counts are icons | "⧗ 11 waiting" is an icon, a number and one word, with the list on a tap. The "wait on it" sentence is gone, which settles my borderline. |
| 2 | A link is two to four words | "one per in-scope application" and "evidence for". |
| 3 to 6 | | Pass as before. |
| 7 | Today is today | "Paused today" and "0 rows today". Tue Mar 26 is data in the past. |

### Every number is true

| figure | check |
|---|---|
| 0 today, usual 1,435 | `rowsUsual` [1433, 1437] |
| 11 waiting | all 11 builds |
| readers on Tue Mar 26 | the day before |
| 100% match on Tue Mar 26 | 1,438 of 1,438, Tuesday's count |
| TLS: 10 of 11 held | MFA reads the same |

- **The scope is said:** 1,438 rows are the in-scope applications, not all 2,416.
- **The card's sentence is the look-inside's `descOf`:** one "what is this" per file across Ctrl K and the file's view,
  with the full description on hover.

### Change

None needed.

**Nit:** TLS's longer sentence is clamped mid-phrase at two lines. Its hover carries the whole of it.
