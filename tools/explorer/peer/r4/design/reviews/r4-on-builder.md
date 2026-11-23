# design on builder's fix, round 4: Ctrl K (answers, look inside, search results)

## 1. Five seconds, cold (written before reading anything)

**The empty palette** (`shots/a-empty-before-after.png`, right half)

- **First noticed:** the one highlighted row, "‖ Decide what readers see today… Access reviews arrived empty · ⧗11 ↵".
- **Beside it:** the small picture, Tue 26 under the eye against Today paused, then "Access reviews arrived empty ⧗ 11 ›".
- **Under it:** ASK, four questions, and HELP, two.
- **What I'd do:** press Enter to decide.
- **Compared with the before:** the preview has lost its stack of sentences (stopped by…, 11 outputs wait…, your four
  choices). One picture and one line are left.

**5-today 05 to 07** (`shots/5-today-0N-after.png`)

| step | first noticed | what I'd do |
|---|---|---|
| 05, "Why is today paused?" | the two bars, a red stub at 0 against 1,435, then "Access reviews arrived empty ⧗ 11 ›" | press Full answer ›, or ↵ |
| 06, the month | the strip, ◆ warned Sun 10, ‖ today at its end, then 25 fine · 1 warned · paused today | Full answer ›, or move on |
| 07, MFA look inside | ✓ Fine today, then two near-equal bars (2,329 against 2,322) and two lines on what MFA is | Esc, it's fine, or ↵ to open it |

Each answer's own question header is gone from the preview, because the list row already says it.

## 2. The seven tests, after reading `proposal.md`

I compared against `S/peer/snap5/5-today/04–07` and the builder's own befores, and looked at the "mfa", "what is mfa",
"what feeds coverage" and "how has tls been this month" pairs and the phone renders (`shots/phone-01.png` …, nothing
sideways).

| # | test | | what I saw |
|---|---|---|---|
| 1 | Counts are icons | pass | "11 outputs wait" is ⧗ 11 in the row, the preview and "See what's built from it". The fan's counts are numbers by kind (‖ 1 of 14). |
| 2 | A link is two to four words | pass | No links are drawn, and the fan's lines carry no words. |
| 3 | One focus | pass | Opened, it shows the one Decide row and its picture. "mfa" shows MFA first, with its columns behind Tab. An answer shows its picture. |
| 4 | Every block has a reason | pass | The opened palette dropped from 177 to 75 words. The stack of checks and choices went to Decide, and the question no longer appears twice beside its row. |
| 5 | Pictures before words | pass | Every answer leads with a picture: the bars, the month strip (its two labels no longer printed over each other), the fan reversed for "what feeds", and look-inside's picture for "what is". |
| 6 | Detail on demand | pass | Columns behind Tab, the checks and choices behind Decide, the files behind Full answer. |
| 7 | Today is today | pass | "Decide what readers see today…", "Today" on the picture, "Today Wed Mar 27" on the strip, all through `todayWord` and `smDay`. |

**Against the one system:**

- **Matches.** Today against usual is dq's two bars wherever Ctrl K says it, which are now also the bars on Decide and
  the file. The pictures are Decide's (Tue 26 → Today). The month strip is the one Decide's More now draws. The marks are
  the app's.
- **Seams that close at the merge.** The preview's "⧗ 11 ›" still carries its chevron and a 20 px pill in this copy. My
  round-4 rule makes `.palette .apw` the one pill (22 px, 12 px, 600, inset `--edge`, no chevron). The palette's 14 px
  and 8 px radii also become `--r-2` and `--r-1`. Both are CSS only, as long as the builder's block doesn't restyle
  `.apw` after mine.
- **A nit.** The list row's sub writes "⧗11" with no gap, where every pill has one ("⧗ 11").

**Five seconds against the focus sentences:**

| state | focus | |
|---|---|---|
| Opened | today's one thing to do, then the questions | matches |
| 05 | the answer, as a picture of today against usual | matches |
| 07 | what this file is and whether it's fine today | matches |
| "mfa" | the best match first | matches |

## 3. Verdict: agree

**The change that matters: at the merge, keep one count pill in Ctrl K.**

- Let `.palette .apw` take the shared badge rule: no chevron, the same size.
- Write the row's count as "⧗ 11".
- Nothing fails.
