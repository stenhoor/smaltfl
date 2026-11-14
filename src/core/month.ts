/**
 * The recorded month (ADR 0021 §6). The build runs a flow's month in order, as the page runs a day, and records each run
 * as a `run` entry of the record's own shape (log/1), at the story's time: when the day's files arrived. The page reads
 * the file as its record's first layer, under what this browser records (`layered`), so its tails, the days left out of
 * learning, the pauses and what readers see come from the recorded days as they do from days run here; and it draws
 * the month from the entries alone, without running anything. A day as known on a moment (§1, §7) reads the entries
 * recorded by then (`knownOn`).
 *
 * What a run says of its day comes from its entry: held (its holds), refused (a source the engine couldn't read), and
 * otherwise what the claims told of each watched dataset. A run the page makes again of a recorded day is checked
 * against the recorded one (`checkAgainst`): the same plan, the same content in every stored node and the same holds.
 * The manifests' other fields (when a file was pulled in, the run's id) are this browser's own and aren't compared.
 */
import type { JSONValue, LogEntry } from './log.js';
import type { RunManifest } from './manifest.js';
import type { Hold } from './hold.js';

export const MONTH_FORMAT = 'smaltfl-month/1';

/** A day's product score, where the data list names a posture product (ADR 0021 §3): what the month's trend band draws. */
export interface PostureMark {
  score: number | null;
  coverage: number | null;
}

/** The recorded month: the build's entries, each run's manifest by hash, the story's now, and the product's scores. */
export interface MonthFile {
  format: typeof MONTH_FORMAT;
  /** The flow it was recorded for, and the commit of the build that recorded it. */
  flow: string;
  build: string;
  /** The story's now: what "as known on now" means for the recorded days, after the last entry. */
  now: string;
  /** The build's entries, log/1-shaped, in the order recorded (by `at`); their `by.as` is `build`. */
  entries: LogEntry[];
  manifests: Record<string, RunManifest>;
  /** Each published day's product score, by day: a day whose roll-up wasn't published has none. */
  posture?: Record<string, PostureMark>;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A recorded month, checked to be one: anything else is refused, never half taken. */
export function isMonthFile(v: unknown): v is MonthFile {
  if (!isRecord(v) || v.format !== MONTH_FORMAT || typeof v.flow !== 'string' || typeof v.build !== 'string' || typeof v.now !== 'string') return false;
  if (!Array.isArray(v.entries) || !isRecord(v.manifests)) return false;
  if (v.posture !== undefined && !isRecord(v.posture)) return false;
  return v.entries.every((e) => isRecord(e) && typeof e.kind === 'string' && typeof e.at === 'string' && typeof e.seq === 'number' && isRecord(e.by) && typeof (e.by as Record<string, unknown>).as === 'string');
}

/** The fields of a decision or a release that cite another entry by its seq: the decision a release applies (and, by
 * load, every one), the standing decision either applies, the release a withdrawal takes back. */
const CITES = ['decision', 'under', 'withdraws'] as const;

/**
 * The build's entries as the record's first layer: renumbered below every entry this browser records (its own `seq`s
 * start at 0), in the order recorded, so no two entries share a number and the recorded ones sort first. What an entry
 * cites by seq (an amendment, a release's decisions, a standing decision) is renumbered with it.
 */
export function layered(file: Pick<MonthFile, 'entries'>): LogEntry[] {
  const n = file.entries.length;
  const shift = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v - n : v);
  return file.entries.map((e, i) => {
    let about = e.about;
    if ((e.kind === 'decide' || e.kind === 'release') && isRecord(about)) {
      const a: Record<string, unknown> = { ...about };
      for (const k of CITES) if (k in a) a[k] = shift(a[k]);
      if (Array.isArray(a.decisions)) a.decisions = a.decisions.map(shift);
      about = a as unknown as JSONValue;
    }
    return { ...e, seq: i - n, amends: e.amends === null ? null : e.amends - n, about };
  });
}

/** The entries recorded by a moment: as known on it. Without one, all of them. */
export const knownOn = <E extends { at: string }>(entries: readonly E[], at?: string | null): E[] => (at ? entries.filter((e) => e.at <= at) : [...entries]);

/** As known at the end of a day (UTC): what "as known on Mar 15" reads. */
export const endOfDay = (day: string): string => `${day}T23:59:59.999Z`;

/** What a run entry says: the fields the page's record writes (main.ts `recordRun`) that the month reads. */
export interface RunAbout {
  run?: string | null;
  manifest?: string;
  day?: string | null;
  load?: string | null;
  outcome?: 'ok' | 'held' | 'failed' | 'derived' | 'restated';
  holds?: Hold[];
  waiting?: string[];
  claims?: ClaimLike[];
  error?: string | null;
}

/** What the month reads of a claim: whose, what became of it, and its head. */
export interface ClaimLike {
  source?: string;
  state?: string;
  head?: string;
}

const aboutOf = (e: Pick<LogEntry, 'about'>): RunAbout => (isRecord(e.about) ? (e.about as unknown as RunAbout) : {});

/** A run entry's day: its period's value, else the load the page had pinned. */
export function runDay(e: Pick<LogEntry, 'kind' | 'about'>): string | null {
  if (e.kind !== 'run') return null;
  const a = aboutOf(e);
  return typeof a.day === 'string' ? a.day : typeof a.load === 'string' ? a.load : null;
}

/**
 * A restatement's record entry (`restate`, ADR 0021 §5, Q-190): the change sets it restates the days under, the day they
 * take effect from, the days it restates (each by its restated run's manifest, and whether readers get its outputs:
 * `restatedOutcome`'s `passes`), the days left as they were (unticked), and those whose outcome came out the same
 * (noted, not decided). Its reason is the entry's.
 */
export interface RestateAbout {
  changes: string[];
  from: string;
  days: { day: string; manifest: string; passes: boolean }[];
  kept: { day: string; manifest: string }[];
  same: { day: string; manifest: string }[];
}

/** Whether an entry's `about` is a restatement's. */
export function isRestate(about: unknown): about is RestateAbout {
  const a = about as Partial<RestateAbout> | null;
  return isRecord(a) && Array.isArray(a.changes) && typeof a.from === 'string' && Array.isArray(a.days) && Array.isArray(a.kept) && Array.isArray(a.same)
    && a.days.every((d) => isRecord(d) && typeof d.day === 'string' && typeof d.manifest === 'string' && typeof d.passes === 'boolean')
    && [...a.kept, ...a.same].every((d) => isRecord(d) && typeof d.day === 'string' && typeof d.manifest === 'string');
}

/** The restated runs a restatement made what readers got, by manifest, with whether each passed. */
export function restatedRuns(entries: readonly Pick<LogEntry, 'kind' | 'about'>[]): Map<string, boolean> {
  const out = new Map<string, boolean>();
  for (const e of entries) if (e.kind === 'restate' && isRestate(e.about)) for (const d of e.about.days) out.set(d.manifest, d.passes);
  return out;
}

/** What held a run as one comparable text, the hold said as it was: the same check or claim, on the same load, saying
 * the same thing. */
const holdSaid = (h: Pick<Hold, 'by' | 'origin' | 'said' | 'load'>): string => `${h.by}|${h.origin.toLowerCase()}|${h.load ? `${h.load.source.toLowerCase()}|${h.load.slot}|${h.load.sha256}` : ''}|${h.said}`;

/** A run's own holds: what its data and rules held it by, not the hold a later delivery or a restated run always has. */
export const ownHolds = <H extends Pick<Hold, 'by'>>(holds: readonly H[]): H[] => holds.filter((h) => h.by !== 'restated' && h.by !== 'correction');

/** A day's outcome under rules changed since, against the run readers got (`restatedOutcome`). */
export interface RestatedOutcome {
  /** Whether readers would get the restated run's outputs. */
  passes: boolean;
  /** Published by the decision that published the run readers got: held by nothing that run wasn't held by. */
  carried: boolean;
  /** Whether the day's outcome would change: published or not, and, where both publish, any output's content. */
  changed: boolean;
  /** How many outputs' content differs, where both say theirs (null: one doesn't). */
  differ: number | null;
  /** What holds the restated run that didn't hold the run readers got, in the order held. */
  fresh: Hold[];
}

/**
 * A day run again under rules changed since, against the run readers got (ADR 0021 §5, Q-190). Readers would get the
 * restated run's outputs where it holds nothing, or where the run readers got was published by a decision although
 * held and the restated run is held by nothing else: the same holds, saying the same, are what that decision decided,
 * so it carries (a hold that says anything new is decided again). The day's outcome would change where it would be
 * published and wasn't, or the other way round, or where both publish and any output's content differs; a day whose
 * outcome doesn't change is noted, not decided again. A later delivery's and a restated run's own holds are never the
 * data's, and aren't compared.
 */
export function restatedOutcome(got: { published: boolean; holds: readonly Hold[]; contents: Readonly<Record<string, string>> | null }, run: { holds: readonly Hold[]; contents: Readonly<Record<string, string>> | null }): RestatedOutcome {
  const own = ownHolds(run.holds);
  const before = ownHolds(got.holds);
  const known = new Set(before.map(holdSaid));
  const fresh = own.filter((h) => !known.has(holdSaid(h)));
  const carried = got.published && before.length > 0 && own.length > 0 && fresh.length === 0;
  const passes = own.length === 0 || carried;
  const a = got.contents;
  const b = run.contents;
  const differ = a && b ? [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((n) => a[n] !== b[n]).length : null;
  return { passes, carried, changed: got.published !== passes || (passes && differ !== 0), differ, fresh };
}

/**
 * Every day's runs, in the order recorded: a derived run (a fill) isn't one of its day's runs, nor is a day run again
 * under rules changed since (ADR 0021 §5) until a restatement makes it what readers got. Then it is the day's run as
 * the restatement left it: published where it passed with nothing holding it; held where readers got it by the
 * decision that published the run it restated (`carried`), as that run was; held otherwise (its own restated hold
 * aside).
 */
export function runsByDay<E extends Pick<LogEntry, 'kind' | 'about' | 'at'>>(entries: readonly E[]): Map<string, E[]> {
  const out = new Map<string, E[]>();
  const restated = restatedRuns(entries);
  for (const e of entries) {
    const day = runDay(e);
    const a = aboutOf(e);
    if (!day || a.outcome === 'derived') continue;
    let run = e;
    if (a.outcome === 'restated') {
      const passes = typeof a.manifest === 'string' ? restated.get(a.manifest) : undefined;
      if (passes === undefined) continue;
      const holds = (a.holds ?? []).filter((h) => h.by !== 'restated');
      run = { ...e, about: { ...(e.about as object), outcome: passes && !holds.length ? 'ok' : 'held', holds } as unknown as JSONValue };
    }
    out.set(day, [...(out.get(day) ?? []), run]);
  }
  return out;
}

/**
 * What became of a day (ADR 0021 §3), never an average: published, published with something unusual, not judged (the
 * dataset the views follow had nothing to compare with), paused (held, waiting), the run failed; and, as known on a
 * moment, not arrived yet; or not run, where nothing recorded it.
 */
export type DayState = 'published' | 'unusual' | 'unlearned' | 'paused' | 'failed' | 'notArrived' | 'notRun';

const WRONG = new Set(['wrong', 'unusual', 'refused']);

/**
 * What a run says of its day, and the words that lead it: a hold's (its dataset and what it said, as the status line
 * says it); else what the dataset the views follow was told (`judged`), when it wasn't calm; else the first other
 * watched dataset told something unusual, named; else none (a normal day).
 */
export function stateOfRun(about: RunAbout, judged?: string | null): { state: DayState; headline: string | null } {
  if (about.outcome === 'failed') return { state: 'failed', headline: about.error ?? null };
  const holds = about.holds ?? [];
  if (about.outcome === 'held' || holds.length) {
    const h = holds[0];
    return { state: 'paused', headline: h ? `${h.origin}: ${h.said}` : null };
  }
  const claims = about.claims ?? [];
  const own = judged ? claims.find((c) => c.source?.toLowerCase() === judged.toLowerCase()) : undefined;
  if (own && own.state && WRONG.has(own.state)) return { state: 'unusual', headline: own.head ?? null };
  const other = claims.find((c) => c !== own && c.state && WRONG.has(c.state));
  if (other) return { state: 'unusual', headline: other.head ? `${other.source}: ${other.head}` : null };
  if (own?.state === 'unlearned') return { state: 'unlearned', headline: own.head ?? null };
  return { state: 'published', headline: null };
}

/** A day of the month as known on a moment: what became of it, its words, when it first arrived, its runs, by whom. */
export interface MonthDay {
  day: string;
  state: DayState;
  headline: string | null;
  /** When its first run was recorded, as known then; null when none was. */
  at: string | null;
  /** How many runs it has, as known then. */
  runs: number;
  /** How many versions it has, as known then (ADR 0021 §2): its first files, and each later set of files sent for it;
   * a run again on the same files isn't another version. */
  versions: number;
  /** The latest run's manifest hash, and who recorded it: the build, or this browser. */
  manifest: string | null;
  by: 'build' | 'here' | null;
}

/**
 * The month (ADR 0021 §3): each listed day as known on a moment, by its latest run then. A day whose first run was
 * recorded after the moment hasn't arrived; a listed day nothing recorded wasn't run. Entries the build recorded have
 * `by.as` `build`; any other is this browser's.
 */
export function monthOf(days: readonly string[], entries: readonly Pick<LogEntry, 'kind' | 'about' | 'at' | 'by'>[], o: { at?: string | null; judged?: string | null } = {}): MonthDay[] {
  const all = runsByDay(entries);
  const known = runsByDay(knownOn(entries, o.at));
  return days.map((day): MonthDay => {
    const runs = known.get(day) ?? [];
    const last = runs.at(-1);
    if (!last) return { day, state: all.has(day) ? 'notArrived' : 'notRun', headline: null, at: null, runs: 0, versions: 0, manifest: null, by: null };
    const about = aboutOf(last);
    const { state, headline } = stateOfRun(about, o.judged);
    return { day, state, headline, at: runs[0]!.at, runs: runs.length, versions: versionsOf(runs).length, manifest: typeof about.manifest === 'string' ? about.manifest : null, by: last.by.as === 'build' ? 'build' : 'here' };
  });
}

/** The files a run read, by source and sha256, in one string: what tells one version of a day from another. */
const filesKey = (e: Pick<LogEntry, 'about'>): string => {
  const files = (aboutOf(e) as { inputs?: { files?: Record<string, string> } }).inputs?.files ?? {};
  return JSON.stringify(Object.keys(files).sort().map((k) => [k, files[k]]));
};

/**
 * A day's versions (ADR 0021 §2), in the order they first ran: each set of files run for it, with every run of it. The
 * first is its first files; each later one a set of files sent again for it (a run with `correction`), or a run here on
 * other files. A run that failed, with no files, is a version of none.
 */
export function versionsOf<E extends Pick<LogEntry, 'about'>>(runs: readonly E[]): { files: string; runs: E[] }[] {
  const out: { files: string; runs: E[] }[] = [];
  for (const e of runs) {
    if (aboutOf(e).outcome === 'failed') continue;
    const k = filesKey(e);
    const v = out.find((x) => x.files === k);
    if (v) v.runs.push(e);
    else out.push({ files: k, runs: [e] });
  }
  return out;
}

/** One row of the grid: a notebook (or a group) and the datasets it holds, by origin. */
export interface GridRow {
  id: string;
  label: string;
  origins: string[];
}

/** A file's or step's state on a day: refused, held, unusual, not judged, fine, or not built that day. */
export type CellState = 'refused' | 'held' | 'unusual' | 'unlearned' | 'ok' | 'absent';
const CELL_RANK: Record<CellState, number> = { refused: 0, held: 1, unusual: 2, unlearned: 3, ok: 4, absent: 5 };

/** The worse of two cells: a row is as bad as its worst dataset, and absent only where all of them are. */
export const worseCell = (a: CellState, b: CellState): CellState => (CELL_RANK[a] <= CELL_RANK[b] ? a : b);

/**
 * What a run says of some datasets on its day (ADR 0021 §3, the grid): refused where the engine couldn't read one; held
 * where a hold names one; unusual or not judged where its claim said so; fine where the run built or reused it; absent
 * where the run built none of them. A file sent again later is held for a decision whatever it holds (Q-183): that says
 * nothing of its data, so it doesn't make its cell held.
 */
export function cellOf(about: RunAbout, manifest: Pick<RunManifest, 'nodes'> | null | undefined, origins: readonly string[]): CellState {
  const mine = new Set(origins.map((o) => o.toLowerCase()));
  const has = (o: string | undefined) => !!o && mine.has(o.toLowerCase());
  const nodes = (manifest?.nodes ?? []).filter((n) => has(n.origin));
  if (nodes.some((n) => n.status === 'refused')) return 'refused';
  if ((about.holds ?? []).some((h) => h.by !== 'correction' && has(h.origin))) return 'held';
  const claims = (about.claims ?? []).filter((c) => has(c.source));
  if (claims.some((c) => c.state && WRONG.has(c.state))) return 'unusual';
  if (claims.some((c) => c.state === 'unlearned')) return 'unlearned';
  if (nodes.some((n) => n.content !== undefined || n.status === 'reused' || n.status === 'folded')) return 'ok';
  return 'absent';
}

/** The grid (ADR 0021 §3): each row's cell on each day, by the day's latest run as known on a moment; null where none. */
export function gridOf(rows: readonly GridRow[], days: readonly string[], entries: readonly Pick<LogEntry, 'kind' | 'about' | 'at'>[], manifests: (hash: string) => Pick<RunManifest, 'nodes'> | null | undefined, at?: string | null): (CellState | null)[][] {
  const known = runsByDay(knownOn(entries, at));
  return rows.map((row) => days.map((day) => {
    const last = known.get(day)?.at(-1);
    if (!last) return null;
    const about = aboutOf(last);
    return cellOf(about, typeof about.manifest === 'string' ? manifests(about.manifest) : null, row.origins);
  }));
}

/** A run made here of a recorded day, against its record: what differs, if anything. */
export interface RecordCheck {
  matches: boolean;
  /** The plans, when they differ. */
  plan: { recorded: string; here: string } | null;
  /** Each stored dataset whose content differs, by origin: its recorded and its own content hash (null: not stored). */
  differs: { origin: string; recorded: string | null; here: string | null }[];
  /** The holds, as `by:origin`, sorted: recorded and here. */
  holds: { recorded: string[]; here: string[] };
}

/** What held a run, each check or claim once: a hold split by load, or spared on a load an earlier run here read while
 * the same check passed (ADR 0010 §7, Q-55), is the same hold of the day, whatever order its versions ran in. */
const holdKeys = (holds: readonly Pick<Hold, 'by' | 'origin'>[]): string[] => [...new Set(holds.map((h) => `${h.by}:${h.origin}`))].sort();

/**
 * A run made here of a recorded day, checked against the recorded run (ADR 0021 §4): the same plan, the same content in
 * every dataset either stored, and the same holds, each check or claim once. When a file was pulled in and the run's own
 * id are this browser's, so the manifests' hashes always differ and aren't compared.
 */
export function checkAgainst(recorded: { manifest: Pick<RunManifest, 'plan' | 'nodes'>; holds: readonly Pick<Hold, 'by' | 'origin'>[] }, here: { manifest: Pick<RunManifest, 'plan' | 'nodes'>; holds: readonly Pick<Hold, 'by' | 'origin'>[] }): RecordCheck {
  const plan = recorded.manifest.plan === here.manifest.plan ? null : { recorded: recorded.manifest.plan, here: here.manifest.plan };
  const content = (m: Pick<RunManifest, 'nodes'>) => new Map(m.nodes.filter((n) => n.content !== undefined).map((n) => [`${n.origin}|${n.key}`, n] as const));
  const a = content(recorded.manifest);
  const b = content(here.manifest);
  const differs: RecordCheck['differs'] = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(k);
    const y = b.get(k);
    if (x?.content !== y?.content) differs.push({ origin: (x ?? y)!.origin, recorded: x?.content ?? null, here: y?.content ?? null });
  }
  const holds = { recorded: holdKeys(recorded.holds), here: holdKeys(here.holds) };
  const sameHolds = holds.recorded.length === holds.here.length && holds.recorded.every((h, i) => h === holds.here[i]);
  return { matches: !plan && !differs.length && sameHolds, plan, differs, holds };
}

/** A run entry's `about`, as the record writes one: what the build records for each day (scripts/data/record.ts). */
export type RunEntryAbout = { [key: string]: JSONValue };
