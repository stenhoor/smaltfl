/**
 * The month at a glance (ADR 0024, core/overview.ts): a day's outcome from what the calendar says of it; a month counted
 * and said in a sentence, and set beside the month before; each dataset's days, the worst over a day's runs and the
 * worst rows first; the score read as steady, up or down by a rule, and what moved between two days.
 */
import { describe, expect, it } from 'vitest';
import { againstSaid, againstWay, countSaid, findingsOf, followsFiles, headlineOf, healthOf, healthRows, healthSaid, HOW_WORD, monthsOf, moversOf, offDays, OUTCOME_WORD, outcomeOf, outcomeSaid, pointsSaid, scoreRead, readSaid, STEADY, summaryOf, worstFirst, type DayOutcome, type Outcome } from '../src/core/overview.js';
import type { LogEntry } from '../src/core/log.js';
import type { RunManifest } from '../src/core/manifest.js';

const entry = (seq: number, at: string, about: Record<string, unknown>, as = 'build', kind = 'run'): LogEntry => ({
  smaltflLog: 1, origin: 'build:larkspur', seq, kind, at, by: { card: null, as }, about: about as LogEntry['about'], reason: null, amends: null, nonce: '0'.repeat(32),
} as unknown as LogEntry);
const hold = (origin: string, said: string, by = 'checks') => ({ by, node: 1, origin, said, reaches: ['posture'] });
const node = (origin: string, extra: Record<string, unknown> = {}) => ({ node: 0, origin, op: 'table', key: `k-${origin}`, status: 'built', content: `c-${origin}`, rows: 10, ...extra });
const manifest = (nodes: unknown[]) => ({ plan: 'p1', nodes } as unknown as RunManifest);

describe('a day’s outcome', () => {
  it('is what the checks found, then what was decided: one of a few', () => {
    const of = (state: string, decided: string | null = null, corrected = 0, restated = false) => outcomeOf({ state, decided, corrected, restated } as never);
    expect(of('published')).toEqual({ outcome: 'normal', how: null });
    expect(of('unusual')).toEqual({ outcome: 'unusual', how: null });
    expect(of('unlearned')).toEqual({ outcome: 'unjudged', how: null });
    expect(of('paused')).toEqual({ outcome: 'waiting', how: null });
    expect(of('paused', 'waiting')).toEqual({ outcome: 'waiting', how: null });
    expect(of('paused', 'asis')).toEqual({ outcome: 'decided', how: 'asis' });
    expect(of('paused', 'fill')).toEqual({ outcome: 'decided', how: 'fill' });
    expect(of('paused', 'complete')).toEqual({ outcome: 'decided', how: 'complete' });
    expect(of('paused', 'accepted')).toEqual({ outcome: 'decided', how: 'accepted' });
    expect(of('paused', 'dont')).toEqual({ outcome: 'kept', how: null });
    expect(of('failed')).toEqual({ outcome: 'failed', how: null });
    expect(of('notArrived')).toEqual({ outcome: 'notArrived', how: null });
    expect(of('notRun')).toEqual({ outcome: 'notRun', how: null });
  });

  it('a day sent again and published is corrected, whatever its first files were decided as; a later file still waiting waits', () => {
    expect(outcomeOf({ state: 'published', decided: null, corrected: 2 })).toEqual({ outcome: 'decided', how: 'corrected' });
    expect(outcomeOf({ state: 'paused', decided: 'waiting', corrected: 0 })).toEqual({ outcome: 'waiting', how: null });
  });

  it('a day restated under rules changed since is published or kept back as its restatement left it', () => {
    expect(outcomeOf({ state: 'published', decided: null, corrected: 2, restated: true })).toEqual({ outcome: 'decided', how: 'restated' });
    expect(outcomeOf({ state: 'paused', decided: 'dont', corrected: 2, restated: true })).toEqual({ outcome: 'kept', how: 'restated' });
  });

  it('has a word and a line for each, and a word for each way out', () => {
    const outcomes: Outcome[] = ['normal', 'unusual', 'unjudged', 'waiting', 'decided', 'kept', 'failed', 'notArrived', 'notRun'];
    for (const o of outcomes) {
      expect(OUTCOME_WORD[o].length).toBeGreaterThan(2);
      expect(outcomeSaid(o)).toMatch(/^[A-Z]/);
    }
    expect(outcomeSaid('decided', 'fill')).toBe('Paused, then published filled from another day');
    expect(outcomeSaid('decided', 'corrected')).toBe('Corrected: a file sent again, and published');
    expect(outcomeSaid('kept', 'restated')).toBe('Restated under rules changed since: not published');
    expect(outcomeSaid('waiting')).toBe('Paused: it waits for a decision');
    expect(Object.values(HOW_WORD).every((w) => w.length <= 10)).toBe(true);
  });
});

const days = (month: string, outcomes: (Outcome | [Outcome, DayOutcome['how']])[]): DayOutcome[] =>
  outcomes.map((o, i) => ({ day: `${month}-${String(i + 1).padStart(2, '0')}`, outcome: Array.isArray(o) ? o[0] : o, how: Array.isArray(o) ? o[1] : null }));

describe('a month, counted and said', () => {
  const feb = days('2024-02', [...Array<Outcome>(26).fill('normal'), 'unusual', 'unusual', ['decided', 'corrected']]);
  const mar = days('2024-03', [...Array<Outcome>(22).fill('normal'), 'unusual', 'unusual', 'unusual', 'unjudged', ['decided', 'asis'], ['decided', 'fill'], ['decided', 'corrected'], 'kept', 'waiting']);

  it('names the months the days span', () => {
    expect(monthsOf([...feb, ...mar].map((d) => d.day))).toEqual(['2024-02', '2024-03']);
    expect(monthsOf([])).toEqual([]);
  });

  it('counts a month’s own days by outcome: on their own, paused, needing a look', () => {
    const s = summaryOf('2024-03', [...feb, ...mar]);
    expect(s).toMatchObject({ month: '2024-03', days: 31, arrived: 31, normal: 22, unusual: 3, unjudged: 1, decided: 3, kept: 1, waiting: 1, failed: 0, auto: 26, paused: 5, attention: 8 });
    expect(s.how).toEqual({ asis: 1, fill: 1, corrected: 1 });
    expect(s.waits).toEqual(['2024-03-31']);
    expect(summaryOf('2024-02', [...feb, ...mar])).toMatchObject({ days: 29, arrived: 29, auto: 28, paused: 1, attention: 3 });
  });

  it('says the month, the conclusion first', () => {
    expect(headlineOf(summaryOf('2024-03', mar))).toBe('26 of 31 days went out on their own, 3 with something unusual. 5 were paused for a decision: 3 published by a decision, 1 kept back and 1 still waits.');
    expect(headlineOf(summaryOf('2024-02', feb))).toBe('28 of 29 days went out on their own, 2 with something unusual. 1 was paused for a decision: 1 published by a decision.');
    expect(headlineOf(summaryOf('2024-01', days('2024-01', Array<Outcome>(31).fill('normal'))))).toBe('Every day went out on its own: 31 days, none with anything unusual.');
    expect(headlineOf(summaryOf('2024-01', days('2024-01', [...Array<Outcome>(30).fill('normal'), 'unusual'])))).toBe('Every day went out on its own, 1 with something to look at.');
  });

  it('says a month as known on a past moment, and one with nothing yet', () => {
    const half = days('2024-03', [...Array<Outcome>(14).fill('normal'), 'waiting', ...Array<Outcome>(16).fill('notArrived')]);
    expect(summaryOf('2024-03', half)).toMatchObject({ days: 31, arrived: 15, waiting: 1 });
    expect(headlineOf(summaryOf('2024-03', half))).toBe('14 of 15 days went out on their own. 1 was paused for a decision: 1 still waits. 16 days had not arrived.');
    expect(headlineOf(summaryOf('2024-03', days('2024-03', Array<Outcome>(3).fill('notArrived'))))).toBe('No day has arrived yet.');
    expect(headlineOf(summaryOf('2024-04', mar))).toBe('No days.');
    expect(headlineOf(summaryOf('2024-03', days('2024-03', ['normal', 'failed'])))).toBe('1 of 2 days went out on its own. 1 run failed.');
  });

  it('sets a month beside the one before it, each count with its own total', () => {
    const name = (m: string) => (m === '2024-02' ? 'February' : m);
    const [a, b] = [summaryOf('2024-02', feb), summaryOf('2024-03', mar)];
    expect(againstSaid(a, b, name)).toBe('8 of 31 days needed a look, more than February (3 of 29).');
    expect(againstWay(a, b)).toBe('worse');
    expect(againstWay(b, a)).toBe('better');
    expect(againstSaid(b, a, () => 'March')).toBe('3 of 29 days needed a look, fewer than March (8 of 31).');
    expect(againstWay(a, a)).toBe('same');
    expect(againstSaid(a, a, name)).toBe('3 of 29 days needed a look, about the same as February (3 of 29).');
    expect(againstSaid(null, b, name)).toBeNull();
    expect(againstWay(null, b)).toBeNull();
    expect(againstSaid(summaryOf('2024-01', []), b, name)).toBeNull();
  });
});

describe('what a run said of its day', () => {
  it('lists what held it first, then what was unusual, then what wasn’t judged, each once', () => {
    const about = {
      holds: [hold('backup_jobs', 'Last_state COMPLETED: 33%', 'story'), hold('backup_jobs', 'Last_state COMPLETED: 33%', 'story'), hold('backup_jobs', 'a later file for its day: it waits for a decision', 'correction'), hold('org_chain', 'expectations failed')],
      claims: [
        { source: 'backup_jobs', state: 'wrong', head: 'Last_state COMPLETED: 33%' },
        { source: 'findings', state: 'unusual', head: 'New severity values' },
        { source: 'tls', state: 'calm', head: 'A normal Monday' },
        { source: 'waf', state: 'unlearned', head: 'Not judged yet' },
      ],
    };
    expect(findingsOf(about as never)).toEqual([
      { origin: 'backup_jobs', said: 'Last_state COMPLETED: 33%', level: 'held' },
      { origin: 'org_chain', said: 'expectations failed', level: 'held' },
      { origin: 'findings', said: 'New severity values', level: 'unusual' },
      { origin: 'waf', said: 'Not judged yet', level: 'unjudged' },
    ]);
    expect(findingsOf({})).toEqual([]);
    expect(findingsOf({ holds: [hold('x', 'restated', 'restated'), hold('x', 'what-if', 'what-if')] } as never)).toEqual([]);
  });
});

describe('the month’s rows', () => {
  it('a file is its source with the steps that read it alone; every other step is a row of its own', () => {
    const doc = {
      sources: [{ id: 'tls' }, { id: 'apps' }, { id: 'unread' }],
      steps: [
        { id: 'tls_filled', inputs: ['tls'] },
        { id: 'tls_checked', inputs: ['tls_filled'] },
        { id: 'apps_checked', inputs: ['apps'] },
        { id: 'posture', inputs: ['tls_checked', 'apps_checked'] },
        { id: 'scores', inputs: ['posture'] },
      ],
    };
    expect(healthRows(doc)).toEqual([
      { id: 'tls', label: 'tls', kind: 'file', origins: ['tls', 'tls_filled', 'tls_checked'] },
      { id: 'apps', label: 'apps', kind: 'file', origins: ['apps', 'apps_checked'] },
      { id: 'unread', label: 'unread', kind: 'file', origins: ['unread'] },
      { id: 'posture', label: 'posture', kind: 'step', origins: ['posture'], reads: ['tls', 'apps'] },
      { id: 'scores', label: 'scores', kind: 'step', origins: ['scores'], reads: ['tls', 'apps'] },
    ]);
    expect(healthRows({ sources: [], steps: [] })).toEqual([]);
  });

  it('follows names whatever their case, and a step that reads itself stops', () => {
    const rows = healthRows({ sources: [{ id: 'Trips' }], steps: [{ id: 'valid', inputs: ['trips'] }, { id: 'loop', inputs: ['loop'] }] });
    expect(rows.map((r) => [r.id, r.kind, r.origins])).toEqual([['Trips', 'file', ['Trips', 'valid']], ['loop', 'step', ['loop']]]);
    expect(rows[1]!.reads).toEqual([]);
  });
});

describe('each dataset’s days', () => {
  const D = ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04'];
  const all = manifest([node('tls'), node('tls_checked'), node('mfa'), node('posture')]);
  const entries: LogEntry[] = [
    entry(0, '2024-03-01T06:00:00Z', { day: D[0], outcome: 'ok', manifest: 'm', claims: [{ source: 'tls', state: 'calm' }, { source: 'mfa', state: 'unlearned' }] }),
    // Sat 2: tls holds the day; sent again that afternoon, the corrected run holds only as a correction.
    entry(1, '2024-03-02T06:00:00Z', { day: D[1], outcome: 'held', manifest: 'm', holds: [hold('tls_checked', 'expectations failed')], inputs: { flow: 'f', parameters: {}, files: { tls: 'a' } } }),
    entry(2, '2024-03-02T14:00:00Z', { day: D[1], outcome: 'held', manifest: 'm', holds: [hold('tls', 'a later file', 'correction')], inputs: { flow: 'f', parameters: {}, files: { tls: 'b' } }, correction: { sources: ['tls'] } }),
    entry(3, '2024-03-03T06:00:00Z', { day: D[2], outcome: 'ok', manifest: 'm', claims: [{ source: 'posture', state: 'unusual', head: 'x' }] }),
    entry(4, '2024-03-04T06:00:00Z', { run: null, load: D[3], outcome: 'failed', error: 'boom' }),
  ];
  const rows = [
    { id: 'tls', label: 'tls', kind: 'file' as const, origins: ['tls', 'tls_checked'] },
    { id: 'mfa', label: 'mfa', kind: 'file' as const, origins: ['mfa'] },
    { id: 'posture', label: 'posture', kind: 'step' as const, origins: ['posture'] },
    { id: 'ghost', label: 'ghost', kind: 'step' as const, origins: ['ghost'] },
  ];
  const health = healthOf(rows, D, entries, () => all);

  it('a cell is the worst over the day’s runs: a file that broke and was sent again still shows where it broke', () => {
    expect(health[0]!.cells).toEqual(['ok', 'held', 'ok', null]);
    expect(health[0]!.held).toEqual(['2024-03-02']);
    expect(health[1]!.cells).toEqual(['unlearned', 'ok', 'ok', null]);
    expect(health[2]!).toMatchObject({ cells: ['ok', 'ok', 'unusual', null], unusual: ['2024-03-03'], held: [], kind: 'step' });
    expect(health[3]!.cells).toEqual(['absent', 'absent', 'absent', null]);
  });

  it('a step’s own days are those no file it reads accounts for: caught inside the flow, not at the door', () => {
    const day = (n: number) => `2024-03-0${n}`;
    const m = manifest([node('tls'), node('mfa'), node('posture'), node('scores')]);
    const es: LogEntry[] = [
      // Fri 1: tls holds, and posture (which reads it) holds with it. Sat 2: posture holds, no file does.
      entry(0, `${day(1)}T06:00:00Z`, { day: day(1), outcome: 'held', manifest: 'm', holds: [hold('tls', 'Almost no rows', 'story'), hold('posture', 'expectations failed')] }),
      entry(1, `${day(2)}T06:00:00Z`, { day: day(2), outcome: 'held', manifest: 'm', holds: [hold('posture', 'expectations failed')] }),
      // Sun 3: mfa is unusual, and so is scores, which reads it. Mon 4: scores is unusual alone. Tue 5: mfa is only
      // unusual, and posture holds: the file's own checks let it through.
      entry(2, `${day(3)}T06:00:00Z`, { day: day(3), outcome: 'ok', manifest: 'm', claims: [{ source: 'mfa', state: 'unusual' }, { source: 'scores', state: 'unusual' }] }),
      entry(3, `${day(4)}T06:00:00Z`, { day: day(4), outcome: 'ok', manifest: 'm', claims: [{ source: 'scores', state: 'unusual' }] }),
      entry(4, `${day(5)}T06:00:00Z`, { day: day(5), outcome: 'held', manifest: 'm', holds: [hold('posture', 'expectations failed')], claims: [{ source: 'mfa', state: 'unusual' }] }),
    ];
    const defs = [
      { id: 'tls', label: 'tls', kind: 'file' as const, origins: ['tls'] },
      { id: 'mfa', label: 'mfa', kind: 'file' as const, origins: ['mfa'] },
      { id: 'posture', label: 'posture', kind: 'step' as const, origins: ['posture'], reads: ['tls', 'mfa'] },
      { id: 'scores', label: 'scores', kind: 'step' as const, origins: ['scores'], reads: ['TLS', 'MFA'] },
      { id: 'echo', label: 'echo', kind: 'step' as const, origins: ['posture'], reads: ['tls'] },
    ];
    const [tls, mfa, posture, scores, echo] = healthOf(defs, [1, 2, 3, 4, 5].map(day), es, () => m);
    expect(tls!.own).toEqual([day(1)]);
    expect(mfa!.own).toEqual([day(3), day(5)]);
    expect(posture!).toMatchObject({ held: [day(1), day(2), day(5)], own: [day(2), day(5)] });
    expect(scores!).toMatchObject({ unusual: [day(3), day(4)], own: [day(4)] });
    expect([tls, mfa, posture, scores].map((r) => followsFiles(r!))).toEqual([false, false, false, false]);
    // A step that only ever holds where its file does follows it.
    const only = healthOf(defs, [day(1)], es, () => m);
    expect(only[4]!).toMatchObject({ held: [day(1)], own: [] });
    expect(followsFiles(only[4]!)).toBe(true);
    expect(echo!.own).toEqual([day(2), day(5)]);
  });

  it('as known on a moment, reads only the runs recorded by then', () => {
    expect(healthOf(rows, D, entries, () => all, '2024-03-01T23:59:59Z')[0]!.cells).toEqual(['ok', null, null, null]);
  });

  it('orders the worst first: a day still waiting, then the most days held, then the most unusual, then by name', () => {
    expect(worstFirst(health).map((r) => r.id)).toEqual(['tls', 'posture', 'ghost', 'mfa']);
    const two = [{ label: 'b', held: ['d1'], unusual: [] }, { label: 'a', held: ['d2', 'd3'], unusual: [] }, { label: 'c', held: ['d9'], unusual: ['d1'] }];
    expect(worstFirst(two).map((r) => r.label)).toEqual(['a', 'c', 'b']);
    expect(worstFirst(two, new Set(['d1'])).map((r) => r.label)).toEqual(['b', 'a', 'c']);
    expect(health.map(offDays)).toEqual([1, 0, 1, 0]);
  });

  it('says a row’s days in words', () => {
    const name = (d: string) => `Mar ${Number(d.slice(8))}`;
    expect(healthSaid(health[0]!, name)).toBe('held on Mar 2');
    expect(healthSaid(health[1]!, name)).toBe('fine; not judged on Mar 1');
    expect(healthSaid(health[2]!, name)).toBe('unusual on Mar 3');
    expect(healthSaid(health[3]!, name)).toBe('not built');
    expect(healthSaid({ held: ['2024-03-02', '2024-03-05', '2024-03-07', '2024-03-09', '2024-03-11'], unusual: ['2024-03-01', '2024-03-03'], unjudged: [], cells: ['ok'] }, name)).toBe('held 5 days (Mar 2, Mar 5, Mar 7 and 2 more) · unusual 2 days (Mar 1, Mar 3)');
    expect(healthSaid({ held: [], unusual: [], unjudged: [], cells: ['ok', 'ok'] }, name)).toBe('every day fine');
  });
});

describe('the score, read', () => {
  const name = (d: string) => d.slice(5);
  const pts = (...xs: (number | null)[]) => xs.map((score, i) => ({ day: `2024-03-${String(i + 1).padStart(2, '0')}`, score }));

  it('is steady when its ends are under half a point apart, whatever it did between', () => {
    const r = scoreRead(pts(93.4, 93.3, null, 93.0, 93.6, 93.8))!;
    expect(r).toMatchObject({ first: { day: '2024-03-01', score: 93.4 }, last: { day: '2024-03-06', score: 93.8 }, low: 93.0, high: 93.8, days: 5, verdict: 'steady' });
    expect(r.delta).toBeCloseTo(0.4, 5);
    expect(r.biggest).toMatchObject({ day: '2024-03-05', from: '2024-03-04' });
    expect(r.biggest!.delta).toBeCloseTo(0.6, 5);
    expect(readSaid(r, name)).toBe('Steady: between 93.0 and 93.8 over 5 days published, +0.4 from 03-01 to 03-06.');
    expect(STEADY).toBe(0.5);
  });

  it('is up or down past half a point, said with both ends', () => {
    expect(readSaid(scoreRead(pts(93.6, 93.0, 92.0))!, name)).toBe('Down 1.6 points from 03-01 to 03-03: 93.6 to 92.0, over 3 days published.');
    expect(scoreRead(pts(90, 90.5))!.verdict).toBe('up');
    expect(scoreRead(pts(90, 89.51))!.verdict).toBe('steady');
  });

  it('says one day as one day, and nothing as nothing', () => {
    const one = scoreRead(pts(null, 91.2))!;
    expect(one).toMatchObject({ days: 1, biggest: null, verdict: 'steady' });
    expect(readSaid(one, name)).toBe('One day published so far: 91.2 on 03-02.');
    expect(scoreRead(pts(null, null))).toBeNull();
    expect(scoreRead([])).toBeNull();
  });

  it('says a change in points and a count’s change with a true minus', () => {
    expect([pointsSaid(0.44), pointsSaid(-1.6), pointsSaid(0.04), pointsSaid(-0.04)]).toEqual(['+0.4', '−1.6', '0.0', '0.0']);
    expect([countSaid(48), countSaid(-1041), countSaid(0)]).toEqual(['+48', '−1,041', '0']);
  });

  it('names what moved between two days, the biggest change first, the unchanged left out', () => {
    const from = { tls: 88, mfa: 40, backup: 52, vuln_sla: 412 };
    const to = { tls: 136, mfa: 40, backup: 40, vuln_sla: 371, sbom: 3 };
    expect(moversOf(from, to)).toEqual([
      { id: 'tls', from: 88, to: 136, delta: 48 },
      { id: 'vuln_sla', from: 412, to: 371, delta: -41 },
      { id: 'backup', from: 52, to: 40, delta: -12 },
      { id: 'sbom', from: 0, to: 3, delta: 3 },
    ]);
    expect(moversOf(from, to, 2).map((m) => m.id)).toEqual(['tls', 'vuln_sla']);
    expect(moversOf(from, from)).toEqual([]);
  });
});
