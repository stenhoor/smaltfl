/**
 * Sources snapshotted ahead of their run (ADR 0019 amendment 2, plugin/prepared.ts): a run after `prepare` is the same
 * run as one without it (the same manifest, hash for hash), taking each prepared snapshot instead of copying and
 * hashing its file again; a measure before it reads the prepared snapshot and measures the same. A snapshot is taken
 * only for the same pinned bytes through the same definition, and only once: other bytes under the same name, or the
 * table defined again, and the run reads the file itself.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { utf8 } from '../src/core/hash.js';
import { measureLoad, pinFile, prepareRun, runFlow, type FlowDocument } from '../src/index.js';
import { pinnedDdl, type Binding } from '../examples/sources.js';
import { SMALTDB } from './helpers/engine.js';

const auth: Binding = { table: 'auth_file', format: 'csv', file: 'auth.csv', header: true, columns: [['user', 'TEXT'], ['result', 'TEXT'], ['tries', 'INTEGER']] } as Binding;
const people: Binding = { table: 'people_file', format: 'csv', file: 'people.csv', header: true, columns: [['user', 'TEXT'], ['team', 'TEXT']] } as Binding;
const AUTH = 'user,result,tries\nana,ok,1\nbo,fail,3\ncy,ok,2\nana,fail,5\n';
const PEOPLE = 'user,team\nana,red\nbo,blue\ncy,red\n';
const doc: FlowDocument = {
  smaltfl: 1, id: 'prepared', name: 'Prepared',
  sources: [{ id: 'auth', table: 'auth_file' }, { id: 'people', table: 'people_file' }],
  steps: [
    { id: 'checked', kind: 'expectations', inputs: ['auth'], rules: [{ name: 'has_user', check: 'user IS NOT NULL', onFail: 'drop' }] },
    { id: 'by_team', kind: 'sql', inputs: ['checked', 'people'], sql: 'SELECT p.team, count(*) AS tries FROM checked c JOIN people p ON p.user = c.user GROUP BY p.team', dataset: {} },
  ],
  ontology: { objectTypes: [], linkTypes: [], actionTypes: [] },
} as unknown as FlowDocument;

async function engine(authCsv = AUTH, authBinding = auth) {
  const db = Database.openMemory({ plugins: [io, external, smaltfl] });
  await pinFile(db, authBinding.file, utf8(authCsv));
  await db.execAsync(pinnedDdl(authBinding));
  await pinFile(db, people.file, utf8(PEOPLE));
  await db.execAsync(pinnedDdl(people));
  return db;
}

describe('sources snapshotted ahead of their run', () => {
  it('is the same run: the same manifest, each prepared snapshot taken', async () => {
    const plain = await runFlow(await engine(), doc, { smaltdb: SMALTDB });
    const db = await engine();
    expect((await prepareRun(db, doc, { smaltdb: SMALTDB })).prepared.sort()).toEqual(['auth', 'people']);
    const versions = Number(db.query('SELECT count(*) FROM _smaltfl_versions').rows[0]![0]);
    const ahead = await runFlow(db, doc, { smaltdb: SMALTDB });
    expect(ahead.hash).toBe(plain.hash);
    expect(ahead.manifest.nodes.filter((n) => n.op === 'table').map((n) => n.status)).toEqual(['built', 'built']);
    // Nothing copied again: the run stored only the step's version beside the prepared snapshots.
    expect(Number(db.query('SELECT count(*) FROM _smaltfl_versions').rows[0]![0])).toBe(versions + 1);
    expect(ahead.timings?.auth).toBeGreaterThanOrEqual(0);
    // Taken once: the next run reads the files again and finds their versions, as any second run does.
    const again = await runFlow(db, doc, { smaltdb: SMALTDB });
    expect(again.manifest.nodes.filter((n) => n.op === 'table').map((n) => n.status)).toEqual(['reused', 'reused']);
  });

  it('measures a prepared source as it measures the file', async () => {
    const settings = { source: 'auth', slot: '2024-03-01', every: 'day' as const, checks: null, counting: null, counted: ['result'], followed: [], paired: [], time: null, zone: null, sample: 2000 };
    const plain = await measureLoad(await engine(), 'auth_file', settings);
    const db = await engine();
    await prepareRun(db, doc, { smaltdb: SMALTDB });
    const ahead = await measureLoad(db, 'auth_file', settings);
    expect(ahead).toEqual(plain);
  });

  it('takes nothing for other bytes under the same name, or a table defined again', async () => {
    const other = 'user,result,tries\nana,ok,1\n';
    const plainOther = await runFlow(await engine(other), doc, { smaltdb: SMALTDB });
    const db = await engine();
    await prepareRun(db, doc, { smaltdb: SMALTDB });
    await pinFile(db, auth.file, utf8(other));
    const rePinned = await runFlow(db, doc, { smaltdb: SMALTDB });
    expect(rePinned.manifest.outputs).toEqual(plainOther.manifest.outputs);
    expect(rePinned.manifest.nodes.find((n) => n.origin === 'auth')!.file?.sha256).toBe(plainOther.manifest.nodes.find((n) => n.origin === 'auth')!.file?.sha256);

    const asText: Binding = { ...auth, columns: [['user', 'TEXT'], ['result', 'TEXT'], ['tries', 'TEXT']] } as Binding;
    const plainText = await runFlow(await engine(AUTH, asText), doc, { smaltdb: SMALTDB });
    const db2 = await engine();
    await prepareRun(db2, doc, { smaltdb: SMALTDB });
    await db2.execAsync('DROP EXTERNAL TABLE auth_file');
    await db2.execAsync(pinnedDdl(asText));
    const redefined = await runFlow(db2, doc, { smaltdb: SMALTDB });
    expect(redefined.manifest.nodes.find((n) => n.origin === 'auth')!.content).toBe(plainText.manifest.nodes.find((n) => n.origin === 'auth')!.content);
    expect(redefined.manifest.outputs).toEqual(plainText.manifest.outputs);
  });
});
