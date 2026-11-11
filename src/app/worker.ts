/**
 * The app's engine worker: smaltdb with SQL (smaltql: the engine runs plans, and a language turns text into them, its
 * ADR 0015) and the plugins the example flow needs, smaltfl's runtime among them.
 */
import { serve } from 'smaltdb/worker-runtime';
import { sqlLanguage } from '@smaltworks/smaltql';
import io from '@smaltdb/io';
import external from '@smaltdb/external';
import parquet from '@smaltdb/parquet';
import smaltfl from '../plugin/index.js';

serve({ languages: [sqlLanguage], plugins: [io, external, parquet, smaltfl] });
