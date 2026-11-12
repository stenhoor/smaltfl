// Control Posture v1 (ADR 0020 §4): the gold data product. A star schema with a grain, a key and a contract on every
// dataset, read by named consumers: the posture dashboard, the leaders' weekly digest, the GRC evidence export, the
// vulnerability SLA report, the risk committee and ticketing. It reads silver and the catalogue only. What reads the
// organisation's chain (dim_org, dim_app, org_posture) holds when the chain breaks; the facts and the scorecards read the
// teams themselves and publish.
import { cell, md, param, sql } from 'smaltnb';
import { check, gate, publish } from 'smaltfl/notebook';
import { control_catalog_checked, control_requirements_checked, exceptions_checked, findings_checked } from './bronze.nb.js';
import { leaders, org_chain, org_closure } from './org.nb.js';
import { app_owners, apps, shadow_assets } from './apps.nb.js';
import { effective, expected, remediation } from './posture.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_dim_org', { lang: 'md' });
md`# The dimensions

The organisation, one row a unit: its name, level, path and leader (its own, acting, or inherited from above, said), the unit at each level and that unit's leader. One member says what is unknown: **Unassigned**, where an application's owner chain doesn't resolve`;

cell('dim_org_rows', { lang: 'sql' });
export const dim_org_rows = sql`
  SELECT o.org_unit_id, o.name, o.level, o.parent_id, o.depth,
         trim(COALESCE(s.name, o.name) || CASE WHEN b.name IS NOT NULL THEN ' › ' || b.name ELSE '' END || CASE WHEN d.name IS NOT NULL THEN ' › ' || d.name ELSE '' END || CASE WHEN t.name IS NOT NULL THEN ' › ' || t.name ELSE '' END) AS path,
         o.segment_id, o.business_unit_id, o.department_id, o.team_id,
         o.leader_id, o.leader_how, p.display_name AS leader_name,
         s.leader_id AS segment_leader_id, b.leader_id AS business_unit_leader_id, d.leader_id AS department_leader_id
  FROM ${org_chain} o
  LEFT JOIN ${leaders} p ON p.person_id = o.leader_id
  LEFT JOIN ${org_chain} s ON s.org_unit_id = o.segment_id
  LEFT JOIN ${org_chain} b ON b.org_unit_id = o.business_unit_id
  LEFT JOIN ${org_chain} d ON d.org_unit_id = o.department_id
  LEFT JOIN ${org_chain} t ON t.org_unit_id = o.team_id
  UNION ALL
  SELECT 'UNASSIGNED', 'Unassigned', 'unassigned', NULL, NULL, 'Unassigned', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL`;

cell('dim_org');
export const dim_org = check(dim_org_rows, {
  rules: [
    { name: 'known_level', check: "level IN ('group', 'segment', 'business_unit', 'department', 'team', 'unassigned')", onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('dim_org_gate');
export const dim_org_gate = gate(dim_org, { layer: 'gold', reconcile: { key: 'org_unit_id' } });

cell('about_dim_app', { lang: 'md' });
md`The applications, one row each: their attributes, owning team and owner chain, platform and lifecycle. Two members say what is unknown: an owner chain that doesn't resolve is **Unassigned**, never blank, and the cloud's resources under tags no CMDB record names belong to the **Unregistered** application, owned by no one, visibly`;

cell('dim_app_rows', { lang: 'sql' });
export const dim_app_rows = sql`
  SELECT a.app_id, a.name, 'application' AS member, a.tier, a.exposure, a.data_class, a.datastore, a.hosting, a.site, a.platform_id, a.lifecycle,
         a.owner_team_id, w.department_id, w.business_unit_id, w.segment_id, w.orphaned, a.in_cloud, 0 AS unregistered_resources
  FROM ${apps} a
  JOIN ${app_owners} w ON w.app_id = a.app_id
  UNION ALL
  SELECT 'UNREGISTERED', 'Unregistered', 'unregistered', NULL, NULL, NULL, NULL, 'cloud', NULL, NULL, NULL,
         'UNASSIGNED', 'UNASSIGNED', 'UNASSIGNED', 'UNASSIGNED', 'yes', 'yes', COALESCE((SELECT sum(resources) FROM ${shadow_assets}), 0)`;

cell('dim_app');
export const dim_app = check(dim_app_rows, {
  rules: [
    { name: 'owned_or_unassigned', check: "owner_team_id IS NOT NULL AND department_id IS NOT NULL AND business_unit_id IS NOT NULL AND segment_id IS NOT NULL", onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('dim_app_gate');
export const dim_app_gate = gate(dim_app, { layer: 'gold', reconcile: { key: 'app_id' } });

cell('about_dim_control', { lang: 'md' });
md`The controls of today's catalogue, one row each: their CSF 2.0 function and category, the framework requirements they map to, their weight and cadence, and the kind of platform that provides them`;

cell('dim_control', { lang: 'sql' });
export const dim_control = sql`
  SELECT c.control_id, c.name, c.csf_function, c.csf_category, c.weight, c.cadence,
         NULLIF(c.depends_on, '') AS depends_on, NULLIF(c.compensated_by, '') AS compensated_by, NULLIF(c.provided_by, '') AS provided_by, c.allocation,
         (SELECT count(*) FROM ${control_requirements_checked} r WHERE r.control_id = c.control_id) AS mapped,
         (SELECT string_agg(m.framework || ' ' || m.requirement, '; ') FROM (SELECT framework, requirement FROM ${control_requirements_checked} r WHERE r.control_id = c.control_id ORDER BY framework, requirement) m) AS requirements
  FROM ${control_catalog_checked} c`;

cell('dim_control_gate');
export const dim_control_gate = gate(dim_control, { layer: 'gold', reconcile: { key: 'control_id' } });

cell('about_facts', { lang: 'md' });
md`# The facts

The status of every control that applies to every application, evidence or not: what didn't happen is a row (not assessed, its reason no evidence), never a missing one. With the raw status, the reason, the days overdue, the exception in force, the platform it is inherited from, and the day it is as of`;

cell('fact_control_rows', { lang: 'sql' });
export const fact_control_rows = sql`
  WITH x AS (
    SELECT upper(trim(app_id)) AS app_id, control_id, max(exception_id) AS exception_id
    FROM ${exceptions_checked}
    WHERE status = 'active' AND valid_from <= ${params.day} AND ${params.day} <= valid_to
    GROUP BY upper(trim(app_id)), control_id
  )
  SELECT e.app_id, e.control_id, e.weight,
         CASE WHEN e.status = 'no_data' THEN 'not_assessed' ELSE e.status END AS status,
         e.raw_status, e.reason, e.due_on,
         CASE WHEN e.due_on IS NOT NULL AND e.due_on < ${params.day} THEN CAST(julianday(${params.day}) - julianday(e.due_on) AS INTEGER) ELSE 0 END AS days_overdue,
         x.exception_id, e.platform, ${params.day} AS as_of
  FROM ${effective} e
  LEFT JOIN x ON x.app_id = e.app_id AND x.control_id = e.control_id`;

cell('fact_control_status');
export const fact_control_status = check(fact_control_rows, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed', 'excepted', 'compensated')", onFail: 'fail' },
    { name: 'as_of_the_day', check: 'as_of = :day', onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('fact_control_status_gate');
export const fact_control_status_gate = gate(fact_control_status, { layer: 'gold', reconcile: { key: ['app_id', 'control_id'], of: expected } });

cell('about_fact_finding', { lang: 'md' });
md`One row a finding, as it moves: one an application and CVE, its earliest first-found date kept (a finding reported again after an agent is reinstalled is the same finding), its severity in Splunk's common vocabulary, the date its SLA falls due, when it was fixed, the days it has been open and whether it is overdue`;

cell('fact_finding_rows', { lang: 'sql' });
export const fact_finding_rows = sql`
  WITH f AS (
    SELECT finding_id, upper(trim(app_id)) AS app_id, lower(source) AS source, NULLIF(scanner, '') AS scanner, cve, lower(severity) AS severity,
           lower(status) AS status, first_found, NULLIF(fixed_on, '') AS fixed_on,
           row_number() OVER (PARTITION BY upper(trim(app_id)), cve ORDER BY first_found, finding_id) AS earliest
    FROM ${findings_checked}
    WHERE upper(plugin) <> 'SCAN-INFO'
  ),
  d AS (
    SELECT *, date(first_found, '+' || CASE severity WHEN 'critical' THEN 15 WHEN 'high' THEN 30 WHEN 'medium' THEN 90 WHEN 'low' THEN 180 ELSE 365 END || ' days') AS sla_due
    FROM f WHERE earliest = 1
  )
  SELECT finding_id, app_id, source, scanner, cve,
         CASE severity WHEN 'info' THEN 'informational' ELSE severity END AS severity,
         status, first_found, sla_due AS due_on, fixed_on,
         CAST(julianday(COALESCE(fixed_on, ${params.day})) - julianday(first_found) AS INTEGER) AS days_open,
         CASE WHEN status <> 'fixed' AND sla_due < ${params.day} THEN 'yes' ELSE 'no' END AS overdue
  FROM d`;

cell('fact_finding');
export const fact_finding = check(fact_finding_rows, {
  rules: [
    { name: 'known_severity', check: "severity IN ('critical', 'high', 'medium', 'low', 'informational')", onFail: 'fail' },
    { name: 'known_status', check: "status IN ('new', 'active', 're-opened', 'fixed')", onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('fact_finding_gate');
export const fact_finding_gate = gate(fact_finding, { layer: 'gold', reconcile: { key: 'finding_id' } });

cell('about_scorecard', { lang: 'md' });
md`# The scores

Each application's score, as the posture tools score: the weighted controls it passes over the weighted controls with evidence, a compensated control counting three quarters, an excepted one and one with no evidence left out. Its coverage beside it, always: the controls with evidence over the controls that apply, since a score is only as good as what it covers. A grade from it (A from 90, B from 80, C from 70, D from 60, F below), the controls failing, the items overdue, the exceptions expiring within thirty days, and the owning team (its chain is the dimension's)`;

cell('scorecard_rows', { lang: 'sql' });
export const scorecard_rows = sql`
  WITH s AS (
    SELECT app_id,
           sum(CASE WHEN status = 'pass' THEN weight WHEN status = 'compensated' THEN 0.75 * weight ELSE 0 END) AS earned,
           sum(CASE WHEN status IN ('pass', 'fail', 'compensated') THEN weight ELSE 0 END) AS possible,
           sum(CASE WHEN status = 'not_assessed' THEN 0 ELSE 1 END) AS with_evidence,
           count(*) AS applying,
           sum(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) AS failing,
           sum(CASE WHEN status = 'fail' AND days_overdue > 0 THEN 1 ELSE 0 END) AS overdue
    FROM ${fact_control_status}
    GROUP BY app_id
  ),
  failing AS (
    SELECT app_id, string_agg(control_id, ' ') AS failing_controls
    FROM (SELECT app_id, control_id FROM ${fact_control_status} WHERE status = 'fail' ORDER BY app_id, control_id) f
    GROUP BY app_id
  ),
  expiring AS (
    SELECT upper(trim(app_id)) AS app_id, count(DISTINCT exception_id) AS expiring
    FROM ${exceptions_checked}
    WHERE status = 'active' AND valid_to >= ${params.day} AND julianday(valid_to) - julianday(${params.day}) <= 30
    GROUP BY upper(trim(app_id))
  ),
  scored AS (
    SELECT s.app_id, CASE WHEN s.possible > 0 THEN round(100.0 * s.earned / s.possible, 1) END AS score,
           round(100.0 * s.with_evidence / s.applying, 1) AS coverage, s.applying, s.with_evidence, s.failing, s.overdue
    FROM s
  )
  SELECT c.app_id, a.name, a.tier, a.owner_team_id, c.score, c.coverage,
         CASE WHEN c.score IS NULL THEN NULL WHEN c.score >= 90 THEN 'A' WHEN c.score >= 80 THEN 'B' WHEN c.score >= 70 THEN 'C' WHEN c.score >= 60 THEN 'D' ELSE 'F' END AS grade,
         c.applying, c.with_evidence, c.failing, COALESCE(f.failing_controls, '') AS failing_controls, c.overdue, COALESCE(x.expiring, 0) AS expiring
  FROM scored c
  JOIN ${apps} a ON a.app_id = c.app_id
  LEFT JOIN failing f ON f.app_id = c.app_id
  LEFT JOIN expiring x ON x.app_id = c.app_id`;

cell('app_scorecard');
export const app_scorecard = check(scorecard_rows, {
  rules: [
    { name: 'score_in_range', check: 'score IS NULL OR (score >= 0 AND score <= 100)', onFail: 'fail' },
    { name: 'coverage_in_range', check: 'coverage >= 0 AND coverage <= 100', onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('app_scorecard_gate');
export const app_scorecard_gate = gate(app_scorecard, { layer: 'gold', reconcile: { key: 'app_id' } });

cell('about_org_posture', { lang: 'md' });
md`Every unit at every level, over all the applications beneath it: how many, how many critical (tier 1), the tier-weighted score and coverage (a tier 1 application counting three, tier 2 two, tier 3 one), the critical applications failing a control, the items overdue and the exceptions expiring. An application whose chain doesn't resolve is counted under Unassigned, not under the group`;

cell('org_posture_rows', { lang: 'sql' });
export const org_posture_rows = sql`
  WITH pairs AS (SELECT DISTINCT org_unit_id, ancestor_id FROM ${org_closure}),
  beneath AS (
    SELECT p.ancestor_id AS org_unit_id, a.app_id, a.tier FROM ${dim_app} a JOIN pairs p ON p.org_unit_id = a.owner_team_id
    WHERE a.member = 'application' AND a.orphaned = 'no'
    UNION ALL
    SELECT 'UNASSIGNED', a.app_id, a.tier FROM ${dim_app} a WHERE a.member = 'application' AND a.orphaned = 'yes'
  ),
  scored AS (
    SELECT b.org_unit_id, b.app_id, b.tier, CASE b.tier WHEN '1' THEN 3 WHEN '2' THEN 2 ELSE 1 END AS w, s.score, s.coverage, s.failing, s.overdue, s.expiring
    FROM beneath b
    LEFT JOIN ${app_scorecard} s ON s.app_id = b.app_id
  )
  SELECT u.org_unit_id, u.name, u.level,
         count(c.app_id) AS applications,
         sum(CASE WHEN c.tier = '1' THEN 1 ELSE 0 END) AS critical,
         round(sum(CASE WHEN c.score IS NOT NULL THEN c.w * c.score END) / sum(CASE WHEN c.score IS NOT NULL THEN c.w END), 1) AS score,
         round(sum(CASE WHEN c.coverage IS NOT NULL THEN c.w * c.coverage END) / sum(CASE WHEN c.coverage IS NOT NULL THEN c.w END), 1) AS coverage,
         sum(CASE WHEN c.tier = '1' AND c.failing > 0 THEN 1 ELSE 0 END) AS failing_critical,
         COALESCE(sum(c.overdue), 0) AS overdue,
         COALESCE(sum(c.expiring), 0) AS expiring
  FROM ${dim_org} u
  LEFT JOIN scored c ON c.org_unit_id = u.org_unit_id
  GROUP BY u.org_unit_id, u.name, u.level`;

cell('org_posture');
export const org_posture = check(org_posture_rows, {
  rules: [
    { name: 'score_in_range', check: 'score IS NULL OR (score >= 0 AND score <= 100)', onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('org_posture_gate');
export const org_posture_gate = gate(org_posture, { layer: 'gold', reconcile: { key: 'org_unit_id', of: dim_org } });

cell('about_register', { lang: 'md' });
md`# For the people who act

The risk register as the risk committee reads it, one row an exception: the application and control, the approver, when it expires, when it first expired and how often it was extended, the days left, and whether it is active, expiring within thirty days, approved and not yet started, or expired`;

cell('exceptions_register', { lang: 'sql' });
export const exceptions_register = sql`
  WITH v AS (
    SELECT exception_id, version, upper(trim(app_id)) AS app_id, control_id, approver_id, reason, NULLIF(compensating_control, '') AS compensating_control,
           valid_from, valid_to, NULLIF(original_valid_to, '') AS original_valid_to,
           row_number() OVER (PARTITION BY exception_id ORDER BY version DESC) AS latest,
           count(*) OVER (PARTITION BY exception_id) AS versions
    FROM ${exceptions_checked}
  ),
  first AS (SELECT exception_id, min(valid_to) AS first_expiry FROM ${exceptions_checked} GROUP BY exception_id)
  SELECT v.exception_id, v.app_id, v.control_id, v.approver_id, v.reason, v.compensating_control, v.valid_from, v.valid_to AS expires_on,
         COALESCE(v.original_valid_to, f.first_expiry) AS first_expiry, v.versions - 1 AS extended,
         CAST(julianday(v.valid_to) - julianday(${params.day}) AS INTEGER) AS days_left,
         CASE WHEN v.valid_to < ${params.day} THEN 'expired' WHEN v.valid_from > ${params.day} THEN 'approved' WHEN julianday(v.valid_to) - julianday(${params.day}) <= 30 THEN 'expiring' ELSE 'active' END AS state
  FROM v
  JOIN first f ON f.exception_id = v.exception_id
  WHERE v.latest = 1`;

cell('exceptions_register_gate');
export const exceptions_register_gate = gate(exceptions_register, { layer: 'gold', reconcile: { key: 'exception_id' } });

cell('about_queue', { lang: 'md' });
md`What ticketing receives, one row a failing control of an application: the owning team and its leader (read from the team, not the chain, so the queue is there whatever happens higher up), the due date and days overdue, a severity from the control's weight, and the platform it rests on`;

cell('remediation_queue', { lang: 'sql' });
export const remediation_queue = sql`
  SELECT r.app_id, r.name, r.control_id, r.reason, r.owner_team_id, r.team, r.team_leader_id, r.due_on, COALESCE(r.days_overdue, 0) AS days_overdue,
         CASE WHEN e.weight >= 3 THEN 'high' WHEN e.weight = 2 THEN 'medium' ELSE 'low' END AS severity,
         e.platform
  FROM ${remediation} r
  JOIN ${effective} e ON e.app_id = r.app_id AND e.control_id = r.control_id`;

cell('remediation_queue_gate');
export const remediation_queue_gate = gate(remediation_queue, { layer: 'gold', reconcile: { key: ['app_id', 'control_id'] } });

cell('published');
publish(dim_org, { description: 'Control Posture v1: the organisation, one row a unit, with its path, its leader and the leader at each level' });
publish(dim_app, { description: 'Control Posture v1: the applications, with their owner chain; Unassigned and Unregistered say what is unknown' });
publish(dim_control, { description: 'Control Posture v1: the controls, with their framework requirements' });
publish(fact_control_status, { description: 'Control Posture v1: the status of every control that applies to every application, evidence or not' });
publish(fact_finding, { description: 'Control Posture v1: one row a finding, with its SLA' });
publish(app_scorecard, { description: 'Control Posture v1: each application’s score, its coverage beside it, and a grade' });
publish(org_posture, { description: 'Control Posture v1: every unit, over the applications beneath it' });
publish(exceptions_register, { description: 'Control Posture v1: the risk register, one row an exception' });
publish(remediation_queue, { description: 'Control Posture v1: what is failing, for ticketing' });
