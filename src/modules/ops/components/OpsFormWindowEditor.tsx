'use client';

import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import { useFormWindowForm } from '@/modules/ops/hooks/use-form-window-form';
import type { FormWindow, OpsForm } from '@/modules/ops/schemas/form-window.schema';

interface OpsFormWindowEditorProps {
  schoolDocumentId: string;
  currentWindow: FormWindow | null;
  forms: OpsForm[];
}

export function OpsFormWindowEditor({
  schoolDocumentId,
  currentWindow,
  forms,
}: OpsFormWindowEditorProps) {
  const t = useTranslations('Ops.window');
  const { form, submit, serverError, pending } = useFormWindowForm(
    schoolDocumentId,
    currentWindow,
  );
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FieldShell
        id="ops-window-form"
        label={t('formLabel')}
        errorText={errors.form_documentId?.message}
        required
      >
        <NativeSelect id="ops-window-form" className="w-full" {...register('form_documentId')}>
          <NativeSelectOption value="">{t('formPlaceholder')}</NativeSelectOption>
          {forms.map((option) => (
            <NativeSelectOption key={option.documentId} value={option.documentId}>
              {option.form_code}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          id="ops-window-opens"
          label={t('opensLabel')}
          errorText={errors.opens_at?.message}
          required
        >
          <Input id="ops-window-opens" type="datetime-local" {...register('opens_at')} />
        </FieldShell>
        <FieldShell
          id="ops-window-closes"
          label={t('closesLabel')}
          errorText={errors.closes_at?.message}
          required
        >
          <Input id="ops-window-closes" type="datetime-local" {...register('closes_at')} />
        </FieldShell>
      </div>
      {serverError ? (
        <Alert variant="error" title={t('saveErrorTitle')}>
          {serverError}
        </Alert>
      ) : null}
      <div>
        <Button type="submit" loading={pending}>
          {pending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>
    </form>
  );
}
