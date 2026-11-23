# Changes: the builder's working fix, "Show the join"

The patch is `S/peer/r1/builder/patch.diff`, made by `sh S/peer/tools/patch.sh S/peer/r1/builder/app`. Every JS change
carries a `// peer:builder` comment. All the CSS is one block in `index.html`, between `/* peer:builder start */` and
`/* peer:builder end */`.

No new data. Every number comes from `build.json`:

- each file's `joins`: `col`, `toCol`, `rows`, `hit`, `blank`, `missN`, `miss`, `missDistinct`, `distinct`, `rel`, `found`;
- each column's `top` values.

## build.js

### `joinCard(f, g, j, inward)`, new, just before `readView`

It draws one link as a join card, `li.jn`, and returns `{ h, ready, on }`.

| Part | Selector | What it shows |
|---|---|---|
| The two ends | `.jn-p` | The file and column on each side, e.g. `CMDB owner_team_id` → `Org units org_unit_id` |
| The arrow | `.jn-a` | |
| Values meeting | `.jn-v`, `.jn-l` | Up to three of the column's commonest values meeting their twins: `TM-062 46 apps —— TM-062 ✓`. A value not found is `✕` on a broken red line |
| The bar | `.jn-bar` | Found, unmatched and blank rows. Only where something is unmatched, or 1% or more is blank |
| The count | `.jn-n` | "All 176 ids found · on Feb 1's 2,401 rows", or "249 of Feb 1's 268 rows found · 19 rows not found: 8 ids not in People" |
| The meaning | `.jn-s` | The relation's sentence with its source in the existing `.bp-from` tag: "Larkspur's model" or "found in the data" |
| The switch | `label.jn-tg`, `i.jn-sw` | One tap, one fixed label, "Linked". It wraps the same `data-link` / `data-found` checkbox the old list used (now `role=switch`), so the existing `change` handler does the work |

The other states:

- **Locked links** have no control; their sentence stands alone.
- **A link whose other file isn't read** is a dashed card, `li.jn.later`. It names that file ("not read yet ·
  hr_org_units.csv") and shows two of its values ("176 ids like TM-062, TM-053 · on all of Feb 1's 2,401 rows"), with
  no switch.
- **Only sure values are drawn found.** A value counts as found only when it can't be among the misses: it isn't in
  `miss`, and either every miss is listed or it has more rows than the misses could hold (`surely`).

### `readView(f)`

- **One list.** The three lists ("Referred to by", "Refers to", "Also found in its data, off", all `ul.bf-links`) become
  one `ul.jn-list` of join cards, headed *Links · N*. Links checked against a file in hand come first, those waiting for
  a file last. The found links that are off stay in their own list, *Also found in its data · N*.
- **New order.** The list now comes straight after *What one row is*. *What kind of thing* follows it, in a second
  `div.bf-props.bf-props2`. The key is what the other files point at, and a feed file's kind follows from its links.
- **Cut:**
  - the paragraph `p.bf-guess` ("Each guess says where it came from…"), since each guess carries its own tag;
  - `relLine(f)` (*Links, at a glance*), which the cards say;
  - the key's `p.ev` line wherever a choice of key says the same;
  - "✓ Looks right: no row repeats it".
- **The key's history** goes on the chosen option: "all 2,401 unique · and on the 184 days before Feb 1" (from
  `keyHistSaid`).
- **`kindWhy`** is said once: "15 other files list applications by app_id".
- **The foot's sum** counts links made now and links waiting: "2 links when their files are read", or "2 links, 2 more
  when their files are read".
- **Left in place:** `linkLi` and `foundLi` are no longer called. They stay to keep the diff small; delete them when
  merging.

### `lineWhy(r, pointedAt)`, new

It is the line a map label carries under its sentence while files are read. It reads `owner_team_id → org_unit_id`,
adding `· N files` and `· N rows not found` where they apply. While the other file isn't read, it reads `owner_team_id
→ not read yet`. A link no column carries (evidence for a control) gets none. Where it shows is in *Round 1 revision*
below.

### `syncModel()`

- **`pointedAt`** is the files pointed at but not read: register files among the ghosts, other than the one being read.
- **A pointed-at kind** gets `pointed`, e.g. "CMDB names 176 units" (the `distinct` of the read file's join), and
  `pointedShort`, "named in CMDB". Its own count is hidden: nobody has read its file.
- **Its chip** is called by its file name, `hr_org_units.csv`, since a file is only named when it is read, and is
  marked `pointed`.
- **Joins from a pointed-at file are left out.** No self-link and no relation comes from a file nobody has read. Before,
  "reports into another unit" showed while reading CMDB, and "People work in units" showed after Org units was added.
- **In the `read` and `files` steps** a relation gets `why` (shown) or `whyHov` (shown when pointed at) from `lineWhy`.

### `mapKey()`

While files are read the key says "Dashed: not added yet · grey: named by a file, not read yet", led by "A box: a kind
of thing · a chip: a file ·" until the first file is in. Once every file is in there is no key.

### The `[data-link]` change handler

Turning a link back to Larkspur's own state now deletes `B.off[k]` rather than storing it. Otherwise `modelDiffs()`
lists "link on owner_team_id on" as a difference from Larkspur's model.

## explore.js

- **`dirEdges()`.** A relation's `why` or `whyHov` becomes its label's second line: `via: r.why || r.whyHov ||
  viaParts(r)…`, plus `why` and `hov` flags.
- **`drawEdges()`.**
  - A `why` row always shows (`v: 4`, `span.lw.lwhy`).
  - A `whyHov` row shows when its edge is tapped or lit (`v: 4`). Otherwise it is drawn hidden (`v: 5`,
    `span.lw.lwhy.hov`) and appears when the label is pointed at or focused.
  - Both are measured in `Geist Mono`.
- **`paint()`.**
  - A kind with `pointed` shows that line in `.kcount` (`span.kpoint`) instead of its own count.
  - Kinds and chips get the class `pointed`.

None of this touches the estate map or the days: `why` and `pointed` are only set by the build, in its Files steps.

## index.html: one CSS block

- **`.jn-*`, the join card.** It uses the panel's own grey card style, as `.bf-prop` does: `--sunk`, radius 10px,
  padding 10px 12px, no frame. A card waiting for a file has a dashed outline, as on the map.
- **`.jn-tg` and `.jn-sw`, the switch.** A 28x16 track with the fixed label "Linked". On is tonal (an `--action-wash`
  track and an `--action` thumb), off is outlined in `--edge`, and the thumb moves in 0.2 s, eased out. Never filled, so
  *Add* stays the one primary.
- **`.node.kind.ghost.pointed`, `.node.ds.ghost.pointed`.** A kind pointed at but not read is grey, not action blue. Its
  chip's file name is in mono.
- **`.kcount .kpoint`.**
- **`.lab .lwhy`:** muted mono at 11 px. `.lwhy.hov` is hidden until `.lab:hover` or `:focus-visible`.
- **Tokens only.** No new colour, size or weight: 11, 12 and 13 px, weights 500 and 600.

## The walkthrough: `S/peer/r1/builder/v1_setup.cjs`

It is a copy of `S/scripts/v1_setup.cjs`, and it requires the kit by its absolute path.

| Step | Was | Now |
|---|---|---|
| 5 | "…the kinds it points at, dashed until their files are read: units own applications, applications run on platforms." | Rings `.jn-list`, then the map: "…and what it points at: owner_team_id and platform_id hold ids from two files not read yet. Each line names its column; their kinds stay grey until read." |
| 17 | (none: the step the demo skipped) | The join checked on Org units ("All 176 ids found, on Feb 1's 2,401 rows"): rings the first ready card, then the map |
| 18 | (none) | One tap turns the link off and its line leaves the map; a second tap puts it back. It waits on `li.jn.off` appearing, then going |
| 19 | Step 17 | Says the line is solid and names its columns, and that People stay grey |

The old ring on `#buildpanel .bf-links` is now on `.jn-list`. After step 16, every later step's number is 2 higher than
in `S/peer/snap/1-setup/`: after 19 to 28 are before 17 to 26.

## Round 1 revision

What changed after the four reviews. Every line is still marked `peer:builder`.

- **Which lines name their columns** (`syncModel`, `lineWhy`, explore.js `dirEdges` and `drawEdges`):
  - **While files are read,** the line being checked names its columns. That is any line touching the file being read
    or, between reads, the file just added.
  - **Any line with rows not found** says so in words. When it isn't the line being checked, it says its column and the
    count only: "approver_id · 19 rows not found". When it is being checked, it gives both ends: "approver_id →
    person_id · 19 rows not found".
  - **Every other line** gets `whyHov`. Its columns are drawn as `span.lwhy.hov`, hidden until the label is pointed at
    or focused, and shown for good when it is tapped (the existing "What carries this link", `S.viaOn`).
  - **Once every file is in** (`B.step === 'files' && !nextFile()`), only the lines with rows not found say it unasked.
  - `lineWhy` now returns `{ text, short, miss, files }`.
- **The join card's count says its day, its unit and what wasn't found:**
  - "All 176 ids found on Feb 1's 2,401 rows";
  - "249 of Feb 1's 268 rows found · 19 rows not found: 8 ids not in People";
  - a link still waiting: "176 ids like TM-062, TM-053 · on all of Feb 1's 2,401 rows".
  - The day is `dayLabel(DATA.day0)`.
- **A value's count uses the file's own noun:** "46 apps", "5 units". A file whose rows are versions or tags (`ROWNOUN`
  ending in "rows") says "rows".
- **The link's control is a switch with one label, "Linked"** (`input[role=switch]` and `i.jn-sw`). On is tonal smalt,
  off is outlined. The words no longer flip.
- **A locked link has no control and no lock words.** Its sentence stands alone.
- **The column lines are `--muted` at 11 px.**
- **The map's key:**
  - while files are read: "Dashed: not added yet · grey: named by a file, not read yet";
  - once all are in: none. Nothing on the map is dashed then, and a line's label still opens what carries it.
- **A kind pointed at is said in the next file's own words:** "CMDB names 176 units" (`namedIn(reg).said`, in
  `k.pointed`). `k.pointedShort` adds "named in CMDB" for the phone's small map.
- **A pointed-at file's chip** sets only `font-family: var(--mono)`, so design's type floor sets its size.

## Merge notes

How this patch combines with the other four, so they merge cleanly.

- **Unread kinds: the builder's handling wins over the newcomer's.**
  - **Keep, from the builder:**
    - `pointedAt` in `syncModel`;
    - the grey `.pointed` kind and chip;
    - the chip named by its file (`short: fname(f)`);
    - no joins from a file not read (`!pointedAt.has(j.from)`), which drops "↻ reports into another unit" and "People
      work in units";
    - `span.kpoint` in `.kcount`.
  - **Drop, from the newcomer:** `namedBy`, `k.why`, `k.whyShort`, `.kcount .kwhy` and their `mapKey` line.
  - **Where the newcomer's wording replaces mine:**
    - **The kind card's line** (`.kcount .kpoint`, built by `namedIn(reg).said`): "CMDB names 176 units", "Org units
      names 240 people", "CMDB names 12 platforms". It said "176 named in CMDB".
    - **The phone's small map** (`modelPic`, the newcomer's line, which I didn't write): it keeps its words, "named in
      CMDB", and reads them from my `k.pointedShort` instead of its `k.whyShort`.
    - **The map's key:** the newcomer's "not added yet" replaces my "not read yet", which was wrong for the file being
      read. My half, "grey: named by a file, not read yet", follows it.
- **Design.**
  - Design drops its own ghost rule in its revision. My `.node.kind.ghost.pointed` and `.node.ds.ghost.pointed` stay:
    grey for named-only kinds, smalt for the file being read.
  - Design's `.lab .lv` (the relation sentence) sits above my `.lab .lwhy` (the columns), with no clash.
  - Design's `#buildpanel .bf-links li` row rule targets a list this patch replaces with `ul.jn-list`. It can go.
  - Design asked that the join cards stay the panel's one card style (`.jn`, `--sunk`), with the dashed outline only
    for a link whose file isn't read.
- **Owner.** No overlap: the owner's CSS is scoped to `#layer .panel.decide`. Two rules do the same job for closed
  folds, the owner's `#layer .panel.decide details:not([open]) > :not(summary)` and my
  `details.bf-descd:not([open]) > :not(summary)`. Either can become one page-wide rule.
- **dq.** No overlap: dq's video-1 fixes (`rulesPart`'s amount range, `shareChart`) are other hunks of `build.js`.
- **The walkthrough.** The merged video 1 is `S/peer/r1/builder/v1_setup.cjs`: 28 steps, with the ring on `.jn-list`
  where it was on `.bf-links`. dq's steps 07 and 13 come before the two new steps, so their numbers stay.

