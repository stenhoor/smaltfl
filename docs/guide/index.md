# Quick start

## Try it

**[Open the demo](/app/){target="_self"}**: Larkspur, a fictional financial-services group's March of security
controls. About 2,400 applications, the organisation that owns them and the 46 shared platforms they run on: twenty
files a day, through bronze, silver and a gold data product, run entirely in your browser. The first day takes a few
seconds while the engine starts.

Two more demos: **[the control estate](/estate/){target="_self"}**, 600 applications and twelve controls, the month the
gates were built against; and **[the sign-in log](/signins/){target="_self"}**, with the two models' planted days.

Nothing is sent anywhere: the data files, the engine (smaltdb, in a Web Worker) and the record of what was decided
all live in the page and your browser's storage.

Then read [A walk through the demo](./demo): ten minutes, day by day.

## What you are looking at

A **flow** reads daily files (the **sources**), runs them through **steps** (checks, joins, summaries) and publishes
**datasets**. Each step is a cell of a [smaltnb](https://stenhoor.github.io/smaltnb/) notebook. Each day, every
watched dataset is compared with the days before it; a day that is off is **held**: what it would publish waits, and
readers keep the last good day, until someone with the right to decides.

The app opens on the **month**: a calendar of the days, each marked with what became of it. A day opens to its own
screen: what happened to it, and the **canvas** (the flow: a card a source or a step, a box a notebook). Tap something
on the canvas for its **sheet** (News, Data, Columns, Checks, Rules, Models, History, Integrity; a file a gate judges
opens to Quality and Notebook). On Larkspur, **Results** opens with the data product as its consumers read it.

## Run it locally

```sh
git clone https://github.com/stenhoor/smaltfl && cd smaltfl
npm ci && npm run deps          # dependencies, then the smalt builds pinned in packed.json
npm run check                   # typecheck and tests
npm run build:app -- --flow examples/larkspur/flow.json --out dist/app-larkspur
npx serve dist/app-larkspur     # or any static file server
```

`npm run build:app` generates the example's data (months of history, a month of daily loads), measures each watched
dataset's history on the runtime and writes a static page. Larkspur's data take about five minutes to make on four
cores the first time; they are kept by a hash of what makes them, so a build after a change to the app alone takes
seconds. Other examples: `--flow examples/control-estate/flow.json`, `--flow examples/security-signins/flow.json`,
`--flow examples/controls/flow.json`, and the taxi example (the default, on the `data` branch's real trips:
`git fetch origin data --depth 1`).
