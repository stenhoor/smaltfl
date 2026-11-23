# The builder on the newcomer's fix: "Say why, show the thing"

**Verdict:** agree, with change 1 made in the merge.
**Score:** 4

I looked at `S/peer/r1/newcomer/snap/1-setup/03, 17`, `3-explore/05, 10`, `snap-rows/3-explore/08b.png` and the phone
renders, each against `S/peer/snap/…` and `S/peer/frames/3-explore/f11.jpg`. The five official scripts pass unchanged.

## Keep

- **A dashed kind says why it is there, on the kind:** "CMDB names 176 units". These are the same words as the next
  file's card, "CMDB names 176 units; this file lists them", so the map and the panel agree. For the kind card I'd
  ship this wording rather than my "176 named in CMDB".
- **"named in CMDB" on the phone's small map** (`modelPic`). I didn't touch it; keep yours.
- **"dashed: not added yet".** It is more accurate than my "not read yet": the file being read is read, but not added.
- **A file shows a real row,** read down the columns: APP-0003, ing-east-2, TLS1.3, Pass, from the model's own
  `sample[0]` and only on that day's file. For a builder that is evidence, not decoration (§3.9, real content).
- **The scope in plain words,** and outputs held by another file saying "waits" once.
- **The rows opening on the tapped column,** with the column tinted. It makes the caption true.

## Change

1. **A kind's card shouldn't show facts from the file nobody has read.** The one change that matters.
   - **What.** At 1-setup/03, Organisational unit says "CMDB names 176 units" and then "↻ reports into another unit".
     That self-link is `hr_org_units.csv`'s own `parent_id`, still unread. The chip reads "Org units", a name given
     only when the file is read and added. At 17, Person brings "People work in units", from `hr_people.csv`'s own
     `org_unit_id`, also unread.
   - **Where.** `syncModel`: leave out joins whose `from` is a file pointed at but not read (`!pointedAt.has(j.from)`
     in the `joins` filter), and name that file's chip by its file (`short: fname(f)`, class `pointed`). My patch does
     both.
   - **Why.** §2, steps that happen off screen. Otherwise the card's own reason, "CMDB names 176 units", sits beside a
     claim CMDB can't make.
   - **Test.** At 03, the Organisational unit card shows no ↻ line and its chip reads `hr_org_units.csv`. At 17, the
     only line to Person is "Units are led by people".
2. **A nit: the first row is one row, not the file.** Keep "Today's first row" as the header. Give each value cell the
   column's kind as its `title` ("key · text", the type tag it replaced), so a builder can still check what a column
   was read as without opening its sheet.

## Conflicts

- **With mine: the same lines.** We both edit `syncModel`'s kinds, the kind card's `.kcount` in `explore.js` `paint`,
  and `mapKey`. Combine:
  - **Kind card text:** the newcomer's "CMDB names 176 units" (`k.why`, `.kwhy`). My `k.pointed`, "176 named in
    CMDB", is dropped.
  - **Phone mini-map:** the newcomer's "named in CMDB".
  - **From mine:**
    - the `pointed` class, a grey dashed card with a transparent fill;
    - the chip named by its file;
    - no joins from unread files;
    - each line naming its columns ("owner_team_id → org_unit_id", or "→ not read yet"; `lineWhy`, `.lwhy`);
    - the join cards in the panel.
  - **Map key:** "Dashed: not added yet · a line names the columns that join it".
- **With design:** design greys the dashed kinds, which the newcomer left to design. There is no clash.
- **With the owner and dq:** none. Their screens are Decide and the figure.
