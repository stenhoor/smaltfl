// @ts-nocheck: the explorer prototype (tools/explorer/app/explore.js), ported as it was reviewed; its boundary is
// typed in explorer.d.ts.
// The Data model explorer: three levels on one canvas, each node keeping its identity as the view zooms between them.
//   estate   — the kinds of thing and how they relate, every dataset inside the kind it describes
//   kind     — one kind opened to fill the view, its datasets as cards, its neighbours as ports at the edges
//   dataset  — one dataset in the middle with its columns; what it joins to, what it builds, what it is evidence for
export function mountExplorer(root, host) {

  const $ = (s, el = root) => el.querySelector(s);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (n) => (n == null ? '–' : Number(n).toLocaleString('en-US'));
  const P = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    app: P('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/>'),
    org: P('<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/>'),
    person: P('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
    platform: P('<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><circle cx="7.5" cy="7" r=".6"/><circle cx="7.5" cy="17" r=".6"/>'),
    control: P('<path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>'),
    vendor: P('<path d="M4 10l2-5h12l2 5"/><path d="M4 10v9h16v-9"/><path d="M9 19v-5h6v5"/>'),
    contract: P('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'),
    device: P('<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4"/>'),
    account: P('<circle cx="12" cy="9" r="3"/><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 17c.6-2 2.1-3 4-3s3.4 1 4 3"/>'),
    role: P('<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0112 0v3"/><path d="M12 13l-1.5 3h3z"/>'),
    key: P('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M15 8l2 2"/>'),
    db: P('<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>'),
    process: P('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 11l7.4-4M8.3 13l7.4 4"/>'),
    risk: P('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'),
    incident: P('<path d="M12 3a6 6 0 016 6v5l2 3H4l2-3V9a6 6 0 016-6z"/><path d="M10 20a2 2 0 004 0"/>'),
    change: P('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
    policy: P('<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
    location: P('<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    zone: P('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 12h18M12 3v18"/>'),
    cert: P('<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'),
    bug: P('<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M12 7V4M8 11H4M16 11h4M8 15H4M16 15h4M9 4l1.5 2M15 4l-1.5 2"/>'),
    cloud: P('<path d="M7 18h10a4 4 0 00.5-8 5.5 5.5 0 00-10.6 1.5A3.3 3.3 0 007 18z"/>'),
  };
  const canvas = $('#canvas'), stage = $('#stage'), svg = $('#links');
  const S = { m: 'app', level: 'estate', kind: null, ds: null, hover: null, panel: null, ver: 0, reach: false };
  const models = {};
  let M = null, R = new Map(), labels = [], edges = [], estateCache = null;
  const els = new Map();
  const ACRO = /\b(tls|mfa|edr|waf|cmdb|hr|dr|sla|id)\b/gi;
  const plain = (id) => { const t = String(id).replace(/__\d+$/, '').replace(/_/g, ' ').replace(ACRO, (m) => m.toUpperCase()); return t.charAt(0).toUpperCase() + t.slice(1); };
  const kindOf = (id) => M.kinds.find((k) => k.id === id);
  const dsOf = (id) => M.datasets.find((d) => d.id === id);
  const narrow = () => canvas.clientWidth < 760;
  const mctx = document.createElement('canvas').getContext('2d');
  const tw = (t, font) => { mctx.font = font; return mctx.measureText(String(t)).width; };
  const ONTOLOGY = new Set(['owned by', 'reports into', 'led by', 'managed by', 'runs on', 'acted for by', 'works in']);
  const relPairs = () => M.relations.filter((r) => r.from !== r.to);
  const selfShown = () => M.relations.filter((r) => r.from === r.to && ONTOLOGY.has(r.name));
  const neighbours = (k) => [...new Set(relPairs().filter((r) => r.from === k || r.to === k).map((r) => (r.from === k ? r.to : r.from)))];
  const paused = (k) => (kindOf(k)?.datasets || []).map(dsOf).filter((d) => d && d.state === 'waiting');
  const article = (noun) => (/^[aeiou]/i.test(noun) && !/^(uni|use|eu)/i.test(noun) ? 'an ' : 'a ') + noun;
  const nounOf = (kid) => { const K = kindOf(kid); return K.noun || K.name.toLowerCase(); };
  const viaN = (r) => (r.via && r.via.length) || r.joins || 0;
  const passive = (v) => / by$| with$|^found |^(at|in|on|under|about)$/.test(v);
  const PLURAL = { person: 'people', process: 'business processes', cloud: 'cloud resources', zone: 'network zones', account: 'user accounts' };
  const PL = (kid) => PLURAL[kid] || kindOf(kid)?.plural || kid;
  const kindCount = (k, then = ' · ') => (k.count == null ? '' : `${fmt(k.count)} ${k.plural}${then}`); // a kind's count, said only where it is known
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  function plVerb(name) {
    if (name === 'changes') return 'modify';
    if (name === 'affected') return 'affect';
    if (/ by$| with$|^found |^(about|at|in|on|under)$/.test(name) || /^\w+ed( |$)/.test(name)) return 'are ' + name;
    const [w, ...rest] = name.split(' ');
    const base = /ss$/.test(w) ? w : /(ch|sh|x)es$/.test(w) ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;
    return [base, ...rest].join(' ');
  }
  function relView(r) {
    const ex = (r.via || []).length === 1 && r.via[0].ds === 'exceptions' && r.from === 'control';
    if (r.name === 'evidence for') return { from: r.to, to: r.from, verb: 'check' };
    if (r.name === 'about' && ex) return { from: r.to, to: r.from, verb: 'have exceptions to' };
    if (r.name === 'approved by' && ex) return { from: r.to, to: r.from, verb: 'approve exceptions to' };
    if (r.name === 'acted for by') return { from: r.from, to: r.to, verb: 'are acted for by' };
    const one = (r.via || []).length === 1 ? dsOf(r.via[0].ds) : null;
    if (one && r.name !== 'about' && kindOf(r.from)?.dataset !== one.id) return { from: r.from, to: r.to, verb: plVerb(r.name), subj: one.nouns || one.short.toLowerCase() };
    return { from: r.from, to: r.to, verb: plVerb(r.name) };
  }
  function sentence(r, withVia = true) {
    const v = relView(r), since = (r.since ? (r.since ? ` since ${smDay.date(r.since).replace(/^\w+ /, '')}` : '') : r.soon ? ` from ${r.soon}` : '') + (r.proposed ? ' (proposed)' : '');
    const via = withVia && viaParts(r).length ? ' · ' + viaParts(r).filter((x) => !/^since/.test(x)).join(' · ') : '';
    return `${cap(v.subj || PL(v.from))} ${v.verb} ${v.obj || PL(v.to)}${since}${via}`;
  }
  // the same sentence with one kind's name in bold: the kind pointed at, so every sentence on the map says whose it is
  function sentenceHtml(r, focus) {
    const v = relView(r), since = r.since ? (r.since ? ` since ${smDay.date(r.since).replace(/^\w+ /, '')}` : '') : r.soon ? ` from ${r.soon}` : '';
    const noun = (kid, word) => (kid === focus ? `<b>${esc(word)}</b>` : esc(word));
    return `${noun(v.from, cap(v.subj || PL(v.from)))} ${esc(v.verb)} ${v.obj ? esc(v.obj) : noun(v.to, PL(v.to))}${since}`;
  }
  // peer:design: a link said in two to four words, read along its line from the kind on its left, or above it ("an
  // organisational unit is made up of people"); its sentences, and what carries each, are its tip. Each relation has its
  // words both ways; between two kinds, the one first in this list leads.
  const SAY = [['works in', 'works in', 'made up of'], ['owned by', 'owned by', 'owns'], ['runs on', 'runs on', 'hosts'], ['evidence for', 'checks', 'checked by'], ['checks', 'checks', 'checked by'], ['approve exceptions to', 'approves exceptions to', 'exceptions approved by'], ['led by', 'led by', 'leads'], ['tagged with', 'tagged with', 'tagged on'], ['have exceptions to', 'has exceptions to', 'exceptions for'], ['acted for by', 'acted for by', 'acts for'], ['about', 'names', 'named by']];
  const sayOf = (r) => { const v = relView(r), key = /exceptions/.test(v.verb) ? v.verb : r.name, i = SAY.findIndex((s) => s[0] === key); return { r, from: v.from, to: v.to, fwd: i < 0 ? r.name : SAY[i][1], back: i < 0 ? null : SAY[i][2], rank: i < 0 ? SAY.length : i }; };
  const leadOf = (rels) => rels.map(sayOf).sort((x, y) => x.rank - y.rank)[0] || null;
  const sayFrom = (lead, kid) => (lead.from === kid ? lead.fwd : lead.back || lead.fwd);
  function shortOf(e, A, B) {
    const lead = e.rels && leadOf(e.rels); if (!lead || !A || !B) return null;
    const gx = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w)), gy = Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h));
    const first = gx >= gy ? (A.x <= B.x ? e.a : e.b) : (A.y <= B.y ? e.a : e.b);
    return sayFrom(lead, first.slice(2));
  }
  const linkTips = new Map();
  // peer:design r4: a card that goes somewhere when tapped says its sentence in the same tip on hover and focus (data-tipgo)
  const sayTips = new Map(), sayTip = (el, id, t) => { el.removeAttribute('title'); delete el.dataset.tip; if (!t) return; sayTips.set(id, esc(t)); el.dataset.tip = 'say:' + id; el.dataset.tipgo = ''; };
  const linkTipOf = (e) => e.blocks.map((bk) => `<span class="tl">${esc(bk.s)}${bk.via ? `<i>${esc(bk.via)}</i>` : ''}</span>`).join('');
  // words broken into lines no wider than a width, as the browser draws them
  function wrapLines(text, font, width) {
    if (!isFinite(width)) return [text];
    const out = []; let line = '';
    for (const w of String(text).split(' ')) { const next = line ? line + ' ' + w : w; if (line && tw(next, font) > width) { out.push(line); line = w; } else line = next; }
    if (line) out.push(line);
    return out;
  }
  const dsWord = (n) => `${fmt(n)} ${M.dsWord || 'dataset'}${n === 1 ? '' : 's'}`;
  const lineLabel = (r) => (r.label && r.label !== r.name && !r.label.startsWith(r.name) ? r.label : r.name) + (r.since ? ' · since Mar 11' : r.soon ? ` · from ${r.soon}` : '');
  // a kind as a tile: its squares per row at a width, how tall it stands, and where a dataset's square sits on it
  const tilePer = (TW) => Math.max(1, Math.floor((TW - 66) / 11));
  const tileH = (kid, TW) => { const n = kindOf(kid).datasets.length; return 44 + Math.ceil((n + 7) / tilePer(TW)) * 11 + 12 + (selfShown().some((r) => r.from === kid) ? 16 : 0); };
  function squareOf(did, tr) { const d = dsOf(did); if (!d || !tr) return null; const i = kindOf(d.kind).datasets.indexOf(did), per = tilePer(tr.w); if (i < 0) return null; return { x: tr.x + (54 + (i % per) * 11) * tr.s, y: tr.y + (44 + Math.floor(i / per) * 11) * tr.s, w: 8, h: 8, s: 1, o: 1 }; }
  // the datasets of a kind that carry its relations with another, and the kinds a dataset reaches
  const carriers = (A, B) => { const out = new Set(); for (const j of M.joins) { const fa = dsOf(j.from)?.kind, ta = dsOf(j.to)?.kind; if (fa === A && ta === B) out.add(j.from); if (fa === B && ta === A) out.add(j.to); } return out; };
  const reachOf = (ds) => { const out = new Set(); if (!dsOf(ds)) return out; const me = dsOf(ds).kind; for (const j of M.joins) { if (j.from === ds) { const kk = dsOf(j.to)?.kind; if (kk && kk !== me) out.add(kk); } if (j.to === ds) { const kk = dsOf(j.from)?.kind; if (kk && kk !== me) out.add(kk); } } return out; };
  // what a built dataset describes, read from its name: the kind its rows are about, or the file's own check
  const outAbout = (oid) => (M.outputs.find((o) => o.id === oid) || {}).about;
  const outKind = (oid) => { const t = String(oid); const own = M.kinds.find((k) => t.startsWith(k.id + '_out')); if (own) return own.id; if (/_checked$/.test(t)) return 'check'; if (/^context_/.test(t)) return 'context'; if (/^(org_|dim_org|failing_by_unit|leaders)/.test(t)) return M.kinds.some((k) => k.id === 'org_unit') ? 'org_unit' : null; if (/^platform/.test(t)) return 'platform'; if (/(control|coverage|effective|exceptions_register|fact_finding)/.test(t)) return 'control'; if (/^application_out/.test(t)) return 'application'; if (/(app|posture_wide|remediation|shadow|cmdb)/.test(t)) return 'application'; return null; };
  const OUT_GROUP = { check: 'Its own check', context: 'Context' };
  const groupName = (g) => OUT_GROUP[g] || (kindOf(g) ? `About ${PL(g)}` : 'Other');
  function outGroups(list) {
    const groups = new Map(); for (const o of list) { const g = outKind(o.id) || 'other'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(o); }
    const kinds = M.kinds.map((k) => k.id).filter((g) => groups.has(g)).sort((a, b) => groups.get(b).length - groups.get(a).length);
    return ['check', ...kinds, 'context', 'other'].filter((g) => groups.has(g)).map((g) => [g, groups.get(g)]);
  }
  // paused: a disc with two bars cut out of it, in the problem's colour, drawn the same at every size and in every font
  const PZ_D = 'M8 .5a7.5 7.5 0 1 0 0 15A7.5 7.5 0 0 0 8 .5zM4.9 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0zM8.7 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0z';
  const PAUSE = `<svg class="pz" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="${PZ_D}"/></svg>`;
  const pz = (s) => esc(s).replace(/‖/g, PAUSE).replace(/⧗/g, HOURGLASS);
  const STATE_RANK = { waiting: 0, decided: 1, warn: 2 };
  // waiting on the paused file: an hourglass, outlined in grey: another shape, another weight and another colour from the pause
  const HOURGLASS = '<svg class="pz hg" viewBox="0 0 16 16" aria-hidden="true"><path class="hc" d="M3.2 1.6h9.6M3.2 14.4h9.6"/><path d="M4.6 1.6c0 3.6 2.6 4.8 2.6 6.4s-2.6 2.8-2.6 6.4M11.4 1.6c0 3.6-2.6 4.8-2.6 6.4s2.6 2.8 2.6 6.4"/><path class="hs" d="M5.6 13.6c.6-1.9 1.6-2.7 2.4-3.2.8.5 1.8 1.3 2.4 3.2zM6.1 4.4h3.8c-.4.9-1.1 1.5-1.9 2.1-.8-.6-1.5-1.2-1.9-2.1z"/></svg>';
  const PAUSE_W = HOURGLASS;
  let agreeNow = false;
  const outputsWait = (n) => (M.heldWord ? `${n} output${n === 1 ? '' : 's'} held` : `${n} output${n === 1 ? '' : 's'} wait${n === 1 ? 's' : ''}`);
  const CAUSE = '<i class="cw causeo" aria-hidden="true">◆</i>';
  const HALF = '<svg class="half" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1.2a4.8 4.8 0 0 0 0 9.6z" fill="currentColor"/></svg>';
  const waitingDs = () => M.datasets.find((d) => d.state === 'waiting');
  // peer:design: a count is an hourglass and a number; what waits is its tip, on hover, focus or a tap
  const waitBadge = (kid) => { const n = (waitsBy()[kid] || []).length, w0 = waitingDs(); return n && w0 && !M.quietBanner ? `<button type="button" class="kwait" data-tip="wait:${esc(kid)}" aria-expanded="false" aria-label="${outputsWait(n)} on ${esc(w0.short)}: ${n === 1 ? 'it is' : 'they are'} about ${esc(PL(kid))}">${HOURGLASS}<span class="kwn">${n}</span></button>` : ''; };
  function waitsBy() { const w0 = M.datasets.find((d) => d.state === 'waiting'), by = {}; if (!w0) return by; for (const o of M.outputs) if (o.waiting) { let kk = outKind(o.id); if (kk === 'check') kk = w0.kind; if (kk && kk !== 'context') (by[kk] ||= []).push(o); } return by; }
  const decidedDs = () => M.datasets.find((d) => d.state === 'decided');
  const replacedDs = () => M.datasets.find((d) => d.replaced);
  // the day on screen: Wed Mar 27 in the demo, the build's day while building (M.dayCtx)
  const DC0 = { iso: '2024-03-27', today: 'Wed Mar 27', prev: 'Tue Mar 26', wd: 'Wednesday', pwd: 'Tuesday', d: 'Wed 27', pd: 'Tue 26', first: 'Fri Mar 1' };
  const DC = () => ({ ...DC0, ...((M && M.dayCtx) || {}) });
  // the map's day in a phrase: "today" where it is today, else the day ("on Wed 27"): the record runs on past it
  const dW = () => (M && (M.todayIso || M.day) === DC().iso ? 'today' : `on ${DC().d}`);
  // peer:design: the demo's current day said "Today", its date small beside it: one helper for every screen, the data
  // kept in the past. Today is the model's day (Wed Mar 27 in the demo) and, while building, the latest day played.
  //   smDay.is(iso)        whether iso is today
  //   smDay.text(iso, d)   "Today", else the date (or d): plain text, for a heading, a button, a title or aria
  //   smDay.mid(iso, d)    "today" inside a sentence, else the date (or d)
  //   smDay.html(iso, d)   "Today" with the date small after it, else the date (or d), escaped: a label on its own
  //   smDay.small(iso)     the date small, on today only, for after a phrase that begins with smDay.text
  //   smDay.date(iso)      the date as the app says it: Wed Mar 27
  const smDay = {
    now: () => (M ? (M.todayIso !== undefined ? M.todayIso : M.day) || null : null),
    is: (iso) => !!iso && iso === smDay.now(),
    date: (iso) => (iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '') : ''),
    text: (iso, d) => (smDay.is(iso) ? 'Today' : d ?? smDay.date(iso)),
    mid: (iso, d) => (smDay.is(iso) ? 'today' : d ?? smDay.date(iso)),
    html: (iso, d) => (smDay.is(iso) ? `<span class="today">Today <small class="tdate">${esc(smDay.date(iso))}</small></span>` : esc(d ?? smDay.date(iso))),
    small: (iso) => (smDay.is(iso) ? ` <small class="tdate">${esc(smDay.date(iso))}</small>` : ''),
  };
  const issueDs = () => waitingDs() || decidedDs();
  // what a paused file's choices say: the demo's empty file, unless the dataset brings its own issue (the build's days)
  // a tap on the dimmed map beside an open sheet: the sheet closes and what was under the tap still acts
  { root.addEventListener('click', (ev) => { if (!ev.isTrusted || !ev.target.closest || !ev.target.closest('.scrim')) return; const x = ev.clientX, y = ev.clientY; const under = root.elementsFromPoint(x, y).find((el) => !el.closest('[id^="layer"], .scrim, .panel, .vx-ring, .vx-cur, .vx-cap')); const t = under && under.closest('button, a, [data-col], [data-rows], [data-id]'); if (t) setTimeout(() => t.click(), 80); }, true); }
  function issueOf(d) {
    const c = DC(), I0 = (d && d.issue) || {}, n = ((d && d.builds) || []).length, noun = I0.noun || 'reviews';
    const from = I0.fillFrom || c.prev, fromWd = I0.fillFromWd || c.pwd;
    const base = {
      kind: 'empty', why: 'arrived empty', title: `${c.wd}’s file arrived empty`, sub: `0 rows${d && d.rowsUsual ? ` · usually about ${fmt(usualN(d.rowsUsual))}` : ''}`,
      options: ['keep', 'fill', 'wait', 'asis'], suggest: 'keep', sugText: (!d || !d.issue || d.issue.demo) && M.demoSugText ? M.demoSugText : `Keep, not Fill: one whole day, ${c.pwd}’s`, /* peer:design r4: which whole day */ sugEvidence: !d || !d.issue || d.issue.demo ? M.demoSugEvidence || '' : '', sugWord: 'suggested', risky: ['asis'], owes: true, ask: true, fillFrom: from, fillFromD: I0.fillFromD || c.pd, noun,
      pros: { keep: `Readers keep real, checked data: ${c.pwd}’s`, fill: `${c.wd} goes out, with today’s other files`, wait: 'Nothing uncertain goes out', asis: 'Readers see exactly what arrived', accept: 'The new level counts as usual from today', fix: 'Readers see the day as it really was', stay: 'Readers keep what you decided' },
      cons: { keep: `The ${n} outputs show ${c.pwd}, other files included`, fill: `A real ${c.wd} failure wouldn’t show`, wait: `The ${n} outputs keep waiting`, asis: 'Never empty since Aug 1, so this is a fault: failing reviews would show as no data', accept: 'Were it a mistake, it would become the usual', fix: 'None: it passed every check', stay: 'The corrected file waits, unpublished' },
      fileThen: { keep: 'Done for now · reopens if a file comes', fill: 'Done for now · reopens if a file comes', wait: 'Stays on your list', asis: 'Done for now · reopens if a file comes', accept: 'Done with this day', fix: 'Done with this day', stay: 'Stays on your list' },
    };
    return { ...base, ...I0, pros: { ...base.pros, ...(I0.pros || {}) }, cons: { ...base.cons, ...(I0.cons || {}) }, fileThen: { ...base.fileThen, ...(I0.fileThen || {}) } };
  }
  function howOf(d) {
    const c = DC(), I = issueOf(d);
    return {
      keep: { button: `Keep all of ${c.prev}`, pill: `Kept ${c.prev}`, said: `kept ${c.prev}`, what: I.keepWhat || `Readers stay on ${c.pwd}’s results, marked as ${c.pwd}’s. The day counts as decided, so it is off your list until the file comes.`, after: () => I.keepAfter || `Readers see ${c.prev}; nothing left for you until the file comes` },
      fill: { button: `Fill only ${d.short || 'the file'} from ${I.fillFrom}`, pill: `Filled from ${I.fillFrom}`, said: `filled from ${I.fillFrom}`, what: `${c.wd} is published with ${I.fillFrom}’s rows copied in, each marked as filled, and the outputs are rebuilt with them.`, after: () => `${c.wd} goes out with ${I.fillFrom}’s ${I.noun}, marked as filled` },
      wait: { button: 'Wait for the file', pill: null, said: null, what: 'Nothing is published: you keep the day paused, recorded as your choice; its outputs keep waiting, and it stays on your list.', after: (n) => `You keep it paused, recorded: the ${n} outputs keep waiting, and it stays on your list` },
      asis: { button: 'Publish as is', pill: 'Published as is', said: 'published as is', what: I.asisWhat || `${c.wd} is published as it arrived.`, after: () => I.asisAfter || `${c.wd} goes out empty: its ${I.noun} count as no data, not as fails` },
      accept: { button: 'Accept the new level', pill: I.acceptPill || 'New level accepted', said: I.acceptSaid || 'accepted the new level', what: I.acceptWhat || `${c.wd} is published, and its level is the usual one from now on.`, after: () => I.acceptAfter || `${c.wd} goes out, and this level is the usual one from now on` },
      fix: { button: 'Publish the file sent again', pill: 'File sent again', said: 'published the file sent again', what: `The corrected file passed every check: readers see ${c.wd} as it really was.`, after: () => (M.latest && M.latest.iso > c.iso ? `${c.wd}’s corrected file goes out; readers stay on ${M.latest.label}, the latest day` : `Readers see ${c.wd}’s corrected file`) },
      stay: { button: 'Keep what you decided', pill: null, said: 'kept what was decided', what: 'Nothing changes: readers keep what you decided, and the corrected file waits for your OK.', after: () => 'Readers keep what you decided; the corrected file waits' },
    };
  }
  const HOW = new Proxy({}, { get: (_, k) => howOf(issueDs())[k] });
  // whether a choice leaves a file still to come: the late file then waits for your OK
  const owesAfter = (I, k) => k === 'wait' || k === 'keep' || (k === 'fill' && I.owes && I.fillOwes !== false) || (k === 'asis' && I.owes);
  const laterSaid = () => (M.latest && M.latest.iso > DC().iso ? M.latest.label : null);
  const verbFor = (r) => relView(r).verb;
  const viaParts = (r) => {
    const v = r.via || [], cols = [...new Set(v.map((x) => x.col).filter(Boolean))], since = r.since ? `since ${smDay.date(r.since).replace(/^\w+ /, '')}` : null;
    // where several datasets carry it, the register among them is named: the one the others repeat
    const reg = v.find((x) => { const d = dsOf(x.ds); return d && kindOf(d.kind)?.dataset === x.ds; });
    const what = !v.length ? null : v.length === 1 ? `via ${dsOf(v[0].ds)?.short || plain(v[0].ds)}` : reg ? `via ${dsOf(reg.ds).short} and ${v.length - 1} more` : `via ${dsOf(v[0].ds)?.short || plain(v[0].ds)}, ${dsOf(v[1].ds)?.short || plain(v[1].ds)}${v.length > 2 ? ` and ${v.length - 2} more` : ''}`;
    return [what, cols.length === 1 ? `on ${cols[0]}` : null, since].filter(Boolean);
  };
  // what carries a relation, short: the dataset and its column (CMDB +16 · owner_team_id), or the evidence for it
  const carriedBy = (r) => {
    const v = (r.via || []).filter((x) => dsOf(x.ds)); if (!v.length) return '';
    const col = [...new Set(v.map((x) => x.col).filter(Boolean))], one = v.length === 1 ? dsOf(v[0].ds).short : null, ks = [...new Set(v.map((x) => dsOf(x.ds).kind))], kn = ks.length === 1 ? kindOf(ks[0])?.name : null;
    const who = one || `${v.length}${kn ? ' ' + kn : ''} datasets`;
    if (!col.length) return `${who} ${one ? 'is' : 'are'} the evidence`;
    return `${who} ${one ? 'carries' : 'carry'} ${col.length === 1 ? col[0] : col.length + ' columns'}`;
  };
  // the same, short, for a card's own name line: its own datasets carry it
  const carrierOf = (r) => { const v = (r.via || []).filter((x) => dsOf(x.ds)); if (!v.length) return null; const ks = [...new Set(v.map((x) => dsOf(x.ds).kind))], col = [...new Set(v.map((x) => x.col).filter(Boolean))]; return ks.length === 1 ? { kind: ks[0], short: col.length === 1 ? `${v.length} dataset${v.length === 1 ? ' carries' : 's carry'} ${col[0]}` : `${v.length} dataset${v.length === 1 ? ' is' : 's are'} the evidence` } : null; };
  const carriedNames = (r) => { const v = (r.via || []).filter((x) => dsOf(x.ds)); return v.length > 1 ? v.map((x) => dsOf(x.ds).short).join(', ') : ''; };
  const verbOf = (r) => (r.name === 'evidence for' ? `evidence for · ${viaN(r)}` : r.name) + (r.since ? ' · since Mar 11' : '');
  const relLabel = (r) => {
    if (r.label) return r.label;
    if (r.name !== 'about') return r.name;
    const js = M.joins.filter((j) => j.rel === 'about' && dsOf(j.from)?.kind === r.from && dsOf(j.to)?.kind === r.to);
    const names = [...new Set(js.map((j) => dsOf(j.from).short))];
    return names.length === 1 ? `${names[0]} · ${js[0].col}` : `${names.length} datasets · ${js[0]?.col || ''}`;
  };

  // ------------------------------------------------------------------ layouts: each returns rects in screen pixels
  function chipCols(n) { return M.wideChips && n >= 13 ? 5 : n >= 10 ? 4 : n >= 5 ? 2 : 1; }
  function estateWorld(aw, ah) {
    if (estateCache && estateCache.m === S.m && (!aw || (estateCache.aw === aw && estateCache.ah === ah))) return estateCache;
    aw = aw || estateCache?.aw || 1300; ah = ah || estateCache?.ah || 600;
    if (!M.kinds.length) return (estateCache = { m: S.m, aw, ah, rect: {}, box: { x: 0, y: 0, w: 1, h: 1 }, compact: false, area: {} });
    const compact = M.kinds.length > 8, size = {};
    const TW = compact ? Math.min(310, Math.max(232, ...M.kinds.map((k) => 70 + tw(k.name, '600 15px Geist') + (k.count == null ? 0 : tw(fmt(k.count), '400 13px Geist')) + 8 + (paused(k.id).length ? 92 : 0)))) : 0;
    const flagged = (kid) => kindOf(kid).datasets.some((x) => ['waiting', 'warn', 'decided'].includes(dsOf(x).state));
    for (const k of M.kinds) {
      const n = k.datasets.length;
      const extra = selfShown().some((r) => r.from === k.id) ? 22 : 0;
      if (compact) { const per = Math.floor((TW - 66) / 11), rows = Math.ceil((n + 7) / per); size[k.id] = { w: TW, h: 44 + rows * 11 + 12 + (extra ? 16 : 0) + (flagged(k.id) ? 16 : 0) }; }
      else { const c = chipCols(n), r = Math.ceil(n / c), foot = 0; size[k.id] = { w: Math.max(256, 28 + c * 158 + (c - 1) * 8), h: 70 + extra + r * 34 + (r - 1) * 6 + 14 + foot }; }
    }
    const ids = M.kinds.map((k) => k.id);
    const deg = Object.fromEntries(ids.map((id) => [id, neighbours(id).length * 2 + kindOf(id).datasets.length / 8]));
    const hub = ids.slice().sort((a, b) => deg[b] - deg[a])[0];
    const ring = { [hub]: 0 }, order = [hub];
    for (let i = 0; i < order.length; i++) for (const n of neighbours(order[i]).sort((a, b) => deg[b] - deg[a])) if (!(n in ring)) { ring[n] = ring[order[i]] + 1; order.push(n); }
    for (const id of ids) if (!(id in ring)) { ring[id] = 3; order.push(id); }
    const byRing = {}; for (const id of order) (byRing[ring[id]] ||= []).push(id);
    const p = {};
    for (const [r, list] of Object.entries(byRing)) list.forEach((id, i) => { const a = (i / list.length) * Math.PI * 2 - Math.PI / 2 + +r * 0.5; const rad = +r * (compact ? 330 : 470); p[id] = { x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.62 }; });
    const pairs = relPairs();
    const N = 700;
    for (let it = 0; it < N; it++) {
      const t = 1 - it / N, F = Object.fromEntries(ids.map((id) => [id, { x: 0, y: 0 }]));
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = p[ids[i]], b = p[ids[j]], dx = a.x - b.x, dy = a.y - b.y, d = Math.max(40, Math.hypot(dx, dy)), f = (compact ? 70000 : 160000) / (d * d);
        F[ids[i]].x += (dx / d) * f; F[ids[i]].y += (dy / d) * f; F[ids[j]].x -= (dx / d) * f; F[ids[j]].y -= (dy / d) * f;
      }
      for (const r of pairs) {
        const a = p[r.from], b = p[r.to], dx = b.x - a.x, dy = b.y - a.y, d = Math.max(1, Math.hypot(dx, dy));
        const L = (Math.hypot(size[r.from].w, size[r.from].h) + Math.hypot(size[r.to].w, size[r.to].h)) / 2.4 + (compact ? 110 : 150), f = (d - L) * 0.03;
        F[r.from].x += (dx / d) * f; F[r.from].y += (dy / d) * f; F[r.to].x -= (dx / d) * f; F[r.to].y -= (dy / d) * f;
      }
      const flat = 0.004 * Math.max(2.2, (aw / ah) * 1.4);
      for (const id of ids) { F[id].x -= p[id].x * 0.004; F[id].y -= p[id].y * flat; p[id].x += Math.max(-24, Math.min(24, F[id].x)) * t; p[id].y += Math.max(-24, Math.min(24, F[id].y)) * t; }
      for (let k = 0; k < 2; k++) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const A = ids[i], B = ids[j], a = p[A], b = p[B], gap = compact ? 64 : 150;
        const ox = (size[A].w + size[B].w) / 2 + gap - Math.abs(a.x - b.x), oy = (size[A].h + size[B].h) / 2 + gap * 0.7 - Math.abs(a.y - b.y);
        if (ox > 0 && oy > 0) { if (ox / size[A].w < oy / size[A].h) { const s = ((a.x < b.x ? -1 : 1) * ox) / 2; a.x += s; b.x -= s; } else { const s = ((a.y < b.y ? -1 : 1) * oy) / 2; a.y += s; b.y -= s; } }
      }
    }
    let rect = {};
    for (const id of ids) rect[id] = { x: p[id].x - size[id].w / 2, y: p[id].y - size[id].h / 2, w: size[id].w, h: size[id].h };
    if (!compact && ids.length <= 8) rect = M.pinFrom ? pinnedArrange(ids, size, aw, ah) : gridArrange(ids, size, aw, ah);
    let dom = null, cellsOut = null;
    if (M.domains && compact) {
      // each area a block of its kinds, the areas side by side; kinds inside keep the order of their connections
      dom = {};
      const order = ['tech', 'people', 'risk', 'business'].filter((x) => M.domains.some((d) => d.id === x));
      const blocks = order.map((id) => { const ks = M.kinds.filter((k) => k.domain === id).map((k) => k.id).sort((a, b) => (p[a].y - p[b].y) || (p[a].x - p[b].x)); return { id, ks }; });
      const gapX = 40, gapY = 30, GX = 124, GY = 76;
      const inside = (ks) => { const set = new Set(ks), seen = new Set(), out = []; for (const r of relPairs()) if (set.has(r.from) && set.has(r.to)) { const key = [r.from, r.to].sort().join('|'); if (!seen.has(key)) { seen.add(key); out.push([r.from, r.to]); } } return out; };
      const pack = (bk, c) => {
        // the area's kinds on a grid of c columns, placed so the kinds that relate touch: swaps until no swap joins more
        const n = bk.ks.length, rows = Math.ceil(n / c), cells = rows * c, pairs = inside(bk.ks);
        const score = (pos) => { let v = 0; for (const [a, b] of pairs) { const ia = pos[bk.ks.indexOf(a)], ib = pos[bk.ks.indexOf(b)], dr = Math.abs(Math.floor(ia / c) - Math.floor(ib / c)), dc = Math.abs((ia % c) - (ib % c)); v += dr === 1 && dc === 0 ? 1.15 : dr === 0 && dc === 1 ? 0.85 : dr === 1 && dc === 1 ? 0.15 : 0; } for (let i = 0; i < n; i++) v -= pos[i] * 1e-4; return v; };
        let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        let best = null;
        for (let t = 0; t < 14; t++) {
          let pos = [...Array(cells).keys()]; if (t) for (let i = cells - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pos[i], pos[j]] = [pos[j], pos[i]]; } pos = pos.slice(0, n);
          let v = score(pos), better = true;
          while (better) { better = false; for (let i = 0; i < n; i++) for (let cell = 0; cell < cells; cell++) { if (pos[i] === cell) continue; const q = pos.slice(), j = pos.indexOf(cell); if (j >= 0) q[j] = pos[i]; q[i] = cell; const w = score(q); if (w > v + 1e-9) { v = w; pos = q; better = true; } } }
          if (!best || v > best.v + 1e-9) best = { v, pos };
        }
        const rowH = Array(rows).fill(0); bk.ks.forEach((k, i) => { const r = Math.floor(best.pos[i] / c); rowH[r] = Math.max(rowH[r], size[k].h); });
        const used = rowH.map((hh, r) => (hh ? r : -1)).filter((r) => r >= 0), ys = {}; let yy = 46; for (const r of used) { ys[r] = yy; yy += rowH[r] + gapY; }
        const at = {}; bk.ks.forEach((k, i) => { const r = Math.floor(best.pos[i] / c), cc = best.pos[i] % c; at[k] = { x: 22 + cc * (TW + gapX), y: ys[r], r, c: cc }; });
        return { c, at, w: 44 + c * TW + (c - 1) * gapX, h: yy - gapY + 22 };
      };
      const options = blocks.map((bk) => [1, 2, 3, 4].filter((c) => c <= bk.ks.length).map((c) => pack(bk, c)));
      // every choice of columns, order of the areas two to a row, and shift of the narrower row: drawn largest, with as few
      // lines as can be that would have to turn a corner (two areas facing each other are joined by a straight line)
      const dpair = new Map();
      for (const r of relPairs()) { const a2 = kindOf(r.from).domain, b2 = kindOf(r.to).domain; if (a2 && b2 && a2 !== b2) dpair.set([a2, b2].sort().join('|'), true); }
      const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((q) => [x, ...q])));
      const orders = perms(blocks.map((_, i) => i));
      let best = null; const cells = {}; cellsOut = cells;
      const judge = (choice) => {
        for (const ord of orders) {
          const rows = []; for (let r = 0; r < ord.length; r += 2) rows.push(ord.slice(r, r + 2));
          const rw = rows.map((row) => row.reduce((a2, bi) => a2 + choice[bi].w, 0) + (row.length - 1) * GX), rh = rows.map((row) => Math.max(...row.map((bi) => choice[bi].h)));
          const w = Math.max(...rw), h = rh.reduce((a2, x) => a2 + x, 0) + (rows.length - 1) * GY, sc = Math.min(1, aw / w, ah / h);
          const shifts = rows.map((_, r) => [...new Set([0, (w - rw[r]) / 2, w - rw[r]])]);
          const each = (r, xs) => {
            if (r === rows.length) {
              const at = {}; rows.forEach((row, r2) => { let x = xs[r2]; for (const bi of row) { at[bi] = { x0: x, x1: x + choice[bi].w, row: r2 }; x += choice[bi].w + GX; } });
              let turns = 0;
              for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
                if (!dpair.has([blocks[i].id, blocks[j].id].sort().join('|'))) continue;
                const A = at[i], B = at[j];
                if (A.row === B.row) { if (Math.abs(rows[A.row].indexOf(i) - rows[B.row].indexOf(j)) > 1) turns++; continue; }
                if (Math.abs(A.row - B.row) > 1 || Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) < 120) turns++;
              }
              const score = sc - 0.05 * turns;
              if (!best || score > best.score + 1e-4 || (Math.abs(score - best.score) <= 1e-4 && w * h < best.area)) best = { score, area: w * h, rows, xs: xs.slice(), rh, choice: choice.slice() };
              return;
            }
            for (const x of shifts[r]) { xs.push(x); each(r + 1, xs); xs.pop(); }
          };
          each(0, []);
        }
      };
      const tryAll = (i, chosen) => { if (i === blocks.length) return judge(chosen); for (const o of options[i]) { chosen.push(o); tryAll(i + 1, chosen); chosen.pop(); } };
      tryAll(0, []);
      let dy = 0;
      best.rows.forEach((row, r) => {
        let dx = best.xs[r];
        for (const bi of row) { const o = best.choice[bi], bk = blocks[bi]; for (const k of bk.ks) { rect[k] = { x: dx + o.at[k].x, y: dy + o.at[k].y, w: TW, h: size[k].h }; cells[k] = { dom: bk.id, r: o.at[k].r, c: o.at[k].c }; } dom[bk.id] = { x: dx, y: dy, w: o.w, h: o.h }; dx += o.w + GX; }
        dy += best.rh[r] + GY;
      });
    }
    const xs = ids.flatMap((id) => [rect[id].x, rect[id].x + rect[id].w]), ys = ids.flatMap((id) => [rect[id].y, rect[id].y + rect[id].h]);
    // (areas, when there are any, are added to the box below)
    const xs2 = dom ? Object.values(dom).flatMap((r) => [r.x, r.x + r.w]) : [], ys2 = dom ? Object.values(dom).flatMap((r) => [r.y, r.y + r.h]) : [];
    xs.push(...xs2); ys.push(...ys2);
    estateCache = { m: S.m, aw, ah, compact, rect, dom, cells: cellsOut, box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } };
    return estateCache;
  }
  let pinMemo = null;
  function pinnedCells(aw, ah) {
    if (pinMemo && pinMemo.of === M.pinFrom) return pinMemo.cells;
    const keepM = M, keepCache = estateCache; let cells = {};
    try {
      M = keepM.pinFrom; estateCache = null;
      const E = estateWorld(aw, ah), ids = Object.keys(E.rect);
      const cx = [...new Set(ids.map((id) => Math.round(E.rect[id].x + E.rect[id].w / 2)))].sort((a, b) => a - b);
      const cy = [...new Set(ids.map((id) => Math.round(E.rect[id].y + E.rect[id].h / 2)))].sort((a, b) => a - b);
      for (const id of ids) cells[id] = { c: cx.indexOf(Math.round(E.rect[id].x + E.rect[id].w / 2)), r: cy.indexOf(Math.round(E.rect[id].y + E.rect[id].h / 2)) };
    } finally { M = keepM; estateCache = keepCache; }
    pinMemo = { of: M.pinFrom, cells };
    return cells;
  }
  function pinnedArrange(ids, size, aw, ah) {
    const cells = pinnedCells(aw, ah), GX = 150, GY = 104;
    let extra = Math.max(0, ...Object.values(cells).map((x) => x.c)) + 1;
    const at = Object.fromEntries(ids.map((id) => [id, cells[id] || { c: extra++, r: 0 }]));
    const cols = [...new Set(ids.map((id) => at[id].c))].sort((a, b) => a - b), rows = [...new Set(ids.map((id) => at[id].r))].sort((a, b) => a - b);
    const colW = cols.map((c) => Math.max(...ids.filter((id) => at[id].c === c).map((id) => size[id].w))), rowH = rows.map((r) => Math.max(...ids.filter((id) => at[id].r === r).map((id) => size[id].h)));
    const xs = [0], ys = [0];
    for (let i = 1; i < cols.length; i++) xs.push(xs[i - 1] + colW[i - 1] + GX);
    for (let i = 1; i < rows.length; i++) ys.push(ys[i - 1] + rowH[i - 1] + GY);
    const out = {};
    for (const id of ids) { const ci = cols.indexOf(at[id].c), ri = rows.indexOf(at[id].r); out[id] = { x: xs[ci] + (colW[ci] - size[id].w) / 2, y: ys[ri] + (rowH[ri] - size[id].h) / 2, w: size[id].w, h: size[id].h }; }
    return out;
  }
  function gridArrange(ids, size, aw, ah) {
    const n = ids.length, GX = 150, GY = 104, pairs = new Map();
    for (const r of relPairs()) { const key = [r.from, r.to].sort().join('|'); if (!pairs.has(key)) pairs.set(key, []); pairs.get(key).push(lineLabel(r)); }
    const pl = [...pairs].map(([key, labels]) => { const [a, b] = key.split('|'); return { a: ids.indexOf(a), b: ids.indexOf(b), wide: labels.filter((t) => tw(t, '400 12px Geist') + 22 > GX - 16).length }; });
    const shapes = []; for (let rows = 1; rows <= 3; rows++) for (let cols = 1; cols <= 4; cols++) if (rows * cols >= n && rows * cols <= n + 2) shapes.push([rows, cols]);
    let best = null;
    for (const [rows, cols] of shapes) {
      const cells = rows * cols, pos = new Array(n), used = new Array(cells).fill(false);
      const judge = () => {
        const colW = new Array(cols).fill(0), rowH = new Array(rows).fill(0);
        ids.forEach((id, i) => { const c = pos[i] % cols, r = Math.floor(pos[i] / cols); colW[c] = Math.max(colW[c], size[id].w); rowH[r] = Math.max(rowH[r], size[id].h); });
        if (colW.some((x) => !x) || rowH.some((x) => !x)) return;
        const W = colW.reduce((a, b) => a + b, 0) + GX * (cols - 1), H = rowH.reduce((a, b) => a + b, 0) + GY * (rows - 1), sc = Math.min(1, aw / W, ah / H);
        let pen = 0;
        for (const q of pl) {
          const ra = Math.floor(pos[q.a] / cols), ca = pos[q.a] % cols, rb = Math.floor(pos[q.b] / cols), cb = pos[q.b] % cols, dr = Math.abs(ra - rb), dc = Math.abs(ca - cb);
          if (dr + dc === 1) { if (!dr) pen += 0.015 * q.wide; } else if (dr === 1 && dc === 1) pen += 0.06; else pen += 0.2;
        }
        const score = sc - pen;
        if (!best || score > best.score + 1e-6) best = { score, rows, cols, pos: pos.slice(), colW, rowH };
      };
      const place = (i) => { if (i === n) return judge(); for (let c = 0; c < cells; c++) if (!used[c]) { used[c] = true; pos[i] = c; place(i + 1); used[c] = false; } };
      place(0);
    }
    const out = {}, xs = [0], ys = [0];
    for (let c = 1; c < best.cols; c++) xs.push(xs[c - 1] + best.colW[c - 1] + GX);
    for (let r = 1; r < best.rows; r++) ys.push(ys[r - 1] + best.rowH[r - 1] + GY);
    ids.forEach((id, i) => { const c = best.pos[i] % best.cols, r = Math.floor(best.pos[i] / best.cols); out[id] = { x: xs[c] + (best.colW[c] - size[id].w) / 2, y: ys[r] + (best.rowH[r] - size[id].h) / 2, w: size[id].w, h: size[id].h }; });
    return out;
  }
  function layoutEstate(W, H) {
    if (!M.kinds.length) return { nodes: new Map(), edges: [], scroll: H };
    const top = waitingDs() || decidedDs() || replacedDs() || M.reserveTop ? 76 : 20, pad = 36, foot = M.reserveBottom || 0;
    if (narrow()) return stackEstate(W);
    const E = estateWorld(W - pad * 2, H - top - pad - 20), L = new Map();
    const s = Math.min(1, (W - pad * 2) / E.box.w, (H - top - pad - 20 - foot) / E.box.h);
    const ox = (W - E.box.w * s) / 2 - E.box.x * s, oy = top + (H - top - foot - E.box.h * s) / 2 - E.box.y * s;
    for (const k of M.kinds) {
      const r = E.rect[k.id];
      L.set('k:' + k.id, { x: ox + r.x * s, y: oy + r.y * s, w: r.w, h: r.h, s, v: E.compact ? 'kind-compact' : 'kind-estate', o: 1 });
      if (!E.compact) {
        const c = chipCols(k.datasets.length);
        const cw = c === 1 ? r.w - 28 : 158, top = 64 + (selfShown().some((x) => x.from === k.id) ? 22 : 0);
        k.datasets.forEach((d, i) => { const col = i % c, row = Math.floor(i / c); L.set('d:' + d, { x: ox + (r.x + 14 + col * 166) * s, y: oy + (r.y + top + row * 40) * s, w: cw, h: 34, s, v: 'chip', o: 1 }); });
      }
    }
    const E2 = dirEdges(M.relations.filter((r) => r.from !== r.to), (k) => 'k:' + k);
    const busy = E2.length > 14;
    for (const e of E2) { e.hoverOnly = busy; e.lineHover = !!E.dom; e.badge = !!E.dom; }
    if (E.dom) {
      for (const d of M.domains) { const r = E.dom[d.id]; if (r) L.set('dm:' + d.id, { x: ox + r.x * s, y: oy + r.y * s, w: r.w, h: r.h, s, v: 'domain', o: 1, text: d.name }); }
      const pair = new Map();
      for (const r of relPairs()) { const a = kindOf(r.from).domain, b = kindOf(r.to).domain; if (a === b) continue; const key = [a, b].sort().join('|'); pair.set(key, (pair.get(key) || 0) + 1); }
      const sq = (id) => { const r = L.get('dm:' + id); return { x: r.x, y: r.y, w: r.w * r.s, h: r.h * r.s }; };
      const routes = gutterRoutes([...pair.keys()].map((key) => key.split('|').map(sq)));
      [...pair].forEach(([key, n], i) => {
        const [a, b] = key.split('|'), verbs = [...new Set(relPairs().filter((r) => { const x = kindOf(r.from).domain, y = kindOf(r.to).domain; return (x === a && y === b) || (x === b && y === a); }).map((r) => verbFor(r).replace(/^(is|are) /, '')))];
        const across = routes[i].d.split('L').length === 2 && routes[i].d.includes(' ') && Math.abs(+routes[i].d.match(/M[\d.-]+ ([\d.-]+)/)[1] - +routes[i].d.match(/L[\d.-]+ ([\d.-]+)/)[1]) < 1;
        const rs = relPairs().filter((r) => { const x = kindOf(r.from).domain, y = kindOf(r.to).domain; return (x === a && y === b) || (x === b && y === a); });
        const sents = rs.map((r) => sentence(r, false)), shown = sents.slice(0, 2), more = sents.length - shown.length;
        E2.push({ a: 'dm:' + a, b: 'dm:' + b, label: verbs.join(' · '), sents: shown, more, domain: true, bundle: n >= 3, path: routes[i].d, cands: routes[i].cands, opens: [a, b], across });
      });
      if (E.cells) for (const [a, b] of (() => { const seen = new Set(), out = []; for (const r of relPairs()) { const key = [r.from, r.to].sort().join('|'); if (!seen.has(key)) { seen.add(key); out.push([r.from, r.to]); } } return out; })()) {
        const ca = E.cells[a], cb = E.cells[b];
        if (ca && cb && ca.dom === cb.dom && Math.abs(ca.r - cb.r) + Math.abs(ca.c - cb.c) === 1) E2.push({ a: 'k:' + a, b: 'k:' + b, conn: true, sents: relPairs().filter((r) => [r.from, r.to].sort().join('|') === [a, b].sort().join('|')).map((r) => sentence(r, false)) });
      }
    }
    // what the paused file holds up, on the first screen: a red line from it to the datasets that wait
    const wd = M.datasets.find((d) => d.state === 'waiting');

    return { nodes: L, edges: E2, scroll: H };
  }
  function gutterRoutes(list) {
    const out = list.map(() => null), vx = [], hy = [];
    const facing = ([A, B]) => { const ox0 = Math.max(A.x, B.x), ox1 = Math.min(A.x + A.w, B.x + B.w), oy0 = Math.max(A.y, B.y), oy1 = Math.min(A.y + A.h, B.y + B.h); return { ox0, ox1, oy0, oy1 }; };
    list.forEach(([A, B], i) => {
      const { ox0, ox1, oy0, oy1 } = facing([A, B]);
      if (oy1 - oy0 > 40 && ox1 <= ox0) { const [P, Q] = A.x < B.x ? [A, B] : [B, A], y = (oy0 + oy1) / 2, x0 = P.x + P.w, x1 = Q.x; hy.push(y); out[i] = { d: `M${x0} ${y}L${x1} ${y}`, cands: [{ x: (x0 + x1) / 2, y }] }; return; }
      if (ox1 - ox0 > 40) { const [T, U] = A.y < B.y ? [A, B] : [B, A], x = (ox0 + ox1) / 2, y0 = T.y + T.h, y1 = U.y, gy = (y0 + y1) / 2; vx.push(x); out[i] = { d: `M${x} ${y0}L${x} ${y1}`, cands: [{ x, y: gy - 13 }, { x, y: gy + 13 }] }; }
    });
    let lane = 0;
    list.forEach(([A, B], i) => {
      if (out[i]) return;
      const [T, U] = A.y < B.y ? [A, B] : [B, A], y0 = T.y + T.h, y1 = U.y, gy = (y0 + y1) / 2, ly = gy + (lane++ % 2 ? -12 : 12), r = 12;
      const toRight = U.x + U.w / 2 > T.x + T.w / 2;
      const pick = (R0, near) => { const xs = []; for (let x = R0.x + 48; x <= R0.x + R0.w - 48; x += 24) xs.push(x); xs.sort((a, b) => Math.abs(a - near) - Math.abs(b - near)); return xs.find((x) => vx.every((v) => Math.abs(v - x) > 56)) ?? xs[0]; };
      const xa = pick(T, toRight ? T.x + T.w : T.x), xb = pick(U, toRight ? U.x : U.x + U.w), dir = xb > xa ? 1 : -1;
      vx.push(xa, xb);
      const d = `M${xa} ${y0}L${xa} ${ly - r}Q${xa} ${ly} ${xa + dir * r} ${ly}L${xb - dir * r} ${ly}Q${xb} ${ly} ${xb} ${ly + r}L${xb} ${y1}`;
      out[i] = { d, cands: [0.5, 0.35, 0.65, 0.22, 0.78].map((t) => ({ x: xa + (xb - xa) * t, y: ly })) };
    });
    return out;
  }
  // one edge a direction between two kinds, its relations on separate lines; when both directions exist, they bow apart
  // one line a relation; relations between the same two kinds run side by side in lanes, each with its own words
  function dirEdges(rels, id) {
    const byPair = new Map();
    for (const r of rels) {
      const v = relView(r), key = [v.from, v.to].sort().join('|');
      if (!byPair.has(key)) byPair.set(key, { a: id(v.from), b: id(v.to), rels: [], lines: [], sents: [], blocks: [], joins: 0, arrow: false, lanes: 1, lane: 0 });
      const e = byPair.get(key); e.rels.push(r); e.lines.push(sentence(r)); e.sents.push(sentence(r, false)); e.joins += r.joins;
      e.blocks.push({ s: sentence(r, false), via: r.why || r.whyHov || viaParts(r).filter((x) => !/^since/.test(x)).map((x) => x.replace(/^(via|on) /, '$1\u00a0')).join(' · '), why: !!r.why, hov: !r.why && !!r.whyHov }); // peer:builder: a line's columns, shown (why) or when pointed at (whyHov)
    }
    const out = [...byPair.values()];
    for (const e of out) { e.label = e.sents.join('\n'); e.short = null; e.bundle = e.joins >= 5; e.ghost = e.rels.every((r) => r.ghost); }
    return out;
  }
  function stackEstate(W) {
    const L = new Map(); let y = 12; const x = 16, w = W - 32;
    // what needs a look first: the kind with the paused file, then decided, then unusual, then the rest as they are
    const need = (k) => Math.min(...kindOf(k.id).datasets.map((d) => STATE_RANK[dsOf(d).state] ?? 9));
    for (const k of M.kinds.slice().sort((a, b) => need(a) - need(b))) {
      const extra = selfShown().some((r) => r.from === k.id) ? 22 : 0;
      const n = k.datasets.length, c = 2, rows = Math.ceil(n / c), cw = (w - 28 - 8) / 2, h = 70 + extra + rows * 40 + 10;
      const says = neighbours(k.id).map((o) => { const lead = leadOf(relPairs().filter((r) => (r.from === k.id && r.to === o) || (r.from === o && r.to === k.id))); return lead ? `${sayFrom(lead, k.id)} ${PL(o)}` : null; }).filter(Boolean); // peer:design: a link in a few words
      const sh = says.length ? says.length * 18 + 8 : 0;
      L.set('k:' + k.id, { x, y, w, h: h + sh, s: 1, v: 'kind-estate', o: 1, says });
      k.datasets.forEach((d, i) => L.set('d:' + d, { x: x + 14 + (i % c) * (cw + 8), y: y + 64 + extra + sh + Math.floor(i / c) * 40, w: cw, h: 34, s: 1, v: 'chip', o: 1 }));
      y += h + sh + 16;
    }
    return { nodes: L, edges: [], scroll: y + 20 };
  }
  function groupsOf(k) {
    const K = kindOf(k), list = K.datasets.map(dsOf);
    // a file described ahead sits with the register it will join; the rest are evidence where each is a control's
    if (list.length < 4) return [[null, list]];
    const own = !!K.dataset && list[0].id === K.dataset; // a kind with no register on this page (its catalogue not read here) has none to show
    const reg = own ? list[0] : null, key = reg ? (reg.columns.find((c) => c.role === 'key') || {}).name : null;
    if (reg && list.slice(1).some((d) => d.group)) {
      // themes, the biggest first; inside each, what needs a look first, then the largest
      const rank = (d) => (d.state === 'waiting' ? 0 : d.state === 'warn' ? 1 : 2), themes = new Map();
      for (const d of list.slice(1)) { const g = d.group || 'Other'; if (!themes.has(g)) themes.set(g, []); themes.get(g).push(d); }
      for (const l of themes.values()) l.sort((a, b) => rank(a) - rank(b) || (b.rowsToday || 0) - (a.rowsToday || 0));
      return [[`The register: every ${K.noun || K.name.toLowerCase()}`, [reg]], ...[...themes.entries()].sort((a, b) => b[1].length - a[1].length)];
    }
    // the register first; then the evidence, a file for each of the kind's objects (a control's feed, a row an
    // application it checks); then the rest about each object, joined on its key
    const noun = K.noun || K.name.toLowerCase(), rest = reg ? list.slice(1) : list;
    const evid = rest.filter((d) => d.control), other = rest.filter((d) => !d.control);
    // what a row of the evidence is, as most of its files say (a control's feed: a row an application)
    const nouns = evid.map((d) => String(d.one || '').replace(/^one /, '').split(':')[0].trim()).filter(Boolean);
    const rowNoun = nouns.sort((a, b) => nouns.filter((x) => x === b).length - nouns.filter((x) => x === a).length)[0] || '';
    const groups = reg ? [[`The register: every ${noun}`, [reg, ...other.filter((d) => d.awaited)]]] : [];
    if (evid.length) groups.push([`Evidence for each ${noun}${rowNoun && rowNoun !== noun ? ` · a row ${article(rowNoun)}` : ''}`, evid]);
    const plain = other.filter((d) => !d.awaited || !reg);
    if (plain.length) groups.push([`About each ${noun}${key ? ' · joined on ' + key : ''}`, plain]);
    return groups;
  }
  // peer:newcomer (r4) — a neighbour's link said in two to four words from its own side, in design's link words
  // ("owns applications", "hosts applications", "checks applications"); its sentences, and what carries each, on hover;
  // a tap on it still lights the files that carry it. A relation the words can't say from its side keeps its sentence,
  // still without what carries it (that is on hover too).
  function nbPhrase(k, o) {
    const rs = relPairs().filter((r) => (r.from === k && r.to === o) || (r.from === o && r.to === k)), lead = leadOf(rs);
    if (!lead) return null;
    const tip = rs.map((r) => { const v = viaParts(r).filter((x) => !/^since/.test(x)).join(' · '); return sentence(r, false) + (v ? ` (${v})` : ''); }).join('\n');
    return { s: lead.from !== o && !lead.back ? sentence(lead.r, false) : `${sayFrom(lead, o)} ${PL(k)}`, tip, phrase: true };
  }
  // a section's label without "joined on <column>": the column on hover (columns and joins wait for a tap or a hover)
  const groupSaid = (g) => { const m = / · joined on (\S+)$/.exec(g || ''); return m ? { text: g.slice(0, m.index), tip: `Each is joined to the register on ${m[1]}` } : { text: g, tip: '' }; };
  function layoutKind(W, H) {
    const k = S.kind, L = new Map(), E = estateWorld(), nb = neighbours(k), K = kindOf(k);
    const groups = groupsOf(k);
    const edges = dirEdges(relPairs().filter((r) => r.from === k || r.to === k), (x) => 'k:' + x), relOf = {};
    const blocksOf = {};
    for (const e of edges) { const o = e.a === 'k:' + k ? e.b : e.a; relOf[o] = [...(relOf[o] || []), ...e.sents]; blocksOf[o] = [...(blocksOf[o] || []), ...e.blocks]; e.level = true; e.label = null; const cs = [...carriers(k, o.slice(2))]; if (cs.length === 1) e.carrier = cs[0]; }
    if (narrow() || W < 1100) return stackKind(W, groups, nb, relOf);
    const CW = 158, CH = 32, CG = 8, SG = 22, SXG = 28, PAD = 22, HEAD = 86, GAP = 64, TW = 300;
    const saysOf = (o) => { const ph = nbPhrase(k, o); return ph ? [ph] : blocksOf['k:' + o]; }; // peer:newcomer (r4)
    const slotH = (o) => tileH(o, TW) + relsH(saysOf(o), TW) + 6;
    const labW = Math.max(0, ...groups.map(([g, l]) => (g ? tw((groupSaid(g).text + (l.length > 3 ? ` · ${l.length}` : '')).toUpperCase(), '600 11px Geist') * 1.08 + 6 : 0)));
    // the panel: every way of setting its themes in columns, kept to the one that lets the whole view be drawn largest
    const sideH = (list) => list.reduce((a, o) => a + slotH(o) + 12, 0) + 60;
    const half = Math.ceil(nb.length / 2), colNeed = Math.max(sideH(nb.slice(0, half)), sideH(nb.slice(half)));
    let best = null;
    for (const tc of [1, 2, 3]) for (const cc of [2, 3, 4, 5]) {
      if (tc > groups.length) continue;
      const secW = cc * (CW + CG) - CG, pw = tc * secW + (tc - 1) * SXG + 2 * PAD;
      const fits = secW >= labW && pw >= 600;
      const colsY = Array(tc).fill(HEAD), at = [];
      for (const [g, list] of groups) { const hh = (g ? 26 : 0) + Math.ceil(list.length / cc) * (CH + CG) - CG; const ci = colsY.indexOf(Math.min(...colsY)); at.push({ g, list, ci, y: colsY[ci] }); colsY[ci] += hh + SG; }
      const ph = Math.max(...colsY) - SG + PAD, tw2 = pw + 2 * (GAP + TW), th = Math.max(ph, colNeed);
      const sc = Math.min(1.2, (W - 32) / tw2, (H - 24) / th);
      const score = sc - (pw * ph) / 4e7 - (tc - 1) * 0.004 - (fits ? 0 : 1);
      if (!best || score > best.score) best = { score, sc, tc, cc, secW, pw, ph, at, tw2, th };
    }
    const { sc, cc, secW, pw, ph, at, tw2, th } = best;
    const ox = (W - tw2 * sc) / 2 + (GAP + TW) * sc, oy = Math.max(12, (H - th * sc) / 2) + Math.max(0, (th - ph) / 2) * sc;
    const P = (x, y) => ({ x: ox + x * sc, y: oy + y * sc });
    L.set('k:' + k, { ...P(0, 0), w: pw, h: ph, s: sc, v: 'kind-open', o: 1 });
    for (const sec of at) {
      const x0 = PAD + sec.ci * (secW + SXG); let y0 = sec.y;
      if (sec.g) { const gs = groupSaid(sec.g); L.set('g:' + k + ':' + sec.g, { ...P(x0, y0), w: secW, h: 18, s: sc, v: 'group', o: 1, text: gs.text + (sec.list.length > 3 ? ` · ${sec.list.length}` : ''), tip: gs.tip }); y0 += 26; } // peer:newcomer (r4)
      sec.list.forEach((d, i) => L.set('d:' + d.id, { ...P(x0 + (i % cc) * (CW + CG), y0 + Math.floor(i / cc) * (CH + CG)), w: CW, h: CH, s: sc, v: 'chip', o: 1 }));
    }
    // neighbours keep the side they had on the map; on each side grouped by area, in the order the map gives them
    const me = E.rect[k], mcx = me.x + me.w / 2, mcy = me.y + me.h / 2;
    const sides = { left: [], right: [] };
    for (const o of nb) { const r = E.rect[o], dx = r.x + r.w / 2 - mcx, dy = r.y + r.h / 2 - mcy; sides[dx < 0 ? 'left' : 'right'].push({ o, dx, dy }); }
    while (Math.abs(sides.left.length - sides.right.length) > 1) {
      const [from, to] = sides.left.length > sides.right.length ? ['left', 'right'] : ['right', 'left'];
      const i = sides[from].reduce((bi, it, j, a) => (Math.abs(it.dx) < Math.abs(a[bi].dx) ? j : bi), 0);
      sides[to].push(...sides[from].splice(i, 1));
    }
    const domOrder = (M.domains || []).map((d) => d.id);
    for (const [side, list] of Object.entries(sides)) {
      const want = (it) => it.dy / (Math.abs(it.dy) + Math.abs(it.dx) + 1);
      const domAvg = {}; for (const it of list) { const dm = kindOf(it.o).domain || ''; (domAvg[dm] ||= []).push(want(it)); }
      const avg = (dm) => domAvg[dm].reduce((a, b) => a + b, 0) / domAvg[dm].length;
      list.sort((a, b) => { const da = kindOf(a.o).domain || '', db = kindOf(b.o).domain || ''; return da === db ? want(a) - want(b) : avg(da) - avg(db); });
      const items = []; let yy = 0, lastDom = null;
      for (const it of list) {
        const dm = kindOf(it.o).domain;
        if (M.domains && dm !== lastDom) { if (items.length) yy += 14; items.push({ area: dm, y: yy }); yy += 24; lastDom = dm; }
        const sh = slotH(it.o); items.push({ o: it.o, y: yy, h: sh }); yy += sh + 12;
      }
      const colH = yy - 12, y0 = ph / 2 - colH / 2 - Math.max(0, (th - ph) / 2) + Math.max(0, (th - ph) / 2) * 0, x = side === 'left' ? -GAP - TW : pw + GAP;
      for (const it of items) {
        const pos = P(x, Math.max(-(th - ph) / 2, y0) + it.y);
        if (it.area) L.set('a:' + side + ':' + it.area, { ...pos, w: TW, h: 18, s: sc, v: 'area', o: 1, text: M.domains.find((d) => d.id === it.area).name });
        else L.set('k:' + it.o, { ...pos, w: TW, h: it.h, s: sc, v: 'kind-compact', o: 1, rel: relOf['k:' + it.o], says: saysOf(it.o) }); // peer:newcomer (r4)
      }
    }
    return { nodes: L, edges, scroll: H };
  }
  function portHeight(rel, w) { const lines = (rel || []).reduce((a, t) => a + Math.max(1, Math.ceil(tw(t, '500 13px Geist') / (w - 74))), 0); return 46 + Math.max(1, lines) * 16; }
  function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  // how tall a tile's sentences stand: each sentence, then the quieter line of what carries it
  function relsH(blocks, W) { return (blocks || []).reduce((a, b) => a + (typeof b === 'string' ? wrapLines(b, '400 13px Geist', W - 66).length * 16 : wrapLines(b.s, '500 13px Geist', W - 66).length * 16 + (b.via ? wrapLines(b.via, '400 12px Geist', W - 66).length * 15 : 0)) + 4, 0); }
  function stackKind(W, groups, nb, relOf) {
    // peer:newcomer (r4): the kind you opened comes first, its paused file on the first screen; then what it relates to
    const L = new Map(), k = S.kind; let y = 16; const x = 16, w = W - 32, nc = W >= 700 ? 2 : 1, cc = W >= 700 ? 4 : 2, nw = (w - (nc - 1) * 12) / nc;
    const top = y; y += W >= 700 ? 96 : 112;
    const cw = (w - 32 - (cc - 1) * 8) / cc, items = [];
    for (const [g, list] of groups) {
      if (g) { const gs = groupSaid(g), t = gs.text + (list.length > 3 ? ` · ${list.length}` : ''), two = tw(t.toUpperCase(), '600 11px Geist') * 1.08 > w - 32; items.push(['g:' + k + ':' + g, { x: x + 16, y, w: w - 32, h: two ? 36 : 18, s: 1, v: 'group', o: 1, text: t, tip: gs.tip }]); y += two ? 44 : 26; }
      list.forEach((d, i) => items.push(['d:' + d.id, { x: x + 16 + (i % cc) * (cw + 8), y: y + Math.floor(i / cc) * 40, w: cw, h: 32, s: 1, v: 'chip', o: 1 }]));
      y += Math.ceil(list.length / cc) * 40 + 14;
    }
    L.set('k:' + k, { x, y: top, w, h: y - top + 4, s: 1, v: 'kind-open', o: 1 });
    for (const [id, r] of items) L.set(id, r);
    y += 16;
    for (let i = 0; i < nb.length; i += nc) {
      const row = nb.slice(i, i + nc), says = row.map((o) => { const ph = nbPhrase(k, o); return ph ? [ph] : relOf['k:' + o] || []; }), hs = row.map((o, j) => tileH(o, nw) + relsH(says[j], nw) + 6), rh = Math.max(...hs);
      row.forEach((o, j) => { const rel = relOf['k:' + o] || []; L.set('k:' + o, { x: x + j * (nw + 12), y, w: nw, h: nc > 1 ? rh : hs[j], s: 1, v: 'kind-compact', o: 1, rel, says: says[j] }); });
      y += rh + 8;
    }
    return { nodes: L, edges: [], scroll: y + 40 };
  }
  function neighbourhood(id) {
    const d = dsOf(id);
    const out = M.joins.filter((j) => j.from === id && j.to !== id && dsOf(j.to));
    const inc = incOf(d);
    const outs = (d.builds || []).map((o) => M.outputs.find((x) => x.id === o) || { id: o });
    return { d, out, inc, outs };
  }
  // peer:builder — the file's view (r3). First what the file is, its state and one number; then what it links to, each
  // link said by what it means in two to four words with its number (one row per application · CMDB · 100% match;
  // evidence for · Quarterly access review), the full sentence on hover; what uses it as one count with what that
  // means, said once, its list a tap away; its columns a tap away too (S.colsOpen, kept from file to file). No kind
  // tile above it: the trail names the kind, and the file's own link to its register says what one row is.
  const FOLD_H = 40;
  const whatOf = (d) => (d.description ? descOf(d) : ''); // r1: dq's look-inside sentence, so a file reads the same in its preview and its view
  const descLines = (d, fw) => (whatOf(d) ? Math.min(2, wrapLines(whatOf(d), '400 12px Geist', fw - 28).length) : 0);
  const hasNum = (d) => d.rowsToday != null || !!d.awaited;
  const barsOn = (d) => d.rowsToday != null && !!d.rowsUsual; // peer:design r4: today against usual drawn, two rows tall
  // the file's own buttons, as its card draws them
  function fileActs(d) {
    const st = d.state, rows = (t) => (M.noRows ? [] : [[t, 'rows']]);
    if (st === 'waiting') return [...rows(`See ${DC().prev}’s rows`), ['Decide ›', 'decide']];
    if (st === 'decided') return rows('Rows ›');
    if (d.replaced) return rows('Explore rows ›');
    if (d.awaited) return [];
    return rows('Explore rows ›');
  }
  // the state's chip sits beside the name, or with the buttons where the two don't fit on one line (a phone, a long state)
  const chipSaid = (d) => (d.state === 'waiting' ? `Paused ${dW()}` : d.state === 'decided' ? `${HOW[d.how]?.pill || 'Decided'} · file owed` : d.replaced ? 'Corrected file in' : d.state === 'warn' ? `Unusual ${dW()}` : d.awaited ? (d.awaited.length === 10 ? `First file ${smDay.date(d.awaited)}` : 'No file yet') : '');
  const chipW = (d) => tw(chipSaid(d), '600 12px Geist') + 38;
  const chipLow = (d, fw) => !!chipSaid(d) && 36 + tw(d.short, '600 20px Geist') + 8 + chipW(d) > fw - 28;
  const askedSaid = (d) => (d.asked && (d.state === 'waiting' || d.state === 'decided') ? `Asked for the file ${hhmm(d.asked)}` : '');
  // the buttons' rows, packed as the browser wraps them
  const actsRows = (d, fw) => {
    const ask = askedSaid(d), ws = [...(ask ? [tw(ask, '400 12px Geist') + 40] : []), ...fileActs(d).map(([t]) => tw(t, '500 13px Geist') + 28)]; if (!ws.length) return 0;
    let rows = 1, x = 0; for (const w of ws) { if (x && x + 6 + w > fw - 28 - 6) { rows++; x = w; } else x += (x ? 6 : 0) + w; } return rows;
  };
  const headH = (d, fw) => { const L = descLines(d, fw), ar = actsRows(d, fw); return 12 + 28 + (chipLow(d, fw) ? 4 + 24 : 0) + (L ? 4 + L * 16 : 0) + (hasNum(d) ? 4 + (barsOn(d) ? 40 : 18) : 0) + (ar ? 10 + ar * 32 + (ar - 1) * 6 : 0) + 12; };
  // a link, said by what it means: its words, its number, and the whole sentence for hover
  const prevIso = (iso) => new Date(Date.parse(iso + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
  const isoSaid = (iso) => (!iso ? '' : iso === DC().iso ? 'today' : iso === prevIso(DC().iso) ? DC().prev : new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', ''));
  const pctSaid = (m) => { if (!m || !m.rows) return ''; const p = (100 * m.hit) / m.rows; return (p >= 99.95 ? '100' : p >= 99 ? p.toFixed(1) : String(Math.round(p))) + '%'; };
  // what one row of a file is, in a word ("application", "finding"), as its rows entry or the ontology's nouns say
  const rowNounOf = (d) => String(d.one || '').replace(/^one /, '').split(':')[0].trim() || nounOf(d.kind);
  // a relation said of one row: "is owned by", "runs on"; a column that only holds another file's key "names" it
  const rowVerb = (rel) => { if (rel === 'about' || rel === 'in' || rel === 'on') return 'names'; const v = (SAY.find((x) => x[0] === rel) || [rel, rel])[1]; return /\b(by|with|of)$/.test(v) ? 'is ' + v : v; };
  const scopeOf = (d) => (d.one && d.one.includes(':') ? plainScope(d.one.slice(d.one.indexOf(':') + 1).trim()) : null);
  // a link, said as a sentence about one row, the same in the views at either end ("Each application is owned by a
  // unit", "Each row is one application in scope"); the file it points to beneath, with its match
  function linkOf(d, js) {
    const T = dsOf(js[0].to), tk = T.kind, noun = nounOf(tk), rn = rowNounOf(d), per = kindOf(tk).dataset === T.id && rn === noun, scope = per ? scopeOf(d) : null;
    const said = js.map((j) => {
      const eb = per ? `Each row is one ${noun}${scope ? ' in scope' : ''}` : `Each ${rn} ${rowVerb(j.rel)} ${article(noun)}`;
      const m = j.match, pct = pctSaid(m), when = m && m.day && m.day !== DC().iso ? isoSaid(m.day) : '';
      const tip = `${eb}${per ? ` of ${T.short}` : ` in ${T.short}`}, matched on ${j.col}${j.toCol && j.toCol !== j.col ? ' → ' + j.toCol : ''}${pct ? `: ${fmt(m.hit)} of ${fmt(m.rows)} rows ${when ? 'on ' + when : 'today'}` : ''}.${scope ? ` Only ${PL(tk)} ${scope}.` : ''}`;
      return { eb, pct, when, tip };
    });
    return { eb: said.map((x) => x.eb).join(' · '), nm: said[0].pct ? `${said[0].pct} match` : '', nd: said[0].pct && said[0].when ? said[0].when : '', tip: said.map((x) => x.tip).join(' '), icon: kindOf(tk).icon };
  }
  // a file's rows that point to other rows of the same file: another unit, another person
  const selfOf = (d, js) => { const rn = rowNounOf(d), pct = pctSaid(js[0].match); return { eb: js.map((j) => `Each ${rn} ${rowVerb(j.rel)} another ${rn}`).join(' · '), title: `${d.short} · this file`, nm: pct ? `${pct} match` : '', nd: '', tip: js.map((j) => `Each ${rn} ${rowVerb(j.rel)} another ${rn} in ${d.short}, on ${j.col}${j.match && j.match.rows ? `: ${fmt(j.match.hit)} of ${fmt(j.match.rows)} rows` : ''}.`).join(' '), icon: kindOf(d.kind).icon }; };
  const evidenceOf = (d, ev) => { const name = d.controlName || ev.value || dsOf(ev.to).short; return { eb: 'Evidence for the control', title: name, nm: '', tip: `${d.short} is the evidence for the control ${name}: whether each ${rowNounOf(d)} it applies to passes.`, icon: 'control' }; };
  // the files whose rows point to this one, each said as its own view says it ("Each tag names an application"); a
  // control's evidence together, one card for them all ("13 controls check applications")
  function incOf(d) {
    const inc = M.joins.filter((j) => j.to === d.id && j.from !== d.id && dsOf(j.from)), rn = rowNounOf(d), out = [];
    const ev = inc.filter((j) => dsOf(j.from).control), rest = inc.filter((j) => !dsOf(j.from).control);
    if (ev.length) {
      const files = [...new Set(ev.map((j) => j.from))], names = files.map((x) => dsOf(x).short), n = files.length, one = ev.every((j) => j.col == null); // the catalogue's: each file the evidence for one control
      const eb = one ? `${n} file${n === 1 ? ' is' : 's are'} the evidence for ${n === 1 ? 'a control' : PL(d.kind)}` : `${n} control${n === 1 ? ' checks' : 's check'} ${PL(d.kind)}`;
      out.push({ key: 'evidence', eb, title: names.slice(0, 3).join(', ') + (n > 3 ? ` +${n - 3}` : ''), nm: '', nd: '', icon: 'control', list: files, col: (ev.find((j) => j.toCol) || {}).toCol || null, go: { level: 'kind', kind: dsOf(files[0]).kind }, tip: `${eb}: ${names.join(', ')}.` });
    }
    const byFrom = new Map(); for (const j of rest) { if (!byFrom.has(j.from)) byFrom.set(j.from, []); byFrom.get(j.from).push(j); }
    for (const [from, js] of byFrom) {
      const F = dsOf(from), fn = rowNounOf(F), eb = js.map((j) => `Each ${fn} ${rowVerb(j.rel)} ${article(rn)}`).join(' · ');
      out.push({ key: from, eb, title: F.short, nm: '', nd: '', icon: kindOf(F.kind).icon, list: [from], col: js[0].toCol, go: { level: 'dataset', ds: from, kind: F.kind }, tip: `${eb}: ${F.short}, matched on ${js[0].col}${js[0].toCol && js[0].toCol !== js[0].col ? ' → ' + js[0].toCol : ''}.` });
    }
    return out;
  }
  // a link card's height: its sentence on one or two lines, then the file it names
  const LINK_W = 264, cardH = (r, w) => 40 + 16 * Math.min(2, wrapLines(r.eb || '', '400 12px Geist', w - 26).length);
  // what uses the file: one count and what it means, said once; the list a tap away
  function outsSaid(d, list) {
    const n = list.length, w = list.filter((o) => o.waiting).length, wd = waitingDs(), here = !!(wd && wd.id === d.id), pl = (k) => (k === 1 ? '' : 's');
    const rel = list.filter((o) => o.released).length, how = (list.find((o) => o.released) || {}).released, reb = list.filter((o) => o.rebuilt).length, I = issueOf(issueDs() || d);
    const value = 'If this file is wrong, these show wrong numbers';
    if (w && here) return { title: `<span class="oc">${HOURGLASS} ${w === n ? '' : `${w} of `}${n}</span> waiting`, sub: `Readers see ${esc(DC().prev)} until you decide`, more: '', tip: `${w === n ? 'All' : w} of the ${n} output${pl(n)} built from ${d.short} wait for your decision: readers see ${DC().prev} until you decide.` }; // r1: held, not wrong; the banner's words
    if (w) return { title: `Feeds <span class="oc">${n}</span> output${pl(n)}`, sub: `${HOURGLASS} ${w === n ? 'All' : w} held ${dW()} by ${esc(wd ? wd.short : 'another file')}`, more: value, tip: `${n} output${pl(n)} built from ${d.short}. ${value}. Today ${w === n ? 'they wait' : `${w} wait`} on ${wd ? wd.short : 'another file'}.` };
    if (rel && how === 'keep') return { title: `<span class="oc">${HALF} ${rel}</span> output${pl(rel)} stay on ${esc(DC().prev)}`, sub: 'until the corrected file', more: value, tip: `${value}.` };
    if (rel) return { title: `<span class="oc ok">✓ ${rel}</span> output${pl(rel)} published`, sub: how === 'asis' ? (I.kind === 'empty' ? `with no ${esc(I.noun)}` : 'as it arrived') : how === 'accept' ? 'at the new level' : `with ${esc(I.fillFrom)}’s rows, marked filled`, more: value, tip: `${value}.` };
    if (reb) return { title: `<span class="oc ok">✓ ${reb}</span> output${pl(reb)} rebuilt`, sub: `with ${esc(DC().wd)}’s file`, more: value, tip: `${value}.` };
    return { title: `Feeds <span class="oc">${n}</span> output${pl(n)}`, sub: value, more: '', tip: `${n} output${pl(n)} built from ${d.short}. ${value}.` };
  }
  const subLines = (html, w) => wrapLines(plainOf(html), '400 12px Geist', w - 24 - (/<svg/.test(html) ? 18 : 2)).length;
  function outsBox(d, list, w, open) {
    const s = outsSaid(d, list), head = 10 + 20 + 2 + subLines(s.sub, w) * 16 + (open && s.more ? 2 + subLines(s.more, w) * 16 : 0) + 8;
    return { s, h: (open ? head + outGroups(list).length * 26 + list.length * 26 + 8 : head) + 2 }; // and its border
  }
  function layoutDataset(W, H) {
    const { d, out, inc, outs } = neighbourhood(S.ds), L = new Map();
    const open = !!S.colsOpen, fw0 = narrow() ? W - 32 : 460, hh = headH(d, fw0);
    const colsShown = open ? d.columns.slice(0, 12) : [], row1 = open ? firstRowOf(d) : null; // peer:newcomer
    const rowH = colsShown.map((c, i) => (colTwo(c, fw0, row1 ? cvW(cvSaid(c, row1[i])) : undefined) ? 46 : 30));
    const rowY = {}; let acc = hh + FOLD_H + (row1 ? CVH : 0) + 4; colsShown.forEach((c, i) => { rowY[c.name] = acc; acc += rowH[i]; });
    const fh = (open ? acc + 4 + (d.columns.length > 12 ? 30 : 0) : hh + FOLD_H) + 2; // and the card's border
    const byTo = new Map(); for (const j of out) { if (!byTo.has(j.to)) byTo.set(j.to, []); byTo.get(j.to).push(j); }
    const links = [...byTo.values()], self = M.joins.filter((j) => j.from === d.id && j.to === d.id);
    if (narrow()) return stackDataset(W, d, links, inc, outs, fh, self);
    const mid = W < 1180, fw = 460, ev = (links.find((js) => js[0].rel === 'evidence for') || [])[0], lw = mid ? 264 : LINK_W;
    const targets = [...links.filter((js) => js[0].rel !== 'evidence for').map((js) => ({ id: 'd:' + js[0].to, col: js[0].col, k: linkOf(d, js) })), ...(self.length ? [{ id: 'sf:' + d.id, col: self[0].col, k: selfOf(d, self) }] : [])].map((t) => ({ ...t, h: cardH(t.k, lw) }));
    const incs = inc.map((g) => ({ id: 'in:' + d.id + ':' + g.key, col: g.col, k: g, h: cardH(g, lw) }));
    const leftN = targets.length + incs.length + (mid && ev ? 1 : 0), oOpen = S.outsOpen === d.id, ob = outs.length ? outsBox(d, outs, mid ? fw : 300, oOpen) : null;
    let total = Math.max(H, fh + 140);
    const evH = ev ? cardH(evidenceOf(d, ev), 260) : 0, groupH = fh + (ev ? 56 + evH : 0); // the card and the control under it, a little above the middle
    const F = mid ? { x: leftN ? Math.max(16, Math.min(W - fw - 16, lw + 48)) : Math.max(16, Math.round((W - fw) / 2)), y: 40, w: fw, h: fh } : { x: Math.max(lw + 76, Math.round(W * 0.5 - fw / 2 - (outs.length ? 60 : 0))), y: Math.max(32, Math.round((total - groupH) / 2) - 32), w: fw, h: fh };
    L.set('d:' + d.id, { ...F, s: 1, v: 'focus', o: 1, cols: open, hh });
    const left = mid ? 16 : F.x - lw - 60, mid0 = Math.round(hh / 2), at = (c) => (open && rowY[c] != null ? rowY[c] + 15 : mid0);
    // what it links to, each card level with its column where the columns show, the cards never on top of each other;
    // with the columns shut, the whole column of cards centred on the card's head
    const stackH = [...targets, ...incs].reduce((a, t) => a + t.h + 10, -10);
    let below = mid ? F.y : open ? 12 : Math.max(12, F.y + mid0 - stackH / 2);
    const placed = targets.map((t) => ({ ...t, want: open ? F.y + at(t.col) - t.h / 2 : below })).sort((x, y) => x.want - y.want);
    for (const it of placed) { it.y = Math.max(below, it.want); below = it.y + it.h + 10; }
    for (const it of incs) { it.y = Math.max(below, open || mid ? F.y + (targets.length ? 0 : mid0 - it.h / 2) : below); below = it.y + it.h + 10; }
    const over = below - 10 - (Math.max(H, fh + 140) - 12); if (over > 0 && !mid && open) for (const it of [...placed, ...incs]) it.y -= Math.min(over, it.y - 12);
    for (const it of placed) L.set(it.id, { x: Math.max(16, left), y: Math.max(12, it.y), w: lw, h: it.h, s: 1, v: 'nb', o: 1, ...it.k });
    for (const it of incs) L.set(it.id, { x: Math.max(16, left), y: Math.max(12, it.y), w: lw, h: it.h, s: 1, v: 'inc', o: 1, ...it.k });
    total = Math.max(total, below + 24);
    if (ev) {
      const ey = mid ? Math.max(below, F.y + Math.min(fh, hh + FOLD_H) - evH) : F.y + fh + 56;
      L.set('d:' + ev.to, mid ? { x: 16, y: ey, w: lw, h: evH, s: 1, v: 'nb', o: 1, ...evidenceOf(d, ev) } : { x: F.x + fw / 2 - 130, y: ey, w: 260, h: evH, s: 1, v: 'nb', o: 1, ...evidenceOf(d, ev) });
      if (mid) below = ey + evH + 12; else total = Math.max(total, ey + evH + 24);
    }
    if (ob) {
      const gap = Math.max(40, Math.min(90, W - 16 - 300 - F.x - fw)); // as far out as the window lets it, its edge inside the window
      const r = mid ? { x: F.x, y: F.y + fh + 52, w: fw, h: ob.h } : { x: F.x + fw + gap, y: Math.max(12, oOpen ? F.y + (fh - ob.h) / 2 : F.y + mid0 - ob.h / 2), w: 300, h: ob.h };
      L.set('o:' + d.id, { ...r, s: 1, v: 'outs', o: 1, list: outs, open: oOpen });
      total = Math.max(total, r.y + r.h + 32);
    }
    if (mid) total = Math.max(total, below + 24, F.y + fh + 40);
    const edges = [];
    for (const it of placed) edges.push({ a: 'd:' + d.id, b: it.id, aY: at(it.col), aCol: it.col, aSide: 'left', label: null, arrow: false });
    if (ev) edges.push({ a: 'd:' + d.id, b: 'd:' + ev.to, label: null, arrow: false });
    const kc = (d.columns.find((c) => c.role === 'key') || d.columns[0] || {}).name;
    for (const it of incs) { const c = it.col && rowY[it.col] != null ? it.col : kc; edges.push({ a: it.id, b: 'd:' + d.id, bY: at(c), bCol: c, bSide: 'left', label: null, arrow: false }); }
    if (ob) edges.push({ a: 'd:' + d.id, b: 'o:' + d.id, label: null, bad: outs.some((o) => o.waiting) && d.state === 'waiting', arrow: true });
    return { nodes: L, edges, scroll: total };
  }
  // a column's meaning takes a second line where it doesn't fit beside its name and its kind
  const HEAD_H = 114;
  // peer:newcomer — one real row, read down: the day's first row beside each column's meaning, where the model has it
  const CVH = 24;
  const firstRowOf = (d) => (d && (d.sample || []).length && d.rowsToday > 0 && (!d.refDay || !M.day || d.refDay === M.day || d.refDay === 'fixed') ? d.sample[0] : null); // a fixed file's rows are every day's
  const cvNorm = (s) => String(s).replace(/[\s_-]+/g, ' ').trim().toLowerCase();
  const cvSaid = (c, v) => { if (v == null || v === '') return { raw: 'blank', label: '', blank: true }; const L = (c.labels || {})[v]; return { raw: String(v), label: L && cvNorm(L) !== cvNorm(v) ? String(L) : '' }; };
  const cvW = (p) => tw(p.raw, p.blank ? 'italic 400 12px Geist' : '400 12px "Geist Mono"') + (p.label ? tw(' · ' + p.label, '400 12px Geist') : 0);
  const cvMax = (fw) => Math.min(190, Math.round(fw * 0.36));
  // peer:newcomer — who is in a file, in words: "open to the internet or partners, live or retiring", not "exposure: internet or partner"
  const orSaid = (v) => (v.length > 1 ? v.slice(0, -1).join(', ') + ' or ' + v[v.length - 1] : v[0]);
  const plainScope = (s) => s.split(' · ').map((seg) => {
    if (seg === 'keeps data') return 'keeping data';
    const m = seg.match(/^(exposure|lifecycle|tier|data class|hosting) (.+)$/); if (!m) return seg;
    const v = m[2].split(' or ');
    return m[1] === 'exposure' ? 'open to ' + orSaid(v.map((x) => (x === 'internet' ? 'the internet' : x === 'partner' ? 'partners' : x)))
      : m[1] === 'data class' ? 'holding ' + orSaid(v.map((x) => (x === 'confidential' ? 'confidential data' : x))) : m[1] === 'hosting' ? 'hosted ' + orSaid(v.map((x) => (x === 'cloud' ? 'in the cloud' : x))) : orSaid(v);
  }).join(', ');
  // peer:newcomer — outputs held by another file's pause: said once above the list, not "waits" on every line
  const heldElsewhere = (id, outs) => { const wd = waitingDs(); return !!(wd && wd.id !== id && outs.some((o) => o.waiting)); };
  const tyOf = (c) => (c.role === 'key' ? 'key' : c.role === 'date' ? 'date' : c.role === 'number' ? 'number' : c.role === 'category' ? 'code' : 'text');
  function colTwo(c, fw, vw) { const right = vw !== undefined ? Math.min(cvMax(fw), vw) : tw(tyOf(c), '400 12px Geist') + (c.role === 'key' ? 12 : 0); /* peer:newcomer: vw, the day's value's width, as the row's grid lays it out */ const room = fw - 28 - 20 - tw(c.name, '400 13px "Geist Mono"') - right - (vw !== undefined ? 2 : 20); return tw(c.meaning || '', '400 12px Geist') > room; }
  const outsH = (outs, one) => (one ? 42 : 58) + outs.reduce((a, o) => a + (one || !o.about ? 26 : tw(o.about, '400 11px Geist') > 250 ? 54 : 40), 0) + new Set(outs.map((o) => outKind(o.id) || 'other')).size * 26 + 12; // peer:newcomer: one, a line each
  // peer:builder — on a phone, one card under another: the file, what uses it, then what it links to, each saying how
  function stackDataset(W, d, links, inc, outs, fh, self) {
    const L = new Map(); let y = 16; const x = 16, w = W - 32;
    L.set('d:' + d.id, { x, y, w, h: fh, s: 1, v: 'focus', o: 1, cols: !!S.colsOpen, hh: headH(d, w) }); y += fh + 14;
    if (outs.length) { const op = S.outsOpen === d.id, ob = outsBox(d, outs, w, op); L.set('o:' + d.id, { x, y, w, h: ob.h, s: 1, v: 'outs', o: 1, list: outs, open: op }); y += ob.h + 10; }
    const card = (id, v, k) => { const h = cardH(k, w); L.set(id, { x, y, w, h, s: 1, v, o: 1, ...k }); y += h + 10; };
    for (const js of links) card('d:' + js[0].to, 'nb', js[0].rel === 'evidence for' ? evidenceOf(d, js[0]) : linkOf(d, js));
    if (self.length) card('sf:' + d.id, 'nb', selfOf(d, self));
    for (const g of inc) card('in:' + d.id + ':' + g.key, 'inc', g);
    return { nodes: L, edges: [], scroll: y + 30 };
  }
  function layout() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    return S.level === 'estate' ? layoutEstate(W, H) : S.level === 'kind' ? layoutKind(W, H) : layoutDataset(W, H);
  }

  // ------------------------------------------------------------------ painting a node for its role at this level
  const linkHtml = (r, name) => `<span class="eb">${esc(r.eb)}</span><span class="nl"><span class="ki" aria-hidden="true">${ICON[r.icon] || ICON.app}</span><span class="dn">${esc(name)}</span>${r.nm ? `<span class="nm">${esc(r.nm)}${r.nd ? `<span class="nd"> · ${esc(r.nd)}</span>` : ''}</span>` : ''}</span>`; // peer:builder
  function paint(el, id, r) {
    const sig = r.v + (r.sub || '') + (r.text || '') + (r.rel ? r.rel.join() : '') + (r.says ? JSON.stringify(r.says) : '') + (r.eb || '') + (r.nm || '') + (r.nd || '') + (r.title || '') + (r.cols ? '|c' : '') + (r.open ? '|o' : '') + (r.hh || '') + '#' + S.ver; // peer:builder
    if (el.dataset.v === sig) return;
    el.dataset.v = sig;
    const [type, key] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)];
    el.className = 'node';
    if (type === 'k') {
      const k = kindOf(key), bad = paused(key).length, port = r.v === 'kind-port';
      el.classList.add('kind', 'hit'); if (port) el.classList.add('port'); el.classList.toggle('ghost', !!k.ghost); el.classList.toggle('pointed', !!k.pointed); // peer:builder
      if (r.v === 'kind-compact') {
        el.classList.add('compact');
        el.innerHTML = `${waitBadge(k.id)}<div class="khead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><span class="kname">${esc(k.name)}${k.count == null ? '' : ` <span class="kn">${fmt(k.count)}</span>`}</span>${bad ? `<span class="kbad">${PAUSE} ${bad} paused</span>` : ''}</div><div class="mosaic">${k.datasets.map((x) => `<i class="${dsOf(x).state}${r.sub === 'me:' + x ? ' me' : ''}"></i>`).join('')}<span class="mc">${dsWord(k.datasets.length)}</span></div>${(() => { const mb = 44 + Math.ceil((k.datasets.length + 7) / tilePer(r.w)) * 11, self = selfShown().filter((x) => x.from === k.id), stacked = !!(r.says && r.says.length); return self.map((x) => `<div class="kself"${stacked ? ` style="top:${mb + 2}px;bottom:auto"` : ''}>↻ ${esc(x.name)} another ${esc(k.noun || k.name.toLowerCase())}</div>`).join('') + (!stacked && S.level === 'estate' ? (() => { const fl = k.datasets.map(dsOf).filter((x) => ['waiting', 'warn', 'decided'].includes(x.state)); if (!fl.length) return ''; const mark = (x) => (x.state === 'waiting' ? PAUSE : x.state === 'decided' ? HALF : '◆'); return `<div class="kflags" style="top:${mb + 2}px">${fl.slice(0, 2).map((x) => `<span class="${x.state}">${mark(x)} ${esc(x.short)}</span>`).join('')}${fl.length > 2 ? `<span>+${fl.length - 2}</span>` : ''}</div>`; })() : '') + (stacked ? `<div class="krels" style="top:${mb + 4 + (self.length ? 18 : 0)}px">${r.says.map((t) => typeof t === 'string' ? `<span class="ks">${esc(t)}</span>` : t.phrase ? `<button type="button" class="ks kphr" data-carry aria-pressed="${S.pin === id}" title="${esc(t.tip)}">${esc(t.s)}</button>` /* peer:newcomer (r4) */ : `<span class="ks">${esc(t.s)}</span>${t.via ? (S.level === 'kind' ? `<button type="button" class="kv" data-carry aria-pressed="${S.pin === id}" title="${esc([...carriers(S.kind, k.id)].map((x) => dsOf(x)?.short).filter(Boolean).join(', '))}">${esc(t.via)}</button>` : `<span class="kv">${esc(t.via)}</span>`) : ''}`).join('')}</div>` : ''); })()}`;
        el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${k.name}: ${kindCount(k, ', ')}${k.datasets.length} datasets${bad ? `, ${bad} paused` : ''}`);
        return;
      }
      if (r.v === 'kind-open') {
        el.classList.add('open'); el.classList.remove('hit');
        const warn = k.datasets.filter((x) => dsOf(x).state === 'warn').length;
        el.innerHTML = `<div class="ophead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><div class="opt"><div class="oname">${esc(k.name)}</div><div class="osub">${esc(kindCount(k))}${k.datasets.length} datasets</div></div><div class="ostate">${bad ? `<span class="st bad">${PAUSE} ${bad} paused</span>` : ''}${(waitsBy()[k.id] || []).length ? `<button type="button" class="st waits" data-tip="wait:${esc(k.id)}" aria-expanded="false" aria-label="${outputsWait((waitsBy()[k.id] || []).length)} on ${esc(waitingDs()?.short || '')}">${HOURGLASS}<span class="kwn">${(waitsBy()[k.id] || []).length}</span></button>` /* peer:design */ : ''}${warn ? `<span class="st warn">◆ ${warn} unusual</span>` : ''}</div></div>`;
        el.removeAttribute('role'); el.tabIndex = -1; return;
      }
      const wn = (waitsBy()[k.id] || []).length;
      el.innerHTML = `${wn && !port ? waitBadge(k.id) : ''}<div class="khead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><span style="min-width:0;flex:1"><div class="kname">${esc(k.name)}${bad && port && S.level === 'kind' ? ` <span class="kbad sm">${PAUSE} ${bad}</span>` : ''}</div><div class="kcount">${r.rel ? `<span class="krel">${r.rel.map(esc).join('<br>')}</span>` : k.pointed ? `<span class="kpoint">${esc(k.pointed)}</span>` /* peer:builder */ : (k.count == null ? dsWord(k.datasets.length) : `${fmt(k.count)} ${esc(k.plural)}${r.v === 'kind-compact' ? '' : ` · ${dsWord(k.datasets.length)}`}`)}</div></span></div>${!port && r.v !== 'kind-open' ? selfShown().filter((x) => x.from === k.id).map((x) => `<div class="kself" title="${esc(k.name)} ${esc(x.name)} ${esc(k.name)}">↻ ${esc(x.name)} another ${esc(k.noun || k.name.toLowerCase())}</div>`).join('') : ''}${r.says && r.says.length ? `<div class="ksays" style="top:${64 + (selfShown().some((x) => x.from === k.id) ? 22 : 0)}px">${r.says.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}${r.v === 'kind-compact' ? `<div class="mosaic">${k.datasets.map((x) => `<i class="${dsOf(x).state}"></i>`).join('')}<span class="mc">${k.datasets.length} dataset${k.datasets.length === 1 ? '' : 's'}</span></div>` : ''}`;
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${k.name}: ${k.datasets.length} datasets${bad ? `, ${bad} paused` : ''}`);
      if (r.v === 'kind-open') { el.classList.remove('hit'); el.removeAttribute('role'); el.tabIndex = -1; }
    } else if (type === 'd') {
      const d = dsOf(key), st = d.state;
      el.removeAttribute('title'); // peer:builder: a link's sentence stays with the link
      el.classList.add('ds', st); el.classList.toggle('ghost', !!d.ghost); el.classList.toggle('pointed', !!d.pointed); // peer:builder
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${d.short}${st === 'waiting' ? (d.causeOnly ? ', the cause of today’s pause' : ', paused today') : ''}`);
      const tag = st === 'waiting' ? (d.causeOnly ? CAUSE : PAUSE) : st === 'decided' ? HALF : d.replaced ? '✓' : st === 'warn' ? '◆' : d.awaited ? '◌' : '';
      if (st === 'waiting' && d.causeOnly) el.classList.add('cause');
      if (st === 'decided') el.setAttribute('aria-label', `${d.short}, decided for now: ${HOW[d.how]?.said || ''}, corrected file owed`); if (d.replaced) { el.classList.add('fixed'); el.setAttribute('aria-label', `${d.short}, corrected file in`); }
      if (st === 'warn') el.setAttribute('aria-label', `${d.short}, unusual today`);
      if (r.v === 'chip') { el.innerHTML = `<span class="dn">${esc(d.short)}</span>${d.badge ? `<span class="db">${d.badge}</span>` : ''}${tag ? `<span class="dt">${tag}</span>` : ''}`; el.title = `${d.short}${d.description ? ': ' + d.description.replace(/^[^:]*:\s+/, '') : ''}\n${d.rowsToday != null ? `${fmt(d.rowsToday)} rows · ` : ''}${d.columns.length} columns${st === 'waiting' && (d.builds || []).length ? ` · ${d.builds.length} wait on it` : ''}`; }
      else if (r.v === 'card') { el.classList.add('card'); if (r.h < 56) el.classList.add('sm'); const narrowCard = r.w < 200; el.innerHTML = `<span class="dn">${esc(d.short)}</span><span class="dt">${st === 'waiting' ? (narrowCard ? PAUSE : PAUSE + ' Paused') : st === 'warn' ? (narrowCard ? '◆' : '◆ Unusual') : d.awaited ? (narrowCard ? '◌' : '◌ Planned') : ''}</span><span class="dm">${st === 'waiting' && (d.builds || []).length ? `${fmt(d.rowsToday || 0)} rows · <b>holds up ${d.builds.length} outputs</b>` : d.rowsToday != null ? fmt(d.rowsToday) + ' rows · ' + d.columns.length + ' columns' : d.awaited ? (d.awaited && d.awaited.length === 10 ? `first file ${smDay.date(d.awaited)} · ` : 'no file yet · ') + d.columns.length + ' columns' : d.columns.length + ' columns'}</span>`; }
      else if (r.v === 'nb' && r.eb) { el.classList.add('nb', 'lk'); sayTip(el, id, r.tip); /* peer:design r4 */ el.setAttribute('aria-label', `${r.eb}: ${r.title || d.short}${r.nm ? ', ' + r.nm : ''}. ${r.tip || ''}`); el.innerHTML = linkHtml(r, r.title || d.short); } // peer:builder
      else if (r.v === 'nb') { el.classList.add('nb'); el.innerHTML = `<span class="dn">${esc(d.short)}</span><span class="dm">${esc(r.sub || kindOf(d.kind).name)}</span>`; }
      else if (r.v === 'focus') {
        // peer:builder — what it is, its state and one number, its buttons; its columns behind one tap
        el.className = 'node focus' + (st === 'waiting' ? ' waiting' : '');
        const open = !!r.cols, shown = open ? d.columns.slice(0, 12) : [], joinCols = new Set(M.joins.filter((j) => j.from === d.id).map((j) => j.col));
        const ty = (c) => tyFull(c);
        const row1 = open ? firstRowOf(d) : null, cvOf = (c, i) => cvSaid(c, row1[i]); // peer:newcomer: one real row, read down
        const cvTitle = (c, p) => `${c.name} · ${tyFull(c)} · today’s first row: ${p.raw}${p.label ? ` (${p.label})` : ''}`; // the kind of column it replaced, on hover (builder)
        const stateHtml = st === 'waiting' ? `<span class="fs">${PAUSE} Paused ${dW()}</span>` : st === 'decided' ? `<span class="fs owed">${HALF} ${esc(HOW[d.how]?.pill || 'Decided')} · file owed</span>` : d.replaced ? '<span class="fs done">✓ Corrected file in</span>' : st === 'warn' ? `<span class="fs warn">◆ Unusual ${dW()}</span>` : d.awaited ? `<span class="fs aw">◌ ${d.awaited && d.awaited.length === 10 ? `First file ${smDay.date(d.awaited)}` : 'No file yet'}</span>` : '';
        const BTN = { rows: 'btn sm" data-rows', decide: 'btn primary sm" data-decide', undo: 'btn sm" data-undo', replace: 'btn primary sm" data-replace' };
        const L2 = descLines(d, r.w), ar = actsRows(d, r.w), ask = askedSaid(d), n = d.columns.length;
        el.innerHTML = `<div class="fhead" style="height:${r.hh || headH(d, r.w)}px"><div class="ft"><span class="kicon" style="width:28px;height:28px">${ICON[kindOf(d.kind).icon]}</span><span class="fn">${esc(d.short)}</span>${chipLow(d, r.w) ? '' : stateHtml}</div>${chipLow(d, r.w) ? `<div class="fst">${stateHtml}</div>` : ''}${L2 ? `<div class="fd" style="height:${L2 * 16}px;-webkit-line-clamp:${L2}" title="${esc(d.description)}">${esc(whatOf(d))}</div>` : ''}${hasNum(d) ? `<div class="fm${barsOn(d) ? ' fbars' : ''}">${barsOn(d) ? nowBars(d) /* peer:design r4 */ : d.rowsToday != null ? `<b>${fmt(d.rowsToday)}</b> rows ${dW()}` : 'Described ahead of its first file'}</div>` : ''}${ar ? `<div class="fa" style="height:${ar * 32 + (ar - 1) * 6}px">${ask ? `<span class="askd">${esc(ask)}</span>` : ''}<span class="sp"></span>${fileActs(d).map(([t, k]) => `<button class="${BTN[k]}>${esc(t)}</button>`).join('')}</div>` : ''}</div>`
          + `<button type="button" class="fcols" data-cols aria-expanded="${open}"><span>${n} column${n === 1 ? '' : 's'}${open && !row1 ? '<span class="fch"> · tap one for its values</span>' : ''}</span><span class="chev" aria-hidden="true">›</span></button>`
          + (open ? `${row1 ? `<div class="cvhead"><span>Tap a column for all its values</span><span>Today’s first row</span></div>` : ''}<ul class="cols">${shown.map((c, i) => `<li class="col${joinCols.has(c.name) ? ' join' : ''}${colTwo(c, r.w, row1 ? cvW(cvOf(c, i)) : undefined) ? ' two' : ''}" data-col="${esc(c.name)}"><span class="cn">${esc(c.name)}</span><span class="cm">${esc(c.meaning || (c.title && c.title.toLowerCase() !== c.name.replace(/_/g, ' ') ? c.title : ''))}</span>${row1 ? `<span class="cv${c.role === 'key' ? ' k' : ''}${row1[i] == null || row1[i] === '' ? ' blank' : ''}" style="max-width:${cvMax(r.w)}px" title="${esc(cvTitle(c, cvOf(c, i)))}">${esc(cvOf(c, i).raw)}${cvOf(c, i).label ? `<span class="cvl"> · ${esc(cvOf(c, i).label)}</span>` : ''}</span>` : `<span class="ty${c.role === 'key' ? ' kb' : ''}">${ty(c)}</span>`}</li>`).join('')}</ul>${n > 12 ? `<div class="more">and ${n - 12} more columns</div>` : ''}` : '');
        el.removeAttribute('role'); el.tabIndex = -1;
      }
    } else if (type === 'g') { el.className = 'node gname'; el.textContent = r.text; if (r.tip) el.title = r.tip; else el.removeAttribute('title'); /* peer:newcomer (r4) */ }
    else if (type === 'a') { el.className = 'node gname area'; el.textContent = r.text; }
    else if (type === 'dm') { el.className = 'node domain'; el.innerHTML = `<span class="dmn">${esc(r.text)}</span>`; }
    else if (type === 'r') { const d = dsOf(key); el.className = 'node reach'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.innerHTML = `<span class="ri">${HOURGLASS}</span><b>${outputsWait((d.builds || []).length)}</b><span>built from ${esc(d.short)}</span><u>See which ›</u>`; }
    else if (type === 'm') { el.className = 'node more'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.innerHTML = `<b>${esc(r.text)}</b>`; el.setAttribute('aria-label', `${r.text}: ${r.sub}`); }
    else if (type === 'o') {
      // peer:builder — one count and what it means, said once; tapped, the list: each output by name, its line on hover
      const d0 = dsOf(key), s = outsSaid(d0, r.list), allHeld = r.list.every((o) => o.waiting);
      el.className = 'node outs ' + (r.open ? 'open' : 'shut');
      el.innerHTML = `<header><button type="button" class="ohd" data-outs aria-expanded="${!!r.open}" data-tip="say:${esc(id)}" data-tipgo>${sayTips.set(id, esc(s.tip)) && ''}<span class="ot">${s.title}</span><span class="chev" aria-hidden="true">›</span></button><span class="osub">${s.sub}</span>${r.open && s.more ? `<span class="osub then">${s.more}</span>` : ''}</header>`
        + (r.open ? outGroups(r.list).map(([g, l]) => `<div class="og">${esc(groupName(g))}</div><ul>${l.map((o) => `<li class="${o.waiting ? 'w' : o.released === 'keep' ? 'kept' : o.released || o.rebuilt ? 'rel' : ''}"><button type="button" data-out="${esc(o.id)}" title="${esc(o.about || o.id)}${o.waiting ? ` · held ${dW()}` : o.released === 'keep' ? ` · readers stay on ${esc(DC().prev)}` : ''}"><i>${o.waiting && !allHeld ? HOURGLASS : ''}</i><span class="on">${esc(plain(o.id))}</span><span class="go">›</span></button></li>`).join('')}</ul>`).join('') : '');
    } else if (type === 'sf') { el.className = 'node ds nb lk'; sayTip(el, id, r.tip); /* peer:design r4 */ el.innerHTML = linkHtml(r, r.title); // peer:builder: rows that point to rows of the same file
    } else if (type === 'in') {
      // what points to the file, said as the file that points says it; a control's evidence one card for them all
      el.className = 'node ds nb lk'; sayTip(el, id, r.tip); el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-label', `${r.eb}: ${r.title}. ${r.tip || ''}`); el.innerHTML = linkHtml(r, r.title);
    }
  }
  function place(el, r) {
    el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
    el.style.transform = `translate(${r.x}px, ${r.y}px) scale(${r.s})`;
    el.style.setProperty('--ks', r.s); // peer:design: the map's scale, so its words can keep an 11 px floor however far it is shrunk to fit
    el.style.opacity = r.o;
    el.style.transformOrigin = '0 0';
  }

  // ------------------------------------------------------------------ connections, drawn from where the nodes are
  function box(id) { const r = R.get(id); return r ? { x: r.x, y: r.y, w: r.w * r.s, h: r.h * r.s, cx: r.x + (r.w * r.s) / 2, cy: r.y + (r.h * r.s) / 2 } : null; }
  function anchor(b, toward, side, yOff, s) {
    if (side === 'left') return { x: b.x, y: b.y + (yOff ?? b.h / 2) * (s || 1), nx: -1, ny: 0 };
    if (side === 'right') return { x: b.x + b.w, y: b.y + (yOff ?? b.h / 2) * (s || 1), nx: 1, ny: 0 };
    const dx = toward.cx - b.cx, dy = toward.cy - b.cy;
    if (Math.abs(dx) * b.h > Math.abs(dy) * b.w) return dx > 0 ? { x: b.x + b.w, y: b.cy, nx: 1, ny: 0 } : { x: b.x, y: b.cy, nx: -1, ny: 0 };
    return dy > 0 ? { x: b.cx, y: b.y + b.h, nx: 0, ny: 1 } : { x: b.cx, y: b.y, nx: 0, ny: -1 };
  }
  // two boxes: one straight line where they face each other, else out of their facing sides and round the corners
  function laneAnchors(A, B, e) {
    const ox0 = Math.max(A.x, B.x), ox1 = Math.min(A.x + A.w, B.x + B.w), oy0 = Math.max(A.y, B.y), oy1 = Math.min(A.y + A.h, B.y + B.h);
    const n = e.lanes || 1, off = ((e.lane || 0) - (n - 1) / 2) * 12;
    if (oy1 - oy0 >= 24 && ox1 <= ox0) { const y = (oy0 + oy1) / 2 + off, l = A.x < B.x; return [{ x: l ? A.x + A.w : A.x, y, nx: l ? 1 : -1, ny: 0 }, { x: l ? B.x : B.x + B.w, y, nx: l ? -1 : 1, ny: 0 }]; }
    if (ox1 - ox0 >= 24 && oy1 <= oy0) { const x = (ox0 + ox1) / 2 + off, u = A.y < B.y; return [{ x, y: u ? A.y + A.h : A.y, nx: 0, ny: u ? 1 : -1 }, { x, y: u ? B.y : B.y + B.h, nx: 0, ny: u ? -1 : 1 }]; }
    const a = anchor(A, B), b = anchor(B, A);
    if (a.nx) a.y += off; else a.x += off; if (b.nx) b.y += off; else b.x += off;
    return [a, b];
  }
  // a line between two kinds that would pass behind a third goes round it, over the top or under the bottom
  function detourPts(pts, A, B, e) {
    const obs = [...R.keys()].filter((id) => id.startsWith('k:') && id !== e.a && id !== e.b).map(box).filter(Boolean);
    const hits = (p, q, K) => Math.max(p[0], q[0]) > K.x + 2 && Math.min(p[0], q[0]) < K.x + K.w - 2 && Math.max(p[1], q[1]) > K.y + 2 && Math.min(p[1], q[1]) < K.y + K.h - 2;
    const blockers = []; for (let i = 1; i < pts.length; i++) for (const K of obs) if (hits(pts[i - 1], pts[i], K) && !blockers.includes(K)) blockers.push(K);
    if (!blockers.length) return null;
    const all = [A, B, ...blockers], top = Math.min(...all.map((K) => K.y)) - 20, bot = Math.max(...all.map((K) => K.y + K.h)) + 20;
    const route = (y, ay, by) => [[A.cx, ay], [A.cx, y], [B.cx, y], [B.cx, by]];
    const clear = (r) => { for (let i = 1; i < r.length; i++) for (const K of obs) if (hits(r[i - 1], r[i], K)) return false; return true; };
    const up = route(top, A.y, B.y), down = route(bot, A.y + A.h, B.y + B.h);
    return top > 8 && clear(up) ? up : clear(down) ? down : top > 8 ? up : null;
  }
  function orthoPts(a, b) {
    const pts = [[a.x, a.y]];
    if (a.nx && b.nx) { if (Math.abs(a.y - b.y) > 1) { const mx = (a.x + b.x) / 2; pts.push([mx, a.y], [mx, b.y]); } }
    else if (a.ny && b.ny) { if (Math.abs(a.x - b.x) > 1) { const my = (a.y + b.y) / 2; pts.push([a.x, my], [b.x, my]); } }
    else if (a.nx) pts.push([b.x, a.y]); else pts.push([a.x, b.y]);
    pts.push([b.x, b.y]);
    return pts;
  }
  function roundPts(pts, r = 10) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], l1 = Math.hypot(x1 - x0, y1 - y0) || 1, l2 = Math.hypot(x2 - x1, y2 - y1) || 1, rr = Math.min(r, l1 / 2, l2 / 2);
      d += `L${x1 - ((x1 - x0) / l1) * rr} ${y1 - ((y1 - y0) / l1) * rr}Q${x1} ${y1} ${x1 + ((x2 - x1) / l2) * rr} ${y1 + ((y2 - y1) / l2) * rr}`;
    }
    return d + `L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  }
  let grown = [];
  let tipKind = null; // peer:design: the kind whose count the pointer is on: the kind keeps its lines unlit meanwhile
  function drawEdges(enter) {
    if (moving) return;
    const HV = S.hover || S.spotPin, spotOn = S.level === 'estate' && !!HV && !!estateWorld().compact;
    for (const l of labels) l.remove();
    for (const id of grown) { const el = els.get(id), r = R.get(id); if (el) { if (el.classList.contains('grown') && r) el.style.height = r.h + 'px'; el.classList.remove('grown', 'tagged'); el.querySelector('.kname')?.removeAttribute('data-via'); el.querySelector('.kstat')?.remove(); } } grown = [];
    if (enter) { svg.classList.add('drawing'); clearTimeout(drawEdges.t); drawEdges.t = setTimeout(() => svg.classList.remove('drawing'), 900); }
    labels = [];
    const mk = (id, cls) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="${cls}"/></marker>`;
    const parts = [`<defs>${mk('ah', 'ah')}${mk('ahb', 'ah bad')}</defs>`];
    const placedLabels = [];
    const sizeOf = (txt) => { const ls = Array.isArray(txt) ? txt : String(txt || '').split('\n'); return { lw: Math.max(...ls.map((x, i) => tw(x, Array.isArray(txt) && i ? '400 11px Geist' : '500 12px Geist'))) + 22, lh: ls.length * 15 + 8 }; };
    const inter = (q, lw, lh, x0, y0, x1, y1) => { const ix = Math.min(q.x + lw / 2, x1) - Math.max(q.x - lw / 2, x0), iy = Math.min(q.y + lh / 2, y1) - Math.max(q.y - lh / 2, y0); return ix > 0 && iy > 0 ? ix * iy : 0; };
    const CW2 = canvas.clientWidth, CH2 = Math.max(canvas.clientHeight, parseFloat(stage.style.height) || 0);
    const overlap = (q, lw, lh) => { let a = (q.x - lw / 2 < 6 || q.x + lw / 2 > CW2 - 6 || q.y - lh / 2 < 6 || q.y + lh / 2 > CH2 - 6) ? 1e7 : 0; for (const r of R.values()) { if (!r || r.v === 'domain' || r.v === 'area' || r.v === 'group') continue; a += inter(q, lw, lh, r.x - 4, r.y - 4, r.x + r.w * r.s + 4, r.y + r.h * r.s + 4); } for (const p of placedLabels) a += 2 * inter(q, lw, lh, p.x - p.w / 2 - 4, p.y - p.h / 2 - 4, p.x + p.w / 2 + 4, p.y + p.h / 2 + 4); return a; };
    const extra = [];
    if (S.level === 'kind' && S.hoverCard) {
      for (const j of M.joins.filter((x) => x.from === S.hoverCard)) { const kk = dsOf(j.to)?.kind; if (kk && kk !== S.kind && R.has('k:' + kk)) extra.push({ a: 'd:' + S.hoverCard, b: 'k:' + kk, label: j.col ? `${j.col} → ${dsOf(j.to).short}` : j.rel, arrow: true, lit: true }); }
    }
    // at ten times the size, pointing at a kind names its relations on the kinds they reach, no lines across the map
    let tags = new Map(); const spot = new Map();

    // what a paused file touches: the kinds whose built datasets wait, each with how many
    if (S.reach && waitingDs()) {
      const w0 = waitingDs(), by = {};
      for (const o of M.outputs) if (o.waiting) { let kk = outKind(o.id); if (kk === 'check') kk = w0.kind; if (kk && kk !== 'context') (by[kk] ||= []).push(o); }
      for (const [kk, list] of Object.entries(by)) if (R.has('k:' + kk)) { const names = list.map((o) => plain(o.id)); tags.set('k:' + kk, [`⧗ ${list.length} output${list.length === 1 ? '' : 's'} built from ${w0.short} wait${list.length === 1 ? 's' : ''}`, names.slice(0, 3).join(', ') + (names.length > 3 ? ` and ${names.length - 3} more` : '')]); }
    }
    for (const e of [...edges, ...extra]) {
      if (e.badge) {
        if (!HV || (e.a !== HV && e.b !== HV)) continue;
        const other = e.a === HV ? e.b : e.a;
        spot.set(other, [...(spot.get(other) || []), ...e.rels.map((r) => ({ s: sentenceHtml(r, HV.slice(2)), via: carriedBy(r), names: carriedNames(r), carrier: carrierOf(r) }))]);
        continue;
      }
      if (e.lineHover && !(HV && (e.a === HV || e.b === HV))) continue;
      if (e.domain && (HV || (S.reach && estateWorld().compact))) continue;
      const A = box(e.a), B = box(e.b); if (!A || !B) continue;
      if (S.level === 'kind' && S.hoverCard && e.level && !e.lit) continue;
      if (e.conn) {
        // two kinds side by side in an area: a short straight line across the gap between them (the spotlight draws its own)
        if (spotOn || (S.reach && estateWorld().compact)) continue;
        const ox0 = Math.max(A.x, B.x), ox1 = Math.min(A.x + A.w, B.x + B.w), oy0 = Math.max(A.y, B.y), oy1 = Math.min(A.y + A.h, B.y + B.h);
        const d2 = ox1 - ox0 > 10 ? (() => { const [T, U] = A.y < B.y ? [A, B] : [B, A], x = (ox0 + ox1) / 2; return `M${x} ${T.y + T.h}L${x} ${U.y}`; })() : (() => { const [P, Q] = A.x < B.x ? [A, B] : [B, A], y = (oy0 + Math.min(oy1, oy0 + 40)) / 2; return `M${P.x + P.w} ${y}L${Q.x} ${y}`; })();
        const litc = HV && (e.a === HV || e.b === HV) ? ' lit' : '';
        parts.push(`<path class="ln conn${litc}" d="${d2}" pathLength="1"/>`);
        // stacked kinds leave a band wide enough for the sentence: say it there, small, on the line
        if (ox1 - ox0 > 10 && e.sents?.length && !(HV && !litc)) {
          const [T, U, uid] = A.y < B.y ? [A, B, e.b] : [B, A, e.a], band = U.y - (T.y + T.h);
          // the lower kind's badge sits on its top edge: the words keep clear of it
          const nW = (waitsBy()[uid.slice(2)] || []).length, sc2 = R.get(uid)?.s || 1, badgeL = nW ? U.x + U.w - (12 + 20 + tw(`${nW} outputs wait`, '500 12px Geist')) * sc2 - 6 : Infinity;
          const right = Math.min(ox1 - 6, badgeL), left = ox0 - 18, wmax = right - left;
          const txt = e.sents[0] + (e.sents.length > 1 ? ` · +${e.sents.length - 1}` : ''), lw = tw(txt, '500 11px Geist') + 14, fit = lw <= wmax ? txt : null;
          if (fit && band >= 18) { const cx = Math.max(left + lw / 2, Math.min((ox0 + ox1) / 2, right - lw / 2)); const l = document.createElement('div'); l.className = 'lab conn-lab' + (enter ? ' enter' : '') + litc; l.textContent = fit; l.style.left = cx + 'px'; l.style.top = T.y + T.h + band / 2 + 'px'; stage.append(l); labels.push(l); placedLabels.push({ x: cx, y: T.y + T.h + band / 2, w: lw, h: 16 }); }
        }
        continue;
      }
      const hv2 = HV || (S.level === 'kind' ? S.pin : null);
      const lit = e.lit || (hv2 && (e.a === hv2 || e.b === hv2)) ? ' lit' : '';
      const show = e.label && (!e.hoverOnly || lit);
      let d, best = null;
      if (e.path) {
        d = e.path;
        if (show && e.sents) {
          // the sentences of the relations between two areas, broken to fit the gap they sit in, the rest one tap away
          for (const W of e.across ? [104, 140] : [Infinity, 260, 200]) {
            const rows = []; e.sents.forEach((t, i) => { if (i) rows.push(null); for (const x of wrapLines(t, '500 12px Geist', W)) rows.push({ t: x, v: /\(proposed\)/.test(t) ? 3 : 0 }); });
            if (e.more) rows.push({ t: `+${e.more} more ›`, v: 2 });
            const lw = Math.max(...rows.filter(Boolean).map((r) => tw(r.t, '500 12px Geist'))) + 22, lh = rows.reduce((a2, r) => a2 + (r ? 15 : 5), 0) + 8;
            const cs = e.across ? (() => { const c0 = e.cands[0], out = [c0]; for (let k2 = 1; k2 < 6; k2++) out.push({ x: c0.x, y: c0.y - k2 * 24 }, { x: c0.x, y: c0.y + k2 * 24 }); return out; })() : e.cands;
            for (const q of cs) { const a2 = overlap(q, lw, lh); if (!best || a2 < best.a) best = { ...q, a: a2, rows, lw, lh }; if (a2 === 0) break; }
            if (best.a === 0) break;
          }
        } else if (show) { const { lw, lh } = sizeOf(e.label); for (const q of e.cands) { const a = overlap(q, lw, lh); if (!best || a < best.a) best = { ...q, a, txt: e.label, lw, lh }; if (a === 0) break; } }
      } else {
        let aSide = e.aSide, aY = e.aY, bSide = e.bSide, bY = e.bY;
        const rowAt = (nid, col) => { const li = els.get(nid)?.querySelector(`[data-col="${col}"]`); return li ? li.offsetTop + li.offsetHeight / 2 : null; };
        if (e.aCol) aY = rowAt(e.a, e.aCol) ?? aY; if (e.bCol) bY = rowAt(e.b, e.bCol) ?? bY;
        let a, b;
        if (aSide || bSide) { a = anchor(A, B, aSide, aY, 1); b = anchor(B, A, bSide, bY, 1); if (!bSide && a.nx) b = B.x > a.x ? { x: B.x, y: B.cy, nx: -1, ny: 0 } : { x: B.x + B.w, y: B.cy, nx: 1, ny: 0 }; if (!aSide && b.nx) a = A.x > b.x ? { x: A.x, y: A.cy, nx: -1, ny: 0 } : { x: A.x + A.w, y: A.cy, nx: 1, ny: 0 }; }
        else [a, b] = laneAnchors(A, B, e);
        if (e.carrier && S.level === 'kind' && !narrow()) {
          const C = box('d:' + e.carrier), panelIsA = R.get(e.a)?.v === 'kind-open', P = panelIsA ? A : B, Nb = panelIsA ? B : A;
          if (C) { const left = Nb.cx < P.cx, y1 = Math.max(Nb.y + 14, Math.min(Nb.y + Nb.h - 14, C.cy)); const pa = { x: left ? P.x : P.x + P.w, y: C.cy, nx: left ? -1 : 1, ny: 0 }, na = { x: left ? Nb.x + Nb.w : Nb.x, y: y1, nx: left ? 1 : -1, ny: 0 }; [a, b] = panelIsA ? [pa, na] : [na, pa]; }
        }
        let pts = orthoPts(a, b);
        if (S.level === 'estate') pts = detourPts(pts, A, B, e) || pts;
        d = roundPts(pts);
        // places along the line for its words: the middle of its longest run first, then along its length
        const segs = []; let total = 0; for (let i = 1; i < pts.length; i++) { const L2 = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push({ p: pts[i - 1], q: pts[i], L: L2, at: total }); total += L2; }
        const atLen = (t) => { let rem = t * total; for (const g of segs) { if (rem <= g.L || g === segs[segs.length - 1]) { const f = g.L ? Math.min(1, rem / g.L) : 0; return { x: g.p[0] + (g.q[0] - g.p[0]) * f, y: g.p[1] + (g.q[1] - g.p[1]) * f, h: g.p[1] === g.q[1] }; } rem -= g.L; } return { x: b.x, y: b.y, h: true }; };
        const longest = segs.reduce((m, g) => (g.L > m.L ? g : m), segs[0]);
        const cands = [{ x: (longest.p[0] + longest.q[0]) / 2, y: (longest.p[1] + longest.q[1]) / 2, h: longest.p[1] === longest.q[1] }, ...[0.5, 0.36, 0.64, 0.24, 0.76, 0.15, 0.85, 0.3, 0.7, 0.1, 0.9].map(atLen)];
        const side = (e.lanes || 1) > 1 ? Math.sign((e.lane || 0) - ((e.lanes || 1) - 1) / 2) : 0;
        const ekey = e.a + '|' + e.b, quiet = S.level === 'estate' && !lit && !(S.viaOn || new Set()).has(ekey); // peer:builder: a why shows always, a whyHov when pointed at (below)
        const few = quiet && e.blocks ? shortOf(e, A, B) : null; // peer:design: at rest a link is its few words, pointed at its sentences
        if (show && e.blocks) for (const W of [Infinity, 230, 170, 128, 100]) {
          const rows = [];
          if (few) { rows.push({ t: few, v: 0 }); const lead = leadOf(e.rels); e.blocks.forEach((bk, i) => { if (!(bk.why && bk.via)) return; if (e.rels[i] !== lead.r) for (const t of wrapLines(bk.s, '500 12px Geist', W)) rows.push({ t, v: 0 }); for (const t of wrapLines(bk.via, '400 11px Geist Mono', W)) rows.push({ t, v: 4 }); }); } else // peer:design: what reading a file shows stays under them, with its own relation where another leads
          e.blocks.forEach((bk, i) => { if (i) rows.push(null); for (const t of wrapLines(bk.s, '500 12px Geist', W)) rows.push({ t, v: 0 }); const v = !bk.via ? 0 : bk.why ? 4 : bk.hov ? (quiet ? 5 : 4) : quiet || (S.level === 'estate' && !(S.viaOn || new Set()).has(ekey)) ? 0 : 1; /* peer:newcomer (r4): pointed at, a link is its sentences; what carries it on a tap */ if (v) for (const t of wrapLines(bk.via, v >= 4 ? '400 11px Geist Mono' : '400 11px Geist', W)) rows.push({ t, v }); }); // peer:builder: columns in mono; 5 shows when pointed at
          const lw = Math.max(...rows.filter(Boolean).map((r) => tw(r.t, r.v >= 4 ? '400 11px Geist Mono' : r.v ? '400 11px Geist' : '500 12px Geist'))) + 22, lh = rows.reduce((a, r) => a + (r ? 15 : 5), 0) + 8;
          for (const c of cands) { const q = { x: c.x, y: c.y }, ov = overlap(q, lw, lh); if (!best || ov < best.a - 1) best = { ...q, a: ov, rows, lw, lh, few }; if (ov === 0) break; }
          if (best.a === 0) break;
        }
        const texts = e.blocks ? [] : e.via && e.via.length && !quiet ? [[e.label, e.via.join(' · ')], [e.label, ...e.via], [e.label]] : [[e.label]];
        if (show) for (const txt of texts) {
          const { lw, lh } = sizeOf(txt);
          for (const c of cands) { const q = { x: c.x + (c.h ? 0 : side * (lw / 2 + 6)), y: c.y + (c.h ? side * (lh / 2 + 6) : 0) }, ov = overlap(q, lw, lh); if (!best || ov < best.a - 1) best = { ...q, a: ov, txt, lw, lh }; if (ov === 0) break; }
          if (best.a === 0) break;
        }
      }
      parts.push(`<path class="ln${e.bundle ? ' bundle' : ''}${e.bad ? ' bad' : ''}${e.dash || e.ghost ? ' dash' : ''}${e.ghost ? ' ghost' : ''}${lit}" d="${d}" ${e.dash || e.ghost ? '' : 'pathLength="1"'} ${e.arrow ? `marker-end="url(#${e.bad ? 'ahb' : 'ah'})"` : ''}/>`);
      if (best) {
        placedLabels.push({ x: best.x, y: best.y, w: best.lw, h: best.lh });
        const tapVia = S.level === 'estate' && e.blocks && e.blocks.some((bk) => bk.via) && !e.opens && !best.few;
        const l = document.createElement(e.opens || tapVia || best.few ? 'button' : 'div'); l.className = 'lab' + (e.bad ? ' bad' : '') + (e.ghost ? ' ghost' : '') + (e.opens ? ' opens' : '') + (tapVia || best.few ? ' taps' : '') + (best.few ? ' few' : '') + (enter ? ' enter' : '') + lit;
        if (best.few) { const ek = e.a + '|' + e.b; linkTips.set(ek, linkTipOf(e)); l.type = 'button'; l.dataset.tip = 'link:' + ek; l.setAttribute('aria-expanded', 'false'); l.setAttribute('aria-label', `${best.few}: ${e.blocks.map((bk) => bk.s).join('; ')}`); } // peer:design: its sentences are its tip
        if (tapVia) { const ek = e.a + '|' + e.b; l.type = 'button'; l.title = 'What carries this link'; l.setAttribute('aria-expanded', String((S.viaOn || new Set()).has(ek))); l.onclick = (ev) => { ev.stopPropagation(); S.viaOn ||= new Set(); S.viaOn.has(ek) ? S.viaOn.delete(ek) : S.viaOn.add(ek); drawEdges(); }; } l.innerHTML = best.rows ? best.rows.map((r) => (r ? `<span class="${r.v === 5 ? 'lw lwhy hov' : r.v === 4 ? 'lw lwhy' /* peer:builder */ : r.v === 3 ? 'lv lp' : r.v === 2 ? 'lm' : r.v ? 'lw' : 'lv'}">${esc(r.t)}</span>` : '<span class="lsep"></span>')).join('') : Array.isArray(best.txt) ? best.txt.map((x, i) => `<span class="${i ? 'lw' : 'lv'}">${esc(x)}</span>`).join('') : best.txt.split('\n').map(esc).join('<br>'); l.style.left = best.x + 'px'; l.style.top = best.y + 'px'; stage.append(l); labels.push(l);
        if (e.opens) { l.type = 'button'; l.setAttribute('aria-label', `The relations between ${M.domains.find((x) => x.id === e.opens[0]).name} and ${M.domains.find((x) => x.id === e.opens[1]).name}`); l.onclick = (ev) => { ev.stopPropagation(); openRelations(e.opens[0], e.opens[1]); }; }
      }
    }
    // pointing at a kind on the large map: a line from it to each kind it relates to, its sentence where the line arrives
    if (spot.size) drawSpot(HV, spot, parts, 'spot');
    else if (S.reach && estateWorld().compact && tags.size && waitingDs()) {
      const src = 'k:' + waitingDs().kind;
      drawSpot(src, new Map([...tags].filter(([id]) => id !== src).map(([id, ls]) => [id, [{ s: `<b>${pz(ls[0])}</b>`, via: ls[1] }]])), parts, 'reach');
      tags = new Map(); // its own badge already says how many of its outputs wait
    }
    for (const [id, lines] of tags) {
      const B = box(id); if (!B) continue;
      // each kind's own words above it, as wide as the kind, so neighbours' tags never meet
      const l = document.createElement('div'); l.className = 'lab tag lit' + (S.reach ? ' bad' : ''); l.innerHTML = lines.map(pz).join('<br>');
      l.style.left = B.x + 4 + 'px'; l.style.top = B.y + 8 + 'px'; l.style.width = B.w - 8 + 'px'; stage.append(l); labels.push(l);
    }
    svg.innerHTML = parts.join('');
    tipSync(); // peer:design: a tip stays with its link when the map draws it again
  }
  // ------------------------------------------------------------------ pointing at a kind: a line from it to each kind it relates to, round every other kind
  class Heap {
    constructor() { this.k = []; this.p = []; }
    get size() { return this.k.length; }
    push(k, p) { const K = this.k, Q = this.p; let i = K.length; K.push(k); Q.push(p); while (i > 0) { const j = (i - 1) >> 1; if (Q[j] <= p) break; K[i] = K[j]; Q[i] = Q[j]; i = j; } K[i] = k; Q[i] = p; }
    pop() { const K = this.k, Q = this.p, top = K[0], lk = K.pop(), lp = Q.pop(), n = K.length; if (n) { let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = -1, mp = lp; if (l < n && Q[l] < mp) { m = l; mp = Q[l]; } if (r < n && Q[r] < mp) { m = r; mp = Q[r]; } if (m < 0) break; K[i] = K[m]; Q[i] = Q[m]; i = m; } K[i] = lk; Q[i] = lp; } return top; }
  }
  const plainOf = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  // each sentence sits inside the kind it is about, under its name; each line is found on a grid round every other kind,
  // area name and badge, leaving and reaching the kinds straight from an edge, lines going the same way sharing their way
  function planSpot(srcId, targets, withLines = true) {
    const A = box(srcId); if (!A) return [];
    const W = canvas.clientWidth, H = Math.max(canvas.clientHeight, parseFloat(stage.style.height) || 0), g = 6, font = '600 12px Geist';
    const st = stage.getBoundingClientRect();
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - st.left, y: r.top - st.top, w: r.width, h: r.height }; };
    const tiles = [...R.keys()].filter((id) => id.startsWith('k:')).map((id) => ({ id, ...box(id) }));
    const marks = [...stage.querySelectorAll('.domain .dmn, .kind > .kwait')].map(rel);
    const list = [...targets].map(([id, lines]) => ({ id, lines, B: box(id), s: R.get(id)?.s || 1 })).filter((t) => t.B).sort((a, b) => Math.hypot(a.B.cx - A.cx, a.B.cy - A.cy) - Math.hypot(b.B.cx - A.cx, b.B.cy - A.cy));
    const doms = [...stage.querySelectorAll('.node.domain')].map(rel);
    const lit = new Set([srcId, ...list.map((t) => t.id)]), H0 = Math.max(canvas.clientHeight, parseFloat(stage.style.height) || 0);
    const sizeOf = (t, via) => { const hs = t.lines.map((l) => wrapLines(plainOf(l.s), font, t.tag.w - 19).length * 16 + (via && l.via ? wrapLines(l.via, '400 11px Geist', t.tag.w - 19).length * 14 : 0)); return hs.reduce((a, x) => a + x, 0) + (hs.length - 1) * 4 + 6; };
    for (const t of list) {
      const B = t.B, w = B.w - 12;
      t.tag = { x: B.x + 6, y: B.y + (estateWorld().compact ? 36 : 41) * t.s, w };
      // room: the card's own, then the gap below it as far as the next lit kind (or its chip), another area or the end;
      // a dimmed kind and its own area's frame may be covered while it is lit
      const base = B.y + B.h - 5 - t.tag.y;
      const own = doms.find((r) => r.x <= B.x + 1 && r.x + r.w >= B.x + B.w - 1 && r.y <= B.y + 1 && r.y + r.h >= B.y + B.h - 1);
      const stops = [H0 - (B.y + B.h) - 8,
        ...tiles.filter((o) => o.id !== t.id && lit.has(o.id) && o.x < B.x + B.w - 2 && o.x + o.w > B.x + 2 && o.y >= B.y + B.h - 2).map((o) => o.y - (B.y + B.h) - (els.get(o.id)?.querySelector('.kwait') ? 18 : 8)),
        ...doms.filter((r) => r !== own && r.x < B.x + B.w && r.x + r.w > B.x && r.y >= B.y + B.h - 2).map((r) => r.y - (B.y + B.h) - 8)];
      const spare = Math.max(0, Math.min(64, ...stops)), room = base + spare;
      let h = sizeOf(t, true);
      if (h > room) {
        // what carries it moves up to the card's name line where its own datasets carry it; the sentence keeps the room
        t.noVia = true; h = sizeOf(t, false);
        if (t.lines.length === 1 && t.lines[0].carrier && t.lines[0].carrier.kind === t.id.slice(2)) t.short = t.lines[0].carrier.short;
        if (h > room) { let used = 6; t.keep = 0; for (const l of t.lines) { const h2 = wrapLines(plainOf(l.s), font, w - 19).length * 16 + (t.keep ? 4 : 0); if (t.keep && used + h2 > room - (t.keep < t.lines.length - 1 ? 18 : 0)) break; used += h2; t.keep++; } h = Math.min(used, room); t.cl = used > room ? Math.max(1, Math.floor((room - 6) / 16)) : 0; }
      }
      t.tag.h = h; t.grow = h > base ? Math.min(spare, h - base + 2) : 0;
      // what the card's own datasets say today stays in view while it is lit: its mark in the corner
      const ds0 = (kindOf(t.id.slice(2))?.datasets || []).map(dsOf).filter(Boolean), pz0 = ds0.filter((d) => d.state === 'waiting'), wn0 = ds0.filter((d) => d.state === 'warn');
      t.stat = pz0.length ? { m: PAUSE, t: `${pz0.map((d) => d.short).join(', ')} paused` } : wn0.length ? { m: '◆', t: `${wn0.map((d) => d.short).join(', ')} unusual today` } : null;
      t.title = t.lines.map((l) => plainOf(l.s) + (l.via ? ` (${l.via}${l.names ? ': ' + l.names : ''})` : '')).join('\n');
    }
    const tagHtml = (t) => t.lines.slice(0, t.keep || t.lines.length).map((l) => `<span class="tl">${l.s}${l.via && !t.noVia ? `<i>${esc(l.via)}</i>` : ''}</span>`).join('') + (t.keep && t.keep < t.lines.length ? `<span class="tl tmore">and ${t.lines.length - t.keep} more</span>` : '');
    if (!withLines) return list.map((t) => ({ d: null, id: t.id, grow: t.grow || 0, short: t.short, stat: t.stat, x: t.tag.x, y: t.tag.y, w: t.tag.w, cl: t.cl, title: t.title, html: tagHtml(t) }));
    const cols = Math.ceil(W / g) + 2, rws = Math.ceil(H / g) + 2, N = cols * rws;
    const solid = new Uint8Array(N), used = new Uint8Array(N), costly = new Uint8Array(N);
    const cells = (r, pad, fn) => { const x0 = Math.max(0, Math.floor((r.x - pad) / g)), x1 = Math.min(cols - 1, Math.floor((r.x + r.w + pad) / g)), y0 = Math.max(0, Math.floor((r.y - pad) / g)), y1 = Math.min(rws - 1, Math.floor((r.y + r.h + pad) / g)); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(y * cols + x); };
    for (const o of tiles) cells(o, 5, (i) => { solid[i] = 1; });
    for (const o of marks) cells(o, 2, (i) => { solid[i] = 1; });
    // an area's frame is crossed, never followed
    for (const el of stage.querySelectorAll('.node.domain')) { const r = rel(el); for (const e of [{ x: r.x, y: r.y, w: r.w, h: 1 }, { x: r.x, y: r.y + r.h - 1, w: r.w, h: 1 }, { x: r.x, y: r.y, w: 1, h: r.h }, { x: r.x + r.w - 1, y: r.y, w: 1, h: r.h }]) cells(e, 0, (i) => { costly[i] = 1; }); }
    for (let x = 0; x < cols; x++) { solid[x] = 1; solid[(rws - 1) * cols + x] = 1; }
    for (let y = 0; y < rws; y++) { solid[y * cols] = 1; solid[y * cols + cols - 1] = 1; }
    // how close each cell is to something solid: lines keep to the middle of the gaps
    const clr = new Uint8Array(N).fill(9), q = new Int32Array(N); let qh = 0, qt = 0;
    for (let i = 0; i < N; i++) if (solid[i]) { clr[i] = 0; q[qt++] = i; }
    while (qh < qt) { const i = q[qh++], c = clr[i] + 1; if (c > 3) continue; const x = i % cols; if (x > 0 && clr[i - 1] > c) { clr[i - 1] = c; q[qt++] = i - 1; } if (x < cols - 1 && clr[i + 1] > c) { clr[i + 1] = c; q[qt++] = i + 1; } if (i >= cols && clr[i - cols] > c) { clr[i - cols] = c; q[qt++] = i - cols; } if (i + cols < N && clr[i + cols] > c) { clr[i + cols] = c; q[qt++] = i + cols; } }
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    // the cells just outside a kind, each with the way out of it and the edge it faces
    const ring = (b) => { const x0 = Math.floor((b.x - 5) / g) - 1, x1 = Math.floor((b.x + b.w + 5) / g) + 1, y0 = Math.floor((b.y - 5) / g) - 1, y1 = Math.floor((b.y + b.h + 5) / g) + 1, out = []; for (let x = x0 + 2; x <= x1 - 2; x++) out.push([y0 * cols + x, 3, 'top'], [y1 * cols + x, 1, 'bottom']); for (let y = y0 + 2; y <= y1 - 2; y++) out.push([y * cols + x0, 2, 'left'], [y * cols + x1, 0, 'right']); return { out, x0, x1, y0, y1 }; };
    const starts = ring(A).out;
    for (const t of list) {
      const B = t.B, gr = ring(B), goal = new Map(gr.out.filter(([i]) => i >= 0 && i < N && !solid[i]).map(([i, , side]) => [i, side]));
      const h = (i) => { const x = i % cols, y = (i / cols) | 0; return (Math.max(gr.x0 - x, 0, x - gr.x1) + Math.max(gr.y0 - y, 0, y - gr.y1)) * 0.6; };
      const best = new Float32Array(N * 4).fill(Infinity), from = new Int32Array(N * 4).fill(-1), done = new Uint8Array(N * 4), heap = new Heap();
      const mid = (i, side, b) => (side === 'top' || side === 'bottom' ? Math.abs((i % cols) - b.cx / g) : Math.abs(((i / cols) | 0) - b.cy / g)) * 0.04;
      for (const [i, d, side] of starts) if (i >= 0 && i < N && !solid[i]) { const s = i * 4 + d, c0 = mid(i, side, A); if (best[s] > c0) { best[s] = c0; heap.push(s, c0 + h(i)); } }
      let end = -1, guard = 0;
      while (heap.size && guard++ < 400000) {
        const s = heap.pop(); if (done[s]) continue; done[s] = 1;
        const i = s >> 2, d = s & 3, x = i % cols, y = (i / cols) | 0;
        if (goal.has(i)) { end = s; break; }
        for (let nd = 0; nd < 4; nd++) {
          if (nd === ((d + 2) & 3)) continue;
          const nx = x + DX[nd], ny = y + DY[nd]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rws) continue;
          const j = ny * cols + nx; if (solid[j]) continue;
          const ns = j * 4 + nd, ng = best[s] + (used[j] ? 0.55 : 1) + (clr[j] === 1 ? 1.6 : clr[j] === 2 ? 0.45 : 0) + (costly[j] ? 3 : 0) + (nd !== d ? 5 : 0) + (goal.has(j) ? mid(j, goal.get(j), B) : 0);
          if (ng < best[ns]) { best[ns] = ng; from[ns] = s; heap.push(ns, ng + h(j)); }
        }
      }
      if (end < 0) { t.d = null; continue; }
      const chain = []; for (let s = end; s >= 0; s = from[s]) chain.push(s); chain.reverse();
      for (const s of chain) used[s >> 2] = 1;
      const d0 = chain[0] & 3, side = goal.get(end >> 2), pts = chain.map((s) => { const c = s >> 2; return [(c % cols) * g + g / 2, ((c / cols) | 0) * g + g / 2]; });
      const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1];
      const all = [d0 === 3 ? [fx, A.y] : d0 === 1 ? [fx, A.y + A.h] : d0 === 2 ? [A.x, fy] : [A.x + A.w, fy], ...pts, side === 'top' ? [lx, B.y] : side === 'bottom' ? [lx, B.y + B.h] : side === 'left' ? [B.x, ly] : [B.x + B.w, ly]];
      const simp = [all[0]];
      for (let i = 1; i < all.length - 1; i++) { const a = simp[simp.length - 1], b = all[i], c = all[i + 1]; if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) continue; simp.push(b); }
      simp.push(all[all.length - 1]);
      t.d = roundPts(simp, 9); t.end = simp[simp.length - 1];
    }
    return list.map((t) => ({ d: t.d, end: t.end, x: t.tag.x, y: t.tag.y, w: t.tag.w, cl: t.cl, title: t.title, html: tagHtml(t) }));
  }
  let spotMemo = { key: '' };
  function drawSpot(srcId, targets, parts, kind) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const key = [kind, srcId, S.m, S.ver, canvas.clientWidth, canvas.clientHeight, [...targets.keys()].join(',')].join('|');
    const fresh = spotMemo.key !== key; if (fresh) spotMemo = { key, plan: planSpot(srcId, targets, false) };
    const grow = fresh && !reduce;
    spotMemo.plan.forEach((it, i) => {
      const dl = grow ? i * 60 : 0;
      if (it.d) parts.push(`<path class="ln spot lit${grow ? ' grow' : ''}" d="${it.d}" pathLength="1" style="animation-delay:${dl}ms"/><circle class="spotdot${grow ? ' grow' : ''}" cx="${it.end[0]}" cy="${it.end[1]}" r="3.4" style="animation-delay:${dl + 300}ms"/>`);
      const l = document.createElement('div'); l.className = `lab tag spot lit${kind === 'reach' ? ' touch' : ''}${grow ? ' grow' : ''}`;
      l.innerHTML = it.html; l.style.left = it.x + 'px'; l.style.top = it.y + 'px'; l.style.width = it.w + 'px'; l.style.animationDelay = dl + 220 + 'ms';
      if (it.cl) { l.classList.add('clip'); l.style.setProperty('--cl', it.cl); } if (it.title) l.title = it.title;
      if (it.stat) { const kh = els.get(it.id)?.querySelector('.khead'); if (kh && !kh.querySelector('.kbad')) kh.insertAdjacentHTML('beforeend', `<span class="kstat${it.stat.m === '◆' ? ' warn' : ''}" title="${esc(it.stat.t)}">${it.stat.m}</span>`); }
      if (it.short) { const kn = els.get(it.id)?.querySelector('.kname'); if (kn) kn.dataset.via = it.short; }
      if (it.id && els.get(it.id)) { const el = els.get(it.id), r = R.get(it.id); el.classList.add('tagged'); grown.push(it.id); if (it.grow > 0 && r) { el.classList.add('grown'); el.style.height = r.h + it.grow / (r.s || 1) + 'px'; } }
      stage.append(l); labels.push(l);
    });
  }
  // ------------------------------------------------------------------ moving between levels, every node keeping who it is
  // the standard curve: away gently, a long settle
  const bez = (x1, y1, x2, y2) => { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx; return (x) => { if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x)); let t = x; for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-5 || !d) break; t -= e / d; } t = Math.min(1, Math.max(0, t)); return Y(t); }; };
  const ease = bez(0.4, 0, 0.2, 1);
  const parentOf = (id) => { const [t, k] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)]; if (t === 'd') return 'k:' + dsOf(k)?.kind; if (t === 'g' || t === 'm') return 'k:' + k.split(':')[0]; if (t === 'o' || t === 'in' || t === 'r' || t === 'sf') return 'd:' + k; /* peer:builder: sf */ return null; };
  let anim = 0, moving = false;
  function render(instant) {
    const T = layout();
    stage.dataset.level = S.level;
    stage.style.height = T.scroll + 'px';
    canvas.style.overflowY = T.scroll > canvas.clientHeight + 4 ? 'auto' : 'hidden';
    const from = new Map(R);
    const to = T.nodes;
    edges = T.edges;
    const arriving = stage.classList.contains('arrive');
    for (const [id, r] of to) {
      if (!els.has(id)) { const el = document.createElement('div'); el.dataset.id = id; stage.append(el); els.set(id, el); wire(el, id); }
      const el = els.get(id), before = el._v; paint(el, id, r);
      // a node that changes what it is (a tile opening into a panel) lets its new content fade in while its box moves
      if (!instant && before && before !== r.v) { el.classList.add('morph'); clearTimeout(el._mt); el._mt = setTimeout(() => el.classList.remove('morph'), 760); }
      el._v = r.v;
      if (arriving) el.style.setProperty('--d', Math.round(Math.min(420, r.x * 0.1 + r.y * 0.22)) + 'ms');
    }
    const start = new Map();
    for (const [id, r] of to) {
      if (from.has(id)) start.set(id, from.get(id));
      else if (id.startsWith('d:') && from.get(parentOf(id))?.v === 'kind-compact' && squareOf(id.slice(2), from.get(parentOf(id)))) { start.set(id, squareOf(id.slice(2), from.get(parentOf(id)))); els.get(id).classList.add('fromsq'); }
      else { const p = parentOf(id), pr = p && (from.get(p) || to.get(p)); start.set(id, pr ? { x: pr.x + (pr.w * pr.s) / 2 - (r.w * r.s) / 2, y: pr.y + (pr.h * pr.s) / 2 - (r.h * r.s) / 2, w: r.w, h: r.h, s: r.s * 0.6, o: 0 } : { ...r, o: 0 }); }
    }
    const gone = [...from.keys()].filter((id) => !to.has(id));
    const end = new Map(to);
    for (const id of gone) { const p = parentOf(id), pr = p && to.get(p), r = from.get(id); if (id.startsWith('d:') && pr?.v === 'kind-compact' && squareOf(id.slice(2), pr)) { end.set(id, squareOf(id.slice(2), pr)); start.set(id, r); els.get(id)?.classList.add('tosq'); continue; } end.set(id, pr ? { x: pr.x + (pr.w * pr.s) / 2 - (r.w * r.s) / 2, y: pr.y + (pr.h * pr.s) / 2 - (r.h * r.s) / 2, w: r.w, h: r.h, s: r.s * 0.6, o: 0 } : { ...r, o: 0 }); start.set(id, r); }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    svg.classList.add('off'); for (const l of labels) l.remove(); labels = [];
    // what belongs to the view being left fades out, rather than vanishing
    root.querySelectorAll('.alert, .mini, .hint, .mini-x, .eschint').forEach((x) => { if (instant || reduce) return x.remove(); x.classList.add('leaving'); setTimeout(() => x.remove(), 200); });
    const my = ++anim, dur = instant || reduce ? 0 : 540, t0 = performance.now(); moving = true;
    const frame = (now) => {
      if (my !== anim) return;
      const t = dur ? Math.min(1, (now - t0) / dur) : 1, k = ease(t);
      for (const [id, a] of start) {
        const b = end.get(id), el = els.get(id); if (!b || !el) continue;
        const r = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k, s: a.s + (b.s - a.s) * k, o: (a.o ?? 1) + ((b.o ?? 1) - (a.o ?? 1)) * k };
        place(el, r); R.set(id, r);
      }
      if (t < 1) requestAnimationFrame(frame);
      else { moving = false; for (const id of gone) { els.get(id)?.remove(); els.delete(id); R.delete(id); } for (const [id, r] of to) R.set(id, r); stage.querySelectorAll('.fromsq').forEach((x) => x.classList.remove('fromsq')); drawEdges(!reduce && (dur > 0 || arriving)); svg.classList.remove('off'); renderChrome(); }
    };
    requestAnimationFrame(frame);
    renderTrail();
  }

  // ------------------------------------------------------------------ the trail, the headline, the overview in the corner
  function renderTrail() {
    const t = $('#trail'); const k = S.kind && kindOf(S.kind), d = S.ds && dsOf(S.ds);
    const parts = [];
    if (S.level === 'estate') parts.push(false ? `<span class="viewwrap"><button type="button" class="viewsw" id="viewsw" aria-haspopup="menu" aria-expanded="false"><h1>Data model</h1><span class="vcar" aria-hidden="true">▾</span></button><span class="viewmenu" id="viewmenu" role="menu" hidden><span class="emh">Views</span>${['Overview', 'Pipeline', 'Data model', 'Outputs', 'Access', 'Audit log'].map((v) => `<a href="#" role="menuitem"${v === 'Data model' ? ' class="on" aria-current="page"' : ''}>${v}</a>`).join('')}</span></span>` : '<h1>Data model</h1>');
    else { parts.push('<button data-to="estate">Data model</button>'); if (S.level === 'dataset') parts.push(`<span class="sep">›</span><button data-to="kind" data-k="${d.kind}">${esc(kindOf(d.kind).name)}</button>`); }
    if (S.level === 'kind') parts.push(`<span class="sep">›</span><span class="here">${esc(k.name)}</span>`);
    if (S.level === 'dataset') parts.push(`<span class="sep">›</span><span class="here">${esc(d.short)}</span>`);
    t.innerHTML = parts.join('');
    t.querySelectorAll('[data-to]').forEach((b) => (b.onclick = () => (b.dataset.to === 'estate' ? go({ level: 'estate' }) : go({ level: 'kind', kind: b.dataset.k }))));
    const vs = t.querySelector('#viewsw'), vm = t.querySelector('#viewmenu');
    if (vs) { vs.onclick = (ev) => { ev.stopPropagation(); const open = vm.hasAttribute('hidden'); vm.toggleAttribute('hidden', !open); vs.setAttribute('aria-expanded', String(open)); if (open) vm.querySelector('a')?.focus(); }; vm.onclick = (ev) => { ev.preventDefault(); vm.setAttribute('hidden', ''); vs.setAttribute('aria-expanded', 'false'); }; root.addEventListener('click', (ev) => { if (!vm.hasAttribute('hidden') && !vm.contains(ev.target) && ev.target !== vs) { vm.setAttribute('hidden', ''); vs.setAttribute('aria-expanded', 'false'); } }); }
  }
  const legendHtml = (hint, squares) => `${squares ? '<span>Each square a dataset</span><span><i class="q"></i>fine</span>' : ''}${M.datasets.some((d) => d.state === 'waiting' && d.causeOnly) ? `<span><i class="causebox" aria-hidden="true"></i>${M.causeWord || 'the cause'}</span>` : ''}${M.datasets.some((d) => d.state === 'waiting' && !d.causeOnly) || !M.noWaitMark ? `<span>${PAUSE}${M.pauseWord || 'paused'}</span>` : ''}${waitingDs() && !M.noWaitMark ? `<span>${HOURGLASS}waits on it</span>` : ''}${M.datasets.some((d) => d.state === 'decided') ? `<span><b class="lg owed">${HALF}</b>${M.owedWord || 'decided, file owed'}</span>` : ''}${M.datasets.some((d) => d.replaced) ? '<span><b class="lg ok">✓</b>complete</span>' : ''}<span><b class="lg warn">◆</b>${M.warnWord || 'warned'}</span>${M.datasets.some((d) => d.state === 'awaited' || d.awaited) ? '<span><b class="lg aw">◌</b>planned: no file due yet</span>' : ''}`;
  function renderChrome() {
    root.querySelectorAll('.alert, .mini, .hint, .mini-x, .eschint').forEach((x) => x.remove());
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    const top = $('#waits'); if (top) { top.classList.toggle('ok', !w && !dd); top.classList.toggle('owed', !w && !!dd); top.innerHTML = w ? `${PAUSE} <span class="wl">${esc(smDay.text(DC().iso, DC().today))} is paused${smDay.small(DC().iso)} · </span><u>Decide ›</u>` : dd ? `${HALF} <span class="wl">${esc(smDay.text(DC().iso, DC().today))}: file owed${smDay.small(DC().iso)} · </span><u>${dd.pendingFix ? 'Publish it ›' : M.replaceable === false ? 'See it ›' : 'Replace ›'}</u>` : '✓ All files in'; top.hidden = S.level === 'estate' || (S.level === 'dataset' && !!w && S.ds === w.id); }
    if (S.level === 'estate' && w) {
      const n = (w.builds || []).length;
      const a = document.createElement('div'); a.className = 'alert';
      const wi = issueOf(w);
      if (M.shortBanner) a.classList.add('short');
      // peer:design: the day once, as Today with its date small; what came in; what waits as a count whose tip lists it
      const dayB = `<b class="aday">${esc(smDay.text(DC().iso, DC().today))} ${w.waited && !w.pendingFix ? 'waits for its file' : 'is paused'}</b>${smDay.small(DC().iso)}`;
      const waitN = n ? `<button type="button" class="awn" data-tip="waits" aria-expanded="false" aria-label="${outputsWait(n)} on ${esc(w.short)}">${HOURGLASS}<span class="kwn">${n}</span><span class="awl">${M.heldWord ? 'held' : 'waiting'}</span></button>` : '';
      a.innerHTML = M.shortBanner ? `<span class="ai">${w.waited && !w.pendingFix ? HOURGLASS : PAUSE}</span><span class="at">${dayB}${wi.sev && !w.waited ? ` · <span class="sev ${wi.sev.level}">${esc(wi.sev.said)}</span>` : ''}${waitN ? ` · ${waitN}` : ''}${w.pendingFix ? ' · <span class="okn"><b class="okm" aria-hidden="true">↻</b> corrected file in</span>' : ''}${w.waited && !w.pendingFix ? ` · your call${'' /* peer:owner (r4): one clock: no replay time beside the story's day */}` : ''}</span><button type="button" class="link decidelink" data-decide>Decide ›</button>` : `<span class="ai">${PAUSE}</span><span class="at">${dayB}<span class="asep">·</span><span class="awhy">${esc(w.short)} ${esc(wi.why)}</span>${waitN ? `<span class="asep">·</span>${waitN}` : ''}${w.pendingFix ? `<span class="asep">·</span><span class="okn"><b class="okm" aria-hidden="true">✓</b> its corrected file passed every check${wi.fixAt ? `, ${esc(wi.fixAt)}` : ''}</span>` : ''}${w.waited ? `<span class="asep">·</span><span class="askd">You chose to wait${w.waited.at ? `, ${hhmm(w.waited.at)}` : ''}</span>` : ''}${w.asked ? `<span class="asep">·</span><span class="askd">You asked for the file, ${hhmm(w.asked)}</span>` : ''}</span>${M.quietBanner ? '' : '<button class="btn primary" data-decide>Decide ›</button>'}`;
      if (narrow()) root.querySelector('.alertslot').append(a); else canvas.prepend(a); // peer:design: the marks' key is the "?" by the title, on a phone too
      const see = a.querySelector('[data-see]') || document.createElement('button');
      const sync = () => { S.reach = !!(S.reachPin || S.reachHover); see.textContent = S.reachPin ? 'Hide what’s built from it' : 'See what’s built from it'; see.setAttribute('aria-pressed', String(!!S.reachPin)); lightUp(); };
      see.onmouseenter = () => { S.reachHover = true; sync(); }; see.onmouseleave = () => { S.reachHover = false; sync(); };
      see.onclick = (ev) => { ev.stopPropagation(); S.reachPin = !S.reachPin; S.reachHover = false; sync(); };
      if (S.reachPin) sync();
      const dcb = a.querySelector('[data-decide]'); if (dcb) dcb.onclick = () => { if (M.onDecideBanner) return M.onDecideBanner(w); go({ level: 'dataset', ds: w.id, kind: w.kind }); setTimeout(() => openPanel(w.id, null, true), 560); };
    }
    if (S.level === 'estate' && !w && dd) {
      const a = document.createElement('div'); a.className = 'alert owed';
      const dc = DC(), di = issueOf(dd);
      if (M.shortBanner) a.classList.add('short');
      a.innerHTML = M.shortBanner ? `<span class="ai">${HALF}</span><span class="at"><b>${esc(smDay.text(dc.iso, dc.today))}: decided for now</b>${smDay.small(dc.iso)} · ${dd.how === 'keep' ? `readers see ${esc(dc.prev)}` : dd.how === 'fill' ? `filled from ${esc(di.fillFrom)}` : 'published as it arrived'} · ${dd.pendingFix ? '<b class="next">✓ its corrected file is in, for your OK</b>' : 'its corrected file is still to come'}</span>` : `<span class="ai">${HALF}</span><span class="at"><b>${esc(smDay.text(dc.iso, dc.today))} is decided for now</b>${smDay.small(dc.iso)}<span class="asep">·</span>${dd.how === 'keep' ? `readers see ${esc(dc.prev)}` : dd.how === 'fill' ? `published, ${esc(dd.short)} filled from ${esc(di.fillFrom)}` : 'published as it arrived'}<span class="asep">·</span>${dd.pendingFix ? '<b class="next">its corrected file is in, for your OK</b>' : `<b class="next">next: the corrected file</b>${dd.asked ? `<span class="asep">·</span><span class="askd">asked for at ${hhmm(dd.asked)}</span>` : ''}`}</span>`;
      if (narrow()) root.querySelector('.alertslot').append(a); else canvas.prepend(a);
      const und = a.querySelector('[data-undo]'); if (und) und.onclick = () => undo();
      const rpl = a.querySelector('[data-replace]'); if (rpl) rpl.onclick = () => { if (dd.pendingFix) return replaceFile(dd.id, dd.pendingFix); go({ level: 'dataset', ds: dd.id, kind: dd.kind }); setTimeout(() => openReplace(dd.id), 560); };
    }
    if (S.level === 'estate' && !w && !dd && rd) {
      const a = document.createElement('div'); a.className = 'alert done';
      if (M.shortBanner) a.classList.add('short');
      a.innerHTML = M.shortBanner ? `<span class="ai">✓</span><span class="at"><b>${esc(smDay.text(DC().iso, DC().today))} is decided</b>${smDay.small(DC().iso)} · its corrected ${esc(rd.short)} file went out${M.doneNote ? ` · <span class="still">${esc(M.doneNote)}</span>` : ', every check passed'} · ${outputsWait((rd.builds || []).length).replace(/ held$/, '')} rebuilt${laterSaid() ? ` · readers stay on ${esc(smDay.mid(M.latest.iso, laterSaid()))}` : ''}</span>` : `<span class="ai">✓</span><span class="at"><b>${esc(smDay.text(DC().iso, DC().today))} is complete</b>${smDay.small(DC().iso)}<span class="asep">·</span>The corrected ${esc(rd.short)} file (${fmt(rd.replaced.rows)} rows) passed all ${(rd.checks || []).length} checks; the ${(rd.builds || []).length} built from it are rebuilt${laterSaid() ? `, and readers stay on ${esc(smDay.mid(M.latest.iso, laterSaid()))}, the latest day` : ` and readers now see ${esc(smDay.mid(DC().iso, DC().today))}`}.</span>`;
      if (narrow()) root.querySelector('.alertslot').append(a); else canvas.prepend(a);
      const und2 = a.querySelector('[data-undo]'); if (und2) und2.onclick = () => undo();
    }
    const hintAt = (t) => { if (narrow()) return; const h = document.createElement('span'); h.className = 'maphint mini-x'; h.innerHTML = t; root.querySelector('.tools').before(h); };
    // peer:design: what the marks mean is one tap away by the title, not a row of its own; how to point is said there too
    if (S.level === 'estate' && !estateWorld().compact) {
      const kb = document.createElement('button'); kb.type = 'button'; kb.className = 'mapkey mini-x'; kb.dataset.tip = 'key'; kb.setAttribute('aria-expanded', 'false'); kb.setAttribute('aria-label', 'What the marks mean'); kb.textContent = '?'; $('#trail').after(kb);
    }
    if (S.level === 'estate' && estateWorld().compact) {
      const lg = document.createElement('div'); lg.className = 'legend inbar mini-x'; lg.innerHTML = legendHtml('', true); $('#trail').after(lg); hintAt('Point at a kind, or Tab to one, for all its relations');
    }
    // peer:newcomer (r4), peer:design r4 rev 1: an opened kind and a file keep the estate's "?" (the marks, how to point,
    // Esc), not a row of marks, a hint, "Esc steps back" and a little diagram of the estate: the breadcrumb says where you are
    if ((S.level === 'kind' || S.level === 'dataset') && !narrow()) {
      const kb = document.createElement('button'); kb.type = 'button'; kb.className = 'mapkey mini-x'; kb.dataset.tip = 'key'; kb.setAttribute('aria-expanded', 'false'); kb.setAttribute('aria-label', 'What the marks mean'); kb.textContent = '?'; $('#trail').after(kb);
    }
  }

  // ------------------------------------------------------------------ what clicking does
  function wire(el, id) {
    const [t, key] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)];
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const col = ev.target.closest('[data-col]');
      if (t === 'd' && ev.target.closest('[data-cols]')) { S.colsOpen = !S.colsOpen; return render(); } // peer:builder: the columns, a tap away
      if (t === 'o' && (ev.target.closest('[data-outs]') || (!ev.target.closest('[data-out]') && S.outsOpen !== key))) { S.outsOpen = S.outsOpen === key ? null : key; return render(); } // peer:builder: the list, a tap away
      if (t === 'd' && ev.target.closest('[data-decide]')) return openPanel(key, null, true);
      if (t === 'd' && ev.target.closest('[data-undo]')) return undo();
      if (t === 'd' && ev.target.closest('[data-replace]')) return openReplace(key);
      if (t === 'd' && ev.target.closest('[data-rows]')) return openRows(key, S.colSeen && S.colSeen.id === key ? S.colSeen.col : undefined); // peer:newcomer: on the column you tapped
      if (t === 'o' && ev.target.closest('[data-out]')) return openOutput(ev.target.closest('[data-out]').dataset.out, key);
      if (t === 'd' && col) return openPanel(key, col.dataset.col);
      if (t === 'd') { const r = R.get(id); if (r && (r.v === 'focus')) return openPanel(key); return go({ level: 'dataset', ds: key, kind: dsOf(key).kind }); }
      if (t === 'k' && ev.target.closest('[data-carry]')) { S.pin = S.pin === id ? null : id; els.forEach((x) => x.querySelectorAll('[data-carry]').forEach((b) => b.setAttribute('aria-pressed', String(S.pin && x.dataset.id === S.pin)))); lightUp(); return; }
      if (t === 'k') { if (S.level === 'kind' && S.kind === key) return; return go({ level: 'kind', kind: key }); }
      if (t === 'in') { const f = R.get(id); if (f?.go) go(f.go); }
      if (t === 'r') go({ level: 'dataset', ds: key, kind: dsOf(key).kind });
      if (t === 'm') { const kk = key.split(':')[0], g = key.slice(kk.length + 1); S.open = { ...(S.open || {}), [kk]: (S.open || {})[kk] === g ? null : g }; render(); }
    });
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); el.click(); } });
    if (t === 'd') {
      el.addEventListener('mouseenter', () => { if (S.level !== 'kind' || R.get(id)?.v !== 'chip') return; S.hoverCard = key; lightUp(); });
      el.addEventListener('mouseleave', () => { if (S.level !== 'kind') return; S.hoverCard = null; lightUp(); });
    }
    if (t === 'k') {
      el.addEventListener('mouseenter', () => { if (!(S.level === 'estate' || (S.level === 'kind' && key !== S.kind))) return; if (tipKind === id) return; /* peer:design: pointing at its count is about the count */ S.hover = id; lightUp(); });
      el.addEventListener('mouseleave', () => { if (S.level === 'dataset') return; S.hover = null; lightUp(); });
      // the keyboard points too: a kind with focus shows its relations as one pointed at does
      el.addEventListener('focus', () => { if (S.level !== 'estate') return; S.hover = id; lightUp(); });
      el.addEventListener('blur', () => { if (S.level !== 'estate' || S.hover !== id) return; S.hover = null; lightUp(); });
    }
  }
  function lightUp() {
    const HV = S.hover || S.spotPin;
    const on = HV || (S.level === 'kind' && (S.hoverCard || S.pin)) || (S.level === 'estate' && S.reach);
    stage.classList.toggle('hovering', !!on); stage.classList.toggle('reaching', !!(S.level === 'estate' && S.reach && !HV));
    hintNow();
    if (!on) { stage.querySelectorAll('.lit, .hot').forEach((x) => x.classList.remove('lit', 'hot')); drawEdges(); return; }
    const lit = new Set();
    if (S.level === 'estate' && HV) {
      // the kinds it relates to light up, and of their datasets only those at either end of a relation: what carries it
      const k = HV.slice(2), touch = new Set([k, ...neighbours(k)]), carry = new Set();
      for (const j of M.joins) { const a = dsOf(j.from)?.kind, b = dsOf(j.to)?.kind; if (a && b && a !== b && (a === k || b === k)) { carry.add('d:' + j.from); carry.add('d:' + j.to); } }
      for (const id of els.keys()) { const tt = id.split(':')[0], key = id.slice(id.indexOf(':') + 1); if (tt === 'dm' || (tt === 'k' && touch.has(key)) || (tt === 'd' && carry.has(id))) lit.add(id); }
    } else if (S.level === 'estate' && S.reach) {
      const w2 = waitingDs(), kinds = new Set([w2?.kind, ...M.outputs.filter((o) => o.waiting).map((o) => outKind(o.id))]);
      for (const id of els.keys()) { const tt = id.split(':')[0], key = id.slice(id.indexOf(':') + 1); if (tt === 'dm' || (tt === 'k' && kinds.has(key)) || (tt === 'd' && key === w2?.id)) lit.add(id); }
    } else if (S.level === 'kind') {
      // the opened kind and its labels stay; a neighbour lights the datasets that carry it; a dataset lights the kinds it reaches
      for (const id of els.keys()) if (/^(g|a):/.test(id) || id === 'k:' + S.kind) lit.add(id);
      const hv = S.hover || S.pin;
      if (hv) { lit.add(hv); for (const d of carriers(S.kind, hv.slice(2))) lit.add('d:' + d); }
      if (S.hoverCard) { lit.add('d:' + S.hoverCard); for (const kk of reachOf(S.hoverCard)) lit.add('k:' + kk); }
    }
    const hot = S.level === 'estate' ? HV : null;
    for (const [id, el] of els) { el.classList.toggle('lit', lit.has(id)); el.classList.toggle('hot', id === hot); }
    drawEdges();
  }
  // the line beside the legend says what is lit, and how to get out of it
  function hintNow() {
    const lt = root.querySelector('.maphint'); if (!lt || S.level !== 'estate' || !estateWorld().compact) return;
    const hv = S.hover || S.spotPin;
    if (hv && kindOf(hv.slice(2))) { const K = kindOf(hv.slice(2)), n = neighbours(K.id).length; lt.innerHTML = `<b>${esc(K.name)}</b> relates to ${n} kind${n === 1 ? '' : 's'}: the sentence on each says how · ${S.spotPin && !S.hover ? '<kbd>Esc</kbd> clears' : `click to open ${esc(K.name)}`}`; }
    else if (S.reach) lt.textContent = 'What the paused file holds up: each kind whose outputs wait says which';
    else lt.textContent = 'Point at a kind, or Tab to one, for all its relations';
  }
  function go(next) {
    const ds0 = S.ds; // peer:builder
    Object.assign(S, next);
    if (S.ds !== ds0 || S.level !== 'dataset') S.outsOpen = null; // peer:builder
    if (S.colSeen && S.colSeen.id !== S.ds) S.colSeen = null; // peer:newcomer
    if (S.level === 'estate') { S.kind = null; S.ds = null; }
    if (S.level === 'kind') S.ds = null;
    S.hover = null; S.hoverCard = null; S.pin = null; S.spotPin = null; S.reach = false; S.reachPin = false; S.reachHover = false; stage.classList.remove('hovering', 'reaching');
    const h = S.level === 'estate' ? 'estate' : S.level === 'kind' ? 'k-' + S.kind.replace(/_/g, '-') : 'd-' + S.ds.replace(/_/g, '-');
    host.navigate(S.level === 'estate' ? null : S.level === 'kind' ? { kind: S.kind } : { dataset: S.ds });
    closePanel();
    render();
    if (root.activeElement && stage.contains(root.activeElement)) { const hd = $('#trail .here') || $('#trail h1'); if (hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); } }
  }
  // The level the page's address names: the estate, a kind, or a dataset (none found: the estate).
  function show(level) {
    if (!M) return;
    const k = level && level.kind && M.kinds.find((x) => x.id === level.kind);
    const d = level && level.dataset && M.datasets.find((x) => x.id === level.dataset);
    const next = d ? { level: 'dataset', ds: d.id, kind: d.kind } : k ? { level: 'kind', kind: k.id, ds: null } : { level: 'estate', kind: null, ds: null };
    if (next.level === S.level && next.kind === S.kind && next.ds === S.ds && els.size) return;
    Object.assign(S, next);
    S.hover = null; S.hoverCard = null; S.pin = null; S.spotPin = null; S.reach = false; S.reachPin = false; S.reachHover = false; stage.classList.remove('hovering', 'reaching');
    closePanel(true);
    render();
  }
  // A new model (another day, a decision recorded, the flow edited): drawn again in place, at the same level where it
  // still has what the level names.
  function setModel(x) {
    const changed = M !== x;
    M = x;
    if (changed) { estateCache = null; spotMemo = { key: '' }; S.ver++; }
    if (S.ds && !M.datasets.some((d) => d.id === S.ds)) Object.assign(S, { level: 'estate', kind: null, ds: null });
    else if (S.kind && !M.kinds.some((k) => k.id === S.kind)) Object.assign(S, { level: 'estate', kind: null, ds: null });
    if (S.panel) closePanel(true);
    render(true);
  }

  // ------------------------------------------------------------------ the side panel: a dataset, or one of its columns
  // the layer the panels share: a panel already open keeps its place and changes its content; a new one slides in
  function layer() {
    const L = $('#layer'); clearTimeout(closePanel.t); stopPics();
    const swap = !!L.querySelector('.panel') && !L.classList.contains('closing');
    L.className = swap ? 'swap' : ''; return L;
  }
  // deciding, in pictures: Tuesday's file, Wednesday's, and the eye under the one readers see
  const NEEDS_WHY = { fill: true, asis: true, accept: true };
  const RECD = { stay: 'Recorded as yours',  keep: 'Recorded as yours, with the time and your reason', fill: 'Recorded as yours, with the time and the reason you give', asis: 'Recorded as yours, with the time and the reason you give', wait: 'Recorded as a wait, with the time and your reason', accept: 'Recorded as yours, with the time and the reason you give', fix: 'Recorded as yours, with the time' };
  const GIST = { keep: 'Readers see Tuesday · off your list', fill: 'Tuesday’s rows, marked as filled', wait: 'Outputs keep waiting · on your list', asis: 'Failing reviews show as no data' };
  // a file, for the line that says what happens when it comes
  const FILEMARK = '<svg class="fmk" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.2L12.5 4.8v9.7H4z"/><path d="M9 1.5v3.5h3.5"/></svg>';
  const hhmm = (t) => t.toTimeString().slice(0, 5);
  const usualN = (u) => Math.round((u[0] + u[1]) / 2);
  const UNDO = { keep: 'change it later', fill: 'change it later', asis: 'change it later', wait: 'Decide whenever you are ready', accept: 'change it later', fix: 'change it later', stay: 'Decide whenever you are ready' };
  function decidePic(k, dd, dayLab) { // peer:owner (r3): dayLab names the paused day's card (Today) where the caller asks
    const c = DC(), I = issueOf(dd || issueDs()), T = 24, D = 120, cx = (x) => x + 28;
    const bars = (x, cls, ws = [42, 34, 40, 28], bad = []) => ws.map((w, i) => `<rect class="${cls}${bad.includes(i) ? ' bad' : ''}" style="--i:${i}" x="${x + 7}" y="${28 + i * 7}" width="${w}" height="3.5" rx="1.75"/>`).join('');
    // the day's file as it arrived: empty, with wrong values, its rows twice, at a new level, or short
    const arrived = (cls) => I.kind === 'empty' ? card(D, cls === 'risk' ? 'risk' : 'empty')
      : I.kind === 'twice' ? card(D, cls) + [42, 42, 34, 34, 40, 40, 28, 28].map((w, i) => `<rect class="bar${i % 2 ? ' bad' : ''}" style="--i:${i}" x="${D + 7}" y="${26 + i * 4}" width="${w}" height="2.4" rx="1.2"/>`).join('')
      : I.kind === 'shift' ? card(D, cls === 'ok' ? '' : cls) + bars(D, 'bar', [42, 46, 40, 16], cls === 'ok' ? [] : [1, 3])
      : I.kind === 'short' ? card(D, cls) + bars(D, 'bar', [42, 34]) + `<rect class="gap" x="${D + 7}" y="42" width="40" height="10" rx="2"/>`
      : card(D, cls) + bars(D, 'bar', [42, 34, 40, 28], [1, 3]);
    const tick = `<g transform="translate(${D + 55} 20)"><g class="tick"><circle class="tkb" r="7.5"/><path class="tkp" d="M-3.4 .2l2.2 2.3 4.4-4.6"/></g></g>`;
    const card = (x, cls) => `<rect class="card${cls ? ' ' + cls : ''}" x="${x}" y="19" width="56" height="42" rx="6"/>`;
    const eye = (x, cls, label) => `<g transform="translate(${cx(x)} 73)"><g class="eye${cls ? ' ' + cls : ''}"><circle class="ring" r="9"/><path class="lid" d="M-8 0c2.4-3.4 5-5 8-5s5.6 1.6 8 5c-2.4 3.4-5 5-8 5s-5.6-1.6-8-5z"/><circle class="iris" r="2.2"/>${label ? (x === D ? '<text class="who" x="-13" y="3.6" text-anchor="end">readers see</text>' : '<text class="who" x="13" y="3.6">readers see</text>') : ''}</g></g>`;
    const doneMk = `<g transform="translate(${D + 55} 20)"><g class="tick done"><circle class="tkb" r="7.5"/><path class="tkp" d="M-3.4 .2l2.2 2.3 4.4-4.6"/></g></g>`;
    const owed = (early) => `<g transform="translate(${D + 55} 20)"><g class="owed${early ? ' early' : ''}"><circle class="ob" r="7.5"/><circle class="oc" r="4.8"/><path class="of" d="M0-4.8a4.8 4.8 0 0 0 0 9.6z"/></g></g>`;
    const pause = `<g transform="translate(${D + 18.5} 28.5) scale(1.1875)"><g class="pzp"><path fill-rule="evenodd" d="${PZ_D}"/></g></g>`;
    const pauseC = `<g transform="translate(${D + 47.5} 12.5) scale(.9375)"><g class="pzp"><path fill-rule="evenodd" d="${PZ_D}"/></g></g>`;
    const said = (cls, t) => `<text class="cap ${cls}" x="${cx(D)}" y="76.5" text-anchor="middle">${t}</text>`;
    const hg = `<g class="hgp" transform="translate(${D + 39} 45) scale(.8)"><path class="hc" d="M3.2 1.6h9.6M3.2 14.4h9.6"/><path d="M4.6 1.6c0 3.6 2.6 4.8 2.6 6.4s-2.6 2.8-2.6 6.4M11.4 1.6c0 3.6-2.6 4.8-2.6 6.4s2.6 2.8 2.6 6.4"/><path class="hs" d="M5.6 13.6c.6-1.9 1.6-2.7 2.4-3.2.8.5 1.8 1.3 2.4 3.2zM6.1 4.4h3.8c-.4.9-1.1 1.5-1.9 2.1-.8-.6-1.5-1.2-1.9-2.1z"/></g>`;
    const back = k === 'fill' && I.fillAfter, sees = { keep: T, wait: T, fill: D, asis: D, accept: D, fix: D, stay: I.nowHow === 'fill' || I.nowHow === 'asis' ? D : T }[k], ring = sees != null ? `<rect class="seen" x="${sees - 3}" y="16" width="62" height="48" rx="8"/>` : '';
    const base = `${ring}<text class="day" x="${cx(T)}" y="12" text-anchor="middle">${k === 'fill' && !back ? I.fillFromD : c.pd}</text><text class="day" x="${cx(D)}" y="12" text-anchor="middle">${dayLab ? esc(dayLab) : c.d}</text>${card(T)}${bars(T, 'bar')}`;
    const from = back ? `<g class="from"><path d="M${D + 72} 40h-9m3-3-3 3 3 3"/><text class="day" x="${D + 74}" y="44">${I.fillFromD}</text></g>` : '';
    const later = `<rect class="card later" x="${D + 7}" y="25" width="56" height="42" rx="6"/>`;
    const pz = I.kind === 'empty' ? pause : pauseC, risky = I.risky.includes('asis');
    const wed = {
      now: arrived('') + pz + (laterSaid() ? '' : eye(T, '', true)),
      keep: arrived('') + (I.owes ? owed(true) : '') + eye(T, 'stay'),
      fill: card(D, 'empty') + bars(D, 'bar copy') + from + (I.owes && I.fillOwes !== false ? owed(false) : '') + eye(D, 'move'),
      wait: arrived('') + pz + eye(T, ''),
      asis: arrived(risky ? 'risk' : 'ok') + (I.kind === 'empty' ? `<text class="zero" x="${cx(D)}" y="44" text-anchor="middle">0 rows</text>` : '') + (I.owes ? owed(false) : '') + eye(D, 'move'),
      accept: later + arrived('ok') + tick + eye(D, 'move'),
      fix: card(D, 'sent') + bars(D, 'bar fresh') + tick + eye(D, 'move'),
      stay: (I.nowHow === 'keep' ? arrived('') : I.nowHow === 'asis' ? arrived('ok') : card(D, 'empty') + bars(D, 'bar copy')) + (I.stayFinal ? (I.nowHow === 'keep' ? '' : doneMk) : owed(true)) + eye(T === sees ? T : D, 'stay'),
    }[k];
    const tmr = I.tomorrow && I.kind === 'shift' && ['asis', 'accept', 'keep', 'wait'].includes(k) ? `<path class="tmra" d="M180 40h7m-3-3 3 3-3 3"/><text class="day" x="212" y="12" text-anchor="middle">${esc(I.tomorrow)}</text><rect class="card later2" x="192" y="25" width="40" height="30" rx="5"/>${k === 'accept' ? `<g transform="translate(212 40)"><g class="tick"><circle class="tkb" r="7.5"/><path class="tkp" d="M-3.4 .2l2.2 2.3 4.4-4.6"/></g></g>` : `<g transform="translate(203.2 31.2) scale(1.1)"><g class="pzp"><path fill-rule="evenodd" d="${PZ_D}"/></g></g>`}` : '';
    return `<svg class="pic pic-${k}" viewBox="0 0 ${tmr || (back && k === 'fill') ? 240 : 200} 86" aria-hidden="true">${base}${wed}${tmr}</svg>`;
  }
  const optDetail = (k) => esc(HOW[k].what);
  let picTimer = null;
  function stopPics() { clearInterval(picTimer); picTimer = null; }
  // a choice acts out what it does: once when the choices are shown, when pointed at, and now and then while it is chosen
  function replay(el) { if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return; el.style.setProperty('--pd', '0ms'); el.classList.remove('play'); void el.getBoundingClientRect(); el.classList.add('play'); }
  // peer:owner (r3): the day named as design's Today helper names it (window.smDay) where the page has it; otherwise the
  // same calls by this panel's own rule: today is the day on screen, unless readers are already on a later day
  const DK_DAY = { is: (iso) => !!iso && iso === (laterSaid() ? M.latest.iso : DC().iso), date: (iso) => (iso === DC().iso ? DC().today : M.latest && iso === M.latest.iso ? M.latest.label : iso), text: (iso, d) => (DK_DAY.is(iso) ? 'Today' : d ?? DK_DAY.date(iso)), mid: (iso, d) => (DK_DAY.is(iso) ? 'today' : d ?? DK_DAY.date(iso)), small: (iso) => (DK_DAY.is(iso) ? ` <small class="tdate">${esc(DK_DAY.date(iso))}</small>` : '') };
  const dkDay = () => smDay;
  function openPanel(id, col, decide) {
    if (decide) return host.decide(M.day);
    closeToasts(); const d = dsOf(id); S.panel = { id, col }; if (col) S.colSeen = { id, col }; // peer:newcomer
    const L = layer();
    let body = ''; let dkAfter = null; // peer:owner (r3): the After column, drawn again when the choice changes
    const n = (d.builds || []).length;
    if (decide) {
      const I = issueOf(d), dc = DC(), fails = I.stoppedBy ? I.stoppedBy.map((says) => ({ says })) : (d.checks || []).filter((c) => c.mode === 'stops' && !c.column);
      const waits = outGroups(M.outputs.filter((o) => (d.builds || []).includes(o.id))).flatMap(([, l]) => l);
      const agree0 = !!(I.sugBy && I.noteOffer && I.note && I.agreeWho) && I.options.includes(I.suggest); // peer:owner: a named owner's pick comes chosen, her reason agreed
      const k0 = I.options.includes(I.suggest) ? I.suggest : null, pre = (k) => k === k0, btnOf = (k) => (I.buttons || {})[k] || HOW[k].button; // peer:owner (r3): the recommended choice comes chosen and ready, whoever recommends it
      const chainHtml = (ch) => { const cc = (c) => `<span class="cc ${c.mark}">${c.mark === 'pause' ? PAUSE : c.mark === 'warn' ? '<i class="cw" aria-hidden="true">◆</i>' : ''}<span><b>${esc(c.name)}</b> ${esc(c.says)}</span></span>`, [c0, ...rest] = ch; return `<div class="chain v">${cc(c0)}${rest.length ? `<i class="cv">↓ caught by</i><div class="cgrp">${rest.map(cc).join('')}</div>` : ''}</div>`; };
      const thenMark = (t) => (/^Done for now/.test(t) ? `<i class="tm owed">${HALF}</i>` : /^Stays/.test(t) ? `<i class="tm stays">${HOURGLASS}</i>` : '<i class="tm then">↳</i>');
      const optsOrder = I.suggest && I.options.includes(I.suggest) ? [I.suggest, ...I.options.filter((k) => k !== I.suggest)] : I.options;
      const ownerRec = !!(I.sugBy && I.noteOffer && I.note && I.agreeWho), sugWhy0 = I.sugWhy || (!I.sugBy && I.sugText && !/^Suggested$/i.test(I.sugText) ? cap(I.sugText.replace(/^[^:]+:\s*/, '')) : '');
      const initials = (n) => String(n || '').split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
      // peer:owner: what readers see after each choice, the day its picture puts the eye under; looking back where readers are on a later day
      const EYE = '<svg class="eyemk" viewBox="-9 -6 18 12" aria-hidden="true"><path d="M-8 0c2.4-3.4 5-5 8-5s5.6 1.6 8 5c-2.4 3.4-5 5-8 5s-5.6-1.6-8-5z"/><circle r="2.2"/></svg>';
      const seesOf = (k) => { const later = laterSaid(), what = { wait: dc.prev, keep: later ? `${dc.prev}’s data` : dc.prev, fill: `${later ? '' : dc.today + ', '}${d.short || 'the file'} from ${I.fillFrom}`, asis: later ? 'the file as it arrived' : `${dc.today} as it arrived`, accept: later ? 'the file as it arrived' : `${dc.today} as it arrived`, fix: later ? 'the corrected file' : `${dc.today}, corrected`, stay: 'what you decided' }[k]; return what ? `<span class="sees" title="${later ? 'What ' + esc(dc.today) + ' shows when someone looks back' : 'What readers see'}">${EYE}${later ? `${esc(dc.today)} shows ` : k === optsOrder[0] ? 'Readers see ' : ''}${esc(what)}</span>` : ''; }; // peer:owner: the first choice says "Readers see" once; the others keep the eye
      const recChip = `<span class="recchip${ownerRec ? ' owner' : I.sugBy ? ' record' : ' machine'}">${ownerRec ? `<i class="av" aria-hidden="true">${esc(initials(I.agreeWho))}</i>Recommended by ${esc(I.agreeWho)}${I.agreeRole ? `, ${esc(I.agreeRole)}` : ''}${I.agreeAt ? ` · ${esc(I.agreeAt)}` : ''}` : I.sugBy ? esc(I.sugText || 'What Larkspur did') : '<i class="mc" aria-hidden="true">✦</i>smaltfl’s reading of the evidence'}</span>`;
      const recWhy = ownerRec ? `<span class="sugwhy">“${esc(I.note)}”</span>${I.noteEvidence && !I.fig ? '<span class="sugev mini">The evidence behind it is beside the cause</span>' : ''}` : !I.sugBy && sugWhy0 ? `<span class="sugwhy mach">${esc(sugWhy0)}</span>${I.sugEvidence ? `<span class="sugev mach">${I.sugEvidence}</span>` : ''}` : '';
      // peer:owner (r3): one focal point, for the owner between meetings ("I don't know what to immediately focus on"). The
      // state and its one number; what readers see now and after the chosen choice, the recommended one chosen and ready;
      // one button. Everything else waits behind More: the choices, the evidence, what waits, your name, the request.
      const later = laterSaid(), pf = d.pendingFix || null, dayLab = dkDay().text(dc.iso, dc.d); // the pictures name today: Today, not Wed 27
      const sevW = I.sev && !I.nowHow ? (() => { const sv = I.sev.said, at = sv.indexOf(':'); return { word: cap(at < 0 ? sv : sv.slice(0, at)), why: at < 0 ? '' : sv.slice(at + 1).trim() }; })() : null;
      const cause = I.kind === 'rows' && sevW && sevW.why ? cap(sevW.why) : cap(String(I.why || ''));
      const nums = d.rowsToday != null ? `${fmt(d.rowsToday)} rows${d.rowsUsual ? `, usually about ${fmt(usualN(d.rowsUsual))}` : ''}` : '';
      // peer:design r4: today against usual in the one picture the app draws it with (Ctrl K's answer, look inside, the file)
      const bars = nowBars(d, { label: dkDay().is(dc.iso) ? 'rows today' : `rows ${dc.d}`, tone: I.sev && I.sev.level === 'mild' ? 'warn' : undefined });
      const state = `<div class="dk-top"><p class="dk-state">${sevW ? `<span class="dk-sev ${esc(I.sev.level)}">${esc(sevW.word)}</span>` : `<span class="dk-pz">${PAUSE}</span>`}<span>${esc(cause)}${nums && !bars ? ` · <b>${esc(nums)}</b>` : ''}</span></p>${bars}</div>`;
      // counts are icons: ⧗ 11, its list on hover and behind a tap
      const countB = `<button type="button" class="dk-count" data-waits title="${esc(`${outputsWait(n)}: ${waits.map((o) => plain(o.id)).join(', ')}`)}" aria-label="${esc(`${outputsWait(n)}: see which`)}">${HOURGLASS}<b>${n}</b></button>`;
      const nowSees = I.nowHow ? String(I.nowSaid || '').replace(/^Readers see /, '') : later ? 'Nothing yet' : dc.prev; // looking back, the question names the day
      const nowFate = I.nowHow ? `${HALF}<span>${esc(I.outSaid || `${n} outputs went out`)}</span>` : `<span class="dk-pz">${PAUSE}</span><span>Paused</span>${countB}`; // looking back, where readers are is said beside the question
      const afterSees = (k) => (later ? { wait: 'Nothing yet', keep: `${dc.prev}’s data`, fill: `${d.short || 'The file'} from ${I.fillFrom}`, asis: 'The file as it arrived', accept: 'The file as it arrived', fix: 'The corrected file', stay: 'What you decided' } : { wait: dc.prev, keep: dc.prev, fill: `${dc.today}, ${d.short || 'the file'} from ${I.fillFrom}`, asis: `${dc.today} as it arrived`, accept: `${dc.today} as it arrived`, fix: `${dc.today}, corrected`, stay: 'What you decided' })[k] || '';
      const afterFate = (k) => (k === 'fix' ? `<b class="dk-ok" aria-hidden="true">↻</b><span>${pf && pf.rows != null ? `${fmt(pf.rows)} rows · ` : ''}passed every check</span>`
        : I.risky.includes(k) && I.cons[k] ? `<b class="dk-x" aria-hidden="true">✕</b><span>${esc(I.cons[k])}</span>`
        : I.fileThen[k] ? `${thenMark(I.fileThen[k])}<span>${esc(cap(I.fileThen[k].replace(/^Stays on your list$/, 'Stays yours to decide')))}</span>` : '');
      // what it costs, on the card itself (a risky choice says its risk as its line above); then who recommends it, and why
      const afterCost = (k) => (I.cons[k] && !I.risky.includes(k) ? `<span class="dk-cost"><b class="dk-x" aria-hidden="true">✕</b><span>${esc(I.cons[k])}</span></span>` : '');
      const afterWho = (k) => (k !== I.suggest ? ''
        : ownerRec ? `<span class="dk-why" title="${esc(`Recommended by ${I.agreeWho}${I.agreeRole ? ', ' + I.agreeRole : ''}${I.agreeAt ? ', ' + I.agreeAt : ''}: “${I.note}”`)}"><i class="av" aria-hidden="true">${esc(initials(I.agreeWho))}</i><span><b>${esc(I.agreeWho)}</b>${I.agreeRole ? `, ${esc(I.agreeRole)}` : ''}</span></span><q class="dk-quote" title="${esc(I.note)}">${esc(I.note)}</q>`
        : sugWhy0 ? `<span class="dk-why mach"><i class="mc" aria-hidden="true">✦</i><span><b>smaltfl’s reading</b>: ${esc(sugWhy0)}</span></span>`
        : I.sugBy && I.sugText ? `<span class="dk-why"><span>${esc(I.sugText)}</span></span>` : '');
      dkAfter = (k) => (k ? `<div class="dk-after opt play${I.risky.includes(k) ? ' risk' : ''}" data-k="${k}" title="${esc(HOW[k].what)}"><span class="dk-lab">${k === I.suggest ? 'Recommended' : 'Your choice'}</span>${decidePic(k, d, dayLab)}<span class="dk-sees">${EYE}<b>${esc(afterSees(k))}</b></span><span class="dk-fate">${afterFate(k)}</span>${afterCost(k)}${afterWho(k)}</div>`
        : `<div class="dk-after none"><span class="dk-lab">After</span><span class="dk-fate">Pick what readers see under More</span></div>`);
      const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>';
      const hero = `<div class="dk-hero" role="group" aria-label="What readers see now, and after your choice"><div class="dk-now"><span class="dk-lab">Now</span>${decidePic(I.nowHow || 'now', d, dayLab)}<span class="dk-sees">${later && !I.nowHow ? '' : EYE}<b>${esc(nowSees)}</b></span><span class="dk-fate">${nowFate}</span></div><span class="dk-arrow">${ARROW}</span>${dkAfter(k0)}</div>`;
      // More: each block is there for one thing: pick another choice, check the evidence, see what waits, sign and ask
      const tile = (k, i) => `<label class="opt tile${pre(k) ? ' on' : ''}${k === I.suggest ? ' sug' : ''}${I.risky.includes(k) ? ' risk' : ''}" data-k="${k}"><input type="radio" name="dec" value="${k}" ${pre(k) ? 'checked' : ''}><span class="rtx"><b><i class="rd" aria-hidden="true"></i>${esc(btnOf(k))}${k === I.suggest ? ' <small class="dk-rec">Recommended</small>' : ''}<kbd class="tk" aria-hidden="true">${i + 1}</kbd></b>${seesOf(k)}${I.cons[k] ? `<span class="con">${esc(I.cons[k])}</span>` : ''}${(I.changes || {})[k] ? `<span class="chg">${esc(I.changes[k])}</span>` : ''}${I.fileThen[k] ? `<span class="tfile">${thenMark(I.fileThen[k])}${esc(cap(I.fileThen[k].replace(/^Done for now · /, '').replace(/^Stays on your list$/, 'Stays yours to decide')))}</span>` : ''}</span></label>`;
      const fig = I.fig ? `<div class="decfig">${I.fig}${I.rowsDiff || ''}${I.tune ? `<details class="tunefold"><summary>If it keeps happening ›</summary><div class="tune"><p>${I.tune.html}</p><div class="tuneacts">${I.tune.level ? `<button type="button" class="btn sm" data-level>${esc(I.tune.level)}</button>` : ''}<button type="button" class="btn sm" data-tune>${esc(I.tune.button)}</button></div>${I.tune.levelSaid ? `<small class="tunesaid">${esc(I.tune.levelSaid)}</small>` : ''}</div></details>` : ''}</div>` : '';
      const fix = d.pendingFix && I.chain ? (() => { const fs = I.fixSaid || 'It passed every check', m = fs.match(/^([\s\S]*?)[.;]?\s*(It passed every check)\.?$/), more = m ? m[1].trim() : ''; return `<div class="fixchip"><b>↻ A corrected file came${I.fixAt ? ` at ${esc(I.fixAt)}` : ''}</b> · <span>${esc(m ? m[2] : fs)}</span>${more ? `<details class="fixmore"><summary>How it compares ›</summary><p>${esc(more)}.</p></details>` : ''}</div>`; })() : '';
      const why = I.chain ? `<details class="whyp"><summary>Why it paused ›</summary>${I.chainHtml || chainHtml(I.chain)}</details>` : fails.length ? `<p class="dk-by"><span class="dk-h">Paused by</span>${fails.map((c) => `<span class="sbc">${esc(c.says)}</span>`).join('')}</p>` : '';
      const month = !I.fig && (d.days || []).length ? `<div class="dk-month"><span class="dk-h">This month</span>${picMonth(d.days)}<p class="apline">${stripLine(d.days)}</p></div>` : ''; // peer:design r4: the month as Ctrl K draws it
      const ask = I.ask && !d.pendingFix ? `<p class="dk-ask"><button type="button" class="link" data-askcopy>Copy a request for the file</button><button type="button" class="link" data-draft>Read it</button></p><p class="pdraft2" hidden>${esc(requestText(d))}</p>` : '';
      const more = `<details class="dk-more"><summary><span class="dk-mo">More</span><span class="dk-hint">other choices, why it paused</span></summary><div class="dk-in">`
        + `<section class="dk-sec dk-choices"><h4 class="dk-h">Choices</h4><div class="opts tiles rows" role="radiogroup" aria-label="What readers see">${optsOrder.map(tile).join('')}</div></section>`
        + `<section class="dk-sec dk-ev">${fig}${fix}${why}${month}</section>`
        + `<section class="dk-sec dk-waits"><h4 class="dk-h">${HOURGLASS} ${esc(I.nowHow ? (I.outSaid || `${n} outputs went out`) : `${outputsWait(n)} on it`)}</h4><p>${waits.map((o) => `<span title="${esc(o.about || '')}">${esc(plain(o.id))}</span>`).join(' · ')}</p></section>`
        + `<section class="dk-sec dk-tools"><label class="whoas"><span>Deciding as</span><input id="dec-who" type="text" value="${esc(M.me || '')}" placeholder="your name and role" autocomplete="name"></label>${ask}</section>`
        + `</div></details>`;
      // the footer: what goes on record with your tap, and the one button; the box for your own words opens on demand
      const foot = `<div class="dfoot dk-foot"><label class="whyrow"><span class="whyfrom" hidden></span><button type="button" class="userec" data-userec hidden></button><textarea id="dec-note" class="why two" rows="2" aria-label="Why: kept with the decision and your name" placeholder="Why? Pick a choice first"></textarea></label><div class="dk-record"><p class="onrec" aria-live="polite"></p><button type="button" class="link ownwords" data-ownwords hidden>Write your own reason</button></div><div class="dacts"><button class="btn primary${k0 && I.risky.includes(k0) ? ' risk' : ''}" data-confirm${k0 ? '' : ' disabled'}>${esc(k0 ? btnOf(k0) : 'Choose one')} <kbd class="tk" aria-hidden="true">↵</kbd></button></div></div>`;
      body = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="pichatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hp" width="1.5" height="3.2"/></pattern></defs></svg>` + state + hero + more + foot; // peer:owner (r3)
    }
    else if (col) {
      const c = d.columns.find((x) => x.name === col);
      const vals = c.today || c.ages;
      const facts = [[{ key: 'Key', category: 'Code', number: 'Number', date: 'Date', text: 'Text' }[c.role] || c.role, 'kind of column'], c.distinct ? [fmt(c.distinct), 'distinct values'] : null, c.distinct ? [fmt(c.blanks || 0), 'blank'] : null].filter(Boolean);
      body = `<p>${esc(c.meaning || 'No meaning written yet.')}</p><div class="facts">${facts.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>`
        + `<h3>Kind of column</h3><p>${{ key: 'The key: one per row', category: 'A code from a list', number: 'A number', date: 'A date and time', text: 'Free text' }[c.role] || c.role}</p>` + `${vals ? `<h3>Today</h3><div class="dist">${vals.slice(0, 8).map((t) => `<div class="drow"><span>${esc((c.labels || {})[t.value] || t.value)}</span><span class="dtrack"><span class="dfill" style="width:${(t.share * 100).toFixed(1)}%"></span></span><span class="num">${(t.share * 100).toFixed(t.share < .1 ? 1 : 0)}%</span></div>`).join('')}</div>` : c.examples ? `<h3>Examples</h3><p class="exs">${c.examples.slice(0, 6).map((x) => `<code>${esc(x)}</code>`).join(' ')}</p>` : ''}${M.joins.filter((j) => j.from === id && j.col === col).map((j) => `<h3>Joins</h3><p>${esc(j.rel)} <b>${esc(dsOf(j.to)?.short)}</b> on ${esc(j.toCol)}</p>`).join('')}<button class="btn" data-rows>Explore rows ›</button>`;
    } else body = `<p>${esc(d.description || '')}</p><h3>One row is</h3><p>${esc(d.one || '–')}</p><h3>Today</h3><p>${d.rowsToday != null ? fmt(d.rowsToday) + ' rows' : 'No file yet'}${d.state === 'waiting' ? ' · <b style="color:var(--bad)">paused</b>' : ''}</p><h3>Checks</h3><p>${(d.checks || []).length} checks</p><button class="btn" data-rows>Explore rows ›</button>`;
    L.innerHTML = `<div class="scrim" data-close></div><aside class="panel${decide ? ' decide' : ''}" aria-label="${decide ? 'Decide' : 'Details'}"><div class="ph"><div class="ctx">${decide ? esc(d.short) : `${esc(kindOf(d.kind).name)} · ${esc(d.short)}${col ? ' · column' : ''}`}</div><div class="t"><h2 style="${col ? 'font-family:var(--mono)' : ''}">${decide /* peer:owner (r3): the question; today named by design's helper where it exists (dkDay) */ ? (() => { const T = dkDay(), c = DC(), lat = M.latest && M.latest.iso > c.iso ? M.latest : null; return `What should readers see ${esc(T.mid(c.iso, 'for ' + c.today))}?${T.small(c.iso)}${!T.is(c.iso) && lat ? ` <small class="dk-date">readers already see ${esc(T.mid(lat.iso, lat.label))}</small>` : ''}`; })() : esc(col || d.short)}</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb">${body}</div></aside>`;
    L.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closePanel()));
    L.querySelectorAll('[data-rows]').forEach((b) => (b.onclick = () => openRows(id, col)));
    L.dataset.agree = '';
    if (decide) {
      const btn = L.querySelector('[data-confirm]'), after = L.querySelector('.after b'), tiles = [...L.querySelectorAll('.opt.tile')];
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) tiles.forEach((o) => o.classList.remove('play'));
      tiles.forEach((o) => o.addEventListener('mouseenter', () => replay(o)));
      L.querySelectorAll('input[name="dec"]').forEach((x) => (x.onchange = () => {
        tiles.forEach((o) => o.classList.toggle('on', o.querySelector('input').checked));
        replay(tiles.find((o) => o.classList.contains('on')));
        { const on = tiles.find((o) => o.classList.contains('on')); if (on) requestAnimationFrame(() => on.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })); }
        btn.innerHTML = `${esc((issueOf(d).buttons || {})[x.value] || HOW[x.value].button)} <kbd class="tk" aria-hidden="true">↵</kbd>`; if (after) after.textContent = HOW[x.value].after(n) + '.'; const und = L.querySelector('.undoable'); if (und) und.textContent = (owesAfter(issueOf(d), x.value) ? 'Late file waits for your OK · ' : '') + (x.value === 'accept' && issueOf(d).acceptUndo ? issueOf(d).acceptUndo : UNDO[x.value].replace('You can undo this', 'undo anytime'));
        const askRow = L.querySelector('.askfile'); if (askRow) { const show = owesAfter(issueOf(d), x.value); askRow.hidden = !show; askRow.querySelector('input').checked = show; if (!show) { const p2 = L.querySelector('.pdraft2'); if (p2) p2.hidden = true; } }
        btn.classList.toggle('risk', issueOf(d).risky.includes(x.value));
        syncWhy(x.value, true);
        { const tf = L.querySelector('details.tunefold'); if (tf) tf.open = false; } // peer:owner (r2): picking what readers see folds the limit tools, the other way to settle the day
        { const ha = L.querySelector('.dk-after'); if (ha && dkAfter) { ha.outerHTML = dkAfter(x.value); replay(L.querySelector('.dk-after')); } } // peer:owner (r3): After shows the choice now picked
      }));
      // peer:owner (r3): the After picture plays when it is shown and when the choice changes, not on a timer (motion with a job only)
      // agreeing: her reason quoted beside the choice, the box left for words of your own
      const recWords = () => { const I2 = issueOf(d); if (I2.sugBy && I2.noteOffer && I2.note && I2.agreeWho) return { text: I2.note, who: I2.agreeWho, kind: '1' }; const w = I2.sugWhy || (!I2.sugBy && I2.sugText && !/^Suggested$/i.test(I2.sugText) ? cap(I2.sugText.replace(/^[^:]+:\s*/, '')) : ''); return w ? { text: w, who: 'smaltfl', kind: 'm' } : null; };
      const needsWhy = (k) => !!k && k !== 'wait' && k !== 'stay';
      function recordLine(k) {
        if (!k) return '';
        const nt = L.querySelector('#dec-note'), v = nt.value.trim(), I2 = issueOf(d), lab = esc((I2.buttons || {})[k] || HOW[k].button), rw = recWords();
        const whose = L.dataset.agree === '1' ? `${esc(rw.who)}’s reason, agreed` : L.dataset.agree === 'm' ? 'smaltfl’s reading, agreed' : 'your words', me = (L.querySelector('#dec-who')?.value || '').trim();
        if (L.dataset.agree === '1' && v) return `<b>On record when you tap Agree:</b> ${me ? esc(me) : 'you'} · <i>${whose}</i>`; // peer:owner (r3): the choice is on the button beside it // peer:owner: her words are on the tile above; nothing is decided before the tap
        return `<b>On record with your tap:</b> ${me ? esc(me) : 'you'}${v ? ` · <i>${whose}</i>` : needsWhy(k) ? ' · <span class="need">needs a reason</span>' : ' · no reason given'}`; // peer:owner (r3) // peer:owner (r2): the words are in the box right below, so not quoted again // peer:owner: said as still to come
      }
      function syncWhy(k, fromChoice) {
        const nt = L.querySelector('#dec-note'), wf = L.querySelector('.whyfrom'), rw = recWords(), I2 = issueOf(d); if (!nt) return;
        if (fromChoice && k !== I2.suggest && nt.dataset.auto === '1') { nt.value = ''; nt.dataset.auto = ''; }
        if (fromChoice && rw && (rw.kind === '1' || rw.kind === 'm') && k === I2.suggest && !nt.value.trim() && L.dataset.own !== '1') { nt.value = rw.text; nt.dataset.auto = '1'; } // peer:owner (r3): smaltfl's reading agreed by default too, as a named owner's is
        const ur = L.querySelector('[data-userec]'); if (ur) { const show = !!(rw && k === I2.suggest && nt.dataset.auto !== '1'); ur.hidden = !show; ur.textContent = rw ? (rw.kind === '1' ? `Use ${rw.who}’s reason ›` : 'Use smaltfl’s reading ›') : ''; }
        const kept = !!(rw && k === I2.suggest && nt.dataset.auto === '1' && nt.value.trim() === rw.text.trim());
        L.dataset.agree = kept ? rw.kind : '';
        if (wf) { wf.hidden = !kept; wf.textContent = kept ? (rw.kind === '1' ? `${rw.who}’s reason, quoted: keep it to agree, or write your own` : 'smaltfl’s reading of the evidence: keep it, or write your own') : ''; }
        nt.placeholder = !k ? 'Why? Pick a choice first' : needsWhy(k) ? 'Why this choice? Needed: it is kept with your name' : 'Why? Optional: it is kept with your name';
        nt.classList.toggle('need', needsWhy(k) && !nt.value.trim());
        btn.disabled = !k || (needsWhy(k) && !nt.value.trim());
        const r = L.querySelector('.onrec'); if (r) r.innerHTML = recordLine(k);
        // peer:owner: agreeing needs no box: it folds, a link opens your own words, and the one button says Agree
        { const agP = L.dataset.agree === '1', ag = !!L.dataset.agree, wr = L.querySelector('.whyrow'), ow = L.querySelector('[data-ownwords]'), lab = k ? ((I2.buttons || {})[k] || HOW[k].button) : ''; if (ag) L.dataset.own = ''; if (wr) wr.classList.toggle('folded', ag); if (ow) ow.hidden = !ag; if (k) btn.innerHTML = `${agP /* peer:owner (r3) */ ? `Agree: ${esc(lab.charAt(0).toLowerCase() + lab.slice(1))}` : esc(lab)} <kbd class="tk" aria-hidden="true">↵</kbd>`; }
      }
      function setAgree() {}
      const cb0 = L.querySelector('.agreecb');
      if (cb0) {
        const tileOf = cb0.closest('.opt.tile'), pick = () => { const r = tileOf.querySelector('input[name="dec"]'); if (!r.checked) { r.checked = true; r.dispatchEvent(new Event('change')); } };
        cb0.addEventListener('click', (ev) => ev.stopPropagation());
        cb0.onchange = () => { if (cb0.checked) pick(); setAgree(cb0.checked); const c0 = L.querySelector('input[name="dec"]:checked'); btn.disabled = !c0; };
        L.querySelector('[data-agreelab]').addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); cb0.checked = !cb0.checked; cb0.dispatchEvent(new Event('change')); });
      }
      const aw0 = L.querySelector('[data-addwords]'); if (aw0) aw0.onclick = (ev) => { ev.preventDefault(); const wr = L.querySelector('.whyrow'); wr.classList.remove('folded'); aw0.hidden = true; L.querySelector('#dec-note').focus(); };
      const note0 = L.querySelector('#dec-note'); syncWhy(L.querySelector('input[name="dec"]:checked')?.value || null, true); note0.addEventListener('input', () => { const rw = recWords(); note0.dataset.auto = rw && note0.value.trim() === rw.text.trim() ? '1' : ''; syncWhy(L.querySelector('input[name="dec"]:checked')?.value || null, false); });
      const urb = L.querySelector('[data-userec]'); if (urb) urb.onclick = (ev) => { ev.preventDefault(); const rw = recWords(); if (!rw) return; note0.value = rw.text; note0.dataset.auto = '1'; syncWhy(L.querySelector('input[name="dec"]:checked')?.value || null, false); note0.focus(); };
      const own0 = L.querySelector('[data-ownwords]'); if (own0) own0.onclick = (ev) => { ev.preventDefault(); L.dataset.own = '1'; note0.value = ''; note0.dataset.auto = ''; syncWhy(L.querySelector('input[name="dec"]:checked')?.value || null, false); note0.focus(); }; // peer:owner
      const whoIn = L.querySelector('#dec-who'); if (whoIn) whoIn.addEventListener('input', () => syncWhy(L.querySelector('input[name="dec"]:checked')?.value || null, false));
      L.querySelectorAll('[data-level]').forEach((b) => (b.onclick = () => { const n0 = L.querySelector('#dec-note'), nt = n0 && n0.dataset.auto !== '1' ? n0.value.trim() : ''; closePanel(); const said = M.onLevel ? M.onLevel(d, nt) : ''; renderChrome(); if (said) toast(said, true); }));
      const tuneBtn = L.querySelector('[data-tune]'); if (tuneBtn) tuneBtn.onclick = () => { const n0 = L.querySelector('#dec-note'), nt = n0 && n0.dataset.auto !== '1' ? n0.value.trim() : ''; closePanel(); const said = M.onTune ? M.onTune(d, nt) : ''; renderChrome(); if (said) toast(said, true); };
      // the panel takes the keyboard: focus on the chosen option, so 1 to 4, the arrows and Enter work at once
      { const pn = L.querySelector('.panel'); if (btn.disabled) { pn.setAttribute('tabindex', '-1'); pn.focus({ preventScroll: true }); } else btn.focus({ preventScroll: true }); } // peer:owner (r3): the one button takes the keyboard (Enter decides, 1 to 4 choose); the choices wait behind More
      const draftBtn = L.querySelector('[data-draft]'); if (draftBtn) draftBtn.onclick = (ev) => { ev.preventDefault(); const p2 = L.querySelector('.pdraft2'); p2.hidden = !p2.hidden; ev.target.textContent = p2.hidden ? 'Read it' : 'Hide it'; };
      L.querySelectorAll('[data-waits]').forEach((b) => (b.onclick = (ev) => { ev.preventDefault(); const mo = L.querySelector('.dk-more'); if (mo) mo.open = true; const w = L.querySelector('.dk-waits'); if (w) requestAnimationFrame(() => w.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })); })); // peer:owner (r3): ⧗ 11 opens the list
      const askB = L.querySelector('[data-askcopy]'); if (askB) askB.onclick = (ev) => { ev.preventDefault(); copyText(requestText(d), true); d.asked = new Date(); askB.textContent = 'Request copied: paste it to the sender'; }; // peer:owner (r3): asking for the file is its own tap
      // keys: 1 to 4 choose, Enter confirms, Esc cancels (the page's own Esc)
      // one handler a panel: assigned, not added, so a panel opened before can't act on this one
      L.onkeydown = (ev) => {
        if (!btn.isConnected) return;
        if (ev.target.matches('input[type=text], textarea') && ev.key !== 'Enter') return;
        if (ev.target.matches('textarea') && ev.shiftKey) return;
        if (/^[1-4]$/.test(ev.key)) { const x = tiles[+ev.key - 1]?.querySelector('input'); if (x) { x.checked = true; x.dispatchEvent(new Event('change')); x.focus(); } ev.preventDefault(); }
        else if (ev.key === 'Enter' && !ev.target.matches('button, a')) { ev.preventDefault(); if (btn.disabled) L.querySelector('#dec-note').focus(); else btn.click(); }
      };
      btn.onclick = () => {
        const chosen = L.querySelector('input[name="dec"]:checked'); if (!chosen) return;
        const how = chosen.value, agreeK = how === issueOf(d).suggest ? L.dataset.agree : '', note = agreeK === '1' ? '' : (L.querySelector('#dec-note')?.value || '').trim(), askIt = L.querySelector('#dec-ask')?.checked, text = requestText(d);
        agreeNow = agreeK === '1' ? true : agreeK === 'm' ? 'machine' : false; decWho = (L.querySelector('#dec-who')?.value || '').trim();
        closePanel();
        if (askIt) { copyText(text, true); d.asked = new Date(); }
        if (how === 'wait') { d.waited = { at: new Date(), note: note || null }; if (M.onDecided) M.onDecided(d, 'wait', note, agreeNow, decWho); agreeNow = false; renderChrome(); return toast(askIt ? 'Recorded: you chose to wait for the file. The request is copied for you to send.' : 'Recorded: you chose to wait for the file.'); }
        if (how === 'fix') return replaceFile(id, d.pendingFix || { name: `${d.id}_${DC().iso}.csv`, rows: d.rowsUsual ? usualN(d.rowsUsual) : 0 }, note);
        if (how === 'stay') { const fin = issueOf(d).stayFinal; if (M.onDecided) M.onDecided(d, 'stay', note, agreeNow, decWho); agreeNow = false; renderChrome(); return toast(fin ? 'Recorded: you kept what you decided. The corrected file stays unpublished.' : 'Recorded: you kept what you decided. The corrected file waits for your OK.'); }
        applyDecision(id, how, note, askIt);
      };
    }
  }
  // a decision made: the file and what is built from it change state, and every view says so at once, with a way back
  let decWho = '';
  function applyDecision(id, how, note, asked) {
    const d = dsOf(id); if (!d || d.state !== 'waiting') return;
    const I = issueOf(d), c = DC(), owes = how === 'keep' || how === 'fill' || (how === 'asis' && I.owes);
    snap(d); d.state = owes ? 'decided' : 'ok'; d.how = how; d.owed = owes; d.note = note || null; if (!owes) d.settled = how;
    for (const o of M.outputs) if ((d.builds || []).includes(o.id)) { o.waiting = false; o.released = how; }
    if (M.onDecided) M.onDecided(d, how, note, agreeNow, decWho); agreeNow = false;
    S.ver++; render(true); flashChanged();
    toast((laterSaid() ? `${c.today} decided: ${HOW[how]?.said || how}.` : how === 'keep' ? `Decided: readers see ${c.prev} for ${d.short}.` : how === 'fill' ? `Decided: ${c.wd} is published with ${I.fillFrom}’s ${d.short}, marked as filled.` : how === 'accept' ? `Accepted: ${d.short}’s new level is the usual one from ${c.today}.` : `Decided: ${c.wd} is published as it arrived.`) + (asked ? ' The request for the file is copied for you to send.' : ''), true);
  }
  function snap(d) { (M.hist ||= []).push({ id: d.id, state: d.state, how: d.how, rowsToday: d.rowsToday, owed: d.owed, replaced: d.replaced, outs: M.outputs.map((o) => [o.waiting, o.released, o.rebuilt]) }); }
  function undo() {
    return;
    if (M.onUndo) return M.onUndo();
    const h = (M.hist || []).pop(); if (!h) return; const d = dsOf(h.id); if (!d) return;
    Object.assign(d, { state: h.state, how: h.how, rowsToday: h.rowsToday, owed: h.owed, replaced: h.replaced });
    M.outputs.forEach((o, i) => { [o.waiting, o.released, o.rebuilt] = h.outs[i]; });
    S.ver++; render(true); flashChanged();
    toast(h.state === 'waiting' ? `Undone: ${DC().today} is paused again.` : 'Undone: back to the decision, with the corrected file still owed.');
  }
  function flashChanged() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll('.ds.decided, .ds.waiting, .outs, .alert, .fs, #waits, .waitpill, .mosaic i.decided, .mosaic i.waiting').forEach((x) => { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); });
      setTimeout(() => root.querySelectorAll('.flash').forEach((x) => x.classList.remove('flash')), 1300);
    }));
  }
  function undoDecision() { undo(); }
  const closeToasts = () => root.querySelectorAll('.toast').forEach((x) => x.remove());
  function toast(text, undo) {
    root.querySelectorAll('.toast').forEach((x) => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    root.append(t);
    if (undo) t.querySelector('button').onclick = () => { t.remove(); undo(); };
    const ms = (M && M.toastMs) || 6000; setTimeout(() => t.classList.add('gone'), ms); setTimeout(() => t.remove(), ms + 600);
  }
  function openReplace(id) {
    return host.decide(M.day);
    closeToasts(); const d = dsOf(id); S.panel = { replace: id };
    const L = layer();
    L.innerHTML = `<div class="scrim" data-close></div><aside class="panel" aria-label="Replace the file"><div class="ph"><div class="ctx">${esc(kindOf(d.kind).name)} · ${esc(d.short)}</div><div class="t"><h2>Replace ${esc(DC().wd)}’s file</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb">
      <p>${issueOf(d).kind === 'empty' ? `The file that arrived on ${esc(DC().today)} had <b>0 rows</b>${d.rowsUsual ? `; a usual day has about ${fmt(usualN(d.rowsUsual))}` : ''}.` : `The file that arrived on ${esc(DC().today)} ${esc(issueOf(d).why)}.`} Send the corrected export and the day runs again with it, under the same checks.</p>
      <div class="drop"><input type="file" id="repl-file" accept=".csv,text/csv"><label for="repl-file" class="btn">Choose a file…</label><span>or</span><button class="btn" data-sample>Use the demo’s corrected file</button></div>
      <div class="picked" hidden></div>
      <p class="after">After this: <b>the day runs again under the same ${(d.checks || []).length} checks, then waits for your OK.</b> Publish it and the ${(d.builds || []).length} outputs are rebuilt; if a check fails, the day pauses again and readers stay on ${esc(DC().prev)}.</p>
      <div class="dacts"><button class="btn" data-close>Cancel</button><button class="btn primary" data-send disabled>Send it again</button></div></div></aside>`;
    const picked = L.querySelector('.picked'), send = L.querySelector('[data-send]'); let chosen = null;
    const show = (name, rows, cols, ok) => { chosen = { name, rows }; picked.hidden = false; picked.innerHTML = `<b>${esc(name)}</b><span>${fmt(rows)} rows · ${cols} columns</span><span class="${ok ? 'okt' : 'warnt'}">${ok ? '✓ Its columns match the description' : '◆ Its columns differ from the description'}</span>`; send.disabled = false; send.textContent = `Send it again · ${fmt(rows)} rows`; };
    L.querySelector('[data-sample]').onclick = () => show(`${d.id}_${DC().iso}.csv`, d.rowsUsual ? Math.round((d.rowsUsual[0] + d.rowsUsual[1]) / 2) : 1000, d.columns.length, true);
    L.querySelector('#repl-file').onchange = (ev) => { const f = ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const lines = String(rd.result).split(/\r?\n/).filter((x) => x.trim()); const head = (lines[0] || '').split(',').map((x) => x.trim().replace(/^"|"$/g, '')); show(f.name, Math.max(0, lines.length - 1), head.length, d.columns.every((c) => head.includes(c.name))); }; rd.readAsText(f); };
    send.onclick = () => {
      if (!chosen) return;
      // the file runs under the day's checks; a corrected file never publishes on its own: it waits for your OK
      const pb = L.querySelector('.pb'), k = (d.checks || []).length, nb = (d.builds || []).length;
      pb.innerHTML = `<div class="ranok"><span class="rk">✓</span><div><b>${esc(chosen.name)} passed all ${k} checks</b><span>${fmt(chosen.rows)} rows${d.rowsUsual ? ` · a usual day has about ${fmt(usualN(d.rowsUsual))}` : ''}</span></div></div><p>It waits for your OK. Publish it and the ${nb} outputs built from ${esc(d.short)} are rebuilt with it; readers move from ${esc(DC().prev)} to ${esc(DC().today)}.</p><div class="dacts"><button class="btn" data-later>Not now</button><button class="btn primary" data-pub>Publish ${esc(DC().today)} <kbd class="tk" aria-hidden="true">↵</kbd></button></div>`;
      pb.querySelector('[data-later]').onclick = () => { d.pendingFix = chosen; closePanel(); renderChrome(); toast('The corrected file waits for your OK.'); };
      const pub = pb.querySelector('[data-pub]'); pub.onclick = () => { closePanel(); replaceFile(id, chosen); }; pub.focus({ preventScroll: true });
      pb.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.target.matches('button')) { ev.preventDefault(); pub.click(); } });
    };
    L.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closePanel()));
  }
  function replaceFile(id, chosen, note) {
    const d = dsOf(id); snap(d);
    d.state = 'ok'; d.replaced = chosen; d.owed = false; d.rowsToday = chosen.rows; delete d.how; delete d.pendingFix;
    for (const o of M.outputs) if ((d.builds || []).includes(o.id)) { o.waiting = false; o.released = undefined; o.rebuilt = true; }
    if (M.onDecided) M.onDecided(d, 'fix', note, agreeNow, decWho); agreeNow = false;
    S.ver++; render(true); flashChanged();
    toast(laterSaid() ? `${DC().today} decided: its corrected file went out. Readers stay on ${laterSaid()}.` : M.quietBanner ? `${DC().today} decided: its corrected file went out.` : `Published: ${fmt(chosen.rows)} rows passed all ${(d.checks || []).length} checks, and readers now see ${DC().today}.`, true);
  }
  // a dataset's rows: a few to look at, under its columns, with what each column holds
  // a file's rows beside the map, from the file the day's recorded run read (checked against its hash by the page): the
  // day's own, or, where the day is paused or arrived empty, the day readers see; filter, sort and keep a value's rows
  // here, the pipeline a tap further for its checks, its history and what is built from it
  function openRows(id, tapped) {
    closeToasts(); const d = dsOf(id); S.panel = { rows: id };
    const readers = (d.state === 'waiting' || d.rowsToday === 0) && M.dayCtx && M.dayCtx.prevIso ? M.dayCtx.prevIso : null, day = readers || M.day || null;
    const L = layer();
    L.innerHTML = `<div class="scrim" data-close></div><aside class="panel wide rowsp" aria-label="Rows"><div class="ph"><div class="ctx">${esc(kindOf(d.kind).name)} · ${esc(d.short)} · rows</div><div class="t"><h2>${esc(d.short)}</h2><button class="x" data-close aria-label="Close">✕</button></div><div class="pacts"><button type="button" class="btn sm" data-pipe>Open in the pipeline ›</button><span>its checks, its history and what is built from it</span></div></div><div class="pb"><div class="rowbar"><p class="rcount" aria-live="polite">Reading the file…</p><input type="search" id="rows-q" placeholder="Filter the rows" aria-label="Filter the rows"></div><div class="rpicks"></div><div class="tablewrap"><table class="rows"><thead></thead><tbody></tbody></table></div><div class="rmore"></div><h3>Columns</h3><ul class="colsum">${d.columns.map((c) => `<li><button data-col="${esc(c.name)}"><code>${esc(c.name)}</code><span>${esc(c.meaning || c.title || '')}</span><span class="go">›</span></button></li>`).join('')}</ul></div></aside>`;
    L.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closePanel()));
    L.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => openPanel(id, b.dataset.col)));
    L.querySelector('[data-pipe]').onclick = () => { closePanel(true); host.openCard(id, 'data', readers); };
    const show = (data) => {
      if (S.panel?.rows !== id) return;
      const keyCols = new Set(d.columns.filter((c) => c.role === 'key').map((c) => c.name)), ti = tapped ? data.columns.indexOf(tapped) : -1;
      const order = ti < 0 ? data.columns.map((_, i) => i) : [...data.columns.map((c, i) => (keyCols.has(c) && i !== ti ? i : -1)).filter((i) => i >= 0), ti, ...data.columns.map((c, i) => (!keyCols.has(c) && i !== ti ? i : -1)).filter((i) => i >= 0)];
      const cols = order.map((i) => data.columns[i]), all = data.rows.map((r) => order.map((i) => r[i]));
      const head = L.querySelector('thead'), body = L.querySelector('tbody'), count = L.querySelector('.rcount'), more = L.querySelector('.rmore');
      let sortBy = -1, dir = 1, q = '', limit = 50, pick = null;
      const draw = () => {
        head.innerHTML = `<tr>${cols.map((c, i) => `<th scope="col" class="${keyCols.has(c) ? 'k' : ''}${c === tapped ? ' tap' : ''}" aria-sort="${sortBy === i ? (dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sort="${i}">${esc(c)}<span class="sa">${sortBy === i ? (dir > 0 ? '▲' : '▼') : ''}</span></button></th>`).join('')}</tr>`;
        let rows = q ? all.filter((r) => r.some((v) => String(v).toLowerCase().includes(q))) : all;
        if (pick) rows = rows.filter((r) => String(r[pick.i] ?? '') === pick.v);
        const chips = L.querySelector('.rpicks'); chips.innerHTML = pick ? `<button type="button" class="rpick" data-unpick><code>${esc(cols[pick.i])}</code> = ${esc(pick.v || 'blank')} <span aria-hidden="true">✕</span></button>` : '<span class="rhint">Tap a value to keep only its rows</span>';
        chips.querySelector('[data-unpick]')?.addEventListener('click', () => { pick = null; limit = 50; draw(); });
        if (sortBy >= 0) rows = rows.slice().sort((a, b) => { const x = a[sortBy], y = b[sortBy], bx = x == null || x === '', by = y == null || y === ''; if (bx || by) return bx === by ? 0 : bx ? 1 : -1; const nx = parseFloat(x), ny = parseFloat(y); return (isFinite(nx) && isFinite(ny) && /^-?[\d.]+$/.test(x) && /^-?[\d.]+$/.test(y) ? nx - ny : String(x).localeCompare(String(y))) * dir; });
        const shown = rows.slice(0, limit), other = !!M.dayCtx && data.day !== DC().iso, whose = other ? `${DC().prev}’s` : `${DC().today}’s`;
        const why = other ? (d.rowsToday === 0 ? `No rows arrived ${dW() === 'today' ? 'today' : 'on ' + DC().d}: these are ${whose}, the rows readers see. ` : `${dW() === 'today' ? 'Today' : DC().d} is paused: these are ${whose} rows, the ones readers see. `) : '';
        count.textContent = why + (q || pick ? `${fmt(rows.length)} of ${fmt(all.length)} rows${q ? ` have “${q}”` : ''}${pick ? `${q ? ' and' : ' have'} ${cols[pick.i]} = ${pick.v || 'blank'}` : ''}` : `${fmt(data.total)} rows in ${whose} file${shown.length < data.total ? `, the first ${fmt(shown.length)} shown` : ''}`) + (all.length < data.total ? ` · the first ${fmt(all.length)} can be filtered and sorted here` : '');
        const flag = (v) => (/^(fail|failed|failing)$/i.test(v) ? ' bad' : /^(not_assessed|unknown|missing)$/i.test(v) ? ' warn' : '');
        const tc = (c) => (c === tapped ? ' tapc' : ''); // peer:newcomer: the tapped column, marked down its cells
        body.innerHTML = shown.length ? shown.map((r) => `<tr>${cols.map((c, i) => (r[i] == null || r[i] === '' ? `<td class="blank${tc(c)}" data-i="${i}" data-v="">blank</td>` : `<td class="${keyCols.has(c) ? 'k' : 'v'}${flag(r[i])}${tc(c)}" data-i="${i}" data-v="${esc(r[i])}">${esc(r[i])}</td>`)).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="none">No row has “${esc(q)}”</td></tr>`;
        more.innerHTML = rows.length > limit ? `<button class="btn" data-more>Show ${fmt(Math.min(50, rows.length - limit))} more</button>` : '';
        body.querySelectorAll('td[data-i]').forEach((td) => { if (keyCols.has(cols[+td.dataset.i])) return; td.onclick = () => { pick = { i: +td.dataset.i, v: td.dataset.v }; limit = 50; draw(); }; });
        head.querySelectorAll('[data-sort]').forEach((b) => (b.onclick = () => { const i = +b.dataset.sort; dir = sortBy === i ? -dir : 1; sortBy = i; draw(); }));
        more.querySelector('[data-more]')?.addEventListener('click', () => { limit += 50; draw(); });
      };
      draw();
      L.querySelector('#rows-q').oninput = (ev) => { q = ev.target.value.trim().toLowerCase(); limit = 50; draw(); };
    };
    // nothing to read here: the record has no run of the day that read this file, or the file is no CSV text
    const none = (why) => { if (S.panel?.rows !== id) return; L.querySelector('.rcount').textContent = why || `This file’s rows can’t be read here. Open it in the pipeline to run the day and read them.`; L.querySelector('#rows-q').hidden = true; };
    host.rows(id, day).then((data) => (data ? show(data) : none())).catch((e) => none(e && /sha256|hash|integrity/i.test(String(e.message)) ? `The file didn’t match the hash the record keeps for it, so its rows aren’t shown.` : `The file couldn’t be read: ${String((e && e.message) || e)}`));
  }
  // an output beside the map, as the record has it on the day: held or published, its rows, what it says it is and the
  // files it is built from (each a tap to that file's view); the pipeline a tap further
  function openOutput(oid, from) {
    closeToasts();
    const o = M.outputs.find((x) => x.id === oid) || { id: oid, reads: [], from: [] }, src = dsOf(from), wd = waitingDs();
    S.panel = { out: oid };
    const files = [...new Set([...(o.from || []), ...(o.reads || []).filter((r) => dsOf(r))])].filter((r) => dsOf(r));
    const reads = files.map((r) => `<li><button data-ds="${esc(r)}">${esc(dsOf(r).short)}<span class="go">›</span></button></li>`).join('');
    const on = dW() === 'today' ? 'today' : `on ${DC().d}`;
    const state = o.waiting ? `<p><b style="color:var(--bad)">${HOURGLASS} Held ${on}.</b> Readers see ${esc(DC().prev)} until ${esc(wd ? wd.short : 'the file that holds it')} is decided.</p>` : `<p>Published ${on}.</p>`;
    const Lr = layer();
    Lr.innerHTML = `<div class="scrim" data-close></div><aside class="panel" aria-label="Output"><div class="ph"><div class="ctx">Output${src ? ` · built from ${esc(src.short)}` : ''}</div><div class="t"><h2>${esc(plain(oid))}</h2><button class="x" data-close aria-label="Close">✕</button></div><div class="pacts"><button type="button" class="btn sm" data-pipe>Open in the pipeline ›</button><span>its checks, its rows and its contract</span></div></div><div class="pb">${o.about ? `<p>${esc(o.about)}</p>` : ''}${state}${o.rows != null ? `<h3>Rows</h3><p>${fmt(o.rows)} ${o.waiting ? `when it was held` : on}</p>` : ''}${reads ? `<h3>Built from ${files.length === 1 ? 'one file' : `${files.length} files`}</h3><ul class="reads">${reads}</ul>` : ''}</div></aside>`;
    Lr.querySelectorAll('[data-close]').forEach((x) => (x.onclick = () => closePanel()));
    Lr.querySelector('[data-pipe]').onclick = () => { closePanel(true); host.openCard(oid, 'summary'); };
    Lr.querySelectorAll('[data-ds]').forEach((x) => (x.onclick = () => { closePanel(); go({ level: 'dataset', ds: x.dataset.ds, kind: dsOf(x.dataset.ds).kind }); }));
  }
  // the relations between two areas, each a sentence, each opening the kind it starts from
  function openRelations(a, b) {
    const rs = relPairs().filter((r) => { const x = kindOf(r.from).domain, y = kindOf(r.to).domain; return (x === a && y === b) || (x === b && y === a); });
    const name = (id) => M.domains.find((d) => d.id === id).name;
    S.panel = { rel: [a, b] };
    const Lr = layer();
    Lr.innerHTML = `<div class="scrim" data-close></div><aside class="panel" aria-label="Relations"><div class="ph"><div class="ctx">Relations between two areas</div><div class="t"><h2>${esc(name(a))} and ${esc(name(b))}</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb"><ul class="rels">${rs.map((r) => `<li><button data-k="${esc(r.from)}"><span class="ri">${ICON[kindOf(r.from).icon] || ''}</span><span>${esc(sentence(r))}</span><span class="go">›</span></button></li>`).join('')}</ul></div></aside>`;
    Lr.querySelectorAll('[data-close]').forEach((x) => (x.onclick = () => closePanel()));
    Lr.querySelectorAll('[data-k]').forEach((x) => (x.onclick = () => { closePanel(); go({ level: 'kind', kind: x.dataset.k }); }));
  }
  function closePanel(silent) {
    S.panel = null; stopPics(); const L = $('#layer');
    if (!L.firstChild) return;
    if (silent || matchMedia('(prefers-reduced-motion: reduce)').matches) { clearTimeout(closePanel.t); L.innerHTML = ''; L.className = ''; return; }
    L.classList.remove('swap'); L.classList.add('closing'); clearTimeout(closePanel.t);
    closePanel.t = setTimeout(() => { if (L.classList.contains('closing')) { L.innerHTML = ''; L.className = ''; } }, 200);
  }

  // ------------------------------------------------------------------ getting somewhere: to the paused day, the file, the touched kinds, a kind's relations
  function toDataset(d, then) { if (S.level === 'dataset' && S.ds === d.id) return then(); go({ level: 'dataset', ds: d.id, kind: d.kind }); setTimeout(then, 600); }
  const decideNow = () => { const w = waitingDs(); if (w) toDataset(w, () => openPanel(w.id, null, true)); };
  const replaceNow = () => { const dd = decidedDs(); if (!dd) return; if (dd.pendingFix) return replaceFile(dd.id, dd.pendingFix); toDataset(dd, () => openReplace(dd.id)); };
  function showReach() { const apply = () => { S.reachPin = true; S.reachHover = false; S.reach = true; renderChrome(); lightUp(); }; if (S.level !== 'estate') { go({ level: 'estate' }); setTimeout(apply, 620); } else apply(); }
  function spotlight(kid) { const apply = () => { if (stage.contains(root.activeElement)) root.activeElement.blur(); S.hover = null; S.spotPin = 'k:' + kid; lightUp(); }; if (S.level !== 'estate') { go({ level: 'estate' }); setTimeout(apply, 620); } else apply(); }

  // ------------------------------------------------------------------ answers from the page: what the map knows, in plain words, with what to do about it
  const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // how many edits make one word another (a letter in, out, changed, or two swapped): typos forgiven
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
    return d[a.length][b.length];
  }
  const closeTo = (g, name) => { const n = name.toLowerCase(); return n.length > 3 && lev(g, n) <= (n.length > 7 ? 2 : 1); };
  function mentions(q) {
    let col = null;
    for (const d of M.datasets) { for (const c of d.columns) if (c.name.length > 3 && new RegExp(`\\b${escRe(c.name.toLowerCase())}\\b`).test(q)) { col = c.name; break; } if (col) break; }
    const ds = M.datasets.slice().sort((a, b) => b.short.length - a.short.length).find((d) => new RegExp(`\\b${escRe(d.short.toLowerCase())}\\b`).test(q));
    let kd = M.kinds.slice().sort((a, b) => b.name.length - a.name.length).find((k) => [k.name, k.plural, k.noun, PL(k.id)].filter(Boolean).some((n) => new RegExp(`\\b${escRe(String(n).toLowerCase())}`).test(q)));
    let ds2 = ds;
    if (!ds2 || !kd) {
      const words = q.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean), grams = (n) => words.slice(0, words.length - n + 1).map((_, i) => words.slice(i, i + n).join(' '));
      const near = (name) => grams(String(name).split(' ').length).some((g) => closeTo(g, String(name)));
      if (!ds2) ds2 = M.datasets.find((d) => near(d.short));
      if (!kd) kd = M.kinds.find((k) => [k.name, k.plural, k.noun].filter(Boolean).some(near));
    }
    return { col, ds: ds2, kd };
  }
  const actDecide = (primary) => ({ label: 'Decide ›', primary, run: decideNow });
  const actKeep = () => ({ label: `Keep ${DC().prev}…`, run: decideNow });
  const actRequest = () => ({ label: 'Draft a request for the file…', stay: requestFile });
  // a request for the corrected file, drafted from what the page knows, to read before it is copied
  const requestText = (w) => { const n = (w.builds || []).length, u = w.rowsUsual, I = issueOf(w); return `${w.short} for ${DC().today} ${I.kind === 'empty' ? `arrived empty: 0 rows${u ? `, where a usual day has about ${fmt(usualN(u))}` : ''}` : I.why}. It stopped the day at its checks, and ${n} outputs built from it wait. Could you re-run the export and send the corrected file? The day runs again under the same checks when it arrives.`; };
  const SENDER = 'smaltfl-explorer-sender';
  const senderGet = (id) => { try { return (JSON.parse(localStorage.getItem(SENDER) || '{}') || {})[id] || ''; } catch (e) { return ''; } };
  const senderSet = (id, v) => { try { const o = JSON.parse(localStorage.getItem(SENDER) || '{}') || {}; o[id] = v; localStorage.setItem(SENDER, JSON.stringify(o)); } catch (e) { /* storage may be off */ } };
  function requestFile() {
    const w = waitingDs() || decidedDs(); if (!w) return { title: 'Draft a request for the file', html: '<p>Every file is in: there is nothing to ask for.</p>', acts: [] };
    const text = requestText(w);
    const to = senderGet(w.id);
    return { title: 'Draft a request for the file', icon: GL.mail, html: `<label class="pto"><span>To</span><input type="text" class="tofield" data-to="${esc(w.id)}" value="${esc(to)}" placeholder="Who sends the ${esc(w.short)} export? The data names no one yet" aria-label="Who to send it to"></label><p class="pdraft">${esc(text)}</p>${w.asked ? `<p class="plead">You copied a request at ${hhmm(w.asked)}.</p>` : ''}`, acts: [{ label: 'Copy it, for you to send', primary: true, keep: true, run: () => { copyText(text, true); w.asked = new Date(); renderChrome(); const who = senderGet(w.id); toast(`Copied. Paste it into an email or chat to ${who || `whoever sends the ${w.short} export`}; the day now says you asked.`); } }] };
  }
  function copyText(text, quiet) {
    const done = () => { if (!quiet) toast('Copied: paste it wherever you ask for files.'); };
    const old = () => { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; root.append(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } t.remove(); ok ? done() : toast('Select the message and copy it: this page may not copy for you.'); };
    try { navigator.clipboard.writeText(text).then(done, old); } catch (e) { old(); }
  }
  const actReach = () => ({ label: 'See what’s built from it', run: showReach });
  const actRows = (d) => (M.noRows ? null : { label: d.state === 'waiting' ? `See ${DC().prev}’s rows` : `Explore ${d.short}’s rows`, run: () => openRows(d.id) });
  const actReplace = () => ({ label: 'Replace file ›', primary: true, run: replaceNow });
  const actUndo = () => ({ label: 'Change the decision…', run: () => host.decide(M.day) });
  const actOpenDs = (d) => ({ label: `Open ${d.short}`, run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }) });
  const actOpenKind = (k) => ({ label: `Open ${k.name}`, run: () => go({ level: 'kind', kind: k.id }) });
  const actSpot = (k) => ({ label: `Show it on the map`, primary: true, run: () => spotlight(k.id) });
  // peer:newcomer — an answer leads with its picture (today against the usual band, the month as a strip of days, what
  // waits on the file), then one line, then Full answer ›. An answer's `pic` and `line` are its card; the full answer
  // shows them first and its `more` under them. `html` stays the whole answer in words (the fallback, and Claude's facts).
  // The day on screen as the page says it: Today, the date small. Design's helper says it (window.smDay, r3) wherever the
  // page has it; this copy's stand-in writes the same markup. The date always comes from DC(), and a paused day readers
  // have moved past keeps its date.
  const dayKit = () => smDay;
  const isToday = () => (dayKit() ? dayKit().is(DC().iso) : !laterSaid());
  const todaySaid = () => (dayKit() ? dayKit().html(DC().iso, DC().today) : isToday() ? `<span class="today">Today <small class="tdate">${esc(DC().today)}</small></span>` : esc(DC().today));
  const todayWord = () => (dayKit() ? dayKit().mid(DC().iso, DC().today) : isToday() ? 'today' : DC().today);
  const dayShort = (i) => dayName(i).replace(/ \w{3} /, ' ');
  const APMARK = { w: '◆', d: HALF, p: PAUSE };
  // today against usual, as dq's look-inside draws it (r3): today's rows and a usual day's, two bars on one scale from
  // zero, labelled where they end. One picture for one fact across the palette. dq's nowBars draws it wherever the page
  // has it; nowBarsHere is a copy of it for this copy of the app (the same markup, so the same styles), to go at the merge
  const todayBars = (d) => (typeof nowBars === 'function' ? nowBars(d) : nowBarsHere(d));
  const nowBarsHere = (d) => {
    const t = d.rowsToday, u = d.rowsUsual ? usualN(d.rowsUsual) : null;
    if (t == null) return '';
    if (u == null) return `<div class="pvn"><b>${fmt(t)}</b> rows ${dW()}</div>`;
    const max = Math.max(t, u, 1), w = (v) => `${((v / max) * 100).toFixed(1)}%`, tone = d.state === 'waiting' ? ' bad' : d.state === 'warn' ? ' warn' : '';
    return `<div class="dqnow" role="img" aria-label="${fmt(t)} rows ${dW()}; a usual day has about ${fmt(u)}"><span class="dqk">rows ${dW() === 'today' ? 'today' : DC().d}</span><span class="dqb">${t > 0 ? `<i class="dqt${tone}" style="width:${w(t)}"></i>` : `<i class="dqt0${tone}"></i>`}</span><b class="dqv">${fmt(t)}</b><span class="dqk">usual</span><span class="dqb"><i class="dqu" style="width:${w(u)}"></i></span><span class="dqv">${fmt(u)}</span></div>`;
  };
  // the month as a strip of days, today marked at the end; one or two days out of the ordinary named where they are
  function picMonth(days) {
    const n = days.length; if (!n) return '';
    const t = n - 1, odd = days.map((s, i) => [DAYCLS[s] || 'o', i]).filter(([k, i]) => k !== 'o' && i !== t);
    const two = odd.length === 2 && (odd[1][1] - odd[0][1]) / n < 0.4; // peer:builder r4: two odd days near each other take a line each
    const notes = odd.length && odd.length <= 2 ? `<div class="apnotes${two ? ' two' : ''}" aria-hidden="true">${odd.map(([k, i], j) => { const p = (((i + 0.5) / n) * 100).toFixed(1); return `<span${two && !j ? ' class="hi"' : ''} style="left:${p}%;transform:translateX(-${p}%)"><i class="${k}">${APMARK[k]}</i>${DAYWORD[k]} ${dayShort(i)}</span>`; }).join('')}</div>` : '';
    return `<figure class="ap apmonth" style="--n:${n}">${notes}${strip(days, true)}<div class="apx"><span>${esc(DC().first)}</span><span>${todaySaid()}</span></div></figure>`;
  }
  // the strip's days counted, each with its mark: 25 fine · ◆ 1 warned · ‖ paused today
  const stripLine = (days) => {
    const n = { o: 0, w: 0, d: 0, p: 0 }, t = days.length - 1, last = DAYCLS[days[t]] || 'o';
    days.forEach((s, i) => { if (i < t || last !== 'p') n[DAYCLS[s] || 'o']++; });
    const odd = [n.w && `<i class="apm w">◆</i>${n.w} warned`, n.d && `<i class="apm d">${HALF}</i>${n.d} decided`, n.p && `${PAUSE}${n.p} paused`, last === 'p' && `${PAUSE}paused ${esc(todayWord())}`].filter(Boolean);
    return [odd.length < 3 && n.o && `<i class="apm o"></i>${n.o} fine`, ...odd].filter(Boolean).join(' · '); // the strip shows the fine days where the odd ones need the line
  };
  // what is built from a file, by what it is about, each group's count with ⧗ where it waits; the names on hover
  const groupWord = (g) => (g === 'check' ? 'Checked rows' : g === 'context' ? 'Context' : kindOf(g) ? cap(PL(g)) : 'Other');
  // the groups as the map counts them: a file's own checked rows go with what the file is about (the map's waitsBy), so
  // Application's ⧗ 5 on the map is Applications ⧗ 5 here; biggest first, context and the rest last
  const fanGroups = (d, outs) => { const m = new Map(); for (const [g, l] of outGroups(outs)) { const k = g === 'check' ? d.kind : g; if (!m.has(k)) m.set(k, []); m.get(k).push(...l); } const last = (g) => (g === 'context' || g === 'other' ? 1 : 0); return [...m.entries()].sort((a, b) => last(a[0]) - last(b[0]) || b[1].length - a[1].length); };
  function picFan(d, outs) {
    const groups = fanGroups(d, outs); if (!groups.length) return '';
    const R = 22, H = groups.length * R, mid = H / 2, wn = outs.filter((o) => o.waiting).length;
    const curves = groups.map((_, i) => `<path d="M0 ${mid} C18 ${mid} 18 ${i * R + R / 2} 33 ${i * R + R / 2}"/><circle cx="33" cy="${i * R + R / 2}" r="2"/>`).join('');
    return `<figure class="ap apfan" role="img" aria-label="${esc(`${outs.length} outputs built from ${d.short}${wn ? `, ${wn} waiting` : ''}: ${groups.map(([g, l]) => `${l.length} ${groupWord(g).toLowerCase()}`).join(', ')}`)}">`
      + `<span class="apsrc${d.state === 'waiting' ? ' off' : ''}">${d.state === 'waiting' ? PAUSE : ''}${esc(d.short)}</span>`
      + `<svg viewBox="0 0 36 ${H}" style="height:${H}px" aria-hidden="true">${curves}</svg>`
      + `<ul>${groups.map(([g, l]) => { const w = l.filter((o) => o.waiting).length; return `<li title="${esc(l.map((o) => plain(o.id)).join(', '))}"><span>${esc(groupWord(g))}</span><b>${w ? `${HOURGLASS}${w}${w < l.length ? ` of ${l.length}` : ''}` : l.length}</b></li>`; }).join('')}</ul></figure>`;
  }
  // ⧗ 11: what waits on a paused file, as a count; hover names them, a tap asks which
  const waitChip = (w) => { const outs = M.outputs.filter((o) => (w.builds || []).includes(o.id)), n = outs.length; return n ? `<button type="button" class="apw" data-ask="Which outputs wait?" title="${esc(`${outputsWait(n)}: ${outs.map((o) => plain(o.id)).join(', ')}`)}" aria-label="${esc(outputsWait(n))}: which?">${HOURGLASS}<span class="kwn">${n}</span></button>` : ''; }; // peer:builder r4: the map's count pill, no chevron
  // a file's rows today in one line: how it stands against usual, or what stopped it
  const rowsLine = (d) => { if (d.state === 'waiting') return `<b>${esc(d.short)}</b> ${esc(issueOf(d).why)} ${waitChip(d)}`; if (d.rowsToday == null) return `<b>${esc(d.short)}</b> has no file yet`; const fb = fineBand(d); return fb ? `<b>${esc(d.short)}</b> ${esc(todayWord())}: ${d.rowsToday < fb[0] ? 'fewer rows than usual' : d.rowsToday > fb[1] ? 'more rows than usual' : 'about as usual'}` : `<b>${esc(d.short)}</b>: ${fmt(d.rowsToday)} rows ${esc(todayWord())}`; }; // the bars carry the numbers
  // a file's rows today against usual: the picture for an issue about how many rows came (else the month's strip)
  const ROWKINDS = new Set(['empty', 'twice', 'rows']);
  function whyNow() {
    const w = waitingDs(), dd = decidedDs();
    if (!w) return dd ? { html: `<p>Nothing is paused now. ${esc(DC().today)} is <b class="owedt">decided for now</b> (${esc(HOW[dd.how]?.said || '')}) and the corrected ${esc(dd.short)} file is still owed.</p>`, line: `<b class="owedt">${HALF} Decided for now:</b> ${esc(HOW[dd.how]?.said || '')}, ${esc(dd.short)} owed`, acts: [actReplace(), actUndo()] } : { html: '<p><b class="okt">✓ Nothing is paused.</b> Every file is in and every check passed.</p>', line: '<b class="okt">✓ Nothing is paused.</b> Every check passed', acts: [] };
    const fails = (w.checks || []).filter((c) => c.mode === 'stops' && !c.column), n = (w.builds || []).length;
    const I = issueOf(w), dc = DC(), f2 = I.stoppedBy ? I.stoppedBy.map((says) => ({ says })) : fails;
    const why2 = `<p>${f2.length ? `${f2.length === 1 ? 'Its check' : 'Its checks'} ${f2.map((c) => `“${esc(c.says)}”`).join(' and ')} stop${f2.length === 1 ? 's' : ''} a day like that, so the` : 'The'} ${n} outputs built from it wait, and readers still see ${esc(dc.prev)}.</p><p>${I.answer || '<b>Suggested:</b> keep ' + esc(dc.prev) + ' now and ask for the file again. When it comes, it is checked and waits for your OK.'}</p>`;
    const pic = ROWKINDS.has(I.kind || 'empty') ? todayBars(w) : (w.days || []).length ? picMonth(w.days) : ''; // peer:newcomer
    return { q: `Why is ${todayWord()} paused?`, html: `<p><b class="bad">${PAUSE} ${esc(dc.today)} is paused.</b> ${I.kind === 'empty' ? `${esc(w.short)} arrived empty: 0 rows${w.rowsUsual ? `, where a usual day has <span class="nw">about ${fmt(usualN(w.rowsUsual))}</span>` : ''}` : `${esc(w.short)} ${esc(I.why)}`}.</p>${why2}`, pic, line: `<b>${esc(w.short)}</b> ${esc(I.why)} ${waitChip(w)}`, more: why2, acts: [actDecide(true), actReach(), I.ask ? actRequest() : null, actRows(w)].filter(Boolean) };
  }
  function waitsNow() {
    const w = waitingDs();
    if (!w) return { html: '<p>Nothing waits: no file is paused today.</p>', line: 'Nothing waits: no file is paused today', acts: [] };
    const outs = M.outputs.filter((o) => (w.builds || []).includes(o.id)), groups = fanGroups(w, outs);
    const names = `<ul>${groups.map(([g, l]) => `<li><span><b>${esc(groupName(g))}:</b> ${l.slice(0, 5).map((o) => esc(plain(o.id))).join(', ')}${l.length > 5 ? ` and ${l.length - 5} more` : ''}</span></li>`).join('')}</ul>`;
    return { q: 'Which outputs wait?', html: `<p><b>${(w.builds || []).length} outputs</b> built from ${esc(w.short)} wait for the decision; readers see their ${esc(DC().prev)} version until then.</p>${names}`, pic: picFan(w, outs), line: `Readers see ${esc(DC().prev)} until you decide`, more: names, acts: [{ ...actReach(), primary: true }, actDecide(false)] }; // peer:newcomer
  }
  function nextNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    const dc = DC();
    if (w) { const I = issueOf(w); return { q: 'What should I do next?', line: `<b>Decide on ${esc(todayWord())}</b> · suggested: ${esc(HOW[I.suggest]?.button || '')}`, html: I.nextSteps || `<ol><li><b>Decide on ${esc(dc.today)}.</b> Keeping ${esc(dc.prev)} is suggested: readers stay on the last good day and the day stops asking.</li><li><b>Ask for the file again:</b> the ${esc(w.short)} export likely failed.</li><li>When it comes, the day runs again under the same checks and waits for your OK; publish it and the ${(w.builds || []).length} outputs are rebuilt.</li></ol>`, acts: [actDecide(true), I.ask ? actRequest() : null].filter(Boolean) }; }
    if (dd) return { line: `<b>Replace ${esc(dc.wd)}’s ${esc(dd.short)} file</b> when it comes`, html: `<ol><li><b>Replace ${esc(dc.wd)}’s ${esc(dd.short)} file</b> when the corrected export comes.</li><li>The day runs again under the same ${(dd.checks || []).length} checks and waits for your OK; publish it and readers see ${esc(dc.today)}.</li></ol><p>Decided so far: ${esc(HOW[dd.how]?.said || '')}.</p>`, acts: [dd.pendingFix || M.replaceable !== false ? actReplace() : null, actUndo()].filter(Boolean) };
    return { line: '<b class="okt">✓ Nothing needs you.</b>', html: `<p><b class="okt">✓ Nothing needs you.</b> ${rd ? `The corrected ${esc(rd.short)} file passed all its checks, and readers see ${esc(dc.today)}.` : 'Every file is in.'}</p>`, acts: rd ? [actRows(rd), actUndo()].filter(Boolean) : [] };
  }
  function decidedNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    if (dd) return { line: `<b class="owedt">${HALF} Decided for now:</b> ${esc(HOW[dd.how]?.said || '')}`, html: `<p>${esc(DC().today)} is <b class="owedt">${HALF} decided for now</b>: ${esc(HOW[dd.how]?.said || '')} for ${esc(dd.short)}${dd.note ? `, because “${esc(dd.note)}”` : ''}. The corrected file is still owed.</p>`, acts: [actReplace(), actUndo()] };
    if (rd) return { line: `<b class="okt">✓ ${esc(cap(todayWord()))} is complete</b>`, html: `<p><b class="okt">✓ ${esc(DC().today)} is complete.</b> The corrected ${esc(rd.short)} file (${fmt(rd.replaced.rows)} rows) replaced the empty one.</p>`, acts: [actUndo()] };
    if (w) return { line: `Nothing is decided yet: ${esc(todayWord())} waits for you`, html: `<p>Nothing is decided yet: ${esc(DC().today)} is paused and waits for you.</p>`, acts: [actDecide(true)] };
    return { line: 'There is nothing to decide today', html: '<p>There is nothing to decide today.</p>', acts: [] };
  }
  // a list cut short, the rest one tap away
  const listed = (items, n, sep = ', ') => items.length <= n ? items.join(sep) : `${items.slice(0, n).join(sep)} <button type="button" class="pmore" data-more>and ${items.length - n} more</button><span hidden>${sep}${items.slice(n).join(sep)}</span>`;
  // a join said with the column at each end: Cloud assets’ app_tag → CMDB’s app_id
  const owns = (name) => `<b>${esc(name)}</b>${/s$/i.test(name) ? '’' : '’s'}`;
  const joinSaid = (j) => `${owns(dsOf(j.from).short)} <code>${esc(j.col)}</code> → ${owns(dsOf(j.to).short)} <code>${esc(j.toCol || j.col)}</code>${typeof matchSaid === 'function' ? matchSaid(j) : ''}`;
  function columnNow(col, inDs) {
    const has = M.datasets.filter((d) => d.columns.some((c) => c.name === col));
    const c0 = (inDs && inDs.columns.find((c) => c.name === col)) || has.map((d) => d.columns.find((c) => c.name === col)).find((c) => c && c.meaning) || {};
    const js2 = [...new Map(M.joins.filter((j) => (j.col === col || j.toCol === col) && dsOf(j.from) && dsOf(j.to) && j.from !== j.to).map((j) => [j.from + '>' + j.to, j])).values()];
    return { q: `Where is ${col} used?`, line: `<code>${esc(col)}</code> is in <b>${has.length} dataset${has.length === 1 ? '' : 's'}</b>${js2.length ? ` · ${js2.length} join${js2.length === 1 ? '' : 's'}` : ''}`, html: `<p><code>${esc(col)}</code>${c0.meaning ? `: ${esc(c0.meaning)}` : ''}</p><p>It is in <b>${has.length} dataset${has.length === 1 ? '' : 's'}</b>: ${listed(has.map((d) => esc(d.short)), 6)}.</p>${js2.length ? `<p class="plead">Where it joins: a column → the column it matches</p><ul>${js2.slice(0, 4).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${js2.length > 4 ? `<div><button type="button" class="pmore" data-more>and ${js2.length - 4} more joins</button><div hidden><ul>${js2.slice(4).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}` : ''}`, acts: has.slice(0, 3).map((d, i) => ({ label: `${col} in ${d.short}`, primary: !i, run: () => toDataset(d, () => openPanel(d.id, col)) })) };
  }
  // two names asked about together: how they join, with the columns at each end
  function namesIn(q) {
    const found = [];
    for (const d of M.datasets) { const m = new RegExp(`\\b${escRe(d.short.toLowerCase())}\\b`).exec(q); if (m) found.push({ at: m.index, len: d.short.length, d }); }
    for (const k of M.kinds) for (const n of [k.name, k.plural, k.noun, PL(k.id)].filter(Boolean)) { const m = new RegExp(`\\b${escRe(String(n).toLowerCase())}`).exec(q); if (m) { found.push({ at: m.index, len: String(n).length, k }); break; } }
    found.sort((a, b) => a.at - b.at || b.len - a.len);
    const out = []; let end = -1; for (const f of found) { if (f.at < end) continue; out.push(f); end = f.at + f.len; }
    return out;
  }
  function joinNow(a, b) {
    const dsets = (x) => (x.d ? [x.d.id] : kindOf(x.k.id).datasets), A = new Set(dsets(a)), B = new Set(dsets(b)), name = (x) => (x.d ? x.d.short : x.k.name);
    const js2 = [...new Map(M.joins.filter((j) => (A.has(j.from) && B.has(j.to)) || (B.has(j.from) && A.has(j.to))).filter((j) => dsOf(j.from) && dsOf(j.to)).map((j) => [j.from + '>' + j.to + j.col, j])).values()];
    const rs = a.k && b.k ? relPairs().filter((r) => (r.from === a.k.id && r.to === b.k.id) || (r.from === b.k.id && r.to === a.k.id)) : [];
    if (!js2.length && !rs.length) return { line: `<b>${esc(name(a))}</b> and <b>${esc(name(b))}</b> don’t join directly`, html: `<p><b>${esc(name(a))}</b> and <b>${esc(name(b))}</b> don’t join directly on this map.</p>`, acts: [] };
    return { q: `How do ${name(a)} and ${name(b)} join?`, line: rs.length ? `${sentenceHtml(rs[0], a.k.id)}${rs.length > 1 ? ` · and ${rs.length - 1} more` : ''}` : `${js2.length} join${js2.length === 1 ? '' : 's'} between them`, html: `${rs.length ? `<ul>${rs.map((r) => `<li><span>${sentenceHtml(r, a.k.id)}</span></li>`).join('')}</ul>` : ''}<p class="plead">${js2.length} join${js2.length === 1 ? '' : 's'}: a column → the column it matches</p><ul>${js2.slice(0, 5).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${js2.length > 5 ? `<div><button type="button" class="pmore" data-more>and ${js2.length - 5} more joins</button><div hidden><ul>${js2.slice(5).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}`, acts: [a, b].filter((x) => x.d || x.k).slice(0, 2).map((x, i) => (x.d ? { ...actOpenDs(x.d), primary: !i } : { ...actOpenKind(kindOf(x.k.id)), primary: !i })) };
  }
  function rowsNow(d) {
    const u = d.rowsUsual;
    const html = d.state === 'waiting' ? (issueOf(d).kind === 'empty' ? `<p><b class="bad">${PAUSE} ${esc(d.short)} has 0 rows ${dW()}</b>${u ? `; a usual day has about ${fmt(usualN(u))}` : ''}. Readers see ${esc(DC().prev)}’s rows.</p>` : `<p><b class="bad">${PAUSE} ${esc(d.short)} ${esc(issueOf(d).why)}</b>: ${fmt(d.rowsToday)} rows ${dW()}. Readers see ${esc(DC().prev)}’s until it is decided.</p>`) : d.rowsToday == null ? `<p>${esc(d.short)} has no file yet${d.state === 'awaited' ? ': it is described ahead of its first file' : ''}.</p>` : `<p><b>${esc(d.short)}</b> has <b>${fmt(d.rowsToday)} rows</b> today${u ? ` (usually about ${fmt(usualN(u))})` : ''} and ${d.columns.length} columns.</p>`;
    return { q: `How many rows does ${d.short} have today?`, html, pic: todayBars(d), line: rowsLine(d), more: '', /* peer:newcomer */ acts: [actRows(d) ? { ...actRows(d), primary: true } : null, actOpenDs(d)].filter(Boolean) };
  }
  function datasetNow(d) {
    const out = [...new Set(M.joins.filter((j) => j.from === d.id && j.to !== d.id && dsOf(j.to)).map((j) => dsOf(j.to).short))], builds = (d.builds || []).length;
    const facts = `${d.rowsToday != null ? `${fmt(d.rowsToday)} rows ${dW()} · ` : ''}${d.columns.length} columns${out.length ? ` · joins ${out.slice(0, 3).map(esc).join(', ')}${out.length > 3 ? ` and ${out.length - 3} more` : ''}` : ''}${builds ? ` · used by ${builds} output${builds === 1 ? '' : 's'}` : ''}`;
    // peer:builder r4: the look inside's picture (dq, r3) is what a file is; the facts behind Full answer
    return { q: `What is ${d.short}?`, pic: nowOf(d), line: '', more: `<p class="plead">${facts}</p>`, html: `<p><b>${esc(d.short)}</b>${d.description ? `: ${esc(d.description.replace(/^[^:]*:\s+/, ''))}` : ''}</p><p>${facts}</p>`, acts: [{ ...actOpenDs(d), primary: true }, actRows(d)] };
  }
  function kindNow(k, q) {
    const rs = relPairs().filter((r) => r.from === k.id || r.to === k.id), nb = neighbours(k.id);
    if (/how many|count|number of/.test(q)) return { line: `<b>${fmt(k.count)} ${esc(PL(k.id))}</b> · ${k.datasets.length} dataset${k.datasets.length === 1 ? '' : 's'}`, html: `<p><b>${fmt(k.count)} ${esc(PL(k.id))}</b>, described by ${k.datasets.length} dataset${k.datasets.length === 1 ? '' : 's'}.</p>`, acts: [{ ...actOpenKind(k), primary: true }] };
    return { q: `What does ${k.name} relate to?`, line: `<b>${esc(k.name)}</b> relates to ${nb.length} kind${nb.length === 1 ? '' : 's'}`, html: `<p><b>${esc(k.name)}</b> relates to <b>${nb.length} kind${nb.length === 1 ? '' : 's'}</b>:</p><ul>${rs.slice(0, 7).map((r) => `<li><span>${sentenceHtml(r, k.id)}${viaParts(r).length ? `<i class="pvia">${esc(viaParts(r).filter((x) => !/^since/.test(x)).join(' · '))}</i>` : ''}</span></li>`).join('')}</ul>${rs.length > 7 ? `<div><button type="button" class="pmore" data-more>and ${rs.length - 7} more</button><div hidden><ul>${rs.slice(7).map((r) => `<li><span>${sentenceHtml(r, k.id)}</span></li>`).join('')}</ul></div></div>` : ''}`, acts: [actSpot(k), actOpenKind(k)] };
  }
  // a month as a strip of days, each drawn as what the day was
  const DAYCLS = { ok: 'o', note: 'o', warn: 'w', decided: 'd', waiting: 'p' }, DAYWORD = { o: 'fine', w: 'warned', d: 'decided', p: 'paused' };
  const dayName = (i) => `${['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'][i % 7]} Mar ${i + 1}`;
  const stripSaid = (days) => { const at = {}; days.forEach((s, i) => { const c = DAYCLS[s] || 'o'; (at[c] ||= []).push(i); }); const last = days.length - 1; return ['o', 'w', 'd', 'p'].filter((c) => at[c]).map((c) => { const l = at[c], word = DAYWORD[c]; if (c === 'o') return `${l.length} ${word}`; if (c === 'p' && l.length === 1 && l[0] === last) return `paused ${dW()}`; const named = l.slice(0, 3).map(dayName).join(', ') + (l.length > 3 ? ` and ${l.length - 3} more` : ''); return `${l.length} ${word} (${named})`; }).join(' · '); };
  const strip = (days, compact, d) => {
    const seen = new Set(days.map((s) => DAYCLS[s] || 'o'));
    const key = ['o', 'w', 'd', 'p'].filter((c) => seen.has(c)).map((c) => `<span><i class="${c}">${c === 'p' ? PAUSE : ''}</i>${DAYWORD[c]}</span>`).join('');
    const row = `<div class="strip" role="img" aria-label="${esc(stripSaid(days))}">${days.map((s, i) => { const c = DAYCLS[s] || 'o'; return `<i class="${c}" title="${dayName(i)}: ${s === 'note' ? 'fine, with a note' : DAYWORD[c]}">${c === 'p' ? PAUSE : ''}</i>`; }).join('')}</div>`;
    return compact ? row : (d && (d.counts || []).length ? `<div class="sparkrow">${spark(d)}</div>` : '') + row + `<div class="striplab"><span>${esc(DC().first)}</span><span class="stripkey">${key}</span><span>${esc(DC().today)}</span></div>`;
  };
  function monthNow(ds, kd) {
    if (!(M.month || []).length) return { line: 'No days kept to look back on', html: '<p>This generated estate keeps no days to look back on.</p>', acts: [] };
    if (ds) { if (!(ds.days || []).length) return { line: `<b>${esc(ds.short)}</b> has no days yet`, html: `<p><b>${esc(ds.short)}</b> has no days yet: it is described ahead of its first file.</p>`, acts: [{ ...actOpenDs(ds), primary: true }] }; const cs = (ds.counts || []).filter((x) => x), fb = fineBand(ds); return { q: `How has ${ds.short} been this month?`, pic: picMonth(ds.days), line: stripLine(ds.days), more: `${todayBars(ds)}${fb ? `<p class="plead">A usual day has ${fmt(fb[0])} to ${fmt(fb[1])} rows: inside that band the rows check stays quiet.</p>` : ''}${notableOf(ds)}`, html: `<p><b>${esc(ds.short)}</b> this month: ${stripSaid(ds.days)}.</p>${strip(ds.days, false, ds)}${cs.length ? `<p class="plead">Usually about ${fmt(usualN(ds.rowsUsual || [cs[0], cs[0]]))} rows a day${ds.rowsToday != null ? `; today ${fmt(ds.rowsToday)}` : ''}${fb ? `. The check stays quiet between ${fmt(fb[0])} and ${fmt(fb[1])}, the shaded band` : ''}.</p>` : ''}${notableOf(ds)}`, acts: [{ ...actOpenDs(ds), primary: true }, actRows(ds)] }; }
    if (kd) {
      // a kind's day is the worst of its datasets' that day
      const rank = { waiting: 4, warn: 3, decided: 2, note: 1, ok: 0 }, ks = kindOf(kd.id).datasets.map(dsOf).filter((d) => (d.days || []).length), n = Math.max(0, ...ks.map((d) => d.days.length));
      const days = Array.from({ length: n }, (_, i) => ks.map((d) => d.days[i]).filter(Boolean).sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0] || 'ok');
      return { q: `How has ${kd.name} been this month?`, pic: picMonth(days), line: stripLine(days), more: `<p class="plead">Each day is the worst of its ${ks.length} dataset${ks.length === 1 ? '' : 's'}.</p>`, html: `<p><b>${esc(kd.name)}</b> this month, each day the worst of its ${ks.length} dataset${ks.length === 1 ? '' : 's'}: ${stripSaid(days)}.</p>${strip(days)}`, acts: [{ ...actOpenKind(kd), primary: true }] };
    }
    const days = M.month.map((x) => x.state);
    return { q: 'How has the estate been this month?', pic: picMonth(days), line: stripLine(days), more: '', html: `<p>The estate this month: ${stripSaid(days)}.</p>${strip(days)}`, acts: waitingDs() ? [actDecide(true)] : [] };
  }
  const joinList = (list, n) => `<ul>${list.slice(0, n).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${list.length > n ? `<div><button type="button" class="pmore" data-more>and ${list.length - n} more</button><div hidden><ul>${list.slice(n).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}`;
  function dsJoinsNow(d) {
    const uniq = (l) => [...new Map(l.map((j) => [j.from + '>' + j.to + j.col, j])).values()];
    const trouble = (j) => (STATE_RANK[dsOf(j.from)?.state] ?? 9) * 2 + (j.match && j.match.hit < j.match.rows ? 0 : 1);
    const out = uniq(M.joins.filter((j) => j.from === d.id && j.to !== d.id && dsOf(j.to))), inc = uniq(M.joins.filter((j) => j.to === d.id && j.from !== d.id && dsOf(j.from))).sort((a, b) => trouble(a) - trouble(b));
    if (!out.length && !inc.length) return { line: `<b>${esc(d.short)}</b> joins nothing on this map`, html: `<p><b>${esc(d.short)}</b> joins nothing on this map.</p>`, acts: [{ ...actOpenDs(d), primary: true }] };
    return { q: `What does ${d.short} join?`, line: `<b>${esc(d.short)}</b> joins ${out.length} other${out.length === 1 ? '' : 's'} · ${inc.length} join${inc.length === 1 ? 's' : ''} it`, html: `<p><b>${esc(d.short)}</b> joins ${out.length} other${out.length === 1 ? '' : 's'}; ${inc.length} other${inc.length === 1 ? ' joins' : 's join'} it. A match is the share of rows whose column finds a row on the other side, on ${(() => { const j0 = [...out, ...inc].find((j) => j.match); return j0 ? dayLong(j0.match.day) + '’s files' : 'the day’s files'; })()}.</p>${out.length ? `<p class="plead">It joins ${out.length} other${out.length === 1 ? '' : 's'}: its column → the column it matches there</p>${joinList(out, 4)}` : ''}${inc.length ? `<p class="plead">${inc.length} other${inc.length === 1 ? ' joins' : 's join'} it: their column → its column</p>${joinList(inc, 4)}` : ''}`, acts: [{ ...actOpenDs(d), primary: true }, actRows(d)] };
  }
  function builtNow(d) {
    const outs = M.outputs.filter((o) => (d.builds || []).includes(o.id));
    if (!outs.length) return { line: `Nothing on this map is built from <b>${esc(d.short)}</b>`, html: `<p>Nothing on this map is built from <b>${esc(d.short)}</b>.</p>`, acts: [{ ...actOpenDs(d), primary: true }] };
    const w = outs.filter((o) => o.waiting).length;
    return { q: `What is built from ${d.short}?`, pic: picFan(d, outs), line: d.state === 'waiting' ? `Readers see ${esc(DC().prev)} until you decide` : w ? `${HOURGLASS}${w} wait ${esc(todayWord())}, on ${esc(waitingDs()?.short || 'another file')}` : `Nothing built from it waits ${esc(todayWord())}`, more: `<ul>${fanGroups(d, outs).map(([g, l]) => `<li><span><b>${esc(groupName(g))}:</b> ${l.slice(0, 5).map((o) => esc(plain(o.id))).join(', ')}${l.length > 5 ? ` and ${l.length - 5} more` : ''}</span></li>`).join('')}</ul>`, html: `<p><b>${outs.length} output${outs.length === 1 ? '' : 's'}</b> ${outs.length === 1 ? 'is' : 'are'} built from ${esc(d.short)}${w ? `; <b>${w} wait</b> for today’s decision` : ''}.</p><ul>${outGroups(outs).map(([g, l]) => `<li><span><b>${esc(groupName(g))}:</b> ${l.slice(0, 5).map((o) => esc(plain(o.id))).join(', ')}${l.length > 5 ? ` and ${l.length - 5} more` : ''}</span></li>`).join('')}</ul>`, acts: [{ ...actOpenDs(d), primary: true }, ...(w ? [actDecide(false)] : [])] };
  }
  function kindDsNow(k) {
    const mark = (d) => (d.state === 'waiting' ? `${PAUSE} ` : d.state === 'decided' ? `${HALF} ` : d.state === 'warn' ? '◆ ' : d.state === 'awaited' ? '◌ ' : '');
    return { q: `Which datasets describe ${PL(k.id)}?`, line: `<b>${fmt(k.datasets.length)} dataset${k.datasets.length === 1 ? '' : 's'}</b> describe ${esc(PL(k.id))}`, html: `<p><b>${fmt(k.datasets.length)} dataset${k.datasets.length === 1 ? '' : 's'}</b> describe ${esc(PL(k.id))}.</p>${groupsOf(k.id).map(([g, l]) => `${g ? `<p class="plead">${esc(g)}</p>` : ''}<p>${listed(l.map((d) => `${mark(d)}${esc(d.short)}`), 12)}</p>`).join('')}`, acts: [{ ...actOpenKind(k), primary: true }] };
  }
  const helpKeys = () => ({ title: 'Keyboard shortcuts', html: '<div class="keys"><span><kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd></span><span>This palette: do something, find a name, or ask</span><span><kbd>↑</kbd> <kbd>↓</kbd> <kbd>↵</kbd></span><span>Move through the list and run the line picked</span><span><kbd>Tab</kbd> or <kbd>→</kbd></span><span>Look inside a kind or a dataset</span><span><kbd>⌫</kbd> or <kbd>←</kbd></span><span>On an empty line, step back out</span><span><kbd>Esc</kbd></span><span>Step back a level, as the page does; at the top it clears what you typed, then closes</span><span><kbd>1</kbd>–<kbd>4</kbd></span><span>On the Decide panel, pick a choice; <kbd>↵</kbd> confirms it and <kbd>Esc</kbd> cancels</span><span><kbd>Tab</kbd> on the map</span><span>Move between kinds; each shows how it relates</span></div>', acts: [] });
  const helpMarks = () => ({ title: 'What the marks mean', html: `<div class="marks"><b class="bad">${PAUSE}</b><span>Paused: a file stopped at a check, and the day waits for you</span><b class="mut">${HOURGLASS}</b><span>Waits: an output built from the paused file, held until you decide</span><b class="owedt">${HALF}</b><span>Decided for now: readers see the choice you made, and the file is still owed</span><b class="owedt">◆</b><span>Unusual, but not stopped</span><b class="mut"><i class="notedmark"></i></b><span>Noted: a check noted something on the day; nothing stopped</span><b class="okt">✓</b><span>Complete: the corrected file is in</span><b class="mut">◌</b><span>Planned: described ahead of its first file; none is due yet</span><b class="act">Blue</b><span>Something you can press</span></div>`, acts: [] });
  // peer:builder r4 — what an output is built from: its files by kind, drawn as the fan the other way round, into it; ⧗
  // where it waits today and on which file. The page knows it (each file's builds); it used to say it couldn't answer
  const outputIn = (q) => M.outputs.slice().sort((a, b) => plain(b.id).length - plain(a.id).length).find((o) => new RegExp(`\\b${escRe(plain(o.id).toLowerCase())}\\b`).test(q));
  function picFeeds(o, byKind, w) {
    const R = 22, H = byKind.length * R, mid = H / 2, held = !!(o.waiting && w && byKind.some(([, l]) => l.includes(w)));
    const curves = byKind.map((_, i) => `<path d="M3 ${i * R + R / 2} C18 ${i * R + R / 2} 18 ${mid} 36 ${mid}"/><circle cx="3" cy="${i * R + R / 2}" r="2"/>`).join('');
    const said = `${plain(o.id)} is built from ${byKind.reduce((a, [, l]) => a + l.length, 0)} files: ${byKind.map(([k, l]) => `${l.length} about ${PL(k)}`).join(', ')}${held ? `; it waits ${todayWord()} on ${w.short}` : ''}`;
    return `<figure class="ap apfan apfeed" role="img" aria-label="${esc(said)}"><ul>${byKind.map(([k, l]) => { const p = !!(w && l.includes(w)); return `<li title="${esc(l.map((d) => d.short).join(', '))}"><span>${esc(cap(PL(k)))}</span><b>${p ? `${PAUSE}1 of ${l.length}` : l.length}</b></li>`; }).join('')}</ul>`
      + `<svg viewBox="0 0 36 ${H}" style="height:${H}px" aria-hidden="true">${curves}</svg><span class="apsrc${held ? ' held' : ''}">${held ? HOURGLASS : ''}${esc(plain(o.id))}</span></figure>`;
  }
  function feedsNow(o, q) {
    const files = M.datasets.filter((d) => (d.builds || []).includes(o.id)), w = waitingDs(), name = plain(o.id), asked = /\bfeeds?\b|built from|made (from|of)|comes? from|sources?\b|inputs?\b|depends? on|upstream|where does/.test(q);
    if (!files.length) return { q: `What feeds ${name}?`, line: `No file on this map feeds <b>${esc(name)}</b>`, html: `<p>No file on this map feeds <b>${esc(name)}</b>.</p>`, acts: [] };
    const byKind = M.kinds.map((k) => [k.id, files.filter((d) => d.kind === k.id)]).filter(([, l]) => l.length).sort((a, b) => b[1].length - a[1].length);
    const held = !!(o.waiting && w && files.includes(w)), isFeeds = asked || !o.about;
    const waitSaid = held ? `${HOURGLASS} Waits ${esc(todayWord())} on <b>${esc(w.short)}</b>` : `<b>${files.length}</b> files feed it · none paused ${esc(todayWord())}`;
    const list = `<ul>${byKind.map(([k, l]) => `<li><span><b>${esc(cap(PL(k)))}:</b> ${l.slice(0, 6).map((d) => `${d === w ? `${PAUSE} ` : ''}${esc(d.short)}`).join(', ')}${l.length > 6 ? ` and ${l.length - 6} more` : ''}</span></li>`).join('')}</ul>`;
    // the line under the picture: whether it waits (asked what feeds it), else what it is; the full answer adds the other and the files
    return { q: isFeeds ? `What feeds ${name}?` : `What is ${name}?`, pic: picFeeds(o, byKind, w), line: isFeeds ? waitSaid : esc(o.about), more: `${isFeeds && o.about ? `<p class="plead">${esc(o.about)}</p>` : ''}${isFeeds ? '' : `<p class="plead">${waitSaid}</p>`}${list}`, html: `<p><b>${esc(name)}</b> is built from ${files.length} files.</p>${list}`, acts: held ? [actDecide(true)] : [] };
  }
  function answerLocal(q) { const a = answerFor(q); if (a && !a.q && !a.title) a.q = tidyQ(q); return a; }
  function answerFor(q) {
    const { col, ds, kd } = mentions(q);
    const out0 = !ds && !col ? outputIn(q) : null; if (out0 && !/this month|the month|how has/.test(q)) return feedsNow(out0, q); // peer:builder r4
    if (/\bjoin|connect|relat|link/.test(q) && !col) { const two = namesIn(q); if (two.length >= 2) return joinNow(two[0], two[1]); }
    if (/shortcut|keyboard|\bkeys?\b|hotkey/.test(q) && !ds) return helpKeys(); // peer:newcomer: "key rotation" is a file, not the keys
    if (/this month|the month|how has|been doing|history|lately|over time|recent days|each day/.test(q) && !col) return monthNow(ds, kd);
    if (/\bmarks?\b|legend|symbols?\b|colou?rs?\b|icons?\b/.test(q) && !col && !ds) return helpMarks();
    if (/what should i do|what do i do|what now|\bnext\b|how do i fix|how to fix|fix (it|this|that|the)|resolve|unblock|what can i do/.test(q)) return nextNow();
    if (/undo|decided|decision|\bowed\b/.test(q) && !col) return decidedNow();
    if (/\bwait|touch|affect|impact|blast|downstream|depends? on|held up|holds? up/.test(q) && !col && !kd && (!ds || ds.state === 'waiting')) return waitsNow();
    if (/paus|wrong|problem|issue|empty|stuck|\bhold\b|\bheld\b|happen|attention|needs? me|broken|\bfail/.test(q) && !col && !kd) return whyNow();
    if (col) return columnNow(col, ds);
    if (ds && /\bjoin|connect|link|related|points? at/.test(q)) return dsJoinsNow(ds);
    if (ds && /built from|\bbuild|feeds?\b|outputs?|downstream|made from|depends? on/.test(q)) return builtNow(ds);
    if (ds && /\brows?\b|how many|count|size|how big|today/.test(q)) return rowsNow(ds);
    if (ds) return datasetNow(ds);
    if (kd && /datasets|describe|which data|list|files/.test(q)) return kindDsNow(kd);
    if (kd) return kindNow(kd, q);
    return null;
  }
  function questionsNow() {
    const w = waitingDs(), dd = decidedDs(), qs = [], hasMonth = (M.month || []).length > 0;
    if (S.level === 'dataset') {
      const d = dsOf(S.ds);
      if (d.state === 'waiting') qs.push(`Why is ${d.short} paused?`); else if (hasMonth && (d.days || []).length) qs.push(`How has ${d.short} been this month?`);
      qs.push(`What does ${d.short} join?`, `What is built from ${d.short}?`);
      if (w && d.id !== w.id) qs.push(`Why is ${todayWord()} paused?`); // peer:newcomer
      return qs.slice(0, 4);
    }
    if (S.level === 'kind') {
      const k = kindOf(S.kind);
      qs.push(`What does ${k.name} relate to?`, `Which datasets describe ${PL(k.id)}?`);
      if (hasMonth) qs.push(`How has ${k.name} been this month?`);
      if (w) qs.push(`Why is ${todayWord()} paused?`); // peer:newcomer
      return qs.slice(0, 4);
    }
    if (w) qs.push(`Why is ${todayWord()} paused?`, 'Which outputs wait?'); /* peer:newcomer */ else if (dd) qs.push('What is still owed?');
    if (w && (w.days || []).length) qs.push(`How has ${w.short} been this month?`);
    const kid = M.kinds.slice().sort((a, b) => neighbours(b.id).length - neighbours(a.id).length)[0].id;
    qs.push(w ? `What does ${w.short} join?` : `What does ${kindOf(kid).name} relate to?`);
    const seen = {}; for (const d of M.datasets) for (const c of d.columns) seen[c.name] = (seen[c.name] || 0) + 1;
    const col = Object.entries(seen).filter(([c]) => /_id$/.test(c) && c.length > 4).sort((a, b) => b[1] - a[1])[0];
    if (col && qs.length < 4) qs.push(`Where is ${col[0]} used?`);
    if (qs.length < 4) qs.push('What should I do next?');
    return qs.slice(0, 4);
  }
  const fallbackAnswer = () => ({ html: '<p>That isn’t something this page can answer yet. It knows the kinds, datasets and columns on the map, and today’s state. Try one of these:</p>', acts: questionsNow().map((x) => ({ label: x, ask: x })) });
  // what Claude is told: the page's own facts, short, and the question; it may suggest what to press
  function factsFor() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs(), big = M.datasets.length > 60;
    return JSON.stringify({
      estate: S.m === 'big' ? 'A larger estate (generated)' : 'Larkspur estate', day: `${DC().today}, 2024`,
      today: w ? { paused: w.id, file: w.short, rows: w.rowsToday, usually: w.rowsUsual, outputsWaiting: (w.builds || []).length, stoppedBy: (w.checks || []).filter((c) => c.mode === 'stops' && !c.column).map((c) => c.says), readersSee: DC().prev } : dd ? { decided: dd.id, how: HOW[dd.how]?.said, fileOwed: true, why: dd.note || null } : rd ? { complete: true, replaced: rd.id } : { allFine: true },
      kinds: M.kinds.map((k) => ({ id: k.id, name: k.name, count: k.count, datasets: k.datasets.length })),
      relations: relPairs().map((r) => sentence(r, true)),
      datasets: M.datasets.map((d) => ({ id: d.id, name: d.short, kind: d.kind, state: d.state, rows: d.rowsToday, columns: big ? d.columns.slice(0, 6).map((c) => c.name) : d.columns.map((c) => (c.meaning ? `${c.name}: ${c.meaning}` : c.name)) })),
      outputsWaiting: M.outputs.filter((o) => o.waiting).map((o) => o.id),
      lookingAt: S.level === 'dataset' ? { dataset: S.ds } : S.level === 'kind' ? { kind: S.kind } : 'the whole estate',
    });
  }
  const claudePrompt = (q) => `You answer a question about a data estate shown on the page the person is looking at. Use only the facts below; if they don't answer it, say so in one sentence. Write at most three short sentences in plain words: no headings, no tables, no markdown except **bold** for a name. Where something on the page would help, end with one line that starts ACTIONS: followed by a JSON array of at most three of: {"do":"decide"}, {"do":"keep"}, {"do":"replace"}, {"do":"reach"}, {"do":"undo"}, {"do":"rows","dataset":"<id>"}, {"do":"open_kind","kind":"<id>"}, {"do":"open_dataset","dataset":"<id>"}, {"do":"open_column","dataset":"<id>","column":"<name>"}, {"do":"spotlight","kind":"<id>"}.\n\nFACTS: ${factsFor()}\n\nQUESTION: ${q}`;
  function actionFor(s) {
    const w = waitingDs(), dd = decidedDs(), d = s && dsOf(s.dataset), k = s && kindOf(s.kind);
    switch (s && s.do) {
      case 'decide': return w ? actDecide(true) : null;
      case 'keep': return w ? actKeep() : null;
      case 'replace': return dd ? actReplace() : null;
      case 'reach': return w ? actReach() : null;
      case 'undo': return (M.hist || []).length ? actUndo() : null;
      case 'rows': return d ? actRows(d) : null;
      case 'open_kind': return k ? actOpenKind(k) : null;
      case 'open_dataset': return d ? actOpenDs(d) : null;
      case 'open_column': return d && d.columns.some((c) => c.name === s.column) ? { label: `${s.column} in ${d.short}`, run: () => toDataset(d, () => openPanel(d.id, s.column)) } : null;
      case 'spotlight': return k ? { label: `Show ${k.name} on the map`, run: () => spotlight(k.id) } : null;
    }
    return null;
  }
  const parseActs = (tail) => { try { const arr = JSON.parse(String(tail || '').trim().replace(/^```(json)?/, '').replace(/```$/, '')); return (Array.isArray(arr) ? arr : []).map(actionFor).filter(Boolean).slice(0, 3); } catch (e) { return []; } };
  const paras = (t) => String(t || '').trim().split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}</p>`).join('');
  // Claude, where this page may ask it: a namespace the viewer hands over later, or never
  let ASK = null;
  try { const u = window.claude && typeof window.claude.use === 'function' ? window.claude.use('sample') : null; if (u && u.then) u.then((s) => { ASK = typeof s === 'function' ? s : null; }, () => {}); } catch (e) { /* no runtime on this copy of the page */ }

  // ------------------------------------------------------------------ the palette: what you can do now, a question, or a name
  // the questions this viewer asked, kept in this browser only
  const RECENT = 'smaltfl-explorer-recent';
  const recentGet = () => { try { const r = JSON.parse(localStorage.getItem(RECENT) || '[]'); return Array.isArray(r) ? r.filter((x) => typeof x === 'string').slice(0, 3) : []; } catch (e) { return []; } };
  const recentAdd = (q) => { try { localStorage.setItem(RECENT, JSON.stringify([q, ...recentGet().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 3))); } catch (e) { /* storage may be off */ } };
  const previewOf = (a) => { const t = plainOf(String(a.html).replace(/<\/(p|li)>/g, ' · ').replace(/<div class="strip"[\s\S]*$/, '')).replace(/\s+/g, ' ').replace(/( · )+$/, '').trim(); return t.length > 130 ? t.slice(0, 128) + '…' : t; };
  const cardOf = (a) => {
    if (a.pic || a.line) return `${a.pic || ''}${a.line ? `<p class="apline" title="${esc(plainOf(a.line).replace(/\s+/g, ' ').trim())}">${a.line}</p>` : ''}`; // peer:newcomer: the picture, then one line
    const h = String(a.html), blocks = [];
    let text = 0;
    for (const m of h.matchAll(/<(p|ol|ul)\b[^>]*>[\s\S]*?<\/\1>/g)) {
      let b = m[0];
      if (/^<(ul|ol)/.test(b)) { const lis = b.match(/<li>[\s\S]*?<\/li>/g) || []; b = b.replace(/<li>[\s\S]*<\/li>/, lis.slice(0, 3).join('') + (lis.length > 3 ? `<li class="pcm"><span>and ${lis.length - 3} more</span></li>` : '')); }
      blocks.push(b); text += plainOf(b).length;
      if (blocks.length >= 3 || text > 200) break;
    }
    while (blocks.length > 1 && /^<p class="plead"/.test(blocks[blocks.length - 1])) blocks.pop();
    const strip = (h.match(/<div class="strip"[\s\S]*?<\/div><div class="striplab">[\s\S]*?<\/div>/) || [''])[0];
    return blocks.join('').replace(/<button[^>]*data-more[^>]*>[\s\S]*?<\/button><span hidden>[\s\S]*?<\/span>/g, '…') + strip;
  };
  // a column's kind as the page says it: key, date, number, code, text
  const COLGLYPH = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.6" stroke-opacity=".45"/><rect class="fc" x="6.2" y="3" width="3.6" height="10" rx=".8"/></svg>';
  const colIcon = () => COLGLYPH;
  const GL = {
    table: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.6"/><path d="M2 6.6h12M6.6 6.6V13"/></svg>',
    built: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.4" cy="8" r="1.7"/><path d="M5.1 8h2.4M7.5 8c2 0 1.9-4 4-4M7.5 8c2 0 1.9 4 4 4M7.5 8h4"/><circle cx="12.7" cy="4" r="1.1"/><circle cx="12.7" cy="8" r="1.1"/><circle cx="12.7" cy="12" r="1.1"/></svg>',
    rows: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.2h11M2.5 8h11M2.5 11.8h7.5"/></svg>',
    mail: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.6"/><path d="M2.7 4.5 8 8.6l5.3-4.1"/></svg>',
  };
  // a dataset's state, as a small mark on its glyph
  const stateBadge = (d) => (d.state === 'waiting' ? `<span class="pbadge">${PAUSE}</span>` : d.state === 'decided' ? `<span class="pbadge owed">${HALF}</span>` : d.state === 'warn' ? '<span class="pbadge warn">◆</span>' : d.state === 'awaited' ? '<span class="pbadge aw">◌</span>' : '');
  const stateMark = (d) => (d.state === 'waiting' ? PAUSE : d.state === 'decided' ? `<b class="owedt">${HALF}</b>` : d.state === 'warn' ? '<b class="warnt">◆</b>' : d.state === 'awaited' ? '<b class="mut">◌</b>' : '<i class="okdot"></i>');
  const TYW = { TEXT: 'text', INTEGER: 'integer', DOUBLE: 'decimal', REAL: 'decimal', DATE: 'date', TIMESTAMP: 'timestamp', BOOLEAN: 'boolean' };
  // what a column means and how it is stored: code · text, number · integer, key · text
  const tyFull = (c) => { const st = TYW[c.type] || 'text', r = tyOf(c); return r === 'text' ? st : `${r} · ${st}`; };
  const valsOf = (c) => { const v = (c.today || []).slice(0, 3).map((t) => (c.labels || {})[t.value] || t.value); return v.length ? v.join(' / ') : ''; };
  const pct = (x) => (x >= 0.9995 ? '100%' : (x * 100).toFixed(x > 0.99 ? 1 : 0) + '%');
  const dayLong = (iso) => { const i = +String(iso).slice(8, 10) - 1; return dayName(i); };
  const matchSaid = (j) => (j.match ? ` <span class="pvmatch${j.match.hit < j.match.rows ? ' part' : ''}" title="${fmt(j.match.hit)} of ${fmt(j.match.rows)} rows with a ${esc(j.col)} find a match, on ${dayLong(j.match.day)}’s files${(j.match.miss || []).length ? '; not found: ' + esc(j.match.miss.join(', ')) : ''}">${pct(j.match.hit / j.match.rows)} match</span>` : '');
  const missSaid = (j) => (j.match && j.match.hit < j.match.rows ? `<li class="pvmiss">${fmt(j.match.rows - j.match.hit)} of ${fmt(j.match.rows)} find nothing: ${(j.match.miss || []).map((x) => `<code>${esc(x)}</code>`).join(' ')}${j.match.rows - j.match.hit > (j.match.miss || []).length ? ' …' : ''}</li>` : '');
  // a question as it reads best: names as the page writes them, a capital first and a question mark last
  const cap1 = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  // peer:dq: a label is cut only where a colon and a space end it; ISO/IEC 27001:2022 is no label (Requirements read
  // “2022, PCI DSS v4.0.1, SOC 2), with how the two relate”)
  const descOf = (d) => cap1(String(d.description || '').replace(/^[^:]*:\s+/, ''));
  const tidyQ = (raw) => {
    let t = String(raw || '').trim().replace(/\s+/g, ' ');
    for (const d of [...M.datasets].sort((a, b) => b.short.length - a.short.length)) t = t.replace(new RegExp(`\\b${escRe(d.short)}\\b`, 'gi'), d.short);
    for (const k of M.kinds) t = t.replace(new RegExp(`\\b${escRe(k.name)}\\b`, 'gi'), k.name);
    t = t.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); // peer:newcomer
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return looksAsked(t) && !/[?.!]$/.test(t) ? t + '?' : t;
  };
  // the month as bars: each day's rows, coloured as the day was
  const spark = (d) => {
    const c = d.counts || [], days = d.days || []; if (!c.length) return '';
    const fb = fineBand(d), max = Math.max(1, ...c.filter((x) => x != null), fb ? fb[1] : 0), H = 30, yOf = (v) => H - (v / max) * (H - 3);
    return `<div class="sparkbox"><span class="sy top">${fmt(max)}</span><span class="sy bot">0</span><svg class="spark" viewBox="0 0 ${c.length * 10} ${H}" preserveAspectRatio="none" role="img" aria-label="Rows each day this month, from ${fmt(Math.min(...c.filter((x) => x != null)))} to ${fmt(Math.max(...c.filter((x) => x != null)))}">${fb ? `<rect class="fband" x="0" y="${yOf(fb[1]).toFixed(1)}" width="${c.length * 10}" height="${(yOf(fb[0]) - yOf(fb[1])).toFixed(1)}"><title>The check stays quiet between ${fmt(fb[0])} and ${fmt(fb[1])} rows</title></rect>` : ''}${c.map((v, i) => { const k = DAYCLS[days[i]] || 'o', h = v ? Math.max(2, Math.round((v / max) * (H - 3))) : 0; return `<g><title>${dayName(i)}: ${v == null ? 'no file' : fmt(v) + ' rows'}${k !== 'o' ? ' · ' + DAYWORD[k] : ''}${d.heads && d.heads[i] ? ' · ' + d.heads[i] : ''}</title><rect class="sb ${k}" x="${i * 10 + 2.5}" y="${H - h}" width="5" height="${h}" rx="1.2"/>${v === 0 ? `<rect class="sb0 ${k}" x="${i * 10 + 1.5}" y="${H - 3}" width="7" height="3" rx="1.2"/>` : ''}</g>`; }).join('')}</svg></div>`;
  };
  // the days out of the ordinary, in the record's own words
  // what the record said of a day, in plain words, and what became of the day
  const headSaid = (h) => { const m = /^Unlike any day: (.+)$/.exec(h); if (m) return `the day as a whole was unlike the days before, most in its “${m[1]}”`; const a = /^Almost no (\w+): (\d+)$/.exec(h); if (a) return `it arrived empty: ${a[2]} rows`; const r = /^Rows unlike earlier days: AUC ([\d.]+)$/.exec(h); if (r) return `its rows looked unlike earlier days’ (told apart with AUC ${r[1]})`; return h.charAt(0).toLowerCase() + h.slice(1); };
  const fateOf = (s) => (s === 'warn' ? 'published as usual, nothing held' : s === 'decided' ? 'held, then decided' : s === 'waiting' ? 'paused, waiting for you' : '');
  const notableOf = (d) => { const l = (d.heads || []).map((h, i) => (h ? `<li><span><b>${dayName(i)}</b> · ${esc((d.dayNotes || [])[i] ? `${d.dayNotes[i]}: ${headSaid(h).replace(/, most in its “[^”]*”/, '')}` : headSaid(h))}; ${fateOf(d.days[i])}.</span></li>` : '')).filter(Boolean); return l.length ? `<p class="plead">The days out of the ordinary, as the record has them</p><ul>${l.join('')}</ul>` : ''; };
  // the check on a day's rows tells a change only past a twentieth of a usual day (a gated flow, ADR 0020)
  const fineBand = (d) => { const u = d.rowsUsual; if (!u) return null; const mid = (u[0] + u[1]) / 2; return [Math.round(mid * 0.95), Math.round(mid * 1.05)]; };
  // the preview beside the list: what the line picked is, before it is opened
  // peer:dq r3 — the look-inside preview says what a file is and whether it is fine today, and no more (the owner: “I like
  // the what is this … I would rather discover the more in detail stuff”): its state, today's rows against usual drawn as
  // one picture, and what it is. The month, its columns, its joins and what is built from it are one tap away in the
  // list beside it (“How has MFA been this month?”, “Its columns · 5”, “What does MFA join?”, “What is built from MFA?”),
  // not repeated here.
  const waitingOn = (d) => M.outputs.filter((o) => (d.builds || []).includes(o.id) && o.waiting);
  // a count is an icon: ⧗ 11, the list on hover, focus or tap (the tap asks what is built from it)
  const waitCount = (d) => { if (d.state !== 'waiting') return ''; const w = waitingOn(d); if (!w.length) return ''; const n = w.length, said = `${n} output${n === 1 ? '' : 's'} ${M.heldWord ? 'held' : `wait${n === 1 ? 's' : ''} on it`}`; return `<button type="button" class="dqwait" data-ask="What is built from ${esc(d.short)}?" title="${esc(said)}: ${esc(w.map((o) => plain(o.id)).join(', '))}" aria-label="${esc(said)}: see them">${HOURGLASS}${n}</button>`; };
  // the state in one chip, shape and word; why a fine day is fine is said on hover, not on the chip, and only what is true
  // in every world: a file can carry a tighter limit of your own than Larkspur's ±5%, and this model doesn't know it
  const offSaid = (t, u) => { const p = ((t - u) / u) * 100; return Math.abs(p) < 0.05 ? 'as usual' : `${p > 0 ? '+' : '−'}${Math.abs(p).toFixed(1)}% from usual`; };
  const stateChip = (d) => {
    if (d.state === 'waiting') return `<span class="pvs bad">${PAUSE} Paused ${dW()}</span>`;
    if (d.state === 'decided') return `<span class="pvs">${HALF} Decided for now · file owed</span>`;
    if (d.state === 'warn') return '<span class="pvs warn">◆ Unusual today</span>';
    if (d.state === 'awaited') return `<span class="pvs">◌ Planned · first file ${esc(d.awaited || '')}</span>`;
    const t = d.rowsToday, u = d.rowsUsual ? usualN(d.rowsUsual) : null;
    return `<span class="pvs ok" title="${d.state === 'note' ? 'A check noted something today; nothing stopped' : 'No check stopped or warned on it today'}${t != null && u ? ` · ${fmt(t)} rows, ${offSaid(t, u)}` : ''}">✓ Fine today</span>`;
  };
  // the one number, drawn where it sits among the days before: each of those days a dot on one line, the usual range
  // (their middle eight in ten) shaded behind them, the day itself the large dot in its state's colour; the line spans
  // the days and the day, so an empty file is a dot far from the rest and a usual one sits with them. Where the
  // days before are too few for a range, the number alone
  const nowBars = (d, o = {}) => { // peer:design r4: the one today-against-usual picture; o.label names the day (rows Mon 26), o.tone the pause's severity (amber when mild)
    const t = d.rowsToday, u = d.rowsUsual, past = (d.past || []).filter((x) => x != null), lab = o.label || (dW() === 'today' ? 'rows today' : `rows ${DC().d}`);
    if (t == null) return '';
    if (!u || !past.length) return `<div class="pvn"><b>${fmt(t)}</b> ${esc(lab)}</div>`;
    const tone = o.tone !== undefined ? (o.tone ? ' ' + o.tone : '') : d.state === 'waiting' ? ' bad' : d.state === 'warn' ? ' warn' : '';
    // never narrower than a twentieth either side of a usual day, the least a day's rows have to move to be told: a file
    // that changes by a row or two draws as one cluster with the day on it, not as an outlier
    const m = (u[0] + u[1]) / 2, lo = Math.max(0, Math.min(t, ...past, m * 0.95)), hi = Math.max(t, ...past, m * 1.05), x = (v) => (hi === lo ? 50 : 3 + (94 * (v - lo)) / (hi - lo)).toFixed(2) + '%';
    const where = t < u[0] ? 'below' : t > u[1] ? 'above' : 'within', n = past.length, range = u[0] === u[1] ? fmt(u[0]) : `${fmt(u[0])}–${fmt(u[1])}`;
    const said = `${fmt(t)} ${lab}, ${where} the usual ${range}: the middle of the ${n} day${n === 1 ? '' : 's'} before, each a dot on the line`;
    return `<div class="dqdist" role="img" aria-label="${esc(said)}" title="${esc(said)}"><div class="dqh"><span class="dqn"><b>${fmt(t)}</b> ${esc(lab)}</span><span class="dqr"><i class="dqsw" aria-hidden="true"></i>usual ${range}</span></div>`
      + `<div class="dqstrip" aria-hidden="true"><i class="dqband" style="left:${x(u[0])};width:calc(${x(u[1])} - ${x(u[0])})"></i>${past.map((v) => `<i class="dqp" style="left:${x(v)}"></i>`).join('')}<i class="dqtd${tone}" style="left:${x(t)}"></i></div></div>`;
  };
  // the three things, in the order the eye takes them: whether it is fine, the number that says so, what it is
  const nowOf = (d) => `<div class="dqstate">${stateChip(d)}${waitCount(d)}</div>${nowBars(d)}${d.description ? `<p class="pvd dqwhat" title="${esc(descOf(d))}">${esc(descOf(d))}</p>` : ''}`;
  // the preview beside the list: what the line picked is, before it is opened
  function previewDs(d) {
    return `<div class="pvh"><span class="pico">${GL.table}${stateBadge(d)}</span><div><b>${esc(d.short)}</b><span>Dataset · ${esc(kindOf(d.kind).name)}</span></div></div>${nowOf(d)}`;
  }
  // a file's columns, when asked for (the “Its columns” line): each with what it means and how it is stored
  const previewCols = (d) => `<div class="pvh"><span class="pico">${COLGLYPH}</span><div><b>${esc(d.short)}${/s$/i.test(d.short) ? '’' : '’s'} columns</b><span>${d.columns.length} column${d.columns.length === 1 ? '' : 's'} · ↵ to look at one</span></div></div><ul class="pvc dqcols">${d.columns.map((c) => `<li><code>${esc(c.name)}</code><small title="${esc(c.meaning || '')}">${esc(c.meaning || '')}</small><span class="pty${c.role === 'key' ? ' kb' : ''}">${tyFull(c)}</span></li>`).join('')}</ul>`;
  function previewKind(k) {
    const ds = k.datasets.map(dsOf).filter(Boolean).sort((a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9)), rs = relPairs().filter((r) => r.from === k.id || r.to === k.id);
    return `<div class="pvh"><span class="pico">${ICON[k.icon] || ''}</span><div><b>${esc(k.name)}</b><span>Kind${k.count == null ? '' : ` · ${fmt(k.count)} ${esc(k.plural)}`}</span></div></div>`
      + `<h4>Datasets · ${ds.length}</h4><ul class="pvk">${ds.slice(0, 7).map((d) => `<li>${stateMark(d)}<span>${esc(d.short)}</span><small>${d.rowsToday != null ? fmt(d.rowsToday) + ' rows' : 'no file yet'}</small></li>`).join('')}${ds.length > 7 ? `<li class="pvmore">and ${ds.length - 7} more · <kbd>Tab</kbd> to see them</li>` : ''}</ul>`
      + (rs.length ? `<h4>Relates to</h4><ul class="pvr">${rs.slice(0, 4).map((r) => `<li>${sentenceHtml(r, k.id)}</li>`).join('')}${rs.length > 4 ? `<li class="pvmore">and ${rs.length - 4} more</li>` : ''}</ul>` : '');
  }
  function previewCol(d, c) {
    const has = M.datasets.filter((x) => x !== d && x.columns.some((y) => y.name === c.name)), j = M.joins.find((x) => x.from === d.id && x.col === c.name && x.to !== d.id && dsOf(x.to));
    return `<div class="pvh"><span class="pico">${COLGLYPH}</span><div><b class="mono">${esc(c.name)}</b><span>Column of ${esc(d.short)} · ${tyFull(c)}</span></div></div>`
      + (c.meaning ? `<p class="pvd">${esc(c.meaning)}</p>` : '')
      + (j ? `<div class="pvn">Joins ${owns(dsOf(j.to).short)} <code>${esc(j.toCol || j.col)}</code>${matchSaid(j)}</div>` : '')
      + (c.distinct ? `<div class="pvn"><b>${fmt(c.distinct)}</b> distinct · ${fmt(c.blanks || 0)} blank</div>` : '')
      + ((c.examples || []).length ? `<div class="pvx">${c.examples.slice(0, 4).map((x) => `<code>${esc(x)}</code>`).join(' ')}</div>` : '')
      + (has.length ? `<h4>Also in</h4><p class="pvd">${has.slice(0, 6).map((x) => esc(x.short)).join(', ')}${has.length > 6 ? ` and ${has.length - 6} more` : ''}</p>` : '');
  }
  const previewAsk = (x) => { const a = answerLocal(String(x).toLowerCase()); return (a ? '' /* peer:builder r4: the row beside it says the question */ : `<div class="pvq"><span class="pico ask">✦</span><b>${esc(tidyQ(x))}</b></div>`) + (a ? `<div class="pvans">${cardOf(a)}</div><button type="button" class="apfull" data-full>Full answer ›<kbd>↵</kbd></button>` : /* peer:newcomer */ `<p class="pvd">${ASK ? 'Claude answers from this page’s data.' : 'Answered from this page’s data.'}</p>`); };
  function previewDecide(w) { // peer:builder r4: the picture and one line; the checks and the choices are Decide's, one tap on
    return `<div class="pvpic">${decidePic('now', w, dkDay().text(DC().iso, DC().d))}</div><p class="apline"><b>${esc(w.short)}</b> ${esc(issueOf(w).why)} ${waitChip(w)}</p>`;
  }
  function previewRows(d) {
    const cols = d.columns.slice(0, 4), rows = (d.sample || []).slice(0, 5);
    return `<div class="pvh"><span class="pico">${GL.rows}</span><div><b>${esc(d.short)}, ${d.state === 'waiting' ? esc(DC().prev) : 'today'}</b><span>${d.state === 'waiting' ? `The last good day, while ${esc(todayWord())} is paused` /* peer:builder r4 */ : `${fmt(d.rowsToday || 0)} rows`}</span></div></div>${rows.length ? `<table class="pvt"><thead><tr>${cols.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c, i) => `<td>${esc(String(r[i] ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="pvhint"><kbd>↵</kbd> all the rows, to sort and filter</p>` : ''}`;
  }
  const QWORDS = /^(why|what|which|who|whom|whose|where|when|how|is|are|was|were|does|do|did|can|could|should|will|would|show|list|find|explain|tell)\b/;
  const looksAsked = (q) => /\?\s*$/.test(q) || QWORDS.test(q.trim().toLowerCase());
  function commandsNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs(), list = [];
    if (w) {
      const n = (w.builds || []).length, kinds = Object.keys(waitsBy()).length;
      const I = issueOf(w), dc = DC();
      list.push({ g: 'now', icon: PAUSE, tone: 'bad', name: `Decide what readers see ${todayWord()}…`, sub: `${w.short} ${I.why} · ⧗ ${n}`, subHtml: `${esc(w.short)} ${esc(I.why)} · ${HOURGLASS} ${n}`, keys: `decide paused fix day ${dc.wd.toLowerCase()} today readers resolve choose`, run: decideNow, pv: () => previewDecide(w) }); // peer:builder r4: today; ⧗ 11, as the banner says it
      if (I.ask) list.push({ g: 'now', quiet: true /* peer:builder r4: found when typed */, icon: GL.mail, name: 'Draft a request for the file…', sub: `To whoever sends the ${w.short} export · you send it`, keys: 'draft ask request email message owner export file again resend', stay: requestFile, pv: () => `<p class="pto"><span>To</span><b>${esc(senderGet(w.id) || `whoever sends the ${w.short} export`)}</b>${senderGet(w.id) ? '' : '<small class="mut">· the data names no one yet</small>'}</p><p class="pdraft">${esc(requestText(w))}</p><p class="pvhint"><kbd>↵</kbd> shows it with a button to copy it, for you to send</p>` });
      list.push({ g: 'now', quiet: true /* peer:builder r4: “Which outputs wait?” asks it with a picture */, icon: GL.built, name: 'See what’s built from it', sub: `⧗ ${n} · in ${kinds} kind${kinds === 1 ? '' : 's'}`, subHtml: `${HOURGLASS} ${n} · in ${kinds} kind${kinds === 1 ? '' : 's'}`, keys: 'built from reach touches impact affected outputs wait downstream', run: showReach, pv: () => `<p class="pvd">${HOURGLASS} <b>${n}</b> waiting on ${esc(w.short)}</p>${outGroups(M.outputs.filter((o) => (w.builds || []).includes(o.id))).map(([g, l]) => `<h4>${esc(groupName(g))}</h4><ul class="pvk">${l.slice(0, 5).map((o) => `<li>${HOURGLASS}<span>${esc(plain(o.id))}</span></li>`).join('')}${l.length > 5 ? `<li class="pvmore">and ${l.length - 5} more</li>` : ''}</ul>`).join('')}` });
      if (!M.noRows) list.push({ g: 'now', quiet: true /* peer:builder r4 */, icon: GL.rows, name: `See ${dc.prev}’s ${w.short} rows`, sub: `The last good day, while ${todayWord()} is paused`, keys: 'rows data table explore', run: () => openRows(w.id), pv: () => previewRows(w) });
    } else if (dd) {
      if (dd.pendingFix || M.replaceable !== false) list.push({ g: 'now', icon: '↥', tone: 'owed', name: dd.pendingFix ? 'Publish the corrected file…' : `Replace ${isToday() ? 'today’s' : `${DC().wd}’s`} file…` /* peer:builder r4 */, sub: `${dd.short} · decided for now, the file is owed`, keys: 'replace upload send file corrected publish', run: replaceNow });
      list.push({ g: 'now', icon: '↶', name: 'Change the decision…', sub: 'On the day’s decision sheet', keys: 'undo change decision revert', run: () => host.decide(M.day) });
    }
    if (S.level === 'dataset') { const d = dsOf(S.ds); if (d.state !== 'waiting' && !M.noRows) list.push({ g: 'here', icon: GL.rows, name: `Explore ${d.short}’s rows`, sub: `${d.rowsToday != null ? fmt(d.rowsToday) + ' rows · ' : ''}sort, filter, tap a value`, keys: 'rows data table explore', run: () => openRows(d.id), pv: () => previewRows(d) }); list.push({ g: 'here', icon: ICON[kindOf(d.kind).icon], name: `Open ${kindOf(d.kind).name}`, sub: 'The kind it describes, with its neighbours', keys: 'kind up parent', run: () => go({ level: 'kind', kind: d.kind }) }); }
    if (S.level === 'kind') { const k = kindOf(S.kind); list.push({ g: 'here', icon: '✳', name: `Show how ${k.name} relates on the map`, sub: `${neighbours(k.id).length} related kinds, each saying how`, keys: 'map relations spotlight show', run: () => spotlight(k.id) }); }
    if (S.level !== 'estate') list.push({ g: 'here', icon: '⌂', name: 'Back to the whole estate', sub: 'Every kind and how they relate', keys: 'home estate map overview', run: () => go({ level: 'estate' }) });
    list.push({ g: 'help', icon: '⌨', name: 'Keyboard shortcuts', sub: 'Esc, Tab, ⌫, 1 to 4 and the rest', keys: 'help keys shortcuts keyboard', stay: helpKeys, pv: () => helpKeys().html });
    list.push({ g: 'help', icon: '?', name: 'What the marks mean', sub: 'Paused, waits, decided, unusual, and the colours', keys: 'help legend marks symbols colours colors', stay: helpMarks, pv: () => helpMarks().html });
    return list;
  }
  let closeSearchNow = null, searchAsked = false;
  function openSearch() {
    // asked before the map is first drawn (Ctrl K on a page just opened): opened once it is
    if (!M) { searchAsked = true; return; }
    if ($('.palette:not(.closing)')) return; closeToasts();
    const back0 = root.activeElement;
    const box = document.createElement('div'); box.className = 'palette'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Search, act or ask');
    box.innerHTML = `<div class="pscrim"></div><div class="pbox"><div class="pin"><span class="pi" aria-hidden="true">⌕</span><span class="pscope" hidden></span><input type="text" placeholder="Search, act or ask" aria-label="Search, act or ask" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="pres" aria-autocomplete="list"><kbd class="pesck">Esc</kbd><button type="button" class="pclose">Close</button></div><div class="pbody"><ul class="pres" id="pres" role="listbox" aria-label="What you can do"></ul><aside class="pprev" aria-label="Preview"></aside><div class="pans" hidden aria-live="polite"></div></div><div class="pfoot"><span class="pk2 pmv"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> run<span class="plk"> · <kbd>Tab</kbd> look inside</span></span><span class="pk2 ptab" hidden><kbd>↵</kbd> the first button · <kbd>Tab</kbd> moves between buttons</span><span class="pk2 pbk" hidden><kbd>⌫</kbd> back</span><span class="pk2 pesc"><kbd>Esc</kbd> <span class="pescw">close</span></span><span class="pwho">${ASK ? '✦ Claude answers from this page’s data' : '✦ Answers come from this page’s data'}</span></div></div>`;
    root.append(box);
    const input = box.querySelector('input'), list = box.querySelector('.pres'), ans = box.querySelector('.pans'), prev = box.querySelector('.pprev'), body = box.querySelector('.pbody');
    const wide = () => matchMedia('(min-width: 1000px)').matches;
    const goTo = [...M.kinds.map((k) => ({ icon: ICON[k.icon] || '', name: k.name, sub: `Kind · ${kindCount(k)}${k.datasets.length} datasets`, t: 'Kind', drill: { type: 'kind', id: k.id }, run: () => go({ level: 'kind', kind: k.id }), pv: () => previewKind(k) })),
      ...M.datasets.map((d) => ({ icon: GL.table, badge: stateBadge(d), name: d.short, sub: `Dataset · ${kindOf(d.kind).name}${d.state === 'waiting' ? ` · paused ${dW()} · ${fmt(d.rowsToday || 0)} rows` : d.state === 'decided' ? ' · decided for now, file owed' : d.state === 'warn' ? ` · unusual ${dW()}` : ''}`, t: 'Dataset', rank: STATE_RANK[d.state] ?? 9, drill: { type: 'ds', id: d.id }, run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }), pv: () => previewDs(d) })),
      ...M.datasets.flatMap((d) => d.columns.map((c) => ({ icon: colIcon(c), ty: tyFull(c), key: c.role === 'key', name: c.name, sub: `Column of ${d.short}${c.meaning ? ' · ' + c.meaning : ''}`, t: 'Column', ds: d.id /* peer:builder r4 */, mono: true, run: () => toDataset(d, () => openPanel(d.id, c.name)), pv: () => previewCol(d, c) })))];
    const score = (it, q) => { const n = it.name.toLowerCase(), s2 = (it.sub || '').toLowerCase(); if (n === q) return 100; if (n.startsWith(q)) return 80 - (it.t === 'Column' ? 5 : 0); if (n.split(/[\s_]+/).some((w) => w.startsWith(q))) return 60 - (it.t === 'Column' ? 5 : 0); if (n.includes(q)) return 40; if (s2.includes(q)) return 10; if (q.length >= 3 && n.split(/[\s_]+/).some((w) => w.length > 3 && lev(q, w) <= (w.length > 6 ? 2 : 1))) return 30; { const qw = q.split(/\s+/).filter((w) => w.length > 2), nw = n.split(/[\s_]+/); if (qw.length > 1 && qw.every((w) => nw.some((x) => x.startsWith(w) || (x.length > 3 && lev(w, x) <= (x.length > 6 ? 2 : 1))))) return 34; } let i = 0; for (const ch of n.replace(/[\s_]+/g, '')) if (ch === q[i]) i++; return q.length >= 3 && i === q.length ? 6 : 0; };
    const cmdScore = (c, q) => { const n = c.name.toLowerCase(), k = (c.keys || '').toLowerCase(), s = (c.sub || '').toLowerCase(); let t = 0; for (const w of q.split(/\s+/).filter(Boolean)) { const v = n.split(/[\s’'…:]+/).some((x) => x.startsWith(w)) ? 30 : n.includes(w) ? 20 : k.split(/\s+/).some((x) => x.startsWith(w)) ? 14 : s.includes(w) ? 6 : 0; if (!v) return 0; t += v; } return t; };
    const SEC = { recent: 'Asked before', now: 'Suggested now', here: 'Here', ask: 'Ask', help: 'Help', go: 'Go to' }, SECQ = { now: 'Do', here: 'Do', help: 'Help', ask: 'Ask', go: 'Go to' };
    let found = [], at = 0, mode = 'list', cur = null, ctl = null, scope = null, showAll = false, colsOpen = false; // peer:dq r3: colsOpen
    const chip = box.querySelector('.pscope');
    // inside a kind: what to do with it, then its datasets; inside a dataset: what to do with it, then its columns
    const scopeItems = (sc, q) => {
      const f = (it) => !q || it.name.toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q) || score(it, q) > 0;
      const asked = (x) => ({ g: 'in', ask: x, name: x, icon: '✦', tone: 'ask', pv: () => previewAsk(x) });
      if (sc.type === 'kind') {
        const k = kindOf(sc.id);
        const top = [{ g: 'in', icon: ICON[k.icon] || '', name: `Open ${k.name}`, sub: `${kindCount(k)}${k.datasets.length} datasets`, run: () => go({ level: 'kind', kind: k.id }), pv: () => previewKind(k) }, asked(`What does ${k.name} relate to?`), ...((M.month || []).length ? [asked(`How has ${k.name} been this month?`)] : [])];
        return [...top, ...goTo.filter((it) => it.t === 'Dataset' && it.drill && dsOf(it.drill.id)?.kind === k.id).sort((a, b) => a.rank - b.rank).map((it) => { const d = dsOf(it.drill.id); return { ...it, g: 'inlist', sub: `${d.rowsToday != null ? fmt(d.rowsToday) + ` rows ${dW()}` : 'no file yet'}${d.state === 'waiting' ? ` · paused ${dW()}` : d.state === 'warn' ? ` · unusual ${dW()}` : d.state === 'decided' ? ' · decided for now' : ''}` }; })].filter(f);
      }
      const d = dsOf(sc.id);
      // peer:dq r3: “Open” carries the preview's three things for a screen too narrow for the preview (sum); the rows line
      // says what it does in its name alone
      const top = [{ g: 'in', icon: GL.table, badge: stateBadge(d), name: `Open ${d.short}`, sub: kindOf(d.kind).name, sum: nowOf(d), run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }), pv: () => previewDs(d) }, ...(d.state === 'awaited' ? [] : [{ g: 'in', icon: GL.rows, name: `Explore ${d.short}${/s$/i.test(d.short) ? '’' : '’s'} rows` /* peer:dq r3: Access reviews’, not reviews’s */, sub: '', run: () => openRows(d.id), pv: () => previewRows(d) }]), asked(`What does ${d.short} join?`), asked(`What is built from ${d.short}?`)];
      const toOf = (c) => { const j = M.joins.find((x) => x.from === d.id && x.col === c.name && x.to !== d.id && dsOf(x.to)); return j ? ` · → ${dsOf(j.to).short}’s ${j.toCol || j.col}` : ''; };
      const cols = d.columns.map((c) => ({ g: 'inlist', icon: colIcon(c), ty: tyFull(c), key: c.role === 'key', name: c.name, mono: true, sub: (c.meaning || '') + toOf(c), run: () => toDataset(d, () => openPanel(d.id, c.name)), pv: () => previewCol(d, c) }));
      // peer:dq r3: its columns wait behind one line: pointed at, the preview lists them; ↵ or a tap lists them here, to
      // pick one. A search inside the file finds a column as before
      const showCols = () => { colsOpen = true; draw(); const i = found.findIndex((x) => x.g === 'inlist'); if (i >= 0) { at = i; mark(); } };
      const folded = q || colsOpen || !cols.length ? cols : [{ g: 'in', icon: COLGLYPH, name: `Its columns · ${cols.length}`, sub: '', open: showCols, pv: () => previewCols(d) }];
      return [...top, ...((M.month || []).length && (d.days || []).length ? [asked(`How has ${d.short} been this month?`)] : []), ...folded].filter(f);
    };
    const nameOf = (sc) => (sc.type === 'kind' ? kindOf(sc.id).name : dsOf(sc.id).short), path = [];
    const scopeName = () => (scope ? nameOf(scope) : '');
    const enter = (sc) => { path.push(sc); scope = sc; colsOpen = false; input.value = ''; draw(); input.focus(); }; // peer:dq r3: colsOpen
    const leave = () => { path.pop(); scope = path[path.length - 1] || null; colsOpen = false; input.value = ''; draw(); input.focus(); }; // peer:dq r3: colsOpen
    chip.onclick = (ev) => { const b = ev.target.closest('[data-lv]'); if (!b) return; const lv = +b.dataset.lv; if (lv < 0) return leave(); path.length = lv + 1; scope = path[lv]; colsOpen = false; input.value = ''; draw(); input.focus(); }; // peer:dq r3: colsOpen
    const preview = () => { if (!wide() || mode !== 'list') return; const it = found[at]; prev.innerHTML = it ? (it.pv ? it.pv() : `<div class="pvh"><span class="pico${it.tone ? ' ' + it.tone : ''}">${it.icon || ''}</span><div><b>${esc(it.name)}</b><span>${esc(it.sub || '')}</span></div></div>`) : ''; prev.scrollTop = 0; };
    const mark = () => { list.querySelectorAll('[data-i]').forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === at))); const el = list.querySelector(`[data-i="${at}"]`); if (el) { el.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', el.id); } preview(); foot(); };
    const draw = () => {
      mode = 'list'; cur = null; ans.hidden = true; list.hidden = false; body.classList.remove('answering'); try { ctl && ctl.abort(); } catch (e) { /* already stopped */ } ctl = null;
      const raw = input.value.trim(), q = raw.toLowerCase(), cmds = commandsNow();
      chip.hidden = !scope; chip.innerHTML = scope ? `<button type="button" class="pseg pup" data-lv="-1" aria-label="Back out of ${esc(nameOf(scope))}" title="Back out (⌫)">‹</button>${path.map((x, i) => (i < path.length - 1 ? `<button type="button" class="pseg" data-lv="${i}">${esc(nameOf(x))}</button><span class="psep" aria-hidden="true">›</span>` : `<span class="pcur">${esc(nameOf(x))}</span>`)).join('')}` : '';
      foot();
      input.placeholder = scope ? `Search in ${nameOf(scope)}, act or ask` : 'Search, act or ask';
      let items;
      if (scope) { items = scopeItems(scope, q); if (q) { const cm2 = cmds.map((c) => ({ c, s: cmdScore(c, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => ({ ...x.c, g: 'else' })); const gt2 = goTo.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s >= 40 && !items.some((y) => y.name === x.it.name)).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => ({ ...x.it, g: 'else' })); items = [...items, ...cm2, ...gt2]; } }
      else if (!q) { const rec = recentGet(), sug = questionsNow().filter((x) => !rec.some((r) => r.toLowerCase() === x.toLowerCase())); items = [...rec.slice(0, 2).map((x) => ({ g: 'recent', ask: x, name: tidyQ(x), icon: '↺', sub: '', pv: () => previewAsk(x) })), ...cmds.filter((c) => c.g !== 'help' && !c.quiet).slice(0, rec.length ? 5 : 6), ...sug.slice(0, rec.length ? 3 : 4).map((x) => ({ g: 'ask', ask: x, name: x, icon: '✦', tone: 'ask', pv: () => previewAsk(x) })), ...cmds.filter((c) => c.g === 'help')]; }
      else {
        const local = looksAsked(raw) ? answerLocal(q) : null;
        const askIt = { g: 'ask', ask: raw, name: local ? local.q || tidyQ(raw) /* peer:newcomer: as the answer's heading says it */ : `Ask “${raw}”`, sub: local ? '' /* peer:newcomer: the picture beside it says so */ : ASK ? 'Claude answers from this page’s data' : 'Answered from this page’s data', icon: '✦', tone: 'ask', card: local && !wide() ? cardOf(local) : null, pv: () => previewAsk(raw) };
        const cm = cmds.map((c) => ({ c, s: cmdScore(c, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map((x) => x.c);
        { const ord = []; cm.forEach((c) => { if (!ord.includes(SECQ[c.g])) ord.push(SECQ[c.g]); }); cm.sort((a, b) => ord.indexOf(SECQ[a.g]) - ord.indexOf(SECQ[b.g])); } // peer:builder r4: one heading per group, best group first
        const go0 = goTo.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s > 0), hitDs = new Set(go0.filter((x) => x.it.t === 'Dataset' && x.s >= 60).map((x) => x.it.drill.id)); // peer:builder r4
        const allGo = go0.filter((x) => !(x.it.t === 'Column' && x.s < 40 && hitDs.has(x.it.ds))).sort((a, b) => b.s - a.s || (a.it.rank ?? 9) - (b.it.rank ?? 9)); // a file found by name keeps its columns one Tab away
        let gt = allGo.slice(0, showAll ? 60 : 6).map((x) => ({ ...x.it, g: 'go' }));
        const rest = allGo.length - gt.length;
        if (rest > 0) gt.push({ g: 'go', more: true, icon: '⋯', name: `${rest} more named like “${raw}”`, sub: [['Kind', 'kind'], ['Dataset', 'dataset'], ['Column', 'column']].map(([t, w]) => { const c = allGo.slice(gt.length).filter((x) => x.it.t === t).length; return c ? `${c} ${w}${c === 1 ? '' : 's'}` : ''; }).filter(Boolean).join(' · '), pv: () => `<p class="pvd">${allGo.slice(gt.length, gt.length + 12).map((x) => `${x.it.t === 'Column' ? `<code>${esc(x.it.name)}</code>` : `<b>${esc(x.it.name)}</b>`} <small class="mut">${esc(x.it.t.toLowerCase())}</small>`).join(' · ')}${rest > 12 ? ' …' : ''}</p><p class="pvhint"><kbd>↵</kbd> lists them all</p>` });
        if (looksAsked(raw)) { const mt = mentions(q), named = goTo.filter((it) => (mt.ds && it.t === 'Dataset' && it.drill?.id === mt.ds.id) || (mt.kd && it.t === 'Kind' && it.drill?.id === mt.kd.id) || (mt.col && it.t === 'Column' && it.name === mt.col)).slice(0, 3).map((it) => ({ ...it, g: 'go' })); gt = [...named, ...gt.filter((x) => !named.some((y) => y.name === x.name && y.t === x.t))].slice(0, 6); }
        items = looksAsked(raw) ? [askIt, ...cm, ...gt] : raw.length < 3 ? [...gt, ...cm, askIt] /* peer:builder r4: a name being typed */ : [...cm, ...gt, askIt];
      }
      found = items; at = 0; let last = null;
      const SECS = scope ? { in: scopeName(), inlist: scope.type === 'kind' ? 'Its datasets' : 'Its columns', else: 'Everywhere' } : q ? SECQ : SEC;
      list.innerHTML = items.length ? items.map((it, i) => { const sec = SECS[it.g]; const head = sec !== last ? `<li class="psec" role="presentation">${sec}</li>` : ''; last = sec; if (it.card) return head + `<li role="option" id="po${i}" aria-selected="${i === at}" data-i="${i}" class="pcard"><span class="pico ask">✦</span><span class="pcq">${esc(it.name)}</span><div class="pcb">${it.card}<span class="apfull">Full answer ›</span></div></li>`; /* peer:newcomer */ return head + `<li role="option" id="po${i}" aria-selected="${i === at}" data-i="${i}"${it.more ? ' class="pmorerow"' : ''}><span class="pico${it.tone ? ' ' + it.tone : ''}">${it.icon || ''}${it.badge || ''}</span><span class="pn${it.mono ? ' mono' : ''}">${esc(it.name)}</span><span class="ps${it.prev ? ' prev' : ''}">${it.subHtml || esc(it.sub || '')}</span><span class="pr">${it.ty ? `<span class="pty${it.key ? ' kb' : ''}">${it.ty}</span>` : ''}<span class="pk">${it.more || it.open ? 'Show ↵' : it.ask ? 'Ask ↵' : it.stay ? 'Open ↵' : '↵'}</span>${it.drill ? '<button type="button" class="pdrill" tabindex="-1" aria-label="Look inside">›</button>' : ''}</span>${it.sum ? `<div class="dqsum">${it.sum}</div>` : '' /* peer:dq r3 */}</li>`; }).join('') : `<li class="none">Nothing ${scope ? 'inside ' + esc(scopeName()) + ' ' : ''}by that name${scope ? '' : '. Press Enter to ask instead.'}</li>`;
      list.querySelectorAll('[data-i]').forEach((li) => { li.onmousemove = () => { if (at !== +li.dataset.i) { at = +li.dataset.i; mark(); } }; li.onclick = (ev) => { const it = found[+li.dataset.i]; const a = ev.target.closest('[data-ask]'); if (a) { ev.stopPropagation(); return ask(a.dataset.ask); } /* peer:dq r3 */ if (ev.target.closest('.pdrill') && it.drill) return enter(it.drill); runIt(it); }; }); /* merged: peer:newcomer + peer:dq r3 */
      mark();
    };
    // Esc closes from anywhere; ⌫ or ← on an empty line steps back out of an answer, a dataset or a kind
    const foot = () => { const f = box.querySelector('.pfoot'); if (!f) return; const inAns = mode === 'answer'; f.querySelector('.pbk').hidden = !((scope || inAns) && !input.value); f.querySelector('.ptab').hidden = !inAns; f.querySelector('.pmv').hidden = inAns; f.querySelector('.plk').hidden = inAns || !found.some((x) => x && x.drill); f.querySelector('.pescw').textContent = 'close'; };
    const back = () => { if (mode === 'answer') { draw(); input.focus(); } else if (scope) leave(); else if (input.value) { input.value = ''; showAll = false; draw(); input.focus(); } else close(); };
    const close = () => { try { ctl && ctl.abort(); } catch (e) { /* already stopped */ } box.classList.add('closing'); setTimeout(() => box.remove(), 150); if (back0 && back0.focus && root.contains(back0)) back0.focus({ preventScroll: true }); closeSearchNow = null; };
    closeSearchNow = close;
    const doAct = (a) => { if (!a) return; if (a.ask) return ask(a.ask); if (a.stay) { const x = a.stay(); return showAnswer(x.title || a.label, x, 'page'); } if (a.keep) return a.run(); close(); a.run(); };
    const showAnswer = (q, a, src) => {
      mode = 'answer'; cur = a; list.hidden = true; ans.hidden = false; body.classList.add('answering'); input.removeAttribute('aria-activedescendant'); input.value = ''; input.placeholder = 'Ask another, or ⌫ to go back'; foot();
      ans.innerHTML = `<div class="pq"><span class="pico ask">${a.icon || (a.title ? '?' : '✦')}</span><b>${esc(a.title || a.q || tidyQ(q))}</b><button type="button" class="pback">‹ Back</button></div><div class="pa">${a.pic ? `${a.note ? `<p class="pnote">${esc(a.note)}</p>` : ''}${a.pic}${a.line ? `<p class="apline">${a.line}</p>` : ''}${a.more || ''}` /* peer:newcomer */ : a.html}</div>${a.acts && a.acts.length ? `<div class="pacts">${a.acts.map((x, i) => `<button type="button" class="btn${x.primary ? ' primary' : ''}${x.ask ? ' askq' : ''}" data-a="${i}">${x.ask ? '✦ ' : ''}${esc(x.label)}${x === (a.acts.find((y) => y.primary) || null) ? ' <span class="pkbd" aria-hidden="true">↵</span>' : ''}</button>`).join('')}</div>` : ''}${a.title ? '' : `<div class="psrc">${src === 'claude' ? '✦ Claude, from this page’s data' : 'From this page’s data'}${src !== 'claude' && ASK ? ' · <button type="button" class="link" data-claude>Ask Claude instead</button>' : ''}</div>`}`;
      ans.querySelector('.pback').onclick = () => { draw(); input.focus(); };
      const tf = ans.querySelector('.tofield'); if (tf) { tf.oninput = () => senderSet(tf.dataset.to, tf.value.trim()); tf.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); doAct((a.acts || []).find((x) => x.primary)); } }; }
      ans.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => doAct(a.acts[+b.dataset.a])));
      const c = ans.querySelector('[data-claude]'); if (c) c.onclick = () => askClaude(q);
      ans.querySelectorAll('[data-more]').forEach((b) => (b.onclick = () => { const rest = b.nextElementSibling; if (rest) rest.hidden = false; b.remove(); input.focus(); }));
      ans.querySelectorAll('.pa [data-ask]').forEach((b) => (b.onclick = () => ask(b.dataset.ask))); // peer:newcomer
    };
    const askClaude = async (q) => {
      try { ctl && ctl.abort(); } catch (e) { /* already stopped */ }
      const my = (ctl = new AbortController());
      showAnswer(q, { html: '<p class="pthink">Claude is reading this page’s data</p>', acts: [{ label: 'Stop', keep: true, run: () => my.abort() }] }, 'claude');
      const pa = ans.querySelector('.pa');
      try {
        const res = await ASK(claudePrompt(q), { modelTier: 'quick', signal: my.signal, onText: ({ text }) => { if (my === ctl) pa.innerHTML = paras(String(text).split(/\n?ACTIONS:/)[0]); } });
        if (my !== ctl) return;
        const [body, tail] = String(res.text || '').split(/\n?ACTIONS:/);
        showAnswer(q, { html: paras(body), acts: parseActs(tail) }, 'claude');
      } catch (e) {
        if (my !== ctl) return;
        if (e && e.code === 'cancelled') { draw(); return; }
        if (e && /not_granted|sampling_disabled|capability_disabled|capability_removed|not_declared/.test(e.code || '')) ASK = null;
        const why = e && e.code === 'not_granted' ? 'Claude isn’t allowed on this page, so this answer comes from the page itself.' : e && e.code === 'rate_limited' ? 'Claude is busy for you right now, so this answer comes from the page itself.' : 'Claude couldn’t answer, so this comes from the page itself.';
        const local = answerLocal(q.toLowerCase()) || fallbackAnswer();
        showAnswer(q, { ...local, note: why, html: `<p class="pnote">${why}</p>${local.html}` }, 'page');
      }
    };
    const ask = (q) => { q = String(q).trim(); if (!q) return; const local = answerLocal(q.toLowerCase()); recentAdd(local?.q || q); if (local) return showAnswer(q, local, 'page'); if (ASK) return askClaude(q); showAnswer(q, fallbackAnswer(), 'page'); };
    const runIt = (it) => { if (!it) return; if (it.open) { it.open(); input.focus(); return; } /* peer:dq r3 */ if (it.more) { showAll = true; draw(); input.focus(); return; } if (it.ask) return ask(it.ask); if (it.stay) return showAnswer(it.name, it.stay(), 'page'); close(); it.run(); };
    input.oninput = () => { showAll = false; draw(); };
    input.onkeydown = (e) => {
      if (e.key === 'ArrowDown' && mode === 'list') { at = Math.min(found.length - 1, at + 1); mark(); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && mode === 'list') { at = Math.max(0, at - 1); mark(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (mode === 'answer') doAct((cur.acts || []).find((x) => x.primary) || (cur.acts || [])[0]); else if (found[at]) runIt(found[at]); else ask(input.value); }
      else if (mode === 'list' && found[at]?.drill && ((e.key === 'Tab' && !e.shiftKey) || (e.key === 'ArrowRight' && input.selectionStart === input.value.length))) { e.preventDefault(); enter(found[at].drill); }
      else if (e.key === 'Tab' && mode === 'list') { e.preventDefault(); if (e.shiftKey && scope) leave(); }
      else if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && !input.value) { if (mode === 'answer') { e.preventDefault(); draw(); input.focus(); } else if (scope) { e.preventDefault(); leave(); } }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    };
    input.addEventListener('keyup', () => foot());
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target !== input) { e.preventDefault(); e.stopPropagation(); close(); } });
    box.querySelector('.pscrim').onclick = close; box.querySelector('.pclose').onclick = close;
    prev.onclick = (ev) => { const qa = ev.target.closest('[data-ask]'); if (qa) { ev.preventDefault(); ask(qa.dataset.ask); input.focus(); return; } if (ev.target.closest('[data-full]')) runIt(found[at]); }; // peer:newcomer + peer:dq r3
    draw(); input.focus();
  }

  // ------------------------------------------------------------------ start
  canvas.addEventListener('click', () => { if (S.spotPin) { S.spotPin = null; lightUp(); return; } if (S.level === 'kind') go({ level: 'estate' }); });
  $('.search').addEventListener('click', openSearch); $('.search').setAttribute('role', 'button'); $('.search').tabIndex = 0; $('.search').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSearch(); } });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.level === 'dataset' && S.outsOpen && !S.panel && !$('.palette')) { S.outsOpen = null; render(); e.stopImmediatePropagation(); } }, true); // peer:builder
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.pin && !S.panel && !$('.palette')) { S.pin = null; lightUp(); render(true); e.stopImmediatePropagation(); return; } }, true);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.reachPin && !S.panel && !$('.palette')) { S.reachPin = false; S.reach = false; renderChrome(); lightUp(); e.stopImmediatePropagation(); } }, true);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.spotPin && !S.panel && !$('.palette')) { S.spotPin = null; lightUp(); e.stopImmediatePropagation(); } }, true);
  root.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || $('.palette')) return; if (S.panel) return closePanel(); if (S.level === 'dataset') go({ level: 'kind', kind: dsOf(S.ds).kind }); else if (S.level === 'kind') go({ level: 'estate' }); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!M) return; estateCache = null; spotMemo = { key: '' }; render(true); }, 120); });
  // ------------------------------------------------------------------ peer:design: one tip for a count, a link and the key
  // A count on the map is an hourglass and a number (⧗ 2), a link a few words, what the marks mean a "?". What each stands
  // for opens in the same box: on hover, on focus or on a tap; it closes on leaving, a tap elsewhere or Escape.
  const tipBox = document.createElement('div'); tipBox.id = 'smtip'; tipBox.className = 'smtip'; tipBox.setAttribute('role', 'tooltip'); tipBox.hidden = true; root.append(tipBox);
  const tipList = (l) => `<ul>${l.map((o) => `<li>${esc(plain(o.id))}</li>`).join('')}</ul>`;
  const TIPS = {
    // a kind's count: the outputs about that kind which wait on the paused file
    wait: (kid) => { const w0 = waitingDs(), l = waitsBy()[kid] || []; return w0 && l.length ? `<p class="tiph">${HOURGLASS}<span>${outputsWait(l.length)} on ${esc(w0.short)}</span></p>${tipList(l)}` : ''; },
    // the banner's count: every output built from the paused file, by the kind each is about, as the map's counts are
    waits: () => {
      const w0 = waitingDs(); if (!w0) return '';
      const by = new Map(); for (const id of w0.builds || []) { const o = M.outputs.find((x) => x.id === id) || { id }; let kk = outKind(id); if (kk === 'check') kk = w0.kind; const g = kk && kindOf(kk) ? cap(PL(kk)) : 'Other'; by.set(g, [...(by.get(g) || []), o]); }
      const n = (w0.builds || []).length; if (!n) return '';
      return `<p class="tiph">${HOURGLASS}<span>${outputsWait(n)} on ${esc(w0.short)}</span></p>${[...by].sort((a, b) => b[1].length - a[1].length).map(([g, l]) => `<p class="tipg">${esc(g)} · ${l.length}</p>${tipList(l)}`).join('')}`;
    },
    link: (k) => linkTips.get(k) || '',
    say: (k) => (sayTips.get(k) ? `<p class="tips">${sayTips.get(k)}</p>` : ''), // peer:design r4
    key: () => `<div class="tipkey">${legendHtml('')}</div><p class="tipn">${S.level === 'kind' ? 'Point at a neighbour to light the files that carry its link · Esc steps back' /* peer:newcomer (r4) */ : S.level === 'dataset' ? 'Open its columns, then tap one for its values · Esc steps back' /* peer:design r4 rev 1 */ : 'Point at a kind, or Tab to one, for its links in full'}</p>`,
  };
  let tipAt = null, tipPin = false;
  const tipHtml = (el) => { const v = el.dataset.tip || '', i = v.indexOf(':'), f = TIPS[i < 0 ? v : v.slice(0, i)]; return f ? f(i < 0 ? '' : v.slice(i + 1)) : ''; };
  function tipPlace() {
    if (!tipAt) return;
    const r = tipAt.getBoundingClientRect(), m = 8, W = document.documentElement.clientWidth, H = innerHeight;
    tipBox.style.maxWidth = Math.min(320, W - 2 * m) + 'px'; tipBox.style.left = '0px'; tipBox.style.top = '0px';
    const w2 = tipBox.offsetWidth, h2 = tipBox.offsetHeight, below = r.bottom + 6, above = r.top - 6 - h2;
    tipBox.style.left = Math.round(Math.max(m, Math.min(W - m - w2, r.left + r.width / 2 - w2 / 2))) + 'px';
    // a kind's count sits on the kind's top edge: its tip opens above it, clear of the kind; every other tip below
    const up = tipAt.matches('.kind > .kwait') ? above >= m : !(below + h2 <= H - m || above < m);
    tipBox.style.top = Math.round(up ? above : below) + 'px';
  }
  function tipOpen(el, pin) {
    const html = tipHtml(el); if (!html) return;
    if (tipAt && tipAt !== el) tipClose();
    tipAt = el; tipPin = !!pin; tipBox.innerHTML = html; tipBox.hidden = false; tipBox.classList.toggle('pinned', tipPin);
    el.setAttribute('aria-expanded', 'true'); el.setAttribute('aria-describedby', 'smtip'); tipPlace();
  }
  function tipClose() {
    if (!tipAt) return;
    tipAt.setAttribute('aria-expanded', 'false'); tipAt.removeAttribute('aria-describedby'); tipAt = null; tipPin = false; tipBox.hidden = true;
  }
  // the map draws its links again on every point: an open tip moves to its link drawn again, or closes with it
  function tipSync() {
    if (!tipAt || tipAt.isConnected) return;
    const again = root.querySelector(`[data-tip="${CSS.escape(tipAt.dataset.tip || '')}"]`);
    if (!again) { tipAt = null; tipPin = false; tipBox.hidden = true; return; }
    tipAt = again; again.setAttribute('aria-expanded', 'true'); again.setAttribute('aria-describedby', 'smtip'); tipPlace();
  }
  const tipOf = (t) => (t && t.closest ? t.closest('[data-tip]') : null);
  root.addEventListener('mouseover', (ev) => {
    const t = tipOf(ev.target);
    if (t && t.hasAttribute('data-tipgo')) return; // peer:design r4: a card's tip waits for the pointer to move over it (below)
    if (t) { const k = t.closest('.node.kind'); tipKind = k && S.level === 'estate' ? k.dataset.id : null; if (tipKind && S.hover === tipKind) { S.hover = null; lightUp(); } if (!tipPin && tipAt !== t) tipOpen(t, false); return; }
    if (tipKind) { const k = ev.target.closest && ev.target.closest('.node.kind'); if (k && k.dataset.id === tipKind && S.level === 'estate' && !S.hover) { S.hover = tipKind; lightUp(); } tipKind = null; }
  });
  root.addEventListener('mousemove', (ev) => { if (!(ev.movementX || ev.movementY)) return; const t = tipOf(ev.target); if (t && t.hasAttribute('data-tipgo') && !tipPin && tipAt !== t) tipOpen(t, false); }); // peer:design r4
  root.addEventListener('mouseout', (ev) => { if (!tipAt || tipPin || !tipAt.contains(ev.target)) return; if (ev.relatedTarget && tipAt.contains(ev.relatedTarget)) return; tipClose(); });
  root.addEventListener('focusin', (ev) => { const t = tipOf(ev.target); if (t) { if (t !== tipAt) tipOpen(t, false); return; } if (tipAt && !tipBox.contains(ev.target)) tipClose(); });
  root.addEventListener('focusout', (ev) => { if (tipAt && ev.target === tipAt && !tipPin && !(ev.relatedTarget && tipBox.contains(ev.relatedTarget))) tipClose(); });
  // a tap or a click keeps it open; another, or a tap on the tip, closes it; a tap anywhere else closes it and still does
  // what was tapped
  root.addEventListener('click', (ev) => {
    const t = tipOf(ev.target);
    if (t && t.hasAttribute('data-tipgo')) { tipClose(); return; } // peer:design r4: a card's tap goes where it goes
    if (t) { ev.preventDefault(); ev.stopPropagation(); if (tipAt === t && tipPin) tipClose(); else tipOpen(t, true); return; }
    if (tipAt) tipClose();
  }, true);
  root.addEventListener('keydown', (ev) => {
    const t = tipOf(ev.target);
    if (t && !t.hasAttribute('data-tipgo') && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ev.stopPropagation(); if (tipAt === t && tipPin) tipClose(); else tipOpen(t, true); return; }
    if (ev.key === 'Escape' && tipAt) { const back = tipPin ? tipAt : null; tipClose(); ev.preventDefault(); ev.stopImmediatePropagation(); if (back) back.focus({ preventScroll: true }); }
  }, true);
  addEventListener('scroll', () => { if (!tipAt) return; if (tipPin) tipPlace(); else tipClose(); }, true);
  addEventListener('resize', () => tipClose());
  const api = {
    setModel, show, openSearch, closePanel, go, render,
    closeSearch: () => closeSearchNow && closeSearchNow(),
    level: () => ({ level: S.level, kind: S.kind, ds: S.ds }),
    destroy: () => { tipClose(); closePanel(true); },
  };
  const fonts = document.fonts ? Promise.race([Promise.all(['600 15px Geist', '400 13px Geist', '500 13px Geist', '500 13px "Geist Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {}) : Promise.resolve();
  fonts.then(() => { M = host.model(); show(host.level()); render(true); host.ready(); if (searchAsked) { searchAsked = false; openSearch(); } });
  return api;

}
