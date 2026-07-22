'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DataGridHeadRow, DataPanel, EmptyState } from '@/modules/design-system';
import { ChildRosterRow } from '@/modules/children/components/ChildRosterRow';
import { ChildrenRosterPager } from '@/modules/children/components/ChildrenRosterPager';
import type { RosterPagination } from '@/modules/children/types/children.types';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenRosterProps {
  pagination: RosterPagination<StudentListRow>;
}

// C-UI-MYCHILDREN roster panel (canonical "Students" screen idiom): ONE flush
// surface with hairline rows, a single shadow, the column head strip on the page
// background, and the canonical footer pager closing the panel once the roster
// runs past one page.
export function ChildrenRoster({ pagination }: ChildrenRosterProps) {
  const t = useTranslations('Children');
  const rows = pagination.rows;

  return (
    <DataPanel
      aria-label={t('cardListLabel')}
      data-slot="children-roster-panel"
      className="animate-in duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <DataGridHeadRow aria-hidden="true" className="hidden grid-cols-roster-row lg:grid">
        <span>{t('columnStudent')}</span>
        <span>{t('columnYearLevel')}</span>
        <span>{t('columnTargetEntry')}</span>
        <span>{t('columnNationality')}</span>
        <span>{t('columnStatus')}</span>
        <span>{t('columnAdded')}</span>
        <span />
      </DataGridHeadRow>

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          tone="brand"
          title={t('noMatches')}
          description={t('noMatchesDescription')}
          className="border-none"
        />
      ) : (
        rows.map((row, index) => (
          <ChildRosterRow key={row.documentId} student={row} last={index === rows.length - 1} />
        ))
      )}

      {/* canonical Students screen shows BOTH the toolbar readout and the footer
          strip, on every page count — the strip is the panel's closing edge. */}
      {rows.length > 0 ? <ChildrenRosterPager pagination={pagination} /> : null}
    </DataPanel>
  );
}
