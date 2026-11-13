/**
 * A recorded story (ADR 0021 §6, core/timeline.ts): its deliveries and decisions checked, and the month put in time
 * order for the recorder: each day's first run, each delivery numbered within its day, each decision.
 */
import { describe, expect, it } from 'vitest';
import { STORY_FORMAT, isStoryFile, storyProblems, timelineOf, type StoryFile } from '../src/core/timeline.js';

const story: StoryFile = {
  format: STORY_FORMAT,
  flow: 'larkspur',
  deliveries: [
    { day: '2024-03-21', file: 'tls', at: '2024-03-22T04:10:00Z', why: 'Deduplicated again, fully' },
    { day: '2024-03-04', file: 'mfa', at: '2024-03-05T02:40:00Z', why: 'The full export, run again overnight' },
    { day: '2024-03-21', file: 'tls', at: '2024-03-21T22:30:00Z', why: 'Half the repeats taken out' },
  ],
  decisions: [
    { day: '2024-03-04', at: '2024-03-04T08:10:00Z', by: 'ciso', option: 'dont', reason: 'The MFA vendor re-runs the export tonight' },
    { day: '2024-03-04', delivery: 1, at: '2024-03-05T04:50:00Z', by: 'ciso', option: 'asis', reason: 'Checked against the directory' },
  ],
};

describe('a recorded story', () => {
  it('takes a good story, and checks its files and deciders against the flow', () => {
    expect(storyProblems(story, { sources: ['mfa', 'tls'], principals: ['owner', 'ciso'] })).toEqual([]);
    expect(isStoryFile(story)).toBe(true);
    expect(storyProblems(story, { sources: ['mfa'], principals: ['owner'] })).toEqual([
      "delivery 1: tls isn't a source of the flow",
      "delivery 3: tls isn't a source of the flow",
      "decision 1: ciso isn't a principal of the flow",
      "decision 2: ciso isn't a principal of the flow",
    ]);
  });

  it('says what is wrong with a delivery or a decision', () => {
    const bad = {
      format: 'smaltfl-story/0', flow: 'larkspur',
      deliveries: [{ day: '2024-03-04', file: 'mfa', at: '2024-03-03T23:00:00Z', why: '' }],
      decisions: [
        { day: '2024-03-04', at: '2024-03-04T08:00:00Z', by: 'ciso', option: 'asis', reason: null },
        { day: '2024-03-04', delivery: 1, at: '2024-03-03T22:00:00Z', by: 'ciso', option: 'dont', reason: null },
        { day: '2024-03-04', delivery: 2, at: '2024-03-05T00:00:00Z', by: 'ciso', option: 'maybe', reason: null },
      ],
    };
    expect(storyProblems(bad)).toEqual([
      `its format is ${STORY_FORMAT}`,
      'delivery 1: it arrived before its day began',
      'delivery 1: it says why it was sent',
      'decision 1: publish as is needs a reason',
      'decision 2: it comes before the delivery it is about arrived',
      'decision 3: its option is one of asis, dont, fill, complete, accept',
      'decision 3: 2024-03-04 has no delivery 2',
    ]);
    expect(storyProblems(null)).toEqual(['a story is a JSON object']);
  });

  it('puts the month in time order, each day’s deliveries numbered in the order they arrived', () => {
    const days = ['2024-03-04', '2024-03-05', '2024-03-21', '2024-03-22'];
    const t = timelineOf(days, (d) => `${d}T05:25:00Z`, story);
    expect(t.map((e) => [e.at.slice(5, 16), e.kind, e.day, 'n' in e ? e.n : null])).toEqual([
      ['03-04T05:25', 'day', '2024-03-04', null],
      ['03-04T08:10', 'decision', '2024-03-04', 0],
      ['03-05T02:40', 'delivery', '2024-03-04', 1],
      ['03-05T04:50', 'decision', '2024-03-04', 1],
      ['03-05T05:25', 'day', '2024-03-05', null],
      ['03-21T05:25', 'day', '2024-03-21', null],
      ['03-21T22:30', 'delivery', '2024-03-21', 1],
      ['03-22T04:10', 'delivery', '2024-03-21', 2],
      ['03-22T05:25', 'day', '2024-03-22', null],
    ]);
    expect(timelineOf(['2024-03-04'], (d) => `${d}T06:00:00Z`, null)).toEqual([{ at: '2024-03-04T06:00:00Z', kind: 'day', day: '2024-03-04' }]);
  });
});
