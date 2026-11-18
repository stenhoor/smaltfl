/**
 * The flow document: what people write and read (ADR 0004 §1). It is the source of truth, a plain JSON file that
 * diffs in Git, and it says what a flow computes. How it runs is the flow plan's business (plan.ts).
 *
 * Expressions are SQL expression text (smaltdb's SQL), so a visual step reads the way its SQL would. Steps refer to
 * their inputs, and SQL steps to their inputs' data, by the inputs' ids.
 */
import { calendarProblems, EVERIES, isEvery, type CalendarDef, type Every } from './calendar.js';
import type { AcceptedBand, ColumnChange, RuleInput } from './flowedit.js';
import { CHECK_MODES, CHECK_NAMES, gateProblems, type CheckMode, type CheckName, type GateDef } from './gates.js';
import { marksVerdicts, NEEDS_FIELDS, ROWS_FIELDS, type Ontology } from './ontology.js';
import { checkStepOf, FIX_KINDS, rulesIssues } from './rules.js';
import { DECIDE, DECIDE_OPTIONS, type Policies } from './policy.js';
import type { ParamType, ParamValue } from './sqltext.js';
import { renameIdentifier, SqlTextError, tokens } from './sqltext.js';

/**
 * The formats this version reads: 1; 2 for a document that says what holds its publication (ADR 0009 §2); 3 for one
 * that says how its days are judged (ADR 0010 §10); 4 for one whose steps are its notebooks' cells (ADR 0011); 5 for a
 * notebook flow that puts the ontology first (ADR 0027 §4, Q-274): every source says what one row is, every change
 * set says its kind and why, a closed list is enforced by a check step, and the columns of a file the flow doesn't
 * take are set aside by name (`ontology.aside`). Whether every column a source declares is described is checked
 * where the columns are known (described.ts `undescribed`). A format-4 document runs as it always did.
 */
export const DOCUMENT_FORMATS = [1, 2, 3, 4, 5] as const;
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number];

/** Whether a watch is given in the general form, as an object of its settings, not as a history's file name. */
export const isGeneralWatch = (w: unknown): w is WatchDef => typeof w === 'object' && w !== null && !Array.isArray(w);

/**
 * The format a document must say it is, so an older build refuses a flow it would judge differently rather than judge
 * it (Q-47, ADR 0010 §10): 3 with a calendar block, a watch given as an object, or an ontology mark that changes verdicts
 * (`bad`, `newValues`, `after`); else 2 with a publish block; else 1. 4 for a document whose steps are its notebooks'
 * exported cells (ADR 0011 §1), whatever else it has. Decided here and in `planKind`.
 */
export const documentFormat = (doc: { publish?: unknown; calendar?: unknown; ontology?: unknown; notebooks?: unknown }): DocumentFormat => {
  if (doc.notebooks !== undefined) return 4;
  const watch = typeof doc.publish === 'object' && doc.publish !== null ? (doc.publish as { watch?: unknown }).watch : undefined;
  const general = typeof watch === 'object' && watch !== null && Object.values(watch).some(isGeneralWatch);
  if (doc.calendar !== undefined || general || marksVerdicts(doc.ontology as Ontology | undefined)) return 3;
  return doc.publish === undefined ? 1 : 2;
};

/**
 * What pauses publication (ADR 0009 §2). `checks`: a `fail` rule failed, or more rows were dropped than `maxDropped`
 * allows. `wrong`: the watched source's story says something wrong on the day. `short`: it says so and the day's rows
 * are below their range, which narrows `wrong`; a flow holds on one or the other. `unlearned`, beside one of them: a
 * day with nothing to compare against, which is published marked unless a flow lists it (ADR 0010 §1, Q-53).
 */
export const HOLD_KINDS = ['checks', 'short', 'unlearned', 'wrong'] as const;
export type HoldKind = (typeof HOLD_KINDS)[number];

/**
 * A watch in the general form (ADR 0010 §10): its history, and how its source is judged, every setting but the history
 * optional. A load covers a day (`every: day`) or a slot of it (`6h`, ADR 0010 §7), judged with the patterns `weekly`,
 * `none` and `monthly` (ADR 0010 §3); any other is refused, never ignored.
 */
export interface WatchDef {
  /** The history's file, a file in the data's list. */
  history: string;
  /** The text parameter whose value is the load's period (default `publish.period`). */
  period?: string;
  /** What one load covers (default `day`): a day, or a slot of it aligned to midnight (`12h` … `1h`, ADR 0010 §7), its
   * period parameter then naming the slot (`2024-09-10T06`). A slot is counted by its time column, so it names `time`. */
  every?: Every;
  /** What a load is compared with: the same weekday over the weeks before (`weekly`, the default), the periods before
   * whatever the weekday (`none`), or those and the same day of the month (`monthly`). */
  pattern?: 'weekly' | 'none' | 'monthly';
  /** Which good day fills a paused one: the same weekday, or the nearest (default from the pattern: weekly, `weekday`). */
  donor?: 'weekday' | 'nearest';
  /** The time column the hours are counted from, and the zone they are counted in (default the calendar's). */
  time?: string;
  zone?: string;
  /** Whether the flow's calendar applies to the source (default true). */
  calendar?: boolean;
  /** Floors fixed, or scaled with the period's expected rows (default `volume`). */
  scale?: 'fixed' | 'volume';
  /** Whether its story holds (default true; false: told and recorded, never holding). */
  holds?: boolean;
  /** Whether a change told as a note that has lasted 14 days is re-learned on its own (ADR 0010 §5): off unless chosen,
   * since on the taxi history it learned an outage that came on top of a lasting dip (B18's backtest). */
  relearn?: boolean;
  /** Columns counted value by value, and columns followed for new values only (default from the ontology). */
  count?: string[];
  follow?: string[];
}

/**
 * The text parameter whose value is a source's period: its watch's own (a general watch, ADR 0010 §10), else the flow's
 * `publish.period`. Undefined when neither names one. A fill on the source moves a donor's rows to that day.
 */
export function periodOf(doc: { publish?: unknown }, source: string): string | undefined {
  const p = isRecordLike(doc.publish) ? doc.publish : undefined;
  const watch = isRecordLike(p?.watch) ? p.watch : {};
  const w = Object.entries(watch).find(([id]) => id.toLowerCase() === source.toLowerCase())?.[1];
  const own = isGeneralWatch(w) && typeof w.period === 'string' ? w.period : undefined;
  return own ?? (typeof p?.period === 'string' ? p.period : undefined);
}
const isRecordLike = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A watch's history file, whichever form it is given in. */
export const watchHistory = (w: string | WatchDef): string => (typeof w === 'string' ? w : w.history);

/** A watch's fields this version knows: any other is refused, never ignored. */
const WATCH_FIELDS = ['history', 'period', 'every', 'pattern', 'donor', 'time', 'zone', 'calendar', 'scale', 'holds', 'relearn', 'count', 'follow'];

/**
 * What holds a flow's publication, and what waits while it holds (ADR 0009 §2, §4). A run that holds is built, checked,
 * hashed and recorded, its versions staged, and nothing it made is published until a person decides. Without
 * `checks` in `hold`, a check that trips throws, as it does without the block: neither way publishes.
 */
export interface PublishDef {
  hold: HoldKind[];
  /**
   * Each source judged against its history, by its id: the history's file (a file in the data's list), which means the
   * settings every flow had before ADR 0010, or a watch in the general form (format 3).
   */
  watch?: Record<string, string | WatchDef>;
  /** The text parameter whose value is the run's day: the day a claim must name, and the order days are decided in.
   * Optional when every watch names its own. */
  period?: string;
  /** Nothing goes out while any output waits (the default); with false, a hold reaches only the outputs that read
   * what the holding step reads, and the rest publish. */
  together?: boolean;
  /**
   * With `together: false`, what a hold keeps back (ADR 0020 slice 3): `sources` (the default, ADR 0009 §4), every
   * output that reads a source the holding node reads; or `downstream`, the outputs built from the holding node itself.
   * A hold on a source reaches the same outputs either way; a step's hold, under `downstream`, leaves the outputs that
   * don't read the step to publish.
   */
  reach?: Reach;
  /** The flow's own donor rule (ADR 0009 amendment 1 S3): the same weekday, or the nearest good day. */
  donor?: DonorRule;
  /** What readers get while a held day waits (S5): the last day published (the default), its fill, or the part that
   * arrived. Other than `last`, every watched source has a fill step. */
  meanwhile?: Meanwhile;
  /** Whether a person must close a pause (`decision`, the default), or a later day publishing closes it (`normal`). */
  until?: Until;
  /** The share of a day's rows a learned check's alert must move to hold the day where its check only warns (Q-132,
   * Q-207): a quarter unless set; a dataset's own in the ontology (`ontology.overwhelming`) wins. */
  overwhelming?: number;
}

/** The donor rules (S3): the same weekday 7, 14, 21 or 28 days away, or the nearest good day 1 to 28 days away. */
export const DONOR_RULES = ['weekday', 'nearest'] as const;
export type DonorRule = (typeof DONOR_RULES)[number];
export const MEANWHILES = ['last', 'fill', 'complete'] as const;
export type Meanwhile = (typeof MEANWHILES)[number];
export const UNTILS = ['decision', 'normal'] as const;
export type Until = (typeof UNTILS)[number];

/** A published dataset's contract (Q-171, ADR 0020 §4). */
export interface ContractDef {
  /** Its id, and its version: a breaking change is a new major version, published beside the old one. */
  id: string;
  version: string;
  status: ContractStatus;
  /** What it is for, what it doesn't do, and how to use it. */
  description?: { purpose?: string; limitations?: string; usage?: string };
  /** Each column, in order. The dataset's columns are these, by name and type: one renamed, retyped, dropped or added
   * breaks the contract. */
  columns: ContractColumn[];
  /** Its service levels: how often it is published, by when, and how long each version is kept. */
  sla?: { frequency?: string; availableBy?: string; retention?: string };
}

export interface ContractColumn {
  name: string;
  /** The engine's type: TEXT, INTEGER or REAL. */
  type: ContractType;
  description?: string;
  /** Never blank. */
  required?: boolean;
  /** Part of the dataset's key, which its gate reconciles. */
  key?: boolean;
  classification?: ContractClassification;
  /** The values it may take, where it takes few. */
  values?: string[];
}

export const CONTRACT_STATUSES = ['proposed', 'active', 'deprecated', 'retired'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export const CONTRACT_TYPES = ['TEXT', 'INTEGER', 'REAL'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];
export const CONTRACT_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'] as const;
export type ContractClassification = (typeof CONTRACT_CLASSIFICATIONS)[number];
const CONTRACT_FIELDS = ['id', 'version', 'status', 'description', 'columns', 'sla'];
const CONTRACT_COLUMN_FIELDS = ['name', 'type', 'description', 'required', 'key', 'classification', 'values'];

/**
 * An edit of the rules people set (ADR 0021 §5), as the app makes it: replayed on any document by the pure function
 * that made it (`applyEdit` in inforce.ts), so a change set dated before another still applies to the rules of its
 * day. Each says what is so after it rather than what to undo:
 *
 * - `setRule`: the file has this rule, with these settings (a rule the file lacks then is added, by its id);
 * - `removeRule`: the file has no rule of this id; `switchRule`: the file's rule is switched on or off in the check
 *   cell that enforces it;
 * - `nameColumn`: a column of a file named, its meaning worded and its values labelled (flowedit.ts);
 * - `acceptBand`: a band accepted for a value of a source's column (ADR 0014 §3);
 * - `setCheck`: a check of a node's gate set to a mode, written in its gate cell (ADR 0014 §1);
 * - `declareValues` and `declareKey`: a proposal from the data accepted (ADR 0022 §5, Q-139): a coded column's values, a
 *   file's key (flowedit.ts);
 * - `declareEntry` and `leaveOut`: what arrived at the gate decided (ADR 0027 §4, Q-253): an entry of a closed list, or
 *   a value of a closed column, declared from the day, or left out of what goes on until it is.
 */
export type RuleEdit =
  | { op: 'setRule'; rule: RuleInput & { id: string } }
  | { op: 'removeRule'; file: string; id: string }
  | { op: 'switchRule'; file: string; id: string; on: boolean }
  | { op: 'nameColumn'; file: string; column: string; change: ColumnChange }
  | { op: 'acceptBand'; source: string; band: AcceptedBand }
  | { op: 'setCheck'; node: string; check: CheckName; mode: CheckMode }
  /** The rules of a version (ADR 0022 §1, Q-202): the base with these change sets, in the order they were recorded,
   * whatever their days; none, the rules as shipped. What a what-if made a day's keeps for that day only (`until`). */
  | { op: 'useVersion'; changes: string[] }
  /** A file's column read by the name the file gives it now (ADR 0022 §2, Q-146, Q-206): its own property's `fromFile`;
   * `from` null reads it by its own name again. */
  | { op: 'mapColumn'; file: string; column: string; from: string | null }
  /** A coded column's values declared from the data (ADR 0022 §5, Q-139, Q-214): its own property's codes, each meaning
   * itself until someone words it; the column is counted where its history is built from then on. */
  | { op: 'declareValues'; file: string; column: string; values: string[] }
  /** A file's key declared from the data (Q-139, Q-214): the file its own object type, keyed by the column, with a rows
   * entry, so a day whose rows repeat a key holds. */
  | { op: 'declareKey'; file: string; column: string }
  /** An entry declared in a closed list, or a value in a closed column (ADR 0027 §4, Q-253): the file's closed rule has
   * it from the day, under its key (an entry the rule has under that key is replaced; a key left out is in again). */
  | { op: 'declareEntry'; file: string; rule: string; entry: string[] }
  /** A key left out of what goes on until it is declared (Q-253, "Publish without it"). */
  | { op: 'leaveOut'; file: string; rule: string; key: string };

export const EDIT_OPS = ['setRule', 'removeRule', 'switchRule', 'nameColumn', 'acceptBand', 'setCheck', 'useVersion', 'mapColumn', 'declareValues', 'declareKey', 'declareEntry', 'leaveOut'] as const;

/**
 * A dated change set (ADR 0021 §5, Q-184): edits of the rules people set, in force from a business day, as known from
 * the moment they were recorded. The rules in force on a day, as known at a moment, are the document's own (its base)
 * with every change set from that day or before, recorded by then, applied in the order they were recorded
 * (inforce.ts `inForce`).
 */
/**
 * What kind of change a change set is (ADR 0027 §2, Q-256): it says how history is read afterwards. `business`: the
 * business changed (a new or changed definition, rule or entry), and old and new are each right for their own time.
 * `retuned`: a setting moved to follow what is normal, its meaning the same. `corrected`: the ontology was wrong.
 * `source`: the file's form changed and its meaning didn't. `described`: the first description of something, the
 * start of its history and no change at all.
 */
export const CHANGE_KINDS = ['business', 'retuned', 'corrected', 'source', 'described'] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

/** The thinking behind a change, kept beside its reason (ADR 0027 §2, Q-257): each part there only where it was given. */
export interface ChangeNote {
  /** What we saw. */
  saw?: string;
  /** What we chose, and what we turned down. */
  chose?: string;
  turnedDown?: string;
  /** What we expect to happen. */
  expect?: string;
  /** The day to look again (YYYY-MM-DD). */
  lookAgain?: string;
  /** Where anything longer is. */
  link?: string;
}
const NOTE_FIELDS = ['saw', 'chose', 'turnedDown', 'expect', 'lookAgain', 'link'];

export interface ChangeSet {
  /** Its name, unique among the flow's change sets. */
  id: string;
  /** The business day it takes effect from (YYYY-MM-DD). */
  from: string;
  /** The last business day it is in force (YYYY-MM-DD), for a change of a day or a few (ADR 0022 §1, Q-202: a what-if's
   * rules made a day's, for that day only); none, from its day on. Never before `from`. */
  until?: string;
  /** When it was made (ISO 8601). */
  recorded: string;
  /** Who made it, and why, in their words (empty where they gave none). */
  by: string;
  why: string;
  /** Its edits, in the order they were made. */
  edits: RuleEdit[];
  /** What kind of change it is (ADR 0027 §2); none on a change set made before kinds were asked for. */
  kind?: ChangeKind;
  /** The thinking behind it, where its author wrote any. */
  note?: ChangeNote;
  /** Who chose it and on what day, where that isn't who recorded it and when: shown, and nothing is computed from it. */
  decided?: { by: string; on?: string };
  /** What led to it: an event by its id, or a decision by its number in the record. */
  because?: { event?: string; decision?: number };
}

const CHANGE_FIELDS = ['id', 'from', 'until', 'recorded', 'by', 'why', 'edits', 'kind', 'note', 'decided', 'because'];

export const REACHES = ['sources', 'downstream'] as const;
export type Reach = (typeof REACHES)[number];

/** The publish block's fields this version knows: any other is refused, never ignored. */
const PUBLISH_FIELDS = ['hold', 'watch', 'period', 'together', 'reach', 'donor', 'meanwhile', 'until', 'overwhelming'];

export interface FlowDocument {
  smaltfl: DocumentFormat;
  id: string;
  name: string;
  description?: string;
  parameters?: ParameterDef[];
  sources: SourceDef[];
  /**
   * The steps. In a format-4 document they are derived from its notebooks (`notebook.ts`, `expandNotebooks`) and kept
   * here, so everything that reads steps reads them the same way, and a stored document is complete without a parser.
   */
  steps: StepDef[];
  /**
   * The notebooks whose exported cells are the steps (ADR 0011 §1, §5): a document with them is format 4. Each is a
   * smaltnb `.nb.ts` notebook, by its path (relative to the document) and its source as loaded (`loadNotebooks`).
   */
  notebooks?: NotebookDef[];
  /** The object, link and action types over the flow's datasets (ontology.ts). */
  ontology?: Ontology;
  /** Who may read which rows and columns, and run which actions (policy.ts). */
  policies?: Policies;
  /** What pauses publication, and what waits (ADR 0009): a document with it is format 2. */
  publish?: PublishDef;
  /** The flow's calendar (ADR 0010 §2): a document with it is format 3. Without it, a flow whose watches are all legacy
   * keeps `us-nyc/1`, and any other has none (Q-58). */
  calendar?: CalendarDef;
  /**
   * The gates (ADR 0014 §1), by the source or step each judges: its layer and the checks it sets apart from the layer's
   * defaults. Derived from the notebooks' `gate()` cells (`notebook.ts`) and kept here, as the steps are; part of the
   * flow hash. A document with any gate judges every watched node by its gate or its layer's defaults (plan/4); one
   * with none is judged as it always was.
   */
  gates?: Record<string, GateDef>;
  /**
   * The contracts of published datasets (Q-171, ADR 0020 §4), by dataset: what a consumer may rely on, in the Open Data
   * Contract Standard v3's fields where they fit. Gold's schema check holds a dataset whose columns aren't its
   * contract's, by name and type, a required column with blanks, or a value outside a column's list. Part of the flow
   * hash; the plan carries only what is checked, so only a flow that declares one hashes differently.
   */
  contracts?: Record<string, ContractDef>;
  /**
   * The dated change sets (ADR 0021 §5): edits of the rules people set, each in force from a business day. A run is
   * of the rules in force on its day (inforce.ts `inForce`, which `translate` and `runFlow` apply first), so a plan is
   * never made from a document that still has them, and a day before every change set runs as it always did.
   */
  changes?: ChangeSet[];
  /**
   * The flows this one reads (ADR 0026 §1): each a flow of its own, in its own folder, read into this document when it
   * is read (compose.ts), so the document a run hashes has every flow it reads in it and the plan stays flat. On disk a
   * flow lists them by path; read, each says which sources and steps are its own, the flows it reads in turn, and its
   * own flow hash. Every flow in the document is listed, in an order where a flow comes after the flows it reads. Part
   * of the flow hash.
   */
  flows?: FlowPart[];
  /**
   * The flow's open inputs (ADR 0026 §11): each a dataset the flow reads in place of a file of its own, with the columns
   * it needs. A flow with one runs only inside a flow that uses it, which maps one of its own datasets onto each
   * (`flows`' `{ path, as, inputs }` on disk; `FlowPart.use` once read). Part of the flow hash.
   */
  inputs?: InputDef[];
  /**
   * The flow's settings (ADR 0026 §11): values each use may give, read in its notebooks as `${params.name}` and written
   * into the steps where the notebooks are read: a use with another value is other steps, with another hash. Each has
   * a default, which the flow read on its own runs with. Part of the flow hash.
   */
  settings?: SettingDef[];
  /**
   * A use of a flow, as its own document (ADR 0026 §11): the flow it is a use of, the dataset mapped onto each of its
   * inputs and the value of each setting. The document is the flow read under the use's name, its steps named after
   * it, and it reads datasets it doesn't hold: it is hashed, kept and compared, and never run on its own. Part of the
   * flow hash.
   */
  use?: FlowUse;
  /** Display only: sections of the canvas, each holding sources and steps. Not part of any hash. */
  groups?: GroupDef[];
  /**
   * Display only: profile boxes, each looking at one source's or step's rows (what its columns hold, the rows an
   * isolation forest finds odd, how it moved from one load to the next). A profile changes no data. Not part of any hash.
   */
  profiles?: ProfileDef[];
  /** Display only: where each card sits on the canvas. Not part of any hash. */
  layout?: Record<string, [number, number]>;
  /**
   * Display only, in a format-4 document: the notebook cell each step came from (`expandNotebooks`), so the canvas
   * and a step's sheet can show the cell. Not part of any hash.
   */
  cells?: Record<string, CellRef>;
  /** Display only, in a format-4 document: each notebook's cells in order, as the notebook view reads them. */
  outline?: NotebookOutline[];
}

/** A flow another reads, as that flow's file lists it (ADR 0026 §1): its document's path, relative to the file; read,
 * the flow as the document holds it. */
export type FlowRef = string | FlowPart;

/**
 * A flow read into a document (ADR 0026 §1, §2): its own sources and steps, by id, the flows it reads in turn, and what
 * it is known by, its own flow hash: the hash of the document read from its own folder, with the flows it reads in it.
 */
export interface FlowPart {
  /** Its document's path, relative to the reading document's. */
  path: string;
  id: string;
  name: string;
  description?: string;
  /** Its own flow hash (`flow/1`), as reading it on its own gives it. */
  hash: string;
  /** Its own sources and steps, by id: what it brings, apart from what the flows it reads bring. */
  sources: string[];
  steps: string[];
  /** The flows it reads itself, by id. */
  reads: string[];
  /** Whether the document's own flow lists it (true), or only a flow it reads does. */
  direct: boolean;
  /** The flows that pin it (ADR 0026 §7): each reads it only as the flow its hash names, so reading refuses any other
   * until the pin is moved. By id, the document's own flow by ''. Absent where none does. */
  pin?: string[];
  /** A use of a flow (ADR 0026 §11): what it is a use of, and what this use maps and sets. Its `id` is the use's name,
   * its `hash` the use's own, its `path` the used flow's. Absent for a flow read as it is. */
  use?: FlowUse;
}

/** A flow part's fields: any other is refused by name. */
const FLOW_PART_FIELDS = ['path', 'id', 'name', 'description', 'hash', 'sources', 'steps', 'reads', 'direct', 'pin', 'use'];

/** An open input of a flow (ADR 0026 §11): a dataset it reads in place of a file of its own. A flow that uses it maps
 * one of its own datasets onto it, and the flow's steps read the columns named here and no other. */
export interface InputDef {
  id: string;
  description?: string;
  /** The columns the flow needs of it, by name. */
  columns: string[];
}

/** A setting of a flow (ADR 0026 §11): a value each use may give, with the default the flow has on its own. */
export interface SettingDef {
  name: string;
  type: ParamType;
  default: string | number;
  description?: string;
}

/**
 * What a use of a flow is (ADR 0026 §11): the flow used, by its id, its name and its own flow hash (with its inputs
 * open); each of its inputs with the dataset mapped onto it and the columns the flow needs of it; and each of its
 * settings with its type, its value here (the flow's default where the use gives none) and that default.
 */
export interface FlowUse {
  of: { id: string; name: string; hash: string };
  inputs: Record<string, { to: string; columns: string[] }>;
  settings: Record<string, UseSetting>;
}

/** A setting as a use has it: its type, its value here and the flow's own default, so a value a use changed shows. */
export interface UseSetting {
  type: ParamType;
  value: string | number;
  default: string | number;
}

/** The uses a document holds, by name (lower case): each flow it reads that is one, and itself where it is a use's own
 * document. */
export function usesOf(doc: Pick<FlowDocument, 'flows' | 'use' | 'id'>): Map<string, FlowUse> {
  const out = new Map<string, FlowUse>();
  for (const f of doc.flows ?? []) if (f.use) out.set(f.id.toLowerCase(), f.use);
  if (doc.use) out.set(doc.id.toLowerCase(), doc.use);
  return out;
}

/** The name a use gives one of the used flow's own steps or inputs: the use's name before it (`tls_health_summary`). */
export const usedName = (use: string, id: string): string => `${use}_${id}`;

/** The flow a source or step is its own of, by id (lower case): a part's id, or '' for the document's own flow. */
export function flowOwners(doc: Pick<FlowDocument, 'flows'>): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of doc.flows ?? []) for (const id of [...f.sources, ...f.steps]) out.set(id.toLowerCase(), f.id);
  return out;
}

/** The flow a source or step belongs to: the part that lists it, or undefined for the document's own flow's. */
export function flowOf(doc: Pick<FlowDocument, 'flows'>, id: string): FlowPart | undefined {
  const lower = id.toLowerCase();
  return (doc.flows ?? []).find((f) => f.sources.some((x) => x.toLowerCase() === lower) || f.steps.some((x) => x.toLowerCase() === lower));
}

/** What a flow gives (ADR 0026 §1): the datasets it publishes, which a flow that reads it may read. A part by its id;
 * the document's own flow with no id. In the steps' order. */
export function givesOf(doc: Pick<FlowDocument, 'flows' | 'steps'>, flow?: string): string[] {
  const owner = flowOwners(doc);
  return doc.steps.filter((s) => s.dataset !== undefined && (owner.get(s.id.toLowerCase()) ?? '') === (flow ?? '')).map((s) => s.id);
}

/** Every flow a flow reads, itself or through the flows it reads, by id, in the document's order; the document's own
 * flow with no id. */
export function readsOf(doc: Pick<FlowDocument, 'flows'>, flow?: string): string[] {
  const parts = doc.flows ?? [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const r of parts.find((f) => f.id === id)?.reads ?? []) visit(r);
  };
  for (const id of flow === undefined ? parts.filter((f) => f.direct).map((f) => f.id) : (parts.find((f) => f.id === flow)?.reads ?? [])) visit(id);
  return parts.filter((f) => seen.has(f.id)).map((f) => f.id);
}

/** A notebook's cells in order, for the notebook view: what each is, and the step, source or section it makes. */
export interface NotebookOutline {
  path: string;
  cells: OutlineCell[];
}

export interface OutlineCell {
  cell: string;
  /** heading: an md cell that opens a section; md: prose about the step after it; source: a source binding; step: a
   * step; params: the notebook's parameters; publish: what the notebook publishes; other: a cell the flow leaves out. */
  kind: 'heading' | 'md' | 'source' | 'step' | 'params' | 'publish' | 'gate' | 'input' | 'other';
  lang: 'ts' | 'sql' | 'df' | 'md' | 'cypher';
  line: number;
  endLine: number;
  /** The section a heading opens, or the step or source a cell makes, or the steps a publish cell names. */
  heading?: string;
  text?: string;
  step?: string;
  source?: string;
  publishes?: string[];
  /** The source or step a gate cell judges. */
  gate?: string;
  /** The open input an input cell binds (ADR 0026 §11); in a use, `step` is the step that reads the dataset mapped
   * onto it. */
  input?: string;
}

/** Where a step is written: its notebook, its cell, the cell's language and its lines (1-based, inclusive). */
export interface CellRef {
  notebook: string;
  cell: string;
  lang: 'ts' | 'sql' | 'df' | 'md' | 'cypher';
  line: number;
  endLine: number;
}

/** A notebook of a format-4 document: its path, relative to the document, and its source as loaded. */
export interface NotebookDef {
  path: string;
  source: string;
  /** The use of a flow this notebook is read for (ADR 0026 §11), by the use's name: its cells are that use's steps,
   * named after it, its inputs the datasets the use maps and its settings the use's values. Its path then ends in
   * `#<use>`, so the same notebook read for two uses is two entries. Absent for a notebook read as it is. */
  use?: string;
}

/** The path a notebook has when it is read for a use (ADR 0026 §11): its own, then `#` and the use's name. */
export const usePath = (path: string, use: string): string => `${path}#${use}`;
/** A notebook's path as its file has it: without the use it is read for. */
export const filePath = (path: string): string => (path.includes('#') ? path.slice(0, path.indexOf('#')) : path);


export interface GroupDef {
  id: string;
  name: string;
  /** Source and step ids, each in at most one group. A group may be empty: a box waiting for steps. */
  steps: string[];
  collapsed?: boolean;
  /** One of the canvas's section colours. */
  color?: GroupColor;
}

/** A profile box: what it looks at, and what it is for. It sits beside that source or step, in its section. */
export interface ProfileDef {
  id: string;
  /** The source or step whose rows it profiles. */
  of: string;
  description?: string;
}

/** The colours a section can take, each drawn from the family's tokens in light and dark. */
export const GROUP_COLORS = ['slate', 'smalt', 'teal', 'green', 'amber', 'rose', 'violet'] as const;
export type GroupColor = (typeof GROUP_COLORS)[number];

export interface ParameterDef {
  name: string;
  type: ParamType;
  default?: ParamValue;
  description?: string;
}

/** A source: data the flow reads. v1 reads tables already in the database; files and URLs come next. */
export interface SourceDef {
  id: string;
  table: string;
  description?: string;
}

/** A stored dataset's settings, on the step that produces it. */
export interface DatasetDef {
  description?: string;
  owner?: string;
  /** How the engine stores it (default `row`). */
  storage?: 'row' | 'columnar';
}

interface StepBase {
  id: string;
  inputs: string[];
  description?: string;
  /** Persist this step's output as a dataset named by its id. */
  dataset?: DatasetDef;
}

/** A computed column: its name and a SQL expression over the step's input columns. */
export interface NamedExpr {
  name: string;
  expr: string;
}

export interface SqlStep extends StepBase {
  kind: 'sql';
  /** One SELECT over the inputs, which it names by their ids. */
  sql: string;
}

export interface FilterStep extends StepBase {
  kind: 'filter';
  /** Rows for which this is true are kept. */
  where: string;
}

export interface FormulaStep extends StepBase {
  kind: 'formula';
  /** Added, or replacing the input column of the same name, in order: a column may use the ones before it. */
  columns: NamedExpr[];
}

export interface SelectStep extends StepBase {
  kind: 'select';
  /** The output columns, in order: an input column's name, or a named expression. */
  columns: (string | NamedExpr)[];
}

export interface JoinStep extends StepBase {
  kind: 'join';
  /** `inputs` is [left, right]. */
  how: 'inner' | 'left';
  on: { left: string; right: string }[];
  /** The right input's columns to add, by name, or renamed. Every left column is kept. */
  columns: (string | { name: string; column: string })[];
}

export interface AggregateStep extends StepBase {
  kind: 'aggregate';
  groupBy: (string | NamedExpr)[];
  /** Aggregate expressions, such as `count(*)` or `avg(duration_min)`. */
  measures: NamedExpr[];
}

export interface ExpectationRule {
  name: string;
  /** True for a row that passes. A row for which it is NULL fails. */
  check: string;
  /** warn: count the failures; drop: also leave the row out; fail: fail the run if any row fails. */
  onFail: 'warn' | 'drop' | 'fail';
  /** Why the rule is there, for people: shown with the rows it flags or drops. Not part of the plan, nor of any key. */
  description?: string;
}

export interface ExpectationsStep extends StepBase {
  kind: 'expectations';
  rules: ExpectationRule[];
  /** Fail the run if more than this fraction of rows is dropped (0 to 1). */
  maxDropped?: number;
  /** The ontology's rules of the file this step reads, each switched on or off (rules.ts): written in the step's cell by
   * the file's import card, kept in step with the ontology when it changes. A rule not listed is on; an entry for a rule
   * the ontology no longer has says nothing. */
  ontology?: Record<string, 'on' | 'off'>;
}

/**
 * The part of a day a fill takes from another day, or leaves out (ADR 0009 amendment 1 S2): the hours from `hours[0]`
 * to `hours[1]` (both included) by the fill step's `time` column; or the rows whose `column` is `value` (a value as the
 * data types it: 1, "N", null); or, with `rest`, the rows whose `column` is not `value` (the part that held stays); or
 * the whole day (`all`, ADR 0023 §5): every row of it set aside and the donor's in their place, for a file that is wrong
 * rather than short, or one with no time of day to name hours by.
 */
export type Missing = { time: string; hours: [number, number] } | { column: string; value: string | number | boolean | null; rest?: boolean } | { all: true };

/**
 * A watched source that may be filled (ADR 0009 amendment 1 S1): it reads the source and whatever read the source reads
 * it instead. On a day nothing fills it passes the source's rows through with one more column, `filled_from` (null). A
 * derived document (fill.ts repairDocument) sets `missing` and `from`: the rows outside the missing part, plus, from the
 * donor (its second input), the rows inside it, moved to the day by whole days and marked with the donor's day; with
 * `from` null (the complete part), the rows outside the missing part alone.
 */
export interface FillStep extends StepBase {
  kind: 'fill';
  /** The column an hours cause's hours are of. A file with no time of day (a day's snapshot, ADR 0023 §5) has none, and
   * is filled whole. */
  time?: string;
  /** The columns a donor's rows are moved by whole days. */
  shift: string[];
  missing?: Missing;
  /** The donor's day, or null for the complete part. Set exactly when `missing` is. */
  from?: string | null;
}

/** The column a fill step adds: the day a row came from, or null for a row that arrived (S1). */
export const FILLED_FROM = 'filled_from';

export type StepDef = SqlStep | FilterStep | FormulaStep | SelectStep | JoinStep | AggregateStep | ExpectationsStep | FillStep;

export type StepKind = StepDef['kind'];

export interface Issue {
  path: string;
  message: string;
}

const ID = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const KINDS: readonly StepKind[] = ['sql', 'filter', 'formula', 'select', 'join', 'aggregate', 'expectations', 'fill'];
/** A column a fill step names (its time, a column it shifts, a missing part's column). */
const COLUMN = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** A day, as a period's value is written. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A slot of a day (ADR 0010 §7): its day and first hour. */
const SLOT_ID = /^\d{4}-\d{2}-\d{2}T\d{2}$/;

/**
 * Check a document's shape and references. An empty list means it can be translated into a flow plan. SQL text is
 * checked only lexically here; the engine checks the rest when the plan is typed.
 */
export function validateDocument(doc: unknown): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  if (!isRecord(doc)) return [{ path: '$', message: 'a flow document is a JSON object' }];
  if (!(DOCUMENT_FORMATS as readonly unknown[]).includes(doc.smaltfl)) add('$.smaltfl', `expected ${DOCUMENT_FORMATS.join(', ')}, the formats this version reads`);
  else if (doc.smaltfl === 5 && documentFormat(doc) !== 4) add('$.smaltfl', `expected ${documentFormat(doc)}: format 5 is for a document with notebooks, the ontology first`);
  else if (doc.smaltfl !== documentFormat(doc) && !(doc.smaltfl === 5 && documentFormat(doc) === 4)) {
    const want = documentFormat(doc);
    const three = 'a calendar, a watch given as an object, or a mark that changes verdicts (bad, newValues, after)';
    add('$.smaltfl', want === 4 ? 'expected 4: a document with notebooks is format 4'
      : doc.smaltfl === 4 ? `expected ${want}: format 4 is for a document with notebooks`
      : want === 3 ? `expected 3: a document with ${three} is format 3`
      : doc.smaltfl === 3 ? `expected ${want}: format 3 is for a document with ${three}`
      : doc.publish === undefined ? 'expected 1: format 2 is for a document with a publish block' : 'expected 2: a document with a publish block is format 2');
  }
  if (typeof doc.id !== 'string' || doc.id === '') add('$.id', 'a non-empty string');
  if (typeof doc.name !== 'string' || doc.name === '') add('$.name', 'a non-empty string');

  const params = new Map<string, ParameterDef>();
  if (doc.parameters !== undefined) {
    if (!Array.isArray(doc.parameters)) add('$.parameters', 'an array');
    else
      doc.parameters.forEach((p: unknown, i: number) => {
        const at = `$.parameters[${i}]`;
        if (!isRecord(p) || typeof p.name !== 'string' || !ID.test(p.name)) return add(at, 'a parameter needs a name: a letter, then letters, digits or _');
        if (params.has(p.name)) add(`${at}.name`, `duplicate parameter ${p.name}`);
        if (p.type !== 'text' && p.type !== 'integer' && p.type !== 'real') add(`${at}.type`, 'text, integer or real');
        else if (p.default !== undefined && p.default !== null && !fits(p.default, p.type)) add(`${at}.default`, `not a ${p.type}`);
        params.set(p.name, p as unknown as ParameterDef);
      });
  }

  const ids = new Map<string, string>();
  const claim = (id: unknown, at: string): id is string => {
    if (typeof id !== 'string' || !ID.test(id)) {
      add(at, 'an id: a letter, then up to 63 letters, digits or _');
      return false;
    }
    const lower = id.toLowerCase();
    if (ids.has(lower)) {
      add(at, `duplicate id ${id} (ids are compared without case, as SQL names are)`);
      return false;
    }
    ids.set(lower, at);
    return true;
  };

  if (!Array.isArray(doc.sources)) add('$.sources', 'an array');
  else
    doc.sources.forEach((s: unknown, i: number) => {
      const at = `$.sources[${i}]`;
      if (!isRecord(s)) return add(at, 'an object');
      claim(s.id, `${at}.id`);
      if (typeof s.table !== 'string' || s.table === '') add(`${at}.table`, 'the name of a table in the database');
    });

  // Open inputs (ADR 0026 §11): each a name the flow's steps read, as they read a file's, with the columns it needs.
  if (doc.inputs !== undefined) {
    if (!Array.isArray(doc.inputs)) add('$.inputs', 'a list of the flow’s open inputs, each { id, columns }');
    else
      doc.inputs.forEach((x: unknown, i: number) => {
        const at = `$.inputs[${i}]`;
        if (!isRecord(x)) return add(at, '{ id, columns }: an open input, and the columns the flow needs of it');
        claim(x.id, `${at}.id`);
        if (!Array.isArray(x.columns) || x.columns.length === 0 || x.columns.some((c) => typeof c !== 'string' || !COLUMN.test(c)) || new Set((x.columns as string[]).map((c) => c.toLowerCase())).size !== x.columns.length) add(`${at}.columns`, 'the columns the flow needs of it: a list of column names, each once, at least one');
        if (x.description !== undefined && typeof x.description !== 'string') add(`${at}.description`, 'a sentence');
        for (const k of Object.keys(x)) if (!['id', 'columns', 'description'].includes(k)) add(`${at}.${k}`, 'not an input’s (id, columns, description)');
      });
    if (doc.use !== undefined) add('$.inputs', 'a use has every input mapped: its own document has none open');
  }
  // Settings (ADR 0026 §11): like parameters, each with a default; a name is one or the other.
  if (doc.settings !== undefined) {
    if (!Array.isArray(doc.settings)) add('$.settings', 'a list of the flow’s settings, each { name, type, default }');
    else {
      const named = new Set<string>();
      doc.settings.forEach((x: unknown, i: number) => {
        const at = `$.settings[${i}]`;
        if (!isRecord(x) || typeof x.name !== 'string' || !ID.test(x.name)) return add(at, 'a setting needs a name: a letter, then letters, digits or _');
        if (named.has(x.name)) add(`${at}.name`, `duplicate setting ${x.name}`);
        if (params.has(x.name)) add(`${at}.name`, `${x.name} is a parameter of the flow: a name is a parameter, the same for every flow in a run, or a setting, each use’s own`);
        named.add(x.name);
        if (x.type !== 'text' && x.type !== 'integer' && x.type !== 'real') add(`${at}.type`, 'text, integer or real');
        else if (x.default === undefined || x.default === null || !fits(x.default, x.type)) add(`${at}.default`, `a setting has a default, a ${x.type}: what the flow has where a use says nothing`);
        if (x.description !== undefined && typeof x.description !== 'string') add(`${at}.description`, 'a sentence');
        for (const k of Object.keys(x)) if (!['name', 'type', 'default', 'description'].includes(k)) add(`${at}.${k}`, 'not a setting’s (name, type, default, description)');
      });
    }
  }
  // A use's own document (ADR 0026 §11) reads the datasets mapped onto its inputs, which it doesn't hold.
  const given = new Set<string>();
  if (doc.use !== undefined) {
    const problem = useProblem(doc.use);
    if (problem) add('$.use', problem);
    else for (const x of Object.values((doc.use as FlowUse).inputs)) given.add(x.to.toLowerCase());
  }

  const steps: Record<string, unknown>[] = [];
  if (doc.notebooks !== undefined) {
    if (!Array.isArray(doc.notebooks) || doc.notebooks.length === 0) add('$.notebooks', 'a non-empty array of notebooks, each { path, source }');
    else {
      const paths = new Set<string>();
      // The uses the document holds: a notebook read for one names it, and its path ends in the name.
      const uses = new Set<string>([...(Array.isArray(doc.flows) ? doc.flows : []).flatMap((f: unknown) => (isRecord(f) && f.use !== undefined && typeof f.id === 'string' ? [f.id] : [])), ...(doc.use !== undefined && typeof doc.id === 'string' ? [doc.id] : [])]);
      doc.notebooks.forEach((n: unknown, i: number) => {
        if (!isRecord(n) || typeof n.path !== 'string' || n.path === '' || typeof n.source !== 'string') return add(`$.notebooks[${i}]`, '{ path, source }: a notebook by its path, with its source loaded (loadNotebooks)');
        if (paths.has(n.path)) add(`$.notebooks[${i}].path`, `listed twice: ${n.path}`);
        paths.add(n.path);
        if (n.use !== undefined) {
          if (typeof n.use !== 'string' || !uses.has(n.use)) add(`$.notebooks[${i}].use`, 'the use of a flow this notebook is read for, by its name: one the document holds');
          else if (!n.path.endsWith(`#${n.use}`)) add(`$.notebooks[${i}].path`, `a notebook read for the use ${n.use} has a path that ends in #${n.use}`);
        } else if (n.path.includes('#')) add(`$.notebooks[${i}].path`, 'a path with # is a notebook read for a use: say which (use)');
      });
    }
    if (doc.steps === undefined) add('$.steps', "a format-4 document's steps are derived from its notebooks: expand them first (expandNotebooks)");
  }
  if (doc.steps === undefined && doc.notebooks !== undefined) {
    // Said above.
  } else if (!Array.isArray(doc.steps)) add('$.steps', 'an array');
  else
    doc.steps.forEach((s: unknown, i: number) => {
      const at = `$.steps[${i}]`;
      if (!isRecord(s)) return add(at, 'an object');
      claim(s.id, `${at}.id`);
      steps.push(s);
    });

  steps.forEach((s, i) => {
    const at = `$.steps[${i}]`;
    if (!KINDS.includes(s.kind as StepKind)) return add(`${at}.kind`, `one of ${KINDS.join(', ')}`);
    if (!Array.isArray(s.inputs) || s.inputs.some((x) => typeof x !== 'string')) return add(`${at}.inputs`, 'an array of ids');
    const inputs = s.inputs as string[];
    inputs.forEach((x, j) => {
      if (!ids.has(x.toLowerCase()) && !given.has(x.toLowerCase())) add(`${at}.inputs[${j}]`, `no source or step ${x}`);
      else if (x.toLowerCase() === String(s.id).toLowerCase()) add(`${at}.inputs[${j}]`, 'a step cannot read itself');
    });
    if (new Set(inputs.map((x) => x.toLowerCase())).size !== inputs.length) add(`${at}.inputs`, 'an input is listed twice');
    // A fill step reads its source, and a donor exactly when it fills from another day (validateFills).
    const arity = s.kind === 'join' ? 2 : s.kind === 'sql' ? -1 : s.kind === 'fill' ? (s.from === undefined || s.from === null ? 1 : 2) : 1;
    if (arity >= 0 && inputs.length !== arity) add(`${at}.inputs`, s.kind === 'fill' ? (arity === 1 ? 'a fill step reads its source, and a donor only when it fills from another day' : 'a fill step that fills from another day reads its source and the donor') : `a ${s.kind} step has ${arity === 1 ? 'one input' : 'two inputs'}`);
    if (s.dataset !== undefined) {
      if (!isRecord(s.dataset)) add(`${at}.dataset`, 'an object');
      else if (s.dataset.storage !== undefined && s.dataset.storage !== 'row' && s.dataset.storage !== 'columnar') add(`${at}.dataset.storage`, 'row or columnar');
    }
    validateConfig(s, at, add);
  });

  if (issues.length === 0) {
    const cycle = findCycle(steps as unknown as StepDef[]);
    if (cycle) add('$.steps', `the steps form a cycle: ${cycle.join(' → ')}`);
  }
  if (doc.cells !== undefined) {
    if (!isRecord(doc.cells)) add('$.cells', 'an object: each step\'s notebook cell');
    else for (const [k, v] of Object.entries(doc.cells)) if (!isRecord(v) || typeof v.notebook !== 'string' || typeof v.cell !== 'string' || typeof v.line !== 'number') add(`$.cells.${k}`, '{ notebook, cell, lang, line, endLine }');
  }
  if (doc.outline !== undefined && !Array.isArray(doc.outline)) add('$.outline', "an array: each notebook's cells in order");
  if (doc.layout !== undefined) {
    if (!isRecord(doc.layout)) add('$.layout', 'an object');
    // Keys are card ids, or `group:<id>` for where an empty section sits; a key nothing uses is ignored.
    else for (const [k, v] of Object.entries(doc.layout)) if (!(Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n)))) add(`$.layout.${k}`, '[x, y]');
  }
  validateExtras(doc, ids, add);
  validateFlows(doc, ids, add);
  validateGates(doc, add);
  validateContracts(doc, add);
  validateChanges(doc, add);
  validatePublish(doc, params, add);
  if (doc.calendar !== undefined) for (const [path, message] of calendarProblems(doc.calendar)) add(`$.calendar${path}`, message);
  validateFills(doc, steps, add);
  return issues;
}

/**
 * The fill steps (ADR 0009 amendment 1 S1): each reads a source directly, one fill step a source, and every other step
 * that read the source reads the fill step instead; a donor is a source that nothing else reads and nothing watches; a
 * fill from another day needs the period, the day its rows move to; and a standing setting other than `last` needs a
 * fill step on every watched source.
 */
function validateFills(doc: Record<string, unknown>, steps: readonly Record<string, unknown>[], add: (path: string, message: string) => void): void {
  const sources = new Set((Array.isArray(doc.sources) ? doc.sources : []).filter((s: unknown) => isRecord(s) && typeof s.id === 'string').map((s: Record<string, unknown>) => String(s.id).toLowerCase()));
  const inputsOf = (s: Record<string, unknown>) => (Array.isArray(s.inputs) ? s.inputs.filter((x): x is string => typeof x === 'string') : []);
  const filled = new Map<string, number>();
  const donors = new Map<string, number>();
  steps.forEach((s, i) => {
    if (s.kind !== 'fill') return;
    const [source, donor] = inputsOf(s);
    if (source === undefined) return;
    const at = `$.steps[${i}]`;
    if (!sources.has(source.toLowerCase())) add(`${at}.inputs[0]`, `${source} is a step: a fill step reads a source directly`);
    else if (filled.has(source.toLowerCase())) add(`${at}.inputs[0]`, `${source} has a fill step already: one fill step a source`);
    else filled.set(source.toLowerCase(), i);
    if (donor !== undefined) {
      if (!sources.has(donor.toLowerCase())) add(`${at}.inputs[1]`, `${donor} is a step: a donor is a source of its own`);
      else if (donor.toLowerCase() === source.toLowerCase()) add(`${at}.inputs[1]`, 'a day is never its own donor');
      else donors.set(donor.toLowerCase(), i);
    }
    if (s.from !== undefined && s.from !== null && periodOf(doc, source) === undefined) add(`${at}.from`, `a fill from another day needs ${source}'s period (its watch's, or publish.period): the parameter whose value is the day its rows move to`);
  });
  steps.forEach((s, i) => {
    inputsOf(s).forEach((x, j) => {
      const id = x.toLowerCase();
      const fill = filled.get(id);
      if (fill !== undefined && fill !== i) add(`$.steps[${i}].inputs[${j}]`, `${x} has a fill step, ${String(steps[fill]!.id)}: read that instead`);
      const giver = donors.get(id);
      if (giver !== undefined && !(giver === i && j === 1)) add(`$.steps[${i}].inputs[${j}]`, `${x} is a donor of ${String(steps[giver]!.id)}: nothing else reads it`);
    });
  });
  const pub = isRecord(doc.publish) ? doc.publish : null;
  if (pub && isRecord(pub.watch)) {
    for (const id of Object.keys(pub.watch)) if (donors.has(id.toLowerCase())) add(`$.publish.watch.${id}`, `${id} is a donor: a donor is judged by its own day's claim, not watched`);
    if (pub.meanwhile !== undefined && pub.meanwhile !== 'last')
      for (const id of Object.keys(pub.watch)) if (!filled.has(id.toLowerCase())) add('$.publish.meanwhile', `${String(pub.meanwhile)} needs a fill step on every watched source, and ${id} has none`);
  }
}

/**
 * The gates (ADR 0014 §1): each on a source, or on a step the flow publishes or watches, written in a notebook (a gate
 * is a `gate()` cell, so a document without notebooks has none), its layer one of three, its checks from the
 * vocabulary, each hold, warn or off.
 */
/**
 * The contracts (Q-171, ADR 0020 §4): each on a dataset the flow publishes, in a flow with gates (gold's schema check is
 * what holds a broken one), with an id, a semantic version, a status and its columns, each named once, typed as the
 * engine types it; any other field refused rather than ignored.
 */
function validateContracts(doc: Record<string, unknown>, add: (path: string, message: string) => void): void {
  const c = doc.contracts;
  if (c === undefined) return;
  if (!isRecord(c)) return add('$.contracts', 'the contracts by the dataset each is of: { dataset: { id, version, status, columns } }');
  if (!isRecord(doc.gates) || Object.keys(doc.gates).length === 0) add('$.contracts', 'a contract is checked by gold\'s schema check: a flow without gates has none');
  const steps = (Array.isArray(doc.steps) ? doc.steps : []).filter((s: unknown): s is Record<string, unknown> => isRecord(s) && typeof s.id === 'string');
  const published = new Set(steps.filter((s) => s.dataset !== undefined).map((s) => String(s.id).toLowerCase()));
  const seen = new Set<string>();
  for (const [dataset, contract] of Object.entries(c)) {
    const at = `$.contracts.${dataset}`;
    const lower = dataset.toLowerCase();
    if (seen.has(lower)) add(at, `${dataset} has two contracts (ids are compared without case)`);
    seen.add(lower);
    if (!published.has(lower)) add(at, `${dataset} isn't a dataset the flow publishes: a contract is what a published dataset's consumers rely on`);
    if (!isRecord(contract)) {
      add(at, '{ id, version, status, description?, columns, sla? }');
      continue;
    }
    for (const k of Object.keys(contract)) if (!CONTRACT_FIELDS.includes(k)) add(`${at}.${k}`, `not a field this version reads (${CONTRACT_FIELDS.join(', ')}): refused rather than ignored`);
    if (typeof contract.id !== 'string' || contract.id === '') add(`${at}.id`, 'a non-empty string');
    if (typeof contract.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(contract.version)) add(`${at}.version`, 'a semantic version: major.minor.patch');
    if (!(CONTRACT_STATUSES as readonly unknown[]).includes(contract.status)) add(`${at}.status`, `one of ${CONTRACT_STATUSES.join(', ')}`);
    if (contract.description !== undefined && !(isRecord(contract.description) && Object.entries(contract.description).every(([k, v]) => ['purpose', 'limitations', 'usage'].includes(k) && typeof v === 'string'))) add(`${at}.description`, '{ purpose?, limitations?, usage? }, each text');
    if (contract.sla !== undefined && !(isRecord(contract.sla) && Object.entries(contract.sla).every(([k, v]) => ['frequency', 'availableBy', 'retention'].includes(k) && typeof v === 'string'))) add(`${at}.sla`, '{ frequency?, availableBy?, retention? }, each text');
    if (!Array.isArray(contract.columns) || contract.columns.length === 0) {
      add(`${at}.columns`, 'a list of columns, each { name, type }');
      continue;
    }
    const names = new Set<string>();
    contract.columns.forEach((col: unknown, i: number) => {
      const ca = `${at}.columns[${i}]`;
      if (!isRecord(col) || typeof col.name !== 'string' || col.name === '') return add(ca, '{ name, type, description?, required?, key?, classification?, values? }');
      for (const k of Object.keys(col)) if (!CONTRACT_COLUMN_FIELDS.includes(k)) add(`${ca}.${k}`, `not a field this version reads (${CONTRACT_COLUMN_FIELDS.join(', ')}): refused rather than ignored`);
      if (names.has(col.name.toLowerCase())) add(`${ca}.name`, `${col.name} is named twice`);
      names.add(col.name.toLowerCase());
      if (!(CONTRACT_TYPES as readonly unknown[]).includes(col.type)) add(`${ca}.type`, `one of ${CONTRACT_TYPES.join(', ')}`);
      for (const k of ['required', 'key'] as const) if (col[k] !== undefined && typeof col[k] !== 'boolean') add(`${ca}.${k}`, 'true or false');
      if (col.classification !== undefined && !(CONTRACT_CLASSIFICATIONS as readonly unknown[]).includes(col.classification)) add(`${ca}.classification`, `one of ${CONTRACT_CLASSIFICATIONS.join(', ')}`);
      if (col.values !== undefined && !(Array.isArray(col.values) && col.values.length > 0 && col.values.every((v: unknown) => typeof v === 'string'))) add(`${ca}.values`, 'a list of the values it may take, as text');
    });
  }
}

/** What is wrong with a list of change sets, each problem by its path (from `$.changes`) and in words: the document's
 * own check, for change sets kept elsewhere (a recorded story's, timeline.ts). Empty when they are good. */
export function changesProblems(changes: unknown): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  validateChanges({ changes }, (path, message) => out.push({ path, message }));
  return out;
}

/**
 * The dated change sets (ADR 0021 §5): each named once, with the day it takes effect from, when it was recorded, who
 * made it and why, and its edits, each of an op this version replays with what it needs; any other field refused rather
 * than ignored. Whether an edit applies to the rules of a day is the replay's to say (inforce.ts `applyEdit`).
 */
function validateChanges(doc: Record<string, unknown>, add: (path: string, message: string) => void): void {
  const c = doc.changes;
  if (c === undefined) return;
  if (!Array.isArray(c)) return add('$.changes', 'a list of change sets: { id, from, recorded, by, why, edits }');
  const text = (v: unknown) => typeof v === 'string' && v !== '';
  const seen = new Set<string>();
  c.forEach((cs: unknown, i: number) => {
    const at = `$.changes[${i}]`;
    if (!isRecord(cs)) return add(at, 'a change set: { id, from, recorded, by, why, edits }');
    for (const k of Object.keys(cs)) if (!CHANGE_FIELDS.includes(k)) add(`${at}.${k}`, `not a field of a change set (${CHANGE_FIELDS.join(', ')})`);
    if (!text(cs.id)) add(`${at}.id`, 'a non-empty string');
    else if (seen.has(cs.id as string)) add(`${at}.id`, `change set ${String(cs.id)} is listed twice`);
    else seen.add(cs.id as string);
    if (typeof cs.from !== 'string' || !DAY.test(cs.from) || Number.isNaN(Date.parse(`${cs.from}T00:00:00Z`))) add(`${at}.from`, 'the business day it takes effect from: YYYY-MM-DD');
    if (cs.until !== undefined && (typeof cs.until !== 'string' || !DAY.test(cs.until) || Number.isNaN(Date.parse(`${cs.until}T00:00:00Z`)) || (typeof cs.from === 'string' && cs.until < cs.from))) add(`${at}.until`, 'the last business day it is in force: YYYY-MM-DD, on or after its day');
    if (typeof cs.recorded !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(cs.recorded) || Number.isNaN(Date.parse(cs.recorded))) add(`${at}.recorded`, 'when it was made: an ISO 8601 time');
    if (typeof cs.by !== 'string') add(`${at}.by`, 'who made it');
    if (typeof cs.why !== 'string') add(`${at}.why`, 'why, in their words (empty where they gave none)');
    if (cs.kind !== undefined && !(CHANGE_KINDS as readonly unknown[]).includes(cs.kind)) add(`${at}.kind`, `one of ${CHANGE_KINDS.join(', ')}`);
    // Ontology first (format 5, ADR 0027 §2, Q-256): every change says its kind, and why in a line.
    if (doc.smaltfl === 5) {
      if (cs.kind === undefined) add(`${at}.kind`, `a format-5 change set says its kind: one of ${CHANGE_KINDS.join(', ')}`);
      if (typeof cs.why === 'string' && cs.why.trim() === '') add(`${at}.why`, 'a format-5 change set says why, in a line');
    }
    if (cs.note !== undefined) {
      if (!isRecord(cs.note)) add(`${at}.note`, `the thinking behind it: { ${NOTE_FIELDS.join(', ')} }, each a string`);
      else {
        for (const k of Object.keys(cs.note)) if (!NOTE_FIELDS.includes(k)) add(`${at}.note.${k}`, `not a part of a note (${NOTE_FIELDS.join(', ')})`);
        for (const k of NOTE_FIELDS) if (cs.note[k] !== undefined && !text(cs.note[k])) add(`${at}.note.${k}`, 'a non-empty string, or left out');
        if (typeof cs.note.lookAgain === 'string' && (!DAY.test(cs.note.lookAgain) || Number.isNaN(Date.parse(`${cs.note.lookAgain}T00:00:00Z`)))) add(`${at}.note.lookAgain`, 'the day to look again: YYYY-MM-DD');
      }
    }
    if (cs.decided !== undefined) {
      if (!isRecord(cs.decided) || !text(cs.decided.by)) add(`${at}.decided`, 'who chose it: { by, on }');
      else if (cs.decided.on !== undefined && (typeof cs.decided.on !== 'string' || !DAY.test(cs.decided.on) || Number.isNaN(Date.parse(`${cs.decided.on}T00:00:00Z`)))) add(`${at}.decided.on`, 'the day it was chosen: YYYY-MM-DD');
    }
    if (cs.because !== undefined) {
      if (!isRecord(cs.because) || (cs.because.event === undefined && cs.because.decision === undefined)) add(`${at}.because`, 'what led to it: { event } by its id, or { decision } by its number in the record');
      else {
        if (cs.because.event !== undefined && !text(cs.because.event)) add(`${at}.because.event`, 'an event’s id');
        if (cs.because.decision !== undefined && !(Number.isInteger(cs.because.decision) && (cs.because.decision as number) >= 0)) add(`${at}.because.decision`, 'a decision’s number in the record');
      }
    }
    if (!Array.isArray(cs.edits) || cs.edits.length === 0) return add(`${at}.edits`, 'its edits: a list of one or more');
    cs.edits.forEach((e: unknown, j: number) => {
      const ea = `${at}.edits[${j}]`;
      if (!isRecord(e) || !(EDIT_OPS as readonly unknown[]).includes(e.op)) return add(ea, `an edit: { op, ... }, op one of ${EDIT_OPS.join(', ')}`);
      const need = (k: string, ok: boolean, what: string) => {
        if (!ok) add(`${ea}.${k}`, what);
      };
      switch (e.op) {
        case 'setRule': {
          const r = e.rule;
          if (!isRecord(r)) return add(`${ea}.rule`, 'the rule: { id, file, column, kind, action, ... }');
          for (const k of ['id', 'file', 'column', 'kind', 'action']) need(`rule.${k}`, text(r[k]), 'a non-empty string');
          return;
        }
        case 'removeRule':
        case 'switchRule':
          need('file', text(e.file), 'the file the rule is of');
          need('id', text(e.id), 'the rule’s id');
          if (e.op === 'switchRule') need('on', typeof e.on === 'boolean', 'true to switch it on, false to switch it off');
          return;
        case 'nameColumn': {
          need('file', text(e.file), 'the file the column is of');
          need('column', text(e.column), 'the column, as the file writes it');
          const ch = e.change;
          if (!isRecord(ch)) return add(`${ea}.change`, 'what changed: { title?, description?, values?, override? }');
          for (const k of ['title', 'description', 'override'] as const) need(`change.${k}`, ch[k] === undefined || typeof ch[k] === 'string', 'text');
          need('change.values', ch.values === undefined || (isRecord(ch.values) && Object.values(ch.values).every((v) => typeof v === 'string')), 'a label for each value, by the value');
          return;
        }
        case 'acceptBand': {
          need('source', text(e.source), 'the source the band is of');
          const b = e.band;
          const share = isRecord(b) && Array.isArray(b.share) && b.share.length === 2 && b.share.every((x: unknown) => typeof x === 'number' && x >= 0 && x <= 1) && (b.share[0] as number) <= (b.share[1] as number);
          need('band', isRecord(b) && text(b.column) && typeof b.value === 'string' && share, 'the band: { column, value, share: [low, high] }, shares from 0 to 1');
          return;
        }
        case 'setCheck':
          need('node', text(e.node), 'the source or step whose gate it is');
          need('check', (CHECK_NAMES as readonly unknown[]).includes(e.check), `a check: ${CHECK_NAMES.join(', ')}`);
          need('mode', (CHECK_MODES as readonly unknown[]).includes(e.mode), `${CHECK_MODES.join(', ')}`);
          return;
        case 'useVersion':
          need('changes', Array.isArray(e.changes) && e.changes.every((x: unknown) => text(x)), 'the change sets whose rules it takes: a list of their names (empty: the rules as shipped)');
          return;
        case 'mapColumn':
          need('file', text(e.file), 'the file the column is of');
          need('column', text(e.column), 'the column, as the source declares it');
          need('from', e.from === null || (text(e.from) && String(e.from).toLowerCase() !== String(e.column).toLowerCase()), 'the name the file gives the column now, not its own; null to read it by its own name again');
          return;
        case 'declareValues':
          need('file', text(e.file), 'the file the column is of');
          need('column', text(e.column), 'the column, as the file writes it');
          need('values', Array.isArray(e.values) && e.values.length > 0 && e.values.every((v: unknown) => typeof v === 'string'), 'its codes: a list of one or more, as text');
          return;
        case 'declareKey':
          need('file', text(e.file), 'the file whose key it is');
          need('column', text(e.column), 'the column, as the file writes it');
          return;
        case 'declareEntry':
          need('file', text(e.file), 'the file whose closed list or column it is');
          need('rule', text(e.rule), 'the closed rule, by its name');
          need('entry', Array.isArray(e.entry) && e.entry.length > 0 && e.entry.every((v: unknown) => typeof v === 'string') && e.entry[0] !== '', 'the entry: its key, then what each column that defines it holds');
          return;
        case 'leaveOut':
          need('file', text(e.file), 'the file whose closed list or column it is');
          need('rule', text(e.rule), 'the closed rule, by its name');
          need('key', text(e.key), 'the key left out until it is declared');
          return;
      }
    });
  });
  // A version is of change sets recorded before the change set that takes it, never itself or one recorded after.
  const when = new Map(c.flatMap((cs: unknown) => (isRecord(cs) && typeof cs.id === 'string' && typeof cs.recorded === 'string' ? [[cs.id, Date.parse(cs.recorded)] as const] : [])));
  c.forEach((cs: unknown, i: number) => {
    if (!isRecord(cs) || !Array.isArray(cs.edits)) return;
    cs.edits.forEach((e: unknown, j: number) => {
      if (!isRecord(e) || e.op !== 'useVersion' || !Array.isArray(e.changes)) return;
      for (const id of e.changes) {
        const t = typeof id === 'string' ? when.get(id) : undefined;
        if (t === undefined) add(`$.changes[${i}].edits[${j}].changes`, `${String(id)} names no change set of the flow`);
        else if (id === cs.id || !(t < Date.parse(String(cs.recorded)))) add(`$.changes[${i}].edits[${j}].changes`, `${String(id)} isn't recorded before ${String(cs.id)}: a version is of change sets recorded before it`);
      }
    });
  });
}

function validateGates(doc: Record<string, unknown>, add: (path: string, message: string) => void): void {
  const g = doc.gates;
  if (g === undefined) return;
  if (!isRecord(g)) return add('$.gates', 'the gates by the source or step each judges: { id: { layer, checks } }');
  if (doc.notebooks === undefined) add('$.gates', 'a gate is written in a notebook, as a gate() cell beside the node it judges: a document without notebooks has none');
  const sources = new Set((Array.isArray(doc.sources) ? doc.sources : []).filter((s: unknown) => isRecord(s) && typeof s.id === 'string').map((s: Record<string, unknown>) => String(s.id).toLowerCase()));
  const steps = (Array.isArray(doc.steps) ? doc.steps : []).filter((s: unknown): s is Record<string, unknown> => isRecord(s) && typeof s.id === 'string');
  const published = new Set(steps.filter((s) => s.dataset !== undefined).map((s) => String(s.id).toLowerCase()));
  const stepIds = new Set(steps.map((s) => String(s.id).toLowerCase()));
  const pub = isRecord(doc.publish) ? doc.publish : null;
  const watched = new Set(Object.keys(pub && isRecord(pub.watch) ? pub.watch : {}).map((k) => k.toLowerCase()));
  const seen = new Set<string>();
  for (const [id, gate] of Object.entries(g)) {
    const at = `$.gates.${id}`;
    const lower = id.toLowerCase();
    if (seen.has(lower)) add(at, `${id} has two gates (ids are compared without case)`);
    seen.add(lower);
    if (!sources.has(lower) && !stepIds.has(lower)) add(at, `no source or step ${id}: a gate judges a source, or a step the flow publishes or watches`);
    else if (stepIds.has(lower) && !published.has(lower) && !watched.has(lower)) add(at, `${id} is a step nothing publishes or watches: a gate judges what the flow judges or lets out`);
    for (const m of gateProblems(gate)) add(at, m);
    // The rules' other datasets (ADR 0014 §4) are sources: the inventory and the dataset a dependency is read from are
    // files the page has before the run, so the counts can be measured where every other measure is.
    if (isRecord(gate)) {
      const sc = gate.scope;
      if (isRecord(sc) && typeof sc.of === 'string' && !sources.has(sc.of.toLowerCase())) add(`${at}.scope.of`, `${sc.of} isn't a source: the scope's inventory is a source of the flow`);
      for (const n of Array.isArray(gate.needs) ? gate.needs : gate.needs !== undefined ? [gate.needs] : []) if (isRecord(n) && typeof n.from === 'string' && !sources.has(n.from.toLowerCase())) add(`${at}.needs.from`, `${n.from} isn't a source: a dependency is read from a source of the flow`);
      // A reconciliation's other node (ADR 0014 §6): a source for a watched node (measured before the run), any node for
      // an output the run alone counts.
      const rc = gate.reconcile;
      if (isRecord(rc) && typeof rc.of === 'string') {
        const of = rc.of.toLowerCase();
        if (!sources.has(of) && !stepIds.has(of)) add(`${at}.reconcile.of`, `no source or step ${rc.of}`);
        else if (watched.has(lower) && !sources.has(of)) add(`${at}.reconcile.of`, `${rc.of} is a step: a watched node reconciles against a source, which is there before the run`);
      }
    }
  }
}

/** The publish block (ADR 0009 §2): what holds, the sources judged against their history, the period, together. */
function validatePublish(doc: Record<string, unknown>, params: Map<string, ParameterDef>, add: (path: string, message: string) => void): void {
  const p = doc.publish;
  if (p === undefined) return;
  if (!isRecord(p)) return add('$.publish', '{ hold, watch, period, together, reach, donor, meanwhile, until }');
  for (const k of Object.keys(p)) if (!PUBLISH_FIELDS.includes(k)) add(`$.publish.${k}`, `not a field this version reads (${PUBLISH_FIELDS.join(', ')}): refused rather than ignored`);
  const hold = new Set<HoldKind>();
  if (!Array.isArray(p.hold) || p.hold.length === 0) add('$.publish.hold', `a list of what holds: ${HOLD_KINDS.join(', ')}`);
  else
    p.hold.forEach((k: unknown, i: number) => {
      if (!(HOLD_KINDS as readonly unknown[]).includes(k)) add(`$.publish.hold[${i}]`, `one of ${HOLD_KINDS.join(', ')}`);
      else if (hold.has(k as HoldKind)) add(`$.publish.hold[${i}]`, `${String(k)} is listed twice`);
      else hold.add(k as HoldKind);
    });
  if (hold.has('short') && hold.has('wrong')) add('$.publish.hold', 'short or wrong, not both: wrong holds every day short does');
  const judged = hold.has('short') || hold.has('wrong');
  if (hold.has('unlearned') && !judged) add('$.publish.hold', 'unlearned holds beside short or wrong: a day not judged is only a reason to hold for a flow that holds on its story');
  const sources = new Map((Array.isArray(doc.sources) ? doc.sources : []).filter((s: unknown) => isRecord(s) && typeof s.id === 'string').map((s: Record<string, unknown>) => [String(s.id).toLowerCase(), String(s.id)]));
  // A watch may name a step the flow publishes (ADR 0013 §4): its load is the dataset the run builds, judged once built.
  const steps = (Array.isArray(doc.steps) ? doc.steps : []).filter((s: unknown): s is Record<string, unknown> => isRecord(s) && typeof s.id === 'string');
  const published = new Map(steps.filter((s) => s.dataset !== undefined).map((s) => [String(s.id).toLowerCase(), String(s.id)]));
  const stepIds = new Set(steps.map((s) => String(s.id).toLowerCase()));
  const textParam = (name: unknown, path: string, what: string) => {
    const d = typeof name === 'string' ? params.get(name) : undefined;
    if (!d) add(path, `no parameter ${String(name)}`);
    else if (d.type !== 'text') add(path, `${d.name} is ${d.type === 'integer' ? 'an' : 'a'} ${d.type}: ${what}`);
  };
  let watched = 0;
  let holding = 0;
  let unperiod = 0;
  if (p.watch !== undefined) {
    if (!isRecord(p.watch)) add('$.publish.watch', "each source judged against its history, with the history's file");
    else
      for (const [id, w] of Object.entries(p.watch)) {
        watched++;
        const at = `$.publish.watch.${id}`;
        if (!sources.has(id.toLowerCase()) && !published.has(id.toLowerCase())) add(at, stepIds.has(id.toLowerCase()) ? `${id} isn't published: a watched step is one the flow publishes (a step with a dataset block), judged once the run has built it` : `no source or published step ${id}: a watch judges a source, or a step the flow publishes`);
        else if (Object.keys(p.watch).findIndex((k) => k.toLowerCase() === id.toLowerCase()) < watched - 1) add(at, `${sources.get(id.toLowerCase()) ?? published.get(id.toLowerCase())} is watched twice (ids are compared without case)`);
        if (!isGeneralWatch(w)) {
          if (typeof w !== 'string' || w === '') add(at, "the history's file, a file in the data's list");
          holding++;
          unperiod++;
          continue;
        }
        validateWatch(w as unknown as Record<string, unknown>, at, add, textParam);
        if (w.holds !== false) holding++;
        if (w.period === undefined) unperiod++;
      }
  }
  if (judged && holding === 0) add('$.publish.watch', `${hold.has('short') ? 'short' : 'wrong'} judges a source against its history: watch names it${watched ? ', and every watch says holds: false' : ''}`);
  if (!judged && holding > 0) add('$.publish.watch', 'a watch is judged only for short or wrong, and hold has neither');
  if (p.period !== undefined) textParam(p.period, '$.publish.period', 'the period is a text parameter, such as a day');
  else if (unperiod > 0) add('$.publish.period', 'a watch needs a period: the parameter whose value is the day a claim names');
  if (p.together !== undefined && typeof p.together !== 'boolean') add('$.publish.together', 'true or false');
  if (p.overwhelming !== undefined && !isShareOfRows(p.overwhelming)) add('$.publish.overwhelming', 'the share of a day’s rows a learned check’s alert must move to hold the day: a number above 0, at most 1 (a quarter is 0.25)');
  if (p.reach !== undefined && !(REACHES as readonly unknown[]).includes(p.reach)) add('$.publish.reach', `one of ${REACHES.join(', ')}`);
  else if (p.reach !== undefined && p.together !== false) add('$.publish.reach', 'what a hold reaches matters only where outputs publish apart: it needs together: false');
  else if (p.reach !== undefined && documentFormat(doc) < 3) add('$.publish.reach', 'a format-3 or later document’s: refused rather than ignored');
  if (p.donor !== undefined && !(DONOR_RULES as readonly unknown[]).includes(p.donor)) add('$.publish.donor', `one of ${DONOR_RULES.join(', ')}`);
  // Format 3 says how each source is judged in its watch, its donor among it (C1): a flow-wide rule there is refused.
  else if (p.donor !== undefined && documentFormat(doc) === 3) add('$.publish.donor', 'in format 3 each watch names its own donor (publish.watch.<source>.donor, a watch given as an object): refused rather than ignored');
  if (p.meanwhile !== undefined && !(MEANWHILES as readonly unknown[]).includes(p.meanwhile)) add('$.publish.meanwhile', `one of ${MEANWHILES.join(', ')}`);
  if (p.until !== undefined && !(UNTILS as readonly unknown[]).includes(p.until)) add('$.publish.until', `one of ${UNTILS.join(', ')}`);
  if (p.meanwhile !== undefined && p.meanwhile !== 'last' && !judged) add('$.publish.meanwhile', `${String(p.meanwhile)} fills a watched source's missing part, which its story names: hold has neither short nor wrong`);
}

/** A watch in the general form (ADR 0010 §10): its fields, each one this build can judge, else refused. */
function validateWatch(w: Record<string, unknown>, at: string, add: (path: string, message: string) => void, textParam: (name: unknown, path: string, what: string) => void): void {
  const later = 'not something this version can judge yet: refused rather than ignored';
  for (const k of Object.keys(w)) if (!WATCH_FIELDS.includes(k)) add(`${at}.${k}`, `not a field this version reads (${WATCH_FIELDS.join(', ')}): refused rather than ignored`);
  if (typeof w.history !== 'string' || w.history === '') add(`${at}.history`, "the history's file, a file in the data's list");
  if (w.period !== undefined) textParam(w.period, `${at}.period`, 'the period is a text parameter, such as a day');
  if (w.every !== undefined && !isEvery(w.every)) add(`${at}.every`, `one of ${EVERIES.join(', ')}`);
  else if (w.every !== undefined && w.every !== 'day' && w.time === undefined) add(`${at}.time`, `a load of ${w.every} is counted by its time column, which falls in its slot: name it`);
  if (w.pattern !== undefined && !['weekly', 'none', 'monthly'].includes(w.pattern as string)) add(`${at}.pattern`, 'weekly, none or monthly');
  if (w.donor !== undefined && w.donor !== 'weekday' && w.donor !== 'nearest') add(`${at}.donor`, 'weekday or nearest');
  if (w.time !== undefined && (typeof w.time !== 'string' || w.time === '')) add(`${at}.time`, 'a time column');
  if (w.zone !== undefined && (typeof w.zone !== 'string' || calendarProblems({ zone: w.zone }).length > 0)) add(`${at}.zone`, 'a time zone, such as UTC or America/New_York');
  for (const k of ['calendar', 'holds', 'relearn'] as const) if (w[k] !== undefined && typeof w[k] !== 'boolean') add(`${at}.${k}`, 'true or false');
  if (w.scale !== undefined && w.scale !== 'fixed' && w.scale !== 'volume') add(`${at}.scale`, 'fixed or volume');
  for (const k of ['count', 'follow'] as const)
    if (w[k] !== undefined && (!Array.isArray(w[k]) || (w[k] as unknown[]).some((c) => typeof c !== 'string' || c === '') || new Set(w[k] as string[]).size !== (w[k] as unknown[]).length)) add(`${at}.${k}`, 'a list of columns, each once');
}

/** What is wrong with a use (ADR 0026 §11) as a document or a flow's part gives it, in a sentence; null where it is one. */
function useProblem(u: unknown): string | null {
  const shape = '{ of: { id, name, hash }, inputs: { input: { to, columns } }, settings: { name: { type, value, default } } }: the flow used, the dataset mapped onto each of its inputs and the value of each setting';
  if (!isRecord(u) || !isRecord(u.of) || !isRecord(u.inputs) || !isRecord(u.settings)) return shape;
  if (typeof u.of.id !== 'string' || u.of.id === '' || typeof u.of.name !== 'string' || typeof u.of.hash !== 'string' || !/^[0-9a-f]{64}$/.test(u.of.hash)) return shape;
  for (const [name, x] of Object.entries(u.inputs)) {
    if (!ID.test(name) || !isRecord(x) || typeof x.to !== 'string' || !ID.test(x.to)) return `the input ${name} is mapped onto a dataset, by its id`;
    if (!Array.isArray(x.columns) || x.columns.length === 0 || x.columns.some((c) => typeof c !== 'string' || !COLUMN.test(c))) return `the input ${name} names the columns the flow needs of it`;
  }
  for (const [name, v] of Object.entries(u.settings)) {
    if (!ID.test(name) || !isRecord(v) || (v.type !== 'text' && v.type !== 'integer' && v.type !== 'real') || !fits(v.value, v.type) || !fits(v.default, v.type)) return `the setting ${name} has a type (text, integer or real), a value of it and the flow’s default`;
  }
  for (const k of Object.keys(u)) if (!['of', 'inputs', 'settings'].includes(k)) return `${k} is not a use’s (of, inputs, settings)`;
  return null;
}

/**
 * The flows a document reads (ADR 0026 §1): each a part with its own sources and steps, none shared; a flow after the
 * flows it reads, so none reads itself; and what one flow reads of another is that flow's to give: a dataset it
 * publishes, or one of its files as it arrived, and only of a flow it lists. A use of a flow (§11) reads, besides, the
 * datasets mapped onto its inputs: those of the flow that lists it, or what a flow that one lists gives.
 */
function validateFlows(doc: Record<string, unknown>, ids: Map<string, string>, add: (path: string, message: string) => void): void {
  if (doc.flows === undefined) return;
  if (!Array.isArray(doc.flows)) return add('$.flows', 'a list of the flows this one reads');
  if (doc.flows.some((f) => typeof f === 'string')) return add('$.flows', 'the flows a flow reads are brought in when it is read (readFlow): this document lists paths it was never read with');
  const parts: FlowPart[] = [];
  const seen = new Map<string, string>();
  const owner = new Map<string, FlowPart>();
  doc.flows.forEach((f: unknown, i: number) => {
    const at = `$.flows[${i}]`;
    const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string');
    if (!isRecord(f) || typeof f.path !== 'string' || f.path === '' || typeof f.id !== 'string' || f.id === '' || typeof f.name !== 'string' || typeof f.hash !== 'string' || !/^[0-9a-f]{64}$/.test(f.hash)
      || !strings(f.sources) || !strings(f.steps) || !strings(f.reads) || typeof f.direct !== 'boolean' || (f.description !== undefined && typeof f.description !== 'string')) {
      return add(at, '{ path, id, name, hash, sources, steps, reads, direct }: a flow as it was read, with its own flow hash');
    }
    for (const k of Object.keys(f)) if (!FLOW_PART_FIELDS.includes(k)) add(`${at}.${k}`, `not a flow's part (${FLOW_PART_FIELDS.join(', ')})`);
    const part = f as unknown as FlowPart;
    if (seen.has(part.id.toLowerCase()) || part.id === doc.id) add(`${at}.id`, part.id === doc.id ? `${part.id} is this flow's own id: a flow doesn't read itself` : `two flows are called ${part.id}`);
    seen.set(part.id.toLowerCase(), at);
    for (const r of part.reads) if (!parts.some((p) => p.id === r)) add(`${at}.reads`, `${part.name} reads ${r}, which isn't listed before it: a flow comes after the flows it reads, and none reads itself`);
    if (part.pin !== undefined && (!strings(part.pin) || part.pin.length === 0)) add(`${at}.pin`, 'the flows that pin it, by id: a list of names, the document’s own flow by an empty one');
    if (part.use !== undefined) {
      const problem = useProblem(part.use);
      if (problem) add(`${at}.use`, problem);
      else for (const [name, x] of Object.entries(part.use.inputs)) if (!ids.has(x.to.toLowerCase())) add(`${at}.use.inputs.${name}`, `${part.name} maps ${name} onto ${x.to}, which isn’t a dataset here`);
    }
    for (const [kind, list] of [['source', part.sources], ['step', part.steps]] as const) {
      for (const id of list) {
        const where = ids.get(id.toLowerCase());
        if (!where || where.startsWith('$.sources') !== (kind === 'source')) add(`${at}.${kind}s`, `no ${kind} ${id}`);
        else if (owner.has(id.toLowerCase())) add(`${at}.${kind}s`, `${id} is ${owner.get(id.toLowerCase())!.name}'s and ${part.name}'s: a source or a step is one flow's`);
        else owner.set(id.toLowerCase(), part);
      }
    }
    parts.push(part);
  });
  if (parts.length !== doc.flows.length) return;
  // What one flow reads of another: a published dataset or a file, of a flow it lists.
  const steps = (Array.isArray(doc.steps) ? doc.steps : []).filter((s: unknown): s is Record<string, unknown> => isRecord(s) && typeof s.id === 'string');
  const published = new Set(steps.filter((s) => s.dataset !== undefined).map((s) => String(s.id).toLowerCase()));
  const own = typeof doc.name === 'string' ? doc.name : 'this flow';
  const lists = (reader: FlowPart | undefined, read: FlowPart) => (reader ? reader.reads.includes(read.id) : read.direct);
  // A use is given the datasets mapped onto its inputs by the flow that lists it (the document's own where it is
  // direct, else each flow that reads it): one of that flow's own is the use's to read.
  const mapped = (reader: FlowPart | undefined, id: string): boolean => !!reader?.use && Object.values(reader.use.inputs).some((x) => x.to.toLowerCase() === id.toLowerCase());
  const listers = (use: FlowPart): (FlowPart | undefined)[] => [...(use.direct ? [undefined] : []), ...parts.filter((p) => p.reads.includes(use.id))];
  const check = (at: string, reader: FlowPart | undefined, what: string, id: string) => {
    const from = owner.get(id.toLowerCase());
    if (from === reader) return;
    if (mapped(reader, id) && listers(reader!).includes(from)) return;
    if (from === undefined) {
      // The reading document's own flow's: a flow read into another can't read back out of it.
      if (reader !== undefined && ids.has(id.toLowerCase())) add(at, `${what} reads ${id}, which is ${own}'s: a flow reads the flows it lists, not the flow that reads it`);
      return;
    }
    if (!lists(reader, from)) add(at, `${what} reads ${id}, which is ${from.name}'s, and ${reader ? reader.name : own} doesn't list ${from.name} among the flows it reads`);
    else if (ids.get(id.toLowerCase())!.startsWith('$.steps') && !published.has(id.toLowerCase())) add(at, `${what} reads ${id}, a step of ${from.name} that it doesn't publish: a flow reads what another gives (publish ${id} there) or its files`);
  };
  steps.forEach((s) => {
    const reader = owner.get(String(s.id).toLowerCase());
    const i = (doc.steps as unknown[]).indexOf(s);
    for (const input of Array.isArray(s.inputs) ? s.inputs : []) if (typeof input === 'string') check(`$.steps[${i}].inputs`, reader, String(s.id), input);
  });
  // What a use maps is what the flow that lists it may read itself (ADR 0026 §11): a dataset of that flow's own, or
  // of a flow it lists. A flow lists every flow it reads from, and a use is no way round that.
  parts.forEach((part, i) => {
    if (!part.use) return;
    const by = listers(part);
    for (const [name, x] of Object.entries(part.use.inputs)) {
      const from = owner.get(x.to.toLowerCase());
      if (!ids.has(x.to.toLowerCase()) || by.includes(from)) continue;
      const listed = by.some((l) => (from === undefined ? false : lists(l, from)));
      if (!listed) {
        const who = by.length ? by.map((l) => (l ? l.name : own)).join(' and ') : own;
        add(`$.flows[${i}].use.inputs.${name}`, from === undefined
          ? `${part.name} maps ${name} onto ${x.to}, which is ${own}'s: a flow reads the flows it lists, not the flow that reads it`
          : `${part.name} maps ${name} onto ${x.to}, which is ${from.name}'s, and ${who} doesn't list ${from.name} among the flows it reads`);
      }
    }
  });
  // A gate's written rules name datasets too (its scope's inventory, a dependency's source, what it reconciles with).
  if (isRecord(doc.gates)) {
    for (const [node, g] of Object.entries(doc.gates)) {
      if (!isRecord(g)) continue;
      const reader = owner.get(node.toLowerCase());
      const named = [isRecord(g.scope) ? g.scope.of : undefined, isRecord(g.reconcile) ? g.reconcile.of : undefined, ...(Array.isArray(g.needs) ? g.needs.map((n: unknown) => (isRecord(n) ? n.from : undefined)) : [])];
      for (const id of named) if (typeof id === 'string') check(`$.gates.${node}`, reader, `${node}'s gate`, id);
    }
  }
}

/** Groups, the ontology and the policies: their references, checked against the flow's ids. */
function validateExtras(doc: Record<string, unknown>, ids: Map<string, string>, add: (path: string, message: string) => void): void {
  const known = (id: unknown) => typeof id === 'string' && ids.has(id.toLowerCase());
  if (doc.groups !== undefined) {
    if (!Array.isArray(doc.groups)) add('$.groups', 'an array');
    else {
      const placed = new Set<string>();
      const named = new Set<string>();
      doc.groups.forEach((g: unknown, i: number) => {
        if (!isRecord(g) || typeof g.id !== 'string' || typeof g.name !== 'string' || !Array.isArray(g.steps)) return add(`$.groups[${i}]`, '{ id, name, steps }');
        if (named.has(g.id.toLowerCase()) || known(g.id)) add(`$.groups[${i}].id`, `${g.id} is already the id of a group, source or step`);
        named.add(g.id.toLowerCase());
        if (g.color !== undefined && !(GROUP_COLORS as readonly unknown[]).includes(g.color)) add(`$.groups[${i}].color`, `one of ${GROUP_COLORS.join(', ')}`);
        g.steps.forEach((s: unknown, j: number) => {
          if (!known(s)) add(`$.groups[${i}].steps[${j}]`, `no source or step ${String(s)}`);
          else if (placed.has(String(s).toLowerCase())) add(`$.groups[${i}].steps[${j}]`, `${String(s)} is in two groups`);
          else placed.add(String(s).toLowerCase());
        });
      });
    }
  }
  if (doc.profiles !== undefined) {
    if (!Array.isArray(doc.profiles)) add('$.profiles', 'an array');
    else {
      const taken = new Set((Array.isArray(doc.groups) ? doc.groups : []).map((g: unknown) => (isRecord(g) && typeof g.id === 'string' ? g.id.toLowerCase() : '')));
      doc.profiles.forEach((p: unknown, i: number) => {
        if (!isRecord(p) || typeof p.id !== 'string' || p.id === '' || typeof p.of !== 'string') return add(`$.profiles[${i}]`, '{ id, of }');
        if (taken.has(p.id.toLowerCase()) || known(p.id)) add(`$.profiles[${i}].id`, `${p.id} is already the id of a profile, group, source or step`);
        taken.add(p.id.toLowerCase());
        if (!known(p.of)) add(`$.profiles[${i}].of`, `no source or step ${p.of}`);
      });
    }
  }
  const o = doc.ontology;
  const types = new Set<string>();
  if (o !== undefined) {
    if (!isRecord(o) || !Array.isArray(o.objectTypes) || !Array.isArray(o.linkTypes) || !Array.isArray(o.actionTypes)) add('$.ontology', '{ objectTypes, linkTypes, actionTypes }');
    else {
      o.objectTypes.forEach((t: unknown, i: number) => {
        if (!isRecord(t) || typeof t.id !== 'string' || !Array.isArray(t.key) || typeof t.title !== 'string') return add(`$.ontology.objectTypes[${i}]`, '{ id, name, dataset, key, title }');
        if (types.has(t.id)) add(`$.ontology.objectTypes[${i}].id`, `duplicate object type ${t.id}`);
        types.add(t.id);
        if (!known(t.dataset)) add(`$.ontology.objectTypes[${i}].dataset`, `no source or step ${String(t.dataset)}`);
        // How ids match is said by each check that counts objects (Q-176, ADR 0022 §3), no longer once on the type.
        if (t.ids !== undefined) add(`$.ontology.objectTypes[${i}].ids`, 'said by each check that counts objects now (Q-176): a rows entry’s ids, or a gate cell’s scope’s');
      });
      o.linkTypes.forEach((l: unknown, i: number) => {
        if (!isRecord(l) || !types.has(String(l.from)) || !types.has(String(l.to))) add(`$.ontology.linkTypes[${i}]`, 'a link between two object types');
      });
      o.actionTypes.forEach((a: unknown, i: number) => {
        if (!isRecord(a) || typeof a.id !== 'string' || !types.has(String(a.on)) || !Array.isArray(a.params)) add(`$.ontology.actionTypes[${i}]`, '{ id, name, on: an object type, params }');
      });
      // What the columns mean, and where that comes from.
      const refs = new Set<string>();
      if (o.references !== undefined) {
        if (!Array.isArray(o.references)) add('$.ontology.references', 'a list of { id, title, url }');
        else
          o.references.forEach((r: unknown, i: number) => {
            if (!isRecord(r) || typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.url !== 'string') return add(`$.ontology.references[${i}]`, '{ id, title, url }');
            if (refs.has(r.id)) add(`$.ontology.references[${i}].id`, `duplicate reference ${r.id}`);
            refs.add(r.id);
          });
      }
      if (o.nouns !== undefined) {
        if (!isRecord(o.nouns)) add('$.ontology.nouns', 'what a row of each source or step is called: { id: { one, many } }');
        else
          for (const [id, n] of Object.entries(o.nouns)) {
            const at = `$.ontology.nouns.${id}`;
            if (!known(id)) add(at, `no source or step ${id}`);
            const word = (x: unknown) => typeof x === 'string' && x.trim() !== '' && x.trim().split(/\s+/).length <= 2;
            if (!isRecord(n) || !word(n.one) || !word(n.many)) add(at, '{ one, many }: one or two words each, "sign-in" and "sign-ins"');
          }
      }
      if (o.properties !== undefined) {
        if (!Array.isArray(o.properties)) add('$.ontology.properties', 'a list of { column, title, description }');
        else {
          const described = new Set<string>();
          o.properties.forEach((p: unknown, i: number) => {
            const at = `$.ontology.properties[${i}]`;
            if (!isRecord(p) || typeof p.column !== 'string' || p.column === '' || typeof p.title !== 'string' || typeof p.description !== 'string') return add(at, '{ column, title, description }');
            for (const f of ['unit', 'note'] as const) if (p[f] !== undefined && typeof p[f] !== 'string') add(`${at}.${f}`, 'text');
            if (p.values !== undefined && (!isRecord(p.values) || Object.values(p.values).some((v) => typeof v !== 'string'))) add(`${at}.values`, 'each code with its meaning, as text');
            if (p.lookup !== undefined && (!isRecord(p.lookup) || !known(p.lookup.dataset) || typeof p.lookup.key !== 'string' || typeof p.lookup.label !== 'string')) add(`${at}.lookup`, '{ dataset: a source or step, key, label }');
            if (p.sources !== undefined) {
              if (!Array.isArray(p.sources)) add(`${at}.sources`, 'a list of reference ids');
              else p.sources.forEach((r: unknown, j: number) => !refs.has(String(r)) && add(`${at}.sources[${j}]`, `no reference ${String(r)}`));
            }
            if (p.datasets !== undefined && (!Array.isArray(p.datasets) || p.datasets.length === 0)) add(`${at}.datasets`, 'a list of sources or steps');
            // The marks of ADR 0010 §4 and §8: what changes verdicts, and how a part is named.
            if (p.bad !== undefined) {
              const codes = isRecord(p.values) ? Object.keys(p.values) : null;
              if (!Array.isArray(p.bad) || p.bad.length === 0 || p.bad.some((v) => typeof v !== 'string') || new Set(p.bad).size !== p.bad.length) add(`${at}.bad`, 'a list of codes, each once');
              else if (codes) p.bad.forEach((v: string, j: number) => !codes.includes(v) && add(`${at}.bad[${j}]`, `${v} is not one of the column's values (${codes.join(', ')})`));
            }
            if (p.newValues !== undefined && p.newValues !== 'alert') add(`${at}.newValues`, 'alert: a value never seen before is something wrong');
            if (p.models !== undefined && p.models !== 'include' && p.models !== 'exclude') add(`${at}.models`, 'include or exclude: whether the two models read the column');
            // A flow's own handling of a column the estate describes (ADR 0026 §8): for its own datasets, with why.
            if (p.override !== undefined) {
              if (!isRecord(p.override) || typeof p.override.reason !== 'string' || p.override.reason.trim() === '') add(`${at}.override`, '{ reason }: why this flow handles the column its own way');
              if (!Array.isArray(p.datasets) || p.datasets.length === 0) add(`${at}.override`, 'an override is of the flow’s own datasets: datasets names them');
            }
            if (p.name !== undefined && (typeof p.name !== 'string' || !p.name.includes('{code}'))) add(`${at}.name`, 'how a part is named, with {code} for its code: "Vendor {code}"');
            if (p.role !== undefined && p.role !== 'sender') add(`${at}.role`, 'sender: the column names who sent the rows');
            if (p.after !== undefined && (!isRecord(p.after) || typeof p.after.of !== 'string' || p.after.of === '' || typeof p.after.minutes !== 'number' || !Number.isFinite(p.after.minutes))) add(`${at}.after`, '{ of: a time column, minutes }');
            // A column the file now names otherwise (ADR 0022 §2, Q-146): a file's own, read by that name.
            if (p.fromFile !== undefined) {
              const sets: unknown[] = Array.isArray(p.datasets) ? p.datasets : [];
              const sources: unknown[] = Array.isArray(doc.sources) ? doc.sources : [];
              const source = sets.length === 1 && sources.some((s) => isRecord(s) && typeof s.id === 'string' && s.id.toLowerCase() === String(sets[0]).toLowerCase());
              if (typeof p.fromFile !== 'string' || p.fromFile.trim() === '' || p.fromFile.toLowerCase() === p.column.toLowerCase()) add(`${at}.fromFile`, 'the name the file gives the column now: text, other than the column’s own');
              else if (!source) add(`${at}.fromFile`, 'a column the file names otherwise is that file’s own: datasets names the one source that reads it');
            }
            // Bands and due marks (ADR 0014 §3) are a gate's written checks: a document without gates has none.
            const gated = isRecord(doc.gates) && Object.keys(doc.gates).length > 0;
            if (p.expect !== undefined) {
              if (!Array.isArray(p.expect)) add(`${at}.expect`, 'a list of { value, share: [low, high], datasets? }');
              else {
                p.expect.forEach((b: unknown, j: number) => {
                  const bt = `${at}.expect[${j}]`;
                  if (!isRecord(b) || typeof b.value !== 'string' || !Array.isArray(b.share) || b.share.length !== 2 || b.share.some((x: unknown) => typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 1) || (b.share[0] as number) > (b.share[1] as number)) return add(bt, '{ value, share: [low, high] }, each share 0 to 1, low at most high');
                  if (b.datasets !== undefined && (!Array.isArray(b.datasets) || b.datasets.length === 0 || b.datasets.some((d: unknown) => !known(d)))) add(`${bt}.datasets`, 'a list of sources or steps the band is for');
                });
                if (!gated) add(`${at}.expect`, 'a band is a gate’s written check (ADR 0014): the flow has no gate');
              }
            }
            if (p.due !== undefined) {
              if (!isRecord(p.due) || typeof p.due.status !== 'string' || p.due.status === '' || typeof p.due.miss !== 'string' || (p.due.within !== undefined && (!Number.isInteger(p.due.within) || (p.due.within as number) < 1 || (p.due.within as number) > 366))) add(`${at}.due`, '{ status: the status column, miss: the value that is a miss, within?: days (1 to 366) }');
              else if (!gated) add(`${at}.due`, 'a due mark is a gate’s written check (ADR 0014): the flow has no gate');
            }
            const column = p.column;
            const scopes = Array.isArray(p.datasets) ? p.datasets : ['*'];
            scopes.forEach((d: unknown, j: number) => {
              if (d !== '*' && !known(d)) add(`${at}.datasets[${j}]`, `no source or step ${String(d)}`);
              const k = `${column.toLowerCase()}|${String(d).toLowerCase()}`;
              if (described.has(k)) add(`${at}.column`, `${column} is described twice${d === '*' ? '' : ` on ${String(d)}`}`);
              described.add(k);
            });
          });
        }
      }
      // What a dataset's rows are (ADR 0015 §1): one row an object of a type, for the objects a condition selects. The
      // type's dataset is the inventory the scope is counted against, a source, there before the run as a gate's is.
      if (o.rows !== undefined) {
        if (!Array.isArray(o.rows)) add('$.ontology.rows', 'a list of { dataset, of, key?, where? }: what each dataset’s rows are');
        else {
          const sources = new Set((Array.isArray(doc.sources) ? doc.sources : []).filter((s: unknown) => isRecord(s) && typeof s.id === 'string').map((s: Record<string, unknown>) => String(s.id).toLowerCase()));
          const values = (v: unknown) => (typeof v === 'string' && v !== '') || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x !== '') && new Set(v).size === v.length);
          const tied = new Set<string>();
          const objectTypes: unknown[] = o.objectTypes;
          o.rows.forEach((r: unknown, i: number) => {
            const at = `$.ontology.rows[${i}]`;
            if (!isRecord(r) || typeof r.dataset !== 'string' || typeof r.of !== 'string') return add(at, '{ dataset, of, key?, where? }: a source or step, the object type its rows are one each of, its own name for the type’s key, and the condition an object meets');
            for (const k of Object.keys(r)) if (!(ROWS_FIELDS as readonly string[]).includes(k)) add(`${at}.${k}`, `${k} isn't a rows entry's setting (${ROWS_FIELDS.join(', ')}): refused rather than ignored`);
            if (!known(r.dataset)) add(`${at}.dataset`, `no source or step ${r.dataset}`);
            else if (tied.has(r.dataset.toLowerCase())) add(`${at}.dataset`, `${r.dataset} has two entries (ids are compared without case): a dataset’s rows are one thing`);
            // An entry on a dataset nothing watches is taken: it says what the rows are, and gives no rule until a watch
            // judges the dataset (a flow is run with no publish block while a step's history is built), but for a
            // published table's key, which its gold gate reconciles by (Q-118). What reads the entry says so ("not
            // watched"), never that it was checked.
            tied.add(r.dataset.toLowerCase());
            const type = objectTypes.find((t: unknown) => isRecord(t) && t.id === r.of) as Record<string, unknown> | undefined;
            // The type's key is what both rules count by: column names, or the plan has nothing the engine can read.
            const keyed = !!type && Array.isArray(type.key) && type.key.length > 0 && type.key.every((c: unknown) => typeof c === 'string' && c !== '');
            if (!type) add(`${at}.of`, `no object type ${r.of}`);
            else if (!keyed) add(`${at}.of`, `${r.of}’s key isn’t a list of column names: a dataset’s rows are counted by the type’s key column`);
            else if (typeof type.dataset === 'string' && known(type.dataset) && !sources.has(type.dataset.toLowerCase())) add(`${at}.of`, `${r.of}'s objects are ${type.dataset}, a step: a dataset’s rows are counted against a type whose objects are a source, which is there before the run`);
            if (r.ids !== undefined && r.ids !== 'exact' && r.ids !== 'loose') add(`${at}.ids`, 'exact, or loose: the same id whatever its case and the spaces around it, for this entry’s scope and one row an object');
            if (r.key !== undefined && (typeof r.key !== 'string' || r.key === '')) add(`${at}.key`, 'this dataset’s own name for the type’s key column');
            // A key of several columns gives no rule yet (ADR 0015 §1), so a name for one of them here would go unused.
            else if (r.key !== undefined && keyed && (type!.key as string[]).length > 1) add(`${at}.key`, `${r.of}’s key is several columns (${(type!.key as string[]).join(', ')}), which gives no rule yet: a name for it here would go unused`);
            if (r.where !== undefined && (!isRecord(r.where) || Object.keys(r.where).length === 0 || Object.keys(r.where).some((c) => c === '') || !Object.values(r.where).every(values))) add(`${at}.where`, '{ column: value | values } over the type’s dataset: every column to hold, a list any of its values (each once); left out, every object');
            else if (isRecord(r.where)) {
              // The engine reads a column's name without case: the same column twice asks for two things of one value.
              const said = new Map<string, string>();
              for (const c of Object.keys(r.where)) {
                const first = said.get(c.toLowerCase());
                if (first !== undefined) add(`${at}.where`, `${first} and ${c} are one column (columns are compared without case): a column’s values are said once`);
                else said.set(c.toLowerCase(), c);
              }
            }
          });
          if (!(isRecord(doc.gates) && Object.keys(doc.gates).length > 0)) add('$.ontology.rows', 'what a dataset’s rows are is a gate’s written check (ADR 0015): the flow has no gate');
        }
      }
      // The dependencies written once (Q-119): each applied wherever its datasets are judged, as a gate cell's needs are.
      if (o.needs !== undefined) {
        if (!Array.isArray(o.needs)) add('$.ontology.needs', 'a list of { id, datasets, from?, key?, when, then, description? }: the dependencies each dataset is judged by');
        else {
          const sources = new Set((Array.isArray(doc.sources) ? doc.sources : []).filter((s: unknown) => isRecord(s) && typeof s.id === 'string').map((s: Record<string, unknown>) => String(s.id).toLowerCase()));
          const values = (v: unknown) => (typeof v === 'string' && v !== '') || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x !== '') && new Set(v).size === v.length);
          const condition = (m: unknown) => isRecord(m) && Object.keys(m).length > 0 && Object.keys(m).every((c) => c !== '') && Object.values(m).every(values) && new Set(Object.keys(m).map((c) => c.toLowerCase())).size === Object.keys(m).length;
          const ids = new Set<string>();
          o.needs.forEach((n: unknown, i: number) => {
            const at = `$.ontology.needs[${i}]`;
            if (!isRecord(n)) return add(at, '{ id, datasets, from?, key?, when, then, description? }: its name, the datasets it applies to, and the condition a row meets and what it then needs');
            for (const k of Object.keys(n)) if (!(NEEDS_FIELDS as readonly string[]).includes(k)) add(`${at}.${k}`, `${k} isn't a needs rule's setting (${NEEDS_FIELDS.join(', ')}): refused rather than ignored`);
            if (typeof n.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(n.id)) add(`${at}.id`, 'its name: lowercase letters, digits and underscores, starting with a letter');
            else if (ids.has(n.id)) add(`${at}.id`, `${n.id} names two rules: each rule has its own name`);
            else ids.add(n.id);
            if (!Array.isArray(n.datasets) || n.datasets.length === 0 || n.datasets.some((d: unknown) => typeof d !== 'string')) add(`${at}.datasets`, 'the sources or steps it applies to, a list');
            else {
              const seen = new Set<string>();
              n.datasets.forEach((d: string, j: number) => {
                if (!known(d)) add(`${at}.datasets[${j}]`, `no source or step ${d}`);
                else if (seen.has(d.toLowerCase())) add(`${at}.datasets[${j}]`, `${d} is listed twice (ids are compared without case)`);
                seen.add(d.toLowerCase());
              });
            }
            if (!condition(n.when)) add(`${at}.when`, '{ column: value | values }: the rows the rule is about, every column to hold, a list any of its values (each once)');
            if (!condition(n.then)) add(`${at}.then`, '{ column: value | values }: what those rows need, every column to hold, a list any of its values (each once)');
            // Read on another dataset's row: a source, there before the run, by a key column both name alike.
            if (n.from !== undefined && (typeof n.from !== 'string' || !sources.has(n.from.toLowerCase()))) add(`${at}.from`, `${String(n.from)} isn't a source: a condition is read on a source’s row, which is there before the run`);
            if ((n.from === undefined) !== (n.key === undefined)) add(`${at}.${n.from === undefined ? 'key' : 'from'}`, 'from and key go together: the source the condition is read on, and the key column its rows share with the dataset’s');
            else if (n.key !== undefined && (typeof n.key !== 'string' || n.key === '')) add(`${at}.key`, 'the key column the source’s rows share with the dataset’s');
            if (n.description !== undefined && typeof n.description !== 'string') add(`${at}.description`, 'why it holds, for people: text');
          });
          if (!(isRecord(doc.gates) && Object.keys(doc.gates).length > 0)) add('$.ontology.needs', 'a dependency is a gate’s written check (ADR 0014 §4): the flow has no gate');
        }
      }
      // A shared ontology is brought in when the flow is read (shared.ts): a document still listing paths wasn't.
      if ((o as Record<string, unknown>).import !== undefined) add('$.ontology.import', 'shared ontologies are brought in when the flow is read (readFlow): this document lists paths it was never read with');
      if (o.shared !== undefined && (!Array.isArray(o.shared) || o.shared.some((x: unknown) => !isRecord(x) || typeof x.file !== 'string' || typeof x.path !== 'string' || !known(x.file) || !Array.isArray(x.columns) || x.columns.some((c: unknown) => typeof c !== 'string')))) add('$.ontology.shared', 'where each shared part came from: [{ file: a source, path, columns }]');
      // Where the estates' ontologies it took came from (ADR 0026 §8): each by its name, its path and its hash.
      if (o.estate !== undefined && (!Array.isArray(o.estate) || o.estate.some((x: unknown) => !isRecord(x) || typeof x.name !== 'string' || x.name === '' || typeof x.path !== 'string' || x.path === '' || typeof x.hash !== 'string' || !/^[0-9a-f]{64}$/.test(x.hash)))) add('$.ontology.estate', 'where each estate’s ontology came from: [{ name, path, hash }]');
      // The threshold each dataset is judged by (Q-207): a source's or a step's, a share of the day's rows.
      if (o.overwhelming !== undefined) {
        if (!isRecord(o.overwhelming)) add('$.ontology.overwhelming', 'the share of a day’s rows a learned check’s alert must move to hold the day, by dataset: { dataset: 0.25 }');
        else for (const [d, v] of Object.entries(o.overwhelming)) {
          const named = (list: unknown) => (Array.isArray(list) ? list : []).some((x: unknown) => isRecord(x) && typeof x.id === 'string' && x.id.toLowerCase() === d.toLowerCase());
          if (!named(doc.sources) && !named(doc.steps)) add(`$.ontology.overwhelming.${d}`, `no source or step ${d}`);
          if (!isShareOfRows(v)) add(`$.ontology.overwhelming.${d}`, 'a number above 0, at most 1 (a quarter is 0.25)');
        }
      }
      // The fixes each file allows (rules.ts): a source's own, each one of the vocabulary, each once.
      if (o.fixes !== undefined) {
        if (!isRecord(o.fixes)) add('$.ontology.fixes', 'the fixes each file allows: { file: [forward, backward, impute, part, replace] }');
        else for (const [f, list] of Object.entries(o.fixes)) {
          if (!(Array.isArray(doc.sources) ? doc.sources : []).some((s: unknown) => isRecord(s) && typeof s.id === 'string' && s.id.toLowerCase() === f.toLowerCase())) add(`$.ontology.fixes.${f}`, `no source ${f}`);
          if (!Array.isArray(list) || list.some((x) => !(FIX_KINDS as readonly unknown[]).includes(x)) || new Set(list).size !== list.length) add(`$.ontology.fixes.${f}`, `${FIX_KINDS.join(', ')}, each once`);
        }
      }
      // Rules set on a file's columns (rules.ts): each a source's own, enforced by its check step.
      if (o.rules !== undefined) for (const [path, message] of rulesIssues(doc, o.rules)) add(path, message);
      // The columns of a file the flow doesn't take (ADR 0027 §4): set aside by name, a source's own.
      if (o.aside !== undefined) {
        const sourceIds = (Array.isArray(doc.sources) ? doc.sources : []).flatMap((x: unknown) => (isRecord(x) && typeof x.id === 'string' ? [x.id.toLowerCase()] : []));
        if (doc.smaltfl !== 5) add('$.ontology.aside', 'the columns set aside are a format-5 document’s (the ontology first)');
        else if (!isRecord(o.aside)) add('$.ontology.aside', 'the columns each file has that the flow doesn’t take: { file: [column, …] }');
        else for (const [f, list] of Object.entries(o.aside)) {
          if (!sourceIds.includes(f.toLowerCase())) add(`$.ontology.aside.${f}`, `no source ${f}: a column is set aside in a file`);
          if (!Array.isArray(list) || list.length === 0 || list.some((x) => typeof x !== 'string' || x === '') || new Set(list.map((x) => String(x).toLowerCase())).size !== list.length) add(`$.ontology.aside.${f}`, 'its columns set aside, each once; absent when there are none');
        }
      }
    }
  }
  // Ontology first (format 5, ADR 0027 §4, Q-254): every source says what one row of it is, by a rows entry, a type
  // whose objects are its rows, or a noun; and a closed list or column is enforced, by the check step that reads its file.
  if (doc.smaltfl === 5 && documentFormat(doc) === 4) {
    const o = isRecord(doc.ontology) ? doc.ontology : {};
    const lowerOf = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : '');
    const said = new Set<string>([
      ...(Array.isArray(o.rows) ? o.rows : []).flatMap((r: unknown) => (isRecord(r) ? [lowerOf(r.dataset)] : [])),
      ...(Array.isArray(o.objectTypes) ? o.objectTypes : []).flatMap((t: unknown) => (isRecord(t) ? [lowerOf(t.dataset)] : [])),
      ...(isRecord(o.nouns) ? Object.keys(o.nouns).map((k) => k.toLowerCase()) : []),
    ]);
    // A derived document's donor (ADR 0009 amendment 1) is its source's file of another day: its rows are that source's.
    const DONOR = '_donor';
    const rowSaid = (id: string) => said.has(id) || (id.endsWith(DONOR) && said.has(id.slice(0, -DONOR.length)));
    (Array.isArray(doc.sources) ? doc.sources : []).forEach((x: unknown, i: number) => {
      if (isRecord(x) && typeof x.id === 'string' && !rowSaid(x.id.toLowerCase())) add(`$.sources[${i}]`, `the ontology doesn’t say what one row of ${x.id} is: a rows entry, a type whose objects are its rows, or a noun (format 5 puts the ontology first)`);
    });
    const rulesDoc = { sources: (Array.isArray(doc.sources) ? doc.sources : []) as FlowDocument['sources'], steps: (Array.isArray(doc.steps) ? doc.steps : []) as StepDef[] };
    (Array.isArray(o.rules) ? o.rules : []).forEach((r: unknown, i: number) => {
      if (isRecord(r) && r.kind === 'closed' && typeof r.file === 'string' && !checkStepOf(rulesDoc, r.file)) add(`$.ontology.rules[${i}]`, `no check step reads ${r.file}: a closed list is enforced where its file comes into the flow`);
    });
  }
  const p = doc.policies;
  if (p !== undefined) {
    if (!isRecord(p) || !Array.isArray(p.principals) || !Array.isArray(p.rules)) return add('$.policies', '{ principals, rules }');
    const who = new Set<string>(['*']);
    p.principals.forEach((x: unknown, i: number) => {
      if (!isRecord(x) || typeof x.id !== 'string' || typeof x.name !== 'string') return add(`$.policies.principals[${i}]`, '{ id, name }');
      if (who.has(x.id)) add(`$.policies.principals[${i}].id`, `duplicate person ${x.id}`);
      who.add(x.id);
    });
    if (p.groups !== undefined) (Array.isArray(p.groups) ? p.groups : []).forEach((g: unknown) => isRecord(g) && typeof g.id === 'string' && who.add(g.id));
    p.rules.forEach((r: unknown, i: number) => {
      const at = `$.policies.rules[${i}]`;
      if (!isRecord(r) || !['row', 'column', 'action'].includes(String(r.kind)) || !Array.isArray(r.for)) return add(at, '{ id, kind: row, column or action, name, for }');
      r.for.forEach((x: unknown, j: number) => !who.has(String(x)) && add(`${at}.for[${j}]`, `no person or group ${String(x)}`));
      if (r.kind === 'row' && (!Array.isArray(r.columns) || r.columns.length === 0 || typeof r.attribute !== 'string')) add(at, 'a row rule needs columns and an attribute');
      if (r.kind === 'column' && !Array.isArray(r.remove)) add(at, 'a column rule needs remove');
      if (r.kind === 'action') {
        // smaltfl's own action, deciding a held day (ADR 0009 §8), is not an ontology action type: an older build
        // rejects it as unknown, and so refuses the document.
        if (r.action === DECIDE) {
          if (r.scope !== undefined) add(`${at}.scope`, `${DECIDE} has no rows to scope: its rule lists the options it allows in may`);
          if (r.may !== undefined && (!Array.isArray(r.may) || r.may.length === 0 || r.may.some((m: unknown) => !(DECIDE_OPTIONS as readonly unknown[]).includes(m)) || new Set(r.may).size !== r.may.length))
            add(`${at}.may`, `a list of ${DECIDE_OPTIONS.join(', ')}, each once`);
        } else {
          if (typeof r.action === 'string' && r.action.startsWith('smaltfl:')) add(`${at}.action`, `${r.action} is not one of smaltfl's actions (${DECIDE})`);
          else if (!(isRecord(o) && Array.isArray(o.actionTypes) && o.actionTypes.some((a: unknown) => isRecord(a) && a.id === r.action))) add(`${at}.action`, `no action type ${String(r.action)}`);
          if (r.may !== undefined) add(`${at}.may`, `may is for ${DECIDE}`);
        }
      }
    });
  }
}

function validateConfig(s: Record<string, unknown>, at: string, add: (path: string, message: string) => void): void {
  const sqlText = (v: unknown, path: string) => {
    if (typeof v !== 'string' || v.trim() === '') return add(path, 'SQL text');
    try {
      tokens(v);
    } catch (e) {
      add(path, (e as SqlTextError).message);
    }
  };
  const names = new Set<string>();
  const name = (v: unknown, path: string) => {
    if (typeof v !== 'string' || v === '') return add(path, 'a column name');
    if (names.has(v.toLowerCase())) add(path, `duplicate column ${v}`);
    names.add(v.toLowerCase());
  };
  const namedExprs = (list: unknown, path: string, allowBare: boolean) => {
    if (!Array.isArray(list)) return add(path, 'an array');
    list.forEach((c: unknown, j: number) => {
      if (allowBare && typeof c === 'string') return name(c, `${path}[${j}]`);
      if (!isRecord(c)) return add(`${path}[${j}]`, allowBare ? 'a column name or { name, expr }' : '{ name, expr }');
      name(c.name, `${path}[${j}].name`);
      sqlText(c.expr, `${path}[${j}].expr`);
    });
  };
  switch (s.kind) {
    case 'sql':
      sqlText(s.sql, `${at}.sql`);
      break;
    case 'filter':
      sqlText(s.where, `${at}.where`);
      break;
    case 'formula':
      namedExprs(s.columns, `${at}.columns`, false);
      if (Array.isArray(s.columns) && s.columns.length === 0) add(`${at}.columns`, 'at least one column');
      break;
    case 'select':
      namedExprs(s.columns, `${at}.columns`, true);
      if (Array.isArray(s.columns) && s.columns.length === 0) add(`${at}.columns`, 'at least one column');
      break;
    case 'join':
      if (s.how !== 'inner' && s.how !== 'left') add(`${at}.how`, 'inner or left');
      if (!Array.isArray(s.on) || s.on.length === 0) add(`${at}.on`, 'at least one { left, right } pair');
      else
        s.on.forEach((p: unknown, j: number) => {
          if (!isRecord(p) || typeof p.left !== 'string' || typeof p.right !== 'string') add(`${at}.on[${j}]`, '{ left, right } column names');
        });
      if (!Array.isArray(s.columns)) add(`${at}.columns`, 'an array');
      else
        s.columns.forEach((c: unknown, j: number) => {
          if (typeof c === 'string') return name(c, `${at}.columns[${j}]`);
          if (!isRecord(c) || typeof c.column !== 'string') return add(`${at}.columns[${j}]`, 'a column name or { name, column }');
          name(c.name, `${at}.columns[${j}].name`);
        });
      break;
    case 'aggregate':
      namedExprs(s.groupBy, `${at}.groupBy`, true);
      namedExprs(s.measures, `${at}.measures`, false);
      if (Array.isArray(s.groupBy) && Array.isArray(s.measures) && s.groupBy.length + s.measures.length === 0) add(at, 'at least one column');
      break;
    case 'expectations': {
      if (!Array.isArray(s.rules) || s.rules.length === 0) add(`${at}.rules`, 'at least one rule');
      else {
        const rules = new Set<string>();
        s.rules.forEach((r: unknown, j: number) => {
          const rat = `${at}.rules[${j}]`;
          if (!isRecord(r)) return add(rat, '{ name, check, onFail }');
          if (typeof r.name !== 'string' || r.name === '') add(`${rat}.name`, 'a name');
          else if (rules.has(r.name)) add(`${rat}.name`, `duplicate rule ${r.name}`);
          else rules.add(r.name);
          sqlText(r.check, `${rat}.check`);
          if (r.onFail !== 'warn' && r.onFail !== 'drop' && r.onFail !== 'fail') add(`${rat}.onFail`, 'warn, drop or fail');
          if (r.description !== undefined && typeof r.description !== 'string') add(`${rat}.description`, 'text');
        });
      }
      if (s.maxDropped !== undefined && (typeof s.maxDropped !== 'number' || !(s.maxDropped >= 0 && s.maxDropped <= 1))) add(`${at}.maxDropped`, 'a fraction from 0 to 1');
      if (s.ontology !== undefined && (!isRecord(s.ontology) || Object.entries(s.ontology).some(([k, v]) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(k) || (v !== 'on' && v !== 'off')))) add(`${at}.ontology`, "the ontology's rules of the file it reads, each by its name: 'on' or 'off'");
      break;
    }
    case 'fill': {
      if (s.time !== undefined && (typeof s.time !== 'string' || !COLUMN.test(s.time))) add(`${at}.time`, 'the column an hours cause is of: a letter or _, then letters, digits or _; none for a file with no time of day, filled whole');
      if (!Array.isArray(s.shift)) add(`${at}.shift`, 'the columns a donor’s rows are moved by, a list');
      else {
        const seen = new Set<string>();
        s.shift.forEach((c: unknown, j: number) => {
          if (typeof c !== 'string' || !COLUMN.test(c)) add(`${at}.shift[${j}]`, 'a column: a letter or _, then letters, digits or _');
          else if (seen.has(c.toLowerCase())) add(`${at}.shift[${j}]`, `${c} is listed twice`);
          else seen.add(c.toLowerCase());
        });
      }
      const has = s.missing !== undefined;
      if (has) {
        // A fill with no time column names no hours: it fills its day whole.
        const problem = missingProblem(s.missing, s.time ?? null);
        if (problem) add(`${at}.missing`, problem);
      }
      if (s.from !== undefined && s.from !== null && (typeof s.from !== 'string' || !(DAY.test(s.from) || SLOT_ID.test(s.from)))) add(`${at}.from`, 'the donor’s day, YYYY-MM-DD (or its slot, YYYY-MM-DDTHH, ADR 0010 §7), or null for the part that arrived alone');
      if (has !== (s.from !== undefined)) add(`${at}.${has ? 'from' : 'missing'}`, has ? 'a missing part needs from: the donor’s day, or null for the part that arrived alone' : 'from needs the missing part it fills');
      break;
    }
  }
}

/** Why a value isn't a missing part (Missing), or null when it is. `time` is the fill step's time column, null where it
 * has none (no hours then), undefined where it isn't known. */
export function missingProblem(m: unknown, time?: unknown): string | null {
  if (!isRecord(m)) return '{ time, hours: [from, to] }, { column, value, rest } or { all: true }';
  if ('all' in m) return Object.keys(m).length === 1 && m.all === true ? null : 'the whole day is { all: true }, nothing else';
  if ('hours' in m || 'time' in m) {
    if (time === null) return 'a fill with no time column names no hours: it fills its day whole, { all: true }';
    if (Object.keys(m).some((k) => k !== 'time' && k !== 'hours')) return 'hours are { time, hours: [from, to] }, nothing else';
    const h = m.hours;
    if (!Array.isArray(h) || h.length !== 2 || !h.every((x) => Number.isInteger(x)) || !(0 <= h[0] && h[0] <= h[1] && h[1] <= 23)) return 'hours are [from, to], whole hours with 0 ≤ from ≤ to ≤ 23';
    if (typeof m.time !== 'string' || (time !== undefined && m.time !== time)) return `the hours are of the step's time column${typeof time === 'string' ? `, ${time}` : ''}`;
    return null;
  }
  if (Object.keys(m).some((k) => k !== 'column' && k !== 'value' && k !== 'rest')) return 'a part is { column, value, rest }, nothing else';
  if (typeof m.column !== 'string' || !COLUMN.test(m.column)) return 'a part names its column: a letter or _, then letters, digits or _';
  if (!('value' in m) || !(m.value === null || typeof m.value === 'string' || typeof m.value === 'boolean' || (typeof m.value === 'number' && Number.isFinite(m.value)))) return 'a part names its value: text, a number, true, false or null';
  if (m.rest !== undefined && typeof m.rest !== 'boolean') return 'rest is true or false';
  return null;
}

/** The steps' ids in a cycle, if they have one. */
function findCycle(steps: readonly StepDef[]): string[] | null {
  const byId = new Map(steps.map((s) => [s.id.toLowerCase(), s]));
  const state = new Map<string, 'open' | 'done'>();
  const path: string[] = [];
  const visit = (id: string): string[] | null => {
    const key = id.toLowerCase();
    const s = byId.get(key);
    if (!s || state.get(key) === 'done') return null;
    if (state.get(key) === 'open') return [...path.slice(path.findIndex((p) => p.toLowerCase() === key)), id];
    state.set(key, 'open');
    path.push(s.id);
    for (const input of s.inputs) {
      const found = visit(input);
      if (found) return found;
    }
    path.pop();
    state.set(key, 'done');
    return null;
  };
  for (const s of steps) {
    const found = visit(s.id);
    if (found) return found;
  }
  return null;
}

function fits(value: unknown, type: ParamType): boolean {
  if (type === 'text') return typeof value === 'string';
  if (type === 'integer') return typeof value === 'bigint' || (typeof value === 'number' && Number.isSafeInteger(value));
  return typeof value === 'number' && Number.isFinite(value);
}

/** A share of a day's rows, as a threshold takes it (Q-207): above 0, at most 1. */
function isShareOfRows(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * The document with `to` read in place of `from` by every step that read `from` (but `except`): in its inputs, and
 * where its SQL names it.
 */
export function rewire(doc: FlowDocument, from: string, to: string, except?: string): FlowDocument {
  return {
    ...doc,
    steps: doc.steps.map((st) => {
      if (st.id === except || !st.inputs.some((i) => sameId(i, from))) return st;
      const inputs = st.inputs.map((i) => (sameId(i, from) ? to : i));
      return st.kind === 'sql' ? { ...st, inputs, sql: renameIdentifier(st.sql, from, to) } : { ...st, inputs };
    }),
  };
}

/**
 * The document with a step put between `id` and what reads it, such as a box of checks that drops rows: everything
 * that read `id` reads the new step instead, and the new step joins `id`'s section, just after it.
 */
export function insertAfter(doc: FlowDocument, at: string, step: StepDef): FlowDocument {
  // A watched source that may be filled is read through its fill step: a box after the source goes after that (C7).
  const id = fillStepOf(doc, at)?.id ?? at;
  if (id !== at) step = rewire({ ...doc, steps: [step] }, at, id).steps[0]!;
  const rewired = rewire(doc, id, step.id);
  const steps = [...rewired.steps];
  steps.splice(steps.findIndex((s) => s.id === id) + 1, 0, step);
  const groups = rewired.groups?.map((g) => {
    const k = g.steps.indexOf(id);
    return k < 0 ? g : { ...g, steps: [...g.steps.slice(0, k + 1), step.id, ...g.steps.slice(k + 1)] };
  });
  return { ...rewired, steps, groups };
}

/**
 * The document without a step: what read it reads its one input instead. Undefined when that can't be done (it reads
 * more than one input, and something reads it), and for a step that changes columns, since what reads it may need them.
 */
export function takeOut(doc: FlowDocument, id: string): FlowDocument | undefined {
  const st = doc.steps.find((s) => s.id === id);
  if (!st) return undefined;
  const read = doc.steps.some((s) => s.inputs.some((i) => sameId(i, id)));
  if (read && (st.inputs.length !== 1 || (st.kind !== 'expectations' && st.kind !== 'filter'))) return undefined;
  const rewired = read ? rewire(doc, id, st.inputs[0]!) : doc;
  return {
    ...rewired,
    steps: rewired.steps.filter((s) => s.id !== id),
    groups: rewired.groups?.map((g) => ({ ...g, steps: g.steps.filter((s) => s !== id) })),
    // A profile of the step goes with it.
    profiles: rewired.profiles?.filter((p) => !sameId(p.of, id)),
    layout: rewired.layout && Object.fromEntries(Object.entries(rewired.layout).filter(([k]) => k !== id && !rewired.profiles?.some((p) => p.id === k && sameId(p.of, id)))),
  };
}

/** A source's fill step (ADR 0009 amendment 1 S1): the step of kind `fill` whose first input it is, if any. */
export function fillStepOf(doc: Pick<FlowDocument, 'steps'>, source: string): FillStep | undefined {
  return doc.steps.find((s): s is FillStep => s.kind === 'fill' && s.inputs.length > 0 && sameId(s.inputs[0]!, source));
}

/**
 * The source an input stands for, read through fill steps (ADR 0009 amendment 1 S1, C7): a fill step passes its source's
 * rows through on any day it fills nothing, so what reads it reads that source. A fill step's first input, resolved the
 * same way; undefined for any other step; and an id no step has, as it is (in a valid document, a source's). The kind
 * is compared as text, so this reads documents of builds that know the step.
 */
export function sourceOf(doc: Pick<FlowDocument, 'steps'>, id: string): string | undefined {
  let at = id;
  for (let hops = 0; hops <= doc.steps.length; hops++) {
    const st = doc.steps.find((s) => s.id === at);
    if (!st) return at;
    const kind: string = st.kind;
    if (kind !== 'fill' || st.inputs.length === 0) return undefined;
    at = st.inputs[0]!;
  }
  return undefined;
}

/** The document without display-only fields (its layout, groups, profiles, cells and outline): what the flow hash covers. */
export function withoutDisplay(doc: FlowDocument): Omit<FlowDocument, 'layout' | 'groups' | 'profiles' | 'cells' | 'outline'> {
  const { layout: _layout, groups: _groups, profiles: _profiles, cells: _cells, outline: _outline, ...rest } = doc;
  return rest;
}
