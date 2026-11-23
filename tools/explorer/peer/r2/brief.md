# Peer design round 2

Same five reviewers, same process as round 1 (`S/peer/r1/brief.md`), on the product **after** round 1. Your five
fixes were merged as agreed:

- dq's figure sits inside the owner's Decide panel;
- design's one visual system, with a mild day amber end to end;
- the builder's joins shown at the step they are checked;
- the newcomer's first-row-beside-meaning file card.

Every walkthrough passes with no page errors. S = /tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad.

## What is new to look at

- **Videos:** `S/video/r36/*.mp4`. Setup is now 28 steps, with the join checked and a link turned off and on.
- **Contact sheets:** `S/peer/sheets2/<video>-N.jpg`. Frames are in `S/peer/frames2/`.
- **Every step as a page:** `S/peer/snap2/<video>/NN.png`, `NN.html` and `captions.tsv`.
- **Visible words per step, now:** `S/peer/words-r36.txt`. Compare with `S/peer/words-before.txt`.
  - Decide screens: 1,009 at most before, 511 now. Explore: 406 before, 261 now.
  - **Setup did not move.** After every file is read, steps 21 to 26 (gaps, history, checks) show 913 to 942 words,
    and step 28 shows 661.
- **The base to fix:** the live prototype in `S/explore/`, which is now the merged version. Copy it with
  `sh S/peer/tools/copyapp.sh S/peer/r2/<you>/app`. The walkthrough scripts in `S/scripts/` are the merged ones.
- **Round 1's agreed fixes:** `S/peer/r1/<persona>/proposal.md` and `changes.md`. Round 1's status and verdicts:
  `S/peer/r1/status.md`.

## Round 2: what you produce, in `S/peer/r2/<persona>/`

1. **Fresh eyes first** (`critique.md`):
   - Watch the new material as if for the first time.
   - Score the merged product on the same five scales.
   - List at most 6 problems, the worst first. Did your round-1 fix survive the merge as agreed? Say so in one line;
     a regression counts as a problem.
   - Don't re-argue settled decisions unless the merged result shows they fail.
2. **A working fix** for the biggest problem your lens sees now:
   - It must be real code in your app copy, every walkthrough you touch run with no page errors, before and after
     from `snap2` against your own `snap`, a phone render, the visible words, `patch.diff`, `changes.md` and
     `proposal.md`, exactly as in round 1.
   - Prefer the heaviest screens and anything that still shows a step without its why.
   - Keep the CSS in your own `/* peer:<you> start */ … /* peer:<you> end */` block, and mark JS with `// peer:<you>`.
3. **The bar** is section 7 of `S/peer/inspiration.md` (Memorisely's four questions) and the word targets: a decision
   screen at 250 visible words or fewer, any other at 200 or fewer, the map behind a panel included. Subtract first.

The reply shape is round 1's: PERSONA, SCORES, PROPOSAL, SCREENS, FILES, WORKS, PATCH, at most 150 words.

## Then, as in round 1

You review each other until at least three of four agree, revise one to three times, and the integrator merges.
