# Say why, show the thing

**The newcomer's working fix, revision 1.**

- A file opened shows a real row, not a list of definitions.
- Outputs held by another file are said to wait once, not ten times.
- The rows open on the column you tapped.
- On a phone, the small map says why each dashed box is there. On the desktop map that is now the builder's, as all
  four reviewers asked.

Paths below are under `S/peer/r1/newcomer/` unless they start with `S/`.

- **The working app** is `app/`.
- **The patch** is `patch.diff`: 80 changed lines, 64 added and 16 removed, in `explore.js`, `build.js` and the page's
  CSS.
- **The list of changes** is `changes.md`: each change with its function and selector, and the merge notes.
- **Side-by-side pictures** are in `compare/`.

## Works

- **The five official walkthroughs** ran on `app/` in snapshot mode (`VX_SNAP=snap VX_NOVIDEO=1`), each with its seed:
  `v1_setup`, `v2_fix`, `v3_explore`, `v4a_odd` and `v4b_outlier`. Each ended with **no page errors**, and their
  snapshots are in `snap/<video>/`.
- **Two scripts of my own,** also with no page errors:
  - `scripts/v3_explore_rows.cjs` is the official explore script plus one screenshot of the rows sheet, which the
    official script never captures.
  - `scripts/phone_walk.cjs` walks the fix at 390x844.
- **The phone:** each phone snapshot was rendered at 390x844 with `render.cjs`, and none scrolls sideways.
- **Nothing else moved.** 72 of the 78 steps have the same visible words as before (`work/words-after.txt` against
  `S/peer/words-before.txt`). The 6 that changed are explore 05 to 10.
- **The merge.** The JS of all five patches applies together, in any of three orders tried. I assembled one app from
  all five and walked setup on it: no page errors (see `changes.md`, "Merge notes").

## Screen 1: a file shows one real row, and its outputs wait once (3-explore/05 to 10)

**The problem:**

- TLS opens to eight definitions with type tags ("key · text", "code · text") and not one value.
- What one row is sits on a dashed line far above, in column words: "in scope: exposure: internet or partner".
- Beside it, ten outputs each say "waits", about 150 words, for a hold that belongs to another file.

It breaks §3.6 "Show, don't tell", §3.9 "Real content", §2 "The same fact said in three places" and §3.7 "Progressive
disclosure".

| | Path | Visible words |
|---|---|---|
| Before | `S/peer/snap/3-explore/05.png` | 362 |
| After | `snap/3-explore/05.png` | **217** |
| After, MFA from Ctrl K | `snap/3-explore/10.png` | 335 → 190 |
| Phone | `snap-phone/phone/01-render-390.png` | 126 |
| Side by side | `compare/3-explore-05.png`, and CMDB with labels: `compare/3-explore-cmdb.png` | |

**The changes:**

- **One real row, read down.**
  - Each column shows today's first row beside its meaning: APP-0003, cascade-docs.larkspur.example, ing-east-2,
    ca-int-1, TLS1.3, 2024-09-05, no, pass.
  - Values are spelled as the file and the rows sheet spell them. A label follows, muted, only where it says more than
    the value ("pii · Personal data", "active · Live").
  - The key's value is bold and a blank is italic. Hovering a value shows the kind of column it replaced.
  - The header row reads "Tap a column for all its values" and "Today’s first row".
  - The row is the model's own `sample[0]`: the rows the rows sheet shows, and only for that day's file with rows in
    it, or a fixed file.
  - Otherwise the card keeps its type tags, as before.
- **Who is in the file, in words.** "one row per application / only those open to the internet or partners, live or
  retiring".
- **The outputs wait once.**
  - Where another file's pause holds them, each output is one line, its name.
  - The header says it once: "10 outputs use it · ⧗ Held today: Access reviews paused, not this file".
  - Where every output waits, the rows lose their ⧗ too.
  - The paused file's own page keeps its full list.
- **No key of marks the page doesn't show.** The hint sits above the columns.

**Why 217 words, not 200:**

- Most of what is left is what the newcomer opened the file to read: Larkspur's meanings of its 8 columns, today's 8
  values and the names of the 11 outputs.
- The bar at the top is another 22.

## Screen 2: the rows open on the column you tapped (3-explore/08)

**The problem:**

- The caption says "opened on the column you tapped", but status, the column tapped, is off the right edge.
- The card's *Explore rows* didn't carry the column.

It breaks §2 "Steps that happen off screen" and §3.5 "One focal point".

| | Path |
|---|---|
| Before | `S/peer/frames/3-explore/f11.jpg`, the rows as the video shows them. The step's snapshot is taken before the tap. |
| After | `snap-rows/3-explore/08b.png`: app_id, **status**, endpoint…, status underlined in smalt with its cells tinted `--sunk` |
| Phone | `snap-phone/phone/02-render-390.png`: status is the second of the three columns that fit |
| Side by side | `compare/3-explore-08-rows.png` |

## Screen 3: on a phone, the small map says why a dashed box is there (1-setup/03)

**The problem:**

- Reading `cmdb_apps.csv` draws Organisational unit and Platform at once, and the reason is out of sight (§1, the
  owner's own complaint).
- On a phone the small map is the only map, and its boxes said "1 file" for files nobody had read.

| | Path | Visible words |
|---|---|---|
| Phone, after | `snap-phone/phone/03-render-390.png`: "named in CMDB" on Organisational unit and Platform | 195 |
| Merged with the builder's map | `compare/merged-1-setup-03.png`: the desktop map's "176 named in CMDB" beside the phone's "named in CMDB", from one app assembled from all five patches | |

The desktop map's dashed kinds are the builder's ("176 named in CMDB", the chip named by its file, nothing from an
unread file), so 1-setup/03 on the desktop is unchanged in my copy alone: 352 words, as before.

## Against inspiration §7 (Memorisely's four questions)

- **Clear hierarchy.** On a file's page the focal point is now the file's own row, and its outputs are one line each.
- **Every state covered:**
  - a file with rows today, and a fixed file (Platform list), shows its row;
  - an empty or paused file keeps its kinds of column and its full list of what waits (`work/p-ar.png`);
  - every output held elsewhere is said once (`work/p-platforms.png`);
  - setup's other days keep their kinds of column;
  - a blank says "blank", and a label that says more is shown.
- **Matches the system.** Only existing sizes (11 and 12 px), weights (400 and 600) and tokens. No new colour, border,
  button or motion.
- **Ready to ship.** All five walkthroughs and the phone walk run, nothing scrolls sideways, and the JS merges with the
  other four fixes.

## What I deliberately did not change

- **The read panel in setup, and the desktop map's dashed kinds.** They are the builder's.
- **The estate's ⧗ badges and its key** (3-explore/01), and the dashed kinds' colours. They are design's.
- **The kind page's labels** ("THE REGISTER: EVERY APPLICATION"), my critique item 7. Kept for a later round, so this
  fix stays small enough to merge.
- **The Decide panels, banners and receipts.** They are the owner's and dq's.
- **The official scripts and their captions.** All five run unchanged.

## Round 1: took / declined, and why

All four reviewers agreed (4, 4, 4, 4). What each asked, and what I did:

**Took:**

1. **The builder's handling of unread kinds** (all four). My Org units box still showed "↻ reports into another unit",
   from a file nobody had read.
   - I removed my version: `namedBy`, the kinds' `why`, the kind card's `.kwhy` and its CSS.
   - I kept my hands off the three lines the builder edits, so no line is edited by both patches.
   - How the two combine is in `changes.md`, "Merge notes", checked on an app assembled from all five patches.
2. **The builder's "176 named in CMDB" owns the pointed-at kind's line; my short phone form stays** (design, owner).
   `modelPic` now calls `namedShort`, which reads the builder's `k.pointed` without its count ("named in CMDB"), or
   finds the file itself when the builder's patch isn't in.
   - The builder and dq preferred my wording, "CMDB names 176 units", for the kind card. I followed the coordinator's
     call for "176 named in CMDB", which puts the number first (§3.3).
3. **The value's title keeps the kind of column it replaced** (builder): "status · code · text · today’s first row:
   pass".
4. **One spelling of a value per screen** (dq). The card shows the value as the file and the rows sheet do ("pass",
   "no"). A label is added, muted, only where it says more ("pii · Personal data", "CLOUD-EAST · Cloud, east").
5. **The ⧗ said once** (owner), where every output waits on another file's pause (Platform list: one output, held by
   Access reviews). Where some don't wait (TLS: its own check isn't held), the marks stay, as the owner's rule says.
6. **In passing:** a fixed file (`refDay: "fixed"`, the same every day) now shows its first row too, since its sample is
   every day's.
7. **One map key, the builder's, with my "dashed: not added yet"** (owner, builder). The builder's patch owns `mapKey`,
   so I took my wording out of my patch. The merge note asks for the builder's key with "not added yet", which the
   builder agreed to: the file being read is read, only not added.
8. **The first row under design's type floor** (owner): checked, nothing to change. The dataset level places the file
   card at scale 1, so design's `--ks` floor never shrinks it.

**Declined:**

1. **"of 3 values" beside each coded value** (dq), so that "pass" isn't read as "everything passes".
   - It would add about 15 words across five of TLS's eight rows, on the screen I cut to 217, which goes against §2
     and §3.3.
   - Both dq and the builder asked me to keep "Today’s first row" as the header.
   - What I did instead: once, in the header row's hint, "Tap a column for all its values". It says that the value is
     one of many, and where the rest are, one tap away.
