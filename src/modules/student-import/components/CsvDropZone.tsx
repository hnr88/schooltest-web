'use client';

import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { STUDENT_IMPORT_FILE_ACCEPT } from '@/modules/student-import/constants/student-import.constants';
import type { CsvDropZoneProps } from '@/modules/student-import/types/components.types';

// Spec §2 file upload area: a dashed drop target that is itself the browse
// control, so the zone is one keyboard-reachable button rather than a div with
// a nested link. Plain drag handlers — no dropzone dependency.
export function CsvDropZone({
  inputRef,
  isDragging,
  onBrowse,
  onFileInput,
  onDragOver,
  onDragLeave,
  onDrop,
}: CsvDropZoneProps) {
  const t = useTranslations('StudentImport');

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onBrowse}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-dragging={isDragging || undefined}
        className="group flex flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-input bg-surface-inset px-6 py-6 text-center transition-colors duration-200 ease-out hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[dragging]:border-primary data-[dragging]:bg-blue-50"
      >
        <Upload
          aria-hidden="true"
          strokeWidth={1.8}
          className="size-6 text-muted-foreground transition-colors duration-200 ease-out group-hover:text-primary"
        />
        <span className="text-body-md text-body">
          {t('dropPrompt')}{' '}
          <span className="font-semibold text-primary underline-offset-4 group-hover:underline">
            {t('browse')}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={STUDENT_IMPORT_FILE_ACCEPT}
        aria-label={t('fileInputLabel')}
        onChange={onFileInput}
        className="hidden"
      />
    </div>
  );
}
