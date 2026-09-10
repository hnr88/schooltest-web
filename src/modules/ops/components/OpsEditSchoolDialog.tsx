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
  SelectField,
} from '@/modules/design-system';
import { SCHOOL_PLAN_OPTIONS } from '@/modules/ops/constants/components.constants';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsEditSchoolFields } from '@/modules/ops/components/OpsCreateSchoolFields';
import { useSchoolEditForm } from '@/modules/ops/hooks/use-school-edit-form';
import { useSchoolPlan } from '@/modules/ops/hooks/use-school-plan';

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
  // Licence tier (`plan`, distinct from the form's `portal_plan` select above):
  // reuses the plan panel's own `Ops.plan` copy verbatim (D-33).
  const tPlan = useTranslations('Ops.plan');
  const [confirmingDirtyClose, setConfirmingDirtyClose] = useState(false);
  const { form, submit, isPending, emailDomainWarning, fieldErrorCount } = useSchoolEditForm({
    school,
    onDone,
  });
  const { assign: assignPlan, pending: planPending } = useSchoolPlan(school.documentId);
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
            {fieldErrorCount > 0 ? (
              <p role="alert" className="text-sm text-destructive" data-testid="ops-edit-school-form-summary">
                {t('formSummary', { count: fieldErrorCount })}
              </p>
            ) : null}
            <p className="text-sm text-body">
              {t('editVersionNote', { version: school.updatedAt })}
            </p>
            <OpsEditSchoolFields form={form} emailWarning={emailDomainWarning} />
            <SelectField
              id="edit-school-license-plan"
              label={tPlan('label')}
              placeholder={tPlan('placeholder')}
              helperText={tPlan('helper')}
              options={SCHOOL_PLAN_OPTIONS.map((option) => ({
                value: option,
                label: tPlan(`options.${option}`),
              }))}
              value={school.plan ?? ''}
              onValueChange={(value) => void assignPlan(value)}
              disabled={planPending}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {isPending ? t('savingLabel') : t('save')}
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
