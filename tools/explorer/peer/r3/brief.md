# Peer round 3: the owner's screens, inside the journeys

S = /tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad. You are one of five reviewers.
This round changes how we work, because the owner looked at the product and told us what fails.

## What the owner said: the failing examples

Their screenshots are in `S/peer/r3/owner-feedback/`. Open every one. Their words:

1. **Estate map** (`1-estate-map.png`): "the things that say wait on are too many words just have an icon that shows 2
   notifications and let me scroll over to find out more. Also the links between sometimes have too many words like just
   say an organization is made up of people."
2. **Today:** "set the demo up like the problem showed up today so it feels more realistic. I get we have to pick a date
   in the past but that would be a nice touch."
3. **Ask why it's paused** (`2-ask-why-paused.png`): "its again all words … the visual of the normal vs today could make
   that easier to understand more quickly probably more like the How has access reviews been this month"
   (`3-ask-this-month.png`, which they liked).
4. **Look inside MFA** (`4-mfa-look-inside.png`): "feels maybe too busy. I like the what is this, the image seems
   confusing at first glance and I would rather discover the more in detail stuff if I want to dive in so I am not
   overwhelmed."
5. **Decide on Wed:** "the decide on wed side panel feels very busy and I don't know what to immediately focus on. same
   thing on the left main panel I don't know why a lot of the info is there."
6. **The file's view** (`5-access-reviews-view.png`): "I am confused by the links they don't appear to give much except
   for the application one but I don't understand the impact or point of that immediately. the built from it section
   is also super busy and unclear to me the point or value of it."
7. **Journeys matter:** walking through a whole problem is still important. They review screen by screen, but the
   screens live in journeys.

## The seven tests

A screen that fails any test doesn't score. These are the owner's words turned into checks.

1. **Counts are icons.** No sentence for a count: ⧗ 2, with hover, focus or tap for the list.
2. **A link is two to four words** ("made up of", "owned by", "runs on"). Full sentences on hover.
3. **One focus.** A first-time viewer names it within five seconds, from the screenshot alone.
4. **Every block answers "why is this here?"** in the user's terms (what it tells me, or what I can do). If it can't,
   it folds or goes.
5. **Pictures before words**, in answers too, as "How has Access reviews been this month?" does. Text at most one line.
6. **Detail on demand.** First what it is, its state and one number. Charts, columns, joins and "built from it" behind a
   tap.
7. **Today is today.** The demo's current day reads "Today", with the date small. The data stays in the past.

Words still count (decision screens at 250 or fewer, others at 200 or fewer, counted by `S/peer/tools/render.cjs`), but
they come after the seven tests.

## The journey that starts where the owner starts

`S/scripts/v5_today.cjs` is a new walkthrough, `5-today`. On Wed Mar 27, Access reviews arrives empty, and you:

1. see it on the estate map (steps 01 to 03);
2. ask Ctrl K why it paused (05) and how the month went (06);
3. look inside MFA (07);
4. open Access reviews (09 and 10);
5. decide (12).

Its steps as editable pages, with screenshots and captions, are in `S/peer/snap4/5-today/`. Words per step:
`S/peer/words-r37-today.txt`.

The other five walkthroughs (`S/scripts/v1_setup.cjs` … `v4b_outlier.cjs`, seeds in `S/video/`; see
`S/peer/r1/brief.md` for how to run them) must keep passing too.

## Your screen

One owner per screen, so nothing is built twice.

| screen | owner | its focus, in one sentence | in the journey |
|---|---|---|---|
| Estate map, banner and **Today** | design | "Today one file paused; this is what waits on it." | 5-today 01–03 |
| Decide on the estate | owner | "Pick what readers see: the recommended choice is ready." | 5-today 12 (and Decide in v2, v4a, v4b) |
| Ctrl K answers | newcomer | "The answer, as a picture of today against usual." | 5-today 05, 06 |
| Ctrl K look inside | dq | "What this file is and whether it's fine today." | 5-today 07 |
| The file's view | builder | "This file, its state, and what depends on it, said simply." | 5-today 09, 10 |

design owns the **Today** label everywhere. Make it one helper the rest of the app can call. The others don't hardcode
the current day's date anywhere new.

## What you produce, in `S/peer/r3/<you>/`

1. **A working fix of your screen.**
   - Copy the app: `sh S/peer/tools/copyapp.sh S/peer/r3/<you>/app`.
   - Your CSS goes in one block at the end of the page's `<style>`, marked `/* peer:<you> start */ … end */`. JS changes
     are marked `// peer:<you>`.
   - Subtract first. Keep the facts true: use only the numbers the prototype has.
2. **Proof.**
   - Run `5-today` and every other walkthrough your change touches against your copy, in snapshot mode:
     `VX_SNAP=S/peer/r3/<you>/snap VX_NOVIDEO=1 node S/scripts/<script> S/peer/r3/<you>/app /tmp/nv-<you> [seed]`.
   - No page errors.
   - If you change something a script points at, copy the script into your folder and fix it, keeping the same steps.
3. **Your own five-second test.** Look at your after screenshot cold and write the first thing you notice and what
   you'd do. Does it match the focus sentence?
4. **A purpose audit.** List every block on your screen with why it's there. Anything without a reason is folded or gone.
5. **A phone render** of your screen at 390x844 (`node S/peer/tools/render.cjs <snap NN.html> OUT.png 390 844`).
   Nothing scrolls sideways.
6. **`proposal.md`**: the seven tests, each pass or fail with one line on how, before and after paths, visible words
   before and after, your five-second test and your purpose audit. Plus `changes.md` (each change and where) and
   `patch.diff` (`sh S/peer/tools/patch.sh S/peer/r3/<you>/app > patch.diff`).

Reply in at most 120 words:

```
SCREEN: <screen> · TESTS: <n>/7 pass (<which fail, if any>)
FIVE SECONDS: <what a first-time viewer notices first, and does>
SCREENS: <journey/step> words <before>→<after> · <after png path>
WORKS: <scripts run> · page errors: <none | list>
PATCH: <patch.diff path> · <lines changed>
```

## Then the review

Each fix is reviewed by two others, and you'll be told which.

1. **First**, before reading anything, look at the after screenshot for five seconds and write what you notice first and
   what you'd do.
2. **Then** check the seven tests, quoting what fails.
3. **Verdict:** agree only if all seven pass and your five-second answer matches the screen's focus sentence.

A fix needs both reviewers' agreement. It gets one revision if they don't agree, two at most.
