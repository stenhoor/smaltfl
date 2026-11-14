// Columns that change (ADR 0022 §2; Q-109, Q-146, Q-203, Q-204): a file's header against its source's columns.
import { describe, expect, it } from 'vitest';
import { columnChange, columnChangeSaid, columnsHold, csvColumn, csvHeader, csvRecords, editDistance, familiesAgree, familyOf, inferFamily, namesClose, wordsOf } from '../src/core/columns.js';

const DECLARED: [string, string][] = [['app_id', 'TEXT'], ['customer_id', 'TEXT'], ['region', 'TEXT'], ['amount', 'REAL'], ['seen_at', 'TIMESTAMP']];

describe('reading a CSV file', () => {
  it('reads records with quoted fields, doubled quotes, line breaks in quotes and CRLF', () => {
    const text = 'a,"b, c","say ""hi"""\r\n1,"two\nlines",3\n\n4,,6';
    expect(csvRecords(text)).toEqual([['a', 'b, c', 'say "hi"'], ['1', 'two\nlines', '3'], ['4', '', '6']]);
    expect(csvRecords(text, {}, 1)).toEqual([['a', 'b, c', 'say "hi"']]);
    expect(csvRecords('x;y\n1;2', { delimiter: ';' })).toEqual([['x', 'y'], ['1', '2']]);
  });

  it('reads a header, trimmed, and a column by its name in any case', () => {
    expect(csvHeader(' app_id , Region\nA1,east\n')).toEqual(['app_id', 'Region']);
    expect(csvHeader('')).toEqual([]);
    expect(csvColumn('app_id,Region\nA1,east\nA2,\nA3,west', 'region')).toEqual(['east', null, 'west']);
    expect(csvColumn('app_id\nA1', 'nothing')).toEqual([]);
  });
});

describe('telling columns apart', () => {
  it('reads a declared type as a family, and a column\'s values as the narrowest that fits them', () => {
    expect(['INTEGER', 'BIGINT', 'REAL', 'DOUBLE', 'DECIMAL(10,2)', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'TEXT', 'VARCHAR'].map(familyOf)).toEqual(['integer', 'integer', 'number', 'number', 'number', 'time', 'time', 'boolean', 'text', 'text']);
    expect(inferFamily(['1', '-2', null, ''])).toBe('integer');
    expect(inferFamily(['1', '2.5', '1e3'])).toBe('number');
    expect(inferFamily(['2024-03-01', '2024-03-02T05:25:00Z'])).toBe('time');
    expect(inferFamily(['true', 'FALSE'])).toBe('boolean');
    expect(inferFamily(['east', '1'])).toBe('text');
    expect(inferFamily([null, ''])).toBeNull();
    // Text holds codes that read as whole numbers, and a number column whole numbers; a time is never text.
    expect([familiesAgree('text', 'integer'), familiesAgree('number', 'integer'), familiesAgree('time', 'text'), familiesAgree('integer', 'number'), familiesAgree('text', null)]).toEqual([true, true, false, false, true]);
  });

  it('calls names close when they have the same words, or a letter or two apart, short ones closer', () => {
    expect(wordsOf('CustomerID')).toEqual(['customer', 'id']);
    expect(wordsOf('customer-id.v2')).toEqual(['customer', 'id', 'v2']);
    expect(editDistance('kitten', 'sitting')).toBe(3);
    expect(editDistance('abc', 'abcdefgh', 2)).toBe(3);
    expect(namesClose('CustomerID', 'customer_id')).toBe(true);
    expect(namesClose('id_customer', 'customer_id')).toBe(true);
    expect(namesClose('custmer_id', 'customer_id')).toBe(true);
    expect(namesClose('regon', 'region')).toBe(true);
    expect(namesClose('cust_id', 'customer_id')).toBe(false);
    expect(namesClose('ip', 'id')).toBe(false);
    expect(namesClose('zone', 'done')).toBe(true);
    expect(namesClose('zone_ref', 'region')).toBe(false);
  });
});

describe('a file\'s columns against its source\'s (Q-109, Q-146, Q-203, Q-204)', () => {
  const header = ['app_id', 'customer_id', 'region', 'amount', 'seen_at'];

  it('finds nothing when the header has every declared column, whatever its case and order', () => {
    const c = columnChange(DECLARED, ['SEEN_AT', 'App_ID', 'customer_id', 'region', 'amount']);
    expect(c).toEqual({ gone: [], added: [], maps: [] });
    expect(columnsHold(c)).toBe(false);
    expect(columnChangeSaid(c)).toBe('');
  });

  it('notes a new column with nothing gone, and doesn\'t hold the day for it (Q-204)', () => {
    const c = columnChange(DECLARED, [...header, 'notes']);
    expect(c).toEqual({ gone: [], added: ['notes'], maps: [] });
    expect(columnsHold(c)).toBe(false);
    expect(columnChangeSaid(c)).toBe('a new column: notes');
    expect(columnChangeSaid(columnChange(DECLARED, [...header, 'notes', 'tier']))).toBe('new columns: notes and tier');
  });

  it('holds a gone column, and says so', () => {
    const c = columnChange(DECLARED, header.filter((h) => h !== 'region'));
    expect(c).toEqual({ gone: ['region'], added: [], maps: [] });
    expect(columnsHold(c)).toBe(true);
    expect(columnChangeSaid(c)).toBe('region is gone');
  });

  it('suggests a mapping by name and type where the gone column has no history of its values', () => {
    const c = columnChange(DECLARED, header.map((h) => (h === 'customer_id' ? 'CustomerID' : h)), { today: () => ['C-1', 'C-2'] });
    expect(c).toEqual({ gone: [], added: [], maps: [{ from: 'CustomerID', to: 'customer_id', by: ['name', 'type'], share: null }] });
    expect(columnsHold(c)).toBe(true);
    expect(columnChangeSaid(c)).toBe('customer_id is gone and CustomerID is new: CustomerID looks like customer_id (its name and type)');
  });

  it('suggests it by its values too where the history has them, and not where most of them are new', () => {
    const seen = (col: string) => (col === 'region' ? ['east', 'west', 'north'] : undefined);
    const renamed = header.map((h) => (h === 'region' ? 'regon' : h));
    const yes = columnChange(DECLARED, renamed, { history: seen, today: (col) => (col === 'regon' ? ['east', 'west', 'west', 'south', null] : []) });
    expect(yes.maps).toEqual([{ from: 'regon', to: 'region', by: ['name', 'type', 'values'], share: 0.75 }]);
    expect(columnChangeSaid(yes)).toBe('region is gone and regon is new: regon looks like region (its name, type and 75% of its values)');
    const no = columnChange(DECLARED, renamed, { history: seen, today: () => ['pacific', 'atlantic', 'east'] });
    expect(no).toEqual({ gone: ['region'], added: ['regon'], maps: [] });
    expect(columnChangeSaid(no)).toBe("region is gone; can't tell why regon is new");
  });

  it('suggests nothing where the names aren\'t close or the types disagree, and says it can\'t tell', () => {
    const far = columnChange(DECLARED, header.map((h) => (h === 'customer_id' ? 'cust_ref' : h)), { today: () => ['C-1'] });
    expect(far).toEqual({ gone: ['customer_id'], added: ['cust_ref'], maps: [] });
    expect(columnChangeSaid(far)).toBe("customer_id is gone; can't tell why cust_ref is new");
    // A timestamp column renamed close, holding words now: not the same column.
    const typed = columnChange(DECLARED, header.map((h) => (h === 'seen_at' ? 'seenat' : h)), { today: () => ['yesterday', 'today'] });
    expect(typed.maps).toEqual([]);
    expect(typed.gone).toEqual(['seen_at']);
  });

  it('maps each column once, the best evidence first', () => {
    // Two new columns close to customer_id: the one whose values the history saw wins.
    const c = columnChange([['customer_id', 'TEXT'], ['region', 'TEXT']], ['custmer_id', 'customer_ids', 'region'], {
      history: (col) => (col === 'customer_id' ? ['C-1', 'C-2'] : undefined),
      today: (col) => (col === 'customer_ids' ? ['C-1', 'C-2'] : col === 'custmer_id' ? ['C-1', 'X-9', 'X-8'] : []),
    });
    expect(c.maps).toEqual([{ from: 'customer_ids', to: 'customer_id', by: ['name', 'type', 'values'], share: 1 }]);
    expect(c.added).toEqual(['custmer_id']);
    expect(columnChangeSaid(c)).toBe("customer_id is gone and customer_ids is new: customer_ids looks like customer_id (its name, type and 100% of its values); can't tell why custmer_id is new");
  });
});
