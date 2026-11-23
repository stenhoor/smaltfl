# dq on the owner's fix: Decide on the estate (5-today step 12)

**Verdict: agree.**

- **Focus sentence:** "Pick what readers see: the recommended choice is ready."
- **Looked at:**
  - after: `S/peer/r3/owner/snap/5-today/12.png`;
  - before: `S/peer/snap4/5-today/12.png`;
  - More opened: `png/5-today-12-more.png`;
  - phone: `png/5-today-12-phone.png`;
  - the same panel in `snap/2-problem-fix/07.png` and `snap/4a-odd-but-ok/08.png`.

## 1. Five seconds, before reading anything

**What I noticed first:**

- the blue-framed RECOMMENDED card beside a grey NOW card, with an arrow between them;
- under both cards, readers see Tue Mar 26;
- the blue button "Keep all of Tue Mar 26".

**What I'd do:** tap the button, to keep Tuesday for readers while the empty file is chased.

**Matches the focus?** Yes.

## 2. The seven tests

| # | test | result | note |
|---|---|---|---|
| 1 | Counts are icons | pass | The 11 held outputs are "⧗ 11", a pill; the list is in More. |
| 2 | A link is two to four words | pass | There are no relation links on the panel. |
| 3 | One focus | pass | The Recommended card is the one smalt frame, and its button is the one filled control. |
| 4 | Every block answers "why is this here?" | pass | Each block says what happened, what readers see now and after, who recommends it and why, what goes on record, or how to decide. The rest is folded into More. |
| 5 | Pictures before words | pass | Two pictures of the same two days, each with one line under it. |
| 6 | Detail on demand | pass | First comes the file, its state and one number. The other choices, the checks, the month and the 11 outputs wait behind More. |
| 7 | Today is today | pass | "What should readers see **today**?", with "Wed Mar 27" small. |

**Nit on test 7:** the pictures still name the current day by date, as a column head "Wed 27" the same size as
"Tue 26". When design's Today helper lands, that column should read "Today" too.

## 3. Every number

Each figure was checked against the data the preview runs on (`model.json` for the estate, and the build's model from
each seed).

| journey | figure | true? |
|---|---|---|
| 5-today | "0 rows, usually about 1,435" | yes: `usualN([1433,1437])` |
| 5-today | ⧗ 11 | yes: 11 builds, all waiting |
| 5-today | readers on Tue Mar 26 | yes |
| 2-problem-fix | "0 rows, usually about 2,314" | yes |
| 2-problem-fix | ⧗ 11 | yes |
| 2-problem-fix | readers on Sun Feb 25 | yes |
| 4a-odd-but-ok | "262 rows, usually about 269" | yes |
| 4a-odd-but-ok | "inside Larkspur's ±5%" | yes: −2.6% |
| 4a-odd-but-ok | ⧗ 9 | yes |

**What goes on record is said before the tap:** "you · smaltfl's reading, agreed".

## 4. The one change I'd still like (not a condition)

**Put the recommended choice's cost on its card.** Before, Keep carried "✕ The 11 outputs show Tuesday, other files
included". Now that line is only in More.

- "Keep **all** of Tue Mar 26" and "👁 Tue Mar 26" imply it.
- But a decision made on record should show what it costs before the tap: in those 11 outputs, the other files' data is
  Tuesday's too.
- It takes one line on the Recommended card, in the panel's own words.

**Smaller:** "smaltfl's reading: One whole day for readers" is true but cryptic for a first look. "An empty file is a
fault here" would say why in the data's terms.
