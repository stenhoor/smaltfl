// Render an HTML file to a PNG with the pre-installed Chromium.
//   node render.cjs IN.html OUT.png [WIDTH] [HEIGHT] [--full] [--clip CSS_SELECTOR] [--scale 1|2]
// Defaults: 1440 x 900, viewport only. Phone: 390 844. Tablet: 820 1180. Fonts and scroll positions settle first.
const { chromium } = require('playwright'); const path = require('node:path');
(async () => {
  const a = process.argv.slice(2); const flag = (k) => { const i = a.indexOf(k); if (i < 0) return null; const v = a[i + 1]; a.splice(i, 2); return v; };
  const full = a.includes('--full'); if (full) a.splice(a.indexOf('--full'), 1);
  const clip = flag('--clip'); const scale = Number(flag('--scale') || 1);
  const [inp, out, W = '1440', H = '900'] = a;
  if (!inp || !out) { console.error('usage: render.cjs IN.html OUT.png [W] [H] [--full] [--clip SEL] [--scale N]'); process.exit(2); }
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(inp), { waitUntil: 'load' }); await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(300);
  if (clip) await p.locator(clip).first().screenshot({ path: out }); else await p.screenshot({ path: out, fullPage: full });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  // Visible words: of the clipped element, else of what shows in the viewport (elements on screen, not hidden).
  const words = await p.evaluate((clip) => {
    const count = (t) => (t.match(/[A-Za-z0-9][A-Za-z0-9'’.,:%×·-]*/g) || []).length;
    if (clip) { const e = document.querySelector(clip); return e ? count(e.innerText) : 0; }
    let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; const el = t.parentElement; if (!el || !t.textContent.trim()) continue;
      const fold = el.closest('details:not([open])'); if (fold && !el.closest('summary')) continue; // text in a closed fold isn't seen
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
      const r = document.createRange(); r.selectNodeContents(t); const bb = r.getBoundingClientRect(); if (!bb.width || bb.bottom < 0 || bb.top > innerHeight || bb.right < 0 || bb.left > innerWidth) continue;
      n += count(t.textContent); }
    return n;
  }, clip);
  console.log(out, W + 'x' + H, 'visible words: ' + words, sw ? 'WARNING: scrolls sideways' : 'no sideways scroll', errs.length ? 'errors: ' + errs.join(' | ') : '');
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
