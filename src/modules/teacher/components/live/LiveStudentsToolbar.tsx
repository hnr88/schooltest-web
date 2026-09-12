'use client';

import { useTranslations } from 'next-intl';

import { FilterPills } from '@/modules/teacher/components/v2/FilterPills';
import { PillSearch } from '@/modules/teacher/components/v2/PillSearch';
import { LIVE_FILTERS } from '@/modules/teacher/constants/live-students.constants';
import { isLiveFilter } from '@/modules/teacher/lib/live-students';
import type { LiveFilter } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1147–1156 — search, the six filter pills and the
// "n of m students" tally, all over the sitting's real members.
function LiveStudentsToolbar({
  query,
  onQuery,
  filter,
  onFilter,
  shown,
  total,
}: {
  query: string;
  onQuery: (value: string) => void;
  filter: LiveFilter;
  onFilter: (value: LiveFilter) => void;
  shown: number;
  total: number;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  return (
    <div data-slot="live-students-toolbar" className="flex flex-wrap items-center gap-2">
      <PillSearch
        variant="white"
        size="md"
        value={query}
        onValueChange={onQuery}
        placeholder={t('searchPlaceholder')}
        label={t('searchLabel')}
        className="w-[270px]"
      />
      <FilterPills
        size="sm"
        label={t('filtersLabel')}
        value={filter}
        options={LIVE_FILTERS.map((value) => ({ value, label: t(`filter.${value}`) }))}
        onValueChange={(value) => {
          if (isLiveFilter(value)) onFilter(value);
        }}
      />
      <span data-slot="live-students-count" className="ml-auto text-[13px] text-[#6B7280]">
        {t('count', { shown, total })}
      </span>
    </div>
  );
}

export { LiveStudentsToolbar };
