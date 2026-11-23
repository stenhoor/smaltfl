# Changes: the Ctrl K look-inside (peer r3, dq)

Every change is in `app/explore.js` (marked `// peer:dq`) and in one CSS block at the end of `app/index.html`'s
`<style>` (`/* peer:dq start */ … /* peer:dq end */`, lines 2167 to 2201; the block at 1711 to 1776 is round 2's and is
untouched). `build.js`, `build.json` and `model.json` are unchanged. Line numbers are those of `app/explore.js`.

## The preview: what it is, its state, one number

| change | where |
|---|---|
| `previewDs(d)` keeps the head (icon, name, `Dataset · <kind>`) and adds `nowOf(d)`. It no longer draws the rows-each-day chart, its axis, band key and dates, the "Columns · N" list, the joins or "N outputs are built from it…". | `previewDs`, 1910 |
| `nowOf(d)`: the state chip and the waiting count on one row, then the bars, then what it is (`.pvd.dqwhat`, clamped to two lines, full text in `title`). | 1908 |
| `stateChip(d)`: the same five chips as before (Paused today, Decided for now · file owed, Unusual today, Planned · first file …, Fine today). "Fine today" lost its tail ": inside the check's ±5% band". Its hover says only what holds in every world: "No check stopped or warned on it today · 2,329 rows, +0.3% from usual" (for a noted day, "A check noted something today; nothing stopped"). The old tail claimed Larkspur's ±5% band, which is untrue for a file with a tighter limit of your own in the build's days, and the preview's model doesn't carry that limit. | `stateChip` 1890, `offSaid` 1889 |
| `waitCount(d)`: a paused file's outputs that wait on it, as an icon and a number (`⧗ 11`, `button.dqwait`). Hover lists them ("11 outputs wait on it: Access reviews checked, App scorecard, …"; "held" in the build's model). A tap asks "What is built from Access reviews?". Shown only for a paused file. | `waitingOn` 1884, `waitCount` 1886 |
| `nowBars(d)`: today's rows and a usual day's (`usualN(rowsUsual)`, the same number as the why-paused answer and the Decide panel) as two bars on one scale from zero. Each is labelled where it ends ("rows today 2,329", "usual 2,322"), with no axis, legend or days. Today's bar is ink, crimson when paused and amber when unusual. An empty file is a 3 px stub at zero. A file with no usual size keeps the line "46 rows today". A planned file has no number. `role="img"` with `aria-label` "2,329 rows today; a usual day has about 2,322". | `nowBars` 1900; CSS `.dqnow`, `.dqk`, `.dqb`, `.dqt`, `.dqt0`, `.dqu`, `.dqv` |
| A tap on `[data-ask]` in the preview asks that question, and focus goes back to the input. | 2081 |

## The list inside a file (Tab): its columns behind one line

| change | where |
|---|---|
| The file's columns fold into one line, `Its columns · 5` (`open`, "Show ↵"). Pointing at it lists them in the preview (`previewCols`: name, meaning and type, one line each). ↵ or a tap lists them in the list, under "Its columns", with the first one picked. A search inside the file still finds a column. | `cols`, `showCols`, `folded` 1994–1997; `previewCols` 1914; CSS `.dqcols` |
| The fold's state, `colsOpen`, resets whenever the scope changes. | 1977; `enter`, `leave`, `chip.onclick` |
| `runIt` runs a line's `open` in place. The `.pk` hint reads "Show ↵" for such a line. | 2067; list render 2029 |
| "Explore MFA's rows" lost its sub "Sort, filter, tap a value", since the name says what it does. A name ending in s reads "Explore Access reviews' rows", not "reviews's". The same applies to `previewCols`' head. | 1991 |

## A screen too narrow for the preview pane (phone, tablet upright)

| change | where |
|---|---|
| The "Open MFA" line carries `sum: nowOf(d)`, the same chip, bars and what it is, drawn as `div.dqsum` under its name. It is hidden from 1000 px up, where the preview shows it. A tap on its ⧗ asks, rather than opening the file. | 1991; list render 2029; `li.onclick` 2030; CSS `.pres li .dqsum`, `.pres .dqsum .pvs` |

## The pane

| change | where |
|---|---|
| From 1000 px the preview's tone and its one divider run the full height of the list beside it (`.pbody` background, only while a preview shows and no answer is open). Before, they stopped where the preview's content ended. The preview stays sticky, so a long list still scrolls under it. | CSS `@media (min-width: 1000px)` in the block |

## A truth fix outside the look

| change | where |
|---|---|
| `descOf` cuts a "label: " prefix only where a colon and a space end it. Requirements' description was cut at "ISO/IEC 27001:" and read "2022, PCI DSS v4.0.1, SOC 2), with how the two relate". It now reads "Each control mapped to framework requirements (NIST CSF 2.0, ISO/IEC 27001:2022, PCI DSS v4.0.1, SOC 2), …". | `descOf` 1857 |

Not changed, for the integrator: the same cut, `/^[^:]*:\s*/`, is in `datasetNow` (the "What is X?" answer, the
newcomer's screen) and in the map chip's `title` (line 689, design's screen). Each wants the same one-character fix
(`\s*` → `\s+`).

## Not changed

- The walkthrough scripts. Nothing they point at moved, and `S/scripts/v5_today.cjs` runs as it is.
- The asks' answers (the newcomer's screen), the kind preview, a column's own preview and the rows preview.
- The palette's chrome: input, footer and scrim.
- The map behind (design's screen).
