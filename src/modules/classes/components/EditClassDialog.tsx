'use client';

import { useTranslations } from 'next-intl';

import { useEditClassForm } from '@/modules/classes/hooks/use-edit-class-form';
import { teacherLabel } from '@/modules/classes/lib/class-form.helpers';
import {
  Alert,
  Input,
  NativeSelect,
  NativeSelectOption,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
  Skeleton,
} from '@/modules/design-system';
import { useTeachersQuery } from '@/modules/teachers';

import type { EditClassDialogProps } from '@/modules/classes/types/components.types';

// The design's 48px modal select; NativeSelect renders its classes on the
// wrapper, so the control itself is reached with a descendant variant.
const NATIVE_SELECT_CLASS =
  'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-[1.5px] [&_select]:border-[#D8DFEA] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-[#0E2350] [&_select]:outline-none [&_select]:focus-visible:border-[#2563EB] [&_select]:focus-visible:ring-0';

// Spec §1 Edit Class modal: rename the class and reassign its teacher through a
// SINGLE dropdown — one teacher per class for MVP. This replaces the old
// checkbox-based assignment panel; the roster is not edited here.
export function EditClassDialog({ schoolClass, onClose }: EditClassDialogProps) {
  const t = useTranslations('Classes.detail.edit');
  const teachersQuery = useTeachersQuery(true);
  const { form, submit, pending } = useEditClassForm(schoolClass, onClose);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[520px]">
        <OpsDialogHeader title={t('title')} sub={t('description')} />
        {teachersQuery.isPending ? (
          <OpsDialogBody>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </OpsDialogBody>
        ) : teachersQuery.isError ? (
          <OpsDialogBody>
            <Alert variant="error" title={t('loadError')}>
              {t('loadErrorDescription')}
            </Alert>
          </OpsDialogBody>
        ) : (
          <form onSubmit={submit} noValidate>
            <OpsDialogBody>
              <OpsFieldShell
                id="edit-class-name"
                label={t('nameLabel')}
                errorText={errors.name?.message}
                required
              >
                <Input
                  id="edit-class-name"
                  autoComplete="off"
                  className={OPS_CONTROL_CLASS}
                  {...register('name')}
                />
              </OpsFieldShell>
              <OpsFieldShell id="edit-class-teacher" label={t('teacherLabel')}>
                <NativeSelect
                  id="edit-class-teacher"
                  className={NATIVE_SELECT_CLASS}
                  {...register('teacher_documentId')}
                >
                  <NativeSelectOption value="">{t('teacherUnassigned')}</NativeSelectOption>
                  {(teachersQuery.data ?? []).map((teacher) => (
                    <NativeSelectOption key={teacher.documentId} value={teacher.documentId}>
                      {teacherLabel(teacher)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </OpsFieldShell>
            </OpsDialogBody>
            <OpsDialogFooter>
              <OpsDialogCancel type="button" onClick={onClose} disabled={pending}>
                {t('cancel')}
              </OpsDialogCancel>
              <OpsDialogCta type="submit" loading={pending}>
                {pending ? t('saving') : t('save')}
              </OpsDialogCta>
            </OpsDialogFooter>
          </form>
        )}
      </OpsDialogContent>
    </OpsDialog>
  );
}
