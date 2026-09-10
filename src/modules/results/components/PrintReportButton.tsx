'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

/**
 * §4.9 print — the browser prints the SAME bound fields the screen renders;
 * the shared print CSS pair (.print-hidden / .print-only in globals.css) takes
 * the interactive controls off paper. The document title carries the student
 * and the sitting date so the printed page identifies itself in a stack.
 */
export function PrintReportButton({ studentName, satAt }: { studentName: string; satAt: string | null }) {
  const t = useTranslations('Results');
  const handlePrint = useCallback(() => {
    const previous = document.title;
    document.title = t('printTitle', { student: studentName, date: satAt === null ? '' : ` — ${satAt}` });
    const restore = (): void => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  }, [studentName, satAt, t]);

  return (
    <button
      type="button"
      data-slot="print-report-button"
      onClick={handlePrint}
      className="print-hidden w-fit rounded-full border border-border px-3 py-1.5 text-caption font-semibold hover:bg-muted"
    >
      {t('printReport')}
    </button>
  );
}
