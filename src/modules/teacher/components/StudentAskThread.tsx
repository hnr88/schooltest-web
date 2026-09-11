'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import type { StudentAskThreadProps } from '@/modules/teacher/types/student-ask.types';

// The drawer's thread (`Teacher Portal v2.dc.html:364–374`): the grounding note until the
// first question, then the teacher's questions in blue on the right and each titled answer
// on the left. New answers are announced to screen readers.
function StudentAskThread({ firstName, sittings, messages }: StudentAskThreadProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);

  return (
    <div
      data-slot="student-ask-thread"
      aria-live="polite"
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-[18px]"
    >
      {messages.length === 0 ? (
        <div className="rounded-[12px] border border-[#3A404B] bg-[#2C313B] px-[17px] py-4">
          <p className="text-[13.5px] leading-[1.6] text-[#E7EAF0]">
            {t('ask.intro', { first: firstName, count: sittings })}
          </p>
        </div>
      ) : null}
      {messages.map((message) => (
        <div
          key={message.id}
          data-slot="student-ask-message"
          data-role={message.role}
          className={cn(
            'max-w-[88%] rounded-[13px] px-3.5 py-[11px]',
            message.role === 'teacher'
              ? 'self-end bg-[#3E6FF0] text-white'
              : 'self-start border border-[#3A404B] bg-[#2C313B] text-[#E7EAF0]',
          )}
        >
          {message.title === null ? null : (
            <p data-slot="student-ask-answer-title" className="mb-[5px] text-[11.5px] font-semibold text-[#8FA6EA]">
              {message.title}
            </p>
          )}
          <p className="text-[13.5px] leading-[1.6]">{message.body}</p>
        </div>
      ))}
    </div>
  );
}

export { StudentAskThread };
