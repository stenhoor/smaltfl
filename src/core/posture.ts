/**
 * The posture dashboard's model (ADR 0020 §6, Q-174): Control Posture read as its consumers read it, from the gold
 * datasets alone. The organisation as a tree (`dim_org`: each unit's parent, path and leader), each unit with its
 * roll-up (`org_posture`: the applications beneath it, the critical ones, the tier-weighted score and its coverage, the
 * critical applications failing, the items overdue and the exceptions expiring), the applications that don't resolve
 * under Unassigned, and a unit's score day by day over the days published (Q-178: a steady change is a trend to show,
 * not a day's news). Pure: the page reads the rows, this says what they are.
 */

/** A unit's level, as `dim_org` has it. */
export type Level = 'group' | 'segment' | 'business_unit' | 'department' | 'team' | 'unassigned';
export const LEVELS: readonly Level[] = ['group', 'segment', 'business_unit', 'department', 'team', 'unassigned'];
export const LEVEL_NAME: Record<Level, string> = { group: 'Group', segment: 'Segment', business_unit: 'Business unit', department: 'Department', team: 'Team', unassigned: 'Unassigned' };

/** A grade, as SecurityScorecard grades (ADR 0020 §4): A from 90, B from 80, C from 70, D from 60, F below. */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export function gradeOf(score: number | null): Grade | null {
  if (score === null || !Number.isFinite(score)) return null;
  return score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
}

export interface PostureUnit {
  id: string;
  name: string;
  level: Level;
  parent: string | null;
  /** Its leader's name, and how they lead it: their own, acting, or the leader above it (inherited). */
  leader: string | null;
  leaderHow: 'leader' | 'acting' | 'inherited' | null;
  applications: number;
  critical: number;
  score: number | null;
  coverage: number | null;
  failingCritical: number;
  overdue: number;
  expiring: number;
}

export interface PostureNode extends PostureUnit {
  grade: Grade | null;
  /** The units under it, the worst first: the lowest score, then the most critical applications failing. */
  children: PostureNode[];
}

export interface PostureTree {
  /** The group, at the top; null where `dim_org` names none. */
  root: PostureNode | null;
  /** The applications whose owner chain doesn't resolve (`org_posture`'s Unassigned): null where there are none. */
  unassigned: PostureNode | null;
  /** Units the roll-up names that the organisation doesn't, or units with a parent it doesn't list: said, not dropped. */
  strays: string[];
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => (v === null || v === undefined || v === '' ? 0 : Number(v));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const level = (v: unknown): Level => (LEVELS.includes(String(v) as Level) ? (String(v) as Level) : 'team');

/**
 * The tree, from `dim_org`'s rows (by column: `org_unit_id`, `name`, `level`, `parent_id`, `leader_name`, `leader_how`)
 * and `org_posture`'s (`org_unit_id`, `applications`, `critical`, `score`, `coverage`, `failing_critical`, `overdue`,
 * `expiring`). A unit without a roll-up row has nothing beneath it; a roll-up row for a unit the organisation doesn't
 * list is a stray.
 */
export function postureTree(org: readonly Row[], units: readonly Row[]): PostureTree {
  const roll = new Map(units.map((u) => [String(u.org_unit_id), u]));
  const nodes = new Map<string, PostureNode>();
  for (const o of org) {
    const id = String(o.org_unit_id);
    const r = roll.get(id) ?? {};
    const how = str(o.leader_how);
    const score = numOrNull(r.score);
    nodes.set(id, {
      id, name: str(o.name) ?? id, level: level(o.level), parent: str(o.parent_id),
      leader: str(o.leader_name), leaderHow: how === 'leader' || how === 'acting' || how === 'inherited' ? how : null,
      applications: num(r.applications), critical: num(r.critical), score, coverage: numOrNull(r.coverage),
      failingCritical: num(r.failing_critical), overdue: num(r.overdue), expiring: num(r.expiring),
      grade: gradeOf(score), children: [],
    });
  }
  const strays = units.map((u) => String(u.org_unit_id)).filter((id) => !nodes.has(id));
  let root: PostureNode | null = null;
  let unassigned: PostureNode | null = null;
  for (const n of nodes.values()) {
    if (n.level === 'unassigned') unassigned = n;
    else if (n.level === 'group' && n.parent === null) root ??= n;
    else if (n.parent && nodes.has(n.parent)) nodes.get(n.parent)!.children.push(n);
    else strays.push(n.id);
  }
  const worstFirst = (a: PostureNode, b: PostureNode) =>
    (a.score ?? Infinity) - (b.score ?? Infinity) || b.failingCritical - a.failingCritical || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  for (const n of nodes.values()) n.children.sort(worstFirst);
  return { root, unassigned: unassigned && unassigned.applications > 0 ? unassigned : null, strays };
}

/** Every unit of a tree, the root first, depth first. */
export function unitsOf(n: PostureNode | null): PostureNode[] {
  if (!n) return [];
  return [n, ...n.children.flatMap(unitsOf)];
}

/** How a unit is led, in words: "Ann Ash", "Ann Ash, acting", "Ann Ash, from the unit above", or null. */
export function leaderSaid(n: Pick<PostureUnit, 'leader' | 'leaderHow'>): string | null {
  if (!n.leader) return null;
  return n.leaderHow === 'acting' ? `${n.leader}, acting` : n.leaderHow === 'inherited' ? `${n.leader}, from the unit above` : n.leader;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** A unit's counts in words, the zeros left out: "412 applications · 3 critical failing · 17 overdue · 2 expiring". */
export function unitCounts(n: Pick<PostureUnit, 'applications' | 'failingCritical' | 'overdue' | 'expiring'>): string {
  return [
    plural(n.applications, 'application'),
    n.failingCritical ? `${fmt(n.failingCritical)} critical failing` : '',
    n.overdue ? `${fmt(n.overdue)} overdue` : '',
    n.expiring ? `${plural(n.expiring, 'exception')} expiring` : '',
  ].filter(Boolean).join(' · ');
}

/** A score with its coverage beside it, always (ADR 0020 §4: a score is only as good as what it covers). */
export function scoreSaid(n: Pick<PostureUnit, 'score' | 'coverage'>): string {
  const cov = n.coverage === null ? 'no evidence' : `coverage ${n.coverage.toFixed(0)}%`;
  return n.score === null ? `no score · ${cov}` : `${n.score.toFixed(1)} · ${cov}`;
}

/** A unit's score and coverage on a day published. */
export interface TrendPoint {
  day: string;
  score: number | null;
  coverage: number | null;
}

/**
 * A trend in words (Q-178): the first and last scores of the days known, and how far apart they are; "one day so far"
 * with fewer than two. A change under half a point is "steady".
 */
export function trendSaid(points: readonly TrendPoint[]): string {
  const known = points.filter((p) => p.score !== null);
  if (known.length < 2) return known.length ? 'One day so far: run more days to see the trend.' : 'No score yet.';
  const first = known[0]!;
  const last = known.at(-1)!;
  const d = last.score! - first.score!;
  const days = `over ${plural(known.length, 'day')} published`;
  return Math.abs(d) < 0.5 ? `Steady at ${last.score!.toFixed(1)} ${days}.` : `${d > 0 ? 'Up' : 'Down'} ${Math.abs(d).toFixed(1)} points, ${first.score!.toFixed(1)} to ${last.score!.toFixed(1)}, ${days}.`;
}
