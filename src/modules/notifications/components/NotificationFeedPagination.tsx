'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { GHOST_BUTTON_CLASS } from '@/modules/notifications/constants/components.constants';

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
