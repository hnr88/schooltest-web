'use client';

import { Check, Copy, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { JoinCodeDisplayProps } from '@/modules/teacher/types/join-code.types';

// .qa/DESIGN.md §Test sessions (view 1), the code panel: the caption
// "Join code for <class> — <test>", the code VERY LARGE because the teacher
// reads it aloud to the room, the helper line, then Copy code + Go live.
//
// The code is C-TS-1's minted `READ-####` (DECISIONS.md A3) rendered verbatim —
// the brief's `TIGER-7A` is illustrative and nothing here formats, pads or
// invents a code. Both actions clear 44x44 (`size="lg"` is h-11) and the copy
// state is spelled out in words, never signalled by colour alone.
function JoinCodeDisplay({ view, isCopied, onCopy }: JoinCodeDisplayProps) {
  const t = useTranslations('Teacher.testSessions.joinCode');
  const caption = view.testLabel
    ? t('caption', { className: view.className, testLabel: view.testLabel })
    : t('captionClassOnly', { className: view.className });

  return (
    <section
      data-slot="join-code-panel"
      data-sitting-id={view.sittingDocumentId}
      data-join-code={view.code}
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <h2 className="text-panel-title font-bold text-balance text-foreground">{caption}</h2>

      <p className="rounded-tile bg-surface-inset px-4 py-6 text-center font-mono text-display font-bold break-all text-foreground select-all">
        {view.code}
      </p>

      <p className="text-body-sm text-muted-foreground">{t('helper')}</p>

      <div className="flex flex-wrap gap-3">
        <Button type="button" size="lg" variant="outline" className="rounded-lg" onClick={onCopy}>
          {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {isCopied ? t('copied') : t('copy')}
        </Button>
        <Button size="lg" className="rounded-lg" href={view.monitorHref}>
          <Radio aria-hidden="true" />
          {t('goLive')}
        </Button>
      </div>
    </section>
  );
}

export { JoinCodeDisplay };
