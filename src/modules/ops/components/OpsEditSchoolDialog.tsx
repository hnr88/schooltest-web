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
import { OpsEditSchoolFields } from '@/modules/ops/components/OpsCreateSchoolFields';
import { useSchoolEditForm } from '@/modules/ops/hooks/use-school-edit-form';

import type { OpsEditSchoolDialogProps } from '@/modules/ops/types/school-create.types';

/**
 * Task 10 — the EDIT half of the school form: the SAME modal surface as the
 * create dialog, driven by the loaded school draft. The versioned PATCH carries
 * `If-Match` quoting the updatedAt the page loaded; a STALE version is
 * surfaced as a real user-visible state on the form root — the draft stays in
 * the form, nothing retries silently, and nothing reports success on a 412.
 * The dirty close confirms, so the operator decides what to carry over after
 * reloading the detail.
 */
export function OpsEditSchoolDialog({ school, onDone }: OpsEditSchoolDialogProps) {
  const t = useTranslations('Ops.createSchool');
  const [confirmingDirtyClose, setConfirmingDirtyClose] = useState(false);
  const { form, submit, isPending, emailDomainWarning } = useSchoolEditForm({
    school,
    onDone,
  });
  const { errors, isDirty } = form.formState;

  const close = (next: boolean) => {
    if (next) return;
    if (isDirty) {
      setConfirmingDirtyClose(true);
      return;
    }
    onDone();
  };

  return (
    <>
      <Dialog open onOpenChange={close}>
        <DialogContent data-slot="ops-edit-school-dialog">
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
            <DialogDescription>
              {t('editDescription', { name: school.name })}
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit(event);
            }}
          >
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive" data-testid="ops-edit-school-root-error">
                {errors.root.message}
              </p>
            ) : null}
            <p className="text-sm text-body">
              {t('editVersionNote', { version: school.updatedAt })}
            </p>
            <OpsEditSchoolFields form={form} emailWarning={emailDomainWarning} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {isPending ? t('submitting') : t('save')}
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
          onDone();
        }}
      />
    </>
  );
}
