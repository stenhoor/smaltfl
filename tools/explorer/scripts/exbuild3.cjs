// The from-nothing journey, walked and photographed by pressing the one main button each screen offers:
// node exbuild3.cjs ROOT OUT   (env W, H, DPR, MOB, DARK)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const [root, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const W = +(process.env.W || 1440), H = +(process.env.H || 900), DPR = +(process.env.DPR || 1), MOB = process.env.MOB === '1', DARK = process.env.DARK === '1';
const types = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u); if (!fs.existsSync(f)) return res.writeHead(404).end(); res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f)); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://127.0.0.1:${server.address().port}/`;
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: MOB, hasTouch: MOB, colorScheme: DARK ? 'dark' : 'light' });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  let n = 0; const shot = async (name, sel) => { n++; await p.waitForTimeout(700); const clip = sel ? await p.locator(sel).first().boundingBox() : null; await p.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}.png`), clip: clip || undefined }); console.log('shot', n, name); };
  // the whole panel, its scrolled part included, under the same number as the shot before it
  const panel = async (name) => {
    const need = await p.evaluate(() => { const P = document.querySelector('#buildpanel'), bd = P.querySelector('.bp-body'); return P.offsetHeight + bd.scrollHeight - bd.clientHeight; });
    if (need <= H + 8) return;
    await p.setViewportSize({ width: W, height: Math.min(need + 80, 5000) }); await p.waitForTimeout(600);
    const clip = await p.locator('#buildpanel').boundingBox();
    await p.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}-panel.png`), clip });
    await p.setViewportSize({ width: W, height: H }); await p.waitForTimeout(500); console.log('panel', n, name);
  };
  const click = async (sel) => { await p.locator(sel).first().click(); await p.waitForTimeout(300); };
  const main = '#buildpanel .bp-foot .btn.primary, #buildpanel .bp-foot .btn.eq:last-child';
  const actOf = () => p.locator(main).first().getAttribute('data-act');
  const dayNow = () => p.evaluate(() => { const B = window.__build.state(); return B.day >= 0 ? window.__build.data().days[B.day].day : null; });
  await p.goto(base + '#build-new'); await p.waitForSelector('body[data-ready="1"]'); await p.waitForSelector('#buildpanel'); await p.waitForTimeout(800);
  await shot('empty');
  await click(main); await shot('read-cmdb'); await panel('read-cmdb');
  await click(main); await shot('added-cmdb');
  await click(main); await shot('read-org');
  await click(main); await shot('added-org');
  if (MOB) { await click('#buildpanel .ks-open'); await p.waitForTimeout(900); await shot('map-open'); await click('#buildpanel .ks-open'); }
  await click(main); await shot('read-people');
  await click(main);
  for (let i = 0; i < 5; i++) {
    await click(main);
    if (i === 4) {
      await shot('read-exceptions'); await panel('read-exceptions');
      await p.locator('#buildpanel input[data-kindpick][value="own"]').check(); await p.waitForTimeout(900); await shot('exceptions-own-kind');
      await p.locator('#buildpanel input[data-kindpick][value="control"]').check(); await p.waitForTimeout(900); await shot('exceptions-back-to-larkspur');
    }
    await click(main);
  }
  await shot('before-feeds');
  await click(main); await shot('feeds'); await panel('feeds');
  await click('#buildpanel .ff-go'); await p.waitForTimeout(600); await shot('read-feed'); await click('#buildpanel .bp-foot [data-act="feeds"]'); await p.waitForTimeout(400);
  await click(main); await shot('added-feeds');
  await click(main); await click(main);
  await click(main); await shot('read-cloud'); await panel('read-cloud');
  await p.locator('#buildpanel input[data-kindpick][value="platform"]').check(); await p.waitForTimeout(600); await shot('cloud-picked'); await click(main);
  await shot('all-files'); await panel('all-files');
  if (process.env.MINE) { const row = p.locator('#buildpanel details.ag-row:has([data-k="exceptions.approver_id"])'); if (await row.count() && !(await row.first().evaluate((d) => d.open))) { await row.first().locator('summary').first().click(); await p.waitForTimeout(300); } await p.locator('#buildpanel [data-act="gapmode"][data-k="exceptions.approver_id"][data-m="pause"]').click(); await p.waitForTimeout(600); await panel('mine-set'); }
  if ((await actOf()) === 'known') { await click(main); await p.waitForTimeout(500); await shot('gaps-known'); await panel('gaps-known'); }
  await click(main); await shot('history');
  await click(main); await shot('rules'); await panel('rules');
  await click('#buildpanel .ck-more > summary'); await shot('rules-each-file'); await panel('rules-each-file'); await click('#buildpanel .ck-more > summary');
  await click(main); await shot('product'); await panel('product');
  await click(main); await shot('days-start'); await panel('days-start');
  await click(main); await shot('day-feb1'); await panel('day-feb1');
  const SHOOT = new Set(['2024-02-16', '2024-02-20', '2024-02-24', '2024-02-26', '2024-02-27', '2024-03-05', '2024-03-06', '2024-03-08', '2024-03-11', '2024-03-13', '2024-03-18', '2024-03-21', '2024-03-22', '2024-03-23', '2024-03-24', '2024-03-25', '2024-03-27']);
  let peeked = false;
  for (let guard = 0; guard < 80; guard++) {
    const day = await dayNow(), a = await actOf();
    if (SHOOT.has(day)) { await shot('day-' + day); await panel('day-' + day); SHOOT.delete(day); }
    if (!peeked && day === '2024-03-08') { await click('#buildpanel .bd-g .c.dec >> visible=true'); await shot('peek-past-day'); await click('#buildpanel [data-act="peek-off"]'); peeked = true; continue; }
    if (a === 'decide') {
      await click(main); await p.waitForSelector('.panel .opts'); await p.waitForTimeout(1400);
      if (day === '2024-03-27') { await shot(`decide-${day}`, '.panel'); await p.keyboard.press('Escape'); await p.waitForTimeout(500); await click('#buildpanel .bp-foot [data-act="end"]'); break; }
      if (day === '2024-02-16') await shot(`decide-open-${day}`, '.panel');
      // nothing is chosen for you: pick what Larkspur's owners chose, then confirm
      await p.locator('.panel .opt.tile.sug').first().click(); await p.waitForTimeout(700);
      if (await p.locator('.panel [data-userec]:visible').count()) { await p.locator('.panel [data-userec]').click(); await p.waitForTimeout(400); }
      await shot(`decide-${day}`, '.panel');
      if (await p.locator('.panel .dfoot .btn.primary[disabled], .panel button[data-confirm][disabled]').count()) { await p.locator('#dec-note').fill('One new approver; HR to confirm who it is'); await p.waitForTimeout(300); }
      const promised = await p.evaluate(() => /[A-Z][a-z]+ [A-Z][a-z]+’s reason, agreed/.test(document.querySelector('.panel .onrec')?.textContent || ''));
      const before = await p.evaluate(() => JSON.stringify(window.__build.state().dec));
      await p.keyboard.press('Enter'); await p.waitForTimeout(1300); await shot(`decided-${day}`);
      const got = await p.evaluate((b) => { const was = JSON.parse(b), now = window.__build.state().dec; for (const [H, l] of Object.entries(now)) if (l.length > (was[H] || []).length) return !!l[l.length - 1].agreed; return null; }, before);
      console.log(promised === got ? `record ok ${day}: ${got ? 'agreeing' : 'own'}` : `RECORD MISMATCH ${day}: panel ${promised} record ${got}`);
      continue;
    }
    if (a === 'publish') { await click(main); await p.waitForTimeout(1200); await shot('published-' + day); continue; }
    if (a === 'apply') { if (await p.locator('#buildpanel input[data-chpick][value="apply"]').count()) { await p.locator('#buildpanel label.chcard:has(input[data-chpick][value="apply"])').click(); await p.waitForTimeout(400); } if (await p.locator('#buildpanel input[data-chagree]').count()) { await p.locator('#buildpanel input[data-chagree]').check(); await p.waitForTimeout(500); await panel('agree-' + day); } await click(main); await p.waitForTimeout(900); await shot('applied-' + day); continue; }
    if (a === 'end') { await click(main); break; }
    await click(main); await p.waitForTimeout(400);
  }
  await shot('end'); await panel('end');
  if (await p.locator('#buildpanel [data-to="record"]').count()) { await click('#buildpanel [data-to="record"]'); await p.waitForTimeout(500); await shot('record'); await panel('record'); }
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors');
  await b.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
