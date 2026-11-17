/**
 * Whose decision a held day is (ADR 0025 §6): a hold is the flow's whose file or step holds; a hold at a step built
 * from a file or step that holds too follows it, and is decided by its decision. On Larkspur's five flows.
 */
import { describe, expect, it } from 'vitest';
import { decisionFlow, flowIdOf, groupLoads, groupSaid, holdGroups, inGroup, loadRoles, possessive, waitingOn, whoseSaid, withRoles } from '../src/core/deciding.js';
import { givesOf } from '../src/core/document.js';
import { loadKey, type Hold, type Load } from '../src/core/hold.js';
import { loadFlowDir } from './helpers/notebooks.js';

const dir = new URL('../examples/larkspur/', import.meta.url);
const load = (source: string, slot = '2024-03-27'): Load => ({ source, slot, sha256: `${source}-${slot}`.padEnd(64, '0') });
const hold = (by: Hold['by'], origin: string, o: Partial<Hold> = {}): Hold => ({ by, node: 0, origin, said: `${origin} said`, reaches: [], load: load(origin), ...o });
const names: Record<string, string> = { '': 'Larkspur estate', hr: 'HR organisation', inventory: 'Inventory', feeds: 'Evidence feeds', applications: 'Applications' };
const nameOf = (flow: string) => names[flow] ?? flow;

describe('whose a hold is', () => {
  it('is the flow whose file or step holds: a flow the document reads by its id and hash, its own flow by none', async () => {
    const doc = await loadFlowDir(dir);
    expect(flowIdOf(doc, 'access_reviews')).toBe('feeds');
    expect(flowIdOf(doc, 'org_chain')).toBe('hr');
    expect(flowIdOf(doc, 'posture_wide')).toBe('');
    const feeds = doc.flows!.find((f) => f.id === 'feeds')!;
    expect(decisionFlow(doc, 'access_reviews')).toEqual({ id: 'feeds', hash: feeds.hash });
    expect(decisionFlow(doc, 'posture_wide')).toBeUndefined();
    expect(decisionFlow({}, 'anything')).toBeUndefined();
  });
});

describe('a day’s holds as the decisions it needs', () => {
  it('is one decision where one flow leads: the file that holds, and the step built from it with it', async () => {
    const doc = await loadFlowDir(dir);
    // Wed Mar 27 on the tour: access_reviews came all but empty, and the posture's own story holds with it.
    const holds = [hold('story', 'access_reviews'), hold('story', 'posture_wide')];
    const groups = holdGroups(doc, holds);
    expect(groups.map((g) => [g.flow, g.leads.map((h) => h.origin), g.follows.map((h) => h.origin)])).toEqual([['feeds', ['access_reviews'], ['posture_wide']]]);
    expect(groupLoads(groups[0]!)).toEqual({ leads: [load('access_reviews')], follows: [load('posture_wide')] });
    expect(groupSaid(groups[0]!)).toBe('access_reviews, and posture_wide with it');
    expect(inGroup(groups[0]!, load('posture_wide'))).toBe(true);
    expect(inGroup(groups[0]!, load('tls'))).toBe(false);
  });

  it('follows a flow through another: Applications’ check fails because HR’s file broke, and HR decides', async () => {
    const doc = await loadFlowDir(dir);
    // Fri Feb 16: the units' file breaks the one-root rule at org_chain; app_owners' check, which reads it, fails too,
    // held once for each load it reads.
    const holds = [
      hold('checks', 'org_chain', { load: load('hr_org_units') }),
      hold('checks', 'app_owners', { load: load('hr_org_units'), shared: true }),
      hold('checks', 'app_owners', { load: load('cmdb_apps'), shared: true }),
    ];
    const groups = holdGroups(doc, holds);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.flow).toBe('hr');
    expect(groups[0]!.leads.map((h) => h.origin)).toEqual(['org_chain']);
    expect(groups[0]!.follows.map((h) => h.origin)).toEqual(['app_owners', 'app_owners']);
    // Its loads: the lead's first; a load both hold is the lead's.
    expect(groupLoads(groups[0]!)).toEqual({ leads: [load('hr_org_units')], follows: [load('cmdb_apps')] });
    expect(groupSaid(groups[0]!)).toBe('org_chain, and app_owners with it');
  });

  it('is the document’s own flow’s where its own step holds and nothing under it does', async () => {
    const doc = await loadFlowDir(dir);
    const groups = holdGroups(doc, [hold('checks', 'fact_control_status', { load: load('tls'), shared: true }), hold('checks', 'fact_control_status', { load: load('cmdb_apps'), shared: true })]);
    expect(groups.map((g) => [g.flow, g.leads.length, g.follows.length])).toEqual([['', 2, 0]]);
  });

  it('is a decision a flow where two lead, in the document’s order, its own last; what follows both goes with the first', async () => {
    const doc = await loadFlowDir(dir);
    const order = doc.flows!.map((f) => f.id);
    const holds = [hold('story', 'posture_wide'), hold('story', 'mfa'), hold('story', 'hr_org_units'), hold('checks', 'control_catalog')];
    const groups = holdGroups(doc, holds);
    const leading = groups.map((g) => g.flow);
    expect(leading).toEqual([...order.filter((f) => f === 'hr' || f === 'feeds'), '']);
    // The posture is built from both flows' files: it goes with the first of them.
    expect(groups[0]!.follows.map((h) => h.origin)).toEqual(['posture_wide']);
    expect(groups[1]!.follows).toEqual([]);
    expect(groups.at(-1)!.leads.map((h) => h.origin)).toEqual(['control_catalog']);
  });

  it('leaves out what is about the run, not its data: a what-if’s hold and a restatement’s', async () => {
    const doc = await loadFlowDir(dir);
    expect(holdGroups(doc, [hold('what-if', 'tls'), hold('restated', 'mfa')])).toEqual([]);
    expect(holdGroups(doc, [])).toEqual([]);
  });

  it('is one decision of its own for a flow that reads none', () => {
    const flat = { steps: [{ id: 'checked', kind: 'expectations', inputs: ['file'] }] } as unknown as Parameters<typeof holdGroups>[0];
    const groups = holdGroups(flat, [hold('story', 'file'), hold('checks', 'checked', { load: load('file') })]);
    expect(groups.map((g) => [g.flow, g.leads.map((h) => h.origin), g.follows.map((h) => h.origin)])).toEqual([['', ['file'], ['checked']]]);
    expect(whoseSaid(flat, groups[0]!, [], nameOf)).toBeNull();
  });
});

describe('each held load’s part in the day’s decision', () => {
  it('is its flow’s where its hold leads, and carries the decision it follows where its hold only follows', async () => {
    const doc = await loadFlowDir(dir);
    const feeds = doc.flows!.find((f) => f.id === 'feeds')!;
    const hr = doc.flows!.find((f) => f.id === 'hr')!;
    const applications = doc.flows!.find((f) => f.id === 'applications')!;
    // The feed's file leads, at Evidence feeds; the posture's own load follows it, the document's own flow's.
    const day = loadRoles(doc, [hold('story', 'access_reviews'), hold('story', 'posture_wide')]);
    expect(day.get(loadKey(load('access_reviews')))).toEqual({ flow: { id: 'feeds', hash: feeds.hash }, follows: null });
    expect(day.get(loadKey(load('posture_wide')))).toEqual({ follows: load('access_reviews') });
    // A load both a leading and a following hold are about is the leader's; one only the follower reads follows.
    const shared = loadRoles(doc, [
      hold('checks', 'org_chain', { load: load('hr_org_units') }),
      hold('checks', 'app_owners', { load: load('hr_org_units'), shared: true }),
      hold('checks', 'app_owners', { load: load('cmdb_apps'), shared: true }),
    ]);
    expect(shared.get(loadKey(load('hr_org_units')))).toEqual({ flow: { id: 'hr', hash: hr.hash }, follows: null });
    expect(shared.get(loadKey(load('cmdb_apps')))).toEqual({ flow: { id: 'applications', hash: applications.hash }, follows: load('hr_org_units') });
    // The document's own step, with nothing under it holding: its own flow's, as a decision always was.
    expect([...loadRoles(doc, [hold('checks', 'fact_control_status', { load: load('tls'), shared: true })]).values()]).toEqual([{ follows: null }]);
    // A hold of no load (a file refused) decides no load.
    expect(loadRoles(doc, [{ by: 'checks', origin: 'tls', reaches: [] }]).size).toBe(0);
  });
});

describe('a day’s decisions, each saying whose it is', () => {
  it('records the loads that lead first, each with its flow, then those that follow with the load they carry', async () => {
    const doc = await loadFlowDir(dir);
    const feeds = doc.flows!.find((f) => f.id === 'feeds')!;
    const holds = [hold('story', 'posture_wide'), hold('story', 'edr_coverage')];
    // One decision a held load, as the day's one choice is recorded (Q-193), in the order the run named them.
    const abouts = [{ load: load('posture_wide'), option: 'fill' }, { load: load('edr_coverage'), option: 'fill' }];
    expect(withRoles(doc, holds, abouts)).toEqual([
      { about: { load: load('edr_coverage'), option: 'fill', flow: { id: 'feeds', hash: feeds.hash } }, follows: null },
      { about: { load: load('posture_wide'), option: 'fill' }, follows: load('edr_coverage') },
    ]);
    // A decision of no load (a day decided whole) is left as it is, and leads.
    const whole: { option: string; load?: Load }[] = [{ option: 'dont' }];
    expect(withRoles(doc, holds, whole)).toEqual([{ about: { option: 'dont' }, follows: null }]);
    // In a flow that reads none, nothing is added: a decision is what it always was.
    const flat = { steps: [] } as unknown as Parameters<typeof withRoles>[0];
    expect(withRoles(flat, [hold('story', 'file')], [{ load: load('file') }])).toEqual([{ about: { load: load('file') }, follows: null }]);
  });

  it('says a flow as an owner by its name', () => {
    expect([possessive('Evidence feeds'), possessive('HR organisation'), possessive('Inventory')]).toEqual(['Evidence feeds’', 'HR organisation’s', 'Inventory’s']);
  });
});

describe('who waits, and the words', () => {
  it('names the flows whose holds follow the decision or whose outputs it keeps back', async () => {
    const doc = await loadFlowDir(dir);
    const gives = (flow: string) => givesOf(doc, flow || undefined);
    const top = givesOf(doc)[0]!;
    const [g] = holdGroups(doc, [hold('story', 'access_reviews', { reaches: ['access_reviews_checked', top] }), hold('story', 'posture_wide', { reaches: [top] })]);
    expect(waitingOn(doc, g!, ['access_reviews_checked', top], gives)).toEqual(['']);
    expect(whoseSaid(doc, g!, [''], nameOf)).toBe('Evidence feeds’ to decide: access_reviews holds. Larkspur estate waits on it.');
    // A flow whose name ends in s takes the apostrophe alone; one that doesn't, 's.
    const [h] = holdGroups(doc, [hold('checks', 'org_chain', { load: load('hr_org_units') })]);
    expect(whoseSaid(doc, h!, ['applications', ''], nameOf)).toBe('HR organisation’s to decide: org_chain holds. Applications and Larkspur estate wait on it.');
    expect(whoseSaid(doc, h!, [], nameOf)).toBe('HR organisation’s to decide: org_chain holds.');
  });
});
