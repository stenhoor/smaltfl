# dq, round 2: what the patch changes, and why

The patch is `peer/r2/dq/patch.diff`, against the merged prototype in `explore/`: 102 lines added and 4 removed, in two
files.

- **JS:** every change in `build.js` is marked `// peer:dq r2` or `/* peer:dq r2 */`.
- **CSS:** the rules go inside my existing `/* peer:dq start */ … /* peer:dq end */` block in `index.html`, marked
  `r2`.
- **Kept:** no class a walkthrough points at is renamed or removed: `.ag-gaps`, `li:nth-child(2)`, `li.finding`,
  `li:has(.agchip.mine)`, `.bh-grid`, `.pdx` and `.ck-kinds li.mine` are all still there.

Since revision 1, section 1 is the combined gaps step: dq's rows, with the named pieces of the builder, the newcomer and
design ported in. Their round-2 patches don't ship separately. Sections 2 to 4 are my own round-2 changes, as before.

## 1. The gaps reading found: the combination (setup steps 21 to 26)

### `build.js`, beside `GAP_TAG` (dq): two maps
- **`GAP_SHORT`:** each gap said short, with the noun its count is in.
  - "8 approvers not in the HR file" (from `j.missDistinct`) · rows
  - "4 tags the CMDB doesn't list" · rows
  - "no cluster" · rows
  - "no shared platform" · applications
  - "no leader" · units
  - "no version 1 row" · exceptions (was "version 2 alone")
- **`GAP_SEG`:** for a gap the data shows filling one segment of its file exactly, that segment's name.
  - Read from `DATA.xtab`.
  - "all non-production" (clusters: `nonprod === n`, `prodBlank === 0`); "all SaaS" (platforms: `of === n === blank`).
  - It says nothing where the counts don't match exactly.

### `build.js`, `allInView()`: one row a gap (`liOf(x)`)
**The summary** (always shown):
- **`b.ag-name`** (dq): "{File} · {short}", weight 600.
- **`span.ag-n`** (dq): "19 of 268 rows", right-aligned, in tabular figures.
  - The share is added only where the bar can't show it: the tags' 0.2% (a 3 px sliver) and the platform row, read
    against your rule's 15% line (14.4%).
- **`span.ag-scale`, the bar** (dq; figure and ground flipped as the reviews asked).
  - A pale track (`--sunk-2`); the gap the dark mark from the left, at its true share (3 px minimum), one 0–100% scale
    for all six.
  - Links that point at nothing and versions are solid `--ink-2`; blanks a dark `--ink-2` hatch; the open finding the
    one amber (`--warn`).
  - Under it, a blank gap's segment (`span.ag-seg`, from `GAP_SEG`) in place of the reason line. Over it, your rule's
    limit as a dashed line (`i.ag-tol`) labelled "your rule: at most 15%" (`span.ag-tl`).
- **`small.ag-why1`:** the reason's first clause, except where the segment says it.
- **`span.ag-acts`:**
  - **The control** (design): `seg4(...)` with Pause · Warn · Note · Off, Larkspur's pick passed (`lark: lk0`) so its dot
    shows. The existing `gapmode` handler maps warn → new and pause → hold.
  - **What it does** (all four: dq, builder, newcomer, design), `span.ag-does`, from `doesSaid(x, m, mr)`:
    - "Pauses 55 of 56 days" and "Warns on 1 of 56 days: Feb 24": the days from `wouldDays`, the same days the fold's
      strip and its "Pause would stop …" give. Dates are listed when there are fewer than 9.
    - Warn counts every day with a new one; Pause honours the "at least N" floor, as `linkFindings` decides.
    - "Warns on 56 of 56 days" for Warn every day; "Listed, no day marked" for Note; "Not checked" for Off.
    - Your rule's row: its own days (`brokeOn(..., true)`): "Warns on none of the 56 days".
    - Once accepted: "✓ accepted at 15 · not checked" (this replaces the builder's "more are noted" and Note-truth fix
      with the consequence itself: Note no longer claims to warn).
  - **The finding's own "Accept it as known"** (newcomer), `button.ag-acc1` with `data-act="known1"`, on its row under
    the control.
  - **"Why ›"** (builder's word; was "evidence ›"), to the right.
- **The `li`** (builder) gets `gp`, `data-gf` (its file) and, for a link, `data-gt` and `data-gc` for pointing.

**The fold** (builder: one fold, no control repeated):
- the finding's sentence and what leaving it open does, your rule's line, an accepted ceiling;
- `p.ag-what`: the column, the rest of the reason (all of it on a segment row) and its source tag;
- `gapEvidence(x)`: the ids, "ids behind Why ›";
- `modeRow(x)`: the 56-day strip, "Warn when", the pause floor and "Pause would stop …". Its own Pause · Warn · Note · Off
  is hidden (`display: none !important`, which outranks the base page's `.seg { display: inline-grid !important }`).
- The nested "Why, and the evidence ›" fold is gone.

### `build.js`, `allInView()`: the head and the list
- **The files, said once** (builder): "✓ All 22 files are in · 5 kinds · 8 links between them". The kinds line
  (`.ag-kline`) is hidden from 761 px, where the map beside it shows them; a phone keeps it.
- **The heading** (builder): "Gaps in Feb 1's files · 6".
- **The why, one line** (newcomer): "Accept each as known, or it is listed every day."
- **The key, one line in the control's four words** (design's words, said once above the list): "Pause holds the day ·
  Warn marks it ◆ · Note lists them · Off stops checking". Which days each picks is on its row.
- **Two groups** (newcomer), `div.ag-gaps.ag-groups`: "Worth asking about · 1" (the finding), then "Explained · 5".
- **The primary** (newcomer): "Accept the 5 explained ›". The recount line above the buttons ("6 gaps: 1 warns of new
  ones, 1 noted, 3 off …") is gone (`sum: ''`): it was a third telling of the settings, with "6" over "5".
- After accepting: "✓ Accepted by you, {when}: 5 of 6. The one worth asking about stays open." Declined: "✕ Not
  accepted by you, {when}: each is listed every day until accepted or off."

### `build.js`, `drawPanel()`: pointing at a gap (builder, ported)
- Delegated `mouseover`, `mouseout`, `focusin` and `focusout` on `li.gp`.
- They add `gp-lit` to the gap's file chip and, for a link, the file it points at and the map label whose column line
  starts with the gap's column ("approver_id · 19 rows not found").
- Cleared on every draw.

### `index.html`, the `r2` gaps rules
- **Rows, not tiles** (design): one divider, no fill. Names 600.
- **Sizes:** 11 px (bar labels), 12 px (count, key, what it does, group heads), 13 px (names, the why). Weights 400 and
  600. Base tokens only; no new colour.
- **The control** pill-sized from 761 px (`height: 24px`, auto-width columns). A phone keeps the kit's 44 px buttons
  across the row (the base page's rule).
- **Larkspur's pick dot** visible again (`#buildpanel .seg button .lkdot`), as design restored it.
- **`#stage .node.ds.gp-lit`, `#stage .lab.gp-lit`:** a 2 px smalt outline (builder).

**Why:** critique 1, and the reviews.
- Sizes were sentences.
- The picture was folded.
- The finding was one row among six.
- One setting had two controls and three vocabularies.
- Pause was a tap away on a gap with its consequence hidden.
- Principles: §3.6, §3.7, §3.8, §5, §6, §7.

## 2. History's chips on the cards' scale (setup step 27)
**`build.js`, the history step's map chip sparkline** (the `B.step === 'history'` branch):
- The 184 days are drawn on the cards' scale: usual ± (the Rows limit + 2 points), clamped. Before, each chip was
  stretched to its own min and max.
- People (242–248 rows) is now flat.
- Exceptions (+11%) sits on the chip's lower edge, as on its card.
- **Why:** critique 3. §3.6.

## 3. A closed fold's contents not drawn (all Build panel screens)
**`index.html`:** `#buildpanel details:not([open]) > :not(summary) { display: none !important; }`.
- **Pixels:** identical on the days' screens, compared with every animation finished (2/01, 2/07, 2/16, 4b/01;
  `proto/pxsame.cjs`).
- **Counts:** with the fixed counter, it moves the count by one to three words on the days' cards, because a nested
  "Why ›" laid out inside a closed fold, and never painted, is no longer counted.
- This is design's app-wide rule, scoped here; keep one in the merge.

## 4. The figure's labels in a narrow fold (round 1's figure)
**`index.html`:** two more `@container` steps for `.ufig.dq`, at 175 px and 159 px.
- The corrected file's fold on 2/16 and 2/17, opened at 820×1180, draws its labels at 11.8 px, where they were 10.8.

## The walkthrough script
`peer/r2/dq/scripts/v1_setup.cjs` is a copy of `S/scripts/v1_setup.cjs`, requiring the kit by its absolute path. It has
the same 28 steps.
- **Step 21:** "Every file is in. What reading found: six gaps, each drawn as its share of its file, the one worth asking
  about first."
- **Step 22:** "Each has its reason under it, the one control every check uses, and what it does over the 56 days."
- **Step 23** (builder's glide): the pointer moves onto the finding before the caption ("One is worth asking about: 19
  approvals by 8 people HR doesn't list. Pointing at it lights its two files on the map. It is yours to accept on its
  own."), then back to (700, 860). The snapshot shows People, Exceptions and their line lit.
- **Step 24:** "The CMDB's blank platforms are watched by your rule now: its 15% is the line, just past today's 14.4%."
- **Step 25:** "Accept the five explained: each then does what is set beside it."

## Merge notes: what came from whom
| Piece | From | Where it now lives |
|---|---|---|
| Rows: name, count, one-scale bar with the gap dark, segment labels, your rule's line | dq | `liOf`, `GAP_SHORT`, `GAP_SEG`, `.ag-scale` |
| "no version 1 row" | newcomer (wording), dq (row) | `GAP_SHORT` |
| One-line why; "Worth asking about · 1" then "Explained · 5"; the finding's own accept; "Accept the 5 explained ›"; no recount line | newcomer | head, `groups`, `ag-acc1`, foot |
| Pause · Warn · Note · Off with Larkspur's dot; the key in its words; rows not tiles; weight 600 | design | `seg4` in the row, `KEY`, CSS |
| What the pick does over the 56 days, on the row | dq, builder, newcomer, design (reviews) | `doesSaid` |
| Pointing lights its files and line; one fold, no repeated control; the head said once; "Why ›"; ids behind it; Note-truth | builder | `drawPanel` listeners, the fold, head, `gapEvidence` in the fold |
| Kinds line hidden from 761 px | newcomer, builder, design | CSS |

- **Not taken:**
  - the builder's evidence lines in the summary ("blank only on the SaaS apps"; the ids). The segment labels say the
    first, and the ids are behind Why › as asked.
  - design's 64 px fixed control columns: pill-sized, as asked.
- **When merging:**
  - drop the builder's, the newcomer's and design's gaps code: it is all here.
  - Keep design's other round-2 rules (history rows, checks list, 11 px floor on the map's badges, the app-wide fold
    rule) beside these; they don't overlap.

## Round 2 polish
- **`drawPanel()`, the once-only pointer block:** a `MutationObserver` on `#stage` (`childList`). When `.lab` nodes are
  added again after a pick, it re-lights `#buildpanel li.gp:hover, li.gp:focus-within` (the builder's fix).
- **`allInView()`, `KEY`:**
  - it ends with `<i class="lkdot">` and the words "Larkspur's pick";
  - a `span.ag-days` says "The 56 days: Feb 1 to Mar 27", from `DATA.days[0]` and `LAST`.
- **`liOf(x)`, `idsRow`:** on the finding's row, `small.ag-why1.ag-ids` lists `x.j.miss` in mono, with "+N more"
  (`missDistinct` minus the listed). The fold's `p.ag-what` then shows the whole verdict, and the fold drops
  `gapEvidence` (the ids are on the row).
- **CSS:**
  - `.ag-ids`, the ids in 12 px mono;
  - `.ag-key .ag-days`, its own line;
  - `.ag-key .lkdot`, the 5 px muted dot, with `!important` against the base rule that flattens a bare `.lkdot`.

