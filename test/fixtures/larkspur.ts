/**
 * The Larkspur estate (ADR 0020): the control posture of a fictional financial-services group, as its systems would
 * export it, day by day. No real company or person is its subject (Q-175): names come from neutral word lists, and
 * vendors' column layouts are borrowed as formats only.
 *
 * Slice 1 is the world and its calm days, with nothing planted:
 * - **the organisation:** a group, five segments, sixteen business units, three departments each, three to five teams
 *   each (about 180), every unit led by one person. A third of the posts change hands during the span: the post stands
 *   vacant for three to nine weeks, three in four with an acting leader named (a peer acting up), the rest with none
 *   (silver inherits the leader above). A few leaders take leave, most with someone acting. Some departments are better kept
 *   than others: a propensity that scales every failure rate and lateness beneath them.
 * - **the applications:** about 2,400 in the CMDB in March 2024 (600 in the tests), each owned by a team and typed (tier, exposure,
 *   data class, datastore, hosting, site), with a life: built, live, retiring, retired, then gone from the CMDB. A few
 *   are created each week and a few retire; a few change type or owner. What applies to an application follows its type
 *   on the day.
 * - **the platforms:** 46, a dependency graph. Some provide a control their applications inherit (NIST SP 800-37's
 *   common and hybrid controls): an ingress TLS and the WAF, an identity provider MFA, a backup controller backups.
 * - **the catalogue:** fourteen controls, twelve with a feed and two told in silver (the vulnerability SLA, ownership),
 *   each with its CSF 2.0 function and category, framework requirements, weight, cadence, applicability as data,
 *   dependency, compensation and the kind of platform that provides it.
 * - **the feeds:** twenty daily files and two fixed ones, each file's export time said beside it (`exportedAt`), as the
 *   bronze metadata is, never in its rows. An evidence feed's status is the tool's own (pass, fail,
 *   not_assessed): an exception is the risk register's, applied in silver, never a feed's word. The findings ledger has
 *   one scan-information row an application scanned, saying whether the scanner logged in, so an application never
 *   scanned, or scanned without logging in, can be told from a clean one.
 *
 * `larkspur()` draws the world; `orgOn`, `appsOn`, `dayFile` and `dayFiles` read it on a day; `fixedFiles` is the
 * architecture inventory. The planted days of ADR 0020 §5 come with the later slices. Nothing here is a judge.
 */
export { csvOf } from './estate.js';

export const LARKSPUR_FROM = '2023-03-01';
export const LARKSPUR_LOADS_FROM = '2024-03-01';
export const LARKSPUR_TO = '2024-03-31';

export type Cell = string | number | null;
export interface Table {
  columns: string[];
  rows: Cell[][];
}

export interface LarkspurOptions {
  /** The draw (default 7). */
  seed?: number;
  /** How many applications are drawn across the span, created before it or during it (default 2,600: about 2,400 are
   * in the CMDB in March 2024, the rest not yet created or retired and gone; the tests draw 650 for about 600). */
  apps?: number;
}

// ------------------------------------------------------------------ draws

/** A uniform number in [0, 1) from a few names: the same names, the same number, whatever the order days are drawn in. */
function uniform(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    for (const ch of `${part}|`) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
const pick = <T>(xs: readonly T[], u: number): T => xs[Math.min(xs.length - 1, Math.floor(u * xs.length))]!;
const int = (lo: number, hi: number, u: number) => lo + Math.floor(u * (hi - lo + 1));
const pad = (n: number, width: number) => String(n).padStart(width, '0');
function weighted<T>(xs: readonly (readonly [T, number])[], u: number): T {
  let t = xs.reduce((s, [, w]) => s + w, 0) * u;
  for (const [x, w] of xs) if ((t -= w) < 0) return x;
  return xs[xs.length - 1]![0];
}
const dayNumber = (d: string) => Math.round(Date.parse(`${d}T00:00:00Z`) / 864e5);
const dayOf = (n: number) => new Date(n * 864e5).toISOString().slice(0, 10);
export const addDays = (d: string, n: number): string => dayOf(dayNumber(d) + n);
export const daysFrom = (from: string, to: string): number => dayNumber(to) - dayNumber(from);
const between = (lo: string, hi: string, u: number) => dayOf(dayNumber(lo) + Math.floor(u * (dayNumber(hi) - dayNumber(lo) + 1)));
const weekday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();
const stamp = (ms: number) => `${new Date(ms).toISOString().slice(0, 19)}Z`;

/** Every day of the span, the history's and the loads'. */
export function larkspurDays(from = LARKSPUR_FROM, to = LARKSPUR_TO): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Patch Tuesday: the second Tuesday of a month. */
export function patchTuesday(year: number, month: number): string {
  let d = `${year}-${pad(month, 2)}-08`;
  while (weekday(d) !== 2) d = addDays(d, 1);
  return d;
}

// ------------------------------------------------------------------ the organisation

export type Level = 'group' | 'segment' | 'business_unit' | 'department' | 'team';
export const LEVELS: readonly Level[] = ['group', 'segment', 'business_unit', 'department', 'team'];
export const TITLES: Record<Level, string> = { group: 'Group Chief Executive', segment: 'EVP', business_unit: 'SVP', department: 'VP', team: 'Director' };

export interface Unit {
  id: string;
  parent: string | null;
  name: string;
  level: Level;
  cost_centre: string;
  /** The unit's segment and department (a team's or a department's own; null above). */
  segment: string;
  business_unit: string | null;
  department: string | null;
  /** How much worse than usual the unit is kept: every failure rate and lateness beneath a department scales by it. */
  propensity: number;
}

interface Tenure {
  person: string;
  unit: string;
  /** null: in post before the span, and since `since`. */
  from: string | null;
  /** The day they leave (no longer in post); null: still there after the span. */
  to: string | null;
  since: string;
  leave: { from: string; to: string; acting: boolean } | null;
}

interface Vacancy {
  from: string;
  to: string;
  acting: boolean;
  actingFrom: string;
}

const SEGMENTS: readonly (readonly [string, string, readonly string[]])[] = [
  ['Retail Banking', 'RET', ['Cards', 'Mortgages', 'Everyday Banking', 'Digital Channels']],
  ['Commercial Banking', 'COM', ['Business Lending', 'Payments', 'Treasury Services']],
  ['Wealth Management', 'WLT', ['Advice', 'Asset Management', 'Brokerage']],
  ['Insurance', 'INS', ['Claims', 'Underwriting', 'Policy Services']],
  ['Group Functions', 'GRF', ['Technology', 'Finance and Risk', 'People']],
];
/** The segments whose internet-facing applications sign customers in. */
const CUSTOMER_SEGMENTS = new Set(['SEG-1', 'SEG-3', 'SEG-4']);
const DEPT_KINDS = ['Channels', 'Operations', 'Platforms', 'Data', 'Servicing', 'Engineering', 'Controls', 'Analytics'];
const TEAM_ADJ = ['Amber', 'Azure', 'Bright', 'Cedar', 'Cobalt', 'Copper', 'Coral', 'Crimson', 'Emerald', 'Golden', 'Indigo', 'Ivory', 'Jade', 'Russet', 'Sable', 'Silver', 'Slate', 'Teal'];
const TEAM_NOUN = ['Badger', 'Falcon', 'Finch', 'Heron', 'Kestrel', 'Lark', 'Lynx', 'Marten', 'Osprey', 'Otter', 'Raven', 'Robin', 'Swift', 'Wren'];
const FIRST = ['Avery', 'Blake', 'Cameron', 'Casey', 'Dakota', 'Drew', 'Eden', 'Elliot', 'Emerson', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Jordan', 'Jules', 'Kai', 'Kendall', 'Lane', 'Logan', 'Marley', 'Morgan', 'Noel', 'Oakley', 'Parker', 'Peyton', 'Quinn', 'Reese', 'Remy', 'Riley', 'Robin', 'Rowan', 'Sage', 'Sasha', 'Skyler', 'Sloane', 'Tatum', 'Taylor', 'Toby', 'Wren', 'Zion'];
const LAST = ['Ashford', 'Bramley', 'Calder', 'Dunmore', 'Ellery', 'Fenwick', 'Garland', 'Hadley', 'Ingram', 'Jessop', 'Kendrick', 'Langley', 'Marsden', 'Netherby', 'Orwin', 'Pemberton', 'Quarles', 'Radley', 'Selby', 'Thorne', 'Upton', 'Varley', 'Whitlock', 'Yardley', 'Alcott', 'Bexley', 'Carrow', 'Denholm', 'Eastwood', 'Farrow', 'Galloway', 'Hartley', 'Ibbotson', 'Kirkby', 'Linton', 'Mercer', 'Norwood', 'Ormsby', 'Prescott', 'Rowntree'];

function drawUnits(seed: number): Unit[] {
  const units: Unit[] = [{ id: 'GRP', parent: null, name: 'Larkspur Group', level: 'group', cost_centre: 'CC-1000', segment: 'GRP', business_unit: null, department: null, propensity: 1 }];
  const teamNames = TEAM_ADJ.flatMap((a) => TEAM_NOUN.map((n) => `${a} ${n}`)).sort((x, y) => uniform(seed, 'team-name', x) - uniform(seed, 'team-name', y));
  let bu = 0;
  let dep = 0;
  let team = 0;
  const cc = () => `CC-${1000 + units.length}`;
  SEGMENTS.forEach(([segName, , bus], si) => {
    const seg = `SEG-${si + 1}`;
    units.push({ id: seg, parent: 'GRP', name: segName, level: 'segment', cost_centre: cc(), segment: seg, business_unit: null, department: null, propensity: 1 });
    for (const buName of bus) {
      const buId = `BU-${pad(++bu, 2)}`;
      units.push({ id: buId, parent: seg, name: buName, level: 'business_unit', cost_centre: cc(), segment: seg, business_unit: buId, department: null, propensity: 1 });
      const kinds = DEPT_KINDS.slice().sort((x, y) => uniform(seed, buId, 'kind', x) - uniform(seed, buId, 'kind', y)).slice(0, 3);
      for (const kind of kinds) {
        const depId = `DEP-${pad(++dep, 2)}`;
        // A department's propensity, e^-0.6 to e^0.6: the best kept fail about half as often as usual, the worst nearly twice.
        const propensity = Math.exp((uniform(seed, depId, 'propensity') - 0.5) * 1.2);
        units.push({ id: depId, parent: buId, name: `${buName} ${kind}`, level: 'department', cost_centre: cc(), segment: seg, business_unit: buId, department: depId, propensity });
        const u = uniform(seed, depId, 'teams');
        const n = u < 0.4 ? 3 : u < 0.85 ? 4 : 5;
        for (let t = 0; t < n; t++) {
          const id = `TM-${pad(++team, 3)}`;
          units.push({ id, parent: depId, name: teamNames[(team - 1) % teamNames.length]!, level: 'team', cost_centre: cc(), segment: seg, business_unit: buId, department: depId, propensity: propensity * Math.exp((uniform(seed, id, 'propensity') - 0.5) * 0.4) });
        }
      }
    }
  });
  return units;
}

// ------------------------------------------------------------------ applications

export type Exposure = 'internet' | 'partner' | 'internal';
export type DataClass = 'pci' | 'pii' | 'confidential' | 'internal' | 'public';
export type Hosting = 'cloud' | 'onprem' | 'saas';
export type Site = 'CLOUD-EAST' | 'CLOUD-WEST' | 'DC-EAST' | 'DC-WEST' | 'SAAS';
export type Lifecycle = 'build' | 'active' | 'retiring' | 'retired';

export interface AppAttrs {
  tier: 1 | 2 | 3;
  exposure: Exposure;
  data_class: DataClass;
  datastore: 'yes' | 'no';
  hosting: Hosting;
  site: Site;
}

interface AppDraw {
  id: string;
  name: string;
  created: string;
  goLive: string;
  retireBy: string | null;
  base: AppAttrs;
  change: { at: string; set: Partial<AppAttrs> } | null;
  owner: string;
  move: { at: string; to: string } | null;
}

/** The platforms an application relies on, from its type: what its feeds name, and what `platform_impact` attributes. */
export interface AppPlatforms {
  runtime: string | null;
  ingress: string | null;
  /** The issuer of its certificates: the ingress's CA, the internal CA, or the vendor's. */
  issuer: string;
  idp: string;
  key_store: string | null;
  backup: string | null;
  log_pipeline: string | null;
  scanner: string | null;
  edr: string | null;
  vault: string | null;
}

/** An application as the CMDB has it on a day, with the platforms its type gives it. */
export interface AppOn extends AppAttrs {
  app_id: string;
  name: string;
  owner_team_id: string;
  platform_id: string;
  lifecycle: Lifecycle;
  created_on: string;
  go_live: string;
  retire_by: string;
  updated_at: string;
  deps: AppPlatforms;
}

const APP_A = ['amber', 'anchor', 'apex', 'arbor', 'atlas', 'aurora', 'beacon', 'birch', 'bridge', 'canyon', 'cascade', 'cedar', 'cinder', 'clover', 'cobalt', 'comet', 'coral', 'crest', 'delta', 'ember', 'falcon', 'fern', 'fjord', 'flint', 'garnet', 'glacier', 'granite', 'harbor', 'hazel', 'heron', 'horizon', 'iris', 'juniper', 'lantern', 'ledger', 'lumen', 'maple', 'meadow', 'mesa', 'nimbus', 'oak', 'onyx', 'orbit', 'osprey', 'pebble', 'pine', 'prism', 'quartz'];
const APP_B = ['admin', 'api', 'archive', 'assist', 'billing', 'book', 'broker', 'cache', 'claims', 'core', 'desk', 'docs', 'engine', 'exchange', 'feed', 'flow', 'forms', 'gateway', 'grid', 'hub', 'index', 'intake', 'ledger', 'lens', 'link', 'loans', 'mail', 'market', 'match', 'notes', 'office', 'pay', 'pipe', 'portal', 'quote', 'rates', 'relay', 'report', 'rules', 'scan', 'score', 'search', 'sign', 'store', 'sync', 'track', 'vault', 'view', 'watch', 'works', 'yard', 'zone'];

function drawApps(seed: number, n: number, units: readonly Unit[]): AppDraw[] {
  const teams = units.filter((u) => u.level === 'team');
  const weights = teams.map((t) => [t, Math.exp((uniform(seed, t.id, 'apps') - 0.5) * 2.5)] as const);
  const byDept = new Map<string, Unit[]>();
  for (const t of teams) byDept.set(t.department!, [...(byDept.get(t.department!) ?? []), t]);
  const names = APP_A.flatMap((a) => APP_B.map((b) => `${a}-${b}`)).sort((x, y) => uniform(seed, 'app-name', x) - uniform(seed, 'app-name', y));
  const out: AppDraw[] = [];
  for (let i = 1; i <= n; i++) {
    const id = `APP-${pad(i, 4)}`;
    const u = (k: string) => uniform(seed, id, k);
    const isNew = u('new') < 0.15;
    const created = isNew ? between(LARKSPUR_FROM, LARKSPUR_TO, u('created')) : between('2014-01-01', addDays(LARKSPUR_FROM, -1), u('created'));
    const goLive = addDays(created, isNew ? int(20, 90, u('golive')) : int(30, 120, u('golive')));
    const team = weighted(weights, u('owner'));
    const seg = team.segment;
    const buName = units.find((x) => x.id === team.business_unit)!.name;
    const ue = u('exposure');
    const [pInternet, pPartner] = seg === 'SEG-1' || seg === 'SEG-3' ? [0.35, 0.07] : seg === 'SEG-2' ? [0.18, 0.22] : seg === 'SEG-4' ? [0.25, 0.12] : [0.06, 0.04];
    const exposure: Exposure = ue < pInternet ? 'internet' : ue < pInternet + pPartner ? 'partner' : 'internal';
    const ut = u('tier');
    const tier: 1 | 2 | 3 = exposure === 'internet' ? (ut < 0.22 ? 1 : ut < 0.62 ? 2 : 3) : ut < 0.12 ? 1 : ut < 0.45 ? 2 : 3;
    const ud = u('data');
    const data_class: DataClass =
      buName === 'Cards' || buName === 'Payments' ? (ud < 0.45 ? 'pci' : ud < 0.75 ? 'pii' : ud < 0.9 ? 'confidential' : 'internal')
      : buName === 'People' ? (ud < 0.6 ? 'pii' : ud < 0.85 ? 'confidential' : 'internal')
      : ud < 0.32 ? 'pii' : ud < 0.57 ? 'confidential' : ud < 0.9 ? 'internal' : 'public';
    const datastore = u('store') < (data_class === 'public' ? 0.4 : 0.78) ? 'yes' : 'no';
    const uh = u('hosting');
    const hosting: Hosting = isNew ? (uh < 0.75 ? 'cloud' : uh < 0.85 ? 'onprem' : 'saas') : uh < 0.5 ? 'cloud' : uh < 0.87 ? 'onprem' : 'saas';
    const site: Site = hosting === 'saas' ? 'SAAS' : hosting === 'cloud' ? (u('site') < 0.6 ? 'CLOUD-EAST' : 'CLOUD-WEST') : u('site') < 0.55 ? 'DC-EAST' : 'DC-WEST';
    let retireBy: string | null = u('retire') < 0.12 ? between(LARKSPUR_FROM, addDays(LARKSPUR_TO, 90), u('retire-at')) : null;
    if (retireBy && daysFrom(goLive, retireBy) < 60) retireBy = null;
    let change: AppDraw['change'] = null;
    if (u('change') < 0.05) {
      const at = between(LARKSPUR_FROM, LARKSPUR_TO, u('change-at'));
      const kind = pick(['exposure', 'datastore', 'data_class', 'tier'] as const, u('change-kind'));
      const set: Partial<AppAttrs> | null =
        kind === 'exposure' && exposure === 'internal' ? { exposure: u('change-to') < 0.7 ? 'internet' : 'partner' }
        : kind === 'datastore' && datastore === 'no' ? { datastore: 'yes' }
        : kind === 'data_class' && (data_class === 'internal' || data_class === 'public') ? { data_class: 'pii' }
        : kind === 'tier' && tier === 3 ? { tier: 2 }
        : null;
      if (set && at > goLive && (!retireBy || at < retireBy)) change = { at, set };
    }
    let move: AppDraw['move'] = null;
    if (u('move') < 0.03) {
      const others = (byDept.get(team.department!) ?? []).filter((t) => t.id !== team.id);
      const at = between(LARKSPUR_FROM, LARKSPUR_TO, u('move-at'));
      if (others.length && at > created) move = { at, to: pick(others, u('move-to')).id };
    }
    out.push({ id, name: names[(i - 1) % names.length]! + (i > names.length ? `-${Math.ceil(i / names.length)}` : ''), created, goLive, retireBy, base: { tier, exposure, data_class, datastore, hosting, site }, change, owner: team.id, move });
  }
  return out;
}

const INGRESS_CA: Record<string, string> = { 'ing-east-1': 'ca-int-1', 'ing-east-2': 'ca-int-1', 'ing-east-3': 'ca-int-1', 'ing-west-1': 'ca-int-2', 'ing-west-2': 'ca-int-1', 'ing-west-3': 'ca-int-1' };

/** The platforms an application's type gives it: the same application and type, the same platforms, on any day. */
export function platformsOf(seed: number, id: string, a: AppAttrs, segment: string): AppPlatforms {
  const u = (k: string) => uniform(seed, id, 'platform', k);
  const east = a.site === 'CLOUD-EAST' || a.site === 'DC-EAST';
  const saas = a.hosting === 'saas';
  const runtime =
    a.site === 'CLOUD-EAST' ? weighted([['eks-prod-1', 0.4], ['eks-prod-2', 0.35], ['eks-prod-3', 0.25]], u('runtime'))
    : a.site === 'CLOUD-WEST' ? weighted([['eks-prod-4', 0.4], ['eks-prod-5', 0.3], ['eks-prod-6', 0.3]], u('runtime'))
    : a.site === 'DC-EAST' ? weighted([['ocp-east-1', 0.4], ['vmf-east-1', 0.35], ['vmf-east-2', 0.25]], u('runtime'))
    : a.site === 'DC-WEST' ? weighted([['ocp-west-1', 0.4], ['vmf-west-1', 0.3], ['vmf-west-2', 0.3]], u('runtime'))
    : null;
  const ingress = a.exposure !== 'internal' && !saas ? (east ? weighted([['ing-east-1', 0.36], ['ing-east-2', 0.3], ['ing-east-3', 0.34]], u('ingress')) : weighted([['ing-west-1', 0.38], ['ing-west-2', 0.32], ['ing-west-3', 0.3]], u('ingress'))) : null;
  const store = a.datastore === 'yes';
  return {
    runtime,
    ingress,
    issuer: ingress ? INGRESS_CA[ingress]! : saas ? 'vendor' : 'ca-int-3',
    idp: saas ? (u('idp') < 0.25 ? 'local' : 'idp-workforce') : a.exposure === 'internet' && CUSTOMER_SEGMENTS.has(segment) ? 'idp-customer' : a.hosting === 'onprem' && u('idp') < 0.3 ? 'idp-legacy' : 'idp-workforce',
    key_store: !store ? null : saas ? 'vendor' : a.site === 'CLOUD-EAST' ? 'kms-east' : a.site === 'CLOUD-WEST' ? 'kms-west' : a.site === 'DC-EAST' ? 'hsm-dc-east' : 'hsm-dc-west',
    backup: !store || saas ? null : a.site === 'CLOUD-EAST' ? 'bkp-cloud-east' : a.site === 'CLOUD-WEST' ? 'bkp-cloud-west' : a.site === 'DC-EAST' ? 'bkp-dc-east' : 'bkp-dc-west',
    log_pipeline: saas ? null : a.site === 'CLOUD-EAST' ? 'log-east' : a.site === 'CLOUD-WEST' ? 'log-west' : 'log-dc',
    scanner: saas ? null : a.site === 'DC-EAST' ? 'scn-dc-east' : a.site === 'DC-WEST' ? 'scn-dc-west' : 'scn-cloud',
    edr: saas ? null : 'edr-main',
    vault: a.tier <= 2 ? 'pam-main' : null,
  };
}

// ------------------------------------------------------------------ platforms

export type PlatformKind = 'network' | 'cluster' | 'vm_farm' | 'ingress' | 'certificate_authority' | 'identity_provider' | 'key_store' | 'backup' | 'log_pipeline' | 'siem' | 'vault' | 'scanner' | 'edr';

export interface Platform {
  id: string;
  kind: PlatformKind;
  name: string;
  site: string;
  depends_on: readonly string[];
  provides: readonly (readonly [ControlId, 'common' | 'hybrid'])[];
}

const p = (id: string, kind: PlatformKind, name: string, site: string, depends_on: string[] = [], provides: (readonly [ControlId, 'common' | 'hybrid'])[] = []): Platform => ({ id, kind, name, site, depends_on, provides });

/** The architecture inventory: 46 platforms and what each depends on and provides. */
export const PLATFORMS: readonly Platform[] = [
  p('net-east', 'network', 'Cloud network, east', 'CLOUD-EAST'),
  p('net-west', 'network', 'Cloud network, west', 'CLOUD-WEST'),
  p('net-dc-east', 'network', 'Data-centre network, East', 'DC-EAST'),
  p('net-dc-west', 'network', 'Data-centre network, West', 'DC-WEST'),
  ...[1, 2, 3].map((i) => p(`eks-prod-${i}`, 'cluster', `Production cluster ${i}`, 'CLOUD-EAST', ['net-east'])),
  ...[4, 5, 6].map((i) => p(`eks-prod-${i}`, 'cluster', `Production cluster ${i}`, 'CLOUD-WEST', ['net-west'])),
  p('ocp-east-1', 'cluster', 'Container platform, East', 'DC-EAST', ['net-dc-east']),
  p('ocp-west-1', 'cluster', 'Container platform, West', 'DC-WEST', ['net-dc-west']),
  p('vmf-east-1', 'vm_farm', 'Virtual machine farm 1, East', 'DC-EAST', ['net-dc-east']),
  p('vmf-east-2', 'vm_farm', 'Virtual machine farm 2, East', 'DC-EAST', ['net-dc-east']),
  p('vmf-west-1', 'vm_farm', 'Virtual machine farm 1, West', 'DC-WEST', ['net-dc-west']),
  p('vmf-west-2', 'vm_farm', 'Virtual machine farm 2, West', 'DC-WEST', ['net-dc-west']),
  ...[1, 2, 3].map((i) => p(`ing-east-${i}`, 'ingress', `Ingress ${i}, east`, 'EAST', ['net-east', INGRESS_CA[`ing-east-${i}`]!], [['tls', 'common'], ['waf', 'common']])),
  ...[1, 2, 3].map((i) => p(`ing-west-${i}`, 'ingress', `Ingress ${i}, west`, 'WEST', ['net-west', INGRESS_CA[`ing-west-${i}`]!], [['tls', 'common'], ['waf', 'common']])),
  p('ca-root', 'certificate_authority', 'Root certificate authority', 'GLOBAL'),
  p('ca-int-1', 'certificate_authority', 'Intermediate CA 1', 'GLOBAL', ['ca-root']),
  p('ca-int-2', 'certificate_authority', 'Intermediate CA 2', 'GLOBAL', ['ca-root']),
  p('ca-int-3', 'certificate_authority', 'Intermediate CA 3, internal services', 'GLOBAL', ['ca-root']),
  p('idp-workforce', 'identity_provider', 'Workforce identity provider', 'GLOBAL', ['net-east'], [['mfa', 'common']]),
  p('idp-customer', 'identity_provider', 'Customer identity provider', 'GLOBAL', ['net-east'], [['mfa', 'common']]),
  p('idp-legacy', 'identity_provider', 'Legacy directory', 'DC-EAST', ['net-dc-east'], [['mfa', 'common']]),
  p('kms-east', 'key_store', 'Key management, east', 'CLOUD-EAST', ['net-east'], [['encryption', 'hybrid'], ['key_rotation', 'hybrid']]),
  p('kms-west', 'key_store', 'Key management, west', 'CLOUD-WEST', ['net-west'], [['encryption', 'hybrid'], ['key_rotation', 'hybrid']]),
  p('hsm-dc-east', 'key_store', 'Hardware security modules, East', 'DC-EAST', ['net-dc-east'], [['encryption', 'hybrid'], ['key_rotation', 'hybrid']]),
  p('hsm-dc-west', 'key_store', 'Hardware security modules, West', 'DC-WEST', ['net-dc-west'], [['encryption', 'hybrid'], ['key_rotation', 'hybrid']]),
  p('bkp-dc-east', 'backup', 'Backup controller, DC-East', 'DC-EAST', ['net-dc-east'], [['backup', 'common']]),
  p('bkp-dc-west', 'backup', 'Backup controller, DC-West', 'DC-WEST', ['net-dc-west'], [['backup', 'common']]),
  p('bkp-cloud-east', 'backup', 'Backup service, east', 'CLOUD-EAST', ['net-east'], [['backup', 'common']]),
  p('bkp-cloud-west', 'backup', 'Backup service, west', 'CLOUD-WEST', ['net-west'], [['backup', 'common']]),
  p('log-east', 'log_pipeline', 'Log pipeline, east', 'CLOUD-EAST', ['net-east', 'siem-main'], [['logging', 'hybrid']]),
  p('log-west', 'log_pipeline', 'Log pipeline, west', 'CLOUD-WEST', ['net-west', 'siem-main'], [['logging', 'hybrid']]),
  p('log-dc', 'log_pipeline', 'Log pipeline, data centres', 'DC-EAST', ['net-dc-east', 'siem-main'], [['logging', 'hybrid']]),
  p('siem-main', 'siem', 'Security information and event management', 'GLOBAL', ['net-east']),
  p('pam-main', 'vault', 'Privileged access vault', 'GLOBAL', ['net-dc-east', 'idp-workforce'], [['privileged_access', 'hybrid']]),
  p('scn-dc-east', 'scanner', 'Vulnerability scanner, DC-East', 'DC-EAST', ['net-dc-east']),
  p('scn-dc-west', 'scanner', 'Vulnerability scanner, DC-West', 'DC-WEST', ['net-dc-west']),
  p('scn-cloud', 'scanner', 'Vulnerability scanner, cloud agents', 'CLOUD-EAST', ['net-east']),
  p('edr-main', 'edr', 'Endpoint detection and response', 'GLOBAL', ['net-east'], [['edr', 'hybrid']]),
];

// ------------------------------------------------------------------ the catalogue

export const CONTROL_IDS = ['tls', 'waf', 'pentest', 'encryption', 'key_rotation', 'backup', 'dr_exercise', 'vuln_sla', 'mfa', 'access_review', 'logging', 'privileged_access', 'edr', 'ownership'] as const;
export type ControlId = (typeof CONTROL_IDS)[number];

/** Which applications a control applies to, as data: each list a column's values (null: any), every one required. */
export interface Applies {
  exposure: readonly Exposure[] | null;
  tier: readonly number[] | null;
  data_class: readonly DataClass[] | null;
  datastore: readonly ('yes' | 'no')[] | null;
  hosting: readonly Hosting[] | null;
  lifecycle: readonly Lifecycle[];
}

export interface Control {
  id: ControlId;
  name: string;
  csf_function: 'GV' | 'ID' | 'PR' | 'DE' | 'RS' | 'RC';
  csf_category: string;
  weight: number;
  cadence: 'daily' | 'yearly' | 'quarterly' | 'per finding';
  applies: Applies;
  depends_on: ControlId | null;
  compensated_by: string | null;
  provided_by: PlatformKind | null;
  allocation: 'common' | 'hybrid' | 'system';
  /** The daily file that carries its evidence (null: told in silver). */
  feed: string | null;
}

const LIVE: readonly Lifecycle[] = ['active', 'retiring'];
const NOT_SAAS: readonly Hosting[] = ['cloud', 'onprem'];
const ANY_APP: Applies = { exposure: null, tier: null, data_class: null, datastore: null, hosting: null, lifecycle: LIVE };
const c = (id: ControlId, name: string, csf_category: string, weight: number, cadence: Control['cadence'], applies: Partial<Applies>, more: Partial<Pick<Control, 'depends_on' | 'compensated_by' | 'provided_by' | 'allocation' | 'feed'>> = {}): Control => ({
  id, name, csf_function: csf_category.slice(0, 2) as Control['csf_function'], csf_category, weight, cadence, applies: { ...ANY_APP, ...applies },
  depends_on: more.depends_on ?? null, compensated_by: more.compensated_by ?? null, provided_by: more.provided_by ?? null, allocation: more.allocation ?? 'system', feed: more.feed === undefined ? id : more.feed,
});

export const CONTROLS: readonly Control[] = [
  c('tls', 'TLS on exposed endpoints', 'PR.DS', 2, 'daily', { exposure: ['internet', 'partner'] }, { compensated_by: 'private_link', provided_by: 'ingress', allocation: 'common' }),
  c('waf', 'Web application firewall in block mode', 'PR.IR', 2, 'daily', { exposure: ['internet'], hosting: NOT_SAAS }, { provided_by: 'ingress', allocation: 'common' }),
  c('pentest', 'Yearly penetration test', 'ID.RA', 2, 'yearly', { exposure: ['internet', 'partner'], tier: [1, 2] }, { compensated_by: 'waf', feed: 'pentest_schedule' }),
  c('encryption', 'Encryption at rest', 'PR.DS', 3, 'daily', { datastore: ['yes'] }, { provided_by: 'key_store', allocation: 'hybrid' }),
  c('key_rotation', 'Yearly key rotation', 'PR.DS', 1, 'yearly', { datastore: ['yes'], data_class: ['pci', 'pii'] }, { depends_on: 'encryption', provided_by: 'key_store', allocation: 'hybrid' }),
  c('backup', 'Backups within the recovery point', 'PR.DS', 3, 'daily', { datastore: ['yes'], hosting: NOT_SAAS }, { provided_by: 'backup', allocation: 'common', feed: 'backup_jobs' }),
  c('dr_exercise', 'Yearly disaster-recovery exercise', 'RC.RP', 2, 'yearly', { tier: [1] }, { depends_on: 'backup', feed: 'dr_exercises' }),
  c('vuln_sla', 'Vulnerabilities fixed within their SLA', 'ID.RA', 3, 'per finding', { hosting: NOT_SAAS }, { feed: null }),
  c('mfa', 'MFA enforced', 'PR.AA', 3, 'daily', {}, { provided_by: 'identity_provider', allocation: 'common' }),
  c('access_review', 'Quarterly access review', 'PR.AA', 2, 'quarterly', { data_class: ['pci', 'pii', 'confidential'] }, { feed: 'access_reviews' }),
  c('logging', 'Central logging', 'PR.PS', 2, 'daily', { hosting: NOT_SAAS }, { provided_by: 'log_pipeline', allocation: 'hybrid', feed: 'logging_coverage' }),
  c('privileged_access', 'Privileged accounts vaulted', 'PR.AA', 3, 'daily', { tier: [1, 2] }, { depends_on: 'mfa', provided_by: 'vault', allocation: 'hybrid', feed: 'privileged_vault' }),
  c('edr', 'Endpoint detection on every host', 'DE.CM', 2, 'daily', { hosting: NOT_SAAS }, { provided_by: 'edr', allocation: 'hybrid', feed: 'edr_coverage' }),
  c('ownership', 'An accountable owner', 'GV.RR', 1, 'daily', { lifecycle: ['build', 'active', 'retiring'] }, { feed: null }),
];
export const CONTROL: Record<ControlId, Control> = Object.fromEntries(CONTROLS.map((x) => [x.id, x])) as Record<ControlId, Control>;

/** How a control relates to a framework's requirement, in NIST IR 8477's words. */
export type Relationship = 'subset of' | 'intersects with' | 'equal' | 'superset of';
export interface Requirement {
  control: ControlId;
  framework: 'NIST CSF 2.0' | 'ISO/IEC 27001:2022' | 'PCI DSS v4.0.1' | 'SOC 2';
  requirement: string;
  relationship: Relationship;
}
const R = (control: ControlId, ...maps: [Requirement['framework'], string, Relationship][]): Requirement[] => maps.map(([framework, requirement, relationship]) => ({ control, framework, requirement, relationship }));
const CSF = 'NIST CSF 2.0';
const ISO = 'ISO/IEC 27001:2022';
const PCI = 'PCI DSS v4.0.1';
const SOC = 'SOC 2';
export const REQUIREMENTS: readonly Requirement[] = [
  ...R('tls', [CSF, 'PR.DS-02', 'intersects with'], [ISO, 'A.8.24', 'subset of'], [PCI, '4.2.1', 'intersects with'], [SOC, 'CC6.7', 'intersects with']),
  ...R('waf', [CSF, 'PR.IR-01', 'subset of'], [ISO, 'A.8.20', 'subset of'], [PCI, '6.4.2', 'equal'], [SOC, 'CC6.6', 'subset of']),
  ...R('pentest', [CSF, 'ID.RA-01', 'subset of'], [ISO, 'A.8.8', 'subset of'], [PCI, '11.4.1', 'intersects with'], [SOC, 'CC4.1', 'subset of']),
  ...R('encryption', [CSF, 'PR.DS-01', 'equal'], [ISO, 'A.8.24', 'subset of'], [PCI, '3.5.1', 'intersects with'], [SOC, 'CC6.1', 'subset of']),
  ...R('key_rotation', [CSF, 'PR.DS-01', 'subset of'], [ISO, 'A.8.24', 'subset of'], [PCI, '3.7.4', 'intersects with'], [SOC, 'CC6.1', 'subset of']),
  ...R('backup', [CSF, 'PR.DS-11', 'equal'], [ISO, 'A.8.13', 'equal'], [SOC, 'A1.2', 'intersects with']),
  ...R('dr_exercise', [CSF, 'RC.RP-01', 'intersects with'], [ISO, 'A.5.30', 'subset of'], [SOC, 'A1.3', 'equal']),
  ...R('vuln_sla', [CSF, 'ID.RA-01', 'intersects with'], [CSF, 'PR.PS-02', 'intersects with'], [ISO, 'A.8.8', 'subset of'], [PCI, '6.3.3', 'intersects with'], [PCI, '11.3.1', 'intersects with'], [SOC, 'CC7.1', 'subset of']),
  ...R('mfa', [CSF, 'PR.AA-03', 'subset of'], [ISO, 'A.8.5', 'subset of'], [PCI, '8.4.2', 'intersects with'], [SOC, 'CC6.1', 'subset of']),
  ...R('access_review', [CSF, 'PR.AA-05', 'subset of'], [ISO, 'A.5.18', 'subset of'], [PCI, '7.2.4', 'equal'], [SOC, 'CC6.3', 'intersects with']),
  ...R('logging', [CSF, 'PR.PS-04', 'equal'], [ISO, 'A.8.15', 'subset of'], [PCI, '10.2.1', 'intersects with'], [SOC, 'CC7.2', 'subset of']),
  ...R('privileged_access', [CSF, 'PR.AA-05', 'subset of'], [ISO, 'A.8.2', 'subset of'], [PCI, '7.2.2', 'intersects with'], [SOC, 'CC6.1', 'subset of']),
  ...R('edr', [CSF, 'DE.CM-09', 'subset of'], [ISO, 'A.8.7', 'subset of'], [PCI, '5.2.1', 'intersects with'], [SOC, 'CC6.8', 'subset of']),
  ...R('ownership', [CSF, 'GV.RR-02', 'subset of'], [CSF, 'ID.AM-02', 'intersects with'], [ISO, 'A.5.9', 'intersects with'], [PCI, '12.5.1', 'intersects with'], [SOC, 'CC1.3', 'subset of']),
];

/** Whether a control applies to an application on its day: the catalogue's conditions, every one. */
export function appliesTo(control: ControlId | Control, a: Pick<AppOn, keyof AppAttrs | 'lifecycle'>): boolean {
  const x = (typeof control === 'string' ? CONTROL[control] : control).applies;
  return x.lifecycle.includes(a.lifecycle) && (!x.exposure || x.exposure.includes(a.exposure)) && (!x.tier || x.tier.includes(a.tier)) && (!x.data_class || x.data_class.includes(a.data_class)) && (!x.datastore || x.datastore.includes(a.datastore)) && (!x.hosting || x.hosting.includes(a.hosting));
}

// ------------------------------------------------------------------ the world

interface ExceptionDraw {
  id: string;
  app: string;
  control: ControlId;
  reason: string;
  compensating: string | null;
  versions: { version: number; from: string; to: string; original: string | null; approved: string }[];
}

export interface Finding {
  id: string;
  app: string;
  source: 'scan' | 'pentest';
  plugin: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  found: string;
  due: string;
  fixed: string;
  reopen: { at: string; fixed: string } | null;
}

export interface Larkspur {
  seed: number;
  units: readonly Unit[];
  unit: ReadonlyMap<string, Unit>;
  children: ReadonlyMap<string, readonly string[]>;
  apps: readonly AppDraw[];
  people: ReadonlyMap<string, string>;
  tenures: ReadonlyMap<string, readonly Tenure[]>;
  vacancies: ReadonlyMap<string, Vacancy>;
  exceptions: readonly ExceptionDraw[];
  exceptionsOf: ReadonlyMap<string, readonly ExceptionDraw[]>;
  cache: { findings: Map<string, Finding[]>; cycles: Map<string, Cycle[]>; apps: Map<string, AppOn[]> };
}

/** The world, from the seed: the organisation and its leaders over time, the applications, the exceptions. */
export function larkspur(o: LarkspurOptions = {}): Larkspur {
  const seed = o.seed ?? 7;
  const units = drawUnits(seed);
  const unit = new Map(units.map((u) => [u.id, u]));
  const children = new Map<string, string[]>();
  for (const u of units) if (u.parent) children.set(u.parent, [...(children.get(u.parent) ?? []), u.id]);
  // People: one name a person, never two alike. Those in post before the span first, then those hired during it.
  const names = FIRST.flatMap((f) => LAST.map((l) => `${f} ${l}`)).sort((x, y) => uniform(seed, 'person', x) - uniform(seed, 'person', y));
  const people = new Map<string, string>();
  const tenures = new Map<string, Tenure[]>();
  const vacancies = new Map<string, Vacancy>();
  let hired = 0;
  units.forEach((u, i) => {
    const incumbent = `P-${pad(i + 1, 4)}`;
    people.set(incumbent, names[i]!);
    const since = between('2015-01-01', addDays(LARKSPUR_FROM, -30), uniform(seed, u.id, 'since'));
    const list: Tenure[] = [];
    if (u.level !== 'group' && uniform(seed, u.id, 'change') < 0.33) {
      const at = between(addDays(LARKSPUR_FROM, -90), LARKSPUR_TO, uniform(seed, u.id, 'change-at'));
      const gap = int(20, 60, uniform(seed, u.id, 'gap'));
      const hire = `P-${pad(2001 + hired, 4)}`;
      people.set(hire, names[600 + hired]!);
      hired++;
      list.push({ person: incumbent, unit: u.id, from: null, to: at, since, leave: null });
      list.push({ person: hire, unit: u.id, from: addDays(at, gap), to: null, since: addDays(at, gap), leave: null });
      vacancies.set(u.id, { from: at, to: addDays(at, gap), acting: uniform(seed, u.id, 'acting') < 0.75, actingFrom: addDays(at, int(0, 4, uniform(seed, u.id, 'acting-from'))) });
    } else list.push({ person: incumbent, unit: u.id, from: null, to: null, since, leave: null });
    // A few take leave: two weeks to three months inside the span, most with someone acting.
    const last = list[list.length - 1]!;
    const start = last.from ?? addDays(LARKSPUR_FROM, -60);
    if (u.level !== 'group' && uniform(seed, last.person, 'leave') < 0.05 && daysFrom(start, LARKSPUR_TO) > 30) {
      const from = between(start, addDays(LARKSPUR_TO, -14), uniform(seed, last.person, 'leave-at'));
      last.leave = { from, to: addDays(from, int(14, 90, uniform(seed, last.person, 'leave-for'))), acting: uniform(seed, last.person, 'leave-acting') < 0.85 };
    }
    tenures.set(u.id, list);
  });
  const apps = drawApps(seed, o.apps ?? 2600, units);
  // Exceptions: about three in a hundred of what applies to an application, at some time across two years, so about one
  // in a hundred is active on a day. A fifth are extended once, the extension a new version that keeps the first expiry.
  const exceptions: ExceptionDraw[] = [];
  for (const a of apps) {
    const on = { ...a.base, lifecycle: 'active' as Lifecycle };
    for (const control of CONTROLS) {
      if (control.id === 'ownership' || !appliesTo(control, on)) continue;
      const u = (k: string) => uniform(seed, a.id, control.id, 'exception', k);
      if (u('is') >= 0.03) continue;
      const from = between(addDays(LARKSPUR_FROM, -365), LARKSPUR_TO, u('from'));
      if (from < a.goLive) continue;
      const to = addDays(from, u('length') < 0.6 ? 180 : 365);
      const versions: ExceptionDraw['versions'] = [{ version: 1, from, to, original: null, approved: addDays(from, -int(1, 10, u('approved'))) }];
      if (u('extended') < 0.2) versions.push({ version: 2, from: addDays(to, 1), to: addDays(to, u('extension') < 0.5 ? 90 : 180), original: to, approved: addDays(to, -int(3, 14, u('re-approved'))) });
      exceptions.push({
        id: `EX-${pad(exceptions.length + 1, 5)}`,
        app: a.id,
        control: control.id,
        reason: pick(['vendor fix pending', 'legacy platform', 'decommission planned', 'compensating control in place', 'change freeze for a release'], u('reason')),
        compensating: u('compensating') < 0.5 ? pick(['network isolation', 'weekly manual review', 'WAF virtual patch', 'restricted access'], u('compensating-with')) : null,
        versions,
      });
    }
  }
  const exceptionsOf = new Map<string, ExceptionDraw[]>();
  for (const e of exceptions) exceptionsOf.set(`${e.app}|${e.control}`, [...(exceptionsOf.get(`${e.app}|${e.control}`) ?? []), e]);
  return { seed, units, unit, children, apps, people, tenures, vacancies, exceptions, exceptionsOf, cache: { findings: new Map(), cycles: new Map(), apps: new Map() } };
}

// ------------------------------------------------------------------ the organisation on a day

/** An application's draw, by its id: what never changes with the day it is read on. */
const drawOf = (w: Larkspur, id: string): AppDraw => w.apps[Number(id.slice(4)) - 1]!;

const holderOf = (w: Larkspur, unit: string, d: string): Tenure | null => w.tenures.get(unit)!.find((t) => (t.from === null || t.from <= d) && (t.to === null || d < t.to)) ?? null;
const onLeave = (t: Tenure, d: string) => !!t.leave && t.leave.from <= d && d < t.leave.to;

/** Who acts for a unit on a day: a peer's leader (the first of its siblings, in the unit's own order, who is in post and
 * not on leave), else the leader above. Named only during a vacancy or a leave that has someone acting. */
function actingFor(w: Larkspur, unit: string, d: string): string | null {
  const u = w.unit.get(unit)!;
  const vacancy = w.vacancies.get(unit);
  const holder = holderOf(w, unit, d);
  const named = (vacancy && vacancy.from <= d && d < vacancy.to && vacancy.acting && d >= vacancy.actingFrom) || (holder && onLeave(holder, d) && holder.leave!.acting);
  if (!named || !u.parent) return null;
  const peers = w.children.get(u.parent)!.filter((s) => s !== unit).sort((x, y) => uniform(w.seed, unit, 'peer', x) - uniform(w.seed, unit, 'peer', y));
  for (const s of peers) {
    const h = holderOf(w, s, d);
    if (h && !onLeave(h, d)) return h.person;
  }
  const above = holderOf(w, u.parent, d);
  return above ? above.person : null;
}

/** The person a unit answers to on a day: its leader (on leave or not), else whoever acts, else the leader above. */
export function leaderOf(w: Larkspur, unit: string, d: string): string | null {
  const h = holderOf(w, unit, d);
  if (h) return h.person;
  const acting = actingFor(w, unit, d);
  if (acting) return acting;
  const parent = w.unit.get(unit)!.parent;
  return parent ? leaderOf(w, parent, d) : null;
}

export interface UnitOn {
  org_unit_id: string;
  parent_id: string;
  name: string;
  level: Level;
  leader_id: string;
  acting_leader_id: string;
  cost_centre: string;
}

export interface PersonOn {
  person_id: string;
  display_name: string;
  title: string;
  manager_id: string;
  org_unit_id: string;
  status: 'active' | 'leave' | 'left';
  in_role_since: string;
}

/** The HR extract on a day: every unit with its leader and acting leader, every leader in post, and those who left in
 * the thirty days before (status `left`). */
export function orgOn(w: Larkspur, d: string): { units: UnitOn[]; people: PersonOn[] } {
  const units: UnitOn[] = [];
  const people: PersonOn[] = [];
  for (const u of w.units) {
    const h = holderOf(w, u.id, d);
    units.push({ org_unit_id: u.id, parent_id: u.parent ?? '', name: u.name, level: u.level, leader_id: h?.person ?? '', acting_leader_id: actingFor(w, u.id, d) ?? '', cost_centre: u.cost_centre });
    const manager = u.parent ? leaderOf(w, u.parent, d) ?? '' : '';
    if (h) people.push({ person_id: h.person, display_name: w.people.get(h.person)!, title: TITLES[u.level], manager_id: manager, org_unit_id: u.id, status: onLeave(h, d) ? 'leave' : 'active', in_role_since: h.since });
    for (const t of w.tenures.get(u.id)!) {
      if (t.to && t.to <= d && d < addDays(t.to, 30)) people.push({ person_id: t.person, display_name: w.people.get(t.person)!, title: TITLES[u.level], manager_id: u.parent ? leaderOf(w, u.parent, addDays(t.to, -1)) ?? '' : '', org_unit_id: u.id, status: 'left', in_role_since: t.since });
    }
  }
  return { units, people };
}

/** Whether an application has an accountable owner on a day: its team is in the extract with a leader in post and not
 * on leave, or someone acting. The derived `ownership` control's truth, for the tests and the answer key. */
export function ownedOn(w: Larkspur, team: string, d: string): boolean {
  const h = holderOf(w, team, d);
  return (!!h && !onLeave(h, d)) || !!actingFor(w, team, d);
}

// ------------------------------------------------------------------ the applications on a day

function lifecycleOn(a: AppDraw, d: string): Lifecycle {
  if (d < a.goLive) return 'build';
  if (a.retireBy && d >= a.retireBy) return 'retired';
  if (a.retireBy && d >= addDays(a.retireBy, -90)) return 'retiring';
  return 'active';
}

/** The CMDB on a day: every application created by then and not yet gone (sixty days after it retires), with its type
 * and owner as of the day. */
export function appsOn(w: Larkspur, d: string): AppOn[] {
  const known = w.cache.apps.get(d);
  if (known) return known;
  const out: AppOn[] = [];
  for (const a of w.apps) {
    if (d < a.created || (a.retireBy && d >= addDays(a.retireBy, 60))) continue;
    const attrs: AppAttrs = a.change && a.change.at <= d ? { ...a.base, ...a.change.set } : a.base;
    const owner = a.move && a.move.at <= d ? a.move.to : a.owner;
    const lifecycle = lifecycleOn(a, d);
    const touched = [a.created, a.goLive, a.change?.at, a.move?.at, a.retireBy ? addDays(a.retireBy, -90) : undefined, a.retireBy ?? undefined].filter((x): x is string => !!x && x <= d).sort();
    const updated = touched[touched.length - 1] ?? a.created;
    const deps = platformsOf(w.seed, a.id, attrs, w.unit.get(owner)!.segment);
    out.push({ app_id: a.id, name: a.name, owner_team_id: owner, ...attrs, platform_id: deps.runtime ?? '', lifecycle, created_on: a.created, go_live: a.goLive, retire_by: a.retireBy ?? '', updated_at: `${updated}T${pad(int(8, 18, uniform(w.seed, a.id, 'updated', updated)), 2)}:${pad(int(0, 59, uniform(w.seed, a.id, 'updated-m', updated)), 2)}:00Z`, deps });
  }
  if (w.cache.apps.size > 6) w.cache.apps.clear();
  w.cache.apps.set(d, out);
  return out;
}

// ------------------------------------------------------------------ statuses: scans, SLAs, findings

export type Status = 'pass' | 'fail' | 'not_assessed';

/** The share failing a scan on an ordinary day, for a tier 3, internal, active application in a department kept as usual.
 * The controls a platform provides fail rarely on their own: their failures come together, when the platform does. */
const SCAN_FAIL: Partial<Record<ControlId, number>> = { tls: 0.04, waf: 0.05, encryption: 0.1, backup: 0.08, mfa: 0.05, logging: 0.08, privileged_access: 0.1, edr: 0.06 };

function riskOf(w: Larkspur, a: AppOn, control: ControlId): number {
  let r = w.unit.get(a.owner_team_id)!.propensity;
  if (a.tier === 1) r *= 0.55;
  else if (a.tier === 2) r *= 0.8;
  if (a.lifecycle === 'retiring') r *= 2.2;
  if (a.data_class === 'pci' || a.data_class === 'pii') r *= 0.8;
  if (a.exposure === 'internet' && (control === 'mfa' || control === 'logging')) r *= 1.3;
  if (a.hosting === 'onprem' && (control === 'backup' || control === 'logging')) r *= 1.9;
  if (a.platform_id.startsWith('vmf-') && (control === 'encryption' || control === 'edr' || control === 'logging')) r *= 1.4;
  if (control === 'mfa' && a.deps.idp === 'local') r *= 4;
  if (control === 'mfa' && a.deps.idp === 'idp-legacy') r *= 2;
  return r;
}

/** Whether an exception for the pair is in force on the day (approved, started, not yet expired). */
export function exceptedOn(w: Larkspur, app: string, control: ControlId, d: string): boolean {
  return (w.exceptionsOf.get(`${app}|${control}`) ?? []).some((e) => e.versions.some((v) => v.approved <= d && v.from <= d && d <= v.to));
}

/** A scan's standing: a fortnight at a time (each application's fortnights starting on its own day), a rare daily flip.
 * A failure under an exception is five times as likely to stand: what is accepted is left unfixed. Encryption and backup
 * share the datastore's health, TLS and the WAF the endpoint's. */
function scanFails(w: Larkspur, a: AppOn, control: ControlId, d: string): boolean {
  const seed = w.seed;
  const rate = Math.min(0.9, (SCAN_FAIL[control] ?? 0.08) * riskOf(w, a, control) * (exceptedOn(w, a.app_id, control, d) ? 5 : 1));
  const block = (x: ControlId) => Math.floor((dayNumber(d) + Math.floor(uniform(seed, a.app_id, x, 'offset') * 14)) / 14);
  const own = uniform(seed, a.app_id, control, 'block', block(control));
  const draw = control === 'backup' ? 0.5 * uniform(seed, a.app_id, 'encryption', 'block', block('encryption')) + 0.5 * own : control === 'waf' ? 0.4 * uniform(seed, a.app_id, 'tls', 'block', block('tls')) + 0.6 * own : own;
  const failing = draw < rate;
  return uniform(seed, a.app_id, control, 'flip', d) < 0.01 ? !failing : failing;
}

/** An SLA control's period and the dates its due dates cluster on, as at work: fiscal dates, quarter ends. */
const SLA: Partial<Record<ControlId, { period: number; cluster: { dates: string[]; share: number } | null; late: number }>> = {
  pentest: { period: 365, cluster: { dates: ['2023-03-15', '2024-03-15'], share: 0.5 }, late: 0.2 },
  dr_exercise: { period: 365, cluster: { dates: ['2023-03-22', '2024-03-22'], share: 0.6 }, late: 0.1 },
  key_rotation: { period: 365, cluster: null, late: 0.1 },
  access_review: { period: 91, cluster: { dates: ['2023-03-31', '2023-06-30', '2023-09-29', '2023-12-29', '2024-03-29'], share: 0.7 }, late: 0.15 },
};
export const SLA_CONTROLS = Object.keys(SLA) as ControlId[];

interface Cycle {
  due: string;
  done: string;
}

/** An application's cycles of an SLA control: from a first due date (the cluster's for those in it, else an anchor) every
 * period, each completed 5 to 40 days early or, at the late rate (the usual, scaled by the team's propensity), 3 to 45
 * days late. */
function cycles(w: Larkspur, a: { app_id: string }, control: ControlId): Cycle[] {
  const key = `${a.app_id}|${control}`;
  const known = w.cache.cycles.get(key);
  if (known) return known;
  const s = SLA[control]!;
  const seed = w.seed;
  const lateRate = Math.min(0.6, s.late * w.unit.get(drawOf(w, a.app_id).owner)!.propensity);
  let dues: string[];
  if (s.cluster && uniform(seed, a.app_id, control, 'cluster') < s.cluster.share) dues = s.cluster.dates.slice();
  else {
    dues = [];
    for (let d = addDays(LARKSPUR_FROM, -Math.floor(uniform(seed, a.app_id, control, 'anchor') * s.period)); d <= addDays(LARKSPUR_TO, s.period); d = addDays(d, s.period)) dues.push(d);
  }
  const out = dues.map((due) => {
    const late = uniform(seed, a.app_id, control, 'late', due) < lateRate;
    const u = uniform(seed, a.app_id, control, 'when', due);
    return { due, done: late ? addDays(due, int(3, 45, u)) : addDays(due, -int(5, 40, u)) };
  });
  if (w.cache.cycles.size > 100_000) w.cache.cycles.clear();
  w.cache.cycles.set(key, out);
  return out;
}

/** An SLA's state on a day: the last completion, the due date to meet (the one missed, while overdue), and whether it is
 * overdue. */
export function slaOn(w: Larkspur, a: { app_id: string }, control: ControlId, d: string): { last: string | null; nextDue: string | null; overdue: boolean } {
  let last: string | null = null;
  let nextDue: string | null = null;
  let missed: string | null = null;
  for (const cy of cycles(w, a, control)) {
    if (cy.done <= d && (!last || cy.done > last)) last = cy.done;
    if (cy.due < d && cy.done > d && (!missed || cy.due < missed)) missed = cy.due;
    if (cy.due >= d && (!nextDue || cy.due < nextDue)) nextDue = cy.due;
  }
  if (!nextDue && last) nextDue = addDays(last, SLA[control]!.period);
  return { last, nextDue: missed ?? nextDue, overdue: missed !== null };
}

/** A control's status as its own tool reports it, before silver applies exceptions, compensation and dependencies. Key
 * rotation fails where encryption at rest does: there is no managed key to rotate. */
export function rawStatus(w: Larkspur, control: ControlId, a: AppOn, d: string): Status {
  if (uniform(w.seed, a.app_id, control, 'na', d) < 0.01) return 'not_assessed';
  if (control === 'key_rotation' && appliesTo('encryption', a) && rawStatus(w, 'encryption', a, d) === 'fail') return 'fail';
  if (SLA[control]) return slaOn(w, a, control, d).overdue ? 'fail' : 'pass';
  return scanFails(w, a, control, d) ? 'fail' : 'pass';
}

export const SEVERITY_DAYS = { critical: 15, high: 30, medium: 90, low: 180 } as const;
const PATCH_DAYS: string[] = [];
for (let y = 2022; y <= 2024; y++) for (let m = 1; m <= 12; m++) PATCH_DAYS.push(patchTuesday(y, m));

/**
 * An application's findings across the span: a batch each Patch Tuesday (more for internet-facing and legacy ones), a
 * few found on other days, and those its penetration tests report. Each is due by its severity's SLA and fixed before it
 * or, at the late rate (one in eight, scaled by the team's propensity), 2 to 40 days after; three in a hundred are found
 * again after a fix (re-opened), keeping their first-found date.
 */
export function findingsOf(w: Larkspur, a: { app_id: string }): Finding[] {
  const known = w.cache.findings.get(a.app_id);
  if (known) return known;
  const seed = w.seed;
  const draw = drawOf(w, a.app_id);
  const out: Finding[] = [];
  const lateRate = Math.min(0.5, 0.12 * w.unit.get(draw.owner)!.propensity);
  const legacy = !!platformsOf(seed, draw.id, draw.base, w.unit.get(draw.owner)!.segment).runtime?.startsWith('vmf-');
  const severity = (u: number): Finding['severity'] => weighted([['critical', 0.12], ['high', 0.43], ['medium', 0.33], ['low', 0.12]] as const, u);
  const add = (source: Finding['source'], found: string, sev: Finding['severity'], key: string) => {
    if (found < draw.goLive || (draw.retireBy && found >= draw.retireBy)) return;
    const u = (k: string) => uniform(seed, a.app_id, key, k);
    const due = addDays(found, SEVERITY_DAYS[sev]);
    const fixed = u('late') < lateRate ? addDays(due, int(2, 40, u('late-by'))) : addDays(found, int(2, Math.max(2, SEVERITY_DAYS[sev] - 1), u('fix')));
    const reopenAt = addDays(fixed, int(10, 40, u('reopen-at')));
    out.push({ id: `F-${a.app_id.slice(4)}-${pad(out.length + 1, 3)}`, app: a.app_id, source, plugin: `VUL-${int(10000, 99999, u('plugin'))}`, cve: `CVE-${found.slice(0, 4)}-${int(10000, 49999, u('cve'))}`, severity: sev, found, due, fixed, reopen: u('reopen') < 0.03 ? { at: reopenAt, fixed: addDays(reopenAt, int(5, 30, u('refix'))) } : null });
  };
  const mean = 0.85 * (draw.base.exposure === 'internet' ? 1.5 : 1) * (draw.retireBy ? 1.3 : 1) * (legacy ? 1.4 : 1);
  for (const pt of PATCH_DAYS) {
    if (pt < addDays(LARKSPUR_FROM, -200) || pt > LARKSPUR_TO) continue;
    const n = Math.floor(mean) + (uniform(seed, a.app_id, 'batch', pt) < mean - Math.floor(mean) ? 1 : 0);
    for (let i = 0; i < n; i++) add('scan', pt, severity(uniform(seed, a.app_id, 'sev', pt, i)), `${pt}#${i}`);
  }
  for (let wk = dayNumber(addDays(LARKSPUR_FROM, -200)); wk <= dayNumber(LARKSPUR_TO); wk += 7) {
    if (uniform(seed, a.app_id, 'other', wk) < 0.05) add('scan', dayOf(wk + int(0, 6, uniform(seed, a.app_id, 'other-day', wk))), severity(uniform(seed, a.app_id, 'other-sev', wk)), `w${wk}`);
  }
  if (appliesTo('pentest', { ...draw.base, lifecycle: 'active' })) {
    for (const cy of cycles(w, a, 'pentest')) {
      const n = int(0, 3, uniform(seed, a.app_id, 'pentest-findings', cy.done));
      for (let i = 0; i < n; i++) add('pentest', cy.done, uniform(seed, a.app_id, 'pentest-sev', cy.done, i) < 0.4 ? 'high' : 'medium', `p${cy.done}#${i}`);
    }
  }
  out.sort((x, y) => (x.found < y.found ? -1 : x.found > y.found ? 1 : x.id < y.id ? -1 : 1));
  if (w.cache.findings.size > 20_000) w.cache.findings.clear();
  w.cache.findings.set(a.app_id, out);
  return out;
}

/** A finding's state on a day: open (new for its first three days), re-opened, fixed in the last thirty days, or not
 * listed. */
export function findingOn(f: Finding, d: string): { status: 'new' | 'active' | 're-opened' | 'fixed'; fixedOn: string | null } | null {
  if (d < f.found) return null;
  if (d < f.fixed) return { status: daysFrom(f.found, d) < 3 ? 'new' : 'active', fixedOn: null };
  if (f.reopen && f.reopen.at <= d) {
    if (d < f.reopen.fixed) return { status: 're-opened', fixedOn: null };
    return d < addDays(f.reopen.fixed, 30) ? { status: 'fixed', fixedOn: f.reopen.fixed } : null;
  }
  return d < addDays(f.fixed, 30) ? { status: 'fixed', fixedOn: f.fixed } : null;
}

/** Whether the scanner reached an application on a day, and whether it logged in. A few in a thousand aren't reached on
 * a day; a few in a thousand are scanned without logging in for a week at a time. */
export function scanOn(w: Larkspur, a: AppOn, d: string): { scanned: boolean; credentialed: boolean } {
  return { scanned: uniform(w.seed, a.app_id, 'reached', d) >= 0.004, credentialed: uniform(w.seed, a.app_id, 'credentialed', Math.floor(dayNumber(d) / 7)) >= 0.006 };
}

const scanned = (a: AppOn) => a.hosting !== 'saas' && a.lifecycle !== 'retired';

/** The vulnerability SLA's truth on a day, for the tests and the answer key: not assessed without a credentialed scan,
 * failing with an open critical or high scan finding past its due date. */
export function vulnOn(w: Larkspur, a: AppOn, d: string): Status {
  const s = scanOn(w, a, d);
  if (!s.scanned || !s.credentialed) return 'not_assessed';
  return findingsOf(w, a).some((f) => f.source === 'scan' && (f.severity === 'critical' || f.severity === 'high') && f.due < d && (findingOn(f, d)?.status ?? 'fixed') !== 'fixed') ? 'fail' : 'pass';
}

// ------------------------------------------------------------------ the files

/** The evidence feeds, a file a control. */
export const EVIDENCE_FILES = ['tls', 'waf', 'pentest_schedule', 'encryption', 'key_rotation', 'backup_jobs', 'dr_exercises', 'mfa', 'access_reviews', 'logging_coverage', 'privileged_vault', 'edr_coverage'] as const;
export const DAILY_FILES = ['hr_org_units', 'hr_people', 'cmdb_apps', 'cloud_assets', 'control_catalog', 'control_requirements', 'exceptions', 'findings', ...EVIDENCE_FILES] as const;
export const FIXED_FILES = ['platforms', 'platform_links'] as const;
export type DailyFile = (typeof DAILY_FILES)[number];
export type EvidenceFile = (typeof EVIDENCE_FILES)[number];

/** Each file's columns and their types, as its header has them. */
export const COLUMNS: Record<DailyFile | (typeof FIXED_FILES)[number], readonly (readonly [string, 'TEXT' | 'INTEGER' | 'REAL'])[]> = {
  hr_org_units: [['org_unit_id', 'TEXT'], ['parent_id', 'TEXT'], ['name', 'TEXT'], ['level', 'TEXT'], ['leader_id', 'TEXT'], ['acting_leader_id', 'TEXT'], ['cost_centre', 'TEXT']],
  hr_people: [['person_id', 'TEXT'], ['display_name', 'TEXT'], ['title', 'TEXT'], ['manager_id', 'TEXT'], ['org_unit_id', 'TEXT'], ['status', 'TEXT'], ['in_role_since', 'TEXT']],
  cmdb_apps: [['app_id', 'TEXT'], ['name', 'TEXT'], ['owner_team_id', 'TEXT'], ['tier', 'INTEGER'], ['exposure', 'TEXT'], ['data_class', 'TEXT'], ['datastore', 'TEXT'], ['hosting', 'TEXT'], ['site', 'TEXT'], ['platform_id', 'TEXT'], ['lifecycle', 'TEXT'], ['created_on', 'TEXT'], ['go_live', 'TEXT'], ['retire_by', 'TEXT'], ['updated_at', 'TEXT']],
  cloud_assets: [['account_id', 'TEXT'], ['region', 'TEXT'], ['cluster', 'TEXT'], ['app_tag', 'TEXT'], ['resources', 'INTEGER']],
  control_catalog: [['control_id', 'TEXT'], ['name', 'TEXT'], ['csf_function', 'TEXT'], ['csf_category', 'TEXT'], ['weight', 'INTEGER'], ['cadence', 'TEXT'], ['applies_exposure', 'TEXT'], ['applies_tier', 'TEXT'], ['applies_data_class', 'TEXT'], ['applies_datastore', 'TEXT'], ['applies_hosting', 'TEXT'], ['applies_lifecycle', 'TEXT'], ['depends_on', 'TEXT'], ['compensated_by', 'TEXT'], ['provided_by', 'TEXT'], ['allocation', 'TEXT']],
  control_requirements: [['control_id', 'TEXT'], ['framework', 'TEXT'], ['requirement', 'TEXT'], ['relationship', 'TEXT']],
  exceptions: [['exception_id', 'TEXT'], ['version', 'INTEGER'], ['app_id', 'TEXT'], ['control_id', 'TEXT'], ['approver_id', 'TEXT'], ['reason', 'TEXT'], ['compensating_control', 'TEXT'], ['valid_from', 'TEXT'], ['valid_to', 'TEXT'], ['original_valid_to', 'TEXT'], ['approved_on', 'TEXT'], ['status', 'TEXT']],
  findings: [['finding_id', 'TEXT'], ['app_id', 'TEXT'], ['source', 'TEXT'], ['scanner', 'TEXT'], ['plugin', 'TEXT'], ['cve', 'TEXT'], ['severity', 'TEXT'], ['status', 'TEXT'], ['first_found', 'TEXT'], ['last_found', 'TEXT'], ['fixed_on', 'TEXT'], ['due_on', 'TEXT'], ['credentialed', 'TEXT']],
  tls: [['app_id', 'TEXT'], ['endpoint', 'TEXT'], ['ingress', 'TEXT'], ['issuer', 'TEXT'], ['protocol', 'TEXT'], ['not_after', 'TEXT'], ['private_link', 'TEXT'], ['status', 'TEXT']],
  waf: [['app_id', 'TEXT'], ['ingress', 'TEXT'], ['mode', 'TEXT'], ['ruleset_age_days', 'INTEGER'], ['status', 'TEXT']],
  pentest_schedule: [['app_id', 'TEXT'], ['last_test', 'TEXT'], ['next_due', 'TEXT'], ['tester', 'TEXT'], ['open_highs', 'INTEGER'], ['status', 'TEXT']],
  encryption: [['app_id', 'TEXT'], ['store_type', 'TEXT'], ['key_store', 'TEXT'], ['encrypted', 'TEXT'], ['status', 'TEXT']],
  key_rotation: [['app_id', 'TEXT'], ['key_store', 'TEXT'], ['last_rotated', 'TEXT'], ['next_due', 'TEXT'], ['key_age_days', 'INTEGER'], ['status', 'TEXT']],
  backup_jobs: [['app_id', 'TEXT'], ['controller', 'TEXT'], ['last_state', 'TEXT'], ['last_success', 'TEXT'], ['rpo_hours', 'INTEGER'], ['status', 'TEXT']],
  dr_exercises: [['app_id', 'TEXT'], ['last_exercise', 'TEXT'], ['next_due', 'TEXT'], ['rto_met', 'TEXT'], ['status', 'TEXT']],
  mfa: [['app_id', 'TEXT'], ['idp', 'TEXT'], ['registered_pct', 'INTEGER'], ['enforced', 'TEXT'], ['status', 'TEXT']],
  access_reviews: [['app_id', 'TEXT'], ['last_review', 'TEXT'], ['next_due', 'TEXT'], ['reviewers', 'INTEGER'], ['revoked', 'INTEGER'], ['status', 'TEXT']],
  logging_coverage: [['app_id', 'TEXT'], ['pipeline', 'TEXT'], ['forwarder_issuer', 'TEXT'], ['last_event', 'TEXT'], ['retention_days', 'INTEGER'], ['status', 'TEXT']],
  privileged_vault: [['app_id', 'TEXT'], ['vault', 'TEXT'], ['accounts', 'INTEGER'], ['unvaulted', 'INTEGER'], ['status', 'TEXT']],
  edr_coverage: [['app_id', 'TEXT'], ['hosts', 'INTEGER'], ['reporting', 'INTEGER'], ['reduced_functionality', 'INTEGER'], ['sensor_version', 'TEXT'], ['status', 'TEXT']],
  platforms: [['platform_id', 'TEXT'], ['kind', 'TEXT'], ['name', 'TEXT'], ['site', 'TEXT']],
  platform_links: [['platform_id', 'TEXT'], ['relation', 'TEXT'], ['target', 'TEXT'], ['allocation', 'TEXT']],
};

/** The control each evidence file carries. */
export const FILE_CONTROL: Record<EvidenceFile, ControlId> = Object.fromEntries(CONTROLS.filter((x) => x.feed).map((x) => [x.feed!, x.id])) as Record<EvidenceFile, ControlId>;

/** When each system exports its file, UTC, in the early hours of the day it describes. */
const EXPORTED_AT: Record<DailyFile, string> = { hr_org_units: '01:10', hr_people: '01:12', cmdb_apps: '02:05', cloud_assets: '02:40', control_catalog: '03:00', control_requirements: '03:01', exceptions: '03:20', findings: '04:05', tls: '04:30', waf: '04:35', pentest_schedule: '04:40', encryption: '04:45', key_rotation: '04:50', backup_jobs: '04:55', dr_exercises: '05:00', mfa: '05:05', access_reviews: '05:10', logging_coverage: '05:15', privileged_vault: '05:20', edr_coverage: '05:25' };
export const exportedAt = (file: DailyFile, d: string): string => `${d}T${EXPORTED_AT[file]}:00Z`;

const list = (xs: readonly (string | number)[] | null) => (xs ? xs.join(';') : '*');
const columnsOf = (file: keyof typeof COLUMNS) => COLUMNS[file].map(([name]) => name);

/** One application's row of an evidence file, given its status. */
function evidenceRow(w: Larkspur, file: EvidenceFile, a: AppOn, d: string, status: Status): Cell[] {
  const seed = w.seed;
  const u = (k: string) => uniform(seed, a.app_id, file, d, k);
  const steady = (k: string) => uniform(seed, a.app_id, file, k);
  const fail = status === 'fail';
  const na = status === 'not_assessed';
  const at = Date.parse(exportedAt(file, d));
  const control = FILE_CONTROL[file];
  switch (file) {
    case 'tls': {
      const expired = fail && u('how') < 0.4;
      return [a.app_id, `${a.name}.larkspur.example`, a.deps.ingress ?? '', a.deps.issuer, na ? null : fail && !expired ? 'TLS1.0' : u('protocol') < 0.6 ? 'TLS1.3' : 'TLS1.2', na ? null : addDays(d, expired ? -int(1, 20, u('expired')) : int(20, 200, u('left'))), a.exposure === 'partner' && steady('private') < 0.5 ? 'yes' : 'no', status];
    }
    case 'waf': {
      const how = u('how');
      return [a.app_id, a.deps.ingress ?? '', na ? null : !fail ? 'block' : how < 0.5 ? 'monitor' : how < 0.8 ? 'off' : 'block', na ? null : fail && how >= 0.8 ? int(46, 200, u('age')) : int(0, 30, u('age')), status];
    }
    case 'encryption':
      return [a.app_id, pick(['postgres', 'oracle', 'sqlserver', 'object-store', 'document-db', 'files'], steady('store')), a.deps.key_store ?? '', na ? null : fail ? 'no' : 'yes', status];
    case 'backup_jobs': {
      const rpo = a.tier === 1 ? 4 : a.tier === 2 ? 24 : 72;
      const how = u('how');
      const hours = fail ? int(rpo + 1, rpo * 6, u('hours')) : int(1, rpo - 1, u('hours'));
      return [a.app_id, a.deps.backup ?? '', na ? null : !fail ? 'COMPLETED' : how < 0.5 ? 'FAILED' : how < 0.7 ? 'PARTIAL' : 'COMPLETED', na ? null : stamp(at - hours * 3600e3), rpo, status];
    }
    case 'mfa':
      return [a.app_id, a.deps.idp, na ? null : fail ? int(55, 100, u('registered')) : int(95, 100, u('registered')), na ? null : fail ? 'no' : 'yes', status];
    case 'logging_coverage': {
      const silent = fail && u('how') < 0.6;
      const minutes = silent ? int(25 * 60, 30 * 24 * 60, u('ago')) : int(1, 240, u('ago'));
      const retention = fail && !silent ? int(7, 60, steady('short')) : a.data_class === 'pci' ? 365 : int(90, 400, steady('retention'));
      return [a.app_id, a.deps.log_pipeline ?? '', a.deps.issuer === 'vendor' ? '' : a.deps.issuer, na ? null : stamp(at - minutes * 60e3), na ? null : retention, status];
    }
    case 'privileged_vault': {
      const accounts = int(2, 40, steady('accounts'));
      return [a.app_id, a.deps.vault ?? '', accounts, na ? null : fail ? int(1, Math.max(1, Math.floor(accounts / 3)), u('unvaulted')) : 0, status];
    }
    case 'edr_coverage': {
      const hosts = int(1, 40, steady('hosts'));
      const rfm = fail && (hosts === 1 || u('how') < 0.5);
      return [a.app_id, hosts, na ? null : fail && !rfm ? int(0, hosts - 1, u('reporting')) : hosts, na ? null : rfm ? int(1, hosts, u('rfm')) : 0, `7.${int(10, 14, uniform(seed, 'sensor', d.slice(0, 7), steady('ring') < 0.7 ? 'main' : 'slow'))}.${int(0, 9, uniform(seed, a.app_id, 'build', d.slice(0, 7)))}`, status];
    }
    case 'pentest_schedule': case 'key_rotation': case 'dr_exercises': case 'access_reviews': {
      const st = slaOn(w, a, control, d);
      const last = st.last ?? '';
      const next = st.nextDue ?? '';
      if (file === 'pentest_schedule') {
        const highs = findingsOf(w, a).filter((f) => f.source === 'pentest' && f.severity === 'high' && (findingOn(f, d)?.status ?? 'fixed') !== 'fixed').length;
        return [a.app_id, last, next, steady('tester') < 0.6 ? 'internal red team' : 'third party', na ? null : highs, status];
      }
      if (file === 'key_rotation') return [a.app_id, a.deps.key_store ?? '', last, next, na || !st.last ? null : daysFrom(st.last, d), status];
      if (file === 'dr_exercises') return [a.app_id, last, next, na ? null : fail && u('rto') < 0.3 ? 'no' : 'yes', status];
      return [a.app_id, last, next, na ? null : int(1, 4, u('reviewers')), na ? null : int(0, 12, u('revoked')), status];
    }
  }
}

/** A day's file, with nothing planted. Rows come in key order. */
export function dayFile(w: Larkspur, file: DailyFile, d: string): Table {
  const columns = columnsOf(file);
  const rows: Cell[][] = [];
  const apps = appsOn(w, d);
  switch (file) {
    case 'hr_org_units':
      for (const u of orgOn(w, d).units) rows.push([u.org_unit_id, u.parent_id, u.name, u.level, u.leader_id, u.acting_leader_id, u.cost_centre]);
      break;
    case 'hr_people':
      for (const x of orgOn(w, d).people.sort((a, b) => (a.person_id < b.person_id ? -1 : 1))) rows.push([x.person_id, x.display_name, x.title, x.manager_id, x.org_unit_id, x.status, x.in_role_since]);
      break;
    case 'cmdb_apps':
      for (const a of apps) rows.push([a.app_id, a.name, a.owner_team_id, a.tier, a.exposure, a.data_class, a.datastore, a.hosting, a.site, a.platform_id, a.lifecycle, a.created_on, a.go_live, a.retire_by, a.updated_at]);
      break;
    case 'cloud_assets':
      rows.push(...cloudRows(w, apps, d));
      break;
    case 'control_catalog':
      for (const x of CONTROLS) rows.push([x.id, x.name, x.csf_function, x.csf_category, x.weight, x.cadence, list(x.applies.exposure), list(x.applies.tier), list(x.applies.data_class), list(x.applies.datastore), list(x.applies.hosting), list(x.applies.lifecycle), x.depends_on ?? '', x.compensated_by ?? '', x.provided_by ?? '', x.allocation]);
      break;
    case 'control_requirements':
      for (const r of REQUIREMENTS) rows.push([r.control, r.framework, r.requirement, r.relationship]);
      break;
    case 'exceptions':
      rows.push(...exceptionRows(w, d));
      break;
    case 'findings':
      for (const a of apps) {
        if (!scanned(a)) continue;
        const scan = scanOn(w, a, d);
        const seen = scan.scanned ? d : addDays(d, -1);
        if (scan.scanned) rows.push([`SCAN-${a.app_id}`, a.app_id, 'scan', a.deps.scanner ?? '', 'SCAN-INFO', '', 'info', 'active', a.go_live < d ? a.go_live : d, d, '', '', scan.credentialed ? 'yes' : 'no']);
        for (const f of findingsOf(w, a)) {
          const on = findingOn(f, d);
          // A scanner that didn't reach the application today can't have found anything new on it today.
          if (!on || (!scan.scanned && f.found >= d)) continue;
          const open = on.status !== 'fixed';
          rows.push([f.id, a.app_id, f.source, f.source === 'scan' ? a.deps.scanner ?? '' : '', f.plugin, f.cve, f.severity, on.status, f.found, open ? seen : addDays(on.fixedOn!, -1), on.fixedOn ?? '', f.due, '']);
        }
      }
      break;
    default: {
      const control = FILE_CONTROL[file];
      for (const a of apps) if (appliesTo(control, a)) rows.push(evidenceRow(w, file, a, d, rawStatus(w, control, a, d)));
    }
  }
  return { columns, rows };
}

/** Every daily file of a day. */
export function dayFiles(w: Larkspur, d: string): Record<DailyFile, Table> {
  return Object.fromEntries(DAILY_FILES.map((f) => [f, dayFile(w, f, d)])) as Record<DailyFile, Table>;
}

/** The architecture inventory: the platforms, and a row for each dependency and each control a platform provides. */
export function fixedFiles(): Record<(typeof FIXED_FILES)[number], Table> {
  return {
    platforms: { columns: columnsOf('platforms'), rows: PLATFORMS.map((x) => [x.id, x.kind, x.name, x.site]) },
    platform_links: { columns: columnsOf('platform_links'), rows: PLATFORMS.flatMap((x) => [...x.depends_on.map((t) => [x.id, 'depends_on', t, ''] as Cell[]), ...x.provides.map(([t, how]) => [x.id, 'provides', t, how] as Cell[])]) },
  };
}

/** The risk register on a day: every version approved by then, active or expired in the last ninety days, its status
 * as of the day (approved, active, superseded once a later version is approved, expired). */
function exceptionRows(w: Larkspur, d: string): Cell[][] {
  const rows: Cell[][] = [];
  const draws = new Map(w.apps.map((a) => [a.id, a]));
  for (const e of w.exceptions) {
    const app = draws.get(e.app)!;
    if (d < app.created || (app.retireBy && d >= addDays(app.retireBy, 60))) continue;
    e.versions.forEach((v, i) => {
      if (v.approved > d || d > addDays(v.to, 90)) return;
      const next = e.versions[i + 1];
      const status = next && next.approved <= d ? 'superseded' : d < v.from ? 'approved' : d <= v.to ? 'active' : 'expired';
      const team = app.move && app.move.at <= v.approved ? app.move.to : app.owner;
      const approver = leaderOf(w, w.unit.get(team)!.department!, v.approved) ?? '';
      rows.push([e.id, v.version, e.app, e.control, approver, e.reason, e.compensating ?? '', v.from, v.to, v.original ?? '', v.approved, status]);
    });
  }
  return rows.sort((x, y) => (String(x[0]) < String(y[0]) ? -1 : String(x[0]) > String(y[0]) ? 1 : Number(x[1]) - Number(y[1])));
}

/** The cloud inventory on a day: a row an application tag in an account (its production account, and for most a
 * non-production one too), tags lingering up to a fortnight after an application retires, and a few tags each week in
 * a sandbox for an application nobody registered. */
function cloudRows(w: Larkspur, apps: readonly AppOn[], d: string): Cell[][] {
  const seed = w.seed;
  const rows: Cell[][] = [];
  const region = (site: Site) => (site === 'CLOUD-WEST' ? 'us-west-2' : 'us-east-1');
  const segCode = (team: string) => SEGMENTS[Number(w.unit.get(team)!.segment.slice(4)) - 1]![1].toLowerCase();
  const month = d.slice(0, 7);
  for (const a of apps) {
    if (a.hosting !== 'cloud') continue;
    if (a.lifecycle === 'retired' && d >= addDays(a.retire_by, int(0, 14, uniform(seed, a.app_id, 'cleanup')))) continue;
    rows.push([`acct-${segCode(a.owner_team_id)}-prod`, region(a.site), a.platform_id, a.app_id, int(3, 120, uniform(seed, a.app_id, 'resources', month))]);
    if (uniform(seed, a.app_id, 'nonprod') < 0.6) rows.push([`acct-${segCode(a.owner_team_id)}-nonprod`, region(a.site), '', a.app_id, int(1, 40, uniform(seed, a.app_id, 'resources-np', month))]);
  }
  const week = Math.floor(dayNumber(d) / 7);
  for (const [, code] of SEGMENTS) {
    if (uniform(seed, code, 'sandbox', week) < 0.7) rows.push([`acct-${code.toLowerCase()}-sandbox`, 'us-east-1', '', `APP-${9000 + int(0, 999, uniform(seed, code, 'sandbox-tag', week))}`, int(1, 15, uniform(seed, code, 'sandbox-n', week))]);
  }
  return rows.sort((x, y) => (String(x[0]) + String(x[3]) < String(y[0]) + String(y[3]) ? -1 : 1));
}
