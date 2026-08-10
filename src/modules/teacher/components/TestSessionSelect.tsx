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
import { TEST_SESSION_SELECT_TRIGGER_CLASS } from '@/modules/teacher/constants/test-session-setup.constants';

import type { TestSessionSelectProps } from '@/modules/teacher/types/session-setup.types';

// WHY NOT the design-system `SelectField`: it renders `<Select>` without
// base-ui's `items` prop, and `Select.Value` resolves its label from `items`
// (`internals/resolveValueLabel.js` → `resolveSelectedLabel`). With no items the
// closed trigger falls back to `stringifyAsLabel(value)` and prints the RAW
// value — measured here as the trigger reading `funfuwqe7goiaijuh1uwrk31`
// instead of `EAL/D 8B`, because these two pickers carry Strapi documentIds.
// `src/modules/settings/components/SettingsSelectField.tsx` hit the identical
// defect and answered it the identical way; this follows that precedent rather
// than editing a shared component from a task that does not own it. The
// design-system fix is still worth making upstream.
function TestSessionSelect({
  id,
  label,
  options,
  placeholder,
  value,
  onValueChange,
  errorText,
}: TestSessionSelectProps) {
  return (
    <FieldShell id={id} label={label} errorText={errorText} required>
      <Select<string, false>
        items={options}
        value={value}
        onValueChange={(next) => onValueChange(next ?? '')}
        required
      >
        <SelectTrigger
          id={id}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy(id, undefined, errorText)}
          className={TEST_SESSION_SELECT_TRIGGER_CLASS}
        >
          <SelectValue placeholder={placeholder} />
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

export { TestSessionSelect };
