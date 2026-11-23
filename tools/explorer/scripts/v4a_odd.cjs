// Video 4a: a little odd, not enough to stop — read what usual looks like, then send the day through.
// peer:owner (r3): the round-3 panel: the limit tools and the choices behind More; smaltfl's reading comes agreed, so step 9 opens your own words first. Same 12 steps.
// peer:owner: a copy of scripts/v4a_odd.cjs. The limit tools sit under "If it keeps happening ›" now, so step 7 opens it
// before ringing them. Same 12 steps and captions.
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out, seed] = process.argv.slice(2);
  const v = await session(root, { name: '4a-odd-but-ok', seed }); const { p, wait, say, ring, unring, tap, typeIn, title } = v;
  const main = '#buildpanel .bp-foot .btn.primary';
  await p.goto(v.base + '#build'); await p.waitForSelector('#buildpanel'); await p.mouse.move(700, 860); await wait(1200);
  await title('Odd, or a real problem?', 'Look at what usual looks like · decide it is fine · send it through');
  await say('Sat Mar 2 paused, and the banner says how serious: mild, only your own tighter limit.', 1); await ring('.alert.short').catch(() => {}); await wait(3200);
  await say('Your rows check is tighter than Larkspur’s: ±2% instead of ±5%.', 1); await ring('#buildpanel .chain .cc.iscause'); await wait(2600);
  await say('The picture says it first: Saturday stands level with the 28 days before, on a scale every file shares. A little odd, not a problem.', 2); await ring('#buildpanel .ufig'); await wait(4600);
  await say('Just past your limit: it pauses below 264 rows, and Saturday had 262.', 3); await ring('#buildpanel .ufig .u-chart'); await wait(3400);
  await say('The rows behind the count: of the 10 that went since last Saturday, 9 had expired months ago. One was still active: worth asking about.', 3); await ring('#buildpanel .rdiff'); await wait(4800); await unring();
  await say('Decide what readers see.', 4); await tap('.alert.short [data-decide]', { hold: 500 }).catch(() => tap(main)); await p.waitForSelector('.panel .dk-hero'); await wait(1600);
  await tap('.panel .dk-more > summary', { hold: 400 }); await tap('.panel .tunefold > summary', { hold: 500 }); await ring('.panel .decfig .tune'); await say('Only your own limit paused it. If it keeps happening: accept the new level and keep your ±2%, or set the limit back.', 5); await wait(4600);
  await ring('.panel .dk-after'); await say('Recommended from the evidence: publish. 262 rows is in line with the last 5 days.', 6); await wait(3200);
  await tap('.panel .opt.tile.sug', { ring: false }); await wait(700);
  await tap('.panel [data-ownwords]', { hold: 400 }); await ring('.panel .whyrow'); await say('Your reason, in your own words: the evidence is under More, above.', 7); await wait(1800);
  await typeIn('#dec-note', '9 of the 10 that went had expired; asking the risk team about EX-00379', { hold: 400 });
  await ring('.panel .dk-foot'); await say('On record: you, Publish as is, in your words.', 8); await wait(2600);
  await say('Send it through.', 9); await tap('.panel [data-confirm]', { hold: 600 }); await wait(1800);
  await ring('#buildpanel .bd-receipts').catch(() => {}); await say('Published. The receipt keeps who decided, when, and why.', 10); await wait(3200); await unring();
  await title('Sent through', 'In line with this week · past only your own tighter limit · published with your reason');
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
