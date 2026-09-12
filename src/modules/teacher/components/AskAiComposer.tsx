'use client';

import { Mic, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ASK_AI_ICON_BUTTON_CLASS } from '@/modules/teacher/constants/ask-ai.constants';
import { TEACHER_ASK_QUESTION_MAX } from '@/modules/teacher/schemas/teacher-ask.schema';
import type { AskAiComposerProps } from '@/modules/teacher/types/ask-ai.types';

// The drawer's foot (`Teacher Portal v2.dc.html:375–390`): the three suggested
// questions, then the mic, the question field and Send. Enter sends, as in the
// design. Everything is disabled while C-TA-1 is answering, so one question is in
// flight at a time; the field's cap is the contract's own 500 characters. The mic
// drives the browser's real SpeechRecognition; where the browser has none it says
// so in the thread (the design's own fallback) and never invents a transcript.
function AskAiComposer({ ask, placeholder, suggestions }: AskAiComposerProps) {
  const t = useTranslations('TeacherPortal.askAi');

  return (
    <div className="border-t border-[#333842] px-3.5 pt-3 pb-3.5">
      <div className="flex gap-[7px] overflow-x-auto pb-[11px]">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.key}
            type="button"
            data-slot="ask-ai-suggestion"
            data-intent={suggestion.key}
            disabled={ask.isPending}
            onClick={() => ask.send(suggestion.question)}
            className="h-[30px] flex-none cursor-pointer rounded-full border border-[#3A404B] bg-white/5 px-3 text-[12px] font-medium whitespace-nowrap text-[#C7CCD4] outline-none hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-[#8FA6EA] disabled:cursor-not-allowed disabled:opacity-60"
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
          data-slot="ask-ai-mic"
          aria-pressed={ask.listening}
          aria-label={t('mic')}
          title={t('mic')}
          disabled={ask.isPending}
          onClick={ask.listen}
          className={cn(
            ASK_AI_ICON_BUTTON_CLASS,
            'size-[42px] rounded-[10px]',
            ask.listening ? 'bg-[#3E6FF0] text-white' : 'bg-white/5 text-[#AEB4C0]',
          )}
        >
          <Mic aria-hidden="true" className="size-[17px]" strokeWidth={2} />
        </button>
        <input
          value={ask.query}
          maxLength={TEACHER_ASK_QUESTION_MAX}
          disabled={ask.isPending}
          onChange={(event) => ask.setQuery(event.target.value)}
          aria-label={t('inputLabel')}
          placeholder={ask.listening ? t('listening') : placeholder}
          className="h-[44px] min-w-0 flex-1 rounded-[10px] border border-[#3A404B] bg-[#2C313B] px-3.5 text-[13.5px] text-[#F0F2F5] outline-none placeholder:text-[#9AA1AD] focus-visible:ring-2 focus-visible:ring-[#8FA6EA] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          data-slot="ask-ai-send"
          aria-label={t('send')}
          title={t('send')}
          disabled={ask.isPending}
          className="flex size-[42px] flex-none cursor-pointer items-center justify-center rounded-[10px] border-0 bg-[#3E6FF0] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#8FA6EA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}

export { AskAiComposer };
