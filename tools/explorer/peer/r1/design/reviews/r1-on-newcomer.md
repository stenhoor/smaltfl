# Design on newcomer: "Say why, show the thing"

- **Verdict:** agree.
- **Score:** 4.
- **Matches the system:** yes.
  - Sizes 11 and 12 px, weights 400 and 600.
  - Existing tokens only. No new colour, border or button.
  - Smalt only on the selected column.
  - Measured: nothing off the scale that this fix added (`offscale.cjs` on 3-explore/05).

Paths below are under `S/peer/r1/design/reviews/work/`.

## Keep

- **One real row on the file card:** APP-0003 … Pass, the key's value in bold and a blank in italics. Values replace
  the type tags: real content over labels (§3.9, §3.6). Visible words go from 362 to 216.
- **Outputs held by another file are said once:** one line each, with the hold said in the header (§2, §6).
- **The rows open on the tapped column.** Its header is underlined in smalt, which is the selected state in the action
  colour, as in my system, and its cells take a `--sunk` tint. No new colour.
- **Plain words for who is in the file:** "only those open to the internet or partners, live or retiring".

## Change

1. **Let the builder's version own the pointed-at kind's line.**
   - You and the builder both rewrite `.kcount` on a kind a file points at: "CMDB names 176 units" against "176
     named in CMDB".
   - Ship the builder's:
     - the number comes first (§3.3: "1,630 rows" beats "Rows: 1,630");
     - the chip is named by its file (`hr_org_units.csv`);
     - it has no "reports into another unit", which comes from a file nobody has read. Your version keeps that line
       (`n-b-kinds.png`: yours, yours with my block, the builder's).
   - Keep your short "named in CMDB" for the phone's mini-map, which the builder left unbuilt.
   - **Test:**
     - on 1-setup/03 to 05, the kind reads "176 named in CMDB";
     - a pointed-at kind has no `.kself`;
     - the phone's mini-map says "named in CMDB".

## Conflicts

- **Builder:** see change 1. In the merge, drop your `namedBy` and keep your `modelPic` short form.
- **Design (mine):** compatible, tested with my block on your snaps (`m-newcomer-design-x05.png`,
  `m-newcomer-design-03.png`). My one-shadow kinds sit fine with your first row and your map line. You left the dashed
  kinds' colour to me: the kinds a file points at go grey, as in the builder's fix.
- **Owner, dq:** no overlap.
