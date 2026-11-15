# smaltfl

<a href="https://smaltworks.dev/stability"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/public/work-in-progress-on-dark.svg"><img alt="Work in progress. Come build with us." src="docs/public/work-in-progress.svg" height="56"></picture></a>

**Small. Alternative. Flow.** Data pipelines for smaltdb, built visually and run in the browser.

[Documentation](https://stenhoor.github.io/smaltfl/) · [smaltworks.dev](https://smaltworks.dev)

smaltfl reads daily files, runs them through steps written as [smaltnb](https://github.com/stenhoor/smaltnb) notebooks,
and publishes datasets, with an ontology, enforced access policies and content hashes attached to what it produces.
Each day is judged against the days before it: a day that is off is **paused, not published**, told as one cause with
what it reaches, until someone with the right to decides (publish as is, keep it back, fill it from another day, accept
a new level). Everything runs in the browser, on [smaltdb](https://github.com/stenhoor/smaltdb).

> **Status: early development.** [Try the live demo →](https://stenhoor.github.io/smaltfl/app/) (Larkspur: a fictional
> financial-services group's March of security controls, about 2,400 applications through bronze, silver and a gold
> data product) ·
> [Read the docs →](https://stenhoor.github.io/smaltfl/) · [A walk through the demo](https://stenhoor.github.io/smaltfl/guide/demo)
> - **Where the work stands:** [docs/HANDOFF.md](docs/HANDOFF.md) (what is built, how to check it, what is left)
> - Decisions: [docs/adr/](docs/adr/README.md) (ADR 0001 to 0020)
> - The architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the scenario it is measured against: [docs/SCENARIO.md](docs/SCENARIO.md)
> - The owner's answers and the questions still open: [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md)
> - Brand: [docs/brand/DECISIONS.md](docs/brand/DECISIONS.md) (the mark is the Twin, in the user-tool layer's cerulean: ADR 0016)

## Development

```sh
npm ci && npm run deps   # dependencies, then the smalt builds pinned in packed.json
npm run deps:latest      # move the pins to the latest of stenhoor's repositories (ADR 0017)
npm run check            # typecheck and tests
npm run bench            # the scenario benchmarks (bench/results/node.json)
npm run build:app        # the app on Larkspur, the demo, in dist/app (its data generated from a fixed seed)
npm run build:app -- --flow examples/control-estate/flow.json --out dist/app-estate     # another example
npm run docs:dev         # the site (VitePress), with live reload
```

The tests are the worked example: [test/runtime.test.ts](test/runtime.test.ts) runs the reference flow
([test/fixtures/taxi.ts](test/fixtures/taxi.ts)) on a seeded stand-in for the scenario's taxi data and checks it
against the same flow computed in plain JavaScript. [CLAUDE.md](CLAUDE.md) has the layout and the working rules.

**Data.** Every example's data is generated from a fixed seed by the build (`scripts/data/`): Larkspur, the control
estate and the sign-in log need no outside host. The taxi example, on real trips published as a `data` branch, was
retired on 2026-11-15 ([ADR 0022](docs/adr/0022-the-answers-of-2026-11-14.md), its addendum).

MIT licence ([LICENSE](LICENSE)).
