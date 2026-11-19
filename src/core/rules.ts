/**
 * Rules people set on a file's columns (ADR 0015 amendment 1, piece b; Q-140 to Q-143): kept in the ontology, each one
 * file's own, enforced when the file comes into a flow. A rule says what a column must hold (a value, one of some
 * values, a number in a range, or one of some values where another column has one of its own) and what a row that
 * breaks it does: it is flagged and kept, left out, or holds the day. The ontology is where a rule is defined, once; the
 * notebook is where it is switched (Q-148): the check cell that enforces its file lists the file's rules, each `'on'` or
 * `'off'` (`ontology: { … }`), the file's import card writes that list, and a change to the ontology writes it again
 * in every check cell that reads the file (`syncRuleCells`, gatecell.ts). A rule runs once it is set (Q-141): one the
 * cell doesn't list yet is on, and an entry for a rule the ontology no longer has says nothing.
 *
 * A rule is enforced by the check step that reads its file directly: `translate` (plan.ts) adds it to that step's rules
 * by its id, written for the engine by `emitRuleCheck` (emit.ts), so the run counts it, the manifest keeps its count,
 * verify counts it again and a broken `hold` rule holds the day, as every rule of a check step does. A file no check
 * step reads directly has its rules said and not enforced (`checkStepOf` is null), and the page says so.
 *
 * A closed list or column (ADR 0027 §4, kind `closed`) is the ontology first: the rule keeps every entry the ontology
 * has accepted, and a row whose entry it doesn't have stops the day until a person declares the entry, leaves it out or
 * doesn't publish. A closed column's entries are its values; a closed list's are its key with the columns that define
 * an entry. `leftOut` names the keys a decision leaves out until they are declared: their rows are kept out of what
 * goes on (`aside`, plan.ts) and aren't counted among the rows the rules dropped.
 *
 * Pure: no DOM, no engine.
 */
import type { FlowDocument, StepDef } from './document.js';
import { emitLeftOut, emitRuleCheck } from './emit.js';
import { meaningOf, propertyOf, type Ontology } from './ontology.js';

/** What a rule asks of its column: a value on every row, one of some values, a number from `min` to `max`, one of some
 * values on the rows where another column has one of its own, or an entry the ontology has accepted (`closed`). */
export const RULE_KINDS = ['required', 'oneOf', 'range', 'when', 'closed'] as const;
export type OntologyRuleKind = (typeof RULE_KINDS)[number];

/** What a row that breaks the rule does: flagged and kept, left out of what goes on, or holds the day. */
export const RULE_ACTIONS = ['flag', 'drop', 'hold'] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];

/** A rule's action as the check step's rules have it. */
export const ON_FAIL: Record<RuleAction, 'warn' | 'drop' | 'fail'> = { flag: 'warn', drop: 'drop', hold: 'fail' };

/** What a closed rule's left-out rows are named among its check step's rules: `<id>_left_out`. No rule's own id ends so. */
export const LEFT_OUT = '_left_out';
export const leftOutName = (id: string): string => `${id}${LEFT_OUT}`;

/** What each action does, in words, for the form and the card. */
export const ACTION_SAID: Record<RuleAction, string> = {
  flag: 'flag the row and keep it',
  drop: 'leave the row out',
  hold: 'hold the day',
};

/** A rule as the ontology keeps it. */
export interface OntologyRule {
  /** Its name, unique among the rules of its file and of the check step that reads the file: what the run's counts and
   * the history call it (`user_required`). */
  id: string;
  /** The source whose rows it is about. */
  file: string;
  /** The column it asks something of, as the file writes it. */
  column: string;
  kind: OntologyRuleKind;
  /** `oneOf` and `when`: the values the column may hold, as the file writes them. */
  values?: string[];
  /** `range`: the lowest and highest the column may hold; either may be left out. */
  min?: number;
  max?: number;
  /** `when`: the rows the rule is about, by another column's values. */
  when?: { column: string; values: string[] };
  /** `closed`: the columns that define an entry beside its key (`column`): a control's weight, what it applies to. None
   * for a closed column, whose entries are its values. */
  defines?: string[];
  /** `closed`: the entries the ontology has accepted, each its key and then its defining columns' values, as the file
   * writes them (a blank is ''). */
  entries?: string[][];
  /** `closed`: the keys left out of what goes on until they are declared (Q-253, "Publish without it"). */
  leftOut?: string[];
  action: RuleAction;
}

/** A rule's settings: any other is refused by name. */
export const RULE_FIELDS = ['id', 'file', 'column', 'kind', 'values', 'min', 'max', 'when', 'defines', 'entries', 'leftOut', 'action'] as const;

type RulesDoc = Pick<FlowDocument, 'sources'> & Partial<Pick<FlowDocument, 'steps' | 'ontology'>>;

const lower = (x: string) => x.toLowerCase();
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const values = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x !== '') && new Set(v).size === v.length;

/** A file's rules in the ontology's order. */
export function rulesOf(o: Ontology | undefined, file: string): OntologyRule[] {
  return (o?.rules ?? []).filter((r) => lower(r.file) === lower(file));
}

/** Whether a check step's cell has a rule switched on: what it writes, else on (Q-141). */
export const ruleOn = (step: StepDef | null | undefined, id: string): boolean => !(step?.kind === 'expectations' && step.ontology?.[id] === 'off');

/** What a check step's cell should say of its file's rules: every rule the ontology has, in its order, as the cell had it
 * (on where it said nothing), with `set` applied. Null when the file has no rule (the cell says nothing). */
export function switchesFor(doc: RulesDoc, step: StepDef, set: Record<string, 'on' | 'off'> = {}): Record<string, 'on' | 'off'> | null {
  if (step.kind !== 'expectations' || step.inputs.length !== 1) return null;
  const file = fileOfCheck(doc, step);
  if (!file) return null;
  const rules = rulesOf(doc.ontology, file);
  if (!rules.length) return null;
  return Object.fromEntries(rules.map((r) => [r.id, set[r.id] ?? (ruleOn(step, r.id) ? 'on' : 'off')]));
}

/** The check step that enforces a file's rules: the first, in the flow's order, whose one input is the file itself, or
 * the fill step that reads it (a fill passes the file's rows on, marked). */
export function checkStepOf(doc: RulesDoc, file: string): StepDef | null {
  const fills = new Set((doc.steps ?? []).filter((s) => s.kind === 'fill' && lower(s.inputs[0] ?? '') === lower(file)).map((s) => lower(s.id)));
  return (doc.steps ?? []).find((s) => s.kind === 'expectations' && s.inputs.length === 1 && (lower(s.inputs[0]!) === lower(file) || fills.has(lower(s.inputs[0]!)))) ?? null;
}

/**
 * The fixes a held day of a file may be offered (the maintainer, 2026-11-11: "so if imputation is never an option, it
 * won't try to suggest doing that"): carry the nearest good day before forward (`forward`), carry the nearest good day
 * after back (`backward`), stand in a like day, the same weekday, for what is missing (`impute`, an estimate), publish the
 * part that arrived alone (`part`), and replace the day's file with a corrected one (`replace`). Publishing as is and
 * keeping the last good day are the decision itself, always there.
 */
export const FIX_KINDS = ['forward', 'backward', 'impute', 'part', 'replace'] as const;
export type FixKind = (typeof FIX_KINDS)[number];

/** What each fix does, in a few words. */
export const FIX_SAID: Record<FixKind, string> = {
  forward: 'carry the last good day forward',
  backward: 'carry the next good day back',
  impute: 'stand in a like day (an estimate)',
  part: 'publish the part that arrived',
  replace: 'replace the file with a corrected one',
};

/** The fixes a file allows: the ontology's list for it, else every one. */
export function fixesOf(o: Ontology | undefined, file: string): ReadonlySet<FixKind> {
  const listed = Object.entries(o?.fixes ?? {}).find(([f]) => lower(f) === lower(file))?.[1];
  return new Set(listed ?? FIX_KINDS);
}

/** The fix a donor gives: the same weekday stands in a like day (an estimate); the nearest day before or after carries
 * that day forward or back. */
export const fixOfDonor = (pick: { rule: 'weekday' | 'nearest'; direction: 'before' | 'after' }): FixKind => (pick.rule === 'weekday' ? 'impute' : pick.direction === 'before' ? 'forward' : 'backward');

/** The file a check step reads: its input, or the file the fill it reads fills. */
function fileOfCheck(doc: RulesDoc, step: StepDef): string | null {
  const input = step.inputs[0];
  if (!input) return null;
  const direct = doc.sources.find((s) => lower(s.id) === lower(input));
  if (direct) return direct.id;
  const fill = (doc.steps ?? []).find((s) => s.kind === 'fill' && lower(s.id) === lower(input));
  return doc.sources.find((s) => lower(s.id) === lower(fill?.inputs[0] ?? ''))?.id ?? null;
}

/** The rules a check step enforces beside its own: the ones its cell has switched on of the file it reads, if it is
 * that file's check step. */
export function enforcedBy(doc: RulesDoc, step: StepDef): OntologyRule[] {
  if (step.kind !== 'expectations' || step.inputs.length !== 1) return [];
  const file = fileOfCheck(doc, step);
  if (!file || checkStepOf(doc, file)?.id !== step.id) return [];
  return rulesOf(doc.ontology, file).filter((r) => ruleOn(step, r.id));
}

/**
 * An ontology rule as its check step's rules have it: its own, by its id, and, for a closed rule with keys left out,
 * the rule that keeps their rows out of what goes on (`<id>_left_out`, `aside`).
 */
export function engineRules(r: OntologyRule): { name: string; check: string; onFail: 'warn' | 'drop' | 'fail' | 'aside' }[] {
  const own = { name: r.id, check: emitRuleCheck(r), onFail: ON_FAIL[r.action] };
  return r.kind === 'closed' && r.leftOut?.length ? [own, { name: leftOutName(r.id), check: emitLeftOut(r.column, r.leftOut), onFail: 'aside' as const }] : [own];
}

/** A check step's rules as its counts name them: its own as written, then the ontology's it enforces, by name, as the
 * engine reads them. What a history and a load's measures record of the step's checks. */
export function stepRules(doc: RulesDoc, step: StepDef): { name: string; check: string; onFail: 'warn' | 'drop' | 'fail' | 'aside' }[] {
  if (step.kind !== 'expectations') return [];
  return [...step.rules.map((r) => ({ name: r.name, check: r.check, onFail: r.onFail })), ...enforcedBy(doc, step).flatMap(engineRules)];
}

// ------------------------------------------------------------------ closed lists and columns (ADR 0027 §4)

/** A file's closed rules: the lists and columns the ontology closes, in its order. */
export const closedOf = (o: Ontology | undefined, file: string): OntologyRule[] => rulesOf(o, file).filter((r) => r.kind === 'closed');

/** Whether a closed rule closes a list (its entries have columns that define them) rather than a column. */
export const isList = (r: Pick<OntologyRule, 'defines'>): boolean => (r.defines?.length ?? 0) > 0;

/** The entry a closed rule has under a key, as the file writes it; none where the ontology doesn't have the key. */
export const entryOf = (r: Pick<OntologyRule, 'entries'>, key: string): string[] | undefined => (r.entries ?? []).find((e) => e[0] === key);

/** Where an arrival stands against a closed rule: `new` where the ontology has no entry under its key, `changed` where
 * it has one whose defining columns differ, `declared` where it has this very entry. */
export function arrivalOf(r: Pick<OntologyRule, 'entries'>, entry: readonly string[]): 'new' | 'changed' | 'declared' {
  const has = entryOf(r, entry[0] ?? '');
  return !has ? 'new' : has.length === entry.length && has.every((v, k) => v === entry[k]) ? 'declared' : 'changed';
}

/**
 * What differs between the entry the ontology has and the one that arrived, by defining column: `[column, was, now]`.
 * Empty for a new entry, and for a closed column.
 */
export function entryDiff(r: Pick<OntologyRule, 'defines' | 'entries'>, entry: readonly string[]): [column: string, was: string, now: string][] {
  const has = entryOf(r, entry[0] ?? '');
  if (!has) return [];
  return (r.defines ?? []).flatMap((c, k): [string, string, string][] => ((has[k + 1] ?? '') === (entry[k + 1] ?? '') ? [] : [[c, has[k + 1] ?? '', entry[k + 1] ?? '']]));
}

/** "A", "A or B", "A, B or C". */
const either = (xs: readonly string[], word = 'or') => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${word} ${xs.at(-1)}`);
const num = (x: number) => (Number.isInteger(x) ? x.toLocaleString('en-US') : String(x));

/** A rule in plain words, with the ontology's titles and words for values: "Result is Signed in, Failed or Locked out". */
export function ruleSaid(o: Ontology | undefined, r: Pick<OntologyRule, 'file' | 'column' | 'kind' | 'values' | 'min' | 'max' | 'when' | 'defines' | 'entries' | 'leftOut'>): string {
  const title = (c: string) => propertyOf(o, r.file, c)?.title ?? c;
  const word = (c: string, v: string) => meaningOf(propertyOf(o, r.file, c), v) ?? v;
  const these = (c: string, vs: readonly string[] = []) => either(vs.map((v) => word(c, v)));
  switch (r.kind) {
    case 'required':
      return `${title(r.column)} is never blank`;
    case 'oneOf':
      return `${title(r.column)} is ${these(r.column, r.values)}`;
    case 'range': {
      const unit = propertyOf(o, r.file, r.column)?.unit;
      const u = unit ? ` ${unit}` : '';
      return r.min !== undefined && r.max !== undefined ? `${title(r.column)} is from ${num(r.min)} to ${num(r.max)}${u}`
        : r.min !== undefined ? `${title(r.column)} is ${num(r.min)}${u} or more`
        : `${title(r.column)} is ${num(r.max ?? 0)}${u} or less`;
    }
    case 'when':
      return `Where ${title(r.when?.column ?? '')} is ${these(r.when?.column ?? '', r.when?.values)}, ${title(r.column)} is ${these(r.column, r.values)}`;
    case 'closed': {
      // A closed column lists its values while they are few; a closed list counts its entries and names what defines one.
      const keys = (r.entries ?? []).map((e) => e[0] ?? '');
      const n = keys.length;
      const out = r.leftOut?.length ? `; ${either(r.leftOut.map((k) => word(r.column, k)), 'and')} left out until declared` : '';
      if (!r.defines?.length) return `${title(r.column)} is ${n === 0 ? 'a value the ontology has (it has none yet)' : n <= SAID_VALUES ? `${these(r.column, keys)}, and nothing the ontology doesn’t have` : `one of the ${num(n)} values the ontology has`}${out}`;
      return `${title(r.column)} is one of the ${num(n)} ${n === 1 ? 'entry' : 'entries'} the ontology has, each with its ${either(r.defines.map(title), 'and')} as declared${out}`;
    }
  }
}

/** How many values a closed column's rule lists in words before it counts them. */
const SAID_VALUES = 8;

/** A name for a new rule of a file, free among its rules and its check step's: `<column>_<kind>`, then `_2`, `_3`. */
export function newRuleId(doc: RulesDoc, file: string, column: string, kind: OntologyRuleKind): string {
  const step = checkStepOf(doc, file);
  const taken = new Set([...rulesOf(doc.ontology, file).map((r) => lower(r.id)), ...(step?.kind === 'expectations' ? step.rules.map((r) => lower(r.name)) : [])]);
  const base = `${column.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'column'}_${kind === 'oneOf' ? 'one_of' : kind}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}_${n}`)) return `${base}_${n}`;
}

/**
 * Problems with the ontology's rules, as `[path, message]`, for validateDocument: each rule's settings, its file a
 * source, its id free among its file's rules and its check step's own, and what its kind needs and nothing else.
 */
export function rulesIssues(doc: { sources?: unknown; steps?: unknown; smaltfl?: unknown }, rules: unknown): [path: string, message: string][] {
  const out: [string, string][] = [];
  const add = (path: string, message: string) => out.push([path, message]);
  if (!Array.isArray(rules)) return [['$.ontology.rules', 'a list of rules: { id, file, column, kind, action, ... }']];
  const sources = (Array.isArray(doc.sources) ? doc.sources : []).filter((s): s is { id: string } => isRecord(s) && typeof s.id === 'string');
  const steps = (Array.isArray(doc.steps) ? doc.steps : []).filter((s): s is StepDef => isRecord(s) && typeof s.id === 'string' && Array.isArray(s.inputs));
  const ids = new Map<string, Set<string>>();
  rules.forEach((r: unknown, i: number) => {
    const at = `$.ontology.rules[${i}]`;
    if (!isRecord(r)) return add(at, '{ id, file, column, kind, action }');
    for (const k of Object.keys(r)) {
      if (k === 'off') add(`${at}.off`, "a rule is switched in the check cell that enforces its file (ontology: { name: 'off' }), not in the ontology");
      else if (!(RULE_FIELDS as readonly string[]).includes(k)) add(`${at}.${k}`, `${k} isn't a rule's setting (${RULE_FIELDS.join(', ')}): refused rather than ignored`);
    }
    if (typeof r.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(r.id)) add(`${at}.id`, 'a name of letters, digits and underscores, starting with a letter');
    else if (lower(r.id).endsWith(LEFT_OUT)) add(`${at}.id`, `a name ending ${LEFT_OUT} is what a closed rule calls the rows it leaves out`);
    if (typeof r.file !== 'string' || !sources.some((s) => lower(s.id) === lower(r.file as string))) add(`${at}.file`, `no source ${String(r.file)}: a rule is a file’s own`);
    if (typeof r.column !== 'string' || r.column === '') add(`${at}.column`, 'the column it is about, as the file writes it');
    if (!(RULE_KINDS as readonly unknown[]).includes(r.kind)) add(`${at}.kind`, RULE_KINDS.join(', '));
    if (!(RULE_ACTIONS as readonly unknown[]).includes(r.action)) add(`${at}.action`, `${RULE_ACTIONS.join(', ')}: what a row that breaks it does`);
    const needs = (field: 'values' | 'min' | 'max' | 'when' | 'defines' | 'entries' | 'leftOut', wanted: boolean) => {
      if (!wanted && r[field] !== undefined) add(`${at}.${field}`, `a ${String(r.kind)} rule has no ${field}`);
    };
    if (r.kind === 'oneOf' || r.kind === 'when') {
      if (!values(r.values)) add(`${at}.values`, 'the values the column may hold, each once');
    } else needs('values', false);
    if (r.kind === 'range') {
      const n = (x: unknown) => x === undefined || (typeof x === 'number' && Number.isFinite(x));
      if (!n(r.min)) add(`${at}.min`, 'a number');
      if (!n(r.max)) add(`${at}.max`, 'a number');
      if (r.min === undefined && r.max === undefined) add(at, 'a range needs a lowest (min), a highest (max) or both');
      if (typeof r.min === 'number' && typeof r.max === 'number' && r.min > r.max) add(`${at}.max`, `${r.max} is below the lowest, ${r.min}`);
    } else (needs('min', false), needs('max', false));
    if (r.kind === 'closed') {
      // A closed list or column (ADR 0027 §4): the entries the ontology has, each its key and what defines it, and it
      // holds: what the ontology doesn't have waits for a person. Its arrivals are named by a plan of a notebook flow.
      if (typeof doc.smaltfl === 'number' && doc.smaltfl < 4) add(`${at}.kind`, 'a closed list or column is a notebook flow’s (format 4 or later)');
      const names = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string' && x !== '') && new Set(v.map((x) => lower(x as string))).size === v.length;
      const defines = r.defines === undefined ? [] : r.defines;
      if (!names(defines)) add(`${at}.defines`, 'the columns that define an entry beside its key, each once');
      else if (typeof r.column === 'string' && defines.some((c) => lower(c) === lower(r.column as string))) add(`${at}.defines`, `${r.column} is the entry’s key: the columns that define it are the others`);
      const width = 1 + (names(defines) ? defines.length : 0);
      if (!Array.isArray(r.entries)) add(`${at}.entries`, 'the entries the ontology has: each its key, then what its defining columns hold');
      else {
        const seen = new Set<string>();
        r.entries.forEach((e: unknown, k: number) => {
          if (!Array.isArray(e) || e.length !== width || e.some((v) => typeof v !== 'string') || e[0] === '') return add(`${at}.entries[${k}]`, `its key, then ${width - 1} value${width === 2 ? '' : 's'}: one for each column that defines it`);
          if (seen.has(e[0] as string)) add(`${at}.entries[${k}]`, `${String(e[0])} is declared twice`);
          seen.add(e[0] as string);
        });
      }
      if (r.leftOut !== undefined && (!Array.isArray(r.leftOut) || r.leftOut.length === 0 || r.leftOut.some((x) => typeof x !== 'string' || x === '') || new Set(r.leftOut).size !== r.leftOut.length)) add(`${at}.leftOut`, 'the keys left out until they are declared, each once; absent when there are none');
      if (r.action !== undefined && r.action !== 'hold') add(`${at}.action`, 'hold: what the ontology doesn’t have waits for a person, who declares it, leaves it out or doesn’t publish');
    } else (needs('defines', false), needs('entries', false), needs('leftOut', false));
    if (r.kind === 'when') {
      const w = r.when;
      if (!isRecord(w) || typeof w.column !== 'string' || w.column === '' || !values(w.values)) add(`${at}.when`, '{ column, values }: the rows it is about, by another column’s values');
      else if (typeof r.column === 'string' && lower(w.column) === lower(r.column)) add(`${at}.when.column`, 'another column than the one the rule asks something of');
    } else needs('when', false);
    if (typeof r.id === 'string' && typeof r.file === 'string') {
      const file = lower(r.file);
      const seen = ids.get(file) ?? new Set<string>();
      if (seen.has(lower(r.id))) add(`${at}.id`, `${r.file} has two rules named ${r.id} (names are compared without case)`);
      seen.add(lower(r.id));
      ids.set(file, seen);
      const step = checkStepOf({ sources: sources as RulesDoc['sources'], steps }, r.file);
      if (step?.kind === 'expectations' && Array.isArray(step.rules) && step.rules.some((x) => isRecord(x) && typeof x.name === 'string' && lower(x.name) === lower(r.id as string))) add(`${at}.id`, `${step.id}, the check step that enforces ${r.file}'s rules, has a rule of its own named ${r.id}`);
    }
  });
  return out;
}
