'use client';

import { WizardChipGroup } from '@/modules/student-wizard/components/WizardChipGroup';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import type { WizardChoiceFieldProps } from '@/modules/student-wizard/types/student-wizard.types';

// The portal's control for a small in-form enum (spec 03 §1.4 `PortalChip`, used
// by Gender, Test year level, Target entry term and Preferred contact channel).
// WizardField renders a <span id> instead of a <label for> here, because a <label>
// pointing at a radiogroup is not a real label — the group takes aria-labelledby.
export function WizardChoiceField({
  id,
  label,
  options,
  value,
  helper,
  error,
  required,
  size,
  onValueChange,
}: WizardChoiceFieldProps) {
  return (
    <WizardField
      id={id}
      labelId={`${id}-label`}
      label={label}
      helper={helper}
      error={error}
      required={required}
    >
      <WizardChipGroup
        options={options}
        value={value}
        size={size}
        ariaLabelledBy={`${id}-label`}
        invalid={Boolean(error)}
        onValueChange={onValueChange}
      />
    </WizardField>
  );
}
