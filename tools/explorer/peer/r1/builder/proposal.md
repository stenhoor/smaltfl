# Show the join

**Every link between files is shown as the join it is, at the step it is checked.** The panel shows the column on each
side and a few values meeting their twins, with how many were found. The map's line says the same in its label. One tap
turns the link off.

This is a working fix in `S/peer/r1/builder/app`. The patch is `patch.diff` and the change list is `changes.md`. The
walkthrough is `v1_setup.cjs`, a copy of the setup script with the step it skipped put back.

## The problem

The owner said: "I pick a file and then it's joined up to a bunch of things and I don't know why" (§1). Here is why it
happens:

- **Things from unread files appear at once.** Reading `cmdb_apps.csv` draws three kinds. Two of them carry counts and
  a self-link from files nobody has read ("246 units · reports into another unit").
- **The reason is written as a sentence, out of sight.** It sits 450 px below the fold, and it never names the column on
  the other side.
- **The join itself is never a step.** The walkthrough snaps the files list, then announces "the first relation, drawn
  on the map".

The principles it breaks:

- §2 "Steps that happen off screen".
- §3.8 "Show the step: … two columns whose values match, drawn as lines from one file to the other, then the relation
  drawn on the map".
- §3.6 "Label directly".
- §7 (Memorisely): clear hierarchy, every state covered, one card and one button language.

## Screens

Before images are `S/peer/snap/1-setup/NN.png`. After images are `S/peer/r1/builder/snap/1-setup/NN.png`.

**Step numbers move.** After step 16 the walkthrough has two new steps, so after 19 to 28 are before 17 to 26.

**Words** are the render tool's count at 1440x900. The closed description under *More* no longer counts: its text was
never drawn, but the tool counted it, about 35 words.

### 1. Reading the first file: what it points at (1-setup/05)

- **Before:** `S/peer/snap/1-setup/05.png`, 352 words.
- **After:** `snap/1-setup/05.png`, 290 words. Step 03, the same panel scrolled to its top, goes from 352 to 258.
- **Phone:** `v1/1-setup-05-after-phone.png`, 135 words, no sideways scroll.

What changed:

- **A kind pointed at but not read is grey.** It says only what the read file says of it, in the next file's own
  words: *Organisational unit · CMDB names 176 units*. Its chip is the file, `hr_org_units.csv`. It carries no self-link and no count of its own.
  (`syncModel`'s `pointedAt` and `namedIn`; the classes `.pointed` and `.kpoint`.)
- **The line being checked names its column** under its sentence: "Applications are owned by units / owner_team_id →
  not read yet". A line with rows not found says so in words. Every other line shows its columns when pointed at.
  (`lineWhy`; explore.js shows a `why` unasked and a `whyHov` on pointing, muted mono, as `span.lwhy`.)
- **The links come straight after the key.** Each is a dashed card: "CMDB owner_team_id ⇢ not read yet ·
  hr_org_units.csv · 176 ids like TM-062, TM-053 · on all of Feb 1's 2,401 rows", with "Applications are owned by units ·
  Larkspur's model". (`joinCard`; the list `ul.jn-list`.)
- **Cut:**
  - the paragraph explaining the provenance tags (`p.bf-guess`);
  - the key said three times, now once: "all 2,401 unique · and on the 184 days before Feb 1";
  - "✓ Looks right" and "· 2 that could be";
  - *Links, at a glance*;
  - the description beyond its first clause.
- **The foot says** "New kind: Application · 2 links when their files are read", where it said "no links yet".

### 2. The join, checked: a new step (1-setup/17), and one tap to change it (1-setup/18)

- **Before:** no step. The moment shows in the video at 1:35, `S/peer/frames/1-setup/f20.jpg`. The same moment snapped
  from the prototype is `work/snap-before/join-before/01.png`, 338 words.
- **After:** `snap/1-setup/17.png`, 274 words, and `snap/1-setup/18.png`, 263 words.
- **Phone:** `v1/1-setup-17-after-phone.png`, 132 words, no sideways scroll.

What the card shows:

- the two ends, `CMDB owner_team_id` → `Org units org_unit_id`;
- three values meeting their twins: `TM-062 46 apps —— TM-062 ✓`, `TM-053 38 apps`, `TM-010 36 apps`;
- "**All 176 ids found** on Feb 1's 2,401 rows";
- the meaning with its source, "Applications are owned by units · Larkspur's model";
- a switch labelled **Linked**, tonal when on and never filled, so *Add* stays the one primary.

On the map, the line now reads "owner_team_id → org_unit_id".

**One tap** turns the switch off. The card greys, the line leaves the map, and the foot counts "1 link". A second tap
restores both. Going back to Larkspur's own state leaves no trace in "where your model differs".

**A partial match is drawn as one.** Exceptions' `approver_id` shows `P-0093 ✕` and `P-0143 ✕` on broken red lines, a
bar of found and unmatched rows, and "249 of Feb 1's 268 rows found · 19 rows not found: 8 ids not in People".
It is captured at `work/partial/exceptions-approver-desk.png` and `-phone.png`.

### 3. Added: the line names its columns (1-setup/19, was 17)

- **Before:** `S/peer/snap/1-setup/17.png`, 266 words.
- **After:** `snap/1-setup/19.png`, 266 words.
- **Phone:** `v1/1-setup-19-after-phone.png`, 159 words.

The line is solid now and reads "owner_team_id → org_unit_id". Person is grey: "Org units names 240 people", "leader_id →
not read yet". "People work in units" is gone, because it came from `hr_people.csv`, which isn't read yet.

**When every file is in** (after 21, before 19: 662 to 658 words), the lines go back to their sentences. Only the two
lines with gaps say more: "approver_id · 19 rows not found" and "app_tag · 4 rows not found", the same numbers as the
gaps list beside the map. The other six show their columns when pointed at.

## Words

| Step (before → after) | Before | After | Phone after |
|---|---|---|---|
| 03 → 03 | 352 | 258 | |
| 05 → 05 | 352 | 290 | 135 |
| (none) → 17, the join (prototype's same moment) | 338 | 274 | 132 |
| (none) → 18, one tap off | | 263 | |
| 17 → 19 | 266 | 266 | 159 |
| 19 → 21, all files in | 662 | 658 | |

**Why not 200 or fewer.** About 48 words on every screen are the app bar and the Build panel's head and steps, which
aren't mine. The column names on the line being checked add about 10 words on purpose: they are the evidence the
owner asked to see.
The all-in screen's 480 words are the gaps list, left to the dq and design reviewers.

## Works

Each walkthrough ran on this copy in snapshot mode, and each ended with no page errors:

| Walkthrough | Steps here | Steps in the original |
|---|---|---|
| `v1_setup.cjs` (this folder's copy) | 28 | 26, plus the two new ones |
| `v2_fix.cjs` | 19 | 19 |
| `v3_explore.cjs` | 10 | 10 |
| `v4a_odd.cjs` | 12 | 12 |
| `v4b_outlier.cjs` | 11 | 11 |

The phone was also walked live at 390x844 (`work/dev.cjs`, nothing waits a fixed time): `work/final-phone/sheet.png`.

## What I deliberately did not change

- **Other screens and steps.** The rules and the rule of your own (the dq reviewer's), the gaps list, history, checks,
  the days and the Decide panel are as they were. So are the Build panel's head and steps.
- **No new facts.** Every number is in `build.json`. I didn't add "match another column": the prototype has no match
  counts for column pairs it didn't choose.
- **Other tag wordings.** "Larkspur's pick" in the kind choice and the gaps is left as it is; the join cards say
  "Larkspur's model" and "found in the data".
- **Not built:**
  - lighting a card's line on the map when you point at the card;
  - column names in the phone's mini-map.
  On a phone the cards carry the evidence.
- **Dead code.** `linkLi` and `foundLi` are unused but left in place, to keep the diff small.

## Files

All paths are under `S/peer/r1/builder/`.

| What | Path |
|---|---|
| The working copy | `app/` |
| The patch | `patch.diff`: 263 lines, 134 changed (108 added, 26 removed), across index.html, build.js and explore.js |
| The change list | `changes.md` |
| The critique | `critique.md` |
| The walkthrough | `v1_setup.cjs` |
| Every step, after | `snap/<video>/NN.png` and `NN.html`, with `captions.tsv` |
| Phone renders | `v1/1-setup-{05,17,19}-after-phone.png` |
| Word renders | `work/words/` |
| The same moment, before | `work/snap-before/join-before/01.png` |
| The partial match | `work/partial/exceptions-approver-desk.png`, `-phone.png` |

## Round 1: took / declined, and why

All four reviewers agreed, each with a score of 4. This revision is in the same `app/`, and every walkthrough was run
again.

### Took

1. **The finished map goes back to its sentences** (owner 1, newcomer 1, design 1).
   - While files are read, only the line being checked names its columns: the file read, or the file just added.
   - Lines with rows not found say so: "approver_id · 19 rows not found".
   - Every other line shows its columns when pointed at or focused (`whyHov`, `.lwhy.hov`), or for good once tapped.
   - Once every file is in, the map has no key: nothing on it is dashed.
   - Step 21 went from 703 words to 658, below the original's 662. Steps 17 and 19 still read "owner_team_id →
     org_unit_id".
2. **The day the join was checked** (dq 1, 2): "All 176 ids found on Feb 1's 2,401 rows". It no longer sits under the
   key's "184 days before" looking like a 184-day match. "ids" is the unit, said once.
3. **Rows not found, in words** (newcomer): "19 rows not found", on the map and on the card.
4. **One label on the link's control** (owner 2, newcomer 3). It is a switch, `role=switch`, with the fixed label
   "Linked": on is tonal smalt, off is outlined. The state is the switch, not words that flip.
5. **Counts in the file's own noun** (newcomer 2): "46 apps", "5 units", "47 rows" for exceptions, whose rows are
   versions.
6. **A locked link's sentence stands alone** (newcomer 5). "Puts it in its kind" and "Always on" are gone.
7. **The column lines are quieter:** `--muted` at 11 px (design 2).
8. **A key that is true of both dashed states** (newcomer 4): "Dashed: not added yet · grey: named by a file, not read
   yet".
9. **The newcomer's words for a kind pointed at:** "CMDB names 176 units", the next file's card's own words, as the
   coordinator asked. `k.pointedShort` ("named in CMDB") is there for the newcomer's phone mini-map. `changes.md`,
   *Merge notes*, says exactly where each piece comes from.
10. **The partial match captured** (dq 3): `work/partial/exceptions-approver-desk.png` and `-phone.png`. The bar's
    unmatched part is 19 of 268, 7.1%, and it is legible at 390x844.

### Declined

- **The join card as a hairline row with no fill** (owner 3). Design, which owns the card language, asked to keep it:
  with design's block on top, the join cards are the panel's one card and the step's focus. The dashed outline stays,
  for "not read yet" only.
- **"Dashed: not read yet" as the whole key** (design 3). The file being read is read, so "not read yet" is wrong for
  it. The newcomer's "not added yet", plus "grey: named by a file", is true of both states.
- **Column names in the phone's mini-map** (newcomer 6). That is the newcomer's `modelPic` line, kept in the merge. It
  reads my `k.pointedShort`. I don't copy it into this patch.
- **The partial match as a walkthrough step** (dq 3). It is a `work/` render instead, so the 28 step numbers the other
  reviewers cite don't move.

