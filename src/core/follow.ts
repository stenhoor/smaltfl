/**
 * A change followed, said and tested (ADR 0025 §7). A flow reads the flows it lists as they are, so a change to one
 * reaches every flow built on it with nothing done. This module says the rest, for the page: whose a change is (the flow
 * whose file or step it is about), which flows follow it, why a change of a pinned flow is refused, what differs between
 * two versions of a flow in words (its files, its steps, what it gives, its checks), and what testing a change on the
 * days already recorded found. attribute.ts puts each change in the own document of the flow it belongs to.
 *
 * Pure: no DOM, no engine. The page runs the days. Nothing the data is made from reads this module, so its words can
 * change without the data being made again.
 */
import { editTargets } from './attribute.js';
import { canonicalJSON } from './canonical.js';
import { flowOwners, type ChangeSet, type FlowDocument, type FlowPart, type StepDef } from './document.js';
import { diffSaid, rulesDiff } from './ruleversions.js';

const lower = (x: string) => x.toLowerCase();
const same = (a: unknown, b: unknown) => canonicalJSON((a ?? null) as Parameters<typeof canonicalJSON>[0]) === canonicalJSON((b ?? null) as Parameters<typeof canonicalJSON>[0]);
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ------------------------------------------------------------------ whose a change is

/** The flows of a document in its order, its own flow ('') last. */
const flowOrder = (doc: Pick<FlowDocument, 'flows'>): string[] => [...(doc.flows ?? []).map((f) => f.id), ''];

/**
 * The flows a change set is of (ADR 0025 §7): those whose file or step one of its edits is about, in the document's
 * order, its own flow ('') last. A change that names no dataset (a version's rules taken whole) is the document's own.
 */
export function changeFlows(doc: Pick<FlowDocument, 'flows'>, change: Pick<ChangeSet, 'edits'>): string[] {
  const owner = flowOwners(doc);
  const of = new Set(change.edits.flatMap(editTargets).map((d) => owner.get(lower(d)) ?? ''));
  if (!of.size) of.add('');
  return flowOrder(doc).filter((f) => of.has(f));
}

/** Every flow a flow reads, itself or through another, by id. */
function reach(parts: readonly FlowPart[], flow: string): Set<string> {
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const r of parts.find((f) => f.id === id)?.reads ?? []) visit(r);
  };
  for (const id of flow === '' ? parts.filter((f) => f.direct).map((f) => f.id) : (parts.find((f) => f.id === flow)?.reads ?? [])) visit(id);
  return seen;
}

/**
 * The flows that follow a change of these flows (ADR 0025 §7): every flow that reads one of them, itself or through
 * another, in the document's order, its own flow ('') last. Not the flows the change is of.
 */
export function followersOf(doc: Pick<FlowDocument, 'flows'>, flows: readonly string[]): string[] {
  const parts = doc.flows ?? [];
  const of = new Set(flows);
  return flowOrder(doc).filter((f) => !of.has(f) && [...reach(parts, f)].some((r) => of.has(r)));
}

/** What a change set is to a flow: its own (about one of its files or steps), or one it follows (about a flow it reads). */
export interface FlowChange {
  change: ChangeSet;
  bearing: 'own' | 'follows';
  /** The flows the change is of. */
  of: string[];
}

/**
 * The change sets that bear on a flow (ADR 0025 §7), in the order given: its own, and those of the flows it reads,
 * which it follows. `flow` '' is the document's own flow. A change that bears on no file or step the flow has or reads
 * isn't listed.
 */
export function flowChanges(doc: Pick<FlowDocument, 'flows' | 'changes'>, flow: string, changes: readonly ChangeSet[] = doc.changes ?? []): FlowChange[] {
  const reads = reach(doc.flows ?? [], flow);
  const out: FlowChange[] = [];
  for (const change of changes) {
    const of = changeFlows(doc, change);
    if (of.includes(flow)) out.push({ change, bearing: 'own', of });
    else if (of.some((f) => reads.has(f))) out.push({ change, bearing: 'follows', of });
  }
  return out;
}

/**
 * Why a change of these flows can't be made. A use of a flow (ADR 0025 §11) changes the flow's inputs and its settings
 * and nothing else: its checks and steps stay as the flow wrote them, so a rule isn't changed on a use's datasets. And
 * (§7) a flow whose hash the change would move, one the change is of or one that follows it, is pinned by a flow that
 * reads it, which reads it only as it is. In a sentence, naming the first; null where the change can be made. `nameOf`
 * names a flow, the document's own by ''.
 */
export function pinProblem(doc: Pick<FlowDocument, 'flows'>, of: readonly string[], nameOf: (flow: string) => string): string | null {
  const use = (doc.flows ?? []).find((f) => of.includes(f.id) && f.use);
  if (use) return `${use.name} is a use of ${use.use!.of.name}: a use changes its inputs and its settings, and its checks and steps stay as ${use.use!.of.name} wrote them. Change ${use.use!.of.name} where it is written, and every use of it follows.`;
  const moved = new Set([...of, ...followersOf(doc, of)]);
  const part = (doc.flows ?? []).find((f) => moved.has(f.id) && f.pin?.length);
  if (!part) return null;
  const by = listed(part.pin!.map(nameOf));
  const why = of.includes(part.id) ? 'this would change it' : `this changes ${listed(of.map(nameOf))}, which it reads`;
  return `${part.name} is pinned by ${by}, which ${part.pin!.length === 1 ? 'reads' : 'read'} it only as it is: ${why}. Move the pin first.`;
}

// ------------------------------------------------------------------ what changed between two versions of a flow

/** What differs between two versions of a flow's document (ADR 0025 §7): its files, its steps, what it gives, the flows
 * it reads, and its checks (the rules people set and the gates, `rulesDiff`), each in words. */
export interface FlowDiff {
  files: { added: string[]; removed: string[]; changed: string[] };
  steps: { added: string[]; removed: string[]; changed: string[] };
  /** The datasets it publishes: those it gives now and didn't, and those it gave and doesn't. */
  gives: { added: string[]; removed: string[] };
  /** The flows it reads, by id. */
  reads: { added: string[]; removed: string[] };
  /** Each difference in its checks, in words. */
  checks: string[];
}

/** A step as its flow wrote it, without what the day's rules decide (a check step's rule switches, counted with the
 * checks) and what a decision fills (a fill step's missing part and its donor). */
const bare = (s: StepDef): unknown => {
  if (s.kind === 'fill') {
    const { missing: _missing, from: _from, ...rest } = s;
    return { ...rest, inputs: s.inputs.slice(0, 1) };
  }
  if (s.kind !== 'expectations') return s;
  const { ontology: _switches, ...rest } = s;
  return rest;
};

/** The ids of two lists that are only in the later, only in the earlier, and in both but not the same. */
function compared<T extends { id: string }>(before: readonly T[], after: readonly T[], view: (x: T) => unknown = (x) => x): { added: string[]; removed: string[]; changed: string[] } {
  const was = new Map(before.map((x) => [lower(x.id), x]));
  const is = new Map(after.map((x) => [lower(x.id), x]));
  return {
    added: after.filter((x) => !was.has(lower(x.id))).map((x) => x.id),
    removed: before.filter((x) => !is.has(lower(x.id))).map((x) => x.id),
    changed: after.filter((x) => was.has(lower(x.id)) && !same(view(was.get(lower(x.id))!), view(x))).map((x) => x.id),
  };
}

/** What differs between two versions of a flow's document, from `before` to `after`. */
export function flowDiff(before: FlowDocument, after: FlowDocument): FlowDiff {
  const published = (doc: FlowDocument) => doc.steps.filter((s) => s.dataset !== undefined).map((s) => s.id);
  const gave = new Set(published(before).map(lower));
  const gives = new Set(published(after).map(lower));
  const read = new Set((before.flows ?? []).map((f) => f.id));
  const reads = new Set((after.flows ?? []).map((f) => f.id));
  return {
    files: compared(before.sources, after.sources),
    steps: compared(before.steps, after.steps, bare),
    gives: { added: published(after).filter((x) => !gave.has(lower(x))), removed: published(before).filter((x) => !gives.has(lower(x))) },
    reads: { added: [...reads].filter((f) => !read.has(f)), removed: [...read].filter((f) => !reads.has(f)) },
    checks: rulesDiff(before, after).map((d) => diffSaid(d, after.ontology)),
  };
}

/** Whether two versions of a flow differ in anything a diff says. */
export const diffEmpty = (d: FlowDiff): boolean =>
  ![d.files.added, d.files.removed, d.files.changed, d.steps.added, d.steps.removed, d.steps.changed, d.gives.added, d.gives.removed, d.reads.added, d.reads.removed, d.checks].some((x) => x.length);

/** A diff in a few lines, the structure first: "1 step added: apps_by_team", "It gives 1 more dataset: apps_by_team",
 * then each difference in its checks. `nameOf` names a flow read. */
export function diffLines(d: FlowDiff, nameOf: (flow: string) => string = (f) => f): string[] {
  const out: string[] = [];
  const say = (xs: readonly string[], one: string, verb: string, many?: string) => {
    if (xs.length) out.push(`${plural(xs.length, one, many)} ${verb}: ${listed(xs)}`);
  };
  say(d.reads.added.map(nameOf), 'flow', 'read now');
  say(d.reads.removed.map(nameOf), 'flow', 'no longer read');
  say(d.files.added, 'file', 'added');
  say(d.files.removed, 'file', 'taken out');
  say(d.files.changed, 'file', 'read another way');
  say(d.steps.added, 'step', 'added');
  say(d.steps.removed, 'step', 'taken out');
  say(d.steps.changed, 'step', 'rewritten');
  if (d.gives.added.length) out.push(`It gives ${plural(d.gives.added.length, 'more dataset')}: ${listed(d.gives.added)}`);
  if (d.gives.removed.length) out.push(`It no longer gives ${listed(d.gives.removed)}`);
  out.push(...d.checks);
  return out;
}

// ------------------------------------------------------------------ a change tested on the days recorded

/** What a recorded day came to, and what it would under a change: published, held (not published), or the run failed. */
export type DayCame = 'published' | 'held' | 'failed';

/** One recorded day run again under a change (a what-if run, ADR 0021 §4: nothing published, no name moved). */
export interface DayTest {
  day: string;
  /** What the version readers got came to. */
  was: DayCame;
  /** What the day comes to under the change. */
  now: DayCame;
  /** What holds it under the change that didn't hold the version readers got: each file or step, by id. */
  holds: string[];
}

/** A test's days by what the change does to them. */
export interface TestCount {
  days: number;
  /** Published as recorded, held under the change. */
  paused: DayTest[];
  /** Held as recorded, published under the change. */
  freed: DayTest[];
  /** The run under the change failed. */
  failed: DayTest[];
  /** The same end either way (a day still held may be held by something else: `moved`). */
  same: number;
  /** Still held, by something the recorded version wasn't held by. */
  moved: DayTest[];
}

/** A test's days counted. */
export function testCount(days: readonly DayTest[]): TestCount {
  const paused = days.filter((d) => d.was === 'published' && d.now === 'held');
  const freed = days.filter((d) => d.was === 'held' && d.now === 'published');
  const failed = days.filter((d) => d.now === 'failed' && d.was !== 'failed');
  const moved = days.filter((d) => d.was === 'held' && d.now === 'held' && d.holds.length > 0);
  return { days: days.length, paused, freed, failed, moved, same: days.length - paused.length - freed.length - failed.length };
}

/**
 * A test in a sentence (ADR 0025 §7): "Under the changed Evidence feeds, 2 of the last 14 days would have paused: Tue
 * Mar 12 and Mon Mar 18; 12 come out the same." `what` is the change's subject ("the changed Evidence feeds"); `dayOf`
 * names a day. The test informs: nothing in it holds the change back.
 */
export function testSaid(what: string, t: TestCount, dayOf: (day: string) => string = (d) => d): string {
  if (!t.days) return `Under ${what}, no recorded day was there to test.`;
  const of = t.days === 1 ? 'the last day' : `the last ${t.days} days`;
  const named = (xs: readonly DayTest[]) => listed(xs.map((d) => dayOf(d.day)));
  const parts: string[] = [];
  if (t.paused.length) parts.push(`${t.paused.length} of ${of} would have paused: ${named(t.paused)}`);
  if (t.freed.length) parts.push(`${t.paused.length ? t.freed.length : `${t.freed.length} of ${of}`} would have been published: ${named(t.freed)}`);
  if (t.failed.length) parts.push(`${t.paused.length || t.freed.length ? t.failed.length : `${t.failed.length} of ${of}`} would have failed: ${named(t.failed)}`);
  if (!parts.length) return `Under ${what}, ${t.days === 1 ? 'the last day comes' : `all of ${of} come`} out the same.`;
  return `Under ${what}, ${parts.join('; ')}; ${t.same === 0 ? 'none comes out the same' : t.same === 1 ? '1 comes out the same' : `${t.same} come out the same`}.`;
}
