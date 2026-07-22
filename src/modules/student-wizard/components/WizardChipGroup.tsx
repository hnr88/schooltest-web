'use client';

import { cn } from '@/lib/utils';
import {
  WIZARD_CHIP,
  WIZARD_CHIP_IDLE,
  WIZARD_CHIP_SELECTED,
} from '@/modules/student-wizard/constants/wizard-control.constants';
import { useWizardChoice } from '@/modules/student-wizard/hooks/use-wizard-choice';
import type { WizardChipGroupProps } from '@/modules/student-wizard/types/student-wizard.types';

// `PortalChip` row (spec 03 §1.4): flex-wrap at gap 8px, 44px chips, selected =
// #0E2350 fill / #FFFFFF ink, idle = white with the #D8DFEA rule. The design
// declares no hover and no focus style at all; both are authored here (a 1px lift
// and a --ring focus ring) because a chip with neither fails WCAG 2.4.7.
export function WizardChipGroup({
  options,
  value,
  ariaLabelledBy,
  invalid,
  size = 'wide',
  onValueChange,
}: WizardChipGroupProps) {
  const getItemProps = useWizardChoice(
    options.map((option) => option.value),
    value,
    onValueChange,
  );

  return (
    <div
      role="radiogroup"
      data-slot="wizard-chip-group"
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-2 pt-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          {...getItemProps(option.value)}
          data-slot="wizard-chip"
          className={cn(
            WIZARD_CHIP,
            size === 'wide' ? 'px-4.5' : 'px-3.75',
            option.value === value ? WIZARD_CHIP_SELECTED : WIZARD_CHIP_IDLE,
          )}
        >
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
