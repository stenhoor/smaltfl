# Changes, round 2: the builder's working fix, "What reading found, at a glance"

The patch is `S/peer/r2/builder/patch.diff`, made by `sh S/peer/tools/patch.sh S/peer/r2/builder/app` against the
merged prototype in `S/explore/`.

- **JS:** every change in `build.js` is marked `// peer:builder (r2)` or `/* peer:builder (r2) */`. `explore.js` is
  untouched.
- **CSS:** the round-2 rules sit at the end of my existing block in `index.html`, under a `round 2` comment, before
  `/* peer:builder end */`.

No new data. Every number and id comes from `build.json`:

- each file's `joins`: `rows`, `hit`, `blank`, `missN`, `miss`, `missDistinct`;
- `xtab['hr_org_units.leader_id'].levels`;
- `gapsFound()`'s own `n` and `of`.

Everything is scoped to the gaps screen, the `files` step after every file is read (`allInView()`).

## build.js

### `gapGlance(x)` and `GAP_UNIT`, new, just before `gapsFound()`

`gapGlance(x)` returns a gap's three parts. `GAP_UNIT` gives the count's unit: apps, units, exceptions, or rows.

**The head:** `span.gp-h` holds the file's map name and its column in mono, e.g. *Exceptions* `approver_id`. `span.gp-n`
holds the count against its whole, "**19** of 268 rows".

**The bar:** `span.gp-bar` is the rest and the gap, as flex weights. It is `role="img"`, with an `aria-label` that gives
the count.

**The evidence:** `span.gp-ev`, one line of what the data shows:

| Gap | Line |
|---|---|
| `exceptions.approver_id` | "P-0093, P-0143 … 8 ids not in People" |
| `cloud_assets.app_tag` | "APP-9967, APP-9073, APP-9734, APP-9922 not in CMDB" |
| `exceptions.version` | "version 2 alone, each extended: EX-00062, EX-00098 …" |
| `cloud_assets.cluster` | "blank only on non-production rows" |
| `cmdb_apps.platform_id` | "blank only on the SaaS apps" |
| `hr_org_units.leader_id` | "no leader: 4 teams, 1 department, 1 business unit" |

Each line is a fact the data already holds (the `miss` ids; `xtab` for clusters, platforms and leaders). Larkspur's
reason for its pick, and where that reason comes from, stay in the fold.

### `allInView()`, each gap's row (`const gap = g.map(…)`)

**The summary.** It is the glance: `gp-h`, `gp-n`, `gp-bar`, `gp-ev`, then `span.gp-act`. That last row holds:

- the quick choice (`.agpick`, unchanged), or "Your rule: … · Warn" (`.agchip.mine`, which was "Watched by your rule:
  …");
- `i.acc` or `i.findtag`, unchanged;
- `span.ag-open`, which says "Why ›" (it said "evidence ›").

The summary's `aria-label` keeps the whole sentence ("Exceptions: 19 of 268 rows name one of 8 approvers …") for screen
readers.

**One fold, not two.** The nested `details.ag-why` ("Why, and the evidence ›") is gone. The fold holds:

- the finding's, your rule's and the accepted ceiling's lines, unchanged;
- `p.ag-what`: Larkspur's reason with its source tag (`FROM(x.from)`);
- `modeRow(x)`: the day strip, the four-way control, the pause threshold and what pause would stop;
- `p.ag-eff`, the effect.

**Moved up or cut:**

- The fold's `.ag-top` / `.ag-bar` is now the summary's bar.
- `gapEvidence(x)`'s ids are now the evidence line.
- The two cross-tab tables (`.ag-xt`) are cut. "blank only on …" and the count say the same, and the reason in the fold
  gives both sides.

**The `li` gets:**

- the class `gp`, beside `ok` and `finding`, which the walkthrough uses;
- `data-gf`: the file;
- for a link, `data-gt` (the file it points at) and `data-gc` (the column).

**Truthful.** An accepted gap set to Note said "more will warn". It now says "more are noted", because Note doesn't warn
(the `acc` line).

### `allInView()`, the head

**The files.** `div.bp-done.gp-done` is one line: "All 22 files are in · 5 kinds · 8 links". It was "All 22 files are
in." with "5 kinds of thing · 22 files · 8 links between kinds" beneath, the 22 said twice.

**The heading** is "Gaps in Feb 1's files · 6". It was "Problems already in the data on Feb 1 · 6".

**Before you accept:** `p.ag-known.ask` was a 45-word paragraph, with the counts already shown on each row and the
finding's own sentence. It is now one line: "Until you accept them as known, each is listed every day."

**After you accept:** "✓ 5 of 6 accepted as known by you, Nov 22, 21:10 · this replay. The finding stays open." It
was "Accepted as known gaps by you, …: 5 of 6; the finding stays open until you accept it. From then on each does what
you set beside it."

**If you decline:** "✕ Not accepted by you, …: each is listed every day until accepted or off."

### `drawPanel()`: pointing at a gap lights it on the map

- **How.** Listeners are added once, delegated on `#buildpanel`: `mouseover`, `mouseout`, `focusin` and `focusout` on
  `li.gp`.
- **What lights.** The class `gp-lit` goes on the gap's file chip, `#stage [data-id="d:<file>"]`. For a link it also
  goes on the chip of the file the link points at, and on the map label whose column line starts with the gap's
  column ("approver_id · 19 rows not found").
- **Cleared** on every `drawPanel()`, so no highlight outlives a redraw.
- **Phones.** On a phone the map isn't drawn beside the panel, and nothing happens.

## index.html: round 2's rules in my block

| Selector | What | Why |
|---|---|---|
| `#buildpanel .gp-done` | one line; the counts in `--muted` | the files said once (§2) |
| `@media (min-width: 761px) #buildpanel .ag-kline` | hidden where the map is beside the panel; kept on a phone | the map already shows the five kinds and their counts (§2) |
| `#buildpanel .ag-known.ask` | 13 px, `--muted`, no box | one quiet line (§3.3) |
| `details.ag-row > summary` | a two-column grid: head and count, then bar, evidence and act row across | a gap scans as address, size, evidence, choice (§3.5, §3.9) |
| `.gp-h`, `.gp-n` | file 600, column in mono `--muted`; count in tabular figures, its number in ink | real content, figures aligned (§3.9) |
| `.gp-bar`, `.gp-bar .h`, `.gp-bar .g`, `li.finding .gp-bar .g` | 6 px, from zero; the rest a light grey, the gap a grey hatch, the finding's an amber hatch | the size of each gap at a glance; colour only on the one that needs a look, with its word (§3.6, §6) |
| `.gp-ev`, `.gp-ev code` | 12 px; ids in mono without a pill | the evidence at the moment it is used (§3.8) |
| `.gp-act`, `.gp-act .ag-open` | one wrapping row; Why › to the right | the choice, then the tertiary link (§3.3) |
| `details.ag-row[open] .gp-act .agpick` | the quick choice hides while the fold is open | one control per setting at a time: the fold's four-way takes over (§7) |
| `details.ag-row:not([open]) > :not(summary)` | a closed fold's content isn't drawn | it never was on screen, but the word count read it, about 290 words |
| `#stage .node.ds.gp-lit`, `#stage .lab.gp-lit` | a 2 px smalt outline | the gap pointed at, shown on the map: the state in the action colour, as focus is (§3.8, §4) |

**Tokens only.** There is no new colour, size or weight: 11, 12 and 13 px; weights 400, 500 and 600; `--edge`,
`--sunk-2`, `--warn`, `--warn-wash`, `--ink`, `--ink-2`, `--muted` and `--action`.

## The walkthrough: `S/peer/r2/builder/scripts/v1_setup.cjs`

It is a copy of the merged `S/scripts/v1_setup.cjs`, and it requires the kit by its absolute path. It keeps the same 28
steps and every selector (`.ag-gaps`, `li:nth-child(2)`, `li.finding`, `.agchip.mine`).

- **Step 22's caption** follows the screen: "Each gap has its own choice, under what the data shows: warn if more
  appear, note it, or stop checking. Why › holds Larkspur's reason."
- **Step 23.**
  - Before its caption, the pointer glides to the finding (`v.glide`). The snapshot shows *People*, *Exceptions* and
    their line lit on the map.
  - The caption says so: "One looks like a real finding: 19 approvals by people HR doesn't list. Pointing at it lights
    the two files it joins. It is left for you to accept on its own."
  - Afterwards the pointer returns to the corner it starts in.
- `v2_fix.cjs`, `v3_explore.cjs`, `v4a_odd.cjs` and `v4b_outlier.cjs` run unchanged from `S/scripts/`.

## Merge notes

- **Others.**
  - Design's `#buildpanel .ag-gaps li` row rule, its `.ag-open` text link and its `.bp-done` ✓ stay, and this patch
    builds on them.
  - The newcomer, owner and dq don't touch `allInView()`.
- **Dead code.** `gapEvidence(x)` is no longer called. It stays to keep the diff small; delete it when merging.
