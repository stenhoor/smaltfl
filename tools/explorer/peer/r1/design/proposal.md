# One quiet system

**One sentence:** Memorisely's pre-ship pass (inspiration §7), built into the four surfaces every journey passes
through: the map, the paused-day banner, the Build panel and the Decide panel. The pass covers:

- one type scale with an 11 px floor, the map included;
- colour by role: smalt for the action alone, and how serious a pause is said twice, by hue (amber mild, crimson
  serious, as dq's figure and the owner's badge) and by volume (filled or outlined);
- spacing instead of frames;
- each fact said once.

**It works:**

- **Walkthroughs:** all five run end to end against `app/` in snapshot mode, with no page errors and the same 78
  captions.
- **Patch:** `patch.diff`, 128 changed lines (+126/−2):
  - one CSS block at the end of `<style>`;
  - one line in `explore.js`;
  - two expressions in `build.js`.
- **Details:** `changes.md` names every selector and why, and its "Merge notes" say how it combines with the other four
  fixes.
- **Round 1:** what reviewers asked and what I took is at the end of this file. The numbers below are measured on this
  round's run.
- **Before and after:** before is `S/peer/snap/<video>/NN.png`; after is `S/peer/r1/design/snap/<video>/NN.png` for the
  same step. Side-by-side copies are in `v1/<video>-<NN>-pair.png`.

## The system, measured before and after

Computed styles come from `work/audit.cjs` and colour area by role from `work/area.py`.

| On screen | Before | After |
|---|---|---|
| Text sizes on the paused day (`2-problem-fix/01` · `4b/01`) | 17 · 18 | 11 · 12 |
| Words drawn below 11 px on the paused day, outside the figure (map at 0.63–0.66 scale) | 116 · 122 | 3 · 5 |
| Alarm magenta on a serious paused day (`2/01` · `4b/01`) | 12.0% · 12.4% of the screen | 2.9% · 3.1% |
| Alarm colour on the **mild** paused day (`4a/01`) | 14.3%, the same pink banner as serious | 0.9% amber, 0.4% crimson (the map's held file and line, the strip's cell), an outlined amber banner |
| Shadows on the paused day | 41 | 12 |
| The 11 held outputs on the desktop paused day | listed twice | listed once, on the map |
| Decide panel: words of the page hidden behind it, still in the reading order | 246 | 0 in the merge, by the owner's rule (about 260 in this copy, see Round 1) |
| Visible words, all 78 steps of the five videos | 42,755 | 41,407 in this copy (36,410 in round 0, before the Decide pieces went to the owner) |

## Screen 1: the paused day (the hub of journeys 2, 4a and 4b)

**Problem:**

- Alarm pink is the wallpaper: banner, cause card, 11 held chips and the line.
- The map's file names are drawn at 8.5 px.
- "11 held" is said four times and "empty" six times.
- A mild pause looks like a serious one.

**Principles:** §3.2 (60-30-10), §3.3 (de-emphasis), §3.5 (one focal point), §2 (the same fact in three places), §6
(colour by role, never colour alone), §7 (type scale, colour tidy, "every state covered").

| Step | Before | After | Visible words |
|---|---|---|---|
| Serious, MFA empty | `S/peer/snap/2-problem-fix/01.png` | `S/peer/r1/design/snap/2-problem-fix/01.png` | 425 → 403 |
| Mild, your own ±2% | `S/peer/snap/4a-odd-but-ok/01.png` | `S/peer/r1/design/snap/4a-odd-but-ok/01.png` | 486 → 438 |
| Serious, TLS twice | `S/peer/snap/4b-outlier/01.png` | `S/peer/r1/design/snap/4b-outlier/01.png` | 457 → 422 |
| Phone (render.cjs on the after snap) | | `phone/2-problem-fix-01-phone.png` · `phone/4a-odd-but-ok-01-phone.png` | 153 → 143 · 191 → 183, no sideways scroll |

**Changes, to build from:**

- **Map:**
  - `.kind` is a card with one soft shadow, without the ring and the deep shadow.
  - `.ds` is a file as a sunk tone, not a bordered box.
  - Labels are `max(13px, 11px / --ks)`. `--ks` is the map's scale, set in `place()`. File names and kinds' counts
    now render at 11 px or more.
  - `.ds.waiting` is the one magenta thing on the map: a magenta outline and name, with no pink fill.
  - Relations (`.lab .lv`) are quieter than the kinds they join.
- **What readers get:**
  - `.bo.held` chips are grey with their hourglass.
  - The line from the cause still ends there.
  - The line (`holdLine`) now leaves the file by its side and runs down the gap between columns. It used to cross
    "Key rotation", "Access reviews" and "Scanner findings".
- **Banner (`.alert.short`):**
  - Serious is filled with `--bad-wash`, with its crimson mark and words.
  - Mild is amber end to end on the surface: its outline, pause mark, words and chip (round 1).
  - Waiting, decided and done are outlined in `--line`.
  - Severity reads from the shape before a word is read, and the word stays (never colour alone).
- **Build panel:**
  - Step tiles have no boxes.
  - The month strip loses its 56 numbered boxes. It shows marks and a number on each Monday, each marked day (round
    1) and the day shown. A plain day's date is on hover (each cell's existing `title`).
  - The day card sits on the panel itself.
  - The cause (`.cc.iscause`) is outlined, with a 3 px bar: crimson when serious, amber when mild. When mild, its
    mark and the day's "paused" are amber too (round 1).
  - The usual-rows figure is dq's (round 1). Its ink verdict and its label sizes come with dq's figure in the merge.
  - The chain summary line is hidden; the chain says it.
  - The panel's held chips are hidden at 761 px and wider, where the map lists them. They stay on a phone.
  - The cause line drops its sentence when the picture says it in numbers (`chainHtml`).

## Screen 2: the Decide panel

**Problem:**

- Four boxed choices, each with a keyboard badge, a boxed chip and the same "Done for now" line.
- Grey boxes around notes.
- Pictures that bounce and pulse twice.
- The Build panel behind the sheet is still in the reading order.

**Principles:** §2 (everything at the same volume), §3.3 (primary, secondary and tertiary), §3.4 (fewer borders), §6
(one primary action), §7 (one primary per view; motion about 200 ms, ease-out).

| Step | Before | After | Visible words |
|---|---|---|---|
| Choice made, MFA | `S/peer/snap/2-problem-fix/12.png` | `S/peer/r1/design/snap/2-problem-fix/12.png` | 883 → 863 in this copy (603 in round 0) |
| Corrected file, TLS | `S/peer/snap/4b-outlier/06.png` | `S/peer/r1/design/snap/4b-outlier/06.png` | 814 → 774 in this copy (543 in round 0) |
| Mild, Exceptions | `S/peer/snap/4a-odd-but-ok/07.png` | `S/peer/r1/design/snap/4a-odd-but-ok/07.png` | 962 → 902 in this copy (628 in round 0) |
| Phone (render.cjs on the after snap) | | `phone/2-problem-fix-12-phone.png` · `phone/4b-outlier-06-phone.png` | 442 → 444 · 421 → 415, no sideways scroll |

**After round 1, the Decide panel is the owner's, with this system on top.** The counts above rose because two pieces
left this copy for the owner's: hiding the page behind the panel, and saying each choice's fate once. The merged panel
is `S/peer/r1/design/reviews/work/sketch-owner-with-dq-4b06.png`: the owner's structure with dq's figure, 164 words.

**Changes, to build from:**

- The page behind the panel is hidden by the owner's rule in the merge. My own rule went in round 1.
- The scrim goes from 16% to 28%.
- Choices (`.opts.rows label.opt.tile`) are rows without boxes. The chosen one is outlined in smalt on a light smalt
  wash: the state you picked, in the action colour.
- Each choice's fate is said once, by the owner's rows. My rule hiding `.tfile` went in round 1.
- The "4 choices" count is hidden.
- Keyboard numbers show only while the keyboard is in use (`:has(input:focus-visible)`).
- `.recchip` is a line, not a boxed chip.
- No frames on `.decfig`, `.stopby`, `.afterbox` or `.qsub.top`.
- `.nowpic` is grey with its mark: crimson, or amber when mild.
- `.fixchip` is grey with its green ↻.
- The pictures arrive in 0.24 s, eased out, once, with no bounce and no repeat.
- The reason and the name are set at 15 px.

**The 250-word target** is met by the owner's content, 161 to 231 words, with this system on top.

## Screen 3: the Build panel while setting up

**Problem:**

- The kinds a file proposes are drawn in smalt, so the map competes with "Add CMDB ›".
- Grey boxes hold white boxes.
- Six bordered gap cards each carry a smalt "evidence ›" pill.
- A green box confirms what a ✓ could.

**Principles:** §3.2, §6 and §7 (smalt is the one action colour, one primary per view); §3.4 and §7 (cut the
stacked-card feel).

| Step | Before | After | Visible words |
|---|---|---|---|
| Reading the first file | `S/peer/snap/1-setup/03.png` | `S/peer/r1/design/snap/1-setup/03.png` | 352 → 377* |
| The gaps reading found | `S/peer/snap/1-setup/20.png` | `S/peer/r1/design/snap/1-setup/20.png` | 902 → 917* |
| Phone (render.cjs on the after snap) | | `phone/1-setup-03-phone.png` | 208 → 208, no sideways scroll |

\* The panel's words are the same: 375 and 283, counted whole with `--clip '#buildpanel .bp-body'`. The viewport count
rises only because, without frames and their padding, lines wrap less and more of the panel fits.

**Changes, to build from:**

- `.node.kind.ghost`, `.node.ds.ghost`, `.ln.ghost` and `.lab.ghost` are dashed in `--edge` grey, not smalt. The name of
  the kind of the file being read is in ink (round 1). The kinds a file only names are the builder's quieter
  `.pointed` in the merge.
- `.bf-prop` is a section with its label, not a grey box, with 24 px between sections.
- `.bf-links li` and `.ag-gaps li` are rows with a divider.
- `.ag-open` ("evidence ›") is a text link.
- `.bp-done`, `.ag-known` and `.ag-known.ask` lose their tinted box. "All 22 files are in." is led by a green ✓.

## Memorisely's four review questions (§7)

- **Clear hierarchy:** one crimson thing on the map (the held file and its line), one filled button, and the verdict
  as the card's headline.
- **Every state covered:** serious and mild pauses, waiting for a file, a corrected file in and decided each have
  their own volume and mark (`2/01`, `4a/01`, `2/13`, `2/16`, `2/19`, `4b/11`; `v1/banner-states-pair.png`). Proposed and added kinds look different. The light and
  dark themes both run on tokens; dark was checked live.
- **Matches the system:**
  - Every new value is a token or one of `--fs-*`, `--sp-*`, `--r-*`, with role names such as `--text-primary` and
    `--action-primary`.
  - There is no new colour.
- **Ready to ship:**
  - Working: five walkthroughs, no page errors.
  - Phone: 390×844 with no sideways scroll.
  - Tablet: 820×1180 and 1180×820 checked live.

## What I deliberately did not change

- **Content:** the wording of the evidence, the choices, the receipts and the record; the order of the Decide panel;
  what is recommended and by whom.
- **The map:** its layout engine and positions. Only a scale-aware type floor was added.
- **The explore estate's banner:** its long form keeps its filled Decide button, the one action on that screen.
- **Pictures:** the decision pictures, the usual-range chart and the map. Images over words, kept.
- **Buttons:** sizes, and the Cancel and confirm keyboard hints.
- **Known limits, still there:**
  - On a narrow tablet the stacked map's held line still crosses the cards below it.
  - The usual-rows figure in this copy is still the prototype's, with labels at 9 px and a crimson day on the mild
    day. dq's figure replaces it in the merge.

## Round 1: took / declined, and why

All four reviewers agreed (4, 4, 4, 4). Each ask, from the coordinator's list first:

| # | Asked by | Ask | Taken or declined | Why, and the test |
|---|---|---|---|---|
| 1 | all four | A mild pause amber end to end: the banner's outline, pause mark and chip; serious filled crimson; keep filled against outlined | **Taken**, and carried to the day's "paused" and the cause's mark in the Build panel and the Decide panel's mark | One severity in one hue, with the shape as the second cue and the word kept (§6). **Test:** computed on `snap/4a-odd-but-ok/01.html`, no `--bad` anywhere in the banner. The banner is white, its border `--warn` 60%. 2/01 and 4b/01 are unchanged (filled `--bad-wash`, crimson mark and words). |
| 1a | (my call) | Should the map's held file, its line and the strip's cell turn amber too? | **Kept crimson** | They say "held", which is the same on a mild and a serious day. Amber there would read as "warned", a published day, which is dq's point in its review. |
| 2 | newcomer, dq | Number the marked days on the month strip | **Taken** | A number on each Monday, each marked day (◆, the pause, ✓) and the day shown (§3.6, label the points that matter). **Test:** on `snap/2-problem-fix/01.html` all 6 marked cells show their number; 12 numbers in all, where the prototype had 56. |
| 3 | dq, owner | dq's figure replaces the ±10% chart; nothing of mine may restyle or hide its parts | **Taken** | Every `.ufig` rule left my block: the verdict's ink and size, the 11/12 px labels, the bars' nudge and the legend's margin. The block names no part of the figure. `changes.md` "Merge notes" says that the ink verdict is now written in dq's block, and that dq keeps its label sizes and phone bump. **Preview of the merge:** `reviews/work/m2-merge-mild-serious.png` (dq's amber column under my amber bar and banner) and `m2-dq-design-4b06.png`. |
| 4 | dq, owner | "first" and "sent again" ran together at 11 px on 4b/06 | **Taken, by 3** | With my label rule gone, this copy draws the prototype's own labels, which don't collide (`snap/4b-outlier/06.png`). In the merge, dq's figure replaces the bars. Its labels measure 13.1 px in Decide with this block on top, with no overlap. |
| 5 | owner | Put the whole page away while deciding, not only the Build panel | **Taken**, by removing my rule | The owner's `.app` rule does it in the merge, and `#buildpanel` is a child of `.app` (checked). One rule. The builder preferred my dimmed map, but the owner's panel carries its own picture of the file and what it holds. |
| 6 | owner | Drop my `.tfile { display: none }` | **Taken** | With the owner's structure each row's short fate is the only place it is said. |
| 7 | newcomer | Tell the file being read from the kinds it only names | **Taken**, in two halves | The kind of the file being read: its name in ink, dashed grey (mine). The kinds it only names: the builder's `.pointed` (muted, "176 named in CMDB"), whose selector already wins over mine in the merge. |
| 8 | newcomer | Choice pictures one size on a phone | **Declined here** | The owner's structure drops the pictures for its eye lines in the merge. Copying that piece here would duplicate the owner's code. |
| 9 | builder | Join cards as rows; the builder's map font rule to family only | **Theirs**, noted | Both are on the builder's side. My row rule doesn't reach `.jn`, and my floor wins once the builder's rule sets only the family (Merge notes). |

**What this costs in this copy, until the merge:**

- **The Decide steps count more words.** They count the Build panel behind the scrim (about 260 words) and show the
  fate lines again: 863, 774 and 902 visible words at 2/12, 4b/06 and 4a/07.
- **The old figure keeps the prototype's colours and sizes:** a crimson day on the mild day, a green "Sent again"
  headline and 9 px labels.

Both go in the merge, with the owner's panel and dq's figure.

**Works:**

- **Walkthroughs:** all five ran again on the revised app (v1, v2 and v4b copies, v3 and v4a as given), with no page
  errors, the same 78 captions and the same step counts.
- **Phone renders:** redone in `phone/`. None scrolls sideways.
- **Patch:** `patch.diff`, 128 changed lines (+126/−2).
