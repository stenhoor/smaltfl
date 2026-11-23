// Video 3: exploring the data — the estate, a kind, a file's columns and values, its rows, and Ctrl K to find anything.
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out] = process.argv.slice(2);
  const v = await session(root, { name: '3-explore' }); const { p, wait, say, ring, unring, tap, glide, title } = v;
  await p.goto(v.base + '#estate'); await p.waitForSelector('body[data-ready="1"]'); await p.mouse.move(700, 860); await wait(1200);
  await title('Explore the data', 'What each kind holds · how kinds connect · what is inside a file');
  await say('The estate: each box is a kind of thing; each line, how two kinds relate.', 1); await ring('#canvas', -60); await wait(2800); await unring();
  await say('Point at a kind: its relations light up, read as sentences.', 2); await glide('[data-id="k:application"]'); await wait(2600);
  await glide('[data-id="k:org_unit"]'); await wait(2400); await glide('[data-id="k:control"]'); await wait(2200);
  await say('Open a kind: its files, with the kinds it relates to at its sides.', 3); await tap('[data-id="k:application"]', { hold: 600 }); await wait(2600);
  await say('Open a file: TLS on exposed endpoints.', 4); await tap('[data-id="d:tls"]', { hold: 700 }); await wait(2400);
  await tap('.node.focus [data-cols]', { hold: 500 }); await p.waitForFunction(() => document.querySelector('li.col[data-col="status"]') && !document.querySelector('#links.off')); // peer:builder: the file's columns are one tap away now; on once the canvas has settled
  await say('Each column with what it means; what one row is; what it is built into.', 5); await ring('.node.focus', 4); await wait(3000); await unring();
  await say('Used by 11 outputs; 10 are held today, by Access reviews, not by TLS.', 5); await ring('.node.outs header').catch(() => {}); await wait(3200); await unring();
  await say('Tap a column for its values: TLS status, pass or fail.', 6); await tap('li.col[data-col="status"]', { hold: 600 }); await wait(3000);
  await say('Its rows, as they arrived today, opened on the column you tapped.', 7); await tap('[data-rows]', { hold: 600 }); await wait(3400);
  await p.keyboard.press('Escape'); await wait(900);
  await say('Ctrl K finds any file, column or value, and answers questions.', 8); await p.keyboard.press('Control+k'); await wait(900);
  for (const ch of 'mfa') { await p.keyboard.type(ch); await wait(160); } await wait(1600); await p.keyboard.press('Enter'); await wait(2800);
  await say('Back to the whole estate in one step.', 9); await tap('.trail button[data-to="estate"]', { hold: 500 }).catch(async () => { await p.keyboard.press('Escape'); }); await wait(2200);
  await title('Explore', 'Kinds and how they relate · a file’s columns, values and rows · Ctrl K for anything');
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
