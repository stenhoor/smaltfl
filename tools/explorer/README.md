# explorer

A prototype of smaltfl's **Data model** screen on Larkspur's tour data, in plain HTML and JavaScript. It covers:

- the estate map;
- a kind opened, then a dataset;
- Ctrl K search and ask;
- a paused day and its Decide panel;
- building Larkspur from its 22 files and then playing its days.

It is not part of the package, the tests or the build. It was built in rounds in a session's scratch space and is kept
here so later sessions can carry on.

The last two rounds were peer rounds. Five reviewers (builder, owner, designer, newcomer, data quality) each built a
working fix in their own copy and reviewed each other's until at least three of four agreed. The agreed fixes were then
merged.

`peer/plan-tomorrow.md` is the retro and the plan for the next round. Read it first.

## Layout

- **`app/`: the prototype.**
  - Serve the folder with any static server and open `index.html`.
  - Routes: `#estate`, `#build-new` (from nothing), `#build`, and `#build-at-feb26`, `#build-at-mar2` or
    `#build-at-mar21`, which start from the states in `app/seeds/`.
  - The build's state is kept in localStorage under `smaltfl-build-v4`.
- **`scripts/`: the walkthroughs and checks.** Each takes the app's folder first.
  - **Walkthroughs:** `node scripts/v2_fix.cjs app OUT video-seeds/seed-feb26.json` records `OUT/2-problem-fix.mp4`
    with captions and a ring on what is pointed at.
    - The five are `v1_setup` (no seed), `v2_fix` (`seed-feb26`), `v3_explore` (no seed), `v4a_odd`
      (`seed-mar2-rows2`) and `v4b_outlier` (`seed-mar21`).
    - `VX_SNAP=DIR` also saves every step as a static, editable copy of the page, with a screenshot and its caption.
    - `VX_NOVIDEO=1` skips the video.
  - **Checks:**
    - `exbuild3.cjs app OUT` walks the whole build at desktop size; `MOB=1 W=390 H=844` walks it at phone size.
    - `fitcheck.cjs app OUT` checks that Decide's choices are in view at desktop and tablet sizes.
    - `exq.cjs app OUT estate,decide,decide-fill,phone,replace,dataset` takes quick looks.
    - Each prints `no page errors` or the errors.
  - **Data:** `mkhist.py`, `mklive.py` and `mkrowdiff.py` wrote the history, the replay and the rows-behind-a-count
    data into `app/build.json`.
  - **The published page:** `syncpage.py` and `storyboard.py` build the page's copy of the explorer. They expect the
    scratch layout: `explore/` for the app and `exppage/` for the page.
- **`video-seeds/`:** the localStorage states the walkthroughs start from.
- **`peer/`: the peer process.**
  - `inspiration.md` is the shared brief: the owner's words, fixes for AI-made UI, 60-30-10, Material 3, the dashboards
    that work, ADR 0028, and Memorisely's method.
  - `r1/` and `r2/` hold each round's brief, its status with every verdict and score, and each reviewer's critique,
    proposal, changes, reviews and final scores.
  - `words-*.txt` holds the visible words per walkthrough step before the peer rounds, after round 1 and after round 2.
  - `tools/`:
    - `render.cjs` renders a page, counts its visible words and warns if it scrolls sideways;
    - `copyapp.sh` and `patch.sh` make a working copy and its patch;
    - `joincss.py` joins the CSS blocks two merged fixes both append;
    - `sheet.py` makes contact sheets of video frames.
- **`page/`:** the published page's builder. Its media and screenshots are not kept here.
- **`notes.md`:** what each round of recording and judging found.

Not kept here: the videos, frames and step snapshots, and the reviewers' app copies, because they are large. The
published explorer page holds the final videos.

They need Node with Playwright (`require('playwright')`), ffmpeg for the videos, and Python 3 with Pillow for the
contact sheets.
