# Peer design round 1

You are one of five reviewers. Each of you critiques the product shown in five walkthrough videos and proposes a
**visual fix, shown as an image, not described in words**. You then review each other's proposals until you agree. The
integrator builds what the five of you agree on into the product.

All paths below are relative to `/tmp/claude-0/-home-user-smaltfl/031134f4-9905-563d-ac24-9881dc761972/scratchpad`
(call it `S`).

## What the product is

**smaltfl** runs a company's daily data pipelines in the browser.

- Every day a set of export files arrives, and each file is checked against rules.
- A file that breaks a rule that "pauses the day" holds back everything built from it until a person decides what
  readers see. Readers are the people who use the outputs.
- The **Data model** screen is a map of the business's kinds of things (applications, organisational units, people,
  platforms, controls), the files that describe each kind, and how the kinds relate.
- A **Build** panel on its right sets the model up from a folder of files and then plays the days.
- The company is the fictional Larkspur, with 22 files.

## The five walkthroughs (`video/r35/*.mp4`)

1. `1-setup`: setting up from nothing.
   - The user reads the first file. The app proposes what one row is, its key, and the kind of thing it describes.
   - The app suggests rules, each tried on Feb 1's file and the 184 days before. The user adds a rule of their own,
     takes a tolerance and sets it to Warn.
   - Then the next file, where the link between files is found in the data, and the rest of the files. Then the gaps
     reading found, the history and the checks.
2. `2-problem-fix`: a problem and its fix.
   - MFA arrives empty on Mon Feb 26 and the day pauses.
   - The user sees the cause and what it holds, then decides, on the security lead's recommendation, to wait for the
     file.
   - The corrected file arrives on Tue Feb 27 and is published.
3. `3-explore`: exploring. The estate, pointing at kinds, opening a kind and then a file, a column's values, the rows,
   and Ctrl K search.
4. `4a-odd-but-ok`: a little odd, not enough to stop.
   - The user's own tighter rows limit pauses Sat Mar 2 (262 rows; it pauses below 264).
   - The user reads the evidence and publishes with a reason.
5. `4b-outlier`: clearly an outlier.
   - TLS arrives with every application twice: 1,630 rows against about 815.
   - A corrected file comes in and the user publishes it.

The owner wants these four jobs easy to find and easy to do: setting up, fixing a problem, exploring, and telling
"a little odd" from "a real problem". They want images over words, plain words, and best UI practice. Their latest
complaint, word for word: "a ton of words and things that technically work but feel clunky or even skipping steps in
the demo like I pick a file and then it's joined up to a bunch of things and I don't know why."

## Where everything is

- **Inspiration (read first, and cite it):** `S/peer/inspiration.md`.
- **Contact sheets:** `S/peer/sheets/<video>-N.jpg`, 13 images of nine frames each, five seconds apart, labelled with
  their time. Full frames are in `S/peer/frames/<video>/fNN.jpg`.
- **Every step as a page:** `S/peer/snap/<video>/`.
  - `captions.tsv`: what each step says.
  - `NN.png`: the screen at that step, 1440x900, without the video overlay.
  - `NN.html`: the same screen as a static page, with the real markup and the real CSS. Copy it and edit it to
    make your "after".
- **Visible words per step:** `S/peer/words-before.txt`. Decide panels show 814 to 1,009 words today.
- **Source (read only, for class names and what is possible):**
  - `S/explore/index.html`: all the CSS.
  - `S/explore/build.js`: the Build panel and the days.
  - `S/explore/explore.js`: the map, the sheets and the Decide panel.
- **Render tool:** `node S/peer/tools/render.cjs IN.html OUT.png [W H] [--full] [--clip CSS_SELECTOR]`.
  - It prints the visible words and warns if the page scrolls sideways.
  - Desktop is `1440 900`; phone is `390 844`.
  - Rendering a snapshot copy at 390x844 gives its phone layout from the same CSS.

## Personas and natural focus

Pick the screens where your lens finds the biggest problem. Your natural focus is a starting point, not a fence.

- **builder**: a data engineer setting up Larkspur's flow from its files for the first time.
  - Wants to see why each file joins what it joins and what the app guessed from which evidence, and to change a guess
    fast.
  - Hates steps that happen without being shown.
  - Natural focus: video 1.
- **owner**: the deputy security lead, who owns the posture data product and decides what readers see on a paused day.
  - Needs to know at once: how serious is it, what will readers see, what is recommended and by whom. Then one tap to
    decide, on record.
  - Natural focus: videos 2 and 4b.
- **design**: a senior product designer who fixes sloppy AI-generated UI for a living, in the style of the creators the
  owner follows.
  - Lens: one visual system, colour (60-30-10, one accent), hierarchy, spacing, type, borders, word count.
  - Natural focus: the screens every journey passes through, which are the map, the paused-day banner, the Build panel
    and the Decide panel.
- **newcomer**: someone from the business who has never seen smaltfl and is learning it from these videos.
  - Lens: can I follow every step, do I know why each thing happens, are the words plain, do the pictures explain
    themselves.
  - Natural focus: videos 3 and the start of 1.
- **dq**: a data quality analyst.
  - Lens: are checks, limits, usual ranges and evidence shown truthfully and readably; can I tell "a little odd" from
    "a real problem" at a glance; do the numbers agree.
  - Natural focus: videos 4a and 4b and the rules in 1.

## Round 1: what you produce

Work in `S/peer/r1/<persona>/`. Write nothing anywhere else.

1. **Watch.**
   - Read `inspiration.md`, then open all 13 contact sheets.
   - Open the full `NN.png` of every screen your lens cares about, with its caption.
   - Look at the source only to learn what exists.
2. **`critique.md`**: at most 8 problems, the worst first. Each says:
   - the video and step;
   - what is wrong;
   - what you were trying to do and why it matters to you;
   - the principle it breaks, with its section of `inspiration.md`.

   Also score the product as it is now, from 1 to 5, on easy_to_find, easy_to_do, images_over_words, trust and overall.
3. **The proposal**: pick **one to three screens** where a redesign helps most. For each screen:
   - copy the step's `NN.html` to `v1/<video>-<NN>.html` and edit it. Add a `<style>` block at the end of `<head>`,
     change or delete elements, cut words, and add an inline SVG picture where a picture beats a sentence;
   - render `v1/<video>-<NN>-after.png` at 1440x900;
   - render at least one of your screens at 390x844 as well, as `...-after-phone.png`. The video is desktop, but the
     product must work on a phone;
   - you may build a standalone mockup instead when the change is structural. Reuse the page's CSS variables and class
     names so it can be built;
   - if a journey skips a step, mock up the missing step as a new screen.
4. **`proposal.md`**:
   - a title;
   - the problem each screen fixes, with the principle (cite the section);
   - for each screen: the before path, the after path(s), visible words before and after (from the tool), and the
     changes as a short list a developer can build from (selectors, CSS, copy cut, new element);
   - what you deliberately did not change.

### Rules for a proposal

- **Subtract first.** Removing and quieting beat adding.
- **Truthful.** Use only facts and numbers the screens or the prototype's data already have. Don't invent features the
  product can't back. If you need a fact the screen lacks, say where it would come from.
- **ADR 0028** (section 6 of the inspiration): smalt #003399 is the only action colour, never colour alone, one primary
  action, plain words once.
- **Phones too.** Nothing may scroll sideways; the tool warns you.
- **The words target.** A decision screen at 250 visible words or fewer, any other screen at 200 or fewer. Say why if
  you can't get there.
- **Your folder only.** Edit nothing in `S/explore/` and nothing in another reviewer's folder.

### Reply to the integrator, at most 150 words, in this shape

```
PERSONA: <persona>
SCORES: easy_to_find=?, easy_to_do=?, images_over_words=?, trust=?, overall=?
PROPOSAL: <title>: <one sentence>
SCREENS: <video/NN> words <before>→<after> · <after png path(s)>   (one line each)
FILES: <critique.md path> · <proposal.md path>
```

## Later: reviewing each other (you will be messaged)

You will receive the other proposals. For each one, open its proposal and its before and after images, then judge it
as your persona:

- **Verdict.** `agree` means you'd ship it as is or with only the nits you list. `disagree` means it needs a change
  before you'd agree.
- **A score** of the proposal, 1 to 5.
- **What to keep.**
- **What to change**, as concrete visual changes. You may sketch an alternative as a small HTML and PNG in
  `S/peer/r1/<you>/reviews/`.
- **Whether it conflicts** with your own proposal, and how to reconcile them.

A proposal is agreed when at least three of its four reviewers agree. Each author revises one to three times, and says
in `proposal.md` what they took and what they declined, and why.
