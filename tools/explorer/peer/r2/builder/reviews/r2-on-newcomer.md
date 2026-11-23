# The builder on the newcomer's round-2 fix: "Say why before asking"

**Verdict:** agree, as grafts onto dq's gaps screen (see *Conflicts*).
**Score:** 4

I looked at `S/peer/r2/newcomer/snap/1-setup/21, 22, 26`, the side-by-sides in `compare/` and
`v1/1-setup-21-after-phone.png`, each against `S/peer/snap2/…`.

## Keep

- **The one gap worth asking about comes first.** "Worth asking about · 1" sits above "Explained · 5", and the finding
  has its own *Accept it as known* in its row. "Accept the 5" now points at something on screen, and the sixth decision
  is no longer one fold down. For me that ends a step that happened out of sight.
- **The primary button names its group:** "Accept the 5 explained ›".
- **The why in one line:** "Accept each as known, or it is listed every day." It replaces the 45-word counting
  paragraph.
- **The two long headlines said shorter,** with the same facts.
- **The kinds line hidden beside the map,** kept on a phone.

## Change

1. **Drop the three-setting key above the list; label each setting where it is set** (§3.6: label directly, not in a
   legend).
   - **Why.** "Warn if more · the day is marked ◆ when there are more · Note it · listed, the day unmarked · Stop
     checking · not checked" is about 20 words of legend, 100 to 400 px away from the controls it explains. It is a
     third place where the settings are worded.
   - **What instead.** Each button's `title` says its effect, and the chosen effect shows on the row once accepted ("✓
     accepted at 675: more won't be flagged"). With design's one vocabulary (Pause · Warn · Note · Off) the key has
     even less to say.
   - **Test:** no `p.ag-key` above "Worth asking about"; hovering *Note* says "listed, the day unmarked".
2. **The rows are still sentences.** "Cloud assets: 675 of 1,830 rows name no cluster" with its reason beneath reads
   well, but six of them don't scan. In the merge, the row is dq's (name, count with %, the bar, Larkspur's reason), so
   this change is made by the merge rather than in your patch.

## Conflicts

**Base: dq.** Its rows draw each gap's size on one scale. Graft from you:

- the two groups, finding first, with its own *Accept it as known*;
- "Accept the 5 explained ›";
- the one-line why.

Leave out the key (change 1). The full list of grafts is in my review of dq. Your grouping and design's one control fit
dq's row without rework, and my map highlight is an attribute on each `li`.
