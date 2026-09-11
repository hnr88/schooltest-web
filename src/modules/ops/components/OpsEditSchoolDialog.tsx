'use client';

import { useTranslations } from 'next-intl';

import {
  OPS_CONTROL_CLASS,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogClose,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  SelectField,
} from '@/modules/design-system';
import { FormDialogShell, FormShell } from '@/modules/forms';
import { SCHOOL_PLAN_OPTIONS } from '@/modules/ops/constants/components.constants';
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
 *
 * school-admin/04 — the first consumer of the shared shells: the dirty-close
 * guard is FormDialogShell (U-20) and the root-error paragraph is FormShell's
 * (U-18). The rendered output is unchanged, and Cancel is the dialog's own
 * close so it passes through the same guard as Esc and the backdrop.
 */
export function OpsEditSchoolDialog({ school, onDone }: OpsEditSchoolDialogProps) {
  const t = useTranslations('Ops.createSchool');
  // Licence tier (`plan`, distinct from the form's `portal_plan` select above):
  // reuses the plan panel's own `Ops.plan` copy verbatim (D-33).
  const tPlan = useTranslations('Ops.plan');
  const { form, submit, isPending, emailDomainWarning, fieldErrorCount } = useSchoolEditForm({
    school,
    onDone,
  });
  const { assign: assignPlan, pending: planPending } = useSchoolPlan(school.documentId);
  const { errors, isDirty } = form.formState;

  return (
    <FormDialogShell
      open
      onOpenChange={(next) => {
        if (!next) onDone();
      }}
      isDirty={isDirty}
      discard={{
        title: t('dirtyCloseTitle'),
        description: t('dirtyCloseDescription'),
        confirmLabel: t('dirtyCloseConfirm'),
        cancelLabel: t('dirtyCloseCancel'),
      }}
    >
      <OpsDialogContent data-slot="ops-edit-school-dialog" className="sm:max-w-[640px]">
        <OpsDialogHeader title={t('editTitle')} sub={t('editDescription', { name: school.name })} />
        <FormShell
          id="ops-edit-school"
          rootError={errors.root?.message ?? null}
          submitting={isPending}
          onSubmit={(event) => {
            event.preventDefault();
            submit(event);
          }}
        >
          <OpsDialogBody>
            <p className="text-[13px] leading-relaxed text-[#7C8698]">
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
              triggerClassName={OPS_CONTROL_CLASS}
            />
          </OpsDialogBody>
          <OpsDialogFooter
            error={
              fieldErrorCount > 0 ? (
                <span data-testid="ops-edit-school-form-summary">
                  {t('formSummary', { count: fieldErrorCount })}
                </span>
              ) : null
            }
          >
            <OpsDialogClose render={<OpsDialogCancel type="button" />}>
              {t('cancel')}
            </OpsDialogClose>
            <OpsDialogCta type="submit" loading={isPending}>
              {isPending ? t('savingLabel') : t('save')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </FormShell>
      </OpsDialogContent>
    </FormDialogShell>
  );
}
