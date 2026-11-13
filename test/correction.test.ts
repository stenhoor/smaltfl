/**
 * A later delivery of a day waits for a decision (ADR 0021 §2, Q-183): a run that corrects an earlier one of its day is
 * held by each file sent again, whatever its checks say, the run it corrects named in its manifest; verify computes the
 * hold again from the manifest; a decision publishes it. Runs that correct nothing hash as before.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import { pinnedDdl, type Binding } from '../examples/sources.js';
import smaltfl from '../src/plugin/index.js';
import type { FlowDocument } from '../src/core/document.js';
import { utf8 } from '../src/core/hash.js';
import { expandNotebooks } from '../src/core/notebook.js';
import { pinFile, releaseRun, runFlow, verifyRun } from '../src/index.js';
import { SMALTDB } from './helpers/engine.js';
import { ts } from './helpers/notebooks.js';

const nb = `import { cell, param, sql } from 'smaltnb';
import { publish, source } from 'smaltfl/notebook';
cell('params');
export const params = param({ day: param.text('') });
cell('apps');
export const apps = source('apps');
cell('tls');
export const tls = source('tls');
cell('posture', { lang: 'sql' });
export const posture = sql\`SELECT a.app_id, a.business_unit, t.status AS tls FROM \${apps} a LEFT JOIN \${tls} t ON t.app_id = a.app_id\`;
cell('units', { lang: 'sql' });
export const units = sql\`SELECT business_unit, count(*) AS apps FROM \${apps} GROUP BY business_unit\`;
cell('published');
publish(posture);
publish(units);
`;
const flow: FlowDocument = {
  smaltfl: 4, id: 'correctable', name: 'Correctable', steps: [],
  parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
  sources: [{ id: 'apps', table: 'apps_file' }, { id: 'tls', table: 'tls_file' }],
  notebooks: [{ path: 'a.nb.ts', source: nb }],
  publish: { hold: ['checks'], period: 'day', watch: {} },
} as FlowDocument;
const TLS: Binding = { table: 'tls_file', format: 'csv', file: 'tls.csv', header: true, columns: [['app_id', 'TEXT'], ['status', 'TEXT']] };

async function setup() {
  const db = Database.openMemory({ plugins: [io, external, smaltfl] });
  db.exec("CREATE TABLE apps_file(app_id TEXT, business_unit TEXT); INSERT INTO apps_file VALUES ('a1','Payments'),('a2','Retail')");
  await pinFile(db, 'tls.csv', utf8('app_id,status\na1,pass\na2,fail\n'));
  await db.execAsync(pinnedDdl(TLS));
  return db;
}
const current = (db: Database, name: string) => db.query('SELECT key FROM _smaltfl_datasets WHERE name = ?', [name]).rows[0]?.[0] ?? null;

describe('a later delivery of a day', () => {
  it('waits for a decision though its checks pass, verifies, and is published by one', async () => {
    const db = await setup();
    try {
      const doc = await expandNotebooks(flow, ts);
      const day = { day: '2024-03-01' };
      const first = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day });
      expect(first.holds).toEqual([]);
      expect(first.published.sort()).toEqual(['posture', 'units']);
      expect('correction' in first.manifest).toBe(false);

      // The TLS file sent again for the same day: a2 passes after all.
      await pinFile(db, 'tls.csv', utf8('app_id,status\na1,pass\na2,pass\n'));
      const again = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, correction: { of: { run: first.run, manifest: first.hash }, sources: ['tls'] } });
      expect(again.manifest.correction).toEqual({ of: first.hash, sources: ['tls'] });
      const tls = again.manifest.nodes.find((n) => n.origin === 'tls')!.node;
      expect(again.holds).toEqual([{ by: 'correction', node: tls, origin: 'tls', said: 'a later file for its day: it waits for a decision', reaches: ['posture'] }]);
      // What reads the file waits; what doesn't (the units, from the inventory alone) is the same version, so nothing of
      // it waits; nothing is published by the run itself.
      expect(again.waiting).toEqual(['posture']);
      expect(again.published).toEqual([]);
      expect(current(db, 'posture')).toBe(first.manifest.outputs.posture!.key);

      const v = await verifyRun(db, again.run, { smaltdb: SMALTDB, level: 'rerun', manifest: again.hash });
      expect(v.checks.filter((c) => !c.ok)).toEqual([]);
      expect(v.checks.find((c) => c.check === 'held')!.note).toBe('held by tls (a later file for its day: it waits for a decision)');

      const out = await releaseRun(db, { run: again.run, manifest: again.hash, keys: { posture: again.manifest.outputs.posture!.key }, option: 'asis', actor: 'owner', reason: 'The TLS team re-sent the day', decision: '1'.repeat(64) });
      expect(out).toMatchObject({ outcome: 'applied', published: ['posture'] });
      expect(current(db, 'posture')).toBe(again.manifest.outputs.posture!.key);
    } finally {
      db.close();
    }
  }, 60_000);

  it('names the run it corrects and sources the plan reads, and is a run of its day, not a derived one', async () => {
    const db = await setup();
    try {
      const doc = await expandNotebooks(flow, ts);
      const first = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' } });
      const of = { run: first.run, manifest: first.hash };
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' }, correction: { of, sources: ['mfa'] } })).rejects.toThrow("mfa isn't a source the plan reads");
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' }, correction: { of, sources: [] } })).rejects.toThrow('a later delivery names the sources whose files were sent again');
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' }, correction: { of: { run: 1, manifest: 'x' }, sources: ['tls'] } })).rejects.toThrow('a later delivery names the run it corrects');
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: { day: '2024-03-01' }, stage: true, from: of, correction: { of, sources: ['tls'] } })).rejects.toThrow('a later delivery is a run of its day, not a derived run');
    } finally {
      db.close();
    }
  }, 60_000);
});
