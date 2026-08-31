'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/modules/design-system';
import { TeacherExportPreviewDialog } from '@/modules/teacher/components/TeacherExportPreviewDialog';
import { useTeacherExportPreview } from '@/modules/teacher/hooks/useTeacherExportPreview';
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
  const preview = useTeacherExportPreview(request);

  const handleCopyPromptAndDownload = async () => {
    const result = await preview.copyPromptAndDownload();
    if (result === 'success') toast.success(t('copyDownloadSuccess'));
    if (result === 'copy_failed') toast.error(t('copyFailed'));
    if (result === 'download_failed') toast.error(t('downloadFailed'));
  };

  return (
    <div data-slot="teacher-export-action" className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={variant}
        // `lg` in BOTH variants, never `default`: measured in Chromium, the
        // default size lays out 40px tall and WCAG 2.2 AA 2.5.8 wants 44px.
        size="lg"
        loading={preview.isPending}
        onClick={preview.start}
        data-export-kind={request.kind}
      >
        {preview.isPending ? null : <Download aria-hidden="true" className="size-4" />}
        {preview.isPending ? t('pending') : label}
      </Button>

      {preview.isError ? (
        <p role="alert" data-slot="teacher-export-error" className="text-meta text-danger-strong">
          {t('failed')}
        </p>
      ) : null}
      <TeacherExportPreviewDialog
        file={preview.file}
        prompt={preview.prompt}
        actionError={preview.actionError}
        onClose={preview.close}
        onCopyPromptAndDownload={() => void handleCopyPromptAndDownload()}
      />
    </div>
  );
}

export { TeacherExportButton };
