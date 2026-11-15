/**
 * Gates (ADR 0014, slice 1): a `gate()` cell in the notebook becomes the document's gate on a source or step; a flow
 * with any gate is plan/4, each watch carrying every check's mode, filled in from its layer; the judges read the gate:
 * under a check that warns, something wrong is unusual at most (a value marked bad excepted), under one that is off,
 * nothing is told; a flow with no gate is judged as it always was.
 */
import { describe, expect, it } from 'vitest';
import { plusDays } from '../src/core/calendar.js';
import { validateDocument, type FlowDocument } from '../src/core/document.js';
import { CHECK_NAMES, checkOf, gateChecksOf, gated, LAYER_DEFAULTS, OVERWHELMING, overwhelmingOf, resolveGate, type GateChecks } from '../src/core/gates.js';
import { HistoryRanges } from '../src/core/history.js';
import { appendPeriods, emptyHistory, measuresOf, type MeasureSettings, type Measures } from '../src/core/measures.js';
import { planKind } from '../src/core/manifest.js';
import { expandNotebooks, stepsOfNotebooks } from '../src/core/notebook.js';
import { judgeOf, LEGACY_JUDGE, newsOf, type Finding } from '../src/core/news.js';
import { translate, validatePlan } from '../src/core/plan.js';
import { exampleDoc } from './helpers/example.js';
import { historyWith, vendorNames } from './helpers/history.js';
import { ts } from './helpers/notebooks.js';

/** An ontology with no types, for a test that sets one of its other fields. */
const NO_TYPES = { objectTypes: [], linkTypes: [], actionTypes: [] };

const SETUP = "import { cell, md, param, sql } from 'smaltnb';\nimport { check, fill, gate, publish, source } from 'smaltfl/notebook';\n";

/** A format-4 flow over one watched source and one watched, published step, from the notebook given. */
const flow = (nb: string, extra: Partial<FlowDocument> = {}): FlowDocument =>
  ({
    smaltfl: 4,
    id: 'gated',
    name: 'Gated',
    parameters: [{ name: 'day', type: 'text', default: '2024-01-02' }],
    sources: [{ id: 'auth', table: 'auth_file' }],
    notebooks: [{ path: 'a.nb.ts', source: nb }],
    publish: { hold: ['checks', 'wrong'], period: 'day', watch: { auth: { history: 'h.json', pattern: 'none' }, by_hour: { history: 'h2.json', pattern: 'none' } } },
    ...extra,
  }) as FlowDocument;

const BODY = `
cell('params');
export const params = param({ day: param.text('') });

cell('auth');
export const auth = source('auth');

cell('auth_valid');
export const auth_valid = check(auth, { rules: [{ name: 'ok', check: 'result IS NOT NULL', onFail: 'drop' }], maxDropped: 0.1 });

cell('by_hour', { lang: 'sql' });
export const by_hour = sql\`SELECT substr(time, 12, 2) AS hour, count(*) AS n FROM \${auth_valid} GROUP BY 1\`;

cell('published');
publish(by_hour, { description: 'By hour' });
`;

describe('a gate cell in the notebook (ADR 0014 §1)', () => {
  it('becomes the document’s gate on the node it names, its layer the node’s own unless written', async () => {
    const nb = `${SETUP}${BODY}
cell('auth_gate');
export const auth_gate = gate(auth, { checks: { shares: 'hold', forest: 'off' } });

cell('by_hour_gate');
export const by_hour_gate = gate(by_hour, { layer: 'silver', checks: { needs: 'off' } });
`;
    const doc = await expandNotebooks(flow(nb), ts);
    expect(validateDocument(doc)).toEqual([]);
    expect(doc.gates).toEqual({ auth: { layer: 'bronze', checks: { shares: 'hold', forest: 'off' } }, by_hour: { layer: 'silver', checks: { needs: 'off' } } });
    // The steps are the same: a gate is no step.
    expect(doc.steps.map((s) => s.id)).toEqual(['auth_valid', 'by_hour']);
    // Display: the outline names the cell as a gate on its node, and the cell is kept under `gate:<node>`.
    const outline = doc.outline!.find((o) => o.path === 'a.nb.ts')!.cells;
    expect(outline.filter((c) => c.kind === 'gate').map((c) => [c.cell, c.gate])).toEqual([['auth_gate', 'auth'], ['by_hour_gate', 'by_hour']]);
    expect(doc.cells!['gate:auth']).toMatchObject({ notebook: 'a.nb.ts', cell: 'auth_gate', lang: 'ts' });
    // The gate's name passes its node through: a cell after it may read either.
    const through = `${SETUP}${BODY}
cell('auth_gate');
export const auth_gate = gate(auth);

cell('late', { lang: 'sql' });
export const late = sql\`SELECT count(*) AS n FROM \${auth_gate}\`;
`;
    const t = await stepsOfNotebooks(flow(through), ts);
    expect(t.issues).toEqual([]);
    expect(t.gates).toEqual({ auth: { layer: 'bronze', checks: {} } });
    expect(t.steps.find((s) => s.id === 'late')).toMatchObject({ kind: 'sql', inputs: ['auth'], sql: 'SELECT count(*) AS n FROM auth' });
  });

  it('refuses a gate on nothing, on a step nothing publishes or watches, a check or a mode outside the vocabulary, two gates on one node', async () => {
    const issues = async (cells: string) => (await stepsOfNotebooks(flow(`${SETUP}${BODY}${cells}`), ts)).issues.map((i) => i.message);
    expect(await issues("cell('g');\nexport const g = gate(nobody);\n")).toEqual(['gate() judges a source or step by its name; nothing defines nobody as one']);
    expect(await issues("cell('g');\nexport const g = gate(auth_valid);\n")).toEqual(['gate(auth_valid, …): auth_valid is a step nothing publishes or watches; a gate judges what the flow judges or lets out']);
    expect(await issues("cell('g');\nexport const g = gate(auth, { checks: { smell: 'hold' } });\n")).toEqual(["gate(auth, …): smell isn't a check (schema, fresh, amount, blanks, values, rules, scope, needs, due, reconcile, shares, shape, hours, pairs, forest, classifier)"]);
    expect(await issues("cell('g');\nexport const g = gate(auth, { checks: { shares: 'loud' } });\n")).toEqual(['gate(auth, …): checks.shares is one of hold, warn, off']);
    expect(await issues("cell('g');\nexport const g = gate(auth, { layer: 'platinum' });\n")).toEqual(['gate(auth, …): layer is one of bronze, silver, gold']);
    expect(await issues("cell('g');\nexport const g = gate(auth, { strict: true });\n")).toEqual(["gate(auth, …): strict isn't a gate's setting (layer, checks, scope, needs, reconcile): refused rather than ignored"]);
    expect(await issues("cell('g');\nexport const g = gate(auth);\ncell('g2');\nexport const g2 = gate(auth);\n")).toEqual(['auth has two gates']);
    expect(await issues("cell('g');\nexport const g = gate(auth, 'bronze');\n")).toEqual(['gate() takes its settings as an object literal: { layer, checks }']);
  });

  it('is refused in a document without notebooks: a gate is written in a notebook', () => {
    const doc = { ...exampleDoc(), gates: { trips: { layer: 'bronze', checks: {} } } } as FlowDocument;
    expect(validateDocument(doc).map((i) => `${i.path}: ${i.message}`)).toEqual(['$.gates: a gate is written in a notebook, as a gate() cell beside the node it judges: a document without notebooks has none']);
  });
});

describe('plan/4: each watch carries its checks', () => {
  const gatedNb = `${SETUP}${BODY}
cell('auth_gate');
export const auth_gate = gate(auth, { checks: { shares: 'hold', forest: 'off' } });
`;

  it('fills every check in from the layer’s defaults, the written ones over them; an ungated watch has its layer’s', async () => {
    const doc = await expandNotebooks(flow(gatedNb), ts);
    const plan = await translate(doc, { day: '2024-01-02' });
    expect(plan.smaltflPlan).toBe(4);
    expect(planKind(plan)).toBe('plan/4');
    expect(() => validatePlan(plan)).not.toThrow();
    const pub = plan.publish as unknown as { watch: [number, { checks: Record<string, string> }][] };
    const checks = Object.fromEntries(pub.watch.map(([node, w]) => [plan.nodes[node]!.origin, w.checks]));
    expect(Object.keys(checks.auth!)).toEqual([...CHECK_NAMES]);
    expect(checks.auth).toEqual({ ...LAYER_DEFAULTS.bronze, shares: 'hold', forest: 'off' });
    // The watched step has no gate of its own: silver's defaults.
    expect(checks.by_hour).toEqual(LAYER_DEFAULTS.silver);
    expect(checks.by_hour!.needs).toBe('hold');
    // The gate is in the flow hash: the same notebook without it hashes otherwise, and is plan/3.
    const plain = await translate(await expandNotebooks(flow(`${SETUP}${BODY}`), ts), { day: '2024-01-02' });
    expect(plain.smaltflPlan).toBe(3);
    expect(plain.flow.hash).not.toBe(plan.flow.hash);
    expect((plain.publish as unknown as { watch: [number, Record<string, unknown>][] }).watch.every(([, w]) => !('checks' in w))).toBe(true);
  });

  it('refuses a plan/4 watch without its checks, or with a check outside the vocabulary, and a plan/3 watch with checks', async () => {
    const doc = await expandNotebooks(flow(gatedNb), ts);
    const plan = await translate(doc, { day: '2024-01-02' });
    const pub = plan.publish as unknown as { watch: [number, Record<string, unknown>][] };
    const without = { ...plan, publish: { ...pub, watch: pub.watch.map(([n, w]) => [n, Object.fromEntries(Object.entries(w).filter(([k]) => k !== 'checks'))]) } } as unknown as typeof plan;
    expect(() => validatePlan(without)).toThrow(/a watch has exactly .*checks/);
    const odd = { ...plan, publish: { ...pub, watch: pub.watch.map(([n, w]) => [n, { ...w, checks: { ...(w.checks as object), shares: 'loud' } }]) } } as unknown as typeof plan;
    expect(() => validatePlan(odd)).toThrow(/checks is every check/);
    const { gates: _gates, ...rest } = plan.publish as unknown as Record<string, unknown>;
    const three = { ...plan, smaltflPlan: 3, publish: rest } as unknown as typeof plan;
    expect(() => validatePlan(three)).toThrow(/a watch has exactly/);
    // A plan/3 publish block carries no gates: with them, it is refused as such.
    expect(() => validatePlan({ ...plan, smaltflPlan: 3 })).toThrow(/publish.gates is plan\/4/);
  });

  it('carries a threshold the ontology or the flow declares, and none it doesn’t, so no plan made before moves (Q-207)', async () => {
    type Watch = [number, Record<string, unknown>][];
    const watchOf = async (extra: Partial<FlowDocument>) => {
      const doc = await expandNotebooks(flow(gatedNb, extra), ts);
      expect(validateDocument(doc)).toEqual([]);
      const plan = await translate(doc, { day: '2024-01-02' });
      expect(() => validatePlan(plan)).not.toThrow();
      return { plan, by: Object.fromEntries((plan.publish as unknown as { watch: Watch }).watch.map(([node, w]) => [plan.nodes[node]!.origin, w])) };
    };
    const none = await watchOf({});
    expect(Object.values(none.by).every((w) => !('overwhelming' in w))).toBe(true);
    const base = flow(gatedNb).publish!;
    const flowWide = await watchOf({ publish: { ...base, overwhelming: 0.4 } });
    expect(flowWide.by.auth!.overwhelming).toBe(0.4);
    expect(flowWide.by.by_hour!.overwhelming).toBe(0.4);
    // The dataset's own wins, by its id whatever its case; the others keep the flow's.
    const own = await watchOf({ publish: { ...base, overwhelming: 0.4 }, ontology: { ...NO_TYPES, overwhelming: { AUTH: 0.1 } } });
    expect(own.by.auth!.overwhelming).toBe(0.1);
    expect(own.by.by_hour!.overwhelming).toBe(0.4);
    expect(judgeOf(await expandNotebooks(flow(gatedNb, { ontology: { ...NO_TYPES, overwhelming: { auth: 0.1 } } }), ts), 'auth').overwhelming).toBe(0.1);
    expect(judgeOf(await expandNotebooks(flow(gatedNb), ts), 'auth').overwhelming).toBe(OVERWHELMING);
    // A threshold moves the plan: it changes what holds a day.
    expect(own.plan.flow.hash).not.toBe(none.plan.flow.hash);
    // A plan's threshold is a share of the day's rows.
    const pub = flowWide.plan.publish as unknown as { watch: Watch };
    const odd = { ...flowWide.plan, publish: { ...pub, watch: pub.watch.map(([n, w]) => [n, { ...w, overwhelming: 2 }]) } } as unknown as typeof flowWide.plan;
    expect(() => validatePlan(odd)).toThrow(/overwhelming is a share of the day's rows/);
  });

  it('refuses a threshold that isn’t a share of the day’s rows, or names no dataset of the flow (Q-207)', async () => {
    const base = flow(gatedNb).publish!;
    const said = async (extra: Partial<FlowDocument>) => validateDocument(await expandNotebooks(flow(gatedNb, extra), ts)).map((i) => i.path);
    expect(await said({ publish: { ...base, overwhelming: 0 } })).toEqual(['$.publish.overwhelming']);
    expect(await said({ publish: { ...base, overwhelming: 1.5 } })).toEqual(['$.publish.overwhelming']);
    expect(await said({ publish: { ...base, overwhelming: '25%' as unknown as number } })).toEqual(['$.publish.overwhelming']);
    expect(await said({ publish: { ...base, overwhelming: 1 } })).toEqual([]);
    expect(await said({ ontology: { ...NO_TYPES, overwhelming: { waf: 0.2 } } })).toEqual(['$.ontology.overwhelming.waf']);
    expect(await said({ ontology: { ...NO_TYPES, overwhelming: { auth: -1 } } })).toEqual(['$.ontology.overwhelming.auth']);
    expect(await said({ ontology: { ...NO_TYPES, overwhelming: { by_hour: 0.3 } } })).toEqual([]);
    expect(await said({ ontology: { ...NO_TYPES, overwhelming: [0.2] as unknown as Record<string, number> } })).toEqual(['$.ontology.overwhelming']);
  });
});

describe('the judges read the gate (Q-114)', () => {
  it('is null for a flow with no gate, and the node’s checks for one with any', async () => {
    expect(judgeOf(exampleDoc(), 'trips').checks).toBeNull();
    const doc = await expandNotebooks(flow(`${SETUP}${BODY}\ncell('g');\nexport const g = gate(by_hour, { checks: { pairs: 'off' } });\n`), ts);
    expect(judgeOf(doc, 'auth').checks).toEqual(LAYER_DEFAULTS.bronze);
    expect(judgeOf(doc, 'by_hour').checks).toEqual({ ...LAYER_DEFAULTS.silver, pairs: 'off' });
    expect(gateChecksOf(doc, 'BY_HOUR')).toEqual(judgeOf(doc, 'by_hour').checks);
    expect(resolveGate({ layer: 'gold', checks: {} })).toEqual(LAYER_DEFAULTS.gold);
  });

  it('maps each finding to its check, and leaves the calm day, a day not judged and the weather alone', () => {
    expect(checkOf('volume')).toBe('amount');
    expect(checkOf('gone')).toBe('shares');
    expect(checkOf('missing')).toBe('blanks');
    expect(checkOf('new')).toBe('values');
    expect(checkOf('combo')).toBe('pairs');
    expect(checkOf('unlike')).toBe('forest');
    expect(checkOf('dropped')).toBe('rules');
    expect(checkOf('integrity')).toBe('schema');
    for (const k of ['calm', 'unlearned', 'weather', 'key', 'unmatched', 'placeholder', 'empty'] as const) expect(checkOf(k)).toBeNull();
  });

  it('caps a learned check’s finding at unusual under warn, drops it under off, keeps a written one’s, and never softens a value marked bad', () => {
    const h = new HistoryRanges(historyWith({ '2023-10-11': { vendorGone: true } }));
    const plain = newsOf(h, '2023-10-11', vendorNames);
    expect(plain.find((f) => f.kind === 'gone')!.severity).toBe('alert');
    expect(plain.find((f) => f.kind === 'volume')!.severity).toBe('alert');
    expect(plain.every((f) => f.check === undefined)).toBe(true);
    const bronze = { ...LEGACY_JUDGE, checks: LAYER_DEFAULTS.bronze };
    // Vendor 1, three in ten of a day's trips, gone: a learned check's alert that moved 30% of the day's rows, past the
    // quarter a node is judged by unless the ontology or the flow says (Q-132, Q-207). Overwhelming, it holds, marked.
    const gatedNews = newsOf(h, '2023-10-11', vendorNames, { judge: bronze });
    const gone = gatedNews.find((f) => f.kind === 'gone')!;
    expect(gone).toMatchObject({ severity: 'alert', check: 'shares', overwhelming: { at: 0.25 } });
    expect(gone.overwhelming!.moved / gone.overwhelming!.of).toBeCloseTo(0.3, 2);
    // Judged by a higher threshold, it is unusual at most (Q-114), and not marked.
    const higher = newsOf(h, '2023-10-11', vendorNames, { judge: { ...bronze, overwhelming: 0.35 } }).find((f) => f.kind === 'gone')!;
    expect(higher).toMatchObject({ severity: 'warn', check: 'shares' });
    expect(higher.overwhelming).toBeUndefined();
    expect(gatedNews.find((f) => f.kind === 'volume')).toMatchObject({ severity: 'alert', check: 'amount' });
    // Off: not told at all; the rest unchanged.
    const off = newsOf(h, '2023-10-11', vendorNames, { judge: { ...bronze, checks: { ...LAYER_DEFAULTS.bronze, shares: 'off', amount: 'off' } } });
    expect(off.some((f) => f.kind === 'gone' || f.kind === 'share' || f.kind === 'volume')).toBe(false);
    // A value the ontology marks bad is always something wrong, whatever the check's mode: vendor 1 marked bad and up
    // to 90% of the day holds under shares: warn, while vendor 2's own fall, judged by a threshold of nine in ten, is
    // unusual at most. At a quarter its fall, 60% of the day's rows, is overwhelming.
    const up = new HistoryRanges(historyWith({ '2023-10-11': { vendorShare: 0.9 } }));
    const bad = newsOf(up, '2023-10-11', vendorNames, { judge: { ...bronze, bad: new Map([['vendorid', new Set(['1'])]]), overwhelming: 0.9 } });
    expect(bad.find((f) => f.key === 'share:VendorID=1')).toMatchObject({ severity: 'alert', bad: true, check: 'shares' });
    expect(bad.find((f) => f.key === 'share:VendorID=1')!.overwhelming).toBeUndefined();
    expect(bad.find((f) => f.key === 'share:VendorID=2')).toMatchObject({ severity: 'warn', check: 'shares' });
    const atQuarter = newsOf(up, '2023-10-11', vendorNames, { judge: { ...bronze, bad: new Map([['vendorid', new Set(['1'])]]) } });
    expect(atQuarter.find((f) => f.key === 'share:VendorID=2')).toMatchObject({ severity: 'alert', check: 'shares', overwhelming: { at: 0.25 } });
    // The rule on one finding, by itself.
    expect(gated({ key: 'x', kind: 'share', severity: 'alert', score: 1, title: '', detail: '', look: 'columns', acts: [] }, LAYER_DEFAULTS.silver)).toMatchObject({ severity: 'warn', check: 'shares' });
    expect(gated({ key: 'x', kind: 'calm', severity: 'ok', score: 0, title: '', detail: '', look: 'history', acts: [] }, LAYER_DEFAULTS.gold)).toMatchObject({ severity: 'ok' });
    expect(gated({ key: 'x', kind: 'share', severity: 'alert', score: 1, title: '', detail: '', look: 'columns', acts: [] }, LAYER_DEFAULTS.gold)).toBeNull();
  });

  it('holds on an overwhelming learned alert: a quarter of the day’s rows moved, never the forest or the classifier (Q-132)', () => {
    const f = (kind: Finding['kind'], rows: number, more: Partial<Finding> = {}): Finding => ({ key: kind, kind, severity: 'alert', score: 1, title: '', detail: '', look: 'columns', acts: [], rows, ...more });
    const day = { rows: 1000, overwhelming: 0.25 };
    // A share that moved 250 of 1,000 rows: at the threshold, it holds; 249 doesn't.
    expect(gated(f('share', 250), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'alert', check: 'shares', overwhelming: { moved: 250, of: 1000, at: 0.25 } });
    expect(gated(f('share', 249), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'warn', check: 'shares' });
    expect(gated(f('share', 249), LAYER_DEFAULTS.bronze, day)!.overwhelming).toBeUndefined();
    // A value gone and the hours count their own rows; a pair of values what it moved beyond what its columns predict.
    expect(gated(f('gone', 400), LAYER_DEFAULTS.silver, day)).toMatchObject({ severity: 'alert', check: 'shares' });
    expect(gated(f('hours', 300), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'alert', check: 'hours' });
    expect(gated(f('combo', 900, { moved: 100 }), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'warn', check: 'pairs' });
    expect(gated(f('combo', 900, { moved: 300 }), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'alert', check: 'pairs', overwhelming: { moved: 300 } });
    // The forest and the classifier only ever warn (Q-107), whatever they cover.
    expect(gated(f('unlike', 1000), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'warn', check: 'forest' });
    expect(gated(f('apart', 1000), LAYER_DEFAULTS.bronze, day)).toMatchObject({ severity: 'warn', check: 'classifier' });
    // Under hold the alert is the check's own, not overwhelming; under off nothing is told; at gold the learned checks
    // are off.
    expect(gated(f('share', 900), { ...LAYER_DEFAULTS.bronze, shares: 'hold' }, day)).toMatchObject({ severity: 'alert' });
    expect(gated(f('share', 900), { ...LAYER_DEFAULTS.bronze, shares: 'hold' }, day)!.overwhelming).toBeUndefined();
    expect(gated(f('share', 900), LAYER_DEFAULTS.gold, day)).toBeNull();
    // A day of no rows moves no share of them.
    expect(gated(f('share', 0), LAYER_DEFAULTS.bronze, { rows: 0, overwhelming: 0.25 })).toMatchObject({ severity: 'warn' });
  });

  it('reads the threshold from the ontology, else the flow, else a quarter (Q-207)', () => {
    expect(overwhelmingOf({}, 'waf')).toEqual({ at: OVERWHELMING, declared: null, from: null });
    expect(OVERWHELMING).toBe(0.25);
    expect(overwhelmingOf({ publish: { hold: ['wrong'], overwhelming: 0.4 } }, 'waf')).toEqual({ at: 0.4, declared: 0.4, from: 'flow' });
    expect(overwhelmingOf({ publish: { hold: ['wrong'], overwhelming: 0.4 }, ontology: { ...NO_TYPES, overwhelming: { WAF: 0.1 } } }, 'waf')).toEqual({ at: 0.1, declared: 0.1, from: 'ontology' });
    expect(overwhelmingOf({ publish: { hold: ['wrong'], overwhelming: 0.4 }, ontology: { ...NO_TYPES, overwhelming: { tls: 0.1 } } }, 'waf')).toEqual({ at: 0.4, declared: 0.4, from: 'flow' });
  });
});

describe('a value back on a few rows, in a gated flow (ADR 0020 slice 4)', () => {
  /** A small table's day, one row a failure: each business unit's rows. */
  const day = (d: string, units: Record<string, number>): Measures => {
    const scan: unknown[][] = [];
    for (const [u, n] of Object.entries(units)) for (let i = 0; i < n; i++) scan.push([u]);
    const s: MeasureSettings = { source: 'failing', slot: d, every: 'day', checks: null, counting: null, counted: ['unit'], followed: [], paired: [], time: null, zone: null, sample: 2000 };
    return measuresOf(s, { file: null, snapshot: 'x', schema: [['unit', 'text']], facts: [scan.length, scan.length, Object.keys(units).length, null, null, null], sample: [], scan, checks: null });
  };
  /** Sixty days of three business units, the third emptied after thirty (a reorg moved its teams), then the day it's
   * back on `back` rows. */
  const today = plusDays('2024-01-01', 60);
  const told = (back: number, checks: GateChecks | null) => {
    const ms: Measures[] = [];
    for (let i = 0; i < 60; i++) ms.push(day(plusDays('2024-01-01', i), { a: 150 + (i % 7) * 3, b: 140 - (i % 5) * 2, ...(i < 30 ? { c: 30 + (i % 3) } : {}) }));
    ms.push(day(today, { a: 150, b: 140, c: back }));
    const start = emptyHistory({ flow: 'f', source: 'failing', settings: { checks: null, counted: ['unit'], followed: [], paired: [], time: null, zone: null, sample: 2000 }, columns: ms[0]!.columns, types: ms[0]!.types, kinds: ms[0]!.kinds, warmup: 3 });
    const h = new HistoryRanges(appendPeriods(start, ms), { pattern: 'none' });
    const judge = { ...LEGACY_JUDGE, legacy: false, scale: 'volume' as const, pattern: 'none' as const, checks };
    return newsOf(h, today, vendorNames, { judge }).find((f) => f.values?.[0] === '"c"');
  };

  it('tells it as worth knowing under the rows a new value needs to be unusual, unusual from them, and as before without gates', () => {
    expect(told(3, LAYER_DEFAULTS.silver)).toMatchObject({ kind: 'share', severity: 'note', check: 'shares', rows: 3 });
    expect(told(20, LAYER_DEFAULTS.silver)).toMatchObject({ kind: 'share', severity: 'warn', check: 'shares' });
    expect(told(3, null)).toMatchObject({ kind: 'share', severity: 'warn' });
  });
});
