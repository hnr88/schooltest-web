'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { BlockedReason, RosterEntry } from '@/modules/teacher/types/start-session-modal.types';

/**
 * The roster checklist (`mRoster`, `:1465–1480`): real students; a busy one is
 * greyed with why ("Already sitting …" / "Booked into … at HH:MM") and cannot be
 * ticked — native checkboxes, so Space toggles and a disabled one is skipped.
 */
function RosterPicker({
  entries,
  pickedCount,
  onToggle,
  className,
}: {
  entries: readonly RosterEntry[];
  pickedCount: number;
  onToggle: (id: string) => void;
  className: string;
}) {
  const t = useTranslations('TeacherPortal.startSession.students');
  const note = (reason: BlockedReason) => {
    if (reason.kind === 'booked') return t('bookedInto', { form: reason.formLabel, time: reason.opensAt });
    return reason.formLabel ? t('alreadySitting', { form: reason.formLabel }) : t('alreadySittingTest');
  };

  return (
    <div
      role="group"
      aria-label={t('rosterLabel', { className })}
      data-slot="start-session-roster"
      className="mt-2.5 max-h-[240px] overflow-y-auto rounded-[12px] border border-[#ECEEF2] px-4"
    >
      <div
        aria-live="polite"
        className="sticky top-0 z-[1] border-b border-[#F5F6F8] bg-white pt-[13px] pb-2.5 text-[12px] font-semibold text-[#6B7280]"
      >
        {pickedCount > 0 ? t('pickCount', { count: pickedCount, total: entries.length }) : t('pickNone')}
      </div>
      {entries.map((entry) => (
        <label
          key={entry.id}
          data-slot="start-session-student"
          data-student-id={entry.id}
          data-blocked={entry.blocked?.kind}
          className={cn(
            'flex items-center gap-3 border-b border-[#F5F6F8] py-[11px] last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-navy-900',
            entry.blocked ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={entry.picked}
            disabled={entry.blocked !== null}
            onChange={() => onToggle(entry.id)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              'grid size-5 shrink-0 place-items-center rounded-[6px] border-[1.5px]',
              entry.blocked
                ? 'border-[#EEF1F6] bg-[#F4F6FA]'
                : entry.picked
                  ? 'border-navy-900 bg-navy-900'
                  : 'border-[#C4CEDC] bg-white',
            )}
          >
            {entry.picked ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[14px] font-medium',
              entry.blocked ? 'text-[#9AA6B8]' : 'text-navy-900',
            )}
          >
            {entry.name}
          </span>
          {entry.blocked ? (
            <span className="shrink-0 rounded-full bg-[#FDF3E0] px-2.5 py-1 text-[12px] font-semibold text-[#92610B]">
              {note(entry.blocked)}
            </span>
          ) : null}
        </label>
      ))}
    </div>
  );
}

export { RosterPicker };
