/**
 * A flow's catalogue from disk (ADR 0025 §10): the flows in the `catalogue` folder beside its `flow.json`, each read as
 * any flow is (its own folder, the flows it reads brought in, its steps derived), with the entry the app lists it by:
 * what it gives, what it is built on, and the hash it is known by. What the app's build ships, so *Add a flow* has
 * flows that are made already. A flow with no such folder has an empty catalogue.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { entryOf, type CatalogueEntry } from '../src/core/catalogue.js';
import type { FlowDocument } from '../src/core/document.js';
import { flowHash } from '../src/core/plan.js';
import { readFlow } from './flow.js';

/** The folder a flow's catalogue is kept in, beside its document. */
export const CATALOGUE_DIR = 'catalogue';

export async function readCatalogue(flowPath: string): Promise<{ entry: CatalogueEntry; doc: FlowDocument }[]> {
  const dir = join(dirname(flowPath), CATALOGUE_DIR);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const out: { entry: CatalogueEntry; doc: FlowDocument }[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name, 'flow.json');
    if (!existsSync(path)) continue;
    const doc = await readFlow(path);
    out.push({ entry: entryOf(doc, `${CATALOGUE_DIR}/${name}/flow.json`, await flowHash(doc)), doc });
  }
  const twice = out.find((x, i) => out.findIndex((y) => y.entry.id === x.entry.id) !== i);
  if (twice) throw new Error(`${dir}: two flows of the catalogue are called ${twice.entry.id}`);
  return out;
}
