/**
 * The Larkspur estate (test/fixtures/larkspur.ts, ADR 0020 slice 1): what the dataset is, asserted from the generator
 * alone, on calm days. No judge is asserted here: these tests hold the data to the promises ADR 0020 §1 makes, so the
 * later slices ask their questions of honest data:
 *
 * - the organisation is one tree, led every day, with leaders who leave, posts that stand vacant, and people acting;
 * - the applications are typed, owned by a team, and live and retire; what applies to each follows its type that day;
 * - the platforms are a dependency graph with no loop, and each application's platforms fit its type;
 * - the catalogue's applicability, written as data, is what the feeds cover; its mappings use NIST IR 8477's words;
 * - the evidence feeds say a tool's own status, their columns agree with it, and they name the platforms;
 * - the findings ledger tells a clean application from one the scanner never reached or couldn't log in to;
 * - the risk register keeps a row a version, an extension keeping the first expiry;
 * - a day at the demo's scale is about 2,400 applications and 25,000 rows.
 */
import { describe, expect, it } from 'vitest';
import {
  addDays, appliesTo, appsOn, CONTROL, CONTROL_IDS, CONTROLS, csvOf, DAILY_FILES, dayFile, dayFiles, daysFrom, EVIDENCE_FILES, exceptedOn, FILE_CONTROL, fixedFiles,
  larkspur, LARKSPUR_FROM, LARKSPUR_LOADS_FROM, leaderOf, LEVELS, orgOn, ownedOn, patchTuesday, PLATFORMS, rawStatus, REQUIREMENTS, SEVERITY_DAYS, vulnOn,
  type AppOn, type Cell, type DailyFile, type Table,
} from './fixtures/larkspur.js';

const w = larkspur({ apps: 650 });
/** Calm days across the span: two Patch Tuesdays among them. */
const CALM = ['2023-06-07', '2023-11-14', '2024-01-09', '2024-02-20', '2024-03-05', '2024-03-18'];
const cache = new Map<string, Record<DailyFile, Table>>();
const files = (d: string) => {
  if (!cache.has(d)) cache.set(d, dayFiles(w, d));
  return cache.get(d)!;
};
const col = (t: Table, name: string) => {
  const i = t.columns.indexOf(name);
  if (i < 0) throw new Error(`no column ${name}`);
  return i;
};
const cells = (t: Table, name: string): Cell[] => t.rows.map((r) => r[col(t, name)]!);
const byApp = (d: string) => new Map(appsOn(w, d).map((a) => [a.app_id, a]));
const share = <T>(xs: readonly T[], f: (x: T) => boolean) => xs.filter(f).length / Math.max(1, xs.length);

describe('the organisation', () => {
  it('is one tree: a group, five segments, sixteen business units, three departments each, about 180 teams', () => {
    const count = (level: string) => w.units.filter((u) => u.level === level).length;
    expect([count('group'), count('segment'), count('business_unit'), count('department')]).toEqual([1, 5, 16, 48]);
    expect(count('team')).toBeGreaterThan(150);
    expect(count('team')).toBeLessThan(210);
    for (const u of w.units) {
      if (u.level === 'group') expect(u.parent).toBeNull();
      else expect(LEVELS.indexOf(w.unit.get(u.parent!)!.level), u.id).toBe(LEVELS.indexOf(u.level) - 1);
    }
    expect(new Set(w.units.map((u) => u.name)).size).toBe(w.units.length);
  });

  it('is led every day: a leader in post, or someone acting, or the leader above; every leader answers to the one above', () => {
    let vacant = 0;
    let acting = 0;
    for (const d of CALM) {
      const { units, people } = orgOn(w, d);
      const listed = new Map(people.map((p) => [p.person_id, p]));
      expect(listed.size, d).toBe(people.length);
      for (const u of units) {
        if (u.leader_id) expect(['active', 'leave'], `${d} ${u.org_unit_id}`).toContain(listed.get(u.leader_id)?.status);
        else vacant++;
        if (u.acting_leader_id) {
          acting++;
          // Whoever acts leads a unit of their own that day.
          expect(listed.get(u.acting_leader_id)?.status, `${d} ${u.org_unit_id}`).toBe('active');
        }
        expect(leaderOf(w, u.org_unit_id, d), `${d} ${u.org_unit_id}`).toBeTruthy();
      }
      for (const p of people) {
        if (p.status === 'left') continue;
        const unit = w.unit.get(p.org_unit_id)!;
        expect(p.manager_id, `${d} ${p.person_id}`).toBe(unit.parent ? leaderOf(w, unit.parent, d) : '');
        if (p.manager_id) expect(listed.has(p.manager_id), `${d} ${p.person_id}'s manager`).toBe(true);
      }
      expect(units.filter((u) => !u.leader_id).length / units.length, d).toBeLessThan(0.08);
    }
    expect(vacant).toBeGreaterThan(0);
    expect(acting / vacant).toBeGreaterThan(0.5);
  });

  it('changes hands: about a third of the posts over the span, the leaver listed as left for thirty days, the post vacant a while', () => {
    const changed = [...w.tenures.values()].filter((t) => t.length > 1);
    expect(changed.length / w.units.length).toBeGreaterThan(0.2);
    expect(changed.length / w.units.length).toBeLessThan(0.45);
    const [first, second] = changed.find((t) => t[0]!.to! > LARKSPUR_FROM && t[0]!.to! < '2024-01-01')!;
    const status = (d: string) => orgOn(w, d).people.find((p) => p.person_id === first!.person)?.status;
    expect(status(addDays(first!.to!, -1))).toMatch(/active|leave/);
    expect(status(first!.to!)).toBe('left');
    expect(status(addDays(first!.to!, 29))).toBe('left');
    expect(status(addDays(first!.to!, 30))).toBeUndefined();
    const gap = daysFrom(first!.to!, second!.from!);
    expect(gap).toBeGreaterThanOrEqual(20);
    expect(gap).toBeLessThanOrEqual(60);
    expect(orgOn(w, first!.to!).units.find((u) => u.org_unit_id === first!.unit)!.leader_id).toBe('');
  });

  it('gives every person one name and no name to two people', () => {
    expect(new Set(w.people.values()).size).toBe(w.people.size);
  });

  it('keeps some departments better than others: the worst kept fail at more than twice the rate of the best', () => {
    const p = w.units.filter((u) => u.level === 'department').map((u) => u.propensity);
    expect(Math.max(...p) / Math.min(...p)).toBeGreaterThan(2);
  });
});

describe('the applications', () => {
  it('are about six hundred in the CMDB in March 2024, a few created each month and a few retiring or retired', () => {
    const march = appsOn(w, LARKSPUR_LOADS_FROM);
    expect(march.length).toBeGreaterThan(560);
    expect(march.length).toBeLessThan(640);
    const lifecycles = new Set(march.map((a) => a.lifecycle));
    expect([...lifecycles].sort()).toEqual(['active', 'build', 'retired', 'retiring']);
    const createdIn = (month: string) => w.apps.filter((a) => a.created.startsWith(month)).length;
    for (const month of ['2023-05', '2023-09', '2024-01']) expect(createdIn(month), month).toBeGreaterThan(0);
    // A retired application stays listed for sixty days, then is gone.
    const retired = w.apps.find((a) => a.retireBy && a.retireBy > LARKSPUR_FROM && a.retireBy < '2023-12-01')!;
    const listed = (d: string) => appsOn(w, d).find((a) => a.app_id === retired.id);
    expect(listed(addDays(retired.retireBy!, -1))?.lifecycle).toBe('retiring');
    expect(listed(retired.retireBy!)?.lifecycle).toBe('retired');
    expect(listed(addDays(retired.retireBy!, 59))?.lifecycle).toBe('retired');
    expect(listed(addDays(retired.retireBy!, 60))).toBeUndefined();
  });

  it('are typed: a fifth to a third internet-facing, about a sixth tier 1, most in the cloud, a third or more with regulated data', () => {
    const apps = appsOn(w, LARKSPUR_LOADS_FROM);
    expect(share(apps, (a) => a.exposure === 'internet')).toBeGreaterThan(0.15);
    expect(share(apps, (a) => a.exposure === 'internet')).toBeLessThan(0.35);
    expect(share(apps, (a) => a.exposure === 'partner')).toBeGreaterThan(0.03);
    expect(share(apps, (a) => a.tier === 1)).toBeGreaterThan(0.1);
    expect(share(apps, (a) => a.tier === 1)).toBeLessThan(0.25);
    expect(share(apps, (a) => a.hosting === 'cloud')).toBeGreaterThan(0.45);
    expect(share(apps, (a) => a.hosting === 'saas')).toBeLessThan(0.2);
    expect(share(apps, (a) => a.data_class === 'pci' || a.data_class === 'pii')).toBeGreaterThan(0.3);
    expect(share(apps, (a) => a.datastore === 'yes')).toBeGreaterThan(0.6);
    expect(new Set(apps.map((a) => a.app_id)).size).toBe(apps.length);
  });

  it('are each owned by a team that day, and a few change type or owner, the change dated in updated_at', () => {
    for (const d of CALM) for (const a of appsOn(w, d)) expect(w.unit.get(a.owner_team_id)?.level, `${d} ${a.app_id}`).toBe('team');
    const changed = w.apps.filter((a) => a.change && a.change.at > LARKSPUR_FROM && a.change.at < '2024-03-01');
    const moved = w.apps.filter((a) => a.move && a.move.at > LARKSPUR_FROM && a.move.at < '2024-03-01');
    expect(changed.length).toBeGreaterThan(5);
    expect(moved.length).toBeGreaterThan(2);
    for (const draw of changed) {
      const [before, after] = [addDays(draw.change!.at, -1), draw.change!.at].map((d) => appsOn(w, d).find((a) => a.app_id === draw.id)!);
      const key = Object.keys(draw.change!.set)[0] as keyof AppOn;
      expect(after[key], draw.id).not.toBe(before[key]);
      expect(after.updated_at.slice(0, 10), draw.id).toBe(draw.change!.at);
    }
    for (const d of CALM) for (const a of appsOn(w, d)) expect(a.updated_at.slice(0, 10) <= d, `${d} ${a.app_id}`).toBe(true);
  });
});

describe('the platforms', () => {
  it('are 46, a dependency graph with no loop, every dependency a platform', () => {
    expect(PLATFORMS).toHaveLength(46);
    const known = new Map(PLATFORMS.map((p) => [p.id, p]));
    expect(known.size).toBe(46);
    const depth = new Map<string, number>();
    const visit = (id: string, path: string[]): number => {
      if (path.includes(id)) throw new Error(`loop: ${[...path, id].join(' → ')}`);
      if (depth.has(id)) return depth.get(id)!;
      const p = known.get(id);
      if (!p) throw new Error(`unknown platform ${id}`);
      const d = 1 + Math.max(0, ...p.depends_on.map((x) => visit(x, [...path, id])));
      depth.set(id, d);
      return d;
    };
    for (const p of PLATFORMS) visit(p.id, []);
    expect(Math.max(...depth.values())).toBeGreaterThanOrEqual(3);
    const { platforms, platform_links } = fixedFiles();
    expect(platforms.rows).toHaveLength(46);
    expect(platform_links.rows.filter((r) => r[1] === 'depends_on').length).toBe(PLATFORMS.reduce((s, p) => s + p.depends_on.length, 0));
  });

  it('fit each application’s type: an ingress for what is exposed, a key store and a backup for a datastore, none of ours for SaaS', () => {
    const kind = new Map(PLATFORMS.map((p) => [p.id, p.kind]));
    const cas = new Map(PLATFORMS.filter((p) => p.kind === 'ingress').map((p) => [p.id, p.depends_on.find((x) => kind.get(x) === 'certificate_authority')]));
    for (const a of appsOn(w, '2024-03-05')) {
      const saas = a.hosting === 'saas';
      const d = a.deps;
      expect(d.runtime ? kind.get(d.runtime) : null, a.app_id).toBe(saas ? null : a.platform_id.startsWith('vmf-') ? 'vm_farm' : 'cluster');
      expect(!!d.ingress, a.app_id).toBe(a.exposure !== 'internal' && !saas);
      if (d.ingress) expect(d.issuer, a.app_id).toBe(cas.get(d.ingress));
      expect(!!d.key_store, a.app_id).toBe(a.datastore === 'yes');
      expect(!!d.backup, a.app_id).toBe(a.datastore === 'yes' && !saas);
      for (const x of [d.scanner, d.edr, d.log_pipeline]) expect(!!x, a.app_id).toBe(!saas);
      expect(!!d.vault, a.app_id).toBe(a.tier <= 2);
      for (const x of [d.runtime, d.ingress, d.backup, d.scanner, d.edr, d.log_pipeline, d.vault]) if (x) expect(kind.has(x), `${a.app_id} ${x}`).toBe(true);
    }
  });

  it('provide the controls the catalogue says a platform of their kind provides', () => {
    for (const c of CONTROLS) {
      const providers = PLATFORMS.filter((p) => p.provides.some(([id]) => id === c.id));
      if (!c.provided_by) expect(providers, c.id).toEqual([]);
      else {
        expect(providers.length, c.id).toBeGreaterThan(0);
        for (const p of providers) {
          expect(p.kind, c.id).toBe(c.provided_by);
          expect(p.provides.find(([id]) => id === c.id)![1], c.id).toBe(c.allocation);
        }
      }
    }
  });
});

describe('the catalogue', () => {
  it('has fourteen controls, twelve with a feed and two told in silver, each in a CSF 2.0 function', () => {
    expect(CONTROLS.map((c) => c.id)).toEqual([...CONTROL_IDS]);
    expect(CONTROLS.filter((c) => !c.feed).map((c) => c.id)).toEqual(['vuln_sla', 'ownership']);
    expect(CONTROLS.filter((c) => c.feed).map((c) => c.feed)).toEqual([...EVIDENCE_FILES]);
    for (const c of CONTROLS) {
      expect(['GV', 'ID', 'PR', 'DE', 'RS', 'RC'], c.id).toContain(c.csf_function);
      expect(c.csf_category.startsWith(`${c.csf_function}.`), c.id).toBe(true);
      expect(c.weight).toBeGreaterThanOrEqual(1);
      expect(c.weight).toBeLessThanOrEqual(3);
    }
    expect(CONTROL.ownership.csf_function).toBe('GV');
  });

  it('maps every control to frameworks in NIST IR 8477’s words', () => {
    for (const c of CONTROLS) expect(REQUIREMENTS.filter((r) => r.control === c.id).length, c.id).toBeGreaterThanOrEqual(3);
    expect(new Set(REQUIREMENTS.map((r) => r.relationship))).toEqual(new Set(['subset of', 'intersects with', 'equal']));
    expect(new Set(REQUIREMENTS.map((r) => r.framework))).toEqual(new Set(['NIST CSF 2.0', 'ISO/IEC 27001:2022', 'PCI DSS v4.0.1', 'SOC 2']));
    expect(dayFile(w, 'control_requirements', '2024-03-05').rows).toHaveLength(REQUIREMENTS.length);
  });

  it('writes applicability as data, and the file’s conditions select exactly what each feed covers', () => {
    const cat = dayFile(w, 'control_catalog', '2024-03-05');
    const conditions = new Map(cat.rows.map((r) => [String(r[0]), (['exposure', 'tier', 'data_class', 'datastore', 'hosting', 'lifecycle'] as const).map((k) => [k, String(r[col(cat, `applies_${k}`)])] as const)]));
    expect(conditions.size).toBe(14);
    const selects = (control: string, a: AppOn) => conditions.get(control)!.every(([k, v]) => v === '*' || v.split(';').includes(String(a[k])));
    for (const d of ['2023-06-07', '2024-03-05']) {
      for (const a of appsOn(w, d)) for (const c of CONTROLS) expect(selects(c.id, a), `${d} ${a.app_id} ${c.id}`).toBe(appliesTo(c, a));
    }
    // Depends on and compensated by name a control, or the attribute that compensates.
    for (const c of CONTROLS) {
      if (c.depends_on) expect(CONTROL_IDS, c.id).toContain(c.depends_on);
      if (c.compensated_by) expect(['waf', 'private_link'], c.id).toContain(c.compensated_by);
    }
  });
});

describe('the evidence feeds', () => {
  it('have one row an application the control applies to, every calm day, in key order', () => {
    for (const d of CALM) {
      const apps = appsOn(w, d);
      for (const f of EVIDENCE_FILES) {
        const ids = cells(files(d)[f], 'app_id').map(String);
        expect(ids, `${f} ${d}`).toEqual(apps.filter((a) => appliesTo(FILE_CONTROL[f], a)).map((a) => a.app_id));
      }
    }
  });

  it('say the tool’s own status, never an exception, and fail a modest share on a calm day', () => {
    const words = new Set<string>();
    for (const d of CALM) {
      for (const f of EVIDENCE_FILES) {
        const st = cells(files(d)[f], 'status').map(String);
        for (const s of st) words.add(s);
        expect(share(st, (s) => s === 'fail'), `${f} ${d}`).toBeLessThan(0.2);
        expect(share(st, (s) => s === 'not_assessed'), `${f} ${d}`).toBeLessThan(0.05);
      }
      // The controls a platform provides rarely fail on their own.
      for (const f of ['tls', 'waf', 'backup_jobs'] as const) expect(share(cells(files(d)[f], 'status'), (s) => s === 'fail'), `${f} ${d}`).toBeLessThan(0.09);
    }
    expect([...words].sort()).toEqual(['fail', 'not_assessed', 'pass']);
  });

  it('carry columns that agree with the status, and blanks where nothing was measured', () => {
    for (const d of CALM) {
      const f = files(d);
      const rows = (file: DailyFile) => f[file].rows.map((r) => Object.fromEntries(f[file].columns.map((c, i) => [c, r[i]])) as Record<string, Cell>);
      for (const r of rows('waf')) if (r.status === 'pass') expect(r.mode).toBe('block');
      for (const r of rows('mfa')) {
        if (r.status === 'pass') expect(r.enforced).toBe('yes');
        if (r.status === 'fail') expect(r.enforced).toBe('no');
        if (r.status === 'not_assessed') expect([r.enforced, r.registered_pct]).toEqual([null, null]);
      }
      for (const r of rows('tls')) if (r.status === 'fail') expect(r.protocol === 'TLS1.0' || String(r.not_after) < d).toBe(true);
      for (const r of rows('edr_coverage')) if (r.status === 'pass') expect([r.reporting, r.reduced_functionality]).toEqual([r.hosts, 0]);
      for (const r of rows('privileged_vault')) expect(r.status === 'fail' ? Number(r.unvaulted) > 0 : r.status === 'pass' ? r.unvaulted === 0 : r.unvaulted === null).toBe(true);
      for (const r of rows('backup_jobs')) {
        if (r.status === 'not_assessed') continue;
        const hours = (Date.parse(`${d}T04:55:00Z`) - Date.parse(String(r.last_success))) / 3600e3;
        expect(r.status === 'pass' ? hours < Number(r.rpo_hours) : hours > Number(r.rpo_hours)).toBe(true);
      }
    }
    // Registered isn't enforced: some applications failing MFA have nearly everyone registered.
    const failing = CALM.flatMap((d) => files(d).mfa.rows.filter((r) => r[col(files(d).mfa, 'status')] === 'fail'));
    expect(failing.some((r) => Number(r[col(files(CALM[0]!).mfa, 'registered_pct')]) >= 90)).toBe(true);
  });

  it('name the platforms each application relies on', () => {
    const d = '2024-03-05';
    const apps = byApp(d);
    const named: [DailyFile, string, (a: AppOn) => string][] = [
      ['tls', 'ingress', (a) => a.deps.ingress ?? ''], ['tls', 'issuer', (a) => a.deps.issuer], ['waf', 'ingress', (a) => a.deps.ingress ?? ''],
      ['mfa', 'idp', (a) => a.deps.idp], ['backup_jobs', 'controller', (a) => a.deps.backup ?? ''], ['logging_coverage', 'pipeline', (a) => a.deps.log_pipeline ?? ''],
      ['encryption', 'key_store', (a) => a.deps.key_store ?? ''], ['privileged_vault', 'vault', (a) => a.deps.vault ?? ''],
    ];
    for (const [file, column, of] of named) {
      const t = files(d)[file];
      for (const r of t.rows) expect(r[col(t, column)], `${file}.${column} ${r[0]}`).toBe(of(apps.get(String(r[0]))!));
    }
  });

  it('never pass key rotation where encryption at rest fails', () => {
    for (const d of CALM) {
      const enc = new Map(files(d).encryption.rows.map((r) => [r[0], r[col(files(d).encryption, 'status')]]));
      const key = files(d).key_rotation;
      expect(key.rows.filter((r) => r[col(key, 'status')] === 'pass' && enc.get(r[0]) === 'fail'), d).toEqual([]);
    }
  });

  it('leave a failure standing more often under an exception: what is accepted is left unfixed', () => {
    let excepted = 0;
    let exceptedFail = 0;
    let all = 0;
    let allFail = 0;
    for (const d of CALM) {
      for (const a of appsOn(w, d)) {
        for (const c of ['encryption', 'logging', 'edr', 'mfa', 'privileged_access'] as const) {
          if (!appliesTo(c, a)) continue;
          const fail = rawStatus(w, c, a, d) === 'fail';
          all++;
          if (fail) allFail++;
          if (exceptedOn(w, a.app_id, c, d)) {
            excepted++;
            if (fail) exceptedFail++;
          }
        }
      }
    }
    expect(excepted).toBeGreaterThan(20);
    expect(exceptedFail / excepted).toBeGreaterThan(2.5 * (allFail / all));
  });

  it('take their SLA statuses from dates: pentests due 15 March, DR exercises 22 March, access reviews at quarter ends', () => {
    const failShare = (file: DailyFile, d: string) => share(cells(dayFile(w, file, d), 'status'), (s) => s === 'fail');
    expect(failShare('pentest_schedule', '2023-03-15')).toBeLessThan(0.03);
    expect(failShare('pentest_schedule', '2023-03-16')).toBeGreaterThan(0.04);
    expect(failShare('dr_exercises', '2023-03-22')).toBeLessThan(0.03);
    expect(failShare('dr_exercises', '2023-03-23')).toBeGreaterThan(failShare('dr_exercises', '2023-03-22'));
    expect(failShare('access_reviews', '2023-06-30')).toBeLessThan(0.04);
    expect(failShare('access_reviews', '2023-07-01')).toBeGreaterThan(0.05);
    const due = dayFile(w, 'dr_exercises', '2024-03-20');
    expect(cells(due, 'next_due').filter((x) => x === '2024-03-22').length).toBeGreaterThan(20);
  });
});

describe('the findings ledger', () => {
  it('holds one or two open findings an application scanned on a calm day, and a batch each Patch Tuesday', () => {
    const open = (d: string) => files(d).findings.rows.filter((r) => r[col(files(d).findings, 'severity')] !== 'info' && r[col(files(d).findings, 'status')] !== 'fixed').length;
    const scannedApps = (d: string) => appsOn(w, d).filter((a) => a.hosting !== 'saas' && a.lifecycle !== 'retired').length;
    for (const d of ['2023-06-07', '2024-02-20', '2024-03-05']) {
      expect(open(d) / scannedApps(d), d).toBeGreaterThan(0.8);
      expect(open(d) / scannedApps(d), d).toBeLessThan(2.5);
    }
    const fresh = (d: string) => cells(files(d).findings, 'status').filter((s) => s === 'new').length;
    expect(patchTuesday(2023, 11)).toBe('2023-11-14');
    expect(fresh('2023-11-14')).toBeGreaterThan(5 * fresh('2023-06-07'));
  });

  it('has one scan-information row an application scanned, saying whether the scanner logged in; none for SaaS or retired ones', () => {
    for (const d of CALM) {
      const t = files(d).findings;
      const info = t.rows.filter((r) => r[col(t, 'plugin')] === 'SCAN-INFO');
      const apps = byApp(d);
      const scannable = [...apps.values()].filter((a) => a.hosting !== 'saas' && a.lifecycle !== 'retired');
      expect(info.length / scannable.length, d).toBeGreaterThan(0.98);
      expect(new Set(info.map((r) => r[1])).size, d).toBe(info.length);
      for (const r of info) expect(apps.get(String(r[1]))!.hosting, d).not.toBe('saas');
      expect(share(info, (r) => r[col(t, 'credentialed')] === 'no'), d).toBeLessThan(0.03);
      for (const r of t.rows) expect(['scan-info', 'finding'], d).toContain(r[col(t, 'plugin')] === 'SCAN-INFO' ? 'scan-info' : r[col(t, 'cve')] ? 'finding' : 'none');
    }
  });

  it('dates each finding by its severity, keeps the first-found date when one is re-opened, and lists a fix for thirty days', () => {
    const statuses = new Set<string>();
    for (const d of CALM) {
      const t = files(d).findings;
      for (const r of t.rows) {
        const row = Object.fromEntries(t.columns.map((c, i) => [c, r[i]])) as Record<string, string>;
        if (row.plugin === 'SCAN-INFO') continue;
        statuses.add(row.status!);
        expect(row.due_on, row.finding_id).toBe(addDays(row.first_found!, SEVERITY_DAYS[row.severity as keyof typeof SEVERITY_DAYS]));
        expect(row.first_found! <= row.last_found! && row.last_found! <= d, row.finding_id).toBe(true);
        if (row.status === 'fixed') expect(daysFrom(row.fixed_on!, d), row.finding_id).toBeLessThan(30);
        else expect(row.fixed_on, row.finding_id).toBe('');
        if (row.status === 're-opened') expect(daysFrom(row.first_found!, d), row.finding_id).toBeGreaterThan(10);
        if (row.status === 'new') expect(daysFrom(row.first_found!, d), row.finding_id).toBeLessThan(3);
      }
    }
    expect([...statuses].sort()).toEqual(['active', 'fixed', 'new', 're-opened']);
  });

  it('sets February’s high findings from Patch Tuesday due thirty days later, on Thursday 14 March', () => {
    expect(patchTuesday(2024, 2)).toBe('2024-02-13');
    const t = dayFile(w, 'findings', '2024-03-13');
    const due = t.rows.filter((r) => r[col(t, 'due_on')] === '2024-03-14' && r[col(t, 'first_found')] === '2024-02-13' && r[col(t, 'severity')] === 'high');
    expect(due.length).toBeGreaterThan(20);
  });

  it('tells the vulnerability SLA’s truth: a few failing, a few not assessed without a credentialed scan', () => {
    for (const d of CALM) {
      const st = appsOn(w, d).filter((a) => appliesTo('vuln_sla', a)).map((a) => vulnOn(w, a, d));
      expect(share(st, (s) => s === 'fail'), d).toBeGreaterThan(0.01);
      expect(share(st, (s) => s === 'fail'), d).toBeLessThan(0.12);
      expect(share(st, (s) => s === 'not_assessed'), d).toBeLessThan(0.04);
    }
  });
});

describe('the risk register', () => {
  it('has about one in a hundred of what applies under an exception on a day', () => {
    for (const d of CALM) {
      const pairs = appsOn(w, d).filter((a) => a.lifecycle === 'active' || a.lifecycle === 'retiring').flatMap((a) => CONTROLS.filter((c) => c.id !== 'ownership' && appliesTo(c, a)).map((c) => [a.app_id, c.id] as const));
      const excepted = share(pairs, ([a, c]) => exceptedOn(w, a, c, d));
      expect(excepted, d).toBeGreaterThan(0.004);
      expect(excepted, d).toBeLessThan(0.025);
    }
  });

  it('keeps a row a version: an extension keeps the first expiry, and the version it replaces is superseded', () => {
    const d = '2024-03-05';
    const t = files(d).exceptions;
    const rows = t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c, r[i]])) as Record<string, Cell>);
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(['active', 'expired', 'superseded', 'approved'].filter((s) => rows.some((r) => r.status === s))));
    const extended = rows.filter((r) => r.version === 2);
    expect(extended.length).toBeGreaterThan(0);
    for (const v2 of extended) {
      const v1 = rows.find((r) => r.exception_id === v2.exception_id && r.version === 1);
      if (!v1) continue;
      expect(v2.original_valid_to).toBe(v1.valid_to);
      expect(v1.status).toBe('superseded');
    }
    for (const r of rows) {
      expect(String(r.valid_to) > String(r.valid_from), String(r.exception_id)).toBe(true);
      expect(String(r.approved_on) <= d).toBe(true);
      if (r.status === 'expired') expect(daysFrom(String(r.valid_to), d)).toBeLessThanOrEqual(90);
      expect(w.people.has(String(r.approver_id)), String(r.exception_id)).toBe(true);
    }
    expect(new Set(rows.map((r) => `${r.exception_id}#${r.version}`)).size).toBe(rows.length);
  });
});

describe('the cloud inventory', () => {
  it('lists every cloud application in production, most in non-production too, and a few tags nobody registered', () => {
    for (const d of CALM) {
      const t = files(d).cloud_assets;
      const apps = byApp(d);
      const tags = cells(t, 'app_tag').map(String);
      const prod = new Set(t.rows.filter((r) => String(r[0]).endsWith('-prod')).map((r) => String(r[col(t, 'app_tag')])));
      for (const a of apps.values()) if (a.hosting === 'cloud' && a.lifecycle !== 'retired') expect(prod.has(a.app_id), `${d} ${a.app_id}`).toBe(true);
      const shadow = tags.filter((x) => !apps.has(x));
      expect(shadow.length, d).toBeGreaterThan(0);
      expect(shadow.length, d).toBeLessThan(10);
      for (const x of shadow) expect(x, d).toMatch(/^APP-9\d{3}$/);
    }
  });
});

describe('a day at the demo’s scale', () => {
  it('is about 2,400 applications and 25,000 rows, about 2 MB of CSV, in twenty files and two fixed ones', () => {
    const big = larkspur();
    const d = LARKSPUR_LOADS_FROM;
    const apps = appsOn(big, d);
    expect(apps.length).toBeGreaterThan(2300);
    expect(apps.length).toBeLessThan(2500);
    const day = dayFiles(big, d);
    expect(Object.keys(day)).toEqual([...DAILY_FILES]);
    const rows = DAILY_FILES.reduce((s, f) => s + day[f].rows.length, 0);
    const bytes = DAILY_FILES.reduce((s, f) => s + csvOf(day[f].columns, day[f].rows).length, 0);
    expect(rows).toBeGreaterThan(20_000);
    expect(rows).toBeLessThan(32_000);
    expect(bytes).toBeGreaterThan(1.3e6);
    expect(bytes).toBeLessThan(2.6e6);
    // Ownership holds for nearly everything that day.
    expect(share(apps.filter((a) => a.lifecycle !== 'retired'), (a) => ownedOn(big, a.owner_team_id, d))).toBeGreaterThan(0.94);
  });
});

describe('the draw', () => {
  it('is the same from the same seed whatever order the days are read in, and another seed is another estate', () => {
    const [a, b] = ['2023-10-03', '2024-03-07'];
    const one = larkspur({ apps: 120, seed: 3 });
    const two = larkspur({ apps: 120, seed: 3 });
    const firstA = dayFiles(one, a);
    const firstB = dayFiles(one, b);
    const thenB = dayFiles(two, b);
    const thenA = dayFiles(two, a);
    expect(thenA).toEqual(firstA);
    expect(thenB).toEqual(firstB);
    expect(dayFiles(larkspur({ apps: 120, seed: 4 }), a).cmdb_apps).not.toEqual(firstA.cmdb_apps);
  });
});
