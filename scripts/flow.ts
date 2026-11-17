/**
 * A flow document from disk, in either form (ADR 0011): a `.smaltfl.json` file as it is, or a folder's `flow.json`
 * with its notebooks loaded beside it and its steps derived (format 4). What the app build and the history builder
 * read a flow with; the tests have the same in test/helpers/notebooks.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { smaltty } from 'smaltkit/typescript';
import { composeFlow } from '../src/core/compose.js';
import type { ChangeSet, FlowDocument } from '../src/core/document.js';
import { attributeChanges } from '../src/core/attribute.js';
import { asEstate, type EstateFrom, type EstateOntology } from '../src/core/shared.js';

/**
 * A flow from disk (compose.ts): the shared ontologies it imports brought in (shared.ts: each starting file's meanings
 * and rules, read relative to the flow), its notebooks loaded and its steps derived, the flows it reads and theirs
 * brought in (ADR 0025), and the check cells that enforce a shared file's rules listing them (`syncRuleCells`), so a
 * change to a shared file, or to a flow others read, reaches every flow the next time it is read.
 */
export async function readFlow(path: string): Promise<FlowDocument> {
  const dir = dirname(path);
  return composeFlow(basename(path), { json: async (p) => JSON.parse(readFileSync(join(dir, p), 'utf8')), text: async (p) => readFileSync(join(dir, p), 'utf8') }, smaltty);
}

/**
 * Each flow a flow reads, as its own document (ADR 0025 §2), in the order the flow lists them: the document read from
 * its own folder, whose flow hash the reading document names it by. What a run keeps beside its own document.
 */
export async function readFlows(path: string): Promise<FlowDocument[]> {
  const doc = await readFlow(path);
  return Promise.all((doc.flows ?? []).map((f) => readFlow(join(dirname(path), f.path))));
}

/**
 * A flow with change sets made to it since it was written (a recorded story's, ADR 0021 §6), put where they belong
 * (ADR 0025 §7): all of them in the document, each read flow's own document holding those about a file or step it has
 * or reads, and the document naming each flow by the hash its own document has then. What the build ships and the
 * recorder runs, so a run names the flows as they were changed. With no change set, the flow as read.
 */
export async function readWithChanges(path: string, changes: readonly ChangeSet[]): Promise<{ doc: FlowDocument; owns: FlowDocument[] }> {
  const doc = await readFlow(path);
  const owns = await readFlows(path);
  if (!changes.length) return { doc, owns };
  if (!owns.length) return { doc: { ...doc, changes: [...(doc.changes ?? []), ...changes] }, owns };
  return attributeChanges(doc, owns, changes);
}

/**
 * The estates' ontologies a flow imports (ADR 0025 §8), as their files give them, in the order the flow's document names
 * them, each with where the document says it is from. What the app's build ships beside the flow: the Ontology page says
 * what the estate says of a column a flow handles its own way, and an edit there knows a column the estate describes.
 */
export async function readEstates(path: string): Promise<{ from: EstateFrom; estate: EstateOntology }[]> {
  const doc = await readFlow(path);
  return (doc.ontology?.estate ?? []).map((from) => ({ from, estate: asEstate(JSON.parse(readFileSync(join(dirname(path), from.path), 'utf8')), from.path) }));
}

/** The flow's data list: `<doc>.data.json` beside a `.smaltfl.json`, `data.json` in a folder. */
export const bindingsPath = (flowPath: string): string => (flowPath.endsWith('.smaltfl.json') ? flowPath.replace(/\.smaltfl\.json$/, '.data.json') : join(dirname(flowPath), 'data.json'));

/**
 * The check cells of a flow folder's notebooks written on disk as reading the flow brings them in step with its
 * ontology and the shared ontologies it imports (`npm run rules:sync`): what each cell lists of its file's rules. The
 * notebooks whose text changed, by path; a `.smaltfl.json` flow has none.
 */
export async function syncFlowFiles(path: string): Promise<string[]> {
  const doc = await readFlow(path);
  const dir = dirname(path);
  const changed: string[] = [];
  for (const nb of doc.notebooks ?? []) {
    const file = join(dir, nb.path);
    if (readFileSync(file, 'utf8') === nb.source) continue;
    writeFileSync(file, nb.source);
    changed.push(file);
  }
  return changed;
}
