# Design on newcomer, round 2: "Say why before asking"

- **Verdict:** agree.
- **Score:** 4.
- **Matches the system:** yes. Existing tokens, 12 px and weight 600 for the new lines, my dividers, no new colour or
  component.

## Keep: the structure of the combined gaps screen

- **The one-line why:** "Accept each as known, or it is listed every day." It is the product's own consequence in 10
  words. Of the four intros written this round (builder's, dq's, mine and yours) it is the one to ship.
- **Two groups:** "Worth asking about · 1" first, then "Explained · 5". The finding is no longer one row among six,
  told apart by an 11 px amber tag. It has its own place, and "Accept the 5" refers to something on screen (§3.5 one
  focal point, §7 clear hierarchy).
- **The primary button names its group:** "Accept the 5 explained ›".
- **The finding's own "Accept it as known"** on its row, not two folds down.
- **The two headlines said shorter**, with the same facts.

## Change

1. **Say the key in the system's four words, or let the control carry it.**
   - The merged product will use one control for "what this check does": Pause · Warn · Note · Off, on the gaps as on
     the Checks step (my round 2; the builder left the call to me).
   - Your key explains the pills' words ("Warn if more", "Note it", "Stop checking"), which go.
   - **Keep the key as one muted line in the four words:** "Pause holds the day when there are more · Warn marks it ◆
     · Note lists it, unmarked · Off stops the check." Then the meaning is learned once, for every check (§6, said
     once).
   - **Test:** the key's four terms are the four labels of the row's `.seg`.
2. **Let the rows' facts be numbers where the builder and dq made them so.**
   - In the combination, "19 of 268 rows · 7.1%" and the evidence line replace each headline sentence. Keep your
     shortened sentences only where a row has no number.
   - **Why:** §2 (words doing a picture's job).
   - **Test:** no gap row's first line is longer than 10 words.

## Conflicts

- **The gaps screen.** The base is the builder's rows, because they have one fold, one control open, and pointing
  lights the map. Your why, groups, button and inline accept go on top (my builder review, change 3).
- **One rule each, written by several of us:**
  - the closed-fold rule (yours is scoped to `details.ag-row`; mine is app-wide and covers it);
  - the hidden kinds line beside the map (the same rule as the builder's and mine).
- **`allInView`'s intro and accepted line:** yours wins over mine. Mine ("Once accepted, each does what is set beside
  it") goes.
