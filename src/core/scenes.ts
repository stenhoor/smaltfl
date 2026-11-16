/**
 * A demo's scenes (ADR 0023 §4): what the demo shows, a capability a scene, each with the days to look at and, on each,
 * the place to look: a version of the day, a card and its tab, or the day's decision. The month screen lists them
 * ("What this demo shows") and a scene's look opens by its link (`#scene/4/2`: the fourth scene's second look). The
 * build ships them in loads.json from the data list's variant (`scenes`); the page reads them as data, so a demo
 * without them shows no list.
 */

export const SCENES_FORMAT = 'smaltfl-scenes/1';

/** The tabs a scene may open on a card, by the names the app gives them. */
export const SCENE_TABS = ['happened', 'quality', 'notebook', 'news', 'data', 'columns', 'history', 'checks', 'contract', 'rules', 'models', 'about'] as const;
export type SceneTab = (typeof SCENE_TABS)[number];

/** One place to look: a day, the words its link says, and on the day a version of it, a card's tab or the decision. */
export interface SceneLook {
  day: string;
  label: string;
  /** The version of the day (`#day/…/vN`, ADR 0021 §4): none, the one readers got. */
  version?: number;
  /** A card to open on the day, on a tab of it (its first tab where none is named). */
  card?: string;
  tab?: SceneTab;
  /** The day's decision sheet, opened as Decide › opens it: a day left for the visitor to decide. */
  decide?: true;
}

/** A scene: its number in the tour (none for the stories kept as more to see), what it shows, what happened, where to
 * look. */
export interface Scene {
  n?: number;
  title: string;
  said: string;
  looks: SceneLook[];
}

export interface ScenesFile {
  format: typeof SCENES_FORMAT;
  title: string;
  scenes: Scene[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const words = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

/**
 * What is wrong with a scenes file, as a list of problems (empty when it is good). With `days` and `cards`, its days are
 * checked against the demo's and its cards against the flow's. A scene's number is its place among the numbered ones:
 * 1, 2, 3 and on, the stories kept as more to see after them.
 */
export function scenesProblems(v: unknown, o: { days?: readonly string[]; cards?: readonly string[] } = {}): string[] {
  const out: string[] = [];
  if (!isRecord(v)) return ['a scenes file is a JSON object'];
  if (v.format !== SCENES_FORMAT) out.push(`its format is ${SCENES_FORMAT}`);
  if (!words(v.title)) out.push('it has a title');
  if (!Array.isArray(v.scenes) || v.scenes.length === 0) return [...out, 'it lists its scenes'];
  let numbered = 0;
  let more = false;
  v.scenes.forEach((s, i) => {
    const at = `scene ${i + 1}`;
    if (!isRecord(s)) return void out.push(`${at}: a scene is an object`);
    if (s.n !== undefined) {
      if (more) out.push(`${at}: a numbered scene comes before the stories kept as more to see`);
      if (s.n !== ++numbered) out.push(`${at}: its number is ${numbered}, its place among the numbered scenes`);
    } else more = true;
    if (!words(s.title)) out.push(`${at}: it says what it shows (title)`);
    if (!words(s.said)) out.push(`${at}: it says what happened (said)`);
    if (!Array.isArray(s.looks) || s.looks.length === 0) return void out.push(`${at}: it has a place to look`);
    s.looks.forEach((l, k) => {
      const where = `${at}, look ${k + 1}`;
      if (!isRecord(l)) return void out.push(`${where}: a look is an object`);
      if (typeof l.day !== 'string' || !DAY.test(l.day)) out.push(`${where}: its day is YYYY-MM-DD`);
      else if (o.days && !o.days.includes(l.day)) out.push(`${where}: ${l.day} isn't a day of the demo`);
      if (!words(l.label)) out.push(`${where}: its link says something (label)`);
      if (l.version !== undefined && !(Number.isInteger(l.version) && (l.version as number) >= 1)) out.push(`${where}: a version is 1 or more`);
      if (l.card !== undefined && !words(l.card)) out.push(`${where}: a card is named`);
      else if (typeof l.card === 'string' && o.cards && !o.cards.includes(l.card)) out.push(`${where}: ${l.card} isn't a card of the flow`);
      if (l.tab !== undefined && !(SCENE_TABS as readonly unknown[]).includes(l.tab)) out.push(`${where}: its tab is one of ${SCENE_TABS.join(', ')}`);
      if (l.tab !== undefined && l.card === undefined) out.push(`${where}: a tab is a card's`);
      if (l.decide !== undefined && l.decide !== true) out.push(`${where}: decide is true or left out`);
      if (l.decide && l.card !== undefined) out.push(`${where}: it opens the decision or a card, not both`);
    });
  });
  return out;
}

export const isScenesFile = (v: unknown): v is ScenesFile => scenesProblems(v).length === 0;

/** A scene's look by its link's numbers (`#scene/4/2`): the scene by its place in the list, from 1, and its look, from
 * 1 (the first where none is given). Null where there is none. */
export function lookOf(file: ScenesFile, scene: number, look = 1): { scene: Scene; look: SceneLook; at: [number, number] } | null {
  const s = file.scenes[scene - 1];
  const l = s?.looks[look - 1];
  return s && l ? { scene: s, look: l, at: [scene, look] } : null;
}

/** A scene's link: its place in the list and its look's. */
export const sceneHash = (scene: number, look = 1): string => `#scene/${scene}${look > 1 ? `/${look}` : ''}`;
