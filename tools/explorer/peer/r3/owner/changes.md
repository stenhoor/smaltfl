# Decide on the estate: changes, and where

Owner's round-3 fix. Everything is in `app/explore.js` (marked `// peer:owner (r3)`) and one CSS block at the end of
`app/index.html`'s `<style>` (`/* peer:owner start */ … /* peer:owner end */`, after `integrator r1 end`). The fix is
made reproducibly by `work/apply.py` (it reads `explore/`, applies each edit once, and writes `app/`); the panel's new
body is `work/body.js`, the CSS is `work/owner.css`.

## explore.js, `openPanel(id, col, decide)`

| # | Change | Where |
|---|---|---|
| A | `let dkAfter = null`: the After column is a function both halves of `openPanel` can call | `let body = ''` |
| B | The recommended choice always comes chosen (`k0 = I.suggest` when it is offered), whoever recommends it; build days' `preselect: false` no longer leaves the hero empty | `const pre … k0 …` |
| C | New panel body, replacing the two columns (`.dcols`, `.dleft`, `.dright`) and the old footer: | `body = …` |
| | • `.dk-state`: the severity badge (or the pause mark), the cause and one number, `0 rows, usually about 1,435` (from `d.rowsToday`, `d.rowsUsual`) | |
| | • `.dk-hero`: `.dk-now` (`decidePic('now')`, the day readers see, `⏸ Paused`, `⧗ 11` as a count button with the list in its title) → `.dk-after` (`decidePic(k)`, the day readers see after it, what becomes of the day, and who recommends it and why: her words or smaltfl's reading). `.dk-after` is drawn by `dkAfter(k)` and titled with `HOW[k].what`, the full sentence on hover | |
| | • `details.dk-more` ("More ›"), holding `.dk-in`: Choices (the radio list, `label.opt.tile` as before, "Recommended" as a word), the evidence (`.decfig` with `rowsDiff` and "If it keeps happening ›", the corrected file's `.fixchip` with "How it compares ›", "Why it paused ›" or the "Paused by" checks, and this month's strip where the day has no figure), what waits (`⧗ 11 outputs wait on it` and their names), and the tools (Deciding as `#dec-who`; "Copy a request for the file ›", "Read it ›") | |
| | • `.dfoot.dk-foot`: the reason box (`.whyrow`, folded while you agree), the record line (`.onrec`), "Write your own reason ›", and the one button (`[data-confirm]`). Cancel is gone (✕ and Esc stay) | |
| D | The head: eyebrow = the file; h2 = "What should readers see today?" with the date small (`.dk-date`), or "… for Mon Feb 26?" when readers are on a later day. Swap "today" for design's Today helper at merge | `L.innerHTML = … .ph …` |
| E | Picking a choice draws the After column again (`dkAfter`) and plays it; the removed "After this" line is set only where it still exists | radio `onchange` |
| F | No 4.8 s replay timer: the After picture plays when shown and when the choice changes | `picTimer = …` removed |
| G | smaltfl's reading is agreed by default, as a named owner's is, so the recommended choice is ready (the record says "smaltfl's reading, agreed"; the build records `from: 'smaltfl'`, as before) | `syncWhy` |
| H | Agreeing folds the box for either kind; only a person's recommendation makes the button say "Agree:" | `syncWhy` |
| I | The record line names who and in whose words; the choice is on the button beside it, said once | `recordLine` |
| J | The one button takes focus (Enter decides; 1 to 4 still choose, though the list is behind More) | after the handlers |
| K | `⧗ 11` opens More at what waits; "Copy a request for the file" copies it at once and marks the file asked for: no longer a ticked box that copied on deciding | new handlers |

## index.html, `/* peer:owner start */`

- The panel is one column, 640 px at most (from 761 px); from 1100 px it stays a card seated right, below the bar.
- `.dk-state`, `.dk-sev` (serious: filled, mild: washed, each with the pause shape and a word), `.dk-pz`.
- `.dk-hero`: Now in grey, After framed in smalt (bad when the choice is risky), small-caps labels, pictures on white,
  the day readers see at 15 px, each line at 13 px, `.dk-count` as a quiet pill, `.dk-why` with the avatar or `≈`.
- More: a quiet smalt link with a turning ›; inside, sections 24 px apart, each with a 12 px muted heading; the month
  strip styled here (round 2 hid `.nowmonth`); Deciding as and the request as quiet controls.
- The footer: the record line and "Write your own reason ›" on the left, the button on the right; the reason box above
  them only while needed.
- The page behind: over a file's own view (`#stage[data-level="dataset"]`) the diagram gives way while Decide is open
  (the card cut in half, its columns, the 11 outputs' list peeking under the panel). Over the build's map, round 2's
  quiet diagram stays.
- Under 1100 px (a full-height sheet) the footer sits at the sheet's foot. Under 761 px Now sits above After, each a row
  (picture, then the day readers see; its line and the reason full width), the arrow points down, and the button takes
  the footer's width.

## Walkthroughs (copies in `scripts/`, same steps)

| Script | What changed |
|---|---|
| `v5_today.cjs` | Steps 11 and 12 wait for and ring `.panel .dk-hero`, not `.panel .opts`; step 12's caption says what the screen shows |
| `v2_fix.cjs` | Waits for `.dk-hero`; step 7 rings `.dk-now`, step 8 `.dk-after`; step 9 opens More before ringing the other choices; steps 11 and 18 ring the footer (`.dk-foot`, record line and button); step 17 opens More before ringing the figure |
| `v4a_odd.cjs` | Waits for `.dk-hero`; step 7 opens More before "If it keeps happening ›"; step 8 rings `.dk-after`; step 9 taps "Write your own reason ›" first (smaltfl's reading comes agreed), its caption no longer says "on the left"; step 10 rings the footer |
| `v4b_outlier.cjs` | Waits for `.dk-hero`; step 6 rings the hero (it says serious, Wednesday now, the corrected file's 815 rows); step 7 rings `.dk-after`; step 8 opens More before "How it compares ›" ("under More" for "one tap away"); step 9 rings the footer |

## Polish (after design's and dq's agreement)

| Change | Where |
|---|---|
| Keep's cost is on its card: `afterCost(k)` puts `I.cons[k]` ("✕ The 11 outputs show Tuesday, other files included") under the fate line for whichever choice After shows; a risky choice's risk stays its fate line; another choice's cost no longer stands in for "who recommends" | `work/body.js` (`afterCost`, `afterWho`, `dkAfter`); CSS `.dk-cost`, its phone grid row `cost` |
| The bar's tools (the estate mini map and "+ Add a dataset") and "Esc steps back" are hidden while Decide is open: their edges showed beside the panel, and Esc closes the panel there | CSS: `body:has(#layer .panel.decide) .trailbar .tools, .trail .eschint` |
| Today is named by design's helper where the page has it: `dkDay()` is `window.smDay` when defined, else `DK_DAY`, the same calls (`is`, `text`, `mid`, `small`) by this panel's rule (today is the day on screen unless readers are on a later day). The heading uses `mid` and `small` ("What should readers see today? *Wed Mar 27*"; looking back, "… for Mon Feb 26? *readers see today*"); the pictures use `text` for the paused day's card ("Today", not "Wed 27") through a new optional third argument of `decidePic(k, dd, dayLab)`, which other callers (Ctrl K's preview) don't pass | `work/apply.py` edits D, D2, D3, D4; `work/body.js` (`dayLab`); CSS `.ph h2 .tdate` |
