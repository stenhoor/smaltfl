# Critique: the builder (a data engineer setting up Larkspur from its files)

What I was doing: reading Larkspur's 22 files one by one, and checking each guess the app made (what a row is, its key,
its kind, what it joins) before adding the file. A wrong join is the most expensive guess I can let through: every
output built on it is wrong, quietly. So I need to see why each file joins what it joins, from which evidence, and to
undo a guess fast.

Worst first.

## 1. Reading one file joins it to things I haven't read, and the reason is out of sight (1-setup/03 to 05)

- **What is wrong.** I press *Read cmdb_apps.csv* and the map draws three kinds and two links at once. Two of the
  kinds say things nobody has read yet: *Organisational unit · 246 units · reports into another unit* and *Platform ·
  46 platforms*. Those counts and that self-link come from `hr_org_units.csv` and `platforms.csv`, which are still
  unread. The reason for the links is under *Refers to · 2*, about 450 px below the fold, after roughly 350 words. It is
  written as a sentence: "owner_team_id → Org units · filled on all 2,401 of its rows, like TM-062 · matched once you
  read hr_org_units.csv · from the data".
- **Why it matters to me.** This is the owner's complaint word for word: "I pick a file and then it's joined up to a
  bunch of things and I don't know why." I can't tell what the data showed from what Larkspur's model assumed.
- **Principle.** §2 "Steps that happen off screen". §3.8 "Show the step: show the evidence at the moment it is used".

## 2. The join itself is never a step (1-setup/16 to 17)

- **What is wrong.** Caption 10 says "the links between files are found in the data". But its snapshot is the files
  list. The read panel that holds the match is on screen for three seconds, and the ring lands on a list 600 px down.
- **What the panel lacks.** It never names the column on the other side. `org_unit_id` appears nowhere; the panel says
  "→ Org units". The match is a grey pill, "all found". No value is shown meeting its twin.
- **What happens next.** The next step's caption announces "the first relation, drawn on the map", as though it had
  been shown.
- **Why it matters to me.** This is exactly the moment I would check. Two id columns can share a format and still mean
  different things.
- **Principle.** §3.8, almost to the letter: "two columns whose values match, drawn as lines from one file to the other,
  then the relation drawn on the map".

## 3. The map's lines don't say what draws them (every Files screen)

- **What is wrong.** The line reads "Applications are owned by units". Which column carries it is behind a tap, *What
  carries this link*, which nothing in the walkthrough presses.
- **Why it matters to me.** During setup the line is the thing I am building. Its label should be its columns.
- **Principle.** §3.6 "Label directly, not in a legend". §3.8.

## 4. People arrive with a relation from a file not read (1-setup/17)

- **What is wrong.** After *Add Org units*, Person is drawn with "245 people · managed by another person" and the line
  "People work in units". That relation comes from `hr_people.csv`'s own `org_unit_id`. Only `leader_id` in
  `hr_org_units.csv`, the file just read, points at people.
- **Why it matters to me.** The map mixes what I confirmed with what it assumed, and gives no mark to tell them apart.
- **Principle.** §2 "Steps that happen off screen". The brief's own rule: use only facts the screen can back.

## 5. Changing a guess is a 13 px checkbox below the fold, and its effect is out of view

- **What is wrong.** Each link's checkbox sits at the start of a dense row 450 to 700 px down. Its effect, a line
  leaving the map, happens 600 px to the left. Who proposed the link is the grey word "Larkspur's pick" at the bottom of
  the row.
- **Why it matters to me.** A guess I can't undo in one obvious tap is one I end up accepting without looking.
- **Principle.** §3.3 primary, secondary and tertiary actions. §3.8 "let the person confirm it".

## 6. One fact said three times: the key (1-setup/03)

- **What is wrong.** "app_id: 2,401 different values, none blank", then "all 2,401 unique" beside the radio, then
  "✓ Looks right: no row repeats it".
- **Principle.** §2 "the same fact said in three places".

## 7. A paragraph explains tags that explain themselves (1-setup/03)

- **What is wrong.** This paragraph is 32 words: "Each guess says where it came from: from the data, Larkspur's model
  or yours. Where the data and the model differ, the model's is set and the data's shown beside it." Each guess
  already carries its own tag.
- **The tags don't agree.** One thing has four names: *Larkspur's model*, *Larkspur's pick*, *from the data*,
  *found in the data*.
- **Principle.** §2 "words doing a picture's job". §6 "Plain words, said once".

## 8. The same links in three blocks, in three wordings (any file read after the first)

- **What is wrong.** Exceptions shows *Links, at a glance* ("Exceptions → about → CMDB"), then *Refers to* ("Applications
  have exceptions to controls · app_id → CMDB · 268 exception rows name 241 applications"). Org units adds
  *Referred to by* as well.
- **What it costs.** Three blocks between me and the one thing I came to check.
- **Principle.** §2 "the same fact said in three places". §7, Memorisely: "cut the stacked-card feel".

## Scores, as the product is now

| | 1 to 5 | Why |
|---|---|---|
| easy_to_find | 3 | The Build panel and its five steps are clear. The links sit below the fold |
| easy_to_do | 3 | One button walks the files. Changing a link is hard to find and its effect is out of sight |
| images_over_words | 2 | The join is a sentence. No value is ever shown meeting its twin |
| trust | 2 | The map shows counts and relations from files not read. The column on the other side is never named |
| overall | 2 | It works, but the step I care about most happens off screen |
