# Changes: the newcomer's working fix (revision 1)

- **The working copy:** `peer/r1/newcomer/app/`.
- **The patch against `explore/`:** `peer/r1/newcomer/patch.diff`. It changes 80 lines, 64 added and 16 removed: 55 in
  `explore.js`, 12 in `build.js` and 12 in the page's CSS.
- **Markers:** every JavaScript change carries `// peer:newcomer` (`/* peer:newcomer */` inside a template). The CSS is
  one block at the end of the page's `<style>`, between `/* peer:newcomer start */` and `/* peer:newcomer end */`.
- **The walkthroughs:** nothing a walkthrough points at was removed or renamed, and the five official scripts run
  unchanged.

## A. The phone's small map says why a dashed box is there (build.js)

Video 1, read steps on a phone.

| Where | Change | Why |
|---|---|---|
| `build.js` `namedShort(k)`, new, just above `modelPic` | The short reason a kind no file of it has brought is on the map: "named in CMDB". It reads the builder's `k.pointed` when that patch is in ("176 named in CMDB", count dropped). Alone, it finds the file read or added that points at the kind's own file, as the next file's card does (`whyNext`). | On a phone the small map is the only map. Its boxes said "1 file" for files nobody had read. |
| `build.js` `modelPic`, the boxes' second line | It shows `namedShort(b.k)` in place of "1 file", in live mode. | The same fact as the desktop map, short enough for a 128-pixel box. |

On the desktop map, the dashed kinds are the builder's now: "176 named in CMDB", the chip named by its file, and no
self-link from an unread file. See the merge notes.

## B. A file shows one real row, read down (explore.js)

Video 3, steps 05 to 09: a file opened, here TLS.

| Where | Change | Why |
|---|---|---|
| New helpers after `HEAD_H` | `CVH` (24 px) is the header row's height. `firstRowOf(d)` takes the model's own `sample[0]`, only when the file has rows that day and the sample is that day's (`refDay`), or the file is `fixed` (the same every day). `cvSaid` gives the value as the file holds it ("pass"), plus its label only where the label says more than the value ("pii · Personal data", "active · Live"). `cvW` measures that, raw in mono and label in sans. `cvMax` caps the width. | The value shown is the day's real row or nothing. It is spelled as the rows sheet spells it (dq). |
| `colTwo(c, fw, vw)` | Takes the value's measured width in place of the kind of column, as the row's grid lays it out. | A meaning wraps to two lines only when it really does. |
| `layoutDataset` | `row1` sets the column heights and moves the columns down by `CVH`, so a joined file's line still meets its own column. | The layout and the paint agree. |
| `paint`, the focus card | Adds `.cvhead`: "Tap a column for all its values" on the left, "Today’s first row" on the right. Each `li.col` shows `<span class="cv">` in place of `.ty` ("key · text"). The key's value is bold, a blank is italic, and a label that says more follows in a muted `.cvl`. The value's `title` keeps the kind of column it replaced: "status · code · text · today’s first row: pass" (builder). Without a first row (an empty file, another day in setup) the card is as before. | The newcomer sees what is in the file. "One row" is a real row: APP-0003, cascade-docs.larkspur.example, TLS1.3, pass. |
| `renderChrome`, dataset level | Where the card shows a first row, the key of marks and the far-right hint go; the hint is on the card. | A key far from the data named marks the page doesn't show (§3.6). |
| `layoutDataset`, the dashed line to the kind | "only those open to the internet or partners, live or retiring" replaces "in scope: exposure: internet or partner · lifecycle: live or retiring" (`plainScope`, `orSaid`). | Plain words, not column: value pairs. |

## C. Ten "waits" said once (explore.js)

Video 3, steps 05 and 06: the outputs beside a file, when another file's pause holds them.

| Where | Change | Why |
|---|---|---|
| `heldElsewhere(id, outs)`, new | True when the day's paused file is another file and some of these outputs wait. | That is the case where the list repeated "waits" beside a file that is fine. |
| `paint`, outputs (`.node.outs`) | When `heldElsewhere` is true, each output is one line: no `<small>` description and no `.wword` "waits". The header keeps "10 outputs use it · ⧗ Held today: Access reviews paused, not this file" and drops the readers line. When every output waits (`allHeld`, e.g. Platform list), the rows also lose their ⧗, since the header's says it (owner). | One fact, said once (§2). About 100 words fewer. |
| `outsH(outs, one)` | The box's height for one line an output and a two-line header. | The layout and the paint agree. |

The paused file's own page (Access reviews), a decided day and a released day keep their descriptions and their
"waits".

## D. The rows open on the column you tapped (explore.js)

Video 3, step 08.

| Where | Change | Why |
|---|---|---|
| `openPanel` | Remembers the column tapped on the file in `S.colSeen`. | *Explore rows* on the card opened the rows in file order, with status off the edge. |
| `wire`, `[data-rows]` on the card | Passes `S.colSeen.col` to `openRows`. | "Opened on the column you tapped" is now true, whichever *Explore rows* is pressed. |
| `go` | Forgets the column when you leave the file. | Another file opens in its own order. |
| `openRows`, `draw` | The tapped column's cells get `td.tapc`, a neutral `--sunk` tint. The CSS adds a smalt underline under its header, which already turns smalt. | The eye finds the column at once (§3.5). |

## CSS (the `peer:newcomer` block in index.html)

- **Selectors:** `.cvhead`, `.col .cv` (with `.k`, `.blank` and `.cvl`), `.col.two .cv`, `table.rows td.tapc` and
  `table.rows th.tap`.
- **Sizes and weights:** only existing sizes (11 and 12 px) and weights (400 and 600).
- **Colours:** only existing tokens (`--muted`, `--ink`, `--ink-2`, `--sunk`, `--action`). No new colour and no new
  border.

## Merge notes (round 1)

How this patch and the other four combine. I checked it by applying all five JS parts to a fresh copy of `explore/`,
in three orders. They apply with offsets only, never a failure, and the merged JS parses. I also assembled all five
fixes into one app and ran setup on a phone and on a desktop: no page errors. The result is
`compare/merged-1-setup-03.png`.

- **Dashed kinds while a file is read: the builder's.**
  - My `namedBy`, the kinds' `why` and `whyShort`, the kind card's `.kwhy` with its CSS, and my map-key wording are
    gone.
  - The three lines the builder's patch also edits are untouched here, as in `explore/`: `syncModel`'s kinds `return`,
    `mapKey`'s `say`, and `paint`'s kind-card `innerHTML`. No line is edited by both patches.
  - The builder brings: `k.pointed` ("176 named in CMDB"), the chip named by its file, no joins from a file nobody has
    read (so no "↻ reports into another unit" and no "People work in units" before HR people is read), the grey
    `pointed` cards, and the column line on each relation.
- **The phone's small map: mine, reading the builder's field.**
  - `namedShort(k)` returns `k.pointed` without its count, "named in CMDB", so the two agree by construction. Nothing
    needs editing at merge.
  - In the assembled app, the desktop map read "176 named in CMDB" and the phone's small map "named in CMDB".
  - Once both are in, `namedShort`'s own search is only a fallback, and the integrator may delete those two lines.
- **The map key: the builder's line, one word changed.**
  - In the builder's `mapKey`, "dashed: not read yet" becomes "dashed: not added yet". The file being read is read,
    only not added.
  - The builder agreed to this wording in its review of my fix.
- **Design's type floor.** The dataset level places my file card at scale 1, so `--ks` never shrinks `.cvhead` or
  `.col .cv` (11 and 12 px). No child of `.kcount` sets its own size any more.
- **The CSS blocks.** All five patches add their block just before `</style>`, as the brief asked, so those five
  hunks meet in one place. Put the blocks one after another; none of my selectors appears in another block.
- **Owner and dq.** No line in common. I don't touch the Decide panel or `usualFig`.
