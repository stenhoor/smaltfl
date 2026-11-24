/**
 * The Data model's map (ADR 0028 §9, phase 4): what the flow's data describes, as kinds of thing and the relations
 * between them, each kind with the files that describe it. Read from the flow document (its ontology, sources and
 * steps), the data list's columns, and a display file beside the flow (`datamodel.json`, `smaltfl-datamodel/1`) that
 * names what the ontology doesn't: a dataset's short name, the kind a file the ontology ties to none is drawn inside, the
 * joins people read that no relation names, what each file is evidence for. The display file is words and pictures,
 * as a demo's scenes are: shipped beside the data and outside every hash. A flow with none is drawn from its ontology.
 *
 * The page adds the day (`src/app/main.ts`, `dataModelNow`): each file's rows and state on the day on screen, its days
 * over the month, and what waits. Pure: no DOM, no engine.
 */
import type { FlowDocument, StepDef } from './document.js';
import type { CellState } from './month.js';
import { propertyOf, type Condition, type Noun, type ObjectType, type Ontology } from './ontology.js';

export const DATAMODEL_FORMAT = 'smaltfl-datamodel/1';

/** The icons a kind may be drawn with (the map's, `src/app/datamodel/explorer.js`). */
export const DM_ICONS = ['app', 'org', 'person', 'platform', 'control', 'vendor', 'contract', 'device', 'account', 'role', 'key', 'db', 'process', 'risk', 'incident', 'change', 'policy', 'location', 'zone', 'cert', 'bug', 'cloud'] as const;
export type DmIcon = (typeof DM_ICONS)[number];

/** What the ontology doesn't say that the map shows. Every part is optional. */
export interface DataModelFile {
  format: typeof DATAMODEL_FORMAT;
  /** By a kind's id: its icon, and what one and many of its objects are called on the map. */
  kinds?: Record<string, { icon?: DmIcon; one?: string; many?: string }>;
  /** By a file's id: its name on the map, and the kind it is drawn inside where the ontology ties it to none. */
  datasets?: Record<string, { short?: string; kind?: string }>;
  /** Joins people read that the ontology names no relation for: a column of one file holding another file's key. */
  joins?: { from: string; col: string; to: string; toCol: string; rel: string }[];
  /** The files that are evidence for another kind's objects (each control's feed): that kind, the words that join
   * them (`evidence for`), and each file's object by its id and name. */
  evidence?: { kind: string; rel?: string; datasets: Record<string, { id: string; name: string }> };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** What is wrong with a display file, one line a problem; none for a good one. */
export function dataModelProblems(v: unknown): string[] {
  if (!isRecord(v)) return ['not an object'];
  const out: string[] = [];
  if (v.format !== DATAMODEL_FORMAT) out.push(`format is ${JSON.stringify(v.format)}, not ${DATAMODEL_FORMAT}`);
  const known = new Set(['format', 'kinds', 'datasets', 'joins', 'evidence']);
  for (const k of Object.keys(v)) if (!known.has(k)) out.push(`no field ${k}`);
  if (v.kinds !== undefined) {
    if (!isRecord(v.kinds)) out.push('kinds is not an object');
    else for (const [id, k] of Object.entries(v.kinds)) {
      if (!isRecord(k)) out.push(`kinds.${id} is not an object`);
      else {
        if (k.icon !== undefined && !(DM_ICONS as readonly unknown[]).includes(k.icon)) out.push(`kinds.${id}.icon ${JSON.stringify(k.icon)} is none of the map's icons`);
        for (const f of ['one', 'many']) if (k[f] !== undefined && !isText(k[f])) out.push(`kinds.${id}.${f} is not a word`);
      }
    }
  }
  if (v.datasets !== undefined) {
    if (!isRecord(v.datasets)) out.push('datasets is not an object');
    else for (const [id, d] of Object.entries(v.datasets)) {
      if (!isRecord(d)) out.push(`datasets.${id} is not an object`);
      else for (const f of ['short', 'kind']) if (d[f] !== undefined && !isText(d[f])) out.push(`datasets.${id}.${f} is not text`);
    }
  }
  if (v.joins !== undefined) {
    if (!Array.isArray(v.joins)) out.push('joins is not a list');
    else v.joins.forEach((j, i) => {
      if (!isRecord(j) || !['from', 'col', 'to', 'toCol', 'rel'].every((f) => isText(j[f]))) out.push(`joins[${i}] needs from, col, to, toCol and rel`);
    });
  }
  if (v.evidence !== undefined) {
    const e = v.evidence;
    if (!isRecord(e) || !isText(e.kind) || !isRecord(e.datasets)) out.push('evidence needs a kind and its datasets');
    else {
      if (e.rel !== undefined && !isText(e.rel)) out.push('evidence.rel is not text');
      for (const [id, x] of Object.entries(e.datasets)) if (!isRecord(x) || !isText(x.id) || !isText(x.name)) out.push(`evidence.datasets.${id} needs an id and a name`);
    }
  }
  return out;
}

export const isDataModelFile = (v: unknown): v is DataModelFile => dataModelProblems(v).length === 0;

// ------------------------------------------------------------------ the model

/** What a day was for a file, as the map marks it: fine; fine with a note (not judged); unusual; paused and waiting;
 * paused, then decided. */
export type DmDay = 'ok' | 'note' | 'warn' | 'waiting' | 'decided';
/** A file's state on the day on screen: a day's, or described ahead and waiting for its first data, or no run. */
export type DmState = DmDay | 'awaited' | 'none';
export type DmRole = 'key' | 'category' | 'number' | 'date' | 'text';

export interface DmKind {
  id: string;
  name: string;
  /** What many of its objects are called ("units"), and one ("unit"). */
  plural: string;
  noun: string;
  icon: DmIcon | 'box';
  /** Its own dataset, and its key there. */
  dataset: string;
  key: string[];
  /** The files drawn inside it, its own first. */
  datasets: string[];
  /** Its objects on the day on screen: its own dataset's rows (the page's). */
  count: number | null;
}

export interface DmColumn {
  name: string;
  title: string;
  meaning: string;
  type: string;
  labels: Record<string, string>;
  bad: string[];
  role: DmRole;
  unit: string | null;
}

/** A check a file is held to, said as its rule is written: the ontology's (written) or learned from its own days. */
export interface DmCheck {
  says: string;
  column: string | null;
  mode: 'stops' | 'warns';
  origin: 'Data model' | 'Learned';
}

export interface DmDataset {
  id: string;
  short: string;
  description: string;
  /** The flow it belongs to, by name. */
  flow: string;
  /** What one row is ("one application: tier 1"), or null where nothing says. */
  one: string | null;
  kind: string;
  columns: DmColumn[];
  checks: DmCheck[];
  /** The outputs built from it, by id. */
  builds: string[];
  /** A file with no daily loads: one fixed file. */
  fixed: boolean;
  /** What it is evidence for, where the display file says. */
  control?: string;
  controlName?: string;
  /** Described ahead of its data (ADR 0027 §5): the day said for it, where one is. */
  awaited?: string;
  // The day, the page's: absent until it adds them.
  rowsToday: number | null;
  rowsUsual: [number, number] | null;
  /** Its state on each day of the month, null where it has no run. */
  days: (DmDay | null)[];
  counts: (number | null)[];
  heads: (string | null)[];
  state: DmState;
  /** The day its rows on the map come from, where that isn't the day on screen. */
  refDay?: string;
}

/** How many of a join's rows found their match on a day: what the page counted in the engine. */
export interface DmMatch {
  day: string;
  rows: number;
  hit: number;
  blank: number;
  miss: string[];
}

export interface DmJoin {
  from: string;
  /** The column of `from` holding the key; null for evidence, which no column says. */
  col: string | null;
  to: string;
  toCol: string;
  rel: string;
  since: string | null;
  match?: DmMatch | null;
}

export interface DmRelation {
  from: string;
  to: string;
  name: string;
  label: string;
  joins: number;
  since: string | null;
  via: { ds: string; col: string | null }[];
}

export interface DmOutput {
  id: string;
  /** The steps or files it reads, as the plan does. */
  reads: string[];
  about: string | null;
  /** The files it is built from. */
  from: string[];
  rows: number | null;
  waiting: boolean;
}

export interface DmMonthDay {
  day: string;
  state: DmDay | 'none';
  held: string[];
}

export interface DmMarker {
  day: string;
  kind: 'change' | 'event';
  id: string;
  name?: string;
}

export interface DmModel {
  estate: string;
  /** The day on screen. */
  day: string | null;
  kinds: DmKind[];
  datasets: DmDataset[];
  joins: DmJoin[];
  relations: DmRelation[];
  outputs: DmOutput[];
  month: DmMonthDay[];
  markers: DmMarker[];
}

/** What the model is built from besides the document. */
export interface DmInputs {
  /** A file's columns, as its data list declares them: name and type. */
  columns: (source: string) => readonly (readonly [string, string])[] | undefined;
  /** The files with daily loads: any other is one fixed file. */
  daily: ReadonlySet<string>;
  display?: DataModelFile | null;
  /** The day a relation or a dataset described ahead begins, where a change set began it (`link:<id>`, `awaited:<id>`). */
  since?: (key: string) => string | null;
}

const ACRO = /\b(tls|mfa|edr|waf|cmdb|hr|dr|sla|id|sbom|csf|it|api|sso|vpn)\b/gi;
/** A dataset's id as people read it: "pentest_schedule" as "Pentest schedule", "edr_coverage" as "EDR coverage". */
export const plainName = (id: string): string => {
  const t = id.replace(/_/g, ' ').replace(ACRO, (m) => m.toUpperCase());
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** A kind's icon where the display file gives none: by the words its id and name use. */
export function iconFor(kind: Pick<ObjectType, 'id' | 'name'>): DmIcon | 'box' {
  const t = `${kind.id} ${kind.name}`.toLowerCase();
  const by: [RegExp, DmIcon][] = [
    [/\b(org|unit|team|department|division|segment)/, 'org'],
    [/\b(person|people|employee|staff|user|leader|owner)/, 'person'],
    [/\b(app|application|service|system)/, 'app'],
    [/\b(platform|host|server|cluster|node)/, 'platform'],
    [/\b(control|safeguard)/, 'control'],
    [/\b(vendor|supplier|third)/, 'vendor'],
    [/\b(contract|agreement)/, 'contract'],
    [/\b(device|endpoint|laptop|asset)/, 'device'],
    [/\b(account|identity|login|sign-?in)/, 'account'],
    [/\b(role|group|entitlement)/, 'role'],
    [/\b(key|secret|credential)/, 'key'],
    [/\b(database|datastore|db)\b/, 'db'],
    [/\b(process|workflow)/, 'process'],
    [/\b(risk)/, 'risk'],
    [/\b(incident|alert|case)/, 'incident'],
    [/\b(change|release)/, 'change'],
    [/\b(policy|standard|requirement)/, 'policy'],
    [/\b(location|site|region|office)/, 'location'],
    [/\b(zone|network|subnet)/, 'zone'],
    [/\b(cert|certificate)/, 'cert'],
    [/\b(vuln|bug|finding|defect)/, 'bug'],
    [/\b(cloud|resource)/, 'cloud'],
  ];
  return by.find(([re]) => re.test(t))?.[1] ?? 'box';
}

const NUMERIC = /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DOUBLE|REAL|FLOAT|DECIMAL|NUMERIC|HUGEINT)/i;
const DATED = /^(DATE|TIMESTAMP|TIME)/i;
const DATE_NAME = /(^|_)(last|next|first)_|_(on|at|due|date|since|until|from|to|by)$|^(date|day|when)$/i;

/** A plural people read: "unit" as "units", "policy" as "policies". */
const pluralOf = (one: string): string => (/(s|x|ch|sh)$/.test(one) ? `${one}es` : /[^aeiou]y$/.test(one) ? `${one.slice(0, -1)}ies` : `${one}s`);
const article = (noun: string): string => (/^[aeiou]/i.test(noun) && !/^(uni|use|eu)/i.test(noun) ? 'an ' : 'a ') + noun;

/** The files each output is built from, through every step between: by output id. */
function sourcesOfOutputs(doc: FlowDocument): Map<string, string[]> {
  const steps = new Map(doc.steps.map((s) => [s.id, s]));
  const files = new Set(doc.sources.map((s) => s.id));
  const memo = new Map<string, Set<string>>();
  const from = (id: string, seen: Set<string>): Set<string> => {
    const got = memo.get(id);
    if (got) return got;
    if (files.has(id)) return new Set([id]);
    const step = steps.get(id);
    if (!step || seen.has(id)) return new Set();
    seen.add(id);
    const out = new Set<string>();
    for (const i of step.inputs) for (const f of from(i, seen)) out.add(f);
    memo.set(id, out);
    return out;
  };
  return new Map(doc.steps.filter((s) => s.dataset).map((s) => [s.id, [...from(s.id, new Set())].sort()]));
}

/** A condition in the ontology's own words: "data class card data or personal data · lifecycle live or retiring". */
function conditionSaid(ontology: Ontology | undefined, dataset: string, where: Condition): string {
  return Object.entries(where).map(([column, v]) => {
    const values = Array.isArray(v) ? v : [v];
    const p = propertyOf(ontology, dataset, column);
    const title = (p?.title ?? column.replace(/_/g, ' ')).toLowerCase();
    if (values.length === 1 && values[0] === 'yes') return title;
    const words = values.map((x) => (p?.values?.[x] ?? x).toLowerCase());
    return words.every((w) => w.startsWith(title)) ? words.join(' or ') : `${title} ${words.join(' or ')}`;
  }).join(' · ');
}

/**
 * The flow's map before the day is added: kinds, files, joins, relations and outputs. Every day field is empty (no
 * rows, no days, state `none`, or `awaited` for a file described ahead) until the page adds it.
 */
export function dataModelOf(doc: FlowDocument, inputs: DmInputs): DmModel {
  const o = doc.ontology;
  const display = inputs.display ?? null;
  const types = o?.objectTypes ?? [];
  const sources = doc.sources;
  const ids = new Set(sources.map((s) => s.id));
  const nounOfKind = (t: ObjectType): Noun => {
    const d = display?.kinds?.[t.id];
    const listed = o?.nouns?.[t.dataset];
    const one = d?.one ?? listed?.one ?? t.name.toLowerCase();
    return { one, many: d?.many ?? listed?.many ?? pluralOf(one) };
  };
  const rowsOf = new Map((o?.rows ?? []).map((r) => [r.dataset, r]));
  const flowOf = (id: string) => doc.flows?.find((f) => f.sources.includes(id))?.name ?? doc.name;
  const colsOf = (id: string) => inputs.columns(id) ?? [];

  // Each file's kind: the display file's; the kind it is the list of; its rows entry's; else the kind whose key it
  // carries (the one with the fewest files so far where it carries several: a file of mappings or exceptions describes
  // the narrower kind); else the kind most of its own flow's files have.
  const kindOf = new Map<string, string>();
  for (const s of sources) {
    const said = display?.datasets?.[s.id]?.kind;
    const own = types.find((t) => t.dataset === s.id)?.id;
    const entry = rowsOf.get(s.id)?.of;
    const k = [said, own, entry].find((x) => x !== undefined && types.some((t) => t.id === x));
    if (k) kindOf.set(s.id, k);
  }
  const count = (k: string) => [...kindOf.values()].filter((x) => x === k).length;
  for (const s of sources) {
    if (kindOf.has(s.id)) continue;
    const names = new Set(colsOf(s.id).map(([c]) => c.toLowerCase()));
    const carried = types.filter((t) => t.key.length > 0 && t.key.every((c) => names.has(c.toLowerCase())));
    if (carried.length) kindOf.set(s.id, [...carried].sort((a, b) => count(a.id) - count(b.id) || types.indexOf(a) - types.indexOf(b))[0]!.id);
  }
  for (const s of sources) {
    if (kindOf.has(s.id)) continue;
    const part = doc.flows?.find((f) => f.sources.includes(s.id));
    const near = (part?.sources ?? []).map((x) => kindOf.get(x)).filter((x): x is string => !!x);
    const most = [...new Set(near)].sort((a, b) => near.filter((x) => x === b).length - near.filter((x) => x === a).length)[0];
    if (most) kindOf.set(s.id, most);
  }

  // A file still tied to no kind (a flow whose ontology names no kinds of thing, or files of no kind's key) is drawn in
  // a kind of its own: what its one file's rows are where it is alone, else its files together.
  const loose = sources.filter((s) => !kindOf.has(s.id));
  const extra: ObjectType[] = [];
  if (loose.length) {
    const first = loose[0]!;
    const noun = loose.length === 1 ? o?.nouns?.[first.id] : undefined;
    const id = types.some((t) => t.id === 'files') ? '_files' : 'files';
    const name = noun ? noun.one.charAt(0).toUpperCase() + noun.one.slice(1) : types.length ? 'Other files' : 'Files';
    extra.push({ id, name, dataset: first.id, key: [], title: '' });
    for (const s of loose) kindOf.set(s.id, id);
  }
  const allTypes = [...types, ...extra];

  const outputs = sourcesOfOutputs(doc);
  const watched = new Set(Object.keys(doc.publish?.watch ?? {}));
  const keyCols = new Map(types.filter((t) => t.key.length === 1).map((t) => [t.key[0]!.toLowerCase(), t]));

  const columnsOf = (id: string, kind: ObjectType | undefined): DmColumn[] => colsOf(id).map(([name, type]) => {
    const p = propertyOf(o, id, name);
    const entryKey = rowsOf.get(id)?.key;
    const isKey = (kind?.dataset === id && kind.key.includes(name)) || entryKey === name || (keyCols.has(name.toLowerCase()) && /_id$/i.test(name));
    const role: DmRole = isKey ? 'key' : p?.values && Object.keys(p.values).length ? 'category' : NUMERIC.test(type) ? 'number' : DATED.test(type) || DATE_NAME.test(name) ? 'date' : 'text';
    return { name, title: p?.title ?? plainName(name), meaning: p?.description ?? '', type, labels: { ...(p?.values ?? {}) }, bad: [...(p?.bad ?? [])], role, unit: p?.unit ?? null };
  });

  const checksOf = (id: string, kind: ObjectType | undefined, columns: DmColumn[]): DmCheck[] => {
    const out: DmCheck[] = [];
    const entry = rowsOf.get(id);
    if (entry && kind) {
      out.push({ says: `One row per ${nounOfKind(kind).one} in scope`, column: null, mode: 'stops', origin: 'Data model' });
      const key = entry.key ?? kind.key[0];
      if (key) out.push({ says: `No ${key} blank or repeated`, column: key, mode: 'stops', origin: 'Data model' });
    }
    for (const c of columns) {
      const p = propertyOf(o, id, c.name);
      for (const b of c.bad) out.push({ says: `${c.labels[b] ?? b} is a bad value: warn when it rises`, column: c.name, mode: 'warns', origin: 'Data model' });
      for (const band of p?.expect ?? []) {
        if (band.datasets && !band.datasets.some((x) => x.toLowerCase() === id.toLowerCase())) continue;
        const [lo, hi] = band.share;
        const name = c.labels[band.value] ?? band.value;
        out.push({ says: lo === 0 ? `${name} on at most ${Math.round(hi * 100)}% of rows` : `${name} on ${Math.round(lo * 100)}–${Math.round(hi * 100)}% of rows`, column: c.name, mode: 'stops', origin: 'Data model' });
      }
    }
    if (watched.has(id)) {
      out.push({ says: 'About as many rows as on a usual day', column: null, mode: 'stops', origin: 'Learned' });
      out.push({ says: 'Each value about as common as usual', column: null, mode: 'warns', origin: 'Learned' });
    }
    return out;
  };

  const oneOf = (id: string, kind: ObjectType | undefined): string | null => {
    const entry = rowsOf.get(id);
    if (entry && kind) {
      const said = entry.where ? conditionSaid(o, kind.dataset, entry.where) : '';
      return `one ${nounOfKind(kind).one}${said ? `: ${said}` : ''}`;
    }
    if (kind?.dataset === id && !extra.includes(kind)) return `one ${nounOfKind(kind).one}`;
    const n = o?.nouns?.[id];
    return n ? `one ${n.one}` : null;
  };

  const evidence = display?.evidence;
  const empty = { rowsToday: null, rowsUsual: null, days: [], counts: [], heads: [], state: 'none' as DmState };
  const datasets: DmDataset[] = sources.filter((s) => kindOf.has(s.id)).map((s) => {
    const kind = allTypes.find((t) => t.id === kindOf.get(s.id));
    const columns = columnsOf(s.id, kind);
    const ev = evidence?.datasets[s.id];
    return {
      id: s.id,
      short: display?.datasets?.[s.id]?.short ?? plainName(s.id),
      description: s.description ?? '',
      flow: flowOf(s.id),
      one: oneOf(s.id, kind),
      kind: kindOf.get(s.id)!,
      columns,
      checks: checksOf(s.id, kind, columns),
      builds: [...outputs].filter(([, from]) => from.includes(s.id)).map(([id]) => id).sort(),
      fixed: !inputs.daily.has(s.id),
      ...(ev ? { control: ev.id, controlName: ev.name } : {}),
      ...empty,
    };
  });
  // A file described ahead of its data (ADR 0027 §5): drawn in the kind its key names, dashed until it arrives.
  for (const a of o?.awaited ?? []) {
    if (ids.has(a.id)) continue;
    const kind = types.find((t) => t.key.length === 1 && a.key.includes(t.key[0]!)) ?? types.find((t) => a.columns.some((c) => t.key.includes(c.column)));
    if (!kind) continue;
    const day = inputs.since?.(`awaited:${a.id}`) ?? null;
    datasets.push({
      id: a.id,
      short: display?.datasets?.[a.id]?.short ?? a.name,
      description: a.description ?? '',
      flow: doc.name,
      one: `one ${a.row.one}`,
      kind: kind.id,
      columns: a.columns.map((c) => ({ name: c.column, title: c.title ?? plainName(c.column), meaning: c.description, type: 'TEXT', labels: {}, bad: [], role: a.key.includes(c.column) ? 'key' : 'text', unit: null })),
      checks: [],
      builds: [],
      fixed: false,
      ...(day ? { awaited: day } : { awaited: '' }),
      ...empty,
      state: 'awaited',
    });
  }
  const shown = new Set(datasets.map((d) => d.id));
  const kinds: DmKind[] = allTypes.map((t) => {
    const n = extra.includes(t) ? (loose.length === 1 && o?.nouns?.[t.dataset] ? o.nouns[t.dataset]! : { one: 'file', many: 'files' }) : nounOfKind(t);
    const mine = datasets.filter((d) => d.kind === t.id).map((d) => d.id);
    return {
      id: t.id,
      name: t.name,
      plural: n.many,
      noun: n.one,
      icon: display?.kinds?.[t.id]?.icon ?? iconFor(t),
      dataset: t.dataset,
      key: [...t.key],
      datasets: [...mine.filter((d) => d === t.dataset), ...mine.filter((d) => d !== t.dataset)],
      count: null,
    };
  }).filter((k) => k.datasets.length > 0);

  // The joins: each relation the ontology names, on its own files; then the display file's; then every column that
  // holds another kind's key; then what each file is evidence for.
  const joins: DmJoin[] = [];
  const has = (from: string, col: string | null) => joins.some((j) => j.from === from && j.col === col);
  const typeOf = (id: string) => types.find((t) => t.id === id);
  for (const l of o?.linkTypes ?? []) {
    const a = typeOf(l.from);
    const b = typeOf(l.to);
    if (!a || !b || !shown.has(a.dataset) || !shown.has(b.dataset)) continue;
    for (const [col, toCol] of l.on) if (!has(a.dataset, col)) joins.push({ from: a.dataset, col, to: b.dataset, toCol, rel: l.name.toLowerCase(), since: inputs.since?.(`link:${l.id}`) ?? null });
  }
  for (const j of display?.joins ?? []) {
    if (shown.has(j.from) && shown.has(j.to) && !has(j.from, j.col)) joins.push({ from: j.from, col: j.col, to: j.to, toCol: j.toCol, rel: j.rel, since: null });
  }
  for (const d of datasets) {
    for (const c of d.columns) {
      const t = keyCols.get(c.name.toLowerCase());
      if (!t || t.dataset === d.id || !shown.has(t.dataset) || has(d.id, c.name)) continue;
      joins.push({ from: d.id, col: c.name, to: t.dataset, toCol: t.key[0]!, rel: 'about', since: null });
    }
  }
  const evKind = evidence ? typeOf(evidence.kind) : undefined;
  if (evidence && evKind && shown.has(evKind.dataset)) {
    for (const id of Object.keys(evidence.datasets)) if (shown.has(id)) joins.push({ from: id, col: null, to: evKind.dataset, toCol: evKind.key[0] ?? '', rel: evidence.rel ?? 'evidence for', since: null });
  }

  // The relations between kinds: the joins grouped by the kinds they join and their words.
  const kindOfDs = new Map(datasets.map((d) => [d.id, d.kind]));
  const shortOf = new Map(datasets.map((d) => [d.id, d.short]));
  const groups = new Map<string, DmJoin[]>();
  for (const j of joins) {
    const key = `${kindOfDs.get(j.from)}|${kindOfDs.get(j.to)}|${j.rel}`;
    groups.set(key, [...(groups.get(key) ?? []), j]);
  }
  const relations: DmRelation[] = [...groups.entries()].map(([key, js]) => {
    const [from, to, name] = key.split('|') as [string, string, string];
    const toKind = kinds.find((k) => k.id === to);
    const noun = toKind?.noun ?? to;
    const own = js.length === 1 && kinds.find((k) => k.id === from)?.dataset === js[0]!.from;
    const label = name === 'about'
      ? js.length > 1 ? `${js.length} datasets name ${article(noun)}` : `${shortOf.get(js[0]!.from)} name ${article(noun)}`
      : name === (evidence?.rel ?? 'evidence for') && js.every((j) => j.col === null)
        ? `${name} · ${js.length} datasets`
        : own || js.length > 1 ? name : `${shortOf.get(js[0]!.from)} ${name} ${article(noun)}`;
    const since = js.map((j) => j.since).filter((x): x is string => !!x).sort()[0] ?? null;
    return { from, to, name, label, joins: js.length, since, via: js.map((j) => ({ ds: j.from, col: j.col })) };
  });

  const stepOf = new Map<string, StepDef>(doc.steps.map((s) => [s.id, s]));
  const outs: DmOutput[] = [...outputs].map(([id, from]) => {
    const st = stepOf.get(id)!;
    return { id, reads: [...st.inputs], about: st.dataset?.description ?? st.description ?? null, from, rows: null, waiting: false };
  });

  return { estate: doc.name, day: null, kinds, datasets, joins, relations, outputs: outs, month: [], markers: [] };
}

// ------------------------------------------------------------------ the day, as the page adds it

/** A file's day on the map from the month's cell (core/month.ts): a hold is the day's wait while the day waits, and
 * its decision once decided; a day with no run is none. */
export function dayOfCell(cell: CellState | null, waits: boolean): DmDay | null {
  if (cell === null || cell === 'absent') return null;
  if (cell === 'held' || cell === 'refused') return waits ? 'waiting' : 'decided';
  if (cell === 'unusual') return 'warn';
  if (cell === 'unlearned') return 'note';
  return 'ok';
}

/** The usual rows of a file: the tenth and ninetieth percentiles of its days before, where it has three or more. */
export function usualOf(counts: readonly (number | null)[]): [number, number] | null {
  const xs = counts.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (xs.length < 3) return null;
  const at = (q: number) => {
    const k = (xs.length - 1) * q;
    const f = Math.floor(k);
    const c = Math.min(f + 1, xs.length - 1);
    return xs[f]! + (xs[c]! - xs[f]!) * (k - f);
  };
  return [Math.round(at(0.1)), Math.round(at(0.9))];
}
