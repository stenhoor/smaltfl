# Builder on dq's fix: Ctrl K look-inside (5-today 07)

Focus sentence: "What this file is and whether it's fine today."

## 1. Five seconds, before reading anything (`S/peer/r3/dq/png/5-today-07-after.png` only)

On the right: "MFA", a "✓ Fine today" chip, then two bars of the same length, "rows today 2,329" over "usual 2,322",
then one sentence on what MFA holds. On the left, "Open MFA" is picked and five lines below it say what else I can ask.
**I'd** press ↵ to open MFA; it's fine today, so nothing to worry about.

That matches the focus sentence: what it is, and that it's fine today.

## 2. The seven tests (after reading `proposal.md`, the before `S/peer/snap4/5-today/07.png`, `png/5-today-07-after-phone.png` and `work/states/`)

| # | test | verdict | evidence |
|---|---|---|---|
| 1 | Counts are icons | pass | The before's sentence "11 outputs are built from it; 10 wait on Access reviews" is gone. A paused file shows "⧗ 11", whose hover lists the outputs and whose tap answers (`work/states/e6-access-inside.png`, `e7-…`). |
| 2 | A link is two to four words | pass | No link on this screen: the joins went behind "What does MFA join?". |
| 3 | One focus | pass | "MFA ✓ Fine today" over the two bars. The rows-each-day chart the owner found confusing is gone. |
| 4 | Every block answers why | pass | Columns, joins and the outputs line moved behind their own lines in the list, which no longer repeats the five columns. Their audit matches the screen. |
| 5 | Pictures before words | pass | A shape and a word for the state, two bars from zero for the number, then the sentence. On a paused file, a crimson stub at 0 against a full grey bar says "empty" before any word does. The sentence takes two lines; I accept that because it is the owner's "what is this", kept at their request. |
| 6 | Detail on demand | pass | The month, the columns, the joins and what is built from it are each one line in the list. |
| 7 | Today is today | pass | "Fine today", "rows today", and no date for the current day. The before's "Fri Mar 1 … Wed Mar 27" and "match on Wed Mar 27's files" are gone. |

The phone (390x844) carries the same chip, bars and sentence in the picked line, where before it showed no state at all.
Words in the palette: 213 → 65. The build days tell "a little odd" from "a real problem": 262 vs 269 shows two nearly
equal bars; 1,630 vs 813 shows a bar twice as long.

## 3. Verdict: **agree**

One thing to settle at the merge, between your screen and mine:

- **One "what is this" per file.** Your preview shows the description after its colon. That is the line the owner
  liked: "The identity provider, the share of users registered…" for MFA, and "The last review, the next due date, the
  reviewers and the access revoked" for Access reviews. My file view shows the clause before the colon: "Quarterly
  access reviews for applications with confidential or regulated data". The same file then reads two ways one tap
  apart. Since the owner liked yours, I'd take your wording on the file view in my revision or at the merge, so the
  preview and the view say the same thing. It's one line on my side (the existing `descOf` in place of my `whatOf`). I
  haven't changed my fix while it is under review; the integrator should pick one wording for both screens.

A nit: on the phone the sentence is cut with "…" after two lines. That's fine as long as the full sentence is one tap
away (Open MFA shows it).
