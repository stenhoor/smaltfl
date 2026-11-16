# A month read at a glance: research notes (2026-11-16)

Research behind [ADR 0024](../adr/0024-the-month-at-a-glance.md). The maintainer, on the tour's month screen:

> I think we should be able to page through the different months. […] If I click on one of the days, the pop-up panel
> on the right isn't particularly helpful at figuring out what was actually going on that day. The symbols are a little
> confusing. […] I also don't really understand the score and why it's fluctuating. And then when we open up the files
> to see all the different steps, it's just like so much information. It's a little overwhelming. […] I'd like you to do
> a deep dive on best UI practices for this type of stuff and come up with a solution so we can get a very quick
> high-level overview, month over month, which ones are doing well, where did things kind of break, where should we go
> investigate, are things trending the right direction, are our incoming data sets doing well, or are we having bigger
> problems?

Five threads were researched in parallel. The session's network reaches few hosts: most pages were read as search
extracts, and design systems' own guidance from their public repositories. A source read only as an extract is marked
*(extract)*. Lines marked *(inference)* are the researcher's synthesis, not a source's claim.

## 1. How tools show the health of many things over many days

Every source in this thread is *(extract)*. Not verified: Sentry's cron timeline, Prefect's dashboard layout, Dagster's
partition colours, any period comparison in PagerDuty.

- **An uptime strip per row, with a number at its end.**
  - Statuspage draws 90 daily bars for each component, with its uptime beneath. A day is coloured by its minutes of
    outage, and hovering one links to the incident that named the component.
    [Statuspage](https://support.atlassian.com/statuspage/docs/display-historical-uptime-of-components)
  - Better Stack offers 7 to 365 days. Airflow 3's Dag list puts a small bar chart of recent runs on each row. Datadog's
    SLO panel pairs status bars with the error budget left. Dagster draws one bar for all of an asset's partitions.
    [Better Stack](https://betterstack.com/docs/uptime/working-with-status-pages/widget-types/),
    [Airflow](https://airflow.apache.org/docs/apache-airflow/3.0.3/ui.html),
    [Datadog](https://docs.datadoghq.com/service_management/service_level_objectives/)
  - It answers: which things had bad days, when, and how each did overall.
  - It fails when two minutes of trouble paint a whole day red, when a day without data is drawn green, or when red
    against green is the only signal. incident.io draws empty bars for days with no data.
    [a critique](https://github.com/OneUptime/oneuptime/pull/4712),
    [incident.io](https://docs.incident.io/status-pages/uptime-backfill)
- **A roll-up to one status, and "N of M".**
  - TestGrid rates each tab passing, flaky or failing, and heads a group "11 / 18 Passing".
    [TestGrid](https://testgrid.kubernetes.io/kops)
  - Dagster+ gives an asset one status (healthy, warning or degraded), the worst of its last materialisation, its
    freshness and its checks. dbt marks resources healthy, caution, degraded or unknown.
    [Dagster+](https://docs.dagster.io/guides/observe/asset-health-status),
    [dbt](https://docs.getdbt.com/docs/explore/data-health-signals)
  - It fails when the number is opaque: two of Soda's own pages define its health score in opposite directions.
    [Soda](https://docs.soda.io/manage-issues/organization-dashboard)
- **A needs-attention list: only what is wrong, the worst first.**
  - Datadog's Triggered Monitors page lists only alerting, warning and no-data monitors. Sentry's *For Review* holds new
    and regressed issues nobody has looked at. TestGrid can hide tests that never failed.
    [Datadog](https://docs.datadoghq.com/monitors/manage/),
    [Sentry](https://docs.sentry.io/product/issues/states-triage/)
  - Healthy rows are absent, not dimmed.
- **An incident list with what was decided.**
  - Monte Carlo's alerts carry a status: none, acknowledged, work in progress, fixed, expected, no action needed.
    Elementary groups incidents as open, acknowledged and resolved. Bigeye's *mark as normal* moves the threshold.
    [Monte Carlo](https://docs.getmontecarlo.com/docs/incident-statuses),
    [Elementary](https://docs.elementary-data.com/cloud/features/alerts-and-incidents/incident-management),
    [Bigeye](https://docs.bigeye.com/docs/change-the-issue-status)
  - It answers: what broke this period, and what became of it.
- **A calendar of days.**
  - Airflow 2's calendar showed a Dag's successes and failures over months. Airflow 3.0 dropped it, users missed it,
    and 3.1 rebuilt it with filters. Statuspage's uptime page shows three months at a time, each with its percentage.
    Hyperping circles incident days and its arrows change the month.
    [Airflow 3.1](https://airflow.apache.org/blog/airflow-3.1.0/),
    [Hyperping](https://hyperping.com/docs/status-page/incident-calendar)
  - It fails with many incidents: incident.io calls its own calendar "overwhelming, with numerous red circles" and
    offers a list instead. [incident.io](https://incident.io/changelog/status-page-list-view)
- **A grid of things by time.**
  - Airflow's grid has a row for each task and a column for each run, and task groups collapse to a summary. Grafana's
    status history gives each series a row of boxes; its state timeline merges equal neighbours into bands.
    [Airflow grid](https://airflow.apache.org/docs/apache-airflow/3.0.5/ui.html),
    [Grafana](https://grafana.com/docs/grafana/v12.4/panels-visualizations/visualizations/status-history/)
  - Complaints about Airflow's: slow on large Dags, and the grid and the graph hiding each other.
    [an issue](https://github.com/apache/airflow/issues/23772)
- **Windows side by side, and a comparison with the period before.**
  - Datadog's SLO widget sets up to three windows side by side (month to date, previous month). incident.io's date
    picker has *Compare with previous period*. Soda's number tile shows the change against the period before.
    [Datadog](https://docs.datadoghq.com/dashboards/widgets/slo/),
    [incident.io](https://incident.io/changelog/insights-comparison-view)

## 2. What the design literature says

Every source in this thread is *(extract)*. Not found: a study of count-style headlines; studies of collapsing all-good
rows or of sorting the worst first (both follow from filtering and from Few).

**The overview**

- **One screen, read at a glance** (Few). His list of dashboard mistakes: thin context, too much detail, needless
  variety, weak highlighting, clutter, misused colour.
  [a review](https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php)
- **Overview first, zoom and filter, then details on demand** (Shneiderman). Filtering means removing what is of no
  interest. [the paper](https://drum.lib.umd.edu/items/cd983adb-568a-47d3-b43a-1d8d8b8c72f4/full)
- **Dashboards are read fast, with little interaction.** Position and length are read more accurately than area or
  colour (NN/g; Cleveland and McGill, replicated by Heer and Bostock).
  [NN/g](https://www.nngroup.com/articles/dashboards-preattentive/),
  [Heer and Bostock](https://homes.cs.washington.edu/~jheer/files/2010-MTurk-CHI.pdf)
- **Progressive disclosure**: show the few most important things and defer the rest (NN/g).
  [NN/g](https://www.nngroup.com/articles/progressive-disclosure/)
- **Conclusion first** (BLUF, the inverted pyramid): a reader who stops early still has the point.
  [NN/g](https://www.nngroup.com/articles/inverted-pyramid/)

**Calm by default**

- **Management by exception**: raise only what departs from the usual.
  [definition](https://www.accountingtools.com/articles/what-is-management-by-exception.html)
- **Each extra mark devalues the rest.** In one clinical study, acceptance of reminders fell 30% for each extra reminder
  in an encounter. [the study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195)
- **Focus matters more than stripping.** Decluttering a chart raised only how professional it looked; adding a focus
  raised clarity and decided what readers remembered.
  [the study](https://visualthinking.psych.northwestern.edu/projects/DeclutterFocus)
- **Small multiples**, one design on shared scales, answer "compared to what?" (Tufte).
  [small multiples](https://en.wikipedia.org/wiki/Small_multiple)

**Numbers and trends**

- **A bare number needs a baseline and a direction**: what is normal, and a sparkline.
  [KPI cards](https://tabulareditor.com/blog/kpi-card-best-practices-dashboard-design)
- **One or two numbers read better as big text than as a chart** (Knaflic).
  [simple text](https://www.storytellingwithdata.com/blog/2021/5/20/storytelling-with-simple-text)
- **Two-point comparisons mislead, and so does red or green against a target** (Wheeler, via Graban).
  [process behaviour charts](https://www.leanblog.org/2021/05/process-behavior-charts-vs-red-green-metrics/)
- **Readers preferred the most annotated line charts**, and event marks on a time series are standard monitoring
  practice. [text and charts](https://vis.csail.mit.edu/pubs/vis-text-balance),
  [Grafana](https://grafana.com/docs/grafana/v13.1/dashboards/build-dashboards/annotate-visualizations/)

**The calendar**

- **Days coloured on a calendar make holidays and odd days stand out** (van Wijk and van Selow, 1999).
  [the paper](https://research.tue.nl/en/publications/cluster-and-calendar-based-visualization-of-time-series-data/)
- **Its limits**: it finds a date and shows a weekly rhythm, at the cost of precision. Colour is the least accurate
  channel for a magnitude. A line is for a trend.
  [FT visual vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md)

**A matrix of states**

- **Reordering rows exposes structure** (Bertin). [history](https://www.datavis.ca/papers/HeatmapHistory.pdf)
- **Shape is not selective**: a reader cannot pick out one group by its shape alone among others (Bertin, from a
  secondary source). [visual variables](https://axismaps.com/guide/visual-variables)
- **About five to seven categories at once**, a rule of thumb (Healey; Miller).
  [Healey](https://www.cs.ubc.ca/sites/default/files/tr/1996/TR-96-10_0.pdf)
- **Icons need visible labels. Freeze the header row and the first column. One record opens in a side panel that
  doesn't cover the list** (NN/g). [icons](https://www.nngroup.com/articles/icon-usability/),
  [tables](https://www.nngroup.com/articles/data-tables/)
- **Nothing vital in a tooltip** (NN/g). [tooltips](https://www.nngroup.com/articles/tooltip-guidelines/)

## 3. Status symbols

Most of this thread was read from the design systems' own public repositories, the text their sites are built from.
Not seen, so not reported: NN/g on icons, Statuspage's component states, Material 3's site, and any study of a legend
against direct labels.

**Design systems**

- **Carbon**, status indicators:
  - a shape indicator (shape, colour and a label) is its variant for small spaces, drawn at 16 px;
  - more than five or six indicators "can overwhelm";
  - where no action is needed, it may show none;
  - one shape shouldn't appear in several colours, and yellow and orange shapes get a darker outline;
  - a numbered badge needs a 48 px button; otherwise use a dot;
  - in its set, "!" in a triangle is caution, a half-filled circle is *incomplete* and a dashed circle is *not started*.

  [the pattern](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/patterns/status-indicator-pattern/index.mdx)
- **PatternFly**: status and severity are separate and not interchangeable. Each needs text, colour and an icon
  together, and a severity scale has three to six levels.
  [status and severity](https://github.com/patternfly/patternfly-org/blob/main/packages/documentation-site/patternfly-docs/content/patterns/status-and-severity/status-and-severity.md)
- **GOV.UK**: start with the fewest statuses, since each one added is harder to remember. *Completed* is plain black
  text, so that what needs action stands out. One icon gets read several ways: icons help returning users scan, with a
  visible label. [tag](https://github.com/alphagov/govuk-design-system/blob/main/src/components/tag/index.md),
  [task list](https://github.com/alphagov/govuk-design-system/blob/main/src/patterns/complete-multiple-tasks/index.md)
- **Astro** (aerospace): six statuses, each its own shape and colour at 12 px. A count is a separate boxed number beside
  the icon, and combined statuses show the most urgent.
  [rux-status](https://github.com/RocketCommunicationsInc/astro/tree/main/packages/web-components/src/components/rux-status)
- **Atlassian**: a lozenge is a status *word* in a semantic colour, and a badge is for numbers only.
  [lozenge](https://www.npmjs.com/package/@atlaskit/lozenge)

**Accessibility and size**

- **WCAG**: colour can't be the only cue (1.4.1). Graphics need 3:1 contrast against what is beside them, and thin
  lines render fainter (1.4.11). A target is at least 24 × 24 CSS px (2.5.8).
  [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html),
  [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
- **Primer**: icons are drawn at 16 and 24 px, and 12 px only as a special case.
  [icons](https://github.com/primer/design/blob/main/content/foundations/icons/design-guidelines.mdx)

**How tools keep the outcome apart from what people did**

- **GitHub**: a check has a status (queued, in progress, waiting) and, once complete, a separate conclusion (success,
  failure, neutral, skipped).
  [status checks](https://github.com/github/docs/blob/main/content/pull-requests/reference/status-checks.md)
- **GitLab**: a blocking manual job makes the pipeline *blocked*, and an allowed failure shows a warning while the
  pipeline passes. [job control](https://github.com/gitlabhq/gitlabhq/blob/master/doc/ci/jobs/job_control.md)
- **Airflow**: fourteen task states, each a colour and an icon. Waiting for a person is a state of its own, and a
  person's note is a corner mark on the badge.
  [grid](https://github.com/apache/airflow/blob/main/airflow-core/src/airflow/ui/src/layouts/Details/Grid/GridTI.tsx)
- **Dagster**: asset health rolls up to healthy, warning, degraded or unknown, with the parts as text on demand, and
  its status filters carry counts.
  [asset health](https://github.com/dagster-io/dagster/blob/master/js_modules/ui-core/src/assets/AssetHealthSummary.tsx)
- **Grafana**: a rule's state and its health are separate lists.
  [state and health](https://github.com/grafana/grafana/blob/main/docs/sources/alerting/fundamentals/alert-rule-evaluation/alert-rule-state-and-health.md)

**What it means for the calendar's marks** *(inference)*

The month's calendar drew one of ten glyphs in one slot. Two different facts shared that slot: what the checks made of
the day (fine, unusual, paused), and what people then did (published as is, filled, accepted, kept back, sent again).

1. **Five marks, one silhouette each**, and a word wherever there is room for one.
2. **What people did is a word, not a glyph**: the flag, the half box, the stepped line and the round arrow go from the
   calendar. The half-filled box also meant *incomplete* in the one convention found for it.
3. **No superscript count.** A day's versions are said in words.
4. **Colour for what needs someone**: a waiting day is the one filled cell. A normal day's mark is grey.
5. **The key is the count**: each mark is taught beside the number of days it stands for, where the eye lands first.

## 4. Explaining a score, and why it moves

Every source in this thread is *(extract)*.

**How products explain a composite score**

- **Microsoft Secure Score** shows a percentage with the points achieved of the total. Its history is a graph over the
  list of actions with their points; *Metrics & trends* adds points gained, regressed and net. A new recommended action
  raises the total, so the percentage can fall with nothing changed, and the page says so.
  [history](https://learn.microsoft.com/en-gb/defender-xdr/microsoft-secure-score-history-metrics-trends),
  [overview](https://learn.microsoft.com/defender-xdr/microsoft-secure-score)
- **Microsoft Exposure Management** lets a reader choose a time point and see its effect on the score and the reason,
  down to assets added or removed. [initiatives](https://learn.microsoft.com/en-us/security-exposure-management/initiatives)
- **AWS Security Hub** scores passed ÷ enabled controls, leaves out controls with no data, stamps when it was computed,
  and charts passed and failed checks beneath it.
  [scores](https://docs.aws.amazon.com/securityhub/latest/userguide/standards-security-score.html)
- **Google Security Command Center** gives the percentage of *checked* controls passing, a trend and the top failing
  controls. [compliance](https://docs.cloud.google.com/security-command-center/docs/compliance-management)
- **SecurityScorecard** keeps an event log of new, resolved and decayed findings by factor, and says that asset counts
  and recalibrations move a score too. **Bitsight**'s daily report says a rating rose, fell or held steady, and splits a
  change by risk vector.
  [event log](https://support.securityscorecard.com/hc/en-us/articles/360055958812-History-tab-and-event-log),
  [daily report](https://help.bitsighttech.com/hc/en-us/articles/36078394828311-Daily-Ratings-Change-Report)
- **Lighthouse** publishes its weights, says under the gauge that values vary, and links a calculator.
  [scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- **FICO** gives the top four or five reasons for a score, ranked.
  [reason codes](https://www.myfico.com/credit-education/blog/reason-codes)

**Explaining a change between two points**

- **Power BI's Analyze** explains a point against the one before it as a waterfall; **Tableau Pulse** draws an
  expected-range band with top drivers and detractors; **AWS Cost Comparison** shows the top three drivers, then *view
  all*. [Power BI](https://learn.microsoft.com/power-bi/consumer/end-user-analyze-visuals),
  [Pulse](https://help.tableau.com/current/online/en-us/pulse_insights_platform_insight_types.htm),
  [Cost Comparison](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-cost-comparison.html)
- A waterfall explains a net change in a few steps, and fails when the starting value dwarfs the changes.
  [Storytelling with Data](https://www.storytellingwithdata.com/blog/2020/11/16/what-is-a-waterfall)

**Signal and noise**

- **Wheeler's process behaviour (XmR) chart**: limits at the mean ± 2.66 × the average day-to-day move. A signal is a
  point outside them, or a long run on one side of the mean. Two points are never a trend.
  [limits](https://www.spcforexcel.com/Downloads/pdf/Ten_Things_to_Know_When_Using_the_Individuals_Control_Chart.pdf),
  [Commoncog](https://commoncog.com/process-behaviour-charts-more-than-you-need/)
- **NHS Making Data Count** colours a metric grey for no significant change, and only then blue for improvement or
  orange for concern.
  [NHS](https://www.england.nhs.uk/wp-content/uploads/2019/12/making-data-count-strengthening-your-decisions.pdf)

**Axes and wording**

- A line chart's axis may start above zero, but cropping inflates the change a reader perceives, even with break marks
  (Correll et al.). [Correll et al.](https://par.nsf.gov/servlets/purl/10196700),
  [EU data visualisation guide](https://data.europa.eu/apps/data-visualisation-guide/scales-in-line-charts)
- Say a change in *points*, never as a relative per cent of a percentage (ONS).
  [ONS](https://service-manual.ons.gov.uk/content/numbers/percentages)
- Leave gaps where nothing was measured, and dash what is assumed (Datawrapper).
  [Datawrapper](https://www.datawrapper.de/academy/missing-data-in-line-charts)

**What it means for the score on the month** *(inference)*

1. **The number first, with its fraction**: the score, then what it is a share of.
2. **A verdict from a rule, not from the sign of the change.** *Steady* is a finding, and the most common one.
3. **The definition in one sentence, always on screen**, coverage in a sentence of its own.
4. **A stated axis**, the first and last values labelled, a break where no score was published.
5. **Why it moved** as the few biggest movers, counted in things a person can check, with data causes (a day not
   published, a filled day) kept apart from changes in what was measured.

## 5. Paging through periods, and the panel for a day

Read from each publisher's own repository unless marked. Not opened, so not claimed: GA4, Stripe, Statuspage, Material 3,
incident.io, the SRE book's own text, SBAR, BLUF. Nothing citable was found on streaks.

**Paging**

- **The date picker of the ARIA Authoring Practices**: previous and next buttons around a month-and-year heading, which
  is a polite live region. The grid is one Tab stop: arrows move by day and week, Home and End to the ends of a week,
  Page Up and Page Down by month.
  [the example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
- **At the ends**, calendars disable the button (FullCalendar, Polaris, React Aria); link pagination hides it (GOV.UK).
  [FullCalendar](https://fullcalendar.io/docs/validRange),
  [Polaris](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/navigation/pagination.mdx)
- **One month at a time** is Carbon's default. Two at once is for picking a range.
  [Carbon](https://carbondesignsystem.com/components/date-picker/usage/),
  [NN/g](https://www.nngroup.com/articles/date-input/) *(extract)*
- **A link for each page** (Primer), and the page in the title (GOV.UK).
  [Primer](https://github.com/primer/design/blob/main/content/components/pagination.mdx)
- **Comparison with the period before.** Plausible compares with the previous period and, for a part-period, with the
  same elapsed span. Metabase's trend shows the latest value and its change, reverses its colours where up is bad, and
  shows none where nothing precedes. [Plausible](https://plausible.io/docs/compare-stats),
  [Metabase](https://www.metabase.com/docs/latest/questions/visualizations/trend)

**A summary for a period**

- **PatternFly's aggregate status card**: a total, then the non-zero exception counts, each a link.
  [dashboard](https://www.patternfly.org/patterns/dashboard)
- **GitHub's contribution graph**: a year of day squares under a total, and a square opens its day.
  [contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/viewing-contributions-on-your-profile)

**The panel for one day**

- **Sentry's inbox**: the list on the left, a preview on the right holding only what helps decide the next step, and
  *Open issue* for the rest. [inbox](https://docs.sentry.io/product/issues/inbox/)
- **PatternFly's primary-detail**: a selected state, a title naming the item, an empty state, and one pane on a phone.
  [primary-detail](https://www.patternfly.org/patterns/primary-detail)
- **Tooltips hold non-essential text only, and don't exist on touch** (Carbon, Primer). Don't hide what most users
  need (GOV.UK). [Carbon](https://carbondesignsystem.com/components/tooltip/usage/),
  [GOV.UK](https://design-system.service.gov.uk/components/details/)
- **What an incident says.** Datadog: a summary, the impact with its times, the root cause, how it was detected, its
  status. PagerDuty: an overview sentence, the resolution, exact numbers, a timeline, actions.
  [Datadog](https://docs.datadoghq.com/incident_response/incident_management/investigate/describe/),
  [PagerDuty](https://response.pagerduty.com/after/post_mortem_template/)
- **A timeline is typed entries, with who and when, the oldest first** (Datadog).
  [timeline](https://docs.datadoghq.com/incident_response/incident_management/investigate/timeline/)
- **The conclusion first; about 110 words where half of them are to be read** (plainlanguage.gov).
  [guidelines](https://github.com/GSA/plainlanguage.gov/blob/main/_pages/guidelines/web/index.md)

**A list of what waits**

- **GitHub's triage guide orders an inbox by "who am I blocking?"**
  [the guide](https://docs.github.com/en/subscriptions-and-notifications/tutorials/customizing-a-workflow-for-triaging-your-notifications)
- **GitLab's To-Do List** holds what waits for your input, and an item is closed by doing it.
  [to-dos](https://docs.gitlab.com/user/todos/)
- **Cachet pins ongoing incidents above its dated timeline.**
  [incidents](https://github.com/cachethq/docs/blob/3.x/v3.x/guide/incidents.mdx)

## What it adds up to

The month screen, measured before the change (the tour at desktop size, `tools/browser/tour.cjs`): 1,155 words on the
screen, 437 of them before the first chart; ten different glyphs in the calendar's one slot; a grid whose first row
opens to 60 rows of 60 cells, about 3,600 cells of which some 30 carry a mark.

Ten rules, each from the threads above (in brackets), in the order a reader meets them:

1. **Say the month in a sentence first**, with its counts (2: conclusion first; 5: a total, then the exceptions).
2. **What waits for a person goes above everything**, across every month, and is gone when nothing waits (1: a
   needs-attention list; 5: who am I blocking).
3. **One month on screen, with a pager and a link of its own**; the months side by side as small multiples of one design
   (5: one month at a time; 2: small multiples; 1: windows side by side).
4. **Calm by default.** A normal day is grey and small. Colour is for what needs someone (2: management by exception,
   focus; 3: GOV.UK's plain *completed*).
5. **Five marks, and words.** What the checks found is the mark; what people did is a word (3).
6. **The key is the count**: each mark taught beside its number (3; 1: filters that carry counts).
7. **A day's panel in sentences, in a fixed order**: what happened, what it reached, what was done, what to do now, then
   the evidence. Nothing vital in a tooltip (5; 2).
8. **A strip for each file, the worst first, the clean ones folded into a count** (1: the uptime strip; 2: reorder,
   filter, length before colour).
9. **A day with no data is drawn as no data, never as fine** (1; this repository's own missing-data convention,
   [ui-check-visuals.md](ui-check-visuals.md)).
10. **The score with its definition, a verdict from a rule, a stated axis and what moved it** (4).
