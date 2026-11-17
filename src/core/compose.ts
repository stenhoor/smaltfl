/**
 * Flows in flows (ADR 0025 §1, §2). A flow lists the flows it reads by their paths (`flows` in its `flow.json`), and
 * reading it brings them in, as reading brings in its notebooks and the shared ontologies it imports: by reference in
 * the files, by value in the document. The document a run hashes is the one read, with every flow it reads in it, and
 * the plan made from it is the flat plan it always was, so nothing downstream learns what a flow in a flow is but the
 * screens that draw one.
 *
 * - **One definition.** A flow read by two flows is one flow, read once: the same sources and steps, by the same ids.
 * - **Names are the estate's.** An id is one thing across a flow and the flows it reads; a clash is refused, naming both.
 * - **Known by its own hash.** Each flow read is listed with the flow hash of the document read from its own folder,
 *   with the flows *it* reads in it: what reading that flow on its own gives. The reading flow's hash covers them all.
 * - **One calendar, one day, one way of pausing.** A flow and the flows it reads keep the same calendar, parameters and
 *   publish settings; each brings its own watches. Policies are the reading flow's.
 *
 * What one flow may read of another (its published datasets, and its files) is the document's own rule, checked by
 * `validateDocument`, so a composed document is checked wherever it is read. Pure: the caller reads the files.
 */
import type { TypeScriptKit } from 'smaltnb/format';
import { canonicalJSON } from './canonical.js';
import { validateDocument, type FlowDocument, type FlowPart, type NotebookDef, type ParameterDef, type PublishDef } from './document.js';
import { syncRuleCells } from './gatecell.js';
import { expandNotebooks, joinPath, loadNotebooks, type ExpandOptions, type NotebookRef } from './notebook.js';
import type { Ontology } from './ontology.js';
import { flowHash, PlanError } from './plan.js';
import { importOntologies } from './shared.js';

/** How a flow's files are read: each by its path from the folder of the flow asked for. */
export interface FlowFiles {
  /** A JSON file (a flow's document, a shared ontology), parsed. */
  json(path: string): Promise<unknown>;
  /** A text file (a notebook). */
  text(path: string): Promise<string>;
}

/** A flow as its file gives it, its notebooks loaded and its shared ontologies brought in, before the flows it reads. */
interface Raw {
  /** Its document's path and folder, from the folder of the flow asked for. */
  path: string;
  dir: string;
  doc: FlowDocument;
  /** The flows it lists, by their documents' paths (from the same folder). */
  reads: string[];
}

const dirOf = (path: string): string => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

/** A path as it reads from another folder: `inventory/bronze.nb.ts` from `feeds` is `../inventory/bronze.nb.ts`. */
export function pathFrom(dir: string, path: string): string {
  const from = dir === '' ? [] : dir.split('/');
  const to = path.split('/');
  let k = 0;
  while (k < from.length && k < to.length - 1 && from[k] === to[k]) k++;
  return [...from.slice(k).map(() => '..'), ...to.slice(k)].join('/');
}

const fail = (path: string, message: string): never => {
  throw new PlanError(`${path}: ${message}`, [{ path, message }]);
};

/**
 * A flow read from its folder: its document at `path` (as `files` reads it), with its shared ontologies and its
 * notebooks, the flows it reads and theirs, its steps derived, and its check cells in step with its ontology. A flow
 * that reads none is read as it always was. Throws a PlanError naming the first problem.
 */
export async function composeFlow(path: string, files: FlowFiles, ts: TypeScriptKit, options: ExpandOptions = {}): Promise<FlowDocument> {
  const raws = new Map<string, Promise<Raw>>();
  const raw = (p: string): Promise<Raw> => {
    let got = raws.get(p);
    if (!got) {
      got = (async () => {
        const dir = dirOf(p);
        const read = (await files.json(p)) as FlowDocument & { notebooks?: NotebookRef[]; flows?: unknown };
        const listed = read.flows;
        if (listed !== undefined && (!Array.isArray(listed) || listed.some((f) => typeof f !== 'string' || f === ''))) fail(p, 'flows is a list of the flows this one reads, each by the path of its flow.json');
        const { flows: _flows, ...own } = read;
        const imported = await importOntologies(own as FlowDocument, (q) => files.json(joinPath(dir, q)));
        const doc = (await loadNotebooks(imported as FlowDocument & { notebooks?: NotebookRef[] }, (q) => files.text(joinPath(dir, q)))) as FlowDocument;
        return { path: p, dir, doc, reads: ((listed as string[] | undefined) ?? []).map((f) => joinPath(dir, f)) };
      })();
      raws.set(p, got);
    }
    return got;
  };

  // Every flow the one asked for reads, a flow after the flows it reads; a flow met again on its own path is a circle.
  const order = async (p: string, trail: string[], out: string[]): Promise<string[]> => {
    if (trail.includes(p)) fail(trail[0]!, `the flows read each other in a circle: ${[...trail.slice(trail.indexOf(p)), p].join(' → ')}`);
    if (out.includes(p)) return out;
    for (const r of (await raw(p)).reads) await order(r, [...trail, p], out);
    out.push(p);
    return out;
  };

  const built = new Map<string, Promise<FlowDocument>>();
  const build = (p: string): Promise<FlowDocument> => {
    let got = built.get(p);
    if (!got) {
      got = (async () => {
        const root = await raw(p);
        const closure = (await order(p, [], [])).filter((q) => q !== p);
        const finish = async (doc: FlowDocument) => (doc.notebooks ? syncRuleCells(await expandNotebooks(doc, ts, options)) : doc);
        if (closure.length === 0) return finish(root.doc);
        const parts = await Promise.all(closure.map(async (q) => ({ raw: await raw(q), hash: await flowHash(await build(q)) })));
        const merged = merge(root, parts);
        const expanded = await expandNotebooks(merged, ts, options);
        // Each flow's own steps: the cells of its own notebooks.
        const cells = expanded.cells ?? {};
        const flows = expanded.flows!.map((f, k): FlowPart => {
          const from = parts[k]!.raw;
          const mine = new Set((from.doc.notebooks ?? []).map((n) => pathFrom(root.dir, joinPath(from.dir, n.path))));
          return { ...f, steps: expanded.steps.filter((s) => mine.has(cells[s.id]?.notebook ?? '')).map((s) => s.id) };
        });
        const doc = syncRuleCells({ ...expanded, flows });
        // A flow that reads flows is checked as it is read: what it reads of each is that flow's to give.
        const issues = validateDocument(doc);
        if (issues.length > 0) throw new PlanError(`${p}: ${issues[0]!.path}: ${issues[0]!.message}`, issues);
        return doc;
      })();
      built.set(p, got);
    }
    return got;
  };
  return build(path);
}

/** A flow's document with the flows it reads merged in: their sources, notebooks, watches, contracts and ontology
 * parts before its own, each flow listed with what is its own. */
function merge(root: Raw, parts: readonly { raw: Raw; hash: string }[]): FlowDocument {
  const at = root.path;
  const name = (r: Raw) => r.doc.name;
  if (!root.doc.notebooks || parts.some((p) => !p.raw.doc.notebooks)) fail(at, 'a flow that reads flows, and each flow it reads, is a folder with notebooks (a flow.json and its .nb.ts files)');
  const all = [...parts.map((p) => p.raw), root];

  // Names are the estate's: an id is one flow's.
  const owner = new Map<string, Raw>();
  for (const r of all) {
    for (const s of r.doc.sources) {
      const had = owner.get(s.id.toLowerCase());
      if (had) fail(at, `${s.id} is a source of ${name(had)} and of ${name(r)}: a name is one thing across a flow and the flows it reads`);
      owner.set(s.id.toLowerCase(), r);
    }
  }
  const ids = new Map<string, Raw>();
  for (const r of all) {
    const had = ids.get(r.doc.id);
    if (had) fail(at, `${had.path} and ${r.path} are both called ${r.doc.id}: each flow has its own id`);
    ids.set(r.doc.id, r);
  }

  // One day: the same parameters, by name and type; the reading flow's defaults.
  const parameters: ParameterDef[] = [];
  for (const r of [root, ...parts.map((p) => p.raw)]) {
    for (const d of r.doc.parameters ?? []) {
      const had = parameters.find((x) => x.name === d.name);
      if (!had) parameters.push(d);
      else if (had.type !== d.type) fail(at, `the parameter ${d.name} is ${had.type} in ${name(root)} and ${d.type} in ${name(r)}`);
    }
  }
  // One calendar and one way of pausing: what the flows say must be the same; each brings its watches.
  const same = (a: unknown, b: unknown) => canonicalJSON((a ?? null) as never) === canonicalJSON((b ?? null) as never);
  const settings = (p: PublishDef | undefined) => {
    if (!p) return null;
    const { watch: _watch, ...rest } = p;
    return rest;
  };
  let publish = root.doc.publish;
  const watch: NonNullable<PublishDef['watch']> = {};
  for (const r of all) {
    if (!same(r.doc.calendar, root.doc.calendar)) fail(at, `${name(r)} keeps another calendar than ${name(root)}: a flow and the flows it reads keep one`);
    if (r.doc.publish && root.doc.publish && !same(settings(r.doc.publish), settings(root.doc.publish))) {
      const mine = settings(root.doc.publish) as Record<string, unknown>;
      const theirs = settings(r.doc.publish) as Record<string, unknown>;
      const differ = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].filter((k) => !same(mine[k], theirs[k]));
      fail(at, `${name(r)} pauses another way than ${name(root)} (publish.${differ.join(', publish.')}): a flow and the flows it reads pause one way`);
    }
    if (r.doc.publish && !root.doc.publish) fail(at, `${name(r)} says what pauses it (a publish block) and ${name(root)} doesn't: the flow that reads it says the same`);
    if (r.doc.policies && r !== root && !same(r.doc.policies, root.doc.policies)) fail(at, `${name(r)} has policies of its own: inside another flow the reading flow's apply, so it has none, or the same`);
    for (const [id, w] of Object.entries(r.doc.publish?.watch ?? {})) watch[id] = w;
  }
  if (publish) publish = { ...publish, ...(Object.keys(watch).length ? { watch } : {}) };

  const contracts: NonNullable<FlowDocument['contracts']> = {};
  for (const r of all) {
    for (const [id, c] of Object.entries(r.doc.contracts ?? {})) {
      if (contracts[id]) fail(at, `${id} has a contract in two flows`);
      contracts[id] = c;
    }
  }
  const changes = all.flatMap((r) => r.doc.changes ?? []);
  const twice = changes.find((c, i) => changes.findIndex((x) => x.id === c.id) !== i);
  if (twice) fail(at, `two change sets are called ${twice.id}`);

  const rebase = (r: Raw, n: NotebookDef): NotebookDef => ({ ...n, path: pathFrom(root.dir, joinPath(r.dir, n.path)) });
  const ontology = mergeOntologies(at, all.map((r) => ({ name: name(r), ontology: r.doc.ontology })));
  const flows = parts.map(({ raw: r, hash }): FlowPart => ({
    path: pathFrom(root.dir, r.path),
    id: r.doc.id,
    name: r.doc.name,
    ...(r.doc.description ? { description: r.doc.description } : {}),
    hash,
    sources: r.doc.sources.map((s) => s.id),
    steps: [],
    reads: r.reads.map((q) => parts.find((x) => x.raw.path === q)!.raw.doc.id),
    direct: root.reads.includes(r.path),
  }));
  const { parameters: _p, sources: _s, notebooks: _n, ontology: _o, contracts: _c, publish: _pub, changes: _ch, flows: _f, ...rest } = root.doc;
  return {
    ...rest,
    ...(parameters.length ? { parameters } : {}),
    sources: all.flatMap((r) => r.doc.sources),
    steps: [],
    notebooks: all.flatMap((r) => (r.doc.notebooks ?? []).map((n) => rebase(r, n))),
    ...(ontology ? { ontology } : {}),
    ...(Object.keys(contracts).length ? { contracts } : {}),
    ...(publish ? { publish } : {}),
    ...(changes.length ? { changes } : {}),
    flows,
  };
}

/** The flows' ontologies as one: each list after the other, a thing said twice refused (a meaning is said in one place). */
function mergeOntologies(at: string, given: readonly { name: string; ontology: Ontology | undefined }[]): Ontology | undefined {
  const has = given.filter((g): g is { name: string; ontology: Ontology } => g.ontology !== undefined);
  if (has.length === 0) return undefined;
  if (has.length === 1) return has[0]!.ontology;
  const out: Ontology = { objectTypes: [], linkTypes: [], actionTypes: [] };
  const lists = ['objectTypes', 'linkTypes', 'actionTypes', 'properties', 'references', 'rows', 'needs', 'rules', 'shared'] as const;
  const maps = ['nouns', 'fixes', 'overwhelming'] as const;
  const keyOf: Record<(typeof lists)[number], (x: never) => string> = {
    objectTypes: (x: { id: string }) => x.id,
    linkTypes: (x: { id: string }) => x.id,
    actionTypes: (x: { id: string }) => x.id,
    properties: (x: { column: string; datasets?: string[] }) => `${x.column.toLowerCase()} ${[...(x.datasets ?? [])].map((d) => d.toLowerCase()).sort().join(',')}`,
    references: (x: { id: string }) => x.id,
    rows: (x: { dataset: string }) => x.dataset.toLowerCase(),
    needs: (x: { id: string }) => x.id,
    rules: (x: { file: string; id: string }) => `${x.file.toLowerCase()} ${x.id}`,
    shared: (x: { file: string }) => x.file.toLowerCase(),
  } as never;
  const what: Record<string, string> = { objectTypes: 'object type', linkTypes: 'link', actionTypes: 'action', properties: 'column', references: 'reference', rows: 'rows entry', needs: 'dependency', rules: 'rule', shared: 'shared ontology' };
  for (const k of lists) {
    const seen = new Map<string, string>();
    const merged: unknown[] = [];
    for (const g of has) {
      for (const x of (g.ontology[k] ?? []) as unknown[]) {
        const key = keyOf[k](x as never);
        if (seen.has(key)) fail(at, `the ${what[k]} ${key.trim()} is said by ${seen.get(key)} and by ${g.name}: the ontology says a thing once`);
        seen.set(key, g.name);
        merged.push(x);
      }
    }
    if (merged.length || k === 'objectTypes' || k === 'linkTypes' || k === 'actionTypes') (out as unknown as Record<string, unknown>)[k] = merged;
  }
  for (const k of maps) {
    const merged: Record<string, unknown> = {};
    const seen = new Map<string, string>();
    for (const g of has) {
      for (const [id, v] of Object.entries(g.ontology[k] ?? {})) {
        if (seen.has(id.toLowerCase())) fail(at, `${k}.${id} is said by ${seen.get(id.toLowerCase())} and by ${g.name}: the ontology says a thing once`);
        seen.set(id.toLowerCase(), g.name);
        merged[id] = v;
      }
    }
    if (Object.keys(merged).length) (out as unknown as Record<string, unknown>)[k] = merged;
  }
  return out;
}

/**
 * Whether a document holds a flow it says it reads, unchanged (ADR 0025 §2): every source and step of the flow's own
 * document is in it as written, with its gate's written rules, its contract and its watch. What a verifier checks of
 * each flow a run names, from the flow's own document kept by its hash. The problems found; none, and it does.
 *
 * The rules people set are the day's, not the flow's as it was read (ADR 0021 §5): a check's mode in a gate and a rule's
 * switch in a check step are left out here, and covered by the hash of the rules in force. So is what a decision fills:
 * a fill step's missing part and its donor are a derived run's (ADR 0009 amendment 1), which the repair check covers.
 */
export function flowProblems(doc: FlowDocument, part: FlowDocument): string[] {
  const out: string[] = [];
  const same = (a: unknown, b: unknown) => canonicalJSON((a ?? null) as never) === canonicalJSON((b ?? null) as never);
  const lower = (x: string) => x.toLowerCase();
  for (const s of part.sources) {
    const got = doc.sources.find((x) => lower(x.id) === lower(s.id));
    if (!got) out.push(`its source ${s.id} isn't there`);
    else if (!same(got, s)) out.push(`its source ${s.id} isn't as it wrote it`);
  }
  const bare = (s: FlowDocument['steps'][number]) => {
    if (s.kind === 'fill') {
      const { missing: _missing, from: _from, ...rest } = s;
      return { ...rest, inputs: s.inputs.slice(0, 1) };
    }
    if (s.kind !== 'expectations') return s;
    const { ontology: _switches, ...rest } = s;
    return rest;
  };
  for (const s of part.steps) {
    const got = doc.steps.find((x) => lower(x.id) === lower(s.id));
    if (!got) out.push(`its step ${s.id} isn't there`);
    else if (!same(bare(got), bare(s))) out.push(`its step ${s.id} isn't as it wrote it`);
  }
  const written = (g: NonNullable<FlowDocument['gates']>[string] | undefined) => {
    if (!g) return null;
    const { checks: _modes, ...rest } = g;
    return rest;
  };
  for (const [id, g] of Object.entries(part.gates ?? {})) if (!same(written(doc.gates?.[id]), written(g))) out.push(`the gate on ${id} isn't as it wrote it`);
  for (const [id, c] of Object.entries(part.contracts ?? {})) if (!same(doc.contracts?.[id], c)) out.push(`the contract of ${id} isn't as it wrote it`);
  for (const [id, w] of Object.entries(part.publish?.watch ?? {})) if (!same(doc.publish?.watch?.[id], w)) out.push(`the watch on ${id} isn't as it wrote it`);
  return out;
}
