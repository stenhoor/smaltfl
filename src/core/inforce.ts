/**
 * The rules over time (ADR 0021 §5, Q-184, Q-189, Q-190). A flow keeps its base (the document's own rules) and dated
 * change sets (`FlowDocument.changes`); the rules in force on a day, as known at a moment, are the base with every
 * change set from that day or before, recorded by then, applied in the order they were recorded.
 *
 * - `applyEdit`: one edit replayed by the pure function that made it in the app (flowedit.ts, gatecell.ts), on
 *   whatever document it meets; null where it doesn't apply there (a rule it names isn't the file's then, a column the
 *   ontology doesn't describe, a node with no notebook cell) or changes nothing.
 * - `changesOn`, `resolve`, `inForce`: the change sets in force on a day, and the document they make, without its change
 *   sets: what a plan is made from (`translate` and `runFlow` resolve a document for its run's day first).
 * - `rulesHash`: one hash for the rules in force, under the tag `rules/1` (ADR 0021 §5; its test vectors are in
 *   test/inforce.test.ts and the ADR): the ontology, the gates, and the rule switches written in the check cells.
 *   Every run's manifest names it (`flow.rules`).
 * - `dayOf`: the day a run is of, from its parameters.
 */
import { canonicalJSON } from './canonical.js';
import { periodOf, type CellRef, type ChangeSet, type FlowDocument, type NotebookDef, type NotebookOutline, type RuleEdit, type StepDef } from './document.js';
import { applyBand, nameColumn, removeRule, setRule, switchRule } from './flowedit.js';
import { toggleCheck } from './gatecell.js';
import { gateChecksOf, type GateDef } from './gates.js';
import { hashOf } from './hash.js';
import type { Ontology } from './ontology.js';
import type { ParamValue } from './sqltext.js';

/** A check set on a gate, in words, as the app records it. */
const checkSaid = (e: Extract<RuleEdit, { op: 'setCheck' }>, was: string | undefined) => `Set the ${e.check} check on ${e.node} to ${e.mode}${was ? ` (it was ${was})` : ''}`;

function edited(doc: FlowDocument, edit: RuleEdit): { doc: FlowDocument; said: string | null } | null {
  switch (edit.op) {
    case 'setRule': {
      const r = setRule(doc, edit.rule, true);
      return 'problem' in r ? null : r;
    }
    case 'removeRule':
      return removeRule(doc, edit.file, edit.id);
    case 'switchRule':
      return switchRule(doc, edit.file, edit.id, edit.on);
    case 'nameColumn':
      return nameColumn(doc, edit.file, edit.column, edit.change);
    case 'acceptBand':
      return applyBand(doc, edit.source, edit.band);
    case 'setCheck': {
      const was = gateChecksOf(doc, edit.node)?.[edit.check];
      if (was === edit.mode) return null;
      return { doc: toggleCheck(doc, edit.node, edit.check, edit.mode).doc, said: checkSaid(edit, was) };
    }
  }
}

/**
 * One edit replayed on a document (ADR 0021 §5): the document with it, and the change in words, as the app recorded it
 * when it was made; null where it doesn't apply to this document or changes none of its rules in force.
 */
export function applyEdit(doc: FlowDocument, edit: RuleEdit): { doc: FlowDocument; said: string } | null {
  let r: ReturnType<typeof edited>;
  try {
    r = edited(doc, edit);
  } catch {
    // A gate cell can't be written where no notebook cell defines the node (gatecell.ts): it doesn't apply here.
    return null;
  }
  if (!r || !r.said) return null;
  return canonicalJSON(rulesInForce(r.doc)) === canonicalJSON(rulesInForce(doc)) ? null : { doc: r.doc, said: r.said };
}

/** A business day as change sets are dated by: a slot's day (ADR 0010 §7) is its day. */
const dayPart = (day: string) => day.slice(0, 10);

/**
 * The change sets in force on a day, as known at a moment: from that day or before, recorded by then (`asOf`, an ISO
 * time; none: all of them), in the order they were recorded, change sets recorded at the same moment in the order the
 * document lists them. `day` null (a run of no day): every change set recorded by then.
 */
export function changesOn(doc: Pick<FlowDocument, 'changes'>, day: string | null, asOf?: string | null): ChangeSet[] {
  const at = asOf ? Date.parse(asOf) : null;
  return (doc.changes ?? [])
    .map((c, i) => ({ c, i, t: Date.parse(c.recorded) }))
    .filter(({ c, t }) => (day === null || c.from <= dayPart(day)) && (at === null || t <= at))
    .sort((x, y) => x.t - y.t || x.i - y.i)
    .map(({ c }) => c);
}

/** A change set as it applied to a day's rules: what each of its edits did, in words, and how many didn't apply. */
export interface Applied {
  change: ChangeSet;
  said: string[];
  passed: number;
}

/**
 * The rules in force on a day as known at a moment (ADR 0021 §5): the document without its change sets, every change set
 * in force (`changesOn`) applied in turn, each edit to the document as it stands then; and what each did. An edit that
 * doesn't apply then is passed over, and counted.
 */
export function resolve(doc: FlowDocument, day: string | null, asOf?: string | null): { doc: FlowDocument; applied: Applied[] } {
  if (doc.changes === undefined) return { doc, applied: [] };
  const { changes: _changes, ...base } = doc;
  let out = base as FlowDocument;
  const applied: Applied[] = [];
  for (const change of changesOn(doc, day, asOf)) {
    const said: string[] = [];
    let passed = 0;
    for (const e of change.edits) {
      const r = applyEdit(out, e);
      if (!r) passed++;
      else {
        out = r.doc;
        said.push(r.said);
      }
    }
    applied.push({ change, said, passed });
  }
  return { doc: out, applied };
}

/** The rules in force on a day as known at a moment: `resolve`'s document. A document with no change sets is itself. */
export const inForce = (doc: FlowDocument, day: string | null, asOf?: string | null): FlowDocument => resolve(doc, day, asOf).doc;

/** What `rulesHash` covers: the ontology, the gates, and each check step's rule switches (only those that list any). */
export interface RulesInForce {
  ontology: Ontology | null;
  gates: Record<string, GateDef> | null;
  switches: Record<string, Record<string, 'on' | 'off'>>;
}

/** A document's rules as they stand (one with change sets: its base's). */
export function rulesInForce(doc: Pick<FlowDocument, 'ontology' | 'gates' | 'steps'>): RulesInForce {
  const switches: Record<string, Record<string, 'on' | 'off'>> = {};
  for (const s of doc.steps ?? []) if (s.kind === 'expectations' && s.ontology && Object.keys(s.ontology).length) switches[s.id] = s.ontology;
  return { ontology: doc.ontology ?? null, gates: doc.gates ?? null, switches };
}

/** The rules-in-force hash (ADR 0021 §5): SHA-256 of `smaltfl/rules/1`, a newline and `rulesInForce`'s canonical JSON. */
export const rulesHash = (doc: Pick<FlowDocument, 'ontology' | 'gates' | 'steps'>): Promise<string> => hashOf('rules/1', rulesInForce(doc));

/** The parameter whose value is a run's day: the publish block's period, else the one period its watches name. */
export function dayParameter(doc: Pick<FlowDocument, 'publish'>): string | null {
  const p = doc.publish;
  if (!p) return null;
  if (typeof p.period === 'string') return p.period;
  const named = [...new Set(Object.keys(p.watch ?? {}).map((id) => periodOf(doc, id)).filter((x): x is string => x !== undefined))];
  return named.length === 1 ? named[0]! : null;
}

/** The day a run is of: its day parameter's value (else the parameter's default), as a day; null where it has none. */
export function dayOf(doc: Pick<FlowDocument, 'publish' | 'parameters'>, values: Readonly<Record<string, ParamValue>>): string | null {
  const name = dayParameter(doc);
  if (!name) return null;
  const v = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : doc.parameters?.find((p) => p.name === name)?.default;
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? dayPart(v) : null;
}

/**
 * The parts of a document the rules people set are written in (ADR 0021 §5): the ontology, the gates, the notebooks
 * (whose gate and check cells the edits rewrite), the cell refs and outline that follow those cells, and each check
 * step's rule switches. The page keeps them apart from the rest of the document, which step and display edits change,
 * so the rules of any day can be made from its base and change sets with the steps and layout as they are now.
 */
export interface RuleParts {
  ontology?: Ontology;
  gates?: Record<string, GateDef>;
  notebooks?: NotebookDef[];
  cells?: Record<string, CellRef>;
  outline?: NotebookOutline[];
  switches: Record<string, Record<string, 'on' | 'off'>>;
}

const PART_FIELDS = ['ontology', 'gates', 'notebooks', 'cells', 'outline'] as const;

/** A document's rule parts. */
export function ruleParts(doc: FlowDocument): RuleParts {
  const out: RuleParts = { switches: rulesInForce(doc).switches };
  for (const k of PART_FIELDS) if (doc[k] !== undefined) (out as unknown as Record<string, unknown>)[k] = doc[k];
  return out;
}

/** A document with other rule parts: its own fields but those, each check step's switches as the parts have them (none
 * where they have none). */
export function withRuleParts(doc: FlowDocument, parts: RuleParts): FlowDocument {
  const rest = { ...doc } as Record<string, unknown>;
  for (const k of PART_FIELDS) {
    if (parts[k] === undefined) delete rest[k];
    else rest[k] = parts[k];
  }
  rest.steps = doc.steps.map((s): StepDef => {
    if (s.kind !== 'expectations') return s;
    const own = parts.switches[s.id];
    if (own) return { ...s, ontology: own };
    if (s.ontology === undefined) return s;
    const { ontology: _ontology, ...bare } = s;
    return bare;
  });
  return rest as unknown as FlowDocument;
}
