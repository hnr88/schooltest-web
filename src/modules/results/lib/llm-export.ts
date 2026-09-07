import { ERROR_PATTERN_COPY } from '@/modules/results/components/ErrorPatternsPanel';
import type { DiagnosticExport } from '@schooltest/scoring-contracts';

/**
 * §4.9 — the LLM-ready markdown download, rendered from the export bundle and
 * from nothing else. The bundle is already no-name, no-transcript, no
 * no-θ; this renderer adds no identity column and no derived figure — every
 * number is copied from the bundle, and changes appear only as their
 * `delta_display` rendering.
 */
export function renderStudentMarkdown(bundle: DiagnosticExport): string {
  const lines: string[] = [];
  lines.push('# Reading diagnostic report');
  lines.push('');
  lines.push(`- Sitting: #${bundle.sitting.number}${bundle.sitting.date === null ? '' : ` on ${bundle.sitting.date}`}`);
  lines.push(`- Student profile: year ${bundle.student.year_group ?? 'unknown'}, first language ${bundle.student.first_language ?? 'unknown'}, literate in L1: ${bundle.student.l1_literate === null ? 'unknown' : String(bundle.student.l1_literate)}`);
  lines.push(`- Model version: ${bundle.model_version}`);
  lines.push('');

  lines.push('## Overall');
  lines.push(`${bundle.overall.domain_score === null ? 'no score' : `${bundle.overall.domain_score}%`}${bundle.overall.delta_display === null ? '' : ` — change: ${renderDelta(bundle.overall.delta_display)}`}`);
  lines.push('');

  lines.push('## Skills');
  for (const [skill, entry] of Object.entries(bundle.skills)) {
    if (entry.status === 'not_assessed') {
      lines.push(`- ${skill}: not assessed this sitting`);
      continue;
    }
    const descriptor = entry.descriptor === undefined ? '' : ` — ${entry.descriptor}`;
    lines.push(`- ${skill}: ${entry.domain_score}% (${entry.status})${entry.delta_display === null ? '' : ` — change: ${renderDelta(entry.delta_display)}`}${descriptor}`);
  }
  lines.push('');

  lines.push('## Vocabulary');
  lines.push(`- Blended: ${bundle.vocab.blended === null ? 'no score' : `${bundle.vocab.blended}%`} (${bundle.vocab.status})${bundle.vocab.delta_display === null ? '' : ` — change: ${renderDelta(bundle.vocab.delta_display)}`}`);
  lines.push(`- A2 strand: ${bundle.vocab.a2.domain_score === null ? 'not assessed' : `${bundle.vocab.a2.domain_score}%`}`);
  lines.push(`- B1 strand: ${bundle.vocab.b1.domain_score === null ? 'not assessed' : `${bundle.vocab.b1.domain_score}%`}`);
  lines.push('');

  lines.push('## Exit gate (Section 3)');
  lines.push(`${bundle.gate.passed === null ? 'not reached' : bundle.gate.passed ? 'passed' : 'not yet met'}${bundle.gate.domain_score === null ? '' : ` — ${bundle.gate.domain_score}%`}`);
  lines.push('');

  if (bundle.error_patterns.length > 0) {
    lines.push('## Error patterns');
    for (const pattern of bundle.error_patterns) {
      lines.push(`- ${ERROR_PATTERN_COPY[pattern.type]?.label ?? pattern.type}: ${pattern.count} of the wrong answers (${pattern.pct}%)`);
    }
    lines.push('');
  }

  if (bundle.history.length > 0) {
    lines.push('## Sittings so far');
    for (const point of bundle.history) {
      lines.push(`- ${point.sat_at}: ${point.overall === null ? 'no score' : `${point.overall}%`}`);
    }
    lines.push('');
  }

  lines.push('## Caveats');
  for (const caveat of bundle.caveats) lines.push(`- ${caveat}`);
  lines.push('');
  return lines.join('\n');
}

function renderDelta(display: string): string {
  if (display === 'steady') return 'steady (no change claimed)';
  if (display === 'band_movement') return 'band movement';
  return `${display} pts`;
}
