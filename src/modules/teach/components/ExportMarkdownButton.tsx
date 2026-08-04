'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { downloadClassExportMarkdown } from '@/modules/teach/lib/download-export';

import type { ExportMarkdownButtonProps } from '@/modules/teach/types/components.types';

// C-RPT-03 export affordance (task 77, mvp spec 4.10): a visible button on the
// results page that downloads the class markdown export, ready to paste into
// the teacher's own AI assistant (Gemini, ChatGPT, Claude). All fetching lives
// in the module lib (no raw axios in components); this component only holds
// the pending/error UI state.
export function ExportMarkdownButton({ classId }: ExportMarkdownButtonProps) {
  const t = useTranslations('Teach.diagnostic.export');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleExport() {
    setPending(true);
    setFailed(false);
    try {
      await downloadClassExportMarkdown(classId);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div data-slot="export-markdown" className="flex flex-col gap-1">
      <Button variant="outline" loading={pending} onClick={handleExport}>
        {pending ? t('downloading') : t('cta')}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('error')}
        </p>
      ) : null}
    </div>
  );
}
