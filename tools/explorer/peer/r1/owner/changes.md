# Changes: the owner's working fix (the Decide panel), after round 1

- **Working copy:** `S/peer/r1/owner/app`.
- **Patch:** `S/peer/r1/owner/patch.diff`, in two files: `index.html` (one CSS block) and `explore.js` (lines marked
  `// peer:owner`). `build.js` is untouched.
- **Scope:** every change is in the Decide panel: `openPanel(id, col, decide)`, and CSS under `#layer .panel.decide`,
  or `body:has(#layer .panel.decide)` while it is open.
- **Untouched:** other panels, the map, the Build panel, the banner and the receipts. Steps 1 to 6 and 13 to 16 of
  video 2 count exactly the same words before and after.

## explore.js: `openPanel(id, col, decide)`, decide branch

| # | Where | Change | Why |
|---|---|---|---|
| 1 | `agree0`, `pre`, `k0` | A named owner's recommendation (`I.sugBy && I.noteOffer && I.note && I.agreeWho`) comes chosen. The machine's reading ("smaltfl's reading of the evidence", video 4a) never does. | One tap decides. Her pick is the answer, so it is already in place. |
| 2 | `EYE`, `seesOf(k)` (new) | Each choice gets an eye line: the day readers see after it. It is the same day `decidePic` puts the eye under. The first choice says it in words, "Readers see Sun Feb 25"; the others keep the eye and the day. Where readers are on a later day (`laterSaid()`), it reads "Mon Feb 26 shows the corrected file". | What readers see after each choice, in three words, with the eye taught once (round 1, newcomer). |
| 3 | tile template | `${seesOf(k)}` goes after the name. The file's fate drops "Done for now · ". "Stays on your list" becomes "Stays yours to decide", the calendar legend's own words. | Said once. The screen never shows "your list" (round 1, newcomer). |
| 4 | `nowt` severity | `.sev` splits into `b.sevw`, the level as a word ("Serious", "Mild"), and `span.sevr`, its reason. The round-1 version dropped the `data-sev` attribute on `.dcols`: nothing reads it now. | How serious, first: a badge with a shape and a word. |
| 5 | `.fixchip` | A `div`: "↻ A corrected file came at 14:10 · It passed every check", then `details.fixmore` "How it compares ›" with the rest of `I.fixSaid`. | The answer first, the evidence one tap away. |
| 6 | `.tune` (mild days) | Wrapped in `details.tunefold`, "If it keeps happening ›" (the prototype's own caption for it). | A mild day's limit tools are a second decision: one tap away (§3.7). Round 1, newcomer. |
| 7 | `h3.qrow` | `title="Readers: the people who use the outputs"` on "What should readers see?". | Says who readers are once, where they are first named. It adds no visible words (round 1, newcomer). |
| 8 | footer template | `#dec-ask` comes ticked where the chosen choice owes a file. A new `button.ownwords[data-ownwords]`, "Write your own reason". | Coming chosen mustn't drop the file request. Disagreeing takes one tap. |
| 9 | `recordLine(k)` | While agreeing: "**Goes on record when you tap Agree:** Alex Kim, head of IT controls · Wait for the file · Sloane Marsden's reason, agreed", without repeating the quote. Otherwise: "**Goes on record with your tap:** …". "On record" stays for the receipt alone. | Nothing is decided before the tap (round 1, newcomer and coordinator). |
| 10 | `syncWhy(k, fromChoice)` | Back on her choice with no words of your own, her reason is agreed again. Agreeing folds `.whyrow`, shows "Write your own reason", and the button reads "Agree: wait for the file". | The one button says exactly what the tap records. |
| 11 | `own0.onclick` (new) | "Write your own reason" clears the agreed reason, sets `L.dataset.own`, opens the box and focuses it. | Your own words, one tap away. |
| 12 | `narrow()` scroll | On a phone the panel doesn't scroll itself past the top when her pick comes chosen and agreed. | The answer stays on the phone's first screen. |

## index.html: one block, `/* peer:owner start */ … /* peer:owner end */`

| Selector (under `#layer .panel.decide` unless said) | Change | Why |
|---|---|---|
| `body:has(#layer .panel.decide) #buildpanel`, `… #stage .lab`; `#layer:has(.panel.decide) .scrim` | **Round 1:** the page behind stays visible, dimmed by a 28% scrim. Only the Build panel and the map's relation labels are hidden. This replaces the round-0 rule, which hid the whole `.app`. | The map shows what the decision is about: the paused file and its line to what it holds. It is not a grey slab (round 1, builder; §3.5, §3.8). |
| `@media (min-width: 1100px)`: `.panel.decide { top/bottom/right: 24px; height: fit-content; max-height: calc(100vh - 48px); margin: auto 0; border-radius: 12px }`, `.pb { min-height: 0 }` | **Round 1:** on a wide window the panel is a card as tall as what it holds, seated right and centred on the dimmed page. A long day scrolls its body, and the footer stays. Tablets and phones keep the full-height sheet. | The record line and the one button end the content instead of floating mid-screen (round 1, integrator; §3.5, the action where the eye ends). |
| `details:not([open]) > :not(summary)` | What a closed fold holds is not drawn. | The evidence is one tap away, and the counter otherwise reads closed folds. |
| `.nowpic`, `.nowt > b`, `.sev`, `.sevw`, `.sevr`, `.nowmonth` | A grey now-box with an ink title. The level is a pill with the pause mark: `--bad` filled for serious, `--warn-wash` for mild. The month strip is hidden inside the panel. | Grey everything, then highlight one thing (§3.6). |
| `.decfig`, `.uv b` | No frame. The headline is 24 px (the scale's display step, round 1, design), in ink; `.uv.far / .out / .fixed b` are ink too. **Round 1:** the serious-day rules (the bars' grid and size, and hiding `.u-chart`, `.ulg`, `.ulim`, `.urows`) are gone. The figure is whatever `usualFig` draws, full width, under the badge. | dq's figure takes the figure's place in the merge (all four reviewers). |
| `.fixchip`, `.fixmore`, `.tunefold` | No tint. Green on the ↻ line only. The folds are text links. | Colour for status only; one link language. |
| `.tunefold > summary`, `.fixmore > summary`, `.whyp > summary`, `.waitlist .sw`, `.ownwords`, `.askfile .link`, `.userec` | One link language: smalt, medium weight, underlined on hover only, and › where it opens something. | One component language (§7). |
| `.stopby` | No frame, one line. | Fewer frames. |
| `.opts.tiles.rows`, `label.opt.tile`, `.on`, `.risk.on`, `:has(input:focus-visible)` | The choices are one list: one frame and hairlines. The chosen row is a 6% smalt state layer (red when risky), with an inset focus ring. | Cut the stacked-card feel (§7). States are layers (§4). |
| `label.opt.tile .pic`, `.rtx` and its children, `.qrow .nch`, `.recchip.owner`, `.recchip .av` | No tile pictures. Who, then the choice, her words, the eye line and the fate, then the risk. The choice count is hidden. The avatar is 22 px with 11 px initials (round 1, design: on the scale). | Said once; sizes from the scale. |
| `.dfoot` and its children | The after-line is hidden. Order: the record, the reason when open, "Write your own reason", "Deciding as", the file request, then the buttons. From 1100 px the buttons sit beside the record. | On record, then the one primary action (§6). |
| `@media (max-width: 760px)` and `(max-width: 1099px)` | On a phone, the now-picture stays at 104 px and rows you haven't chosen drop their risk line. Under 1100 px there is space between the situation and the choices. | The decision fits the first screen. |

## Scripts (`S/peer/r1/owner/scripts/`, each requiring the kit by its absolute path)

- `v2_fix.cjs` and `v4b_outlier.cjs`: there is no "Use her reason" tap, because it is hidden while agreeing. Captions
  follow the panel; round 1 says the record line is still to come. They keep the same step counts as the originals
  (19 and 11).
- `v4a_odd.cjs` (**round 1**): a copy whose step 7 opens "If it keeps happening ›" before ringing `.tune`. It keeps the
  same 12 steps and captions.

## Merge notes

How the owner's patch combines with the others, so the five merge cleanly:

- **dq's figure (`usualFig`, `svg.u-chart.u-dq`) is the figure in the Decide panel.**
  - My block no longer touches `.u-chart`, `.u-bars`, `.ulg`, `.ulim` or `.urows`. It only takes `.decfig`'s frame off
    and sets the headline (24 px, ink), so dq's chart runs full width in the left column under the severity badge.
  - My snaps show the prototype's own figure there until dq's lands. dq's preview of the combination is
    `S/peer/r1/dq/reviews/sketch-owner-merge-fixed.png`.
  - The headline is ink in the panel. dq concedes the verdict colour (drop `.ufig.dq.warn .uv.out b` and
    `.uv.fixed.still.* b`), so the day's column is the one coloured mark.
- **Design's system on top of my structure.**
  - Design drops its section 4 (choice rows, recommendation chip, frames, hiding the Build panel). My block holds the
    Decide panel's structure and the rule that hides the Build panel and the map's labels.
  - Design's type tokens apply. My sizes are on its scale: 11, 12, 13, 15 and 24 px.
  - Design's `.opts .tk { display: none } .opts:has(input:focus-visible) .tk { … }` (key numbers only while the keyboard
    is in use) applies as it is: nothing in my block sets `.tk`'s display.
  - Design's 0.24 s ease-out arrival needs no change from me: the tile pictures it animates are hidden in my panel.
  - Design's `.tfile { display: none }` should not land: with my after-line hidden, the file's fate would vanish. My
    short fate on each row stays.
  - The scrim: one value, 28%, the same as design's.
- **Severity colour:** my badge uses the same pair as dq's column and design's banner: crimson filled for serious,
  amber for mild, with the pause mark and the word.
- **Builder:** no overlap. The builder hides closed folds in the Build panel with `details.bf-descd:not([open]) >
  :not(summary)`; mine does the same in the Decide panel. One page-wide `details:not([open]) > :not(summary) { display:
  none }` could replace both.
- **Newcomer:** no overlap. Their screens are explore and the map's dashed boxes.
