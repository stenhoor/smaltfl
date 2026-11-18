# Architecture Decision Records

Each significant decision gets a short record: `NNNN-title.md` with **Context / Decision / Consequences**. These
records start from the answers to the questions in [../OPEN_QUESTIONS.md](../OPEN_QUESTIONS.md).

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-initial-decisions.md) | Initial decisions | accepted |
| [0002](0002-second-round-decisions.md) | Identity, districts, snapshots, the builder, the colour | accepted |
| [0003](0003-third-round-decisions.md) | The ontology screens, the scenario's actions, the mark on hold | accepted; §3 superseded by ADR 0016 |
| [0004](0004-the-flow-plan.md) | The flow plan: people say what, the machine decides how | accepted |
| [0005](0005-licence.md) | The licence | accepted |
| [0006](0006-integrity.md) | Integrity from source bytes to the record | accepted |
| [0007](0007-repository-home.md) | The repository moves to stenhoor/smaltfl | accepted |
| [0008](0008-visual-first-news.md) | The day's news, drawn | accepted |
| [0009](0009-paused-not-published.md) | A day that is off is paused, not published | accepted (Q-47, Q-52 decided as built; Q-51 changed by ADR 0022); [amendment 1](0009-paused-not-published.md#amendment-1-filling-a-paused-day-slice-2), filling a paused day: proposed |
| [0010](0010-any-dataset.md) | The news, the story and the pause, for any dataset | proposed (Q-59, Q-68–Q-85 decided as built 2026-11-14, but Q-75, open, and Q-84, changed by ADR 0022) |
| [0011](0011-notebooks-as-the-step-surface.md) | Notebooks as the step surface | proposed (Q-87–Q-95 answered 2026-11-09; nothing built) |
| [0012](0012-visual-first-in-two-minutes.md) | Visual first, in two minutes: the brief, the incident page, the drill and the phone canvas | proposed (Q-96–Q-103 answered 2026-11-09; the brief and the first step of the phone canvas built) |
| [0013](0013-discovered-checks.md) | Checks nobody wrote: combinations judged from the history, and a dataset the flow builds watched like a source | proposed (Q-104–Q-108 confirmed and Q-109 changed by ADR 0022, 2026-11-14; built on the controls example; §8 the control estate) |
| [0014](0014-gates.md) | Gates: bronze, silver and gold checks in the notebook, written bands and due dates in the ontology, a sealed gold | accepted (Q-110–Q-117 answered 2026-11-09); all seven slices built 2026-11-10; the control estate is its answer key |
| [0015](0015-the-bronze-layer.md) | The bronze layer: checks driven by the ontology, a mode a column, the card read as a notebook | proposed (the maintainer's request of 2026-11-10; Q-134–Q-139, answered 2026-11-14); amendment 2, one concept (checks) and the bronze card's Quality and Notebook: accepted (Q-160–Q-162); amendments 3 to 5 (checks explained for any dataset, the silver layer, the bronze tables' metadata): accepted (Q-166–Q-168) |
| [0016](0016-the-mark.md) | The mark is the Twin, in the user-tool layer's cerulean | accepted |
| [0017](0017-stenhoors-repositories-at-main.md) | Built on stenhoor's repositories, at their latest main | accepted (Q-156, 2026-11-11) |
| [0019](0019-ranges-computed-ahead.md) | Ranges computed ahead, and a first load measured | accepted (Q-163, Q-164, 2026-11-11) |
| [0018](0018-phone-tablet-and-desktop.md) | Phone, tablet and desktop | accepted (Q-157, 2026-11-11); amendment 1, the desktop split (Q-159) |
| [0020](0020-the-estate-as-a-company.md) | The estate as a company: an organisation, shared infrastructure, and a real bronze, silver and gold | accepted (the maintainer's answers to Q-169–Q-175, 2026-11-12) |
| [0021](0021-time.md) | Time: a month to pick a day from, the day itself, and every version of it | accepted (the maintainer's answers to Q-181–Q-192, 2026-11-13); built in the slices of §9 |
| [0022](0022-the-answers-of-2026-11-14.md) | The answers of 2026-11-14: a what-if and a restatement decided where they are, columns that change, the ontology as the one place for rules, and pausing | accepted (the maintainer's answers of 2026-11-14); slices 1 to 3 and slice 4's first part built; the addendum of 2026-11-15 retired the taxi example |
| [0023](0023-the-demo-as-a-tour.md) | The demo as a tour of what a flow can do | accepted (the maintainer's direction, 2026-11-15); built in the slices of §6 |
| [0024](0024-the-month-at-a-glance.md) | The month at a glance: a sentence and its counts, five marks, a day told in order, a row a file | proposed (the maintainer's request of 2026-11-16; Q-219–Q-225 built as proposed, for the maintainers to confirm) |
| [0025](0025-the-browser-regression-in-minutes.md) | The browser regression in minutes: the page asked when it is at rest, each set replayed once and resized, the engine's runs budgeted, CI the rest | proposed (the maintainer's request of 2026-11-16; Q-226–Q-230 built as proposed, for the maintainers to confirm); amended 2026-11-17 for ADR 0026's sets (Q-246) |
| [0026](0026-flows-in-flows.md) | Flows in flows: a flow reads other flows, each a card with its day's mark that opens into its own flow, rolled up by the month | accepted (the maintainer's answers to Q-231–Q-245, 2026-11-17); built, every slice of §12 |
| [0027](0027-the-ontology-over-time.md) | The ontology over time: the ontology first, every change dated with a kind and a reason, events as context, and each day read under what was in force | accepted (the maintainer's answers to Q-247–Q-279, 2026-11-18); not built yet: in the slices of §11 |
