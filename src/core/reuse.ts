/**
 * A flow reused a little differently (ADR 0025 §11, Q-228): what a flow may change about a flow it reads is its inputs
 * and its settings, and nothing else.
 *
 * - **A flow declares what is open.** Its `inputs`: each a dataset it reads in place of a file of its own, with the
 *   columns it needs. Its `settings`: values with a default, read in its notebooks as `${params.name}`.
 * - **A use** names the flow's path, a name of its own (`as`), the dataset it maps onto each input and the settings it
 *   gives a value. The flow's notebooks are then read under that name (`notebook.ts`): each step is named after the use,
 *   each input is a step that reads the columns the flow needs of the mapped dataset, and each setting is the use's
 *   value, written into the statements. The flow's checks and steps stay as written.
 * - **Each use is named and hashed apart.** A use is a flow of the document like any it reads: a card, a row in the
 *   month, an entry in every run's manifest, by the hash of its own document (`useOf`), which holds the hash of the
 *   flow it is a use of. Two uses of one flow are two names and two hashes; a change to the flow moves both.
 *
 * What this slice leaves out, each refused in a sentence (`useProblems`): a used flow with files of its own, one that
 * reads other flows, one that watches a dataset, and one whose own ontology says more than what its columns mean, what
 * its rows are called and what its rows are.
 *
 * Pure: the caller gives the notebook parser. `compose.ts` reads uses from a flow's folder; the page makes one from a
 * catalogue's flow (`src/app/derive.ts`).
 */
import type { TypeScriptKit } from 'smaltnb/format';
import { FILLED_FROM, filePath, usedName, usePath, type ContractDef, type FlowDocument, type FlowUse, type UseSetting } from './document.js';
import { expandNotebooks, type ExpandOptions } from './notebook.js';
import type { Ontology } from './ontology.js';

const lower = (x: string) => x.toLowerCase();
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** A use as a flow's file lists it beside the used flow's path: `{ path, as, name, inputs, settings }`. */
export interface UseSpec {
  /** The use's name: its id as a flow of the document, and what its steps are named after. */
  as: string;
  /** What it is called on screen. The used flow's name and the use's (`Feed health: tls_health`) where none is given. */
  name?: string;
  /** The dataset mapped onto each open input, by the input's id. */
  inputs: Record<string, string>;
  /** The settings this use gives a value of its own, by name: every other keeps the flow's default. */
  settings: Record<string, string | number>;
}

/** A use's name: lower-case letters, digits and underscores, a letter first, short enough to go before a step's. */
export const USE_NAME = /^[a-z][a-z0-9_]{0,31}$/;

const fits = (value: unknown, type: UseSetting['type']): boolean =>
  type === 'text' ? typeof value === 'string' : type === 'integer' ? typeof value === 'number' && Number.isSafeInteger(value) : typeof value === 'number' && Number.isFinite(value);

/** What is the flow's own in the document reading its folder gives: its steps, apart from those of the flows it reads. */
function ownSteps(own: FlowDocument): FlowDocument['steps'] {
  const theirs = new Set((own.flows ?? []).flatMap((f) => f.steps).map(lower));
  return own.steps.filter((s) => !theirs.has(lower(s.id)));
}

/**
 * Why a flow can't be used so (ADR 0025 §11), each in a sentence; none, and it can. `own` is the document reading the
 * flow's folder gives, its inputs open. The use's name isn't one; an input has no dataset mapped onto it, or the use
 * maps one the flow doesn't have; a setting isn't the flow's, or its value isn't of its type; a step's name after the
 * use's is too long; or the flow is one this slice doesn't read under a name: it has files of its own, reads other
 * flows, watches a dataset or has dated changes.
 */
export function useProblems(own: FlowDocument, spec: UseSpec): string[] {
  const out: string[] = [];
  if (!USE_NAME.test(spec.as)) out.push(`A use is named in lower-case letters, digits and underscores, a letter first, 32 at most: ${spec.as === '' ? 'this one has no name' : `${spec.as} isn’t`}`);
  if (!own.notebooks) out.push(`${own.name} isn’t written as notebooks: a flow is used under a name where its notebooks can be read under it`);
  const inputs = own.inputs ?? [];
  for (const x of inputs) {
    const to = Object.entries(spec.inputs).find(([k]) => lower(k) === lower(x.id))?.[1];
    if (to === undefined || to === '') out.push(`${own.name}’s input ${x.id} has no dataset mapped onto it`);
  }
  const unknown = Object.keys(spec.inputs).filter((k) => !inputs.some((x) => lower(x.id) === lower(k)));
  if (unknown.length) out.push(`${own.name} has no input called ${listed(unknown)}${inputs.length ? ` (its inputs: ${listed(inputs.map((x) => x.id))})` : ': it has no open input'}`);
  const settings = own.settings ?? [];
  for (const [name, value] of Object.entries(spec.settings)) {
    const def = settings.find((x) => x.name === name);
    if (!def) out.push(`${own.name} has no setting called ${name}${settings.length ? ` (its settings: ${listed(settings.map((x) => x.name))})` : ': it has none'}`);
    else if (!fits(value, def.type)) out.push(`${own.name}’s setting ${name} is ${def.type === 'text' ? 'text' : def.type === 'integer' ? 'a whole number' : 'a number'}: ${JSON.stringify(value)} isn’t`);
  }
  // What this slice doesn't read under a name.
  const mine = new Set((own.flows ?? []).flatMap((f) => f.sources).map(lower));
  const files = own.sources.filter((s) => !mine.has(lower(s.id)));
  if (files.length) out.push(`${own.name} has ${files.length === 1 ? 'a file' : 'files'} of its own (${listed(files.map((s) => s.id))}): a flow used under a name reads what is mapped onto its inputs`);
  if ((own.flows ?? []).length) out.push(`${own.name} reads other flows (${listed(own.flows!.map((f) => f.name))}): a flow used under a name reads what is mapped onto its inputs, and no flow of its own yet`);
  const watched = Object.keys(own.publish?.watch ?? {});
  if (watched.length) out.push(`${own.name} watches ${listed(watched)}: a use has no history of its own to be judged by yet`);
  if ((own.changes ?? []).length) out.push(`${own.name} has dated changes of its own: a flow used under a name is read as it is written`);
  if (USE_NAME.test(spec.as)) {
    const long = [...ownSteps(own).map((s) => s.id), ...inputs.map((x) => x.id)].map((id) => usedName(spec.as, id)).filter((id) => id.length > 64);
    if (long.length) out.push(`${long[0]} is longer than a name may be (64): give the use a shorter name`);
  }
  return out;
}

/**
 * Why a flow's own ontology can't go with a use of it (ADR 0025 §11), each in a sentence. Two uses would say the same
 * thing twice, and the ontology says a thing once: so a flow used under a name says what its columns mean (of its own
 * datasets, named), what its rows are called and what its rows are, and leaves types, links, actions, references,
 * dependencies and rules to the estate's ontology, which it may import. `own` is the flow's own ontology as its file
 * gives it, before an estate's is taken.
 */
export function useOntologyProblems(name: string, own: Ontology | undefined): string[] {
  if (!own) return [];
  const out: string[] = [];
  const says: [keyof Ontology, string][] = [['objectTypes', 'object types'], ['linkTypes', 'links'], ['actionTypes', 'actions'], ['references', 'references'], ['needs', 'dependencies'], ['rules', 'rules'], ['shared', 'a starting file’s shared ontology']];
  const more = says.filter(([k]) => Array.isArray(own[k]) && (own[k] as unknown[]).length > 0).map(([, what]) => what);
  if (more.length) out.push(`${name} says ${listed(more)} of its own: a flow used under a name says what its columns mean, what its rows are called and what its rows are, and imports the rest from the estate’s ontology`);
  const everywhere = (own.properties ?? []).filter((p) => !p.datasets?.length).map((p) => p.column);
  if (everywhere.length) out.push(`${name} says what ${listed(everywhere)} ${everywhere.length === 1 ? 'means' : 'mean'} without saying in which of its datasets: a flow used under a name says a column’s meaning of its own datasets, by name`);
  return out;
}

/** The name each of a flow's own steps and inputs has in a use of it: by its own name, in lower case. */
export function useNames(own: FlowDocument, use: string): Map<string, string> {
  return new Map([...ownSteps(own).map((s) => s.id), ...(own.inputs ?? []).map((x) => x.id)].map((id) => [lower(id), usedName(use, id)]));
}

/** An ontology with its datasets called as a use calls them: wherever it names one of the flow's own. */
export function renameOntology(o: Ontology | undefined, names: ReadonlyMap<string, string>): Ontology | undefined {
  if (!o) return o;
  const to = (d: string) => names.get(lower(d)) ?? d;
  const keys = <V>(map: Record<string, V> | undefined): Record<string, V> | undefined => (map ? Object.fromEntries(Object.entries(map).map(([d, v]) => [to(d), v])) : undefined);
  const { properties, nouns, rows, needs, fixes, overwhelming, rules, objectTypes, ...rest } = o;
  const out = {
    objectTypes: objectTypes.map((t) => ({ ...t, dataset: to(t.dataset) })),
    properties: properties?.map((p) => ({ ...p, ...(p.datasets ? { datasets: p.datasets.map(to) } : {}), ...(p.lookup ? { lookup: { ...p.lookup, dataset: to(p.lookup.dataset) } } : {}) })),
    nouns: keys(nouns),
    rows: rows?.map((r) => ({ ...r, dataset: to(r.dataset) })),
    needs: needs?.map((n) => ({ ...n, datasets: n.datasets.map(to), ...(n.from !== undefined ? { from: to(n.from) } : {}) })),
    rules: rules?.map((r) => ({ ...r, file: to(r.file) })),
    fixes: keys(fixes),
    overwhelming: keys(overwhelming),
  };
  return { ...rest, ...Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) } as Ontology;
}

/** What a use is, from the flow used and what the use says: each input with its dataset and the columns the flow needs
 * of it, in the flow's order, and each setting with its value here and the flow's default. */
export function flowUse(own: FlowDocument, spec: UseSpec, hash: string): FlowUse {
  const mapped = (id: string) => Object.entries(spec.inputs).find(([k]) => lower(k) === lower(id))?.[1] ?? '';
  return {
    of: { id: own.id, name: own.name, hash },
    inputs: Object.fromEntries((own.inputs ?? []).map((x) => [x.id, { to: mapped(x.id), columns: [...x.columns] }])),
    settings: Object.fromEntries((own.settings ?? []).map((x) => [x.name, { type: x.type, value: spec.settings[x.name] ?? x.default, default: x.default }])),
  };
}

/** What a use is called where it gives no name: the flow's, and the use's. */
export const useName = (own: Pick<FlowDocument, 'name'>, spec: Pick<UseSpec, 'as' | 'name'>): string => spec.name ?? `${own.name}: ${spec.as}`;

/**
 * A use's own document before its steps are derived (ADR 0025 §11): the flow's own, under the use's name. Its
 * notebooks are the flow's, each read for the use; what its ontology and its contracts say of the flow's datasets they
 * say of the use's; its inputs and settings are no longer open, and `use` says what they are here. `own` is the
 * document reading the flow's folder gives and `hash` its flow hash; for a use `useProblems` says nothing against.
 */
export function useDocument(own: FlowDocument, spec: UseSpec, hash: string): FlowDocument {
  const names = useNames(own, spec.as);
  const { inputs: _inputs, settings: _settings, steps: _steps, cells: _cells, outline: _outline, groups: _groups, gates: _gates, layout: _layout, profiles: _profiles, flows: _flows, contracts, ontology, notebooks, changes: _changes, ...rest } = own;
  const renamed = renameOntology(ontology, names);
  const kept: Record<string, ContractDef> = Object.fromEntries(Object.entries(contracts ?? {}).map(([d, c]) => [names.get(lower(d)) ?? d, c]));
  return {
    ...rest,
    id: spec.as,
    name: useName(own, spec),
    sources: [],
    steps: [],
    notebooks: (notebooks ?? []).map((n) => ({ path: usePath(n.path, spec.as), source: n.source, use: spec.as })),
    ...(renamed ? { ontology: renamed } : {}),
    ...(Object.keys(kept).length ? { contracts: kept } : {}),
    use: flowUse(own, spec, hash),
  };
}

/**
 * A use of a flow as its own document (ADR 0025 §11): the flow's notebooks read under the use's name, with the
 * datasets it maps and the values it sets. What a run keeps of the use, by its flow hash, and what a flow that takes
 * the use in adds to its own. It reads datasets it doesn't hold, so it is never run alone.
 */
export async function useOf(own: FlowDocument, spec: UseSpec, hash: string, ts: TypeScriptKit, options: ExpandOptions = {}): Promise<FlowDocument> {
  return expandNotebooks(useDocument(own, spec, hash), ts, options);
}

/** Whether a dataset is built from a feed a held day can fill from another day: a fill step, or a step that reads one. */
export function readsFill(doc: Pick<FlowDocument, 'steps'>, id: string): boolean {
  const steps = new Map(doc.steps.map((st) => [lower(st.id), st]));
  const seen = new Set<string>();
  const stack = [lower(id)];
  while (stack.length) {
    const at = stack.pop()!;
    if (seen.has(at)) continue;
    seen.add(at);
    const step = steps.get(at);
    if (!step) continue;
    if (step.kind === 'fill') return true;
    stack.push(...step.inputs.map(lower));
  }
  return false;
}

/**
 * Why a use's inputs can't be mapped as it says in a flow (ADR 0025 §11), each in a sentence; none, and they can. `doc`
 * is the flow that takes the use in and `use` what the use is. A dataset mapped isn't one of the flow's; the use's own
 * name, or one of its steps' names, is taken; a dataset is built from a feed a held day can fill and the input doesn't
 * take `filled_from`, so what the use gives couldn't say which rows came from another day (ADR 0009 amendment 1); or,
 * where `columns` knows a dataset's columns (the day's run), it lacks one the flow needs.
 */
export function mapProblems(doc: FlowDocument, name: string, use: FlowUse, columns: (dataset: string) => readonly string[] | undefined = () => undefined): string[] {
  const out: string[] = [];
  const ids = new Map([...doc.sources, ...doc.steps].map((x) => [lower(x.id), x.id]));
  for (const [input, x] of Object.entries(use.inputs)) {
    if (x.to === '') continue;
    const at = ids.get(lower(x.to));
    if (at === undefined) {
      out.push(`${name} maps ${input} onto ${x.to}, which isn’t a dataset of ${doc.name}`);
      continue;
    }
    if (readsFill(doc, at) && !x.columns.some((c) => lower(c) === FILLED_FROM)) {
      out.push(`${at} is built from a feed a held day can fill from another day, and ${use.of.name}’s input ${input} doesn’t take ${FILLED_FROM}: what ${name} gives couldn’t say which rows came from another day`);
    }
    const has = columns(at);
    if (has !== undefined) {
      const lacks = x.columns.filter((c) => !has.some((h) => lower(h) === lower(c)));
      if (lacks.length) out.push(`${at} has no column ${listed(lacks)}, which ${use.of.name} needs of its input ${input}`);
    }
  }
  return out;
}

/** A notebook's path as its file has it, for a notebook read for a use or as it is. */
export { filePath };
