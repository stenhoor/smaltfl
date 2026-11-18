/**
 * What an event excuses (ADR 0027 §6, Q-267, Q-271): what the checks learned to expect of a dataset it names, while it
 * lasts. A finding it excuses is told as expected and holds nothing; a value the ontology marks bad and a rule someone
 * wrote are never excused; the days it covers are set aside from what those series are learned from; a claim names what
 * it was excused by, and an event written after a run excuses nothing of it. On the sign-in log's history: the two days
 * an MFA provider was out (May 15 and 16, 2024) and the credential-stuffing burst (March 12).
 */
import { describe, expect, it } from 'vitest';
import { plusDays } from '../src/core/calendar.js';
import { eventsProblems, excusesFor, EXCUSABLE, isClaimExcuses, type ClaimExcuse, type FlowEvent } from '../src/core/events.js';
import { HistoryRanges } from '../src/core/history.js';
import { asideBefore, claimHolds, flowStory, rangesFor } from '../src/core/hold.js';
import { excusedBy, type Finding } from '../src/core/news.js';
import { timelineOf } from '../src/core/timeline.js';
import { PLANTED, securityDoc, securityHistory } from './fixtures/security.js';

const doc = securityDoc();
const file = securityHistory({ incidents: true });
const ranges = (aside?: ReturnType<typeof asideBefore>) => new HistoryRanges(file, { ...rangesFor(doc, 'auth'), ...(aside?.length ? { aside } : {}) });
const h = ranges();
const [OUT1, OUT2] = PLANTED.mfa;
const event = (x: Partial<FlowEvent> = {}): FlowEvent => ({ id: 'mfa-maintenance', name: 'MFA provider maintenance', from: OUT1, until: OUT2, kind: 'incident', about: ['auth'], recorded: `${plusDays(OUT1, -1)}T16:00:00Z`, by: 'ciso', excuses: [{ dataset: 'auth', check: 'shares', column: 'method' }], ...x });
const MFA: ClaimExcuse = { event: 'mfa-maintenance', name: 'MFA provider maintenance', from: OUT1, until: OUT2, check: 'shares', column: 'method' };
/** The outage took a quarter of the sign-ins with it: the event excuses the amount beside the method's mix. */
const FEWER: ClaimExcuse = { event: 'mfa-maintenance', name: 'MFA provider maintenance', from: OUT1, until: OUT2, check: 'amount' };
const BOTH = [FEWER, MFA];
const told = (day: string, excuses?: readonly ClaimExcuse[], r = h) => flowStory(r, day, doc, 'auth', undefined, undefined, undefined, excuses);
const findingsOf = (s: ReturnType<typeof told>): Finding[] => (s.findings as unknown as ({ finding?: Finding } & Finding)[]).map((t) => t.finding ?? t);

describe('an event that says what it excuses', () => {
  it('names a learned check of a dataset it is about, and a column for a check of columns', () => {
    expect(eventsProblems([event()], { datasets: ['auth'] })).toEqual([]);
    expect(eventsProblems([event({ excuses: [{ dataset: 'auth', check: 'amount' }, { dataset: 'auth', check: 'pairs' }, { dataset: 'auth', check: 'blanks', column: 'user' }, { dataset: 'auth', check: 'shape', column: 'latency_ms' }] })])).toEqual([]);
    expect(EXCUSABLE).toEqual(['amount', 'shares', 'pairs', 'blanks', 'shape']);
  });

  it('is refused where it excuses a rule someone wrote, a dataset it isn’t about, or the amount of a column', () => {
    const bad = (excuses: unknown, more: Partial<FlowEvent> = {}) => eventsProblems([{ ...event(more), excuses }]);
    expect(bad([{ dataset: 'auth', check: 'rules' }])).toEqual(['event 1, excuse 1: its check is one learned from the history (amount, shares, pairs, blanks, shape): a rule someone wrote is never excused']);
    expect(bad([{ dataset: 'auth', check: 'scope' }])[0]).toMatch(/a rule someone wrote is never excused$/);
    expect(bad([{ dataset: 'vpn', check: 'amount' }])).toEqual(['event 1, excuse 1: vpn isn\'t a dataset the event is about: an event excuses only what it names']);
    // An event about the whole flow names no dataset, so it excuses none.
    expect(bad([{ dataset: 'auth', check: 'amount' }], { about: undefined })).toEqual(['event 1, excuse 1: auth isn\'t a dataset the event is about: an event excuses only what it names']);
    expect(bad([{ dataset: 'auth', check: 'amount', column: 'method' }])).toEqual(['event 1, excuse 1: the amount is the file\'s, not a column\'s']);
    expect(bad([])).toEqual(['event 1: what it excuses is a list of { dataset, check, column? }, absent when it excuses nothing']);
    expect(bad([{ dataset: 'auth', check: 'shares', how: 'much' }])).toEqual(['event 1, excuse 1: how is not a field of an excuse (dataset, check, column)']);
  });

  it('excuses a dataset’s loads from its first day, as known at a moment: one written after a run excuses nothing of it', () => {
    const events = [event(), event({ id: 'later', name: 'Written late', from: OUT1, until: OUT1, recorded: `${OUT2}T09:00:00Z`, excuses: [{ dataset: 'auth', check: 'amount' }] }), event({ id: 'other', name: 'Another file', about: ['vpn'], excuses: [{ dataset: 'vpn', check: 'amount' }] })];
    // As the first day's run knew it, at 06:00: the one written the day before.
    expect(excusesFor(events, 'auth', OUT1, `${OUT1}T06:00:00Z`)).toEqual([MFA]);
    // Read now, both: a day not run yet is told under every event written so far.
    expect(excusesFor(events, 'auth', OUT1).map((x) => x.event)).toEqual(['later', 'mfa-maintenance']);
    // The day before it began it excuses nothing; after it ended it still names the days it set aside.
    expect(excusesFor(events, 'auth', plusDays(OUT1, -1))).toEqual([]);
    expect(excusesFor(events, 'auth', plusDays(OUT2, 7), `${OUT1}T06:00:00Z`)).toEqual([MFA]);
    expect(excusesFor(events, 'AUTH', OUT1, `${OUT1}T06:00:00Z`)).toEqual([MFA]);
    // One taken back excuses nothing from then.
    expect(excusesFor([...events, event({ recorded: `${OUT1}T05:00:00Z`, withdrawn: true })], 'auth', OUT1, `${OUT1}T06:00:00Z`)).toEqual([]);
    expect(isClaimExcuses([MFA])).toBe(true);
    expect(isClaimExcuses([])).toBe(false);
    expect(isClaimExcuses([{ ...MFA, check: 'rules' }])).toBe(false);
  });

  it('is written into the record when it was written down: after a day’s run of the same moment', () => {
    const story = { format: 'smaltfl-story/1' as const, flow: 'signins', deliveries: [], decisions: [], events: [event({ recorded: `${OUT1}T06:00:00Z` })] };
    const line = timelineOf([OUT1, OUT2], (d) => `${d}T06:00:00Z`, story);
    expect(line.map((e) => [e.kind, e.at])).toEqual([['day', `${OUT1}T06:00:00Z`], ['event', `${OUT1}T06:00:00Z`], ['day', `${OUT2}T06:00:00Z`]]);
  });
});

describe('a finding an event excuses', () => {
  it('is told as expected: a note with the event, the day said by it and not held', () => {
    const plain = told(OUT1);
    expect([plain.state, plain.head]).toEqual(['wrong', 'method mfa_push almost gone']);
    expect(claimHolds(doc.publish!.hold, { state: plain.state, below: false })).toBe(true);
    const excused = told(OUT1, BOTH);
    expect(excused.state).not.toBe('wrong');
    expect(excused.head).toBe('As expected: MFA provider maintenance');
    expect(claimHolds(doc.publish!.hold, { state: excused.state, below: false })).toBe(false);
    const marked = findingsOf(excused).filter((f) => f.excused);
    expect(marked.map((f) => f.kind).sort()).toEqual(expect.arrayContaining(['gone', 'share', 'volume']));
    expect(marked.every((f) => f.severity === 'note' && f.excused!.event === 'mfa-maintenance')).toBe(true);
  });

  it('excuses only what it names: the mix alone leaves the drop in sign-ins to hold the day', () => {
    const mix = told(OUT1, [MFA]);
    expect(mix.state).toBe('wrong');
    expect(findingsOf(mix).filter((f) => f.excused).every((f) => (f.columns ?? []).includes('method'))).toBe(true);
    expect(findingsOf(mix).find((f) => f.kind === 'volume')?.excused).toBeUndefined();
    expect(mix.head).not.toMatch(/^As expected/);
  });

  it('says nothing of a day the event doesn’t cover, or a column it doesn’t name', () => {
    const later = BOTH.map((x) => ({ ...x, until: undefined, from: plusDays(OUT2, 1) }));
    expect(findingsOf(told(OUT1, later)).some((f) => f.excused)).toBe(false);
    expect(findingsOf(told(OUT1, [{ ...MFA, column: 'country' }])).some((f) => f.excused)).toBe(false);
    // Named for every column, it excuses the method's.
    expect(told(OUT1, [FEWER, { ...MFA, column: undefined }]).head).toBe('As expected: MFA provider maintenance');
  });

  it('never excuses a value the ontology marks bad: failed sign-ins fifteen times the usual hold the day', () => {
    const burst = told(PLANTED.burst, [{ event: 'drill', name: 'Red-team drill', from: PLANTED.burst, check: 'shares' }, { event: 'drill', name: 'Red-team drill', from: PLANTED.burst, check: 'amount' }]);
    expect(burst.state).toBe('wrong');
    expect(burst.head).toBe('result fail 15× usual');
    const f: Finding = { key: 'k', kind: 'share', severity: 'alert', score: 9, title: 'Result fail', detail: '', look: 'history', columns: ['result'], acts: [], bad: true };
    expect(excusedBy(f, [{ event: 'drill', name: 'Red-team drill', check: 'shares' }])).toBe(f);
  });

  it('never excuses a written check’s finding, whatever the event says', () => {
    const excuses = EXCUSABLE.map((check) => ({ event: 'e', name: 'E', check }));
    for (const kind of ['band', 'scope', 'needs', 'reconcile', 'schema', 'stale', 'due', 'rule', 'dropped', 'new'] as const) {
      const f: Finding = { key: kind, kind, severity: 'alert', score: 9, title: kind, detail: '', look: 'history', columns: ['method'], acts: [] };
      expect(excusedBy(f, excuses), kind).toBe(f);
    }
    for (const kind of ['volume', 'share', 'gone', 'pair', 'combo', 'missing', 'shape'] as const) {
      const f: Finding = { key: kind, kind, severity: 'warn', score: 3, title: kind, detail: '', look: 'history', columns: ['method'], acts: [] };
      expect(excusedBy(f, excuses), kind).toMatchObject({ severity: 'note', excused: { event: 'e', name: 'E' } });
    }
    // A note stays what it was: nothing to excuse.
    const note: Finding = { key: 'n', kind: 'share', severity: 'note', score: 1, title: 'n', detail: '', look: 'history', columns: ['method'], acts: [] };
    expect(excusedBy(note, excuses)).toBe(note);
  });
});

describe('the days an event excused, set aside from learning', () => {
  it('are each excuse’s days before the day told, for the series its check reads', () => {
    expect(asideBefore([MFA], OUT1)).toEqual([]);
    expect(asideBefore([MFA], OUT2)).toEqual([{ from: OUT1, until: OUT1, check: 'shares', column: 'method' }]);
    expect(asideBefore([MFA], plusDays(OUT2, 30))).toEqual([{ from: OUT1, until: OUT2, check: 'shares', column: 'method' }]);
    // An event still going on sets aside up to the day before.
    expect(asideBefore([{ ...MFA, until: undefined }], plusDays(OUT1, 5))).toEqual([{ from: OUT1, until: plusDays(OUT1, 4), check: 'shares', column: 'method' }]);
  });

  it('leave the series as it was before the event: the second day is judged against days without the first', () => {
    const push = { of: 'value' as const, column: 'method', value: '"mfa_push"' };
    const usual = h.of(push)!.at(OUT1)!;
    // A fortnight on, the same weekday: with the outage's days learned from, and with them set aside. Set aside, what is
    // usual is what it was before the outage; learned from, the two days of none pull it down.
    const later = plusDays(OUT1, 14);
    const learned = ranges().of(push)!.at(later)!;
    const aside = ranges(asideBefore([MFA], later)).of(push)!.at(later)!;
    expect(Math.abs(aside.expected - usual.expected)).toBeLessThanOrEqual(Math.abs(learned.expected - usual.expected));
    expect(aside.expected).toBeGreaterThanOrEqual(learned.expected);
    // A series the excuse doesn't read is learned as always.
    const rows = { of: 'trips' as const };
    expect(ranges(asideBefore([MFA], OUT2)).of(rows)!.at(OUT2)).toEqual(ranges().of(rows)!.at(OUT2));
    const country = { of: 'value' as const, column: 'country', value: '"US"' };
    expect(ranges(asideBefore([MFA], OUT2)).of(country)!.at(OUT2)).toEqual(ranges().of(country)!.at(OUT2));
    // The amount set aside takes the counts with it, and no share.
    const amount = asideBefore([{ ...MFA, check: 'amount', column: undefined }], OUT2);
    expect(ranges(amount).of(push)!.at(OUT2)).toEqual(ranges().of(push)!.at(OUT2));
  });

  it('are told in the story the day after: the week after the outage reads as a normal week', () => {
    const after = plusDays(OUT2, 7);
    expect(told(after, BOTH, ranges(asideBefore(BOTH, after))).state).not.toBe('wrong');
  });
});
