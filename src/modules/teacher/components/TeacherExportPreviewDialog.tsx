'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';

import type { TeacherExportPreviewDialogProps } from '@/modules/teacher/types/teacher-export.types';

function TeacherExportPreviewDialog({
  file,
  prompt,
  actionError,
  onClose,
  onCopyPromptAndDownload,
}: TeacherExportPreviewDialogProps) {
  const t = useTranslations('Teacher.results.export');

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        data-slot="teacher-export-preview"
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="relative border-b border-divider px-5 py-5 pr-14 sm:px-7">
          <DialogTitle className="text-panel-title font-semibold">{t('previewTitle')}</DialogTitle>
          <DialogDescription>{t('previewDescription')}</DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('closePreview')}
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </DialogHeader>
        <div className="scroll-region flex min-h-0 flex-col gap-3 px-5 py-5 sm:px-7">
          <p className="text-meta font-semibold text-foreground">{t('previewPromptLabel')}</p>
          <pre
            data-slot="teacher-export-prompt"
            className="max-h-[50dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-divider bg-surface-inset p-4 font-sans text-meta leading-relaxed text-body"
          >
            {prompt}
          </pre>
          {file ? (
            <p className="text-meta text-muted-foreground">
              {t('previewFilename', { filename: file.filename })}
            </p>
          ) : null}
          {actionError ? (
            <p role="alert" className="text-meta font-medium text-danger-strong">
              {t(actionError === 'copy' ? 'copyFailed' : 'downloadFailed')}
            </p>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            {t('cancelPreview')}
          </Button>
          <Button
            type="button"
            size="lg"
            data-slot="teacher-export-copy-download"
            onClick={onCopyPromptAndDownload}
          >
            {t('copyPromptAndDownload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TeacherExportPreviewDialog };
