'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { classBadge, teacherNames } from '@/modules/classes/lib/classes-table.helpers';
import { DataPanel, PanelHeaderRow } from '@/modules/design-system';

import type { SchoolClassesSectionProps } from '@/modules/school-admin/types/components.types';

// VIEW 1, Classes panel (School Admin Portal.dc.html:166-184): ONE white
// 24-radius card carrying the title, the "All classes →" link and the rows —
// the design's badge tile (38px, radius 12), the name with the assigned
// teacher beneath it and the live student count. The rows are the ONLY
// navigation off this read-only screen; each opens the class detail.
export function SchoolClassesSection({ classes }: SchoolClassesSectionProps) {
  const t = useTranslations('SchoolAdmin.home');
  const tClasses = useTranslations('Classes.table');

  return (
    <section data-slot="school-classes" aria-labelledby="school-classes-title">
      <DataPanel className="rounded-card border-0 px-7 py-1.5 shadow-sm">
        <PanelHeaderRow
          as="h2"
          titleId="school-classes-title"
          title={t('classesTitle')}
          className="items-baseline pt-5.5 pb-0"
          action={
            <Link
              href="/dashboard/school/classes"
              className="relative text-body-sm font-semibold text-primary after:absolute after:inset-x-0 after:-inset-y-3.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              {t('viewAllClasses')} <span aria-hidden="true">&rarr;</span>
            </Link>
          }
        />
        {classes.length === 0 ? (
          <p className="py-11 text-center text-body-sm text-muted-foreground">
            {t('classesEmptyTitle')} — {t('classesEmptyDescription')}
          </p>
        ) : (
          <ul>
            {classes.map((schoolClass) => {
              const teachers = teacherNames(schoolClass.teachers);
              return (
                <li key={schoolClass.documentId} className="border-b border-divider">
                  <Link
                    href={`/dashboard/school/classes/${schoolClass.documentId}`}
                    className="flex flex-1 flex-wrap items-center gap-x-3.5 gap-y-2.5 py-3.5 transition-colors duration-200 ease-out-expo hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-9.5 flex-none place-items-center rounded-tile bg-surface-inset text-meta font-bold text-foreground"
                    >
                      {classBadge(schoolClass.name)}
                    </span>
                    <span className="min-w-[130px] flex-[3_1_160px] overflow-hidden">
                      <span className="block truncate text-lede font-semibold text-foreground">
                        {schoolClass.name}
                      </span>
                      <span className="mt-0.5 block truncate text-meta text-muted-foreground">
                        {teachers === '' ? tClasses('teachersNone') : teachers}
                      </span>
                    </span>
                    <span className="ms-auto min-w-[84px] flex-[1_1_96px] text-caption tabular-nums text-body">
                      {t('classStudents', { count: schoolClass.student_count })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div aria-hidden="true" className="pt-2 pb-4" />
      </DataPanel>
    </section>
  );
}
