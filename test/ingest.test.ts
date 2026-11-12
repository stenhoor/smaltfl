/**
 * The bronze tables' metadata (ADR 0015 amendment 5): where a source's file came from, what made it and when it was pulled
 * in, as the host says it, kept on the source's entry in the run's signed manifest only where the host's sha256 is the
 * file's the engine read; with the run's code commit and ontology hash, a row of `_smaltfl_ingests` for SQL. A run told
 * nothing records nothing new, so no hash moves.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { sha256Hex, utf8 } from '../src/core/hash.js';
import { pinFile, runFlow, verifyRun, type FlowDocument } from '../src/index.js';
import { pinnedDdl, type Binding } from '../examples/sources.js';
import { SMALTDB } from './helpers/engine.js';

const binding: Binding = { table: 'auth_file', format: 'csv', file: 'auth.csv', header: true, columns: [['user', 'TEXT'], ['result', 'TEXT']] } as Binding;
const csv = 'user,result\nana,ok\nbo,fail\ncy,ok\n';
const doc: FlowDocument = {
  smaltfl: 1, id: 'meta', name: 'Meta',
  sources: [{ id: 'auth', table: 'auth_file' }],
  steps: [{ id: 'kept', kind: 'filter', inputs: ['auth'], where: "result = 'ok'", dataset: {} }],
  ontology: { objectTypes: [], linkTypes: [], actionTypes: [] },
} as unknown as FlowDocument;

async function engine() {
  const db = Database.openMemory({ plugins: [io, external, smaltfl] });
  const bytes = utf8(csv);
  await pinFile(db, binding.file, bytes);
  await db.execAsync(pinnedDdl(binding));
  return { db, sha256: await sha256Hex(bytes) };
}

describe('the bronze tables’ metadata', () => {
  it('keeps where the file came from and when it was pulled in on the source’s entry, bound to its bytes, with the run’s commit and ontology', async () => {
    const { db, sha256 } = await engine();
    const at = '2026-11-12T09:14:02.000Z';
    const r = await runFlow(db, doc, { smaltdb: SMALTDB, sources: { auth: { path: 'data/loads/auth_2024-03-12.csv', from: 'scripts/data/security.mjs', at, sha256 } } });
    const node = r.manifest.nodes.find((n) => n.origin === 'auth')!;
    expect(node.ingest).toEqual({ path: 'data/loads/auth_2024-03-12.csv', from: 'scripts/data/security.mjs', at });
    expect(node.file?.sha256).toBe(sha256);
    const row = db.query('SELECT source, ingested_at, source_path, made_by, file_sha256, rows, code_commit, ontology_hash, flow_hash, plan_hash FROM _smaltfl_ingests WHERE run = ?', [r.run]);
    expect(row.rows).toHaveLength(1);
    const [source, ingestedAt, path, madeBy, fileSha, rows, commit, ontology, flow, plan] = row.rows[0]!;
    expect([source, ingestedAt, path, madeBy, fileSha, rows]).toEqual(['auth', at, 'data/loads/auth_2024-03-12.csv', 'scripts/data/security.mjs', sha256, 3]);
    expect(commit).toBe(r.manifest.build?.smaltfl);
    expect(ontology).toBe(r.manifest.flow.ontology);
    expect([flow, plan]).toEqual([r.manifest.flow.hash, r.manifest.plan]);
    // The run still verifies: the metadata is beside the data, not in it.
    expect((await verifyRun(db, r.run, { smaltdb: SMALTDB, level: 'rederive', manifest: r.hash })).ok).toBe(true);
  });

  it('records nothing it can’t bind to the bytes: another sha256, a time that isn’t one, or nothing said', async () => {
    const { db, sha256 } = await engine();
    const other = await runFlow(db, doc, { smaltdb: SMALTDB, sources: { auth: { path: 'x.csv', at: '2026-11-12T09:14:02Z', sha256: 'f'.repeat(64) } } });
    expect(other.manifest.nodes.find((n) => n.origin === 'auth')!.ingest).toBeUndefined();
    const notTime = await runFlow(db, doc, { smaltdb: SMALTDB, sources: { auth: { path: 'x.csv', at: 'yesterday', sha256 } } });
    expect(notTime.manifest.nodes.find((n) => n.origin === 'auth')!.ingest).toBeUndefined();
    const none = await runFlow(db, doc, { smaltdb: SMALTDB });
    expect(none.manifest.nodes.find((n) => n.origin === 'auth')!.ingest).toBeUndefined();
    expect(db.query('SELECT count(*) FROM _smaltfl_ingests').rows[0]![0]).toBe(0);
    // The data itself is the same whatever was said of it: the source's content and every output's.
    expect(other.manifest.nodes.map((n) => n.content)).toEqual(none.manifest.nodes.map((n) => n.content));
  });
});
