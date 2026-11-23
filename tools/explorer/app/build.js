// Larkspur built from nothing: its 22 files read one at a time on the explorer's own map, each proposing from its own
// data what one row is, its key, the kind of thing it describes and what it points at, each proposal shown with its
// evidence and open to change; then six months of history, the checks each file's gate runs, the outputs and their own
// checks, and the record's days from Feb 1 to Wed Mar 27, where the demo starts. A day that pauses is yours to decide,
// in the explorer's own Decide panel, with what Larkspur's owners chose marked; a corrected file arrives on the day it
// really did and is decided in the same panel. Words, one a thing: paused, warned, published, decided.
(() => {
  const X = () => window.__explore;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (n) => (n == null ? '' : Number(n).toLocaleString('en-US'));
  let DATA = null, FULL = null, B = null;
  const KEY = 'smaltfl-build-v4';
  const fresh = () => ({ added: [], off: {}, on: {}, names: {}, kinds: {}, keys: {}, linkMode: { 'exceptions.approver_id': 'new', 'cloud_assets.app_tag': 'note' }, modes: {}, step: 'files', reading: null, history: false, rules: false, product: false, day: -1, dec: {}, applied: {}, peek: null, map: false, ckNote: null });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(B)); } catch (e) { /* storage may be off */ } };
  const restore = () => { try { const b = JSON.parse(localStorage.getItem(KEY) || 'null'); return b && Array.isArray(b.added) ? { ...fresh(), ...b } : null; } catch (e) { return null; } };

  // ---------------------------------------------------------------- the data
  const fileOf = (id) => DATA.files.find((f) => f.id === id);
  const fname = (f) => `${f.id}.csv`;
  const kindOf = (id) => DATA.kinds.find((k) => k.id === id) || ownKind(id);
  const fullDs = (id) => FULL.datasets.find((d) => d.id === id);
  const isAdded = (id) => B.added.includes(id);
  const PL = { application: 'applications', org_unit: 'units', person: 'people', platform: 'platforms', control: 'controls' };
  const ONE = { application: 'application', org_unit: 'organisational unit', person: 'person', platform: 'platform', control: 'control' };
  // what one row of a file is, where the file isn't its kind's own list
  const ONE_ROW = { exceptions: 'One version of an exception', cloud_assets: 'One application’s resources in a cloud account', control_requirements: 'One control mapped to one requirement', platform_links: 'One link between two platforms', findings: 'One vulnerability finding' };
  const NAMES = { hr_people: 'People', findings: 'Scanner findings' };
  const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  const poss = (n) => (/s$/i.test(n) ? `${n}’` : `${n}’s`);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + 's'}`;
  const nameOfFile = (id) => B.names[id] || NAMES[id] || fileOf(id)?.short || id;
  const plOf = (kid) => (String(kid).startsWith('own:') ? ownKind(kid).plural : PL[kid] || kid);
  const linkKey = (from, col) => `${from}.${col}`;
  const NAMED = new Set(['owned by', 'runs on', 'reports into', 'led by', 'managed by', 'works in', 'acted for by', 'tagged with', 'depends on', 'approved by']);
  // a named link is on unless it was turned off; a unit's acting leader is the story's own change, from Mon Mar 11
  const dayOnScreen = () => (B.day < 0 ? null : B.peek != null ? DATA.days[B.peek].day : DATA.days[B.day].day);
  const linkOn = (from, col, rel) => { const k = linkKey(from, col); if (k in B.off) return !B.off[k]; return rel !== 'acted for by' || (B.applied['acting-leader'] === true && (dayOnScreen() || '') >= '2024-03-11'); };
  // a file's kind: as Larkspur filed it, another kind it points at, or a kind of its own
  const kindOfFile = (id) => (B.kinds[id] === 'own' ? `own:${id}` : B.kinds[id] || fileOf(id)?.kind || fullDs(id)?.kind);
  function ownKind(kid) {
    if (!String(kid).startsWith('own:')) return null;
    const f = fileOf(kid.slice(4)), one = (OWN_NAME[f.id] || f.noun || 'row').toLowerCase(), many = one.endsWith('s') ? one : one + 's';
    return { id: kid, name: cap(one), plural: many, noun: one, icon: 'control', register: f.id, count: f.columns.find((c) => c.name === (f.key2 || [])[0])?.distinct || f.rows };
  }

  // ---------------------------------------------------------------- the days: dates said as the explorer says them
  const DAY = 864e5;
  const isoOf = (t) => new Date(t).toISOString().slice(0, 10);
  const dayLabel = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
  const wdLong = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const dShort = (iso) => `${dayLabel(iso).slice(0, 3)} ${+iso.slice(8, 10)}`;
  const before = (iso) => isoOf(new Date(iso + 'T12:00:00Z').getTime() - DAY);
  const ctxOf = (iso) => ({ iso, today: dayLabel(iso), prev: dayLabel(before(iso)), wd: wdLong(iso), pwd: wdLong(before(iso)), d: dShort(iso), pd: dShort(before(iso)), first: 'Fri Mar 1' });
  const dayIdx = (iso) => DATA.days.findIndex((d) => d.day === iso);
  // a daily file's usual size on a day, the one every screen uses: the median of its 28 days before, empty days left out
  const usualOn = (id, iso) => { const f = fileOf(id), i = dayIdx(iso); return f && f.usual && i >= 0 ? usualAt(id, i) : null; };
  const countOn = (id, iso) => { const f = fileOf(id), i = dayIdx(iso); return f && f.counts && i >= 0 ? f.counts[i] : null; };
  const LAST = '2024-03-27';
  const today = () => (B.day >= 0 ? DATA.days[B.day].day : null);
  const hhmm = (at) => String(at || '').slice(11, 16);
  const whenSaid = (at, H) => (at ? `${at.slice(0, 10) !== H ? dayLabel(at.slice(0, 10)) + ', ' : ''}${hhmm(at)}` : '');
  const dot = (s) => (/[.!?”]$/.test(s) ? s : s + '.');

  // ---------------------------------------------------------------- the days that paused: what the checks saw, and the choices
  // `decideOn`: the first day a decision can be made (Saturday's empty EDR file is filled from Sunday's);
  // `fixOn`: the day the corrected file arrives in the record; `fixRows`: its rows; `diff`: what the corrected file changed
  const ISSUES = {
    '2024-02-16': { file: 'hr_org_units', kind: 'short', why: 'lost a department its teams still report into', cause: 'lost Payments Engineering, which 4 teams report into', title: 'Friday’s Org units file lost a department', sub: '4 teams report into Payments Engineering (DEP-18), which isn’t in the file', stoppedBy: ['App owners: Payments (BU-06) has 3.5% of applications, usually 7.5%'], options: ['fix', 'keep', 'wait'], noun: 'owner chains', ask: false, fixOn: '2024-02-16', fixAt: 'Fri Feb 16, 11:20', fixRows: 245, diff: 'Moves the 4 teams under Payments Operations', sug: 'Larkspur’s pick, at 11:45',
      pros: { fix: 'Every team has a department again', keep: 'Readers keep Thursday’s reporting lines', wait: 'Nothing uncertain goes out' },
      cons: { keep: 'The 6 outputs show Thursday from every file they read, not just Org units; the corrected file goes unused', wait: 'The 6 outputs stay held' } },
    '2024-02-26': { file: 'mfa', kind: 'empty', noun: 'MFA results', fixOn: '2024-02-27', fixAt: 'Tue Feb 27, 02:40', fixRows: 2318, diff: '0 → 2,318 rows', nextFile: 'early on Tue Feb 27, in the record', sug: 'Larkspur’s pick: the vendor runs it again tonight', sugFix: 'Larkspur’s pick: the full export',
      cons: { keep: 'The 11 outputs show Sunday from every file they read, not just MFA', fill: 'A real Monday MFA failure wouldn’t show', asis: 'Posture looks better than it is: MFA failures count as no data' } },
    '2024-03-05': { file: 'logging_coverage', kind: 'shift', why: 'moved: 691 applications left the log-dc pipeline', title: 'Tuesday’s logging: 691 applications moved off log-dc', sub: 'More than a quarter of its rows: log-dc 43% → 8% of applications', stoppedBy: ['Logging: a pipeline’s share moved by more than a quarter of its rows'], options: ['asis', 'accept', 'keep', 'wait'], owes: false, risky: [], ask: false, noun: 'logging results', asisAfter: 'Tuesday goes out as it arrived; tomorrow is judged against the old level', sug: 'Larkspur’s pick: let the level hold a second day first',
      pros: { asis: 'Readers see the move as it happened', accept: 'Judged against the new level from today: no pause tomorrow if it holds', keep: 'Readers keep Monday’s logging', wait: 'Nothing uncertain goes out' },
      cons: { asis: 'Tomorrow pauses again if the level stays', accept: 'Were it a mistake, it would become the usual', keep: 'Readers don’t see Tuesday’s move, and tomorrow pauses again', wait: 'The 11 outputs stay held' },
      fileThen: { asis: 'Tomorrow asks again unless you accept the level', keep: 'Tomorrow asks again unless you accept the level', wait: 'Stays on your list' } },
    '2024-03-06': { file: 'logging_coverage', kind: 'shift', why: 'stayed at its new level', title: 'Wednesday’s logging stayed at the new level', sub: 'log-dc still 8% of applications, usually 43%: the move held a second day', stoppedBy: ['Logging: a pipeline’s share moved by more than a quarter of its rows'], options: ['accept', 'asis', 'keep', 'wait'], owes: false, risky: [], ask: false, noun: 'logging results', asisAfter: 'Wednesday goes out as it arrived; tomorrow pauses again', sug: 'Larkspur’s pick: the migration is done',
      pros: { accept: 'From today Logging is judged against its new level; a new move would still pause', asis: 'Readers see Wednesday as it arrived', keep: 'Readers see Tuesday’s logging, the move included', wait: 'Nothing uncertain goes out' },
      cons: { accept: 'Were it a mistake, it would become the usual', asis: 'Tomorrow pauses again', keep: 'Wednesday’s logging waits unpublished', wait: 'The 11 outputs stay held' },
      fileThen: { asis: 'Tomorrow asks again unless you accept the level', keep: 'Tomorrow asks again unless you accept the level', wait: 'Stays on your list' } },
    '2024-03-11': { file: 'backup_jobs', kind: 'wrong', why: 'COMPLETED fell to 64.6% of jobs (950 of 1,471)', title: 'Monday’s backups: COMPLETED fell to 64.6% of jobs', sub: 'Usually 94–97%; the rest are PARTIAL', stoppedBy: ['Backups: COMPLETED’s share moved by more than a quarter of its rows'], options: ['fill', 'keep', 'wait', 'asis'], fillFrom: 'Sun Mar 10', fillFromD: 'Sun 10', fillFromWd: 'Sunday', noun: 'backup results', fixOn: '2024-03-13', fixAt: 'Wed Mar 13, 03:10', fixRows: 1486, diff: 'COMPLETED 950 → 1,427 jobs', nextFile: 'on Wed Mar 13, in the record', sug: 'Larkspur’s pick: carry Sunday forward', sugFix: 'Larkspur’s pick: Monday’s own file',
      pros: { fill: 'Monday goes out: only Backups is Sunday’s, marked filled; the other 21 files are Monday’s' }, cons: { fill: 'A backup that really failed Monday shows Sunday’s pass', keep: 'The 11 outputs show Sunday from every file they read, not just Backups', asis: 'A third of the backups look unfinished' } },
    '2024-03-21': { file: 'tls', kind: 'twice', why: 'came with every application twice', title: 'Thursday’s TLS file: every application came twice', sub: '815 applications, 1,630 rows', stoppedBy: ['TLS: no app_id repeated'], options: ['fix', 'keep', 'wait'], noun: 'certificate results', ask: false, fixOn: '2024-03-21', fixAt: 'Thu Mar 21, 14:10', fixRows: 815, diff: '1,630 → 815 rows', sug: 'Larkspur’s pick: every certificate once',
      pros: { fix: 'Every certificate once', keep: 'Readers keep Wednesday’s certificates', wait: 'Nothing uncertain goes out' },
      cons: { keep: 'The 11 outputs show Wednesday from every file they read, not just TLS; the corrected file goes unused', wait: 'The 11 outputs stay held' } },
    '2024-03-23': { file: 'edr_coverage', kind: 'empty', noun: 'EDR results', decideOn: '2024-03-24', options: ['fill', 'keep', 'wait', 'asis'], fillFrom: 'Sun Mar 24', fillFromD: 'Sun 24', fillFromWd: 'Sunday', fillAfter: true, fillOwes: false, sug: 'Larkspur’s pick: “nothing deploys at the weekend”',
      pros: { fill: 'Saturday goes out: only EDR is Sunday’s, marked filled; the other 21 files are Saturday’s' }, cons: { fill: 'Sunday’s changes appear on Saturday: 107 applications changed EDR status from Friday to Sunday, and any that changed on Sunday show it a day early', keep: 'The 11 outputs show Friday from every file they read, not just EDR', asis: 'Posture looks better than it is: all 1,991 applications EDR covers show no data' }, fileThen: { fill: 'Done for now · reopens if a file comes' } },
    '2024-03-27': { file: 'access_reviews', demo: true },
  };
  // what the corrected file showed, said once it is in, with who sent it
  const EVIDENCE = {
    '2024-02-16': (e) => `HR’s file sent again moved ${e.moved.length} teams from ${e.gone.map((g) => `${g.name} (${g.id})`).join(', ')}, a department no longer in the file, to ${e.moved[0].toName} (${e.moved[0].to}).`,
    '2024-02-26': (e) => `The vendor’s file sent again has ${fmt(e.rows2)} rows; the first had ${fmt(e.rows1)}.`,
    '2024-03-11': (e) => { const c1 = Object.fromEntries(e.states1), c2 = Object.fromEntries(e.states2); return `The backup team’s corrected file says ${fmt(c1.PARTIAL - c2.PARTIAL)} of the PARTIAL jobs had completed: COMPLETED ${fmt(c1.COMPLETED)} → ${fmt(c2.COMPLETED)}.`; },
    '2024-03-21': (e) => `The first file had each of its ${fmt(e.twice)} applications twice, both rows identical, none conflicting; the file sent again is the first with the repeats taken out, row for row (${fmt(e.rows1)} → ${fmt(e.rows2)} rows). Against Wed 20 it moved as any day does: status changed on 27 rows, 35 the day before.`,
  };
  const REC = { asis: 'asis', fill: 'fill', dont: 'wait', accept: 'accept', keep: 'keep' };
  const recHow = (s) => (s.option === 'asis' && s.delivery ? 'fix' : REC[s.option] || s.option);
  const OPTION = { asis: 'published it as is', fill: 'filled it from another day', wait: 'kept it paused', accept: 'accepted Logging’s new level as the usual one', keep: 'kept the last good day', fix: 'published the corrected file', stay: 'kept what was decided' };
  const YOU = { keep: 'Kept the last good day', fill: 'Filled it from another day', wait: 'Waited for the file', asis: 'Published it as is', accept: 'Accepted Logging’s new level as the usual one', fix: 'Published the corrected file', stay: 'Kept what you decided' };
  const WHO = { ciso: 'Sloane Marsden', owner: 'Sloane Marsden' };
  function recordOf(H) {
    const st = DATA.days[dayIdx(H)].story || [];
    const decs = st.filter((s) => s.kind === 'decision'), first = decs[0] || null;
    const fix = decs.find((s) => s.delivery && s !== first) || null;
    const ctx = st.filter((s) => (s.kind === 'delivery' || s.kind === 'event') && (!first || s.at <= first.at));
    return { first, fix, ctx, delivery: st.find((s) => s.kind === 'delivery') || null };
  }
  const issueDays = () => Object.keys(ISSUES).filter((H) => B.day >= 0 && H <= today());
  const accepted = (H) => (B.dec[H] || []).some((c) => c.how === 'accept');
  // where a paused day stands on the day on screen: "stay" keeps a decision as it was, and only says the corrected file was seen
  function standing(H, on = today()) {
    const I = ISSUES[H]; if (!I || !on || H > on) return null;
    if (H === '2024-03-06' && accepted('2024-03-05')) return { skipped: true };
    if (!pausesHere(H)) return { skipped: true, yours: true };
    const ch = B.dec[H] || [], last = ch[ch.length - 1], eff = [...ch].reverse().find((c) => c.how !== 'stay'), fix = ch.find((c) => c.how === 'fix');
    const fixIn = !!I.fixOn && on >= I.fixOn;
    if (fix) return { open: false, closedOn: fix.on, replaced: true, last: fix, ch, fixIn };
    // a choice is final where nothing more is to come, or where it was made with the corrected file in view
    if (eff && eff.how !== 'wait' && (eff.how === 'accept' || !I.fixOn || (eff.how === 'asis' && I.owes === false) || (eff.how === 'fill' && I.fillOwes === false) || (fixIn && last.on >= I.fixOn))) return { open: false, closedOn: last.on, last: eff, ch, filled: eff.how === 'fill', stayed: last.how === 'stay' };
    const needs = !I.demo && ((!last && (I.decideOn || H) <= on) || (fixIn && (!last || last.on < I.fixOn)) || (!!I.decideOn && on >= I.decideOn && !!last && last.how === 'wait' && last.on < I.decideOn));
    return { open: true, state: !eff || eff.how === 'wait' ? 'waiting' : 'decided', last: eff || last, ch, fixIn, needs, canDecide: (I.decideOn || H) <= on };
  }
  // the checks that paused a day in Larkspur's record, where they were the file's own: set them to warn or off and the day goes out with a warning
  const PAUSED_BY = { '2024-02-16': ['out:app_owners', 'out:org_chain'], '2024-02-26': ['amount', 'scope'], '2024-03-05': ['learned'], '2024-03-06': ['learned'], '2024-03-11': ['learned'] };
  const modeBy = (I, c) => (c.startsWith('out:') ? outModeOf(c.slice(4)) : checkOf(fileOf(I.file), c));
  const yoursOff = (H) => { const by = PAUSED_BY[H], I = ISSUES[H]; return !!by && !!I && by.every((c) => modeBy(I, c) === 'off'); };
  const pausesHere = (H) => { const by = PAUSED_BY[H], I = ISSUES[H]; if (!by || !I || I.demo) return true; return by.some((c) => { const m = modeBy(I, c); return m === 'hold' || m === 'learn'; }); };
  const needsYou = () => issueDays().some((H) => standing(H)?.needs);
  const needing = () => issueDays().find((H) => standing(H)?.needs);
  // the explorer's issue for a paused day, on the day on screen: the record's choice suggested, its reason prefilled and said to be theirs
  // the data an owner's reason rests on, shown beside it
  const countBars = (fid, days, usualOf) => { const f = fileOf(fid); if (!f || !f.counts) return ''; const rows = days.map(([d, label, c]) => [label, c ?? f.counts[dayIdx(d)]]); const mx = Math.max(1, ...rows.map((r) => r[1] || 0), usualOf || 0); return `<span class="evbars cb" aria-label="${esc(nameOf(fid))} rows by day">${rows.map(([t, c]) => `<span class="evb${!c ? ' zero' : ''}"><i style="height:${Math.max(2, Math.round(((c || 0) / mx) * 40))}px"></i><b>${fmt(c || 0)}</b><small>${esc(t)}</small></span>`).join('')}${usualOf ? `<span class="evu" style="bottom:${Math.round((usualOf / mx) * 40) + 30 - 13}px">usual ${fmt(usualOf)}</span>` : ''}</span>`; };
  const SUG_EVIDENCE = { '2024-03-27': () => { const f = fileOf('access_reviews'); if (!f || !f.counts) return ''; return `${countBars('access_reviews', [['2024-03-25', 'Mon'], ['2024-03-26', 'Tue'], ['2024-03-27', 'Wed', 0]], (f.usual || [])[dayIdx('2024-03-27')])}<span class="evsay">Access reviews has never arrived empty since Aug 1: an empty file is a fault, not a change. Keep shows readers all of Tuesday; Fill shows Wednesday with Tuesday’s reviews copied in, marked filled.</span>`; } };
  const NOTE_EVIDENCE = {
    '2024-02-26': (s) => { const f = fileOf('mfa'); if (!f || !f.counts) return ''; const u = (f.usual || [])[dayIdx('2024-02-26')], again = !!(s && s.fixIn); return `${countBars('mfa', [['2024-02-25', 'Sun'], ['2024-02-26', 'Mon, first', 0], ...(again ? [['2024-02-26', 'Mon, sent again', ISSUES['2024-02-26'].fixRows]] : [])], u)}<span class="evsay">MFA lists the CMDB’s live and retiring applications, about ${fmt(u)} a day (usual, last 28 days). ${again ? `Monday’s first file had none; the export sent again Tue 02:40 had ${fmt(ISSUES['2024-02-26'].fixRows)}.` : 'Monday’s first file had none.'}</span>`; },
    '2024-03-23': () => { const e = (DATA.xtab || {})['edr.weekend']; if (!e) return ''; const bars = [['Wed → Thu', e.wedThu], ['Thu → Fri', e.thuFri], ['Fri → Sun', e.friSun]]; const mx = Math.max(...bars.map((b) => b[1])); return `<span class="evbars wide" aria-label="EDR status changes">${bars.map(([t, n]) => `<span class="evb"><i style="height:${Math.round((n / mx) * 44)}px"></i><b>${fmt(n)}</b><small>${t}</small></span>`).join('')}</span><span class="evsay">From Friday to Sunday, ${fmt(e.friSun)} of Sunday’s ${fmt(e.rows)} applications changed EDR status: about one weekday’s churn, over two days (last weekend, ${fmt(e.lastWeekend)}).</span>`; },
    '2024-03-06': () => { const v = (DATA.xtab || {})['logging.logdc']; if (!v) return ''; const days = [['Mon', v['2024-03-04']], ['Tue', v['2024-03-05']], ['Wed', v['2024-03-06']]]; return `<span class="evbars" aria-label="log-dc’s share of applications">${days.map(([d, p]) => `<span class="evb"><i style="height:${Math.max(3, p)}px"></i><b>${p}%</b><small>${d}</small></span>`).join('')}</span><span class="evsay">log-dc’s share of applications: 43% on Monday, 8.2% on Tuesday and again on Wednesday. The level held a second day.</span>`; },
    '2024-03-11': (s) => { const t = (DATA.xtab || {})['backup_jobs.state_status']; if (!t) return ''; if (s && s.fixIn && t.fixed) return `<table class="evtab"><caption>Backups by state and status: Monday’s first file → its corrected file</caption><thead><tr><th></th><th>pass</th><th>fail</th></tr></thead><tbody>${['COMPLETED', 'PARTIAL', 'FAILED'].map((k) => `<tr class="${k === 'PARTIAL' ? 'hi' : ''}"><th>${k}</th><td>${fmt(t.today[k].pass)} → <b>${fmt(t.fixed[k].pass)}</b></td><td>${fmt(t.today[k].fail)} → <b>${fmt(t.fixed[k].fail)}</b></td></tr>`).join('')}${(() => { const sum = (o, c) => ['COMPLETED', 'PARTIAL', 'FAILED'].reduce((a, k) => a + (o[k][c] || 0), 0); return `<tr class="tot"><th>All</th><td>${fmt(sum(t.today, 'pass'))} → <b>${fmt(sum(t.fixed, 'pass'))}</b></td><td>${fmt(sum(t.today, 'fail'))} → <b>${fmt(sum(t.fixed, 'fail'))}</b></td></tr>`; })()}</tbody></table><span class="evsay">In the corrected file no partial backup passes: ${fmt(t.today.PARTIAL.pass)} → ${fmt(t.fixed.PARTIAL.pass)}; COMPLETED passes ${fmt(t.fixed.COMPLETED.pass)}, as on Sunday.</span>`; return `<table class="evtab"><caption>Backups by state and status, in Monday’s first file and Sunday’s</caption><thead><tr><th></th><th>pass Mon</th><th class="sun">Sun</th><th>fail Mon</th><th class="sun">Sun</th></tr></thead><tbody>${['COMPLETED', 'PARTIAL', 'FAILED'].map((k) => `<tr class="${k === 'PARTIAL' ? 'hi' : ''}"><th>${k}</th><td>${fmt(t.today[k].pass)}</td><td class="sun">${fmt(t.before[k].pass)}</td><td>${fmt(t.today[k].fail)}</td><td class="sun">${fmt(t.before[k].fail)}</td></tr>`).join('')}${(() => { const sum = (o, c) => ['COMPLETED', 'PARTIAL', 'FAILED'].reduce((a, k) => a + (o[k][c] || 0), 0); return `<tr class="tot"><th>All</th><td>${fmt(sum(t.today, 'pass'))}</td><td class="sun">${fmt(sum(t.before, 'pass'))}</td><td>${fmt(sum(t.today, 'fail'))}</td><td class="sun">${fmt(sum(t.before, 'fail'))}</td></tr>`; })()}</tbody></table><span class="evsay">${fmt(t.today.PARTIAL.pass)} partial backups passed in Monday’s first file; on Sunday none did.</span>`; },
  };
  function issueFor(H, s) {
    const I = ISSUES[H]; if (I.demo) return { chain: chainSteps(H), chainHtml: chainFor(H), chainFold: true, preselect: false, fig: usualFig('access_reviews', H), sev: sevOf(H) };
    const rec = recordOf(H), fixNow = s.fixIn, decidedNow = s.state === 'decided' && s.last ? s.last : null;
    let options = I.options ? I.options.slice() : ['keep', 'fill', 'wait', 'asis'];
    if (fixNow && decidedNow) options = ['fix', 'stay'];
    else if (fixNow) options = ['fix', ...options.filter((k) => k !== 'asis' && k !== 'wait' && k !== 'fix')].slice(0, 4);
    if (!s.canDecide) options = options.filter((k) => k !== 'fill');
    const ORDER = ['fix', 'keep', 'fill', 'wait', 'asis', 'accept', 'stay']; if (I.kind !== 'shift' || fixNow) options.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const recFirst = rec.first ? recHow(rec.first) : null, recNow = fixNow && rec.fix ? rec.fix : rec.first;
    const suggest = fixNow ? 'fix' : !s.canDecide ? 'wait' : recFirst && options.includes(recFirst) ? recFirst : I.suggest0 && options.includes(I.suggest0) ? I.suggest0 : options[0];
    const ownersChose = !!recNow && recHow(recNow) === suggest;
    const sugText = !s.canDecide ? 'In Larkspur’s record no one decided on Saturday' : ownersChose ? `Owner’s pick · ${who(recNow.by).split(' ')[0]}, ${whenSaid(recNow.at, H)}` : I.sugText0 || 'Suggested';
    const { file, sug, sugFix, decideOn, fixOn, fixRows, diff, cause, ...rest } = I;
    const cons = { ...(rest.cons || {}) }, pros = { ...(rest.pros || {}) }, changes = {}, buttons = {}, prevD = dayLabel(before(H)), wd = wdLong(H);
    if (fixNow) {
      changes.fix = H === '2024-02-16' ? 'Moves the 4 teams from Payments Engineering to Payments Operations' : `Replaces the first file: ${diff}`; buttons.fix = 'Publish the corrected file';
      cons.fix = decidedNow ? `What readers saw for ${wd} changes` : '';
      if (H === '2024-02-16') cons.fix = 'One person (P-0087) still works in Payments Engineering: the People file wasn’t corrected';
      cons.keep = `The ${waitsOf(H).length} outputs show ${prevD} for all 22 files; the corrected file goes unused (the record keeps it)`; cons.fill = 'Doesn’t use the corrected file (the record keeps it)'; cons.stay = 'Doesn’t use the corrected file (the record keeps it)';
      pros.fix = pros.fix || (I.fixOn !== H ? `Readers see ${wdLong(H)}’s file as sent again, ${I.fixAt}` : 'Readers see the day with the corrected file');
    }
    if (decidedNow) {
      const how = decidedNow.how;
      buttons.stay = how === 'fill' ? 'Keep the fill' : how === 'keep' ? `Keep ${prevD}` : 'Keep it as it is';
      pros.stay = how === 'fill' ? `Readers keep ${wd} filled from ${I.fillFromWd || 'the day before'}` : how === 'keep' ? `Readers keep ${prevD}’s data for ${wd}` : 'Readers keep what they see now';
    }
    if (H < today()) { pros.keep = `${wd} shows ${wdLong(before(H))}’s data`; if (I.fillFromWd) pros.fill = `${wd} shows ${I.fillFromWd}’s rows, marked filled`; }
    const fileThen = { ...(rest.fileThen || {}), ...(fixNow ? { fix: '', stay: '', keep: '', fill: '' } : {}) };
    const now = decidedNow ? { nowHow: decidedNow.how, nowSaid: decidedNow.how === 'fill' ? `Readers see ${dShort(H)}, filled from ${I.fillFromD}` : decidedNow.how === 'keep' ? `Readers see ${prevD} for ${dShort(H)}` : `Readers see ${dShort(H)} as it arrived`, outSaid: `${waitsOf(H).length} outputs went out ${decidedNow.how === 'fill' ? 'filled' : decidedNow.how === 'keep' ? `with ${dShort(before(H))}’s data` : 'as it arrived'}` } : {};
    return { ...rest, ...now, noteEvidence: NOTE_EVIDENCE[H] ? NOTE_EVIDENCE[H](s) : '', ...(SUG_EVIDENCE[H] && !(recNow && s.canDecide && ownersChose) ? { sugEvidence: SUG_EVIDENCE[H](), sugText: 'Keep: an empty file is a fault here' } : {}), acceptUndo: H === '2024-03-06' || H === '2024-03-05' ? 'undo puts Logging back on its old level: the next day judged by it pauses again' : undefined, cons, pros, changes, buttons, fileThen, stayFinal: true, owes: fixNow ? false : rest.owes, options, suggest, sugText: SUG_EVIDENCE[H] && !(recNow && s.canDecide && ownersChose) ? 'Keep: an empty file is a fault here' : sugText, sugBy: ownersChose || !s.canDecide, preselect: false, chain: chainSteps(H), chainHtml: chainFor(H), chainFold: true, fig: ['empty', 'twice', 'rows'].includes(I.kind) ? usualFig(I.file, H, { fixed: fixNow && I.fixRows != null ? I.fixRows : null }) : '', rowsDiff: I.kind === 'rows' ? rowDiffPart(I.file, H) : '', fixSaid: H === '2024-02-16' ? 'Org units passes every check; App owners and Org chain clear; People still warns: P-0087 is in the gone department' : `${(() => { const ev = DATA.days[dayIdx(H)].evidence; return ev && EVIDENCE[H] ? EVIDENCE[H](ev) + ' ' : ''; })()}It passed every check`, tomorrow: I.kind === 'shift' ? dShort(isoOf(new Date(H + 'T12:00:00Z').getTime() + DAY)) : undefined, bannerWait: !s.canDecide ? 'Sunday’s file can fill it tomorrow' : undefined, note: recNow && s.canDecide && ownersChose ? recNow.reason : '', noteFrom: `${who(recNow?.by)}’s reason`, noteOffer: !!(recNow && recNow.reason && s.canDecide && ownersChose), agreeWho: who(recNow?.by), agreeRole: ROLE[who(recNow?.by)] || '', tune: tuneOf(H, I), sev: sevOf(H), agreeAt: recNow ? `${dayLabel(recNow.at.slice(0, 10))}, ${hhmm(recNow.at)}` : '', answer: rec.first ? `<b>Larkspur’s owners</b> ${esc(OPTION[recHow(rec.first)])}: “${esc(rec.first.reason)}”` : undefined };
  }
  // the rows behind a count: which went and which came against the same weekday a week before, by the file's key
  function rowDiffPart(fid, H) {
    const r = ((DATA.rowdiff || {})[fid] || {})[H]; if (!r) return '';
    const by = Object.entries(r.goneBy || {}).sort((a, b) => b[1] - a[1]), dated = r.cols[1], live = r.goneRows.filter((x) => x[1] && x[1] !== 'expired' && x[1] !== 'superseded');
    const yd = (d) => `${md(d)}${d.slice(0, 4) !== '2024' ? `, ${d.slice(0, 4)}` : ''}`, span = (rows) => { const ds = rows.map((x) => x[2]).filter(Boolean).sort(); return ds.length ? (ds[0] === ds[ds.length - 1] ? yd(ds[0]) : `${md(ds[0])} to ${yd(ds[ds.length - 1])}`) : ''; };
    const exp = r.goneRows.filter((x) => x[1] === 'expired');
    // integrator r1: one short line; each row's dates sit in the table behind See them
    const head = `<b>${plural(r.gone, 'row')} went</b> since ${dayLabel(r.base)}, ${plural(r.new, 'came', 'came')}`, liveK = new Set(live.map((x) => x[1]));
    const rest = by.filter(([k]) => !liveK.has(k)), why = rest.length ? `: ${rest.map(([k, n]) => `${n} ${esc(k || 'no status')}`).join(', ')}` : '';
    const ask = live.length ? `. <b class="ask">${live.length} still ${esc(live[0][1])}, ${live.map((x) => `<code>${esc(x[0])}</code>`).join(', ')}: worth asking about.</b>` : '.';
    const list = (rows, cap) => rows.length ? `<table class="rdl"><caption>${esc(cap)}</caption>${rows.map((x) => `<tr><td><code>${esc(x[0])}</code></td>${x.slice(1).map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>` : '';
    return `<div class="rdiff"><p>${head}${why}${ask}</p><details><summary>See them ›</summary>${list(r.goneRows, `Went (${r.gone})`)}${list(r.newRows, `Came (${r.new})`)}</details></div>`;
  }
  // a new level, taken as usual from the day it began: the running middle of the days since, your limit kept
  function levelAt(fid, i) {
    const f = fileOf(fid), y = DATA.days[i]; if (!f || !y) return null;
    const lv = ((B.levelFrom || {})[fid] || []).filter((c) => c.from <= y.day).slice(-1)[0]; if (!lv) return null;
    const i0 = dayIdx(lv.from), vals = f.counts.slice(i0, i).filter((v) => v != null).sort((a, b) => a - b);
    return vals.length ? vals[Math.floor((vals.length - 1) / 2)] : f.counts[i0];
  }
  const usualAt = (fid, i) => levelAt(fid, i) ?? (fileOf(fid)?.usual || [])[i] ?? null;
  // when your own stricter limit alone paused a day: how often it has, and setting it back from that day
  function tuneOf(H, I) {
    if (!I || !I.mine || I.kind !== 'rows') return null;
    const fx = figFacts(I.file, H); if (!fx || !figLimits(fx).mineOnly) return null;
    const L = fx.L, dd = limitDays(I.file, L, H), d5 = limitDays(I.file, 5, H), nm = esc(nameOf(I.file));
    const v0 = figVerdict(fx), lvFrom = v0.cls === 'near' ? DATA.days[Math.max(0, fx.i - 5)].day : null;
    const ahead = lvFrom ? (() => { const keep = B.levelFrom; B.levelFrom = { ...(keep || {}), [I.file]: [...(((keep || {})[I.file]) || []), { from: lvFrom }] }; const n = DATA.days.filter((y, k) => y.day > H && y.day <= LAST && (() => { const u = usualAt(I.file, k), c = fileOf(I.file).counts[k]; return u && c != null && Math.abs((c - u) / u) > L / 100; })()).length; B.levelFrom = keep; return n; })() : 0;
    return { fid: I.file, from: H, L, level: lvFrom ? `Accept ${fmt(fx.wlo)}–${fmt(fx.whi)} as usual from ${dShort(lvFrom)} ›` : '', lvFrom, levelSaid: lvFrom ? `Keeps your ±${L}%: judged against the new level, Sat 2 passes, and ±${L}% would pause ${ahead ? plural(ahead, 'more day') : 'no more days'} to Mar 27.` : '', html: `<b>Only your ±${L}% limit paused this.</b> In the 28 days to ${esc(dShort(H))}, ±${L}% would have paused ${nm} on ${plural(dd.length, 'day')} (${dd.map((k) => esc(dShort(k))).join(', ')}); Larkspur’s ±5% on ${d5.length ? plural(d5.length, 'day') : 'none'}.`, button: `Set ${poss(nameOf(I.file))} limit to ±5% from ${dShort(H)} ›` };
  }
  const waitsOf = (H) => { const x = DATA.days[dayIdx(H)], ids = new Set(FULL.outputs.map((o) => o.id)); if (ISSUES[H]?.mine) return [...new Set(fullDs(ISSUES[H].file)?.builds || [])].filter((w) => ids.has(w)); return (x.waits || []).filter((w) => ids.has(w)); };
  // the days a gap or link check you set to Pause stops: a new one appeared, on a day nothing else paused
  function syncMine() {
    const add = {};
    for (const y of DATA.days) {
      if (y.day <= '2024-02-01' || y.day > LAST || (ISSUES[y.day] && !ISSUES[y.day].mine)) continue;
      for (const [k, fresh] of [...Object.entries(y.linksNew || {}), ...Object.entries(y.gapsUp || {}).filter(([g]) => GAP_KEYS.has(g))]) {
        const fid = k.split('.')[0]; if (!fresh || fresh < ((B.gapMin || {})[k] || 1) || !isAdded(fid) || linkModeIn(fid, k) !== 'hold') continue;
        (add[y.day] ||= { mine: true, file: fid, keys: [] }).keys.push([k, fresh]);
      }
    }
    if (rowsLimit() < 5 || Object.values(B.rowsLimitOf || {}).some((v) => v < 5) || Object.keys(B.limitFrom || {}).length || Object.keys(B.levelFrom || {}).length) for (const [H, list] of Object.entries(rowsBeyond(rowsLimit(), true))) { if (ISSUES[H] && !ISSUES[H].mine) continue; const top = list.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3]))[0]; add[H] = add[H] || { mine: true, file: top[0], keys: [], rows: list }; if (!add[H].rows) add[H].rows = list; }
    for (const [fid, rl] of Object.entries(B.myRules || {})) { if (!isAdded(fid)) continue; for (const r of rl) { if (r.mode !== 'hold') continue; for (const i of brokeOn(fid, r, true) || []) { const y = DATA.days[i]; if (!y || y.day <= '2024-02-01' || y.day > LAST || (ISSUES[y.day] && !ISSUES[y.day].mine) || add[y.day]) continue; add[y.day] = { mine: true, file: fid, keys: [], myrule: r, said: myRuleOn(fid, r, y.day) }; } } }
    const all = Object.fromEntries(Object.entries(ISSUES).filter(([, v]) => !v.mine));
    for (const [H, v] of Object.entries(add)) all[H] = mineIssue(H, v);
    for (const H of Object.keys(ISSUES)) delete ISSUES[H];
    for (const H of Object.keys(all).sort()) ISSUES[H] = all[H];
  }
  function mineIssue(H, v) {
    if (v.myrule) { const prevD = dayLabel(before(H)), wd = wdLong(H), held = [...new Set(fullDs(v.file)?.builds || [])].length, tl = tolOf(v.file, v.myrule);
      return { ...v, kind: 'myrule', noun: 'rows', why: v.said, title: `Your rule paused the day: ${nameOf(v.file)} ${v.said}`, sub: `Your rule: ${myRuleSaid(v.myrule)}`, options: ['asis', 'keep', 'wait'], owes: false, risky: [], ask: false,
        asisAfter: `${wd} goes out as it arrived`, asisWhat: `${wd} is published as it arrived.`, keepAfter: `Readers see ${prevD}; nothing more is to come for this day`, keepWhat: `Readers stay on ${prevD}’s outputs.`, fileThen: { keep: 'Done with this day', asis: 'Done with this day', wait: 'Stays on your list' },
        suggest0: 'wait', sugText0: tl && tl.hi != null ? `Wait: it ran ${tl.lo.toFixed(1)}–${tl.hi.toFixed(1)}% in the 184 days; today is outside that` : 'Wait: your rule broke, and nothing says why yet',
        pros: { asis: `Readers see ${wd} as it arrived`, keep: `Readers keep ${prevD}’s outputs`, wait: 'Nothing uncertain goes out' }, cons: { asis: 'If the change is real, readers see it unexplained', keep: `The ${held} outputs show ${prevD}, other files included`, wait: `The ${held} outputs stay held` } }; }
    if (!v.keys.length && v.rows) { const [fid, c, u, off] = v.rows.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3]))[0], pct = Math.abs(off * 100).toFixed(1), held = [...new Set(fullDs(fid)?.builds || [])].length, prevD = dayLabel(before(H)), wd = wdLong(H);
      return { ...v, file: fid, kind: 'rows', noun: 'rows', why: `has ${fmt(c)} rows, ${pct}% ${off > 0 ? 'more' : 'fewer'} than its usual ${fmt(u)}`, title: `Your Rows limit paused the day: ${nameOf(fid)} ${off > 0 ? '+' : '−'}${pct}%`, sub: 'Larkspur’s Rows check pauses only beyond ±5%', options: ['asis', 'keep', 'wait'], owes: false, risky: [], ask: false,
        asisAfter: `${wd} goes out as it arrived`, asisWhat: `${wd} is published as it arrived.`, keepAfter: `Readers see ${prevD}; nothing more is to come for this day`, keepWhat: `Readers stay on ${prevD}’s outputs. The day counts as decided: nothing more is to come for it.`, fileThen: { keep: 'Done with this day', asis: 'Done with this day', wait: 'Stays on your list' },
        suggest0: 'asis', sugText0: (() => { const fx = figFacts(fid, H), fv = fx ? figVerdict(fx) : null; return fv && fv.cls === 'near' ? `Publish, not Keep: ${fmt(c)} rows is in line with the last 5 days, and inside Larkspur’s ±5%` : fv && fv.cls === 'in' ? `Publish, not Keep: ${fmt(c)} rows is inside the last 28 days, and inside Larkspur’s ±5%` : `Publish, not Keep: ${pct}% is inside Larkspur’s ±5%`; })(),
        pros: { asis: `Readers see ${wd} as it arrived`, keep: `Readers keep ${prevD}’s outputs`, wait: 'Nothing uncertain goes out' },
        cons: { asis: 'If the change is real, readers see it unexplained', keep: `The ${held} outputs show ${prevD}, other files included`, wait: `The ${held} outputs stay held` } }; }
    const [k, n] = v.keys[0], what = GAP_KEYS.has(k) ? GAP_TAG[k].replace(/^Your check on /, '') : `${nameOf(v.file)} ${k.split('.')[1]}`, held = [...new Set(fullDs(v.file)?.builds || [])].length, prevD = dayLabel(before(H)), wd = wdLong(H);
    const nw = ((DATA.xtab || {})['exceptions.newApprover'] || {})[H] || [], who0 = k === 'exceptions.approver_id' && nw.length ? `: ${nw.map((a) => `${a.id}, on ${plural(a.rows, 'exception')}`).join('; ')}` : '';
    return { ...v, kind: 'link', noun: 'rows', why: `has ${linkSaid(k, n)}, new today${who0}`, title: `Your check on ${what} paused the day: ${n} new`, sub: 'Larkspur’s own check only warns of a new one', options: ['asis', 'accept', 'keep', 'wait'], buttons: { asis: 'Publish, keep it open', accept: 'Publish, accept it as known' }, owes: false, risky: [], ask: false, asisAfter: `${wd} goes out marked ◆; the new one stays open, listed each day until someone accepts it`, asisWhat: `${wd} is published as it arrived, marked ◆; the new one stays open.`, acceptAfter: `${wd} goes out marked ◆; the new one joins the known gaps, with your reason`, acceptWhat: `${wd} is published as it arrived, marked ◆, and the new one is accepted as known.`, acceptPill: 'Published, accepted as known', acceptSaid: 'published and accepted the new one as known', keepAfter: `Readers see ${prevD}; nothing more is to come for this day`, keepWhat: `Readers stay on ${prevD}’s outputs. The day counts as decided: nothing more is to come for it.`, fileThen: { keep: 'Done with this day; a new one another day pauses that day', asis: 'Done with this day; the new one stays open', accept: 'Done with this day; the new one is known', wait: 'Stays on your list' },
      suggest0: 'asis', sugText0: 'Publish, keep it open: nothing else in the file moved, and the new one waits to be explained',
      pros: { asis: `Readers see ${wd}; nobody signs off an approver no one has named yet`, accept: `Readers see ${wd}; the new one is a known gap from today, with your reason`, keep: `Readers keep ${prevD}’s outputs; the new one stays open`, wait: 'Nothing uncertain goes out' },
      cons: { asis: 'It is listed each day until someone accepts it', accept: 'It is accepted before anyone has explained it', keep: `The ${held} outputs show ${prevD}, other files included`, wait: `The ${held} outputs stay held` } };
  }

  // ---------------------------------------------------------------- the checks: each file's gate, as Larkspur set it, and the links you keep
  const CHECKS = [
    ['schema', 'Columns', 'its columns are the ones described'],
    ['fresh', 'Fresh', 'exported on the day it covers'],
    ['amount', 'Rows', 'about as many rows as a usual day'],
    ['key', 'Key', 'no id blank or repeated'],
    ['scope', 'Scope', 'one row for each application in scope'],
    ['values', 'Values', 'only the codes it knows'],
    ['learned', 'Learned', 'each value about as common as usual; pauses at ¼: when a change moves a quarter of the day’s rows'],
    ['links', 'Links', 'every link points at something there'],
  ];
  // the links a file's Links check counts: what it points at, where that is read too; an evidence file's app_id is its Scope check's
  const linksOf = (f) => (f.joins || []).filter((j) => j.col && !j.found && !((f.scope || f.id === 'findings') && j.col === 'app_id') && (j.to === f.id || (isAdded(j.to) && (!NAMED.has(j.rel) || linkOn(f.id, j.col, j.rel)))));
  const linkModeOf = (k) => B.linkMode[k] || (GAP_KEYS.has(k) ? 'off' : 'new');
  // the mode a link's check has: what the file's Links cell was set to, else what was chosen for the link where reading found its gaps
  const linkModeIn = (fid, k) => { if (GAP_KEYS.has(k)) return linkModeOf(k); const cell = B.modes[`${fid}.links`], m = linkModeOf(k); return cell === 'off' || cell === 'note' ? cell : cell === 'warn' && m !== 'new' && m !== 'all' && m !== 'hold' ? 'new' : m; };
  function checkOf(f, c) {
    const daily = f.every === 'daily';
    const applies = { schema: true, fresh: daily, amount: daily, key: !!(f.key || f.key2), scope: !!f.scope || f.id === 'findings', values: Object.keys(f.labels || {}).length > 0, learned: daily && !!f.history, links: linksOf(f).length > 0 }[c];
    if (!applies) return null;
    if (c === 'links') { const ms = linksOf(f).map((j) => linkModeIn(f.id, linkKey(f.id, j.col))); return ms.every((m) => m === 'off') ? 'off' : ms.every((m) => m === 'note' || m === 'off') ? 'note' : 'warn'; }
    const base = c === 'learned' ? 'learn' : f.id === 'findings' && (c === 'values' || c === 'amount') ? 'warn' : 'hold';
    return B.modes[`${f.id}.${c}`] || base;
  }
  const checkCells = () => B.added.map(fileOf).flatMap((f) => CHECKS.map(([c]) => checkOf(f, c)).filter(Boolean));
  const checkCount = () => checkCells().filter((m) => m !== 'off').length;
  // what a link check says on a day: new rows pointing at nothing warn; a quiet check only notes them
  function linkFindings(x) {
    const out = [];
    const all = { ...(x.links || {}), ...Object.fromEntries(Object.entries(x.gaps || {}).filter(([k, n]) => n && linkModeOf(k) !== 'off')) };
    for (const [k, n] of Object.entries(all)) {
      const [fid, col] = k.split('.'); const f = fileOf(fid), gap = GAP_KEYS.has(k); if (!f || !isAdded(fid) || (!gap && !linksOf(f).some((j) => j.col === col))) continue;
      const mode = linkModeIn(fid, k);
      if (mode === 'off') continue;
      const fresh = x.day === '2024-02-01' ? 0 : (gap ? (x.gapsUp || {})[k] : (x.linksNew || {})[k]) || 0;
      const onNew = mode === 'new' || mode === 'hold', min = (B.gapMin || {})[k] || 1;
      if (mode === 'note' || (onNew && !fresh)) { out.push({ k, f, n, quiet: true, fresh }); continue; }
      out.push({ k, f, n: onNew ? fresh : n, quiet: false, fresh: onNew && fresh < n, pause: mode === 'hold' && fresh >= min });
    }
    return out;
  }
  // what a link check saw, counted in different values: approvers, tags, departments, units
  const LINK_SAID = {
    'exceptions.approver_id': (n) => `${plural(n, 'approver')} not among the people`,
    'cloud_assets.app_tag': (n) => `${plural(n, 'tag')} the CMDB doesn’t list`,
    'hr_org_units.parent_id': (n) => `${n === 1 ? 'a department its teams report into isn’t' : `${n} departments its teams report into aren’t`} in the file`,
    'hr_people.org_unit_id': (n) => `${n === 1 ? '1 unit someone works in isn’t' : `${n} units people work in aren’t`} in Org units`,
  };
  const linkSaid = (k, n) => (LINK_SAID[k] || GAP_SAID[k] || ((m) => `${plural(m, 'value')} point at nothing`))(n);

  // ---------------------------------------------------------------- the build's model: what has been added, drawn by the explorer
  function relationsFrom(joins, kindOfDs, ghosts, preview) {
    const by = new Map();
    for (const j of joins) {
      const a = kindOfDs(j.from), b = kindOfDs(j.to); if (!a || !b) continue;
      const name = j.rel === 'found' ? (a === b ? 'about' : 'uses') : j.rel;
      const key = `${a}|${b}|${name}`;
      if (!by.has(key)) by.set(key, { from: a, to: b, name, via: [], ghost: true });
      const r = by.get(key); r.via.push({ ds: j.from, col: j.col }); if (!ghosts.has(j.from) && !ghosts.has(j.to)) r.ghost = false;
    }
    return [...by.values()].map((r) => {
      const m = FULL.relations.find((x) => x.from === r.from && x.to === r.to && x.name === r.name);
      const label = r.name === 'evidence for' ? `evidence for · ${r.via.length} file${r.via.length === 1 ? '' : 's'}` : m ? m.label : r.name;
      const acting = r.name === 'acted for by', inForce = acting && (dayOnScreen() || '') >= '2024-03-11';
      return { ...r, joins: r.via.length, label, since: acting && inForce ? '2024-03-11' : null, soon: acting && !inForce ? 'Mon\u00a0Mar\u00a011' : null, proposed: acting && !inForce && B.applied['acting-leader'] !== true, ghost: (r.ghost && ghosts.size > 0) || (!!preview && acting) };
    });
  }
  // peer:builder — what draws a line between two kinds: the column on each side, or that the file it points at isn't read
  // yet, with the rows not found said in words. The files it touches, both ends. None for a link no column carries.
  function lineWhy(r, pointedAt) {
    const js = (r.via || []).map((v) => ({ v, j: (fileOf(v.ds)?.joins || []).find((x) => x.col === v.col) })).filter((x) => x.j);
    if (!js.length || js.some(({ j }) => !j.col || !j.toCol)) return null;
    const j = js[0].j; if (!js.every((x) => x.j.col === j.col && x.j.toCol === j.toCol)) return null;
    const files = new Set(js.flatMap((x) => [x.v.ds, x.j.to]));
    if (js.every((x) => pointedAt.has(x.j.to))) return { text: `${j.col} → not read yet`, miss: 0, files };
    const miss = js.reduce((a, x) => a + (x.j.missN || 0), 0);
    const lost = miss ? ` · ${fmt(miss)} ${miss === 1 ? 'row' : 'rows'} not found` : '';
    return { text: `${j.col} → ${j.toCol}${js.length > 1 ? ` · ${js.length} files` : ''}${lost}`, short: miss ? `${j.col}${lost}` : null, miss, files };
  }
  // the link that puts a file in its kind, found in its data where Larkspur's model has none
  function definingJoin(f) { const kl = kindLinks(f), k = kindOfFile(f.id); return kl.find((x) => x.kind === k)?.j || null; }
  function syncModel() {
    const ghosts = new Set(B.step === 'read' && B.reading && !isAdded(B.reading) && !asksKind(fileOf(B.reading)) ? [B.reading] : B.step === 'feeds' ? DATA.order.filter((id) => !isAdded(id) && fileOf(id).scope && !(B.skipFeed || {})[id]) : []);
    // while a file is read, the kinds it points at that no file has brought yet are drawn dashed too, with the links it would make
    if (['read', 'files'].includes(B.step) && B.added.length + (B.reading ? 1 : 0) < DATA.files.length) for (const id of [...B.added, ...(B.step === 'read' && B.reading && !isAdded(B.reading) ? [B.reading] : [])]) for (const j of fileOf(id)?.joins || []) { const to = j.to && fileOf(j.to); if (to && to.register && j.to !== id && !isAdded(j.to) && to.kind !== fileOf(id).kind) ghosts.add(j.to); }
    const added = new Set([...B.added, ...ghosts]);
    // peer:builder — a file pointed at but not read: the map shows only what the files read say of it (how many they name),
    // not its own rows, name or links, which nobody has seen yet
    const pointedAt = new Set([...ghosts].filter((id) => id !== B.reading && fileOf(id)?.register && !isAdded(id)));
    const namedIn = (reg) => { let best = null; for (const id of [...B.added, ...(B.reading && !isAdded(B.reading) ? [B.reading] : [])]) for (const j of fileOf(id)?.joins || []) if (j.to === reg && j.col && id !== reg && (!best || (j.distinct || 0) > (best.j.distinct || 0))) best = { id, j }; return best ? { said: `${nameOfFile(best.id)} names ${plural(best.j.distinct || 0, ONE[fileOf(reg).kind] || 'thing', PL[fileOf(reg).kind])}`, short: `named in ${nameOfFile(best.id)}` } : null; };
    const st = dayStates();
    const kindIds = new Set([...added].map(kindOfFile).filter((k) => { const reg = kindOf(k)?.register; return reg && added.has(reg); }));
    const kinds = [...kindIds].map((kid) => {
      const base = FULL.kinds.find((k) => k.id === kid) || ownKind(kid), reg = kindOf(kid).register;
      return { ...base, name: B.kindNames?.[kid] || base.name, plural: plOf(kid), datasets: [...added].filter((id) => kindOfFile(id) === kid).sort((a, b) => (a === reg ? -1 : b === reg ? 1 : DATA.order.indexOf(a) - DATA.order.indexOf(b))), count: kindOf(kid).register && String(kid).startsWith('own:') ? ownKind(kid).count : fileOf(reg)?.rows ?? base.count, ghost: ghosts.has(reg), pointed: pointedAt.has(reg) ? namedIn(reg)?.said || null : null, pointedShort: pointedAt.has(reg) ? namedIn(reg)?.short || null : null /* peer:builder */ };
    });
    const kin = new Set(kinds.map((k) => k.id));
    const datasets = [...added].filter((id) => kin.has(kindOfFile(id))).map((id) => {
      const d = fullDs(id), s = st[id] || {}, f = fileOf(id);
      const u = B.day >= 0 ? usualOn(id, s.day || today()) : null;
      const causeOnly = s.state === 'waiting' && !!s.day && !ISSUES[s.day]?.mine && !(DATA.days[dayIdx(s.day)].holds || []).some((h) => h.replace(/_checked$/, '') === id);
      return { ...d, kind: kindOfFile(id), short: pointedAt.has(id) ? fname(f) : nameOfFile(id), pointed: pointedAt.has(id) /* peer:builder: not named until read */, ghost: ghosts.has(id), badge: badgeOf(f), state: s.state || 'ok', causeOnly, issue: s.issue, pendingFix: s.pendingFix, how: s.how, waited: s.waited, note: s.note, replaced: s.replaced, days: monthDays(d), rowsToday: rowsNow(d, s), rowsUsual: u ? [u, u] : d.rowsUsual, builds: B.product ? s.builds || d.builds : [] };
    });
    const din = new Set(datasets.map((d) => d.id));
    const found = DATA.files.flatMap((f) => (f.joins || []).filter((j) => j.found && (B.on[linkKey(f.id, j.col)] || definingJoin(f) === j)).map((j) => ({ from: f.id, to: j.to, col: j.col, toCol: j.toCol, rel: 'found' })));
    const dos = dayOnScreen() || '', preview = B.step === 'days' && dos >= '2024-03-08' && dos < '2024-03-11' && B.applied['acting-leader'] !== 'skip';
    const joins = [...FULL.joins, ...found].filter((j) => din.has(j.from) && din.has(j.to) && !pointedAt.has(j.from) /* peer:builder: no links from a file not read */ && (!NAMED.has(j.rel) || linkOn(j.from, j.col, j.rel) || (preview && j.rel === 'acted for by')));
    const relations = relationsFrom(joins, kindOfFile, ghosts, preview);
    // peer:builder — while files are read, the line being checked (the file read, or the one just added) names its columns,
    // and so does a line with rows not found; every other line names them when pointed at. Once all are in, only those
    // with rows not found say it unasked.
    if (['read', 'files'].includes(B.step)) {
      const allIn = B.step === 'files' && !nextFile(), focus = new Set(B.step === 'read' && B.reading ? [B.reading] : !allIn && B.added.length ? [B.added[B.added.length - 1]] : []);
      for (const r of relations) { const w = lineWhy(r, pointedAt); if (!w) continue; if ([...w.files].some((id) => focus.has(id))) r.why = w.text; else if (w.miss) r.why = w.short; else r.whyHov = w.text; }
    }
    const M = X().models.build || (X().models.build = {});
    const open = datasets.find((d) => d.state === 'waiting') || datasets.find((d) => d.state === 'decided') || datasets.find((d) => d.replaced);
    const wait = new Set(), rel = new Map();
    for (const d of datasets) { if (d.state === 'waiting') for (const o of d.builds) wait.add(o); if (d.state === 'decided') for (const o of d.builds) rel.set(o, d.how); }
    const rebuilt = new Set(datasets.filter((d) => d.replaced).flatMap((d) => d.builds));
    const openDay = open ? st[open.id]?.day : null;
    Object.assign(M, {
      estate: 'Larkspur estate', day: today() || DATA.day0, todayIso: today(), /* peer:design */ kinds, datasets, joins, relations,
      outputs: B.product ? FULL.outputs.map((o) => ({ ...o, waiting: wait.has(o.id), released: rel.get(o.id), rebuilt: rebuilt.has(o.id) })) : [],
      month: monthOfEstate(), markers: [], dayCtx: openDay ? ctxOf(openDay) : today() ? ctxOf(today()) : undefined,
      latest: openDay && today() > openDay ? { iso: today(), label: dayLabel(today()) } : null,
      noRows: true, replaceable: false, quietBanner: true, doneNote: today() && standing('2024-02-16', today())?.replaced && today() === standing('2024-02-16', today()).closedOn ? 'People still warns: P-0087 is in the gone department' : '', reserveBottom: B.product ? Math.max(76, barH + 22) : 0, reserveTop: B.day >= 0 || ['history', 'rules', 'product', 'files', 'read', 'feeds'].includes(B.step), demoSugText: 'Keep: an empty file is a fault here', demoSugEvidence: SUG_EVIDENCE['2024-03-27'](), warnWord: 'warned', owedWord: 'decided for now', pauseWord: 'the day waits on it', causeWord: 'outlined: the cause the day waits on', heldWord: true, shortBanner: true, noWaitMark: true, dsWord: 'file', toastMs: 3200, pinFrom: FULL, me: B.me || '', onDecided: decided, onTune: tuned, onLevel: levelled, onDecideBanner: () => act('decide', {}), onUndo: undoLast,
    });
    document.body.classList.toggle('hasmarks', datasets.some((d) => ['waiting', 'decided', 'warn'].includes(d.state)));
    return M;
  }
  // a step drawn on the map's own chips: each file's history, its checks, what is built from it
  function badgeOf(f) {
    if (!f) return '';
    if (B.step === 'days' && f.id === 'waf' && (dayOnScreen() || '') >= '2024-03-22' && B.applied['waf-band-tenth'] !== 'skip') return B.applied['waf-band-tenth'] === true ? `<span class="k" title="pauses over 10% failing${dayOnScreen() < '2024-03-25' ? ', from Mon Mar 25' : ''}">${dayOnScreen() < '2024-03-25' ? '15→10%' : '10%'}</span>` : '<span class="k soon" title="10%, if you add it">10%?</span>';
    // peer:dq r2: on the panel cards' scale (usual ± the Rows limit and 2 points), not stretched to each file's own min and max
    if (B.step === 'history' && f.history) { const v = f.history.daily.filter((x) => x != null), t = v.slice(-28), u = usualOn(f.id, DATA.day0) || Math.round((Math.min(...t) + Math.max(...t)) / 2), L = rowsLimit() / 100 + 0.02, lo = u * (1 - L), sp = u * 2 * L || 1; return `<svg viewBox="0 0 46 14" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.2" points="${v.map((x, i) => `${((i / (v.length - 1)) * 46).toFixed(1)},${(12 - ((Math.max(lo, Math.min(lo + sp, x)) - lo) / sp) * 10).toFixed(1)}`).join(' ')}"/></svg>`; }
    if (B.step === 'rules') { const m = [...CHECKS.map(([c]) => checkOf(f, c)).filter(Boolean), ...((B.myRules || {})[f.id] || []).map((r) => r.mode)], n = (k) => m.filter((x) => x === k).length; const np = n('hold') + n('learn'); return [[np, PZ2, 'k', `pause${n('learn') ? ` (${n('learn')} at ¼)` : ''}`], [n('warn'), '◆', 'w', 'warn'], [n('note'), '○', 'n', 'note']].filter(([k]) => k).map(([k, g, c, t]) => `<span class="${c}" title="${k} ${t}">${g}${k}</span>`).join(''); }
    if (B.step === 'product') { const n = (fullDs(f.id)?.builds || []).length; return n ? `→ ${n}` : '<span title="No output reads it directly">→ 0</span>'; }
    return '';
  }
  const openDayOf = (file) => issueDays().find((H) => ISSUES[H].file === file && standing(H)?.open);
  function rowsNow(d, s) {
    const f = fileOf(d.id); if (B.day < 0) return f ? f.rows : d.rowsToday;
    if (s && s.replaced) return s.replaced.rows;
    if (s && s.issue && s.issue.kind === 'empty' && s.state === 'waiting') return 0;
    const iso = today(), c = countOn(d.id, iso); if (c != null) return c;
    if (iso >= '2024-03-01' && d.counts) { const i = +iso.slice(8, 10) - 1; return d.counts[i] ?? d.rowsToday; }
    return f ? f.rows : d.rowsToday;
  }
  function monthDays(d) {
    if (B.day < 0) return []; const iso = today(); if (iso < '2024-03-01') return [];
    const n = Math.min(27, +iso.slice(8, 10)), days = (d.days || []).slice(0, n).map((s) => (s === 'waiting' ? 'note' : s));
    for (const H of Object.keys(ISSUES)) {
      if (ISSUES[H].file !== d.id || H < '2024-03-01' || H > iso) continue;
      const s = standing(H), i = +H.slice(8, 10) - 1; if (!s || i >= n) continue;
      days[i] = s.skipped ? 'ok' : s.open && s.state === 'waiting' ? 'waiting' : 'decided';
    }
    return days;
  }
  function monthOfEstate() { if (B.day < 0) return []; const iso = today(); if (iso < '2024-03-01') return []; const n = Math.min(27, +iso.slice(8, 10)); return (FULL.month || []).slice(0, n); }
  // each file's state on the day on screen: warned today, a paused day still open, or a corrected file just in
  function dayStates() {
    const st = {}; if (B.day < 0) return st;
    const x = DATA.days[B.day];
    for (const f of x.finds || []) if (f.file && f.state === 'unusual') st[f.source] = { state: 'warn' };
    for (const l of linkFindings(x)) if (!l.quiet && !st[l.f.id]) st[l.f.id] = { state: 'warn' };
    for (const H of issueDays()) {
      const I = ISSUES[H], s = standing(H); if (!s || s.skipped) continue;
      const builds = waitsOf(H), rows = I.fixRows || fileOf(I.file)?.rows || 0;
      if (s.open) st[I.file] = { day: H, state: s.state, issue: issueFor(H, s), pendingFix: s.fixIn ? { name: `${I.file}_${H}.csv`, rows } : null, how: s.state === 'decided' ? s.last.how : undefined, waited: s.last && s.last.how === 'wait' ? { at: s.last.at || null, note: s.last.note || null } : null, note: s.last ? s.last.note : null, builds };
      else if (s.closedOn === today() && s.replaced) st[I.file] = { day: H, state: 'ok', replaced: { name: `${I.file}_${H}.csv`, rows }, builds };
    }
    return st;
  }
  // a decision made in the explorer, recorded against the paused day it is about, saying whose words its reason is
  function decided(d, how, note, agreed, whoName) {
    const H = openDayOf(d.id); if (!H) return;
    const s = standing(H), I = issueFor(H, s), theirs = agreed === true, mach = agreed === 'machine';
    if (whoName) B.me = whoName;
    (B.dec[H] ||= []).push({ how, note: note || null, theirs, agreed: theirs ? { who: I.agreeWho, at: I.agreeAt, quote: I.note } : null, ...(mach ? { from: 'smaltfl' } : {}), ...(whoName ? { by: whoName } : {}), at: new Date().toISOString(), on: today() });
    if (ISSUES[H]?.mine && how === (ISSUES[H].keys?.length ? 'accept' : 'asis')) for (const [k] of ISSUES[H].keys || []) (B.knownLater ||= {})[k] = { at: new Date().toISOString(), day: H, note: note || null, more: true };
    save(); setTimeout(() => { if (X().S.level !== 'estate') X().go({ level: 'estate' }); refreshMap(); drawPanel(true); }, 30);
  }
  function tuned(d, note) {
    const H = openDayOf(d.id); if (!H) return '';
    const fid = (ISSUES[H] && ISSUES[H].file) || d.id, was = limitOn(fid, H), fx = figFacts(fid, H), fv = fx ? figVerdict(fx) : null;
    ((B.limitFrom ||= {})[fid] ||= []).push({ from: H, L: 5, was, at: new Date().toISOString(), note: note || `Your ±${was}% limit paused a day ${fv ? fv.t.toLowerCase() : 'inside the usual swing'}; Larkspur’s ±5% wouldn’t have`, ...(note ? {} : { by: 'smaltfl' }) });
    syncMine(); save(); setTimeout(() => { if (X().S.level !== 'estate') X().go({ level: 'estate' }); refreshMap(); drawPanel(true); }, 30);
    return `${poss(nameOf(fid))} limit is ±5% from ${dShort(H)}, by you: ${dShort(H)} went out as it arrived.`;
  }
  function levelled(d, note) {
    const H = openDayOf(d.id); if (!H) return '';
    const I = ISSUES[H], fid = (I && I.file) || d.id, t0 = tuneOf(H, I); if (!t0 || !t0.lvFrom) return '';
    ((B.levelFrom ||= {})[fid] ||= []).push({ from: t0.lvFrom, at: new Date().toISOString(), on: H, note: note || `${nameOf(fid)} has run ${t0.level.replace(/^Accept /, '').replace(/ as usual.*$/, '')} since ${dShort(t0.lvFrom)}: that is its level now`, ...(note ? {} : { by: 'smaltfl' }) });
    syncMine(); save(); setTimeout(() => { if (X().S.level !== 'estate') X().go({ level: 'estate' }); refreshMap(); drawPanel(true); }, 30);
    return `${poss(nameOf(fid))} usual is its new level from ${dShort(t0.lvFrom)}, by you: ${dShort(H)} went out as it arrived.`;
  }
  function tuneLine(H) {
    const out = [];
    const tw = (c) => (c.note ? `<details class="tl-q"><summary>${c.by === 'smaltfl' ? 'smaltfl’s reading' : 'your words'}</summary><q>${esc(c.note)}</q></details>` : '<span class="tl-none">no reason given</span>'); // peer:owner (r4)
    for (const [fid, l] of Object.entries(B.limitFrom || {})) for (const c of l) if (c.from === H) out.push(tlRow({ day: tlDay(c.from), mark: '✓', cls: 'dec tuned', what: `Changed ${esc(poss(nameOf(fid)))} limit: ±${c.was}% → ±${c.L}%`, who: 'You', words: tw(c) }));
    for (const [fid, l] of Object.entries(B.levelFrom || {})) for (const c of l) if (c.on === H) out.push(tlRow({ day: tlDay(c.on), mark: '✓', cls: 'dec tuned', what: `Accepted ${esc(poss(nameOf(fid)))} new level from ${esc(dShort(c.from))}`, who: 'You · your limit kept', words: tw(c) }));
    return out.length ? `<div class="bd-tl tuned"><ol>${out.join('')}</ol></div>` : ''; // peer:owner (r4)
  }
  function undoLast() {
    let at = null, H0 = null, lim = null;
    for (const [H, l] of Object.entries(B.dec)) for (const c of l) if (!at || c.at > at) { at = c.at; H0 = H; }
    for (const [fid, l] of Object.entries(B.limitFrom || {})) l.forEach((c, k) => { if (!at || c.at > at) { at = c.at; lim = { fid, k }; } });
    let lev = null; for (const [fid, l] of Object.entries(B.levelFrom || {})) l.forEach((c, k) => { if (c.at && (!at || c.at > at)) { at = c.at; lev = { fid, k }; lim = null; } });
    if (lev) { const c = B.levelFrom[lev.fid].splice(lev.k, 1)[0]; if (!B.levelFrom[lev.fid].length) delete B.levelFrom[lev.fid]; syncMine(); save(); refreshMap(); drawPanel(true); X().toast(`Undone: ${poss(nameOf(lev.fid))} usual is as before, and ${dayLabel(c.on)} waits for your decision.`); return; }
    if (lim) { const c = B.limitFrom[lim.fid].splice(lim.k, 1)[0]; if (!B.limitFrom[lim.fid].length) delete B.limitFrom[lim.fid]; syncMine(); save(); refreshMap(); drawPanel(true); X().toast(`Undone: ${poss(nameOf(lim.fid))} limit is ±${c.was}% again, and ${dayLabel(c.from)} waits for your decision.`); return; }
    if (!H0) return;
    B.dec[H0].pop(); if (!B.dec[H0].length) delete B.dec[H0];
    save(); refreshMap(); drawPanel(true); X().toast(`Undone: ${dayLabel(H0)} waits for your decision again.`);
  }

  // ---------------------------------------------------------------- what to read next, and why
  function nextFile() {
    const left = DATA.order.filter((id) => !isAdded(id));
    if (!left.length) return null;
    const feeds = left.filter((id) => fileOf(id).scope);
    if (feeds.length >= 4 && isAdded('cmdb_apps') && DATA.order.slice(0, DATA.order.indexOf(feeds[0])).every((id) => isAdded(id))) return { feeds };
    return { id: left[0] };
  }
  function whyNext(id) {
    const f = fileOf(id);
    const into = B.added.map(fileOf).flatMap((g) => (g.joins || []).filter((j) => j.to === id && j.col && !j.found).map((j) => ({ g, j })));
    if (into.length) { const { g, j } = into[0]; return `${nameOfFile(g.id)} names ${plural(j.distinct || 0, ONE[f.kind] || 'thing', PL[f.kind])}; this file lists them`; }
    if (f.refs.length) return `${f.refs.length} other file${f.refs.length === 1 ? ' lists' : 's list'} ${PL[f.kind] || 'rows'} by its ${f.key}: read it first`;
    const out = (f.joins || []).filter((j) => j.col && isAdded(j.to) && !j.found);
    if (out.length) return `It points at ${out.map((j) => nameOfFile(j.to)).join(' and ')}`;
    return `${fmt(f.rows)} rows, ${f.columns.length} columns`;
  }

  // ---------------------------------------------------------------- the panel
  function ensurePanel() {
    let P = $('#buildpanel');
    if (!P) { P = document.createElement('aside'); P.id = 'buildpanel'; P.setAttribute('aria-label', 'Build Larkspur from its files'); document.querySelector('.app').append(P); }
    return P;
  }
  const GL = {
    file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.2L12.5 4.8v9.7H4z"/><path d="M9 1.5v3.5h3.5"/></svg>',
    rule: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13 4v3.6c0 3.2-2.2 5.6-5 6.6-2.8-1-5-3.4-5-6.6V4z"/><path d="M5.6 8.2l1.7 1.7 3.2-3.4"/></svg>',
    out: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10v8H3z"/><path d="M5.5 7.5h5M5.5 10h3"/></svg>',
    kind: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="2.4"/><path d="M5 6.5h6M5 9.5h4"/></svg>',
  };
  const STAGES = [['files', 'Files'], ['history', 'History'], ['rules', 'Checks'], ['product', 'Outputs'], ['days', 'Days']];
  const STEP_OF = { files: 'files', read: 'files', feeds: 'files', history: 'history', rules: 'rules', product: 'product', days: 'days', end: 'days' };
  function stages() {
    const done = { files: B.added.length >= DATA.files.length, history: B.history, rules: B.rules, product: B.product, days: B.day >= dayIdx(LAST) && !needsYou() && !standing(LAST)?.open };
    const sub = { files: B.added.length ? `${B.added.length} of ${DATA.files.length}` : 'read them', history: B.history ? '184 days' : 'normal days', rules: B.rules ? `${checkCount()}` : 'what pauses', product: B.product ? `${FULL.outputs.length}` : 'for readers', days: B.day >= 0 ? dShort(today()) : 'decide' };
    const cur = STEP_OF[B.step] || 'files', at = STAGES.findIndex(([k]) => k === cur);
    const waits = B.day >= 0 && (needsYou() || standing(LAST)?.open && today() === LAST);
    const reach = (k) => k !== cur && (done[k] || (k === 'days' && B.day >= 0) || (k === 'files' && B.added.length));
    if (['days', 'end', 'record'].includes(B.step) && B.product) return `<ol class="bp-steps compact" aria-label="Setup and days"><li class="done go" data-act="go" data-to="files" role="link" tabindex="0" aria-label="The setup: go back to it"><b>✓</b><span><span class="bs-n">Set up</span><small>${B.added.length} files · ${checkCount()} checks · ${FULL.outputs.length} outputs</small></span></li><li class="on${waits ? ' waits' : ''}" aria-current="step"><b>${waits ? X().PAUSE : '▸'}</b><span><span class="bs-n">Days</span><small>${B.day >= 0 ? esc(dShort(today())) : 'Feb 1 on'}</small></span></li></ol>`;
    return `<ol class="bp-steps" aria-label="Steps">${STAGES.map(([k, n], i) => `<li class="${k === cur ? 'on' : done[k] ? 'done' : ''}${k === 'days' && waits ? ' waits' : ''}${reach(k) ? ' go' : ''}" data-stage="${k}"${reach(k) ? ` data-act="go" data-to="${k}" role="link" tabindex="0" aria-label="${esc(n)}: go back to this step"` : ''}${k === cur ? ' aria-current="step"' : ''}><b>${done[k] && k !== cur ? '✓' : i + 1}</b><span><span class="bs-n">${n}</span><small>${esc(sub[k])}</small></span></li>`).join('')}</ol><p class="bp-stepnow"><button type="button" class="bp-stepbtn" data-act="steps" aria-expanded="${!!B.stepsOpen}">Step ${at + 1} of 5 · ${esc(STAGES[at][1])} ${B.stepsOpen ? '▴' : '▾'}</button><button type="button" class="bp-reset m" data-act="reset">Start again</button></p>`;
  }
  // one mark a state: every ◆ amber and every ○ muted wherever it is written, a watcher painting new text as it comes
  function paintMarks(root) {
    const el = root && (root.nodeType === 3 ? root.parentElement : root.nodeType === 1 ? root : null); if (!el || !el.isConnected) return;
    const skip = (t) => !t.parentElement || t.parentElement.closest('svg, .mk-w, .mk-n, .mk-o, script, style, textarea, option, title, .toast');
    const list = []; if (root.nodeType === 3) { if (/[◆○◇]/.test(root.data) && !skip(root)) list.push(root); } else { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let t; (t = w.nextNode());) if (/[◆○◇]/.test(t.data) && !skip(t)) list.push(t); }
    for (const t of list) { const f = document.createDocumentFragment(); for (const part of t.data.split(/([◆○◇])/)) { if (!part) continue; if (part === '◆' || part === '○' || part === '◇') { const i = document.createElement('i'); i.className = part === '◆' ? 'mk-w' : part === '◇' ? 'mk-o' : 'mk-n'; i.setAttribute('aria-hidden', 'true'); i.textContent = part; f.append(i); } else f.append(part); } t.replaceWith(f); }
  }
  function watchMarks() { if (watchMarks.on) return; watchMarks.on = true; new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') paintMarks(m.target); else for (const n of m.addedNodes) paintMarks(n); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); paintMarks(document.body); }
  function drawPanel(keep) {
    watchMarks(); syncMine();
    const P = ensurePanel(), top = keep ? P.querySelector('.bp-body')?.scrollTop || 0 : 0;
    P.dataset.step = B.step; P.classList.toggle('steps-open', !!B.stepsOpen);
    const v = view();
    if (B.said !== drawPanel.said) { drawPanel.said = B.said; drawPanel.saidAt = Date.now(); }
    if (B.said) { const left = 4000 - (Date.now() - (drawPanel.saidAt || 0)); if (left <= 0) B.said = ''; else { clearTimeout(drawPanel.sd); drawPanel.sd = setTimeout(() => { B.said = ''; drawPanel.said = ''; const el = document.querySelector('#buildpanel .bp-said'); if (el) el.remove(); }, left); } }
    if (v.foot) v.foot = v.foot.replace(/(<button[^>]*)>‹ (Back[^<]*)</g, (m0, a0, t0) => `${a0} aria-label="${t0}"><span class="bk-i" aria-hidden="true">‹</span><span class="bk-w"> ${t0}</span><`);
    const phone = matchMedia('(max-width: 760px)').matches, mini = phone && B.map && X().models.build && (X().models.build.kinds || []).length ? `<div class="bp-mini">${modelPic(X().models.build, true)}<p class="bp-mininote">A box a kind of thing; a line, kinds that relate${(X().models.build.kinds || []).some((k) => k.ghost) || (X().models.build.relations || []).some((r) => r.ghost) ? '; dashed: what this file adds' : ''} · <button type="button" class="link" data-act="mapfull">${B.mapFull ? 'The drawing' : 'Each file on the map'} ›</button></p></div>` : '';
    document.body.classList.toggle('minimap', !!mini && !B.mapFull);
    P.innerHTML = `${kindStrip()}${mini}<div class="bp-head"><div class="bp-t"><b>${['days', 'end', 'record'].includes(B.step) ? 'Larkspur, day by day' : 'Build Larkspur from its files'}</b>${B.step === 'days' ? '' : '<button type="button" class="bp-reset" data-act="reset" title="Start again from nothing">Start again</button>'}</div>${stages()}</div><div class="bp-body">${v.body}</div>${v.foot ? `<div class="bp-foot">${B.said ? `<p class="bp-said" role="status">✓ ${esc(B.said)}</p>` : v.sum ? `<p class="bp-sum">${v.sum}</p>` : ''}<div class="bp-btns">${v.foot}</div></div>` : ''}`;
    P.querySelector('.bp-body').scrollTop = top;
    P.onclick = (ev) => { const a = ev.target.closest('[data-act]'); if (a) { if (a.tagName === 'BUTTON' && a.closest('summary')) ev.preventDefault(); return act(a.dataset.act, a.dataset, ev, a); } const li = ev.target.closest('.bf-links li'); if (li && !ev.target.closest('input, a, button, details')) { const box = li.querySelector('input[type=checkbox]:not([disabled])'); if (box) { box.checked = !box.checked; box.dispatchEvent(new Event('change', { bubbles: true })); } } };
    P.onkeydown = (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('li[data-act]')) { ev.preventDefault(); ev.target.click(); } };
    P.onchange = (ev) => {
      const t = ev.target;
      if (t.matches('[data-rmode]')) { const k = `${t.dataset.rmode}.${t.dataset.rk}`, v = t.value; if (v === 'pause') delete B.modes[k]; else B.modes[k] = v; if (t.dataset.rk === 'learned' && v === 'pause') delete B.modes[k]; save(); refreshMap(); drawPanel(true); return; }
      if (t.matches('[data-rule]')) { const k = `${t.dataset.rule}.${t.dataset.rk}`; if (t.checked) delete B.modes[k]; else B.modes[k] = 'off'; save(); refreshMap(); drawPanel(true); return; }
      if (t.matches('[data-rd]')) { const dr = ((B.ruleDraft ||= {})[t.dataset.rd] ||= {}); dr[t.dataset.rdk] = t.value; if (t.dataset.rdk !== 'vals') delete dr.vals; if (t.dataset.rdk === 'col' || t.dataset.rdk === 'kind') delete dr.vals; B.ruleOpen = t.dataset.rd; save(); drawPanel(true); return; }
      if (t.matches('[data-chagree]')) { (B.chAgree ||= {})[t.dataset.chagree] = t.checked; if (t.checked) (B.chPick ||= {})[t.dataset.chagree] = 'apply'; save(); drawPanel(true); return; }
      if (t.matches('[data-chpick]')) { (B.chPick ||= {})[t.dataset.chpick] = t.value; if (t.value === 'skip') (B.chAgree ||= {})[t.dataset.chpick] = false; save(); drawPanel(true); return; }
      if (t.matches('[data-link]')) { const k = t.dataset.link, [from, col] = k.split('.'), j = (fileOf(from)?.joins || []).find((x) => x.col === col); delete B.off[k]; if (!j || linkOn(from, col, j.rel) !== t.checked) B.off[k] = !t.checked; save(); refreshMap(); drawPanel(true); } // peer:builder: back to Larkspur's own leaves no trace
      if (t.matches('[data-found]')) { B.on[t.dataset.found] = t.checked; save(); refreshMap(); drawPanel(true); }
      if (t.matches('[data-feed]')) { B.skipFeed = B.skipFeed || {}; B.skipFeed[t.dataset.feed] = !t.checked; save(); refreshMap(); drawPanel(true); }
      if (t.matches('[data-kindpick]')) { const v2 = t.value; (B.picked ||= {})[t.dataset.kindpick] = true; if (v2 === fileOf(t.dataset.kindpick).kind) delete B.kinds[t.dataset.kindpick]; else B.kinds[t.dataset.kindpick] = v2; save(); refreshMap(); drawPanel(true); }
      if (t.matches('[data-keypick]')) { B.keys[t.dataset.keypick] = t.value; save(); drawPanel(true); }
      if (t.matches('[data-ctype]')) { (B.ctypes ||= {})[t.dataset.ctype] = t.value; save(); drawPanel(true); }
      if (t.matches('[data-linkmode]')) { B.linkMode[t.dataset.linkmode] = t.value; delete B.modes[`${t.dataset.linkmode.split('.')[0]}.links`]; save(); refreshMap(); drawPanel(true); }
    };
    if (!P.dataset.tg) { P.dataset.tg = '1'; P.addEventListener('toggle', (ev) => { if (ev.target.matches && ev.target.matches('.ck-more')) { B.ckOpen = ev.target.open; save(); if (ev.target.open) ev.target.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, true); }
    P.oninput = (ev) => { const t = ev.target; if (t.matches('[data-kname]')) { B.kindNames = B.kindNames || {}; const v2 = t.value.trim(); if (v2) B.kindNames[t.dataset.kname] = v2; else delete B.kindNames[t.dataset.kname]; save(); clearTimeout(drawPanel.k); drawPanel.k = setTimeout(refreshMap, 250); return; } if (t.matches('[data-name]')) { const v2 = t.value.trim(); if (v2) B.names[t.dataset.name] = v2; else delete B.names[t.dataset.name]; save(); clearTimeout(drawPanel.t); drawPanel.t = setTimeout(refreshMap, 250); } };
    // peer:dq r2, from the builder: pointing at a gap, or tabbing to it, lights its file on the map, the file a link
    // points at, and the line whose label names the column ("approver_id · 19 rows not found")
    document.querySelectorAll('#stage .gp-lit').forEach((e) => e.classList.remove('gp-lit'));
    if (!P.dataset.gp) {
      P.dataset.gp = '1';
      const lit = (li, on) => {
        if (!li) return;
        for (const id of [li.dataset.gf, li.dataset.gt].filter(Boolean)) document.querySelectorAll(`#stage [data-id="d:${id}"]`).forEach((e) => e.classList.toggle('gp-lit', on));
        if (li.dataset.gc) document.querySelectorAll('#stage .lab').forEach((e) => { if ([...e.querySelectorAll('.lwhy')].some((w) => w.textContent.startsWith(li.dataset.gc + ' '))) e.classList.toggle('gp-lit', on); });
      };
      P.addEventListener('mouseover', (ev) => { const li = ev.target.closest('li.gp'); if (li && !li.contains(ev.relatedTarget)) lit(li, true); });
      P.addEventListener('mouseout', (ev) => { const li = ev.target.closest('li.gp'); if (li && !li.contains(ev.relatedTarget)) lit(li, false); });
      P.addEventListener('focusin', (ev) => lit(ev.target.closest('li.gp'), true));
      P.addEventListener('focusout', (ev) => lit(ev.target.closest('li.gp'), false));
      // peer:dq r2 polish (the builder's fix): a pick redraws the map's labels, so the line's outline would be lost;
      // re-light the row under the pointer, or the one with focus, whenever labels are added again
      const st = document.querySelector('#stage');
      if (st) new MutationObserver((ms) => { if (!ms.some((m) => [...m.addedNodes].some((n) => n.classList && n.classList.contains('lab')))) return; const li = document.querySelector('#buildpanel li.gp:hover, #buildpanel li.gp:focus-within'); if (li) lit(li, true); }).observe(st, { childList: true });
    }
    emptyState();
  }
  function view() {
    if (B.step === 'read' && B.reading) return readView(fileOf(B.reading));
    if (B.step === 'feeds') return feedsView();
    if (B.step === 'history') return historyView();
    if (B.step === 'rules') return rulesView();
    if (B.step === 'product') return productView();
    if (B.step === 'days') return daysView();
    if (B.step === 'end' || B.step === 'record') { const v = endView(), [pre, rest0] = v.body.split('<!--rec-->'), [mid, post] = (rest0 || '').split('<!--/rec-->'), model = ((mid || '').match(/<!--model-->([\s\S]*?)<!--\/model-->/) || [, ''])[1], rec = (mid || '').replace(/<!--model-->[\s\S]*?<!--\/model-->/, '');
      if (B.step === 'record') return { body: `<div class="be-head"><b>The record</b><span>Every decision, change and gap, with who and when.</span></div>${rec}<button type="button" class="link be-back" data-act="go" data-to="end">‹ Back to the summary</button>`, foot: v.foot };
      return { ...v, body: `${pre}<button type="button" class="btn rec-open" data-act="go" data-to="record">The record: every decision, change and gap ›</button>${model}${post || ''}` }; }
    return filesView();
  }
  function kindStrip() {
    const M = X().models.build; if (!M || !M.kinds) return '';
    const mark = (k) => { const ds = k.datasets.map((id) => M.datasets.find((d) => d.id === id)).filter(Boolean); return ds.some((d) => d.state === 'waiting' && !d.causeOnly) ? `<b class="ks-m bad">${X().PAUSE}</b>` : ds.some((d) => d.state === 'waiting') ? `<b class="ks-m bad">${MARK.cause}</b>` : ds.some((d) => d.state === 'decided') ? `<b class="ks-m">${X().HALF}</b>` : ds.some((d) => d.state === 'warn') ? '<b class="ks-m warn">◆</b>' : ''; };
    return `<div class="bp-strip"><button type="button" class="ks-open" data-act="map" aria-expanded="${!!B.map}">${B.map ? 'Hide map' : 'Map'}</button><div class="ks-list">${M.kinds.length ? [...M.kinds].sort((a, b) => (mark(b) ? 2 : b.ghost ? 1 : 0) - (mark(a) ? 2 : a.ghost ? 1 : 0)).map((k) => `<span class="ks${k.ghost ? ' ghost' : ''}"><span class="ks-i">${X().ICON[k.icon] || X().ICON.app}</span>${esc(k.name)}${mark(k)}</span>`).join('') : '<span class="ks-none">The map fills in as you add files</span>'}</div></div>`;
  }
  // where something comes from: the file's own data, or Larkspur's setup
  const FROM = (t) => `<span class="bp-from">${esc(t)}</span>`;

  // ---------------------------------------------------------------- files
  function filesView() {
    const nx = nextFile();
    if (!nx) return allInView();
    const left = DATA.order.filter((id) => !isAdded(id) && !(nx.feeds || []).includes(id) && id !== nx.id);
    const first = !B.added.length;
    const card = nx.feeds
      ? `<div class="bp-next"><span class="bn-l">Next</span><b>${nx.feeds.length} evidence files, one row per application</b><span class="bn-why">Each has an app_id the CMDB knows: read them together</span></div>`
      : `<div class="bp-next"><span class="bn-l">${first ? 'Start here' : 'Next'}</span><b><span class="gl">${GL.file}</span>${esc(fname(fileOf(nx.id)))}</b><span class="bn-why">${esc(whyNext(nx.id))}</span></div>`;
    const STRIP = [['file', 'Files arrive each day'], ['rule', 'Each is checked'], ['out', 'Reports go out to readers'], ['pause', 'A bad file holds them until you decide']];
    const intro = first ? `<ol class="bp-why" aria-label="How it works">${STRIP.map(([g, t]) => `<li><span class="gl">${g === 'pause' ? X().PAUSE : GL[g]}</span><span>${esc(t)}</span></li>`).join('')}</ol><p class="bp-lead">Rebuild Larkspur, a made-up company, from its ${DATA.files.length} files; then replay February and March, deciding the days that broke. About ten minutes.</p><details class="bp-how"><summary>How this works ›</summary><p class="bp-note">${DATA.files.filter((f) => f.every === 'daily').length} of the files come daily. Each step proposes Larkspur’s own choice, marked, for you to keep or change. Grey tags say where something comes from: Larkspur’s own setup, or the files’ data. Readers are the people who use Larkspur’s outputs.</p></details>` : '';
    const foot = nx.feeds ? `<button class="btn primary" data-act="feeds">Read the ${nx.feeds.length} together ›</button>` : `<button class="btn primary" data-act="read" data-id="${nx.id}">Read ${esc(fname(fileOf(nx.id)))} ›</button>`;
    const mini = B.added.length && !B.map ? `<div class="bp-mini">${modelPic(syncModel())}</div>` : '';
    return { body: `${intro}${mini}${card}${left.length ? `<h4 class="bp-h">Still to read · ${left.length}</h4><ul class="bp-files">${left.map((id) => fileRow(fileOf(id))).join('')}</ul>` : ''}${B.added.length ? `<details class="bp-in"><summary>Read · ${B.added.length}</summary><ul class="bp-files in">${B.added.map((id) => fileRow(fileOf(id), true)).join('')}</ul></details>` : ''}`, foot };
  }
  const changedByYou = (id) => B.kinds[id] || B.names[id] || B.keys[id];
  function fileRow(f, done) {
    return `<li><button type="button" class="bf-row" data-act="${done ? 'peek' : 'read'}" data-id="${f.id}"><span class="gl">${done ? '✓' : GL.file}</span><span class="bf-n">${esc(fname(f))}<small>${fmt(f.rows)} rows · ${f.columns.length} columns · ${f.every === 'daily' ? 'a new one daily' : 'static'}</small></span>${done && changedByYou(f.id) ? '<span class="bf-you">changed by you</span>' : ''}${!done && f.refs.length ? `<span class="bf-ref">${f.refs.length} file${f.refs.length === 1 ? ' lists' : 's list'} its ${esc(PL[f.kind] || 'rows')}</span>` : ''}<span class="go">›</span></button></li>`;
  }
  // every file in: what was built, and what reading found, each with what is done about it
  const GAPS = {
    'exceptions.approver_id': (j) => ({ says: `${fmt(j.missN)} of ${fmt(j.rows)} rows name one of ${fmt(j.missDistinct)} approvers who aren’t among the 245 people in the HR file`, verdict: 'The HR file lists leaders only, and an approver needn’t lead a unit', from: 'Larkspur’s description', modes: true }),
    'cloud_assets.app_tag': (j) => ({ says: `${fmt(j.missN)} of ${fmt(j.rows)} rows carry a tag the CMDB doesn’t list`, verdict: 'Larkspur lists them in its Shadow assets output, which is watched', from: 'Larkspur’s notebooks, which build its outputs', modes: true }),
    'cloud_assets.cluster': (j) => { const x = (DATA.xtab || {})['cloud_assets.cluster'] || {}; return { says: `${fmt(j.blank)} of ${fmt(j.blank + j.hit)} rows name no cluster`, verdict: `All ${fmt(x.nonprod)} are in non-production or sandbox accounts; every one of the ${fmt(x.prod)} production rows names one. Larkspur’s description: blank outside production`, from: 'found in the data', modes: true }; },
    'cmdb_apps.platform_id': (j) => { const x = (DATA.xtab || {})['cmdb_apps.platform_id'] || {}; return { says: `${fmt(j.blank)} of ${fmt(j.blank + j.hit)} applications run on no shared platform`, verdict: `All ${fmt(x.n)} are the Software-as-a-service applications, and every one of those is blank: a vendor runs them. What a blank means isn’t written in Larkspur’s model`, from: 'found in the data', modes: true }; },
    'hr_org_units.leader_id': (j) => { const x = (DATA.xtab || {})['hr_org_units.leader_id'] || {}, lv = x.levels || {}; return { says: `${fmt(j.blank)} of ${fmt(j.blank + j.hit)} units have no leader`, verdict: `${[lv.team ? plural(lv.team, 'team') : '', lv.department ? plural(lv.department, 'department') : '', lv.business_unit ? plural(lv.business_unit, 'business unit') : ''].filter(Boolean).join(', ')}: a post can stand vacant, Larkspur’s description says. From Mon Mar 11 an acting leader can stand in`, from: 'Larkspur’s description', modes: true }; },
  };
  const MODE_EFFECT = { new: 'The day goes out marked ◆ warned when one appears that wasn’t there the day before.', all: 'The day goes out marked ◆ warned on every day any are there.', note: 'The day goes out unmarked; they’re listed under known gaps.', off: 'Not checked.' };
  // the gaps reading found that no link counts: blanks, and exceptions with no first version; not checked unless you choose
  const GAP_KEYS = new Set(['cloud_assets.cluster', 'cmdb_apps.platform_id', 'hr_org_units.leader_id', 'exceptions.version']);
  const GAP_SAID = { 'cloud_assets.cluster': (n) => `${fmt(n)} cloud rows name no cluster`, 'cmdb_apps.platform_id': (n) => `${plural(n, 'application')} on no shared platform`, 'hr_org_units.leader_id': (n) => `${plural(n, 'unit')} with no leader`, 'exceptions.version': (n) => `${plural(n, 'exception')} with no version 1 row` };
  const GAP_TAG = { 'cloud_assets.cluster': 'Your check on blank clusters', 'cmdb_apps.platform_id': 'Your check on blank platforms', 'hr_org_units.leader_id': 'Your check on vacant leaders', 'exceptions.version': 'Your check on first versions' };
  // peer:dq r2: each gap said short (what, and the noun its count is in), and, where the data shows the gap fills one
  // segment of its file exactly (every blank in it, none outside it: DATA.xtab), that segment's name for the bar
  const GAP_SHORT = { 'exceptions.approver_id': (x) => [`${fmt(x.j.missDistinct)} approvers not in the HR file`, 'rows'], 'cloud_assets.app_tag': (x) => [`${plural(x.j.missDistinct, 'tag')} the CMDB doesn’t list`, 'rows'], 'cloud_assets.cluster': () => ['no cluster', 'rows'], 'cmdb_apps.platform_id': () => ['no shared platform', 'applications'], 'hr_org_units.leader_id': () => ['no leader', 'units'], 'exceptions.version': () => ['no version 1 row', 'exceptions'] };
  const GAP_SEG = { 'cloud_assets.cluster': (x) => { const c = (DATA.xtab || {})['cloud_assets.cluster'] || {}; return c.nonprod === x.n && c.prodBlank === 0 ? 'all non-production' : ''; }, 'cmdb_apps.platform_id': (x) => { const c = (DATA.xtab || {})['cmdb_apps.platform_id'] || {}; return c.of === x.n && c.n === x.n ? 'all SaaS' : ''; } };
  function gapEvidence(x) {
    const xt = DATA.xtab || {};
    if (x.key === 'exceptions.approver_id') return `<span class="ag-ev">Not among the people: ${(x.j.miss || []).map((v) => `<code>${esc(v)}</code>`).join(' ')}${x.j.missDistinct > (x.j.miss || []).length ? ' …' : ''}</span>`;
    if (x.key === 'cloud_assets.app_tag') return `<span class="ag-ev">Tags the CMDB doesn’t list: ${(x.j.miss || []).map((v) => `<code>${esc(v)}</code>`).join(' ')}</span>`;
    if (x.key === 'cloud_assets.cluster') { const c = xt['cloud_assets.cluster'] || {}; return `<table class="ag-xt"><tr><th>Production accounts</th><td>${fmt(c.prod)} rows</td><td>${fmt(c.prodBlank)} blank</td></tr><tr><th>Non-production and sandbox</th><td>${fmt(c.nonprod)} rows</td><td><b>${fmt(c.nonprod)} blank</b></td></tr></table>`; }
    if (x.key === 'cmdb_apps.platform_id') { const c = xt['cmdb_apps.platform_id'] || {}; return `<table class="ag-xt"><tr><th>Software as a service</th><td>${fmt(c.of)} applications</td><td><b>${fmt(c.n)} blank</b></td></tr><tr><th>Cloud and on premises</th><td>${fmt(2401 - c.of)} applications</td><td>0 blank</td></tr></table>`; }
    if (x.key === 'hr_org_units.leader_id') { const c = xt['hr_org_units.leader_id'] || {}; return `<span class="ag-ev">No leader on Feb 1: ${(c.ids || []).map((v) => `<code>${esc(v)}</code>`).join(' ')}</span>`; }
    if (x.key === 'exceptions.version') { const c = xt['exceptions.version'] || {}; return `<span class="ag-ev">Of ${fmt(c.ids)} exceptions, ${fmt(c.v2only)} have version 2 alone, like ${(x.j.miss || []).map((v) => `<code>${esc(v)}</code>`).join(' ')}; not the ${fmt(c.two)} with versions 1 and 2, whose first is there, superseded</span>`; }
    return '';
  }
  function gapsFound() {
    const out = [];
    for (const f of DATA.files) for (const j of f.joins || []) {
      const said = GAPS[`${f.id}.${j.col}`]; if (!said || !isAdded(f.id) || !isAdded(j.to)) continue;
      out.push({ f, j, key: `${f.id}.${j.col}`, ...said(j), n: j.missN || j.blank, of: j.missN ? j.rows : j.blank + j.hit, blank: !j.missN });
    }
    // found by reading the rows themselves: an exception whose first version isn't in the file
    const xv = (DATA.xtab || {})['exceptions.version'] || {};
    if (isAdded('exceptions')) out.push({ f: fileOf('exceptions'), j: { col: 'version', miss: ['EX-00062', 'EX-00098', 'EX-00134'] }, key: 'exceptions.version', says: `${fmt(xv.v2only)} exceptions have version 2 alone: their version 1 isn’t in the file`, verdict: `All ${fmt(xv.v2extended)} were extended: each carries the end date it had before. Larkspur’s model has no rule for it`, from: 'found in the data', n: xv.v2only || 15, of: xv.ids || 253, blank: false, odd: true, modes: true });
    return out.sort((a, b) => (a.blank ? 1 : 0) - (b.blank ? 1 : 0) || b.n - a.n);
  }
  const linkCount = (M) => M.relations.filter((r) => r.from !== r.to).length;
  // a gap that may be a real problem rather than how the files are made: looked into before it is accepted
  const FINDING = { 'exceptions.approver_id': 'Worth asking about before you accept it: approvals by people HR doesn’t list' };
  const ruleOnGap = (k) => { const [fid, col] = k.split('.'); return ((B.myRules || {})[fid] || []).find((r) => r.col === col) || null; };
  function allInView() {
    const M = syncModel(), g = gapsFound();
    const kinds = M.kinds.map((k) => `<li><span class="gl">${X().ICON[k.icon] || GL.kind}</span><b>${esc(k.name)}</b><small>${fmt(k.count)} ${esc(k.plural)} · ${plural(k.datasets.length, 'file')}</small></li>`).join('');
    const GAP_EFFECT = { new: 'The day goes out marked ◆ warned when there are more than the day before.', all: 'The day goes out marked ◆ warned on every day any are there.', note: 'The day goes out unmarked; they’re listed under known gaps.', off: 'Not checked, as Larkspur set it.' };
    const LARK = { 'exceptions.approver_id': 'new', 'cloud_assets.app_tag': 'note' };
    const wouldDays = (k, min = (B.gapMin || {})[k] || 1) => DATA.days.filter((y) => y.day > '2024-02-01' && y.day <= LAST && ((GAP_KEYS.has(k) ? (y.gapsUp || {})[k] : (y.linksNew || {})[k]) || 0) >= min).map((y) => y.day);
    const wouldPause = (k) => wouldDays(k).length;
    const gapStrip = (k) => { const ds = new Set(wouldDays(k, 1)); return `<span class="ckstrip" aria-hidden="true">${DATA.days.filter((y) => y.day <= LAST).map((y) => `<i class="${ds.has(y.day) ? 'w' : ''}"></i>`).join('')}</span><small class="ag-sl">${ds.size ? `a new one on ${plural(ds.size, 'day')} of ${dayIdx(LAST) + 1}` : 'never a new one'}</small>`; };
    const minCtl = (k) => { const n = (B.gapMin || {})[k] || 1; return `<span class="limctl"><span class="ll">Pause when at least</span><button type="button" class="lb" data-act="gapmin" data-k="${k}" data-d="-1" aria-label="Fewer" ${n <= 1 ? 'disabled' : ''}>−</button><b>${n}</b><button type="button" class="lb" data-act="gapmin" data-k="${k}" data-d="1" aria-label="More">+</button><span class="lw">new in a day: <b>${plural(wouldDays(k).length, 'day')}</b> of ${dayIdx(LAST) + 1}</span></span>`; };
    const modeRow = (x) => { const gk = GAP_KEYS.has(x.key), m = linkModeOf(x.key), lark = LARK[x.key] || (gk ? 'off' : 'new'); return `${gapStrip(x.key)}<div class="ag-ctl">${seg4({ label: 'What its check does', now: m, act: 'gapmode', data: `data-k="${x.key}"`, warnSub: true, lark, pauseQual: 'on a day with a new one' })}${m === 'hold' ? minCtl(x.key) : ''}<span class="ag-would">${m === 'hold' ? 'Pauses' : 'Pause would stop'} ${wouldPause(x.key)} of the ${dayIdx(LAST) + 1} days${GAP_KEYS.has(x.key) ? ' (a day with more of them than the day before)' : ' (a day with a new one)'}${wouldPause(x.key) && wouldPause(x.key) < 9 ? `: ${datesOf(new Set(wouldDays(x.key)))}` : wouldPause(x.key) ? '' : ''}${wouldPause(x.key) === 1 ? ', yours to decide' : wouldPause(x.key) ? ', each yours to decide' : ''}</span></div>`; };
    const acc = acceptedKeys();
    // peer:dq r2, the combination: each gap one row (dq: its name, its count, a bar on one scale with the gap the dark
    // mark, a blank gap's segment, your rule's line), in two groups (newcomer: the one worth asking about first), one
    // control (design: Pause · Warn · Note · Off, Larkspur's pick a dot) and what it does over the 56 days (all four),
    // one fold of evidence with no control repeated in it, and pointing at a row lights its files on the map (builder)
    const D56 = dayIdx(LAST) + 1, dayList = (ds) => (ds.length && ds.length < 9 ? `: ${datesOf(new Set(ds))}` : '');
    const ofDays = (ds) => (ds.length ? `${ds.length} of ${D56} days${dayList(ds)}` : `none of the ${D56} days`);
    const thereOn = (k) => DATA.days.filter((y) => y.day <= LAST && ((((GAP_KEYS.has(k) ? y.gaps : y.links) || {})[k]) || 0) > 0).length;
    const doesSaid = (x, m, mr) => {
      if (mr) { const b = brokeOn(x.f.id, mr, true); if (b == null) return ''; const ds = b.map((i) => DATA.days[i]).filter((y) => y && y.day > '2024-02-01' && y.day <= LAST).map((y) => y.day); return `${mr.mode === 'hold' ? 'pauses' : mr.mode === 'note' ? 'notes' : 'warns on'} ${ofDays(ds)}`; }
      if (m === 'hold') return `pauses ${ofDays(wouldDays(x.key))}`;
      if (m === 'new') return `warns on ${ofDays(wouldDays(x.key, 1))}`; // warn flags any day with a new one; the "at least" floor is Pause's
      if (m === 'all') { const n = thereOn(x.key); return `warns on ${n >= D56 ? 'all' : `${n} of`} ${D56} days`; }
      return m === 'note' ? 'listed, no day marked' : 'not checked';
    };
    const why1 = (x) => String(x.verdict || '').split(/(?<=[.:])\s/)[0].replace(/[.:]$/, '');
    const liOf = (x) => { const m0 = linkModeOf(x.key), lk0 = LARK[x.key] || (GAP_KEYS.has(x.key) ? 'off' : 'new'), mr = ruleOnGap(x.key), fd = FINDING[x.key], isAcc = acc.has(x.key);
      const idsRow = !!(fd && (x.j.miss || []).length); // peer:dq r2 polish (owner): the finding's row shows its approver ids; Larkspur's reason moves into the fold
      const sh = (GAP_SHORT[x.key] || (() => [x.says, 'rows']))(x), share = (x.n / x.of) * 100, seg = GAP_SEG[x.key] ? GAP_SEG[x.key](x) : '', tol = mr && mr.kind === 'fewblank' && String(mr.vals).trim() !== '' && !isNaN(+mr.vals) ? +mr.vals : null, gc = fd && !isAcc ? 'find' : x.blank ? 'bl' : 'miss';
      // the share is said only where the bar can't show it: a gap drawn at its 3 px floor, or one read against your rule's line
      const pct = share < 1 || tol != null ? ` · ${share.toFixed(1)}%` : '';
      const tl = tol != null ? `<span class="ag-lab ag-up"><span class="ag-tl" style="${tol <= 60 ? `left:${tol}%` : `right:${100 - tol}%`}">your rule: at most ${tol}%</span></span>` : '';
      const scale = `<span class="ag-scale" aria-hidden="true">${tl}<span class="ag-track"><i class="${gc}" style="width:max(3px, ${share.toFixed(2)}%)"></i>${tol != null ? `<i class="ag-tol" style="left:${tol}%"></i>` : ''}</span>${seg ? `<span class="ag-lab"><span class="ag-seg">${esc(seg)}</span></span>` : ''}</span>`;
      const does = doesSaid(x, m0, mr), said = isAcc && !mr ? `<i class="ok">✓</i> accepted at ${fmt(x.n)}${does ? ` · ${esc(does)}` : ''}` : esc(does.charAt(0).toUpperCase() + does.slice(1));
      const ctl = mr ? `<span class="agchip mine">Watched by your rule${tol != null ? '' : `: ${esc(myRuleSaid(mr))}`} · ${esc(MODE_SAID[mr.mode] || 'Warn')}</span>` : seg4({ label: 'What its check does', now: m0, act: 'gapmode', data: `data-k="${x.key}"`, lark: lk0 });
      const fold = `${fd && !isAcc ? `<p class="ag-find">${esc(fd)}. Left open, it is listed each day until someone accepts it.</p>` : ''}${mr ? `<p class="ag-mine">Watched by your rule, <b>${esc(myRuleSaid(mr))}</b>, which ${mr.mode === 'hold' ? 'pauses' : mr.mode === 'note' ? 'notes' : 'warns'}: this check gives way to it. <button type="button" class="link" data-act="go" data-to="files">See it on the file ›</button></p>` : ''}${isAcc && !mr && m0 === 'off' ? `<p class="ag-ceil">Off: more than ${fmt(x.n)} won’t be flagged. <button type="button" class="link" data-act="gapmode" data-k="${x.key}" data-m="warn">Warn when more appear ›</button></p>` : ''}<p class="ag-what"><code>${esc(x.j.col)}</code> ${esc(seg || idsRow ? x.verdict : cap(x.verdict.slice(why1(x).length).replace(/^[.:]\s*/, '')))} ${FROM(x.from)}</p>${idsRow ? '' : gapEvidence(x)}${x.modes && !mr ? modeRow(x) : ''}`;
      return `<li class="gp${x.blank ? ' ok' : ''}${fd ? ' finding' : ''}" data-gf="${esc(x.f.id)}"${x.j.to ? ` data-gt="${esc(x.j.to)}" data-gc="${esc(x.j.col)}"` : ''}><details class="ag-row"><summary><b class="ag-name">${esc(nameOfFile(x.f.id))} · ${esc(sh[0])}</b><span class="ag-n">${fmt(x.n)} of ${fmt(x.of)} ${sh[1]}${pct}</span>${scale}${idsRow ? `<small class="ag-why1 ag-ids">${(x.j.miss || []).map((v) => `<code>${esc(v)}</code>`).join(' ')}${x.j.missDistinct > (x.j.miss || []).length ? ` +${fmt(x.j.missDistinct - (x.j.miss || []).length)} more` : ''}</small>` : seg ? '' : `<small class="ag-why1">${esc(why1(x))}</small>`}<span class="ag-acts">${ctl}${said ? `<span class="ag-does">${said}</span>` : ''}${fd && !isAcc ? `<button type="button" class="link ag-acc1" data-act="known1" data-k="${x.key}">Accept it as known</button>` : ''}<span class="ag-open">Why ›</span></span></summary>${fold}</details></li>`; };
    const gF = g.filter((x) => FINDING[x.key]), gE = g.filter((x) => !FINDING[x.key]);
    const groups = `<div class="ag-gaps ag-groups">${gF.length ? `<h5 class="ag-gh">Worth asking about · ${gF.length}</h5><ul>${gF.map(liOf).join('')}</ul>` : ''}${gE.length ? `<h5 class="ag-gh">Explained · ${gE.length}</h5><ul>${gE.map(liOf).join('')}</ul>` : ''}</div>`;
    const KEY = `<b>Pause</b> holds the day · <b>Warn</b> marks it ◆ · <b>Note</b> lists them · <b>Off</b> stops checking · <i class="lkdot" aria-hidden="true"></i> Larkspur’s pick<span class="ag-days">The ${D56} days: ${md(DATA.days[0].day)} to ${md(LAST)}</span>`; // peer:dq r2 polish: the dot's word, and the 56 days named once; which days each picks is on its row
    return {
      body: `<div class="bp-done gp-done"><b>All ${DATA.files.length} files are in</b><span>${M.kinds.length} kinds · ${linkCount(M)} links between them</span></div><p class="ag-kline">${M.kinds.map((k) => `<span><span class="gl">${X().ICON[k.icon] || GL.kind}</span><b>${esc(k.name)}</b> ${fmt(k.count)}</span>`).join('')}</p>${g.length ? `<h4 class="bp-h">Gaps in Feb 1’s files · ${g.length}</h4>${B.known ? (B.known.declined ? `<p class="ag-known no">✕ <span>Not accepted by you, ${esc(youStamp(B.known.at))}: each is listed every day until accepted or off.</span></p>` : `<p class="ag-known">✓ <span>Accepted by you, ${esc(youStamp(B.known.at))}: ${(B.known.keys || []).length} of ${g.length}${g.some((x) => FINDING[x.key] && !acc.has(x.key)) ? '. The one worth asking about stays open' : ''}.</span></p>`) : '<p class="ag-known ask">Accept each as known, or it is listed every day.</p>'}<p class="ag-key">${KEY}</p>${groups}` : ''}`,
      foot: g.length && !B.known ? `<button class="btn" data-act="known" data-none="1">Don’t accept</button><button class="btn primary" data-act="known">Accept ${gE.length === g.length ? 'them' : `the ${gE.length} explained`} ›</button>` : `<button class="btn primary" data-act="go" data-to="history">Next: history ›</button>`, sum: '', // peer:dq r2: the recount of modes is gone; each row says its own
    };
  }

  // ---------------------------------------------------------------- reading one file
  const condSaid = ([, t, vs]) => (vs.length === 1 && /^yes$/i.test(vs[0]) ? t : vs.every((v) => v.toLowerCase().startsWith(t.toLowerCase())) ? vs.join(', ') : `${t}: ${vs.join(', ')}`);
  // each kind a file could be about: the link to that kind's own list, with how much of the file it covers
  function kindLinks(f) {
    const out = [];
    for (const j of f.joins || []) {
      if (!j.col || j.to === f.id) continue;
      const to = fileOf(j.to); if (!to || !to.register) continue;
      out.push({ kind: to.kind, j, cover: j.hit / f.rows, said: `${j.col}: ${fmt((j.distinct || 0) - (j.missDistinct || 0))} of its ${fmt(j.distinct || 0)} values found in ${nameOfFile(to.id)}, on ${fmt(j.hit)} of ${fmt(f.rows)} rows${j.blank ? ` (${fmt(j.blank)} blank)` : ''}` });
    }
    return out;
  }
  // a key judged on the days before Feb 1 as well as on Feb 1's file
  const keyHistSaid = (f, k) => { const h = HI(f.id); if (!h || !k || k !== f.key || !h.dup) return ''; const bd = brokeOn(f.id, { kind: 'key', col: k }); return bd == null ? '' : bd.length ? ` · <b class="warnt">repeated or blank on ${plural(bd.length, 'day')} of the ${h.days} before Feb 1</b>` : ` · and on every one of the ${h.days} days before Feb 1`; };
  function keyCandidates(f) { const one = f.columns.filter((c) => c.unique).map((c) => c.name); return f.key2 ? [...one, f.key2.join(' + '), f.key2[0]] : one; }
  const keyUnique = (f, k) => { if (k.includes(' + ')) return f.rows; const c = f.columns.find((x) => x.name === k); return c ? c.distinct : 0; };
  // one sentence a link, the same as the map's: the explorer says it
  // the link that puts a file in its kind, said as what one of its rows is
  const ROW_SENT = { exceptions: 'Each exception is about one control', cloud_assets: 'Cloud assets run on platforms', control_requirements: 'Each mapping is about one control', platform_links: 'Each link starts at one platform', findings: 'Each finding is about one application' };
  // what a link's count counts: the rows of the file that names, the things it names
  const ROWNOUN = { cmdb_apps: 'applications', hr_org_units: 'units', hr_people: 'people', exceptions: 'exception rows', cloud_assets: 'cloud rows', control_requirements: 'mappings', platform_links: 'links', findings: 'findings', control_catalog: 'controls' };
  const SELF_SAID = { 'hr_org_units.parent_id': (j) => `${fmt(j.rows)} units report to ${fmt(j.distinct)} parent units`, 'hr_people.manager_id': (j) => `${fmt(j.rows)} people report to ${fmt(j.distinct)} managers`, 'control_catalog.depends_on': (j) => `${fmt(j.rows)} controls depend on ${fmt(j.distinct)} others` };
  const countSaid = (g, j) => { if (SELF_SAID[`${g.id}.${j.col}`] && j.to === g.id) return SELF_SAID[`${g.id}.${j.col}`](j); const to = fileOf(j.to), things = PL[to?.kind] || 'things'; return `${fmt(j.rows)} ${ROWNOUN[g.id] || 'rows'} name ${plural(j.distinct || 0, (ONE[to?.kind] || 'thing').replace(/ .*$/, ''), things)}`; };
  // a kind of its own, named for what one of its rows is
  const OWN_NAME = { exceptions: 'Exception', cloud_assets: 'Cloud resource', control_requirements: 'Mapping', platform_links: 'Platform link', findings: 'Finding' };
  const memberSentence = (f) => ROW_SENT[f.id] || (f.scope ? 'Each row is about one application' : '');
  const aOne = (k) => `${/^[aeiou]/i.test(ONE[k] || '') ? 'an' : 'a'} ${ONE[k] || 'thing'}`;
  const linkSentence = (from, j) => { const a = kindOfFile(from), b = kindOfFile(j.to); if (!a || !b) return ''; return X().sentence({ from: a, to: b, name: j.found ? (a === b ? 'about' : 'uses') : j.rel, via: [{ ds: from, col: j.col }] }); };
  const asksKind = (f) => { if (true || !f || f.register || f.scope || f.id in B.kinds || (B.picked || {})[f.id]) return false; const kl = kindLinks(f); const best = kl.slice().sort((a, b) => b.cover - a.cover)[0], larks = kl.find((x) => x.kind === f.kind); return !!best && !!larks && best.kind !== f.kind && best.cover > larks.cover; };
  // the kinds and links between kinds the model would have with the file in each kind
  function effectsOf(f, kinds) {
    const had = B.kinds[f.id], hadPick = (B.picked || {})[f.id], out = {}; (B.picked ||= {})[f.id] = true;
    for (const k of kinds) { if (k === f.kind) delete B.kinds[f.id]; else B.kinds[f.id] = k; const M = syncModel(); out[k] = { kinds: M.kinds.length, links: linkCount(M), brings: M.relations.filter((r) => r.from !== r.to && r.via.some((v) => v.ds === f.id)).map((r) => { const nm = (id) => (M.kinds.find((k) => k.id === id) || {}).name || id, verb = ['about', 'found', 'uses'].includes(r.name) ? `via ${nameOfFile(f.id)}` : r.name; return `${nm(r.from)} → ${nm(r.to)} (${verb})`; }) }; }
    if (had === undefined) delete B.kinds[f.id]; else B.kinds[f.id] = had;
    if (hadPick) B.picked[f.id] = true; else delete B.picked[f.id];
    syncModel(); return out;
  }
  // the file's links in one line each, near the top: what it refers to, what refers to it
  function relLine(f) {
    const out = (f.joins || []).filter((j) => j.col && !j.found && j.to !== f.id && isAdded(j.to)).map((j) => `${esc(nameOfFile(f.id))} → ${esc(j.rel === 'evidence for' ? 'evidence for' : j.rel || 'refers to')} → ${esc(nameOfFile(j.to))}`);
    const inn = B.added.map(fileOf).flatMap((g) => (g.joins || []).filter((j) => j.to === f.id && j.col && g.id !== f.id && !j.found).map(() => nameOfFile(g.id)));
    if (!out.length && !inn.length) return '';
    return `<div class="bf-prop wide bf-rels"><h4>Links, at a glance</h4>${out.length ? `<p class="pv">${out.join('<br>')}</p>` : ''}${inn.length ? `<p class="ev">Referred to by ${esc([...new Set(inn)].join(', '))}</p>` : ''}</div>`;
  }

  // ---------------------------------------------------------------- rules: the file's own, suggested with Feb 1's evidence; yours, typed in
  const RULE_KIND = (says) => (/^One row per/.test(says) ? 'scope' : /blank or repeated/.test(says) ? 'key' : / is one of: /.test(says) ? 'values' : /at most \d+% of rows/.test(says) ? 'limit' : /usual day/.test(says) ? 'amount' : /as common as usual|warn when it rises/.test(says) ? 'learned' : 'schema');
  const normV = (v) => String(v ?? '').toLowerCase().replace(/[_\s]+/g, ' ').trim();
  function ruleEvidence(f, r) {
    const k = RULE_KIND(r.says), c = r.column ? f.columns.find((x) => x.name === r.column) : null, rows = f.rows;
    if (k === 'key' && c) return c.unique && !c.blanks ? { ok: true, t: `all ${fmt(rows)} unique, none blank` } : { ok: false, t: `${fmt(rows - c.distinct + c.blanks)} repeated or blank` };
    if (k === 'scope' && f.scope) return f.scope.both === f.scope.inScope ? { ok: true, t: `all ${fmt(f.scope.inScope)} in scope are here` } : { ok: false, t: `${fmt(f.scope.inScope - f.scope.both)} of ${fmt(f.scope.inScope)} missing` };
    if (k === 'values' && c) { const listed = r.says.split(' is one of: ')[1].split(', ').length; return c.distinct <= listed && !c.blanks ? { ok: true, t: 'every row today' } : c.blanks ? { ok: false, t: `${fmt(c.blanks)} blank today` } : { ok: null, t: `${c.distinct} values today` }; }
    if (k === 'limit' && c) { const m = /^(.+?) on at most (\d+)% of rows/.exec(r.says); if (m) { const hit = (c.top || []).find(([v]) => normV(v) === normV(m[1])), sh = hit ? (hit[1] / rows) * 100 : 0; return { ok: sh <= +m[2], t: `${m[1]}: ${sh.toFixed(1)}% today` }; } }
    if (k === 'amount') { const u = usualOn(f.id, DATA.day0), L = rowsLimitFor(f.id); return u ? { ok: Math.abs((rows - u) / u) * 100 <= L, t: `${fmt(rows)} rows today · usual ${fmt(u)}, ±${L}%: ${fmt(Math.ceil(u * (1 - L / 100)))}–${fmt(Math.floor(u * (1 + L / 100)))}` } /* peer:dq: ceil/floor, as the check and the figure */ : { ok: null, t: '' }; }
    if (k === 'learned') return { ok: null, t: 'learned from 184 days' };
    return { ok: true, t: '' };
  }
  function myEvidence(f, r) {
    const c = f.columns.find((x) => x.name === r.col); if (!c) return { ok: null, t: '' };
    const rows = f.rows;
    if (r.kind === 'notblank') return c.blanks ? { ok: false, t: `${fmt(c.blanks)} of ${fmt(rows)} blank today` } : { ok: true, t: 'none blank today' };
    if (r.kind === 'fewblank') { const sh = ((c.blanks || 0) / rows) * 100; return { ok: sh <= +r.vals, t: `${sh.toFixed(1)}% blank today (${fmt(c.blanks || 0)} of ${fmt(rows)})` }; }
    if (r.kind === 'oneof') { const set = new Set(String(r.vals || '').split(',').map(normV).filter(Boolean)); const top = c.top || [], known = top.reduce((a, [v, n]) => a + (set.has(normV(v)) ? n : 0), 0), complete = top.length >= c.distinct; const bad = complete ? rows - known : top.reduce((a, [v, n]) => a + (set.has(normV(v)) ? 0 : n), 0) + (c.blanks || 0); return bad ? { ok: false, t: `${complete ? '' : 'at least '}${fmt(bad)} of ${fmt(rows)} rows wouldn’t pass today` } : { ok: true, t: 'every row passes today' }; }
    if (r.kind === 'atmost') { const [v, p] = String(r.vals || '').split(',').map((x) => x.trim()); const hit = (c.top || []).find(([x]) => normV(x) === normV(v)), sh = hit ? (hit[1] / rows) * 100 : 0; return v && p ? { ok: sh <= +p, t: `${v}: ${sh.toFixed(1)}% of rows today, limit ${p}%` } : { ok: null, t: '' }; }
    return { ok: null, t: '' };
  }
  // ---------------------------------------------------------------- a rule tried on the history: the 184 days before Feb 1 (and the replay's own days, `live`)
  const HI = (fid) => (DATA.hist || {})[fid] || null;
  const rawOf = (f, col, label) => { const hit = Object.entries((f.labels || {})[col] || {}).find(([, l]) => normV(l) === normV(label)); return hit ? hit[0] : label; };
  // a suggested check as a rule that can be tried: its kind, column and values in the file's own codes
  function ruleOf(f, r) {
    const k = RULE_KIND(r.says);
    if (k === 'values' && r.column) return { kind: 'oneof', col: r.column, set: Object.keys((f.labels || {})[r.column] || {}) };
    if (k === 'limit' && r.column) { const m = /^(.+?) on at most (\d+)% of rows/.exec(r.says); return m ? { kind: 'atmost', col: r.column, val: rawOf(f, r.column, m[1]), p: +m[2] } : null; }
    if (k === 'key' && r.column) return { kind: 'key', col: r.column };
    if (k === 'amount') return { kind: 'amount' };
    return null;
  }
  // a rule of your own in the same terms
  const mineAsRule = (r) => (r.kind === 'atmost' ? { kind: 'atmost', col: r.col, val: String(r.vals || '').split(',')[0].trim(), p: +(String(r.vals || '').split(',')[1] || 0) } : r);
  // the days a rule breaks on: indices into the history's days (or the replay's), or null where they can't be told
  function brokeOn(fid, r0, live) {
    const h0 = HI(fid), h = h0 && (live ? h0.live : h0); if (!h || !r0) return null;
    const r = mineAsRule(r0), n = h.days, rows = h.rows, out = [];
    const over = (cnt, pc) => { for (let i = 0; i < n; i++) if (rows[i] && (cnt[i] / rows[i]) * 100 > pc) out.push(i); return out; };
    if (r.kind === 'notblank') { const b = h.blank[r.col]; if (b) for (let i = 0; i < n; i++) if (b[i] > 0) out.push(i); return out; }
    if (r.kind === 'fewblank') { const b = h.blank[r.col]; return b ? over(b, +r.vals || 0) : out; }
    if (r.kind === 'oneof') { const x = h.vals[r.col]; if (!x) return null; const set = new Set((r.set || String(r.vals || '').split(',')).map(normV).filter(Boolean)), days = new Set(); x.v.forEach((v, k) => { if (v == null || set.has(normV(v))) return; if (x.c) x.c[k].forEach((c, i) => { if (c > 0) days.add(i); }); else for (let i = x.first[k]; i <= x.last[k]; i++) days.add(i); }); return [...days].sort((a, b) => a - b); }
    if (r.kind === 'atmost') { const x = h.vals[r.col]; if (!x || !x.c) return null; const k = x.v.findIndex((y) => normV(y) === normV(r.val)); return k < 0 ? out : over(x.c[k], r.p); }
    if (r.kind === 'key') { const b = h.blank[r.col] || [], dup = h.dup || []; for (let i = 0; i < n; i++) if ((b[i] || 0) > 0 || (dup[i] || 0) > 0) out.push(i); return out; }
    if (r.kind === 'amount' && !live) { const L = rowsLimitFor(fid) / 100; for (let i = 28; i < n; i++) { const w = rows.slice(i - 28, i).filter((v) => v != null).sort((a, b) => a - b); if (w.length < 14 || rows[i] == null) continue; const med = w[Math.floor(w.length / 2)]; if (med && Math.abs(rows[i] - med) / med > L) out.push(i); } return out; }
    return null;
  }
  // a rule's daily share over the 184 days, its tolerance dashed, the highest day labelled: how much room it leaves
  function shareChart(fid, r0) {
    const h = HI(fid); if (!h) return ''; const r = mineAsRule(r0), n = h.days;
    let cnt = null, p = null;
    if (r.kind === 'notblank' || r.kind === 'fewblank') { cnt = h.blank[r.col]; p = r.kind === 'fewblank' ? +r.vals || 0 : 0; }
    if (r.kind === 'atmost') { const x = h.vals[r.col]; const k = x && x.c ? x.v.findIndex((y) => normV(y) === normV(r.val)) : -1; cnt = k >= 0 ? x.c[k] : null; p = r.p; }
    if (!cnt) return '';
    const sh = cnt.map((v, i) => (h.rows[i] ? (v / h.rows[i]) * 100 : 0)), hi = Math.max(...sh), lo = Math.min(...sh), top = Math.max(hi, p || 0) * 1.25 || 1;
    const W = 300, Hh = 46, Y = (v) => 6 + (1 - v / top) * (Hh - 16), X = (i) => (i / (n - 1)) * (W - 40);
    const pts = sh.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' '), over = p != null ? sh.map((v, i) => (v > p ? i : -1)).filter((i) => i >= 0) : [];
    const near = p != null && Math.abs(Y(p) - Y(hi)) < 10, pY = !near ? Y(p) + 3 : p >= hi ? Y(p) - 3 : Y(p) + 9, hY = !near ? Y(hi) - 2 : p >= hi ? Y(hi) + 9 : Y(hi) - 3; // peer:dq
    return `<svg class="shchart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(r.col)}: ${lo.toFixed(1)}–${hi.toFixed(1)}% a day over ${n} days${p != null ? `, the tolerance ${p}%` : ''}"><polyline class="sh-l" points="${pts}"/>${p != null ? `<line class="sh-p" x1="0" x2="${W - 40}" y1="${Y(p).toFixed(1)}" y2="${Y(p).toFixed(1)}"/><text class="sh-t" x="${W - 36}" y="${pY.toFixed(1)}">${p ? `${p}%` : 'none'}</text>` : ''}${over.length && over.length < n ? over.map((i) => `<circle class="sh-o" cx="${X(i).toFixed(1)}" cy="${Y(sh[i]).toFixed(1)}" r="1.6"/>`).join('') : ''}<text class="sh-t m" x="${W - 36}" y="${hY.toFixed(1)}">${hi.toFixed(1)}%</text><text class="sh-a" x="0" y="${Hh - 1}">Aug 1</text><text class="sh-a" x="${W - 40}" y="${Hh - 1}" text-anchor="end">Jan 31</text></svg>`;
  }
  // the 184 days as a strip, the days a rule breaks marked
  const hstrip = (days, n, cls) => `<svg class="hstrip${cls ? ' ' + cls : ''}" viewBox="0 0 ${n} 10" preserveAspectRatio="none" aria-hidden="true"><rect class="hs-b" x="0" y="4" width="${n}" height="2"/>${(days || []).map((i) => `<rect class="hs-f" x="${i - 0.4}" y="0" width="1.8" height="10"/>`).join('')}</svg>`;
  const histSaid = (days, n, verb) => (days == null ? '' : !days.length ? `held on all ${n} days, Aug 1 to Jan 31` : days.length === n ? `would have ${verb} on every one of the ${n} days, Aug 1 to Jan 31` : `would have ${verb} on ${plural(days.length, 'day')} of the ${n}, Aug 1 to Jan 31`);
  // what a rule of yours said on a day of the replay, if it broke
  function myRuleOn(fid, r, H) {
    const h = HI(fid) && HI(fid).live, i = dayIdx(H); if (!h || i < 0 || h.rows[i] == null) return '';
    if (!(brokeOn(fid, r, true) || []).includes(i)) return '';
    const rows = h.rows[i], pct = (n) => ((n / rows) * 100).toFixed(1);
    if (r.kind === 'notblank') return `${r.col} blank on ${plural(h.blank[r.col][i], 'row')}`;
    if (r.kind === 'fewblank') return `${r.col} blank on ${pct(h.blank[r.col][i])}% of rows (at most ${r.vals}%)`;
    if (r.kind === 'oneof') { const x = h.vals[r.col], set = new Set(String(r.vals || '').split(',').map(normV)); const bad = x.v.filter((v, k) => v != null && !set.has(normV(v)) && (x.c ? x.c[k][i] > 0 : true)); return `${r.col} had ${bad.slice(0, 3).join(', ')}, not in your list`; }
    if (r.kind === 'atmost') { const m = mineAsRule(r), x = h.vals[r.col], k = x.v.findIndex((y) => normV(y) === normV(m.val)); return `${m.val} on ${pct(x.c[k][i])}% of rows (at most ${m.p}%)`; }
    return '';
  }
  // where a rule would cry wolf: the tolerance it would need to fire on no day of the history
  function tolOf(fid, r) {
    const h = HI(fid); if (!h) return null;
    if (r.kind === 'notblank' || r.kind === 'fewblank') { const b = h.blank[r.col]; if (!b) return null; const sh = b.map((v, i) => (h.rows[i] ? (v / h.rows[i]) * 100 : 0)), lo = Math.min(...sh), hi = Math.max(...sh); return { lo, hi, p: Math.max(1, Math.ceil(hi)), word: 'blank' }; }
    if (r.kind === 'atmost') { const m = mineAsRule(r), x = h.vals[r.col]; if (!x || !x.c) return null; const k = x.v.findIndex((y) => normV(y) === normV(m.val)); if (k < 0) return null; const sh = x.c[k].map((v, i) => (h.rows[i] ? (v / h.rows[i]) * 100 : 0)); return { lo: Math.min(...sh), hi: Math.max(...sh), p: Math.max(1, Math.ceil(Math.max(...sh))), word: m.val }; }
    if (r.kind === 'oneof') { const x = h.vals[r.col]; if (!x) return null; const set = new Set(String(r.vals || '').split(',').map(normV).filter(Boolean)); const left = x.v.filter((v) => v != null && !set.has(normV(v))); return left.length ? { left } : null; }
    return null;
  }
  const RULE_WORD = { oneof: 'is one of', notblank: 'is never blank', fewblank: 'is blank on at most N% of rows', atmost: 'a value on at most N% of rows' };
  const myRuleSaid = (r) => (r.kind === 'oneof' ? `${r.col} is one of: ${r.vals}` : r.kind === 'notblank' ? `${r.col} is never blank` : r.kind === 'fewblank' ? `${r.col} is blank on at most ${r.vals}% of rows` : `${r.col}: ${String(r.vals).split(',')[0].trim()} on at most ${String(r.vals).split(',')[1]?.trim() || '?'}% of rows`);
  const MODE_SAID = { hold: 'Pause', warn: 'Warn', note: 'Note' };
  function rulesPart(f) {
    const rs = (f.checks || []).filter((r) => r.origin === 'Data model' || RULE_KIND(r.says) === 'amount' || RULE_KIND(r.says) === 'learned');
    const onOf = (k) => k === 'limit' || k === 'schema' ? true : (checkOf(f, k) || 'off') !== 'off';
    const ev = (e) => (e.t ? `<small class="re ${e.ok === false ? 'bad' : e.ok ? 'ok' : ''}">${e.ok === false ? '✕' : e.ok ? '✓' : ''} ${esc(e.t)}</small>` : '');
    const hist = (days) => (days == null ? '' : `<small class="rh${days.length ? ' bad' : ''}">${hstrip(days, (HI(f.id) || {}).days || 184)}${esc(histSaid(days, (HI(f.id) || {}).days || 184, 'broken'))}</small>`);
    const modeWord = (r) => `<i class="rm ${r.mode === 'stops' ? 'p' : 'w'}" aria-hidden="true">${r.mode === 'stops' ? PZ2 : '◆'}</i><span class="rmw">${r.mode === 'stops' ? 'Pauses' : 'Warns'}</span>`;
    const modeSel = (k, fixed) => { const m = fixed ? 'hold' : checkOf(f, k) || 'off', w = m === 'hold' || m === 'learn' ? 'pause' : m; return `<select class="rmode ${w}" data-rmode="${f.id}" data-rk="${k}" aria-label="What it does when broken"${fixed ? ' disabled' : ''}>${[['pause', 'Pause'], ['warn', 'Warn'], ['note', 'Note'], ['off', 'Off']] /* peer:design: the four words every mode control says */.map(([v, t]) => `<option value="${v}"${v === w ? ' selected' : ''}>${t}</option>`).join('')}</select>`; }; // peer:design
    const mixSaid = (m) => m ? `<small class="re">usual mix of ${esc(m.col)}: ${m.vals.slice(0, 3).map(([v, sh, lo, hi]) => `${esc(v == null ? 'blank' : String(v).replace(/_/g, ' '))} ${sh}% (${lo}–${hi})`).join(' · ')}; ${(f.checks || []).some((c) => /pauses at ¼|quarter/.test(c.says)) ? '' : 'pauses when a quarter of the rows move'}</small>` : '';
    const one = (r) => { const k = RULE_KIND(r.says), on = onOf(k); return `<li class="rl${on ? '' : ' off'}"><span class="lbl">${modeSel(k, k === 'limit' || k === 'schema')}<span class="rt">${esc(r.says)}</span></span>${k === 'learned' ? mixSaid(f.mix) : ''}${ev(ruleEvidence(f, r))}${k === 'learned' ? '' : hist(brokeOn(f.id, ruleOf(f, r)))}<small class="ro">${r.origin === 'Learned' ? 'from the data' : 'Larkspur’s model'}</small></li>`; };
    // the columns that keep to known values: one row, which ones a tap away
    const vrs = rs.filter((r) => RULE_KIND(r.says) === 'values'), evs = vrs.map((r) => ruleEvidence(f, r)), bad = evs.filter((e) => e.ok === false);
    const vDays = (() => { const all = vrs.map((r) => brokeOn(f.id, ruleOf(f, r))); return all.some((x) => x == null) ? null : [...new Set(all.flat())].sort((a, b) => a - b); })();
    const valsRow = vrs.length > 2 ? `<li class="rl grp${onOf('values') ? '' : ' off'}"><span class="lbl">${modeSel('values')}<span class="rt">Known values in ${vrs.length} columns</span></span>${ev(bad.length ? { ok: false, t: bad.map((e) => e.t).join(' · ') } : { ok: true, t: 'every row today' })}${hist(vDays)}<small class="ro">Larkspur’s model</small><details class="rl-which"><summary>which ›</summary><span>${vrs.map((r) => esc(r.says.replace(/ is one of: /, ': '))).join('<br>')}</span></details></li>` : vrs.map(one).join('');
    const li = rs.filter((r) => RULE_KIND(r.says) !== 'values' || vrs.length <= 2).filter((r) => vrs.length <= 2 || RULE_KIND(r.says) !== 'values').map(one).join('').replace(/^/, '') + valsRow;
    const mine = ((B.myRules || {})[f.id] || []).map((r, i) => `<li class="rl mine"><span class="lbl"><i class="rm ${r.mode === 'hold' ? 'p' : r.mode === 'note' ? 'n' : 'w'}" aria-hidden="true">${r.mode === 'hold' ? PZ2 : r.mode === 'note' ? '○' : '◆'}</i><span class="rmw">${r.mode === 'hold' ? 'Pauses' : r.mode === 'note' ? 'Notes' : 'Warns'}</span><span class="rt">${esc(myRuleSaid(r))}</span></span>${ev(myEvidence(f, r))}${hist(brokeOn(f.id, r))}<small class="ro">yours <button type="button" class="link" data-act="myrule-off" data-f="${f.id}" data-i="${i}">remove</button></small></li>`).join('');
    const d = (B.ruleDraft || {})[f.id] || {}, col = d.col || '', kind = d.kind || 'oneof', cc = f.columns.find((x) => x.name === col);
    const tol0 = cc && kind === 'fewblank' ? tolOf(f.id, { kind, col }) : null;
    const sugVals = cc && kind === 'oneof' ? (cc.top || []).map(([v]) => v).join(', ') : cc && kind === 'atmost' ? `${(cc.top || [['']])[0][0]}, 10` : cc && kind === 'fewblank' ? String(tol0 ? tol0.p : 5) : '';
    const vals = d.vals ?? sugVals, dev = col ? myEvidence(f, { col, kind, vals }) : { t: '' }, mode = d.mode || 'warn', verb = mode === 'hold' ? 'paused' : mode === 'note' ? 'noted' : 'warned';
    const nD = (HI(f.id) || {}).days || 184, bd = col ? brokeOn(f.id, { col, kind, vals }) : null, tl = col && bd && bd.length ? tolOf(f.id, { col, kind, vals }) : null;
    const offer = !tl ? '' : tl.left ? `<span class="rl-tol">Values seen in those days that your list leaves out: ${tl.left.slice(0, 6).map((v) => `<code>${esc(v)}</code>`).join(' ')} <button type="button" class="link" data-act="rd-addvals" data-f="${f.id}" data-v="${esc(tl.left.join(', '))}">Add them ›</button></span>`
      : `<span class="rl-tol">${esc(tl.word === 'blank' ? 'It was blank' : `${tl.word} was`)} on ${tl.lo.toFixed(1)}–${tl.hi.toFixed(1)}% of rows every day${bd.length < nD ? ' it appeared' : ''}. <button type="button" class="btn sm primary" data-act="rd-tol" data-f="${f.id}" data-k="${kind === 'atmost' ? 'atmost' : 'fewblank'}" data-v="${kind === 'atmost' ? esc(`${mineAsRule({ kind, col, vals }).val}, ${tl.p}`) : tl.p}">${kind === 'atmost' ? `Set the most to ${tl.p}%` : `Allow up to ${tl.p}% blank instead`} ›</button> it would have ${verb} on none.</span>`;
    const cryWolf = !!(bd && bd.length > nD / 4 && tl && !tl.left);
    const tried = col && bd != null ? `<div class="rl-hist${bd.length ? ' bad' : ''}">${shareChart(f.id, { col, kind, vals }) || hstrip(bd, nD)}<span>Tried on the ${nD} days before Feb 1: ${esc(histSaid(bd, nD, verb).replace(/, Aug 1 to Jan 31$/, ''))}${bd.length > nD / 4 ? ' — it would cry wolf' : ''}.</span>${offer}</div>` : '';
    const form = `<details class="rl-add"${B.ruleOpen === f.id ? ' open' : ''} data-rlopen="${f.id}"><summary>+ Add a rule of your own</summary><div class="rl-form"><label><span>Column</span><select data-rd="${f.id}" data-rdk="col"><option value="">Pick a column</option>${f.columns.map((x) => `<option${x.name === col ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><label><span>Rule</span><select data-rd="${f.id}" data-rdk="kind">${Object.entries(RULE_WORD).map(([k, w]) => `<option value="${k}"${k === kind ? ' selected' : ''}>${esc(w)}</option>`).join('')}</select></label>${kind === 'notblank' ? '' : `<label class="wide"><span>${kind === 'oneof' ? 'Values, with commas' : kind === 'fewblank' ? 'The most %, blank' : 'Value, then the most %'}</span><input type="text" data-rd="${f.id}" data-rdk="vals" value="${esc(vals)}" placeholder="${kind === 'oneof' ? 'a, b, c' : kind === 'fewblank' ? '15' : 'fail, 10'}"></label>`}<div class="rl-mode"><span>When broken</span><span class="seg" role="radiogroup" aria-label="When broken">${['hold', 'warn', 'note'].map((m) => `<button type="button" role="radio" aria-checked="${mode === m}" class="${mode === m ? 'on' : ''}" data-act="rd-mode" data-f="${f.id}" data-m="${m}">${MODE_SAID[m]}</button>`).join('')}</span><small>${mode === 'hold' ? 'Pauses the day: what’s built from the file waits for you' : mode === 'note' ? 'The day goes out unmarked; listed under the day’s notes' : 'The day goes out marked ◆ warned'}</small></div></div>${col ? `<p class="rl-ev">On Feb 1’s file: ${ev(dev)}</p>${tried}` : '<p class="rl-ev">Pick a column: its values are suggested from the file, and the rule is tried on its 184 days.</p>'}<button type="button" class="btn sm${cryWolf ? '' : ' primary'}" data-act="myrule-add" data-f="${f.id}"${col ? '' : ' disabled'}>Add this rule · ${MODE_SAID[mode]}</button></details>`;
    return `<h4 class="bp-h">Rules · ${rs.length + ((B.myRules || {})[f.id] || []).length}</h4><p class="bp-note rl-note">Suggested from Larkspur’s model and the file’s data, each tried on Feb 1 and on the 184 days before. Set what each does when broken: Pause, Warn, Note or Off.</p>${form}<ul class="rl-list">${mine}${li}</ul>`; // peer:design: the note in the four words of the selects below
  }
  // a file's rows over the 28 days before a day, its usual band and the day itself
  function usualPic(fid, H) {
    const f = fileOf(fid); if (!f || !f.counts || f.every !== 'daily') return '';
    const i = dayIdx(H); if (i < 0) return '';
    const series = [...((f.history && f.history.daily) || []), ...f.counts.slice(0, i)].filter((v) => v != null), last = series.slice(-28), today = f.counts[i];
    if (last.length < 7 || today == null) return '';
    const lo = Math.min(...last), hi = Math.max(...last), top = Math.max(hi, today), bot = Math.min(lo, today), span = (top - bot) || 1, pad = span * 0.18;
    const W = 300, Hh = 70, X = (k) => 8 + (k / 28) * (W - 70), Y = (v) => 10 + (1 - (v - (bot - pad)) / (span + 2 * pad)) * (Hh - 26);
    const pts = last.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' '), out = today < lo || today > hi;
    return `<span class="usual"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(nameOf(fid))} rows: the last 28 days ${fmt(lo)} to ${fmt(hi)}, today ${fmt(today)}"><rect class="u-band" x="8" y="${Y(hi).toFixed(1)}" width="${(W - 70 - 8).toFixed(1)}" height="${Math.max(2, Y(lo) - Y(hi)).toFixed(1)}" rx="2"/><polyline class="u-line" points="${pts}"/><circle class="u-dot${out ? ' out' : ''}" cx="${X(28.6).toFixed(1)}" cy="${Y(today).toFixed(1)}" r="5"/><text class="u-t" x="8" y="${Hh - 3}">rows, the last 28 days: ${fmt(lo)}–${fmt(hi)}</text><text class="u-v${out ? ' out' : ''}" x="${W - 4}" y="${Math.max(14, Math.min(Hh - 16, Y(today) + 4)).toFixed(1)}" text-anchor="end">${fmt(today)}</text></svg></span>`;
  }
  // how far a day is from usual, the same picture wherever a day's rows are judged: bars from zero (how big),
  // then the last 28 days as % from usual on one fixed scale (±10%, beyond it pinned at the edge), the 28 days' range
  // shaded, the limits dashed (yours, and Larkspur's where they differ), today's dot coloured by where it lands, and a verdict
  const FIG_R = 10;
  function figFacts(fid, H) {
    const f = fileOf(fid); if (!f || !f.counts || f.every !== 'daily') return null;
    const i = dayIdx(H); if (i < 0) return null;
    const hist = (f.history && f.history.daily) || [], series = [...hist, ...f.counts.slice(0, i)], n0 = series.length;
    const win = series.slice(-28), today = f.counts[i], usual = f.usual ? usualAt(fid, i) : null;
    if (win.filter((v) => v != null).length < 7 || today == null || !usual) return null;
    const dateAt = (g) => (g >= hist.length ? DATA.days[g - hist.length].day : isoOf(new Date((f.history.from || '2023-08-01') + 'T12:00:00Z').getTime() + g * DAY));
    const vals = win.filter((v) => v != null), lo = Math.min(...vals), hi = Math.max(...vals), wk = series.slice(-5).filter((v) => v != null);
    const lastAt = (v) => { for (let g = n0 - 1; g >= n0 - win.length; g--) if (series[g] === v) return dateAt(g); return null; };
    return { f, i, win, today, usual, lo, hi, loDay: lastAt(lo), hiDay: lastAt(hi), wlo: Math.min(...wk), whi: Math.max(...wk), off: ((today - usual) / usual) * 100, L: limitOn(fid, H) };
  }
  const pctSaid = (p) => `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(1)}%`;
  function figVerdict(x) {
    const r = x.today / x.usual;
    if (x.today === 0) return { cls: 'far', t: 'None at all', s: `usually about ${fmt(x.usual)} rows` };
    if (r >= 1.5) return { cls: 'far', t: `${r.toFixed(1)}× usual`, s: `${fmt(x.today)} rows against about ${fmt(x.usual)}` };
    if (r <= 0.5) return { cls: 'far', t: `${Math.round(r * 100)}% of usual`, s: `${fmt(x.today)} rows against about ${fmt(x.usual)}` };
    const tie = x.today === x.lo && x.loDay ? `ties the 28-day low (${dShort(x.loDay)})` : x.today === x.hi && x.hiDay ? `ties the 28-day high (${dShort(x.hiDay)})` : '';
    const inWeek = x.today >= x.wlo && x.today <= x.whi, in28 = x.today >= x.lo && x.today <= x.hi;
    if (inWeek && (!in28 || tie)) return { cls: 'near', t: `In line with the last 5 days`, s: `${pctSaid(x.off)} from usual · ${fmt(x.wlo)}–${fmt(x.whi)} rows since ${dShort(DATA.days[Math.max(0, x.i - 5)].day)}${tie ? ` · ${tie}` : ''}` };
    if (in28) return { cls: 'in', t: 'Inside the last 28 days', s: `${pctSaid(x.off)} from usual · ${fmt(x.lo)}–${fmt(x.hi)} rows${tie ? ` · ${tie}` : ''}` };
    return { cls: 'out', t: `${x.today < x.lo ? 'Lower' : 'Higher'} than any of the last 28 days`, s: `${pctSaid(x.off)} from usual · they ran ${fmt(x.lo)}–${fmt(x.hi)} rows` };
  }
  // how serious a paused day is: mild where only your own tighter limit or check caught it, serious otherwise
  function sevOf(H) {
    const I = ISSUES[H]; if (!I) return null;
    if (I.mine && I.kind === 'rows') { const fx = figFacts(I.file, H); return fx && figLimits(fx).mineOnly ? { level: 'mild', said: 'mild: only your own tighter limit' } : { level: 'serious', said: 'serious: past Larkspur’s limit too' }; }
    if (I.mine && I.kind === 'link') return { level: 'mild', said: 'mild: your own check, where Larkspur’s only warns' };
    if (I.mine && I.kind === 'myrule') { const tl = tolOf(I.file, I.myrule), h = HI(I.file); return tl && tl.hi != null ? { level: 'mild', said: 'mild: your own rule' } : { level: 'serious', said: 'serious: your own rule' }; }
    return { level: 'serious', said: I.kind === 'empty' || I.demo ? 'serious: no rows at all' : I.kind === 'twice' ? 'serious: twice the usual rows' : I.kind === 'shift' ? 'serious: a quarter of its rows moved' : I.kind === 'wrong' ? 'serious: far from its usual share' : 'serious' };
  }
  const sevChip = (H) => { const v = sevOf(H); return v ? `<span class="sev ${v.level}" title="${esc(v.said)}">${v.level}</span>` : ''; };
  // the limits a day's rows are judged by, and what each did
  function figLimits(x) {
    const a = Math.abs(x.off), L = x.L, past = a > L, larkPast = a > 5;
    const tm = (lim) => `${(a / lim).toFixed(a / lim >= 10 ? 0 : 1)}× the ±${lim}% allowed`; // peer:dq: not “× the limit”: 20× of 853 rows would be 17,060
    if (L !== 5) return { lines: [[L, 'yours'], [5, 'Larkspur’s']], t: past && !larkPast ? `Past your ±${L}% limit (${tm(L)}); Larkspur’s ±5% wouldn’t pause it` : past ? `Past your ±${L}% limit and Larkspur’s ±5% (${tm(5)})` : `Inside your ±${L}% limit`, mineOnly: past && !larkPast };
    return { lines: [[5, 'limit']], t: past ? `${a > 50 ? 'Far past' : 'Past'} the ±5% limit: ${tm(5)}` : 'Inside the ±5% limit', mineOnly: false };
  }
  function usualFig(fid, H, opts) {
    const x = figFacts(fid, H); if (!x) return '';
    const o = opts || {}, fx = o.fixed != null ? o.fixed : null, lim = figLimits(x);
    let v = figVerdict(x);
    if (fx != null) { const offF = ((fx - x.usual) / x.usual) * 100; v = { cls: 'fixed', t: Math.abs(offF) <= x.L ? 'Sent again: about usual' : 'Sent again: still off', s: `${fmt(fx)} rows, ${pctSaid(offF)} from usual · the first file had ${fmt(x.today)}` }; }
    // peer:dq: one picture, rows from zero on one scale every file shares (usual at the same height, the top 2.2× usual):
    // the 28 days before as grey columns, the day's column coloured by how serious (amber where only your own tighter
    // limit paused it), the limit it broke drawn and labelled where it is, every number on its mark, no legend
    const W = 320, base = 100, top = 14, PH = base - top, Hh = 124, vmax = 2.2 * x.usual, Y = (val) => base - (Math.min(val, vmax) / vmax) * PH;
    const past = Math.abs(x.off) > x.L, where = past ? (lim.mineOnly ? 'warn' : 'bad') : 'in';
    const up = x.today > x.usual, lineV = up ? Math.floor(x.usual * (1 + x.L / 100)) : Math.ceil(x.usual * (1 - x.L / 100));
    const n = x.win.length, step = ((fx != null ? 210 : 244) - 4) / (n || 1), cw = Math.max(2, step * 0.68);
    const cols = x.win.map((val, j) => (val == null ? '' : `<rect class="u-bu" x="${(4 + j * step).toFixed(1)}" y="${Y(val).toFixed(1)}" width="${cw.toFixed(1)}" height="${(base - Y(val)).toFixed(1)}"/>`)).join('');
    const ly = Y(lineV), lineTxt = `${x.L !== 5 ? 'your' : 'Larkspur’s'} limit: pauses ${up ? 'above' : 'below'} ${fmt(lineV)}`, y2 = Y(2 * x.usual); // peer:dq r1: plain words, no ±
    const by = up ? x.today - lineV : lineV - x.today, gap = past && fx == null && v.cls !== 'far' ? `${fmt(by)} ${up ? 'over' : 'under'}` : ''; // peer:dq r1: a gap too small to see is said at the mark
    const col = (cx, val, cls, w, g) => { const y = Y(val), gy = Math.min(y, ly); return (val > 0 ? `<rect class="u-bt ${cls}" x="${cx - w / 2}" y="${y.toFixed(1)}" width="${w}" height="${(base - y).toFixed(1)}" rx="1.5"/>` : `<line class="u-bt0 ${cls}" x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${base}" y2="${base}"/>`) + (val > vmax ? `<path class="u-cut" d="M${cx - w / 2 - 1} ${top + 12}l${w + 2} -5M${cx - w / 2 - 1} ${top + 17}l${w + 2} -5"/>` : '') + (g ? `<text class="u-gap" x="${cx}" y="${gy.toFixed(1)}" dy="-0.35em" text-anchor="middle">${esc(g)}</text>` : '') + `<text class="u-v" x="${cx}" y="${(g ? gy : y).toFixed(1)}" dy="${g ? '-1.6em' : '-0.3em'}" text-anchor="middle">${fmt(val)}</text>`; }; // peer:dq r1: the value in ink, colour on the bar alone
    const fxOff = fx != null ? Math.abs(((fx - x.usual) / x.usual) * 100) : 0, fxWhere = fxOff <= x.L ? 'ok' : fxOff <= 5 ? 'warn' : 'bad'; // peer:dq: a file sent again that is still off is not green
    const under = (cx, t, short) => `<text class="u-ax b${short ? ' u-long' : ''}" x="${cx}" y="${base}" dy="1.05em" text-anchor="middle">${esc(t)}</text>${short ? `<text class="u-ax b u-short" x="${cx}" y="${base}" dy="1.05em" text-anchor="middle">${esc(short)}</text>` : ''}`;
    const dayCols = fx != null ? col(228, x.today, where, 18) + col(290, fx, fxWhere, 18) + under(228, 'first') + under(290, 'sent again', 'again') : col(274, x.today, where, 22, gap) + under(274, dShort(H));
    const chart = `<svg class="u-chart u-dq" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(nameOf(fid))}: the last 28 days ${fmt(x.lo)} to ${fmt(x.hi)} rows, usual ${fmt(x.usual)}; ${esc(dShort(H))} ${fmt(x.today)}, ${pctSaid(x.off)} from usual${fx != null ? `; sent again ${fmt(fx)}` : ''}; ${esc(lineTxt)}"><line class="u-grid" x1="4" x2="${W - 4}" y1="${y2.toFixed(1)}" y2="${y2.toFixed(1)}"/><text class="u-ax" x="4" y="${y2.toFixed(1)}" dy="-0.3em">2× usual</text>${cols}<line class="u-base" x1="4" x2="${W - 4}" y1="${base}" y2="${base}"/>${dayCols}<line class="u-lim" x1="4" x2="${W - 4}" y1="${ly.toFixed(1)}" y2="${ly.toFixed(1)}"/><text class="u-ll u-long" x="4" y="${ly.toFixed(1)}" dy="-0.35em">${esc(lineTxt)}</text><text class="u-ll u-short" x="4" y="${ly.toFixed(1)}" dy="-0.35em">pauses ${up ? 'above' : 'below'} ${fmt(lineV)}</text><text class="u-ax u-long" x="4" y="${base}" dy="1.05em">the 28 days before · usual ${fmt(x.usual)}</text><text class="u-ax u-short" x="4" y="${base}" dy="1.05em">usual ${fmt(x.usual)}</text></svg>`;
    // peer:dq: the words, said once: the verdict, then one line (the gap is on the mark; inside the limit, said here)
    const inside = past ? '' : ` · inside ${x.L !== 5 ? 'your' : 'Larkspur’s'} limit`;
    const sub = fx != null ? `${pctSaid(((fx - x.usual) / x.usual) * 100)} from usual` : v.cls === 'far' ? '' : v.cls === 'near' ? `${fmt(x.wlo)}–${fmt(x.whi)} rows since ${dShort(DATA.days[Math.max(0, x.i - 5)].day)}${inside}` : v.cls === 'in' ? `inside the last 28 days, ${fmt(x.lo)}–${fmt(x.hi)}${inside}` : `they ran ${fmt(x.lo)}–${fmt(x.hi)} rows${inside}`;
    return `<figure class="ufig dq ${where}${fx != null ? ' fixed' : ''}${o.compact ? ' compact' : ''}"><figcaption class="uv ${v.cls}"><b>${esc(v.t)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</figcaption>${chart}</figure>`;
  }
  // peer:builder — a link shown as the join it is: the column on each side, a few of its values matched, how many were
  // found; or, while the other file isn't read, its values waiting for that file. The card and its state.
  function joinCard(f, g, j, inward) {
    const to = fileOf(j.to), self = j.to === g.id, def = definingJoin(f), k = linkKey(g.id, j.col);
    const ready = isAdded(j.to) || j.to === f.id || !!inward || self, found = !!j.found, named = NAMED.has(j.rel), defines = !inward && def === j;
    const on = !ready || (found ? defines || !!B.on[k] : !named || linkOn(g.id, j.col, j.rel));
    const col = g.columns.find((c) => c.name === j.col), top = ((col && col.top) || []).filter(([v]) => v !== '' && v != null);
    // a value surely found: not among the misses listed, and either every miss is listed or it has more rows than the misses could
    const miss = j.miss || [], missSet = new Set(miss), surely = (v, n) => !missSet.has(v) && (!j.missN || (j.missDistinct || 0) <= miss.length || n > j.missN - Math.max(0, (j.missDistinct || 1) - 1));
    const rows = !ready ? [] : [...top.filter(([v, n]) => surely(v, n)).slice(0, j.missN ? 2 : 3).map(([v, n]) => ({ v, n, st: 'ok' })), ...(j.missN ? miss.slice(0, 2).map((v) => ({ v, n: 0, st: 'no' })) : [])];
    const port = (name, c, r) => `<span class="jn-p${r ? ' r' : ''}"><small>${esc(name)}</small><code>${esc(c)}</code></span>`;
    const head = `${port(nameOfFile(g.id), j.col)}<i class="jn-a" aria-hidden="true"></i>${ready ? port(nameOfFile(to.id), j.toCol, 1) : `<span class="jn-p r q"><small>not read yet</small><code>${esc(fname(to))}</code></span>`}`;
    const noun = /rows$/.test(ROWNOUN[g.id] || '') ? 'rows' : g.nouns || 'rows', day = `${dayLabel(DATA.day0).slice(4)}’s`;
    const vrow = (x) => `<span class="jn-v">${esc(x.v)}${x.n > 1 ? `<small>${fmt(x.n)} ${esc(noun)}</small>` : ''}</span><i class="jn-l ${x.st}" aria-hidden="true"></i><span class="jn-v r ${x.st}">${x.st === 'ok' ? `${esc(x.v)}<b aria-label="found"> ✓</b>` : x.st === 'no' ? '<b aria-label="not found">✕</b>' : '?'}</span>`;
    const all = j.rows + (j.blank || 0);
    const bar = ready && (j.missN || (j.blank || 0) / (all || 1) >= 0.01) ? `<span class="jn-bar" role="img" aria-label="${fmt(j.hit)} found${j.missN ? `, ${fmt(j.missN)} not found` : ''}${j.blank ? `, ${fmt(j.blank)} blank` : ''}, of ${fmt(all)} rows"><i class="h" style="flex:${j.hit}"></i>${j.missN ? `<i class="m" style="flex:${j.missN}"></i>` : ''}${j.blank ? `<i class="b" style="flex:${j.blank}"></i>` : ''}</span>` : '';
    const verdict = !ready ? `<b>${plural(j.distinct || 0, 'id')}</b><small>like ${top.slice(0, 2).map(([v]) => `<code>${esc(v)}</code>`).join(', ')} · on ${j.rows === all ? `all of ${day} ${fmt(all)}` : `${fmt(j.rows)} of ${day} ${fmt(all)}`} rows</small>`
      : j.missN ? `<b>${fmt(j.hit)} of ${day} ${fmt(j.rows)} rows found</b><small>${fmt(j.missN)} ${j.missN === 1 ? 'row' : 'rows'} not found: ${plural(j.missDistinct || miss.length, 'id')} not in ${esc(nameOfFile(to.id))}</small>`
      : `<b>All ${plural(j.distinct || 0, 'id')} found</b><small>on ${day} ${fmt(j.rows)} rows${j.blank ? ` · ${fmt(j.blank)} blank` : ''}</small>`;
    const sent = !inward && to && kindOfFile(to.id) === kindOfFile(g.id) && memberSentence(g) ? memberSentence(g) : linkSentence(g.id, j);
    const from = `${found ? 'found in the data' : 'Larkspur’s model'}${j.rel === 'acted for by' && !on ? ' · from Mon Mar 11' : ''}`;
    const tg = !ready || defines || (!named && !found) ? '' : `<label class="jn-tg"><input type="checkbox" role="switch" ${found ? `data-found="${k}"` : `data-link="${k}"`}${on ? ' checked' : ''} aria-label="Linked on ${esc(j.col)}"><i class="jn-sw" aria-hidden="true"></i>Linked</label>`;
    const h = `<li class="jn${ready ? '' : ' later'}${on ? '' : ' off'}${j.missN ? ' part' : ''}" data-jn="${esc(k)}"><div class="jn-g">${head}${rows.map(vrow).join('')}</div><p class="jn-n">${bar}${verdict}</p><p class="jn-s"><span>${esc(sent)} <span class="bp-from">${from}</span></span>${tg}</p></li>`;
    return { h, ready, on };
  }
  function readView(f) {
    const regKind = f.register && !isAdded(f.id) ? f.kind : null, kNow = kindOfFile(f.id);
    const keys = keyCandidates(f), keyNow = B.keys[f.id] || (f.key || (f.key2 ? f.key2.join(' + ') : null));
    const keyCol = f.columns.find((c) => c.name === keyNow);
    const k1 = keyNow && !keyCol ? f.columns.find((c) => c.name === keyNow.split(' + ')[0]) : null;
    const xv = f.id === 'exceptions' ? (DATA.xtab || {})['exceptions.version'] : null, dupIds = f.rows - (k1?.distinct || 0);
    const keyWords = keyCol ? `<code>${esc(keyNow)}</code>: ${fmt(keyCol.distinct)} different values, none blank` : keyNow ? (xv ? `${fmt(xv.ids)} exceptions in ${fmt(xv.rows)} rows: <span class="vgrp"><span class="vbar" aria-hidden="true"><i style="flex:${xv.ids - xv.two - xv.v2only}"></i><i class="b" style="flex:${xv.two}"></i><i class="c" style="flex:${xv.v2only}"></i></span><span><i class="vk"></i>${fmt(xv.ids - xv.two - xv.v2only)} version 1 only</span><span><i class="vk b"></i>${fmt(xv.two)} versions 1 and 2, the first superseded</span><span><i class="vk c"></i>${fmt(xv.v2only)} others, version 2 alone: version 1 missing</span></span><code>${esc(keyNow.split(' + ')[0])}</code> alone repeats; with <code>${esc(keyNow.split(' + ')[1])}</code> every row differs` : `<code>${esc(keyNow.split(' + ')[0])}</code> alone repeats: ${fmt(k1?.distinct || 0)} different values in ${fmt(f.rows)} rows; with <code>${esc(keyNow.split(' + ')[1])}</code> every row differs`) : 'No column differs on every row';
    const one = f.scope ? 'One application in scope' : f.register ? `One ${ONE[f.kind]}` : ONE_ROW[f.id] || `One ${f.noun || 'row'}`;
    const kl = kindLinks(f), byKind = [...new Map(kl.sort((a, b) => b.cover - a.cover).map((x) => [x.kind, x])).values()];
    const kn = (k) => B.kindNames?.[k] || kindOf(k).name;
    const kindName = asksKind(f) ? 'Not picked yet' : String(kNow).startsWith('own:') ? `${ownKind(kNow).name} · a kind of its own` : f.register ? `${kn(f.kind)} · a new kind of thing` : `About ${kn(kNow)}`;
    const kindWhy = f.register ? (f.refs.length ? `${f.refs.length} other file${f.refs.length === 1 ? ' lists' : 's list'} ${esc(PL[f.kind] || 'rows')} by ${esc(f.key)}` /* peer:builder: said once */ : `Each ${esc(ONE[f.kind])} is listed here once`) : f.scope ? 'One row for each application it covers' : '';
    const best = byKind[0], larks = byKind.find((x) => x.kind === f.kind), ties = byKind.filter((x) => Math.abs(x.cover - (best?.cover || 0)) < 1e-9);
    const larkNote = !f.kind || !best || !larks ? '' : ties.length > 1 && ties.some((x) => x.kind === f.kind) ? `<p class="ev">Its rows point at ${ties.map((x) => esc(aOne(x.kind))).join(' and ')} alike (${fmt(best.j.hit)} of ${fmt(f.rows)} each): either fits; Larkspur chose ${esc(kindOf(f.kind).name)} and didn’t record why.</p>` : best.kind !== f.kind && best.cover > larks.cover ? `<p class="ev">More of its rows point at ${esc(aOne(best.kind))} (${fmt(best.j.hit)} of ${fmt(f.rows)}) than at ${esc(aOne(f.kind))} (${fmt(larks.j.hit)}); Larkspur’s reason for ${esc(kindOf(f.kind).name)} isn’t recorded.</p>` : '';
    const asks = asksKind(f);
    const eff = f.register || f.scope ? null : effectsOf(f, [...byKind.map((x) => x.kind), 'own']);
    const effSaid = (k) => { const e = eff[k]; if (!e) return ''; const card = k === 'own' ? `a new card, ${OWN_NAME[f.id] || cap(f.noun || 'row')}` : `the ${kindOf(k).name} card`; return `Lands on ${card} · ${e.brings.length ? e.brings.join(' · ') : 'draws no link between kinds'}`; };
    const selWhy = !f.register && !f.scope && best && larks && best.kind !== f.kind && best.cover > larks.cover ? `<p class="ev sel">◷ Larkspur’s pick: <b>${esc(kn(kNow))}</b> · the data suggests <b>${esc(kn(best.kind))}</b> (more rows point there)</p>` : '';
    const picks = f.register || f.scope ? '' : `${selWhy}<p class="ev">Picking another kind moves its card and links on the map; its checks and outputs stay as they are.</p>${larkNote}${asks ? `<p class="ev ask"><b>Pick one to add it.</b> The data and Larkspur’s pick differ, and Larkspur didn’t record why.</p>` : ''}<div class="bf-kinds" role="radiogroup" aria-label="What kind of thing it is about">${byKind.map((x) => { const on = !asks && x.kind === kNow; return `<label class="${on ? 'on' : ''}"><input type="radio" name="k-${f.id}" value="${x.kind}" data-kindpick="${f.id}" ${on ? 'checked' : ''}><span><b>About ${esc(kindOf(x.kind).name)}</b>${x.kind === f.kind ? ' <i class="own">Larkspur’s pick</i>' : ''}${x === best && best.kind !== f.kind && best.cover > (larks?.cover || 0) ? ' <i class="fit">Data suggests</i>' : ''}<small>${esc(x.said)}</small><span class="kcov" aria-hidden="true"><i style="width:${Math.round(x.cover * 100)}%"></i></span><small class="keff">${esc(effSaid(x.kind))}</small></span></label>`; }).join('')}<label class="${!asks && String(kNow).startsWith('own:') ? 'on' : ''}"><input type="radio" name="k-${f.id}" value="own" data-kindpick="${f.id}" ${!asks && String(kNow).startsWith('own:') ? 'checked' : ''}><span><b>A kind of its own: ${esc(OWN_NAME[f.id] || cap(f.noun || 'row'))}</b><small>${f.key2 || f.key ? `${fmt(keyNow && keyNow.includes(' + ') && k1 ? k1.distinct : keyCol ? keyCol.distinct : (k1?.distinct || f.rows))} ${esc((OWN_NAME[f.id] || f.noun || 'row').toLowerCase())}s${keyNow && keyNow.includes(' + ') && k1 && k1.distinct < f.rows ? ` in ${fmt(f.rows)} rows (a row a version)` : ''}, its own key (${esc(keyNow || '')}), ${byKind.length} links out` : `its key makes each ${esc((OWN_NAME[f.id] || f.noun || 'row').toLowerCase())} a thing in itself`}</small><small class="keff">${esc(effSaid('own'))}</small></span></label></div>`;
    const keyPick = keys.length > 1 || f.key2 ? `<fieldset class="bf-keys"><legend>Each row’s unique ID${'' /* peer:builder: the list says how many could be */}</legend>${keys.map((k) => { const u = keyUnique(f, k), lk = k === f.key || (f.key2 && k === f.key2.join(' + ')); return `<label class="bf-keyc${k === keyNow ? ' on' : ''}"><input type="radio" name="key-${f.id}" data-keypick="${f.id}" value="${esc(k)}"${k === keyNow ? ' checked' : ''}><code>${esc(k)}</code><small>${u === f.rows ? `all ${fmt(f.rows)} unique` : `${fmt(u)} of ${fmt(f.rows)} unique`}${k === keyNow && keyCol ? keyHistSaid(f, keyNow).replace(' · and on every one of the ', ' · and on the ') : '' /* peer:builder */}${lk ? ' · Larkspur’s model' : ''}</small></label>`; }).join('')}</fieldset>${keyNow && keyUnique(f, keyNow) < f.rows ? `<p class="ev warnt">${fmt(f.rows - keyUnique(f, keyNow))} rows repeat an id under this key: its Key check would pause every day.</p>` : ''}` : ''; // peer:builder: "all unique" says no row repeats it
    const def = definingJoin(f);
    const inn = B.added.map(fileOf).flatMap((g) => (g.joins || []).filter((j) => j.to === f.id && j.col && g.id !== f.id && !j.found).map((j) => ({ g, j })));
    const out = (f.joins || []).filter((j) => j.col && !j.found), extra = (f.joins || []).filter((j) => j.found);
    const linkLi = (g, j, inward) => {
      const to = fileOf(j.to), ids = `<code>${esc(j.col)}</code> → ${j.to === g.id ? 'its own rows' : `${esc(nameOfFile(to.id))}`}`;
      const ready = isAdded(j.to) || j.to === f.id || inward;
      if (!ready) return `<li class="later"><span class="ls">Refers to ${esc(plOf(to.kind))}: read ${esc(fname(to))} to link them</span><span class="lk">${ids} · filled on ${j.rows === g.rows ? 'all ' : ''}${fmt(j.rows)} of its rows, like <code>${esc(sample(g, j.col))}</code> · matched once you read ${esc(fname(to))} ${FROM('from the data')}</span></li>`;
      const named = NAMED.has(j.rel), k = linkKey(g.id, j.col), on = !named || linkOn(g.id, j.col, j.rel), defines = !inward && def === j;
      const m = j.missN ? `<span class="lmatch part">${fmt(j.hit)} of ${fmt(j.rows)} rows found</span>` : j.blank ? `<span class="lmatch part">${fmt(j.hit)} of ${fmt(j.hit + j.blank)} rows · ${fmt(j.blank)} blank</span>` : `<span class="lmatch">all found</span>`;
      const box = defines || !named ? `<input type="checkbox" checked disabled aria-label="${defines ? 'This link puts it in its kind' : 'Every row of this file is about one of these'}">` : `<input type="checkbox" data-link="${k}" ${on ? 'checked' : ''} aria-label="Include this link">`;
      const note = j.rel === 'acted for by' && !on ? '<span class="lmiss">Larkspur adds this relation from Mon Mar 11: leave it off until then, or turn it on now.</span>' : defines ? '<span class="lmiss lock">Locked: this link puts the file in its kind. Pick another kind to drop it.</span>' : !named ? `<span class="lmiss lock">Always on: each row names one, and Larkspur’s model keeps every such link.</span>` : on && !(k in B.off) ? '<span class="lmiss lark">Larkspur’s pick</span>' : '';
      const sent = !inward && kindOfFile(to.id) === kindOfFile(g.id) && memberSentence(g) ? memberSentence(g) : linkSentence(g.id, j);
      return `<li class="${on ? '' : 'off'}">${box}<span class="ls">${esc(sent)}</span>${m}<span class="lk">${inward ? `${esc(poss(nameOfFile(g.id)))} ` : ''}${ids} · ${esc(countSaid(g, j))}</span>${j.missN ? `<span class="lmiss">Not found: ${j.miss.map((x) => `<code>${esc(x)}</code>`).join(' ')}${j.missN > j.miss.length ? ' …' : ''}</span>` : ''}${j.blank ? `<span class="lmiss">${j.blank === 1 ? '1 row leaves it blank' : `${fmt(j.blank)} rows leave it blank`}</span>` : ''}${note}</li>`;
    };
    const foundLi = (j) => {
      const to = fileOf(j.to), k = linkKey(f.id, j.col), defines = def === j, on = defines || !!B.on[k], ready = isAdded(j.to);
      const box = !ready ? '' : defines ? '<input type="checkbox" checked disabled aria-label="This link puts it in its kind">' : `<input type="checkbox" data-found="${k}" ${on ? 'checked' : ''} aria-label="Include this link">`;
      return `<li class="${on ? '' : 'off'}${ready ? '' : ' later'}">${box}<span class="ls">${ready ? esc(defines && memberSentence(f) ? memberSentence(f) : linkSentence(f.id, j)) : `Refers to ${esc(plOf(to.kind))}: read ${esc(fname(to))} to link them`}</span><span class="lmatch${j.missN || j.blank ? ' part' : ''}">${j.missN ? `${fmt(j.hit)} of ${fmt(j.rows)} found` : j.blank ? `${fmt(j.hit)} of ${fmt(j.hit + j.blank)} rows · ${fmt(j.blank)} blank` : 'all found'}</span><span class="lk"><code>${esc(j.col)}</code> → ${esc(nameOfFile(to.id))} · ${plural(j.distinct, 'different value')}${j.blank ? ` · ${fmt(j.blank)} rows blank` : ''}</span><span class="lmiss">${defines ? 'This link puts it in its kind' : 'Found in its data; not in Larkspur’s model, so off unless it means something to you'}</span></li>`;
    };
    const cols = f.columns.map((c) => {
      const role = c.name === f.key || (f.key2 || []).includes(c.name) ? 'key' : (f.joins || []).some((j) => j.col === c.name && j.to && j.to !== f.id) ? 'id' : roleOf(f, c);
      const cv = (v) => { const L = label(f, c.name, v); return L && L.toLowerCase() !== String(v).toLowerCase() ? `<span class="cv"><code>${esc(v)}</code> ${esc(L)}</span>` : /\s/.test(v) ? esc(v) : `<code>${esc(v)}</code>`; };
      const vals = c.unique ? `${fmt(c.distinct)} different` : c.top.length && c.distinct <= 8 && c.top.length >= Math.min(c.distinct, 3) ? `<span class="vbar" aria-hidden="true">${c.top.map(([v, n], i) => `<i class="v${i % 4}" style="width:${Math.max(1, (n / (f.rows || 1)) * 100).toFixed(1)}%"></i>`).join('')}</span>${c.top.map(([v, n]) => `${cv(v)} ×${fmt(n)}`).join(' · ')}${c.distinct > c.top.length ? ` · ${c.distinct - c.top.length} more` : ''}` : `${fmt(c.distinct)} different${c.top[0] ? `, like <span class="nw">${esc(c.top[0][0])}</span>` : ''}`;
      const own = (B.ctypes || {})[`${f.id}.${c.name}`], ty = own || role, nn = f.rows - (c.blanks || 0);
      const tyEv = ty === 'date' ? `${fmt(nn)} of ${fmt(f.rows)} read as dates` : ty === 'number' ? `${fmt(nn)} of ${fmt(f.rows)} read as numbers` : ty === 'code' ? `${plural(c.distinct, 'value')}, from a list` : ty === 'key' || ty === 'id' ? (c.unique ? 'each row its own' : `${fmt(c.distinct)} different, pointing at another file`) : 'free text';
      const shown = `<select class="ty-sel ${ty}" data-ctype="${f.id}.${c.name}" aria-label="${esc(c.name)}: kind of column" title="${esc(tyEv)}">${['key', 'id', 'code', 'date', 'number', 'text'].map((k) => `<option value="${k}"${k === ty ? ' selected' : ''}>${k}</option>`).join('')}</select>${own ? '<i class="ty-own">yours</i>' : ''}<small class="ty-ev">${esc(tyEv)}</small>`;
      const mean = (f.meanings[c.name] || '').replace(/, or the platform a link starts from$/, '');
      const to0 = (f.joins || []).find((j) => j.col === c.name && j.to && j.to !== f.id);
      return `<tr><td><code>${esc(c.name)}</code><span class="ty ${ty}">${shown}</span>${to0 ? `<span class="lto">→ ${esc(nameOfFile(to0.to))}</span>` : ''}</td><td class="vals">${vals}${c.blanks ? ` <span class="blank">· ${fmt(c.blanks)} blank</span>` : ''}</td><td class="mean">${esc(mean)}</td></tr>`;
    }).join('');
    const scope = f.scope ? scopeBox(f) : '';
    const control = f.control ? `<div class="bf-prop"><h4>What it is evidence for</h4><p class="pv">The control <b>${esc(f.control)}</b></p></div>` : '';
    // peer:builder — every link a join card: those checked against a file in hand first, those waiting for a file after
    const inLis = inn.map(({ g, j }) => joinCard(f, g, j, true)), extraOn = extra.filter((j) => B.on[linkKey(f.id, j.col)] || def === j), extraOff = extra.filter((j) => !extraOn.includes(j)), outLis = [...extraOn, ...out].map((j) => joinCard(f, f, j, false)).sort((a, b) => b.ready - a.ready), jcs = [...inLis, ...outLis];
    const body = `<div class="bf-file"><span class="gl big">${GL.file}</span><div><b>${esc(fname(f))}</b><span>Feb 1’s file · ${fmt(f.rows)} rows · ${f.columns.length} columns · ${f.every === 'daily' ? 'a new one daily' : 'static'}</span></div></div>${!isAdded(f.id) && matchMedia('(max-width: 760px)').matches && !B.map && X().models.build && (X().models.build.kinds || []).length ? `<div class="rd-mini">${modelPic(X().models.build, true)}<p class="bp-mininote">What Add adds, dashed</p></div>` : ''}
      <label class="bf-name"><span>File’s name on the map</span><input type="text" data-name="${f.id}" value="${esc(nameOfFile(f.id))}" aria-label="File’s name on the map"></label>
      <details class="bf-descd"><summary><span class="bf-desc1">${f.id === 'cmdb_apps' ? '<b>CMDB</b>: the company’s register of its applications' : esc(String(f.description).split(/[:;.] /)[0]) /* peer:builder: the line shows one clause; More has the rest */}</span><span class="bf-more">More</span></summary><p class="bf-desc">${f.id === 'cmdb_apps' ? '<b>CMDB</b>: the company’s register of its applications. ' : ''}${esc(f.description)} ${FROM('Larkspur’s description')}</p></details>
      <div class="bf-props"><div class="bf-prop${picks ? ' wide' : ''}"><h4>What one row is</h4><p class="pv">${esc(one)}</p>${keyPick && keyCol ? '' : `<p class="ev">${keyWords}${keyHistSaid(f, keyNow)}</p>`}${keyPick}</div></div>
      ${jcs.length ? `<h4 class="bp-h">Links · ${jcs.length}</h4><ul class="jn-list">${jcs.map((x) => x.h).join('')}</ul>` : ''}
      <div class="bf-props bf-props2"><div class="bf-prop${picks ? ' wide' : ''}"><h4>What kind of thing</h4>${f.register ? `<label class="bf-kname"><span>Kind’s name</span><input type="text" data-kname="${f.kind}" value="${esc(B.kindNames?.[f.kind] || kindOf(f.kind).name)}" aria-label="Kind’s name"></label>` : ''}<p class="pv">${esc(kindName)}</p>${kindWhy ? `<p class="ev">${kindWhy}</p>` : ''}${picks}</div>${scope}${control}</div>
      ${extraOff.length ? `<h4 class="bp-h">Also found in its data · ${extraOff.length}</h4><ul class="jn-list">${extraOff.map((j) => joinCard(f, f, j, false).h).join('')}</ul>` : ''}
      ${rulesPart(f)}
      <details class="bf-colsd"><summary><span class="bp-h">Its ${f.columns.length} columns ›</span><span class="bf-tys">${(() => { const n = {}; for (const c of f.columns) { const r = (B.ctypes || {})[`${f.id}.${c.name}`] || (c.name === f.key || (f.key2 || []).includes(c.name) ? 'key' : (f.joins || []).some((j) => j.col === c.name && j.to && j.to !== f.id) ? 'id' : roleOf(f, c)); n[r] = (n[r] || 0) + 1; } return ['key', 'id', 'code', 'date', 'number', 'text'].filter((k) => n[k]).map((k) => `<i class="ty ${k}">${n[k]} ${k === 'text' ? 'text' : k + (n[k] > 1 ? 's' : '')}</i>`).join(''); })()}</span></summary><p class="bp-note">${FROM('meanings from Larkspur’s descriptions')}</p><div class="bf-colwrap"><table class="bf-cols"><tbody>${cols}</tbody></table></div></details>`;
    const done = isAdded(f.id);
    const nlinks = jcs.filter((x) => x.ready && x.on).length, nlater = jcs.filter((x) => !x.ready).length; // peer:builder
    const sum = done ? '' : [regKind ? `New kind: <b>${esc(kindOf(regKind).name)}</b>` : String(kNow).startsWith('own:') ? `New kind: <b>${esc(ownKind(kNow).name)}</b>` : `About <b>${esc(kindOf(kNow)?.name || '')}</b>`, [nlinks ? plural(nlinks, 'link') : '', nlater ? `${nlater}${nlinks ? ' more' : ' links'} when ${nlater === 1 ? 'its file is' : 'their files are'} read` : ''].filter(Boolean).join(', ') || 'no links'].join(' · ');
    const backTo = B.readFrom === 'feeds' ? `<button class="btn" data-act="feeds">‹ Back to the evidence files</button>` : '';
    return { body, sum: asks ? 'Pick what kind of thing it is about' : sum, foot: backTo || (done ? `<button class="btn" data-act="back">‹ Back to the files</button>` : `<button class="btn" data-act="back" title="It stays out of your model until you read it again">Skip for now</button><button class="btn primary" data-act="add" data-id="${f.id}" ${asks ? 'disabled' : ''}>${asks ? 'Pick a kind first' : `Add ${esc(nameOfFile(f.id))} ›`}</button>`) };
  }
  // which applications an evidence file covers: found in the data, the CMDB's applications that share what its rows share
  function scopeBox(f) {
    const s = f.scope, pct = Math.round((s.both / s.inScope) * 100);
    return `<div class="bf-prop wide"><h4>Applies to ${FROM('the control catalogue')}</h4><p class="pv">${s.where.map((w) => `<span class="chip">${esc(condSaid(w))}</span>`).join('')}</p><div class="cov" aria-hidden="true"><i style="width:${pct}%"></i></div><p class="ev">${s.both === s.inScope ? `It covers all ${fmt(s.inScope)} applications that need it` : `It covers ${fmt(s.both)} of the ${fmt(s.inScope)} applications that need it`}${s.rows > s.both ? ` · ${fmt(s.rows - s.both)} rows for others` : ''}</p></div>`;
  }
  const sample = (g, col) => (g.columns.find((c) => c.name === col)?.top[0] || ['…'])[0];
  const label = (f, col, v) => ((f.labels || {})[col] || {})[v] || v;
  const roleOf = (f, c) => { const mc = fullDs(f.id)?.columns.find((x) => x.name === c.name); const r = mc?.role; return r === 'category' ? 'code' : r === 'key' ? 'id' : r || (c.type === 'integer' || c.type === 'decimal' ? 'number' : c.type === 'date' || c.type === 'timestamp' ? 'date' : 'text'); };

  // ---------------------------------------------------------------- the evidence feeds, together
  function feedsView() {
    const short = (id) => { const s0 = fileOf(id).scope; return s0.both !== s0.inScope || fileOf(id).unknown ? 0 : 1; };
    const ids = DATA.order.filter((id) => !isAdded(id) && fileOf(id).scope).sort((a, b) => short(a) - short(b)), skip = B.skipFeed || {}, nShort = ids.filter((id) => !short(id)).length;
    const RES = { pass: 'pass', fail: 'fail', not_assessed: 'not assessed' };
    const RW = { pass: 'meet it', fail: 'don’t', not_assessed: 'not assessed' };
    const rows = ids.map((id) => { const f = fileOf(id), s = f.scope, tot = (f.results || []).reduce((a, [, n]) => a + n, 0) || 1, bar = `<span class="ff-bar" aria-hidden="true">${(f.results || []).map(([v, n]) => `<i class="${v}" style="width:${((n / tot) * 100).toFixed(1)}%"></i>`).join('')}</span>`, res = (f.results || []).map(([v, n]) => `${fmt(n)} ${RW[v] || v}`).join(' · '); return `<li><label><input type="checkbox" data-feed="${id}" ${skip[id] ? '' : 'checked'} aria-label="Include ${esc(nameOfFile(f.id))}"><span class="ff-n"><b>${esc(f.control || nameOfFile(f.id))}</b><small>${esc(nameOfFile(f.id))}</small><span class="ff-sc"><b class="ffc">Covers</b>${s.where.map((w) => `<i>${esc(condSaid(w))}</i>`).join('')}</span></span>${short(id) ? '<span class="ff-m"></span>' : `<span class="ff-m">${s.both === s.inScope ? '' : `<b class="short">${fmt(s.inScope)} need it: ${fmt(s.both)} here</b>`}${f.unknown ? `<small><b class="short">${fmt(f.unknown)} not in the CMDB</b></small>` : ''}</span>`}<span class="ff-r">${bar}<span>Feb 1: ${esc(res)}</span></span></label><button type="button" class="ff-go" data-act="read" data-id="${id}" data-from="feeds" aria-label="Read ${esc(fname(f))}">›</button></li>`; }).join('');
    const n = ids.filter((id) => !skip[id]).length;
    return {
      body: `<p class="bp-lead">${ids.length} evidence files: one row per application, one control each. ${FROM('the control catalogue')}</p><p class="ff-inc">Ticked: included when you press Add.</p><p class="ff-key"><span><i class="pass"></i>meet it</span><span><i class="fail"></i>don’t</span><span><i class="not_assessed"></i>not assessed</span><span>on Feb 1</span></p>${nShort ? `<p class="ff-first"><b>${plural(nShort, 'file')} first:</b> each misses applications it should cover, or names one the CMDB doesn’t have.</p>` : `<p class="ff-first">✓ All ${ids.length} find every application they should cover, each one in the CMDB.</p>`}<ul class="bf-feeds">${rows}</ul><p class="bp-note">› reads one file whole: its columns, links and values.</p>`,
      foot: `<button class="btn" data-act="back">‹ Back</button><button class="btn primary" data-act="addfeeds" ${n ? '' : 'disabled'}>Add ${n} files ›</button>`,
    };
  }

  // ---------------------------------------------------------------- history
  function spark(vals, last, w = 140, h = 30, u) {
    const v = (vals || []).filter((x) => x != null); if (!v.length) return '';
    if (u) { const L = rowsLimit() / 100, lo = u * (1 - L - 0.02), hi = u * (1 + L + 0.02), Y = (x) => h - 3 - ((Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo)) * (h - 6), X0 = (i, n) => (i / (n - 1)) * (w - 8); return `<svg class="bh-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect class="bh-band" x="0" y="${Y(u * (1 + L)).toFixed(1)}" width="${w - 8}" height="${(Y(u * (1 - L)) - Y(u * (1 + L))).toFixed(1)}"/><line class="bh-mid" x1="0" x2="${w - 8}" y1="${Y(u).toFixed(1)}" y2="${Y(u).toFixed(1)}"/><polyline points="${v.map((x, i) => `${X0(i, v.length).toFixed(1)},${Y(x).toFixed(1)}`).join(' ')}"/>${last != null ? `<circle cx="${w - 3}" cy="${Y(last).toFixed(1)}" r="2.8"/>` : ''}</svg>`; }
    const all = last != null ? [...v, last] : v, lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
    const X0 = (i, n) => ((i / (n - 1)) * (w - 8)), Y = (x) => h - 4 - ((x - lo) / span) * (h - 8);
    const pts = v.map((x, i) => `${X0(i, v.length).toFixed(1)},${Y(x).toFixed(1)}`).join(' ');
    const tail = v.slice(-28), b0 = Math.min(...tail), b1 = Math.max(...tail);
    return `<svg class="bh-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect class="bh-band" x="${X0(v.length - 28, v.length).toFixed(1)}" y="${Y(b1).toFixed(1)}" width="${(w - 8 - X0(v.length - 28, v.length)).toFixed(1)}" height="${Math.max(1.5, Y(b0) - Y(b1)).toFixed(1)}"/><polyline points="${pts}"/>${last != null ? `<circle cx="${w - 3}" cy="${Y(last).toFixed(1)}" r="2.8"/>` : ''}</svg>`;
  }
  // a file's usual mix of values, the one the Learned check compares a day with: each value's share, its range beside it
  const mixBar = (m) => { const shown = m.vals.slice(0, 2).map(([v, sh, lo, hi]) => `${v == null ? 'blank' : /^\d+$/.test(String(v)) ? `“${esc(String(v))}”` : esc(String(v).replace(/_/g, ' '))} ${sh}%${hi - lo >= 0.5 ? ` (${lo}–${hi})` : ''}`); return `<span class="bh-mix"><span class="mx" aria-hidden="true">${m.vals.map(([, sh], i) => `<i class="m${i}" style="flex:${Math.max(sh, 0.6)}"></i>`).join('')}</span><small><code>${esc(m.col)}</code> ${shown.join(' · ')}${m.vals.length > 2 ? ` · ${m.vals.length - 2} more` : ''}</small></span>`; };
  function historyView() {
    const outside = [];
    const tiles = B.added.map(fileOf).filter((f) => f.history).map((f) => {
      const d = f.history.daily.filter((x) => x != null), tail = d.slice(-28), lo = Math.min(...tail), hi = Math.max(...tail);
      const wk = d.length > 56 ? Math.round(((d[d.length - 1] - d[d.length - 57]) / 8)) : 0, steady = lo === hi;
      const u = usualOn(f.id, DATA.day0) || Math.round((lo + hi) / 2), off = u ? ((f.rows - u) / u) * 100 : 0, inBand = Math.abs(off) <= rowsLimit();
      if (!inBand) outside.push(nameOfFile(f.id));
      const pc = Math.abs(off) < 0.05 ? '±0%' : `${off > 0 ? '+' : '−'}${Math.abs(off).toFixed(1)}%`;
      return `<li class="${steady ? 'flat' : ''}"><b>${esc(nameOfFile(f.id))}</b>${steady ? '' : spark(d, f.rows, 140, 30, u)}<small>${steady ? `always ${fmt(lo)} rows` : `usually ${fmt(u)} · Feb 1: ${fmt(f.rows)}, ${pc}`}${!steady && Math.abs(wk) >= Math.max(3, hi * 0.002) ? ` · ${wk > 0 ? 'growing' : 'shrinking'} about ${fmt(Math.abs(wk))} a week` : ''}</small>${f.mix ? mixBar(f.mix) : ''}</li>`;
    }).join('');
    const fixed = B.added.map(fileOf).filter((f) => !f.history).map((f) => nameOfFile(f.id));
    return {
      body: `<p class="bp-lead">Aug 1 to Jan 31: each file’s usual size and mix, to judge Feb 1 to Mar 27 by. ${FROM('the folder’s past files')}</p><p class="bh-v ${outside.length ? 'off' : 'ok'}">${outside.length ? `◆ Feb 1 outside the Rows check’s ±${rowsLimit()}%: ${esc(outside.join(', '))}` : `✓ On Feb 1, every daily file was within ±${rowsLimit()}% of its usual size: the Rows check’s limit`}</p><details class="bh-how"><summary>How “usual” is worked out ›</summary><p class="bp-note">A file’s usual size is the middle of its last 28 days (the median), worked out again each day; the Rows check pauses a day more than ${rowsLimit()}% away from it (you can change that in Checks).</p></details><p class="bh-key"><span><i class="ln"></i>rows each day</span><span><i class="bd"></i>within ±${rowsLimit()}% of usual: the Rows check stays quiet</span><span><i class="dt"></i>Feb 1</span><span><i class="mxk"></i>its usual mix of one column’s values, the last 28 days</span></p><ul class="bh-grid">${tiles}</ul>${fixed.length ? `<p class="bp-note">${esc(fixed.join(' and '))} ${fixed.length === 1 ? 'is a static file' : 'are static files'}: nothing to learn day to day.</p>` : ''}<p class="bp-note">On the map, each file shows its rows over those days.</p>`,
      foot: B.history ? `<button class="btn primary" data-act="go" data-to="rules">Next: the checks ›</button>` : `<button class="btn" data-act="go" data-to="files">‹ Back</button><button class="btn primary" data-act="history">Learn from 184 days ›</button>`,
    };
  }

  // ---------------------------------------------------------------- checks: eight kinds, each a plain question, what it does, what it did in the record
  const PZ2 = '<svg class="pz2 pz" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M8 .5a7.5 7.5 0 1 0 0 15A7.5 7.5 0 0 0 8 .5zM4.9 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0zM8.7 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0z"/></svg>';
  const MODE_MARK = { hold: PZ2, warn: '◆', learn: `${PZ2}<sup>¼</sup>`, note: '○', off: '–' };
  const MODE_WORD = { hold: 'pauses the day', warn: 'warns', learn: 'pauses if a quarter of the rows change', note: 'notes', off: 'off' };
  const KIND_Q = { schema: 'Are its columns the ones described?', fresh: 'Was it exported on the day it covers?', amount: 'About as many rows as a usual day?', key: 'Is every id there, and only once?', scope: 'One row for each application it covers?', values: 'Only the codes it knows?', learned: 'Is each value about as common as usual?', links: 'Does every link point at something there?' };
  // which check a finding of the record belongs to
  const checkKindOf = (said) => (/arrived empty/.test(said) ? 'amount' : /repeat a key/.test(said) ? 'key' : /^new |almost gone$/.test(said) ? 'values' : /stale|exported before/.test(said) ? 'fresh' : 'learned');
  function recordOfChecks() {
    const out = Object.fromEntries(CHECKS.map(([c]) => [c, { paused: new Set(), warned: new Set() }]));
    for (const x of DATA.days) {
      if (x.day > LAST) break;
      const holds = new Set((x.holds || []).map((h) => h.replace(/_checked$/, '')));
      for (const f of x.finds || []) if (f.file) for (const k of /arrived empty/.test(f.said) && fileOf(f.source)?.scope ? ['amount', 'scope'] : /repeat a key/.test(f.said) ? ['key', 'amount'] : [checkKindOf(f.said)]) (holds.has(f.source) ? out[k].paused : out[k].warned).add(x.day);
      const lf = linkFindings(x).filter((l) => !l.quiet && !GAP_KEYS.has(l.k)); if (lf.some((l) => l.pause)) out.links.paused.add(x.day); else if (lf.length) out.links.warned.add(x.day);
    }
    return out;
  }
  const daysSaid = (n) => plural(n, 'day');
  const ROWS_STEPS = [1, 2, 3, 5, 10, 25, 50];
  const rowsLimit = () => B.rowsLimit || 5;
  const rowsLimitFor = (fid) => (B.rowsLimitOf || {})[fid] || rowsLimit();
  const limitOn = (fid, day) => ((B.limitFrom || {})[fid] || []).filter((c) => c.from <= day).reduce((L, c) => c.L, rowsLimitFor(fid));
  // the days in the 28 up to a day on which a limit would have paused a file
  function limitDays(fid, L, H) { const f = fileOf(fid), out = [], i1 = dayIdx(H); if (!f || !f.counts) return out; for (let i = Math.max(0, i1 - 27); i <= i1; i++) { const y = DATA.days[i], c = f.counts[i], u = usualAt(fid, i); if (!y || y.day <= '2024-02-01' || c == null || !u) continue; if (Math.abs((c - u) / u) > L / 100) out.push(y.day); } return out; }
  // the days a Rows limit pauses, from each file's rows against its usual size (the files whose Rows check pauses)
  function rowsBeyond(L, dated) {
    const out = {};
    for (const f of B.added.map(fileOf)) {
      if (!f.counts || !['hold', 'learn'].includes(checkOf(f, 'amount'))) continue;
      const Lf = (B.rowsLimitOf || {})[f.id] || L; f.counts.forEach((c, i) => { const y = DATA.days[i]; if (!y || y.day <= '2024-02-01' || y.day > LAST) return; const u = dated ? usualAt(f.id, i) : f.usual[i]; if (c == null || !u) return; const off = (c - u) / u; if (Math.abs(off) > (dated ? limitOn(f.id, y.day) : Lf) / 100) (out[y.day] ||= []).push([f.id, c, u, off]); });
    }
    return out;
  }
  const md = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const listAnd = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const datesOf = (set) => { const a = [...set].sort().map(md); return a.length <= 8 ? listAnd(a) : `${a.slice(0, 7).join(', ')} and ${a.length - 7} more days`; };
  // the days the record paused, and which of them an output's own check paused with nothing of the files' pausing
  const pausedDays = () => DATA.days.filter((y) => y.day <= LAST && (y.holds || []).length).map((y) => y.day);
  // why a file's check differs from the rest: Larkspur's own words, from the notebook that sets it
  const SET_APART_WHY = { 'findings.amount': 'its ledger swings with Patch Tuesday; an application the scanner should reach with no row still pauses it, by Scope', 'findings.values': 'new words from the scanner only warn: the outputs read them in any case' };
  // the limits Larkspur wrote: the bands in its ontology
  const LIMITS = [['Not assessed', 'at most 1 in 20 rows of any evidence file'], ['WAF failing', 'at most 15% of a firewall’s applications (10% from Mon Mar 25)'], ['Scans without credentials', 'at most 2% of findings'], ['Owner conflicts', 'none, in Applications']];
  const SEG_WORD = { hold: 'pause', warn: 'warn', learn: 'pause if ¼ of rows change', off: 'off', note: 'note', new: 'warn of new ones', all: 'warn every day' };
  // the one control: four words, a qualifier beneath where the word needs one
  const SEG4 = [['pause', 'Pause'], ['warn', 'Warn'], ['note', 'Note'], ['off', 'Off']];
  const asWord = (m) => (m === 'hold' || m === 'learn' ? 'pause' : m === 'new' || m === 'all' ? 'warn' : m);
  function seg4({ label, now, mixed, act, data, noPause, pauseQual, warnSub, lark }) {
    const btn = ([w, t]) => { if (w === 'pause' && noPause && arguments[0].hidePause) return ''; const on = !mixed && asWord(now) === w, dis = w === 'pause' && noPause, lk = lark && asWord(lark) === w; return `<button type="button" role="radio" aria-checked="${on}" class="${on ? 'on' : ''}${lk ? ' lk' : ''}"${lk ? ' title="Larkspur’s pick"' : ''}${dis ? ` disabled aria-label="Pause: not offered"` : ` data-act="${act}" ${data} data-m="${w}"`}>${t}${lk ? '<i class="lkdot" aria-hidden="true"></i><span class="lkw">Larkspur’s</span>' : ''}</button>`; };
    const sub = warnSub && !mixed && asWord(now) === 'warn' ? `<span class="segsub"><span class="sl">Warn when:</span>${[['new', 'a new one appears'], ['all', 'every day']].map(([m, t]) => `<button type="button" class="${now === m ? 'on' : ''}" data-act="${act}" ${data} data-m="${m}">${t}</button>`).join('')}</span>` : pauseQual && !mixed && asWord(now) === 'pause' ? `<span class="segsub q">${esc(pauseQual)}</span>` : noPause && noPause.trim() && !mixed ? `<span class="segsub q">${esc(noPause)}</span>` : '';
    return `<span class="segwrap"><span class="seg" role="radiogroup" aria-label="${esc(label)}">${SEG4.map(btn).join('')}</span>${sub}</span>`;
  }
  const acceptedKeys = () => new Set([...((B.known || {}).keys || []), ...Object.keys(B.knownLater || {})]);
  const acceptDayOf = (k) => { const l = (B.knownLater || {})[k]; if (l) return l.day; return ((B.known || {}).keys || []).includes(k) ? '2024-02-01' : null; };
  const freshOn = (k, y) => (GAP_KEYS.has(k) ? (y.gapsUp || {})[k] : (y.linksNew || {})[k]) || 0;
  const reopenedOn = (k, day) => { const a = acceptDayOf(k); if (!a || !['new', 'all', 'hold'].includes(linkModeOf(k))) return null; const y = DATA.days.find((z) => z.day > a && z.day <= day && freshOn(k, z) > 0); return y ? y.day : null; };
  const isKnown = (k, day) => { const a = acceptDayOf(k); return !!a && a <= day && !reopenedOn(k, day); };
  const gapKeysAll = () => { const ks = new Set(); for (const y of DATA.days) { if (y.day > LAST) break; for (const k of [...Object.keys(y.links || {}), ...Object.keys(y.gaps || {})]) { const [fid, col] = k.split('.'), f = fileOf(fid); if (f && isAdded(fid) && (GAP_KEYS.has(k) || linksOf(f).some((j) => j.col === col))) ks.add(k); } } return [...ks]; };
  const nOn = (k, y) => (y && ((y.links || {})[k] ?? (y.gaps || {})[k])) || 0;
  const openSince = (k, day) => { const r = reopenedOn(k, day); if (r) return r; const a = acceptDayOf(k); if (a && a <= day) return null; const y = DATA.days.find((z) => z.day <= day && nOn(k, z) > 0); return y ? y.day : null; };
  const newIdsSaid = (k, day) => { if (k !== 'exceptions.approver_id') return ''; const a = acceptDayOf(k) || '2024-02-01', nw = (DATA.xtab || {})['exceptions.newApprover'] || {}; const ids = Object.entries(nw).filter(([d]) => d > a && d <= day).flatMap(([, l]) => l.map((v) => v.id)); return ids.length ? `${ids.join(', ')} ` : ''; };
  const openOn = (y) => gapKeysAll().filter((k) => nOn(k, y) > 0 && linkModeOf(k) !== 'off' && !isKnown(k, y.day));
  const knownSaid = (day) => { const ks = gapKeysAll().filter((k) => isKnown(k, day)); if (!ks.length) return ''; const by = (m) => ks.filter((k) => (m === 'warn' ? ['new', 'all', 'hold'].includes(linkModeOf(k)) : linkModeOf(k) === m)).length; return `${plural(ks.length, 'known gap')} (${[by('warn') ? `${by('warn')} warn if more appear` : '', by('note') ? `${by('note')} noted` : '', by('off') ? `${by('off')} not checked, as accepted` : ''].filter(Boolean).join(', ')})`; };
  const openSaid = (y) => { const o = openOn(y); if (!o.length) return ''; return `${o.length} open: ${o.map((k) => `${nameOf(k.split('.')[0])} since ${dShort(openSince(k, y.day) || y.day)}`).join(', ')}`; };
  const GAP_WORD = { off: 'off', note: 'noted', new: 'warns of new ones', all: 'warns every day', hold: 'pauses on new ones' };
  const gapsOn = () => [...GAP_KEYS].filter((k) => isAdded(k.split('.')[0]));
  function gapsRow() {
    const ks = gapsOn(); if (!ks.length) return '';
    const ms = ks.map((k) => linkModeOf(k)), main = ms.includes('hold') ? 'hold' : ['new', 'all'].some((m) => ms.includes(m)) ? 'warn' : ms.includes('note') ? 'note' : 'off';
    return `<li class="gaps"><span class="ckm ${main}" aria-hidden="true">${MODE_MARK[main]}</span><span class="ckn"><b>Blanks</b><span class="ckq">Blank columns and missing first versions you described while reading the files</span><small>${ks.map((k) => `${esc(nameOf(k.split('.')[0]))} ${esc(GAP_TAG[k].replace(/^Your check on /, ''))}: ${ruleOnGap(k) ? `your rule, ${esc(myRuleSaid(ruleOnGap(k)))} (${esc((MODE_SAID[ruleOnGap(k).mode] || 'Warn').toLowerCase())})` : esc(GAP_WORD[linkModeOf(k)] || 'off')}`).join(' · ')}</small>${B.known ? `<small>Accepted as known by you, ${esc(youStamp(B.known.at))}</small>` : ''}<button type="button" class="link" data-act="go" data-to="files">Change them on the files ›</button></span></li>`;
  }
  // peer:dq r4 — what each check would have done on each of the 56 days, under the settings on screen. Each finding of
  // the record counts by its own file's mode: pause, paused; pause at ¼, paused where the record held the file and warned
  // where it didn't; warn, warned; note or off, nothing. Under Larkspur's settings this is the record itself, finding for
  // finding (peer/r4/dq/work/rec-check.cjs), so a control changed here redraws its row and stays true to the data. Links,
  // and the blanks you described, count as the day player counts them (linkFindings); Rows adds the days past its limit.
  function liveChecks() {
    const out = Object.fromEntries([...CHECKS.map(([c]) => c), 'gaps'].map((c) => [c, { paused: new Set(), warned: new Set() }]));
    for (const x of DATA.days) {
      if (x.day > LAST) break;
      const holds = new Set((x.holds || []).map((h) => h.replace(/_checked$/, '')));
      for (const f of x.finds || []) {
        if (!f.file) continue;
        const file = fileOf(f.source), ks = /arrived empty/.test(f.said) && file?.scope ? ['amount', 'scope'] : /repeat a key/.test(f.said) ? ['key', 'amount'] : [checkKindOf(f.said)];
        for (const k of ks) { const m = file ? checkOf(file, k) : null, held = holds.has(f.source); const o = m == null ? (held ? 'paused' : 'warned') : m === 'hold' ? 'paused' : m === 'learn' ? (held ? 'paused' : 'warned') : ['warn', 'new', 'all'].includes(m) ? 'warned' : ''; if (o) out[k][o].add(x.day); }
      }
      const lf = linkFindings(x).filter((l) => !l.quiet), lk = lf.filter((l) => !GAP_KEYS.has(l.k)), gp = lf.filter((l) => GAP_KEYS.has(l.k));
      if (lk.some((l) => l.pause)) out.links.paused.add(x.day); else if (lk.length) out.links.warned.add(x.day);
      if (gp.some((l) => l.pause)) out.gaps.paused.add(x.day); else if (gp.length) out.gaps.warned.add(x.day);
    }
    for (const d of Object.keys(rowsBeyond(rowsLimit()))) out.amount.paused.add(d);
    for (const r of Object.values(out)) for (const d of r.paused) r.warned.delete(d);
    return out;
  }
  // peer:dq r4 — the checks step as one grid: a row a check, a column a day, one date axis over all of them. A tall crimson
  // bar is a day the check would have paused, a half-height amber one a day it would have warned; each row's control at
  // its end as one quiet word ("Pause ›"), so the marks outweigh the controls; the word or the name opens the row: its
  // four-way control and its sentence (its question, its files, its days in words, Rows' limit), one row at a time.
  const PLAINQ = { schema: 'columns', fresh: 'freshness', amount: 'row count', key: 'duplicate ids', scope: 'coverage', values: 'unknown codes', learned: 'value mix', links: 'links' };
  const DAY_PLAIN = { '2024-02-16': 'Org units lost a department', '2024-02-26': 'MFA arrived empty', '2024-03-05': 'Logging moved 691 apps', '2024-03-06': 'Logging stayed moved', '2024-03-11': 'Backups mislabelled', '2024-03-21': 'TLS came twice', '2024-03-23': 'EDR arrived empty', '2024-03-27': 'Access reviews arrived empty' };
  function checksGrid(rows, rec) {
    const days = DATA.days.filter((y) => y.day <= LAST), m1 = days.findIndex((y) => y.day.slice(5) === '03-01'), sd = X().smDay;
    const lab = (iso) => esc(sd ? sd.text(iso, md(iso)) : md(iso));
    // the day itself: paused where any row would pause it, or where only an output's own rule did (set in the next step)
    const P = new Set(rows.flatMap((r) => [...r.paused])), W = new Set(rows.flatMap((r) => [...r.warned])), byDay = {};
    for (const r of rows) if (PLAINQ[r.key]) for (const d of r.paused) (byDay[d] ||= []).push(PLAINQ[r.key]);
    const outOnly = pausedDays().filter((d) => !CHECKS.some(([c]) => rec[c].paused.has(d)));
    for (const d of outOnly) { P.add(d); (byDay[d] ||= []).push('an output’s own rule, set in the next step'); }
    for (const d of P) W.delete(d);
    const cells = (p, w, say) => days.map((y, i) => { const k = p.has(y.day) ? 'p' : w.has(y.day) ? 'w' : ''; return `<i class="${k}${i === m1 ? ' m1' : ''}" title="${esc(say(y.day, k))}"></i>`; }).join('');
    const said = (n, p, w) => `${n}: ${[p.size ? `paused ${datesOf(p)}` : '', w.size ? `warned ${datesOf(w)}` : ''].filter(Boolean).join('; ') || 'never triggered'}`;
    const row = (r) => { const open = B.ckRow === r.key; return `<li class="ckx-row ${r.cls || ''}${open ? ' open' : ''}" data-c="${r.key}"><button type="button" class="ckx-n" data-act="ckrow" data-c="${r.key}" aria-expanded="${open}" title="${open ? 'Close' : 'What it checks, and its days in words'}"><b>${esc(r.name)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</button><span class="ckx-d" role="img" aria-label="${esc(said(r.aria || r.name, r.paused, r.warned))}">${cells(r.paused, r.warned, (d, k) => `${md(d)}${k === 'p' ? ': paused' : k === 'w' ? ': warned' : ''}`)}</span><span class="ckx-c">${r.word ? `<button type="button" class="ckx-mode" data-act="ckrow" data-c="${r.key}" aria-expanded="${open}" aria-label="${esc(r.name)}: ${esc(r.word)}. Change it">${esc(r.word)}</button>` : r.ctl}</span>${open ? `<div class="ckx-more">${r.word ? `<span class="ckx-full2">${r.ctl}</span>` : ''}${r.more}</div>` : ''}</li>`; };
    const dayRow = `<li class="ckx-row day"><span class="ckx-n"><b>The day</b></span><span class="ckx-d" role="img" aria-label="${esc(said('The day', P, W))}">${cells(P, W, (d, k) => `${md(d)}${k === 'p' ? `: paused${DAY_PLAIN[d] ? ' · ' + DAY_PLAIN[d] : ''} (${(byDay[d] || []).join(' and ')})` : k === 'w' ? ': warned' : ''}`)}</span><span class="ckx-c"></span></li>`;
    const axis = `<li class="ckx-row ax" aria-hidden="true"><span class="ckx-n"></span><span class="ckx-d"><i style="grid-column: 1">${lab(days[0].day)}</i>${m1 > 0 ? `<i style="grid-column: ${m1 + 1}">${lab(days[m1].day)}</i>` : ''}<i class="end" style="grid-column: ${days.length}">${lab(days[days.length - 1].day)}</i></span><span class="ckx-c"></span></li>`;
    const ow = days.filter((y) => !P.has(y.day) && !W.has(y.day) && (y.finds || []).some((f) => !f.file && outModeOf(f.source) === 'warn'));
    const why = `<details class="ckx-why"><summary>Why each paused day paused ›</summary><ul class="ps-days">${[...P].sort().map((d) => { const fid = ISSUES[d] && (ISSUES[d].demo ? 'access_reviews' : ISSUES[d].file), ck = (CHECKS.find(([c]) => rec[c].paused.has(d)) || ['amount'])[0]; return `<li>${fid ? `<button type="button" class="psd" data-act="cellpick" data-f="${fid}" data-c="${ck}" title="Open ${esc(nameOf(fid))}’s check">` : ''}<b>${esc(md(d))}</b>${esc(DAY_PLAIN[d] || '')}<small>${esc((byDay[d] || []).join(' and '))}</small>${fid ? '</button>' : ''}</li>`; }).join('')}</ul>${ow.length ? `<small class="ps-out">Outputs’ own checks, set in the next step, warn on ${plural(ow.length, 'more day')}: ${ow.map((y) => md(y.day)).join(', ')}.</small>` : ''}</details>`;
    return `<div class="pdx ckx" style="--n: ${days.length}"><p class="ckx-h"><b class="ps-h">${P.size} of ${days.length} days paused</b><span class="ckx-key" aria-hidden="true"><i class="p"></i>paused<i class="w"></i>warned</span></p><ul class="ck-kinds ckx-rows">${axis}${dayRow}${rows.map(row).join('')}</ul>${why}</div>`;
  }
  // the cell picked in the matrix: its four words, and for links or gaps each column it covers, set one by one
  function cellBar() {
    const sel = B.cell, f = sel && fileOf(sel.f); if (!f) return '';
    const close = '<button type="button" class="link" data-act="cellclose">Done</button>';
    if (sel.c === 'gaps' || sel.c === 'links') {
      const keys = sel.c === 'gaps' ? gapsOn().filter((k) => k.startsWith(f.id + '.')) : linksOf(f).map((j) => linkKey(f.id, j.col));
      return `<div class="ck-cellbar"><b>${esc(nameOfFile(f.id))} · ${sel.c === 'gaps' ? 'Known gaps' : 'Links'}</b><span class="cb-q">${plural(keys.length, 'column')}, each set on its own</span>${keys.map((k) => `<span class="cb-row"><code>${esc(k.split('.')[1])}</code>${seg4({ label: k, now: linkModeIn(f.id, k), act: 'keymode', data: `data-k="${k}" data-f="${f.id}"`, warnSub: true })}</span>`).join('')}${close}</div>`;
    }
    const m = checkOf(f, sel.c), n = KIND_LABEL[sel.c];
    const own = sel.c === 'amount' && f.counts ? (() => { const L = rowsLimitFor(f.id), d = (f.history?.daily || []).filter((v) => v != null).slice(-28), med = d.length ? [...d].sort((a, b) => a - b)[Math.floor(d.length / 2)] : 0, spread = med ? Math.max(...d.map((v) => Math.abs(v - med) / med)) * 100 : 0, days = f.counts.filter((c0, i) => { const y = DATA.days[i], u = f.usual[i]; return y && y.day > '2024-02-01' && y.day <= LAST && c0 != null && u && Math.abs(c0 - u) / u > L / 100; }).length; return `<span class="limctl"><span class="ll">This file pauses beyond</span><button type="button" class="lb" data-act="rowslimf" data-f="${f.id}" data-d="-1" aria-label="Tighter">−</button><b>±${L}%</b><button type="button" class="lb" data-act="rowslimf" data-f="${f.id}" data-d="1" aria-label="Looser">+</button><span class="lw"><b>${plural(days, 'day')}</b> of ${dayIdx(LAST) + 1} would pause · its last 28 days of history moved at most ±${spread.toFixed(1)}%</span></span>`; })() : '';
    return `<div class="ck-cellbar"><b>${esc(nameOfFile(f.id))} · ${esc(n)}</b><span class="cb-q">${esc(KIND_Q[sel.c])}</span>${seg4({ label: n, now: m, act: 'cellmode', data: `data-f="${f.id}" data-c="${sel.c}"`, pauseQual: sel.c === 'learned' ? 'at ¼: when a quarter of the rows change' : '' })}${own}${close}</div>`;
  }
  // your own rules, beside Larkspur's checks: each with the days of the replay it broke
  function myRulesRow() {
    const all = Object.entries(B.myRules || {}).filter(([fid]) => isAdded(fid)).flatMap(([fid, rl]) => rl.map((r, i) => ({ fid, r, i }))); if (!all.length) return '';
    const days = DATA.days.filter((y) => y.day <= LAST);
    return all.map(({ fid, r, i }) => { const bd = new Set((brokeOn(fid, r, true) || []).filter((k) => DATA.days[k] && DATA.days[k].day > '2024-02-01' && DATA.days[k].day <= LAST)), mm = r.mode === 'hold' ? 'hold' : r.mode === 'note' ? 'note' : 'warn';
      return `<li class="mine"><span class="ckm ${mm}" aria-hidden="true">${MODE_MARK[mm]}</span><span class="ckn"><b>Your rule · ${esc(nameOfFile(fid))}</b><span class="ckq">${esc(myRuleSaid(r))}</span><small>Feb 1 to Mar 27: ${bd.size ? `${mm === 'hold' ? 'pauses' : mm === 'note' ? 'notes' : 'warns'} on ${plural(bd.size, 'day')}` : 'never broke'}</small><span class="ckstrip" aria-hidden="true">${days.map((y, k) => `<i class="${bd.has(k) ? (mm === 'hold' ? 'p' : 'w') : ''}"></i>`).join('')}</span></span>${seg4({ label: 'Your rule: what it does', now: mm, act: 'myrule-mode', data: `data-f="${fid}" data-i="${i}"` })}</li>`; }).join('');
  }
  function rulesView() {
    const cells = checkCells(), count = (m) => cells.filter((x) => x === m).length, rec = recordOfChecks(), live = liveChecks(); // peer:dq r4: live, each row as set
    const control = (c, n, main, mixed) => seg4({ label: `${n}: what it does`, now: main, mixed, act: 'kindmode', data: `data-c="${c}"`, lark: c === 'links' ? 'new' : c === 'learned' ? 'learn' : 'hold' }); // peer:dq r4: its qualifiers are in the row's sentence
    const said = (r) => [r.paused.size ? `paused ${datesOf(r.paused)}` : '', r.warned.size ? `warned ${datesOf(r.warned)}` : ''].filter(Boolean).join(' · ') || 'never triggered';
    // peer:dq r4: each check a row of the grid; what it says in words opens from its name
    const rows = CHECKS.map(([c, n]) => {
      const files = B.added.map(fileOf).filter((f) => checkOf(f, c)); if (!files.length) return null;
      const modes = c === 'links' ? files.flatMap((f) => linksOf(f).map((j) => linkModeIn(f.id, linkKey(f.id, j.col)))) : files.map((f) => checkOf(f, c));
      const tally = {}; modes.forEach((m) => (tally[m] = (tally[m] || 0) + 1));
      const order = Object.entries(tally).sort((a, b) => b[1] - a[1]), main = order[0][0], mixed = order.length > 1;
      const byFile = {}; if (c === 'links') files.forEach((f) => { const m = checkOf(f, c); byFile[m] = (byFile[m] || 0) + 1; });
      const fileOrder = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
      const apart = c === 'links' ? [] : files.filter((f) => checkOf(f, c) !== main);
      const mixedSaid = mixed ? `Mixed: ${(c === 'links' ? fileOrder.map(([m, k]) => `${plural(k, 'file')} ${m === 'warn' ? 'warn' : m === 'note' ? 'note quietly' : 'off'}`) : order.map(([m, k]) => `${k} ${SEG_WORD[m]}`)).join(', ')}` : '';
      const apartFold = apart.length === 1 ? `<span class="ckap1"><b>${esc(nameOfFile(apart[0].id))}</b> set apart: ${esc(SEG_WORD[checkOf(apart[0], c)])}${SET_APART_WHY[`${apart[0].id}.${c}`] ? ` (${esc(SET_APART_WHY[`${apart[0].id}.${c}`])})` : ', as Larkspur set it'}</span>` : apart.length ? `<details class="ckap"><summary>${plural(apart.length, 'file')} set apart ›</summary><ul>${apart.map((f) => `<li><b>${esc(nameOfFile(f.id))}</b> ${esc(SEG_WORD[checkOf(f, c)])}${SET_APART_WHY[`${f.id}.${c}`] ? `: ${esc(SET_APART_WHY[`${f.id}.${c}`])}` : ', as Larkspur set it'}</li>`).join('')}</ul></details>` : '';
      const r = live[c];
      const rb = c === 'amount' ? rowsBeyond(rowsLimit()) : null, rbDays = rb ? Object.keys(rb) : [];
      const limCtl = c === 'amount' ? `<span class="limctl"><span class="ll">Pauses beyond</span><button type="button" class="lb" data-act="rowslim" data-d="-1" aria-label="Tighter" ${rowsLimit() === ROWS_STEPS[0] ? 'disabled' : ''}>−</button><b>±${rowsLimit()}%</b><button type="button" class="lb" data-act="rowslim" data-d="1" aria-label="Looser" ${rowsLimit() === ROWS_STEPS[ROWS_STEPS.length - 1] ? 'disabled' : ''}>+</button><span class="lw">of a file’s usual size: <b>${plural(rbDays.length, 'day')}</b> of ${dayIdx(LAST) + 1} would pause${rowsLimit() !== 5 ? ' (Larkspur’s ±5%: 4)' : ''}</span></span>` : '';
      const warnWhen = c === 'links' && !mixed && ['new', 'all'].includes(main) ? `<span class="segsub"><span class="sl">Warn when:</span>${[['new', 'a new one appears'], ['all', 'every day']].map(([m, t]) => `<button type="button" class="${main === m ? 'on' : ''}" data-act="kindmode" data-c="links" data-m="${m}">${t}</button>`).join('')}</span>` : '';
      const more = `<p class="ckx-q">${esc(KIND_Q[c])}</p><small>${plural(files.length, 'file')}${c === 'links' ? `, ${plural(modes.length, 'link')} (each evidence file’s app_id is checked by Scope instead)` : ''} · Feb 1 to Mar 27: ${esc(said(r))}</small>${mixed ? `<span class="ckmix"><i class="mixtag">Mixed</i> ${esc(mixedSaid.replace(/^Mixed: /, ''))}</span>` : ''}${apartFold}${c === 'learned' && main === 'learn' ? '<small>Its Pause is at ¼: it pauses when a quarter of the rows change, and warns under that</small>' : ''}${warnWhen}${limCtl}`;
      return { key: c, name: n, sub: mixed ? 'mixed' : c === 'learned' && main === 'learn' ? 'pauses at ¼' : '', word: mixed ? 'Mixed' : cap(asWord(main)), paused: r.paused, warned: r.warned, ctl: control(c, n, main, mixed), more };
    }).filter(Boolean);
    const ks = gapsOn(), gaps = ks.length ? { key: 'gaps', name: 'Blanks', cls: 'gaps', paused: live.gaps.paused, warned: live.gaps.warned, ctl: '<button type="button" class="link ckx-go" data-act="go" data-to="files">On the files ›</button>', more: `<p class="ckx-q">Blank columns and missing first versions you described while reading the files, each set on its own</p><small>${ks.map((k) => `${esc(nameOf(k.split('.')[0]))} ${esc(GAP_TAG[k].replace(/^Your check on /, ''))}: ${ruleOnGap(k) ? `your rule, ${esc(myRuleSaid(ruleOnGap(k)))} (${esc((MODE_SAID[ruleOnGap(k).mode] || 'Warn').toLowerCase())})` : esc(GAP_WORD[linkModeOf(k)] || 'off')}`).join(' · ')} · Feb 1 to Mar 27: ${esc(said(live.gaps))}</small>${B.known ? `<small>Accepted as known by you, ${esc(youStamp(B.known.at))}</small>` : ''}` } : null;
    const mine = Object.entries(B.limits || {}).map(([k, L]) => `${esc(L.said)} (yours, from ${esc(dayLabel(L.from))})`);
    const wafSaid = () => { const a = B.applied['waf-band-tenth']; return a === true ? 'at most 10% of a firewall’s applications from Mon Mar 25 (15% before)' : a === 'skip' ? 'at most 15% of a firewall’s applications (10% left out)' : 'at most 15% of a firewall’s applications; 10% from Mon Mar 25 is proposed, yours to decide on Fri Mar 22'; };
    const limits = { key: 'lim', name: 'Limits', cls: 'lim', word: cap(B.limitMode || 'pause'), paused: new Set(), warned: new Set(), ctl: seg4({ label: 'Limits: what they do', now: B.limitMode || 'pause', act: 'limitmode', data: '' }), more: `<p class="ckx-q">Shares Larkspur wrote down that no day may go past</p><small>${[...LIMITS.map(([a, b]) => `${esc(a)}: ${esc(a === 'WAF failing' ? wafSaid() : b)}`), ...mine].join(' · ')} · Feb 1 to Mar 27: never triggered</small>` };
    // your own rules, beside Larkspur's checks: each with the days of the replay it broke (a note marks no day)
    const yours = Object.entries(B.myRules || {}).filter(([fid]) => isAdded(fid)).flatMap(([fid, rl]) => rl.map((r0, i) => { const bd = new Set((brokeOn(fid, r0, true) || []).filter((k) => DATA.days[k] && DATA.days[k].day > '2024-02-01' && DATA.days[k].day <= LAST)), mm = r0.mode === 'hold' ? 'hold' : r0.mode === 'note' ? 'note' : 'warn', P = new Set(), W = new Set(); for (const k of bd) (mm === 'hold' ? P : mm === 'warn' ? W : new Set()).add(DATA.days[k].day); const s0 = bd.size ? `${mm === 'hold' ? 'pauses' : mm === 'note' ? 'notes' : 'warns'} on ${plural(bd.size, 'day')}` : 'never broke'; return { key: `mine-${fid}-${i}`, name: 'Your rule', sub: nameOfFile(fid), cls: 'mine', word: cap(asWord(mm)), aria: `Your rule on ${nameOfFile(fid)}`, paused: P, warned: W, ctl: seg4({ label: 'Your rule: what it does', now: mm, act: 'myrule-mode', data: `data-f="${fid}" data-i="${i}"` }), more: `<p class="ckx-q">${esc(myRuleSaid(r0))}</p><small>Feb 1 to Mar 27: ${esc(s0)}</small>` }; }));
    const gapCell = (f) => { const k = gapsOn().find((g) => g.startsWith(f.id + '.')); if (!k) return '<td class="na" aria-label="no known gap"></td>'; const m = linkModeOf(k), mm = m === 'new' || m === 'all' ? 'warn' : m; return `<td><button type="button" class="ck ${mm}${B.cell && B.cell.f === f.id && B.cell.c === 'gaps' ? ' sel' : ''}" data-act="cellpick" data-f="${f.id}" data-c="gaps" aria-label="${esc(nameOfFile(f.id))}, ${esc(GAP_TAG[k].replace(/^Your check on /, ''))}: ${esc(GAP_WORD[m] || 'off')}">${MODE_MARK[mm]}</button></td>`; };
    const grid = B.added.map(fileOf).map((f) => `<tr><th scope="row">${esc(nameOfFile(f.id))}</th>${CHECKS.map(([c, n]) => { const m = checkOf(f, c); return m ? `<td><button type="button" class="ck ${m}${B.modes[`${f.id}.${c}`] || (c === 'amount' && (B.rowsLimitOf || {})[f.id]) ? ' mine' : ' def'}${B.cell && B.cell.f === f.id && B.cell.c === c ? ' sel' : ''}" data-act="cellpick" data-f="${f.id}" data-c="${c}" aria-label="${esc(nameOfFile(f.id))}, ${n}: ${MODE_WORD[m]}">${MODE_MARK[m]}</button></td>` : '<td class="na" aria-label="doesn’t apply"></td>'; }).join('')}${gapCell(f)}</tr>`).join('');
    return {
      body: `<p class="bp-lead">Every file is checked before anything is built from it. ${FROM('as Larkspur set them')}<span class="pk-key"><i class="pk-dot" aria-hidden="true"></i>Larkspur’s pick</span>${'' /* peer:design: the pick dot named once on the checks step */}</p>
        <ul class="ck-sum def" hidden>${[['hold', PZ2, 'Pause', 'What’s built from the file is held; readers keep the day before until someone chooses', count('hold') + count('learn'), count('learn') ? `${count('learn')} of them pause only if a quarter of the rows change, and warn under that` : ''], ['warn', '◆', 'Warn', 'The day goes out, marked ◆', count('warn')], ['note', '○', 'Note', 'The day goes out unmarked; it’s listed under known gaps', count('note')], ['off', '–', 'Off', 'Not checked', count('off')]].filter(([m, , , , k]) => k || m === 'hold' || m === 'warn').map(([m, g, n, t, k, q]) => `<li class="${m}"><span class="cs-h"><i>${g}</i><b>${n}</b><em>${k}</em></span><small>${esc(t)}</small>${q ? `<small class="cs-q">${esc(q)}</small>` : ''}</li>`).join('')}</ul>
        ${checksGrid([...rows, gaps, limits, ...yours].filter(Boolean), rec) /* peer:dq r4 */}
        <details class="ck-how"><summary>How the checks work ›</summary><p class="ck-band"><b>Learned’s usual range</b>: each value’s share over the file’s last 28 days; a share outside it warns, and pauses once a quarter of the rows have moved. <b>Two models</b> only warn: one when the day as a whole is unlike its last 28 (an isolation forest), one when today’s rows can be told apart from earlier days’ (a classifier, from an AUC of 0.70).</p><p><b>${checkCount()}</b> checks on the files: ${count('hold') + count('learn')} pause, ${count('warn')} warn, ${count('note')} note. Beside them, ${LIMITS.length} limits Larkspur wrote down, and ${WATCHED.length + 1} outputs checked like files (next step).</p><p><b>Learned</b> also runs two models, which only warn: one asks whether the day as a whole is unlike the 28 before it, the other whether today’s rows can be told apart from earlier days’. Feb 1 to Mar 27 they warned on ${DATA.days.filter((y) => y.day <= LAST && (y.finds || []).some((f) => /unlike earlier days/.test(f.said))).length} days.</p></details>
        <details class="ck-more"${B.ckOpen ? ' open' : ''}><summary>Each file’s checks, to change one</summary><p class="ck-tap">Tap a cell to set it; a Rows cell also sets that file’s own limit. Faded: as Larkspur set it · full colour: changed by you. Limits and Outputs are set for all files at once.</p><p class="ck-key"><span><b class="ck hold">${PZ2}</b>pause</span><span><b class="ck learn">${PZ2}<sup>¼</sup></b>pause at ¼</span><span><b class="ck warn">◆</b>warn</span><span><b class="ck note">○</b>note</span><span><b class="ck off">–</b>off</span><span><i class="na-key"></i>doesn’t apply</span></p><div class="ck-wrap"><table class="ck-grid"><thead><tr><th></th>${CHECKS.map(([c, n]) => `<th scope="col" title="${esc(n)}"><span class="ck-h">${esc(n)}</span></th>`).join('')}<th scope="col" title="Blanks"><span class="ck-h">Blanks</span></th></tr></thead><tbody>${grid}</tbody></table></div>${cellBar()}</details>
`, // peer:dq r4: the note on the map's counts went; the map's own key says them
      foot: B.rules ? `<button class="btn primary" data-act="go" data-to="product">Next: what Larkspur publishes ›</button>` : `<button class="btn" data-act="go" data-to="history">‹ Back</button><button class="btn primary" data-act="rules">Use these checks ›</button>`,
    };
  }

  // ---------------------------------------------------------------- outputs, and their own checks
  const WATCHED = ['apps', 'app_owners', 'dim_app', 'effective', 'failing_by_unit', 'platform_impact', 'posture_wide', 'shadow_assets'];
  const OUT_NAMES = { app_owners: 'App owners', dim_app: 'Application register', failing_by_unit: 'Failing by unit', effective: 'Effective status', posture_wide: 'Posture by application', platform_impact: 'Platform impact', shadow_assets: 'Shadow assets', apps: 'Applications, cleaned', org_chain: 'Org chain', fact_control_status: 'Control status', remediation_queue: 'Remediation queue', app_scorecard: 'App scorecard', org_posture: 'Org posture', exceptions_register: 'Exceptions register' };
  const OUT_ABOUT = { app_owners: 'Each application with the unit that owns it, up to its business unit', apps: 'The applications, cleaned up: each evidence file has one row for each of them', effective: 'The status a person reads for each application and control, with its reason', posture_wide: 'One row an application, a column for each control’s status', platform_impact: 'Today’s failures, by the platforms they share' };
  const outName = (id) => OUT_NAMES[id] || (/_checked$/.test(id) && fileOf(id.replace(/_checked$/, '')) ? `${nameOf(id.replace(/_checked$/, ''))}, checked rows` : cap(String(id).replace(/_/g, ' ')));
  // the watched outputs with checks of their own (their gate cells) only warn on a learned move under a quarter of their rows
  const OWN_CHECKS = new Set(['effective', 'posture_wide', 'platform_impact', 'dim_app']);
  // the key each output's gate cell names, where it names one (Larkspur's notebooks)
  const OUT_KEY = { apps: 'app_id', dim_app: 'app_id', effective: 'app_id + control_id', failing_by_unit: 'app_id + control_id', posture_wide: 'app_id', fact_control_status: 'app_id + control_id', remediation_queue: 'app_id + control_id', fact_finding: 'finding_id', org_posture: 'org_unit_id', exceptions_register: 'exception_id' };
  const outModeOf = (id) => (B.outModes || {})[id] || (OWN_CHECKS.has(id) ? 'learn' : 'hold');
  const outPauses = (id) => !fileOf(id) && ['hold', 'learn'].includes(outModeOf(id));
  function productView() {
    const outs = FULL.outputs, about = (o) => OUT_ABOUT[o.id] || o.about || '';
    const reads = (id) => B.added.filter((f) => (fullDs(f)?.builds || []).includes(id)).map(nameOfFile);
    const main = ['app_scorecard', 'org_posture', 'remediation_queue', 'exceptions_register', 'fact_control_status', 'dim_app'];
    const built = (id) => { const r = reads(id); return !r.length ? '' : r.length <= 2 ? `<small class="bo-reads">built from ${esc(r.join(' and '))}</small>` : `<details class="bo-reads"><summary>built from ${plural(r.length, 'file')} ›</summary><span>${esc(r.join(' · '))}</span></details>`; };
    const seg = (id) => seg4({ label: `${outName(id)}: what it does`, now: outModeOf(id), act: 'outmode', data: `data-o="${id}"`, pauseQual: OWN_CHECKS.has(id) ? 'at ¼: when a quarter of its rows change' : '', lark: OWN_CHECKS.has(id) ? 'learn' : 'hold' });
    const cks = (id) => id === 'org_chain' ? 'Its checks: its two rules, no loop and one top unit' : `Its checks: ${OWN_CHECKS.has(id) ? 'the share of its rows that change' : 'each value’s share'}${OUT_KEY[id] ? `, and its key ${OUT_KEY[id]}` : ''}${id === 'app_owners' ? ', and its rule: every active application’s owner chain reaches the group' : ''}`;
    const outDays = (id) => { const p = new Set(), w = new Set(); for (const y of DATA.days) { if (y.day > LAST) break; if ((y.holds || []).some((h) => h.replace(/_checked$/, '') === id)) p.add(y.day); else if ((y.finds || []).some((f) => !f.file && f.source === id)) w.add(y.day); } return { p, w }; };
    const outStrip = (id) => { const { p, w } = outDays(id); return `<span class="ckstrip" aria-hidden="true">${DATA.days.filter((y) => y.day <= LAST).map((y) => `<i class="${p.has(y.day) ? 'p' : w.has(y.day) ? 'w' : ''}"></i>`).join('')}</span><small class="bo-did">Feb 1 to Mar 27: ${[p.size ? `paused ${datesOf(p)}` : '', w.size ? `warned ${datesOf(w)}` : ''].filter(Boolean).join(' · ') || 'never triggered'}</small>`; };
    const card = (id) => { const o = outs.find((x) => x.id === id) || { id }; return `<li><span class="bo-n"><b>${esc(outName(id))}</b><small>${esc(id === 'org_chain' ? 'The organisation is one tree: no unit reports into itself, and every chain ends at one top unit' : about(o))}</small>${outStrip(id)}${built(id)}</span>${seg(id)}</li>`; };
    const defaults = WATCHED.filter((id) => !OWN_CHECKS.has(id)), own = WATCHED.filter((id) => OWN_CHECKS.has(id));
    return {
      body: `<p class="bp-lead">Outputs are the tables Larkspur’s readers use: <b>Control Posture v1</b>, ${outs.length} of them, built by its data team’s notebooks. ${FROM('Larkspur’s notebooks')}</p>
        <h4 class="bp-h">Watched like files · ${WATCHED.length + 1}</h4><details class="bp-how"><summary>How they are judged ›</summary><p class="bo-legend"><b>Larkspur’s defaults</b> · Pause: a value’s share 10 points or more from its usual range, or a repeated key · Warn: a share 2 to 10 points out</p><p class="bo-legend"><b>Checks of their own</b> · Pause if a quarter of their rows change, or a key repeats · Warn: under a quarter. A row only respelled (another case) doesn’t count as changed</p></details><ul class="bo-watch">${[...defaults, 'org_chain'].map(card).join('')}</ul>
        <ul class="bo-watch">${own.map(card).join('')}</ul>
        <h4 class="bp-h">What readers use</h4><ul class="bo-list">${main.filter((id) => outs.some((o) => o.id === id)).map((id) => { const o = outs.find((x) => x.id === id); return `<li><span class="gl">${GL.out}</span><b>${esc(outName(id))}</b><small>${esc(about(o))}</small>${built(id)}</li>`; }).join('')}<li class="more"><details class="bo-all"><summary>and ${outs.length - main.length} more ›</summary><ul>${outs.filter((o) => !main.includes(o.id)).map((o) => `<li><b>${esc(outName(o.id))}</b>${OUT_KEY[o.id] ? ` · key ${esc(OUT_KEY[o.id])}` : ''}${reads(o.id).length ? ` · from ${esc(reads(o.id).slice(0, 3).join(', '))}${reads(o.id).length > 3 ? ` and ${reads(o.id).length - 3} more` : ''}` : ''}</li>`).join('')}</ul></details></li></ul>
`,
      foot: B.product ? `<button class="btn primary" data-act="go" data-to="days">Next: replay the days ›</button>` : `<button class="btn" data-act="go" data-to="rules">‹ Back</button><button class="btn primary" data-act="product">Add the ${outs.length} outputs ›</button>`,
    };
  }

  // ---------------------------------------------------------------- the days: what the checks saw, the record's, from Feb 1
  const TITLES = {
    '2024-02-01': 'The first day: every file arrived, nothing paused',
    '2024-02-16': 'Org units lost a department its teams still report into',
    '2024-02-20': 'Scanner findings: every status came in capitals',
    '2024-02-26': 'MFA arrived empty',
    '2024-02-27': 'Tuesday itself went out as usual',
    '2024-03-05': 'Logging: 691 applications moved off log-dc',
    '2024-03-06': 'Logging stayed at its new level',
    '2024-03-08': 'A new relation from Mon Mar 11: a unit’s acting leader',
    '2024-03-11': 'Backups: COMPLETED fell to 64.6% of jobs (950 of 1,471)',
    '2024-03-13': 'Wednesday itself went out as usual',
    '2024-03-18': 'TLS: fewer certificates pass, the failures gathered on ca-int-2',
    '2024-03-21': 'TLS: every application came twice',
    '2024-03-22': 'A stricter web-firewall check, set ahead for Mon Mar 25',
    '2024-03-23': 'EDR arrived empty on a Saturday',
    '2024-03-24': 'Sunday’s EDR file is in: Saturday can be filled from it',
    '2024-03-25': 'The stricter web-firewall check is in force',
    '2024-03-27': 'Access reviews arrived empty: yours to decide',
  };
  const CODE_NAMES = { 'BU-06': 'Payments', 'DEP-18': 'Payments Engineering', 'DEP-16': 'Payments Operations', no_data: '“no data”' };
  const ROWS_NOUN = { backup_jobs: 'jobs', logging_coverage: 'applications', tls: 'applications', waf: 'applications', exceptions: 'exceptions', findings: 'findings', access_reviews: 'applications', key_rotation: 'applications', encryption: 'applications', cmdb_apps: 'applications', app_owners: 'applications', effective: 'results', posture_wide: 'applications', platform_impact: 'rows', failing_by_unit: 'failures', mfa: 'applications', edr_coverage: 'applications' };
  const nameOf = (id) => (fileOf(id) ? nameOfFile(id) : outName(id));
  const coded = (v) => CODE_NAMES[v] || v;
  const CONTROL_NAME = { edr: 'EDR', access_review: 'Access review', privileged_access: 'Privileged access', mfa: 'MFA', tls: 'TLS', waf: 'Web firewall' };
  // what a day's file said, where the record's own words don't say it plainly: from the files themselves
  const FIND_SAID = {
    '2024-02-16|app_owners': { t: 'about 96 applications’ owner chains now stop at the gone department', c: 'business unit' },
    '2024-02-20|findings': { t: 'every status came in capitals: “fixed” all but vanished, “FIXED” arrived', c: 'status' },
    '2024-03-05|logging_coverage': { t: '691 of 1,988 applications moved off log-dc: more than a quarter of the rows', c: 'pipeline' },
    '2024-03-06|logging_coverage': { t: 'log-dc still has 163 applications, usually about 854', c: 'pipeline' },
  };
  // each day's mix, where a picture says it better: shares of rows, from the files
  const MIX = {
    '2024-02-20': { a: ['Mon Feb 19', [['active', 67], ['fixed', 32]]], b: ['Tue Feb 20', [['ACTIVE', 67], ['FIXED', 32]]], said: 'The same shares in a new spelling. Findings’ checks only warn on it, and the outputs read a status whatever its case.' },
    '2024-03-05': { a: ['Usual', [['log-dc', 43], ['log-east', 33], ['log-west', 24]]], b: ['Tue Mar 5', [['log-dc', 8], ['log-east', 53], ['log-west', 39]]], moved: 35, hot: 0, said: '691 of 1,988 applications moved from log-dc to the two cloud pipelines.' },
    '2024-03-06': { a: ['Usual', [['log-dc', 43], ['log-east', 33], ['log-west', 24]]], b: ['Wed Mar 6', [['log-dc', 8], ['log-east', 53], ['log-west', 39]]], moved: 35, hot: 0, said: 'Judged against the usual level again, the same move pauses the day again, until the new level is accepted.' },
  };
  function findSaid(f, day) {
    const sp = FIND_SAID[`${day}|${f.source}`]; if (sp) return sp;
    let m; const s = f.said, r = (x) => (+x >= 10 ? Math.round(+x) : Math.round(+x * 10) / 10), noun = ROWS_NOUN[f.source] || 'rows';
    if ((m = /^(\S+) (.+?): ([\d.]+)% \(usually ([\d.]+)–([\d.]+)%\)$/.exec(s))) {
      const raw = +m[3], rlo = +m[4], rhi = +m[5], side = raw < rlo ? 'below' : raw > rhi ? 'above' : '';
      // enough decimals that a share outside its range doesn't round into it
      let dp = raw >= 10 && rlo >= 10 ? 0 : 1; const R = (x) => (+x).toFixed(dp).replace(/\.0+$/, '');
      while (dp < 3 && side && ((side === 'below' && +R(raw) >= +R(rlo)) || (side === 'above' && +R(raw) <= +R(rhi)))) dp++;
      const lo = R(rlo), hi = R(rhi), v = m[2] === 'blank' ? `${m[1]} blank` : CONTROL_NAME[m[1]] && /^(fail|pass|not_assessed)$/.test(m[2]) ? `${CONTROL_NAME[m[1]]} ${m[2].replace('_', ' ')}` : coded(m[2]), edge = side === 'below' ? rlo : rhi;
      const just = side && edge > 0 && Math.abs(raw - edge) / edge < 0.15;
      const fr = f.file ? (fileOf(f.source)?.counts || [])[dayIdx(day)] : null, cnt = fr ? Math.round((raw / 100) * fr) : null;
      return { t: `${v} ${m[1] === 'business_unit_id' ? 'owns' : 'in'} ${R(raw)}% of ${noun}${cnt != null && cnt < 50 ? ` (${fmt(cnt)} of ${fmt(fr)})` : ''}, ${just ? `just ${side} its usual` : 'usually'} ${lo === hi ? lo : `${lo}–${hi}`}%`, c: m[2] === 'blank' ? '' : m[1], band: true, side, blank: m[2] === 'blank', col: m[1], val: m[2], raw, rlo, rhi };
    }
    if (f.source === 'posture_wide' && (m = /^(\S+) fail almost gone$/.exec(s))) return { t: `${CONTROL_NAME[m[1]] || m[1]} failures all but vanished`, c: '' };
    if ((m = /^(\S+) (.+?) almost gone$/.exec(s))) return { t: `“${coded(m[2])}” all but vanished from ${m[1].replace(/_/g, ' ')}`, c: '' };
    if ((m = /^(\S+) (.+?) (\d+)% short$/.exec(s))) return { t: `${coded(m[2])} has ${m[3]}% fewer ${noun} than usual`, c: m[1] };
    if ((m = /^(\S+) (.+?) up (\d+)%$/.exec(s))) return { t: `${coded(m[2])} up ${m[3]}%`, c: m[1] };
    if ((m = /^new (\S+): (.+?) · (.+)$/.exec(s))) return { t: `a new ${m[1]}, “${m[2].replace(/_/g, ' ')}”, on ${m[3]}`, c: m[1] };
    if ((m = /^more failures: ([\d,]+) \(\+(\d+)%\)$/.exec(s))) return { t: `${m[1]} failures, ${m[2]}% more than its usual ${fmt(Math.round(+m[1].replace(/,/g, '') / (1 + m[2] / 100)))}`, c: '' };
    if (/^it arrived empty/.test(s)) return { t: 'arrived empty: 0 rows', c: '' };
    if ((m = /^the day as a whole was unlike earlier days, most in “(.+)”$/.exec(s))) return { t: 'unlike its last 28 days, as a whole', c: `most different: ${m[1]}${f.top ? `; the biggest share move ${f.top.col} ${f.top.val}, ${f.top.today}% (usually ${f.top.usual}%)` : ''}` };
    if ((m = /^rows unlike earlier days: AUC ([\d.]+)$/.exec(s))) return { t: 'a model could tell its rows from earlier days', c: `AUC ${m[1]}: it speaks from 0.70${f.top ? ` · the biggest single move, ${f.top.col} ${f.top.val} at ${f.top.today}% (usually ${f.top.usual}%), is small: it is the mix of values` : ''}`, auc: +m[1] };
    if ((m = /^(\d[\d,]*) (\w+) repeat a key$/.exec(s))) return { t: `${m[1]} ${m[2]} came twice`, c: '' };
    return { t: s, c: '' };
  }
  function bandPic(said, state) {
    const m = /(-?[\d.]+)%\s*\(usually\s*([\d.]+)–([\d.]+)%\)/.exec(said); if (!m) return '';
    const v = +m[1], lo = +m[2], hi = +m[3], max = Math.max(v, hi) * 1.3 || 1, X0 = (n) => 6 + (n / max) * 188, pc = (n) => `${n}%`;
    const vx = X0(v), bx = (X0(lo) + X0(hi)) / 2, near = Math.abs(vx - bx) < 46;
    return `<svg class="bd-band nums" viewBox="0 0 200 34" aria-hidden="true"><rect class="bb-t" x="6" y="19" width="188" height="2" rx="1"/><rect class="bb-u" x="${X0(lo).toFixed(1)}" y="15" width="${Math.max(2, X0(hi) - X0(lo)).toFixed(1)}" height="10" rx="2"/><circle class="bb-d ${state}" cx="${vx.toFixed(1)}" cy="20" r="4"/><text class="bb-l" x="${bx.toFixed(1)}" y="${near ? 33 : 10}" text-anchor="middle">usual ${lo === hi ? pc(lo) : `${lo}–${hi}%`}</text><text class="bb-l v" x="${Math.min(194, Math.max(6, vx)).toFixed(1)}" y="10" text-anchor="${vx > 170 ? 'end' : vx < 30 ? 'start' : 'middle'}">${pc(v)}</text></svg>`;
  }
  const aucPic = (v) => { const X0 = (n) => 6 + ((n - 0.5) / 0.5) * 188, vx = X0(v); return `<svg class="bd-band nums" viewBox="0 0 200 34" aria-hidden="true"><rect class="bb-t" x="6" y="19" width="188" height="2" rx="1"/><line class="bb-th" x1="${X0(0.7).toFixed(1)}" x2="${X0(0.7).toFixed(1)}" y1="13" y2="27"/><text class="bb-l" x="${X0(0.7).toFixed(1)}" y="33" text-anchor="middle">speaks from 0.70</text><circle class="bb-d warn" cx="${vx.toFixed(1)}" cy="20" r="4"/><text class="bb-l v" x="${Math.min(194, Math.max(6, vx)).toFixed(1)}" y="10" text-anchor="${vx > 170 ? 'end' : 'middle'}">AUC ${v.toFixed(2)}</text></svg>`; };
  const stopsAt = (y) => { if (y.day === '2024-03-06' && accepted('2024-03-05')) return false; return y.state === 'held' || !!ISSUES[y.day]?.mine || (y.story || []).some((s) => s.kind === 'change' || (s.kind === 'inforce' && B.applied[s.id] === true)) || ['2024-02-20', '2024-03-18'].includes(y.day) || Object.values(ISSUES).some((I) => I.fixOn === y.day || I.decideOn === y.day); };
  const skipped = (H) => H === '2024-03-06' && accepted('2024-03-05');
  // a day's lines: what paused and what warned, files first; each line names its check and what it does
  const ORG_CHAIN_SAID = 'the chains of 4 teams stop short of the top unit';
  const KIND_LABEL = Object.fromEntries(CHECKS.map(([c, n]) => [c, n]));
  const acceptedSkip = (H) => H === '2024-03-06' && accepted('2024-03-05');
  const yoursSkip = (H) => !pausesHere(H);
  const SHORT_SHARE = { '2024-02-16|dim_app': 7.5 };
  const movedOf = (l) => { if (l.s && l.s.band) return Math.max(1, Math.round(Math.abs(l.s.raw - (l.s.rlo + l.s.rhi) / 2))); const m = /(\d+)% short$/.exec(l.said || ''), sh = SHORT_SHARE[`${l.day}|${l.src}`]; return m && sh ? Math.max(1, Math.round((sh * +m[1]) / 100)) : null; };
  // where a held output's move is known from the files: what moved it
  const MOVED = { '2024-03-23|posture_wide': '1,991 of its 2,380 rows lost their EDR result', '2024-03-27|posture_wide': 'about 1,430 of its 2,380 rows lost their access review result' };
  function tagOf(l, f) {
    if (l.mine && l.rule) return `Your rule: ${myRuleSaid(l.rule)} · ${l.mark === 'pause' ? 'pauses' : l.mark === 'note' ? 'notes' : 'warns'}`;
    if (l.src === 'app_owners' && l.day === '2024-02-16' && l.mark === 'pause') return 'App owners’ rule: every active application’s owner chain reaches the group · Payments’ share of applications fell from 7.5% to 3.5% of 2,401: about 96 chains stop at the gone department, so it pauses';
    if (l.src === 'org_chain') return `Org chain’s rule: one top unit · ${l.mark === 'pause' ? 'pauses' : 'warns, as you set it'}`;
    if (!l.file && !l.held && (B.outModes || {})[l.src] === 'warn') return 'warns, as you set it';
    if (l.gap) return `${GAP_TAG[l.gap]} · ${SEG_WORD[l.mode] || 'warns'}`;
    if (l.link) return `Links · ${SEG_WORD[l.mode] || 'warns'}`;
    if (l.file) {
      if (/arrived empty/.test(l.said)) return 'It paused: no rows came, so none of the applications it covers was checked';
      if (/repeat a key/.test(l.said)) return 'It paused: every id came twice, twice the usual rows';
      if (/unlike earlier days/.test(l.said)) return 'a model of whole days · warns only';
      const k = checkKindOf(l.said), m = checkOf(fileOf(l.src), k), mv = movedOf(l);
      const apart = SET_APART_WHY[`${l.src}.${k}`];
      return `${KIND_LABEL[k]} check · ${m === 'learn' ? (l.mark === 'pause' ? `${mv != null ? `${mv}% of the rows moved` : 'over a quarter of the rows moved'}: past the 25% that pauses` : `${mv != null ? `about ${mv}% of the rows moved` : 'under a quarter moved'}; it pauses at 25%, so it warned`) : m === 'hold' ? 'pauses' : m === 'off' ? 'off' : apart && k === 'values' ? 'warns: new words from the scanner only warn' : 'warns'}`;
    }
    if (l.held) return 'held: built from what paused';
    if (/repeat a key/.test(l.said || '')) return `its Key check${OUT_KEY[l.src] ? ` on ${OUT_KEY[l.src]}` : ''} · a repeated key pauses`;
    if (l.echo) return l.echo;
    const mv = movedOf(l), big = MOVED[`${l.day}|${l.src}`];
    return OWN_CHECKS.has(l.src) ? (l.mark === 'pause' ? `its own checks · ${big || 'over a quarter of its rows moved'}: past the 25% that pauses` : `its own checks · ${mv != null ? `about ${mv}% of its rows moved; it pauses at 25%, so it warned` : 'under a quarter of its rows moved, so it warned'}`) : (() => { const s0 = l.s || {}; if (s0.band && s0.raw != null && s0.rlo != null) { const pts = s0.raw < s0.rlo ? s0.rlo - s0.raw : s0.raw > s0.rhi ? s0.raw - s0.rhi : 0; return `Larkspur’s defaults · ${pts.toFixed(1)} points outside its usual range: it warns from 2, pauses from 10`; } return l.mark === 'pause' ? 'Larkspur’s defaults · pauses' : 'Larkspur’s defaults · a move in its rows only warns'; })();
  }
  // an output's move that follows a level you accepted: noted, not warned
  const echoOf = (f, H) => { if (f.file || H !== '2024-03-07' || !/log-dc/.test(f.said)) return null; const on = accepted('2024-03-05') ? 'Tue Mar 5' : accepted('2024-03-06') ? 'Wed Mar 6' : null; return on ? `it follows Logging’s new level, accepted ${on}; Larkspur’s record warned it too` : null; };
  // a limit you set on a learned share: a share under it, after the day you set it, says nothing
  const limitOf = (src, s0, H) => { const L = (B.limits || {})[`${src}.${s0.col} ${s0.val}`]; return !!(L && s0.band && H >= L.from && s0.raw <= L.max); };
  function linesOf(x) {
    const H = x.day, fs = x.finds || [], I = ISSUES[H], lines = [];
    if (acceptedSkip(H)) return lines;
    const holds = new Set((x.holds || []).map((h) => h.replace(/_checked$/, '')).filter((h) => !(yoursSkip(H) && I && h === I.file) && (fileOf(h) || outPauses(h))));
    for (const f of fs) {
      if (yoursOff(H) && I && f.source === I.file) continue;
      const s0 = findSaid(f, H), lim = limitOf(f.source, s0, H);
      if (lim) continue;
      const echo = echoOf(f, H), held = holds.has(f.source), own = f.file ? checkOf(fileOf(f.source), checkKindOf(f.said)) : outModeOf(f.source);
      if (!held && own === 'off') continue;
      lines.push({ src: f.source, file: !!f.file, mark: !held && own === 'note' ? 'note' : held ? 'pause' : 'warn', s: echo ? { ...s0, t: `${s0.t} · ${echo}` } : s0, said: f.said, day: H, echo });
    }
    for (const h of holds) if (!fs.some((f) => f.source === h)) lines.push({ src: h, file: !!fileOf(h), mark: 'pause', held: h !== 'org_chain', s: h === 'org_chain' ? { t: ORG_CHAIN_SAID, c: '' } : { t: `built from ${nameOf(I && !I.demo ? I.file : [...holds][0])}, which paused`, c: '' } });
    if (H === '2024-02-16' && outModeOf('org_chain') === 'warn' && !holds.has('org_chain')) lines.push({ src: 'org_chain', file: false, mark: 'warn', s: { t: ORG_CHAIN_SAID, c: '' }, said: '', day: H });
    for (const [fid, rl] of Object.entries(B.myRules || {})) { if (!isAdded(fid) || H <= '2024-02-01') continue; for (const r of rl) { if (r.mode === 'hold' && I && I.mine && I.kind === 'myrule' && I.file === fid) continue; const said = myRuleOn(fid, r, H); if (said) lines.push({ src: fid, file: true, mine: true, rule: r, mark: r.mode === 'note' ? 'note' : r.mode === 'hold' ? 'pause' : 'warn', s: { t: `your rule broke: ${said}`, c: r.col }, day: H }); } }
    for (const l of linkFindings(x)) if (!l.quiet) lines.push({ src: l.f.id, file: true, link: true, k: l.k, gap: GAP_KEYS.has(l.k) ? l.k : null, mode: linkModeIn(l.f.id, l.k), mark: l.pause && x.day > '2024-02-01' ? 'pause' : 'warn', s: { t: linkSaid(l.k, l.n) + (l.fresh ? (GAP_KEYS.has(l.k) ? ', more than the day before' : ', new today') : ''), c: l.k.split('.')[1] } });
    for (const l of lines) l.tag = tagOf(l);
    return lines.sort((a, b) => b.file - a.file || (a.mark === 'pause' ? 0 : 1) - (b.mark === 'pause' ? 0 : 1));
  }
  // a paused day as one chain: what paused it, the file that caused it, what followed from it, what waits
  function rowsPic(now, usual) {
    if (usual == null) return '';
    const max = Math.max(now, usual) || 1, W = (n) => Math.max(2, (n / max) * 96);
    return `<svg class="bd-rows big" viewBox="0 0 200 26" aria-hidden="true"><rect class="rr-u" x="0" y="2" width="${W(usual).toFixed(1)}" height="8" rx="2"/><text class="rr-l" x="102" y="9.5">${fmt(usual)} usual</text><rect class="rr-d" x="0" y="15" width="${W(now).toFixed(1)}" height="8" rx="2"/><text class="rr-l b" x="102" y="22.5">${fmt(now)} that day</text></svg>`;
  }
  const usualRows = (id, iso) => usualOn(id, iso || today() || DATA.day0);
  function picOf(c, H) {
    if (!c.f) return '';
    if (c.f.file && /arrived empty/.test(c.f.said)) return rowsPic(0, usualRows(c.src, H));
    if (c.f.file && /repeat a key/.test(c.f.said)) { const m = /^(\d[\d,]*)/.exec(c.f.said), n = m ? +m[1].replace(/,/g, '') : 0; return n ? rowsPic(n * 2, n) : ''; }
    return bandPic(c.f.said, c.mark === 'pause' ? 'bad' : 'warn');
  }
  function chainOf(H) {
    const I = ISSUES[H], x = DATA.days[dayIdx(H)]; if (!I || !x || acceptedSkip(H) || yoursSkip(H)) return null;
    if (I.mine && I.kind === 'rows') return { sevL: sevOf(H)?.level, paused: [], knock: [], held: [], file: I.file, filePaused: true, allHeld: waitsOf(H), cause: { mark: 'pause', name: nameOf(I.file), says: I.why, src: I.file, f: null, note: usualFig(I.file, H) ? '' : `Rows check · pauses beyond ±${limitOn(I.file, H)}%, as you set it (Larkspur’s pauses beyond ±5%)`, pic: (usualFig(I.file, H) || rowsPic(I.rows[0][1], I.rows[0][2])) + rowDiffPart(I.file, H) } }; // peer:dq: no note where the figure draws the limit
    if (I.mine) { const [k] = I.keys[0]; return { paused: [], knock: [], held: [], file: I.file, filePaused: true, allHeld: waitsOf(H), cause: { mark: 'pause', name: nameOf(I.file), says: I.why, src: I.file, f: null, note: `${GAP_KEYS.has(k) ? GAP_TAG[k] : 'Links check'} · pauses on a new one, as you set it (Larkspur’s only warns)` } }; }
    const fs = x.finds || [], holds = (x.holds || []).map((h) => h.replace(/_checked$/, '')).filter((h) => fileOf(h) || outPauses(h)), file = I.demo ? 'access_reviews' : I.file;
    const own = fs.find((f) => f.source === file), filePaused = holds.includes(file), paused = [], held = [], knock = [];
    for (const h of holds) { if (h === file) continue; const f = fs.find((g) => g.source === h); if (f || h === 'org_chain') paused.push({ mark: 'pause', name: nameOf(h), says: h === 'org_chain' ? ORG_CHAIN_SAID : findSaid(f, H).t, src: h, f }); else held.push(nameOf(h)); }
    const heldSet = new Set(waitsOf(H));
    for (const f of fs) if (!f.file && !holds.includes(f.source) && outModeOf(f.source) !== 'off') knock.push({ mark: outModeOf(f.source) === 'note' ? 'note' : 'warn', name: nameOf(f.source), held: heldSet.has(f.source), says: findSaid(f, H).t + (FOLLOWS[`${H}|${f.source}`] || ''), src: f.source, f });
    const s0 = standing(H), fixWaits = s0 && s0.fixIn && s0.open && !s0.replaced;
    const causeTag = filePaused ? (own ? tagOf({ src: file, file: true, mark: 'pause', s: findSaid(own, H), said: own.said, day: H }) : '') : `its own check only warns; ${paused.map((c) => c.name).join(' and ') || 'what is built from it'} ${paused.length > 1 ? 'read' : 'reads'} it, and ${paused.length > 1 ? 'their rules' : 'its rule'} paused the day`;
    const cause = { mark: filePaused ? 'pause' : 'cause', name: nameOf(file), says: own ? findSaid(own, H).t : I.cause || I.why || '', src: file, f: own, note: causeTag + (fixWaits ? ' · a correction waits for you to publish it' : '') };
    cause.pic = filePaused && own ? picOf({ ...cause, mark: 'pause' }, H) : '';
    if (['empty', 'twice'].includes(I.kind) || I.demo) cause.pic = usualFig(file, H) || cause.pic;
    for (const c of [...paused, ...knock]) { c.pic = picOf(c, H); if (c.f && !c.f.file && c.src !== 'org_chain') c.note = tagOf({ src: c.src, file: false, mark: c.mark, s: findSaid(c.f, H), said: c.f.said, day: H }); }
    const fromName = filePaused ? nameOf(file) : paused[0]?.name || nameOf(file);
    for (const c of knock) if (c.held) { c.fate = `Held: built from ${fromName}`; if (c.note) c.note = c.note.replace(/, so it warned$/, ', so alone it would only warn').replace(/so it warned$/, 'so alone it would only warn'); }
    return { paused, cause, knock, held, file, filePaused, allHeld: waitsOf(H), sevL: sevOf(H)?.level };
  }
  const MARK = { cause: '<i class="cw" aria-hidden="true">◆</i>', warn: '<i class="cw" aria-hidden="true">◆</i>', note: '<i class="cw note" aria-hidden="true">○</i>' };
  // what an output's finding follows from, where the files say so
  const FOLLOWS = { '2024-03-23|effective': ': the EDR results the empty file left out', '2024-03-27|effective': ': the access reviews the empty file left out' };
  function chainHtml(ch, tail, done) {
    const cc = (c) => `<span class="cc ${done ? 'past ' : ''}${c.mark}${c === ch.cause ? ` iscause${ch.sevL === 'mild' ? ' mild' : ''}` : ''}${c.held ? ' heldout' : ''}">${c.mark === 'pause' ? X().PAUSE : c.held ? `<i class="hgm" aria-label="held">${X().HOURGLASS}</i>` : MARK[c.mark] || MARK.warn}<span>${c === ch.cause && /class="ufig/.test(c.pic || '') ? `<b>${esc(c.name)}</b>` /* peer:design: the picture below says it in numbers; the name stays, the sentence goes */ : `<b>${esc(c.name)}:</b> ${esc(c.says)}`}${c.fate ? `<small class="fate">${esc(done ? c.fate.replace(/^Held/, 'Was held') : c.fate)}</small>` : ''}${c.pic ? `<span class="cpic">${c.pic}</span>` : ''}${c.note && !done ? (c === ch.cause ? `<small>${esc(c.note)}</small>` : `<details class="cwhy"><summary>Why ›</summary><small>${esc(c.note)}</small></details>`) : ''}</span></span>`; // peer:design
    const row = (label, items) => (items.length ? `<div class="crow"><span class="cl">${label}</span><div class="cgrp">${items.map(cc).join('')}</div></div>` : '');
    const allHeld = (ch.allHeld || []).map((id) => outName(id));
    const heldRow = allHeld.length || tail ? `<div class="crow"><span class="cl">${done ? 'Was held' : 'Held'}</span><div class="cgrp">${tail ? `<span class="cc out">${allHeld.length && !/held/.test(tail) ? `<b>${allHeld.length} held</b> · ` : ''}${tail}</span>` : ''}${allHeld.length ? `<span class="heldchips">${allHeld.map((n2) => `<i>${esc(n2)}</i>`).join('')}</span>` : ''}</div></div>` : '';
    return `<div class="chain v${done ? ' done' : ''}">${ch.cause ? row(done ? 'Was the cause' : 'Cause', [ch.cause]) : ''}${heldRow}${ch.paused.length || ch.knock.length ? `<details class="cfold"><summary>${done ? 'What followed' : 'What followed from it'} · ${ch.paused.length + ch.knock.length} ›</summary><div class="cgrp">${[...ch.paused, ...ch.knock].map(cc).join('')}</div></details>` : ''}</div>`;
  }
  // the chain as the explorer's Decide panel takes it, drawn here
  const chainSteps = (H) => { const c = chainOf(H); return c ? [c.cause, ...c.paused] : null; };
  const chainFor = (H) => { const c = chainOf(H); return c ? chainHtml(c, `${X().HOURGLASS} ${waitsOf(H).length} outputs held`) : ''; };
  // a replayed day in one word, and its mark: published, warned, decided (◐ while its corrected file is still to come, ◧ filled), waiting for you
  function dayWord(y) {
    if ((y.state === 'held' || ISSUES[y.day]?.mine) && ISSUES[y.day]) {
      const s = standing(y.day); if (s?.skipped) return s.yours && !yoursOff(y.day) ? ['warn', 'warned'] : ['ok', 'published']; if (!s) return ['todo', ''];
      if (s.open && s.state === 'waiting') return ['held', 'waiting for you'];
      if (s.replaced) return ['fixd', 'decided · its corrected file went out'];
      if (s.open) return ['owed', 'decided for now · file to come'];
      return s.filled ? ['filled', 'decided · filled'] : ['dec', 'decided'];
    }
    if (y.state === 'held') return ['dec', 'decided'];
    return linesOf(y).some((l) => l.mark !== 'note') ? ['warn', 'warned'] : ['ok', 'published'];
  }
  const CHANGES = {
    'acting-leader': { from: '2024-03-11', name: 'Acted for by', addCon: 'Owners are read through a stand-in, not the post holder', leavePro: 'Owners only through the people who hold the posts, as before', pro: 'From Mon Mar 11, a unit whose leader is missing or away finds its owners through whoever acts: 7 units have someone acting today, 5 with no leader (6 when you read the file on Feb 1) and 2 whose leader is away', con: 'Those 7 units’ owners can’t be found while 5 posts stand empty and 2 leaders are away', inForce: 'In force from today: 7 units have someone acting for their leader, and their chains of ownership go through them.' },
    'waf-band-tenth': { from: '2024-03-25', name: 'Web-firewall check at 10%', addCon: 'More days may pause; on the days so far, none would have', leavePro: 'Judged at 15%, as before', pro: 'From Mon Mar 25: if more than 1 in 10 of a firewall’s applications fail, the day pauses (the control board’s standard)', con: 'Looser than the control board’s standard of 10%', inForce: 'In force from today.' },
  };
  function nextAct() {
    const x = DATA.days[B.day], H = needing();
    if (H) { const s = standing(H); return s.state === 'decided' && s.fixIn ? { act: 'decide', label: `Decide ${dayLabel(H)} ›`, sum: `${dayLabel(H)}’s corrected file is in: publish it, or keep what readers see` } : { act: 'decide', label: `Decide ${dayLabel(H)} ›`, sum: `Choose what readers see for ${dayLabel(H)}` }; }
    const ch = (x.story || []).find((s) => s.kind === 'change' && CHANGES[s.id] && !B.applied[s.id]);
    if (ch) { const ag = (B.chAgree || {})[ch.id], pk = (B.chPick || {})[ch.id]; return { act: pk === 'skip' ? 'skipchange' : 'apply', id: ch.id, disabled: !pk, label: !pk ? 'Pick one above' : pk === 'skip' ? 'Leave it out ›' : ag ? `Add it, agreeing with ${who(ch.by).split(' ')[0]} ›` : `Add it from ${dayLabel(ch.from)} ›`, sum: `A change to decide · ${who(ch.by)} added it ${dayLabel(ch.at.slice(0, 10))}${pk === 'apply' && ag ? '; you agree with her reason' : pk ? '' : ': nothing is picked for you'}` }; }
    if (x.day >= LAST) return standing(LAST)?.open ? { act: 'decide', label: 'Decide Wed Mar 27 ›', sum: 'The demo’s own day: Larkspur’s owners hadn’t decided', alt: { act: 'end', label: 'See what you built' } } : { act: 'end', label: 'See what you built ›' };
    const nextStop = DATA.days.findIndex((y, i) => i > B.day && y.day <= LAST && stopsAt(y));
    const wk = issueDays().find((K) => { const s = standing(K); return s?.open && !s.canDecide; });
    const to = DATA.days[nextStop >= 0 ? nextStop : dayIdx(LAST)];
    if (wk) { const kept = (B.dec[wk] || []).some((c) => c.how === 'wait' && !c.auto); return kept ? { act: 'run', to: nextStop, label: 'Wait for Sunday’s file ›', sum: `You kept ${wdLong(wk)} paused: Sunday’s file can fill it once it comes`, alt: { act: 'decide', label: 'Decide again' } } : { act: 'decide', label: `Decide ${dayLabel(wk)} ›`, sum: `Or wait: Sunday’s file can fill ${wdLong(wk)} once it comes`, alt: { act: 'run', to: nextStop, label: 'Wait for Sunday’s file' } }; }
    const ti = nextStop >= 0 ? nextStop : dayIdx(LAST), why = to.state === 'held' ? 'a day Larkspur’s checks paused' : (to.story || []).some((s) => s.kind === 'change') ? 'a change Larkspur recorded' : 'a day worth a look';
    const span = ti - B.day > 1 ? `Plays ${dayLabel(DATA.days[B.day + 1].day)}${ti - B.day > 2 ? ` to ${dayLabel(DATA.days[ti - 1].day)}` : ''}, then stops at ${dayLabel(to.day)}, ${why}` : `Next: ${dayLabel(to.day)}, ${why}`;
    if (ti - B.day <= 1) return { act: 'run', to: nextStop, label: `${dayLabel(to.day)} ›`, sum: span };
    return { act: 'run', to: nextStop, label: `Skip to ${dayLabel(to.day)} ›`, sum: span, alt: { act: 'run', n: 1, label: `${dayLabel(DATA.days[Math.min(B.day + 1, dayIdx(LAST))].day)} ›` } };
  }
  function daysView() {
    if (B.day < 0) return { body: `<p class="bp-lead">Replay Feb 1 to Mar 27: most days go out on their own; a paused day is yours to decide.</p>${calendar()}`, foot: `<button class="btn primary" data-act="run" data-n="1">Replay Thu Feb 1 ›</button>` };
    if (B.peek != null && B.peek !== B.day) { const y = DATA.days[B.peek]; return { body: `${calendar()}<p class="bd-peekbar"><span>Looking back at ${dayLabel(y.day)}</span><button type="button" class="link" data-act="peek-off">Back to ${dayLabel(today())}</button></p>${dayCard(y, true)}`, foot: `<button class="btn primary" data-act="peek-off">Back to ${dayLabel(today())} ›</button>` }; }
    const x = DATA.days[B.day], n = nextAct();
    const alt = n.alt ? `<button class="btn${n.equal ? ' eq' : ''}" data-act="${n.alt.act}"${n.alt.n ? ` data-n="${n.alt.n}"` : ''}${n.alt.id ? ` data-id="${n.alt.id}"` : ''}${n.alt.disabled ? ' disabled title="You agreed with adding it"' : ''}>${esc(n.alt.label)}</button>` : '';
    const foot = `${alt}<button class="btn${n.equal ? ' eq' : ' primary'}" data-act="${n.act}"${n.to != null ? ` data-to="${n.to}"` : ''}${n.id ? ` data-id="${n.id}"` : ''}${n.disabled ? ' disabled' : ''}>${esc(n.label)}</button>`;
    const carriedKs = Object.keys(ISSUES).filter((K) => K < x.day && (ISSUES[K].fixOn === x.day || ISSUES[K].decideOn === x.day || standing(K)?.needs || standing(K)?.open));
    const asking = carriedKs.filter((K) => standing(K)?.needs).map((K) => `<details class="bd-askbar"><summary><b>${esc(dayLabel(K))}${standing(K).state === 'decided' || standing(K).fixIn ? '’s corrected file is in' : ' still waits for you'}</b> · decide it with the button below · <span class="lk">what it is ›</span></summary>${carriedCard(K)}</details>`).join(''), rest = carriedKs.filter((K) => !standing(K)?.needs).map((K) => carriedCard(K)).join('');
    const todayLine = '';
    return { body: `${calendar()}${todayLine}${asking}${dayCard(x)}${rest}`, foot, sum: n.sum ? esc(n.sum) : '' };
  }
  function calendar() {
    const used = new Set(), flags = new Set(Object.entries(CHANGES).filter(([id]) => B.applied[id] === true).map(([, C]) => C.from));
    const cell = (iso) => {
      const d = +iso.slice(8, 10), i = dayIdx(iso), y = DATA.days[i];
      if (!y || iso > LAST) return `<i class="none"><span>${d}</span></i>`;
      const run = i <= B.day;
      const fc = '';
      const [cls, w] = run ? dayWord(y) : ['todo', fc === 'p' ? 'not replayed yet: will pause' : fc === 'w' ? 'not replayed yet: will warn' : 'not replayed yet'];
      const shown = ['fixd', 'filled'].includes(cls) ? 'dec' : cls; used.add(shown); if (fc) used.add('fc');
      const glyph = { held: X().PAUSE, dec: '✓', owed: X().HALF, warn: '◆' }[shown] || '';
      const chg = false;
      if (chg) used.add('chg');
      return `<button type="button" class="c ${shown}${fc ? ` fc${fc}` : ''}${i === B.day ? ' now' : ''}${i === B.peek ? ' peek' : ''}${chg ? ' chg' : ''}" ${run ? `data-act="peekday" data-i="${i}"` : 'disabled'} aria-label="${dayLabel(iso)}: ${w}${chg ? ', a change decided' : ''}" title="${dayLabel(iso)}: ${w}${chg ? ' · a change decided' : ''}"><span>${d}</span>${glyph ? `<b>${glyph}</b>` : fc ? `<b class="fcm">${fc === 'p' ? X().PAUSE : '◆'}</b>` : ''}</button>`;
    };
    const m = (y0, m0, n, off) => { const cells = []; for (let i = 0; i < off; i++) cells.push('<i class="pad"></i>'); for (let d = 1; d <= n; d++) cells.push(cell(`${y0}-${String(m0).padStart(2, '0')}-${String(d).padStart(2, '0')}`)); return cells.join(''); };
    const head = '<i class="h">M</i><i class="h">T</i><i class="h">W</i><i class="h">T</i><i class="h">F</i><i class="h">S</i><i class="h">S</i>';
    // on a phone, the week of the day on screen, the two months a tap away
    const at = today() || '2024-02-01', t0 = new Date(at + 'T12:00:00Z'), mon = new Date(t0.getTime() - ((t0.getUTCDay() + 6) % 7) * DAY);
    const week = Array.from({ length: 7 }, (_, k) => isoOf(mon.getTime() + k * DAY)).map((iso) => (iso < '2024-02-01' ? '<i class="pad"></i>' : cell(iso))).join('');
    const feb = m(2024, 2, 29, 3), mar = m(2024, 3, 27, 4), open = B.calOpen || B.day < 0;
    const srow = (label, m0, n) => `<div class="bs-row"><b>${label}</b><div class="bs-g bd-g">${Array.from({ length: n }, (_, k) => { const iso = `2024-${String(m0).padStart(2, '0')}-${String(k + 1).padStart(2, '0')}`; return cell(iso).replace('class="c ', `class="c${new Date(iso + 'T12:00:00Z').getUTCDay() === 1 ? ' mon' : ''} `); }).join('')}</div></div>`;
    const strip = B.day >= 0 ? `<div class="bd-strip2">${srow('Feb', 2, 29)}${srow('Mar', 3, 27)}</div>` : '';
    const KEY = [['ok', '<i class="ok"></i>published'], ['warn', '<i class="warn">◆</i>warned'], ['held', `<i class="held">${X().PAUSE}</i>paused: waiting for you`], ['dec', '<i class="dec">✓</i>decided: paused, then someone chose what readers see'], ['fixd', '<i class="dec">↻</i>decided: its corrected file went out'], ['owed', `<i class="owed">${X().HALF}</i>decided for now`], ['filled', '<i class="filled">◧</i>decided: another day’s rows stand in'], ['chg', '<i class="chgk"></i>a change decided'], ['todo', '<i class="todo"></i>not replayed yet']];
    return `<div class="bd-cal${open ? ' open' : ''}"><div class="bd-week"><b>Week of ${esc(dayLabel(isoOf(mon.getTime())))}</b><div class="bd-g">${head}${week}</div></div><div class="bd-mo"><b>February</b><div class="bd-g">${head}${feb}</div></div><div class="bd-mo"><b>March</b><div class="bd-g">${head}${mar}</div></div>${strip}${B.day >= 0 ? `<button type="button" class="bd-calmore" data-act="calmore" aria-expanded="${!!B.calOpen}">${B.calOpen ? 'Fewer days ▴' : 'Both months ▾'}</button>` : ''}<div class="bd-key">${[['ok', '<i class="ok"></i>published'], ['warn', '<i class="warn">◆</i>warned'], ['held', `<i class="held">${X().PAUSE}</i>paused: yours to decide`], ['dec', '<i class="dec">✓</i>decided'], ['owed', `<i class="owed">${X().HALF}</i>decided for now`], ['todo', '<i class="todo"></i>not replayed yet']].filter(([k]) => used.has(k) && (k !== 'todo' || B.day < dayIdx(LAST))).map(([, h]) => `<span>${h}</span>`).join('')}</div></div>`;
  }
  // three tiles a day, each a number and a few words, counting the lines beneath; a pause decided says so
  function dayLine(x) {
    const H = x.day, lines = linesOf(x), p = lines.filter((l) => l.mark === 'pause' && !l.held).length, w = lines.filter((l) => l.mark === 'warn').length, s = ISSUES[H] ? standing(H) : null;
    const empty = (x.finds || []).filter((f) => f.file && /arrived empty/.test(f.said)).length, n = FULL.outputs.length, waiting = s && s.open && s.state === 'waiting', held = waiting ? waitsOf(H).length : 0;
    const acc = acceptedKeys(), qq = linkFindings(x).filter((l) => l.quiet), wf = lines.filter((l) => l.mark === 'warn' && fileOf(l.src)).length, notedN = qq.filter((l) => linkModeIn(l.f.id, l.k) === 'note').length, known = qq.filter((l) => linkModeIn(l.f.id, l.k) !== 'note' && acc.has(l.k)).length, seen = qq.length - known - notedN;
    const ch = ISSUES[H] ? chainOf(H) : null, touched = ch ? ch.paused.length + ch.knock.filter((c) => c.mark !== 'note').length : 0, other = ch ? lines.filter((l) => l.mark === 'warn' && l.src !== ch.file && !ch.knock.some((c) => c.src === l.src) && !ch.paused.some((c) => c.src === l.src)).length : 0;
    const otherNames = ch ? [...new Set(lines.filter((l) => l.mark === 'warn' && l.src !== ch.file && !ch.knock.some((c) => c.src === l.src) && !ch.paused.some((c) => c.src === l.src)).map((l) => nameOf(l.src)))] : [];
    const broke = ch ? (ch.filePaused ? `${esc(nameOf(ch.file))} paused` : `${esc(ch.paused.map((c) => c.name).join(' and '))} paused`) : '';
    const parts = ch ? [`${ch.filePaused ? '' : `<span class="clc">${MARK.warn} ${esc(nameOf(ch.file))}</span> → `}<span class="clp">${X().PAUSE} ${ch.filePaused ? esc(nameOf(ch.file)) : esc(ch.paused.map((c) => c.name).join(' and '))}</span>${held ? ` → <b class="bad">${X().HOURGLASS} ${held} of ${n} outputs held</b>` : ''}`, otherNames.length ? `<span class="warn">also warned: ${esc(otherNames.join(', '))}</span>` : '']
      : [`${DATA.files.length} files in${empty ? `, <b class="bad">${empty} empty</b>` : ''}`, p ? `<b class="${waiting ? 'bad' : ''}">${plural(p, 'check')} paused</b>` : '', w ? `<b class="warn">◆ ${[wf ? plural(wf, 'file') : '', w - wf ? plural(w - wf, 'output') : ''].filter(Boolean).join(' and ')} warned</b>` : '', !p && !w ? `<b class="okv">Clean</b>: every check passed${openSaid(x) ? ` · <button type="button" class="link opn" data-act="opengaps">${plural(openOn(x).length, 'gap')} still open ›</button>` : ''}` : '', held ? `<b class="bad">${held} of ${n} outputs held</b>` : `${n} outputs out`];
    return `<p class="bd-line${ch ? ' chainline' : ''}">${parts.filter(Boolean).join(' · ')}</p>`;
  }
  // a decided day, first: what readers see now
  function readersNow(H) {
    if (tlRows(H)) return ''; // peer:owner (r4): said on the timeline's rows, under the eye
    const s = standing(H); if (!s || s.skipped || (s.open && s.state === 'waiting')) return '';
    const I = ISSUES[H], ch = (s.ch || []).filter((c) => c.how !== 'stay'), first = ch[0], last = ch[ch.length - 1]; if (!last) return '';
    const was = { fill: `${I.fillFromWd || 'another day'}’s ${I.noun || 'rows'}, marked filled`, keep: `${wdLong(before(H))}’s data`, asis: `${wdLong(H)}’s file as it arrived`, accept: `${wdLong(H)}’s file as it arrived` };
    const now = s.replaced ? `${wdLong(H)}’s own corrected file` : was[last.how] || '';
    const path = s.replaced && first && first.how !== 'fix' ? `${cap(was[first.how] || '')} → ${now}, from ${dayLabel(s.closedOn)}` : cap(now);
    return `<p class="bd-readers"><b>Readers see</b> ${esc(path)}${last.how === 'accept' ? '; the new level is the usual one from here' : ''}.</p>`;
  }
  function dayStrip(x, closed) {
    const fs = x.finds || [], H = x.day, lines = linesOf(x), held = lines.filter((l) => l.held).length, p = lines.filter((l) => l.mark === 'pause' && !l.held).length, w = lines.filter((l) => l.mark === 'warn').length;
    const empty = fs.filter((f) => f.file && /arrived empty/.test(f.said)).length, s = ISSUES[H] ? standing(H) : null;
    const n = FULL.outputs.length, waiting = s && s.open && s.state === 'waiting' ? waitsOf(H).length : 0, decided = s && !s.skipped && !(s.open && s.state === 'waiting');
    const tile = (gl, big, small, cls) => `<li class="${closed ? 'past' : cls || ''}"><span class="gl">${gl}</span><b>${big}</b><small>${small}</small></li>`;
    const checks = p && decided ? tile(GL.rule, 'Decided', `was ${plural(p, 'check')} paused`, 'past') : p ? tile(GL.rule, `${plural(p, 'check')} paused`, [held ? `${held} held` : '', w ? `${w} warned` : ''].filter(Boolean).join(' · ') || 'nothing else warned', 'bad') : w ? tile(GL.rule, `${w} warned`, 'nothing paused', 'warn') : tile(GL.rule, 'All passed', `${checkCount()} file checks, the outputs’ too`);
    const outs = waiting ? tile(GL.out, `${waiting} wait`, `${n - waiting} of ${n} outputs published`, 'bad') : tile(GL.out, `${n} outputs`, 'all published');
    return `<ul class="bd-strip">${tile(GL.file, `${DATA.files.length} files`, empty ? `${empty} arrived empty` : '20 daily, 2 static: all in', empty ? 'bad' : '')}${checks}${outs}</ul>`;
  }
  // a share that is no worse for falling (fewer blanks, fewer firewalls only watching): give it a limit, so only a rise warns
  const LESS_FINE = new Set(['blank', 'monitor']);
  const limitKey = (l) => `${l.src}.${l.s.col} ${l.s.val}`;
  const gapBtns = (k, day) => B.peek != null && B.peek !== B.day ? '' : `<span class="gapbtns"><button type="button" class="btn sm" data-act="acceptgap" data-k="${k}" data-day="${day}">Accept as known</button><button type="button" class="btn sm" data-act="go" data-to="files">Change its check ›</button></span>`;
  function limitAct(l, x) {
    if (!(l.file && l.mark === 'warn' && l.s.band && l.s.side === 'below' && LESS_FINE.has(l.s.val))) return '';
    const L = (B.limits || {})[limitKey(l)], what = l.s.val === 'blank' ? `${l.s.col} blank` : l.s.val;
    if (L) return `<span class="bd-limset">✓ Limit set: from ${esc(dayLabel(L.from))}, ${esc(what)} warns only above ${L.max}%</span>`;
    if (B.peek != null && B.peek !== B.day) return '';
    return `<span class="bd-limq">${esc(l.s.val === 'blank' ? 'Fewer blanks' : `Fewer ${l.s.val}`)} than usual isn’t a problem in itself. <button type="button" class="link" data-act="limit" data-k="${esc(limitKey(l))}" data-max="${l.s.rhi}" data-what="${esc(`${nameOf(l.src)}: ${what}`)}" data-day="${x.day}">Warn only when it rises ›</button></span>`;
  }
  // what the checks saw: each line its mark and word first, and the check that saw it; with a chain, only what the chain doesn't say
  function findsList(x, replaced, chain) {
    const inChain = new Set(chain ? [chain.file, ...chain.paused.map((c) => c.src), ...chain.knock.map((c) => c.src), ...(x.holds || []).map((h) => h.replace(/_checked$/, ''))] : []);
    const lines = linesOf(x).filter((l) => !inChain.has(l.src)), quiet = linkFindings(x).filter((l) => l.quiet);
    if (!lines.length && !quiet.length) return '';
    const acc = acceptedKeys();
    const li = (l) => { const pic = l.s.auc ? aucPic(l.s.auc) : l.s.band ? bandPic(l.said, l.mark === 'pause' ? 'bad' : l.mark === 'note' ? 'note' : 'warn') : ''; return `<li class="${l.mark}${pic ? ' pic' : ''}"><span class="bd-ft"><span class="ftag ${l.mark}">${l.mark === 'pause' ? `${X().PAUSE}paused` : l.mark === 'note' ? '○ noted' : '◆ warned'}</span> <b>${esc(nameOf(l.src))}:</b> ${esc(l.s.t)}<small class="bd-code">${esc(l.tag)}${l.s.c && /^[a-z_]+$/.test(l.s.c) ? ` · on ${esc(l.s.c.replace(/_/g, ' '))}` : l.s.c ? ` · ${esc(l.s.c)}` : ''}</small>${limitAct(l, x)}${l.link && l.k && !isKnown(l.k, x.day) && x.day > '2024-02-01' ? `<span class="gapacc">New today · listed each day until you accept it${gapBtns(l.k, x.day)}</span>` : (B.knownLater || {})[l.k] && B.knownLater[l.k].day === x.day ? `<span class="gapacc ok">✓ Accepted as known by you, ${esc(youStamp(B.knownLater[l.k].at))}</span>` : ''}</span>${pic}</li>`; };
    const noted = quiet.filter((l) => linkModeIn(l.f.id, l.k) === 'note').length, same = quiet.filter((l) => linkModeIn(l.f.id, l.k) !== 'note' && acc.has(l.k)).length, later = quiet.length - noted - same;
    const quietLine = quiet.length ? `<details class="bd-quiet"><summary>${knownSaid(x.day) || 'Gaps'}</summary><ul>${quiet.map((l) => `<li><b>${esc(nameOf(l.f.id))}:</b> ${esc(linkSaid(l.k, l.n))}${l.fresh ? `, ${l.fresh} new today` : ', as before'} · ${linkModeIn(l.f.id, l.k) === 'note' ? 'noted quietly, as you chose' : 'warns only of new ones'}</li>`).join('')}</ul></details>` : '';
    const unacc = quiet.filter((l) => linkModeIn(l.f.id, l.k) !== 'note' && !isKnown(l.k, x.day));
    const unaccLine = unacc.map((l) => `<p class="bd-unacc"><b>${esc(nameOf(l.f.id))}:</b> ${esc(linkSaid(l.k, l.n))}<span class="gapacc">Open since ${esc(dShort(openSince(l.k, x.day) || x.day))}${reopenedOn(l.k, x.day) ? `: ${newIdsSaid(l.k, x.day)}new since you accepted it ${esc(dShort(acceptDayOf(l.k)))}` : ''} · listed each day until you accept it${gapBtns(l.k, x.day)}</span></p>`).join('');
    const keys = [lines.some((l) => l.s.band) ? '<i class="u"></i>usual range <i class="d"></i>that day' : '', lines.some((l) => l.s.auc) ? '<i class="th"></i>where the model speaks' : ''].filter(Boolean).join(' ');
    return `${lines.length ? `<h5>${chain ? 'Also on this day' : replaced ? `What the first file showed · replaced at ${esc(replaced)}` : 'What the checks saw'}</h5>` : ''}${lines.length ? `<ul class="bd-f${replaced ? ' past' : ''}">${lines.map(li).join('')}</ul>` : ''}${keys ? `<p class="bd-key2">${keys}</p>` : ''}<!--gaps-->${unaccLine || quietLine ? `<h5>Gaps</h5>${unaccLine}${quietLine}` : ''}`;
  }
  // a mix of values as two bars: the day before, the day; the shares in the bars, the values beneath
  function mixBox(H) {
    const m = MIX[H]; if (!m || acceptedSkip(H)) return '';
    const hot = m.hot ?? -1, bar = ([label, segs], cls) => `<div class="vr"><span>${esc(label)}</span><span class="vb ${cls}">${segs.map(([, pc], i) => `<i class="s${i}${i === hot ? ' hot' : ''}" style="width:${pc}%">${pc >= 7 ? `${pc}%` : ''}</i>`).join('')}</span></div>`;
    const key = m.a[1].map(([v], i) => `<span><i class="s${i}${i === hot ? ' hot' : ''}"></i>${esc(v)}${m.b[1][i] && m.b[1][i][0] !== v ? ` → ${esc(m.b[1][i][0])}` : ''} <b>${m.a[1][i][1]}% → ${m.b[1][i][1]}%</b></span>`).join('');
    const paused = !!(ISSUES[H] && standing(H) && !standing(H).skipped);
    return `<div class="bd-mix${paused ? ' p' : ''}"><div class="bd-vals">${bar(m.a, '')}${bar(m.b, 'new')}</div><p class="bd-mixkey">${key}</p>${m.moved ? `<div class="bd-moved"><svg viewBox="0 0 400 30" aria-hidden="true"><rect class="mv-t" x="0" y="15" width="400" height="9" rx="4.5"/><rect class="mv-v" x="0" y="15" width="${Math.min(400, m.moved * 4).toFixed(0)}" height="9" rx="4.5"/><line class="mv-q" x1="100" x2="100" y1="8" y2="28"/><text class="mv-l" x="104" y="11">a quarter of the rows: pauses</text></svg><span><b>${m.moved}% of the rows moved</b>, past the quarter</span></div>` : ''}<p class="bd-mixsaid">${esc(m.said)}</p></div>`;
  }
  // who and when, in the record's words
  const ROLE = { 'Sloane Marsden': 'security lead' };
  const who = (by) => WHO[by] || by || 'Larkspur’s owners';
  const whoRole = (by) => { const n = who(by); return ROLE[n] ? `${n}, ${ROLE[n]}` : n; };
  const whyTap = (text, label) => (text ? ` <details class="bd-why"><summary>${esc(label || 'Why')}</summary>“${esc(text)}”</details>` : '');
  // the day in time order, in two lanes: this replay and Larkspur's record; the owners' decision shows once you have made yours
  function timelineOf(H, upTo = today()) {
    const st = (DATA.days[dayIdx(H)].story || []).filter((e) => e.at && e.at.slice(0, 10) <= upTo), s = standing(H, upTo) || {};
    const I0 = ISSUES[H], mine = (s.ch || []).filter((c) => c.how !== 'stay'), items = [], x = DATA.days[dayIdx(H)];
    const decs = [...(I0 && I0.decideOn && upTo >= I0.decideOn ? [{ kind: 'decision', pseudo: true, option: 'dont', at: `${H}T23:59:00.000Z` }] : []), ...st.filter((e) => e.kind === 'decision')];
    if (x.runAt && ISSUES[H]) items.push({ at: x.runAt, html: `<b>The day’s files arrived</b> · ${yoursSkip(H) ? 'its checks warned' : 'the checks paused the day'}` });
    for (const e of st) {
      if (e.kind === 'event') items.push({ at: e.at, html: `<b>Noted by ${esc(who(e.by))}:</b> ${esc(e.name)}${H === '2024-03-05' ? ' <span class="bd-hint">after the day paused, so the pause stands</span>' : ''}${whyTap(e.note)}` });
      if (e.kind === 'delivery') items.push({ at: e.at, html: `<b>A corrected file came:</b> ${esc(dot(e.why))} <span class="bd-okt">It passed every check.</span>` });
    }
    decs.forEach((e, k) => { if (k < mine.length || e.pseudo) items.push({ at: e.at, lane: 'record', html: e.pseudo ? `<span class="lane rec">Larkspur’s record</span> <b>Nobody decided on Saturday</b> · the day waited for Sunday’s file` : `<span class="lane rec">Larkspur’s record</span> <b>${esc(cap(OPTION[recHow(e)]))}</b> · ${esc(whoRole(e.by))}${whyTap(e.reason, `${who(e.by)}’s reason`)}` }); });
    mine.forEach((c, k) => { const e = decs[k], same = e && recHow(e) === c.how; items.push({ at: e && e.at.slice(0, 10) === c.on ? `${e.at}~` : `${c.on}T23:59`, t: dShort(c.on || H) /* peer:owner (r4): one clock */, when: '', lane: 'you', html: `<span class="lane you">This replay</span> <b>${esc(e && e.pseudo && c.how === 'wait' ? 'Kept it paused: waited for Sunday’s file' : YOU[c.how])}</b>${e ? (e.pseudo ? (same ? ' · as Larkspur did' : '') : same ? ` · the same as ${esc(who(e.by))}` : ` · ${esc(who(e.by))} ${esc(OPTION[recHow(e)])}`) : ''}${c.on !== H ? ` · on ${esc(dShort(c.on))}` : ''}${c.agreed ? ` · agreed with ${esc(c.agreed.who)} (${esc(c.agreed.at)})${whyTap(c.agreed.quote, `${c.agreed.who}’s reason, quoted`)}` : ''}${whyTap(c.note, 'Your reason')}` }); });
    return items.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map((it) => `<li class="${it.lane || ''}"><span class="bd-t">${esc(it.t || whenSaid(it.at, H))}</span><span>${it.html}${it.when ? `<small class="bd-when">${esc(it.when)}</small>` : ''}</span></li>`).join('');
  }
  const recSaid = (s) => `<b>${esc(whoRole(s.by))}</b> ${esc(OPTION[recHow(s)])} · ${esc(dayLabel(s.at.slice(0, 10)))}, ${esc(hhmm(s.at))}${whyTap(s.reason, `${who(s.by)}’s reason`)}`;
  // peer:owner (r4): the day's receipts as timeline rows, on the story's one clock and oldest first, as "The day, in
  // order" is. Each row: when (the day, and the time where the record has one), what happened or was decided, who, in
  // whose words, and what readers saw. A decision made in this replay is dated by the story's day it was made on; the
  // replay's wall clock stays out of view, so waiting on Monday and publishing on Tuesday read a day apart. What readers
  // see and the corrected file, once blocks of their own, are rows here.
  const FIX_BA = { '2024-02-16': ['4 teams in Payments Engineering, gone', '4 teams in Payments Operations (DEP-16)'], '2024-02-26': ['0 rows', '2,318 rows'], '2024-03-11': ['COMPLETED 950', 'COMPLETED 1,427'], '2024-03-21': ['1,630 rows, each twice', '815 rows, each once'] };
  const fixPassed = (H) => (H === '2024-02-16' ? 'Org units passes every check; App owners and Org chain clear. People still warns: P-0087 works in the gone department.' : 'It passes every check.');
  const TL_EYE = '<svg class="eyemk" viewBox="-9 -6 18 12" aria-hidden="true"><path d="M-8 0c2.4-3.4 5-5 8-5s5.6 1.6 8 5c-2.4 3.4-5 5-8 5s-5.6-1.6-8-5z"/><circle r="2.2"/></svg>';
  // whether a day has receipts to show: a decision of yours, or a corrected file in
  function tlRows(H, upTo = today()) {
    const s = standing(H, upTo); if (!s || s.skipped) return null;
    const x = DATA.days[dayIdx(H)], mine = (s.ch || []).filter((c) => c.how !== 'stay');
    const files = (x.story || []).filter((e) => e.kind === 'delivery' && e.at && e.at.slice(0, 10) <= upTo);
    return mine.length || files.length ? { s, x, mine, files } : null;
  }
  // the day a row happened, named as the rest of the app names it (Today, else Mon 26)
  const tlDay = (iso) => (X().smDay ? X().smDay.text(iso, dShort(iso)) : dShort(iso));
  // what readers saw after each choice, by date, in the Decide panel's words
  const tlSees = (H, how) => { const I = ISSUES[H] || {}; return { wait: dayLabel(before(H)), keep: dayLabel(before(H)), fill: `${dayLabel(H)}, ${I.noun || 'rows'} from ${I.fillFromD || 'another day'}`, asis: `${dayLabel(H)} as it arrived`, accept: `${dayLabel(H)} as it arrived`, fix: `${dayLabel(H)}, corrected` }[how] || ''; };
  const tlRow = ({ day, time, mark, cls, what, who, whoHtml, whoFull, sees, words, note }) => `<li class="tl-r${cls ? ' ' + cls : ''}"${note ? ` title="${esc(note)}"` : ''}><span class="tl-when"><b>${esc(day)}</b>${time ? `<small>${esc(time)}</small>` : ''}</span><span class="tl-mk" aria-hidden="true">${mark}</span><span class="tl-body"><span class="tl-what"><b>${what}</b>${who || whoHtml ? ` <span class="tl-who"${whoFull && whoFull !== who ? ` title="${esc(whoFull)}"` : ''}>· ${whoHtml || esc(who)}</span>` : ''}</span>${sees ? `<span class="tl-sees" title="What readers saw">${TL_EYE}${esc(sees)}</span>` : ''}${words ? `<span class="tl-words">${words}</span>` : ''}</span></li>`;
  function outcomeOf(H, upTo = today()) {
    const t = tlRows(H, upTo); if (!t) return '';
    const { s, x, mine, files } = t, items = [], n = waitsOf(H).length;
    // the day paused when its files arrived; readers kept the day before
    items.push({ at: x.runAt || `${H}T00:00:00.000Z`, html: tlRow({ day: tlDay(H), time: x.runAt ? hhmm(x.runAt) : '', mark: X().PAUSE, cls: 'paused', what: 'Paused', whoHtml: `<span class="tl-n">${X().HOURGLASS}${n}</span> held`, sees: dayLabel(before(H)) }) });
    // a corrected file: what changed in it, whether it passed, and who sent it again and why
    for (const e of files) { const d = e.at.slice(0, 10), ba = FIX_BA[H], ok = H === '2024-02-16' ? 'one warning left' : 'every check passed';
      items.push({ at: e.at, html: tlRow({ day: tlDay(d), time: hhmm(e.at), mark: '<b class="tl-ok">↻</b>', cls: 'file', what: `Corrected file in${ba ? ` <span class="tl-ba"><s>${esc(ba[0])}</s> → ${esc(ba[1])}</span>` : ''}`, who: '', sees: '', words: `<span class="tl-pass" title="${esc(fixPassed(H))}">${esc(ok)}</span>${s.open && !s.replaced ? ' · not out until you choose' : ''}`, note: e.why ? dot(e.why) : '' }) }); } // who sent it again, and why, on hover
    // each of your decisions, dated by the story's day it was made on, after that day's events
    mine.forEach((c, k) => {
      const last = k === mine.length - 1, mark = c.how === 'wait' ? X().HOURGLASS : last && s.open ? X().HALF : last && s.filled ? '◧' : '✓';
      const by = c.by ? String(c.by).split(',')[0].trim() : 'You', mineWords = c.by ? `${by}’s words` : 'your words';
      const words = c.agreed ? `<details class="tl-q"><summary>${esc(c.agreed.who)}’s words</summary><q>${esc(c.agreed.quote)}</q> <small>${esc(whoRole(c.agreed.who))}${c.agreed.at ? `, ${esc(/,/.test(c.agreed.at) ? c.agreed.at : `${dShort(H)}, ${c.agreed.at}`)}` : ''} · agreed</small></details>` : c.note ? `<details class="tl-q"><summary>${c.from === 'smaltfl' ? 'smaltfl’s reading' : esc(mineWords)}</summary><q>${esc(c.note)}</q>${c.from === 'smaltfl' ? ' <small>agreed</small>' : ''}</details>` : '<span class="tl-none">no reason given</span>';
      items.push({ at: `${c.on || H}T23:59:59.${String(k).padStart(3, '0')}Z`, html: tlRow({ day: tlDay(c.on || H), time: '', mark, cls: `dec${c.how === 'wait' ? ' waiting' : ''}${last && s.open ? ' owed' : ''}`, what: esc(YOU[c.how] || c.how), who: by, whoFull: c.by || '', sees: tlSees(H, c.how), words }) });
    });
    const redo = mine.length && upTo === today() ? `<p class="tl-foot"><button type="button" class="link" data-act="redo" data-day="${H}">Change this decision</button></p>` : '';
    return `<div class="bd-receipts bd-tl" role="group" aria-label="What was decided, in order"><ol>${items.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map((it) => it.html).join('')}</ol>${redo}</div>`;
  }
  function lasting(H) {
    const s = H === '2024-02-16' ? standing(H) : null; if (!s || !s.replaced) return '';
    const m = linkModeOf('hr_people.org_unit_id');
    return `<p class="bd-lasting"><b>Still wrong after it:</b> People lists P-0087 in Payments Engineering, which is gone. Its check ${m === 'all' ? 'warns every day now' : m === 'new' ? 'warns of new ones only, so it says nothing tomorrow' : m === 'note' ? 'notes it quietly' : 'is off'}.${m === 'new' ? ' <button type="button" class="link" data-act="gapmode" data-k="hr_people.org_unit_id" data-m="all">Warn every day ›</button>' : ''}</p>`;
  }
  function fixLine(H) {
    if (tlRows(H)) return ''; // peer:owner (r4): the corrected file is a row of the timeline
    const I = ISSUES[H], s = standing(H); if (!I || !s || s.skipped || !s.fixIn || !I.fixAt) return '';
    const ev = DATA.days[dayIdx(H)].evidence, said = ev && EVIDENCE[H] ? EVIDENCE[H](ev) : I.diff || '';
    const passed = fixPassed(H); // peer:owner (r4): shared with the timeline's row
    const BA = FIX_BA[H]; // peer:owner (r4): shared with the timeline's row
    return `<div class="bd-fixline${s.replaced ? ' past' : ''}"><b>${s.replaced ? '↻ Corrected file' : 'New: a corrected file'}, ${esc(I.fixAt)}</b>${BA ? `<span class="ba"><span class="b4">${esc(BA[0])}</span><span class="ar">→</span><span class="af">${esc(BA[1])}</span></span>` : ''}<span class="bd-hint">${esc(passed)}${!s.replaced ? ' Not published until you choose.' : ''}</span></div>`;
  }
  // the call to decide: only what the footer's button doesn't say
  function issueBox(H) {
    const I = ISSUES[H], s = standing(H); if (!s || s.skipped) return '';
    if (I.demo) return s.open && s.state === 'waiting' ? '<div class="bd-act yours"><b>This is where Larkspur’s demo starts</b><span>Its owners hadn’t decided this day yet: it is yours.</span></div>' : '';
    if (s.needs) return '';
    const evSaid = '';
    if (s.open && !s.canDecide) return `<div class="bd-act wait"><b>${X().PAUSE} Paused over the weekend</b><span>Nobody decided on Saturday in Larkspur’s record: the day waited for Sunday’s file, ${esc(dayLabel(I.decideOn))}, to fill it from.</span></div>`;
    const next = s.open && I.fixOn && !s.fixIn ? `<p class="bd-next">${X().HALF} Next: the corrected file, ${esc(I.nextFile || 'when it comes')}.</p>` : '';
    return evSaid || next ? `<div class="bd-act done">${evSaid}${next}</div>` : '';
  }
  function carriedCard(K) {
    const s = standing(K); if (!s) return '';
    const head = s.needs ? (s.state === 'decided' ? 'Still open: its corrected file is in' : 'Still waiting for you') : s.open && s.state === 'waiting' ? 'Still paused' : s.open ? 'Decided for now' : 'Decided';
    const ch = chainOf(K), n = waitsOf(K).length;
    const stand = s.needs || (s.open && s.state === 'waiting') ? 'still' : s.open ? 'owed' : 'done';
    return `<article class="bd-card carried ${stand}"><p class="bd-still">${stand === 'done' ? '✓ ' : stand === 'owed' ? `${X().HALF} ` : ''}${esc(head)}</p><header><span class="bd-d">${dayLabel(K)}</span></header><h3>${esc(TITLES[K] || '')}</h3>${outcomeOf(K)}${ch && s.open && s.state === 'waiting' ? ((s.ch || []).some((c) => c.how === 'wait') ? `<details class="bd-was"><summary>Why it paused ›</summary>${chainHtml(ch, `${X().HOURGLASS} ${n} of that day’s outputs held · readers see ${esc(dayLabel(today()))}`, true)}</details>` /* peer:owner (r4) */ : chainHtml(ch, `${X().HOURGLASS} ${n} of that day’s outputs held · readers see ${esc(dayLabel(today()))}`)) : ''}${readersNow(K)}${fixLine(K)}${issueBox(K)}</article>`; // peer:owner (r4): the day in order is its timeline's rows
  }
  // the changes Larkspur's owners recorded: drawn, said in a line, each choice's consequence, who decided and recorded it
  function wafPic(inForce, upTo) {
    const X0 = (n) => 12 + (n / 20) * 276, days = DATA.days.filter((y) => y.day <= upTo && y.wafFail != null), max = days.reduce((a, y) => (y.wafFail > a.v ? { v: y.wafFail, d: y.day } : a), { v: 0, d: null });
    return `<p class="bd-chtitle">Share of a firewall’s applications failing, each day so far</p><svg class="bd-chpic" viewBox="0 0 300 74" aria-hidden="true"><text class="cp-l new" x="${X0(10) + 2}" y="11" text-anchor="end">${inForce ? 'pauses at 10%' : 'pauses at 10%, from Mon 25'}</text><text class="cp-l old" x="${X0(15) - 2}" y="11">${inForce ? 'was 15%' : '15% until then'}</text><line class="cp-old${inForce ? ' gone' : ''}" x1="${X0(15)}" x2="${X0(15)}" y1="16" y2="46"/><line class="cp-new${inForce ? '' : ' soon'}" x1="${X0(10)}" x2="${X0(10)}" y1="16" y2="46"/><rect class="cp-t" x="12" y="29" width="276" height="4" rx="2"/><rect class="cp-u" x="${X0(2)}" y="23" width="${X0(4) - X0(2)}" height="16" rx="3"/>${days.map((y, i) => `<circle class="cpd" cx="${X0(y.wafFail).toFixed(1)}" cy="${(25 + (i % 5) * 3).toFixed(1)}" r="1.6"/>`).join('')}${max.d ? `<line class="cp-max" x1="${X0(max.v).toFixed(1)}" x2="${X0(max.v).toFixed(1)}" y1="22" y2="42"/><text class="cp-l" x="${X0(max.v).toFixed(1)}" y="56" text-anchor="middle">highest ${max.v}%</text>` : ''}<text class="cp-l" x="12" y="70">0%</text><text class="cp-l" x="${X0(2).toFixed(1)}" y="70">usual 2–4%</text><text class="cp-l" x="288" y="70" text-anchor="end">20% failing</text></svg><p class="bd-trial">Tried on the ${days.length} days so far: none would have paused. The highest was ${max.v}%, on ${dayLabel(max.d)}.</p>`;
  }
  function changeBox(x) {
    const ch = (x.story || []).find((s) => s.kind === 'change'); if (!ch || !CHANGES[ch.id]) return '';
    const C = CHANGES[ch.id], rec = whoRole(ch.by), on = dayLabel(ch.at.slice(0, 10));
    const ask = B.applied[ch.id] ? '' : `<p class="bd-ask"><b>Larkspur’s owners added this on ${esc(on)}. Add it from ${esc(dayLabel(C.from))}?</b></p>`;
    const whoLine = `<div class="bd-who">Recorded by <b>${esc(rec)}</b>, ${esc(on)}, ${esc(hhmm(ch.at))}</div>`;
    const why = (B.appliedWhy || {})[ch.id], agreed = (B.chAgreed || {})[ch.id], agreeing = (B.chAgree || {})[ch.id];
    const pick = (B.chPick || {})[ch.id];
    const card = (v, title, text, extra) => `<div class="chcard"><span class="chbody"><b>${esc(title)}</b>${v === 'apply' ? `<span class="sugchip owner">${esc(who(ch.by))} added it · ${esc(on)}, ${esc(hhmm(ch.at))}</span>` : ''}<span class="chtext">${esc(text)}</span>${extra || ''}</span></div>`;
    const agreeBit = ch.why ? `<span class="sugwhy">${esc(who(ch.by))}’s reason: “${esc(ch.why)}”</span><span class="bd-agreerow"><input type="checkbox" data-chagree="${ch.id}" ${agreeing ? 'checked' : ''} aria-label="I agree with her reason"><span>I agree with ${esc(who(ch.by).split(' ')[0])}’s reason (her words, not yours)</span></span>` : '';
    const chPic = (add) => ch.id === 'acting-leader' ? `<svg class="chpic" viewBox="0 0 150 40" aria-hidden="true"><rect x="2" y="10" width="54" height="20" rx="5" class="cbx"/><text x="29" y="24" text-anchor="middle">Unit</text><rect x="94" y="10" width="54" height="20" rx="5" class="cbx"/><text x="121" y="24" text-anchor="middle">Person</text>${add ? '<path d="M56 20H92" class="ce add"/><text x="75" y="8" text-anchor="middle" class="cl">acted for by</text>' : '<path d="M56 20H92" class="ce none"/><text x="75" y="8" text-anchor="middle" class="cl">no link</text>'}</svg>` : `<svg class="chpic" viewBox="0 0 150 46" aria-hidden="true"><rect x="4" y="22" width="142" height="4" rx="2" class="ct"/><rect x="${4 + 142 * 0.1}" y="18" width="${142 * 0.1}" height="12" rx="2" class="cu"/><line x1="${4 + 142 * (add ? 0.5 : 0.75)}" x2="${4 + 142 * (add ? 0.5 : 0.75)}" y1="12" y2="34" class="${add ? 'cn' : 'co'}"/><text x="${4 + 142 * (add ? 0.5 : 0.75)}" y="9" text-anchor="middle" class="cl">pauses at ${add ? '10' : '15'}%</text><text x="4" y="44" class="cl">0%</text><text x="146" y="44" text-anchor="end" class="cl">20% failing</text></svg>`;
    const two = (t, pro, con, add, extra) => { const v = add ? 'apply' : 'skip'; return `<label class="chcard pickable${extra ? ' theirs' : ''}${pick === v ? ' on' : ''}"><input type="radio" name="chp-${ch.id}" data-chpick="${ch.id}" value="${v}"${pick === v ? ' checked' : ''}>${chPic(add)}<span class="chbody"><b><i class="rd" aria-hidden="true"></i>${esc(t)}</b>${extra ? `<span class="pick">Owner’s pick · ${esc(who(ch.by).split(' ')[0])}, ${esc(on)} ${esc(hhmm(ch.at))}</span>` : ''}<span class="chpro">✓ ${esc(pro)}</span><span class="chcon">✕ ${esc(con)}</span>${extra || ''}</span></label>`; };
    const whyBox = `<div class="chcards">${two(`Add it from ${dayLabel(C.from)}`, C.pro, C.addCon, true, `<span class="chrec">${agreeBit}</span>`)}${two('Leave it out', C.leavePro, C.con, false)}</div><label class="bd-whyin"><span>${agreeing ? 'Your reason too (optional)' : 'Your reason (optional)'}</span><textarea data-chwhy="${ch.id}" rows="1" placeholder="Your reason"></textarea></label>`;
    const at = (B.appliedAt || {})[ch.id];
    const state0 = B.applied[ch.id] === true ? `<p class="bd-ok">● You added it${at ? ` (you, ${esc(youStamp(at))})` : ''}${agreed ? `, agreeing with ${esc(who(ch.by))} (her, ${esc(on)} ${esc(hhmm(ch.at))}): “${esc(ch.why || '')}”` : `, the same as ${esc(who(ch.by))}`}${why ? ` Your words: “${esc(why)}”` : ''} <button type="button" class="link" data-act="unapply" data-id="${ch.id}">Undo</button></p>` : B.applied[ch.id] === 'skip' ? `<p class="bd-skip">Left out${why ? `: “${esc(why)}”` : ''}. The record keeps it, your build doesn’t. <button type="button" class="link" data-act="unapply" data-id="${ch.id}">Undo</button></p>` : whyBox;
    const state = state0;
    const pic = ch.id === 'acting-leader' ? '<div class="bd-rel"><span class="rk">Organisational unit</span><span class="ra">acted for by →</span><span class="rk">Person</span><span class="rf">from Mon Mar 11</span></div>' : wafPic(false, x.day);
    return `<div class="bd-act${B.applied[ch.id] ? ' done' : ''}">${ask}${B.applied[ch.id] ? pic : ''}${whoLine}${state}</div>`;
  }
  function inForceBox(x) {
    return (x.story || []).filter((c) => c.kind === 'inforce' && CHANGES[c.id]).map((c) => (B.applied[c.id] === 'skip' ? '' : c.id === 'waf-band-tenth' ? `<div class="bd-act done">${wafPic(true, x.day)}<span>${esc(CHANGES[c.id].inForce)} Today it passed: the highest firewall had ${x.wafFail}% failing.</span></div>` : `<p class="bd-in">${esc(CHANGES[c.id].inForce)}</p>`)).join('');
  }
  // a day: its own status, what was decided first, the chain of a pause, its tiles, what else the checks saw, the day in order
  function dayCard(x, peek) {
    const H = x.day, I = ISSUES[H], s = I ? standing(H) : null;
    const L0 = linesOf(x).find((l) => l.mark !== 'note');
    const title = s?.skipped && !s.yours ? 'The level you accepted yesterday is the usual one' : I?.mine ? I.title : TITLES[H] || (L0 ? `${nameOf(L0.src)}: ${L0.s.t}` : 'Every file arrived; every check passed');
    const [cls] = dayWord(x);
    const asksChange = (x.story || []).some((c) => c.kind === 'change' && CHANGES[c.id] && !B.applied[c.id]);
    const calm = cls === 'warn' && !(s && !s.skipped) && !asksChange ? '<p class="bd-calm">Readers got this day marked ◆; nothing is asked of you.</p>' : '';
    const markOf = { fixd: '<span class="bd-m dec">↻ decided · corrected file out</span>', held: `<span class="bd-m held">${X().PAUSE} paused</span>`, owed: `<span class="bd-m owed">${X().HALF} decided for now</span>`, filled: '<span class="bd-m dec">◧ decided · filled</span>', dec: '<span class="bd-m dec">✓ decided</span>', warn: '<span class="bd-m warn">◆ warned, published</span>', ok: '<span class="bd-m ok"><i class="okdot" aria-hidden="true"></i>published</span>' };
    const ch = I ? chainOf(H) : null, waiting = s && s.open && s.state === 'waiting', n = waitsOf(H).length;
    const mixIn = ch && waiting && ch.cause && MIX[H] && !acceptedSkip(H) ? mixBox(H) : ''; if (mixIn) ch.cause.pic = mixIn;
    const tail = ch ? (waiting ? (H < (today() || H) ? `${esc(dShort(H))} shows nothing yet · readers are on ${esc(dayLabel(today()))}` : `readers see ${esc(dayLabel(before(H)))}`) : 'held until the decision') : '';
    const tl = I && !s?.skipped ? timelineOf(H) : '';
    const replaced = s && s.replaced ? I.fixAt || null : null;
    const yours = s?.yours ? `<p class="bd-in">Larkspur’s checks paused this day. With yours, the check that paused it ${yoursOff(H) ? 'is off, so it went out unmarked' : 'only warns, so it went out marked ◆'}.</p>` : '';
    const quiet = s?.skipped && !s.yours ? '<p class="bd-in">You accepted logging’s new level on Tue Mar 5, so Wednesday’s file was a usual day.</p>' : '';
    const decidedNow = s && !s.skipped && !waiting && (s.ch || []).some((c) => c.how !== 'stay');
    const waited = (s?.ch || []).some((c) => c.how === 'wait'); // peer:owner (r4)
    const chainPart = !ch ? '' : waiting && !waited ? chainHtml(ch, tail, false) : `<details class="bd-was"><summary>${replaced ? `First file, replaced ${esc(replaced)}` : 'Why it paused'} ›</summary>${chainHtml(ch, tail, true)}</details>`;
    const fl = quiet || findsList(x, replaced, ch), [flTop, flGaps] = fl.split('<!--gaps-->'), moreInside = `${checksToday(x)}${flGaps || ''}${tl ? `<h5>The day, in order</h5><ul class="bd-s">${tl}</ul>` : ''}`;
    return `<article class="bd-card"><header><span class="bd-d">${X().smDay ? X().smDay.html(H, dayLabel(H)) /* peer:design */ : dayLabel(H)}</span>${asksChange ? '<span class="bd-m ask">a change to decide</span>' : markOf[cls] || markOf.ok}${cls === 'held' ? sevChip(H) : ''}</header><h3>${esc(title)}</h3>${decidedNow ? '' : dayLine(x)}${outcomeOf(H)}${tuneLine(H)}${readersNow(H)}${yours}${chainPart}${fixLine(H)}${lasting(H)}${mixIn ? '' : mixBox(H)}${changeBox(x)}${inForceBox(x)}${flTop || ''}${I && !s?.skipped && !peek ? issueBox(H) : ''}<details class="bd-more"><summary>More about this day ›</summary>${moreInside}</details></article>`;
  }
  // every check's result on a day: the files' checks, their links and gaps, the limits
  const CHECK_NOTES = { '2024-02-20|learned': 'Learned ✓: the same shares once case is set aside; rows only respelled don’t count as moved' };
  function checksToday(x) {
    const st = {}, rank = { pause: 4, warn: 3, open: 2, note: 1, ok: 0 };
    const set = (k, m) => { const r = (st[k] ||= { m: 'ok', cnt: 0 }); if (m !== 'ok') r.cnt++; if (rank[m] > rank[r.m]) r.m = m; };
    for (const l of linesOf(x)) { const f = fileOf(l.src); if (!f || l.link || l.gap) continue; const ks = /arrived empty/.test(l.said || '') ? ['amount', ...(f.scope ? ['scope'] : [])] : /repeat a key/.test(l.said || '') ? ['key', 'amount'] : [checkKindOf(l.said || '')]; for (const k of ks) set(k, l.mark); }
    if (ISSUES[x.day]?.mine && ISSUES[x.day].kind === 'rows') set('amount', 'pause');
    for (const l of linkFindings(x)) set(GAP_KEYS.has(l.k) ? 'gaps' : 'links', l.quiet ? (linkModeIn(l.f.id, l.k) === 'note' ? 'note' : isKnown(l.k, x.day) ? 'ok' : 'open') : l.pause && x.day > '2024-02-01' ? 'pause' : 'warn');
    const word = { ok: '', warn: '◆', note: '○', open: '◇', pause: PZ2, off: '–' };
    const allOff = (c) => c === 'gaps' ? gapsOn().every((k) => linkModeOf(k) === 'off') : c === 'limits' ? B.limitMode === 'off' : B.added.map(fileOf).filter((f) => checkOf(f, c)).every((f) => checkOf(f, c) === 'off');
    for (const c of [...CHECKS.map(([k]) => k), 'gaps', 'limits']) if (!st[c] && allOff(c)) st[c] = { m: 'off', cnt: 0 };
    { const oh = (x.holds || []).map((h) => h.replace(/_checked$/, '')).filter((h) => !fileOf(h) && outPauses(h)), ow = (x.finds || []).filter((f) => !f.file); st.outputs = { m: oh.length && !(ISSUES[x.day] && standing(x.day)?.skipped) ? 'pause' : ow.length ? 'warn' : 'ok', cnt: oh.length || ow.length }; }
    const items = [...CHECKS, ['gaps', 'Blanks'], ['limits', 'Limits'], ['outputs', 'Outputs']].filter(([c]) => c === 'limits' || c === 'gaps' || c === 'outputs' ? (c !== 'gaps' || gapsOn().length) && (c !== 'outputs' || B.product) : B.added.some((id) => checkOf(fileOf(id), c))).map(([c, n]) => ({ c, n, ...(st[c] || { m: 'ok', cnt: 0 }) }));
    const note = CHECK_NOTES[`${x.day}|learned`];
    return `<div class="bd-cks"><span class="bd-ckh">Every check today</span>${items.map((i) => `<span class="ck1 ${i.m}${i.c === 'outputs' ? ' out' : ''}" title="${esc(KIND_Q[i.c] || i.n)} ${esc(i.n)}: ${i.m === 'ok' ? 'passed' : i.m === 'pause' ? 'paused' : i.m === 'warn' ? 'warned' : i.m === 'off' ? 'off, not checked' : i.m === 'open' ? 'a gap nobody accepted' : 'noted'}${i.cnt > 1 ? ` (${i.cnt})` : ''}"><i>${word[i.m]}</i>${esc(i.n)}</span>`).join('')}<span class="ck-leg">plain: passed · <i class="w">◆</i> warned · <i class="p">${PZ2}</i> paused · ◇ open gap · <i>○</i> noted · <i>–</i> off</span></div>${note ? `<p class="bd-cknote">${esc(note)}</p>` : ''}`;
  }
  // the days before: those with something to say, each with what came of it
  function recent() {
    const inforce = (y) => (y.story || []).some((s) => s.kind === 'inforce' && B.applied[s.id] === true);
    const changed = (y) => (y.story || []).find((s) => s.kind === 'change' && CHANGES[s.id] && B.applied[s.id] != null);
    const past = DATA.days.slice(0, B.day).filter((y) => dayWord(y)[0] !== 'ok' || inforce(y) || changed(y)).slice(-5).reverse();
    if (!past.length) return '';
    const what = (y) => { const s = ISSUES[y.day] ? standing(y.day) : null, last = s && (s.ch || []).filter((c) => c.how !== 'stay').pop(), cg = changed(y); if (cg && !last) return B.applied[cg.id] === true ? `Added ${who(cg.by).split(' ')[0]}’s “${CHANGES[cg.id].name}” from ${dayLabel(CHANGES[cg.id].from)}${(B.chAgreed || {})[cg.id] ? ', her reason agreed' : (B.appliedWhy || {})[cg.id] ? ', in your words' : ''}` : `Left out ${who(cg.by).split(' ')[0]}’s “${CHANGES[cg.id].name}”`; if (inforce(y) && dayWord(y)[0] === 'ok') return y.day === '2024-03-25' ? `Firewall check at 10% from today: passed, highest ${y.wafFail}%` : 'A rule you added is in force: passed'; return last ? YOU[last.how] : TITLES[y.day] || (linesOf(y)[0] ? `${nameOf(linesOf(y)[0].src)}: ${linesOf(y)[0].s.t}` : ''); };
    return `<h4 class="bp-h">Days before with something to say</h4><ul class="bd-recent two">${past.map((y) => { const [cls0, w0] = dayWord(y), cg = changed(y) && cls0 === 'ok', cls = cg ? 'chg' : cls0, w = cg ? 'a change decided' : w0; return `<li><button type="button" data-act="peekday" data-i="${dayIdx(y.day)}"><span class="bd-d">${dayLabel(y.day)}</span><span class="bd-r ${cls}">${w.split(' · ')[0]}</span><span class="bd-rt">${esc(what(y))}</span></button></li>`; }).join('')}</ul>`;
  }
  // the end: what was built, every decision and change beside Larkspur's, and what stays open or in force
  const thenSaid = (words) => words.map((w, i) => (i ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join(', then ');
  const mineOf = (H) => thenSaid((standing(H).ch || []).filter((c) => c.how !== 'stay').map((c) => (c.how === 'fill' && ISSUES[H]?.fillFrom ? `Filled it from ${ISSUES[H].fillFrom}` : YOU[c.how]))) || 'Not decided';
  const stepsOf = (H) => (standing(H).ch || []).filter((c) => c.how !== 'stay').map((c) => c.auto ? 'Waited for Sunday’s file, as Larkspur did' : `${YOU[c.how]}: ${c.agreed ? `✓ agreeing with ${c.agreed.who}` : c.note ? 'your own reason' : 'no reason written'}${c.at ? ` · ${youStamp(c.at)}` : ''}`);
  const optSaid = (H, how) => (how === 'fill' && ISSUES[H]?.fillFrom ? `filled it from ${ISSUES[H].fillFrom}` : OPTION[how]);
  const theirsOf = (H, bare) => { const r = recordOf(H); if (ISSUES[H]?.mine) return 'Its check only warned: the day went out marked ◆'; return thenSaid([...(ISSUES[H]?.decideOn && !bare ? ['Kept it paused'] : []), ...[r.first, r.fix].filter(Boolean).map((d) => cap(optSaid(H, recHow(d))))]); };
  const localTime = (iso) => new Date(iso).toTimeString().slice(0, 5);
  const herStamp = (iso) => (iso && iso.length > 10 ? `${dShort(iso.slice(0, 10))} ${hhmm(iso)}` : iso || '');
  const youStamp = (iso) => { const d = new Date(iso); return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toTimeString().slice(0, 5)} · this replay`; };
  const reasonOf = (H) => { const l = (standing(H).ch || []).filter((c) => c.how !== 'stay').pop(); return !l ? '' : l.agreed ? `agreeing with ${l.agreed.who}${l.note ? ', with your words too' : ''}` : l.note ? 'with your own reason' : 'no reason written'; };
  // the gaps still open on the last day: each link check's misses, since when
  function openGaps() {
    const x = DATA.days[dayIdx(LAST)], out = [];
    const at = (y, k) => (GAP_KEYS.has(k) ? (y.gaps || {})[k] : (y.links || {})[k]);
    for (const [k, n] of Object.entries({ ...(x.links || {}), ...(x.gaps || {}) })) {
      const [fid] = k.split('.'); if (!n || !isAdded(fid) || linkModeIn(fid, k) === 'off') continue;
      let i = dayIdx(LAST); while (i > 0 && at(DATA.days[i - 1], k)) i--;
      const span = DATA.days.slice(i, dayIdx(LAST) + 1).map((y) => at(y, k) || 0), lo = Math.min(...span), hi = Math.max(...span), m = linkModeIn(fid, k);
      out.push(`${nameOf(fid)}: ${linkSaid(k, n)} today${lo !== hi ? ` (${lo} to ${hi} a day)` : ''}, ${DATA.days[i].day === '2024-02-01' ? 'every day since Feb 1' : `since ${dayLabel(DATA.days[i].day)}`} · its check ${m === 'note' ? 'notes them quietly' : m === 'all' ? 'warns every day' : m === 'off' ? 'is off' : m === 'hold' ? 'pauses on new ones (yours)' : 'warns of new ones only'}${(B.knownLater || {})[k] ? ` · ${B.knownLater[k].more ? 'one more accepted' : 'accepted'} by you on ${dayLabel(B.knownLater[k].day)}${B.knownLater[k].note ? `: “${B.knownLater[k].note}”` : ''}` : B.known && !(B.known.keys || []).includes(k) ? ' · came later: it warned the day it appeared, and nobody accepted it' : ''}`);
    }
    return out;
  }
  // where your model differs from Larkspur's
  function modelDiffs() {
    const out = [];
    for (const [id, k] of Object.entries(B.kinds)) out.push(`${nameOf(id)}: ${k === 'own' ? 'a kind of its own' : `about ${kindOf(k).name}`} (Larkspur: about ${kindOf(fileOf(id).kind).name})`);
    for (const [k, v] of Object.entries(B.kindNames || {})) out.push(`${kindOf(k).name} renamed “${v}”`);
    for (const [id, v] of Object.entries(B.names)) out.push(`${fname(fileOf(id))} named “${v}”`);
    for (const [id, v] of Object.entries(B.keys)) out.push(`${nameOf(id)}: key ${v}`);
    for (const [k, off] of Object.entries(B.off)) out.push(`${nameOf(k.split('.')[0])}: link on ${k.split('.')[1]} ${off ? 'off' : 'on'}`);
    for (const [k, on] of Object.entries(B.on)) if (on) out.push(`${nameOf(k.split('.')[0])}: a link found in its data, on ${k.split('.')[1]}, turned on`);
    const LM = { 'exceptions.approver_id': 'new', 'cloud_assets.app_tag': 'note' };
    for (const [k, m] of Object.entries(B.linkMode)) if ((LM[k] || (GAP_KEYS.has(k) ? 'off' : 'new')) !== m) out.push(`${nameOf(k.split('.')[0])}: ${GAP_KEYS.has(k) ? `${GAP_TAG[k].replace(/^Your check on /, '')}` : k.split('.')[1]} ${m === 'off' ? 'not checked' : `set to ${SEG_WORD[m]}`}`);
    for (const L of Object.values(B.limits || {})) out.push(`${L.said}, from ${dayLabel(L.from)}`);
    const changed = Object.keys(B.modes).length; if (changed) out.push(`${plural(changed, 'check')} set otherwise than Larkspur’s`);
    for (const [o, m] of Object.entries(B.outModes || {})) out.push(`${outName(o)}: ${SEG_WORD[m] || m}, where Larkspur’s ${OWN_CHECKS.has(o) ? 'pauses at ¼' : 'pauses'}`);
    return out;
  }
  // the five kinds where the map has them, and a line for each pair of kinds that relate
  // peer:newcomer — on the phone's small map, a kind no file of it has brought says which file names it: "named in CMDB".
  // With the builder's patch a pointed-at kind carries `pointed` ("176 named in CMDB") and this reads it; alone, it finds
  // the file read or added that points at the kind's own file, as the next file's card does (whyNext).
  function namedShort(k) {
    if (!k || !k.ghost) return null;
    if (k.pointed) return String(k.pointed).replace(/^[\d,]+\s+/, '');
    const reg = kindOf(k.id)?.register; if (!reg || reg === B.reading || isAdded(reg)) return null;
    for (const id of [...(B.reading && !isAdded(B.reading) ? [B.reading] : []), ...B.added]) for (const jn of fileOf(id)?.joins || []) if (jn.to === reg && jn.col && !jn.found && id !== reg) return `named in ${nameOfFile(id)}`;
    return null;
  }
  function modelPic(M, live) {
    const at = { person: [0, 0], control: [1, 0], org_unit: [0, 1], application: [1, 1], platform: [1, 2] }, W = 128, Hh = 34, GX = 64, GY = 30;
    if (live) { const free = [[0, 2], [0, 3], [1, 3]]; for (const k of M.kinds) if (!at[k.id] && free.length) at[k.id] = free.shift(); }
    const r0 = live && M.kinds.length ? Math.min(...M.kinds.map((k) => (at[k.id] || [2, 0])[1])) : 0, c0 = live && M.kinds.length ? Math.min(...M.kinds.map((k) => (at[k.id] || [2, 0])[0])) : 0;
    const box = (k) => { const p = at[k.id] || [2, 0]; return { x: 6 + (p[0] - c0) * (W + GX), y: 6 + (p[1] - r0) * (Hh + GY), k }; };
    const stOf = (k) => { if (!live) return ''; const ds = k.datasets.map((id) => M.datasets.find((d) => d.id === id)).filter(Boolean); return ds.some((d) => d.state === 'waiting' && !d.causeOnly) ? 'p' : ds.some((d) => d.state === 'waiting') ? 'c' : ds.some((d) => d.state === 'decided') ? 'd' : ds.some((d) => d.state === 'warn') ? 'w' : ''; };
    const glyphAt = (st, x, y) => st === 'p' ? `<g class="gm p" transform="translate(${x} ${y})"><circle r="7"/><rect x="-3.2" y="-3.6" width="2.2" height="7.2" rx="1"/><rect x="1" y="-3.6" width="2.2" height="7.2" rx="1"/></g>` : st === 'w' || st === 'c' ? `<text class="gm w" x="${x}" y="${y + 4}" text-anchor="middle">◆</text>` : st === 'd' ? `<text class="gm d" x="${x}" y="${y + 4}" text-anchor="middle">◐</text>` : '';
    const B2 = Object.fromEntries(M.kinds.map((k) => [k.id, box(k)]));
    const pairs = [...new Set(M.relations.filter((r) => r.from !== r.to && B2[r.from] && B2[r.to]).map((r) => [r.from, r.to].sort().join('|')))];
    const many = (pr) => M.relations.filter((r) => r.from !== r.to && [r.from, r.to].sort().join('|') === pr).length;
    const ghostPair = (pr) => live && M.relations.filter((r) => r.from !== r.to && [r.from, r.to].sort().join('|') === pr).every((r) => r.ghost);
    const lines = pairs.map((pr) => { const [a, b] = pr.split('|').map((k) => B2[k]), n = many(pr), mx = (a.x + b.x) / 2 + W / 2, my = (a.y + b.y) / 2 + Hh / 2; return `<line${ghostPair(pr) ? ' class="gh"' : ''} x1="${a.x + W / 2}" y1="${a.y + Hh / 2}" x2="${b.x + W / 2}" y2="${b.y + Hh / 2}"/>${n > 1 ? `<g class="nb"><circle cx="${mx}" cy="${my}" r="9"/><text x="${mx}" y="${my + 3.5}" text-anchor="middle">${n}</text></g>` : ''}`; }).join('');
    const boxes = Object.values(B2).map((b) => { const st = stOf(b.k); return `<g class="${[b.k.ghost && live ? 'gh' : '', st ? 'st-' + st : ''].filter(Boolean).join(' ')}"><rect x="${b.x}" y="${b.y}" width="${W}" height="${Hh}" rx="8"/><text x="${b.x + 10}" y="${b.y + 15}">${esc(b.k.name)}</text><text class="n" x="${b.x + 10}" y="${b.y + 28}">${live && namedShort(b.k) ? esc(namedShort(b.k)) /* peer:newcomer */ : plural(b.k.datasets.length, 'file')}</text>${glyphAt(st, b.x + W - 14, b.y + 12)}</g>`; }).join('');
    const rows = Math.max(1, ...Object.values(B2).map((b) => (at[b.k.id] || [2, 0])[1] + 1 - r0)), cols = Math.max(1, ...Object.values(B2).map((b) => (at[b.k.id] || [2, 0])[0] + 1 - c0)), w = live ? 12 + cols * W + (cols - 1) * GX : 12 + 2 * W + GX + (M.kinds.some((k) => !at[k.id]) ? W + GX : 0), h = 12 + rows * Hh + (rows - 1) * GY;
    return `<div class="be-mapbox" style="max-width:${Math.min(420, w * 1.3)}px"><svg class="be-map" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="aspect-ratio:${w} / ${h}" role="img" aria-label="${M.kinds.length} kinds of thing and ${pairs.length} pairs of kinds that relate">${lines}${boxes}</svg></div>`;
  }
  // the 56 days at a glance: what became of each
  function endStrip(ds, w) { const k = (y) => { const t = w(y); return t === 'held' ? 'p' : ['dec', 'fixd', 'owed', 'filled'].includes(t) ? 'd' : t === 'warn' ? 'w' : ''; }; return `<div class="pdx be-strip"><span class="ps-strip" aria-hidden="true">${ds.map((y) => `<i class="${k(y)}" title="${esc(md(y.day))}"></i>`).join('')}</span><span class="ps-ax"><i>Feb 1</i><i>Mar 1</i><i>${esc(md(LAST))}</i></span><span class="ps-leg"><span><i class="d"></i>decided</span><span><i class="p"></i>waiting for you</span><span><i class="w"></i>warned</span><span><i></i>published</span></span></div>`; }
  function endView() {
    const M = syncModel(), held = Object.keys(ISSUES).filter((H) => H < LAST && standing(H) && !standing(H).skipped), open = standing(LAST)?.open;
    const yoursSkipped = Object.keys(ISSUES).filter((H) => H < LAST && standing(H)?.yours);
    const changes = Object.entries(CHANGES).filter(([id]) => DATA.days.some((y) => y.day <= LAST && (y.story || []).some((s) => s.kind === 'change' && s.id === id)));
    const recOf = (id) => { for (const y of DATA.days) for (const st of y.story || []) if (st.kind === 'change' && st.id === id) return st; return null; };
    const lastOf = (H) => (standing(H).ch || []).filter((c) => c.how !== 'stay').pop();
    const endSame = (H) => { if (ISSUES[H]?.mine) return lastOf(H)?.how === 'asis'; const r = recordOf(H), hl = [r.first, r.fix].filter(Boolean).pop(), l = lastOf(H); return !!(hl && l && recHow(hl) === l.how); };
    const allTheirs = held.every((H) => lastOf(H)?.theirs), sameN = held.filter((H) => endSame(H)).length;
    const lc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const row = (H) => { const same = endSame(H), l = lastOf(H), r = recordOf(H), her = [r.first, r.fix].filter(Boolean), hl = her[her.length - 1];
      const you = `<span class="be-you"><i>You</i>${esc(lc(mineOf(H)))}${l && l.at ? ` · ${esc(youStamp(l.at))}` : ''} · ${l && l.agreed ? '✓ agreeing with her reason' : l && l.note ? `in your words: “${esc(l.note)}”` : 'no reason written'}</span>`;
      const herS = ISSUES[H]?.mine ? '<span class="be-her"><i>Larkspur’s record</i>its check only warned: the day went out marked ◆</span>' : `<span class="be-her"><i>Sloane Marsden</i>${ISSUES[H].decideOn ? `left ${esc(wdLong(H))} undecided that day, then ` : ''}${esc(lc(theirsOf(H, true)))}${hl ? ` · ${esc(dayLabel(hl.at.slice(0, 10)))}, ${esc(hhmm(hl.at))}` : ''}${hl && hl.reason ? ` · “${esc(hl.reason)}”` : ''}</span>`;
      if (true) return `<li class="${same ? 'is-same' : 'is-diff'}"><span class="bd-d">${dayLabel(H)}</span><details class="be-what be-fold2"><summary><b>${esc(nameOf(ISSUES[H].file))}</b> you: ${esc(lc(mineOf(H)))}${l && l.agreed ? ', her reason agreed' : l && l.note ? ', your words' : ''} <span class="lk">both records ›</span></summary>${l && stepsOf(H).length ? `<span class="be-steps2"><i>You</i>${stepsOf(H).map((t, k) => `<span>${stepsOf(H).length > 1 ? `${k + 1}. ` : ''}${esc(t)}</span>`).join('')}</span>` : you}${ISSUES[H]?.mine ? herS : `<span class="be-steps2 her"><i>Sloane Marsden</i>${her.map((t, k) => `<span>${her.length > 1 ? `${k + 1}. ` : ''}${esc(OPTION[recHow(t)] || recHow(t))} · ${esc(dShort(t.at.slice(0, 10)))} ${esc(hhmm(t.at))}${t.reason ? ` · “${esc(t.reason)}”` : ''}</span>`).join('') || `<span>${esc(lc(theirsOf(H, true)))}</span>`}</span>`}</details><span class="${same ? 'same' : 'diff'}">${ISSUES[H]?.mine ? 'yours alone' : same ? '✓ the same' : '≠ differs'}</span></li>`;
      return `<li class="${same ? 'is-same' : 'is-diff'}"><span class="bd-d">${dayLabel(H)}</span><span class="be-what"><b>${esc(nameOf(ISSUES[H].file))}</b>${you}${herS}${l && stepsOf(H).length > 1 ? `<span class="be-steps2"><i>Your ${stepsOf(H).length} decisions</i>${stepsOf(H).map((t, k) => `<span>${k + 1}. ${esc(t)}</span>`).join('')}</span>` : ''}</span><span class="${same ? 'same' : 'diff'}">${ISSUES[H]?.mine ? 'yours alone' : same ? '✓ the same' : '≠ differs'}</span></li>`; };
    const diffRows = held.filter((H) => !endSame(H)), sameRows = held.filter((H) => endSame(H));
    const agreedN = held.filter((H) => (standing(H).ch || []).filter((c) => c.how !== 'stay' && !c.auto).every((c) => c.agreed)).length;
    const rows = [...diffRows, ...sameRows].sort((a, b) => (a < b ? -1 : 1)).map(row).join('');
    const crow = changes.map(([id, C]) => { const a = B.applied[id], st = recOf(id); return `<li><span class="bd-d">${dayLabel(st.at.slice(0, 10))}</span><span class="be-what"><b>${esc(C.name)}</b> ${a === true ? 'added' : a === 'skip' ? 'left out' : 'not decided'}<small>in force from ${esc(dayLabel(C.from))}${a === true && (B.chAgreed || {})[id] ? ' · agreeing with Sloane Marsden, her reason quoted' : ''}</small></span><span class="${a === true ? 'same' : 'diff'}">${a === true ? 'the same' : 'Sloane added it'}</span></li>`; }).join('');
    const gaps = openGaps(), diffs = modelDiffs();
    const stillOpen = [
      ...held.filter((H) => standing(H)?.open).map((H) => `${dayLabel(H)} is decided for now: its corrected file is still to come`),
      ...held.filter((H) => standing(H)?.filled).map((H) => `${dayLabel(H)} shows ${ISSUES[H].fillFromWd ? `${ISSUES[H].fillFromWd}’s` : 'another day’s'} ${ISSUES[H].noun || 'rows'}, filled from ${ISSUES[H].fillFrom || 'another day'} and marked so`),
      ...yoursSkipped.map((H) => `${dayLabel(H)} went out with a warning under your checks; Larkspur’s paused it`),
      ...(accepted('2024-03-05') || accepted('2024-03-06') ? [`Logging’s new level is its usual one, accepted ${accepted('2024-03-05') ? 'Tue Mar 5' : 'Wed Mar 6'}`] : []),
      ...(B.applied['acting-leader'] === true ? ['Units are acted for by people (“Acted for by”), since Mon Mar 11'] : []),
      ...(B.applied['waf-band-tenth'] === true ? ['The web-firewall check pauses at 10%, since Mon Mar 25'] : []),
    ];
    return {
      body: `<div class="be-head"><b>You built Larkspur from its files</b><span>up to Wed Mar 27, where Larkspur’s own demo begins: a paused day for you to decide.</span></div>${open ? `<p class="be-open">${X().PAUSE}<span><b>Wed Mar 27 is paused.</b> Access reviews arrived empty; 11 outputs held until you decide.</span></p>` : ''}<ul class="be-facts"><li><b>${M.datasets.length}</b><span>files read</span></li><li><b>${M.kinds.length}</b><span>kinds of thing</span></li><li><b>${linkCount(M)}</b><span>links between kinds</span>${B.applied['acting-leader'] === true ? '<small>1 added from Mon Mar 11</small>' : ''}</li><li><b>${checkCount()}</b><span>file checks</span><small>and ${WATCHED.length + 1} output watches, ${LIMITS.length} limits, 2 models that only warn</small></li></ul>
        ${(() => { const ds = DATA.days.filter((y) => y.day <= LAST), w = (y) => dayWord(y)[0], c = (k) => ds.filter((y) => (k === 'dec' ? ['dec', 'fixd', 'owed', 'filled'].includes(w(y)) : w(y) === k)).length, warnedDays = ds.filter((y) => w(y) === 'warn').map((y) => md(y.day)), alsoWarned = ds.filter((y) => ['dec', 'fixd', 'owed', 'filled', 'held'].includes(w(y)) && (linesOf(y).some((l) => l.mark === 'warn') || (y.finds || []).some((f) => !f.file && !(y.holds || []).some((h) => h.replace(/_checked$/, '') === f.source)))).map((y) => md(y.day)); const fcP = ds.filter((y) => ISSUES[y.day] && pausesHere(y.day) && !(y.day === '2024-03-06' && accepted('2024-03-05'))).length, gotP = c('dec') + c('held'); const okOpen = ds.filter((y) => w(y) === 'ok' && openOn(y).length).length, fcW = ds.filter((y) => !(ISSUES[y.day] && pausesHere(y.day)) && linesOf(y).some((l) => l.mark === 'warn')).length; const forecastW = ds.filter((y) => y.state === 'unusual'), quietened = forecastW.filter((y) => w(y) === 'ok'); return `<p class="be-tally"><b>${ds.length} days</b> · ${c('ok')} published${okOpen ? ` (${okOpen} with a gap still open)` : ''} · ${c('warn')} warned · ${c('dec')} decided · ${c('held')} waiting for you</p>${endStrip(ds, w)}${quietened.length ? `<p class="bp-note">${quietened.map((y) => md(y.day)).join(', ')} ${quietened.length > 1 ? 'were' : 'was'} forecast to warn on Feb 1 and went out clean${accepted('2024-03-05') || accepted('2024-03-06') ? `: Logging’s new level was its usual one by then, accepted ${accepted('2024-03-05') ? 'Tue Mar 5' : 'Wed Mar 6'}` : ''}.</p>` : ''}<p class="be-match ${fcP === gotP && fcW === c('warn') ? 'ok' : 'off'}">${fcP === gotP ? `✓ Replayed as your checks forecast: ${gotP} days paused, ${c('warn')} warned` : `◆ Your checks forecast ${fcP} paused days; the replay paused ${gotP}`}</p>`; })()}
        <!--rec--><h4 class="bp-h">Your decisions · ${held.filter((H) => !ISSUES[H]?.mine && endSame(H)).length} of ${held.filter((H) => !ISSUES[H]?.mine).length} days the same as Sloane Marsden’s${held.some((H) => ISSUES[H]?.mine) ? ` · ${held.filter((H) => ISSUES[H]?.mine).map((H) => md(H)).join(', ')} yours alone (her record never paused ${held.filter((H) => ISSUES[H]?.mine).length > 1 ? 'them' : 'it'})` : ''}</h4><p class="bp-note">${(() => { const ent = held.flatMap((H) => (standing(H).ch || []).filter((c) => c.how !== 'stay' && !c.auto)); return `${plural(ent.length, 'decision')} on ${plural(held.length, 'day')}: ${ent.filter((c) => c.agreed).length} agreeing with her reason, ${ent.filter((c) => !c.agreed && c.note).length} in your own words, ${ent.filter((c) => !c.agreed && !c.note).length} with no reason written${(() => { const dd = held.filter((H) => (standing(H).ch || []).some((c) => c.how !== 'stay' && !c.auto && !c.agreed && !c.note)).map((H) => md(H)); return dd.length ? ` (${dd.join(', ')})` : ''; })()}.`; })()}</p><ul class="be-dec">${rows}</ul>
        ${changes.length ? `<h4 class="bp-h">Changes the owners recorded · ${changes.filter(([id]) => B.applied[id] === true).length} of ${changes.length} added</h4><ul class="be-dec">${crow}</ul>` : ''}
        <!--model--><h4 class="bp-h">${diffs.length ? 'Your model beside Larkspur’s' : 'Your model: the same as Larkspur’s ✓'}</h4>${modelPic(M)}<p class="bp-note be-mapnote">A line joins two kinds that relate; a number on it, how many links it carries: ${linkCount(M)} links between ${[...new Set(M.relations.filter((r) => r.from !== r.to).map((r) => [r.from, r.to].sort().join('|')))].length} pairs of kinds.</p>${diffs.length ? `<p class="bp-note">Where yours differs:</p><ul class="be-open-list">${diffs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="bp-note">Every kind, link and check as Larkspur’s owners set them.</p>'}<!--/model-->
        ${(() => { const x = DATA.days[dayIdx(LAST)], x0 = DATA.days[0], ks = gapKeysAll(); if (!ks.length) return ''; const known = ks.filter((k) => isKnown(k, LAST)), open = ks.filter((k) => !isKnown(k, LAST) && linkModeOf(k) !== 'off' && nOn(k, x) > 0), offNever = ks.filter((k) => !isKnown(k, LAST) && linkModeOf(k) === 'off'); const MW = { new: 'warns of new ones', all: 'warns every day', hold: 'pauses on new ones', note: 'noted quietly', off: 'off: counted here, never shown on a day' }; const row = (k, extra) => { const a0 = acceptDayOf(k), na = a0 ? nOn(k, DATA.days[dayIdx(a0)]) : null, n1 = nOn(k, x), grew = na != null && n1 > na; return `<li><b>${esc(nameOf(k.split('.')[0]))}:</b> ${esc(linkSaid(k, n1))} · <span class="gcnt">${a0 ? `${esc(md(a0))}: ${fmt(na)} accepted` : `Feb 1: ${fmt(nOn(k, x0))}`} → ${esc(md(LAST))}: ${fmt(n1)}${grew ? ` (+${fmt(n1 - na)} since, not accepted)` : ''}</span> · ${esc(MW[linkModeOf(k)] || linkModeOf(k))}${extra || ''}</li>`; }; return `<h4 class="bp-h">Gaps on ${esc(dShort(LAST))}</h4>${known.length ? `<p class="bp-note"><b>${esc(knownSaid(LAST))}</b>${B.known && !B.known.declined ? ` · accepted by you for Thu Feb 1, recorded ${esc(youStamp(B.known.at).replace(' · this replay', ''))}` : ''}</p><ul class="be-open-list">${known.map((k) => row(k, (B.knownLater || {})[k] ? ` · accepted ${esc(dShort(B.knownLater[k].day))}` : '')).join('')}</ul>` : ''}${open.length ? `<p class="bp-note"><b>Open, not accepted</b> (${open.length})</p><ul class="be-open-list">${open.map((k) => row(k, ` · open since ${esc(dShort(openSince(k, LAST) || LAST))}${gapBtns(k, LAST)}`)).join('')}</ul>` : ''}${offNever.length ? `<p class="bp-note"><b>Off, never accepted</b> (${offNever.length})</p><ul class="be-open-list">${offNever.map((k) => row(k)).join('')}</ul>` : ''}<button type="button" class="link" data-act="go" data-to="files">Change their checks ›</button>`; })()}
        ${stillOpen.length ? `<h4 class="bp-h">Now in force, or worth knowing</h4><ul class="be-open-list">${stillOpen.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}<!--/rec--><button type="button" class="link be-back" data-act="go" data-to="days">‹ Back to the days</button>`,
      foot: open ? `<button class="btn primary" data-act="decide">Next: decide Wed Mar 27 yourself ›</button>` : `<button class="btn primary" data-act="demo">Open the explorer on Wed Mar 27 ›</button>`,
    };
  }

  // ---------------------------------------------------------------- what pressing does
  function act(a, d) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    B.said = null;
    if (a === 'reset') { if (!confirm('Start again from nothing? What you built here is cleared.')) return; B = fresh(); save(); refreshMap(); drawPanel(); return; }
    if (a === 'mapfull') { B.mapFull = !B.mapFull; save(); drawPanel(true); requestAnimationFrame(() => X().refresh()); return; }
    if (a === 'map') { B.map = !B.map; save(); document.body.classList.toggle('mapopen', B.map); drawPanel(true); requestAnimationFrame(() => X().refresh()); return; }
    if (a === 'read' || a === 'peek') { B.step = 'read'; B.reading = d.id; B.readFrom = d.from || null; save(); refreshMap(); drawPanel(); return; }
    if (a === 'back') { B.step = 'files'; B.reading = null; save(); refreshMap(); drawPanel(); return; }
    if (a === 'add') { addFiles([d.id]); return; }
    if (a === 'feeds') { B.step = 'feeds'; B.reading = null; B.readFrom = null; save(); refreshMap(); drawPanel(); return; }
    if (a === 'addfeeds') { const skip = B.skipFeed || {}; addFiles(DATA.order.filter((id) => !isAdded(id) && fileOf(id).scope && !skip[id])); return; }
    if (a === 'go') { B.step = d.to; save(); refreshMap(); drawPanel(); return; }
    if (a === 'history') { B.history = true; B.step = 'rules'; B.said = 'Learned from 184 days'; save(); refreshMap(); drawPanel(); return; }
    if (a === 'rules') { B.rules = true; B.step = 'product'; B.said = `${checkCount()} file checks, ${LIMITS.length} limits and 2 models in use`; save(); refreshMap(); drawPanel(); return; }
    if (a === 'kindmode') { for (const f of B.added.map(fileOf)) { if (!checkOf(f, d.c)) continue; if (d.c === 'links') { for (const j of linksOf(f)) B.linkMode[linkKey(f.id, j.col)] = d.m === 'warn' ? 'new' : d.m === 'pause' ? 'hold' : d.m; delete B.modes[`${f.id}.links`]; } else B.modes[`${f.id}.${d.c}`] = d.m === 'pause' ? (d.c === 'learned' ? 'learn' : 'hold') : d.m; } save(); refreshMap(); drawPanel(true); return; }
    if (a === 'ckrow') { B.ckRow = B.ckRow === d.c ? null : d.c; save(); drawPanel(true); return; } // peer:dq r4
    if (a === 'limitmode') { B.limitMode = d.m === 'pause' ? undefined : d.m; save(); drawPanel(true); return; }
    if (a === 'cellpick') { B.cell = B.cell && B.cell.f === d.f && B.cell.c === d.c ? null : { f: d.f, c: d.c }; B.ckOpen = true; save(); drawPanel(true); return; }
    if (a === 'cellclose') { B.cell = null; save(); drawPanel(true); return; }
    if (a === 'cellmode') { B.modes[`${d.f}.${d.c}`] = d.m === 'pause' ? (d.c === 'learned' ? 'learn' : 'hold') : d.m; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'keymode') { B.linkMode[d.k] = d.m === 'warn' ? 'new' : d.m === 'pause' ? 'hold' : d.m; delete B.modes[`${d.f}.links`]; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'gapmin') { const n = ((B.gapMin || {})[d.k] || 1) + (+d.d); (B.gapMin ||= {})[d.k] = Math.max(1, Math.min(20, n)); save(); refreshMap(); drawPanel(true); return; }
    if (a === 'rowslimf') { const cur = rowsLimitFor(d.f), i0 = ROWS_STEPS.indexOf(cur); (B.rowsLimitOf ||= {})[d.f] = ROWS_STEPS[Math.max(0, Math.min(ROWS_STEPS.length - 1, (i0 < 0 ? 3 : i0) + (+d.d)))]; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'rowslim') { const i0 = ROWS_STEPS.indexOf(rowsLimit()); B.rowsLimit = ROWS_STEPS[Math.max(0, Math.min(ROWS_STEPS.length - 1, (i0 < 0 ? 3 : i0) + (+d.d)))]; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'gapcycle') { const cur = linkModeOf(d.k); B.linkMode[d.k] = { new: 'note', all: 'note', note: 'off', off: 'new', hold: 'new' }[cur] || 'new'; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'myrule-add') { const dr = (B.ruleDraft || {})[d.f] || {}, f = fileOf(d.f), cc = f && f.columns.find((x) => x.name === dr.col); if (!cc) return; const kind = dr.kind || 'oneof', vals = dr.vals ?? (kind === 'oneof' ? (cc.top || []).map(([v]) => v).join(', ') : kind === 'atmost' ? `${(cc.top || [['']])[0][0]}, 10` : ''); ((B.myRules ||= {})[d.f] ||= []).push({ col: dr.col, kind, vals: kind === 'fewblank' ? String(dr.vals ?? (tolOf(d.f, { kind, col: dr.col }) || { p: 5 }).p) : vals, mode: ['hold', 'note'].includes(dr.mode) ? dr.mode : 'warn', at: new Date().toISOString() }); delete B.ruleDraft[d.f]; B.ruleOpen = null; B.said = `Rule added to ${nameOf(d.f)}: ${myRuleSaid(B.myRules[d.f][B.myRules[d.f].length - 1])}`; save(); drawPanel(true); return; }
    if (a === 'rd-mode') { ((B.ruleDraft ||= {})[d.f] ||= {}).mode = d.m; B.ruleOpen = d.f; save(); drawPanel(true); return; }
    if (a === 'rd-tol') { const dr = ((B.ruleDraft ||= {})[d.f] ||= {}); dr.kind = d.k; dr.vals = d.v; B.ruleOpen = d.f; save(); drawPanel(true); return; }
    if (a === 'rd-addvals') { const dr = ((B.ruleDraft ||= {})[d.f] ||= {}), f = fileOf(d.f), cc = f && f.columns.find((x) => x.name === dr.col), cur = dr.vals ?? (cc ? (cc.top || []).map(([v]) => v).join(', ') : ''); dr.vals = [cur, d.v].filter(Boolean).join(', '); B.ruleOpen = d.f; save(); drawPanel(true); return; }
    if (a === 'myrule-mode') { const r = ((B.myRules || {})[d.f] || [])[+d.i]; if (r) { if (d.m === 'off') B.myRules[d.f].splice(+d.i, 1); else r.mode = d.m === 'pause' ? 'hold' : d.m; } syncMine(); save(); refreshMap(); drawPanel(true); return; }
    if (a === 'myrule-off') { const l = (B.myRules || {})[d.f]; if (l) l.splice(+d.i, 1); save(); drawPanel(true); return; }
    if (a === 'opengaps') { const m = document.querySelector('#buildpanel details.bd-more'); if (m) { m.open = true; (m.querySelector('.bd-unacc') || m).scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
    if (a === 'redo') { const l = B.dec[d.day]; if (l && l.length) { l.pop(); if (!l.length) delete B.dec[d.day]; } B.peek = null; save(); refreshMap(); drawPanel(true); X().toast(`${dayLabel(d.day)} waits for your decision again: decide it with the button below.`); return; }
    if (a === 'unapply') { delete B.applied[d.id]; if (B.appliedAt) delete B.appliedAt[d.id]; if (B.chAgreed) delete B.chAgreed[d.id]; if (B.appliedWhy) delete B.appliedWhy[d.id]; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'acceptgap') { (B.knownLater ||= {})[d.k] = { at: new Date().toISOString(), day: d.day }; save(); drawPanel(true); return; }
    if (a === 'known') { B.known = d.none ? { at: new Date().toISOString(), keys: [], declined: true } : { at: new Date().toISOString(), keys: gapsFound().filter((x) => !FINDING[x.key]).map((x) => x.key) }; save(); drawPanel(true); return; }
    if (a === 'known1') { (B.knownLater ||= {})[d.k] = { at: new Date().toISOString(), day: '2024-02-01', note: null }; save(); drawPanel(true); return; }
    if (a === 'gapmode') { B.linkMode[d.k] = d.m === 'warn' ? 'new' : d.m === 'pause' ? 'hold' : d.m; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'outmode') { const m = d.m === 'pause' ? (OWN_CHECKS.has(d.o) ? 'learn' : 'hold') : d.m; (B.outModes ||= {})[d.o] = m; if (m === (OWN_CHECKS.has(d.o) ? 'learn' : 'hold')) delete B.outModes[d.o]; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'steps') { B.stepsOpen = !B.stepsOpen; save(); drawPanel(true); return; }
    if (a === 'calmore') { B.calOpen = !B.calOpen; save(); drawPanel(true); return; }
    if (a === 'cknote') { B.ckNote = B.ckNote === d.c ? null : d.c; save(); drawPanel(true); return; }
    if (a === 'mode') { const f = fileOf(d.f), cur = checkOf(f, d.c), nx = d.c === 'links' ? { warn: 'note', note: 'off', off: 'warn' }[cur] : { hold: 'warn', learn: 'warn', warn: 'note', note: 'off', off: 'hold' }[cur]; B.modes[`${d.f}.${d.c}`] = d.c === 'learned' && nx === 'hold' ? 'learn' : nx; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'product') { B.product = true; B.step = 'days'; B.said = `${FULL.outputs.length} outputs added, ${WATCHED.length + 1} of them watched`; save(); refreshMap(); drawPanel(); return; }
    if (a === 'run') { if (needsYou()) return; const wk0 = issueDays().find((K) => { const s = standing(K); return s?.open && !s.canDecide && !(B.dec[K] || []).length; }); if (wk0 && +d.to > B.day) (B.dec[wk0] ||= []).push({ how: 'wait', note: null, theirs: false, auto: true, at: new Date().toISOString(), on: today() }); const to = d.to != null ? +d.to : B.day + (+d.n || 1); B.day = Math.min(Math.max(0, to < 0 ? dayIdx(LAST) : to), dayIdx(LAST)); B.peek = null; save(); X().closePanel(); if (X().S.level !== 'estate') X().go({ level: 'estate' }); refreshMap(); drawPanel(); return; }
    if (a === 'decide') { const H = needing() || issueDays().find((K) => standing(K)?.open); const id = H ? ISSUES[H].file : null; if (id) { if (B.step === 'end') { B.step = 'days'; save(); drawPanel(); } X().openPanel(id, null, true); } return; }
    if (a === 'chagree') { (B.chAgree ||= {})[d.id] = !B.chAgree[d.id]; save(); drawPanel(true); return; }
    if (a === 'apply' || a === 'skipchange') { const t = document.querySelector(`#buildpanel [data-chwhy="${d.id}"]`); if (t && t.value.trim()) { B.appliedWhy = B.appliedWhy || {}; B.appliedWhy[d.id] = t.value.trim(); } if (a === 'apply' && (B.chAgree || {})[d.id]) (B.chAgreed ||= {})[d.id] = true; }
    if (a === 'apply') { (B.appliedAt ||= {})[d.id] = new Date().toISOString(); B.applied[d.id] = true; B.said = d.id === 'acting-leader' ? 'Added “Acted for by”: from Mon Mar 11, units are acted for by people' : 'Applied: from Mon Mar 25, the web-firewall check pauses at 10%'; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'skipchange') { B.applied[d.id] = 'skip'; save(); refreshMap(); drawPanel(true); return; }
    if (a === 'peekday') { const i = +d.i; B.peek = i === B.day ? null : i; save(); refreshMap(); drawPanel(); return; }
    if (a === 'peek-off') { B.peek = null; save(); refreshMap(); drawPanel(); return; }
    if (a === 'limit') { const from = isoOf(new Date(d.day + 'T12:00:00Z').getTime() + DAY); (B.limits ||= {})[d.k] = { from, max: +d.max, said: `${d.what} at most ${d.max}%` }; B.said = `From ${dayLabel(from)}, ${d.what} warns only above ${d.max}%`; save(); drawPanel(true); return; }
    if (a === 'end') { B.step = 'end'; save(); X().closePanel(); if (X().S.level !== 'estate') X().go({ level: 'estate' }); drawPanel(); return; }
    if (a === 'demo') { location.hash = '#d-access-reviews'; return; }
    if (a === 'openday') { const i = dayIdx(d.day); if (i >= 0) { B.step = 'days'; B.peek = i <= B.day ? i : null; save(); refreshMap(); drawPanel(); } return; }
  }
  function addFiles(ids) {
    for (const id of ids) if (!isAdded(id)) B.added.push(id);
    const f = fileOf(ids[0]), k = kindOfFile(f.id);
    B.said = ids.length > 1 ? `${ids.length} files added` : f.register ? `${nameOfFile(f.id)} added: a new kind, ${kindOf(f.kind).name}` : String(k).startsWith('own:') ? `${nameOfFile(f.id)} added: a kind of its own, ${ownKind(k).name}` : `${nameOfFile(f.id)} added, about ${kindOf(k).name}`;
    B.step = 'files'; B.reading = null; save(); refreshMap(); drawPanel();
    requestAnimationFrame(() => document.querySelectorAll(ids.map((id) => `[data-id="d:${id}"]`).join(',')).forEach((x) => { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); }));
  }
  function refreshMap() { syncMine(); syncModel(); if (X().S.m === 'build') X().refresh(); emptyState(); }
  function mapKey() {
    const c = $('#canvas'); if (!c) return; let el = $('.bmapkey', c);
    const say = X().S.m !== 'build' ? '' : B.step === 'read' || B.step === 'feeds' || B.step === 'files' ? (B.step === 'files' && !nextFile() ? '' : `${B.added.length ? '' : 'A box: a kind of thing · a chip: a file · '}${B.step === 'feeds' ? 'dashed: added when you press Add' : 'dashed: not added yet · grey: named by a file, not read yet'}`.replace(/^d/, 'D')) /* peer:builder */ : B.step === 'history' ? 'On each file: its rows over the 184 days' : B.step === 'rules' ? `On each file, how many of its checks ${PZ2} pause · ◆ warn · ○ note` : B.step === 'product' ? 'On each file: → how many outputs are built from it' : '';
    if (!say) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'bmapkey'; c.append(el); }
    el.innerHTML = say;
  }
  let barH = 0;
  function holdLine() {
    const c = $('#canvas'); if (!c) return; let sv = $('.bhold', c);
    const H = B.step === 'end' ? LAST : dayOnScreen(), s = H && ISSUES[H] ? standing(H) : null, waiting = !!(s && s.open && s.state === 'waiting') && (B.step === 'days' || B.step === 'end') && X().S.m === 'build';
    const ch = waiting ? chainOf(H) : null, bar = $('.bouts', c), g = bar && $('.bo-g.held', bar), chip = ch && c.querySelector(`[data-id="d:${ch.file}"]`);
    if (!(ch && g && chip && bar.offsetParent)) { if (sv) sv.remove(); return; }
    if (!sv) { sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('class', 'bhold'); sv.setAttribute('aria-hidden', 'true'); c.append(sv); }
    const R = c.getBoundingClientRect(), a = chip.getBoundingClientRect(), b = g.getBoundingClientRect();
    if (!a.width || !b.width) { sv.innerHTML = ''; return; }
    const x0 = Math.round(a.right - R.left + 3), y0 = Math.round(a.top + a.height / 2 - R.top) /* peer:design: out of the file's side and down the gap between columns, across no file's name */, x1 = Math.round(b.left + b.width / 2 - R.left), y1 = Math.round(b.top - R.top - 4), ym = Math.round(bar.getBoundingClientRect().top - R.top - 16); // peer:design
    // down out of its own box, along the free margin beside the kinds, then into the held outputs: across no box
    const kinds = [...c.querySelectorAll('[data-id^="k:"]')].map((el) => el.getBoundingClientRect()).filter((q) => q.width), own = kinds.find((q) => a.left >= q.left - 1 && a.right <= q.right + 1 && a.top >= q.top - 1 && a.bottom <= q.bottom + 1);
    const yOut = Math.round((own ? own.bottom : a.bottom) - R.top + 12), left = kinds.length ? Math.round(Math.min(...kinds.map((q) => q.left)) - R.left - 14) : -1, right = kinds.length ? Math.round(Math.max(...kinds.map((q) => q.right)) - R.left + 14) : 1e9;
    const lane = left >= 8 ? left : right <= R.width - 8 ? right : null;
    const pts = lane == null || ym - yOut < 20 ? [[x0, y0], [x0, ym], [x1, ym], [x1, y1]] : [[x0, y0], [x0, yOut], [lane, yOut], [lane, ym], [x1, ym], [x1, y1]];
    const roundPath = (P0, r) => { let dd = `M${P0[0][0]} ${P0[0][1]}`; for (let i = 1; i < P0.length - 1; i++) { const [xa, ya] = P0[i - 1], [xb, yb] = P0[i], [xc, yc] = P0[i + 1], l1 = Math.hypot(xb - xa, yb - ya) || 1, l2 = Math.hypot(xc - xb, yc - yb) || 1, rr = Math.min(r, l1 / 2, l2 / 2); dd += `L${(xb - ((xb - xa) / l1) * rr).toFixed(1)} ${(yb - ((yb - ya) / l1) * rr).toFixed(1)}Q${xb} ${yb} ${(xb + ((xc - xb) / l2) * rr).toFixed(1)} ${(yb + ((yc - yb) / l2) * rr).toFixed(1)}`; } const [xl, yl] = P0[P0.length - 1]; return `${dd}L${xl} ${yl}`; };
    const d = roundPath(pts, 10);
    sv.innerHTML = `<path class="hl-h" d="${d}"/><path class="hl" d="${d}"/><path class="hl-a" d="M${x1 - 5} ${y1 - 7}L${x1} ${y1}L${x1 + 5} ${y1 - 7}"/><circle class="hl-o" cx="${x0}" cy="${y0}" r="3"/>`;
  }
  function holdLineSoon() { cancelAnimationFrame(holdLineSoon.f); holdLineSoon.f = requestAnimationFrame(holdLine); clearTimeout(holdLineSoon.t); holdLineSoon.t = setTimeout(holdLine, 720); if (!holdLineSoon.on) { holdLineSoon.on = true; addEventListener('resize', () => holdLineSoon()); { const ly = document.getElementById('layer'); if (ly) new MutationObserver(() => holdLineSoon()).observe(ly, { childList: true }); } /* peer:owner (r2): the held strip closes up while Decide is open, so the line is drawn again when a panel opens or closes */ const c = $('#canvas'); if (c) { c.addEventListener('transitionend', () => { cancelAnimationFrame(holdLineSoon.f); holdLineSoon.f = requestAnimationFrame(holdLine); }); c.addEventListener('wheel', () => holdLineSoon(), { passive: true }); c.addEventListener('pointerup', () => holdLineSoon()); } } }
  function outputsBar() {
    const c = $('#canvas'); if (!c) return; let el = $('.bouts', c);
    if (!(X().S.m === 'build' && B.product)) { if (el) el.remove(); holdLine(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'bouts'; c.append(el); }
    const H = B.step === 'end' ? LAST : dayOnScreen(), x = H ? DATA.days[dayIdx(H)] : null, s = H && ISSUES[H] ? standing(H) : null, waiting = !!(s && s.open && s.state === 'waiting');
    const heldAll = new Set(waiting ? waitsOf(H) : []), replaced = !!(s && s.replaced);
    const warned = new Set(x && !acceptedSkip(H) && !replaced ? (x.finds || []).filter((f) => !f.file && !heldAll.has(f.source)).map((f) => f.source) : []);
    const shown = [...WATCHED, 'org_chain'].sort((a, b) => (heldAll.has(b) ? 1 : 0) - (heldAll.has(a) ? 1 : 0)), restHeld = [...heldAll].filter((o) => !shown.includes(o)).length;
    const own = new Set(waiting ? (x.holds || []).map((h) => h.replace(/_checked$/, '')) : []);
    const heldIds = [...heldAll], rest = shown.filter((id) => !heldAll.has(id));
    el.innerHTML = `${heldIds.length ? '' : `<b>What readers get${H ? `, ${esc(dShort(H))}` : ''}</b>`}${heldIds.length ? `<span class="bo-row"><span class="bo-g held">${X().HOURGLASS} Held · ${heldIds.length}</span><b class="bo-cap">What readers get${H ? `, ${esc(dShort(H))}` : ''}</b>${heldIds.map((id) => `<span class="bo held" title="${esc(outName(id))}: held${own.has(id) ? ', its own check paused' : ''}">${X().HOURGLASS}${esc(outName(id))}</span>`).join('')}</span><span class="bo-g">Out</span>` : ''}${rest.filter((id) => warned.has(id)).map((id) => `<span class="bo warn" title="${esc(outName(id))}: warned"><i>◆</i>${esc(outName(id))}</span>`).join('')}<span class="bo more">${heldIds.length ? '' : 'All '}${FULL.outputs.length - heldIds.length} published</span>`;
    const h = el.offsetHeight; if (h && Math.abs(barH - h) > 6) { barH = h; requestAnimationFrame(refreshMap); }
    holdLineSoon();
  }
  function emptyState() {
    const c = $('#canvas'); if (!c) return; outputsBar(); mapKey(); let e = $('.bempty', c);
    const M = X().models.build, empty = X().S.m === 'build' && !(M && M.kinds && M.kinds.length);
    document.body.classList.toggle('hasmap', X().S.m === 'build' && B.added.length > 0); { const was = document.body.classList.contains('hasdays'), now = X().S.m === 'build' && B.day >= 0, stepWas = document.body.dataset.bstep; document.body.classList.toggle('hasdays', now); document.body.dataset.bstep = B.step; if (was !== now || stepWas !== B.step) requestAnimationFrame(() => X().refresh()); } document.body.classList.toggle('mapopen', !!B.map);
    if (!empty) { if (e) e.remove(); return; }
    if (!e) { e = document.createElement('div'); e.className = 'bempty'; c.append(e); }
    e.innerHTML = `<div class="be-ghosts" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><b>Nothing here yet</b><span>Each file you read adds the kind of thing it describes, and the links between them, here.</span>`;
  }

  // ---------------------------------------------------------------- in and out of the journey
  function load() {
    const ex = X();
    return Promise.all([DATA ? DATA : fetch('build.json').then((r) => r.json()), ex.models.larkspur ? ex.models.larkspur : fetch('model.json').then((r) => r.json())]).then(([d, f]) => { DATA = d; FULL = f; ex.models.larkspur = f; });
  }
  window.__buildInit = (h) => load().then(() => (h.startsWith('build-at-') ? fetch('seeds/' + h.slice(9) + '.json').then((r) => (r.ok ? r.json() : null)).catch(() => null) : null)).then((seed) => {
    if (!B) B = restore() || fresh();
    if (h === 'build-new') { B = fresh(); save(); }
    if (seed) { B = Object.assign(fresh(), seed); save(); history.replaceState(null, '', '#build'); }
    document.body.classList.add('building');
    ensurePanel(); syncModel();
    return X().switchModel('build', () => Object.assign(X().S, { level: 'estate', kind: null, ds: null })).then(() => { drawPanel(); requestAnimationFrame(() => X().refresh()); });
  });
  window.__buildLeave = () => { document.body.classList.remove('building', 'hasmap', 'hasdays', 'mapopen', 'hasmarks'); $('#buildpanel')?.remove(); $('.bempty')?.remove(); requestAnimationFrame(() => X()?.refresh()); };
  window.__build = { state: () => B, data: () => DATA, drawPanel, act, standing, needsYou };
})();
