# Owner on dq, round 2: "Six gaps on one scale"

**Verdict:** agree. **Score:** 5.

**My recommendation: dq is the BASE for the gaps screen.** The grafts are listed under Conflicts.

What I looked at:

- 1-setup/21, 22, 26 and 27, before (`S/peer/snap2`) and after (`S/peer/r2/dq/snap`);
- the step-22 phone render (182 words, no sideways scroll) beside the other three authors'
  (`r2/owner/reviews/work/phones-22.png`);
- the logs: all five walkthroughs, no page errors, same step counts.

## Keep

- **Every gap as a number and a picture, on one scale.**
  - "Exceptions · 8 approvers not in the HR file · 19 of 268 rows · 7.1%".
  - Its bar is its true share of its file, on the same 0–100% track as the other five, with a 2 px floor for the tags'
    0.2%.
  - It answers my first question at a glance: how big each one is, and which one matters.
- **The finding is the one amber bar, with its words.** The biggest bar (no cluster, 36.9%, hatched grey, "all
  non-production") is visibly the harmless one. Size is not seriousness, and the screen shows that without a
  sentence (§3.6: grey everything, then highlight the one thing).
- **Your rule drawn as a line.** "your rule: at most 15%", with the platforms' 14.4% just under it. A threshold as a
  line (§5).
- **Segment names in place of sentences** ("all SaaS", "all non-production"), only where the data matches exactly.
  Truthful.
- **The tally said once,** in the foot.
- **History's chips on the cards' scale** (27): one scale for the same 184 days.
- **The figure's labels at 11.8 px** in the corrected file's narrow fold (2/16, 2/17 at 820 wide). That is my panel's
  own figure, thank you.

## Change

1. **Most important: drop the axis legend ("0 · each gap's share of its file · 100%").**
   - Each row's "· 7.1%" already says what the bar is (§3.6: label directly, no legend).
   - On a phone the line also scrolls off the top and leaves the scale unexplained.
   - Test: no `p.ag-axis`; 22's count falls by about 8.
2. **Take the newcomer's two groups:** "Worth asking about · 1" (the finding, with its own *Accept it as known*), then
   "Explained · 5", and the primary "Accept the 5 explained ›".
   - Today "Accept the 5, each as set" doesn't say on screen which five.
   - The finding already leads by data order and by colour, so this is a label, not a rebuild.
3. **A nit: "your rule: at most 15%" and "all SaaS" sit on one line under a 14.4% bar.** At 390 they are only a few px
   apart. Keep the 8 px gap you measured on every size (`proto/row-platform-*.png`).

## Conflicts

**The gaps screen.** Four patches rewrite `allInView()`'s gap rows. Ship one: **dq's row as the base**, because it is
the closest to the screen a person needs: what reading found, as sizes on one scale, with the one finding in amber.
Graft:

- **newcomer:**
  - the one-line why at the top ("Accept each as known, or it is listed every day");
  - the two groups, the finding first with its own *Accept it as known*;
  - "Accept the 5 explained ›";
  - the key of what each setting does, once, in design's four words.
- **builder:**
  - pointing at or tabbing to a gap lights its files, and for a link its line, on the map (`drawPanel`'s delegated
    listeners, `gp-lit`);
  - one fold, not two (no nested "Why, and the evidence ›");
  - the head said once ("All 22 files are in · 5 kinds · 8 links");
  - the truth fix "accepted at 4: more are noted";
  - the ids line ("P-0093, P-0143 … 8 ids not in People") inside the fold, where it is the evidence.
- **design:**
  - one vocabulary, Pause · Warn · Note · Off, with Larkspur's pick as a dot, as on Checks;
  - the fold no longer repeating the control;
  - titles at weight 600.
  - The control should be the pills' size on a desktop, with a tonal selected segment (see my review of design).

**Fold rules.** Four of the five patches carry a closed-fold rule. Keep design's app-wide one. The counter is fixed now,
so it is a safety rule, not a word cut.

**Mine:** none. The gaps screen never sits behind the Decide panel.
