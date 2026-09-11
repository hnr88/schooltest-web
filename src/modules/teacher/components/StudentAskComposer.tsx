'use client';

import { Mic, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { STUDENT_ASK_ICON_BUTTON_CLASS } from '@/modules/teacher/constants/student-ask.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import type { StudentAskComposerProps } from '@/modules/teacher/types/student-ask.types';

// The drawer's foot (`Teacher Portal v2.dc.html:375–390`): the three suggested questions,
// then the mic, the question field and Send. Enter sends, as in the design.
function StudentAskComposer({ ask }: StudentAskComposerProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);

  return (
    <div className="border-t border-[#333842] px-3.5 pt-3 pb-3.5">
      <div className="flex gap-[7px] overflow-x-auto pb-[11px]">
        {ask.suggestions.map((suggestion) => (
          <button
            key={suggestion.intent}
            type="button"
            data-slot="student-ask-suggestion"
            data-intent={suggestion.intent}
            onClick={() => ask.send(suggestion.question, suggestion.intent)}
            className="h-[30px] flex-none cursor-pointer rounded-full border border-[#3A404B] bg-white/5 px-3 text-[12px] font-medium whitespace-nowrap text-[#C7CCD4] outline-none hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-[#8FA6EA]"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask.send();
        }}
      >
        <button
          type="button"
          data-slot="student-ask-mic"
          aria-pressed={ask.listening}
          aria-label={t('ask.mic')}
          title={t('ask.mic')}
          onClick={ask.listen}
          className={cn(
            STUDENT_ASK_ICON_BUTTON_CLASS,
            'size-[42px] rounded-[10px]',
            ask.listening ? 'bg-[#3E6FF0] text-white' : 'bg-white/5 text-[#AEB4C0]',
          )}
        >
          <Mic aria-hidden="true" className="size-[17px]" strokeWidth={2} />
        </button>
        <input
          value={ask.query}
          onChange={(event) => ask.setQuery(event.target.value)}
          aria-label={t('ask.inputLabel')}
          placeholder={ask.listening ? t('ask.listening') : t('ask.placeholder')}
          className="h-[42px] min-w-0 flex-1 rounded-[10px] border border-[#3A404B] bg-[#2C313B] px-3.5 text-[13.5px] text-[#F0F2F5] outline-none placeholder:text-[#9AA1AD] focus-visible:ring-2 focus-visible:ring-[#8FA6EA]"
        />
        <button
          type="submit"
          data-slot="student-ask-send"
          aria-label={t('ask.send')}
          title={t('ask.send')}
          className="flex size-[42px] flex-none cursor-pointer items-center justify-center rounded-[10px] border-0 bg-[#3E6FF0] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#8FA6EA]"
        >
          <Send aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}

export { StudentAskComposer };
