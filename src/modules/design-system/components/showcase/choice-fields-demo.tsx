'use client';

import { useState } from 'react';

import { ChoicePillGroup } from '@/modules/design-system/components/choice-pill-group';
import { FieldShell } from '@/modules/design-system/components/field-shell';
import { SegmentedChoice } from '@/modules/design-system/components/segmented-choice';
import type { ChoiceOption } from '@/modules/design-system/types/choice.types';

interface ChoiceFieldsDemoProps {
  relationshipLabel: string;
  relationshipHelper: string;
  relationshipOptions: readonly ChoiceOption[];
  termLabel: string;
  termOptions: readonly ChoiceOption[];
  subjectsLabel: string;
  subjectsOptions: readonly ChoiceOption[];
  errorText: string;
}

function ChoiceFieldsDemo({
  relationshipLabel,
  relationshipHelper,
  relationshipOptions,
  termLabel,
  termOptions,
  subjectsLabel,
  subjectsOptions,
  errorText,
}: ChoiceFieldsDemoProps) {
  const [relationship, setRelationship] = useState(relationshipOptions[0]?.value ?? '');
  const [term, setTerm] = useState('');
  const [subjects, setSubjects] = useState<readonly string[]>([subjectsOptions[0]?.value ?? '']);

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <FieldShell
          id="ds-relationship"
          labelId="ds-relationship-label"
          label={relationshipLabel}
          helperText={relationshipHelper}
          required
        >
          <SegmentedChoice
            options={relationshipOptions}
            value={relationship}
            onValueChange={setRelationship}
            ariaLabelledBy="ds-relationship-label"
          />
        </FieldShell>
        <FieldShell
          id="ds-term"
          labelId="ds-term-label"
          label={termLabel}
          errorText={term ? undefined : errorText}
          required
        >
          <ChoicePillGroup
            options={termOptions}
            value={term}
            onValueChange={setTerm}
            invalid={!term}
            ariaLabelledBy="ds-term-label"
          />
        </FieldShell>
      </div>
      <FieldShell id="ds-subjects" labelId="ds-subjects-label" label={subjectsLabel}>
        <ChoicePillGroup
          mode="multiple"
          options={subjectsOptions}
          value={subjects}
          onValueChange={setSubjects}
          ariaLabelledBy="ds-subjects-label"
        />
      </FieldShell>
    </div>
  );
}

export { ChoiceFieldsDemo, type ChoiceFieldsDemoProps };
