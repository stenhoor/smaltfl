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
import { propertyOf, saysMore, type AwaitedDataset, type Ended, type LinkType, type NeedsDef, type ObjectType, type Ontology, type PropertyType, type RowsDef } from './ontology.js';
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
  /** Why the flow handles the column its own way here (ADR 0026 §8), where an estate's ontology describes it: the
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
 * Where an estate's ontology describes the column (ADR 0026 §8), the caller gives the flow's reason (`change.override`):
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
 * flow's own handling (`change.override`, ADR 0026 §8) marks each dataset where an estate describes the column
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
    // A closed list or column (ADR 0027 §4): what defines an entry, the entries in the order they were declared, and the
    // keys left out, each only where there is any.
    ...(r.kind === 'closed' && r.defines?.length ? { defines: [...r.defines] } : {}),
    ...(r.kind === 'closed' ? { entries: (r.entries ?? []).map((e) => [...e]) } : {}),
    ...(r.kind === 'closed' && r.leftOut?.length ? { leftOut: [...r.leftOut] } : {}),
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

// ------------------------------------------------------------------ columns set aside (ADR 0027 §4)

/**
 * A file's column set aside, or taken in again (ADR 0027 §4, Q-254): named in `ontology.aside` as one the flow doesn't
 * take, so that every column the file has is either described or set aside. It says how the file is read, as a name
 * does, so it holds for every day (Q-198). Null `said` where it changes nothing.
 */
export function setAside(doc: FlowDocument, file: string, column: string, aside: boolean): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const source = doc.sources.find((x) => lower(x.id) === lower(file))?.id ?? file;
  const was = Object.entries(o.aside ?? {}).find(([f]) => lower(f) === lower(source));
  const had = was?.[1] ?? [];
  const has = had.some((c) => lower(c) === lower(column));
  if (has === aside) return { doc, said: null };
  const next = aside ? [...had, column] : had.filter((c) => lower(c) !== lower(column));
  const rest = Object.fromEntries(Object.entries(o.aside ?? {}).filter(([f]) => lower(f) !== lower(source)));
  const all = next.length ? { ...rest, [source]: next } : rest;
  const { aside: _aside, ...bare } = o;
  return { doc: { ...doc, ontology: Object.keys(all).length ? { ...bare, aside: all } : bare }, said: aside ? `Set ${source}’s column ${column} aside: the flow doesn’t take it` : `Took ${source}’s column ${column} back from aside` };
}

// ------------------------------------------------------------------ described ahead of its data (ADR 0027 §5)

/** "a vendor", "an application": one of them, with its article. */
const oneOfThem = (one: string) => `${/^[aeiou]/i.test(one.trim()) ? 'an' : 'a'} ${one.trim()}`;

/** A dataset described ahead, as the ontology keeps it: its settings in one order, nothing else carried. */
const awaitedEntry = (d: AwaitedDataset): AwaitedDataset => ({
  id: d.id,
  name: d.name.trim(),
  ...(d.description?.trim() ? { description: d.description.trim() } : {}),
  row: { one: d.row.one.trim(), many: d.row.many.trim() },
  key: [...d.key],
  columns: d.columns.map((c) => ({ column: c.column, ...(c.title?.trim() ? { title: c.title.trim() } : {}), description: c.description.trim() })),
});

/**
 * A dataset described before its data exists (ADR 0027 §5, Q-255, "Describe it first"): written into the ontology's
 * `awaited`, in place of an earlier description of the same dataset. It waits for data until a source of its name is
 * in the flow. Null `said` where the ontology has it so already.
 */
export function describeAhead(doc: FlowDocument, dataset: AwaitedDataset): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const entry = awaitedEntry(dataset);
  const had = (o.awaited ?? []).find((a) => lower(a.id) === lower(entry.id));
  if (had && canonicalJSON(had as never) === canonicalJSON(entry as never)) return { doc, said: null };
  const awaited = had ? o.awaited!.map((a) => (a === had ? entry : a)) : [...(o.awaited ?? []), entry];
  const what = `one row is ${oneOfThem(entry.row.one)}, by ${listed(entry.key)}; ${entry.columns.length} ${entry.columns.length === 1 ? 'column' : 'columns'}`;
  // Described again after its description ended (§2), it is one again: the record that it ended goes.
  const again = (o.ended ?? []).filter((e) => !(e.what === 'awaited' && lower(e.id) === lower(entry.id)));
  const { ended: _ended, ...rest } = o;
  return { doc: { ...doc, ontology: { ...rest, ...(again.length ? { ended: again } : {}), awaited } }, said: had ? `Described ${entry.id} again, still ahead of its data: ${what}` : `Described ${entry.id} ahead of its data: ${what}` };
}

// ------------------------------------------------------------------ kinds, relations and meanings over time (ADR 0027 §3)

// The ontology's kinds of thing, its relations, what a dataset's rows are and its dependencies are edited as rules are:
// each edit a function of the document, replayed by a dated change set (inforce.ts). An edit that would leave a
// document the flow can't be read as changes nothing and says nothing, so a change set made for one flow passes over
// another that hasn't the datasets it is about (an estate's change, in a flow that takes only part of the estate).

const same = (a: unknown, b: unknown): boolean => canonicalJSON((a ?? null) as never) === canonicalJSON((b ?? null) as never);
/** The edit's result where the document is still one the flow can be read as; nothing where it isn't. */
const kept = (doc: FlowDocument, next: FlowDocument, said: string): { doc: FlowDocument; said: string | null } => (validateDocument(next).length ? { doc, said: null } : { doc: next, said });
const datasetOf = (doc: FlowDocument, id: string): string | undefined => [...doc.sources, ...doc.steps].find((x) => lower(x.id) === lower(id))?.id;
/** What changed between two of a thing, field by field, in words: "its key app_id → id". */
function fieldsSaid(was: Record<string, unknown>, now: Record<string, unknown>, names: Readonly<Record<string, string>>): string {
  const word = (v: unknown): string => (v === undefined || v === null || v === '' ? 'none' : Array.isArray(v) ? v.map((x) => (Array.isArray(x) ? x.join(' = ') : String(x))).join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const parts = Object.keys(names).filter((k) => !same(was[k], now[k])).map((k) => `${names[k]} ${word(was[k])} → ${word(now[k])}`);
  return parts.join('; ');
}
/** The ontology without a record that a thing ended: it is one again. */
const notEnded = (o: Ontology, what: Ended['what'], id: string, of?: Ended['of']): Ontology => {
  const left = (o.ended ?? []).filter((e) => !(e.what === what && lower(e.id) === lower(id) && lower(e.of?.file ?? '') === lower(of?.file ?? '') && (e.of?.rule ?? '') === (of?.rule ?? '')));
  const { ended: _ended, ...rest } = o;
  return left.length ? { ...rest, ended: left } : rest;
};

/**
 * A kind of thing, added or changed (ADR 0027 §3, Q-250): the ontology's object type of that id is this one, from the
 * day its change says. Its rows are a dataset the flow has; where it isn't, the edit doesn't apply.
 */
export function setType(doc: FlowDocument, type: ObjectType): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const dataset = datasetOf(doc, type.dataset);
  if (!dataset) return { doc, said: null };
  const entry: ObjectType = { id: type.id, name: type.name.trim(), dataset, key: [...type.key], title: type.title, ...(type.description?.trim() ? { description: type.description.trim() } : {}) };
  const had = o.objectTypes.find((t) => t.id === entry.id);
  if (had && same(had, entry)) return { doc, said: null };
  const next = { ...notEnded(o, 'type', entry.id), objectTypes: had ? o.objectTypes.map((t) => (t === had ? entry : t)) : [...o.objectTypes, entry] };
  const said = had
    ? `Changed the kind ${had.name}: ${fieldsSaid(had as never, entry as never, { name: 'its name', dataset: 'its rows', key: 'its key', title: 'what it is called by', description: 'what it is' })}`
    : `Added the kind ${entry.name}: one row of ${entry.dataset}, by ${listed(entry.key)}`;
  return kept(doc, { ...doc, ontology: next }, said);
}

/** A relation in words: "Application to Organisational unit, on owner_team_id = org_unit_id". */
export function linkSaid(o: Ontology | undefined, l: LinkType): string {
  const name = (id: string) => o?.objectTypes.find((t) => t.id === id)?.name ?? id;
  return `${name(l.from)} to ${name(l.to)}, on ${l.on.map(([a, b]) => (lower(a) === lower(b) ? a : `${a} = ${b}`)).join(' and ')}`;
}

/**
 * A relation between two kinds, added or changed (Q-250): the ontology's link of that id is this one, from the day its
 * change says. Both kinds are the ontology's by then; where one isn't, the edit doesn't apply.
 */
export function setLink(doc: FlowDocument, link: LinkType): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  if (!o.objectTypes.some((t) => t.id === link.from) || !o.objectTypes.some((t) => t.id === link.to)) return { doc, said: null };
  const entry: LinkType = { id: link.id, name: link.name.trim(), from: link.from, to: link.to, on: link.on.map(([a, b]): [string, string] => [a, b]), ...(link.cardinality ? { cardinality: link.cardinality } : {}) };
  const had = o.linkTypes.find((l) => l.id === entry.id);
  if (had && same(had, entry)) return { doc, said: null };
  const next = { ...notEnded(o, 'link', entry.id), linkTypes: had ? o.linkTypes.map((l) => (l === had ? entry : l)) : [...o.linkTypes, entry] };
  const said = had
    ? `Changed the relation ${had.name}: ${fieldsSaid(had as never, entry as never, { name: 'its name', from: 'from', to: 'to', on: 'on', cardinality: 'how many' })}`
    : `Added the relation ${entry.name}: ${linkSaid(next, entry)}`;
  return kept(doc, { ...doc, ontology: next }, said);
}

/** A condition in words: "exposure internet or partner, and tier 1". */
const whereSaid = (where: RowsDef['where']): string =>
  Object.entries(where ?? {}).map(([c, v]) => `${c} ${(Array.isArray(v) ? v : [v]).join(' or ')}`).join(', and ');

/**
 * What a dataset's rows are, said or changed (Q-250, ADR 0015 §1): one row an object of a kind, for the objects a
 * condition selects. A flow with gates keeps these; in any other, and where the dataset or the kind isn't there, the
 * edit doesn't apply.
 */
export function setRows(doc: FlowDocument, rows: RowsDef): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const dataset = datasetOf(doc, rows.dataset);
  const type = o.objectTypes.find((t) => t.id === rows.of);
  if (!dataset || !type) return { doc, said: null };
  const entry: RowsDef = { dataset, of: rows.of, ...(rows.key ? { key: rows.key } : {}), ...(rows.where && Object.keys(rows.where).length ? { where: rows.where } : {}), ...(rows.ids ? { ids: rows.ids } : {}) };
  const had = (o.rows ?? []).find((r) => lower(r.dataset) === lower(dataset));
  if (had && same(had, entry)) return { doc, said: null };
  const next = { ...notEnded(o, 'rows', dataset), rows: had ? o.rows!.map((r) => (r === had ? entry : r)) : [...(o.rows ?? []), entry] };
  const what = `${type.name}${entry.where ? `, where ${whereSaid(entry.where)}` : ''}`;
  return kept(doc, { ...doc, ontology: next }, had ? `Changed what a row of ${dataset} is: ${what}` : `Said what a row of ${dataset} is: ${what}`);
}

/** A dependency between columns or datasets, added or changed (Q-250, Q-119): the ontology's needs rule of that id. */
export function setNeeds(doc: FlowDocument, needs: NeedsDef): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const datasets = needs.datasets.map((d) => datasetOf(doc, d)).filter((d): d is string => d !== undefined);
  if (!datasets.length) return { doc, said: null };
  const entry: NeedsDef = { ...needs, datasets };
  const had = (o.needs ?? []).find((n) => n.id === entry.id);
  if (had && same(had, entry)) return { doc, said: null };
  const next = { ...notEnded(o, 'needs', entry.id), needs: had ? o.needs!.map((n) => (n === had ? entry : n)) : [...(o.needs ?? []), entry] };
  return kept(doc, { ...doc, ontology: next }, `${had ? 'Changed' : 'Added'} the dependency ${entry.id} on ${listed(datasets)}${entry.description ? `: ${entry.description}` : ''}`);
}

/**
 * A meaning redefined (ADR 0027 §3, Q-251): from the day its change says, a column means something else. The property
 * that describes the column for the datasets named (for every dataset, where none is) takes the new words; past days
 * keep the meaning they were made under. A rewording, which says the same thing better, is no dated change: it is the
 * name's own, at once (Q-198). Where the ontology has no such meaning, the edit doesn't apply.
 */
export function redefine(doc: FlowDocument, column: string, datasets: readonly string[] | undefined, change: { description: string; title?: string; values?: Record<string, string> }): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  // The meaning it names: for every dataset, the one said for every dataset; for some, the one said for those, or for
  // those of them a flow has (an estate's meaning is trimmed to the datasets a flow takes). Never a flow's own handling
  // of a column an estate describes: that one is the flow's to change.
  const within = new Set((datasets ?? []).map(lower));
  const had = (o.properties ?? []).find((p) => lower(p.column) === lower(column) && p.override === undefined && (datasets === undefined ? p.datasets === undefined : !!p.datasets?.length && p.datasets.every((d) => within.has(lower(d)))));
  if (!had) return { doc, said: null };
  const next: PropertyType = { ...had, description: change.description.trim(), ...(change.title?.trim() ? { title: change.title.trim() } : {}), ...(change.values ? { values: { ...(had.values ?? {}), ...change.values } } : {}) };
  if (same(had, next)) return { doc, said: null };
  const where = had.datasets?.length ? ` in ${listed([...had.datasets])}` : '';
  const valued = change.values ? Object.entries(change.values).filter(([k, v]) => had.values?.[k] !== v).map(([k, v]) => `${k} means ${v}`) : [];
  const parts = [...(had.description !== next.description ? [`“${had.description}” → “${next.description}”`] : []), ...valued];
  return kept(doc, { ...doc, ontology: { ...o, properties: o.properties!.map((p) => (p === had ? next : p)) } }, `Redefined ${had.title || had.column}${where}: ${parts.join('; ') || 'its meaning'}`);
}

/** A thing that ended, named as people call it. */
function endedName(o: Ontology, e: Ended): string {
  switch (e.what) {
    case 'type':
      return `the kind ${o.objectTypes.find((t) => t.id === e.id)?.name ?? e.id}`;
    case 'link':
      return `the relation ${o.linkTypes.find((l) => l.id === e.id)?.name ?? e.id}`;
    case 'rows':
      return `what a row of ${e.id} is`;
    case 'needs':
      return `the dependency ${e.id}`;
    case 'entry': {
      const rule = e.of ? o.rules?.find((r) => lower(r.file) === lower(e.of!.file) && r.id === e.of!.rule && r.kind === 'closed') : undefined;
      return `${rule ? entryNamed(o, rule, e.id) : e.id} in ${e.of?.file ?? 'its list'}`;
    }
    case 'awaited':
      return `the description of ${(o.awaited ?? []).find((a) => lower(a.id) === lower(e.id))?.name ?? e.id}, written ahead of its data`;
  }
}
const FOLLOWED_SAID = { replaced: 'replaced by', merged: 'merged into', split: 'split into' } as const;

/**
 * A thing of the ontology ended (ADR 0027 §2, Q-264: nothing is deleted): from the day its change says it is no longer
 * in force, and the ontology keeps that it ended, with what follows it (`ended`). A kind ends once no relation and no
 * rows entry names it; what follows a thing is of its own sort and in force (a kind for a kind, an entry of the same
 * list for an entry), one for *replaced by* and *merged into*, two or more for *split into*. Where the thing isn't
 * there, or what follows it isn't, the edit doesn't apply.
 */
export function endThing(doc: FlowDocument, e: Ended): { doc: FlowDocument; said: string | null } {
  const o = ontologyOf(doc);
  const none = { doc, said: null };
  let next: Ontology;
  let there: (id: string) => boolean;
  if (e.what === 'type') {
    const t = o.objectTypes.find((x) => x.id === e.id);
    if (!t || o.linkTypes.some((l) => l.from === e.id || l.to === e.id) || (o.rows ?? []).some((r) => r.of === e.id)) return none;
    next = { ...o, objectTypes: o.objectTypes.filter((x) => x !== t) };
    there = (id) => next.objectTypes.some((x) => x.id === id);
  } else if (e.what === 'link') {
    const l = o.linkTypes.find((x) => x.id === e.id);
    if (!l) return none;
    next = { ...o, linkTypes: o.linkTypes.filter((x) => x !== l) };
    there = (id) => next.linkTypes.some((x) => x.id === id);
  } else if (e.what === 'rows') {
    const r = (o.rows ?? []).find((x) => lower(x.dataset) === lower(e.id));
    if (!r) return none;
    const { rows: _rows, ...rest } = o;
    const left = o.rows!.filter((x) => x !== r);
    next = left.length ? { ...rest, rows: left } : rest;
    there = (id) => (next.rows ?? []).some((x) => lower(x.dataset) === lower(id));
  } else if (e.what === 'needs') {
    const n = (o.needs ?? []).find((x) => x.id === e.id);
    if (!n) return none;
    const { needs: _needs, ...rest } = o;
    const left = o.needs!.filter((x) => x !== n);
    next = left.length ? { ...rest, needs: left } : rest;
    there = (id) => (next.needs ?? []).some((x) => x.id === id);
  } else if (e.what === 'awaited') {
    // A dataset described ahead of its data that still waits for it: once a source of its name is in the flow the
    // description is the record of what was asked for, and stays (§5).
    const a = (o.awaited ?? []).find((x) => lower(x.id) === lower(e.id));
    if (!a || doc.sources.some((x) => lower(x.id) === lower(a.id))) return none;
    const { awaited: _awaited, ...rest } = o;
    const left = o.awaited!.filter((x) => x !== a);
    next = left.length ? { ...rest, awaited: left } : rest;
    there = (id) => (next.awaited ?? []).some((x) => lower(x.id) === lower(id));
  } else {
    const found = e.of ? closedRule(doc, e.of.file, e.of.rule) : null;
    if (!found || !(found.rule.entries ?? []).some((x) => x[0] === e.id)) return none;
    const { leftOut: _leftOut, ...bare } = found.rule;
    const leftOut = (found.rule.leftOut ?? []).filter((k) => k !== e.id);
    const rule: OntologyRule = { ...bare, entries: found.rule.entries!.filter((x) => x[0] !== e.id), ...(leftOut.length ? { leftOut } : {}) };
    next = found.put(rule).ontology!;
    there = (id) => (rule.entries ?? []).some((x) => x[0] === id);
  }
  const by = e.then?.by ?? [];
  if (e.then && (by.length === 0 || (e.then.how !== 'split' && by.length !== 1) || (e.then.how === 'split' && by.length < 2) || new Set(by).size !== by.length || by.some((id) => lower(id) === lower(e.id) || !there(id)))) return none;
  const record: Ended = { what: e.what, id: e.what === 'rows' ? (datasetOf(doc, e.id) ?? e.id) : e.id, ...(e.what === 'entry' && e.of ? { of: { file: e.of.file, rule: e.of.rule } } : {}), ...(e.then ? { then: { how: e.then.how, by: [...by] } } : {}) };
  const withRecord: Ontology = { ...notEnded(next, record.what, record.id, record.of), ended: [...(notEnded(next, record.what, record.id, record.of).ended ?? []), record] };
  // What follows it, as people call it: a kind or a relation by its name, an entry by the ontology's word for it.
  const called = (id: string): string =>
    e.what === 'type' ? (o.objectTypes.find((t) => t.id === id)?.name ?? id)
    : e.what === 'link' ? (o.linkTypes.find((l) => l.id === id)?.name ?? id)
    : e.what === 'entry' && e.of ? ((r) => (r ? entryNamed(o, r.rule, id) : id))(closedRule(doc, e.of.file, e.of.rule))
    : e.what === 'awaited' ? ((o.awaited ?? []).find((a) => lower(a.id) === lower(id))?.name ?? id)
    : id;
  return kept(doc, { ...doc, ontology: withRecord }, `Ended ${endedName(o, e)}${e.then ? `: ${FOLLOWED_SAID[e.then.how]} ${listed(by.map(called))}` : ''}`);
}

// ------------------------------------------------------------------ closed lists and columns (ADR 0027 §4)

/** A file's closed rule by its id, and the document's rules with it replaced. */
function closedRule(doc: FlowDocument, file: string, id: string): { o: Ontology; rule: OntologyRule; put(next: OntologyRule): FlowDocument } | null {
  const o = doc.ontology;
  const rule = o?.rules?.find((r) => lower(r.file) === lower(file) && r.id === id && r.kind === 'closed');
  if (!o || !rule) return null;
  return { o, rule, put: (next) => ({ ...doc, ontology: { ...o, rules: o.rules!.map((r) => (r === rule ? ruleEntry(next) : r)) } }) };
}

/** An entry as people call it: the ontology's word for its key where it has one beyond the key itself. */
const entryNamed = (o: Ontology, rule: OntologyRule, key: string): string => {
  const word = propertyOf(o, rule.file, rule.column)?.values?.[key];
  return word && saysMore(word, key) ? `${word} (${key})` : key;
};

/**
 * An entry declared in a closed list, or a value in a closed column (ADR 0027 §4, Q-253): the ontology has it from the
 * change set's day. An entry under a key the list has replaces that one (its defining columns changed); a key left out
 * is left out no longer. Null where the file has no such closed rule or the entry isn't one of its shape; null `said`
 * where the ontology has this very entry already.
 */
export function declareEntry(doc: FlowDocument, file: string, id: string, entry: readonly string[]): { doc: FlowDocument; said: string | null } | null {
  const c = closedRule(doc, file, id);
  if (!c) return null;
  const { o, rule } = c;
  const defines = rule.defines ?? [];
  const key = entry[0];
  if (key === undefined || key === '' || entry.length !== defines.length + 1) return null;
  const entries = rule.entries ?? [];
  const at = entries.findIndex((e) => e[0] === key);
  const was = at >= 0 ? entries[at]! : null;
  const out = (rule.leftOut ?? []).includes(key);
  if (was && was.every((v, k) => v === entry[k]) && !out) return { doc, said: null };
  const next: OntologyRule = { ...rule, entries: was ? entries.map((e, k) => (k === at ? [...entry] : e)) : [...entries, [...entry]] };
  const leftOut = (rule.leftOut ?? []).filter((k) => k !== key);
  if (leftOut.length) next.leftOut = leftOut;
  else delete next.leftOut;
  const title = (col: string) => propertyOf(o, file, col)?.title ?? col;
  const differs = was ? defines.flatMap((d, k) => (was[k + 1] === entry[k + 1] ? [] : [`${title(d)} ${was[k + 1] || 'blank'} → ${entry[k + 1] || 'blank'}`])) : [];
  const said = was && differs.length ? `Changed ${entryNamed(o, rule, key)} in ${file}: ${differs.join(', ')}`
    : was ? `Declared ${entryNamed(o, rule, key)} in ${file} again: it is left out no longer`
    : `Declared ${entryNamed(o, rule, key)} in ${file}`;
  // Declared again after it ended (§2, Q-264), it is an entry again: the record that it ended goes.
  const put = c.put(next);
  return { doc: put.ontology ? { ...put, ontology: notEnded(put.ontology, 'entry', key, { file: rule.file, rule: rule.id }) } : put, said };
}

/**
 * A key left out of what goes on until it is declared (ADR 0027 §4, Q-253, "Publish without it"): its rows are kept out
 * by the check step that reads the file, and the day says so. Null where the file has no such closed rule; null `said`
 * where the key is left out already.
 */
export function leaveOut(doc: FlowDocument, file: string, id: string, key: string): { doc: FlowDocument; said: string | null } | null {
  const c = closedRule(doc, file, id);
  if (!c || key === '') return null;
  if ((c.rule.leftOut ?? []).includes(key)) return { doc, said: null };
  return { doc: c.put({ ...c.rule, leftOut: [...(c.rule.leftOut ?? []), key] }), said: `Left ${entryNamed(c.o, c.rule, key)} out of ${file} until it is declared` };
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
 * to. Kept so it can be made again on the own document of each flow read that has the file (ADR 0026 §7, follow.ts). */
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
