import { LEGACY_MODEL_VERSION } from '@/modules/report/schemas/result-view.schema';
import type {
  DiagnosticExport,
  ErrorPatternsView,
} from '@/modules/report/types/error-pattern.types';
import type { ResultView } from '@/modules/report/types/report.types';

// E11-07 — the diagnostic export's `error_patterns` reduced to what the report
// renders. The {type, count, pct} triples are composed server-side from this
// sitting's own responses, so the portal neither re-words, re-orders, filters
// nor invents one.
export function buildErrorPatterns(bundle: DiagnosticExport): ErrorPatternsView {
  return bundle.error_patterns.length > 0
    ? { state: 'patterns', patterns: bundle.error_patterns }
    : { state: 'none_observed' };
}

// Whether this result can carry a diagnostic bundle at all: only the retired
// legacy model cannot. False means no request is issued — an unanswerable
// question is not asked.
export function hasDiagnosticBundle(result: ResultView): boolean {
  return result.model_version !== LEGACY_MODEL_VERSION;
}
