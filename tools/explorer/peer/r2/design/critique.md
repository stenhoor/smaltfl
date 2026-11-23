# Critique, round 2: design (keeper of the one visual system)

I watched `S/video/r36`, the contact sheets in `S/peer/sheets2/` and every step in `S/peer/snap2/`. I measured them
too:

- **Computed styles:** `S/peer/r1/design/work/audit.cjs`, and `offscale.cjs` for text off the scale.
- **Words, region by region:** `regions.cjs`.
- **What a closed fold hides:** `work/foldcheck.cjs`.

**My round-1 fix survived the merge as agreed.** My block is in `explore/index.html` byte for byte (checked with
`diff`), and the `--ks` hook and both `build.js` expressions are in. A mild day is amber end to end (computed on
4a/01: banner white, border `--warn` 60%, mark and words `#8a5a12`). The strip numbers its marked days: 5 6 12 16 19
20 24 26, plus Mondays.

## Scores, the merged product as it is now

easy_to_find=3 · easy_to_do=4 · images_over_words=3 · trust=4 · overall=3

**What reads as one system now:** the map, the paused-day banner, the day card and the Decide panel. They share:

- one magenta cause;
- amber for mild;
- one figure (dq's);
- one filled button;
- type on the scale.

The screens setup ends with (steps 21 to 28) do not. They are also the heaviest screens in the product.

## Problems, worst first

### 1. Setup's last screens are still the round-0 kit, and they are the heaviest in the product

- **Where:** 1-setup/21 to 26 (gaps), 27 (history) and 28 (checks).
- **One choice, three controls and four vocabularies.** Every check has the same choice: what it does when broken.
  - Gaps: a pill reading "Warn if more · Note it · Stop checking".
  - Checks: a boxed segment reading "Pause · Warn · Note · Off".
  - Rules while reading a file: a select reading "Pauses ▾".
  - Your own rule: a segment reading "Pause · Warn · Note".
- **Stacked and loud elsewhere:**
  - History is 22 equal tinted tiles of name, sparkline and bar, whatever their importance.
  - Checks lists the days each check would have paused as nine crimson-outlined pills.
  - Checks' groups sit in a framed box inside the panel.
  - The kinds line ("Application 2,401 · Organisational unit 246 …") repeats the map beside it.
  - The gap titles are set at weight 700, a fourth weight.
- **Why it matters:** this is where a builder decides what every check does, for 184 days and beyond. Each control
  has to be learned again, and the screen reads as parts from four templates.
- **How heavy:** 437 to 481 words a reader can see (913 to 942 as the tool counts, see 3).
- **Principles:** §3.1 (a system first); §2 (no system; the same fact twice; generic dashboard soup); §7 (component
  consistency, "matches the system", cut the stacked-card feel).

### 2. Larkspur's pick vanished from every segmented control in the merge

- **Where:** 1-setup/28 (checks) and any Pause · Warn · Note · Off control.
- **What is wrong:** the prototype's `.seg button .lkdot { width: auto !important; … }` outranks round 35's
  `.seg .lkdot` dot, so the marker is 0 px wide (computed). You can no longer see what Larkspur set, so you can't tell
  a change of yours from the default.
- **Why it matters:** a state the screen should show is gone.
- **Principles:** §7 (every state covered); §6 (never colour alone: here, not even colour).

### 3. The word counter reads closed folds, so the bar is set against the wrong numbers

- **Where:** every screen with a closed `<details>`. The owner's rule fixed this for Decide alone.
- **What is wrong:** text inside a closed fold is counted though it is never drawn. Examples:
  - 1-setup/22: 913 counted, 456 readable.
  - 2-problem-fix/16: 511 counted, 250 readable.
  - 4a/12: 423 counted, 263 readable.
- **Proof that hiding it changes nothing on screen:** with `details:not([open]) > :not(summary) { display: none }`
  injected and animations frozen, all 80 `snap2` pages render the same pixels (`work/foldcheck/result.tsv`).
- **Why it matters:** "Setup did not move" is half wrong, and the reviews chase words nobody sees.
- **Principle:** §7 (ready to ship: measured as drawn).

### 4. The decision screens are over 250 words because the page behind stays readable

- **Where:** 2/07 to 12, 17 and 18 (351 to 374 words); 4a/07 to 11 (399 to 429); 4b/06 to 10 (315 to 366).
- **What is wrong:** under the 28% scrim, the map (66 to 103 words), the held strip (33) and the bar and banner (43)
  read clearly. The owner's panel alone is 227 words on 2/08. The builder's dimmed page won over the owner's hidden
  one, and the merged result misses the target.
- **What would fix it:** a backdrop blur that keeps the shapes and makes the words unreadable, or the owner's hidden
  page. That is the owner's and builder's to settle; it is not in my fix.
- **Principles:** §3.5 (one focal point); the brief's word target.

### 5. Text still off the scale, at 8 to 10.5 px

- **Decide:** the now-picture's "readers see" at 8.5 px and its day labels at 9.3 px; the keycaps "Esc" and "↵" at
  10 px.
- **Checks step:**
  - the map's check badges ("⏸6 ◆1") at 8.7 to 9.1 px;
  - the table heads at 10 px;
  - the "¼" superscript at 8 px.
- **History step:** the column names at 10.5 px.
- **Principles:** §6 (seven sizes); §7 (type scale correction).

### 6. History's legend sits above 22 tiles, far from the data it explains

- **Where:** 1-setup/27.
- **What is wrong:** "rows each day · within ±5% of usual · Feb 1 · its usual mix of one column's values" is one line
  over the grid. Its marks are learned once and then hunted for in tile 19.
- **Principles:** §2 (legends far from the data); §3.6 (label directly).
