import type {
  DisplayLabelParts,
  DisplayLabelState,
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

// The label ladder exists for the RECEPTIVE skills only (Doc 2a s.9; the API's
// crosswalk service types its skill parameter as reading | listening). A
// speaking/writing result and a placement parent therefore carry no label by
// design — reporting that as "not derived yet" would promise a value that is
// never coming, and Doc 0 forbids inventing a cross-skill one.
const LADDERED_SKILLS = ['reading', 'listening'];

export function getDisplayLabelState(result: ResultView): DisplayLabelState {
  if (result.display_label !== null) return 'derived';
  if (result.scope === 'combined') return 'not_applicable';
  if (result.skill !== null && !LADDERED_SKILLS.includes(result.skill)) return 'not_applicable';
  return 'pending';
}
