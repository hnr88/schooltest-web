'use client';

import { useTranslations } from 'next-intl';

import {
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
} from '@/modules/design-system';
import { useStudentImport } from '@/modules/school-students/hooks/use-student-import';
import { StudentImportFields, StudentImportRejectList } from '@/modules/student-import';

import type { StudentImportDialogProps } from '@/modules/school-students/types/components.types';

// Spec §4 "Import students": the shared CSV flow with the class selector shown,
// so the admin picks the class every parsed row is created into. Row counts come
// from the parser, never from a guess about what the file contained, and the
// rows that could not be imported are named ONE BY ONE under them. Modal chrome
// on the OpsDialog kit (School Admin design: import modal, 560px).
export function StudentImportDialog({ classes, onClose }: StudentImportDialogProps) {
  const t = useTranslations('SchoolStudents.import');
  const importState = useStudentImport(onClose);

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[560px]">
        <OpsDialogHeader title={t('title')} sub={t('description')} />
        <OpsDialogBody>
          <StudentImportFields
            classes={classes}
            classId={importState.classId}
            onClassChange={importState.setClassId}
            onChange={importState.setParsed}
          />
          <p className="text-meta text-body">
            {t('readyCount', { count: importState.parsed.rows.length })}
          </p>
          {/* The count line is gone: the list below names the same rows AND says
              which line each one is, so the two together only said it twice. */}
          <StudentImportRejectList
            parseErrors={importState.parsed.errors}
            serverRejects={importState.rejects}
          />
        </OpsDialogBody>
        <OpsDialogFooter>
          <OpsDialogCancel type="button" onClick={onClose} disabled={importState.pending}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            loading={importState.pending}
            disabled={!importState.canSubmit}
            onClick={() => void importState.submit()}
          >
            {importState.pending ? t('submitting') : t('submit')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
