// The organisation, conformed (ADR 0020 §3): the HR extract's units typed and trimmed, the leaders in post, and the walk
// from every unit up to the group, which gives each unit its levels and the leader it answers to. A vacant unit's leader
// is its acting leader, or else the leader above it, marked as inherited. The walk stops at a parent the extract doesn't
// list, and gives up eight levels up: a chain that reaches neither the group nor an end is a loop.
import { cell, md, sql } from 'smaltnb';
import { check, publish } from 'smaltfl/notebook';
import { hr_org_units_checked, hr_people_checked } from './bronze.nb.js';

cell('about_units', { lang: 'md' });
md`The units and the people leading them, as the HR extract has them today, with blanks made blanks and spaces trimmed`;

cell('org_units', { lang: 'sql' });
export const org_units = sql`
  SELECT trim(org_unit_id) AS org_unit_id, NULLIF(trim(parent_id), '') AS parent_id, trim(name) AS name, trim(level) AS level,
         NULLIF(trim(leader_id), '') AS leader_id, NULLIF(trim(acting_leader_id), '') AS acting_leader_id, trim(cost_centre) AS cost_centre
  FROM ${hr_org_units_checked}`;

cell('leaders', { lang: 'sql' });
export const leaders = sql`
  SELECT trim(person_id) AS person_id, display_name, title, NULLIF(trim(manager_id), '') AS manager_id, trim(org_unit_id) AS org_unit_id, status, in_role_since
  FROM ${hr_people_checked}
  WHERE status IN ('active', 'leave')`;

cell('about_walk', { lang: 'md' });
md`Every unit with each unit above it, one row a pair with how many levels up: the closure the roll-ups add up through. The walk follows each unit's parent while the extract lists it, eight levels at most`;

cell('org_closure', { lang: 'sql' });
export const org_closure = sql`
  WITH RECURSIVE walk(org_unit_id, ancestor_id, depth) AS (
    SELECT org_unit_id, org_unit_id, 0 FROM ${org_units}
    UNION ALL
    SELECT w.org_unit_id, u.parent_id, w.depth + 1
    FROM walk w
    JOIN ${org_units} u ON u.org_unit_id = w.ancestor_id
    JOIN ${org_units} p ON p.org_unit_id = u.parent_id
    WHERE w.depth < 8
  )
  SELECT org_unit_id, ancestor_id, depth FROM walk`;

cell('about_chain', { lang: 'md' });
md`One row a unit: its segment, business unit, department and team, the leader it answers to and how (its own, someone acting, or inherited from above), and whether its chain reaches the group, stops short at a parent the extract doesn't list, or loops`;

cell('org_walk', { lang: 'sql' });
export const org_walk = sql`
  WITH lead AS (
    SELECT c.org_unit_id, COALESCE(a.leader_id, a.acting_leader_id) AS person_id,
           CASE WHEN c.depth > 0 THEN 'inherited' WHEN a.leader_id IS NOT NULL THEN 'leader' ELSE 'acting' END AS how,
           row_number() OVER (PARTITION BY c.org_unit_id ORDER BY c.depth) AS nearest
    FROM ${org_closure} c
    JOIN ${org_units} a ON a.org_unit_id = c.ancestor_id
    WHERE COALESCE(a.leader_id, a.acting_leader_id) IS NOT NULL
  ),
  levels AS (
    SELECT c.org_unit_id, max(c.depth) AS depth,
           max(CASE WHEN a.level = 'segment' THEN a.org_unit_id END) AS segment_id,
           max(CASE WHEN a.level = 'business_unit' THEN a.org_unit_id END) AS business_unit_id,
           max(CASE WHEN a.level = 'department' THEN a.org_unit_id END) AS department_id,
           max(CASE WHEN a.level = 'team' THEN a.org_unit_id END) AS team_id,
           max(CASE WHEN a.level = 'group' AND a.parent_id IS NULL THEN 1 ELSE 0 END) AS reaches_root,
           max(CASE WHEN c.depth >= 8 THEN 1 ELSE 0 END) AS loops
    FROM ${org_closure} c
    JOIN ${org_units} a ON a.org_unit_id = c.ancestor_id
    GROUP BY c.org_unit_id
  )
  SELECT u.org_unit_id, u.name, u.level, u.parent_id, l.depth, l.segment_id, l.business_unit_id, l.department_id, l.team_id,
         d.person_id AS leader_id, d.how AS leader_how,
         CASE WHEN l.loops = 1 THEN 'loops' WHEN l.reaches_root = 1 THEN 'reaches the group' ELSE 'stops short' END AS chain
  FROM ${org_units} u
  JOIN levels l ON l.org_unit_id = u.org_unit_id
  LEFT JOIN lead d ON d.org_unit_id = u.org_unit_id AND d.nearest = 1`;

cell('about_rules', { lang: 'md' });
md`The organisation is one tree: no chain loops, and every unit's chain reaches the group. Either rule broken holds what reads the chain (the owner chains and the roll-ups), not each application's own statuses, which read the teams themselves`;

cell('org_chain');
export const org_chain = check(org_walk, {
  rules: [
    { name: 'no_loop', check: "chain <> 'loops'", onFail: 'fail' },
    { name: 'one_root', check: "chain <> 'stops short'", onFail: 'fail' },
  ],
  maxDropped: 0,
});

cell('published');
publish(org_chain, { description: 'Every organisational unit with its levels, the leader it answers to, and whether its chain reaches the group' });
