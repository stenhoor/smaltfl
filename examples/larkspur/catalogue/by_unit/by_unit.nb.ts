// Control by unit, a flow for the catalogue with open inputs (ADR 0025 §11): one control's evidence told by business
// unit. It has no file of its own and names no dataset of the estate: it reads the evidence feed and the owners that a
// flow using it maps onto its two inputs, and the floor that use sets. So it is used once for each control worth a
// closer look, each use under its own name, and one change here reaches every one of them.
import { cell, md, param, sql } from 'smaltnb';
import { input, publish } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text(''), floor: param.number(90) });

cell('about_feed', { lang: 'md' });
md`The evidence: an application a row, with the control's status. Of whatever feed is mapped here the flow reads three columns, and the third is the day a filled row came from: every evidence feed of the estate can be filled from another day, and what is built from one says so.`;

cell('feed');
export const feed = input('feed');

cell('about_owners', { lang: 'md' });
md`The owners: each application with the business unit that answers for it.`;

cell('owners');
export const owners = input('owners');

cell('about_judged', { lang: 'md' });
md`The applications the control was judged on: those that aren't retired, with a pass or a fail. An id is matched as a person reads one, whatever its case and the spaces around it.`;

cell('judged', { lang: 'sql' });
export const judged = sql`
  SELECT o.app_id, o.name, o.business_unit_id, f.status, f.filled_from
  FROM ${feed} f
  JOIN ${owners} o ON o.app_id = upper(trim(f.app_id))
  WHERE o.lifecycle <> 'retired' AND f.status IN ('pass', 'fail')`;

cell('about_units', { lang: 'md' });
md`Each business unit with how many of its applications pass and fail, and whether it is behind: under the floor this use sets, 90 percent where it sets none.`;

cell('units', { lang: 'sql' });
export const units = sql`
  SELECT business_unit_id, count(*) AS applications,
         sum(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) AS passing,
         sum(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) AS failing,
         round(100.0 * sum(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) / count(*), 1) AS pass_share,
         CASE WHEN 100.0 * sum(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) / count(*) < ${params.floor} THEN 'yes' ELSE 'no' END AS behind,
         max(filled_from) AS filled_from
  FROM ${judged}
  GROUP BY business_unit_id`;

cell('about_failing', { lang: 'md' });
md`The applications that fail, each with the unit that answers for it: the list a unit that is behind works from.`;

cell('failing', { lang: 'sql' });
export const failing = sql`
  SELECT app_id, name, business_unit_id, filled_from
  FROM ${judged}
  WHERE status = 'fail'`;

cell('published');
publish(units, { description: 'Each business unit with the applications that pass and fail the control, and whether it is under the floor' });
publish(failing, { description: 'The applications that fail the control, each with the business unit that answers for it' });
