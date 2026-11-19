/**
 * The feed a site publishes beside a flow's page (ADR 0027 §10, Q-278): the ontology's changes, what is coming and what
 * was going on, as Atom (`src/core/told.ts`). The app's build makes it from the flow as shipped (its change sets, a
 * recorded story's among them), the story's events and the steps the build recorded, as things stand on the last day
 * the build has run. Nothing the data is made from: it isn't in what the data's cache is keyed by.
 */
import type { FlowDocument } from '../src/core/document.js';
import type { FlowEvent } from '../src/core/events.js';
import { isMonthFile, layered, runDay } from '../src/core/month.js';
import { stepsOf } from '../src/core/step.js';
import { feedOf, toldOf } from '../src/core/told.js';

/** What the build knows beside the flow: the story's events, the month it recorded (a `smaltfl-month/1` file, or
 * nothing), the days it has data for, and when it was built. */
export interface FeedGiven {
  events: readonly FlowEvent[];
  month: unknown;
  days: readonly string[];
  made: string;
}

/**
 * A flow's feed: the XML, how many entries it has, and the day it reads from. That day is the last one the build
 * recorded a run of, as the page's register reads from the last day that has arrived; with no recorded month, the last
 * day it has data for.
 */
export function feedFor(doc: FlowDocument, given: FeedGiven): { xml: string; entries: number; today: string } {
  const recorded = isMonthFile(given.month) ? layered(given.month) : [];
  const ran = recorded.flatMap((e) => runDay(e) ?? []).map((d) => d.slice(0, 10)).sort();
  const today = ran.at(-1) ?? [...given.days].sort().at(-1)?.slice(0, 10) ?? given.made.slice(0, 10);
  const told = toldOf(doc, { today, asOf: null, events: given.events, steps: stepsOf(recorded) });
  return { xml: feedOf(told, { title: `${doc.name}: the ontology`, flow: { id: doc.id }, made: given.made }), entries: told.length, today };
}
