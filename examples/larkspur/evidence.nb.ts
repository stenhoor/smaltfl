// The evidence, conformed (ADR 0020 §3): every feed's checked rows as one long table, an application and a control a row,
// with the raw status in one vocabulary, the due date where the control has one, and the platforms the row names; and
// the vulnerability SLA, told from the findings ledger by severity, not taken from a scanner's own verdict.
import { cell, md, param, sql } from 'smaltnb';
import { access_reviews_checked, backup_jobs_checked, dr_exercises_checked, edr_coverage_checked, encryption_checked, findings_checked, key_rotation_checked, logging_coverage_checked, mfa_checked, pentest_schedule_checked, privileged_vault_checked, tls_checked, waf_checked } from './bronze.nb.js';
import { apps } from './apps.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_vuln', { lang: 'md' });
md`The vulnerability SLA for each application the scanner should reach: one finding an application and CVE, its earliest first-found date kept, so a finding the scanner reports again after an agent is reinstalled keeps its SLA clock. An open critical finding fails after 15 days and an open high after 30. An application the scanner didn't reach today, or reached without logging in, is not assessed, never clean: a scan that can't log in finds far less`;

cell('vuln_status', { lang: 'sql' });
export const vuln_status = sql`
  WITH scans AS (
    SELECT upper(trim(app_id)) AS app_id, max(scanner) AS scanner, max(CASE WHEN lower(credentialed) = 'yes' THEN 1 ELSE 0 END) AS credentialed
    FROM ${findings_checked}
    WHERE upper(plugin) = 'SCAN-INFO'
    GROUP BY upper(trim(app_id))
  ),
  open AS (
    SELECT upper(trim(app_id)) AS app_id, cve, lower(severity) AS severity, min(first_found) AS first_found
    FROM ${findings_checked}
    WHERE upper(plugin) <> 'SCAN-INFO' AND lower(source) = 'scan' AND lower(status) IN ('new', 'active', 're-opened')
    GROUP BY upper(trim(app_id)), cve, lower(severity)
  ),
  late AS (
    SELECT app_id, count(*) AS overdue, min(first_found) AS oldest
    FROM open
    WHERE (severity = 'critical' AND julianday(${params.day}) - julianday(first_found) > 15)
       OR (severity = 'high' AND julianday(${params.day}) - julianday(first_found) > 30)
    GROUP BY app_id
  )
  SELECT a.app_id, s.scanner,
         CASE WHEN s.app_id IS NULL OR s.credentialed = 0 THEN 'not_assessed' WHEN l.app_id IS NOT NULL THEN 'fail' ELSE 'pass' END AS status,
         CASE WHEN s.app_id IS NULL THEN 'not reached' WHEN s.credentialed = 0 THEN 'could not log in' ELSE 'logged in' END AS scan,
         COALESCE(l.overdue, 0) AS overdue, l.oldest AS oldest_overdue
  FROM ${apps} a
  LEFT JOIN scans s ON s.app_id = a.app_id
  LEFT JOIN late l ON l.app_id = a.app_id
  WHERE a.hosting <> 'saas' AND a.lifecycle IN ('active', 'retiring')`;

cell('about_results', { lang: 'md' });
md`Every feed as one long table: an application and a control a row, the status as its tool reports it in one vocabulary (pass, fail, not assessed), the date it falls due where the control has one, the platforms the row names (the ingress and the certificate's issuer, the key store, the backup controller, the identity provider, the log pipeline and its forwarder's issuer, the vault, the scanner), and whether a private link stands in for TLS`;

cell('results', { lang: 'sql' });
export const results = sql`
  SELECT upper(trim(app_id)) AS app_id, 'tls' AS control_id, lower(trim(status)) AS status, CAST(NULL AS TEXT) AS due_on, ingress AS platform, issuer AS platform2, private_link AS compensating FROM ${tls_checked}
  UNION ALL SELECT upper(trim(app_id)), 'waf', lower(trim(status)), NULL, ingress, NULL, NULL FROM ${waf_checked}
  UNION ALL SELECT upper(trim(app_id)), 'pentest', lower(trim(status)), next_due, NULL, NULL, NULL FROM ${pentest_schedule_checked}
  UNION ALL SELECT upper(trim(app_id)), 'encryption', lower(trim(status)), NULL, key_store, NULL, NULL FROM ${encryption_checked}
  UNION ALL SELECT upper(trim(app_id)), 'key_rotation', lower(trim(status)), next_due, key_store, NULL, NULL FROM ${key_rotation_checked}
  UNION ALL SELECT upper(trim(app_id)), 'backup', lower(trim(status)), NULL, controller, NULL, NULL FROM ${backup_jobs_checked}
  UNION ALL SELECT upper(trim(app_id)), 'dr_exercise', lower(trim(status)), next_due, NULL, NULL, NULL FROM ${dr_exercises_checked}
  UNION ALL SELECT upper(trim(app_id)), 'mfa', lower(trim(status)), NULL, CASE WHEN idp LIKE 'idp-%' THEN idp END, NULL, NULL FROM ${mfa_checked}
  UNION ALL SELECT upper(trim(app_id)), 'access_review', lower(trim(status)), next_due, NULL, NULL, NULL FROM ${access_reviews_checked}
  UNION ALL SELECT upper(trim(app_id)), 'logging', lower(trim(status)), NULL, pipeline, forwarder_issuer, NULL FROM ${logging_coverage_checked}
  UNION ALL SELECT upper(trim(app_id)), 'privileged_access', lower(trim(status)), NULL, vault, NULL, NULL FROM ${privileged_vault_checked}
  UNION ALL SELECT upper(trim(app_id)), 'edr', lower(trim(status)), NULL, NULL, NULL, NULL FROM ${edr_coverage_checked}
  UNION ALL SELECT app_id, 'vuln_sla', status, NULL, scanner, NULL, NULL FROM ${vuln_status}`;
