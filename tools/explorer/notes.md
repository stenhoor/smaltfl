# What making the videos showed

## 1. Set up from nothing
- Worked: reading a file proposes its key and kind; the map previews what Add adds, dashed; a rule of your own is
  tried on Feb 1's file before it is added ("345 of 2,401 blank today"), so choosing Warn over Pause is an informed call.
- Hard: the suggested rules were a wall of ten near-identical rows ("is one of… every row today" seven times), and
  "Add a rule of your own" sat below them. Fixed: one "Known values in 7 columns" row with "which ›", and the form first.

## 2. A problem and its fix (MFA arrives empty)
- Worked: the 28-day chart puts "about 2,300 every day, today 0" in one picture; the line on the map runs from the
  cause to what it holds; the corrected file arrives on the day it really did and is decided in the same panel.
- Hard: "Keep Sun Feb 25" and "Keep it paused" read alike. Fixed: the second is now "Wait for the file".

## 3. Exploring the data
- Worked: pointing at a kind lights its relations as sentences; a column's values are bars; Ctrl K previews as you type.
- Hard: with a column's values open, tapping "Explore rows" only closed the sheet. Fixed: a tap beside an open sheet
  closes it and still does what was tapped.

## 4a. A little odd, sent through
- Worked: the chart shows today's 262 rows inside the band of the last 28 days; the suggestion agrees ("inside the
  day-to-day swing"); the reason goes on the record with the day.
- Broken: the Publish as is choice showed another day's evidence (Mar 27's access reviews). Fixed: a day's suggestion
  evidence stays on its own day.

## 4b. Clearly an outlier, resolved
- Worked: 815 rows every day for 28 days, then 1,630: the chart says "outlier" before any words do; the corrected
  file (815, each application once) is the owner's pick and is published in two taps.

## Judge round 1 (frames of the first recordings): the needs behind the findings
- Telling odd from real at a glance (all five judges): the 28-day line scaled itself. Now one picture everywhere: bars
  from zero, % from usual on a fixed ±10% scale, the 28 days' range, the limits dashed, a verdict on top.
- Accountability (owner, designer, newcomer, DQ): who decided vs who recommended; what exactly went on record. Now one
  reason, an On record line, a receipt per decision.
- Fixing a false alarm at its source (owner, newcomer, DQ): only your own tighter limit paused the day. Now the sheet
  says so, counts its days and offers to set it back from that day.
- A rule that cries wolf (builder, newcomer, DQ): a rule tried on one day. Now 184 days, a tolerance offered, your rules
  in force in the checks and the replay.
- Seeing every choice (owner, designer): recommended first, two columns on a desktop.

## Judge round 2 (frames after those fixes): scores 3.2/3.4/2.8/3.0/3.0 → 3.4/3.8/3.0/3.0/3.0
- Severity still looked the same for a mild dip and a broken file → a severity word and colour (mild / serious), how
  many times its limit, the limit in rows.
- The decider unnamed, two clocks, a prefilled quote → "Deciding as", dated times, the quote a deliberate tap.
- Gaps accepted in a bundle, one fact in three states → each gap its own choice and reason, your rule the one state.
- Decisions on counts alone → the rows that went and came (10 gone: 9 expired, 1 active, worth asking about); the
  resent TLS file's rows compared; a new level accepted keeping your limit.
- Two filled buttons, four labels for Decide → the banner's Decide a link, one label.

## Peer rounds 1 and 2 (working fixes, reviewed to agreement)

How it ran, so it can be repeated:

- **The material.** Each step of the five walkthroughs was saved as an editable page and a screenshot:
  `VX_SNAP=dir VX_NOVIDEO=1 node scripts/v*.cjs`. Frames and contact sheets were cut from the videos, and visible words
  counted (`peer/tools/render.cjs`, closed folds excluded).
- **The brief.** `peer/inspiration.md` holds the owner's words, AI-slop fixes, 60-30-10, Material 3, the dashboards and
  ADR 0028. Section 7 is Memorisely's method (Instagram can't be read from here, so Build with Omar is still unread).
- **Five persona agents** (builder, owner, design, newcomer, dq) each built a working fix in their own copy
  (`peer/tools/copyapp.sh`, `patch.sh`), proved by re-running the walkthroughs with no page errors.
- **Review.** They reviewed each other's fixes: agree or disagree, a score, and the changes they wanted. A fix ships at
  3 of 4 agrees. Each author then revised one to three times.
- **Merge.** Fixes were merged with git, one branch a fix (`peer/r*/merge`); CSS blocks were joined by
  `peer/tools/joincss.py`. Then the full checks ran (exbuild3 on desktop and phone, fitcheck, exq) and the videos were
  re-recorded.

Round 1: all five fixes agreed 4 of 4 and merged. Round 2: four fixes agreed. Four authors had rebuilt the same gaps
step, so review picked one base (dq's) plus named grafts and dq built the combination. Design's control was declined
at first (too loud, and Pause's effect unsaid), then agreed once pill-sized, with each row saying what its setting
does.

Scores (find, do, images, trust, overall): r35 3.0 2.8 2.0 2.8 2.2 → r36 3.8 3.6 3.0 4.0 3.0 → r37 4.0 4.2 4.0 4.0 4.0.

Visible words, mean per screen: problem-fix 521 → 281, odd 597 → 275, outlier 541 → 280, explore 295 → 208,
setup 364 → 326.

Next, as the reviewers agree: setup's Checks step (474 words) as one checks × days grid, and the decision receipts as
timeline rows.
