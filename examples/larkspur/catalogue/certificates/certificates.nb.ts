// Certificates, a flow for the catalogue (ADR 0025 §10): the TLS certificates about to run out. It reads what the
// Evidence feeds give, and has no file of its own. The TLS feed is one a held day can fill from another day, so both
// datasets carry filled_from, as everything built from a filled feed does (ADR 0009 amendment 1): the day the rows
// came from, null on a day that arrived whole.
import { cell, md, param, sql } from 'smaltnb';
import { publish } from 'smaltfl/notebook';
import { tls_checked } from '../../feeds/bronze.nb.js';

cell('params');
export const params = param({ day: param.text('') });

cell('about_expiring', { lang: 'md' });
md`Every certificate whose last day is within thirty days of the day, with the days it has left. Renew these before a browser does the reminding: it is less polite about it, and it tells the customers first.`;

cell('certs_expiring', { lang: 'sql' });
export const certs_expiring = sql`
  SELECT app_id, endpoint, issuer, protocol, not_after, CAST(julianday(not_after) - julianday(${params.day}) AS INTEGER) AS days_left,
         filled_from
  FROM ${tls_checked}
  WHERE COALESCE(not_after, '') <> '' AND julianday(not_after) - julianday(${params.day}) BETWEEN 0 AND 30`;

cell('about_issuers', { lang: 'md' });
md`Each certificate authority with what it issued: how many certificates, how many expire soon, and how many still offer TLS 1.0.`;

cell('certs_by_issuer', { lang: 'sql' });
export const certs_by_issuer = sql`
  SELECT issuer, count(*) AS certificates,
         sum(CASE WHEN julianday(not_after) - julianday(${params.day}) BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS expiring_soon,
         sum(CASE WHEN protocol = 'TLS1.0' THEN 1 ELSE 0 END) AS old_protocol,
         max(filled_from) AS filled_from
  FROM ${tls_checked}
  WHERE COALESCE(issuer, '') <> ''
  GROUP BY issuer`;

cell('published');
publish(certs_expiring, { description: 'The TLS certificates that expire within thirty days of the day' });
publish(certs_by_issuer, { description: 'Each certificate authority with its certificates, those expiring soon and those on TLS 1.0' });
