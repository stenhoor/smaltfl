# Peer round 4: fresh eyes, and the two screens everyone named next

S = /tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad.

The rules are round 3's (`S/peer/r3/brief.md`): the owner's failing examples, the seven tests, the five-second test,
the purpose audit, one owner per screen, two reviewers, working fixes only.

Round 3's five fixes are merged into `S/explore/`, and every check passes. Look at:

- the six videos in `S/video/r38/`;
- every step in `S/peer/snap5/<video>/NN.png` and `.html`;
- words per step in `S/peer/words-r38.txt`;
- round 3's verdicts in `S/peer/r3/status.md`.

Copy the app from `S/explore/` (`sh S/peer/tools/copyapp.sh S/peer/r4/<you>/app`). The walkthrough scripts in
`S/scripts/` are the merged ones, `v5_today.cjs` included.

## Your screen this round

New screens go to the persona they suit. Last round's screens go to someone who didn't build them, for fresh eyes.

| screen | owner | focus, in one sentence | where |
|---|---|---|---|
| **The checks step as one checks × days grid** | dq | "Which checks would have stopped which days, at a glance." | 1-setup steps 25–28 (the Checks step, 446 words, the heaviest left) |
| **The decision receipts as timeline rows** | owner | "What was decided, by whom, when, and what readers saw, in order." | 2-problem-fix 13, 14, 19; 4a 12; 4b 11 |
| Fresh eyes: the estate map, banner, Today, and an opened kind | newcomer | (round 3's) "Today one file paused; this is what waits on it." | 5-today 01–03, 3-explore 01–04 |
| Fresh eyes: Decide and the file's view | design | (round 3's sentences) | 5-today 09–12, Decide in 2-problem-fix, 4a, 4b |
| Fresh eyes: Ctrl K (answers, look inside, search results) | builder | (round 3's sentences) | 5-today 04–07, 3-explore 08 |

**Fresh eyes first.** Before you change anything, do the five-second test and the seven tests on the merged screens as
they are. Write them down. Then fix only what fails, subtracting first. If nothing fails, say so and make the smallest
change that removes the last thing you'd question.

Produce what round 3 asked for: a working fix, the walkthroughs run with no page errors, before (`snap5`) against after,
a phone render, the seven tests, the five-second test, the purpose audit, `proposal.md`, `changes.md` and `patch.diff`.
Reply in round 3's shape.

## Reviews (you'll be told)

- dq's checks grid ← builder, newcomer
- owner's receipts ← dq, design
- newcomer's map ← owner, builder
- design's Decide and file view ← newcomer, dq
- builder's Ctrl K ← owner, design
