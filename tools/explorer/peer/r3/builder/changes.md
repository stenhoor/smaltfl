# Changes: the file's view (5-today 09 and 10)

Everything is in `app/explore.js` (marked `// peer:builder`) and one CSS block at the end of `app/index.html`'s `<style>`
(`/* peer:builder start */ … end */`). `work/apply.py` makes the whole change on a fresh copy
(`sh peer/tools/copyapp.sh DIR && python3 work/apply.py DIR`); its pieces are in `work/js/` and `work/builder.css`.

## explore.js

| # | Change | Where |
|---|---|---|
| 1 | **No kind tile above the file.** The trail already names the kind; the tile's ⧗ badge, mosaic and "1 paused" said again what the card and the count say. The file's link to its register now says what one row is. | `layoutDataset` (rewritten) |
| 2 | **The card: what it is, its state, one number, its buttons.** Name with the state chip on the same line (on its own line under the name where the two don't fit, as "Kept Tue Mar 26 · file owed" on a phone); the first clause of the description ("Quarterly access reviews for applications with confidential or regulated data", one line on desktop); "**0** rows today · usually about 1,435"; See Tue Mar 26's rows and Decide. Heights computed, the buttons' rows packed as the browser wraps them, so the layout never guesses (`headH`, `descLines`, `actsRows`, `chipLow`, `fileActs`). | `paint` → `focus`; helpers before `layoutDataset` |
| 3 | **Columns one tap away.** "6 columns ›" along the card's foot (`[data-cols]`); open, the list as before (the first row where there is one), with "· tap one for its values" on the fold when there is no first row. Kept open from file to file (`S.colsOpen`). | `paint` → `focus`; `wire` |
| 4 | **A link says what it means.** Each link is a card: two to four words on top ("one row per application", "about a control", "owned by", "evidence for"), then the file or control it reaches with its kind's icon, then its number ("100% match", muted day where the match is not today's: "· Tue Mar 26"). The whole sentence is the card's hover and aria-label: "Each row is one application in CMDB, matched on app_id: 1,438 of 1,438 rows on Tue Mar 26. Only applications holding card data, personal data or confidential data, live or retiring." No words on the lines. | `linkOf`, `evidenceOf`, `linkHtml`, `paint` → `nb` |
| 5 | **The control by its name.** "evidence for · Quarterly access review" with the shield, not "Control catalogue / the control: …". | `evidenceOf` |
| 6 | **What uses it: one count, its meaning said once, the list a tap away.** Collapsed: "⧗ **11** outputs wait on it ›" and "If this file is wrong, these show wrong numbers". Tapped (`[data-outs]`, `S.outsOpen`): "Readers see Tue Mar 26 until you decide", then the outputs by name in their groups, each one's line on hover. Other days: "Used by **11** outputs · ⧗ 10 held today by Access reviews" (a file held by another's pause), "½ 11 outputs stay on Tue Mar 26", "✓ 11 outputs published · as it arrived", "✓ 11 outputs rebuilt". | `outsSaid`, `outsBox`, `paint` → `o`, `wire` |
| 7 | **Two relations to one file are one card** ("led by · acted for by · People"), where the old view kept the last and lost the other. | `linkOf`, `layoutDataset` |
| 8 | **A file's rows that point to its own rows** get their card ("reports into · another unit · 100% match"), which the dropped kind tile used to carry for Org units and People. | `selfOf`, `paint` → `sf`, `parentOf` |
| 9 | **The files that point to it**, in three words: "16 datasets point to it", names under it and on hover. | `paint` → `in` |
| 10 | **The hub a little above the middle**: the card and the control under it, centred as one group. | `layoutDataset` |
| 11 | **Phone**: the card, then what uses it, then the links, each card carrying its own words (no lines on a phone). | `stackDataset` (rewritten) |
| 12 | **No key of marks and no column hint on the file's view.** Every mark there comes with its word ("Paused today", "⧗ 11 outputs wait on it"); the hint is on the fold. | `renderChrome` |
| 13 | The list closes when another file opens, and **Esc closes it first**. | `go`, the Esc handlers |
| 14 | A node repaints when what it says changes, and a dataset node keeps no hover text from another level. | `paint` (signature, `title`) |

Left as they were: `outsH` and `heldElsewhere` (newcomer's round-2 helpers, now unused) stay, so the merge with
newcomer's lines stays mechanical.

## index.html

One block, `/* peer:builder start */ … end */`, before `</style>`: the card's header as a column of fixed rows, the fold
row, the link card, the outputs count and list. Sizes only from the scale (11, 12, 13, 15 px), weights 400, 500 and 600,
colours only from the role tokens (it renders in the dark scheme unchanged). Smalt only on the one action, the chevrons
that open something and focus rings.

## Scripts

- `scripts/v3_explore.cjs`, a copy with the same ten steps: one tap on "8 columns ›" after TLS opens (step 4), since its
  step 6 taps a column; it then waits for the column and for the canvas to stop moving (`#links.off` gone), not a set
  time. Its step-5 caption is corrected to the data: "Used by 11 outputs; 10 are held today, by Access
  reviews, not by TLS." The old screen said "10 outputs use it", counting only the held ones; TLS has 11 (TLS checked
  is not held).
- `scripts/v5_today_phone.cjs`, new: 5-today's steps 08 to 10 at 390x844 with the same taps, and the list tapped open;
  every step waits on a condition, none on a set time.
- `work/decided.cjs` and `work/decided-phone.cjs`: decide Keep on the file's view, read the card and the count, Undo.
- `S/scripts/v5_today.cjs` and the four build-mode walkthroughs run unchanged.

The CSS block at the end is this round's; the `peer:builder` block above the newcomer's is round 2's, already merged
into the live prototype, and is untouched.

## Revision 1

| Change | Where |
|---|---|
| A paused file's count: "⧗ 11 waiting ›" (the banner's words), then "Readers see Tue Mar 26 until you decide"; no "If this file is wrong…" on a paused file, open or closed. | `outsSaid` |
| The card's sentence is dq's look-inside sentence: `whatOf` returns `descOf(d)`. | `whatOf` |
| `descOf` cuts a label only where a colon and a space end it: dq's line, character for character, so the two patches merge cleanly. | `descOf` |
| "one per in-scope application" where the rows entry has a scope; "one row per application" where it has none. | `linkOf` |

