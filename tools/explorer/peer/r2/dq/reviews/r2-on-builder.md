# dq on builder, round 2: "What reading found, at a glance"

**Verdict:** agree. It is my pick for the base of the gaps screen.

**Score:** 4

I compared `S/peer/snap2/1-setup/21` to `26` with `S/peer/r2/builder/snap/1-setup/21` to `26`, at 1440×900 and on the
phone renders.

## Numbers checked

Every number on the six rows is in `build.json` and agrees with the map beside it:

| Row | Count | Evidence line | Source |
|---|---|---|---|
| `approver_id` | 19 of 268 rows | P-0093, P-0143 … 8 ids not in People | `missN`, `rows`, `missDistinct`, `miss` |
| `version` | 15 of 253 exceptions | EX-00062, EX-00098 … | `xtab` v2only and ids |
| `app_tag` | 4 of 1,830 rows | the four ids | `miss` |
| `cluster` | 675 of 1,830 rows | "blank only on non-production rows" | `xtab` prodBlank 0 |
| `platform_id` | 345 of 2,401 apps | "blank only on the SaaS apps" | `xtab` |
| `leader_id` | 6 of 246 units | 4 teams, 1 department, 1 business unit | `xtab` levels |

- The map's two "rows not found" lines (19, 4) say the same as the rows.
- **"✓ accepted at 4: more are noted" is a true fix.** The merged screen said "more will warn" for a gap set to Note,
  which doesn't warn.

## Keep
- **One row a gap:** its address (file · `column`), its count, a bar from zero on one 0–100% scale, and one line of
  what the data shows.
  - "blank only on the SaaS apps" is the most precise statement of why a gap is a known condition. It is better than
    my "all SaaS" label, which says the reverse inclusion.
- **One fold, not two,** with one control at a time. The quick choice hides while the fold's four-way control, with
  "Pause would stop N of the 56 days", is open.
- **Pointing at a gap lights its files and its line on the map** (23). The evidence, where it lives (§3.8).
- **The head said once.** The kinds line goes where the map shows the kinds; a phone keeps it.
- The 3 px minimum keeps the tags' 0.2% visible.

## Change
1. **The one that matters most: draw the gap as the mark, not the rest.**
   - Today the rest of the file is a solid mid-grey (`.gp-bar .h`, edge 45%) and the gap a lighter hatch (`.g`), so
     the eye reads the 93% and not the 7%. Figure and ground are reversed.
   - **What:** the track pale (`--sunk-2`); the gap solid `--ink-2` for missing links and versions, hatched `--ink-2`
     for blanks, amber only for the open finding.
   - Draw the gap from the left, so six gaps share one zero: positions along a common scale are the easiest lengths to
     compare.
   - **Test:** in 22's screenshot, the darkest mark in each bar is the gap.
   - **Principles:** §3.6 (grey everything, then highlight the one point); §5.
2. **Put the share beside the count:** "19 of 268 rows · 7.1%".
   - **Why:** the bars compare at a glance, but 0.2% and 2.4% are both a sliver. The number tells them apart.
   - §3.9 (label directly).
3. **Draw your rule's limit on the bar it watches.**
   - **What:** a dashed line at 15% on the platform row, labelled "your rule: at most 15%". The chip then reads "Your
     rule · Warn".
   - **Why:** 14.4% sitting just under 15% is the fact the rule was tuned to, and today it is a sentence.
   - Built in my round 2 (`span.ag-tol`, `.ag-tl`); take the idea, not my code.
   - §5 (a threshold is a line).

## Conflicts, and the combination I'd ship

**GAPS BASE: builder.** Graft onto it:
- **From dq:** change 1 (the bar's figure-ground and common zero), the share beside the count, and your rule's limit as
  a line.
  - Drop my segment labels ("all non-production"): the builder's evidence lines say it better.
  - Drop my axis line: the share makes it unneeded.
- **From newcomer:**
  - the two groups, "Worth asking about · 1" first and then "Explained · 5";
  - the finding's own "Accept it as known" link on its row;
  - the primary that names its group, "Accept the 5 explained ›".
- **From design:**
  - Larkspur's pick dot made visible again (it was 0 px wide after the merge);
  - titles at weight 600;
  - the `.seg` look for the row's choice, keeping the gaps' three words (Warn if more · Note it · Stop checking).
  - Pause stays in the fold, beside "Pause would stop N of the 56 days" (see my review of design).
- **One fold rule.** design's app-wide `details:not([open]) > :not(summary)` replaces the builder's (`.ag-row`), mine
  (`#buildpanel`) and the owner's (Decide).
- **Keep my history-chip fix (step 27) beside design's history rows.** They don't overlap: one is the scale, the other
  the layout.
