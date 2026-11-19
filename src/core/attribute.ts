/**
 * Each change at the flow it belongs to (ADR 0026 §7). A flow is known by the hash of its own document, so a change to
 * one of its files or steps, or to a flow it reads, is made in its own document too: a name edit made again there
 * (`ownWithEdits`), a dated change set added to its change sets (`withOwnChanges`), and the reading document naming the
 * flow by the hash its own document has then (`attributeChanges`). So a flow's hash moves with a change to it or to a
 * flow it reads, and with no other, and every run names the flows as they were changed.
 *
 * Pure. The build and the recorder put a recorded story's changes where they belong with it (scripts/flow.ts), and the
 * page the changes made there; what the page says of a change is follow.ts.
 */
import { editTargets, type ChangeSet, type FlowDocument, type FlowPart } from './document.js';

export { editTargets } from './document.js';
import { nameColumn, nameColumnThrough, type NameOp } from './flowedit.js';
import { flowHash } from './plan.js';

const lower = (x: string) => x.toLowerCase();

/**
 * A flow's own document with the change sets that are about it (ADR 0026 §7): those with an edit about a file or step
 * it has or reads, added to its own in the order given; one it holds already (by id) isn't added twice. The document
 * given, where none is about it. So the hash a flow is known by moves with a change to it or to a flow it reads, and
 * with no other.
 */
export function withOwnChanges(own: FlowDocument, changes: readonly ChangeSet[]): FlowDocument {
  const has = new Set([...own.sources, ...own.steps].map((x) => lower(x.id)));
  const had = new Set((own.changes ?? []).map((c) => c.id));
  const about = changes.filter((c) => !had.has(c.id) && c.edits.some((e) => editTargets(e).some((d) => has.has(lower(d)))));
  return about.length ? { ...own, changes: [...(own.changes ?? []), ...about] } : own;
}

/**
 * A flow's own document as the edits made since leave it (ADR 0026 §7): each name edit made again where the flow has
 * the file, or a dataset the name was carried to (`described` says where an estate describes the column, so the flow's
 * reason marks an override there and nowhere else), then the change sets about it (`withOwnChanges`). The document
 * given, where no edit is about it.
 */
export function ownWithEdits(own: FlowDocument, names: readonly NameOp[], changes: readonly ChangeSet[], described: (dataset: string, column: string) => boolean = () => true): FlowDocument {
  const has = new Set([...own.sources, ...own.steps].map((x) => lower(x.id)));
  let doc = own;
  for (const op of names) {
    const here = (d: string) => described(d, op.column);
    const through = op.through.filter((d) => has.has(lower(d)));
    if (has.has(lower(op.file))) doc = nameColumnThrough(doc, op.file, op.column, op.change, through, here).doc;
    else {
      // The file is another flow's, which this one doesn't read: the datasets of its own the name was carried to.
      for (const d of through) {
        const { override: _override, ...plain } = op.change;
        doc = nameColumn(doc, d, op.column, op.change.override !== undefined && here(d) ? op.change : plain).doc;
      }
    }
  }
  return withOwnChanges(doc, changes);
}

/**
 * A document and the own documents of the flows it reads, with change sets put where they belong (ADR 0026 §7): the
 * document holds them all, each read flow's own holds those about it (`withOwnChanges`), and the document names each
 * flow by the hash its own document has now. `owns` are in the order of the document's `flows`. What the build ships
 * and the recorder runs of a story's changes, and what the page makes of a change made there.
 */
export async function attributeChanges(doc: FlowDocument, owns: readonly FlowDocument[], changes: readonly ChangeSet[]): Promise<{ doc: FlowDocument; owns: FlowDocument[] }> {
  const parts = doc.flows ?? [];
  if (owns.length !== parts.length) throw new Error(`${doc.name} reads ${parts.length} flows, and ${owns.length} own documents were given`);
  const had = new Set((doc.changes ?? []).map((c) => c.id));
  const added = changes.filter((c) => !had.has(c.id));
  const all = [...(doc.changes ?? []), ...added];
  const next = owns.map((own) => withOwnChanges(own, all));
  const flows: FlowPart[] = [];
  for (let k = 0; k < parts.length; k++) flows.push(next[k] === owns[k] ? parts[k]! : { ...parts[k]!, hash: await flowHash(next[k]!) });
  return { doc: { ...doc, ...(parts.length ? { flows } : {}), ...(all.length ? { changes: all } : {}) }, owns: next };
}
