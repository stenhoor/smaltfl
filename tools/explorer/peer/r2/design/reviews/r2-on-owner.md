# Design on owner, round 2: "Only the decision"

**Verdict:** agree.

**Score:** 4.

**Matches the system:** yes.

- CSS only, scoped to the open panel.
- No new colour, size or component.
- One primary per view: the banner's second **Decide ›** goes while the panel is open.

## Keep

- **Every decision step of videos 2 and 4b is now at 188 to 245 words with the map behind counted.** The 250 bar is
  met at last.
- **Behind the panel, the subject alone:**
  - the paused file's chip;
  - its line to what it holds;
  - "Held · 11";
  - "Out · 29 published".

  The map still says where you are (the builder's ask) without competing (§3.5, §3.6).
- **An alternative is one line:** its name and its eye line. A risky row keeps its risk before it is picked
  (§3.7: two levels on demand).
- **The now-picture loses "readers see",** which the sentence beside it says. That also removes an 8.5 px label below
  the floor.

## Change

1. **Collapse what you hide instead of leaving its space.**
   - You hide with `visibility: hidden`, so the space stays. The held strip stays 90 px tall with nothing in its
     middle (measured on 2/08).
   - The kind cards keep their full size, 449×156, empty but for a name. Behind a dialog they read as cards that
     failed to load, which is a stacked-card feel of its own.
   - Do two things:
     - `display: none` on `.bouts .bo.held`, so the strip closes up to one line: Held · 11 · What readers get, Mon 26
       · Out 29 published.
     - While the panel is open, draw the backdrop's kinds as outlines (`background: none; box-shadow: none; border:
       1px solid var(--line)`). The map then reads as a quiet diagram, and the paused chip with its line stays the one
       solid thing.
   - **Why:** §7 (cut the stacked-card feel; every state covered, including the one behind a dialog); §3.6 (grey
     everything, then highlight the one thing).
   - **Test:** with the panel open on 2/08,
     - `.bouts` is at most 40 px tall;
     - no `#stage .node.kind` draws a fill or shadow;
     - the visible words stay at 230 or fewer.
2. **A nit: the keycaps "Esc" and "↵" are 10 px,** the last text under the 11 px floor in the panel. Set them in
   `--fs-1` (§6).

## Conflicts

- **None with mine.** My round-2 fix is the setup screens.
- **Closed folds:** my app-wide closed-fold rule is the same as your round-1 Decide rule. Keep one.
- **Builder:** the page behind stays a map, as the builder asked. Change 1 keeps it a map and makes it quieter still.
