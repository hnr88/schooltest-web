'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { SchoolClass } from '@/modules/classes';
import {
  Button,
  Input,
  NativeSelect,
  NativeSelectOption,
  OPS_CONTROL_CLASS,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogCta,
  OpsDialogFooter,
  OpsFieldShell,
} from '@/modules/design-system';
import {
  ConsentAttestationFields,
  ConsentAttestationProvider,
  useConsentAttestation,
} from '@/modules/privacy-consent';
import { StudentEaldFields } from '@/modules/school-students/components/StudentEaldFields';
import { useStudentForm } from '@/modules/school-students/hooks/use-student-form';
import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import { YEAR_LEVEL_OPTIONS } from '@/modules/school-students/constants/schemas.constants';

import type { SchoolStudentFormProps } from '@/modules/school-students/types/components.types';

// The design's 48px modal select; NativeSelect renders its classes on the
// wrapper, so the control itself is reached with a descendant variant.
const NATIVE_SELECT_CLASS =
  'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:border-[1.5px] [&_select]:border-[#D8DFEA] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:text-[#0E2350] [&_select]:outline-none [&_select]:focus-visible:border-[#2563EB] [&_select]:focus-visible:ring-0';

// The C-CHD-02 v2/03 form body: name, email, date of birth, year level, class
// and the EAL/D block (first-language picklist, admin-only ACARA phase). No
// guardian, media or parent fields exist here — the server rejects them with
// a 400, and the parent wizard keeps them behind its own routes. Mounted
// fresh per target, so default values always match. `modal` renders the
// OpsDialog-kit body/footer chrome for the edit dialog; the flat layout stays
// for the add-student page.
export function SchoolStudentForm(props: SchoolStudentFormProps) {
  // W4-21: the add form (and only the add form) holds the school's guardian-consent
  // attestation. It lives beside the form's own values, so it never enters the
  // student schema; the create mutation reads it from this provider.
  if (props.target.mode === 'create') {
    return (
      <ConsentAttestationProvider>
        <SchoolStudentFormBody {...props} />
      </ConsentAttestationProvider>
    );
  }
  return <SchoolStudentFormBody {...props} />;
}

function SchoolStudentFormBody({
  target,
  classes,
  showAcaraPhase,
  onCancel,
  onDone,
  modal = false,
}: SchoolStudentFormProps) {
  const t = useTranslations('SchoolStudents.form');
  const editing = target.mode === 'edit';
  const { form, submit: submitForm, pending } = useStudentForm(target, onDone);
  const consent = useConsentAttestation();
  const [attempted, setAttempted] = useState(false);
  const {
    register,
    formState: { errors },
  } = form;

  // Guardian consent required and data collection not ticked: nothing is sent. The
  // message sits under the box; the form's own field errors still show.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (consent !== null && consent.missing) {
      event.preventDefault();
      setAttempted(true);
      void form.trigger();
      return;
    }
    void submitForm(event);
  };

  const fields = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OpsFieldShell id="student-given-name" label={t('givenName')} errorText={errors.given_name?.message} required>
          <Input id="student-given-name" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('given_name')} />
        </OpsFieldShell>
        <OpsFieldShell id="student-family-name" label={t('familyName')} errorText={errors.family_name?.message}>
          <Input id="student-family-name" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('family_name')} />
        </OpsFieldShell>
      </div>
      <OpsFieldShell
        id="student-email"
        label={t('email')}
        helperText={t('emailHint')}
        errorText={errors.email?.message}
        required
      >
        <Input id="student-email" type="email" autoComplete="off" className={OPS_CONTROL_CLASS} {...register('email')} />
      </OpsFieldShell>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OpsFieldShell id="student-dob" label={t('dateOfBirth')} errorText={errors.date_of_birth?.message}>
          <Input id="student-dob" type="date" className={OPS_CONTROL_CLASS} {...register('date_of_birth')} />
        </OpsFieldShell>
        <OpsFieldShell id="student-year-level" label={t('yearLevel')}>
          <NativeSelect id="student-year-level" className={NATIVE_SELECT_CLASS} {...register('year_level')}>
            {YEAR_LEVEL_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option === '' ? t('notSet') : t('yearOption', { level: Number(option) })}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </OpsFieldShell>
      </div>
      <OpsFieldShell
        id="student-class"
        label={t('classLabel')}
        /* Class is optional here, so the empty case is a hint, not a block:
           the field stays usable and the admin learns where to create one. */
        helperText={classes.length === 0 ? t('classNoClassesHint') : undefined}
      >
        <NativeSelect id="student-class" className={NATIVE_SELECT_CLASS} {...register('class_documentId')}>
          <NativeSelectOption value="">{t('classNone')}</NativeSelectOption>
          {classes.map((schoolClass) => (
            <NativeSelectOption key={schoolClass.documentId} value={schoolClass.documentId}>
              {schoolClass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </OpsFieldShell>
      {editing ? <p className="text-meta text-body">{t('keepHint')}</p> : null}
      <StudentEaldFields form={form} showAcaraPhase={showAcaraPhase} />
      {consent === null ? null : (
        <ConsentAttestationFields
          options={consent.options}
          value={consent.selection}
          onChange={consent.setSelection}
          showRequiredError={attempted}
          refusal={consent.refusal}
          disabled={pending}
        />
      )}
    </>
  );

  if (modal) {
    return (
      <form onSubmit={submit} noValidate>
        <OpsDialogBody>{fields}</OpsDialogBody>
        <OpsDialogFooter>
          <OpsDialogCancel type="button" onClick={onCancel} disabled={pending}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta type="submit" loading={pending}>
            {pending ? t('submitting') : editing ? t('submitEdit') : t('submitCreate')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </form>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {fields}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {pending ? t('submitting') : editing ? t('submitEdit') : t('submitCreate')}
        </Button>
      </div>
    </form>
  );
}
