/**
 * One visual system (ADR 0028): the app's style sheet keeps to the roles, sizes and weights the ADR names, so a feature
 * added later uses the shared vocabulary instead of inventing its own.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../src/app/page.html', import.meta.url), 'utf8');
// The app's own style sheet: the first <style>, without smaltkit's (put in by the build) and without comments.
const sheet = (() => {
  const start = page.indexOf('<style>') + '<style>'.length;
  return page.slice(start, page.indexOf('</style>', start)).replace(/\/\*[\s\S]*?\*\//g, '');
})();
/** Every innermost rule: its selector and its declarations (a rule inside @media is read as its own). */
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.replace(/\s+/g, ' ').trim(), body: m[2]! }));
const TOKEN_BLOCKS = new Set([':root', ':root:not([data-theme="light"])', ':root[data-theme="dark"]']);

/** The seven text sizes (§3). */
const TEXT = [12, 13, 15, 17, 20, 24, 32];
/** Inside a drawing (a canvas card, a chart, a mini chart in a table head) two smaller sizes are allowed (§3). */
const DRAWING = /svg|(^|[\s,>])text\b|text\.|\.viz\b|\.card\b|\.section\b|\.chart\b|\.spark\b|\.bandchart\b|\.tick\b|\.axis\b|\.ld-cell|\.ld-range|\.ld-day\b|\.hist \.ax|\.xl-grid thead th|\.isomap|\.vf-ring-n|\.xp-axis|\.mini-label|\.mini-none|\.th-flag|\.th-stat|\.nl-label|\.dg-text|\.km-|\.heat/;

describe('the type scale (ADR 0028 §3)', () => {
  it('sets text in seven sizes, and drawings in two more', () => {
    const off: string[] = [];
    for (const { sel, body } of rules) {
      const allowed = DRAWING.test(sel) ? [10, 11, ...TEXT] : TEXT;
      for (const m of body.matchAll(/font-size:\s*([0-9.]+)px/g)) if (!allowed.includes(Number(m[1]))) off.push(`${sel}: ${m[1]}px`);
      for (const m of body.matchAll(/font:\s*(?:[0-9]+\s+)?([0-9.]+)px/g)) if (!allowed.includes(Number(m[1]))) off.push(`${sel}: font ${m[1]}px`);
    }
    expect(off).toEqual([]);
  });

  it('uses three weights', () => {
    const off: string[] = [];
    for (const { sel, body } of rules) {
      for (const m of body.matchAll(/font-weight:\s*([0-9]{3})/g)) if (![400, 500, 600].includes(Number(m[1]))) off.push(`${sel}: ${m[1]}`);
      for (const m of body.matchAll(/font:\s*([0-9]{3})\s/g)) if (![400, 500, 600].includes(Number(m[1]))) off.push(`${sel}: font ${m[1]}`);
    }
    expect(off).toEqual([]);
  });
});

describe('colors by role (ADR 0028 §2)', () => {
  it('defines every role in the light theme and in both dark blocks', () => {
    const blocks = rules.filter((r) => TOKEN_BLOCKS.has(r.sel) && /--bg:/.test(r.body));
    expect(blocks.map((b) => b.sel).sort()).toEqual([...TOKEN_BLOCKS].sort());
    for (const b of blocks) {
      for (const role of ['bg', 'surface', 'sunk', 'line', 'ink', 'ink-2', 'muted', 'action', 'action-wash', 'edge-control', 'ok', 'ok-wash', 'warn', 'warn-wash', 'bad', 'bad-wash']) {
        expect(b.body, `${b.sel} --${role}`).toMatch(new RegExp(`--${role}:\\s*#[0-9a-fA-F]{6}`));
      }
    }
  });

  it('retires teal and violet, and reads smalt as the action role', () => {
    expect(sheet).not.toMatch(/var\(--(teal|violet|smalt)[a-z-]*/);
    expect(sheet).not.toMatch(/--(teal|violet)[a-z-]*:/);
  });

  it('writes no color outside the token blocks but black and white for shadows, masks, overlays and print', () => {
    const off: string[] = [];
    for (const { sel, body } of rules) {
      if (TOKEN_BLOCKS.has(sel) || sel.startsWith('body[data-told="history"]')) continue;
      for (const m of body.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)) {
        const lit = m[0];
        const neutral = lit === '#000' || lit === '#fff' || /^rgba?\(\s*0[ ,]+0[ ,]+0\b/.test(lit) || /^rgb\(8 11 18 \//.test(lit);
        if (!neutral) off.push(`${sel}: ${lit}`);
      }
    }
    expect(off).toEqual([]);
  });

  it('draws canvas sections as one frame, whatever color a flow stored for them', () => {
    const frame = rules.find((r) => r.sel.startsWith('.c-slate,'));
    expect(frame?.sel).toBe('.c-slate, .c-smalt, .c-teal, .c-green, .c-amber, .c-rose, .c-violet');
    expect(rules.filter((r) => r !== frame && /\.c-(smalt|teal|green|amber|rose|violet)\b/.test(r.sel)).map((r) => r.sel)).toEqual([]);
  });
});

describe('one kit of components (ADR 0028 §4)', () => {
  it('underlines links', () => {
    const link = rules.find((r) => r.sel.startsWith('.linkish,'));
    expect(link?.body).toMatch(/text-decoration:\s*underline/);
  });

  it('draws every primary button alike, and nothing that is not an action as one', () => {
    const primary = rules.filter((r) => /background:\s*var\(--action\)/.test(r.body) && /color:\s*var\(--surface\)/.test(r.body));
    const last = primary.at(-1)!;
    for (const sel of ['.run', '.vf-decide', '.vf-go', '.btn.small.primary', '.mo-decide.primary', '.fl-decide', '.of-save']) expect(last.sel).toContain(sel);
    const shared = rules.at(-1)!;
    expect(rules.indexOf(last)).toBeGreaterThan(rules.length - 12);
    expect(shared.sel).toBe('.viewer select');
    for (const sel of ['.seg button[aria-pressed="true"]', '.vf-rec', '.sc-n']) {
      const overrides = rules.filter((r) => r.sel === sel);
      expect(overrides.at(-1)!.body, sel).not.toMatch(/background:\s*var\(--action\)/);
    }
  });
});
