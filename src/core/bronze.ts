/**
 * A bronze file's quality for a day, as one list of checks (ADR 0015 amendment 2, Q-160): every check the ontology
 * (or the file's gate cell) defines for the file, as the Ontology page lists them (`ontologyPage`), with the same ids;
 * the file's contract (its columns and types, its amount, its blanks); and what the gate learns from the file's
 * history. Each check has its mode from the gate, its state for the day from the day's findings (and, for a check
 * people set, the rows the check step counted), and the findings that make it so. The verdict says, in one word, what
 * the file's quality is today: clean, something to look at, or something that holds the day.
 *
 * There are no "rules" beside the checks: a rule people set on a column (`set`) is a check like any other, run by the
 * check step that reads the file. Pure: what the card's Quality tab and its notebook draw.
 */
import { checkOf, type CheckMode, type CheckName, type GateChecks } from './gates.js';
import type { Finding } from './news.js';
import type { FileSection, Rule, RuleKind } from './ontologypage.js';
import type { OntologyRule } from './rules.js';

export type CheckState = 'ok' | 'warn' | 'alert' | 'off' | 'unjudged';

export interface BronzeCheck {
  /** The Ontology page's id for a check it lists (`<file>/<column>/band=<value>`, …), so each links to the other;
   * `<file>/~<check>` for the file's contract and what is learned, which the ontology doesn't write. */
  id: string;
  /** The gate's check that judges it, and so its mode. */
  check: CheckName;
  /** Where it comes from: the ontology (or the gate cell), the file's contract, or the file's history. */
  from: 'ontology' | 'contract' | 'learned';
  kind: RuleKind | 'contract' | 'learned';
  said: string;
  /** The column it is about, where it is about one. */
  column?: string;
  mode: CheckMode;
  /** Why it isn't judged as the flow stands: switched off, nothing watches the file, another check judges it instead. */
  why?: string;
  state: CheckState;
  findings: Finding[];
  /** A check people set (`set`): the rows that broke it in the run, as the check step counted them. */
  failed?: number;
  def?: OntologyRule;
}

export interface Bronze {
  file: string;
  /** clean: every judged check passed; look: something unusual; hold: a check that holds found something wrong;
   * unjudged: nothing could be judged (no history for the day, no run). */
  verdict: 'clean' | 'look' | 'hold' | 'unjudged';
  /** The checks with something wrong, the worst first; then the ones with something unusual. */
  wrong: BronzeCheck[];
  unusual: BronzeCheck[];
  /** Every check, in the ontology's order, then the contract's, then what is learned. */
  checks: BronzeCheck[];
  passed: number;
  judged: number;
}

/** The gate's check that judges each kind of check the ontology writes. */
export const CHECK_OF_KIND: Record<RuleKind, CheckName> = {
  rows: 'reconcile', covers: 'scope', key: 'reconcile', same: 'reconcile', needs: 'needs', values: 'values', bad: 'shares', band: 'values', due: 'due', after: 'shape', set: 'rules',
};

/** The file's contract: checks every file has, which the ontology doesn't write one by one. */
export const CONTRACT: readonly CheckName[] = ['schema', 'fresh', 'amount', 'blanks'];
/** What the gate learns from the file's history. */
export const LEARNED: readonly CheckName[] = ['shares', 'shape', 'hours', 'pairs', 'forest', 'classifier'];

/** Each contract and learned check in plain words, as a reader asks it of their data. */
export const PLAIN: Partial<Record<CheckName, string>> = {
  schema: 'The columns and their types are the ones agreed',
  fresh: 'A new file: not the last load’s again, exported for its day',
  amount: 'About as many rows as on a day like it',
  blanks: 'No column blank more often than usual',
  shares: 'Each value about as common as usual',
  shape: 'Each measure spread as usual',
  hours: 'Times of day as usual',
  pairs: 'Values together as often as usual',
  forest: 'The day as a whole like the days before',
  classifier: 'Today’s rows can’t be told apart from like days’',
  rules: 'The checks set on its columns hold',
};

const lower = (s: string) => s.toLowerCase();
const valueOf = (v: string): string => {
  try {
    const x = JSON.parse(v) as unknown;
    return typeof x === 'string' ? x : String(x);
  } catch {
    return v;
  }
};
const RANK: Record<CheckState, number> = { alert: 0, warn: 1, ok: 2, unjudged: 3, off: 4 };

/**
 * The file's checks for a day. `findings` are the day's, for this file (its news against its history); `judged` says
 * whether the day could be judged at all (a history with the day); `counted` the rows each check people set caught, by
 * its ontology id (`OntologyRule.id`), from the run's check step.
 */
export function bronzeOf(section: FileSection, gate: GateChecks | null, findings: readonly Finding[], o: { judged: boolean; counted?: ReadonlyMap<string, number> }): Bronze {
  const file = section.id;
  const modeOf = (c: CheckName): CheckMode => gate?.[c] ?? 'hold';
  const checks: BronzeCheck[] = [];
  const byId = new Map<string, BronzeCheck>();
  const add = (c: Omit<BronzeCheck, 'state' | 'findings'>) => {
    const x: BronzeCheck = { ...c, state: 'unjudged', findings: [] };
    checks.push(x);
    byId.set(x.id, x);
    return x;
  };
  const fromRule = (r: Rule, column?: string) => {
    const check = CHECK_OF_KIND[r.kind];
    return add({ id: r.id, check, from: 'ontology', kind: r.kind, said: r.said, ...(column ? { column } : r.columns?.length === 1 ? { column: r.columns[0] } : {}), mode: modeOf(check), ...(r.unchecked ? { why: r.unchecked } : {}), ...(r.def ? { def: r.def } : {}) });
  };
  for (const r of section.rules) fromRule(r);
  for (const c of section.columns ?? []) for (const r of c.rules) fromRule(r, c.name);
  const own = (check: CheckName, from: 'contract' | 'learned') =>
    add({ id: `${file}/~${check}`, check, from, kind: from, said: PLAIN[check] ?? check, mode: modeOf(check), ...(gate?.[check] === 'off' ? { why: 'switched off in the notebook' } : !section.watched ? { why: 'nothing watches this file' } : {}) });
  for (const c of CONTRACT) if (!gate || c in gate) own(c, 'contract');
  for (const c of LEARNED) if (!gate || c in gate) own(c, 'learned');

  // Each finding to the check it is about: the ontology's own where one is written for its column and value, else the
  // check the gate judges it by (the contract's or what is learned).
  const first = (prefix: string) => checks.find((c) => c.id.startsWith(prefix));
  const home = (f: Finding): BronzeCheck | undefined => {
    const col = f.columns?.[0] ? lower(f.columns[0]) : null;
    const val = f.values?.[0] !== undefined ? valueOf(f.values[0]) : null;
    const at = `${file}/${col ?? ''}`;
    switch (f.kind) {
      case 'band': return (col && val !== null && byId.get(`${at}/band=${val}`)) || undefined;
      case 'new': return (col && byId.get(`${at}/values`)) || undefined;
      case 'due': return (col && byId.get(`${at}/due`)) || undefined;
      case 'share': case 'gone': return (f.bad && col && val !== null && byId.get(`${at}/bad=${val}`)) || undefined;
      case 'scope': return byId.get(`${file}/covers`);
      case 'reconcile': case 'key': return byId.get(`${file}/key`) ?? byId.get(`${file}/same`) ?? byId.get(`${file}/rows`);
      case 'needs': return first(`${file}/needs#`);
      default: return undefined;
    }
  };
  for (const f of findings) {
    if (f.kind === 'calm' || f.kind === 'unlearned' || f.kind === 'weather' || f.kind === 'placeholder') continue;
    const check = f.check ?? checkOf(f.kind);
    let to = home(f);
    if (!to && check) to = byId.get(`${file}/~${check}`) ?? own(check, LEARNED.includes(check) ? 'learned' : 'contract');
    to?.findings.push(f);
  }

  for (const c of checks) {
    if (c.mode === 'off' || c.why) c.state = 'off';
    else if (c.kind === 'set') {
      const n = c.def ? o.counted?.get(c.def.id) : undefined;
      if (n !== undefined) c.failed = n;
      c.state = n === undefined ? 'unjudged' : n === 0 ? 'ok' : c.def?.action === 'hold' ? 'alert' : 'warn';
    } else if (c.findings.some((f) => f.severity === 'alert')) c.state = 'alert';
    else if (c.findings.some((f) => f.severity === 'warn')) c.state = 'warn';
    else c.state = o.judged ? 'ok' : 'unjudged';
    c.findings.sort((a, b) => RANK[a.severity === 'alert' ? 'alert' : a.severity === 'warn' ? 'warn' : 'ok'] - RANK[b.severity === 'alert' ? 'alert' : b.severity === 'warn' ? 'warn' : 'ok'] || b.score - a.score);
  }
  const score = (c: BronzeCheck) => c.findings[0]?.score ?? 0;
  const wrong = checks.filter((c) => c.state === 'alert').sort((a, b) => score(b) - score(a));
  const unusual = checks.filter((c) => c.state === 'warn').sort((a, b) => score(b) - score(a));
  const judgedList = checks.filter((c) => c.state !== 'off' && c.state !== 'unjudged');
  const holds = wrong.some((c) => c.mode === 'hold');
  const verdict = holds ? 'hold' : wrong.length || unusual.length ? 'look' : judgedList.length ? 'clean' : 'unjudged';
  return { file, verdict, wrong, unusual, checks, passed: judgedList.filter((c) => c.state === 'ok').length, judged: judgedList.length };
}

/** The verdict in a few words, for the head of the card: what a reader asks first of their data. */
export function verdictSaid(b: Bronze): string {
  const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
  if (b.verdict === 'unjudged') return 'Not judged yet: no history for this day';
  if (b.verdict === 'clean') return `No quality issues: ${n(b.passed, 'check', 'checks')} passed`;
  const parts = [b.wrong.length ? n(b.wrong.length, 'issue', 'issues') : '', b.unusual.length ? n(b.unusual.length, 'thing to look at', 'things to look at') : ''].filter(Boolean);
  return `${parts.join(' and ')}${b.verdict === 'hold' ? ': the day is held' : ''}`;
}
