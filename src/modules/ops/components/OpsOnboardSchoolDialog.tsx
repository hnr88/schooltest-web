'use client';

import { useTranslations } from 'next-intl';

import {
  describedBy,
  Input,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
} from '@/modules/design-system';
import { useOnboardSchoolForm } from '@/modules/ops/hooks/use-onboard-school-form';

import type { OpsOnboardSchoolDialogProps } from '@/modules/ops/types/components.types';

// Shared school-admin invitation modal: first name, last name and email address
// are required. `noValidate` hands validation to Zod so the messages are ours
// and localised.
export function OpsOnboardSchoolDialog({
  schoolDocumentId,
  mode,
  open,
  onOpenChange,
  onInvited,
}: OpsOnboardSchoolDialogProps) {
  const t = useTranslations('Ops.onboard');
  const { form, submit, reset, isPending } = useOnboardSchoolForm({
    schoolDocumentId,
    mode,
    onDone: (email) => {
      onInvited?.(email);
      onOpenChange(false);
    },
  });
  const { errors } = form.formState;

  // FieldShell renders the error paragraph but leaves the wiring to the
  // consumer, so each control carries its own aria-describedby + aria-invalid.
  const aria = (id: string, error?: string) => ({
    'aria-describedby': describedBy(id, undefined, error),
    'aria-invalid': error ? true : undefined,
  });

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <OpsDialog open={open} onOpenChange={close}>
      <OpsDialogContent data-slot="ops-onboard-dialog" className="sm:max-w-[540px]">
        <OpsDialogHeader title={t('dialogTitle')} sub={t('dialogDescription')} />
        <form onSubmit={submit} noValidate>
          <OpsDialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OpsFieldShell
                id="onboard-first-name"
                label={t('firstName')}
                errorText={errors.first_name?.message}
                required
              >
                <Input
                  id="onboard-first-name"
                  autoComplete="off"
                  className={`h-12 rounded-xl ${OPS_CONTROL_CLASS}`}
                  {...aria('onboard-first-name', errors.first_name?.message)}
                  {...form.register('first_name')}
                />
              </OpsFieldShell>
              <OpsFieldShell
                id="onboard-last-name"
                label={t('lastName')}
                errorText={errors.last_name?.message}
                required
              >
                <Input
                  id="onboard-last-name"
                  autoComplete="off"
                  className={`h-12 rounded-xl ${OPS_CONTROL_CLASS}`}
                  {...aria('onboard-last-name', errors.last_name?.message)}
                  {...form.register('last_name')}
                />
              </OpsFieldShell>
            </div>
            <OpsFieldShell
              id="onboard-email"
              label={t('email')}
              errorText={errors.contact_email?.message}
              required
            >
              <Input
                id="onboard-email"
                type="email"
                autoComplete="off"
                className={`h-12 rounded-xl ${OPS_CONTROL_CLASS}`}
                {...aria('onboard-email', errors.contact_email?.message)}
                {...form.register('contact_email')}
              />
            </OpsFieldShell>
          </OpsDialogBody>
          <OpsDialogFooter>
            <OpsDialogCancel
              type="button"
              onClick={() => close(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </OpsDialogCancel>
            <OpsDialogCta type="submit" loading={isPending}>
              {isPending ? t('submitting') : t('submit')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
