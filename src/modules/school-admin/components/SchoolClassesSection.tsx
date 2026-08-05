'use client';

import { ChevronRightIcon, LayoutGridIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import {
  DataGridRow,
  DataPanel,
  EmptyState,
  PanelHeaderRow,
} from '@/modules/design-system';

import type { SchoolClassesSectionProps } from '@/modules/school-admin/types/components.types';

// Spec section 1, Classes list: one clickable row per class — name, live
// student count, trailing chevron — and the ONLY navigation on this read-only
// screen. The target is the Classes page's class detail.
export function SchoolClassesSection({ classes }: SchoolClassesSectionProps) {
  const t = useTranslations('SchoolAdmin.home');

  return (
    <section
      data-slot="school-classes"
      aria-labelledby="school-classes-title"
      className="flex flex-col gap-3"
    >
      <PanelHeaderRow as="h2" titleId="school-classes-title" title={t('classesTitle')} />
      {classes.length === 0 ? (
        <EmptyState
          icon={LayoutGridIcon}
          title={t('classesEmptyTitle')}
          description={t('classesEmptyDescription')}
        />
      ) : (
        <DataPanel>
          <ul>
            {classes.map((schoolClass, index) => (
              <DataGridRow
                key={schoolClass.documentId}
                element="li"
                interactive
                last={index === classes.length - 1}
                className="grid-cols-1 p-0"
              >
                <Link
                  href={`/dashboard/school/classes/${schoolClass.documentId}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="truncate font-semibold text-foreground">
                      {schoolClass.name}
                    </span>
                    <span className="shrink-0 text-body tabular-nums">
                      {t('classStudents', { count: schoolClass.student_count })}
                    </span>
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              </DataGridRow>
            ))}
          </ul>
        </DataPanel>
      )}
    </section>
  );
}
