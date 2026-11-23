const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const [root, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) return res.writeHead(404).end(); res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f)); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://127.0.0.1:${server.address().port}/`;
  const b = await chromium.launch();
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['tablet-wide', { width: 1180, height: 820 }], ['tablet', { width: 820, height: 1180 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    await p.goto(base + '#d-access-reviews'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForTimeout(600);
    await p.locator('[data-decide]').first().click(); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const vh = innerHeight, q = (sel) => document.querySelector(sel), inView = (el) => { if (!el) return 'missing'; const b = el.getBoundingClientRect(); return b.top >= 0 && b.bottom <= vh && b.width > 0 ? 'in view' : `out (${Math.round(b.top)}–${Math.round(b.bottom)} of ${vh})`; };
      const primary = q('.panel .dk-foot .btn.primary, .panel button[data-confirm]'), hero = q('.panel .dk-hero') || q('.panel .opt.tile.sug');
      return `recommended: ${inView(hero)} · button: ${inView(primary)}`; }); // r38: what must show at once
    console.log(name.padEnd(12), r);
    await p.screenshot({ path: path.join(out, `fit-${name}.png`) }); await ctx.close();
  }
  await b.close(); server.close();
})();
