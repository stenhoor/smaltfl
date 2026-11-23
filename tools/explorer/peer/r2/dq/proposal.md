# What reading found, settled on one screen

**dq, round 2, revision 1: the combined gaps step, built on the merged product.**

Paths are relative to `S` = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.
- The app is `peer/r2/dq/app`.
- The patch is `peer/r2/dq/patch.diff`: 102 lines added and 4 removed.
- Every change is named in `peer/r2/dq/changes.md`, with its merge notes.

![the gaps step, before and after](v1/gaps-before-after.png)

`peer/r2/dq/v1/gaps-before-after.png` is the whole gaps panel at step 22, as merged (left) and combined (right).

## The problem
The end of setup is where the user settles six problems already in Feb 1's files. Each is either how the files are
made (accept it as known) or worth asking about. Four of us found the same faults (critique 1, and the reviews):

- **Sizes as sentences.** 0.2%, 2.4%, 7.1% and 36.9% had to be worked out from "4 of 1,830", "675 of 1,830" and the
  rest.
- **The picture folded,** the words shown.
- **The one gap worth asking about** sat as one row among six.
- **One setting, two controls and three vocabularies.**
- **Pause a tap away on a gap,** with what it would pause hidden: 55 of 56 days on the tags.
- **A 50-word paragraph and a recount line** said the settings again.

**Principles:** §3.6 (show, don't tell; one scale; highlight one), §3.7 (the answer first), §3.8 (show the evidence where
it is used), §5 (a threshold is a line), §6 (colour by role; said once), §7 (one component; every state; ready to ship).

## Round 2: the combination, what came from whom
Three of four reviewers chose dq's rows as the base. The rest is ported from the builder, the newcomer and design, whose
gaps patches won't ship separately.

| On the screen | From |
|---|---|
| Each gap one row: "Exceptions · 8 approvers not in the HR file", "19 of 268 rows" right-aligned, one bar on one 0–100% scale | dq |
| The gap the **dark** mark on a pale track (figure and ground flipped, as the builder's and design's reviews asked); the open finding the one amber; blanks hatched | dq |
| "all non-production" and "all SaaS" on the two blank gaps' bars; "your rule: at most 15%" as a line on the platform bar | dq |
| The share only where the bar can't show it: the tags' 0.2% and the platform's 14.4% against its 15% line | dq (the reviewers split; my call) |
| "no version 1 row", not "version 2 alone" | newcomer |
| The why, one line: "Accept each as known, or it is listed every day." | newcomer |
| "Worth asking about · 1" first, with the finding's own **Accept it as known**; then "Explained · 5" | newcomer |
| **Accept the 5 explained ›**; no recount line over the buttons | newcomer (with the builder and design) |
| One control from the kit, **Pause · Warn · Note · Off**, with Larkspur's pick dot visible again; pill-sized on a desktop, 44 px on a phone | design |
| The key, one line in those four words: "Pause holds the day · Warn marks it ◆ · Note lists them · Off stops checking" | design (words), newcomer (said once) |
| Whatever is picked, the row says what it does over the 56 days: "Warns on 1 of 56 days: Feb 24", "Pauses 55 of 56 days", "Listed, no day marked", "Not checked" | dq and builder (the concern), all four |
| Pointing at a gap lights its files, and for a link its line, on the map | builder |
| One fold per row ("Why ›"): the column, Larkspur's reason with its source, the ids, the 56-day strip, "Warn when", what Pause would stop; no control repeated | builder |
| The head said once: "All 22 files are in · 5 kinds · 8 links between them"; the kinds line hidden beside the map, kept on a phone | builder, newcomer, design |
| Accepted rows say their consequence: "✓ accepted at 4 · listed, no day marked", never "more will warn" for Note | builder (the truth fix) |
| Rows, not tinted tiles; names at 600; an 11 px floor | design |

**Every number checked** (`proto/modecheck.cjs`):
- Each of the five gaps with a control was tapped through Pause, Warn, Note and Off in the live app.
- All 20 sentences match counts computed independently from `build.json`'s day records:
  - approvers: 1 day (Feb 24);
  - versions: 5;
  - tags: 55;
  - clusters: 20;
  - leaders: 7.
- Your rule's row says "Warns on none of the 56 days", as the checks step says "never broke".

## Screens
Before is `S/peer/snap2/1-setup/NN.png`; after is `S/peer/r2/dq/snap/1-setup/NN.png`, from my app in snapshot mode. Words
use the fixed counter (closed folds not counted) against `S/peer/words-r36-fixed.txt`.

| Step | Before | After | Words |
|---|---|---|---|
| **22** (and 24, 25): the gaps, to settle | `S/peer/snap2/1-setup/22.png` | `S/peer/r2/dq/snap/1-setup/22.png` | **476 → 384** |
| 22, phone 390×844 | `peer/r2/dq/proto/1-setup-22-before-phone.png` | `peer/r2/dq/v1/1-setup-22-after-phone.png` | **261 → 172** |
| **23**: the finding pointed at; People, Exceptions and their line lit on the map | `S/peer/snap2/1-setup/23.png` | `S/peer/r2/dq/snap/1-setup/23.png` | 476 → 384 |
| 21: the list as it opens | `S/peer/snap2/1-setup/21.png` | `S/peer/r2/dq/snap/1-setup/21.png` | 449 → 347 |
| **26**: five accepted, the finding still open | `S/peer/snap2/1-setup/26.png` | `S/peer/r2/dq/snap/1-setup/26.png` | **501 → 390** |
| 26, phone 390×844 | `peer/r2/dq/proto/1-setup-26-before-phone.png` | `peer/r2/dq/v1/1-setup-26-after-phone.png` | 246 → 174 |

- **Nothing scrolls sideways** at 390, 820 or 1440 (`v1/1-setup-22-after-tablet.png`).
- **No step's count rose** (`peer/r2/dq/words.tsv`).
- **The days' cards** move by one to three words (the closed-fold rule). They are pixel-identical with every animation
  finished (`proto/pxsame.cjs`).
- **Why 380 and not 250.** The map beside the panel (115) and the bar, the panel's head and its steps (about 70) are
  outside this step. The six rows, the why, the key and the groups are about 190. On a phone, where the map is behind a
  button, the step is 171.

## Three small truth fixes from earlier in round 2 (kept)
- **History's chips on one scale** (step 27): the cards' scale, not each file's own min and max
  (`v1/history-chips-before-after.png` was the comparison).
- **A closed fold's contents not drawn** in the Build panel. It is design's app-wide rule; keep one in the merge.
- **My round-1 figure** keeps 11 px labels in the corrected file's narrow fold at 820×1180.

## Memorisely's four questions (§7)
- **Clear hierarchy.** The one gap to ask about leads, under its own heading, with the one amber bar. Then five
  explained rows, each read as name, count, bar, reason, control, consequence.
- **Every state covered:**
  - nothing accepted (22), the finding pointed at (23), accepted (26), declined;
  - your rule watching a gap (its line, its days);
  - each of the four modes on each gap (20 checked), an opened fold (`v1/finding-fold-open.png`);
  - phone, tablet and desktop.
- **Matches the system.** The kit's segmented control and four words; base tokens only; 11, 12 and 13 px; weights 400
  and 600; no new colour.
- **Ready to ship.**
  - All five walkthroughs ran on the final code with no page errors: my `v1_setup.cjs` copy (28 steps, the builder's
    step-23 glide included), and `v2_fix`, `v3_explore`, `v4a_odd` and `v4b_outlier` from `S/scripts/`.
  - Step counts are 28, 19, 10, 12 and 11.

## What I deliberately did not change
- **What each gap is, does and records:** `gapsFound`, the modes and their effects, Larkspur's picks, the finding,
  your rule, the evidence, accept and decline.
- **The builder's summary evidence lines** ("blank only on the SaaS apps", the ids) were not taken. The segment labels
  say the first, and the ids are behind Why ›, as the combination asked.
- **The checks step (28)** and the other screens.

## Round 2 polish
The combination was agreed 4 of 4 (design 4, builder 5, newcomer 5, owner 5). I took all three polish items.

1. **The pointed gap stays lit after the map redraws** (builder).
   - **The hole.** Picking a setting redraws the map's labels about half a second later, and the new label lost its
     outline.
   - **The fix.** One `MutationObserver` on `#stage` (child list), in the same once-only block as the pointer listeners.
     When labels are added again, it re-lights the row under the pointer or the one with focus
     (`li.gp:hover, li.gp:focus-within`).
   - **Tested** with the builder's `litafter.cjs`, made to read once the labels are back (`proto/litafter2.cjs`); the
     original read in the gap between removal and redraw.
     - On the app before the fix: after a pick, only the two files were lit, and the line was not.
     - After it: "d:hr_people | d:exceptions | label", and still after a 3 px move.
2. **The 56 days named once, and the dot said in words** (newcomer).
   - The key ends "· • Larkspur's pick", and a second line says "The 56 days: Feb 1 to Mar 27". The dates come from the
     data (`DATA.days[0]` and `LAST`).
   - The rows keep "of 56 days".
   - The dot in the key has its own rule: a base rule flattens a bare `.lkdot`.
3. **The finding's row shows the approver ids in place of Larkspur's reason** (owner).
   - It reads "P-0093 P-0143 P-0037 P-0004 P-0061 +3 more". The reason moves into the fold, whole, with its source tag.
     The fold no longer repeats the ids.
   - **Five, not eight.** The build records five of the eight ids for Feb 1 (`miss`, with `missDistinct` 8). The rows
     files are Mar 27's, so they can't give Feb 1's other three. "+3 more" says the count truthfully.

**Left for design**, as the coordinator asked: the `.seg` chosen state (a tonal fill, not a smalt ring) is the global
component's.

**Re-proved:**
- All five walkthroughs ran on the final code with no page errors: my `v1_setup.cjs` copy (28 steps) and the other four
  from `S/scripts/`. Step counts are 28, 19, 10, 12 and 11.
- `proto/modecheck.cjs` still matches all 20 mode sentences to `build.json`.
- **Words (fixed counter):** 22 is 476 → 384 and 26 is 501 → 390. On the phone, 22 is 261 → 172 and 26 is 246 → 174.
  No step rose; the key's two additions cost four words.
- The patch is regenerated: 102 lines added and 4 removed.
- The fold, opened: `v1/finding-fold-open.png`.

