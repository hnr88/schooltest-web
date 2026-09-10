'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import { deidentify } from '@/modules/results/lib/deidentify';

/**
 * §4.8 — the generated commentary block. `paragraphs` arrive from the wiring
 * layer (LLM response or the gated-fields fallback — the component does not
 * know or care which); the copy button copies the DE-IDENTIFIED form (name →
 * "The student", the prototype's deidentify() port). The commentary is
 * screen-only affordance: `.print-hidden` keeps it off the printed report,
 * which §4.9 renders from the bundle instead.
 */
export function StudentCommentary({
  paragraphs,
  studentName,
  source,
}: {
  paragraphs: string[];
  studentName: string;
  source: 'llm' | 'fallback';
}) {
  const t = useTranslations('Results');
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(deidentify(paragraphs.join('\n\n'), studentName));
    setCopied(true);
  }, [paragraphs, studentName]);

  if (paragraphs.length === 0) return null;

  return (
    <section data-slot="student-commentary" data-source={source} aria-label={t('commentaryAria')} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
          {source === 'fallback' ? t('commentaryHeadingOffline') : t('commentaryHeading')}
        </h2>
        <button
          type="button"
          data-slot="commentary-copy"
          onClick={() => void copy()}
          className="print-hidden w-fit rounded-full border border-border px-3 py-1 text-caption font-semibold hover:bg-muted"
        >
          {copied ? t('copied') : t('copyDeidentified')}
        </button>
      </div>
      {paragraphs.map((paragraph, index) => (
        <p key={index} data-slot="commentary-paragraph" className="text-body-md text-pretty">{paragraph}</p>
      ))}
    </section>
  );
}
