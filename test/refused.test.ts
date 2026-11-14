/**
 * A refused file as the schema check's hold (ADR 0014 §2, slice 7; ADR 0009 slice 3): in a flow with gates, a source the
 * engine can't read as declared is recorded as refused, nothing is built, and the run is held under the schema check,
 * said with the file's columns; verify finds the manifest coherent and the hold computed again; a release publishes
 * nothing of it; the day runs again when a corrected file arrives. A file whose declared columns are gone is held so in
 * every flow that holds, said with what changed (ADR 0022 §2, Q-109, Q-203); a new column alone is noted (Q-204).
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import { pinnedDdl, type Binding } from '../examples/sources.js';
import smaltfl from '../src/plugin/index.js';
import type { FlowDocument } from '../src/core/document.js';
import { refusedSaid } from '../src/core/hold.js';
import { utf8 } from '../src/core/hash.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { forDay, pinFile, releaseRun, runFlow, validateDocument, verifyRun } from '../src/index.js';
import { readAsOf } from '../src/core/ontology.js';
import { SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const SETUP = "import { cell, md, param, sql } from 'smaltnb';\nimport { gate, publish, source } from 'smaltfl/notebook';\n";
const nb = (gated: boolean) => `${SETUP}
cell('params');
export const params = param({ day: param.text('') });
cell('apps');
export const apps = source('apps');
cell('tls');
export const tls = source('tls');
cell('posture', { lang: 'sql' });
export const posture = sql\`SELECT a.app_id, a.business_unit, t.status AS tls FROM \${apps} a LEFT JOIN \${tls} t ON t.app_id = a.app_id\`;
${gated ? "cell('tls_gate');\nexport const tls_gate = gate(tls, { layer: 'bronze' });\n" : ''}cell('published');
publish(posture);
`;
const flow = (gated: boolean): FlowDocument =>
  ({
    smaltfl: 4, id: 'refusable', name: 'Refusable', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
    sources: [{ id: 'apps', table: 'apps_file' }, { id: 'tls', table: 'tls_file' }],
    notebooks: [{ path: 'a.nb.ts', source: nb(gated) }],
    publish: { hold: ['checks'], period: 'day', watch: {} },
  }) as FlowDocument;
const TLS: Binding = { table: 'tls_file', format: 'csv', file: 'tls.csv', header: true, columns: [['app_id', 'TEXT'], ['status', 'TEXT'], ['protocol', 'TEXT']] };

async function setup(tlsCsv: string) {
  const db = Database.openMemory({ plugins: [io, external, smaltfl] });
  db.exec("CREATE TABLE apps_file(app_id TEXT, business_unit TEXT); INSERT INTO apps_file VALUES ('a1','Payments'),('a2','Retail')");
  await pinFile(db, 'tls.csv', utf8(tlsCsv));
  await db.execAsync(pinnedDdl(TLS));
  return db;
}

describe('a refused file under a gate', () => {
  it('says the file’s columns against the declared ones', () => {
    expect(refusedSaid('tls_file: the header has 2 fields but 3 columns are declared')).toBe('file has 2 of 3 columns');
    expect(refusedSaid('no such table: tls_file')).toBe('file refused: no such table: tls_file');
  });

  it('holds the run under the schema check with nothing built, verifies, publishes nothing of it, and runs again corrected', async () => {
    const db = await setup('app_id,status\na1,pass\na2,fail\n');
    try {
      const doc = await expandNotebooks(flow(true), ts);
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds).toEqual([{ by: 'checks', node: r.holds[0]!.node, origin: 'tls', said: 'protocol is gone', reaches: ['posture'] }]);
      expect(r.published).toEqual([]);
      expect(r.waiting).toEqual(['posture']);
      const tls = r.manifest.nodes.find((n) => n.origin === 'tls')!;
      expect(tls).toMatchObject({ status: 'refused', key: '', op: 'table' });
      expect(tls.refused).toBe("tls's columns changed: protocol is gone");
      expect(tls.columns).toEqual({ gone: ['protocol'], added: [], maps: [] });
      expect(tls.content).toBeUndefined();
      // The inventory was read; nothing else is in the manifest, and no output.
      expect(r.manifest.nodes.map((n) => [n.origin, n.status])).toEqual([['apps', 'built'], ['tls', 'refused']]);
      expect(r.manifest.outputs).toEqual({});
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.ok).toBe(true);
      expect(v.checks.find((c) => c.check === 'coherent')!.ok).toBe(true);
      expect(v.checks.find((c) => c.check === 'held')!.note).toBe('held by tls (its checks)');
      // Nothing to publish: a decision to publish as is is refused, and says why.
      const rel = await releaseRun(db, { run: r.run, manifest: r.hash, keys: { posture: '0'.repeat(64) }, option: 'asis', actor: 'owner', reason: 'expected once', decision: '1'.repeat(64) });
      expect(rel.outcome).toBe('refused');
      expect(rel.why).toMatch(/^run \d+ built nothing: tls's file was refused \(tls's columns changed: protocol is gone\), so there is nothing to publish; the day waits for a corrected file$/);
      // The corrected file arrives: the same day runs again and publishes.
      await pinFile(db, 'tls.csv', utf8('app_id,status,protocol\na1,pass,TLS1.3\na2,fail,TLS1.0\n'));
      const again = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(again.holds).toEqual([]);
      expect(again.published).toEqual(['posture']);
      expect(again.manifest.nodes.find((n) => n.origin === 'tls')!.status).toBe('built');
    } finally {
      db.close();
    }
  });

  it('holds every output under together: false, those that don’t read the refused file too: nothing was built', async () => {
    const db = await setup('app_id,status\na1,pass\n');
    try {
      // A second output that reads only the inventory, which a hold on tls alone wouldn't reach.
      const base = flow(true);
      const source = base.notebooks![0]!.source!.replace("cell('published');\npublish(posture);", "cell('units', { lang: 'sql' });\nexport const units = sql`SELECT DISTINCT business_unit FROM ${apps}`;\ncell('published');\npublish(posture);\npublish(units);");
      const doc = await expandNotebooks({ ...base, notebooks: [{ path: 'a.nb.ts', source }], publish: { ...base.publish!, together: false } } as FlowDocument, ts);
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds.map((h) => [h.origin, h.reaches])).toEqual([['tls', ['posture', 'units']]]);
      expect(r.published).toEqual([]);
      expect(r.waiting).toEqual(['posture', 'units']);
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });

  it('holds it in a flow with no gate too (Q-109); a flow that can\'t hold fails, as it did', async () => {
    const db = await setup('app_id,status\na1,pass\n');
    try {
      const doc = await expandNotebooks(flow(false), ts);
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds.map((h) => [h.origin, h.said])).toEqual([['tls', 'protocol is gone']]);
      expect(r.published).toEqual([]);
      const v = await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash });
      expect(v.checks.filter((c) => !c.ok).map((c) => `${c.origin}:${c.check}:${c.note ?? ''}`)).toEqual([]);
      const { publish: _publish, ...bare } = flow(false);
      await expect(runFlow(db, await expandNotebooks(bare as FlowDocument, ts), { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } })).rejects.toThrow(/tls's columns changed: protocol is gone/);
    } finally {
      db.close();
    }
  });

  it('holds a renamed column with the mapping it suggests, never read by its place (Q-146, Q-203)', async () => {
    // As many fields as declared: the engine would read state as status by its place, without a word.
    const db = await setup('app_id,state,protocol\na1,pass,TLS1.3\na2,fail,TLS1.0\n');
    try {
      const doc = await expandNotebooks(flow(false), ts);
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds.map((h) => h.said)).toEqual(['status is gone and state is new: state looks like status (its name and type)']);
      expect(r.manifest.nodes.find((n) => n.origin === 'tls')!.columns).toEqual({ gone: [], added: [], maps: [{ from: 'state', to: 'status', by: ['name', 'type'], share: null }] });
      expect(r.published).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('notes a new column with nothing gone, and publishes the day (Q-204)', async () => {
    const db = await setup('app_id,status,protocol,notes\na1,pass,TLS1.3,renewed\na2,fail,TLS1.0,\n');
    try {
      const doc = await expandNotebooks(flow(false), ts);
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds).toEqual([]);
      expect(r.published).toEqual(['posture']);
      expect(r.manifest.nodes.find((n) => n.origin === 'tls')).toMatchObject({ status: 'built', columns: { gone: [], added: ['notes'], maps: [] } });
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
    } finally {
      db.close();
    }
  });
});

describe('a column the file names otherwise, mapped (ADR 0022 §2, Q-146, Q-206)', () => {
  const mapped = (doc: FlowDocument): FlowDocument => ({ ...doc, ontology: { objectTypes: [], linkTypes: [], actionTypes: [], properties: [{ column: 'status', title: 'Status', description: '', fromFile: 'state', datasets: ['tls'] }] } });
  async function mappedSetup(tlsCsv: string, readAs: [string, string][]) {
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    db.exec("CREATE TABLE apps_file(app_id TEXT, business_unit TEXT); INSERT INTO apps_file VALUES ('a1','Payments'),('a2','Retail')");
    await pinFile(db, 'tls.csv', utf8(tlsCsv));
    await db.execAsync(pinnedDdl(TLS, readAs));
    return db;
  }
  const content = (r: Awaited<ReturnType<typeof runFlow>>) => r.manifest.nodes.find((n) => n.origin === 'tls')!.content;

  it('reads the file’s state as status: published, the same content the old name gave', async () => {
    const doc = mapped(await expandNotebooks(flow(false), ts));
    expect(validateDocument(doc)).toEqual([]);
    const readAs = readAsOf(doc.ontology, 'tls');
    expect(readAs).toEqual([['state', 'status']]);
    expect(pinnedDdl(TLS, readAs)).toBe("CREATE EXTERNAL TABLE tls_file(app_id TEXT, state TEXT, protocol TEXT) WITH (location = 'smaltfl:tls.csv', format = 'csv', header = true)");
    // Pins are shared by every engine in this process: each run reads its file before the next is pinned.
    const db = await mappedSetup('app_id,state,protocol\na1,pass,TLS1.3\na2,fail,TLS1.0\n', readAs);
    try {
      const r = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      expect(r.holds.map((h) => h.said)).toEqual([]);
      expect(r.published).toEqual(['posture']);
      expect(db.query('SELECT app_id, tls FROM posture ORDER BY app_id').rows).toEqual([['a1', 'pass'], ['a2', 'fail']]);
      expect(r.manifest.nodes.find((n) => n.origin === 'tls')!.columns).toBeUndefined();
      expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rerun', manifest: r.hash })).ok).toBe(true);
      const old = await setup('app_id,status,protocol\na1,pass,TLS1.3\na2,fail,TLS1.0\n');
      try {
        const before = await runFlow(old, await expandNotebooks(flow(false), ts), { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
        expect(content(r)).toBe(content(before));
      } finally {
        old.close();
      }
    } finally {
      db.close();
    }
  });

  it('maps from the day it is in force on, as a dated change set: a day before it reads the old name', async () => {
    const base = await expandNotebooks(flow(false), ts);
    const doc: FlowDocument = { ...base, changes: [{ id: 'map-state', from: '2024-03-02', recorded: '2024-03-02T09:00:00Z', by: 'owner', why: 'The TLS export renamed status', edits: [{ op: 'mapColumn', file: 'tls', column: 'status', from: 'state' }] }] };
    expect(validateDocument(doc)).toEqual([]);
    const fri = forDay(doc, { day: '2024-03-01' });
    const sat = forDay(doc, { day: '2024-03-02' });
    expect(readAsOf(fri.ontology, 'tls')).toEqual([]);
    expect(readAsOf(sat.ontology, 'tls')).toEqual([['state', 'status']]);
    // Pins are shared by every engine in this process: each run reads its file before the next is pinned.
    const db1 = await mappedSetup('app_id,status,protocol\na1,pass,TLS1.3\n', readAsOf(fri.ontology, 'tls'));
    const r1 = await runFlow(db1, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
    const db2 = await mappedSetup('app_id,state,protocol\na1,pass,TLS1.3\n', readAsOf(sat.ontology, 'tls'));
    try {
      const r2 = await runFlow(db2, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-02' } });
      expect([r1.holds, r2.holds]).toEqual([[], []]);
      expect(r2.published).toEqual(['posture']);
      expect(content(r1)).toBe(content(r2));
      expect(r1.manifest.flow.rules).not.toBe(r2.manifest.flow.rules);
      // Saturday's file under Friday's rules, a run of no mapping: held, with the mapping it suggests.
      const db3 = await mappedSetup('app_id,state,protocol\na1,pass,TLS1.3\n', []);
      try {
        const r3 = await runFlow(db3, base, { smaltdb: SMALTDB, parameters: { day: '2024-03-02' } });
        expect(r3.holds.map((h) => h.said)).toEqual(['status is gone and state is new: state looks like status (its name and type)']);
      } finally {
        db3.close();
      }
    } finally {
      db1.close();
      db2.close();
    }
  });

  it('refuses a table that declares the column by its own name where the flow reads the file’s other one', async () => {
    const doc = mapped(await expandNotebooks(flow(false), ts));
    const db = await mappedSetup('app_id,state,protocol\na1,pass,TLS1.3\n', []);
    try {
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } })).rejects.toThrow(/tls's table declares status, and the flow reads the file's state as status: its table declares state/);
    } finally {
      db.close();
    }
  });
});
