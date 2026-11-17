// Ownership, a flow for the catalogue (ADR 0025 §10): who answers for what. It reads what the Applications flow and the
// HR organisation give, and has no file of its own: added to a flow that reads those two, it is built from the day's
// run as they are.
import { cell, md, param, sql } from 'smaltnb';
import { publish } from 'smaltfl/notebook';
import { app_owners, apps } from '../../applications/apps.nb.js';
import { org_units } from '../../hr/org.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_units', { lang: 'md' });
md`Each business unit with the applications it owns that aren't retired: how many, how many face the internet, and how many are tier 1. The applications whose chain of owners doesn't reach the group are counted under Unassigned, never dropped.`;

cell('apps_by_unit', { lang: 'sql' });
export const apps_by_unit = sql`
  SELECT o.business_unit_id, COALESCE(u.name, 'Unassigned') AS business_unit, count(*) AS applications,
         sum(CASE WHEN a.exposure = 'internet' THEN 1 ELSE 0 END) AS internet_facing,
         sum(CASE WHEN a.tier = '1' THEN 1 ELSE 0 END) AS tier_one
  FROM ${app_owners} o
  JOIN ${apps} a ON a.app_id = o.app_id
  LEFT JOIN ${org_units} u ON u.org_unit_id = o.business_unit_id
  WHERE o.lifecycle <> 'retired'
  GROUP BY o.business_unit_id, COALESCE(u.name, 'Unassigned')`;

cell('about_unowned', { lang: 'md' });
md`The applications nobody answers for: their owning team's chain stops short of the group, or names a team HR doesn't have. At Larkspur these are known as somebody's, as in "somebody's sure to know". On a day that went out the list is empty: the Applications flow holds a day with even one. On a day it holds, this is the list that turns somebody into a name: claim each, or retire it.`;

cell('unowned_apps', { lang: 'sql' });
export const unowned_apps = sql`
  SELECT a.app_id, a.name, a.owner_team_id, a.tier, a.exposure, a.lifecycle
  FROM ${app_owners} o
  JOIN ${apps} a ON a.app_id = o.app_id
  WHERE o.orphaned = 'yes' AND o.lifecycle <> 'retired'`;

cell('published');
publish(apps_by_unit, { description: 'Each business unit with the applications it owns: how many, how many face the internet, how many are tier 1' });
publish(unowned_apps, { description: 'The applications whose chain of owners doesn’t reach the group: none on a day that went out, the list to work from on a day held for one' });
