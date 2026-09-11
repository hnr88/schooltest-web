'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Info } from 'lucide-react';

import { Button } from '@/modules/design-system';
import {
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
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
    emailDomainWarning,
    statusActiveWarning,
    fieldErrorCount,
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

  const footerError =
    deliveryState === 'failed' ? (
      <span data-testid="ops-school-delivery-failed">{t('deliveryFailed')}</span>
    ) : errors.root?.message ? (
      <span data-testid="ops-school-form-root-error">{errors.root.message}</span>
    ) : fieldErrorCount > 0 ? (
      <span data-testid="ops-school-form-summary">{t('formSummary', { count: fieldErrorCount })}</span>
    ) : null;

  return (
    <>
      <Button
        data-testid="ops-create-school"
        className="h-11 rounded-full px-[22px]"
        onClick={() => setOpen(true)}
      >
        {t('button')}
      </Button>
      <OpsDialog open={open} onOpenChange={close}>
        <OpsDialogContent data-slot="ops-create-school-dialog" className="sm:max-w-[640px]">
          <OpsDialogHeader title={t('title')} sub={t('description')} />
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submit(event);
            }}
          >
            <OpsDialogBody>
              <OpsCreateSchoolFields
                form={form}
                emailWarning={emailDomainWarning}
                statusWarning={statusActiveWarning}
              />
              <div className="flex items-start gap-[11px] rounded-[14px] bg-[#F4F6FA] px-4 py-3.5 text-[13px] leading-relaxed text-[#3D4A5C]">
                <Info aria-hidden="true" className="mt-0.5 size-4 flex-none text-[#2563EB]" />
                <p>{t('callout')}</p>
              </div>
              {deliveryState === 'failed' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#F3C6C1] bg-white px-4 py-3">
                  <p className="text-[13px] text-[#B42318]">{t('deliveryFailed')}</p>
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
            </OpsDialogBody>
            <OpsDialogFooter error={footerError}>
              <OpsDialogCancel type="button" onClick={() => close(false)}>
                {t('cancel')}
              </OpsDialogCancel>
              <OpsDialogCta type="submit" loading={isPending}>
                {isPending ? t('submitting') : t('submit')}
              </OpsDialogCta>
            </OpsDialogFooter>
          </form>
        </OpsDialogContent>
      </OpsDialog>
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
