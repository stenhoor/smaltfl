# Design on builder, round 2: "What reading found, at a glance"

- **Verdict:** agree.
- **Score:** 4.
- **Matches the system:** yes.
  - Tokens only, at 11, 12 and 13 px, three weights.
  - My dividers and text link are kept.
  - Smalt marks only what you point at, as focus does.
- **Exception:** the row still carries the pills' own vocabulary ("Warn if more · Note it · Stop checking"). You left
  that to me, rightly. See change 1.

Paths below are under `S/peer/r2/design/reviews/work/`.

## Keep: this is the base for the gaps screen

- **One row a gap, data first.** The address (`Exceptions approver_id`), the count ("19 of 268 rows") and the evidence
  line ("P-0093, P-0143 … 8 ids not in People", "blank only on the SaaS apps"). Sentences become numbers and
  evidence: §2, §3.6.
- **Pointing at a gap lights its files and line on the map.** The finding, Exceptions, People and "approver_id · 19
  rows not found" become one picture. This is §3.8 (show the step, the evidence where it lives), and no other fix has
  it.
- **One fold instead of two.** While it is open the row shows one control, not two. Of the four fixes, yours is the
  only one whose open state is right (`gaps-open-3.png`: dq's and the newcomer's still show the pills and the fold's
  segment at once).
- **Larkspur's interpretations sit behind *Why ›* with their source tag; the data's own evidence shows.** That is the
  right line between fact and reading (§3.7).
- **The truth fix:** an accepted gap set to Note says "more are noted", not "more will warn".

## Change

1. **Put the one control on the row: Pause · Warn · Note · Off, as on the Checks step.**
   - Use the `seg4` call from my round-2 patch in place of the quick pills, with Larkspur's pick as a dot. My patch
     also fixes that dot, which the merge left 0 px wide.
   - Then closed and open show the same control in the same words. The fold keeps only what refines it: "Warn when: a
     new one appears · every day", the pause floor and "Pause would stop …".
   - **Why:** today a setting reads "Warn if more" closed and "Warn" plus "a new one appears" open: two vocabularies for
     one setting on one row. §3.1; §7 (one component language, matches the system).
   - **Test:** on 1-setup/21 every gap row holds one `.seg` with the buttons Pause, Warn, Note and Off. Opening a row
     shows no second `.seg`.
2. **Draw each gap with dq's share bar, not a full grey bar with a hatched end.**
   - Your bar paints the part of the file that is fine as a heavy grey rule, six times down the panel, and the gap is
     a sliver at its end.
   - dq's bar (`span.ag-scale`) is the reverse: a light track for the whole, and the gap's true share filled from zero
     on one 0–100% scale.
     - Amber is used only for the open finding.
     - Blanks are hatched.
     - The share sits beside the count: "19 of 268 rows · 7.1%".
     - The platform row shows "your rule: at most 15%" as a dashed line.
   - **Why:** §3.6 (grey everything, then highlight the one; one scale; a threshold is a line).
   - **Test:**
     - the filled width equals n/of of the track, with a 2 px minimum;
     - only the open finding is `--warn`.
3. **Take the newcomer's structure above and around the rows.**
   - The one-line why: "Accept each as known, or it is listed every day." It is 10 words and tells you why the step
     asks, where yours restates the button.
   - The two groups: "Worth asking about · 1" first, then "Explained · 5".
   - The finding's own "Accept it as known" on its row.
   - The primary button that names its group: "Accept the 5 explained ›".
   - **Why:** "Accept the 5" then refers to something on screen. One focal point (§3.5).

## Conflicts

- **The gaps screen: four fixes rebuilt it.** Ship yours as the base, with:
  - dq's share bar (change 2);
  - the newcomer's why, groups, button and inline accept (change 3);
  - my control (change 1), and from my round 2 the row grid (the control at the left, *Why ›* at the right, the state
    on its own line) and weight 600.
- **Lines that four of us wrote, keep one of each:**
  - the closed-fold rule: mine, app-wide, which also covers the owner's Decide version and dq's `#buildpanel` one;
  - the hidden kinds line beside the map: yours, the newcomer's and mine are the same rule;
  - the intro sentence: the newcomer's.
- **Dead code:** `gapEvidence` and `linkLi`/`foundLi` go in the merge, as you note.
