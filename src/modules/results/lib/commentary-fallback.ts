import { ERROR_PATTERN_COPY } from '@/modules/results/components/ErrorPatternsPanel';
import type { DiagnosticExport } from '@schooltest/scoring-contracts';

/**
 * §4.8 fallback — the template commentary shown when the LLM is unavailable.
 * Generated from the SAME GATED FIELDS the prompt hands the model: `delta_display`
 * verbatim (a "steady" fixture claims NO growth, a "band_movement" fixture names
 * the band move, a signed integer is quoted as-is), the error-pattern insight on
 * the ≥35 dominant type, and the vocab strand gap. The client never computes or
 * re-thresholds a delta. Critical Reading is described by SCORE and GATE STATE
 * only — never in band language (D13: it has no posterior, so it has no band).
 */

export function fallbackParagraphs(bundle: DiagnosticExport): string[] {
  return [
    positionParagraph(bundle),
    strengthAndErrorsParagraph(bundle),
    vocabularyParagraph(bundle),
  ];
}

function overallGrowthPhrase(bundle: DiagnosticExport): string {
  const { delta_display: display } = bundle.overall;
  if (display === null) return '';
  if (display === 'steady') return ' The score is steady against the previous official sitting — no change is claimed.';
  if (display === 'band_movement') return ' The score moved between bands against the previous official sitting.';
  return ` The score changed by ${display} points against the previous official sitting.`;
}

function positionParagraph(bundle: DiagnosticExport): string {
  const overall = bundle.overall.domain_score === null
    ? 'No overall score is available for this sitting.'
    : `Overall reading stands at ${bundle.overall.domain_score}%.`;
  return `${overall}${overallGrowthPhrase(bundle)}`;
}

/** §4.4 comparison — band-carrying skills only; Critical sits outside the scale (ruling 4a). */
function strengthAndErrorsParagraph(bundle: DiagnosticExport): string {
  const assessed = Object.entries(bundle.skills)
    .filter(([skill, entry]) => skill !== 'Critical' && entry.status !== 'not_assessed' && 'domain_score' in entry)
    .map(([skill, entry]) => ({ skill, score: (entry as { domain_score: number }).domain_score }));
  const best = assessed.reduce<{ skill: string; score: number } | null>(
    (top, row) => (top === null || row.score > top.score ? row : top), null,
  );
  const worst = assessed.reduce<{ skill: string; score: number } | null>(
    (low, row) => (low === null || row.score < low.score ? row : low), null,
  );
  const parts: string[] = [];
  if (best !== null && worst !== null && best.skill !== worst.skill) {
    parts.push(`Strongest skill: ${best.skill} (${best.score}%). Greatest need: ${worst.skill} (${worst.score}%).`);
  }
  const critical = bundle.skills.Critical;
  if (critical && critical.status !== 'not_assessed' && 'domain_score' in critical) {
    parts.push(
      `Critical Reading scored ${critical.domain_score}% with the exit gate ${bundle.gate.passed === true ? 'passed' : 'not yet met'} — a gate result, not a band.`,
    );
  }
  const dominant = bundle.error_patterns.reduce<{ type: string; pct: number } | null>(
    (top, pattern) => (top === null || pattern.pct > top.pct ? { type: pattern.type, pct: pattern.pct } : top), null,
  );
  if (dominant !== null && dominant.pct >= 35) {
    parts.push(`Most common slip: ${ERROR_PATTERN_COPY[dominant.type]?.label ?? dominant.type} (${dominant.pct}% of wrong answers).`);
  }
  return parts.join(' ');
}

function vocabularyParagraph(bundle: DiagnosticExport): string {
  const vocab = bundle.vocab;
  if (vocab.single_strand === 'a2') {
    return `Vocabulary this sitting is the A2 strand alone (${vocab.a2.domain_score === null ? 'no score' : `${vocab.a2.domain_score}%`}); B1 was not assessed, so no blend is claimed. Teaching focus: keep consolidating A2 word knowledge before the B1 sitting.`;
  }
  if (vocab.single_strand === 'b1') {
    return `Vocabulary this sitting is the B1 strand alone (${vocab.b1.domain_score === null ? 'no score' : `${vocab.b1.domain_score}%`}); A2 was not assessed, so no blend is claimed. Teaching focus: build on the B1 vocabulary now in evidence.`;
  }
  const a2 = vocab.a2.domain_score === null ? 'not assessed' : `${vocab.a2.domain_score}%`;
  const b1 = vocab.b1.domain_score === null ? 'not assessed' : `${vocab.b1.domain_score}%`;
  return `Vocabulary blends the two strands at ${vocab.blended === null ? 'no score' : `${vocab.blended}%`} (A2 ${a2}, B1 ${b1}). Teaching focus: grow the weaker strand before the next sitting.`;
}
