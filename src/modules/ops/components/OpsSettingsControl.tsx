'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';

import { FieldShell, Input, SelectField, Switch, Textarea } from '@/modules/design-system';
import {
  SETTINGS_FIELD_KINDS,
  SETTINGS_SELECT_OPTIONS,
} from '@/modules/ops/constants/ops-settings.constants';
import { settingsInputValue } from '@/modules/ops/lib/settings-input-value';
import type { PlatformSettingsForm } from '@/modules/ops/types/platform-settings.types';

import type { OpsSettingsControlProps } from '@/modules/ops/types/components.types';

// One settings field, rendered with the DS control its value shape needs.
// EVERY kind is driven by `Controller`: useController re-registers from an
// effect, so the field survives a stray `reset()` and survives React Compiler
// memoization of this leaf — all of its props are stable after the first
// render, so a render-time `form.register(field)` would never run a second
// time. Number inputs convert through `valueAsNumber`, so the form value stays
// a number and the shared (non-coerced) Zod schema validates it directly.
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
      <Controller
        control={form.control}
        name={field}
        render={({ field: control }) =>
          kind === 'switch' ? (
            <Switch
              id={id}
              checked={Boolean(control.value)}
              onCheckedChange={control.onChange}
              aria-invalid={Boolean(errorText)}
            />
          ) : kind === 'textarea' ? (
            <Textarea
              id={id}
              name={control.name}
              ref={control.ref}
              value={settingsInputValue(control.value)}
              onChange={control.onChange}
              onBlur={control.onBlur}
              aria-invalid={Boolean(errorText)}
            />
          ) : (
            <Input
              id={id}
              type={kind === 'number' ? 'number' : 'text'}
              name={control.name}
              ref={control.ref}
              value={settingsInputValue(control.value)}
              onChange={(event) =>
                control.onChange(
                  kind === 'number' ? event.target.valueAsNumber : event.target.value,
                )
              }
              onBlur={control.onBlur}
              aria-invalid={Boolean(errorText)}
            />
          )
        }
      />
    </FieldShell>
  );
}
