# Changes, round 2 revised: the one kit outside the gaps list (peer:design)

The full diff is `patch.diff`, against the merged prototype in `S/explore/`.

| Where | What changes |
|---|---|
| `index.html` | My `/* peer:design start */ … /* peer:design end */` block is replaced. The round-1 rules are unchanged; a revised round-2 section is added at the end. |
| `build.js` | Three expressions (round-2 polish added two), each marked `peer:design`. |
| `explore.js` | Nothing. |

`work/peer-design.css` is the block's source, and `work/inject.py` puts it into `app/index.html`.

**What left this patch, and why.** In round 2's first version I also rebuilt the gap rows:

- one Pause · Warn · Note · Off control on each row;
- the fold without the control;
- the rows' grid, the state line and weight 600;
- a shorter intro and accepted line.

The gaps step is now dq's combination, built on dq's rows. It takes my control and Larkspur's dot, at pill size with
44 px on a phone, and each row says what its setting does over the 56 days. So those pieces are gone from here (see
"Merge notes").

## build.js

| Function · line | Change | Why |
|---|---|---|
| `rulesPart(f)` → `modeSel` (line 771, the rules while reading a file) | The select's words change from "Pauses · Warns · Notes · Off" to "Pause · Warn · Note · Off". The option values are unchanged, so the `data-rmode` handler is untouched. | The four words of the one control, which the gaps (in dq's combination) and Checks use (§6, plain words once). |
| `rulesPart(f)`, the note above the rules (`p.rl-note`, line 790) | Polish: "Set what each does when broken: Pauses, Warns, Notes or Off." becomes "… Pause, Warn, Note or Off." | The note in the same words as the selects under it (the builder's review) |
| `rulesView`, the checks step's lead (`p.bp-lead`, line 1142) | Polish: after "as Larkspur set them", `span.pk-key` holds a 5 px dot (`i.pk-dot`) and "Larkspur’s pick". It is marked by a non-rendering `${'' /* peer:design … */}` inside the template. | The dot named once on the screen that shows it (§6 never a mark alone; the newcomer's and dq's reviews) |

## CSS: the revised round-2 section

Nothing in it names `.ag-gaps`, `.ag-row`, `.agpick`, `.ag-scale` or their parts.

| Selector | Change | Why |
|---|---|---|
| `details:not([open]) > :not(summary)` | `display: none !important`, app-wide. | A closed fold draws nothing; now nothing in it is laid out or counted. **Measured on all 80 merged snapshots with animations frozen: the same pixels with and without it** (`work/foldcheck.cjs`, `work/foldcheck/result.tsv`). It needs `!important` because `.chain .cgrp` and a few other rules give a fold's body their own display. It is the same rule as the owner's (Decide only), dq's (`#buildpanel`), the builder's and the newcomer's (`details.ag-row`): ship this one. |
| `.seg` | radius `--r-1` (6 px; was 7) | one radius family (§3.1) |
| `.seg button.on` | Polish, app-wide: the chosen segment is a tonal `--action-wash` fill with ink text at 600, and no smalt ring (was `inset 0 0 0 1.5px var(--action)`). | The one filled button stays the only loud thing. The gaps' row (dq's) and Checks say each setting in words, so the state never rests on the fill alone (§3.2; §4, a tonal container; §7) |
| `.rmode` | 26 px tall, 6 px radius, `--edge` border, 12 px: the box of `.seg` | the compact control in the same family (§7) |
| `#buildpanel .seg button .lkdot` | a 5 px `--muted` dot after the word, which outranks the prototype's `.seg button .lkdot { width: auto !important … }` | Larkspur's pick had become 0 px wide on every segmented control in the merge (§7 every state covered). dq's gap control is a `.seg` and gets the dot from this rule. |
| `#buildpanel .bp-done > b`, `#buildpanel .bh-grid li > b`, `:where(#buildpanel) :is(b, strong)` | weight 600 (were `<b>` at 700). `:where()` keeps the general rule weakest, so a class that sets a weight still wins. | three weights (§6) |
| `#buildpanel :is(.ckm, i.mk-w, i.mk-n, i.mk-o)`; `.ck sup …` | Polish: the checks' marks and the "¼" at 600 (were 700) | three weights, on the whole panel, folds included (the builder's audit) |
| `#buildpanel .bp-lead`, `.ps-h`, `.limctl .lb`, `.ck-sum .cs-h em` | Polish: the step's lead 13 px (was 14); the checks' headline 15 px at 600 (was 14 at 700); the stepper's − and + 15 px (was 16); the big counts 17 px (were 18) | each onto its nearest step of the scale (the builder's audit lists nothing at 27 and 28) |
| `#buildpanel .pk-key`, `.pk-dot` | Polish: the key's dot drawn like the controls' pick dot, its words 12 px muted | the same mark, named |
| `body.hasmap #buildpanel .ag-kline` (≥ 761 px) | hidden on a desktop; kept on a phone | the line of kinds repeats the map beside it (§2). The same rule is in the builder's and the newcomer's patches: keep one. |
| `#buildpanel .bh-grid`, `.bh-grid li`, `.bh-grid li > svg.bh-spark` | history (step 27): the files as rows with a divider, two columns, 24 px apart; no tinted tile; each sparkline at its drawn 140 px, under its name (a phone keeps the full-width sparkline) | 22 equal tinted tiles were the stacked-card, dashboard-soup feel (§2; §7) |
| `#buildpanel .ps-days`, `li`, `li b`; `.ck-kinds` | checks (step 28): the days each check would have paused as a list read down, dates in a 52 px tabular column, still crimson, no outlined pill; the groups without a frame | nine crimson-outlined pills were everything at one volume, and a box inside the panel (§3.2, §3.4, §3.6) |
| `#buildpanel .ck-kinds .segwrap > .seg` | Polish: `grid-column: 1 / -1`. dq's tested one line; an old `.ck-kinds .seg { grid-column: 2 }` rule had put the Learned control in a second column inside its wrapper. | On a phone that control ran to 470 px. The merged base clipped it, so Note and Off couldn't be tapped; with my frame gone, the panel scrolled sideways. Now, at 390×844, `.bp-body` scrollWidth = clientWidth = 390 and every segment is inside the panel (the owner's and dq's reviews). |
| `.node.ds .db .k/.w/.l/.n`, `.db .k svg.pz2` | the map's check badges at `max(12px, 11px / --ks)` | the 11 px floor (they rendered at 8.7 to 9.1 px on the Checks step) |
| `.ck-grid thead th .ck-h, .ck-h` | 11 px (was 10) | the floor |
| `#buildpanel .bh-grid code` | 11 px (was 10.5) | the floor |
| `.ck sup, .ck-sum sup, .ckm sup, .cs-q sup` | 11 px (was 8) | the floor (the "¼" mark) |

No new colour, token or component.

## Walkthroughs

All five run from `S/scripts/` as merged. The copy of `v1_setup.cjs` with two captions about my control is withdrawn
(`work/v1_setup.r2v1.cjs`).

## Merge notes

- **dq's gaps combination owns the gap rows.** It carries:
  - the one control with Larkspur's dot at pill size, 44 px on a phone;
  - each row's 56-day consequence;
  - the fold that no longer repeats the control;
  - weight 600 on the rows.
  My round-2 version of those is withdrawn: `work/patch.r2v1.diff` keeps it for reference.
- **What still reaches dq's rows from me is intended.**
  - The component styles `.seg` (radius 6) and the pick dot (`#buildpanel .seg button .lkdot`, `!important`). If dq
    draws the dot differently on the gaps, a rule `#buildpanel .ag-gaps .seg button .lkdot { … !important }` outranks
    mine.
  - The round-1 rules already in the merged base dq built on: `#buildpanel .ag-gaps li` (a divider), `.ag-open` (a text
    link), `.ag-known` (no box). They are dq's context, not new.
- **The closed-fold rule:** keep mine, app-wide, and drop the four scoped copies.
- **The kinds line:** keep one of the three identical rules.
- **History (27):** dq redraws the map's history chips on the cards' scale; I restyle the panel's tiles. They don't
  overlap. Ship both.
- **Owner, newcomer:** no overlap.
