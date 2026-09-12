'use client';

import { Dialog } from '@base-ui/react/dialog';
import { Sparkle, Volume2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { AskAiComposer } from '@/modules/teacher/components/AskAiComposer';
import { AskAiThread } from '@/modules/teacher/components/AskAiThread';
import { ASK_AI_ICON_BUTTON_CLASS } from '@/modules/teacher/constants/ask-ai.constants';
import type { AskAiDrawerProps } from '@/modules/teacher/types/ask-ai.types';

// The shared Ask AI drawer (`Teacher Portal v2.dc.html:346–392` student,
// `:550–596` class): a 430px dark panel over the dimmed page. It is a modal
// dialog, so focus stays inside, Escape or the backdrop closes it and focus
// returns to the button that opened it. One shell, two scopes — the class and
// student wrappers differ only in the copy and the ids they ask with.
function AskAiDrawer({ open, onClose, strings, ask }: AskAiDrawerProps) {
  const t = useTranslations('TeacherPortal.askAi');

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        ask.silence();
        onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-[rgba(15,18,24,0.5)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          data-slot="ask-ai-drawer"
          className="fixed top-0 right-0 z-[90] flex h-full w-[min(430px,94vw)] flex-col bg-[#23262E] leading-[normal] text-[#F0F2F5] shadow-[-26px_0_70px_rgba(6,10,18,0.5)] outline-none transition-transform duration-200 ease-out-expo data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none"
        >
          <div className="flex items-center gap-[11px] border-b border-[#333842] px-[18px] py-4">
            <div className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-[#2C313B]">
              <Sparkle aria-hidden="true" className="size-[17px] text-[#8FA6EA]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[14px] font-semibold tracking-[0.01em]">{strings.title}</Dialog.Title>
              <Dialog.Description className="mt-px text-[11px] text-[#9AA1AD]">
                {ask.speak ? t('speakStatus') : strings.grounded}
              </Dialog.Description>
            </div>
            <button
              type="button"
              data-slot="ask-ai-speak"
              aria-pressed={ask.speak}
              title={t('speakTitle')}
              onClick={ask.toggleSpeak}
              className={cn(
                ASK_AI_ICON_BUTTON_CLASS,
                'h-8 gap-1.5 rounded-[8px] px-[11px] text-[12px] font-semibold',
                ask.speak ? 'bg-[#3E6FF0] text-white' : 'bg-white/5 text-[#AEB4C0]',
              )}
            >
              <Volume2 aria-hidden="true" className="size-3.5" strokeWidth={2} />
              {ask.speak ? t('speakOn') : t('speak')}
            </button>
            <Dialog.Close
              aria-label={t('close')}
              title={t('close')}
              className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[8px] border-0 bg-white/5 text-[#C7CCD4] outline-none hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-[#8FA6EA]"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={2} />
            </Dialog.Close>
          </div>
          <AskAiThread
            intro={strings.intro}
            messages={ask.messages}
            isPending={ask.isPending}
            groundingNote={strings.groundingNote}
          />
          <AskAiComposer ask={ask} placeholder={strings.placeholder} suggestions={strings.suggestions} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { AskAiDrawer };
