# Peer round 3: status

One owner per screen; each fix reviewed by two. Agreed only if all seven tests pass and the five-second answer matches
the focus sentence.

## Fixes (self-assessed 7/7 each; all six walkthroughs run with no page errors)

| screen | owner | words before→after | patch |
|---|---|---|---|
| estate map, banner, Today (`window.smDay`) | design | 192→119 (5-today 01–03) | +185 −18 |
| Decide on the estate | owner | 492→106 (5-today 12); v2/07 241→122, v4a/08 247→184, v4b/06 188→118 | +186 −18 |
| Ctrl K answers | newcomer | 282→232 (palette 90→40), 264→250 (palette 72→58) | +166 −38 |
| Ctrl K look inside | dq | 405→257 (palette 213→65) | +89 −21 |
| the file's view | builder | 343→88 (5-today 09–10) | +178 −54 |

The trial merge of all five runs all six walkthroughs with no page errors. Two Ctrl K lines were combined by hand
(newcomer's answers with dq's summary and tap fix).

## Reviews (reviewer → author)

- builder → newcomer: agree · 5s: grey bars, today an empty red slot at 0, then ⧗ 11; would press Full answer › · change: word the list row "Why is today paused?", as the answer is
- builder → dq: agree · 5s: MFA, Fine today, two equal bars (2,329 against usual 2,322); would press ↵ · change: one "what is this" sentence per file (the builder's file view will use dq's words)
- owner → design: agree · 5s: the pink banner ("Today is paused · Access reviews arrived empty · ⧗ 11 waiting"), then Decide; would press Decide · change: none; the Decide heading calls smDay at the merge
- owner → newcomer: agree · 5s: identical grey bars, today's empty dashed slot at 0; then the month strip; would tap ⧗ 11 or Full answer · change: none (if the owner finds the bars confusing, as with MFA's, use the strip)
- design → owner: agree · 5s: "What should readers see today?", Now → Recommended, a blue Keep all of Tue Mar 26; would press it · change: hide the bar's tools while Decide is open (the edge of "+ Add a dataset" shows behind the panel)
- design → builder: agree · 5s: the paused Access reviews card, 0 rows against 1,435, Decide, a red arrow to ⧗ 11; would press Decide · change: say "⧗ 11 waiting ›" as the banner does, not "11 outputs wait on it"
- dq → owner: agree · 5s: NOW → RECOMMENDED, both on Tue Mar 26; would tap Keep all of Tue Mar 26 · change: put Keep's cost on its card ("the 11 outputs show Tuesday, other files included"), now only in More; nit: the picture names today "Wed 27"
- dq → builder: **disagree** · 5s: Access reviews paused today, 0 rows (usually 1,435), ⧗ 11 wait; would press Decide · change: on a paused file say "Readers see Tue Mar 26 until you decide", not "If this file is wrong, these show wrong numbers" (on a paused day they are held, not wrong)
- newcomer → design: agree · 5s: "Today is paused · Access reviews arrived empty · ⧗ 11 waiting", the red chip; would press Decide › · change: none to the product
- newcomer → dq: agree · 5s: "MFA ✓ Fine today", 2,329 against usual 2,322; would open it or Esc · change: one today-against-usual picture shared with the newcomer's answers at the merge

## Tally

design 2/2 · owner 2/2 · newcomer 2/2 · dq 2/2 agreed. builder 1/2 (dq: say what readers see on a paused day, not "wrong numbers"): one revision, dq re-checks.
Polish: owner (Keep's cost on its card, hide the bar's tools behind Decide, today via smDay); newcomer (dq's two bars for today against usual, the list row "Why is today paused?").
At the merge: the description cut at "ISO/IEC 27001:" in the "What is X?" answer and the map chip's hover (dq's fix).
- builder revision 1: a paused file reads "⧗ 11 waiting ›" and "Readers see Tue Mar 26 until you decide"; the wrong-numbers line only on files that aren't paused; dq's "what is this" sentence. dq re-check: **agree** · 5s: Access reviews paused today, 0 rows (usually 1,435), ⧗ 11 waiting, readers see Tue Mar 26; would press Decide · change: none. **builder 2/2.**
- owner polish: Keep's cost on its card; the bar's tools and "Esc steps back" hidden while Decide is open; today via window.smDay with a fallback. 5-today/12 at 105 words.

## Merged

All five merged, with two Ctrl K lines combined by hand and three description cuts fixed (a colon inside "ISO/IEC
27001:2022"). Checks updated for the new Decide: exbuild3 and exq open More before choosing; fitcheck now holds "the
recommended choice and its one button in view". Every check passes. Videos `video/r38` (six); snapshots `snap5`.

Visible words, max/mean, r37 → r38:

| walkthrough | r37 | r38 |
|---|---|---|
| 5-today | 492/290 | 184/130 |
| 3-explore | 261/208 | 226/165 |
| 2-problem-fix | 366/281 | 337/238 |
| 4a | 309/275 | 276/240 |
| 4b | 341/280 | 299/241 |
| 1-setup | 474/326 | 446/315 |
