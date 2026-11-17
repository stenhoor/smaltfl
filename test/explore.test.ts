/**
 * Exploring a dataset (ADR 0025 §9): what the engine is asked (emit.ts), over every row. A column's values counted, a
 * number's rows in bins, a time's by its stamp, a part picked and lit in every other column, kept, and how two
 * datasets join on a key with the keys that find no match.
 */
import { describe, expect, it } from 'vitest';
import { Database } from 'smaltdb/engine';
import { emitBinCounts, emitColumnFacts, emitFit, emitJoinMatch, emitKept, emitKeptCell, emitLit, emitPick, emitStampCounts, emitUnmatchedKeys, emitValueCounts, emitWhere, type RowPick } from '../src/core/emit.js';
import { askOf, axisNumber, cardOf, cardSaid, fitSaid, joinPartners, joinRead, joinSaid, joinWhy, litSaid, matchDays, matchSaid, niceStep, pickSaid, rowSaid, rowsKeptFrom, samePick, shareSaid, stampLabel, stampsBetween, type ColumnAsk } from '../src/core/explore.js';
import { profileColumn, type ColumnFacts, type Profile } from '../src/core/quality.js';
import { loadFlowDir } from './helpers/notebooks.js';

const db = Database.openMemory({ plugins: [] });
db.exec('CREATE TABLE tls(app_id TEXT, status TEXT, days INTEGER, score REAL, checked_at TEXT)');
db.exec(`INSERT INTO tls VALUES
  ('app-1','pass',3,0.5,'2024-03-11 08:15:00'), ('app-2','fail',40,7.25,'2024-03-11 09:00:00'), ('app-3','pass',5,1.0,'2024-03-12 08:00:00'),
  ('app-4','pass',NULL,2.5,'2024-03-12 14:30:00'), ('app-5',NULL,12,NULL,'2024-03-12 14:45:00'), ('APP-6 ','fail',90,9.75,NULL),
  ('app-7','pass',1,0.25,'2024-04-01 00:00:00'), (NULL,'excepted',0,0.0,'2024-04-02 10:00:00')`);
db.exec('CREATE TABLE apps(id TEXT, tier INTEGER)');
db.exec(`INSERT INTO apps VALUES ('app-1',1), ('app-2',1), ('app-3',2), ('app-6',3), ('app-8',2), ('app-9',NULL), ('app-9',3)`);
const TLS = 'SELECT * FROM tls';
const APPS = 'SELECT * FROM apps';
const rows = (sql: string) => db.query(sql).rows.map((r) => [...r]);

describe('a column’s values, counted over every row', () => {
  it('lists the rows with none first, then each value with its rows, the most common first', () => {
    expect(rows(emitValueCounts(TLS, 'status', 10))).toEqual([[null, 1, 0], ['pass', 4, 0], ['fail', 2, 0], ['excepted', 1, 0]]);
    // The first few values: the caller knows the rest from the relation's rows. The rows with none are counted all the same.
    expect(rows(emitValueCounts(TLS, 'status', 2))).toEqual([[null, 1, 0], ['pass', 4, 0], ['fail', 2, 0]]);
    // A column with no empty row gives one value more than asked, which the card leaves out.
    expect(rows(emitValueCounts(APPS, 'id', 2))).toEqual([['app-9', 2, 0], ['app-1', 1, 0], ['app-2', 1, 0]]);
  });

  it('lights the rows a pick on another column picks, in every value', () => {
    const late: RowPick = { column: 'days', from: 10, to: null };
    expect(rows(emitValueCounts(TLS, 'status', 10, late))).toEqual([[null, 1, 1], ['pass', 4, 0], ['fail', 2, 2], ['excepted', 1, 0]]);
    expect(rows(emitLit(TLS, late))).toEqual([[8, 3]]);
    expect(rows(emitLit(TLS, null))).toEqual([[8, 0]]);
  });
});

describe('a part of a dataset, picked', () => {
  const count = (pick: RowPick) => Number(rows(emitLit(TLS, pick))[0]![1]);

  it('is the rows with one value, or with none', () => {
    expect(count({ column: 'status', value: 'pass' })).toBe(4);
    expect(count({ column: 'status', value: null })).toBe(1);
    expect(count({ column: 'days', value: 0 })).toBe(1);
    // A quote in a value is a quote, not the end of it.
    expect(count({ column: 'status', value: "pa'ss" })).toBe(0);
  });

  it('is a number’s rows from one end up to the other, either end open; never a row with no number', () => {
    expect(count({ column: 'days', from: 3, to: 12 })).toBe(2);
    expect(count({ column: 'days', from: null, to: 3 })).toBe(2);
    expect(count({ column: 'days', from: 12, to: null })).toBe(3);
    expect(count({ column: 'days', from: null, to: null })).toBe(7);
    expect(() => emitPick({ column: 'days', from: Number.NaN, to: 3 })).toThrow(/not a number/);
  });

  it('is a time’s rows by the start of its stamp: a day, a month, an hour', () => {
    expect(count({ column: 'checked_at', prefix: '2024-03-12' })).toBe(3);
    expect(count({ column: 'checked_at', prefix: '2024-03' })).toBe(5);
    expect(count({ column: 'checked_at', prefix: '2024-03-12 14' })).toBe(2);
  });

  it('keeps only the rows every pick holds for; with none, every row', () => {
    const kept = emitKept(TLS, [{ column: 'status', value: 'pass' }, { column: 'checked_at', prefix: '2024-03' }]);
    expect(rows(`SELECT app_id FROM (${kept}) ORDER BY 1`)).toEqual([['app-1'], ['app-3'], ['app-4']]);
    expect(emitKept(TLS, [])).toBe(TLS);
    // What is kept is counted as any relation is.
    expect(rows(emitValueCounts(kept, 'status', 5))).toEqual([['pass', 3, 0]]);
  });

  it('writes the rows kept as a statement a reader can read and change, over the dataset by its name', () => {
    const text = emitKeptCell('tls', [{ column: 'status', value: 'fail' }, { column: 'days', from: 50, to: null }]);
    expect(text).toBe(`SELECT *\nFROM tls\nWHERE "status" = 'fail'\n  AND "days" >= 50`);
    expect(rows(text).map((r) => r[0])).toEqual(['APP-6 ']);
    expect(emitKeptCell('tls', [])).toBe('SELECT *\nFROM tls');
    // Each kind of pick keeps the rows `emitKept` does, written without its guard.
    const picks: RowPick[][] = [[{ column: 'status', value: null }], [{ column: 'days', from: 3, to: 12 }], [{ column: 'days', from: null, to: null }], [{ column: 'checked_at', prefix: '2024-03-12' }], [{ column: 'days', value: 0 }, { column: 'status', value: 'excepted' }]];
    for (const kept of picks) expect(rows(`SELECT count(*) FROM (${emitKeptCell('tls', kept)})`)).toEqual(rows(`SELECT count(*) FROM (${emitKept(TLS, kept)})`));
  });

  it('never makes a condition unknown: a row with no value isn’t picked by a value, and is by none', () => {
    const not = (pick: RowPick) => Number(rows(`SELECT count(*) FROM tls WHERE NOT ${emitPick(pick)}`)[0]![0]);
    expect(not({ column: 'status', value: 'pass' })).toBe(4);
    expect(not({ column: 'days', from: 3, to: 12 })).toBe(6);
    expect(not({ column: 'checked_at', prefix: '2024-03' })).toBe(3);
  });
});

describe('a number’s rows in bins', () => {
  it('counts every row with a value in equal bins from a start, the ones under and over apart', () => {
    // days: 3, 40, 5, 12, 90, 1, 0 (one blank). Four bins of 10 from 0: [0,10) [10,20) [20,30) [30,40); 40 and 90 over.
    expect(rows(emitBinCounts(TLS, 'days', 0, 10, 4))).toEqual([[0, 4, 0], [1, 1, 0], [4, 2, 0]]);
    // From 2: 0 and 1 are under.
    expect(rows(emitBinCounts(TLS, 'days', 2, 10, 4))).toEqual([[-1, 2, 0], [0, 2, 0], [1, 1, 0], [3, 1, 0], [4, 1, 0]]);
  });

  it('bins a real number where it falls, and lights a pick', () => {
    // score: 0.5, 7.25, 1.0, 2.5, 9.75, 0.25, 0.0 (one blank). Bins of 2.5 from 0.
    expect(rows(emitBinCounts(TLS, 'score', 0, 2.5, 4, { column: 'status', value: 'fail' }))).toEqual([[0, 4, 0], [1, 1, 0], [2, 1, 1], [3, 1, 1]]);
    expect(() => emitBinCounts(TLS, 'score', 0, 0, 4)).toThrow(/width/);
  });
});

describe('a time’s rows by its stamp', () => {
  it('counts by day, by month and by hour, in order, the rows with no time left out', () => {
    expect(rows(emitStampCounts(TLS, 'checked_at', 10))).toEqual([['2024-03-11', 2, 0], ['2024-03-12', 3, 0], ['2024-04-01', 1, 0], ['2024-04-02', 1, 0]]);
    expect(rows(emitStampCounts(TLS, 'checked_at', 7, { column: 'status', value: 'pass' }))).toEqual([['2024-03', 5, 3], ['2024-04', 2, 1]]);
    expect(rows(emitStampCounts(TLS, 'checked_at', 13)).map((r) => r[0])).toEqual(['2024-03-11 08', '2024-03-11 09', '2024-03-12 08', '2024-03-12 14', '2024-04-01 00', '2024-04-02 10']);
  });
});

describe('how a column’s rows sit with the values written for it', () => {
  it('counts the rows with one of them, with another value, and with none', () => {
    expect(rows(emitFit(TLS, 'status', ['pass', 'fail']))).toEqual([[6, 1, 1]]);
    // A code read as a number sits with its values written as text.
    expect(rows(emitFit(APPS, 'tier', ['1', '2']))).toEqual([[4, 2, 1]]);
    expect(rows(emitFit(TLS, 'status', []))).toEqual([[0, 7, 1]]);
  });
});

describe('how two datasets join on a key', () => {
  it('counts each side: its rows, those with no key, those whose key the other has, its keys and those the other has', () => {
    // tls keys: app-1..5, 'APP-6 ', app-7, one blank. apps keys: app-1, app-2, app-3, app-6, app-8, app-9 (twice).
    expect(rows(emitJoinMatch(TLS, 'app_id', APPS, 'id'))).toEqual([[8, 1, 3, 7, 3, 7, 0, 3, 6, 3]]);
    // Loosely, 'APP-6 ' is app-6: one more row and one more key on each side.
    expect(rows(emitJoinMatch(TLS, 'app_id', APPS, 'id', true))).toEqual([[8, 1, 4, 7, 4, 7, 0, 4, 6, 4]]);
  });

  it('lists the keys that find no match, those on the most rows first', () => {
    expect(rows(emitUnmatchedKeys(TLS, 'app_id', APPS, 'id', 10))).toEqual([['APP-6 ', 1], ['app-4', 1], ['app-5', 1], ['app-7', 1]]);
    expect(rows(emitUnmatchedKeys(TLS, 'app_id', APPS, 'id', 10, true))).toEqual([['app-4', 1], ['app-5', 1], ['app-7', 1]]);
    expect(rows(emitUnmatchedKeys(APPS, 'id', TLS, 'app_id', 2))).toEqual([['app-9', 2], ['app-6', 1]]);
    expect(rows(emitUnmatchedKeys(APPS, 'id', TLS, 'app_id', 10, true))).toEqual([['app-9', 2], ['app-8', 1]]);
  });

  it('counts against the keys a scope keeps of the other side: a condition given as data, or as written', () => {
    // The applications of tier 1 or 2, as the ontology would say it: app-1, app-2, app-3, app-8.
    const inScope = emitWhere(APPS, [['id', ['app-1', 'app-2', 'app-3', 'app-8']]]);
    expect(rows(`SELECT id FROM (${inScope}) ORDER BY 1`)).toEqual([['app-1'], ['app-2'], ['app-3'], ['app-8']]);
    expect(rows(emitJoinMatch(TLS, 'app_id', inScope, 'id'))).toEqual([[8, 1, 3, 7, 3, 4, 0, 3, 4, 3]]);
    expect(rows(emitUnmatchedKeys(inScope, 'id', TLS, 'app_id', 10))).toEqual([['app-8', 1]]);
    // As a gate cell writes it; a condition with an OR stays one condition.
    const written = emitWhere(APPS, 'tier = 1 OR tier = 2');
    expect(rows(`SELECT count(*) FROM (${written}) WHERE id IS NOT NULL`)).toEqual([[4]]);
    // No condition is every row.
    expect(rows(`SELECT count(*) FROM (${emitWhere(APPS, [])})`)).toEqual([[7]]);
  });

  it('matches an id read as a number on one side with the same id as text on the other', () => {
    db.exec('CREATE TABLE n1(k INTEGER)');
    db.exec('CREATE TABLE n2(k TEXT)');
    db.exec(`INSERT INTO n1 VALUES (1), (2), (3)`);
    db.exec(`INSERT INTO n2 VALUES ('2'), ('3'), ('4')`);
    expect(rows(emitJoinMatch('SELECT * FROM n1', 'k', 'SELECT * FROM n2', 'k'))).toEqual([[3, 0, 2, 3, 2, 3, 0, 2, 3, 2]]);
  });
});

// ------------------------------------------------------------------ the pure part (core/explore.ts)

/** A column's profile as the app reads one: exact facts from the engine, its shape from the rows themselves. */
function profileOf(table: string, column: string, type: string): Profile {
  const numeric = type === 'int' || type === 'real';
  const f = rows(emitColumnFacts(`SELECT * FROM ${table}`, [{ name: column, numeric }]))[0]!;
  const facts: ColumnFacts = { rows: Number(f[0]), present: Number(f[1]), distinct: Number(f[2]), min: f[3], max: f[4], mean: f[5] === null ? null : Number(f[5]) };
  return profileColumn(column, type, facts, rows(`SELECT ${column} FROM ${table}`).map((r) => r[0]));
}
const counted = (ask: ColumnAsk, table: string, pick: RowPick | null = null) => {
  const sql = `SELECT * FROM ${table}`;
  return ask.ask === 'values' ? rows(emitValueCounts(sql, ask.column, ask.limit, pick)) : ask.ask === 'bins' ? rows(emitBinCounts(sql, ask.column, ask.lo, ask.width, ask.bins, pick)) : ask.ask === 'stamps' ? rows(emitStampCounts(sql, ask.column, ask.chars, pick)) : [];
};

describe('what to ask of a column', () => {
  it('asks a category for its values, a time by the stretch it spans, a number for bins on round edges', () => {
    expect(askOf(profileOf('tls', 'status', 'text'))).toEqual({ column: 'status', ask: 'values', limit: 8 });
    // Mar 11 to Apr 2: under a quarter, so by the day.
    expect(askOf(profileOf('tls', 'checked_at', 'text'))).toEqual({ column: 'checked_at', ask: 'stamps', chars: 10 });
    // A number that takes a dozen values or fewer is a code (quality.ts): its values, not bins.
    expect(askOf(profileOf('tls', 'score', 'real'))).toEqual({ column: 'score', ask: 'values', limit: 8 });
    // Forty amounts from 0.5 to 20: bins of 2 on round edges, from 0, that hold every one of them.
    db.exec('CREATE TABLE amounts(amount REAL)');
    db.exec(`INSERT INTO amounts VALUES ${Array.from({ length: 40 }, (_, i) => `(${(i + 1) / 2})`).join(', ')}`);
    const p = profileOf('amounts', 'amount', 'real');
    const bins = askOf(p);
    expect(bins).toEqual({ column: 'amount', ask: 'bins', lo: 0, width: 2, bins: 10 });
    const card = cardOf(p, bins, counted(bins, 'amounts'));
    expect(card.bars.map((b) => b.rows)).toEqual([3, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    expect(card.over).toMatchObject({ label: '20 and over', rows: 1 });
    expect(card.bars[0]!.label).toBe('0 to 2');
    expect(card.axis).toEqual(['0', '20']);
    expect(card.bars.reduce((sum, b) => sum + b.rows, 0) + (card.under?.rows ?? 0) + (card.over?.rows ?? 0)).toBe(40);
  });

  it('has nothing to chart for an empty column, or one whose every row has its own value', () => {
    db.exec('CREATE TABLE ids(id TEXT, nothing TEXT)');
    db.exec(`INSERT INTO ids VALUES ${Array.from({ length: 70 }, (_, i) => `('id-${i}', NULL)`).join(', ')}`);
    expect(askOf(profileOf('ids', 'id', 'text'))).toEqual({ column: 'id', ask: 'none', why: 'unique' });
    expect(askOf(profileOf('ids', 'nothing', 'text'))).toEqual({ column: 'nothing', ask: 'none', why: 'empty' });
  });

  it('spans a time by the hour within two days, by the day within two months, by the month within five years, else by the year', () => {
    const p = profileOf('tls', 'checked_at', 'text');
    const spans = (min: string, max: string) => askOf({ ...p, facts: { ...p.facts, min, max } });
    expect(spans('2024-03-11 08:15:00', '2024-03-12 14:45:00')).toMatchObject({ ask: 'stamps', chars: 13 });
    // A column of dates has no hour to count by, however few days it spans.
    expect(spans('2024-03-11', '2024-03-12')).toMatchObject({ ask: 'stamps', chars: 10 });
    expect(spans('2024-01-15', '2024-03-12')).toMatchObject({ ask: 'stamps', chars: 10 });
    expect(spans('2023-01-01', '2024-03-12')).toMatchObject({ ask: 'stamps', chars: 7 });
    expect(spans('2011-06-01', '2024-03-12')).toMatchObject({ ask: 'stamps', chars: 4 });
  });

  it('steps an axis by a number a reader can read', () => {
    expect([0.03, 0.2, 0.21, 2.4, 7, 30, 31, 400].map(niceStep)).toEqual([0.05, 0.2, 0.25, 2.5, 10, 50, 50, 500]);
    expect(axisNumber(2.5, 2.5)).toBe('2.5');
    expect(axisNumber(1200, 100)).toBe('1,200');
    expect(axisNumber(0.25, 0.05)).toBe('0.25');
  });
});

describe('a column’s card', () => {
  it('draws a category’s values the most common first, with the rows that have none a bar of their own', () => {
    const p = profileOf('tls', 'status', 'text');
    const ask = askOf(p);
    const card = cardOf(p, ask, counted(ask, 'tls'), { fit: rows(emitFit(TLS, 'status', ['pass', 'fail']))[0]!, label: (v) => (v === 'pass' ? 'Pass' : String(v)) });
    expect(card).toMatchObject({ column: 'status', kind: 'category', rows: 8, present: 7, distinct: 3, rest: null, why: null, fit: { fits: 6, other: 1, empty: 1 } });
    expect(card.bars).toEqual([
      { label: 'Pass', pick: { column: 'status', value: 'pass' }, rows: 4, lit: 0 },
      { label: 'fail', pick: { column: 'status', value: 'fail' }, rows: 2, lit: 0 },
      { label: 'excepted', pick: { column: 'status', value: 'excepted' }, rows: 1, lit: 0 },
    ]);
    expect(card.empty).toEqual({ label: 'empty', pick: { column: 'status', value: null }, rows: 1, lit: 0 });
    expect(cardSaid(card)).toBe('1 of 8 empty (13%) · 3 values');
    expect(fitSaid(card.fit!, 2)).toBe('6 fit the 2 values written · 1 holds another (13%)');
  });

  it('folds the values past the ones drawn into a count, and lights a pick in every bar', () => {
    const p = profileOf('tls', 'status', 'text');
    const ask: ColumnAsk = { column: 'status', ask: 'values', limit: 2 };
    const late: RowPick = { column: 'days', from: 10, to: null };
    const card = cardOf(p, ask, counted(ask, 'tls', late));
    expect(card.bars.map((b) => [b.label, b.rows, b.lit])).toEqual([['pass', 4, 0], ['fail', 2, 2]]);
    expect(card.rest).toEqual({ values: 1, rows: 1 });
    // The rows with none are counted, and lit, whatever the limit: the statement gives them first.
    expect(card.empty).toEqual({ label: 'empty', pick: { column: 'status', value: null }, rows: 1, lit: 1 });
    // A column with no empty row draws the values asked for, not the one more the statement gives.
    const ids = profileOf('apps', 'id', 'text');
    const two: ColumnAsk = { column: 'id', ask: 'values', limit: 2 };
    expect(cardOf(ids, two, counted(two, 'apps')).bars.map((b) => b.label)).toEqual(['app-9', 'app-1']);
  });

  it('draws a number’s bins in order, the empty ones too, with the stray ends apart', () => {
    const p = profileOf('tls', 'days', 'int');
    const ask: ColumnAsk = { column: 'days', ask: 'bins', lo: 0, width: 10, bins: 4 };
    const card = cardOf(p, ask, counted(ask, 'tls'));
    expect(card.bars.map((b) => [b.label, b.rows])).toEqual([['0 to 10', 4], ['10 to 20', 1], ['20 to 30', 0], ['30 to 40', 0]]);
    expect(card.bars[1]!.pick).toEqual({ column: 'days', from: 10, to: 20 });
    expect(card.under).toBeNull();
    expect(card.over).toEqual({ label: '40 and over', pick: { column: 'days', from: 40, to: null }, rows: 2, lit: 0 });
    expect(card.axis).toEqual(['0', '40']);
    expect(card.empty).toMatchObject({ rows: 1, lit: 0 });
    // The rows with no number are left out of the bins: how many of them a pick lights is asked apart.
    const fail: RowPick = { column: 'status', value: 'pass' };
    const noNumber = Number(rows(emitLit(emitKept(TLS, [{ column: 'days', value: null }]), fail))[0]![1]);
    expect(cardOf(p, ask, counted(ask, 'tls', fail), { emptyLit: noNumber }).empty).toEqual({ label: 'empty', pick: { column: 'days', value: null }, rows: 1, lit: 1 });
    // What a bar picks is the rows it counted.
    for (const b of [...card.bars, card.over!]) expect(Number(rows(emitLit(TLS, b.pick))[0]![1])).toBe(b.rows);
  });

  it('draws a time’s days in order, a day with no row as a gap', () => {
    const p = profileOf('tls', 'checked_at', 'text');
    const ask: ColumnAsk = { column: 'checked_at', ask: 'stamps', chars: 10 };
    const card = cardOf({ ...p, facts: { ...p.facts, max: '2024-03-14' } }, ask, counted(ask, 'tls').slice(0, 2));
    expect(card.bars.map((b) => [b.label, b.rows])).toEqual([['Mon Mar 11', 2], ['Tue Mar 12', 3]]);
    const whole = cardOf(p, ask, counted(ask, 'tls'));
    expect(whole.bars).toHaveLength(23);
    expect(whole.bars.filter((b) => b.rows > 0).map((b) => b.label)).toEqual(['Mon Mar 11', 'Tue Mar 12', 'Mon Apr 1', 'Tue Apr 2']);
    expect(whole.bars[2]).toEqual({ label: 'Wed Mar 13', pick: { column: 'checked_at', prefix: '2024-03-13' }, rows: 0, lit: 0 });
    expect(whole.axis).toEqual(['Mon Mar 11', 'Tue Apr 2']);
  });

  it('draws a time by the year, and never drops a stamp the engine counted', () => {
    const p = profileOf('tls', 'checked_at', 'text');
    const years: ColumnAsk = { column: 'checked_at', ask: 'stamps', chars: 4 };
    const card = cardOf(p, years, [['2021', 3, 0], ['2024', 4, 1]]);
    expect(card.bars.map((b) => [b.label, b.rows, b.lit])).toEqual([['2021', 3, 0], ['2022', 0, 0], ['2023', 0, 0], ['2024', 4, 1]]);
    expect(card.bars[3]!.pick).toEqual({ column: 'checked_at', prefix: '2024' });
    expect(Number(rows(emitLit(TLS, card.bars[3]!.pick))[0]![1])).toBe(7);
    // An hour written with a T after its day is counted as it is written, between the hours either side of it.
    const hours: ColumnAsk = { column: 'checked_at', ask: 'stamps', chars: 13 };
    expect(cardOf(p, hours, [['2024-03-12T22', 2, 0], ['2024-03-13T00', 1, 0]]).bars.map((b) => [b.pick, b.rows])).toEqual([
      [{ column: 'checked_at', prefix: '2024-03-12T22' }, 2], [{ column: 'checked_at', prefix: '2024-03-12T23' }, 0], [{ column: 'checked_at', prefix: '2024-03-13T00' }, 1]]);
    // A stamp that is no time at all keeps its bar: nothing counted is left out.
    const odd = cardOf(p, { column: 'checked_at', ask: 'stamps', chars: 10 }, [['2024-03-11', 2, 0], ['2024-03-12', 1, 0], ['not a day', 1, 0]]);
    expect(odd.bars.map((b) => b.rows)).toEqual([2, 1, 1]);
  });

  it('ends a number’s bars on its largest value where that sits on a round edge, in a bin of its own', () => {
    // Scores from 60 to 100, most of them 100: the last bin is the 100s, named so, and the axis ends there.
    db.exec('CREATE TABLE scores(score REAL)');
    db.exec(`INSERT INTO scores VALUES ${[...Array.from({ length: 20 }, (_, i) => 60 + i * 2), ...Array(20).fill(100)].map((v) => `(${v})`).join(', ')}`);
    const p = profileOf('scores', 'score', 'real');
    const ask = askOf(p);
    expect(ask).toMatchObject({ ask: 'bins', lo: 60, width: 5 });
    const card = cardOf(p, ask, counted(ask, 'scores'));
    expect(card.bars.at(-1)).toMatchObject({ label: '100', rows: 20, pick: { column: 'score', from: 100, to: null } });
    expect(pickSaid(card.bars.at(-1)!.pick)).toBe('score is 100 or over');
    expect(card.axis).toEqual(['60', '100']);
    expect(card.over).toBeNull();
    expect(Number(rows(emitLit('SELECT * FROM scores', card.bars.at(-1)!.pick))[0]![1])).toBe(20);
  });

  it('names a value of nothing but spaces, so its bar has a name', () => {
    db.exec('CREATE TABLE notes(note TEXT)');
    db.exec(`INSERT INTO notes VALUES (''), (''), ('late'), ('  '), (NULL)`);
    const p = profileOf('notes', 'note', 'text');
    const ask = askOf(p);
    const card = cardOf(p, ask, counted(ask, 'notes'), { label: (v) => `<${String(v)}>` });
    expect(card.bars.map((b) => [b.label, b.rows])).toEqual([['(blank)', 2], ['(blank)', 1], ['<late>', 1]]);
    expect(card.empty).toMatchObject({ rows: 1 });
    expect(pickSaid(card.bars[0]!.pick)).toBe('note is (blank)');
    expect(Number(rows(emitLit('SELECT * FROM notes', card.bars[0]!.pick))[0]![1])).toBe(2);
  });

  it('says why there is nothing to chart', () => {
    const p = profileOf('ids', 'id', 'text');
    const card = cardOf(p, askOf(p), []);
    expect(card).toMatchObject({ bars: [], why: 'unique' });
    expect(cardSaid(card)).toBe('every row has one · every row its own value');
    const none = profileOf('ids', 'nothing', 'text');
    expect(cardSaid(cardOf(none, askOf(none), []))).toBe('empty: no row has a value');
  });
});

describe('the words', () => {
  it('names every stamp between two, and says each as a reader does', () => {
    expect(stampsBetween('2023-11', '2024-02', 7)).toEqual(['2023-11', '2023-12', '2024-01', '2024-02']);
    expect(stampsBetween('2024-02-28', '2024-03-01', 10)).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(stampsBetween('2024-03-12 22', '2024-03-13 01', 13)).toEqual(['2024-03-12 22', '2024-03-12 23', '2024-03-13 00', '2024-03-13 01']);
    expect(stampsBetween(undefined, undefined, 10)).toEqual([]);
    expect(stampsBetween('2019', '2022', 4)).toEqual(['2019', '2020', '2021', '2022']);
    expect([stampLabel('2024'), stampLabel('2024-03'), stampLabel('2024-03-12'), stampLabel('2024-03-12 14')]).toEqual(['2024', 'Mar 2024', 'Tue Mar 12', 'Tue 12, 14:00']);
    expect(pickSaid({ column: 'hired_on', prefix: '2019' })).toBe('hired_on in 2019');
  });

  it('says a pick, a share and the part lit', () => {
    expect(pickSaid({ column: 'status', value: 'fail' })).toBe('status is fail');
    expect(pickSaid({ column: 'status', value: 'fail' }, () => 'Failing')).toBe('status is Failing');
    expect(pickSaid({ column: 'status', value: null })).toBe('status is empty');
    expect(pickSaid({ column: 'days', from: 10, to: 20 })).toBe('days from 10 up to 20');
    expect(pickSaid({ column: 'days', from: 40, to: null })).toBe('days is 40 or over');
    expect(pickSaid({ column: 'days', from: null, to: 0 })).toBe('days under 0');
    expect(pickSaid({ column: 'checked_at', prefix: '2024-03-12' })).toBe('checked_at in Tue Mar 12');
    expect([shareSaid(0, 8), shareSaid(1, 800), shareSaid(799, 800), shareSaid(8, 8), shareSaid(2, 8), shareSaid(1, 0)]).toEqual(['0%', 'under 1%', 'over 99%', '100%', '25%', '0%']);
    expect(litSaid(2, 8)).toBe('2 of 8 rows (25%)');
    expect(samePick({ column: 'a', value: 1 }, { column: 'a', value: 1 })).toBe(true);
    expect(samePick({ column: 'a', value: 1 }, { column: 'a', value: '1' })).toBe(false);
    expect(samePick(null, null)).toBe(true);
  });
});

describe('how a dataset joins', () => {
  it('reads both sides of a join, and says each in a sentence', () => {
    const read = joinRead(rows(emitJoinMatch(TLS, 'app_id', APPS, 'id'))[0]!);
    expect(read).toEqual({ a: { rows: 8, blank: 1, matched: 3, keys: 7, keysMatched: 3 }, b: { rows: 7, blank: 0, matched: 3, keys: 6, keysMatched: 3 } });
    expect(joinSaid('tls', { dataset: 'apps', type: 'Application' }, read)).toEqual([
      "3 of 8 rows find their application in apps (38%): 5 don't, 1 of them with no application at all.",
      '3 of the 6 keys in apps have a row here (50%): 3 have none.',
    ]);
    const all = { a: { rows: 4, blank: 0, matched: 4, keys: 4, keysMatched: 4 }, b: { rows: 4, blank: 0, matched: 4, keys: 4, keysMatched: 4 } };
    expect(joinSaid('tls', { dataset: 'apps', type: null }, all)).toEqual(['All 4 rows of tls find their key in apps.', 'All 4 keys in apps have a row here.']);
    // Against the dataset its scope is counted against, each side says the scope.
    const scoped = joinRead(rows(emitJoinMatch(TLS, 'app_id', emitWhere(APPS, [['id', ['app-1', 'app-2', 'app-3', 'app-8']]]), 'id'))[0]!);
    expect(joinSaid('tls', { dataset: 'apps', type: 'Application' }, scoped, true)).toEqual([
      "3 of 8 rows find their application among those in scope in apps (38%): 5 don't, 1 of them with no application at all.",
      '3 of the 4 keys in scope in apps have a row here (75%): 1 has none.',
    ]);
    expect(joinSaid('tls', { dataset: 'apps', type: 'Application' }, all, true)).toEqual(['All 4 rows of tls find their application among those in scope in apps.', 'All 4 keys in scope in apps have a row here.']);
  });

  it('reads a match over the days a history keeps, from the scope each run counts', () => {
    const history = { days: ['2024-03-10', '2024-03-11', '2024-03-12'], gate: { scope: { out: [0, 2, 0], missing: [0, 24, 6], inScope: [600, 600, 600] } } };
    expect(matchDays(history)).toEqual([
      { day: '2024-03-10', covered: 1, out: 0, missing: 0, inScope: 600 },
      { day: '2024-03-11', covered: 0.96, out: 2, missing: 24, inScope: 600 },
      { day: '2024-03-12', covered: 0.99, out: 0, missing: 6, inScope: 600 },
    ]);
    expect(matchSaid(matchDays(history))).toBe('Over 3 days, between 96% and 100% of the keys in scope had a row; on the last, 99%.');
    expect(matchDays(history, 2).map((d) => d.day)).toEqual(['2024-03-11', '2024-03-12']);
    // As known on a day: the days after it aren't told, and the days counted back are from it.
    expect(matchDays(history, 31, '2024-03-11').map((d) => d.day)).toEqual(['2024-03-10', '2024-03-11']);
    expect(matchDays(history, 1, '2024-03-11').map((d) => d.day)).toEqual(['2024-03-11']);
    expect(matchDays(history, 31, '2024-03-09')).toEqual([]);
    expect(matchDays({ days: ['2024-03-10'] })).toEqual([]);
    expect(matchSaid([])).toBeNull();
    const steady = { days: ['a', 'b'], gate: { scope: { out: [0, 0], missing: [0, 0], inScope: [5, 5] } } };
    expect(matchSaid(matchDays(steady))).toBe('Over 2 days, 100% of the keys in scope had a row every day; on the last, 100%.');
  });
});

describe('Larkspur, explored', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);

  it('says what a row is from the ontology, and where nothing says', async () => {
    const doc = await loadFlowDir(dir);
    expect(rowSaid(doc, 'tls', 816)).toBe('One row is an application, for those where exposure is internet or partner and lifecycle is active or retiring: 816 rows, one for each app_id.');
    // The list of a type's objects is a row each, by the type's key.
    expect(rowSaid(doc, 'cmdb_apps', 2410)).toBe('One row is an application: 2,410 rows, one for each app_id.');
    expect(rowSaid(doc, 'hr_org_units', 1)).toBe('One row is an organisational unit: 1 row, one for each org_unit_id.');
    expect(rowSaid(doc, 'nothing_says', 12)).toBe('12 rows. Nothing in the ontology says what a row is yet.');
  });

  it('says what a flow gives of a file as the file is: its rows, filled and checked, are still the file’s', async () => {
    const doc = await loadFlowDir(dir);
    // tls is filled, then checked: what Evidence feeds gives is tls_checked.
    expect(rowsKeptFrom(doc, 'tls')).toBe('tls');
    expect(rowsKeptFrom(doc, 'tls_filled')).toBe('tls');
    expect(rowsKeptFrom(doc, 'tls_checked')).toBe('tls');
    expect(rowSaid(doc, 'tls_checked', 810)).toBe('One row is an application, for those where exposure is internet or partner and lifecycle is active or retiring: 810 rows, one for each app_id. As in tls, whose rows it keeps.');
    // A step that makes other rows of what it reads (a count by issuer, a join) keeps nothing: only what says it itself.
    const more = { ontology: doc.ontology, gates: doc.gates, steps: [...doc.steps, { id: 'tls_by_issuer', kind: 'aggregate', inputs: ['tls_checked'] }, { id: 'tls_or_waf', kind: 'expectations', inputs: ['tls', 'waf'] }] } as unknown as Parameters<typeof rowsKeptFrom>[0];
    expect(rowsKeptFrom(more, 'tls_by_issuer')).toBeNull();
    expect(rowsKeptFrom(more, 'tls_or_waf')).toBeNull();
    expect(rowSaid(more, 'tls_by_issuer', 3)).toBe('3 rows. Nothing in the ontology says what a row is yet.');
    expect(rowsKeptFrom(doc, 'nothing_says')).toBeNull();
    // It joins as the file does, by the same key, the file among the datasets it joins; its scope stays the file's.
    const partners = joinPartners(doc, 'tls_checked');
    expect(partners[0]).toMatchObject({ dataset: 'cmdb_apps', own: 'app_id', key: 'app_id', why: 'type', type: 'Application', leads: true });
    expect(partners.map((p) => p.dataset)).toContain('tls');
    expect(partners.map((p) => p.dataset)).not.toContain('tls_checked');
    expect(partners.some((p) => p.why === 'scope')).toBe(false);
  });

  it('joins a feed to the inventory its scope counts it against, and to the other datasets of applications', async () => {
    const doc = await loadFlowDir(dir);
    const partners = joinPartners(doc, 'tls');
    expect(partners[0]).toMatchObject({ dataset: 'cmdb_apps', own: 'app_id', key: 'app_id', why: 'scope', type: 'Application', leads: true });
    // Its list is counted without being asked; the other datasets of applications when opened.
    expect(partners.filter((p) => p.leads).map((p) => p.dataset)).toEqual(['cmdb_apps']);
    expect(partners.length).toBeGreaterThan(3);
    expect(partners.map((p) => p.dataset)).not.toContain('tls');
    expect(new Set(partners.map((p) => p.dataset)).size).toBe(partners.length);
    expect(partners.slice(1).every((p) => p.why === 'type' && p.type === 'Application')).toBe(true);
    // The inventory joins every dataset whose rows are its applications; a dataset nothing describes joins none.
    expect(joinPartners(doc, 'cmdb_apps').map((p) => p.dataset)).toContain('tls');
    expect(joinPartners(doc, 'nothing_says')).toEqual([]);
    expect(joinWhy('tls', partners[0]!)).toBe('What tls should cover is counted against it: each application in scope should have a row here.');
    expect(joinWhy('tls', partners[1]!)).toBe('Each row of both is an application.');
  });

  it('joins a type’s own dataset to the datasets the ontology’s links tie it to, each way, and never to itself', async () => {
    const doc = await loadFlowDir(dir);
    const links = (dataset: string) => joinPartners(doc, dataset).filter((p) => p.why === 'link');
    // An application is owned by a unit and runs on a platform: a column of the inventory names the other's key.
    expect(links('cmdb_apps')).toEqual([
      { dataset: 'hr_org_units', own: 'owner_team_id', key: 'org_unit_id', why: 'link', type: 'Organisational unit', loose: false, link: { name: 'Owned by', way: 'out' }, leads: true },
      { dataset: 'platforms', own: 'platform_id', key: 'platform_id', why: 'link', type: 'Platform', loose: false, link: { name: 'Runs on', way: 'out' }, leads: true },
    ]);
    // The units: the inventory's column names them (in), and their leader is a person (out). Reports into, a unit to
    // a unit, is no join to another dataset.
    expect(links('hr_org_units').map((p) => [p.dataset, p.own, p.key, p.link])).toEqual([
      ['cmdb_apps', 'org_unit_id', 'owner_team_id', { name: 'Owned by', way: 'in' }],
      ['hr_people', 'leader_id', 'person_id', { name: 'Led by', way: 'out' }],
    ]);
    expect(joinPartners(doc, 'hr_org_units').every((p) => p.dataset !== 'hr_org_units')).toBe(true);
    expect(joinWhy('cmdb_apps', links('cmdb_apps')[0]!)).toBe('Owned by: owner_team_id names an organisational unit in hr_org_units.');
    expect(joinWhy('hr_org_units', links('hr_org_units')[0]!)).toBe('Owned by, from cmdb_apps: its owner_team_id names a row here.');
    // A feed isn't the inventory: the links are the inventory's own columns, not a feed's.
    expect(links('tls')).toEqual([]);
  });

  it('says a link into a dataset by the rows that name it', () => {
    const read = { a: { rows: 420, blank: 0, matched: 176, keys: 420, keysMatched: 176 }, b: { rows: 2410, blank: 3, matched: 2400, keys: 180, keysMatched: 176 } };
    expect(joinSaid('hr_org_units', { dataset: 'cmdb_apps', type: 'Application', link: { name: 'Owned by', way: 'in' } }, read)).toEqual([
      "176 of 420 rows are named by a row of cmdb_apps (42%): 244 aren't.",
      "2,400 of the 2,410 rows of cmdb_apps name a row here (over 99%): 10 don't, 3 of them naming none at all.",
    ]);
    const all = { a: { rows: 2, blank: 0, matched: 2, keys: 2, keysMatched: 2 }, b: { rows: 5, blank: 0, matched: 5, keys: 2, keysMatched: 2 } };
    expect(joinSaid('units', { dataset: 'apps', type: null, link: { name: 'Owned by', way: 'in' } }, all)).toEqual(['All 2 rows of units are named by a row of apps.', 'All 5 rows of apps name a row here.']);
  });
});
