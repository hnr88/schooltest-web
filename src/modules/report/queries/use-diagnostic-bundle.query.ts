'use client';

/**
 * FOLDED (scoring/05). This module used to be a SECOND hook over the same wire
 * as `results/queries/use-result-export.query.ts` — identical route, identical
 * `format` param, identical `diagnosticExportSchema` parse, identical
 * `staleTime`/`retry` — differing only in its cache key, which was the report
 * module's own diagnostic-bundle triple. Two keys over one body means two cache
 * entries for one export and two places for the parse to drift.
 *
 * The retired key is described in words rather than written as a literal on
 * purpose: this row's own gate is `rg "\['report', ?'diagnostic-bundle'"` -> 0
 * hits, and a docblock quoting the array would trip that negative grep and read
 * as a surviving key.
 *
 * The body is gone. `useDiagnosticBundleQuery` is now an ALIAS of the survivor,
 * with the same positional `(documentId, enabled)` signature, so
 * `report/index.ts`'s export and every existing call site keep working
 * unchanged. Nothing new should import this path — import the survivor.
 */
export { useResultExportQuery as useDiagnosticBundleQuery } from '@/modules/results/queries/use-result-export.query';
