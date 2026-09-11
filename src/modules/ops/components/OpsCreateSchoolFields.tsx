'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import {
  describedBy,
  Input,
  OPS_CONTROL_CLASS,
  OpsFieldShell,
  SelectField,
} from '@/modules/design-system';
import type { SchoolCreateFormValues, SchoolEditFormValues } from '@/modules/ops/schemas/school-create.schema';

const STATE_CODES = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const SECTOR_KEYS = ['government', 'catholic', 'non-government'] as const;
const PLAN_KEYS = ['pilot', 'standard', 'enterprise'] as const;
const STATUS_KEYS = ['pending_setup', 'trial', 'active'] as const;
const SCHOOL_TYPE_KEYS = ['combined', 'primary', 'secondary'] as const;

/** `vSchool` field UI contract (`Ops Portal.dc.html:1145-1159`): a warning
 *  border is amber via the `warning` design token, never a colour literal.
 *  `SelectField` has no warning-tone trigger border (only `errorText` reaches
 *  it) — a kit gap, so the status-Active warning below is message-only. */
const WARNING_INPUT_CLASS = 'border-warning focus-visible:border-warning';

export interface OpsCreateSchoolFieldsProps {
  form: import('react-hook-form').UseFormReturn<SchoolCreateFormValues>;
  /** A valid-but-non-school-domain contact email WARNS without blocking. */
  emailWarning?: boolean;
  /** Creating with status Active WARNS without blocking (create only). */
  statusWarning?: boolean;
}

/**
 * OPS-013 Create School modal body, in the design's field grid
 * (`Ops Portal.dc.html:547-616`): [name|suburb], [state|sector|plan],
 * [contact|email], [phone|status]. The enum OPTIONS come from the shared
 * contract so the dialog can never offer a value the versioned route would
 * reject; the empty-string union members are the "not chosen yet" state of the
 * optional selects and are stripped before the POST body is built. `name` min
 * 3 mirrors the server's schoolCreateSchema, not the visual's bare "required".
 * The single Primary contact field stores LOSSLESSLY as `contact_name` (task
 * 10) — never a guessed family name.
 */
export function OpsCreateSchoolFields({ form, emailWarning, statusWarning }: OpsCreateSchoolFieldsProps) {
  const t = useTranslations('Ops.createSchool');
  const { errors } = form.formState;

  const textField = (
    id: string,
    name: 'name' | 'suburb' | 'contact_name' | 'contact_email' | 'phone',
    label: string,
    required = false,
    helperText?: string,
    warn = false
  ) => (
    <OpsFieldShell id={id} label={label} required={required} helperText={helperText} errorText={errors[name]?.message}>
      <Input
        id={id}
        autoComplete="off"
        aria-invalid={errors[name]?.message ? true : undefined}
        aria-describedby={errors[name]?.message ? describedBy(id, undefined, errors[name]?.message) : undefined}
        className={`h-12 rounded-xl ${warn && !errors[name]?.message ? WARNING_INPUT_CLASS : OPS_CONTROL_CLASS}`}
        {...form.register(name as never)}
      />
    </OpsFieldShell>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {textField('create-school-name', 'name', t('name'), true)}
        {textField('create-school-suburb', 'suburb', t('suburb'), true)}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Controller
          control={form.control}
          name="state"
          render={({ field }) => (
            <SelectField
              id="create-school-state"
              label={t('state')}
              placeholder={t('statePlaceholder')}
              options={STATE_CODES.map((code) => ({ value: code, label: code }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.state?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
        <Controller
          control={form.control}
          name="sector"
          render={({ field }) => (
            <SelectField
              id="create-school-sector"
              label={t('sector')}
              placeholder={t('sectorPlaceholder')}
              options={SECTOR_KEYS.map((key) => ({ value: key, label: t(`sectorOptions.${key}`) }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.sector?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
        <Controller
          control={form.control}
          name="plan"
          render={({ field }) => (
            <SelectField
              id="create-school-plan"
              label={t('plan')}
              placeholder={t('planPlaceholder')}
              options={PLAN_KEYS.map((key) => ({ value: key, label: t(`planOptions.${key}`) }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.plan?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {textField('create-school-contact-name', 'contact_name', t('contactName'), true, t('contactHelper'))}
        {textField('create-school-contact-email', 'contact_email', t('contactEmail'), true, undefined, emailWarning)}
        {emailWarning && !errors.contact_email?.message ? (
          <p className="text-xs font-medium text-warning" data-testid="create-school-email-warning">
            {t('emailDomainWarning')}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {textField('create-school-phone', 'phone', t('phone'))}
        <div>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <SelectField
                id="create-school-status"
                label={t('status')}
                placeholder={t('statusPlaceholder')}
                options={STATUS_KEYS.map((key) => ({ value: key, label: t(`statusOptions.${key}`) }))}
                value={String(field.value ?? '')}
                onValueChange={field.onChange}
                errorText={errors.status?.message}
                triggerClassName={OPS_CONTROL_CLASS}
              />
            )}
          />
          {statusWarning ? (
            <p className="mt-1.5 text-xs font-medium text-warning" data-testid="create-school-status-warning">
              {t('statusActiveWarning')}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

export interface OpsEditSchoolFieldsProps {
  form: import('react-hook-form').UseFormReturn<SchoolEditFormValues>;
  /** A valid-but-non-school-domain email WARNS without blocking (task 10). */
  emailWarning?: boolean;
}

/**
 * Task 10 — the EDIT variant of the SAME form body, in the same design grid
 * (extend, never duplicate a component): adds postcode and school type, drops
 * the status-at-creation control (a create-only decision), and renders the
 * non-school-domain email warning without blocking.
 */
export function OpsEditSchoolFields({ form, emailWarning }: OpsEditSchoolFieldsProps) {
  const t = useTranslations('Ops.createSchool');
  const { errors } = form.formState;
  const showEmailWarning = emailWarning && !errors.contact_email?.message;

  const editInput = (className?: string) => `h-12 rounded-xl ${className ?? OPS_CONTROL_CLASS}`;

  return (
    <div className="flex flex-col gap-[18px]" data-testid="ops-edit-school-fields">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OpsFieldShell id="edit-school-name" label={t('name')} required errorText={errors.name?.message}>
          <Input id="edit-school-name" className={editInput()} {...form.register('name')} />
        </OpsFieldShell>
        <OpsFieldShell id="edit-school-suburb" label={t('suburb')} required errorText={errors.suburb?.message}>
          <Input id="edit-school-suburb" className={editInput()} {...form.register('suburb')} />
        </OpsFieldShell>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Controller
          control={form.control}
          name="state"
          render={({ field }) => (
            <SelectField
              id="edit-school-state"
              label={t('state')}
              placeholder={t('statePlaceholder')}
              options={STATE_CODES.map((code) => ({ value: code, label: code }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.state?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
        <Controller
          control={form.control}
          name="sector"
          render={({ field }) => (
            <SelectField
              id="edit-school-sector"
              label={t('sector')}
              placeholder={t('sectorPlaceholder')}
              options={SECTOR_KEYS.map((key) => ({ value: key, label: t(`sectorOptions.${key}`) }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.sector?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
        <Controller
          control={form.control}
          name="plan"
          render={({ field }) => (
            <SelectField
              id="edit-school-plan"
              label={t('plan')}
              placeholder={t('planPlaceholder')}
              options={PLAN_KEYS.map((key) => ({ value: key, label: t(`planOptions.${key}`) }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.plan?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OpsFieldShell id="edit-school-postcode" label={t('postcode')} errorText={errors.postcode?.message}>
          <Input id="edit-school-postcode" className={editInput()} {...form.register('postcode')} />
        </OpsFieldShell>
        <Controller
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <SelectField
              id="edit-school-school-type"
              label={t('schoolType')}
              placeholder={t('schoolTypePlaceholder')}
              options={SCHOOL_TYPE_KEYS.map((key) => ({ value: key, label: key }))}
              value={String(field.value ?? '')}
              onValueChange={field.onChange}
              errorText={errors.schoolType?.message}
              triggerClassName={OPS_CONTROL_CLASS}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OpsFieldShell
          id="edit-school-contact-name"
          label={t('contactName')}
          required
          helperText={t('contactHelper')}
          errorText={errors.contact_name?.message}
        >
          <Input id="edit-school-contact-name" className={editInput()} {...form.register('contact_name')} />
        </OpsFieldShell>
        <OpsFieldShell id="edit-school-contact-email" label={t('contactEmail')} required errorText={errors.contact_email?.message}>
          <Input
            id="edit-school-contact-email"
            className={editInput(showEmailWarning ? WARNING_INPUT_CLASS : undefined)}
            {...form.register('contact_email')}
          />
        </OpsFieldShell>
      </div>
      <OpsFieldShell id="edit-school-phone" label={t('phone')} errorText={errors.phone?.message}>
        <Input id="edit-school-phone" className={editInput()} {...form.register('phone')} />
      </OpsFieldShell>
      {showEmailWarning ? (
        <p className="-mt-2 text-xs font-medium text-warning" data-testid="edit-school-email-warning">
          {t('emailDomainWarning')}
        </p>
      ) : null}
    </div>
  );
}
