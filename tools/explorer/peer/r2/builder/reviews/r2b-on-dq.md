# The builder on dq's combined gaps step (round 2b)

**Verdict:** agree.
**Score:** 5

I looked at `S/peer/r2/dq/snap/1-setup/21, 22, 23, 26`, `v1/1-setup-22-after-phone.png`,
`v1/1-setup-26-after-phone.png` and `v1/finding-fold-open.png`, each against `S/peer/snap2/…`. I ran
`S/peer/r2/dq/app` twice:

- `S/peer/r2/builder/work/litcheck.cjs` pointed at every row, tabbed into the first and picked Pause on the second;
- `work/litafter.cjs` pointed at the finding and picked a setting without moving the pointer.

Both ended with no page errors.

## My grafted pieces: did they land as meant?

| Piece | Landed? | Evidence |
|---|---|---|
| Pointing at a gap lights its files, and for a link its line | **Yes**, with one hole (change 1) | Each of the six rows lights the right chips: approver_id lights People and Exceptions; platform_id lights CMDB and Platform list. Keyboard focus lights them too, and the line. Step 23's snapshot shows both chips and "approver_id · 19 rows not found" outlined |
| One fold per row, no control repeated inside | **Yes** | `finding-fold-open.png`: the column with its source, the ids, the 56-day strip, "Warn when", "Pause would stop …"; no four-way control |
| The head said once | **Yes** | "All 22 files are in · 5 kinds · 8 links between them". The kinds line is hidden beside the map and kept on a phone |
| The Note truth fix | **Yes, and better** | "✓ accepted at 4 · listed, no day marked" |
| Ids behind Why › | **Yes** | "Not among the people: P-0093 P-0143 P-0037 P-0004 P-0061 …" |
| The step-23 glide in the script | **Yes** | dq's copy keeps 28 steps, and 23 is drawn lit |
| Pause's consequence on the row (the concern I raised with design) | **Yes** | Picked live on "no version 1 row": "Pauses 5 of 56 days: Feb 12, Feb 13, Mar 1, Mar 2 and Mar 25" |

## Keep

All of it:

- one scale with the dark gap on a pale track, the finding the one amber bar;
- "all non-production" and "all SaaS" on the bars;
- your rule's 15% line, and "Warns on none of the 56 days";
- the finding first, under its own heading, with its own *Accept it as known*;
- "Accept the 5 explained ›";
- the kit's control with Larkspur's dot;
- every setting's consequence on its row.

This is the one screen I'd want at the end of setup: what reading found, how big, why it's expected, which to look into,
and one tap to settle each, with the tap's effect shown.

## Change

1. **Keep the map's line lit through a pick.** This one is my own code's hole, not dq's.
   - **What happens.** Point at the finding and pick *Note*. The two chips stay lit, but the line's label
     ("approver_id · 19 rows not found") loses its outline. It doesn't come back until the pointer leaves the row and
     re-enters (`litafter.cjs`).
   - **Why.** The pick redraws the map, and the map draws its labels anew (`drawEdges` in explore.js), so a class set on
     the old label is gone. The moment you change a gap is when its link should stay in view (§3.8).
   - **Fix.** In the `if (!P.dataset.gp)` block, add one `MutationObserver` on `#stage` (childList). Whenever labels are
     re-added, it re-lights the row under the pointer or focus:
     ```js
     const li = document.querySelector('#buildpanel li.gp:hover, #buildpanel li.gp:focus-within');
     if (li) lit(li, true);
     ```
   - **Test.** Run `litafter.cjs` on the app. After the pick, the lit list still includes "label".
2. **Nit: the key now says what every row's consequence line says.** "Pause holds the day · Warn marks it ◆ · Note
   lists them · Off stops checking" sits above rows that each say "Warns on 1 of 56 days: Feb 24", "Listed, no day
   marked", "Not checked". Either can go (§6: said once). I'd drop the key, but it is the newcomer's to keep, so this
   needn't block.
