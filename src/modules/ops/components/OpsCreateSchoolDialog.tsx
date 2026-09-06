'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsCreateSchoolFields } from '@/modules/ops/components/OpsCreateSchoolFields';
import { useSchoolCreateForm } from '@/modules/ops/hooks/use-school-create-form';
import { useResendInvitationMutation } from '@/modules/ops/queries/use-resend-invitation.mutation';

/**
 * OPS-013 Create School modal. Self-contained: the schools list page mounts
 * one element, the dialog owns its own trigger, open state and Idempotency-Key
 * lifecycle. The callout text is verbatim from the visual reference; the
 * create it promises (owner invitation on creation) is enforced by the
 * mutation always sending `send_owner_invitation: true`. `noValidate` hands
 * validation to Zod so the messages are ours and localised.
 *
 * Task 10 — the onboarding_delivery partial outcome: a failed invitation keeps
 * the dialog open with the school id and offers the resend (which re-runs ONLY
 * the invitation, via the existing C-SCH-05 endpoint) — the school is never
 * recreated and the copy never claims "invitation sent". A dirty close
 * confirms through OpsConfirmDialog, so entered values survive a stray click.
 */
export function OpsCreateSchoolDialog() {
  const t = useTranslations('Ops.createSchool');
  const [open, setOpen] = useState(false);
  const [confirmingDirtyClose, setConfirmingDirtyClose] = useState(false);
  const {
    form,
    submit,
    reset,
    isPending,
    deliveryState,
    deliverySchoolDocumentId,
    setDeliveryState,
  } = useSchoolCreateForm({
    onDone: () => setOpen(false),
  });
  const resend = useResendInvitationMutation();
  const { errors, isDirty } = form.formState;

  const close = (next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    if (isDirty) {
      setConfirmingDirtyClose(true);
      return;
    }
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button data-testid="ops-create-school" onClick={() => setOpen(true)}>
        {t('button')}
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent data-slot="ops-create-school-dialog">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit(event);
            }}
          >
            <p className="text-sm text-muted-foreground">{t('callout')}</p>
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive" data-testid="ops-school-form-root-error">
                {errors.root.message}
              </p>
            ) : null}
            {deliveryState === 'failed' ? (
              <div className="rounded-lg border border-border bg-muted p-3" data-testid="ops-school-delivery-failed">
                <p className="text-sm text-body">{t('deliveryFailed')}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={resend.isPending}
                  onClick={() => resend.mutate(deliverySchoolDocumentId ?? '')}
                >
                  {t('resendInvitation')}
                </Button>
              </div>
            ) : null}
            <OpsCreateSchoolFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <OpsConfirmDialog
        open={confirmingDirtyClose}
        onOpenChange={(next) => setConfirmingDirtyClose(next)}
        title={t('dirtyCloseTitle')}
        description={t('dirtyCloseDescription')}
        confirmLabel={t('dirtyCloseConfirm')}
        cancelLabel={t('dirtyCloseCancel')}
        onConfirm={() => {
          setConfirmingDirtyClose(false);
          setDeliveryState(null);
          reset();
          setOpen(false);
        }}
      />
    </>
  );
}
