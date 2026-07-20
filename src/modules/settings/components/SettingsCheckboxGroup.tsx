'use client';

import { Checkbox, Label } from '@/modules/design-system';
import type { SettingsCheckboxGroupProps } from '@/modules/settings/types/settings.types';

export function SettingsCheckboxGroup<T extends string>({
  id,
  label,
  options,
  values,
  onCheckedChange,
}: SettingsCheckboxGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <Label
              key={option.value}
              htmlFor={optionId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Checkbox
                id={optionId}
                checked={values.includes(option.value)}
                onCheckedChange={(checked) => onCheckedChange(option.value, checked === true)}
              />
              {option.label}
            </Label>
          );
        })}
      </div>
    </fieldset>
  );
}
