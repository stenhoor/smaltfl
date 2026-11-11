/**
 * The bronze notebook explained (ADR 0015 amendment 3): a text cell before each of the notebook's cells, saying in
 * plain words what the cell does and what it found today. Made from the flow and the day alone (the file's id, its
 * columns, the gate's modes, the rules the check cell runs, the day's checks), so every dataset gets the same notes
 * with its own names: nothing here knows what a file is about. Markdown, as smaltnb's text cells are.
 */
import type { CheckMode, CheckName } from './gates.js';

/** What each check does and how it decides, for someone who has never seen it: one sentence each. */
export const CHECK_EXPLAINED: Record<CheckName, { what: string; how: string }> = {
  schema: { what: 'The file has the columns, and the types, the flow expects.', how: 'Compared with the columns the data list declares for the file.' },
  amount: { what: 'The file has about as many rows as a day like this one.', how: 'Today’s row count against the range learned from like days, or a band written in the ontology.' },
  blanks: { what: 'No column is blank more often than it usually is.', how: 'Each column’s share of blank values against its own usual range.' },
  values: { what: 'Every value is one the file is allowed or known to have.', how: 'New values, values marked bad and values outside a written band, from the ontology and the history.' },
  rules: { what: 'Rows keep the rules written for the file.', how: 'The check cell counts the rows that break each rule; dropping too many holds the day.' },
  scope: { what: 'The file covers exactly what it should: no rows for unknown keys, no known key without a row.', how: 'The file’s keys against the dataset the ontology says they come from.' },
  needs: { what: 'No row has a value another dataset’s rule forbids.', how: 'Rows matched against the rule the ontology writes on the other dataset.' },
  due: { what: 'What was due arrived, and no more ran late than usual.', how: 'Rows past their due date against the usual late share.' },
  reconcile: { what: 'One row for each key, with no key blank and none repeated.', how: 'The rows counted by key.' },
  shares: { what: 'Each value turns up about as often as usual.', how: 'A value’s share of rows against the range learned from like days (a robust band around the usual).' },
  shape: { what: 'Numbers are spread as usual: the low, middle and high values in their usual places.', how: 'Each measure’s quantiles against like days.' },
  hours: { what: 'Rows arrive across the day as usual.', how: 'Each time column’s hours against like days.' },
  pairs: { what: 'Two columns go together as they usually do.', how: 'How strongly two values turn up together (a log odds ratio) against its own history.' },
  forest: { what: 'The day as a whole looks like the days before it.', how: 'An isolation forest: days that are easy to set apart from the others score high.' },
  classifier: { what: 'Today’s rows can’t be told apart from rows of like days.', how: 'A small model tries to tell today’s rows from earlier ones; doing much better than chance means something changed.' },
};

/** What a mode does with what its check finds. */
export const MODE_EXPLAINED: Record<CheckMode, string> = {
  hold: 'holds the day: nothing built from the file is published until someone decides',
  warn: 'warns: the day is published, marked to look at',
  off: 'is off: switched off in the gate cell',
};

/** Names in markdown: as code, so a column called `*` or `_id` reads as itself. */
const code = (s: string) => `\`${s.replace(/`/g, 'ˋ')}\``;
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** The cell that reads the file: what arrived. */
export function sourceNote(o: { file: string; day?: string | null; rows?: number; columns: readonly string[]; noun?: { one: string; many: string } }): string {
  const noun = o.noun ?? { one: 'row', many: 'rows' };
  const shown = o.columns.slice(0, 8).map(code);
  const more = o.columns.length > 8 ? ` and ${o.columns.length - 8} more` : '';
  return [
    `### 1 · The file as it arrived`,
    `${code(o.file)}${o.day ? `, as received on ${o.day},` : ''} is read here exactly as it arrived${o.rows !== undefined ? `: **${plural(o.rows, noun.one, noun.many)}**` : ''} in ${plural(o.columns.length, 'column')}${o.columns.length ? ` (${shown.join(', ')}${more})` : ''}.`,
    `Nothing is changed here. Every check below reads these rows.`,
  ].join('\n\n');
}

/** The gate cell: what each check does for this file, and the day's verdict. */
export function gateNote(o: { file: string; layer?: string; modes: Partial<Record<CheckName, CheckMode>>; verdict?: string }): string {
  const by = (m: CheckMode) => (Object.entries(o.modes) as [CheckName, CheckMode][]).filter(([, x]) => x === m).map(([c]) => c);
  const lines = [`### 2 · The gate: what each check does`,
    `The gate cell decides what happens when a check finds something in ${code(o.file)}. A check that **stops the day** keeps everything built from the file from going out until someone decides; a check that **warns** lets the day go out, marked to look at. By default, written checks stop the day and checks learned from history only warn${o.layer ? ` (the ${o.layer} layer’s defaults)` : ''}.`];
  const rows = (['hold', 'warn', 'off'] as const).map((m) => [m, by(m)] as const).filter(([, cs]) => cs.length);
  if (rows.length) lines.push(rows.map(([m, cs]) => `- **${m === 'hold' ? 'Stops the day going out' : m === 'warn' ? 'Warns only' : 'Switched off'}:** ${list(cs.map((c) => `${CHECK_PLAIN[c]} (${code(c)})`))}.`).join('\n'));
  lines.push('Each check can be switched on the card’s Quality tab; the cell below is where the switches are written.');
  if (o.verdict) lines.push(`**Today:** ${o.verdict}.`);
  return lines.join('\n\n');
}

/** The check cell: each rule it runs, what it does with a row that breaks it, and what it counted today. */
export function rulesNote(o: { step: string; rules: readonly { name: string; check: string; onFail: string; description?: string }[]; failed?: ReadonlyMap<string, number>; maxDropped?: number; rows?: number }): string {
  const does: Record<string, string> = { warn: 'counted', drop: 'left out of what follows', fail: 'stops the run', flag: 'marked', hold: 'holds the day' };
  const lines = [`### 3 · Rules on the rows`, `${code(o.step)} runs the rules written for the file on every row. A row that breaks a rule is ${o.rules.some((r) => r.onFail === 'drop') ? 'dropped or counted, as the rule says' : 'counted'}.`];
  if (o.rules.length) {
    lines.push(o.rules.map((r) => {
      const n = o.failed?.get(r.name);
      const today = n === undefined ? '' : n === 0 ? ' Today every row keeps it.' : ` **Today ${plural(n, 'row breaks', 'rows break')} it**${o.rows ? ` (${((n / o.rows) * 100).toFixed(1).replace(/\.0$/, '')}%)` : ''}.`;
      return `- **${r.name}**: ${r.description ?? `rows where ${code(r.check)}`}. Else the row is ${does[r.onFail] ?? r.onFail}.${today}`;
    }).join('\n'));
  } else lines.push('No rules are written for the file yet: they are added on the Ontology page.');
  if (o.maxDropped !== undefined) lines.push(`If more than ${Math.round(o.maxDropped * 100)}% of rows are dropped, the day holds: a file that loses that much is more likely broken than dirty.`);
  return lines.join('\n\n');
}

/** Before the issues: how to read them. */
export function issuesNote(n: number): string {
  return [`### 4 · The issues, row by row`, n === 0 ? 'No check found anything today.' : `${plural(n, 'check')} found something today. Each cell below is a query over today’s rows that shows what the check saw: run it as it is, or change it to look closer.`].join('\n\n');
}

/** Before one issue's query: what the check found, what the check does, and what the query shows. */
export function issueNote(o: { title: string; check: CheckName; column?: string; mode: CheckMode; state: 'alert' | 'warn'; query: 'counts' | 'blanks' | 'keys' | 'scope' | 'rows' | 'total' | 'drivers' }): string {
  const e = CHECK_EXPLAINED[o.check];
  const shows: Record<typeof o.query, string> = {
    counts: o.column ? `each value of ${code(o.column)} with its rows, most first` : 'each value with its rows, most first',
    blanks: o.column ? `the rows where ${code(o.column)} is blank` : 'the rows with a blank',
    keys: 'each key with more than one row, or none',
    scope: 'the rows whose key the other dataset doesn’t have',
    rows: 'today’s rows, to read beside the earlier days’',
    total: 'how many rows arrived',
    drivers: o.column ? `today’s rows counted by ${code(o.column)}, and by the next column that tells them apart` : 'today’s rows counted by the columns that tell them apart',
  };
  return [
    `**${o.title}** ${o.state === 'alert' ? '· wrong' : '· unusual'}`,
    `The **${o.check}** check: ${e.what.charAt(0).toLowerCase()}${e.what.slice(1)} ${e.how} It ${MODE_EXPLAINED[o.mode].split(':')[0]}.`,
    `The query shows ${shows[o.query]}.`,
  ].join('\n\n');
}

/**
 * The classifier said honestly (amendment 3; HAX G2 and G11, a classifier two-sample test's reading): how strong, in
 * words matched to the number; what the number means as a frequency; what it was compared against; and what it is not.
 * AUC is the chance that, given one of today's rows and one earlier row, the model picks today's.
 */
export function apartSaid(a: { auc: number; floor: number; n: number; days: number; columns: readonly { column: string; share: number }[] }, name: (c: string) => string = (c) => c): { strength: string; frequency: string; against: string; why: string | null; caveat: string } {
  const strength = a.auc >= 0.9 ? 'clearly different' : a.auc >= 0.75 ? 'noticeably different' : a.auc >= 0.6 ? 'slightly different' : 'not told apart';
  const k = Math.round(a.auc * 100);
  const top = a.columns.slice(0, 3);
  return {
    strength,
    frequency: `A model was shown one of today’s rows and one earlier row, again and again, and asked which is today’s. It was right ${k} times in 100; guessing gets 50.`,
    against: `Compared with ${plural(a.n, 'row')} a side: today’s, and rows of ${plural(a.days, 'like day')} before it.`,
    why: top.length ? `What makes it different: ${list(top.map((c) => `${name(c.column)} (${Math.round(c.share * 100)}%)`))}.` : null,
    caveat: 'Different isn’t necessarily wrong: a planned change looks the same. The Columns tab shows what changed in each column.',
  };
}

/** The forest said honestly: where today falls among the days before, and what made it easy to single out. */
export function unlikeSaid(u: { score: number; highest: number; days: number; numbers: readonly string[] }): { strength: string; against: string; why: string | null; caveat: string } {
  const past = Math.max(0.5, u.highest);
  return {
    strength: u.score > past + 0.1 ? 'clearly unlike the days before' : u.score > past ? 'a little unlike the days before' : 'like the days before',
    against: `Today scored ${u.score.toFixed(2)}; the oddest of the ${plural(u.days, 'day')} it learned from scored ${u.highest.toFixed(2)}. Higher means easier to set apart.`,
    why: u.numbers.length ? `What set it apart most: ${list(u.numbers.slice(0, 3))}.` : null,
    caveat: 'This credit is approximate, and numbers that move together share it.',
  };
}

/** A pair's log odds ratio said as "×": how much more often two values turn up together than their shares explain. */
export const timesTogether = (logOdds: number): string => {
  const x = Math.exp(logOdds);
  return x >= 10 ? `${Math.round(x)}×` : x >= 1 ? `${x.toFixed(1)}×` : `${(1 / x).toFixed(1)}× less`;
};

/** What a column is, read from its values for any file (amendment 3; the research's semantic type badge): its role, and
 * a one-line gist where the ontology gives no meaning. */
export type ColumnRole = 'id' | 'key' | 'category' | 'code' | 'number' | 'date' | 'time' | 'text' | 'flag' | 'empty';

export const ROLE_SAID: Record<ColumnRole, string> = {
  id: 'identifier', key: 'key', category: 'category', code: 'code', number: 'number', date: 'date', time: 'date and time', text: 'free text', flag: 'yes / no', empty: 'empty',
};

interface ProfileLike {
  name: string;
  kind: 'measure' | 'code' | 'time' | 'category' | 'text' | 'empty';
  facts: { rows: number; present: number; distinct: number; min: unknown; max: unknown };
  top?: readonly { value: string; share: number }[];
  quantiles?: { p25: number; p50: number; p75: number };
}

/** A column's role: the ontology's key or an id first (`leftOut`, modelcols.ts's reason), then what its values are. */
export function columnRole(p: ProfileLike, leftOut: string | null): ColumnRole {
  if (leftOut === 'the file’s key') return 'key';
  if (p.kind === 'empty' || p.facts.present === 0) return 'empty';
  if (leftOut === 'an id' || (p.facts.distinct === p.facts.present && p.facts.present > 20 && p.kind !== 'measure' && p.kind !== 'time')) return 'id';
  if (p.facts.distinct === 2 && (p.kind === 'category' || p.kind === 'code')) return 'flag';
  if (p.kind === 'measure') return 'number';
  if (p.kind === 'time') return [p.facts.min, p.facts.max].every((v) => typeof v === 'string' && v.length <= 10) ? 'date' : 'time';
  if (p.kind === 'code') return 'code';
  if (p.kind === 'category') return 'category';
  return 'text';
}

/** A column in one line, from its values: what a reader most needs before any chart. `fmt` writes a number or a time. */
export function columnGist(p: ProfileLike, role: ColumnRole, fmt: (v: number) => string = (v) => String(v), label: (v: string) => string = (v) => v): string {
  const f = p.facts;
  const filled = f.rows ? f.present / f.rows : 0;
  const blanks = filled < 1 ? ` ${Math.round((1 - filled) * 100) || '<1'}% of rows leave it blank.` : '';
  const top = (p.top ?? []).slice(0, 3);
  const pc = (x: number) => `${Math.round(x * 100) || '<1'}%`;
  switch (role) {
    case 'key': return `The file’s key: one row for each, ${f.distinct.toLocaleString('en-US')} today.${blanks}`;
    case 'id': return `An identifier: ${f.distinct === f.present ? 'every value different' : `${f.distinct.toLocaleString('en-US')} different values`}, so it names rows rather than describing them.${blanks}`;
    case 'empty': return 'Empty today: no row has a value.';
    case 'flag': return `One of two values: ${top.map((t) => `${label(t.value)} (${pc(t.share)})`).join(' or ')}.${blanks}`;
    case 'category': case 'code': return `One of ${f.distinct.toLocaleString('en-US')} values${top.length ? `, most often ${list(top.map((t) => `${label(t.value)} (${pc(t.share)})`))}` : ''}.${blanks}`;
    case 'number': return p.quantiles && typeof f.min === 'number' && typeof f.max === 'number' ? `A number from ${fmt(f.min)} to ${fmt(f.max)}; half of rows fall between ${fmt(p.quantiles.p25)} and ${fmt(p.quantiles.p75)}.${blanks}` : `A number.${blanks}`;
    case 'date': case 'time': return `${role === 'date' ? 'Dates' : 'Times'} from ${String(f.min).slice(0, 16)} to ${String(f.max).slice(0, 16)}.${blanks}`;
    default: return `Free text, ${f.distinct.toLocaleString('en-US')} different values.${blanks}`;
  }
}

/**
 * A quantile said without statistics (amendment 3, round 2): "1 in 10 sign-ins have a latency above 341 ms today;
 * usually that line is at 420–600 ms". `q` is the quantile (0.01 to 0.99); the values come written in their unit.
 */
export function quantileSaid(q: number, column: string, noun: string, value: string, low: string, high: string): string {
  const usual = spanOf(low, high);
  if (q === 0.5) return `Half of ${noun} have ${column} above ${value} today; usually half are above ${usual}.`;
  const k = q <= 0.01 || q >= 0.99 ? '1 in 100' : q <= 0.1 || q >= 0.9 ? '1 in 10' : '1 in 4';
  return q > 0.5
    ? `The highest ${k} ${noun} by ${column} start at ${value} today; usually they start at ${usual}.`
    : `The lowest ${k} ${noun} by ${column} end at ${value} today; usually they end at ${usual}.`;
}

/** How different today's rows are, as a step on a four-step scale (0 the same as usual … 3 very different), from the
 * classifier's held-out AUC: for a picture that needs no statistics. */
export const differenceStep = (auc: number): 0 | 1 | 2 | 3 => (auc >= 0.9 ? 3 : auc >= 0.75 ? 2 : auc >= 0.6 ? 1 : 0);
export const DIFFERENCE_SAID = ['about the same as usual', 'slightly different', 'noticeably different', 'very different'] as const;

/** The classifier said for one column, in words: how different today is, and this column's part in it. */
export function apartForColumn(a: { auc: number; columns: readonly { column: string; share: number }[] }, column: string, noun: string, title: string): { head: string; part: string | null } {
  const mine = a.columns.find((c) => c.column === column);
  const top = a.columns[0];
  return {
    head: `Today’s ${noun} look ${DIFFERENCE_SAID[differenceStep(a.auc)]} from earlier days.`,
    part: mine ? `${title} ${mine === top ? 'is the biggest reason' : 'is part of the reason'}: it explains ${shareWords(mine.share)} of why today stands out.` : null,
  };
}

/** Two values written in the same unit, as a span with the unit once: "1,365–1,820 ms", "20–90"; one value alone when
 * they are the same. */
export function spanOf(low: string, high: string): string {
  if (low === high) return low;
  const unit = /\s*[^\d.,\s-][^\d]*$/.exec(high)?.[0] ?? '';
  return unit && low.endsWith(unit) ? `${low.slice(0, -unit.length)}–${high}` : `${low}–${high}`;
}

/** A share said in words, for someone who doesn't read percentages: "most", "about half", "about a third"… */
export function shareWords(x: number): string {
  if (x >= 0.8) return 'nearly all';
  if (x >= 0.6) return 'most';
  if (x >= 0.45) return 'about half';
  if (x >= 0.28) return 'about a third';
  if (x >= 0.2) return 'about a quarter';
  if (x >= 0.08) return 'a little';
  return 'very little';
}

/** Each check by a plain name, for someone who doesn't know the vocabulary (the gate cell's names are in brackets). */
export const CHECK_PLAIN: Record<CheckName, string> = {
  schema: 'the right columns', amount: 'about as many rows as usual', blanks: 'no more blanks than usual', values: 'no bad or unknown values',
  rules: 'rows keep the written rules', scope: 'exactly the expected items', needs: 'values other data allows', due: 'nothing overdue',
  reconcile: 'one row per item', shares: 'values as common as usual', shape: 'numbers spread as usual', hours: 'arrivals through the day as usual',
  pairs: 'columns go together as usual', forest: 'the day as a whole as usual', classifier: 'rows that look like earlier days’',
};
