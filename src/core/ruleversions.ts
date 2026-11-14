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
import { canonicalJSON } from './canonical.js';
import type { FlowDocument } from './document.js';
import { LAYER_DEFAULTS, type CheckMode, type CheckName, type GateDef } from './gates.js';
import { changesOn, rulesInForce } from './inforce.js';
import type { Band, Ontology, PropertyType } from './ontology.js';
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
export function ruleVersions(doc: Pick<FlowDocument, 'changes'>, days: readonly string[]): RuleVersion[] {
  const moments = [...new Set((doc.changes ?? []).map((c) => Date.parse(c.recorded)))].sort((a, b) => a - b);
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
export const versionOn = (doc: Pick<FlowDocument, 'changes'>, day: string | null, asOf?: string | null): string => versionKey(changesOn(doc, day, asOf).map((c) => c.id));

/** One thing two documents' rules in force differ in. */
export type RuleDiff =
  | { kind: 'rule'; file: string; id: string; before: OntologyRule | null; after: OntologyRule | null }
  | { kind: 'band'; column: string; title: string; value: string; datasets: string[] | null; before: [number, number] | null; after: [number, number] | null }
  | { kind: 'check'; node: string; check: CheckName; before: CheckMode; after: CheckMode }
  | { kind: 'gate'; node: string; before: GateDef | null; after: GateDef | null }
  | { kind: 'switch'; step: string; rule: string; before: 'on' | 'off'; after: 'on' | 'off' }
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
    case 'other':
      return `Changed: ${d.what}`;
  }
}
