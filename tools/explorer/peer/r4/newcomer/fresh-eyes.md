# Fresh eyes on the merged screens, before changing anything

Written from `S/peer/snap5` and the merged app as it is (`S/explore/`, copied to `app/` and not yet touched), at
1440×900, and live at 390×844, 820×1180 and 1180×820 (`before/`). Focus sentence (round 3's): "Today one file paused;
this is what waits on it."

Five of the seven steps are one frame: 5-today 01–03 and 3-explore 01–02 are the estate at rest, because each caption
is snapped before its step's pointer moves. 3-explore 03 is the estate with Control pointed at. 3-explore 04 is the
opened kind, Application.

## The estate at rest (5-today 01–03, 3-explore 01–02)

**Five seconds:** the pink line first: "Today is paused Wed Mar 27 · Access reviews arrived empty · ⧗ 11 waiting", with
Decide › at its end. Then the one red chip, Access reviews, inside Application. I'd press Decide ›, or tap ⧗ 11 first.
This matches the focus sentence.

| # | test | as it is |
|---|---|---|
| 1 | Counts are icons | pass: ⧗ 2, ⧗ 5, ⧗ 1, ⧗ 3 and "⧗ 11 waiting", the list on hover, focus or tap |
| 2 | A link is two to four words | pass: made up of, owns, runs on, checked by, approves exceptions to ("owns" is one word, and reads right on its line) |
| 3 | One focus | pass: the banner, with one filled button |
| 4 | Every block says why | pass: the legend and the hint live behind "?" |
| 5 | Pictures before words | pass: the map; the banner is one line |
| 6 | Detail on demand | pass: sentences on hover |
| 7 | Today is today | pass: "Today is paused", the date small |

## The estate, a kind pointed at (3-explore 03)

**Five seconds:** Control lights up in blue, and its three links turn into sentences, each with a second line ("via
Exceptions · on app_id", "via Findings, TLS and 11 more"). The rest fades. I'd read the sentences. That matches the
step's caption, and the banner still carries the focus.

All seven pass: full sentences on hover are allowed. **The last thing I'd question:** the second lines name a dataset
and a column (`app_id`, `approver_id`) as the pointer merely passes over. That is the most technical text left on the
estate, and a link's own tip already says what carries it.

## The opened kind, Application (3-explore 04), never in a round of its own

**Five seconds:**

- **What I see first:** the white Application card with its 15 file chips, Access reviews in red, "‖ 1 paused" and ⧗ 5.
- **What pulls my eye away:** the three neighbour cards, two sentences each, with blue underlined lines under them ("via
  CMDB · on owner_team_id"). Above, a row of marks, a hint ("Point at a neighbour to light the datasets that carry it"),
  "Esc steps back", and a little "Estate" diagram.
- **What I'd do:** tap Access reviews.
- **Against the focus sentence:** "Today" is only the small pill top right. On a phone the three neighbours come first,
  and Application's paused file is not on the first screen at all (`before/kind-phone.png`).

| # | test | as it is | quoted |
|---|---|---|---|
| 1 | Counts are icons | pass | ⧗ 5, "‖ 1 paused", the dataset squares |
| 2 | A link is two to four words | **fail** | The neighbour cards say full sentences at rest: "Applications are owned by units", "Applications run on platforms", "Platforms are tagged with applications", "Applications have exceptions to controls", "Controls check applications" |
| 3 | One focus | **fail on phone and tablet** | Below 1100 px the three neighbours stack first; on a phone the opened kind starts halfway down and its paused file is below the fold. At 1440 it passes. |
| 4 | Every block says why | **fail** | Four blocks repeat what is elsewhere. The marks row ("paused · waits on it · warned · planned: no file due yet") and the hint are what the estate keeps behind "?". "Esc steps back" repeats the breadcrumb. The "Estate" diagram repeats the breadcrumb and the neighbour cards. |
| 5 | Pictures before words | **fail** | The neighbour cards are two wrapped sentences each |
| 6 | Detail on demand | **fail** | Datasets and columns at rest: "via CMDB · on owner_team_id", "via Cloud assets · on app_tag", "via Exceptions · on app_id", and the section label "joined on app_id" |
| 7 | Today is today | pass | "Today is paused Wed Mar 27 · Decide ›" in the bar at 1440. Below that it shrinks to "‖ Decide ›", which names no day; I'd question it but it shows no wrong date. |

Words: 168 at 1440 (`words-r38.txt`).

## Also seen, outside the seven tests

At 820×1180 the top bar clips its own nav: "Audit l…" on the estate, and "Acces…" at the kind level, where the Today
pill joins it (`before/bars.png`). The bar is every screen's, so I note it here rather than reach into it.

## So the fix is

- **The opened kind:**
  - each neighbour says one 2–4-word link in design's words, the sentences and what carries them behind a hover or a tap;
  - the marks row, the hint, "Esc steps back" and the diagram fold into the estate's "?";
  - "joined on app_id" moves to a hover;
  - on a phone and tablet the opened kind comes first.
- **The pointed estate:** the "via … · on column" lines leave the hover; the link's tip keeps them.
