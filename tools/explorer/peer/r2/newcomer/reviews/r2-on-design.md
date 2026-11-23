# The newcomer on design's round 2: "One kit to the end of setup"

I judge as someone from the business seeing smaltfl for the first time.

**Verdict:** agree, with the gaps control grafted onto dq's rows, not shipped as its own rows (see Conflicts).
**Score:** 3

**What I looked at:**

- 1-setup/22, 26, 27 and 28 against `snap2`, and the phone renders.
- The official `S/scripts/v1_setup.cjs` run against `peer/r2/design/app`: 28 steps, no page errors.
- Words, re-measured with the fixed counter:

  | Step | Before | After | Panel |
  |---|---|---|---|
  | 1-setup/21 | 449 | 390 | |
  | 1-setup/22 to 25 | 476 | 397 | 318 → 259 |
  | 1-setup/26 | 501 | 431 | |

  27 and 28 keep their words: 398 and 474.

## Keep

- **One vocabulary for one idea.** Gaps and checks used two sets of words for "what this check does". One set, learned
  once, is easier for a newcomer (§3.1, §7 matches the system).
- **Larkspur's pick visible again** on every control, after being 0 px wide (§7 every state covered).
- **44 px controls on a phone;** the pills were about 24 px.
- **History as rows, not tinted tiles (27),** and the map's check badges at 11 px or more.
- **One closed-fold rule for the whole app.**

## Change

1. **On the gaps, the controls now outweigh the findings.**
   - **What:** six rows of four 64 px buttons (24 buttons) carry the eye before the six findings do. "Pause" is offered
     on every known gap, though no Larkspur pick is Pause. "Warn" alone loses the "if more" that made the pill
     self-explaining.
   - **The fix:** keep the one vocabulary, but at the pills' height on a desktop, and 44 px on touch only. Explain the
     four words once in a key above the list, giving Warn its gap meaning: "Warn: the day is marked ◆ when there are
     more".
   - **Test:** at 1440, each row's control is no taller than its title line; the key names all four words.
   - **Principles:** §2 every action looks like a button; §3.3 primary, secondary, tertiary; §3.7.
2. **The long sentences stay.**
   - **What:** "Exceptions: 19 of 268 rows name one of 8 approvers who aren't among the 245 people in the HR file" is
     still the first thing I read.
   - **The fix:** take dq's plain names ("Exceptions · 8 approvers not in the HR file") with its bar, as the base.
3. **Checks (28): the words are untouched (474).**
   - **What:** a newcomer still meets "8 files, 13 links (each evidence file's app_id is checked by Scope instead)" and
     "Shares Larkspur wrote down that no day may go past".
   - **The fix:** not a blocker for this patch, but the visual pass alone doesn't make the step followable. It needs a
     plain-word pass next.
   - **Principle:** §6.

## Conflicts

- **The gaps. Base: dq's rows.** Graft from design:
  - the pick dot;
  - weights;
  - touch size;
  - the one vocabulary, at the size and with the key in change 1.
  - Drop design's own gap row layout.
- **Builder:** the map lighting and one fold come from the builder.
- **Mine:** the key, the two groups and "Accept the 5 explained ›" come from mine.
- **Fold rule:** design's global rule supersedes dq's and the owner's scoped copies. Keep one.
