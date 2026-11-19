# Quick start

## Try it

**[Open the demo](/app/){target="_self"}**: a tour of what a flow does, on Larkspur, a fictional financial-services
group's March of security controls. About 2,400 applications, the organisation that owns them and the 46 shared
platforms they run on: twenty files a day, through bronze, silver and a gold data product, run entirely in your
browser. The month lists seven scenes: a normal day, a warning, a written check's hold, an anomaly that was real, one
that was an issue, fills each way, and the business changing what the ontology has. The first day takes a few seconds while the engine starts.

One of its flows has a page of its own, **[Evidence feeds](/feeds/){target="_self"}**: a paused day decided there or
on the tour is carried to the other.

Three more demos: **[Larkspur's planted month](/larkspur/){target="_self"}**, trouble planted at every layer and the
posture over the whole month; **[the control estate](/estate/){target="_self"}**, 600 applications and twelve
controls, the month the gates were built against; and **[the sign-in log](/signins/){target="_self"}**, with the two
models' planted days.

Nothing is sent anywhere: the data files, the engine (smaltdb, in a Web Worker) and the record of what was decided
all live in the page and your browser's storage.

Then read [the tour](./demo): the seven scenes, ten minutes.

## What you are looking at

A **flow** reads daily files (the **sources**), runs them through **steps** (checks, joins, summaries) and publishes
**datasets**. Each step is a cell of a [smaltnb](https://stenhoor.github.io/smaltnb/) notebook. Each day, every
watched dataset is compared with the days before it; a day that is off is **held**: what it would publish waits, and
readers keep the last good day, until someone with the right to decides.

The app opens on the **month**: what waits for a decision, the month in a sentence, a calendar of the days, each marked
with what became of it, and each file as a row of the month's days. A day opens to its own
screen: what happened to it, and the **canvas** (the flow: a card a source or a step, a box a notebook). Tap something
on the canvas for its **sheet** (News, Data, Columns, Checks, Rules, Models, History, Integrity; a file a gate judges
opens to Quality and Notebook). On Larkspur, **Results** opens with the data product as its consumers read it.

## Run it locally

```sh
git clone https://github.com/stenhoor/smaltfl && cd smaltfl
npm ci && npm run deps          # dependencies, then the smalt builds pinned in packed.json
npm run check                   # typecheck and tests
npm run build:app -- --variant tour --out dist/app-tour
npx serve dist/app-tour         # or any static file server
```

`npm run build:app` generates the example's data (months of history, a month of daily loads), measures each watched
dataset's history on the runtime and writes a static page. Larkspur's data take about five minutes to make on four
cores the first time; they are kept by a hash of what makes them, so a build after a change to the app alone takes
seconds. `--variant tour` builds the tour's two months, a variant of Larkspur's data list. Other examples: `--flow
examples/control-estate/flow.json`, `--flow examples/security-signins/flow.json`, and `--flow
examples/controls/flow.json`. Without `--flow` or `--variant` the build makes Larkspur's planted month, in `dist/app`.
(The taxi example, on real trips, was retired on 2026-11-15.)
