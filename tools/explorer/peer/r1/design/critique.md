# Critique: design (one visual system)

Measured, not eyeballed: computed styles of every visible element (`work/audit.cjs`), colour area by role from the
screenshots (`work/area.py`), and visible words per region (`work/regions.cjs`), on the snapshots in `peer/snap/`.

## Scores, the product as it is now

easy_to_find=3 · easy_to_do=3 · images_over_words=2 · trust=3 · overall=2

The pieces are good (a map, a usual-range chart, pictures of what readers see, a record with who, when and why). They
are drawn without a system, so every screen reads as a template at full volume.

## Problems, worst first

### 1. No system: sizes, weights, radii and tints are invented one by one

- **Where:** every video; measured on `2-problem-fix/01` (the paused day).
- **What is wrong:** the stylesheet declares 19 font sizes (8 to 24 px, with 8.5, 9.5, 10.5, 11.5 and 12.5), 4
  weights, 18 radii and 84 different `color-mix` tints (13 greys mixed from `--edge` at 9 to 60%). The paused day
  alone renders 17 text sizes. Rules are redeclared up to five times with `!important`. One example: the held chips flip
  between grey and pink five times down the file.
- **What I was trying to do, and why it matters:** read one screen as one designed thing. Without a scale, nothing
  can be the loudest, so nothing is.
- **Principle:** §3.1 (a system first, limit your choices); §6 (seven sizes, three weights); §7 (type scale
  correction, "use tokens", "never invent new colours").

### 2. The map's words are drawn at 8 to 8.5 px

- **Where:** `2-problem-fix/01`, `4a/01`, `4b/01`; at 9.5 px in `1-setup/20`.
- **What is wrong:** beside the Build panel the map is scaled to 0.66 to fit. So 52 words of file names render at
  8.5 px and the kinds' counts at 8 px.
- **What I was trying to do, and why it matters:** find MFA on the map. The map is the product's main picture, and at
  the size the videos show it, its labels can't be read.
- **Principle:** §3.1 (one type scale); §4 (type roles: label small is 11); §7 (readable hierarchy).

### 3. Alarm colour as wallpaper, and the severity isn't in the shape of the screen

- **Where:** `2-problem-fix/01` (serious), `4b/01` (serious), `4a/01` (mild).
- **What is wrong:** on a paused day 12% of the screen is magenta and only 1.5% is smalt. The magenta covers the
  banner's fill, the cause card's fill, 11 pink held chips, the line and the calendar cell. The mild day wears the
  same pink banner as the serious ones, with an amber chip and an amber card: three hues for one state.
- **What I was trying to do, and why it matters:** tell "a little odd" from "a real problem" at a glance, one of the
  owner's four jobs. Today only the 11 px words say it.
- **Principle:** §3.2 (60-30-10: the accent on the one thing that needs attention); §3.3 (hierarchy by de-emphasis);
  §6 (colour by role, never colour alone); §7 (colour tidy; "clear hierarchy", "every state covered").

### 4. The same fact, three to six times on one screen

- **Where:** `2-problem-fix/01`; `4b/01` likewise.
- **What is wrong:**
  - The 11 held outputs are listed twice, on the map's strip and again as panel chips.
  - "11 outputs held" appears four times: banner, chain line, strip and held row.
  - "MFA arrived empty / no rows at all / 0 rows / None at all / Mon 26 had 0 / no rows came" says one fact six times.
- **What I was trying to do, and why it matters:** read the day once. Every repeat costs a reading and buries the one
  number that matters.
- **Principle:** §2 (the same fact said in three places); §6 (plain words, said once).

### 5. A stacked-card feel: boxes in boxes, and border, shadow and fill on one element

- **Where:** the map everywhere; the Build panel in `2-problem-fix/01`, `1-setup/03` and `1-setup/20`.
- **What is wrong:**
  - Map: a kind card has a ring, a deep shadow and a fill, and each file inside it is another bordered box.
  - Day view: the card is boxed inside the panel, the cause is boxed inside the card, and the chart sits inside that.
    The paused day has 37 four-sided borders, 32 borders drawn as inset shadows, and 41 shadows.
  - Setup: a grey "What one row is" box holds white radio boxes, and six bordered gap cards each carry a three-way
    control and a filled "evidence ›" pill.
- **What I was trying to do, and why it matters:** see the groups. When everything is framed, the frames are what
  you see.
- **Principle:** §3.4 (fewer borders; space between groups); §2 (border, shadow and tint on one element); §7 ("cut
  the stacked-card feel").

### 6. Smalt spent on what isn't an action

- **Where:** `1-setup/03` to `05`, `1-setup/19` to `23`.
- **What is wrong:**
  - The kinds a file proposes are drawn in smalt: dashed smalt outlines and smalt titles.
  - Six "evidence ›" links are smalt tonal pills.
  - With "yours", the selected radio and the links, they all compete with the one "Add CMDB ›" button.
- **What I was trying to do, and why it matters:** know what to press next. The action colour should mean "press
  this".
- **Principle:** §3.2 (the accent on the one primary action); §6 (smalt is the one action colour); §7 ("one primary
  per view", "use action/primary").

### 7. The Decide panel puts everything at one volume, and the page behind it still counts

- **Where:** `2-problem-fix/07` and `12`; `4b/06`; `4a/07`.
- **What is wrong:**
  - Four option boxes, each with a picture, a radio, a keyboard-number badge, a boxed recommendation chip and three
    bullet lines.
  - "Done for now · reopens if a file comes" repeats in three of the four.
  - The "Nothing changes until you pick" note sits in a grey box.
  - The pictures pulse twice with a bounce.
  - 828 words are visible, 246 of them in the Build panel hidden behind the sheet, which a screen reader still reads.
- **What I was trying to do, and why it matters:** see the recommended choice and the one button. A decision on the
  record deserves the calmest screen in the product.
- **Principle:** §2 (everything at the same volume); §3.3 (primary, secondary and tertiary actions); §3.10 and §7
  (motion with a job, about 200 ms, ease-out); §6 (one primary action).

### 8. A calendar of 56 numbered boxes to say "one day needs you"

- **Where:** `2-problem-fix/01`, `4a/01`, `4b/01`.
- **What is wrong:** two rows of cells, each with its number and an inset border, are 70 visible words for the
  calendar alone. The legend explains "published" and "not replayed yet", which the tones already show.
- **What I was trying to do, and why it matters:** see where in the month I am, and which days were odd. The same
  picture works as a strip of marks.
- **Principle:** §5 (GitHub and uptime strips: a strip of days, details on hover); §3.6 (declutter).
