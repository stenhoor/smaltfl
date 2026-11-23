# The newcomer on dq's round 2: "Six gaps on one scale"

I judge as someone from the business seeing smaltfl for the first time, on one screen: what reading found, and how to
settle it.

**Verdict:** agree, and **the base for the gaps screen** (see Conflicts).
**Score:** 4

**What I looked at:**

- 1-setup/21, 22 and 26 against `snap2`, the phone render and `v1/gaps-before-after.png`.
- The official `S/scripts/v1_setup.cjs` run against `peer/r2/dq/app`: 28 steps, no page errors.
- Words, re-measured with the fixed counter:

  | Step | Before | After | Panel |
  |---|---|---|---|
  | 1-setup/21 | 449 | 352 | |
  | 1-setup/22 to 25 | 476 | 369 | 318 → 246 |
  | 1-setup/26 | 501 | 404 | |

## Keep

- **Each gap reads as a picture with its why.**
  - A plain name: "Cloud assets · no cluster", "CMDB · no shared platform", "Org units · no leader".
  - Its count.
  - One bar on one scale for all six. The tags' 0.2% is a sliver, the clusters' 36.9% a third of the track.
  - Larkspur's reason under it.
  - Without arithmetic I can tell a little from a lot (§1, "turns sentences into a number or a picture"; §3.6).
- **"all SaaS" and "all non-production" as the reason where the data shows it.** That is a label on the mark in place
  of a 20-word sentence.
- **Your rule as a dashed tick,** "your rule: at most 15%", with the 14.4% gap just under it. I can see why the gap is
  watched and not flagged.
- **The finding is the one amber bar,** with its words (§3.2 one accent for the one thing that needs attention; §6
  never colour alone).
- **The axis line, "0 · each gap's share of its file · 100%",** which says once what every bar means.
- **History's chips on one scale (27)** and the closed-fold rule.

## Change

1. **Name the version gap in plain words.**
   - **What:** "Exceptions · version 2 alone" is the one name I had to guess.
   - **The fix:** "Exceptions · no version 1 row", as `GAP_SAID` says it.
   - **Test:** no "version 2 alone" on the row.
   - **Principle:** §6.
2. **Drop the percentage beside the count where the bar shows it.**
   - **What:** "19 of 268 rows · 7.1%" says the bar's length a second time, to a decimal.
   - **The fix:** keep the count; the bar is the share. Keep the rule's own label.
   - **Test:** six fewer figures; the watched row still shows its 15% tick.
   - **Principles:** §2 decimal noise; §3.3 de-emphasis.
3. **One grey for the explained gaps, amber for the finding.**
   - **What:** hatched for blanks and solid grey for links that point at nothing is a second encoding that nothing on
     screen explains. The words already say which kind each gap is.
   - **Principle:** §3.6 grey everything, highlight one.
4. **Make the screen followable without the caption.** These are the grafts below:
   - say once what Warn if more, Note it and Stop checking do;
   - put the finding first, so that "Accept the 5" counts what is on screen.

## Conflicts

**The gaps. Base: dq's rows.** Graft:

- **From the builder:**
  - pointing at a gap, or tabbing to it, lights its files and its line on the map;
  - one fold, with one control while it is open;
  - "more are noted" for an accepted Note.
- **From the newcomer (mine):**
  - the head line "Accept each as known, or it is listed every day.";
  - the key of the three settings;
  - "Worth asking about · 1", the finding with its own *Accept it as known*, then "Explained · 5";
  - "Accept the 5 explained ›".
- **From design:**
  - Larkspur's pick dot visible;
  - weight 600 for titles;
  - 44 px controls on a phone.
  - If the one vocabulary (Pause · Warn · Note · Off) is adopted, set it at the pills' size on a desktop and explain it
    in the key. Six rows of 64 px buttons would outweigh the bars.

**Words.** I estimate the combination at about 390 visible words, the panel about 270, of which the map behind is 115.
The next cut is to show only each row's chosen setting, with the control one tap away (about 24 words).
