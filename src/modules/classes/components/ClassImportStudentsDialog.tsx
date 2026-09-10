'use client';

import { useTranslations } from 'next-intl';

import { useClassStudentImport } from '@/modules/classes/hooks/use-class-student-import';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { StudentImportFields, StudentImportRejectList } from '@/modules/student-import';

import type { ClassImportStudentsDialogProps } from '@/modules/classes/types/components.types';

// Spec §1 "Import students": the SAME shared CSV flow the Students page and the
// Add-class modal use (template link, drop zone, paste box). The target class is
// fixed to the class being viewed, so the class selector is not rendered. Row
// counts come from the parser, never from a guess about the file's contents.
//
// Rows that cannot be imported are named ONE BY ONE under the counts — the
// parser's own errors before a submit, the server's refused rows after one —
// because the good rows of the same file are imported and these lines are the
// only thing left to act on.
export function ClassImportStudentsDialog({
  classDocumentId,
  className,
  onClose,
}: ClassImportStudentsDialogProps) {
  const t = useTranslations('Classes.detail.import');
  const importState = useClassStudentImport(classDocumentId, onClose);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: className })}</DialogDescription>
        </DialogHeader>
        <StudentImportFields onChange={importState.setParsed} />
        <p className="text-meta text-body">
          {t('readyCount', { count: importState.parsed.rows.length })}
        </p>
        {/* The count line is gone: the list below names the same rows AND says
            which line each one is, so the two together only said it twice. */}
        <StudentImportRejectList
          parseErrors={importState.parsed.errors}
          serverRejects={importState.rejects}
        />
        <DialogFooter>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onClose}
            disabled={importState.pending}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            size="lg"
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
