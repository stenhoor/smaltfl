// The control catalogue, its framework mappings and the risk register as they arrive each day (ADR 0020 §2): the files
// that are the posture product's own. The organisation, the inventory, the evidence feeds and the applications are flows
// of their own, which this one reads (ADR 0026). Each file has a gate (written checks hold the day, learned ones warn)
// and a check step that keeps the rows it can read. The silver and gold notebooks read the checked steps.
import { cell, md, param } from 'smaltnb';
import { check, gate, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text('') });

cell('about_sources', { lang: 'md' });
md`The control catalogue, its mappings to the frameworks and the risk register of exceptions, as they arrive each day. Each file’s export time and where it came from are kept beside it, never in its rows`;

cell('control_catalog');
export const control_catalog = source('control_catalog');

cell('control_requirements');
export const control_requirements = source('control_requirements');

cell('exceptions');
export const exceptions = source('exceptions');

cell('about_gates', { lang: 'md' });
md`The bronze gate on each file (ADR 0014, ADR 0015): each is held to its own key. The catalogue changes on purpose, so a new row there only warns. The catalogue and its mappings barely change from day to day, so the forest, which learns what a usual day looks like, has nothing to learn there and is off`;

cell('control_catalog_gate');
export const control_catalog_gate = gate(control_catalog, { layer: 'bronze', reconcile: { key: 'control_id' }, checks: { amount: 'warn', values: 'warn', forest: 'off' } });

cell('control_requirements_gate');
export const control_requirements_gate = gate(control_requirements, { layer: 'bronze', reconcile: { key: ['control_id', 'framework', 'requirement'] }, checks: { amount: 'warn', values: 'warn', forest: 'off' } });

cell('exceptions_gate');
export const exceptions_gate = gate(exceptions, { layer: 'bronze', reconcile: { key: ['exception_id', 'version'] } });

cell('about_checks', { lang: 'md' });
md`Each file’s rows, kept when they can be read: an id, a relationship or a status in the file’s own words`;

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
