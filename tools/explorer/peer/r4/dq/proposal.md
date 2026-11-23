# Setup's Checks step as one checks × days grid

- **Screen:** setup's Checks step, the walkthrough's 1-setup steps 27 and 28. The step opens at 27 and shows at 28,
  scrolled to "Your rule".
- **Focus:** "Which checks would have stopped which days, at a glance."
- **Owner:** dq.

All paths are under S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.

![before and after](png/1-setup-28-before-after.png)

## Fresh eyes first: the merged screen as it was

The screen is `peer/snap5/1-setup/28.png`, at 446 visible words.

### Five seconds

**First thing I notice:** a long stack of rows, each with a large Pause · Warn · Note · Off control, a question and a
sentence of dates. At step 28 the panel is scrolled to Links, Blanks, Limits and Your rule.

**What I'd do:** press "Use these checks".

**Matches the focus?** No. Which checks would have stopped which days can't be read at a glance:

- each row has its own thin strip, with no date axis;
- the only axis is in the summary box, scrolled away;
- the days are in sentences.

### The seven tests

| # | test | before |
|---|---|---|
| 1 | Counts are icons | **fail**: "22 files · Feb 1 to Mar 27: never triggered", "Mixed 19 pause, 1 warn", "7 files warn, 1 file note quietly", "8 files, 13 links (each evidence file's app_id is checked by Scope instead)", "4 days of 56 would pause" |
| 2 | A link is two to four words | pass: the panel has no relation links |
| 3 | One focus | **fail**: eleven rows at one volume, each with a full-size control; the summary is scrolled out of view |
| 4 | Every block answers "why is this here?" | **fail**: "On the map, each file counts its checks the same four ways; a dashed file isn't added yet" repeats the map's own key; each row's mode mark repeats its control |
| 5 | Pictures before words | **fail**: each row leads with a name, a question and a sentence; its 56-day strip comes after, small and unaligned |
| 6 | Detail on demand | **fail**: every row's dates, set-apart reasons and limits list are on screen at once |
| 7 | Today is today | pass: no day is played during setup, so no day is today; the replay's days are data in the past |

## What changed (subtract first)

### One grid

- **Rows are checks, columns are days,** with one shared axis: Feb 1, Mar 1 and Mar 27, each placed over its own day.
- **The rows share their columns** (CSS subgrid), so every day sits under its date in every row.

### Marks

| mark | meaning |
|---|---|
| tall crimson bar | a day the check would have stopped |
| half-height amber bar | a day it would have warned |
| hairline | a day it let through |

Shape and colour both carry the meaning, never colour alone. A key of one line sits beside the headline.

### The day, on top

- **"The day"** is the union of the rows below. It also counts the one day only an output's own rule paused (Feb 16),
  said on hover as "an output's own rule, set in the next step".
- **The headline** is its count: **8 of 56 days paused**.

### The control at each row's end

- **On a desktop:** Pause · Warn · Note · Off, pill-sized as the gaps' controls are, with Larkspur's pick dot.
- **On a phone, or a tablet upright** (a panel under 470 px): the row's setting as a word ("Pause ›", "Mixed ›"). The word
  opens the row, where the same control sits at the kit's 44 px, so every row stays one line and the grid fits one
  screen.
- **Blanks** says "On the files ›", where its gaps are set one by one.

### The sentences, behind a tap

A tap on a row's name opens its sentence. It holds, where they apply:

- the question;
- its files;
- its days in words;
- "Mixed: 19 pause, 1 warn";
- the file set apart, with Larkspur's reason;
- Learned's "pause at ¼";
- Links' "Warn when";
- Rows' ±5% limit, with "4 days of 56 would pause".

The eight paused days with their plain reasons are behind "Why each paused day paused ›". "How the checks work" and the
per-file matrix stay behind their own folds.

### Gone

- The note about the map's counts.
- Each row's mode mark.
- The separate strip and its three-swatch legend, since the day row is that strip under the same axis.

### Truer than before

**A row's marks follow its control.**

- Before, the strips came from the record whatever the control said, so a check set to Off still showed its pause days.
- Now each finding of the record counts by its own file's mode for that check. Under Larkspur's settings that is exactly
  `recordOfChecks()`, finding for finding (`work/rec-check.cjs`).
- Changing a control redraws its row: Learned set to Warn turns its 3 pauses amber, and the headline goes from 8 to 5 of
  56 (`png/learned-set-to-warn-1440.png`).

**A day counts once, as its stronger outcome.** The old Learned sentence listed Mar 11 as both paused and warned.

## The seven tests, after

| # | test | after |
|---|---|---|
| 1 | Counts are icons | **pass**: the per-row counts and sentences are gone from the grid. The one number left is the headline, "8 of 56 days paused", drawn below it as eight crimson bars. |
| 2 | A link is two to four words | **pass**: no relation links in the panel. The map's labels are "approves exceptions to", "works in", "checks", "owns", "runs on". |
| 3 | One focus | **pass**: the grid, with the day row's crimson bars at its head and each check's marks under the same dates; "Use these checks ›" is the one filled button. |
| 4 | Every block answers "why is this here?" | **pass**: see the purpose audit. The note on the map's counts and the mode marks went. |
| 5 | Pictures before words | **pass**: the grid is the picture; the words are row names, the controls and one line of lead. |
| 6 | Detail on demand | **pass**: first what it checks, the state (8 of 56 days paused) and the marks. Every row's sentence, the paused days' reasons, the method and the per-file matrix are behind a tap. The grid is this screen's one picture, as the focus asks. |
| 7 | Today is today | **pass**: no day is played during setup. The axis labels go through `smDay.text`, so a played day that is today reads "Today". |

## Before and after

| | before | after |
|---|---|---|
| desktop 1440×900 | `peer/snap5/1-setup/28.png` | `peer/r4/dq/snap/1-setup/28.png` (also `png/1-setup-28-after.png`) |
| phone 390×844 | `png/1-setup-28-before-phone.png` | `png/1-setup-28-after-phone.png` |
| tablet | | `png/1-setup-28-after-820x1180.png`, `png/1-setup-28-after-1180x820.png` |
| dark | | `png/1-setup-28-after-1440x900-dark.png`, `png/1-setup-28-after-390x844-dark.png` |
| a row opened | | `png/rows-opened-1440.png`, `png/rows-opened-390.png` |
| a control changed | | `png/learned-set-to-warn-1440.png` |
| side by side | `png/1-setup-28-before-after.png` | |

**Visible words** (render.cjs):

| | before | after |
|---|---|---|
| 1-setup/28, 1440×900 | 446 | **276** |
| the panel's text, all of it | 606 | 134 |
| phone, 390×844 | 204 | 83 |

- **The map beside the panel:** 142 of the 276 are the map, with its file names, kinds and each file's check counts. It
  is unchanged.
- **Elsewhere:** no other step of any walkthrough moved (see Works).
- **Sideways scroll:** none at any size.

## Five-second test (mine, cold, on the after screenshot)

**First thing I notice:** "8 of 56 days paused", and the day row's crimson bars. Under them, on the same days, crimson
bars in Rows (Feb 26, Mar 21, 23, 27), Scope (Feb 26, Mar 23, 27), Key (Mar 21) and Learned (Mar 5, 6, 11), and short
amber marks for Values, Learned and Links.

**What I'd do:** see that the empty-file days are Rows' and Scope's and the value-mix days are Learned's, keep the
settings, and press "Use these checks ›".

**Matches the focus?** Yes.

## Purpose audit (every block on the screen)

| block | why it is here, in the user's terms |
|---|---|
| Build Larkspur from its files · Start again · the five steps | Where I am in setup, and the way to any step |
| "Every file is checked before anything is built from it." · as Larkspur set them · Larkspur's pick | What this step is; that the settings are Larkspur's; what the dot in a control means |
| **8 of 56 days paused** | The answer in one number |
| ▮ paused · ▬ warned | How to read the marks |
| Feb 1 · Mar 1 · Mar 27 | When each day is: one axis for every row |
| The day | Which days would have paused or warned at all |
| A row a check: name, 56 days, control | Which check would have stopped which days, and what it is set to; the name opens its sentence |
| "mixed" or "pauses at ¼" under a name | A row whose files differ, or whose Pause is at ¼, said where it matters |
| Blanks · On the files › | Its gaps are set one by one on the files; the link goes there |
| Why each paused day paused › | The eight days' plain reasons and the file behind each, on demand |
| How the checks work › | The method, on demand |
| Each file's checks, to change one › | A single file's settings, on demand |
| ‹ Back · **Use these checks ›** | Go back, or take these checks: the one filled button |

**Folded or gone, with where each went:**

| block | where it went |
|---|---|
| Each row's question, files, "Mixed", set-apart reason, sentence of days, Rows' limit | behind the row's name |
| Each row's mode mark | gone: the control says it |
| The 8 paused days' list | behind "Why each paused day paused ›" |
| The separate strip, its axis and three-swatch legend | gone: the day row, under the shared axis |
| The note on the map's counts | gone: the map's own key says it |

## Every number, true to build.json

Every row's days (`aria-label`) on the walkthrough's state, against the merged screen's sentences:

| row | days |
|---|---|
| Columns | never |
| Fresh | never |
| Rows | paused Feb 26, Mar 21, Mar 23 and Mar 27 |
| Key | paused Mar 21 |
| Scope | paused Feb 26, Mar 23 and Mar 27 |
| Values | warned Feb 20 |
| Learned | paused Mar 5, 6 and 11; warned Feb 6, 12, Mar 10, 17, 18 and 19 |
| Links | warned Feb 16 and 24 |
| Blanks | never |
| Limits | never |
| Your rule | never broke |
| The day | 8 paused |

- **All of them are the same** as before, except Mar 11 (above).
- **Limits' "never triggered"** holds for the WAF band: its failing share peaks at 4% over the 56 days, under both 10%
  and 15%.
- **The live rule** equals the record under Larkspur's settings, finding for finding, and every finding is on a check
  that applies to its file (`work/rec-check.cjs`).

## Works

**All six walkthroughs ran on `peer/r4/dq/app/` in snapshot mode, unchanged**, each with its seed. Each ends with "no
page errors". Logs are in `peer/r4/dq/logs/`, snapshots in `peer/r4/dq/snap/`.

| walkthrough | seed |
|---|---|
| `scripts/v1_setup.cjs` | none |
| `v2_fix.cjs` | `video/seed-feb26.json` |
| `v4a_odd.cjs` | `video/seed-mar2-rows2.json` |
| `v4b_outlier.cjs` | `video/seed-mar21.json` |
| `v3_explore.cjs` | none |
| `v5_today.cjs` | none |

- **Selectors kept:** step 27 rings `#buildpanel .pdx`, which is the grid. Step 28 scrolls to `.ck-kinds li.mine`, which
  is your rule's row; the whole grid now fits the viewport.
- **Nothing else moved:** of 92 steps, 91 keep the visible words of `peer/words-r38.txt`. Only 1-setup/28 changed,
  446 → 276 (`work/words-after.txt`).
- **Live checks** (`tools/checks.cjs`, from a seed, desktop and phone, no fixed sleeps): a row's sentence opens and
  closes; Learned set to Warn gives 5 of 56, and back to Pause gives 8; on a phone the setting's word opens the row and
  its control. No page errors.

## Files

| what | path |
|---|---|
| The app | `peer/r4/dq/app/` |
| The patch | `peer/r4/dq/patch.diff` (+125 −21, `build.js` and the page's CSS) |
| Each change and where | `peer/r4/dq/changes.md` |
| The record check | `peer/r4/dq/work/rec-check.cjs` |
| The probes | `peer/r4/dq/tools/checks.cjs`, `sizes.cjs` |

## Polish (after review: builder and newcomer agreed, and both asked for this)

**What I took: on a desktop too, each row ends in its setting as one quiet word** ("Pause ›", "Mixed ›", "Warn ›"),
as on a phone, so the day marks outweigh the controls.

- **A tap on the word opens the row.** So does a tap on its name.
- **The open row holds its four-way control** (pill-sized from 761 px, the kit's 44 px on a phone) and its sentence.
- **The 44 buttons that sat at the row ends are gone from the first view**, and the days column is wider for it.
- **The word is 24 px tall where there's a pointer, 32 px on a phone.** That keeps the grid as compact as before: step 28
  shows the panel from its top.

**Result:**

| | before | after the polish |
|---|---|---|
| 1-setup/28, 1440×900 | 446 words | **246** (276 before the polish) |
| the panel's own text | | 104 |
| phone, 390×844 | | 83 |

Nothing scrolls sideways.

| | path |
|---|---|
| after, desktop | `png/1-setup-28-after.png` |
| after, phone | `png/1-setup-28-after-phone.png` |
| side by side | `png/1-setup-28-before-after.png` |
| a row opened | `png/rows-opened-1440.png` |
| Learned set to Warn | `png/learned-set-to-warn-1440.png` (5 of 56) |

**Works:**

- **`v1_setup`** re-run in snapshot mode: no page errors. Only 1-setup/28 moved (446 → 246); the other 27 steps keep
  `peer/words-r38.txt`'s words.
- **`tools/checks.cjs` on the live app:** the word opens the row and its control. Learned to Warn gives 5 of 56, back to
  Pause 8. No page errors.
- **The other five walkthroughs** were run on the grid before the polish with no page errors. The polish changes only
  the Checks step's row markup and CSS, which they never open.

**Patch:** `patch.diff`, +122 −21.
