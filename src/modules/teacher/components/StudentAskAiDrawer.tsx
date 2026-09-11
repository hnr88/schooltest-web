'use client';

import { Dialog } from '@base-ui/react/dialog';
import { Sparkle, Volume2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import { StudentAskComposer } from '@/modules/teacher/components/StudentAskComposer';
import { StudentAskThread } from '@/modules/teacher/components/StudentAskThread';
import { STUDENT_ASK_ICON_BUTTON_CLASS } from '@/modules/teacher/constants/student-ask.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useStudentAskAi } from '@/modules/teacher/hooks/useStudentAskAi';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { StudentAskAiDrawerProps } from '@/modules/teacher/types/student-ask.types';

// The student Ask AI drawer (`Teacher Portal v2.dc.html:346–392`): a 430px dark panel over
// the dimmed page, opened by the header's Ask AI button through the overlays store. It is a
// modal dialog, so focus stays inside, Escape or the backdrop closes it and focus returns.
// Leaving the page (or the Reading skill) closes it too.
function StudentAskAiDrawer({ view, firstName, studentDocumentId }: StudentAskAiDrawerProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const open = useClassOverlaysStore(
    (state) =>
      state.askAiOpen &&
      state.askAiTarget.scope === 'student' &&
      state.askAiTarget.studentDocumentId === studentDocumentId,
  );
  const close = useClassOverlaysStore((state) => state.close);
  const ask = useStudentAskAi(view, firstName);

  useEffect(() => close, [close]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        ask.silence();
        close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-[rgba(15,18,24,0.5)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          data-slot="student-ask-ai"
          className="fixed top-0 right-0 z-[90] flex h-full w-[min(430px,94vw)] flex-col bg-[#23262E] leading-[normal] text-[#F0F2F5] shadow-[-26px_0_70px_rgba(6,10,18,0.5)] outline-none transition-transform duration-200 ease-out-expo data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none"
        >
          <div className="flex items-center gap-[11px] border-b border-[#333842] px-[18px] py-4">
            <div className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-[#2C313B]">
              <Sparkle aria-hidden="true" className="size-[17px] text-[#8FA6EA]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[14px] font-semibold tracking-[0.01em]">
                {t('ask.title', { first: firstName })}
              </Dialog.Title>
              <Dialog.Description className="mt-px text-[11px] text-[#9AA1AD]">
                {ask.speak ? t('ask.speakStatus') : t('ask.grounded', { first: firstName })}
              </Dialog.Description>
            </div>
            <button
              type="button"
              data-slot="student-ask-speak"
              aria-pressed={ask.speak}
              title={t('ask.speakTitle')}
              onClick={ask.toggleSpeak}
              className={cn(
                STUDENT_ASK_ICON_BUTTON_CLASS,
                'h-8 gap-1.5 rounded-[8px] px-[11px] text-[12px] font-semibold',
                ask.speak ? 'bg-[#3E6FF0] text-white' : 'bg-white/5 text-[#AEB4C0]',
              )}
            >
              <Volume2 aria-hidden="true" className="size-3.5" strokeWidth={2} />
              {ask.speak ? t('ask.speakOn') : t('ask.speak')}
            </button>
            <Dialog.Close
              aria-label={t('ask.close')}
              title={t('ask.close')}
              className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[8px] border-0 bg-white/5 text-[#C7CCD4] outline-none hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-[#8FA6EA]"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={2} />
            </Dialog.Close>
          </div>
          <StudentAskThread firstName={firstName} sittings={view.tiles.sittings.count} messages={ask.messages} />
          <StudentAskComposer ask={ask} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { StudentAskAiDrawer };
