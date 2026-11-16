/**
 * The data list a page opens (ADR 0010 §9): format 2 binds each source by id, its file or its loads and donors, and
 * each watched source's history. Anything else (the retired format 1 among it, Q-208) reads as a list of nothing.
 */
import { describe, expect, it } from 'vitest';
import { deliveriesOf, namedFiles, readDataList, versionsOfDay } from '../src/app/datalist.js';
import { ddlOf, donorBinding, pinnedDdl } from '../examples/sources.js';

const SHA = (c: string) => c.repeat(64);
const day = (d: string, c: string) => ({ file: `loads/yellow_tripdata_${d}.parquet`, rows: 100, sha256: SHA(c), bytes: 10 });

describe('readDataList', () => {
  const history = { path: 'history.json', from: 'history.json', sha256: SHA('h'), bytes: 5 };
  const zones = { path: 'zones.csv', from: 'tlc/taxi_zone_lookup.csv', sha256: SHA('z'), bytes: 3 };
  const weather = { path: 'weather.csv', from: 'weather/open-meteo_loads.csv', sha256: SHA('w'), bytes: 4 };

  it('reads anything but format 2 as a list of nothing for no flow (format 1 was retired with the taxi example)', () => {
    for (const raw of [null, {}, { data: null, files: { zones, weather, history }, loads: [], donors: [] }]) {
      expect(readDataList(raw)).toMatchObject({ format: 2, flow: null, sources: {}, loads: [], loadSource: null, files: {} });
    }
  });

  it('reads format 2 as it says: bindings by id, slots as days, histories by watched source, the flow it is for', () => {
    const flow = { path: 'flow.json', from: 'examples/security-signins.smaltfl.json', sha256: SHA('f'), bytes: 2 };
    const list = readDataList({
      format: 2, month: '2024-03', data: null, flow,
      sources: { auth: { table: 'auth_file', format: 'csv', file: 'auth.csv', header: true, columns: [['event_time', 'TEXT']], loads: [{ slot: '2024-03-12', file: 'loads/auth_2024-03-12.csv', sha256: SHA('a'), bytes: 1, rows: 3 }], donors: [] } },
      histories: { auth: history },
    });
    expect(list).toMatchObject({ format: 2, loadSource: 'auth', flow, histories: { auth: history } });
    expect(list.loads).toEqual([{ day: '2024-03-12', file: 'loads/auth_2024-03-12.csv', sha256: SHA('a'), bytes: 1, rows: 3 }]);
    expect(list.files).toEqual({ history, 'history:auth': history, flow });
    // The flow document is the build's own, checked by its entry when read, not one of the data's files (ADR 0011).
    expect(namedFiles(list).map((f) => f.path)).toEqual(['history.json', 'history.json', 'loads/auth_2024-03-12.csv']);
    expect(list).toMatchObject({ daily: ['auth'], judged: 'auth' });
  });

  it('reads several daily sources as days, each with every source\'s file, and the dataset the views follow (ADR 0013 §5)', () => {
    const l = (id: string, slot: string, c: string) => ({ slot, file: `loads/${id}_${slot}.csv`, sha256: SHA(c), bytes: 1, rows: 400 });
    const hist = (id: string) => ({ path: `history.${id}.json`, from: `history.${id}.json`, sha256: SHA(id[0]!), bytes: 5 });
    const list = readDataList({
      format: 2, data: null, flow: null, judged: 'posture',
      sources: {
        apps: { table: 'apps_file', format: 'csv', file: 'apps.csv', header: true, entry: { path: 'apps.csv', from: 'apps.csv', sha256: SHA('p'), bytes: 2 } },
        tls: { table: 'tls_file', format: 'csv', file: 'tls.csv', header: true, loads: [l('tls', '2024-03-04', 'a'), l('tls', '2024-03-05', 'b')], donors: [] },
        mfa: { table: 'mfa_file', format: 'csv', file: 'mfa.csv', header: true, loads: [l('mfa', '2024-03-05', 'c')], donors: [] },
      },
      histories: { tls: hist('tls'), mfa: hist('mfa'), posture: hist('posture') },
    });
    expect(list).toMatchObject({ format: 2, loadSource: 'tls', daily: ['tls', 'mfa'], judged: 'posture' });
    expect(list.loads.map((x) => [x.day, x.file, Object.keys(x.files!)])).toEqual([['2024-03-04', 'loads/tls_2024-03-04.csv', ['tls']], ['2024-03-05', 'loads/tls_2024-03-05.csv', ['tls', 'mfa']]]);
    expect(list.files['history:posture']).toEqual(hist('posture'));
    expect(list.files.apps).toBeDefined();
    // Every file of every day is in the list to check: each source's.
    expect(namedFiles(list).map((f) => f.path)).toEqual(['apps.csv', 'history.tls.json', 'history.tls.json', 'history.mfa.json', 'history.posture.json', 'loads/tls_2024-03-04.csv', 'loads/tls_2024-03-05.csv', 'loads/mfa_2024-03-05.csv']);
  });

  it('reads a day’s files sent again later, each a version of the day: the first files, then each delivery in its place (ADR 0021 §2)', () => {
    const l = (id: string, slot: string, c: string, v = '') => ({ slot, file: `loads/${id}_${slot}${v}.csv`, sha256: SHA(c), bytes: 1, rows: 400 });
    const list = readDataList({
      format: 2, data: null, flow: null,
      sources: {
        tls: { table: 'tls_file', format: 'csv', file: 'tls.csv', header: true, loads: [l('tls', '2024-03-21', 'a')], donors: [], deliveries: [
          { ...l('tls', '2024-03-21', 'c', '.v3'), n: 2, exported_at: '2024-03-22T03:30:00Z', arrived: '2024-03-22T03:30:00.000Z', why: 'every certificate once' },
          { ...l('tls', '2024-03-21', 'b', '.v2'), n: 1, arrived: '2024-03-21T14:10:00.000Z', why: 'repeats taken out' },
          { ...l('tls', '2024-03-21', 'x', '.v9'), n: 'one', why: 'not a delivery' },
        ] },
        mfa: { table: 'mfa_file', format: 'csv', file: 'mfa.csv', header: true, loads: [l('mfa', '2024-03-21', 'm')], donors: [] },
      },
      histories: {},
    });
    const ds = deliveriesOf(list, '2024-03-21');
    expect(ds.map((d) => [d.source, d.n, d.file, d.exported ?? null, d.why])).toEqual([['tls', 1, 'loads/tls_2024-03-21.v2.csv', null, 'repeats taken out'], ['tls', 2, 'loads/tls_2024-03-21.v3.csv', '2024-03-22T03:30:00Z', 'every certificate once']]);
    expect(deliveriesOf(list, '2024-03-22')).toEqual([]);
    const vs = versionsOfDay(list.loads[0]!, ds);
    expect(vs.map((v) => [v.tls!.sha256, v.mfa!.sha256])).toEqual([[SHA('a'), SHA('m')], [SHA('b'), SHA('m')], [SHA('c'), SHA('m')]]);
    expect(namedFiles(list).map((f) => f.path)).toContain('loads/tls_2024-03-21.v3.csv');
  });
});

describe('bindings', () => {
  it('make each table\'s DDL, pinned or not, and a donor\'s from its source\'s', () => {
    const auth = { table: 'auth_file', format: 'csv' as const, file: 'auth.csv', header: true, columns: [['event_time', 'TEXT'], ['user', 'TEXT']] as [string, string][] };
    expect(ddlOf(auth)).toBe(`CREATE EXTERNAL TABLE auth_file(event_time TEXT, "user" TEXT) WITH (location = 'file:auth.csv', format = 'csv', header = true)`);
    expect(pinnedDdl(auth)).toBe(`CREATE EXTERNAL TABLE auth_file(event_time TEXT, "user" TEXT) WITH (location = 'smaltfl:auth.csv', format = 'csv', header = true)`);
    expect(donorBinding('auth', auth)).toMatchObject({ table: 'auth_file_donor', file: 'auth_donor.csv' });
  });
});
