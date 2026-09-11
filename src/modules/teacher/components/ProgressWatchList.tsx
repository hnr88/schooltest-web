'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ProgressMoverRow } from '@/modules/teacher/components/ProgressMoverRow';
import { PROGRESS_I18N_NAMESPACE, PROGRESS_WATCH_VARIANT } from '@/modules/teacher/constants/progress-tab.constants';
import type { ProgressWatchListProps } from '@/modules/teacher/types/progress-tab.types';

// Top progress / Students to watch (`Teacher Portal v2.dc.html:923–952`): a white card of
// at most three movers the view model ranked from the server's own deltas. An empty
// list says so in words; nobody is added to fill it.
function ProgressWatchList({ variant, movers }: ProgressWatchListProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const skin = PROGRESS_WATCH_VARIANT[variant];
  const Icon = skin.icon;
  const headingId = `progress-watch-${variant}`;

  return (
    <section
      data-slot="progress-watch-list"
      data-variant={variant}
      aria-labelledby={headingId}
      className="rounded-[11px] border border-[#ECEEF2] bg-white px-[18px] py-4"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-[13px] font-semibold text-navy-900">
        <Icon aria-hidden="true" strokeWidth={2} className={cn('size-[15px] flex-none', skin.iconClass)} />
        {t(skin.titleKey)}
      </h3>
      {movers.length === 0 ? (
        <p
          data-slot="progress-watch-empty"
          className="mt-2.5 border-t border-[#F3F4F6] pt-2 text-[12.5px] text-[#6B7280]"
        >
          {t(skin.emptyKey)}
        </p>
      ) : (
        <ul className="mt-2.5 flex flex-col">
          {movers.map((mover) => (
            <ProgressMoverRow key={mover.studentDocumentId} mover={mover} />
          ))}
        </ul>
      )}
    </section>
  );
}

export { ProgressWatchList };
