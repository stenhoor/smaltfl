// The Data model's map (ADR 0028 §9) in a bundle of its own (`datamodel.js`): loaded the first time the view opens, so
// the page's first load never carries it. The map draws in its own shadow root, with its own style sheet on the page's
// colour roles and type scale, so neither the page's styles nor the map's reach the other.
import css from './datamodel/explorer.css';
import { mountExplorer, type MapHandle, type MapHost } from './datamodel/explorer.js';

export type { MapHandle, MapHost, MapLevel, MapRows } from './datamodel/explorer.js';

/** The map's frame: where you are and what you can do, what waits, the canvas, and the layer its panels open in. */
const SKELETON = `<div class="app">
  <div class="trailbar"><nav class="trail" id="trail" aria-label="Where you are in the data model"></nav><div class="tools"><span class="dm-views"></span><button type="button" class="search" aria-label="Search, act or ask (Ctrl K)"><span aria-hidden="true">⌕</span> <span class="lbl">Search, act or ask</span> <span class="kbd">Ctrl K</span></button></div></div>
  <div class="alertslot"></div>
  <div class="canvas" id="canvas"><div class="stage" id="stage"><svg class="links" id="links" aria-hidden="true"></svg></div></div>
</div>
<div id="layer"></div>`;

/**
 * The map in `el`, drawn from what `host` gives it; `views` (the switch between the Data model's views) sits in its
 * line, beside search. Mounted once: later models are given to the handle.
 */
export function mountDataModel(el: HTMLElement, host: MapHost, views: HTMLElement): MapHandle {
  const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${css}</style>${SKELETON}`;
  root.querySelector('.dm-views')!.append(views);
  return mountExplorer(root, host);
}
