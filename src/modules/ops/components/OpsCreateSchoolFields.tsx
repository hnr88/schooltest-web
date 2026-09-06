'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import {
  describedBy,
  FieldShell,
  Input,
  SelectField,
} from '@/modules/design-system';
import type { SchoolCreateFormValues, SchoolEditFormValues } from '@/modules/ops/schemas/school-create.schema';
import type { OpsCreateSchoolFieldsProps } from '@/modules/ops/types/school-create.types';

const STATE_CODES = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const SECTOR_KEYS = ['government', 'catholic', 'non-government'] as const;
const PLAN_KEYS = ['pilot', 'standard', 'enterprise'] as const;
const STATUS_KEYS = ['pending_setup', 'trial', 'active'] as const;
const SCHOOL_TYPE_KEYS = ['combined', 'primary', 'secondary'] as const;

/**
 * OPS-013 Create School modal body. The enum OPTIONS come from the shared
 * contract so the dialog can never offer a value the versioned route would
 * reject; the empty-string union members are the "not chosen yet" state of the
 * optional selects and are stripped before the POST body is built. `name` min
 * 3 mirrors the server's schoolCreateSchema, not the visual's bare "required".
 * The single Primary contact field stores LOSSLESSLY as `contact_name` (task
 * 10) — never a guessed family name.
 */
export function OpsCreateSchoolFields({ form }: { form: import('react-hook-form').UseFormReturn<SchoolCreateFormValues> }) {
  const t = useTranslations('Ops.createSchool');
  const { errors } = form.formState;

  const textField = (
    id: string,
    name: 'name' | 'suburb' | 'contact_name' | 'contact_email' | 'phone',
    label: string,
    required = false
  ) => (
    <FieldShell id={id} label={label} required={required} errorText={errors[name]?.message}>
      <Input
        id={id}
        autoComplete="off"
        aria-invalid={errors[name]?.message ? true : undefined}
        aria-describedby={errors[name]?.message ? describedBy(id) : undefined}
        {...form.register(name as never)}
      />
    </FieldShell>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {textField('create-school-name', 'name', t('name'), true)}
      {textField('create-school-suburb', 'suburb', t('suburb'), true)}
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
          />
        )}
      />
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
          />
        )}
      />
      <div className="sm:col-span-2">
        {textField('create-school-contact-name', 'contact_name', t('contactName'), true)}
      </div>
      <div className="sm:col-span-2">
        {textField('create-school-contact-email', 'contact_email', t('contactEmail'), true)}
      </div>
      {textField('create-school-phone', 'phone', t('phone'))}
    </div>
  );
}

export interface OpsEditSchoolFieldsProps {
  form: import('react-hook-form').UseFormReturn<SchoolEditFormValues>;
  /** A valid-but-non-school-domain email WARNS without blocking (task 10). */
  emailWarning?: string | null;
}

/**
 * Task 10 — the EDIT variant of the SAME form body, in the same file (extend,
 * never duplicate a component): adds postcode and school type, drops the
 * status-at-creation control (a create-only decision), and renders the
 * non-school-domain email warning without blocking.
 */
export function OpsEditSchoolFields({ form, emailWarning }: OpsEditSchoolFieldsProps) {
  const t = useTranslations('Ops.createSchool');
  const { errors } = form.formState;

  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="ops-edit-school-fields">
      <FieldShell id="edit-school-name" label={t('name')} required errorText={errors.name?.message}>
        <Input id="edit-school-name" {...form.register('name')} />
      </FieldShell>
      <FieldShell id="edit-school-suburb" label={t('suburb')} required errorText={errors.suburb?.message}>
        <Input id="edit-school-suburb" {...form.register('suburb')} />
      </FieldShell>
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
          />
        )}
      />
      <FieldShell id="edit-school-postcode" label={t('postcode')} errorText={errors.postcode?.message}>
        <Input id="edit-school-postcode" {...form.register('postcode')} />
      </FieldShell>
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
          />
        )}
      />
      <div className="sm:col-span-2">
        <FieldShell id="edit-school-contact-name" label={t('contactName')} required errorText={errors.contact_name?.message}>
          <Input id="edit-school-contact-name" {...form.register('contact_name')} />
        </FieldShell>
      </div>
      <div className="sm:col-span-2">
        <FieldShell id="edit-school-contact-email" label={t('contactEmail')} required errorText={errors.contact_email?.message}>
          <Input id="edit-school-contact-email" {...form.register('contact_email')} />
        </FieldShell>
        {emailWarning ? (
          <p className="text-sm text-amber-600 dark:text-amber-400" data-testid="edit-school-email-warning">
            {t('emailDomainWarning')}
          </p>
        ) : null}
      </div>
      <FieldShell id="edit-school-phone" label={t('phone')} errorText={errors.phone?.message}>
        <Input id="edit-school-phone" {...form.register('phone')} />
      </FieldShell>
    </div>
  );
}
