# Decide on the estate: one question, now → after, one button

**Owner's screen, peer round 3.** Journey `5-today` step 12 (Wed Mar 27, Access reviews arrived empty), and the same
panel in `2-problem-fix`, `4a-odd-but-ok` and `4b-outlier`.

**Focus sentence:** "Pick what readers see: the recommended choice is ready."

**What the owner said:** "the decide on wed side panel feels very busy and I don't know what to immediately focus on.
same thing on the left main panel I don't know why a lot of the info is there."

**What changed, in one line:** the panel asks one question ("What should readers see today?") and answers it with two
pictures of the same two days, **Now → Recommended**, each with the day readers see under an eye and one line. The
recommended choice is already chosen and ready, its button under it. Everything else (the other choices, why it paused,
this month, the 11 outputs, your name, the request for the file) waits behind **More**. The page behind stops competing.

## Before and after

| | Before | After |
|---|---|---|
| Desktop, 1440×900 | `peer/snap4/5-today/12.png` | `peer/r3/owner/snap/5-today/12.png` |
| Phone, 390×844 | `peer/r3/owner/png/5-today-12-before-phone.png` | `peer/r3/owner/png/5-today-12-phone.png` |
| Tablet upright, 820×1180 | | `peer/r3/owner/png/5-today-12-tablet.png` |
| More opened | | `peer/r3/owner/png/5-today-12-more.png` |

Visible words (`peer/tools/render.cjs`, 1440×900; the panel and whatever shows around and behind it):

| Screen | Before | After |
|---|---|---|
| 5-today/12, Decide on Wed Mar 27 | 492 | **106** (phone 85) |
| 2-problem-fix/07, Decide at a glance | 241 | 122 |
| 2-problem-fix/17, the corrected file | 245 | 209 (More open by the walkthrough) |
| 4a-odd-but-ok/08, recommended from the evidence | 247 | 184 (More open since step 7) |
| 4b-outlier/06, the corrected file | 188 | 118 |

Before, 5-today/12 counted 492 because the dataset view behind the panel (its columns and the 11 outputs' list,
peeking out under the panel) was in view; the panel itself carried about 200.

## The seven tests (5-today step 12, after)

| # | Test | | How |
|---|---|---|---|
| 1 | Counts are icons | pass | The 11 held outputs are `⧗ 11`, a pill: hover lists them, a tap opens the list in More. No count is a sentence. |
| 2 | A link is two to four words | pass | No relation links on this screen; its links are "More" and "Write your own reason". Full sentences are on hover (each choice's `HOW.what` on the After card). |
| 3 | One focus | pass | The Recommended card is the one thing framed in smalt, and its button the one filled control; Now is a plain grey card beside it. |
| 4 | Every block answers "why is this here?" | pass | The purpose audit below; the left column's situation block, the "Paused by" chips, the four choice rows, the reason box, the name field, the request box and Cancel each folded into More or went. |
| 5 | Pictures before words | pass | The answer is two pictures, Now and Recommended; under each, the day readers see and one line. Every text line is one line at 1440, 820 and 390. |
| 6 | Detail on demand | pass | First what it is (Access reviews), its state (arrived empty, paused) and one number (0 rows, usually about 1,435). The choices, the checks, the month and "built from it" (the 11 outputs) are behind More. |
| 7 | Today is today | pass | "What should readers see **today**?" with the date small (Wed Mar 27). Looking back, it says "for Mon Feb 26" with "readers are on Tue Feb 27" small. The word comes from design's Today helper at merge (one call, in the panel's head). |

## My five-second test (the after screenshot, cold)

First I notice the blue-framed **Recommended** card: Tuesday's file under the eye, "Tue Mar 26", and the blue button
**Keep all of Tue Mar 26**. Then the grey Now card beside it, paused, `⧗ 11`. What I'd do: press the button, so readers
keep seeing Tuesday while the empty file is chased. That is the focus sentence: pick what readers see, the recommended
choice is ready.

## Purpose audit (every block on the screen, and why it is there)

| Block | Why it is here, in the owner's terms | Where |
|---|---|---|
| "Access reviews" (eyebrow) | Which file the decision is about | Head |
| "What should readers see today?" + date small | The one question this screen answers, for which day | Head |
| ✕ | Leave without deciding (Esc too) | Head |
| ⏸ Arrived empty · **0 rows, usually about 1,435** | What happened and how big, in one number | Top |
| **Now**: picture, 👁 Tue Mar 26, ⏸ Paused `⧗ 11` | What readers see right now, and that 11 outputs wait for me | Hero |
| → | Now becomes after | Hero |
| **Recommended**: picture, 👁 Tue Mar 26, ◐ Done for now · reopens if a file comes, ≈ smaltfl's reading: One whole day for readers | What readers see after the recommended choice, what becomes of the day, and who recommends it and why. The focal point | Hero |
| More › *other choices, why it paused* | Everything else, when I want it, and what it holds | Below the hero |
| On record with your tap: you · smaltfl's reading, agreed | What goes on the record with my name when I tap | Footer |
| Write your own reason › | Put my own words on the record instead of agreeing | Footer |
| **Keep all of Tue Mar 26** ↵ | Decide, in one tap | Footer |
| *Behind More:* Choices (4, "Recommended" marked by a word) | Pick another; each line says where readers' eye lands and what becomes of the day; picking one redraws After and the button | More |
| *Behind More:* Paused by: two checks | Why it paused | More |
| *Behind More:* This month: 25 fine · 1 warned · paused today, as a strip | Normal against today: the first empty day this month | More |
| *Behind More:* ⧗ 11 outputs wait on it, by name | What is held | More |
| *Behind More:* Deciding as | Put my name on the record | More |
| *Behind More:* Copy a request for the file · Read it | Ask the sender for the file again | More |

Folded or gone: the left column (its sentences are now the top line and the Now card), "Paused by" and "11 outputs wait
on it · See which" (More, and `⧗ 11`), "What should readers see? ◐ decided for now · file to come" (the question and
After's line), the four choice rows (Recommended is the hero; all four in More), "needs a reason" and "Use smaltfl's
reading ›" (smaltfl's reading comes agreed, as a named owner's does), the reason box (folded behind "Write your own
reason ›"; it opens by itself when another choice needs a reason), Cancel (✕ and Esc), and, behind the panel, the file's
card cut in half, its columns and the 11 outputs' list peeking out below the panel.

## The same panel in the other journeys (they keep passing)

- **2-problem-fix** (MFA empty, Mon Feb 26): Serious, Now Sun Feb 25 · Paused `⧗ 11` → Recommended by Sloane Marsden,
  security lead, Sun Feb 25 · ⧗ Stays yours to decide, her words under her name; **Agree: wait for the file**. On Tue
  Feb 27, "What should readers see for Mon Feb 26? *readers are on Tue Feb 27*": Nothing yet → The corrected file ·
  ↻ 2,318 rows · passed every check; **Agree: publish the corrected file**. The chart is in More.
- **4a-odd-but-ok** (Exceptions, Sat Mar 2): Mild · Only your own tighter limit · 262 rows, usually about 269; Now Fri
  Mar 1 → Recommended, Sat Mar 2 as it arrived · ↳ Done with this day · ≈ smaltfl's reading: 262 rows is in line with the
  last 5 days, and inside Larkspur's ±5%; **Publish as is**. "Write your own reason ›" for your words; "If it keeps
  happening ›" is in More.
- **4b-outlier** (TLS twice, Thu Mar 21): Serious · Came with every application twice · 1,630 rows, usually about 813;
  Now Wed Mar 20 → Recommended by Sloane Marsden, Thu Mar 21, corrected · ↻ 815 rows · passed every check; **Agree:
  publish the corrected file**. "How it compares ›" is in More.

Before and after, the same steps: `peer/r3/owner/snap-before/2-problem-fix/07.png` → `peer/r3/owner/snap/2-problem-fix/07.png`
(and 17), `snap-before/4a-odd-but-ok/08.png` → `snap/4a-odd-but-ok/08.png`, `snap-before/4b-outlier/06.png` →
`snap/4b-outlier/06.png`. Phone: `peer/r3/owner/png/2-problem-fix-07-phone.png`, `4a-odd-but-ok-08-phone.png`,
`4b-outlier-06-phone.png`.

## Decisions a reviewer may question

- **Now and Recommended look alike for Keep.** They do, because Keep doesn't change what readers see: they stay on
  Tuesday. What changes is the day: paused with 11 outputs waiting, or done for now until the file comes. The eye lines
  say the first; the line under each says the second.
- **The other choices are behind More.** The owner asked for one focus. "More › *other choices, why it paused*" says
  where they are, keys 1 to 4 still pick one, and picking one redraws After and the button.
- **smaltfl's reading comes agreed.** Before, the recommended choice was chosen but its button was disabled until a
  reason was typed or "Use smaltfl's reading ›" tapped: not ready. Now it is agreed as a named owner's recommendation
  already was, the record line says so before the tap ("smaltfl's reading, agreed"), the build records it as before
  (`from: 'smaltfl'`), and "Write your own reason ›" is one tap. The build's machine suggestions (4a) come chosen too.
- **The request for the file is its own tap.** Round 2 ticked "Copy a request for the file" by default, so deciding
  also wrote to the clipboard. With the box behind More that would happen out of sight, so it is now a button in More
  that copies at once and marks the file asked for.
- **The page behind.** Over the file's own view the panel cut the card in half and left its columns and the outputs'
  list in view; while Decide is open they give way to the dimmed canvas. Over the build's map, round 2's quiet diagram
  (the paused file, its line to what readers get) stays.
- **Today.** I didn't add a date anywhere: the head says "today" from the existing day context and drops it when readers
  are on a later day. design owns the Today helper; at merge the head calls it.

## Proof

- Walkthroughs, snapshot mode, against `peer/r3/owner/app` (copies with the moved selectors in `peer/r3/owner/scripts/`,
  same steps): `5-today` 12 steps, `2-problem-fix` 19, `4a-odd-but-ok` 12, `4b-outlier` 11, and the unchanged
  `1-setup` (28) and `3-explore` (10) from `scripts/`: all six ran to the end with **no page errors**
  (`peer/r3/owner/logs/final-*.log`; snapshots in `peer/r3/owner/snap/` and `snap-other/`). Captions are the same as
  before except three that described what moved: 5-today step 12, 4a step 9 ("the evidence is under More, above"),
  4b step 8 ("under More" for "one tap away").
- Interactions checked in the live app (`work/live.cjs`, no fixed sleeps): picking Fill in More redraws After ("Your
  choice"), opens the reason box and disables the button until a reason is given; key 3 picks Wait; Enter on the focused
  button decides; Esc closes; deciding records "keep" with smaltfl's reading and the page returns in full; `⧗ 11` opens
  More; "Copy a request for the file" copies and marks it asked; dark mode and 820×1180, 1180×820 and 390×844 render with
  no sideways scroll.
- Files: `changes.md` (each change and where), `patch.diff` (`peer/tools/patch.sh`), `work/apply.py` (makes the fix from
  `explore/`), `work/body.js`, `work/owner.css`.

## Polish: took / declined

After design and dq agreed, one polish pass on their notes.

**Took**

1. **Keep's cost on its card** (dq). The After card now says what the choice costs under what becomes of the day:
   "✕ The 11 outputs show Tuesday, other files included" (Wait: "✕ The 11 outputs keep waiting"; 4a's Publish as is:
   "✕ If the change is real, readers see it unexplained"). It is the choice's own `cons`, the same words the list in
   More shows; a risky choice keeps its risk as its line, as before. One line at 1440 and at 390.
2. **The bar's tools hidden while Decide is open** (design). The estate mini map and "+ Add a dataset" no longer show an
   edge beside the panel. "Esc steps back" goes too: while the panel is open, Esc closes it.
3. **Today named by design's helper** (dq's nit). The heading and the pictures call `window.smDay` where it is defined
   (`mid` and `small` in the heading, `text` on the paused day's card: "Today", not "Wed 27"), and fall back to the same
   calls by this panel's rule otherwise, so my copy alone reads the same. Checked both ways: with a stand-in carrying
   design's `smDay` code word for word, the heading and pictures went through it (4 to 9 calls a panel) and read "today"
   on Mar 27, Feb 26, Mar 2 and Mar 21, and "for Mon Feb 26? *readers see today*" with the dates kept on the look-back
   day. Looking back, the small note now says "readers see today" (design's helper names Tue Feb 27 today) where it said
   "readers are on Tue Feb 27".

**Declined:** nothing.

Re-run on the polished copy, my copies of the scripts: `v5_today` (12 steps), `v2_fix` (19), `v4a_odd` (12) and
`v4b_outlier` (11), all to the end with **no page errors** (`logs/polish-*.log`), the steps and captions as before.
Visible words now: 5-today/12 **105** (phone 91, tablet 101); 2-problem-fix/07 125, /17 206; 4a/08 191; 4b/06 116.
`patch.diff` regenerated: 198 lines added, 20 removed. The after screenshot is still `peer/r3/owner/snap/5-today/12.png`.
