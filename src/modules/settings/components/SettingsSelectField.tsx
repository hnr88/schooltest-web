'use client';

import {
  describedBy,
  FieldShell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { SETTINGS_SELECT_TRIGGER_CLASS } from '@/modules/settings/constants/settings.constants';
import type { SettingsSelectFieldProps } from '@/modules/settings/types/settings.types';

// DS §06 "Select" in the SCREEN dialect: 1px #CBD5E1 / r10 / 11px 14px / 14.5px on
// white, chevron right, 3px focus ring — the same box as a text input. Reserved for
// the one field canonical still gives a dropdown: >5 members OR long labels (the
// sort order reads "Tuition: low to high"). Every short enum on this surface moved
// to a pill group or a segmented row instead.
//
// WHY NOT the design-system `SelectField`: it renders `<Select>` without base-ui's
// `items` prop, and `Select.Value` resolves its label from `items`. With no items
// the trigger falls back to `stringifyAsLabel(value)` and prints the RAW enum —
// "fee-asc" instead of "Tuition: low to high". Verified live against the shipped
// showcase (#ds-choice-select displays "open" after picking "Open answer"). The
// design-system is out of scope this round, so the canonical trigger geometry is
// applied here from the consumer and `items` is passed, which is the only way the
// label resolves. Report it upstream.
export function SettingsSelectField<T extends string>({
  id,
  label,
  options,
  value,
  onValueChange,
  helperText,
}: SettingsSelectFieldProps<T>) {
  return (
    <FieldShell id={id} label={label} helperText={helperText}>
      <Select<T, false>
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <SelectTrigger
          id={id}
          aria-describedby={describedBy(id, helperText)}
          className={SETTINGS_SELECT_TRIGGER_CLASS}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
