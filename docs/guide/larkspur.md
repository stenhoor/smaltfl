# Larkspur's planted month

**[Open Larkspur's planted month](/larkspur/){target="_self"}** beside this page. It is the month ADR 0020's answer key
was built against, kept beside [the tour](./demo): the same group, the same flow and the same six months of history,
with trouble planted in March at every layer:

- files that arrive wrong;
- files that are fine alone but wrong together;
- look-alikes: days that look like trouble and aren't, which must publish.

Nothing that judges the days knows where the trouble is planted. The tour picks six scenes of what a flow does; this
month has every planted day, and what happened next in its recorded story. It is also where the posture is read over
the whole month, the rules change twice, a back-dated change restates two days and a what-if run is made the day's.

The flow is the tour's: [six notebooks, bronze to gold](./demo#the-flow).

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

Some days still wait for you, among them **Sat 23**, **Sun 24** and **Thu 28**. **Decide ›** opens the choices the day
allows, each with what it publishes and whether it can be undone: publish as is, with a reason, or keep it back. One
choice decides every file that holds the day. Each evidence feed has a fill step, so a feed's file can also be filled
from another good day, marked: on Sun 24 the DR exercises file, held by a learned check that moved a third of its rows,
can carry Fri 22 forward.

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
| Wed 6 | Filled from Tue 5: the backup file was Tuesday's again, so Tuesday's statuses were carried forward, marked. Wednesday's own export arrived early on Thu 7, replaced the fill and was published. ↻3 |
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

**What if… ›** on a day runs it again on any of its files under any of those versions, apart from the record. On Sat 16,
under the rules as shipped, it would have passed, where readers got it restated and held. On Thu 21, on the TLS file
as it first arrived, it would be held where the repeats reach gold. **Make this the day's ›** makes a what-if the day's
in one tap, with a reason:

- Sat 16 takes the rules as shipped for that day only and is restated, published.
- Thu 21's first TLS file goes in as sent again, a fifth version published as is.

A file sent again is a version of its day, like a commit. It waits for a decision whatever its checks say, and the
history learns the day from the version that was published. Open a day: its versions are listed under its head, the one
readers got marked, and any other is a tap away. A version a later one replaced isn't decided; the later one is. Every
day you decide or correct is earlier than Sun 31, so readers stay on Sun 31. The day keeps its version as its own:
"Published as is · readers stay on Sun 31".

**Compare** on another version sets it beside the one on screen. The summary comes from the two runs alone: which file
differs, whether the rules were the same, what was decided of each, and each output's rows and whether it changed.
**Rows ›** on an output compares its rows by its key. On Thu 21, fact_control_status's 815 keys are on two rows in v1
and one in v3: the doubled TLS file's repeats. Rows are read from both versions run in your browser, so the comparison
offers to run the one that hasn't.

On the month, from tablet width, the grid's filters show only the days waiting for a decision, corrected, or held.
