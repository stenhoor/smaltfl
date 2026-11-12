/**
 * Contracts on published datasets (Q-171, ADR 0020 §4): a document field in the Open Data Contract Standard's terms,
 * refused where it can't be checked or isn't well formed; plan/4 carries only what the run checks, and only where a flow
 * declares one; the run checks each contracted dataset after building it (its columns by name and type, its required
 * columns' blanks, its columns' values) and keeps the counts in the manifest; a broken contract holds under the gate's
 * schema check, and verify counts it again.
 */
import { describe, expect, it } from 'vitest';
import { validateDocument, type ContractDef, type FlowDocument } from '../src/core/document.js';
import { contractSaid } from '../src/core/hold.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { translate, validatePlan } from '../src/core/plan.js';
import { runFlow, verifyRun } from '../src/index.js';
import { openEngine, SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const SETUP = "import { cell, md, param, sql } from 'smaltnb';\nimport { gate, publish, source } from 'smaltfl/notebook';\n";
const nb = (select = "a.app_id, a.business_unit, t.status AS tls", gated = true, schema = '') => `${SETUP}
cell('params');
export const params = param({ day: param.text('') });
cell('apps');
export const apps = source('apps');
cell('tls');
export const tls = source('tls');
cell('posture', { lang: 'sql' });
export const posture = sql\`SELECT ${select} FROM \${apps} a LEFT JOIN \${tls} t ON t.app_id = a.app_id\`;
${gated ? `cell('posture_gate');\nexport const posture_gate = gate(posture, { layer: 'gold'${schema} });\n` : ''}cell('published');
publish(posture);
`;
const CONTRACT: ContractDef = {
  id: 'posture',
  version: '1.0.0',
  status: 'active',
  description: { purpose: 'Each application’s TLS status', usage: 'Join by app_id' },
  columns: [
    { name: 'app_id', type: 'TEXT', required: true, key: true, classification: 'internal' },
    { name: 'business_unit', type: 'TEXT', required: true },
    { name: 'tls', type: 'TEXT', values: ['pass', 'fail', 'not_assessed'] },
  ],
  sla: { frequency: 'daily', availableBy: '07:00 UTC', retention: '13 months' },
};
const flow = (o: { nb?: string; contracts?: Record<string, unknown> } = {}): FlowDocument =>
  ({
    smaltfl: 4, id: 'contracted', name: 'Contracted', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
    sources: [{ id: 'apps', table: 'apps_file' }, { id: 'tls', table: 'tls_file' }],
    notebooks: [{ path: 'a.nb.ts', source: o.nb ?? nb() }],
    publish: { hold: ['checks'], period: 'day', watch: {} },
    ...(o.contracts === undefined ? { contracts: { posture: CONTRACT } } : Object.keys(o.contracts).length ? { contracts: o.contracts } : {}),
  }) as FlowDocument;
const doc = (o: Parameters<typeof flow>[0] = {}) => expandNotebooks(flow(o), ts);

describe('the contract in the document', () => {
  it('takes a contract on a dataset a gated flow publishes', async () => {
    expect(validateDocument(await doc())).toEqual([]);
  });

  it('refuses one it can’t check or that isn’t well formed, field by field', async () => {
    const problems = async (c: unknown, n?: string) => validateDocument(await doc({ contracts: { posture: c }, ...(n ? { nb: n } : {}) }));
    expect(await problems(CONTRACT, nb(undefined, false))).toEqual([{ path: '$.contracts', message: "a contract is checked by gold's schema check: a flow without gates has none" }]);
    expect(validateDocument(await doc({ contracts: { apps: CONTRACT } }))).toEqual([{ path: '$.contracts.apps', message: "apps isn't a dataset the flow publishes: a contract is what a published dataset's consumers rely on" }]);
    expect(await problems({ ...CONTRACT, version: '1.0' })).toEqual([{ path: '$.contracts.posture.version', message: 'a semantic version: major.minor.patch' }]);
    expect(await problems({ ...CONTRACT, status: 'live' })).toEqual([{ path: '$.contracts.posture.status', message: 'one of proposed, active, deprecated, retired' }]);
    expect(await problems({ ...CONTRACT, owner: 'me' })).toEqual([{ path: '$.contracts.posture.owner', message: 'not a field this version reads (id, version, status, description, columns, sla): refused rather than ignored' }]);
    expect(await problems({ ...CONTRACT, columns: [...CONTRACT.columns, { name: 'TLS', type: 'TEXT' }] })).toEqual([{ path: '$.contracts.posture.columns[3].name', message: 'TLS is named twice' }]);
    expect(await problems({ ...CONTRACT, columns: [{ name: 'app_id', type: 'VARCHAR' }] })).toEqual([{ path: '$.contracts.posture.columns[0].type', message: 'one of TEXT, INTEGER, REAL' }]);
    expect(await problems({ ...CONTRACT, columns: [{ name: 'app_id', type: 'TEXT', values: [] }] })).toEqual([{ path: '$.contracts.posture.columns[0].values', message: 'a list of the values it may take, as text' }]);
    expect(await problems({ ...CONTRACT, sla: { uptime: '99.9%' } })).toEqual([{ path: '$.contracts.posture.sla', message: '{ frequency?, availableBy?, retention? }, each text' }]);
  });

  it('is part of the flow hash; the plan carries what the run checks, and nothing where no flow declares one', async () => {
    const plan = await translate(await doc(), { day: '2024-03-01' });
    validatePlan(plan);
    const node = plan.nodes.findIndex((n) => n.origin === 'posture');
    expect((plan.publish as { contracts?: unknown }).contracts).toEqual([[node, { id: 'posture', version: '1.0.0', schema: 'hold', columns: [['app_id', 'TEXT', true, null], ['business_unit', 'TEXT', true, null], ['tls', 'TEXT', false, ['pass', 'fail', 'not_assessed']]] }]]);
    // The contract's words aren't checked: changing them moves the flow hash, not what the plan checks.
    const worded = await translate(await doc({ contracts: { posture: { ...CONTRACT, description: { purpose: 'Something else' } } } }), { day: '2024-03-01' });
    expect(worded.flow.hash).not.toBe(plan.flow.hash);
    expect((worded.publish as { contracts?: unknown }).contracts).toEqual((plan.publish as { contracts?: unknown }).contracts);
    // Without a contract, the plan has no field for it.
    expect(await translate(await doc({ contracts: {} }), { day: '2024-03-01' }).then((p) => p.publish)).not.toHaveProperty('contracts');
    // A gate that sets the schema check apart says what a broken contract does.
    const warned = await translate(await doc({ nb: nb(undefined, true, ", checks: { schema: 'warn' }") }), { day: '2024-03-01' });
    expect((warned.publish as { contracts: [number, { schema: string }][] }).contracts[0]![1].schema).toBe('warn');
  });
});

describe('the contract in the engine', () => {
  const run = async (o: { select?: string; tls?: string; schema?: string } = {}) => {
    const db = openEngine();
    db.exec("CREATE TABLE apps_file(app_id TEXT, business_unit TEXT); INSERT INTO apps_file VALUES ('a1','Payments'),('a2','Retail'),('a3',NULL)");
    db.exec(`CREATE TABLE tls_file(app_id TEXT, status TEXT); INSERT INTO tls_file VALUES ${o.tls ?? "('a1','pass'),('a2','fail'),('a3','pass')"}`);
    const d = await doc({ nb: nb(o.select, true, o.schema ?? '') });
    const r = await runFlow(db, d, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
    return { db, r };
  };

  it('publishes a dataset that keeps its contract, the run’s check in the manifest, and verify counts it again', async () => {
    const { db, r } = await run({ select: "a.app_id, COALESCE(a.business_unit, 'Unassigned') AS business_unit, t.status AS tls" });
    try {
      expect(r.holds).toEqual([]);
      expect(r.published).toEqual(['posture']);
      expect(r.manifest.nodes.find((n) => n.origin === 'posture')!.contract).toEqual({ version: '1.0.0', missing: [], extra: [], retyped: [], blank: [], outside: [] });
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.checks.find((c) => c.check === 'contract')).toMatchObject({ ok: true, origin: 'posture' });
      expect(v.ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('holds a required column with blanks and a value outside its list, under the schema check, said', async () => {
    const { db, r } = await run({ tls: "('a1','pass'),('a2','FAIL'),('a3','pass')" });
    try {
      expect(r.published).toEqual([]);
      expect(r.holds).toEqual([{ by: 'checks', node: r.holds[0]!.node, origin: 'posture', said: 'breaks its contract 1.0.0: business_unit blank on 1 row; tls outside its values on 1 row', reaches: ['posture'] }]);
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).checks.find((c) => c.check === 'contract')!.ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('holds a column renamed, dropped, added or retyped', async () => {
    const { db, r } = await run({ select: "a.app_id, COALESCE(a.business_unit, 'x') AS unit, length(t.status) AS tls, 1 AS extra" });
    try {
      expect(r.manifest.nodes.find((n) => n.origin === 'posture')!.contract).toEqual({ version: '1.0.0', missing: ['business_unit'], extra: ['unit', 'extra'], retyped: [['tls', 'TEXT', 'INTEGER']], blank: [], outside: [] });
      expect(r.holds[0]!.said).toBe('breaks its contract 1.0.0: no business_unit; unit, extra not in it; tls is INTEGER, not TEXT');
    } finally {
      db.close();
    }
  });

  it('only warns where the gate sets the schema check to warn', async () => {
    const { db, r } = await run({ schema: ", checks: { schema: 'warn' }" });
    try {
      expect(r.holds).toEqual([]);
      expect(r.manifest.nodes.find((n) => n.origin === 'posture')!.contract!.blank).toEqual([['business_unit', 1]]);
    } finally {
      db.close();
    }
  });

  it('says nothing of a contract kept, and each way one is broken', () => {
    expect(contractSaid({ version: '2.1.0', missing: [], extra: [], retyped: [], blank: [], outside: [] })).toBeNull();
    expect(contractSaid({ version: '2.1.0', missing: ['a', 'b', 'c', 'd', 'e'], extra: [], retyped: [], blank: [], outside: [] })).toBe('breaks its contract 2.1.0: no a, b, c and 2 more');
  });
});
