/**
 * A bronze file's quality as one list of checks (ADR 0015 amendment 2, Q-160): the ontology's checks with the Ontology
 * page's ids, the file's contract and what is learned, each with its state from the day's findings; a rule people set is
 * a check like the others, judged by the rows its check step counted.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { DataBindings } from '../examples/sources.js';
import { bronzeOf, CHECK_OF_KIND, verdictSaid } from '../src/core/bronze.js';
import { gateChecksOf } from '../src/core/gates.js';
import type { Finding } from '../src/core/news.js';
import { ontologyPage, type FileSection } from '../src/core/ontologypage.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const estateDir = new URL('../examples/control-estate/', import.meta.url);
const columnsIn = (dir: URL) => {
  const data = JSON.parse(readFileSync(new URL('data.json', dir), 'utf8')) as DataBindings;
  return (file: string) => data.sources[file]?.columns?.map(([name]) => name);
};
const finding = (f: Partial<Finding> & Pick<Finding, 'kind' | 'severity'>): Finding => ({ key: `${f.kind}:${f.columns?.join(',') ?? ''}`, score: 1, title: f.kind, detail: '', look: 'news', acts: [], ...f }) as Finding;

describe('the estate’s waf on Tue Mar 12', () => {
  const setup = async () => {
    const doc = await loadFlowDir(estateDir);
    const section = ontologyPage(doc, columnsIn(estateDir)).files.find((f) => f.id === 'waf') as FileSection;
    return { doc, section, gate: gateChecksOf(doc, 'waf') };
  };

  it('lists every check the Ontology page lists for the file, with the same ids, then the contract and what is learned', async () => {
    const { section, gate } = await setup();
    const b = bronzeOf(section, gate, [], { judged: true });
    const page = [...section.rules, ...(section.columns ?? []).flatMap((c) => c.rules)].map((r) => r.id);
    expect(b.checks.filter((c) => c.from === 'ontology').map((c) => c.id)).toEqual(page);
    expect(page.length).toBe(section.count);
    expect(b.checks.filter((c) => c.from === 'contract').map((c) => c.check)).toEqual(['schema', 'amount', 'blanks']);
    expect(b.checks.filter((c) => c.from === 'learned').map((c) => c.check)).toEqual(['shares', 'shape', 'hours', 'pairs', 'forest', 'classifier']);
    for (const c of b.checks.filter((x) => x.from === 'ontology')) expect(c.check).toBe(CHECK_OF_KIND[c.kind as keyof typeof CHECK_OF_KIND]);
    expect(b.verdict).toBe('clean');
    expect(verdictSaid(b)).toMatch(/^No quality issues: \d+ checks passed$/);
  });

  it('puts the status band missed on the ontology’s band check, holds the day, and the learned warnings beside it', async () => {
    const { section, gate } = await setup();
    const band = section.columns!.flatMap((c) => c.rules).find((r) => r.kind === 'band')!;
    const [, col, rest] = /^waf\/([^/]+)\/band=(.*)$/.exec(band.id)!;
    const findings = [
      finding({ kind: 'band', severity: 'alert', columns: [col!], values: [JSON.stringify(rest)], title: 'Status fail: 59.6% (band 0%–15%)', score: 9 }),
      finding({ kind: 'share', severity: 'warn', columns: ['mode'], values: ['"off"'], title: 'Mode off: 33% (usually 2.5%)', score: 4, check: 'shares' }),
      finding({ kind: 'apart', severity: 'warn', title: 'Rows unlike earlier days: AUC 0.77', score: 2, check: 'classifier' }),
    ];
    const b = bronzeOf(section, gate, findings, { judged: true });
    expect(b.verdict).toBe('hold');
    expect(b.wrong.map((c) => c.id)).toEqual([band.id]);
    expect(b.wrong[0]!.findings[0]!.title).toMatch(/^Status fail/);
    expect(b.unusual.map((c) => c.check)).toEqual(['shares', 'classifier']);
    expect(verdictSaid(b)).toBe('1 issue and 2 things to look at: the day is held');
  });

  it('says off for a check the gate switches off, and unjudged for a day with no history', async () => {
    const { doc, section } = await setup();
    const gate = { ...gateChecksOf(doc, 'waf')!, shares: 'off' as const };
    const b = bronzeOf(section, gate, [finding({ kind: 'share', severity: 'warn', columns: ['mode'], values: ['"off"'], check: 'shares' })], { judged: true });
    expect(b.checks.find((c) => c.id === 'waf/~shares')).toMatchObject({ state: 'off', why: 'switched off in the notebook' });
    expect(b.verdict).toBe('clean');
    const none = bronzeOf(section, gate, [], { judged: false });
    expect(none.verdict).toBe('unjudged');
    expect(verdictSaid(none)).toBe('Not judged yet: no history for this day');
  });
});

describe('a rule people set is a check', () => {
  it('judges the sign-ins’ set checks by the rows their check step counted', async () => {
    const doc = await loadFlowDir(signinsDir);
    const section = ontologyPage(doc).files.find((f) => f.columns?.some((c) => c.rules.some((r) => r.kind === 'set')) || f.rules.some((r) => r.kind === 'set'))!;
    const sets = [...section.rules, ...(section.columns ?? []).flatMap((c) => c.rules)].filter((r) => r.kind === 'set');
    expect(sets.length).toBeGreaterThan(0);
    const counted = new Map(sets.map((r, k) => [r.def!.id, k === 0 ? 12 : 0] as const));
    const b = bronzeOf(section, gateChecksOf(doc, section.id), [], { judged: true, counted });
    const first = b.checks.find((c) => c.id === sets[0]!.id)!;
    expect(first).toMatchObject({ kind: 'set', check: 'rules', failed: 12, state: sets[0]!.def!.action === 'hold' ? 'alert' : 'warn' });
    for (const r of sets.slice(1)) expect(b.checks.find((c) => c.id === r.id)).toMatchObject({ state: r.unchecked ? 'off' : 'ok' });
  });
});
