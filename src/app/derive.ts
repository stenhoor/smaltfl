// A flow's steps derived from its notebooks, in a bundle of its own (ADR 0025 §10): the notebook parser (smaltnb's, on
// smaltty) is loaded the first time someone builds in the app (a join written as a cell), so the page's first load never
// carries it. What reading a flow from its folder does after its files are read: the steps, the gates, each step's cell
// and each notebook's outline, and the check cells in step with the ontology.
import { smaltty } from 'smaltkit/typescript';
import type { FlowDocument } from '../core/document.js';
import { syncRuleCells } from '../core/gatecell.js';
import { expandNotebooks } from '../core/notebook.js';

/**
 * The document with its steps derived again from its notebooks as they are now. Its sections follow: a notebook's
 * section keeps how the page arranged it (folded, its colour) with the steps the notebook has now, a notebook written
 * since has a section of its own, and one whose notebook is gone goes with it. Throws a PlanError naming the first
 * problem where a notebook isn't a flow's.
 */
export async function derive(doc: FlowDocument): Promise<FlowDocument> {
  const { groups: had, ...rest } = doc;
  const fresh = await expandNotebooks(rest as FlowDocument, smaltty);
  const kept = new Map((had ?? []).map((g) => [g.id, g]));
  const groups = (fresh.groups ?? []).map((g) => (kept.has(g.id) ? { ...kept.get(g.id)!, steps: g.steps } : g));
  return syncRuleCells({ ...fresh, ...(groups.length ? { groups } : {}) });
}
