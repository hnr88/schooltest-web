import type {
  DisplayLabelParts,
  DisplayLabelState,
  ResolvedDisplayLabel,
  ResultView,
} from '@/modules/report/types/report.types';

// The seeded Crosswalk composes the label server-side as
// `qualifier_format = "{label} ({qualifiers})"` joined by `qualifier_join = "; "`
// and emits the bare rung when no qualifier rule fires (crosswalk-derive.ts
// `deriveLabel`). Splitting on exactly that shape is lossless in both
// directions: a string with no trailing parenthesised group IS the label.
// Nothing here derives a qualifier — only the server may do that.
const QUALIFIER_PATTERN = /^(.*?)\s+\(([^()]*)\)$/;
const QUALIFIER_SEPARATOR = ';';

export function splitDisplayLabel(displayLabel: string): DisplayLabelParts {
  const match = QUALIFIER_PATTERN.exec(displayLabel.trim());
  if (!match) return { label: displayLabel.trim(), qualifiers: [] };

  const qualifiers = match[2]
    .split(QUALIFIER_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (qualifiers.length === 0) return { label: displayLabel.trim(), qualifiers: [] };
  return { label: match[1].trim(), qualifiers };
}

// The crosswalk block exists for the RECEPTIVE skills only (Doc 2a s.9; the
// API's crosswalk service types its skill parameter as reading | listening, and
// the seeded speaking/writing Crosswalks carry cefr_rules/acara_rules/
// readiness_rules = null). A speaking/writing result and a placement parent
// therefore carry no label, no phase, no band and no readiness by design —
// reporting that as "not derived yet" would promise a value that is never
// coming, and Doc 0 forbids inventing a cross-skill one.
const RECEPTIVE_SKILLS = ['reading', 'listening'];

// One applicability rule for every crosswalk-derived field, plus the receptive
// MAP-posterior flag `low_confidence` (api::result.assembly writes it in the
// same update as the crosswalk fields, from R's receptive posterior). `value` is
// the field itself: present = 'derived', absent = 'pending' only where the
// server can still produce it.
export function getCrosswalkFieldState(
  result: ResultView,
  value: string | boolean | null,
): DisplayLabelState {
  if (value !== null) return 'derived';
  if (result.scope === 'combined') return 'not_applicable';
  if (result.skill !== null && !RECEPTIVE_SKILLS.includes(result.skill)) return 'not_applicable';
  return 'pending';
}

export function getDisplayLabelState(result: ResultView): DisplayLabelState {
  return getCrosswalkFieldState(result, result.display_label);
}

// The single resolution every display_label surface reads from, so the crumb,
// the panel heading and any other rendering of the same result cannot disagree
// about which absence it is. The `!== null` re-check is TypeScript narrowing
// only — getCrosswalkFieldState answers 'derived' exactly when the field is
// non-null — never a substitute value.
export function resolveDisplayLabel(result: ResultView): ResolvedDisplayLabel {
  const state = getDisplayLabelState(result);
  if (state === 'derived' && result.display_label !== null) {
    return { state: 'derived', label: result.display_label };
  }
  return state === 'pending'
    ? { state: 'pending', label: null, absentKey: 'displayLabelPending' }
    : { state: 'not_applicable', label: null, absentKey: 'displayLabelNotApplicable' };
}
