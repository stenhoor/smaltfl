# Changes: the opened kind said simply, and the pointed estate without its columns (peer round 4, newcomer)

All in `S/peer/r4/newcomer/app/`, a copy of the merged `S/explore/`. JS is marked `// peer:newcomer (r4)` (or
`/* peer:newcomer (r4) */` inside a long line). CSS is one block at the end of the page's `<style>`, between
`/* peer:newcomer r4 start */` and its end. The patch is `patch.diff`: 47 lines added, 17 removed (after the polish).

## explore.js

| change | where |
|---|---|
| `nbPhrase(k, o)`: a neighbour's link in two to four words, from the neighbour's side, in design's link words (`leadOf`, `sayFrom`), e.g. "owns applications", "hosts applications", "checks applications". Its `tip` is every sentence between the two kinds, with what carries each. A relation the words can't say from the neighbour's side keeps its sentence, with what carries it moved to the hover (the larger estate's Data store, Vendor and Business process). | new, above `layoutKind` |
| `groupSaid(g)`: a section's label without " · joined on <column>". The join becomes the label's hover ("Each is joined to the register on app_id"). | new, above `layoutKind` |
| `layoutKind`: each neighbour says its phrase (`saysOf`), and its slot height is measured from the phrase; the section labels use `groupSaid`. | `slotH`, `labW`, the group node, the neighbour node |
| `stackKind` (below 1100 px: phone and tablet): the opened kind comes first, then its neighbours, each with its phrase. Before, three neighbour cards came first and the paused file fell below a phone's first screen. | rewritten in place |
| The compact kind template: a `phrase` is the neighbour's one line, a `button.ks.kphr` with `data-carry`, so a tap still lights the files that carry the link. Its sentences sit in its `title`. The two lines per relation it replaces are the sentence and the "via … · on column" button. | `krels` in the `kind-compact` template |
| The group label node takes the hover title. | `type === 'g'` |
| The opened kind's head is the estate's "?" (`.mapkey`, the `key` tip). It replaces the marks row, the pointing hint, "Esc steps back" and the minimap. The file level (design's screen this round) keeps its own. | the chrome, `S.level === 'kind'` and `'dataset'` |
| The "?" tip says the kind level's way to point: "Point at a neighbour to light the files that carry its link · Esc steps back". | `TIPS.key` |
| The estate, a kind pointed at: each link is its sentences. The "via … · on column" line shows only once the sentence is tapped (`S.viaOn`). At rest, the short label's tip still says what carries each. Builder's evidence lines while building (`why`, `whyHov`) are untouched. | the link label rows, `v` |

## index.html (the CSS block)

- `.kind.compact .krels button.kphr`: the phrase in the card's own type (500 13px, ink), with a dotted underline to say
  it can be tapped. Smalt on hover, focus and pressed. It gets `pointer-events` back, since the card's text layer has
  none.
- `.node.gname[title]`: a section label with a join takes the pointer for its hover (`cursor: help`).
- **The polish**, all in the same block:
  - 761–1279 px: the bar's pill shows its words (`.waits .wl`), "Today is paused · Decide ›"; the estate name's wrap
    is balanced (`text-wrap: balance`).
  - 761–1099 px: the date steps back (`.tdate`), and the search is its ⌕ alone (`.search .kbd` hidden, `flex: none`), so
    the pill never squeezes it.
  - Phones and desktops are unchanged.

## In this folder, not the app

- `fresh-eyes.md`: the five-second test and the seven tests on the merged screens as they were, written before any
  change.
- `scripts/phone_map_kind.cjs`: the estate and the opened kind at 390×844, with 5-today 01's and 3-explore 04's
  captions. It waits until no transition runs before it snaps. `S/scripts/*.cjs` run unchanged.
- `tools/shot.cjs`: any route at any size, settled; prints words and sideways scroll.
- `tools/kind-checks.cjs`: the opened kind and the pointed estate, driven:
  - the phrases and their hover titles;
  - pointing still lighting the carrying files;
  - a tap on a phrase pinning them;
  - the "?" tip;
  - the section label's hover;
  - a tap on a neighbour card opening that kind;
  - Esc;
  - the pointed estate's sentences;
  - the link tip at rest.
- `tools/light-compare.cjs`: which files light when a neighbour is pointed at, here and in `S/explore/`.
- `tools/probe-phr.cjs`: the phrases' widths and wrapping.
- `tools/bar.cjs`: the top bar at eight widths, on given routes: the pill's visible words, whether it is cut, the views
  strip's room, and the bar's height.
