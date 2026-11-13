/**
 * The posture dashboard's model (ADR 0020 §6, Q-174): the organisation as a tree from the gold rows, the worst first,
 * Unassigned beside it, strays said; grades, a unit's words, and a trend.
 */
import { describe, expect, it } from 'vitest';
import { gradeOf, leaderSaid, postureTree, scoreSaid, trendSaid, unitCounts, unitsOf } from '../src/core/posture.js';

const org = [
  { org_unit_id: 'GRP', name: 'Larkspur Group', level: 'group', parent_id: null, leader_name: 'Ada Ash', leader_how: 'leader' },
  { org_unit_id: 'SEG-1', name: 'Markets', level: 'segment', parent_id: 'GRP', leader_name: 'Bo Birch', leader_how: 'leader' },
  { org_unit_id: 'SEG-2', name: 'Retail', level: 'segment', parent_id: 'GRP', leader_name: 'Cy Cole', leader_how: 'acting' },
  { org_unit_id: 'BU-01', name: 'Payments', level: 'business_unit', parent_id: 'SEG-1', leader_name: 'Bo Birch', leader_how: 'inherited' },
  { org_unit_id: 'BU-02', name: 'Lending', level: 'business_unit', parent_id: 'SEG-1', leader_name: null, leader_how: null },
  { org_unit_id: 'TM-1', name: 'Cards', level: 'team', parent_id: 'BU-01', leader_name: 'Di Dale', leader_how: 'leader' },
  { org_unit_id: 'TM-9', name: 'Lost', level: 'team', parent_id: 'DEP-GONE', leader_name: null, leader_how: null },
  { org_unit_id: 'UNASSIGNED', name: 'Unassigned', level: 'unassigned', parent_id: null, leader_name: null, leader_how: null },
];
const roll = (id: string, score: number | null, o: Partial<Record<string, number>> = {}) => ({ org_unit_id: id, applications: 10, critical: 2, score, coverage: 95, failing_critical: 0, overdue: 0, expiring: 0, ...o });
const units = [roll('GRP', 84.2, { applications: 40 }), roll('SEG-1', 88), roll('SEG-2', 71.5, { failing_critical: 2 }), roll('BU-01', 92), roll('BU-02', 80), roll('TM-1', 92), roll('UNASSIGNED', 60, { applications: 3 }), roll('BU-99', 50)];

describe('the posture tree', () => {
  it('nests every unit under its parent, the worst first, with Unassigned beside it and strays said', () => {
    const t = postureTree(org, units);
    expect(t.root?.id).toBe('GRP');
    expect(t.root!.children.map((c) => c.id)).toEqual(['SEG-2', 'SEG-1']);
    expect(t.root!.children[1]!.children.map((c) => c.id)).toEqual(['BU-02', 'BU-01']);
    expect(unitsOf(t.root).map((u) => u.id)).toEqual(['GRP', 'SEG-2', 'SEG-1', 'BU-02', 'BU-01', 'TM-1']);
    expect(t.unassigned).toMatchObject({ id: 'UNASSIGNED', applications: 3, score: 60, grade: 'D' });
    // A roll-up for a unit the organisation doesn't list, and a unit whose parent it doesn't: said, never dropped quietly.
    expect(t.strays.sort()).toEqual(['BU-99', 'TM-9']);
    expect(t.root).toMatchObject({ grade: 'B', leader: 'Ada Ash', applications: 40 });
  });

  it('leaves Unassigned out where no application is under it, and keeps a unit with no roll-up as empty', () => {
    const t = postureTree(org, units.filter((u) => u.org_unit_id !== 'UNASSIGNED' && u.org_unit_id !== 'BU-02'));
    expect(t.unassigned).toBeNull();
    const lending = unitsOf(t.root).find((u) => u.id === 'BU-02')!;
    expect(lending).toMatchObject({ applications: 0, score: null, grade: null });
  });
});

describe('the posture in words', () => {
  it('grades as SecurityScorecard does', () => {
    expect([95, 90, 89.9, 80, 75, 60, 59.9, null].map(gradeOf)).toEqual(['A', 'A', 'B', 'B', 'C', 'D', 'F', null]);
  });

  it('says a unit’s leader, its counts without the zeros, and its score beside its coverage', () => {
    expect(leaderSaid({ leader: 'Cy Cole', leaderHow: 'acting' })).toBe('Cy Cole, acting');
    expect(leaderSaid({ leader: 'Bo Birch', leaderHow: 'inherited' })).toBe('Bo Birch, from the unit above');
    expect(leaderSaid({ leader: null, leaderHow: null })).toBeNull();
    expect(unitCounts({ applications: 412, failingCritical: 3, overdue: 0, expiring: 1 })).toBe('412 applications · 3 critical failing · 1 exception expiring');
    expect(unitCounts({ applications: 1, failingCritical: 0, overdue: 0, expiring: 0 })).toBe('1 application');
    expect(scoreSaid({ score: 84.24, coverage: 95.6 })).toBe('84.2 · coverage 96%');
    expect(scoreSaid({ score: null, coverage: null })).toBe('no score · no evidence');
  });

  it('tells a trend over the days published, steady under half a point (Q-178)', () => {
    expect(trendSaid([{ day: '2024-03-01', score: 70, coverage: 90 }, { day: '2024-03-02', score: null, coverage: null }, { day: '2024-03-08', score: 78.4, coverage: 91 }])).toBe('Up 8.4 points, 70.0 to 78.4, over 2 days published.');
    expect(trendSaid([{ day: '2024-03-01', score: 80, coverage: 90 }, { day: '2024-03-02', score: 80.3, coverage: 90 }])).toBe('Steady at 80.3 over 2 days published.');
    expect(trendSaid([{ day: '2024-03-01', score: 80, coverage: 90 }])).toBe('One day so far: run more days to see the trend.');
  });
});
