# Ctrl K answers: the picture first, then one line, then Full answer ›

**Screen:** Ctrl K answers, journey 5-today steps 05 ("why is wednesday paused") and 06 ("how has access reviews been
this month"). **Focus sentence:** "The answer, as a picture of today against usual."

> **Polished after review** (agreed by builder and owner). The "why paused" picture is now dq's two labelled bars, not
> the month's bars, and the list row reads "Why is today paused?". See **Polish: took / declined** at the end; where it
> differs from the text above, the Polish section is current.

The owner said the "why paused" answer was "all words" and asked for "the visual of the normal vs today … more like the
How has access reviews been this month", which they liked. Every answer now leads with its picture, then has at most
one line, then **Full answer ›**:

- **Why is today paused?** shows the month's rows as grey bars from zero, with the usual band across them. Today sits
  apart at the end: a dashed outline of a usual day over a red zero, with **‖ 0** above it and **Today** (date small)
  below. The line under it reads "**Access reviews** arrived empty ⧗ 11 ›".
- **How has Access reviews been this month?** shows the owner's strip first, today marked at its end. The one odd day
  is named where it sits ("◆ warned Sun 10"). The line reads "▪ 25 fine · ◆ 1 warned · ‖ paused today".

## Before and after

| step | before | after |
|---|---|---|
| 5-today/05 | `S/peer/snap4/5-today/05.png` | `S/peer/r3/newcomer/snap/5-today/05.png` |
| 5-today/06 | `S/peer/snap4/5-today/06.png` | `S/peer/r3/newcomer/snap/5-today/06.png` |
| phone, 05 and 06 (390×844) | none (a desktop snapshot at 390 px shows no answer) | `S/peer/r3/newcomer/phone/02.png`, `03.png` |

Other views of the same change:

- Both palettes, cropped: `after/05-06-palette.png`.
- The full answers: `shots/why-full.png`, `shots/month-full.png`.
- Dark mode: `shots/sheet-dark.png`.
- The other answers that got a picture or one line: `others/sheet.png`.

The phone renders are `render.cjs` on `snap/5-today-phone/02.html` and `03.html`. Those pages were recorded at phone
size by `scripts/v5_today_phone.cjs` (5-today's steps 04 to 06, same keys and captions), because on a phone the answer
is a card the page builds at that width. Nothing scrolls sideways at either size.

### Visible words (`render.cjs`)

| step | whole screen | the palette (`.pbox`) | the answer (`.pprev`) |
|---|---|---|---|
| 05 why paused | 282 → **232** | 90 → **40** | 67 → **23** |
| 06 this month | 264 → **250** | 72 → **58** | 33 → **25** |
| phone 05 / 06 (palette) | – | **31** / **43** | (a card in the list) |

The palette's own words fell by more than half on 05. What the whole-screen count adds is the map and banner behind the
palette. Those are design's screen, and their fix shortens them.

## The seven tests

| # | test | result | how |
|---|---|---|---|
| 1 | Counts are icons | **pass** | What waits is **⧗ 11 ›**, styled like the map's ⧗ badge. Hover names the 11 outputs; a tap or click asks "Which outputs wait?" and shows them grouped by kind in the fan. The month's counts each carry their mark: ▪ 25 · ◆ 1 · ‖. |
| 2 | A link is two to four words | **pass** | No link is drawn on these answers. The relation answers keep a single line. A picture there should use design's link words (`sayFrom`) once merged, not a second set of labels. |
| 3 | One focus | **pass** | The picture. On 05: 26 equal grey bars and, set apart, today's empty dashed slot under a red ‖ 0. On 06: the strip with today's pause at its end. See the five-second test. |
| 4 | Every block says why it's here | **pass** | See the purpose audit. Gone: "The answer is beside this list", "↵ the full answer · then Decide ›", and the two paragraphs (behind Full answer › now). |
| 5 | Pictures before words; text at most one line | **pass** | Picture, then one line, then Full answer ›. Measured on 73 answers about every file, at 1440×900 and 390×844 (`tools/sweep.cjs`): every line fits on one line, none is cut off, nothing scrolls sideways. |
| 6 | Detail on demand | **pass** | Behind **Full answer ›**: which checks stopped the day, what readers see, the suggestion, and the buttons (Decide, Draft a request, the rows). Behind **⧗ 11 ›**: the outputs' names. On hover: each day's rows, and the band's range. |
| 7 | Today is today | **pass** | "Why is today paused?", **Today** with "Wed Mar 27" small under the last day, "paused today". The labels go through design's `window.smDay` wherever the page has it; this copy's stand-in writes the same markup. No date is written anywhere new: they all come from `DC()`. |

## My five-second test (after, cold, 05)

- **What I notice first:** in the answer card, a row of identical grey bars with, at the far right, an empty dashed red
  slot under a red "‖ 0", and "Today" beneath it. Every other day had about 1,435 rows; today had none.
- **What I'd do:** read the line under it ("Access reviews arrived empty ⧗ 11 ›"), then press **Full answer ›** to see
  what to do, or tap **⧗ 11** to see what waits.

That matches the focus sentence. On 06 the first thing is the strip with its one amber diamond, labelled "warned Sun 10",
and the red pause at the end under "Today". The line confirms it: "25 fine · 1 warned · paused today".

## Purpose audit

### Step 05

| block | why it's here |
|---|---|
| The search line ("why is wednesday paused") | What I asked; I can ask another. |
| "Ask" and the row "Why is Wednesday paused? Ask ↵" | My question, echoed. Enter or a click opens the full answer. |
| "Why is today paused?" | The question as answered: today, named as today. |
| The picture | The answer: about 1,435 rows every day, none today. The dashed slot shows where a usual day would be. |
| "usually about 1,435 rows" | What the grey bars are. |
| "‖ 0" | Today's count, in the pause colour, with the pause mark. |
| "Fri Mar 1 … Today Wed Mar 27" | When: the month, and today with its date small. |
| "**Access reviews** arrived empty ⧗ 11 ›" | Which file and what happened, in words once. ⧗ 11 says what waits on it. |
| **Full answer ›** | The one way on: the checks, what readers see, the suggestion, Decide. |
| The footer: ↑↓ move · ↵ run · Esc close · "Answers come from this page's data" | How to drive the palette; where the answer comes from (unchanged). |

### Step 06

The same blocks, plus:

| block | why it's here |
|---|---|
| "Go to · Access reviews · paused today · 0 rows ›" | Open the file asked about (unchanged). |
| The strip | The month at a glance, today marked. |
| "◆ warned Sun 10" | The one day out of the ordinary, named where it is. |
| "▪ 25 fine · ◆ 1 warned · ‖ paused today" | The strip's counts, with its marks: the legend, said once. |

Nothing is left without a reason; what had none is gone.

## The other questions the palette answers

The code is in `explore.js` `answerFor`. I gave each the same treatment where a picture fits (`others/sheet.png`).

| question | picture | one line |
|---|---|---|
| Why is today paused? | Today against the usual band. With no month to draw, two bars (a usual day, today). For an issue that isn't about rows, the file's month strip. | the file, what happened, ⧗ n › |
| How many rows does X have today? | today against the usual band | "MFA: 2,329 rows today, about as usual" |
| How has X / a kind / the estate been this month? | the strip, today marked, one or two odd days named | the counts with their marks |
| Which outputs wait? / What is built from X? | the file, fanned out to what is built from it by kind, each count with ⧗ where it waits (names on hover) | "Readers see Tue Mar 26 until you decide" / "⧗ 10 wait today, on Access reviews" |
| What should I do next?, is it decided, where is a column used, how do two join, what is X, what does a kind relate to, what does X join, which files describe a kind | none fits without inventing (relations and joins wait for design's link words) | one line each |

A full answer (after Enter or Full answer ›) leads with the same picture and line; its detail follows.

## Fixed on the way

- A question about Key rotation was answered with the keyboard shortcuts ("key"). The shortcuts route now yields when a
  file is named.
- The echoed question capitalises the weekday.

## Deliberately not changed

- The palette's layout, with the list on the left and the answer on the right. The owner liked it in
  `3-ask-this-month.png`; the words were the problem.
- The map and banner behind the palette (design's), the look inside (dq's, step 07), and Decide (owner's, step 12).
- Claude's path: an answer from Claude stays words, from its own prompt.

## Proof

| check | result |
|---|---|
| `5-today` and `3-explore` in snapshot mode, plus `1-setup`, `2-problem-fix` (seed-feb26), `4a-odd-but-ok` (seed-mar2-rows2) and `4b-outlier` (seed-mar21), all against this copy, the scripts unchanged | **no page errors**, every one exits 0 (`logs/`) |
| `scripts/v5_today_phone.cjs` | no page errors |
| `tools/clicks.cjs`: Full answer › (click); ⧗ 11 › in the preview, in the full answer and in the phone card; Full answer › on the phone; Enter on the month question; the empty palette suggesting "Why is today paused?" | every one lands; no page errors |
| `tools/sweep.cjs` at 1440×900 and 390×844 | 73 answers, 63 with a picture: one line each, nothing sideways |
| A merge dry run, on a copy of design's in-progress app | My patch applied except the CSS block. Both of us append one at the end of `<style>`: the case `joincss.py` resolves. The answers rendered the same through design's `window.smDay`, with no page errors (`shots/merge-sheet.png`). |

**Files:**

- `changes.md`
- `patch.diff`: `sh S/peer/tools/patch.sh S/peer/r3/newcomer/app`; 166 lines added, 38 removed.

## Polish: took / declined

The coordinator's two points after both reviewers agreed, and one alignment I had promised in my review of design.

### Took

1. **One picture language across the palette.**
   - "Today against usual" is now dq's two labelled bars, today's rows against a usual day's on one scale from zero. In
     the "why is it paused" answer it replaces the 28 grey bars.
   - The same bars serve "How many rows does X have today?" and the full month answer.
   - "How has it been this month?" keeps the strip of days.
   - `todayBars(d)` calls dq's own `nowBars` wherever the page has it. `nowBarsHere` is a verbatim copy for this copy of
     the app, with the same markup and the same `.dqnow` rules, so the merge keeps one picture and one set of styles.
   - The month bars, the band drawing and my own two-bar fallback are gone (`picToday`, `picTwo`, `.apday`, `.aptwo`).
   - The rows line now says only the verdict ("MFA today: about as usual"), since the bars carry the numbers.
2. **The list row reads "Why is today paused?"**, the question as answered (`local.q`), as the heading does
   (builder's note). It holds on the phone's card too.
3. **The counts agree with the map.** "Which outputs wait?" counts the file's own checked rows with what the file is
   about, as the map's badges do: Applications ⧗ 5, Controls ⧗ 3, Units ⧗ 2, Platforms ⧗ 1. Before, it read
   "Checked rows 1 · Applications 4" against the map's ⧗ 5. I had promised this in my review of design.

### Declined

Nothing.

### After the polish

| step | whole screen | the palette | the answer |
|---|---|---|---|
| 05 why paused, desktop | 282 → **225** | 90 → **33** | 67 → **16** |
| 05 why paused, phone | – | **24** (was 31 before the polish) | a card in the list |
| 06 this month | 264 → **250** (unchanged by the polish) | **58** | **25** |

- **Renders:**
  - desktop: `S/peer/r3/newcomer/after/05.png` (from `snap/5-today/05.html`);
  - phone: `S/peer/r3/newcomer/phone/02.png` (from `snap/5-today-phone/02.html`, `render.cjs` at 390×844).
  - Nothing scrolls sideways at either size.
- **Works:**
  - `5-today` and `3-explore` in snapshot mode, plus `1-setup`, `2-problem-fix`, `4a-odd-but-ok`, `4b-outlier` and my
    phone steps: no page errors, each exits 0. My phone script now waits for the card's two bars.
  - `tools/clicks.cjs`: every control lands.
  - `tools/sweep.cjs`: 73 answers, 63 with a picture, one line each, at 1440×900 and 390×844.
- **Merge with dq, dry run:**
  - My patch on a copy of dq's app leaves three hand merges: the end of `<style>` (both append a block; `joincss.py`), the
    list's render and `li.onclick` line (both edited it), and where my preview handler goes.
  - Merged by hand, everything above passes with no page errors, with `todayBars` drawing through dq's `nowBars`.
  - For the integrator: both patches intercept a tap on `[data-ask]` in the preview. Keep dq's listener, and reduce mine
    to Full answer › (`[data-full]`), so a tap on ⧗ 11 asks once, not twice.
- **Patch:** `patch.diff`, 152 lines added and 38 removed (regenerated after the polish).

