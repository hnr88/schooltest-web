'use client';

import type { ResultView } from '@schooltest/scoring-contracts';

/**
 * §4.6 error patterns — "How {first} gets it wrong". `error_patterns` come
 * straight off the ResultView the server aggregated at scoring time; this
 * panel makes NO export call (the one-call rule: the teacher report owns the
 * only export request, and the roster of files it lives in is not ours).
 * The section is hidden entirely when the array is empty — an empty panel
 * would assert "no error pattern was observed", a measurement this page may
 * not make on an absent field.
 *
 * The labels/notes are the static frontend copy §4.6 calls for (prototype
 * register), one pair per distractor type in the shared taxonomy. Bars scale
 * to the max `pct`; the insight sentence appears only on a dominant type
 * (pct ≥ 35).
 */

export const ERROR_PATTERN_COPY: Record<string, { label: string; note: string }> = {
  literal_match: { label: 'Copies the text', note: 'Picked the answer that copies the text word-for-word.' },
  overinference: { label: 'Reads too much in', note: 'Chose an answer that goes beyond what the text says.' },
  world_knowledge: { label: 'Outside knowledge', note: 'Chose an answer that is true in the world but not stated in the text.' },
  grammatical_decoy: { label: 'Grammar trap', note: 'Chose an answer that fits the grammar but not the meaning.' },
  phonological_neighbour: { label: 'Sounds like', note: 'Chose an answer that sounds like a word in the text.' },
  orthographic_neighbour: { label: 'Looks like', note: 'Chose an answer that is spelled like a word in the text.' },
  semantic_neighbour: { label: 'Close in meaning', note: 'Chose an answer close in meaning but not the one the text supports.' },
};

export function dominantPattern(view: ResultView): { type: string; pct: number } | null {
  const dominant = view.error_patterns.reduce<{ type: string; pct: number } | null>(
    (best, pattern) => (best === null || pattern.pct > best.pct ? { type: pattern.type, pct: pattern.pct } : best),
    null,
  );
  return dominant !== null && dominant.pct >= 35 ? dominant : null;
}

const firstNameOf = (studentName: string): string => studentName.split(' ')[0] ?? studentName;

export function ErrorPatternsPanel({ view, studentName }: { view: ResultView; studentName: string }) {
  if (view.error_patterns.length === 0) return null;
  const max = Math.max(...view.error_patterns.map((pattern) => pattern.pct));
  const dominant = dominantPattern(view);
  const first = firstNameOf(studentName);

  return (
    <section data-slot="error-patterns" aria-label={`How ${first} gets it wrong`} className="flex flex-col gap-2">
      <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
        How {first} gets it wrong
      </h2>
      <ul className="flex flex-col gap-2.5">
        {view.error_patterns.map((pattern) => {
          const copy = ERROR_PATTERN_COPY[pattern.type]
            ?? { label: pattern.type, note: 'Chose this kind of wrong answer.' };
          return (
            <li key={pattern.type} data-slot="error-pattern" data-type={pattern.type} data-pct={pattern.pct} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-caption font-bold">{copy.label}</span>
                <span className="text-caption tabular-nums text-muted-foreground">{pattern.pct}%</span>
              </div>
              <span className="h-1.5 w-full rounded-full bg-muted">
                <span
                  data-slot="error-pattern-bar"
                  className="block h-full rounded-full bg-warning"
                  style={{ width: `${max === 0 ? 0 : (pattern.pct / max) * 100}%` }}
                />
              </span>
              <span className="text-caption text-muted-foreground">{copy.note}</span>
            </li>
          );
        })}
      </ul>
      {dominant !== null ? (
        <p data-slot="error-pattern-insight" data-type={dominant.type} className="text-caption font-semibold">
          {ERROR_PATTERN_COPY[dominant.type]?.label ?? dominant.type} is {first}&apos;s most common slip — {dominant.pct}% of the wrong answers.
        </p>
      ) : null}
    </section>
  );
}
