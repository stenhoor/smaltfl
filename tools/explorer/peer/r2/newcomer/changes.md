# Changes: the newcomer, round 2

| What | Where |
|---|---|
| The working copy | `peer/r2/newcomer/app/`, from the merged prototype |
| The patch against `explore/` | `peer/r2/newcomer/patch.diff`: 26 changed lines, 21 added and 5 removed (13 in `build.js`, 12 in the page's CSS) |
| JS markers | Each changed line carries `// peer:newcomer` (`/* peer:newcomer */` inside a template) |
| CSS | One block at the end of `<style>`, between `/* peer:newcomer start */` and `/* peer:newcomer end */` |

The change is one screen: setup's step once every file is read, "what reading found" (video 1, steps 21 to 26). It is
built by `allInView()` in `build.js`. Nothing a walkthrough points at was removed or renamed: the official
`v1_setup.cjs` rings `.ag-gaps`, `.ag-gaps li:nth-child(2)`, `.ag-gaps li.finding` and `.ag-gaps li:has(.agchip.mine)`,
and taps the panel's primary button. All of them still find their element, and the five scripts run unchanged.

## build.js

| Where | Change | Why |
|---|---|---|
| `GAPS['exceptions.approver_id'].says` | Was "19 of 268 rows name one of 8 approvers who aren’t among the 245 people in the HR file". Now "19 of 268 rows name an approver the HR file doesn’t list". | Half the words, the same fact. The 8 approvers' ids stay in its evidence (`gapEvidence`). |
| `gapsFound`, the `exceptions.version` entry's `says` | Was "15 exceptions have version 2 alone: their version 1 isn’t in the file". Now "15 of 253 exceptions have no version 1 row". | It says it as `GAP_SAID` already does, with its total like the other gaps. |
| `allInView`, the head | The h4 "Problems already in the data on Feb 1" becomes "Gaps already in Feb 1’s files", the one word the step, the receipt and the record use. The counting paragraph ("These 6 were in the files on Feb 1. Accept them as known: from then on each does what you set beside it (1 warn if more appear, 1 noted, 3 off, 1 watched by your rule). The finding is left for you to accept on its own.") becomes one line of why: "Accept each as known, or it is listed every day." That is the product's own consequence, from the declined state. | The newcomer is told why the step asks, not a recount of the settings below. |
| `allInView`, new `p.ag-key` | The three settings are said once, above the list. **Warn if more:** the day is marked ◆ when there are more. **Note it:** listed, the day unmarked. **Stop checking:** not checked. The wording comes from `GAP_EFFECT` and `MODE_EFFECT`, which the row's closed fold already holds. | 18 buttons used words the screen never explained (§3.7: the answer first, the method on demand). |
| `allInView`, `liOf` (was `g.map(...)`) and new `groups` | The rows form two groups in one `div.ag-gaps.ag-groups`: **"Worth asking about · 1"**, the `FINDING`, then **"Explained · 5"**, the gaps whose grey line says why each is expected. | "Accept the 5" now refers to something on screen. The selectors the walkthrough uses still match. |
| `liOf`, the finding's row | The "looks like a finding" tag gives way to the finding's own **"Accept it as known"** link in its row (`data-act="known1"`, as before). Its fold no longer repeats the link: "… Left open, it is listed each day until someone accepts it." | The group says it is a finding, and its one action is visible without opening the row. |
| `allInView`, the accepted line | Was "✓ Accepted as known gaps by you, … : 5 of 6; the finding stays open until you accept it. From then on each does what you set beside it." Now "✓ Accepted by you, … : 5 of 6. The one worth asking about stays open until you accept it." | Shorter. The key says what each setting does. |
| `allInView`, the foot | "Accept the 5, each as set ›" becomes "Accept the 5 explained ›". The recount line above the buttons (`sum`: "6 gaps: 1 warns of new ones, 1 noted, 3 off, 1 watched by your rule, as Larkspur set them") is now empty on this step. | It names its group, and the settings are on each row. |

## index.html, the `peer:newcomer` block

| Selector | What it does |
|---|---|
| `.ag-key`, `.ag-key b` | The three settings on one wrapping line: 12 px, `--muted`, the setting's name in `--ink-2` at weight 600. |
| `.ag-groups`, `.ag-groups ul`, `.ag-gh` | The two groups: a 12 px, weight-600 heading each. The rows keep design's divider (`#buildpanel .ag-gaps li`). |
| `.ag-acc1` | The finding's link at 12 px, the panel's link style. |
| `#buildpanel details.ag-row:not([open]) > :not(summary) { display: none; }` | A closed row's fold takes no room until it is opened. The render tool counted those hidden words, about 480 on this screen. Opening a row is unchanged. |
| `@media (min-width: 761px) { #buildpanel .ag-kline { display: none; } }` | Beside the map, the line of kinds and counts repeats the map's own boxes. On a phone, where the map is behind a button, it stays. |

The block uses only existing tokens, sizes (12 px) and weights (600). It adds no colour, no border and no motion.

## Merge notes

- **builder.** The join cards and the map lines are untouched. If the builder changes the gaps step too, `liOf` is the
  one row template, so combine there.
- **design.** Design's `#buildpanel .ag-gaps li` divider and `#buildpanel .ag-known` reset still apply. My block adds
  `.ag-key` and `.ag-gh` at sizes on design's scale.
- **dq.** The checks step (27 and 28) and the rules are untouched.
- **owner.** Not on this screen.
