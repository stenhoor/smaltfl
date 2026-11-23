# The newcomer on the builder's "Show the join"

I judge as someone from the business, learning smaltfl from the videos. The test is whether I could follow each step
without the caption.

**Verdict:** agree, with the changes below.
**Score:** 4

**What I looked at:**

- the proposal and `changes.md`;
- 1-setup before and after, steps 03, 05, 16, 17 and 18 (new), 19 and 21;
- the phone renders and the live phone sheet, `work/final-phone/sheet.png`;
- `v3_explore.cjs` run against `peer/r1/builder/app`: no page errors, and explore is unchanged.

## Keep

- **The new step 17, "TM-062 ×46 —— TM-062 ✓ … All 176 found on all 2,401 rows".** For the first time I can see why two
  files are joined: the same codes on both sides. It is the best "show the step" of the round (§3.8), and it answers
  the owner's own complaint (§1).
- **Kinds only named by a file are grey and say so.** "176 named in CMDB", with the file's own name on the chip and no
  self-link or relation from a file nobody has read. Nothing appears on the map that the file in hand doesn't back (§2,
  "steps that happen off screen").
- **The partial match is drawn as one.** P-0093 ✕ sits on a broken red line, under the sentence "249 of 268 rows found
  · 19 name 8 ids not in People": a plain sentence with its picture.
- **The cuts:** the provenance paragraph, the key said three times, and *Links, at a glance*.
- **One tap off and one back,** with no trace left in "where your model differs".

## Change

1. **Put column names on the map only where they are the step.**
   - **What:** show the mono line (`span.lwhy`, "owner_team_id → org_unit_id") only on the relation of the file being
     read or just checked. Elsewhere show it on hover or focus.
   - **Why:** once every file is in (after 21), eight mono lines add about 40 words of engineers' names to the one
     picture a newcomer reads by its sentences ("Applications are owned by units"). Keep the unmatched rows visible, in
     words: "19 rows not found".
   - **Test:** at after 21, the map's visible words are back to 662 or fewer, and only lines with unmatched rows carry
     a second line.
   - **Principles:** §3.7 progressive disclosure; §2 words doing a picture's job; §7 clear hierarchy.
2. **Write "46 apps", not "×46".**
   - **What:** in `joinCard`'s `.jn-v`, write the count with the file's noun, which `build.json` already has
     (`nouns`): "46 apps", "5 units".
   - **Why:** "×46" reads as "times 46".
   - **Test:** no "×" before a count in `.jn-v`.
   - **Principles:** §6 plain words; §3.9 the unit said once.
3. **Make the link control say what a tap does, or make it a switch.**
   - **Why:** "✓ Linked" and "Not linked" name a state on something that looks like a button. In the off state, the
     smalt-outlined "Not linked" reads as an action.
   - **What:** use a switch with a fixed label, "Linked", or name the action: "Unlink", "Link again".
   - **Test:** the accessible name stays the same in both states (a switch), or it names the action.
   - **Principles:** §4 states are state layers; ADR 0028, one kit.
4. **Make the key true for both dashed states.**
   - **Why:** "dashed: not read yet" is wrong for the file being read. CMDB is read, only not added.
   - **What:** "dashed: not added yet · grey: named by a file, not read yet".
   - **Test:** at read step 03, the key names both.
   - **Principles:** §6 plain words; §7 every state covered.
5. **Say plainly why a link is locked.**
   - **Why:** "Puts it in its kind" on a locked card is cryptic to me.
   - **What:** let the card's own sentence ("Each exception is about one control") stand alone, and drop the extra line.
   - **Principle:** §6.
6. **Give the phone's small map the reason too.**
   - **Why:** on a phone the mini-map (`modelPic`) still shows "1 file" on the grey kinds (`work/final-phone/sheet.png`).
     The reason is missing where the map is smallest.
   - **What:** show "named in CMDB" there. My patch already does this; see Conflicts.
   - **Test:** at 390×844, read CMDB: the mini-map's Organisational unit says "named in CMDB".
   - **Principles:** §6 works on a phone; §7 ready to ship.

## Conflicts

- **With mine (newcomer, screen 1, the dashed kinds).** We fixed the same thing from the same fact, the read file's
  `distinct`.
  - Mine writes "CMDB names 176 units" on the kind.
  - The builder's writes "176 named in CMDB", and also drops the self-link, puts the file name on the chip and leaves
    out relations from unread files.
  - **Ship the builder's.** Drop my `namedBy`, `k.why`, `.kwhy` and my map-key wording.
  - Keep my one `modelPic` line, the phone's small map, reading the builder's `pointed` field.
- **With design.** Design draws every proposed kind grey, the file being read included. The builder keeps the file being
  read smalt and the named-only kinds grey.
  - **Combine:** the builder's two states, in design's colours. The file being read is ink with a dashed outline; the
    kinds it only names are muted grey and say "named in …".
  - No smalt on the map, so *Add* stays the one accent (§3.2, ADR 0028).
- **With dq.** dq changed 1/07 and 1/13, the rules; the builder didn't touch them. No overlap.
