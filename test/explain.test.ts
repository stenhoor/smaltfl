/**
 * The bronze notebook explained and the columns told (ADR 0015 amendment 3): every note is made from the flow and the day
 * alone, so any dataset gets the same notes with its own names; the models are said with how strong, what against and
 * what they are not; a column's role and gist are read from its values.
 */
import { describe, expect, it } from 'vitest';
import { apartSaid, CHECK_EXPLAINED, columnGist, columnRole, gateNote, issueNote, rulesNote, sourceNote, timesTogether, unlikeSaid } from '../src/core/explain.js';
import { CHECK_NAMES, gateChecksOf } from '../src/core/gates.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const estateDir = new URL('../examples/control-estate/', import.meta.url);

describe('the notebook’s notes', () => {
  it.each([['the estate', estateDir, 'waf'], ['the sign-ins', signinsDir, null]] as const)('explain %s’s file in its own names, and no other dataset’s', async (_n, dir, pick) => {
    const doc = await loadFlowDir(dir);
    const file = pick ?? doc.sources.find((s) => gateChecksOf(doc, s.id))?.id ?? doc.sources[0]!.id;
    const columns = ['a_col', 'b_col', 'c_col'];
    const notes = [
      sourceNote({ file, day: 'Tue Mar 12', rows: 203, columns }),
      gateNote({ file, layer: 'bronze', modes: gateChecksOf(doc, file) ?? {}, verdict: 'No quality issues' }),
      rulesNote({ step: `${file}_checked`, rules: [{ name: 'r1', check: 'x IS NOT NULL', onFail: 'drop' }], failed: new Map([['r1', 4]]), rows: 200, maxDropped: 0.05 }),
    ].join('\n');
    expect(notes).toContain(`\`${file}\``);
    for (const c of columns) expect(notes).toContain(`\`${c}\``);
    expect(notes).toMatch(/Today 4 rows break it\*\* \(2%\)/);
    expect(notes).toMatch(/more than 5% of rows are dropped/);
    // Nothing about any one dataset.
    expect(notes).not.toMatch(/trips|taxi|application|sign-in/i);
  });

  it('says every check in plain words, and what each mode does', () => {
    for (const c of CHECK_NAMES) {
      expect(CHECK_EXPLAINED[c].what.length).toBeGreaterThan(10);
      expect(issueNote({ title: 'T', check: c, mode: 'warn', state: 'warn', query: 'rows' })).toMatch(new RegExp(`The \\*\\*${c}\\*\\* check: .+ It warns\\.`));
    }
    expect(issueNote({ title: 'T', check: 'values', column: 'status', mode: 'hold', state: 'alert', query: 'counts' })).toMatch(/holds the day\.[\s\S]*each value of `status`/);
  });

  it('writes a column called * or with backticks as itself', () => {
    expect(sourceNote({ file: 'f', columns: ['*', 'a`b'] })).toContain('`*`, `aˋb`');
  });
});

describe('the models, said honestly', () => {
  it('matches the classifier’s words to its number, says it as a frequency, and says what it is not', () => {
    const s = apartSaid({ auc: 0.77, floor: 0.55, n: 200, days: 17, columns: [{ column: 'mode', share: 0.9 }, { column: 'age', share: 0.1 }] }, (c) => c.toUpperCase());
    expect(s.strength).toBe('noticeably different');
    expect(s.frequency).toMatch(/right 77 times in 100; guessing gets 50\./);
    expect(s.against).toBe('Compared with 200 rows a side: today’s, and rows of 17 like days before it.');
    expect(s.why).toBe('What makes it different: MODE (90%) and AGE (10%).');
    expect(s.caveat).toMatch(/isn’t necessarily wrong/);
    expect(apartSaid({ auc: 0.95, floor: 0.5, n: 30, days: 1, columns: [] }).strength).toBe('clearly different');
    expect(apartSaid({ auc: 0.55, floor: 0.5, n: 30, days: 1, columns: [] }).why).toBeNull();
  });

  it('places the forest’s day against the oddest day it learned from', () => {
    expect(unlikeSaid({ score: 0.71, highest: 0.58, days: 40, numbers: ['rows 900 (usually 600)'] }).strength).toBe('clearly unlike the days before');
    expect(unlikeSaid({ score: 0.6, highest: 0.58, days: 40, numbers: [] }).strength).toBe('a little unlike the days before');
  });

  it('says a pair’s log odds as times as often', () => {
    expect(timesTogether(Math.log(3.2))).toBe('3.2×');
    expect(timesTogether(Math.log(25))).toBe('25×');
    expect(timesTogether(Math.log(0.5))).toBe('2.0× less');
  });
});

describe('a column’s role and gist', () => {
  const p = (o: Partial<Parameters<typeof columnRole>[0]> & Pick<Parameters<typeof columnRole>[0], 'kind'>) => ({ name: 'c', facts: { rows: 100, present: 100, distinct: 3, min: null, max: null }, ...o });
  it('reads what a column is from its values and the ontology’s key', () => {
    expect(columnRole(p({ kind: 'category' }), 'the file’s key')).toBe('key');
    expect(columnRole(p({ kind: 'text', facts: { rows: 100, present: 100, distinct: 100, min: null, max: null } }), null)).toBe('id');
    expect(columnRole(p({ kind: 'category', facts: { rows: 100, present: 100, distinct: 2, min: null, max: null } }), null)).toBe('flag');
    expect(columnRole(p({ kind: 'measure' }), null)).toBe('number');
    expect(columnRole(p({ kind: 'time', facts: { rows: 1, present: 1, distinct: 1, min: '2024-01-01', max: '2024-01-31' } }), null)).toBe('date');
    expect(columnRole(p({ kind: 'empty', facts: { rows: 10, present: 0, distinct: 0, min: null, max: null } }), null)).toBe('empty');
  });
  it('says it in a line, with its blanks', () => {
    const cat = p({ kind: 'category', facts: { rows: 100, present: 90, distinct: 3, min: null, max: null }, top: [{ value: 'aws', share: 0.5 }, { value: 'gcp', share: 0.3 }, { value: 'f5', share: 0.2 }] });
    expect(columnGist(cat, 'category')).toBe('One of 3 values, most often aws (50%), gcp (30%) and f5 (20%). 10% of rows leave it blank.');
    const num = p({ kind: 'measure', facts: { rows: 10, present: 10, distinct: 10, min: 1, max: 300 }, quantiles: { p25: 20, p50: 40, p75: 90 } });
    expect(columnGist(num, 'number')).toBe('A number from 1 to 300; half of rows fall between 20 and 90.');
  });
});

describe('round 2: no statistics on the face', () => {
  it('says a quantile as 1 in N above or below, in the column’s unit', async () => {
    const { quantileSaid, apartForColumn, differenceStep } = await import('../src/core/explain.js');
    expect(quantileSaid(0.9, 'latency', 'sign-ins', '341 ms', '420 ms', '600 ms')).toBe('The highest 1 in 10 sign-ins by latency start at 341 ms today; usually they start at 420–600 ms.');
    expect(quantileSaid(0.5, 'age', 'apps', '40', '30', '50')).toBe('Half of apps have age above 40 today; usually half are above 30–50.');
    expect(quantileSaid(0.1, 'size', 'rows', '2', '2', '2')).toBe('The lowest 1 in 10 rows by size end at 2 today; usually they end at 2.');
    expect(differenceStep(0.9)).toBe(3);
    expect(differenceStep(0.55)).toBe(0);
    const a = apartForColumn({ auc: 0.9, columns: [{ column: 'client', share: 0.6 }, { column: 'latency', share: 0.31 }] }, 'latency_ms', 'sign-ins', 'Latency');
    expect(a.head).toBe('Today’s sign-ins look very different from earlier days.');
    expect(a.part).toBeNull();
    expect(apartForColumn({ auc: 0.8, columns: [{ column: 'client', share: 0.6 }, { column: 'latency', share: 0.31 }] }, 'latency', 'sign-ins', 'Latency').part).toBe('Latency is part of the reason: it explains about a third of why today stands out.');
  });
});
