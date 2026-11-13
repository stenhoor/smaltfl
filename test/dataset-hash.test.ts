/**
 * The dataset content hash (src/plugin/dataset-hash.ts) against its encoding as written there: each row's values tagged
 * and encoded, each row hashed, the row hashes sorted and cut into chunks, the schema and the count in front. The
 * reference here is that text implemented plainly (TextEncoder for text, WebCrypto for every digest), so a faster
 * encoding in the hasher that changes a byte fails. And the text encoder the hasher uses writes exactly TextEncoder's
 * bytes, for plain ASCII, accents, scripts past Latin, a pair of surrogates and a lone one.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import { canonicalJSON } from '../src/core/canonical.js';
import { hashTable, writeUtf8 } from '../src/plugin/dataset-hash.js';

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** The encoding as the module's header says it, value by value. */
function encodeValue(v: unknown, declared: string, out: number[]): void {
  const storage = declared === 'ANY' ? (v === null ? 'null' : typeof v === 'string' ? 'text' : typeof v === 'bigint' || Number.isInteger(v) ? 'integer' : v instanceof Uint8Array ? 'blob' : 'real') : { INTEGER: 'integer', REAL: 'real', TEXT: 'text', BLOB: 'blob' }[declared]!;
  if (v === null) return void out.push(0);
  const u32 = (n: number) => out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  if (storage === 'integer') {
    const b = new DataView(new ArrayBuffer(8));
    b.setBigInt64(0, BigInt(v as number | bigint));
    out.push(1, ...new Uint8Array(b.buffer));
  } else if (storage === 'real') {
    const b = new DataView(new ArrayBuffer(8));
    b.setFloat64(0, (v as number) === 0 ? 0 : (v as number));
    out.push(2, ...new Uint8Array(b.buffer));
  } else if (storage === 'text') {
    const t = new TextEncoder().encode(v as string);
    out.push(3);
    u32(t.length);
    out.push(...t);
  } else {
    const t = v as Uint8Array;
    out.push(4);
    u32(t.length);
    out.push(...t);
  }
}

async function reference(columns: [string, string][], rows: unknown[][]): Promise<string> {
  const hashes: Uint8Array[] = [];
  for (const r of rows) {
    const bytes: number[] = [];
    r.forEach((v, k) => encodeValue(v, columns[k]![1], bytes));
    hashes.push(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))));
  }
  hashes.sort((a, b) => (hex(a) < hex(b) ? -1 : hex(a) > hex(b) ? 1 : 0));
  const count = new Uint8Array(8);
  new DataView(count.buffer).setBigUint64(0, BigInt(rows.length));
  const chunks: Uint8Array[] = [];
  for (let at = 0; at < hashes.length; at += 32768) {
    const part = hashes.slice(at, at + 32768);
    const all = new Uint8Array(part.length * 32);
    part.forEach((h, i) => all.set(h, i * 32));
    chunks.push(new Uint8Array(await crypto.subtle.digest('SHA-256', all)));
  }
  const head = new TextEncoder().encode(`smaltfl/dataset/0\n${canonicalJSON(columns)}\n`);
  const all = new Uint8Array(head.length + 8 + chunks.length * 32);
  all.set(head, 0);
  all.set(count, head.length);
  chunks.forEach((c, i) => all.set(c, head.length + 8 + i * 32));
  return hex(await crypto.subtle.digest('SHA-256', all));
}

const TEXTS = ['', 'ana', 'a long plain ASCII value with spaces, digits 0123456789 and punctuation !?', 'café', 'Zürich-Nord', 'naïve résumé', 'Ελληνικά', '日本語のテキスト', 'mixed: abc 日本 def', 'emoji 🚀 after ASCII', '🚀', 'tab\tand\nnewline', '\u007f\u0080', 'lone \ud800 surrogate', '\udc00 first'];

describe('the dataset hash, as its encoding says', () => {
  it('writes text exactly as TextEncoder does', () => {
    const buf = new Uint8Array(1024);
    for (const s of TEXTS) {
      buf.fill(0xaa);
      const n = writeUtf8(s, buf, 7);
      expect([...buf.subarray(7, 7 + n)], s).toEqual([...new TextEncoder().encode(s)]);
    }
  });

  it('hashes a table to the content its header describes, whatever its values', async () => {
    const db = Database.openMemory({ plugins: [] });
    db.exec('CREATE TABLE t (name TEXT, n INTEGER, x REAL, b BLOB, a ANY)');
    const rows: unknown[][] = TEXTS.map((s, k) => [s, k - 3, k === 2 ? -0 : k / 7, k % 3 ? new Uint8Array([k, 255, 0]) : null, k % 4 === 0 ? null : k % 4 === 1 ? `any ${s}` : k % 4 === 2 ? k * 1000 : k + 0.5]);
    rows.push([null, null, null, null, null], ['ana', 2 ** 40, 1e-300, new Uint8Array(), '']);
    for (const r of rows) db.run('INSERT INTO t VALUES (?, ?, ?, ?, ?)', r as never);
    const h = await hashTable(db, 't');
    const read = db.query('SELECT name, n, x, b, a FROM t').rows;
    expect(h.rows).toBe(rows.length);
    expect(h.content).toBe(await reference(h.columns, read));
  });
});
