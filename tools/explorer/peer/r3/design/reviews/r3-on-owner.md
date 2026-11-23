# design on owner's fix: Decide on the estate (5-today 12)

## 1. Five seconds, cold (written before reading anything)

Screenshot: `S/peer/r3/owner/snap/5-today/12.png`.

- **First noticed:** a white sheet asking "What should readers see today?". Under it, two small pictures side by side:
  - NOW: Tue 26 shown, Wed 27 paused, ⧗ 11;
  - an arrow to RECOMMENDED, outlined in smalt: Tue 26 kept.
- **Then:** the one blue button, **Keep all of Tue Mar 26**.
- **What I'd do:** press Keep all of Tue Mar 26, which approves the recommendation.
- **Odd:** the page behind is an empty dotted canvas. The file and its outputs are gone from behind the sheet.

## 2. The seven tests, after reading `proposal.md`

I compared against the before (`S/peer/snap4/5-today/12.png`) and looked at the phone render, More opened, and
2-problem-fix/07.

- **Words:** 492 → 106 by my own count (`render.cjs`), 85 on a phone.
- **No sideways scroll** at 1440 or at 390.

| # | test | | what I saw |
|---|---|---|---|
| 1 | Counts are icons | pass | The 11 held outputs are a "⧗ 11" pill in the Now card. The old "11 outputs wait on it · See which" line went behind More. |
| 2 | A link is two to four words | pass | No relation links here. Its links, "More ›" and "Write your own reason ›", say where they go. |
| 3 | One focus | pass | The Recommended card is the one thing framed in smalt, and "Keep all of Tue Mar 26" the one filled control. My five seconds went straight there. |
| 4 | Every block has a reason | pass | Each block says the file, the question, the one number, now against after, who recommends it, and what goes on record. Everything else is behind "More › other choices, why it paused", which says what it holds. |
| 5 | Pictures before words | pass | The answer is two pictures of the same two days, Now → Recommended. Each text line is one line. |
| 6 | Detail on demand | pass | First comes "Arrived empty · 0 rows, usually about 1,435". The choices, the checks, the month and the 11 by name wait behind More. |
| 7 | Today is today | pass | The head reads "What should readers see today?" with "Wed Mar 27" small. On a day readers have left behind, it reads "for Mon Feb 26". |

**Five seconds against the focus sentence** ("Pick what readers see: the recommended choice is ready"): it matches. I
would press "Keep all of Tue Mar 26" without opening anything.

## 3. Verdict: agree

Nits, none blocking:

1. **A sliver of the button behind.** The right edge of "+ Add a dataset" peeks out past the panel's top right corner
   (`owner-12-corner.png` beside this file). Hide `.trailbar .tools` while `.panel.decide` is open.
   - My fix makes `#add` a borderless text action, so the sliver also goes at merge. I'd still hide the tools.
2. **The pictures still say "Wed 27".** In both pictures the right-hand day is the current day. It could read "Today"
   (`smDay.text(iso)`, with the date small) to match the head. The head already passes test 7.
3. **"One whole day for readers" reads as a riddle on its own.** "Readers see one whole day, Tuesday's" says it plainly.
   That is the data's sentence, so it is the owner's call.
4. **"Esc steps back" stays in the dimmed bar,** while Esc now closes the sheet. Dim it out with the tools.

At merge, the head's "today" should come from `smDay` (`changes.md` §1 in my folder). The owner already plans that call.
