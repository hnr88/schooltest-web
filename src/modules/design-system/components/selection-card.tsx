'use client';

import { useId } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRovingRadio } from '@/modules/design-system/lib/use-roving-radio';

import type { SelectionCardGroupProps } from '@/modules/design-system/types/choice.types';

// Canonical SelectionCard / radio-card (App Screens — Test catalog "who is taking
// it", "Not enough credits", Auto top-up, Checkout):
//   idle      border 1px #E3E8F0, radius 13px, padding 14px 16px, gap 13px
//   hover     border-color #CBD5E1
//   selected  border 2px #2563EB on #EFF5FF
//   indicator 20px circle — selected #2563EB + 11px white check, idle 1.5px #CBD5E1
// The canonical 1px→2px border swap moves every sibling by 1px on selection, so the
// second pixel is drawn as an INSET ring instead: same weight, zero layout shift.
// Focus uses `outline` rather than `ring` precisely so it cannot collide with it.

function SelectionCardGroup({
  options,
  value,
  onValueChange,
  ariaLabel,
  ariaLabelledBy,
  invalid,
  size = 'md',
  className,
}: SelectionCardGroupProps) {
  const uid = useId();
  const { getItemProps } = useRovingRadio({
    values: options.map((option) => option.value),
    value,
    onValueChange,
    isDisabled: (option) => options.find((o) => o.value === option)?.disabled === true,
  });

  return (
    <div
      role="radiogroup"
      data-slot="selection-card-group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid || undefined}
      className={cn('flex flex-col gap-2.5', className)}
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
            aria-labelledby={`${uid}-${option.value}-label`}
            aria-describedby={option.description ? `${uid}-${option.value}-desc` : undefined}
            data-slot="selection-card"
            className={cn(
              'flex min-h-11 w-full items-center gap-3.5 rounded-selection border text-left transition-colors duration-200 ease-out-expo focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
              size === 'lg' ? 'px-4.5 py-4' : 'px-4 py-3.5',
              checked
                ? 'border-primary bg-blue-50 ring-1 ring-primary ring-inset'
                : 'border-border bg-card hover:border-input',
              option.disabled && 'cursor-not-allowed opacity-55 hover:border-border',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full',
                checked ? 'bg-primary text-primary-foreground' : 'border-2 border-input',
              )}
            >
              {checked ? <Check className="size-3 stroke-3" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                id={`${uid}-${option.value}-label`}
                className={cn('text-lede text-foreground', checked ? 'font-bold' : 'font-semibold')}
              >
                {option.label}
              </span>
              {option.description ? (
                <span id={`${uid}-${option.value}-desc`} className="text-meta text-body">
                  {option.description}
                </span>
              ) : null}
            </span>
            {option.trailing ? (
              <span className="shrink-0 text-sm font-bold text-foreground">{option.trailing}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export { SelectionCardGroup };
