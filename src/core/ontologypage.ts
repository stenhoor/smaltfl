/**
 * The Ontology page as data (ADR 0015 amendment 1, piece a): one section a file the flow reads, each with what the
 * file is, the file's own rules, a card a column (its meaning and its rules) and a place for what the app discovers;
 * then one a dataset the flow makes that a gate judges and that has rules, laid out like a file's (Q-144, ADR 0022 §3),
 * each file naming the made datasets that read it.
 * Everything is read from the document as it stands: the ontology's `rows` and the gate cell's own rules through
 * `writtenRules` (so the page names the rules the plan counts), a column's marks through `marksOn` (so a band is the
 * one the plan carries for that file). Nothing is added to the document, nothing here is judged, and nothing is
 * shared between files: a band the ontology gives wherever a column appears is listed in each file's section as that
 * file's rule. Pure: no DOM, no engine. The page puts the drawings and the load's counts beside it.
 *
 * A rule's sentence uses the ontology's titles and the words for its values, never a raw column or code where a
 * title exists. A condition its author wrote for the engine in a gate cell is quoted as written. A file's rule that
 * is about a column (its key, the objects it covers) is listed on that column's card as well, counted once.
 */
import { sourceOf, type FlowDocument } from './document.js';
import { gateChecksOf, gateLayerOf, writtenRules, type CheckName, type Layer } from './gates.js';
import { marksOn, meaningOf, nounOf, propertyOf, rowsOf, saysMore, type Noun, type ObjectType, type Ontology, type PropertyType } from './ontology.js';
import { ACTION_SAID, checkStepOf, ruleOn, rulesOf, ruleSaid, type OntologyRule } from './rules.js';

/**
 * How a rule came to be. Today every rule is set by hand, in the ontology or in the notebook's gate cell. The two
 * other ways are the next pieces' to fill (ADR 0015 amendment 1, Q-142): a range derived from the last days of the
 * history, fixed once set or rolling over those days, and a rule the app discovered in the data.
 */

/** How a rule over loose ids (a rows entry's or a gate cell's scope's `ids`, Q-176) says so. */
const LOOSE_SAID = '; an id is the same whatever its case and the spaces around it';
export type RuleOrigin =
  | { how: 'set'; in: 'ontology' | 'notebook' }
  | { how: 'derived'; days: number; kept: 'fixed' | 'rolling' }
  | { how: 'discovered' };

/**
 * What a rule is about. A file's own: `rows` (what a row is), `covers` (the objects it has rows for), `key` (its key
 * on one row each, never blank), `same` (its keys equal another dataset's), `needs` (a value another value forbids).
 * A column's: `values` (a value the file never held before is wrong), `bad` (a value that means something went
 * wrong), `band` (a value's share of the rows), `due` (a due date and what makes a row late), `after` (a time that
 * runs behind another). `set`: a rule people set on the column (rules.ts), which the page edits and the import card
 * switches.
 */
export type RuleKind = 'rows' | 'covers' | 'key' | 'same' | 'needs' | 'values' | 'bad' | 'band' | 'due' | 'after' | 'set';

/** One rule of a file or of a column, as the page lists it. */
export interface Rule {
  /** Stable while the rule stands: `<file>/<kind>` for a file's rule, `<file>/<column>/<kind>` for a column's (the
   * column in lower case), with `=<value>` for a rule about one value and `#<n>` for the n-th dependency. */
  id: string;
  kind: RuleKind;
  /** The rule in plain words. */
  said: string;
  /** The numbers behind it, where it has any: a band's ends as shares (0 to 1), a window in days, a lag in minutes. */
  numbers?: { low?: number; high?: number; days?: number; minutes?: number };
  /** The values it is about, as the file writes them: the banded or bad value; for a `values` rule the ones the
   * ontology describes (not a closed list: the check is against what the file has held before). */
  values?: string[];
  /** The dataset it is checked against (the inventory a scope reads, the dataset whose keys these must equal). */
  against?: string;
  /** That dataset in words: "the list of applications (apps)" for the inventory a scope reads, else its name. */
  againstSaid?: string;
  /** On a file's own rule, the file's columns it is about, as the rule writes them (its key, the column held to the
   * objects it covers, the columns a dependency names): the rule is listed on each of their cards too. */
  columns?: string[];
  origin: RuleOrigin;
  /** Why nothing judges it as the flow stands, in a few words; absent while it is judged. */
  unchecked?: string;
  /** A rule people set (`set`): the ontology's entry, which the form edits, and what a row that breaks it does. */
  def?: OntologyRule;
}

/** A column of a file: what it is called, what it means, and its rules. */
export interface ColumnCard {
  /** The column as the file writes it. */
  name: string;
  /** What people call it: the ontology's title, or the name where the ontology doesn't describe it. */
  title: string;
  /** The name as the file writes it, where it says something the title doesn't (`saysMore`: "app_id" beside
   * "Application"; "name" under "Name" is one word, and absent). The card shows it beside the title only then. */
  asWritten?: string;
  /** What it holds, in the ontology's words. */
  description?: string;
  /** The words for its coded values, in the ontology's order: every value the ontology lists. */
  values: [code: string, meaning: string][];
  /** Of those, the values whose meaning says more than the value does (`saysMore`: "Card data" for pci, never "Yes"
   * for yes): what the card's "What its values stand for" lists and counts. Empty, the list isn't offered. */
  standFor: [code: string, meaning: string][];
  /** The ontology's entry for it in this file (`propertyOf`): its unit, its note, where its meaning comes from. */
  property?: PropertyType;
  /** The column's own rules, from its marks in this file. */
  rules: Rule[];
  /** The file's own rules that are about this column (`Rule.columns`), each as the column's card says it: listed
   * there with the column's own, so the key says under its column that it has to be there, and counted once, as the
   * file's. */
  fileRules: { rule: Rule; said: string }[];
}

/** A file the flow reads, or a dataset it makes (`made`, Q-144), laid out the same way. */
export interface FileSection {
  /** The source's id: the file's name in the flow; a made dataset's step id. */
  id: string;
  description?: string;
  /** The description's opening, for the list of files: up to its first colon or full stop. */
  summary: string;
  /** What a row of it is called, one and many. */
  noun: Noun;
  /** Set where other files are checked against this one (their scope reads it): what it lists, and which files. */
  inventory?: { noun: Noun; files: string[]; said: string };
  /** Whether a watch judges the file's loads. */
  watched: boolean;
  /** The file's own rules. */
  rules: Rule[];
  /** A card a column, in the file's order; null while the file's columns aren't known (no load read yet). */
  columns: ColumnCard[] | null;
  /** The columns the ontology describes as this file's own that the flow doesn't read (a column a file added, described
   * from its day, ADR 0022 §2, Q-204): what each is called and holds. Absent where there are none, or the file's columns
   * aren't known. */
  unread?: { name: string; title: string; description?: string }[];
  /** What the app discovered in the data, to accept: nothing writes here yet. */
  discovered: Rule[];
  /** How many rules the file has: its own and its columns'. */
  count: number;
  /** A file's: the made datasets with a section of their own that read it, near or far, in the flow's order (Q-144).
   * Absent where none does. */
  readBy?: string[];
  /** A dataset the flow makes (Q-144): the layer its gate judges it at, and whether readers get it. Absent on a file. */
  made?: { layer: Layer | null; published: boolean };
}

/** The page: a section a file, one a made dataset with rules, and the object types still drawn after them. */
export interface OntologyPage {
  files: FileSection[];
  /** The datasets the flow makes that a gate judges and that have rules, in the flow's order (Q-144). */
  made: FileSection[];
  /** The object types with a link or an action, or that no file's rows are tied to. A type that only says what
   * files' rows are isn't drawn as a box: that is the files' own rules now. */
  types: ObjectType[];
}

type PageDoc = Pick<FlowDocument, 'sources'> & Partial<Pick<FlowDocument, 'steps' | 'ontology' | 'gates' | 'publish'>>;

const lower = (x: string) => x.toLowerCase();
/** "A", "A or B", "A, B or C". */
const either = (xs: readonly string[], word = 'or') => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${word} ${xs.at(-1)}`);
/** "a zone", "an application", "a unit". */
const withArticle = (word: string) => `${/^(?:[aeio]|u(?!ni|se|sa|ti))/i.test(word) ? 'an' : 'a'} ${word}`;
/** A share as a percentage to a tenth of a point: 15%, 2.5%. */
const percent = (x: number) => `${Math.round(x * 1000) / 10}%`;
const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

/** How a rule came to be, in a few words: "Set by hand", "From the last 90 days, rolling", "Discovered in the data". */
export function originSaid(o: RuleOrigin): string {
  if (o.how === 'set') return 'Set by hand';
  if (o.how === 'derived') return `From the last ${days(o.days)}, ${o.kept}`;
  return 'Discovered in the data';
}

/** The object types the page still draws (`OntologyPage.types`). */
export function typesShown(ontology: Ontology | undefined): ObjectType[] {
  const o = ontology;
  if (!o) return [];
  const tied = new Set((o.rows ?? []).map((r) => r.of));
  return o.objectTypes.filter((t) => !tied.has(t.id) || o.linkTypes.some((l) => l.from === t.id || l.to === t.id) || o.actionTypes.some((a) => a.on === t.id));
}

/**
 * The page for a document. `columns` gives each file's columns as its load has them, in the file's order (the app
 * gives the ones the viewer may read, so a hidden column has no card and its rules aren't listed); a file it returns
 * nothing for has no cards yet. `every` gives all the columns a file has, where that is more than the cards (a rule
 * on one column may stand aside for a mark on another the viewer can't read); the cards' columns without it.
 */
export function ontologyPage(doc: PageDoc, columns: (file: string) => readonly string[] | undefined = () => undefined, every: (file: string) => readonly string[] | undefined = columns): OntologyPage {
  const o = doc.ontology;
  const steps = doc.steps ?? [];
  const title = (dataset: string, column: string) => propertyOf(o, dataset, column)?.title ?? column;
  const word = (dataset: string, column: string, value: string) => meaningOf(propertyOf(o, dataset, column), value) ?? value;
  /** A condition in words, its columns read in `dataset`: "Internet-facing is Yes and Criticality is Critical or High". */
  const where = (dataset: string, cond: readonly (readonly [string, readonly string[]])[]) => cond.map(([c, vs]) => `${title(dataset, c)} is ${either(vs.map((v) => word(dataset, c, v)))}`).join(' and ');
  const listed = (m: Record<string, string | string[]>) => Object.entries(m).map(([c, v]): [string, string[]] => [c, Array.isArray(v) ? v : [v]]);
  const nounFor = (id: string) => nounOf(o, id, steps.filter((s) => s.inputs.some((i) => lower(sourceOf({ steps }, i) ?? '') === lower(id))).map((s) => s.id));
  const watchedIds = Object.keys(doc.publish?.watch ?? {}).map(lower);
  const stepOf = new Map(steps.map((st) => [lower(st.id), st]));
  const sourceIds = new Set(doc.sources.map((src) => lower(src.id)));
  /** The sources a dataset reads, directly or through other steps, by their ids in lower case. */
  const readsOf = (id: string): Set<string> => {
    const out = new Set<string>();
    const seen = new Set<string>();
    const todo = [lower(id)];
    while (todo.length) {
      const x = todo.pop()!;
      if (seen.has(x)) continue;
      seen.add(x);
      if (sourceIds.has(x)) out.add(x);
      else for (const i of stepOf.get(x)?.inputs ?? []) todo.push(lower(i));
    }
    return out;
  };

  const named = (id: string) => Object.keys(o?.nouns ?? {}).some((k) => lower(k) === lower(id));

  /** A file's section, or a made dataset's (`made`): the same rules from the same places, but for the rules people set
   * on a file's columns, which a made dataset has none of. */
  const section = (id: string, description: string | undefined, made: boolean): FileSection => {
    const watched = watchedIds.includes(lower(id));
    const checks = gateChecksOf(doc, id);
    const published = made && steps.some((s) => lower(s.id) === lower(id) && s.dataset !== undefined);
    const tied = rowsOf(o, id);
    // A made dataset's rows are called as its type's objects where the ontology gives it no noun of its own.
    const noun = made && tied && !named(id) ? { one: lower(tied.type.name), many: `${lower(tied.type.name)}s` } : nounFor(id);
    const thing = made ? 'dataset' : 'file';
    /** Why a check that is off is off: the gate cell's own switch, or its layer's default. */
    const offWhy = (check: CheckName): string | undefined => {
      if (!checks || checks[check] !== 'off') return undefined;
      const own = Object.entries(doc.gates ?? {}).find(([k]) => lower(k) === lower(id))?.[1];
      return own?.checks[check] === 'off' ? 'switched off in the notebook' : `not checked at the ${own?.layer ?? gateLayerOf(doc, id)} layer`;
    };
    /** Why a rule of this check isn't judged as the flow stands: the file's reason first, then the rule's own. A published
     * dataset nothing watches has its key counted by each run all the same (ADR 0014 §6). */
    const quiet = (check: CheckName | null, own?: string): { unchecked: string } | Record<string, never> => {
      const counted = published && check === 'reconcile';
      const why = !watched && !counted ? `nothing watches this ${thing}` : (own ?? (check ? offWhy(check) : undefined));
      return why ? { unchecked: why } : {};
    };
    const written = writtenRules(doc, id);
    const rules: Rule[] = [];
    // What a row is, and the objects the file has rows for: the ontology's `rows` (ADR 0015 §1).
    if (tied) {
      const one = lower(tied.type.name);
      rules.push({ id: `${id}/rows`, kind: 'rows', said: `One row ${withArticle(one)}`, origin: { how: 'set', in: 'ontology' }, ...quiet(published ? 'reconcile' : null, tied.key === null ? 'a key of several columns isn’t checked yet' : undefined) });
    }
    // Each rule that is about columns of this file names them (`columns`), and says how it reads on a column's card
    // where that isn't its own sentence (`onCard`).
    const onCard = new Map<Rule, string>();
    if (written.scope) {
      const sc = written.scope;
      const many = nounFor(sc.of).many;
      const said = (sc.from === 'gate' ? `Covers the ${many} where ${sc.where}, and no others`
        : sc.match.length ? `Covers the ${many} where ${where(sc.of, sc.match)}, and no others`
        : `Covers every ${nounFor(sc.of).one}, and no others`) + (sc.loose ? LOOSE_SAID : '');
      const rule: Rule = { id: `${id}/covers`, kind: 'covers', said, against: sc.of, againstSaid: `the list of ${many} (${sc.of})`, columns: [sc.own], origin: { how: 'set', in: sc.from === 'gate' ? 'notebook' : 'ontology' }, ...quiet('scope') };
      onCard.set(rule, `Must be one of the ${many} this file covers`);
      rules.push(rule);
    }
    if (written.reconcile) {
      const rc = written.reconcile;
      const keys = either(rc.key.map((c) => title(id, c)), 'and');
      const origin: RuleOrigin = { how: 'set', in: rc.from === 'gate' ? 'notebook' : 'ontology' };
      rules.push({ id: `${id}/key`, kind: 'key', said: `No ${keys} blank or repeated${rc.loose ? LOOSE_SAID : ''}`, columns: [...rc.key], origin, ...quiet('reconcile') });
      if (rc.of !== undefined) rules.push({ id: `${id}/same`, kind: 'same', said: `The same ${keys} values as ${rc.of}: none missing, none extra`, against: rc.of, againstSaid: rc.of, columns: [...rc.key], origin, ...quiet('reconcile') });
    }
    written.needs.forEach((n, k) => {
      const from = n.from ?? id;
      const then = listed(n.then).map(([c, vs]) => `${title(id, c)} must be ${either(vs.map((v) => word(id, c, v)))}`).join(' and ');
      // The columns of this file it names: what must hold, and the condition's where that is read here.
      const about = [...new Set([...(n.from ? [] : Object.keys(n.when)), ...Object.keys(n.then)])];
      // Written once in the ontology (Q-119), or in the gate cell, which may override one of the ontology's.
      rules.push({ id: `${id}/needs#${k + 1}`, kind: 'needs', said: `Where ${where(from, listed(n.when))}${n.from ? ` in ${n.from}` : ''}, ${then}${n.overrides ? ` (the notebook’s, in place of the ontology’s ${n.overrides})` : ''}`, ...(n.from ? { against: n.from, againstSaid: n.from } : {}), columns: about, origin: { how: 'set', in: n.written === 'gate' ? 'notebook' : 'ontology' }, ...quiet('needs') });
    });

    // The rules people set on this file's columns (rules.ts): enforced by the check step that reads the file, said as
    // switched off when the import card has switched them off.
    const setRules = made ? [] : rulesOf(o, id);
    const enforcer = made ? undefined : checkStepOf(doc as Parameters<typeof checkStepOf>[0], id);
    const setRule = (r: OntologyRule): Rule => {
      const why = !enforcer ? 'no check step reads this file directly' : !ruleOn(enforcer, r.id) ? `switched off in ${enforcer.id}’s cell` : undefined;
      return { id: `${id}/${lower(r.column)}/set=${r.id}`, kind: 'set', said: `${ruleSaid(o, r)}: else ${ACTION_SAID[r.action]}`, ...(r.values ? { values: [...r.values] } : {}), ...(r.min !== undefined || r.max !== undefined ? { numbers: { ...(r.min !== undefined ? { low: r.min } : {}), ...(r.max !== undefined ? { high: r.max } : {}) } } : {}), origin: { how: 'set', in: 'ontology' }, def: r, ...(why ? { unchecked: why } : {}) };
    };
    // A card a column the load has, each with the rules its marks give in this file (`marksOn`, as the plan reads them).
    const has = columns(id);
    const marks = marksOn(o, id);
    // The due dates this file has: a mark on a column the ontology describes wherever it appears says nothing of a
    // file without the column.
    const all = (every(id) ?? has ?? []).map(lower);
    const dues = marks.due.filter(([column]) => all.includes(lower(column)));
    const cards = has
      ? has.map((name): ColumnCard => {
          const p = propertyOf(o, id, name);
          const mine = <T extends unknown[]>(xs: T[]) => xs.filter((x) => lower(String(x[0])) === lower(name));
          const at = `${id}/${lower(name)}`;
          const origin: RuleOrigin = { how: 'set', in: 'ontology' };
          const own: Rule[] = [];
          // The check is against what the file has held before, not against a list: the values the ontology describes
          // are the column's meaning (its card lists them), and one of them never seen is as new as any other.
          if (mine(marks.newValues).length) {
            const known = Object.keys(p?.values ?? {});
            own.push({ id: `${at}/values`, kind: 'values', said: 'A value never seen in this file before is flagged as wrong', ...(known.length ? { values: known } : {}), origin, ...quiet('values') });
          }
          // A value that is the miss of a due date in this file is told through the due date (ADR 0014 §3, news.ts's
          // `dueMiss`): neither its jump nor a band on it is judged. One with a band is judged by the band alone: its
          // jump isn't. Each says so.
          const missOf = new Set(dues.filter(([, status]) => lower(status) === lower(name)).map(([, , miss]) => miss));
          const banded = new Set(mine(marks.expect).map(([, value]) => value));
          const instead = (code: string, band: boolean) => (missOf.has(code) ? 'this file’s due date is checked instead' : band && banded.has(code) ? `this file’s band on ${word(id, name, code)} is checked instead` : undefined);
          for (const [, ...codes] of mine(marks.bad)) for (const code of codes) own.push({ id: `${at}/bad=${code}`, kind: 'bad', said: `${word(id, name, code)} is a bad value: a jump above its usual share is flagged as wrong`, values: [code], origin, ...quiet('shares', instead(code, true)) });
          for (const [, value, low, high] of mine(marks.expect)) own.push({ id: `${at}/band=${value}`, kind: 'band', said: `${word(id, name, value)} between ${percent(low)} and ${percent(high)} of ${noun.many}`, numbers: { low, high }, values: [value], origin, ...quiet('values', instead(value, false)) });
          for (const [, status, miss, within] of mine(marks.due)) own.push({ id: `${at}/due`, kind: 'due', said: `A due date: a row is late if its ${title(id, status)} is still ${word(id, status, miss)} the day after; flagged as wrong when more are late than usual`, numbers: { days: within }, values: [miss], origin, ...quiet('due') });
          for (const [, of, minutes] of mine(marks.after)) own.push({ id: `${at}/after`, kind: 'after', said: `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} after ${title(id, of)}`, numbers: { minutes }, origin, ...quiet('shape') });
          for (const r of setRules.filter((x) => lower(x.column) === lower(name))) own.push(setRule(r));
          const fileRules = rules.filter((r) => r.columns?.some((c) => lower(c) === lower(name))).map((rule) => ({ rule, said: onCard.get(rule) ?? rule.said }));
          const called = p?.title ?? name;
          const values = Object.entries(p?.values ?? {});
          return { name, title: called, ...(saysMore(name, called) ? { asWritten: name } : {}), ...(p?.description ? { description: p.description } : {}), values, standFor: values.filter(([code, meaning]) => saysMore(meaning, code)), ...(p ? { property: p } : {}), rules: own, fileRules };
        })
      : null;

    // A rule set on a column no card shows (the load doesn't have it, or no load was read yet) is listed with the
    // file's own, so it is never out of sight.
    const carded = new Set((cards ?? []).map((c) => lower(c.name)));
    for (const r of setRules) if (!carded.has(lower(r.column))) rules.push({ ...setRule(r), columns: [r.column] });
    // The columns described as this file's own that it doesn't have as the flow reads it (ADR 0022 §2, Q-204): all of
    // its columns (`every`), so a column hidden from the viewer is read, not listed here.
    const read = every(id) ?? has;
    const unread = read && !made
      ? (o?.properties ?? []).filter((p) => p.datasets?.length === 1 && lower(p.datasets[0]!) === lower(id) && !read.some((c) => lower(c) === lower(p.column)))
        .map((p) => ({ name: p.column, title: p.title ?? p.column, ...(p.description ? { description: p.description } : {}) }))
      : [];
    // The files whose scope reads this one: it is the list they are checked against.
    const against = doc.sources.filter((x) => lower(x.id) !== lower(id) && lower(writtenRules(doc, x.id).scope?.of ?? '') === lower(id)).map((x) => x.id);
    const first = /^(.*?)(?:: |\. |\.$|$)/s.exec(description ?? '')?.[1]?.trim();
    return {
      id,
      ...(description ? { description } : {}),
      summary: first ?? '',
      noun,
      ...(against.length ? { inventory: { noun, files: against, said: `The list of ${noun.many}: ${against.length} other ${against.length === 1 ? 'file is' : 'files are'} checked against it` } } : {}),
      watched,
      rules,
      columns: cards,
      ...(unread.length ? { unread } : {}),
      discovered: [],
      count: rules.length + (cards ?? []).reduce((n, c) => n + c.rules.length, 0),
      ...(made ? { made: { layer: gateLayerOf(doc, id), published } } : {}),
    };
  };
  const files = doc.sources.map((src) => section(src.id, src.description, false));
  // The datasets the flow makes that a gate judges (watched, published, or with a gate cell of their own) and that have
  // rules (Q-144): an intermediate step nothing judges has none to list.
  const made = steps.filter((st) => gateChecksOf(doc, st.id) !== null).map((st) => section(st.id, st.description ?? st.dataset?.description, true)).filter((m) => m.count > 0);
  // Each file names the made datasets that read it, near or far.
  for (const f of files) {
    const by = made.filter((m) => readsOf(m.id).has(lower(f.id))).map((m) => m.id);
    if (by.length) f.readBy = by;
  }
  return { files, made, types: typesShown(o) };
}
