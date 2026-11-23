# dq on newcomer: "Say why, show the thing"

**Verdict:** agree, provided the builder's mechanism wins for the dashed kinds (change 1).

**Score:** 4

## Keep

- **One real row read down (3-explore/05).** APP-0003 … TLS1.3 · 2024-09-05 · No · Pass, labelled "Today's first
  row".
  - It is the model's own `sample[0]`, the row the rows sheet opens on (APP-0003), and it appears only when the sample
    is that day's file.
  - It is true, and it replaces eight type tags with content (§3.9).
- **The outputs said to wait once.** "10 outputs use it · ⧗ Held today: Access reviews paused, not this file" agrees
  with the banner ("Wed Mar 27 is paused") and with the Access reviews page, which keeps its full list.
- **"816 rows today · usually about 815"** agrees with the rows sheet ("50 of 816 of Wed Mar 27's rows").
- **The rows open on the column tapped,** with status second and its header underlined (`snap-rows/3-explore/08b.png`).
  The caption "opened on the column you tapped" is now true.
- **Plain scope:** "only those open to the internet or partners, live or retiring". It is a faithful translation of
  `exposure` and `lifecycle`.
- **Checked:** "CMDB names 176 units" and "CMDB names 12 platforms" match `build.json` (176 and 12 distinct ids).

## Change

1. **Don't show a fact from an unread file.**
   - **What:** on 1-setup/03, the dashed Organisational unit box still carries "↻ reports into another unit", a
     self-link from `hr_org_units.csv`, which nobody has read yet. The chip still uses the file's map name, "Org units".
   - **Fix:** take the builder's mechanism, which drops both until the file is read. Keep the newcomer's wording,
     "CMDB names 176 units".
   - **Test:** before Org units is read, no line or count on the map comes from it.
   - **Principles:** §2 (steps that happen off screen); trust.
2. **A nit: one spelling of a value per screen.**
   - **What:** the card shows the label "Pass" while the rows sheet beside it shows the raw value "pass" for the same
     cell, and the same holds for "No".
   - **Fix:** either show the raw value on the card, or label it on both. The values sheet already pairs them ("Pass
     94%").
   - **Principle:** §6 (plain words, said once and the same).
3. **A nit: a status column's first row isn't a status.**
   - **What:** on a code column like `status`, one row's "Pass" can read as "everything passes". Today 94% pass and
     4.4% fail.
   - **Fix:** add a muted "of 3 values" beside a coded column's value, with the values one tap away. Keep "Today's
     first row" as the header.
   - **Principle:** §3.7 (the answer, then the evidence).

## Conflicts

- **Builder.** Both rewrite the dashed kinds' line in video 1. Ship the builder's code (no self-link and no count from
  an unread file, the chip named by its file) with the newcomer's sentence. Say it in one place on the box and the
  same way on the next file's card.
- **Design.** Design's 11 px map floor and grey dashed kinds apply to the newcomer's `.kcount .kwhy` too. Check it at
  the map's smallest scale; there is no conflict in code.
- **Mine.** None: video 3 holds no rows figure and no rules.
