/**
 * A starting file's ontology, shared by every flow that reads the file (Q-148, the maintainer: "changes live in one
 * place and can update multiple different flows"). It says what the file's columns mean and the rules its rows are held
 * to, once, in its own document (`smaltfl-ontology/1`, `examples/ontologies/<file>.json`); a flow lists it under
 * `ontology.import`, and reading the flow (`readFlow`, scripts/flow.ts) brings it in: its columns' meanings and its
 * rules join the flow's ontology, the check cell that enforces the file lists its rules (`syncRuleCells`), and the flow
 * keeps where each came from (`ontology.shared`). Change the shared file, and every flow that imports it has the change
 * the next time it is read; the cells follow on their own (a rule a cell doesn't list is on), and `npm run rules:sync`
 * writes them on disk.
 *
 * The flow document a run hashes is the one read, with the shared file's content in it: a change to the shared file is
 * a change to every flow that imports it, recorded as such. Pure: the caller reads the files.
 */
import type { FlowDocument } from './document.js';
import { hashOf } from './hash.js';
import type { ActionType, LinkType, NeedsDef, Noun, ObjectType, Ontology, PropertyType, Reference, RowsDef } from './ontology.js';
import type { FixKind, OntologyRule } from './rules.js';

/** A rule as a shared file keeps it: its file is the shared file's. */
export type SharedRule = Omit<OntologyRule, 'file'>;

/** A starting file's ontology, in a document of its own. */
export interface SharedOntology {
  smaltflOntology: 1;
  /** The source it is about, as every flow that imports it names it. */
  file: string;
  /** What the file is: a flow whose source says nothing takes it. */
  description?: string;
  /** What a row of the file is called. */
  noun?: Noun;
  /** What its columns mean (a flow's steps that pass a column on read the same meaning). */
  properties?: PropertyType[];
  /** The rules its rows are held to. */
  rules?: SharedRule[];
  /** The fixes a held day of it may be offered (rules.ts `FIX_KINDS`); left out, every one. */
  fixes?: FixKind[];
}

/** Where a flow's shared parts came from, as the flow keeps it: the file it is about, the path it was read from, and
 * the columns whose meanings it gave (so what the flow edits can be written back to it). */
export interface SharedFrom {
  file: string;
  path: string;
  columns: string[];
}

export class SharedOntologyError extends Error {}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const lower = (x: string) => x.toLowerCase();

/** A shared ontology as read, checked for its shape (what each part says is validateDocument's, once merged). */
export function asShared(value: unknown, path: string): SharedOntology {
  if (!isRecord(value) || value.smaltflOntology !== 1) throw new SharedOntologyError(`${path} isn't a shared ontology ({ "smaltflOntology": 1, "file", … })`);
  if (typeof value.file !== 'string' || value.file === '') throw new SharedOntologyError(`${path} names no file: the source it is about`);
  const known = ['smaltflOntology', 'file', 'description', 'noun', 'properties', 'rules', 'fixes'];
  for (const k of Object.keys(value)) if (!known.includes(k)) throw new SharedOntologyError(`${path}: ${k} isn't a shared ontology's part (${known.join(', ')})`);
  if (value.properties !== undefined && !Array.isArray(value.properties)) throw new SharedOntologyError(`${path}: properties is a list`);
  if (value.rules !== undefined && !Array.isArray(value.rules)) throw new SharedOntologyError(`${path}: rules is a list`);
  if (Array.isArray(value.rules) && value.rules.some((r) => isRecord(r) && 'file' in r)) throw new SharedOntologyError(`${path}: a shared rule's file is the shared file's (${value.file}): it names none`);
  return value as unknown as SharedOntology;
}

/**
 * A flow with the ontologies it imports brought in, each read by `read` from the path the flow gives (relative to the
 * flow; the caller resolves it). The shared parts come first: a column's meaning, then the flow's own; the shared rules,
 * then the flow's own; the file's noun and description where the flow says none. A flow that describes the same column
 * again, or names a rule as a shared one is named, is refused by validateDocument, so a meaning is said in one place.
 * A flow that imports nothing is returned as it is.
 */
export async function importOntologies(doc: FlowDocument, read: (path: string) => Promise<unknown>): Promise<FlowDocument> {
  const o = doc.ontology as (Ontology & { import?: unknown }) | undefined;
  if (!o || o.import === undefined) return doc;
  if (!Array.isArray(o.import) || o.import.some((p) => typeof p !== 'string' || p === '')) throw new SharedOntologyError('ontology.import is a list of paths to shared ontologies, relative to the flow');
  const { import: paths, ...own } = o;
  const shared: SharedFrom[] = [];
  const properties: PropertyType[] = [];
  const rules: OntologyRule[] = [];
  const nouns: Record<string, Noun> = {};
  const fixes: Record<string, FixKind[]> = {};
  let sources = doc.sources;
  for (const path of paths as string[]) {
    const s = asShared(await read(path), path);
    const src = doc.sources.find((x) => lower(x.id) === lower(s.file));
    if (!src) throw new SharedOntologyError(`${path} is about ${s.file}, which this flow doesn't read`);
    if (shared.some((x) => lower(x.file) === lower(s.file))) throw new SharedOntologyError(`two shared ontologies are about ${s.file}: a file's meanings and rules are in one place`);
    shared.push({ file: src.id, path, columns: (s.properties ?? []).map((p) => p.column) });
    properties.push(...(s.properties ?? []));
    rules.push(...(s.rules ?? []).map((r) => ({ ...r, file: src.id }) as OntologyRule));
    if (s.noun) nouns[src.id] = s.noun;
    if (s.fixes) fixes[src.id] = [...s.fixes];
    if (s.description && !src.description) sources = sources.map((x) => (x === src ? { ...x, description: s.description! } : x));
  }
  const ontology: Ontology = {
    ...own,
    ...(properties.length || own.properties ? { properties: [...properties, ...(own.properties ?? [])] } : {}),
    ...(rules.length || own.rules ? { rules: [...rules, ...(own.rules ?? [])] } : {}),
    ...(Object.keys(nouns).length || own.nouns ? { nouns: { ...nouns, ...(own.nouns ?? {}) } } : {}),
    ...(Object.keys(fixes).length || own.fixes ? { fixes: { ...fixes, ...(own.fixes ?? {}) } } : {}),
    shared,
  };
  return { ...doc, sources, ontology };
}

/**
 * A file's shared ontology as the flow on screen has it now, for writing back to its shared file: the rules of the file
 * and the meanings the shared file gave (by column), as edited here, and the file's noun and description. What a flow
 * changes reaches the other flows that import the file only once this replaces the shared file.
 */
export function sharedOf(doc: Pick<FlowDocument, 'sources' | 'ontology'>, file: string): SharedOntology {
  const o = doc.ontology;
  const src = doc.sources.find((x) => lower(x.id) === lower(file));
  const from = o?.shared?.find((x) => lower(x.file) === lower(file));
  const columns = new Set((from?.columns ?? []).map(lower));
  // The file's own meanings: the shared file's columns, and a meaning the flow gave this file alone.
  const properties = (o?.properties ?? []).filter((p) => columns.has(lower(p.column)) || (p.datasets?.length === 1 && lower(p.datasets[0]!) === lower(file)));
  const rules = (o?.rules ?? []).filter((r) => lower(r.file) === lower(file)).map(({ file: _f, ...r }) => r);
  const noun = o?.nouns?.[src?.id ?? file];
  const fixes = Object.entries(o?.fixes ?? {}).find(([f]) => lower(f) === lower(file))?.[1];
  return {
    smaltflOntology: 1,
    file: src?.id ?? file,
    ...(src?.description ? { description: src.description } : {}),
    ...(noun ? { noun } : {}),
    ...(properties.length ? { properties } : {}),
    ...(rules.length ? { rules } : {}),
    ...(fixes ? { fixes: [...fixes] } : {}),
  };
}

// ------------------------------------------------------------------ an estate's ontology (ADR 0026 §8)

/**
 * An estate's ontology, in a document of its own (ADR 0026 §8, Q-234: "ontology should own that"): its object types and
 * links, what each dataset's rows are, its dependencies, and what its columns mean, with their values and bands. Every
 * flow of the estate imports it (`ontology.import`), and reading a flow takes from it what is about the datasets the
 * flow has or reads (`takeEstate`). It travels under a hash of its own (`estateHash`), the same in every flow.
 */
export interface EstateOntology {
  smaltflOntology: 2;
  /** What the estate is called: "Larkspur estate". Named where a flow says a thing the estate already says. */
  name: string;
  description?: string;
  objectTypes?: ObjectType[];
  linkTypes?: LinkType[];
  actionTypes?: ActionType[];
  properties?: PropertyType[];
  references?: Reference[];
  nouns?: Record<string, Noun>;
  rows?: RowsDef[];
  needs?: NeedsDef[];
  overwhelming?: Record<string, number>;
}

/** Where a flow's estate parts came from, as the flow keeps it: the estate's name, the path the flow gives it by, and
 * its hash (`estate/0`), the same in every flow that imports it. */
export interface EstateFrom {
  name: string;
  path: string;
  hash: string;
}

const ESTATE_PARTS = ['smaltflOntology', 'name', 'description', 'objectTypes', 'linkTypes', 'actionTypes', 'properties', 'references', 'nouns', 'rows', 'needs', 'overwhelming'] as const;

/** Whether a document read from an `ontology.import` path is an estate's ontology (and not one starting file's). */
export const isEstate = (value: unknown): boolean => isRecord(value) && value.smaltflOntology === 2;

/** An estate's ontology as read, checked for its shape (what each part says is validateDocument's, once taken). */
export function asEstate(value: unknown, path: string): EstateOntology {
  if (!isRecord(value) || value.smaltflOntology !== 2) throw new SharedOntologyError(`${path} isn't an estate's ontology ({ "smaltflOntology": 2, "name", … })`);
  if (typeof value.name !== 'string' || value.name === '') throw new SharedOntologyError(`${path} has no name: what the estate is called`);
  for (const k of Object.keys(value)) if (!(ESTATE_PARTS as readonly string[]).includes(k)) throw new SharedOntologyError(`${path}: ${k} isn't an estate ontology's part (${ESTATE_PARTS.join(', ')})`);
  for (const k of ['objectTypes', 'linkTypes', 'actionTypes', 'properties', 'references', 'rows', 'needs'] as const) if (value[k] !== undefined && !Array.isArray(value[k])) throw new SharedOntologyError(`${path}: ${k} is a list`);
  for (const k of ['nouns', 'overwhelming'] as const) if (value[k] !== undefined && !isRecord(value[k])) throw new SharedOntologyError(`${path}: ${k} is a map, by dataset`);
  if (Array.isArray(value.properties) && value.properties.some((p) => isRecord(p) && 'override' in p)) throw new SharedOntologyError(`${path}: an override is a flow's, of what the estate says: the estate's ontology has none`);
  return value as unknown as EstateOntology;
}

/** An estate's ontology by its content (`estate/0`): the document as read, canonical. The same in every flow that
 * imports it, so two flows read the same estate where their hashes of it agree. */
export const estateHash = (estate: EstateOntology): Promise<string> => hashOf('estate/0', estate);

/** A property a flow marks as its own handling of a column the estate describes (ADR 0026 §8). */
export const isOverride = (p: PropertyType): boolean => p.override !== undefined;

/**
 * What an estate's ontology says of a column in a dataset (ADR 0026 §8), and the estate whose it is: its entry that
 * names the dataset, else the one for every dataset, as `propertyOf` reads a flow's; the first estate that says it.
 * Nothing where no estate describes the column there: a flow that describes it then overrides nothing.
 */
export function estateSays(estates: readonly EstateOntology[], dataset: string, column: string): { estate: EstateOntology; property: PropertyType } | undefined {
  for (const estate of estates) {
    const named = (estate.properties ?? []).filter((p) => lower(p.column) === lower(column));
    const property = named.find((p) => p.datasets?.some((d) => lower(d) === lower(dataset))) ?? named.find((p) => p.datasets === undefined);
    if (property) return { estate, property };
  }
  return undefined;
}

/**
 * What a flow takes of an estate's ontology (ADR 0026 §8): what is about the datasets it has or reads, by id, without
 * case. A type whose list is here; a rows entry of a dataset here whose type is; a link between two types here; a
 * dependency, trimmed to the datasets here; a noun; a column's meaning, whole where it is for every dataset, else
 * trimmed to the datasets here (its bands and its lookup with it). `overridden` are the flow's own handlings, as
 * `[column, dataset]`: the estate's meaning for a dataset named there steps aside for it. What a rows entry, a
 * dependency, a band and a due mark say are a gate's written checks (ADR 0014, ADR 0015): a flow with no gate
 * (`gated` false) has nothing to judge by them, and takes none. Pure.
 */
export function takeEstate(estate: EstateOntology, datasets: ReadonlySet<string>, overridden: readonly (readonly [column: string, dataset: string])[] = [], gated = true): Ontology {
  const here = (d: string) => datasets.has(lower(d));
  const objectTypes = (estate.objectTypes ?? []).filter((t) => here(t.dataset));
  const types = new Set(objectTypes.map((t) => t.id));
  const over = new Set(overridden.map(([c, d]) => `${lower(c)}|${lower(d)}`));
  const properties: PropertyType[] = [];
  for (const p of estate.properties ?? []) {
    let taken: PropertyType = p;
    if (p.datasets) {
      const kept = p.datasets.filter((d) => here(d) && !over.has(`${lower(p.column)}|${lower(d)}`));
      if (kept.length === 0) continue;
      if (kept.length !== p.datasets.length) taken = { ...taken, datasets: kept };
    }
    if (!gated && (taken.expect !== undefined || taken.due !== undefined)) {
      const { expect: _expect, due: _due, ...rest } = taken;
      taken = rest;
    }
    if (taken.expect?.some((b) => b.datasets && !b.datasets.every(here))) {
      const expect = taken.expect.flatMap((b) => {
        if (!b.datasets) return [b];
        const kept = b.datasets.filter(here);
        return kept.length ? [{ ...b, datasets: kept }] : [];
      });
      const { expect: _all, ...rest } = taken;
      taken = expect.length ? { ...rest, expect } : rest;
    }
    if (taken.lookup && !here(taken.lookup.dataset)) {
      const { lookup: _lookup, ...rest } = taken;
      taken = rest;
    }
    properties.push(taken);
  }
  const cited = new Set(properties.flatMap((p) => p.sources ?? []));
  const references = (estate.references ?? []).filter((r) => cited.has(r.id));
  const rows = gated ? (estate.rows ?? []).filter((r) => here(r.dataset) && types.has(r.of)) : [];
  const needs = (gated ? (estate.needs ?? []) : []).flatMap((n) => {
    const kept = n.datasets.filter(here);
    return kept.length && (n.from === undefined || here(n.from)) ? [kept.length === n.datasets.length ? n : { ...n, datasets: kept }] : [];
  });
  const byDataset = <V>(map: Record<string, V> | undefined): Record<string, V> => Object.fromEntries(Object.entries(map ?? {}).filter(([d]) => here(d)));
  const nouns = byDataset(estate.nouns);
  const overwhelming = byDataset(estate.overwhelming);
  return {
    objectTypes,
    linkTypes: (estate.linkTypes ?? []).filter((l) => types.has(l.from) && types.has(l.to)),
    actionTypes: (estate.actionTypes ?? []).filter((a) => types.has(a.on)),
    ...(properties.length ? { properties } : {}),
    ...(references.length ? { references } : {}),
    ...(Object.keys(nouns).length ? { nouns } : {}),
    ...(rows.length ? { rows } : {}),
    ...(needs.length ? { needs } : {}),
    ...(Object.keys(overwhelming).length ? { overwhelming } : {}),
  };
}

/**
 * What stands in the way of a flow's own ontology beside the estates' it imports (ADR 0026 §8), each as a sentence: a
 * column an estate describes said again without the mark (an accident is not an override); an override with no reason,
 * of no dataset, of a dataset that isn't the flow's own, or of a column no estate describes. `mine` are the flow's own
 * sources and steps (not those of the flows it reads). None, and the flow's ontology sits with the estates'.
 */
export function overrideProblems(estates: readonly EstateOntology[], own: Ontology | undefined, mine: ReadonlySet<string>, flow: string): string[] {
  const out: string[] = [];
  /** The estate that describes a column: for every dataset, or for the one asked of. */
  const saidBy = (column: string, dataset: string | null): EstateOntology | undefined =>
    estates.find((e) => (e.properties ?? []).some((p) => lower(p.column) === lower(column) && (p.datasets === undefined || (dataset !== null && p.datasets.some((d) => lower(d) === lower(dataset))))));
  const anywhere = (column: string): EstateOntology | undefined => estates.find((e) => (e.properties ?? []).some((p) => lower(p.column) === lower(column)));
  for (const p of own?.properties ?? []) {
    const where = (d: string | null) => `${p.column}${d ? ` on ${d}` : ''}`;
    if (p.override === undefined) {
      // For every dataset: it clashes with the estate's saying the column at all. For some: with what it says of them.
      const at = p.datasets === undefined ? null : (p.datasets.find((d) => saidBy(p.column, d)) ?? undefined);
      const by = p.datasets === undefined ? anywhere(p.column) : at !== undefined ? saidBy(p.column, at) : undefined;
      if (by) out.push(`${flow} describes ${where(at ?? null)}, which ${by.name}’s ontology describes: an override says so, with its reason ("override": { "reason": … }), or the flow leaves it to the estate`);
      continue;
    }
    if (!isRecord(p.override) || typeof p.override.reason !== 'string' || p.override.reason.trim() === '') out.push(`${flow}’s override of ${p.column} has no reason: why this flow handles the column its own way`);
    if (!p.datasets?.length) out.push(`${flow}’s override of ${p.column} names no dataset: a flow overrides a column for its own datasets`);
    for (const d of p.datasets ?? []) {
      if (!mine.has(lower(d))) out.push(`${flow}’s override of ${where(d)} is of a dataset that isn’t its own: a flow overrides a column for its own datasets`);
      else if (!saidBy(p.column, d)) out.push(`${flow}’s override of ${where(d)} overrides nothing: no estate’s ontology it imports describes it`);
    }
  }
  return out;
}
