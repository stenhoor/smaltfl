/**
 * Flows in flows on the screen (ADR 0026 §3, §4, core/levels.ts): the document a level's canvas lays out, a flow a
 * card; the flows entered, as a link names them; a flow's day by precedence, with its extent counted and a flow that
 * only waits told apart from one that holds; what a flow gives and who reads it. On a small estate, then on Larkspur.
 */
import { describe, expect, it } from 'vitest';
import type { DayState } from '../src/core/days.js';
import type { FlowDocument, StepDef } from '../src/core/document.js';
import { cardFlow, flowCard, flowDay, flowHas, flowLine, flowSaid, FLOWS_SECTION, givenBy, levelDoc, readersOfFlow, readHere, trailOf, type RunSaid } from '../src/core/levels.js';
import { gridLayout } from '../src/app/layout.js';
import { loadFlowDir } from './helpers/notebooks.js';

const sql = (id: string, inputs: string[], published = false): StepDef => ({ id, kind: 'sql', inputs, sql: 'SELECT 1', ...(published ? { dataset: {} } : {}) });

/**
 * A small estate. Orders has two files and gives `orders`; Stock has one file, reads Orders and gives `stock`; Prices
 * has one file and gives `prices`, read by Stock alone. The report at the top lists Orders and Stock, has a file of its
 * own and gives `report`.
 */
const ESTATE: FlowDocument = {
  smaltfl: 1, id: 'report', name: 'Sales report',
  sources: [{ id: 'orders_file', table: 't1' }, { id: 'returns_file', table: 't2' }, { id: 'prices_file', table: 't3' }, { id: 'stock_file', table: 't4' }, { id: 'regions', table: 't5' }],
  steps: [
    sql('orders_clean', ['orders_file', 'returns_file']), sql('orders', ['orders_clean'], true),
    sql('prices', ['prices_file'], true),
    sql('stock_priced', ['stock_file', 'prices']), sql('stock', ['stock_priced', 'orders'], true),
    sql('by_region', ['orders', 'stock', 'regions']), sql('by_region_2', ['orders', 'by_region']), sql('report', ['by_region_2'], true),
  ],
  groups: [
    { id: 'nb-orders', name: 'orders', steps: ['orders_clean', 'orders'], collapsed: true },
    { id: 'nb-stock', name: 'stock', steps: ['stock_priced', 'stock'], collapsed: true },
    { id: 'nb-report', name: 'report', steps: ['by_region', 'by_region_2', 'report'], collapsed: true },
    { id: 'spare', name: 'Spare', steps: [] },
  ],
  layout: { regions: [10, 20] },
  flows: [
    { path: 'orders/flow.json', id: 'orders_flow', name: 'Orders', hash: 'a'.repeat(64), sources: ['orders_file', 'returns_file'], steps: ['orders_clean', 'orders'], reads: [], direct: true },
    { path: 'prices/flow.json', id: 'prices_flow', name: 'Prices', hash: 'b'.repeat(64), sources: ['prices_file'], steps: ['prices'], reads: [], direct: false },
    { path: 'stock/flow.json', id: 'stock_flow', name: 'Stock', description: 'What is on the shelves.', hash: 'c'.repeat(64), sources: ['stock_file'], steps: ['stock_priced', 'stock'], reads: ['prices_flow', 'orders_flow'], direct: true },
  ],
};
const NAME: Record<string, string> = { '': 'Sales report', orders_flow: 'Orders', prices_flow: 'Prices', stock_flow: 'Stock' };
const nameOf = (id: string) => NAME[id] ?? id;
const ids = (d: FlowDocument) => ({ sources: d.sources.map((s) => s.id), steps: d.steps.map((s) => [s.id, s.inputs] as const) });

describe('a level of the canvas', () => {
  it('is the flow’s own files and steps, and a card for each flow it reads itself', () => {
    const top = levelDoc(ESTATE);
    expect(ids(top)).toEqual({
      sources: ['regions'],
      steps: [
        [flowCard('orders_flow'), []],
        // Stock reads Orders, which the top shows; and Prices, which it doesn't list, so nothing of Prices is here.
        [flowCard('stock_flow'), [flowCard('orders_flow')]],
        // A step that reads two flows has an edge from each card; the same flow twice, one edge.
        ['by_region', [flowCard('orders_flow'), flowCard('stock_flow'), 'regions']],
        ['by_region_2', [flowCard('orders_flow'), 'by_region']],
        ['report', ['by_region_2']],
      ],
    });
    // Its own sections stay; another flow's notebook has nothing here; an empty section is the top's.
    // The flows' cards are one section with no frame, so a line from one never runs behind another.
    expect(top.groups!.map((g) => [g.id, g.steps])).toEqual([[FLOWS_SECTION, [flowCard('orders_flow'), flowCard('stock_flow')]], ['nb-report', ['by_region', 'by_region_2', 'report']], ['spare', []]]);
    expect(top.layout).toEqual(ESTATE.layout);
    expect(top.steps[1]!.description).toBe('What is on the shelves.');
  });

  it('inside a flow is that flow’s own, with the flows it reads as cards, laid out afresh', () => {
    const stock = levelDoc(ESTATE, 'stock_flow');
    expect(ids(stock)).toEqual({
      sources: ['stock_file'],
      steps: [
        [flowCard('orders_flow'), []],
        [flowCard('prices_flow'), []],
        ['stock_priced', ['stock_file', flowCard('prices_flow')]],
        ['stock', ['stock_priced', flowCard('orders_flow')]],
      ],
    });
    expect(stock.groups!.map((g) => g.id)).toEqual([FLOWS_SECTION, 'nb-stock']);
    // One flow read: its card leads the canvas all the same, left of the level's own files (the flows read stand in
    // one column at the left, the maintainer, 2026-11-20).
    const one: FlowDocument = { ...ESTATE, flows: ESTATE.flows!.map((f) => (f.id === 'stock_flow' ? { ...f, reads: ['prices_flow'] } : f)), steps: ESTATE.steps.map((s) => (s.id === 'stock' ? sql('stock', ['stock_priced'], true) : s)) };
    const lone = levelDoc(one, 'stock_flow');
    expect(lone.groups!.map((g) => [g.id, g.steps])).toEqual([[FLOWS_SECTION, [flowCard('prices_flow')]], ['nb-stock', ['stock_priced', 'stock']]]);
    const placed = gridLayout(lone, new Set(['nb-stock']));
    expect(placed.cards.get(flowCard('prices_flow'))!.x).toBeLessThan(placed.cards.get('stock_file')!.x);
    expect(stock.layout).toBeUndefined();
    // A flow that reads none is its files and steps alone.
    expect(ids(levelDoc(ESTATE, 'orders_flow'))).toEqual({ sources: ['orders_file', 'returns_file'], steps: [['orders_clean', ['orders_file', 'returns_file']], ['orders', ['orders_clean']]] });
  });

  it('is laid out as any flow is: every card placed, every edge between two of them', () => {
    for (const at of [null, 'stock_flow', 'orders_flow', 'prices_flow']) {
      const d = levelDoc(ESTATE, at);
      const l = gridLayout(d, new Set((d.groups ?? []).map((g) => g.id)));
      const placed = new Set(l.cards.keys());
      expect([...placed].sort()).toEqual([...d.sources, ...d.steps].map((x) => x.id).sort());
      for (const s of d.steps) for (const i of s.inputs) expect(placed.has(i)).toBe(true);
      // The flows' cards have no frame, folded or not; no two cards share a place.
      expect(l.frames.some((f) => f.id === FLOWS_SECTION)).toBe(false);
      const at2 = [...l.cards].filter(([id]) => cardFlow(id)).map(([, p]) => `${p.x},${p.y}`);
      expect(new Set(at2).size).toBe(at2.length);
    }
  });

  it('stands the flows read in one column, in the order they read each other, clear of each other’s lines', () => {
    // Orders is read by Stock and by the report's own step; Stock by that step too. The flows read stand in one column
    // at the left (the maintainer, 2026-11-20), Stock below Orders, which it reads: the line from Orders to the step
    // leaves to the right, behind no card.
    const d = levelDoc(ESTATE);
    const l = gridLayout(d, new Set((d.groups ?? []).map((g) => g.id)));
    const orders = l.cards.get(flowCard('orders_flow'))!;
    const stock = l.cards.get(flowCard('stock_flow'))!;
    expect(stock.x).toBe(orders.x);
    expect(stock.y).toBeGreaterThan(orders.y);
    // Every other card the layout places (a card placed by hand stays where it was put) stands right of them.
    const others = [...l.cards].filter(([k]) => !k.startsWith(flowCard('')) && !(k in (d.layout ?? {}))).map(([, p]) => p.x);
    expect(Math.min(...others)).toBeGreaterThan(orders.x);
  });

  it('leaves a flow that reads none as it is, and takes a flow it doesn’t read for the top', () => {
    const { flows: _flows, ...plain } = ESTATE;
    expect(levelDoc(plain)).toBe(plain);
    expect(levelDoc(plain, 'orders_flow')).toBe(plain);
    expect(ids(levelDoc(ESTATE, 'nowhere'))).toEqual(ids(levelDoc(ESTATE)));
  });

  it('gives no card to a flow the viewer has nothing left of', () => {
    const seen: FlowDocument = { ...ESTATE, sources: ESTATE.sources.filter((s) => s.id !== 'orders_file' && s.id !== 'returns_file'), steps: ESTATE.steps.filter((s) => s.id !== 'orders_clean' && s.id !== 'orders').map((s) => ({ ...s, inputs: s.inputs.filter((i) => i !== 'orders') }) as StepDef) };
    expect(levelDoc(seen).steps.map((s) => [s.id, s.inputs])).toEqual([[flowCard('stock_flow'), []], ['by_region', [flowCard('stock_flow'), 'regions']], ['by_region_2', ['by_region']], ['report', ['by_region_2']]]);
  });

  it('joins a flow’s card to the step a written rule judges by it, where no step takes its rows', () => {
    // Stock's file is counted against Prices' list by its gate's scope: no step of Stock reads Prices' rows.
    const scoped: FlowDocument = {
      ...ESTATE,
      steps: ESTATE.steps.map((s) => (s.id === 'stock_priced' ? sql('stock_priced', ['stock_file']) : s)),
      gates: { stock_file: { layer: 'bronze', checks: {}, scope: { of: 'prices', key: 'sku', where: 'listed' } }, stock: { layer: 'silver', checks: {}, reconcile: { key: ['sku'], of: 'orders' } } },
    };
    const stock = levelDoc(scoped, 'stock_flow');
    // The judged file's card is joined through the first step that reads the file; a judged step, itself.
    expect(stock.steps.map((s) => [s.id, s.inputs])).toEqual([
      [flowCard('orders_flow'), []],
      [flowCard('prices_flow'), []],
      ['stock_priced', ['stock_file', flowCard('prices_flow')]],
      ['stock', ['stock_priced', flowCard('orders_flow')]],
    ]);
    // A rule that reads the level's own data adds nothing: only a flow's card is joined so.
    const own: FlowDocument = { ...ESTATE, gates: { returns_file: { layer: 'bronze', checks: {}, scope: { of: 'orders_file', key: 'id', where: 'open' } } } };
    expect(ids(levelDoc(own, 'orders_flow'))).toEqual(ids(levelDoc(ESTATE, 'orders_flow')));
  });

  it('names a card by its flow, and nothing else by one', () => {
    expect(cardFlow(flowCard('feeds'))).toBe('feeds');
    expect(cardFlow('feeds')).toBeNull();
    expect(cardFlow('nb-feeds')).toBeNull();
    expect(cardFlow(null)).toBeNull();
    expect(readHere(ESTATE).map((f) => f.id)).toEqual(['orders_flow', 'stock_flow']);
    expect(readHere(ESTATE, 'stock_flow').map((f) => f.id)).toEqual(['orders_flow', 'prices_flow']);
    expect(readHere(ESTATE, 'prices_flow')).toEqual([]);
  });
});

describe('where you are', () => {
  it('is the flows entered from the top, each read by the one before', () => {
    expect(trailOf(ESTATE, [])).toEqual([]);
    expect(trailOf(ESTATE, ['stock_flow'])).toEqual(['stock_flow']);
    expect(trailOf(ESTATE, ['stock_flow', 'prices_flow'])).toEqual(['stock_flow', 'prices_flow']);
    expect(trailOf(ESTATE, ['stock_flow', 'orders_flow'])).toEqual(['stock_flow', 'orders_flow']);
  });

  it('a trail that isn’t one is put right: the shortest way to the last flow it names', () => {
    // Prices is read by Stock alone: a link that names it alone goes through Stock.
    expect(trailOf(ESTATE, ['prices_flow'])).toEqual(['stock_flow', 'prices_flow']);
    // Orders isn't read by Prices: the shortest way to Orders is from the top.
    expect(trailOf(ESTATE, ['prices_flow', 'orders_flow'])).toEqual(['orders_flow']);
    expect(trailOf(ESTATE, ['nowhere'])).toEqual([]);
    expect(trailOf(ESTATE, ['stock_flow', 'nowhere'])).toEqual(['stock_flow']);
    expect(trailOf({}, ['stock_flow'])).toEqual([]);
  });
});

const hold = (origin: string, said: string, reaches: string[], by = 'checks') => ({ by, node: 1, origin, said, reaches });
const node = (origin: string, status = 'built') => ({ node: 0, origin, op: 'table', key: `k-${origin}`, status, ...(status === 'built' ? { content: `c-${origin}`, rows: 10 } : {}) });
const ALL = [...ESTATE.sources, ...ESTATE.steps].map((x) => x.id);
const said = (o: { holds?: unknown[]; claims?: unknown[]; held?: string[]; became?: DayState | null; failedAt?: string; nodes?: unknown[]; outcome?: string }): RunSaid => ({
  about: { holds: (o.holds ?? []) as never, claims: (o.claims ?? []) as never, outcome: (o.outcome ?? (o.holds?.length ? 'held' : 'ok')) as never },
  manifest: { nodes: (o.nodes ?? ALL.map((id) => node(id))) as never },
  held: o.held ?? [],
  became: o.became ?? null,
  ...(o.failedAt ? { failedAt: o.failedAt } : {}),
});
const dayOf = (flow: string, run: RunSaid | null) => {
  const d = flowDay(ESTATE, flow, run);
  return { outcome: d.outcome, line: flowLine(ESTATE, d, nameOf), said: flowSaid(ESTATE, d, nameOf) };
};

describe('a flow’s day', () => {
  it('before a run says what the flow has', () => {
    expect(dayOf('orders_flow', null)).toEqual({ outcome: 'none', line: '2 files, 2 steps', said: '2 files, 2 steps' });
    expect(flowHas({ files: 0, steps: 7 })).toBe('7 steps');
    expect(flowHas({ files: 1, steps: 1 })).toBe('1 file, 1 step');
    expect(flowHas({ files: 0, steps: 0 })).toBe('nothing of its own');
  });

  it('is normal where everything it has was built and nothing said otherwise', () => {
    expect(dayOf('orders_flow', said({}))).toEqual({ outcome: 'normal', line: '2 files, 2 steps', said: 'Normal · 2 files, 2 steps' });
    // Nothing of it built (the run stopped before it): no day to speak of.
    expect(dayOf('stock_flow', said({ nodes: [node('orders_file'), node('orders')] })).outcome).toBe('none');
  });

  it('is paused by a file or a step of its own, with its extent counted; the flows built from it wait on it', () => {
    const run = said({ holds: [hold('returns_file', '412 rows with no order', ['orders', 'stock', 'report'])], held: ['orders', 'stock', 'report'], became: 'waiting' });
    expect(dayOf('orders_flow', run)).toEqual({ outcome: 'waiting', line: 'returns_file · 1 of 2 files', said: 'Paused · returns_file, 1 of 2 files' });
    expect(dayOf('stock_flow', run)).toEqual({ outcome: 'waits', line: 'Waits on Orders', said: 'Waits on Orders' });
    // Prices gives nothing the hold reaches: its day is its own.
    expect(dayOf('prices_flow', run).outcome).toBe('normal');
    const d = flowDay(ESTATE, 'orders_flow', run);
    expect(d.holding).toEqual([{ id: 'returns_file', kind: 'file', refused: false, said: '412 rows with no order' }]);
    expect(flowDay(ESTATE, 'stock_flow', run)).toMatchObject({ waitsOn: ['orders_flow'], kept: ['stock'], holding: [] });
  });

  it('counts files and steps apart, and names two before it counts the rest', () => {
    const run = said({ holds: [hold('orders_file', 'empty', ['orders']), hold('returns_file', 'empty', ['orders']), hold('orders_clean', '3 checks failed', ['orders'])], held: ['orders'], became: 'waiting' });
    expect(dayOf('orders_flow', run)).toEqual({ outcome: 'waiting', line: 'orders_file, returns_file and 1 more · 2 of 2 files, 1 of 2 steps', said: 'Paused · orders_file, returns_file and 1 more, 2 of 2 files, 1 of 2 steps' });
  });

  it('fits a card: the names give way, then the word after the count; the count never does', () => {
    const run = said({ holds: [hold('returns_file', 'short', ['orders'])], held: ['orders'], became: 'waiting' });
    const d = flowDay(ESTATE, 'orders_flow', run);
    expect(flowLine(ESTATE, d, nameOf)).toBe('returns_file · 1 of 2 files');
    expect(flowLine(ESTATE, d, nameOf, 27)).toBe('returns_file · 1 of 2 files');
    expect(flowLine(ESTATE, d, nameOf, 21)).toBe('returns_file · 1 of 2');
    expect(flowLine(ESTATE, d, nameOf, 18)).toBe('returns_… · 1 of 2');
    expect(flowLine(ESTATE, d, nameOf, 10)).toBe('1 of 2 fi…');
    for (const room of [10, 14, 18, 21, 26, 27, 40]) expect(flowLine(ESTATE, d, nameOf, room).length).toBeLessThanOrEqual(room);
    const waits = flowDay(ESTATE, 'stock_flow', said({ holds: [hold('returns_file', 'short', ['orders', 'stock'])], held: ['orders', 'stock'], became: 'waiting' }));
    expect(flowLine(ESTATE, waits, nameOf, 12)).toBe('Waits on Or…');
    const two = flowDay(ESTATE, 'orders_flow', said({ holds: [hold('orders_file', 'empty', ['orders']), hold('orders_clean', 'failed', ['orders'])], held: ['orders'], became: 'waiting' }));
    // Files and steps both: the words stay, since a bare count would say neither.
    expect(flowLine(ESTATE, two, nameOf, 40)).toBe('orders_fil… · 1 of 2 files, 1 of 2 steps');
  });

  it('a refused file holds its flow, and every flow waits on it: nothing was built', () => {
    const run = said({ holds: [hold('stock_file', 'its columns changed', ['orders', 'prices', 'stock', 'report'])], held: ['orders', 'prices', 'stock', 'report'], became: 'waiting', nodes: [node('stock_file', 'refused')] });
    const d = flowDay(ESTATE, 'stock_flow', run);
    expect(d.holding).toEqual([{ id: 'stock_file', kind: 'file', refused: true, said: 'its columns changed' }]);
    expect(dayOf('stock_flow', run).said).toBe('Paused · stock_file, 1 of 1 file');
    expect(dayOf('orders_flow', run)).toEqual({ outcome: 'waits', line: 'Waits on Stock', said: 'Waits on Stock' });
  });

  it('says what a decision made of it: published and how, or kept back; and the flows that waited with it', () => {
    const run = (became: DayState) => said({ holds: [hold('returns_file', 'short', ['orders', 'stock', 'report'])], held: ['orders', 'stock', 'report'], became });
    expect(dayOf('orders_flow', run('asis'))).toEqual({ outcome: 'decided', line: 'As is · returns_file', said: 'Published as is · returns_file, 1 of 2 files' });
    expect(dayOf('orders_flow', run('fill'))).toEqual({ outcome: 'decided', line: 'Filled · returns_file', said: 'Published filled · returns_file, 1 of 2 files' });
    expect(dayOf('orders_flow', run('complete')).said).toBe('Published with the part that arrived · returns_file, 1 of 2 files');
    expect(dayOf('orders_flow', run('accepted'))).toEqual({ outcome: 'decided', line: 'New level · returns_file', said: 'Published as a new level · returns_file, 1 of 2 files' });
    expect(dayOf('orders_flow', run('dont'))).toEqual({ outcome: 'kept', line: 'returns_file · 1 of 2 files', said: 'Not published · returns_file, 1 of 2 files' });
    expect(dayOf('stock_flow', run('asis'))).toEqual({ outcome: 'decided', line: 'with Orders', said: 'Published as is, with Orders' });
    expect(dayOf('stock_flow', run('dont'))).toEqual({ outcome: 'kept', line: 'with Orders', said: 'Not published, with Orders' });
  });

  it('where the flow publishes together, waits on whichever flow holds, and on the top where the top’s own step does', () => {
    // Under `together` every output is kept back, reached or not.
    const run = said({ holds: [hold('by_region', '2 checks failed', ['report'])], held: ['orders', 'prices', 'stock', 'report'], became: 'waiting' });
    expect(flowDay(ESTATE, 'orders_flow', run)).toMatchObject({ outcome: 'waits', waitsOn: [''] });
    expect(dayOf('orders_flow', run).said).toBe('Waits on Sales report');
    const two = said({ holds: [hold('returns_file', 'short', ['orders', 'stock', 'report']), hold('prices_file', 'empty', ['prices', 'stock', 'report'])], held: ['orders', 'prices', 'stock', 'report'], became: 'waiting' });
    expect(dayOf('stock_flow', two).said).toBe('Waits on Orders and Prices');
    // A flow that holds is paused, whatever else waits on another.
    expect(dayOf('orders_flow', two).outcome).toBe('waiting');
  });

  it('is unusual, or not judged yet, by what a claim said of its own files and steps', () => {
    const run = said({ claims: [{ source: 'orders_file', state: 'unusual' }, { source: 'stock', state: 'unlearned' }] });
    expect(dayOf('orders_flow', run)).toEqual({ outcome: 'unusual', line: 'orders_file · 1 of 2 files', said: 'Unusual · orders_file, 1 of 2 files' });
    expect(dayOf('stock_flow', run)).toEqual({ outcome: 'unjudged', line: 'stock · 1 of 2 steps', said: 'Not judged yet · stock, 1 of 2 steps' });
  });

  it('a hold outranks what is merely unusual, and a hold nothing waits on is something to look at', () => {
    const run = said({ holds: [hold('returns_file', 'short', ['orders'])], held: ['orders'], became: 'waiting', claims: [{ source: 'orders_file', state: 'unusual' }] });
    expect(dayOf('orders_flow', run).said).toBe('Paused · returns_file, 1 of 2 files');
    const quiet = said({ holds: [hold('returns_file', 'short', ['orders'])], held: ['orders'], became: null });
    expect(dayOf('orders_flow', quiet)).toEqual({ outcome: 'unusual', line: 'returns_file · 1 of 2 files', said: 'Unusual · returns_file, 1 of 2 files' });
    expect(dayOf('stock_flow', quiet).outcome).toBe('normal');
  });

  it('a what-if’s and a restatement’s holds are no flow’s; a file sent again holds its flow until decided', () => {
    const whatIf = said({ holds: [hold('report', 'a what-if: never published', ['orders', 'prices', 'stock', 'report'], 'what-if')], held: ['orders', 'prices', 'stock', 'report'], became: 'waiting' });
    expect(dayOf('orders_flow', whatIf).outcome).toBe('normal');
    expect(dayOf('stock_flow', whatIf).outcome).toBe('normal');
    const again = said({ holds: [hold('returns_file', 'a later file for its day: it waits for a decision', ['orders', 'stock', 'report'], 'correction')], held: ['orders', 'stock', 'report'], became: 'waiting' });
    expect(dayOf('orders_flow', again).outcome).toBe('waiting');
    expect(dayOf('stock_flow', again).outcome).toBe('waits');
  });

  it('says where the run failed, in the flow it failed in', () => {
    const run = said({ failedAt: 'stock_priced', outcome: 'failed', nodes: [node('orders_file'), node('returns_file'), node('orders_clean'), node('orders'), node('stock_file')] });
    expect(dayOf('stock_flow', run)).toEqual({ outcome: 'failed', line: 'failed at stock_priced', said: 'The run failed at stock_priced' });
    expect(dayOf('orders_flow', run).outcome).toBe('normal');
    // A file refused before any run (its bytes aren't the ones its list names): nothing ran, and its flow says whose.
    const refused: RunSaid = { about: { holds: [], claims: [], outcome: 'failed' }, manifest: null, held: [], became: null, failedAt: 'stock_file', refusedFile: true };
    expect(dayOf('stock_flow', refused)).toEqual({ outcome: 'failed', line: 'stock_file: file refused', said: 'Not run · stock_file’s file was refused: it isn’t the file its list names' });
    expect(dayOf('orders_flow', refused).outcome).toBe('none');
  });
});

describe('what a flow gives', () => {
  it('is each dataset it publishes, with the flows whose steps read it', () => {
    expect(givenBy(ESTATE, 'orders_flow')).toEqual([{ id: 'orders', readers: ['', 'stock_flow'] }]);
    expect(givenBy(ESTATE, 'prices_flow')).toEqual([{ id: 'prices', readers: ['stock_flow'] }]);
    expect(givenBy(ESTATE, 'stock_flow')).toEqual([{ id: 'stock', readers: [''] }]);
    expect(readersOfFlow(ESTATE, 'orders_flow')).toEqual(['', 'stock_flow']);
    expect(readersOfFlow(ESTATE, 'prices_flow')).toEqual(['stock_flow']);
  });
});

describe('Larkspur in levels', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);

  it('is four cards and the posture product’s own at the top; each flow its own inside', async () => {
    const doc = await loadFlowDir(dir);
    const top = levelDoc(doc);
    const cards = top.steps.filter((s) => cardFlow(s.id));
    expect(cards.map((s) => [cardFlow(s.id), s.inputs.map((i) => cardFlow(i))])).toEqual([
      ['hr', []],
      ['inventory', []],
      ['feeds', ['inventory']],
      ['applications', ['inventory', 'hr', 'feeds']],
    ]);
    expect(top.sources.map((s) => s.id)).toEqual(['control_catalog', 'control_requirements', 'exceptions']);
    expect(top.groups!.map((g) => g.name)).toEqual(['Flows', 'Bronze', 'Evidence', 'Posture', 'Product']);
    // Evidence feeds reads Inventory through a gate's scope alone, no step's input: its card is joined to it all the same.
    expect(doc.steps.filter((s) => doc.flows!.find((f) => f.id === 'feeds')!.steps.includes(s.id)).flatMap((s) => s.inputs).filter((i) => doc.flows!.find((f) => f.id === 'inventory')!.steps.includes(i) || doc.flows!.find((f) => f.id === 'inventory')!.sources.includes(i))).toEqual([]);
    // Every step of the top reads cards or its own: nothing of another flow shows through.
    const own = new Set([...top.sources, ...top.steps].map((x) => x.id));
    for (const s of top.steps) for (const i of s.inputs) expect(own.has(i)).toBe(true);
    expect(top.sources.length + top.steps.length).toBeLessThan(doc.sources.length + doc.steps.length);

    const feeds = levelDoc(doc, 'feeds');
    expect(feeds.sources).toHaveLength(13);
    expect(feeds.steps.filter((s) => cardFlow(s.id)).map((s) => s.id)).toEqual([flowCard('inventory')]);
    // Inside Evidence feeds the Inventory's card isn't adrift: each file is counted against the inventory's
    // applications, so the first step that reads each file is joined to it.
    expect(feeds.steps.filter((s) => s.inputs.includes(flowCard('inventory'))).length).toBeGreaterThanOrEqual(12);
    expect(feeds.steps.filter((s) => !cardFlow(s.id))).toHaveLength(25);
    const apps = levelDoc(doc, 'applications');
    expect(apps.sources).toEqual([]);
    expect(apps.steps.filter((s) => cardFlow(s.id)).map((s) => cardFlow(s.id))).toEqual(['hr', 'inventory', 'feeds']);
    expect(apps.steps.filter((s) => !cardFlow(s.id))).toHaveLength(7);
    // Every source and step is on exactly one level as itself.
    const seen = [null, 'hr', 'inventory', 'feeds', 'applications'].flatMap((at) => {
      const d = levelDoc(doc, at);
      return [...d.sources, ...d.steps].map((x) => x.id).filter((id) => !cardFlow(id));
    });
    expect(seen.sort()).toEqual([...doc.sources, ...doc.steps].map((x) => x.id).sort());
    expect(givenBy(doc, 'hr').map((g) => g.id)).toEqual(['org_units', 'leaders', 'org_closure', 'org_chain']);
    expect(readersOfFlow(doc, 'inventory')).toEqual(['', 'feeds', 'applications']);
  });
});
