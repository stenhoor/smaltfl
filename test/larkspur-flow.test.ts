/**
 * The Larkspur estate through the engine (ADR 0020 §5, the answer key), layer by layer as the slices land. Slice 2:
 * bronze, every file judged as it arrives. Six months of history (September to February, enough for every SLA's late
 * share to be judged), then March run day by day as the app runs it, at the tests' scale (about 600 applications).
 *
 * Bronze holds a planted day by the check that should catch it, and nothing else: an empty file by its amount, yesterday's
 * file again by `fresh`, a column gone by the schema, a WAF in monitor mode and a controller down by their written bands, rows out of scope and missing
 * by the scope, rows twice by the key, and the one SLA day that is real by the due check. Where the answer key says a
 * file only warns (new words from the scanner, a reinstall's findings, a scanner that couldn't log in), the day
 * publishes; the look-alikes are told as usual. Slow (vitest.config.ts SLOW): about two and a half minutes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkOf } from '../src/core/gates.js';
import type { Finding } from '../src/core/news.js';
import { addDays, LARKSPUR_PLANTED } from './fixtures/larkspur.js';
import { larkspurWorld, type LarkspurWorld } from './helpers/larkspur-world.js';

const P = LARKSPUR_PLANTED;
let w: LarkspurWorld;

beforeAll(async () => {
  w = await larkspurWorld({ apps: 650, baseFrom: '2023-09-01', baseTo: '2024-02-29', loadsTo: '2024-03-31' });
}, 900_000);
afterAll(() => w?.close());

/** A file's story on a day, as the page told it. */
const story = (day: string, file: string) => w.stories.get(day)![file]!;
const findingsOf = (day: string, file: string): Finding[] => (story(day, file).findings as unknown as ({ finding?: Finding } & Finding)[]).map((t) => t.finding ?? t);
/** What holds a day, by file: the check of the story's first finding that is something wrong, or `refused` for a file
 * the engine couldn't read as declared. */
const held = (day: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [file, c] of Object.entries(w.claims.get(day)!)) {
    if (!c) out[file] = 'refused';
    else if (c.state === 'wrong') {
      // The story's cause where it names one, else its first finding that is something wrong.
      const lead = (story(day, file).cause as Finding | null) ?? findingsOf(day, file).find((f) => f.severity === 'alert');
      out[file] = lead ? (checkOf(lead.kind) ?? 'none') : 'none';
    }
  }
  return out;
};
const MARCH = Array.from({ length: 31 }, (_, i) => addDays('2024-03-01', i));

describe('bronze: each file judged as it arrives (ADR 0020 §5)', () => {
  const HELD: Record<string, Record<string, string>> = {
    [P.empty]: { mfa: 'amount' },
    [P.stale]: { backup_jobs: 'fresh' },
    [P.column]: { logging_coverage: 'refused' },
    [P.monitor]: { waf: 'values' },
    [P.scopeCreep]: { waf: 'scope' },
    [P.controller]: { backup_jobs: 'values' },
    [P.double]: { tls: 'reconcile' },
    [addDays(P.drLate, 1)]: { dr_exercises: 'due' },
    [P.scopeLoss]: { tls: 'scope' },
  };

  it('runs every day of March', () => {
    for (const day of MARCH) expect(w.results.get(day), day).not.toBeInstanceOf(Error);
  });

  it('holds each planted day a written check should catch, by that check, and nothing else that day', () => {
    for (const [day, want] of Object.entries(HELD)) expect(held(day), day).toEqual(want);
  });

  it('holds no other day of March', () => {
    for (const day of MARCH.filter((d) => !HELD[d])) expect(held(day), day).toEqual({});
  });

  it('says what it found in words a reader can check', () => {
    expect(w.claims.get(P.empty)!.mfa!.head).toBe('Almost no apps: 0');
    expect(w.claims.get(P.stale)!.backup_jobs!.head).toBe('The same file as Tue 5’s');
    expect(w.claims.get(P.stale)!.backup_jobs!.file).toMatchObject({ previous: { slot: addDays(P.stale, -1) } });
    expect(w.claims.get(P.monitor)!.waf!.head).toMatch(/^Status fail: \d+(\.\d)?% \(band 0%–15%\)$/);
    expect(w.claims.get(P.scopeCreep)!.waf!.head).toMatch(/^\d+ apps out of scope$/);
    expect(w.claims.get(P.controller)!.backup_jobs!.head).toMatch(/^Status not_assessed: \d+(\.\d)?% \(band 0%–5%\)$/);
    expect(w.claims.get(P.double)!.tls!.head).toMatch(/^\d+ apps repeat a key$/);
    expect(w.claims.get(addDays(P.drLate, 1))!.dr_exercises!.head).toMatch(/^Late: \d+ of \d+ due$/);
    expect(w.claims.get(P.scopeLoss)!.tls!.head).toMatch(/^\d+ in scope with no app$/);
  });

  it('warns and publishes where the answer key says a file only warns', () => {
    const unusual = (day: string, file: string) => w.claims.get(day)![file]!.state;
    // Tue 5: new words from the scanner, which silver normalises.
    expect(unusual(P.capitals, 'findings')).toBe('unusual');
    expect(findingsOf(P.capitals, 'findings').filter((f) => f.kind === 'new').map((f) => f.columns?.[0])).toEqual(expect.arrayContaining(['severity', 'status']));
    // Sat 9: the reinstall's findings, all new today.
    expect(unusual(P.reinstall, 'findings')).toBe('unusual');
    // Sat 16 and Sun 17: the scanner that couldn't log in, above the share of such scans the ontology expects.
    for (const d of [P.credentials, P.credentials2]) {
      expect(unusual(d, 'findings'), d).toBe('unusual');
      expect(w.claims.get(d)!.findings!.head, d).toMatch(/^Credentialed no: \d+(\.\d)?% \(band 0%–2%\)$/);
    }
  });

  it('tells the look-alikes as usual: the pentests due on Fri 15 and the quarter’s access reviews due on Fri 29', () => {
    const due = (day: string, file: string) => findingsOf(day, file).find((f) => f.kind === 'due');
    expect(due(addDays('2024-03-15', 1), 'pentest_schedule')).toMatchObject({ severity: 'note' });
    expect(due(addDays('2024-03-15', 1), 'pentest_schedule')!.title).toMatch(/\(usually \d+(\.\d)?%\)$/);
    expect(due(addDays('2024-03-29', 1), 'access_reviews')).toMatchObject({ severity: 'note' });
  });
});
