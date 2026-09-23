'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import { useAddClassForm } from '@/modules/classes/hooks/use-add-class-form';
import { teacherPickOptions } from '@/modules/classes/lib/class-teacher-picker';
import {
  Input,
  MissingDependencyNotice,
  OPS_CONTROL_CLASS,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogCta,
  OpsDialogFooter,
  OpsFieldShell,
  SelectField,
} from '@/modules/design-system';

import type { AddClassFormProps } from '@/modules/classes/types/components.types';

// The spec §2 add-class body (P-03): name + teacher picker + summary, and
// nothing else — the CSV import block left this modal, so there is exactly ONE
// import flow (the shared dialog) and ONE engine behind it. Students join the
// new class through the class-detail or Students-page import dialog.
export function AddClassForm({ teachers, invitations, onClose }: AddClassFormProps) {
  const t = useTranslations('Classes.addForm');
  const tp = useTranslations('Classes.teacherPicker');
  const options = teacherPickOptions(teachers, invitations, (name) => tp('pendingOption', { name }));
  const { form, submit, pending } = useAddClassForm(onClose);
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate>
      <OpsDialogBody>
        {/* pixel-audit 2026-09-11 — the design's class modal stacks the name
            field full-width above the teacher control (class modal :906),
            not side by side. */}
        <div className="flex flex-col gap-4">
          <OpsFieldShell id="add-class-name" label={t('name')} errorText={errors.name?.message} required>
            <Input
              id="add-class-name"
              autoComplete="off"
              placeholder={t('namePlaceholder')}
              className={OPS_CONTROL_CLASS}
              {...register('name')}
            />
          </OpsFieldShell>
          <Controller
            control={control}
            name="teacher_documentId"
            render={({ field }) =>
              /* Defensive only — the dialog refuses to mount this form without
                 an eligible teacher. If it is ever reached empty, the blocking
                 refusal renders instead of an empty select. */
              options.length === 0 ? (
                <MissingDependencyNotice kind="assignableTeachers" ctaHref="/dashboard/school/teachers" />
              ) : (
                <SelectField
                  id="add-class-teacher"
                  label={t('teacher')}
                  placeholder={t('teacherPlaceholder')}
                  options={options}
                  value={field.value}
                  onValueChange={field.onChange}
                  triggerClassName={OPS_CONTROL_CLASS}
                />
              )
            }
          />
        </div>
      </OpsDialogBody>
      <OpsDialogFooter>
        <OpsDialogCancel type="button" onClick={onClose} disabled={pending}>
          {t('cancel')}
        </OpsDialogCancel>
        {/* Defensive: the dialog gates creation on eligible teachers before
            this form mounts, so a teacherless render must never submit. */}
        <OpsDialogCta type="submit" loading={pending} disabled={options.length === 0}>
          {pending ? t('submitting') : t('submit')}
        </OpsDialogCta>
      </OpsDialogFooter>
    </form>
  );
}
