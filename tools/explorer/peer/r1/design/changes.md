# Changes: one quiet system (peer:design)

The full diff is `patch.diff`. It has three parts:

- one CSS block at the end of the page's `<style>`, between `/* peer:design start */` and `/* peer:design end */`;
- one line in `explore.js`;
- two expressions in `build.js`.

Each JS line ends with `// peer:design` and says why in a `peer:design:` comment of its own. No data, seeds or other
files change. `work/peer-design.css` is the CSS block's source, and `work/inject.py` puts it into `app/index.html`.

**Round 1** changed the block only (the JS is as it was):

- a mild pause is amber end to end;
- the month strip numbers its marked days again;
- every rule that reached into the usual-rows figure (`.ufig`) is gone, since dq's figure replaces it;
- the page behind Decide and the choices' fate lines are left to the owner.

The table says what is there now. "Merge notes" at the end says how this block combines with the other four.

## CSS (index.html, the last block of `<style>`)

Tokens, at the top of the block:

- `--fs-1` to `--fs-7`: the type scale, 11 12 13 15 17 20 24 px.
- `--sp-1` to `--sp-5`: spacing, 4 8 12 16 24.
- `--r-1` and `--r-2`: radii, 6 for controls and 10 for cards.
- `--text-primary`, `--text-secondary`, `--text-muted`, `--action-primary`, `--border-subtle`, `--surface-raised`
  and `--surface-sunk`: names by role, each pointing at an existing token.
- `--ease-out`.

No new colour. Every value is an existing token or a `color-mix` of two.

| Selector | Change | Why |
|---|---|---|
| `.kind` | no ring, `--shadow-1` instead of `--shadow-2`, radius `--r-2` at the rendered size | one card language: a card lifts by one soft shadow, never ring + shadow + fill (§3.4, §7) |
| `.kind .kname`, `.kind .kcount`, `.kind > .kwait`, `.kind:not(.compact) .kself` | font size `max(17px or 12px, 11px / --ks)`; kself starts under the icon, -0.01em, an ellipsis only if it still overflows | the map's words never render below 11 px however far the map is shrunk (§3.1, §4) |
| `.ds`, `.ds .dn`, `.ds .dt` | a sunk tone instead of a bordered white box; padding and radius set for the rendered size; labels `max(13px, 11px / --ks)` | no box in a box; file names readable on the map (§3.4, §7) |
| `.ds.waiting`, `.ds.waiting .dn` | a 1.5 px magenta outline and magenta name on the surface; no pink fill | the cause is the one magenta thing on the map (§3.2) |
| `.lab .lv` | relations in `--text-secondary`, weight 400 | relations are quieter than the kinds they join (§3.3) |
| `.node.kind.ghost`, `.node.ds.ghost`, `.ln.ghost`, `.lab.ghost` | proposed, not-yet-added kinds dashed in `--edge` grey, not smalt; the name of the kind of the file being read in ink (round 1), its count and files in `--text-secondary` | smalt is the one action colour, so "Add CMDB ›" is the one smalt thing (§6, §7). The kinds a file only names are quieter still: the builder's `.pointed`, see Merge notes |
| `.bouts .bo.held`, `.bo.held svg.hg path` | held outputs grey with their hourglass; no pink chips | consequences are support, not alarm; the line from the cause still ends here (§3.2, §3.3) |
| `.alert.short`, `:has(.sev.serious)`, `:has(.sev.mild)` and, for mild, `.ai`, `.ai svg.pz > path`, `.at > b:first-child` | a serious pause is filled `--bad-wash` with its crimson mark and words. A mild pause is amber end to end (round 1): its outline (`--warn` 60% into `--line`), its pause mark, its words and its chip, on the surface. Waiting, decided and done are outlined in `--line` | how serious a pause is, said twice: by hue (amber mild, crimson serious, as dq's figure and the owner's badge) and by volume (filled or outlined), with the word kept. A glance tells odd from real (§3.2, §6, §7) |
| `#buildpanel .bp-steps li` | no box fill except the current step | fewer frames (§3.4) |
| `.bd-strip2 .bd-g .c`, `.c:is(.ok, .todo) span` and `.todo` | no inset borders. A number on each Monday, on every day with a mark (◆, the pause, ✓) and on the day shown (round 1); a plain day's date on hover, from its existing `title` | the month as a strip of marks (§5 GitHub strips). Each marked day is labelled where it is (§3.6): 56 numbers become 12 on Mon Feb 26 |
| `#buildpanel .bd-strip2 .bd-g .c span`, `b` | the numbers and marks left at 11 px (they were 9 and 10 px) | the 11 px floor (§3.1) |
| `#buildpanel .bp-t b` | the panel's title at 17 px (was 16) | on the scale (§3.1, §7) |
| `.bd-key`, `.bd-calmore` | legend at 11 px muted; "Both months" a text link on desktop | tertiary looks tertiary (§3.3) |
| `#buildpanel .bp-body > .bd-card:not(.carried)` | no border and shadow; the panel is the surface | spacing, not frames (§7) |
| `.bd-line.chainline` | hidden | the chain right below says the same "MFA → 11 held" (§2) |
| `#buildpanel .chain:not(.done) .cc.iscause` (and `.mild`, `.mild > svg.pz > path`) | white with a 1 px line and a 3 px bar at its edge, crimson when serious, amber when mild, its pause mark amber when mild (round 1); no pink or amber fill, no 2 px black ring | one outlined cause; severity as a mark (§3.4, §6) |
| `.bd-card > header:has(.sev.mild) .bd-m.held` (and its `svg.pz > path`) | the day's "paused" and its mark amber on a mild day (round 1) | the day's head says mild in the same hue as its chip (§6) |
| `body.hasdays.hasmap #buildpanel .chain:not(.done) .heldchips` (≥ 761 px) | hidden on desktop, kept on a phone (where the map isn't on screen) | the 11 held outputs are listed once, on the map (§2, §6) |
| `#buildpanel .bf-props`, `.bf-prop` | a proposal is a section with its label, not a grey box; 24 px between sections | no stacked cards; more space between groups than within (§3.4, §7) |
| `#buildpanel .bf-links li`, `.ag-gaps li` | rows with a divider instead of bordered cards | lists are rows (§3.4) |
| `#buildpanel .ag-open` | "evidence ›" a text link, not a smalt pill | secondary looks secondary; one filled button (§3.3, §7) |
| `#buildpanel .bp-done`, `.ag-known`, `.ag-known.ask` | no tinted box; "All 22 files are in." led by a green ✓ | a confirmation is a mark and a line (§3.2, §6 never colour alone) |
| `.scrim` | 28% instead of 16% | one focal point (§3.5) |
| `.panel.decide .nowpic`, `.nowt b`, `.nowt:has(.sev.mild) > b svg.pz > path` | grey, the title in ink with its pause mark, amber when mild (round 1) | the state is said once, colour on the mark (§3.2) |
| `.panel.decide .dfoot textarea.why`, `#dec-who` | the reason and the name at 15 px (were 14) | on the scale (§3.1) |
| `.panel.decide .decfig`, `.stopby`, `.qsub.top`, `.afterbox` | no frames or grey boxes | spacing, not frames (§7) |
| `.panel.decide .fixchip` | grey with its green ↻, not a green box | status colour on the status mark only (§3.2) |
| `.panel.decide .nch` | "4 choices" hidden | the list shows how many (§2) |
| `.opts.rows label.opt.tile` (and `.on`, `.risk.on`, `:hover`) | no box around a choice; the chosen one outlined in smalt on a light smalt wash | rows, the picked state in the action colour (§3.4, §4 colour roles) |
| `.opts .tk` | keyboard numbers shown only while the keyboard is in use (`:has(input:focus-visible)`) | chrome when it is useful (§3.7) |
| `.recchip` | "Recommended by Sloane Marsden, security lead · time" as a line, not a boxed chip | one less frame; the quote under it carries the weight (§3.4) |
| `.opt.play .pic *` | the pictures' arrival in 0.24 s, eased out, once, staggered by a sixth of before | motion with a job, about 200 ms, no bounce and no repeat (§3.10, §7) |

## JS

| File · function | Change | Why |
|---|---|---|
| `explore.js` · `place()` | `el.style.setProperty('--ks', r.s)` | the CSS needs the map's scale to keep its words at 11 px or more |
| `build.js` · `chainHtml()` → `cc` | when the cause carries the usual-rows picture (`class="ufig"`), the line keeps the file's name and drops its sentence | the card's title says it, and so do the verdict and the picture: "MFA arrived empty" was said six times (§2) |
| `build.js` · `holdLine()` | the line from the cause leaves the file's chip by its side (`a.right + 3`, its middle) instead of its bottom | it runs down the gap between columns and crosses no file's name (it crossed "Key rotation", "Access reviews" and "Scanner findings" on Thu Mar 21) |

## Walkthrough scripts

`scripts/v2_fix.cjs` and `scripts/v4b_outlier.cjs` are copies of `S/scripts/…`. Each requires the kit by its absolute
path. Each rings `#buildpanel .chain .cc.out` (the "11 held · readers see …" line) where it rang `.chain .heldchips`,
which this fix hides on desktop. The captions are unchanged. Videos 1, 3 and 4a run with the original scripts.

## Removed in round 1

| Rule | Why it went | What does the job in the merge |
|---|---|---|
| `.ufig .uv b, .uv.far b, .uv.out b, .uv.fixed b` (the verdict in ink, 17 px) | it reached into the figure, which is dq's | dq's figure, whose verdict goes in ink (see Merge notes, dq) |
| `.ufig .u-ax, .u-ll` 11 px; `.u-v, .u-bv` 12 px; `.u-bars text.u-ax + text.u-ax`; `.ulg` margin | at 11 px "first" and "sent again" ran together on 4b/06 and 2/17, and on dq's chart they render 13.9 to 15.2 px | dq's chart, labelled for its own sizes. In this copy the old figure keeps the prototype's labels, which don't collide |
| `.bd-strip2 … b` centring | the marked days are numbered again, so their mark returns to its corner | (none needed) |
| `body:has(#layer .panel.decide) #buildpanel { visibility: hidden }` | the owner hides the whole page behind the panel; one rule | the owner's `body:has(#layer .panel.decide) .app { visibility: hidden }`. `#buildpanel` is a child of `.app`, checked |
| `.opts.rows .tfile { display: none }` | with the owner's structure each row's short fate is the only place it is said | the owner's rows |

## Merge notes

How this block combines with the other four fixes, so that the five patches merge cleanly.

**Order.** The blocks can go in any order. Where two rules meet, the intended winner already has the stronger selector:
the owner's `#layer .panel.decide …` and the builder's `.pointed`.

### dq: the usual-rows figure

- **The figure is dq's, everywhere it is drawn:** the cause card in the Build panel and the Decide panel.
  - Nothing in this block names `.ufig` or any of its parts any more: no `.uv`, `.u-ax`, `.u-v`, `.u-bars`, `.u-chart`
    or `.ulg`.
  - The cause card around it (`.cc.iscause`: white, a 1 px line, a 3 px bar) and the Decide wrapper (`.decfig`,
    frameless) are mine. They hold the figure without restyling it.
- **The verdict in ink is now dq's line to write.** dq, the owner and I agreed on it. Because my rule is gone, the
  prototype's own `.ufig .uv.far b, .ufig .uv.out b { color: var(--bad) }` would colour dq's verdict again. dq's block
  sets `.ufig.dq .uv b` in `--ink` (17 px on the card), and its coloured-headline rules go. The owner sets the size in
  Decide (20 px).
- **dq keeps its own label sizes and its phone bump** (its review offered to drop the bump in favour of my 11 px rule,
  which is gone). As I asked in my review, its base labels go from 9 to 10 SVG units, so they render at 11 px or more on
  the desktop card.
  - Measured with my round-1 block on dq's snaps: 11.4 px on the card, 13.1 px in Decide
    (`reviews/work/m2-dq-design-4a01.png`, `m2-dq-design-4b06.png`).
- **Severity, one rule in two channels.**
  - Hue: dq's day column (amber mild, crimson serious), my banner and cause bar, and the owner's badge.
  - Volume: my banner, filled when serious and outlined when mild.
  - The word is always kept.
  - The paused file on the map, its line to what it holds and the month strip's cell keep the pause's crimson. They
    say "held", which is the same on a mild and a serious day, and amber there would read as "warned", a published day
    (dq's point).
  - Preview of the merge, mild and serious side by side: `reviews/work/m2-merge-mild-serious.png`.
- **`chainHtml` (build.js) depends on the figure.** It drops the cause's sentence only when the cause's picture
  carries `class="ufig`. dq's `<figure class="ufig dq …">` still matches, and its labels carry the numbers the sentence
  said (262 on the column, usual 269, the limit on its line). Merge the two together.

### owner: the Decide panel

- **The structure and content are the owner's:**
  - the badge;
  - the number;
  - the eye lines;
  - her pick, chosen;
  - "Agree: …";
  - the page behind not drawn.
- **Removed from my block** so they don't fight: my `#buildpanel` rule and my `.tfile` rule (see "Removed in round
  1").
- **Kept as the system on top, as the owner asked:**
  - `--fs-*` (the owner moves its verdict from 22 px to 20);
  - the choices as rows with the chosen one outlined in smalt;
  - keyboard numbers only while the keyboard is in use (`.opts:has(input:focus-visible) .tk`);
  - the pictures' 0.24 s ease-out.

  Where the owner's own row or `.tk` rules set the same property, its stronger selector wins. The owner drops its
  `.on` state layer and its always-on `.tk`, or the integrator keeps one of the two.
- **Same values, harmless twins.** My `.decfig`, `.stopby`, `.nowpic`, `.nowt b`, `.recchip`, `.nch` and
  `.qsub.top` rules duplicate the owner's values. Where they differ the owner wins (`.fixchip`: the owner's has no
  tint), so they can be deleted in the merge with nothing changing on screen.

### builder: setup

- **Kinds.**
  - The builder's `.node.kind.ghost.pointed` is stronger than my `.node.kind.ghost`. It gives the kinds a file only
    names a muted name, a transparent fill and "176 named in CMDB".
  - The kind of the file being read keeps my ink name and grey dashed edge.
  - That makes the newcomer's two states (read, only named), with "Add" the one smalt thing.
- **Join cards.** My `#buildpanel .bf-links li` row rule doesn't reach the builder's `ul.jn-list > li.jn`. Whether a
  join is a card or a row with a divider is the builder's call (its review offers rows, keeping the dashed `.jn.later`).
  My `.bf-prop` sections leave the join as the one card on the panel if it stays a card.
- **The map's type floor wins.** The builder changes its `.node.ds.ghost.pointed .dn` to `font-family` only, so
  `max(13px, 11px / --ks)` keeps the file names at 11 px or more.
- **Map labels.** The builder's `.lab .lwhy` (the columns that join) is untouched by my `.lab .lv` rule.

### newcomer

- No rule of mine meets the newcomer's.
- The newcomer's `.kcount .kwhy` gives way to the builder's `.kpoint`, which inherits my floor.
- Its smalt underline on the tapped column (`th.tap`) is the selected state in the action colour, in line with this
  block.
