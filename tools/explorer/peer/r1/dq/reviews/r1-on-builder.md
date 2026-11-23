# dq on builder: "Show the join"

**Verdict:** agree, with the nits below.

**Score:** 4

## Keep

- **The join as a step of its own (1-setup/17 and 18).** The columns on each side, real values meeting their twins,
  the count, and one tap to turn it off. It shows the step the owner said was skipped (§2; §3.8).
- **Every number checks against `build.json`'s `joins` and `top`:**
  - `owner_team_id`: 176 distinct, 2,401 of 2,401 found; TM-062 ×46, TM-053 ×38, TM-010 ×36.
  - `platform_id`: 12 distinct, on 2,056 of 2,401 rows (345 blank).
  - `approver_id`: 249 of 268 rows found, 19 naming 8 ids not in People. These are the same numbers as the gaps list
    ("19 of 268 rows name one of 8 approvers"), so the card and the gap can't disagree.
- **"Only sure values are drawn found" (`surely`).** No ✓ on a value that might be among the misses.
- **The found and unmatched bar.** It is a true part-to-whole: `flex` weights from `hit`, `missN` and `blank`, with an
  `aria-label`.
- **An unread kind is grey and says only what the read file says** ("176 named in CMDB"): no count and no self-link
  from a file nobody has read.

## Change

1. **Say which day the join was checked on.**
   - **What:** "All 176 found on Feb 1's 2,401 rows".
   - **Why:**
     - The key's chip just above says "all 2,401 unique · and on the 184 days before Feb 1", while the join card counts
       one file.
     - Side by side, a one-day match reads as a 184-day one.
     - `build.json` holds only Feb 1's `joins`, so Feb 1 is the true span.
   - **Test:** the card's count line names Feb 1, or "today's file".
   - **Principles:** §3.9 (real content); §6 (plain words); trust.
2. **Say the unit once.** "All 176 found" should be "All 176 ids found", as the dashed card says "176 ids like
   TM-062". (§3.9, units said once.)
3. **Capture the partial-match card in a step.**
   - **Why:** the card with ✕ on broken red lines and the found and unmatched bar for Exceptions' `approver_id` is
     described in the proposal but never captured: no snapshot of the read view shows "249 of 268 rows found".
   - **What:** add a stop on Exceptions' read view, or a `work/` render, so reviewers can check it is drawn at its true
     share (19 of 268 is 7.1%) and is legible at 390×844.
   - **Principles:** §7 (every state covered).

## Conflicts

- **Newcomer.**
  - Both rewrite the unread kinds' line: builder's "176 named in CMDB", newcomer's "CMDB names 176 units".
  - The newcomer keeps "↻ reports into another unit", a self-link that comes from the unread `hr_org_units.csv`, and
    the chip's map name.
  - Ship the builder's mechanism: no self-link or count from an unread file, and the chip named by its file.
  - Use one wording in both places. The newcomer's "CMDB names 176 units" reads plainer and matches the next file's
    card ("CMDB names 176 units; this file lists them").
- **Mine.** There is no conflict in code.
  - My video-1 fixes are the rule form's 184-day chart (`shareChart`: the tolerance's label and the highest day's no
    longer print over each other at 1/13) and the rule list's range (`'amount'`: 2,271–2,509, not 2,510).
  - Use the builder's 28-step `v1_setup.cjs` for the merged walkthrough. My two fixes sit at its steps 07 and 13,
    before the two new steps, so their numbers don't move.
