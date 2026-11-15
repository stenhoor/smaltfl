# The two-minute test (ADR 0012 §7)

The maintainer's measure of the app: *on a phone, find a problem or explore the data and within two minutes give
leadership a clear, easy-to-digest explanation of it and a solution.* This test asks exactly that of a reader who has
only the app's screens.

## Protocol

1. **Capture.** Build the app on Larkspur (`npm run build:app`, which builds `examples/larkspur/flow.json`), then
   capture the day screen for each test day at phone size with `tools/browser/tour.cjs` and a stop set like this:
   ```json
   [{ "name": "lark-mar12", "day": "Tue 12", "full": true }]
   ```
   The days: Tue Mar 12 (a configuration push puts an ingress's WAF in monitor mode), Mon Mar 18 (the HR extract
   drops a department without reassigning its teams), Mon Mar 25 (a certificate authority's intermediate expires: TLS
   and log forwarding fail together), and a calm day (Fri Mar 1). ADR 0020 §5 is their answer key. (Until 2026-11-15
   the test ran on the retired taxi example's real days.)
2. **Judge.** Two judges, each an agent given one screenshot at a time and nothing else, told they have two minutes
   and must write what they would send leadership: what happened (one sentence), its impact, its cause as far as the
   screen shows it, and the fix they propose. One judge is an on-call data engineer; the other a newcomer who has never
   seen the app. Each also says what they could not tell from the screen.
3. **Grade** each answer against the day's facts (ADR 0020 §5's answer key) on five points, each 0 or 1: the day and what happened are right; the number or time is right; the impact
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
