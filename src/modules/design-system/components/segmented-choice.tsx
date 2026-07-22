'use client';

import { cn } from '@/lib/utils';
import { useRovingRadio } from '@/modules/design-system/lib/use-roving-radio';

import type { SegmentedChoiceProps } from '@/modules/design-system/types/choice.types';

// Canonical TwoUpSegmentedTabs — the FORM-SCOPED segmented control (App Screens:
// Add child, Onboarding add child):
//   track  grid 1fr 1fr, background #F1F5F9, radius 10px, padding 4px
//   item   centred, 13.5/600, padding 8px
//   active background #FFFFFF, radius 8px, #0E2350, shadow 0 1px 2px
//   idle   #64748B
// This is NOT `SegmentedControl`. That one is a VIEW SWITCHER — aria-pressed toggle
// buttons, correct for "Week | Month | Year". A required form field with mutually
// exclusive answers (Gender, Target entry term) is a radiogroup: one tab stop,
// arrows move the selection, and the group carries the field's label. Using the
// view switcher there is exactly the mismatch the wizard shipped.
// Idle ink is --color-body (#475569, 6.92:1 on the #F1F5F9 track) rather than the
// canonical #64748B, which is 4.34:1 there — an AA failure.

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

function SegmentedChoice({
  options,
  value,
  onValueChange,
  ariaLabel,
  ariaLabelledBy,
  invalid,
  className,
}: SegmentedChoiceProps) {
  const { getItemProps } = useRovingRadio({
    values: options.map((option) => option.value),
    value,
    onValueChange,
    isDisabled: (option) => options.find((o) => o.value === option)?.disabled === true,
  });

  return (
    <div
      role="radiogroup"
      data-slot="segmented-choice"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid || undefined}
      className={cn(
        'grid w-full gap-1 rounded-lg bg-muted p-1',
        COLUMNS[options.length] ?? 'grid-flow-col auto-cols-fr',
        invalid && 'ring-1 ring-destructive ring-inset',
        className,
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const { onClick, ...itemProps } = getItemProps(option.value);
        return (
          <button
            key={option.value}
            {...itemProps}
            onClick={option.disabled ? undefined : onClick}
            disabled={option.disabled}
            data-slot="segmented-choice-item"
            className={cn(
              'relative flex min-h-9.5 items-center justify-center rounded-md px-3 py-2 text-center text-body-sm font-semibold transition-colors duration-200 ease-out-expo after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
              checked
                ? 'bg-card text-foreground shadow-sm'
                : 'text-body hover:bg-surface-hover hover:text-foreground',
              option.disabled && 'cursor-not-allowed opacity-55 hover:bg-transparent',
            )}
          >
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedChoice };
