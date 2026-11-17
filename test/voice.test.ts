/**
 * The voice (src/core/voice.ts, ADR 0026 §12): the playful lines are few, each has plain words, and nothing the app or
 * its sample world says uses a phrase that asks the reader not to believe audited data.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { keepsToVoice, NEVER, voice, VOICE, type VoiceLine } from '../src/core/voice.js';

const lines = Object.keys(VOICE) as VoiceLine[];
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const under = (dir: string): string[] => readdirSync(new URL(`../${dir}`, import.meta.url)).flatMap((name) => {
  const path = `${dir}/${name}`;
  return statSync(new URL(`../${path}`, import.meta.url)).isDirectory() ? under(path) : [path];
});

describe('the playful lines', () => {
  it('are few and short, and each says where it is said', () => {
    expect(lines.length).toBeLessThanOrEqual(4);
    for (const k of lines) {
      expect(VOICE[k].play.split(/\s+/).length, k).toBeLessThanOrEqual(4);
      expect(VOICE[k].where.length, k).toBeGreaterThan(20);
      expect(keepsToVoice(VOICE[k].play), k).toBe(true);
    }
  });

  it('are their plain words where plain words are asked for', () => {
    expect(voice('emptyCatalogue', false)).toBe('Nothing upstream yet.');
    expect(voice('emptyCatalogue', true)).toBe('This build ships no flow to add.');
    // Under a seal, and after a first clean day, the screen says it already: plain words add nothing.
    for (const k of ['sealed', 'firstPass'] as const) {
      expect(voice(k, false)).toBe('Worth its smalt.');
      expect(voice(k, true)).toBe('');
    }
    for (const k of lines) expect(voice(k, true), k).not.toMatch(/smalt/i);
  });
});

describe('what is never said', () => {
  it('tells the phrases apart', () => {
    expect(keepsToVoice('Worth its smalt.')).toBe(true);
    for (const bad of ['Take it with a grain of smalt', 'a pinch of smalt', 'the day was smalted', 'smalt away']) expect(keepsToVoice(bad), bad).toBe(false);
    expect(NEVER.length).toBeGreaterThan(3);
  });

  it('is in nothing the page says, and nothing the sample flows say', () => {
    const files = ['src/app/main.ts', 'src/app/page.html', ...under('src/core').filter((f) => f !== 'src/core/voice.ts'), ...under('examples').filter((f) => /\.(json|ts)$/.test(f))];
    for (const f of files) expect(keepsToVoice(read(f)), f).toBe(true);
  });

  it('keeps the playful lines off the page but where the voice says them', () => {
    const page = read('src/app/main.ts');
    // The lines are said through voice(): the page writes none of them itself.
    for (const k of lines) expect(page.includes(`'${VOICE[k].play}'`), k).toBe(false);
  });
});
