'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { useEndSession } from '@/modules/teacher/hooks/useEndSession';
import { liveTabHref, progressPercent, stillWorking } from '@/modules/teacher/lib/live-rollup';
import type { LiveRollupSitting } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:242–260 — one live sitting: LIVE badge, the served
// form label, join code, who sits it, the submitted bar, the server's
// joined/submitted counts, Monitor (the class Live tab) and Close (C-TS-4).
function LiveSessionCard({ sitting, classLabel }: { sitting: LiveRollupSitting; classLabel: string }) {
  const t = useTranslations('TeacherPortal.liveSessions');
  const tKit = useTranslations('TeacherPortal.kit');
  const end = useEndSession(sitting.documentId);
  const noValue = tKit('noValue');
  const working = stillWorking(sitting);
  const who =
    sitting.memberIds === null
      ? t('whoWhole', { count: sitting.expected })
      : t('whoSelected', { count: sitting.memberIds.length });
  const progress =
    sitting.joined === null || sitting.submitted === null
      ? noValue
      : t('progress', { joined: sitting.joined, submitted: sitting.submitted, total: sitting.expected });

  return (
    <article
      data-slot="live-session-card"
      data-sitting-id={sitting.documentId}
      className="flex flex-col gap-[11px] rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[18px] py-4"
    >
      <div className="flex items-center gap-2.5">
        <TeacherStatusPill
          status="live"
          size="sm"
          label={tKit('status.liveShort')}
          className="gap-[5px] pl-[7px] text-[10px]"
        />
        <h3 className="flex-1 text-[14px] font-medium text-navy-900">{sitting.formLabel ?? noValue}</h3>
        <span
          data-slot="live-session-code"
          className="text-[13px] font-medium tracking-[0.04em] text-[#6B7280] tabular-nums"
        >
          {sitting.code ?? noValue}
        </span>
      </div>
      <p className="text-[12.5px] text-[#6B7280]">{who}</p>
      <div aria-hidden="true" className="h-[5px] overflow-hidden rounded-full bg-[#EDEFF3]">
        <div
          className="h-full rounded-full bg-navy-900"
          style={{ width: `${progressPercent(sitting)}%` }}
        />
      </div>
      <p data-slot="live-session-progress" className="text-[12.5px] text-[#4B5563]">
        {progress}
      </p>
      <div className="flex flex-wrap gap-2">
        <TeacherButton size="sm" href={liveTabHref(sitting.classDocumentId, sitting.documentId)}>
          {t('monitor')}
        </TeacherButton>
        <TeacherButton tone="ghost" size="sm" className="px-3" onClick={end.openConfirm}>
          {t('close')}
        </TeacherButton>
      </div>
      {end.isConfirmOpen ? (
        <OpsConfirmDialog
          open
          onOpenChange={end.setConfirmOpen}
          tone="destructive"
          title={working ? t('closeConfirm.titleWorking', { count: working }) : t('closeConfirm.title')}
          description={t('closeConfirm.body', { code: sitting.code ?? noValue, className: classLabel })}
          confirmLabel={t('closeConfirm.cta')}
          cancelLabel={t('closeConfirm.cancel')}
          pending={end.isPending}
          className="sm:max-w-[440px]"
          onConfirm={end.confirm}
        />
      ) : null}
    </article>
  );
}

export { LiveSessionCard };
