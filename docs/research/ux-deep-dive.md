# UX beyond the visuals: a deep dive (2026-11-21)

The maintainer, after the design review ([ui-design-review.md](ui-design-review.md), ADR 0028): *"It doesn't just have to
be the UX design philosophies that I've been describing. You know, the color choice, hierarchy, user interactivity are
all great things, but, you know, just do a deep dive on UX design in general. Don't limit yourself to what I
specifically said."* This is the research across UX as a whole, the app measured against it, and what it adds to ADR
0028's plan. The full version with screenshots is the same private claude.ai page as the review
(https://claude.ai/artifact/6Yki3eSvu4Q3kWm9QCfrMf), sections *UX beyond the visuals* and *UX findings*.

**How it was measured.** The tour built from this branch after ADR 0028's phase 1 (`npm run build:app -- --variant
tour`), driven by Playwright: axe-core 4.10.2 (installed outside the repository) with WCAG 2.2 A and AA rules on seven
views; a keyboard walk of 70 Tab presses on the paused Wed Mar 27; every control's box at 390 px wide; the first load by
`tools/browser/load.cjs` (three loads, desktop and phone); a day switch timed with screenshots at 0.6 and 2.5 s;
back, forward and reload; a tampered file (tour.cjs's `tamper`); the brief's link.

## Eleven lenses

| Lens | What the research says | From |
|---|---|---|
| Usability heuristics | Nielsen's ten (system status; the user's language; control and freedom; consistency; error prevention; recognition over recall; flexibility and efficiency; minimalism; recovering from errors; help). For complex applications: serve novices and experts at once, promote learning by doing, detailed progress for long waits, back, undo and cancel for high-investment work, direct access over sequences | NN/g |
| Psychology | Hick, Fitts, Jakob, Tesler, the Doherty threshold (under ~400 ms), chunking, peak-end, Von Restorff, Zeigarnik, serial position | Laws of UX (Yablonski) |
| Interaction | Affordances and signifiers, mappings, constraints, feedback, and a system image that carries the right conceptual model | Norman |
| Minds | Mental models differ from the designer's; information scent predicts what a label leads to; cognitive load is intrinsic, extraneous (presentation) and germane (learning): cut the extraneous | NN/g |
| Time | 0.1 s instant, 1 s flow, 10 s attention; an indicator past 1 s, real progress past 10 s | NN/g |
| Errors and control | Messages beside the problem, plain, with the fix; prevent before confirming; undo over warnings; forms with labels above and validation after a field | NN/g; Raskin; web.dev |
| Access | WCAG 2.2 AA: 24 px targets (44 pt Apple, 48 dp Material, more in corners), visible focus never hidden, keyboard for everything, reduced motion; automated checks miss much | W3C; Hoober; web.dev |
| Finding | Catalogs are search-first; experts expect a command palette that shows shortcuts | Atlan; Superhuman; Retool |
| Data tools | Actionable alerts with context; lineage separating will-break from passes-on; tables with sticky heads, visible sort, filters, density; explanations that calibrate trust, never "what" without "why" | incident.io; dbt; Dynatrace; Google PAIR |
| Learning | People act before they read: help in context; empty states as onboarding with sample data | NN/g |
| Knowing it works | Five users a round, iterate; ~20 for quantitative benchmarks; HEART (task success, happiness, adoption); jobs to be done beside personas | NN/g; Google HEART; NN/g JTBD |

## What was measured

| Check | Result |
|---|---|
| axe-core, WCAG 2.2 A/AA, 7 views | 5 issues: none on Month, Day, the decision sheet, Ontology or Results; the panel has `aria-label` on a span (2), a control inside a control (the split bar) and a small zoom button; Record has two small hash chips |
| Keyboard | A ring at every stop; cards are labelled buttons; Enter opens, Escape closes and returns focus to the card; the calendar moves by arrow keys. No skip link: the first card is 23 Tab presses in |
| Targets at 390 px | Month 105 (0 under 24 px, 56 under 44); Day 19 (4 under 24: "‹ March 2024", "The day's story", "About this flow", a 13 px control; 18 under 44); Ontology 92 (3 under 24, 34 under 44) |
| Motion | 7 reduced-motion rules; 80 elements animate or transition |
| First load | The month drawn from the record in 1.5 s; the engine then runs Thu Feb 1 (not asked for) and the header narrates it; first day shown at 9.6 s desktop, 9.2 s phone, after 45.6 MB (6.5 MB gzipped) |
| Day switch | 11.7 s; a static grey status line and "running…" on input cards; no steps, percent or time; a day opened again runs again |
| Navigation | Back and forward work between Month and Day; a card's panel isn't in the address (reload loses it, nothing links to it); picking a day on Month leaves the address as it was |
| Search | None |
| The brief | Only in one card's News tab on a day with something to say; `#brief-2024-03-27` opens Thu Feb 1 on the tour with no panel and no message |
| Errors | A refused file is explained on the day and the card, with what wasn't built and *Fetch it again* |

## Heuristic scorecard (Nielsen's severity, 0 to 4)

| Heuristic | Severity | Evidence |
|---|---|---|
| Visibility of system status | 3 | 10–12 s runs with a static sentence; the header describes another day |
| Match with the real world | 3 | House words (answered by Q-345) |
| User control and freedom | 2 | Escape and Back good; panels lost on reload; decisions permanent without saying so |
| Consistency and standards | 3 | Tabs by card kind; ☑ on Month, ⚑ on Record |
| Error prevention | 1 | Strong: what-if, a rule tried on 14 recorded days, two-step decisions |
| Recognition over recall | 3 | Glyphs to learn, hashes as names, no search |
| Flexibility and efficiency | 3 | No search or palette, undocumented shortcuts, 10–12 s a day |
| Minimalist design | 3 | Month 1,359 words, Ontology 3,053 |
| Recovering from errors | 2 | Refused files good; the brief link silent |
| Help and documentation | 2 | A paragraph and a legend; the guides unlinked |

## The owner's six jobs (Q-343)

| Job | Today | Target |
|---|---|---|
| Tell me if anything needs me | The banner says it, after ~10 s of an unrelated run in the header | Instant from the record; a waits chip in the header |
| Decide a paused day | 3 taps from the banner; three Decide buttons on the held file's panel | One Decide; the decision sheet as is |
| Understand why and explain it upward | The right card (maybe inside a flow), issues titled by check; the brief hidden, its link failing | A Summary tab with the cause; a Brief button on the day head with a working link |
| Find a dataset and what depends on it | No search; files ~3,000 px down; flows to enter | Ctrl K over datasets, columns, rules, days; "used by" |
| Change a rule safely | Guarded (from-date, test on 14 days, restatement) but spread over long forms | A guided change: what, from when, tested, confirmed |
| Prove it to an auditor | Export for audit in one tap; the history prints | Keep |

## Findings (u1 to u12)

| | Finding | What to do |
|---|---|---|
| u1 | Every day switch is a 10–12 s wait with nothing that moves | Show the recorded day at once, verify behind it with real progress; keep finished runs |
| u2 | The first load runs a day nobody asked for, and narrates it | Run a day when it is opened; warm the engine silently |
| u3 | No search anywhere | A Ctrl K palette and header search; a search box on Data model |
| u4 | The brief is buried, and its link fails on the tour | A Brief button on the day head; fix the link; no silent failure |
| u5 | A panel can't be linked, and reload loses it | Level, card and tab in the address; Copy link |
| u6 | Keep: keyboard and screen-reader foundations | Fix the 5 axe issues; a skip link; axe in the regression |
| u7 | On a phone most controls are under 44 px; four under 24 | 24 px minimum, 44 px on touch |
| u8 | Two time axes with no explanation | Defaults that hide them; History; one picture in help |
| u9 | A vocabulary of glyphs to remember | Glyph and word together, everywhere |
| u10 | Keep: the safety nets | "Try it first" beside every change; say a decision is permanent |
| u11 | Keep: a refused file is a good error | Plain meaning first, hashes under Details |
| u12 | Help is a paragraph and a legend | A help panel: the model, the glossary, shortcuts, guides |

## What it adds to the plan (ADR 0028 §10)

- **A. Time** (with phase 2): the recorded day shown at once and verified in the background; finished runs kept; no
  run on first load. u1, u2.
- **B. Finding** (with phase 4): Ctrl K and header search; search on Data model; "used by". u3.
- **C. Sharing** (with phase 3): panel and tab in the address; Copy link; the Brief on the day head, its link fixed.
  u4, u5.
- **D. Access** (now, then held by the regression): the five issues, a skip link, target sizes. u6, u7.
- **E. Learning** (with phase 5): the help panel; glyphs with words; the two clocks explained. u8, u9, u12.
- **F. Errors and safety** (every phase): no silent dead ends; "Try it first"; permanence said. u10, u11.
- **G. Knowing it works** (every phase): a five-person round on the six jobs after each phase (success, time, errors,
  satisfaction; the two-minute explanation as the headline); budgets in the regression for time to show a day, steps
  per job, words before the first picture, accessibility issues and the color budget.

## Sources

NN/g: [ten heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/),
[heuristics for complex applications](https://www.nngroup.com/articles/usability-heuristics-complex-applications/),
[complex applications](https://www.nngroup.com/articles/complex-application-design/),
[mental models](https://www.nngroup.com/articles/mental-models/),
[information foraging](https://www.nngroup.com/articles/information-foraging/),
[cognitive load](https://www.nngroup.com/articles/minimize-cognitive-load/),
[response time limits](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/),
[error messages](https://www.nngroup.com/articles/error-message-guidelines/),
[empty states](https://www.nngroup.com/articles/empty-state-interface-design/),
[five users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/),
[personas and jobs to be done](https://www.nngroup.com/articles/personas-jobs-be-done/).
[Laws of UX](https://lawsofux.com/);
[Norman's principles](https://uxmag.com/articles/understanding-don-normans-principles-of-interaction);
[Raskin, never use a warning when you mean undo](https://alistapart.com/article/neveruseawarning);
[web.dev forms](https://web.dev/learn/forms/design-basics) and [motion](https://web.dev/learn/accessibility/motion);
[What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/);
[accessible target sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/);
[Superhuman, command palettes](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/);
[Atlan, catalog features](https://atlan.com/data-catalog-features/);
[incident.io, alerting](https://incident.io/blog/sre-alerting-best-practices);
[dbt column-level lineage](https://docs.getdbt.com/docs/collaborate/column-level-lineage);
[Dynatrace data tables](https://developer.dynatrace.com/design/components/tables/DataTable/usage/);
[Google PAIR, explainability and trust](https://pair.withgoogle.com/chapter/explainability-trust/);
[Workday button language](https://canvas.workday.com/content/ui-text/buttons-ctas);
[W3C, time zones](https://www.w3.org/TR/timezone/);
[Google HEART](https://research.google.com/pubs/archive/36299.pdf).
Read through web search on 2026-11-21 (direct page fetches were blocked by the session's network settings).
