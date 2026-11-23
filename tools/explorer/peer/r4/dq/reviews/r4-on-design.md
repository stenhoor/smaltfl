# dq on design's Decide and file view, fresh eyes (round 4)

**Verdict: disagree.** One number now reads as today's on the day it can't be. The fix is a one-line revert.

- **Focus sentences:**
  - Decide: "Pick what readers see: the recommended choice is ready."
  - The file's view: "This file, its state, and what depends on it, said simply."
- **Looked at:**
  - after: `S/peer/r4/design/snap/5-today/12.png` and `09.png`;
  - `snap/4a-odd-but-ok/08.png` and `snap/4b-outlier/06.png`;
  - before: `S/peer/snap5/5-today/09.png` and `12.png`;
  - phone: `phone-file-after.png` and `phone-decide-after.png`;
  - the app's `linkOf`.

## 1. Five seconds, before reading anything

**12:**

- **What I noticed first:** "What should readers see today?". "Arrived empty" with today's rows a crimson stub at 0
  against a long grey 1,435, then NOW → RECOMMENDED, and the blue "Keep all of Tue Mar 26".
- **What I'd do:** tap it.
- **Matches the focus?** Yes.

**09:**

- **What I noticed first:** the paused Access reviews card with the same two bars, 0 against 1,435, then Decide and the
  crimson arrow to "⧗ 11 waiting · Readers see Tue Mar 26 until you decide".
- **What I'd do:** press Decide.
- **Matches the focus?** Yes.

## 2. The seven tests

The seven tests all pass for both screens, as design's table says. My round-3 nits are taken:

- the pictures name today "Today";
- Keep's cost is on its card;
- one bars picture for today against usual everywhere, amber when mild.

## 3. Every number

**These are true:**

| screen | figure | check |
|---|---|---|
| Decide | 0 against 1,435 | `usualN([1433, 1437])` ✓ |
| Decide | ⧗ 11 | ✓ |
| 4a | 262 against 269, amber | mild, −2.6% ✓ |
| 4b | 1,630 against 813, crimson | ✓ |
| 4b | 815 rows corrected | ✓ |
| file view | "⧗ 11 waiting", "Readers see Tue Mar 26 until you decide" | ✓ |
| file view | "one per in-scope application" | ✓ |
| file view | Quarterly access review | ✓ |

**But "100% match", on the CMDB card, lost its day.**

- On this file, today, it is not true at a glance.
- Today's Access reviews file has **0 rows**, shown in the same view.
- The 100% is Tue Mar 26's match: 1,438 of 1,438 rows, the join's `match.day` 2024-03-26.
- Beside "rows today 0", a bare "100% match" reads as today's: 100% of nothing.
- The day is now only in the tip, which a phone can't open: a tap on the card goes to CMDB.
- Last round the builder kept "· Tue Mar 26" beside the number on purpose, for exactly this, and I agreed.

## 4. The change that would make me agree

**Show the match's day beside the number whenever it isn't today:** "100% match · Tue Mar 26", muted.

- `linkOf` already computes it as `nd`, empty when the match is today's, so files matched today stay as they are.
- Only the render needs it back.

Nothing else.

---

## Re-check after Revision 1: **agree**

I looked first, cold, at the newest `snap/5-today/09.png` (18:28) and `phone-file-after.png` (18:29). Then I read
"Revision 1".

### Five seconds

**What I noticed first:**

- the paused Access reviews card, rows today 0 against 1,435 as two bars;
- "⧗ 11 waiting · Readers see Tue Mar 26 until you decide";
- CMDB "100% match · Tue Mar 26";
- evidence for Quarterly access review.

**What I'd do:** press Decide.

**Matches the focus?** Yes: this file, its state, and what depends on it, said simply.

### My condition is met

**The match carries its day again,** "100% match · Tue Mar 26", at rest on the desktop and the phone, with the tip
saying it too. Today's empty file no longer seems to have matched 100%.

### Also taken

**The opened kind's head:** "Data model › Application › Access reviews ?". It drops "Esc steps back" and the estate
mini-map, which repeated the breadcrumb, and the "?" tip keeps both.

### The seven tests

All pass on both screens. Decide is unchanged since my first review.

### Numbers

Still true:

- 0 against 1,435;
- ⧗ 11;
- readers on Tue Mar 26;
- 1,438 of 1,438 matched on Tue Mar 26;
- Quarterly access review.

### Change

None.
