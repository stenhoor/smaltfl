# The newcomer on the builder's round 2: "What reading found, at a glance"

I judge as someone from the business seeing smaltfl for the first time, on one screen: what reading found, and how to
settle it.

**Verdict:** agree, as grafts onto dq's rows (see Conflicts).
**Score:** 4

**What I looked at:**

- 1-setup/21, 23 and 26 against `snap2`, the phone render of 21, and the pairs.
- The official `S/scripts/v1_setup.cjs` run against `peer/r2/builder/app`: 28 steps, no page errors.
- Words, re-measured with the fixed counter:

  | Step | Before | After | Panel |
  |---|---|---|---|
  | 1-setup/21 | 449 | 338 | |
  | 1-setup/22 to 25 | 476 | 341 | 318 → 203 |
  | 1-setup/26 | 501 | 388 | |

  The panel is the leanest of the four; the map behind it is 115 words.

## Keep

- **Pointing at a gap lights its files and its line on the map (1-setup/23).** With Exceptions, People and "approver_id
  · 19 rows not found" lit, I see where the gap lives without reading a column name. It is the best "show the step" of
  the round (§3.8), and it ties the panel to the picture beside it.
- **One fold, not two,** and one control while it is open. The nested "Why, and the evidence ›" and the second control
  for the same setting are gone (§2, §7 one component per setting).
- **The truth fix:** an accepted gap set to Note now says "more are noted", not "more will warn".
- **The kinds line is hidden beside the map,** and the head is one line: "Until you accept them as known, each is listed
  every day."

## Change

1. **Put the why back on the row and the ids behind *Why ›*, not the other way round.**
   - **What:** each row's headline is now an address in mono ("Exceptions `approver_id`"). Larkspur's reason ("The HR
     file lists leaders only, and an approver needn't lead a unit") moved behind *Why ›*, and ids took its place
     ("P-0093, P-0143 … 8 ids not in People").
   - **Why:** for a first-time viewer the reason is what justifies "accept as known". The ids are a builder's evidence,
     one tap away.
   - **The fix:** a plain name (dq's "Exceptions · 8 approvers not in the HR file"), the reason line visible, and the ids
     and the days in the fold.
   - **Test:** no visible row headline is a bare column name, and every row shows its reason without a tap.
   - **Principles:** §6 plain words; §3.7 the answer first; §3.9 real content, where it is used.
2. **Draw the gap from zero.**
   - **What:** today the whole file is a full grey bar with the gap hatched at its end, so the eye reads the big grey bar.
   - **The fix:** dq's bar, the gap as the one dark segment from the left on a light track, amber only for the finding.
   - **Test:** on every row, the darkest mark is the gap.
   - **Principle:** §3.6 bars start at zero; grey everything, highlight one.
3. **Make "5" refer to something on screen.**
   - **What:** "Accept the 5, each as set" sits under six rows, and the finding is set apart only by an 11 px tag.
   - **The fix:** the finding first, under "Worth asking about · 1", with its own *Accept it as known* in its row; the
     others under "Explained · 5"; the button "Accept the 5 explained ›".
   - **Principle:** §3.5 one focal point.
4. **Say the three settings once.**
   - **What:** "Warn if more · Note it · Stop checking" still appears 15 times and is never explained.
   - **The fix:** one key line above the list.
   - **Principle:** §3.7.

## Conflicts

**The gaps.** Four of us rebuilt this list; one author should build the combination.

- **Base: dq's rows.** A plain name, the count, one bar on a shared scale with "all SaaS" or "all non-production" where
  the data shows it, and the reason line. A first-time viewer can read each gap as a picture with its why.
- **Graft from the builder:**
  - the map lighting on point and focus (`li` `data-gf`, `data-gt`, `data-gc`, and `gp-lit` in `drawPanel`);
  - one fold, with the row's quick choice hidden while the fold's control is open;
  - the "more are noted" fix.
- **Graft from mine:**
  - the two groups, with the finding's own Accept in its row;
  - the key of the three settings;
  - "Accept the 5 explained ›".
- **Graft from design:**
  - Larkspur's pick dot visible;
  - weight-600 titles;
  - 44 px controls on a phone.
- **Drop:** the builder's address-style headline and its hatched-remainder bar, which change 1 and change 2 replace.
