# ADR 0018: Phone, tablet and desktop

- **Status:** accepted, 2026-11-11 (Q-157, the maintainer's request in a session)
- **Date:** 2026-11-11
- **Builds on:** [ADR 0008](0008-visual-first-news.md) and [ADR 0012](0012-visual-first-in-two-minutes.md) (the views,
  their word budgets, the phone canvas read sideways: all kept).
- **Amends:** the phone-only reading of the views' checks: `tools/browser/tour.cjs` drove the app at 390×844 alone.

## Context

The app was designed and judged at phone size. On wider screens it had rules of its own (main capped at 1180 px, the
sheet a 440 px side panel from 960 px), but nobody looked at them. Captured on 2026-11-11 at a tablet's and a desktop's
size, the control estate showed three faults: the header's tabs stretched across the whole window while the page below
was centred; the canvas opened a tall flow fitted to its height, its cards' names about 7 px high; and the side panel
lay over the page's right side, the day strip and the canvas cut under it.

The maintainer's words: *optimize the UI for tablets and desktops as well as phone, and keep this as a requirement
going forward.*

## Decision

1. **Four sizes, every screen.** The app is held to a phone (390×844), a tablet upright (820×1180) and sideways
   (1180×820), and a desktop window (1440×900). `tour.cjs` takes `TOUR_DEVICE=phone|tablet|tablet-wide|desktop`, and
   at every stop fails a page or an open sheet that scrolls sideways.
2. **The phone is the base.** Wider layouts are `min-width` media queries over the phone's rules; a change for a wide
   screen changes nothing a phone gets.
3. **What a wide screen gets (as built):** from 720 px the header's content lines up with the page's column and its
   tabs sit at their own width; from 960 px the sheet is a side panel beside the page (main gives up its width while
   it is open, through `:has()`), 520 px wide from 1440 px; on a canvas 640 px or wider the flow fits when it can but
   opens no smaller than 0.85 (a card's name 11 px or more), a tall flow from its top, panned as on a phone.
4. **The check.** A change to `src/app` runs the stop sets it touches at all four sizes, looks at the screenshots and
   adds no problem (CLAUDE.md, "Phone, tablet and desktop").

## As built (2026-11-11)

The estate's 52 stops (`tools/browser/stops/estate.json`) report no problems at any of the four sizes. The taxi
example's `pause-checks.json` reports the same twelve problems at every size, the phone's before this change among
them (cards the stop set names that now sit in notebook boxes, and two word budgets: docs/HANDOFF.md).

## Consequences

- A judging round (tools/judges) reads tablet and desktop screens beside the phone's.
- Below 960 px the sheet stays a bottom sheet, full screen for a drill: on a tablet held upright, a side panel would
  leave the page too narrow.

## Amendment 1: the desktop split (2026-11-11, Q-159)

The maintainer, looking at the demo on a desktop monitor: *the flow on the left and the workspace on the right; a small
band on each side is fine, but use more of the screen, especially on bigger monitors; a bar in the middle to drag to give
either section more room; and a button to expand either section all the way out.*

From 960 px (`src/app/split.ts`, the CSS in `page.html`):

- **The window, not a column.** Main is no longer held to 1180 px: the header and the page use the window but a band at
  each edge (`--band`, 16 to 32 px). The canvas, the day strip and the tables take the room a big monitor has.
- **The split.** The workspace (the sheet a card or a notebook opens) is `--sheet-w` wide on the right, 42% of the window
  by default (420 to 960 px), and main gives that width up while it is open. Every sheet shares the one width.
- **The bar.** Between them, a separator (`#split`, `role="separator"`): dragged, it resizes both sides (the workspace at
  least 340 px, the flow at least 360); the arrow keys move it 40 px, a double tap puts it back; the width is the
  reader's, kept in this browser (`smaltfl:split`), never in the flow.
- **Either side the whole window.** The bar's ‹ gives the workspace the window (it covers the flow) and › gives the
  flow the window (the workspace folds away, still open); the same button on the bar, now at the window's edge, brings
  the other side back, and so does closing the sheet or opening a card or a notebook (`showWorkspace`).
- **Checked** by `tools/browser/stops/split.json` (the split, each side given the window and brought back, a card opened
  from the flow's whole window, a notebook in the workspace) at `desktop`, `tablet-wide` and `wide` (2560×1440, added to
  `tour.cjs`); below 960 px nothing changes.

