# The tour

**[Open the demo](/app/){target="_self"}** beside this page. It is **Larkspur**, a fictional financial-services group,
as its systems export it each day:

- from HR, the organisation and its leaders: five segments, sixteen business units and about 250 units in all;
- from the CMDB, about 2,400 applications, each owned by a team;
- the cloud inventory;
- 46 shared platforms: clusters, ingresses, certificate authorities, backup controllers, scanners;
- a catalogue of 14 controls mapped to the frameworks;
- the risk register and the findings ledger;
- twelve evidence feeds, one a control.

Twenty of these files arrive each day, about 28,000 rows; the platforms' two files are fixed. All of it runs in your
browser. The data is synthetic, from a fixed seed, with six months of history before February 2024.

The demo is a tour of what a flow does, over a February and a March made for it: six scenes, a week or so apart, and
calm days between them. The tour's world is steady, so only its scenes stand out; a few calm days still carry a learned
check's note, marked unusual, as any long-running flow's judges will now and then. The month screen lists the scenes
behind **What this demo shows**, a bar at its head: tap it, and each scene has what happened and links to the places
to look: a day, a version of it, a card's tab or the day's decision. This page follows the same list. Nothing that
judges the days knows where a scene is planted.

The two months open complete. The build ran every day and recorded it, with what happened next: the files sent again,
and who decided what, when and why. The month screen draws it at once. It opens on March: the day that still waits
for you, the month in a sentence beside February, a calendar with each day marked by what became of it, and each file
as a row of the month's days. ‹ goes to February. Tap a day to read what happened to it, in order. Opening a day runs
it again in your browser, on the version readers got, judged against the recorded
days before it, and the line under the day says whether its datasets and holds are the same as the record's. The first
day takes a few seconds while the engine starts and runs the whole flow, about a hundred steps.

## The flow {#the-flow}

Larkspur is five flows, four of them read by the fifth ([ADR 0025](../adr/0025-flows-in-flows.md)). The canvas shows
the top one, the posture product, with each flow it reads as **one card**, a second sheet behind it:

- **Inventory**: the applications' register and the cloud assets, each file with its gate.
- **HR organisation**: the units and the people, conformed. Each unit has its chain up to the group, and the leader it
  answers to: its own, someone acting, or the one above. Its rules: no loop, one root.
- **Evidence feeds**: the findings ledger and the twelve evidence feeds, a control each, as their tools export them.
  Each file has a gate, which checks its columns, its amount, its key and the applications it should cover against the
  Inventory's list; values against the bands the ontology writes; and that the file is a fresh export, not
  yesterday's again. Each feed has a fill step, so a day missing one can be filled from another day, every row marked
  with the day it came from (`filled_from`).
- **Applications**: the applications, conformed, from the other three: ids cleaned, the newest record kept.
  - Each application has an owner chain through its team. One whose chain doesn't resolve is kept under
    **Unassigned**.
  - Cloud resources tagged with an application nobody registered are listed apart.

A flow's card says what its day came to, by the month's marks: a tick and what it has on a normal day; **‖** and the
file that holds it, with how many of its files that is (*access_rev… · 1 of 13*), on a day it is paused; how the day
went out once someone decided. A flow with nothing wrong of its own whose outputs wait behind another flow's hold says
*Waits on* that flow. Never a score, never an average.

Tap a card for the flow's sheet: its day in a sentence, what holds it (a tap from the file inside), the flows it reads,
and what it gives, each dataset with whether today's went out and who reads it. **Open the flow ›** (or a double-click
on the card) shows the flow's own canvas, with a line at the top that says where you are and goes back. Inside, it is
the same run: every card shows the day on screen. Each level has a link of its own (`#day/2024-03-27/in/feeds`).

Each dataset a flow gives has **Explore ›** on the sheet, and every file and published table has an **Explore** tab
([the app guide](./app#explore)). Try the TLS file on Thu Mar 7: tap *Fail* under Status, and the 40 failing
certificates are every one of the 22 still on TLS 1.0. **How it joins** counts it against the inventory's applications
in scope, with the match day by day; **Against another day** lists the rows that came, went and changed.

Beside the four cards are the posture product's own three files (the control catalogue, what each control requires,
the exceptions) and its notebooks:

- **bronze**: its own three files, each with a gate.
- **evidence**: every evidence feed as one long table, and the vulnerability SLA, told from the findings ledger.
- **posture**: what applies to each application and the evidence for it.
  - Each pair of an application and a control gets an effective status with its reason: pass, fail, compensated,
    excepted or not assessed.
  - What to fix.
  - Each platform's share of the day's failures (`platform_impact`).
- **product**: the gold data product, Control Posture v1. It holds:
  - the organisation, the applications and the controls;
  - each pair's status, and the findings;
  - a scorecard an application, and the posture a unit;
  - the exceptions and the remediation queue.

  Each dataset has a contract.

Tap a notebook's box to read it as a page: each step's code, its output under it, what a rule caught and the day's
news about it. **Your cells** at the bottom take SQL of your own over any dataset by name. They are kept in your
browser and change nothing the flow computes.

As the owner, build on it ([the app guide](./app#building-in-the-app)). **Add a flow ›**, above the canvas, lists
three flows made already:

- *Ownership* and *Certificates* are added as they are: a card each, built from the day's run.
- *Control by unit* has no dataset of its own to read: it is **used** on the evidence feed you pick. Use it on the TLS
  feed, then again on the WAF's with a floor of 99.5: two flows of the one definition, each with its own card, its
  own datasets and its own hash in the run. Inside each, its inputs show where their rows come from.

On any dataset's **How it joins**, a form writes a join as a notebook cell, and the joined dataset is there to explore.
What you make is recorded, kept in your browser, and taken back one at a time or with *Back to the flow as shipped*.

## 1. A normal day {#normal}

**Wed Feb 7.** Every file arrives and every check passes: the status line says *A normal Wednesday*, the day head
*Published*, and the line under it that the run here has *the same datasets and holds as the record*. Nothing waits
for anyone. Open **Results**, which starts with Control Posture v1 as its consumers read it, from the published
datasets alone:

- six tiles: the group's score and grade, coverage beside it, the applications and the critical ones, the critical
  applications failing, the items overdue and the exceptions expiring;
- the score on each day published;
- the organisation as a tree, the lowest scores first.

A team opens to its applications' scorecards and its remediation queue, each application with what it fails.
Unassigned opens to the applications whose owner chain doesn't resolve.

## 2. A warning, and what to do about it {#warning}

**Tue Feb 20.** The scanner's upgrade writes its statuses and severities in capitals. The findings file's **Quality**
tab has *3 things to look at*: the usual values gone (*Severity medium: none*, where 30–31% is usual), *New severity
values: 5* (MEDIUM, INFO, HIGH, LOW and CRITICAL, never in 203 days of history), and the classifier telling *today's
findings look very different from earlier days*, the status column most of all. Each is a learned check, which *only
warns: the day still goes out*, marked. Silver lower-cases the values, so nothing it builds changes.

Each warning's **More** offers what to do about it:

- **Mark as expected**, with a note: the day is told as a note from then on;
- **Tell the source**: a note drafted to whoever publishes the file;
- **Open an incident**, with a note: its days are left out of what a usual day is learned from.

On the **Ontology** page, the owner can also add a rule that holds a column's values to a list, from a day they pick.

## 3. A written check holds a file, and the file sent again fills it in {#held}

**Mon Feb 26.** The MFA export arrives empty. Open the day's first version, **v1**, *as it arrived*: the file's
**Quality** tab says *2 issues: the day is held*. *Almost no apps: 0*, where a day like it has 2,312 to 2,320, and
*2,318 in scope with no app*, the applications the file should cover. Both are written checks, which *stop the day going
out*. What reads the MFA file waits, and readers keep Sun Feb 25.

The security lead kept the day back that morning: *The MFA export came through empty: the vendor runs it again tonight*.
The real file arrived at 02:40 on Tue Feb 27. A file sent again is a version of its day, like a commit: it waits for a
decision whatever its checks say, and the security lead published it, *The full export, checked against the directory*.
The day opens on that version, the one readers got, and lists its two versions under its head, each a tap away.

## 4. An anomaly that was real {#real}

**Tue Mar 5.** A planned migration moves a third of the logging file's applications from the data centres' log pipeline
to the cloud's, overnight. No written check is broken: the file's columns, amount and key are as they should be. The
**Quality** tab draws the pipelines' shares against their usual bands: *Pipeline log-dc: 8.2% (usually 42.9–43.1%)*.
That check only warns, but *35% of the day's rows moved; from 25%, a learned check holds the day* (Q-132).

The security lead published it as is, with a reason: *The data centres' healthy applications moved to the cloud log
pipelines overnight, as planned: the change is real*.

**Wed Mar 6.** The new mix holds the day again: a lasting change keeps pausing until someone accepts it (Q-86). The
owner accepted the new level, *The migration is done: the cloud pipelines carry the data centres' logs from now on*, and
the day head says *New level from Wed 6*. **Thu Mar 7** is judged at the new level: no learned check sets the logging
file apart, and the day publishes. The forest and the classifier leave out the pipeline column while the days they learn
from reach back before the new level. One step after it notices the move once: `platform_impact` warns that the data
centres' pipeline carries fewer of the day's failures than usual, *Platform_id log-dc: 9.1% (usually 10–13%)*.

## 5. An anomaly that was an issue, filled and then corrected {#issue}

**Mon Mar 11.** The backup export writes a third of its completed jobs as partial. Open the first version, **v1**:
*Last_state COMPLETED: 64% (usually 94–97%)*, with *Last_state PARTIAL: 33%* where 0.4–1.5% is usual. The check only
warns, but a third of the day's rows moved, so it holds the day.

The security lead filled the day from Sun Mar 10: *A third of the backups can't have finished partly overnight while
their statuses still pass: the export mislabelled them. Sunday's file carries forward, marked as Sunday's, until the
backup team sends Monday's again.* While they waited, readers got Sunday's backups, every row marked as Sunday's.

**Wed Mar 13.** The backup team fixed its export and sent Monday's file again: version 2, published once decided,
*Monday's own file, every backup as it ran*. It replaced the fill. The day opens on it, and v1, as it arrived and as it
was filled, is the version before.

## 6. Fills each way, and one file replaced {#fills}

- **Thu Mar 21, one file replaced.** The TLS file arrives with its rows twice: bronze holds it by its key, and gold's
  fact_control_status, built from it, doesn't reconcile, *815 rows repeat a key*. Of the day's twenty files only TLS
  is sent again that afternoon. It replaces v1 before anyone decides, and is published: *Every certificate once*.
- **Sat Mar 23, filled backward.** The EDR file comes through empty. The day head says *Filled from Sun 24*, with its
  reason: *The EDR console's Saturday export came through empty. Nothing is deployed at the weekend, so Sunday's file
  stands for Saturday too: carried back, marked as Sunday's.*
- **Wed Mar 27, yours to decide.** The access reviews file comes through empty, and the day waits for you. **Decide ›**
  opens what readers get, each choice drawn: **Keep Tue 26**, recommended, as something is wrong in the rows;
  **Publish as is**, with 0 applications; or **Fill from Tue 26**. Pick the fill and choose **Wed 20** among its days,
  the same weekday a week before: *Wed 20 stands in: an estimate*, for a file whose rows follow the week.
  - The file is Evidence feeds', so the decision is too: the sheet's head says *Evidence feeds’ to decide*, and links
    to **[Evidence feeds’ page](/feeds/#day/2024-03-27){target="_self"}**, the same flow on the same files with a
    record of its own. Decide the day there instead, then come back: the estate's page has taken the decision, and its
    receipt says *Decided on Evidence feeds’ page, and carried here: nobody was asked twice*. It works the other way
    round too.

## More to see {#more}

Two stories for silver and gold, which the scenes don't show.

### The join that lost its applications

**Fri Feb 16.** Every file arrived well formed; the day was held in silver. Open its first version, **v1**:

1. Unfold **org** and open **org_chain**: a department was dissolved in the HR system and its teams weren't moved, so
   they no longer reach the group, and the chain's rules stop the day.
2. Unfold **apps** and open **app_owners**: *95 of 2,400 rows broke owner_chain, a rule that stops the day: they were
   kept, and the step failed.* Those applications lost their owner chain, and are kept under UNASSIGNED, not dropped.

What reads the chain waited: the organisation, the applications and the posture by unit. What doesn't read it
published. HR sent the extract again that morning with the teams under their new department, the chain was whole,
and the security lead published it: *Every team has a department again, and every owner chain is whole*.

### One cause behind two controls

**Mon Mar 18.** A certificate authority's intermediate certificate expires behind an ingress. TLS ends at that ingress,
and log forwarding uses the same certificates, so the applications behind it fail both controls. Unfold **posture**
and open **platform_impact**: its **News** names `ca-int-2`, *Platform_id ca-int-2: 4.9% (usually 0.4–1.2%)* of the
day's failing and unassessed results. Nothing holds the day: the platform says what the failures have in common.

## Checks

A bronze file opens to **Quality**: a verdict, a card for each thing to look at with its picture, and every check by
where it comes from (the ontology, the file's contract, its own history), each with its mode. A step's or a gold
dataset's **Checks** tab shows its gate the same way. A written check holds a day. A learned one warns, unless the value
is one the ontology marks bad, or it moved a quarter of the file's rows (scenes 4 and 5). On a gold card, the seal says
the run's gates passed, or its holds were decided, and is signed by the owner. A day the history has nothing like isn't
judged by what was learned: Mon Feb 19, Presidents' Day, comes before any holiday of its kind in the history, so the
hr_people file's Quality tab says *No quality issues: 5 checks passed, 6 not judged yet*, the month says of the day
that twenty datasets weren't judged, and the day is published.

## The ontology

The **Ontology** view lists each file with what its columns mean and the checks its rows are held to, each saying how
it came to be. Larkspur's ontology has the organisational unit, the person, the application, the platform and the
control, with their links. An application's id is the same whatever its case and the spaces around it. The owner can
rename a column, reword its meaning, label its values and add a rule, each from a day.

## Models

On a watched dataset, **Models** shows the two checks nobody wrote:

- The isolation forest scores the day against the days it learned from, with what moved most.
- The classifier asks whether today's rows can be told apart from like days'.

Neither holds a day.

## The record

The **Record** view lists every run made in your browser with its manifest's hash, and **verify** recomputes a run from
its inputs. Every decision is an entry in a hash-chained record. The audit bag downloads the run, the record and the
files for an offline check (`node scripts/audit.mjs check BAG.zip`). The build's own runs of February and March are told
day by day: on the month screen, and in each day's story. **What if… ›** on a day runs it again on other files or rules,
apart from the record, and **Compare** puts any two versions of a day side by side.

## The other demos

- **[Evidence feeds’ own page](/feeds/){target="_self"}**: one of the estate's flows as a page of its own, on the
  tour's two months: its thirteen files and Inventory's, its own month and record. A paused day decided here or on the
  tour is carried to the other ([how](./app#a-flow-that-reads-flows)).
- **[Larkspur's planted month](/larkspur/){target="_self"}**: the same group with trouble planted at every layer, the
  month ADR 0020's answer key was built against: the posture over the whole month, the rules changed twice, a
  back-dated change restating two days. [Its walk](./larkspur) goes day by day.
- **[The control estate](/estate/){target="_self"}**: the month the gates were built against (ADR 0014), 600
  applications and twelve controls, kept as a regression. [Its walk](./estate).
- **[The sign-in log](/signins/){target="_self"}**: a year of generated sign-ins, the shared ontology's rules and
  fixes, two days only the models see, and two days whose files changed their columns.
