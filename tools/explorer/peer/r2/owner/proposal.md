# Only the decision: behind it, what it is about; in it, one line a choice

**Persona:** the owner, the deputy security lead who decides what readers see on a paused day.

**What it is:** a working fix in `S/peer/r2/owner/app`, made on the merged prototype. The patch is `patch.diff`: 24
lines added and 1 changed, all CSS, inside my existing `peer:owner` block. The change list is `changes.md` and the
critique is `critique.md`. Paths below are under `S/peer/r2/owner/` unless they start with `S/`.

## The problem it fixes

On the merged product the decision screens are the heaviest screens in all three of my journeys: 315 to 429 words,
where the bar is 250 with the map behind counted.

- **The panel itself is 170–290 words.** The rest is the page behind. At a 28% scrim it is still all legible:
  - 21 file names;
  - five kind cards with counts;
  - the 11 held outputs by name;
  - the legend;
  - the banner, which repeats the panel's head and carries a second **Decide ›** just above the card.
- **Inside the panel, every alternative carries three lines,** and "Reopens if a file comes" is said on three rows.

Principles broken: §3.5 (one focal point), §3.6 (grey everything, then highlight the one thing), §3.7 (the answer
first, details on demand), §6 (said once), and §7's clear hierarchy and one primary per view.

## The fix, as built (CSS only, and only while Decide is open)

1. **Behind the decision, only what it is about.**
   - The page behind keeps the kinds' cards and names, the paused file's chip with its line to what it holds, and what
     readers get ("Held · 11", "Out · 29 published").
   - The rest steps away: the kinds' counts and self-links, the other 21 file chips, the held outputs' names (one tap
     away in the panel's "See which ›"), the legend, and the banner with its competing Decide.
   - It is not the grey slab the builder objected to in round 1. The map is still drawn and dimmed, and the decision's
     subject is the one thing on it.
2. **An alternative is one line:** its name and where readers would look after it (the eye line).
   - The chosen row adds its fate and its risk.
   - A risky row keeps its risk, so "Publish as is: Posture looks better than it is" shows before anyone picks it.
   - "Reopens if a file comes" is no longer said three times.
3. **The now-picture drops its "readers see" label;** the sentence beside it already says "Readers see Sun Feb 25 until
   you decide".

Nothing else changes: the order, the badge, dq's figure, her pick chosen, "Goes on record when you tap Agree" and the
one Agree button all stay.

## Screens: before (`S/peer/snap2`) and after (`snap`), same step

Words are the render tool's, at 1440x900.

| Screen | Before | After | Words |
|---|---|---|---|
| **2-problem-fix/08**, Decide on Mon Feb 26, her pick chosen | `S/peer/snap2/2-problem-fix/08.png` | `snap/2-problem-fix/08.png` | 369 → **230** |
| the same step, phone 390x844 | `work/2-problem-fix-08-before-phone.png` | `v1/2-problem-fix-08-after-phone.png` | 185 → **182**, nothing scrolls sideways |
| the same step, tablet 820x1180 | `work/2-08-before-820x1180.png` | `work/2-08-820x1180.png` | 365 → **226** |
| 2-problem-fix/11, before the one tap | `S/peer/snap2/2-problem-fix/11.png` | `snap/2-problem-fix/11.png` | 374 → **235** |
| **2-problem-fix/17**, the corrected file, from Tue Feb 27 | `S/peer/snap2/2-problem-fix/17.png` | `snap/2-problem-fix/17.png` | 351 → **245** |
| **4b-outlier/06**, Decide on Thu Mar 21 | `S/peer/snap2/4b-outlier/06.png` | `snap/4b-outlier/06.png` | 315 → **188** |
| 4b-outlier/08, "How it compares ›" open | `S/peer/snap2/4b-outlier/08.png` | `snap/4b-outlier/08.png` | 366 → **239** |
| 4a-odd-but-ok/08, the mild day, limit tools open | `S/peer/snap2/4a-odd-but-ok/08.png` | `snap/4a-odd-but-ok/08.png` | 399 → 262 |
| 4a-odd-but-ok/10, a reason typed | `S/peer/snap2/4a-odd-but-ok/10.png` | `snap/4a-odd-but-ok/10.png` | 429 → 305 |

- **Videos 2 and 4b:** every decision step is now at 188 to 245 words, under the 250 bar with the map behind counted.
- **Video 4a:** the mild day opens at **194** words (`work/after/4a-08-foldclosed.png`). It goes over only because the
  walkthrough opens "If it keeps happening ›", whose limit tools are a second decision and dq's evidence (68 words),
  and then types a reason. I left them as they are.
- **The phone barely changes,** because the panel already filled the screen. The rows I removed there sit below the
  fold. A risky row now keeps its risk on a phone as well.
- **Every other step** counts exactly the words of `S/peer/words-r36.txt` (`work/words-after.txt`).

## Works

- `scripts/v2_fix.cjs` is a copy of `S/scripts/v2_fix.cjs` with step 9's caption only. `S/scripts/v4b_outlier.cjs` and
  `S/scripts/v4a_odd.cjs` run unchanged.
- All three ran on `app/` in snapshot mode with **no page errors**, with the same step counts as `snap2` (19, 11, 12).
  The 4b and 4a captions are identical to `snap2`'s.
- The states were checked live (`work/p-feb26-pick-pair.png`):
  - picking another choice expands that row with its fate and risk;
  - picking "Publish as is" keeps its red state;
  - her row keeps "Recommended by …" and her words throughout.

## §7's four questions

- **Clear hierarchy:** the panel is the one lit thing. Behind it is one subject: MFA, its line, "Held · 11". In it,
  her chosen row comes first and the others are one line each.
- **Every state covered:**
  - her pick chosen (2/08);
  - another pick (`work/p-feb26-pick-pair.png`);
  - a risky choice, its warning shown before it is picked;
  - a corrected file (2/17, 4b/06);
  - the machine's reading with nothing chosen (4a);
  - phone, tablet and desktop.
- **Matches the system:** no new colour, size, component or JS. It only hides things, scoped to the open panel.
- **Ready to ship:** it runs, merges inside my own block, and touches no one else's rules.

## Deliberately not changed

- **The panel's content and order,** the eye lines, dq's figure, and the record line and the Agree button.
- **The mild day's limit tools and "the rows behind the count".** They are dq's evidence. Opening "If it keeps happening
  ›" is the one way above 250 left on a decision screen.
- **Problem 3 of my critique, the run-on receipts with two clocks.** It is the next owner fix: it touches the Build
  panel's receipts (`build.js`), which other fixes also touch.
- **The map itself.** It is unchanged whenever no decision is open.

## Round 2: took / declined

All four reviewers agreed (4, 4, 4, 4). The revision is in `app/`:

- the snaps were made again (`snap/`);
- the phone shots rendered again (`v1/`);
- `patch.diff` regenerated: 54 lines added and 4 changed, in `index.html`, `explore.js` (3 lines) and `build.js`
  (1 line).

Words are the fixed render tool's, which skips closed folds, at 1440x900. The baseline is
`S/peer/words-r36-fixed.txt`, and the full list is `work/words-after-r2.txt`.

### Took

1. **What steps away takes no room** (design).
   - The other file chips, the kinds' counts and the held outputs' names are now `display: none`. The held strip
     closes up to one line, 37 px tall: "What readers get, Mon 26 · Held · 11 · Out 29 published".
   - The kinds are drawn as outlines, with no fill and no shadow, as design and the builder asked. They read as a
     diagram, not as emptied cards that look as if they are loading (the newcomer's concern).
   - The hold line is drawn again when a panel opens or closes. It is a one-line `MutationObserver` in `build.js`,
     checked live after opening from the Build panel's button and after Cancel.
2. **Each choice keeps its outcome on its row** (dq, newcomer).
   - The fate is back on every row: "⧗ Stays yours to decide" against "◐ Reopens if a file comes", or "↳ Done with
     this day" on 4a.
   - "Wait" and "Keep all" no longer read the same.
3. **A risk shows on hover and keyboard focus** (builder).
   - Pointing at or focusing "Keep all of Sun Feb 25" shows "The 11 outputs show Sunday from every file they read, not
     just MFA" without changing the chosen row (`snap/2-problem-fix/09.png`).
   - A risky row keeps its risk always.
   - The card is now seated from the top, so a row that grows moves only what is under it.
4. **The type floor in my panel** (design): the keycaps are 11 px, and the now-picture's day labels draw at 11 px or
   more on every size (they were 8.5 px, my promise from the round-2 review).
5. **To keep every decision step at 250 or fewer, I subtracted three repeats:**
   - the record line no longer quotes the reason that sits in the box right below it;
   - the tune fold's lead ("Only your ±2% limit paused this") is gone, since the badge says it;
   - the request box says "Copy a request for the file, to send".
6. **On the mild day, picking what readers see folds "If it keeps happening ›" away.**
   - Its two buttons are the other way to settle the day; each acts at once.
   - The effect line of "Accept … as usual" shows while that button is pointed at or focused. A touch screen keeps it
     in view.

| Step | Fixed baseline | Round 2 | After revision 1 |
|---|---|---|---|
| 2-problem-fix/07–10 | 369 | 230 | **241** |
| 2-problem-fix/11–12 | 374 | 235 | **246** |
| 2-problem-fix/17–18 | 351 | 245 | **245** |
| 4b-outlier/06–07 | 315 | 188 | **188** |
| 4b-outlier/08–10 | 366 | 239 | **239** |
| 4a-odd-but-ok/07–08, limit tools open | 399 | 262 | **247** |
| 4a-odd-but-ok/09–11, a reason typed | 416–429 | 292–305 | **231–232** |

- Every decision step is now at 250 or fewer, the mild day included.
- Pointing at a row adds its risk line, about 13 words, while it is pointed at. The counter doesn't see a hover.
- On a phone (390x844), nothing scrolls sideways: 2/08 197, 2/17 213, 4b/06 154, 4a/08 185, 4a/10 197. At 820x1180
  and 1180x820, 2/08 is 237.

### Declined

- **Collapsing each emptied kind card to its name row** (the newcomer's first option). The relation lines join the
  cards' edges, so a shorter card would leave its lines ending in the air. I took the outline that design and the
  builder asked for, which keeps the geometry and reads as a diagram.
- **Showing every risk from 1180 px** (the builder's alternative). It costs 20 words on 2/08 (Keep's 13 and Fill's 7), taking
  it to 261, over the 250 bar. Hover and focus give the same comparison.

### Works

- `scripts/v2_fix.cjs` is my copy. Its step 9 points at "Keep all", with its caption.
- `S/scripts/v4b_outlier.cjs` and `S/scripts/v4a_odd.cjs` run unchanged.
- All three ran on the revised app with **no page errors**, with the same step counts (19, 11 and 12).
