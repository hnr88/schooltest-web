'use client';

import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import {
  Input,
  NativeSelect,
  NativeSelectOption,
  OPS_CONTROL_CLASS,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsFieldShell,
} from '@/modules/design-system';
import {
  ERASE_KEPT_ITEMS,
  ERASE_REMOVED_ITEMS,
  ERASE_SELECT_CLASS,
} from '@/modules/privacy-consent/constants/components.constants';
import { useEraseStudentForm } from '@/modules/privacy-consent/hooks/use-erase-student-form';
import { typedGivenNameMatches } from '@/modules/privacy-consent/lib/erase-request';
import { ERASE_CHANNELS, ERASE_REFERENCE_MAX } from '@/modules/privacy-consent/schemas/consent.schema';

import type { EraseStudentDialogProps } from '@/modules/privacy-consent/types/components.types';

// W4-21 (D5 S3): the school administrator's erase confirmation. It says plainly what
// is removed and what is kept, records the request (channel, reference, date
// received) and will not enable the confirm until the student's given name has been
// typed and a reference entered. Mounted only while open, so it starts blank each time.
export function EraseStudentDialog({
  open,
  onOpenChange,
  studentDocumentId,
  givenName,
}: EraseStudentDialogProps) {
  const t = useTranslations('PrivacyConsent.erase');
  const form = useEraseStudentForm({
    studentDocumentId,
    givenName,
    onDone: () => onOpenChange(false),
  });
  const { values } = form;
  const nameTouched = values.typedName.trim() !== '';
  const nameWrong = nameTouched && !typedGivenNameMatches(values.typedName, givenName);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.submit();
  };

  return (
    <OpsDialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <OpsDialogContent>
        <OpsDialogHeader title={t('dialog.title', { name: givenName })} sub={t('dialog.sub')} />
        <form onSubmit={onSubmit} noValidate data-slot="erase-student-form">
          <OpsDialogBody>
            <p className="text-sm text-[#3D4A5C]">{t('dialog.intro')}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div data-slot="erase-removed">
                <h3 className="text-[13px] font-semibold text-[#0E2350]">{t('dialog.removedTitle')}</h3>
                <ul className="mt-1.5 list-disc pl-5 text-[13px] text-[#3D4A5C]">
                  {ERASE_REMOVED_ITEMS.map((item) => (
                    <li key={item}>{t(`dialog.removed.${item}`)}</li>
                  ))}
                </ul>
              </div>
              <div data-slot="erase-kept">
                <h3 className="text-[13px] font-semibold text-[#0E2350]">{t('dialog.keptTitle')}</h3>
                <ul className="mt-1.5 list-disc pl-5 text-[13px] text-[#3D4A5C]">
                  {ERASE_KEPT_ITEMS.map((item) => (
                    <li key={item}>{t(`dialog.kept.${item}`)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="rounded-[14px] bg-[#F4F6FA] px-4 py-3 text-[13px] leading-relaxed text-[#3D4A5C]">
              {t('dialog.backups')}
            </p>
            <OpsFieldShell
              id="erase-channel"
              label={t('dialog.channelLabel')}
              required
            >
              <NativeSelect
                id="erase-channel"
                className={ERASE_SELECT_CLASS}
                value={values.channel}
                disabled={form.pending}
                onChange={(event) => form.setValue('channel', event.target.value as typeof values.channel)}
              >
                {ERASE_CHANNELS.map((channel) => (
                  <NativeSelectOption key={channel} value={channel}>
                    {t(`dialog.channel.${channel}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </OpsFieldShell>
            <OpsFieldShell
              id="erase-reference"
              label={t('dialog.referenceLabel')}
              helperText={t('dialog.referenceHint', { max: ERASE_REFERENCE_MAX })}
              required
            >
              <Input
                id="erase-reference"
                autoComplete="off"
                maxLength={ERASE_REFERENCE_MAX}
                className={OPS_CONTROL_CLASS}
                value={values.reference}
                disabled={form.pending}
                onChange={(event) => form.setValue('reference', event.target.value)}
              />
            </OpsFieldShell>
            <OpsFieldShell id="erase-received-on" label={t('dialog.receivedLabel')} required>
              <Input
                id="erase-received-on"
                type="date"
                max={form.today}
                className={OPS_CONTROL_CLASS}
                value={values.receivedOn}
                disabled={form.pending}
                onChange={(event) => form.setValue('receivedOn', event.target.value)}
              />
            </OpsFieldShell>
            <OpsFieldShell
              id="erase-confirm-name"
              label={t('dialog.typeNameLabel', { name: givenName })}
              errorText={nameWrong ? t('dialog.nameMismatch') : undefined}
              required
            >
              <Input
                id="erase-confirm-name"
                autoComplete="off"
                className={OPS_CONTROL_CLASS}
                value={values.typedName}
                disabled={form.pending}
                aria-invalid={nameWrong ? true : undefined}
                onChange={(event) => form.setValue('typedName', event.target.value)}
              />
            </OpsFieldShell>
          </OpsDialogBody>
          <OpsDialogFooter error={form.error}>
            <OpsDialogCancel type="button" disabled={form.pending} onClick={() => onOpenChange(false)}>
              {t('dialog.cancel')}
            </OpsDialogCancel>
            <OpsDialogCta
              type="submit"
              loading={form.pending}
              disabled={!form.ready}
              className="bg-[#B42318] hover:bg-[#91201A]"
            >
              {t('dialog.confirm')}
            </OpsDialogCta>
          </OpsDialogFooter>
        </form>
      </OpsDialogContent>
    </OpsDialog>
  );
}
