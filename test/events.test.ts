/**
 * Events (ADR 0027 §6, core/events.ts): dated context written by a person. What is wrong with a list of them, the
 * events as known at a moment, those going on on a day, and which day of an event a day is.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { covers, eventDay, eventDays, eventsOn, eventsProblems, eventTense, isAbout, latestEvents, type FlowEvent } from '../src/core/events.js';
import { storyProblems } from '../src/core/timeline.js';

const freeze: FlowEvent = { id: 'change-freeze', name: 'Quarter-end change freeze', from: '2024-03-25', until: '2024-03-31', kind: 'freeze', note: 'Fixes wait for April', recorded: '2024-03-22T15:00:00Z', by: 'ciso' };
const scanner: FlowEvent = { id: 'scanner-no-login', name: 'Scanner without its login', from: '2024-03-16', until: '2024-03-17', kind: 'incident', about: ['findings'], recorded: '2024-03-25T09:30:00Z', by: 'ciso' };
const push: FlowEvent = { id: 'push', name: 'Remediation push', from: '2024-03-01', kind: 'campaign', recorded: '2024-03-01T09:00:00Z', by: 'ciso' };

describe('events', () => {
  it('are known from the moment they were written down, in the order of their first days', () => {
    const all = [freeze, scanner, push];
    expect(latestEvents(all).map((e) => e.id)).toEqual(['push', 'scanner-no-login', 'change-freeze']);
    // The scanner's weekend was seen on Mon 25: read as known on Sun 24, it isn't there.
    expect(latestEvents(all, '2024-03-24T23:59:59Z').map((e) => e.id)).toEqual(['push', 'change-freeze']);
    expect(latestEvents(all, '2024-02-29T00:00:00Z')).toEqual([]);
  });

  it('are changed by writing them again under their id, and taken back the same way', () => {
    const longer = { ...freeze, until: '2024-04-02', recorded: '2024-03-28T10:00:00Z' };
    expect(latestEvents([freeze, longer]).map((e) => e.until)).toEqual(['2024-04-02']);
    expect(latestEvents([freeze, longer], '2024-03-27T00:00:00Z').map((e) => e.until)).toEqual(['2024-03-31']);
    const back = { ...freeze, withdrawn: true, recorded: '2024-03-29T10:00:00Z' };
    expect(latestEvents([freeze, back])).toEqual([]);
    expect(latestEvents([freeze, back], '2024-03-28T00:00:00Z')).toHaveLength(1);
  });

  it('go on from their first day to their last, both in, and on with no last day', () => {
    expect(['2024-03-24', '2024-03-25', '2024-03-31', '2024-04-01'].map((d) => covers(freeze, d))).toEqual([false, true, true, false]);
    expect(covers(push, '2025-01-01')).toBe(true);
    expect(eventsOn([freeze, scanner, push], '2024-03-26').map((e) => e.id)).toEqual(['push', 'change-freeze']);
    expect(eventsOn([freeze, scanner, push], '2024-03-16', '2024-03-20T00:00:00Z').map((e) => e.id)).toEqual(['push']);
    expect([eventTense(freeze, '2024-03-22'), eventTense(freeze, '2024-03-27'), eventTense(freeze, '2024-04-03')]).toEqual(['coming', 'going on', 'over']);
  });

  it('say which day of an event a day is', () => {
    expect(eventDays(freeze)).toBe(7);
    expect(eventDays(push)).toBeNull();
    expect(eventDay(freeze, '2024-03-27')).toEqual({ n: 3, of: 7 });
    expect(eventDay(push, '2024-03-10')).toEqual({ n: 10, of: null });
    expect(eventDay(freeze, '2024-03-24')).toBeNull();
  });

  it('are about the datasets they name, or the whole flow', () => {
    expect(isAbout(scanner, 'Findings')).toBe(true);
    expect(isAbout(scanner, 'waf')).toBe(false);
    expect(isAbout(freeze, 'waf')).toBe(true);
  });

  it('are refused when they are not well made, each problem in words', () => {
    expect(eventsProblems(undefined)).toEqual([]);
    expect(eventsProblems([freeze, scanner, push])).toEqual([]);
    expect(eventsProblems({})).toEqual(['its events are a list']);
    const bad = eventsProblems([{ ...freeze, until: '2024-03-01', kind: 'holiday', extra: 1 }, { id: '', name: ' ', from: 'Mar 1', kind: 'freeze', recorded: 'then', by: '' }]);
    expect(bad).toEqual([
      'event 1: extra is not a field of an event (id, name, from, until, kind, about, note, recorded, by, withdrawn)',
      'event 1: its last day is YYYY-MM-DD, on or after its first',
      'event 1: its kind is one of reorg, freeze, migration, incident, campaign, other',
      'event 2: it has an id',
      'event 2: it has a name',
      'event 2: its first day is YYYY-MM-DD',
      'event 2: when it was written down is an ISO 8601 time',
      'event 2: it says who wrote it',
    ]);
    expect(eventsProblems([scanner], { datasets: ['waf'] })).toEqual(['event 1: findings is not a dataset of the flow']);
  });
});

describe('a story’s events', () => {
  it('are checked with the story, by its people and at UTC times', () => {
    const story = JSON.parse(readFileSync('examples/larkspur/story.json', 'utf8'));
    expect(storyProblems(story, { principals: ['owner', 'ciso'] })).toEqual([]);
    expect(story.events.map((e: FlowEvent) => e.id)).toEqual(['remediation-push', 'reorg-handover', 'waf-monitor-mode', 'scanner-no-login', 'change-freeze']);
    const wrong = { ...story, events: [{ ...story.events[0], by: 'someone', recorded: '2024-03-01 09:00' }] };
    expect(storyProblems(wrong, { principals: ['owner', 'ciso'] })).toEqual([
      'event remediation-push: when it was written down is a UTC time, YYYY-MM-DDTHH:MMZ',
      'event remediation-push: someone is not one of the flow’s people',
    ]);
  });

  it('gives its changes a kind, who decided, what led to them and the thinking', () => {
    const story = JSON.parse(readFileSync('examples/larkspur/story.json', 'utf8'));
    const [band, hold] = story.changes;
    expect([band.kind, band.decided, band.because]).toEqual(['business', { by: 'Sloane Marsden', on: '2024-03-14' }, { event: 'waf-monitor-mode' }]);
    expect(Object.keys(band.note)).toEqual(['saw', 'chose', 'turnedDown', 'expect', 'lookAgain']);
    expect([hold.kind, hold.because]).toEqual(['corrected', { event: 'scanner-no-login' }]);
  });
});
