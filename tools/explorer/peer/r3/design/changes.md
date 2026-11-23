# design, round 3: each change and where

All in `app/` (built from the live prototype by `work/apply.py`, which asserts each edit lands exactly once). JS is
marked `// peer:design`; the CSS is one block, `/* peer:design start */ … end */`, at the end of the page's `<style>`.
`patch.diff`: index.html +55, build.js +2 −2, explore.js +128 −16.

## 1. Today, one helper every screen calls (`explore.js`, after `DC()`)

`window.smDay` (also `window.__explore.smDay`). Today is the model's day (`M.day`, Wed Mar 27 in the demo); while
building, the latest day played (`M.todayIso`, set by `build.js`, null before the days start). The data stays in the past.

| call | gives | for |
|---|---|---|
| `smDay.is(iso)` | whether `iso` is today | |
| `smDay.text(iso, d)` | `Today`, else the date (or `d`) | a heading, a button, a title, aria |
| `smDay.mid(iso, d)` | `today` inside a sentence, else the date (or `d`) | "readers now see today" |
| `smDay.html(iso, d)` | `Today` with the date small after it, else the date (or `d`), escaped | a label on its own |
| `smDay.small(iso)` | the date small, on today only | after a phrase that begins with `smDay.text` |
| `smDay.date(iso)` | `Wed Mar 27` | |

Called by: the paused banner (both forms), the decided-for-now and complete banners, the top bar's pill (`#waits`), the
Build panel's day card (`build.js` `dayCard`). CSS: `.today`, `.tdate` (the date at `--fs-2`, regular, muted).

For the other owners (nothing hardcodes the day anew): the Decide title (`Decide on ${dc.today}` →
`Decide · ${smDay.html(dc.iso)}`), Ctrl K's "Why is Wed Mar 27 paused?" (`smDay.mid`), the month strip's last day
(`smDay.html`), look-inside's "match on Wed Mar 27's files" (`smDay.mid` + 's), the Build panel's footer
"Decide Mon Feb 26 ›".

## 2. A count is an icon and a number, its list a tip

- `waitBadge` (explore.js): the kind's pill "⧗ 2 outputs wait on Access reviews ›" is now a `<button class="kwait">`
  with ⧗ and the number, `data-tip="wait:<kind>"`, its aria-label the sentence. The old click into the map's "what waits"
  view (`showReach`) leaves the count; Ctrl K still offers it.
- `paint`, `kind-open`: an opened kind's "5 outputs wait on Access reviews" is the same button (⧗ 5).
- The banner's "so the 11 outputs built from it wait for your decision. See what's built from it" is one button,
  "⧗ 11 waiting" ("⧗ 11 held" while building), `data-tip="waits"`: all eleven by the kind each is about, as the map's
  counts are (5 + 3 + 2 + 1).

## 3. One tip (`explore.js`, where the old `.kwait[data-reach]` click listener was)

`#smtip`, `role="tooltip"`: on hover, on focus (Tab), on a tap or click (then it stays); closed by leaving, a tap
elsewhere, a tap on it, or Escape (focus goes back). Opens above a kind's count, below anything else, kept on screen.
`aria-expanded` and `aria-describedby` on whatever opened it. `tipSync()` (called at the end of `drawEdges`) keeps an open
tip with its link when the map draws the link again. Content: `TIPS.wait`, `TIPS.waits`, `TIPS.link`, `TIPS.key`.
While the pointer is on a kind's count the kind doesn't light its lines (`tipKind`, read by the kind's `mouseenter`);
moving into the kind lights them as before. CSS: `.smtip` from the tokens (raised surface, one border, `--r-2`,
`--shadow-2`, 150 ms in, none with reduced motion).

## 4. A link is a few words, its sentences a tip

- `SAY`, `sayOf`, `leadOf`, `sayFrom`, `shortOf` (after `sentenceHtml`): each relation has its words both ways (made up
  of / works in, owns / owned by, runs on / hosts, checks / checked by, approves exceptions to / exceptions approved by,
  …); between two kinds the first in `SAY` leads. The words read along the line from the kind on its left, or above it, so
  the map reads "Organisational unit made up of Person", "Organisational unit owns Application", "Application runs on
  Platform", "Application checked by Control", "Person approves exceptions to Control", and stays right when a narrower
  window lays the kinds out another way (820 and 1180 wide checked).
- `drawEdges`: at rest (`quiet`) a link's label is its few words (`few`), a `button.lab.few` with `data-tip="link:a|b"`
  and an aria-label of its sentences; pointing at a kind still shows its links in full, as before. While building, the
  evidence reading shows (`why`: a column, rows not found) stays under the words, with its own relation's sentence where
  another relation leads (app_tag is Cloud assets', not "runs on").
- `stackEstate` (phone): each kind's links in a few words with the kind each reaches ("owned by units", "runs on
  platforms", "checked by controls").

## 5. The banner (`renderChrome`)

- Paused: "‖ **Today is paused** Wed Mar 27 · Access reviews arrived empty · ⧗ 11 waiting [Decide ›]", one line.
  `dayB` and `waitN` are shared by the long and the short (building) forms; "You chose to wait", "You asked for the
  file" and a corrected file keep their place after a dot.
- Decided for now: one line, as the paused one ("Today is decided for now Wed Mar 27 · readers see Tue Mar 26 · next:
  the corrected file · asked for at 16:47"); the reason stays on the record and the receipt.
- Complete, and every short form: Today with the date small.

## 6. The key and the quieter action

- The legend row (paused, waits on it, warned, planned) and the hint ("Point at a kind… tap a sentence…") fold into a
  "?" by the title (`button.mapkey`, `data-tip="key"`), on a phone too (its legend rows go; the "?" sits beside "Data
  model ▾"). While building, the "?" shows only where the legend did (`body.building.hasdays.hasmarks`).
- "+ Add a dataset" is a text action (smalt, no border): Decide is the one filled button on the screen.

## Not changed, on purpose

- The kind and file levels' legend row and hint (one line, explore.js `renderChrome`, `S.level !== 'estate'`): the file
  view is builder's this round; the "?" fits there after the merge. The kind level's port cards keep their sentences.
- The Decide panel, Ctrl K and look-inside dates: their owners call `smDay`.
- The larger generated estate's area links (not in any walkthrough).
- No walkthrough script changed: `.kwait`, `.alert` and `[data-decide]` are where they were.
