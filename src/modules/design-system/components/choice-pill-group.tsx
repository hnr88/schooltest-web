'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRovingRadio } from '@/modules/design-system/lib/use-roving-radio';

import type {
  ChoiceOption,
  ChoicePillGroupProps,
  ChoicePillSize,
} from '@/modules/design-system/types/choice.types';

// Canonical ChoicePill (App Screens — Add child "Relationship", Create test "Assign
// to classes", Auto top-up thresholds, Invite co-parent):
//   idle      13.5/500 #475569 on #FFF, 1px #CBD5E1, padding 7px 16px, radius 999
//   hover     background #F7F9FC
//   selected  13.5/600 #2563EB on #EFF5FF, 1px #2563EB
//   multi     adds a trailing 12px check
// The drawn pill stays at the canonical ~34px so the form rhythm is unchanged; the
// 44px POINTER target comes from an ::after expansion (the group never clips).
// Canonical idle ink #475569 is kept verbatim (8.6:1); #64748B was NOT used because
// it is 4.34:1 on the #F7F9FC hover fill — below AA.

const SIZE: Record<ChoicePillSize, string> = {
  md: 'gap-2 px-4 py-1.75 text-body-sm after:-inset-y-1.5',
  sm: 'gap-1.5 px-3.5 py-1.25 text-meta after:-inset-y-2',
};

function pillClass(size: ChoicePillSize, selected: boolean, disabled?: boolean) {
  return cn(
    'relative inline-flex min-w-0 items-center rounded-full border transition-colors duration-200 ease-out-expo after:absolute after:inset-x-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
    SIZE[size],
    selected
      ? 'border-primary bg-blue-50 font-semibold text-primary'
      : 'border-input bg-card font-medium text-body hover:bg-background',
    disabled && 'cursor-not-allowed opacity-55 hover:bg-card',
  );
}

function PillBody({ option, selected }: { option: ChoiceOption; selected: boolean }) {
  const Icon = option.icon;
  return (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="truncate">{option.label}</span>
      {selected ? <Check aria-hidden="true" className="size-3 shrink-0 stroke-3" /> : null}
    </>
  );
}

function ChoicePillGroup(props: ChoicePillGroupProps) {
  const { options, ariaLabel, ariaLabelledBy, invalid, className, size = 'md' } = props;
  const single = props.mode !== 'multiple';
  const selectedValue = single ? (props.value as string) : '';
  const { getItemProps } = useRovingRadio({
    values: options.map((option) => option.value),
    value: selectedValue,
    onValueChange: (next) => {
      if (props.mode !== 'multiple') props.onValueChange(next);
    },
    isDisabled: (option) => options.find((o) => o.value === option)?.disabled === true,
  });

  const selectedList = single ? [] : (props.value as readonly string[]);

  return (
    <div
      role={single ? 'radiogroup' : 'group'}
      data-slot="choice-pill-group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid || undefined}
      className={cn('flex flex-wrap gap-2.5', className)}
    >
      {options.map((option) => {
        if (single) {
          const selected = option.value === selectedValue;
          const { onClick, ...itemProps } = getItemProps(option.value);
          return (
            <button
              key={option.value}
              {...itemProps}
              onClick={option.disabled ? undefined : onClick}
              disabled={option.disabled}
              data-slot="choice-pill"
              className={pillClass(size, selected, option.disabled)}
            >
              <PillBody option={option} selected={selected} />
            </button>
          );
        }
        const selected = selectedList.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            data-slot="choice-pill"
            onClick={() =>
              props.mode === 'multiple' &&
              props.onValueChange(
                selected
                  ? selectedList.filter((entry) => entry !== option.value)
                  : [...selectedList, option.value],
              )
            }
            className={pillClass(size, selected, option.disabled)}
          >
            <PillBody option={option} selected={selected} />
          </button>
        );
      })}
    </div>
  );
}

export { ChoicePillGroup };
