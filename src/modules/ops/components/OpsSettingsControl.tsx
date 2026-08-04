'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';

import { FieldShell, Input, SelectField, Switch, Textarea } from '@/modules/design-system';
import {
  SETTINGS_FIELD_KINDS,
  SETTINGS_SELECT_OPTIONS,
} from '@/modules/ops/constants/ops-settings.constants';
import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';

interface OpsSettingsControlProps {
  readonly form: UseFormReturn<PlatformSettingsForm>;
  readonly field: keyof PlatformSettingsForm;
  readonly label: string;
  readonly helperText?: string;
  readonly optionLabel: (option: string) => string;
}

// One settings field, rendered with the DS control its value shape needs. Number
// inputs register with `valueAsNumber`, so the form value is already a number and
// the shared (non-coerced) Zod schema validates it directly.
export function OpsSettingsControl({
  form,
  field,
  label,
  helperText,
  optionLabel,
}: OpsSettingsControlProps) {
  const kind = SETTINGS_FIELD_KINDS[field];
  const errorText = form.formState.errors[field]?.message;
  const id = `setting-${field}`;

  if (kind === 'select') {
    return (
      <Controller
        control={form.control}
        name={field}
        render={({ field: control }) => (
          <SelectField
            id={id}
            label={label}
            helperText={helperText}
            errorText={errorText}
            placeholder={label}
            value={String(control.value ?? '')}
            onValueChange={control.onChange}
            options={(SETTINGS_SELECT_OPTIONS[field] ?? []).map((option) => ({
              value: option,
              label: optionLabel(option),
            }))}
          />
        )}
      />
    );
  }

  return (
    <FieldShell id={id} label={label} helperText={helperText} errorText={errorText}>
      {kind === 'switch' ? (
        <Controller
          control={form.control}
          name={field}
          render={({ field: control }) => (
            <Switch
              id={id}
              checked={Boolean(control.value)}
              onCheckedChange={control.onChange}
              aria-invalid={Boolean(errorText)}
            />
          )}
        />
      ) : kind === 'textarea' ? (
        <Textarea id={id} aria-invalid={Boolean(errorText)} {...form.register(field)} />
      ) : (
        <Input
          id={id}
          type={kind === 'number' ? 'number' : 'text'}
          aria-invalid={Boolean(errorText)}
          {...form.register(field, kind === 'number' ? { valueAsNumber: true } : undefined)}
        />
      )}
    </FieldShell>
  );
}
