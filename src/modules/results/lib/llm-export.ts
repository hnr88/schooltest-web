import type { ClassExport } from '@/modules/results/schemas/class-export.schema';
import type { DiagnosticExport, DiagnosticExportSkill } from '@schooltest/scoring-contracts';

/**
 * English labels for the exported markdown document. The .md download is a
 * DATA ARTIFACT for LLM consumption (like the CSV import template), so it
 * stays English by design; the on-screen UI copy for the same taxonomy lives
 * in the Results messages (errorPattern.*).
 */
const ERROR_PATTERN_LABEL: Record<string, string> = {
  literal_match: 'Copies the text',
  overinference: 'Reads too much in',
  world_knowledge: 'Outside knowledge',
  grammatical_decoy: 'Grammar trap',
  phonological_neighbour: 'Sounds like',
  orthographic_neighbour: 'Looks like',
  semantic_neighbour: 'Close in meaning',
};

/**
 * The three-variant union, narrowed by ITS OWN discriminators (task 38's
 * membership lesson: never assume a shape the union no longer guarantees):
 * a `gate_passed` key is the Critical gate variant (D13 — score + verdict,
 * deliberately no band and no delta field), `status: "not_assessed"` is the
 * measured absence, everything else is a banded skill.
 */
function isGateSkill(entry: DiagnosticExportSkill): entry is Extract<DiagnosticExportSkill, { gate_passed: boolean }> {
  return 'gate_passed' in entry;
}

function isNotAssessed(
  entry: DiagnosticExportSkill,
): entry is Extract<DiagnosticExportSkill, { status: 'not_assessed' }> {
  // The gate variant carries NO status key at all — the `in` guard must come
  // first, and the property test then narrows to the absence variant only.
  return 'status' in entry && entry.status === 'not_assessed';
}

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
    if (isNotAssessed(entry)) {
      lines.push(`- ${skill}: not assessed this sitting`);
      continue;
    }
    if (isGateSkill(entry)) {
      // D13: the gate skill carries a score and a verdict — NO band, NO change claim.
      const descriptor = entry.descriptor === undefined ? '' : ` — ${entry.descriptor}`;
      lines.push(`- ${skill}: ${entry.domain_score}% — exit gate ${entry.gate_passed ? 'passed' : 'not yet met'}${descriptor}`);
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
      lines.push(`- ${ERROR_PATTERN_LABEL[pattern.type] ?? pattern.type}: ${pattern.count} of the wrong answers (${pattern.pct}%)`);
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

/**
 * scoring/05 — the CLASS variant of the same download, and ONE renderer module
 * extended once rather than a second Markdown builder. Every per-student
 * section is `renderStudentMarkdown` verbatim, so the two downloads can never
 * describe the same bundle differently.
 *
 * The absence states are STATED BY NAME, never skipped and never given a
 * stand-in section: a class list that silently omitted the students the server
 * could not export for would read as a complete class and quietly understate
 * the roster. `exported_count` of `student_count` is printed for the same
 * reason — the reader can see what is missing without counting headings.
 *
 * Nothing is aggregated across students or skills (Doc 0 hard constraint): this
 * is the per-student bundles side by side, and the class `caveats` block is
 * reproduced so downstream hedging is inherited rather than re-derived.
 */
export function renderClassMarkdown(bundle: ClassExport): string {
  const lines: string[] = [];
  lines.push(`# Class diagnostic report — ${bundle.class.name}`);
  lines.push('');
  lines.push(`- Year band: ${bundle.class.year_band ?? 'unknown'}`);
  lines.push(`- Roster: ${bundle.class.student_count} students`);
  lines.push(`- Exported: ${bundle.class.exported_count} of ${bundle.class.student_count}`);
  lines.push('');

  lines.push('## Caveats');
  for (const caveat of bundle.caveats) lines.push(`- ${caveat}`);
  lines.push('');

  for (const student of bundle.students) {
    lines.push(`## Student ${student.student_key}`);
    lines.push('');
    if (student.state === 'exported') {
      lines.push(renderStudentMarkdown(student.bundle));
      continue;
    }
    // Named, not omitted — the two absence states of C-CLASS-EXPORT.
    lines.push(
      student.state === 'awaiting_publication'
        ? 'No report yet: this student has an official result that has not been published.'
        : 'No report yet: this student has no official result.',
    );
    lines.push('');
  }

  return lines.join('\n');
}
