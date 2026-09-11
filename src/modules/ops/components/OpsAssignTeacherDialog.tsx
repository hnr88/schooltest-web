'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  Skeleton,
} from '@/modules/design-system';
import { showOpsToast } from '@/modules/ops/actions';
import { OpsTeacherPicker } from '@/modules/ops/components/OpsTeacherPicker';
import { opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  OpsAssignTeacherIneligibleError,
  useOpsAssignTeacherMutation,
} from '@/modules/ops/queries/use-ops-update-class.mutation';
import { teachersListSchoolKey, useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';

export interface OpsAssignTeacherDialogProps {
  schoolDocumentId: string;
  classDocumentId: string;
  className: string;
  currentTeacherDocumentId: string | null;
  onClose: () => void;
}

// Task 22 — the design's ASSIGN TEACHER MODAL (`Ops Portal.dc.html:704-743`),
// replacing task 20's inline NativeSelect (`Ops Portal.dc.html:435` draws the
// trigger as a fixed "Assign teacher" pill; the picker itself is
// `OpsTeacherPicker`, kept presentational per D-57 — this dialog owns the
// submit). Both refusals below are client-side and pre-flight (logic.md#v-
// assign, `:1770-1772`): no selection, and re-picking the current teacher,
// never reach the network.
export function OpsAssignTeacherDialog({
  schoolDocumentId,
  classDocumentId,
  className,
  currentTeacherDocumentId,
  onClose,
}: OpsAssignTeacherDialogProps) {
  const t = useTranslations('Ops.classDetail');
  const detailT = useTranslations('Ops.detail');
  const queryClient = useQueryClient();
  const teachersQuery = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const assign = useOpsAssignTeacherMutation(classDocumentId, schoolDocumentId);
  const [selectedDocumentId, setSelectedDocumentId] = useState(currentTeacherDocumentId);
  const [formError, setFormError] = useState<string | null>(null);

  const teachers = teachersQuery.data?.data ?? [];

  const submit = () => {
    if (selectedDocumentId === null) {
      setFormError(t('assign.errorNoSelection'));
      return;
    }
    const picked = teachers.find((teacher) => teacher.documentId === selectedDocumentId);
    const pickedName = picked ? opsTeacherLabel(picked) : '';
    if (selectedDocumentId === currentTeacherDocumentId) {
      setFormError(t('assign.errorAlreadyTeaches', { name: pickedName, className }));
      return;
    }
    setFormError(null);
    assign.mutate([selectedDocumentId], {
      onSuccess: () => {
        showOpsToast({ tone: 'ok', message: t('assign.successMessage', { name: pickedName, className }) });
        onClose();
      },
      onError: (error) => {
        if (error instanceof OpsAssignTeacherIneligibleError) {
          // A stale picker: the eligibility this list showed a moment ago no
          // longer holds. Refetch it and say so — never retry blind.
          void queryClient.invalidateQueries({ queryKey: teachersListSchoolKey(schoolDocumentId) });
          setFormError(t('assign.errorStalePicker'));
          return;
        }
        setFormError(t('assign.errorMessage', { className }));
      },
    });
  };

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next && !assign.isPending) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader
          title={t('assign.title')}
          sub={t('assign.description', { className })}
        />

        <OpsDialogBody className="py-5">
          {teachersQuery.isPending ? (
            <Skeleton className="h-40 w-full rounded-card" />
          ) : teachersQuery.isError ? (
            <Alert variant="error" title={t('edit.loadError')}>
              {t('edit.loadErrorDescription')}
            </Alert>
          ) : (
            <OpsTeacherPicker
              teachers={teachers}
              selectedDocumentId={selectedDocumentId}
              onSelect={setSelectedDocumentId}
              ariaLabel={t('classTeacher')}
              variant="assign"
            />
          )}
        </OpsDialogBody>

        <OpsDialogFooter error={formError}>
          <OpsDialogCancel
            type="button"
            onClick={onClose}
            disabled={assign.isPending}
          >
            {detailT('actions.cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            loading={assign.isPending}
            disabled={teachersQuery.isPending || teachersQuery.isError}
            onClick={submit}
          >
            {assign.isPending ? t('assign.assigning') : t('assign.cta')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
