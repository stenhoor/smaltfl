/**
 * The tour's month (ADR 0023 §1, §3), as the demo records it: Larkspur with the tour's days planted (LARKSPUR_TOUR), at
 * the demo's own scale, every watch's history and sample made and the month recorded with the tour's story
 * (examples/larkspur/tour.json), as `npm run build:app -- --variant tour` makes them (scripts/data/make.mjs). Its answer
 * key, a scene a day:
 *
 * 1. Wed 6, a normal day: every file arrives and every check passes.
 * 2. Tue 5, a warning: the scanner writes its words in capitals; the day is published, the findings marked unusual.
 * 3. Mon 4, a written check holds a file: the MFA export arrives empty; kept back, then sent again overnight and published.
 * 4. Tue 12 to Thu 14, a statistical anomaly that was real: the log pipelines' migration moves a third of the logging
 *    file's rows, held by a learned check that moved more than a quarter of them (Q-132); published as is, held again
 *    the next day (Q-86) until the owner accepts the new level; judged at it after.
 * 5. Mon 18 to Wed 20, a statistical anomaly that was an issue: the backup export mislabels a third of its rows, held
 *    by a learned check; filled forward from Sun 17, then the corrected file sent again two days later replaces it.
 *    (Not the encryption feed: carried from another day, its statuses would contradict the day's key rotation, which
 *    the posture's needs rule holds, as it should.)
 * 6. Fills each way and one file replaced: Thu 21, the TLS file's rows twice, only that file sent again; Sat 23, the
 *    EDR export empty, filled back from Sun 24; Wed 27, the access reviews' export empty, left for the visitor.
 *
 * And the month's layering stories kept as more to see: a department dropped from the HR extract on Fri 8, held in
 * silver and sent again; one certificate authority behind two controls on Mon 25, told and published. Every other day
 * is published as it arrived.
 *
 * About fifteen minutes on four cores: `npm run test:tour`, and a CI job of its own (vitest.config.ts, TOUR). With
 * SMALTFL_TOUR_WORK naming a folder the month was made in already (the app build's cache of the tour's data), the answer
 * key is checked against it, nothing made again.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { LogEntry } from '../src/core/log.js';
import type { MonthFile } from '../src/core/month.js';
import { addDays, LARKSPUR_TOUR_DAYS } from './fixtures/larkspur.js';

const D = LARKSPUR_TOUR_DAYS;
const MARCH = Array.from({ length: 31 }, (_, i) => addDays('2024-03-01', i));
const made = process.env.SMALTFL_TOUR_WORK;
let work = '';
let month: MonthFile;

beforeAll(() => {
  work = made ?? mkdtempSync(join(tmpdir(), 'smaltfl-tour-'));
  if (!made) execFileSync('node', ['scripts/data/make.mjs', '--flow', 'examples/larkspur/flow.json', '--variant', 'tour', '--work', work], { maxBuffer: 1 << 30 });
  month = JSON.parse(readFileSync(join(work, 'month.json'), 'utf8')) as MonthFile;
}, 3_600_000);
afterAll(() => {
  if (work && !made) rmSync(work, { recursive: true, force: true });
});

type Loose = Record<string, any>;
const about = (e: LogEntry): Loose => e.about as Loose;
/** A day's runs, in the order recorded: its first files, each later delivery, a fill's derived run. */
const runsOf = (day: string) => month.entries.filter((e) => e.kind === 'run' && about(e).day === day);
/** A run's holds, `by:origin`, each once. */
const holdsOf = (e: LogEntry): string[] => [...new Set(((about(e).holds ?? []) as Loose[]).map((h) => `${h.by}:${h.origin}`))].sort();
const claimOf = (e: LogEntry, source: string): Loose | undefined => (about(e).claims as Loose[] | undefined)?.find((c) => c.source === source);
const decisionsOf = (day: string) => month.entries.filter((e) => e.kind === 'decide' && about(e).day === day);
/** The release that cites a decision: as the one it follows, or among the loads' decisions it publishes. */
const releaseOf = (d: LogEntry) => month.entries.find((e) => e.kind === 'release' && (about(e).decision === d.seq || ((about(e).decisions ?? []) as number[]).includes(d.seq)));
/** A day's choices as `option by`, with the outcome of their release where one was made: a choice is recorded once a
 * held load (Q-193), taken together, and its release cites one of them (a fill, its file's). */
const decided = (day: string) => {
  const out = new Map<string, string>();
  for (const d of decisionsOf(day)) {
    const choice = `${d.at}|${about(d).option}|${d.by.as}`;
    const r = releaseOf(d);
    const said = `${about(d).option} by ${d.by.as}`;
    out.set(choice, r ? `${said}: ${about(r).outcome}` : out.get(choice) ?? said);
  }
  return [...out.values()];
};
/** The days held on their first files. */
const SCENES = [D.empty, D.dissolve, D.migration, addDays(D.migration, 1), D.mislabel, D.double, D.weekend, D.missing];

describe('the tour’s month, as the demo records it (ADR 0023 §3)', () => {
  it('runs every day of March, and only the scenes’ days hold', () => {
    for (const day of MARCH) expect(runsOf(day).length, day).toBeGreaterThan(0);
    const first = Object.fromEntries(MARCH.map((day) => [day, holdsOf(runsOf(day)[0]!).length > 0]));
    expect(Object.keys(first).filter((d) => first[d])).toEqual(SCENES);
  });

  it('scene 1, Wed 6: a normal day, every file arriving and every check passing', () => {
    const [run, ...more] = runsOf(D.normal);
    expect(more).toEqual([]);
    expect(about(run!).outcome).toBe('ok');
    expect(((about(run!).claims ?? []) as Loose[]).filter((c) => c.state === 'wrong' || c.state === 'unusual')).toEqual([]);
  });

  it('scene 2, Tue 5: the scanner’s capitals are a warning, and the day is published', () => {
    const [run] = runsOf(D.capitals);
    expect(about(run!).outcome).toBe('ok');
    expect(claimOf(run!, 'findings')).toMatchObject({ state: 'unusual' });
    expect(decided(D.capitals)).toEqual([]);
  });

  it('scene 3, Mon 4: the empty MFA file held by its amount, kept back, then sent again overnight and published', () => {
    const [first, again] = runsOf(D.empty);
    expect(holdsOf(first!)).toEqual(['story:mfa']);
    expect(claimOf(first!, 'mfa')).toMatchObject({ state: 'wrong', head: 'Almost no apps: 0' });
    expect(about(again!).correction).toMatchObject({ sources: ['mfa'] });
    expect(holdsOf(again!)).toEqual(['correction:mfa']);
    expect(decided(D.empty)).toEqual(['dont by ciso', 'asis by ciso: applied']);
  });

  it('scene 4, Tue 12 to Thu 14: the migration held by a learned check, published as is, held again until accepted', () => {
    const tue = runsOf(D.migration)[0]!;
    const wed = runsOf(addDays(D.migration, 1))[0]!;
    for (const run of [tue, wed]) {
      expect(holdsOf(run)).toEqual(['story:logging_coverage']);
      expect(claimOf(run, 'logging_coverage')).toMatchObject({ state: 'wrong' });
      expect(claimOf(run, 'logging_coverage')!.head).toMatch(/^pipeline log-/);
    }
    expect(decided(D.migration)).toEqual(['asis by ciso: applied']);
    expect(decided(addDays(D.migration, 1))).toEqual(['accept by owner: applied']);
    const accepted = decisionsOf(addDays(D.migration, 1))[0]!;
    expect(about(accepted).level).toMatchObject({ source: 'logging_coverage', from: addDays(D.migration, 1) });
    expect(about(accepted).level.metrics).toContain('value:pipeline="log-dc"');
    // Judged at the new level from the day after, its pairs with it: the logging file is calm again.
    for (let d = addDays(D.migration, 2); d < D.mislabel; d = addDays(d, 1)) {
      const run = runsOf(d)[0]!;
      expect(about(run).outcome, d).toBe('ok');
      expect(['wrong', 'unusual'], d).not.toContain(claimOf(run, 'logging_coverage')?.state);
    }
  });

  it('scene 5, Mon 18 to Wed 20: the mislabelled backup file held, filled forward, then replaced by its corrected file', () => {
    const [first, fill, again] = runsOf(D.mislabel);
    expect(holdsOf(first!)).toEqual(['story:backup_jobs']);
    expect(claimOf(first!, 'backup_jobs')!.head).toMatch(/^Last_state COMPLETED: /);
    expect(about(fill!)).toMatchObject({ outcome: 'derived', repair: { source: 'backup_jobs', missing: { all: true }, donor: { day: addDays(D.mislabel, -1), direction: 'before' } } });
    expect(about(again!).correction).toMatchObject({ sources: ['backup_jobs'] });
    expect(again!.at.slice(0, 10)).toBe(addDays(D.mislabel, 2));
    expect(holdsOf(again!)).toEqual(['correction:backup_jobs']);
    expect(decided(D.mislabel)).toEqual(['fill by ciso: applied', 'asis by ciso: applied']);
  });

  it('scene 6: the doubled TLS file sent again alone (Thu 21), the empty EDR file filled back (Sat 23), the empty access reviews left for the visitor (Wed 27)', () => {
    const [doubled, once] = runsOf(D.double);
    expect(holdsOf(doubled!)).toContain('story:tls');
    expect(claimOf(doubled!, 'tls')!.head).toMatch(/repeat a key$/);
    expect(holdsOf(once!)).toEqual(['correction:tls']);
    expect(decided(D.double)).toEqual(['asis by ciso: applied']);

    const [empty, back] = runsOf(D.weekend);
    expect(holdsOf(empty!)).toContain('story:edr_coverage');
    expect(about(back!)).toMatchObject({ outcome: 'derived', repair: { source: 'edr_coverage', missing: { all: true }, donor: { day: addDays(D.weekend, 1), direction: 'after' } } });
    expect(decided(D.weekend)).toEqual(['fill by ciso: applied']);

    const missing = runsOf(D.missing);
    expect(missing).toHaveLength(1);
    expect(holdsOf(missing[0]!)).toContain('story:access_reviews');
    expect(claimOf(missing[0]!, 'access_reviews')).toMatchObject({ state: 'wrong', head: 'Almost no apps: 0' });
    expect(decided(D.missing)).toEqual([]);
  });

  it('keeps two layering stories: the dropped department held in silver and sent again (Fri 8), one cause behind two controls told (Mon 25)', () => {
    const [first, again] = runsOf(D.dissolve);
    expect(holdsOf(first!)).toEqual(['checks:app_owners', 'checks:org_chain']);
    expect(holdsOf(again!)).toEqual(['correction:hr_org_units']);
    expect(decided(D.dissolve)).toEqual(['asis by ciso: applied']);
    const [ca, ...more] = runsOf(D.ca);
    expect(more).toEqual([]);
    expect(about(ca!).outcome).toBe('ok');
    expect(claimOf(ca!, 'platform_impact')!.head).toMatch(/ca-int-2/);
  });

  it('publishes every other day as it arrived', () => {
    const story = new Set([...SCENES, D.ca]);
    for (const day of MARCH.filter((d) => !story.has(d))) {
      const runs = runsOf(day);
      expect(runs.map((r) => about(r).outcome), day).toEqual(['ok']);
    }
  });

  it('keeps the days between the scenes calm: the steady world leaves a few notes, each a learned check’s (amendment 1)', () => {
    // Every day a scene shows, or that follows from one (Thu 14 is judged at the new level), is the scenes'; the others
    // are the calendar's calm days. In the answer key's world, its rhythms (due dates gathered on the quarter's dates,
    // Patch Tuesday's findings falling due together) noted 13 of them; the steady world leaves what the judges' own
    // false alarms make: the forest, a day unlike the 180 before it on one of twenty files, and a share by a few rows.
    const scenes = new Set([D.empty, D.capitals, D.normal, D.dissolve, D.migration, addDays(D.migration, 1), addDays(D.migration, 2), D.mislabel, D.double, D.weekend, D.ca, D.missing]);
    const noted = MARCH.filter((d) => !scenes.has(d)).filter((d) => runsOf(d).some((r) => ((about(r).claims ?? []) as Loose[]).some((c) => c.state === 'wrong' || c.state === 'unusual')));
    expect(noted.length, noted.join(', ')).toBeLessThanOrEqual(5);
    for (const d of noted) for (const r of runsOf(d)) for (const c of (about(r).claims ?? []) as Loose[]) expect(c.state, `${d} ${String(c.source)}`).not.toBe('wrong');
  });
});
