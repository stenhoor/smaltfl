# The builder on dq's round-2 fix: "Six gaps on one scale"

**Verdict:** agree. It is my choice of base for the merged gaps screen; see *Conflicts*.
**Score:** 5

I looked at `S/peer/r2/dq/snap/1-setup/21, 22, 26, 27`, `v1/gaps-before-after.png`,
`v1/1-setup-22-after-phone.png` and `v1/history-chips-before-after.png`, each against `S/peer/snap2/…`.

## Keep

- **Every gap on one 0 to 100% scale of its own file.** The eye compares six gaps without arithmetic: cluster's 36.9%
  against the tags' 0.2%. The percentage beside the count ("19 of 268 rows · 7.1%") is in tabular figures.
- **The finding is the one amber bar,** with its words. Every other bar is grey (§3.6: grey everything, highlight one).
- **The evidence named on the bar.** Under the gap segment, "all non-production" and "all SaaS" say in two words what
  took 17 to 26.
- **My rule drawn as its limit:** a dashed 15% line on the platform bar, "your rule: at most 15%", with the 14.4% gap
  just under it. It is the best piece of evidence on the screen, and it is exactly what my rule is for.
- **Short names that say what is missing:** "8 approvers not in the HR file", "version 2 alone", "no leader".
- **History's chips on the cards' scale.** People no longer zigzags across a 1% wobble. It is a truth fix, and a
  builder trusts the history more for it.
- **The fold rule for the Build panel** (closed folds not drawn or counted).

## Change

1. **Graft the three pieces in *Conflicts* below,** so one screen tells you what reading found and lets you settle it.
2. **A nit: keep the ids one tap away.** The approver ids (P-0093, P-0143 …), the four tags and the three exceptions'
   ids were in the fold's evidence line before. Keep `gapEvidence(x)`'s ids in the *evidence ›* fold, so a builder
   can check what "8 approvers" are without leaving the screen.
   - **Test:** open the approver row and see "P-0093 P-0143 P-0037 P-0004 P-0061 …".
3. **A nit: the axis line.** "0 · each gap's share of its file · 100%" is a legend above the list. With the
   percentage on every row, it can go. If it stays, put it at 11 px with the 0 and 100% under the first bar's ends.

## Conflicts: which gaps screen to build

Four of us rebuilt steps 21 to 26. As one person settling six gaps, the screen should show:

- what each gap is and how big;
- why it is expected;
- which one to look into first;
- one control to settle each;
- where it lives in the model.

**Base: dq.** Its row (name, count with %, the shared-scale bar with its labels and your rule's line, Larkspur's
reason, the choice) is the strongest picture. My row has the same parts with less evidence: the same part-to-whole bar
without the percentage, the labels or the rule line, and an ids line in place of the reason.

**Graft onto it:**

- **From the newcomer:**
  - the two groups, "Worth asking about · 1" first (the finding with its own *Accept it as known* in its row), then
    "Explained · 5";
  - the primary button that names its group, "Accept the 5 explained ›";
  - the one-line why, "Accept each as known, or it is listed every day."
- **From design:**
  - one control and one vocabulary, Pause · Warn · Note · Off (`seg4`), with Larkspur's pick as a visible dot;
  - the fold no longer repeating the control: it keeps "Warn when", the pause floor and "Pause would stop …";
  - its size, 64 x 30 px as on Checks and 44 px tall on a phone;
  - with one change (my review of design): picking Pause or Warn says its consequence on the row ("Pauses 1 of 56
    days: Feb 24"), since Pause is now one tap from every gap.
- **From me:**
  - pointing at or tabbing to a gap lights its file on the map, and for a link the file it points at and its line
    (`li` `data-gf`, `data-gt` and `data-gc`; class `gp-lit`). It is the one piece that ties a gap to where it lives;
  - the head said once ("All 22 files are in · 5 kinds · 8 links"; the kinds line only on a phone, as the newcomer and
    design also do);
  - the truth fix: an accepted gap set to Note says "more are noted", not "more will warn".

**Leave out:**

- the newcomer's three-setting key, since one vocabulary and the chosen state on each row say it;
- my evidence line, since dq's names and segment labels say it and the ids move to the fold.
