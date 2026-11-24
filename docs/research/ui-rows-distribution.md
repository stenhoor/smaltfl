# A day's rows among the days before: research notes (2026-11-24)

Research behind the rows picture on the Data model map (ADR 0028, phase 4: "After the owner's first look"). The
maintainer, on the first version (a line of dots, the usual range shaded, the day the large dot):

> I'd rather have a distribution with height. We can keep the straight line with dots, but I think it's really hard to
> see if there's a bunch of things all stacked up on each other. So go out and do some UI best practice research on
> this, and then revisit the distribution again.

Pages were read as search extracts unless a line says otherwise. Lines marked *(inference)* are the researcher's
synthesis, not a source's claim.

## 1. What a small sample is best drawn as

- **Dot plots and strip charts suit small samples; histograms suit large ones.**
  - Weissgerber and colleagues' guidance for small samples: show every point, and use a dot plot where a box plot or a
    bar would hide the distribution. A dot plot shows a bimodal sample that a box plot hides.
    [Weissgerber](https://openresearch-repository.anu.edu.au/bitstream/1885/155722/1/Data_Viz_Weissgerber%20v1.pdf)
  - Minitab says dot plots work best under about 50 observations. Wikipedia says that from about 20 to 30 points on, a
    stem plot, box plot or histogram may serve better, because dots crowd.
    [Minitab](https://support.minitab.com/en-us/minitab/help-and-how-to/graphs/dotplot/before-you-start/data-considerations/),
    [Wikipedia](https://en.wikipedia.com/wiki/Dot_plot_(statistics))
  - Statology: a dot plot shows exactly how many times each value occurs; a histogram summarises values in bins, for
    larger data. [Statology](https://www.statology.org/dot-plot-vs-histogram/)
- **Points on one line hide one another.**
  - Wilke's *Fundamentals of Data Visualization* calls a row of points a strip chart. He says it is fine "as long as we
    make sure that we don't plot too many points on top of each other". His chapter on overlapping points gives
    transparency and jitter as the fixes.
    [Wilke, ch. 9](https://clauswilke.com/dataviz/boxplots-violins.html),
    [ch. 18](https://www.oreilly.com/library/view/fundamentals-of-data/9781492031079/ch18.html)
  - A beeswarm (Observable Plot's dodge transform) moves each point so none overlaps. Stacking gives each point a place
    in a pile, so a value many points share stands tall.
    [Observable Plot](https://observablehq.com/plot/transforms/dodge),
    [Flourish](https://flourish.studio/blog/what-is-a-beeswarm-plot/)
- **Counting beats estimating.**
  - Kay, Kola, Hullman and Munson (CHI 2016) drew a distribution as a few countable dots, the quantile dotplot, for small
    screens. It reduced the variance of people's estimates about 1.15 times against a density plot.
    [When(ish) is my bus?](https://idl.uw.edu/papers/when-ish-is-my-bus)
  - Fernandes and colleagues (CHI 2018) found decisions made with such dots reached 97% of the best payoff, 5 points
    above the control. [Uncertainty displays](https://idl.uw.edu/papers/uncertainty-bus)
  - Frequency framing, "1 out of 10" rather than "10%", is why it works.
    [lecture](https://faculty.cs.niu.edu/~dakoop/cs628-2021fa/lectures/lecture15.pdf)

## 2. Fitting the pile to the space

- **Dot size against stack height.** Wilkinson's dot plot (*The American Statistician*, 1999) puts each stack over the
  values it holds. ggplot2 bins at 1/30 of the range by default.
  [ggplot2](https://ggplot2.tidyverse.org/reference/geom_dotplot.html)
- **When a pile won't fit.** ggdist chooses the bin width so the tallest stack fits the space it is given. With a
  minimum dot size set, `overflow = "compress"` lets the dots overlap instead of shrinking out of sight; its maintainer
  notes that this works well mainly when dots would be very small.
  [ggdist](https://mjskay.github.io/ggdist/reference/geom_dots.html),
  [issue 207](https://www.github.com/mjskay/ggdist/issues/207)

## 3. Showing where one value stands

- **A normal band, the latest value marked.**
  - Tufte's sparklines show a normal range as a grey band, with readings outside it standing out. They draw the trend
    in grey and the last point in red.
    [Tufte](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/),
    [GraphPad](https://www.graphpad.com/support/faq/can-prism-create-sparklines/)
  - Few's bullet graph puts the qualitative ranges behind the featured measure, in shades of one hue. Where the scale
    doesn't start at zero, it draws the measure as a dot or an X, not a bar.
    [Few's spec](https://www.telerik.com/docs/default-source/blogs-docs/bullet_graph_design_spec-pdf),
    [Wikipedia](https://en.wikipedia.org/wiki/Bullet_graph)
- **"You are here" on a distribution.** Dashboards mark the value of interest on a histogram as one marker on its axis,
  with a bucket's details on hover (DebugBear, ThingsBoard).
  [DebugBear](https://www.debugbear.com/docs/rum/histograms),
  [ThingsBoard](https://thingsboard.io/iot-hub/widgets/distribution-histogram/)
- **Don't hide what falls off the scale.** Tools let a value beyond an axis be clipped, hidden or pinned at the edge. A
  scale padded past the data implies values that aren't there.
  [MicroStrategy](https://www2.microstrategy.com/producthelp/current/ReportDesigner/WebHelp/Lang_1033/Content/Displaying_off-scale_values_in_a_graph.htm),
  [UX Collective](https://uxdesign.cc/the-most-common-mistake-designers-make-when-adjusting-their-bar-charts-6f7405d69703)
- **The data visualization guide this repository uses** (the `dataviz` skill):
  - for one value that matters against context, emphasis (the one in its colour, the rest grey);
  - columns at most 24 px wide, rounded at the data end and square at the baseline, a 2 px gap between neighbours;
  - markers at least 8 px with a 2 px ring in the surface colour;
  - labels only on the value that matters and the extremes;
  - hover on each mark, and never colour alone;
  - a one-bar chart is a number, not a chart.

## 4. What the files' days look like

The 28 days before Wed Mar 27 on the tour, read from the record:

- **Most files are whole counts a few apart, with many days alike.** WAF had 497 rows on 16 of its 28 days. People
  has four values. TLS has six.
- **Some grow a row or two a day,** with about nine values each: the CMDB, Encryption, Backups, MFA.
- **Findings spreads wide,** 7,926 to 8,205 with no two days alike.
- **Four files are the same every day:** the org units, the platform list, the catalogue and the requirements.
- **Access reviews is 0 on the day** against a pile at about 1,435. EDR had one empty day among its 28.

A dot plot of 8 px dots can't stack 16, let alone 28, inside a card's 36 px *(inference)*.

## 5. The design, first pass: a histogram

- A column for each count of rows the days before had (round bands where they spread wide), as tall as the days that
  had it; the usual range shaded behind; the day the dot on the line.
- The owner, on seeing it: make it look better, "it doesn't have to be a histogram, just some clean modern way to show
  the data, its distribution and where the current data sits on that, so it's clear if today is normal or not". Its
  columns were sparse where whole counts lie a few rows apart (WAF's five columns), and the shaded band was a box
  behind them.

## 6. The design, second pass: a smooth shape, the day a line through it

Three options were drawn on the six files' real days in light and dark (a smooth shape with its usual part darker, the
shape over a range bar like a lab result's, a dot a day stacked); the dots made piles where 16 days are alike, and the
range bar said again what the darker part says. As built:

- **The days as one smooth shape.** Each day is a soft bump (a kernel density, its width from the days' own spread by
  Silverman's rule, at least three quarters of a row for whole counts and a thirtieth of the line), so many days alike
  make the shape tall where they stand.
- **The usual part darker.** The middle eight in ten of the days is the shape's darker part, named under it ("usual
  496–497").
- **The day a line through it,** in its state's colour (neutral, amber, red), with a ringed dot on the line and its
  weekday above. Inside the darker part is plainly usual; far from the shape is plainly not.
- **Words first.** "✓ Normal" where the checks let the day through, then where it sits, counted: "like most of the last
  28 days", "higher than 27 of the last 28 days", "lower than all of the last 28 days". A paused or unusual day has its
  state's chip on the card already, so its words are the count alone.
- **A day too lone to show** in the shape (EDR's one empty day among full ones) is a small dot on the line.
- **The ends** of the line are labelled where they don't touch the usual range's words. A file the same on every day
  still says so in words.
