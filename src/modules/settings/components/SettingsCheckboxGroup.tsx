'use client';

import { Checkbox, Label } from '@/modules/design-system';
import { SETTINGS_SECTION_LABEL_CLASS } from '@/modules/settings/constants/settings.constants';
import type { SettingsCheckboxGroupProps } from '@/modules/settings/types/settings.types';

// Canonical filter chips: intrinsically sized pills that wrap, not a grid of
// stretched full-width rows. The 44px minimum keeps the pointer target legal
// while the drawn chip stays compact.
export function SettingsCheckboxGroup<T extends string>({
  id,
  label,
  options,
  values,
  onCheckedChange,
}: SettingsCheckboxGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={SETTINGS_SECTION_LABEL_CLASS}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <Label
              key={option.value}
              htmlFor={optionId}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors duration-200 ease-out-expo hover:border-primary/40 hover:bg-surface-hover has-data-[state=checked]:border-primary has-data-[state=checked]:bg-blue-50 motion-reduce:transition-none"
            >
              <Checkbox
                id={optionId}
                checked={values.includes(option.value)}
                onCheckedChange={(checked) => onCheckedChange(option.value, checked === true)}
                // The primitive ships -inset-x-3/-inset-y-2, which on a 16px box with
                // a 1px border resolves from a 14px PADDING box: 40x30 on paper and
                // 38x30 under a real pointer scan. 16px per side reaches 46x46 — and
                // no further: the box lands exactly on the chip's left edge and 1px
                // into the 8px gap, so no neighbour loses a pixel of its own target.
                className="after:-inset-4"
              />
              {option.label}
            </Label>
          );
        })}
      </div>
    </fieldset>
  );
}
