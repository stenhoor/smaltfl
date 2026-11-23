# Ctrl K, with fresh eyes: one thing to do, every answer drawn, names found first

**Screens:** Ctrl K's answers, look inside and search results (5-today 04 to 07; 3-explore's Ctrl K step).

**Focus sentences:**

- answers (r3): "The answer, as a picture of today against usual";
- look inside (r3): "What this file is and whether it's fine today";
- search results (the step's caption): "Ctrl K finds any file, column or value": what you typed, found, the best match
  first. Opened empty, it is today's one thing to do, then the questions worth asking.

S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`; paths below are in
`S/peer/r4/builder/` unless they start with `S/`.

## Fresh eyes first

`fresh-eyes.md` was written before anything changed: the five-second test and the seven tests on every Ctrl K state as
merged, and on three questions of my own.

- **Pass:** the answers on 05 and 06 and the look inside on 07, 7/7 each, with one nit (an ask's preview says the
  question again beside the row).
- **Failing:**
  - the palette opened on the paused day;
  - the search results;
  - "what is mfa" (no picture);
  - "what feeds coverage" (no answer at all);
  - "how has tls been this month" (two labels printed over each other).

## Before and after

| state | before | after | palette words |
|---|---|---|---|
| Ctrl K opened (5-today 04) | `work/before/a-empty-1440.png` | `shots/a-empty-1440.png` · pair `shots/a-empty-before-after.png` | **177 → 75** |
| "why is wednesday paused" (05) | `S/peer/snap5/5-today/05.png` | `snap/5-today/05.png` | 33 → 29 |
| the month (06) | `S/peer/snap5/5-today/06.png` | `snap/5-today/06.png` | 58 → 51 |
| look inside MFA (07) | `S/peer/snap5/5-today/07.png` | `snap/5-today/07.png` | 65, unchanged |
| "m" (3-explore) | `work/frames/full-61.png`, `work/before/e-m-1440.png` | `shots/e-m-1440.png` | 231 → 186, MFA first |
| "mfa" (3-explore) | `work/frames/full-63.png`, `work/before/e-mfa-1440.png` | `shots/e-mfa-1440.png` · pair `shots/e-mfa-before-after.png` | **132 → 54** |
| "what feeds coverage" | `work/before/f-feeds-coverage-*.png` (no answer) | `shots/f-feeds-coverage-1440.png`, full `shots/f-feeds-coverage-full-1440.png` | 30 → 36, now an answer |
| "what is mfa" | `work/before/g-what-is-mfa-1440.png` | `shots/g-what-is-mfa-1440.png` · pair | 46 → 50, now a picture |
| "how has tls been this month" | `work/before/h-tls-month-1440.png` | `shots/h-tls-month-1440.png` · pair | 54 → 48, labels readable |
| phone, 390x844 | `work/before/*-390.png`, `work/before/phone-sheet.png` | `shots/phone-01.png` … `phone-05.png`, `shots/phone-sheet.png` | 133, 96, 115, 129, 103 on the whole screen |

Visible words on the walkthrough's whole screen, map included (`render.cjs`):

- 5-today/04: 163 → 163 (its snapshot is the map before Ctrl K);
- 05: 152 → 148;
- 06: 177 → 170;
- 07: 184 → 184.

Nothing scrolls sideways at either size.

## What changed (subtract first; `changes.md` has each change and where)

1. **Opened on a paused day:**
   - one thing to do, "Decide what readers see **today**… · Access reviews arrived empty · ⧗11";
   - four questions, and help;
   - the request, yesterday's rows and "what's built from it" are still found when typed, and are still buttons in the
     why answer; they're no longer listed before anything is asked;
   - the preview is the picture, today named **Today**, and one line; the checks and the choices are Decide's.
2. **Typed:**
   - one heading per group;
   - a file found by its name keeps its columns one Tab away;
   - a letter or two puts names first, so "m" leads with MFA.
3. **"What is X?"** answers with the look inside's picture: ✓ Fine today, two bars, what it is.
4. **"What feeds X?"** for an output answers from the files that build it. The picture is the fan the other way round,
   with "⧗ Waits today on Access reviews" under it.
5. **A month's two odd days close together** take a line each.
6. **An ask's preview** no longer repeats the question beside its row.

## The seven tests, after

| # | test | result | how |
|---|---|---|---|
| 1 | Counts are icons | **pass** | The count is ⧗11 wherever the palette said "11 outputs wait": the Decide row, its preview (⧗ 11 ›), and "See what's built from it" (⧗11 · in 4 kinds). The fan's counts are numbers by kind: ⏸1 of 14. |
| 2 | A link is two to four words | **pass** | No link is drawn; the fan's lines carry no words. |
| 3 | One focus | **pass** | Opened: the one Decide row and its picture. Typed: the best match first, MFA for "m". An answer: its picture. |
| 4 | Every block answers why | **pass** | No two rows for one fact, no steps of deciding before asking, no question said twice, one heading per group. See the audit. |
| 5 | Pictures before words | **pass** | Every answer I tried leads with a picture: today against usual, the month, the fan, the look inside's two bars. Then one line. |
| 6 | Detail on demand | **pass** | The checks and the choices behind Decide; a found file's columns behind Tab; the files feeding an output, by name, behind Full answer. |
| 7 | Today is today | **pass** | "Decide what readers see today…", "Today" on the picture, "while today is paused", "Undo: pause today again". Only the past keeps its date (Tue 26). Nothing new hardcodes the day: it goes through `todayWord` and design's `smDay`. |

**7/7 on every state checked.** The answers (05, 06) and the look inside (07) were already passing and keep their
pictures. The last is untouched.

## Five-second test (mine, on `shots/a-empty-before-after.png`, after)

I see "Decide what readers see today…" picked, beside a picture: Tue 26's file is what readers see, and Today's file
is empty and paused. I'd press ↵, or pick one of the four questions. That is the focus: today's one thing to do, then
the questions worth asking.

On "mfa", MFA is picked with its preview: fine today, about usual. I'd press ↵. On "what feeds coverage", five kinds
of file run into ⧗ Coverage, which waits today on Access reviews. I'd press Full answer or Decide.

## Purpose audit (every block, after)

**Opened (5-today 04):**

| block | why it's here |
|---|---|
| "Search, act or ask" and Esc | Type a name or a question; close |
| Suggested now: "Decide what readers see today… · Access reviews arrived empty · ⧗11" | The one thing today asks of you |
| Ask: why paused, which outputs wait, the month, what it joins | The four questions worth asking today, each answered with a picture |
| Help: keyboard shortcuts, what the marks mean | Learning the tool |
| Preview: the two-day picture, "Access reviews arrived empty ⧗11 ›" | What deciding is about before you press it: what readers see now, and what waits (tap for which) |
| Footer: ↑ ↓ move · ↵ run · Esc close; "Answers come from this page's data" | Driving it from the keyboard; where answers come from |

**An answer (05, 06, my questions):**

| block | why it's here |
|---|---|
| The picked row (the question, Ask ↵) | What ↵ runs |
| The picture | The answer |
| One line | Which file, and what waits or happened |
| Full answer › | The detail and the buttons |

**Look inside (07):** unchanged, dq's audit holds.

**Search ("mfa"):**

| block | why it's here |
|---|---|
| Go to: MFA | The best match |
| Its preview | Whether it's fine today, the number, what it is |
| Ask "mfa" | Ask instead |
| Footer, Tab look inside | Its columns and questions, one key away |

## Proof

| check | result |
|---|---|
| `S/scripts/v5_today.cjs`, `v3_explore.cjs`, `v1_setup.cjs`, `v2_fix.cjs` (seed-feb26), `v4a_odd.cjs` (seed-mar2-rows2), `v4b_outlier.cjs` (seed-mar21), unchanged, against `app/` in snapshot mode (`snap/`, logs in `work/logs/`) | **no page errors**; 12, 10, 28, 19, 12 and 11 steps, as before |
| `scripts/v5_ctrlk_phone.cjs` (390x844) | no page errors, no sideways scroll |
| `work/ask.cjs`, every state before and after, at 1440x900 and 390x844 | no page errors |

**Patch:** `patch.diff` (`sh S/peer/tools/patch.sh app`), 56 lines added and 18 removed.

## Not changed

- The answers' pictures (newcomer's) and the look inside (dq's), which passed.
- The palette's layout.
- The map behind (newcomer's screen this round) and Decide (design's).
- Claude's path.

## Polish (design, after agreement from owner and design)

- **One ⧗ 11 pill in Ctrl K, the map's:**
  - no chevron: `waitChip` now writes the map's markup, an hourglass and `.kwn`;
  - the answer's, the Decide preview's and the look inside's count (`.palette .apw`, `.palette .dqwait`) take design's
    shared values exactly: 22 px, 12 px at 600, an inset `--edge`;
  - so nothing differs once design's rule is merged beside mine.
- **The row reads "⧗ 11"**, with its space.
- See `shots/pill-polish.png`.

`S/scripts/v5_today.cjs` and `v3_explore.cjs` were re-run with no page errors (12 and 10 steps). The patch is now 61
lines added and 19 removed.
