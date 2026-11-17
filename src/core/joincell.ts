/**
 * Building in the app: the join form (ADR 0025 §10). Two datasets, the key on each side and the columns to take are
 * written as a notebook cell, in a notebook of the flow's own kept for what is made in the app (`joins.nb.ts`), as the
 * gate toggles write gate cells (ADR 0014 slice 6): the text is the flow's, and the step is derived from it by the
 * parser that reads any notebook (the page loads it when someone first builds, `src/app/derive.ts`). So a join made in
 * the app is a join written on disk: download the notebook, and reading the flow's folder gives the same step.
 *
 * Pure: no DOM, no engine, no parser. `withJoin` gives the document with its notebooks' text changed and its steps as
 * they were; deriving them again is the caller's. Nothing the data is made from reads this module.
 */
import { FILLED_FROM, type FlowDocument, type NotebookDef } from './document.js';
import { emitJoin, type JoinColumns } from './emit.js';

const lower = (x: string) => x.toLowerCase();
/** "A", "A and B", "A, B and C". */
const listed = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** The notebook the app writes its joins in, beside the flow's own. */
export const JOINS_NOTEBOOK = 'joins.nb.ts';

/** A join, as the form gives it. */
export interface JoinSpec extends JoinColumns {
  /** What the new dataset is called: a name no source or step has, in lower case, letters, digits and underscores. */
  name: string;
  /** What it is, in a sentence: the dataset's description. */
  description?: string;
}

/** What a dataset may be read as from the flow's own notebook: the notebook that defines it, and its name there. */
function definedIn(doc: FlowDocument, id: string): string | null {
  const step = Object.entries(doc.cells ?? {}).find(([k]) => lower(k) === lower(id))?.[1];
  if (step) return step.notebook;
  for (const o of doc.outline ?? []) if (o.cells.some((c) => c.kind === 'source' && c.source !== undefined && lower(c.source) === lower(id))) return o.path;
  return null;
}

/** The joined dataset's columns by name, as `emitJoin` names them: the left's as they are, a right column a taken
 * left column shares named after its dataset. */
export function joinedColumns(spec: JoinColumns): string[] {
  const taken = new Set(spec.take.left.map(lower));
  return [...spec.take.left, ...spec.take.right.map((c) => (taken.has(lower(c)) ? `${spec.right}_${c}` : c))];
}

/** Whether a dataset is built from a feed a held day can fill from another day: a fill step, or a step that reads one. */
function readsFill(doc: FlowDocument, id: string): boolean {
  const steps = new Map(doc.steps.map((st) => [lower(st.id), st]));
  const seen = new Set<string>();
  const stack = [lower(id)];
  while (stack.length) {
    const at = stack.pop()!;
    if (seen.has(at)) continue;
    seen.add(at);
    const step = steps.get(at);
    if (!step) continue;
    if (step.kind === 'fill') return true;
    stack.push(...step.inputs.map(lower));
  }
  return false;
}

/**
 * Why a join can't be written (ADR 0025 §10), each in a sentence; none, and it can. Its name is taken or isn't a name;
 * a side isn't a dataset the flow has; it joins a dataset to itself; it has no key, or a key column a side doesn't
 * have; it takes nothing, or two columns that would have one name; a side is a step another flow keeps to itself; or
 * a side is built from a feed a held day can fill and the join leaves `filled_from` out, which the run would stop on
 * (ADR 0009 amendment 1). `columns` gives a dataset's columns where they are known (the day's run), undefined where
 * they aren't.
 */
export function joinProblems(doc: FlowDocument, spec: JoinSpec, columns: (dataset: string) => readonly string[] | undefined = () => undefined): string[] {
  const out: string[] = [];
  const ids = new Set([...doc.sources, ...doc.steps].map((x) => lower(x.id)));
  if (!/^[a-z][a-z0-9_]*$/.test(spec.name)) out.push('Its name is lower-case letters, digits and underscores, and starts with a letter');
  else if (ids.has(lower(spec.name))) out.push(`${spec.name} is a name the flow uses already`);
  if (!doc.notebooks) out.push(`${doc.name} isn’t written as notebooks: a join is written as a cell`);
  for (const side of [spec.left, spec.right]) {
    if (!ids.has(lower(side))) out.push(`${side} isn’t a dataset of this flow`);
    else if (!definedIn(doc, side)) out.push(`${side} isn’t written in a notebook, so a cell can’t read it`);
  }
  if (lower(spec.left) === lower(spec.right)) out.push('A join is of two datasets: the same one is named twice');
  if (!spec.on.length) out.push('A join needs a key: a column on each side whose values match');
  const has = (dataset: string, column: string) => {
    const cols = columns(dataset);
    return cols === undefined || cols.some((c) => lower(c) === lower(column));
  };
  for (const [l, r] of spec.on) {
    if (!has(spec.left, l)) out.push(`${spec.left} has no column ${l}`);
    if (!has(spec.right, r)) out.push(`${spec.right} has no column ${r}`);
  }
  for (const c of spec.take.left) if (!has(spec.left, c)) out.push(`${spec.left} has no column ${c}`);
  for (const c of spec.take.right) if (!has(spec.right, c)) out.push(`${spec.right} has no column ${c}`);
  if (!spec.take.left.length && !spec.take.right.length) out.push('A join takes at least one column');
  // Two columns of the joined dataset with one name: a column taken twice, or a right column named after its dataset
  // onto a name the left has.
  const names = joinedColumns(spec);
  const twice = names.filter((n, i) => names.findIndex((m) => lower(m) === lower(n)) !== i);
  for (const n of new Set(twice.map(lower))) out.push(`${names.find((m) => lower(m) === n)} would be two columns of the join: take one of them`);
  // Everything built from a feed a held day can fill says which rows came from another day.
  const filled = [spec.left, spec.right].filter((side) => ids.has(lower(side)) && readsFill(doc, side));
  if (filled.length && names.length && !names.some((n) => lower(n) === FILLED_FROM)) {
    out.push(`${listed(filled)} ${filled.length === 1 ? 'is' : 'are'} built from a feed a held day can fill from another day: take ${FILLED_FROM}, so the rows that came from another day say so`);
  }
  // A step of a flow this one reads is read where that flow publishes it (ADR 0025 §1).
  for (const side of [spec.left, spec.right]) {
    const part = (doc.flows ?? []).find((f) => f.steps.some((s) => lower(s) === lower(side)));
    const step = doc.steps.find((s) => lower(s.id) === lower(side));
    if (part && step && step.dataset === undefined) out.push(`${side} is a step ${part.name} keeps to itself: a flow reads what another publishes`);
  }
  return [...new Set(out)];
}

/** A join in words, for the record and the sheet: "Joined apps with org_units on owner_team_id = org_unit_id, as
 * apps_with_units: every row of apps, with name and level from org_units". */
export function joinSaid(spec: JoinSpec): string {
  const on = spec.on.map(([l, r]) => (lower(l) === lower(r) ? l : `${l} = ${r}`)).join(' and ');
  const kept = spec.how === 'left' ? `every row of ${spec.left}` : `the rows of ${spec.left} that find a match`;
  const taken = spec.take.right.length ? `, with ${listed(spec.take.right)} from ${spec.right}` : '';
  return `Joined ${spec.left} with ${spec.right} on ${on}, as ${spec.name}: ${kept}${taken}`;
}

/** The module a notebook is imported as from the joins' notebook, at the flow's folder: `./hr/org.nb.js`. */
const moduleOf = (path: string): string => `${path.startsWith('.') ? '' : './'}${path.replace(/\.ts$/, '.js')}`;

const HEAD = `// Joins made in the app (ADR 0025 §10): each a cell the join form wrote. Edit it as any notebook.
import { cell, sql } from 'smaltnb';
import { publish } from 'smaltfl/notebook';
`;
const PUBLISHED = "cell('published');";

/** A cell's text for a join: its SQL as a tagged template that reads the two datasets by name. */
function cellText(spec: JoinSpec): string {
  const body = emitJoin(spec, (dataset) => `\${${dataset}}`).split('\n').map((line) => `  ${line}`).join('\n');
  return `cell('${spec.name}', { lang: 'sql' });\nexport const ${spec.name} = sql\`\n${body}\`;\n`;
}

/** A string as a TypeScript single-quoted literal. */
const quoted = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * A document with a join written into it (ADR 0025 §10): the joins' notebook made where the flow has none, the two
 * datasets imported there from the notebooks that define them, the join's cell written before the cell that
 * publishes, and the new dataset published with its description. Only the notebooks change: the steps are derived
 * from them again by the caller. For a join `joinProblems` says nothing against.
 */
export function withJoin(doc: FlowDocument, spec: JoinSpec): FlowDocument {
  const notebooks = doc.notebooks ?? [];
  const at = notebooks.findIndex((n) => n.path === JOINS_NOTEBOOK);
  const source = at >= 0 ? notebooks[at]!.source : `${HEAD}\n${PUBLISHED}\n`;
  const lines = source.split('\n');
  // Each side imported from the notebook that defines it, once: after the last import the notebook has.
  const lastImport = lines.reduce((k, line, i) => (line.startsWith('import ') ? i : k), -1);
  const wanted = [spec.left, spec.right].map((d) => {
    const from = definedIn(doc, d);
    const step = [...doc.sources, ...doc.steps].find((x) => lower(x.id) === lower(d))!.id;
    return { name: step, line: `import { ${step} } from '${moduleOf(from ?? JOINS_NOTEBOOK)}';`, own: from === JOINS_NOTEBOOK };
  });
  const imported = (name: string) => lines.some((line) => line.startsWith('import ') && new RegExp(`[{,]\\s*${name}\\s*[,}]`).test(line));
  const imports = [...new Set(wanted.filter((w) => !w.own && !imported(w.name)).map((w) => w.line))];
  const withImports = [...lines.slice(0, lastImport + 1), ...imports, ...lines.slice(lastImport + 1)];
  // The cell before the one that publishes; the dataset published at the end.
  const pub = withImports.findIndex((line) => line.trim() === PUBLISHED);
  const cell = cellText(spec).split('\n');
  const head = pub >= 0 ? withImports.slice(0, pub) : withImports;
  const tail = pub >= 0 ? withImports.slice(pub) : [PUBLISHED];
  while (tail.length && tail.at(-1) === '') tail.pop();
  const description = spec.description ?? `${spec.left} with ${spec.right}, joined on ${spec.on.map(([l]) => l).join(' and ')}`;
  const text = [...head, ...cell, ...tail, `publish(${spec.name}, { description: ${quoted(description)} });`, ''].join('\n');
  const next: NotebookDef = { path: JOINS_NOTEBOOK, source: text };
  return { ...doc, notebooks: at >= 0 ? notebooks.map((n, i) => (i === at ? next : n)) : [...notebooks, next] };
}

/** A document without a join the form wrote: its cell and its publish line taken out of the joins' notebook, and the
 * notebook with them once nothing is left in it. The steps are derived again by the caller. Imports stay: an import
 * nothing reads is no harm. */
export function withoutJoin(doc: FlowDocument, name: string): FlowDocument {
  const notebooks = doc.notebooks ?? [];
  const at = notebooks.findIndex((n) => n.path === JOINS_NOTEBOOK);
  if (at < 0) return doc;
  const lines = notebooks[at]!.source.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`cell('${name}'`));
  if (start < 0) return doc;
  // The cell runs to the line that closes its template.
  let end = start;
  while (end < lines.length - 1 && !lines[end]!.trimEnd().endsWith('`;')) end++;
  const kept = [...lines.slice(0, start), ...lines.slice(end + 1)].filter((line, i, all) => !(line.startsWith(`publish(${name},`) || line === `publish(${name});`) && !(line === '' && all[i - 1] === ''));
  const left = kept.some((line) => line.startsWith("cell('") && line.trim() !== PUBLISHED);
  if (!left) return { ...doc, notebooks: notebooks.filter((_, i) => i !== at) };
  return { ...doc, notebooks: notebooks.map((n, i) => (i === at ? { ...n, source: kept.join('\n') } : n)) };
}

/** The joins the form wrote, by name, from the joins' notebook's cells. */
export function joinsOf(doc: FlowDocument): string[] {
  const o = (doc.outline ?? []).find((x) => x.path === JOINS_NOTEBOOK);
  return (o?.cells ?? []).filter((c) => c.kind === 'step' && c.step !== undefined).map((c) => c.step!);
}
