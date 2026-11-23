# The builder on the owner's round-2 fix: "Only the decision"

**Verdict:** agree, with change 1.
**Score:** 4

I looked at `S/peer/r2/owner/snap/2-problem-fix/08, 11, 17`, `4b-outlier/06, 08` and `4a-odd-but-ok/08`, and
`v1/2-problem-fix-08-after-phone.png`, each against `S/peer/snap2/…`.

## Keep

- **Behind the decision, only what it is about.** The map is drawn and dimmed. It keeps the kinds, the paused file's
  chip with its line to "Held · 11", and "Out · 29 published"; the other 21 chips, the counts, the legend and the
  banner's second *Decide* step away. In round 1 I asked for the page behind to stay visible rather than be blanked;
  this answers that, and better: the subject is the one thing on it.
- **Every decision step at 188 to 245 words,** the map behind included.
- **CSS only, scoped to the open panel.** It merges inside the owner's block and touches nothing of mine.

## Change

1. **Show each alternative's one risk before it is picked, at least on hover and keyboard focus** (§2: steps that
   happen without being shown).
   - **Why.** An alternative now shows its name and its eye line, and its ✕ line only once chosen. "Keep all of Sun
     Feb 25" hides "The 11 outputs show Sunday from every file they read, not just MFA". "Fill only MFA" hides "A real
     Monday MFA failure wouldn't show". Comparing choices means comparing their costs, and today you must tap each one
     (and lose her pick's preselection) to see them.
   - **What.** Reveal the row's ✕ line on `:hover` and `:focus-within` (or keep it for every row from 1180 px, where
     there is room). Risky rows keep theirs always, as now.
   - **Test:** on 2/08, pointing at "Keep all of Sun Feb 25" shows its ✕ line without changing the chosen row.
2. **A nit: the emptied kind cards read as a page still loading.** Behind the scrim, "Person" and "Organisational unit"
   are blank boxes. Draw them as outlines only (no fill, `--line` border) so they read as context, not as empty
   content.

## Conflicts

- **None with mine.** The owner changes only the open Decide panel and what shows behind it. My round-2 fix is setup's
  gaps screen.
- **Design's closed-fold rule.** Design's app-wide rule and the owner's Decide-scoped one do the same thing; keep one,
  design's.
