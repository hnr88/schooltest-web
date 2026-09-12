'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

// Teacher Portal v2.dc.html:1040–1048 — "No sitting open": the navy card whose one
// action opens the Start-new-session modal for this class.
function NoSittingCard({ classDocumentId }: { classDocumentId: string }) {
  const t = useTranslations('TeacherPortal.live.noSitting');
  const openStartSession = useStartSessionStore((store) => store.open);

  return (
    <section
      data-slot="live-no-sitting"
      aria-labelledby="live-no-sitting-title"
      className="flex flex-col gap-4 rounded-[10px] bg-navy-900 px-[38px] py-[34px] text-white"
    >
      <div>
        <h3 id="live-no-sitting-title" className="text-[22px] font-semibold tracking-[-0.01em]">
          {t('title')}
        </h3>
        <p className="mt-1.5 max-w-[60ch] text-[14px] text-[#B9C6DD]">{t('body')}</p>
      </div>
      <TeacherButton
        tone="inverse"
        size="2xl"
        data-slot="start-session-button"
        className="self-start"
        onClick={() => openStartSession({ classId: classDocumentId })}
      >
        <Plus aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
        {t('start')}
      </TeacherButton>
    </section>
  );
}

export { NoSittingCard };
