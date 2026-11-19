/**
 * A flow's catalogue from disk (ADR 0026 §10): the flows in the `catalogue` folder beside its `flow.json`, each read as
 * any flow is (its own folder, the flows it reads brought in, its steps derived), with the entry the app lists it by:
 * what it gives, what it is built on, and the hash it is known by. What the app's build ships, so *Add a flow* has
 * flows that are made already. A flow with no such folder has an empty catalogue.
 *
 * With change sets made to the flow since it was written (a recorded story's, ADR 0026 §7), a flow of the catalogue is
 * read as a flow the page reads is: its own document holds the change sets about a file or step it has or reads, and
 * names each flow it reads by the hash that flow's own document has with them. A page whose story changed a rule of
 * Evidence feeds reads Evidence feeds by another hash than its folder gives, and a catalogue flow built on the folder's
 * would be built on another Evidence feeds: it couldn't be added.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { withOwnChanges } from '../src/core/attribute.js';
import { entryOf, type CatalogueEntry } from '../src/core/catalogue.js';
import type { ChangeSet, FlowDocument } from '../src/core/document.js';
import { flowHash } from '../src/core/plan.js';
import { readFlow, readWithChanges } from './flow.js';

/** The folder a flow's catalogue is kept in, beside its document. */
export const CATALOGUE_DIR = 'catalogue';

export async function readCatalogue(flowPath: string, changes: readonly ChangeSet[] = []): Promise<{ entry: CatalogueEntry; doc: FlowDocument }[]> {
  const dir = join(dirname(flowPath), CATALOGUE_DIR);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const out: { entry: CatalogueEntry; doc: FlowDocument }[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name, 'flow.json');
    if (!existsSync(path)) continue;
    const plain = await readFlow(path);
    const flows = changes.length && plain.flows?.length ? (await readWithChanges(path, changes)).doc.flows : undefined;
    const doc: FlowDocument = changes.length ? { ...withOwnChanges(plain, changes), ...(flows ? { flows } : {}) } : plain;
    out.push({ entry: entryOf(doc, `${CATALOGUE_DIR}/${name}/flow.json`, await flowHash(doc)), doc });
  }
  const twice = out.find((x, i) => out.findIndex((y) => y.entry.id === x.entry.id) !== i);
  if (twice) throw new Error(`${dir}: two flows of the catalogue are called ${twice.entry.id}`);
  return out;
}
