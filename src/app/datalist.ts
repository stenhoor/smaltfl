/**
 * The data list a page opens (loads.json, ADR 0010 §9), read into one shape: format 2 binds each source by id to its
 * file, or to its daily loads and the days a paused one may be filled from, and names each watched source's history and
 * the flow it is for. (Format 1, the taxi example's data branch and fixtures, was retired with the example, Q-208.)
 * Pure: the app reads it at start.
 */
import type { Binding } from '../../examples/sources.js';
import type { CatalogueEntry } from '../core/catalogue.js';
import { isScenesFile, scenesProblems, type ScenesFile } from '../core/scenes.js';
import { eventsProblems, type FlowEvent } from '../core/events.js';
import type { Expected } from './fetch-checked.js';

/** A day's file of a source, as the data lists it, checked against MANIFEST.json at start. */
export interface Listed {
  day: string;
  file: string;
  sha256: string;
  bytes?: number;
  rows: number;
  /** When the file's system exported it, where the list says (ADR 0020 §2): what `fresh` reads against the day. */
  exported?: string;
  /** With several daily sources (ADR 0013 §5): the day's file of each, by source id, this one's among them. */
  files?: Record<string, Listed>;
}

/** A later delivery of a day's file (ADR 0021 §2, §6): its number that day, in the order they arrived; when it arrived
 * and why it was sent. */
export interface Delivered extends Listed {
  n: number;
  arrived: string;
  why: string;
}

/** A fixed file's entry: where the page fetches it, the sha256 and size the list gives, and where it came from. */
export type FileEntry = Expected & { path: string };

/** A source's binding with what the list says of its files: one file, or its loads and donors. */
export interface ListedSource extends Binding {
  entry?: FileEntry;
  loads?: Listed[];
  donors?: Listed[];
  /** The file of the last day before the loads, the history's last (ADR 0020 §2): what the first load's `fresh` is
   * told against. */
  before?: { day: string; sha256: string };
  /** Its days' files sent again later (ADR 0021 §2): each a version of its day. */
  deliveries?: Delivered[];
}

/** A data list, read. */
export interface DataList {
  format: 2;
  month?: string;
  built?: string;
  /** The data branch commit and list hash it was built from (null for a build's own list). */
  data: { commit: string; manifest: string; bytes?: number } | null;
  /** The flow document the data is for, when it isn't the built-in example. */
  flow: FileEntry | null;
  /** Each flow that flow reads, as its own document (ADR 0026 §2), by id: what a run keeps beside its own document, so
   * verify can check that it holds each unchanged. The build's own files, as the flow document is. */
  flows: Record<string, FileEntry>;
  /** The estates' ontologies the flow imports (ADR 0026 §8), each as its file gives it, by name and hash (`estate/0`),
   * in the order the flow's document names them. Empty where it imports none. */
  estates: (FileEntry & { name: string; hash: string })[];
  /** The flow's catalogue (ADR 0026 §10): the flows this build ships that are made already, each with what it gives,
   * what it is built on and the hash it is known by, and its own document's file (`file`, with its sha256 and size).
   * Empty where the build ships none. */
  catalogue: (CatalogueEntry & { file: string; sha256: string; bytes: number })[];
  sources: Record<string, ListedSource>;
  /** Each watched source's history, by source id. */
  histories: Record<string, FileEntry>;
  /** Each watched node's kept sample beside its history (ADR 0014 §5), by id, where the build keeps one. */
  samples: Record<string, FileEntry>;
  /** Each watch's ranges computed ahead for the first loads day (ADR 0019), by id, where the build made them. */
  ranges: Record<string, FileEntry>;
  /** The first loads day's types computed ahead (ADR 0019 amendment 2, core/typed.ts), where the build made them. */
  types?: FileEntry;
  /** The month the build recorded (ADR 0021 §6, core/month.ts), where it recorded one. */
  recorded?: FileEntry;
  /** The source the loads feed (the first with loads), its month's loads, its incidents' and its donor days. With
   * several daily sources (ADR 0013 §5), a load is a day: the first daily source's file, with every source's file
   * for the day in `files`. */
  loadSource: string | null;
  /** Every source with loads, in the list's order. */
  daily: string[];
  /** The watched source or step the page's views follow (the list's `judged`; else the loads' source): whose
   * history the strip and the news read, whose card carries the day's story. */
  judged: string | null;
  /** The posture dashboard's datasets (ADR 0020 §6, Q-174), where the flow publishes a posture product: the units'
   * roll-up, the organisation, the applications' scorecards, the applications with their owners, the remediation queue.
   * Read as a consumer reads them, the published names alone. */
  posture?: PostureProduct;
  /** The demo's scenes (ADR 0023 §4, core/scenes.ts): what it shows, listed on the month screen; none where the list
   * names none, or they aren't a good scenes file (said in the console, never in the way). */
  scenes?: ScenesFile;
  /** What was going on (ADR 0027 §6, core/events.ts): the events the build's story names; none where it names none,
   * or they aren't good events (said in the console, never in the way). */
  events?: FlowEvent[];
  /** The pages of this site that share a flow with this one (ADR 0026 §6), by the flow's id, each with its address
   * from this page: a flow this one reads that has a page of its own, or a flow that reads this one (named, since this
   * page's document doesn't know it). A held day decided on one is carried to the other, and each links to the other.
   * Where the pages are is the site's to say (the build's `--page`), not the flow's. */
  pages?: Record<string, { href: string; name?: string }>;
  loads: Listed[];
  donors: Listed[];
  /** Every fixed file by key: each source's by its id, each history as `history` (the first) and `history:<id>`. */
  files: Record<string, FileEntry>;
}

/** The data list's pages, where each is an address, with a name or none. */
const pagesOf = (v: unknown): Record<string, { href: string; name?: string }> | undefined => {
  if (!isRecord(v)) return undefined;
  const out = Object.fromEntries(Object.entries(v).flatMap(([id, x]) => (isRecord(x) && typeof x.href === 'string' && x.href ? [[id, { href: x.href, ...(typeof x.name === 'string' && x.name ? { name: x.name } : {}) }] as const] : [])));
  return Object.keys(out).length ? out : undefined;
};

/** The data list's events, where they are good events. */
const eventsOf = (v: unknown): FlowEvent[] => {
  if (!Array.isArray(v) || !v.length) return [];
  const wrong = eventsProblems(v);
  if (!wrong.length) return v as FlowEvent[];
  console.warn(`smaltfl: the data list's events aren't shown: ${wrong.join('; ')}`);
  return [];
};

/** The data list's scenes, where they are a good scenes file. */
const scenesOf = (v: unknown): ScenesFile | undefined => {
  if (v === undefined) return undefined;
  if (isScenesFile(v)) return v;
  console.warn(`smaltfl: the data list's scenes aren't shown: ${scenesProblems(v).join('; ')}`);
  return undefined;
};

/** A posture product's datasets, by the names the flow publishes them under (the data list's `posture`). */
export interface PostureProduct {
  title: string;
  units: string;
  org: string;
  apps: string;
  owners?: string;
  queue?: string;
  /** The dataset that names each control (`control_id`, `name`): what the recorded month labels its movers by (ADR 0024 §6). */
  controls?: string;
  /** What the score is, in a sentence or two: said under it on the month (ADR 0024 §6). */
  about?: string;
}
const postureOf = (v: unknown): PostureProduct | undefined => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const name = (k: string) => (typeof o[k] === 'string' && o[k] ? (o[k] as string) : undefined);
  const title = name('title'), units = name('units'), org = name('org'), apps = name('apps');
  const more = (['owners', 'queue', 'controls', 'about'] as const).flatMap((k) => (name(k) ? [[k, name(k)!] as const] : []));
  return title && units && org && apps ? { title, units, org, apps, ...Object.fromEntries(more) } : undefined;
};

type RawLoad = { day?: string; slot?: string; file: string; sha256: string; bytes?: number; rows: number; exported_at?: string; exported?: string };
const listedOf = (l: RawLoad): Listed => ({ day: l.slot ?? l.day ?? '', file: l.file, sha256: l.sha256, ...(l.bytes !== undefined ? { bytes: l.bytes } : {}), rows: l.rows, ...((l.exported_at ?? l.exported) ? { exported: (l.exported_at ?? l.exported)! } : {}) });
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const deliveredOf = (l: RawLoad & { n?: unknown; arrived?: unknown; why?: unknown }): Delivered | null =>
  Number.isInteger(l.n) && typeof l.arrived === 'string' && typeof l.why === 'string' ? { ...listedOf(l), n: l.n as number, arrived: l.arrived, why: l.why } : null;

/**
 * A loads.json read: format 2 as it says. Anything else (no list, or the retired format 1) reads as a list of nothing for
 * no flow, which the page says it can't open.
 */
export function readDataList(raw: unknown): DataList {
  const index = isRecord(raw) ? raw : {};
  const data = (index.data ?? null) as DataList['data'];
  if (index.format === 2) {
    const sources: Record<string, ListedSource> = {};
    for (const [id, s] of Object.entries((index.sources ?? {}) as Record<string, Record<string, unknown>>)) {
      const before = isRecord(s.before) && typeof s.before.day === 'string' && typeof s.before.sha256 === 'string' ? { day: s.before.day, sha256: s.before.sha256 } : null;
      const deliveries = Array.isArray(s.deliveries) ? (s.deliveries as RawLoad[]).flatMap((l) => deliveredOf(l) ?? []) : [];
      sources[id] = { ...(s as unknown as Binding), ...(s.entry ? { entry: s.entry as FileEntry } : {}), ...(Array.isArray(s.loads) ? { loads: (s.loads as RawLoad[]).map(listedOf) } : {}), ...(Array.isArray(s.donors) ? { donors: (s.donors as RawLoad[]).map(listedOf) } : {}), ...(before ? { before } : {}), ...(deliveries.length ? { deliveries } : {}) };
    }
    const histories = (index.histories ?? {}) as Record<string, FileEntry>;
    const samples = (isRecord(index.samples) ? index.samples : {}) as Record<string, FileEntry>;
    const ranges = (isRecord(index.ranges) ? index.ranges : {}) as Record<string, FileEntry>;
    const daily = Object.entries(sources).filter(([, s]) => s.loads !== undefined).map(([id]) => id);
    const loadSource = daily[0] ?? null;
    // Several daily sources: a load is a day, listed once, with each source's file for it (the first source's at top).
    const loads: Listed[] = daily.length <= 1 ? (loadSource ? sources[loadSource]!.loads! : []) : [...new Set(daily.flatMap((id) => sources[id]!.loads!.map((l) => l.day)))].sort().map((day) => {
      const files: Record<string, Listed> = {};
      for (const id of daily) {
        const l = sources[id]!.loads!.find((x) => x.day === day);
        if (l) files[id] = l;
      }
      const top = files[loadSource!] ?? Object.values(files)[0]!;
      return { ...top, files };
    });
    const judged = typeof index.judged === 'string' ? index.judged : loadSource;
    const files: Record<string, FileEntry> = {};
    for (const [id, s] of Object.entries(sources)) if (s.entry) files[id] = s.entry;
    Object.entries(histories).forEach(([id, h], k) => {
      files[`history:${id}`] = h;
      if (k === 0) files.history = h;
    });
    for (const [id, s] of Object.entries(samples)) files[`sample:${id}`] = s;
    for (const [id, r] of Object.entries(ranges)) files[`ranges:${id}`] = r;
    const types = isRecord(index.types) ? (index.types as unknown as FileEntry) : null;
    if (types) files.types = types;
    const recorded = isRecord(index.recorded) ? (index.recorded as unknown as FileEntry) : null;
    if (recorded) files.recorded = recorded;
    const flow = isRecord(index.flow) ? (index.flow as unknown as FileEntry) : null;
    if (flow) files.flow = flow;
    const flows = (isRecord(index.flows) ? index.flows : {}) as Record<string, FileEntry>;
    for (const [id, f] of Object.entries(flows)) files[`flow:${id}`] = f;
    const estates = (Array.isArray(index.estates) ? index.estates : []).filter((e): e is FileEntry & { name: string; hash: string } => isRecord(e) && typeof e.path === 'string' && typeof e.name === 'string' && typeof e.hash === 'string');
    estates.forEach((e, k) => (files[`estate:${k}`] = e));
    const catalogue = (Array.isArray(index.catalogue) ? index.catalogue : []).filter((e): e is CatalogueEntry & { file: string; sha256: string; bytes: number } =>
      isRecord(e) && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.path === 'string' && typeof e.hash === 'string' && typeof e.file === 'string' && typeof e.sha256 === 'string' && typeof e.bytes === 'number'
      && Array.isArray(e.gives) && Array.isArray(e.reads));
    for (const e of catalogue) files[`catalogue:${e.id}`] = { path: e.file, sha256: e.sha256, bytes: e.bytes };
    return {
      format: 2, ...(typeof index.month === 'string' ? { month: index.month } : {}), ...(typeof index.built === 'string' ? { built: index.built } : {}), data, flow, flows, estates, catalogue, sources, histories, samples, ranges, ...(types ? { types } : {}), ...(recorded ? { recorded } : {}), loadSource, daily, judged,
      ...(postureOf(index.posture) ? { posture: postureOf(index.posture)! } : {}),
      ...(scenesOf(index.scenes) ? { scenes: scenesOf(index.scenes)! } : {}),
      ...(eventsOf(index.events).length ? { events: eventsOf(index.events) } : {}),
      ...(pagesOf(index.pages) ? { pages: pagesOf(index.pages)! } : {}),
      loads, donors: loadSource ? sources[loadSource]!.donors ?? [] : [], files,
    };
  }
  return { format: 2, data, flow: null, flows: {}, estates: [], catalogue: [], sources: {}, histories: {}, samples: {}, ranges: {}, loadSource: null, daily: [], judged: null, loads: [], donors: [], files: {} };
}

/** Every file a list names, with the sha256 and size it gives: what must be in MANIFEST.json, as it says. */
export function namedFiles(list: DataList): { path: string; sha256: string; bytes: number }[] {
  // The flow document is the build's own file (ADR 0011: a folder's flow.json, its notebooks expanded), never the data
  // branch's: it is checked against loads.json's entry when it is read, not against MANIFEST.json. So are the types
  // computed ahead (ADR 0019 amendment 2), which the build makes from it.
  const fixed = Object.entries(list.files).filter(([k]) => k !== 'flow' && !k.startsWith('flow:') && k !== 'types' && k !== 'recorded').map(([, f]) => ({ path: f.from ?? f.path, sha256: f.sha256, bytes: f.bytes }));
  const days = [...list.loads, ...list.donors, ...Object.values(list.sources).flatMap((s) => s.deliveries ?? [])].flatMap((l) => (l.files ? Object.values(l.files) : [l])).map((l) => ({ path: l.file, sha256: l.sha256, bytes: l.bytes ?? -1 }));
  return [...fixed, ...days];
}

/** A day's later deliveries (ADR 0021 §2), every source's, in the order they arrived. */
export function deliveriesOf(list: Pick<DataList, 'sources'>, day: string): (Delivered & { source: string })[] {
  return Object.entries(list.sources).flatMap(([source, s]) => (s.deliveries ?? []).filter((d) => d.day === day).map((d) => ({ ...d, source }))).sort((a, b) => a.n - b.n);
}

/**
 * A day's versions (ADR 0021 §2): its first files, by source, then the files as each later delivery left them, the file
 * sent again in its source's place. Version v is `versions[v - 1]`.
 */
export function versionsOfDay(load: Pick<Listed, 'files'> & Listed, deliveries: readonly (Delivered & { source: string })[]): Record<string, Listed>[] {
  const first: Record<string, Listed> = load.files ? { ...load.files } : {};
  const out = [first];
  for (const d of deliveries) out.push({ ...out.at(-1)!, [d.source]: d });
  return out;
}
