# The explorer's page: its levels as pictures, the zoom as a filmstrip, the estate at scale, the phone, the judges by round.
import html, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
J = json.load(open(os.path.join(HERE, 'judges.json'))) if os.path.exists(os.path.join(HERE, 'judges.json')) else None
e = html.escape

def shot(f, cap, title=None):
    t = f'<b>{e(title)}</b> · ' if title else ''
    return f'<figure class="shot"><button type="button" data-full="shots/{f}" data-cap="{e(title or cap)}"><img src="shots/{f}" alt="{e((title + ": " if title else "") + cap)}" loading="lazy"></button><figcaption>{t}{e(cap)}</figcaption></figure>'

CHANGED = [
    '<b>Two peer rounds, each a working fix.</b> Five reviewers (builder, owner, designer, newcomer, data quality) each built a working fix in their own copy of the explorer, reviewed the others’ until at least three of four agreed, and the agreed fixes were merged; every walkthrough re-run with no page errors.',
    '<b>The join, shown.</b> Reading a file checks each link as a step of its own: the two columns, real values meeting their twins, how many were found, one tap to turn it off; the map’s line names its columns while it is checked.',
    '<b>Decide says only the decision.</b> A severity badge, one picture, each choice in one line with where readers would look, the owner’s pick chosen and Agree the one button; the page behind keeps only what the day holds. 188 to 247 visible words where it had up to 830.',
    '<b>One chart for how far from usual.</b> The 28 days before as bars from zero on a scale every file shares, the limit a labelled line, today’s bar the only colour: amber for mild, crimson for serious.',
    '<b>What reading found, on one screen.</b> Each gap a dark bar of its file, the one worth asking about first with its own Accept, and one Pause · Warn · Note · Off control a row that says what it does over the 56 days.',
    '<b>One quiet system.</b> One type scale with an 11 px floor, three weights, magenta only on the cause, smalt only on the action, rows instead of tinted tiles, and a chosen setting shown as a soft fill.',
    '<b>Larkspur, built from nothing.</b> In the explorer’s estate menu, <i>Build Larkspur from its files</i> rebuilds the demo from its 22 files: what each file holds, its checks, the outputs, then February and March replayed day by day, ending where the demo begins.',
    '<b>Each file proposes what it holds, from its own data.</b> What one row is and its key (two columns where one won’t do, with how unique each is), the card it lands on and the links it brings, what points at it with real match counts; Larkspur’s own choice marked, every proposal open to change.',
    '<b>Every gap with its evidence.</b> Approvers not among the people, tags the CMDB doesn’t list, blank clusters (all non-production), blank platforms (all the SaaS applications), exceptions with no first version: each with what backs it behind Why.',
    '<b>One control, four words.</b> Every check, link, gap and watched output is set the same way, Pause · Warn · Note · Off, with “at ¼” or “of new ones” as qualifiers beneath; the map, the tiles and the matrix count them alike.',
    '<b>A paused day, cause first.</b> The file the day waits on, what followed from it, what is held, then a corrected file if one came, in a neutral voice; the record in two lanes, this replay and Larkspur’s.',
    '<b>Agreeing is recorded as agreeing.</b> What Larkspur’s owners chose is marked quietly with who and when; their reason is quoted inside that choice with a box to tick. The record says “agreeing with Sloane Marsden, her reason quoted”, never puts her words in yours, and the walk checks every record against what the panel promised.',
    '<b>Every count from one record.</b> Each check names the days it paused or warned, drawn as a strip of the 56 days; the calendar, the day cards and the checks agree: 8 days paused, 7 by the files’ checks, Feb 16 by an output’s own check alone.',
    '<b>A held output says so, and why.</b> On a paused day each output built from what paused carries ⧗ and “Held: built from MFA”, its own check’s verdict beside it, and every held output is named.',
    '<b>Known gaps, accepted by someone.</b> What reading found on Feb 1 is accepted as known gaps in a step of its own, with your name and time; a passing day then says “every check passed · 3 known gaps”.',
    '<b>Pause, offered for a gap too.</b> Set a gap’s check to Pause and the replay pauses each day a new one appears, yours to decide; the end shows it beside Larkspur’s record, whose check only warned.',
    '<b>Every check, every day.</b> Each day lists all ten checks’ results; where the Learned check stayed quiet on a respelling, the day says why. Where an owner’s reason rests on the data (Mar 11’s 469 partial backups that passed), the table sits beside it.',
    '<b>Five marks on the calendar, one meaning each.</b> Published, warned ◆, paused ⏸, decided ✓, and a change decided ◤; the finer kinds of decided day are said on the day itself.',
    '<b>A paused day says its cause once.</b> The heading is the cause; the line under it says what followed and how many outputs are held, every one of them named; App owners’ pause is credited to its own rule.',
    '<b>The Rows limit is a number.</b> Change it and the days it would pause are counted live from the files’ own rows: ±5% pauses 4 days, ±2% would pause 15. The replay follows it, each extra day yours to decide.',
    '<b>Both records on every decision.</b> The end shows, day by day, your choice, time and whether you agreed, beside Sloane Marsden’s choice, time and quote, with a tally of the 56 days and of every decision.',
    '<b>Evidence for the choice in front of you.</b> Mar 13 shows the corrected file against the first; Mar 6, the level holding a second day; Mar 24, the weekend’s churn against a weekday’s.',
    '<b>Said once, in plain words.</b> The end counts each thing once (56 days, every decision, the gaps accepted apart from the one nobody accepted) and checks the replay against what your checks forecast; the calendar forecasts the days to come.',
    '<b>Magenta only for what is held.</b> Settings are drawn in grey; a cause wears its own day’s mark with a heavy outline; the owner’s pick is one tag everywhere; on a phone every choice is a row with its picture beside it.',
    '<b>One mark a state, everywhere.</b> ◆ is always amber; a cause wears the mark of what its own check did, outlined; ◐ is a day decided for now, its file still owed; ◇ is a gap nobody has accepted; a day to come is outlined in the mark your checks give it.',
    '<b>The day leads with its cause.</b> While a day is open the calendar is a strip of the 56 days, the months a tap away; the cause’s chart sits inside its card; on the map a line runs from the cause to the outputs it holds, named once beneath the map.',
    '<b>A new one is open until someone accepts it.</b> A gap accepted on Feb 1 opens again when a new approver appears, listed each day with Accept as known and Warn every day; the end counts each gap from Feb 1 to Mar 27, the ones switched off included, and keeps Feb 24 apart when it was yours alone.',
    '<b>Both stamps on every decision.</b> Your date and time beside hers; Change this decision on any past day; a change Larkspur recorded is two cards to pick from, nothing picked for you; your own pause on a gap offers Publish, keep it open.',
    '<b>On a phone, one row of chrome.</b> Map and the step share a row, Back is a ‹, a toast leaves after four seconds, targets are 44 px, the map is the drawing of kinds and links, and a choice opens full width when you pick it.',
    '<b>The record and the replay agree.</b> Mar 7 warns as Larkspur’s record did, saying it follows Logging’s accepted level; an exception with two versions counts once (253 in 268 rows); figures carry their denominators and small shares their counts; the re-sent MFA file is drawn, and nothing that came after her decision stands beside her reason.',
    '<b>A strip you can read.</b> Each day’s mark sits under its number; a decided day is solid, a day to come dashed, the day on screen outlined, a day with a gap still open marked ◇; the panel keeps one width, so the map holds still.',
    '<b>The end, at a glance.</b> The 56 days as a strip; a row per decision with both records behind a tap; each gap split at its acceptance (Feb 1: 4 accepted → Mar 27: 5, +1 since, not accepted); the new approver named.',
    '<b>Less to read (the morning’s reduction).</b> The map leads: a paused day is the cause, what it holds and the line between them; everything else about a day sits behind one tap. The calendar uses the explorer’s own marks (⏸ paused, ◆ warned, ✓ decided, ◐ decided for now); steps open with one line; a file’s columns fold; who decided what and when lives in one Record view at the end.',
    '<b>One picture for odd or wrong.</b> Every day judged on its rows shows the same picture: bars from zero, then the last 28 days as a share of usual on one fixed scale, the 28 days’ range shaded, your limit and Larkspur’s dashed, today’s dot coloured by where it lands, and a verdict on top (“In line with the last 5 days”, “2.0× usual”, “None at all”). A corrected file joins it as a third bar.',
    '<b>The evidence beside the choices.</b> On a desktop the Decide sheet is two columns: the picture and the cause on the left, every choice on the right, the recommended one first in one style (“Recommended by Sloane Marsden, security lead”), nothing to scroll.',
    '<b>One reason, said exactly as it goes on the record.</b> Pick the recommendation and its reason is filled in, quoted as theirs; edit it and it becomes your words; a line under it shows the record (“you · Wait for the file · “…” Sloane Marsden’s reason, agreed”). Each decision then leaves a receipt with who, when and whose words.',
    '<b>A false alarm fixed at its source.</b> When only your own tighter limit paused a day, the sheet says so, counts the days it would have paused, and offers to set it back from that day: a dated change, recorded with its reason.',
    '<b>A rule tried on 184 days before you add it.</b> A rule of your own shows the days it would have broken (“would have warned every day: it would cry wolf”) and offers the tolerance its history allows (“up to 15% blank: none”). Your rules then count with the checks and warn or pause on the days they break.',
    '<b>A finding kept apart.</b> Accepting the gaps found on Feb 1 leaves out the one that may be a real problem, to accept on its own; a gap your own rule watches says so; an accepted gap names the count it was accepted at.',
    '<b>The model takes shape as you read.</b> Reading a file draws dashed the kinds it points at and the links it would make; its key is judged on 184 days, its candidates side by side, each column’s type shown with its evidence and open to change.',
    '<b>Judged six ways, round after round.</b> A first-time builder, a data owner, a designer, a newcomer, a data quality lead and a phone user, new judges each round, scored below.',
]
SWATCHES = [
    ('#151922', '#e8ebf1', '#ffffff', '#171c25', 'Aa', 'Ink', 'Names, titles and what you read first.', '17.6 : 1 · dark 14.3 : 1'),
    ('#5c6375', '#98a1b3', '#ffffff', '#171c25', 'Aa', 'Secondary', 'Counts, meanings, labels of areas and themes.', '6.0 : 1 · dark 6.6 : 1'),
    ('#003399', '#8fa8ff', '#ffffff', '#171c25', '›', 'Action, smalt blue', 'Links, the one primary button, and what you point at.', '10.9 : 1 · dark 7.5 : 1'),
    ('#a3195b', '#ff86b5', '#f8e3ec', '#3a1828', '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 .5a7.5 7.5 0 1 0 0 15A7.5 7.5 0 0 0 8 .5zM4.9 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0zM8.7 5.6a1.2 1.2 0 0 1 2.4 0v4.8a1.2 1.2 0 0 1-2.4 0z"/></svg>', 'Paused', 'The one alarm: a disc with its bars cut out, the same at every size.', '6.0 : 1 · dark 7.0 : 1'),
    ('#8a5a12', '#e3b55f', '#f8eedb', '#33280f', '◆', 'Unusual', 'A warning, always with its mark.', '5.1 : 1 · dark 7.6 : 1'),
    ('#1d6b3a', '#67d391', '#e3f1e8', '#12301f', '✓', 'Decided', 'What a decision settled, always with its tick.', '5.6 : 1 · dark 7.7 : 1'),
    ('#3f4656', '#c3c9d6', '#e9edf3', '#232a36', '◐', 'Decided for now, file owed', 'Settled, not a warning: neutral, with its half-filled mark, as the app draws a decided day.', '8.0 : 1 · dark 8.7 : 1'),
    ('#3f4656', '#c3c9d6', '#e9edf3', '#232a36', '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3.2 1.6h9.6M3.2 14.4h9.6" stroke-width="1.6"/><path d="M4.6 1.6c0 3.6 2.6 4.8 2.6 6.4s-2.6 2.8-2.6 6.4M11.4 1.6c0 3.6-2.6 4.8-2.6 6.4s2.6 2.8 2.6 6.4" stroke-width="1.35"/><path d="M5.6 13.6c.6-1.9 1.6-2.7 2.4-3.2.8.5 1.8 1.3 2.4 3.2zM6.1 4.4h3.8c-.4.9-1.1 1.5-1.9 2.1-.8-.6-1.5-1.2-1.9-2.1z" fill="currentColor" stroke="none"/></svg>', 'Waits', 'Outputs held up by the paused file: a grey hourglass, another shape from the pause.', '8.0 : 1 · dark 8.7 : 1'),
    ('#737c92', '#7b849a', '#eef1f6', '#0d1117', '—', 'Lines', 'Relations between kinds and datasets; non-text contrast at least 3 : 1.', '3.7 : 1 · dark 5.1 : 1'),
]
MOTION = [
    ('Every card keeps who it is', 'A kind grows into its panel; a square becomes its chip and goes back again (Heer and Robertson). New content fades in as its card changes shape.'),
    ('One move at a time', 'Half a second on the standard curve: away gently, then a long settle. Lines and words wait for the move to end.'),
    ('Pointing ripples out', 'The kind you point at rings in blue at once; the sentences on the kinds it relates to appear one after another, nearest first; the rest steps back to a third.'),
    ('Choices act out what they do', 'Each Decide choice plays once when the choices appear, again when you point at it, and now and then while it is chosen.'),
    ('Panels slide, estates arrive', 'A panel slides in from the side and back out; switching estates fades the old one and brings the new one in kind by kind.'),
    ('A decision shows itself', 'What it changed flashes once, crimson turns grey or green, and a receipt with Undo slides up for six seconds.'),
    ('A lit card makes room', 'Pointing grows each related card into the gap below it, so its sentence stays inside its own frame.'),
    ('Less motion when asked', 'With reduced motion set, the same views appear at once: no zoom, no drawing, no playing pictures, no flash.'),
]
LEVELS = [
    ('estate.jpg', 'Where it opens: each kind of thing the data describes, its datasets inside, the kinds that relate side by side. Each line carries a verb you read as a sentence: Application → runs on → Platform. The paused file is the one red mark, with one headline and one action.', 'The estate'),
    ('kind.jpg', 'Click a kind and it fills the view: its datasets as chips in their sections, the kinds it relates to at its sides as the same tiles as on the map; each line says its verb and what carries it.', 'A kind, opened'),
    ('ds.jpg', 'Click a dataset and it sits in the middle with its columns and what each one means, under its kind’s tile with its own square marked: what it joins, what one row is, what it is evidence for, and the 11 datasets it holds up, each one a way in.', 'A dataset’s neighbourhood'),
]
FILM = [('f1.jpg', 'Click'), ('f2.jpg', 'Growing'), ('f3.jpg', 'Settling'), ('f4.jpg', 'Open')]
BIG = [
    ('big.jpg', 'Twenty-two kinds in four areas. Inside an area, kinds that relate sit side by side, joined by short lines. The links between areas run through the gaps and name their relations; tap one for the list.', 'The larger estate'),
    ('big-hover.jpg', 'Point at a kind: it gets the one blue ring, and each kind it relates to says how inside its own card, which grows to hold it: the pointed kind in bold, and how many datasets carry the join. The rest steps back.', 'Pointing at Application'),
    ('big-reach.jpg', 'See what’s built from it, at ten times the size: each kind whose outputs wait says which, in its own card.', 'What waits on the pause'),
    ('big-kind.jpg', 'Application, with 45 datasets in six themes, fits one screen; its 13 neighbours wait at its sides in their four areas, each line saying its verb.', 'A large kind, opened'),
    ('big-ds.jpg', 'A dataset of the larger estate: the cards it joins stacked clear of each other, each line leaving the column that carries it.', 'A dataset at ten times the size'),
]
IDEAS = [
    ('Overview first, then zoom, then details', 'The whole estate on one screen; a kind; a dataset; the side panel last (Shneiderman).'),
    ('Show the context, expand on demand', 'An opened kind shows the kinds one step away, never the whole graph (van Ham and Perer).'),
    ('Focus and context', 'What you open grows; the rest waits at the edges, so you never lose your place (Furnas; Cockburn et al.).'),
    ('Every card keeps who it is', 'Animated moves between levels help people follow what changed (Heer and Robertson).'),
    ('Group, then route through the gaps', 'Areas as frames, related kinds side by side, the links between areas along the gutters and named once (compound graphs).'),
    ('Say a relation as a sentence', 'Subject, verb, object, as an ontology states it: “Application is owned by a unit”. The verb alone on a line, the whole sentence where there is room.'),
]
SOURCES = [
    ('Shneiderman 1996', 'https://webspace.science.uu.nl/~telea001/uploads/VACourse/Shneiderman96.pdf'),
    ('van Ham and Perer 2009', 'https://dig.cmu.edu/publications/2009-doigraphs.html'),
    ('Cockburn, Karlson and Bederson', 'https://www.microsoft.com/en-us/research/wp-content/uploads/2008/01/cockburn-ComputingSurveys09.pdf'),
    ('Hornbæk, Bederson and Plaisant', 'https://courses.ischool.berkeley.edu/i247/s04/resources/p362-hornbaek.pdf'),
    ('Heer and Robertson 2007', 'https://idl.uw.edu/papers/animated-transitions'),
    ('Compound graphs, VIS 2024', 'https://arxiv.org/abs/2408.04045'),
    ('Atlan lineage', 'https://docs.atlan.com/product/capabilities/lineage/how-tos/view-lineage'),
    ('Foundry Object Explorer', 'https://palantir.com/docs/foundry/object-explorer/getting-started/'),
]
FIX = [
    ('fix-reach.jpg', 'Point at “See what’s built from it”: each kind whose outputs wait names them, with the hourglass; only the cause is crimson.', 'What waits on the pause'),
    ('fix-decide.jpg', 'Decide: the day and its month at the top, the two checks that stopped it named, then the four choices, each a picture with its pro, its con, its list status and what the late file does.', 'The choices, with their pros and cons'),
    ('fix-fill.jpg', 'Choose Fill (or press 2) and its picture plays: Tuesday’s rows copy across, marked as filled, and the eye moves to Wednesday. The button follows the choice, and it waits for your reason.', 'Each choice acts out what it does'),
    ('fix-decided.jpg', 'Confirmed: the dataset says “Kept Tue Mar 26 · file owed” and that you asked for the file, the 11 stay on Tuesday, and the next step is the primary button: Replace file.', 'Decided for now'),
    ('fix-estate.jpg', 'On the map the day is decided for now (◐), in neutral grey: settled, not a warning, with the request you copied and the next step named.', 'Decided for now, with the next step'),
    ('fix-replace.jpg', 'Replace file: the corrected export runs under the same checks, then waits for your OK: Publish Wed Mar 27, or Not now.', 'The real fix, with your OK'),
    ('fix-complete.jpg', 'Published, in green: the corrected file passed all 8 checks, the 11 are rebuilt and readers see Wednesday; “Undo: back to file owed” says what it puts back.', 'Complete'),
]
EXPLORE = [
    ('explore-search.jpg', 'Ctrl K leads with what to do now; the preview beside the list shows what the line picked does before you run it.', 'Ctrl K, with its preview'),
    ('explore-typing.jpg', 'Type a question and its answer shows beside the list before Enter, titled as the question it answers.', 'Answers as you type'),
    ('explore-month.jpg', '“How has Access reviews been this month?”: each day’s real rows as bars over the strip of days, the check’s quiet band shaded, and the two days out of the ordinary in plain words.', 'A month, with its numbers'),
    ('explore-inside.jpg', 'Tab into a dataset: its columns with how each is stored, and in the preview its month over the check’s band, its joins and how well each matches on the day’s files.', 'Looking inside'),
    ('explore-join.jpg', '“What does CMDB join?”: each join with the column at each end and its match on the day’s files.', 'What joins, and how well'),
    ('explore-ask.jpg', 'Ask why: the cause, both checks, the suggestion, and the buttons to act on it.', 'Asking why'),
    ('explore-request.jpg', 'Draft a request for the file: a To you fill once (the data names no sender), the message drafted from what the page knows, and Copy it, for you to send; the day then says you asked.', 'Asking for the file'),
    ('explore-rows.jpg', 'Explore rows: the day’s real file, sorted, filtered by a word and by a tapped value, failing values marked.', 'A dataset’s rows'),
]
QUESTIONS = [
    '<b>Is the new pause mark right?</b> A crimson disc with its bars cut out; waiting is a grey hourglass. Say if you would rather have the bars alone, or a rounded square.',
    '<b>Does the preview beside the Ctrl K list help?</b> It shows a dataset’s month, columns and joins, a kind’s datasets, or what a command will do, before you press Enter.',
    '<b>What should Ctrl K do next?</b> More answers from the page (a column’s values, who owns what), actions on other screens (the month, a day), or Claude for the rest?',
]
LABELS = [('connections', 'Understand the connections'), ('drill', 'Know where to drill in'), ('beauty', 'Beautiful and calm'), ('scale', 'Still works when large')]

def scoretable(rounds, cols, caption):
    head = ''.join(f'<th scope="col">{e(n)}</th>' for _, n in cols)
    rows = ''
    for i, r in enumerate(rounds):
        last = i == len(rounds) - 1
        cells = ''.join((f'<td><span class="sbar" style="--w:{r["scores"][k] / 5 * 100:.0f}%"></span><b>{r["scores"][k]:.1f}</b></td>' if r["scores"].get(k) is not None else '<td><b>pending</b></td>') for k, _ in cols)
        rows += f'<tr class="{"latest" if last else ""}"><th scope="row">{e(r["name"])}{"<span>latest</span>" if last else ""}</th>{cells}</tr>'
    return f'<div class="stwrap"><table class="scores"><caption>{e(caption)}</caption><thead><tr><th scope="col">Round</th>{head}</tr></thead><tbody>{rows}</tbody></table></div>'

def marks():
    if not J: return '<div class="card"><p>The judges are still looking.</p></div>'
    quotes = ''.join(f'<p class="quote">“{e(q)}”<span>{e(w)}</span></p>' for q, w in J['quotes'])
    fixed = ''.join(f'<li>{e(x)}</li>' for x in J['fixed'])
    open_ = ''.join(f'<li>{e(x)}</li>' for x in J['open'])
    maptable = scoretable(J['rounds'], [('connections', 'Connections'), ('drill', 'Where to drill in'), ('beauty', 'Calm'), ('scale', 'When large')], 'The map, scored 1 to 5 by three judges each round (the average)')
    loop = ''
    if J.get('loop'):
        L2 = J['loop']
        loop = scoretable(L2['runs'], [('see', 'See what is wrong'), ('can', 'Know what I can do'), ('trust', 'Trust what happened'), ('explore', 'Explore the data')], L2['title']) + (f'<p class="quote">“{e(L2["quote"])}”<span>{e(L2["who"])}</span></p>' if L2.get('quote') else '')
    r9 = ''
    for key in ('r10', 'r9'):
        if not J.get(key): continue
        R9 = J[key]; head = ''.join(f'<th scope="col">{e(n)}</th>' for _, n in R9['cols'])
        def cell(v):
            if isinstance(v, str) and '/' in v:
                a, c = v.split('/'); w = float(a) / float(c) * 100; return f'<td><span class="sbar" style="--w:{w:.0f}%"></span><b>{e(v)}</b></td>'
            return f'<td><span class="sbar" style="--w:{v / 5 * 100:.0f}%"></span><b>{v:.1f}</b></td>'
        rows = ''.join(f'<tr><th scope="row">{e(r["name"])}</th>' + ''.join(cell(r['scores'][k]) for k, _ in R9['cols']) + '</tr>' for r in R9['runs'])
        r9 += f'<div class="stwrap"><table class="scores"><caption>{e(R9["title"])}</caption><thead><tr><th scope="col">{e(R9.get("first", "Judge"))}</th>{head}</tr></thead><tbody>{rows}</tbody></table></div>'
    return (f'<div class="card">{r9}{maptable}{loop}{quotes}</div>'
            f'<div class="card"><h3>{e(J.get("fixedTitle", "Fixed since the last judges looked"))}</h3><ul>{fixed}</ul><h3>{e(J.get("openTitle", "Still open"))}</h3><ul>{open_}</ul></div>')

# five walkthroughs, each a raw recording with what making it showed
WALK = [
    ('v1-setup', 'Set up from nothing', '2:32', 'build-new',
     'Read the first file: its key, its kind, and what it points at, grey until read. Reading the next file checks each join: real values meeting their twins, “All 176 ids found on Feb 1’s 2,401 rows”, one tap to turn a link off. Then what reading found: six gaps, each drawn as its share of its file, the one worth asking about first.',
     'You see why files are joined: the matching values, how many were found, and the map’s line naming its columns while it is checked.',
     'Peer reviewers: “I pick a file and it’s joined to a bunch of things and I don’t know why.” Now the join is a step of its own, shown before its line is drawn.'),
    ('v2-problem-fix', 'A problem, and its fix', '2:09', 'build-at-feb26',
     'MFA arrives empty on Mon Feb 26: serious, an empty column on a scale every file shares. Decide opens on the answer: what readers see now, Sloane Marsden’s pick already chosen, one Agree button. The corrected file is published the next day.',
     'Decide says only the decision: about 200 visible words where it had 740, the map behind quieted to what the day holds.',
     'Peer reviewers: four choices and columns of evidence competed. Now one picture, one line per choice, and each choice’s risk on pointing.'),
    ('v3-explore', 'Exploring the data', '1:28', 'estate',
     'Point at kinds, open Application and TLS: each column with today’s first value beside what it means; a column’s values; the rows opened on the column tapped; Ctrl K.',
     'A file reads like an example row, not a dictionary: app_id, the application’s id, APP-0003.',
     'Peer reviewers: kinds no file had been read for still said things. Now they stay grey and say which file names them.'),
    ('v4a-odd-but-ok', 'A little odd: send it through', '1:41', 'build-at-mar2',
     'Your tighter limit pauses Sat Mar 2: mild, in amber. Saturday stands level with the 28 days before, two rows under your line. Publish as is, in your own words.',
     'Odd and serious look different at a glance: amber and level with the days before, against crimson and twice as tall.',
     'Peer reviewers: a 2.6% dip and an empty file looked equally alarming. Now one chart on one scale from zero, the limit a labelled line.'),
    ('v4b-outlier', 'Clearly an outlier: resolve it', '1:12', 'build-at-mar21',
     'TLS arrives with every application twice: 1,630 rows towering over 28 days of about 813. The corrected file’s 815 sits beside it on the same scale; agree to publish it.',
     'The outlier and its fix in one picture, and the decision in one tap that says whose reason goes on record.',
     'Peer reviewers: the panel showed 700 words and the page behind competed. Now every decision step shows 188 to 247.'),
]
VJ = {'caption': 'The walkthroughs judged each round by five reviewers (builder, owner, designer, newcomer, data quality; the average, 1 to 5). The peer rounds judged against a stricter brief: a word budget per screen and the creators’ pre-ship checklist.',
      'cols': [('find', 'Easy to find'), ('do', 'Easy to do'), ('pics', 'Pictures over words'), ('trust', 'Trust'), ('overall', 'Overall')],
      'rounds': [{'name': 'Round 1, first recordings', 'scores': {'find': 3.2, 'do': 3.4, 'pics': 2.8, 'trust': 3.0, 'overall': 3.0}},
                 {'name': 'Round 2, after the first fixes', 'scores': {'find': 3.4, 'do': 3.8, 'pics': 3.0, 'trust': 3.0, 'overall': 3.0}},
                 {'name': 'Peer reviewers, the same version, stricter brief', 'scores': {'find': 3.0, 'do': 2.8, 'pics': 2.0, 'trust': 2.8, 'overall': 2.2}},
                 {'name': 'After peer round 1', 'scores': {'find': 3.8, 'do': 3.6, 'pics': 3.0, 'trust': 4.0, 'overall': 3.0}},
                 {'name': 'After peer round 2', 'scores': {'find': 4.0, 'do': 4.2, 'pics': 4.0, 'trust': 4.0, 'overall': 4.0}}]}
def walk():
    out = ''
    for f, t, d, route, what, good, hard in WALK:
        out += (f'<figure class="walk"><video src="media/{f}.mp4" poster="media/{f}.jpg" preload="none" controls playsinline aria-label="{e(t)}: {e(what)}"></video>'
                f'<figcaption><div class="wt"><b>{e(t)}</b><span>{e(d)}</span></div><p>{e(what)}</p>'
                f'<ul class="wl"><li class="ok"><span aria-hidden="true">✓</span>{e(good)}</li><li class="fx"><span aria-hidden="true">↻</span>{e(hard)}</li></ul>'
                f'<a class="wtry" href="explore/index.html#{route}">Try it ›</a></figcaption></figure>')
    return out

# the setup journey: Larkspur built from its 22 files, judged by six personas round after round
SJ = json.load(open(os.path.join(HERE, 'judges_setup.json'))) if os.path.exists(os.path.join(HERE, 'judges_setup.json')) else None
SETUP = [
    ('s01.jpg', 'Twenty-two files and an empty map: each file you read proposes, from its own data, what it holds.', 'Start from nothing'),
    ('s02.jpg', 'What one row is, its key, the kind of thing it describes and what it points at, with real match counts, each open to change.', 'Read a file'),
    ('s03.jpg', 'Each kind the file could be about, with the link that would put it there and how much of the file it covers; Larkspur’s own choice is marked.', 'Choose what it describes'),
    ('s04.jpg', 'Five kinds, the links between them, and what reading found: each gap with its evidence and the same four choices, Pause · Warn · Note · Off; what is there on Feb 1 accepted as known gaps, with your name.', 'Every file in'),
    ('s05.jpg', 'Eight kinds of check, each a plain question with the days it paused or warned, named and drawn across the 56 days; 8 days paused, every count from one record.', 'The checks'),
    ('s06.jpg', 'The 40 tables readers use; the eight watched like files, and Org chain, each with its checks and key named, set Pause · Warn · Note · Off as a file’s checks are.', 'What Larkspur publishes'),
    ('s07.jpg', 'A paused day, cause first: Org units lost a department; App owners and Org chain paused on it; every held output named; each check’s result for the day.', 'A paused day'),
    ('s08.jpg', 'The evidence on the left, every choice on the right: the recommended one first, by Sloane Marsden, with her reason filled in and quoted; the line under it shows exactly what goes on the record.', 'Decide'),
    ('s09.jpg', 'A move of level shows tomorrow as a third frame: publish as is and tomorrow pauses again; accept the level and it doesn’t.', 'Tomorrow, drawn'),
    ('s10.jpg', 'The corrected file arrives on the day it really did, and is decided against what readers already see.', 'A corrected file'),
    ('s11.jpg', 'A rule Larkspur’s owners set ahead, tried on the days so far, applied or left out with what each means.', 'A change to the rules'),
    ('s12.jpg', 'It ends where Larkspur’s demo begins: what you built, and every decision beside the owners’ own.', 'Where the demo begins'),
]
SETUP_PHONE = [('sp1.jpg', 'Phone: from nothing'), ('sp2.jpg', 'Phone: the map, a tap away'), ('sp3.jpg', 'Phone: the checks'), ('sp4.jpg', 'Phone: a paused day'), ('sp5.jpg', 'Phone: deciding'), ('sp6.jpg', 'Phone: where the demo begins')]
def setup_marks():
    if not SJ: return '<p>The judges are still looking.</p>'
    table = scoretable(SJ['rounds'], SJ['cols'], SJ['caption'])
    asked = ''.join(f'<li>{e(x)}</li>' for x in SJ['asked'])
    left = ''.join(f'<li>{e(x)}</li>' for x in SJ['open'])
    quotes = ''.join(f'<p class="quote">“{e(q)}”<span>{e(w)}</span></p>' for q, w in SJ.get('quotes', []))
    return f'{table}{quotes}<h3>{e(SJ["askedTitle"])}</h3><ul>{asked}</ul><h3>{e(SJ["openTitle"])}</h3><ul>{left}</ul>'

page = open(os.path.join(HERE, 'template.html')).read()
page = page.replace('%WALK%', walk()).replace('%WALK_MARKS%', scoretable(VJ['rounds'], VJ['cols'], VJ['caption']))
page = (page.replace('%SETUP_SUB%', e(SJ['sub']) if SJ else '')
        .replace('%SETUP%', ''.join(shot(f, c, t) for f, c, t in SETUP))
        .replace('%SETUP_PHONE%', ''.join(shot(f, c) for f, c in SETUP_PHONE))
        .replace('%SETUP_MARKS%', setup_marks()))
page = (page.replace('%LEVELS%', ''.join(shot(f, c, t) for f, c, t in LEVELS))
        .replace('%CHANGED%', ''.join(f'<li>{x}</li>' for x in CHANGED))
        .replace('%FIX%', ''.join(shot(f, c, t) for f, c, t in FIX))
        .replace('%EXPLORE%', ''.join(shot(f, c, t) for f, c, t in EXPLORE))
        .replace('%DARK%', '<div class="loopcard">' + shot('dark.jpg', 'The same in dark mode: pointing at a kind, deciding in pictures, asking why, and what the pause touches.', 'Dark mode') + '</div>')
        .replace('%POINT%', shot('big-pin.jpg', 'Tap “via 11 datasets” under Controls check applications: the 11 evidence datasets are outlined; tap again to let go.', 'Tapping what carries a link') + shot('big-kind-hover.jpg', 'Point at Platform: the 18 datasets that say where an application runs are outlined.', 'Pointing at a neighbour'))
        .replace('%SWATCHES%', ''.join(f'<div class="sw"><div class="chip2" aria-hidden="true"><span style="background:{lb};color:{lf}">{g}</span><span style="background:{db};color:{df}">{g}</span></div><div><b>{e(n)}</b><div class="u">{e(u)}</div><div class="cr">{e(c)}</div></div></div>' for lf, df, lb, db, g, n, u, c in SWATCHES))
        .replace('%MOTION%', ''.join(f'<div class="mo"><b>{e(t)}</b><span>{e(x)}</span></div>' for t, x in MOTION))
        .replace('%FILM%', ''.join(shot(f, c) for f, c in FILM))
        .replace('%BIG%', ''.join(shot(f, c, t) for f, c, t in BIG))
        .replace('%PHONES%', ''.join(shot(f, c) for f, c in [('p-estate.jpg', 'Phone: the estate'), ('p-kind.jpg', 'Phone: a kind'), ('p-ds.jpg', 'Phone: a dataset'), ('p-decide.jpg', 'Phone: deciding'), ('p-ask.jpg', 'Phone: asking'), ('tab-kind.jpg', 'Tablet: a kind'), ('tab-ds.jpg', 'Tablet: a dataset')]))
        .replace('%JUDGE_INTRO%', e(J['intro']) if J else 'Three personas walked the same five screens.')
        .replace('%MARKS%', marks())
        .replace('%IDEAS%', ''.join(f'<div class="idea"><b>{e(t)}</b><span>{e(s)}</span></div>' for t, s in IDEAS))
        .replace('%SOURCES%', 'Sources: ' + ' · '.join(f'<a href="{u}">{e(n)}</a>' for n, u in SOURCES))
        .replace('%QUESTIONS%', ''.join(f'<li>{q}</li>' for q in QUESTIONS)))
open(os.path.join(HERE, 'index.html'), 'w').write(page)
print('wrote', os.path.getsize(os.path.join(HERE, 'index.html')))
