'use client';

import { useTranslations } from 'next-intl';

import { DIRECTORY_ALL } from '@/modules/directory';
import { PillSearch } from '@/modules/teacher/components/v2/PillSearch';
import { PillSelect } from '@/modules/teacher/components/v2/PillSelect';
import { ViewToggle } from '@/modules/teacher/components/v2/ViewToggle';
import type { ClassesToolbarProps } from '@/modules/teacher/types/classes-screen.types';

/**
 * The Classes toolbar (`Teacher Portal v2.dc.html:93–116`): grey search, year
 * and status selects, the live count, the sort select and the tiles/list
 * toggle — all writing the directory kit's URL state. `data-slot`s keep the
 * names the existing list specs read.
 */
function ClassesToolbar({ directory }: ClassesToolbarProps) {
  const t = useTranslations('TeacherPortal.classes');
  const { state, view, filters, sorts } = directory;
  const valueOf = (key: string) => state.params.filters[key] ?? DIRECTORY_ALL;

  return (
    <div data-slot="directory-toolbar" className="flex flex-wrap items-center gap-2 px-8 pb-[18px]">
      <PillSearch
        value={state.searchInput}
        onValueChange={state.setSearchInput}
        placeholder={t('searchPlaceholder')}
        label={t('searchLabel')}
      />
      {filters.map((filter) => (
        <PillSelect
          key={filter.key}
          data-filter={filter.key}
          label={filter.label}
          value={valueOf(filter.key)}
          onValueChange={(value) => state.setFilter(filter.key, value)}
          options={filter.options}
        />
      ))}
      <span
        data-slot="classes-count"
        aria-live="polite"
        className="ml-auto text-[13px] text-[#6B7280]"
      >
        {t('count', { count: view.meta.total })}
      </span>
      <PillSelect
        data-filter="sort"
        label={t('sortLabel')}
        value={state.params.sort}
        onValueChange={state.setSort}
        options={sorts}
      />
      <ViewToggle
        data-slot="directory-layout-toggle"
        value={state.layout === 'tiles' ? 'tiles' : 'list'}
        onValueChange={(value) => state.setLayout(value === 'tiles' ? 'tiles' : 'table')}
      />
    </div>
  );
}

export { ClassesToolbar };
