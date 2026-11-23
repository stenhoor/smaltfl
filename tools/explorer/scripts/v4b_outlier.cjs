// Video 4b, the owner's fix: TLS arrived with every application twice; hold it, then publish the corrected file in one tap.
// peer:owner (r3): the round-3 panel: the hero says the corrected file's count; how it compares is under More. Same 11 steps.
// Same 11 steps as scripts/v4b_outlier.cjs. peer:owner: steps 6 to 10 follow the new panel (her pick comes chosen;
// how the corrected file compares is one tap away, under "How it compares").
const { session } = require('./vxkit.cjs');
(async () => {
  const [root, out, seed] = process.argv.slice(2);
  const v = await session(root, { name: '4b-outlier', seed }); const { p, wait, say, ring, unring, tap, title } = v;
  const main = '#buildpanel .bp-foot .btn.primary';
  await p.goto(v.base + '#build'); await p.waitForSelector('#buildpanel'); await p.mouse.move(700, 860); await wait(1200);
  await title('Clearly an outlier', 'See how far from usual it is · keep readers safe · publish the fix');
  await say('Thu Mar 21 paused: TLS, the certificates file.', 1); await ring('#buildpanel .chain .cc.iscause'); await wait(2600);
  await say('Serious: 2.0× usual. About 813 rows a day for 28 days; today 1,630, a column twice as tall on the same scale.', 2); await ring('#buildpanel .ufig'); await wait(4200);
  await say('Every application id came twice: the file was sent twice. Not a real change.', 3); await wait(3000); await unring();
  await say('Everything built from it is held: readers keep Wednesday’s.', 4); await ring('#buildpanel .chain .cc.out').catch(() => {}); await wait(2400); await unring();
  await say('A corrected file came at 14:10. Decide.', 5); await tap('.alert.short [data-decide]', { hold: 500 }).catch(() => tap(main)); await p.waitForSelector('.panel .dk-hero'); await wait(1600);
  await ring('.panel .dk-hero'); await say('Serious, and the file sent again: 815 rows, about usual. Readers keep Wednesday until you decide.', 6); await wait(3800);
  await ring('.panel .dk-after'); await say('Recommended by Sloane Marsden, the security lead: publish the corrected file. Already chosen.', 7); await wait(3000);
  await tap('.panel .dk-more > summary', { hold: 400 }); await tap('.panel .fixmore > summary', { hold: 500 }); await ring('.panel .fixchip'); await say('And more than its count, under More: both copies of every row were identical, and against Wednesday it moved as any day does.', 7); await wait(4200);
  await ring('.panel .dk-foot'); await say('What goes on record when you tap Agree: you, publish the corrected file, her reason agreed.', 8); await wait(3200);
  await say('One tap: Agree.', 9); await tap('.panel [data-confirm]', { hold: 600 }); await wait(1800);
  await ring('#buildpanel .bd-receipts').catch(() => {}); await say('Resolved: readers see Thursday as it really was. The receipt keeps who, when and why.', 10); await wait(3400); await unring();
  await title('Resolved', 'Twice the usual rows: held, then the corrected file published, with the reason on record');
  const r = await v.finish(out); console.log('video', r.mp4, r.mb, 'MB', r.errs.length ? 'ERRORS ' + r.errs.join(' | ') : 'no page errors');
})().catch((e) => { console.error(e); process.exit(1); });
