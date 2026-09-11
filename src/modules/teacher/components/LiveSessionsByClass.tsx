'use client';

import { useTranslations } from 'next-intl';

import { LiveSessionCard } from '@/modules/teacher/components/LiveSessionCard';
import { ClassBadge } from '@/modules/teacher/components/v2/ClassBadge';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { useYearLabel } from '@/modules/teacher/hooks/useClassesDirectory';
import { classBadgeCode } from '@/modules/teacher/lib/teacher-kit';
import type { LiveRollupGroup } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:231–265 — one block per class with a live sitting,
// or the one-line empty state when nothing is running.
function LiveSessionsByClass({
  groups,
  onAddSession,
}: {
  groups: readonly LiveRollupGroup[];
  onAddSession: (classDocumentId: string) => void;
}) {
  const t = useTranslations('TeacherPortal.liveSessions');
  const yearLabel = useYearLabel();

  if (groups.length === 0) {
    return (
      <div data-slot="teacher-live-rollup" data-status="empty">
        <p className="border-t border-[#ECEEF2] px-8 py-12 text-center text-[13.5px] text-[#6B7280]">
          {t('empty')}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="teacher-live-rollup" data-status="live">
      {groups.map((group) => {
        const year = yearLabel(group.year);
        const headingId = `live-class-${group.classDocumentId}`;
        return (
          <section
            key={group.classDocumentId}
            data-slot="live-class-block"
            data-class-id={group.classDocumentId}
            aria-labelledby={headingId}
            className="flex flex-col gap-3.5 border-t border-[#ECEEF2] px-8 py-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <ClassBadge code={classBadgeCode(group.name)} tone="soft" />
              <div className="min-w-[180px] flex-1">
                <h2 id={headingId} className="text-[15px] font-medium text-navy-900">
                  {group.name}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                  {year === null
                    ? t('classMetaNoYear', { count: group.studentCount })
                    : t('classMeta', { year, count: group.studentCount })}
                </p>
              </div>
              <span data-slot="live-class-free" className="text-[12.5px] text-[#6B7280]">
                {group.freeCount > 0 ? t('free', { count: group.freeCount }) : t('everyoneBusy')}
              </span>
              {group.freeCount > 0 ? (
                <TeacherButton
                  tone="secondary"
                  size="sm"
                  onClick={() => onAddSession(group.classDocumentId)}
                >
                  {t('addSession')}
                </TeacherButton>
              ) : null}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
              {group.sittings.map((sitting) => (
                <LiveSessionCard key={sitting.documentId} sitting={sitting} classLabel={group.name} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export { LiveSessionsByClass };
