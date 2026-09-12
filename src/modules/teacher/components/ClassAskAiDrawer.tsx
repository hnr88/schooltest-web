'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { AskAiDrawer } from '@/modules/teacher/components/AskAiDrawer';
import { CLASS_ASK_SUGGESTIONS } from '@/modules/teacher/constants/ask-ai.constants';
import { useAskAi } from '@/modules/teacher/hooks/useAskAi';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { AskAiStrings } from '@/modules/teacher/types/ask-ai.types';
import type { ClassAskAiDrawerProps } from '@/modules/teacher/types/results-shell.types';

const CLASS_TARGET = { scope: 'class' as const };

// The class scope of the shared drawer (design S16, `Teacher Portal v2.dc.html:550–596`),
// mounted once by the class detail and opened by the header's Ask AI button through the
// overlays store (TB-31). Questions go to C-TA-1 with `scope: 'class'`, so an answer is
// the live model's, grounded in this class's own results; when fewer students have a
// current result than are on the roster, the design's partial-cohort sentence is printed
// under the answer from the SAME counts the answer was built on.
function ClassAskAiDrawer({ classCard }: ClassAskAiDrawerProps) {
  const t = useTranslations('TeacherPortal.askAi');
  const open = useClassOverlaysStore((state) => state.askAiOpen && state.askAiTarget.scope === 'class');
  const close = useClassOverlaysStore((state) => state.close);
  const ask = useAskAi(CLASS_TARGET, classCard.class_document_id);

  useEffect(() => close, [close]);

  const strings: AskAiStrings = {
    title: t('class.title', { name: classCard.name }),
    grounded: t('class.grounded', { name: classCard.name }),
    intro: t('class.intro', { name: classCard.name }),
    placeholder: t('class.placeholder'),
    groundingNote: (grounding) =>
      grounding.scored < grounding.total
        ? t('class.partialCohort', { scored: grounding.scored, total: grounding.total })
        : t('class.grounding', { scored: grounding.scored, total: grounding.total, sittings: grounding.sittings }),
    suggestions: CLASS_ASK_SUGGESTIONS.map((key) => ({
      key,
      label: t(`class.suggest.${key}`),
      question: t(`class.suggest.${key}`),
    })),
  };

  return <AskAiDrawer open={open} onClose={close} strings={strings} ask={ask} />;
}

export { ClassAskAiDrawer };
