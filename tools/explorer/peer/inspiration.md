# Design inspiration: what every reviewer and the integrator draws from

## 1. What the owner said, in their words

> "You keep defaulting back to a ton of words and things that technically work but feel clunky or even skipping steps
> in the demo like I pick a file and then it's joined up to a bunch of things and I don't know why."

> "Images over words, plain words, the best UI practice."

They follow designers on Instagram who fix sloppy AI-generated UI: before-and-after posts on colour theory, hierarchy,
and turning a generic, awkward dashboard into one that feels designed. They named *Design with Omar* and one more
creator, but web search can't find either (Instagram isn't indexed). The principles below come from the same school:
Refactoring UI, Material Design, *Storytelling with Data* and recent "de-slop your AI UI" writing. A typical post of
theirs cuts the words by two thirds, keeps one accent colour, makes one thing the obvious focus, aligns everything to
one grid, and turns sentences into a number or a picture.

Measured on today's screens (visible words in the 1440x900 viewport, `peer/words-before.txt`):

- Decide panels: 814 to 1,009 words.
- Setup after reading every file: about 900 words.
- The calmest screen: about 170 words.

A designed screen of this kind would carry roughly 120 to 250.

## 2. The tells of sloppy AI UI, to remove

- **Words doing a picture's job.** Explanations on every element, the same fact said in three places, sentences where
  a label, a number or a mark would do, and captions that narrate the obvious.
- **Everything at the same volume.** Many bordered cards, chips and badges compete and there is no single focal point.
  Every action looks like a button, and several look primary.
- **Colour everywhere.** Several accents, tinted backgrounds on every block, rainbow status chips, gradients,
  glassmorphism, neon on dark, emoji as icons.
- **Generic dashboard soup.** Equal tiles of number plus sparkline whatever their importance, legends far from the data,
  gridlines and borders everywhere, decimal noise, and no "so what".
- **No system.** Spacing, radii, font sizes and greys vary at random. A border, a shadow and a tinted background all on
  the same element.
- **Steps that happen off screen.** The app decides something (a key, a join, a link) and the result just appears,
  with no moment that shows the evidence and asks.

## 3. The fixes they teach

1. **A system first** (Refactoring UI, "limit your choices"):
   - a 4/8 px spacing scale and one type scale with two or three weights;
   - one radius family and greys tinted toward the brand;
   - one accent, with status colours used for status only;
   - design in greys first, add colour last.
2. **60-30-10.** About 60% neutral surface, 30% secondary surfaces and text, and 10% accent. The accent goes on the one
   primary action and the one thing that needs attention, nothing else.
3. **Hierarchy by de-emphasis.** Make secondary things quieter (lighter grey, smaller, regular weight) rather than
   making the main thing louder.
   - Labels are a last resort: "1,630 rows" beats "Rows: 1,630".
   - Separate visual hierarchy from document order.
   - Use primary, secondary and tertiary actions: a filled button, an outlined or tonal one, a text link.
4. **Fewer borders.** Use spacing, a slightly different surface tone or one divider, never all three at once. Put more
   space between groups than within them.
5. **One focal point per screen.** The state and the one number that matters go top-left, where the eye lands, and the
   one action goes where the eye ends (F and Z reading patterns).
6. **Show, don't tell** (*Storytelling with Data*):
   - Declutter: remove borders, gridlines, markers and redundant labels.
   - Grey everything, then highlight the one series or point that matters.
   - Label directly, not in a legend.
   - Annotate the point with its meaning.
   - Bars start at zero; plot a change on the same scale as the normal.
7. **Progressive disclosure** (NN/g). The answer first, the evidence one tap away, the method last.
8. **Show the step.** When the machine infers something, show the evidence at the moment it is used and let the
   person confirm it. Examples: two columns whose values match, drawn as lines from one file to the other, then the
   relation drawn on the map.
9. **Real content.** Use real names, real numbers, tabular figures, right-aligned numbers and units said once.
10. **Motion with meaning only.** Something moves to show where it came from or went to (a file into its kind on the
    map, a choice into the record), never for decoration.

## 4. Material Design 3, what applies here

- **Colour roles.**
  - Primary: the most prominent action and the active state.
  - Secondary and tertiary: less prominent elements.
  - Surface containers, lowest to highest: hierarchy from tone, not from borders.
  - On-colour pairs keep contrast. The error role is reserved for errors.
  - <https://m3.material.io/styles/color/roles>
- **Button emphasis.** Filled (highest), then tonal, outlined and text (lowest). One filled button per view for the
  main action.
- **Type roles.** Display, headline, title, body and label, each in large, medium and small. Don't invent sizes in
  between.
- **Layout.** A 4 dp baseline and 8 dp spacing.
  - Window classes: compact under 600, medium 600 to 839, expanded from 840.
  - Canonical layouts: list-detail and supporting pane.
  - A phone shows one pane at a time.
- **Shape scale.** Few radii, applied consistently.
- **States.** Hover, focus and pressed are state layers, not new colours.

## 5. Dashboards that work, and why

- **Linear.** Near-monochrome with one accent. Dense lists with quiet secondary text. Status is a small shaped icon
  (empty circle, half, check), not a coloured chip. Keyboard first (Ctrl K).
- **Stripe Dashboard.** One headline number with a small chart beside it, the comparison in grey, generous white space,
  tabular figures. Colour only for change and status.
- **Vercel.** Black, white and a grey scale, in Geist type. Status dots, deploys as a timeline, one primary action per
  screen.
- **Datadog, Grafana, New Relic monitors.** A time series with the normal band shaded and the odd point marked. A
  threshold is a line, and the alert says how far beyond the band the value is.
- **GitHub status and uptime strips.** A strip of days, each a small bar coloured and shaped by its state, details on
  hover. The month-at-a-glance pattern.
- **Apple Health trends.** One sentence plus a chart with the usual range shaded: "Your resting heart rate is higher
  than usual."
- **Carbon status indicators.** Shape plus colour plus a word, never colour alone.

## 6. smaltfl's own system (ADR 0028): not negotiable

- Smalt (#003399) is the one action colour. Teal and violet are out of the interface. Colour goes by role.
- Seven text sizes and three weights. One kit of components.
- Never colour alone: every state has a shape and a word.
- Plain words, said once. One primary action per screen. Two levels: the answer, and details on demand.
- It works at phone (390x844), tablet (820x1180, 1180x820) and desktop (1440x900) sizes, and nothing scrolls sideways.

## 7. The owner's creators: Memorisely (@memorisely) and Build with Omar (@buildwithomar)

Instagram refuses automated reading, so neither account's posts could be read from here. Memorisely's own site could,
and it sets out the method behind their posts, written by its founder, Zander Whitehurst, a product designer for 15
years who sits on Figma's education advisory board. If the owner sends Build with Omar posts, they will be added here.

### "Fix AI slop": their checklist, the pre-ship pass

Source: <https://www.memorisely.com/products/fix-ai-slop-skills>. Goal: "Spot AI slop early and fix type, spacing, and
components so your product looks intentional, not like a template."

1. **Type scale correction.** "When AI flattens type, … reapply heading, label, and body steps from your scale." The
   aim is readable hierarchy, no oversized hero text, and every size from the tokens.
2. **Spacing rhythm pass.** "Padding and gap normalization removes the stacked-card feel common in generated
   layouts." The aim is an even vertical rhythm, fewer arbitrary margins and cleaner section breaks.
3. **Component consistency.** "Buttons, inputs, and cards are forced onto one system instead of mixed template
   parts." The aim is one button language, inputs that match the forms, and cards that share radius and shadow.
4. **Colour and contrast tidy.** "Muddy greys and random accents get trimmed so palettes stay restrained and
   accessible." The aim is no accidental neons, better text contrast, and surfaces that feel intentional.
5. **Pre-ship slop checklist.** Typography, spacing, components and colour, checked in one run, the same bar every
   release.

### Their design-system rules

Shown as working rules on their homepage, <https://www.memorisely.com/>:

- "One primary per view." "Use action/primary." "Icons sit left of labels." "Never invent new colours." "Use tokens."
- Semantic tokens over raw values: `text/primary`, `text/muted`, `action/primary`, `border/subtle`, `surface/raised`,
  `space/4`.
- Their design review asks four things: **clear hierarchy · every state covered · matches the system · ready to ship.**

### Colour

Source: <https://www.memorisely.com/products/ai-color-token-skills>.

- Build "neutral and primary ramps with clear steps so AI palettes stay systematic, not a random set of accent hex
  codes".
- Their own "slop" example is the default AI palette: indigo `#6366f1` primary, violet `#8b5cf6` accent, a separate
  blue `#3b82f6` link, lavender borders and surfaces.
- The fix is one warm neutral ramp (`#fafaf9` … `#171716`) plus one primary ramp.
- Their own site keeps to warm near-black and greys, with a few muted accents used sparingly.

### Their workshop "From AI slop to beautiful UI"

Source: <https://www.memorisely.com/workshops/from-ai-slop-to-beautiful-ui>.

1. Spot what reads as slop from before-and-after examples, then make a short checklist for typography, spacing and
   hierarchy.
2. Apply a type scale, a rhythm and a layout grid.
3. Shape buttons, forms and **empty states** with consistent tokens and micro-interactions you can defend in critique.

### Motion

Source: <https://www.memorisely.com/blog/the-basics-of-ui-motion>.

- "Every animation in a product should have a job." The jobs are feedback, connecting one state to the next, and,
  rarely, delight.
- Most UI motion takes 100 to 500 ms. About 200 ms is the default; "if in doubt, make the animation faster".
- Ease out by default: `cubic-bezier(0.22, 1, 0.36, 1)`. Stagger list items 20 to 50 ms apart, the most important
  element first.
- "Good motion is judged in use, not in a showreel." A 150 ms fade and scale beat a bounce, blur and stagger.

### What this means here

Every proposal should pass their four review questions:

- **Clear hierarchy:** one focal point, then quieter support.
- **Every state covered:** empty, loading, paused, waiting, decided, error.
- **Matches the system:** smalt for action, the neutral ramp, one button language, one card style.
- **Ready to ship:** working, on a phone too.

Cut the stacked-card feel: fewer bordered boxes inside bordered boxes, and spacing instead of frames.
