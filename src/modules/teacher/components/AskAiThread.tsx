'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { AskAiThreadProps } from '@/modules/teacher/types/ask-ai.types';

const TONE_CLASS = {
  answer: 'border-[#3A404B] bg-[#2C313B] text-[#E7EAF0]',
  refused: 'border-[#3A404B] bg-[#2C313B] text-[#E7EAF0]',
  error: 'border-[#6B5326] bg-[#2F2A1F] text-[#F1E3C6]',
} as const;

const TITLE_CLASS = { answer: 'text-[#8FA6EA]', refused: 'text-[#8FA6EA]', error: 'text-[#E8B964]' } as const;

// The drawer's thread (`Teacher Portal v2.dc.html:364–374`): the grounding note
// until the first question, then the teacher's questions in blue on the right and
// each answer on the left. An answer carries the cohort C-TA-1 built it on, so a
// class answer drawn from a partial cohort says so in the design's own words. The
// endpoint's own refusals (a gateway that is down, a spent budget) are amber and
// carry the server's sentence — never a fabricated answer. New turns are announced.
function AskAiThread({ intro, messages, isPending, groundingNote }: AskAiThreadProps) {
  const t = useTranslations('TeacherPortal.askAi');
  const body = useRef<HTMLDivElement>(null);

  // The newest turn stays in view. `scrollTop` rather than `scrollIntoView`: the
  // drawer is a modal popup, and scrolling an element into view there can move the
  // page behind it as well.
  useEffect(() => {
    if (body.current !== null) body.current.scrollTop = body.current.scrollHeight;
  }, [messages.length, isPending]);

  return (
    <div
      ref={body}
      data-slot="ask-ai-thread"
      aria-live="polite"
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-[18px]"
    >
      {messages.length === 0 ? (
        <div className="rounded-[12px] border border-[#3A404B] bg-[#2C313B] px-[17px] py-4">
          <p className="text-[13.5px] leading-[1.6] text-[#E7EAF0]">{intro}</p>
        </div>
      ) : null}
      {messages.map((message) => (
        <div
          key={message.id}
          data-slot="ask-ai-message"
          data-role={message.role}
          data-tone={message.tone}
          className={cn(
            'max-w-[88%] rounded-[13px] px-3.5 py-[11px]',
            message.role === 'teacher' ? 'self-end bg-[#3E6FF0] text-white' : cn('self-start border', TONE_CLASS[message.tone]),
          )}
        >
          {message.title === null ? null : (
            <p
              data-slot="ask-ai-answer-title"
              className={cn('mb-[5px] text-[11.5px] font-semibold', TITLE_CLASS[message.tone])}
            >
              {message.title}
            </p>
          )}
          <p className="text-[13.5px] leading-[1.6]">{message.body}</p>
          {message.grounding === null ? null : (
            <p data-slot="ask-ai-grounding" className="mt-2 text-[11.5px] leading-[1.5] text-[#9AA1AD]">
              {groundingNote(message.grounding)}
            </p>
          )}
        </div>
      ))}
      {isPending ? (
        <div
          data-slot="ask-ai-pending"
          role="status"
          className="max-w-[88%] self-start rounded-[13px] border border-[#3A404B] bg-[#2C313B] px-3.5 py-[11px] text-[13.5px] leading-[1.6] text-[#9AA1AD]"
        >
          {t('thinking')}
        </div>
      ) : null}
    </div>
  );
}

export { AskAiThread };
