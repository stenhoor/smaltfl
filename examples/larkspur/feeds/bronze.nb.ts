// The evidence as its tools export it each day (ADR 0020 §2), a flow of its own (ADR 0025): the findings ledger and
// twelve feeds, one a control, judged as they arrive. Each has a gate (written checks hold the day, learned ones warn), a
// feed may be filled from another day (ADR 0023), and a check step keeps the rows it can read, which this flow gives.
// Which applications a feed should cover is read from the inventory's list of them, the CMDB's file as it arrived.
import { cell, md, param } from 'smaltnb';
import { check, fill, gate, publish, source } from 'smaltfl/notebook';
import { cmdb_apps } from '../inventory/bronze.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_sources', { lang: 'md' });
md`The evidence as its tools export it each day: the findings ledger and twelve feeds, one a control. Each file’s export time and where it came from are kept beside it, never in its rows`;

cell('findings');
export const findings = source('findings');

cell('tls');
export const tls = source('tls');

cell('waf');
export const waf = source('waf');

cell('pentest_schedule');
export const pentest_schedule = source('pentest_schedule');

cell('encryption');
export const encryption = source('encryption');

cell('key_rotation');
export const key_rotation = source('key_rotation');

cell('backup_jobs');
export const backup_jobs = source('backup_jobs');

cell('dr_exercises');
export const dr_exercises = source('dr_exercises');

cell('mfa');
export const mfa = source('mfa');

cell('access_reviews');
export const access_reviews = source('access_reviews');

cell('logging_coverage');
export const logging_coverage = source('logging_coverage');

cell('privileged_vault');
export const privileged_vault = source('privileged_vault');

cell('edr_coverage');
export const edr_coverage = source('edr_coverage');

cell('about_gates', { lang: 'md' });
md`The bronze gate on every feed (ADR 0014, ADR 0015). An evidence feed has one row an application its control applies to, as the catalogue says and the ontology writes: a row for any other application, an application it applies to with no row, and an application on two rows are counted, and hold the day. A share of not assessed above one in twenty holds any feed, and so does a WAF failing more than one in seven. The findings ledger swings with Patch Tuesday, so its amount only warns; what holds it is an application the scanner should reach with no row there, not even its scan-information row. New words from the scanner only warn: silver reads them in any case`;

cell('findings_gate');
export const findings_gate = gate(findings, { layer: 'bronze', reconcile: { key: 'finding_id' }, scope: { of: cmdb_apps, key: 'app_id', where: "hosting <> 'saas' AND lifecycle <> 'retired'", ids: 'loose' }, checks: { values: 'warn', amount: 'warn' } });

cell('tls_gate');
export const tls_gate = gate(tls, { layer: 'bronze' });

cell('waf_gate');
export const waf_gate = gate(waf, { layer: 'bronze' });

cell('pentest_schedule_gate');
export const pentest_schedule_gate = gate(pentest_schedule, { layer: 'bronze' });

cell('encryption_gate');
export const encryption_gate = gate(encryption, { layer: 'bronze' });

cell('key_rotation_gate');
export const key_rotation_gate = gate(key_rotation, { layer: 'bronze' });

cell('backup_jobs_gate');
export const backup_jobs_gate = gate(backup_jobs, { layer: 'bronze' });

cell('dr_exercises_gate');
export const dr_exercises_gate = gate(dr_exercises, { layer: 'bronze' });

cell('mfa_gate');
export const mfa_gate = gate(mfa, { layer: 'bronze' });

cell('access_reviews_gate');
export const access_reviews_gate = gate(access_reviews, { layer: 'bronze' });

cell('logging_coverage_gate');
export const logging_coverage_gate = gate(logging_coverage, { layer: 'bronze' });

cell('privileged_vault_gate');
export const privileged_vault_gate = gate(privileged_vault, { layer: 'bronze' });

cell('edr_coverage_gate');
export const edr_coverage_gate = gate(edr_coverage, { layer: 'bronze' });

cell('about_fills', { lang: 'md' });
md`An evidence feed's day can be filled (ADR 0023): where its file is missing, empty or wrong, another day's file stands in, the day before carried forward, the day after carried back, or the same weekday a week before, every row marked with the day it came from. A fill carries the rows as they were: their dates are the evidence's own and stay as they were. Nothing is filled until someone decides; on any other day the fill passes the file through, and its rows are marked as the day's own`;

cell('tls_filled');
export const tls_filled = fill(tls, {});

cell('waf_filled');
export const waf_filled = fill(waf, {});

cell('pentest_schedule_filled');
export const pentest_schedule_filled = fill(pentest_schedule, {});

cell('encryption_filled');
export const encryption_filled = fill(encryption, {});

cell('key_rotation_filled');
export const key_rotation_filled = fill(key_rotation, {});

cell('backup_jobs_filled');
export const backup_jobs_filled = fill(backup_jobs, {});

cell('dr_exercises_filled');
export const dr_exercises_filled = fill(dr_exercises, {});

cell('mfa_filled');
export const mfa_filled = fill(mfa, {});

cell('access_reviews_filled');
export const access_reviews_filled = fill(access_reviews, {});

cell('logging_coverage_filled');
export const logging_coverage_filled = fill(logging_coverage, {});

cell('privileged_vault_filled');
export const privileged_vault_filled = fill(privileged_vault, {});

cell('edr_coverage_filled');
export const edr_coverage_filled = fill(edr_coverage, {});

cell('about_checks', { lang: 'md' });
md`Each feed’s rows, kept when they can be read: a status in the feed’s own words, an application’s id. The scanner’s words are read in any case, upper or lower, since silver normalises them`;

cell('findings_checked');
export const findings_checked = check(findings, {
  rules: [
    { name: 'known_severity', check: "lower(severity) IN ('critical', 'high', 'medium', 'low', 'info')", onFail: 'drop' },
    { name: 'known_status', check: "lower(status) IN ('new', 'active', 're-opened', 'fixed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('tls_checked');
export const tls_checked = check(tls_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('waf_checked');
export const waf_checked = check(waf_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('pentest_schedule_checked');
export const pentest_schedule_checked = check(pentest_schedule_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('encryption_checked');
export const encryption_checked = check(encryption_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('key_rotation_checked');
export const key_rotation_checked = check(key_rotation_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('backup_jobs_checked');
export const backup_jobs_checked = check(backup_jobs_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('dr_exercises_checked');
export const dr_exercises_checked = check(dr_exercises_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('mfa_checked');
export const mfa_checked = check(mfa_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('access_reviews_checked');
export const access_reviews_checked = check(access_reviews_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('logging_coverage_checked');
export const logging_coverage_checked = check(logging_coverage_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('privileged_vault_checked');
export const privileged_vault_checked = check(privileged_vault_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('edr_coverage_checked');
export const edr_coverage_checked = check(edr_coverage_filled, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('published');
publish(findings_checked, { description: 'The findings ledger’s rows that can be read: a known severity and status, an application' });
publish(tls_checked, { description: 'TLS evidence, an application a row, as it arrived or filled from another day' });
publish(waf_checked, { description: 'WAF evidence, an application a row, as it arrived or filled from another day' });
publish(pentest_schedule_checked, { description: 'Penetration-test evidence with its next due date, as it arrived or filled from another day' });
publish(encryption_checked, { description: 'Encryption-at-rest evidence, as it arrived or filled from another day' });
publish(key_rotation_checked, { description: 'Key-rotation evidence with its next due date, as it arrived or filled from another day' });
publish(backup_jobs_checked, { description: 'Backup evidence, as it arrived or filled from another day' });
publish(dr_exercises_checked, { description: 'Disaster-recovery exercise evidence with its next due date, as it arrived or filled from another day' });
publish(mfa_checked, { description: 'MFA evidence, as it arrived or filled from another day' });
publish(access_reviews_checked, { description: 'Access-review evidence with its next due date, as it arrived or filled from another day' });
publish(logging_coverage_checked, { description: 'Logging evidence, as it arrived or filled from another day' });
publish(privileged_vault_checked, { description: 'Privileged-access evidence, as it arrived or filled from another day' });
publish(edr_coverage_checked, { description: 'EDR evidence, as it arrived or filled from another day' });
