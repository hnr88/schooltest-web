'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { LIVE_EYEBROW_CLASS } from '@/modules/teacher/constants/live-tab.constants';
import { useCopyCode } from '@/modules/teacher/hooks/useCopyCode';
import { useEndSession } from '@/modules/teacher/hooks/useEndSession';
import { useLiveConfirmCopy } from '@/modules/teacher/hooks/useLiveConfirmCopy';
import { closeConfirmFacts } from '@/modules/teacher/lib/live-tab';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';

// Teacher Portal v2.dc.html:1077–1086 — the served join code, Copy code (the real
// clipboard) and Close sitting (C-TS-4 behind the design's confirm, filled from the monitor).
function JoinCodeCell({
  sitting,
  monitor,
}: {
  sitting: TeacherTestSession;
  monitor: TestSessionMonitorResponse | null;
}) {
  const t = useTranslations('TeacherPortal.live.room');
  const tClose = useTranslations('TeacherPortal.liveSessions.closeConfirm');
  const tKit = useTranslations('TeacherPortal.kit');
  const { copied, copy } = useCopyCode(sitting.code);
  const end = useEndSession(sitting.sitting_document_id);
  const { closeCopy } = useLiveConfirmCopy();
  const code = sitting.code ?? tKit('noValue');
  const confirm = closeCopy(monitor === null ? null : closeConfirmFacts(monitor.students), {
    code,
    className: sitting.class.name,
  });

  return (
    <div data-slot="join-code-cell" className="flex flex-col bg-white px-6 py-[22px]">
      <span className={`flex items-center gap-2 ${LIVE_EYEBROW_CLASS}`}>
        {t('joinCode')}
        <span aria-hidden="true" className="size-[7px] animate-om-pulse-slow rounded-full bg-[#B42318]" />
      </span>
      <p
        data-slot="live-join-code"
        className="mt-3 mb-5 text-[44px] leading-[1.05] font-bold tracking-[0.02em] whitespace-nowrap text-navy-900 tabular-nums"
      >
        {code}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2.5">
        <TeacherButton size="xl" data-slot="copy-code" disabled={sitting.code === null} onClick={copy}>
          <Copy aria-hidden="true" className="size-[15px]" strokeWidth={1.9} />
          {copied ? t('copied') : t('copy')}
        </TeacherButton>
        <TeacherButton tone="dangerOutline" size="xl" onClick={end.openConfirm}>
          {t('close')}
        </TeacherButton>
      </div>
      {end.isConfirmOpen ? (
        <OpsConfirmDialog
          open
          onOpenChange={end.setConfirmOpen}
          tone="destructive"
          title={confirm.title}
          description={confirm.body}
          confirmLabel={tClose('cta')}
          cancelLabel={tClose('cancel')}
          pending={end.isPending}
          skin="teacher"
          onConfirm={end.confirm}
        />
      ) : null}
    </div>
  );
}

export { JoinCodeCell };
