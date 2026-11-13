/**
 * Types computed ahead (ADR 0019 amendment 2, core/typed.ts): a run given a types file with an entry under its own
 * typing's key takes every node's columns from it instead of compiling each step, and the run is the same run: the
 * same typed plan, the same datasets and the same manifest hash. Any other typing (another document, other parameters,
 * other source columns) misses and is typed as before, and so does an entry that leaves a needed node out or a file
 * that isn't a types file.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import smaltfl from '../src/plugin/index.js';
import { utf8 } from '../src/core/hash.js';
import { TYPES_PATH, isTypesFile, type TypesFile } from '../src/core/typed.js';
import { pinFile, runFlow, type FlowDocument } from '../src/index.js';
import { pinnedDdl, type Binding } from '../examples/sources.js';
import { SMALTDB } from './helpers/engine.js';

const binding: Binding = { table: 'auth_file', format: 'csv', file: 'auth.csv', header: true, columns: [['user', 'TEXT'], ['result', 'TEXT'], ['tries', 'INTEGER'], ['at', 'TEXT']] } as Binding;
const csv = 'user,result,tries,at\nana,ok,1,2024-03-01T08:00\nbo,fail,3,2024-03-01T09:30\ncy,ok,2,2024-03-01T10:15\nana,fail,5,2024-03-01T11:00\n';
const doc: FlowDocument = {
  smaltfl: 1, id: 'typed', name: 'Typed',
  parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
  sources: [{ id: 'auth', table: 'auth_file' }],
  steps: [
    { id: 'checked', kind: 'expectations', inputs: ['auth'], rules: [{ name: 'has_user', check: 'user IS NOT NULL', onFail: 'drop' }] },
    { id: 'scored', kind: 'sql', inputs: ['checked'], sql: "WITH t AS (SELECT user, tries * 1.5 AS weight, CASE WHEN result = 'ok' THEN 1 ELSE NULL END AS passed FROM checked WHERE substr(at, 1, 10) = :day) SELECT user, sum(weight) AS weight, count(passed) AS passed, NULL AS note FROM t GROUP BY user", dataset: {} },
    { id: 'by_result', kind: 'aggregate', inputs: ['checked'], groupBy: [{ name: 'result', expr: 'result' }], measures: [{ name: 'n', expr: 'count(*)' }, { name: 'tries', expr: 'avg(tries)' }], dataset: {} },
  ],
  ontology: { objectTypes: [], linkTypes: [], actionTypes: [] },
} as unknown as FlowDocument;

async function engine(types?: unknown) {
  const db = Database.openMemory({ plugins: [io, external, smaltfl] });
  await pinFile(db, binding.file, utf8(csv));
  await db.execAsync(pinnedDdl(binding));
  // Pinned files are the plugin's, for every engine in the worker: an earlier test's types file is taken away.
  await pinFile(db, TYPES_PATH, types === undefined ? null : utf8(typeof types === 'string' ? types : JSON.stringify(types)));
  return db;
}

const fileOf = (typed: NonNullable<Awaited<ReturnType<typeof runFlow>>['typed']>, day?: string): TypesFile => ({ format: 'smaltfl-types/0', entries: [{ key: typed.key, ...(day ? { day } : {}), schemas: typed.schemas }] });

describe('types computed ahead', () => {
  it('takes every column from an entry under the run’s own key, and the run is the same run', async () => {
    const first = await runFlow(await engine(), doc, { smaltdb: SMALTDB, typed: true });
    expect(first.typed?.given).toBe(false);
    // Every needed node but the snapshot, with the engine's own types (a weight is real, a note null).
    expect(first.typed!.schemas.map(([i]) => i).sort()).toEqual([1, 2, 3]);
    expect(Object.fromEntries(first.typed!.schemas.find(([i]) => i === 2)![1])).toEqual({ user: 'text', weight: 'real', passed: 'int', note: 'null' });
    const file = fileOf(first.typed!, '2024-03-01');
    expect(isTypesFile(file)).toBe(true);
    const again = await runFlow(await engine(file), doc, { smaltdb: SMALTDB, typed: true });
    expect(again.typed?.given).toBe(true);
    expect(again.typed!.key).toBe(first.typed!.key);
    expect(again.manifest.plan).toBe(first.manifest.plan);
    expect(again.manifest.outputs).toEqual(first.manifest.outputs);
    expect(again.hash).toBe(first.hash);
    // Without asking for the typing, a pinned file is still taken: the page's run.
    const page = await runFlow(await engine(file), doc, { smaltdb: SMALTDB });
    expect(page.typed).toBeUndefined();
    expect(page.hash).toBe(first.hash);
  });

  it('is taken as given: the key is the check, so columns under the right key are the ones the run uses', async () => {
    const first = await runFlow(await engine(), doc, { smaltdb: SMALTDB, typed: true });
    // The aggregate's average said to be text: taken, and the typed plan says so (a build that typed otherwise would
    // have another key, never this one).
    const schemas = first.typed!.schemas.map(([i, cols]): [number, typeof cols] => [i, i === 3 ? cols.map(([c, t]) => [c, c === 'tries' ? 'text' : t] as [string, typeof t]) : cols]);
    const taken = await runFlow(await engine({ format: 'smaltfl-types/0', entries: [{ key: first.typed!.key, schemas }] }), doc, { smaltdb: SMALTDB, typed: true });
    expect(taken.typed?.given).toBe(true);
    expect(taken.manifest.plan).not.toBe(first.manifest.plan);
  });

  it('misses on any other typing: other parameters, another document, other source columns', async () => {
    const first = await runFlow(await engine(), doc, { smaltdb: SMALTDB, typed: true });
    const file = fileOf(first.typed!);
    const otherDay = await runFlow(await engine(file), doc, { smaltdb: SMALTDB, typed: true, parameters: { day: '2024-03-02' } });
    expect(otherDay.typed?.given).toBe(false);
    const edited = { ...doc, steps: doc.steps.map((s) => (s.id === 'by_result' ? { ...s, measures: [{ name: 'n', expr: 'count(*)' }, { name: 'tries', expr: 'max(tries)' }] } : s)) } as FlowDocument;
    const otherDoc = await runFlow(await engine(file), edited, { smaltdb: SMALTDB, typed: true });
    expect(otherDoc.typed?.given).toBe(false);
    // The same document over a file declared with other columns: the snapshot's columns are in the key.
    const db = Database.openMemory({ plugins: [io, external, smaltfl] });
    await pinFile(db, binding.file, utf8(csv));
    await db.execAsync(pinnedDdl({ ...binding, columns: [['user', 'TEXT'], ['result', 'TEXT'], ['tries', 'TEXT'], ['at', 'TEXT']] } as Binding));
    await pinFile(db, TYPES_PATH, utf8(JSON.stringify(file)));
    const otherColumns = await runFlow(db, doc, { smaltdb: SMALTDB, typed: true });
    expect(otherColumns.typed?.given).toBe(false);
    await pinFile(db, TYPES_PATH, null);
  });

  it('takes nothing from an entry that leaves a needed node out, or from a file that isn’t a types file', async () => {
    const first = await runFlow(await engine(), doc, { smaltdb: SMALTDB, typed: true });
    const short = await runFlow(await engine({ format: 'smaltfl-types/0', entries: [{ key: first.typed!.key, schemas: first.typed!.schemas.slice(1) }] }), doc, { smaltdb: SMALTDB, typed: true });
    expect(short.typed?.given).toBe(false);
    expect(short.hash).toBe(first.hash);
    for (const bad of ['not json', { format: 'smaltfl-types/1', entries: [] }, { format: 'smaltfl-types/0', entries: [{ key: first.typed!.key, schemas: [[1, [['user', '']]]] }] }]) {
      const r = await runFlow(await engine(bad), doc, { smaltdb: SMALTDB, typed: true });
      expect(r.typed?.given).toBe(false);
      expect(r.hash).toBe(first.hash);
    }
    await engine();
  });
});
