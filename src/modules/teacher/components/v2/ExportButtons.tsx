'use client';

import { Download, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';

import { cn } from '@/lib/utils';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import type { ExportButtonsProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/** The only outline buttons whose hover also tints the face (`:200`, `:705`). */
const EXPORT_HOVER = 'hover:bg-[#FAFBFC]';

/**
 * Teacher Portal v2 — the PDF / LLM export pair (`Teacher Portal
 * v2.dc.html:200–205`, `:283`): two 32px outline buttons, download-tray and
 * document icons. The rows behind them are clickable, so each click stops at
 * its button. `data-export` names the button for specs.
 */
function ExportButtons({
  onPdf,
  onLlm,
  pdfTitle,
  llmTitle,
  pdfPending = false,
  llmPending = false,
  disabled = false,
  className,
}: ExportButtonsProps) {
  const t = useTranslations('TeacherPortal.kit');
  const run = (action: () => void) => (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    action();
  };

  return (
    <span
      data-slot="export-buttons"
      className={cn('relative z-10 flex items-center justify-end gap-2', className)}
    >
      <TeacherButton
        tone="outline"
        size="xs"
        className={EXPORT_HOVER}
        data-export="pdf"
        title={pdfTitle}
        loading={pdfPending}
        disabled={disabled}
        onClick={run(onPdf)}
      >
        {pdfPending ? null : <Download aria-hidden="true" className="size-3.5" strokeWidth={2} />}
        {t('pdf')}
      </TeacherButton>
      <TeacherButton
        tone="outline"
        size="xs"
        className={EXPORT_HOVER}
        data-export="llm"
        title={llmTitle}
        loading={llmPending}
        disabled={disabled}
        onClick={run(onLlm)}
      >
        {llmPending ? null : <FileText aria-hidden="true" className="size-3.5" strokeWidth={1.9} />}
        {t('llm')}
      </TeacherButton>
    </span>
  );
}

export { ExportButtons };
