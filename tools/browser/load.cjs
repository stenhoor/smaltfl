#!/usr/bin/env node
// How long the built app takes to show its first day, phase by phase (ADR 0019): opens the app N times in a fresh
// browser context (nothing cached), waits for the mark `first day shown`, and prints each mark's median time since the
// page started, with the engine's requests summed by kind. Copy the built app out of dist/ first, as for tour.cjs.
//
//   node tools/browser/load.cjs APP [runs=5]      TOUR_DEVICE=phone|desktop (default desktop)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const [root, runsArg] = process.argv.slice(2);
if (!root) {
  console.error('usage: node tools/browser/load.cjs <appDir> [runs]');
  process.exit(2);
}
const runs = Number(runsArg ?? 5);
const page = fs.readFileSync(path.join(root, 'page.html'), 'utf8');
const skeleton = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>${page}</body></html>`;
const types = { '.js': 'text/javascript', '.txt': 'text/plain', '.csv': 'text/csv', '.json': 'application/json' };
let bytes = 0;
let gz = 0;
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') return res.writeHead(200, { 'content-type': 'text/html' }).end(skeleton);
  const file = path.join(root, url);
  if (!file.startsWith(path.resolve(root)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  const body = fs.readFileSync(file);
  bytes += body.length;
  gz += zlib.gzipSync(body).length;
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
});
const DEVICES = {
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
};
const device = DEVICES[process.env.TOUR_DEVICE || 'desktop'];
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const all = [];
  const engine = [];
  let fetched = 0;
  let fetchedGz = 0;
  for (let i = 0; i < runs; i++) {
    bytes = 0;
    gz = 0;
    const ctx = await browser.newContext({ viewport: { width: device.width, height: device.height }, isMobile: device.isMobile, hasTouch: device.hasTouch });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(url);
    await p.waitForFunction(() => (window.__smaltflPerf ?? []).some(([l]) => l === 'first day shown') || /couldn’t|couldn't/.test(document.body.innerText.slice(0, 2000)), null, { timeout: 120000 });
    const marks = await p.evaluate(() => window.__smaltflPerf ?? []);
    if (!marks.some(([l]) => l === 'first day shown')) throw new Error(`the first day was never shown: ${errors.join('; ') || 'see the page'}`);
    all.push(marks);
    engine.push(await p.evaluate(() => window.__smaltflEngine ?? []));
    fetched = bytes;
    fetchedGz = gz;
    await ctx.close();
  }
  await browser.close();
  server.close();
  // Marks by label, in the order of the first run; a label seen more than once in a run keeps its last.
  const labels = [...new Set(all[0].map(([l]) => l))];
  let prev = 0;
  console.log(`${runs} loads at ${process.env.TOUR_DEVICE || 'desktop'} size, median ms since the page started:`);
  for (const l of labels) {
    const t = median(all.map((m) => [...m].reverse().find(([x]) => x === l)?.[1] ?? NaN));
    console.log(`${String(t).padStart(7)}  +${String(t - prev).padEnd(6)} ${l}`);
    prev = t;
  }
  const kinds = new Map();
  for (const e of engine[Math.floor(engine.length / 2)] ?? []) {
    const k = e[0].replace(/^(query|exec) .*/, '$1 …').replace(/^(call \S+).*/, '$1');
    const ms = e[2] - e[1];
    const was = kinds.get(k) ?? [0, 0];
    kinds.set(k, [was[0] + 1, was[1] + ms]);
  }
  if (kinds.size) {
    console.log('engine requests (one load):');
    for (const [k, [n, ms]] of [...kinds].sort((a, b) => b[1][1] - a[1][1])) console.log(`${String(Math.round(ms)).padStart(7)} ms  ${n}× ${k}`);
  }
  console.log(`fetched ${(fetched / 1e6).toFixed(2)} MB (${(fetchedGz / 1e6).toFixed(2)} MB gzipped) before the first day was shown`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
