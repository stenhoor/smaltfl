/**
 * A decision carried between pages (ADR 0025 §6, second step, Q-240): two pages of one browser that share a flow keep
 * a record each; a held load one of them decided, at the same flow, is decided on the other by that decision, citing
 * it. On Larkspur's estate and on Evidence feeds read from its own folder, as its own page reads it.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { baseOf, baseProblems, carriedProblems, carriedSaid, decidedElsewhere, givesWay, leadingHere, madeAt, notCarriedSaid, originOf, pageOf, proofOf, type CarriedFrom, type CarryAbout, type OtherRecord } from '../src/core/carry.js';
import { flowHash } from '../src/core/plan.js';
import { loadDecisions, loadKey, type DecideAbout, type Hold, type Load } from '../src/core/hold.js';
import { entryLeaf, entryOf, logOrigin, rootOf, signCheckpoint, type JSONValue, type LogEntry, type SignedCheckpoint } from '../src/core/log.js';
import { createIdentity, type Identity } from '../src/core/manifest.js';
import { withRoles } from '../src/core/deciding.js';
import { loadFlowDir } from './helpers/notebooks.js';

const estateDir = new URL('../examples/larkspur/', import.meta.url);
const feedsDir = new URL('../examples/larkspur/feeds/', import.meta.url);
const DAY = '2024-03-27';
const load = (source: string, slot = DAY): Load => ({ source, slot, sha256: `${source}-${slot}`.padEnd(64, '0').replace(/[^0-9a-f]/g, 'a') });
const hold = (by: Hold['by'], origin: string, o: Partial<Hold> = {}): Hold => ({ by, node: 0, origin, said: `${origin} said`, reaches: [], load: load(origin), ...o });
const inputs = (flow: string) => ({ flow, parameters: { day: DAY }, files: {} });

/** A record as a page keeps it: its entries, their leaves, and a checkpoint its browser signs after each. */
class Rec {
  entries: LogEntry[] = [];
  leaves: string[] = [];
  checkpoints: SignedCheckpoint[] = [];
  readonly origin: string;
  constructor(readonly flow: string, readonly id: Identity) {
    this.origin = logOrigin(flow, id.card.fingerprint);
  }
  async add(kind: string, as: string, about: unknown, o: { reason?: string | null; amends?: number | null; at?: string; unsigned?: boolean } = {}): Promise<LogEntry> {
    const e = entryOf(this.origin, this.entries.length, { kind, by: { card: this.id.card.fingerprint, as }, about: about as JSONValue, reason: o.reason ?? null, amends: o.amends ?? null, ...(o.at ? { at: o.at } : {}) });
    this.entries.push(e);
    this.leaves.push(entryLeaf(e));
    if (!o.unsigned) this.checkpoints.push(await signCheckpoint(this.id, this.origin, this.entries.length, rootOf(this.leaves)));
    return e;
  }
  /** As another page reads it. */
  other(): OtherRecord {
    return { origin: this.origin, entries: this.entries, signed: this.checkpoints.length ? this.entries.length - (this.entries.length - Number(this.checkpoints.at(-1)!.checkpoint.split('\n')[1])) : 0, ok: true };
  }
}

/** A held run's entries as a page records them: the flow as kept, then the run. */
async function heldRun(rec: Rec, base: string, manifest: string, holds: Hold[], at?: string): Promise<LogEntry> {
  await rec.add('flow', 'owner', { before: null, after: base, doc: 'd'.repeat(64) }, at ? { at } : {});
  return rec.add('run', 'owner', { run: 1, manifest, outcome: 'held', day: DAY, holds, waiting: ['x'], keys: {} }, at ? { at } : {});
}

const decision = (l: Load, flow: string, manifest: string, option: DecideAbout['option'] = 'asis', extra: Partial<CarryAbout> = {}): CarryAbout =>
  ({ ...loadDecisions({ run: 1, manifest, inputs: inputs(flow), loads: [l], option, scope: 'day', policies: 'p'.repeat(64), rule: null })[0]!, ...extra });

describe('a record’s origin, and the flow a decision was made at', () => {
  it('reads a flow’s record’s origin, and nothing else', async () => {
    const id = await createIdentity('This browser');
    expect(originOf(logOrigin('feeds', id.card.fingerprint))).toEqual({ flow: 'feeds', signer: id.card.fingerprint.slice(0, 16) });
    expect(originOf(logOrigin('a flow/with a slash', id.card.fingerprint))?.flow).toBe('a flow/with a slash');
    expect(originOf('smaltfl/log/feeds')).toBeNull();
    expect(originOf('smaltfl/log/feeds/xyz')).toBeNull();
    expect(originOf(null)).toBeNull();
  });

  it('is the flow the entry names, else its record’s own flow as kept when its run ran; none where it says neither', async () => {
    const id = await createIdentity('This browser');
    const origin = logOrigin('feeds', id.card.fingerprint);
    const l = load('access_reviews');
    expect(madeAt({ origin: logOrigin('larkspur', id.card.fingerprint), about: decision(l, 'f', 'm', 'asis', { flow: { id: 'feeds', hash: 'h1' } }) as unknown as JSONValue })).toEqual({ id: 'feeds', hash: 'h1' });
    expect(madeAt({ origin, about: decision(l, 'f', 'm', 'asis', { base: 'h1' }) as unknown as JSONValue })).toEqual({ id: 'feeds', hash: 'h1' });
    // Made before pages carried decisions, or recorded by the build: it doesn't say.
    expect(madeAt({ origin, about: decision(l, 'f', 'm') as unknown as JSONValue })).toBeNull();
    expect(madeAt({ origin: 'elsewhere', about: decision(l, 'f', 'm', 'asis', { base: 'h1' }) as unknown as JSONValue })).toBeNull();
    expect(madeAt({ origin, about: null })).toBeNull();
  });
});

describe('the held loads a page looks for on its other pages', () => {
  it('on the estate’s page: the file that leads, as Evidence feeds’, by the hash the estate knows it by; never the step that follows', async () => {
    const doc = await loadFlowDir(estateDir);
    const feeds = doc.flows!.find((f) => f.id === 'feeds')!;
    const holds = [hold('story', 'access_reviews'), hold('story', 'posture_wide')];
    expect(leadingHere(doc, 'the-estate-as-kept', holds)).toEqual([{ load: load('access_reviews'), flow: { id: 'feeds', hash: feeds.hash } }]);
  });

  it('on Evidence feeds’ own page: the same file, as its own flow’s, by the flow as kept when the run ran', async () => {
    const own = await loadFlowDir(feedsDir);
    const base = await flowHash(own);
    expect(leadingHere(own, base, [hold('story', 'access_reviews')])).toEqual([{ load: load('access_reviews'), flow: { id: 'feeds', hash: base } }]);
    // A run that doesn't say what the flow was kept as isn't looked for.
    expect(leadingHere(own, undefined, [hold('story', 'access_reviews')])).toEqual([]);
  });

  it('is the same flow on both pages: the estate knows Evidence feeds by the hash of the document its own page ships', async () => {
    const doc = await loadFlowDir(estateDir);
    const own = await loadFlowDir(feedsDir);
    expect(doc.flows!.find((f) => f.id === 'feeds')!.hash).toBe(await flowHash(own));
  });

  it('on a flow that reads none: its own file, as its own', () => {
    const doc = { id: 'solo', flows: undefined, steps: [] };
    expect(leadingHere(doc, 'kept', [hold('checks', 'file')])).toEqual([{ load: load('file'), flow: { id: 'solo', hash: 'kept' } }]);
  });
});

describe('what the other pages decided about a load', () => {
  const l = load('access_reviews');
  const flow = { id: 'feeds', hash: 'h-feeds' };

  it('is the decision made on the flow’s own page, at the same flow, under a signed checkpoint', async () => {
    const id = await createIdentity('This browser');
    const feeds = new Rec('feeds', id);
    await heldRun(feeds, 'h-feeds', 'm1', [hold('story', 'access_reviews')]);
    const d = await feeds.add('decide', 'owner', decision(l, 'f', 'm1', 'asis', { base: 'h-feeds' }), { reason: 'Reviewed late, by plan' });
    const found = decidedElsewhere([feeds.other()], l, flow);
    expect(found?.carry).toBe(true);
    expect(found?.entry.seq).toBe(d.seq);
    // Nothing about another load, or another flow's file of the same name.
    expect(decidedElsewhere([feeds.other()], load('mfa'), flow)).toBeNull();
    expect(decidedElsewhere([feeds.other()], l, { id: 'another', hash: 'h-feeds' })).toBeNull();
  });

  it('is the decision the estate’s page made at Evidence feeds, found from Evidence feeds’ own page', async () => {
    const id = await createIdentity('This browser');
    const estate = new Rec('larkspur', id);
    await heldRun(estate, 'h-estate', 'm2', [hold('story', 'access_reviews'), hold('story', 'posture_wide')]);
    const d = await estate.add('decide', 'ciso', decision(l, 'e', 'm2', 'dont', { flow }), {});
    // The estate's own load follows, carrying it inside the record: no decision of Evidence feeds'.
    await estate.add('decide', 'ciso', decision(load('posture_wide'), 'e', 'm2', 'dont', { carried: { seq: d.seq, leaf: entryLeaf(d) }, base: 'h-estate' }), {});
    const found = decidedElsewhere([estate.other()], l, flow);
    expect(found?.carry).toBe(true);
    expect(found?.entry.seq).toBe(d.seq);
    expect(decidedElsewhere([estate.other()], load('posture_wide'), flow)).toBeNull();
  });

  it('says why a decision isn’t carried: other rules, made before pages carried, not signed yet', async () => {
    const id = await createIdentity('This browser');
    const edited = new Rec('feeds', id);
    await heldRun(edited, 'h-edited', 'm1', [hold('story', 'access_reviews')]);
    await edited.add('decide', 'owner', decision(l, 'f', 'm1', 'asis', { base: 'h-edited' }), { reason: 'r' });
    expect(decidedElsewhere([edited.other()], l, flow)).toMatchObject({ carry: false, why: 'other-rules' });

    const old = new Rec('feeds', id);
    await heldRun(old, 'h-feeds', 'm1', [hold('story', 'access_reviews')]);
    await old.add('decide', 'owner', decision(l, 'f', 'm1'), { reason: 'r' });
    expect(decidedElsewhere([old.other()], l, flow)).toMatchObject({ carry: false, why: 'unsaid' });

    const writing = new Rec('feeds', id);
    await heldRun(writing, 'h-feeds', 'm1', [hold('story', 'access_reviews')]);
    await writing.add('decide', 'owner', decision(l, 'f', 'm1', 'asis', { base: 'h-feeds' }), { reason: 'r', unsigned: true });
    expect(decidedElsewhere([{ ...writing.other(), signed: writing.entries.length - 1 }], l, flow)).toMatchObject({ carry: false, why: 'unsigned' });
    expect(decidedElsewhere([{ ...writing.other(), signed: writing.entries.length, ok: false }], l, flow)).toMatchObject({ carry: false, why: 'unsigned' });
  });

  it('takes the latest decision, amendments included, across the other pages', async () => {
    const id = await createIdentity('This browser');
    const feeds = new Rec('feeds', id);
    await heldRun(feeds, 'h-feeds', 'm1', [hold('story', 'access_reviews')]);
    const first = await feeds.add('decide', 'owner', decision(l, 'f', 'm1', 'dont', { base: 'h-feeds' }), { at: '2026-11-17T10:00:00.000Z' });
    const estate = new Rec('larkspur', id);
    await heldRun(estate, 'h-estate', 'm2', [hold('story', 'access_reviews')]);
    const later = await estate.add('decide', 'ciso', decision(l, 'e', 'm2', 'asis', { flow }), { reason: 'r', at: '2026-11-17T10:05:00.000Z' });
    expect(decidedElsewhere([feeds.other(), estate.other()], l, flow)?.entry).toBe(later);
    const amended = await feeds.add('decide', 'owner', decision(l, 'f', 'm1', 'asis', { base: 'h-feeds' }), { reason: 'r', amends: first.seq, at: '2026-11-17T10:09:00.000Z' });
    expect(decidedElsewhere([feeds.other(), estate.other()], l, flow)?.entry).toBe(amended);
  });

  it('never takes a copy for a source: a record that carried the decision, or applied a standing one, is passed over', async () => {
    const id = await createIdentity('This browser');
    const estate = new Rec('larkspur', id);
    await heldRun(estate, 'h-estate', 'm2', [hold('story', 'access_reviews')]);
    const from: CarriedFrom = { origin: logOrigin('feeds', id.card.fingerprint), seq: 2, leaf: 'a'.repeat(64), kept: 'b'.repeat(64) };
    await estate.add('decide', 'owner', decision(l, 'e', 'm2', 'asis', { flow, from }), { reason: 'r' });
    expect(decidedElsewhere([estate.other()], l, flow)).toBeNull();
    const standing = new Rec('feeds', id);
    await heldRun(standing, 'h-feeds', 'm1', [hold('story', 'access_reviews')]);
    await standing.add('decide', 'owner', { ...decision(l, 'f', 'm1', 'dont', { base: 'h-feeds' }), under: 0 }, {});
    expect(decidedElsewhere([standing.other()], l, flow)).toBeNull();
  });
});

describe('whether a decision here gives way to one made on another page', () => {
  const theirs = { origin: 'smaltfl/log/feeds/0123456789abcdef', seq: 7, at: '2026-11-17T10:05:00.000Z' };
  const mine = (at: string, from?: Partial<CarriedFrom>) => ({ at, about: { ...(from ? { from } : {}) } as unknown as DecideAbout });
  it('does where there is none here, or the one here is older; never where it is that one carried already, or newer', () => {
    expect(givesWay(null, theirs)).toBe(true);
    expect(givesWay(mine('2026-11-17T10:00:00.000Z'), theirs)).toBe(true);
    expect(givesWay(mine('2026-11-17T10:06:00.000Z'), theirs)).toBe(false);
    expect(givesWay(mine('2026-11-17T10:06:00.000Z', { origin: theirs.origin, seq: 7 }), theirs)).toBe(false);
    // Carried from an earlier decision there, which was amended since: the amendment is carried in turn.
    expect(givesWay(mine('2026-11-17T10:01:00.000Z', { origin: theirs.origin, seq: 3 }), theirs)).toBe(true);
    // The build's recorded decision, at its story's time, gives way to one made in the browser.
    expect(givesWay(mine('2024-03-11T08:30:00Z'), theirs)).toBe(true);
    // The same moment, written with and without milliseconds, is no later.
    expect(givesWay(mine('2026-11-17T10:05:00Z'), theirs)).toBe(false);
  });
});

describe('the proof kept beside a carried decision, checked offline', () => {
  const l = load('access_reviews');
  const flow = { id: 'feeds', hash: 'h-feeds' };

  /** Evidence feeds' page decides; the estate's page carries it. */
  async function carriedOnce(o: { option?: DecideAbout['option']; here?: Partial<CarryAbout>; as?: string; reason?: string | null } = {}) {
    const id = await createIdentity('This browser');
    const feeds = new Rec('feeds', id);
    await heldRun(feeds, 'h-feeds', 'm1', [hold('story', 'access_reviews')], '2026-11-17T09:59:00.000Z');
    const there = await feeds.add('decide', 'owner', decision(l, 'f', 'm1', o.option ?? 'asis', { base: 'h-feeds' }), { reason: 'Reviewed late, by plan', at: '2026-11-17T10:00:00.000Z' });
    await feeds.add('release', 'owner', { run: 1, manifest: 'm1', outputs: {}, decision: there.seq, leaf: entryLeaf(there), outcome: 'applied', why: null }, { at: '2026-11-17T10:00:01.000Z' });
    const proof = proofOf(there, feeds.leaves, feeds.checkpoints.at(-1)!);
    const estate = new Rec('larkspur', id);
    await heldRun(estate, 'h-estate', 'm2', [hold('story', 'access_reviews'), hold('story', 'posture_wide')], '2026-11-17T10:01:00.000Z');
    const from: CarriedFrom = { origin: there.origin, seq: there.seq, leaf: entryLeaf(there), kept: 'k'.repeat(64) };
    const here = await estate.add('decide', o.as ?? 'owner', decision(l, 'e', 'm2', o.option ?? 'asis', { flow, from, ...o.here }), { reason: o.reason === undefined ? 'Reviewed late, by plan' : o.reason, at: '2026-11-17T10:02:00.000Z' });
    return { id, feeds, estate, there, here, proof };
  }

  it('holds: the entry, by its leaf, in its record under a checkpoint the browser signed, at the same flow, to the same end', async () => {
    const { id, there, here, proof } = await carriedOnce();
    expect(proof.entry).toBe(there);
    expect(proof.size).toBe(4);
    expect(await carriedProblems(here, proof, id.card)).toEqual([]);
    // As it comes back from a bag: plain JSON.
    expect(await carriedProblems(JSON.parse(JSON.stringify(here)) as LogEntry, JSON.parse(JSON.stringify(proof)), id.card)).toEqual([]);
  });

  it('holds from the estate’s page to Evidence feeds’ own: a decision made at the flow, carried to its page', async () => {
    const id = await createIdentity('This browser');
    const estate = new Rec('larkspur', id);
    await heldRun(estate, 'h-estate', 'm2', [hold('story', 'access_reviews')], '2026-11-17T10:00:00.000Z');
    const there = await estate.add('decide', 'ciso', decision(l, 'e', 'm2', 'dont', { flow }), { at: '2026-11-17T10:00:30.000Z' });
    const feeds = new Rec('feeds', id);
    await heldRun(feeds, 'h-feeds', 'm1', [hold('story', 'access_reviews')], '2026-11-17T10:01:00.000Z');
    const from: CarriedFrom = { origin: there.origin, seq: there.seq, leaf: entryLeaf(there), kept: 'k'.repeat(64) };
    const here = await feeds.add('decide', 'ciso', decision(l, 'f', 'm1', 'dont', { base: 'h-feeds', from }), { at: '2026-11-17T10:02:00.000Z' });
    expect(await carriedProblems(here, proofOf(there, estate.leaves, estate.checkpoints.at(-1)!), id.card)).toEqual([]);
  });

  it('finds a citation that isn’t one, a missing proof, and a proof of another entry', async () => {
    const { id, feeds, here, proof } = await carriedOnce();
    const about = here.about as unknown as CarryAbout;
    expect(await carriedProblems({ ...here, about: { ...about, from: { origin: about.from!.origin, seq: 2 } } as unknown as JSONValue }, proof, id.card)).toEqual(["what it was carried from isn't shaped as a citation (origin, seq, leaf, kept)"]);
    expect(await carriedProblems({ ...here, about: { ...about, from: { ...about.from!, origin: 'somewhere' } } as unknown as JSONValue }, proof, id.card)).toEqual(["it was carried from somewhere, which isn't a flow's record"]);
    expect(await carriedProblems({ ...here, about: { ...about, from: { ...about.from!, origin: here.origin } } as unknown as JSONValue }, proof, id.card)).toEqual(['it was carried from its own record']);
    expect((await carriedProblems(here, null, id.card))[0]).toMatch(/isn't in the bag, or isn't shaped as one/);
    // The proof of the run before it: not the entry cited.
    const other = proofOf(feeds.entries[1]!, feeds.leaves, feeds.checkpoints.at(-1)!);
    expect((await carriedProblems(here, other, id.card))[0]).toMatch(/isn't #2 of .* with the leaf it cites/);
    // The entry changed after it was cited: its leaf is another.
    const changed = { ...proof, entry: { ...proof.entry, reason: 'Another reason' } };
    expect((await carriedProblems(here, changed, id.card))[0]).toMatch(/isn't #2 of .* with the leaf it cites/);
  });

  it('finds a proof that doesn’t place the entry, and a checkpoint that isn’t the record’s or the browser’s', async () => {
    const { id, feeds, here, proof } = await carriedOnce();
    expect(await carriedProblems(here, { ...proof, proof: [...proof.proof].reverse().concat('0'.repeat(64)) }, id.card)).toEqual([expect.stringMatching(/doesn't place #2/)]);
    expect(await carriedProblems(here, { ...proof, checkpoint: feeds.checkpoints[1]! }, id.card)).toEqual(["the checkpoint its proof is under isn't of that record at that size and root"]);
    expect(await carriedProblems(here, { ...proof, checkpoint: { ...proof.checkpoint, signature: '0'.repeat(128) } }, id.card)).toEqual([expect.stringMatching(/doesn't check: the signature doesn't match/)]);
    // Signed by another browser's key: a record this browser can't vouch for.
    const stranger = await createIdentity('Another browser');
    const theirs = new Rec('feeds', stranger);
    await heldRun(theirs, 'h-feeds', 'm1', [hold('story', 'access_reviews')], '2026-11-17T09:59:00.000Z');
    const made = await theirs.add('decide', 'owner', decision(l, 'f', 'm1', 'asis', { base: 'h-feeds' }), { reason: 'Reviewed late, by plan', at: '2026-11-17T10:00:00.000Z' });
    const about = here.about as unknown as CarryAbout;
    const cites = { ...here, about: { ...about, from: { ...about.from!, origin: made.origin, seq: made.seq, leaf: entryLeaf(made) } } as unknown as JSONValue };
    const problems = await carriedProblems(cites, proofOf(made, theirs.leaves, theirs.checkpoints.at(-1)!), id.card);
    expect(problems).toEqual([expect.stringMatching(/a record signed by .*, not by this record's browser/), expect.stringMatching(/was signed by .*, not by this record's browser/)]);
  });

  it('finds a decision that isn’t the one it carries: another end, another flow, another person, another reason, or made after', async () => {
    const { id, here, proof } = await carriedOnce();
    const about = here.about as unknown as CarryAbout;
    const said = async (e: LogEntry) => await carriedProblems(e, proof, id.card);
    expect(await said({ ...here, about: { ...about, option: 'dont' } as unknown as JSONValue })).toEqual([expect.stringMatching(/is to asis, not to dont/)]);
    expect(await said({ ...here, about: { ...about, scope: 'untilPass' } as unknown as JSONValue })).toEqual([expect.stringMatching(/is for other days/)]);
    expect(await said({ ...here, about: { ...about, load: load('mfa') } as unknown as JSONValue })).toEqual([expect.stringMatching(/is about another load/)]);
    expect(await said({ ...here, about: { ...about, flow: { id: 'feeds', hash: 'h-edited' } } as unknown as JSONValue })).toEqual([expect.stringMatching(/was made at feeds \(h-feeds\), and this decision is feeds's \(h-edited\)/)]);
    expect(await said({ ...here, by: { ...here.by, as: 'ciso' } })).toEqual([expect.stringMatching(/was decided by owner, and this says ciso/)]);
    expect(await said({ ...here, reason: 'Another reason' })).toEqual([expect.stringMatching(/gives another reason/)]);
    expect(await said({ ...here, at: '2026-11-17T09:00:00.000Z' })).toEqual([expect.stringMatching(/was decided after it was carried/)]);
  });

  it('holds a level and a remedy to the ones carried', async () => {
    const level = { source: 'access_reviews', from: DAY, metrics: ['count:status="late"'] };
    const id = await createIdentity('This browser');
    const feeds = new Rec('feeds', id);
    await heldRun(feeds, 'h-feeds', 'm1', [hold('story', 'access_reviews')], '2026-11-17T09:59:00.000Z');
    const there = await feeds.add('decide', 'owner', decision(l, 'f', 'm1', 'accept', { base: 'h-feeds', level }), { reason: 'r', at: '2026-11-17T10:00:00.000Z' });
    const proof = proofOf(there, feeds.leaves, feeds.checkpoints.at(-1)!);
    const estate = new Rec('larkspur', id);
    const from: CarriedFrom = { origin: there.origin, seq: there.seq, leaf: entryLeaf(there), kept: 'k'.repeat(64) };
    const same = await estate.add('decide', 'owner', decision(l, 'e', 'm2', 'accept', { flow, from, level: { ...level, source: 'Access_Reviews' } }), { reason: 'r', at: '2026-11-17T10:02:00.000Z' });
    expect(await carriedProblems(same, proof, id.card)).toEqual([]);
    const other = await estate.add('decide', 'owner', decision(l, 'e', 'm2', 'accept', { flow, from, level: { ...level, metrics: ['count:status="pass"'] } }), { reason: 'r', at: '2026-11-17T10:02:00.000Z' });
    expect(await carriedProblems(other, proof, id.card)).toEqual([expect.stringMatching(/is of another level/)]);
  });
});

describe('what a decision says of its record’s own flow', () => {
  it('is the flow as kept before the run it decides, as the record’s flow entries say', () => {
    const entries = [
      { seq: 0, kind: 'flow', about: { before: null, after: 'h1' } },
      { seq: 1, kind: 'run', about: {} },
      { seq: 2, kind: 'flow', about: { before: 'h1', after: 'h2' } },
      { seq: 3, kind: 'run', about: {} },
    ] as unknown as LogEntry[];
    expect(baseOf(entries, 1)).toBe('h1');
    expect(baseOf(entries, 3)).toBe('h2');
    expect(baseOf(entries, 0)).toBeNull();
    expect(baseProblems(entries, {}, 1)).toEqual([]);
    expect(baseProblems(entries, { base: 'h1' }, 1)).toEqual([]);
    expect(baseProblems(entries, { base: 'h2' }, 3)).toEqual([]);
    expect(baseProblems(entries, { base: 'h2-and-more' }, 1)).toEqual(['it says its flow was h2-and-more as kept, and the record kept h1 before its run']);
    expect(baseProblems(entries, { base: 'h1' }, null)).toEqual(['it says its flow was h1 as kept, and the record kept none before its run']);
    expect(baseProblems(entries, { base: 'h1', flow: { id: 'feeds', hash: 'x' } }, 1)).toEqual(['it names a flow it reads and its own flow as kept: a decision is of one flow']);
    expect(baseProblems(entries, { base: 7 as unknown as string }, 1)).toEqual(["the flow it says it was made at isn't a hash"]);
  });
});

describe('a day decided on the estate’s page, as its record keeps it', () => {
  it('records the file’s decision as Evidence feeds’ and the step’s as the estate’s own, by the flow as kept', async () => {
    const doc = await loadFlowDir(estateDir);
    const feeds = doc.flows!.find((f) => f.id === 'feeds')!;
    const holds = [hold('story', 'access_reviews'), hold('story', 'posture_wide')];
    const abouts = loadDecisions({ run: 1, manifest: 'm', inputs: inputs('e'), loads: [load('access_reviews'), load('posture_wide')], option: 'asis', scope: 'day', policies: 'p', rule: null });
    // As the page writes them: a read flow's load says the flow; the document's own says the flow as kept.
    const told = withRoles(doc, holds, abouts).map(({ about }) => ({ ...about, ...(!about.flow ? { base: 'the-estate-as-kept' } : {}) }) as CarryAbout);
    expect(told.map((a) => [a.load!.source, a.flow?.id ?? null, a.base ?? null])).toEqual([['access_reviews', 'feeds', null], ['posture_wide', null, 'the-estate-as-kept']]);
    const id = await createIdentity('This browser');
    const origin = logOrigin('larkspur', id.card.fingerprint);
    expect(madeAt({ origin, about: told[0] as unknown as JSONValue })).toEqual({ id: 'feeds', hash: feeds.hash });
    expect(madeAt({ origin, about: told[1] as unknown as JSONValue })).toEqual({ id: 'larkspur', hash: 'the-estate-as-kept' });
    expect(loadKey(told[0]!.load!)).toBe(loadKey(load('access_reviews')));
  });
});

describe('Evidence feeds’ own page, on the tour’s files', () => {
  const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as Record<string, any>;
  const estate = json('../examples/larkspur/data.json');
  const own = json('../examples/larkspur/feeds/data.json');

  it('is made by the tour’s generator with the tour’s arguments, so its files are the tour’s', () => {
    expect(own.generate).toBe(estate.generate);
    expect(own.generateArgs).toEqual(estate.variants.tour.generateArgs);
    expect(own.flow).toBe('feeds');
  });

  it('binds every file the flow has, its own and those of the flow it reads, as the estate binds them', async () => {
    const doc = await loadFlowDir(feedsDir);
    expect(Object.keys(own.sources).sort()).toEqual(doc.sources.map((x) => x.id).sort());
    for (const [id, binding] of Object.entries(own.sources)) expect(binding, id).toEqual(estate.sources[id]);
    expect(doc.sources.some((x) => x.id === own.judged)).toBe(true);
  });

  it('tells the tour’s story as far as it is about its files: the same files sent again, the same decisions at the same times', async () => {
    const doc = await loadFlowDir(feedsDir);
    const mine = new Set(doc.sources.map((x) => x.id));
    const tour = json('../examples/larkspur/tour.json');
    const story = json('../examples/larkspur/feeds/tour.json');
    expect(story.format).toBe(tour.format);
    expect(story.flow).toBe('feeds');
    expect(own.story).toBe('examples/larkspur/feeds/tour.json');
    expect(story.deliveries).toEqual(tour.deliveries.filter((d: { file: string }) => mine.has(d.file)));
    // The days another flow's file was sent again are that flow's to decide, and none of this page's.
    const others = new Set(tour.deliveries.filter((d: { file: string }) => !mine.has(d.file)).map((d: { day: string }) => d.day));
    const bare = ({ by: _by, ...rest }: { by: string }) => rest;
    expect(story.decisions.map(bare)).toEqual(tour.decisions.filter((d: { day: string }) => !others.has(d.day)).map(bare));
    // The flow has no policies: each decision is its owner's.
    expect(doc.policies).toBeUndefined();
    expect(new Set(story.decisions.map((d: { by: string }) => d.by))).toEqual(new Set(['owner']));
    // The day the tour leaves for a visitor to decide is left here too: it is the day a decision is carried on.
    expect(story.decisions.some((d: { day: string }) => d.day === DAY)).toBe(false);
  });
});

describe('the words', () => {
  it('names a page by its flow, and says where a decision was carried from', async () => {
    const id = await createIdentity('This browser');
    const names: Record<string, string> = { feeds: 'Evidence feeds', larkspur: 'Larkspur estate' };
    const nameOf = (f: string) => names[f] ?? f;
    expect(pageOf('Evidence feeds')).toBe('Evidence feeds’ page');
    expect(pageOf('Larkspur estate')).toBe('Larkspur estate’s page');
    expect(carriedSaid({ from: { origin: logOrigin('feeds', id.card.fingerprint), seq: 12 } }, nameOf)).toBe(' · carried from Evidence feeds’ page, its #12');
    expect(carriedSaid({}, nameOf)).toBe('');
    expect(carriedSaid(null, nameOf)).toBe('');
    expect(notCarriedSaid('other-rules', 'Evidence feeds’ page', 'Evidence feeds')).toBe('Decided on Evidence feeds’ page, where Evidence feeds isn’t as it is here: its rules differ, so that decision isn’t carried. Decide it here.');
    expect(notCarriedSaid('unsaid', 'Evidence feeds’ page', 'Evidence feeds')).toMatch(/before decisions were carried between pages/);
    expect(notCarriedSaid('unsigned', 'Evidence feeds’ page', 'Evidence feeds')).toMatch(/hasn’t signed it yet/);
  });
});
