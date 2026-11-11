// smaltdb runs plans, not text (its ADR 0017): SQL is smaltql's, registered here for every test, as the app's worker
// and the scripts register it for theirs. The plugin never imports it: the host registers the language.
import '@smaltworks/smaltql/register';
