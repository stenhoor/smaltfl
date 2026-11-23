# Changes: Ctrl K answers lead with their picture (peer round 3, newcomer)

All in `S/peer/r3/newcomer/app/`. JS changes are marked `// peer:newcomer` (or `/* peer:newcomer */` inside a long line).
CSS is one block at the end of the page's `<style>`, `/* peer:newcomer r3 start */ … end */`. The patch is
`patch.diff`: 152 lines added and 38 removed, in two files (after the polish).

## explore.js

### New helpers, just above `whyNow()`

| helper | what it does |
|---|---|
| `dayKit`, `isToday`, `todaySaid`, `todayWord` | Say the day on screen as **Today** with the date small. They call design's `window.smDay` (`is`, `html`, `mid`) wherever the page has it. Without it, a stand-in writes the same markup (`<span class="today">Today <small class="tdate">…</small></span>`). The date always comes from `DC()`. A paused day that readers have moved past (`laterSaid()`) keeps its date. |
| `todayBars(d)` | Today against usual, as dq's look-inside draws it (polish): today's rows and a usual day's, two bars on one scale from zero, labelled where they end ("rows today 0", "usual 1,435"). It calls dq's `nowBars` wherever the page has it (after the merge). |
| `nowBarsHere(d)` | A copy of dq's `nowBars`, for this copy of the app: the same markup (`.dqnow`), so the same styles. It can go at the merge. |
| `picMonth(days)` | The month as a strip of days, with today marked at the end. One or two odd days get a label where they sit ("◆ warned Sun 10"). |
| `stripLine(days)` | The strip's counts, each with its mark: "▪ 25 fine · ◆ 1 warned · ‖ paused today". When three or more kinds of odd day need the room, the fine count is left to the strip. |
| `fanGroups(d, outs)`, `picFan(d, outs)` | What is built from a file, grouped by what each output is about, the file's own checked rows counted with what the file is about, as the map's `waitsBy` counts them (polish: Applications ⧗ 5, as the map's Application ⧗ 5). Each group has a count, with ⧗ where it waits. Hover a group to see its names. The names under Full answer follow the same groups. |
| `waitChip(w)` | **⧗ 11 ›**: what waits on the paused file, as a count. Hover names the outputs; a tap asks "Which outputs wait?". |
| `rowsLine(d)` | One line for a file's rows today: about as usual, fewer or more than usual, or what stopped it. |
| `ROWKINDS` | The issues about how many rows came (`empty`, `twice`, `rows`). They get `todayBars`; any other issue gets the file's month strip. |

### Each answer is now `{ q, html, pic, line, more, acts }`

- `pic` and `line` make the card.
- `more` is what the full answer adds under them.
- `html` stays the whole answer in words. It is still what an answer without a picture shows, and Claude's facts are untouched.

| answer | picture | one line |
|---|---|---|
| `whyNow` (paused) | `todayBars`, or the month strip for an issue that isn't about rows | "**Access reviews** arrived empty ⧗ 11 ›"; `q` becomes "Why is today paused?" |
| `whyNow` (decided / fine) | none | "◐ Decided for now: …" / "✓ Nothing is paused." |
| `monthNow` (a file, a kind, the estate) | `picMonth` | `stripLine`. A file's `more` adds its `todayBars`, the band in words and the record's odd days. |
| `rowsNow` | `todayBars` | `rowsLine`: the verdict only ("MFA today: about as usual"), since the bars carry the numbers |
| `waitsNow` | `picFan` | "Readers see Tue Mar 26 until you decide". `more` lists the names by group. |
| `builtNow` | `picFan` | Readers / "⧗ 10 wait today, on Access reviews" / nothing waits |
| `nextNow`, `decidedNow`, `columnNow`, `joinNow`, `datasetNow`, `kindNow`, `dsJoinsNow`, `kindDsNow` | none | one line each |

### The palette

- `cardOf(a)`: an answer with a picture or a line shows its picture, then its line (full text in its title). The old paragraph-cutting stays for anything else.
- `previewAsk`: the answer's picture and line, then **Full answer ›** (a link-styled button, ↵). The hint "↵ the full answer · then Decide ›" is gone.
- The list's ask row: the sub "The answer is beside this list" is gone. The row says the question as answered, `local.q` ("Why is today paused?"), as the heading does (polish, builder's note).
- The phone card (`li.pcard`): picture, line, then "Full answer ›" at its foot. The "Full answer ↵" in its header is gone.
- `showAnswer`: an answer with a picture shows that picture first, then the line, then `more`. A `note` (Claude couldn't answer) goes above it all.
- Clicks:
  - `prev.onclick`: Full answer › runs the selected question; a `[data-ask]` (⧗ 11 ›) asks its own question.
  - `li.onclick`: a `[data-ask]` inside the phone card asks its question.
  - In the full answer, `.pa [data-ask]` asks its question.
- `questionsNow`: "Why is today paused?" (via `todayWord`) where the date was written.
- `tidyQ`: weekdays capitalised ("Why is Wednesday paused?").
- `answerFor`: the keyboard-shortcuts route yields when a file is named. "How has Key rotation been this month?" used to get the shortcuts page.

## index.html (the CSS block)

- `.ap` figures: `.aplab` and `.apx` labels at 11 px muted; Today (`.today`) at 12 px semibold with its date (`.tdate`) small.
- `.dqnow`: dq's two labelled bars, copied from dq's block as they are, so the merge keeps one set (polish). The month-bars rules (`.apday`, `.aptwo`) are gone.
- `.apnotes`: odd-day labels.
- `.apfan`: the file chip, curves with end dots, and the group rows.
- `.apline`: one line, ellipsis as a guard; marks `.apm`.
- `.apw`: the ⧗ count chip, styled like the map's ⧗ badge.
- `.apfull`: Full answer ›, in smalt, a text link.
- The month strip reuses the page's `.strip` markup. Its rules are scoped `.palette .pbox .ap.apmonth`, so the older `.pprev`, `.pcard` and `.pa` strip rules don't reach in. The fan's list rules are scoped the same way.
- Sizes come only from design's scale (11, 12, 13 px), in weights 400, 500 and 600. Colour comes from tokens: grey for usual, `--bad` only for the paused day, `--warn` for warned, smalt only for Full answer › and the chip's ›.

## Scripts and tools (in this folder, not the app)

- `scripts/v5_today_phone.cjs`: 5-today's steps 04 to 06 at 390×844, with the same keys and captions. It waits for the card's two bars (`.pcard .dqnow`). On a phone the answer is a card the page builds at that width, so a desktop snapshot rendered at 390 px has no answer to show. `S/scripts/v5_today.cjs` itself runs unchanged.
- `tools/ask.cjs`: asks a question and screenshots the answer (preview, phone card or full answer, light or dark), with no fixed sleeps.
- `tools/clicks.cjs`: Full answer ›, ⧗ 11 › in the preview, the full answer and the phone card, Enter, and the empty palette.
- `tools/sweep.cjs`: every file through the picture answers at one size, checking for one line and no sideways scroll.
- `tools/probe.cjs`: computed styles, for checking.
