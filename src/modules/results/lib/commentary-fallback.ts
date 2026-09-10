import type { DiagnosticExport, DiagnosticExportSkill } from '@schooltest/scoring-contracts';

/** The translator shape the wiring layer passes in (`useTranslations('Results')`). */
export type ResultsTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * The export skill union, narrowed by its OWN discriminators (three variants
 * since the D13 amendment): a `gate_passed` key is the Critical gate variant,
 * `status: "not_assessed"` is the measured absence, everything else is a
 * banded skill. One predicate each — never a cast, never optional chaining.
 */
function isGateSkill(
  entry: DiagnosticExportSkill,
): entry is Extract<DiagnosticExportSkill, { gate_passed: boolean }> {
  return 'gate_passed' in entry;
}

function isNotAssessed(
  entry: DiagnosticExportSkill,
): entry is Extract<DiagnosticExportSkill, { status: 'not_assessed' }> {
  // The gate variant carries NO status key — the `in` guard comes first.
  return 'status' in entry && entry.status === 'not_assessed';
}

function isBanded(
  entry: DiagnosticExportSkill,
): entry is Extract<DiagnosticExportSkill, { delta_display: string | null }> {
  return !isGateSkill(entry) && !isNotAssessed(entry);
}

/**
 * §4.8 fallback — the template commentary shown when the LLM is unavailable.
 * Generated from the SAME GATED FIELDS the prompt hands the model: `delta_display`
 * verbatim (a "steady" fixture claims NO growth, a "band_movement" fixture names
 * the band move, a signed integer is quoted as-is), the error-pattern insight on
 * the ≥35 dominant type, and the vocab strand gap. The client never computes or
 * re-thresholds a delta. Critical Reading is described by SCORE and GATE STATE
 * only — never in band language (D13: it has no posterior, so it has no band).
 *
 * Every sentence is a message key — the wiring layer passes its
 * `useTranslations('Results')` so the commentary renders in the active locale.
 */

export function fallbackParagraphs(bundle: DiagnosticExport, t: ResultsTranslate): string[] {
  return [
    positionParagraph(bundle, t),
    strengthAndErrorsParagraph(bundle, t),
    vocabularyParagraph(bundle, t),
  ];
}

function overallGrowthPhrase(bundle: DiagnosticExport, t: ResultsTranslate): string {
  const { delta_display: display } = bundle.overall;
  if (display === null) return '';
  if (display === 'steady') return ` ${t('fallbackGrowthSteady')}`;
  if (display === 'band_movement') return ` ${t('fallbackGrowthBand')}`;
  return ` ${t('fallbackGrowthPoints', { delta: display })}`;
}

function positionParagraph(bundle: DiagnosticExport, t: ResultsTranslate): string {
  const overall = bundle.overall.domain_score === null
    ? t('fallbackNoOverall')
    : t('fallbackOverall', { score: bundle.overall.domain_score });
  return `${overall}${overallGrowthPhrase(bundle, t)}`;
}

/** §4.4 comparison — band-carrying skills only; Critical sits outside the scale (ruling 4a). */
function strengthAndErrorsParagraph(bundle: DiagnosticExport, t: ResultsTranslate): string {
  // A for-loop rather than filter().map(): the type predicate narrows the
  // ELEMENT, and a destructuring tuple would silently drop the narrowing.
  const assessed: Array<{ skill: string; score: number }> = [];
  for (const [skill, entry] of Object.entries(bundle.skills)) {
    if (skill === 'Critical' || !isBanded(entry)) continue;
    assessed.push({ skill, score: entry.domain_score });
  }
  const best = assessed.reduce<{ skill: string; score: number } | null>(
    (top, row) => (top === null || row.score > top.score ? row : top), null,
  );
  const worst = assessed.reduce<{ skill: string; score: number } | null>(
    (low, row) => (low === null || row.score < low.score ? row : low), null,
  );
  const parts: string[] = [];
  if (best !== null && worst !== null && best.skill !== worst.skill) {
    parts.push(t('fallbackStrengthNeed', {
      best: t(`skill${best.skill}`),
      bestScore: best.score,
      worst: t(`skill${worst.skill}`),
      worstScore: worst.score,
    }));
  }
  const critical = bundle.skills.Critical;
  if (critical && isGateSkill(critical)) {
    parts.push(
      t('fallbackCritical', {
        score: critical.domain_score,
        state: critical.gate_passed ? t('fallbackGatePassed') : t('fallbackGateNotMet'),
      }),
    );
  }
  const dominant = bundle.error_patterns.reduce<{ type: string; pct: number } | null>(
    (top, pattern) => (top === null || pattern.pct > top.pct ? { type: pattern.type, pct: pattern.pct } : top), null,
  );
  if (dominant !== null && dominant.pct >= 35) {
    const known = PATTERN_KEY[dominant.type];
    parts.push(t('fallbackCommonSlip', {
      label: known !== undefined ? t(`errorPattern.${known}.label`) : dominant.type,
      pct: dominant.pct,
    }));
  }
  return parts.join(' ');
}

function vocabularyParagraph(bundle: DiagnosticExport, t: ResultsTranslate): string {
  const vocab = bundle.vocab;
  if (vocab.single_strand === 'a2') {
    return t('fallbackVocabA2Only', {
      a2: vocab.a2.domain_score === null ? t('fallbackNoScore') : t('scorePercent', { score: vocab.a2.domain_score }),
    });
  }
  if (vocab.single_strand === 'b1') {
    return t('fallbackVocabB1Only', {
      b1: vocab.b1.domain_score === null ? t('fallbackNoScore') : t('scorePercent', { score: vocab.b1.domain_score }),
    });
  }
  return t('fallbackVocabBlend', {
    blended: vocab.blended === null ? t('fallbackNoScore') : t('scorePercent', { score: vocab.blended }),
    a2: vocab.a2.domain_score === null ? t('fallbackNotAssessed') : t('scorePercent', { score: vocab.a2.domain_score }),
    b1: vocab.b1.domain_score === null ? t('fallbackNotAssessed') : t('scorePercent', { score: vocab.b1.domain_score }),
  });
}

/** Error-pattern type → message-key fragment (shared with ErrorPatternsPanel). */
export const PATTERN_KEY: Record<string, string> = {
  literal_match: 'literalMatch',
  overinference: 'overinference',
  world_knowledge: 'worldKnowledge',
  grammatical_decoy: 'grammaticalDecoy',
  phonological_neighbour: 'phonologicalNeighbour',
  orthographic_neighbour: 'orthographicNeighbour',
  semantic_neighbour: 'semanticNeighbour',
};
