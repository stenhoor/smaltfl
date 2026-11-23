// The Data model explorer: three levels on one canvas, each node keeping its identity as the view zooms between them.
//   estate   — the kinds of thing and how they relate, every dataset inside the kind it describes
//   kind     — one kind opened to fill the view, its datasets as cards, its neighbours as ports at the edges
//   dataset  — one dataset in the middle with its columns; what it joins to, what it builds, what it is evidence for
(() => {
  const $ = (s, el = document) => el.querySelector(s);
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
  const S = { m: 'larkspur', level: 'estate', kind: null, ds: null, hover: null, panel: null, ver: 0, reach: false };
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
    if (one && r.name !== 'about' && kindOf(r.from)?.datasets[0] !== one.id) return { from: r.from, to: r.to, verb: plVerb(r.name), subj: one.nouns || one.short.toLowerCase() };
    return { from: r.from, to: r.to, verb: plVerb(r.name) };
  }
  function sentence(r, withVia = true) {
    const v = relView(r), since = (r.since ? ' since Mar 11' : r.soon ? ` from ${r.soon}` : '') + (r.proposed ? ' (proposed)' : '');
    const via = withVia && viaParts(r).length ? ' · ' + viaParts(r).filter((x) => !/^since/.test(x)).join(' · ') : '';
    return `${cap(v.subj || PL(v.from))} ${v.verb} ${v.obj || PL(v.to)}${since}${via}`;
  }
  // the same sentence with one kind's name in bold: the kind pointed at, so every sentence on the map says whose it is
  function sentenceHtml(r, focus) {
    const v = relView(r), since = r.since ? ' since Mar 11' : r.soon ? ` from ${r.soon}` : '';
    const noun = (kid, word) => (kid === focus ? `<b>${esc(word)}</b>` : esc(word));
    return `${noun(v.from, cap(v.subj || PL(v.from)))} ${esc(v.verb)} ${v.obj ? esc(v.obj) : noun(v.to, PL(v.to))}${since}`;
  }
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
  const waitBadge = (kid) => { const n = (waitsBy()[kid] || []).length, w0 = waitingDs(); return n && w0 && !M.quietBanner ? `<span class="kwait" role="button" data-reach title="${n} output${n === 1 ? '' : 's'} about ${esc(PL(kid))} built from ${esc(w0.short)}: see them">${HOURGLASS} ${n} <span class="kgo" aria-hidden="true">›</span></span>` : ''; };
  function waitsBy() { const w0 = M.datasets.find((d) => d.state === 'waiting'), by = {}; if (!w0) return by; for (const o of M.outputs) if (o.waiting) { let kk = outKind(o.id); if (kk === 'check') kk = w0.kind; if (kk && kk !== 'context') (by[kk] ||= []).push(o); } return by; }
  const decidedDs = () => M.datasets.find((d) => d.state === 'decided');
  const replacedDs = () => M.datasets.find((d) => d.replaced);
  // the day on screen: Wed Mar 27 in the demo, the build's day while building (M.dayCtx)
  const DC0 = { iso: '2024-03-27', today: 'Wed Mar 27', prev: 'Tue Mar 26', wd: 'Wednesday', pwd: 'Tuesday', d: 'Wed 27', pd: 'Tue 26', first: 'Fri Mar 1' };
  const DC = () => ({ ...DC0, ...((M && M.dayCtx) || {}) });
  const issueDs = () => waitingDs() || decidedDs();
  // what a paused file's choices say: the demo's empty file, unless the dataset brings its own issue (the build's days)
  // a tap on the dimmed map beside an open sheet: the sheet closes and what was under the tap still acts
  if (!window.__scrimThrough) { window.__scrimThrough = true; document.addEventListener('click', (ev) => { if (!ev.isTrusted || !ev.target.closest || !ev.target.closest('.scrim')) return; const x = ev.clientX, y = ev.clientY; const under = document.elementsFromPoint(x, y).find((el) => !el.closest('[id^="layer"], .scrim, .panel, .vx-ring, .vx-cur, .vx-cap')); const t = under && under.closest('button, a, [data-col], [data-rows], [data-id]'); if (t) setTimeout(() => t.click(), 80); }, true); }
  function issueOf(d) {
    const c = DC(), I0 = (d && d.issue) || {}, n = ((d && d.builds) || []).length, noun = I0.noun || 'reviews';
    const from = I0.fillFrom || c.prev, fromWd = I0.fillFromWd || c.pwd;
    const base = {
      kind: 'empty', why: 'arrived empty', title: `${c.wd}’s file arrived empty`, sub: `0 rows${d && d.rowsUsual ? ` · usually about ${fmt(usualN(d.rowsUsual))}` : ''}`,
      options: ['keep', 'fill', 'wait', 'asis'], suggest: 'keep', sugText: (!d || !d.issue || d.issue.demo) && M.demoSugText ? M.demoSugText : 'Keep, not Fill: one whole day for readers', sugEvidence: !d || !d.issue || d.issue.demo ? M.demoSugEvidence || '' : '', sugWord: 'suggested', risky: ['asis'], owes: true, ask: true, fillFrom: from, fillFromD: I0.fillFromD || c.pd, noun,
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
    const v = r.via || [], cols = [...new Set(v.map((x) => x.col).filter(Boolean))], since = r.since ? 'since Mar 11' : null;
    // where several datasets carry it, the register among them is named: the one the others repeat
    const reg = v.find((x) => { const d = dsOf(x.ds); return d && kindOf(d.kind)?.datasets[0] === x.ds; });
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
    const TW = compact ? Math.min(310, Math.max(232, ...M.kinds.map((k) => 70 + tw(k.name, '600 15px Geist') + tw(fmt(k.count), '400 13px Geist') + 8 + (paused(k.id).length ? 92 : 0)))) : 0;
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
    const top = S.m === 'larkspur' || M.reserveTop || paused('application').length ? 76 : 20, pad = 36, foot = M.reserveBottom || 0;
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
      const says = relPairs().filter((r) => relView(r).from === k.id).map((r) => sentence(r, false));
      const sh = says.length ? says.length * 18 + 8 : 0;
      L.set('k:' + k.id, { x, y, w, h: h + sh, s: 1, v: 'kind-estate', o: 1, says });
      k.datasets.forEach((d, i) => L.set('d:' + d, { x: x + 14 + (i % c) * (cw + 8), y: y + 64 + extra + sh + Math.floor(i / c) * 40, w: cw, h: 34, s: 1, v: 'chip', o: 1 }));
      y += h + sh + 16;
    }
    return { nodes: L, edges: [], scroll: y + 20 };
  }
  function groupsOf(k) {
    const K = kindOf(k), list = K.datasets.map(dsOf);
    if (k === 'application' && S.m === 'larkspur') return [['The register: every application', list.filter((d) => d.id === 'cmdb_apps' || d.awaited)], ['Evidence about each application · joined on app_id', list.filter((d) => d.id !== 'cmdb_apps' && !d.awaited)]];
    if (list.length < 4) return [[null, list]];
    const reg = list[0], key = (reg.columns.find((c) => c.role === 'key') || {}).name;
    if (list.slice(1).some((d) => d.group)) {
      // themes, the biggest first; inside each, what needs a look first, then the largest
      const rank = (d) => (d.state === 'waiting' ? 0 : d.state === 'warn' ? 1 : 2), themes = new Map();
      for (const d of list.slice(1)) { const g = d.group || 'Other'; if (!themes.has(g)) themes.set(g, []); themes.get(g).push(d); }
      for (const l of themes.values()) l.sort((a, b) => rank(a) - rank(b) || (b.rowsToday || 0) - (a.rowsToday || 0));
      return [[`The register: every ${K.noun || K.name.toLowerCase()}`, [reg]], ...[...themes.entries()].sort((a, b) => b[1].length - a[1].length)];
    }
    return [[`The register: every ${K.noun || K.name.toLowerCase()}`, [reg]], [`About each ${K.noun || K.name.toLowerCase()}${key ? ' · joined on ' + key : ''}`, list.slice(1)]];
  }
  function layoutKind(W, H) {
    const k = S.kind, L = new Map(), E = estateWorld(), nb = neighbours(k), K = kindOf(k);
    const groups = groupsOf(k);
    const edges = dirEdges(relPairs().filter((r) => r.from === k || r.to === k), (x) => 'k:' + x), relOf = {};
    const blocksOf = {};
    for (const e of edges) { const o = e.a === 'k:' + k ? e.b : e.a; relOf[o] = [...(relOf[o] || []), ...e.sents]; blocksOf[o] = [...(blocksOf[o] || []), ...e.blocks]; e.level = true; e.label = null; const cs = [...carriers(k, o.slice(2))]; if (cs.length === 1) e.carrier = cs[0]; }
    if (narrow() || W < 1100) return stackKind(W, groups, nb, relOf);
    const CW = 158, CH = 32, CG = 8, SG = 22, SXG = 28, PAD = 22, HEAD = 86, GAP = 64, TW = 300;
    const slotH = (o) => tileH(o, TW) + relsH(blocksOf['k:' + o], TW) + 6;
    const labW = Math.max(0, ...groups.map(([g, l]) => (g ? tw((g + (l.length > 3 ? ` · ${l.length}` : '')).toUpperCase(), '600 11px Geist') * 1.08 + 6 : 0)));
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
      if (sec.g) { L.set('g:' + k + ':' + sec.g, { ...P(x0, y0), w: secW, h: 18, s: sc, v: 'group', o: 1, text: sec.g + (sec.list.length > 3 ? ` · ${sec.list.length}` : '') }); y0 += 26; }
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
        else L.set('k:' + it.o, { ...pos, w: TW, h: it.h, s: sc, v: 'kind-compact', o: 1, rel: relOf['k:' + it.o], says: blocksOf['k:' + it.o] });
      }
    }
    return { nodes: L, edges, scroll: H };
  }
  function portHeight(rel, w) { const lines = (rel || []).reduce((a, t) => a + Math.max(1, Math.ceil(tw(t, '500 13px Geist') / (w - 74))), 0); return 46 + Math.max(1, lines) * 16; }
  function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  // how tall a tile's sentences stand: each sentence, then the quieter line of what carries it
  function relsH(blocks, W) { return (blocks || []).reduce((a, b) => a + (typeof b === 'string' ? wrapLines(b, '400 13px Geist', W - 66).length * 16 : wrapLines(b.s, '500 13px Geist', W - 66).length * 16 + (b.via ? wrapLines(b.via, '400 12px Geist', W - 66).length * 15 : 0)) + 4, 0); }
  function stackKind(W, groups, nb, relOf) {
    const L = new Map(), k = S.kind; let y = 16; const x = 16, w = W - 32, nc = W >= 700 ? 2 : 1, cc = W >= 700 ? 4 : 2, nw = (w - (nc - 1) * 12) / nc;
    for (let i = 0; i < nb.length; i += nc) {
      const row = nb.slice(i, i + nc), hs = row.map((o) => tileH(o, nw) + relsH(relOf['k:' + o] || [], nw) + 6), rh = Math.max(...hs);
      row.forEach((o, j) => { const rel = relOf['k:' + o] || []; L.set('k:' + o, { x: x + j * (nw + 12), y, w: nw, h: nc > 1 ? rh : hs[j], s: 1, v: 'kind-compact', o: 1, rel, says: rel }); });
      y += rh + 8;
    }
    y += 8;
    const top = y; y += W >= 700 ? 96 : 112;
    const cw = (w - 32 - (cc - 1) * 8) / cc, items = [];
    for (const [g, list] of groups) {
      if (g) { const t = g + (list.length > 3 ? ` · ${list.length}` : ''), two = tw(t.toUpperCase(), '600 11px Geist') * 1.08 > w - 32; items.push(['g:' + k + ':' + g, { x: x + 16, y, w: w - 32, h: two ? 36 : 18, s: 1, v: 'group', o: 1, text: t }]); y += two ? 44 : 26; }
      list.forEach((d, i) => items.push(['d:' + d.id, { x: x + 16 + (i % cc) * (cw + 8), y: y + Math.floor(i / cc) * 40, w: cw, h: 32, s: 1, v: 'chip', o: 1 }]));
      y += Math.ceil(list.length / cc) * 40 + 14;
    }
    L.set('k:' + k, { x, y: top, w, h: y - top + 4, s: 1, v: 'kind-open', o: 1 });
    for (const [id, r] of items) L.set(id, r);
    return { nodes: L, edges: [], scroll: y + 40 };
  }
  function neighbourhood(id) {
    const d = dsOf(id);
    const out = M.joins.filter((j) => j.from === id && j.to !== id && dsOf(j.to));
    const inc = M.joins.filter((j) => j.to === id && j.from !== id);
    const outs = (d.builds || []).map((o) => M.outputs.find((x) => x.id === o) || { id: o });
    return { d, out, inc, outs };
  }
  function layoutDataset(W, H) {
    const { d, out, inc, outs } = neighbourhood(S.ds), L = new Map();
    const colsShown = d.columns.slice(0, 12), fw0 = narrow() ? W - 32 : 460;
    const row1 = firstRowOf(d); // peer:newcomer
    const rowH = colsShown.map((c, i) => (colTwo(c, fw0, row1 ? cvW(cvSaid(c, row1[i])) : undefined) ? 46 : 30));
    const rowY = {}; let acc = (narrow() ? HEAD_H + 40 : HEAD_H) + (row1 ? CVH : 0); colsShown.forEach((c, i) => { rowY[c.name] = acc; acc += rowH[i]; });
    const fh = acc + (d.columns.length > 12 ? 30 : 0) + 8;
    if (narrow()) return stackDataset(W, d, out, inc, outs, fh);
    const mid = W < 1180, fw = 460, K2 = kindOf(d.kind), TWk = Math.max(248, 74 + tw(K2.name, '600 15px Geist') + tw(fmt(K2.count), '400 13px Geist') + 8 + (paused(d.kind).length ? 96 : 0)), th2 = tileH(d.kind, TWk);
    let total = Math.max(H, fh + 140);
    const F = mid ? { x: Math.max(16, Math.min(W - fw - 16, 312)), y: Math.max(100, th2 + 74), w: fw, h: fh } : { x: Math.round(W * 0.5 - fw / 2 - (outs.length ? 60 : 0)), y: Math.max(76 + 24, (total - fh) / 2 + 12), w: fw, h: fh };
    L.set('d:' + d.id, { ...F, s: 1, v: 'focus', o: 1 });
    L.set('k:' + d.kind, { x: F.x + fw / 2 - TWk / 2, y: Math.max(12, F.y - th2 - 58), w: TWk, h: th2, s: 1, v: 'kind-compact', o: 1, sub: 'me:' + d.id });
    const targets = [...new Map(out.filter((j) => j.rel !== 'evidence for').map((j) => [j.to, j])).values()];
    const ev = out.find((j) => j.rel === 'evidence for');
    const left = mid ? 16 : F.x - 300;
    // what it joins, each card level with its column where it can be, the cards never on top of each other
    let below = 12;
    const placed = targets.map((j) => ({ j, want: F.y + (rowY[j.col] ?? 76) - 20 })).sort((x, y) => x.want - y.want);
    for (const it of placed) { it.y = Math.max(below, it.want); below = it.y + 56 + 10; }
    const over = below - 10 - (Math.max(H, fh + 140) - 12); if (over > 0 && !mid) for (const it of placed) it.y -= over;
    const yOf = new Map(placed.map((it) => [it.j.to, it.y]));
    targets.forEach((j) => {
      L.set('d:' + j.to, { x: Math.max(16, left), y: Math.max(12, yOf.get(j.to)), w: 240, h: 56, s: 1, v: 'nb', o: 1, sub: `${j.rel === 'about' || j.rel === 'in' || j.rel === 'on' ? 'joined on' : j.rel} ${j.col}${j.toCol && j.toCol !== j.col ? ' → ' + j.toCol : ''}` });
    });
    if (inc.length) {
      const names = [...new Set(inc.map((j) => j.from))], iy = Math.max(F.y + fh - 70, below);
      L.set('in:' + d.id, { x: Math.max(16, left), y: iy, w: 240, h: 64, s: 1, v: 'inc', o: 1, list: names, col: inc[0].toCol }); below = Math.max(below, iy + 64 + 12);
    }
    if (ev) L.set('d:' + ev.to, mid ? { x: 16, y: Math.max(below, F.y + fh - 56), w: 240, h: 56, s: 1, v: 'nb', o: 1, sub: `the control: ${d.controlName || ev.value}` } : { x: F.x + fw / 2 - 130, y: F.y + fh + 56, w: 260, h: 56, s: 1, v: 'nb', o: 1, sub: `the control: ${d.controlName || ev.value}` });
    if (outs.length) {
      const oh = outsH(outs, heldElsewhere(d.id, outs)); // peer:newcomer
      L.set('o:' + d.id, mid ? { x: F.x, y: F.y + fh + 52, w: fw, h: oh, s: 1, v: 'outs', o: 1, list: outs } : { x: F.x + fw + 90, y: Math.max(12, F.y + (fh - oh) / 2), w: 320, h: oh, s: 1, v: 'outs', o: 1, list: outs });
      if (mid) total = Math.max(total, F.y + fh + 52 + oh + 32);
    }
    if (mid) total = Math.max(total, below + 24, F.y + fh + 40);
    const edges = [];
    for (const j of targets) edges.push({ a: 'd:' + d.id, b: 'd:' + j.to, aY: (rowY[j.col] ?? 76) + 15, aCol: j.col, aSide: 'left', label: null, arrow: false });
    if (ev) edges.push({ a: 'd:' + d.id, b: 'd:' + ev.to, label: mid ? null : 'is evidence for', arrow: false });
    const scope = d.one && d.one.includes(':') ? plainScope(d.one.slice(d.one.indexOf(':') + 1).trim()) : null; // peer:newcomer: in plain words
    edges.push({ a: 'd:' + d.id, b: 'k:' + d.kind, label: scope ? `one row per ${nounOf(d.kind)}` : `one row is ${d.one ? d.one.split(':')[0] : 'one ' + nounOf(d.kind)}`, via: scope ? [`only those ${scope}`] : null, dash: true });
    if (inc.length) { const kc = (colsShown.find((c) => c.role === 'key') || colsShown[0]).name; edges.push({ a: 'in:' + d.id, b: 'd:' + d.id, bY: (rowY[kc] ?? 76) + 15, bCol: kc, bSide: 'left', label: `join on ${inc[0].toCol}`, arrow: false }); }
    if (outs.length) edges.push({ a: 'd:' + d.id, b: 'o:' + d.id, label: 'built from it', bad: outs.some((o) => o.waiting) && d.state === 'waiting', arrow: true });
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
  function stackDataset(W, d, out, inc, outs, fh) {
    const L = new Map(); let y = 16; const x = 16, w = W - 32;
    { const th2 = tileH(d.kind, w); L.set('k:' + d.kind, { x, y, w, h: th2, s: 1, v: 'kind-compact', o: 1, sub: 'me:' + d.id }); y += th2 + 12; }
    L.set('d:' + d.id, { x, y, w, h: fh, s: 1, v: 'focus', o: 1 }); y += fh + 14;
    for (const j of [...new Map(out.map((j) => [j.to, j])).values()]) { L.set('d:' + j.to, { x, y, w, h: 56, s: 1, v: 'nb', o: 1, sub: j.rel === 'evidence for' ? `evidence for · ${d.controlName || ''}` : `joined on ${j.col}` }); y += 64; }
    if (inc.length) { L.set('in:' + d.id, { x, y, w, h: 64, s: 1, v: 'inc', o: 1, list: [...new Set(inc.map((j) => j.from))], col: inc[0].toCol }); y += 72; }
    if (outs.length) { const oh = outsH(outs, heldElsewhere(d.id, outs)); /* peer:newcomer */ L.set('o:' + d.id, { x, y, w, h: oh, s: 1, v: 'outs', o: 1, list: outs }); y += oh + 12; }
    return { nodes: L, edges: [], scroll: y + 30 };
  }
  function layout() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    return S.level === 'estate' ? layoutEstate(W, H) : S.level === 'kind' ? layoutKind(W, H) : layoutDataset(W, H);
  }

  // ------------------------------------------------------------------ painting a node for its role at this level
  function paint(el, id, r) {
    const sig = r.v + (r.sub || '') + (r.text || '') + (r.rel ? r.rel.join() : '') + (r.says ? JSON.stringify(r.says) : '') + '#' + S.ver;
    if (el.dataset.v === sig) return;
    el.dataset.v = sig;
    const [type, key] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)];
    el.className = 'node';
    if (type === 'k') {
      const k = kindOf(key), bad = paused(key).length, port = r.v === 'kind-port';
      el.classList.add('kind', 'hit'); if (port) el.classList.add('port'); el.classList.toggle('ghost', !!k.ghost); el.classList.toggle('pointed', !!k.pointed); // peer:builder
      if (r.v === 'kind-compact') {
        el.classList.add('compact');
        el.innerHTML = `${waitBadge(k.id)}<div class="khead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><span class="kname">${esc(k.name)} <span class="kn">${fmt(k.count)}</span></span>${bad ? `<span class="kbad">${PAUSE} ${bad} paused</span>` : ''}</div><div class="mosaic">${k.datasets.map((x) => `<i class="${dsOf(x).state}${r.sub === 'me:' + x ? ' me' : ''}"></i>`).join('')}<span class="mc">${dsWord(k.datasets.length)}</span></div>${(() => { const mb = 44 + Math.ceil((k.datasets.length + 7) / tilePer(r.w)) * 11, self = selfShown().filter((x) => x.from === k.id), stacked = !!(r.says && r.says.length); return self.map((x) => `<div class="kself"${stacked ? ` style="top:${mb + 2}px;bottom:auto"` : ''}>↻ ${esc(x.name)} another ${esc(k.noun || k.name.toLowerCase())}</div>`).join('') + (!stacked && S.level === 'estate' ? (() => { const fl = k.datasets.map(dsOf).filter((x) => ['waiting', 'warn', 'decided'].includes(x.state)); if (!fl.length) return ''; const mark = (x) => (x.state === 'waiting' ? PAUSE : x.state === 'decided' ? HALF : '◆'); return `<div class="kflags" style="top:${mb + 2}px">${fl.slice(0, 2).map((x) => `<span class="${x.state}">${mark(x)} ${esc(x.short)}</span>`).join('')}${fl.length > 2 ? `<span>+${fl.length - 2}</span>` : ''}</div>`; })() : '') + (stacked ? `<div class="krels" style="top:${mb + 4 + (self.length ? 18 : 0)}px">${r.says.map((t) => typeof t === 'string' ? `<span class="ks">${esc(t)}</span>` : `<span class="ks">${esc(t.s)}</span>${t.via ? (S.level === 'kind' ? `<button type="button" class="kv" data-carry aria-pressed="${S.pin === id}" title="${esc([...carriers(S.kind, k.id)].map((x) => dsOf(x)?.short).filter(Boolean).join(', '))}">${esc(t.via)}</button>` : `<span class="kv">${esc(t.via)}</span>`) : ''}`).join('')}</div>` : ''); })()}`;
        el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${k.name}: ${fmt(k.count)} ${k.plural}, ${k.datasets.length} datasets${bad ? `, ${bad} paused` : ''}`);
        return;
      }
      if (r.v === 'kind-open') {
        el.classList.add('open'); el.classList.remove('hit');
        const warn = k.datasets.filter((x) => dsOf(x).state === 'warn').length;
        el.innerHTML = `<div class="ophead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><div class="opt"><div class="oname">${esc(k.name)}</div><div class="osub">${fmt(k.count)} ${esc(k.plural)} · ${k.datasets.length} datasets</div></div><div class="ostate">${bad ? `<span class="st bad">${PAUSE} ${bad} paused</span>` : ''}${(waitsBy()[k.id] || []).length ? `<span class="st waits">${(waitsBy()[k.id] || []).length} outputs wait on ${esc(waitingDs()?.short || '')}</span>` : ''}${warn ? `<span class="st warn">◆ ${warn} unusual</span>` : ''}</div></div>`;
        el.removeAttribute('role'); el.tabIndex = -1; return;
      }
      const wn = (waitsBy()[k.id] || []).length;
      el.innerHTML = `${wn && !port ? waitBadge(k.id) : ''}<div class="khead"><span class="kicon">${ICON[k.icon] || ICON.app}</span><span style="min-width:0;flex:1"><div class="kname">${esc(k.name)}${bad && port && S.level === 'kind' ? ` <span class="kbad sm">${PAUSE} ${bad}</span>` : ''}</div><div class="kcount">${r.rel ? `<span class="krel">${r.rel.map(esc).join('<br>')}</span>` : k.pointed ? `<span class="kpoint">${esc(k.pointed)}</span>` /* peer:builder */ : `${fmt(k.count)} ${esc(k.plural)}${r.v === 'kind-compact' ? '' : ` · ${dsWord(k.datasets.length)}`}`}</div></span></div>${!port && r.v !== 'kind-open' ? selfShown().filter((x) => x.from === k.id).map((x) => `<div class="kself" title="${esc(k.name)} ${esc(x.name)} ${esc(k.name)}">↻ ${esc(x.name)} another ${esc(k.noun || k.name.toLowerCase())}</div>`).join('') : ''}${r.says && r.says.length ? `<div class="ksays" style="top:${64 + (selfShown().some((x) => x.from === k.id) ? 22 : 0)}px">${r.says.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}${r.v === 'kind-compact' ? `<div class="mosaic">${k.datasets.map((x) => `<i class="${dsOf(x).state}"></i>`).join('')}<span class="mc">${k.datasets.length} dataset${k.datasets.length === 1 ? '' : 's'}</span></div>` : ''}`;
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${k.name}: ${k.datasets.length} datasets${bad ? `, ${bad} paused` : ''}`);
      if (r.v === 'kind-open') { el.classList.remove('hit'); el.removeAttribute('role'); el.tabIndex = -1; }
    } else if (type === 'd') {
      const d = dsOf(key), st = d.state;
      el.classList.add('ds', st); el.classList.toggle('ghost', !!d.ghost); el.classList.toggle('pointed', !!d.pointed); // peer:builder
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', `${d.short}${st === 'waiting' ? (d.causeOnly ? ', the cause of today’s pause' : ', paused today') : ''}`);
      const tag = st === 'waiting' ? (d.causeOnly ? CAUSE : PAUSE) : st === 'decided' ? HALF : d.replaced ? '✓' : st === 'warn' ? '◆' : d.awaited ? '◌' : '';
      if (st === 'waiting' && d.causeOnly) el.classList.add('cause');
      if (st === 'decided') el.setAttribute('aria-label', `${d.short}, decided for now: ${HOW[d.how]?.said || ''}, corrected file owed`); if (d.replaced) { el.classList.add('fixed'); el.setAttribute('aria-label', `${d.short}, corrected file in`); }
      if (st === 'warn') el.setAttribute('aria-label', `${d.short}, unusual today`);
      if (r.v === 'chip') { el.innerHTML = `<span class="dn">${esc(d.short)}</span>${d.badge ? `<span class="db">${d.badge}</span>` : ''}${tag ? `<span class="dt">${tag}</span>` : ''}`; el.title = `${d.short}${d.description ? ': ' + d.description.replace(/^[^:]*:\s*/, '') : ''}\n${d.rowsToday != null ? `${fmt(d.rowsToday)} rows · ` : ''}${d.columns.length} columns${st === 'waiting' && (d.builds || []).length ? ` · ${d.builds.length} wait on it` : ''}`; }
      else if (r.v === 'card') { el.classList.add('card'); if (r.h < 56) el.classList.add('sm'); const narrowCard = r.w < 200; el.innerHTML = `<span class="dn">${esc(d.short)}</span><span class="dt">${st === 'waiting' ? (narrowCard ? PAUSE : PAUSE + ' Paused') : st === 'warn' ? (narrowCard ? '◆' : '◆ Unusual') : d.awaited ? (narrowCard ? '◌' : '◌ Planned') : ''}</span><span class="dm">${st === 'waiting' && (d.builds || []).length ? `${fmt(d.rowsToday || 0)} rows · <b>holds up ${d.builds.length} outputs</b>` : d.rowsToday != null ? fmt(d.rowsToday) + ' rows · ' + d.columns.length + ' columns' : d.awaited ? 'first file Thu Mar 28 · ' + d.columns.length + ' columns' : d.columns.length + ' columns'}</span>`; }
      else if (r.v === 'nb') { el.classList.add('nb'); el.innerHTML = `<span class="dn">${esc(d.short)}</span><span class="dm">${esc(r.sub || kindOf(d.kind).name)}</span>`; }
      else if (r.v === 'focus') {
        el.className = 'node focus' + (st === 'waiting' ? ' waiting' : '');
        const shown = d.columns.slice(0, 12), joinCols = new Set(M.joins.filter((j) => j.from === d.id).map((j) => j.col));
        const ty = (c) => tyFull(c);
        const row1 = firstRowOf(d), cvOf = (c, i) => cvSaid(c, row1[i]); // peer:newcomer: one real row, read down
        const cvTitle = (c, p) => `${c.name} · ${tyFull(c)} · today’s first row: ${p.raw}${p.label ? ` (${p.label})` : ''}`; // the kind of column it replaced, on hover (builder)
        const stateHtml = st === 'waiting' ? `<span class="fs">${PAUSE} Paused today</span>` : st === 'decided' ? `<span class="fs owed">${HALF} ${esc(HOW[d.how]?.pill || 'Decided')} · file owed</span>` : d.replaced ? '<span class="fs done">✓ Corrected file in</span>' : st === 'warn' ? '<span class="fs warn">◆ Unusual today</span>' : d.awaited ? '<span class="fs aw">◌ First file Thu Mar 28</span>' : '';
        const rowsB = (t) => (M.noRows ? '' : `<button class="btn sm" data-rows>${t}</button>`);
        const actHtml = st === 'waiting' ? `${rowsB(`See ${esc(DC().prev)}’s rows`)}<button class="btn primary sm" data-decide>Decide ›</button>` : st === 'decided' ? `<button class="btn sm" data-undo>Undo</button>${rowsB('Rows')}${d.pendingFix || M.replaceable !== false ? `<button class="btn primary sm" data-replace>${d.pendingFix ? 'Publish it ›' : 'Replace file ›'}</button>` : ''}` : d.replaced ? `<button class="btn sm" data-undo>Undo</button>${rowsB('Explore rows ›')}` : d.awaited ? '' : rowsB('Explore rows ›');
        el.innerHTML = `<div class="fhead"><div class="ft"><span class="kicon" style="width:28px;height:28px">${ICON[kindOf(d.kind).icon]}</span><span class="fn">${esc(d.short)}</span></div><div class="fm">${d.rowsToday != null ? fmt(d.rowsToday) + ' rows today' + (d.rowsUsual ? ` · usually about ${fmt(usualN(d.rowsUsual))}` : '') : d.awaited ? 'Described ahead of its first file' : ''}</div><div class="fa">${stateHtml}${d.asked && (st === 'waiting' || st === 'decided') ? `<span class="askd">Asked for the file ${hhmm(d.asked)}</span>` : ''}<span class="sp"></span>${actHtml}</div></div>
          ${row1 ? `<div class="cvhead"><span>Tap a column for all its values</span><span>Today’s first row</span></div>` : ''}<ul class="cols">${shown.map((c, i) => `<li class="col${joinCols.has(c.name) ? ' join' : ''}${colTwo(c, r.w, row1 ? cvW(cvOf(c, i)) : undefined) ? ' two' : ''}" data-col="${esc(c.name)}"><span class="cn">${esc(c.name)}</span><span class="cm">${esc(c.meaning || (c.title && c.title.toLowerCase() !== c.name.replace(/_/g, ' ') ? c.title : ''))}</span>${row1 ? `<span class="cv${c.role === 'key' ? ' k' : ''}${row1[i] == null || row1[i] === '' ? ' blank' : ''}" style="max-width:${cvMax(r.w)}px" title="${esc(cvTitle(c, cvOf(c, i)))}">${esc(cvOf(c, i).raw)}${cvOf(c, i).label ? `<span class="cvl"> · ${esc(cvOf(c, i).label)}</span>` : ''}</span>` : `<span class="ty${c.role === 'key' ? ' kb' : ''}">${ty(c)}</span>`}</li>`).join('')}</ul>${d.columns.length > 12 ? `<div class="more">and ${d.columns.length - 12} more columns</div>` : ''}`;
        el.removeAttribute('role'); el.tabIndex = -1;
      }
    } else if (type === 'g') { el.className = 'node gname'; el.textContent = r.text; }
    else if (type === 'a') { el.className = 'node gname area'; el.textContent = r.text; }
    else if (type === 'dm') { el.className = 'node domain'; el.innerHTML = `<span class="dmn">${esc(r.text)}</span>`; }
    else if (type === 'r') { const d = dsOf(key); el.className = 'node reach'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.innerHTML = `<span class="ri">${HOURGLASS}</span><b>${outputsWait((d.builds || []).length)}</b><span>built from ${esc(d.short)}</span><u>See which ›</u>`; }
    else if (type === 'm') { el.className = 'node more'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.innerHTML = `<b>${esc(r.text)}</b>`; el.setAttribute('aria-label', `${r.text}: ${r.sub}`); }
    else if (type === 'o') {
      el.className = 'node outs';
      const w = r.list.filter((o) => o.waiting).length, shown = r.list.slice(0, 12);
      const released = r.list.filter((o) => o.released).length, gl = outGroups(r.list), groups = new Map(gl), order = gl.map(([g]) => g), NAME = Object.fromEntries(gl.map(([g]) => [g, groupName(g)]));
      const rebuilt = r.list.filter((o) => o.rebuilt).length, how = (r.list.find((o) => o.released) || {}).released;
      const one = heldElsewhere(key, r.list); // peer:newcomer: the header says why they all wait; each line is its name
      const allHeld = one && w === r.list.length; // peer:newcomer: every one waits: the header's ⧗ says it, not each row's
      el.innerHTML = `<header>${w ? `<span class="waitt">${w === r.list.length ? `All ${w} outputs` : `${w} outputs`} ${(() => { const wd = waitingDs(), me = dsOf(key); return wd && me && wd.id !== me.id ? 'use it' : 'wait on it'; })()}</span>${(() => { const wd = waitingDs(), me = dsOf(key); return wd && me && wd.id !== me.id ? `<span class="hint2">${HOURGLASS} Held today: ${esc(wd.short)} paused, not this file</span>` : ''; })()}${one ? '' : `<span class="hint2">Readers see ${esc(DC().prev)} until it is decided</span>`}` : released ? (how === 'keep' ? `<span class="owedt">${HALF} ${released} stay on ${esc(DC().prev)}</span><span class="hint2">until the corrected file</span>` : `<span class="okt">✓ ${released} published</span><span class="hint2">${how === 'asis' ? (issueOf(issueDs() || dsOf(S.ds)).kind === 'empty' ? `with no ${esc(issueOf(issueDs() || dsOf(S.ds)).noun)}` : 'as it arrived') : how === 'accept' ? 'at the new level' : `with ${esc(issueOf(issueDs() || dsOf(S.ds)).fillFrom)}’s rows, marked filled`}</span>`) : rebuilt ? `<span class="okt">✓ ${rebuilt} rebuilt</span><span class="hint2">with ${esc(DC().wd)}’s file</span>` : `<span>Built from it · ${r.list.length}</span>`}</header>${order.filter((g) => groups.has(g)).map((g) => `<div class="og">${esc(NAME[g] || 'Other')}</div><ul>${groups.get(g).map((o) => `<li class="${o.waiting ? 'w' : o.released === 'keep' ? 'kept' : o.released || o.rebuilt ? 'rel' : ''}"><button type="button" data-out="${esc(o.id)}" title="${esc(o.id)}${o.waiting ? ' · held today' : o.released === 'keep' ? ` · readers stay on ${esc(DC().prev)}` : ' · published'}"><i>${o.waiting && !allHeld ? HOURGLASS : ''}</i><span class="on">${esc(plain(o.id))}${o.about && !one ? `<small>${esc(o.about)}</small>` : ''}</span>${o.waiting && !one ? '<span class="wword">waits</span>' : ''}<span class="go">›</span></button></li>`).join('')}</ul>`).join('')}`;
    } else if (type === 'in') {
      el.className = 'node ds nb';
      el.innerHTML = `<span class="dn">${r.list.length} datasets join here</span><span class="dm">${esc(r.list.slice(0, 4).map((x) => dsOf(x).short).join(', '))}${r.list.length > 4 ? '…' : ''}</span>`;
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
        if (show && e.blocks) for (const W of [Infinity, 230, 170, 128, 100]) {
          const rows = [];
          e.blocks.forEach((bk, i) => { if (i) rows.push(null); for (const t of wrapLines(bk.s, '500 12px Geist', W)) rows.push({ t, v: 0 }); const v = !bk.via ? 0 : bk.why ? 4 : bk.hov ? (quiet ? 5 : 4) : quiet ? 0 : 1; if (v) for (const t of wrapLines(bk.via, v >= 4 ? '400 11px Geist Mono' : '400 11px Geist', W)) rows.push({ t, v }); }); // peer:builder: columns in mono; 5 shows when pointed at
          const lw = Math.max(...rows.filter(Boolean).map((r) => tw(r.t, r.v >= 4 ? '400 11px Geist Mono' : r.v ? '400 11px Geist' : '500 12px Geist'))) + 22, lh = rows.reduce((a, r) => a + (r ? 15 : 5), 0) + 8;
          for (const c of cands) { const q = { x: c.x, y: c.y }, ov = overlap(q, lw, lh); if (!best || ov < best.a - 1) best = { ...q, a: ov, rows, lw, lh }; if (ov === 0) break; }
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
        const tapVia = S.level === 'estate' && e.blocks && e.blocks.some((bk) => bk.via) && !e.opens;
        const l = document.createElement(e.opens || tapVia ? 'button' : 'div'); l.className = 'lab' + (e.bad ? ' bad' : '') + (e.ghost ? ' ghost' : '') + (e.opens ? ' opens' : '') + (tapVia ? ' taps' : '') + (enter ? ' enter' : '') + lit;
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
  const parentOf = (id) => { const [t, k] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)]; if (t === 'd') return 'k:' + dsOf(k)?.kind; if (t === 'g' || t === 'm') return 'k:' + k.split(':')[0]; if (t === 'o' || t === 'in' || t === 'r') return 'd:' + k; return null; };
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
    document.querySelectorAll('.alert, .mini, .hint, .mini-x, .eschint').forEach((x) => { if (instant || reduce) return x.remove(); x.classList.add('leaving'); setTimeout(() => x.remove(), 200); });
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
    if (S.level === 'estate') parts.push(narrow() ? `<span class="viewwrap"><button type="button" class="viewsw" id="viewsw" aria-haspopup="menu" aria-expanded="false"><h1>Data model</h1><span class="vcar" aria-hidden="true">▾</span></button><span class="viewmenu" id="viewmenu" role="menu" hidden><span class="emh">Views</span>${['Overview', 'Pipeline', 'Data model', 'Outputs', 'Access', 'Audit log'].map((v) => `<a href="#" role="menuitem"${v === 'Data model' ? ' class="on" aria-current="page"' : ''}>${v}</a>`).join('')}</span></span>` : '<h1>Data model</h1>');
    else { parts.push('<button data-to="estate">Data model</button>'); if (S.level === 'dataset') parts.push(`<span class="sep">›</span><button data-to="kind" data-k="${d.kind}">${esc(kindOf(d.kind).name)}</button>`); }
    if (S.level === 'kind') parts.push(`<span class="sep">›</span><span class="here">${esc(k.name)}</span>`);
    if (S.level === 'dataset') parts.push(`<span class="sep">›</span><span class="here">${esc(d.short)}</span>`);
    t.innerHTML = parts.join('');
    t.querySelectorAll('[data-to]').forEach((b) => (b.onclick = () => (b.dataset.to === 'estate' ? go({ level: 'estate' }) : go({ level: 'kind', kind: b.dataset.k }))));
    const vs = t.querySelector('#viewsw'), vm = t.querySelector('#viewmenu');
    if (vs) { vs.onclick = (ev) => { ev.stopPropagation(); const open = vm.hasAttribute('hidden'); vm.toggleAttribute('hidden', !open); vs.setAttribute('aria-expanded', String(open)); if (open) vm.querySelector('a')?.focus(); }; vm.onclick = (ev) => { ev.preventDefault(); vm.setAttribute('hidden', ''); vs.setAttribute('aria-expanded', 'false'); }; document.addEventListener('click', (ev) => { if (!vm.hasAttribute('hidden') && !vm.contains(ev.target) && ev.target !== vs) { vm.setAttribute('hidden', ''); vs.setAttribute('aria-expanded', 'false'); } }); }
  }
  const legendHtml = (hint, squares) => `${squares ? '<span>Each square a dataset</span><span><i class="q"></i>fine</span>' : ''}${M.datasets.some((d) => d.state === 'waiting' && d.causeOnly) ? `<span><i class="causebox" aria-hidden="true"></i>${M.causeWord || 'the cause'}</span>` : ''}${M.datasets.some((d) => d.state === 'waiting' && !d.causeOnly) || !M.noWaitMark ? `<span>${PAUSE}${M.pauseWord || 'paused'}</span>` : ''}${waitingDs() && !M.noWaitMark ? `<span>${HOURGLASS}waits on it</span>` : ''}${M.datasets.some((d) => d.state === 'decided') ? `<span><b class="lg owed">${HALF}</b>${M.owedWord || 'decided, file owed'}</span>` : ''}${M.datasets.some((d) => d.replaced) ? '<span><b class="lg ok">✓</b>complete</span>' : ''}<span><b class="lg warn">◆</b>${M.warnWord || 'warned'}</span>${M.datasets.some((d) => d.state === 'awaited' || d.awaited) ? '<span><b class="lg aw">◌</b>planned: no file due yet</span>' : ''}`;
  function renderChrome() {
    document.querySelectorAll('.alert, .mini, .hint, .mini-x, .eschint').forEach((x) => x.remove());
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    const top = $('#waits'); if (top) { top.classList.toggle('ok', !w && !dd); top.classList.toggle('owed', !w && !!dd); top.innerHTML = w ? `${PAUSE} <span class="wl">${esc(DC().today)} is paused · </span><u>Decide ›</u>` : dd ? `${HALF} <span class="wl">${esc(DC().today)}: file owed · </span><u>${dd.pendingFix ? 'Publish it ›' : M.replaceable === false ? 'See it ›' : 'Replace ›'}</u>` : '✓ All files in'; top.hidden = S.level === 'estate' || (S.level === 'dataset' && !!w && S.ds === w.id); }
    if (S.level === 'estate' && w) {
      const n = (w.builds || []).length;
      const a = document.createElement('div'); a.className = 'alert';
      const wi = issueOf(w);
      if (M.shortBanner) a.classList.add('short');
      a.innerHTML = M.shortBanner ? `<span class="ai">${w.waited && !w.pendingFix ? HOURGLASS : PAUSE}</span><span class="at"><b>${esc(DC().today)} ${w.waited && !w.pendingFix ? 'waits for its file' : 'is paused'}</b>${wi.sev && !w.waited ? ` · <span class="sev ${wi.sev.level}">${esc(wi.sev.said)}</span>` : ''} · ${outputsWait(n)}${w.pendingFix ? ' · <span class="okn"><b class="okm" aria-hidden="true">↻</b> corrected file in</span>' : ''}${w.waited && !w.pendingFix ? ` · your call${w.waited.at ? `, ${new Date(w.waited.at).toTimeString().slice(0, 5)}` : ''}` : ''}</span><button type="button" class="link decidelink" data-decide>Decide ›</button>` : `<span class="ai">${PAUSE}</span><span class="at"><b>${esc(DC().today)} is paused.</b> ${narrow() ? `${esc(w.short)} ${esc(wi.why)}; ${n} outputs wait.` : `${esc(w.short)} ${esc(wi.why)}, so the ${n} outputs built from it wait${wi.bannerWait ? `: ${esc(wi.bannerWait)}` : ' for your decision'}.`}${w.pendingFix ? ` <span class="okn"><b class="okm" aria-hidden="true">✓</b> A corrected file came${wi.fixAt ? ` at ${esc(wi.fixAt)}` : ''} and passed every check:</span> publishing it is your call.` : ''} <button class="link" data-see>See what’s built from it</button>${w.waited ? ` <span class="askd">You chose to wait${w.waited.at ? ` at ${hhmm(w.waited.at)}` : ''}${w.waited.note && !M.quietBanner ? `: “${esc(w.waited.note)}”` : ''}</span>` : ''}${w.asked ? ` <span class="askd">You asked for the file at ${hhmm(w.asked)}</span>` : ''}</span>${M.quietBanner ? '' : '<button class="btn primary" data-decide>Decide ›</button>'}`;
      if (narrow()) { document.querySelector('.alertslot').append(a); const lg = document.createElement('div'); lg.className = 'legend mob mini-x'; lg.innerHTML = legendHtml('', false) + '<button type="button" class="lghelp" aria-label="What the marks mean">?</button>'; $('#trail').after(lg); lg.querySelector('.lghelp').onclick = () => { openSearch(); window.__palette?.help(); }; } else canvas.prepend(a);
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
      a.innerHTML = M.shortBanner ? `<span class="ai">${HALF}</span><span class="at"><b>${esc(dc.today)}: decided for now</b> · ${dd.how === 'keep' ? `readers see ${esc(dc.prev)}` : dd.how === 'fill' ? `filled from ${esc(di.fillFrom)}` : 'published as it arrived'} · ${dd.pendingFix ? '<b class="next">✓ its corrected file is in, for your OK</b>' : 'its corrected file is still to come'}</span>` : `<span class="ai">${HALF}</span><span class="at"><b>${esc(dc.today)} is decided for now:</b> ${dd.how === 'keep' ? `readers see ${esc(dc.prev)} for ${esc(dd.short)} and the ${(dd.builds || []).length} built from it.` : dd.how === 'fill' ? `${esc(dc.wd)} is published with ${esc(di.fillFrom)}’s ${esc(dd.short)}, marked as filled.` : `${esc(dc.wd)} is published as it arrived.`} ${dd.pendingFix ? `<b class="next">A corrected file passed its checks and waits for your OK.</b>` : `<b class="next">Next: the corrected file${di.nextFile ? `, ${esc(di.nextFile)}` : ''}.</b>${dd.asked ? ` <span class="askd">You asked for it at ${hhmm(dd.asked)}</span>` : ''}`}${dd.note && !M.quietBanner ? ` <span class="noted">“${esc(dd.note)}”</span>` : ''}</span>${M.quietBanner ? '' : '<button class="btn" data-undo>Undo: pause again</button>'}${!M.quietBanner && (dd.pendingFix || M.replaceable !== false) ? `<button class="btn primary" data-replace>${dd.pendingFix ? 'Publish it ›' : 'Replace file ›'}</button>` : ''}`;
      if (narrow()) document.querySelector('.alertslot').append(a); else canvas.prepend(a);
      const und = a.querySelector('[data-undo]'); if (und) und.onclick = () => undo();
      const rpl = a.querySelector('[data-replace]'); if (rpl) rpl.onclick = () => { if (dd.pendingFix) return replaceFile(dd.id, dd.pendingFix); go({ level: 'dataset', ds: dd.id, kind: dd.kind }); setTimeout(() => openReplace(dd.id), 560); };
    }
    if (S.level === 'estate' && !w && !dd && rd) {
      const a = document.createElement('div'); a.className = 'alert done';
      if (M.shortBanner) a.classList.add('short');
      a.innerHTML = M.shortBanner ? `<span class="ai">✓</span><span class="at"><b>${esc(DC().today)} is decided</b> · its corrected ${esc(rd.short)} file went out${M.doneNote ? ` · <span class="still">${esc(M.doneNote)}</span>` : ', every check passed'} · ${outputsWait((rd.builds || []).length).replace(/ held$/, '')} rebuilt${laterSaid() ? ` · readers stay on ${esc(laterSaid())}` : ''}</span>` : `<span class="ai">✓</span><span class="at"><b>${esc(DC().today)} is complete.</b> The corrected ${esc(rd.short)} file (${fmt(rd.replaced.rows)} rows) passed all ${(rd.checks || []).length} checks; the ${(rd.builds || []).length} built from it are rebuilt${laterSaid() ? `, and readers stay on ${esc(laterSaid())}, the latest day` : ` and readers now see ${esc(DC().today)}`}.</span>${M.quietBanner ? '' : '<button class="btn" data-undo>Undo: back to file owed</button>'}`;
      if (narrow()) document.querySelector('.alertslot').append(a); else canvas.prepend(a);
      const und2 = a.querySelector('[data-undo]'); if (und2) und2.onclick = () => undo();
    }
    const hintAt = (t) => { if (narrow()) return; const h = document.createElement('span'); h.className = 'maphint mini-x'; h.innerHTML = t; document.querySelector('.tools').before(h); };
    if (S.level === 'estate' && !estateWorld().compact && !narrow()) {
      const lg = document.createElement('div'); lg.className = 'legend inbar mini-x'; lg.innerHTML = legendHtml(''); $('#trail').after(lg); hintAt('Point at a kind, or Tab to one · tap a sentence to see what carries it');
    }
    if (S.level === 'estate' && estateWorld().compact) {
      const lg = document.createElement('div'); lg.className = 'legend inbar mini-x'; lg.innerHTML = legendHtml('', true); $('#trail').after(lg); hintAt('Point at a kind, or Tab to one, for all its relations');
    }
    if (S.level !== 'estate' && !narrow()) {
      const E = estateWorld(), sc = Math.min(120 / E.box.w, 34 / E.box.h);
      const mini = document.createElement('div'); mini.className = 'mini';
      const at = S.level === 'kind' ? S.kind : dsOf(S.ds).kind;
      mini.innerHTML = `<span class="cap">Estate</span><svg width="${E.box.w * sc + 4}" height="${E.box.h * sc + 4}">${relPairs().map((r) => { const a = E.rect[r.from], b = E.rect[r.to]; return `<line class="ml" x1="${(a.x + a.w / 2 - E.box.x) * sc + 2}" y1="${(a.y + a.h / 2 - E.box.y) * sc + 2}" x2="${(b.x + b.w / 2 - E.box.x) * sc + 2}" y2="${(b.y + b.h / 2 - E.box.y) * sc + 2}"/>`; }).join('')}${M.kinds.map((k) => { const r = E.rect[k.id]; return `<rect class="mk${k.id === at ? ' on' : ''}${paused(k.id).length ? ' bad' : ''}" data-k="${k.id}" x="${(r.x - E.box.x) * sc + 2}" y="${(r.y - E.box.y) * sc + 2}" width="${Math.max(6, r.w * sc)}" height="${Math.max(4, r.h * sc)}" rx="2"><title>${esc(k.name)}</title></rect>`; }).join('')}</svg>`;
      document.querySelector('.tools').prepend(mini);
      mini.querySelectorAll('[data-k]').forEach((x) => (x.onclick = () => go({ level: 'kind', kind: x.dataset.k })));
      const h = document.createElement('span'); h.className = 'eschint'; h.innerHTML = '<kbd>Esc</kbd> steps back'; $('#trail').append(h);
      // peer:newcomer — a file showing its first row says how to read it on the card itself; no key of marks it doesn't show
      if (!(S.level === 'dataset' && firstRowOf(dsOf(S.ds)))) { const lg = document.createElement('div'); lg.className = 'legend inbar mini-x'; lg.innerHTML = legendHtml(''); $('#trail').after(lg); hintAt(S.level === 'kind' ? 'Point at a neighbour to light the datasets that carry it' : 'Click a column for its values'); }
    }
  }

  // ------------------------------------------------------------------ what clicking does
  function wire(el, id) {
    const [t, key] = [id.split(':')[0], id.slice(id.indexOf(':') + 1)];
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const col = ev.target.closest('[data-col]');
      if (t === 'd' && ev.target.closest('[data-decide]')) return openPanel(key, null, true);
      if (t === 'd' && ev.target.closest('[data-undo]')) return undo();
      if (t === 'd' && ev.target.closest('[data-replace]')) return openReplace(key);
      if (t === 'd' && ev.target.closest('[data-rows]')) return openRows(key, S.colSeen && S.colSeen.id === key ? S.colSeen.col : undefined); // peer:newcomer: on the column you tapped
      if (t === 'o' && ev.target.closest('[data-out]')) return openOutput(ev.target.closest('[data-out]').dataset.out, key);
      if (t === 'd' && col) return openPanel(key, col.dataset.col);
      if (t === 'd') { const r = R.get(id); if (r && (r.v === 'focus')) return openPanel(key); return go({ level: 'dataset', ds: key, kind: dsOf(key).kind }); }
      if (t === 'k' && ev.target.closest('[data-carry]')) { S.pin = S.pin === id ? null : id; els.forEach((x) => x.querySelectorAll('[data-carry]').forEach((b) => b.setAttribute('aria-pressed', String(S.pin && x.dataset.id === S.pin)))); lightUp(); return; }
      if (t === 'k') { if (S.level === 'kind' && S.kind === key) return; return go({ level: 'kind', kind: key }); }
      if (t === 'in') { const f = R.get(id); if (f?.list?.length) go({ level: 'kind', kind: dsOf(f.list[0]).kind }); }
      if (t === 'r') go({ level: 'dataset', ds: key, kind: dsOf(key).kind });
      if (t === 'm') { const kk = key.split(':')[0], g = key.slice(kk.length + 1); S.open = { ...(S.open || {}), [kk]: (S.open || {})[kk] === g ? null : g }; render(); }
    });
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); el.click(); } });
    if (t === 'd') {
      el.addEventListener('mouseenter', () => { if (S.level !== 'kind' || R.get(id)?.v !== 'chip') return; S.hoverCard = key; lightUp(); });
      el.addEventListener('mouseleave', () => { if (S.level !== 'kind') return; S.hoverCard = null; lightUp(); });
    }
    if (t === 'k') {
      el.addEventListener('mouseenter', () => { if (!(S.level === 'estate' || (S.level === 'kind' && key !== S.kind))) return; S.hover = id; lightUp(); });
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
    const lt = document.querySelector('.maphint'); if (!lt || S.level !== 'estate' || !estateWorld().compact) return;
    const hv = S.hover || S.spotPin;
    if (hv && kindOf(hv.slice(2))) { const K = kindOf(hv.slice(2)), n = neighbours(K.id).length; lt.innerHTML = `<b>${esc(K.name)}</b> relates to ${n} kind${n === 1 ? '' : 's'}: the sentence on each says how · ${S.spotPin && !S.hover ? '<kbd>Esc</kbd> clears' : `click to open ${esc(K.name)}`}`; }
    else if (S.reach) lt.textContent = 'What the paused file holds up: each kind whose outputs wait says which';
    else lt.textContent = 'Point at a kind, or Tab to one, for all its relations';
  }
  function go(next) {
    Object.assign(S, next);
    if (S.colSeen && S.colSeen.id !== S.ds) S.colSeen = null; // peer:newcomer
    if (S.level === 'estate') { S.kind = null; S.ds = null; }
    if (S.level === 'kind') S.ds = null;
    S.hover = null; S.hoverCard = null; S.pin = null; S.spotPin = null; S.reach = false; S.reachPin = false; S.reachHover = false; stage.classList.remove('hovering', 'reaching');
    const h = S.level === 'estate' ? 'estate' : S.level === 'kind' ? 'k-' + S.kind.replace(/_/g, '-') : 'd-' + S.ds.replace(/_/g, '-');
    if (S.m !== 'build' && location.hash.slice(1) !== h) history.pushState(null, '', '#' + h + (S.m === 'big' ? '-big' : ''));
    closePanel();
    render();
    if (document.activeElement && stage.contains(document.activeElement)) { const hd = $('#trail .here') || $('#trail h1'); if (hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); } }
  }
  function fromHash() {
    let h = location.hash.slice(1); if (h.startsWith('build')) { if (window.__buildInit) return window.__buildInit(h); return void setTimeout(fromHash, 30); } if (S.m === 'build' && window.__buildLeave) window.__buildLeave();
    const big = h.endsWith('-big'); if (big) h = h.slice(0, -4);
    const m = big ? 'big' : 'larkspur';
    const apply = () => {
      if (h.startsWith('k-')) { const k = M.kinds.find((x) => x.id.replace(/_/g, '-') === h.slice(2)); if (k) return Object.assign(S, { level: 'kind', kind: k.id, ds: null }); }
      if (h.startsWith('d-')) { const d = M.datasets.find((x) => x.id.replace(/_/g, '-') === h.slice(2)); if (d) return Object.assign(S, { level: 'dataset', ds: d.id, kind: d.kind }); }
      Object.assign(S, { level: 'estate', kind: null, ds: null });
    };
    return switchModel(m, apply);
  }
  function switchModel(m, apply) {
    const load = models[m] ? Promise.resolve(models[m]) : fetch(m === 'big' ? 'big.json' : 'model.json').then((r) => r.json()).then((x) => (models[m] = x));
    return load.then((x) => {
      const changed = S.m !== m || M !== x;
      const fade = changed && els.size > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      const swap = () => {
        S.m = m; M = x;
        if (changed) { S.hover = null; S.hoverCard = null; S.spotPin = null; for (const el of els.values()) el.remove(); els.clear(); R.clear(); estateCache = null; spotMemo = { key: '' }; for (const l of labels) l.remove(); labels = []; }
        $('#estname').textContent = (m === 'big' ? 'A larger estate (generated)' : m === 'build' ? 'Larkspur, from its files' : 'Larkspur estate') + ' ▾'; $('#estmenu')?.setAttribute('hidden', '');
        document.querySelectorAll('#which button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
        if (apply) apply();
        if (fade) { stage.classList.remove('fadeout'); stage.classList.add('arrive'); clearTimeout(switchModel.t); switchModel.t = setTimeout(() => stage.classList.remove('arrive'), 1100); }
        render(changed);
      };
      if (fade) { stage.classList.add('fadeout'); document.querySelectorAll('.alert, .mini-x').forEach((a) => a.classList.add('leaving')); return new Promise((res) => setTimeout(() => { swap(); res(); }, 190)); }
      swap();
    });
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
  function decidePic(k, dd) {
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
    const base = `${ring}<text class="day" x="${cx(T)}" y="12" text-anchor="middle">${k === 'fill' && !back ? I.fillFromD : c.pd}</text><text class="day" x="${cx(D)}" y="12" text-anchor="middle">${c.d}</text>${card(T)}${bars(T, 'bar')}`;
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
  function openPanel(id, col, decide) {
    closeToasts(); const d = dsOf(id); S.panel = { id, col }; if (col) S.colSeen = { id, col }; // peer:newcomer
    const L = layer();
    let body = '';
    const n = (d.builds || []).length;
    if (decide) {
      const I = issueOf(d), dc = DC(), fails = I.stoppedBy ? I.stoppedBy.map((says) => ({ says })) : (d.checks || []).filter((c) => c.mode === 'stops' && !c.column);
      const waits = outGroups(M.outputs.filter((o) => (d.builds || []).includes(o.id))).flatMap(([, l]) => l);
      const agree0 = !!(I.sugBy && I.noteOffer && I.note && I.agreeWho) && I.options.includes(I.suggest); // peer:owner: a named owner's pick comes chosen, her reason agreed
      const pre = (k) => (I.preselect !== false || agree0) && k === I.suggest, k0 = I.preselect === false && !agree0 ? null : I.suggest, btnOf = (k) => (I.buttons || {})[k] || HOW[k].button;
      const chainHtml = (ch) => { const cc = (c) => `<span class="cc ${c.mark}">${c.mark === 'pause' ? PAUSE : c.mark === 'warn' ? '<i class="cw" aria-hidden="true">◆</i>' : ''}<span><b>${esc(c.name)}</b> ${esc(c.says)}</span></span>`, [c0, ...rest] = ch; return `<div class="chain v">${cc(c0)}${rest.length ? `<i class="cv">↓ caught by</i><div class="cgrp">${rest.map(cc).join('')}</div>` : ''}</div>`; };
      const thenMark = (t) => (/^Done for now/.test(t) ? `<i class="tm owed">${HALF}</i>` : /^Stays/.test(t) ? `<i class="tm stays">${HOURGLASS}</i>` : '<i class="tm then">↳</i>');
      const optsOrder = I.suggest && I.options.includes(I.suggest) ? [I.suggest, ...I.options.filter((k) => k !== I.suggest)] : I.options;
      const ownerRec = !!(I.sugBy && I.noteOffer && I.note && I.agreeWho), sugWhy0 = I.sugWhy || (!I.sugBy && I.sugText && !/^Suggested$/i.test(I.sugText) ? cap(I.sugText.replace(/^[^:]+:\s*/, '')) : '');
      const initials = (n) => String(n || '').split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
      // peer:owner: what readers see after each choice, the day its picture puts the eye under; looking back where readers are on a later day
      const EYE = '<svg class="eyemk" viewBox="-9 -6 18 12" aria-hidden="true"><path d="M-8 0c2.4-3.4 5-5 8-5s5.6 1.6 8 5c-2.4 3.4-5 5-8 5s-5.6-1.6-8-5z"/><circle r="2.2"/></svg>';
      const seesOf = (k) => { const later = laterSaid(), what = { wait: dc.prev, keep: later ? `${dc.prev}’s data` : dc.prev, fill: `${later ? '' : dc.today + ', '}${d.short || 'the file'} from ${I.fillFrom}`, asis: later ? 'the file as it arrived' : `${dc.today} as it arrived`, accept: later ? 'the file as it arrived' : `${dc.today} as it arrived`, fix: later ? 'the corrected file' : `${dc.today}, corrected`, stay: 'what you decided' }[k]; return what ? `<span class="sees" title="${later ? 'What ' + esc(dc.today) + ' shows when someone looks back' : 'What readers see'}">${EYE}${later ? `${esc(dc.today)} shows ` : k === optsOrder[0] ? 'Readers see ' : ''}${esc(what)}</span>` : ''; }; // peer:owner: the first choice says "Readers see" once; the others keep the eye
      const recChip = `<span class="recchip${ownerRec ? ' owner' : I.sugBy ? ' record' : ' machine'}">${ownerRec ? `<i class="av" aria-hidden="true">${esc(initials(I.agreeWho))}</i>Recommended by ${esc(I.agreeWho)}${I.agreeRole ? `, ${esc(I.agreeRole)}` : ''}${I.agreeAt ? ` · ${esc(I.agreeAt)}` : ''}` : I.sugBy ? esc(I.sugText || 'What Larkspur did') : '<i class="mc" aria-hidden="true">≈</i>smaltfl’s reading of the evidence'}</span>`;
      const recWhy = ownerRec ? `<span class="sugwhy">“${esc(I.note)}”</span>${I.noteEvidence && !I.fig ? '<span class="sugev mini">The evidence behind it is beside the cause</span>' : ''}` : !I.sugBy && sugWhy0 ? `<span class="sugwhy mach">${esc(sugWhy0)}</span>${I.sugEvidence ? `<span class="sugev mach">${I.sugEvidence}</span>` : ''}` : '';
      body = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="pichatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hp" width="1.5" height="3.2"/></pattern></defs></svg>`
        + `<div class="dcols"><div class="dleft"><div class="nowpic${I.nowHow ? ' settled' : ''}">${decidePic(I.nowHow || 'now', d)}<div class="nowt"><b>${I.nowHow ? HALF : PAUSE} ${esc(I.title)}</b>${I.sev && !I.nowHow ? (() => { const sv = I.sev.said, at = sv.indexOf(':'); return `<span class="sev ${I.sev.level}"><b class="sevw">${esc(cap(at < 0 ? sv : sv.slice(0, at)))}</b>${at < 0 ? '' : ` <span class="sevr">${esc(sv.slice(at + 1).trim())}</span>`}</span>`; })() : ''}${I.fig ? '' : `<span>${esc(I.sub)}</span>`}<span>${I.nowSaid ? esc(I.nowSaid) : d.pendingFix && !I.chain ? `<b class="okt">↻ A corrected file came${I.fixAt ? ` at ${esc(I.fixAt)}` : ''} and passed every check</b>` : laterSaid() ? `${esc(dc.today)} shows nothing yet · readers are on ${esc(laterSaid())}` : `Readers see ${esc(dc.prev)} until you decide`}</span></div>${(d.days || []).length ? `<div class="nowmonth"><span class="nml">This month: ${stripSaid(d.days)}</span>${strip(d.days, true)}</div>` : ''}</div>` // peer:owner: the severity as a badge (level, reason)
        + (ownerRec && I.noteEvidence && !I.fig ? `<div class="decev"><h4>Behind ${esc(I.agreeWho)}’s reason</h4>${I.noteEvidence}</div>` : '')
        + (I.fig ? `<div class="decfig">${I.fig}${I.rowsDiff || ''}${I.tune ? `<details class="tunefold"><summary>If it keeps happening ›</summary><div class="tune"><p>${I.tune.html}</p><div class="tuneacts">${I.tune.level ? `<button type="button" class="btn sm" data-level>${esc(I.tune.level)}</button>` : ''}<button type="button" class="btn sm" data-tune>${esc(I.tune.button)}</button></div>${I.tune.levelSaid ? `<small class="tunesaid">${esc(I.tune.levelSaid)}</small>` : ''}</div></details>` : ''}</div>` : '') // peer:owner: a mild day's limit tools under "If it keeps happening ›"
        + (d.pendingFix && I.chain ? (() => { const fs = I.fixSaid || 'It passed every check', m = fs.match(/^([\s\S]*?)[.;]?\s*(It passed every check)\.?$/), more = m ? m[1].trim() : ''; return `<div class="fixchip"><b>↻ A corrected file came${I.fixAt ? ` at ${esc(I.fixAt)}` : ''}</b> · <span>${esc(m ? m[2] : fs)}</span>${more ? `<details class="fixmore"><summary>How it compares ›</summary><p>${esc(more)}.</p></details>` : ''}</div>`; })() : '') // peer:owner: the answer, then how it compares
        + `<div class="stopby${I.chain && !(I.chainFold && I.fig) ? ' open' : ''}">${I.chain ? (I.chainFold && I.fig ? `<details class="whyp"><summary>Why it paused ›</summary>${I.chainHtml || chainHtml(I.chain)}</details>` : I.chainHtml || chainHtml(I.chain)) : fails.length ? `<span class="sbl">Paused by</span>${fails.map((c) => `<span class="sbc">${esc(c.says)}</span>`).join('')}` : ''}<details class="waitlist"><summary><b>${I.nowHow ? esc(I.outSaid || `${n} outputs went out`) : `${HOURGLASS} ${outputsWait(n)} on it`}</b><span class="sw">See which</span></summary><p>${waits.map((o) => `<span title="${esc(o.about || '')}">${esc(plain(o.id))}</span>`).join(' · ')}</p></details></div>`
        + `</div><div class="dright">${laterSaid() ? `<p class="qsub top">Readers are on ${esc(laterSaid())}, the latest day. What you choose here is what ${esc(dc.today)} shows when someone looks back.</p>` : ''}<h3 class="qrow"><span title="Readers: the people who use the outputs">What should readers see${laterSaid() ? ` for ${esc(dc.today)}` : ''}? <small class="nch">${optsOrder.length} choices</small></span>${I.owes && I.options.some((k) => k === 'keep' || (k === 'fill' && I.fillOwes !== false) || k === 'asis') ? `<span class="owedline"><b class="owedt">${HALF}</b> decided for now · file to come</span>` : ''}</h3><div class="opts tiles rows" role="radiogroup" aria-label="What readers see">${optsOrder.map((k, i) => `<label class="opt tile play${pre(k) ? ' on' : ''}${k === I.suggest ? ' sug' : ''}${I.risky.includes(k) ? ' risk' : ''}" data-k="${k}" style="--pd:${260 + i * 180}ms"><input type="radio" name="dec" value="${k}" ${pre(k) ? 'checked' : ''}>${decidePic(k, d)}<span class="rtx"><b><i class="rd" aria-hidden="true"></i>${esc(btnOf(k))}<kbd class="tk" aria-hidden="true">${i + 1}</kbd></b>${seesOf(k)}${k === I.suggest ? recChip + recWhy : ''}<span class="pro">${esc(I.pros[k])}</span>${I.cons[k] ? `<span class="con">${esc(I.cons[k])}</span>` : ''}${(I.changes || {})[k] ? `<span class="chg">${esc(I.changes[k])}</span>` : ''}${I.fileThen[k] ? `<span class="tfile">${thenMark(I.fileThen[k])}${esc(cap(I.fileThen[k].replace(/^Done for now · /, '').replace(/^Stays on your list$/, 'Stays yours to decide')))}</span>` : ''}</span></label>`).join('')}</div>` // peer:owner: each choice's eye line; the file's fate said short
        + `</div></div><div class="dfoot"><div class="afterbox"><p class="after" aria-live="polite">${k0 ? `After this: <b>${HOW[k0].after(n)}.</b> <span class="undoable">${owesAfter(I, k0) ? 'Late file waits for your OK · ' : ''}${(k0 === 'accept' && I.acceptUndo ? I.acceptUndo : UNDO[k0].replace('You can undo this', 'undo anytime'))}</span>` : `<b>Nothing changes until you pick.</b> <span class="undoable">You can change it later; the record keeps both</span>`}</p>${I.ask && !d.pendingFix ? `<label class="askfile"${owesAfter(I, I.suggest) ? '' : ' hidden'}><input type="checkbox" id="dec-ask"${k0 && owesAfter(I, k0) ? ' checked' : ''}><span>Copy a request for the file, to send</span><button type="button" class="link" data-draft>Read it</button></label><p class="pdraft2" hidden>${esc(requestText(d))}</p>` : ''}</div><label class="whyrow"><span class="whyfrom" hidden></span><button type="button" class="userec" data-userec hidden></button><textarea id="dec-note" class="why two" rows="2" aria-label="Why: kept with the decision and your name" placeholder="Why? Pick a choice first"></textarea></label><p class="onrec" aria-live="polite"></p><button type="button" class="link ownwords" data-ownwords hidden>Write your own reason</button><label class="whoas"><span>Deciding as</span><input id="dec-who" type="text" value="${esc(M.me || '')}" placeholder="your name and role" autocomplete="name"></label><div class="dacts"><button class="btn" data-close>Cancel <kbd class="tk" aria-hidden="true">Esc</kbd></button><button class="btn primary${k0 && I.risky.includes(k0) ? ' risk' : ''}" data-confirm${k0 ? '' : ' disabled'}>${esc(k0 ? btnOf(k0) : 'Choose one')} <kbd class="tk" aria-hidden="true">↵</kbd></button></div></div>`; // peer:owner: the request box ticked where the chosen choice owes a file; a link to your own words · (r2) the request box in fewer words
    }
    else if (col) {
      const c = d.columns.find((x) => x.name === col);
      const vals = c.today || c.ages;
      const facts = [[{ key: 'Key', category: 'Code', number: 'Number', date: 'Date', text: 'Text' }[c.role] || c.role, 'kind of column'], c.distinct ? [fmt(c.distinct), 'distinct values'] : null, c.distinct ? [fmt(c.blanks || 0), 'blank'] : null].filter(Boolean);
      body = `<p>${esc(c.meaning || 'No meaning written yet.')}</p><div class="facts">${facts.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>`
        + `<h3>Kind of column</h3><p>${{ key: 'The key: one per row', category: 'A code from a list', number: 'A number', date: 'A date and time', text: 'Free text' }[c.role] || c.role}</p>` + `${vals ? `<h3>Today</h3><div class="dist">${vals.slice(0, 8).map((t) => `<div class="drow"><span>${esc((c.labels || {})[t.value] || t.value)}</span><span class="dtrack"><span class="dfill" style="width:${(t.share * 100).toFixed(1)}%"></span></span><span class="num">${(t.share * 100).toFixed(t.share < .1 ? 1 : 0)}%</span></div>`).join('')}</div>` : c.examples ? `<h3>Examples</h3><p class="exs">${c.examples.slice(0, 6).map((x) => `<code>${esc(x)}</code>`).join(' ')}</p>` : ''}${M.joins.filter((j) => j.from === id && j.col === col).map((j) => `<h3>Joins</h3><p>${esc(j.rel)} <b>${esc(dsOf(j.to)?.short)}</b> on ${esc(j.toCol)}</p>`).join('')}<button class="btn" data-rows>Explore rows ›</button>`;
    } else body = `<p>${esc(d.description || '')}</p><h3>One row is</h3><p>${esc(d.one || '–')}</p><h3>Today</h3><p>${d.rowsToday != null ? fmt(d.rowsToday) + ' rows' : 'No file yet'}${d.state === 'waiting' ? ' · <b style="color:var(--bad)">paused</b>' : ''}</p><h3>Checks</h3><p>${(d.checks || []).length} checks</p><button class="btn" data-rows>Explore rows ›</button>`;
    L.innerHTML = `<div class="scrim" data-close></div><aside class="panel${decide ? ' decide' : ''}" aria-label="${decide ? 'Decide' : 'Details'}"><div class="ph"><div class="ctx">${esc(kindOf(d.kind).name)} · ${esc(d.short)}${col ? ' · column' : ''}</div><div class="t"><h2 style="${col ? 'font-family:var(--mono)' : ''}">${decide ? `Decide on ${esc(DC().today)}` : esc(col || d.short)}</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb">${body}</div></aside>`;
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
        btn.innerHTML = `${esc((issueOf(d).buttons || {})[x.value] || HOW[x.value].button)} <kbd class="tk" aria-hidden="true">↵</kbd>`; after.textContent = HOW[x.value].after(n) + '.'; L.querySelector('.undoable').textContent = (owesAfter(issueOf(d), x.value) ? 'Late file waits for your OK · ' : '') + (x.value === 'accept' && issueOf(d).acceptUndo ? issueOf(d).acceptUndo : UNDO[x.value].replace('You can undo this', 'undo anytime'));
        const askRow = L.querySelector('.askfile'); if (askRow) { const show = owesAfter(issueOf(d), x.value); askRow.hidden = !show; askRow.querySelector('input').checked = show; if (!show) { const p2 = L.querySelector('.pdraft2'); if (p2) p2.hidden = true; } }
        btn.classList.toggle('risk', issueOf(d).risky.includes(x.value));
        syncWhy(x.value, true);
        { const tf = L.querySelector('details.tunefold'); if (tf) tf.open = false; } // peer:owner (r2): picking what readers see folds the limit tools, the other way to settle the day
      }));
      picTimer = setInterval(() => { const on = L.querySelector('.opt.tile.on'); if (on && !on.matches(':hover')) replay(on); }, 4800);
      // agreeing: her reason quoted beside the choice, the box left for words of your own
      const recWords = () => { const I2 = issueOf(d); if (I2.sugBy && I2.noteOffer && I2.note && I2.agreeWho) return { text: I2.note, who: I2.agreeWho, kind: '1' }; const w = I2.sugWhy || (!I2.sugBy && I2.sugText && !/^Suggested$/i.test(I2.sugText) ? cap(I2.sugText.replace(/^[^:]+:\s*/, '')) : ''); return w ? { text: w, who: 'smaltfl', kind: 'm' } : null; };
      const needsWhy = (k) => !!k && k !== 'wait' && k !== 'stay';
      function recordLine(k) {
        if (!k) return '';
        const nt = L.querySelector('#dec-note'), v = nt.value.trim(), I2 = issueOf(d), lab = esc((I2.buttons || {})[k] || HOW[k].button), rw = recWords();
        const whose = L.dataset.agree === '1' ? `${esc(rw.who)}’s reason, agreed` : L.dataset.agree === 'm' ? 'smaltfl’s reading, agreed' : 'your words', me = (L.querySelector('#dec-who')?.value || '').trim();
        if (L.dataset.agree === '1' && v) return `<b>Goes on record when you tap Agree:</b> ${me ? esc(me) : 'you'} · ${lab} · <i>${whose}</i>`; // peer:owner: her words are on the tile above; nothing is decided before the tap
        return `<b>Goes on record with your tap:</b> ${me ? esc(me) : 'you'} · ${lab}${v ? ` · <i>${whose}</i>` : needsWhy(k) ? ' · <span class="need">needs a reason</span>' : ' · no reason given'}`; // peer:owner (r2): the words are in the box right below, so not quoted again // peer:owner: said as still to come
      }
      function syncWhy(k, fromChoice) {
        const nt = L.querySelector('#dec-note'), wf = L.querySelector('.whyfrom'), rw = recWords(), I2 = issueOf(d); if (!nt) return;
        if (fromChoice && k !== I2.suggest && nt.dataset.auto === '1') { nt.value = ''; nt.dataset.auto = ''; }
        if (fromChoice && rw && rw.kind === '1' && k === I2.suggest && !nt.value.trim() && L.dataset.own !== '1') { nt.value = rw.text; nt.dataset.auto = '1'; } // peer:owner
        const ur = L.querySelector('[data-userec]'); if (ur) { const show = !!(rw && k === I2.suggest && nt.dataset.auto !== '1'); ur.hidden = !show; ur.textContent = rw ? (rw.kind === '1' ? `Use ${rw.who}’s reason ›` : 'Use smaltfl’s reading ›') : ''; }
        const kept = !!(rw && k === I2.suggest && nt.dataset.auto === '1' && nt.value.trim() === rw.text.trim());
        L.dataset.agree = kept ? rw.kind : '';
        if (wf) { wf.hidden = !kept; wf.textContent = kept ? (rw.kind === '1' ? `${rw.who}’s reason, quoted: keep it to agree, or write your own` : 'smaltfl’s reading of the evidence: keep it, or write your own') : ''; }
        nt.placeholder = !k ? 'Why? Pick a choice first' : needsWhy(k) ? 'Why this choice? Needed: it is kept with your name' : 'Why? Optional: it is kept with your name';
        nt.classList.toggle('need', needsWhy(k) && !nt.value.trim());
        btn.disabled = !k || (needsWhy(k) && !nt.value.trim());
        const r = L.querySelector('.onrec'); if (r) r.innerHTML = recordLine(k);
        // peer:owner: agreeing needs no box: it folds, a link opens your own words, and the one button says Agree
        { const ag = L.dataset.agree === '1', wr = L.querySelector('.whyrow'), ow = L.querySelector('[data-ownwords]'), lab = k ? ((I2.buttons || {})[k] || HOW[k].button) : ''; if (ag) L.dataset.own = ''; if (wr) wr.classList.toggle('folded', ag); if (ow) ow.hidden = !ag; if (k) btn.innerHTML = `${ag ? `Agree: ${esc(lab.charAt(0).toLowerCase() + lab.slice(1))}` : esc(lab)} <kbd class="tk" aria-hidden="true">↵</kbd>`; }
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
      (L.querySelector('input[name="dec"]:checked') || L.querySelector('input[name="dec"]'))?.focus({ preventScroll: true }); if (narrow() && L.dataset.agree !== '1') setTimeout(() => L.querySelector('.qrow')?.scrollIntoView({ block: 'start' }), 420); // peer:owner: with her pick chosen and agreed, the top is the answer
      const draftBtn = L.querySelector('[data-draft]'); if (draftBtn) draftBtn.onclick = (ev) => { ev.preventDefault(); const p2 = L.querySelector('.pdraft2'); p2.hidden = !p2.hidden; ev.target.textContent = p2.hidden ? 'Read it' : 'Hide it'; };
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
      document.querySelectorAll('.ds.decided, .ds.waiting, .outs, .alert, .fs, #waits, .waitpill, .mosaic i.decided, .mosaic i.waiting').forEach((x) => { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); });
      setTimeout(() => document.querySelectorAll('.flash').forEach((x) => x.classList.remove('flash')), 1300);
    }));
  }
  function undoDecision() { undo(); }
  const closeToasts = () => document.querySelectorAll('.toast').forEach((x) => x.remove());
  function toast(text, undo) {
    document.querySelectorAll('.toast').forEach((x) => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    document.body.append(t);
    if (undo) t.querySelector('button').onclick = () => { t.remove(); window.__undo(); };
    const ms = (M && M.toastMs) || 6000; setTimeout(() => t.classList.add('gone'), ms); setTimeout(() => t.remove(), ms + 600);
  }
  function openReplace(id) {
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
  function openRows(id, tapped) {
    closeToasts(); const d = dsOf(id); S.panel = { rows: id };
    const L = layer();
    L.innerHTML = `<div class="scrim" data-close></div><aside class="panel wide" aria-label="Rows"><div class="ph"><div class="ctx">${esc(kindOf(d.kind).name)} · ${esc(d.short)} · rows</div><div class="t"><h2>${esc(d.short)}</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb"><div class="rowbar"><p class="rcount" aria-live="polite">Loading the rows…</p><input type="search" id="rows-q" placeholder="Filter the rows" aria-label="Filter the rows"></div><div class="rpicks"></div><div class="tablewrap"><table class="rows"><thead></thead><tbody></tbody></table></div><div class="rmore"></div><h3>Columns</h3><ul class="colsum">${d.columns.map((c) => `<li><button data-col="${esc(c.name)}"><code>${esc(c.name)}</code><span>${esc(c.meaning || c.title || '')}</span><span class="go">›</span></button></li>`).join('')}</ul></div></aside>`;
    L.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closePanel()));
    L.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => openPanel(id, b.dataset.col)));
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
        const shown = rows.slice(0, limit), whose = data.day !== DC().iso ? `${DC().prev}’s` : `${DC().today}’s`;
        count.textContent = (data.day !== DC().iso ? `Today’s file is empty: these are ${DC().prev}’s rows. ` : '') + (q || pick ? `${fmt(rows.length)} of ${fmt(all.length)} of ${whose} rows${q ? ` have “${q}”` : ''}${pick ? `${q ? ' and' : ' have'} ${cols[pick.i]} = ${pick.v || 'blank'}` : ''}` : `${fmt(shown.length)} of ${fmt(data.total)} of ${whose} rows`) + (all.length < data.total ? ` · the first ${fmt(all.length)} can be filtered and sorted here` : '');
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
    const fallback = () => ({ day: d.rowsToday === 0 ? '2024-03-26' : '2024-03-27', total: d.rowsToday || (d.sample || []).length, columns: d.columns.slice(0, Math.max(1, ...(d.sample || []).map((r) => r.length))).map((c) => c.name), rows: d.sample || [] });
    (S.m === 'larkspur' ? fetch(`rows/${encodeURIComponent(id)}.json`).then((r) => (r.ok ? r.json() : fallback())).catch(fallback) : Promise.resolve(fallback())).then(show);
  }
  function openOutput(oid, from) {
    closeToasts();
    const o = M.outputs.find((x) => x.id === oid) || { id: oid, reads: [] }, src = dsOf(from);
    S.panel = { out: oid };
    const reads = (o.reads || []).map((r) => dsOf(r) ? `<li><button data-ds="${esc(r)}">${esc(dsOf(r).short)}<span class="go">›</span></button></li>` : `<li><span class="plainstep">${esc(plain(r))}</span></li>`).join('');
    const Lr = layer();
    Lr.innerHTML = `<div class="scrim" data-close></div><aside class="panel" aria-label="Built dataset"><div class="ph"><div class="ctx">Built from ${esc(src ? src.short : 'the flow')}</div><div class="t"><h2>${esc(plain(oid))}</h2><button class="x" data-close aria-label="Close">✕</button></div></div><div class="pb">${o.waiting ? `<p><b style="color:var(--bad)">${PAUSE} Held today.</b> Readers still see ${esc(DC().prev)} until ${esc(src ? src.short : 'its source')} is decided.</p>` : '<p>Published today.</p>'}${o.rows != null ? `<h3>Rows</h3><p>${fmt(o.rows)}</p>` : ''}${reads ? `<h3>Built from</h3><ul class="reads">${reads}</ul>` : ''}</div></aside>`;
    Lr.querySelectorAll('[data-close]').forEach((x) => (x.onclick = () => closePanel()));
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
  function spotlight(kid) { const apply = () => { if (stage.contains(document.activeElement)) document.activeElement.blur(); S.hover = null; S.spotPin = 'k:' + kid; lightUp(); }; if (S.level !== 'estate') { go({ level: 'estate' }); setTimeout(apply, 620); } else apply(); }

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
    const old = () => { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } t.remove(); ok ? done() : toast('Select the message and copy it: this page may not copy for you.'); };
    try { navigator.clipboard.writeText(text).then(done, old); } catch (e) { old(); }
  }
  const actReach = () => ({ label: 'See what’s built from it', run: showReach });
  const actRows = (d) => (M.noRows ? null : { label: d.state === 'waiting' ? `See ${DC().prev}’s rows` : `Explore ${d.short}’s rows`, run: () => openRows(d.id) });
  const actReplace = () => ({ label: 'Replace file ›', primary: true, run: replaceNow });
  const actUndo = () => ({ label: 'Undo', run: () => undo() });
  const actOpenDs = (d) => ({ label: `Open ${d.short}`, run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }) });
  const actOpenKind = (k) => ({ label: `Open ${k.name}`, run: () => go({ level: 'kind', kind: k.id }) });
  const actSpot = (k) => ({ label: `Show it on the map`, primary: true, run: () => spotlight(k.id) });
  function whyNow() {
    const w = waitingDs(), dd = decidedDs();
    if (!w) return dd ? { html: `<p>Nothing is paused now. ${esc(DC().today)} is <b class="owedt">decided for now</b> (${esc(HOW[dd.how]?.said || '')}) and the corrected ${esc(dd.short)} file is still owed.</p>`, acts: [actReplace(), actUndo()] } : { html: '<p><b class="okt">✓ Nothing is paused.</b> Every file is in and every check passed.</p>', acts: [] };
    const fails = (w.checks || []).filter((c) => c.mode === 'stops' && !c.column), n = (w.builds || []).length;
    const I = issueOf(w), dc = DC(), f2 = I.stoppedBy ? I.stoppedBy.map((says) => ({ says })) : fails;
    return { q: `Why is ${dc.today} paused?`, html: `<p><b class="bad">${PAUSE} ${esc(dc.today)} is paused.</b> ${I.kind === 'empty' ? `${esc(w.short)} arrived empty: 0 rows${w.rowsUsual ? `, where a usual day has <span class="nw">about ${fmt(usualN(w.rowsUsual))}</span>` : ''}` : `${esc(w.short)} ${esc(I.why)}`}.</p><p>${f2.length ? `${f2.length === 1 ? 'Its check' : 'Its checks'} ${f2.map((c) => `“${esc(c.says)}”`).join(' and ')} stop${f2.length === 1 ? 's' : ''} a day like that, so the` : 'The'} ${n} outputs built from it wait, and readers still see ${esc(dc.prev)}.</p><p>${I.answer || '<b>Suggested:</b> keep ' + esc(dc.prev) + ' now and ask for the file again. When it comes, it is checked and waits for your OK.'}</p>`, acts: [actDecide(true), actReach(), I.ask ? actRequest() : null, actRows(w)].filter(Boolean) };
  }
  function waitsNow() {
    const w = waitingDs();
    if (!w) return { html: '<p>Nothing waits: no file is paused today.</p>', acts: [] };
    const groups = outGroups(M.outputs.filter((o) => (w.builds || []).includes(o.id)));
    return { q: 'Which outputs wait?', html: `<p><b>${(w.builds || []).length} outputs</b> built from ${esc(w.short)} wait for the decision; readers see their ${esc(DC().prev)} version until then.</p><ul>${groups.map(([g, l]) => `<li><span><b>${esc(groupName(g))}:</b> ${l.slice(0, 5).map((o) => esc(plain(o.id))).join(', ')}${l.length > 5 ? ` and ${l.length - 5} more` : ''}</span></li>`).join('')}</ul>`, acts: [{ ...actReach(), primary: true }, actDecide(false)] };
  }
  function nextNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    const dc = DC();
    if (w) { const I = issueOf(w); return { q: 'What should I do next?', html: I.nextSteps || `<ol><li><b>Decide on ${esc(dc.today)}.</b> Keeping ${esc(dc.prev)} is suggested: readers stay on the last good day and the day stops asking.</li><li><b>Ask for the file again:</b> the ${esc(w.short)} export likely failed.</li><li>When it comes, the day runs again under the same checks and waits for your OK; publish it and the ${(w.builds || []).length} outputs are rebuilt.</li></ol>`, acts: [actDecide(true), I.ask ? actRequest() : null].filter(Boolean) }; }
    if (dd) return { html: `<ol><li><b>Replace ${esc(dc.wd)}’s ${esc(dd.short)} file</b> when the corrected export comes.</li><li>The day runs again under the same ${(dd.checks || []).length} checks and waits for your OK; publish it and readers see ${esc(dc.today)}.</li></ol><p>Decided so far: ${esc(HOW[dd.how]?.said || '')}.</p>`, acts: [dd.pendingFix || M.replaceable !== false ? actReplace() : null, actUndo()].filter(Boolean) };
    return { html: `<p><b class="okt">✓ Nothing needs you.</b> ${rd ? `The corrected ${esc(rd.short)} file passed all its checks, and readers see ${esc(dc.today)}.` : 'Every file is in.'}</p>`, acts: rd ? [actRows(rd), actUndo()].filter(Boolean) : [] };
  }
  function decidedNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs();
    if (dd) return { html: `<p>${esc(DC().today)} is <b class="owedt">${HALF} decided for now</b>: ${esc(HOW[dd.how]?.said || '')} for ${esc(dd.short)}${dd.note ? `, because “${esc(dd.note)}”` : ''}. The corrected file is still owed.</p>`, acts: [actReplace(), actUndo()] };
    if (rd) return { html: `<p><b class="okt">✓ ${esc(DC().today)} is complete.</b> The corrected ${esc(rd.short)} file (${fmt(rd.replaced.rows)} rows) replaced the empty one.</p>`, acts: [actUndo()] };
    if (w) return { html: `<p>Nothing is decided yet: ${esc(DC().today)} is paused and waits for you.</p>`, acts: [actDecide(true)] };
    return { html: '<p>There is nothing to decide today.</p>', acts: [] };
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
    return { q: `Where is ${col} used?`, html: `<p><code>${esc(col)}</code>${c0.meaning ? `: ${esc(c0.meaning)}` : ''}</p><p>It is in <b>${has.length} dataset${has.length === 1 ? '' : 's'}</b>: ${listed(has.map((d) => esc(d.short)), 6)}.</p>${js2.length ? `<p class="plead">Where it joins: a column → the column it matches</p><ul>${js2.slice(0, 4).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${js2.length > 4 ? `<div><button type="button" class="pmore" data-more>and ${js2.length - 4} more joins</button><div hidden><ul>${js2.slice(4).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}` : ''}`, acts: has.slice(0, 3).map((d, i) => ({ label: `${col} in ${d.short}`, primary: !i, run: () => toDataset(d, () => openPanel(d.id, col)) })) };
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
    if (!js2.length && !rs.length) return { html: `<p><b>${esc(name(a))}</b> and <b>${esc(name(b))}</b> don’t join directly on this map.</p>`, acts: [] };
    return { q: `How do ${name(a)} and ${name(b)} join?`, html: `${rs.length ? `<ul>${rs.map((r) => `<li><span>${sentenceHtml(r, a.k.id)}</span></li>`).join('')}</ul>` : ''}<p class="plead">${js2.length} join${js2.length === 1 ? '' : 's'}: a column → the column it matches</p><ul>${js2.slice(0, 5).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${js2.length > 5 ? `<div><button type="button" class="pmore" data-more>and ${js2.length - 5} more joins</button><div hidden><ul>${js2.slice(5).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}`, acts: [a, b].filter((x) => x.d || x.k).slice(0, 2).map((x, i) => (x.d ? { ...actOpenDs(x.d), primary: !i } : { ...actOpenKind(kindOf(x.k.id)), primary: !i })) };
  }
  function rowsNow(d) {
    const u = d.rowsUsual;
    const html = d.state === 'waiting' ? (issueOf(d).kind === 'empty' ? `<p><b class="bad">${PAUSE} ${esc(d.short)} has 0 rows today</b>${u ? `; a usual day has about ${fmt(usualN(u))}` : ''}. Readers see ${esc(DC().prev)}’s rows.</p>` : `<p><b class="bad">${PAUSE} ${esc(d.short)} ${esc(issueOf(d).why)}</b>: ${fmt(d.rowsToday)} rows today. Readers see ${esc(DC().prev)}’s until it is decided.</p>`) : d.rowsToday == null ? `<p>${esc(d.short)} has no file yet${d.state === 'awaited' ? ': it is described ahead of its first file' : ''}.</p>` : `<p><b>${esc(d.short)}</b> has <b>${fmt(d.rowsToday)} rows</b> today${u ? ` (usually about ${fmt(usualN(u))})` : ''} and ${d.columns.length} columns.</p>`;
    return { q: `How many rows does ${d.short} have today?`, html, acts: [actRows(d) ? { ...actRows(d), primary: true } : null, actOpenDs(d)].filter(Boolean) };
  }
  function datasetNow(d) {
    const out = [...new Set(M.joins.filter((j) => j.from === d.id && j.to !== d.id && dsOf(j.to)).map((j) => dsOf(j.to).short))], builds = (d.builds || []).length;
    return { q: `What is ${d.short}?`, html: `<p><b>${esc(d.short)}</b>${d.description ? `: ${esc(d.description.replace(/^[^:]*:\s*/, ''))}` : ''}</p><p>${d.rowsToday != null ? `${fmt(d.rowsToday)} rows today · ` : ''}${d.columns.length} columns${out.length ? ` · joins ${out.slice(0, 3).map(esc).join(', ')}${out.length > 3 ? ` and ${out.length - 3} more` : ''}` : ''}${builds ? ` · builds ${builds}` : ''}</p>${d.state === 'waiting' ? `<p><b class="bad">${PAUSE} Paused today:</b> its file arrived empty.</p>` : ''}`, acts: [{ ...actOpenDs(d), primary: true }, actRows(d)] };
  }
  function kindNow(k, q) {
    const rs = relPairs().filter((r) => r.from === k.id || r.to === k.id), nb = neighbours(k.id);
    if (/how many|count|number of/.test(q)) return { html: `<p><b>${fmt(k.count)} ${esc(PL(k.id))}</b>, described by ${k.datasets.length} dataset${k.datasets.length === 1 ? '' : 's'}.</p>`, acts: [{ ...actOpenKind(k), primary: true }] };
    return { q: `What does ${k.name} relate to?`, html: `<p><b>${esc(k.name)}</b> relates to <b>${nb.length} kind${nb.length === 1 ? '' : 's'}</b>:</p><ul>${rs.slice(0, 7).map((r) => `<li><span>${sentenceHtml(r, k.id)}${viaParts(r).length ? `<i class="pvia">${esc(viaParts(r).filter((x) => !/^since/.test(x)).join(' · '))}</i>` : ''}</span></li>`).join('')}</ul>${rs.length > 7 ? `<div><button type="button" class="pmore" data-more>and ${rs.length - 7} more</button><div hidden><ul>${rs.slice(7).map((r) => `<li><span>${sentenceHtml(r, k.id)}</span></li>`).join('')}</ul></div></div>` : ''}`, acts: [actSpot(k), actOpenKind(k)] };
  }
  // a month as a strip of days, each drawn as what the day was
  const DAYCLS = { ok: 'o', note: 'o', warn: 'w', decided: 'd', waiting: 'p' }, DAYWORD = { o: 'fine', w: 'warned', d: 'decided', p: 'paused' };
  const dayName = (i) => `${['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'][i % 7]} Mar ${i + 1}`;
  const stripSaid = (days) => { const at = {}; days.forEach((s, i) => { const c = DAYCLS[s] || 'o'; (at[c] ||= []).push(i); }); const last = days.length - 1; return ['o', 'w', 'd', 'p'].filter((c) => at[c]).map((c) => { const l = at[c], word = DAYWORD[c]; if (c === 'o') return `${l.length} ${word}`; if (c === 'p' && l.length === 1 && l[0] === last) return 'paused today'; const named = l.slice(0, 3).map(dayName).join(', ') + (l.length > 3 ? ` and ${l.length - 3} more` : ''); return `${l.length} ${word} (${named})`; }).join(' · '); };
  const strip = (days, compact, d) => {
    const seen = new Set(days.map((s) => DAYCLS[s] || 'o'));
    const key = ['o', 'w', 'd', 'p'].filter((c) => seen.has(c)).map((c) => `<span><i class="${c}">${c === 'p' ? PAUSE : ''}</i>${DAYWORD[c]}</span>`).join('');
    const row = `<div class="strip" role="img" aria-label="${esc(stripSaid(days))}">${days.map((s, i) => { const c = DAYCLS[s] || 'o'; return `<i class="${c}" title="${dayName(i)}: ${s === 'note' ? 'fine, with a note' : DAYWORD[c]}">${c === 'p' ? PAUSE : ''}</i>`; }).join('')}</div>`;
    return compact ? row : (d && (d.counts || []).length ? `<div class="sparkrow">${spark(d)}</div>` : '') + row + `<div class="striplab"><span>${esc(DC().first)}</span><span class="stripkey">${key}</span><span>${esc(DC().today)}</span></div>`;
  };
  function monthNow(ds, kd) {
    if (!(M.month || []).length) return { html: '<p>This generated estate keeps no days to look back on.</p>', acts: [] };
    if (ds) { if (!(ds.days || []).length) return { html: `<p><b>${esc(ds.short)}</b> has no days yet: it is described ahead of its first file.</p>`, acts: [{ ...actOpenDs(ds), primary: true }] }; const cs = (ds.counts || []).filter((x) => x), fb = fineBand(ds); return { q: `How has ${ds.short} been this month?`, html: `<p><b>${esc(ds.short)}</b> this month: ${stripSaid(ds.days)}.</p>${strip(ds.days, false, ds)}${cs.length ? `<p class="plead">Usually about ${fmt(usualN(ds.rowsUsual || [cs[0], cs[0]]))} rows a day${ds.rowsToday != null ? `; today ${fmt(ds.rowsToday)}` : ''}${fb ? `. The check stays quiet between ${fmt(fb[0])} and ${fmt(fb[1])}, the shaded band` : ''}.</p>` : ''}${notableOf(ds)}`, acts: [{ ...actOpenDs(ds), primary: true }, actRows(ds)] }; }
    if (kd) {
      // a kind's day is the worst of its datasets' that day
      const rank = { waiting: 4, warn: 3, decided: 2, note: 1, ok: 0 }, ks = kindOf(kd.id).datasets.map(dsOf).filter((d) => (d.days || []).length), n = Math.max(0, ...ks.map((d) => d.days.length));
      const days = Array.from({ length: n }, (_, i) => ks.map((d) => d.days[i]).filter(Boolean).sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0] || 'ok');
      return { q: `How has ${kd.name} been this month?`, html: `<p><b>${esc(kd.name)}</b> this month, each day the worst of its ${ks.length} dataset${ks.length === 1 ? '' : 's'}: ${stripSaid(days)}.</p>${strip(days)}`, acts: [{ ...actOpenKind(kd), primary: true }] };
    }
    const days = M.month.map((x) => x.state);
    return { q: 'How has the estate been this month?', html: `<p>The estate this month: ${stripSaid(days)}.</p>${strip(days)}`, acts: waitingDs() ? [actDecide(true)] : [] };
  }
  const joinList = (list, n) => `<ul>${list.slice(0, n).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul>${list.length > n ? `<div><button type="button" class="pmore" data-more>and ${list.length - n} more</button><div hidden><ul>${list.slice(n).map((j) => `<li><span>${joinSaid(j)}</span></li>`).join('')}</ul></div></div>` : ''}`;
  function dsJoinsNow(d) {
    const uniq = (l) => [...new Map(l.map((j) => [j.from + '>' + j.to + j.col, j])).values()];
    const trouble = (j) => (STATE_RANK[dsOf(j.from)?.state] ?? 9) * 2 + (j.match && j.match.hit < j.match.rows ? 0 : 1);
    const out = uniq(M.joins.filter((j) => j.from === d.id && j.to !== d.id && dsOf(j.to))), inc = uniq(M.joins.filter((j) => j.to === d.id && j.from !== d.id && dsOf(j.from))).sort((a, b) => trouble(a) - trouble(b));
    if (!out.length && !inc.length) return { html: `<p><b>${esc(d.short)}</b> joins nothing on this map.</p>`, acts: [{ ...actOpenDs(d), primary: true }] };
    return { q: `What does ${d.short} join?`, html: `<p><b>${esc(d.short)}</b> joins ${out.length} other${out.length === 1 ? '' : 's'}; ${inc.length} other${inc.length === 1 ? ' joins' : 's join'} it. A match is the share of rows whose column finds a row on the other side, on ${(() => { const j0 = [...out, ...inc].find((j) => j.match); return j0 ? dayLong(j0.match.day) + '’s files' : 'the day’s files'; })()}.</p>${out.length ? `<p class="plead">It joins ${out.length} other${out.length === 1 ? '' : 's'}: its column → the column it matches there</p>${joinList(out, 4)}` : ''}${inc.length ? `<p class="plead">${inc.length} other${inc.length === 1 ? ' joins' : 's join'} it: their column → its column</p>${joinList(inc, 4)}` : ''}`, acts: [{ ...actOpenDs(d), primary: true }, actRows(d)] };
  }
  function builtNow(d) {
    const outs = M.outputs.filter((o) => (d.builds || []).includes(o.id));
    if (!outs.length) return { html: `<p>Nothing on this map is built from <b>${esc(d.short)}</b>.</p>`, acts: [{ ...actOpenDs(d), primary: true }] };
    const w = outs.filter((o) => o.waiting).length;
    return { q: `What is built from ${d.short}?`, html: `<p><b>${outs.length} output${outs.length === 1 ? '' : 's'}</b> ${outs.length === 1 ? 'is' : 'are'} built from ${esc(d.short)}${w ? `; <b>${w} wait</b> for today’s decision` : ''}.</p><ul>${outGroups(outs).map(([g, l]) => `<li><span><b>${esc(groupName(g))}:</b> ${l.slice(0, 5).map((o) => esc(plain(o.id))).join(', ')}${l.length > 5 ? ` and ${l.length - 5} more` : ''}</span></li>`).join('')}</ul>`, acts: [{ ...actOpenDs(d), primary: true }, ...(w ? [actDecide(false)] : [])] };
  }
  function kindDsNow(k) {
    const mark = (d) => (d.state === 'waiting' ? `${PAUSE} ` : d.state === 'decided' ? `${HALF} ` : d.state === 'warn' ? '◆ ' : d.state === 'awaited' ? '◌ ' : '');
    return { q: `Which datasets describe ${PL(k.id)}?`, html: `<p><b>${fmt(k.datasets.length)} dataset${k.datasets.length === 1 ? '' : 's'}</b> describe ${esc(PL(k.id))}.</p>${groupsOf(k.id).map(([g, l]) => `${g ? `<p class="plead">${esc(g)}</p>` : ''}<p>${listed(l.map((d) => `${mark(d)}${esc(d.short)}`), 12)}</p>`).join('')}`, acts: [{ ...actOpenKind(k), primary: true }] };
  }
  const helpKeys = () => ({ title: 'Keyboard shortcuts', html: '<div class="keys"><span><kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd></span><span>This palette: do something, find a name, or ask</span><span><kbd>↑</kbd> <kbd>↓</kbd> <kbd>↵</kbd></span><span>Move through the list and run the line picked</span><span><kbd>Tab</kbd> or <kbd>→</kbd></span><span>Look inside a kind or a dataset</span><span><kbd>⌫</kbd> or <kbd>←</kbd></span><span>On an empty line, step back out</span><span><kbd>Esc</kbd></span><span>Step back a level, as the page does; at the top it clears what you typed, then closes</span><span><kbd>1</kbd>–<kbd>4</kbd></span><span>On the Decide panel, pick a choice; <kbd>↵</kbd> confirms it and <kbd>Esc</kbd> cancels</span><span><kbd>Tab</kbd> on the map</span><span>Move between kinds; each shows how it relates</span></div>', acts: [] });
  const helpMarks = () => ({ title: 'What the marks mean', html: `<div class="marks"><b class="bad">${PAUSE}</b><span>Paused: a file stopped at a check, and the day waits for you</span><b class="mut">${HOURGLASS}</b><span>Waits: an output built from the paused file, held until you decide</span><b class="owedt">${HALF}</b><span>Decided for now: readers see the choice you made, and the file is still owed</span><b class="owedt">◆</b><span>Unusual today, but not stopped</span><b class="mut"><i class="notedmark"></i></b><span>Noted: a check noted something on the day; nothing stopped</span><b class="okt">✓</b><span>Complete: the corrected file is in</span><b class="mut">◌</b><span>Planned: described ahead of its first file; none is due yet</span><b class="act">Blue</b><span>Something you can press</span></div>`, acts: [] });
  function answerLocal(q) { const a = answerFor(q); if (a && !a.q && !a.title) a.q = tidyQ(q); return a; }
  function answerFor(q) {
    const { col, ds, kd } = mentions(q);
    if (/\bjoin|connect|relat|link/.test(q) && !col) { const two = namesIn(q); if (two.length >= 2) return joinNow(two[0], two[1]); }
    if (/shortcut|keyboard|\bkeys?\b|hotkey/.test(q)) return helpKeys();
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
      if (w && d.id !== w.id) qs.push(`Why is ${DC().today} paused?`);
      return qs.slice(0, 4);
    }
    if (S.level === 'kind') {
      const k = kindOf(S.kind);
      qs.push(`What does ${k.name} relate to?`, `Which datasets describe ${PL(k.id)}?`);
      if (hasMonth) qs.push(`How has ${k.name} been this month?`);
      if (w) qs.push(`Why is ${DC().today} paused?`);
      return qs.slice(0, 4);
    }
    if (w) qs.push(`Why is ${DC().today} paused?`, 'Which outputs wait?'); else if (dd) qs.push('What is still owed?');
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
  const descOf = (d) => cap1(String(d.description || '').replace(/^[^:]*:\s*/, ''));
  const tidyQ = (raw) => {
    let t = String(raw || '').trim().replace(/\s+/g, ' ');
    for (const d of [...M.datasets].sort((a, b) => b.short.length - a.short.length)) t = t.replace(new RegExp(`\\b${escRe(d.short)}\\b`, 'gi'), d.short);
    for (const k of M.kinds) t = t.replace(new RegExp(`\\b${escRe(k.name)}\\b`, 'gi'), k.name);
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
  function previewDs(d) {
    const k = kindOf(d.kind), u = d.rowsUsual, out = [...new Map(M.joins.filter((j) => j.from === d.id && j.to !== d.id && dsOf(j.to)).map((j) => [j.col + '>' + j.to, j])).values()], inc = [...new Set(M.joins.filter((j) => j.to === d.id && j.from !== d.id && dsOf(j.from)).map((j) => j.from))], nb = (d.builds || []).length, wn = M.outputs.filter((o) => (d.builds || []).includes(o.id) && o.waiting).length;
    const fb = fineBand(d), out0 = d.rowsToday != null && d.rowsUsual && (d.rowsToday < d.rowsUsual[0] || d.rowsToday > d.rowsUsual[1]);
    const state = d.state === 'waiting' ? `<span class="pvs bad">${PAUSE} Paused today</span>` : d.state === 'decided' ? `<span class="pvs">${HALF} Decided for now · file owed</span>` : d.state === 'warn' ? '<span class="pvs warn">◆ Unusual today</span>' : d.state === 'awaited' ? `<span class="pvs">◌ Planned · first file ${esc(d.awaited || '')}</span>` : `<span class="pvs ok">✓ Fine today${out0 && fb ? ': inside the check’s ±5% band' : ''}</span>`;
    const notable = (d.heads || []).map((h, i) => (h ? `<li><b>${dayName(i)}</b> ${esc((d.dayNotes || [])[i] || headSaid(h))}; ${fateOf(d.days[i])}</li>` : '')).filter(Boolean);
    return `<div class="pvh"><span class="pico">${GL.table}${stateBadge(d)}</span><div><b>${esc(d.short)}</b><span>Dataset · ${esc(k.name)}</span></div></div>${state}`
      + (d.description ? `<p class="pvd">${esc(descOf(d))}</p>` : '')
      + (d.rowsToday != null ? `<div class="pvn"><b>${fmt(d.rowsToday)}</b> rows today${u ? ` · usually about ${fmt(usualN(u))}` : ''}</div>` : '')
      + ((d.counts || []).length ? `<div class="pvm"><div class="sparkhead"><span>Rows each day</span>${fb ? `<span><i class="bandkey"></i>the check stays quiet: ${fmt(fb[0])}–${fmt(fb[1])}</span>` : ''}</div>${spark(d)}<div class="striplab"><span>${esc(DC().first)}</span><span>${esc(DC().today)}</span></div>${notable.length ? `<ul class="pvl">${notable.join('')}</ul>` : ''}</div>` : '')
      + `<h4>Columns · ${d.columns.length}</h4><ul class="pvc">${d.columns.slice(0, 6).map((c) => `<li><code>${esc(c.name)}</code>${c.role === 'category' && valsOf(c) ? `<small>${esc(valsOf(c))}</small>` : ''}<span class="pty${c.role === 'key' ? ' kb' : ''}">${tyFull(c)}</span></li>`).join('')}${d.columns.length > 6 ? `<li class="pvmore">and ${d.columns.length - 6} more · <kbd>Tab</kbd> to see them</li>` : ''}</ul>`
      + (out.length || inc.length ? `<h4>Joins${out.some((j) => j.match) ? ` · match on ${dayLong(out.find((j) => j.match).match.day)}’s files` : ''}</h4><ul class="pvj">${out.slice(0, 4).map((j) => (j.col ? `<li><code>${esc(j.col)}</code><span>→ ${esc(dsOf(j.to).short)}</span>${matchSaid(j)}</li>${missSaid(j)}` : `<li><span class="mut">evidence for</span><span>${esc(d.controlName || dsOf(j.to).short)}</span></li>`)).join('')}${inc.length ? `<li class="pvmore">${inc.length} other${inc.length === 1 ? ' joins' : 's join'} it${inc.length <= 3 ? ': ' + inc.map((x) => esc(dsOf(x).short)).join(', ') : ''}</li>` : ''}</ul>` : '')
      + (nb ? `<div class="pvo">${wn ? HOURGLASS + ' ' : ''}${nb} output${nb === 1 ? ' is' : 's are'} built from it${wn ? (waitingDs() === d ? `; ${wn === nb ? 'all' : wn} wait on it` : `; ${wn} wait on ${esc(waitingDs()?.short || 'the paused file')}`) : ''}</div>` : '');
  }
  function previewKind(k) {
    const ds = k.datasets.map(dsOf).filter(Boolean).sort((a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9)), rs = relPairs().filter((r) => r.from === k.id || r.to === k.id);
    return `<div class="pvh"><span class="pico">${ICON[k.icon] || ''}</span><div><b>${esc(k.name)}</b><span>Kind · ${fmt(k.count)} ${esc(k.plural)}</span></div></div>`
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
  const previewAsk = (x) => { const a = answerLocal(String(x).toLowerCase()); return `<div class="pvq"><span class="pico ask">✦</span><b>${esc(a?.q || tidyQ(x))}</b></div>` + (a ? `<div class="pvans">${cardOf(a)}</div><p class="pvhint"><kbd>↵</kbd> the full answer${(a.acts || []).length ? ` · then ${esc(a.acts.find((y) => y.primary)?.label || a.acts[0].label)}` : ''}</p>` : `<p class="pvd">${ASK ? 'Claude answers from this page’s data.' : 'Answered from this page’s data.'}</p>`); };
  function previewDecide(w) {
    const fails = (w.checks || []).filter((c) => c.mode === 'stops' && !c.column), n = (w.builds || []).length;
    const I = issueOf(w), f2 = I.stoppedBy ? I.stoppedBy.map((says) => ({ says })) : fails;
    return `<div class="pvpic">${decidePic('now', w)}</div><p class="pvd"><b class="bad">${PAUSE} ${esc(w.short)} ${esc(I.why)}</b>${I.kind === 'empty' ? ` · 0 rows${w.rowsUsual ? `, usually about ${fmt(usualN(w.rowsUsual))}` : ''}` : ''}</p>${f2.length ? `<p class="pvd">Stopped by ${f2.map((c) => `“${esc(c.says)}”`).join(' and ')}</p>` : ''}<p class="pvd">${HOURGLASS} ${outputsWait(n)} · readers see ${esc(DC().prev)} until you decide</p><h4>Your choices</h4><ul class="pvk">${I.options.map((k) => `<li><span>${esc(HOW[k].button)}</span>${k === I.suggest ? `<small>${esc(I.sugWord)}</small>` : ''}</li>`).join('')}</ul>`;
  }
  function previewRows(d) {
    const cols = d.columns.slice(0, 4), rows = (d.sample || []).slice(0, 5);
    return `<div class="pvh"><span class="pico">${GL.rows}</span><div><b>${esc(d.short)}, ${d.state === 'waiting' ? esc(DC().prev) : 'today'}</b><span>${d.state === 'waiting' ? `The last good day, while ${esc(DC().wd)} is paused` : `${fmt(d.rowsToday || 0)} rows`}</span></div></div>${rows.length ? `<table class="pvt"><thead><tr>${cols.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c, i) => `<td>${esc(String(r[i] ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="pvhint"><kbd>↵</kbd> all the rows, to sort and filter</p>` : ''}`;
  }
  const QWORDS = /^(why|what|which|who|whom|whose|where|when|how|is|are|was|were|does|do|did|can|could|should|will|would|show|list|find|explain|tell)\b/;
  const looksAsked = (q) => /\?\s*$/.test(q) || QWORDS.test(q.trim().toLowerCase());
  function commandsNow() {
    const w = waitingDs(), dd = decidedDs(), rd = replacedDs(), list = [];
    if (w) {
      const n = (w.builds || []).length, kinds = Object.keys(waitsBy()).length;
      const I = issueOf(w), dc = DC();
      list.push({ g: 'now', icon: PAUSE, tone: 'bad', name: `Decide on ${dc.today}…`, sub: `${w.short} ${I.why} · ${outputsWait(n)}`, keys: `decide paused fix day ${dc.wd.toLowerCase()} resolve choose`, run: decideNow, pv: () => previewDecide(w) });
      if (I.ask) list.push({ g: 'now', icon: GL.mail, name: 'Draft a request for the file…', sub: `To whoever sends the ${w.short} export · you send it`, keys: 'draft ask request email message owner export file again resend', stay: requestFile, pv: () => `<p class="pto"><span>To</span><b>${esc(senderGet(w.id) || `whoever sends the ${w.short} export`)}</b>${senderGet(w.id) ? '' : '<small class="mut">· the data names no one yet</small>'}</p><p class="pdraft">${esc(requestText(w))}</p><p class="pvhint"><kbd>↵</kbd> shows it with a button to copy it, for you to send</p>` });
      list.push({ g: 'now', icon: GL.built, name: 'See what’s built from it', sub: `${outputsWait(n)}, in ${kinds} kind${kinds === 1 ? '' : 's'}`, keys: 'built from reach touches impact affected outputs wait downstream', run: showReach, pv: () => `<p class="pvd">${HOURGLASS} <b>${outputsWait(n)}</b> on ${esc(w.short)}</p>${outGroups(M.outputs.filter((o) => (w.builds || []).includes(o.id))).map(([g, l]) => `<h4>${esc(groupName(g))}</h4><ul class="pvk">${l.slice(0, 5).map((o) => `<li>${HOURGLASS}<span>${esc(plain(o.id))}</span></li>`).join('')}${l.length > 5 ? `<li class="pvmore">and ${l.length - 5} more</li>` : ''}</ul>`).join('')}` });
      if (!M.noRows) list.push({ g: 'now', icon: GL.rows, name: `See ${dc.prev}’s ${w.short} rows`, sub: `The last good day, while ${dc.wd} is paused`, keys: 'rows data table explore', run: () => openRows(w.id), pv: () => previewRows(w) });
    } else if (dd) {
      if (dd.pendingFix || M.replaceable !== false) list.push({ g: 'now', icon: '↥', tone: 'owed', name: dd.pendingFix ? 'Publish the corrected file…' : `Replace ${DC().wd}’s file…`, sub: `${dd.short} · decided for now, the file is owed`, keys: 'replace upload send file corrected publish', run: replaceNow });
      list.push({ g: 'now', icon: '↶', name: `Undo: pause ${DC().today} again`, sub: `Takes back “${HOW[dd.how]?.said || ''}”`, keys: 'undo revert back', run: () => undo() });
    } else if (rd) list.push({ g: 'now', icon: '↶', name: 'Undo: back to the file owed', sub: `Takes back the corrected ${rd.short} file`, keys: 'undo revert', run: () => undo() });
    if (S.level === 'dataset') { const d = dsOf(S.ds); if (d.state !== 'waiting' && !M.noRows) list.push({ g: 'here', icon: GL.rows, name: `Explore ${d.short}’s rows`, sub: `${d.rowsToday != null ? fmt(d.rowsToday) + ' rows · ' : ''}sort, filter, tap a value`, keys: 'rows data table explore', run: () => openRows(d.id), pv: () => previewRows(d) }); list.push({ g: 'here', icon: ICON[kindOf(d.kind).icon], name: `Open ${kindOf(d.kind).name}`, sub: 'The kind it describes, with its neighbours', keys: 'kind up parent', run: () => go({ level: 'kind', kind: d.kind }) }); }
    if (S.level === 'kind') { const k = kindOf(S.kind); list.push({ g: 'here', icon: '✳', name: `Show how ${k.name} relates on the map`, sub: `${neighbours(k.id).length} related kinds, each saying how`, keys: 'map relations spotlight show', run: () => spotlight(k.id) }); }
    if (S.level !== 'estate') list.push({ g: 'here', icon: '⌂', name: 'Back to the whole estate', sub: 'Every kind and how they relate', keys: 'home estate map overview', run: () => go({ level: 'estate' }) });
    list.push({ g: 'here', quiet: true, icon: '⇄', name: S.m === 'big' ? 'Switch to Larkspur estate' : 'Switch to the larger estate', sub: S.m === 'big' ? '5 kinds · 23 datasets' : 'generated · 22 kinds · 212 datasets', keys: 'switch estate larger big larkspur', run: () => { const to = S.m === 'big' ? 'larkspur' : 'big'; history.pushState(null, '', '#estate' + (to === 'big' ? '-big' : '')); switchModel(to, () => Object.assign(S, { level: 'estate', kind: null, ds: null })); } });
    list.push({ g: 'help', icon: '⌨', name: 'Keyboard shortcuts', sub: 'Esc, Tab, ⌫, 1 to 4 and the rest', keys: 'help keys shortcuts keyboard', stay: helpKeys, pv: () => helpKeys().html });
    list.push({ g: 'help', icon: '?', name: 'What the marks mean', sub: 'Paused, waits, decided, unusual, and the colours', keys: 'help legend marks symbols colours colors', stay: helpMarks, pv: () => helpMarks().html });
    return list;
  }
  function openSearch() {
    if ($('.palette:not(.closing)')) return; closeToasts();
    const back0 = document.activeElement;
    const box = document.createElement('div'); box.className = 'palette'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Search, act or ask');
    box.innerHTML = `<div class="pscrim"></div><div class="pbox"><div class="pin"><span class="pi" aria-hidden="true">⌕</span><span class="pscope" hidden></span><input type="text" placeholder="Search, act or ask" aria-label="Search, act or ask" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="pres" aria-autocomplete="list"><kbd class="pesck">Esc</kbd><button type="button" class="pclose">Close</button></div><div class="pbody"><ul class="pres" id="pres" role="listbox" aria-label="What you can do"></ul><aside class="pprev" aria-label="Preview"></aside><div class="pans" hidden aria-live="polite"></div></div><div class="pfoot"><span class="pk2 pmv"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> run<span class="plk"> · <kbd>Tab</kbd> look inside</span></span><span class="pk2 ptab" hidden><kbd>↵</kbd> the first button · <kbd>Tab</kbd> moves between buttons</span><span class="pk2 pbk" hidden><kbd>⌫</kbd> back</span><span class="pk2 pesc"><kbd>Esc</kbd> <span class="pescw">close</span></span><span class="pwho">${ASK ? '✦ Claude answers from this page’s data' : '✦ Answers come from this page’s data'}</span></div></div>`;
    document.body.append(box);
    const input = box.querySelector('input'), list = box.querySelector('.pres'), ans = box.querySelector('.pans'), prev = box.querySelector('.pprev'), body = box.querySelector('.pbody');
    const wide = () => matchMedia('(min-width: 1000px)').matches;
    const goTo = [...M.kinds.map((k) => ({ icon: ICON[k.icon] || '', name: k.name, sub: `Kind · ${fmt(k.count)} ${k.plural} · ${k.datasets.length} datasets`, t: 'Kind', drill: { type: 'kind', id: k.id }, run: () => go({ level: 'kind', kind: k.id }), pv: () => previewKind(k) })),
      ...M.datasets.map((d) => ({ icon: GL.table, badge: stateBadge(d), name: d.short, sub: `Dataset · ${kindOf(d.kind).name}${d.state === 'waiting' ? ` · paused today · ${fmt(d.rowsToday || 0)} rows` : d.state === 'decided' ? ' · decided for now, file owed' : d.state === 'warn' ? ' · unusual today' : ''}`, t: 'Dataset', rank: STATE_RANK[d.state] ?? 9, drill: { type: 'ds', id: d.id }, run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }), pv: () => previewDs(d) })),
      ...M.datasets.flatMap((d) => d.columns.map((c) => ({ icon: colIcon(c), ty: tyFull(c), key: c.role === 'key', name: c.name, sub: `Column of ${d.short}${c.meaning ? ' · ' + c.meaning : ''}`, t: 'Column', mono: true, run: () => toDataset(d, () => openPanel(d.id, c.name)), pv: () => previewCol(d, c) })))];
    const score = (it, q) => { const n = it.name.toLowerCase(), s2 = (it.sub || '').toLowerCase(); if (n === q) return 100; if (n.startsWith(q)) return 80 - (it.t === 'Column' ? 5 : 0); if (n.split(/[\s_]+/).some((w) => w.startsWith(q))) return 60 - (it.t === 'Column' ? 5 : 0); if (n.includes(q)) return 40; if (s2.includes(q)) return 10; if (q.length >= 3 && n.split(/[\s_]+/).some((w) => w.length > 3 && lev(q, w) <= (w.length > 6 ? 2 : 1))) return 30; { const qw = q.split(/\s+/).filter((w) => w.length > 2), nw = n.split(/[\s_]+/); if (qw.length > 1 && qw.every((w) => nw.some((x) => x.startsWith(w) || (x.length > 3 && lev(w, x) <= (x.length > 6 ? 2 : 1))))) return 34; } let i = 0; for (const ch of n.replace(/[\s_]+/g, '')) if (ch === q[i]) i++; return q.length >= 3 && i === q.length ? 6 : 0; };
    const cmdScore = (c, q) => { const n = c.name.toLowerCase(), k = (c.keys || '').toLowerCase(), s = (c.sub || '').toLowerCase(); let t = 0; for (const w of q.split(/\s+/).filter(Boolean)) { const v = n.split(/[\s’'…:]+/).some((x) => x.startsWith(w)) ? 30 : n.includes(w) ? 20 : k.split(/\s+/).some((x) => x.startsWith(w)) ? 14 : s.includes(w) ? 6 : 0; if (!v) return 0; t += v; } return t; };
    const SEC = { recent: 'Asked before', now: 'Suggested now', here: 'Here', ask: 'Ask', help: 'Help', go: 'Go to' }, SECQ = { now: 'Do', here: 'Do', help: 'Help', ask: 'Ask', go: 'Go to' };
    let found = [], at = 0, mode = 'list', cur = null, ctl = null, scope = null, showAll = false;
    const chip = box.querySelector('.pscope');
    // inside a kind: what to do with it, then its datasets; inside a dataset: what to do with it, then its columns
    const scopeItems = (sc, q) => {
      const f = (it) => !q || it.name.toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q) || score(it, q) > 0;
      const asked = (x) => ({ g: 'in', ask: x, name: x, icon: '✦', tone: 'ask', pv: () => previewAsk(x) });
      if (sc.type === 'kind') {
        const k = kindOf(sc.id);
        const top = [{ g: 'in', icon: ICON[k.icon] || '', name: `Open ${k.name}`, sub: `${fmt(k.count)} ${k.plural} · ${k.datasets.length} datasets`, run: () => go({ level: 'kind', kind: k.id }), pv: () => previewKind(k) }, asked(`What does ${k.name} relate to?`), ...((M.month || []).length ? [asked(`How has ${k.name} been this month?`)] : [])];
        return [...top, ...goTo.filter((it) => it.t === 'Dataset' && it.drill && dsOf(it.drill.id)?.kind === k.id).sort((a, b) => a.rank - b.rank).map((it) => { const d = dsOf(it.drill.id); return { ...it, g: 'inlist', sub: `${d.rowsToday != null ? fmt(d.rowsToday) + ' rows today' : 'no file yet'}${d.state === 'waiting' ? ' · paused today' : d.state === 'warn' ? ' · unusual today' : d.state === 'decided' ? ' · decided for now' : ''}` }; })].filter(f);
      }
      const d = dsOf(sc.id);
      const top = [{ g: 'in', icon: GL.table, badge: stateBadge(d), name: `Open ${d.short}`, sub: kindOf(d.kind).name, run: () => go({ level: 'dataset', ds: d.id, kind: d.kind }), pv: () => previewDs(d) }, ...(d.state === 'awaited' ? [] : [{ g: 'in', icon: GL.rows, name: `Explore ${d.short}’s rows`, sub: 'Sort, filter, tap a value', run: () => openRows(d.id), pv: () => previewRows(d) }]), asked(`What does ${d.short} join?`), asked(`What is built from ${d.short}?`)];
      const toOf = (c) => { const j = M.joins.find((x) => x.from === d.id && x.col === c.name && x.to !== d.id && dsOf(x.to)); return j ? ` · → ${dsOf(j.to).short}’s ${j.toCol || j.col}` : ''; };
      return [...top, ...((M.month || []).length && (d.days || []).length ? [asked(`How has ${d.short} been this month?`)] : []), ...d.columns.map((c) => ({ g: 'inlist', icon: colIcon(c), ty: tyFull(c), key: c.role === 'key', name: c.name, mono: true, sub: (c.meaning || '') + toOf(c), run: () => toDataset(d, () => openPanel(d.id, c.name)), pv: () => previewCol(d, c) }))].filter(f);
    };
    const nameOf = (sc) => (sc.type === 'kind' ? kindOf(sc.id).name : dsOf(sc.id).short), path = [];
    const scopeName = () => (scope ? nameOf(scope) : '');
    const enter = (sc) => { path.push(sc); scope = sc; input.value = ''; draw(); input.focus(); };
    const leave = () => { path.pop(); scope = path[path.length - 1] || null; input.value = ''; draw(); input.focus(); };
    chip.onclick = (ev) => { const b = ev.target.closest('[data-lv]'); if (!b) return; const lv = +b.dataset.lv; if (lv < 0) return leave(); path.length = lv + 1; scope = path[lv]; input.value = ''; draw(); input.focus(); };
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
        const askIt = { g: 'ask', ask: raw, name: local ? tidyQ(raw) : `Ask “${raw}”`, sub: local ? (wide() ? 'The answer is beside this list' : '') : ASK ? 'Claude answers from this page’s data' : 'Answered from this page’s data', icon: '✦', tone: 'ask', card: local && !wide() ? cardOf(local) : null, pv: () => previewAsk(raw) };
        const cm = cmds.map((c) => ({ c, s: cmdScore(c, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map((x) => x.c);
        const allGo = goTo.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || (a.it.rank ?? 9) - (b.it.rank ?? 9));
        let gt = allGo.slice(0, showAll ? 60 : 6).map((x) => ({ ...x.it, g: 'go' }));
        const rest = allGo.length - gt.length;
        if (rest > 0) gt.push({ g: 'go', more: true, icon: '⋯', name: `${rest} more named like “${raw}”`, sub: [['Kind', 'kind'], ['Dataset', 'dataset'], ['Column', 'column']].map(([t, w]) => { const c = allGo.slice(gt.length).filter((x) => x.it.t === t).length; return c ? `${c} ${w}${c === 1 ? '' : 's'}` : ''; }).filter(Boolean).join(' · '), pv: () => `<p class="pvd">${allGo.slice(gt.length, gt.length + 12).map((x) => `${x.it.t === 'Column' ? `<code>${esc(x.it.name)}</code>` : `<b>${esc(x.it.name)}</b>`} <small class="mut">${esc(x.it.t.toLowerCase())}</small>`).join(' · ')}${rest > 12 ? ' …' : ''}</p><p class="pvhint"><kbd>↵</kbd> lists them all</p>` });
        if (looksAsked(raw)) { const mt = mentions(q), named = goTo.filter((it) => (mt.ds && it.t === 'Dataset' && it.drill?.id === mt.ds.id) || (mt.kd && it.t === 'Kind' && it.drill?.id === mt.kd.id) || (mt.col && it.t === 'Column' && it.name === mt.col)).slice(0, 3).map((it) => ({ ...it, g: 'go' })); gt = [...named, ...gt.filter((x) => !named.some((y) => y.name === x.name && y.t === x.t))].slice(0, 6); }
        items = looksAsked(raw) ? [askIt, ...cm, ...gt] : [...cm, ...gt, askIt];
      }
      found = items; at = 0; let last = null;
      const SECS = scope ? { in: scopeName(), inlist: scope.type === 'kind' ? 'Its datasets' : 'Its columns', else: 'Everywhere' } : q ? SECQ : SEC;
      list.innerHTML = items.length ? items.map((it, i) => { const sec = SECS[it.g]; const head = sec !== last ? `<li class="psec" role="presentation">${sec}</li>` : ''; last = sec; if (it.card) return head + `<li role="option" id="po${i}" aria-selected="${i === at}" data-i="${i}" class="pcard"><span class="pico ask">✦</span><span class="pcq">${esc(it.name)}</span><span class="pk">Full answer ↵</span><div class="pcb">${it.card}</div></li>`; return head + `<li role="option" id="po${i}" aria-selected="${i === at}" data-i="${i}"${it.more ? ' class="pmorerow"' : ''}><span class="pico${it.tone ? ' ' + it.tone : ''}">${it.icon || ''}${it.badge || ''}</span><span class="pn${it.mono ? ' mono' : ''}">${esc(it.name)}</span><span class="ps${it.prev ? ' prev' : ''}">${esc(it.sub || '')}</span><span class="pr">${it.ty ? `<span class="pty${it.key ? ' kb' : ''}">${it.ty}</span>` : ''}<span class="pk">${it.more ? 'Show ↵' : it.ask ? 'Ask ↵' : it.stay ? 'Open ↵' : '↵'}</span>${it.drill ? '<button type="button" class="pdrill" tabindex="-1" aria-label="Look inside">›</button>' : ''}</span></li>`; }).join('') : `<li class="none">Nothing ${scope ? 'inside ' + esc(scopeName()) + ' ' : ''}by that name${scope ? '' : '. Press Enter to ask instead.'}</li>`;
      list.querySelectorAll('[data-i]').forEach((li) => { li.onmousemove = () => { if (at !== +li.dataset.i) { at = +li.dataset.i; mark(); } }; li.onclick = (ev) => { const it = found[+li.dataset.i]; if (ev.target.closest('.pdrill') && it.drill) return enter(it.drill); runIt(it); }; });
      mark();
    };
    // Esc closes from anywhere; ⌫ or ← on an empty line steps back out of an answer, a dataset or a kind
    const foot = () => { const f = box.querySelector('.pfoot'); if (!f) return; const inAns = mode === 'answer'; f.querySelector('.pbk').hidden = !((scope || inAns) && !input.value); f.querySelector('.ptab').hidden = !inAns; f.querySelector('.pmv').hidden = inAns; f.querySelector('.plk').hidden = inAns || !found.some((x) => x && x.drill); f.querySelector('.pescw').textContent = 'close'; };
    const back = () => { if (mode === 'answer') { draw(); input.focus(); } else if (scope) leave(); else if (input.value) { input.value = ''; showAll = false; draw(); input.focus(); } else close(); };
    const close = () => { try { ctl && ctl.abort(); } catch (e) { /* already stopped */ } box.classList.add('closing'); setTimeout(() => box.remove(), 150); if (back0 && back0.focus && document.contains(back0)) back0.focus({ preventScroll: true }); };
    const doAct = (a) => { if (!a) return; if (a.ask) return ask(a.ask); if (a.stay) { const x = a.stay(); return showAnswer(x.title || a.label, x, 'page'); } if (a.keep) return a.run(); close(); a.run(); };
    const showAnswer = (q, a, src) => {
      mode = 'answer'; cur = a; list.hidden = true; ans.hidden = false; body.classList.add('answering'); input.removeAttribute('aria-activedescendant'); input.value = ''; input.placeholder = 'Ask another, or ⌫ to go back'; foot();
      ans.innerHTML = `<div class="pq"><span class="pico ask">${a.icon || (a.title ? '?' : '✦')}</span><b>${esc(a.title || a.q || tidyQ(q))}</b><button type="button" class="pback">‹ Back</button></div><div class="pa">${a.html}</div>${a.acts && a.acts.length ? `<div class="pacts">${a.acts.map((x, i) => `<button type="button" class="btn${x.primary ? ' primary' : ''}${x.ask ? ' askq' : ''}" data-a="${i}">${x.ask ? '✦ ' : ''}${esc(x.label)}${x === (a.acts.find((y) => y.primary) || null) ? ' <span class="pkbd" aria-hidden="true">↵</span>' : ''}</button>`).join('')}</div>` : ''}${a.title ? '' : `<div class="psrc">${src === 'claude' ? '✦ Claude, from this page’s data' : 'From this page’s data'}${src !== 'claude' && ASK ? ' · <button type="button" class="link" data-claude>Ask Claude instead</button>' : ''}</div>`}`;
      ans.querySelector('.pback').onclick = () => { draw(); input.focus(); };
      const tf = ans.querySelector('.tofield'); if (tf) { tf.oninput = () => senderSet(tf.dataset.to, tf.value.trim()); tf.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); doAct((a.acts || []).find((x) => x.primary)); } }; }
      ans.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => doAct(a.acts[+b.dataset.a])));
      const c = ans.querySelector('[data-claude]'); if (c) c.onclick = () => askClaude(q);
      ans.querySelectorAll('[data-more]').forEach((b) => (b.onclick = () => { const rest = b.nextElementSibling; if (rest) rest.hidden = false; b.remove(); input.focus(); }));
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
        showAnswer(q, { ...local, html: `<p class="pnote">${why}</p>${local.html}` }, 'page');
      }
    };
    const ask = (q) => { q = String(q).trim(); if (!q) return; const local = answerLocal(q.toLowerCase()); recentAdd(local?.q || q); if (local) return showAnswer(q, local, 'page'); if (ASK) return askClaude(q); showAnswer(q, fallbackAnswer(), 'page'); };
    const runIt = (it) => { if (!it) return; if (it.more) { showAll = true; draw(); input.focus(); return; } if (it.ask) return ask(it.ask); if (it.stay) return showAnswer(it.name, it.stay(), 'page'); close(); it.run(); };
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
    draw(); input.focus();
    window.__palette = { ask, draw, enter, leave, help: () => showAnswer('What the marks mean', helpMarks(), 'page') };
  }

  // ------------------------------------------------------------------ start
  window.__undo = () => undo();
  canvas.addEventListener('click', () => { if (S.spotPin) { S.spotPin = null; lightUp(); return; } if (S.level === 'kind') go({ level: 'estate' }); });
  document.addEventListener('keydown', (e) => { if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName || ''))) { e.preventDefault(); openSearch(); return; } });
  $('.search').addEventListener('click', openSearch); $('.search').setAttribute('role', 'button'); $('.search').tabIndex = 0; $('.search').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSearch(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.pin && !S.panel && !$('.palette')) { S.pin = null; lightUp(); render(true); e.stopImmediatePropagation(); return; } }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.reachPin && !S.panel && !$('.palette')) { S.reachPin = false; S.reach = false; renderChrome(); lightUp(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.spotPin && !S.panel && !$('.palette')) { S.spotPin = null; lightUp(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || $('.palette')) return; if (S.panel) return closePanel(); if (S.level === 'dataset') go({ level: 'kind', kind: dsOf(S.ds).kind }); else if (S.level === 'kind') go({ level: 'estate' }); });
  addEventListener('popstate', () => fromHash());
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!M) return; estateCache = null; spotMemo = { key: '' }; render(true); }, 120); });
  $('#estname').addEventListener('click', (ev) => { ev.stopPropagation(); const mn = $('#estmenu'); const open = mn.hasAttribute('hidden'); mn.toggleAttribute('hidden', !open); $('#estname').setAttribute('aria-expanded', String(open)); if (open) mn.querySelector('button.on, button')?.focus(); });
  document.addEventListener('click', (ev) => { const mn = $('#estmenu'); if (mn && !mn.hasAttribute('hidden') && !mn.contains(ev.target)) { mn.setAttribute('hidden', ''); $('#estname').setAttribute('aria-expanded', 'false'); } });
  document.querySelectorAll('#which button').forEach((b) => (b.onclick = () => { $('#estmenu').setAttribute('hidden', ''); $('#estname').setAttribute('aria-expanded', 'false'); if (b.dataset.m === 'build') { history.pushState(null, '', '#build'); return fromHash(); } history.pushState(null, '', '#estate' + (b.dataset.m === 'big' ? '-big' : '')); if (S.m === 'build' && window.__buildLeave) window.__buildLeave(); switchModel(b.dataset.m, () => Object.assign(S, { level: 'estate', kind: null, ds: null })); }));
  stage.addEventListener('click', (ev) => { const c = ev.target.closest('.kwait[data-reach]'); if (!c) return; ev.stopPropagation(); ev.preventDefault(); showReach(); }, true);
  $('#waits').onclick = () => { if (waitingDs()) decideNow(); else if (decidedDs()) replaceNow(); };
  window.__explore = { S, go, render, spotlight, models, switchModel, refresh: () => { estateCache = null; spotMemo = { key: '' }; S.ver++; render(); }, getM: () => M, sentence: (r) => sentence(r, false), decideNow, replaceNow, publishFix: (note) => { const dd = decidedDs(); if (dd && dd.pendingFix) replaceFile(dd.id, dd.pendingFix, note); }, toast, openSearch, closePanel, openPanel, PAUSE, HOURGLASS, HALF, ICON, esc, fmt };
  const fonts = document.fonts ? Promise.race([Promise.all(['600 15px Geist', '400 13px Geist', '500 13px Geist', '500 13px "Geist Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {}) : Promise.resolve();
  fonts.then(() => fromHash()).then(() => { document.body.dataset.ready = '1'; });
})();
