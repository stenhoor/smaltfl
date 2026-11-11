/**
 * The app's connection to the engine. In a browser that allows it, the engine runs in a worker (worker.js), so the
 * page stays responsive while a flow runs; otherwise it runs in the page (inline.js, loaded only then).
 */
import { open } from 'smaltdb';
import type { PluginCaller } from '../core/protocol.js';

export interface Engine extends PluginCaller {
  /** Where the engine runs. */
  mode: 'worker' | 'page';
  query(sql: string): Promise<{ columns: string[]; rows: unknown[][] }>;
  exec(sql: string): Promise<void>;
}

/** Every request to the engine with when it was sent and answered (ms since the page started), for the browser tools: the
 * engine answers one at a time, so this is where its time went. */
const calls: [string, number, number][] = [];
(globalThis as { __smaltflEngine?: typeof calls }).__smaltflEngine = calls;
function timed(e: Engine): Engine {
  const t = <T>(what: string, p: Promise<T>): Promise<T> => {
    const at = performance.now();
    return p.finally(() => calls.push([what.slice(0, 160), Math.round(at), Math.round(performance.now())]));
  };
  return {
    mode: e.mode,
    query: (sql) => t(`query ${sql.replace(/\s+/g, ' ')}`, e.query(sql)),
    exec: (sql) => t(`exec ${sql.replace(/\s+/g, ' ')}`, e.exec(sql)),
    callPlugin: (plugin, method, args, options) => t(`call ${plugin}.${method}`, e.callPlugin(plugin, method, args, options)),
  };
}

export async function connect(): Promise<Engine> {
  return timed(await open_());
}

async function open_(): Promise<Engine> {
  // `?engine=page` runs the engine in the page, as a browser without workers does: one profile then holds both.
  if (typeof location !== 'undefined' && /[?&]engine=page\b/.test(location.search)) {
    const inline = (await import(/* @vite-ignore */ new URL('./inline.js', import.meta.url).href)) as { openInPage(): Engine };
    return inline.openInPage();
  }
  try {
    const db = await open(':memory:', { storage: 'memory', worker: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }) });
    await db.query('SELECT 1', [], { rowMode: 'array' });
    return {
      mode: 'worker',
      async query(sql) {
        const r = await db.query(sql, [], { rowMode: 'array' });
        return { columns: r.columns, rows: [...r] };
      },
      async exec(sql) {
        await db.exec(sql);
      },
      callPlugin: (plugin, method, args, options) => db.callPlugin(plugin, method, args, options),
    };
  } catch (e) {
    console.warn('smaltfl: the engine worker did not start, so the engine runs in the page', e);
    const inline = (await import(/* @vite-ignore */ new URL('./inline.js', import.meta.url).href)) as { openInPage(): Engine };
    return inline.openInPage();
  }
}
