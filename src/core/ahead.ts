/**
 * Judged ahead (ADR 0019 amendment 1): what a pure, seeded judge computed for the first loads day, shipped in the ranges
 * file beside the history, so the page and the engine look it up instead of computing it as the page opens. Each entry
 * is keyed by the sha256 of the judge's exact inputs (every argument, as JSON), so it is taken only for the very call
 * the build made: any other rows, days, columns or options miss, and are computed as before. The judge is seeded (the
 * same inputs always give the same answer), so a hit is the answer the judge would give. Today: the classifier's
 * answer for a day (`apartEvidence`, ADR 0014 §5), whose boosted stumps are most of a load's judging.
 */
import { utf8 } from './hash.js';
import { sha256HexSync } from './sha256.js';

/** The judges a result may be shipped for. */
export type AheadKind = 'apart';

/** Results as shipped: `kind:sha256` of the inputs, and what the judge returned for them. */
export type AheadEntries = [key: string, value: unknown][];

const given = new Map<string, unknown>();
let recording: Map<string, unknown> | null = null;
let served = 0;

/** Every argument as JSON a key is made of: sets in order, big integers as text, nothing left out. */
function inputsText(args: unknown): string {
  if (Array.isArray(args) && args.every((r) => Array.isArray(r) && r.every((v) => v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))) return JSON.stringify(args);
  return JSON.stringify(args, (_k, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v instanceof Set ? { set: [...(v as Set<unknown>)].map(String).sort() } : v === undefined ? null : v));
}

/** The key of a call: the judge and the sha256 of its inputs. */
export function aheadKey(kind: AheadKind, args: unknown): string {
  return `${kind}:${sha256HexSync(utf8(inputsText(args)))}`;
}

/**
 * Rows as part of a key: the sha256 of their JSON, made once for the same rows (a sample's day is read by the claim, the
 * story and the Models tab alike, and nothing changes rows once kept).
 */
export function rowsKey(rows: readonly (readonly unknown[])[]): string {
  let k = rowKeys.get(rows);
  if (k === undefined) rowKeys.set(rows, (k = sha256HexSync(utf8(inputsText(rows)))));
  return k;
}
const rowKeys = new WeakMap<object, string>();

/**
 * The judge's answer for these inputs: shipped, when an entry has their key; computed otherwise (and kept, while the
 * build records). With nothing shipped and nothing recording, the inputs aren't even hashed.
 */
export function judgedAhead<T>(kind: AheadKind, args: () => unknown, compute: () => T): T {
  if (!given.size && !recording) return compute();
  const key = aheadKey(kind, args());
  if (given.has(key)) {
    served++;
    return given.get(key) as T;
  }
  const value = compute();
  if (recording) recording.set(key, value);
  return value;
}

/** Shipped results, taken in: from the ranges file once it is checked against the data list (the page) or pinned (the
 * engine). Only well-formed keys are taken; a few files' worth are kept. */
export function giveAhead(entries: unknown): void {
  if (!Array.isArray(entries)) return;
  for (const e of entries) {
    if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || !/^apart:[0-9a-f]{64}$/.test(e[0])) continue;
    given.set(e[0], e[1]);
  }
  while (given.size > 256) given.delete(given.keys().next().value!);
}

/** What has been taken from shipped results since the page started: for the perf marks and the tests. */
export const aheadServed = (): number => served;

/** Forget every shipped result (the tests). */
export function forgetAhead(): void {
  given.clear();
  served = 0;
}

/** Record every call the judges make while `f` runs (the build): the entries a ranges file ships. */
export async function recordAhead(f: () => Promise<unknown>): Promise<AheadEntries> {
  const mine = new Map<string, unknown>();
  const before = recording;
  recording = mine;
  try {
    await f();
  } finally {
    recording = before;
  }
  return [...mine];
}
