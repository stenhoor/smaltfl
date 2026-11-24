// The Data model's map (explorer.js, the explorer prototype ported as it was reviewed): what the page gives it and what
// it gives back. Typed here because the renderer itself isn't.
import type { DmModel } from '../../core/datamodel.js';

/** A level of the map: the estate (null), a kind opened, or one dataset. */
export type MapLevel = null | { kind: string } | { dataset: string };

/** What the page does for the map. */
export interface MapHost {
  /** The model to draw: the flow's kinds and files with the day on screen added. */
  model(): DmModel & Record<string, unknown>;
  /** The level the page's address names, on first drawing. */
  level(): MapLevel;
  /** The map moved to another level. */
  navigate(level: MapLevel): void;
  /** Decide a paused day: the day's decision sheet. */
  decide(day: string | null): void;
  /** A dataset's or an output's card, at a tab, on the map's day or the one named (the day readers see). */
  openCard(id: string, tab: 'data' | 'summary', day?: string | null): void;
  /** A file's rows on the map's day or the one named, as the recorded run read them: null where none can be read here. */
  rows(id: string, day?: string | null): Promise<MapRows | null>;
  /** Drawn for the first time. */
  ready(): void;
}

/** A file's rows on a day: how many it has, its header, and its first rows to filter and sort (a blank field null). */
export interface MapRows {
  day: string;
  total: number;
  columns: string[];
  rows: (string | null)[][];
}

/** What the page can do with the map once mounted. */
export interface MapHandle {
  setModel(model: DmModel & Record<string, unknown>): void;
  show(level: MapLevel): void;
  openSearch(): void;
  closeSearch(): void;
  closePanel(silent?: boolean): void;
  level(): { level: 'estate' | 'kind' | 'dataset'; kind: string | null; ds: string | null };
  destroy(): void;
}

export function mountExplorer(root: ShadowRoot, host: MapHost): MapHandle;
