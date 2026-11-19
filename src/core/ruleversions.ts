/**
 * The versions of the rules people set (ADR 0021 §5): the Ontology screen lists them, follows the day and the
 * as-known-on moment, and compares any two.
 *
 * - `ruleVersions`: every set of change sets in force on one of the days given at some moment, as known then (the base
 *   with them applied in the order they were recorded, inforce.ts `changesOn`), each with where it was in force: a day,
 *   and from when to when it was known to be. A version is the rules on a day as known at a moment, so one change set
 *   back-dated over days that a later one doesn't reach makes two versions, as the runs under them do.
 * - `versionOn`: the version in force on a day as known at a moment.
 * - `rulesDiff`: what differs between two documents' rules in force, item by item (a rule of a file, a band, a gate's
 *   check, a rule switched in a check cell, anything else the rules hold), and `diffSaid` in words.
 *
 * Pure: no DOM, no engine.
 */
import { knownFrom, type OwnedDoc } from './agree.js';
import { canonicalJSON } from './canonical.js';
import type { ChangeSet, FlowDocument } from './document.js';
import { LAYER_DEFAULTS, type CheckMode, type CheckName, type GateDef } from './gates.js';
import { changesOn, inForce, rulesInForce } from './inforce.js';
import { propertyOf, saysMore, type AwaitedDataset, type Band, type Ended, type LinkType, type NeedsDef, type ObjectType, type Ontology, type PropertyType, type RowsDef } from './ontology.js';
import { ACTION_SAID, ruleSaid, type OntologyRule } from './rules.js';

/** A version of the rules: the change sets the base has applied, in the order applied (none: the rules as shipped), and
 * each span it was in force: on a day, from a moment (null: from the start) to one (null: still). */
export interface RuleVersion {
  changes: string[];
  spans: { day: string; from: string | null; to: string | null }[];
}

/** A version's key: its change sets, in the order applied. */
export const versionKey = (changes: readonly string[]): string => changes.join('\n');

/**
 * The versions of a flow's rules over the days given (ADR 0021 §5): each set of change sets in force on one of them at
 * some moment, as known then, with the spans it was in force; in the order each was first known (the rules as shipped
 * first), then by the days it is in force on. A flow without change sets has one version, the rules as shipped.
 */
export function ruleVersions(doc: OwnedDoc & Pick<FlowDocument, 'changes'>, days: readonly string[]): RuleVersion[] {
  // The moments the rules changed at: each change set's, from when it was known (ADR 0027 §10: one that asks for an
  // owner's agreement, from when it had it; one that still waits makes no version).
  const moments = [...new Set((doc.changes ?? []).flatMap((c) => { const from = knownFrom(doc, c); return from === null ? [] : [Date.parse(from)]; }))].sort((a, b) => a - b);
  const out = new Map<string, RuleVersion & { first: number }>();
  const add = (changes: string[], day: string, from: number | null, to: number | null) => {
    const k = versionKey(changes);
    const v = out.get(k) ?? { changes, spans: [], first: Infinity };
    v.spans.push({ day, from: from === null ? null : new Date(from).toISOString(), to: to === null ? null : new Date(to).toISOString() });
    v.first = Math.min(v.first, from ?? -Infinity);
    out.set(k, v);
  };
  for (const day of [...new Set(days)].sort()) {
    // Before the first change set was recorded, the rules as shipped; then the change sets in force as each is recorded.
    const states: { t: number | null; changes: string[] }[] = [{ t: null, changes: [] }, ...moments.map((t) => ({ t, changes: changesOn(doc, day, new Date(t).toISOString()).map((c) => c.id) }))];
    let start = 0;
    for (let i = 1; i <= states.length; i++) {
      if (i < states.length && versionKey(states[i]!.changes) === versionKey(states[start]!.changes)) continue;
      add(states[start]!.changes, day, states[start]!.t, i < states.length ? states[i]!.t : null);
      start = i;
    }
  }
  return [...out.values()].sort((a, b) => a.first - b.first || a.changes.length - b.changes.length || (a.spans[0]!.day < b.spans[0]!.day ? -1 : a.spans[0]!.day > b.spans[0]!.day ? 1 : 0)).map(({ changes, spans }) => ({ changes, spans }));
}

/** The version in force on a day as known at a moment (none: now), by its key: the change sets in force then. */
export const versionOn = (doc: OwnedDoc & Pick<FlowDocument, 'changes'>, day: string | null, asOf?: string | null): string => versionKey(changesOn(doc, day, asOf).map((c) => c.id));

/** One thing two documents' rules in force differ in. */
export type RuleDiff =
  | { kind: 'rule'; file: string; id: string; before: OntologyRule | null; after: OntologyRule | null }
  | { kind: 'band'; column: string; title: string; value: string; datasets: string[] | null; before: [number, number] | null; after: [number, number] | null }
  | { kind: 'check'; node: string; check: CheckName; before: CheckMode; after: CheckMode }
  | { kind: 'gate'; node: string; before: GateDef | null; after: GateDef | null }
  | { kind: 'switch'; step: string; rule: string; before: 'on' | 'off'; after: 'on' | 'off' }
  /** A kind of thing, a relation, what a dataset's rows are, a dependency (ADR 0027 §3): added, changed, or gone, with
   * the record that it ended where the later document keeps one. */
  | { kind: 'type'; id: string; before: ObjectType | null; after: ObjectType | null; ended?: Ended }
  | { kind: 'link'; id: string; before: LinkType | null; after: LinkType | null; ended?: Ended }
  | { kind: 'rows'; dataset: string; before: RowsDef | null; after: RowsDef | null; ended?: Ended }
  | { kind: 'needs'; id: string; before: NeedsDef | null; after: NeedsDef | null; ended?: Ended }
  /** What a column means, for the datasets it is said for (none: every dataset): its words before and after. */
  | { kind: 'meaning'; column: string; title: string; datasets: string[] | null; before: string | null; after: string | null }
  /** A dataset described ahead of its data (§5). */
  | { kind: 'awaited'; id: string; before: AwaitedDataset | null; after: AwaitedDataset | null; ended?: Ended }
  | { kind: 'other'; what: string };

const lower = (x: string) => x.toLowerCase();
const same = (a: unknown, b: unknown) => canonicalJSON((a ?? null) as Parameters<typeof canonicalJSON>[0]) === canonicalJSON((b ?? null) as Parameters<typeof canonicalJSON>[0]);
const datasetsKey = (ds: readonly string[] | undefined) => (ds?.length ? [...ds].map(lower).sort().join(',') : '*');

/** The bands of an ontology, each by its property and value and the datasets it names. */
function bandsOf(o: Ontology | undefined): Map<string, { p: PropertyType; b: Band }> {
  const out = new Map<string, { p: PropertyType; b: Band }>();
  for (const p of o?.properties ?? []) for (const b of p.expect ?? []) out.set(`${lower(p.column)}|${datasetsKey(p.datasets)}|${b.value}|${datasetsKey(b.datasets)}`, { p, b });
  return out;
}

/** A gate's check modes, its layer's defaults with its own over them. */
const modesOf = (g: GateDef | undefined): Partial<Record<CheckName, CheckMode>> => (g ? { ...LAYER_DEFAULTS[g.layer], ...g.checks } : {});

/**
 * What differs between two documents' rules in force (ADR 0021 §5), from `a` to `b`: each rule of a file added, taken
 * out or changed (by its file and id); each band whose share moved, by its column, value and datasets; each check of a
 * gate whose mode moved; each rule a check cell switched; and anything else the rules hold (a gate's layer or written
 * rules, a property's marks, the fixes a file allows), said as what it is. Empty when the rules are the same.
 */
export function rulesDiff(a: Pick<FlowDocument, 'ontology' | 'gates' | 'steps'>, b: Pick<FlowDocument, 'ontology' | 'gates' | 'steps'>): RuleDiff[] {
  const out: RuleDiff[] = [];
  const ra = rulesInForce(a);
  const rb = rulesInForce(b);
  if (same(ra, rb)) return out;
  // The rules people set on files' columns, by file and id.
  const rules = (o: Ontology | null) => new Map((o?.rules ?? []).map((r) => [`${lower(r.file)}|${r.id}`, r] as const));
  const xa = rules(ra.ontology);
  const xb = rules(rb.ontology);
  for (const k of new Set([...xa.keys(), ...xb.keys()])) {
    const before = xa.get(k) ?? null;
    const after = xb.get(k) ?? null;
    if (!same(before, after)) out.push({ kind: 'rule', file: (after ?? before)!.file, id: (after ?? before)!.id, before, after });
  }
  // The bands.
  const ba = bandsOf(ra.ontology ?? undefined);
  const bb = bandsOf(rb.ontology ?? undefined);
  for (const k of new Set([...ba.keys(), ...bb.keys()])) {
    const x = ba.get(k);
    const y = bb.get(k);
    if (x && y && same(x.b.share, y.b.share)) continue;
    const { p, b } = (y ?? x)!;
    out.push({ kind: 'band', column: p.column, title: p.title, value: b.value, datasets: b.datasets ?? p.datasets ?? null, before: x ? x.b.share : null, after: y ? y.b.share : null });
  }
  // A property's other marks (what is bad, new values, a due mark, the column it runs behind).
  const props = (o: Ontology | null) => new Map((o?.properties ?? []).map((p) => [`${lower(p.column)}|${datasetsKey(p.datasets)}`, p] as const));
  const pa = props(ra.ontology);
  const pb = props(rb.ontology);
  for (const k of new Set([...pa.keys(), ...pb.keys()])) {
    const x = pa.get(k);
    const y = pb.get(k);
    const marks = (p: PropertyType | undefined) => (p ? { bad: p.bad, newValues: p.newValues, due: p.due, after: p.after, models: p.models } : null);
    if (!same(marks(x), marks(y))) out.push({ kind: 'other', what: `the marks on ${(y ?? x)!.title}` });
  }
  if (!same(ra.ontology?.fixes, rb.ontology?.fixes)) out.push({ kind: 'other', what: 'the fixes a held day is offered' });
  // What each column means (ADR 0027 §3): its words, by the column and the datasets they are said for.
  for (const k of new Set([...pa.keys(), ...pb.keys()])) {
    const x = pa.get(k);
    const y = pb.get(k);
    if ((x?.description ?? null) === (y?.description ?? null) && same(x?.values, y?.values)) continue;
    const p = (y ?? x)!;
    // Its values' words are said only where they differ: the same list on both sides says nothing of the change.
    const valued = !same(x?.values, y?.values);
    const words = (q: PropertyType | undefined) => (q ? `${q.description}${valued && q.values && Object.keys(q.values).length ? ` (${Object.entries(q.values).map(([v, w]) => (v === w ? v : `${v}: ${w}`)).join(', ')})` : ''}` : null);
    out.push({ kind: 'meaning', column: p.column, title: p.title || p.column, datasets: p.datasets ?? null, before: words(x), after: words(y) });
  }
  // The kinds of thing, the relations, what each dataset's rows are and the dependencies; one gone says how it ended
  // where the later document keeps that.
  const oa = ra.ontology;
  const ob = rb.ontology;
  const endedIn = (what: Ended['what'], id: string) => (ob?.ended ?? []).find((e) => e.what === what && lower(e.id) === lower(id));
  const each = <T,>(xs: readonly T[] | undefined, ys: readonly T[] | undefined, key: (x: T) => string, put: (id: string, before: T | null, after: T | null) => void) => {
    const mx = new Map((xs ?? []).map((x) => [lower(key(x)), x] as const));
    const my = new Map((ys ?? []).map((y) => [lower(key(y)), y] as const));
    for (const k of new Set([...mx.keys(), ...my.keys()])) {
      const before = mx.get(k) ?? null;
      const after = my.get(k) ?? null;
      if (!same(before, after)) put(key((after ?? before)!), before, after);
    }
  };
  each(oa?.objectTypes, ob?.objectTypes, (t) => t.id, (id, before, after) => out.push({ kind: 'type', id, before, after, ...(!after && endedIn('type', id) ? { ended: endedIn('type', id)! } : {}) }));
  each(oa?.linkTypes, ob?.linkTypes, (l) => l.id, (id, before, after) => out.push({ kind: 'link', id, before, after, ...(!after && endedIn('link', id) ? { ended: endedIn('link', id)! } : {}) }));
  each(oa?.rows, ob?.rows, (r) => r.dataset, (dataset, before, after) => out.push({ kind: 'rows', dataset, before, after, ...(!after && endedIn('rows', dataset) ? { ended: endedIn('rows', dataset)! } : {}) }));
  each(oa?.needs, ob?.needs, (n) => n.id, (id, before, after) => out.push({ kind: 'needs', id, before, after, ...(!after && endedIn('needs', id) ? { ended: endedIn('needs', id)! } : {}) }));
  each(oa?.awaited, ob?.awaited, (a) => a.id, (id, before, after) => out.push({ kind: 'awaited', id, before, after, ...(!after && endedIn('awaited', id) ? { ended: endedIn('awaited', id)! } : {}) }));
  if (!same(oa?.aside, ob?.aside)) out.push({ kind: 'other', what: 'the columns set aside' });
  if (!same(oa?.nouns, ob?.nouns)) out.push({ kind: 'other', what: 'what a row of a dataset is called' });
  // The gates: one added or taken out, else each check's mode, then anything else a gate says.
  const ga = ra.gates ?? {};
  const gb = rb.gates ?? {};
  for (const node of [...new Set([...Object.keys(ga), ...Object.keys(gb)])].sort()) {
    const x = ga[node];
    const y = gb[node];
    if (!x || !y) {
      out.push({ kind: 'gate', node, before: x ?? null, after: y ?? null });
      continue;
    }
    if (x.layer !== y.layer) out.push({ kind: 'other', what: `the layer of ${node}’s gate` });
    const ma = modesOf(x);
    const mb = modesOf(y);
    for (const check of [...new Set([...Object.keys(ma), ...Object.keys(mb)])] as CheckName[]) {
      if (ma[check] !== mb[check] && ma[check] && mb[check]) out.push({ kind: 'check', node, check, before: ma[check]!, after: mb[check]! });
    }
    const written = (g: GateDef) => ({ scope: g.scope ?? null, needs: g.needs ?? null, reconcile: g.reconcile ?? null });
    if (!same(written(x), written(y))) out.push({ kind: 'other', what: `the written rules of ${node}’s gate` });
  }
  // The rules each check cell switched: a rule it doesn't list is on (Q-141).
  for (const step of [...new Set([...Object.keys(ra.switches), ...Object.keys(rb.switches)])].sort()) {
    const sa = ra.switches[step] ?? {};
    const sb = rb.switches[step] ?? {};
    for (const rule of [...new Set([...Object.keys(sa), ...Object.keys(sb)])]) {
      const before = sa[rule] ?? 'on';
      const after = sb[rule] ?? 'on';
      if (before !== after) out.push({ kind: 'switch', step, rule, before, after });
    }
  }
  if (!out.length) out.push({ kind: 'other', what: 'a part of the rules this list doesn’t name' });
  return out;
}

const percent = (x: number) => `${Math.round(x * 1000) / 10}%`;
const shareSaid = (s: [number, number] | null) => (s ? `${percent(s[0])}–${percent(s[1])}` : 'no band');

/** One difference in words, the ontology's titles and words for values as `o` (the later document's) has them. */
export function diffSaid(d: RuleDiff, o?: Ontology | null): string {
  switch (d.kind) {
    case 'rule': {
      const said = (r: OntologyRule) => `${ruleSaid(o ?? undefined, r)}, else ${ACTION_SAID[r.action]}`;
      const entries = d.before && d.after ? entriesSaid(o, d.before, d.after) : null;
      if (entries) return entries;
      if (!d.before) return `New rule on ${d.file}: ${said(d.after!)}`;
      if (!d.after) return `Rule taken out of ${d.file}: ${said(d.before)}`;
      return `Rule on ${d.file}: ${said(d.before)} → ${said(d.after)}`;
    }
    case 'band': {
      const word = o?.properties?.find((p) => lower(p.column) === lower(d.column) && p.values?.[d.value])?.values?.[d.value] ?? d.value;
      return `Band for ${d.title} ${word}${d.datasets?.length ? ` in ${d.datasets.join(', ')}` : ''}: ${shareSaid(d.before)} → ${shareSaid(d.after)}`;
    }
    case 'check':
      return `The ${d.check} check on ${d.node}: ${d.before} → ${d.after}`;
    case 'gate': {
      const own = (g: GateDef) => Object.entries(g.checks).map(([c, m]) => `${c} ${m}`).join(', ');
      if (!d.before) return `A gate on ${d.node}: ${d.after!.layer}${Object.keys(d.after!.checks).length ? `, ${own(d.after!)}` : ''}`;
      return `The gate on ${d.node} taken out (it was ${d.before.layer}${Object.keys(d.before.checks).length ? `, ${own(d.before)}` : ''})`;
    }
    case 'switch':
      return `${d.rule} in ${d.step}: ${d.before} → ${d.after}`;
    case 'type': {
      const said = (t: ObjectType) => `one row of ${t.dataset}, by ${t.key.join(', ')}`;
      if (!d.before) return `New kind ${d.after!.name}: ${said(d.after!)}`;
      if (!d.after) return `The kind ${d.before.name} ended${endedSaid(d.ended, (id) => o?.objectTypes.find((t) => t.id === id)?.name ?? id)}`;
      return `The kind ${d.after.name}: ${said(d.before)} → ${said(d.after)}${d.before.name !== d.after.name ? ` (it was called ${d.before.name})` : ''}`;
    }
    case 'link': {
      const name = (id: string) => o?.objectTypes.find((t) => t.id === id)?.name ?? id;
      const said = (l: LinkType) => `${name(l.from)} to ${name(l.to)}, on ${l.on.map(([x, y]) => (lower(x) === lower(y) ? x : `${x} = ${y}`)).join(' and ')}`;
      if (!d.before) return `New relation ${d.after!.name}: ${said(d.after!)}`;
      if (!d.after) return `The relation ${d.before.name} ended${endedSaid(d.ended, (id) => o?.linkTypes.find((l) => l.id === id)?.name ?? id)}`;
      return `The relation ${d.after.name}: ${said(d.before)} → ${said(d.after)}`;
    }
    case 'rows': {
      const name = (id: string) => o?.objectTypes.find((t) => t.id === id)?.name ?? id;
      const said = (r: RowsDef) => `${name(r.of)}${r.where ? `, where ${Object.entries(r.where).map(([c, v]) => `${c} ${(Array.isArray(v) ? v : [v]).join(' or ')}`).join(', and ')}` : ''}`;
      if (!d.before) return `What a row of ${d.dataset} is, said: ${said(d.after!)}`;
      if (!d.after) return `What a row of ${d.dataset} is, no longer said${endedSaid(d.ended)}`;
      return `What a row of ${d.dataset} is: ${said(d.before)} → ${said(d.after)}`;
    }
    case 'needs':
      if (!d.before) return `New dependency ${d.id} on ${d.after!.datasets.join(', ')}`;
      if (!d.after) return `The dependency ${d.id} ended${endedSaid(d.ended)}`;
      return `The dependency ${d.id} changed`;
    case 'meaning': {
      const where = d.datasets?.length ? ` in ${d.datasets.join(', ')}` : '';
      if (d.before === null) return `${d.title}${where} described: “${d.after}”`;
      if (d.after === null) return `${d.title}${where} no longer described (it was “${d.before}”)`;
      return `What ${d.title}${where} means: “${d.before}” → “${d.after}”`;
    }
    case 'awaited':
      if (!d.before) return `${d.after!.name} described ahead of its data: one row a ${d.after!.row.one}, by ${d.after!.key.join(', ')}`;
      if (!d.after) return d.ended ? `The description of ${d.before.name}, written ahead of its data, ended${endedSaid(d.ended, (id) => o?.awaited?.find((a) => lower(a.id) === lower(id))?.name ?? id)}` : `${d.before.name} no longer described ahead of its data`;
      return `${d.after.name}, described ahead of its data, described again`;
    case 'other':
      return `Changed: ${d.what}`;
  }
}

/** How a thing that ended goes on, in words: ": replaced by X", or nothing where it only ended. */
const endedSaid = (e: Ended | undefined, name: (id: string) => string = (id) => id): string => (e?.then ? `: ${e.then.how === 'replaced' ? 'replaced by' : e.then.how === 'merged' ? 'merged into' : 'split into'} ${listed(e.then.by.map(name))}` : '');
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * A closed list or column whose entries alone differ between two documents (ADR 0027 §4), in words: which entries were
 * declared, which are no longer in it, which changed in a defining column, which are left out until declared, and how
 * many it has. Null where the rule differs in anything else, which is said as any rule is: before and after.
 */
function entriesSaid(o: Ontology | null | undefined, before: OntologyRule, after: OntologyRule): string | null {
  if (before.kind !== 'closed' || after.kind !== 'closed') return null;
  const bare = ({ entries: _entries, leftOut: _leftOut, ...rest }: OntologyRule) => rest;
  if (!same(bare(before), bare(after))) return null;
  const was = new Map((before.entries ?? []).map((e) => [e[0] ?? '', e]));
  const now = new Map((after.entries ?? []).map((e) => [e[0] ?? '', e]));
  const meaning = propertyOf(o ?? undefined, after.file, after.column);
  const word = (k: string) => {
    const w = meaning?.values?.[k];
    return w && saysMore(w, k) ? `${w} (${k})` : k;
  };
  const outWas = new Set(before.leftOut ?? []);
  const outNow = new Set(after.leftOut ?? []);
  const parts = [
    [[...now.keys()].filter((k) => !was.has(k)), 'declared'],
    [[...was.keys()].filter((k) => !now.has(k)), 'no longer in it'],
    [[...now.keys()].filter((k) => was.has(k) && !same(was.get(k), now.get(k))), 'changed'],
    [[...outNow].filter((k) => !outWas.has(k)), 'left out until declared'],
    [[...outWas].filter((k) => !outNow.has(k) && !now.has(k)), 'no longer left out'],
  ].flatMap(([keys, said]) => ((keys as string[]).length ? [`${listed((keys as string[]).map(word))} ${said as string}`] : []));
  if (!parts.length) return null;
  const n = (r: OntologyRule) => (r.entries ?? []).length;
  const count = n(before) === n(after) ? `${n(after)} ${n(after) === 1 ? 'entry' : 'entries'}` : `${n(before)} → ${n(after)} entries`;
  return `The closed ${after.defines?.length ? 'list' : 'column'} ${meaning?.title ?? after.column} in ${after.file}: ${parts.join('; ')} (${count})`;
}

// ------------------------------------------------------------------ the map between two dates (ADR 0027 §9, Q-269)

/** How a kind or a relation stands between two dates: the same on both, new on the later, gone by it, or changed. */
export type MapState = 'same' | 'added' | 'ended' | 'changed';
/** A kind of thing on the map: a box. */
export interface MapKind {
  id: string;
  name: string;
  state: MapState;
}
/** A relation on the map: a line from one kind to another. */
export interface MapLink {
  id: string;
  name: string;
  from: string;
  to: string;
  state: MapState;
}

/**
 * The kinds and relations of two ontologies as one map (Q-269): every kind and relation either has, each marked the
 * same, new on the later one, gone by it, or changed (a kind's rows or key, a relation's ends or columns). Kinds in the
 * later ontology's order, those gone after; relations likewise. A relation is drawn where both its kinds are on the map.
 */
export function ontologyMap(a: Ontology | null | undefined, b: Ontology | null | undefined): { kinds: MapKind[]; links: MapLink[] } {
  const stateOf = (before: unknown, after: unknown): MapState => (before === undefined ? 'added' : after === undefined ? 'ended' : same(before, after) ? 'same' : 'changed');
  const ta = new Map((a?.objectTypes ?? []).map((t) => [t.id, t] as const));
  const tb = new Map((b?.objectTypes ?? []).map((t) => [t.id, t] as const));
  const kinds: MapKind[] = [...new Set([...tb.keys(), ...ta.keys()])].map((id) => ({ id, name: (tb.get(id) ?? ta.get(id))!.name, state: stateOf(ta.get(id), tb.get(id)) }));
  const la = new Map((a?.linkTypes ?? []).map((l) => [l.id, l] as const));
  const lb = new Map((b?.linkTypes ?? []).map((l) => [l.id, l] as const));
  const links: MapLink[] = [...new Set([...lb.keys(), ...la.keys()])].flatMap((id): MapLink[] => {
    const l = (lb.get(id) ?? la.get(id))!;
    return kinds.some((k) => k.id === l.from) && kinds.some((k) => k.id === l.to) ? [{ id, name: l.name, from: l.from, to: l.to, state: stateOf(la.get(id), lb.get(id)) }] : [];
  });
  return { kinds, links };
}

/** What a difference is about, as a key: the same thing differing between any two documents has the same key. */
export function diffKey(d: RuleDiff): string {
  switch (d.kind) {
    case 'rule':
      return `rule|${lower(d.file)}|${d.id}`;
    case 'band':
      return `band|${lower(d.column)}|${d.value}|${(d.datasets ?? []).map(lower).join(',')}`;
    case 'check':
      return `check|${lower(d.node)}|${d.check}`;
    case 'gate':
      return `gate|${lower(d.node)}`;
    case 'switch':
      return `switch|${lower(d.step)}|${d.rule}`;
    case 'type':
    case 'link':
    case 'needs':
    case 'awaited':
      return `${d.kind}|${lower(d.id)}`;
    case 'rows':
      return `rows|${lower(d.dataset)}`;
    case 'meaning':
      return `meaning|${lower(d.column)}|${(d.datasets ?? []).map(lower).join(',')}`;
    case 'other':
      return `other|${d.what}`;
  }
}

/**
 * Two dates compared (ADR 0027 §9: each line one thing, before and after, with its day and its kind): what differs
 * between the rules in force on day `a` and on day `b`, as known at `asOf` (none: now), each difference with the
 * change set that made it, the last of those in force on `b` and not on `a` whose own effect is on the same thing.
 * A difference no such change accounts for (one whose days ended between the two) has none.
 */
export function datedDiff(doc: FlowDocument, a: string, b: string, asOf?: string | null): { diff: RuleDiff; change: ChangeSet | null }[] {
  const before = inForce(doc, a, asOf);
  const after = inForce(doc, b, asOf);
  const diffs = rulesDiff(before, after);
  if (!diffs.length) return [];
  const on = changesOn(doc, b, asOf);
  const had = new Set(changesOn(doc, a, asOf).map((c) => c.id));
  const { changes: _changes, ...base } = doc;
  // Each change's own effect on day b: the rules with the changes up to it against the rules with those before it.
  const by = new Map<string, ChangeSet>();
  let prev = inForce({ ...base, changes: [] } as FlowDocument, b, asOf);
  on.forEach((c, k) => {
    const next = inForce({ ...base, changes: on.slice(0, k + 1) } as FlowDocument, b, asOf);
    if (!had.has(c.id)) for (const d of rulesDiff(prev, next)) by.set(diffKey(d), c);
    prev = next;
  });
  return diffs.map((diff) => ({ diff, change: by.get(diffKey(diff)) ?? null }));
}
