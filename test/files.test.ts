/**
 * The files someone added in the app, kept in this browser (src/app/files.ts, ADR 0027 §5): by the flow and their
 * sha256, in a database of their own; in memory where the browser keeps nothing.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fileKey, FileStore } from '../src/app/files.js';
import { installFakeIndexedDB } from './helpers/fake-idb.js';

let uninstall: (() => void) | null = null;
afterEach(() => {
  uninstall?.();
  uninstall = null;
});

const bytes = (text: string) => new TextEncoder().encode(text);

describe('the files added here', () => {
  it('are kept by the flow and their hash, and are there for another page of the same browser', async () => {
    uninstall = installFakeIndexedDB();
    const store = await FileStore.open();
    expect(store.kept).toBe(true);
    const key = fileKey('signins', 'a'.repeat(64));
    expect(key).toBe(`signins:${'a'.repeat(64)}`);
    await store.put(key, 'vendors.csv', bytes('id\n1\n'));
    // A page opened later reads what the first one put.
    const later = await FileStore.open();
    const got = await later.get(key);
    expect([got?.name, new TextDecoder().decode(got!.bytes)]).toEqual(['vendors.csv', 'id\n1\n']);
    expect(await later.get(fileKey('signins', 'b'.repeat(64)))).toBeNull();
    await later.delete(key);
    expect(await (await FileStore.open()).get(key)).toBeNull();
  });

  it('are held in memory, for the page alone, where the browser has no database', async () => {
    // No database, whatever another test of the same worker left installed.
    const g = globalThis as Record<string, unknown>;
    const had = g.indexedDB;
    g.indexedDB = undefined;
    uninstall = () => void (g.indexedDB = had);
    const store = await FileStore.open();
    expect(store.kept).toBe(false);
    await store.put('f:1', 'a.csv', bytes('a\n'));
    expect((await store.get('f:1'))?.name).toBe('a.csv');
    expect(await (await FileStore.open()).get('f:1')).toBeNull();
    await store.delete('f:1');
    expect(await store.get('f:1')).toBeNull();
  });
});
