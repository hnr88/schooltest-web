'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { LiveRollupIdleClass } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:289–297 — every class with nothing running; a chip
// opens the Start-new-session modal for that class.
function IdleClassChips({
  classes,
  onStart,
}: {
  classes: readonly LiveRollupIdleClass[];
  onStart: (classDocumentId: string) => void;
}) {
  const t = useTranslations('TeacherPortal.liveSessions');

  return (
    <section
      data-slot="teacher-idle-classes"
      aria-labelledby="live-sessions-idle"
      className="border-t border-[#ECEEF2] px-8 py-[22px]"
    >
      <h2
        id="live-sessions-idle"
        className="text-[11px] font-medium tracking-[0.07em] text-[#6B7280] uppercase"
      >
        {t('idleTitle')}
      </h2>
      {classes.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {classes.map((klass) => (
            <li key={klass.classDocumentId}>
              <button
                type="button"
                data-class-id={klass.classDocumentId}
                onClick={() => onStart(klass.classDocumentId)}
                className={cn(
                  'cursor-pointer rounded-[8px] border border-transparent bg-[#F5F6F8] px-[13px] py-[7px] text-[13px] font-medium text-[#374151] transition-colors hover:border-navy-900 motion-reduce:transition-none',
                  KIT_FOCUS_RING,
                )}
              >
                {t('idleChip', { name: klass.name, count: klass.studentCount })}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[#6B7280]">{t('idleEmpty')}</p>
      )}
    </section>
  );
}

export { IdleClassChips };
