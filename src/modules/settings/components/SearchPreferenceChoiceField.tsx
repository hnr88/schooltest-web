'use client';

import { Controller, type Control } from 'react-hook-form';

import { ChoicePillGroup, FieldShell, type ChoiceOption } from '@/modules/design-system';
import type {
  SearchPreferenceArrayField,
  SearchPreferenceFormValues,
} from '@/modules/settings/types/settings.types';

interface SearchPreferenceChoiceFieldProps {
  control: Control<SearchPreferenceFormValues>;
  name: SearchPreferenceArrayField;
  label: string;
  options: readonly ChoiceOption[];
}

// Canonical multi-select for SHORT labels: the ChoicePill group (App Screens
// "Assign to classes" L3290-3293, Invite co-parent "Can see" L1493-1494) — an
// intrinsically sized 999px pill with a trailing check when selected. The screen
// previously drew a bordered 44px-tall checkbox slab per option, which is not a
// control canonical has anywhere and is what made three filter groups read as a
// wall.
// FieldShell supplies the canonical field stack (label 13.5/600 #16326E over a 6px
// gap) and `labelId` is the required form for a GROUP: a <label for> pointing at a
// role=group is not a label, so the group takes aria-labelledby instead.
export function SearchPreferenceChoiceField({
  control,
  name,
  label,
  options,
}: SearchPreferenceChoiceFieldProps) {
  const labelId = `${name}-label`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldShell id={name} labelId={labelId} label={label}>
          <ChoicePillGroup
            mode="multiple"
            options={options}
            value={field.value}
            onValueChange={(next) => field.onChange([...next])}
            ariaLabelledBy={labelId}
          />
        </FieldShell>
      )}
    />
  );
}
