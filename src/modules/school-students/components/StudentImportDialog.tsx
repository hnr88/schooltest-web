'use client';

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
import { useStudentImport } from '@/modules/school-students/hooks/use-student-import';
import { StudentImportFields } from '@/modules/student-import';

import type { StudentImportDialogProps } from '@/modules/school-students/types/components.types';

// Spec §4 "Import students": the shared CSV flow with the class selector shown,
// so the admin picks the class every parsed row is created into. Row counts come
// from the parser, never from a guess about what the file contained.
export function StudentImportDialog({ classes, onClose }: StudentImportDialogProps) {
  const t = useTranslations('SchoolStudents.import');
  const importState = useStudentImport(onClose);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <StudentImportFields
          classes={classes}
          classId={importState.classId}
          onClassChange={importState.setClassId}
          onChange={importState.setParsed}
        />
        <p className="text-meta text-body">
          {t('readyCount', { count: importState.parsed.rows.length })}
        </p>
        {importState.parsed.errors.length > 0 ? (
          <p className="text-meta font-medium text-destructive">
            {t('errorCount', { count: importState.parsed.errors.length })}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={importState.pending}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="accent"
            loading={importState.pending}
            disabled={!importState.canSubmit}
            onClick={() => void importState.submit()}
          >
            {importState.pending ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
