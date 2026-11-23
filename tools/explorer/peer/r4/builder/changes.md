# Changes: Ctrl K with fresh eyes (round 4, builder)

Everything is in `app/explore.js` (marked `// peer:builder r4`) and one CSS block at the end of `app/index.html`'s
`<style>` (`/* peer:builder start */ … end */`, after round 3's). `work/apply.py` makes the whole change on a fresh copy
of `S/explore/`: `sh peer/tools/copyapp.sh DIR && python3 work/apply.py DIR`. Its pieces are in `work/js/` and
`work/builder.css`.

| # | What failed (`fresh-eyes.md`) | Change | Where |
|---|---|---|---|
| 1 | The palette opened on the paused day: "Decide on **Wed Mar 27**…" and "11 outputs wait" (tests 7, 1) | "Decide what readers see **today**…", its line "Access reviews arrived empty · ⧗11", the banner's count. | `commandsNow` |
| 2 | Two rows for one fact; steps of deciding offered before anything is asked (test 4) | "See what's built from it", "Draft a request for the file…" and "See Tue Mar 26's rows" are `quiet`: still found when typed, still buttons on "Why is today paused?", no longer listed up front. Opened, the palette is one thing to do, four questions and help: 177 → 75 words. | `commandsNow` |
| 3 | The Decide row's preview spelled out the checks and all four choices; its picture named today "Wed 27" (tests 6, 7, 5) | The picture, today named **Today** (design's `smDay`, as the owner's Decide does), and one line: "**Access reviews** arrived empty ⧗11 ›". The checks and the choices are Decide's, one tap on. | `previewDecide` |
| 4 | A row's second line couldn't carry a mark | `subHtml` beside `sub`, so the line can say ⧗11 as an icon. | the list's row markup |
| 5 | "The last good day, while **Wednesday** is paused"; "Undo: pause **Wed Mar 27** again"; "Replace **Wednesday's** file…" (test 7) | "while today is paused", "Undo: pause today again", "Replace today's file…", through `todayWord`/`isToday`. | `commandsNow`, `previewRows` |
| 6 | Typed, "Do" came twice, split by "Help" (test 4) | One heading per group, the best group first, scores kept within it. | `draw` (typed results) |
| 7 | "mfa" listed MFA's five columns as results, each "Column of MFA · …" (test 6) | A file found by its name keeps its columns one Tab away, as its look inside folds them. A column whose own name or meaning matches is still found. "mfa": 132 → 54 words. | `draw`; columns carry `ds` |
| 8 | "m" led with "See Tue Mar 26's rows", matched through "Mar" (test 3) | A letter or two is a name being typed, so names come first: "m" and "mf" lead with MFA and its preview. From three letters, the order is as it was. | `draw` |
| 9 | "what is mfa": a cut-off sentence, no picture (test 5) | The look inside's picture answers it: ✓ Fine today, the two bars, what it is (dq, r3, `nowOf`). The full answer adds "2,329 rows today · 5 columns · joins CMDB, Control catalogue · used by 11 outputs". | `datasetNow` |
| 10 | "what feeds coverage": "That isn't something this page can answer yet" (tests 3, 5) | An output named in a question is answered from the files that build it: the fan the other way round (Applications ⏸1 of 14, Units 1, People 1, Platforms 1, Controls 1, into ⧗ Coverage), then "⧗ Waits today on **Access reviews**". The full answer lists the files by kind, with Decide. "what is coverage" draws the same picture with its line, "What applies against the evidence". | `outputIn`, `feedsNow`, `picFeeds`, `answerFor` |
| 11 | "how has tls been this month": "warned Mon 18" printed over "decided Thu 21" (tests 3, 5) | Two odd days closer than four tenths of the month take a line each. | `picMonth`; CSS `.apnotes.two` |
| 12 | An ask's preview repeated the question beside the row that says it (test 4, the nit) | The preview starts with the picture; the heading stays only where no answer is drawn. | `previewAsk` |

## CSS (one block)

- `.apnotes.two`: the second line of day labels.
- `.ap.apfan.apfeed`: the fan mirrored, its files on the left and the output on the right.
- dq's chip, state row and sentence (`.pvs`, `.dqstate`, `.dqwhat`), styled in a full answer (`.pa`) and a phone's
  answer card (`.pcb`) as they are in the preview. The sentence is clamped to two lines in the card and whole in a full
  answer.

Sizes from the scale, colours from the role tokens; nothing new.

## Scripts

- `scripts/v5_ctrlk_phone.cjs`, new: 5-today's Ctrl K steps (04 to 07) at 390x844 with the desktop walkthrough's keys,
  plus "what feeds coverage". Condition waits only.
- `work/ask.cjs`: every Ctrl K state captured as it is, before and after (`work/before/`, `work/after/`). It waits for
  the palette and for running animations, not for a set time.
- The six walkthroughs in `S/scripts/` run unchanged.

## Polish (design)

| Change | Where |
|---|---|
| The count pill is the map's: an hourglass and `.kwn`, no chevron | `waitChip` |
| `.palette .apw` and `.palette .dqwait` take design's shared pill values exactly | the CSS block |
| The row's count reads "⧗ 11", with its space | `commandsNow` |
