/**
 * The browser regression dealt over CI's machines, and its data's store (ADR 0025, amended 2026-11-19;
 * tools/browser/shards.cjs, store.cjs, .github/workflows/ci.yml). Tools the tests don't otherwise reach, held here for
 * three things nothing else would say: a job dealt to no shard is a check nobody runs, a demo CI doesn't name has its
 * stop sets run by nobody, and data taken from a run that isn't the repository's own is data nobody here made.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

interface Job {
  id: string;
  set: string;
  app: string;
  device: string;
  sweep: string[];
  stops: number;
  weight: number;
  with: Record<string, number>;
}
interface Manifest {
  sizes: string[];
  apps: Record<string, { build: string[]; run: number }>;
  sets: Record<string, { app: string; runs: number; sizes?: string[]; with?: Record<string, number> }>;
}
const tools = createRequire(import.meta.url);
const plan = tools('../tools/browser/shards.cjs') as {
  jobsOf: (m: Manifest, stopsOf: (set: string) => number, o?: { sets?: string[]; demos?: string[]; sizes?: string[]; full?: boolean }) => Job[];
  shardsOf: (jobs: Job[], n: number) => Job[][];
  shardSaid: (text: string | null) => { k: number; n: number } | null;
  dealingProblems: (jobs: Job[], shards: Job[][]) => string[];
};
const store = tools('../tools/browser/store.cjs') as {
  pick: (artifacts: unknown[] | undefined) => { id: number; workflow_run: { id: number } } | null;
  nameOf: (demo: string, key: string, root?: string) => string;
};

const manifest = JSON.parse(readFileSync('tools/browser/sets.json', 'utf8')) as Manifest;
const stopsOf = (set: string): number => (JSON.parse(readFileSync(`tools/browser/stops/${set}.json`, 'utf8')) as unknown[]).length;
const ids = (jobs: Job[]) => jobs.map((j) => j.id).sort();

describe('the regression’s jobs', () => {
  it('are a job a set, at its smallest size and resized to the others; with full, a job a set and size', () => {
    const once = plan.jobsOf(manifest, stopsOf);
    expect(once.map((j) => j.set).sort()).toEqual(Object.keys(manifest.sets).sort());
    expect(once.find((j) => j.set === 'tour')).toMatchObject({ id: 'tour@phone', device: 'phone', sweep: ['tablet', 'tablet-wide', 'desktop', 'wide'], app: 'tour' });
    // A set held to some sizes only starts at the smallest of them.
    expect(once.find((j) => j.set === 'split')).toMatchObject({ device: 'tablet-wide', sweep: ['desktop', 'wide'] });
    const full = plan.jobsOf(manifest, stopsOf, { full: true });
    expect(full).toHaveLength(Object.values(manifest.sets).reduce((t, d) => t + (d.sizes ?? manifest.sizes).length, 0));
    expect(full.every((j) => j.sweep.length === 0)).toBe(true);
  });

  it('narrow to the sets on a demo, to the sizes asked, and to the sets named', () => {
    const onDemo = plan.jobsOf(manifest, stopsOf, { demos: ['signins'] });
    expect(onDemo.map((j) => j.set).sort()).toEqual(Object.entries(manifest.sets).filter(([, d]) => d.app === 'signins').map(([s]) => s).sort());
    // Every set is on one demo: the demos' jobs together are all of them, none twice.
    const each = Object.keys(manifest.apps).flatMap((a) => plan.jobsOf(manifest, stopsOf, { demos: [a] }));
    expect(ids(each)).toEqual(ids(plan.jobsOf(manifest, stopsOf)));
    expect(plan.jobsOf(manifest, stopsOf, { full: true, sizes: ['tablet'] }).map((j) => j.device)).not.toContain('desktop');
    expect(plan.jobsOf(manifest, stopsOf, { full: true, sizes: ['tablet'] }).map((j) => j.set)).not.toContain('split');
    expect(ids(plan.jobsOf(manifest, stopsOf, { sets: ['overview', 'tour@desktop'], full: true }))).toEqual(['overview@desktop', 'overview@phone', 'overview@tablet', 'overview@tablet-wide', 'overview@wide', 'tour@desktop'].sort());
    expect(() => plan.jobsOf(manifest, stopsOf, { sets: ['nope'] })).toThrow(/no set "nope"/);
  });

  it('weigh more for more runs of the engine, and for more stops', () => {
    const by = new Map(plan.jobsOf(manifest, stopsOf).map((j) => [j.set, j.weight]));
    expect(by.get('tour')!).toBeGreaterThan(by.get('overview')!);
    expect(by.get('follow')!).toBeGreaterThan(by.get('tiers')!);
    for (const w of by.values()) expect(w).toBeGreaterThan(0);
  });
});

describe('the jobs dealt into shards', () => {
  const choices: [string, Job[]][] = [
    ['every set once', plan.jobsOf(manifest, stopsOf)],
    ['every set at every size', plan.jobsOf(manifest, stopsOf, { full: true })],
    ...Object.keys(manifest.apps).map((a): [string, Job[]] => [`the sets on ${a}`, plan.jobsOf(manifest, stopsOf, { demos: [a] })]),
  ];

  it('puts every job in exactly one shard, however many shards', () => {
    for (const [what, jobs] of choices) {
      for (let n = 1; n <= 8; n++) {
        const shards = plan.shardsOf(jobs, n);
        expect(shards, what).toHaveLength(n);
        expect(plan.dealingProblems(jobs, shards), `${what}, ${n} shards`).toEqual([]);
        expect(ids(shards.flat()), `${what}, ${n} shards`).toEqual(ids(jobs));
      }
    }
  });

  it('deals the same jobs the same way whatever order they come in', () => {
    const jobs = plan.jobsOf(manifest, stopsOf);
    const turned = [...jobs].reverse();
    const mixed = [...jobs].sort((a, b) => (a.set.split('').reverse().join('') < b.set.split('').reverse().join('') ? -1 : 1));
    for (const n of [2, 3, 4, 5]) {
      const dealt = plan.shardsOf(jobs, n).map(ids);
      expect(plan.shardsOf(turned, n).map(ids)).toEqual(dealt);
      expect(plan.shardsOf(mixed, n).map(ids)).toEqual(dealt);
    }
  });

  it('keeps the shards within one job’s weight of each other', () => {
    for (const [what, jobs] of choices) {
      if (!jobs.length) continue;
      const heaviest = Math.max(...jobs.map((j) => j.weight));
      for (const n of [2, 3, 4, 6]) {
        const weights = plan.shardsOf(jobs, n).map((s) => s.reduce((t, j) => t + j.weight, 0));
        expect(Math.max(...weights) - Math.min(...weights), `${what}, ${n} shards`).toBeLessThanOrEqual(heaviest + 1e-9);
      }
    }
  });

  it('says what is wrong with a dealing that drops a job or holds one twice', () => {
    const jobs = plan.jobsOf(manifest, stopsOf, { demos: ['estate'] });
    const [a, b] = plan.shardsOf(jobs, 2) as [Job[], Job[]];
    expect(plan.dealingProblems(jobs, [a.slice(1), b])).toEqual([`${a[0]!.id} is in no shard`]);
    expect(plan.dealingProblems(jobs, [a, [...b, a[0]!]])).toEqual([`${a[0]!.id} is in shards 1 and 2`]);
    expect(plan.dealingProblems(jobs.slice(1), [a, b]).join()).toMatch(/wasn't dealt/);
  });

  it('reads a shard as said on the command line', () => {
    expect(plan.shardSaid('2/4')).toEqual({ k: 2, n: 4 });
    expect(plan.shardSaid('1/1')).toEqual({ k: 1, n: 1 });
    for (const bad of ['0/4', '5/4', '2', 'a/b', '', null]) expect(plan.shardSaid(bad)).toBeNull();
  });
});

describe('CI’s demos (.github/workflows/ci.yml)', () => {
  // The demos CI names, a line each: `- { demo: tour, data: '["tour", "feeds"]', shards: '[1, 2]' }`.
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const named = [...ci.matchAll(/^\s*- \{ demo: ([a-z-]+), data: '(\[[^']*\])', shards: '(\[[^']*\])'[^}]*\}\s*$/gm)].map((m) => ({ demo: m[1]!, data: JSON.parse(m[2]!) as string[], shards: JSON.parse(m[3]!) as number[] }));
  const withSets = [...new Set(Object.values(manifest.sets).map((d) => d.app))].sort();

  it('names every demo that has stop sets, once: a demo left out would have its sets run by nobody', () => {
    expect(named.map((d) => d.demo).sort()).toEqual(withSets);
  });

  it('makes for each the data of the demo and of every demo its sets go to', () => {
    for (const d of named) {
      const needs = new Set([d.demo, ...Object.values(manifest.sets).filter((s) => s.app === d.demo).flatMap((s) => Object.keys(s.with ?? {}))]);
      expect([...d.data].sort(), d.demo).toEqual([...needs].sort());
    }
  });

  it('numbers each demo’s shards from one, with no more shards than it has sets', () => {
    for (const d of named) {
      expect(d.shards, d.demo).toEqual(d.shards.map((_, i) => i + 1));
      expect(d.shards.length, d.demo).toBeGreaterThanOrEqual(1);
      expect(d.shards.length, d.demo).toBeLessThanOrEqual(Object.values(manifest.sets).filter((s) => s.app === d.demo).length);
    }
  });

  it('replays at every size, on main, the same demos, at every size but the one the pass above starts at', () => {
    // The `sizes` job's own lists: `demo: [signins, estate, larkspur, tour]` and `size: [tablet, …]`.
    const list = (key: string) => (new RegExp(`^\\s+${key}: \\[([a-z, -]+)\\]\\s*$`, 'm').exec(ci)?.[1] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    expect(list('demo').sort()).toEqual(withSets);
    expect(list('size')).toEqual(manifest.sizes.slice(1));
    // Each of its jobs has something to run but where a set is held to some sizes only.
    for (const demo of list('demo')) expect(plan.jobsOf(manifest, stopsOf, { demos: [demo], full: true, sizes: ['desktop'] }).length, demo).toBeGreaterThan(0);
  });

  it('lists every stops file in the manifest, so each is some demo’s', () => {
    const files = readdirSync('tools/browser/stops').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
    expect(files).toEqual(Object.keys(manifest.sets).sort());
  });
});

describe('the store’s choice of an artifact', () => {
  const run = (id: number, head = 1) => ({ id, repository_id: 1, head_repository_id: head, head_branch: 'x', head_sha: 'y' });
  const artifact = (id: number, created: string, more: Record<string, unknown> = {}) => ({ id, name: 'data-tour-k', expired: false, created_at: created, size_in_bytes: 1, workflow_run: run(id * 10), ...more });

  it('takes the newest that hasn’t expired', () => {
    expect(store.pick([artifact(1, '2026-11-01T00:00:00Z'), artifact(3, '2026-11-03T00:00:00Z'), artifact(2, '2026-11-02T00:00:00Z')])?.id).toBe(3);
    expect(store.pick([artifact(1, '2026-11-01T00:00:00Z'), artifact(3, '2026-11-03T00:00:00Z', { expired: true })])?.id).toBe(1);
  });

  it('never takes what a fork’s run made, or an artifact that doesn’t say whose run made it', () => {
    expect(store.pick([artifact(1, '2026-11-01T00:00:00Z'), artifact(2, '2026-11-02T00:00:00Z', { workflow_run: run(20, 99) })])?.id).toBe(1);
    expect(store.pick([artifact(2, '2026-11-02T00:00:00Z', { workflow_run: run(20, 99) })])).toBeNull();
    expect(store.pick([artifact(2, '2026-11-02T00:00:00Z', { workflow_run: null })])).toBeNull();
    expect(store.pick([artifact(2, '2026-11-02T00:00:00Z', { workflow_run: { id: 20 } })])).toBeNull();
    expect(store.pick([artifact(2, '2026-11-02T00:00:00Z', { expired: undefined })])).toBeNull();
  });

  it('finds none where there is none', () => {
    expect(store.pick([])).toBeNull();
    expect(store.pick(undefined)).toBeNull();
  });

  it('names a demo’s data by the demo, the key it is kept by, and the place it stands in', () => {
    const key = 'a'.repeat(64);
    expect(store.nameOf('tour', key, '/work/smaltfl/data')).toMatch(new RegExp(`^data-tour-${key}-[0-9a-f]{8}$`));
    // The generators write full paths into the data: made somewhere else, it is another artifact.
    expect(store.nameOf('tour', key, '/work/smaltfl/data')).toBe(store.nameOf('tour', key, '/work/smaltfl/data'));
    expect(store.nameOf('tour', key, '/elsewhere/data')).not.toBe(store.nameOf('tour', key, '/work/smaltfl/data'));
    expect(store.nameOf('feeds', key, '/work/smaltfl/data')).not.toBe(store.nameOf('tour', key, '/work/smaltfl/data'));
  });
});
