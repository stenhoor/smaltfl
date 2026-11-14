/**
 * What-if runs (ADR 0021 §2, §4, Q-191): a day's files, any version of each, under any rules, run apart from the record.
 * Marked in the manifest, every output held whatever its checks say, nothing published and no name moved, verified,
 * and never released; never a derived run, a later delivery or a restated run. Runs that aren't what-ifs hash as
 * before.
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
  smaltfl: 4, id: 'whatifs', name: 'What-ifs', steps: [],
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
const contents = (r: Awaited<ReturnType<typeof runFlow>>) => Object.fromEntries(Object.entries(r.manifest.outputs).map(([n, o]) => [n, o.content]));

describe('a what-if run', () => {
  it('holds every output though its checks pass, publishes nothing, verifies, and is never released', async () => {
    const db = await setup();
    try {
      const doc = await expandNotebooks(flow, ts);
      const day = { day: '2024-03-01' };
      const own = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day });
      expect(own.holds).toEqual([]);
      expect(own.published.sort()).toEqual(['posture', 'units']);
      expect('whatIf' in own.manifest).toBe(false);

      // Another TLS file for the day, as a what-if: a2 passes after all.
      await pinFile(db, 'tls.csv', utf8('app_id,status\na1,pass\na2,pass\n'));
      const w = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, whatIf: true });
      expect(w.manifest.whatIf).toBe(true);
      expect(w.holds).toEqual([{ by: 'what-if', node: -1, origin: 'run', said: 'a what-if: it is never published', reaches: ['posture', 'units'] }]);
      // Built and kept, as a held run's versions are, and nothing published: readers keep the day's own run.
      expect(w.waiting.sort()).toEqual(['posture']);
      expect(w.published).toEqual([]);
      expect(contents(w).posture).not.toBe(contents(own).posture);
      expect(contents(w).units).toBe(contents(own).units);
      expect(current(db, 'posture')).toBe(own.manifest.outputs.posture!.key);
      expect(current(db, 'units')).toBe(own.manifest.outputs.units!.key);

      const v = await verifyRun(db, w.run, { smaltdb: SMALTDB, level: 'rerun', manifest: w.hash });
      expect(v.checks.filter((c) => !c.ok)).toEqual([]);
      expect(v.checks.find((c) => c.check === 'held')!.note).toBe('held by run (a what-if: it is never published)');

      const out = await releaseRun(db, { run: w.run, manifest: w.hash, keys: { posture: w.manifest.outputs.posture!.key }, option: 'asis', actor: 'owner', reason: 'What if the TLS team had sent this', decision: '1'.repeat(64) });
      expect(out).toMatchObject({ outcome: 'refused', why: `run ${w.run} is a what-if: it is never published` });
      expect(current(db, 'posture')).toBe(own.manifest.outputs.posture!.key);

      // The day's own run again on the same file is no what-if: it publishes as it passes.
      const again = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day });
      expect('whatIf' in again.manifest).toBe(false);
      expect(again.holds).toEqual([]);
      expect(contents(again)).toEqual(contents(w));
      expect(current(db, 'posture')).toBe(again.manifest.outputs.posture!.key);
    } finally {
      db.close();
    }
  }, 60_000);

  it('is no derived run, later delivery or restated run, and needs a plan that holds', async () => {
    const db = await setup();
    try {
      const doc = await expandNotebooks(flow, ts);
      const day = { day: '2024-03-01' };
      const own = await runFlow(db, doc, { smaltdb: SMALTDB, parameters: day });
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, whatIf: true, stage: true })).rejects.toThrow(/not a derived run/);
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, whatIf: true, correction: { of: { run: own.run, manifest: own.hash }, sources: ['tls'] } })).rejects.toThrow(/never a later delivery/);
      await expect(runFlow(db, doc, { smaltdb: SMALTDB, parameters: day, whatIf: true, restates: { of: own.hash, changes: ['c'] } })).rejects.toThrow(/never a restated run/);
      const { publish: _publish, ...unheld } = doc;
      await expect(runFlow(db, unheld as FlowDocument, { smaltdb: SMALTDB, parameters: day, whatIf: true })).rejects.toThrow(/says nothing of what holds it/);
    } finally {
      db.close();
    }
  }, 60_000);
});
