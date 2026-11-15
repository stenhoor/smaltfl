// smaltql's SQL parser in a bundle of its own (ADR 0022 §2): loaded the first time a screen asks where a column is used
// (a held day's join, a column's rename), so the page's first load never carries it.
export { parseOne } from '@smaltworks/smaltql';
