'use client';

import { useTranslations } from 'next-intl';

import {
  ERROR_PATTERN_SECTION_CLASS,
  ErrorPatternHeading,
  ErrorPatternNotice,
} from '@/modules/report/components/ErrorPatternNotice';
import {
  buildErrorPatterns,
  hasDiagnosticBundle,
} from '@/modules/report/lib/error-patterns-view-model';
import { useDiagnosticBundleQuery } from '@/modules/report/queries/use-diagnostic-bundle.query';
import type { ResultView } from '@/modules/report/types/report.types';

// E11-07 — the C-5 distractor-type notes on the teacher report. Five honest
// states and no sixth: a failed read renders as `unavailable`, never as an empty
// list, because an empty list would assert "no error pattern was observed" —
// a measurement claim this page would not have. Every string on a pattern line
// is the server's own, rendered verbatim.
export function ErrorPatternNotes({ result }: { result: ResultView }) {
  const t = useTranslations('Report');
  const enabled = hasDiagnosticBundle(result);
  const { data, isError, isFetching, isLoading, refetch } = useDiagnosticBundleQuery(
    result.document_id,
    enabled,
  );
  const view = data === undefined ? null : buildErrorPatterns(data);

  if (!enabled || view?.state === 'not_applicable') {
    return (
      <ErrorPatternNotice
        state="not_applicable"
        titleKey="errorPatternsNotApplicable"
        descriptionKey="errorPatternsNotApplicableDescription"
      />
    );
  }

  if (isLoading) return <ErrorPatternNotice state="loading" titleKey="errorPatternsLoading" />;

  if (isError || view === null) {
    return (
      <ErrorPatternNotice
        state="unavailable"
        titleKey="errorPatternsUnavailable"
        descriptionKey="errorPatternsUnavailableDescription"
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (view.state === 'none_observed') {
    return (
      <ErrorPatternNotice
        state="none_observed"
        titleKey="errorPatternsNoneObserved"
        descriptionKey="errorPatternsNoneObservedDescription"
      />
    );
  }

  return (
    <section
      data-slot="report-error-patterns"
      data-state="patterns"
      aria-label={t('errorPatternsEyebrow')}
      className={ERROR_PATTERN_SECTION_CLASS}
    >
      <div className="flex flex-col gap-1.5">
        <ErrorPatternHeading />
        <p className="text-body-md text-muted-foreground">{t('errorPatternsDescription')}</p>
      </div>

      {view.skills.map((block) => (
        <div key={block.skill} data-slot="report-error-pattern-skill" data-skill={block.skill}>
          <p className="text-caption font-bold text-secondary-foreground uppercase">
            {t(`skills.${block.skill}`)}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {block.patterns.map((pattern) => (
              <li
                key={pattern}
                data-slot="report-error-pattern"
                className="animate-in border-l-2 border-warning/45 pl-4 text-body-md text-pretty text-foreground duration-300 ease-out-expo fade-in slide-in-from-left-1 motion-reduce:animate-none"
              >
                {pattern}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="text-caption text-muted-foreground">{t('errorPatternsSource')}</p>
    </section>
  );
}
