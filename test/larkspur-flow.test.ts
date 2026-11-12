/**
 * The Larkspur estate through the engine (ADR 0020 §5, the answer key), layer by layer as the slices land. Six months of
 * the files' history (September to February, enough for every SLA's late share to be judged) and six weeks of the
 * watched steps' (each a run of the flow on a base day), then March run day by day as the app runs it, at the tests'
 * scale (about 600 applications).
 *
 * Slice 2, bronze: a planted day is held by the check that should catch it, and nothing else: an empty file by its
 * amount, yesterday's file again by `fresh`, a column gone by the schema, a WAF in monitor mode and a controller down by
 * their written bands, rows out of scope and missing by the scope, rows twice by the key, and the one SLA day that is
 * real by the due check. Where the answer key says a file only warns (new words from the scanner, a reinstall's
 * findings, a scanner that couldn't log in), the day publishes; the look-alikes are told as usual.
 *
 * Slice 3, silver: key rotation passing where encryption fails holds the posture by its needs rule; a department dropped
 * or a chain that loops holds what reads the chain, and the per-application statuses publish; the CMDB's duplicates,
 * the exceptions that expired, the cloud's unregistered tags, the certificate authority behind two controls and the new
 * control with no evidence are told as unusual, and publish.
 *
 * Slice 4, gold: Control Posture v1 keeps every contract on every day it is built; what reads the chain holds where it
 * breaks, the scorecards and facts publish; the vulnerability SLA the scanner couldn't assess is left out of the scores
 * with coverage falling beside them, and the new control's missing evidence lowers coverage, not the score. Over the
 * month: the reorg told in gold as following silver's owner chains (Q-173), the handover's failures with it, the push in
 * what is failing (no day says it: Q-178), the freeze's overdue vulnerabilities within what the failures vary by, and
 * the reorg's leftovers worth knowing. Slow (vitest.config.ts SLOW): about eight minutes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkOf } from '../src/core/gates.js';
import type { Finding } from '../src/core/news.js';
import { addDays, LARKSPUR_GOLD, LARKSPUR_PLANTED, LARKSPUR_SILVER } from './fixtures/larkspur.js';
import { larkspurHolds, larkspurWorld, type LarkspurWorld } from './helpers/larkspur-world.js';

const P = LARKSPUR_PLANTED;
const S = LARKSPUR_SILVER;
const G = LARKSPUR_GOLD;
let w: LarkspurWorld;
/** Each day's group roll-up and coverage of the vulnerability SLA, read from gold while it is the day's. */
const gold = new Map<string, { score: number | null; coverage: number | null; vulnAssessed: number; vulnFailing: number }>();

beforeAll(async () => {
  w = await larkspurWorld({
    apps: 650, baseFrom: '2023-09-01', baseTo: '2024-02-29', loadsTo: '2024-03-31',
    afterRun: async (db, day, r) => {
      if (!r.published.includes('org_posture') || !r.published.includes('fact_control_status')) return;
      const [score, coverage] = (await db.queryAsync("SELECT score, coverage FROM org_posture WHERE level = 'group'")).rows[0]! as [number | null, number | null];
      const assessed = Number((await db.queryAsync("SELECT count(*) FROM fact_control_status WHERE control_id = 'vuln_sla' AND status <> 'not_assessed'")).rows[0]![0]);
      const failingVuln = Number((await db.queryAsync("SELECT count(*) FROM fact_control_status WHERE control_id = 'vuln_sla' AND status = 'fail'")).rows[0]![0]);
      gold.set(day, { score, coverage, vulnAssessed: assessed, vulnFailing: failingVuln });
    },
  });
}, 900_000);
afterAll(() => w?.close());

/** A file's story on a day, as the page told it. */
const story = (day: string, file: string) => w.stories.get(day)![file]!;
const findingsOf = (day: string, file: string): Finding[] => (story(day, file).findings as unknown as ({ finding?: Finding } & Finding)[]).map((t) => t.finding ?? t);
/** What holds a day, by file or by watched step: the check of the story's first finding that is something wrong, or
 * `refused` for a file the engine couldn't read as declared. */
const held = (day: string, among: 'files' | 'steps' = 'files'): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [file, c] of Object.entries(w.claims.get(day)!)) {
    if (w.steps.includes(file) !== (among === 'steps')) continue;
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
    expect(Object.fromEntries(Object.keys(HELD).map((d) => [d, held(d)]))).toEqual(HELD);
  });

  it('holds no other day of March', () => {
    const others = MARCH.filter((d) => !HELD[d]);
    expect(Object.fromEntries(others.map((d) => [d, held(d)]))).toEqual(Object.fromEntries(others.map((d) => [d, {}])));
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

describe('silver: the company conformed, and the rules applied (ADR 0020 §5)', () => {
  const result = (day: string) => w.result(day);
  /** A step's claim of a day, as the engine told it. */
  const said = (day: string, step: string) => w.claims.get(day)![step]!;
  /** The checks that hold a day, each once (a check on a step that reads several watched files holds each load). */
  const checkHolds = (day: string) => [...new Set(larkspurHolds(result(day)).filter((h) => h.startsWith('checks:')))];
  const node = (day: string, origin: string) => result(day).manifest.nodes.find((n) => n.origin === origin)!;
  const STEPS_HELD: Record<string, Record<string, string>> = {
    [S.contradiction]: { posture_wide: 'needs' },
    // The doubled TLS file flows through: silver's own key (one result an application and control) says so too, and
    // so does gold's on what is failing.
    [P.double]: { effective: 'reconcile', failing_by_unit: 'reconcile' },
  };

  it('watches the steps silver and gold judge, each with a history from runs of the flow', () => {
    expect(w.steps).toEqual(['apps', 'effective', 'posture_wide', 'platform_impact', 'shadow_assets', 'app_owners', 'dim_app', 'failing_by_unit']);
    for (const st of w.steps) expect(w.bases[st]!.days.length, st).toBe(42);
  });

  it('holds a step only where a written rule of silver’s is broken', () => {
    expect(Object.fromEntries(MARCH.map((d) => [d, held(d, 'steps')]))).toEqual(Object.fromEntries(MARCH.map((d) => [d, STEPS_HELD[d] ?? {}])));
  });

  it('holds the posture where key rotation passes while encryption fails (Fri 8), and publishes the statuses', () => {
    // 17 at the tests' scale: the remediation push (ADR 0020 §5, all March) lowers one of them its encryption failure.
    expect(said(S.contradiction, 'posture_wide').head).toBe('17 applications: key_rotation status pass needs encryption not fail');
    expect(result(S.contradiction).published).toEqual(expect.arrayContaining(['apps', 'coverage', 'effective', 'remediation']));
    expect(result(S.contradiction).published).not.toContain('posture_wide');
  });

  it('holds what reads the chain where a department is dropped (Mon 18) or a chain loops (Thu 28), and publishes the statuses', () => {
    for (const day of [S.dissolve, S.loop]) {
      expect(checkHolds(day), day).toEqual(['checks:app_owners', 'checks:org_chain']);
      // What reads the chain, through gold: the owner chains and the dimensions and roll-ups built on them.
      expect(result(day).holds.find((h) => h.origin === 'org_chain')!.reaches, day).toEqual(['app_owners', 'dim_app', 'dim_org', 'failing_by_unit', 'org_chain', 'org_posture']);
      expect(result(day).published, day).toEqual(expect.arrayContaining(['apps', 'coverage', 'effective', 'platform_impact', 'posture_wide', 'remediation', 'shadow_assets']));
    }
    expect(result(S.dissolve).holds.find((h) => h.origin === 'org_chain')!.said).toBe('expectations failed: one_root (4 rows)');
    expect(result(S.loop).holds.find((h) => h.origin === 'org_chain')!.said).toBe('expectations failed: no_loop (6 rows)');
    // Every application of the dropped department's teams is Unassigned, kept and not dropped.
    expect(result(S.dissolve).holds.find((h) => h.origin === 'app_owners')!.said).toMatch(/^expectations failed: owner_chain \(\d+ rows\)$/);
    expect(node(S.dissolve, 'app_owners').rows).toBe(node(S.dissolve, 'apps').rows);
  });

  it('holds no organisational rule on any other day of March: the extract carries the fix the day after', () => {
    for (const day of MARCH.filter((d) => d !== S.dissolve && d !== S.loop)) expect(checkHolds(day).filter((h) => h === 'checks:org_chain' || h === 'checks:app_owners'), day).toEqual([]);
  });

  it('conforms the CMDB’s duplicates (Wed 20): bronze calm, silver keeps the newest of each and warns of two owners', () => {
    expect(held(S.duplicates)).toEqual({});
    // A quarter of the answer key's 60 and 12, at a quarter of its applications.
    expect(node(S.duplicates, 'cmdb_apps').rows! - node(S.duplicates, 'apps').rows!).toBe(15);
    expect(node(S.duplicates, 'apps_clean').expectations!.rules.find((r) => r.name === 'one_owner')!.failed).toBe(3);
    expect(said(S.duplicates, 'apps')).toMatchObject({ state: 'unusual', head: 'Owner_conflict yes: 0.5% (band 0%–0%)' });
  });

  it('warns of the exceptions that expired unrenewed (Fri 15): failures with no change in the raw data', () => {
    expect(held(S.expiries)).toEqual({});
    expect(said(S.expiries, 'effective').state).toBe('unusual');
    expect(said(S.expiries, 'effective').head).toMatch(/^Reason exception_expired: /);
  });

  it('warns of the cloud resources nobody registered (Sat 23)', () => {
    // The DR exercises due the day before are late the same day, which bronze holds.
    expect(held(S.shadow)).toEqual({ dr_exercises: 'due' });
    expect(said(S.shadow, 'shadow_assets')).toMatchObject({ state: 'unusual' });
    expect(said(S.shadow, 'shadow_assets').head).toMatch(/^More tags: \d+/);
  });

  it('tells the certificate authority behind TLS and logging failing together (Mon 25), a note at the tests’ scale', () => {
    expect(held(S.ca)).toEqual({});
    expect(findingsOf(S.ca, 'platform_impact').find((f) => f.values?.[0] === '"ca-int-2"')).toMatchObject({ kind: 'share', title: expect.stringMatching(/^Platform_id ca-int-2: /) });
  });

  it('says the new control’s missing evidence as no data, not as failing (Wed 27), and publishes', () => {
    expect(held(S.sbom)).toEqual({});
    expect(findingsOf(S.sbom, 'effective').map((f) => f.title)).toContainEqual(expect.stringMatching(/^Status no_data: /));
    expect(result(S.sbom).published).toEqual(expect.arrayContaining(['coverage', 'effective']));
  });

  it('keeps each finding’s earliest date through the reinstall (Sat 9): silver calm where bronze warns', () => {
    expect(said(P.reinstall, 'posture_wide').state).not.toBe('wrong');
    expect(said(P.reinstall, 'effective').state).toBe('calm');
  });
});

describe('gold: Control Posture v1, its contracts and its gates (ADR 0020 §4, §5)', () => {
  const result = (day: string) => w.result(day);
  const GOLD = ['app_scorecard', 'dim_app', 'dim_control', 'dim_org', 'exceptions_register', 'fact_control_status', 'fact_finding', 'failing_by_unit', 'org_posture', 'remediation_queue'];
  const CHAIN = ['dim_app', 'dim_org', 'failing_by_unit', 'org_posture'];

  it('publishes every gold dataset on a day nothing upstream holds', () => {
    for (const day of ['2024-03-01', '2024-03-02', P.capitals, P.reinstall, '2024-03-11', S.expiries, S.duplicates, S.sbom]) expect(GOLD.filter((g) => !result(day).published.includes(g)), day).toEqual([]);
  });

  it('keeps every contract on every day of March it was built, and holds on its own keys only where the TLS rows came twice', () => {
    for (const day of MARCH) {
      const r = result(day);
      if (Object.keys(r.manifest.outputs).length === 0) continue; // nothing was built: a refused file
      const nodes = r.manifest.nodes.filter((n) => GOLD.includes(n.origin) && n.contract);
      expect(nodes.map((n) => n.origin).sort(), day).toEqual(GOLD);
      for (const n of nodes) expect(n.contract, `${day} ${n.origin}`).toEqual({ version: '1.0.0', missing: [], extra: [], retyped: [], blank: [], outside: [] });
      const own = [...new Set(r.holds.filter((h) => GOLD.includes(h.origin)).map((h) => `${h.origin}: ${h.said}`))];
      if (day === P.double) {
        // The doubled rows flow through to gold, whose own keys say so too (one status an application and control): the
        // run's count where nothing watches the node, the story's where something does (`failing_by_unit`).
        expect(own.map((x) => x.split(':')[0])).toEqual(expect.arrayContaining(['fact_control_status', 'failing_by_unit']));
        for (const x of own) expect(x, day).toMatch(/: (rows don't reconcile: \d+ rows|\d+ failures) repeat a key/);
      } else expect(own, day).toEqual([]);
    }
  });

  it('holds what reads the chain where it breaks (Mon 18, Thu 28), and publishes the scorecards and the facts', () => {
    for (const day of [S.dissolve, S.loop]) {
      expect(CHAIN.filter((g) => result(day).published.includes(g)), day).toEqual([]);
      expect(GOLD.filter((g) => !CHAIN.includes(g) && !result(day).published.includes(g)), day).toEqual([]);
    }
  });

  it('leaves the vulnerability SLA out of the scores where the scanner couldn’t log in (Sat 16, Sun 17): coverage falls beside the score', () => {
    const before = lastBefore(P.credentials);
    for (const day of [P.credentials, P.credentials2]) {
      const g = gold.get(day)!;
      expect(g.vulnAssessed, day).toBeLessThan(before.vulnAssessed - 40);
      expect(g.coverage!, day).toBeLessThan(before.coverage! - 1);
    }
  });

  /** The last day before `day` gold published. */
  const lastBefore = (day: string) => {
    for (let d = addDays(day, -1); d >= '2024-03-01'; d = addDays(d, -1)) if (gold.has(d)) return gold.get(d)!;
    throw new Error(`no gold published before ${day}`);
  };

  it('says the new control’s missing evidence as coverage, not as failing (Wed 27): the score holds', () => {
    const before = lastBefore(S.sbom);
    const g = gold.get(S.sbom)!;
    expect(g.coverage!).toBeLessThan(before.coverage! - 5);
    expect(Math.abs(g.score! - before.score!)).toBeLessThan(1);
  });
});

describe('gold over the month: the reorg, the handover, the push and the freeze (ADR 0020 §5, slice 4)', () => {
  const result = (day: string) => w.result(day);
  const said = (day: string, step: string) => w.claims.get(day)![step]!;
  const told = (day: string, step: string) => {
    const t = w.stories.get(day)?.[step];
    if (!t) return [];
    return [...(t.cause ? [t.cause] : []), ...t.stories, ...t.more, ...t.follows, ...t.sameDay, ...t.absorbed, ...t.notes];
  };
  // Read once the world is built: the business unit the reorg's teams left, and the one they joined.
  const reorg = () => w.estate.trouble.find((t) => t.kind === 'reorg') as { from: string; to: string };

  it('tells the reorg (Mon 11) in gold as following the owner chains it comes from, and publishes', () => {
    expect(said(S.reorg, 'app_owners').state).toBe('unusual');
    for (const step of ['dim_app', 'failing_by_unit']) {
      expect(said(S.reorg, step).state, step).toBe('unusual');
      const moved = told(S.reorg, step).filter((f) => f.columns?.[0] === 'business_unit_id');
      expect(moved.map((f) => f.values?.[0]).sort(), step).toEqual([JSON.stringify(reorg().from), JSON.stringify(reorg().to)].sort());
      for (const f of moved) expect(f.because, `${step} ${f.key}`).toBe('upstream:app_owners');
    }
    expect(result(S.reorg).holds).toEqual([]);
  });

  it('says the handover’s failures, the moved teams’ new business unit above its usual share, as following the reorg', () => {
    const f = told(addDays(G.handover, 1), 'failing_by_unit').find((x) => x.values?.[0] === JSON.stringify(reorg().to));
    expect(f).toMatchObject({ because: 'upstream:app_owners' });
  });

  it('shows the push in what is failing, its business unit’s share falling by two fifths, and no day says so (Q-178)', () => {
    const push = JSON.stringify(w.estate.planted.push!);
    const share = (day: string) => {
      const m = w.measures.get(day)!.failing_by_unit!;
      return (m.values.business_unit_id!.find(([v]) => v === push)?.[1] ?? 0) / m.rows;
    };
    expect(share(G.pushUntil)).toBeLessThan(0.6 * share(addDays(G.push, 1)));
    // Day by day it moves within reason: the judges compare a day with the same weekday over the weeks before it, which
    // move with it.
    for (const day of MARCH) expect(told(day, 'failing_by_unit').filter((f) => f.values?.[0] === push && f.was !== 'note'), day).toEqual([]);
  });

  it('shows the freeze’s overdue vulnerabilities rising, within what the failures vary by: calm or notes, published', () => {
    expect(gold.get(G.freezeUntil)!.vulnFailing).toBeGreaterThan(gold.get(addDays(G.freeze, -1))!.vulnFailing);
    // Nothing gold says holds a day of the freeze. Tue 26 (the TLS file's scope, bronze) and Thu 28 (the loop, silver)
    // are held upstream, and their holds reach it; every other day publishes it, calm or with notes.
    const freeze = MARCH.filter((d) => d >= G.freeze && d <= G.freezeUntil);
    for (const d of freeze) expect(result(d).holds.filter((h) => h.origin === 'failing_by_unit'), d).toEqual([]);
    expect(freeze.filter((d) => !result(d).published.includes('failing_by_unit'))).toEqual([P.scopeLoss, S.loop]);
    for (const d of freeze.filter((x) => x !== P.scopeLoss && x !== S.loop)) expect(['calm', 'notes'], d).toContain(said(d, 'failing_by_unit').state);
    // The reorg's leftovers, the few applications still in the business unit it emptied, failing again after two weeks
    // of none, are worth knowing, not unusual.
    const left = JSON.stringify(reorg().from);
    const above = (f: Finding) => f.values?.[0] === left && f.kind === 'share' && f.value !== undefined && !!f.range && f.value > f.range.high;
    const back = MARCH.filter((d) => d > S.reorg && told(d, 'failing_by_unit').some(above));
    expect(back.length).toBeGreaterThan(0);
    for (const d of back) expect(told(d, 'failing_by_unit').find(above)!.severity, d).toBe('note');
  });
});
