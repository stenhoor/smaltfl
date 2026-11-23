# One kit to the end of setup

> **Revised after review (see "Round 2: took / declined" at the end).** The gap rows (steps 21 to 26) are now dq's
> combination, which takes my control and Larkspur's dot. This patch keeps the global parts:
> - Larkspur's pick dot;
> - the app-wide closed-fold rule;
> - three weights;
> - the 11 px floor;
> - history (27) and checks (28) as rows.
>
> The screens and numbers below describe the first version. Its patch is kept as `work/patch.r2v1.diff` and its setup
> script as `work/v1_setup.r2v1.cjs`. Its gap-step snapshots and pairs were replaced by the revised run; `snap/` and
> `v1/` now show the revised patch.

**One sentence:** the screens setup ends with (gaps, history, checks) join the one visual system the rest of the merged
product now uses:

- one control and four words for every "what this check does";
- Larkspur's pick visible again;
- rows on the panel instead of tiles, pills and framed boxes;
- three weights;
- the 11 px floor finished;
- a closed fold that is neither drawn nor counted.

It fixes problems 1, 2, 3 and most of 5 in `critique.md`.

## It works

- **Walkthroughs.** All five ran end to end on `app/` in snapshot mode, with no page errors:
  - `scripts/v1_setup.cjs`: a copy, with two captions on new words;
  - `S/scripts/v2_fix.cjs`, `v3_explore.cjs`, `v4a_odd.cjs` and `v4b_outlier.cjs`, as they are.
- **Step counts are unchanged:** 28, 19, 10, 12 and 11.
- **Patch:** `patch.diff`, 49 changed lines (+46/−3):
  - my CSS block gains a round-2 section;
  - four expressions change in `build.js`.
  `changes.md` names each, with its merge notes.
- **Before and after:** before is `S/peer/snap2/<video>/NN.png`; after is `S/peer/r2/design/snap/<video>/NN.png` for
  the same step. Side-by-side copies are in `v1/1-setup-<NN>-pair.png`.

## Words, counted two ways

The tool counts text inside closed folds, which is never drawn. So each step has two baselines:

- **as counted:** `S/peer/words-r36.txt`;
- **readable:** the same pages with only the fold rule injected. With animations frozen, all 80 render the same pixels
  as before (`work/foldcheck/result.tsv`).

Every step's three numbers are in `work/words-after.tsv`. The steps this fix does not touch count the same as their
readable baseline.

| Step | As counted | Readable | After |
|---|---|---|---|
| 1-setup/21, every file in | 724 | 437 | 390 |
| 1-setup/22 to 25, the gaps | 913 | 456 | **397** |
| 1-setup/26, the gaps accepted | 942 | 481 | **431** |
| 1-setup/27, history | 435 | 398 | 398 (the change is visual) |
| 1-setup/28, checks | 661 | 474 | 474 (the change is visual) |
| 2-problem-fix/16 (fold rule alone) | 511 | 250 | 250 |
| All 80 steps | 31,041 | 25,947 | 25,614 |

**Why setup stays over 200.**

- **The map beside the panel is 138 of the words** (115 on the map, 23 in the bar). It is the picture the panel's
  findings point at: "approver_id · 19 rows not found" is gap 1, drawn on its link.
- **The gaps panel is six findings, each with its reason.** The reason is the why the brief asks to keep.
- **The next cut is a content one.** Each finding's sentence could become a number plus a label (gap 1 as "19 of 268
  rows · approver not in HR"). That belongs to the builder and the newcomer, and this system will style it.

## Screens

### 1. The gaps: one control, one grid (1-setup/22 to 26)

**Problem:**

- The same choice has its own pill control and words ("Warn if more · Note it · Stop checking") that no other screen
  uses.
- A 38-word intro repeats the heading and the foot.
- The kinds line repeats the map.
- The titles are set at 700.
- The controls sit wherever their row's text leaves room.

**Principles:** §3.1 and §7 (one component language, "matches the system"), §2 and §6 (said once), §3 (one grid).

| | Before | After | Words (readable) |
|---|---|---|---|
| Before accepting | `S/peer/snap2/1-setup/22.png` | `S/peer/r2/design/snap/1-setup/22.png` | 456 → 397 |
| Accepted | `S/peer/snap2/1-setup/26.png` | `S/peer/r2/design/snap/1-setup/26.png` | 481 → 431 |
| Phone, 390×844 | `work/before-1-setup-22-phone.png` | `phone/1-setup-22-phone.png` | 261 → 196, no sideways scroll |

**Changes:**

- `seg4(…)` replaces `span.agpick`: Pause, Warn, Note, Off, as on the Checks step, with Larkspur's pick as a dot.
- The evidence fold no longer repeats the control. It keeps "Warn when", the pause floor and "Pause would stop …".
- Each row reads the same way: title; reason on its own line; the control at the left (every one 64 px a button) with
  "evidence ›" at the right; then its state ("✓ accepted at 15 …", "looks like a finding").
- On a phone the control is 44 px tall. The pills were about 24 px, below a touch target.
- **The intro, before accepting.** It was 38 words ("These 6 were in the files on Feb 1. Accept them as known: from
  then on each does what you set beside it (1 warn if more appear, 1 noted, 3 off, 1 watched by your rule)…"). It is
  now 14: "Once accepted, each does what is set beside it; the finding stays yours to accept."
- **The line after accepting.** It is now "✓ Accepted by you, Nov 22, 21:10 · this replay: 5 of 6; the finding stays
  open."
- The kinds line is hidden on a desktop, where the map shows the same kinds and counts. A phone keeps it.
- Titles are at weight 600.

### 2. History: rows, not tiles (1-setup/27)

**Problem:**

- 22 equal tinted tiles, each with a centred sparkline.
- Column names at 10.5 px.

**Principles:** §2 (generic dashboard soup), §7 (cut the stacked-card feel), §6 (the 11 px floor).

| | Before | After | Words |
|---|---|---|---|
| History | `S/peer/snap2/1-setup/27.png` | `S/peer/r2/design/snap/1-setup/27.png` | 398 → 398 |
| Phone | | `phone/1-setup-27-phone.png` | 133, no sideways scroll |

**Changes:**

- `.bh-grid li` loses its fill: rows with a divider, in two columns.
- Each sparkline is set at its drawn 140 px, aligned under its file's name.
- Names are at 600 (the `<b>` was 700).
- `code` is set at 11 px.

### 3. Checks: one control, a list of days, no frame (1-setup/28)

**Problem:**

- Larkspur's pick is invisible on every control (0 px wide, computed).
- The days each check would have paused are nine crimson-outlined pills.
- The groups sit in a framed box.
- The map's check badges render at 8.7 to 9.1 px.

**Principles:** §7 (every state covered), §3.2 (one coloured thing), §3.4 (fewer borders), §6.

| | Before | After | Words |
|---|---|---|---|
| Checks | `S/peer/snap2/1-setup/28.png` | `S/peer/r2/design/snap/1-setup/28.png` | 474 → 474 |
| Phone | | `phone/1-setup-28-phone.png` | 188, no sideways scroll |

**Changes:**

- `#buildpanel .seg button .lkdot` is a 5 px muted dot and outranks the prototype's rule.
- `.ps-days` is a list read down: dates in a 52 px tabular column, still crimson, with no outline.
- `.ck-kinds` has no frame.
- The map's `.db` badges are set at `max(12px, 11px / --ks)`, so they render at 11 px or more.
- Table heads and the "¼" are at 11 px.

### Everywhere: a closed fold is not drawn, so it is not counted

`details:not([open]) > :not(summary) { display: none !important }`. It is the owner's Decide rule, made app-wide. On
all 80 merged snapshots it changes no pixel and removes 5,094 uncounted-but-counted words.

## Measured on the panel (computed styles, `audit.cjs`)

| Step | Weights before → after | Words below 11 px | Controls for one choice |
|---|---|---|---|
| 1-setup/22 | 400 500 600 700 → 400 500 600 | 0 → 0 | pill (`agpick`) → `seg` |
| 1-setup/27 | 400 500 600 700 → 400 500 600 | 11 → 0 | (none) |
| 1-setup/28 | 400 500 600 700 → 400 500 600 | 0 → 0. On the map: 40 → 0 | `seg`, its pick dot 0 px → 5 px |

## Memorisely's four questions (§7)

- **Clear hierarchy:** on every gap, the finding, then its reason, then one control; Larkspur's pick a quiet dot; the
  one filled button stays in the foot.
- **Every state covered:**
  - a gap before accepting, accepted, watched by your rule ("Watched by your rule …", unchanged) and looks like a
    finding;
  - Larkspur's pick against yours;
  - phone and desktop.
- **Matches the system:**
  - the same `.seg` and words as Checks;
  - no new colour, token or component;
  - three weights;
  - sizes from the scale.
- **Ready to ship:** five walkthroughs with no page errors, and no sideways scroll on a phone.

## What I deliberately did not change

- **The words of each finding.** Turning them into numbers is a content change for the builder and newcomer.
- **The map's labels:** the builder's evidence.
- **The panel's step strip:** orientation, which is the newcomer's.
- **The Decide panel's page behind it** (critique 4): the owner's and the builder's to settle.
- **The Decide now-picture's 8.5 px labels and the 10 px keycaps** (critique 5): drawn inside the owner's SVG
  pictogram.
- **History's legend above the grid** (critique 6): a layout change I leave for a later round.

## Round 2: took / declined

**Verdicts:** builder agree 4, newcomer agree 3, owner disagree 3, dq disagree 3. The owner and dq objected to the
control on the gap rows:

- It was the loudest thing in the list: four outlined segments on each of five rows, a smalt ring on each choice, and
  full width at 46 px on a phone.
- Pause one tap away on a gap row hid what it does. On the tags gap it would pause 55 of 56 days, with nothing on the
  row to say so.

The builder asked for the same consequence line. The newcomer asked for the pills' height and a key.

| Ask | From | Taken or declined | Why, and the test |
|---|---|---|---|
| The control at the pills' size, tonal, not a smalt ring; 44 px on a phone only | owner, newcomer | **Taken, by moving it.** My gap-row control and row changes are removed. The gaps step is dq's combination: my one control and Larkspur's dot, pill-sized on a desktop and 44 px on a phone. | One author builds one screen. **Test:** `patch.diff` has no rule that names `.ag-gaps`, `.ag-row`, `.agpick`, `.ag-scale` or their parts; the only mention is a comment. 1-setup/22 draws the merged rows (`work/gaps-22-check.png`). |
| No Pause on a gap row without what it would do ("pauses 55 of 56 days") | dq, builder | **Taken, in dq's combination.** Each row there says what its setting does over the 56 days. | §3.8: the consequence where the choice is made. |
| "Warn" alone drops "if more"; explain the four words once | dq, newcomer | **In dq's combination** (the key and the row's own line) | (none) |
| Short names and counts, not sentences | owner, newcomer, dq | **In dq's combination** (dq's rows) | (none) |
| The newcomer's why line over my shorter intro | owner | **Taken:** my intro and accepted-line changes are removed from `allInView` | The newcomer's line says the consequence. |
| Keep the global parts | all four | **Kept:** the pick dot, the app-wide fold rule, three weights, the 11 px floor, history as rows, checks as a list without a frame | **Test, computed:** on the Checks step all 8 pick dots are 5 px wide; panels at 27 and 28 use weights 400, 500 and 600; no text under 11 px in those panels or on the step-28 map. |
| The one vocabulary in the rule list's select ("Pause · Warn · Note · Off", was "Pauses · Warns …") | (my call) | **Kept** | The same four words as the control the combination adopts (§6). One line in `build.js`; option values unchanged. |
| A plain-word pass on the Checks step ("8 files, 13 links (each evidence file's app_id is checked by Scope instead)") | newcomer | **Declined here** | It is a content change, not a visual one: the newcomer's or the builder's. |

**Works:**

- **Walkthroughs:** all five ran from `S/scripts/` unchanged on the revised `app/`, with no page errors, captions
  identical to `snap2`, and step counts of 28, 19, 10, 12 and 11.
- **Phone:** `phone/1-setup-27-phone.png` (133 words) and `phone/1-setup-28-phone.png` (188 words) render with no
  sideways scroll.

**Words, with the fixed counter** (`S/peer/words-r36-fixed.txt` → after, every step in `work/words-after.txt`):

- 27 and 28 keep their words, 398 and 474. Their change is visual: `v1/1-setup-27-pair.png`, `v1/1-setup-28-pair.png`.
- Elsewhere the fold rule and the kinds line move counts by a few words. For example 1-setup/22 goes 476 → 445 and
  2/16 goes 265 → 250.

**Patch:** `patch.diff`, 35 changed lines (+34/−1).

## Round 2 polish

The revised patch was agreed 4 of 4 (builder 4, newcomer 3, owner 4, dq 4). The polish:

| Ask | From | What was done | Test |
|---|---|---|---|
| On a phone, step 28's Learned control ran to 470 px; the panel scrolled sideways and Off couldn't be tapped | owner, dq | **Taken:** dq's tested line, `#buildpanel .ck-kinds .segwrap > .seg { grid-column: 1 / -1; }` | Live, at 390×844 on the checks step: `.bp-body` scrollWidth 390 = clientWidth 390, no segment past the panel's edge, no button off screen. The merged base had one segment ending at 464 px and two buttons cut off. Snaps 27 and 28 rendered at 390: the same (`phone/1-setup-28-phone.png`). |
| The rules note said "Pauses, Warns, Notes or Off" above selects that say Pause / Warn / Note / Off | builder | **Taken:** the note says "Pause, Warn, Note or Off" | On 1-setup/07, "Pauses", "Warns" and "Notes" appear 0 times in `#buildpanel`. |
| Weight 700 and 14, 16 and 18 px left on step 28 | builder, owner, dq | **Taken.** Bold `<b>` is 600 (`:where()`, so classes still win); the marks and "¼" are 600; the lead is 13, the checks' headline 15 at 600, the stepper 15, the big counts 17 | The builder's own `design28b.cjs` lists nothing on 27 or 28 (it reads the whole panel, folds included). |
| Name the pick dot once on step 28 | newcomer, dq | **Taken:** "• Larkspur’s pick" after the lead's "as Larkspur set them" | The words are visible on 28 without hovering (`work/pol/checks-panel.png`). dq adds the same words to the gaps key. |
| The chosen segment app-wide: no smalt ring; a tonal fill with ink text at 600 | my own point, from reviewing dq | **Taken:** `.seg button.on { background: var(--action-wash); color: ink; font-weight: 600; box-shadow: none }` | On 1-setup/28, 7 chosen segments and 0 smalt rings. It applies to the gaps (dq's), Checks and the rule form's "When broken" alike. |

**Declined:** nothing.

**Works:**

- **Walkthroughs:** all five ran from `S/scripts/` on the polished `app/`, with no page errors, captions identical to
  `snap2`, and step counts of 28, 19, 10, 12 and 11.
- **Phone:** the renders at 390×844 have no sideways scroll, on the page or in the panel.
- **Words:** the polish moves none of the fixed counter's numbers on 7, 27 and 28 (365, 398 and 474).

**Patch:** `patch.diff`, 52 changed lines (+49/−3): CSS in my block, and three marked expressions in `build.js`.
