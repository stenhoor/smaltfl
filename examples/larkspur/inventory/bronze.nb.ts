// What the group runs, as its systems export it (ADR 0020 §2), a flow of its own (ADR 0025): the applications from the
// CMDB and the cloud inventory each day, and the architecture inventory of shared platforms, which changes rarely. Each
// daily file has a gate and a check step that keeps the rows it can read, which this flow gives to the flows that read
// it; the evidence feeds read the CMDB's file as it arrived, to know which applications each should cover.
import { cell, md, param } from 'smaltnb';
import { check, gate, publish, source } from 'smaltfl/notebook';

cell('params');
export const params = param({ day: param.text('') });

cell('about_sources', { lang: 'md' });
md`What the group runs: the applications from the CMDB and the cloud inventory each day, and the architecture inventory of shared platforms and what depends on them, which changes rarely. Each file’s export time and where it came from are kept beside it, never in its rows`;

cell('cmdb_apps');
export const cmdb_apps = source('cmdb_apps');

cell('cloud_assets');
export const cloud_assets = source('cloud_assets');

cell('platforms');
export const platforms = source('platforms');

cell('platform_links');
export const platform_links = source('platform_links');

cell('about_gates', { lang: 'md' });
md`The bronze gate on each daily file (ADR 0014, ADR 0015): each is held to its own key, an application on one row, a cloud account and tag on one row`;

cell('cmdb_apps_gate');
export const cmdb_apps_gate = gate(cmdb_apps, { layer: 'bronze', reconcile: { key: 'app_id' } });

cell('cloud_assets_gate');
export const cloud_assets_gate = gate(cloud_assets, { layer: 'bronze', reconcile: { key: ['account_id', 'app_tag'] } });

cell('about_checks', { lang: 'md' });
md`Each file’s rows, kept when they can be read: an id or a tag, and a lifecycle and an exposure in the CMDB’s own words`;

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

cell('published');
publish(cmdb_apps_checked, { description: 'The CMDB’s application records that can be read: an id, a known lifecycle and exposure' });
publish(cloud_assets_checked, { description: 'The cloud inventory’s resources that carry an application tag' });
