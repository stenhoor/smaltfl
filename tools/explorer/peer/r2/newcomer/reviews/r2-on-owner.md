# The newcomer on the owner's round 2: "Only the decision"

I judge as someone from the business seeing smaltfl for the first time.

**Verdict:** agree, with change 1.
**Score:** 4

**What I looked at:**

- 2-problem-fix/08, 11 and 17, 4b-outlier/06 and 4a-odd-but-ok/08, against `snap2`, and the phone renders.
- The official `S/scripts/v2_fix.cjs` run against `peer/r2/owner/app`: 19 steps, no page errors.
- Words: decision steps at 188 to 245, under 250 with the map behind counted. The mild day opens at 194.

## Keep

- **One line a choice, the chosen row expanded,** and the risky row keeping its risk before it is picked ("Publish as
  is: Posture looks better than it is"). I can scan four choices in one look (§3.5, §3.7).
- **The banner's second *Decide ›* stepping away** while the panel is open: one primary action (§6).
- **CSS only, scoped to the open panel.** It merges cleanly.

## Change

1. **Two choices now look the same.**
   - **What:** in 2/08, "Wait for the file" and "Keep all of Sun Feb 25" both show only "👁 Sun Feb 25". The difference
     was in the lines now hidden on the row not chosen: the outputs stay held and it stays yours to decide, against done
     for now with Sunday published.
   - **Why:** a first-time viewer can't tell why both exist.
   - **The fix:** keep each row's fate on its eye line, a few words: "Sun Feb 25 · stays yours to decide" against "Sun
     Feb 25 · done for now, reopens if a file comes".
   - **Test:** in 2/08 and 4a/08, no two rows show the same visible consequence.
   - **Principles:** §6 plain words; §7 every state covered.
2. **Behind the panel, emptied cards look like a page still loading.**
   - **What:** the kinds' cards keep their full height with only a name inside ("Person", "Organisational unit"), and
     "HELD · 11" is a wide empty box. On desktop the paused chip sits under the panel, so its subject isn't visible
     anyway.
   - **The fix:** collapse an emptied card to its name row, or dim the whole page evenly and keep only the hold line.
   - **Test:** no card behind the panel is taller than its content.
   - **Principle:** §7 every state covered: empty and loading must not look alike.

## Conflicts

- **Design:** design's global closed-fold rule supersedes the owner's Decide-only copy. Keep one.
- **dq:** dq's figure stays as merged.
- **Mine:** no overlap with the gaps screen or the file card.
