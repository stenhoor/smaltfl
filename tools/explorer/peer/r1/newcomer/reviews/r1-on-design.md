# The newcomer on design's "One quiet system"

I judge as someone from the business, learning smaltfl from the videos. The test is whether I could follow each step
without the caption.

**Verdict:** agree, with the changes below.
**Score:** 4

**What I looked at:**

- the proposal and `changes.md`;
- before and after: 2/01, 4a/01 and 2/12; the pairs for 1-setup/03, 1-setup/20 and 3-explore/01;
- the live phone renders of the paused day and of Decide;
- `v3_explore.cjs` run against `peer/r1/design/app`: no page errors. Explore is restyled, with the same layout.

## Keep

- **The 11 px floor on the map.** File names were 8.5 px before, so I could not read "Requirements" or "Platform links".
  Now I can.
- **One magenta path from the cause to what it holds.** The waiting file is outlined, the line runs to "HELD · 11", and
  the held chips are grey. I can see cause and effect at a glance (§3.2; §3.6 grey everything, then highlight).
- **The held list said once** on desktop.
- **Serious and mild banners have different shapes,** filled and outlined, and the word is kept (§6 never colour alone).
- **Proposed kinds are no longer smalt** during setup, so "Add CMDB ›" is the one accent (ADR 0028).
- **The gaps are rows** and "evidence ›" is a text link: the stacked-card feel is gone (§7).
- **Motion plays once,** in 0.24 s, eased out (§7).

## Change

1. **Draw mild in amber, end to end.**
   - **Why:** the mild banner (4a/01) is outlined in crimson, with a crimson pause mark and a crimson "Sat Mar 2 is
     paused". Only the chip is amber, and a newcomer reads crimson as alarm.
   - **What:** on a mild day, draw the banner's outline and pause mark in `--warn`, as the owner's badge and dq's figure
     do. Serious stays filled with `--bad`.
   - **Test:** no `--bad` in 4a/01's banner; 2/01 and 4b/01 are unchanged.
   - **Principles:** §6 colour by role; §5 Carbon (shape, colour and a word); §7 matches the system, with one severity
     language across the banner, the badge, the cause card and the figure.
2. **Number the days that matter.**
   - **Why:** the desktop month strip now numbers Mondays only, with the date on hover. I can't find the decided day
     (✓) without counting, and touch has no hover.
   - **What:** number every day that carries a mark (paused, warned or decided) and the day shown, as well as Mondays.
   - **Test:** in 2/01, every cell with a mark shows its number.
   - **Principles:** §3.6 label directly; §7 every state covered.
3. **Tell "read" from "only named" during setup.**
   - **Why:** all three proposed kinds are now the same dashed grey (1-setup/03). The kind the file being read brings
     and the two it only names look alike, and those two still show counts from unread files ("246 units · 1 file").
   - **What:** take the builder's two states in your colours. The file being read is ink with a dashed outline; the
     kinds it only names are muted grey and say "named in CMDB".
   - **Principles:** §2 steps that happen off screen; §3.8 show the step.
4. **Keep the choice pictures one size on a phone, or drop them for the owner's eye line.**
   - **Why:** on the live phone, the chosen row's picture fills the width (about 330 px) while the next row's is about
     90 px. The panel also opens scrolled past the severity.
   - **What:** with the owner's structure (see Conflicts) the pictures go and the severity stays on top.
   - **Principles:** §7 one component language; §6 works on a phone.

## Conflicts

- **design and owner, the Decide panel.**
  - The owner's content and order win: 218 words, against 603 here.
  - Design's tokens, type scale, scrim with the page behind hidden, chosen-row style and motion apply on top.
  - Design's four choice pictures give way to the owner's eye line.
- **design and dq, severity.** This is no real clash once combined:
  - colour from dq and the owner: mild amber, serious crimson;
  - shape from design: serious filled, mild outlined;
  - the word always;
  - the figure's day column in the same colour (dq).
  Change 1 is what it takes.
- **design and the builder, the setup kinds.** The builder's two states, in design's greys (change 3).
- **design and mine.**
  - My file card (`.cvhead`, `.col .cv`) uses 11 to 12 px and tokens only, inside your floor.
  - My `.kcount .kwhy` fixed its size at 12 px, so it would escape your scaled floor. It gives way to the builder's
    `.kpoint`, which inherits its size, so nothing escapes.
  - My smalt underline on the tapped column of the rows (`th.tap`) is the active state, in line with your "smalt for
    the state you picked".
