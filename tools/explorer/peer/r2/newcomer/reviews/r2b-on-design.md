# The newcomer on design's revised patch (round 2b)

I judge as someone from the business who has never seen smaltfl.

**Verdict:** agree.
**Score:** 3

**What I looked at:**

- The revised `proposal.md` ("Round 2: took / declined") and `patch.diff` (35 changed lines, CSS plus one select's
  words).
- `v1/1-setup-27-pair.png` and `v1/1-setup-28-pair.png`.
- The official `S/scripts/v1_setup.cjs` run against `peer/r2/design/app`: 28 steps, no page errors.
- Words: 27 and 28 unchanged, at 398 and 474; elsewhere the fold rule takes off a few words.

## Keep

- **Larkspur's pick visible again** on every control. It had been 0 px wide.
- **One closed-fold rule for the whole app.** It replaces the owner's and dq's scoped copies: keep this one.
- **Three weights and the 11 px floor,** including the map's check badges at step 28.
- **History as rows, not tinted tiles (27),** and the checks without a box inside a box (28): less "stacked-card" (§7).
- **The rule list's select in the same four words:** Pause, Warn, Note, Off.
- **Moving the gap-row control into dq's combination** rather than shipping it twice.

## Change

1. **Give the pick dot its word wherever it appears.**
   - **What:** on the checks step (28) the dot follows "Warn" on two controls, and nothing visible says it means
     "Larkspur's pick". The note that explains it sits in the closed "How this works ›" on setup's first screen.
   - **The fix:** say "• Larkspur's pick" once on each screen that shows the dot: in the checks step's head line, and
     in the gaps key (dq).
   - **Test:** on 28, the visible text names the dot.
   - **Principle:** §6 never a mark alone; it is the restored element, so the word belongs with it.
2. **Not a blocker; for the next round.** 27 and 28 look tidier but read the same: 398 and 474 words.
   - History is still 22 cells of figures with no "so what".
   - The checks still say "8 files, 13 links (each evidence file's app_id is checked by Scope instead)".
   - Design declined the plain-word pass as content, which is fair. A first-time viewer still can't follow these two
     steps without the caption, so someone should own that pass.
