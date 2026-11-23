// Video 5: a problem shows up today. The estate map says what is paused and what waits; Ctrl K says why and what a file
// peer:owner (r3): a copy of scripts/v5_today.cjs. Decide opens on its hero (now → after, the one button), not on the choices, which wait behind More. Same 12 steps.
// is; the paused file's own view; Decide. The screens the owner reviews first, walked as one problem.
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out] = process.argv.slice(2);
  const v = await session(root, { name: '5-today' }); const { p, wait, say, ring, unring, tap, glide, title } = v;
  const soft = (sel, ms = 4000) => p.waitForSelector(sel, { timeout: ms }).then(() => true).catch(() => false);
  await p.goto(v.base + '#estate'); await p.waitForSelector('body[data-ready="1"]'); await p.mouse.move(700, 860); await wait(1200);
  await title('A problem shows up today', 'See it on the map · ask why · open the file · decide');
  await say('This morning one file paused. The banner says which, and what waits on it.', 1); if (await soft('.alert')) await ring('.alert'); await wait(2600); await unring();
  await say('On the map, each kind shows what of it waits.', 2); if (await soft('.kwait', 2500)) { await ring('.kwait'); await wait(2400); await unring(); }
  await say('Point at a kind: how it relates to the others.', 3); await glide('[data-id="k:org_unit"]'); await wait(2400);
  await say('Ask why it paused.', 4); await p.keyboard.press('Control+k'); await wait(700);
  for (const ch of 'why is wednesday paused') { await p.keyboard.type(ch); await wait(45); } await wait(1800);
  await say('The answer, from this page’s data.', 5); await wait(2600);
  await p.keyboard.press('Control+a'); for (const ch of 'how has access reviews been this month') { await p.keyboard.type(ch); await wait(35); } await wait(1800);
  await say('How has it been this month?', 6); await wait(2400);
  await p.keyboard.press('Control+a'); for (const ch of 'mfa') { await p.keyboard.type(ch); await wait(120); } await wait(900); await p.keyboard.press('Tab'); await wait(1600);
  await say('Look inside a file before opening it: what it is, and what it holds.', 7); await wait(2800);
  await p.keyboard.press('Escape'); await wait(500); await p.keyboard.press('Escape'); await wait(700);
  await say('Open the paused file: Access reviews.', 8); await tap('[data-id="k:application"]', { hold: 500 }); await wait(1600); await tap('[data-id="d:access_reviews"]', { hold: 600 }); await wait(2200);
  await say('What it is, its columns, and what it links to.', 9); if (await soft('.node.focus')) await ring('.node.focus', 4); await wait(2800); await unring();
  await say('What is built from it, and so waits today.', 10); if (await soft('.node.outs header', 2500)) await ring('.node.outs header'); await wait(2600); await unring();
  await say('Decide what readers see.', 11); if (await soft('[data-decide]')) await tap('[data-decide]', { hold: 500 }); await soft('.panel .dk-hero', 6000); await wait(1800);
  await say('What readers see now, and after the recommended choice: chosen, one button.', 12); if (await soft('.panel .dk-hero', 1500)) await ring('.panel .dk-hero'); await wait(3000); await unring();
  await p.keyboard.press('Escape'); await wait(900);
  await title('Today’s problem', 'Seen on the map, explained, opened and decided');
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
