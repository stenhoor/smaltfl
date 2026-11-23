# Changes: setup's Checks step as one checks × days grid (peer r4, dq)

Every change is in `app/build.js` (marked `peer:dq r4`) and in one CSS block at the end of `app/index.html`'s `<style>`
(`/* peer:dq start */ … /* peer:dq end */`, lines 2499 to 2561). The two earlier dq blocks are untouched.

`explore.js`, `build.json` and `model.json` are unchanged. Line numbers are `app/build.js`'s.

## What each check would have done, day by day (truth first)

| change | where |
|---|---|
| `liveChecks()`: each check's paused and warned days over the 56 days, under the settings on screen. | 1139–1161 |

**How it counts each finding of the record** (`x.finds` and `x.holds` in build.json), by its own file's mode for that
check (`checkOf`):

| file's mode | outcome |
|---|---|
| pause | paused |
| pause at ¼ | paused where the record held the file, warned where it didn't |
| warn | warned |
| note or off | nothing |

**The other rows:**

- **Links and Blanks** count as the day player counts them (`linkFindings`).
- **Rows** adds the days past its ±limit (`rowsBeyond`), as the old strip did.
- **A day counts once**, as its stronger outcome.

**It equals the record under Larkspur's settings.** Under Larkspur's own settings this is `recordOfChecks()` exactly,
finding for finding: `work/rec-check.cjs` on build.json finds no difference, and every finding is on a check that applies
to its file. So the numbers are build.json's, and a control changed on the grid redraws its row truthfully:

- Learned to Warn turns its 3 pauses into warnings, and the headline goes from 8 to 5 of 56.
- Off clears the row.

The old strips came from the record whatever the control said: a check set to Off still showed its pause days.

## The grid

| change | where |
|---|---|
| `checksGrid(rows, rec)` replaces `pausedStrip()`: one `div.pdx.ckx` | 1162–1203 |
| `ul.ck-kinds.ckx-rows` holds the rows, one subgrid | |
| `ckrow` act: a row's sentence opens and closes from its name, one row at a time (`B.ckRow`) | 1829 |

**Inside `div.pdx.ckx`, top to bottom:**

1. **The headline** "8 of 56 days paused" (`.ps-h`), with a one-line key: a tall crimson bar, paused; a half-height
   amber bar, warned.
2. **The axis.** "Feb 1", "Mar 1" and "Mar 27", each placed in its own day's column. Through `smDay.text`, a played
   day that is today would read "Today".
3. **The day.** Each day's outcome: paused where any row pauses it, or where only an output's own rule did. That day is
   Feb 16, kept from the record and said as "an output's own rule, set in the next step".
4. **A row a check:** Columns, Fresh, Rows, Key, Scope, Values, Learned, Links, then Blanks, Limits and each rule of
   your own.
   - Its name is a button, with "mixed" or "pauses at ¼" under it where that's so.
   - Then its 56 days: a mark where it would have paused or warned, a hairline where it let the day through.
   - Then its control.
5. **"Why each paused day paused ›"**: the old list of the 8 days with their plain reasons, each a button to the file's
   check, and the outputs' own warn days. Closed.

**The days are true to build.json.** Each row's `.ckx-d` carries its days in words as its `aria-label`, and each day
carries its date and outcome in its `title`.

**The control at a row's end** (polished after review):

- At every width, each row ends in its setting as one quiet word ("Pause ›", "Mixed ›"; `.ckx-mode`, 24 px tall from
  761 px, 32 px on a phone).
- The word, or the row's name, opens the row (`ckrow`). There sits the row's own Pause · Warn · Note · Off (`seg4`, with
  Larkspur's pick dot; `kindmode`, `limitmode` or `myrule-mode`), pill-sized from 761 px and at the kit's 44 px on a
  phone, above the row's sentence.
- Blanks keeps "On the files ›" at its end (its gaps are set one by one there).

**The row's sentence** (`.ckx-more`, behind its name) holds what each row used to show at once:

- its question;
- its files (and links);
- its days in words;
- "Mixed …";
- a file set apart, with Larkspur's reason;
- Learned's "Its Pause is at ¼";
- Links' "Warn when";
- Rows' ±5% limit with "4 days of 56 would pause";
- the Blanks list, the Limits list, your rule's text.

**`rulesView()` builds the row data:** `rows` 1209–1225, `gaps` 1226, `limits` 1229, `yours` 1231. Each row carries
its name, sub-label, setting word, live days, control and sentence. Its counting logic for modes, mixed and set apart is
the old code's.

## Removed

- **The note** "On the map, each file counts its checks the same four ways; a dashed file isn't added yet." The map's
  own key says it (line 1240).
- **Each row's mode mark** (⏸ ◆ ○ –), its question, its file count, "Mixed …" and its sentence of days, on screen. Each
  went into the row's sentence; the mark said again what the control says.
- **The separate 56-day strip** and its three-swatch legend: the grid's day row is that strip, under the same axis as
  every row.
- **The seg4 qualifiers under controls** (Learned's "at ¼…", Links' "Warn when"). They moved into the row's sentence,
  so a row is one line.

## Kept as they were

- "How the checks work ›" and "Each file's checks, to change one" (the files × checks matrix and its cell bar).
- The lead line.
- The footer.

**For the integrator:**

- `pausedStrip`, `gapsRow` and `myRulesRow` are no longer called. They are left in place to keep the patch small and
  can be removed at the merge.
- The walkthrough's selectors are kept: `#buildpanel .pdx` (step 27's ring) is the grid, and
  `#buildpanel .ck-kinds li.mine` (step 28) is your rule's row. The scripts run unchanged.
