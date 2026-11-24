# ADR 0028: One visual system

- **Status:** accepted, 2026-11-21: the maintainer's answers to Q-343 to Q-350 (and, in amendment 1, Q-351 to Q-354), asked through the question prompt after
  a design review of every screen ([docs/research/ui-design-review.md](../research/ui-design-review.md), and the full
  review with its screenshots on a private claude.ai page). Built in the phases of §10; phase 1 is built
  (§"As built").
- **Date:** 2026-11-21
- **Builds on:**
  - [ADR 0002](0002-second-round-decisions.md) §4 and Q-22: a visual builder without a UI framework, in plain DOM and SVG.
  - [ADR 0008](0008-visual-first-news.md) and [ADR 0012](0012-visual-first-in-two-minutes.md): one cause a day, word
    budgets, the brief, and the measure of the app: an owner finds a problem and explains it to leadership in two
    minutes.
  - [ADR 0016](0016-the-mark.md): the mark and the product color, deep cerulean, in the user-tool layer.
  - [ADR 0018](0018-phone-tablet-and-desktop.md): phone, tablet and desktop, phone rules the base.
  - [ADR 0024](0024-the-month-at-a-glance.md): five marks with words, and color for the day that waits.
- **Amends:** Q-28 and ADR 0016 §2 as the interface uses them (cerulean stays the mark's chip; the interface's one
  action color is smalt); the canvas sections' colors (`GROUP_COLORS`), which no longer paint.

## Context

The maintainer, on 2026-11-21: *"go out and do research on color and UI design, like color theory, what types of
colors to add, looking at the color wheel, how much of each different type of color, the accent color, the action
color […] how to prioritize a hierarchy where the important things are at the top, and you scroll down into the
details that you can expand to explore more into. And then I want you to go page by page, take screenshots, and
critique the current design […] I know the ontology page is just a word salad soup thing. I can't even make heads or
tails of what I'm supposed to do. […] Make sure that your rationality and reasoning carries out throughout the entire
app so it feels like one cohesive thing, not separate pages that are disjointed."*

The review (research notes and measurements in docs/research/ui-design-review.md) found the app legible (every text
color passes WCAG AA in both themes), calm by area (89 to 98% of each first screen neutral, under 3% saturated) and
robust to color blindness (statuses differ by glyph, fill and height). What made it feel like separate pages:

- **No shared parts.** 1,121 class names in about 30 feature namespaces; the text-link style written 17 times; about
  27 button classes; 23 font sizes and six weights; the Month screen alone draws 11 button styles and 24 uppercase
  monospace labels.
- **Seven hues with shifting meanings.** Teal, the brand color ADR 0016 replaced, still meant built, output, ok, new,
  decided and data at once; sections could be painted the status colors.
- **The deepest detail first.** Hashes, rule versions and provenance on the first lines of the Day head, the Ontology
  page, the Data tab and Results.
- **Everything said several times, in house words.** A paused day said five ways in one header; one empty file told as
  two issues with three Decide buttons; the Ontology page 3,053 words long with its map of kinds 2,400 px down.

## Decisions

### 1. Eight principles

Every screen is held to them, and a change to a screen says which it serves.

| | Principle |
|---|---|
| P1 | **One page anatomy**: where am I, the verdict, what needs me, why, details (§5) |
| P2 | **Color is a signal**: about nine tenths neutral, one action blue, status hues only on status (§2) |
| P3 | **One primary action per screen**, and some screens have none |
| P4 | **Two levels, on demand**: the few things that matter first, the rest in place or in the side panel; no third level |
| P5 | **Plain words, once**: the conclusion first, one name per thing, labels a newcomer understands (§6) |
| P6 | **Size and weight make the hierarchy**: seven sizes, three weights, bold rare (§3) |
| P7 | **Same thing, same look**: one kit of components, shared by every page (§4) |
| P8 | **Never color alone**: a glyph and a word on every status; 4.5:1 text, 3:1 controls and marks; links underlined |

### 2. Color roles (Q-344, Q-349)

**Smalt is the only action color** (Q-344): primary button fill, links (underlined), the selected tab, focus. Cerulean
stays in the mark. Teal and violet leave the interface. Every color is a role token in `src/app/page.html`, light and
dark; components use roles, never hues.

| Role | Light | Dark | Job |
|---|---|---|---|
| `--bg` | `#f4f5f8` | `#0f131a` | the page |
| `--surface` | `#ffffff` | `#171c25` | cards, panels |
| `--sunk` | `#eceff5` | `#1e2430` | hover, table heads, chips |
| `--line` | `#d6dbe4` | `#434955` | dividers |
| `--edge-control` | `#7a8295` | `#8a93a6` | input and secondary-button borders (3:1 or more) |
| `--muted` / `--ink-2` / `--ink` | `#5c6375` / `#3f4656` / `#151922` | `#98a1b3` / `#c3c9d6` / `#e8ebf1` | text 3 / 2 / 1 |
| `--action` | `#003399` | `#8fa8ff` | act here |
| `--action-wash` | `#e0e6f3` | `#1d2742` | selected |
| `--bad` on `--bad-wash` | `#a3195b` on `#f8e3ec` | `#ff86b5` on `#3a1828` | paused, needs a decision |
| `--warn` on `--warn-wash` | `#8a5a12` on `#f8eedb` | `#e3b55f` on `#33280f` | unusual |
| `--ok` on `--ok-wash` | `#1d6b3a` on `#e2f0e6` | `#67d391` on `#142a1c` | passed, confirmed |

- **Budgets** for each first screen: at least 85% neutral pixels, at most 3% saturated, at most three saturated hues
  (the action blue and the statuses present). A normal day shows no status color.
- **Charts and drawings**: context in neutral, the series being read in the action blue, anomalies in their status
  color, expected bands as a pale neutral; one drawing for a column's distribution.
- **Canvas sections are frames and labels** (Q-349): a section's stored color (`color`, `GROUP_COLORS`) no longer
  paints it, and the picker is gone. Color on the canvas only ever means status.

### 3. Type (Q-345)

Seven steps for text, on a scale of about 1.2, in Geist; three weights (400, 500, 600). Monospace only for identifiers,
values and code. Labels in sentence case.

| Step | Size / line | Weight | For |
|---|---|---|---|
| caption | 12 / 16 | 400–500 | meta lines, badges, chart labels |
| small | 13 / 18 | 400 | table cells, secondary lines |
| body | 15 / 22 | 400 | sentences |
| title S | 17 / 24 | 600 | card and section titles |
| title M | 20 / 28 | 600 | page sections; the side panel's title |
| title L | 24 / 32 | 600 | the page title |
| figure | 32 / 40 | 600 | key numbers |

Inside an SVG drawing (a canvas card, a chart) two smaller sizes are allowed, 10 and 11 px, as chart labels are.

### 4. One kit of components

Button (primary: filled, at most one in a screen's first view; secondary: outlined, ink text; quiet: text only), link
(action blue, underlined), status badge (glyph, word and role color: Normal, Unusual, Paused, Decided, Not published,
Not judged), chip (filters and metadata, never actions), card, section header (a title and a one-line summary), key
figure, list row, tabs, side panel, banner, disclosure, table, form field, empty state. A page never invents its own.

### 5. The page anatomy

Month, Day, Ontology, Results, Policies, Record and every side panel have the same five bands, in order:

1. **Where am I**: one breadcrumb line (flow › level · the day or month · as of).
2. **The verdict**: the title with one status badge, and one sentence, the conclusion first.
3. **What needs me**: at most one primary button and two secondary ones; nothing when nothing waits.
4. **Why**: three to five facts or one picture.
5. **Details**: sections with a heading and a one-line summary, opened on demand; tables, history and code; hashes,
   provenance and the audit last, behind *Details*.

The decision sheet (options drawn as what readers get, one recommended, the button waking when one is picked) and a
flow's panel are the patterns to copy.

### 6. Words (Q-345)

Plain, conventional names. The views: **Overview** (the month), **Pipeline** (the day and its canvas), **Data model**
(the ontology), **Outputs** (results), **Access** (policies), **Audit log** (the record). One status vocabulary, the
month's: Normal, Unusual, Paused, Decided, Not published, Not judged; "held", "waiting" and "paused" are one state,
Paused, and its call to action is *Decide*. No ADR or question numbers in the product's copy. A glossary goes with the
words phase (§10).

### 7. Calm first, depth on click (Q-346)

Each screen leads with its verdict, one action and three to five facts. Tables, history, code and audit detail open
on demand, at most two levels deep. The audience is **the owner who acts** (Q-343): screens lead with what needs them;
what leadership reads is one tap away and written to be passed on.

### 8. The side panel: five tabs on every card (Q-347)

**Summary, Data, Checks, History, Details**, the same on every card and in that order; an empty one says so in a line.

- **Summary**: the verdict, the issues grouped by cause (one card a cause, its checks as evidence), what happened, one
  Decide where a decision waits. Today's What happened, News and Quality.
- **Data**: rows and columns (one view switch), exploring, the rows left out. Today's Data, Columns, Explore, Dropped
  and Odd rows.
- **Checks**: every check and rule with its mode and today's state, the contract, the models, suggestions behind a
  link. Today's Checks, Rules, Contract, Models and Quality's list.
- **History**: days, versions, compare.
- **Details**: the notebook's code, integrity, provenance, about.

### 9. The Ontology page becomes Data model, the map first (Q-348)

Its first job is to **understand the model**. Its first view: the title, one sentence and a status line (files, made
datasets, kinds of thing, changes this month), then the map of kinds of thing and their relations, large, each kind
with its count and opening in the side panel. Then four views behind one switch: **Map**, **Files and datasets** (a
table with today's status, problems first), **Rules**, **Changes** (the timeline with three marks, the register,
versions and compare, events, the digest and the history for an auditor, the estate's provenance). Items needing
review are a count in the status line, not the head of the page. One vocabulary: kinds of thing and relations.

### 10. The phases (Q-350)

Each its own change, checked with the browser regression at every size, the squint test, the contrast and
color-budget measure, words before the first picture, and ADR 0012's two-minute test.

0. **Decide**: this ADR.
1. **Foundation, no structural change**: the role tokens and the retired hues (§2), sections as frames, links
   underlined, the type scale and weights (§3), the shared button and link styles (§4) over today's class names, and a
   test that holds the style sheet to them.
2. **Shell, Overview and Pipeline on the anatomy** (§5, §6): the header with a menu and the renamed views, Run in the
   Pipeline toolbar, the Overview's key figures, the day head's badge, sentence, button and Details.
3. **The side panel** (§8).
4. **Data model** (§9).
5. **Words**: the glossary and the rename table across every screen; word budgets per screen in the stop sets.
6. **The rest**: Outputs colored by status with the recorded trend, Access transposed, the Audit log with the shared
   marks, the catalogue, smaltkit's `--sk-*` mapped to the roles.

## As built

### Phase 1 (2026-11-21)

The foundation, in `src/app/page.html`, with no change to any screen's structure or words:

- **Colors by role.** The light block and both dark blocks define `--action` and `--action-wash` (smalt),
  `--edge-control` and `--ok-wash` beside the neutrals and statuses that were there. Every `var(--smalt…)` reads
  `--action`; the mark's letters read `--mark-body`. Teal's 71 uses were mapped by meaning: a check passed or something
  confirmed to `--ok` and `--ok-wash`; normal, steady, new, and structure (built cards, outputs, inputs, ports,
  datasets, the policy shield) to neutral ink and `--sunk`; a series being read and what is selected to `--action`.
  Violet's last uses (holiday marks) are neutral. A selected segment, the Recommended chip and the scenes' numbers no
  longer look like primary buttons.
- **Sections are frames.** All seven `.c-*` classes draw the slate frame; the section sheets' color picker is gone
  (`main.ts`); a stored `color` stays in the document and reads as before.
- **Links** are underlined where they sit in text (`.linkish`, and links in a paragraph, item, definition or cell).
- **Type.** Text in 12, 13, 15, 17, 20, 24 and 32 px; drawings (canvas cards, charts, mini charts in table heads) in
  10 and 11, canvas text only ever rounded down so cards fit as they did; weights 400, 500 and 600, the browser's own
  bold pinned to 600 and links at 500. Uppercase labels are set in the interface's sans; their case changes with the
  words (phase 5), since the stop sets read that text.
- **Buttons.** One primary style for the thirteen filled classes (the action fill, a 6 px radius, weight 500), one
  secondary for `.btn` and the outlined ones (surface, ink, `--edge-control`), and quiet (`.btn.quiet`), appended as one
  block at the end of the style sheet over today's class names.
- **The test.** `test/style-system.test.ts` holds the style sheet to the sizes and weights, every role in all three
  token blocks, no teal, violet or smalt reference, no color outside the token blocks but black and white for shadows,
  masks, overlays and print, sections as one frame, links underlined, and the primaries drawn alike.

Measured on the tour at desktop size: the Month screen renders 9 font sizes where it rendered 16 and 20 link-blue
controls where it had 39; a paused day shows two saturated hues (rose on what is paused, smalt on the button) where it
showed four; no text token changed, so contrast is as it was. `npm run check` passes (1,758 tests), and all 38 of the
browser regression's stop sets pass at every size (488 stops).

Left for phase 2: Run is still a second filled button in the header; the header, the page anatomy and the words.

### Phase 4, first part: the map (2026-11-24)

Built before phases 2 and 3, at the maintainer's request ("replace this on the main demo and get rid of the explorer
separation"). The Data model explorer had been reviewed as a prototype beside the demos (`tools/explorer/`, published
at `/explorer/`): fourteen judge rounds and four peer rounds against the owner's own screenshots and seven tests (counts
are icons, links in two to four words, one focus, every block says why it is there, pictures before words, detail on
demand, today is today). Its map is now the Data model view of every demo, and `/explorer/` is no longer published.

- **The tab is Data model** (§6), and the view opens on **the map** (§9): what waits first (the first day still
  waiting, its file and what it holds, ⧗ a count, **Decide ›**), then the kinds of thing with their files and how they
  relate, each relation in a few words, a count of what waits on a kind on its top edge. A kind opens to its register
  and the files about each of its objects, its neighbours at the edges; a file opens to its state on the day, its rows
  against the days before, the outputs that wait on it and what readers see meanwhile, what one row is and what it is
  evidence for. **Search, act or ask** (Ctrl K, ⌘K or "/", §12) opens from any view.
- **Real, not a stand-in.** The map is read from the flow document, the data list's columns and a display file beside
  the flow (`datamodel.json`: short names, the kind a file the ontology ties to none is drawn in, the joins no relation
  names, what each file is evidence for), with the day added from the record: nothing is run for it, and nothing is
  frozen. Decide opens the day's own decision sheet, and a file's rows or an output open its card on the day. The
  prototype's own Decide panel, its simulated decisions and its build from nothing are not brought in.
- **The page as it was, one tap away.** §9's four views are two in this part: **Map** and **Rules and files**, the
  page as it was (the register, versions, kinds over time, each file's rules and proposals). A link to a check, a
  change or the register opens that view; the address stays `#ontology`, so every edit's redraw finds the view.
- **Two style sheets that don't meet.** The renderer is the prototype's own, ported as it was reviewed, in a shadow
  root with its own sheet on the page's roles and type scale; `test/style-system.test.ts` holds that sheet to the same
  sizes, weights and colors. It loads as its own bundle the first time the view opens, so the page's first load is
  what it was. The browser regression reads text inside a shown shadow root.
- **Today is today, truthfully.** The record runs past the day that waits (the tour's last day is Sun Mar 31), so the
  map says the day by its date ("Wed Mar 27 is paused", "Paused on Wed 27", "rows Wed 27"), and "today" only on the
  latest day.

Checked: `npm run check`; the tour's Data model set (`tools/browser/stops/proposals.json`, the map first, then the
proposals as before) at every size, its one run unchanged; every stop set that opened the Ontology view opens Rules and
files (`"view": "ontology/rules"`). Left for phase 4's second part: Rules and files split into Files and datasets,
Rules and Changes, each on the map's components; the map's join matches counted in the engine; the decision sheet in
the prototype's last design (the recommended choice and one button, the rest behind More), once phase 3 has the panel.

**After the owner's first look (the same day).** The owner found the applications' box read as the controls, a
control's list odd as a file coming in, "15 datasets point to it" and "Used by 15 outputs" hard to tell apart, "owned by"
and "runs on" unclear, two bars hard to compare, and Explore rows leaving the map. So:

- **Applications are their register alone; a control's evidence is the control's.** Larkspur's display file draws the
  thirteen feeds and the SBOM inventory among the controls: the catalogue, then "Evidence for each control · a row an
  application", then the files about each control. A row of a feed is still an application, as its rows entry says,
  and a feed checks the applications its rows are (`checks`); a file of findings or exceptions only names one.
- **A link is a sentence about one row, the same at either end.** "Each application is owned by a unit" (Org units),
  "Each application runs on a platform" (Platform list), "Each row is one application in scope" (CMDB, from a feed),
  "Each tag names an application" (Cloud assets). What points to a file is said as the file that points says it, each
  its own card, and a control's evidence is one card ("13 controls check applications", its files named). What a file
  feeds is counted once, on the other side ("Feeds 15 outputs").
- **The day against the days before, so it's clear whether it is normal** (research in
  docs/research/ui-rows-distribution.md; a line of dots hid how many days were alike, and a histogram after it was
  sparse and boxy).
  - The 28 days before are one smooth shape, each day a soft bump, so many days alike stand tall. The usual range
    (their middle eight in ten) is its darker part, named under it.
  - The day itself is a line through the shape in its state's colour, with its weekday above.
  - The words say first whether the day is normal ("✓ Normal", where the checks let it through), then where it sits,
    counted: "like most of the last 28 days", "higher than 27 of the last 28 days".
  - A day the shape is too thin to show is a dot on the line. A file the same on every day says so in words.
- **Rows and outputs beside the map.** Explore rows opens a panel on the map with the file the day's recorded run read,
  fetched and checked against the hash the record keeps for it (nothing run), to filter, sort and keep a value's rows;
  where the day is paused or arrived empty, the day readers see, said first. An output opens beside the map too (held
  or published, its rows, what it is, the files it is built from). Each has **Open in the pipeline ›** for its card.

## Amendment 1: UX beyond the visuals (2026-11-21, Q-351 to Q-354)

The maintainer asked for a deep dive on UX as a whole, not only color, hierarchy and interaction
([docs/research/ux-deep-dive.md](../research/ux-deep-dive.md)). Measured on the tour after phase 1: accessibility strong
(axe-core finds 5 issues in 7 views; focus rings everywhere; Escape returns focus to the card), but a day switch takes
11.7 s with no progress, the first load runs a day nobody asked for, nothing can be searched, a panel can't be linked or
survive a reload, and the brief's link fails silently on the tour. The answers, through the question prompt:

### 11. Show the record, verify behind it (Q-351)

A day opens at once on what the record says of it, marked as the record's, while the browser runs the same
verification it runs today, in the background, with real progress (files pinned, steps run, time elapsed). When it ends
the day says *Verified here*, or flags a mismatch as loudly as a hold. No check is weakened or skipped: what changes is
that the page stops waiting for it before showing anything, and says which it shows. Finished runs are kept for the
session, so a day opened again is instant, and nothing runs on first load until a day is opened.

### 12. Search, and a command palette (Q-352)

A command palette on Ctrl K (Cmd K) and a search field in the header over datasets, columns, rules, days, scenes and
actions, each action with its shortcut shown; a result opens the shared side panel. Data model has its own search box.

### 13. Accessibility held by the regression (Q-353)

axe-core joins the dev dependencies (the maintainer's agreement to a new package), and the browser regression reports
any WCAG 2.2 A or AA violation on a stop as a problem, as it reports a page that scrolls sideways. First the five issues
found are fixed, a skip link is added, and every control is at least 24 px, 44 px on touch screens.

### 14. Testing with simulated judges for now (Q-354)

Each phase is judged on the owner's six jobs (tell me if anything needs me; decide a paused day; understand why and
explain it upward; find a dataset and what depends on it; change a rule safely; prove it to an auditor) by the
repository's judge panels (`tools/judges`), with the two-minute explanation as the headline measure, until real users
are available; the regression holds budgets for what can be counted (time to show a day, steps per job, words before the
first picture, accessibility issues, the color budget).

### 15. The workstreams, attached to the phases

| Workstream | With | What |
|---|---|---|
| A. Time | phase 2 | §11 |
| B. Finding | phase 4 | §12; "used by" lists for impact |
| C. Sharing | phase 3 | the level, card and tab in the address; Copy link; a Brief button on the day head; the brief's link fixed |
| D. Access | first, then the regression | §13 |
| E. Learning | phase 5 | a help panel (the model in one picture, the glossary, shortcuts, the guides); glyphs always with words; the two clocks explained once |
| F. Errors and safety | every phase | no silent dead ends; "Try it first" beside every change; a decision said to be permanent before it is made |
| G. Knowing it works | every phase | §14 |

## Consequences

- The stop sets assert text; the words phase (5) and the panel (3) change strings they check, and update them in the
  same change.
- The test of §10's phase 1 makes a new font size, a raw color outside the token blocks, or a new weight a failure, so
  the vocabulary stays small as features are added.
- A section's stored color stays in the document (old flows read as before) and no longer shows.

## The questions, answered

| ID | Question | Answer |
|---|---|---|
| Q-343 | Who is the first screen for? | The owner who acts, and explains it upward (§7) |
| Q-344 | The action color? | Smalt alone; cerulean in the mark; teal and violet retired (§2) |
| Q-345 | How should the app talk? | Plain names (§6) |
| Q-346 | How dense? | Calm first, depth on click (§7) |
| Q-347 | The side panel's tabs? | The same five on every card (§8) |
| Q-348 | The Ontology page's first job? | Understand the model (§9) |
| Q-349 | Canvas sections? | Frames and labels only (§2) |
| Q-350 | What next? | This ADR, then phase 1 (§10) |
| Q-351 | A day takes 11.7 s to verify: show it first, or verify first? | Show the record, verify behind it (§11) |
| Q-352 | Search? | A Ctrl K palette and header search (§12) |
| Q-353 | Hold accessibility in the regression with axe-core, a new dev dependency? | Yes (§13) |
| Q-354 | Who tests the redesign? | The judge panels for now (§14) |
