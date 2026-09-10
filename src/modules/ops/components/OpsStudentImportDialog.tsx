'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { showOpsToast } from '@/modules/ops/actions';
import { OpsStudentImport } from '@/modules/ops/components/OpsStudentImport';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';

import type { OpsStudentImportDialogProps } from '@/modules/ops/types/import.types';

/**
 * ops/26 (`:745-817` IMPORT STUDENTS MODAL) — the Dialog wrapper the design
 * draws around the existing import surface (`retire-ledger.md#r-21`'s
 * RE-PARENT half). `OpsStudentImport` keeps every card, guard and mutation;
 * this file supplies only what the design adds on top of the panel that
 * already worked: the modal chrome, and `closeModal`'s busy refusal (`:1247`
 * — "Still saving — hold on", never abandoning a commit in flight).
 *
 * Two callers: the Students tab's primary button opens this with no class
 * pre-selected (task 18); the class page's "Add students"/"Import students"
 * opens it with `initialClassDocumentId` already set (task 21). Both entry
 * points are OUTSIDE this task's Touches — see proof/26.md.
 */
export function OpsStudentImportDialog({
  schoolDocumentId,
  open,
  onOpenChange,
  initialClassDocumentId,
}: OpsStudentImportDialogProps) {
  const t = useTranslations('Ops.import');
  // Read-only reuse of the same cache key `OpsSchoolDetail.tsx` already
  // populates — no second fetch when the school is already on screen.
  const school = useSchoolDetailQuery(schoolDocumentId, open);
  // A ref, not state: `handleOpenChange` only ever needs the LATEST value at
  // the moment of a close attempt, never a re-render when it changes.
  const busyRef = useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && busyRef.current) {
      showOpsToast({ tone: 'warn', message: t('closeBlockedToast') });
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="ops-student-import-dialog" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {school.data?.name
              ? t('descriptionForSchool', { name: school.data.name })
              : t('description')}
          </DialogDescription>
        </DialogHeader>
        <OpsStudentImport
          documentId={schoolDocumentId}
          initialClassDocumentId={initialClassDocumentId}
          onBusyChange={(busy) => {
            busyRef.current = busy;
          }}
          hideHeader
        />
      </DialogContent>
    </Dialog>
  );
}
