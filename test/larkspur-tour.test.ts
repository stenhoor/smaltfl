/**
 * The tour's two months (ADR 0023 §1, §3, amendment 1), as the demo records them: Larkspur's steady world with the tour's
 * days planted (LARKSPUR_TOUR), at the demo's own scale, every watch's history and sample made and February and March
 * recorded with the tour's story (examples/larkspur/tour.json), as `npm run build:app -- --variant tour` makes them
 * (scripts/data/make.mjs). Its answer key, a scene a day, a week or so between most of them:
 *
 * 1. Wed Feb 7, a normal day: every file arrives and every check passes.
 * 2. Tue Feb 20, a warning: the scanner writes its words in capitals; the day is published, the findings marked unusual.
 * 3. Mon Feb 26, a written check holds a file: the MFA export arrives empty; kept back, then sent again overnight and
 *    published.
 * 4. Tue Mar 5 to Thu Mar 7, a statistical anomaly that was real: the log pipelines' migration moves a third of the
 *    logging file's rows, held by a learned check that moved more than a quarter of them (Q-132); published as is, held
 *    again the next day (Q-86) until the owner accepts the new level; judged at it after.
 * 5. Mon Mar 11 to Wed Mar 13, a statistical anomaly that was an issue: the backup export mislabels a third of its rows,
 *    held by a learned check; filled forward from Sun Mar 10, then the corrected file sent again two days later replaces
 *    it. (Not the encryption feed: carried from another day, its statuses would contradict the day's key rotation,
 *    which the posture's needs rule holds, as it should.)
 * 6. Fills each way and one file replaced: Thu Mar 21, the TLS file's rows twice, only that file sent again; Sat Mar 23,
 *    the EDR export empty, filled back from Sun Mar 24; Wed Mar 27, the access reviews' export empty, left for the
 *    visitor.
 *
 * And two layering stories kept as more to see: a department dropped from the HR extract on Fri Feb 16, held in silver
 * and sent again; one certificate authority behind two controls on Mon Mar 18, told and published. Every other day is
 * published as it arrived.
 *
 * About ten minutes in CI, on four cores: `npm run test:tour`, and a CI job of its own (vitest.config.ts, TOUR). With
 * SMALTFL_TOUR_WORK naming a folder the month was made in already (the app build's cache of the tour's data), the answer
 * key is checked against it, nothing made again.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { entryLeaf, type LogEntry } from '../src/core/log.js';
import type { MonthFile } from '../src/core/month.js';
import { addDays, daysFrom, LARKSPUR_TO, LARKSPUR_TOUR_DAYS, LARKSPUR_TOUR_FROM } from './fixtures/larkspur.js';

const D = LARKSPUR_TOUR_DAYS;
/** The tour's days: February and March (amendment 1). */
const TOUR = Array.from({ length: daysFrom(LARKSPUR_TOUR_FROM, LARKSPUR_TO) + 1 }, (_, i) => addDays(LARKSPUR_TOUR_FROM, i));
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
/** The days held on their first files, in order. */
const SCENES = [D.dissolve, D.empty, D.migration, addDays(D.migration, 1), D.mislabel, D.double, D.weekend, D.missing];

describe('the tour’s two months, as the demo records them (ADR 0023 §3, amendment 1)', () => {
  it('runs every day of February and March, and only the scenes’ days hold', () => {
    expect(TOUR).toHaveLength(60);
    for (const day of TOUR) expect(runsOf(day).length, day).toBeGreaterThan(0);
    const first = Object.fromEntries(TOUR.map((day) => [day, holdsOf(runsOf(day)[0]!).length > 0]));
    expect(Object.keys(first).filter((d) => first[d])).toEqual(SCENES);
  });

  it('scene 1, Wed Feb 7: a normal day, every file arriving and every check passing', () => {
    const [run, ...more] = runsOf(D.normal);
    expect(more).toEqual([]);
    expect(about(run!).outcome).toBe('ok');
    expect(((about(run!).claims ?? []) as Loose[]).filter((c) => c.state === 'wrong' || c.state === 'unusual')).toEqual([]);
  });

  it('scene 2, Tue Feb 20: the scanner’s capitals are a warning, and the day is published', () => {
    const [run] = runsOf(D.capitals);
    expect(about(run!).outcome).toBe('ok');
    expect(claimOf(run!, 'findings')).toMatchObject({ state: 'unusual' });
    expect(decided(D.capitals)).toEqual([]);
  });

  it('scene 3, Mon Feb 26: the empty MFA file held by its amount, kept back, then sent again overnight and published', () => {
    const [first, again] = runsOf(D.empty);
    expect(holdsOf(first!)).toEqual(['story:mfa']);
    expect(claimOf(first!, 'mfa')).toMatchObject({ state: 'wrong', head: 'Almost no apps: 0' });
    expect(about(again!).correction).toMatchObject({ sources: ['mfa'] });
    expect(holdsOf(again!)).toEqual(['correction:mfa']);
    expect(decided(D.empty)).toEqual(['dont by ciso', 'asis by ciso: applied']);
  });

  it('scene 4, Tue Mar 5 to Thu Mar 7: the migration held by a learned check, published as is, held again until accepted', () => {
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

  it('scene 5, Mon Mar 11 to Wed Mar 13: the mislabelled backup file held, filled forward, then replaced by its corrected file', () => {
    const [first, fill, again] = runsOf(D.mislabel);
    expect(holdsOf(first!)).toEqual(['story:backup_jobs']);
    expect(claimOf(first!, 'backup_jobs')!.head).toMatch(/^Last_state COMPLETED: /);
    expect(about(fill!)).toMatchObject({ outcome: 'derived', repair: { source: 'backup_jobs', missing: { all: true }, donor: { day: addDays(D.mislabel, -1), direction: 'before' } } });
    expect(about(again!).correction).toMatchObject({ sources: ['backup_jobs'] });
    expect(again!.at.slice(0, 10)).toBe(addDays(D.mislabel, 2));
    expect(holdsOf(again!)).toEqual(['correction:backup_jobs']);
    expect(decided(D.mislabel)).toEqual(['fill by ciso: applied', 'asis by ciso: applied']);
  });

  it('scene 6: the doubled TLS file sent again alone (Thu Mar 21), the empty EDR file filled back (Sat Mar 23), the empty access reviews left for the visitor (Wed Mar 27)', () => {
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

  it('keeps two layering stories: the dropped department held in silver and sent again (Fri Feb 16), one cause behind two controls told (Mon Mar 18)', () => {
    const [first, again] = runsOf(D.dissolve);
    expect(holdsOf(first!)).toEqual(['checks:app_owners', 'checks:org_chain']);
    expect(holdsOf(again!)).toEqual(['correction:hr_org_units']);
    expect(decided(D.dissolve)).toEqual(['asis by ciso: applied']);
    const [ca, ...more] = runsOf(D.ca);
    expect(more).toEqual([]);
    expect(about(ca!).outcome).toBe('ok');
    expect(claimOf(ca!, 'platform_impact')!.head).toMatch(/ca-int-2/);
  });

  it('records whose each decision is: the flow whose file held the day, the loads held with it carrying its decision (ADR 0025 §6)', () => {
    // A day's decisions as `load:flow`, the flow whose file or step held it (`own` the estate's), with the decision a
    // load that only followed carries.
    const whose = (day: string) => decisionsOf(day).map((e) => `${about(e).load?.source}:${about(e).flow?.id ?? 'own'}${about(e).carried ? ` with #${about(e).carried.seq}` : ''}`);
    // The units' file, sent again: HR organisation's to decide, and no one else is asked.
    expect(whose(D.dissolve)).toEqual(['hr_org_units:hr']);
    // The MFA export, kept back and then sent again: Evidence feeds', both times.
    expect(whose(D.empty)).toEqual(['mfa:feeds', 'mfa:feeds']);
    // The empty EDR file is Evidence feeds'; the posture's own load, the estate's, was held only because the file was,
    // and carries the file's decision by its entry and its leaf.
    const weekend = decisionsOf(D.weekend);
    expect(whose(D.weekend)).toEqual(['edr_coverage:feeds', `posture_wide:own with #${weekend[0]!.seq}`]);
    expect(about(weekend[1]!).carried.leaf).toBe(entryLeaf(weekend[0]!));
    expect(about(weekend[0]!).flow.hash).toMatch(/^[0-9a-f]{64}$/);
    // Every decision of the two months names a flow the estate reads, or carries one that does: the estate's own
    // files and steps led no held day.
    for (const d of month.entries.filter((e) => e.kind === 'decide')) expect(about(d).flow?.id ?? (about(d).carried ? 'carried' : 'own')).not.toBe('own');
  });

  it('publishes every other day as it arrived', () => {
    const story = new Set([...SCENES, D.ca]);
    for (const day of TOUR.filter((d) => !story.has(d))) {
      const runs = runsOf(day);
      expect(runs.map((r) => about(r).outcome), day).toEqual(['ok']);
    }
  });

  it('keeps the days between the scenes calm: the steady world leaves a few notes, each a learned check’s (amendment 1)', () => {
    // Every day a scene shows, or that follows from one (Thu Mar 7 is judged at the new level), is the scenes'; the other
    // 48 are the calendar's calm days. In the answer key's world, its rhythms (due dates gathered on the quarter's dates,
    // Patch Tuesday's findings falling due together) noted 13 of one month's; the steady world (amendment 1) leaves what
    // the judges' own false alarms make, five of the two months' when this was written: the forest, a day unlike the two
    // hundred before it on one of twenty files (three days), a share a row off its band on a small file (two), the
    // classifier once.
    const scenes = new Set([D.empty, D.capitals, D.normal, D.dissolve, D.migration, addDays(D.migration, 1), addDays(D.migration, 2), D.mislabel, D.double, D.weekend, D.ca, D.missing]);
    expect(TOUR.filter((d) => !scenes.has(d))).toHaveLength(48);
    const noted = TOUR.filter((d) => !scenes.has(d)).filter((d) => runsOf(d).some((r) => ((about(r).claims ?? []) as Loose[]).some((c) => c.state === 'wrong' || c.state === 'unusual')));
    expect(noted.length, noted.join(', ')).toBeLessThanOrEqual(6);
    for (const d of noted) for (const r of runsOf(d)) for (const c of (about(r).claims ?? []) as Loose[]) expect(c.state, `${d} ${String(c.source)}`).not.toBe('wrong');
  });
});
