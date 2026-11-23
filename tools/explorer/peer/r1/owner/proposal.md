# The call first: how serious, where readers look, her pick; one tap, on record

**Persona:** the owner, the deputy security lead who decides what readers see on a paused day.

**What it is:** a working fix to the Decide panel, in `S/peer/r1/owner/app`. The patch is `patch.diff` and the list of
changes is `changes.md`. All paths below are under `S/peer/r1/owner/` unless they start with `S/`.

## The problem it fixes

On a paused day I have five minutes and four questions:

- How serious is it?
- What do readers see now, and after each choice?
- Who recommends what?
- Can I decide in one tap, on record?

Today's Decide panel answers them last.

- **814 to 1,009 visible words.** The recommendation is an 11 px chip on the second line of the first tile. A chart's
  arithmetic comes before it. Breaks §2 (everything at the same volume), §3.5 (one focal point) and §3.7 (the answer
  first).
- **Nothing comes chosen.** Agreeing takes four actions: the tile, the "Use her reason" pill, the name, the button.
  Missing the pill records "no reason given". Breaks §6 (one primary action).
- **The severity is a pink chip among pink things.** The line chart's ±10% scale can't show a 100% drop. Breaks §3.6
  (grey everything, then highlight one thing; bars from zero).
- **Four near-identical pictures and about 120 words** to compare the choices. "Done for now · reopens if a file
  comes" appears three times. Breaks §2 and §6 (said once).
- **On a phone, the recommended choice starts below the fold**, and the panel scrolls itself past the severity. Breaks
  §4 and §6 (works on a phone).
- **Stacked bordered cards, three link styles and a pill.** Breaks §7 (one component language, cut the stacked-card
  feel).

## The fix, as built

1. **How serious, first.** A badge with the product's pause mark and a word: **Serious** filled red, **Mild** amber.
   Its reason sits beside it in grey. The now-box and the title are grey and ink, so the red sits on the badge alone.
2. **The one number as a picture.** "None at all · usually about 2,314 rows", beside bars that start at zero on one
   scale. On a serious day the ±10% line and the limit's arithmetic go under "Why it paused ›", where the same figure
   already is.
3. **Where readers look after each choice.** Each choice gets an eye line: "👁 Sun Feb 25", "👁 Mon Feb 26, MFA from
   Sun Feb 25", or, when readers are on a later day, "👁 Mon Feb 26 shows the corrected file". Under it, one ✕ line
   for the risk. It is the same day the old picture put the eye under: the facts are the prototype's own.
4. **Her pick, first and chosen.** "Recommended by Sloane Marsden, security lead · Mon Feb 26, 08:10", then the choice,
   then her words, in a smalt state layer. The machine's reading (video 4a) never comes chosen.
5. **One tap, on record.**
   - The record line shows what the tap will record before you tap it: "On record: Alex Kim, head of IT controls ·
     Wait for the file · Sloane Marsden's reason, agreed".
   - The one primary button names the agreement: **Agree: wait for the file**.
   - "Write your own reason ›" opens the box and drops the agreement.
6. **Subtracted.**
   - The after-line, which repeated the tile.
   - The quote in the record line.
   - The "4 choices" count.
   - The month strip inside the panel.
   - Three repeats of "Done for now".
   - Four tile pictures.
   - The page behind (one focal point while deciding).
   - What a closed fold holds is no longer drawn.
7. **The forensics one tap away.** For a corrected file, the answer leads: "↻ A corrected file came at 14:10 · It
   passed every check". The 60-word comparison sits under "How it compares ›".
8. **One system (§7).** The choices are one list (one frame, hairlines) instead of stacked cards. There is one link
   style (smalt, medium, ›). Smalt goes on actions and the chosen row only, and status colours on status only. There
   are no new colours, only tokens.

## Screens: before and after (same step, same walkthrough)

The words are the render tool's, at 1440x900 unless a size is given. "Folds excluded" is the before-page with closed
`<details>` not counted. The tool counts their hidden contents, so it is the fair baseline. The after-pages don't draw
closed folds.

| Screen | Before | After | Words before → after |
|---|---|---|---|
| **2-problem-fix/07**, Decide on Mon Feb 26, as it opens | `S/peer/snap/2-problem-fix/07.png` | `snap/2-problem-fix/07.png` | 828 (680 with folds excluded) → **218** |
| the same step, phone 390x844 | `work/2-problem-fix-07-before-phone.png` | `v1/2-problem-fix-07-after-phone.png` | 431 → **165**, nothing scrolls sideways |
| 2-problem-fix/11, on record, before the one tap | `S/peer/snap/2-problem-fix/11.png` | `snap/2-problem-fix/11.png` | 883 (735) → **223** |
| **4b-outlier/06**, Decide on Thu Mar 21, the corrected file | `S/peer/snap/4b-outlier/06.png` | `snap/4b-outlier/06.png` | 814 (677) → **161** |
| the same step, phone 390x844 | `work/4b-outlier-06-before-phone.png` | `v1/4b-outlier-06-after-phone.png` | 421 → **136** |
| 4b-outlier/08, "How it compares ›" opened | `S/peer/snap/4b-outlier/08.png` | `snap/4b-outlier/08.png` | 814 → **212** |
| **2-problem-fix/17**, Mon Feb 26 decided from Tue Feb 27 | `S/peer/snap/2-problem-fix/17.png` | `snap/2-problem-fix/17.png` | 969 (560) → **231** |
| the same step, phone 390x844 | `work/2-problem-fix-17-before-phone.png` | `v1/2-problem-fix-17-after-phone.png` | 561 → **198** |
| 2-problem-fix/18, publish the corrected file | `S/peer/snap/2-problem-fix/18.png` | `snap/2-problem-fix/18.png` | 1,009 (600) → **231** |
| 4a-odd-but-ok/08, a mild day, the machine's reading | `S/peer/snap/4a-odd-but-ok/08.png` | `snap/4a-odd-but-ok/08.png` | 962 (811) → 319 |

- Every decision step in videos 2 and 4b is at **161 to 231** words. The target is 250.
- Video 4a stays at 319 to 345. I left that mild day's evidence as it is: the 28-day chart, the rows behind the count,
  and "Accept the new level" or "Set the limit back". That is the dq's screen. Folding it under "Why it paused ›" would
  bring 4a under 250 too.
- Every other step counts exactly the same words before and after (`work/words-after.txt`).
- At 820x1180 and 1180x820 the panel draws without scrolling sideways (`work/now-feb26-820x1180.png`,
  `work/now-feb26-1180x820.png`).

## Proved working

- `scripts/v2_fix.cjs` and `scripts/v4b_outlier.cjs` are copies of the originals. Their selectors and captions follow
  the new panel: there is no "Use her reason" tap, because it is hidden while agreeing.
- They keep the same number of steps (19 and 11), so step NN pairs with the original's NN.
- `S/scripts/v4a_odd.cjs` and `S/scripts/v3_explore.cjs` run unchanged.
- All four end with **no page errors**.
- The record each decision writes is the one the old four-action flow wrote, for example "You decided: published the
  corrected file … 'Every certificate once' Sloane Marsden's reason, agreed" (`snap/4b-outlier/11.png`).

## The review questions of §7

- **Clear hierarchy.** The badge, then the number, then her chosen row, then the primary button. Everything else is a
  quiet line or one tap away.
- **Every state covered.** Each state can be seen in the walkthroughs or in `work/peek-*`:
  - her pick agreed (07)
  - your own words ("Write your own reason ›", `work/peek-feb26-own-desk.png`)
  - a risky choice that needs a reason (Publish as is: red state layer, "needs a reason", button off,
    `work/peek-feb26-asis-desk.png`)
  - the machine's reading, nothing chosen (4a)
  - readers on a later day (17)
  - a corrected file (4b/06, 17)
  - phone and tablet
- **Matches the system.** ADR 0028 (smalt for action, never colour alone, one primary), tokens only, one list, one link
  language.
- **Ready to ship.** It runs. It is scoped to `#layer .panel.decide` and to the decide branch of `openPanel`, to merge
  beside four other fixes.

## Deliberately not changed

- The decisions themselves: the choices, their order, their pros and cons, what they record, the receipts and "Change
  this decision".
- The banner, the day card, the Build panel and the map.
- Video 4a's evidence (see above).
- "Deciding as" stays a typed field: the prototype has no sign-in. It already remembers the name after the first
  decision (step 18).
- `decidePic` still draws each choice's picture: the panel only stops showing it. If reviewers want an "after" picture,
  one CSS rule brings it back on the chosen row.

## For the reviewers: the two calls I made

1. **Her pick comes chosen.** Today's rule is "her reason, never filled in for you". It is kept in spirit: nothing is
   agreed until you tap a button that says **Agree**. The record line shows the agreement before the tap. "Write your
   own reason ›" is one tap. The machine's reading is never chosen for you.
2. **The page behind steps away while you decide.** It is a modal decision. Its own picture shows the file and what it
   holds, and the map's labels were about 100 words of noise.

## Round 1: took / declined, and why

All four reviewers agreed (4, 4, 4, 4). The revision is in `app/`. The snaps were made again (`snap/`), the phone shots
rendered again (`v1/`), and `patch.diff` regenerated: 137 lines added and 8 replaced.

### Took

1. **dq's figure takes the figure's place** (all four).
   - Removed: my usual, first and sent-again bars (their labels drew at 8.6 px), and every serious-day rule that hid
     `.u-chart`, `.ulg`, `.ulim` and `.urows`. With those gone, a merged serious day keeps dq's chart.
   - My block now only takes the frame off `.decfig` and sets the headline, so any figure runs full width under the
     badge. That is the room left for it.
   - Until dq's lands, my snaps show the prototype's own figure there. dq's sketch of the combination is
     `S/peer/r1/dq/reviews/sketch-owner-merge-fixed.png`. The merge notes are in `changes.md`.
2. **The page behind is dimmed, not blanked** (builder).
   - The scrim is 28%. While deciding, only the Build panel and the map's relation labels are hidden.
   - The map still shows MFA outlined and its line to the 11 held outputs.
3. **Nothing is decided before the tap** (newcomer).
   - The record line reads "**Goes on record when you tap Agree:** Alex Kim, head of IT controls · Wait for the file ·
     Sloane Marsden's reason, agreed", or "Goes on record with your tap:" when you aren't agreeing.
   - "On record" is left for the receipt.
4. **The panel is as tall as what it holds** (integrator).
   - From 1100 px it is a card seated right on the dimmed page, centred, 24 px from the edges, with a 12 px radius. The
     record line and the one button end the content (`snap/2-problem-fix/11.png`).
   - A long day scrolls its body and keeps its footer.
   - At 820x1180 it is still the full-height sheet (`work/r1-2-07-820x1180.png`), and at 390x844 the full screen
     (`v1/2-problem-fix-07-after-phone.png`). Nothing scrolls sideways at any size.
5. **Sizes from the scale** (design).
   - The headline is 24 px, not 22. The avatar is 22 px with 11 px initials, not 8 px.
6. **The eye taught once** (newcomer): the first choice reads "Readers see Sun Feb 25".
7. **"Stays on your list" became "Stays yours to decide"** (newcomer, in other words).
   - The newcomer asked for "Still waits for its file". I took the calendar legend's own words ("paused: yours to
     decide"), which keep the meaning: the day stays your to-do.
   - The risk line under it already says "The 11 outputs keep waiting", so "waits" would have said it twice.
8. **Who readers are** (newcomer): "What should readers see?" carries `title="Readers: the people who use the outputs"`.
   It adds no visible words.
9. **A mild day's limit tools folded** (newcomer).
   - "Accept the new level" and "Set the limit back" sit under "If it keeps happening ›", the prototype's own caption
     for them.
   - `scripts/v4a_odd.cjs` is copied so that step 7 opens it. It keeps 12 steps.

### Declined

- **Key numbers only while the keyboard is in use** (design). It is design's rule (`.opts:has(input:focus-visible)
  .tk`). It applies as it is in the merge, because nothing in my block sets `.tk`'s display. I didn't copy it, so my snaps
  still show the numbers.
- **The strongest evidence in the corrected file's line** (dq, a nit). The clause differs by day: for TLS it is "the
  first with its repeats taken out", and for MFA "2,318 rows; the first had 0". Picking it needs per-day text the
  prototype doesn't have. dq's first and sent-again columns already show 1,630 → 815.

### Words after round 1

Visible words at 1440x900, then the panel alone (`--clip .panel.decide`). The before figures are
`S/peer/words-before.txt`. The full list is in `work/words-after-r1.txt`.

| Step | Before | After, the viewport | After, the panel |
|---|---|---|---|
| 2-problem-fix/07 | 828 | 404 | 262 |
| 2-problem-fix/11 | 883 | 409 | 267 |
| 2-problem-fix/17 | 969 | 368 | 253 |
| 4b-outlier/06 | 814 | 330 | 185 |
| 4b-outlier/08 | 814 | 381 | 236 |
| 4a-odd-but-ok/07 | 962 | 464 | 325 |

- The viewport counts are over 250 for two reasons.
  - About 140 of the words are the dimmed page that reviewers asked to keep visible.
  - My copy shows the prototype's figure, about 30 words more than dq's on a serious day (dq: figure 50 → 18 at 2/03).
  - With dq's figure merged, the panel is about 230 words at 2/07 and about 170 at 4b/06.
- 4a/07 counts "If it keeps happening ›" opened, as the walkthrough shows it.
- Phone (390x844), all without sideways scroll: 2/07 205, 4b/06 167, 2/17 227.

**Works:**

- `scripts/v2_fix.cjs`, `scripts/v4b_outlier.cjs` and `scripts/v4a_odd.cjs` ran on the revised app with no page errors.
- `S/scripts/v3_explore.cjs` was rerun as a check (it opens no Decide panel): no page errors.
