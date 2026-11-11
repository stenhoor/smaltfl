# Explaining checks visually, for any dataset (2026-11-11)

Research behind ADR 0015 amendment 3: how data quality and observability tools picture rule checks, learned checks and
column profiles, and how explainable-AI guidance says a model's finding should be told to someone who is not a
specialist. Gathered from search results. Pages from pair.withgoogle.com, docs.evidentlyai.com and nngroup.com could not
be fetched, so their search extracts were used. For Lightup, Sifflet, Deequ, Hex, Mode, Kaggle and Atlan only inference
is given.

## What the tools show

- **A learned band behind a series** is the idiom everyone shares:
  - Soda: an expected band, points outside it flagged, missing scans shown as missing, the learned range kept apart from a hard valid range.
  - Elementary: training and detection sets, mean ± 3 SD, Monday learned from Mondays, incidents excluded, "expected outlier" feedback.
  - Bigeye: autothresholds, incidents kept out of training.
  - Monte Carlo: volume and freshness learned within a couple of weeks; each value's share of rows tracked.
  - Metaplane: one-sided monitors.
  - Sources: docs.soda.io/data-observability/metric-monitor-page, docs.elementary-data.com/data-tests/how-anomaly-detection-works, docs.bigeye.com/docs/autothresholds, docs.getmontecarlo.com/docs/pipeline-observability.
- **Drivers and segments explain why.** Anomalo highlights where the anomalous rows are concentrated ("100% of anomalous rows are in NY vs 29.8% of population"), with a WHERE clause that pulls those rows (anomalo.com/blog/root-causing-data-failures). Deepchecks' multivariate drift is a domain classifier: an AUC and the top features by importance.
- **Rule checks** are a line of status · expectation in prose · observed value, with counts and examples (Great Expectations Data Docs; dbt tests).
- **Drift reports** lead with the share of columns that drifted, then each column's score with reference and current distributions (Evidently, whylogs).
- **Column profiles** put alerts above statistics (ydata-profiling). They show a valid / error / empty bar for each column (Power BI column quality), a mini distribution under each header (Power BI, Observable, Hugging Face), charts linked to the rows, and a flag when only part of the data was read (Hugging Face `partial`).

## Telling a model's finding (PAIR, Microsoft HAX, NN/g, classifier two-sample tests)

1. **Calibrated trust, not maximum trust.** Say what the model does, what data it used and how sure it is (PAIR Explainability + Trust).
2. **Match the words to how strong the evidence is** (HAX G2A to G2D). Say why, with local and example-based explanations (HAX G11).
3. **Explanations must be faithful** to what the model did (NN/g). Contrastive explanations work best: "unlike the usual" (XAI reviews).
4. **For the classifier:** AUC 0.5 is chance. The score must come from held-out data, and the floor from permuted labels. "Different" does not mean "harmful". Importances are the clue to why, and unstable when columns are correlated.
5. **For the forest:** say "what made today easy to single out", not a cause.
6. **For uncertainty:** frequencies ("77 in 100") read better than percentages. A band is read as a fixed value unless it is said otherwise (Padilla, Kay and Hullman 2020).

## Visual rules

- Keep charts word-sized and use small multiples (Tufte).
- Use bullet graphs instead of gauges (Few).
- Never show severity by colour alone: add a shape and a word (WCAG 1.4.1).
- Annotate directly instead of using a legend, and keep one message per chart.
- Put detail behind a tap, because phones have no hover.

## Check → picture → sentence (as built, or what the app already draws)

| Check | Picture | Sentence |
|---|---|---|
| amount | today against its band | "{n} rows today; usually {low}–{high}" |
| blanks | filled / blank bar; share against its band | "{pct} of {column} is blank; usually under {usual}" |
| values (band, bad) | the value's share against the band (dumbbell) | "{value}: {pct}; the ontology expects {low}–{high}" |
| rules | rows that break it, with its share of the limit | "{k} rows break {rule}" |
| due | share still due against the usual late share | "{pct} still due; usually up to {usual}" |
| scope, needs, reconcile | today against its learned range (bullet) | "today {x}; usually {low}–{high}" |
| shares | each common value's share against its range (dumbbells) | "{value} is {pct}; usually {low}–{high}" |
| shape | quantiles against their bands | "{column} runs higher than usual" |
| pairs | times as often as their shares explain, against usual (bullet) | "{a} with {b}: {x}× as often; usually {low}–{high}×" |
| forest | today's score against the oddest day learned from | "today {s}; the oddest of {n} days {h}" |
| classifier | AUC on a track from chance, the 0.7 tick, columns by share | "picks today's row {k} times in 100; a coin toss gets 50" |

## Per-column card (as built)

What it is (title, role, meaning or a line read from its values) → today → its values (filled bar, distinct count,
shape or common values) → against a usual day (each common value's share against its range) → the checks on it, each
with how it decides → who reads it (whether the models read it, and why not).
