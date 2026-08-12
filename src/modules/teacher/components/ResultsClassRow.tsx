'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import type { ResultsClassRowProps } from '@/modules/teacher/types/results-shell.types';

// One class in the Results list, straight from C-TD-1: name, roster size and the
// Test A / Test B completed counts. The whole row is ONE real <Link> (never a
// div with onClick), so it is keyboard-reachable, Enter-activatable and shows a
// visible focus ring; the p-5 box clears the 44px target on every axis.
function ResultsClassRow({ classCard }: ResultsClassRowProps) {
  const t = useTranslations('Teacher.results.list');

  return (
    <Link
      href={classResultsHref(classCard.class_document_id)}
      data-slot="results-class-row"
      data-class-id={classCard.class_document_id}
      className="flex min-w-0 items-center gap-4 rounded-card border border-border bg-card p-5 shadow-sm transition-colors duration-200 ease-out hover:border-primary/40 hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-panel-title font-semibold break-words text-foreground">
          {classCard.name}
        </span>
        <span className="text-meta text-muted-foreground">
          {t('students', { count: classCard.student_count })}
        </span>
        <span className="text-body-sm text-body">
          {t('completion', {
            testA: t('completionValue', classCard.test_a),
            testB: t('completionValue', classCard.test_b),
          })}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export { ResultsClassRow };
