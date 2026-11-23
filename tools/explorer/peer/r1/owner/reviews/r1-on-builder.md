# Owner on builder, round 1: "Show the join"

**Verdict:** agree. **Score:** 4.

Looked at:

- 1-setup/05, 17, 18, 19 and 21, before and after;
- the phone render of 17;
- 2-problem-fix/01, 07 and 09 and 4b-outlier/06 rendered from the builder's snaps (unchanged: 425, 828, 857, 814
  words);
- the 4b Decide panel, opened live on the builder's app (no page errors).

## Keep

- **The join as its own step** (1-setup/17). It shows the two ends, three values meeting their twins and "All 176 found
  on all 2,401 rows", with the meaning and its source. This answers the owner's own complaint (§1) with the evidence at
  the moment it is used (§3.8). It is the single biggest trust gain in setup.
- **Pointed-at kinds are grey and say only what the read file says** ("176 named in CMDB"). The chip is named by its
  file. There is no count and no self-link from a file nobody has read. Truthful.
- **One tap turns a link off and back on.** The line leaves the map, and going back leaves no trace in "where your model
  differs".
- **The toggle is tonal**, so *Add* stays the one filled button (§6).
- **The days are untouched.** That keeps my Decide panel and the paused day free of merge work.

## Change

1. **Most important: hide the columns on the map once every file is in.**
   - Where: from step 21 on ("Every file is in"), the map's lines go back to their sentences. Assign `lineWhy` in the
     `read` step and to lines added while files are still being read. Don't assign it in the summary that follows.
   - Keep the columns on the join cards, and one tap away on the line ("What carries this link").
   - Why: on the all-in screen the gaps list is the focus (§3.5). Eight two-line labels lift it from 662 to 703 words.
     The method should be one tap away (§3.7).
   - Test: 1-setup/21 at 662 words or fewer, while 17 to 19 still read "owner_team_id → org_unit_id".
2. **A toggle with one label.**
   - Today the label flips between the state and its opposite ("✓ Linked", "Not linked"), so it can read as an action.
   - Show the checkbox `label.jn-tg` already wraps as a switch with the fixed label "Linked": on is tonal smalt, off is
     outlined `--edge`.
   - Why: states are state layers (§4), one component language (§7).
   - Test: the text stays "Linked" and `aria-checked` flips.
3. **The join card as a row, not a grey box.**
   - Design takes the grey box off `.bf-prop`. Make `.jn` a section row with a hairline and no `--sunk` fill.
   - Keep the dashed outline only for "not read yet", so a dashed frame means one thing, on the map and in the panel.
   - Why: §7, cut the stacked-card feel.

## Conflicts

- **Newcomer** also rewrites a pointed-at kind's line (`namedBy`, "CMDB names 176 units") and the map's key.
  - Ship the builder's `pointed`. It also greys the box, names the chip by its file and drops "reports into another
    unit". The newcomer's version keeps that line, a fact from an unread file.
  - Add the newcomer's phone short form ("named in CMDB" in `modelPic`), which the builder didn't build.
  - Keep one key, the builder's, because it explains the new line labels.
- **Design** also greys ghost kinds (`.node.kind.ghost`, dashed `--edge`): the same intent. Keep one rule, with design's
  selectors and colour and the builder's `.pointed` wording.
- **Mine:** none. The builder doesn't touch the Decide panel, and my CSS is scoped to `#layer .panel.decide`.
