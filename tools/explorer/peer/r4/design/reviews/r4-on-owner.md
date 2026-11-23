# design on owner's fix, round 4: the decision receipts as timeline rows

## 1. Five seconds, cold (written before reading anything)

**2-problem-fix 19** (`S/peer/r4/owner/snap/2-problem-fix/19.png`)

- **First noticed:** the green banner, "Mon Feb 26 is decided · … 11 outputs rebuilt · readers stay on today".
- **Then, in the panel:** the bold "Tuesday itself went out as usual", and under it a bordered card.
- **The card:** ✓ DECIDED, Mon Feb 26, MFA arrived empty, then four rows down a line:
  1. Mon 26 05:25 · ‖ Paused · ⧗ 11 held · 👁 Sun Feb 25
  2. Mon 26 · ⧗ Waited for the file · Alex Kim · 👁 Sun Feb 25
  3. Today 02:40 · ↻ Corrected file in, 0 → 2,318 rows, every check passed
  4. Today · ✓ Published the corrected file · Alex Kim · 👁 Mon Feb 26, corrected
- **What I'd do:** read it down (it is the record, in order), then press Skip to Tue Mar 5 ›.
- **Odd:** the eye reaches the day's own headline before the record, and two links are underlined:
  - "Change this decision" (underlined);
  - "2 gaps still open ›" (underlined).

**2-problem-fix 13 and 14** (identical frames)

- **First noticed:** "⧗ Today waits for its file · Mon Feb 26 · ⧗ 11 held · your call · Decide ›".
- **In the panel:** MFA arrived empty, and two rows, each with its time, mark, who, and what readers see:
  1. Today 05:25 · Paused · ⧗ 11 held · 👁 Sun Feb 25
  2. Today · Waited for the file · Alex Kim · Sloane Marsden's words › · 👁 Sun Feb 25
- **Under the rows:** "Change this decision" (underlined), Why it paused ›, and "◐ Next: the corrected file".
- **What I'd do:** read the two rows, then press Tue Feb 27 ›.

## 2. The seven tests, after reading `proposal.md`

I compared against `S/peer/snap5/2-problem-fix/13, 14, 19`, `4a-odd-but-ok/12` and `4b-outlier/11`, and looked at the
phone render `png/2-problem-fix-19-phone.png` (nothing sideways).

| # | test | | what I saw |
|---|---|---|---|
| 1 | Counts are icons | pass | The paused row says "⧗ 11 held", as the banner does. No count is a sentence. |
| 2 | A link is two to four words | pass | "Sloane Marsden's words ›", "your words ›", "Change this decision". |
| 3 | One focus | pass | On 13, 14, 4a 12 and 4b 11 the rows are the one block. On 19 the day's own headline comes first ("Tuesday itself went out as usual"), then the framed DECIDED card, so the record is second in the eye's path, but plainly the thing to read. |
| 4 | Every block has a reason | pass | Each row says when, a mark, what, who, and what readers saw. The replay's wall clock is gone ("Nov 23, 17:38" twice for a Monday and a Tuesday), and so is the sentence form ("Decided by Alex Kim, head of IT controls: …") and the separate "Readers see" and corrected-file boxes. |
| 5 | Pictures before words | pass | The marks run down one line (⏸ ⧗ ↻ ✓, each its own shape), with an eye column for what readers saw. One line per row, with whose words a tap under it. |
| 6 | Detail on demand | pass | Her words, role and time sit behind "Sloane Marsden's words ›". |
| 7 | Today is today | pass | "Today 02:40" and "Today", against "Mon 26", on the story's one clock. |

**Words.** 314 → 257 on 13, 306 → 249 on 14, 337 → 296 on 19.

**Against the one system** (measured on the snapshot's build panel):

- The marks, the eye and the smalt words-links are the app's own.
- **Two seams remain:**
  1. **"Change this decision" is underlined, at weight 400**, under every receipt (13, 14, 19, 4a 12, 4b 11). Every
     other link on the screen ("Sloane Marsden's words ›", "Why it paused ›", "More about this day ›") is smalt at 500
     with no underline until pointed at. That is the app's one link language. It is an action, so it reads as a quiet
     text button.
  2. **The DECIDED card's radius is 12 px** (`bd-card`). Cards and sheets are `--r-2` (10 px) everywhere else now.
- A nit: "⧗ 11 held" in the paused row is text, while the banner above says the same count as the one pill (with its
  list on hover). Text is fine in a record. The pill would make it the same thing in both places.

**Five seconds against the focus sentence** ("What was decided, by whom, when, and what readers saw, in order"): it
matches. Read down, it says Monday paused, Alex Kim waited, the corrected file came at 02:40, he published it, and
readers now see Monday corrected.

## 3. Verdict: agree

**The change that matters: one link language for "Change this decision".**

- Smalt, weight 500, no underline until hovered, like "Sloane Marsden's words ›".
- Then the card at `--r-2`.
- Neither is a test failure. They are the seams between this screen and the rest.
