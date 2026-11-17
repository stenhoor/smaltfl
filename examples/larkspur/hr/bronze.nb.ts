// The organisation as HR exports it each day (ADR 0020 §2), a flow of its own (ADR 0026): its units and the people
// leading them, judged as they arrive. Each file has a gate (written checks hold the day, learned ones warn) and a
// check step that keeps the rows it can read. The organisation's notebook reads the checked steps.
import { cell, md, param } from 'smaltnb';
import { check, gate, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text('') });

cell('about_sources', { lang: 'md' });
md`The organisation as HR exports it each day: every unit with its parent and its leader, and the people leading them. Each file’s export time and where it came from are kept beside it, never in its rows`;

cell('hr_org_units');
export const hr_org_units = source('hr_org_units');

cell('hr_people');
export const hr_people = source('hr_people');

cell('about_gates', { lang: 'md' });
md`The bronze gate on each file (ADR 0014, ADR 0015): each is held to its own key, a unit on one row and a person on one row. The units barely change from day to day, so the forest, which learns what a usual day looks like, has nothing to learn there and is off`;

cell('hr_org_units_gate');
export const hr_org_units_gate = gate(hr_org_units, { layer: 'bronze', reconcile: { key: 'org_unit_id' }, checks: { forest: 'off' } });

cell('hr_people_gate');
export const hr_people_gate = gate(hr_people, { layer: 'bronze', reconcile: { key: 'person_id' } });

cell('about_checks', { lang: 'md' });
md`Each file’s rows, kept when they can be read: an id, and a level or a status in the file’s own words`;

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
