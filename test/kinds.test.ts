/**
 * Kinds, relations and meanings over time (ADR 0027 §3, §2; Q-250, Q-251, Q-264, Q-265): the ontology's kinds of
 * thing, its relations, what a dataset's rows are and its dependencies changed by dated edits; a meaning redefined
 * from a day; a thing ended with what follows it; and an estate's own change sets, followed by every flow that imports
 * it, each taking what applies to it.
 */
import { describe, expect, it } from 'vitest';
import { editTargets } from '../src/core/attribute.js';
import { composeFlow, type FlowFiles } from '../src/core/compose.js';
import { changesProblems, EDIT_OPS, endedIssues, validateDocument, type ChangeSet, type FlowDocument, type RuleEdit } from '../src/core/document.js';
import { endThing, linkSaid, redefine, setLink, setNeeds, setRows, setType } from '../src/core/flowedit.js';
import { applyEdit, resolve, rulesHash } from '../src/core/inforce.js';
import { expandNotebooks } from '../src/core/notebook.js';
import type { Ended, LinkType, ObjectType, Ontology } from '../src/core/ontology.js';
import { endedArrivalSaid, endedEntry, endedInWords, entryCalled, redefinable, redefinedWhere, redefineEdits } from '../src/core/ontologypage.js';
import { flowHash, translate } from '../src/core/plan.js';
import { defaultKind, livesOf, registerOf, shortOf, subjectOf } from '../src/core/register.js';
import { closedOf } from '../src/core/rules.js';
import { datedDiff, diffKey, diffSaid, ontologyMap, rulesDiff } from '../src/core/ruleversions.js';
import { asEstate, estateHash, ESTATE_OPS, type EstateOntology } from '../src/core/shared.js';
import { loadFlowDir, ts } from './helpers/notebooks.js';

const NB = `import { cell, param, sql } from 'smaltnb';
import { check, publish, source } from 'smaltfl/notebook';
cell('params');
export const params = param({ day: param.text('') });
cell('apps');
export const apps = source('apps');
cell('teams');
export const teams = source('teams');
cell('people');
export const people = source('people');
cell('apps_checked');
export const apps_checked = check(apps, { rules: [{ name: 'has_id', check: "app_id IS NOT NULL", onFail: 'drop' }] });
cell('by_team', { lang: 'sql' });
export const by_team = sql\`SELECT a.team_id, count(*) AS apps FROM \${apps_checked} a GROUP BY a.team_id\`;
cell('published');
publish(by_team);
`;
const APP: ObjectType = { id: 'application', name: 'Application', dataset: 'apps', key: ['app_id'], title: 'name' };
const TEAM: ObjectType = { id: 'team', name: 'Team', dataset: 'teams', key: ['team_id'], title: 'name' };
const PERSON: ObjectType = { id: 'person', name: 'Person', dataset: 'people', key: ['person_id'], title: 'name' };
const OWNED: LinkType = { id: 'owned_by', name: 'Owned by', from: 'application', to: 'team', on: [['team_id', 'team_id']], cardinality: 'many-to-one' };
const LED: LinkType = { id: 'led_by', name: 'Led by', from: 'team', to: 'person', on: [['leader_id', 'person_id']] };
const ONTOLOGY: Ontology = {
  objectTypes: [APP, TEAM, PERSON], linkTypes: [OWNED, LED], actionTypes: [],
  properties: [
    { column: 'tier', title: 'Tier', description: 'How much the business depends on it', values: { '1': 'Critical', '2': 'Important' } },
    { column: 'status', title: 'Status', description: 'Whether it is live', datasets: ['apps', 'teams'] },
  ],
  rules: [{ id: 'tier_closed', file: 'apps', column: 'tier', kind: 'closed', entries: [['1'], ['2'], ['3']], action: 'hold' }],
  // Each file says what one row is by its noun too, so a kind may end and the file still say it.
  nouns: { apps: { one: 'app', many: 'apps' }, teams: { one: 'team', many: 'teams' }, people: { one: 'person', many: 'people' } },
};
const flow = (more: Record<string, unknown> = {}): FlowDocument =>
  ({
    smaltfl: 5, id: 'kinds', name: 'Kinds', steps: [],
    parameters: [{ name: 'day', type: 'text', default: '2024-03-01' }],
    sources: [{ id: 'apps', table: 'apps_file' }, { id: 'teams', table: 'teams_file' }, { id: 'people', table: 'people_file' }],
    notebooks: [{ path: 'a.nb.ts', source: NB }],
    publish: { hold: ['checks'], period: 'day', watch: {} },
    ontology: ONTOLOGY,
    ...more,
  }) as unknown as FlowDocument;
const doc = (more?: Record<string, unknown>) => expandNotebooks(flow(more), ts);
const set = (id: string, from: string, edits: RuleEdit[], more: Partial<ChangeSet> = {}): ChangeSet => ({ id, from, recorded: `${from}T09:00:00Z`, by: 'owner', why: 'The business said so', kind: 'business', edits, agreed: [{ by: 'owner', at: `${from}T09:00:00Z` }], ...more });

describe('a kind of thing, changed by a dated edit', () => {
  it('is added, changed with what changed said, and passes over a flow without its dataset', async () => {
    const d = await doc();
    const vendor: ObjectType = { id: 'vendor', name: 'Vendor', dataset: 'people', key: ['person_id'], title: 'name', description: ' Who we buy from ' };
    const added = setType(d, vendor);
    expect(added.said).toBe('Added the kind Vendor: one row of people, by person_id');
    expect(added.doc.ontology!.objectTypes.at(-1)).toEqual({ ...vendor, description: 'Who we buy from' });
    expect(validateDocument(added.doc)).toEqual([]);
    expect(setType(added.doc, { ...vendor, description: 'Who we buy from' })).toEqual({ doc: added.doc, said: null });
    expect(setType(d, { ...APP, key: ['id'], name: 'App' }).said).toBe('Changed the kind Application: its name Application → App; its key app_id → id');
    expect(setType(d, { ...vendor, dataset: 'vendors' })).toEqual({ doc: d, said: null });
    // Its rows are a dataset by the flow's own spelling.
    expect(setType(d, { ...vendor, dataset: 'PEOPLE' }).doc.ontology!.objectTypes.at(-1)!.dataset).toBe('people');
  });

  it('is in force from its day, and the rules in force move on those days alone', async () => {
    const vendor: ObjectType = { id: 'vendor', name: 'Vendor', dataset: 'people', key: ['person_id'], title: 'name' };
    const d = await doc({ changes: [set('vendors', '2024-03-11', [{ op: 'setType', type: vendor }])] });
    expect(validateDocument(d)).toEqual([]);
    expect(resolve(d, '2024-03-10').doc.ontology!.objectTypes.map((t) => t.id)).toEqual(['application', 'team', 'person']);
    expect(resolve(d, '2024-03-11').doc.ontology!.objectTypes.map((t) => t.id)).toEqual(['application', 'team', 'person', 'vendor']);
    expect(resolve(d, '2024-03-11').applied.map((a) => a.said)).toEqual([['Added the kind Vendor: one row of people, by person_id']]);
    const bare = await doc();
    expect(await rulesHash(resolve(d, '2024-03-10').doc)).toBe(await rulesHash(bare));
    expect(await rulesHash(resolve(d, '2024-03-11').doc)).not.toBe(await rulesHash(bare));
    // A kind is no step: the plan's nodes are what they were.
    expect((await translate(d, { day: '2024-03-11' })).nodes).toEqual((await translate(bare, { day: '2024-03-11' })).nodes);
  });
});

describe('a relation, what a row is and a dependency', () => {
  it('adds and changes a relation between two kinds the ontology has', async () => {
    const d = await doc();
    const acted: LinkType = { id: 'acted_for_by', name: 'Acted for by', from: 'team', to: 'person', on: [['acting_leader_id', 'person_id']] };
    expect(linkSaid(d.ontology, OWNED)).toBe('Application to Team, on team_id');
    const added = setLink(d, acted);
    expect(added.said).toBe('Added the relation Acted for by: Team to Person, on acting_leader_id = person_id');
    expect(validateDocument(added.doc)).toEqual([]);
    expect(setLink(d, { ...LED, on: [['lead_id', 'person_id']] }).said).toBe('Changed the relation Led by: on leader_id = person_id → lead_id = person_id');
    expect(setLink(d, LED)).toEqual({ doc: d, said: null });
    expect(setLink(d, { ...acted, to: 'vendor' })).toEqual({ doc: d, said: null });
  });

  it('says what a row is and adds a dependency only where a flow keeps them: one with gates', async () => {
    // A flow with no gate keeps no written check (ADR 0015): the edits pass over it.
    const d = await doc();
    expect(setRows(d, { dataset: 'teams', of: 'team' })).toEqual({ doc: d, said: null });
    const estate = await loadFlowDir(new URL('../examples/control-estate/', import.meta.url));
    const tls = estate.ontology!.rows!.find((r) => r.dataset === 'tls')!;
    expect(setRows(estate, tls)).toEqual({ doc: estate, said: null });
    const changed = setRows(estate, { ...tls, where: { exposure: 'internet' } });
    expect(changed.said).toBe('Changed what a row of tls is: Application, where exposure internet');
    expect(validateDocument(changed.doc)).toEqual([]);
    expect(setRows(estate, { dataset: 'tls', of: 'nothing' })).toEqual({ doc: estate, said: null });
    const needs = setNeeds(estate, { id: 'tls_needs_waf', datasets: ['tls', 'elsewhere'], when: { status: 'pass' }, then: { status: ['pass', 'fail'] }, description: 'A stand-in' });
    expect(needs.said).toBe('Added the dependency tls_needs_waf on tls: A stand-in');
    expect(needs.doc.ontology!.needs!.at(-1)!.datasets).toEqual(['tls']);
    expect(setNeeds(estate, { id: 'x', datasets: ['elsewhere'], when: {}, then: {} })).toEqual({ doc: estate, said: null });
  });
});

describe('a meaning redefined (Q-251)', () => {
  it('means something else from its day, for every dataset or for those named; past days keep theirs', async () => {
    const d = await doc();
    const tier = redefine(d, 'tier', undefined, { description: 'How quickly it must be back after an outage', values: { '3': 'Deferrable' } });
    expect(tier.said).toBe('Redefined Tier: “How much the business depends on it” → “How quickly it must be back after an outage”; 3 means Deferrable');
    expect(tier.doc.ontology!.properties![0]).toMatchObject({ description: 'How quickly it must be back after an outage', values: { '1': 'Critical', '2': 'Important', '3': 'Deferrable' } });
    expect(redefine(d, 'status', ['apps', 'teams'], { description: 'Whether it takes traffic' }).said).toBe('Redefined Status in apps and teams: “Whether it is live” → “Whether it takes traffic”');
    // The same words, or a column the ontology has no such meaning for, change nothing.
    expect(redefine(d, 'tier', undefined, { description: 'How much the business depends on it' })).toEqual({ doc: d, said: null });
    expect(redefine(d, 'tier', ['apps'], { description: 'x' })).toEqual({ doc: d, said: null });
    expect(redefine(d, 'nothing', undefined, { description: 'x' })).toEqual({ doc: d, said: null });
    const dated = await doc({ changes: [set('tier-means', '2024-03-18', [{ op: 'redefine', column: 'tier', change: { description: 'How quickly it must be back after an outage' } }])] });
    expect(resolve(dated, '2024-03-17').doc.ontology!.properties![0]!.description).toBe('How much the business depends on it');
    expect(resolve(dated, '2024-03-18').doc.ontology!.properties![0]!.description).toBe('How quickly it must be back after an outage');
  });

  it('reaches the part of an estate’s meaning a flow took, and never a flow’s own handling', async () => {
    // A flow that has only the apps took the status's meaning trimmed to them: the estate's redefinition is of it still.
    const trimmed = await doc({ ontology: { ...ONTOLOGY, properties: [{ column: 'status', title: 'Status', description: 'Whether it is live', datasets: ['apps'] }] } });
    expect(redefine(trimmed, 'status', ['apps', 'teams'], { description: 'Whether it takes traffic' }).said).toBe('Redefined Status in apps: “Whether it is live” → “Whether it takes traffic”');
    const own = await doc({ ontology: { ...ONTOLOGY, properties: [{ column: 'status', title: 'Status', description: 'Ours', datasets: ['apps'], override: { reason: 'We count it our way' } }] } });
    expect(redefine(own, 'status', ['apps', 'teams'], { description: 'Whether it takes traffic' })).toEqual({ doc: own, said: null });
  });

  it('is asked of a column that has a meaning: one edit a meaning the ontology keeps, the datasets it is passed on to with it', async () => {
    const d = await doc({
      ontology: {
        ...ONTOLOGY,
        properties: [
          ...ONTOLOGY.properties!,
          // A file's own meaning and its copy on the step that passes the column on, as a name carried through leaves them.
          { column: 'team_id', title: 'Team', description: 'The team that owns it', datasets: ['apps'] },
          { column: 'team_id', title: 'Team', description: 'The team that owns it', datasets: ['apps_checked'] },
          { column: 'name', title: 'Name', description: '', datasets: ['apps'] },
          { column: 'owner', title: 'Owner', description: 'Ours', datasets: ['apps'], override: { reason: 'We count it our way' } },
        ],
      },
    });
    // Asked only where there is a meaning to redefine: not of a column nothing describes, one described by nothing
    // but its name, or a flow's own handling of an estate's column.
    expect(redefinable(d, 'apps', 'tier')).toBe(true);
    expect(redefinable(d, 'apps', 'TEAM_ID')).toBe(true);
    expect(redefinable(d, 'apps', 'name')).toBe(false);
    expect(redefinable(d, 'apps', 'owner')).toBe(false);
    expect(redefinable(d, 'apps', 'nothing')).toBe(false);
    // The flow's dictionary is one meaning: one edit, for every dataset that has the column.
    const tier = redefineEdits(d, 'apps', 'tier', ['apps_checked'], { description: 'How quickly it must be back' });
    expect(tier).toEqual([{ op: 'redefine', column: 'tier', change: { description: 'How quickly it must be back' } }]);
    expect(redefinedWhere(tier)).toBe('every dataset that has the column');
    // A meaning shared by named datasets is one edit, and redefined for all of them.
    const status = redefineEdits(d, 'apps', 'status', [], { description: 'Whether it takes traffic' });
    expect(status).toEqual([{ op: 'redefine', column: 'status', datasets: ['apps', 'teams'], change: { description: 'Whether it takes traffic' } }]);
    expect(redefinedWhere(status)).toBe('apps and teams');
    // The file's own and each copy passed on: an edit each, so the step's output reads as its file does.
    const team = redefineEdits(d, 'apps', 'team_id', ['apps_checked'], { description: 'The team that pays for it', values: { T1: 'Platform' } });
    expect(team.map((e) => (e.op === 'redefine' ? e.datasets : null))).toEqual([['apps'], ['apps_checked']]);
    expect(redefinedWhere(team)).toBe('apps and apps_checked');
    let next = d;
    const saids: string[] = [];
    for (const e of team) {
      const r = applyEdit(next, e)!;
      next = r.doc;
      saids.push(r.said);
    }
    expect(saids).toEqual([
      'Redefined Team in apps: “The team that owns it” → “The team that pays for it”; T1 means Platform',
      'Redefined Team in apps_checked: “The team that owns it” → “The team that pays for it”; T1 means Platform',
    ]);
    expect(validateDocument(next)).toEqual([]);
    // A flow's own handling is left as it is, and a column with no meaning gives no edit.
    expect(redefineEdits(d, 'apps', 'owner', [], { description: 'x' })).toEqual([]);
    expect(redefineEdits(d, 'apps', 'nothing', ['apps_checked'], { description: 'x' })).toEqual([]);
    expect(redefinedWhere([])).toBe('');
  });
});

describe('a thing ended, with what follows it (Q-264)', () => {
  it('ends a relation, replaced by another: no longer in force, and kept as ended', async () => {
    const d = await doc();
    const acted: LinkType = { id: 'acted_for_by', name: 'Acted for by', from: 'team', to: 'person', on: [['acting_leader_id', 'person_id']] };
    const both = setLink(d, acted).doc;
    const ended = endThing(both, { what: 'link', id: 'led_by', then: { how: 'replaced', by: ['acted_for_by'] } });
    expect(ended.said).toBe('Ended the relation Led by: replaced by Acted for by');
    expect(ended.doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['owned_by', 'acted_for_by']);
    expect(ended.doc.ontology!.ended).toEqual([{ what: 'link', id: 'led_by', then: { how: 'replaced', by: ['acted_for_by'] } }]);
    expect(validateDocument(ended.doc)).toEqual([]);
    // What follows it is in force and of its own sort; one for replaced by, two or more for split into.
    expect(endThing(both, { what: 'link', id: 'led_by', then: { how: 'replaced', by: ['nothing'] } })).toEqual({ doc: both, said: null });
    expect(endThing(both, { what: 'link', id: 'led_by', then: { how: 'split', by: ['acted_for_by'] } })).toEqual({ doc: both, said: null });
    expect(endThing(both, { what: 'link', id: 'led_by', then: { how: 'replaced', by: ['led_by'] } })).toEqual({ doc: both, said: null });
    expect(endThing(both, { what: 'link', id: 'led_by', then: { how: 'split', by: ['owned_by', 'acted_for_by'] } }).said).toBe('Ended the relation Led by: split into Owned by and Acted for by');
    expect(endThing(d, { what: 'link', id: 'gone' })).toEqual({ doc: d, said: null });
    // Set again, it is one again: the record that it ended goes.
    expect(setLink(ended.doc, LED).doc.ontology!.ended).toBeUndefined();
  });

  it('ends a kind once no relation and no rows entry names it', async () => {
    const d = await doc();
    expect(endThing(d, { what: 'type', id: 'person' })).toEqual({ doc: d, said: null });
    // Nor where its file would no longer say what one row is: the ontology comes first.
    const { nouns: _nouns, ...bare } = ONTOLOGY;
    const unsaid = endThing(await doc({ ontology: bare }), { what: 'link', id: 'led_by' }).doc;
    expect(endThing(unsaid, { what: 'type', id: 'person' })).toEqual({ doc: unsaid, said: null });
    const unled = endThing(d, { what: 'link', id: 'led_by' }).doc;
    const ended = endThing(unled, { what: 'type', id: 'person', then: { how: 'merged', by: ['team'] } });
    expect(ended.said).toBe('Ended the kind Person: merged into Team');
    expect(ended.doc.ontology!.objectTypes.map((t) => t.id)).toEqual(['application', 'team']);
    expect(ended.doc.ontology!.ended!.map((e) => [e.what, e.id])).toEqual([['link', 'led_by'], ['type', 'person']]);
    expect(validateDocument(ended.doc)).toEqual([]);
  });

  it('ends an entry of a closed list: the ontology has it no longer, so its rows stop at the gate from then', async () => {
    const d = await doc();
    const ended = endThing(d, { what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'merged', by: ['2'] } });
    // Each entry by the ontology's word for it, where it has one beyond the value.
    expect(ended.said).toBe('Ended 3 in apps: merged into Important (2)');
    expect(endThing(d, { what: 'entry', id: '2', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'merged', by: ['1'] } }).said).toBe('Ended Important (2) in apps: merged into Critical (1)');
    // Declared again, it is an entry again and the record that it ended goes; in the list and ended at once is refused.
    const back = applyEdit(ended.doc, { op: 'declareEntry', file: 'apps', rule: 'tier_closed', entry: ['3'] })!;
    expect(back.said).toBe('Declared 3 in apps');
    expect(back.doc.ontology!.ended).toBeUndefined();
    expect(closedOf(back.doc.ontology, 'apps')[0]!.entries).toEqual([['1'], ['2'], ['3']]);
    expect(validateDocument({ ...d, ontology: { ...d.ontology!, ended: [{ what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' } }] } }).map((x) => x.message)).toEqual(['3 is in force and said to have ended: it is one or the other']);
    // At the gate (§4), a row that carries it isn't new to the ontology: it was taken out, and the gate says so.
    const rule = closedOf(ended.doc.ontology, 'apps')[0]!;
    expect(endedEntry(ended.doc.ontology, rule, '3')).toEqual({ what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'merged', by: ['2'] } });
    expect(endedArrivalSaid(ended.doc.ontology, rule, '3', 'Mon 18')).toBe('The ontology ended it: merged into Important (2), from Mon 18.');
    expect(endedArrivalSaid(ended.doc.ontology, rule, '7')).toBe('');
    expect(endedEntry(d.ontology, rule, '3')).toBeNull();
    expect(entryCalled(d.ontology, rule, '1')).toBe('Critical (1)');
    expect(entryCalled(d.ontology, rule, '3')).toBe('3');
    expect(endedInWords({})).toBe('ended');
    expect(endedInWords({ then: { how: 'split', by: ['a', 'b', 'c'] } })).toBe('ended: split into a, b and c');
    expect(endedInWords({ then: { how: 'replaced', by: ['x'] } }, (id) => id.toUpperCase())).toBe('ended: replaced by X');
    expect(closedOf(ended.doc.ontology, 'apps')[0]!.entries).toEqual([['1'], ['2']]);
    expect(ended.doc.ontology!.ended).toEqual([{ what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'merged', by: ['2'] } }]);
    expect(validateDocument(ended.doc)).toEqual([]);
    expect(endThing(d, { what: 'entry', id: '9', of: { file: 'apps', rule: 'tier_closed' } })).toEqual({ doc: d, said: null });
    expect(endThing(d, { what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'replaced', by: ['4'] } })).toEqual({ doc: d, said: null });
  });

  it('is a dated change: in force until the day it ends, and one row of the register whose life stops there', async () => {
    const d = await doc({ changes: [set('unled', '2024-03-18', [{ op: 'end', ended: { what: 'link', id: 'led_by' } }])] });
    expect(validateDocument(d)).toEqual([]);
    expect(resolve(d, '2024-03-17').doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['owned_by', 'led_by']);
    expect(resolve(d, '2024-03-18').doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['owned_by']);
    const edit = d.changes![0]!.edits[0]!;
    expect(subjectOf(edit)).toEqual({ key: 'link:led_by', dataset: '', lane: 'is', what: 'led_by, a relation' });
    expect(shortOf(edit)).toBe('ended');
    expect(shortOf({ op: 'end', ended: { what: 'type', id: 'person', then: { how: 'merged', by: ['team'] } } })).toBe('ended, merged into team');
    const days = ['2024-03-16', '2024-03-17', '2024-03-18', '2024-03-19'];
    const lives = livesOf(registerOf(d, { today: '2024-03-19' }).entries, days, '2024-03-19');
    expect(lives.map((l) => [l.subject.key, l.spans.map((sp) => [sp.from, sp.until, sp.short])])).toEqual([['link:led_by', [['2024-03-16', '2024-03-17', 'as shipped'], ['2024-03-18', '2024-03-19', 'ended']]]]);
    // A thing a change adds begins on its day: nothing of it was shipped, so no days before it stood as shipped. One
    // a change alters stood before.
    const acted: LinkType = { id: 'acted_for_by', name: 'Acted for by', from: 'team', to: 'person', on: [['acting_leader_id', 'person_id']] };
    const added = await doc({ changes: [set('acting', '2024-03-18', [{ op: 'setLink', link: acted }, { op: 'setType', type: { ...APP, key: ['app_id', 'env'] } }])] });
    expect(livesOf(registerOf(added, { today: '2024-03-19' }).entries, days, '2024-03-19').map((l) => [l.subject.key, l.spans.map((sp) => [sp.from, sp.until, sp.short])])).toEqual([
      ['link:acted_for_by', [['2024-03-18', '2024-03-19', 'added']]],
      ['type:application', [['2024-03-16', '2024-03-17', 'as shipped'], ['2024-03-18', '2024-03-19', 'set']]],
    ]);
  });

  it('ends a dataset described ahead that still waits for its data; with its data, the description stays', async () => {
    const sbom = { id: 'sbom', name: 'SBOM inventory', row: { one: 'component list', many: 'component lists' }, key: ['app_id'], columns: [{ column: 'app_id', description: 'The application it is of' }] };
    const waiting = await doc({ ontology: { ...ONTOLOGY, awaited: [sbom] } });
    const ended = endThing(waiting, { what: 'awaited', id: 'sbom' });
    expect(ended.said).toBe('Ended the description of SBOM inventory, written ahead of its data');
    expect(ended.doc.ontology!.awaited).toBeUndefined();
    expect(ended.doc.ontology!.ended).toEqual([{ what: 'awaited', id: 'sbom' }]);
    expect(validateDocument(ended.doc)).toEqual([]);
    // One a source of its name has by now is the record of what was asked for: it doesn't end.
    const bound = await doc({ ontology: { ...ONTOLOGY, awaited: [{ ...sbom, id: 'people', name: 'People' }] } });
    expect(endThing(bound, { what: 'awaited', id: 'people' })).toEqual({ doc: bound, said: null });
    expect(endThing(waiting, { what: 'awaited', id: 'nothing' })).toEqual({ doc: waiting, said: null });
    // Described again, it is one again; in force and ended at once is refused.
    const again = applyEdit(ended.doc, { op: 'describeAhead', dataset: sbom })!;
    expect(again.doc.ontology!.ended).toBeUndefined();
    expect(again.doc.ontology!.awaited).toEqual([sbom]);
    expect(validateDocument({ ...waiting, ontology: { ...waiting.ontology!, ended: [{ what: 'awaited', id: 'SBOM' }] } }).map((x) => x.message)).toEqual(['SBOM is in force and said to have ended: it is one or the other']);
    // On the register it is the described dataset's own row, and an estate describes none ahead, so ends none.
    expect(subjectOf({ op: 'end', ended: { what: 'awaited', id: 'sbom' } })).toEqual({ key: 'awaited:sbom', dataset: 'sbom', lane: 'is', what: 'described ahead of its data' });
    expect(subjectOf({ op: 'describeAhead', dataset: sbom }).key).toBe('awaited:sbom');
    expect(() => asEstate({ smaltflOntology: 2, name: 'E', objectTypes: [], linkTypes: [], actionTypes: [], changes: [set('x', '2024-03-11', [{ op: 'end', ended: { what: 'awaited', id: 'sbom' } }])] }, 'e.json')).toThrow(/ends a dataset described ahead of its data/);
    // Between two days, the comparison says it ended.
    const dated = await doc({ ontology: { ...ONTOLOGY, awaited: [sbom] }, changes: [set('no-sbom', '2024-03-18', [{ op: 'end', ended: { what: 'awaited', id: 'sbom' } }])] });
    expect(rulesDiff(resolve(dated, '2024-03-17').doc, resolve(dated, '2024-03-18').doc).map((x) => diffSaid(x, resolve(dated, '2024-03-18').doc.ontology))).toEqual(['The description of SBOM inventory, written ahead of its data, ended']);
  });

  it('holds a record that a thing ended to its shape', async () => {
    const bad = (x: unknown) => endedIssues(x).map(([p, m]) => `${p}: ${m}`);
    expect(endedIssues({ what: 'link', id: 'led_by' })).toEqual([]);
    expect(bad({ what: 'rule', id: 'x' })).toEqual(['.what: what ended: one of type, link, rows, needs, entry, awaited']);
    expect(bad({ what: 'entry', id: '3' })).toEqual(['.of: the list an entry was of: { file, rule }']);
    expect(bad({ what: 'link', id: 'x', of: { file: 'a', rule: 'b' } })).toEqual(['.of: only an entry is of a list']);
    expect(bad({ what: 'link', id: 'x', then: { how: 'replaced', by: ['a', 'b'] } })).toEqual(['.then.by: one thing follows it']);
    expect(bad({ what: 'link', id: 'x', then: { how: 'split', by: ['a'] } })).toEqual(['.then.by: a thing splits into two or more']);
    expect(bad({ what: 'link', id: 'x', then: { how: 'moved', by: ['a'] } })).toEqual(['.then: what follows it: { how: replaced, merged, split; by: [ … ] }']);
    expect(bad({ what: 'link', id: 'x', then: { how: 'replaced', by: ['x'] } })).toEqual(['.then.by: what follows it: each once, and never the thing itself']);
    const messages = async (ended: unknown, more: Record<string, unknown> = {}) => validateDocument(await doc({ ontology: { ...ONTOLOGY, ended }, ...more })).map((i) => `${i.path}: ${i.message}`);
    expect(await messages([{ what: 'link', id: 'gone' }])).toEqual([]);
    expect(await messages([{ what: 'link', id: 'led_by' }])).toEqual(['$.ontology.ended[0]: led_by is in force and said to have ended: it is one or the other']);
    expect(await messages([{ what: 'link', id: 'gone' }, { what: 'link', id: 'gone' }])).toEqual(['$.ontology.ended[1]: gone is said to have ended twice']);
    expect(await messages([{ what: 'link', id: 'gone' }], { smaltfl: 4 })).toEqual(['$.ontology.ended: a thing that ended is a format-5 document’s (the ontology first)']);
    expect(await messages([])).toEqual(['$.ontology.ended: what has ended: a list of one or more; absent when nothing has']);
  });
});

describe('the edits, as change sets carry them', () => {
  it('are told from a bad one, said by kind, and attributed to the dataset each is about', () => {
    for (const op of ['setType', 'setLink', 'setRows', 'setNeeds', 'redefine', 'end']) expect(EDIT_OPS).toContain(op);
    const good: RuleEdit[] = [
      { op: 'setType', type: APP }, { op: 'setLink', link: OWNED }, { op: 'setRows', rows: { dataset: 'apps', of: 'application' } },
      { op: 'setNeeds', needs: { id: 'n', datasets: ['apps'], when: { status: 'live' }, then: { tier: ['1'] } } },
      { op: 'redefine', column: 'tier', change: { description: 'x' } }, { op: 'end', ended: { what: 'link', id: 'led_by' } },
    ];
    expect(changesProblems([set('all', '2024-03-11', good)])).toEqual([]);
    const bad = (e: unknown) => changesProblems([set('b', '2024-03-11', [e as RuleEdit])]).map((i) => `${i.path.replace('$.changes[0].edits[0]', '')}: ${i.message}`);
    expect(bad({ op: 'setType', type: { ...APP, key: [] } })).toEqual(['.type: the kind: { id, name, dataset, key, title }']);
    expect(bad({ op: 'setLink', link: { ...OWNED, on: [['a']] } })).toEqual(['.link: the relation: { id, name, from, to, on: [[column of from, column of to], …] }']);
    expect(bad({ op: 'setRows', rows: { dataset: 'apps' } })).toEqual(['.rows: what a dataset’s rows are: { dataset, of, key, where, ids }']);
    expect(bad({ op: 'redefine', column: 'tier', change: {} })).toEqual(['.change: what it means now: { description, title?, values? }']);
    expect(bad({ op: 'end', ended: { what: 'link' } })).toEqual(['.ended.id: the thing that ended: its id, a rows entry’s dataset, an entry’s key, or a described dataset’s name']);
    expect(good.map((e) => [e.op, editTargets(e)])).toEqual([['setType', ['apps']], ['setLink', []], ['setRows', ['apps']], ['setNeeds', ['apps']], ['redefine', []], ['end', []]]);
    expect(editTargets({ op: 'end', ended: { what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' } } })).toEqual(['apps']);
    expect(editTargets({ op: 'redefine', column: 'status', datasets: ['apps'], change: { description: 'x' } })).toEqual(['apps']);
    expect(good.map((e) => [subjectOf(e).key, subjectOf(e).lane, shortOf(e)])).toEqual([
      ['type:application', 'is', 'set'], ['link:owned_by', 'is', 'set'], ['rows:apps', 'is', 'set'], ['needs:n', 'check', 'set'], ['meaning::tier', 'is', 'redefined'], ['link:led_by', 'is', 'ended'],
    ]);
    expect(defaultKind(good)).toBe('business');
  });

  it('hash with the rules in force as the ontology writes them (rules/1): the vector', async () => {
    const small = { smaltfl: 5, id: 'f', name: 'F', sources: [], steps: [], ontology: { objectTypes: [APP], linkTypes: [], actionTypes: [], ended: [{ what: 'link', id: 'led_by', then: { how: 'replaced', by: ['acted_for_by'] } }] } } as unknown as FlowDocument;
    expect(await rulesHash(small)).toBe('cf08339f9fc9aa7ed5592c5e58ab57f13b1ff0a0fee262ea42ee4e5b8ab411b6');
  });
});

describe('two dates compared (ADR 0027 §9, Q-269)', () => {
  const acted: LinkType = { id: 'acted_for_by', name: 'Acted for by', from: 'team', to: 'person', on: [['acting_leader_id', 'person_id']] };
  const vendor: ObjectType = { id: 'vendor', name: 'Vendor', dataset: 'people', key: ['person_id'], title: 'name' };
  const dated = () => doc({ changes: [
    set('march', '2024-03-11', [{ op: 'setLink', link: acted }, { op: 'end', ended: { what: 'link', id: 'led_by', then: { how: 'replaced', by: ['acted_for_by'] } } }, { op: 'setType', type: vendor }]),
    set('tier', '2024-03-18', [{ op: 'redefine', column: 'tier', change: { description: 'How quickly it must be back', values: { '3': 'Deferrable' } } }, { op: 'setType', type: { ...APP, key: ['app_id', 'env'] } }]),
  ] });

  it('says each thing that differs, before and after, in words', async () => {
    const d = await dated();
    const on = (day: string) => resolve(d, day).doc;
    const first = rulesDiff(on('2024-03-10'), on('2024-03-11'));
    expect(first.map((x) => diffSaid(x, on('2024-03-11').ontology))).toEqual([
      'New kind Vendor: one row of people, by person_id',
      'The relation Led by ended: replaced by Acted for by',
      'New relation Acted for by: Team to Person, on acting_leader_id = person_id',
    ]);
    expect(rulesDiff(on('2024-03-11'), on('2024-03-18')).map((x) => diffSaid(x, on('2024-03-18').ontology))).toEqual([
      'What Tier means: “How much the business depends on it (1: Critical, 2: Important)” → “How quickly it must be back (1: Critical, 2: Important, 3: Deferrable)”',
      'The kind Application: one row of apps, by app_id → one row of apps, by app_id, env',
    ]);
    expect(rulesDiff(on('2024-03-18'), on('2024-03-18'))).toEqual([]);
  });

  it('gives each difference the change that made it, with its day and its kind', async () => {
    const d = await dated();
    // Between Sun 10 and Mon 18, both change sets: each line is the last change in between that is about the thing.
    const both = datedDiff(d, '2024-03-10', '2024-03-18');
    expect(both.map((x) => [diffKey(x.diff), x.change?.id ?? null, x.change?.from ?? null, x.change?.kind ?? null])).toEqual([
      ['meaning|tier|', 'tier', '2024-03-18', 'business'],
      ['type|application', 'tier', '2024-03-18', 'business'],
      ['type|vendor', 'march', '2024-03-11', 'business'],
      ['link|led_by', 'march', '2024-03-11', 'business'],
      ['link|acted_for_by', 'march', '2024-03-11', 'business'],
    ]);
    // The same day twice, or two days with the same changes in force: nothing differs.
    expect(datedDiff(d, '2024-03-18', '2024-03-18')).toEqual([]);
    expect(datedDiff(d, '2024-03-12', '2024-03-17')).toEqual([]);
    // As known before the second was recorded, only the first is there to differ by.
    expect(datedDiff(d, '2024-03-10', '2024-03-18', '2024-03-12T00:00:00Z').map((x) => x.change?.id)).toEqual(['march', 'march', 'march']);
    // A change whose days ended between the two is behind a difference no change in force on the later day made.
    const lapsed = await doc({ changes: [set('for-a-week', '2024-03-04', [{ op: 'setType', type: { ...APP, key: ['app_id', 'env'] } }], { until: '2024-03-10' })] });
    expect(datedDiff(lapsed, '2024-03-05', '2024-03-12').map((x) => [diffKey(x.diff), x.change])).toEqual([['type|application', null]]);
  });

  it('says a closed list’s entries by what was declared or is no longer in it, never the whole rule twice', async () => {
    const d = await doc({ changes: [
      set('four', '2024-03-11', [{ op: 'declareEntry', file: 'apps', rule: 'tier_closed', entry: ['4'] }]),
      set('three', '2024-03-18', [{ op: 'end', ended: { what: 'entry', id: '3', of: { file: 'apps', rule: 'tier_closed' }, then: { how: 'merged', by: ['2'] } } }, { op: 'leaveOut', file: 'apps', rule: 'tier_closed', key: '9' }]),
    ] });
    const on = (day: string) => resolve(d, day).doc;
    const said = (a: string, b: string) => rulesDiff(on(a), on(b)).map((x) => diffSaid(x, on(b).ontology));
    expect(said('2024-03-10', '2024-03-11')).toEqual(['The closed column Tier in apps: 4 declared (3 → 4 entries)']);
    // A value is named by the ontology's word for it where it has one that says more than the value.
    expect(said('2024-03-11', '2024-03-18')).toEqual(['The closed column Tier in apps: 3 no longer in it; 9 left out until declared (4 → 3 entries)']);
    expect(said('2024-03-18', '2024-03-10')).toEqual(['The closed column Tier in apps: 3 declared; 4 no longer in it; 9 no longer left out (3 entries)']);
    // A rule that differs in anything else is said whole, before and after.
    const rule = ONTOLOGY.rules![0]!;
    expect(diffSaid({ kind: 'rule', file: 'apps', id: rule.id, before: rule, after: { ...rule, action: 'flag', entries: [['1'], ['2']] } }, d.ontology)).toMatch(/^Rule on apps: Tier is .*, else hold the day → Tier is .*, else flag the row and keep it$/);
  });

  it('is a map of the kinds and relations: each the same, new, gone or changed between the two', async () => {
    const d = await dated();
    const on = (day: string) => resolve(d, day).doc.ontology;
    const m = ontologyMap(on('2024-03-10'), on('2024-03-18'));
    expect(m.kinds.map((k) => [k.id, k.state])).toEqual([['application', 'changed'], ['team', 'same'], ['person', 'same'], ['vendor', 'added']]);
    expect(m.links.map((l) => [l.id, l.from, l.to, l.state])).toEqual([['owned_by', 'application', 'team', 'same'], ['acted_for_by', 'team', 'person', 'added'], ['led_by', 'team', 'person', 'ended']]);
    expect(ontologyMap(on('2024-03-18'), on('2024-03-18')).kinds.every((k) => k.state === 'same')).toBe(true);
    expect(ontologyMap(undefined, undefined)).toEqual({ kinds: [], links: [] });
    // Drawn: a box a kind, a line a relation, a mark on each that differs, what is to come hatched.
    const { kindsMap } = await import('../src/app/viz.js');
    const svg = kindsMap({ kinds: m.kinds.map((k) => ({ ...k, coming: k.id === 'vendor' })), links: m.links, aria: 'The kinds and relations, Sun Mar 10 against Mon Mar 18' });
    expect(svg).toContain('aria-label="The kinds and relations, Sun Mar 10 against Mon Mar 18"');
    expect((svg.match(/class="km-box"/g) ?? []).length).toBe(4);
    expect((svg.match(/<line class="km-line/g) ?? []).length).toBe(3);
    expect(svg).toContain('+ Acted for by');
    expect(svg).toContain('× Led by');
    expect(svg).toContain('~ Application');
    expect(svg).toContain('class="km-kind km-added km-coming" data-kind="vendor"');
    expect(svg).toContain('style="fill:url(#km-hatch)"');
    expect(svg).not.toContain('NaN');
    // A relation of a kind with itself is a loop over its box.
    const loop = kindsMap({ kinds: [{ id: 'team', name: 'Team', state: 'same' }], links: [{ id: 'reports_into', name: 'Reports into', from: 'team', to: 'team', state: 'same' }], aria: 'x' });
    expect(loop).toContain('<path class="km-line km-same" data-link="reports_into"');
    // Three kinds in a row, wide: a relation between the first and the third goes under the row, a path and no line
    // through the box between them; and two names that would be written over each other are set apart.
    const three = [{ id: 'a', name: 'Unit', state: 'same' as const }, { id: 'b', name: 'Person', state: 'same' as const }, { id: 'c', name: 'Application', state: 'same' as const }];
    const wide = kindsMap({ kinds: three, w: 640, aria: 'x', links: [
      { id: 'owned_by', name: 'Owned by', from: 'c', to: 'a', state: 'same' },
      { id: 'managed_by', name: 'Managed by', from: 'b', to: 'b', state: 'same' },
      { id: 'led_by', name: 'Led by', from: 'a', to: 'b', state: 'same' },
      { id: 'acted_for_by', name: 'Acted for by', from: 'a', to: 'b', state: 'added' },
    ] });
    expect(wide).toContain('<path class="km-line km-same" data-link="owned_by"');
    expect((wide.match(/<line class="km-line/g) ?? []).length).toBe(2);
    const ys = [...wide.matchAll(/<text class="km-lt[^"]*" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]+)</g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), text: m[3]! }));
    expect(ys.map((t) => t.text).sort()).toEqual(['+ Acted for by', 'Led by', 'Managed by', 'Owned by']);
    for (const p of ys) for (const q of ys) if (p !== q) expect(Math.abs(p.y - q.y) >= 11 || Math.abs(p.x - q.x) >= ((p.text.length + q.text.length) * 6.1) / 2).toBe(true);
    expect(wide).not.toContain('NaN');
  });
});

describe('an estate’s own change sets (Q-265)', () => {
  const files = (given: Record<string, unknown>): FlowFiles => ({
    json: async (path) => {
      if (!(path in given)) throw new Error(`no file ${path}`);
      return structuredClone(given[path]);
    },
    text: async (path) => {
      if (typeof given[path] !== 'string') throw new Error(`no file ${path}`);
      return given[path] as string;
    },
  });
  const acted: LinkType = { id: 'acted_for_by', name: 'Acted for by', from: 'team', to: 'person', on: [['acting_leader_id', 'person_id']] };
  const CHANGE: ChangeSet = { id: 'acting', from: '2024-03-11', recorded: '2024-03-08T14:00:00Z', by: 'ciso', why: 'Posts are vacant for a while: who acts for a team is a relation of its own', kind: 'business', edits: [{ op: 'setLink', link: acted }, { op: 'redefine', column: 'tier', change: { description: 'How quickly it must be back' } }], agreed: [{ by: 'owner', at: '2024-03-08T14:00:00Z' }] };
  const ESTATE: EstateOntology = { smaltflOntology: 2, name: 'Shop', objectTypes: [APP, TEAM, PERSON], linkTypes: [OWNED, LED], properties: [{ column: 'tier', title: 'Tier', description: 'How much the business depends on it' }], changes: [CHANGE] };
  const PARAMS = [{ name: 'day', type: 'text', default: null }];
  const nb = (body: string) => `import { cell } from 'smaltnb';\nimport { check, publish, source } from 'smaltfl/notebook';\n${body}\n`;
  const one = (id: string) => `cell('${id}');\nexport const ${id} = source('${id}');\ncell('${id}_checked');\nexport const ${id}_checked = check(${id}, { rules: [{ name: 'has', check: '1 = 1', onFail: 'warn' }] });\ncell('published');\npublish(${id}_checked);`;
  const SHOP = (estate: unknown = ESTATE, more: Record<string, unknown> = {}) => ({
    'ontology.json': estate,
    // One flow has the teams and the people; another only the applications.
    'org/flow.json': { smaltfl: 5, id: 'org', name: 'Organisation', parameters: PARAMS, sources: [{ id: 'teams', table: 'teams_file' }, { id: 'people', table: 'people_file' }], notebooks: ['org.nb.ts'], ontology: { import: ['../ontology.json'], objectTypes: [], linkTypes: [], actionTypes: [] }, ...more },
    'org/org.nb.ts': nb(`cell('people');\nexport const people = source('people');\n${one('teams')}`),
    'apps/flow.json': { smaltfl: 5, id: 'inventory', name: 'Inventory', parameters: PARAMS, sources: [{ id: 'apps', table: 'apps_file' }], notebooks: ['apps.nb.ts'], ontology: { import: ['../ontology.json'], objectTypes: [], linkTypes: [], actionTypes: [] } },
    'apps/apps.nb.ts': nb(one('apps')),
  });

  it('are the estate’s to make: its kinds, relations, rows, dependencies and meanings, never a flow’s rules', () => {
    expect(ESTATE_OPS).toEqual(['setType', 'setLink', 'setRows', 'setNeeds', 'redefine', 'end']);
    expect(asEstate(ESTATE, 'ontology.json')).toBe(ESTATE);
    expect(() => asEstate({ ...ESTATE, changes: {} }, 'o.json')).toThrow(/changes is a list of change sets/);
    expect(() => asEstate({ ...ESTATE, changes: [{ ...CHANGE, edits: [{ op: 'setCheck', node: 'apps', check: 'amount', mode: 'hold' }] }] }, 'o.json')).toThrow(/acting has an edit setCheck: an estate's ontology changes its kinds, relations, what a row is, dependencies and meanings/);
    expect(() => asEstate({ ...ESTATE, changes: [{ ...CHANGE, edits: [{ op: 'end', ended: { what: 'entry', id: '3', of: { file: 'apps', rule: 'r' } } }] }] }, 'o.json')).toThrow(/ends an entry of a closed list: a list is closed by a flow/);
    expect(() => asEstate({ ...ESTATE, changes: [{ ...CHANGE, estate: 'Shop' }] }, 'o.json')).toThrow(/names an estate/);
  });

  it('come in with the estate’s ontology, named as its, and every flow follows from the change’s day, each taking what applies to it', async () => {
    const org = await composeFlow('org/flow.json', files(SHOP()), ts);
    expect(validateDocument(org)).toEqual([]);
    expect(org.changes).toEqual([{ ...CHANGE, estate: 'Shop' }]);
    // Before its day the relation isn't the ontology's; from it, it is.
    expect(resolve(org, '2024-03-10').doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['led_by']);
    expect(resolve(org, '2024-03-11').doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['led_by', 'acted_for_by']);
    // As known before it was written down, nothing; and it is one change of the register, said ahead of its day.
    expect(resolve(org, '2024-03-11', '2024-03-08T13:00:00Z').doc.ontology!.linkTypes.map((l) => l.id)).toEqual(['led_by']);
    expect(registerOf(org, { today: '2024-03-09' }).entries.map((e) => [e.change.id, e.tense, e.change.estate])).toEqual([['acting', 'coming', 'Shop']]);
    // The inventory has no team and no person: the relation passes it over, and the meaning it took is redefined.
    const inv = await composeFlow('apps/flow.json', files(SHOP()), ts);
    expect(inv.changes).toEqual([{ ...CHANGE, estate: 'Shop' }]);
    const then = resolve(inv, '2024-03-11');
    expect(then.doc.ontology!.linkTypes).toEqual([]);
    expect(then.applied.map((a) => [a.said, a.passed])).toEqual([[['Redefined Tier: “How much the business depends on it” → “How quickly it must be back”'], 1]]);
    expect(applyEdit(inv, CHANGE.edits[0]!)).toBeNull();
    // A meaning for every dataset is taken whole by every flow, so the organisation's is redefined too.
    expect(resolve(org, '2024-03-11').applied.map((a) => [a.said, a.passed])).toEqual([[['Added the relation Acted for by: Team to Person, on acting_leader_id = person_id', 'Redefined Tier: “How much the business depends on it” → “How quickly it must be back”'], 0]]);
  });

  it('move the estate’s hash, and with it every importing flow’s', async () => {
    const { changes: _c, ...bare } = ESTATE;
    expect(await estateHash(ESTATE)).not.toBe(await estateHash(bare as EstateOntology));
    const before = await flowHash(await composeFlow('org/flow.json', files(SHOP(bare)), ts));
    expect(await flowHash(await composeFlow('org/flow.json', files(SHOP()), ts))).not.toBe(before);
  });

  it('are refused where a flow’s own change set has the name', async () => {
    const own = SHOP(ESTATE, { changes: [set('acting', '2024-03-12', [{ op: 'end', ended: { what: 'link', id: 'led_by' } }])] });
    await expect(composeFlow('org/flow.json', files(own), ts)).rejects.toThrow(/two change sets are called acting: one of them is Shop’s ontology’s/);
  });
});
