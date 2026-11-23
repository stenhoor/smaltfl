# The builder on design's round-2 fix: "One kit to the end of setup"

**Verdict:** agree, with change 1. The gaps part goes in as a graft onto dq's screen; see *Conflicts*.
**Score:** 4

I looked at `S/peer/r2/design/snap/1-setup/22, 26, 27, 28`, `phone/1-setup-22-phone.png` and the pairs in `v1/`, each
against `S/peer/snap2/…`. I also ran `S/peer/r2/design/app` to the gaps and picked Pause on a row
(`S/peer/r2/builder/work/pausecheck.cjs`; the row is `reviews/design-pause-row.png`).

## Keep

- **One control and one vocabulary for what a check does,** Pause · Warn · Note · Off, on the gaps as on Checks. It is
  the same `.seg` at the same 64 x 30 px. It settles my critique 5: three vocabularies for one setting.
- **Larkspur's pick visible again,** as a 5 px dot. It was 0 px wide, so the guess the app made was invisible.
- **The fold no longer repeats the control.** It keeps only what refines it: "Warn when", the pause floor and "Pause
  would stop …". That is better than my answer, which hid the row's control while the fold was open.
- **A 44 px control on a phone,** a touch target where the pills were about 24 px.
- **History as rows, and Checks without the frame or the crimson pills.** The map's check badges are at 11 px or more.
- **The fold rule app-wide.** A closed fold is neither drawn nor counted.

## Change

1. **Picking Pause or Warn on a closed row must show what it will do, on the row** (§2: steps that happen off screen;
   §3.8: show the evidence when it is used).
   - **Why.** Before, the row's quick choice had no Pause. Pausing a day sat in the fold, beside its consequence: "Pause
     would stop 1 of the 56 days: Feb 24", and the floor "Pause when at least N new in a day". Now Pause is one tap on
     every row. Picked with the fold closed, the row shows only "Pause" selected
     (`reviews/design-pause-row.png`). How many days it would pause, and which, stays hidden. A setting that holds
     readers' outputs changes with its effect out of sight.
   - **What.** When a row is set to Pause or Warn, add its one consequence line under the control, from `wouldDays(k)`:
     "Pauses 1 of 56 days: Feb 24" or "Warns on 1 of 56 days". Alternatively, open the fold on Pause. Note and Off need
     no line: their state is the word.
   - **Test.** On step 22, pick Pause on "Exceptions … version 2 alone" with its fold closed. The row reads "Pauses N
     of 56 days" (or opens) without another tap.
2. **The gaps' content stays as merged:** long titles, and the reason under each. Design left that to the builder and
   the newcomer. In the merge the row is dq's (short name, count with %, the shared-scale bar, the reason), with your
   control in it.

## Conflicts

- **The gaps screen. Base: dq.** Graft from you:
  - the one `seg4` control with its visible pick dot;
  - the fold that only refines it;
  - the 44 px phone size;
  - change 1's consequence line.
  The newcomer's grouping and my map highlight go in too; the full list is in my review of dq.
- **With mine.** My round-2 patch keeps the three-way pills and hides them while the fold is open. Drop that rule in the
  merge; your fold without the control replaces it.
- **History (27).** dq redraws the map's history chips on one scale, and you restyle the panel's tiles as rows. They
  don't overlap: dq changes the map's chips, you change the panel's cards. Ship both.
