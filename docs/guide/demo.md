# A walk through the demo

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
browser.

The data is synthetic, from a fixed seed, with six months of history before March 2024. Trouble is planted in March at
every layer:

- files that arrive wrong;
- files that are fine alone but wrong together;
- look-alikes: days that look like trouble and aren't, which must publish.

Nothing that judges the days knows where the trouble is planted. The first day takes a few seconds while the engine
starts and runs the whole flow, about a hundred steps.

March opens complete. The build ran every day and recorded it, with what happened next: the files sent again and who
decided what, when and why (the recorded story, below). The month screen draws it at once. Opening a day runs it again
in your browser, on the version readers got, judged against the recorded days before it, and the line under the day
says whether its datasets and holds are the same as the record's.

## The flow

The canvas shows six notebooks, bronze to gold:

- **bronze**: every daily file as it arrived, each with a gate. The gate checks the file's columns, its amount, its
  key and the applications it should cover. It also checks values against the bands the ontology writes, and that
  the file is a fresh export, not yesterday's file again.
- **org**: the organisation, conformed. Each unit has its chain up to the group, and the leader it answers to: its
  own, someone acting, or the one above. Its rules: no loop, one root.
- **apps**: the applications, conformed: ids cleaned, the newest record kept.
  - Each application has an owner chain through its team. One whose chain doesn't resolve is kept under
    **Unassigned**.
  - Cloud resources tagged with an application nobody registered are listed apart.
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

## A calm day

**Fri 1** opens first: *A normal Friday*. Open **Results**, which starts with **Control Posture v1** as its consumers
read it, from the published datasets alone:

- six tiles: the group's score and grade, coverage beside it, the applications and the critical ones, the critical
  applications failing, the items overdue and the exceptions expiring;
- the score on each day published;
- the organisation as a tree, the lowest scores first.

A team opens to its applications' scorecards and its remediation queue, each application with what it fails.
Unassigned opens to the applications whose owner chain doesn't resolve.

## A look-alike: the reorg

**Mon 11.** Seven teams move from one business unit to another. Unfold **product** and open **dim_app**. Its **News**
says BU-05's share of the applications doubled and BU-02's fell, and that this *follows app_owners*, where the teams'
new chain shows. Nothing is wrong, and the day publishes.

## A held day

**Tue 12: a platform, not a hundred applications.** Open Tue 12 from the month. The status line says the day is
paused: *waf: Status fail: 22.7% (band 0%–15%)*. The WAF file's **Quality** tab draws its failing share against the
band the ontology writes: 22.7% of its applications fail, where the band allows 15%.

Unfold **posture** and open **platform_impact**. Its **What happened** names the cause, `ing-east-3`. That ingress
carries 7.6% of the day's failing and unassessed results, where 0.5–2.0% is usual. A configuration push put its WAF in
monitor mode, so every application behind it fails the WAF at once.

In **product**:

- **org_posture** has each unit's score, with its leader;
- **remediation_queue** has a row for each failing application, with its owning team.

Nothing that reads the WAF was published while the day waited. That morning the security lead, Sloane Marsden,
published it as is, with her reason: the ingress really was in monitor mode overnight, so the failures are real. The
day's head shows her decision, and its story when it was taken. The fix itself is one configuration change at the
ingress.

Two days still wait for you: **Sat 23** and **Thu 28**. **Decide ›** opens the choices the day allows, each with what it
publishes and whether it can be undone: publish as is, with a reason, or keep it back. One choice decides every file
that holds the day. Larkspur's flow has no fill step, so no file is filled from another day.

## The join that lost 95 applications

**Mon 18.** Every file arrived well formed; the day was held in silver. HR sent the extract again that morning, and the
day opens on that version, the one readers got. Its first version, as it arrived, is **v1** in the day's versions:
open it.

1. Unfold **org** and open **org_chain**: *4 of 245 rows broke one_root, a rule that stops the day*. A department was
   dissolved in the HR system and its four teams weren't moved, so they no longer reach the group.
2. Unfold **apps** and open **app_owners**: *95 of 2,410 rows broke owner_chain*. Those applications lost their owner
   chain. They are kept under UNASSIGNED, not dropped, and the step fails.

What reads the chain waited: the organisation, the applications and the posture by unit. What doesn't read it
published: each application's statuses and scorecard read its team, which is still there. The extract sent again moves
the four teams under their new department, the chain is whole, and the security lead published it.

## Contracts

**Thu 21.** The TLS file arrived with its rows twice, and bronze held it by its key: *tls: 815 apps repeat a key*. Open
its first version, **v1**: the doubled rows flow through, and in **product**, **failing_by_unit**'s **Checks** say its
rows repeat a key too. The TLS team sent the file twice more that day: v2 still repeated rows and was kept back, and v3,
every certificate once, was published.

Its **Contract** tab, like every gold dataset's, says what its consumers rely on:

- its id, version and status, and whether the run on screen kept it;
- what it is for;
- each column: its type, whether it is part of the key or required, its classification and its values;
- its service levels: daily, available by 07:00 UTC.

## One cause behind two controls

**Mon 25.** The **tls** card warns: 8.9% of its applications fail, above their usual share. On its own, that is a rise
within reason.

Open **platform_impact**: it names `ca-int-2`, a certificate authority whose intermediate certificate expired behind
an ingress. TLS ends at that ingress, and log forwarding uses the same certificates, so the applications behind it fail
both controls. Nothing holds the day: the platform says what the failures have in common.

## The posture over the month

The band above the month's calendar draws the group's score on each day published, as recorded. For each unit's own
line, **Check every day here ▶** runs the month in your browser, checking each day against its record. Once Sun 31 has
run, Results reads the whole month:

- The group's score falls 1.6 points, from 93.6 on Fri 1 to 92.0 on Sun 31.
- Each segment's and business unit's change sits beside its sparkline.
- One business unit's score rises: Underwriting's, from 94.7 to 95.8. That is a new leader's remediation push.
- The other fifteen fall, from 0.1 to 5.1 points:
  - the change freeze's late fixes;
  - the teams moved in the reorg fixing more slowly while they are handed over;
  - the new control's missing evidence.

No day's judge says the push: it is too steady to stand out on any one day, so it shows as a trend.

## The other planted days

As the app says them when the days are run in order:

| Day | What happened | What the app says |
|---|---|---|
| Mon 4 | The MFA file arrives empty | Paused: *mfa: Almost no apps: 0* (bronze, its amount) |
| Tue 5 | The scanner's upgrade writes statuses and severities in capitals | The findings file warns of new values. Silver lower-cases them, so the day publishes |
| Wed 6 | The backup file is Tue 5's again | Paused: *backup_jobs: The same file as Tue 5's* (bronze, `fresh`) |
| Thu 7 | The logging file lacks a column | Paused: the file is refused and nothing is built (bronze, the schema). The Ontology view's row for the file says *file refused* |
| Fri 8 | Key rotation passes where encryption fails | Paused: *57 applications: key_rotation status pass needs encryption not fail* (silver, the needs rule) |
| Sat 9 | An agent reinstall makes old findings look new | The findings file warns: *Status new: 3.2%*. Silver keeps each finding's first date, so nothing becomes less overdue. Published |
| Wed 13 | WAF rows for applications that aren't internet-facing | Paused: *waf: 50 apps out of scope* (bronze, the scope) |
| Thu 14 | February's Patch Tuesday findings fall due | Published |
| Fri 15 | 46 exceptions expire unrenewed | Unusual: failures whose reason is the expired exception, not a regression. Published |
| Sat 16, Sun 17 | A site's scanner can't log in | Unusual: those applications are not assessed, not clean. Published |
| Tue 19 | A site's backup controller is down | Paused: *backup_jobs: Status not_assessed: 23.2% (band 0%–5%)*. platform_impact names `bkp-dc-east` |
| Wed 20 | A CMDB sync writes duplicates, a few with another owner | apps keeps the newest record and notes the conflicts (*Owner_conflict yes: 0.5%*, band 0%). Published |
| Thu 21 | The TLS file arrives twice | Paused: *tls: 815 apps repeat a key* |
| Sat 23 | DR exercises due Fri 22 ran late; a new cloud account tags resources with an application nobody registered | Paused: *dr_exercises: Late: 111 of 193 due*. shadow_assets warns of the new tags, which gold counts under Unregistered |
| Tue 26 | No TLS rows for one business unit's internet-facing applications | Paused: *tls: 39 in scope with no app* (the scope) |
| Wed 27 on | The catalogue adds a control with no evidence feed yet | Unusual until Sat 30: more results, said as no data and not as failing. Published |
| Thu 28 | An HR error makes a VP report to one of their own directors | Paused: *6 of 245 rows broke no_loop* (silver, org_chain) |
| Fri 29 | Quarter-end access reviews | The access reviews file has no quality issues. Published |

## What happened next: the recorded story

Each paused day was decided in the record, by the security lead, or a file was sent again for it
(`examples/larkspur/story.json`). The month marks each: ↻ corrected, with its count of versions; ⚑ published as is; ⊠
kept back; ‖ still waiting.

| Day | What happened next |
|---|---|
| Mon 4 | Kept back at 08:10: the export came through empty. The vendor ran it again overnight; the real file arrived at 02:40 on Tue 5 and was published. ↻2 |
| Wed 6 | Kept back: the backup file was Tuesday's again. Wednesday's own export arrived early on Thu 7 and was published. ↻2 |
| Thu 7 | The logging team sent the file again that morning with `retention_days` back, and it was published. ↻2 |
| Fri 8 | Kept back while the vault team checks its feed. ⊠ |
| Tue 12, Wed 13, Tue 19 | Published as is, each with its reason. ⚑ |
| Mon 18 | HR sent the extract again with the teams under their new department, published. ↻2 |
| Thu 21 | Sent again with half its repeats out, still wrong, kept back; then sent again, every certificate once, published. ↻3 |
| Tue 26 | Kept back while the scanner team looks for the missing business unit. ⊠ |
| Sat 23, Thu 28 | Still waiting for you. ‖ |
| Sat 16, Sun 17 | On Mon 25 the findings' values check was set back to hold the day, back-dated to Fri 1: the scanner hadn't logged in that weekend, and the posture read far fewer findings than there were. Every day already run ran again under it; these two would now be held, and the security lead restated them as not published. The other 23 came out the same, and were noted. |

The rules changed twice ([ADR 0021](../adr/0021-time) §5): on Fri 15 the WAF band was tightened to a tenth from Mon 18,
which reached no day already run, and on Mon 25 the back-dated change above. The **Ontology** view lists the four
versions of the rules this makes, each with where and when it was in force, and compares any two.

A file sent again is a version of its day, like a commit. It waits for a decision whatever its checks say, and the
history learns the day from the version that was published. Open a day: its versions are listed under its head, the one
readers got marked, and any other is a tap away. A version a later one replaced isn't decided; the later one is.

**Compare** on another version sets it beside the one on screen. The summary comes from the two runs alone: which file
differs, whether the rules were the same, what was decided of each, and each output's rows and whether it changed.
**Rows ›** on an output compares its rows by its key. On Thu 21, fact_control_status's 815 keys are on two rows in v1
and one in v3: the doubled TLS file's repeats. Rows are read from both versions run in your browser, so the comparison
offers to run the one that hasn't.

On the month, from tablet width, the grid's filters show only the days waiting for a decision, corrected, or held.

## Checks

A bronze file opens to **Quality**: a verdict, a card for each thing to look at with its picture, and every check by
where it comes from (the ontology, the file's contract, its own history), each with its mode. A step's or a gold
dataset's **Checks** tab shows its gate the same way. A written check holds a day. A learned one warns, unless the
value is one the ontology marks bad. On a gold card, the seal says the run's gates passed, or its holds were decided,
and is signed by the owner.

## The ontology

The **Ontology** view lists each file with what its columns mean and the checks its rows are held to, each saying how
it came to be. Larkspur's ontology has the organisational unit, the person, the application, the platform and the
control, with their links. An application's id is the same whatever its case and the spaces around it. The owner can
rename a column, reword its meaning, label its values and add a rule.

## Models

On a watched dataset, **Models** shows the two checks nobody wrote:

- The isolation forest scores the day against the days it learned from, with what moved most.
- The classifier asks whether today's rows can be told apart from like days'. On Tue 5 it tells the scanner's capitals
  apart at once.

Neither holds a day.

## The record

The **Record** view lists every run made in your browser with its manifest's hash, and **verify** recomputes a run from
its inputs. Every decision is an entry in a hash-chained record. The audit bag downloads the run, the record and the
files for an offline check (`node scripts/audit.mjs check BAG.zip`). The build's own runs of March are told day by day:
on the month, and in each day's story.

## The control estate

**[The control estate](/estate/){target="_self"}** is the month the gates were built against (ADR 0014): 600
applications and twelve controls, kept as a regression. [Its walk](./estate) goes day by day.
