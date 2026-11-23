# Fresh eyes on Ctrl K, as merged (before any change)

Builder, round 4. Written before touching the app. S = `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`.

Sources:

- the steps in `S/peer/snap5/5-today/04.png` to `07.png`;
- 3-explore's Ctrl K step. Its snapshot (`snap5/3-explore/09.png`) is taken before the palette opens, so the results
  come from the r38 video (`work/frames/full-61.png` for "m", `full-63.png` for "mfa");
- the merged app, every state captured as it is by `work/ask.cjs` (`work/before/*-1440.png`, `*-390.png`).

Focus sentences:

- **Answers** (round 3): "The answer, as a picture of today against usual."
- **Look inside** (round 3): "What this file is and whether it's fine today."
- **Search results**: none was set in round 3. I hold it to the step's own caption, "Ctrl K finds any file, column or
  value, and answers questions": what you typed, found, the best match first. Opened empty, it is today's one thing to
  do, then the questions worth asking.

## 5-today 04, "Ask why it paused": the palette opened, nothing typed yet (`before/a-empty-1440.png`)

The snapshot itself shows the map before Ctrl K. What the user sees next is this palette, 177 words.

**5 seconds:** a long list, ten rows in three groups, with "Decide on Wed Mar 27…" picked. Beside it a small two-day
picture, then four blocks of text and a "Your choices" list. I'd press ↵ to decide. The one thing is there, but it is
buried.

| # | test | as merged |
|---|---|---|
| 1 | Counts are icons | **fail**: "11 outputs wait" is a sentence three times: "Access reviews arrived empty · 11 outputs wait", "11 outputs wait, in 4 kinds" and "⧗ 11 outputs wait · readers see Tue Mar 26 until you decide". The banner behind says "⧗ 11 waiting". |
| 2 | Links, two to four words | pass (none) |
| 3 | One focus | borderline: Decide is first, but ten rows and a five-block preview compete with it |
| 4 | Every block answers why | **fail**: "See what's built from it" says what "Which outputs wait?" says, two rows for one fact. "Draft a request for the file…" and "See Tue Mar 26's rows" are steps inside deciding; both are already buttons on "Why is today paused?" and in Decide. The preview's "Your choices" repeats the Decide panel. |
| 5 | Pictures before words | borderline: a picture, then four text blocks |
| 6 | Detail on demand | **fail**: the checks that stopped it and all four choices are spelled out before any tap |
| 7 | Today is today | **fail**: "Decide on **Wed Mar 27**…", the picture names the paused day "**Wed 27**", and "The last good day, while **Wednesday** is paused" |

## 5-today 05, "why is wednesday paused" (`snap5/5-today/05.png`)

**5 seconds:** a crimson stub at 0 against a long grey "usual 1,435". Then "Access reviews arrived empty ⧗ 11 ›" and
Full answer ›. I'd press Full answer, or tap ⧗ 11. That matches the focus.

Tests 1, 2, 3, 5, 6 and 7 pass. Test 4 is borderline: the question is said three times, typed, as the picked row "Why
is today paused? Ask ↵", and again as the preview's heading "Why is today paused?" right beside it.

## 5-today 06, "how has access reviews been this month" (`snap5/5-today/06.png`)

**5 seconds:** the strip with one amber diamond, "warned Sun 10", and the red pause at its end. "25 fine · 1 warned ·
paused today". I'd read the month as fine but for one warning and today. That matches.

7/7, with the same question-twice nit as 05.

## 5-today 07, look inside MFA (`snap5/5-today/07.png`)

**5 seconds:** MFA, "✓ Fine today", two equal bars (2,329 against 2,322), then what it is. I'd press ↵ to open it. That
matches the focus. 7/7.

## 3-explore, "Ctrl K finds any file…": the search results (`work/frames/full-61.png`, `full-63.png`; `before/e-*.png`)

**"m", one letter, 231 words.** 5 seconds: "Decide on Wed Mar 27…" on top, though "m" matches it only through "Mar". Two
separate **Do** headings, split by **Help**, then Go to. I'd keep typing. That doesn't match "the best match first".

- Test 1 **fails**: the same "11 outputs wait" sentences.
- Test 3 **fails**: no best match first.
- Test 4 **fails**: "Do" is said twice; the groups come apart.
- Test 7 **fails**: "Wed Mar 27".

**"mfa", 132 words.** 5 seconds: MFA picked, with its look-inside preview. I'd press ↵. That matches. But under it come
MFA's five columns, each "Column of MFA · …" with its type. They match only through their file's name, and the look
inside folds the same columns into "Its columns · 5", one Tab away.

- Test 6 **fails**: columns shown, not behind a tap.
- Test 4 is borderline: "Column of MFA" is said five times.

## My own questions (`before/f-*`, `g-*`, `h-*`)

**"what feeds coverage"**: no answer. The preview says "Answered from this page's data", and ↵ says "That isn't
something this page can answer yet". Yet the page knows the answer: 18 files have Coverage among what they build, and
it waits today on Access reviews. For the builder ("what depends on what") this is the question.

- Test 3 **fails**: there is no answer to focus on.
- Test 5 **fails**: the reply is words only.
- Test 4 **fails**: the four suggestions it offers are about something else.

**"what is mfa"**: the preview is one sentence cut off in a box, "The identity provider, the share of users registered
…", with no state, no number and no picture. The look inside, one Tab away, shows "✓ Fine today" and the two bars. The
full answer is all words ("2,329 rows today · 5 columns · joins CMDB, Control catalogue · builds 11").

- Test 5 **fails**: words only, cut off.
- Test 3 is borderline.

**"how has tls been this month"**: the strip's two day labels print on top of each other at both sizes. "warned Mon 18"
and "decided Thu 21" read "wa◐decided Thu 21".

- Tests 3 and 5 **fail**: the picture's own words can't be read.
- The rest pass. The line "25 fine · ◆ 1 warned · ◐ 1 decided" is right.

## What fails, in one list

1. The palette opened empty (and on a letter): counts as sentences, two rows for one fact, steps of deciding offered
   up front, a preview that spells out the Decide panel, "Wed Mar 27" for today, and "Do" said twice.
2. Search for a file: its columns listed as results.
3. "What is X?": no picture.
4. "What feeds X?" for an output: no answer.
5. A month with two odd days close together: the labels collide.
6. (The nit) An ask's preview repeats the question in its heading, beside the row that already says it.

Answers 05 and 06 and the look inside (07) pass: nothing to change in them but the nit.
