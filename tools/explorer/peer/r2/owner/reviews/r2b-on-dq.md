# Owner on dq, round 2b: the combined gaps step

**Verdict:** agree. **Score:** 5.

What I looked at:

- 1-setup/21 to 26, before (`S/peer/snap2`) and after (`S/peer/r2/dq/snap`);
- the phone renders of 22 and 26;
- the finding's fold open (`v1/finding-fold-open.png`);
- the platform row scrolled into view at 390 and 820 (`r2/owner/reviews/work/dq-22-platform-390.png`);
- the logs: five walkthroughs, no page errors, steps 28, 19, 10, 12 and 11.

## Is the control pill-sized now? Yes.

Measured in the step-22 page (`r2/owner/reviews/work/measure3.cjs`):

- **Desktop (1440):** 196×26 px, 12 px text. The old pills were 243×22, so it is about the same size. It no longer
  outweighs what reading found.
- **Phone (390):** 46 px tall with 14 px text, a proper touch target, full width.
- **The chosen segment:** the action-wash fill with ink text, plus the kit's 1.5 px smalt inset ring. That ring is the
  segmented control's selected state everywhere, Checks included, so it stays in the kit. If design ever makes that
  state tonal, it should change everywhere at once, not on this screen alone.

## Keep

- **The order a person settles it in:**
  - "All 22 files are in";
  - the why in one line ("Accept each as known, or it is listed every day");
  - the key in the kit's four words;
  - "Worth asking about · 1" with the one amber bar;
  - "Explained · 5";
  - "Accept the 5 explained ›".
  The one gap to look at is first, by heading, by place and by colour. That is "how serious" answered at a glance.
- **Sizes as bars on one scale.** The finding is amber. "all SaaS" and "all non-production" sit on their bars. Your
  rule is a line at 15%, with the platforms' 14.4% under it. Its two labels stay apart at 390, 820 and 1440.
- **What each setting does, beside the control:** "Warns on 1 of 56 days: Feb 24", "Not checked", "Listed, no day
  marked", "Warns on none of the 56 days".
  - Pause is no longer a blind tap, and dq checked all 20 sentences against `build.json`.
  - That is the consequence at the moment of choice (§3.8).
- **Pointing at the finding lights People, Exceptions and their line on the map** (23).
- **Accepted rows say their consequence** ("✓ accepted at 4 · listed, no day marked"), never "more will warn" for Note.
- **The phone at 171 words,** with no sideways scroll.

## Change

1. **The one that matters most: make the finding's row say what to ask about, not why it might be fine.**
   - Under "Worth asking about", its grey line is Larkspur's benign reading: "The HR file lists leaders only, and an
     approver needn't lead a unit".
   - What makes it worth asking sits one tap down, in the fold: "approvals by people HR doesn't list", with the ids
     "P-0093 P-0143 P-0037 P-0004 P-0061 …".
   - As the owner, the first thing I'd do is ask HR who those eight are.
   - Swap them on this one row:
     - the summary shows "Not among the people: P-0093, P-0143, P-0037 …" (mono, the same ids);
     - Larkspur's reading moves into the fold with its source tag ("Larkspur's model").
   - The five explained rows keep their reasons: that is what "explained" means.
   - Why: §3.7 (the answer first), §2 (no step without its why); trust: the heading and the line must not disagree.
   - Test: on 1-setup/22 the finding's summary shows the ids, not "The HR file lists leaders only…"; the word count
     stays within a few of 380.
2. **A nit:** "All 22 files are in" still draws at weight 700 in your copy. Design's `#buildpanel .bp-done > b` rule
   (600) fixes it in the merge, so nothing for you to do; just don't override it.

## Words

380 at 1440 is over 250, and dq says why: the map (115), the bar and the panel's head (about 70), and six rows with the
why, the key and the groups (about 190). On a phone, where the map is behind a button, it is 171.

I don't ask for more cuts here. The next cut would quiet the map while the gaps list is open, as my Decide fix does
behind its panel. That is the builder's call, because pointing at a gap needs the map.
