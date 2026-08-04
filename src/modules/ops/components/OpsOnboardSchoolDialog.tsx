'use client';

import { useTranslations } from 'next-intl';

import {
  Button,
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

interface OpsOnboardSchoolDialogProps {
  schoolDocumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
              <Input id="onboard-first-name" autoComplete="off" {...form.register('first_name')} />
            </FieldShell>
            <FieldShell
              id="onboard-last-name"
              label={t('lastName')}
              errorText={errors.last_name?.message}
              required
            >
              <Input id="onboard-last-name" autoComplete="off" {...form.register('last_name')} />
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
