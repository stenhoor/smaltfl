// Video 2, the owner's fix: MFA arrives empty on Mon Feb 26. The Decide panel answers at a glance (how serious, what readers
// peer:owner (round 2): a copy of scripts/v2_fix.cjs; step 9 points at "Keep all" to show its risk on hover, with its caption. Same 19 steps.
// see now and after each choice, who recommends what) and one tap agrees, on record. Same 19 steps as scripts/v2_fix.cjs.
// peer:owner: steps 7 to 12 and 17 to 18 follow the new panel: her pick comes chosen, so there is no "Use her reason" tap.
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out, seed] = process.argv.slice(2);
  const v = await session(root, { name: '2-problem-fix', seed }); const { p, wait, say, ring, unring, tap, typeIn, title } = v;
  const main = '#buildpanel .bp-foot .btn.primary';
  await p.goto(v.base + '#build'); await p.waitForSelector('#buildpanel'); await p.mouse.move(700, 860); await wait(1200);
  await title('A problem, and how to fix it', 'A file arrives empty · keep readers safe · publish the corrected file');
  await say('Mon Feb 26 paused itself: something in today’s files broke a rule.', 1); await ring('#buildpanel .bd-strip2', 6).catch(() => ring('#buildpanel .bd-cal')); await wait(2600);
  await say('The cause, first: MFA arrived with no rows at all.', 2); await ring('#buildpanel .chain .cc.iscause'); await wait(2400);
  await say('Usually about 2,300 rows a day. Today none: serious, an empty column on a scale every file shares.', 3); await ring('#buildpanel .ufig'); await wait(3800);
  await say('What it holds: the 11 outputs built from MFA wait, and readers keep Sunday’s.', 4); await ring('#buildpanel .chain .cc.out').catch(() => {}); await wait(2400);
  await ring('#canvas .bouts .bo-g.held', 8).catch(() => {}); await say('On the map, the line runs from MFA to what it holds.', 4); await wait(2400); await unring();
  await say('Decide what readers see: the banner carries the button.', 5); await ring('.alert.short [data-decide]').catch(() => {}); await wait(1600); await tap('.alert.short [data-decide]', { hold: 500 }).catch(() => tap(main)); await p.waitForSelector('.panel .opts'); await wait(1600);
  await ring('.panel .nowpic'); await say('At a glance: serious, and readers keep Sunday until you decide.', 6); await wait(2600);
  await ring('.panel .opt.tile.sug'); await say('Recommended first, by Sloane Marsden, the security lead: wait for the file. Already chosen, her reason under it.', 7); await wait(3600);
  for (const k of ['keep', 'fill', 'asis']) { if (await p.locator(`.panel .opt.tile[data-k="${k}"]`).count()) { await ring(`.panel .opt.tile[data-k="${k}"]`); await wait(900); } }
  await unring(); await v.glide('.panel .opt.tile[data-k="keep"]'); await wait(500); await say('Each other choice in one line: where readers would look, and what becomes of the day. Pointing at one shows what it risks.', 7); await wait(2600); await p.mouse.move(700, 860, { steps: 12 }); await wait(300);
  await say('Say who is deciding: it goes on the record with the reason.', 8); await typeIn('#dec-who', 'Alex Kim, head of IT controls', { hold: 400 });
  await ring('.panel .onrec'); await say('Before the tap it says what goes on record: Alex Kim, wait for the file, Sloane Marsden’s reason, agreed.', 8); await wait(3400);
  await say('One tap: Agree. Her reason goes on record only by that tap.', 9); await tap('.panel [data-confirm]', { hold: 600 }); await wait(1600);
  await ring('.alert.short').catch(() => {}); await say('The day now waits for its file: your call, with the time.', 10); await wait(2600);
  await ring('#buildpanel .bd-receipts').catch(() => {}); await say('The receipt: who decided, when, and in whose words.', 10); await wait(2800); await unring();
  await say('Overnight, the vendor sends Monday’s export again.', 11); await tap(main, { hold: 600 }); await wait(1400);
  await ring('#buildpanel .bd-askbar').catch(() => {}); await say('Tue Feb 27: Monday’s corrected file is in, for your OK.', 11); await wait(2600); await unring();
  await tap(main, { hold: 500 }); await p.waitForSelector('.panel .opts'); await wait(1400);
  await ring('.panel .decfig'); await say('The same picture, with the file sent again: 2,318 rows, about usual.', 12); await wait(3600);
  await ring('.panel .onrec'); await say('Publish the corrected file: her pick, already chosen, her reason agreed; the name is remembered.', 13); await wait(2600);
  await tap('.panel [data-confirm]', { hold: 600 }); await wait(1800);
  await ring('#buildpanel .bd-receipts').catch(() => {}); await say('Fixed: readers see Monday’s real MFA results. Both decisions are on the record, each with who, when and why.', 14); await wait(3600); await unring();
  await title('Fixed', 'Kept readers on Sunday while the file was empty · published Monday’s corrected file');
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
