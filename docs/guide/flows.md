# Writing a flow

A flow is a folder: a `flow.json` that says what the flow reads, who may do what and what it watches, and the
[smaltnb](https://stenhoor.github.io/smaltnb/) notebooks (`*.nb.ts`) whose cells are its steps
([ADR 0011](../adr/0011-notebooks-as-the-step-surface.md)). The examples are in
[`examples/`](../../examples/): `larkspur/` (the demo), `control-estate/`, `security-signins/`, `security-lockouts/`,
and `controls/`.

## flow.json

```json
{
  "smaltfl": 4,
  "id": "signins",
  "name": "Sign-ins",
  "parameters": [{ "name": "day", "type": "text", "default": null }],
  "sources": [{ "id": "auth", "table": "auth_file", "description": "The day's authentication events, one file a day" }],
  "notebooks": ["checks.nb.ts", "counts.nb.ts"],
  "calendar": { "base": "us" },
  "ontology": { "import": ["../ontologies/auth.json"] },
  "policies": { "principals": [{ "id": "owner", "name": "Owner", "owner": true }], "rules": [] },
  "publish": { "hold": ["checks", "wrong"], "period": "day", "watch": { "auth": { "history": "history.json", "time": "event_time" } } }
}
```

- **sources**: the files the flow reads, bound to real files by id in `<flow>.data.json`.
- **ontology**: what columns mean, the rules rows are held to and the fixes a held day may be offered; `import` brings
  in a file's shared ontology. A gate's written rules are kept here too: a dataset's `rows` entry gives the objects it
  covers and its key (a gold table's included), and `needs` the dependencies between columns, each written once with
  the datasets it applies to. A rule written in the gate cell wins.
- **policies**: people, what each may open (rows and columns), and who may decide a held day.
- **publish**: what holds a day (`checks`: a check that holds; `wrong`: the day's story says it is off), and the
  datasets **watched**, each judged against its own history.

## A notebook

```ts
import { cell, md, param, sql } from 'smaltnb';
import { check, fill, gate, publish, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text('') });

cell('auth');
export const auth = source('auth');

cell('about', { lang: 'md' });
md`Sign-ins with a known result, on the day`;

cell('auth_valid');
export const auth_valid = check(auth, {
  rules: [
    { name: 'known_result', check: "result IN ('success', 'fail', 'locked')", onFail: 'drop' },
    { name: 'has_user', check: 'user IS NOT NULL', onFail: 'warn' },
  ],
  maxDropped: 0.05,
  ontology: { method_one_of: 'on', latency_ms_range: 'on' },
});

cell('by_method', { lang: 'sql' });
export const by_method = sql`SELECT method, count(*) AS n FROM ${auth_valid} GROUP BY 1`;

cell('by_method_gate');
export const by_method_gate = gate(by_method, { layer: 'gold', reconcile: { key: 'method' } });

cell('published');
publish(by_method, { description: 'Sign-ins by method' });
```

A notebook is TypeScript that `tsc` checks as written. The cells smaltfl reads:

| Cell | What it is |
|---|---|
| `source(id)` | a source's rows for the day |
| `check(input, { rules, maxDropped, ontology })` | rules a row must meet: `drop`, `warn` or `fail` (hold); `ontology` switches the ontology's rules for the file |
| `fill(input, { time, shift })` | where a held day's missing rows come in from another day, each marked `filled_from` |
| `` sql`…` `` | a SQL step; `${name}` reads another cell |
| `gate(node, { layer, checks, scope, needs, reconcile })` | the node's checks: bronze, silver or gold defaults, each check `hold`, `warn` or `off` |
| `publish(node, { description })` | a dataset readers get |

Another notebook's exports are imported like any module (`import { posture } from './posture.nb.js'`).

## A flow that reads other flows

A flow can read flows that are already made ([ADR 0025](../adr/0025-flows-in-flows.md)). It lists them in its
`flow.json`, each by the path of that flow's own `flow.json`:

```json
{
  "smaltfl": 4,
  "id": "larkspur",
  "name": "Larkspur estate",
  "flows": ["hr/flow.json", "inventory/flow.json", "feeds/flow.json", "applications/flow.json"],
  "sources": [{ "id": "control_catalog", "table": "control_catalog_file" }],
  "notebooks": ["bronze.nb.ts", "evidence.nb.ts", "posture.nb.ts", "product.nb.ts"]
}
```

and its notebooks import what those flows give, as they import each other's cells:

```ts
import { org_chain } from './hr/org.nb.js';
import { tls_checked } from './feeds/bronze.nb.js';
```

- **It reads what a flow gives, and its files.** A step may read a dataset the other flow **publishes**, or one of its
  sources as it arrived. A step the other flow keeps to itself is refused, and the message says to publish it there.
- **It lists every flow it reads from.** Reading a flow only through another flow that reads it isn't enough.
- **A name is one thing.** A source's or a step's id is unique across a flow and the flows it reads: `org_chain` is
  `org_chain` wherever it is read. Two flows that use a name are refused, both named.
- **One calendar, one day, one way of pausing.** The flows keep the same `calendar`, the same parameters and the same
  `publish` settings (what holds, `together`, `reach`). Each brings its own `watch` entries, gates and contracts.
  Policies are the reading flow's.
- **No circles.** A flow that reads itself through others is refused.

Reading the flow (`readFlow` in `scripts/flow.ts`, `composeFlow` in the package) brings the flows it reads in: the
document it gives has all of their sources and steps, and lists each flow with what is its own and its own **flow
hash**, the hash that reading that flow's folder by itself gives. The plan made from it is the flat plan any flow has.
So a flow read by two flows is one definition, its steps have the same keys in both, and in one database they are built
once. A run's manifest names the flows it read by those hashes (`flow.reads`), and verifying the run checks that its
document holds each one unchanged.

Larkspur is five flows this way: `examples/larkspur/` reads `hr/`, `inventory/`, `feeds/` and `applications/`, and
`applications/` reads the other three.

### A change to a flow, and a pin

A flow reads the flows it lists as they are when it is read: nothing is copied, so a change to one reaches every flow
built on it the next time it is read. A change is the flow's whose file or step it is about, and that flow's hash
moves with it; so does the hash of every flow that reads it. A run names each flow it read by its hash, so the record
shows which run first ran the flow as changed.

Where a flow must not move under its reader, the reader names its hash:

```json
"flows": [{ "path": "hr/flow.json", "hash": "3fa9…" }, "inventory/flow.json"]
```

Reading then refuses any other `hr/flow.json`, and says both hashes, until someone moves the pin.

### A flow used more than once: inputs and settings

A flow made to be used on more than one dataset names no dataset of its reader. It declares what is open
([ADR 0025](../adr/0025-flows-in-flows) §11):

```json
{
  "smaltfl": 4, "id": "tally", "name": "Tally",
  "inputs": [{ "id": "rows", "description": "Anything with a status and an amount", "columns": ["status", "amount"] }],
  "settings": [{ "name": "floor", "type": "real", "default": 10 }],
  "sources": [], "notebooks": ["tally.nb.ts"]
}
```

Its notebook binds each input by its id and reads a setting as it reads a parameter:

```ts
export const params = param({ day: param.text(''), floor: param.number(10) });
export const rows = input('rows');
export const by_status = sql`SELECT status, sum(amount) AS total FROM ${rows} GROUP BY status`;
export const big = sql`SELECT status, total FROM ${by_status} WHERE total >= ${params.floor}`;
```

A flow uses it under a name, mapping one of its own datasets onto each input and giving the settings it wants another
value for:

```json
"flows": [
  "orders/flow.json",
  { "path": "kit/tally/flow.json", "as": "paid", "inputs": { "rows": "orders_checked" }, "settings": { "floor": 25 } },
  { "path": "kit/tally/flow.json", "as": "mine", "name": "My tally", "inputs": { "rows": "recent" } }
]
```

- **Each use is a flow of its own.** The used flow's notebooks are read under the use's name: its steps are
  `paid_by_status` and `paid_big`, and `mine_by_status` and `mine_big`. Each use has its own card, its own days and
  its own hash in every run; a change to the flow moves the hash of every use.
- **An input reads what it declares.** `paid_rows` reads `status` and `amount` of `orders_checked` and nothing else.
  A dataset that lacks one stops the run at that step, by name.
- **What may be mapped** is what the flow that uses it may read: its own files and steps, published or not, and what
  the flows it lists publish, or their files. A dataset of a flow it doesn't list is mapped once it lists that flow.
- **A setting is a value in the statement.** `paid_big` reads `total >= 25.0`; `mine_big` keeps the flow's own 10.
- **To read what a use gives**, import it by the name it has here:
  `import { big as paid_big } from './kit/tally/tally.nb.js'`.
- **A use changes its inputs and its settings, and nothing else.** The flow's steps and checks stay as written. What
  its ontology says of its own datasets (a column's meaning, what its rows are called) it says of each use's.
- A dataset built from a feed a held day can fill is mapped onto an input that takes `filled_from`, so what the use
  gives can say which rows came from another day.
- For now a flow used under a name has no file of its own, reads no flow of its own and watches nothing.

### A catalogue of flows to add

A flow's folder may hold a `catalogue/` folder, each folder in it a flow made already: a `flow.json` and its
notebooks, reading what the flow's own flows give.

```
examples/larkspur/
  flow.json
  catalogue/
    ownership/flow.json, ownership.nb.ts
    certificates/flow.json, certificates.nb.ts
```

The app's build ships each one as it reads, and the app offers them under **Add a flow ›**
([The app](./app#building-in-the-app)). A catalogue flow reads flows the flow already reads, has no file of its own
and watches nothing: it is built in the page from the day's run, so the build makes no data for it.

A catalogue's flow with open inputs is offered as **Use it ›**: the app asks which datasets to map and what to set,
and adds it as a use. Larkspur's *Control by unit* is one.

A catalogue's flow keeps the rules of the flows it reads. One built on a feed a held day can fill carries
`filled_from` in everything it gives, as every dataset built from that feed does, or its run stops and names the
dataset; Larkspur's *Certificates* does. Run a new one on a day of the flow before shipping it:
`test/catalogue.test.ts` runs Larkspur's two on days of the estate.

### The estate's ontology

Flows that share their types and columns keep them in one document, the estate's ontology, and each imports it:

```json
{ "smaltflOntology": 2, "name": "Larkspur estate", "objectTypes": [], "linkTypes": [], "rows": [], "needs": [], "properties": [] }
```

```json
"ontology": { "import": ["../ontology.json"] }
```

- **A flow takes what is about its datasets:** the types whose list it has or reads, the links between them, what its
  datasets' rows are, the dependencies and the columns' meanings that name them. A flow with no gate takes none of the
  written checks (a rows entry, a dependency, a band), since nothing would judge them.
- **It travels under its own hash.** The flow's document keeps the estate's name, the path and its hash
  (`ontology.estate`), which is part of the flow hash: change the estate's ontology and every flow that imports it
  moves, and no other.
- **A flow may handle a column of its own datasets its own way,** by saying so with its reason:

  ```json
  { "column": "owner_team_id", "title": "Owning team", "description": "The team, by its id as this flow conforms it",
    "datasets": ["apps", "app_owners"],
    "override": { "reason": "The register writes a team’s id in any case; this flow conforms it" } }
  ```

  The estate's meaning steps aside for those datasets and stands everywhere else. The Ontology page lists the
  handling and notes it on each card of the column.
- **Without the mark it is refused:** a flow that describes a column the estate describes is told to mark it as an
  override, with its reason, or to leave it to the estate. So is an override of a dataset that isn't the flow's own,
  and one of a column no estate describes.

Larkspur's is `examples/larkspur/ontology.json`; Applications handles `owner_team_id` its own way.

## From the notebook to a run

People say what, the machine decides how ([ADR 0004](../adr/0004-the-flow-plan.md)): the notebooks are translated into
a **flow plan**, hashed by content; only `emit.ts` turns it into the engine's SQL. A run records a signed manifest of
what it read and made. Names and display fields stay out of the hashes, so renaming a column's title changes no run.

## Building the app on your flow

```sh
npm run build:app -- --flow examples/control-estate/flow.json --out dist/app-estate
```

The build reads the flow's data list (`data.json`: where each source's files are, or the generator that makes them),
measures each watched dataset's history on the runtime, keeps a sample for the classifier, and writes a static page.

A flow another flow reads can be a page of its own: give its folder a data list, and a story if its month is recorded
(`examples/larkspur/feeds/data.json` and `tour.json` are Evidence feeds' on the tour's files). Served from the same
site as its reader's page, the two share the browser's records, and a paused day decided on one is carried to the
other. `--page` tells each where the other is, since that is the site's to say:

```sh
npm run build:app -- --variant tour --out site/app --page feeds=../feeds/
npm run build:app -- --flow examples/larkspur/feeds/flow.json --out site/feeds --page "larkspur=../app/=Larkspur estate"
```
