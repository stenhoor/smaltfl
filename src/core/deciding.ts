/**
 * Whose decision a held day is (ADR 0026 §6): a hold is the flow's whose file or step holds, and so is the decision. A
 * flow that reads it waits on it and is never asked: where its own steps hold only because a file or step they are
 * built from holds, their holds follow, and are decided by the decision they follow.
 *
 * Pure. `holdGroups` reads a run's holds into the decisions the day needs, one a flow that leads; `decisionFlow` is
 * what a decision's entry says of the flow it is about; the words say whose it is and who waits.
 */
import { flowOf, type FlowDocument } from './document.js';
import { heldLoadsOf, isLoad, loadKey, upstreamSources, upstreamSteps, type Hold, type Load } from './hold.js';

type Doc = Pick<FlowDocument, 'flows' | 'steps'>;
type Held = Pick<Hold, 'by' | 'origin' | 'load' | 'reaches'>;

/** The flow a source or step is: a flow the document reads, by id; '' the document's own. */
export const flowIdOf = (doc: Pick<FlowDocument, 'flows'>, id: string): string => flowOf(doc, id)?.id ?? '';

/**
 * What a decision's entry says of the flow it is about (ADR 0026 §6): a flow the document reads, by its id and the
 * hash it is known by. Undefined for the document's own flow: its decisions are as they always were, so a flow that
 * reads none records what it always did.
 */
export function decisionFlow(doc: Pick<FlowDocument, 'flows'>, origin: string): { id: string; hash: string } | undefined {
  const part = flowOf(doc, origin);
  return part ? { id: part.id, hash: part.hash } : undefined;
}

/** The holds of a day that are about its data: a what-if's and a restatement's are about the run, and are no flow's. */
const ofData = <H extends Pick<Hold, 'by'>>(holds: readonly H[]): H[] => holds.filter((h) => h.by !== 'restated' && h.by !== 'what-if');

/** One decision a held day needs: the flow it is made at, the holds it is about, and the holds that follow them. */
export interface HoldGroup<H extends Held = Held> {
  /** The flow whose files or steps lead: where the decision is made ('' the document's own flow). */
  flow: string;
  /** Its holds no other hold accounts for: nothing they are built from holds too. */
  leads: H[];
  /** The holds, of any flow, at steps built from a file or step that leads here: decided by this decision. */
  follows: H[];
}

/**
 * A day's holds as the decisions it needs (ADR 0026 §6), one a flow that leads, in the document's order of flows, its
 * own last. A hold leads where no file or step its own is built from holds too; else it follows, and goes with the
 * first flow that leads above it: a step of Applications whose check fails because HR's file broke is decided by HR's
 * decision. Where a hold follows leaders of two flows, its outputs stay back until the other is decided too, since
 * that one's hold reaches them.
 */
export function holdGroups<H extends Held>(doc: Doc, holds: readonly H[]): HoldGroup<H>[] {
  const data = ofData(holds);
  const origins = new Set(data.map((h) => h.origin.toLowerCase()));
  const above = new Map<string, Set<string>>();
  const aboveOf = (origin: string): Set<string> => {
    const key = origin.toLowerCase();
    let found = above.get(key);
    if (!found) {
      found = new Set([...upstreamSources(doc, origin), ...upstreamSteps(doc, origin)].map((x) => x.toLowerCase()));
      found.delete(key);
      above.set(key, found);
    }
    return found;
  };
  const order = [...(doc.flows ?? []).map((f) => f.id), ''];
  const place = (flow: string) => (order.indexOf(flow) < 0 ? order.length : order.indexOf(flow));
  const leads = data.filter((h) => ![...aboveOf(h.origin)].some((x) => origins.has(x)));
  const leading = new Map<string, string>(leads.map((h) => [h.origin.toLowerCase(), flowIdOf(doc, h.origin)] as const));
  const groups = new Map<string, HoldGroup<H>>();
  const group = (flow: string) => {
    let g = groups.get(flow);
    if (!g) groups.set(flow, (g = { flow, leads: [], follows: [] }));
    return g;
  };
  for (const h of leads) group(flowIdOf(doc, h.origin)).leads.push(h);
  for (const h of data) {
    if (leading.has(h.origin.toLowerCase())) continue;
    // The flows that lead above it; the first of them, in the document's order, decides it.
    const over = [...new Set([...aboveOf(h.origin)].flatMap((x) => (leading.has(x) ? [leading.get(x)!] : [])))].sort((a, b) => place(a) - place(b));
    group(over[0] ?? flowIdOf(doc, h.origin)).follows.push(h);
  }
  return [...groups.values()].sort((a, b) => place(a.flow) - place(b.flow));
}

/** The loads a group's decision decides (ADR 0010 §7): its leads' first, then those of the holds that follow, each once. */
export function groupLoads(g: Pick<HoldGroup, 'leads' | 'follows'>): { leads: Load[]; follows: Load[] } {
  const leads = heldLoadsOf(g.leads);
  const seen = new Set(leads.map(loadKey));
  return { leads, follows: heldLoadsOf(g.follows).filter((l) => !seen.has(loadKey(l))) };
}

/** What a held load's decision says of where it is made: the flow it is about, and, where its hold only follows, the
 * load whose decision it carries. */
export interface LoadRole {
  /** The flow whose file or step holds it; undefined for the document's own flow. */
  flow?: { id: string; hash: string };
  /** The load it follows: the first its group's flow leads with. Null where its own hold leads. */
  follows: Load | null;
}

/**
 * Each held load's part in a day's decision (ADR 0026 §6), by its key (`loadKey`): a load a hold leads with is its
 * flow's to decide; a load only a following hold is about is decided with it, and its decision carries the one it
 * follows. A day is still one choice, recorded as one decision a load (Q-193): this says whose each is.
 */
export function loadRoles(doc: Doc, holds: readonly Held[]): Map<string, LoadRole> {
  const out = new Map<string, LoadRole>();
  const groups = holdGroups(doc, holds);
  for (const g of groups) for (const h of g.leads) if (isLoad(h.load) && !out.has(loadKey(h.load))) out.set(loadKey(h.load), { ...flowField(doc, h.origin), follows: null });
  for (const g of groups) {
    const first = g.leads.find((h) => isLoad(h.load))?.load ?? null;
    for (const h of g.follows) if (isLoad(h.load) && !out.has(loadKey(h.load))) out.set(loadKey(h.load), { ...flowField(doc, h.origin), follows: first });
  }
  return out;
}

/**
 * A day's decisions, one a held load (hold.ts `loadDecisions`), each saying whose it is (ADR 0026 §6): those whose
 * loads lead first, in the order given, then those that follow, each with the load whose decision it carries. Whoever
 * records them cites, in each that follows, the entry recorded for that load (`carried`).
 */
export function withRoles<D extends { load?: Load }>(doc: Doc, holds: readonly Held[], abouts: readonly D[]): { about: D & { flow?: { id: string; hash: string } }; follows: Load | null }[] {
  const roles = loadRoles(doc, holds);
  const told = abouts.map((about) => {
    const role = isLoad(about.load) ? roles.get(loadKey(about.load)) : undefined;
    return { about: { ...about, ...(role?.flow ? { flow: role.flow } : {}) }, follows: role?.follows ?? null };
  });
  return [...told.filter((x) => !x.follows), ...told.filter((x) => x.follows)];
}

const flowField = (doc: Pick<FlowDocument, 'flows'>, origin: string): { flow?: { id: string; hash: string } } => {
  const flow = decisionFlow(doc, origin);
  return flow ? { flow } : {};
};

/** The flows that wait on a group's decision: those whose holds follow it, and those something of which it keeps
 * back, in the document's order, the group's own flow never. `gives` says what a flow gives. */
export function waitingOn(doc: Doc, g: Pick<HoldGroup, 'flow' | 'leads' | 'follows'>, held: readonly string[], gives: (flow: string) => readonly string[]): string[] {
  const order = [...(doc.flows ?? []).map((f) => f.id), ''];
  const reached = new Set([...g.leads, ...g.follows].flatMap((h) => h.reaches.map((x) => x.toLowerCase())));
  const kept = new Set(held.map((x) => x.toLowerCase()));
  const follows = new Set(g.follows.map((h) => flowIdOf(doc, h.origin)));
  return order.filter((f) => f !== g.flow && (follows.has(f) || gives(f).some((name) => kept.has(name.toLowerCase()) && reached.has(name.toLowerCase()))));
}

/** A group's holds in a few words, as a sheet's head says them: "access_reviews"; "org_chain, and app_owners with it". */
export function groupSaid(g: Pick<HoldGroup, 'leads' | 'follows'>): string {
  const names = (hs: readonly Pick<Hold, 'origin'>[]) => [...new Set(hs.map((h) => h.origin))];
  const list = (xs: readonly string[]) => (xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, 2).join(', ')} and ${xs.length - 2} more`);
  const leads = names(g.leads);
  const follows = names(g.follows).filter((x) => !leads.includes(x));
  return `${list(leads)}${follows.length ? `, and ${list(follows)} with ${leads.length === 1 ? 'it' : 'them'}` : ''}`;
}

/** A flow's name as an owner: "Evidence feeds’", "HR organisation’s". */
export const possessive = (name: string): string => `${name}${/s$/i.test(name) ? '’' : '’s'}`;

/** Flows by name, as a sentence lists them. */
const listed = (names: readonly string[]): string => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

/**
 * Whose decision it is, in a sentence (ADR 0026 §6): "Evidence feeds’ to decide: access_reviews holds. Larkspur estate
 * waits on it." Null for a flow that reads none and is read by none here: there is nothing to tell apart.
 */
export function whoseSaid(doc: Doc, g: Pick<HoldGroup, 'flow' | 'leads' | 'follows'>, waiting: readonly string[], nameOf: (flow: string) => string): string | null {
  if (!(doc.flows ?? []).length) return null;
  const mine = [...new Set(g.leads.map((h) => h.origin))];
  const holds = mine.length === 1 ? `${mine[0]} holds` : mine.length === 2 ? `${mine.join(' and ')} hold` : `${mine.slice(0, 2).join(', ')} and ${mine.length - 2} more hold`;
  const whose = `${possessive(nameOf(g.flow))} to decide: ${holds}.`;
  return waiting.length ? `${whose} ${listed(waiting.map(nameOf))} ${waiting.length === 1 ? 'waits' : 'wait'} on it.` : whose;
}

/** Whether a value is what a decision's entry says of its flow. */
export const isDecisionFlow = (v: unknown): v is { id: string; hash: string } => typeof v === 'object' && v !== null && typeof (v as { id?: unknown }).id === 'string' && typeof (v as { hash?: unknown }).hash === 'string';

/** Whether a load is one of a group's. */
export const inGroup = (g: Pick<HoldGroup, 'leads' | 'follows'>, load: Load): boolean => [...g.leads, ...g.follows].some((h) => isLoad(h.load) && loadKey(h.load) === loadKey(load));
