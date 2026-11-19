/**
 * Who hears, and the auditor (ADR 0027 §10, Q-278, Q-279; core/told.ts): the ontology's changes and events told once,
 * and read as a period's digest, a feed, what is new since a browser last looked, and the history an auditor is given
 * and the offline check makes again.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutDisplay, type ChangeSet, type FlowDocument, type RuleEdit } from '../src/core/document.js';
import type { FlowEvent } from '../src/core/events.js';
import { flowHash } from '../src/core/plan.js';
import { agreedSaid, digestHead, digestOf, digestText, feedOf, HISTORY_FORMAT, historyHead, historyOf, historyProblems, historyText, historyTold, inPeriod, movedSaid, periodSaid, reachSaid, saidWhen, seenOf, sinceSaid, sinceSeen, spanSaid, toldLines, toldOf, type Told } from '../src/core/told.js';
import { feedFor } from '../scripts/feed.js';
import { loadFlowDir, signinsDir } from './helpers/notebooks.js';

const latency = (max: number): RuleEdit => ({ op: 'setRule', rule: { id: 'latency_ms_range', file: 'auth', column: 'latency_ms', kind: 'range', min: 0, max, action: 'flag' } });
const change = (id: string, from: string, recorded: string, kind: ChangeSet['kind'], edits: RuleEdit[], more: Partial<ChangeSet> = {}): ChangeSet => ({ id, from, recorded, by: 'owner', why: `Why ${id}`, ...(kind ? { kind } : {}), edits, ...more });

/** The sign-ins with a small history: a band tightened by its owner, a change that waits, a mistake corrected, one
 * still to come; and three events. */
const CHANGES: ChangeSet[] = [
  change('tight', '2024-03-04', '2024-03-01T16:30:00Z', 'business', [latency(20_000)], { agreed: [{ by: 'owner', at: '2024-03-01T16:30:00Z' }], decided: { by: 'Sam', on: '2024-02-29' }, because: { event: 'outage' } }),
  change('fixed', '2024-03-01', '2024-03-12T09:40:00Z', 'corrected', [latency(25_000)]),
  change('waits', '2024-03-11', '2024-03-08T10:00:00Z', 'business', [latency(15_000)]),
  change('later', '2024-04-01', '2024-03-20T10:00:00Z', 'retuned', [latency(30_000)]),
];
const EVENTS: FlowEvent[] = [
  { id: 'outage', name: 'Identity provider outage', from: '2024-02-28', until: '2024-02-28', kind: 'incident', about: ['auth'], note: 'Sign-ins failed for an hour', recorded: '2024-02-28T12:00:00Z', by: 'sam', excuses: [{ dataset: 'auth', check: 'amount' }] },
  { id: 'freeze', name: 'Change freeze', from: '2024-03-25', until: '2024-03-31', kind: 'freeze', recorded: '2024-03-22T15:00:00Z', by: 'sam' },
  { id: 'push', name: 'MFA push', from: '2024-03-01', kind: 'campaign', recorded: '2024-03-01T09:00:00Z', by: 'owner' },
];
const flow = async (): Promise<FlowDocument> => ({ ...(await loadFlowDir(signinsDir)), changes: CHANGES });
const steps = new Map([['tight', { day: '2024-03-04', measured: 12, moved: [{ measure: 'rows:auth_checked', with: 980, without: 1000 }] }]]);
const told = async (today = '2024-03-15', asOf: string | null = null) => toldOf(await flow(), { today, asOf, events: EVENTS, steps });
const byId = (ts: readonly Told[], id: string) => ts.find((t) => t.id === id)!;

describe('the ontology’s changes and events, told once', () => {
  it('says each change with its days, its kind, what it did and why, who made, decided and agreed, what it reaches and its step', async () => {
    const all = await told();
    expect(all.map((t) => `${t.is}:${t.id}`)).toEqual(['event:outage', 'change:fixed', 'event:push', 'change:tight', 'change:waits', 'event:freeze', 'change:later']);
    const tight = byId(all, 'tight');
    expect(tight).toMatchObject({
      is: 'change', from: '2024-03-04', kind: 'business', kindSaid: 'The business changed', why: 'Why tight', by: 'Owner', how: 'ahead', lead: 3, tense: 'in force',
      decided: { by: 'Sam', on: '2024-02-29' }, agreed: [{ by: 'Owner', at: '2024-03-01T16:30:00Z' }], agreeing: 'same', waitsFor: '', about: ['auth'], because: 'Identity provider outage',
      step: { day: '2024-03-04', measured: 12, moved: ['rows of auth_checked 1,000 → 980'] },
    });
    expect(tight.what).toHaveLength(1);
    expect(tight.downstream.length).toBeGreaterThan(0);
    // A mistake corrected asks for no agreement; one that waits says whose it waits for; one still to come is coming.
    expect(byId(all, 'fixed')).toMatchObject({ agreeing: 'none', agreed: [], how: 'back', lead: -11, tense: 'in force' });
    expect(byId(all, 'waits')).toMatchObject({ agreeing: 'waiting', tense: 'waiting', waitsFor: 'the owner of Sign-ins (Owner)' });
    expect(byId(all, 'later')).toMatchObject({ agreeing: 'none', tense: 'coming' });
    // An event: what it was called, its note, who wrote it down, what it excuses; going on, over or still to come.
    expect(byId(all, 'outage')).toMatchObject({ is: 'event', kindSaid: 'Going on: an incident', what: ['Identity provider outage'], why: 'Sign-ins failed for an hour', by: 'Sam', tense: 'ended', about: ['auth'], excuses: 'a rise or a drop in how much arrives, in auth' });
    expect(byId(all, 'push')).toMatchObject({ tense: 'in force', about: [], downstream: [] });
    expect(byId(all, 'freeze')).toMatchObject({ tense: 'coming', how: 'ahead', lead: 3 });
  });

  it('reads as known at a moment: what was written down later isn’t told, and an agreement given later isn’t counted', async () => {
    const early = await told('2024-03-15', '2024-03-05T00:00:00Z');
    expect(early.map((t) => t.id)).toEqual(['outage', 'push', 'tight']);
    const doc = await flow();
    const late: ChangeSet = { ...CHANGES[2]!, agreed: [{ by: 'owner', at: '2024-03-14T09:00:00Z' }] };
    const then = toldOf({ ...doc, changes: [late] }, { today: '2024-03-15', asOf: '2024-03-10T00:00:00Z' });
    expect(then.map((t) => [t.id, t.agreeing, t.tense])).toEqual([['waits', 'waiting', 'waiting']]);
    expect(toldOf({ ...doc, changes: [late] }, { today: '2024-03-15' }).map((t) => [t.agreeing, t.tense])).toEqual([['same', 'in force']]);
  });

  it('says each in lines: days and kind, what, why, who, what it reaches', async () => {
    const all = await told();
    const tight = byId(all, 'tight');
    expect(spanSaid(tight)).toBe('From Mon Mar 4');
    expect(saidWhen(tight)).toBe('said Fri 1, 3 days ahead');
    expect(agreedSaid(tight)).toBe('Agreed to by Owner, who also made it: one person held both roles.');
    expect(reachSaid(tight)).toMatch(/^Reaches auth, and \d+ datasets built from it\.$/);
    const lines = toldLines(tight);
    expect(lines[0]).toBe('From Mon Mar 4 · said Fri 1, 3 days ahead · The business changed');
    expect(lines).toContain('Why: “Why tight”');
    expect(lines).toContain('Recorded by Owner; decided by Sam on Thu 29. Agreed to by Owner, who also made it: one person held both roles.');
    expect(lines).toContain('Because of: Identity provider outage.');
    expect(lines.at(-1)).toMatch(/Its own step, Mon 4: run both ways, the change alone moved 1 measure of 12 \(rows of auth_checked 1,000 → 980\)\.$/);
    expect(agreedSaid(byId(all, 'waits'))).toBe('Waits for the agreement of the owner of Sign-ins (Owner): in force on no day until then.');
    expect(agreedSaid(byId(all, 'fixed'))).toBe('');
    expect(saidWhen(byId(all, 'fixed'))).toBe('recorded Tue 12, back-dated 11 days');
    expect(toldLines(byId(all, 'outage'))).toEqual([
      'Wed Feb 28 · written down on its first day · Going on: an incident',
      'Identity provider outage',
      'Why: “Sign-ins failed for an hour”',
      'Written down by Sam.',
      expect.stringMatching(/^Reaches auth, and \d+ datasets built from it\. Excuses a rise or a drop in how much arrives, in auth\.$/),
    ]);
    expect(spanSaid(byId(all, 'push'))).toBe('From Fri Mar 1, still going on');
    expect(reachSaid(byId(all, 'push'))).toBe('About the flow as a whole.');
  });
});

describe('a period’s digest (Q-278)', () => {
  it('holds what began, was said or was agreed to in the period, what was going on in it, and what waits or is coming', async () => {
    const all = await told();
    // The week of Mon Mar 4: the band began; the correction was recorded later, and reaches back before the week.
    expect(inPeriod(all, '2024-03-04', '2024-03-10').map((t) => t.id)).toEqual(['push', 'tight', 'waits']);
    // March: everything but the outage of February; the freeze is going on at its end.
    expect(inPeriod(all, '2024-03-01', '2024-03-31').map((t) => t.id)).toEqual(['fixed', 'push', 'tight', 'waits', 'freeze', 'later']);
    expect(inPeriod(all, '2024-02-26', '2024-03-03').map((t) => t.id)).toEqual(['outage', 'fixed', 'push', 'tight']);
  });

  it('sorts it by what a reader does with each, and says it as text', async () => {
    const d = digestOf('Sign-ins', await told(), '2024-03-01', '2024-03-31');
    expect(d.waiting.map((t) => t.id)).toEqual(['waits']);
    expect(d.coming.map((t) => t.id)).toEqual(['later']);
    expect(d.changed.map((t) => t.id)).toEqual(['tight', 'fixed']);
    expect(d.goingOn.map((t) => t.id)).toEqual(['push', 'freeze']);
    expect(digestHead(d)).toBe('2 changes, 1 more coming, 1 waiting for agreement and 2 things going on.');
    const text = digestText(d).split('\n');
    expect(text.slice(0, 4)).toEqual(['Sign-ins: the ontology, March 2024', '2 changes, 1 more coming, 1 waiting for agreement and 2 things going on.', '', 'WAITING FOR AGREEMENT']);
    expect(text).toContain('- From Mon Mar 11 · said Fri 8, 3 days ahead · The business changed');
    expect(text).toContain('  Recorded by Owner. Waits for the agreement of the owner of Sign-ins (Owner): in force on no day until then.');
    expect(text.indexOf('COMING')).toBeLessThan(text.indexOf('CHANGED'));
    expect(text.indexOf('CHANGED')).toBeLessThan(text.indexOf('GOING ON'));
    // A period with nothing says so.
    const none = digestOf('Sign-ins', await told(), '2023-01-01', '2023-01-07');
    expect(digestText(none)).toBe('Sign-ins: the ontology, Sun Jan 1 to Sat Jan 7, 2023\nNothing changed, and nothing was written down as going on.');
    expect(periodSaid('2024-03-04', '2024-03-04')).toBe('Mon Mar 4, 2024');
  });
});

describe('since a browser last looked (Q-278)', () => {
  it('says nothing the first time, then what is new and what moved', async () => {
    const before = await told('2024-03-10', '2024-03-10T00:00:00Z');
    expect(sinceSeen(before, null)).toBeNull();
    const seen = seenOf(before);
    expect(sinceSeen(before, seen)).toEqual({ fresh: [], moved: [] });
    expect(sinceSaid({ fresh: [], moved: [] })).toBe('');
    // Ten days on, as known now: a correction and a change to come were recorded, an event written down; nothing moved.
    const after = await told('2024-03-20');
    const since = sinceSeen(after, seen)!;
    expect(since.fresh.map((t) => t.id)).toEqual(['fixed', 'freeze', 'later']);
    expect(since.moved).toEqual([]);
    expect(sinceSaid(since)).toBe('2 changes and 1 event new.');
    // The change that waited is agreed to; the freeze, which was coming, is going on; the push has an end and is over.
    const doc = await flow();
    const agreed = doc.changes!.map((c) => (c.id === 'waits' ? { ...c, agreed: [{ by: 'owner', at: '2024-03-21T09:00:00Z' }] } : c));
    const events = EVENTS.map((e) => (e.id === 'push' ? { ...e, until: '2024-03-24', recorded: '2024-03-24T17:00:00Z' } : e));
    const later = toldOf({ ...doc, changes: agreed }, { today: '2024-03-26', events });
    const moved = sinceSeen(later, seenOf(after))!;
    expect(moved.fresh).toEqual([]);
    expect(moved.moved.map((m) => [m.told.id, movedSaid(m)])).toEqual([['push', 'over since'], ['waits', 'agreed to since'], ['freeze', 'going on now']]);
    expect(sinceSaid(moved)).toBe('3 that moved.');
  });
});

describe('the feed the build writes (Q-278)', () => {
  it('is an Atom feed: what waits and what is coming first, each entry with an id that stays its own', async () => {
    const xml = feedOf(await told(), { title: 'Sign-ins: the ontology', flow: { id: 'signins' }, made: '2024-03-15T00:00:00Z' });
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">')).toBe(true);
    expect(xml.trimEnd().endsWith('</feed>')).toBe(true);
    const ids = [...xml.matchAll(/<entry>\s*<id>([^<]+)<\/id>/g)].map((m) => m[1]);
    expect(ids).toEqual(['urn:smaltfl:signins:change:waits', 'urn:smaltfl:signins:event:freeze', 'urn:smaltfl:signins:change:later', 'urn:smaltfl:signins:change:tight', 'urn:smaltfl:signins:change:fixed', 'urn:smaltfl:signins:event:push', 'urn:smaltfl:signins:event:outage']);
    expect(xml).toContain('<id>urn:smaltfl:signins:ontology</id>');
    // The feed is as new as the last thing written down or agreed to in it.
    expect(xml).toContain('<updated>2024-03-22T15:00:00.000Z</updated>');
    expect(xml).toMatch(/<title>Waits for agreement: [^<]+ \(from Mon Mar 11\)<\/title>/);
    expect(xml).toMatch(/<title>Coming: Change freeze \(Mon Mar 25 to Sun Mar 31\)<\/title>/);
    expect(xml).toContain('<link rel="alternate" href="./#ontology/change/tight"/>');
    expect(xml).toContain('<category term="business" label="The business changed"/>');
    expect(xml).toContain('<author><name>Sam</name></author>');
    // Every tag opened is closed, and what people wrote is escaped.
    const odd = feedOf(toldOf({ ...(await flow()), changes: [change('amp', '2024-03-04', '2024-03-01T10:00:00Z', 'retuned', [latency(1)], { why: 'R&D said "<5s>"' })] }, { today: '2024-03-15' }), { title: 'A & B', flow: { id: 'x' }, made: '2024-03-15T00:00:00Z', home: 'https://example.org/app/' });
    expect(odd).toContain('<title>A &amp; B</title>');
    expect(odd).toContain('Why: “R&amp;D said &quot;&lt;5s&gt;&quot;”');
    expect(odd).toContain('href="https://example.org/app/#ontology/change/amp"');
    for (const tag of ['feed', 'entry', 'title', 'id', 'updated', 'summary', 'published']) expect((xml.match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length).toBe((xml.match(new RegExp(`</${tag}>`, 'g')) ?? []).length);
  });
});

describe('the history for an auditor (Q-279)', () => {
  it('says who owns the ontology and every change and event of the period, as things stood at its end', async () => {
    const doc = await flow();
    const hash = await flowHash(doc);
    const h = historyOf(doc, hash, '2024-03-01', '2024-03-31', { events: EVENTS, steps });
    expect(h).toMatchObject({ format: HISTORY_FORMAT, flow: { id: doc.id, name: doc.name, hash }, from: '2024-03-01', to: '2024-03-31', asOf: null, owners: [{ part: doc.name, owners: ['Owner'] }] });
    expect(h.changes.map((c) => [c.id, c.tense, c.agreeing])).toEqual([['fixed', 'in force', 'none'], ['tight', 'in force', 'same'], ['waits', 'waiting', 'waiting'], ['later', 'coming', 'none']]);
    expect(h.events.map((e) => [e.id, e.tense])).toEqual([['push', 'in force'], ['freeze', 'in force']]);
    expect(h.shipped).toBeUndefined();
    expect(historyHead(h)).toBe('4 changes to the ontology, 2 asking for an owner’s agreement (1 still waits); 2 events written down as going on.');
    const text = historyText(h).split('\n');
    expect(text[0]).toBe(`${doc.name}: the ontology’s history, March 2024`);
    expect(text).toContain('WHO OWNS IT');
    expect(text).toContain(`- ${doc.name}: Owner`);
    expect(text).toContain('CHANGES');
    expect(text).toContain('GOING ON');
  });

  it('is made again from the flow the record kept and the record’s own events and steps, and held to them', async () => {
    const doc = await flow();
    const hash = await flowHash(doc);
    const h = historyOf(doc, hash, '2024-03-01', '2024-03-31', { events: EVENTS, steps });
    const given = { events: EVENTS, steps };
    expect(historyProblems(JSON.parse(JSON.stringify(h)), doc, hash, given)).toEqual([]);
    // A reason reworded, an agreement added, a change left out, one made up, another flow, other owners.
    const edit = (f: (x: typeof h) => void) => { const x = JSON.parse(JSON.stringify(h)) as typeof h; f(x); return historyProblems(x, doc, hash, given); };
    expect(edit((x) => { x.changes[1]!.why = 'A better story'; })).toEqual(["the change tight isn't as the flow and the record have it"]);
    expect(edit((x) => { x.changes[2]!.agreeing = 'agreed'; x.changes[2]!.agreed = [{ by: 'Owner', at: '2024-03-09T00:00:00Z' }]; })).toEqual(["the change waits isn't as the flow and the record have it"]);
    expect(edit((x) => { x.changes.splice(0, 1); })).toEqual(['it leaves out the change fixed']);
    expect(edit((x) => { x.events.push({ ...x.events[0]!, id: 'made-up' }); })).toEqual(["it has an event made-up the flow and the record don't have in the period"]);
    expect(edit((x) => { x.flow.hash = 'f'.repeat(64); })).toEqual([`it says it was made from the flow ffffffffffffffff…, and the flow the record kept is ${hash.slice(0, 16)}…`]);
    expect(edit((x) => { x.owners[0]!.owners = ['Sam']; })).toEqual(["the owners it names aren't the flow's"]);
    expect(historyProblems({ format: 'other' }, doc, hash, given)).toEqual([`it isn't shaped as a history (${HISTORY_FORMAT}: flow, from, to, owners, changes, events)`]);
    // A step the record doesn't keep isn't the record's to say: the history that claims it isn't held.
    expect(historyProblems(JSON.parse(JSON.stringify(h)), doc, hash, { events: EVENTS })).toEqual(["the change tight isn't as the flow and the record have it"]);
  });

  it('keeps what came with the build’s data apart: its events and its steps are shown, and aren’t the record’s', async () => {
    const doc = await flow();
    const hash = await flowHash(doc);
    const mine = EVENTS.filter((e) => e.id === 'push');
    const h = historyOf(doc, hash, '2024-03-01', '2024-03-31', { events: mine, shipped: { events: EVENTS, steps } });
    expect(h.events.map((e) => e.id)).toEqual(['push']);
    expect(h.changes.find((c) => c.id === 'tight')!.step).toBeUndefined();
    expect(h.shipped).toEqual({ events: [expect.objectContaining({ id: 'freeze' })], steps: [{ change: 'tight', day: '2024-03-04', measured: 12, moved: ['rows of auth_checked 1,000 → 980'] }] });
    // Held: the record's part is the record's, whatever came with the build.
    expect(historyProblems(JSON.parse(JSON.stringify(h)), doc, hash, { events: mine })).toEqual([]);
    // Read, a change has its step and the events are all there, the build's marked.
    const read = historyTold(h);
    expect(read.changes.find((c) => c.id === 'tight')!.step).toEqual({ day: '2024-03-04', measured: 12, moved: ['rows of auth_checked 1,000 → 980'] });
    expect(read.events.map((e) => [e.id, e.shipped ?? false])).toEqual([['push', false], ['freeze', true]]);
    expect(historyText(h)).toContain('  Came with the build’s data: not in this record.');
    expect(historyHead(h)).toBe('4 changes to the ontology, 2 asking for an owner’s agreement (1 still waits); 2 events written down as going on.');
  });
});

describe('Larkspur’s March, told', () => {
  const dir = new URL('../examples/larkspur/', import.meta.url);
  const story = JSON.parse(readFileSync(new URL('story.json', dir), 'utf8')) as { changes: ChangeSet[]; events: FlowEvent[] };

  it('is four changes and six events, the catalogue’s control agreed to by the security lead', async () => {
    const top = await loadFlowDir(dir);
    const doc = { ...top, changes: [...(top.changes ?? []), ...story.changes] };
    const all = toldOf(doc, { today: '2024-03-31', events: story.events });
    expect(all.filter((t) => t.is === 'change').map((t) => [t.id, t.agreeing, t.by])).toEqual([['findings-values-hold', 'none', 'Owner'], ['acting-leader', 'same', 'Sloane Marsden'], ['waf-band-tenth', 'same', 'Owner'], ['sbom-declared', 'agreed', 'Owner']]);
    expect(all.filter((t) => t.is === 'event')).toHaveLength(6);
    const sbom = byId(all, 'sbom-declared');
    expect(agreedSaid(sbom)).toBe('Agreed to by Sloane Marsden on Wed 27.');
    expect(sbom.about).toEqual(['control_catalog']);
    expect(byId(all, 'acting-leader')).toMatchObject({ estate: 'Larkspur estate', about: [], downstream: [] });
    const d = digestOf(doc.name, all, '2024-03-25', '2024-03-31');
    expect(digestHead(d)).toBe('2 changes and 2 things going on.');
    expect(d.changed.map((t) => t.id)).toEqual(['sbom-declared', 'findings-values-hold']);
  });

  it('tells the same from the flow as a record keeps it, which has no notebook cell to write a gate in', async () => {
    const top = await loadFlowDir(dir);
    const doc = { ...top, changes: [...(top.changes ?? []), ...story.changes] };
    const full = toldOf(doc, { today: '2024-03-31', events: story.events });
    expect(byId(full, 'findings-values-hold').what).toEqual(['Set the values check on findings to hold (it was warn)']);
    expect(toldOf(withoutDisplay(doc) as FlowDocument, { today: '2024-03-31', events: story.events })).toEqual(full);
    // The sign-ins' rules, switched, set, taken off and a check toggled: each said the same from the kept document.
    const signins = await loadFlowDir(signinsDir);
    const edits: RuleEdit[] = [
      latency(20_000),
      { op: 'switchRule', file: 'auth', id: 'country_required', on: false },
      { op: 'removeRule', file: 'auth', id: 'country_required' },
      { op: 'setCheck', node: 'auth', check: 'values', mode: 'warn' },
      { op: 'setCheck', node: 'auth', check: 'values', mode: 'hold' },
    ];
    const each = { ...signins, changes: edits.map((e, i) => change(`c${i}`, '2024-03-04', `2024-03-01T1${i}:00:00Z`, 'retuned', [e])) };
    const told = toldOf(each, { today: '2024-03-15' });
    expect(told.map((t) => t.what[0])).not.toContain('nothing that applies to the rules of its day');
    expect(toldOf(withoutDisplay(each) as FlowDocument, { today: '2024-03-15' })).toEqual(told);
  });

  it('is the feed its site publishes: read from the last day the build recorded, each entry a link into the Ontology view', async () => {
    const top = await loadFlowDir(dir);
    const doc = { ...top, changes: [...(top.changes ?? []), ...story.changes] };
    const entry = (seq: number, kind: string, at: string, about: unknown) => ({ smaltflLog: 'log/1', origin: 'build', seq, kind, at, by: { card: null, as: 'build' }, about, reason: null });
    const month = { format: 'smaltfl-month/1', flow: doc.id, build: 'test', now: '2024-04-01T08:00:00Z', manifests: {}, entries: [
      entry(0, 'run', '2024-03-16T07:00:00Z', { day: '2024-03-16' }),
      entry(1, 'run', '2024-03-17T07:00:00Z', { day: '2024-03-17' }),
    ] };
    // Read from Sun 17, the last day run: the WAF band, said on Fri 15 for Mon 18, is still coming, and comes first.
    const early = feedFor(doc, { events: story.events, month, days: ['2024-03-01', '2024-03-31'], made: '2024-04-01T08:00:00Z' });
    expect(early.today).toBe('2024-03-17');
    expect(early.entries).toBe(10);
    const titles = (xml: string) => [...xml.matchAll(/<entry>\s*<id>([^<]+)<\/id>\s*<title>([^<]+)<\/title>/g)].map((m) => [m[1]!.replace('urn:smaltfl:larkspur:', ''), m[2]!.split(':')[0]]);
    expect(titles(early.xml).slice(0, 4)).toEqual([['change:waf-band-tenth', 'Coming'], ['event:change-freeze', 'Coming'], ['change:sbom-declared', 'Coming'], ['event:scanner-no-login', 'Going on']]);
    // With no month recorded, it reads from the last day the build has data for: everything has begun by then.
    const late = feedFor(doc, { events: story.events, month: null, days: ['2024-03-01', '2024-03-31'], made: '2024-04-01T08:00:00Z' });
    expect(late.today).toBe('2024-03-31');
    expect(titles(late.xml).map((t) => t[1])).not.toContain('Coming');
    expect(late.xml).toContain('<link rel="alternate" href="./#ontology/change/sbom-declared"/>');
    expect(late.xml).toContain('<link rel="alternate" href="./#ontology/event/change-freeze"/>');
    expect(late.xml).toContain('<title>Larkspur estate: the ontology</title>');
    // As new as the last thing written down or agreed to: the catalogue's control, agreed to on Wed 27 at 09:15.
    expect(late.xml).toContain('<updated>2024-03-27T09:15:00.000Z</updated>');
  });
});
