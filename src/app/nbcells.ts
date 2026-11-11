/**
 * Notebook cells as smaltnb draws them (stenhoor/smaltnb, app/main.ts), for a notebook read in a card's sheet: a cell is
 * a header (its name, a language chip, its status and how long it took, why, its buttons), its code in smaltkit's
 * editor, and its output in smaltkit's grid (rows fetched as they scroll into view, a foot with the count and a CSV
 * download), the left edge coloured by the status. The look and the keys are smaltnb's; what runs a cell is the
 * caller's (a flow's step reads what the run made; a reader's own cell runs its SQL in the engine).
 *
 * The parts are smaltkit's own (`smaltkit/editor`, `smaltkit/grid`, `smaltkit/markdown`, and `ui.css`, which the app's
 * build puts in the page), pinned in packed.json: nothing of smaltnb's is copied here (ADR 0011 §8).
 */
import { Editor, sqlLanguage, typescriptLanguage, type EditorLanguage, type EditorSchema } from 'smaltkit/editor';
import { exportRows, Grid, type GridRow } from 'smaltkit/grid';
import { markdown } from 'smaltkit/markdown';

/** smaltnb's statuses (its CellView['status']); `held` is a step the day's checks paused. */
export type CellStatus = 'idle' | 'running' | 'ok' | 'stale' | 'skipped' | 'held' | 'error';

export const STATUS_TEXT: Record<CellStatus, string> = {
  idle: 'not run', running: 'running', ok: 'ok', stale: 'stale', skipped: 'skipped', held: 'held', error: 'error',
};

/** Markdown as an editor language: the text as it is, escaped (smaltnb's md cells are written the same way). */
export const markdownLanguage: EditorLanguage = {
  name: 'markdown',
  highlight: (text) => `${text.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))}\n`,
  lineComment: '',
};

export const LANGUAGES = { ts: typescriptLanguage, sql: sqlLanguage, md: markdownLanguage } as const;

export interface CellOptions {
  /** The cell's name, as smaltnb shows it (a step's id, or a reader's `query1`). */
  name: string;
  /** The chip beside the name: the cell's language or kind (sql, ts, md, source, check, gate). */
  chip: string;
  kind?: string;
  code?: string;
  language?: keyof typeof LANGUAGES;
  /** A flow's own cell: shown, never edited here (the notebook on disk is the flow's source). */
  readOnly?: boolean;
  /** Lines shown before "Show all": a long cell stays a tap from its whole text. */
  maxLines?: number;
  label?: string;
  schema?: () => EditorSchema;
  onChange?: (value: string) => void;
  /** Mod+Enter runs the cell; Shift+Enter runs it and moves to the next (smaltnb's keys). */
  onRun?: () => void;
  onRunNext?: () => void;
}

export interface CellUi {
  root: HTMLElement;
  head: HTMLElement;
  editor: Editor | null;
  /** Under the code: callouts, then the output. */
  body: HTMLElement;
  output: HTMLElement;
  grid: Grid | null;
  setStatus(status: CellStatus, text?: string, reason?: string): void;
  setActions(...buttons: HTMLElement[]): void;
  destroy(): void;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

export function button(label: string, title: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = el('button', `nbc-btn ${cls}`.trim(), label);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

const LINE = 20;
const PAD = 18;

/** One cell: the header, the editor, then the body for callouts and the output. */
export function makeCell(o: CellOptions): CellUi {
  const root = el('section', `nbc kind-${o.kind ?? 'cell'}`);
  root.dataset.cell = o.name;
  root.dataset.status = 'idle';
  const head = el('header', 'nbc-head');
  const name = el('span', 'nbc-name', o.name);
  const chip = el('span', 'nbc-chip', o.chip);
  const status = el('span', 'nbc-status');
  const reason = el('span', 'nbc-reason');
  const actions = el('span', 'nbc-actions');
  head.append(name, chip, status, reason, actions);
  root.append(head);
  let editor: Editor | null = null;
  if (o.code !== undefined) {
    const host = el('div', 'nbc-editor');
    root.append(host);
    editor = new Editor(host, {
      language: LANGUAGES[o.language ?? 'ts'],
      value: o.code,
      label: o.label ?? `Cell ${o.name}`,
      schema: o.schema,
      onChange: (v) => {
        size();
        o.onChange?.(v);
      },
      keys: {
        'Mod+Enter': () => o.onRun?.(),
        'Shift+Enter': () => (o.onRunNext ?? o.onRun)?.(),
      },
    });
    if (o.readOnly) {
      editor.ta.readOnly = true;
      root.classList.add('read-only');
    }
    const ed = editor;
    let all = !o.maxLines;
    const more = el('button', 'nbc-more');
    more.type = 'button';
    const size = () => {
      const lines = Math.max(1, ed.value.split('\n').length);
      const shown = all ? lines : Math.min(lines, o.maxLines ?? lines);
      ed.host.style.height = `${shown * LINE + PAD}px`;
      more.hidden = all || lines <= (o.maxLines ?? lines);
      more.textContent = `Show all ${lines} lines`;
    };
    more.addEventListener('click', () => {
      all = true;
      size();
    });
    root.append(more);
    size();
  }
  const body = el('div', 'nbc-body');
  const output = el('div', 'nbc-output');
  body.append(output);
  root.append(body);
  const ui: CellUi = {
    root, head, editor, body, output, grid: null,
    setStatus(s, text, why) {
      root.dataset.status = s;
      status.textContent = text ?? STATUS_TEXT[s];
      reason.textContent = why ?? '';
      reason.title = why ?? '';
    },
    setActions(...buttons) {
      actions.replaceChildren(...buttons);
    },
    destroy() {
      ui.grid?.destroy();
      ui.grid = null;
    },
  };
  return ui;
}

export interface Rows {
  columns: string[];
  rowCount: number;
  initial?: GridRow[];
  fetch(offset: number, limit: number): Promise<GridRow[]>;
}

/**
 * A cell's table output, as smaltnb shows it: smaltkit's grid, twelve rows high at most, fetching rows as they scroll
 * into view, with a foot that counts the rows and columns and downloads them all as CSV. `extra` goes in the foot
 * before the download (links of the caller's own).
 */
export function showRows(c: CellUi, rows: Rows, o: { file: string; before?: Node[]; extra?: Node[] }): void {
  c.grid?.destroy();
  c.grid = null;
  const box = el('div', 'nbc-table');
  box.style.height = `${Math.min(Math.max(rows.rowCount, 1), 12) * 26 + 32}px`;
  const foot = el('div', 'nbc-foot');
  const count = el('span', 'nbc-count', `${rows.rowCount.toLocaleString('en-US')} row${rows.rowCount === 1 ? '' : 's'} · ${rows.columns.length} column${rows.columns.length === 1 ? '' : 's'}`);
  const csv = button('Download CSV', 'Download every row as CSV', () => void download(), 'small');
  foot.append(count, ...(o.extra ?? []), csv);
  c.output.replaceChildren(...(o.before ?? []), box, foot);
  const grid = new Grid(box, { emptyText: 'No rows' });
  grid.setSource({ columns: rows.columns, rowCount: rows.rowCount, initial: rows.initial, fetch: (offset, limit) => rows.fetch(offset, limit) });
  c.grid = grid;
  const download = async () => {
    const all = await rows.fetch(0, rows.rowCount);
    const blob = new Blob([exportRows('csv', rows.columns, all)], { type: 'text/csv' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${o.file.replace(/[^\w.-]+/g, '_') || 'rows'}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/** A cell's error, as smaltnb shows it: the message in the output, in the danger colour. */
export function showError(c: CellUi, message: string): void {
  c.grid?.destroy();
  c.grid = null;
  const pre = el('pre', 'nbc-error', message);
  pre.setAttribute('role', 'alert');
  c.output.replaceChildren(pre);
}

/** A text cell's output: its Markdown rendered (smaltkit escapes raw HTML, which shows as text). */
export function showMarkdown(c: CellUi, text: string): void {
  const div = el('div', 'sk-md nbc-md');
  div.innerHTML = markdown(text, { headingOffset: 2 });
  c.output.replaceChildren(div);
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}
