// Video 1: set up the model from nothing — read a file, its key and kind, suggested rules, one rule of your own, the map growing.
// peer:builder — the links shown as joins: what a file points at before its file is read, the join checked when it is
// (a step of its own), one tap to turn a link off and on, and the map's lines naming their columns.
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out] = process.argv.slice(2);
  const v = await session(root, { name: '1-setup' }); const { p, wait, say, ring, unring, tap, pick, title, loc } = v;
  const main = '#buildpanel .bp-foot .btn.primary';
  await p.goto(v.base + '#build-new'); await p.waitForSelector('#buildpanel'); await p.mouse.move(700, 860); await wait(900);
  await title('Set up a data model from nothing', 'Bring in files · name what they hold · suggested rules · a rule of your own');
  await say('An empty map: nothing is set up yet. Larkspur’s folder holds 22 files.', 1); await ring('#canvas', -40); await wait(2600); await unring();
  await say('Start with the first file the app suggests.', 2); await ring('#buildpanel .bp-next', 4).catch(() => {}); await wait(1600);
  await tap(main, { hold: 500 });
  await say('Reading it, the app proposes what one row is and its key: app_id, unique on every row.', 3); await ring('#buildpanel .bf-prop'); await wait(3200);
  await say('…and the kind of thing it describes: an Application, new on the map, drawn dashed until you add it.', 4); await ring('#buildpanel .bf-prop >> nth=1').catch(() => {}); await wait(2600);
  await ring('#canvas [data-id="k:application"]', 8).catch(() => {}); await wait(2000);
  await say('…and what it points at: owner_team_id and platform_id hold ids from two files not read yet. Each line names its column; their kinds stay grey until read.', 4); await ring('#buildpanel .jn-list'); await wait(3000); await ring('#canvas', -40); await wait(2600); await unring();
  await say('Rules come suggested, from Larkspur’s model and the file’s own data, each tried on Feb 1 and on the 184 days before.', 5); await ring('#buildpanel .rl-list'); await wait(3800); await unring(); await tap('#buildpanel .rl-list details.rl-which > summary', { hold: 600 }).catch(() => {}); await say('Seven columns keep to known values: every row passes today.', 5); await wait(2400);
  await say('Add a rule of your own: pick a column…', 6); await tap('#buildpanel details.rl-add > summary', { hold: 600 });
  await pick('#buildpanel select[data-rdk="col"]', 'platform_id');
  await say('…pick the rule: platform_id is never blank.', 6); await pick('#buildpanel select[data-rdk="kind"]', 'notblank');
  await say('Before you add it, it is tried: 345 applications have no platform today…', 7); await ring('#buildpanel .rl-ev'); await wait(2800);
  await say('…and on the 184 days before, its blanks drawn day by day: it would have warned every single day. It would cry wolf.', 7); await ring('#buildpanel .rl-hist'); await wait(3800);
  await say('The history offers a tolerance: up to 15% blank, which would have warned on none.', 8); await tap('#buildpanel [data-act="rd-tol"]', { hold: 600 }); await wait(1200); await ring('#buildpanel .rl-hist'); await wait(2600);
  await say('When it breaks, Warn: the day goes out marked, nothing held.', 8); await ring('#buildpanel .rl-mode'); await wait(2400);
  await tap('#buildpanel [data-act="myrule-add"]', { hold: 500 });
  await ring('#buildpanel .rl-list li.mine'); await say('Added, marked as yours, with its result beside it.', 8); await wait(2600); await unring();
  await say('Add the file: the map gets its first kind.', 9); await tap(main, { hold: 600 }); await wait(1200);
  await ring('#canvas [data-id="k:application"]', 8).catch(() => {}); await wait(2000); await unring();
  await say('The next file: Org units. The links between files are found in the data.', 10); await tap(main, { hold: 500 }); await wait(500);
  await p.waitForSelector('#buildpanel .jn-list li.jn:not(.later)');
  await say('Reading it checks the join: CMDB’s owner_team_id values are Org units’ org_unit_id values. All 176 ids found, on Feb 1’s 2,401 rows.', 10); await ring('#buildpanel .jn-list li.jn:not(.later)'); await wait(3400); await ring('#canvas', -40); await wait(2400); await unring();
  await tap('#buildpanel .jn-list li.jn:not(.later) .jn-tg', { hold: 500 }); await p.waitForSelector('#buildpanel .jn-list li.jn.off');
  await say('A guess you don’t want is one tap: the link goes off and its line leaves the map. Another tap puts it back.', 10); await ring('#canvas', -40); await wait(2600); await unring();
  await tap('#buildpanel .jn-list li.jn.off .jn-tg', { hold: 400 }); await p.waitForSelector('#buildpanel .jn-list li.jn.off', { state: 'detached' });
  await tap(main, { hold: 400 }); await wait(900);
  await say('Added: the line is solid now and names its columns. People stay grey: Org units’ leader_id points at a file not read yet.', 11); await ring('#canvas', -40); await wait(2600); await unring();
  await say('The rest go the same way: read, check what it proposes, add.', 12);
  for (let i = 0; i < 12; i++) { const act = await loc(main).getAttribute('data-act'); if (act === 'feeds') break; await loc(main).click(); await wait(650); if (await loc(main).getAttribute('data-act') === 'feeds' || (await p.locator('#buildpanel .bf-feeds').count())) break; }
  if (await p.locator('#buildpanel .bf-feeds').count()) { await say('Twelve evidence files at once: each the evidence for one control, checked against the applications it covers.', 13); await ring('#buildpanel .bf-feeds'); await wait(3400); await unring(); }
  for (let i = 0; i < 8; i++) { if (await p.locator('#buildpanel .ag-gaps').count()) break; await loc(main).click(); await wait(700); }
  await say('Every file is in. What reading found: six gaps, each drawn as its share of its file, the one worth asking about first.', 14); await ring('#buildpanel .ag-gaps').catch(() => {}); await wait(3000); await unring();
  await say('Each has its reason under it, the one control every check uses, and what it does over the 56 days.', 14); await ring('#buildpanel .ag-gaps li:nth-child(2)').catch(() => {}); await wait(3600); await unring();
  await v.glide('#buildpanel .ag-gaps li.finding .ag-name', 40);
  await say('One is worth asking about: 19 approvals by 8 people HR doesn’t list. Pointing at it lights its two files on the map. It is yours to accept on its own.', 14); await ring('#buildpanel .ag-gaps li.finding').catch(() => {}); await wait(3400); await unring(); await p.mouse.move(700, 860, { steps: 12 });
  await ring('#buildpanel .ag-gaps li:has(.agchip.mine)').catch(() => {}); await say('The CMDB’s blank platforms are watched by your rule now: its 15% is the line, just past today’s 14.4%.', 15); await wait(3400); await unring();
  await say('Accept the five explained: each then does what is set beside it.', 15); await tap(main, { hold: 500 }); await wait(800);
  await say('History: each file’s usual size and mix of values, from 184 past days.', 16); await tap(main, { hold: 500 }); await wait(700); await ring('#buildpanel .bh-grid').catch(() => {}); await wait(3000); await unring();
  await say('Checks: what pauses a day, and the days each would have paused.', 17); await tap(main, { hold: 400 }); await wait(700); await ring('#buildpanel .pdx').catch(() => {}); await wait(3200); await unring();
  await p.locator('#buildpanel .ck-kinds li.mine').first().scrollIntoViewIfNeeded().catch(() => {}); await wait(500); await ring('#buildpanel .ck-kinds li.mine').catch(() => {}); await say('Your rule sits with Larkspur’s checks, its days drawn the same way: Feb 1 to Mar 27, it never broke.', 18); await wait(3600); await unring();
  await title('Set up from nothing', '22 files · 5 kinds of thing · 8 links · 146 checks <i>· and one rule of your own</i>', 3000);
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
