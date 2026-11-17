/**
 * The other records a browser keeps (ADR 0026 §6, second step): a page reads the record of another page that shares a
 * flow with it, checked as that page reads it, and never writes it. On the tests' IndexedDB.
 */
import { describe, expect, it } from 'vitest';
import { FlowRecord } from '../src/app/record.js';
import { originOf, proofOf, carriedProblems, type CarriedFrom } from '../src/core/carry.js';
import { entryLeaf, parseCheckpoint, type JSONValue } from '../src/core/log.js';
import { installFakeIndexedDB } from './helpers/fake-idb.js';

const load = { source: 'access_reviews', slot: '2024-03-27', sha256: 'a'.repeat(64) };
const decision = (extra: Record<string, unknown> = {}): JSONValue =>
  ({ day: load.slot, run: 1, manifest: 'm1', inputs: { flow: 'f', parameters: {}, files: {} }, outputs: {}, option: 'dont', scope: 'day', policies: 'p', rule: null, load, ...extra }) as unknown as JSONValue;

describe('the other records this browser keeps', () => {
  it('reads another flow’s record as its own page keeps it: its entries, checked under its checkpoints', async () => {
    const uninstall = installFakeIndexedDB();
    try {
      const feeds = await FlowRecord.open('feeds', { wait: 1000 });
      await feeds.append('flow', 'owner', { before: null, after: 'h-feeds', doc: await feeds.keep('flow', { name: 'Evidence feeds' }) });
      await feeds.append('run', 'owner', { run: 1, manifest: 'm1', outcome: 'held' });
      const decided = await feeds.append('decide', 'owner', decision({ base: 'h-feeds' }));
      const estate = await FlowRecord.open('larkspur', { wait: 1000 });
      // One identity a browser: the two records are signed by the same key.
      expect(estate.identity.card.fingerprint).toBe(feeds.identity.card.fingerprint);
      const [other, ...rest] = await estate.others();
      expect(rest).toEqual([]);
      expect(other!.flow).toBe('feeds');
      expect(other!.origin).toBe(feeds.origin);
      expect(other!.foreign).toBe(true);
      expect(other!.entries).toEqual(feeds.entries);
      expect(other!.leaves).toEqual(feeds.leaves);
      expect(other!.status).toMatchObject({ ok: true, size: 3, signed: 3 });
      // Never written from here.
      await expect(other!.append('decide', 'owner', decision())).rejects.toThrow(/another page's record/);
      await expect(other!.sign()).rejects.toThrow(/another page's record/);
      expect((await FlowRecord.open('feeds', { wait: 1000 })).entries).toHaveLength(3);
      // What it keeps by hash is read back: the flow's document, for its name.
      const doc = (other!.last('flow')!.about as { doc: string }).doc;
      expect(await other!.kept(doc)).toEqual({ name: 'Evidence feeds' });
      expect(await other!.kept('0'.repeat(64))).toBeNull();
      // A checkpoint that covers the decision: what its proof is given under.
      const checkpoint = other!.covering(decided.seq)!;
      expect(parseCheckpoint(checkpoint.checkpoint)).toMatchObject({ origin: feeds.origin, size: 3 });
      expect(other!.covering(3)).toBeUndefined();
      expect(estate.foreign).toBe(false);
    } finally {
      uninstall();
    }
  });

  it('reads on from where it left it, so a decision made on the other page since is found', async () => {
    const uninstall = installFakeIndexedDB();
    try {
      const feeds = await FlowRecord.open('feeds', { wait: 1000 });
      await feeds.append('run', 'owner', { run: 1, manifest: 'm1', outcome: 'held' });
      const estate = await FlowRecord.open('larkspur', { wait: 1000 });
      const [first] = await estate.others();
      expect(first!.entries).toHaveLength(1);
      await feeds.append('decide', 'owner', decision({ base: 'h-feeds' }));
      const [again] = await estate.others();
      // The same record, read on: nothing it had is read twice.
      expect(again).toBe(first);
      expect(again!.entries.map((e) => e.kind)).toEqual(['run', 'decide']);
      expect(again!.status).toMatchObject({ ok: true, size: 2, signed: 2 });
      // Nothing new: it stands as it was checked.
      const status = again!.status;
      await estate.others();
      expect(again!.status).toBe(status);
    } finally {
      uninstall();
    }
  });

  it('reads only the records it is asked for, and never its own', async () => {
    const uninstall = installFakeIndexedDB();
    try {
      for (const flow of ['feeds', 'control-estate', 'security-signins']) await (await FlowRecord.open(flow, { wait: 1000 })).append('run', 'owner', { run: 1, outcome: 'ok' });
      const estate = await FlowRecord.open('larkspur', { wait: 1000 });
      await estate.append('run', 'owner', { run: 1, outcome: 'ok' });
      expect((await estate.others()).map((r) => r.flow).sort()).toEqual(['control-estate', 'feeds', 'security-signins']);
      expect((await estate.others((flow) => flow === 'feeds')).map((r) => r.flow)).toEqual(['feeds']);
      expect(await estate.others(() => false)).toEqual([]);
      // A record read from another page reads no others itself.
      expect(await (await estate.others((flow) => flow === 'feeds'))[0]!.others()).toEqual([]);
    } finally {
      uninstall();
    }
  });

  it('has none where the record is kept for this visit only', async () => {
    // No IndexedDB here (a private window, a blocked store), whatever another test left installed.
    const g = globalThis as Record<string, unknown>;
    const had = g.indexedDB;
    g.indexedDB = undefined;
    try {
      const rec = await FlowRecord.open('larkspur', { wait: 50 });
      expect(rec.durable).toBe(false);
      expect(await rec.others()).toEqual([]);
    } finally {
      g.indexedDB = had;
    }
  });

  it('keeps the proof of a decision it carried, and exports it with what its entries name', async () => {
    const uninstall = installFakeIndexedDB();
    try {
      const feeds = await FlowRecord.open('feeds', { wait: 1000 });
      await feeds.append('flow', 'owner', { before: null, after: 'h-feeds', doc: await feeds.keep('flow', { name: 'Evidence feeds' }) });
      await feeds.append('run', 'owner', { run: 1, manifest: 'm1', outcome: 'held' });
      const there = await feeds.append('decide', 'owner', decision({ base: 'h-feeds' }), 'The reviews ran late');
      const estate = await FlowRecord.open('larkspur', { wait: 1000 });
      const [other] = await estate.others();
      const proof = proofOf(there, other!.leaves, other!.covering(there.seq)!);
      const kept = await estate.keep('carried', proof);
      const from: CarriedFrom = { origin: there.origin, seq: there.seq, leaf: entryLeaf(there), kept };
      const here = await estate.append('decide', 'owner', decision({ manifest: 'm2', flow: { id: 'feeds', hash: 'h-feeds' }, from }), 'The reviews ran late');
      expect(originOf(from.origin)).toEqual({ flow: 'feeds', signer: estate.identity.card.fingerprint.slice(0, 16) });
      // The bag's blobs: the proof, by the hash the decision names, and nothing the entries don't name.
      await estate.keep('flow', { name: 'not named by any entry' });
      const blobs = await estate.blobs();
      expect(blobs.map((b) => [b.kind, b.hash])).toEqual([['carried', kept]]);
      // As an auditor checks it, from the bag alone.
      expect(await carriedProblems(here, JSON.parse(blobs[0]!.json), estate.identity.card)).toEqual([]);
    } finally {
      uninstall();
    }
  });
});
