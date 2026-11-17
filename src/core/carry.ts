/**
 * A decision carried between pages (ADR 0025 §6, second step, Q-240). A hold is the flow's whose file or step holds,
 * and so is the decision: made once, at that flow, on whichever page the flow is on. Two pages of one browser that
 * share a flow keep a record each (a record is one flow's, log.ts `logOrigin`), in one store. Where the same file
 * holds the same flow on both, the page that finds it decided on the other records that decision as its own record
 * needs it (one decision a held load, ADR 0010 §7), citing the entry it carried by the other record's origin, its seq
 * and its leaf, and asks no one.
 *
 * Pure: what a decision's entry says of the flow it was made at, which decision of another record a held load takes,
 * the proof kept beside a carried decision, how an auditor checks it offline, and the words. The page reads the other
 * records (src/app/record.ts) and applies the decision (src/app/main.ts). Not in what the data's cache is keyed by.
 */
import { canonicalJSON } from './canonical.js';
import { isDecisionFlow, loadRoles, possessive } from './deciding.js';
import type { FlowDocument } from './document.js';
import { decisionForLoad, heldLoadsOf, isLoad, loadKey, type DecideAbout, type Decided, type Hold, type Load } from './hold.js';
import { entryLeaf, inclusionProof, parseCheckpoint, verifyCheckpoint, verifyInclusion, type LogEntry, type SignedCheckpoint } from './log.js';
import type { IdentityCard } from './manifest.js';

export const CARRIED_FORMAT = 1;

/** Where a carried decision was made (ADR 0025 §6): the other record's entry, and the proof of it kept here. */
export interface CarriedFrom {
  /** The record it is kept in, by its origin (`smaltfl/log/<flow>/<signer>`): another flow's, signed by this browser. */
  origin: string;
  /** Its place there, and its log/1 leaf. */
  seq: number;
  leaf: string;
  /** The proof kept beside this record (a blob of kind `carried`, by its hash): the entry itself, in its record under a
   * checkpoint its browser signed. */
  kept: string;
}

/** A decision's entry as a page writes it (hold.ts `DecideAbout`), with what carrying needs. */
export type CarryAbout = DecideAbout & {
  /**
   * The flow as kept when the run it decides ran: its document with its change sets, by flow hash (ADR 0021 §5), as the
   * record's `flow` entry before that run says. What a decision of the record's own flow is known by on another page;
   * one of a flow the document reads says `flow`. Written by a page, never by the build's recorder.
   */
  base?: string;
  /** The decision it was carried from, where it was made on another page. */
  from?: CarriedFrom;
};

/** The proof kept beside a carried decision: what an auditor without the other record checks it by. */
export interface CarriedProof {
  smaltflCarried: typeof CARRIED_FORMAT;
  /** The decision as its own record keeps it. */
  entry: LogEntry;
  /** A checkpoint of that record its browser signed, its size and root, and the entry's inclusion proof under it (RFC
   * 9162 §2.1.3). */
  size: number;
  root: string;
  proof: string[];
  checkpoint: SignedCheckpoint;
}

type Doc = Pick<FlowDocument, 'id' | 'flows' | 'steps'>;
type Held = Pick<Hold, 'by' | 'origin' | 'load' | 'reaches'>;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const ORIGIN = /^smaltfl\/log\/([^/]*)\/([0-9a-f]{16})$/;

/** A flow's record's origin read (log.ts `logOrigin`): the flow it is of, and the signer it names. Null for any other
 * text. */
export function originOf(origin: unknown): { flow: string; signer: string } | null {
  const m = typeof origin === 'string' ? ORIGIN.exec(origin) : null;
  if (!m) return null;
  try {
    return { flow: decodeURIComponent(m[1]!), signer: m[2]! };
  } catch {
    return null;
  }
}

/**
 * The flow a decision was made at, as its entry says it: the flow it names, where that is a flow its page reads; else
 * its record's own flow, by the flow as kept when its run ran (`base`). Null where the entry says neither: a decision
 * of a record's own flow made before pages carried decisions, or one the build recorded.
 */
export function madeAt(entry: Pick<LogEntry, 'origin' | 'about'>): { id: string; hash: string } | null {
  const a = entry.about as unknown;
  if (!isRecord(a)) return null;
  if (a.flow !== undefined) return isDecisionFlow(a.flow) ? { id: a.flow.id, hash: a.flow.hash } : null;
  const own = originOf(entry.origin);
  return own && typeof a.base === 'string' ? { id: own.flow, hash: a.base } : null;
}

/** A held load a hold leads with, and the flow whose file or step holds it, as this page knows it. */
export interface Leading {
  load: Load;
  flow: { id: string; hash: string };
}

/**
 * The held loads of a run whose holds lead (deciding.ts `loadRoles`), each with the flow whose file or step holds it
 * as this page knows it: a flow the document reads, by the hash it is known by; the document's own, by the flow as
 * kept when the run ran (`base`). What another page's decision must be of to be carried here. A load that only
 * follows another is decided with it, and is never looked for on its own.
 */
export function leadingHere(doc: Doc, base: string | undefined, holds: readonly Held[]): Leading[] {
  const roles = loadRoles(doc, holds);
  const out: Leading[] = [];
  for (const load of heldLoadsOf(holds)) {
    const role = roles.get(loadKey(load));
    if (!role || role.follows) continue;
    const flow = role.flow ?? (base ? { id: doc.id, hash: base } : null);
    if (flow) out.push({ load, flow });
  }
  return out;
}

/** Another record of this browser, as carrying reads it. */
export interface OtherRecord {
  origin: string;
  /** Its entries, in order, from the first. */
  entries: readonly LogEntry[];
  /** How many of them, from the first, a checkpoint this browser signed covers: one past it isn't taken yet. */
  signed: number;
  /** Whether it checks: every entry hashes as kept, under its checkpoints. Nothing is carried from one that doesn't. */
  ok: boolean;
}

/** Why a decision made on another page isn't carried here. */
export type NotCarried =
  /** It was made at the flow as it is on that page, which isn't the flow as it is here: its rules differ. */
  | 'other-rules'
  /** Its entry doesn't say which flow it was made at: it was made before pages carried decisions. */
  | 'unsaid'
  /** Its record hasn't signed it yet, or doesn't check. */
  | 'unsigned';

/** What another page decided about a load: the decision to carry, or why it isn't carried. */
export type Elsewhere = { record: OtherRecord; entry: LogEntry; about: CarryAbout } & ({ carry: true } | { carry: false; why: NotCarried });

const ms = (at: string): number => {
  const t = Date.parse(at);
  return Number.isFinite(t) ? t : 0;
};

/**
 * What the other pages of this browser decided about a load of a flow (ADR 0025 §6): the latest decision about it made
 * on one of them, by the device's clock, where that page knows the flow by the same id. A record whose latest decision
 * about the load was itself carried from elsewhere is no source: the page it came from is. Nor is one whose latest was
 * applied under a standing decision (`under`): this page applies the standing decision it carried, by its own rule.
 * The decision is carried where it was made at the same flow, by its hash, under a checkpoint its browser signed; else
 * it says why not. Null where no other page decided it.
 */
export function decidedElsewhere(records: readonly OtherRecord[], load: Load, flow: { id: string; hash: string }): Elsewhere | null {
  let best: { record: OtherRecord; entry: LogEntry; about: CarryAbout; at: { id: string; hash: string } | null } | null = null;
  for (const record of records) {
    const d = decisionForLoad(record.entries, load);
    const entry = d ? record.entries.find((e) => e.seq === d.seq) : undefined;
    if (!d || !entry) continue;
    const about = d.about as CarryAbout;
    if (about.from !== undefined || about.under !== undefined) continue;
    const at = madeAt(entry);
    // Another flow's decision about a file of the same name and bytes is nothing to do with this one.
    if (at ? at.id !== flow.id : (originOf(entry.origin)?.flow ?? null) !== flow.id) continue;
    if (!best || ms(entry.at) > ms(best.entry.at) || (ms(entry.at) === ms(best.entry.at) && (entry.origin > best.entry.origin || (entry.origin === best.entry.origin && entry.seq > best.entry.seq)))) best = { record, entry, about, at };
  }
  if (!best) return null;
  const { record, entry, about, at } = best;
  if (!record.ok || entry.seq >= record.signed) return { record, entry, about, carry: false, why: 'unsigned' };
  if (!at) return { record, entry, about, carry: false, why: 'unsaid' };
  if (at.hash !== flow.hash) return { record, entry, about, carry: false, why: 'other-rules' };
  return { record, entry, about, carry: true };
}

/**
 * Whether a load's decision here gives way to one made on another page: there is none here; or the one here is older,
 * and isn't that one carried already. The flow's latest decision stands on every page: one made here after it stays,
 * and the other page carries it in turn.
 */
export function givesWay(mine: Pick<Decided, 'at' | 'about'> | null, theirs: Pick<LogEntry, 'origin' | 'seq' | 'at'>): boolean {
  if (!mine) return true;
  const from = (mine.about as CarryAbout).from;
  if (from && from.origin === theirs.origin && from.seq === theirs.seq) return false;
  return ms(theirs.at) > ms(mine.at);
}

/** The proof kept beside a carried decision: the entry as its record keeps it, and its place there under a checkpoint
 * that covers it. `leaves` are that record's leaves from the first. */
export function proofOf(entry: LogEntry, leaves: readonly string[], checkpoint: SignedCheckpoint): CarriedProof {
  const { size, root } = parseCheckpoint(checkpoint.checkpoint);
  if (entry.seq >= size) throw new RangeError(`proofOf: the checkpoint at ${size} entries doesn't cover entry ${entry.seq}`);
  return { smaltflCarried: CARRIED_FORMAT, entry, size, root, proof: inclusionProof(leaves, entry.seq, size), checkpoint };
}

/** What a carried decision must say as the decision it carries does: the load, what was decided, and its remedy or
 * level. */
const sameEnd = (a: Partial<DecideAbout>, b: Partial<DecideAbout>): string | null => {
  if (!isLoad(a.load) || !isLoad(b.load) || loadKey(a.load) !== loadKey(b.load)) return 'about another load';
  if (a.option !== b.option) return `to ${String(b.option)}, not to ${String(a.option)}`;
  if (a.scope !== b.scope) return 'for other days';
  if (a.option === 'accept') {
    const level = (x: Partial<DecideAbout>) => canonicalJSON((x.level ? { source: x.level.source.toLowerCase(), from: x.level.from, metrics: x.level.metrics, band: x.level.band ?? null } : null) as never);
    if (level(a) !== level(b)) return 'of another level';
  }
  if (a.option === 'fill' || a.option === 'complete') {
    const remedy = (x: Partial<DecideAbout>) => canonicalJSON((x.repair ? { kind: x.repair.kind, source: x.repair.source.toLowerCase(), missing: x.repair.missing, day: x.repair.donor?.day ?? null, file: x.repair.donor?.file.sha256 ?? null } : null) as never);
    if (remedy(a) !== remedy(b)) return 'by another remedy';
  }
  return null;
};

/**
 * What is wrong with a carried decision, checked offline from its own entry, the proof kept beside it and the card of
 * the browser that signs its record (ADR 0025 §6): it cites a decision in another flow's record of the same browser;
 * the proof holds that entry, by its leaf, in that record under a checkpoint the browser signed; and the decision it
 * carries was made at the same flow, about the same load, to the same end, by the same person for the same reason, no
 * later than it was carried. None, and it holds.
 */
export async function carriedProblems(e: Pick<LogEntry, 'origin' | 'at' | 'by' | 'reason' | 'about'>, proof: unknown, card: IdentityCard | null): Promise<string[]> {
  const about = e.about as unknown as CarryAbout;
  const from = about.from as unknown;
  if (!isRecord(from) || typeof from.origin !== 'string' || !Number.isInteger(from.seq) || (from.seq as number) < 0 || typeof from.leaf !== 'string' || typeof from.kept !== 'string') return ["what it was carried from isn't shaped as a citation (origin, seq, leaf, kept)"];
  const cited = from as unknown as CarriedFrom;
  const there = originOf(cited.origin);
  const here = originOf(e.origin);
  if (!there) return [`it was carried from ${cited.origin}, which isn't a flow's record`];
  if (cited.origin === e.origin) return ['it was carried from its own record'];
  const out: string[] = [];
  if (here && there.signer !== here.signer) out.push(`it was carried from a record signed by ${there.signer}, not by this record's browser (${here.signer})`);
  const p = proof as Partial<CarriedProof> | null;
  if (!isRecord(p) || p.smaltflCarried !== CARRIED_FORMAT || !isRecord(p.entry) || !Number.isInteger(p.size) || typeof p.root !== 'string' || !Array.isArray(p.proof)) return [...out, `the proof of #${cited.seq} of ${cited.origin} isn't in the bag, or isn't shaped as one`];
  const entry = p.entry as LogEntry;
  let leaf: string | null = null;
  try {
    leaf = entryLeaf(entry);
  } catch {
    leaf = null;
  }
  if (entry.origin !== cited.origin || entry.seq !== cited.seq || leaf !== cited.leaf) return [...out, `the entry its proof holds isn't #${cited.seq} of ${cited.origin} with the leaf it cites`];
  if (entry.kind !== 'decide') return [...out, `#${cited.seq} of ${cited.origin} isn't a decision`];
  if (!verifyInclusion(cited.leaf, cited.seq, p.size!, p.proof!, p.root!)) out.push(`its proof doesn't place #${cited.seq} in ${cited.origin} at ${p.size} entries`);
  const c = await verifyCheckpoint(p.checkpoint, card ?? undefined);
  if (!c.ok) out.push(`the checkpoint its proof is under doesn't check: ${c.reason}`);
  else if (c.origin !== cited.origin || c.size !== p.size || c.root !== p.root) out.push("the checkpoint its proof is under isn't of that record at that size and root");
  else if (card && !c.known) out.push(`the checkpoint its proof is under was signed by ${c.signer.fingerprint.slice(0, 16)}, not by this record's browser`);
  const was = entry.about as unknown as CarryAbout;
  const end = sameEnd(about, was);
  if (end) out.push(`#${cited.seq} of ${cited.origin} is ${end}`);
  const made = madeAt(entry);
  const mine = madeAt(e);
  if (!made) out.push(`#${cited.seq} of ${cited.origin} doesn't say which flow it was made at`);
  else if (!mine) out.push("it doesn't say which flow it is of (the flow it names, or its own as kept)");
  else if (made.id !== mine.id || made.hash !== mine.hash) out.push(`#${cited.seq} of ${cited.origin} was made at ${made.id} (${made.hash.slice(0, 12)}), and this decision is ${mine.id}'s (${mine.hash.slice(0, 12)})`);
  if (entry.by.as !== e.by.as) out.push(`#${cited.seq} of ${cited.origin} was decided by ${entry.by.as}, and this says ${e.by.as}`);
  if ((entry.reason ?? null) !== (e.reason ?? null)) out.push(`#${cited.seq} of ${cited.origin} gives another reason`);
  if (ms(entry.at) > ms(e.at)) out.push(`#${cited.seq} of ${cited.origin} was decided after it was carried`);
  return out;
}

/**
 * What is wrong with what a decision says of its record's own flow (`base`): the flow as kept when the run it decides
 * ran is what the record's last `flow` entry before that run says. `runSeq` is that run's entry (null: not in the
 * record). None, and it holds.
 */
export function baseProblems(entries: readonly Pick<LogEntry, 'seq' | 'kind' | 'about'>[], about: Partial<CarryAbout>, runSeq: number | null): string[] {
  if (about.base === undefined) return [];
  if (typeof about.base !== 'string') return ["the flow it says it was made at isn't a hash"];
  if (about.flow !== undefined) return ['it names a flow it reads and its own flow as kept: a decision is of one flow'];
  const kept = runSeq === null ? null : baseOf(entries, runSeq);
  return kept === about.base ? [] : [`it says its flow was ${about.base.slice(0, 12)} as kept, and the record ${kept ? `kept ${kept.slice(0, 12)} before its run` : 'kept none before its run'}`];
}

/** The flow as kept when a run ran, by the record: what its last `flow` entry before the run's entry says (`after`).
 * Null where the record has none. */
export function baseOf(entries: readonly Pick<LogEntry, 'seq' | 'kind' | 'about'>[], runSeq: number): string | null {
  let found: string | null = null;
  for (const e of entries) {
    if (e.seq >= runSeq) break;
    const after = e.kind === 'flow' && isRecord(e.about) ? e.about.after : undefined;
    if (typeof after === 'string') found = after;
  }
  return found;
}

// ------------------------------------------------------------------ the words

/** A page by the flow it is of: "Evidence feeds’ page". */
export const pageOf = (name: string): string => `${possessive(name)} page`;

/** After a decision's line in the record: " · carried from Evidence feeds’ page, its #12". Nothing for a decision
 * made here. */
export function carriedSaid(about: unknown, nameOf: (flow: string) => string): string {
  const from = isRecord(about) ? (about.from as Partial<CarriedFrom> | undefined) : undefined;
  const there = from ? originOf(from.origin) : null;
  return there && typeof from?.seq === 'number' ? ` · carried from ${pageOf(nameOf(there.flow))}, its #${from.seq}` : '';
}

/** Why a decision made on another page isn't carried, as the sheet says it under whose the decision is. */
export function notCarriedSaid(why: NotCarried, page: string, flow: string): string {
  if (why === 'other-rules') return `Decided on ${page}, where ${flow} isn’t as it is here: its rules differ, so that decision isn’t carried. Decide it here.`;
  if (why === 'unsaid') return `Decided on ${page} before decisions were carried between pages. Decide it here.`;
  return `Decided on ${page}, whose record hasn’t signed it yet: run the day again to carry it.`;
}
