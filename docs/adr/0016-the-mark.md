# ADR 0016: The mark is the Twin, in the user-tool layer's cerulean

- **Status:** accepted
- **Date:** 2026-11-11
- **Builds on:** [ADR 0001](0001-initial-decisions.md) §13 and §14 (the words, the colour and the mark),
  [ADR 0002](0002-second-round-decisions.md) §5 to §7 (cobalt teal, no mark yet, brand work through a fork)
- **Supersedes:** [ADR 0003](0003-third-round-decisions.md) §3 (the mark on hold)

## Context

Round 3 of the brand ([../brand/DECISIONS.md](../brand/DECISIONS.md), [../brand/round-3/](../brand/round-3/)) drew
seven wave marks, M12 to M18, and went to stenhoor before one was picked (Q-29). Meanwhile smalt-brand moved the family
from a colour per product to a colour per layer of the stack: smaltfl is a user tool, beside smaltui, smaltbi and
smaltnb, and the user tools are deep cerulean (smalt-brand DECISIONS.md, "Colour by layer"). That decision says
cobalt teal's reservation for smaltfl lapses.

## Decisions

1. **The mark is the Twin** (round 3, M13): two waves in step, the old sign for water, and a small chip where they
   arrive. stenhoor picked it on 2026-11-11 and approved it. The waves are curved, an exception to the family's 0°,
   45° and 90° rule, as smaltql's Star is one. The chip stays small: the variants that give the colour a whole wave
   (M16 to M18) were not picked. (Q-29)
2. **The colour is the user-tool layer's deep cerulean,** not cobalt teal: `#0E7FAE` fill, `#0B6A91` text, `#5CBDE8`
   on dark (smalt-brand's `layer-tool` tokens). The mark's body is smalt and its chip cerulean. This replaces ADR 0002
   §5. (Q-28)
3. **The brand lives in smalt-brand.** The Twin, the lockup, the wordmark, the app icon, the favicons, the badge and
   the social card are generated there (`logos/smaltfl/`, stenhoor/smalt-brand#82), with smaltfl's words, its column
   in the family table and its page on smaltworks.dev. The work went to `stenhoor/smalt-brand` directly, at stenhoor's
   request, rather than through the fork in ADR 0002 §7 (Q-30). smaltfl copies the files unchanged.
4. **smaltfl's site and app show the mark** (stenhoor/smaltfl#3, stenhoor/smaltfl#4): the lockup in the nav, the mark in the hero, the Twin in the
   app's header, and the favicon on both.

## Consequences

- `docs/brand/` is the record of how the mark was chosen. The assets are smalt-brand's; a change to them starts there.
- smalt-brand's app-site rules apply to smaltfl's site (its BRAND.md, "Sites and READMEs" rule 12 and the
  Documentation standard's user-tools row, stenhoor/smalt-brand#83).
- **Not decided here:** the app also uses teal (`--teal`, `--teal-fill`) to mean what a flow produces, as against
  smalt for what it reads. That is a colour in the app's own vocabulary, not the product's colour, and it is unchanged.
  Whether it stays teal is a question for the maintainers.
