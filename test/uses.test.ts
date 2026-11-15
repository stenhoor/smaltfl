// Where a column is used (ADR 0022 §2; Q-146, Q-205): followed by its name through the steps, SQL read from smaltql's
// parsed SELECT, on the three example flows and on typed steps.
import { describe, expect, it } from 'vitest';
import { parseOne } from '@smaltworks/smaltql';
import type { FlowDocument } from '../src/core/document.js';
import { columnUses, joinImpactSaid, joinMatch, joinsSaid, usesSaid } from '../src/core/uses.js';
import { loadFlowDir } from './helpers/notebooks.js';

const parse = (sql: string) => parseOne(sql).stmt;
const flow = (name: string) => loadFlowDir(new URL(`../examples/${name}/`, import.meta.url));

describe('the control estate (a join on every control file)', () => {
  it('follows TLS’s app_id through its check to the posture’s join with the inventory, and what is built from it', async () => {
    const doc = await flow('control-estate');
    const u = columnUses(doc, 'tls', 'app_id', { parse });
    expect(u.carried).toEqual(['tls', 'tls_checked']);
    // The posture selects the inventory's app_id, not TLS's: it joins on TLS's, and passes the inventory's on.
    expect(u.joins).toEqual([{ step: 'posture', via: 'tls_checked', other: { dataset: 'apps', column: 'app_id' } }]);
    expect(u.reads).toEqual([]);
    expect(u.outputs).toEqual(['posture', 'app_scores', 'by_unit', 'by_control', 'by_type', 'by_profile', 'control_by_type', 'failed_together']);
    expect(usesSaid(u)).toBe('posture matches it with apps’s app_id; tls_checked passes it on; posture, app_scores, by_unit and 5 more are built from it.');
    // A join key's reach (Q-205): its joins and what is built from it, every output named for the second confirmation.
    expect(joinImpactSaid(u)).toBe('posture matches it with apps’s app_id; posture, app_scores, by_unit and 5 more are built from it.');
    expect(joinImpactSaid(u, true)).toBe('posture matches it with apps’s app_id; posture, app_scores, by_unit, by_control, by_type, by_profile, control_by_type and failed_together are built from it.');
    expect(joinImpactSaid(columnUses(doc, 'tls', 'status', { parse }))).toBe('');
  });

  it('says a column read under another name as read, not passed on (t0.status AS tls)', async () => {
    const u = columnUses(await flow('control-estate'), 'tls', 'status', { parse });
    expect([u.carried, u.joins, u.reads]).toEqual([['tls', 'tls_checked'], [], ['posture']]);
  });

  it('says one step’s many joins in one phrase: the inventory’s app_id against every control', async () => {
    const u = columnUses(await flow('control-estate'), 'apps', 'app_id', { parse });
    expect(u.joins).toHaveLength(12);
    expect(u.carried).toEqual(['apps', 'posture', 'app_scores']);
    expect(joinsSaid(u)).toEqual(['posture matches it with app_id in tls_checked, waf_checked, pentest_checked and 9 more']);
  });
});

describe('the sign-ins (no join)', () => {
  it('follows result through the fill and the check into the hourly counts, and the country counts that read it', async () => {
    const doc = await flow('security-signins');
    const u = columnUses(doc, 'auth', 'result', { parse });
    expect(u).toEqual({ source: 'auth', column: 'result', carried: ['auth', 'auth_filled', 'auth_valid', 'signins_by_hour'], joins: [], reads: ['failures_by_country'], outputs: ['auth_valid', 'signins_by_hour', 'failures_by_country'] });
    expect(usesSaid(u)).toBe('auth_filled, auth_valid and signins_by_hour pass it on; failures_by_country reads it; auth_valid, signins_by_hour and failures_by_country are built from it.');
    // count(DISTINCT user) reads it; nothing selects it.
    expect(columnUses(doc, 'auth', 'user', { parse }).reads).toEqual(['signins_by_hour']);
  });

  it('takes the typed plan’s output columns as settling what passes on', async () => {
    const doc = await flow('security-signins');
    const u = columnUses(doc, 'auth', 'result', { parse, columnsOf: (s) => (s === 'signins_by_hour' ? ['hour', 'filled_from', 'signins', 'users'] : undefined) });
    expect(u.carried).toEqual(['auth', 'auth_filled', 'auth_valid']);
  });
});

describe('Larkspur (CTEs, subqueries, a recursive walk)', () => {
  it('follows the CMDB’s app_id through the CTEs that conform it, and finds the join on the cloud’s tags in a subquery', async () => {
    const u = columnUses(await flow('larkspur'), 'cmdb_apps', 'app_id', { parse });
    expect(u.carried.slice(0, 5)).toEqual(['cmdb_apps', 'cmdb_apps_checked', 'apps_dedup', 'apps_clean', 'apps']);
    // apps_dedup joins its own CTEs on the id: matched with itself, so no join on other data.
    expect(u.joins.some((j) => j.step === 'apps_dedup')).toBe(false);
    expect(u.joins).toContainEqual({ step: 'apps', via: 'apps_clean', other: { dataset: 'cloud_assets_checked', column: 'app_tag' } });
    expect(u.joins.filter((j) => j.step === 'vuln_status')).toEqual([{ step: 'vuln_status', via: 'apps', other: { dataset: 'findings_checked', column: 'app_id' } }]);
  });

  it('reads a recursive walk without going round, the unit matched with its parent', async () => {
    const u = columnUses(await flow('larkspur'), 'org_units', 'org_unit_id', { parse });
    expect(u.carried.slice(0, 3)).toEqual(['org_units', 'org_closure', 'org_walk']);
    expect(u.joins).toContainEqual({ step: 'org_closure', via: 'org_units', other: { dataset: 'org_units', column: 'parent_id' } });
    // The walk's own name, read from inside itself, is no input: the other side is said only by its column.
    expect(u.joins).toContainEqual({ step: 'org_closure', via: 'org_units', other: { dataset: null, column: 'ancestor_id' } });
  });
});

describe('typed steps', () => {
  const doc = {
    sources: [{ id: 'trips', table: 'trips_file' }, { id: 'zones', table: 'zones_file' }],
    steps: [
      { id: 'kept', kind: 'filter', inputs: ['trips'], where: 'zone_id IS NOT NULL' },
      { id: 'named', kind: 'join', inputs: ['kept', 'zones'], how: 'left', on: [{ left: 'zone_id', right: 'id' }], columns: ['borough'], dataset: {} },
      { id: 'picked', kind: 'select', inputs: ['named'], columns: ['borough', { name: 'zone', expr: 'zone_id' }] },
      { id: 'by_zone', kind: 'aggregate', inputs: ['named'], groupBy: ['zone_id'], measures: [{ name: 'n', expr: 'count(*)' }], dataset: {} },
      { id: 'other', kind: 'filter', inputs: ['zones'], where: 'id > 0', dataset: {} },
    ],
  } as unknown as Pick<FlowDocument, 'steps' | 'sources'>;

  it('reads a join’s keys, a select’s columns and an aggregate’s groups', () => {
    const u = columnUses(doc, 'trips', 'zone_id');
    expect(u.carried).toEqual(['trips', 'kept', 'named', 'by_zone']);
    expect(u.joins).toEqual([{ step: 'named', via: 'kept', other: { dataset: 'zones', column: 'id' } }]);
    // Renamed to zone: read, not passed on.
    expect(u.reads).toEqual(['picked']);
    expect(u.outputs).toEqual(['named', 'by_zone']);
    // The right side's key, followed from the zones file.
    expect(columnUses(doc, 'zones', 'id').joins).toEqual([{ step: 'named', via: 'zones', other: { dataset: 'kept', column: 'zone_id' } }]);
  });

  it('finds nothing for a column no step reads', () => {
    expect(columnUses(doc, 'trips', 'fare')).toEqual({ source: 'trips', column: 'fare', carried: ['trips', 'kept', 'named'], joins: [], reads: [], outputs: ['named'] });
    expect(usesSaid(columnUses({ sources: doc.sources, steps: [] }, 'trips', 'fare'))).toBe('');
  });
});

describe('a join’s matches today', () => {
  it('counts distinct non-empty values found on the other side, as text', () => {
    expect(joinMatch(['A-1', 'A-2', 'A-2', null, '', 'A-9'], ['A-1', 'A-2', 'A-3'])).toEqual({ values: 3, matched: 2 });
    expect(joinMatch([], ['A-1'])).toEqual({ values: 0, matched: 0 });
  });
});
