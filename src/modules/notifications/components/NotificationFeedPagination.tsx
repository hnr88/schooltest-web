'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// PortalGhostButton (.qa/design/spec/03 §1.4): white pill, 1px #D8DFEA, 13/600 navy,
// hover moves the border to #0E2350.
const GHOST_BUTTON_CLASS =
  'min-h-11 rounded-full border-portal-input bg-card px-4.5 text-caption font-semibold text-foreground transition duration-200 ease-out-expo hover:border-foreground hover:bg-card active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';

function NotificationFeedPagination({
  page,
  pageCount,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const t = useTranslations('Notifications');

  return (
    <nav
      aria-label={t('paginationLabel')}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-caption text-body">{t('pageSummary', { page, total: pageCount })}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page === 1}
          onClick={onPrevious}
          className={GHOST_BUTTON_CLASS}
        >
          {t('previous')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page === pageCount}
          onClick={onNext}
          className={GHOST_BUTTON_CLASS}
        >
          {t('next')}
        </Button>
      </div>
    </nav>
  );
}

export { NotificationFeedPagination };
