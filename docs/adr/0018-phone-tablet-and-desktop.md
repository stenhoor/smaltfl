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
