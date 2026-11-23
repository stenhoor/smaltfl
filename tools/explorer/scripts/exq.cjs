// Quick looks while iterating: node exq.cjs ROOT OUT what[,what…] (estate, decide, decide-fill, big, palette, phone, replace, dataset)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const [root, out, which = 'estate,decide'] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) return res.writeHead(404).end(); res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f)); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://127.0.0.1:${server.address().port}/`;
  const b = await chromium.launch(); const errs = [];
  const dpr = +(process.env.DPR || 1), dark = process.env.DARK === '1';
  const ctx = await b.newContext({ viewport: { width: +(process.env.W || 1440), height: +(process.env.H || 900) }, deviceScaleFactor: dpr, colorScheme: dark ? 'dark' : 'light' });
  const open = async (h, c = ctx) => { const p = await c.newPage(); p.on('pageerror', (e) => errs.push(h + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(h + ': console ' + m.text()); }); await p.goto(base + '#' + h); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(700); return p; };
  const shot = (p, n, clip) => p.screenshot({ path: path.join(out, n + '.png'), clip }).then(() => console.log('shot', n));
  for (const w of which.split(',')) {
    let p;
    if (w === 'estate') { p = await open('estate'); await shot(p, 'estate'); }
    if (w === 'dataset') { p = await open('d-access-reviews'); await shot(p, 'dataset'); }
    if (w.startsWith('decide')) { p = await open('d-access-reviews'); await p.locator('[data-decide]').first().click(); await p.waitForTimeout(3200); const k = w.split('-')[1]; if (k) { await p.locator(`label.opt.tile[data-k="${k}"]`).click(); await p.waitForTimeout(1600); } await shot(p, w, await p.locator('.panel').boundingBox()); }
    if (w === 'replace') { p = await open('d-access-reviews'); await p.locator('[data-decide]').first().click(); await p.waitForTimeout(1500); if (await p.locator('.panel [data-userec]:visible').count()) { await p.locator('.panel [data-userec]').click(); await p.waitForTimeout(300); } await p.keyboard.press('Enter'); await p.waitForTimeout(900); await p.locator('[data-replace]').first().click(); await p.waitForTimeout(900); await p.locator('[data-sample]').click(); await p.waitForTimeout(200); await p.locator('[data-send]').click(); await p.waitForTimeout(500); await shot(p, 'replace', await p.locator('.panel').boundingBox()); await p.locator('[data-later]').click(); await p.waitForTimeout(400); await p.goto(base + '#estate'); await p.waitForTimeout(900); await shot(p, 'replace-later'); }
    if (w === 'big') { p = await open('estate-big'); await p.locator('[data-id="k:application"]').hover(); await p.waitForTimeout(1300); await shot(p, 'big-application'); await p.locator('[data-id="k:entitlement"]').hover(); await p.waitForTimeout(1300); await shot(p, 'big-entitlement'); }
    if (w === 'palette') { p = await open('estate'); await p.keyboard.press('Control+k'); await p.waitForTimeout(400); await shot(p, 'palette'); }
    if (w === 'phone') { const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light' }); p = await open('estate', ph); await shot(p, 'phone'); }
    if (p) await p.close();
  }
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors');
  await b.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
