'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Eyebrow, StatusPill } from '@/modules/design-system';

export const ERROR_PATTERN_SECTION_CLASS =
  'flex animate-in flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm delay-300 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:px-7.5';

export function ErrorPatternHeading() {
  const t = useTranslations('Report');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Eyebrow>{t('errorPatternsEyebrow')}</Eyebrow>
      <StatusPill tone="info">{t('errorPatternsOutOfModel')}</StatusPill>
    </div>
  );
}

// E11-07 — the non-pattern states of the notes section, each carrying its own
// heading and its own reason. `retry` is passed only by the `unavailable` state:
// the other two are settled answers, not failures to retry.
export function ErrorPatternNotice({
  state,
  titleKey,
  descriptionKey,
  onRetry,
  isRetrying,
}: {
  state: string;
  titleKey: string;
  descriptionKey?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  const t = useTranslations('Report');
  return (
    <section
      data-slot="report-error-patterns"
      data-state={state}
      className={ERROR_PATTERN_SECTION_CLASS}
    >
      <ErrorPatternHeading />
      <p
        data-slot="report-error-patterns-absent"
        className="text-body-lg font-semibold text-balance text-muted-foreground"
      >
        {t(titleKey)}
      </p>
      {descriptionKey === undefined ? null : (
        <p className="text-caption text-muted-foreground">{t(descriptionKey)}</p>
      )}
      {onRetry === undefined ? null : (
        <Button
          variant="outline"
          size="sm"
          className="h-11 w-fit rounded-full px-4"
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RefreshCw className={isRetrying ? 'animate-spin' : undefined} aria-hidden="true" />
          {t('errorPatternsRetry')}
        </Button>
      )}
    </section>
  );
}
