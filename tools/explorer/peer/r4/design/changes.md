# design, round 4: each change and where

The fix lives in `app/`, built from the merged app in `S/explore/` by `work/apply4.py`, which asserts that every edit
lands exactly once.

- **Marks.** JS edits are marked `// peer:design r4`. The CSS is one block, `/* peer:design start */ … end */`, at the
  end of the page's `<style>` (`work/design4.css`).
- **Size.** `patch.diff` changes index.html by +64 lines and explore.js by +27 −18. build.js is unchanged.

## One today-against-usual picture

- **`nowBars(d, o)`**: dq's two bars, now with optional `o.label` (default `rows today`) and `o.tone`. The aria-label and
  the no-usual fallback use the label too. Every earlier call is unchanged, since both options default to what they were.
- **Decide's head** (`state` in the Decide body): "‖ Arrived empty" (or the severity badge and the cause), then the
  bars, wrapped in `.dk-top`.
  - Looking back on a past day, the bars are labelled `rows Mon 26`.
  - A mild pause draws its bar amber, like its badge.
  - The sentence "0 rows, usually about 1,435" goes.
- **The file's card** (`paint`, the `focus` card): `.fm.fbars` draws `nowBars(d)` in place of "0 rows today · usually
  about 1,435". `barsOn(d)` decides when, and `headH` makes the head 36 px tall for the bars instead of 18. Files with no
  usual keep the line.

## One month strip

- **Decide's More** (`month`): `picMonth(d.days)` and `stripLine(d.days)`, the strip and line Ctrl K's "How has it been
  this month?" draws ("warned Sun 10" over its day, Fri Mar 1 … Today Wed Mar 27, "25 fine · ◆ 1 warned · ‖ paused
  today").
- The strip's palette-scoped rules are mirrored for `#layer .panel.decide .ap.apmonth`.

## One count badge

- **CSS only.** One rule now styles `.kind > button.kwait`, `.ostate button.st.waits`, `.alert .awn`, `.palette .apw`,
  `.palette .dqwait` and `#layer .panel.decide .dk-count` alike. In practice that is ⧗ and a number in a 22 px pill, at
  12 px and weight 600, with an inset `--edge` line and padding 0 8 0 6.
- **What went.** Ctrl K's chevron (`.apw .apgo`) is hidden. `.dk-count b` no longer turns synthetic 900.
- **Hover** (and an open tip) turns the pill smalt.
- **Why `--edge`.** It reaches 3:1 against the surface, the contrast an interactive control's edge needs.

## One tip

- **The file's three hanging cards** used native `title` tooltips: the link card, the self card and the count card's
  header. They now use the app's tip (`#smtip`, `TIPS.say`, the `sayTips` map and `sayTip()`), marked `data-tipgo`.
  - **Hover and focus** show the sentence.
  - **A tap** still goes where it went (`click` and Enter/Space pass through).
- **When it opens.** A card's tip opens on a real pointer move (`mousemove` with movement). A view that opens under a
  pointer at rest (5-today 09–11 in the walkthrough) stays clear.

## Type inside the pictures

- **More's evidence chart.** It was drawn 320 wide, and in the sheet it scaled to 18–24 px labels and 700-weight values.
  Capping it at 352 px wide in Decide puts its labels at 11 px and its values at 13 px. Its verdict reads at 15 px and
  its values at weight 600.
- **The two Now and After pictures** are one width (186 px), so their day names render at the same 13 px.
- **Ctrl K's answer title** (`.pprev .pvq b`) moves from 14 px to 15 px.

## One cost mark, one voice mark

- **The cost ✕** on the Recommended card (`.dk-cost .dk-x`) is grey (`--text-muted`), as in the Choices list. A risky
  choice's ✕ stays crimson.
- **smaltfl's reading** is marked ✦ (was ≈), the mark Ctrl K answers with (`<i class="mc">`, two places).
- **Its reason** for the demo's Keep reads "One whole day, Tuesday's" (was "One whole day for readers") in `issueOf`'s
  `sugText`.

## Two radii

- **Cards and sheets at `--r-2`**: the Decide sheet, its choices, the file's card and count card, the banner, Ctrl K's
  box, answer, preview card and table.
- **Controls at `--r-1`**: the file card's buttons, Ctrl K's rows and icon tiles.
- **Before**, these sat at 8, 12, 14 and 16 px.

## Words

- **Looking back on a past day**, the head reads "readers already see today" (was "readers see today").
- **The link card** says "100% match" at rest. The day it was matched on stays in its tip ("1,438 of 1,438 rows on Tue
  Mar 26").

## Not changed

- **The file's ⧗ 11 waiting card** keeps its title as text, not a pill: the card is itself the button.
- **Owners' own areas**:
  - the map, banner and Today (the newcomer's screen this round);
  - Ctrl K's content (the builder's this round) beyond the shared badge, radius and the 14 px title;
  - the Build panel;
  - the receipts (the owner's).
- **The duplicate `nowBarsHere`** in the merged code (a copy of `nowBars`) is left for the integrator. Removing it is
  two lines in the builder's area this round.

## Revision 1

- **One head for the opened kind and the file** (`renderChrome`). The kind level's and the file level's marks row,
  hint, "Esc steps back" and little estate map give way to the estate's "?" (`.mapkey`, `data-tip="key"`). This is the
  newcomer's round-4 change for the opened kind, taken whole, with the file level added. `TIPS.key` says how to point at
  each level: the kind's (the newcomer's words) and the file's ("Open its columns, then tap one for its values · Esc
  steps back").
- **The CMDB link card's match keeps its day at rest again**: "100% match · Tue Mar 26". Today's file has 0 rows, so a
  match without its day reads as today's (dq). The edit that dropped it (`linkHtml`'s `nd`) is gone from `apply4.py`.
