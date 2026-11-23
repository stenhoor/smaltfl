# Critique, round 2: the owner on the merged product

I'm the deputy security lead who decides what readers see on a paused day. I watched `S/video/r36` and the step pages
in `S/peer/snap2` as if for the first time. My test: in five minutes, can I learn how serious it is, what readers see
now and after each choice, and who recommends what, then decide in one tap, on record?

**Did my round-1 fix survive the merge as agreed?** Yes. All of these are in the merged `S/explore`, and my CSS block
is byte for byte the agreed one:

- the severity badge;
- dq's chart in the panel;
- an eye line on each choice;
- her pick chosen, with "Goes on record when you tap Agree";
- the panel sized to its content and seated right;
- the page dimmed behind it, with the Build panel and the map's relation labels hidden;
- the mild day's limit tools folded.

Paths below are under `S/peer/`. Words are the render tool's count at 1440x900. "Visible" means closed folds and the
text under the panel are not counted.

## Problems, worst first

1. **The decision screens are now the heaviest screens in every one of my journeys.**
   - Where:
     - 2-problem-fix/07–12: 369–374 words;
     - 2-problem-fix/17–18: 351;
     - 4b-outlier/06–10: 315–366;
     - 4a-odd-but-ok/07–11: 399–429.
   - The bar is 250, and the map behind counts.
   - The panel itself is 170–290 words. The other 115–145 are the page behind. At a 28% scrim it is all still
     legible:
     - 21 file names;
     - five kind cards with their counts and "↻ reports into another unit";
     - the 11 held-output chips by name;
     - the legend;
     - the banner, which repeats the panel ("serious: no rows at all · 11 outputs held") and offers a second
       **Decide ›** just above the card.
   - Two layers of text compete for the one decision. What the panel is about, MFA and its line to what it holds, is
     lost among the rest.
   - Breaks §3.5 (one focal point), §2 (the same fact said twice) and §7 (clear hierarchy; one primary per view).
2. **Inside the panel, every alternative still carries three lines** (2-problem-fix/08).
   - Each row has its eye line, its fate and its risk, and "Reopens if a file comes" is said on three rows.
   - In five minutes I compare where readers would look. A choice's fate and risk matter for the choice I make, and
     for the one that is risky ("Publish as is": "Posture looks better than it is").
   - On a phone the rows I haven't chosen already drop their risk; on desktop they don't.
   - Breaks §3.7 (progressive disclosure) and §6 (said once; two levels on demand).
3. **The record after deciding is a run-on sentence with two clocks** (2-problem-fix/13 and 19, 4b-outlier/11).
   - 2/19 reads: "Decided by Alex Kim, head of IT controls: published the corrected file · on Tue Feb 27 of the
     replay, at Nov 22, 21:09 · '…' Sloane Marsden's reason, agreed". Two such receipts are stacked.
   - Both of Monday's decisions say 21:09, so waiting and publishing look as if no time passed between them.
   - It is what I sign, and it is the hardest line on the screen to read: 366 visible words on 2/19.
   - Breaks §6 (plain words) and §3.9 (real content: units and times said once).
4. **The mild day's panel is itself over 250 once its limit tools are open** (4a-odd-but-ok/07–11: panel 260–290).
   - What makes it heavy is the tune text, the two buttons, and the rows behind the count.
   - Breaks §3.7.
   - This is dq's evidence for "a little odd", so I leave it to dq.
5. **The landing on a paused day doesn't say who recommends what** (2-problem-fix/01, 4b-outlier/01).
   - I learn Sloane's recommendation only inside Decide.
   - Minor: Decide is one tap away, and the panel answers at once.
6. **The counts mislead about where the weight is.** Not a user problem, but it steers the work.
   - The tool counts closed folds and text under an opaque panel. 2/16 reads 511 but shows 250, and 2/19 reads 505
     but shows 366.
   - Meanwhile the decision screens, which hide nothing in folds, look lighter than they are.
   - Recounted with closed folds excluded (`r2/owner/work/fair/`), the heaviest screens in my journeys are the decision
     screens.

What works now: the order in the panel (badge, number, her chosen row, one Agree), dq's 28-day picture, the eye lines,
mild amber end to end, and the receipts' content.

## Scores, the merged product as it is now

| easy_to_find | easy_to_do | images_over_words | trust | overall |
|---|---|---|---|---|
| 4 | 4 | 3 | 4 | 3 |
