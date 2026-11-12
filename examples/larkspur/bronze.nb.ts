// The bronze layer of the Larkspur estate (ADR 0020 §2): every feed as its system exports it each day, judged as it
// arrives. Twenty daily files and two fixed ones; each daily file has a gate (written checks hold the day, learned
// ones warn) and a check step that keeps the rows it can read. The silver notebooks read the checked steps.
import { cell, md, param } from 'smaltnb';
import { check, gate, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text('') });

cell('about_sources', { lang: 'md' });
md`The files as they arrive: the organisation and its leaders from HR, the applications from the CMDB, the cloud inventory, the control catalogue and its framework mappings, the risk register, the findings ledger and twelve evidence feeds, one a control; and the architecture inventory, which changes rarely. Each file’s export time and where it came from are kept beside it, never in its rows`;

cell('hr_org_units');
export const hr_org_units = source('hr_org_units');

cell('hr_people');
export const hr_people = source('hr_people');

cell('cmdb_apps');
export const cmdb_apps = source('cmdb_apps');

cell('cloud_assets');
export const cloud_assets = source('cloud_assets');

cell('control_catalog');
export const control_catalog = source('control_catalog');

cell('control_requirements');
export const control_requirements = source('control_requirements');

cell('exceptions');
export const exceptions = source('exceptions');

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

cell('platforms');
export const platforms = source('platforms');

cell('platform_links');
export const platform_links = source('platform_links');

cell('about_gates', { lang: 'md' });
md`The bronze gate on every daily file (ADR 0014, ADR 0015). An evidence feed has one row an application its control applies to, as the catalogue says and the ontology writes: a row for any other application, an application it applies to with no row, and an application on two rows are counted, and hold the day. The other files are held to their own keys. A share of not assessed above one in twenty holds any feed, and so does a WAF failing more than one in seven. The findings ledger swings with Patch Tuesday, so its amount only warns; what holds it is an application the scanner should reach with no row there, not even its scan-information row. The catalogue changes on purpose, so a new row there only warns; so do new words from the scanner, which silver reads in any case. The catalogue, its mappings and the organisation’s units barely change from day to day, so the forest, which learns what a usual day looks like, has nothing to learn there and is off`;

cell('hr_org_units_gate');
export const hr_org_units_gate = gate(hr_org_units, { layer: 'bronze', reconcile: { key: 'org_unit_id' }, checks: { forest: 'off' } });

cell('hr_people_gate');
export const hr_people_gate = gate(hr_people, { layer: 'bronze', reconcile: { key: 'person_id' } });

cell('cmdb_apps_gate');
export const cmdb_apps_gate = gate(cmdb_apps, { layer: 'bronze', reconcile: { key: 'app_id' } });

cell('cloud_assets_gate');
export const cloud_assets_gate = gate(cloud_assets, { layer: 'bronze', reconcile: { key: ['account_id', 'app_tag'] } });

cell('control_catalog_gate');
export const control_catalog_gate = gate(control_catalog, { layer: 'bronze', reconcile: { key: 'control_id' }, checks: { amount: 'warn', values: 'warn', forest: 'off' } });

cell('control_requirements_gate');
export const control_requirements_gate = gate(control_requirements, { layer: 'bronze', reconcile: { key: ['control_id', 'framework', 'requirement'] }, checks: { amount: 'warn', values: 'warn', forest: 'off' } });

cell('exceptions_gate');
export const exceptions_gate = gate(exceptions, { layer: 'bronze', reconcile: { key: ['exception_id', 'version'] } });

cell('findings_gate');
export const findings_gate = gate(findings, { layer: 'bronze', reconcile: { key: 'finding_id' }, scope: { of: cmdb_apps, key: 'app_id', where: "hosting <> 'saas' AND lifecycle <> 'retired'" }, checks: { values: 'warn', amount: 'warn' } });

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

cell('about_checks', { lang: 'md' });
md`Each file’s rows, kept when they can be read: a status in the file’s own words, an id where one is needed. The scanner’s words are read in any case, upper or lower, since silver normalises them`;

cell('hr_org_units_checked');
export const hr_org_units_checked = check(hr_org_units, {
  rules: [
    { name: 'has_id', check: "org_unit_id IS NOT NULL", onFail: 'drop' },
    { name: 'known_level', check: "level IN ('group', 'segment', 'business_unit', 'department', 'team')", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('hr_people_checked');
export const hr_people_checked = check(hr_people, {
  rules: [
    { name: 'has_id', check: "person_id IS NOT NULL", onFail: 'drop' },
    { name: 'known_status', check: "status IN ('active', 'leave', 'left')", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('cmdb_apps_checked');
export const cmdb_apps_checked = check(cmdb_apps, {
  rules: [
    { name: 'has_id', check: "app_id IS NOT NULL", onFail: 'drop' },
    { name: 'known_lifecycle', check: "lifecycle IN ('build', 'active', 'retiring', 'retired')", onFail: 'drop' },
    { name: 'known_exposure', check: "exposure IN ('internet', 'partner', 'internal')", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('cloud_assets_checked');
export const cloud_assets_checked = check(cloud_assets, {
  rules: [
    { name: 'has_tag', check: "app_tag IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('control_catalog_checked');
export const control_catalog_checked = check(control_catalog, {
  rules: [
    { name: 'has_id', check: "control_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('control_requirements_checked');
export const control_requirements_checked = check(control_requirements, {
  rules: [
    { name: 'known_relationship', check: "relationship IN ('subset of', 'intersects with', 'equal', 'superset of')", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('exceptions_checked');
export const exceptions_checked = check(exceptions, {
  rules: [
    { name: 'known_status', check: "status IN ('approved', 'active', 'superseded', 'expired')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

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
export const tls_checked = check(tls, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('waf_checked');
export const waf_checked = check(waf, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('pentest_schedule_checked');
export const pentest_schedule_checked = check(pentest_schedule, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('encryption_checked');
export const encryption_checked = check(encryption, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('key_rotation_checked');
export const key_rotation_checked = check(key_rotation, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('backup_jobs_checked');
export const backup_jobs_checked = check(backup_jobs, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('dr_exercises_checked');
export const dr_exercises_checked = check(dr_exercises, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('mfa_checked');
export const mfa_checked = check(mfa, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('access_reviews_checked');
export const access_reviews_checked = check(access_reviews, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('logging_coverage_checked');
export const logging_coverage_checked = check(logging_coverage, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('privileged_vault_checked');
export const privileged_vault_checked = check(privileged_vault, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});

cell('edr_coverage_checked');
export const edr_coverage_checked = check(edr_coverage, {
  rules: [
    { name: 'known_status', check: "status IN ('pass', 'fail', 'not_assessed')", onFail: 'drop' },
    { name: 'has_app', check: "app_id IS NOT NULL", onFail: 'drop' },
  ],
  maxDropped: 0.05,
});
