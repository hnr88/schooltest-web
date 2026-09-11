'use client';

import { cn } from '@/lib/utils';
import { CHOICE_CARD_SIZES } from '@/modules/teacher/constants/start-session-styles.constants';

/**
 * The design's radio card: a native radio (arrow keys, one tab stop per group,
 * disabled options skipped) under the drawn 1.5px card, navy dot and white pip.
 */
function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  label,
  description,
  disabled = false,
  size,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  size: keyof typeof CHOICE_CARD_SIZES;
}) {
  const drawn = CHOICE_CARD_SIZES[size];
  return (
    <label
      data-slot="start-choice"
      data-value={value}
      data-checked={checked ? '' : undefined}
      className={cn(
        'flex min-w-0 items-center rounded-[12px] border-[1.5px] transition-colors motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-900',
        drawn.box,
        checked ? 'border-navy-900 bg-[#F7F9FC]' : 'border-[#E4E9F2] bg-white',
        disabled ? 'cursor-not-allowed bg-[#FAFBFC] opacity-70' : 'cursor-pointer',
        !checked && !disabled && 'hover:border-[#C4CEDC]',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid shrink-0 place-items-center rounded-full border-[1.5px]',
          drawn.dot,
          checked ? 'border-navy-900 bg-navy-900' : 'border-[#C4CEDC] bg-white',
        )}
      >
        {checked ? <span className={cn('block rounded-full bg-white', drawn.inner)} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block font-semibold', drawn.label, disabled ? 'text-[#9AA6B8]' : 'text-navy-900')}>
          {label}
        </span>
        {description ? <span className={cn('block text-[#6B7280]', drawn.desc)}>{description}</span> : null}
      </span>
    </label>
  );
}

export { ChoiceCard };
