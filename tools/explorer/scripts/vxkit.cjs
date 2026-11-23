// The video kit: a server, a recorded page with captions, a pointer, a spotlight with sparkles; then an MP4.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const OVERLAY = `addEventListener('DOMContentLoaded', () => {
  const st = document.createElement('style'); st.textContent = \`
  .vx-cur{position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(0,51,153,.22);border:2px solid #003399;z-index:2147483646;pointer-events:none;transition:transform .12s}
  .vx-rip{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #003399;z-index:2147483646;pointer-events:none;animation:vxrip .6s ease-out forwards}
  @keyframes vxrip{to{transform:scale(4);opacity:0}}
  .vx-cap{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);width:max-content;max-width:min(940px,86vw);z-index:2147483646;pointer-events:none;background:rgba(15,19,26,.93);color:#fff;border-radius:12px;padding:12px 18px;font:500 18px/1.38 Geist,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:0;transition:opacity .25s}
  .vx-cap b{display:inline-grid;place-items:center;min-width:26px;height:26px;margin-right:10px;border-radius:50%;background:#ffb800;color:#151922;font-weight:700;font-size:14px;vertical-align:1px}
  .vx-ring{position:fixed;z-index:2147483645;pointer-events:none;border-radius:12px;box-shadow:0 0 0 3px #ffb800,0 0 0 9999px rgba(10,14,22,.22),0 0 26px 8px rgba(255,184,0,.6);animation:vxpulse 1.1s ease-in-out infinite;transition:left .35s,top .35s,width .35s,height .35s,opacity .25s;opacity:0}
  @keyframes vxpulse{50%{box-shadow:0 0 0 5px #ffb800,0 0 0 9999px rgba(10,14,22,.22),0 0 36px 12px rgba(255,184,0,.78)}}
  .vx-sp{position:fixed;z-index:2147483646;pointer-events:none;color:#ffcf3f;font-size:20px;line-height:1;text-shadow:0 0 10px rgba(255,200,0,.95);animation:vxsp 1.1s ease-out forwards}
  @keyframes vxsp{0%{transform:translate(0,0) scale(.2) rotate(0);opacity:0}25%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1) rotate(120deg);opacity:0}}
  .vx-title{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;gap:12px;background:rgba(15,19,26,.94);color:#fff;font:700 38px/1.2 Geist,system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .45s;pointer-events:none;padding:40px}
  .vx-title small{display:block;font:500 20px/1.4 Geist,system-ui,sans-serif;color:#c8d3ff;max-width:900px}
  .vx-title i{font-style:normal;color:#ffcf3f}\`;
  document.head.append(st);
  const cur = document.createElement('div'); cur.className = 'vx-cur'; document.body.append(cur);
  addEventListener('mousemove', (e) => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }, true);
  addEventListener('mousedown', () => (cur.style.transform = 'scale(.7)'), true); addEventListener('mouseup', () => (cur.style.transform = ''), true);
  const cap = document.createElement('div'); cap.className = 'vx-cap'; document.body.append(cap);
  const ring = document.createElement('div'); ring.className = 'vx-ring'; document.body.append(ring);
  const tt = document.createElement('div'); tt.className = 'vx-title'; document.body.append(tt);
  window.__vx = {
    cap(t, n) { if (!t) { cap.style.opacity = 0; return; } cap.innerHTML = (n ? '<b>' + n + '</b>' : '') + t; cap.style.opacity = 1; },
    ring(bb, pad) { pad = pad == null ? 6 : pad; ring.style.left = (bb.x - pad) + 'px'; ring.style.top = (bb.y - pad) + 'px'; ring.style.width = (bb.width + 2 * pad) + 'px'; ring.style.height = (bb.height + 2 * pad) + 'px'; ring.style.opacity = 1;
      for (let i = 0; i < 12; i++) { const s = document.createElement('div'); s.className = 'vx-sp'; s.textContent = i % 3 ? '✦' : '✧'; const side = i % 4, f = Math.random(); const x = side === 0 ? bb.x + f * bb.width : side === 1 ? bb.x + bb.width + pad : side === 2 ? bb.x + f * bb.width : bb.x - pad, y = side === 0 ? bb.y - pad : side === 1 ? bb.y + f * bb.height : side === 2 ? bb.y + bb.height + pad : bb.y + f * bb.height; s.style.left = (x - 10) + 'px'; s.style.top = (y - 10) + 'px'; s.style.setProperty('--dx', ((side === 1 ? 1 : side === 3 ? -1 : (Math.random() - .5)) * 26) + 'px'); s.style.setProperty('--dy', ((side === 2 ? 1 : side === 0 ? -1 : (Math.random() - .5)) * 26) + 'px'); s.style.animationDelay = (i * 45) + 'ms'; document.body.append(s); setTimeout(() => s.remove(), 1700); } },
    unring() { ring.style.opacity = 0; },
    ripple(x, y) { const r = document.createElement('div'); r.className = 'vx-rip'; r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.append(r); setTimeout(() => r.remove(), 700); },
    title(t, s) { tt.innerHTML = t + (s ? '<small>' + s + '</small>' : ''); tt.style.opacity = 1; },
    untitle() { tt.style.opacity = 0; },
  };
});`;
async function session(root, { seed, w = 1440, h = 900, name }) {
  const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript; charset=utf-8' };
  const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) return res.writeHead(404).end(); res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f)); });
  await new Promise((r) => server.listen(0, r)); const base = `http://127.0.0.1:${server.address().port}/`;
  const b = await chromium.launch(); const vdir = path.join('/tmp', 'vx-' + name); fs.rmSync(vdir, { recursive: true, force: true }); fs.mkdirSync(vdir, { recursive: true });
  const SNAP = process.env.VX_SNAP, NOVID = process.env.VX_NOVIDEO === '1'; let snapN = 0;
  const ctx = await b.newContext(NOVID ? { viewport: { width: w, height: h } } : { viewport: { width: w, height: h }, recordVideo: { dir: vdir, size: { width: w, height: h } } });
  if (seed) await ctx.addInitScript((s) => { try { if (!sessionStorage.getItem('vx-seeded')) { localStorage.setItem('smaltfl-build-v4', s); sessionStorage.setItem('vx-seeded', '1'); } } catch (e) { /* storage off */ } }, fs.readFileSync(seed, 'utf8'));
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const wait = (ms) => p.waitForTimeout(ms);
  const loc = (sel) => p.locator(sel).first();
  const box = async (sel) => { const l = loc(sel); await l.scrollIntoViewIfNeeded(); await wait(220); return l.boundingBox(); };
  // Snapshot mode (VX_SNAP=dir): each caption saves the page as static, editable HTML (scripts and overlay removed, form
  // state and scroll kept) and a screenshot without the overlay, so a reviewer can redesign the real markup.
  const snap = async (t) => {
    const dir = path.join(SNAP, name); fs.mkdirSync(dir, { recursive: true }); const n = String(++snapN).padStart(2, '0');
    const html = await p.evaluate(() => {
      document.querySelectorAll('input').forEach((i) => { if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked) i.setAttribute('checked', ''); else i.removeAttribute('checked'); } else i.setAttribute('value', i.value); });
      document.querySelectorAll('textarea').forEach((t) => { t.textContent = t.value; });
      document.querySelectorAll('select').forEach((s) => [...s.options].forEach((o) => (o.selected ? o.setAttribute('selected', '') : o.removeAttribute('selected'))));
      document.querySelectorAll('[data-snap-scroll]').forEach((e) => e.removeAttribute('data-snap-scroll'));
      document.querySelectorAll('body *').forEach((e) => { if (e.scrollTop > 0 || e.scrollLeft > 0) e.setAttribute('data-snap-scroll', e.scrollTop + ',' + e.scrollLeft); });
      const c = document.documentElement.cloneNode(true);
      c.querySelectorAll('script, .vx-cur, .vx-cap, .vx-ring, .vx-title, .vx-sp, .vx-rip').forEach((e) => e.remove());
      c.querySelectorAll('style').forEach((s) => { if (s.textContent.includes('.vx-cur')) s.remove(); });
      const r = document.createElement('script');
      r.textContent = "addEventListener('load',()=>{document.querySelectorAll('[data-snap-scroll]').forEach(e=>{const v=e.getAttribute('data-snap-scroll').split(',');e.scrollTop=+v[0];e.scrollLeft=+v[1];});scrollTo(" + scrollX + ',' + scrollY + ');});';
      c.querySelector('body').append(r);
      return '<!doctype html>\n' + c.outerHTML;
    });
    fs.writeFileSync(path.join(dir, n + '.html'), html);
    const hide = (v) => p.evaluate((v) => document.querySelectorAll('.vx-cur,.vx-cap,.vx-ring,.vx-sp,.vx-rip,.vx-title').forEach((e) => (e.style.visibility = v)), v);
    await p.waitForTimeout(450); await hide('hidden'); await p.screenshot({ path: path.join(dir, n + '.png') }); await hide('');
    fs.appendFileSync(path.join(dir, 'captions.tsv'), n + '\t' + String(t).replace(/<[^>]+>/g, '') + '\n');
  };
  const say = async (t, n) => { await p.evaluate(([t, n]) => window.__vx.cap(t, n), [t, n ?? '']); if (SNAP && t) await snap(t); };
  const ring = async (sel, pad) => { const bb = await box(sel); if (bb) await p.evaluate(([bb, pad]) => window.__vx.ring(bb, pad), [bb, pad ?? 6]); return bb; };
  const unring = () => p.evaluate(() => window.__vx.unring());
  const glide = async (sel, dx) => { const bb = await box(sel); const x = bb.x + (dx ?? Math.min(bb.width / 2, 140)), y = bb.y + Math.min(bb.height / 2, 22); await p.mouse.move(x, y, { steps: 22 }); return { x, y }; };
  const tap = async (sel, o = {}) => { if (o.ring !== false) { await ring(sel, o.pad); await wait(o.hold ?? 900); } const q = await glide(sel, o.dx); await wait(160); await p.evaluate(([x, y]) => window.__vx.ripple(x, y), [q.x, q.y]); await p.mouse.down(); await wait(70); await p.mouse.up(); await unring(); await wait(o.after ?? 700); };
  const typeIn = async (sel, text, o = {}) => { await tap(sel, o); await p.keyboard.press('Control+a'); for (const ch of text) { await p.keyboard.type(ch); await wait(55); } await wait(400); };
  const pick = async (sel, value, o = {}) => { await ring(sel); await wait(o.hold ?? 600); await glide(sel); await wait(150); await p.selectOption(sel, value); await unring(); await wait(o.after ?? 700); };
  const title = async (t, s, ms = 2600) => { await p.evaluate(([t, s]) => window.__vx.title(t, s), [t, s]); await wait(ms); await p.evaluate(() => window.__vx.untitle()); await wait(500); };
  const finish = async (outDir) => { await say(''); await wait(300); if (NOVID) { await ctx.close(); await b.close(); server.close(); return { mp4: '(no video)', mb: 0, errs }; } const v = p.video(); await ctx.close(); const src = await v.path(); fs.mkdirSync(outDir, { recursive: true }); const mp4 = path.join(outDir, name + '.mp4'), poster = path.join(outDir, name + '.jpg');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '6', '-i', mp4, '-frames:v', '1', '-q:v', '4', poster]);
    await b.close(); server.close(); return { mp4, mb: (fs.statSync(mp4).size / 1e6).toFixed(1), errs }; };
  return { p, base, wait, loc, box, say, ring, unring, glide, tap, typeIn, pick, title, finish, errs };
}
module.exports = { session };
