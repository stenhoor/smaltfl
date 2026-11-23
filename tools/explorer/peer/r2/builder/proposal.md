# What reading found, at a glance

**Each gap after every file is read becomes one row:** its address (file · column), its count against the whole, a bar
of the two, and one line of what the data shows. Larkspur's reason, the days and every setting sit one tap away, behind
*Why ›*. Pointing at a gap lights its files, and for a link its line, on the map.

This is a working fix in `S/peer/r2/builder/app`, built on the merged prototype.

- **Patch:** `patch.diff`, 57 lines changed (55 added, 2 removed). It applies cleanly to `S/explore/`.
- **Change list:** `changes.md`.
- **Walkthrough:** `scripts/v1_setup.cjs`, the merged setup script with two captions updated and a pointer glide. It
  has the same 28 steps.

## The problem (critique 1 and 2)

The gaps screen (1-setup/21 to 26) is setup's heaviest: 724 to 942 visible words. Even with closed folds left out, 437
to 481 are drawn. It is the moment a builder decides, gap by gap, whether each is how the files are made or a real
problem, and today:

- **Each gap is a 15- to 20-word sentence.** For example: "Exceptions: 19 of 268 rows name one of 8 approvers who
  aren't among the 245 people in the HR file".
- **The evidence is two folds down,** under "evidence ›" and then "Why, and the evidence ›". The evidence is what makes
  Larkspur's pick right: platform_id is blank only on the SaaS apps; the 8 approver ids.
- **Opened, a gap shows two controls for one setting** and its reason twice.
- **The head repeats the map,** and a 45-word paragraph explains the button.
- **Nothing ties a gap to where it lives.** Approver_id's 19 rows are said three ways in three places: the reading card,
  the map's line and the gap.

The principles it breaks:

- §2: words doing a picture's job, the same fact in three places, steps off screen.
- §3.6, §3.7: show, don't tell; the answer first, the method one tap away.
- §3.8: show the evidence when it is used.
- §7: clear hierarchy, one control per setting, every state covered.

## Screens

Before images are `S/peer/snap2/1-setup/NN.png` (the merged product). After images are
`S/peer/r2/builder/snap/1-setup/NN.png`, for the same step of the same walkthrough. Side-by-side copies are
`v1/1-setup-21-pair.png` and `v1/1-setup-23-pair.png`.

### 1. Every file is in: the six gaps (1-setup/21; 22 to 25 are the same screen scrolled)

- **Before:** `S/peer/snap2/1-setup/21.png`, 724 words (437 drawn). Steps 22 to 25: 913 (456 drawn).
- **After:** `snap/1-setup/21.png`, **338 words**. Steps 22 to 25: **341**.
- **Phone:** `v1/1-setup-21-after-phone.png`, 160 words, no sideways scroll.

What changed:

- **A gap is one row** (`gapGlance`, `span.gp-h`, `.gp-n`, `.gp-bar`, `.gp-ev`, `.gp-act`):
  - its address and count: "Exceptions `approver_id` · **19** of 268 rows";
  - a bar from zero, with the gap hatched: grey for most, amber only on the finding, which is also tagged "looks like a
    finding";
  - one line of what the data shows: "P-0093, P-0143 … 8 ids not in People", "blank only on the SaaS apps", "no
    leader: 4 teams, 1 department, 1 business unit";
  - the quick choice, unchanged, with Larkspur's pick marked, and *Why ›*.
- **One fold, not two.** *Why ›* opens Larkspur's reason with its source, the days it would have warned, the four-way
  control and the effect. The nested "Why, and the evidence ›" is gone.
- **One control at a time.** While the fold is open, the row's quick choice hides and the fold's four-way control sets
  it.
- **The head is said once.**
  - The files: "All 22 files are in · 5 kinds · 8 links". The five kinds are hidden where the map beside the panel
    shows them; a phone keeps them.
  - The heading: "Gaps in Feb 1's files · 6".
  - The 45-word paragraph is now one line: "Until you accept them as known, each is listed every day."
- **A closed fold's text isn't drawn**, so it isn't counted either. That was about 290 words the screen never showed.

### 2. The finding, pointed at (1-setup/23)

- **Before:** `S/peer/snap2/1-setup/23.png`, 913 words.
- **After:** `snap/1-setup/23.png`, **341 words**.
- **Phone:** `v1/1-setup-23-after-phone.png`, 183 words.

**Pointing at the finding, or tabbing to it, lights what it is about on the map:** *Exceptions* and *People*, and their
line, "People approve exceptions to controls · approver_id · 19 rows not found". The gap, its two files and the join it
breaks are then one picture. Built in `drawPanel()` (`li.gp` `data-gf`, `data-gt` and `data-gc`; the class `gp-lit`). It
also works for every other gap: pointing at CMDB's lights CMDB.

### 3. Accepted (1-setup/26)

- **Before:** `S/peer/snap2/1-setup/26.png`, 942 words.
- **After:** `snap/1-setup/26.png`, **388 words**.
- **Phone:** `v1/1-setup-26-after-phone.png`, 181 words.

After you accept, each row says what was accepted and what happens next, for example "✓ accepted at 675: more won't be
flagged". One of these was untrue: an accepted gap set to Note said "more will warn". It now says "more are noted",
because Note doesn't warn.

## Words

| Step | Before (merged) | Before, closed folds left out | After | Phone after |
|---|---|---|---|---|
| 1-setup/21 | 724 | 437 | **338** | 160 |
| 1-setup/22 to 25 | 913 | 456 | **341** | 183 (23) |
| 1-setup/26 | 942 | 481 | **388** | 181 |
| every other step, all five walkthroughs | | | the same as `S/peer/words-r36.txt` (74 of 80) | |

**Why not 200 or fewer.** The rest is outside my change:

| Part of the screen | Words |
|---|---|
| The map beside the panel: five kinds, 22 file names, eight relation sentences and the two "rows not found" lines | 115 |
| The app bar, the Build panel's head and its foot | 63 |
| The panel's six rows and head | about 160 |

Getting under 200 would mean hiding the map. On this screen the map is the evidence of where each gap lives, and
pointing at a gap now lights it there.

## Works

Each walkthrough ran on `app/` in snapshot mode and ended with **no page errors**:

| Walkthrough | Steps here | Steps in the merged baseline |
|---|---|---|
| `scripts/v1_setup.cjs` (this folder's copy) | 28 | 28 |
| `S/scripts/v2_fix.cjs` | 19 | 19 |
| `S/scripts/v3_explore.cjs` | 10 | 10 |
| `S/scripts/v4a_odd.cjs` | 12 | 12 |
| `S/scripts/v4b_outlier.cjs` | 11 | 11 |

The phone was also walked live at 390x844 (`work/gaps.cjs`, which waits on the page and never a fixed time):
`work/v1/phone-sheet.png`, with a row open in the middle.

## The four questions of §7

- **Clear hierarchy.** Each gap's address and count lead. The bar shows its size. The only colour is on the finding,
  with its word. Larkspur's reason and the settings are one tap away.
- **Every state covered:**
  - before you accept (21);
  - the finding pointed at (23);
  - your rule watching a gap (the platform row, "Your rule: … · Warn");
  - accepted (26);
  - declined ("✕ Not accepted by you …");
  - a row open, with one control (`work/v1/b-gap-open-desk.png`);
  - a phone.
- **Matches the system.**
  - Design's row dividers and text link are kept.
  - Smalt marks only the state you pointed at, as focus does.
  - Tokens only: 11, 12 and 13 px, three weights, no new colour.
- **Ready to ship.** It runs in all five walkthroughs, on a phone too, and the patch applies cleanly.

## What I deliberately did not change

- **What each gap does.** The quick choice's words ("Warn if more · Note it · Stop checking"), the four-way control in
  the fold, Larkspur's picks, the finding's own *Accept it as known*, and both footer buttons are as merged.
  - The three vocabularies for one setting are critique 5. Settling them is a system call for design.
  - The finding's own accept stays one fold down, beside "Worth asking about before you accept it", on purpose: it is
    the one gap to look into first.
- **Other screens.** The map's own words, history (27) and checks (28), critique 3 and 4, are unchanged. So is
  everything after setup.
- **No new facts.** Every number and id is in `build.json`. The evidence lines say only what the data shows. Larkspur's
  interpretations ("a vendor runs them", "an approver needn't lead a unit") stay with their source tag in the fold.
- **Dead code.** `gapEvidence(x)` is no longer called. It stays to keep the diff small; see *Merge notes* in
  `changes.md`.

## Files

All paths are under `S/peer/r2/builder/`.

| What | Path |
|---|---|
| The working copy | `app/` |
| The patch | `patch.diff`: 90 lines, 57 changed (55 added, 2 removed), in index.html and build.js |
| The change list | `changes.md` |
| The critique | `critique.md` |
| The walkthrough | `scripts/v1_setup.cjs` |
| Every step, after | `snap/<video>/NN.png` and `NN.html`, with `captions.tsv` |
| Phone renders | `v1/1-setup-{21,23,26}-after-phone.png` |
| Before and after pairs | `v1/1-setup-{21,23}-pair.png` |
| Word renders | `work/words/` and `work/words-after.txt` |
