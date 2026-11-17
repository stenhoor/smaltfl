/**
 * Edits to the flow made in the app, as pure functions of the document (ADR 0015 §4 and amendment 1): a file's own
 * name for a column, the column's meaning there and the labels of its values (`nameColumn`); an accepted band
 * (`applyBand`, ADR 0014 §3); what the page keeps of an edited document across a reload and when it drops it
 * (`keptOf`, `restoreKept`); and the flow as shipped again, with its arrangement left as it is (`asShipped`).
 *
 * Every edit moves the flow hash (the whole ontology is in it) and is recorded as a flow change with its reason in
 * words, which these functions give. A name or a label is for people: `nameColumn` writes the file's own property
 * (`propertyOf` scopes by dataset, Q-140) with every mark of the one it stood under, so what the plan carries for the
 * file (`marksOn`) and what any other file is called and judged by stay as they were. The file's own column name is
 * never changed: the data is untouched.
 */
import { canonicalJSON } from './canonical.js';
import { validateDocument, type FlowDocument, type StepDef } from './document.js';
import { propertyOf, saysMore, type Ontology, type PropertyType } from './ontology.js';
import { syncRuleCells, writeRuleSwitches } from './gatecell.js';
import { ACTION_SAID, checkStepOf, newRuleId, ruleOn, ruleSaid, switchesFor, type OntologyRule } from './rules.js';

const lower = (x: string) => x.toLowerCase();

/** What someone changed on a column's card: any of its display name, its meaning, and labels for its values. */
export interface ColumnChange {
  /** What people call the column in this file. Left empty, it is called as the file writes it. */
  title?: string;
  /** What it holds, in words. */
  description?: string;
  /** A label for a value, by the value as the file writes it. Left empty, the value has no label of its own. */
  values?: Record<string, string>;
  /** Why the flow handles the column its own way here (ADR 0025 §8), where an estate's ontology describes it: the
   * file's own entry is then the flow's override, marked as one with this reason. Left out, or empty, no mark is made. */
  override?: string;
}

/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * A column of a file renamed, its meaning reworded or its values labelled, as that file's own (Q-140): the document
 * with the file's own property for the column, and the change in words for the record ("Renamed status to Result in
 * tls"). `said` is null, and the document the one passed, when nothing changed.
 *
 * The file's own property: the one that names only this file, edited in place; else a new one for this file alone,
 * copied from the one it stood under (the flow's dictionary, or one shared with other files, which then stops naming
 * this file), with its unit, note, lookup and marks, and only the bands that apply to this file. A column the
 * ontology doesn't describe gets its first entry. A label taken away leaves a value the ontology lists with the
 * value itself for a label (the list of values stays what it was, and a label that only repeats the value is shown
 * nowhere, `saysMore`), and an unlisted one as it was; an empty label for a value whose label already says no more
 * than the value ("Yes" for yes) is no change.
 *
 * Where an estate's ontology describes the column (ADR 0025 §8), the caller gives the flow's reason (`change.override`):
 * the file's own entry is marked as the flow's override with it, and the record says so. A reason alone, reworded on an
 * entry that is an override already, is a change of its own.
 */
export function nameColumn(doc: FlowDocument, file: string, column: string, change: ColumnChange): { doc: FlowDocument; said: string | null } {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  const props = o.properties ?? [];
  const was = propertyOf(o, file, column);
  const done: string[] = [];
  const next: { title?: string; description?: string; values?: Record<string, string>; override?: { reason: string } } = {};
  if (change.title !== undefined) {
    const title = change.title.trim() || column;
    if (title !== (was?.title ?? column)) {
      next.title = title;
      done.push(`renamed ${column} to ${title}`);
    }
  }
  if (change.description !== undefined) {
    const description = change.description.trim();
    if (description !== (was?.description ?? '')) {
      next.description = description;
      done.push(`reworded what ${column} means`);
    }
  }
  const values = { ...(was?.values ?? {}) };
  let labelled = false;
  for (const [value, text] of Object.entries(change.values ?? {})) {
    const label = text.trim();
    const had = Object.prototype.hasOwnProperty.call(values, value) ? values[value]! : undefined;
    // Left empty where the value has no label that says more than itself ("Yes" for yes): nothing to take away.
    if (label === (had ?? '') || (label === '' && !saysMore(had, value))) continue;
    values[value] = label || value;
    labelled = true;
    done.push(label ? `labelled ${column}’s ${value} as ${label}` : `took the label off ${column}’s ${value}`);
  }
  if (labelled) next.values = values;
  const own = (p: PropertyType) => p.datasets?.length === 1 && lower(p.datasets[0]!) === lower(file);
  // The flow's own handling of a column an estate describes: marked with its reason. The reason reworded on an entry
  // that is an override already is a change by itself; a new mark comes with whatever else changed. A column nothing
  // describes yet overrides nothing, and takes no mark.
  const why = was ? change.override?.trim() || undefined : undefined;
  const marked = why !== undefined && was?.override?.reason !== why;
  if (marked && was?.override) done.push(`reworded why ${column} is handled its own way`);
  if (!done.length) return { doc, said: null };
  if (marked) next.override = { reason: why };
  const sentence = listed(done);
  const said = `${sentence[0]!.toUpperCase()}${sentence.slice(1)} in ${file}${marked ? (was?.override ? `: ${why}` : `, its own way: ${why}`) : ''}`;

  let properties: PropertyType[];
  if (was && own(was)) properties = props.map((p) => (p === was ? { ...p, ...next } : p));
  else if (was) {
    // The bands that apply to this file come along; one for other files only says nothing here.
    const bands = was.expect?.filter((b) => !b.datasets || b.datasets.some((d) => lower(d) === lower(file)));
    const { expect: _expect, ...rest } = was;
    const mine: PropertyType = { ...rest, ...(bands?.length ? { expect: bands } : {}), ...next, datasets: [file] };
    // A property shared by several named files stops naming this one; the flow's dictionary stands as it was.
    const left = (p: PropertyType): PropertyType => (p.datasets ? { ...p, datasets: p.datasets.filter((d) => lower(d) !== lower(file)) } : p);
    properties = props.flatMap((p) => (p === was ? [left(p), mine] : [p]));
  } else properties = [...props, { column, title: next.title ?? column, description: next.description ?? '', ...(next.values ? { values: next.values } : {}), datasets: [file] }];
  return { doc: { ...doc, ontology: { ...o, properties } }, said };
}

/**
 * A column named in a file and carried through the datasets that pass it on under its name (ADR 0022 §2, Q-146): the
 * same change made each one's own, as `nameColumn` makes it, so a step's output reads as the file's column does. Said
 * once, with where it went: "Renamed status to Result in tls, carried to tls_checked". `through` is where the column
 * goes on (`columnUses`'s `carried` after the file); a dataset that already reads so is passed over. A reason for the
 * flow's own handling (`change.override`, ADR 0025 §8) marks each dataset where an estate describes the column
 * (`described`; every one, where it isn't given).
 */
export function nameColumnThrough(doc: FlowDocument, file: string, column: string, change: ColumnChange, through: readonly string[], described: (dataset: string) => boolean = () => true): { doc: FlowDocument; said: string | null } {
  // The flow's reason marks an override only in a dataset where an estate describes the column (`described`).
  const forDataset = (dataset: string): ColumnChange => {
    if (change.override === undefined || described(dataset)) return change;
    const { override: _override, ...rest } = change;
    return rest;
  };
  const first = nameColumn(doc, file, column, forDataset(file));
  if (!first.said) return first;
  let out = first.doc;
  const carried: string[] = [];
  for (const dataset of through) {
    if (lower(dataset) === lower(file)) continue;
    const r = nameColumn(out, dataset, column, forDataset(dataset));
    if (!r.said) continue;
    out = r.doc;
    carried.push(dataset);
  }
  return { doc: out, said: carried.length ? `${first.said}, carried to ${listed(carried)}` : first.said };
}

/**
 * A file's column read by the name the file gives it now (ADR 0022 §2, Q-146, Q-206): its own property's `fromFile`, so
 * the source's table declares that name and the run reads it as `column`. Made the file's own as `nameColumn` makes it
 * (a property shared with other files stops naming this one); `from` null reads it by its own name again. A dated change
 * set carries it, from the day the file first named it so.
 */
export function mapColumn(doc: FlowDocument, file: string, column: string, from: string | null): { doc: FlowDocument; said: string | null } {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  const props = o.properties ?? [];
  const was = propertyOf(o, file, column);
  const own = (p: PropertyType) => p.datasets?.length === 1 && lower(p.datasets[0]!) === lower(file);
  const had = was && own(was) ? (was.fromFile ?? null) : null;
  const next = from === null || from.trim() === '' ? null : from.trim();
  if (next === had || (next !== null && lower(next) === lower(column))) return { doc, said: null };
  const said = next === null ? `Read ${column} in ${file} by its own name again` : `Read ${file}’s ${next} as ${column}`;
  const set = (p: PropertyType): PropertyType => {
    if (next !== null) return { ...p, fromFile: next };
    const { fromFile: _fromFile, ...rest } = p;
    return rest;
  };
  let properties: PropertyType[];
  if (was && own(was)) properties = props.map((p) => (p === was ? set(p) : p));
  else if (was) {
    const bands = was.expect?.filter((b) => !b.datasets || b.datasets.some((d) => lower(d) === lower(file)));
    const { expect: _expect, ...rest } = was;
    const mine = set({ ...rest, ...(bands?.length ? { expect: bands } : {}), datasets: [file] });
    const left = (p: PropertyType): PropertyType => (p.datasets ? { ...p, datasets: p.datasets.filter((d) => lower(d) !== lower(file)) } : p);
    properties = props.flatMap((p) => (p === was ? [left(p), mine] : [p]));
  } else if (next === null) return { doc, said: null };
  else properties = [...props, { column, title: column, description: '', fromFile: next, datasets: [file] }];
  return { doc: { ...doc, ontology: { ...o, properties } }, said };
}

/**
 * A coded column's values declared from the data (ADR 0022 §5, Q-139, Q-214): the file's own property for the column
 * lists each code, meaning itself until someone words it (a code already worded keeps its words). The column is counted
 * where the flow's history is built from then on (measures.ts `watchColumns`): its shares, its pairs and the forest.
 * Made the file's own as `nameColumn` makes it. Null `said` where every code is listed already.
 */
export function declareValues(doc: FlowDocument, file: string, column: string, codes: readonly string[]): { doc: FlowDocument; said: string | null } {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  const props = o.properties ?? [];
  const was = propertyOf(o, file, column);
  const values: Record<string, string> = { ...(was?.values ?? {}) };
  const added = [...new Set(codes)].filter((c) => !Object.prototype.hasOwnProperty.call(values, c));
  if (!added.length) return { doc, said: null };
  for (const c of added) values[c] = c;
  const said = `Listed ${column}’s ${added.length === 1 ? 'value' : `${added.length} values`} in ${file}: ${added.slice(0, 6).join(', ')}${added.length > 6 ? `, and ${added.length - 6} more` : ''}`;
  const own = (p: PropertyType) => p.datasets?.length === 1 && lower(p.datasets[0]!) === lower(file);
  let properties: PropertyType[];
  if (was && own(was)) properties = props.map((p) => (p === was ? { ...p, values } : p));
  else if (was) {
    const bands = was.expect?.filter((b) => !b.datasets || b.datasets.some((d) => lower(d) === lower(file)));
    const { expect: _expect, ...rest } = was;
    const mine: PropertyType = { ...rest, ...(bands?.length ? { expect: bands } : {}), values, datasets: [file] };
    const left = (p: PropertyType): PropertyType => (p.datasets ? { ...p, datasets: p.datasets.filter((d) => lower(d) !== lower(file)) } : p);
    properties = props.flatMap((p) => (p === was ? [left(p), mine] : [p]));
  } else properties = [...props, { column, title: column, description: '', values, datasets: [file] }];
  return { doc: { ...doc, ontology: { ...o, properties } }, said };
}

/**
 * A file's key declared from the data (ADR 0022 §5, Q-139, Q-214): the file its own object type, its rows the objects
 * and the column their key, with a rows entry tying the file to it, so the file is held to one row a key (bronze holds
 * a day whose rows repeat one, as the evidence files' rows entries do). An object type already over the file is keyed
 * by the column where it names no key; one keyed by anything else stands, and the edit doesn't apply. Null `said` where
 * the file has a rows entry already.
 */
export function declareKey(doc: FlowDocument, file: string, column: string): { doc: FlowDocument; said: string | null } {
  const o: Ontology = doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };
  if ((o.rows ?? []).some((r) => lower(r.dataset) === lower(file))) return { doc, said: null };
  const types = [...o.objectTypes];
  let type = types.find((t) => lower(t.dataset) === lower(file));
  const had = !!type;
  if (type && type.key.length && !(type.key.length === 1 && lower(type.key[0]!) === lower(column))) return { doc, said: null };
  if (!type) {
    const taken = new Set(types.map((t) => t.id));
    let id = file;
    for (let n = 2; taken.has(id); n++) id = `${file}_${n}`;
    const noun = o.nouns?.[file]?.one;
    type = { id, name: noun ? `${noun[0]!.toUpperCase()}${noun.slice(1)}` : file, dataset: file, key: [column], title: column };
    types.push(type);
  } else if (!type.key.length) {
    const keyed = { ...type, key: [column] };
    types[types.indexOf(type)] = keyed;
    type = keyed;
  }
  const rows = [...(o.rows ?? []), { dataset: file, of: type.id }];
  // A row is called by the file's noun, else the type's name where the type was there, else by its key.
  const named = Object.entries(o.nouns ?? {}).find(([k]) => lower(k) === lower(file))?.[1].one;
  return { doc: { ...doc, ontology: { ...o, objectTypes: types, rows } }, said: `Keyed ${file} by ${column}: one row a ${named ?? (had ? type.name.toLowerCase() : column)}` };
}

/** A band accepted for a value of a source's column (ADR 0014 §3, Accept the new band). */
export interface AcceptedBand {
  column: string;
  value: string;
  share: [number, number];
}

/**
 * The ontology edited from an accepted band (ADR 0014 §3): the property of the column, for this source, gets the band
 * as its expect entry for the value (a general entry stays for the other datasets). Null where the ontology doesn't
 * describe the column. `said` is the change in words for the record, the column by its title and the value by what
 * it means there.
 */
export function applyBand(doc: FlowDocument, source: string, band: AcceptedBand): { doc: FlowDocument; said: string } | null {
  const o = doc.ontology;
  if (!o) return null;
  const props = o.properties ?? [];
  const own = propertyOf(o, source, band.column);
  if (!own) return null;
  const list = [...(own.expect ?? [])];
  const mine = list.findIndex((b) => b.value === band.value && (b.datasets ? b.datasets.some((d) => lower(d) === lower(source)) : false));
  const general = list.findIndex((b) => b.value === band.value && !b.datasets);
  if (mine >= 0) list[mine] = { ...list[mine]!, share: band.share };
  else if (general >= 0 && own.datasets?.some((d) => lower(d) === lower(source))) list[general] = { ...list[general]!, share: band.share };
  else list.push({ value: band.value, share: band.share, datasets: [source] });
  const edited = { ...own, expect: list };
  const percent = (x: number) => `${Math.round(x * 1000) / 10}%`;
  const value = own.values && Object.prototype.hasOwnProperty.call(own.values, band.value) ? own.values[band.value]! : band.value;
  return {
    doc: { ...doc, ontology: { ...o, properties: props.map((p) => (p === own ? edited : p)) } },
    said: `Accepted a new band in ${source}: ${own.title} ${value} between ${percent(band.share[0])} and ${percent(band.share[1])}`,
  };
}

// ------------------------------------------------------------------ rules set on a file's columns (rules.ts)

/** A rule as the form gives it: the ontology's entry without its name (a new rule is given one) or its switch. */
export type RuleInput = Omit<OntologyRule, 'id' | 'off'> & { id?: string };

/** The ontology to edit, made where the flow has none. */
const ontologyOf = (doc: FlowDocument): Ontology => doc.ontology ?? { objectTypes: [], linkTypes: [], actionTypes: [] };

/** The rule's entry, in the canonical shape the document keeps: its settings in one order, only what its kind has. */
function ruleEntry(r: RuleInput & { id: string }): OntologyRule {
  return {
    id: r.id,
    file: r.file,
    column: r.column,
    kind: r.kind,
    ...(r.kind === 'oneOf' || r.kind === 'when' ? { values: [...new Set((r.values ?? []).map((v) => v.trim()).filter((v) => v !== ''))] } : {}),
    ...(r.kind === 'range' && r.min !== undefined ? { min: r.min } : {}),
    ...(r.kind === 'range' && r.max !== undefined ? { max: r.max } : {}),
    ...(r.kind === 'when' && r.when ? { when: { column: r.when.column, values: [...new Set(r.when.values.map((v) => v.trim()).filter((v) => v !== ''))] } } : {}),
    action: r.action,
  };
}

/** Why a document with the rule isn't one: the first problem validateDocument finds with the ontology's rules. */
function ruleProblem(doc: FlowDocument): string | null {
  const issue = validateDocument(doc).find((i) => i.path.startsWith('$.ontology.rules'));
  return issue ? issue.message : null;
}

/**
 * A rule added to its file, or one of its rules changed (by `id`): the document with it, every check cell that reads
 * the file brought in step (`syncRuleCells`: a new rule on, a changed one switched as it was), and the change in words,
 * or the reason the rule can't be kept. It runs from the next run (Q-141): a rule is on once set. With `add`, a rule
 * by an `id` the file doesn't have is added by that id (a recorded edit replayed, inforce.ts) rather than refused.
 */
export function setRule(doc: FlowDocument, input: RuleInput, add = false): { doc: FlowDocument; said: string } | { problem: string } {
  const o = ontologyOf(doc);
  const rules = o.rules ?? [];
  const at = input.id === undefined ? -1 : rules.findIndex((r) => lower(r.file) === lower(input.file) && r.id === input.id);
  if (input.id !== undefined && at < 0 && !add) return { problem: `${input.file} has no rule ${input.id}` };
  const was = at >= 0 ? rules[at]! : null;
  const entry = ruleEntry({ ...input, id: was?.id ?? input.id ?? newRuleId(doc, input.file, input.column, input.kind) });
  const defined: FlowDocument = { ...doc, ontology: { ...o, rules: was ? rules.map((r, k) => (k === at ? entry : r)) : [...rules, entry] } };
  const problem = ruleProblem(defined);
  if (problem) return { problem };
  const next = syncRuleCells(defined);
  const words = `${ruleSaid(next.ontology, entry)}, else ${ACTION_SAID[entry.action]}`;
  return { doc: next, said: was ? `Changed a rule in ${entry.file}: ${words} (it was: ${ruleSaid(o, was)}, else ${ACTION_SAID[was.action]})` : `Added a rule to ${entry.file}: ${words}` };
}

/** A file's rule taken away: the document without it, the check cells that listed it written without it, and the change
 * in words; null when there is no such rule. */
export function removeRule(doc: FlowDocument, file: string, id: string): { doc: FlowDocument; said: string } | null {
  const o = doc.ontology;
  const was = o?.rules?.find((r) => lower(r.file) === lower(file) && r.id === id);
  if (!o || !was) return null;
  const rules = o.rules!.filter((r) => r !== was);
  const { rules: _rules, ...rest } = o;
  return { doc: syncRuleCells({ ...doc, ontology: rules.length ? { ...rest, rules } : rest }), said: `Removed a rule from ${was.file}: ${ruleSaid(o, was)}` };
}

/**
 * A file's rule switched on or off on its import card (Q-141, Q-148): written in the check cell that enforces the file
 * (`ontology: { name: 'off' }`), every rule of the file listed there as it is switched; the ontology's definition is
 * untouched. Kept and said either way, enforced only while on. Null when there is no such rule, no check step reads the
 * file directly, or it is already so.
 */
export function switchRule(doc: FlowDocument, file: string, id: string, on: boolean): { doc: FlowDocument; said: string; step: string } | null {
  const o = doc.ontology;
  const was = o?.rules?.find((r) => lower(r.file) === lower(file) && r.id === id);
  const step = checkStepOf(doc, file);
  if (!o || !was || !step || ruleOn(step, id) === on) return null;
  const next = writeRuleSwitches(doc, step.id, switchesFor(doc, step, { [id]: on ? 'on' : 'off' }));
  return { doc: next, said: `Switched ${on ? 'on' : 'off'} a rule of ${was.file}: ${ruleSaid(o, was)}, in ${step.id}`, step: step.id };
}

// ------------------------------------------------------------------ what the page keeps of an edited flow

/** A name edit as it was made (`nameColumnThrough`): the file, the column, what changed and the datasets it was carried
 * to. Kept so it can be made again on the own document of each flow read that has the file (ADR 0025 §7, follow.ts). */
export interface NameOp {
  file: string;
  column: string;
  change: ColumnChange;
  through: string[];
}

/** One edit made here, as the page lists it: when, and what was done, in the words it was recorded with. */
export interface FlowEdit {
  at: string;
  said: string;
  /** A name edit, as made: what a rule edit's change set is to the rules, this is to the names. */
  name?: NameOp;
}

/**
 * What the page keeps of an edited flow (ADR 0015 §4): the document as edited, without its arrangement (sections and
 * places are kept apart), the edits made, and `base`, the flow hash of the document it was shipped with. Its
 * notebooks, gates and ontology are in it, and the cell refs and outline a toggle needs, which the page can't derive
 * again (it has no parser).
 */
export interface KeptFlow {
  v: 2;
  base: string;
  doc: FlowDocument;
  edits: FlowEdit[];
}

/** The fingerprint the first kept form went by (`{ v: 1, base, steps }`): FNV-1a of the shipped steps. */
export function stepsPrint(steps: readonly StepDef[]): string {
  let hash = 0x811c9dc5;
  for (const ch of canonicalJSON(steps as unknown as Parameters<typeof canonicalJSON>[0])) hash = Math.imul(hash ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return hash.toString(16);
}

/** What to keep of a document edited here: `base` is the shipped document's flow hash. */
export function keptOf(doc: FlowDocument, base: string, edits: readonly FlowEdit[]): KeptFlow {
  const { groups: _groups, layout: _layout, ...rest } = doc;
  return { v: 2, base, doc: rest as FlowDocument, edits: edits.map((e) => ({ at: e.at, said: e.said, ...(e.name ? { name: e.name } : {}) })) };
}

/** What became of what the page kept: nothing was kept; the edited document, to go on from; or what was kept was
 * dropped, with the edits that went with it and why. */
export type Restored =
  | { state: 'none' }
  | { state: 'kept'; doc: FlowDocument; edits: FlowEdit[] }
  | { state: 'dropped'; edits: FlowEdit[]; why: string };

const isNameOp = (v: unknown): v is NameOp => typeof v === 'object' && v !== null && typeof (v as NameOp).file === 'string' && typeof (v as NameOp).column === 'string' && typeof (v as NameOp).change === 'object' && (v as NameOp).change !== null
  && Array.isArray((v as NameOp).through) && (v as NameOp).through.every((d) => typeof d === 'string');
const isEdits = (v: unknown): v is FlowEdit[] => Array.isArray(v) && v.every((e) => typeof e === 'object' && e !== null && typeof (e as FlowEdit).at === 'string' && typeof (e as FlowEdit).said === 'string' && ((e as FlowEdit).name === undefined || isNameOp((e as FlowEdit).name)));

/**
 * The edited document the page kept, restored over the shipped one, whose arrangement it takes (the browser's own is
 * put on after). What was kept against another shipped document is dropped (`base` is the shipped flow's hash now):
 * the edits were made to a flow that is no longer the one shipped. So is anything that isn't a flow this version
 * reads. The first kept form (the steps alone, by `stepsPrint`) is still read.
 */
export function restoreKept(shipped: FlowDocument, base: string, saved: unknown): Restored {
  if (typeof saved !== 'object' || saved === null) return { state: 'none' };
  const s = saved as { v?: unknown; base?: unknown; doc?: unknown; steps?: unknown; edits?: unknown };
  const edits = isEdits(s.edits) ? s.edits : [];
  const arranged = (doc: FlowDocument): FlowDocument => {
    const { groups: _groups, layout: _layout, ...rest } = doc;
    return { ...rest, ...(shipped.groups ? { groups: shipped.groups } : {}), ...(shipped.layout ? { layout: shipped.layout } : {}) } as FlowDocument;
  };
  if (s.v === 1) {
    if (s.base !== stepsPrint(shipped.steps) || !Array.isArray(s.steps)) return { state: 'dropped', edits, why: 'the flow as shipped changed' };
    const doc = { ...shipped, steps: s.steps as StepDef[] };
    return validateDocument(doc).length === 0 ? { state: 'kept', doc, edits } : { state: 'dropped', edits, why: 'what was kept isn’t a flow this version reads' };
  }
  if (s.v !== 2) return { state: 'dropped', edits, why: 'what was kept isn’t in a form this version reads' };
  if (s.base !== base) return { state: 'dropped', edits, why: 'the flow as shipped changed' };
  if (typeof s.doc !== 'object' || s.doc === null || (s.doc as FlowDocument).id !== shipped.id) return { state: 'dropped', edits, why: 'what was kept isn’t this flow' };
  const doc = arranged(s.doc as FlowDocument);
  return validateDocument(doc).length === 0 ? { state: 'kept', doc, edits } : { state: 'dropped', edits, why: 'what was kept isn’t a flow this version reads' };
}

/**
 * The flow as shipped again, every edit taken away: the shipped document, with the arrangement the document on
 * screen has (its sections, places and profile boxes are the browser's own, and no edit of the flow), less what the
 * shipped flow has no step for.
 */
export function asShipped(doc: FlowDocument, shipped: FlowDocument): FlowDocument {
  const known = new Set([...shipped.sources, ...shipped.steps].map((x) => lower(x.id)));
  const { groups: _groups, layout: _layout, profiles: _profiles, ...rest } = structuredClone(shipped);
  const groups = (doc.groups ?? shipped.groups)?.map((g) => ({ ...g, steps: g.steps.filter((x) => known.has(lower(x))) }));
  const profiles = (doc.profiles ?? shipped.profiles)?.filter((p) => known.has(lower(p.of)));
  const layout = doc.layout ?? shipped.layout;
  return { ...rest, ...(groups ? { groups } : {}), ...(layout ? { layout } : {}), ...(profiles ? { profiles } : {}) } as FlowDocument;
}
