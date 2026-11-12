// The posture (ADR 0020 §3): what applies to each application as the catalogue says on the day, the evidence against it,
// and the status a person reads, with its reason: an exception in force, a compensating control, a failed dependency.
// Then what is failing with its owning team and that team's leader, the failures by the platforms they share, and one
// row an application with a column a control, which the pairs, the forest and the classifier read.
import { cell, md, param, sql } from 'smaltnb';
import { gate, publish } from 'smaltfl/notebook';
import { control_catalog_checked, exceptions_checked, key_rotation, platforms } from './bronze.nb.js';
import { apps } from './apps.nb.js';
import { leaders, org_units } from './org.nb.js';
import { results } from './evidence.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_ownership', { lang: 'md' });
md`The ownership control, told here: an application has an accountable owner when its owning team is in today's HR extract with a leader in post, or someone acting for one. It reads the team itself, not the chain above it, so a fault higher in the organisation doesn't fail every application beneath it`;

cell('ownership', { lang: 'sql' });
export const ownership = sql`
  SELECT a.app_id, 'ownership' AS control_id,
         CASE WHEN u.org_unit_id IS NULL THEN 'fail'
              WHEN EXISTS (SELECT 1 FROM ${leaders} p WHERE p.status = 'active' AND (p.person_id = u.leader_id OR p.person_id = u.acting_leader_id)) THEN 'pass'
              ELSE 'fail' END AS status,
         CASE WHEN u.org_unit_id IS NULL THEN 'team not in the HR extract'
              WHEN u.leader_id IS NULL AND u.acting_leader_id IS NULL THEN 'no leader and no one acting'
              ELSE 'a leader in post' END AS detail
  FROM ${apps} a
  LEFT JOIN ${org_units} u ON u.org_unit_id = a.owner_team_id
  WHERE a.lifecycle IN ('build', 'active', 'retiring')`;

cell('about_expected', { lang: 'md' });
md`What applies: each application with each control of today's catalogue whose conditions it meets (its lifecycle, exposure, tier, data class, datastore and hosting), the catalogue's own lists read as written. A control the catalogue adds applies from the day it is listed, feed or no feed`;

cell('expected', { lang: 'sql' });
export const expected = sql`
  SELECT a.app_id, c.control_id, c.weight, NULLIF(c.depends_on, '') AS depends_on, NULLIF(c.compensated_by, '') AS compensated_by
  FROM ${apps} a
  JOIN ${control_catalog_checked} c
    ON instr(';' || c.applies_lifecycle || ';', ';' || a.lifecycle || ';') > 0
   AND (c.applies_exposure = '*' OR instr(';' || c.applies_exposure || ';', ';' || a.exposure || ';') > 0)
   AND (c.applies_tier = '*' OR instr(';' || c.applies_tier || ';', ';' || a.tier || ';') > 0)
   AND (c.applies_data_class = '*' OR instr(';' || c.applies_data_class || ';', ';' || a.data_class || ';') > 0)
   AND (c.applies_datastore = '*' OR instr(';' || c.applies_datastore || ';', ';' || a.datastore || ';') > 0)
   AND (c.applies_hosting = '*' OR instr(';' || c.applies_hosting || ';', ';' || a.hosting || ';') > 0)`;

cell('about_coverage', { lang: 'md' });
md`What applies against the evidence: each expected pair with its result, or none (missing evidence, which is no data, not a failure), and the results for a pair nothing expects, kept and said`;

cell('coverage', { lang: 'sql' });
export const coverage = sql`
  WITH evidence AS (
    SELECT app_id, control_id, status, due_on, platform, platform2, compensating FROM ${results}
    UNION ALL
    SELECT app_id, control_id, status, NULL, NULL, NULL, NULL FROM ${ownership}
  )
  SELECT e.app_id, e.control_id, e.weight, e.depends_on, e.compensated_by,
         r.status AS raw_status, r.due_on, r.platform, r.platform2, r.compensating,
         CASE WHEN r.app_id IS NULL THEN 'missing' ELSE 'present' END AS evidence
  FROM ${expected} e
  LEFT JOIN evidence r ON r.app_id = e.app_id AND r.control_id = e.control_id
  UNION ALL
  SELECT r.app_id, r.control_id, NULL, NULL, NULL, r.status, r.due_on, r.platform, r.platform2, r.compensating, 'not expected'
  FROM evidence r
  LEFT JOIN ${expected} e ON e.app_id = r.app_id AND e.control_id = r.control_id
  WHERE e.app_id IS NULL`;

cell('about_effective', { lang: 'md' });
md`The status a person reads, one row an expected pair, with its reason: one row each, held where a pair is on two. Its amount follows the catalogue and its blank raw statuses are the missing evidence its status already says, so both only warn. Missing evidence is no data. A pass whose dependency fails (key rotation without encryption at rest, a DR exercise without backups, vaulted accounts without MFA) is a failure: what it rests on isn't there. A failure under an exception in force today is excepted; one a compensating control stands in for (a private link for TLS, a WAF passing for a late pentest) is compensated. A failure whose exception has expired says so: exception expired reads differently from a regression`;

cell('effective', { lang: 'sql' });
export const effective = sql`
  WITH ex AS (
    SELECT upper(trim(app_id)) AS app_id, control_id,
           max(CASE WHEN status = 'active' AND valid_from <= ${params.day} AND ${params.day} <= valid_to THEN 1 ELSE 0 END) AS in_force,
           max(valid_to) AS last_to
    FROM ${exceptions_checked}
    GROUP BY upper(trim(app_id)), control_id
  ),
  pairs AS (
    SELECT c.*, d.raw_status AS depends_status, w.raw_status AS waf_status, x.in_force, x.last_to
    FROM ${coverage} c
    LEFT JOIN ${coverage} d ON d.app_id = c.app_id AND d.control_id = c.depends_on AND d.evidence = 'present'
    LEFT JOIN ${coverage} w ON w.app_id = c.app_id AND w.control_id = 'waf' AND w.evidence = 'present'
    LEFT JOIN ex x ON x.app_id = c.app_id AND x.control_id = c.control_id
    WHERE c.evidence <> 'not expected'
  )
  SELECT app_id, control_id, weight, raw_status, due_on, platform, platform2,
         CASE WHEN evidence = 'missing' THEN 'no_data'
              WHEN raw_status = 'not_assessed' THEN 'not_assessed'
              WHEN raw_status = 'pass' AND depends_status = 'fail' THEN 'fail'
              WHEN raw_status = 'pass' THEN 'pass'
              WHEN in_force = 1 THEN 'excepted'
              WHEN compensated_by = 'private_link' AND compensating = 'yes' THEN 'compensated'
              WHEN compensated_by = 'waf' AND waf_status = 'pass' THEN 'compensated'
              ELSE 'fail' END AS status,
         CASE WHEN evidence = 'missing' THEN 'no_evidence'
              WHEN raw_status = 'not_assessed' THEN 'not_assessed'
              WHEN raw_status = 'pass' AND depends_status = 'fail' THEN 'dependency_failed'
              WHEN raw_status = 'pass' THEN 'evidence'
              WHEN in_force = 1 THEN 'exception'
              WHEN compensated_by = 'private_link' AND compensating = 'yes' THEN 'compensated'
              WHEN compensated_by = 'waf' AND waf_status = 'pass' THEN 'compensated'
              WHEN last_to IS NOT NULL AND last_to < ${params.day} THEN 'exception_expired'
              ELSE 'evidence' END AS reason
  FROM pairs`;

cell('effective_gate');
export const effective_gate = gate(effective, { layer: 'silver', reconcile: { key: ['app_id', 'control_id'] }, checks: { reconcile: 'hold', amount: 'warn', blanks: 'warn', pairs: 'off', forest: 'off' } });

cell('about_remediation', { lang: 'md' });
md`What is failing: each failing pair with the application's name, the date it fell due where the control has one and the days since, the owning team, and that team's leader in post or acting. It reads the team, not the chain above it, so the queue is there whatever happens higher up`;

cell('remediation', { lang: 'sql' });
export const remediation = sql`
  SELECT e.app_id, a.name, e.control_id, e.reason, e.due_on,
         CASE WHEN e.due_on IS NOT NULL AND e.due_on < ${params.day} THEN CAST(julianday(${params.day}) - julianday(e.due_on) AS INTEGER) END AS days_overdue,
         a.owner_team_id, u.name AS team, COALESCE(u.leader_id, u.acting_leader_id) AS team_leader_id
  FROM ${effective} e
  JOIN ${apps} a ON a.app_id = e.app_id
  LEFT JOIN ${org_units} u ON u.org_unit_id = a.owner_team_id
  WHERE e.status = 'fail'`;

cell('about_platforms', { lang: 'md' });
md`Today's failures and unassessed results by the platforms they share: one row an application's result and a platform its row names (the ingress and the certificate's issuer, the key store, the backup controller, the identity provider, the log pipeline and its forwarder's issuer, the vault, the scanner). Where one platform's share of the rows rises well past its usual share, that platform is the likely cause. Its shares are what is watched, a platform failing for the first time only warns, and its amount, which every feed's own check already judges, isn't`;

cell('platform_impact', { lang: 'sql' });
export const platform_impact = sql`
  SELECT c.platform AS platform_id, p.kind, c.control_id, c.raw_status AS status, c.app_id
  FROM ${coverage} c
  JOIN ${platforms} p ON p.platform_id = c.platform
  WHERE c.evidence = 'present' AND c.raw_status IN ('fail', 'not_assessed')
  UNION ALL
  SELECT c.platform2, p.kind, c.control_id, c.raw_status, c.app_id
  FROM ${coverage} c
  JOIN ${platforms} p ON p.platform_id = c.platform2
  WHERE c.evidence = 'present' AND c.raw_status IN ('fail', 'not_assessed')`;

cell('platform_impact_gate');
export const platform_impact_gate = gate(platform_impact, { layer: 'silver', checks: { amount: 'off', values: 'warn', pairs: 'off', forest: 'off' } });

cell('about_wide', { lang: 'md' });
md`One row an application, a column a control's status as a person reads it, not applicable where the control doesn't apply. The pairs, the forest and the classifier read it: they compare the columns within a row. Where key rotation reports a pass, encryption at rest mustn't be failing: there would be no managed key to rotate, so one of the two feeds is wrong, and the posture holds`;

cell('posture_wide', { lang: 'sql' });
export const posture_wide = sql`
  SELECT a.app_id,
         COALESCE(max(CASE WHEN e.control_id = 'tls' THEN e.status END), 'not_applicable') AS tls,
         COALESCE(max(CASE WHEN e.control_id = 'waf' THEN e.status END), 'not_applicable') AS waf,
         COALESCE(max(CASE WHEN e.control_id = 'pentest' THEN e.status END), 'not_applicable') AS pentest,
         COALESCE(max(CASE WHEN e.control_id = 'encryption' THEN e.status END), 'not_applicable') AS encryption,
         COALESCE(max(CASE WHEN e.control_id = 'key_rotation' THEN e.status END), 'not_applicable') AS key_rotation,
         COALESCE(max(CASE WHEN e.control_id = 'backup' THEN e.status END), 'not_applicable') AS backup,
         COALESCE(max(CASE WHEN e.control_id = 'dr_exercise' THEN e.status END), 'not_applicable') AS dr_exercise,
         COALESCE(max(CASE WHEN e.control_id = 'vuln_sla' THEN e.status END), 'not_applicable') AS vuln_sla,
         COALESCE(max(CASE WHEN e.control_id = 'mfa' THEN e.status END), 'not_applicable') AS mfa,
         COALESCE(max(CASE WHEN e.control_id = 'access_review' THEN e.status END), 'not_applicable') AS access_review,
         COALESCE(max(CASE WHEN e.control_id = 'logging' THEN e.status END), 'not_applicable') AS logging,
         COALESCE(max(CASE WHEN e.control_id = 'privileged_access' THEN e.status END), 'not_applicable') AS privileged_access,
         COALESCE(max(CASE WHEN e.control_id = 'edr' THEN e.status END), 'not_applicable') AS edr,
         COALESCE(max(CASE WHEN e.control_id = 'ownership' THEN e.status END), 'not_applicable') AS ownership
  FROM ${apps} a
  JOIN ${effective} e ON e.app_id = a.app_id
  GROUP BY a.app_id`;

cell('posture_wide_gate');
export const posture_wide_gate = gate(posture_wide, {
  layer: 'silver',
  reconcile: { key: 'app_id' },
  needs: { from: key_rotation, key: 'app_id', when: { status: 'pass' }, then: { encryption: ['pass', 'excepted', 'compensated', 'not_assessed', 'no_data', 'not_applicable'] } },
  checks: { reconcile: 'hold' },
});

cell('silver_gates', { lang: 'md' });
md`What the posture publishes besides its watched steps is silver too: what applies against the evidence, and what is failing with who fixes it`;

cell('coverage_gate');
export const coverage_gate = gate(coverage, { layer: 'silver' });

cell('remediation_gate');
export const remediation_gate = gate(remediation, { layer: 'silver' });

cell('published');
publish(coverage, { description: 'What applies against the evidence: present, missing, or a result nothing expects' });
publish(effective, { description: 'The status a person reads, one row an application and control, with its reason' });
publish(remediation, { description: 'What is failing, with its due date, its owning team and that team’s leader' });
publish(platform_impact, { description: 'Today’s failures and unassessed results by the platforms they share' });
publish(posture_wide, { description: 'One row an application, a column a control’s status' });
