/**
 * The register (ADR 0027 §2 and §9, core/register.ts): a flow's change sets as dated records. What each did in words,
 * its tense for the day read from, how it was said, each thing's life as spans over the days, the change a thing has
 * stood by since, and what was coming on a day.
 */
import { describe, expect, it } from 'vitest';
import type { ChangeSet, FlowDocument, RuleEdit } from '../src/core/document.js';
import { comingOn, dayAfter, dayBefore, howSaid, livesOf, registerOf, shortOf, sinceOf, subjectOf, tenseSaid } from '../src/core/register.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const change = (id: string, from: string, recorded: string, edits: RuleEdit[], until?: string): ChangeSet => ({ id, from, ...(until ? { until } : {}), recorded, by: 'owner', why: `why ${id}`, edits });
const latency = (max: number): RuleEdit => ({ op: 'setRule', rule: { id: 'latency_ms_range', file: 'auth', column: 'latency_ms', kind: 'range', min: 0, max, action: 'hold' } });
const countryOff: RuleEdit = { op: 'switchRule', file: 'auth', id: 'country_required', on: false };

// Larkspur's story in small, on the sign-ins: a rule said on Fri 15 for Mon 18, and a correction recorded on Mon 25,
// back-dated to Fri 1.
const story = [change('band', '2024-03-18', '2024-03-15T16:30:00Z', [latency(20_000)]), change('hold', '2024-03-01', '2024-03-25T09:40:00Z', [countryOff])];
const march = Array.from({ length: 31 }, (_, i) => `2024-03-${String(i + 1).padStart(2, '0')}`);

async function flow(changes: ChangeSet[] = story): Promise<FlowDocument> {
  return { ...((await loadFlowDir(signinsDir)) as FlowDocument), changes };
}

describe('the register', () => {
  it('lists every change set with what it did, its tense and how it was said, newest first', async () => {
    const { entries, later } = registerOf(await flow(), { today: '2024-03-31' });
    expect(later).toBe(0);
    expect(entries.map((e) => [e.change.id, e.tense, e.how, e.lead, e.recordedDay])).toEqual([
      ['band', 'in force', 'ahead', 3, '2024-03-15'],
      ['hold', 'in force', 'back', -24, '2024-03-25'],
    ]);
    // Each edit is said as the app recorded it when it was made, and none of the two is passed over.
    expect(entries.every((e) => e.said.length === 1 && e.edits.every((x) => x.said !== null))).toBe(true);
    expect(entries[0]!.said[0]).toMatch(/latency/i);
    expect(entries.map(howSaid)).toEqual(['said 3 days ahead', 'back-dated 24 days']);
  });

  it('reads as known at a moment: what was recorded later is not listed, and what starts later is coming', async () => {
    const { entries, later } = registerOf(await flow(), { today: '2024-03-16', asOf: '2024-03-16T23:59:59Z' });
    expect(later).toBe(1);
    expect(entries.map((e) => [e.change.id, e.tense])).toEqual([['band', 'coming']]);
    expect(tenseSaid(entries[0]!.tense)).toBe('coming');
    // Nothing was known before it was said.
    expect(registerOf(await flow(), { today: '2024-03-14', asOf: '2024-03-14T12:00:00Z' })).toEqual({ entries: [], later: 2 });
  });

  it('puts what is coming on top, the soonest first, and says a change is over after its last day', async () => {
    const doc = await flow([
      ...story,
      change('later', '2024-04-08', '2024-03-28T10:00:00Z', [latency(5_000)]),
      change('soon', '2024-04-01', '2024-03-29T10:00:00Z', [latency(15_000)]),
      change('one-day', '2024-03-12', '2024-03-12T08:00:00Z', [latency(30_000)], '2024-03-12'),
    ]);
    const { entries } = registerOf(doc, { today: '2024-03-31' });
    expect(entries.map((e) => [e.change.id, e.tense])).toEqual([
      ['soon', 'coming'],
      ['later', 'coming'],
      ['band', 'in force'],
      ['one-day', 'ended'],
      ['hold', 'in force'],
    ]);
    expect(howSaid(entries.find((e) => e.change.id === 'one-day')!)).toBe('said on its day');
  });

  it('says an edit that changes nothing on its first day is passed over', async () => {
    // The same rule twice: the second leaves the rules as the first made them.
    const doc = await flow([change('a', '2024-03-04', '2024-03-04T08:00:00Z', [latency(20_000)]), change('b', '2024-03-05', '2024-03-05T08:00:00Z', [latency(20_000)])]);
    const { entries } = registerOf(doc, { today: '2024-03-31' });
    expect(entries.find((e) => e.change.id === 'b')!.said).toEqual([]);
    expect(entries.find((e) => e.change.id === 'a')!.said).toHaveLength(1);
  });
});

describe('each thing’s life', () => {
  it('is a row of spans: as shipped, then the change it stands by, a later one giving way after its last day', async () => {
    const doc = await flow([...story, change('one-day', '2024-03-12', '2024-03-12T08:00:00Z', [latency(30_000)], '2024-03-12')]);
    const { entries } = registerOf(doc, { today: '2024-03-31' });
    const lives = livesOf(entries, march, '2024-03-31');
    expect(lives.map((l) => l.subject.key)).toEqual(['rule:auth:latency_ms_range', 'rule:auth:country_required']);
    expect(lives[0]!.spans.map((s) => [s.from, s.until, s.change, s.short])).toEqual([
      ['2024-03-01', '2024-03-11', null, 'as shipped'],
      ['2024-03-12', '2024-03-12', 'one-day', 'set'],
      ['2024-03-13', '2024-03-17', null, 'as shipped'],
      ['2024-03-18', '2024-03-31', 'band', 'set'],
    ]);
    // The correction recorded on Mon 25 stands from Fri 1, as now known.
    expect(lives[1]!.spans.map((s) => [s.from, s.until, s.change, s.short])).toEqual([['2024-03-01', '2024-03-31', 'hold', 'off']]);
    expect(lives[1]!.said).toEqual([{ day: '2024-03-25', change: 'hold', how: 'back' }]);
    expect(lives.every((l) => l.spans.every((s) => !s.coming))).toBe(true);
  });

  it('marks a span that starts after the day read from as coming', async () => {
    const { entries } = registerOf(await flow(), { today: '2024-03-16', asOf: '2024-03-16T23:59:59Z' });
    const [life] = livesOf(entries, march.slice(0, 21), '2024-03-16');
    // What stands today goes on standing until the change starts: only the change's own span is coming.
    expect(life!.spans.map((s) => [s.from, s.until, s.change, s.coming])).toEqual([
      ['2024-03-01', '2024-03-17', null, false],
      ['2024-03-18', '2024-03-21', 'band', true],
    ]);
  });

  it('says the change a thing has stood by since, and none where it stands as shipped', async () => {
    const { entries } = registerOf(await flow(), { today: '2024-03-31' });
    expect(sinceOf(entries, 'rule:auth:latency_ms_range', '2024-03-20')?.change.id).toBe('band');
    expect(sinceOf(entries, 'rule:auth:latency_ms_range', '2024-03-10')).toBeNull();
    expect(sinceOf(entries, 'RULE:auth:country_required', '2024-03-10')?.change.id).toBe('hold');
    expect(sinceOf(entries, 'rule:auth:nothing', '2024-03-20')).toBeNull();
  });
});

describe('what was coming on a day', () => {
  it('is what was recorded by its end and starts later', async () => {
    const doc = await flow();
    expect(comingOn(doc, '2024-03-14').map((c) => c.id)).toEqual([]);
    expect(comingOn(doc, '2024-03-15').map((c) => c.id)).toEqual(['band']);
    expect(comingOn(doc, '2024-03-17').map((c) => c.id)).toEqual(['band']);
    expect(comingOn(doc, '2024-03-18').map((c) => c.id)).toEqual([]);
    // Read as known earlier in the day it was said, it wasn't known yet.
    expect(comingOn(doc, '2024-03-15', '2024-03-15T09:00:00Z')).toEqual([]);
  });
});

describe('what an edit is about', () => {
  it('gives two edits of one thing one key, and a word or two for what it is left as', () => {
    const edits: RuleEdit[] = [
      latency(1),
      { op: 'removeRule', file: 'auth', id: 'latency_ms_range' },
      { op: 'switchRule', file: 'auth', id: 'latency_ms_range', on: true },
      { op: 'setCheck', node: 'auth', check: 'values', mode: 'hold' },
      { op: 'acceptBand', source: 'waf', band: { column: 'status', value: 'fail', share: [0, 0.1] } },
      { op: 'nameColumn', file: 'auth', column: 'ip', change: { title: 'Address' } },
      { op: 'mapColumn', file: 'auth', column: 'app_id', from: 'AppID' },
      { op: 'declareValues', file: 'auth', column: 'result', values: ['ok', 'fail'] },
      { op: 'declareKey', file: 'auth', column: 'event_id' },
      { op: 'useVersion', changes: [] },
    ];
    expect(edits.map((e) => [subjectOf(e).key, subjectOf(e).lane, shortOf(e)])).toEqual([
      ['rule:auth:latency_ms_range', 'check', 'set'],
      ['rule:auth:latency_ms_range', 'check', 'removed'],
      ['rule:auth:latency_ms_range', 'check', 'on'],
      ['check:auth:values', 'check', 'hold'],
      ['band:waf:status:fail', 'check', '0–10%'],
      ['name:auth:ip', 'is', 'Address'],
      ['read:auth:app_id', 'is', 'read as AppID'],
      ['values:auth:result', 'is', '2 values'],
      ['key:auth', 'is', 'key event_id'],
      ['version', 'check', 'a version'],
    ]);
  });

  it('counts days by the calendar', () => {
    expect(dayAfter('2024-02-29')).toBe('2024-03-01');
    expect(dayBefore('2024-03-01')).toBe('2024-02-29');
  });
});

describe('the register drawn (viz.ts, ADR 0027 §9)', () => {
  it('draws each row’s spans by tense, the day a change was said, the decisions and today’s line', async () => {
    const { registerLanes } = await import('../src/app/viz.js');
    const days = march.slice(10, 24);
    const svg = registerLanes({
      days,
      today: '2024-03-16',
      pick: '2024-03-12',
      aria: 'The ontology’s changes over 14 days',
      groups: [
        { name: 'What we check', rows: [{ label: 'waf · status = fail, its share', spans: [{ from: '2024-03-11', until: '2024-03-17', kind: 'was', short: 'as shipped' }, { from: '2024-03-18', until: '2024-03-24', kind: 'next', short: '0–10%', change: 'band', title: 'a <band>' }, { from: '2024-03-11', until: '2024-03-14', kind: 'then', change: 'band' }], marks: [{ day: '2024-03-15', kind: 'said', change: 'band' }] }] },
        { name: 'What we decided', rows: [{ label: 'Days decided', spans: [], marks: [{ day: '2024-03-12', kind: 'decided' }, { day: '2024-03-16', kind: 'back' }, { day: '2024-04-02', kind: 'decided' }] }] },
      ],
    });
    expect(svg).toContain('aria-label="The ontology’s changes over 14 days"');
    expect(svg.match(/class="rg-was"/g)).toHaveLength(1);
    expect(svg.match(/class="rg-next"/g)).toHaveLength(1);
    expect(svg.match(/class="rg-then"/g)).toHaveLength(1);
    expect(svg).toContain('data-change="band"');
    expect(svg.match(/class="rg-said"/g)).toHaveLength(1);
    // A mark on a day that isn't drawn is left out.
    expect(svg.match(/class="rg-decided"/g)).toHaveLength(1);
    expect(svg.match(/class="rg-back"/g)).toHaveLength(1);
    expect(svg).toContain('class="rg-now"');
    expect(svg).toContain('class="rg-pick"');
    expect(svg).toContain('WHAT WE CHECK');
    // What it is given is escaped, and no number is broken.
    expect(svg).toContain('a &lt;band&gt;');
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('draws no line for today on the last day drawn, and marks a chart where the rules changed', async () => {
    const { registerLanes, scoreTrend } = await import('../src/app/viz.js');
    expect(registerLanes({ days: march, today: '2024-03-31', groups: [], aria: 'x' })).not.toContain('rg-now');
    const svg = scoreTrend({ days: march, points: march.map((day, i) => ({ day, score: 93 - i / 30, coverage: 95 })), aria: 'x', marks: [{ day: '2024-03-18', label: 'Mon 18: a <rule>' }, { day: '2024-05-01', label: 'not drawn' }] });
    expect(svg.match(/class="chg-mark"/g)).toHaveLength(1);
    expect(svg).toContain('Mon 18: a &lt;rule&gt;');
    expect(svg).not.toMatch(/NaN|undefined/);
  });
});
