'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import {
  OpsDialog,
  OpsDialogBody,
  OpsDialogContent,
  OpsDialogHeader,
} from '@/modules/design-system';
import { showOpsToast } from '@/modules/ops/actions';
import { OpsStudentImport } from '@/modules/ops/components/OpsStudentImport';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';

import type { OpsStudentImportDialogProps } from '@/modules/ops/types/import.types';

/**
 * ops/26 (`:744-817` IMPORT STUDENTS MODAL) — the Dialog wrapper the design
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
    <OpsDialog open={open} onOpenChange={handleOpenChange}>
      <OpsDialogContent data-slot="ops-student-import-dialog" className="sm:max-w-[560px]">
        <OpsDialogHeader
          title={t('title')}
          sub={
            school.data?.name
              ? t('descriptionForSchool', { name: school.data.name })
              : t('description')
          }
        />
        <OpsDialogBody className="gap-0 px-0 py-0">
          <OpsStudentImport
            documentId={schoolDocumentId}
            initialClassDocumentId={initialClassDocumentId}
            onBusyChange={(busy) => {
              busyRef.current = busy;
            }}
            hideHeader
            onCancel={() => handleOpenChange(false)}
          />
        </OpsDialogBody>
      </OpsDialogContent>
    </OpsDialog>
  );
}
