# Owner on design, round 2b: the revised patch

**Verdict:** agree. **Score:** 4.

What I looked at:

- `proposal.md` ("Round 2: took / declined") and `changes.md`;
- `v1/1-setup-27-pair.png` and `v1/1-setup-28-pair.png`;
- `phone/1-setup-27-phone.png` and `phone/1-setup-28-phone.png`;
- the logs: five walkthroughs, no page errors;
- a computed audit of your step-27 and step-28 pages against `S/peer/snap2` (`r2/owner/reviews/work/audit.cjs`,
  `segclip.cjs`).

## Keep

- **The gap rows are out of this patch.** `patch.diff` names no `.ag-gaps`, `.ag-row`, `.agpick` or `.ag-scale` rule,
  only a comment. One author builds that screen now: dq, with your control and dot at pill size. I checked it: 196×26
  at 12 px on a desktop, 46 px on a phone. My objection is settled.
- **Larkspur's pick dot restored.** On Checks all 8 dots are 5 px wide; in `snap2` they were 0. The pick shows again on
  every segmented control, and dq's gap control gets it from your rule.
- **The app-wide closed-fold rule.** Keep it as the one rule. The owner's Decide-only copy (mine), dq's, the builder's
  and the newcomer's all give way to it.
- **The 11 px floor:**
  - history's column names were 10 at 10.5 px; now none are below 11;
  - the Checks map's badges were 41 marks at 8.9 px; now none are below 11.
- **History as rows (27):** no tinted tiles, each sparkline aligned under its name. Together with dq's chips on the
  cards' scale it reads as one picture of the 184 days.
- **Checks without the frame (28),** and the paused days as a list read down, still the one coloured thing.
- **One vocabulary:** "Pause · Warn · Note · Off" in the rule list's select too.

## Change

1. **The one that matters most: on a phone, a Checks control is cut off.**
   - On 1-setup/28 at 390 px, the Learned check's control sits beside its "at ¼" threshold and runs 80 px past the
     panel's edge. The panel clips it, so you see "Pause • | Warn | N", and Off can't be tapped
     (`phone/1-setup-28-phone.png`, measured by `segclip.cjs`).
   - It was already 74 px over in `snap2`, so it isn't yours. But it is on the screen you restyled, and a control you
     can't reach is a state not covered (§7, ready to ship on a phone).
   - On a phone, let it wrap under its threshold line, at full width like the other checks' controls.
   - Test: at 390 no `#buildpanel .seg` ends past the panel's right edge on 1-setup/28.
2. **A nit:** three weights is nearly there. On 28, "8 of 56 days paused, Feb 1 to Mar 27" (`b.ps-h`) is still 700; set
   it to 600. The ◆ and ○ marks at 700 are glyphs and can stay.

## Conflicts

- **None with mine.** Your fold rule replaces my Decide-only one, and my panel keeps its own sizes on your scale.
- **dq:** history (27) carries your rows and dq's chip scale together, and the gaps step is dq's.
