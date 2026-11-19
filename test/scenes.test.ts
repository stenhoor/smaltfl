/**
 * A demo's scenes (ADR 0023 §4, src/core/scenes.ts): the list the month screen shows, each scene's places to look, and
 * Larkspur's tour checked against its own month and flow: every day a day of the tour, every card one of the flow's,
 * every numbered scene in order with the stories kept as more to see after them.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isScenesFile, lookOf, sceneHash, scenesProblems, SCENES_FORMAT, type ScenesFile } from '../src/core/scenes.js';
import { addDays, daysFrom, LARKSPUR_TO, LARKSPUR_TOUR_DAYS, LARKSPUR_TOUR_FROM } from './fixtures/larkspur.js';
import { larkspurDir } from './helpers/larkspur-world.js';
import { loadFlowDir } from './helpers/notebooks.js';

/** The tour's days: February and March (ADR 0023 amendment 1). */
const TOUR = Array.from({ length: daysFrom(LARKSPUR_TOUR_FROM, LARKSPUR_TO) + 1 }, (_, i) => addDays(LARKSPUR_TOUR_FROM, i));
const good = (): ScenesFile => ({
  format: SCENES_FORMAT,
  title: 'What this demo shows',
  scenes: [
    { n: 1, title: 'A normal day', said: 'Every file arrives.', looks: [{ day: '2024-03-06', label: 'Wed 6' }] },
    { n: 2, title: 'A warning', said: 'A learned check warns.', looks: [{ day: '2024-03-05', label: 'Tue 5', card: 'findings', tab: 'quality' }, { day: '2024-03-04', label: 'Mon 4', version: 1 }] },
    { title: 'More to see', said: 'Kept from the month.', looks: [{ day: '2024-03-27', label: 'Wed 27', decide: true }] },
  ],
});

describe('a demo’s scenes (ADR 0023 §4)', () => {
  it('takes a list of scenes, numbered in order, the stories kept as more to see after them', () => {
    expect(scenesProblems(good())).toEqual([]);
    expect(isScenesFile(good())).toBe(true);
  });

  it('says what is wrong with one, by scene and look', () => {
    const f = good() as unknown as { format: string; scenes: Record<string, unknown>[] };
    f.format = 'smaltfl-scenes/0';
    f.scenes[1]!.n = 3;
    (f.scenes[1]!.looks as Record<string, unknown>[])[0]!.tab = 'sideways';
    (f.scenes[1]!.looks as Record<string, unknown>[])[1]!.version = 0;
    f.scenes.push({ n: 3, title: 'Late', said: 'After more to see.', looks: [{ day: '2024-3-1', label: '', card: 'findings', decide: true }] });
    expect(scenesProblems(f)).toEqual([
      'its format is smaltfl-scenes/1',
      'scene 2: its number is 2, its place among the numbered scenes',
      'scene 2, look 1: its tab is one of happened, quality, notebook, news, data, columns, history, checks, contract, rules, models, about',
      'scene 2, look 2: a version is 1 or more',
      'scene 4: a numbered scene comes before the stories kept as more to see',
      'scene 4, look 1: its day is YYYY-MM-DD',
      'scene 4, look 1: its link says something (label)',
      'scene 4, look 1: it opens the decision or a card, not both',
    ]);
    expect(scenesProblems(good(), { days: ['2024-03-06'], cards: ['mfa'] })).toEqual([
      "scene 2, look 1: 2024-03-05 isn't a day of the demo",
      "scene 2, look 1: findings isn't a card of the flow",
      "scene 2, look 2: 2024-03-04 isn't a day of the demo",
      "scene 3, look 1: 2024-03-27 isn't a day of the demo",
    ]);
  });

  it('finds a look by its link’s numbers, the first where none is given', () => {
    expect(lookOf(good(), 2)?.look).toEqual({ day: '2024-03-05', label: 'Tue 5', card: 'findings', tab: 'quality' });
    expect(lookOf(good(), 2, 2)?.look.version).toBe(1);
    expect(lookOf(good(), 3)?.scene.n).toBeUndefined();
    expect(lookOf(good(), 4)).toBeNull();
    expect(lookOf(good(), 2, 3)).toBeNull();
    expect([sceneHash(4), sceneHash(4, 2)]).toEqual(['#scene/4', '#scene/4/2']);
  });

  it('holds Larkspur’s tour to its two months and its flow: every day planted where it says, every card the flow’s', async () => {
    const file = JSON.parse(readFileSync(new URL('scenes.json', larkspurDir), 'utf8')) as unknown;
    const doc = await loadFlowDir(larkspurDir);
    const cards = [...doc.sources.map((s) => s.id), ...doc.steps.map((s) => s.id)];
    expect(scenesProblems(file, { days: TOUR, cards })).toEqual([]);
    expect(TOUR).toHaveLength(60);
    const tour = file as ScenesFile;
    // Seven scenes, a capability each (the seventh ADR 0027's: the catalogue's new control, declared at the gate), and
    // three stories kept as more to see.
    expect(tour.scenes.map((s) => s.n ?? null)).toEqual([1, 2, 3, 4, 5, 6, 7, null, null, null]);
    const D = LARKSPUR_TOUR_DAYS;
    const days = (n: number) => [...new Set(tour.scenes[n - 1]!.looks.map((l) => l.day))];
    expect(days(1)).toEqual([D.normal]);
    expect(days(2)).toEqual([D.capitals]);
    expect(days(3)).toEqual([D.empty]);
    expect(days(4)).toEqual([D.migration, addDays(D.migration, 1), addDays(D.migration, 2)]);
    expect(days(5)).toEqual([D.mislabel]);
    expect(days(6)).toEqual([D.double, D.weekend, D.missing]);
    expect(days(7)).toEqual([D.sbom]);
    // The rule said ahead is looked at on a day it was coming: the Saturday of the three, which scene 6 opens too.
    expect([...days(8), ...days(9), ...days(10)]).toEqual([D.dissolve, D.ca, D.weekend]);
    // The day left for the visitor opens its decision.
    expect(tour.scenes[5]!.looks.find((l) => l.day === D.missing)).toMatchObject({ decide: true });
  });
});
