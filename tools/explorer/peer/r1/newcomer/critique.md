# Critique: the newcomer

I am from the business, I have never seen smaltfl, and I learn it from these five videos. My test for every step: could I
say why it happened, and could I follow it with the caption hidden?

## Scores, as it is now

| easy_to_find | easy_to_do | images_over_words | trust | overall |
|---|---|---|---|---|
| 3 | 3 | 2 | 3 | 2 |

The navigation, the banner's Decide button and Ctrl K are easy to find, and setup has one main button per step. But half
the steps only make sense with the caption on, and the screens say things in words that the pictures beside them could
show.

## Problems, worst first

### 1. One click draws three boxes, and the reason is off screen

- **Where:** 1-setup, steps 03 to 06 (one screen, held for four captions).
- **What is wrong:** pressing *Read cmdb_apps.csv* draws Application, Organisational unit and Platform at once, dashed,
  with two lines between them. The only reason is *Refers to · 2* at the bottom of the panel, below the fold. The two
  extra boxes show counts from files nobody has read yet ("246 units · 1 file", "46 platforms · 1 file"), and the map's
  key explains the dashes in 30 words.
- **What I was doing, and why it matters:** I wanted to know what reading one file did. This is the owner's own
  complaint: "I pick a file and then it's joined up to a bunch of things and I don't know why."
- **Principle:** §1; §2 "Steps that happen off screen"; §3.8 "Show the step".

### 2. A file, opened, shows no data

- **Where:** 3-explore, step 05 (TLS).
- **What is wrong:** eight column names in monospace, each with a definition and a type tag ("key · text",
  "code · text", "date · text"), and not one value. What one row is sits far above, on a dashed line: "one row per
  application in scope / in scope: exposure: internet or partner · lifecycle: live or retiring".
- **What I was doing, and why it matters:** I wanted to see what is in the file. Instead I had to guess what a row, a key,
  "code · text" and "in scope" mean.
- **Principle:** §3.6 "Show, don't tell"; §3.9 "Real content"; §2 "Words doing a picture's job".

### 3. The same fact, ten times, about the wrong file

- **Where:** 3-explore, steps 05 and 06.
- **What is wrong:** beside TLS, "10 outputs use it" lists ten outputs, each with a two-line description and the word
  "waits": about 150 words. The hold is not TLS's: Access reviews is the file that paused. Reading "waits" ten times
  beside TLS, I took TLS for the problem.
- **Principle:** §2 "The same fact said in three places"; §3.3 "Hierarchy by de-emphasis"; §3.7 "Progressive disclosure".

### 4. The caption says one thing, the screen shows another

- **Where:** 3-explore, step 08.
- **What is wrong:** "Its rows… opened on the column you tapped." The rows open in file order: app_id, endpoint,
  ingress, and so on. Status, the column I tapped, is off the right edge. *Explore rows* on the card, pressed while the
  column's sheet is open, doesn't carry the column. Only the sheet's own button does.
- **Principle:** §2 "Steps that happen off screen"; §3.5 "One focal point per screen".

### 5. Marks without a word beside them

- **Where:** 3-explore, step 01, and every map.
- **What is wrong:** "⧗ 2 ›" and "⧗ 5 ›" sit on the cards' corners, the tiny squares in "■■■ 3 datasets" are never named,
  and the dashed *SBOM inventory* chip has a small circle. A key at the top ("paused · waits on it · warned · planned:
  no file due yet") names marks, not what the numbers count. On a file's page it still lists marks the page doesn't show.
  The hint "Point at a kind, or Tab to one · tap a sentence to see what carries it" uses "kind" and "carries" before
  either is explained.
- **Principle:** §3.6 "Label directly, not in a legend"; §5 (Carbon: shape, colour and a word); §6 "Never colour alone".

### 6. One thing, several names

- **Where:** all five videos.
- **What is wrong:**
  - A file is a "file" in setup ("each chip in it, a file about that kind"), a "dataset" in explore ("15 datasets",
    "+ Add a dataset") and a "chip" in the key.
  - One file has three names: hr_org_units.csv, "Org units" and, for its kind, "Organisational unit".
  - "Paused", "held", "waits", "stops" and "pauses" all name one state.
  - "Outputs" and "readers" appear before anything introduces them.
- **Principle:** §6 "Plain words, said once"; §3.1 "A system first".

### 7. Section labels in the engineer's words

- **Where:** 3-explore, step 04 (Application opened).
- **What is wrong:**
  - The section labels read "THE REGISTER: EVERY APPLICATION" and "EVIDENCE ABOUT EACH APPLICATION · JOINED ON APP_ID · 13".
  - The neighbours say "via CMDB · on owner_team_id".
  - The hint says "Point at a neighbour to light the datasets that carry it".
- **Principle:** §6 "Plain words"; §3.3 "Labels are a last resort".

### 8. Two step strips at once

- **Where:** 1-setup, step 01.
- **What is wrong:** the Build panel opens with a four-picture strip (files arrive, each is checked, reports go out, a
  bad file holds them). Directly above it are five numbered tabs (Files, History, Checks, Outputs, Days), each with its
  own subtitle. Then come a paragraph and 21 file names. I couldn't tell which strip shows where I am.
- **Principle:** §3.5 "One focal point per screen"; §2 "Everything at the same volume".
