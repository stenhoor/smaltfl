/**
 * What a step after the files did, told for anyone (ADR 0015 amendment 4): from the run's counts and the plan alone, for
 * any flow. Rows left out are said only where they were (a join's unmatched rows, a filter, a check, a row-for-row query
 * with a condition): a query that adds rows up is never said to have left them out.
 */
import { describe, expect, it } from 'vitest';
import { msSaid, opDoes, sqlDoes, stepStory, usualMs, usualRows, type StepFacts } from '../src/core/silver.js';

const base = (o: Partial<StepFacts>): StepFacts => ({ op: 'sql', origin: 'step', inputs: [{ name: 'a', rows: 100 }], rowsOut: 100, added: [], removed: [], replaced: [], ...o });

describe('a step’s story', () => {
  it('says a join’s unmatched rows: left out by an inner join, kept blank by a left one, and rows matched twice', () => {
    const inner = stepStory(base({ op: 'join', inputs: [{ name: 'orders', rows: 100 }, { name: 'customers', rows: 40 }], rowsOut: 90, join: { how: 'inner', on: [['customer_id', 'id']], unmatched: 10 } }));
    expect(inner.head).toBe('10 of 100 rows found no match in customers and were left out; 90 rows came out.');
    expect(inner.flow!.lost).toEqual([{ why: 'no match in customers', rows: 10 }]);
    expect(inner.does).toMatch(/^Matches each row of orders with customers by customer_id = id, and adds its columns\. A row with no match is left out\.$/);
    const left = stepStory(base({ op: 'join', inputs: [{ name: 'orders', rows: 100 }, { name: 'customers', rows: 40 }], rowsOut: 103, join: { how: 'left', on: [['id', 'id']], unmatched: 4 } }));
    expect(left.head).toBe('4 of 100 rows found no match in customers: they were kept, with its columns blank. 103 rows came out. Some matched more than once, adding 3.');
    expect(left.flow!.lost).toEqual([]);
    expect(left.flow!.gained).toBe(3);
  });

  it('says a filter’s and a check’s rows left out, with the share and the limit', () => {
    const f = stepStory(base({ op: 'filter', rowsOut: 80, filter: { where: "status = 'active'" } }));
    expect(f.head).toBe("80 rows of 100 kept; 20 (20%) left out where status = 'active' isn’t true.");
    const e = stepStory(base({ op: 'expect', rowsOut: 97, expect: { dropped: 3, flagged: 5, rules: [], maxDropped: 0.05 } }));
    expect(e.head).toBe('3 of 100 rows broke a rule and were left out (3%; the limit is 5%). 5 were flagged and kept.');
  });

  it('never says a query that adds rows up left them out, with or without GROUP BY', () => {
    const grouped = stepStory(base({ rowsOut: 6, sql: 'SELECT unit, count(*) FROM a GROUP BY unit' }));
    expect(grouped.head).toBe('100 rows were added up into 6 rows: nothing left out, each row counted in a total.');
    expect(grouped.flow!.lost).toEqual([]);
    const unioned = stepStory(base({ rowsOut: 12, sql: "SELECT 'x' AS c, count(x) FROM a UNION ALL SELECT 'y', count(y) FROM a" }));
    expect(unioned.flow!.lost).toEqual([]);
    expect(unioned.head).toMatch(/added up into 12 rows/);
    // A query with a join and fewer rows out is said as it is: in and out, nothing guessed.
    const joined = stepStory(base({ inputs: [{ name: 'a', rows: 100 }, { name: 'b', rows: 5 }], rowsOut: 90, sql: 'SELECT * FROM a JOIN b ON a.k = b.k' }));
    expect(joined.head).toBe('100 rows in, 90 rows out.');
    expect(joined.flow!.lost).toEqual([]);
    // A row-for-row query with a condition left rows out.
    expect(stepStory(base({ rowsOut: 70, sql: 'SELECT * FROM a WHERE x > 1' })).flow!.lost).toEqual([{ why: 'left out by the query', rows: 30 }]);
  });

  it('says the columns changed, the time against its usual, and the rows against the earlier days', () => {
    const s = stepStory(base({ added: ['score', 'standing'], removed: ['tmp'], ms: 400, usual: { rows: [95, 105], ms: 20, days: 6 }, sql: 'SELECT *, 1 AS score FROM a' }));
    expect(s.columns).toBe('Adds score and standing; drops tmp.');
    expect(s.time).toBe('Took 400 ms, much longer than its usual 20 ms.');
    expect(s.usual).toBe('As usual: 95–105 on the 6 earlier days run here.');
    expect(s.does).toBe('A query that reads a row for row and works out score and standing for each.');
    expect(stepStory(base({ rowsOut: 50, usual: { rows: [95, 105], ms: null, days: 2 } })).usual).toBe('Fewer than usual: 50 today, 95–105 on the 2 earlier days run here.');
    expect(stepStory(base({})).usual).toBe('No earlier days run to compare with yet.');
    expect(stepStory(base({ status: 'reused' })).time).toMatch(/^Not built again/);
  });

  it('says a step closed to the viewer as such, with no picture', () => {
    const s = stepStory(base({ rowsOut: null }));
    expect(s.head).toMatch(/closed to you/);
    expect(s.flow).toBeNull();
  });
});

describe('the helpers', () => {
  it('reads what a query does from its text, ignoring strings and comments', () => {
    expect(sqlDoes("SELECT 'GROUP BY' FROM a -- JOIN b")).toMatchObject({ joins: false, groups: false });
    expect(sqlDoes('select * from a left join b on true where x group by y')).toMatchObject({ joins: true, outer: true, groups: true, where: true });
    expect(sqlDoes('SELECT sum(x) OVER (PARTITION BY y) FROM a').sums).toBe(false);
    expect(opDoes({ op: 'aggregate', inputs: [{ name: 'a', rows: 1 }], aggregate: { groupBy: ['unit'], measures: ['n'] } })).toBe('Groups the rows by unit and works out n for each group.');
  });
  it('says times, usual rows and usual time', () => {
    expect(msSaid(0.4)).toBe('under 1 ms');
    expect(msSaid(1234)).toBe('1.2 s');
    expect(usualRows([5, 9, 7])).toEqual([5, 9]);
    expect(usualMs([30, 10, 20])).toBe(20);
    expect(usualRows([])).toBeNull();
  });
});
