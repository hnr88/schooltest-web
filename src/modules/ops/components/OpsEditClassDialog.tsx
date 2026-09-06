'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
  Skeleton,
} from '@/modules/design-system';
import { opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';
import { useOpsUpdateClassMutation } from '@/modules/ops/queries/use-ops-update-class.mutation';

import type { OpsClassTeacherOption } from '@/modules/ops/lib/ops-class-detail.helpers';
import type { OpsEditClassDialogProps } from '@/modules/ops/types/components.types';

// Ops class edit-assign modal: rename the class and reassign its teacher in
// ONE dropdown (the ops class inner page's "Edit class" + "Assign teacher"
// actions share this form — both write the same C-8 update). The teacher list
// is the ops-scoped staff directory for the class's school. The teacher and
// class are both addressed by documentId and wrapped in the Strapi `data` body
// the running API requires.
export function OpsEditClassDialog({
  classDocumentId,
  schoolDocumentId,
  className,
  currentYearBand,
  currentTeacherDocumentId,
  onClose,
}: OpsEditClassDialogProps) {
  const t = useTranslations('Ops.classDetail.edit');
  const teachersQuery = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
  const mutation = useOpsUpdateClassMutation();
  const [name, setName] = useState(className);
  const [teacherDocumentId, setTeacherDocumentId] = useState(
    currentTeacherDocumentId ?? '',
  );

  const teacherOptions: OpsClassTeacherOption[] = (teachersQuery.data?.data ?? []).map((teacher) => ({
    documentId: teacher.documentId,
    label: opsTeacherLabel(teacher),
  }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate(
      {
        classDocumentId,
        name: name.trim(),
        yearBand: currentYearBand,
        teacher: teacherDocumentId === '' ? null : teacherDocumentId,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !mutation.isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {teachersQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : teachersQuery.isError ? (
          <Alert variant="error" title={t('loadError')}>
            {t('loadErrorDescription')}
          </Alert>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <FieldShell id="ops-edit-class-name" label={t('nameLabel')} required>
              <Input
                id="ops-edit-class-name"
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FieldShell>
            <FieldShell id="ops-edit-class-teacher" label={t('teacherLabel')}>
              <NativeSelect
                id="ops-edit-class-teacher"
                className="w-full"
                value={teacherDocumentId}
                onChange={(event) => setTeacherDocumentId(event.target.value)}
              >
                <NativeSelectOption value="">{t('teacherUnassigned')}</NativeSelectOption>
                {teacherOptions.map((option) => (
                  <NativeSelectOption key={option.documentId} value={option.documentId}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldShell>
            <DialogFooter>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" size="lg" loading={mutation.isPending} disabled={!name.trim()}>
                {mutation.isPending ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
