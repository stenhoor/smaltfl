/**
 * Building in the app: the catalogue (ADR 0025 §10). A build ships flows that are made already, each as the document
 * reading its own folder gives. *Add a flow* puts one into the flow on screen: its own steps, notebooks, checks and
 * meanings join the document, and the document lists it among the flows it reads, by the hash it is known by. What it
 * reads must be read here too, as the same flows: a flow is added to a flow that already reads what it is built on.
 *
 * The page has no parser for a flow's folder, and needs none here: a catalogue flow comes with its steps derived. What
 * it makes is the document `composeFlow` gives a flow that lists the added one, for everything a run reads (the plan is
 * the same, node for node, `test/catalogue.test.ts`).
 *
 * Pure: no DOM, no engine. Nothing the data is made from reads this module.
 */
import { canonicalJSON } from './canonical.js';
import { flowOf, type CellRef, type FlowDocument, type FlowPart, type GroupDef, type InputDef, type NotebookDef, type NotebookOutline, type SettingDef } from './document.js';
import { joinPath, notebookSectionId } from './notebook.js';
import type { Ontology, PropertyType } from './ontology.js';

const lower = (x: string) => x.toLowerCase();
const same = (a: unknown, b: unknown) => canonicalJSON((a ?? null) as Parameters<typeof canonicalJSON>[0]) === canonicalJSON((b ?? null) as Parameters<typeof canonicalJSON>[0]);
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const dirOf = (path: string): string => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

/** A flow of the catalogue, as a build lists it: what it is, what it gives and what it is built on. */
export interface CatalogueEntry {
  id: string;
  name: string;
  description?: string;
  /** Its document's path, from the folder of the flow the catalogue is for: what the flow would list it by. */
  path: string;
  /** The hash it is known by: its own document's flow hash. */
  hash: string;
  /** The datasets it publishes of its own: what a flow that reads it may read. */
  gives: string[];
  /** The flows it reads, each by its id, its name and the hash it reads it as. */
  reads: { id: string; name: string; hash: string }[];
  /** How many files and steps are its own. */
  files: number;
  steps: number;
  /** Its open inputs and its settings (ADR 0025 §11), where it has any: such a flow is added as a use, under a name,
   * with a dataset mapped onto each input; what it gives is then named after the use. */
  inputs?: InputDef[];
  settings?: SettingDef[];
}

/** What is a flow's own in the document reading its folder gives: its sources and steps, apart from the flows it reads. */
function ownOf(own: FlowDocument): { sources: FlowDocument['sources']; steps: FlowDocument['steps'] } {
  const parts = own.flows ?? [];
  const theirs = new Set(parts.flatMap((f) => [...f.sources, ...f.steps]).map(lower));
  return { sources: own.sources.filter((s) => !theirs.has(lower(s.id))), steps: own.steps.filter((s) => !theirs.has(lower(s.id))) };
}

/** A catalogue's entry for a flow: `own` is the document reading its folder gives, `path` and `hash` what it is listed by. */
export function entryOf(own: FlowDocument, path: string, hash: string): CatalogueEntry {
  const mine = ownOf(own);
  return {
    id: own.id,
    name: own.name,
    ...(own.description ? { description: own.description } : {}),
    path,
    hash,
    gives: mine.steps.filter((s) => s.dataset !== undefined).map((s) => s.id),
    reads: (own.flows ?? []).map((f) => ({ id: f.id, name: f.name, hash: f.hash })),
    files: mine.sources.length,
    steps: mine.steps.length,
    ...(own.inputs?.length ? { inputs: own.inputs } : {}),
    ...(own.settings?.length ? { settings: own.settings } : {}),
  };
}

/** The publish settings two flows must keep the same: everything but each one's own watches. */
const settings = (p: FlowDocument['publish']) => {
  if (!p) return null;
  const { watch: _watch, ...rest } = p;
  return rest;
};

/**
 * Why a catalogue flow can't be added to a document (ADR 0025 §10), each in a sentence; none, and it can. It is read
 * here already; it is built on a flow this one doesn't read, or reads as another flow (by its hash); it has files of
 * its own, or watches a dataset, for which a build would have to ship data; a name of its own is taken; it keeps
 * another calendar, another day or another way of pausing; or it has policies of its own. A flow with an open input
 * (§11) is added as a use: `own` is then the use's own document (`reuse.ts` `useOf`), under the use's name.
 */
export function addProblems(doc: FlowDocument, own: FlowDocument): string[] {
  const out: string[] = [];
  if (!doc.notebooks) out.push(`${doc.name} isn’t written as notebooks: a flow is added to a flow that is`);
  if (own.id === doc.id) out.push(`${own.name} is this flow`);
  if ((doc.flows ?? []).some((f) => f.id === own.id)) out.push(own.use ? `${own.id} is the name of a flow read here already: a use has a name of its own` : `${own.name} is read here already`);
  if (own.inputs?.length) out.push(`${own.name} has ${own.inputs.length === 1 ? 'an open input' : 'open inputs'} (${listed(own.inputs.map((x) => x.id))}): it is added as a use, with a dataset mapped onto ${own.inputs.length === 1 ? 'it' : 'each'}`);
  if (out.length) return out;
  const mine = ownOf(own);
  for (const part of own.flows ?? []) {
    const here = (doc.flows ?? []).find((f) => f.id === part.id);
    if (!here) out.push(`${own.name} is built on ${part.name}, which ${doc.name} doesn’t read`);
    else if (here.hash !== part.hash) out.push(`${own.name} reads ${part.name} as ${part.hash.slice(0, 12)}…, and ${doc.name} reads it as ${here.hash.slice(0, 12)}…: they aren’t the same ${part.name}`);
  }
  if (mine.sources.length) out.push(`${own.name} has ${mine.sources.length === 1 ? 'a file' : `${mine.sources.length} files`} of its own (${listed(mine.sources.map((s) => s.id))}), and this build has no data for ${mine.sources.length === 1 ? 'it' : 'them'}`);
  const taken = new Set([...doc.sources, ...doc.steps].map((x) => lower(x.id)));
  const clash = [...mine.sources, ...mine.steps].filter((x) => taken.has(lower(x.id))).map((x) => x.id);
  if (clash.length) out.push(`${listed(clash)} ${clash.length === 1 ? 'is a name' : 'are names'} ${doc.name} uses already: a name is one thing across a flow and the flows it reads`);
  const watched = Object.keys(own.publish?.watch ?? {}).filter((w) => mine.steps.some((s) => lower(s.id) === lower(w)) || mine.sources.some((s) => lower(s.id) === lower(w)));
  if (watched.length) out.push(`${own.name} watches ${listed(watched)}, and this build has no history to judge ${watched.length === 1 ? 'it' : 'them'} by`);
  if (!same(own.calendar, doc.calendar)) out.push(`${own.name} keeps another calendar than ${doc.name}`);
  if (own.publish && doc.publish && !same(settings(own.publish), settings(doc.publish))) out.push(`${own.name} pauses another way than ${doc.name}`);
  if (own.publish && !doc.publish) out.push(`${own.name} says what pauses it, and ${doc.name} doesn’t`);
  for (const p of own.parameters ?? []) {
    const had = (doc.parameters ?? []).find((x) => x.name === p.name);
    if (!had) out.push(`${own.name} runs for a ${p.name}, which ${doc.name} doesn’t have`);
    else if (had.type !== p.type) out.push(`the parameter ${p.name} is ${had.type} in ${doc.name} and ${p.type} in ${own.name}`);
  }
  if (own.policies && !same(own.policies, doc.policies)) out.push(`${own.name} has policies of its own: inside another flow the reading flow’s apply`);
  return out;
}

/** An ontology with another's parts that it doesn't have yet: a thing both say is said once, the first one's. */
function withOntology(a: Ontology | undefined, b: Ontology | undefined): Ontology | undefined {
  if (!b) return a;
  if (!a) return b;
  const byId = <T extends { id: string }>(xs: readonly T[] | undefined, ys: readonly T[] | undefined): T[] => [...(xs ?? []), ...(ys ?? []).filter((y) => !(xs ?? []).some((x) => x.id === y.id))];
  // A column's meaning: one already said for every dataset, or for each dataset the new one names, stands.
  const covered = (p: PropertyType) => (a.properties ?? []).some((x) => lower(x.column) === lower(p.column) && (same(x, p) || (x.datasets === undefined && p.datasets === undefined)
    || (p.datasets !== undefined && p.datasets.every((d) => (a.properties ?? []).some((y) => lower(y.column) === lower(p.column) && y.datasets?.some((e) => lower(e) === lower(d)))))));
  const properties = [...(a.properties ?? []), ...(b.properties ?? []).filter((p) => !covered(p))];
  const rows = [...(a.rows ?? []), ...(b.rows ?? []).filter((r) => !(a.rows ?? []).some((x) => lower(x.dataset) === lower(r.dataset)))];
  const rules = [...(a.rules ?? []), ...(b.rules ?? []).filter((r) => !(a.rules ?? []).some((x) => lower(x.file) === lower(r.file) && x.id === r.id))];
  const shared = [...(a.shared ?? []), ...(b.shared ?? []).filter((s) => !(a.shared ?? []).some((x) => lower(x.file) === lower(s.file)))];
  const estate = [...(a.estate ?? []), ...(b.estate ?? []).filter((e) => !(a.estate ?? []).some((x) => x.hash === e.hash))];
  const map = <V>(x: Record<string, V> | undefined, y: Record<string, V> | undefined): Record<string, V> => ({ ...(y ?? {}), ...(x ?? {}) });
  const nouns = map(a.nouns, b.nouns);
  const fixes = map(a.fixes, b.fixes);
  const overwhelming = map(a.overwhelming, b.overwhelming);
  const needs = byId(a.needs, b.needs);
  const references = byId(a.references, b.references);
  return {
    objectTypes: byId(a.objectTypes, b.objectTypes),
    linkTypes: byId(a.linkTypes, b.linkTypes),
    actionTypes: byId(a.actionTypes, b.actionTypes),
    ...(properties.length ? { properties } : {}),
    ...(references.length ? { references } : {}),
    ...(Object.keys(nouns).length ? { nouns } : {}),
    ...(rows.length ? { rows } : {}),
    ...(needs.length ? { needs } : {}),
    ...(rules.length ? { rules } : {}),
    ...(shared.length ? { shared } : {}),
    ...(estate.length ? { estate } : {}),
    ...(Object.keys(fixes).length ? { fixes } : {}),
    ...(Object.keys(overwhelming).length ? { overwhelming } : {}),
  };
}

/**
 * A document with a catalogue flow added (ADR 0025 §10): the flow's own notebooks, steps, gates, contracts and meanings
 * after the document's, each notebook by its path from the document's folder, and the flow listed last among the flows
 * the document reads, by `path` and `hash`, with what is its own and the flows it reads. For a flow `addProblems` says
 * nothing against. `own` is the document reading the flow's folder gives.
 */
export function addFlow(doc: FlowDocument, own: FlowDocument, path: string, hash: string): FlowDocument {
  const mine = ownOf(own);
  const steps = new Set(mine.steps.map((s) => lower(s.id)));
  const dir = dirOf(path);
  // Its own notebooks: those none of whose cells is a step, a file or a gate of a flow it reads.
  const theirs = new Set((own.flows ?? []).flatMap((f) => [...f.sources, ...f.steps]).map(lower));
  const ownNotebook = (o: NotebookOutline) => !o.cells.some((c) => [c.step, c.source, c.gate].some((x) => x !== undefined && theirs.has(lower(x))));
  const paths = new Set((own.outline ?? []).filter(ownNotebook).map((o) => o.path));
  const here = (p: string) => joinPath(dir, p);
  const notebooks: NotebookDef[] = (own.notebooks ?? []).filter((n) => paths.has(n.path)).map((n) => ({ ...n, path: here(n.path) }));
  const outline: NotebookOutline[] = (own.outline ?? []).filter((o) => paths.has(o.path)).map((o) => ({ ...o, path: here(o.path) }));
  const cells: Record<string, CellRef> = {};
  for (const [id, ref] of Object.entries(own.cells ?? {})) if (paths.has(ref.notebook)) cells[id] = { ...ref, notebook: here(ref.notebook) };
  // Its notebooks' sections, each named for its notebook's path as the document has it now.
  const sectionOf = new Map([...paths].map((p) => [notebookSectionId(p), notebookSectionId(here(p))]));
  const groups: GroupDef[] = (own.groups ?? []).filter((g) => g.steps.length > 0 && g.steps.every((s) => steps.has(lower(s)))).map((g) => (sectionOf.has(g.id) ? { ...g, id: sectionOf.get(g.id)! } : g));
  const pick = <V>(map: Record<string, V> | undefined): Record<string, V> => Object.fromEntries(Object.entries(map ?? {}).filter(([id]) => steps.has(lower(id))));
  const gates = { ...(doc.gates ?? {}), ...pick(own.gates) };
  const contracts = { ...(doc.contracts ?? {}), ...pick(own.contracts) };
  const ontology = withOntology(doc.ontology, own.ontology);
  const had = new Set((doc.changes ?? []).map((c) => c.id));
  const changes = [...(doc.changes ?? []), ...(own.changes ?? []).filter((c) => !had.has(c.id))];
  const part: FlowPart = {
    path,
    id: own.id,
    name: own.name,
    ...(own.description ? { description: own.description } : {}),
    hash,
    sources: [],
    steps: mine.steps.map((s) => s.id),
    // The flows it lists; and, for a use (ADR 0025 §11), the flows that give the datasets mapped onto its inputs.
    reads: [...new Set([...(own.flows ?? []).filter((f) => f.direct).map((f) => f.id), ...Object.values(own.use?.inputs ?? {}).flatMap((x) => flowOf(doc, x.to)?.id ?? [])])],
    direct: true,
    ...(own.use ? { use: own.use } : {}),
  };
  return {
    ...doc,
    steps: [...doc.steps, ...mine.steps],
    ...(doc.notebooks || notebooks.length ? { notebooks: [...(doc.notebooks ?? []), ...notebooks] } : {}),
    ...(ontology ? { ontology } : {}),
    ...(Object.keys(gates).length ? { gates } : {}),
    ...(Object.keys(contracts).length ? { contracts } : {}),
    ...(changes.length ? { changes } : {}),
    ...(doc.cells || Object.keys(cells).length ? { cells: { ...(doc.cells ?? {}), ...cells } } : {}),
    ...(doc.outline || outline.length ? { outline: [...(doc.outline ?? []), ...outline] } : {}),
    ...(doc.groups || groups.length ? { groups: [...(doc.groups ?? []), ...groups] } : {}),
    flows: [...(doc.flows ?? []), part],
  };
}

/**
 * Why a flow added here can't be taken off again, in a sentence each: a step of the document, or of another flow it
 * reads, reads what the flow gives. None, and it can.
 */
export function takeOffProblems(doc: FlowDocument, id: string): string[] {
  const part = (doc.flows ?? []).find((f) => f.id === id);
  if (!part) return [`${id} isn’t a flow this one reads`];
  const its = new Set([...part.sources, ...part.steps].map(lower));
  const readers = doc.steps.filter((s) => !its.has(lower(s.id)) && s.inputs.some((i) => its.has(lower(i)))).map((s) => s.id);
  const out: string[] = [];
  if (readers.length) out.push(`${listed(readers)} ${readers.length === 1 ? 'reads' : 'read'} what ${part.name} gives`);
  const by = (doc.flows ?? []).filter((f) => f.reads.includes(id)).map((f) => f.name);
  if (by.length) out.push(`${listed(by)} ${by.length === 1 ? 'reads' : 'read'} ${part.name}`);
  return out;
}

/** An ontology without what is about datasets that are gone: their nouns, their rows entries, their thresholds and
 * fixes, and each column's meaning and each dependency trimmed to the datasets left (dropped where none is). */
function withoutDatasets(o: Ontology | undefined, gone: ReadonlySet<string>): Ontology | undefined {
  if (!o) return o;
  const left = (d: string) => !gone.has(lower(d));
  const trim = <T extends { datasets?: string[] }>(xs: readonly T[] | undefined): T[] | undefined =>
    xs?.flatMap((x) => {
      if (!x.datasets || x.datasets.every(left)) return [x];
      const datasets = x.datasets.filter(left);
      return datasets.length ? [{ ...x, datasets }] : [];
    });
  const keys = <V>(map: Record<string, V> | undefined): Record<string, V> | undefined => (map ? Object.fromEntries(Object.entries(map).filter(([d]) => left(d))) : undefined);
  const { properties, nouns, rows, needs, fixes, overwhelming, rules, ...rest } = o;
  const out = { properties: trim(properties), nouns: keys(nouns), rows: rows?.filter((r) => left(r.dataset)), needs: trim(needs), fixes: keys(fixes), overwhelming: keys(overwhelming), rules: rules?.filter((r) => left(r.file)) };
  const kept = Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)));
  return { ...rest, ...kept } as Ontology;
}

/** A document without a flow added to it: the flow's own steps, notebooks, gates and contracts taken out, what the
 * ontology says of its datasets alone with them, and the flow no longer listed. */
export function takeOff(doc: FlowDocument, id: string): FlowDocument {
  const part = (doc.flows ?? []).find((f) => f.id === id);
  if (!part) return doc;
  const its = new Set([...part.sources, ...part.steps].map(lower));
  const gone = new Set(Object.entries(doc.cells ?? {}).filter(([step]) => its.has(lower(step))).map(([, ref]) => ref.notebook));
  // A notebook goes with the flow where every step written in it is the flow's.
  const kept = new Set(Object.entries(doc.cells ?? {}).filter(([step]) => !step.startsWith('gate:') && !its.has(lower(step))).map(([, ref]) => ref.notebook));
  const out = (p: string) => gone.has(p) && !kept.has(p);
  const drop = <V>(map: Record<string, V> | undefined): Record<string, V> | undefined => (map ? Object.fromEntries(Object.entries(map).filter(([k]) => !its.has(lower(k.replace(/^gate:/, ''))))) : undefined);
  const { flows: _flows, gates: _gates, contracts: _contracts, cells: _cells, outline: _outline, groups: _groups, notebooks: _notebooks, ontology: _ontology, ...rest } = doc;
  const ontology = withoutDatasets(doc.ontology, its);
  const flows = (doc.flows ?? []).filter((f) => f.id !== id);
  const gates = drop(doc.gates);
  const contracts = drop(doc.contracts);
  const cells = drop(doc.cells);
  const groups = doc.groups?.map((g) => ({ ...g, steps: g.steps.filter((s) => !its.has(lower(s))) })).filter((g) => g.steps.length > 0);
  return {
    ...rest,
    sources: doc.sources.filter((s) => !its.has(lower(s.id))),
    steps: doc.steps.filter((s) => !its.has(lower(s.id))),
    ...(ontology ? { ontology } : {}),
    ...(doc.notebooks ? { notebooks: doc.notebooks.filter((n) => !out(n.path)) } : {}),
    ...(gates && Object.keys(gates).length ? { gates } : {}),
    ...(contracts && Object.keys(contracts).length ? { contracts } : {}),
    ...(cells ? { cells } : {}),
    ...(doc.outline ? { outline: doc.outline.filter((o) => !out(o.path)) } : {}),
    ...(groups ? { groups } : {}),
    ...(flows.length ? { flows } : {}),
  };
}
