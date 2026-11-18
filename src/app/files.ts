/**
 * The files someone added in the app (ADR 0027 §5), kept in this browser. A source added here reads a file the build
 * didn't ship: its bytes are kept under the flow and their sha256 in a database of their own (IndexedDB
 * `smaltfl-files`), beside the record and never in it, so the flow as kept can be run again after a reload. Where the
 * browser keeps nothing (a private window, no IndexedDB), they are held in memory for as long as the page lasts, and
 * `kept` says so.
 */

/** A file kept: the name it was added under, its bytes and when. */
export interface KeptFile {
  key: string;
  name: string;
  bytes: Uint8Array;
  at: string;
}

const DB = 'smaltfl-files';
const STORE = 'files';
/** How long IndexedDB may take to open, in ms: some browsers have been known to leave an open request unanswered. */
const OPEN_WAIT = 5000;

/** A file's key: the flow it was added to and its sha256. */
export const fileKey = (flow: string, sha256: string): string => `${flow}:${sha256}`;

function openDb(wait: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no IndexedDB'));
    let settled = false;
    const settle = (f: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      f();
    };
    const timer = setTimeout(() => settle(() => reject(new Error(`IndexedDB didn't answer within ${wait} ms`))), wait);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB, 1);
    } catch (e) {
      settle(() => reject(e));
      return;
    }
    req.onupgradeneeded = () => void req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => (settled ? req.result.close() : settle(() => resolve(req.result)));
    req.onerror = () => settle(() => reject(req.error));
    req.onblocked = () => settle(() => reject(new Error('the files are open in an older tab')));
  });
}

/** The files added here: in the browser's database where it has one, else in memory. */
export class FileStore {
  private readonly memory = new Map<string, KeptFile>();
  private constructor(private conn: IDBDatabase | null) {}

  /** Whether a file put here is there after a reload. */
  get kept(): boolean {
    return this.conn !== null;
  }

  static async open(wait = OPEN_WAIT): Promise<FileStore> {
    try {
      return new FileStore(await openDb(wait));
    } catch {
      return new FileStore(null);
    }
  }

  /** One request on the store, answered when its transaction has completed (a write) or the request has (a read). */
  private ask<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
    const db = this.conn!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = work(tx.objectStore(STORE));
      if (req) {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } else {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }
    });
  }

  /** Keep a file; where the browser refuses it (its quota, a closed database), in memory, and `kept` says so from then. */
  async put(key: string, name: string, bytes: Uint8Array): Promise<void> {
    const file: KeptFile = { key, name, bytes, at: new Date().toISOString() };
    this.memory.set(key, file);
    if (!this.conn) return;
    try {
      await this.ask('readwrite', (s) => void s.put(file));
    } catch {
      this.conn = null;
    }
  }

  async get(key: string): Promise<KeptFile | null> {
    const held = this.memory.get(key);
    if (held || !this.conn) return held ?? null;
    try {
      const row = (await this.ask<KeptFile | undefined>('readonly', (s) => s.get(key) as IDBRequest<KeptFile | undefined>)) ?? null;
      // A browser gives back what it cloned: bytes as a typed array, or the buffer of one.
      return row ? { ...row, bytes: row.bytes instanceof Uint8Array ? row.bytes : new Uint8Array(row.bytes as ArrayBufferLike) } : null;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    if (!this.conn) return;
    try {
      await this.ask('readwrite', (s) => void s.delete(key));
    } catch {
      // Nothing kept to delete, or the browser closed the database: the file is gone from this page either way.
    }
  }
}
