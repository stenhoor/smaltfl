/**
 * Who decides (ADR 0027 §10, Q-276, Q-277). The ontology names who owns each of its parts: an estate's shared
 * ontology, and each flow's own. A change the business made, and one that ends something, takes effect only with the
 * agreement of an owner of every part it touches; a setting re-tuned, a mistake corrected, a changed source and a
 * first description need only their author.
 *
 * - `asksAgreement`: whether a change set asks for agreement.
 * - `partsOf`: the parts of the ontology a change set touches; `ownersOf`: who owns a part, by name.
 * - `agreementOf`: where a change set stands: each part it touches with the owner who agreed, the parts that still
 *   wait, the moment it took effect, and whether one person held both roles.
 * - `knownFrom`: the moment a change set is in force from in the record: when it was recorded, or, where it asks for
 *   agreement, when the last part it touches was agreed for; none while it waits. The rules in force on a day as
 *   known at a moment (`inforce.ts`) are made of the change sets known from then or before, in that order.
 * - `mayAgree`, `agreeTo`: who may agree to a change set, and the change set with their agreement.
 * - `agreedIssues`: what is wrong with the agreements a document carries, for the document's validation.
 *
 * Until sharing is built (Q-35) one person may hold both roles: the author of a change who owns what it touches
 * agrees to it by recording it, and the agreement says so by naming them. Pure: no DOM, no engine.
 */
import { editTargets, flowOf, type Agreed, type ChangeSet, type FlowDocument } from './document.js';
import type { Owner } from './ontology.js';

/** What of a document says who owns what: its policies' principals, its own ontology's owners and the estates', and
 * the flows it reads with theirs. */
export type OwnedDoc = Pick<FlowDocument, 'name' | 'policies' | 'ontology' | 'flows'>;

/**
 * A part of the ontology someone owns: an estate's shared ontology (`id` its name), or a flow's own (`id` the flow's
 * id; '' for the document's own flow). `name` is what it is called in a sentence: "Larkspur estate’s ontology",
 * "Evidence feeds".
 */
export interface Part {
  kind: 'estate' | 'flow';
  id: string;
  name: string;
}

const partKey = (p: Pick<Part, 'kind' | 'id'>): string => `${p.kind}:${p.id}`;

/** Whether a change set asks for an owner's agreement (Q-277): the business changed, or it ends something. */
export const asksAgreement = (change: Pick<ChangeSet, 'kind' | 'edits'>): boolean => change.kind === 'business' || change.edits.some((e) => e.op === 'end');

/** Why a change set asks for agreement, in a few words; '' where it asks for none. */
export function asksWhy(change: Pick<ChangeSet, 'kind' | 'edits'>): string {
  const ends = change.edits.some((e) => e.op === 'end');
  return change.kind === 'business' ? (ends ? 'the business changed, and it ends something' : 'the business changed') : ends ? 'it ends something' : '';
}

/** A flow's own owner or owners, where its ontology names none: the principals its policies mark as owning the flow,
 * and `owner` in a flow with no policies, as the page acts in one. */
export function flowsOwner(doc: Pick<FlowDocument, 'policies'>): Owner[] {
  const marked = (doc.policies?.principals ?? []).filter((p) => p.owner).map((p) => ({ id: p.id, name: p.name }));
  return marked.length ? marked : [{ id: 'owner', name: 'Owner' }];
}

/** The parts of the ontology a document has: its own flow's, each flow's it reads, and each estate's it imports. */
export function partsIn(doc: OwnedDoc): Part[] {
  return [
    ...(doc.ontology?.estate ?? []).map((e): Part => ({ kind: 'estate', id: e.name, name: `${e.name}’s ontology` })),
    ...(doc.flows ?? []).map((f): Part => ({ kind: 'flow', id: f.id, name: f.name })),
    { kind: 'flow', id: '', name: doc.name },
  ];
}

/**
 * The parts of the ontology a change set touches (Q-277): an estate's own change, the estate's ontology; a flow's, the
 * own ontology of each flow that has a file or step it is about (`editTargets`), and the document's own flow's where it
 * is about none (a relation, a meaning for every dataset, a dataset described ahead) or about one of its own.
 */
export function partsOf(doc: OwnedDoc, change: Pick<ChangeSet, 'edits' | 'estate'>): Part[] {
  if (change.estate !== undefined) return [{ kind: 'estate', id: change.estate, name: `${change.estate}’s ontology` }];
  const own: Part = { kind: 'flow', id: '', name: doc.name };
  const out = new Map<string, Part>();
  for (const d of change.edits.flatMap(editTargets)) {
    const f = flowOf(doc, d);
    const part: Part = f ? { kind: 'flow', id: f.id, name: f.name } : own;
    if (!out.has(partKey(part))) out.set(partKey(part), part);
  }
  if (out.size === 0) out.set(partKey(own), own);
  return [...out.values()];
}

/**
 * Who owns a part (Q-276), each with a name to say: the owners its own document names (an estate's ontology, a read
 * flow's, the document's own), else the flow's owner. A name comes from the owner as named, else from the document's
 * principal of that id, else it is the id.
 */
export function ownersOf(doc: OwnedDoc, part: Pick<Part, 'kind' | 'id'>): (Owner & { name: string })[] {
  const named = part.kind === 'estate' ? doc.ontology?.estate?.find((e) => e.name === part.id)?.owners : part.id === '' ? doc.ontology?.owners : doc.flows?.find((f) => f.id === part.id)?.owners;
  const list = named?.length ? named : flowsOwner(doc);
  const principal = (id: string) => doc.policies?.principals.find((p) => p.id === id)?.name;
  return list.map((o) => ({ ...o, name: o.name ?? principal(o.id) ?? (o.id === 'owner' && !doc.policies ? 'Owner' : o.id) }));
}

/** Whether someone owns a part. */
export const ownsPart = (doc: OwnedDoc, part: Pick<Part, 'kind' | 'id'>, who: string): boolean => ownersOf(doc, part).some((o) => o.id === who);

/** Where a change set stands with the owners of what it touches (`agreementOf`). */
export interface Agreement {
  /** Whether it asks for agreement at all. */
  asked: boolean;
  /** Each part it touches, with its owners and, where one of them agreed, the first who did. */
  parts: { part: Part; owners: (Owner & { name: string })[]; agreed: Agreed | null }[];
  /** The parts none of whose owners has agreed: it waits for one of each. Empty where it asks for none. */
  waiting: Part[];
  /** The moment it took effect (ISO 8601): when it was recorded, or the latest of its parts' agreements; null while
   * it waits. */
  since: string | null;
  /** Every agreement it needed is its author's own: one person held both roles. */
  same: boolean;
  /** Agreements by someone who owns no part it touches: they count for nothing, and the document says so. */
  strangers: Agreed[];
}

/**
 * Where a change set stands (Q-277). One that asks for no agreement is in force from the moment it was recorded,
 * whatever agreements it carries. One that asks takes effect when an owner of each part it touches has agreed, at
 * the latest of those agreements; an owner's first agreement is the one that counts for their part.
 */
export function agreementOf(doc: OwnedDoc, change: ChangeSet): Agreement {
  const asked = asksAgreement(change);
  const given = [...(change.agreed ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const parts = partsOf(doc, change).map((part) => {
    const owners = ownersOf(doc, part);
    return { part, owners, agreed: given.find((a) => owners.some((o) => o.id === a.by)) ?? null };
  });
  const strangers = given.filter((a) => !parts.some((p) => p.owners.some((o) => o.id === a.by)));
  if (!asked) return { asked, parts, waiting: [], since: change.recorded, same: false, strangers };
  const waiting = parts.filter((p) => p.agreed === null).map((p) => p.part);
  const moments = [Date.parse(change.recorded), ...parts.flatMap((p) => (p.agreed ? [Date.parse(p.agreed.at)] : []))];
  const latest = Math.max(...moments);
  const since = waiting.length ? null : latest === Date.parse(change.recorded) ? change.recorded : parts.map((p) => p.agreed!.at).find((at) => Date.parse(at) === latest)!;
  return { asked, parts, waiting, since, same: waiting.length === 0 && parts.every((p) => p.agreed!.by === change.by), strangers };
}

/** The moment a change set is in force from in the record (`agreementOf`'s `since`): null while it waits for agreement. */
export const knownFrom = (doc: OwnedDoc, change: ChangeSet): string | null => (asksAgreement(change) ? agreementOf(doc, change).since : change.recorded);

/** Whether a change set waits for an owner's agreement: it asks, and a part it touches has none. */
export const waitsForAgreement = (doc: OwnedDoc, change: ChangeSet): boolean => asksAgreement(change) && agreementOf(doc, change).waiting.length > 0;

/**
 * The parts of a waiting change set someone may agree for (Q-277): those that still wait and that they own. None
 * where it asks for no agreement, has it all, or they own nothing it waits for.
 */
export function mayAgree(doc: OwnedDoc, change: ChangeSet, who: string): Part[] {
  if (!asksAgreement(change)) return [];
  return agreementOf(doc, change).waiting.filter((p) => ownsPart(doc, p, who));
}

/**
 * A change set with someone's agreement (Q-277), given at a moment (ISO 8601): theirs added after those it has. A
 * problem in words where they may not agree to it: it asks for none, it has every agreement it needs, they own no
 * part it waits for, or the moment is before it was recorded.
 */
export function agreeTo(doc: OwnedDoc, change: ChangeSet, who: string, at: string, card?: string | null): { change: ChangeSet; for: Part[] } | { problem: string } {
  if (!asksAgreement(change)) return { problem: 'It asks for no agreement: a change of its kind needs only its author.' };
  const state = agreementOf(doc, change);
  if (!state.waiting.length) return { problem: 'It has the agreement it asked for.' };
  const mine = state.waiting.filter((p) => ownsPart(doc, p, who));
  if (!mine.length) return { problem: `It waits for ${ownersSaid(state.waiting.map((part) => ({ part, owners: ownersOf(doc, part) })))}.` };
  if (Date.parse(at) < Date.parse(change.recorded)) return { problem: 'An agreement is to a change written down: it can’t be from before it was recorded.' };
  const kept = (change.agreed ?? []).filter((a) => a.by !== who);
  return { change: { ...change, agreed: [...kept, { by: who, at, ...(card ? { card } : {}) }] }, for: mine };
}

/** Whose agreement parts wait for, in words: "an owner of Evidence feeds (Sloane Marsden)", joined by "and". */
export function ownersSaid(parts: readonly { part: Part; owners: readonly { name: string }[] }[]): string {
  const said = parts.map(({ part, owners }) => `${owners.length === 1 ? 'the owner' : 'an owner'} of ${part.name} (${owners.map((o) => o.name).join(' or ')})`);
  return said.length <= 1 ? (said[0] ?? '') : `${said.slice(0, -1).join(', ')} and ${said.at(-1)}`;
}

/**
 * What is wrong with the agreements a document's change sets carry (Q-276), each as a path and a sentence: one by
 * someone who owns no part the change set touches. The page and a story write an agreement only for an owner, and the
 * offline audit asks the same of the documents a record kept.
 */
export function agreedIssues(doc: OwnedDoc & Pick<FlowDocument, 'changes'>): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  (doc.changes ?? []).forEach((c, i) => {
    if (!c.agreed?.length) return;
    const state = agreementOf(doc, c);
    for (const a of state.strangers) {
      const j = c.agreed!.indexOf(a);
      out.push({ path: `$.changes[${i}].agreed[${j}].by`, message: `${a.by} owns no part of the ontology ${c.id} touches: it is for ${ownersSaid(state.parts)} to agree to` });
    }
    // An owner whose card is known agrees by that card (Q-31): another card's agreement isn't theirs.
    for (const p of state.parts) {
      const owner = p.agreed ? p.owners.find((o) => o.id === p.agreed!.by) : undefined;
      if (owner?.card && p.agreed!.card !== undefined && p.agreed!.card !== owner.card) out.push({ path: `$.changes[${i}].agreed[${c.agreed!.indexOf(p.agreed!)}].card`, message: `${owner.name} is known by the card ${owner.card.slice(0, 16)}, and this agreement was signed by another` });
    }
  });
  return out;
}
