'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { ChildCard } from '@/modules/children/components/ChildCard';
import { ChildrenAddTile } from '@/modules/children/components/ChildrenAddTile';
import { ChildrenRosterPager } from '@/modules/children/components/ChildrenRosterPager';
import type { RosterPagination } from '@/modules/children/types/children.types';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenRosterProps {
  pagination: RosterPagination<StudentListRow>;
}

// §A.4 ChildCardGrid — the portal list is a GRID OF CARDS, not a table: one
// auto-fit track per card at a 360px floor, 20px gutters, and the dashed
// AddChildTile always appended as the last grid child (it is the affordance, not
// the zero state — §A.6).
export function ChildrenRoster({ pagination }: ChildrenRosterProps) {
  const t = useTranslations('Children');
  const rows = pagination.rows;

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        tone="brand"
        title={t('noMatches')}
        description={t('noMatchesDescription')}
        className="rounded-card border-none bg-card shadow-sm"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul
        role="list"
        aria-label={t('cardListLabel')}
        data-slot="children-roster-panel"
        className="grid grid-cols-child-cards gap-5"
      >
        {rows.map((row) => (
          <li key={row.documentId} className="flex min-w-0">
            <ChildCard student={row} />
          </li>
        ))}
        <li className="flex min-w-0">
          <ChildrenAddTile />
        </li>
      </ul>
      {pagination.pageCount > 1 ? <ChildrenRosterPager pagination={pagination} /> : null}
    </div>
  );
}
