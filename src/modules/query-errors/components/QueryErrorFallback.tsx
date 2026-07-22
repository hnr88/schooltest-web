'use client';

import { SearchX, UserRoundCog } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { useQueryErrorReport } from '@/modules/query-errors/hooks/useQueryErrorReport';
import { classifyQueryError } from '@/modules/query-errors/lib/classify-query-error';
import type { QueryErrorFallbackProps } from '@/modules/query-errors/types/query-error.types';

export function QueryErrorFallback({
  error,
  action,
  goneIcon,
  goneTitle,
  goneDescription,
  onRetry,
  isRetrying,
  className,
}: QueryErrorFallbackProps) {
  const t = useTranslations('QueryError');
  const state = classifyQueryError(error);
  useQueryErrorReport(state, error);

  const wrapperClass = cn(
    'duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none',
    className,
  );

  if (state.kind === 'gone' || state.kind === 'forbidden') {
    const isGone = state.kind === 'gone';
    // `gone` and `forbidden` swap a whole record view for an EmptyState, which
    // carries no implicit role — a screen-reader user landed on a silent page.
    // The polite live region announces the swap without hijacking focus; the
    // `broken` arm already announces through Alert's role="alert".
    return (
      <div
        data-slot="query-error-fallback"
        data-query-error={state.kind}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={wrapperClass}
      >
        <EmptyState
          icon={isGone ? (goneIcon ?? SearchX) : UserRoundCog}
          title={isGone ? (goneTitle ?? t('goneTitle')) : t('forbiddenTitle')}
          description={
            isGone ? (goneDescription ?? t('goneDescription')) : t('forbiddenDescription')
          }
          action={action}
        />
      </div>
    );
  }

  return (
    <div
      data-slot="query-error-fallback"
      data-query-error="broken"
      data-query-error-cause={state.cause}
      className={wrapperClass}
    >
      <Alert
        variant="error"
        title={t(`${state.cause}Title`)}
        action={
          <div className="flex flex-wrap gap-3">
            {action}
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 px-4"
                loading={isRetrying}
                onClick={onRetry}
              >
                {t('retry')}
              </Button>
            ) : null}
          </div>
        }
      >
        {t(`${state.cause}Description`)}
      </Alert>
    </div>
  );
}
