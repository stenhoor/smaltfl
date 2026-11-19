/**
 * Who decides (ADR 0027 §10, core/agree.ts): the ontology names who owns each of its parts, a change the business
 * made or one that ends something takes effect only with the agreement of an owner of every part it touches, the
 * rules in force follow a change from the moment it had that agreement, the register lists one that waits, a document
 * refuses an agreement by someone who owns nothing the change touches, and Larkspur's estate names its owners.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { agreedIssues, agreementOf, agreeTo, asksAgreement, asksWhy, flowsOwner, knownFrom, mayAgree, ownersOf, ownersSaid, partsIn, partsOf, waitsForAgreement, type OwnedDoc } from '../src/core/agree.js';
import { validateDocument, type ChangeSet, type FlowDocument, type FlowPart, type RuleEdit } from '../src/core/document.js';
import { changesOn, resolve, versionRules } from '../src/core/inforce.js';
import { livesOf, registerOf } from '../src/core/register.js';
import { ruleVersions, versionKey, versionOn } from '../src/core/ruleversions.js';
import { rulesOf } from '../src/core/rules.js';
import { timelineOf, type StoryFile } from '../src/core/timeline.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const latency = (max: number): RuleEdit => ({ op: 'setRule', rule: { id: 'latency_ms_range', file: 'auth', column: 'latency_ms', kind: 'range', min: 0, max, action: 'flag' } });
const endLink: RuleEdit = { op: 'end', ended: { what: 'link', id: 'led_by' } };
const change = (id: string, kind: ChangeSet['kind'], edits: RuleEdit[], more: Partial<ChangeSet> = {}): ChangeSet => ({ id, from: '2024-03-18', recorded: '2024-03-15T16:30:00Z', by: 'owner', why: `why ${id}`, ...(kind ? { kind } : {}), edits, ...more });

const part = (id: string, name: string, sources: string[], more: Partial<FlowPart> = {}): FlowPart => ({ path: `${id}/flow.json`, id, name, hash: '0'.repeat(64), sources, steps: [], reads: [], direct: true, ...more });
/** A posture product that reads two flows and an estate: the estate the security lead's, the feeds its own two owners',
 * HR with none named, the product's own the security lead's. */
const estate: OwnedDoc = {
  name: 'Posture',
  policies: { principals: [{ id: 'owner', name: 'Owner', owner: true }, { id: 'ciso', name: 'Sloane Marsden' }, { id: 'ops', name: 'Ravi Okafor' }], groups: [], rules: [] },
  ontology: { objectTypes: [], linkTypes: [], actionTypes: [], owners: [{ id: 'ciso' }], estate: [{ name: 'Larkspur estate', path: 'ontology.json', hash: 'e'.repeat(64), owners: [{ id: 'ciso', name: 'Sloane Marsden' }] }] },
  flows: [part('feeds', 'Evidence feeds', ['waf', 'findings'], { owners: [{ id: 'ops', name: 'Ravi Okafor' }, { id: 'owner' }] }), part('hr', 'HR organisation', ['hr_people'])],
};

describe('which changes ask for agreement (Q-277)', () => {
  it('asks where the business changed, and wherever something ends, whatever its kind', () => {
    expect(asksAgreement(change('a', 'business', [latency(1)]))).toBe(true);
    expect(asksAgreement(change('a', 'corrected', [endLink]))).toBe(true);
    for (const kind of ['retuned', 'corrected', 'source', 'described', undefined] as const) expect(asksAgreement(change('a', kind, [latency(1)]))).toBe(false);
    expect(asksWhy(change('a', 'business', [latency(1)]))).toBe('the business changed');
    expect(asksWhy(change('a', 'retuned', [endLink]))).toBe('it ends something');
    expect(asksWhy(change('a', 'business', [endLink]))).toBe('the business changed, and it ends something');
    expect(asksWhy(change('a', 'retuned', [latency(1)]))).toBe('');
  });
});

describe('the parts of the ontology, and who owns each (Q-276)', () => {
  it('lists an estate’s shared ontology, each flow read, and the document’s own', () => {
    expect(partsIn(estate)).toEqual([
      { kind: 'estate', id: 'Larkspur estate', name: 'Larkspur estate’s ontology' },
      { kind: 'flow', id: 'feeds', name: 'Evidence feeds' },
      { kind: 'flow', id: 'hr', name: 'HR organisation' },
      { kind: 'flow', id: '', name: 'Posture' },
    ]);
  });

  it('names the owners a part’s own document names, each with a name to say; the flow’s owner where it names none', () => {
    expect(ownersOf(estate, { kind: 'estate', id: 'Larkspur estate' })).toEqual([{ id: 'ciso', name: 'Sloane Marsden' }]);
    // A name as the owner is named, else the principal's.
    expect(ownersOf(estate, { kind: 'flow', id: 'feeds' })).toEqual([{ id: 'ops', name: 'Ravi Okafor' }, { id: 'owner', name: 'Owner' }]);
    expect(ownersOf(estate, { kind: 'flow', id: '' })).toEqual([{ id: 'ciso', name: 'Sloane Marsden' }]);
    // HR names none: the principals the policies mark as owning the flow.
    expect(ownersOf(estate, { kind: 'flow', id: 'hr' })).toEqual([{ id: 'owner', name: 'Owner' }]);
    // A flow with no policies is its `owner`'s, as the page acts in one.
    expect(flowsOwner({})).toEqual([{ id: 'owner', name: 'Owner' }]);
    expect(ownersOf({ name: 'Alone' }, { kind: 'flow', id: '' })).toEqual([{ id: 'owner', name: 'Owner' }]);
  });

  it('says what a change set touches: the estate for its own change, else the flow of each file or step it is about', () => {
    expect(partsOf(estate, change('a', 'business', [latency(1)], { estate: 'Larkspur estate' }))).toEqual([{ kind: 'estate', id: 'Larkspur estate', name: 'Larkspur estate’s ontology' }]);
    const band: RuleEdit = { op: 'acceptBand', source: 'waf', band: { column: 'status', value: 'fail', share: [0, 0.1] } };
    expect(partsOf(estate, change('a', 'business', [band]))).toEqual([{ kind: 'flow', id: 'feeds', name: 'Evidence feeds' }]);
    // A file of the document's own, and a change about no dataset (a relation): the document's own flow's.
    expect(partsOf(estate, change('a', 'business', [latency(1)]))).toEqual([{ kind: 'flow', id: '', name: 'Posture' }]);
    expect(partsOf(estate, change('a', 'business', [endLink]))).toEqual([{ kind: 'flow', id: '', name: 'Posture' }]);
    // Two flows' files in one change set: both, once each, in the order named.
    const hrRule: RuleEdit = { op: 'setRule', rule: { id: 'r', file: 'hr_people', column: 'person_id', kind: 'required', action: 'flag' } };
    expect(partsOf(estate, change('a', 'business', [band, hrRule, band])).map((p) => p.id)).toEqual(['feeds', 'hr']);
  });
});

describe('where a change set stands with the owners of what it touches', () => {
  const band: RuleEdit = { op: 'acceptBand', source: 'waf', band: { column: 'status', value: 'fail', share: [0, 0.1] } };
  const hrRule: RuleEdit = { op: 'setRule', rule: { id: 'r', file: 'hr_people', column: 'person_id', kind: 'required', action: 'flag' } };

  it('is in force from when it was recorded where it asks for none, whoever agreed or didn’t', () => {
    const c = change('tuned', 'retuned', [band]);
    expect(agreementOf(estate, c)).toMatchObject({ asked: false, waiting: [], since: c.recorded, same: false, strangers: [] });
    expect(knownFrom(estate, c)).toBe(c.recorded);
    expect(waitsForAgreement(estate, c)).toBe(false);
  });

  it('waits until an owner of each part it touches has agreed, and takes effect at the latest of those agreements', () => {
    const c = change('band', 'business', [band, hrRule]);
    const waiting = agreementOf(estate, c);
    expect(waiting.asked).toBe(true);
    expect(waiting.waiting.map((p) => p.id)).toEqual(['feeds', 'hr']);
    expect(waiting.since).toBeNull();
    expect(knownFrom(estate, c)).toBeNull();
    expect(waitsForAgreement(estate, c)).toBe(true);
    // Ravi owns the feeds, not HR: half of what it needs.
    const half = agreementOf(estate, { ...c, agreed: [{ by: 'ops', at: '2024-03-15T16:40:00Z' }] });
    expect(half.waiting.map((p) => p.id)).toEqual(['hr']);
    expect(half.since).toBeNull();
    // The flow's owner owns both: with theirs it has every part, from the later of the two that count.
    const both = agreementOf(estate, { ...c, agreed: [{ by: 'ops', at: '2024-03-15T16:40:00Z' }, { by: 'owner', at: '2024-03-16T08:00:00Z' }] });
    expect(both.waiting).toEqual([]);
    expect(both.parts.map((p) => [p.part.id, p.agreed?.by])).toEqual([['feeds', 'ops'], ['hr', 'owner']]);
    expect(both.since).toBe('2024-03-16T08:00:00Z');
    expect(both.same).toBe(false);
  });

  it('says where one person held both roles: the author owns what it touches and agreed by recording it', () => {
    const c = change('band', 'business', [band], { agreed: [{ by: 'owner', at: '2024-03-15T16:30:00Z' }] });
    expect(agreementOf(estate, c)).toMatchObject({ waiting: [], since: c.recorded, same: true });
    // Another owner agreed: two people.
    expect(agreementOf(estate, { ...c, agreed: [{ by: 'ops', at: '2024-03-15T16:45:00Z' }] })).toMatchObject({ since: '2024-03-15T16:45:00Z', same: false });
  });

  it('counts nothing for an agreement by someone who owns no part it touches', () => {
    const c = change('band', 'business', [band], { agreed: [{ by: 'ciso', at: '2024-03-15T16:40:00Z' }] });
    const state = agreementOf(estate, c);
    expect(state.strangers).toEqual([{ by: 'ciso', at: '2024-03-15T16:40:00Z' }]);
    expect(state.waiting.map((p) => p.id)).toEqual(['feeds']);
    expect(agreedIssues({ ...estate, changes: [c] })).toEqual([{ path: '$.changes[0].agreed[0].by', message: 'ciso owns no part of the ontology band touches: it is for an owner of Evidence feeds (Ravi Okafor or Owner) to agree to' }]);
    // The estate's own change is the estate's owner's to agree to, not the flow's owner's.
    const shared = change('acting', 'business', [endLink], { estate: 'Larkspur estate', by: 'owner', agreed: [{ by: 'owner', at: '2024-03-15T16:40:00Z' }] });
    expect(agreedIssues({ ...estate, changes: [shared] }).map((i) => i.message)).toEqual(['owner owns no part of the ontology acting touches: it is for the owner of Larkspur estate’s ontology (Sloane Marsden) to agree to']);
    expect(agreedIssues({ ...estate, changes: [{ ...shared, agreed: [{ by: 'ciso', at: '2024-03-15T16:40:00Z' }] }] })).toEqual([]);
  });

  it('holds an owner whose card is known to that card', () => {
    const carded: OwnedDoc = { ...estate, ontology: { ...estate.ontology!, owners: [{ id: 'ciso', card: 'a'.repeat(64) }] } };
    const c = change('own', 'business', [latency(1)], { agreed: [{ by: 'ciso', at: '2024-03-15T16:40:00Z', card: 'b'.repeat(64) }] });
    expect(agreedIssues({ ...carded, changes: [c] }).map((i) => i.path)).toEqual(['$.changes[0].agreed[0].card']);
    expect(agreedIssues({ ...carded, changes: [{ ...c, agreed: [{ by: 'ciso', at: '2024-03-15T16:40:00Z', card: 'a'.repeat(64) }] }] })).toEqual([]);
    // One recorded before cards were (no card on the agreement) is held to the name alone.
    expect(agreedIssues({ ...carded, changes: [{ ...c, agreed: [{ by: 'ciso', at: '2024-03-15T16:40:00Z' }] }] })).toEqual([]);
  });

  it('says who may agree, and gives the change set with their agreement', () => {
    const c = change('band', 'business', [band, hrRule]);
    expect(mayAgree(estate, c, 'ops').map((p) => p.id)).toEqual(['feeds']);
    expect(mayAgree(estate, c, 'owner').map((p) => p.id)).toEqual(['feeds', 'hr']);
    expect(mayAgree(estate, c, 'ciso')).toEqual([]);
    expect(mayAgree(estate, change('tuned', 'retuned', [band]), 'owner')).toEqual([]);
    const refused = agreeTo(estate, c, 'ciso', '2024-03-15T17:00:00Z');
    expect(refused).toEqual({ problem: 'It waits for an owner of Evidence feeds (Ravi Okafor or Owner) and the owner of HR organisation (Owner).' });
    const got = agreeTo(estate, c, 'ops', '2024-03-15T17:00:00Z', 'c'.repeat(64));
    expect('change' in got && got.change.agreed).toEqual([{ by: 'ops', at: '2024-03-15T17:00:00Z', card: 'c'.repeat(64) }]);
    expect('for' in got && got.for.map((p) => p.id)).toEqual(['feeds']);
    const done = 'change' in got ? agreeTo(estate, got.change, 'owner', '2024-03-16T08:00:00Z') : got;
    expect('change' in done && done.change.agreed).toEqual([{ by: 'ops', at: '2024-03-15T17:00:00Z', card: 'c'.repeat(64) }, { by: 'owner', at: '2024-03-16T08:00:00Z' }]);
    expect('for' in done && done.for.map((p) => p.id)).toEqual(['hr']);
    // It has what it asked for; one of a kind that asks for none; an agreement from before it was written down.
    expect('change' in done && agreeTo(estate, done.change, 'owner', '2024-03-17T08:00:00Z')).toEqual({ problem: 'It has the agreement it asked for.' });
    expect(agreeTo(estate, change('tuned', 'retuned', [band]), 'owner', '2024-03-17T08:00:00Z')).toEqual({ problem: 'It asks for no agreement: a change of its kind needs only its author.' });
    expect(agreeTo(estate, c, 'owner', '2024-03-15T16:00:00Z')).toEqual({ problem: 'An agreement is to a change written down: it can’t be from before it was recorded.' });
    expect(ownersSaid([])).toBe('');
  });
});

describe('the rules in force follow a change from the moment it was agreed to', () => {
  const signins = () => loadFlowDir(signinsDir);
  const max = (d: FlowDocument) => rulesOf(d.ontology, 'auth').find((r) => r.id === 'latency_ms_range')?.max;

  it('leaves a change that waits out of every day, and has it from its agreement on, as known then', async () => {
    const base = await signins();
    const waits = change('tight', 'business', [latency(20_000)]);
    const doc = { ...base, changes: [waits] };
    expect(changesOn(doc, '2024-03-20')).toEqual([]);
    expect(max(resolve(doc, '2024-03-20').doc)).toBe(max(base));
    expect(versionOn(doc, '2024-03-20')).toBe(versionKey([]));
    // Agreed three days after it was recorded: known from then, and not before.
    const agreed = { ...base, changes: [{ ...waits, agreed: [{ by: 'owner', at: '2024-03-18T10:00:00Z' }] }] };
    expect(changesOn(agreed, '2024-03-20', '2024-03-18T09:59:59Z')).toEqual([]);
    expect(changesOn(agreed, '2024-03-20', '2024-03-18T10:00:00Z').map((c) => c.id)).toEqual(['tight']);
    expect(max(resolve(agreed, '2024-03-20').doc)).toBe(20_000);
    // The versions of the rules change at the agreement, not at the recording.
    expect(ruleVersions(agreed, ['2024-03-20'])).toEqual([
      { changes: [], spans: [{ day: '2024-03-20', from: null, to: '2024-03-18T10:00:00.000Z' }] },
      { changes: ['tight'], spans: [{ day: '2024-03-20', from: '2024-03-18T10:00:00.000Z', to: null }] },
    ]);
    expect(ruleVersions(doc, ['2024-03-20'])).toEqual([{ changes: [], spans: [{ day: '2024-03-20', from: null, to: null }] }]);
  });

  it('applies changes in the order they took effect: one agreed late comes after one recorded since', async () => {
    const base = await signins();
    const first = change('business-first', 'business', [latency(20_000)], { recorded: '2024-03-15T16:30:00Z', agreed: [{ by: 'owner', at: '2024-03-19T09:00:00Z' }] });
    const tuned = change('tuned-since', 'retuned', [latency(25_000)], { recorded: '2024-03-16T08:00:00Z' });
    const doc = { ...base, changes: [first, tuned] };
    expect(changesOn(doc, '2024-03-20').map((c) => c.id)).toEqual(['tuned-since', 'business-first']);
    expect(max(resolve(doc, '2024-03-20').doc)).toBe(20_000);
    // As known between the two: the re-tuned band alone.
    expect(max(resolve(doc, '2024-03-20', '2024-03-17T00:00:00Z').doc)).toBe(25_000);
  });

  it('takes a change that waits into a version that names it: tried, it applies after those in force', async () => {
    const base = await signins();
    const tuned = change('tuned', 'retuned', [latency(25_000)], { recorded: '2024-03-16T08:00:00Z' });
    const waits = change('tight', 'business', [latency(20_000)]);
    expect(max(versionRules(base, [waits, tuned], ['tight', 'tuned']))).toBe(20_000);
    expect(max(versionRules(base, [waits, tuned], ['tuned']))).toBe(25_000);
  });

  it('refuses a document whose agreement is by someone who owns nothing the change touches, and shapes it wrongly', async () => {
    const base = await signins();
    const issues = (c: unknown, more: Partial<FlowDocument> = {}) => validateDocument({ ...base, ...more, changes: [c] } as FlowDocument).filter((i) => i.path.startsWith('$.changes') || i.path.startsWith('$.ontology.owners')).map((i) => i.path);
    const c = change('tight', 'business', [latency(20_000)]);
    expect(issues(c)).toEqual([]);
    expect(issues({ ...c, agreed: [{ by: 'owner', at: '2024-03-15T16:30:00Z' }] })).toEqual([]);
    // Sam is a principal of the flow and owns no part of its ontology.
    expect(issues({ ...c, agreed: [{ by: 'sam', at: '2024-03-15T16:40:00Z' }] })).toEqual(['$.changes[0].agreed[0].by']);
    // Named an owner, Sam's agreement stands.
    const owned: Partial<FlowDocument> = { ontology: { ...base.ontology!, owners: [{ id: 'sam' }] } };
    expect(issues({ ...c, agreed: [{ by: 'sam', at: '2024-03-15T16:40:00Z' }] }, owned)).toEqual([]);
    expect(issues({ ...c, agreed: [{ by: 'owner', at: '2024-03-15T16:40:00Z' }] }, owned)).toEqual(['$.changes[0].agreed[0].by']);
    expect(issues({ ...c, agreed: [] })).toEqual(['$.changes[0].agreed']);
    expect(issues({ ...c, agreed: [{ by: '', at: 'soon', card: 'abc', when: 1 }] })).toEqual(['$.changes[0].agreed[0].when', '$.changes[0].agreed[0].by', '$.changes[0].agreed[0].at', '$.changes[0].agreed[0].card']);
    expect(issues({ ...c, agreed: [{ by: 'owner', at: '2024-03-15T16:00:00Z' }] })).toEqual(['$.changes[0].agreed[0].at']);
    expect(issues({ ...c, agreed: [{ by: 'owner', at: '2024-03-15T16:40:00Z' }, { by: 'owner', at: '2024-03-15T16:50:00Z' }] })).toEqual(['$.changes[0].agreed[1].by']);
    // An owner is a principal of the flow, named once.
    expect(issues(c, { ontology: { ...base.ontology!, owners: [{ id: 'nobody' }] } })).toEqual(['$.ontology.owners[0].id']);
    expect(issues(c, { ontology: { ...base.ontology!, owners: [] } })).toEqual(['$.ontology.owners']);
    expect(issues(c, { ontology: { ...base.ontology!, owners: [{ id: 'sam' }, { id: 'sam', card: 'xyz', title: 'x' } as never] } })).toEqual(['$.ontology.owners[1].title', '$.ontology.owners[1].id', '$.ontology.owners[1].card']);
  });
});

describe('the register lists a change that waits for agreement', () => {
  it('first, as waiting, whatever its first day; its thing stands by it on no day', async () => {
    const base = await loadFlowDir(signinsDir);
    const waits = change('tight', 'business', [latency(20_000)], { from: '2024-03-04', recorded: '2024-03-04T08:00:00Z' });
    const tuned = change('tuned', 'retuned', [latency(25_000)], { from: '2024-03-06', recorded: '2024-03-06T08:00:00Z' });
    const doc = { ...base, changes: [waits, tuned] };
    const { entries } = registerOf(doc, { today: '2024-03-10' });
    expect(entries.map((e) => [e.change.id, e.tense, e.knownFrom])).toEqual([['tight', 'waiting', null], ['tuned', 'in force', '2024-03-06T08:00:00Z']]);
    // What it would do is said as it would apply once agreed to.
    expect(entries[0]!.said).toHaveLength(1);
    expect(entries[0]!.agreement.waiting.map((p) => p.name)).toEqual([base.name]);
    const days = ['2024-03-03', '2024-03-04', '2024-03-05', '2024-03-06', '2024-03-07'];
    const life = livesOf(entries, days, '2024-03-10').find((l) => l.subject.key.includes('latency_ms_range'))!;
    expect(life.spans.map((s) => [s.from, s.until, s.change])).toEqual([['2024-03-03', '2024-03-05', null], ['2024-03-06', '2024-03-07', 'tuned']]);
    // The day it was said on still shows on its row.
    expect(life.said.map((s) => s.change).sort()).toEqual(['tight', 'tuned']);
  });

  it('reads as known at a moment: agreed since, it waited then', async () => {
    const base = await loadFlowDir(signinsDir);
    const c = change('tight', 'business', [latency(20_000)], { from: '2024-03-04', recorded: '2024-03-04T08:00:00Z', agreed: [{ by: 'owner', at: '2024-03-05T09:00:00Z' }] });
    const doc = { ...base, changes: [c] };
    expect(registerOf(doc, { today: '2024-03-10' }).entries.map((e) => [e.tense, e.knownFrom, e.agreement.same])).toEqual([['in force', '2024-03-05T09:00:00Z', true]]);
    expect(registerOf(doc, { today: '2024-03-10', asOf: '2024-03-04T12:00:00Z' }).entries.map((e) => [e.tense, e.knownFrom])).toEqual([['waiting', null]]);
    expect(registerOf(doc, { today: '2024-03-10', asOf: '2024-03-04T07:00:00Z' })).toEqual({ entries: [], later: 1 });
  });
});

describe('a recorded story places a change where it came to be known', () => {
  it('at its agreement, where it asks for one; never, while it waits', () => {
    const agreed = change('band', 'business', [latency(1)], { agreed: [{ by: 'owner', at: '2024-03-15T16:45:00Z' }] });
    const waits = change('later', 'business', [latency(2)], { recorded: '2024-03-16T08:00:00Z' });
    const story = { format: 'smaltfl-story/1', flow: 'x', deliveries: [], decisions: [], changes: [agreed, waits] } as unknown as StoryFile;
    const known = (c: ChangeSet) => knownFrom({ name: 'A flow' }, c);
    expect(timelineOf([], () => '', story, known).map((e) => [e.kind, e.at])).toEqual([['change', '2024-03-15T16:45:00Z']]);
    // Asked of nothing, every change is placed where it was recorded, as before.
    expect(timelineOf([], () => '', story).map((e) => e.at)).toEqual(['2024-03-15T16:30:00Z', '2024-03-16T08:00:00Z']);
  });
});

describe('Larkspur names who owns what', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);
  const story = JSON.parse(readFileSync(new URL('story.json', dir), 'utf8')) as { changes: ChangeSet[] };

  it('the estate’s shared ontology and the posture product’s own are the security lead’s; each flow read is its owner’s', async () => {
    const top = await loadFlowDir(dir);
    expect(partsIn(top).map((p) => [p.name, ownersOf(top, p).map((o) => o.name)])).toEqual([
      ['Larkspur estate’s ontology', ['Sloane Marsden']],
      ['HR organisation', ['Owner']],
      ['Inventory', ['Owner']],
      ['Evidence feeds', ['Owner']],
      ['Applications', ['Owner']],
      ['Larkspur estate', ['Sloane Marsden']],
    ]);
    // Read on its own, a flow of the estate says the estate's owner by the name the estate gives.
    const feeds = await loadFlowDir(new URL('feeds/', dir));
    expect(ownersOf(feeds, { kind: 'estate', id: 'Larkspur estate' })).toEqual([{ id: 'ciso', name: 'Sloane Marsden' }]);
    expect(ownersOf(feeds, { kind: 'flow', id: '' })).toEqual([{ id: 'owner', name: 'Owner' }]);
  });

  it('every change of its story that asks for agreement has it, from an owner of what it touches', async () => {
    const top = await loadFlowDir(dir);
    const doc = { ...top, changes: [...(top.changes ?? []), ...story.changes] };
    expect(validateDocument(doc).filter((i) => i.path.startsWith('$.changes'))).toEqual([]);
    const stand = (id: string) => {
      const c = doc.changes.find((x) => x.id === id)!;
      const a = agreementOf(doc, c);
      return { asked: a.asked, parts: a.parts.map((p) => `${p.part.name}: ${p.agreed?.by ?? 'waits'}`), since: a.since, same: a.same };
    };
    // The estate's relation: said and agreed to by the security lead, who owns the shared ontology.
    expect(stand('acting-leader')).toEqual({ asked: true, parts: ['Larkspur estate’s ontology: ciso'], since: '2024-03-08T14:00:00Z', same: true });
    // The WAF's band is Evidence feeds' own: its owner wrote it and agreed.
    expect(stand('waf-band-tenth')).toEqual({ asked: true, parts: ['Evidence feeds: owner'], since: '2024-03-15T16:30:00Z', same: true });
    // The catalogue's new control is the product's own: the owner wrote it down, the security lead agreed five minutes on.
    expect(stand('sbom-declared')).toEqual({ asked: true, parts: ['Larkspur estate: ciso'], since: '2024-03-27T09:15:00Z', same: false });
    // A mistake corrected needs only its author.
    expect(stand('findings-values-hold')).toMatchObject({ asked: false, since: '2024-03-25T09:40:00Z' });
  });
});
