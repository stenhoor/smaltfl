/**
 * Two versions of a day compared (ADR 0021 §4, core/compare.ts): the summary from two runs' manifests alone; the key an
 * output's rows are matched by; and its rows compared in the engine (emit.ts `emitDiff`, read by `diffOf`), by key, with
 * repeats, blanks and changed cells, or as whole rows.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import { compareSummary, diffKeyOf, diffOf, type ManifestSide } from '../src/core/compare.js';
import { emitDiff } from '../src/core/emit.js';

const source = (origin: string, sha256: string, rows: number, status = 'built') => ({ node: 0, origin, op: 'table', key: `k-${origin}-${sha256}`, status, rows, content: `c-${sha256}`, file: { location: `smaltfl:${origin}.csv`, sha256, bytes: 10 } });
const manifest = (plan: string, nodes: unknown[], outputs: Record<string, [number, string]>): ManifestSide => ({
  plan, nodes: nodes as ManifestSide['nodes'],
  outputs: Object.fromEntries(Object.entries(outputs).map(([name, [rows, content]]) => [name, { key: `key-${content}`, rows, content }])),
});

describe('two versions summarised from their manifests', () => {
  const v1 = manifest('p1', [source('tls', 'aaaa', 1630), source('waf', 'wwww', 496), source('mfa', 'mmmm', 2320)], { fact_control_status: [20097, 'f1'], failing_by_unit: [1361, 'u1'], dim_org: [250, 'o1'] });
  const v3 = manifest('p1', [source('tls', 'cccc', 815), source('waf', 'wwww', 496), source('mfa', 'mmmm', 2320)], { fact_control_status: [19282, 'f3'], failing_by_unit: [1327, 'u3'], dim_org: [250, 'o1'] });

  it('says which file differs, how many are the same, the same plan, and each output changed or not, the changed first', () => {
    const s = compareSummary(v1, v3);
    expect(s.files).toEqual([{ source: 'tls', a: { sha256: 'aaaa', rows: 1630, refused: false }, b: { sha256: 'cccc', rows: 815, refused: false } }]);
    expect(s.same).toBe(2);
    expect(s.plan).toBeNull();
    expect(s.outputs.map((o) => [o.name, o.a?.rows, o.b?.rows, o.changed])).toEqual([['fact_control_status', 20097, 19282, true], ['failing_by_unit', 1361, 1327, true], ['dim_org', 250, 250, false]]);
    expect(s.changed).toBe(2);
  });

  it('says a refused file read nothing, an output one version didn’t build, and another plan', () => {
    const refused = manifest('p0', [{ ...source('tls', 'aaaa', 0, 'refused'), rows: undefined, content: undefined }], {});
    const s = compareSummary(refused, v3);
    expect(s.files[0]).toEqual({ source: 'tls', a: { sha256: 'aaaa', rows: null, refused: true }, b: { sha256: 'cccc', rows: 815, refused: false } });
    expect(s.files.map((f) => [f.source, f.a])).toEqual([['tls', { sha256: 'aaaa', rows: null, refused: true }], ['waf', null], ['mfa', null]]);
    expect(s.plan).toEqual({ a: 'p0', b: 'p1' });
    expect(s.outputs.every((o) => o.a === null && o.changed)).toBe(true);
  });
});

describe('the key an output’s rows are matched by', () => {
  it('is its gate’s reconciliation key, else its contract’s key columns, else none', () => {
    const doc = {
      gates: { fact_control_status: { layer: 'gold', checks: {}, reconcile: { key: ['app_id', 'control_id'] } } },
      contracts: { app_scorecard: { id: 'app-scorecard', version: '1.0.0', status: 'active', description: '', columns: [{ name: 'app_id', type: 'TEXT', key: true }, { name: 'score', type: 'REAL' }] } },
    } as unknown as Parameters<typeof diffKeyOf>[0];
    expect(diffKeyOf(doc, 'fact_control_status')).toEqual(['app_id', 'control_id']);
    expect(diffKeyOf(doc, 'APP_SCORECARD')).toEqual(['app_id']);
    expect(diffKeyOf(doc, 'dim_org')).toBeNull();
  });
});

describe('an output’s rows compared in the engine', () => {
  const db = Database.openMemory({ plugins: [] });
  db.exec('CREATE TABLE va(app_id TEXT, control_id TEXT, status TEXT, days INTEGER)');
  db.exec('CREATE TABLE vb(app_id TEXT, control_id TEXT, status TEXT, days INTEGER)');
  // v1: app-2/tls twice (a repeat), app-3/mfa only here, app-4's days blank, a blank control on app-5.
  db.exec(`INSERT INTO va VALUES ('app-1','tls','pass',3), ('app-2','tls','fail',9), ('app-2','tls','fail',9), ('app-3','mfa','pass',1), ('app-4','waf','fail',NULL), ('app-5',NULL,'pass',2), ('app-6','waf','pass',4)`);
  // v3: app-2/tls once, app-4's days given, app-6 now failing, app-7 new; app-5's blank control pairs with v1's.
  db.exec(`INSERT INTO vb VALUES ('app-1','tls','pass',3), ('app-2','tls','fail',9), ('app-4','waf','fail',5), ('app-5',NULL,'pass',2), ('app-6','waf','fail',4), ('app-7','tls','pass',0)`);
  const columns = ['app_id', 'control_id', 'status', 'days'];
  const run = (st: ReturnType<typeof emitDiff>) => ({
    counts: db.query(st.counts).rows[0]!,
    removed: db.query(st.removed).rows,
    added: db.query(st.added).rows,
    ...(st.repeated ? { repeated: db.query(st.repeated).rows } : {}),
    ...(st.changed ? { changed: db.query(st.changed).rows } : {}),
  });

  it('by key: removed and added keys, a repeat taken out, cells changed on single-row keys, blank keys paired', () => {
    const key = ['app_id', 'control_id'];
    const d = diffOf(columns, key, run(emitDiff('SELECT * FROM va', 'SELECT * FROM vb', columns, key)));
    expect(d).toMatchObject({ all: columns, key, removed: 1, added: 1, repeated: 1, extraA: 1, extraB: 0, changed: 2 });
    expect(d.columns).toEqual([{ column: 'status', changed: 1 }, { column: 'days', changed: 1 }]);
    expect(d.samples.removed).toEqual([['app-3', 'mfa', 'pass', 1]]);
    expect(d.samples.added).toEqual([['app-7', 'tls', 'pass', 0]]);
    expect(d.samples.repeated).toEqual([{ key: ['app-2', 'tls'], a: 2, b: 1 }]);
    expect(d.samples.changed).toEqual([
      { key: ['app-4', 'waf'], cells: [{ column: 'days', a: null, b: 5 }] },
      { key: ['app-6', 'waf'], cells: [{ column: 'status', a: 'pass', b: 'fail' }] },
    ]);
  });

  it('as whole rows without a key: each row counted on each side, a duplicate and a blank cell included', () => {
    const d = diffOf(columns, null, run(emitDiff('SELECT * FROM va', 'SELECT * FROM vb', columns, null)));
    expect(d).toMatchObject({ key: null, removed: 4, added: 3, repeated: 0, changed: 0 });
    expect(d.samples.removed).toEqual([['app-2', 'tls', 'fail', 9], ['app-3', 'mfa', 'pass', 1], ['app-4', 'waf', 'fail', null], ['app-6', 'waf', 'pass', 4]]);
    expect(d.samples.added).toEqual([['app-4', 'waf', 'fail', 5], ['app-6', 'waf', 'fail', 4], ['app-7', 'tls', 'pass', 0]]);
  });

  it('finds nothing between a version and itself', () => {
    const key = ['app_id', 'control_id'];
    const d = diffOf(columns, key, run(emitDiff('SELECT * FROM va', 'SELECT * FROM va', columns, key)));
    expect(d).toMatchObject({ removed: 0, added: 0, repeated: 0, changed: 0, columns: [] });
    expect(diffOf(columns, null, run(emitDiff('SELECT * FROM vb', 'SELECT * FROM vb', columns, null)))).toMatchObject({ removed: 0, added: 0 });
  });
});
