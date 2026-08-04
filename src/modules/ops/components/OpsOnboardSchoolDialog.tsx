'use client';

import { useTranslations } from 'next-intl';

import {
  Button,
  describedBy,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Input,
} from '@/modules/design-system';
import { useOnboardSchoolForm } from '@/modules/ops/hooks/use-onboard-school-form';

import type { OpsOnboardSchoolDialogProps } from '@/modules/ops/types/components.types';

// C-SCH-04 (v2) — the spec's Onboard School modal: First name, Last name, Email
// address, all required, with "Send Invitation to Onboard" as the CTA. `noValidate`
// hands validation to Zod so the messages are ours and localised.
export function OpsOnboardSchoolDialog({
  schoolDocumentId,
  open,
  onOpenChange,
}: OpsOnboardSchoolDialogProps) {
  const t = useTranslations('Ops.onboard');
  const { form, submit, reset, isPending } = useOnboardSchoolForm({
    schoolDocumentId,
    onDone: () => onOpenChange(false),
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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent data-slot="ops-onboard-dialog">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell
              id="onboard-first-name"
              label={t('firstName')}
              errorText={errors.first_name?.message}
              required
            >
              <Input
                id="onboard-first-name"
                autoComplete="off"
                {...aria('onboard-first-name', errors.first_name?.message)}
                {...form.register('first_name')}
              />
            </FieldShell>
            <FieldShell
              id="onboard-last-name"
              label={t('lastName')}
              errorText={errors.last_name?.message}
              required
            >
              <Input
                id="onboard-last-name"
                autoComplete="off"
                {...aria('onboard-last-name', errors.last_name?.message)}
                {...form.register('last_name')}
              />
            </FieldShell>
          </div>
          <FieldShell
            id="onboard-email"
            label={t('email')}
            errorText={errors.contact_email?.message}
            required
          >
            <Input
              id="onboard-email"
              type="email"
              autoComplete="off"
              {...aria('onboard-email', errors.contact_email?.message)}
              {...form.register('contact_email')}
            />
          </FieldShell>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
