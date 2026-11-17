/**
 * A change followed, said and tested (ADR 0025 §7): whose a change is, which flows follow it, what differs between two
 * versions of a flow and a test's days in a sentence (src/core/follow.ts); and a read flow's own document with the
 * changes made to it (src/core/attribute.ts). On Larkspur's five flows.
 */
import { describe, expect, it } from 'vitest';
import type { ChangeSet, FlowDocument, RuleEdit } from '../src/core/document.js';
import { attributeChanges, editTargets, ownWithEdits, withOwnChanges } from '../src/core/attribute.js';
import { changeFlows, diffEmpty, diffLines, flowChanges, flowDiff, followersOf, pinProblem, testCount, testSaid, type DayTest } from '../src/core/follow.js';
import { propertyOf } from '../src/core/ontology.js';
import { inForce } from '../src/core/inforce.js';
import { flowHash } from '../src/core/plan.js';
import { loadFlowDir } from './helpers/notebooks.js';

const dir = new URL('../examples/larkspur/', import.meta.url);
const own = (id: string) => loadFlowDir(new URL(`${id}/`, dir));
const change = (id: string, edits: RuleEdit[], from = '2024-03-18'): ChangeSet => ({ id, from, recorded: '2024-03-15T09:00:00.000Z', by: 'owner', why: 'tested', edits });
/** The WAF's blocking band widened: an edit about a file of Evidence feeds. */
const band: RuleEdit = { op: 'acceptBand', source: 'waf', band: { column: 'mode', value: 'block', share: [0.5, 1] } };
/** The register's tier renamed: an edit about a file of Inventory. */
const rename: RuleEdit = { op: 'nameColumn', file: 'cmdb_apps', column: 'tier', change: { title: 'Criticality tier' } };
/** A check of the posture product's own switched off. */
const check: RuleEdit = { op: 'setCheck', node: 'posture_wide', check: 'pairs', mode: 'off' };

describe('whose a change is', () => {
  it('names the dataset each edit is about', () => {
    expect(editTargets(band)).toEqual(['waf']);
    expect(editTargets(rename)).toEqual(['cmdb_apps']);
    expect(editTargets(check)).toEqual(['posture_wide']);
    expect(editTargets({ op: 'setRule', rule: { id: 'r1', file: 'tls', column: 'issuer', kind: 'required', action: 'flag' } })).toEqual(['tls']);
    expect(editTargets({ op: 'switchRule', file: 'tls', id: 'r1', on: false })).toEqual(['tls']);
    expect(editTargets({ op: 'declareKey', file: 'platforms', column: 'platform_id' })).toEqual(['platforms']);
    expect(editTargets({ op: 'useVersion', changes: [] })).toEqual([]);
  });

  it('is the flow’s whose file or step it is about, the document’s own for its own and for a version taken whole', async () => {
    const doc = await loadFlowDir(dir);
    expect(changeFlows(doc, change('c1', [band]))).toEqual(['feeds']);
    expect(changeFlows(doc, change('c2', [rename]))).toEqual(['inventory']);
    expect(changeFlows(doc, change('c3', [check]))).toEqual(['']);
    expect(changeFlows(doc, change('c4', [{ op: 'useVersion', changes: [] }]))).toEqual(['']);
    // Edits about two flows' files: both, in the document's order, its own last.
    const order = doc.flows!.map((f) => f.id);
    expect(changeFlows(doc, change('c5', [check, band, rename]))).toEqual([...order.filter((f) => f === 'feeds' || f === 'inventory'), '']);
    // A flow that reads none: every change is its own.
    expect(changeFlows({}, change('c6', [band]))).toEqual(['']);
  });

  it('is followed by every flow that reads its flow, near or far, and by no other', async () => {
    const doc = await loadFlowDir(dir);
    const order = doc.flows!.map((f) => f.id);
    const inOrder = (xs: string[]) => [...order.filter((f) => xs.includes(f)), ...(xs.includes('') ? [''] : [])];
    // Inventory is read by the feeds (for a scope), by Applications and by the posture product.
    expect(followersOf(doc, ['inventory'])).toEqual(inOrder(['feeds', 'applications', '']));
    expect(followersOf(doc, ['feeds'])).toEqual(inOrder(['applications', '']));
    expect(followersOf(doc, ['hr'])).toEqual(inOrder(['applications', '']));
    expect(followersOf(doc, ['applications'])).toEqual(['']);
    expect(followersOf(doc, [''])).toEqual([]);
    expect(followersOf(doc, ['hr', 'feeds'])).toEqual(inOrder(['applications', '']));
  });

  it('lists what bears on a flow: its own changes, and those of the flows it reads', async () => {
    const doc = await loadFlowDir(dir);
    const changes = [change('c1', [band]), change('c2', [rename]), change('c3', [check])];
    const bearing = (flow: string) => flowChanges(doc, flow, changes).map((x) => [x.change.id, x.bearing]);
    expect(bearing('feeds')).toEqual([['c1', 'own'], ['c2', 'follows']]);
    expect(bearing('inventory')).toEqual([['c2', 'own']]);
    expect(bearing('hr')).toEqual([]);
    expect(bearing('applications')).toEqual([['c1', 'follows'], ['c2', 'follows']]);
    expect(bearing('')).toEqual([['c1', 'follows'], ['c2', 'follows'], ['c3', 'own']]);
    // The document's own change sets, where none are given.
    expect(flowChanges({ ...doc, changes }, 'inventory').map((x) => x.of)).toEqual([['inventory']]);
  });
});

describe('a change of a pinned flow', () => {
  it('is refused where it would move a flow some flow reads only as it is, and says who pins it', async () => {
    const doc = await loadFlowDir(dir);
    const names: Record<string, string> = { '': doc.name, ...Object.fromEntries(doc.flows!.map((f) => [f.id, f.name])) };
    const nameOf = (f: string) => names[f] ?? f;
    expect(pinProblem(doc, ['inventory'], nameOf)).toBeNull();
    const pinned = (id: string, by: string[]) => ({ ...doc, flows: doc.flows!.map((f) => (f.id === id ? { ...f, pin: by } : f)) });
    // The flow itself is pinned.
    expect(pinProblem(pinned('inventory', ['']), ['inventory'], nameOf)).toBe('Inventory is pinned by Larkspur estate, which reads it only as it is: this would change it. Move the pin first.');
    expect(pinProblem(pinned('inventory', ['feeds', 'applications']), ['inventory'], nameOf)).toBe('Inventory is pinned by Evidence feeds and Applications, which read it only as it is: this would change it. Move the pin first.');
    // A flow that follows it is pinned: its hash would move with it.
    expect(pinProblem(pinned('applications', ['']), ['inventory'], nameOf)).toBe('Applications is pinned by Larkspur estate, which reads it only as it is: this changes Inventory, which it reads. Move the pin first.');
    // A pin on a flow the change doesn't reach says nothing.
    expect(pinProblem(pinned('hr', ['']), ['inventory'], nameOf)).toBeNull();
    expect(pinProblem(pinned('inventory', ['']), [''], nameOf)).toBeNull();
  });
});

describe('a read flow’s own document, with the changes made to it', () => {
  it('holds the change sets about a file or step it has or reads, and no other', async () => {
    const [feeds, hr, inventory] = await Promise.all([own('feeds'), own('hr'), own('inventory')]);
    const changes = [change('c1', [band]), change('c2', [rename]), change('c3', [check])];
    expect(withOwnChanges(feeds, changes).changes!.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(withOwnChanges(inventory, changes).changes!.map((c) => c.id)).toEqual(['c2']);
    // Nothing is about HR: its document is the one given.
    expect(withOwnChanges(hr, changes)).toBe(hr);
    // One it holds already isn't added twice.
    const once = withOwnChanges(feeds, changes);
    expect(withOwnChanges(once, changes)).toBe(once);
  });

  it('moves the hash of the flow a change is of and of every flow that follows it, and no other', async () => {
    const doc = await loadFlowDir(dir);
    const owns = await Promise.all(doc.flows!.map((f) => own(f.id)));
    const { doc: next, owns: after } = await attributeChanges(doc, owns, [change('c1', [band])]);
    const moved = next.flows!.filter((f, k) => f.hash !== doc.flows![k]!.hash).map((f) => f.id);
    expect(moved.sort()).toEqual(['applications', 'feeds']);
    expect(next.changes!.map((c) => c.id)).toEqual(['c1']);
    // Each part is named by the hash its own document has now.
    for (let k = 0; k < after.length; k++) expect(next.flows![k]!.hash, next.flows![k]!.id).toBe(await flowHash(after[k]!));
    // The band is in force from its day in the flow's own document as in the reading one.
    const feeds = after[doc.flows!.findIndex((f) => f.id === 'feeds')]!;
    const banded = (d: FlowDocument, day: string) => inForce(d, day).ontology!.properties!.some((p) => p.column === 'mode' && p.expect?.some((b) => b.value === 'block' && b.share[0] === 0.5 && (b.datasets ?? p.datasets ?? []).includes('waf')));
    expect([banded(feeds, '2024-03-17'), banded(feeds, '2024-03-18'), banded(next, '2024-03-18')]).toEqual([false, true, true]);
    // The same again changes nothing; no change, and the documents are the ones given.
    const again = await attributeChanges(next, after, [change('c1', [band])]);
    expect(again.doc.flows).toEqual(next.flows);
    expect(again.owns.every((d, k) => d === after[k])).toBe(true);
    await expect(attributeChanges(doc, owns.slice(1), [])).rejects.toThrow(/reads 4 flows, and 3 own documents were given/);
  });
});

describe('a name edited in the reading flow, made again where it belongs', () => {
  const op = { file: 'cmdb_apps', column: 'tier', change: { title: 'Criticality tier', override: 'The register’s tiers' }, through: ['cmdb_apps_checked', 'apps'] };

  it('is made in the own document of the flow that has the file, and of each flow a carried dataset is of', async () => {
    const [inventory, applications, hr, feeds] = await Promise.all([own('inventory'), own('applications'), own('hr'), own('feeds')]);
    const inv = ownWithEdits(inventory, [op], []);
    expect(propertyOf(inv.ontology, 'cmdb_apps', 'tier')).toMatchObject({ title: 'Criticality tier', override: { reason: 'The register’s tiers' } });
    expect(propertyOf(inv.ontology, 'cmdb_apps_checked', 'tier')).toMatchObject({ title: 'Criticality tier', datasets: ['cmdb_apps_checked'] });
    expect(await flowHash(inv)).not.toBe(await flowHash(inventory));
    // Applications reads Inventory: the file's name there too, and its own apps.
    const apps = ownWithEdits(applications, [op], []);
    for (const d of ['cmdb_apps', 'cmdb_apps_checked', 'apps']) expect(propertyOf(apps.ontology, d, 'tier')?.title, d).toBe('Criticality tier');
    // The feeds read Inventory too, and have none of Applications' datasets; HR has neither.
    const fd = ownWithEdits(feeds, [op], []);
    expect(propertyOf(fd.ontology, 'cmdb_apps', 'tier')?.title).toBe('Criticality tier');
    expect(ownWithEdits(hr, [op], [])).toBe(hr);
  });

  it('marks the flow’s handling only where an estate describes the column, and holds the change sets about it too', async () => {
    const inventory = await own('inventory');
    const c = change('c2', [rename]);
    const only = ownWithEdits(inventory, [op], [c], (d) => d === 'cmdb_apps');
    expect(propertyOf(only.ontology, 'cmdb_apps', 'tier')?.override).toEqual({ reason: 'The register’s tiers' });
    expect(propertyOf(only.ontology, 'cmdb_apps_checked', 'tier')?.override).toBeUndefined();
    expect(only.changes!.map((x) => x.id)).toEqual(['c2']);
  });
});

describe('what changed between two versions of a flow', () => {
  it('says its files, its steps, what it gives and its checks, and nothing where nothing differs', async () => {
    const hr = await own('hr');
    expect(diffEmpty(flowDiff(hr, hr))).toBe(true);
    expect(diffLines(flowDiff(hr, hr))).toEqual([]);
    const unpublished = hr.steps.find((s) => s.dataset === undefined)!;
    const given = hr.steps.find((s) => s.dataset !== undefined)!;
    const after: FlowDocument = {
      ...hr,
      sources: hr.sources.slice(1),
      steps: [
        ...hr.steps.filter((s) => s !== given).map((s) => (s === unpublished ? { ...s, dataset: { description: 'Published now' } } : s)),
        { id: 'new_step', kind: 'sql', inputs: [unpublished.id], sql: `SELECT * FROM ${unpublished.id}`, dataset: {} } as FlowDocument['steps'][number],
      ],
    };
    const d = flowDiff(hr, after);
    expect(d.files).toEqual({ added: [], removed: [hr.sources[0]!.id], changed: [] });
    expect(d.steps).toEqual({ added: ['new_step'], removed: [given.id], changed: [unpublished.id] });
    expect(d.gives).toEqual({ added: [unpublished.id, 'new_step'], removed: [given.id] });
    expect(diffLines(d)).toEqual([
      `1 file taken out: ${hr.sources[0]!.id}`,
      '1 step added: new_step',
      `1 step taken out: ${given.id}`,
      `1 step rewritten: ${unpublished.id}`,
      `It gives 2 more datasets: ${unpublished.id} and new_step`,
      `It no longer gives ${given.id}`,
    ]);
  });

  it('says a change to its checks as the rules’ versions do, and a flow read now by its name', async () => {
    const doc = await loadFlowDir(dir);
    const next = inForce({ ...doc, changes: [change('c1', [band])] }, '2024-03-18');
    const d = flowDiff(doc, next);
    expect(d.checks).toHaveLength(1);
    expect(d.checks[0]).toMatch(/^Band for .* in waf: .* → 50%–100%$/);
    expect(diffLines(d)).toEqual(d.checks);
    const fewer = { ...doc, flows: doc.flows!.filter((f) => f.id !== 'hr') };
    expect(diffLines(flowDiff(fewer, doc), (f) => doc.flows!.find((x) => x.id === f)!.name)).toEqual(['1 flow read now: HR organisation']);
    expect(diffLines(flowDiff(doc, fewer), (f) => doc.flows!.find((x) => x.id === f)!.name)).toEqual(['1 flow no longer read: HR organisation']);
  });
});

describe('a change tested on the days recorded', () => {
  const day = (d: string, was: DayTest['was'], now: DayTest['now'], holds: string[] = []): DayTest => ({ day: d, was, now, holds });
  const named = (d: string) => ({ '2024-03-12': 'Tue Mar 12', '2024-03-18': 'Mon Mar 18', '2024-03-06': 'Wed Mar 6' })[d] ?? d;

  it('counts the days it would have paused, freed and failed, and those that come out the same', () => {
    const days = [
      day('2024-03-12', 'published', 'held', ['waf']),
      day('2024-03-18', 'published', 'held', ['waf']),
      day('2024-03-06', 'held', 'published'),
      day('2024-03-07', 'held', 'held', ['tls']),
      day('2024-03-08', 'held', 'held'),
      day('2024-03-09', 'published', 'published'),
      day('2024-03-10', 'published', 'failed'),
    ];
    const t = testCount(days);
    expect([t.days, t.paused.length, t.freed.length, t.failed.length, t.moved.length, t.same]).toEqual([7, 2, 1, 1, 1, 3]);
  });

  it('says it in a sentence, the test informing and nothing more', () => {
    const calm = Array.from({ length: 12 }, (_, k) => day(`2024-02-${String(k + 1).padStart(2, '0')}`, 'published', 'published'));
    const two = [day('2024-03-12', 'published', 'held', ['waf']), day('2024-03-18', 'published', 'held', ['waf'])];
    expect(testSaid('the changed Evidence feeds', testCount([...calm, ...two]), named)).toBe('Under the changed Evidence feeds, 2 of the last 14 days would have paused: Tue Mar 12 and Mon Mar 18; 12 come out the same.');
    expect(testSaid('the changed Evidence feeds', testCount(calm), named)).toBe('Under the changed Evidence feeds, all of the last 12 days come out the same.');
    expect(testSaid('the changed Evidence feeds', testCount([calm[0]!]), named)).toBe('Under the changed Evidence feeds, the last day comes out the same.');
    expect(testSaid('the changed Evidence feeds', testCount([]), named)).toBe('Under the changed Evidence feeds, no recorded day was there to test.');
    expect(testSaid('the new band', testCount([...two, day('2024-03-06', 'held', 'published'), calm[0]!]), named)).toBe('Under the new band, 2 of the last 4 days would have paused: Tue Mar 12 and Mon Mar 18; 1 would have been published: Wed Mar 6; 1 comes out the same.');
    expect(testSaid('the new band', testCount([day('2024-03-06', 'held', 'published')]), named)).toBe('Under the new band, 1 of the last day would have been published: Wed Mar 6; none comes out the same.');
  });
});
