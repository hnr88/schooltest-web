'use client';

import { useTranslations } from 'next-intl';

// The wireframe's em dash, made readable. C-TR-1 sends `score: null` /
// `acara_phase: null` for a test a student has not finished, and this renders
// THAT — never a 0, never a blank cell, never a guessed phase.
//
// WCAG 2.2 AA: the glyph alone carries no meaning to a screen reader, so it is
// `aria-hidden` and the words sit beside it in a visually hidden span.
function ResultsMissingValue() {
  const t = useTranslations('Teacher.results.students');

  return (
    <span data-slot="results-missing-value" className="text-muted-foreground">
      <span aria-hidden="true">{t('noValue')}</span>
      <span className="sr-only">{t('noValueLabel')}</span>
    </span>
  );
}

export { ResultsMissingValue };
