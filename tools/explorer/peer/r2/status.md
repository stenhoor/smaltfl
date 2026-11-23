# Peer round 2: status

Each reviewer's scores of the merged product after round 1 (r36), 1 to 5, beside their round-1 scores of r35.

| persona | find | do | images | trust | overall | r35 scores | fix | patch | screens (words before→after) |
|---|---|---|---|---|---|---|---|---|---|
| newcomer | 4 | 3 | 3 | 4 | 3 | 3 3 2 3 2 | Say why before asking: the gaps step says why it asks, explains the three settings once, lists the one gap worth asking about first; "Accept the 5 explained" names what it accepts | +21 −5 | 1-setup/21 724→409, 22–25 913→419, 26 942→454, phone 342→186 |
| owner | 4 | 4 | 3 | 4 | 3 | 3 2 2 4 2 | Only the decision: while Decide is open, the map behind keeps only the paused file, its line to what it holds and what readers get; each choice not picked is one line, a risky one keeps its warning (CSS only) | +24 −1 | 2/08 369→230, 2/17 351→245, 4b/06 315→188; 4a opens at 194 |
| builder | 4 | 3 | 3 | 4 | 3 | 3 3 2 2 2 | What reading found, at a glance: each gap one row (file · column, count, bar, one line of evidence, its choice); Larkspur's reason and the settings behind one Why ›; pointing at a gap lights its files and line on the map | +55 −2 | 1-setup/21 724→338, 22–25 913→341, 26 942→388 |

**Overlap:** builder and newcomer both redid the gaps step (1-setup/21–26). Review settles which wins or how they combine.
| dq | 4 | 4 | 3 | 4 | 3 | 3 3 2 2 3 | Six gaps on one scale: each problem reading found drawn as its share of its file on one shared bar; the open finding the one amber bar; a blank gap shows the segment it fills; the user's rule a 15% line just past 14.4% | +36 −3 | 1-setup/22 913→369, 26 942→404, 27 435→398 |

**Overlap:** three fixes on the gaps step now (builder, newcomer, dq). dq also found that the word counter counted text inside closed folds (about 440 words on steps 21–26); the counter is fixed and the numbers re-measured.

## Words re-measured with the fixed counter (closed folds excluded): max / mean per walkthrough

| walkthrough | r35 (before round 1) | r36 (after round 1) |
|---|---|---|
| 1-setup | 490 / 364 | 501 / 347 |
| 2-problem-fix | 740 / 521 | 376 / 334 |
| 3-explore | 406 / 295 | 261 / 208 |
| 4a-odd-but-ok | 832 / 597 | 429 / 349 |
| 4b-outlier | 700 / 541 | 366 / 339 |

Files: `words-before-fixed.txt`, `words-r36-fixed.txt`.
| design | 3 | 4 | 3 | 4 | 3 | 3 3 2 3 2 | One kit to the end of setup: one Pause·Warn·Note·Off control in place of the gaps' own pills; Larkspur's pick visible again (the r1 merge left it 0 px wide); rows instead of tinted tiles; three weights; the 11 px floor finished; closed folds neither drawn nor counted | +46 −3 | 1-setup/22 456→397 readable, 26 481→431, 27 and 28 visual only |

**Overlap:** four fixes on the end of setup (builder, newcomer, dq, design). Review picks one base and the pieces to graft
onto it; one author builds the combination. The owner's Decide fix stands alone.

Averages of the reviewers' scores of r36: find 3.8 · do 3.6 · images 3.0 · trust 4.0 · overall 3.0. Those of r35 were
3.0 · 2.8 · 2.0 · 2.8 · 2.2.

## Review round 2 verdicts

- design → builder: agree 4 · the same Pause·Warn·Note·Off control on each row as on Checks; swap the heavy grey bar for dq's share bar
- design → owner: agree 4 · hide with display:none, not visibility:hidden (the held strip keeps 90 px of blank space, kind cards stay 449×156 empty boxes); draw the cards behind as outlines
- design → newcomer: agree 4 · write the key in the four control words; the rows' numbers in place of sentences
- design → dq: agree 4 · put dq's bar on the builder's row; opened, dq's row still shows two controls and a fold inside a fold
- design GAPS BASE: builder + dq (share bar, %, segment names, 15% rule line) + newcomer (why line, Worth asking about / Explained groups, "Accept the 5 explained ›", the finding's own accept) + design (Pause·Warn·Note·Off with the pick dot, row grid, weight 600)
- dq → builder: agree 4 · flip the bar so the gap is the dark mark (today the rest of the file is solid grey and the gap a faint hatch)
- dq → owner: agree 4 · keep a one-word fate on every row ("Keep all of Sun Feb 25" and "Wait for the file" both read just Sun Feb 25)
- dq → design: **disagree 3** · Pause one tap from each gap row; on the tags gap it would pause 55 of 56 days and the row doesn't say so. Keep the three words on the row, Pause in the fold
- dq → newcomer: agree 4 · gap sizes still sentences; put the two groups on the builder's rows
- dq GAPS BASE: builder + dq (figure-ground bar, share %, 15% rule line) + newcomer (finding-first groups, its own accept link, "Accept the 5 explained") + design (restored pick dot, .seg look, weight 600, app-wide fold rule), but not the four-word control on gap rows
- owner → builder: agree 4 · dq's bars on one shared scale (the finding the only amber one) and the newcomer's "Worth asking about · 1"; a plain name before the column
- owner → design: **disagree 3** · each gap's four-option control is the loudest thing in the list (five smalt rings; full-width 46 px on a phone): shrink to the old pills' size with a soft fill for the chosen option
- owner → newcomer: agree 4 · give each row dq's count, % and shared-scale bar (as a sentence its size has to be worked out)
- owner → dq: agree 5 · drop the axis legend (each row's % labels its bar); add the newcomer's two groups
- owner GAPS BASE: dq + newcomer (why line, two groups, the finding's own Accept, "Accept the 5 explained ›") + builder (pointing lights the map, one fold, head said once, "more are noted") + design (Pause·Warn·Note·Off with Larkspur's dot, pill-sized)
- builder → owner: agree 4 · show each alternative's risk line on hover and focus ("Keep all" and "Fill only MFA" hide their costs until picked)
- builder → design: agree 4 · Pause picked on a closed gap row hides what it does: say "Pauses 1 of 56 days: Feb 24" on the row
- builder → newcomer: agree 4 · drop the three-setting key above the list (label directly); grouping with the finding first is the keeper
- builder → dq: agree 5 · keep the ids one tap away in the fold
- builder GAPS BASE: dq (one-scale bars with %, segment labels, the 15% line) + newcomer (finding first with its own Accept, "Accept the 5 explained", one-line why) + design (one Pause·Warn·Note·Off control, pick dot visible, fold not repeating it, 44 px on phone, plus Pause's consequence) + builder (pointing lights files and line on the map, head said once, Note truth fix)
- newcomer → builder: agree 4 · a plain name and its visible reason on each row; the ids go behind Why ›
- newcomer → owner: agree 4 · keep each row's outcome in a few words ("Wait for the file" and "Keep all of Sun Feb 25" both show only "Sun Feb 25")
- newcomer → design: agree 3 · on the gaps, 24 buttons of 64 px outweigh the findings: keep the one control, but pill-sized on desktop, explained once in a key
- newcomer → dq: agree 4 · say "no version 1 row", not "version 2 alone"; drop the % already shown by the bar
- newcomer GAPS BASE: dq (plain name, count, one shared-scale bar, reason line) + builder (pointing lights the map; one fold, one control while open; "more are noted" fix) + newcomer (why line, settings key, finding first with its own Accept, "Accept the 5 explained") + design (pick dot visible, weight 600, 44 px on phone)

## Tally, review round 2

| fix | agree | verdict |
|---|---|---|
| builder | 4/4 | agreed; its gaps rows are grafted onto dq's base |
| owner | 4/4 | agreed: polish |
| newcomer | 4/4 | agreed; grafted onto dq's base |
| dq | 4/4 | agreed: **gaps base** (owner, builder, newcomer; design and dq named builder) |
| design | 2/4 (dq and owner disagree) | **not agreed**: the gap-row control too loud, and Pause's effect unsaid. Its global parts stand; the control moves into the combination, pill-sized and saying what Pause does |

Next: dq builds the combined gaps step; the owner polishes; design keeps its global parts. Then a second review round,
on the combination and on design's revision.

## Review round 2b: dq's combination and design's revision

- design → dq: agree 4 · drop the smalt ring on every chosen `.seg` button; a tonal `--action-wash` fill with ink text at 600 is enough (five rings still surround the one primary button, and each row's consequence line says the setting in words)
- builder → dq: agree 5 · grafts all landed; one hole in the builder's own highlight code: picking a setting redraws the map's labels, so the link's line loses its outline; re-light the pointed row after labels redraw (fix and test in builder/reviews/r2b-on-dq.md)
- builder → design: agree 4 · the rules note still says "Pauses, Warns, Notes or Off" above selects that now say Pause/Warn/Note/Off (one vocabulary); nit: weight 700 and 14/16/18 px remain on step 28
- newcomer → dq: agree 5 · can settle the step without the caption; nits: say which 56 days once ("Feb 1 to Mar 27") and add "• Larkspur's pick" to the key
- newcomer → design: agree 3 · the restored pick dot is never named on screen (say "• Larkspur's pick" once on step 28); history (27) and checks (28) tidier but still 398 and 474 words, unclear to a first-time viewer

## Final scores of r37 (after both rounds)

- design: 4 4 4 4 4 · BEST: the paused day into Decide reads as one designed screen (one magenta cause, dq's one-scale figure, her pick chosen, one Agree, the map quiet behind, 188–250 words) · NEXT: video 1 step 28, Checks is the heaviest screen at 474 words (ten stacked rows, each with its own strip, control and sentence of days); replace with one checks-by-56-days grid, the control at each row's end
- newcomer: 4 4 4 4 4 · BEST: the gaps step (why it asks, the four words explained, the one worth asking about first, each gap a bar saying what its setting does over 56 days); Decide 188–247 words · NEXT: Checks (video 1 step 28), 474 words of engineers' phrases: a plain name per check, its strip of days and one line of what its setting does, as the gaps step does
- owner: 4 5 4 4 4 · BEST: deciding is one tap (severity, dq's 28-day chart, where readers look after each choice, Sloane's pick chosen; Agree records exactly what it says) · NEXT: the decision receipts (video 2 steps 13, 14, 19; 4b step 11) are one long sentence mixing story time and replay time; make them timeline rows
- dq: 4 4 4 4 4 · BEST: the shared-scale picture tells a little odd from a real problem; decision screens ≤250 words; numbers agree banner to receipt except video 1's end title "9 links" vs the panel's "8 links" · NEXT: video 1 step 28, checks (474 words): ten 56-day strips without a date axis, days repeated in words; one aligned grid
- builder: 4 4 4 4 4 · BEST: you see why each file joins what it joins, and what each gap's setting does, before you tap · NEXT: Checks (video 1 step 28, 474 words): run-on sentences, "Not assessed" beside a selected Pause; a checks × days grid

**Averages:** r35 3.0 2.8 2.0 2.8 2.2 → r36 3.8 3.6 3.0 4.0 3.0 → r37 **4.0 4.2 4.0 4.0 4.0**. Next round's consensus target: the Checks step as one checks × days grid (4 of 5); the receipts as timeline rows (owner).
