# Fresh eyes on the estate map, its banner and Today, and an opened kind

**Screens:** 5-today 01–03 and 3-explore 01–04, from `S/peer/snap5` (round 3's five fixes merged). **Focus sentence**
(round 3's): "Today one file paused; this is what waits on it." I didn't build these screens. I tested them as they were
before changing anything (`fresh-eyes.md`), then fixed only what failed, subtracting first.

S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.

## What fresh eyes found

| screen | as it was | what failed |
|---|---|---|
| The estate at rest (5-today 01–03, 3-explore 01–02: one frame, since each caption is snapped before its pointer moves) | 7/7 pass. Five seconds: "Today is paused · Access reviews arrived empty · ⧗ 11 waiting · Decide ›", then the red chip. | nothing |
| The estate, a kind pointed at (3-explore 03) | 7/7 pass | nothing; the last thing I'd question is the second line under each sentence, which names a dataset and a column ("via Exceptions · on app_id") as the pointer merely passes |
| **The opened kind, Application (3-explore 04)** | 2/7 pass | **2** (the neighbours say full sentences at rest), **3** (on a phone and tablet the neighbours come first and the paused file is below the first screen), **4** (a marks row, a hint, "Esc steps back" and an "Estate" diagram each repeat what the breadcrumb, the cards or "?" say), **5** (the neighbours are two wrapped sentences each), **6** (columns and joins at rest: "via CMDB · on owner_team_id", "joined on app_id") |

## What changed (subtract first)

### The opened kind

1. **Each neighbour says one link in two to four words**, from its own side, in design's link words, so the map and
   the kind speak one vocabulary: Organisational unit "owns applications", Platform "hosts applications", Control
   "checks applications".
   - The sentences, and what carries each, are the phrase's hover.
   - A tap on the phrase still lights the files that carry the link, as the "via" button did.
   - A relation the words can't say from that side keeps its sentence, but its "via … on column" line moves to the
     hover too (seen on the larger estate).
2. **The head is the estate's "?"**. It replaces the marks row, the pointing hint, "Esc steps back" and the minimap:
   - the breadcrumb says where you are;
   - the cards say what is around;
   - "?" holds the marks, how to point here ("Point at a neighbour to light the files that carry its link") and Esc.
3. **"joined on app_id" moves to the section label's hover.** The label reads "Evidence about each application · 13".
4. **On a phone and tablet the opened kind comes first**, with Access reviews on the first screen. Its neighbours
   follow.

### The pointed estate (the smallest change for the last thing I'd question)

Pointed at, a link is its sentences. "What carries it" is the short label's tip at rest, as on the rest of the map, or
a tap on the sentence. Builder's evidence lines while building are untouched: no 1-setup step changed.

### Not changed

- The estate at rest.
- The banner and Today (design's helper).
- The file view (design's this round): it keeps its minimap and Esc hint.

## The seven tests, after

| # | test | estate | opened kind | how |
|---|---|---|---|---|
| 1 | Counts are icons | pass | pass | ⧗ 5, ⧗ 2, ⧗ 1, ⧗ 3 and "‖ 1 paused" each list on hover, focus or tap; the dataset squares |
| 2 | A link is two to four words | pass | **pass** (was fail) | "owns applications", "hosts applications", "checks applications". The sentences are on hover. |
| 3 | One focus | pass | **pass** (was fail on phone) | The Application card and its one red file. On a phone it is first, Access reviews on the first screen. |
| 4 | Every block says why | pass | **pass** (was fail) | See the purpose audit. The four repeating blocks are folded into "?" or gone. |
| 5 | Pictures before words | pass | **pass** (was fail) | The card's files are the picture. Each neighbour has one short line. |
| 6 | Detail on demand | pass | **pass** (was fail) | Sentences, carriers and the join are on hover; a tap lights the carrying files. No column name at rest anywhere on these screens. |
| 7 | Today is today | pass | pass | "Today is paused Wed Mar 27" with the date small, in the banner, and in the bar's pill on the kind |

## Before and after

| step | before (`S/peer/snap5/…`) | after (`S/peer/r4/newcomer/snap/…`) | visible words |
|---|---|---|---|
| 5-today 01–03, 3-explore 01–02, the estate at rest | `5-today/01.png` | `5-today/01.png` (pixel-identical) | 119 → 119 |
| 3-explore 03, a kind pointed at | `3-explore/03.png` | `3-explore/03.png` | 143 → **127** |
| 5-today 04 and 08, the same map with a kind still pointed at | `5-today/04.png` | `5-today/04.png` | 163 → **138** |
| **3-explore 04, the opened kind** | `3-explore/04.png` | `3-explore/04.png` | 168 → **95** |
| the opened kind, phone 390×844 | `S/peer/r4/newcomer/before/kind-phone.png` (live) | `S/peer/r4/newcomer/phone/kind.png` | 83 → **63** |
| the estate, phone | `before/estate-phone.png` | `phone/estate.png` | 72 → 72 |

- **How the phone renders were made:** `render.cjs` on `snap/phone-map-kind/01.html` and `02.html`, recorded at phone
  size by `scripts/phone_map_kind.cjs`. On a phone the page lays the kind out itself, so a desktop snapshot at 390 px
  would show the desktop's positions.
- **Sideways scroll:** none at 390, 820, 1180 or 1440.
- **Also checked:** `shots/kind-tablet.png`, `kind-wide-tablet.png`, `kind-dark.png`, and the larger estate's opened
  Application (`shots/big-kind.png`), where 13 neighbours say their few words.

## My five-second test (after, cold, 3-explore 04)

- **What I notice first:** the white Application card with its files, one of them red (Access reviews, paused), "1
  paused" and ⧗ 5 at its corner, and "Today is paused · Decide ›" at the top. Around it, three cards say in a few words
  what each is to applications: owns, hosts, checks.
- **What I'd do:** tap Access reviews, or Decide.

That matches "Today one file paused; this is what waits on it".

## Purpose audit (the opened kind, after)

| block | why it's here |
|---|---|
| Top bar: estate, views, search | where I am; Ctrl K to find or ask |
| "Today is paused Wed Mar 27 · Decide ›" | today's state, and the one thing to do |
| Data model › Application | where I am; the way back |
| ? | what the marks mean; how to point here; Esc |
| + Add a dataset | add a file the model lacks |
| Application, "2,416 applications · 15 datasets" | what this kind is and holds |
| ‖ 1 paused | its state today |
| ⧗ 5 | what of it waits; the list on hover or tap |
| "The register: every application", CMDB and SBOM inventory (dashed: planned) | which file lists every application |
| "Evidence about each application · 13", 13 files | the files about each application; the red one is today's pause; the join on hover |
| Each neighbour: name and count, its files as squares | what is around, and how big |
| ↻ reports into another unit | how the kind relates to itself |
| "owns applications", "hosts applications", "checks applications" | how it relates here; a tap lights the files that carry it, a hover gives the sentences |
| ⧗ on a neighbour | what of it waits |
| The lines from the card to each neighbour | that they are joined |

**Gone or folded:**

| block | where it went |
|---|---|
| The marks row | "?" |
| "Point at a neighbour to light the datasets that carry it" | "?" |
| "Esc steps back" | "?" |
| The "Estate" minimap | gone: the breadcrumb, and the neighbour cards |
| Five sentences and five "via … · on column" lines | the phrases' hover |
| "joined on app_id" | the label's hover |

## Seen, and left

- **The tablet bar (820 px).** The nav is a sideways strip below 1280 px by design, so "Acces…" and "Audit l…" are its
  edge. A fade at that edge would say there is more. It is every screen's bar, so I leave it to the integrator.
- **The bar's pill below 1440 px.** It shrinks to "‖ Decide ›" and names no day. That is design's helper, and it shows
  no wrong date.

## Works

- **All six walkthroughs on this copy, scripts unchanged, no page errors, each exits 0** (`logs/`):
  - `5-today`, `3-explore` and `1-setup` in snapshot mode;
  - `2-problem-fix` (seed-feb26), `4a-odd-but-ok` (seed-mar2-rows2) and `4b-outlier` (seed-mar21).
- **Words per step:** 50 steps of 1-setup, 3-explore and 5-today compared with `S/peer/words-r38.txt`
  (`work/words-after.txt`). Only the four steps above changed, all lower.
- **`tools/kind-checks.cjs`, every check lands:**
  - the phrases and their hover sentences;
  - pointing at Control still lights the 14 files that carry its link, as in `S/explore/` (`tools/light-compare.cjs`);
  - a tap on "checks applications" pins them without leaving the kind;
  - "?" says the marks and how to point here;
  - the section label's hover;
  - a tap on Platform's card opens Platform, whose one neighbour says "runs on platforms";
  - Esc returns to the estate;
  - the pointed estate shows its sentences, and the link tip at rest still says what carries each.
- **The patch:** `S/peer/r4/newcomer/patch.diff`, 42 lines added and 17 removed.

## Polish: took / declined

The owner's nit, after both reviewers agreed: below 1440 px the bar's pill said only "Decide ›", so "Today" was lost on
a tablet.

### Took

- **The pill keeps its words on a tablet (761–1279 px):**
  - from 1100 px: "‖ Today is paused Wed Mar 27 · Decide ›", the date small, on one line at 1180;
  - below 1100 px: "‖ Today is paused · Decide ›", at 820 and 761.

  The text is design's `smDay` output. It was hidden below 1280 px, and a CSS rule in my block now shows it on tablets.
  Phones keep "‖ Decide ›", since their bar has no room.
- **Nothing squeezed to make room:**
  - Below 1100 px the search is its ⌕ alone, as on a phone; Ctrl K still opens it. Before, the wider pill pushed its
    "Ctrl K" past the box's edge.
  - The estate's name wraps evenly where it must ("Larkspur / estate ▾"), as it already did at 820, rather than leaving
    its ▾ alone on a line.

At 1180 and 1024 the bar is one line, with every view showing. At 820 it is as tall as before; the views strip, which
scrolls sideways below 1280 px by design, shows four views. See `shots/bars-after.png` (1180, 1024, 820, 761) against
`shots/bars-compare.png`, and `shots/kind-tablet.png`, `shots/kind-wide-tablet.png`.

### Declined

- **Keeping the estate's name on one line:** it squeezed the search box at 820.
- **Hiding the views on a tablet:** that is every screen's navigation.

### Left alone

The file view's chrome. design gave it the opened kind's "?" head in its revision, and I re-checked it: agree.

### Works

- `5-today` and `3-explore` re-run in snapshot mode: no page errors.
- The desktop frames are unchanged (5-today 01 pixel-identical; 3-explore 04 at 95 words).
- `tools/bar.cjs` at 1440, 1280, 1180, 1099, 1024, 820, 761 and 390, on the opened kind and a file: the pill is never
  cut, nothing scrolls sideways, and there are no page errors.

**Patch:** `patch.diff`, 47 lines added and 17 removed.

