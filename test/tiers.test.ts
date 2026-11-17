/**
 * The month in tiers (ADR 0026 §5, core/tiers.ts): a row a flow above the files and steps, its day the worst any of its
 * own files or steps said; a flow that held nothing of its own while another flow's hold kept back what it gives only
 * waited, told apart from one that held.
 */
import { describe, expect, it } from 'vitest';
import type { FlowDocument, StepDef } from '../src/core/document.js';
import type { LogEntry } from '../src/core/log.js';
import type { RunManifest } from '../src/core/manifest.js';
import { healthOf, healthRows, followsFiles } from '../src/core/overview.js';
import { flowMonthOutcome, flowOff, flowRows, flowRowSaid, nodesOf, onlyFollowed, onlyWaited, scopeFlows, scopeNodes, tierRows } from '../src/core/tiers.js';

const sql = (id: string, inputs: string[], published = false): StepDef => ({ id, kind: 'sql', inputs, sql: 'SELECT 1', ...(published ? { dataset: {} } : {}) });

/** Orders (two files, gives `orders`); Stock (one file, reads Orders, gives `stock`); the report on top, which gives `report`. */
const ESTATE: FlowDocument = {
  smaltfl: 1, id: 'report', name: 'Sales report',
  sources: [{ id: 'orders_file', table: 't1' }, { id: 'returns_file', table: 't2' }, { id: 'stock_file', table: 't4' }, { id: 'regions', table: 't5' }],
  steps: [
    sql('orders_clean', ['orders_file', 'returns_file']), sql('orders', ['orders_clean'], true),
    sql('stock', ['stock_file', 'orders'], true),
    sql('by_region', ['orders', 'stock', 'regions']), sql('report', ['by_region'], true),
  ],
  publish: { hold: ['checks', 'wrong'], together: false } as never,
  flows: [
    { path: 'orders/flow.json', id: 'orders_flow', name: 'Orders', hash: 'a'.repeat(64), sources: ['orders_file', 'returns_file'], steps: ['orders_clean', 'orders'], reads: [], direct: true },
    { path: 'stock/flow.json', id: 'stock_flow', name: 'Stock', hash: 'c'.repeat(64), sources: ['stock_file'], steps: ['stock'], reads: ['orders_flow'], direct: true },
  ],
};
const NAME: Record<string, string> = { '': 'Sales report', orders_flow: 'Orders', stock_flow: 'Stock' };
const nameOf = (id: string) => NAME[id] ?? id;

const ALL = [...ESTATE.sources, ...ESTATE.steps].map((x) => x.id);
const node = (origin: string) => ({ node: 0, origin, op: 'table', key: `k-${origin}`, status: 'built', content: `c-${origin}`, rows: 10 });
const MANIFEST = { plan: 'p1', nodes: ALL.map(node) } as unknown as RunManifest;
const hold = (origin: string, reaches: string[], by = 'checks') => ({ by, node: 1, origin, said: 'short', reaches });
let seq = 0;
const run = (day: string, about: Record<string, unknown> = {}, at = `${day}T06:00:00Z`): LogEntry => ({
  smaltflLog: 1, origin: 'build:report', seq: seq++, kind: 'run', at, by: { card: null, as: 'build' },
  about: { run: `r${seq}`, manifest: 'm1', day, outcome: (about.holds as unknown[] | undefined)?.length ? 'held' : 'ok', ...about } as LogEntry['about'], reason: null, amends: null, nonce: '0'.repeat(32),
} as unknown as LogEntry);
const DAYS = ['2024-03-04', '2024-03-05', '2024-03-06', '2024-03-07'];
const dayName = (d: string) => `d${Number(d.slice(8))}`;
const rowsOf = (entries: LogEntry[], doc: FlowDocument = ESTATE, at?: string) => flowRows(doc, DAYS, entries, () => MANIFEST, at);
const by = (rows: ReturnType<typeof flowRows>, id: string) => rows.find((r) => r.flow === id)!;

describe('a flow’s row of the month', () => {
  it('is one for each flow the document reads, then the document’s own; none where it reads no flow', () => {
    const rows = rowsOf([run('2024-03-04')]);
    expect(rows.map((r) => [r.flow, r.label, r.files, r.steps])).toEqual([['orders_flow', 'Orders', 2, 2], ['stock_flow', 'Stock', 1, 1], ['', 'Sales report', 1, 2]]);
    expect(rows.map((r) => r.cells)).toEqual([['ok', null, null, null], ['ok', null, null, null], ['ok', null, null, null]]);
    const { flows: _flows, ...plain } = ESTATE;
    expect(flowRows(plain, DAYS, [run('2024-03-04')], () => MANIFEST)).toEqual([]);
    expect(nodesOf(ESTATE, 'orders_flow')).toEqual({ files: ['orders_file', 'returns_file'], steps: ['orders_clean', 'orders'] });
    expect(nodesOf(ESTATE, '')).toEqual({ files: ['regions'], steps: ['by_region', 'report'] });
  });

  it('holds on the day a file or a step of its own held; the flows built from it only waited', () => {
    const rows = rowsOf([run('2024-03-04'), run('2024-03-05', { holds: [hold('returns_file', ['orders', 'stock', 'report'])] }), run('2024-03-06')]);
    const orders = by(rows, 'orders_flow');
    expect(orders.cells).toEqual(['ok', 'held', 'ok', null]);
    expect(orders).toMatchObject({ held: ['2024-03-05'], waited: [], waitedOn: [] });
    expect(flowOff(orders)).toBe(true);
    const stock = by(rows, 'stock_flow');
    expect(stock.cells).toEqual(['ok', 'ok', 'ok', null]);
    expect(stock).toMatchObject({ held: [], waited: ['2024-03-05'], waitedOn: ['orders_flow'] });
    expect(onlyWaited(stock)).toBe(true);
    expect(onlyWaited(orders)).toBe(false);
    expect(by(rows, '')).toMatchObject({ waited: ['2024-03-05'], waitedOn: ['orders_flow'] });
    expect(flowRowSaid(orders, dayName, nameOf)).toBe('held on d5');
    expect(flowRowSaid(stock, dayName, nameOf)).toBe('waited on Orders on d5');
  });

  it('a hold that reaches nothing a flow gives leaves it be, unless the flow publishes together', () => {
    // The report's own step holds: it reaches the report alone, built from Orders and Stock, not the other way.
    const entries = [run('2024-03-05', { holds: [hold('by_region', ['report'])] })];
    const rows = rowsOf(entries);
    expect(by(rows, '').held).toEqual(['2024-03-05']);
    expect(by(rows, 'orders_flow')).toMatchObject({ held: [], waited: [] });
    expect(by(rows, 'stock_flow')).toMatchObject({ held: [], waited: [] });
    const together = rowsOf(entries, { ...ESTATE, publish: { hold: ['checks'] } as never });
    expect(by(together, 'orders_flow')).toMatchObject({ waited: ['2024-03-05'], waitedOn: [''] });
    expect(flowRowSaid(by(together, 'orders_flow'), dayName, nameOf)).toBe('waited on Sales report on d5');
  });

  it('counts a day once over its runs: held where any run of it held, never waited on a day it held', () => {
    // The file held, then was sent again right: the day still shows where it broke (ADR 0024 §5).
    const rows = rowsOf([
      run('2024-03-05', { holds: [hold('stock_file', ['stock', 'report'])] }),
      run('2024-03-05', { holds: [hold('returns_file', ['orders', 'stock', 'report'])] }, '2024-03-05T09:00:00Z'),
      run('2024-03-05', {}, '2024-03-05T12:00:00Z'),
    ]);
    expect(by(rows, 'stock_flow')).toMatchObject({ held: ['2024-03-05'], waited: [] });
    expect(by(rows, 'orders_flow')).toMatchObject({ held: ['2024-03-05'], waited: [] });
    expect(by(rows, '')).toMatchObject({ held: [], waited: ['2024-03-05'], waitedOn: ['orders_flow', 'stock_flow'] });
    expect(flowRowSaid(by(rows, ''), dayName, nameOf)).toBe('waited on Orders and Stock on d5');
  });

  it('reads the month as known on a moment', () => {
    const entries = [run('2024-03-05', { holds: [hold('returns_file', ['orders', 'stock', 'report'])] }), run('2024-03-06', {}, '2024-03-06T06:00:00Z')];
    expect(by(rowsOf(entries, ESTATE, '2024-03-05T23:59:59Z'), 'orders_flow').cells).toEqual([null, 'held', null, null]);
    expect(by(rowsOf(entries), 'orders_flow').cells).toEqual([null, 'held', 'ok', null]);
  });

  it('a file sent again holds for a decision whatever its data says: no flow held, and none waited on it', () => {
    // As a file's own row has it (month.ts `cellOf`, Q-183): the later delivery says nothing of the data.
    const rows = rowsOf([run('2024-03-05', { holds: [hold('returns_file', ['orders', 'stock', 'report'], 'correction')] })]);
    for (const r of rows) expect(r).toMatchObject({ held: [], waited: [] });
  });

  it('says a flow’s days in words: its own first, then the days it waited', () => {
    const rows = rowsOf([
      run('2024-03-04', { holds: [hold('returns_file', ['orders', 'stock', 'report'])] }),
      run('2024-03-05', { holds: [hold('stock_file', ['stock', 'report'])] }),
      run('2024-03-06', { holds: [hold('returns_file', ['orders', 'stock', 'report'])] }),
      run('2024-03-07', { claims: [{ source: 'stock_file', state: 'unusual' }] }),
    ]);
    expect(flowRowSaid(by(rows, 'orders_flow'), dayName, nameOf)).toBe('held 2 days (d4, d6)');
    expect(flowRowSaid(by(rows, 'stock_flow'), dayName, nameOf)).toBe('held on d5 · unusual on d7 · waited on Orders 2 days (d4, d6)');
    expect(flowRowSaid(by(rows, ''), dayName, nameOf)).toBe('waited on Orders and Stock 3 days (d4, d5, d6)');
    const calm = rowsOf([run('2024-03-04')]);
    expect(flowRowSaid(by(calm, 'orders_flow'), dayName, nameOf)).toBe('every day fine');
  });

  it('tells a flow’s own days from the days it only followed a flow it reads, the same rule as a step and its files', () => {
    const rows = rowsOf([
      // Orders' file holds, and Stock's own check fails on what it reads of it: Stock followed.
      run('2024-03-04', { holds: [hold('returns_file', ['orders', 'stock', 'report']), hold('stock', ['stock', 'report'])] }),
      // Stock's file holds on a day nothing of Orders does: its own.
      run('2024-03-05', { holds: [hold('stock_file', ['stock', 'report'])] }),
      // Orders is unusual, and so is the report built on it: the report followed.
      run('2024-03-06', { claims: [{ source: 'orders_file', state: 'unusual' }, { source: 'report', state: 'unusual' }] }),
    ]);
    const stock = by(rows, 'stock_flow');
    expect(stock).toMatchObject({ held: ['2024-03-04', '2024-03-05'], own: ['2024-03-05'], followedOn: ['orders_flow'] });
    expect(flowOff(stock)).toBe(true);
    expect(onlyFollowed(stock)).toBe(false);
    const top = by(rows, '');
    expect(top).toMatchObject({ held: [], unusual: ['2024-03-06'], own: [], followedOn: ['orders_flow'], waited: ['2024-03-04', '2024-03-05'] });
    expect(flowOff(top)).toBe(false);
    expect(onlyFollowed(top)).toBe(true);
    expect(flowRowSaid(top, dayName, nameOf)).toBe('unusual on d6, following Orders · waited on Orders and Stock 2 days (d4, d5)');
    // A flow that reads none follows none: every day off is its own.
    expect(by(rows, 'orders_flow')).toMatchObject({ own: ['2024-03-04', '2024-03-06'], followedOn: [] });
    // Held only where a flow it reads held: it only followed, and says whom.
    const only = rowsOf([run('2024-03-04', { holds: [hold('returns_file', ['orders', 'stock', 'report']), hold('stock', ['stock', 'report'])] })]);
    expect(onlyFollowed(by(only, 'stock_flow'))).toBe(true);
    expect(flowRowSaid(by(only, 'stock_flow'), dayName, nameOf)).toBe('held on d4, following Orders');
  });

  it('a flow’s own file is its own, whatever a flow it reads did that day; a day it waited and was unusual on is said once', () => {
    const rows = rowsOf([run('2024-03-04', { holds: [hold('returns_file', ['orders', 'stock', 'report'])], claims: [{ source: 'stock_file', state: 'unusual' }] })]);
    const stock = by(rows, 'stock_flow');
    expect(stock).toMatchObject({ unusual: ['2024-03-04'], waited: ['2024-03-04'], own: ['2024-03-04'], followedOn: [] });
    expect(flowOff(stock)).toBe(true);
    expect(flowRowSaid(stock, dayName, nameOf)).toBe('unusual on d4');
  });

  it('gives no row to a flow the viewer has nothing left of', () => {
    const seen: FlowDocument = { ...ESTATE, sources: ESTATE.sources.filter((s) => s.id !== 'stock_file'), steps: ESTATE.steps.filter((s) => s.id !== 'stock').map((s) => ({ ...s, inputs: s.inputs.filter((i) => i !== 'stock') }) as StepDef) };
    expect(rowsOf([run('2024-03-04')], seen).map((r) => r.flow)).toEqual(['orders_flow', '']);
  });
});

describe('a flow’s own month', () => {
  it('is about the flow and every flow it reads, the flow last', () => {
    expect(scopeFlows(ESTATE, 'stock_flow')).toEqual(['orders_flow', 'stock_flow']);
    expect(scopeFlows(ESTATE, 'orders_flow')).toEqual(['orders_flow']);
    expect(scopeNodes(ESTATE, 'stock_flow')).toEqual(['orders_file', 'returns_file', 'orders_clean', 'orders', 'stock_file', 'stock']);
    expect(scopeNodes(ESTATE, 'orders_flow')).toEqual(['orders_file', 'returns_file', 'orders_clean', 'orders']);
  });

  it('takes the day’s own outcome where something in its scope held', () => {
    const held = [{ level: 'held' as const }];
    expect(flowMonthOutcome({ day: 'd', outcome: 'waiting', how: null }, held)).toEqual({ day: 'd', outcome: 'waiting', how: null });
    expect(flowMonthOutcome({ day: 'd', outcome: 'decided', how: 'fill' }, held)).toEqual({ day: 'd', outcome: 'decided', how: 'fill' });
    expect(flowMonthOutcome({ day: 'd', outcome: 'kept', how: null }, held)).toEqual({ day: 'd', outcome: 'kept', how: null });
    // Held in a run of the day, and the day went out on its own in the end: something to look at.
    expect(flowMonthOutcome({ day: 'd', outcome: 'normal', how: null }, held)).toEqual({ day: 'd', outcome: 'unusual', how: null });
  });

  it('is none of its business where the day was held outside its scope: its own files and steps say its day', () => {
    expect(flowMonthOutcome({ day: 'd', outcome: 'waiting', how: null }, [])).toEqual({ day: 'd', outcome: 'normal', how: null });
    expect(flowMonthOutcome({ day: 'd', outcome: 'decided', how: 'asis' }, [{ level: 'unusual' }])).toEqual({ day: 'd', outcome: 'unusual', how: null });
    expect(flowMonthOutcome({ day: 'd', outcome: 'kept', how: null }, [{ level: 'unjudged' }])).toEqual({ day: 'd', outcome: 'unjudged', how: null });
    expect(flowMonthOutcome({ day: 'd', outcome: 'unusual', how: null }, [])).toEqual({ day: 'd', outcome: 'normal', how: null });
    expect(flowMonthOutcome({ day: 'd', outcome: 'unusual', how: null }, [{ level: 'unusual' }, { level: 'unjudged' }])).toEqual({ day: 'd', outcome: 'unusual', how: null });
  });

  it('a day not run, not arrived or failed is that for every flow', () => {
    for (const outcome of ['notRun', 'notArrived', 'failed'] as const) expect(flowMonthOutcome({ day: 'd', outcome, how: null }, [{ level: 'held' }])).toEqual({ day: 'd', outcome, how: null });
  });
});

describe('the month’s rows, each in its flow', () => {
  // Stock checks Orders' returns file on its own account: a step of Stock that reads that file and nothing else.
  const CROSS: FlowDocument = { ...ESTATE, steps: [...ESTATE.steps.slice(0, 2), sql('returns_seen', ['returns_file']), ...ESTATE.steps.slice(2)], flows: ESTATE.flows!.map((f) => (f.id === 'stock_flow' ? { ...f, steps: [...f.steps, 'returns_seen'] } : f)) };

  it('keeps a file’s row to its own flow’s steps; another flow’s step that reads it alone is that flow’s, and follows the file', () => {
    // As the month folds it, the step is in the file's row, whoever's it is.
    expect(healthRows(CROSS).find((r) => r.id === 'returns_file')!.origins).toEqual(['returns_file', 'returns_seen']);
    const rows = tierRows(CROSS);
    expect(rows.find((r) => r.id === 'returns_file')).toMatchObject({ flow: 'orders_flow', kind: 'file', origins: ['returns_file'] });
    expect(rows.find((r) => r.id === 'returns_seen')).toMatchObject({ flow: 'stock_flow', kind: 'step', origins: ['returns_seen'], reads: ['returns_file'] });
    // Files first, then the steps in the document's order.
    expect(rows.map((r) => r.id)).toEqual(['orders_file', 'returns_file', 'stock_file', 'regions', 'orders_clean', 'orders', 'returns_seen', 'stock', 'by_region', 'report']);
    expect(rows.filter((r) => r.flow === 'stock_flow').map((r) => r.id)).toEqual(['stock_file', 'returns_seen', 'stock']);
  });

  it('a step that only followed another flow’s file is told apart from one with trouble of its own', () => {
    const entries = [run('2024-03-05', { holds: [hold('returns_file', ['orders', 'stock', 'report']), hold('returns_seen', ['stock', 'report'])] }), run('2024-03-06', { holds: [hold('returns_seen', ['stock', 'report'])] })];
    const rows = healthOf(tierRows(CROSS), DAYS, entries, () => MANIFEST);
    const seen = rows.find((r) => r.id === 'returns_seen')!;
    expect(seen.held).toEqual(['2024-03-05', '2024-03-06']);
    // Mar 5 the file held too: the step followed it. Mar 6 it held alone: trouble of its own.
    expect(seen.own).toEqual(['2024-03-06']);
    expect(followsFiles(seen)).toBe(false);
    expect(rows.find((r) => r.id === 'returns_file')!.held).toEqual(['2024-03-05']);
  });

  it('gives a document that reads no flow the rows it had', () => {
    const { flows: _flows, ...plain } = CROSS;
    expect(tierRows(plain).map(({ flow: _flow, ...r }) => r)).toEqual(healthRows(plain));
    expect(new Set(tierRows(plain).map((r) => r.flow))).toEqual(new Set(['']));
  });
});
