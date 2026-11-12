/**
 * What a step after the files did to the data, told for anyone (ADR 0015 amendment 4): the bronze card's rules carried to
 * the silver layer. A step's story is what it does in plain words, what went in and what came out (and what was left out,
 * or added, and why), how long it took, and each of those against the step's usual. Made from the run's own counts and
 * the plan alone (the step's kind, its inputs' rows, its join keys or its condition), so any flow gets the same story
 * with its own names. Nothing here reads data or knows a dataset.
 */

export type StepOp = 'table' | 'sql' | 'filter' | 'formula' | 'select' | 'join' | 'aggregate' | 'expect' | 'fill';

export interface StepFacts {
  op: StepOp;
  origin: string;
  /** What the rows are called (the ontology's noun), for the sentences. */
  noun?: { one: string; many: string };
  /** Each input and its rows (null: closed to the viewer). */
  inputs: { name: string; rows: number | null }[];
  rowsOut: number | null;
  /** built: made in this run; reused: the same inputs and code as an earlier run, so the stored result was taken. */
  status?: 'built' | 'reused' | 'folded' | 'refused';
  added: string[];
  removed: string[];
  replaced: string[];
  join?: { how: 'inner' | 'left'; on: [string, string][]; unmatched: number | null };
  filter?: { where: string };
  aggregate?: { groupBy: string[]; measures: string[] };
  expect?: { dropped: number; flagged: number; rules: { name: string; failed: number; onFail: string }[]; maxDropped: number | null };
  sql?: string;
  /** How long it took to build, in milliseconds; null for a step that wasn't built on its own (reused, folded). */
  ms?: number | null;
  /** The step on earlier days run here: the range of its rows out, its usual time, and how many days those are from. */
  usual?: { rows: [number, number] | null; ms: number | null; days: number };
}

export interface RowFlow {
  inputs: { label: string; rows: number }[];
  out: number;
  /** Rows of the first input not in the output, and why. */
  lost: { why: string; rows: number }[];
  /** Rows more than the first input had (a join that matched one row to several). */
  gained: number;
}

export interface StepStory {
  /** The sentence that leads: what happened to the rows today. */
  head: string;
  /** What the step does, whatever the day. */
  does: string;
  /** The columns it changed, in words; null for none. */
  columns: string | null;
  /** How long it took, against its usual; null when it wasn't built on its own. */
  time: string | null;
  /** Its rows against its usual; or why there is nothing to compare with. */
  usual: string;
  flow: RowFlow | null;
}

const n = (x: number) => x.toLocaleString('en-US');
const pct = (x: number) => `${x >= 0.995 && x < 1 ? '99' : x > 0 && x < 0.005 ? '<1' : Math.round(x * 100)}%`;
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const few = (xs: readonly string[], k = 4) => (xs.length > k ? `${list(xs.slice(0, k))} and ${xs.length - k} more` : list(xs));

/** A duration for people: "40 ms", "1.2 s". */
export const msSaid = (ms: number): string => (ms < 1 ? 'under 1 ms' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`);

/** What a SQL step does, read from its text: the clauses that change rows (joins, grouping, a condition, distinct). */
export function sqlDoes(sql: string): { joins: boolean; outer: boolean; groups: boolean; sums: boolean; where: boolean; distinct: boolean; union: boolean } {
  const t = sql.replace(/--.*$/gm, ' ').replace(/'(?:[^']|'')*'/g, "''").toUpperCase();
  return { sums: /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/.test(t) && !/\bOVER\s*\(/.test(t), joins: /\bJOIN\b/.test(t), outer: /\b(LEFT|RIGHT|FULL)\s+(OUTER\s+)?JOIN\b/.test(t), groups: /\bGROUP\s+BY\b/.test(t), where: /\bWHERE\b/.test(t), distinct: /\bSELECT\s+DISTINCT\b/.test(t), union: /\bUNION\b/.test(t) };
}

/** What each kind of step does, in a sentence, for any flow. */
export function opDoes(f: Pick<StepFacts, 'op' | 'inputs' | 'join' | 'filter' | 'aggregate' | 'sql' | 'expect'> & Partial<Pick<StepFacts, 'added'>>): string {
  const names = f.inputs.map((i) => i.name);
  switch (f.op) {
    case 'join': return `Matches each row of ${names[0]} with ${names[1] ?? 'another dataset'} by ${f.join ? list(f.join.on.map(([l, r]) => (l === r ? l : `${l} = ${r}`))) : 'a key'}, and adds its columns. ${f.join?.how === 'left' ? 'A row with no match is kept, with those columns blank.' : 'A row with no match is left out.'}`;
    case 'filter': return `Keeps only the rows where ${f.filter?.where ?? 'its condition holds'}.`;
    case 'aggregate': return `Groups the rows by ${f.aggregate?.groupBy.length ? list(f.aggregate.groupBy) : 'nothing (one row for all)'} and works out ${f.aggregate?.measures.length ? few(f.aggregate.measures) : 'totals'} for each group.`;
    case 'expect': return 'Checks every row against written rules: a row that breaks a dropping rule is left out, one that breaks a warning rule is kept and flagged.';
    case 'formula': return 'Works out new columns from each row; the rows themselves stay as they are.';
    case 'select': return 'Picks and renames columns; the rows stay as they are.';
    case 'fill': return 'Marks where each row came from, and fills a missing part of the day from another day where a decision says so.';
    case 'table': return 'Reads the file as it arrived.';
    case 'sql': {
      const d = sqlDoes(f.sql ?? '');
      const rowwise = !d.joins && !d.groups && !d.sums && !d.where && !d.distinct && !d.union;
      const parts = [d.joins ? `combines ${list(names)}${d.outer ? ', keeping rows with no match' : ''}` : names.length > 1 ? `reads ${list(names)}` : `reads ${names[0] ?? 'its input'}${rowwise ? ' row for row' : ''}`, d.where ? 'keeps the rows its condition allows' : null, d.groups ? 'groups the rows and works out a total for each group' : d.sums ? 'adds the rows up into totals' : null, d.distinct ? 'keeps each distinct row once' : null, d.union ? 'stacks rows from several queries' : null, rowwise && f.added?.length ? `works out ${few(f.added, 3)} for each` : null].filter(Boolean) as string[];
      return `A query that ${list(parts)}.`;
    }
  }
}

/** A step's story for the day: what happened to the rows, what it does, its columns, its time and its usual. */
export function stepStory(f: StepFacts): StepStory {
  const noun = f.noun ?? { one: 'row', many: 'rows' };
  const rows = (x: number) => `${n(x)} ${x === 1 ? noun.one : noun.many}`;
  const first = f.inputs[0];
  const inn = first?.rows ?? null;
  const out = f.rowsOut;
  let head = out === null ? `${f.origin} is closed to you: its rows can’t be counted.` : `${rows(out)} out.`;
  const lost: RowFlow['lost'] = [];
  let gained = 0;
  if (out !== null && inn !== null) {
    if (f.op === 'join' && f.join) {
      const um = f.join.unmatched;
      if (f.join.how === 'inner') {
        if (um) lost.push({ why: `no match in ${f.inputs[1]?.name ?? 'the other dataset'}`, rows: um });
        head = um ? `${n(um)} of ${rows(inn)} found no match in ${f.inputs[1]?.name ?? 'the other dataset'} and were left out; ${rows(out)} came out.` : `Every one of ${rows(inn)} found a match; ${rows(out)} came out.`;
      } else head = um ? `${n(um)} of ${rows(inn)} found no match in ${f.inputs[1]?.name ?? 'the other dataset'}: they were kept, with its columns blank. ${rows(out)} came out.` : `Every one of ${rows(inn)} found a match; ${rows(out)} came out.`;
      const matched = inn - (f.join.how === 'inner' ? um ?? 0 : 0);
      if (out > matched) gained = out - matched;
      if (gained) head += ` Some matched more than once, adding ${n(gained)}.`;
    } else if (f.op === 'aggregate' || (f.op === 'sql' && (sqlDoes(f.sql ?? '').groups || sqlDoes(f.sql ?? '').sums))) {
      head = `${rows(inn)} were added up into ${n(out)} ${out === 1 ? 'row' : 'rows'}${f.aggregate?.groupBy.length ? `, one for each ${list(f.aggregate.groupBy)}` : ''}: nothing left out, each row counted in a total.`;
    } else if (f.op === 'expect' && f.expect) {
      const e = f.expect;
      if (e.dropped) lost.push({ why: 'broke a rule', rows: e.dropped });
      head = e.dropped ? `${n(e.dropped)} of ${rows(inn)} broke a rule and were left out (${pct(e.dropped / Math.max(1, inn))}${e.maxDropped !== null ? `; the limit is ${pct(e.maxDropped)}` : ''}).` : `Every one of ${rows(inn)} kept the rules.`;
      if (e.flagged) head += ` ${n(e.flagged)} were flagged and kept.`;
    } else if (out < inn && (f.op === 'filter' || f.op === 'fill' || (f.op === 'sql' && sqlDoes(f.sql ?? '').where && !sqlDoes(f.sql ?? '').joins && !sqlDoes(f.sql ?? '').union))) {
      lost.push({ why: f.op === 'filter' ? `the condition isn’t true` : 'left out by the query', rows: inn - out });
      head = `${rows(out)} of ${n(inn)} kept; ${n(inn - out)} (${pct((inn - out) / Math.max(1, inn))}) left out${f.op === 'filter' ? ` where ${f.filter?.where ?? 'its condition'} isn’t true` : ''}.`;
    } else if (out === inn) head = f.inputs.length > 1 && f.op === 'sql' ? `${rows(out)} out, one for each row of ${first!.name}.` : `The same ${rows(out)} out: no row added or left out.`;
    else if (out < inn) head = `${rows(inn)} in, ${rows(out)} out.`;
    else if (out > inn) {
      gained = out - inn;
      head = `${rows(inn)} in, ${rows(out)} out: ${n(gained)} more than ${first!.name} had.`;
    }
  }
  const changed = [f.added.length ? `adds ${few(f.added)}` : null, f.replaced.length ? `works out ${few(f.replaced)} again` : null, f.removed.length ? `drops ${few(f.removed)}` : null].filter(Boolean) as string[];
  const columns = changed.length ? `${changed.join('; ')}.`.replace(/^./, (c) => c.toUpperCase()) : null;
  const time = f.status === 'reused' ? 'Not built again: the same inputs and code as an earlier run, so its stored result was used.'
    : f.ms === undefined || f.ms === null ? null
    : `Took ${msSaid(f.ms)}${f.usual?.ms ? (f.ms > f.usual.ms * 3 && f.ms - f.usual.ms > 50 ? `, much longer than its usual ${msSaid(f.usual.ms)}` : `; usually ${msSaid(f.usual.ms)}`) : ''}.`;
  let usual: string;
  if (!f.usual || f.usual.days === 0) usual = 'No earlier days run to compare with yet.';
  else if (!f.usual.rows || out === null) usual = `Compared with ${f.usual.days} earlier ${f.usual.days === 1 ? 'day' : 'days'} run here.`;
  else {
    const [lo, hi] = f.usual.rows;
    const span = lo === hi ? n(lo) : `${n(lo)}–${n(hi)}`;
    usual = out < lo ? `Fewer than usual: ${n(out)} today, ${span} on the ${f.usual.days} earlier ${f.usual.days === 1 ? 'day' : 'days'} run here.` : out > hi ? `More than usual: ${n(out)} today, ${span} on the ${f.usual.days} earlier ${f.usual.days === 1 ? 'day' : 'days'} run here.` : `As usual: ${span} on the ${f.usual.days} earlier ${f.usual.days === 1 ? 'day' : 'days'} run here.`;
  }
  const flow: RowFlow | null = out === null || f.inputs.some((i) => i.rows === null) || !f.inputs.length ? null
    : { inputs: f.inputs.map((i) => ({ label: i.name, rows: i.rows! })), out, lost, gained };
  return { head, does: opDoes(f), columns, time, usual, flow };
}

/** The rows a step's earlier days had, as a range (the lowest and the highest), from its rows on each day run here. */
export function usualRows(earlier: readonly number[]): [number, number] | null {
  if (!earlier.length) return null;
  return [Math.min(...earlier), Math.max(...earlier)];
}

/** A step's usual time: the middle of its earlier builds. */
export function usualMs(earlier: readonly number[]): number | null {
  if (!earlier.length) return null;
  const s = [...earlier].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}
