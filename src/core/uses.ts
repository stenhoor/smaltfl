/**
 * Where a source's column is used (ADR 0022 §2; Q-146, Q-205): the joins that match on it, the datasets that pass it on
 * under its name, the steps that read it otherwise, and the published outputs built from any of them.
 *
 * A column is followed by its name, as the maintainer put it ("carried through the steps that pass the column on"): a
 * step passes it on when its output has a column of that name taken from an input that has it. A SQL step is read from
 * its parsed SELECT (smaltql's AST, the parser passed in so the core imports none): its FROM items, with each CTE and
 * subquery resolved to the inputs it reads; the equalities of every join's ON, and its USING; and the columns it selects,
 * a star included. The step's output columns, where the typed plan has them, settle what a star selects.
 */
import type { FlowDocument, StepDef } from './document.js';

/** A SQL step's text parsed: smaltql's `parseOne(sql).stmt`, a SELECT. Anything else is read as using no column. */
export type ParseSql = (sql: string) => unknown;

/** A join that matches on the column. */
export interface JoinUse {
  /** The step whose join it is. */
  step: string;
  /** The input the column is read from in that join: the source, or a dataset that passes the column on. */
  via: string;
  /** What it is matched against: the other side's dataset (an input of the step), and its column, as written; null where
   * the other side isn't one column of one input (an expression of several, or a CTE's own computation). */
  other: { dataset: string | null; column: string | null };
}

export interface ColumnUses {
  source: string;
  column: string;
  /** The datasets that carry the column under its name: the source, then each step that passes it on, in the flow's
   * order. */
  carried: string[];
  /** The joins that match on it, in the flow's order. */
  joins: JoinUse[];
  /** The steps that read it without joining on it or passing it on: a filter, a group, a sum. */
  reads: string[];
  /** The published datasets whose rows depend on it: those that carry it, and those built from a step that joins on it or
   * reads it, in the flow's order. A dataset merely built from one that carries it, using it nowhere, isn't one. */
  outputs: string[];
}

export interface UsesOptions {
  /** Parses a SQL step's text. Without it, a SQL step is taken to pass every input column on and read none. */
  parse?: ParseSql;
  /** A step's output columns, where the typed plan has them: what a star selects. */
  columnsOf?: (step: string) => readonly string[] | undefined;
}

const lower = (x: string) => x.toLowerCase();

/** The steps in an order where each comes after its inputs (the document's own order where it already is). */
function ordered(steps: readonly StepDef[]): StepDef[] {
  const byId = new Map(steps.map((s) => [lower(s.id), s]));
  const done = new Set<string>();
  const out: StepDef[] = [];
  const visit = (s: StepDef, path: Set<string>) => {
    const id = lower(s.id);
    if (done.has(id) || path.has(id)) return;
    path.add(id);
    for (const i of s.inputs) {
      const up = byId.get(lower(i));
      if (up) visit(up, path);
    }
    path.delete(id);
    done.add(id);
    out.push(s);
  };
  for (const s of steps) visit(s, new Set());
  return out;
}

// ---------------------------------------------------------------------------------------------- the parsed SELECT, read

/** The parts of smaltql's AST read here, structurally. */
type Node = { kind?: string; [k: string]: unknown };
const isNode = (x: unknown): x is Node => typeof x === 'object' && x !== null;

/** What a name in a FROM clause stands for: an input of the step, a CTE, or a subquery. */
type Relation = { kind: 'input'; id: string } | { kind: 'select'; select: Node; scope: Scope } | { kind: 'other' };
/** The CTEs visible from a SELECT, by lower-cased name. */
type Scope = Map<string, Node>;

/** A step's SQL, read for one column: which relations carry it, the joins on it, whether the step selects it, and
 * whether it reads it at all. */
class SqlReader {
  joins: { via: string; other: { dataset: string | null; column: string | null } }[] = [];
  /** Any reference to the column from a relation that carries it. */
  read = false;

  constructor(
    private readonly inputs: ReadonlySet<string>,
    private readonly carriers: ReadonlySet<string>,
    private readonly column: string,
    /** What a star selects from an input, where the plan says. */
    private readonly hasColumn: (input: string) => boolean,
    /** The CTEs and subqueries being read for whether they carry the column: a recursive CTE reads itself. */
    private readonly visiting: Set<Node> = new Set(),
    /** What each CTE or subquery was found to carry, once known. */
    private readonly known: Map<Node, boolean> = new Map(),
  ) {}

  /** Whether a SELECT's output has the column, taken from an input that carries it; and every join and reference in it
   * is noted on the way. */
  select(stmt: Node, outer: Scope): boolean {
    const scope = new Map(outer);
    const w = stmt.with as Node | undefined;
    const ctes = ((w?.ctes as Node[] | undefined) ?? []).filter((c) => typeof c.name === 'string' && isNode(c.select));
    for (const c of ctes) scope.set(lower(c.name as string), c.select as Node);
    // Each CTE's own joins and references, read once where it is defined.
    for (const c of ctes) this.within(c.select as Node, () => this.select(c.select as Node, scope));
    const cores = [stmt.core, ...((stmt.compound as Node[] | undefined) ?? []).map((x) => x.core)].filter(isNode);
    let has = false;
    for (const core of cores) has = this.core(core, scope) || has;
    for (const o of (stmt.orderBy as Node[] | undefined) ?? []) this.expr(o.expr, new Map(), scope);
    return has;
  }

  private core(core: Node, scope: Scope): boolean {
    if (core.kind !== 'select') return false;
    // The FROM items by the name the rest of the SELECT reads them under: an alias, else the table's own name.
    const rels = new Map<string, Relation>();
    if (isNode(core.from)) this.from(core.from, rels, scope);
    const carries = (r: Relation | undefined): boolean => (r ? this.relationCarries(r) : false);
    const anyCarrier = [...rels.values()].some(carries);
    const of = (e: Node): Relation | undefined => (typeof e.table === 'string' ? rels.get(lower(e.table)) : undefined);
    const isOurs = (e: Node): boolean => e.kind === 'column' && typeof e.name === 'string' && lower(e.name) === lower(this.column) && (typeof e.table === 'string' ? carries(of(e)) : anyCarrier);
    for (const e of [core.where, core.having, ...((core.groupBy as unknown[]) ?? [])]) this.expr(e, rels, scope, isOurs);
    let has = false;
    for (const c of (core.columns as Node[] | undefined) ?? []) {
      if (c.kind === 'star') has = has || [...rels.entries()].some(([, r]) => carries(r) && this.relationHas(r));
      else if (c.kind === 'tableStar' && typeof c.table === 'string') has = has || (carries(rels.get(lower(c.table))) && this.relationHas(rels.get(lower(c.table))!));
      else if (c.kind === 'expr' && isNode(c.expr)) {
        const named = typeof c.alias === 'string' ? lower(c.alias) === lower(this.column) : false;
        const bare = isOurs(c.expr as Node);
        this.expr(c.expr, rels, scope, isOurs);
        // Selected under its own name, or as an expression named for it (`upper(trim(app_id)) AS app_id`).
        if ((bare && (c.alias === undefined || named)) || (named && this.mentions(c.expr as Node, isOurs))) has = true;
      }
    }
    return has;
  }

  /** Registers each FROM item under its name, and reads every join's condition. */
  private from(item: Node, rels: Map<string, Relation>, scope: Scope): void {
    if (item.kind === 'join') {
      if (isNode(item.left)) this.from(item.left as Node, rels, scope);
      if (isNode(item.right)) this.from(item.right as Node, rels, scope);
      if (isNode(item.on)) this.joinOn(item.on as Node, rels);
      for (const u of (item.using as string[] | undefined) ?? []) if (lower(u) === lower(this.column)) this.joinUsing(item, rels);
      return;
    }
    const name = typeof item.alias === 'string' ? item.alias : typeof item.name === 'string' ? item.name : null;
    if (item.kind === 'table' && typeof item.name === 'string') {
      const n = lower(item.name);
      const r: Relation = scope.has(n) ? { kind: 'select', select: scope.get(n)!, scope } : this.inputs.has(n) ? { kind: 'input', id: n } : { kind: 'other' };
      rels.set(lower(name ?? item.name), r);
    } else if (item.kind === 'subquery' && isNode(item.select)) {
      // Its own joins and references, read where it stands; then what its rows carry, by its alias.
      this.within(item.select as Node, () => this.select(item.select as Node, scope));
      if (name) rels.set(lower(name), { kind: 'select', select: item.select as Node, scope });
    } else if (name) rels.set(lower(name), { kind: 'other' });
  }

  /** Whether a relation's rows carry the column under its name. */
  private relationCarries(r: Relation): boolean {
    if (r.kind === 'input') return this.carriers.has(r.id);
    if (r.kind === 'select') {
      // Asked again from inside itself (a recursive CTE's own name), it carries what its first part carries.
      if (this.visiting.has(r.select)) return false;
      const was = this.known.get(r.select);
      if (was !== undefined) return was;
      // Read again only to answer this: its joins and references were noted where it stands.
      const quiet = new SqlReader(this.inputs, this.carriers, this.column, this.hasColumn, this.visiting, this.known);
      const has = this.within(r.select, () => quiet.select(r.select, r.scope));
      this.known.set(r.select, has);
      return has;
    }
    return false;
  }

  /** The one input a relation reads: the input itself, or a CTE's or subquery's single table, followed through CTEs;
   * null for several, or a recursive CTE read from inside itself. */
  private baseInput(r: Relation): string | null {
    if (r.kind === 'input') return r.id;
    if (r.kind !== 'select' || this.visiting.has(r.select)) return null;
    const core = r.select.core as Node | undefined;
    const from = core?.kind === 'select' ? (core.from as Node | undefined) : undefined;
    if (!from || from.kind !== 'table' || typeof from.name !== 'string' || ((r.select.compound as unknown[] | undefined) ?? []).length) return null;
    const n = lower(from.name);
    if (r.scope.has(n)) return this.within(r.select, () => this.baseInput({ kind: 'select', select: r.scope.get(n)!, scope: r.scope }));
    return this.inputs.has(n) ? n : null;
  }

  /** Runs `f` with a CTE or subquery marked as being read, so reading it again from inside itself ends. */
  private within<T>(select: Node, f: () => T): T {
    if (this.visiting.has(select)) return f();
    this.visiting.add(select);
    try {
      return f();
    } finally {
      this.visiting.delete(select);
    }
  }

  /** Whether a star over the relation selects the column: as the plan has the input's columns, else yes. */
  private relationHas(r: Relation): boolean {
    return r.kind === 'input' ? this.hasColumn(r.id) : true;
  }

  /** Each equality of an ON condition with the column on one side (`t0.app_id = a.app_id`, `l.k = upper(trim(c.k))`). */
  private joinOn(on: Node, rels: Map<string, Relation>): void {
    const carries = (r: Relation | undefined) => (r ? this.relationCarries(r) : false);
    const anyCarrier = [...rels.values()].some(carries);
    const ours = (e: Node): boolean => e.kind === 'column' && typeof e.name === 'string' && lower(e.name) === lower(this.column) && (typeof e.table === 'string' ? carries(rels.get(lower(e.table))) : anyCarrier);
    const refs = (e: unknown, out: Node[] = []): Node[] => {
      if (!isNode(e)) return out;
      if (e.kind === 'column') out.push(e);
      else if (e.kind !== 'subquery' && e.kind !== 'exists' && e.kind !== 'inSelect') for (const v of Object.values(e)) if (Array.isArray(v)) v.forEach((x) => refs(x, out)); else refs(v, out);
      return out;
    };
    const via = (e: Node): string | null => {
      const r = typeof e.table === 'string' ? rels.get(lower(e.table)) : [...rels.values()].find(carries);
      return r?.kind === 'input' ? r.id : null;
    };
    const side = (e: Node[]): { dataset: string | null; column: string | null } => {
      if (e.length !== 1) return { dataset: null, column: null };
      const r = typeof e[0]!.table === 'string' ? rels.get(lower(e[0]!.table as string)) : undefined;
      return { dataset: r ? this.baseInput(r) : null, column: e[0]!.name as string };
    };
    const walk = (e: unknown): void => {
      if (!isNode(e)) return;
      if (e.kind === 'binary' && e.op === 'AND') return void [e.left, e.right].forEach(walk);
      if (e.kind === 'binary' && e.op === '=') {
        const [l, r] = [refs(e.left), refs(e.right)];
        // The column on both sides (a step matching its own rows, as a dedup does) is matched with itself: the same name
        // on either side, read the same way, so no join on other data.
        const lo = l.find(ours), ro = r.find(ours);
        if (lo && !ro) this.joins.push({ via: via(lo) ?? '', other: side(r) });
        else if (ro && !lo) this.joins.push({ via: via(ro) ?? '', other: side(l) });
        if (lo || ro) this.read = true;
        return;
      }
      if (refs(e).some(ours)) this.read = true;
    };
    walk(on);
  }

  /** `JOIN … USING (column)`: matched on its own name on both sides. */
  private joinUsing(item: Node, rels: Map<string, Relation>): void {
    const names = (x: unknown): string[] => (!isNode(x) ? [] : x.kind === 'join' ? [...names(x.left), ...names(x.right)] : [lower(String(x.alias ?? x.name ?? ''))]);
    const right = names(item.right);
    const left = names(item.left);
    const carrying = (ns: string[]) => ns.find((n) => { const r = rels.get(n); return r ? this.relationCarries(r) : false; });
    const viaRight = carrying(right);
    const viaLeft = carrying(left);
    const inputOf = (n: string | undefined) => { const r = n ? rels.get(n) : undefined; return r?.kind === 'input' ? r.id : null; };
    if (viaRight || viaLeft) {
      this.read = true;
      const [via, other] = viaLeft ? [viaLeft, right[right.length - 1]] : [viaRight, left[left.length - 1]];
      this.joins.push({ via: inputOf(via) ?? '', other: { dataset: inputOf(other), column: this.column } });
    }
  }

  /** Reads an expression for the column, with its subqueries (whose own FROM may carry it). */
  private expr(e: unknown, rels: Map<string, Relation>, scope: Scope, ours?: (e: Node) => boolean): void {
    if (!isNode(e)) return;
    if (ours && ours(e)) this.read = true;
    if ((e.kind === 'subquery' || e.kind === 'exists' || e.kind === 'inSelect') && isNode(e.select)) {
      this.select(e.select as Node, scope);
      if (e.kind === 'inSelect') this.expr(e.expr, rels, scope, ours);
      return;
    }
    for (const v of Object.values(e)) if (Array.isArray(v)) v.forEach((x) => this.expr(x, rels, scope, ours)); else if (isNode(v)) this.expr(v, rels, scope, ours);
  }

  private mentions(e: Node, ours: (e: Node) => boolean): boolean {
    if (ours(e)) return true;
    return Object.values(e).some((v) => (Array.isArray(v) ? v.some((x) => isNode(x) && this.mentions(x, ours)) : isNode(v) && this.mentions(v, ours)));
  }
}

// ------------------------------------------------------------------------------------------------------ the analysis

/** Whether an expression's text names the column as a word (`app_id IS NOT NULL`, `upper(app_id)`), whatever its case. */
const names = (text: string, column: string): boolean => new RegExp(`(^|[^A-Za-z0-9_])${column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^A-Za-z0-9_])`, 'i').test(text);

/**
 * Where `source`'s `column` is used in the flow (ADR 0022 §2): followed by its name through the steps, as `ColumnUses`
 * says. A step that reads no dataset carrying it doesn't use it, whatever it names.
 */
export function columnUses(doc: Pick<FlowDocument, 'steps' | 'sources'>, source: string, column: string, opts: UsesOptions = {}): ColumnUses {
  const carriers = new Set<string>([lower(source)]);
  const carried = [source];
  const joins: JoinUse[] = [];
  const reads: string[] = [];
  /** The steps whose rows depend on the column: a join on it, a filter, a group or an expression reading it. */
  const roots = new Set<string>();
  const col = lower(column);
  const steps = ordered(doc.steps);
  for (const s of steps) {
    const ins = s.inputs.filter((i) => carriers.has(lower(i)));
    if (!ins.length) continue;
    const out = opts.columnsOf?.(s.id)?.map(lower);
    let passes = false;
    let reads1 = false;
    // Each join once: the same match written twice in a step (an ON and a WHERE, two CTEs) is one.
    const join = (via: string, other: JoinUse['other']) => {
      if (!joins.some((j) => j.step === s.id && j.via === via && j.other.dataset === other.dataset && j.other.column === other.column)) joins.push({ step: s.id, via, other });
    };
    switch (s.kind) {
      case 'expectations':
        passes = true;
        reads1 = s.rules.some((r) => names(r.check, column));
        break;
      case 'filter':
        passes = true;
        reads1 = names(s.where, column);
        break;
      case 'fill':
        passes = true;
        reads1 = (s.time !== undefined && lower(s.time) === col) || s.shift.some((x) => lower(x) === col);
        break;
      case 'formula':
        passes = true;
        reads1 = s.columns.some((c) => names(c.expr, column));
        break;
      case 'select':
        passes = s.columns.some((c) => (typeof c === 'string' ? lower(c) === col : lower(c.name) === col && names(c.expr, column)));
        reads1 = s.columns.some((c) => (typeof c === 'string' ? lower(c) === col : names(c.expr, column)));
        break;
      case 'aggregate':
        passes = s.groupBy.some((g) => (typeof g === 'string' ? lower(g) === col : lower(g.name) === col && names(g.expr, column)));
        reads1 = passes || s.groupBy.some((g) => typeof g !== 'string' && names(g.expr, column)) || s.measures.some((m) => names(m.expr, column));
        break;
      case 'join': {
        const [left, right] = s.inputs;
        const leftCarries = !!left && carriers.has(lower(left));
        const rightCarries = !!right && carriers.has(lower(right));
        for (const p of s.on) {
          if (leftCarries && lower(p.left) === col) join(left!, { dataset: right ?? null, column: p.right });
          else if (rightCarries && lower(p.right) === col) join(right!, { dataset: left ?? null, column: p.left });
        }
        passes = leftCarries || (rightCarries && s.columns.some((c) => (typeof c === 'string' ? lower(c) === col : lower(c.name) === col && lower(c.column) === col)));
        reads1 = rightCarries && s.columns.some((c) => typeof c !== 'string' && lower(c.column) === col);
        break;
      }
      case 'sql': {
        if (!opts.parse) {
          passes = true;
          break;
        }
        let stmt: unknown;
        try {
          stmt = opts.parse(s.sql);
        } catch {
          stmt = null;
        }
        if (!isNode(stmt) || stmt.kind !== 'select') break;
        const inputs = new Set(s.inputs.map(lower));
        const hasColumn = (input: string) => {
          const of = opts.columnsOf?.(doc.steps.find((x) => lower(x.id) === input)?.id ?? input);
          return of ? of.some((c) => lower(c) === col) : true;
        };
        const r = new SqlReader(inputs, carriers, column, hasColumn);
        passes = r.select(stmt, new Map());
        for (const j of r.joins) join(s.inputs.find((i) => lower(i) === lower(j.via)) ?? ins[0]!, { dataset: j.other.dataset ? (s.inputs.find((i) => lower(i) === j.other.dataset) ?? j.other.dataset) : null, column: j.other.column });
        reads1 = r.read;
        break;
      }
    }
    // The plan's output columns settle it where it has them: a column of the name in the output is the one passed on.
    if (out) passes = passes && out.includes(col);
    const joined = joins.some((j) => j.step === s.id);
    if (passes) {
      carriers.add(lower(s.id));
      carried.push(s.id);
    }
    if (joined || reads1) roots.add(lower(s.id));
    if (reads1 && !passes && !joined) reads.push(s.id);
  }
  // Everything built from a step whose rows depend on the column (the steps are in order: one pass), and the datasets
  // that carry it; the published ones among them.
  const downstream = new Set(roots);
  for (const s of steps) if (s.inputs.some((i) => downstream.has(lower(i)))) downstream.add(lower(s.id));
  const outputs = steps.filter((s) => s.dataset && (downstream.has(lower(s.id)) || carriers.has(lower(s.id)))).map((s) => s.id);
  return { source, column, carried, joins, reads, outputs };
}

/** How many of a column's values today find a match on a join's other side: distinct non-empty values, compared as
 * text (a join on ids reads them so). */
export function joinMatch(values: readonly (string | null)[], other: readonly (string | null)[]): { values: number; matched: number } {
  const there = new Set(other.filter((v): v is string => v !== null && v !== ''));
  const mine = new Set(values.filter((v): v is string => v !== null && v !== ''));
  let matched = 0;
  for (const v of mine) if (there.has(v)) matched++;
  return { values: mine.size, matched };
}

/** "A, B and C"; "A, B and 3 more" past `max`. */
const listed = (xs: readonly string[], max = 4): string => (xs.length <= 1 ? (xs[0] ?? '') : xs.length <= max ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : `${xs.slice(0, max - 1).join(', ')} and ${xs.length - max + 1} more`);

/**
 * Each step's joins on the column in words, a step once: "posture matches it with apps’s app_id"; "posture matches it
 * with app_id in tls_checked, waf_checked, pentest_checked and 9 more".
 */
export function joinsSaid(u: ColumnUses): string[] {
  const steps = [...new Set(u.joins.map((j) => j.step))];
  return steps.map((step) => {
    const others = u.joins.filter((j) => j.step === step && j.other.dataset).map((j) => j.other);
    if (!others.length) return `${step} matches it`;
    const columns = [...new Set(others.map((o) => o.column))];
    if (others.length > 1 && columns.length === 1 && columns[0]) return `${step} matches it with ${columns[0]} in ${listed(others.map((o) => o.dataset!))}`;
    return `${step} matches it with ${listed(others.map((o) => `${o.dataset}${o.column ? `’s ${o.column}` : ''}`))}`;
  });
}

/**
 * Where the column is used, in a sentence, joins first: "posture matches it with apps’s app_id; tls_checked passes it
 * on; app_scores, by_profile and 3 more are built from it." Empty where nothing uses it.
 */
export function usesSaid(u: ColumnUses): string {
  const parts = [
    ...joinsSaid(u),
    u.carried.length > 1 ? `${listed(u.carried.slice(1))} ${u.carried.length > 2 ? 'pass' : 'passes'} it on` : null,
    u.reads.length ? `${listed(u.reads)} ${u.reads.length > 1 ? 'read' : 'reads'} it` : null,
    u.outputs.length ? `${listed(u.outputs)} ${u.outputs.length > 1 ? 'are' : 'is'} built from it` : null,
  ].filter((x): x is string => !!x);
  return parts.length ? `${parts.join('; ')}.` : '';
}

/**
 * A join key's reach in a sentence (Q-205): its joins, then what is built from it, all named where `all`: "posture
 * matches it with apps’s app_id; posture, app_scores, by_unit and 5 more are built from it." Empty with no join.
 */
export function joinImpactSaid(u: ColumnUses, all = false): string {
  if (!u.joins.length) return '';
  const max = all ? Infinity : 4;
  const out = u.outputs.length ? `; ${listed(u.outputs, max)} ${u.outputs.length > 1 ? 'are' : 'is'} built from it` : '';
  return `${joinsSaid(u).join('; ')}${out}.`;
}
