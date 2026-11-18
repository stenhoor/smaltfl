/**
 * Flows in flows (ADR 0026 §1, §2). A flow lists the flows it reads by their paths (`flows` in its `flow.json`), and
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
 * - **Reused a little differently** (ADR 0026 §11, `reuse.ts`). A flow may be listed as a use: by its path, a name
 *   (`as`), the dataset mapped onto each of its open inputs and the settings it gives a value. Its notebooks are read
 *   under that name, so each use is a flow of the document with its own steps and its own hash, which holds the used
 *   flow's. One flow used twice is two flows here, and one definition on disk.
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
import { mapProblems, renameOntology, useNames, useOf, useOntologyProblems, useProblems, type UseSpec } from './reuse.js';
import { asEstate, estateHash, importOntologies, isEstate, isOverride, overrideProblems, takeEstate, type EstateFrom, type EstateOntology } from './shared.js';

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
  /** The flows it pins (ADR 0026 §7): the hash it reads each as, by the same paths. Reading refuses any other. */
  pins: Map<string, string>;
  /** The flows it uses under a name (ADR 0026 §11): each by the used flow's path, with what the use maps and sets, and
   * the hash it pins the used flow at, where it does. */
  uses: { path: string; spec: UseSpec; pin: string | null }[];
  /** The estates' ontologies it imports (ADR 0026 §8), by their paths from the same folder: taken once its steps are
   * known, since what a flow takes is what is about its datasets. */
  estates: RawEstate[];
}

interface RawEstate {
  path: string;
  estate: EstateOntology;
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
  return (await composeAll(path, files, ts, options)).doc;
}

/**
 * A flow read from its folder (`composeFlow`), with the own document of each flow it reads, in the order its `flows`
 * list them (ADR 0026 §2): what a run keeps beside its own document. A flow read as it is has the document its own
 * folder gives; a use (§11) has the used flow read under its name, which no folder holds.
 */
export async function composeAll(path: string, files: FlowFiles, ts: TypeScriptKit, options: ExpandOptions = {}): Promise<{ doc: FlowDocument; owns: FlowDocument[] }> {
  const raws = new Map<string, Promise<Raw>>();
  const raw = (p: string): Promise<Raw> => {
    let got = raws.get(p);
    if (!got) {
      got = (async () => {
        const dir = dirOf(p);
        const read = (await files.json(p)) as FlowDocument & { notebooks?: NotebookRef[]; flows?: unknown };
        // The flows it lists: each by the path of its flow.json; or by that path and the hash it is read as (a pin); or,
        // a use (ADR 0026 §11), by that path, a name, the dataset mapped onto each input and the settings it sets.
        const record = (f: unknown): f is Record<string, unknown> => typeof f === 'object' && f !== null && !Array.isArray(f);
        const hash = (v: unknown) => v === undefined || (typeof v === 'string' && /^[0-9a-f]{64}$/.test(v));
        const pinned = (f: unknown): f is { path: string; hash: string } => record(f) && Object.keys(f).every((k) => k === 'path' || k === 'hash')
          && typeof f.path === 'string' && f.path !== '' && f.hash !== undefined && hash(f.hash);
        const strings = (v: unknown) => record(v) && Object.values(v).every((x) => typeof x === 'string');
        const values = (v: unknown) => record(v) && Object.values(v).every((x) => typeof x === 'string' || (typeof x === 'number' && Number.isFinite(x)));
        const used = (f: unknown): f is { path: string; as: string; name?: string; inputs?: Record<string, string>; settings?: Record<string, string | number>; hash?: string } =>
          record(f) && Object.keys(f).every((k) => ['path', 'as', 'name', 'inputs', 'settings', 'hash'].includes(k)) && typeof f.path === 'string' && f.path !== '' && typeof f.as === 'string'
          && (f.name === undefined || (typeof f.name === 'string' && f.name !== '')) && (f.inputs === undefined || strings(f.inputs)) && (f.settings === undefined || values(f.settings)) && hash(f.hash);
        if (read.flows !== undefined && (!Array.isArray(read.flows) || read.flows.some((f) => !(typeof f === 'string' && f !== '') && !pinned(f) && !used(f)))) {
          fail(p, 'flows is a list of the flows this one reads, each by the path of its flow.json; or { path, hash } to read it only as the flow that hash names (a pin); or { path, as, inputs, settings } to use it under a name, with the dataset mapped onto each of its inputs and the settings it gives a value');
        }
        const entries = (read.flows as unknown[] | undefined) ?? [];
        const listed = entries.flatMap((f) => (typeof f === 'string' ? [{ path: joinPath(dir, f), hash: null as string | null }] : pinned(f) ? [{ path: joinPath(dir, f.path), hash: f.hash as string | null }] : []));
        const uses = entries.flatMap((f) => (typeof f !== 'string' && !pinned(f) && used(f)
          ? [{ path: joinPath(dir, f.path), spec: { as: f.as, ...(f.name !== undefined ? { name: f.name } : {}), inputs: f.inputs ?? {}, settings: f.settings ?? {} }, pin: f.hash ?? null }]
          : []));
        const { flows: _flows, ...own } = read;
        // What it imports: an estate's ontology is set aside until its steps are known; a starting file's joins its own.
        const seen = new Map<string, Promise<unknown>>();
        const json = (q: string): Promise<unknown> => {
          const at = joinPath(dir, q);
          if (!seen.has(at)) seen.set(at, files.json(at));
          return seen.get(at)!;
        };
        const estates: RawEstate[] = [];
        const o = (own as { ontology?: { import?: unknown } }).ontology;
        let mine = own as FlowDocument;
        if (o && Array.isArray(o.import) && o.import.every((q) => typeof q === 'string' && q !== '')) {
          const ofFiles: string[] = [];
          for (const q of o.import as string[]) {
            const value = await json(q);
            if (isEstate(value)) {
              const at = joinPath(dir, q);
              if (estates.some((e) => e.path === at)) fail(p, `${q} is imported twice`);
              estates.push({ path: at, estate: asEstate(value, at) });
            } else ofFiles.push(q);
          }
          if (estates.length) {
            const { import: _import, ...rest } = o as Record<string, unknown>;
            const ontology = { ...rest, ...(ofFiles.length ? { import: ofFiles } : {}) };
            // A flow that says nothing of its own but what it imports has no ontology until the estate's is taken.
            const { ontology: _o, ...bare } = own as Record<string, unknown>;
            mine = (Object.keys(ontology).length ? { ...bare, ontology: { objectTypes: [], linkTypes: [], actionTypes: [], ...ontology } } : bare) as unknown as FlowDocument;
          }
        }
        const imported = await importOntologies(mine, json);
        const doc = (await loadNotebooks(imported as FlowDocument & { notebooks?: NotebookRef[] }, (q) => files.text(joinPath(dir, q)))) as FlowDocument;
        return { path: p, dir, doc, reads: listed.map((f) => f.path), pins: new Map(listed.filter((f) => f.hash !== null).map((f) => [f.path, f.hash!] as const)), uses, estates };
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

  // Each flow asked for, with the own document of each flow it reads, by that flow's id: a flow read as it is as its
  // own folder gives it, a use as the used flow read under its name.
  const built = new Map<string, Promise<{ doc: FlowDocument; owns: Map<string, FlowDocument> }>>();
  const build = (p: string): Promise<{ doc: FlowDocument; owns: Map<string, FlowDocument> }> => {
    let got = built.get(p);
    if (!got) {
      got = (async () => {
        const root = await raw(p);
        const closure = (await order(p, [], [])).filter((q) => q !== p);
        const read = await Promise.all(closure.map((q) => raw(q)));
        // The uses (ADR 0026 §11): the flow's own, and those of each flow it reads, each the flow of the one that lists it.
        const listing = [...read, root].flatMap((by) => by.uses.map((u) => ({ by, ...u })));
        if (closure.length === 0 && listing.length === 0) {
          const expanded = root.doc.notebooks ? await expandNotebooks(root.doc, ts, options) : root.doc;
          const taken = await withEstates(p, expanded, root.estates, root.doc.ontology, []);
          return { doc: taken.notebooks ? syncRuleCells(taken) : taken, owns: new Map() };
        }
        const owns = new Map<string, FlowDocument>();
        const parts: Part[] = [];
        for (const r of read) {
          const own = (await build(r.path)).doc;
          // A flow with an open input is read where a dataset is mapped onto it (ADR 0026 §11).
          if (own.inputs?.length) fail(p, `${own.name} has ${own.inputs.length === 1 ? 'an open input' : 'open inputs'} (${own.inputs.map((x) => x.id).join(', ')}): use it under a name, as { path, as, inputs }, with a dataset mapped onto ${own.inputs.length === 1 ? 'it' : 'each'}`);
          owns.set(r.doc.id, own);
          parts.push({ raw: r, hash: await flowHash(own), use: null });
        }
        // A pin (ADR 0026 §7): the flow is read only as the flow the hash names. Any other is refused, both hashes said.
        for (const x of parts) {
          const pin = root.pins.get(x.raw.path);
          if (pin !== undefined && pin !== x.hash) fail(p, `${root.doc.name} pins ${x.raw.doc.name} at ${pin}, and ${x.raw.path} is ${x.hash} now: move the pin to read the flow as it is, or put the flow back as it was`);
        }
        for (const u of listing) {
          const def = await raw(u.path);
          // The flow used, as its own folder gives it, its inputs open: what the use is a use of, by its hash.
          const of = (await build(u.path)).doc;
          const ofHash = await flowHash(of);
          if (u.pin !== null && u.pin !== ofHash) fail(p, `${u.by.doc.name} pins ${def.doc.name} at ${u.pin}, and ${def.path} is ${ofHash} now: move the pin to read the flow as it is, or put the flow back as it was`);
          const problems = [...useProblems(of, u.spec), ...useOntologyProblems(def.doc.name, def.doc.ontology)];
          if (problems.length) fail(p, `${u.by.doc.name} uses ${def.doc.name} as ${u.spec.as}: ${problems[0]}`);
          if (parts.some((x) => x.use?.spec.as === u.spec.as)) fail(p, `two flows are used as ${u.spec.as}: a use has a name of its own`);
          const own = await useOf(of, u.spec, ofHash, ts, options);
          owns.set(u.spec.as, own);
          parts.push({ raw: def, hash: await flowHash(own), use: { spec: u.spec, by: u.by, own, of, pinned: u.pin !== null } });
        }
        const merged = merge(root, parts);
        const expanded = await expandNotebooks(merged.doc, ts, options);
        // Each flow's own steps: the cells of its own notebooks, a use's those of the notebooks read for it.
        const cells = expanded.cells ?? {};
        const stepsOf = (k: number) => expanded.steps.filter((s) => merged.notebooks[k]!.has(cells[s.id]?.notebook ?? '')).map((s) => s.id);
        const owner = new Map<string, string>();
        merged.doc.flows!.forEach((f, k) => {
          for (const id of [...f.sources, ...stepsOf(k)]) owner.set(id.toLowerCase(), f.id);
        });
        // A use reads the flows that give the datasets mapped onto its inputs, but the flow that lists it, whose own
        // datasets are its to map; and the flow that lists a use reads it.
        const flows = merged.doc.flows!.map((f, k): FlowPart => {
          const x = parts[k]!;
          const steps = stepsOf(k);
          if (!x.use) return { ...f, steps, reads: [...f.reads, ...parts.filter((y) => y.use?.by === x.raw).map((y) => y.use!.spec.as)] };
          const lister = x.use.by === root ? '' : x.use.by.doc.id;
          const from = [...new Set(Object.values(f.use!.inputs).map((i) => owner.get(i.to.toLowerCase()) ?? ''))].filter((id) => id !== '' && id !== lister && id !== f.id);
          return { ...f, steps, reads: from };
        });
        const ordered = inOrder(p, flows);
        // The estates' ontologies it imports, and those the flows it reads import, each once: what is about every dataset
        // here, with each flow's own handlings in place of what they override.
        const estates = [...new Map([...parts.flatMap((x) => x.raw.estates), ...root.estates].map((e) => [e.path, e] as const)).values()];
        const doc = syncRuleCells(await withEstates(p, { ...expanded, flows: ordered }, estates, root.doc.ontology, ordered));
        // What a use maps: datasets of the flow that takes it in, each with what the used flow needs of it.
        for (const f of ordered) {
          if (!f.use) continue;
          const problems = mapProblems(doc, f.name, f.use);
          if (problems.length) fail(p, problems[0]!);
        }
        // A flow that reads flows is checked as it is read: what it reads of each is that flow's to give.
        const issues = validateDocument(doc);
        if (issues.length > 0) throw new PlanError(`${p}: ${issues[0]!.path}: ${issues[0]!.message}`, issues);
        return { doc, owns };
      })();
      built.set(p, got);
    }
    return got;
  };
  const { doc, owns } = await build(path);
  return { doc, owns: (doc.flows ?? []).map((f) => owns.get(f.id)!) };
}

/** A flow read into another: as it is, or as a use of the flow at its path (ADR 0026 §11). */
interface Part {
  raw: Raw;
  /** Its own flow hash: for a use, its own document's. */
  hash: string;
  use: { spec: UseSpec; by: Raw; own: FlowDocument; of: FlowDocument; pinned: boolean } | null;
}

/** The flows in an order where each comes after the flows it reads, as they were listed otherwise. Two that read each
 * other (two uses mapped onto each other's datasets) are refused. */
function inOrder(at: string, flows: readonly FlowPart[]): FlowPart[] {
  const out: FlowPart[] = [];
  const state = new Map<string, 'open' | 'done'>();
  const byId = new Map(flows.map((f) => [f.id, f]));
  const visit = (f: FlowPart, trail: string[]): void => {
    if (state.get(f.id) === 'done') return;
    if (state.get(f.id) === 'open') fail(at, `the flows read each other in a circle: ${[...trail.slice(trail.indexOf(f.name)), f.name].join(' → ')}`);
    state.set(f.id, 'open');
    for (const r of f.reads) {
      const read = byId.get(r);
      if (read) visit(read, [...trail, f.name]);
    }
    state.set(f.id, 'done');
    out.push(f);
  };
  for (const f of flows) visit(f, []);
  return out;
}

/**
 * A flow's document with what it takes of the estates' ontologies it imports (ADR 0026 §8): each estate's parts that
 * are about the datasets here, before the flows' own, a flow's own handling of a column in place of what it overrides,
 * and where each estate was read from, with its hash. `own` is the flow's own ontology as its file gives it, and
 * `parts` the flows it reads: an override is of the flow's own datasets, checked here, where both are known. A thing
 * an estate says and a flow says again is refused, as two flows saying one thing are.
 */
async function withEstates(at: string, doc: FlowDocument, estates: readonly RawEstate[], own: Ontology | undefined, parts: readonly FlowPart[]): Promise<FlowDocument> {
  if (estates.length === 0) return doc;
  const lower = (x: string) => x.toLowerCase();
  const datasets = new Set([...doc.sources.map((x) => x.id), ...doc.steps.map((x) => x.id)].map(lower));
  const theirs = new Set(parts.flatMap((f) => [...f.sources, ...f.steps]).map(lower));
  const mine = new Set([...datasets].filter((d) => !theirs.has(d)));
  const problems = overrideProblems(estates.map((e) => e.estate), own, mine, doc.name);
  if (problems.length) fail(at, problems[0]!);
  const overridden = (doc.ontology?.properties ?? []).filter(isOverride).flatMap((p) => (p.datasets ?? []).map((d) => [p.column, d] as const));
  // A flow with no gate has nothing to judge the estate's written checks by, and takes none (ADR 0014, ADR 0015).
  const gated = Object.keys(doc.gates ?? {}).length > 0;
  const from: EstateFrom[] = [];
  for (const e of estates) from.push({ name: e.estate.name, path: pathFrom(dirOf(at), e.path), hash: await estateHash(e.estate) });
  const ontology = mergeOntologies(at, [
    ...estates.map((e) => ({ name: `${e.estate.name}’s ontology`, ontology: takeEstate(e.estate, datasets, overridden, gated) })),
    { name: doc.name, ontology: doc.ontology },
  ])!;
  return { ...doc, ontology: { ...ontology, estate: from } };
}

/**
 * A flow's document with the flows it reads merged in: their sources, notebooks, watches, contracts and ontology parts
 * before its own, each flow listed with what is its own. A use (ADR 0026 §11) brings the used flow's notebooks, read
 * for it, and what that flow's ontology and contracts say, of the use's datasets. With the document, each listed
 * flow's notebooks by the paths the document has them at: its steps are their cells, once they are read.
 */
function merge(root: Raw, parts: readonly Part[]): { doc: FlowDocument; notebooks: Set<string>[] } {
  const at = root.path;
  const name = (r: Raw) => r.doc.name;
  const plain = parts.filter((x) => !x.use);
  const used = parts.filter((x) => x.use);
  if (!root.doc.notebooks || parts.some((p) => !p.raw.doc.notebooks)) fail(at, 'a flow that reads flows, and each flow it reads, is a folder with notebooks (a flow.json and its .nb.ts files)');
  const all = [...plain.map((p) => p.raw), root];

  // Names are the estate's: an id is one flow's.
  const owner = new Map<string, Raw>();
  for (const r of all) {
    for (const s of r.doc.sources) {
      const had = owner.get(s.id.toLowerCase());
      if (had) fail(at, `${s.id} is a source of ${name(had)} and of ${name(r)}: a name is one thing across a flow and the flows it reads`);
      owner.set(s.id.toLowerCase(), r);
    }
  }
  const ids = new Map<string, string>();
  for (const [id, path] of [...all.map((r): [string, string] => [r.doc.id, r.path]), ...used.map((x): [string, string] => [x.use!.spec.as, `${x.raw.path} as ${x.use!.spec.as}`])]) {
    const had = ids.get(id);
    if (had) fail(at, `${had} and ${path} are both called ${id}: each flow has its own id`);
    ids.set(id, path);
  }

  // One day: the same parameters, by name and type; the reading flow's defaults.
  const every = [root, ...plain.map((p) => p.raw), ...new Set(used.map((x) => x.raw))];
  const parameters: ParameterDef[] = [];
  for (const r of every) {
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
  for (const r of [...all, ...new Set(used.map((x) => x.raw))]) {
    if (!same(r.doc.calendar, root.doc.calendar)) fail(at, `${name(r)} keeps another calendar than ${name(root)}: a flow and the flows it reads keep one`);
    if (r.doc.publish && root.doc.publish && !same(settings(r.doc.publish), settings(root.doc.publish))) {
      const mine = settings(root.doc.publish) as Record<string, unknown>;
      const theirs = settings(r.doc.publish) as Record<string, unknown>;
      const differ = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].filter((k) => !same(mine[k], theirs[k]));
      fail(at, `${name(r)} pauses another way than ${name(root)} (publish.${differ.join(', publish.')}): a flow and the flows it reads pause one way`);
    }
    if (r.doc.publish && !root.doc.publish) fail(at, `${name(r)} says what pauses it (a publish block) and ${name(root)} doesn't: the flow that reads it says the same`);
    if (r.doc.policies && r !== root && !same(r.doc.policies, root.doc.policies)) fail(at, `${name(r)} has policies of its own: inside another flow the reading flow's apply, so it has none, or the same`);
    if (all.includes(r)) for (const [id, w] of Object.entries(r.doc.publish?.watch ?? {})) watch[id] = w;
  }
  if (publish) publish = { ...publish, ...(Object.keys(watch).length ? { watch } : {}) };

  const contracts: NonNullable<FlowDocument['contracts']> = {};
  for (const [who, given] of [...all.map((r): [string, FlowDocument['contracts']] => [name(r), r.doc.contracts]), ...used.map((x): [string, FlowDocument['contracts']] => [x.use!.own.name, x.use!.own.contracts])]) {
    for (const [id, c] of Object.entries(given ?? {})) {
      if (contracts[id]) fail(at, `${id} has a contract in two flows (the second is ${who})`);
      contracts[id] = c;
    }
  }
  const changes = all.flatMap((r) => r.doc.changes ?? []);
  const twice = changes.find((c, i) => changes.findIndex((x) => x.id === c.id) !== i);
  if (twice) fail(at, `two change sets are called ${twice.id}`);

  const rebase = (r: Raw, n: NotebookDef): NotebookDef => ({ ...n, path: pathFrom(root.dir, joinPath(r.dir, n.path)) });
  const ontology = mergeOntologies(at, [
    ...plain.map((x) => ({ name: name(x.raw), ontology: x.raw.doc.ontology })),
    // What a used flow's own ontology says, of the use's datasets: before an estate's is taken, as every flow's is.
    ...used.map((x) => ({ name: x.use!.own.name, ontology: renameOntology(x.raw.doc.ontology, useNames(x.use!.of, x.use!.spec.as)) })),
    { name: name(root), ontology: root.doc.ontology },
  ]);
  // The flows that pin a flow (ADR 0026 §7), by id, the reading document's own flow by '': it is read only as it is.
  const pinners = (r: Raw): { pin?: string[] } => {
    const by = [...plain.filter((x) => x.raw.pins.has(r.path)).map((x) => x.raw.doc.id), ...(root.pins.has(r.path) ? [''] : [])];
    return by.length ? { pin: by } : {};
  };
  const flows = parts.map((x): FlowPart => {
    const r = x.raw;
    if (x.use) {
      const own = x.use.own;
      return {
        path: pathFrom(root.dir, r.path),
        id: x.use.spec.as,
        name: own.name,
        ...(own.description ? { description: own.description } : {}),
        hash: x.hash,
        sources: [],
        steps: [],
        reads: [],
        direct: x.use.by === root,
        ...(x.use.pinned ? { pin: [x.use.by === root ? '' : x.use.by.doc.id] } : {}),
        use: own.use!,
      };
    }
    return {
      path: pathFrom(root.dir, r.path),
      id: r.doc.id,
      name: r.doc.name,
      ...(r.doc.description ? { description: r.doc.description } : {}),
      hash: x.hash,
      sources: r.doc.sources.map((s) => s.id),
      steps: [],
      reads: r.reads.map((q) => plain.find((y) => y.raw.path === q)!.raw.doc.id),
      direct: root.reads.includes(r.path),
      ...pinners(r),
    };
  });
  // Each listed flow's notebooks, by the paths the document has them at.
  const listed = parts.map((x) => (x.use ? x.use.own.notebooks ?? [] : x.raw.doc.notebooks ?? []).map((n) => rebase(x.raw, n)));
  const { parameters: _p, sources: _s, notebooks: _n, ontology: _o, contracts: _c, publish: _pub, changes: _ch, flows: _f, ...rest } = root.doc;
  const doc: FlowDocument = {
    ...rest,
    ...(parameters.length ? { parameters } : {}),
    sources: all.flatMap((r) => r.doc.sources),
    steps: [],
    notebooks: [...listed.flat(), ...(root.doc.notebooks ?? [])],
    ...(ontology ? { ontology } : {}),
    ...(Object.keys(contracts).length ? { contracts } : {}),
    ...(publish ? { publish } : {}),
    ...(changes.length ? { changes } : {}),
    flows,
  };
  return { doc, notebooks: listed.map((ns) => new Set(ns.map((n) => n.path))) };
}

/** The flows' ontologies as one: each list after the other, a thing said twice refused (a meaning is said in one place). */
function mergeOntologies(at: string, given: readonly { name: string; ontology: Ontology | undefined }[]): Ontology | undefined {
  const has = given.filter((g): g is { name: string; ontology: Ontology } => g.ontology !== undefined);
  if (has.length === 0) return undefined;
  if (has.length === 1) return has[0]!.ontology;
  const out: Ontology = { objectTypes: [], linkTypes: [], actionTypes: [] };
  const lists = ['objectTypes', 'linkTypes', 'actionTypes', 'properties', 'references', 'rows', 'needs', 'rules', 'shared', 'awaited'] as const;
  const maps = ['nouns', 'fixes', 'aside', 'overwhelming'] as const;
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
    awaited: (x: { id: string }) => x.id.toLowerCase(),
  } as never;
  const what: Record<string, string> = { objectTypes: 'object type', linkTypes: 'link', actionTypes: 'action', properties: 'column', references: 'reference', rows: 'rows entry', needs: 'dependency', rules: 'rule', shared: 'shared ontology', awaited: 'dataset described ahead' };
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
 * Whether a document holds a flow it says it reads, unchanged (ADR 0026 §2): every source and step of the flow's own
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
