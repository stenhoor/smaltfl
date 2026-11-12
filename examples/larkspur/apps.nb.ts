// The applications, conformed (ADR 0020 §3): the CMDB's records with their ids made one (upper case, no spaces) and each
// application's newest record kept, owner conflicts flagged; the cloud inventory read against them; each application's
// owner chain, with an Unassigned member for the ones whose chain doesn't resolve (never a blank, never dropped); its
// platforms, walked through what each depends on; and the cloud's tags nobody registered.
import { cell, md, sql } from 'smaltnb';
import { check, gate, publish } from 'smaltfl/notebook';
import { backup_jobs_checked, cloud_assets_checked, cmdb_apps_checked, encryption_checked, findings_checked, logging_coverage_checked, mfa_checked, platform_links, privileged_vault_checked, tls_checked } from './bronze.nb.js';
import { org_chain } from './org.nb.js';

cell('about_clean', { lang: 'md' });
md`The CMDB's records, one an application: ids upper-cased and trimmed, so a record written again as \`app-0001 \` is APP-0001's; where an application has several records, the newest kept, and the records it had and whether they named different owners said beside it`;

cell('apps_dedup', { lang: 'sql' });
export const apps_dedup = sql`
  WITH n AS (
    SELECT upper(trim(app_id)) AS app_id, trim(name) AS name, upper(trim(owner_team_id)) AS owner_team_id, tier, exposure, data_class, datastore,
           hosting, site, NULLIF(trim(platform_id), '') AS platform_id, lifecycle, created_on, go_live, NULLIF(trim(retire_by), '') AS retire_by, updated_at,
           row_number() OVER (PARTITION BY upper(trim(app_id)) ORDER BY updated_at DESC) AS newest,
           count(*) OVER (PARTITION BY upper(trim(app_id))) AS records
    FROM ${cmdb_apps_checked}
  ),
  owners AS (
    SELECT app_id, count(DISTINCT owner_team_id) AS owners FROM n GROUP BY app_id
  )
  SELECT n.app_id, n.name, n.owner_team_id, n.tier, n.exposure, n.data_class, n.datastore, n.hosting, n.site, n.platform_id, n.lifecycle,
         n.created_on, n.go_live, n.retire_by, n.updated_at, n.records, CASE WHEN o.owners > 1 THEN 'yes' ELSE 'no' END AS owner_conflict
  FROM n
  JOIN owners o ON o.app_id = n.app_id
  WHERE n.newest = 1`;

cell('apps_clean');
export const apps_clean = check(apps_dedup, {
  rules: [{ name: 'one_owner', check: "owner_conflict = 'no'", onFail: 'warn' }],
  maxDropped: 0.05,
});

cell('about_apps', { lang: 'md' });
md`The conformed applications, the objects every evidence feed has one row each of (the ontology's \`application\`), each marked by whether the cloud inventory has resources under its tag. One row an application, held where one is on two. None should have had two owners: the ontology's band says so, and since the newest record is kept and bronze holds the CMDB's own values, a value or a band missed here only warns`;

cell('apps', { lang: 'sql' });
export const apps = sql`
  SELECT a.app_id, a.name, a.owner_team_id, a.tier, a.exposure, a.data_class, a.datastore, a.hosting, a.site, a.platform_id, a.lifecycle,
         a.created_on, a.go_live, a.retire_by, a.updated_at, a.records, a.owner_conflict, CASE WHEN c.app_tag IS NULL THEN 'no' ELSE 'yes' END AS in_cloud
  FROM ${apps_clean} a
  LEFT JOIN (SELECT DISTINCT upper(trim(app_tag)) AS app_tag FROM ${cloud_assets_checked}) c ON c.app_tag = a.app_id`;

cell('apps_gate');
export const apps_gate = gate(apps, { layer: 'silver', reconcile: { key: 'app_id' }, checks: { reconcile: 'hold', values: 'warn', pairs: 'off', forest: 'off' } });

cell('about_owners', { lang: 'md' });
md`Each application with its owning team's chain: department, business unit, segment. An application whose chain doesn't reach the group is kept, under the Unassigned member, and marked orphaned: every active application has an owner chain, and one without holds the roll-ups`;

cell('app_owners_joined', { lang: 'sql' });
export const app_owners_joined = sql`
  SELECT a.app_id, a.name, a.lifecycle, a.owner_team_id,
         CASE WHEN o.chain = 'reaches the group' THEN 'no' ELSE 'yes' END AS orphaned,
         CASE WHEN o.chain = 'reaches the group' THEN o.department_id ELSE 'UNASSIGNED' END AS department_id,
         CASE WHEN o.chain = 'reaches the group' THEN o.business_unit_id ELSE 'UNASSIGNED' END AS business_unit_id,
         CASE WHEN o.chain = 'reaches the group' THEN o.segment_id ELSE 'UNASSIGNED' END AS segment_id,
         o.leader_id AS team_leader_id
  FROM ${apps} a
  LEFT JOIN ${org_chain} o ON o.org_unit_id = a.owner_team_id`;

cell('app_owners');
export const app_owners = check(app_owners_joined, {
  rules: [{ name: 'owner_chain', check: "orphaned = 'no' OR lifecycle = 'retired'", onFail: 'fail' }],
  maxDropped: 0,
});

cell('about_platforms', { lang: 'md' });
md`Each application's platforms: the ones its feeds name (its runtime, ingress, certificate authority, identity provider, key store, backup controller, log pipeline, vault, scanner), then everything those depend on, as far as the architecture inventory goes`;

cell('app_platforms', { lang: 'sql' });
export const app_platforms = sql`
  WITH RECURSIVE direct(app_id, platform_id) AS (
    SELECT app_id, platform_id FROM ${apps} WHERE COALESCE(platform_id, '') <> ''
    UNION SELECT upper(trim(app_id)), ingress FROM ${tls_checked} WHERE COALESCE(ingress, '') <> ''
    UNION SELECT upper(trim(app_id)), issuer FROM ${tls_checked} WHERE issuer LIKE 'ca-%'
    UNION SELECT upper(trim(app_id)), idp FROM ${mfa_checked} WHERE idp LIKE 'idp-%'
    UNION SELECT upper(trim(app_id)), key_store FROM ${encryption_checked} WHERE key_store LIKE 'kms-%' OR key_store LIKE 'hsm-%'
    UNION SELECT upper(trim(app_id)), controller FROM ${backup_jobs_checked} WHERE controller LIKE 'bkp-%'
    UNION SELECT upper(trim(app_id)), pipeline FROM ${logging_coverage_checked} WHERE pipeline LIKE 'log-%'
    UNION SELECT upper(trim(app_id)), forwarder_issuer FROM ${logging_coverage_checked} WHERE forwarder_issuer LIKE 'ca-%'
    UNION SELECT upper(trim(app_id)), vault FROM ${privileged_vault_checked} WHERE vault LIKE 'pam-%'
    UNION SELECT upper(trim(app_id)), scanner FROM ${findings_checked} WHERE scanner LIKE 'scn-%'
  ),
  reach(app_id, platform_id, depth) AS (
    SELECT app_id, platform_id, 0 FROM direct
    UNION
    SELECT r.app_id, l.target, r.depth + 1
    FROM reach r
    JOIN ${platform_links} l ON l.platform_id = r.platform_id AND l.relation = 'depends_on'
    WHERE r.depth < 6
  )
  SELECT app_id, platform_id, min(depth) AS depth FROM reach GROUP BY app_id, platform_id`;

cell('about_shadow', { lang: 'md' });
md`Tags in the cloud inventory that name no application in the CMDB: resources nobody registered, a few sandbox tags on a usual day. Gold counts them under the Unregistered application. Its amount is watched and only warns: shadow IT is true data`;

cell('shadow_assets', { lang: 'sql' });
export const shadow_assets = sql`
  SELECT c.account_id, c.region, upper(trim(c.app_tag)) AS app_tag, c.resources
  FROM ${cloud_assets_checked} c
  LEFT JOIN ${apps} a ON a.app_id = upper(trim(c.app_tag))
  WHERE a.app_id IS NULL`;

cell('shadow_gate');
export const shadow_gate = gate(shadow_assets, { layer: 'silver', checks: { amount: 'warn', pairs: 'off', forest: 'off', classifier: 'off' } });

cell('published');
publish(apps, { description: 'The conformed applications: one an application, its newest record, and whether the cloud has it' });
publish(app_owners, { description: 'Each application with its owner chain; Unassigned where the chain doesn’t resolve' });
publish(shadow_assets, { description: 'Cloud resources under tags no CMDB record names' });
