# Say why before asking

**The newcomer's working fix, round 2.** Once every file is read, setup asks six questions at once. This fix tells the
newcomer why, says once what each answer does, and puts the one gap worth asking about first, so that "Accept the 5"
refers to something on screen.

Paths are under `S/peer/r2/newcomer/` unless they start with `S/`.

- **The working app** is `app/`.
- **The patch** is `patch.diff`: 26 changed lines, 21 added and 5 removed, in `build.js` and the page's CSS.
- **The changes**, each with its function and selector, are in `changes.md`.
- **The critique** is `critique.md`.

## Works

- **The five official walkthroughs** run unchanged on `app/` in snapshot mode, each with its seed: `v1_setup`, `v2_fix`,
  `v3_explore`, `v4a_odd` and `v4b_outlier`. All end with **no page errors**. Their snapshots are in `snap/<video>/`.
- **The phone:** `render.cjs` at 390x844 shows no sideways scroll. A live phone run from a seed with every file in also
  works: `work/p-allin-phone.png`.
- **Every state checked live:**
  - a row opened (`work/p-allin-open.png`): its fold, strip of days and four-way control are all still there;
  - the accepted state (`work/p-allin-acc.png`);
  - your own rule's row ("Watched by your rule").
- **Nothing else moved.** 74 of the 80 steps keep the same visible words as `S/peer/words-r36.txt`
  (`work/words-after.txt`). The six that changed are 1-setup/21 to 26.

## The problem it fixes (critique item 1)

Video 1, steps 21 to 26, after every file is read. The panel shows:

- "Problems already in the data on Feb 1 · 6";
- a paragraph that only counts the settings ("1 warn if more appear, 1 noted, 3 off, 1 watched by your rule… The
  finding is left for you to accept on its own");
- six rows in data words, each with "Warn if more / Note it / Stop checking";
- a button, "Accept the 5, each as set", under six rows.

Nothing says why I must accept them, what each setting does, or what "the finding" is. At 913 to 942 visible words, it
is the heaviest screen in the product.

It breaks:

- §2: steps that happen off screen; everything at the same volume.
- §3.5: one focal point.
- §3.7: the answer first, the method on demand.
- §3.8: show the step.
- §7: clear hierarchy.

## The screen

| | Before (`S/peer/snap2/1-setup/NN.png`) | After (`snap/1-setup/NN.png`) | Visible words |
|---|---|---|---|
| 21, every file in | `S/peer/snap2/1-setup/21.png` | `snap/1-setup/21.png` | 724 → **409** |
| 22 to 25, the gaps | `S/peer/snap2/1-setup/22.png` | `snap/1-setup/22.png` | 913 → **419** |
| 26, accepted | `S/peer/snap2/1-setup/26.png` | `snap/1-setup/26.png` | 942 → **454** |
| 21 on a phone | `v1/1-setup-21-before-phone.png` | `v1/1-setup-21-after-phone.png` | 342 → **186** |

Side by side: `compare/1-setup-21.png`, `compare/1-setup-22.png`, `compare/1-setup-26.png` and
`compare/1-setup-21-phone.png`.

**What changed, top to bottom:**

1. **One word for them.** The heading becomes "Gaps already in Feb 1's files · 6", the word the step, the receipt and
   the record already use.
2. **The why, in one line.** "Accept each as known, or it is listed every day." It replaces the 50-word counting
   paragraph. The consequence is the product's own, from what declining does.
3. **The three settings, said once.**
   - **Warn if more:** the day is marked ◆ when there are more.
   - **Note it:** listed, the day unmarked.
   - **Stop checking:** not checked.
   - The words come from the effects the closed folds already held (`GAP_EFFECT`, `MODE_EFFECT`).
4. **Two groups.** "Worth asking about · 1" comes first. It is the finding, which keeps its own "Accept it as known"
   link in its row in place of a "looks like a finding" tag. Then "Explained · 5": each grey line under a row says why
   it is expected.
5. **Two long headlines said shorter, with the same facts:**
   - "19 of 268 rows name an approver the HR file doesn't list";
   - "15 of 253 exceptions have no version 1 row".
6. **One primary action that names its group:** "Accept the 5 explained ›". The recount line above the buttons is gone.
7. **Subtracted:**
   - A closed row's fold takes no room until it is opened. The tool counted about 480 hidden words there; opening a row
     is unchanged.
   - Beside the map, the line of kinds and counts that repeats the map's own boxes is gone. On a phone, where the map
     is behind a button, it stays.
   - The accepted line drops "From then on each does what you set beside it", which the key now says.

**Why it is 419, not 250.**

- **The map behind holds 115 words.** They are the kinds, their files and the builder's lines, and the map isn't mine.
- **The panel holds 281:**
  - the six gaps with their reasons, 195;
  - the head, the why and the key, about 70;
  - the buttons.
- **Every row stays.** Each one is a decision this step records. I kept each row's grey reason, the line a newcomer
  needs most.
- **What would cut next:** show only each row's current setting, with the three choices behind a tap. That saves about
  24 words. I didn't do it this round, because the walkthrough's caption shows the choices.

## Against §7 (Memorisely's four questions)

- **Clear hierarchy:** the why, then the key, then the one gap to ask about, then the five explained, then one primary
  button that names them.
- **Every state covered:**
  - nothing accepted yet;
  - a row opened, with its fold;
  - accepted, with the finding still open;
  - declined (unchanged);
  - a gap watched by your own rule;
  - a phone.
- **Matches the system:** existing tokens only (`--muted`, `--ink-2`), one size (12 px) and weight (600) for the new
  lines, and design's dividers. No new colour, border, button or motion.
- **Ready to ship:** all five walkthroughs, no page errors, no sideways scroll.

## What I deliberately did not change

- **The checks step (27, 28) and the history step.** They are items 2 and 3 of my critique, and the rules are dq's and
  the builder's ground.
- **The map on this step**, its column lines and the step strip.
- **What each setting does, the choices themselves and their order, the evidence, the record, and declining.**
- **The official script and its captions.** Each still holds: "Each problem has its own choice, with its reason under
  it", "One looks like a real finding … left for you to accept on its own", "Accept the other five as known".
