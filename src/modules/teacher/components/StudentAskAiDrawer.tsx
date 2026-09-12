'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { AskAiDrawer } from '@/modules/teacher/components/AskAiDrawer';
import { STUDENT_ASK_SUGGESTIONS } from '@/modules/teacher/constants/ask-ai.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useAskAi } from '@/modules/teacher/hooks/useAskAi';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { AskAiStrings } from '@/modules/teacher/types/ask-ai.types';
import type { StudentAskAiDrawerProps } from '@/modules/teacher/types/student-drill-down.types';

// The student scope of the shared drawer (`Teacher Portal v2.dc.html:346–392`),
// opened by the header's Ask AI button through the overlays store. Its questions
// go to C-TA-1 with `scope: 'student'` and this student's id, so every answer is
// the live model's, grounded in this student's own results (TB-09). Leaving the
// page (or the Reading skill) closes it.
function StudentAskAiDrawer({ view, firstName, classDocumentId, studentDocumentId }: StudentAskAiDrawerProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tAsk = useTranslations('TeacherPortal.askAi');
  const open = useClassOverlaysStore(
    (state) =>
      state.askAiOpen &&
      state.askAiTarget.scope === 'student' &&
      state.askAiTarget.studentDocumentId === studentDocumentId,
  );
  const close = useClassOverlaysStore((state) => state.close);
  const target = useMemo(() => ({ scope: 'student' as const, studentDocumentId }), [studentDocumentId]);
  const ask = useAskAi(target, classDocumentId);

  useEffect(() => close, [close]);

  const strings: AskAiStrings = {
    title: t('ask.title', { first: firstName }),
    grounded: t('ask.grounded', { first: firstName }),
    intro: t('ask.intro', { first: firstName, count: view.tiles.sittings.count }),
    placeholder: t('ask.placeholder'),
    groundingNote: (grounding) => tAsk('student.grounding', { sittings: grounding.sittings }),
    suggestions: STUDENT_ASK_SUGGESTIONS.map((key) => ({
      key,
      label: t(`ask.suggest.${key}`, { first: firstName }),
      question: t(`ask.question.${key}`, { first: firstName }),
    })),
  };

  return <AskAiDrawer open={open} onClose={close} strings={strings} ask={ask} />;
}

export { StudentAskAiDrawer };
