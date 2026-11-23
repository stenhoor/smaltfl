# Review: design's estate map, banner and Today (5-today 01–03)

Reviewer: newcomer, someone from the business who has never seen smaltfl. Focus sentence: "Today one file paused; this
is what waits on it."

## 1. Five seconds, before reading anything (`S/peer/r3/design/snap/5-today/01.png`)

Written down before I opened the proposal (`reviews/five-seconds.txt`).

- **What I noticed first:** the pink line across the top, "‖ Today is paused Wed Mar 27 · Access reviews arrived empty ·
  ⧗ 11 waiting", with the blue **Decide ›** at its end. Then the one red-outlined chip on the map, Access reviews,
  inside Application. The links read in a word or three: owns, runs on, made up of, checked by, approves exceptions to.
- **What I'd do:** press Decide ›, or tap "⧗ 11 waiting" first to see what waits.

**Matches the focus sentence: yes.** Today, one file, what waits on it, and the one thing to do, in one glance.

## 2. The seven tests

| # | test | result | evidence |
|---|---|---|---|
| 1 | Counts are icons | pass | Each kind shows ⧗ 2, ⧗ 5, ⧗ 1 or ⧗ 3, and the banner shows "⧗ 11 waiting". Hovering the banner's count lists the 11 by kind (`work/proof/d-hover-banner.png`), and focus and tap do the same (`d-focus-count.png`, `p-tap-banner.png`). The old sentence ("so the 11 outputs built from it wait for your decision") is gone. |
| 2 | A link is two to four words | pass (nit) | "made up of", "runs on", "checked by", "approves exceptions to". **"owns" is one word, under the test's floor of two.** I still pass it: the owner's complaint was too many words, and "Organisational unit owns Application" reads correctly along its line, where "owned by" would read backwards. Hover gives the sentences. |
| 3 | One focus | pass | The one tinted line holds the state, the file, the count and the one filled button. On the map, Access reviews is the only red thing. "+ Add a dataset" is now a text action, so Decide is the only filled button. |
| 4 | Every block answers "why is this here?" | pass | Their audit holds up. The legend row and the "Point at a kind…" hint fold into "?" by the title, and "See what's built from it" goes (⧗ 11 does its job). |
| 5 | Pictures before words | pass | The map is the picture; the banner is one line at 1440. On a phone it wraps to two lines plus the button (`phone-after.png`), from width, not from words. |
| 6 | Detail on demand | pass | At rest: the state, the file, one number. The lists, the link sentences and the marks' meanings come on hover, focus or tap. |
| 7 | Today is today | pass | "Today is paused" with "Wed Mar 27" small. The decided-for-now banner says it too: "Today is decided for now Wed Mar 27 · readers see Tue Mar 26 · next: the corrected file". One helper, `smDay`. I used it from my own Ctrl K answers in a merge dry run, and it worked. |

Words, steps 01–03: 192 → 119 (≤ 200). No sideways scroll on the phone.

**One thing I checked because it looked wrong:** in `work/proof/d-decided.png` the map's lines carry no labels. On the
live page they are all there once the map settles: I replayed the decision on `design/app` with
`newcomer/tools/decided-links.cjs` (`reviews/design-decided.png`). The proof image was taken mid-redraw, so it is not a
regression.

## 3. Verdict: **agree**

All seven pass, and my five-second answer is the focus sentence.

Small changes, none blocking:

1. Retake `d-decided.png` after the labels have faded back in, so nobody reads it as links vanishing once a day is
   decided.
2. On a phone, keep the file's name on one line in the banner: a non-breaking space in "Access reviews" (it breaks
   "Access / reviews" today).

**A merge note that is mine, not design's.** The map counts a file's own checked rows under its kind (Application ⧗ 5;
the banner tip lists "Applications · 5", Access reviews checked included). My Ctrl K "Which outputs wait?" fan lists
"Checked rows 1 · Applications 4". A newcomer would notice the 5 against the 4. I will fold the checked rows under the
file's kind in my revision, so both screens say 5.
