/**
 * The package is built from `src` alone (`scripts/build.mjs`: the core, the plugin and their declarations, with
 * `rootDir` `src`; the app is built apart). A file of the package that imports from outside `src`, even a type, fails
 * that build, which `npm run check` doesn't run: this holds every such file to `src` where the suite does.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const under = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? under(path) : path.endsWith('.ts') ? [path] : [];
  });

describe('the package', () => {
  it('reads nothing outside src: every relative import of the core, the plugin and their entry points stays in it', () => {
    // The app is no part of the package (build-app.mjs builds it), and may read the examples' bindings.
    const files = under(src).filter((f) => !relative(src, f).startsWith('app'));
    expect(files.length).toBeGreaterThan(50);
    const outside: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)\b[^'"\n;]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        const target = resolve(dirname(file), m[1]!);
        if (relative(src, target).startsWith('..')) outside.push(`${relative(root, file)} imports ${m[1]}`);
      }
    }
    expect(outside).toEqual([]);
  });
});
