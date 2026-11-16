# The two-minute test (ADR 0012 §7)

The maintainer's measure of the app: *on a phone, find a problem or explore the data and within two minutes give
leadership a clear, easy-to-digest explanation of it and a solution.* This test asks exactly that of a reader who has
only the app's screens.

## Protocol

1. **Capture.** Build the app on Larkspur's tour (`npm run build:app -- --variant tour --out dist/app-tour`,
   ADR 0023), then capture the day screen for each test day at phone size with `tools/browser/tour.cjs` and a stop set
   like this:
   ```json
   [{ "name": "tour-mar05", "day": "Tue 5", "full": true }]
   ```
   The days are the tour's scenes (ADR 0023 amendment 1: over February and March): Tue Feb 20 (the scanner writes its
   values in capitals: a warning, published), Mon Feb 26 as it arrived (`"version": 1`: the MFA export empty, held by a
   written check), Tue Mar 5 (a planned migration moves a third of the logging file to the cloud pipelines: a learned
   check holds it, and it was real), Mon Mar 11 as it arrived (`"version": 1`: the backup export mislabels a third of
   its completed jobs: a learned check holds it, and it was an issue), and a calm day (Wed Feb 7). The tour's answer key
   (`test/larkspur-tour.test.ts`) is their facts.
   (Until 2026-11-16 the test ran on Larkspur's planted month, and until 2026-11-15 on the retired taxi example's real
   days.)
2. **Judge.** Two judges, each an agent given one screenshot at a time and nothing else, told they have two minutes
   and must write what they would send leadership: what happened (one sentence), its impact, its cause as far as the
   screen shows it, and the fix they propose. One judge is an on-call data engineer; the other a newcomer who has never
   seen the app. Each also says what they could not tell from the screen.
3. **Grade** each answer against the day's facts (the tour's answer key) on five points, each 0 or 1: the day and what happened are right; the number or time is right; the impact
   (what waits, what readers see) is right; the proposed fix is one the app offers and fits; nothing false is stated.
   A calm day scores on saying nothing is wrong and proposing nothing.
4. **Record** the scores in docs/HANDOFF.md's table of rounds, with the build they were taken on, and open a fix list
   from what the judges could not tell.

## Why these rules

- The reader gets screens, not the data: the test is of the app's words and drawings (ADR 0008 §5's budgets, ADR 0012
  §1's one sentence), not of the reader's skill.
- Two readers, one expert and one new: the brief is for leadership, who are the newcomer.
- Facts first: a brief that reads well but states a false number fails (Knaflic's rule, and the honesty lens of the
  earlier rounds).
