# Review: dq's Ctrl K look-inside preview (5-today 07)

Reviewer: newcomer, someone from the business who has never seen smaltfl. Focus sentence: "What this file is and
whether it's fine today."

## 1. Five seconds, before reading anything (`S/peer/r3/dq/png/5-today-07-after.png`)

Written down before I opened the proposal (`reviews/five-seconds.txt`).

- **What I noticed first:** the right pane. "MFA · Dataset · Application", a "✓ Fine today" chip, then two bars: rows
  today 2,329 over usual 2,322, the same length. Then one plain description of what MFA is.
- **What I'd do:** press Enter to open MFA, or Esc. It's fine, so there's nothing to do.

**Matches the focus sentence: yes.** What the file is, and that it's fine today, read in that glance.

## 2. The seven tests

| # | test | result | evidence |
|---|---|---|---|
| 1 | Counts are icons | pass | The sentence "11 outputs are built from it; 10 wait on Access reviews" is gone. A paused file shows "⧗ 11" beside its chip (`work/states/e6-access-inside.png`); hover lists the outputs, a tap answers which. "Its columns · 5" is a label with its count, not a sentence. |
| 2 | A link is two to four words | pass | The preview shows no links. The lines behind the scrim are design's map. |
| 3 | One focus | pass | "✓ Fine today" over two bars, at the top of the pane. "Open MFA" is the one picked line. |
| 4 | Every block answers "why is this here?" | pass | Their audit holds up. What went: the chart with its 2,438 / 0 axis and band key, the column list that repeated the list beside it, the joins, the other file's trouble said on MFA's card, and "Sort, filter, tap a value". |
| 5 | Pictures before words | pass (see note) | The state is a shape and a word; the number is two bars on one scale from zero. A paused file gets a crimson stub at 0 against 1,435, and twice the rows gets twice the bar (`b-mar21-tls.png`). **Note: the description runs to two lines** ("The identity provider, the share of users registered and whether MFA is enforced. Registered is not enforced"), clamped with an ellipsis on a phone. That is against a literal "text at most one line". I pass it: it is the "what is this" the owner asked to keep, it is half of this screen's focus sentence, and it comes after the picture, not instead of it. |
| 6 | Detail on demand | pass | First what it is, its state and one number. The month, the joins, what is built from it and the columns are each one line away in the list, not on screen. |
| 7 | Today is today | pass | "Fine today", "rows today", and no date for the current day anywhere in the palette. The chart's "Fri Mar 1 … Wed Mar 27" and "match on Wed Mar 27's files" are gone. |

Words: palette 213 → 65, preview 105 → 27. Phone (`png/5-today-07-after-phone.png`): the same chip, bars and line now
sit under "Open MFA", where a phone used to show no state at all. No sideways scroll.

## 3. Verdict: **agree**

All seven pass, and my five-second answer is the focus sentence. This is the screen the owner called "too busy" in
`4-mfa-look-inside.png`, now calm.

Changes I'd suggest, none blocking:

1. **Keep the description at two lines, deliberately.** If the integrator applies "text at most one line" literally,
   put the second sentence ("Registered is not enforced") behind the chip's hover rather than cut the description with
   an ellipsis. Losing "what is this" would undo the part the owner liked.
2. **One picture for one fact, at the merge.** Step 05 (my Ctrl K "why paused" answer) draws today against usual as the
   month's bars with today's slot empty. Step 07 draws it as two bars. Both read in a glance, and mine falls back to the
   same two bars when there is no month. The integrator should give them the same labels and the same crimson stub at
   zero, so a newcomer sees one visual language through the journey. I'll align my labels to dq's ("rows today",
   "usual") in my revision.
