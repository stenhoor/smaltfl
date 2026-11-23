# The file's view: this file, its state, and what depends on it

> **Revised (revision 1, at the end).** Where the text below differs from that section, the revision wins: the count on a
> paused file now reads "⧗ 11 waiting ›" and "Readers see Tue Mar 26 until you decide", and the card says what the file
> is in dq's words.

**Screen:** the file's view, 5-today steps 09 and 10 (Access reviews, opened on the map on the paused day).
**Focus sentence:** "This file, its state, and what depends on it, said simply."
**Owner's words:** "I am confused by the links they don't appear to give much except for the application one but I don't
understand the impact or point of that immediately. the built from it section is also super busy and unclear to me the
point or value of it."

All paths below are in `S/peer/r3/builder/` unless they start with `S/`
(S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`).

## Before and after

| | before | after |
|---|---|---|
| 5-today 09 (desktop) | `S/peer/snap4/5-today/09.png` | `snap/5-today/09.png` (rendered: `shots/5-today-09-after.png`) |
| 5-today 10 (desktop) | `S/peer/snap4/5-today/10.png` | `snap/5-today/10.png` (rendered: `shots/5-today-10-after.png`) |
| visible words, 09 and 10 | **343** | **88** |
| phone, 390x844 | `work/before/d-access-reviews-390x844.png` | `shots/5-today-phone-02.png` (67 words); list tapped open `shots/5-today-phone-04-open.png` (93) |
| tapped open, desktop | | columns `shots/open-columns-1440.png`; outputs `shots/open-list-1440.png` |
| other sizes | `work/before/d-access-reviews-820x1180.png` | `shots/tablet-820x1180.png`, `shots/tablet-1180x820.png`, `shots/dark-1440.png` |
| the same code on other files | `work/before/d-tls-1440x900.png` | `shots/tls-1440.png`, `shots/other-files.png` (Org units, People, Control catalogue, CMDB, Exceptions) |
| after a decision (Keep), then Undo | | `shots/decided-keep-1440.png`, `shots/decided-keep-390.png` (checked by `work/decided.cjs`, no page errors) |

Nothing scrolls sideways at any size (render.cjs and the phone walkthrough both check). Rendering the desktop snapshot
itself at 390 (`shots/5-today-09-after-desktop-snap-at-390.png`) shows only that it doesn't scroll sideways: a static
snapshot keeps the desktop positions, so the phone layout comes from `scripts/v5_today_phone.cjs`, the same taps on a
390x844 page.

## What changed, in one breath

The kind tile and the busy list are gone. The card says what the file is, that it is paused today, and one number
(**0** rows today · usually about 1,435), with See Tue Mar 26's rows and Decide. Three things hang off it, each in a few
words with its number, the whole sentence on hover:

- left: **one row per application** · CMDB · 100% match · Tue Mar 26 (the application tile's link and the CMDB join were
  the same fact told twice; now one card, the join's columns and counts and the scope on hover);
- below: **evidence for** · 🛡 Quarterly access review (the control by its name, not "Control catalogue");
- right, at the end of the red arrow: **⧗ 11 outputs wait on it ›** · "If this file is wrong, these show wrong numbers".
  Tapped: "Readers see Tue Mar 26 until you decide" and the outputs by name in their groups.

The columns are one tap away ("6 columns ›"). No legend and no hint in the bar: every mark on this screen carries its
word.

## The seven tests

| # | test | result | how |
|---|---|---|---|
| 1 | Counts are icons | **pass** | What depends on it is ⧗ 11, the number set larger; the list behind a tap, the sentence on hover. The eleven "waits" lines are gone. |
| 2 | A link is two to four words | **pass** | "one row per application", "evidence for", "outputs wait on it" ("Used by" on a file that isn't paused). The sentence ("Each row is one application in CMDB, matched on app_id: 1,438 of 1,438 rows on Tue Mar 26. Only applications holding card data, personal data or confidential data, live or retiring.") is the hover and the aria-label. No words on the lines. |
| 3 | One focus | **pass** | The red-outlined card, "Paused today", **0** rows, and the one filled button, Decide; the red arrow from it ends at ⧗ 11. |
| 4 | Every block answers "why is this here?" | **pass** | See the audit below. The kind tile (said twice), the key of marks (every mark has its word), the column hint (on the fold now) and the list of 11 are gone or folded. |
| 5 | Pictures before words | **pass** | The map is the picture: the file in the middle, what one row is on the left, what it proves below, what uses it on the right, the red arrow where the pause reaches. Every block is one line of text on desktop; on a phone the description takes two. |
| 6 | Detail on demand | **pass** | First what it is, its state and one number. Columns behind "6 columns ›", the outputs behind ⧗ 11, a join's columns, counts and scope on hover, the target one tap. No chart. |
| 7 | Today is today | **pass** | "Paused today", "0 rows today". The current day's date is not on this screen, and nothing new hardcodes it: the match's day comes from the data through `DC()`, so design's Today helper can word it. |

**7/7 pass.**

## Five-second test (mine, on `shots/5-today-09-after.png`)

First I notice the red-outlined card in the middle: Access reviews, Paused today, 0 rows today, and the blue Decide.
Then the red arrow to its right ending at "⧗ 11 outputs wait on it". I'd tap Decide, or tap the 11 to see which.
That is the focus sentence: the file, its state, what depends on it.

## Purpose audit (every block on the screen)

| block | why it is here, in the user's terms |
|---|---|
| Top bar (smaltfl, estate, views, Search Ctrl K) | Where I am in the product; find or ask anything. The same on every screen. |
| Trail: Data model › Application › Access reviews | Which file this is and the way back up (it names the kind, so the kind tile could go). |
| Esc steps back | The keyboard way back. |
| Estate mini-map | Where this file's kind sits; tap a kind to go there. (Shared chrome, left as it was.) |
| + Add a dataset | Add a file: the same action on every map view. |
| The card: name and kind icon | Which file. |
| "Paused today" | Its state today. |
| "Quarterly access reviews for applications with confidential or regulated data" | What the file holds, in plain words. |
| "**0** rows today · usually about 1,435" | The one number, against usual: why it paused. |
| See Tue Mar 26's rows | What readers still see; check it before deciding. |
| Decide › | The one thing to do. |
| 6 columns › | What is in it, when I want to dive in. |
| one row per application · CMDB · 100% match · Tue Mar 26 | What one row is, and that every row is a known application (on its last file). Hover: the join and the scope. |
| evidence for · Quarterly access review | Which control this file proves. Hover: what that means. |
| ⧗ 11 outputs wait on it › / If this file is wrong, these show wrong numbers | What depends on it and why that matters; tap for which. |
| The lines | What hangs off what; the red arrow is where today's pause reaches. |

Gone: the Application tile with its mosaic, ⧗ 5 and "1 paused" (the trail names the kind; the card and the count say
the rest); the key of marks; "Click a column for its values" in the bar; the 11 outputs with a description and "waits"
on every line; "joined on app_id", "is evidence for", "built from it" and the 13-word scope line on the lines.

## Kept true

Every number is the prototype's: 0 rows, usually about 1,435 (`rowsUsual`), 1,438 of 1,438 matched on Tue Mar 26
(`joins[].match`, today's file being empty), the 11 outputs and their groups (`builds`, `outputs`), the control's name
(`controlName`). The match's day is said because today's file has no rows to match. On TLS and MFA the count reads
"Used by 11 outputs · ⧗ 10 held today by Access reviews", the brief's own example; the old screen's "10 outputs use it"
counted only the held ones.

## Proof

- `5-today` (`S/scripts/v5_today.cjs`, unchanged): 12 steps, no page errors.
- `3-explore` (`scripts/v3_explore.cjs`, my copy, same ten steps): one tap opens TLS's columns before its step 6 taps one
  (then it waits for the column and for the canvas to settle, no fixed wait); its step-5 caption now says 11 outputs,
  10 held. Steps 05 and 06, with the columns open on purpose, go from 217 to 161 visible words
  (`shots/3-explore-05-after.png`). No page errors.
- `1-setup`, `2-problem-fix`, `4a-odd-but-ok`, `4b-outlier` (unchanged, their seeds from `S/video/`): same step counts,
  no page errors. They live in the Build panel and never open a file's view.
- `scripts/v5_today_phone.cjs`: steps 08 to 10 at 390x844, no sideways scroll, no page errors.

## Deliberately not changed

The Decide panel (owner's), the Today label (design's), Ctrl K (newcomer's and dq's), the bar's chrome, and the
newcomer's first-row view inside the open columns.

## Revision 1: took / declined

dq disagreed on one line and design agreed with three notes. This is what changed, re-run and re-rendered on the same
copy.

### Took

1. **On a paused file, the count says what readers see** (dq's condition, design's wording). The count is
   "⧗ **11** waiting ›", worded as design's banner is, with "Readers see Tue Mar 26 until you decide" under it. "If this
   file is wrong, these show wrong numbers" is gone from a paused file, and opened, the list no longer prints both lines.
   The outputs are held, not wrong. The line stays where it is true:
   - a file that isn't paused: Requirements reads "Used by 1 output · If this file is wrong, these show wrong numbers";
   - a file held by another's pause: TLS and MFA keep "Used by 11 outputs · ⧗ 10 held today by Access reviews", its line
     a tap away.
2. **One "what is this" per file, dq's.** The card's sentence is the look-inside preview's: `descOf`, with dq's own
   one-character fix (`\s*` → `\s+`, the same line, so the two merge cleanly). Access reviews reads "The last review, the
   next due date, the reviewers and the access revoked", and MFA "The identity provider, the share of users registered
   and whether MFA is enforced. Registered is not enforced". Requirements reads whole now, no longer cut at
   "ISO/IEC 27001:". The full description, with its "Quarterly access reviews for applications with confidential or
   regulated data:", is the hover.
3. **The scope in the link's words** (dq's smaller point). Where the rows entry has a scope, the link reads "one per
   in-scope application", four words, so "100% match" beside it no longer reads as every application covered. The scope
   itself is in the hover.

### Declined

- **The shared tooltip** (design: `data-tip`, `TIPS`, `#smtip`, so the sentences show on focus and tap too). That helper
  is in design's copy, not this one. It belongs to the merge: my sentences are in each card's `title` and `aria-label`,
  ready to move.
- **"Tue Mar 26" into the hover** (design). Today's file is empty, so a bare "100% match" would read as today's. The day
  stays, muted, beside the number; dq read it as "data in the past", as meant.

### After

| | before | r0 | r1 |
|---|---|---|---|
| 5-today 09 and 10, words | 343 | 88 | **87** (`shots/5-today-09-after.png`) |
| phone, step 09 | – | 67 | **66** (`shots/5-today-phone-02.png`) |
| 3-explore 05 and 06 (columns open) | 217 | 161 | **181**: TLS's sentence is dq's longer one, clamped to two lines |

- **Re-run:** `S/scripts/v5_today.cjs` (12 steps), `scripts/v3_explore.cjs` (10 steps) and `scripts/v5_today_phone.cjs`
  (4 steps). No page errors; nothing scrolls sideways.
- **Re-checked with no page errors:** the kept state and Undo (`work/decided.cjs`, `decided-phone.cjs`); every shot in
  `shots/` was rendered again from this copy.
- **Patch:** `patch.diff`, 179 lines added and 55 removed.

