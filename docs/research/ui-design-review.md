# One app, not six pages: a design review (2026-11-21)

A review of the app's visual design asked for by the maintainer on 2026-11-21: research on color and hierarchy, every
screen of the tour demo captured and critiqued against the same principles, and a plan. The full review, with 74
screenshots and sketches of the redesign, is a private claude.ai page (https://claude.ai/artifact/6Yki3eSvu4Q3kWm9QCfrMf);
this file is its text for the repository. The maintainer's answers to its questions (Q-343 to Q-350) are
[ADR 0028](../adr/0028-one-visual-system.md), *One visual system*.

**How it was made.** `npm run build:app -- --variant tour` from `main` at 8f240d4 (smaltdb moved to f383dd4), driven
by `tools/browser/tour.cjs` through 85 stops at desktop (1440×900) and phone (390×844) size, light and dark, at twice
the pixels. Color shares were measured per first screen in OKLCH from the screenshots; font sizes, weights, link-blue
controls and button styles were counted from computed styles in the browser; the stylesheet was counted from
`src/app/page.html`.

## What is already right

- **Legible.** Every text token passes WCAG AA in both themes (ink 17.6:1, muted 5.2:1 on the darkest ground).
- **Calm by area.** 89 to 98% of each first screen is neutral; under 3% is saturated color.
- **Status survives color blindness.** Paused, unusual and decided days differ by glyph, fill and height (ADR 0024),
  and read the same in greyscale and under deuteranopia.
- **Two screens show the way.** The decision sheet (each option drawn as what readers get, one recommended, the button
  waking when an option is picked) and a flow's panel (title, one banner, one primary button, labeled sections).
- Also kept: the waiting banner, *What needed a look*, Results' key figures, the Ontology page's column cards, dark mode.

## What makes it hard

- **No shared parts.** 1,121 class names in about 30 feature namespaces (`vf-` 234, `mo-` 134, `of-` 113, `xp-` 85…);
  the text-link style is written 17 times; about 27 button classes; 23 font sizes (8 to 32 px, mostly half-pixel steps
  between 10 and 14.5) and six weights in the stylesheet; the Month screen renders 16 sizes, 24 uppercase mono labels,
  11 button styles and 39 link-blue controls.
- **Seven hues, shifting meanings.** smalt, cerulean, teal, green, amber, rose and violet sit at similar lightness and
  chroma around the wheel. Teal (the brand color dropped in ADR 0016) still means built, output, ok, new, decided,
  steady and data at once; canvas sections can be painted green, amber or rose, the status colors.
- **The deepest detail comes first.** Hashes, rule versions and provenance open the Day head, the Ontology page, the
  Data tab and the Results outputs.
- **Said several times, in house words.** A paused day is said five ways in one day head; one empty file is two issues
  with three Decide buttons; the Ontology page runs 3,053 words over 7,363 px (1,966 words before its first picture on
  a phone).

## Eight principles

Every finding is tagged with the principles it breaks.

| | Principle | In one line | From |
|---|---|---|---|
| P1 | One page anatomy | Every screen and panel answers: where am I, the verdict, what needs me, why, details | NN/g inverted pyramid; Shneiderman |
| P2 | Color is a signal | ~90% neutral; one action blue; status hues only on status, same meaning everywhere | 60-30-10 (NN/g); Few; Atlassian; Carbon |
| P3 | One primary action | At most one filled button per screen; some screens need none | eBay, NICE, Workday, Visa |
| P4 | Two levels, on demand | The few important things first; the rest in place or in the panel; ≤ 5 tabs | NN/g progressive disclosure, accordions, tabs |
| P5 | Plain words, once | One sentence per idea, conclusion first; labels a newcomer understands; one name per thing | NN/g plain language, F-pattern; W3C clear words |
| P6 | Size and weight rank | Seven sizes, three weights; bold is rare; passes the squint test | NN/g visual design, squint test |
| P7 | Same thing, same look | One button, link, badge, card, tabs, table, panel, shared by every page | Design tokens and components |
| P8 | Never color alone | Glyph and word on every status; 4.5:1 text, 3:1 controls and charts; links underlined | WCAG 1.4.1, 1.4.3, 1.4.11 |

## Color

**Research.** The 60-30-10 rule (interior design, applied to interfaces by NN/g) gives 60% to the background and large
surfaces, 30% to structure, 10% to the accent. In a data tool both the 60 and the 30 are neutrals, so data and status
are the brightest things on screen (Few: muted colors for everything, saturated only for what needs attention, every
difference meaningful). Design systems name colors by job: Material 3's primary/secondary/tertiary and surface roles
with an "on" color each; Radix's twelve steps (1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid, 11–12
text); Atlassian's tokens by property and meaning, accents never on colors with a fixed meaning; Carbon's status
meanings (red danger, orange serious, yellow warning, green success, blue information, grey not started, purple
undefined), each with an icon and a word. On the wheel, complementary accents pop and tire, split-complementary is the
usual interface choice, analogous is calm; in a monitoring product the warm side belongs to status, so the brand stays
blue. WCAG asks 4.5:1 for text, 3:1 for controls and meaningful chart marks, and never color alone; about one man in
twelve has a red-green weakness. Dark themes avoid pure black and desaturate accents.

**Measured** (light, first screens; neutral is OKLCH chroma < 0.015, tinted < 0.04):

| Screen | Neutral | Tinted | Saturated | Saturated hues |
|---|---|---|---|---|
| Month | 89% | 9.9% | 1.2% | rose, amber, smalt |
| Day, paused | 95% | 3.8% | 1.6% | rose, teal, smalt, violet |
| Day, normal | 96% | 3.0% | 0.8% | teal, smalt, violet |
| Panel, held file | 91% | 7.3% | 1.7% | rose, smalt |
| Panel, published dataset Checks | 76% | 23.4% | 0.9% | green, teal, smalt |
| Ontology | 98% | 1.9% | 0.5% | smalt |
| Results | 98% | 2.0% | 0.0% | none |

The app is near 90-8-2, right for a data tool: the problem is hues and meanings, not quantity. Smalt next to body text
is 1.6:1, so un-underlined links fail WCAG 1.4.1's distinction by color alone.

**Proposed roles** (values already in the app or one step from it):

| Role | Light | Dark | Job |
|---|---|---|---|
| Page | `#f4f5f8` | `#0f131a` | the ground |
| Surface | `#ffffff` | `#171c25` | cards, panels |
| Sunken | `#eef0f4` | `#1e2430` | hover, table heads, chips |
| Divider | `#e1e5ec` | `#2d3440` | rules between rows |
| Control outline | `#7a8295` | `#6b7385` | inputs, secondary buttons (3.9:1 on white) |
| Text 3 / 2 / 1 | `#5c6375` / `#3f4656` / `#151922` | `#98a1b3` / `#c3c9d6` / `#e8ebf1` | meta / secondary / primary |
| Action | `#003399` | `#8fa8ff` | primary fill, underlined links, selected tab, focus |
| Action wash | `#e3e9f5` | `#1d2742` | selected row or nav item |
| Needs a decision | `#a3195b` on `#f8e3ec` | `#ff86b5` | paused and what holds it (6.0:1) |
| Unusual | `#8a5a12` on `#f8eedb` | `#e3b55f` | published, something to look at (5.1:1) |
| Passed | `#1d6b3a` on `#e2f0e6` | `#67d391` | explicit confirmation only (5.6:1) |

Cerulean stays in the logo. Teal and violet leave the interface. Budgets, checked by the regression: ≥ 85% neutral,
≤ 3% saturated, ≤ 3 saturated hues on a screen; a normal day shows no status color. Charts: context grey, the series
read in smalt, anomalies in their status color, one chart style for a column's distribution. Canvas sections: frames
and labels, not paint.

## Type, space, components

Seven steps (size/line, weight): caption 12/16 (400–500), small 13/18, body 15/22, title S 17/24 (600), title M 20/28,
title L 24/32, figure 32/40. Weights 400, 500, 600. Mono for identifiers and code only; labels in sentence case. Space
on a 4 px grid (4, 8, 12, 16, 24, 32, 48); radii 6, 10 and round where there are eleven. Components: button (primary,
secondary, quiet), link, status badge, chip, card, section header, key figure, list row, tabs, side panel, banner,
disclosure, table, form field, empty state.

## The findings

54 findings in the full review; the ones that drive the plan:

| | Finding | Fix |
|---|---|---|
| s1 | Run is the loudest control on every screen | Run moves to the Day toolbar; each screen owns its one primary action |
| s2 | The status line names Thu Feb 1 while the page is about March | A global "1 day waits" chip; the day said once, in the title |
| s3 | Viewing as gets prime space; tabs are time spans and jargon; phone header 170 px | A menu behind the flow name; tabs named for their jobs |
| s4 | 11 button styles on one screen; links that look like text | One button with three variants; one underlined link |
| m1 | Month's first screen has no clear top | Title row, the banner, four key figures, calendar and day panel |
| m2 | The month sentence makes readers add numbers | Key figures with plain labels; chips become the calendar's filter |
| m10 | The score is ~2,700 px down | A key figure at the top; changes drawn on its chart |
| d1 | A paused day is said five ways in the day head | One badge, one sentence, one button |
| d2 | Hash, record match and two clocks in the day's first lines | Details disclosure; "Rules v3"; one clock |
| d4 | Canvas sections painted in decorative hues; 9 px uppercase card labels | Neutral cards; status-only color; name first |
| p1 | Up to 16 tabs, different on each card | Summary, Data, Checks, History, Details on every card |
| p2 | One empty file is two cryptic issues and three Decide buttons | Findings grouped by cause; one Decide |
| p3 | A passing file takes 2,600 px to say so | Summary says it in a line; checks as a table; suggestions behind a link |
| p5 | One column drawn three ways in three tabs, two colors | One Data tab, one column chart |
| o1 | Ontology's first screen is prose with nothing to do | Data model: status line, Needs you, the map |
| o2 | Fifteen parts in build order | Map, Files and datasets, Rules, Changes; items open in the panel |
| o3 | The map of kinds is 2,400 px down and drawn twice under two names | One map at the top; one vocabulary |
| o6 | The held file looks like every other in the files list | A table with today's status, problems first |
| r3 | Record uses the flags Month retired; manifests open by default | Shared marks; collapsed manifests; one primary action |

## The plan

Each phase its own branch and PR, checked with `npm run regress -- <sets> --full --shots all` at every size, the blur
test, the contrast and color-budget measure on the regression's screenshots, words before the first picture from the
tour's metrics, and ADR 0012's two-minute test. Many stop sets assert exact strings, so copy changes update them in the
same PR.

0. **Decide.** The maintainer's answers below; ADR 0028, *One visual system*, and the questions in OPEN_QUESTIONS.
1. **Foundation, no layout change.** Role tokens; teal and violet out; seven sizes and three weights; the shared
   components replacing the 17 link rules and ~27 button classes; a test that fails on an off-scale font size, a raw
   color outside the tokens, or more than one primary button in a first screen. Closes s4, d5, p7.
2. **Shell, Month and Day on the anatomy.** Header menu and renamed tabs; Run to the Day toolbar; Month's key figures;
   the day head's badge, sentence, button and Details; About as help; neutral canvas. Closes s1–s3, m1–m11, d1–d7.
3. **The side panel.** Five tabs; findings by cause; checks as a table; one column chart; the decision sheet's type.
   Closes p1–p9, t1–t3.
4. **Data model.** Status line, Needs you, Map / Files and datasets / Rules / Changes, items in the panel. Closes o1–o8.
5. **Words.** A glossary and rename table; one status vocabulary; no ADR numbers in copy; word budgets per screen.
6. **The rest.** Results colored by status with the recorded trend; Access transposed; Audit log; catalogue rows;
   smaltkit's `--sk-*` mapped to the tokens. Closes r1–r3, b1, b2.

## The maintainer's answers (2026-11-21, Q-343 to Q-350, ADR 0028)

1. The first screen is for **the owner who acts**, and explains it upward.
2. **Smalt alone** is the action color; cerulean stays in the mark; teal and violet leave the interface.
3. **Plain names**: Overview, Pipeline, Data model, Outputs, Access, Audit log; one status vocabulary.
4. The Ontology page's first job is to **understand the model**: the map leads, review items become a count.
5. **Calm first, depth on click**; **the same five tabs** on every panel; canvas sections as **frames and labels only**.
6. **ADR 0028, then phase 1.**

## Sources

NN/g: [color](https://www.nngroup.com/articles/color-enhance-design/),
[visual design principles](https://www.nngroup.com/articles/principles-visual-design/),
[visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/),
[squint test](https://www.nngroup.com/videos/squint-test/),
[F-shaped reading](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/),
[inverted pyramid](https://www.nngroup.com/articles/inverted-pyramid/),
[progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/),
[accordions](https://www.nngroup.com/articles/accordions-on-desktop/),
[tabs](https://www.nngroup.com/articles/tabs-used-right/),
[plain language for experts](https://www.nngroup.com/videos/plain-language-for-experts/).
Systems: [Radix scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale),
[Material 3 roles](https://developer.android.com/design/ui/wear/guides/styles/color/roles-tokens),
[Atlassian color](https://atlassian.design/foundations/color),
[Carbon status](https://carbondesignsystem.com/patterns/status-indicator-pattern),
[Refactoring UI palette](https://www.refactoringui.com/previews/building-your-color-palette),
[OKLCH](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl).
Buttons: [eBay](https://playbook.ebay.com/design-system/components/cta-button),
[NICE](https://design-system.nice.org.uk/components/button/),
[Workday](https://canvas.workday.com/v8/components/buttons/button),
[Visa](https://design.visa.com/components/button/usage/).
Accessibility: [WebAIM contrast](https://webaim.org/articles/contrast/),
[W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast),
[Smashing on color blindness](https://www.smashingmagazine.com/2024/02/designing-for-colorblindness/),
[W3C clear words](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p01-clear-words).
Shneiderman, [The eyes have it](https://www.cs.umd.edu/users/ben/papers/Shneiderman1996eyes.pdf) (1996).
Read through web search on 2026-11-21; direct page fetches were blocked by the session's network settings.
