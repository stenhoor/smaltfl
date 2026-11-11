/**
 * The desktop split (ADR 0018, amended 2026-11-11): from 960 px the flow is on the left and the workspace (the sheet a
 * card or a notebook opens) on the right, across the whole window but a band at each edge. A bar between them is dragged
 * to give either more room (or moved by the arrow keys, as a separator is), and its buttons give either the whole
 * window and bring the other back. The width is the reader's, kept in this browser; nothing here changes what a phone or
 * a tablet below 960 px gets.
 *
 * The layout itself is CSS (`page.html`): the sheet is `--sheet-w` wide and main gives that width up while it is open;
 * `body[data-split]` is `work` (the workspace has the window) or `flow` (the flow has it), absent for the split.
 */
const KEY = 'smaltfl:split';
const WIDE = '(min-width: 960px)';
const MIN_WORK = 340;
const MIN_FLOW = 360;
const STEP = 40;

type Mode = 'split' | 'work' | 'flow';

/** Opening a card or a notebook shows the workspace: a flow given the whole window gives the split back. */
export function showWorkspace(): void {
  if (document.body.dataset.split === 'flow') {
    delete document.body.dataset.split;
    window.dispatchEvent(new Event('resize'));
  }
}

export function setUpSplit(sheet: HTMLElement): void {
  const root = document.documentElement;
  const bar = document.createElement('div');
  bar.id = 'split';
  bar.setAttribute('role', 'separator');
  bar.setAttribute('aria-orientation', 'vertical');
  bar.setAttribute('aria-controls', 'sheet');
  bar.setAttribute('aria-label', 'Drag to give the flow or the workspace more room');
  bar.tabIndex = 0;
  const button = (cls: string, label: string, text: string, go: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `split-btn ${cls}`;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.textContent = text;
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      go();
    });
    return b;
  };
  const toWork = button('to-work', 'Give the workspace the whole window', '‹', () => setMode(mode() === 'flow' ? 'split' : 'work'));
  const toFlow = button('to-flow', 'Give the flow the whole window', '›', () => setMode(mode() === 'work' ? 'split' : 'flow'));
  const grip = document.createElement('span');
  grip.className = 'split-grip';
  grip.setAttribute('aria-hidden', 'true');
  bar.append(toWork, grip, toFlow);
  document.body.append(bar);

  const mode = (): Mode => (document.body.dataset.split as Mode | undefined) ?? 'split';
  const setMode = (m: Mode) => {
    if (m === 'split') delete document.body.dataset.split;
    else document.body.dataset.split = m;
    toWork.setAttribute('aria-label', m === 'flow' ? 'Bring the workspace back' : 'Give the workspace the whole window');
    toFlow.setAttribute('aria-label', m === 'work' ? 'Bring the flow back' : 'Give the flow the whole window');
    toWork.title = toWork.getAttribute('aria-label')!;
    toFlow.title = toFlow.getAttribute('aria-label')!;
    window.dispatchEvent(new Event('resize'));
  };

  const clamp = (w: number) => Math.round(Math.max(MIN_WORK, Math.min(window.innerWidth - MIN_FLOW, w)));
  let width: number | null = null;
  try {
    const v = Number(localStorage.getItem(KEY));
    if (Number.isFinite(v) && v > 0) width = v;
  } catch {
    // Storage blocked: the default width.
  }
  const apply = () => {
    if (width === null) {
      root.style.removeProperty('--sheet-w');
    } else root.style.setProperty('--sheet-w', `${clamp(width)}px`);
    const now = sheet.getBoundingClientRect().width || clamp(width ?? 480);
    bar.setAttribute('aria-valuemin', String(MIN_WORK));
    bar.setAttribute('aria-valuemax', String(Math.max(MIN_WORK, window.innerWidth - MIN_FLOW)));
    bar.setAttribute('aria-valuenow', String(Math.round(now)));
  };
  const save = () => {
    try {
      if (width === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(clamp(width)));
    } catch {
      // Not kept past this page.
    }
  };
  apply();
  window.addEventListener('resize', apply);

  let dragging = false;
  bar.addEventListener('pointerdown', (e) => {
    if (!window.matchMedia(WIDE).matches || e.button !== 0) return;
    if (mode() !== 'split') setMode('split');
    dragging = true;
    bar.setPointerCapture(e.pointerId);
    document.body.classList.add('splitting');
    e.preventDefault();
  });
  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    width = clamp(window.innerWidth - e.clientX);
    apply();
  });
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId);
    document.body.classList.remove('splitting');
    save();
    window.dispatchEvent(new Event('resize'));
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  // A double tap on the bar puts the split back where it starts.
  bar.addEventListener('dblclick', () => {
    width = null;
    setMode('split');
    apply();
    save();
  });
  bar.addEventListener('keydown', (e) => {
    const now = width ?? sheet.getBoundingClientRect().width;
    if (e.key === 'ArrowLeft') width = clamp(now + STEP);
    else if (e.key === 'ArrowRight') width = clamp(now - STEP);
    else if (e.key === 'Home') return setMode('work');
    else if (e.key === 'End') return setMode('flow');
    else if (e.key === 'Enter' || e.key === 'Escape') return setMode('split');
    else return;
    e.preventDefault();
    if (mode() !== 'split') setMode('split');
    apply();
    save();
  });

  // A closed sheet ends a maximised side: the next one opens in the split.
  new MutationObserver(() => {
    if (sheet.hidden && mode() !== 'split') setMode('split');
  }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
}
