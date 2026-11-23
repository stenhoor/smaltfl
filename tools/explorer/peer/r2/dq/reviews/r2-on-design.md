# dq on design, round 2: "One kit to the end of setup"

**Verdict:** disagree. Change 1 is needed before I'd agree; the rest I'd ship.

**Score:** 3

I compared `S/peer/snap2/1-setup/22`, `26`, `27` and `28` with design's snapshots, and tapped the new gap control in
`S/peer/r2/design/app` (`reviews/pausecheck.cjs`).

## Numbers checked

- The gaps' sentences, counts and reasons are the merged ones, unchanged and true.
- **History keeps the cards' honest scale** (±7% around usual, the ±5% limit shaded); only the layout moves.
- **Checks keep their days**, now a list: Feb 16, Feb 26, Mar 5, Mar 6, Mar 11, Mar 21, Mar 23, Mar 27, as the 56-day
  record says.

## Keep
- **Larkspur's pick, visible again.** The merge had made the dot 0 px wide on every segmented control. A state that
  vanished is back (§7, every state covered).
- **The 11 px floor finished,** with the map's check badges at 11 px or more.
- **Three weights.** The days each check would have paused become a list instead of nine crimson pills.
- **History as rows, not 22 tinted tiles.**
- **The fold rule app-wide.** It is the same rule as mine, the builder's and the owner's; ship one, this one.

## Change
1. **The one that matters most: don't put Pause one tap away on a gap without what it would do.**
   - With the four-way control on each row, one tap on Pause sets the tags gap to pause the day on 55 of the 56 days
     (`reviews/design-tags-pause.png`). The row shows nothing of that.
   - "Pauses 55 of the 56 days" sits in the closed fold behind "evidence ›". On blank clusters it would be 20 days.
   - The merged screen kept Pause inside the fold, beside that line, on purpose: the consequence where the choice is
     made (§3.8).
   - **What, either:**
     - (a) keep the gaps' three choices on the row (Warn if more · Note it · Stop checking) in your `.seg` component,
       with the pick dot, and leave Pause in the fold; or
     - (b) keep four, and once Pause is chosen show "pauses 55 of 56 days" on the row.
   - I prefer (a). It is one component, it keeps "if more", and an accepted baseline's useful choices are those three.
   - **Test:** no gap can be set to pause without "pauses N of 56 days" on screen.
2. **"Warn" alone drops "if more".**
   - For a gap already accepted at a count, a plain "Warn" reads as "warn while it's there": the cry-wolf mode the user
     turned down for their own rule in video 1. It maps to "a new one appears".
   - If the four words stay, say it under the control or in the key: "Warn: when there are more".
   - §6 (plain words, and true).
3. **The facts are still sentences.** The six gaps' sizes stay words ("4 of 1,830" against "675 of 1,830").
   - Style the builder's rows (count, bar, evidence line) in your system rather than the merged sentences. See the
     combination below.

## Conflicts
- **With mine:** your control against my keeping the three words on the row. Resolve with change 1(a): your component,
  the gaps' words, Pause in the fold.
- **History:** your history rows and my history-chip scale don't overlap, so ship both.
- **GAPS BASE: builder,** with:
  - from dq: the bar's figure-ground, the share and the rule's limit line;
  - from newcomer: the two groups and the finding's own accept link;
  - from design: the pick dot, the `.seg` look and weight 600.
