# Design on builder: "Show the join"

- **Verdict:** agree.
- **Score:** 4.
- **Matches the system:** yes.
  - Tokens only.
  - The panel measures on the scale (11, 12 and 13 px; 14 and 16 px were there before).
  - Smalt sits on the action and the selection only.
  - The one exception is the weight of the column lines on the finished map (change 1).

Paths below are under `S/peer/r1/design/reviews/work/`.

## Keep

- **The join as its own step (17).** It shows:
  - the two ends;
  - three values meeting their twins;
  - "All 176 found";
  - the meaning with its source.

  That is §3.8 to the letter, and the owner's own complaint ("joined up to a bunch of things and I don't know why")
  answered on screen.
- **Kinds pointed at but not read are grey and named by their file.** The chip reads `hr_org_units.csv` in mono and
  the kind says "176 named in CMDB". No count and no self-link come from a file nobody has read. It is truthful, and it
  takes smalt off the map: one accent (§3.2, §6).
- **Dashed means "not read yet"** on the map and in the panel's join card alike: one meaning per mark.
- **"✓ Linked" is tonal, never filled,** so *Add* stays the one primary (§6; §7 "one primary per view").
- **One card language.** A join card is `--sunk` with a 10 px radius and no frame. With my block on top, the "What one
  row is" box loses its frame, so your join cards become the only cards on the panel. The evidence becomes the step's
  focus, which is right (`m-builder-design-17-panels.png`).

## Change

1. **On the finished map (steps 21 to 25), name the columns only on the links that need a look.**
   - Those are the two links with gaps: "approver_id → person_id · 19 rows unmatched" and "app_tag → app_id · 4 rows
     unmatched".
   - The other six links show their columns on hover or focus. Their label already opens "What carries this link".
   - Keep every line's columns while its file is read (05, 17) and on the line just added (19).

   **Why.** On the review map:
   - every relation becomes 2 to 4 lines of mono;
   - the labels outweigh the kinds they join;
   - visible words rise from 662 to 703;
   - the two links with gaps get lost among six that are fine.

   Principles: §3.3 (hierarchy by de-emphasis), §3.6 ("grey everything, then highlight the one that matters") and §7
   (clear hierarchy).

   **Sketch:** `sketch-builder-21-pair.png` (left as built, right with the change). It is your own snap with one CSS
   rule and one class: 703 → 679 words, and the two gaps stand alone.

   **Test:**
   - on 1-setup/21, a `.lab .lwhy` line is visible only where its text says "unmatched";
   - on 1-setup/17 and 19, the checked line's columns are visible.
2. **Set the column lines in `--muted` at 11 px.** Today they are `--ink-2` at 12 px, in mono, which reads heavier than
   the 12 px sans sentence above them. The sentence should lead and the columns support it (§3.3).
   - **Test:** `.lab .lwhy` computes to `--muted` and 11px.
3. **Nit: shorten the map key.** With change 1, "Dashed: not read yet · a line names the columns that join it" becomes
   "Dashed: not read yet", since the columns come on hover (§2).

## Conflicts

- **Newcomer** rewrites the same slot, `.kcount` on a kind a file points at: "CMDB names 176 units" against your "176
  named in CMDB". **Ship yours:**
  - the number comes first (§3.3: "1,630 rows" beats "Rows: 1,630");
  - the chip is named by its file;
  - your version drops the self-link from an unread file, which the newcomer's keeps (`n-b-kinds.png`).

  In the merge, drop the newcomer's `namedBy` and keep your `namedIn`. Keep the newcomer's short "named in CMDB" for
  the phone's mini-map, which you left unbuilt.
- **Design (mine).** Compatible, tested with my block on your snaps (`m-builder-design-17-panels.png`). One change
  on my side:
  - I greyed every proposed kind, including the kind of the file being read.
  - You grey only the kinds it points at, and leave the kind of the file being read in smalt.
  - Yours is more exact under my own rule: smalt marks the action and the selected thing, and the file being read is
    the selected thing.
  - In my revision I drop my ghost rule and keep yours.
- **Owner, dq:** no overlap.
