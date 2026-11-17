// Drive the built smaltfl app at phone, tablet or desktop size and capture what each view shows.
//
//   node tour.cjs <appDir> <outDir> <stops.json>
//   TOUR_DEVICE=tablet node tour.cjs …     at another size (DEVICES below): phone (default), tablet, tablet-wide,
//                                          desktop, wide. The app is held to all of them (CLAUDE.md, "Phone, tablet and
//                                          desktop"; wide is a 2560 px monitor)
//   TOUR_SWEEP=tablet,desktop node tour.cjs …   after each stop, the same page at these sizes too, by resizing its
//                                          window: the layout checked at each (nothing scrolls sideways), nothing run
//                                          again. What the regression does for the sizes it doesn't replay (ADR 0025)
//   TOUR_SHOTS=fail node tour.cjs …        screenshots only of the stops that reported a problem ("none": never;
//                                          "all", the default: every stop, for a person or a judge to look at)
//   TOUR_SCALE=2 node tour.cjs …           the same at twice the pixels, for screenshots a person will look at
//   TOUR_STACK=1 node tour.cjs …           a page error is reported with where it was thrown (build the app with
//                                          SMALTFL_PROFILE=1 to read it by name)
//
// At every stop, whatever the device, the layout is checked and each failure is a problem: the page scrolls sideways,
// or an open sheet does.
//
// It never pauses a fixed time, and never guesses that the page is done from how long it has been still: it asks the
// page (`window.__smaltflBusy`: starting, a run under way, the engine asked something) and counts what the page has
// started and not finished (fetches, short timers, animation frames, hashes, IndexedDB), and goes on the moment all of
// it is over. A build without `__smaltflBusy` (an older one, for a baseline) is waited for as before: 250 ms with no
// change to the page.
//
// stops.json: an array of stops, visited in order in one page:
//   { "name": "sep22-trips-news",        file name for the screenshot and the metrics
//     "day": "Fri 22",                    optional: the day ("<Weekday> <date>"), found by what the month says of it and opened by its link.
//                                         A set whose first stop names a day opens the app on that day's link, so that
//                                         day runs first (the app runs the first day only when no day is asked for)
//     "version": 1,                       optional: with "day", the day's version to open (`#day/…/v1`, ADR 0021 §4); none: the one readers got
//     "devices": ["desktop", "wide"],     optional: the sizes the stop runs at (what it shows exists only there); any other skips it,
//                                         unless one of them is swept (TOUR_SWEEP): then the stop runs at that size, in the same page
//     "fresh": true,                      optional: a new browser first, with nothing kept (no record, no edits), the app opened again
//     "page": "feeds",                    optional: another app of the same site first (ADR 0026 §6: two pages of one
//                                         browser that share a flow), by the name of its folder beside <appDir>, and
//                                         the stops after it until one says another; "" is <appDir>'s. Both are served
//                                         from one origin, so they share the browser's records, as a site's pages do.
//                                         The app is opened there (on the stop's day, where it names one): a run
//     "in": "feeds",                      optional: the flows entered first (ADR 0026 §4), by id from the top ("feeds",
//                                         "applications/feeds"); "" is the top. A card inside a flow the page's flow
//                                         reads is reached without it: the tour goes to the level that draws it
//     "flow": "feeds",                    optional: the flow whose card to open (its sheet is what is captured)
//     "card": "trips_profile",           optional: the card whose drill-down to open (none: the canvas)
//     "tab": "News",                      optional: the drill-down tab
//     "full": true,                       optional: capture the whole sheet, not just the first screen
//     "element": "#sheet .cp",            optional: capture only the first element matching, cropped to it
//     "scheme": "dark",                   optional: "light" (default) or "dark", switched in the same page (nothing reloads)
//     "mask": "letters",                  optional: mask the text in the screenshot ("letters": keep digits; "all")
//     "click": "#sheet .vf-hero",         optional: tap this first (a detail sheet opens), then capture
//     "dblclick": "g.card.flow",          optional: double-click this first (a mouse's: give the stop "devices")
//     "clicks": ["sel", ...],             optional: tap each in order, waiting after each for what it started (a run
//                                         included); an entry ["sel", "text"] types the text into that field instead (a
//                                         form's input), or chooses that value where the field is a select
//     "press": ["sel", "ArrowLeft"],      optional: after the taps, focus the first match and press each key in order
//                                         (the month's arrow keys, ADR 0024 §7)
//     "upload": ["sel", "file"],          optional: after the taps, choose this file (relative to the stops file) in a
//                                         file input, and wait for the run it starts (Replace the file)
//     "waitFor": "sel",                   optional: after the taps, wait until this shows (what a tap draws once the engine answers)
//     "waitForMs": 240000,                optional: how long waitFor waits (default 30 s): what takes many runs to draw
//     "reload": true,                     optional: reload the page first, keeping IndexedDB, and wait for its run
//     "view": "runs",                     optional: show a view (#runs, #policies, ...) before capturing
//     "viewFirst": true,                  optional: show the view before the clicks, not after
//     "select": ["#viewer", "ana"],       optional: choose a value in a select (after the card opens)
//     "download": "sel",                  optional: tap this and save the download into outDir
//     "tamper": "loads/tls_2024-03-12.csv", optional: from this stop on, one byte of this file is changed on its way to
//                                         the page (a corrupted copy, someone in the middle): the page must refuse it
//     "unfold": ["nb-posture"],           optional: notebook boxes to unfold first, so their steps are cards on the canvas
//     "box": "nb-summary",                optional: the notebook box whose sheet to open and capture
//     "what": "Tue Mar 12, the brief",    optional: what the stop shows, copied into metrics.json for a judge to read
//     "expect": { ... } }                 optional: checks, each failure a problem (below)
//
// expect (each optional; text is the captured scope's innerText, whitespace folded). A check that fails is read once
// more after the page has been still for 250 ms, so only what stays wrong is a problem:
//   "state": "held"                       #status[data-state] equals this
//   "title": "^‖ ", "noTitle": "‖"        document.title matches / doesn't match (regexes)
//   "status": "^Thu Sep 21"               the status line's text matches
//   "text": ["…"], "noText": ["…"]        each string is / none is in the scope's text
//   "pageText": ["…"], "noPageText": [""]  the same over the whole page's text
//   "maxWords": 45, "minCharts": 2        the scope's word count, its charts (as the metrics count them)
//   "count": { "sel": n }                 exactly n visible elements match in the page
//   "disabled": ["sel"], "enabled": [..]  the first visible match is (not) disabled
//   "cards": { "zone_hour": "‖|…" }       a canvas card's line (text.what) contains the text; a leading "‖|", "⚑|"
//                                         or "✕|" also needs the card's glyph mark (.card-mark) present; "-|" none
//   "loads": { "Thu 21": ", paused" }     what the month says of the day contains this ("!…": doesn't)
//   "words": { "sel": max }               words outside drawings in the first visible match, at most max
//   "textIn": { "sel": ["…"] }            each string is in the first visible match's text, its drawings' included
//   "noTextIn": { "sel": ["…"] }          none is
//   "download": "^smaltfl-audit-.*\.zip$" with "download": the file saved has this name (a regex) and isn't empty
//   "audit": true                         with "download": the offline audit holds the bag downloaded
//                                         (node scripts/audit.mjs check BAG.zip, what an auditor runs on it)
//
// Writes <outDir>/<name>.png (TOUR_SHOTS) and <outDir>/metrics.json: per stop, the status line, the visible text of the
// sheet (or the canvas page), its word count, its paragraphs of more than 25 words, the number of charts
// (svg/canvas) and the words before the first chart. Its last lines are `problems: …` and `cost: {…}`: the stops made,
// the times the app was opened, the runs the engine made and the seconds it all took, which the regression holds each
// set to (tools/browser/sets.json, ADR 0025).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

const given = process.argv.slice(2);
if (given.length < 3) {
  console.error('usage: node tour.cjs <appDir> <outDir> <stops.json>');
  process.exit(2);
}
// Each path from where the tour was started: the server below serves nothing it can't place under the app's folder.
const [root, out, stopsFile] = given.map((g) => path.resolve(g));
fs.mkdirSync(out, { recursive: true });
const stops = JSON.parse(fs.readFileSync(stopsFile, 'utf8'));
const skeletons = new Map();
const skeletonOf = (dir) => {
  if (!skeletons.has(dir)) skeletons.set(dir, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>${fs.readFileSync(path.join(dir, 'page.html'), 'utf8')}</body></html>`);
  return skeletons.get(dir);
};
skeletonOf(root);
const types = { '.js': 'text/javascript', '.txt': 'text/plain', '.csv': 'text/csv', '.json': 'application/json' };
// The files a stop's "tamper" names: from that stop on, each is served with one byte changed.
const tampered = new Set();
// The site: <appDir> at `/`, and each app built beside it at `/<its folder>/` (<appDir> itself too), as a site serves
// its pages from one origin. A stop's "page" goes to one; the links between the pages (the build's `--page`) lead there.
const site = path.dirname(root);
const appDir = (name) => (name ? path.join(site, name) : root);
const appOf = (url) => {
  const m = /^\/([^/]+)\/(.*)$/.exec(url);
  return m && fs.existsSync(path.join(site, m[1], 'page.html')) ? { dir: path.join(site, m[1]), rest: `/${m[2]}` } : { dir: root, rest: url };
};
const server = http.createServer((req, res) => {
  const { dir, rest: url } = appOf(decodeURIComponent(req.url.split('?')[0]));
  if (url === '/') return res.writeHead(200, { 'content-type': 'text/html' }).end(skeletonOf(dir));
  const file = path.join(dir, url);
  if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  let body = fs.readFileSync(file);
  if ([...tampered].some((t) => url.endsWith(`/${t.replace(/^\/+/, '')}`))) {
    const i = Math.min(4000, body.length - 1);
    body[i] = body[i] === 0x41 ? 0x42 : 0x41;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
});

/** The sizes the app is held to: a phone, an iPad held upright and sideways, a laptop's browser window. */
const DEVICES = {
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180, isMobile: true, hasTouch: true },
  'tablet-wide': { width: 1180, height: 820, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  // A big monitor: the desktop split across a wider window (ADR 0018).
  wide: { width: 2560, height: 1440, isMobile: false, hasTouch: false },
};
const NATIVE = process.env.TOUR_DEVICE || 'phone';
const device = DEVICES[NATIVE];
if (!device) {
  console.error(`TOUR_DEVICE is one of ${Object.keys(DEVICES).join(', ')}`);
  process.exit(2);
}
const W = device.width;
const H = device.height;
// The sizes each stop is also looked at, by resizing the window it was reached in (ADR 0025 §3).
const SWEEP = (process.env.TOUR_SWEEP || '').split(',').map((s) => s.trim()).filter((s) => s && s !== NATIVE);
for (const s of SWEEP) {
  if (!DEVICES[s]) {
    console.error(`TOUR_SWEEP names sizes among ${Object.keys(DEVICES).join(', ')}, not "${s}"`);
    process.exit(2);
  }
}
const SHOTS = process.env.TOUR_SHOTS || 'all';
if (!['all', 'fail', 'none'].includes(SHOTS)) {
  console.error('TOUR_SHOTS is one of all, fail, none');
  process.exit(2);
}
// Whether this build says when it is at work (`window.__smaltflBusy`, src/app/main.ts). One that doesn't is waited for
// as every build was before: by the status line, and by 250 ms with no change to the page.
const HOOKED = fs.readdirSync(root).some((f) => /^app\..*\.js$/.test(f) && fs.readFileSync(path.join(root, f), 'utf8').includes('__smaltflBusy'));
// How long a wait lasts at most: in all (a run, the engine), and once the app says it isn't at work while the page
// still is (what it started and hasn't finished: a tab that goes on computing). A page that isn't at rest by then is a
// problem the stop reports: nothing on it should work that long with nothing asked of it. A build that doesn't say
// when it is at work is given what every build was before, and no problem is made of it.
const HARD = 180000;
const SOFT = HOOKED ? 30000 : 4000;
// How long the app has to show its first run: it takes a few seconds, and one that hasn't by then never will.
const START = 90000;

const WEEKDAY = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' };
// The days the app's data has, from its list: a stop's day ("Tue 12") is the first of them on that weekday and date,
// which is the day the month's label names. Known before the app opens, so the app can be opened on it.
const listed = new Map();
const listedDays = (dir) => {
  if (!listed.has(dir)) {
    let days = [];
    try {
      const list = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'loads.json'), 'utf8'));
      days = [...new Set(Object.values(list.sources ?? {}).flatMap((s) => (Array.isArray(s.loads) ? s.loads.map((l) => l.day) : [])))].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    } catch {
      days = [];
    }
    listed.set(dir, days);
  }
  return listed.get(dir);
};
const isoOf = (label, dir = root) => {
  const [wd, date] = String(label).split(/\s+/);
  return listedDays(dir).find((d) => {
    const t = new Date(`${d}T00:00:00Z`);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][t.getUTCDay()] === (WEEKDAY[wd] ?? wd) && String(t.getUTCDate()) === date;
  }) ?? null;
};

/**
 * Put in every page before any of its own script runs: counts what the page has started and not finished, and
 * `window.__tour.idle` waits until none of it is left, the app says it isn't at work, and the page hasn't changed for
 * a few frames. It changes nothing the page does: each wrapped function is called as it was and returns what it did.
 */
function tracker() {
  if (window.__tour) return;
  // What is started and unfinished, in all and by what it is (said when a wait ends at its limit).
  const at = { n: 0, of: {} };
  const more = (kind) => {
    at.n++;
    at.of[kind] = (at.of[kind] ?? 0) + 1;
  };
  const less = (kind) => {
    at.n--;
    at.of[kind]--;
  };
  const setT = window.setTimeout.bind(window);
  const clearT = window.clearTimeout.bind(window);
  const track = (kind, promise) => {
    more(kind);
    let over = false;
    const end = () => {
      if (!over) {
        over = true;
        less(kind);
      }
    };
    promise.then(end, end);
    return promise;
  };
  // A fetch, and the reading of what it or a file answered with.
  const fetch0 = window.fetch;
  window.fetch = function (...a) {
    return track('fetch', fetch0.apply(this, a));
  };
  for (const proto of [Response.prototype, Blob.prototype]) {
    for (const m of ['arrayBuffer', 'json', 'text', 'blob', 'bytes']) {
      const f = proto[m];
      if (typeof f === 'function') proto[m] = function (...a) { return track('read', f.apply(this, a)); };
    }
  }
  // A hash, a signature, a key.
  if (window.SubtleCrypto) {
    for (const m of ['digest', 'sign', 'verify', 'importKey', 'exportKey', 'generateKey', 'deriveBits', 'deriveKey', 'encrypt', 'decrypt']) {
      const f = SubtleCrypto.prototype[m];
      if (typeof f === 'function') SubtleCrypto.prototype[m] = function (...a) { return track('crypto', f.apply(this, a)); };
    }
  }
  // A timer about to fire is work on its way; a long one is the page's own clock (a button's word put back, a flash
  // taken off), which nothing waits for.
  const timers = new Set();
  window.setTimeout = function (fn, ms, ...rest) {
    if (typeof fn !== 'function' || (Number(ms) || 0) > 400) return setT(fn, ms, ...rest);
    more('timer');
    const id = setT(function (...a) {
      if (timers.delete(id)) less('timer');
      return fn.apply(this, a);
    }, ms, ...rest);
    timers.add(id);
    return id;
  };
  window.clearTimeout = function (id) {
    if (timers.delete(id)) less('timer');
    return clearT(id);
  };
  // A frame asked for, and the page's idle time. A frame asked for from inside a frame, again and again, is a loop (an
  // animation, or a look each frame for something to turn up), not work on its way: past the third in a row it isn't
  // counted, so a page that only animates is at rest.
  for (const [ask, cancel] of [['requestAnimationFrame', 'cancelAnimationFrame'], ['requestIdleCallback', 'cancelIdleCallback']]) {
    const ask0 = window[ask];
    const cancel0 = window[cancel];
    if (typeof ask0 !== 'function') continue;
    const asked = new Set();
    const kind = ask === 'requestAnimationFrame' ? 'frame' : 'idle time';
    let inside = 0;
    window[ask] = function (fn, ...rest) {
      const depth = inside + 1;
      if (depth > 3) {
        return ask0.call(window, function (...a) {
          const was = inside;
          inside = depth;
          try {
            return fn.apply(this, a);
          } finally {
            inside = was;
          }
        }, ...rest);
      }
      more(kind);
      const id = ask0.call(window, function (...a) {
        if (asked.delete(id)) less(kind);
        const was = inside;
        inside = depth;
        try {
          return fn.apply(this, a);
        } finally {
          inside = was;
        }
      }, ...rest);
      asked.add(id);
      return id;
    };
    window[cancel] = function (id) {
      if (asked.delete(id)) less(kind);
      return cancel0.call(window, id);
    };
  }
  // IndexedDB: a database being opened, a transaction until it ends.
  const until = (target, events) => {
    more('IndexedDB');
    let over = false;
    const end = () => {
      if (!over) {
        over = true;
        less('IndexedDB');
      }
    };
    for (const e of events) target.addEventListener(e, end);
  };
  if (window.IDBDatabase && window.IDBFactory) {
    const tx0 = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...a) {
      const tx = tx0.apply(this, a);
      until(tx, ['complete', 'abort', 'error']);
      return tx;
    };
    for (const m of ['open', 'deleteDatabase']) {
      const f = IDBFactory.prototype[m];
      IDBFactory.prototype[m] = function (...a) {
        const rq = f.apply(this, a);
        until(rq, ['success', 'error', 'blocked']);
        return rq;
      };
    }
  }
  window.__tour = {
    // Resolves once the page is at rest: nothing started and unfinished, the app not at work, and no change to the
    // page for `still` ms (a few frames where the app says when it is at work; 250 ms where it can't). At most `hard`
    // ms in all, and at most `soft` ms after the app was last at work (something the page started that never ends
    // isn't waited for longer). Says how long it waited and whether a limit ended it.
    idle: (soft, hard, still) => new Promise((done) => {
      const hooked = typeof window.__smaltflBusy === 'function';
      const need = still || (hooked ? 40 : 250);
      const t0 = performance.now();
      let since = t0;
      let free = t0;
      const mo = new MutationObserver(() => { since = performance.now(); });
      mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      const tick = () => {
        const now = performance.now();
        const working = hooked && window.__smaltflBusy() === true;
        if (working) free = now;
        if (working || at.n > 0) since = now;
        if (now - since >= need || now - t0 >= hard || now - free >= soft) {
          mo.disconnect();
          done({ ms: Math.round(now - t0), capped: now - since < need, working, unfinished: Object.entries(at.of).filter(([, n]) => n > 0).map(([kind, n]) => `${n} ${kind}`).join(', ') });
        } else setT(tick, 8);
      };
      setT(tick, 0);
    }),
  };
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const began = Date.now();
  const browser = await chromium.launch();
  const metrics = [];
  let ctx = null;
  let p = null;
  let scheme = null;
  // The app of the site the page is on: '' is <appDir>'s (a stop's "page").
  let at = '';
  const problems = [];
  // What the tour cost: its stops, the times the app was opened or reloaded, the runs the engine made (the status
  // line's count, a refused load included).
  const cost = { stops: 0, loads: 0, runs: 0 };
  let runsSeen = 0;
  // Requests the page's script doesn't make itself (a bundle imported when it is first needed): the page isn't at
  // rest while one is on its way.
  const coming = new Set();
  let drained = null;
  // The waits of the stop under way that ended at their limit, each with what was unfinished.
  let limits = [];
  // The status line's run number and state (data-run, data-state), with its words: what changed after a step.
  const status = () => p.evaluate(() => { const el = document.querySelector('#status'); return `${el?.dataset.run ?? ''}|${el?.dataset.state ?? ''}|${el?.textContent ?? ''}`; });
  // The page at rest (the tracker above), and nothing it imports still on its way. It stands where fixed sleeps stood:
  // a stop waits as long as the page is at work, and no longer.
  const idle = async (soft = SOFT, hard = HARD, still = 0) => {
    for (let round = 0; round < 4; round++) {
      const r = await p.evaluate(([s, h, q]) => window.__tour.idle(s, h, q), [soft, hard, still]).catch(() => null);
      // A wait a limit ended, not the page coming to rest: said with the stop, since it is time spent on nothing.
      if (r?.capped) limits.push(r.working ? 'the app at work' : r.unfinished || 'the page still changing');
      if (!coming.size) return;
      await new Promise((done) => {
        const t = setTimeout(() => { coming.clear(); done(); }, 5000);
        drained = () => { clearTimeout(t); done(); };
      });
      drained = null;
    }
  };
  // A build that doesn't say when it is at work: a run is waited for by the status line, as before.
  const settledByStatus = async (before) => {
    const started = await p.waitForFunction((was) => {
      const el = document.querySelector('#status');
      const text = el?.textContent ?? '';
      return (el?.dataset.run ?? '') !== was.split('|')[0] || /Running|Fetching/.test(text) || text !== was.split('|').slice(2).join('|');
    }, before, { timeout: 2500 }).then(() => true, () => false);
    if (!started && before !== '') return;
    await p.waitForFunction((was) => {
      const el = document.querySelector('#status');
      const run = el?.dataset.run ?? '';
      const text = el?.textContent ?? '';
      return (run !== '' && run !== was.split('|')[0]) || (text !== was.split('|').slice(2).join('|') && /isn.t the file|refused|couldn/i.test(text));
    }, before, { timeout: HARD }).catch(() => {});
    await idle();
  };
  // After a step that may have started a run: the page at rest again, the run over.
  const settled = (before) => (HOOKED ? idle() : settledByStatus(before));
  // The app opened: its first run shown, or its first file refused. An app that shows neither didn't start, and no
  // stop of the tour would mean anything: the tour ends there (`dead`), saying what the status line was left at.
  let dead = null;
  const started = async () => {
    const up = await p.waitForFunction(() => {
      const el = document.querySelector('#status');
      return (el?.dataset.run ?? '') !== '' || /isn.t the file|refused|couldn/i.test(el?.textContent ?? '');
    }, null, { timeout: START }).then(() => true, () => false);
    if (!up) {
      dead = `the app didn't start: its status line reads "${(await status().catch(() => '||')).split('|').slice(2).join('|').slice(0, 80)}" after ${START / 1000} s (is ${root} a built app?)`;
      throw new Error(dead);
    }
    await idle();
    cost.loads++;
    runsSeen = 0;
  };
  // A view or a day by its link, once the page has heard of it.
  const go = (hash) => p.evaluate((h) => new Promise((done) => {
    if (location.hash === h) return done(false);
    window.addEventListener('hashchange', () => done(true), { once: true });
    location.hash = h;
  }), hash);
  const open = async (stop) => {
    const wanted = stop.scheme === 'dark' ? 'dark' : 'light';
    if (ctx && stop.fresh) {
      await ctx.close();
      ctx = null;
    }
    if (ctx) {
      // The other scheme in the same page: the page's colours are its style sheet's, so nothing is opened again.
      if (scheme !== wanted) {
        scheme = wanted;
        await p.emulateMedia({ colorScheme: wanted });
        await idle();
      }
      return;
    }
    scheme = wanted;
    ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: device.isMobile, hasTouch: device.hasTouch, deviceScaleFactor: Number(process.env.TOUR_SCALE || 1), colorScheme: wanted, acceptDownloads: true });
    await ctx.addInitScript(tracker);
    p = await ctx.newPage();
    p.on('pageerror', (e) => problems.push(`PAGEERROR ${e.message}${process.env.TOUR_STACK ? `\n${e.stack}` : ''}`));
    p.on('console', (m) => m.type() === 'error' && problems.push(`console ${m.text()}`));
    p.on('request', (r) => { if (!['fetch', 'xhr', 'document'].includes(r.resourceType())) coming.add(r); });
    const over = (r) => { if (coming.delete(r) && !coming.size && drained) drained(); };
    p.on('requestfinished', over);
    p.on('requestfailed', over);
    // A new browser opens the app the stop names, else <appDir>'s.
    at = stop.page ?? '';
    await p.goto(hrefOf(stop, at));
    await started();
  };
  // Where a stop opens an app of the site: on the stop's day, where it names one. The app runs the day its link names
  // first (ADR 0021 §4), so the first day isn't run only to be left.
  const hrefOf = (stop, app) => {
    const iso = HOOKED && stop.day && !stop.reload ? isoOf(stop.day, appDir(app)) : null;
    return `${url}${app ? `${app}/` : ''}${iso ? `#day/${iso}${stop.version ? `/v${stop.version}` : ''}` : ''}`;
  };
  // The layout at the size the window is: the page doesn't scroll sideways, nor an open sheet.
  const sideways = () => p.evaluate(() => {
    const out = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth + 1) out.push(`the page is ${doc.scrollWidth} px wide in a ${window.innerWidth} px window`);
    const sheet = document.getElementById('sheet');
    if (sheet && !sheet.hidden && sheet.getBoundingClientRect().width > 0 && sheet.scrollWidth > sheet.clientWidth + 1) out.push(`the sheet scrolls sideways (${sheet.scrollWidth} px in ${sheet.clientWidth})`);
    return out;
  });
  const sizeTo = async (name) => {
    await p.setViewportSize({ width: DEVICES[name].width, height: DEVICES[name].height });
    await idle();
  };
  // What a stop shows: its scope's text and counts, and the status line.
  const measure = async (stop) => {
    const scope = (stop.click || stop.clicks) && (await p.locator('.vf-detail').count()) ? '.vf-detail' : stop.card || stop.box || stop.flow ? '#sheet' : 'body';
    const m = await p.evaluate((sel) => {
      const el = document.querySelector(sel);
      const text = (el?.innerText ?? '').replace(/\s+/g, ' ').trim();
      const words = (t) => (t.match(/[A-Za-z0-9’'%.,:–-]+/g) ?? []).filter((w) => /[A-Za-z0-9]/.test(w)).length;
      const long = [...(el?.querySelectorAll('p, li, dd, h3') ?? [])].filter((x) => x.offsetParent !== null).map((x) => x.innerText.replace(/\s+/g, ' ').trim()).filter((t) => words(t) > 25);
      const charts = [...(el?.querySelectorAll('svg, canvas') ?? [])].filter((x) => x.getBoundingClientRect().width > 60 && x.getBoundingClientRect().height > 24 && x.offsetParent !== null);
      // Words before the first chart, in document order.
      let before = 0;
      if (el && charts[0]) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (n === charts[0]) break;
          if (n.nodeType === 3 && n.parentElement?.offsetParent !== null && !n.parentElement.closest('svg')) before += words(n.textContent);
        }
      }
      const height = sel === 'body' ? document.documentElement.scrollHeight : Math.max(el?.scrollHeight ?? 0, ...[...(el?.querySelectorAll('*') ?? [])].slice(0, 3000).map((x) => (x.scrollHeight > x.clientHeight + 4 && getComputedStyle(x).overflowY !== 'visible' ? x.scrollHeight : 0)));
      return { text, words: words(text), longParagraphs: long, charts: charts.length, wordsBeforeFirstChart: charts[0] ? before : null, height };
    }, scope);
    m.name = stop.name;
    if (stop.what) m.what = stop.what;
    const said = await status();
    m.status = said.split('|').slice(2).join('|');
    m.state = said.split('|')[1];
    m.title = await p.title();
    return { m, scope };
  };
  // What a stop expects, checked: each failure in words. `saved` is what the stop downloaded, `kept` what an earlier
  // reading of the same stop already found out (the offline audit is run once).
  const expected = async (stop, m, scope, saved, kept) => {
    const fails = [];
    const fail = (why) => fails.push(why);
    // The capture is of the day it is named for: the status line starts "Ddd Mon D:".
    if (stop.day && !stop.select) {
      const [wd, date] = stop.day.split(/\s+/);
      if (!new RegExp(`^${wd} [A-Z][a-z]{2} ${date}\\b`).test(m.status)) fail(`status "${m.status.slice(0, 40)}" is not ${stop.day}`);
    }
    const x = stop.expect;
    if (!x) return fails;
    if (x.state !== undefined && m.state !== x.state) fail(`state "${m.state}", expected "${x.state}"`);
    if (x.title && !new RegExp(x.title).test(m.title)) fail(`title "${m.title}" doesn't match /${x.title}/`);
    if (x.noTitle && new RegExp(x.noTitle).test(m.title)) fail(`title "${m.title}" matches /${x.noTitle}/`);
    if (x.status && !new RegExp(x.status).test(m.status)) fail(`status "${m.status.slice(0, 60)}" doesn't match /${x.status}/`);
    for (const t of x.text ?? []) if (!m.text.includes(t)) fail(`no "${t}" in the ${scope} text`);
    for (const t of x.noText ?? []) if (m.text.includes(t)) fail(`"${t}" in the ${scope} text`);
    if (x.pageText || x.noPageText) {
      const all = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      for (const t of x.pageText ?? []) if (!all.includes(t)) fail(`no "${t}" on the page`);
      for (const t of x.noPageText ?? []) if (all.includes(t)) fail(`"${t}" on the page`);
    }
    if (x.maxWords !== undefined && m.words > x.maxWords) fail(`${m.words} words, at most ${x.maxWords}`);
    if (x.minCharts !== undefined && m.charts < x.minCharts) fail(`${m.charts} charts, at least ${x.minCharts}`);
    const visibleAll = (sel) => p.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length, sel);
    for (const [sel, n] of Object.entries(x.count ?? {})) { const c = await visibleAll(sel); if (c !== n) fail(`${c} × ${sel}, expected ${n}`); }
    // The first visible match: whether it is disabled, and its words outside drawings (visible text nodes not in an
    // svg; a drawing's labels are budgeted in the Node tests), and all its words.
    const firstVisible = (sel) => p.evaluate((s) => {
      const e = [...document.querySelectorAll(s)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (!e) return null;
      const count = (t) => (t.match(/[A-Za-z0-9’'%.,:–-]+/g) ?? []).filter((w) => /[A-Za-z0-9]/.test(w)).length;
      let out = 0;
      const prose = [];
      const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || el.closest('svg') || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
        if (el.closest('[hidden]')) continue;
        out += count(n.textContent);
        if (n.textContent.trim()) prose.push(n.textContent.trim());
      }
      return { disabled: !!e.disabled || e.getAttribute('aria-disabled') === 'true', words: out, all: count(e.innerText), text: prose.join(' ') };
    }, sel);
    for (const sel of x.disabled ?? []) { const e = await firstVisible(sel); if (!e) fail(`no ${sel} to be disabled`); else if (!e.disabled) fail(`${sel} is enabled, expected disabled`); }
    for (const sel of x.enabled ?? []) { const e = await firstVisible(sel); if (!e) fail(`no ${sel} to be enabled`); else if (e.disabled) fail(`${sel} is disabled, expected enabled`); }
    for (const [sel, max] of Object.entries(x.words ?? {})) {
      const e = await firstVisible(sel);
      if (!e) fail(`no ${sel} to count`);
      else {
        (m.glance ??= {})[sel] = { words: e.words, all: e.all, text: e.text };
        if (e.words > max) fail(`${e.words} words in ${sel} outside drawings ("${e.text.slice(0, 100)}…"), at most ${max}`);
      }
    }
    // Text inside one element, its drawings' text included (a bar's or a dumbbell's label).
    const textOf = (sel) => p.evaluate((s) => {
      const e = [...document.querySelectorAll(s)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      return e ? (e.textContent ?? '').replace(/\s+/g, ' ') : null;
    }, sel);
    for (const [sel, want] of Object.entries(x.textIn ?? {})) {
      const got = await textOf(sel);
      if (got === null) fail(`no ${sel} to read`);
      else for (const t of want) if (!got.includes(t)) fail(`no "${t}" in ${sel}`);
    }
    for (const [sel, unwanted] of Object.entries(x.noTextIn ?? {})) {
      const got = await textOf(sel);
      if (got === null) fail(`no ${sel} to read`);
      else for (const t of unwanted) if (got.includes(t)) fail(`"${t}" in ${sel}`);
    }
    for (const [card, want] of Object.entries(x.cards ?? {})) {
      const got = await p.evaluate((c) => { const g = document.querySelector(`g.card[data-card="${c}"]`); return g ? { line: g.querySelector('text.what')?.textContent ?? '', mark: !!g.querySelector('.card-mark') } : null; }, card);
      const [, needMark, text] = /^(?:([‖⚑✕◧◐-])\|)?(.*)$/.exec(want);
      if (!got) fail(`no card ${card}`);
      else {
        if (!got.line.includes(text)) fail(`card ${card} reads "${got.line}", expected "${text}"`);
        if (needMark && needMark !== '-' && !got.mark) fail(`card ${card} has no mark, expected ${needMark}`);
        if (needMark === '-' && got.mark) fail(`card ${card} has a mark, expected none`);
      }
    }
    for (const [d, want] of Object.entries(x.loads ?? {})) {
      const [wd, date] = d.split(/\s+/);
      // What the month says of the day (ADR 0021 §3), as the strip's label said it.
      const label = await p.evaluate((src) => { const re = new RegExp(src); const m = window.__smaltflMonth ? window.__smaltflMonth() : {}; return Object.values(m).find((v) => re.test(v)) ?? null; }, `^${wd} [A-Z][a-z]{2} ${date}\\b`);
      const not = want.startsWith('!');
      const t = not ? want.slice(1) : want;
      if (label === null) fail(`no day ${d} in the month`);
      else if (not ? label.includes(t) : !label.includes(t)) fail(`loads ${d} reads "${label}", expected ${not ? 'no ' : ''}"${t}"`);
    }
    // What the stop downloaded: its name, not empty, and for a bag, the offline audit's verdict on it.
    if (x.download !== undefined || x.audit) {
      if (!saved) fail('nothing was downloaded');
      else {
        if (x.download !== undefined && !new RegExp(x.download).test(saved.name)) fail(`downloaded "${saved.name}", expected /${x.download}/`);
        if (!saved.bytes) fail(`${saved.name} is empty`);
        if (x.audit) {
          if (kept.audit === undefined) {
            const repo = path.join(__dirname, '..', '..');
            const r = spawnSync(process.execPath, [path.join(repo, 'scripts', 'audit.mjs'), 'check', saved.path], { cwd: repo, encoding: 'utf8', timeout: 600000 });
            const said = `${r.stdout ?? ''}${r.stderr ?? ''}`;
            kept.audit = r.status !== 0 || !/The bag holds/.test(said) ? `the offline audit doesn't hold ${saved.name}: ${said.split('\n').filter((l) => /^FAIL|Error/.test(l)).slice(0, 3).join(' // ') || `exit ${r.status}`}` : null;
            if (kept.audit === null) console.log(`${stop.name}: the offline audit holds ${saved.name}`);
          }
          if (kept.audit) fail(kept.audit);
        }
      }
    }
    return fails;
  };
  // The stop's screenshot: the first screen, the whole sheet ("full") or one element, in a window made tall for it.
  const capture = async (stop, m) => {
    const shot = path.join(out, `${stop.name}.png`);
    if (stop.mask) {
      await p.addScriptTag({ path: path.join(__dirname, 'mask.js') });
      await p.evaluate((mode) => window.__maskText(mode), stop.mask);
    }
    if (stop.element) {
      // One part of the page, cropped to it (a focused screenshot for a person to judge one thing).
      const el = p.locator(stop.element).first();
      // A tall window first, so an element taller than the screen isn't cut off under the sheet's sticky head.
      const size = p.viewportSize();
      await p.setViewportSize({ width: size.width, height: Math.min(9000, m.height + 160) });
      await idle();
      await el.scrollIntoViewIfNeeded();
      await idle();
      await el.screenshot({ path: shot });
      await p.setViewportSize(size);
      await idle();
    } else if (stop.full && m.height > p.viewportSize().height) {
      const size = p.viewportSize();
      await p.setViewportSize({ width: size.width, height: Math.min(9000, m.height + 160) });
      await idle();
      await p.screenshot({ path: shot });
      await p.setViewportSize(size);
      await idle();
    } else await p.screenshot({ path: shot });
    if (stop.mask) await p.evaluate(() => window.__unmaskText());
    return shot;
  };
  for (const stop of stops) {
    // A stop about what only some sizes draw (the month's grid, from 820 px) runs at those alone: at this window's own
    // size, else at the first of them the window is taken to after each stop.
    const at = !stop.devices || stop.devices.includes(NATIVE) ? NATIVE : SWEEP.find((d) => stop.devices.includes(d));
    if (!at) continue;
    const t0 = Date.now();
    const had = problems.length;
    cost.stops++;
    limits = [];
    try {
      // A file changed on its way to the page from now on: the page must refuse it.
      if (stop.tamper) tampered.add(stop.tamper);
      await open(stop);
      // Another app of the site (ADR 0026 §6): the same browser, so its records are there; the app is opened anew, on
      // the stop's day where it names one.
      if (stop.page !== undefined && stop.page !== at) {
        if (stop.page && !fs.existsSync(path.join(appDir(stop.page), 'page.html'))) throw new Error(`no app "${stop.page}" beside ${root}`);
        await p.goto(hrefOf(stop, stop.page));
        at = stop.page;
        await started();
      }
      if (stop.reload) {
        await p.reload();
        await started();
      }
      if (at !== NATIVE) await sizeTo(at);
      // Back to the day screen (ADR 0021 §4: no hash is the month, the home of a flow with days).
      const hash0 = await p.evaluate(() => location.hash);
      if (hash0 !== '#flow' && !hash0.startsWith('#day/')) {
        await go('#flow');
        await idle();
      }
      // Close any open detail and sheet first, by its close button where that is on screen: a sheet the desktop split
      // has put away (the flow given the whole window) stays as it is, and isn't waited for.
      const close = async (sel) => {
        const b = p.locator(sel).first();
        if ((await b.count()) && (await b.isVisible())) await b.click().catch(() => {});
      };
      if (await p.locator('.vf-detail-wrap').count()) await close('.vf-detail button.close');
      if (await p.locator('#sheet:not([hidden]) button.close').count()) await close('#sheet button.close');
      if (stop.day) {
        // The day by what the month says of it (its label starts "Fri Mar 22"), then the day screen by its link
        // (ADR 0021 §4); the day already on screen and run starts nothing.
        const [wd, date] = stop.day.split(/\s+/);
        const want = new RegExp(`^${WEEKDAY[wd] ?? wd} [A-Z][a-z]{2} ${date}\\b`);
        const iso = await p.evaluate((src) => { const re = new RegExp(src); const m = window.__smaltflMonth ? window.__smaltflMonth() : {}; return Object.keys(m).find((k) => re.test(m[k])) ?? null; }, want.source);
        if (!iso) problems.push(`no day "${stop.day}" in the month (${Object.values(await p.evaluate(() => (window.__smaltflMonth ? window.__smaltflMonth() : {}))).slice(0, 4).join(' | ')})`);
        else {
          // A day's version (ADR 0021 §2): another than the one on screen runs again, whatever day the status names.
          const before = await status();
          const moved = await go(`#day/${iso}${stop.version ? `/v${stop.version}` : ''}`);
          if (moved) await settled(before);
          else await idle();
        }
      }
      // A flow that reads flows is drawn in levels (ADR 0026 §4): a card inside a flow it reads is on that flow's own
      // canvas, so the tour goes there first, by the link the page gives for it. A stop's `in` names the flows to enter
      // itself ("feeds", or "applications/feeds"); "" is the top.
      const toLevelOf = async (card) => {
        const want = await p.evaluate((c) => (window.__smaltflLevelOf ? window.__smaltflLevelOf(c) : null), card);
        if (!want) return;
        await go(want);
        await p.waitForSelector(`g.card[data-card="${card}"]`, { timeout: 20000 }).catch(() => {});
        await idle();
      };
      if (stop.in !== undefined) {
        const base = await p.evaluate(() => location.hash.replace(/\/in\/.*$/, ''));
        await go(`${/^#(day|flow)\b/.test(base) ? base : '#flow'}${stop.in ? `/in/${stop.in}` : ''}`);
        await idle();
      }
      // A notebook is a box on the canvas (ADR 0011 §6): its steps are cards only once it is unfolded.
      for (const box of stop.unfold ?? []) {
        await toLevelOf(box);
        const el = p.locator(`g.card[data-card="${box}"]`);
        if (!(await el.count())) continue;
        await el.first().focus();
        await p.keyboard.press('Enter');
        await p.waitForSelector('#sheet:not([hidden]) .nbc-bar button', { timeout: 20000 });
        const show = p.locator('#sheet .nbc-bar button', { hasText: 'Show its steps' });
        if (await show.count()) await show.first().click();
        await p.locator('#sheet button.close').first().click().catch(() => {});
        await p.waitForSelector('#sheet', { state: 'hidden', timeout: 20000 }).catch(() => {});
      }
      if (stop.box) {
        await toLevelOf(stop.box);
        await p.locator(`g.card[data-card="${stop.box}"]`).first().focus();
        await p.keyboard.press('Enter');
        await p.waitForSelector('#sheet:not([hidden]) .nbc-list', { timeout: 20000 });
      }
      // A flow the level reads (ADR 0026 §3): its card opens its sheet.
      if (stop.flow) {
        await toLevelOf(`flow:${stop.flow}`);
        await p.locator(`g.card[data-card="flow:${stop.flow}"]`).first().focus();
        await p.keyboard.press('Enter');
        await p.waitForSelector('#sheet:not([hidden]) .fl-sheet', { timeout: 20000 });
        await idle();
      }
      // A select on screen now (the viewer) is set now; one in a view not shown yet (the month's as known on) once its
      // view is (viewFirst).
      let selectLater = false;
      if (stop.select) {
        if (await p.locator(stop.select[0]).first().isVisible()) {
          await p.selectOption(stop.select[0], stop.select[1]);
          await idle();
        } else selectLater = true;
      }
      if (stop.card) {
        await toLevelOf(stop.card);
        await p.locator(`g.card[data-card="${stop.card}"]`).focus();
        await p.keyboard.press('Enter');
        await p.waitForSelector('#sheet:not([hidden]) .tab-panel:not([aria-busy])', { timeout: 60000 });
        if (stop.tab) {
          const tab = p.locator('#sheet .tabs button', { hasText: stop.tab });
          if (await tab.count()) {
            await tab.first().click();
            await p.waitForSelector('#sheet .tab-panel:not([aria-busy])', { timeout: 60000 });
          } else problems.push(`${stop.name}: no tab "${stop.tab}" (${(await p.locator('#sheet .tabs button').allTextContents()).join(' | ')})`);
        }
        await idle();
      }
      // A view shown before its taps ("viewFirst": the Runs view's ribbon), else after them.
      if (stop.view && stop.viewFirst) {
        await go(`#${stop.view}`);
        await idle();
      }
      if (selectLater) {
        await p.selectOption(stop.select[0], stop.select[1]);
        await idle();
      }
      // Optionally tap something first (a hero, a fold row): the sheet it opens is what is captured.
      if (stop.click) {
        const target = p.locator(stop.click).first();
        if (await target.count()) {
          await target.click();
          await idle();
        } else problems.push(`${stop.name}: nothing to click at ${stop.click}`);
      }
      // A double-click (a flow's card enters the flow, ADR 0026 §4): a mouse's, so at the sizes with one.
      if (stop.dblclick) {
        const target = p.locator(stop.dblclick).first();
        if (await target.count()) {
          // Sent to the element itself: a card is drawn in the canvas's own coordinates, which the page doesn't scroll to.
          await target.dispatchEvent('dblclick');
          await idle();
        } else problems.push(`${stop.name}: nothing to double-click at ${stop.dblclick}`);
      }
      for (const step of stop.clicks ?? []) {
        const [sel, typed] = Array.isArray(step) ? step : [step];
        const target = p.locator(sel).first();
        if (!(await target.count())) problems.push(`${stop.name}: nothing to ${typed === undefined ? 'click' : 'type into'} at ${sel}`);
        else if (typed !== undefined) {
          if (await target.evaluate((el) => el.tagName === 'SELECT')) await target.selectOption(typed);
          else await target.fill(typed);
          await idle();
        } else {
          const before = await status();
          await target.click();
          await idle();
          if (!HOOKED && ((await status()).split('|')[0] !== before.split('|')[0] || /Running|Fetching/.test(await status()))) await settledByStatus(before);
        }
      }
      // Keys pressed with something focused (the month's calendar: the arrow keys move through its days).
      if (stop.press) {
        const [sel, ...keys] = stop.press;
        const target = p.locator(sel).first();
        if (!(await target.count())) problems.push(`${stop.name}: nothing to focus at ${sel}`);
        else {
          await target.focus();
          for (const key of keys) {
            await p.keyboard.press(key);
            await idle();
          }
        }
      }
      // A file chosen in a file input (Replace the file), relative to the stops file: the run it starts is waited for.
      if (stop.upload) {
        const [sel, file] = stop.upload;
        const target = p.locator(sel).first();
        if (!(await target.count())) problems.push(`${stop.name}: nothing to choose a file in at ${sel}`);
        else {
          const before = await status();
          await target.setInputFiles(path.resolve(path.dirname(stopsFile), file));
          await idle();
          if (!HOOKED) await settledByStatus(before);
        }
      }
      if (stop.view && !stop.viewFirst) {
        await go(`#${stop.view}`);
        await idle();
      }
      if (stop.waitFor) {
        await p.waitForSelector(stop.waitFor, { state: 'visible', timeout: stop.waitForMs ?? 30000 }).catch(() => problems.push(`${stop.name}: ${stop.waitFor} never showed`));
        await idle();
      }
      let saved = null;
      if (stop.download) {
        const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), p.locator(stop.download).first().click()]);
        const to = path.join(out, dl.suggestedFilename());
        await dl.saveAs(to);
        saved = { name: dl.suggestedFilename(), path: to, bytes: fs.statSync(to).size };
        console.log(`${stop.name}: saved ${to} (${saved.bytes} bytes)`);
      }
      const kept = {};
      let { m, scope } = await measure(stop);
      let fails = await expected(stop, m, scope, saved, kept);
      // Read a moment too early? Once more, after the page has been still as long as every stop used to wait: only
      // what stays wrong is a problem.
      if (fails.length) {
        await idle(SOFT, HARD, 250);
        ({ m, scope } = await measure(stop));
        fails = await expected(stop, m, scope, saved, kept);
      }
      for (const why of fails) problems.push(`${stop.name}: ${why}`);
      for (const s of await sideways()) problems.push(`${stop.name}${at === NATIVE ? '' : ` at ${at}`}: ${s}`);
      if (SHOTS === 'all' || (SHOTS === 'fail' && problems.length > had)) m.screenshot = await capture(stop, m);
      // The same page at the other sizes it is held to: its layout at each, nothing run again (ADR 0025 §3).
      const others = SWEEP.filter((d) => d !== at && (!stop.devices || stop.devices.includes(d)));
      for (const d of others) {
        await sizeTo(d);
        for (const s of await sideways()) problems.push(`${stop.name} at ${d}: ${s}`);
      }
      if (others.length || at !== NATIVE) await sizeTo(NATIVE);
      metrics.push(m);
      // A wait that a limit ended: the page never came to rest, which is a fault in it or in the stop.
      if (HOOKED) for (const what of new Set(limits)) problems.push(`${stop.name}: the page wasn't at rest after ${what === 'the app at work' ? HARD / 1000 : SOFT / 1000} s (${what})`);
      const run = Number((await status()).split('|')[0] || 0);
      cost.runs += Math.max(0, run - runsSeen);
      runsSeen = run;
      console.log(`${stop.name} (${((Date.now() - t0) / 1000).toFixed(1)} s): ${m.words} words, ${m.charts} charts, ${m.longParagraphs.length} long paragraphs, ${m.wordsBeforeFirstChart ?? '-'} words before the first chart; state ${m.state}; title "${m.title}"${limits.length ? `; ${limits.length} wait${limits.length === 1 ? '' : 's'} ended at the limit (${[...new Set(limits)].join('; ')})` : ''}`);
    } catch (e) {
      problems.push(`${stop.name}: ${e.message.split('\n')[0]}`);
      console.log(`${stop.name}: FAILED ${e.message.split('\n')[0]}`);
      // The window back at its own size, whatever size the stop failed at.
      if (p) await p.setViewportSize({ width: W, height: H }).catch(() => {});
      if (dead) break;
    }
  }
  fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify({ metrics, problems }, null, 1));
  console.log(`problems: ${problems.length ? problems.join(' // ') : 'none'}`);
  console.log(`cost: ${JSON.stringify({ ...cost, seconds: Math.round((Date.now() - began) / 100) / 10 })}`);
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
