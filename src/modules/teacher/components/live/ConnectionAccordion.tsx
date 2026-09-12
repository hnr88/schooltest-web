'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { showOpsToast } from '@/modules/ops/actions';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { connectionCounts, effectiveSettings } from '@/modules/teacher/lib/live-tab';
import { useSittingSettingsMutation } from '@/modules/test-day';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';

// Teacher Portal v2.dc.html:1124–1145 — Connection: the monitor's per-student
// connection over whoever is still working, and Low-bandwidth mode written to the
// sitting's settings (C-SIT-SETTINGS allows `lowBw` while open). Collapsed by default.
function ConnectionAccordion({
  sittingDocumentId,
  monitor,
  settings,
}: {
  sittingDocumentId: string;
  monitor: TestSessionMonitorResponse | null;
  settings: SittingSettings | null;
}) {
  const t = useTranslations('TeacherPortal.live.connection');
  const tKit = useTranslations('TeacherPortal.kit');
  const [open, setOpen] = useState(false);
  const write = useSittingSettingsMutation(sittingDocumentId);
  const counts = connectionCounts(monitor?.students ?? []);
  const lowBw = effectiveSettings(settings).lowBw;

  const flip = () =>
    write.mutate({ lowBw: !lowBw }, { onError: () => showOpsToast({ tone: 'error', message: t('lowBwError') }) });

  return (
    <section data-slot="live-connection" className="flex flex-col overflow-hidden rounded-[11px] border border-[#ECEEF2]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="live-connection-body"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex items-center gap-3.5 bg-white px-[22px] py-4 text-left transition-colors hover:bg-[#FAFBFC]',
          KIT_FOCUS_RING,
        )}
      >
        <span className="text-[14.5px] font-semibold text-navy-900">{t('title')}</span>
        <span data-slot="live-connection-summary" className="min-w-0 flex-1 truncate text-[13px] text-[#6B7280]">
          {monitor === null
            ? tKit('noValue')
            : t('summary', {
                online: counts.online,
                weak: counts.weak,
                offline: counts.offline,
                working: counts.working,
              })}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 flex-none text-[#6B7280] transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div
          id="live-connection-body"
          className="flex flex-wrap items-center justify-between gap-[18px] border-t border-[#F3F4F6] px-[22px] pt-1 pb-[22px]"
        >
          <p className="max-w-[62ch] min-w-[240px] flex-1 text-[13.5px] leading-[1.6] text-[#6B7280]">
            {counts.offline > 0 ? t('metaOffline', { count: counts.offline }) : t('metaAll')}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={lowBw}
            data-slot="low-bandwidth-toggle"
            disabled={write.isPending}
            onClick={flip}
            className={cn(
              'flex h-[42px] items-center gap-3 rounded-[8px] border border-[#D8DFEA] bg-white px-4 transition-colors hover:border-navy-900 disabled:opacity-60',
              KIT_FOCUS_RING,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'relative h-[22px] w-[38px] flex-none rounded-full transition-colors duration-150',
                lowBw ? 'bg-navy-900' : 'bg-[#D8DFEA]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] left-[3px] size-4 rounded-full bg-white transition-transform duration-150',
                  lowBw && 'translate-x-[18px]',
                )}
              />
            </span>
            <span className="text-[13.5px] font-semibold text-navy-900">{lowBw ? t('lowBwOn') : t('lowBwOff')}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}

export { ConnectionAccordion };
