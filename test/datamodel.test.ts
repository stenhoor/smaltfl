/**
 * The Data model's map (ADR 0028 §9): the kinds, files, joins and relations read from a flow's document, its data list's
 * columns and its display file (core/datamodel.ts), on Larkspur as the tour and the planted month draw it.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dataModelOf, dataModelProblems, dayOfCell, iconFor, isDataModelFile, plainName, usualOf, type DataModelFile } from '../src/core/datamodel.js';
import { loadFlowDir } from './helpers/notebooks.js';

const dir = new URL('../examples/larkspur/', import.meta.url);
const list = JSON.parse(readFileSync(new URL('data.json', dir), 'utf8')) as { sources: Record<string, { columns: [string, string][]; file?: string }> };
const display = JSON.parse(readFileSync(new URL('datamodel.json', dir), 'utf8')) as DataModelFile;
const fixed = new Set(['control_catalog', 'control_requirements', 'platforms', 'platform_links']);
const inputs = (withDisplay: boolean) => ({ columns: (s: string) => list.sources[s]?.columns, daily: new Set(Object.keys(list.sources).filter((s) => !fixed.has(s))), display: withDisplay ? display : null });

describe('the display file', () => {
  it("is Larkspur's, good, and refused where it isn't one", () => {
    expect(dataModelProblems(display)).toEqual([]);
    expect(isDataModelFile({ format: 'smaltfl-datamodel/1', kinds: { x: { icon: 'rocket' } } })).toBe(false);
    expect(dataModelProblems({ format: 'smaltfl-datamodel/0', more: 1, joins: [{ from: 'a' }] })).toEqual([
      'format is "smaltfl-datamodel/0", not smaltfl-datamodel/1',
      'no field more',
      'joins[0] needs from, col, to, toCol and rel',
    ]);
  });
});

describe("Larkspur's map", async () => {
  const doc = await loadFlowDir(dir);

  it('draws its five kinds, each with the files that describe it, its own first', () => {
    const m = dataModelOf(doc, inputs(true));
    expect(m.kinds.map((k) => [k.id, k.icon, k.plural, k.datasets[0], k.datasets.length])).toEqual([
      ['org_unit', 'org', 'units', 'hr_org_units', 1],
      ['person', 'person', 'people', 'hr_people', 1],
      ['application', 'app', 'applications', 'cmdb_apps', 14],
      ['platform', 'platform', 'platforms', 'platforms', 3],
      ['control', 'control', 'controls', 'control_catalog', 3],
    ]);
  });

  it('ties a file the ontology ties to no kind to the narrower kind whose key it carries, or to its flow’s', () => {
    // Without the display file: exceptions carry an application and a control, mappings a control, links a platform.
    const m = dataModelOf(doc, inputs(false));
    const kind = (id: string) => m.datasets.find((d) => d.id === id)?.kind;
    expect([kind('exceptions'), kind('control_requirements'), kind('platform_links'), kind('cloud_assets'), kind('findings')]).toEqual(['control', 'control', 'platform', 'platform', 'application']);
  });

  it('says what one row is, what each file builds and what it is evidence for', () => {
    const m = dataModelOf(doc, inputs(true));
    const ar = m.datasets.find((d) => d.id === 'access_reviews')!;
    expect(ar.short).toBe('Access reviews');
    expect(ar.flow).toBe('Evidence feeds');
    expect(ar.one).toBe('one application: data class card data or personal data or confidential · lifecycle live or retiring');
    expect(ar.builds).toHaveLength(11);
    expect([ar.control, ar.controlName]).toEqual(['access_review', 'Quarterly access review']);
    expect(ar.columns.find((c) => c.name === 'app_id')?.role).toBe('key');
    expect(ar.checks.map((c) => c.says)).toContain('One row per application in scope');
    expect(m.datasets.find((d) => d.id === 'control_catalog')?.fixed).toBe(true);
    // Nothing of the day until the page adds it.
    expect([ar.rowsToday, ar.state, ar.days]).toEqual([null, 'none', []]);
  });

  it('joins kinds by the relations the ontology names, the display file’s, the keys files carry and their evidence', () => {
    const m = dataModelOf(doc, inputs(true));
    const rel = (from: string, to: string) => m.relations.filter((r) => r.from === from && r.to === to).map((r) => `${r.name}: ${r.label}`);
    expect(rel('application', 'org_unit')).toEqual(['owned by: owned by']);
    expect(rel('person', 'org_unit')).toEqual(['works in: works in']);
    expect(rel('control', 'person')).toEqual(['approved by: Exceptions approved by a person']);
    expect(rel('platform', 'application')).toEqual(['tagged with: Cloud assets tagged with an application']);
    expect(rel('application', 'control')).toEqual(['evidence for: evidence for · 13 datasets']);
    expect(rel('application', 'application')).toEqual(['about: 13 datasets name an application']);
    expect(m.outputs).toHaveLength(40);
  });
});

describe('the day, as the page adds it', () => {
  it('marks a held day as waiting until decided, and says a day with no run is none', () => {
    expect([dayOfCell('held', true), dayOfCell('held', false), dayOfCell('refused', true), dayOfCell('unusual', false), dayOfCell('unlearned', false), dayOfCell('ok', false), dayOfCell('absent', false), dayOfCell(null, false)])
      .toEqual(['waiting', 'decided', 'waiting', 'warn', 'note', 'ok', null, null]);
  });

  it('reads a usual range from three days or more', () => {
    expect(usualOf([10, null])).toBeNull();
    expect(usualOf([1433, 1434, 1435, 1436, 1437, null, 1438])).toEqual([1434, 1438]);
  });

  it('names an id as people read it and gives each kind an icon', () => {
    expect([plainName('pentest_schedule'), plainName('edr_coverage'), plainName('hr_org_units')]).toEqual(['Pentest schedule', 'EDR coverage', 'HR org units']);
    expect([iconFor({ id: 'vendor', name: 'Supplier' }), iconFor({ id: 'zzz', name: 'Thing' })]).toEqual(['vendor', 'box']);
  });
});

describe('a flow whose ontology names no kinds of thing', () => {
  it('draws its file in a kind of its own, called by what its rows are', async () => {
    const doc = await loadFlowDir(new URL('../examples/security-signins/', import.meta.url));
    const signins = JSON.parse(readFileSync(new URL('../examples/security-signins/data.json', import.meta.url), 'utf8')) as { sources: Record<string, { columns: [string, string][] }> };
    const m = dataModelOf(doc, { columns: (s) => signins.sources[s]?.columns, daily: new Set(['auth']) });
    expect(m.kinds.map((k) => [k.id, k.datasets])).toEqual([['files', ['auth']]]);
    expect(m.datasets.map((d) => d.kind)).toEqual(['files']);
  });
});
