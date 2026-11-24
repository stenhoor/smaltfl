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

## 5. The design

- **A histogram of the days before.**
  - Whole counts within a few dozen of each other get a column each. Otherwise the values go into round bands (a
    width of 1, 2 or 5 times a power of ten), about twenty across the line.
  - A column's height is the days that had it, against the tallest. A column of one day is still 2 px tall.
  - Columns are grey, at most 24 px wide, with a 2 px gap between neighbours.
  - Hovering a column says "497 rows on 16 of the 28 days before".
- **The usual range** (the middle eight in ten of those days) is shaded behind the columns. It is named as a number in
  the line of words above, with a swatch of the same shade.
- **The day itself** is a 12 px dot on the line, ringed in the surface colour: neutral when the day is fine, red when
  paused, amber when unusual. Its weekday is written under it.
  - The day isn't one of the 28, so it is a marker, not a column.
  - Its count is the bold number in the line above. Its standing is said as a count in the picture's accessible name,
    for example "more than on any of the 28 days before".
- **The line runs from the least count to the most, the day included,** and both ends are labelled. Access reviews' 0
  stands far from the pile at 1,438, and EDR's empty day stands far from the rest. The labels say how wide the line is,
  so the CMDB's nine-row spread doesn't read as a big swing *(inference)*.
- **A file the same on every day gets words,** not a one-bar chart: "14 rows Wed 27 · the same on all 28 days before".
