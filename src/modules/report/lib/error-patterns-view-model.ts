import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import type {
  DiagnosticBundle,
  ErrorPatternsView,
} from '@/modules/report/types/error-pattern.types';
import type { ResultView } from '@/modules/report/types/report.types';

// E11-07 — the C-5 `error_patterns` reduced to what the report renders. The
// strings are NOT touched: `buildErrorPatterns` composes them server-side from
// this sitting's own responses (Doc 1 s.11.4, "chose literal_match distractors
// on 4 of 5 inference items"), so the portal neither re-words, re-orders,
// filters nor invents one.
export function buildErrorPatterns(bundle: DiagnosticBundle): ErrorPatternsView {
  const blocks = Object.entries(bundle.skills);
  if (blocks.length === 0) return { state: 'not_applicable' };

  const withPatterns = blocks.flatMap(([skill, entry]) =>
    entry.error_patterns.length > 0 ? [{ skill, patterns: entry.error_patterns }] : [],
  );
  return withPatterns.length > 0
    ? { state: 'patterns', skills: withPatterns }
    : { state: 'none_observed', skills: blocks.map(([skill]) => skill) };
}

// Whether this result can carry a C-5 bundle at all. A placement parent fans out
// into its receptive children server-side; a skill-scoped result needs the
// receptive ladder, which is the SAME applicability rule every other block on
// this report uses. False means no request is issued — an unanswerable question
// is not asked.
export function hasDiagnosticBundle(result: ResultView): boolean {
  if (result.scope === 'combined') return true;
  return getCrosswalkFieldState(result, null) !== 'not_applicable';
}
