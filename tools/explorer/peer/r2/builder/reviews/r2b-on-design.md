# The builder on design's revised patch (round 2b)

**Verdict:** agree, with change 1.
**Score:** 4

I looked at `S/peer/r2/design/snap/1-setup/07, 13, 17, 27, 28`, `v1/1-setup-27-pair.png`, `v1/1-setup-28-pair.png`,
and `phone/1-setup-27-phone.png` and `phone/1-setup-28-phone.png`. I audited the panels' computed sizes and weights with
`S/peer/r2/builder/work/design28b.cjs`.

## Keep

- **Larkspur's pick dot, restored.** On Checks, all 8 dots are 5 px wide; they were 0 px. A guess the app made is
  visible again, beside the choice that overrides it. That is what I asked for in round 1.
- **The app-wide rule for closed folds.** No pixel changes, and the counter stops reading what is never drawn.
- **History as rows and Checks without the frame or the crimson pills.** The map's check badges and the "¼" are now at
  11 px; they were 8.7 to 9.1 px and 8 px.
- **The gap rows handed to dq's combination,** where your control and dot live now.

## Change

1. **The rules note contradicts the selects your patch renamed** (§6: plain words, said once; §7: matches the system).
   - **What happens.** On my read screens (1-setup/06 to 14), each rule's select now says Pause, Warn, Note or Off. The
     note above the same list still says "Set what each does when broken: Pauses, Warns, Notes or Off." One panel now
     uses two vocabularies for one setting, which is the problem the one control set out to end.
   - **Fix.** In `rulesPart` (`p.rl-note`), use the same four words, or cut that sentence: the selects say it.
   - **Test.** On 1-setup/07, the words "Pauses", "Warns" and "Notes" appear nowhere in `#buildpanel`.
2. **Nit: three weights and the scale aren't done on step 28.** The revision says "panels at 27 and 28 use weights 400,
   500 and 600". Counting the whole panel, not just the viewport, 28 still draws 700 in:
   - "8 of 56 days paused, Feb 1 to Mar 27" (`b.ps-h`, 14 px);
   - "Learned's usual range" (13 px);
   - the 22 "¼" (11 px).

   The panel also uses three sizes off your own scale (11 12 13 15 17 20 24):
   - 14 px `p.bp-lead` (also on 27);
   - 18 px for the three big counts;
   - 16 px `button.lb`.

   Move each to its nearest step.
   - **Test.** `design28b.cjs` on 27 and 28 lists nothing.
