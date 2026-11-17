import { readFileSync } from 'node:fs';
import { smaltty } from 'smaltkit/typescript';
import { composeFlow } from '../../src/core/compose.js';
import type { FlowDocument } from '../../src/core/document.js';
import type { ExpandOptions } from '../../src/core/notebook.js';

/** smaltty, the TypeScript kit smaltnb's parser works on, as the app's pages and the tests get it. */
export const ts = smaltty;

/** A format-4 flow from its folder: `flow.json` with its notebooks loaded and its steps derived (ADR 0011), and the
 * flows it reads brought in (ADR 0025), as `readFlow` reads one for the build. */
export async function loadFlowDir(dir: URL, options: ExpandOptions = {}): Promise<FlowDocument> {
  return composeFlow('flow.json', { json: async (path) => JSON.parse(readFileSync(new URL(path, dir), 'utf8')), text: async (path) => readFileSync(new URL(path, dir), 'utf8') }, ts, options);
}

/** The sign-ins example in its notebook form (examples/security-signins/). */
export const signinsDir = new URL('../../examples/security-signins/', import.meta.url);
