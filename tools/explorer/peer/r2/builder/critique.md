# Critique, round 2: the builder on the merged product

I watched `S/video/r36` and every step in `S/peer/snap2` as someone setting up Larkspur from its files for the first
time.

**My round-1 fix survived the merge as agreed.** Joins are checked at their step on Feb 1's counts ("All 176 ids found
on Feb 1's 2,401 rows"), with the *Linked* switch. Unread kinds are grey and say "CMDB names 176 units". The map names
columns only on the line being checked, and on the two finished-map lines with rows not found.

## Scores, the merged product as it is now

| | 1 to 5 | Why |
|---|---|---|
| easy_to_find | 4 | One Build panel, five steps, one filled button per screen. The join is now a step of its own |
| easy_to_do | 3 | Reading a file is quick and clear. The screens after every file is read are still the heaviest of setup |
| images_over_words | 3 | Joins, figures and the explore card are pictures now. Gaps, history and checks are still sentences |
| trust | 4 | Each guess shows its evidence, and unread files claim nothing. A gap's evidence still sits two folds down |
| overall | 3 | Most journeys are designed now. Setup's last third isn't yet |

## Problems, the worst first

1. **The gaps after every file is read (1-setup/21 to 26) are setup's heaviest screen: 724 to 942 words. Even with
   closed folds left out, 437 to 481 words are drawn.**
   - **What's wrong.**
     - Each gap is a 15- to 20-word sentence.
     - The evidence that makes Larkspur's pick right is two folds down, under "evidence ›" and then "Why, and the
       evidence ›". For example, CMDB's platform_id is blank only on its SaaS apps, and the approver gap is 8 ids.
     - Opened, a gap shows two controls for one setting ("Warn if more · Note it · Stop checking", then "Pause · Warn ·
       Note · Off") and its reason twice.
     - Above the list, the panel repeats the map: "All 22 files are in · 5 kinds of thing · 22 files · 8 links",
       followed by the five kinds with their counts.
     - A 45-word paragraph explains the accept button.
   - **What I was doing.** Deciding, gap by gap, whether each is how the files are made or a real problem. That needs
     the count, the evidence and Larkspur's pick together, and a fast way to change it.
   - **Principles.** §2: words doing a picture's job, and the same fact said in three places. §3.7: the answer first,
     the evidence one tap away. §3.8: show the evidence when it is used. §7: clear hierarchy, one control per setting.
2. **A gap isn't tied to where it lives (1-setup/21 to 25).**
   - **What's wrong.** Approver_id's 19 rows are said three ways in three places:
     - the reading card: "249 of Feb 1's 268 rows found · 19 rows not found";
     - the map's line: "approver_id · 19 rows not found";
     - the gap: "19 of 268 rows name one of 8 approvers who aren't among the 245 people in the HR file".
     Nothing on screen connects the gap to its file or its line on the map.
   - **What I was doing.** Finding which part of my model a gap is in.
   - **Principles.** §3.8 (show the step), §2 (the same fact in three places).
3. **History (1-setup/27): 20 equal tiles, 398 words drawn.**
   - **What's wrong.** Each tile has a sparkline, "usually 2,390 · Feb 1: 2,401, +0.5%" and a value-mix bar with shares
     and ranges. There is no focal point and no "so what": a file that swings looks like one that never moves.
   - **What I was doing.** Learning which files are steady, before trusting a pause.
   - **Principles.** §2 (dashboard soup), §3.5 (one focal point).
4. **Checks (1-setup/28): long sentences, 474 words drawn.**
   - **What's wrong.** Each check kind is a sentence with parenthetical asides, for example "8 files, 13 links (each
     evidence file's app_id is checked by Scope instead) · Feb 1 to Mar 27: warned Feb 16 and Feb 24".
   - **Principles.** §2, §6 (plain words, said once).
5. **One setting, three vocabularies.**
   - **What's wrong.** A gap's quick choice says "Warn if more · Note it · Stop checking". Its fold says "Pause · Warn ·
     Note · Off". A file's rules say "Pauses / Warns / Notes / Off".
   - **What I was doing.** Changing one guess, and checking it took.
   - **Principles.** §7 (one component language), §6 (said once).

## This round's fix

Problems 1 and 2, the heaviest screen. See `proposal.md`.
