'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { useTeacherExportDownload } from '@/modules/teacher/hooks/useTeacherExportDownload';
import type { TeacherExportButtonProps } from '@/modules/teacher/types/teacher-export.types';

// The ONE button behind all three AI exports (.qa/DESIGN.md §Teaching insights 3,
// §Progress tab export panel, §Student drill-down header). It owns no document: it
// asks the shared hook to fetch C-TR-5/6/7 and hands the SERVER's Markdown and the
// SERVER's filename to the browser's download machinery.
//
// A refusal is stated in TEXT, never swallowed and never turned into a partial
// file: on error the button stays enabled and an adjacent `role="alert"` line says
// the export did not download.
function TeacherExportButton({ request, label, variant = 'default' }: TeacherExportButtonProps) {
  const t = useTranslations('Teacher.results.export');
  const download = useTeacherExportDownload(request);

  return (
    <div data-slot="teacher-export-action" className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={variant}
        // `lg` in BOTH variants, never `default`: measured in Chromium, the
        // default size lays out 40px tall and WCAG 2.2 AA 2.5.8 wants 44px.
        size="lg"
        loading={download.isPending}
        onClick={download.start}
        data-export-kind={request.kind}
      >
        {download.isPending ? null : <Download aria-hidden="true" className="size-4" />}
        {download.isPending ? t('pending') : label}
      </Button>

      {download.isError ? (
        <p role="alert" data-slot="teacher-export-error" className="text-meta text-danger-strong">
          {t('failed')}
        </p>
      ) : null}
    </div>
  );
}

export { TeacherExportButton };
