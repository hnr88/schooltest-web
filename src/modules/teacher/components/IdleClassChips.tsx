'use client';

/**
 * teacher/09 — "Classes with nothing running" (`:290–297`): the design's idle
 * chip row. It CONSUMES the design-system `FilterChipGroup` and `EmptyState`
 * and declares no chip component, no empty body and no filter of its own
 * (§11.1). The idle set arrives from the same reads and the same derivation as
 * the by-class groups, so the two sets can never overlap or drop a class.
 * When every class is busy the row is replaced by the design's one-sentence
 * empty (`:296`).
 *
 * teacher/22 boundary (ruling 4): a chip opens the start-session modal
 * pre-filled with that class ONCE task 22 ships it; until then the click
 * simply brings the existing setup panel into view — a real navigation, not a
 * dead affordance.
 */
import { CircleSlash } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState, FilterChipGroup } from '@/modules/design-system';
import {
  deriveLiveRollup,
} from '@/modules/teacher/lib/live-rollup';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTestSessionsQuery } from '@/modules/teacher/queries/use-test-sessions.query';

export function IdleClassChips() {
  const t = useTranslations('Teacher.testSessions.rollup');
  const sessionsQuery = useTestSessionsQuery();
  const dashboardQuery = useTeacherDashboardQuery();
  const rollup = deriveLiveRollup(
    sessionsQuery.data?.sessions ?? [],
    dashboardQuery.data?.classes ?? [],
  );

  if (rollup.groups.length === 0 && rollup.idleClasses.length === 0) return null;

  return (
    <section
      data-slot="teacher-idle-classes"
      aria-label={t('idleHeading')}
      className="flex flex-col gap-3"
    >
      <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t('idleHeading')}
      </h3>
      {rollup.allClassesBusy ? (
        <EmptyState icon={CircleSlash} title={t('allBusy')} description="" />
      ) : (
        <FilterChipGroup
          ariaLabel={t('idleHeading')}
          value=""
          onValueChange={(classDocumentId) => {
            document
              .querySelector('[data-slot="test-session-setup"]')
              ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            return classDocumentId;
          }}
          options={rollup.idleClasses.map((klass) => ({
            value: klass.classDocumentId,
            label: t('chipLabel', { name: klass.name, students: klass.studentCount }),
          }))}
        />
      )}
    </section>
  );
}
