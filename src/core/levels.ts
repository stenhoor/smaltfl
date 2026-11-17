/**
 * Flows in flows on the screen (ADR 0025 §3, §4): the canvas in levels, and what a flow's day came to.
 *
 * - **A level** (`levelDoc`) is one flow's own canvas: its files and steps as they are, and each flow it reads itself
 *   as one card (`flowCard`). What those flows read is inside them, a level down. The document the canvas lays out is
 *   derived here and never run: nothing here is hashed.
 * - **Where you are** (`trailOf`): the flows entered, from the top, as a link names them (`#day/2024-03-12/in/feeds`).
 * - **A flow's day** (`flowDay`): the worst of what is inside it, by precedence, in the month's words (ADR 0024 §3),
 *   with its extent counted, never averaged. A flow with nothing wrong of its own whose outputs another flow's hold
 *   keeps back *waits on* that flow: waiting is not failing.
 * - **What a flow gives** (`givenBy`): each dataset it publishes, and the flows whose steps read it.
 *
 * Pure: the page gives the run as its record entry says it, this says what each flow made of it.
 */
import type { DayState } from './days.js';
import { flowOwners, givesOf, type FlowDocument, type FlowPart, type StepDef } from './document.js';
import { writtenRules } from './gates.js';
import type { RunManifest } from './manifest.js';
import { cellOf, type RunAbout } from './month.js';
import type { How } from './overview.js';

/** The key a flow's card has on a canvas. No source or step can be called so: an id has no colon. */
export const flowCard = (id: string): string => `flow:${id}`;

/** The flow a card's key names, or null where the key is a source's, a step's or a section's. */
export const cardFlow = (key: string | null | undefined): string | null => (key?.startsWith('flow:') ? key.slice(5) : null);

/**
 * The section the cards of the flows a level reads are laid out in, together: a section with no frame and no name on
 * the canvas, so each card takes a row that keeps clear the way from the cards before it to what reads them, as the
 * steps of any section do. A line from one flow's card then never runs behind another's, and the flows lead the canvas.
 */
export const FLOWS_SECTION = '_flows';

/** The flows a level reads itself, in the document's order: the document's own flow's (`at` null), or a read flow's. */
export function readHere(doc: Pick<FlowDocument, 'flows'>, at: string | null = null): FlowPart[] {
  const parts = doc.flows ?? [];
  if (at === null) return parts.filter((f) => f.direct);
  const reads = new Set(parts.find((f) => f.id === at)?.reads ?? []);
  return parts.filter((f) => reads.has(f.id));
}

/**
 * The document a level's canvas lays out (ADR 0025 §4): the level's own sources and steps, its own sections, and one
 * card for each flow it reads itself, joined to what reads it: a step that takes its rows, or one judged by a written
 * rule that reads it. A step that reads two datasets of one flow has one edge from that flow's card. A flow the
 * document has nothing left of (closed to the viewer) has no card.
 *
 * `at` null is the document's own flow, the top; a flow the document doesn't read is the top too. A document that
 * reads no flow is returned as it is. Inside a flow the arrangement is the automatic one: the document's `layout` is
 * the top level's.
 *
 * Inside a use of a flow (ADR 0025 §11), each dataset mapped onto one of its inputs is on the canvas: as the card of
 * the flow that gives it, or, where it is the listing flow's own, as that dataset itself, an input of the level, so
 * every input of a use shows where its rows come from.
 */
export function levelDoc(doc: FlowDocument, at: string | null = null): FlowDocument {
  const parts = doc.flows ?? [];
  if (!parts.length) return doc;
  const here = at === null ? null : (parts.find((f) => f.id === at) ?? null);
  const level = here?.id ?? '';
  const owner = flowOwners(doc);
  const ownerOf = (id: string) => owner.get(id.toLowerCase()) ?? '';
  const have = new Set([...doc.sources, ...doc.steps].map((x) => x.id.toLowerCase()));
  const cards = readHere(doc, here?.id ?? null).filter((f) => [...f.sources, ...f.steps].some((id) => have.has(id.toLowerCase())));
  const carded = new Set(cards.map((f) => f.id));
  // The datasets mapped onto a use's inputs that no card here stands for: the listing flow's own, drawn as they are.
  const given = new Map(Object.values(here?.use?.inputs ?? {}).map((x) => x.to).filter((to) => have.has(to.toLowerCase()) && ownerOf(to) !== level && !carded.has(ownerOf(to))).map((to) => [to.toLowerCase(), to]));
  // What a source or step shows as on this level: itself, the card of the flow it is in, or nothing.
  const shownAs = (id: string): string | null => {
    const o = ownerOf(id);
    return o === level ? id : carded.has(o) ? flowCard(o) : given.has(id.toLowerCase()) ? id : null;
  };
  const inputs = new Map(doc.steps.map((s) => [s.id.toLowerCase(), s.inputs]));
  const cardOf = (f: FlowPart): StepDef => {
    const key = flowCard(f.id);
    // Every flow it lists that has a card here, whether a step of it reads that flow's rows or a gate's rule does (a
    // scope counted against another flow's file is no step's input); then whatever else its steps read.
    const reads = new Set<string>(f.reads.filter((r) => carded.has(r)).map(flowCard));
    for (const s of f.steps) {
      for (const i of inputs.get(s.toLowerCase()) ?? []) {
        const from = shownAs(i);
        if (from && from !== key) reads.add(from);
      }
    }
    return { id: key, kind: 'sql', inputs: [...reads], sql: 'SELECT 1', ...(f.description ? { description: f.description } : {}) };
  };
  // What a written rule of the level's own reads of a flow shown as a card (a scope counted against that flow's file, a
  // dependency, a reconciliation) is no step's input, yet the level reads it: the card is joined to the judged step, or,
  // for a judged file, to the first of the level's steps that reads the file. So a flow's card is never adrift.
  const ownSteps = doc.steps.filter((s) => ownerOf(s.id) === level);
  const looks = new Map<string, Set<string>>();
  for (const node of [...doc.sources.filter((s) => ownerOf(s.id) === level), ...ownSteps]) {
    const rules = writtenRules(doc, node.id);
    const read = [rules.scope?.of, rules.reconcile?.of, ...rules.needs.map((n) => n.from)].flatMap((id) => (id === undefined ? [] : (shownAs(id) ?? []))).filter((key) => cardFlow(key) !== null);
    if (!read.length) continue;
    const judged = ownSteps.find((s) => s.id.toLowerCase() === node.id.toLowerCase()) ?? ownSteps.find((s) => s.inputs.some((i) => i.toLowerCase() === node.id.toLowerCase()));
    if (!judged) continue;
    const had = looks.get(judged.id) ?? new Set<string>();
    for (const key of read) had.add(key);
    looks.set(judged.id, had);
  }
  // A dataset given to a use by the flow that lists it: a file as it is, a step with nothing drawn behind it.
  const givenSteps = doc.steps.filter((s) => given.has(s.id.toLowerCase())).map((s) => ({ ...s, inputs: [] }) as StepDef);
  const steps: StepDef[] = [
    ...cards.map(cardOf),
    ...givenSteps,
    ...ownSteps.map((s) => ({ ...s, inputs: [...new Set([...s.inputs.flatMap((i) => shownAs(i) ?? []), ...(looks.get(s.id) ?? [])])] }) as StepDef),
  ];
  const mine = new Set(steps.map((s) => s.id));
  // The level's own sections: a notebook of another flow has none of its steps here; an empty section is the top's.
  const groups = (doc.groups ?? []).flatMap((g) => {
    if (g.steps.length === 0) return here ? [] : [g];
    // A dataset given to a use stands on its own here, as an input does: its notebook's box is the listing flow's.
    const own = g.steps.filter((id) => mine.has(id) && !given.has(id.toLowerCase()));
    return own.length ? [{ ...g, steps: own }] : [];
  });
  // First of the sections, so the flows a level reads lead its canvas: above its own files where they share a column.
  if (cards.length) groups.unshift({ id: FLOWS_SECTION, name: 'Flows', steps: cards.map((f) => flowCard(f.id)) });
  const { layout: _layout, ...rest } = doc;
  return { ...(here ? rest : doc), sources: doc.sources.filter((s) => ownerOf(s.id) === level || given.has(s.id.toLowerCase())), steps, groups };
}

/**
 * The flows entered, from the top, as a link names them: each read by the one before it, the first by the document's
 * own flow. A trail that isn't one is put right: the shortest way down to the last flow it names that the document
 * reads; where it names none, the top (an empty trail).
 */
export function trailOf(doc: Pick<FlowDocument, 'flows'>, asked: readonly string[]): string[] {
  const parts = new Map((doc.flows ?? []).map((f) => [f.id, f]));
  const top = (doc.flows ?? []).filter((f) => f.direct).map((f) => f.id);
  if (asked.every((id, k) => parts.has(id) && (k === 0 ? top : parts.get(asked[k - 1]!)!.reads).includes(id))) return [...asked];
  const target = [...asked].reverse().find((id) => parts.has(id));
  if (target === undefined) return [];
  const seen = new Set(top);
  const queue = top.map((id) => [id]);
  while (queue.length) {
    const path = queue.shift()!;
    const last = path.at(-1)!;
    if (last === target) return path;
    for (const r of parts.get(last)?.reads ?? []) {
      if (seen.has(r)) continue;
      seen.add(r);
      queue.push([...path, r]);
    }
  }
  return [];
}

/**
 * What a flow's day came to, by precedence (ADR 0025 §3): the run failed inside it; it is paused, waiting for a
 * decision; its day was kept back; a decision published it; it waits on another flow; something in it is unusual;
 * something in it couldn't be judged yet; normal. `none` before a run, and where the run built nothing of it.
 */
export type FlowOutcome = 'failed' | 'waiting' | 'kept' | 'decided' | 'waits' | 'unusual' | 'unjudged' | 'normal' | 'none';

/** One of a flow's own files or steps that holds its day: what it is, and what its hold says. */
export interface FlowHold {
  id: string;
  kind: 'file' | 'step';
  /** Its file was refused: nothing was built from it. */
  refused: boolean;
  said: string;
}

export interface FlowDay {
  flow: string;
  outcome: FlowOutcome;
  /** How a decided day went out: as it came, filled, with the part that arrived, as a new level. */
  how: How | null;
  /** Its own files and steps, counted: what an extent is out of. */
  files: number;
  steps: number;
  /** Its own files and steps that hold the day, in the document's order (files first). */
  holding: FlowHold[];
  /** Its own files and steps a claim found unusual, and those nothing could judge yet, where they hold nothing. */
  unusual: string[];
  unjudged: string[];
  /** Where the run stopped, when it failed inside this flow; `refused` where a file of it was refused before any run (it
   * isn't the file its list names): nothing of the day ran. */
  failedAt: string | null;
  refused: boolean;
  /** Where nothing of its own holds: the flows whose files or steps keep its outputs back ('' the document's own). */
  waitsOn: string[];
  /** Its outputs the day's holds keep back. */
  kept: string[];
}

/** A run as its record entry says it, with what the page knows became of its day. */
export interface RunSaid {
  /** Its holds and the claims it was judged by. */
  about: Pick<RunAbout, 'holds' | 'claims' | 'outcome'>;
  manifest: Pick<RunManifest, 'nodes'> | null | undefined;
  /** The outputs its holds keep back (hold.ts `heldOutputs`: every output where the flow publishes together). */
  held: readonly string[];
  /** What became of the held day (hold.ts `dayState`): waiting, or decided and how. Null where nothing waits. */
  became: DayState | null;
  /** Where the run stopped, when it failed: the source or step. */
  failedAt?: string | null;
  /** The run never started: that source's file was refused, since its bytes aren't the ones its list names (ADR 0006). */
  refusedFile?: boolean;
}

const HOW_OF: Partial<Record<DayState, How>> = { asis: 'asis', fill: 'fill', complete: 'complete', accepted: 'accepted' };

/**
 * A flow's day from a run (ADR 0025 §3): each of its own files and steps as the run said it, and the worst of them.
 * A what-if's and a restatement's holds are about the run, not about any data, so they are no flow's. A file sent
 * again holds its flow until it is decided, as it holds its day (Q-183).
 */
export function flowDay(doc: Pick<FlowDocument, 'flows' | 'steps'>, flow: string, run: RunSaid | null): FlowDay {
  const part = (doc.flows ?? []).find((f) => f.id === flow);
  const files = part?.sources ?? [];
  const steps = part?.steps ?? [];
  const day: FlowDay = { flow, outcome: 'none', how: null, files: files.length, steps: steps.length, holding: [], unusual: [], unjudged: [], failedAt: null, refused: false, waitsOn: [], kept: [] };
  if (!run || !part) return day;
  const owner = flowOwners(doc);
  const ownerOf = (id: string) => owner.get(id.toLowerCase()) ?? '';
  const holds = (run.about.holds ?? []).filter((h) => h.by !== 'restated' && h.by !== 'what-if');
  const refused = new Set((run.manifest?.nodes ?? []).filter((n) => n.status === 'refused').map((n) => n.origin.toLowerCase()));
  let built = false;
  const read = (id: string, kind: 'file' | 'step') => {
    const hold = holds.find((h) => h.origin.toLowerCase() === id.toLowerCase());
    if (hold || refused.has(id.toLowerCase())) {
      day.holding.push({ id, kind, refused: refused.has(id.toLowerCase()), said: hold?.said ?? 'the file was refused' });
      built = true;
      return;
    }
    const cell = cellOf(run.about as RunAbout, run.manifest, [id]);
    if (cell === 'unusual') day.unusual.push(id);
    else if (cell === 'unlearned') day.unjudged.push(id);
    if (cell !== 'absent') built = true;
  };
  for (const id of files) read(id, 'file');
  for (const id of steps) read(id, 'step');
  const became = run.became;
  const how = (became && HOW_OF[became]) ?? null;
  const decided = (): Pick<FlowDay, 'outcome' | 'how'> => (became === 'waiting' ? { outcome: 'waiting', how: null } : became === 'dont' ? { outcome: 'kept', how: null } : { outcome: 'decided', how });
  if (run.failedAt && ownerOf(run.failedAt) === flow && !day.holding.length) return { ...day, outcome: 'failed', failedAt: run.failedAt, refused: !!run.refusedFile };
  // Something of its own holds: paused until decided, then what the decision made of it. A hold with nothing left
  // waiting and nothing decided (every name shows its versions already) is something to look at, and no pause.
  if (day.holding.length) return { ...day, ...(became === null ? { outcome: 'unusual' as const } : decided()) };
  // Nothing of its own: its outputs kept back by another flow's hold wait on that flow.
  const gives = new Set(givesOf(doc, flow).map((x) => x.toLowerCase()));
  day.kept = run.held.filter((name) => gives.has(name.toLowerCase()));
  if (day.kept.length && became !== null) {
    const kept = new Set(day.kept.map((x) => x.toLowerCase()));
    const others = holds.filter((h) => ownerOf(h.origin) !== flow);
    const reaching = others.filter((h) => h.reaches.some((name) => kept.has(name.toLowerCase())));
    // Under `together` a hold keeps back outputs it doesn't reach: then every hold is what the flow waits on.
    day.waitsOn = [...new Set((reaching.length ? reaching : others).map((h) => ownerOf(h.origin)))];
    if (day.waitsOn.length) return { ...day, ...(became === 'waiting' ? { outcome: 'waits' as const } : decided()) };
  }
  if (day.unusual.length) return { ...day, outcome: 'unusual' };
  if (day.unjudged.length) return { ...day, outcome: 'unjudged' };
  return { ...day, outcome: built ? 'normal' : 'none' };
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/** Up to two names, then how many more: "tls", "tls, waf", "tls, waf and 2 more". */
const named = (ids: readonly string[]): string => (ids.length <= 2 ? ids.join(', ') : `${ids.slice(0, 2).join(', ')} and ${ids.length - 2} more`);

/** Flows by name, as a sentence lists them: "Evidence feeds", "Evidence feeds and Inventory". */
const listed = (names: readonly string[]): string => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

/** What a flow has, counted: "13 files, 25 steps"; "7 steps" where it has no file of its own. */
export const flowHas = (d: Pick<FlowDay, 'files' | 'steps'>): string => [d.files ? plural(d.files, 'file') : '', d.steps ? plural(d.steps, 'step') : ''].filter(Boolean).join(', ') || 'nothing of its own';

/** The extent of some of a flow's files and steps: "1 of 13 files"; "2 of 13 files, 1 of 25 steps". `short` leaves the
 * word out where they are all files or all steps: "1 of 13". */
function extent(d: FlowDay, of: readonly { id: string; kind: 'file' | 'step' }[], short = false): string {
  const f = of.filter((x) => x.kind === 'file').length;
  const s = of.filter((x) => x.kind === 'step').length;
  if (short && !(f && s)) return f ? `${f} of ${d.files}` : `${s} of ${d.steps}`;
  return [f ? `${f} of ${plural(d.files, 'file')}` : '', s ? `${s} of ${plural(d.steps, 'step')}` : ''].filter(Boolean).join(', ');
}

/** Text cut to a number of characters, an ellipsis where it was cut. */
const cut = (text: string, room: number): string => (text.length <= room ? text : `${text.slice(0, Math.max(1, room - 1))}…`);

/**
 * Names and their extent in the room a card has: "tls · 1 of 13 files"; with less room the names give way, then the
 * word after the count ("access_rev… · 1 of 13"). The count is never cut: it is the extent.
 */
function fitted(d: FlowDay, of: readonly { id: string; kind: 'file' | 'step' }[], room: number): string {
  const names = named(of.map((x) => x.id));
  const whole = `${names} · ${extent(d, of)}`;
  if (whole.length <= room) return whole;
  const tail = ` · ${extent(d, of, true)}`;
  return room - tail.length < 4 ? cut(extent(d, of), room) : `${cut(names, room - tail.length)}${tail}`;
}

/** The files and steps a day's outcome is about: what holds it, or what was unusual, or what wasn't judged. */
function about(doc: Pick<FlowDocument, 'flows'>, d: FlowDay): { id: string; kind: 'file' | 'step' }[] {
  if (d.holding.length) return d.holding;
  const files = new Set(((doc.flows ?? []).find((f) => f.id === d.flow)?.sources ?? []).map((x) => x.toLowerCase()));
  return (d.outcome === 'unjudged' ? d.unjudged : d.unusual).map((id) => ({ id, kind: files.has(id.toLowerCase()) ? ('file' as const) : ('step' as const) }));
}

/** How a decided day went out, as a card has room for it, and as a sentence starts. */
const HOW_SHORT: Record<How, string> = { asis: 'As is', fill: 'Filled', complete: 'Part only', accepted: 'New level', corrected: 'Corrected', restated: 'Restated' };
const HOW_LONG: Record<How, string> = { asis: 'Published as is', fill: 'Published filled', complete: 'Published with the part that arrived', accepted: 'Published as a new level', corrected: 'Corrected', restated: 'Restated' };

/**
 * A flow's day on its card, beside its mark, in the characters the card has room for: what it is about, then its
 * extent ("tls · 1 of 13 files"), the names giving way before the count does. A flow that waits says on whom; a normal
 * day and a flow not run yet say what the flow has.
 */
export function flowLine(doc: Pick<FlowDocument, 'flows'>, d: FlowDay, nameOf: (flow: string) => string, room = Infinity): string {
  const of = about(doc, d);
  const others = listed(d.waitsOn.map(nameOf));
  switch (d.outcome) {
    case 'failed': return cut(d.refused ? `${d.failedAt}: file refused` : `failed at ${d.failedAt}`, room);
    case 'waits': return cut(`Waits on ${others}`, room);
    case 'decided': return cut(d.holding.length ? `${d.how ? HOW_SHORT[d.how] : 'Decided'} · ${named(of.map((x) => x.id))}` : `with ${others}`, room);
    case 'kept': return d.holding.length ? fitted(d, of, room) : cut(`with ${others}`, room);
    case 'waiting': case 'unusual': case 'unjudged': return fitted(d, of, room);
    default: return cut(flowHas(d), room);
  }
}

/**
 * A flow's day in a sentence, for its sheet and for a screen reader: "Paused · tls, 1 of 13 files"; "Waits on Evidence
 * feeds"; "Normal · 13 files, 25 steps". Never an average and never a score: a state, and its extent.
 */
export function flowSaid(doc: Pick<FlowDocument, 'flows'>, d: FlowDay, nameOf: (flow: string) => string): string {
  const of = about(doc, d);
  const what = of.length ? `${named(of.map((x) => x.id))}, ${extent(d, of)}` : '';
  const others = listed(d.waitsOn.map(nameOf));
  switch (d.outcome) {
    case 'failed': return d.refused ? `Not run · ${d.failedAt}’s file was refused: it isn’t the file its list names` : `The run failed at ${d.failedAt}`;
    case 'waiting': return `Paused · ${what}`;
    case 'waits': return `Waits on ${others}`;
    case 'kept': return d.holding.length ? `Not published · ${what}` : `Not published, with ${others}`;
    case 'decided': return d.holding.length ? `${d.how ? HOW_LONG[d.how] : 'Published by a decision'} · ${what}` : `${d.how ? HOW_LONG[d.how] : 'Published by a decision'}, with ${others}`;
    case 'unusual': return `Unusual · ${what}`;
    case 'unjudged': return `Not judged yet · ${what}`;
    case 'normal': return `Normal · ${flowHas(d)}`;
    default: return flowHas(d);
  }
}

/** A dataset a flow gives, and the flows whose steps read it, by id in the document's order ('' the document's own). */
export interface Given {
  id: string;
  readers: string[];
}

/** What a flow gives (ADR 0025 §4): each dataset it publishes, with the flows that read it. */
export function givenBy(doc: Pick<FlowDocument, 'flows' | 'steps'>, flow: string): Given[] {
  const owner = flowOwners(doc);
  const order = ['', ...(doc.flows ?? []).map((f) => f.id)];
  return givesOf(doc, flow).map((id) => {
    const readers = new Set<string>();
    for (const s of doc.steps) {
      const o = owner.get(s.id.toLowerCase()) ?? '';
      if (o !== flow && s.inputs.some((i) => i.toLowerCase() === id.toLowerCase())) readers.add(o);
    }
    return { id, readers: order.filter((f) => readers.has(f)) };
  });
}

/** The flows that read a flow themselves, by id in the document's order ('' the document's own, first). */
export function readersOfFlow(doc: Pick<FlowDocument, 'flows'>, flow: string): string[] {
  const parts = doc.flows ?? [];
  const me = parts.find((f) => f.id === flow);
  return [...(me?.direct ? [''] : []), ...parts.filter((f) => f.reads.includes(flow)).map((f) => f.id)];
}
