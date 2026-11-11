/**
 * Where the page's time goes, phase by phase: each mark the time since the page started, kept in
 * `window.__smaltflPerf` for the browser tools (tools/browser/load.cjs) and printed with `?perf` in the address.
 * Costs nothing worth measuring; changes nothing the page does.
 */
const marks: [string, number][] = [];
(globalThis as { __smaltflPerf?: [string, number][] }).__smaltflPerf = marks;
let last = 0;
export function mark(label: string): void {
  const now = Math.round(performance.now());
  marks.push([label, now]);
  if (typeof location !== 'undefined' && /[?&]perf\b/.test(location.search)) console.log(`smaltfl perf ${String(now).padStart(6)} ms (+${now - last}) ${label}`);
  last = now;
}
