'use client';

import { useTranslations } from 'next-intl';

import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';
import type { LiveResitEntry } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1223–1242 — who still owes a sitting: absent here,
// scoring failed, or never sat anything. The button opens the start modal on
// its Students tab with exactly these students picked.
function LiveResitQueue({
  entries,
  classDocumentId,
}: {
  entries: readonly LiveResitEntry[];
  classDocumentId: string;
}) {
  const t = useTranslations('TeacherPortal.live.students');
  const openStartSession = useStartSessionStore((state) => state.open);

  return (
    <section
      data-slot="live-resit-queue"
      data-count={entries.length}
      className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[30px] py-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-[18px]">
        <div className="min-w-[240px] flex-1">
          <h2 className="text-[16px] font-semibold text-navy-900">{t('resit.title')}</h2>
          <p className="mt-[5px] max-w-[62ch] text-[13px] leading-[1.55] text-[#6B7280]">
            {entries.length === 0 ? t('resit.empty') : t('resit.note')}
          </p>
        </div>
        {entries.length === 0 ? null : (
          <TeacherButton
            size="xl"
            data-slot="live-resit-start"
            onClick={() =>
              openStartSession({
                classId: classDocumentId,
                studentIds: entries.map((entry) => entry.studentId),
                tab: 'students',
                mode: 'now',
              })
            }
          >
            {t('resit.start', { count: entries.length })}
          </TeacherButton>
        )}
      </div>
      {entries.length === 0 ? null : (
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {entries.map((entry) => (
            <li
              key={entry.studentId}
              data-slot="live-resit-entry"
              data-student-id={entry.studentId}
              data-reason={entry.reason}
              className="flex min-w-[230px] items-center gap-[11px] rounded-[10px] border border-[#ECEEF2] px-[15px] py-[11px]"
            >
              <InitialsAvatar name={entry.name} size="xs" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-navy-900">{entry.name}</p>
                <p className="mt-0.5 text-[12px] text-[#92610B]">{t(`resit.reason.${entry.reason}`)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { LiveResitQueue };
