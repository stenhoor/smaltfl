# Changes: the owner's round-2 fix, "Only the decision" (after revision 1)

- **Working copy:** `S/peer/r2/owner/app`, copied from the merged prototype `S/explore`.
- **Patch:** `S/peer/r2/owner/patch.diff`, 54 lines added and 4 changed.
  - `index.html`: inside my existing `/* peer:owner start */ … /* peer:owner end */` block.
  - `explore.js`: 3 lines, each marked `// peer:owner (r2)`.
  - `build.js`: 1 line, marked `peer:owner (r2)`.
- **Scope:** every rule applies only while the Decide panel is open, under `body:has(#layer .panel.decide)` or
  `#layer .panel.decide`. Every step outside the Decide panel counts the same words as `S/peer/words-r36-fixed.txt`
  (`work/words-after-r2.txt`).

## 1. Behind the decision, only what it is about

| Selector or line | Change | Why |
|---|---|---|
| `#canvas > .alert`, `#waits`, `.trailbar .legend`, `.trailbar .maphint` (`visibility: hidden`) | The banner with its own Decide, the estate's Decide pill, the legend and the hint step away. They draw no box, so the space they keep is plain canvas. | One primary per view (§7). |
| `#stage .kcount`, `.kself`, `.kflags`, `#stage .node.ds:not(.waiting)`, `.bouts .bo.held` (`display: none`, revision 1) | The kinds' counts, the other 21 file chips and the held outputs' names take no room. | Design: the space they kept read as blank boxes. |
| `#stage .node.kind`, `.kicon` (revision 1) | The kinds are drawn as outlines: no fill, no shadow, a 1 px `--edge` border at the map's scale (`calc(1px / var(--ks))`). | A quiet diagram, not emptied cards that look as if they are loading (builder, newcomer, design). The paused chip and its line stay the one solid thing. |
| `.bouts`, `.bo-row`, `.bo-cap` (revision 1) | The held strip closes up to one line, 37 px tall: "What readers get, Mon 26 · Held · 11 · Out 29 published". | Design's test: at most 40 px. |
| `build.js` `holdLineSoon()` | A `MutationObserver` on `#layer` draws the hold line again whenever a panel opens or closes. | The strip changes height while Decide is open. Checked live: opened from the Build panel's button, the arrow ends 4 px above "Held · 11"; after Cancel, it is back on the 90 px strip. |

## 2. An alternative is one line, with its outcome

| Selector or line | Change | Why |
|---|---|---|
| `label.opt.tile:not(.on) .rtx > .chg`, `:not(.on):not(.risk) .rtx > .con` | Rows you haven't chosen drop their change line and their risk, unless the row is risky. | Two levels on demand (§3.7). |
| The `.tfile` rule from round 2 is removed (revision 1) | Every row keeps its fate, the outcome in a few words: "⧗ Stays yours to decide" against "◐ Reopens if a file comes", or "↳ Done with this day" on 4a. | "Wait" and "Keep all" no longer read the same (dq, newcomer). |
| `label.opt.tile:not(.on):is(:hover, :focus-within) .rtx > .con` (revision 1) | A row's risk shows while it is pointed at or focused, without changing the chosen row. | Comparing choices means comparing their costs (builder). The risky row always shows its own. |
| The phone rule `:not(.on):not(.risk) .con` | A risky row keeps its risk on a phone too. | The same warning at every size. |
| `.nowpic .pic .who` | The now-picture's "readers see" is hidden; the sentence beside it says it. | Said once. |

## 3. The panel's own words, said once (revision 1)

| Selector or line | Change | Why |
|---|---|---|
| `explore.js` `recordLine(k)` | The record line names whose words they are ("your words", "smaltfl's reading, agreed") without quoting them. | The words are in the box right below it, or on her row (§6, said once). |
| `explore.js`, the radio's `change` handler | Picking what readers see closes "If it keeps happening ›". The limit tools are the other way to settle the day: each of their buttons acts at once. One tap opens the fold again. | One decision at a time (§3.5). |
| `explore.js`, the request box's label | "Also draft a request for the file, copied for you to send" becomes "Copy a request for the file, to send". | Fewer words, the same act. |
| `.tune p > b:first-child` | The fold's lead ("Only your ±2% limit paused this") is hidden. | It is the badge's own fact ("Mild · only your own tighter limit"). |
| `@media (hover: hover) and (pointer: fine)`: `.tune .tunesaid` | The effect of "Accept … as usual" shows while that button is pointed at or focused. A touch screen keeps it in view, since tapping the button acts at once. | Details at the moment of use. |
| `.tk` | The keycaps are 11 px. | The type floor (design). |
| `.nowpic .pic text.day` (15 px; 21.5 px under 761 px) | The now-picture's day labels draw at 11 px or more on every size. They were 8.5 px. | The type floor (design, round 2). |
| `@media (min-width: 1100px) .panel.decide { top: 72px; bottom: auto; margin: 0 }` | The card is seated from the top, below the bar, not centred. | A row that grows when picked or pointed at moves only what is under it, never the whole card. |

## Scripts

- `S/peer/r2/owner/scripts/v2_fix.cjs` is a copy of `S/scripts/v2_fix.cjs`. It requires the kit by its absolute path.
  - Step 9 now points at "Keep all of Sun Feb 25" (`v.glide`), so its risk shows on hover in the snapshot.
  - Step 9's caption: "Each other choice in one line: where readers would look, and what becomes of the day. Pointing
    at one shows what it risks."
  - It keeps the same 19 steps.
- `S/scripts/v4b_outlier.cjs` and `S/scripts/v4a_odd.cjs` run unchanged.

## Merge notes

- **Design:**
  - The app-wide closed-fold rule stays design's.
  - Design's map rules still apply whenever no decision is open; mine apply only while it is.
  - My kinds' outline uses design's `--ks` scale variable.
- **Builder:**
  - The page behind is not blanked.
  - The `gp-lit` highlight the builder adds on the gaps screen never meets the Decide panel.
- **dq:**
  - The figure is untouched.
  - The tune fold's text stays dq's. I only hide its repeated lead, and show its effect line on demand where a device
    can point.
- **Newcomer:** no overlap.
