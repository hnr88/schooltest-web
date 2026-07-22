'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

import type { RovingRadioOptions, RovingRadioApi } from '@/modules/design-system/types/choice.types';

const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];

// WAI-ARIA radiogroup keyboard contract, shared by every single-choice control in
// this module (selection cards, choice pills, the form-scoped segmented control).
// A radiogroup is ONE tab stop: arrows move AND select, Home/End jump to the ends,
// and both wrap. Disabled options are skipped rather than focused-and-ignored.
function useRovingRadio({
  values,
  value,
  onValueChange,
  isDisabled,
}: RovingRadioOptions): RovingRadioApi {
  const nodes = useRef(new Map<string, HTMLButtonElement>());

  const register = useCallback(
    (option: string) => (node: HTMLButtonElement | null) => {
      if (node) nodes.current.set(option, node);
      else nodes.current.delete(option);
    },
    [],
  );

  const enabled = values.filter((option) => !isDisabled?.(option));
  const activeIndex = enabled.indexOf(value);
  // Nothing selected yet → the FIRST enabled option carries the group's tab stop,
  // so the control is always reachable with a single Tab.
  const tabbable = activeIndex >= 0 ? value : enabled[0];

  const select = useCallback(
    (next: string | undefined) => {
      if (next === undefined) return;
      onValueChange(next);
      nodes.current.get(next)?.focus();
    },
    [onValueChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (enabled.length === 0) return;
      const from = activeIndex >= 0 ? activeIndex : 0;
      if (PREV_KEYS.includes(event.key)) {
        event.preventDefault();
        select(enabled[(from - 1 + enabled.length) % enabled.length]);
      } else if (NEXT_KEYS.includes(event.key)) {
        event.preventDefault();
        select(enabled[(from + 1) % enabled.length]);
      } else if (event.key === 'Home') {
        event.preventDefault();
        select(enabled[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        select(enabled[enabled.length - 1]);
      } else if (event.key === ' ') {
        event.preventDefault();
        const current = event.currentTarget.dataset.value;
        if (current) select(current);
      }
    },
    [activeIndex, enabled, select],
  );

  const getItemProps = useCallback(
    (option: string) => ({
      role: 'radio' as const,
      type: 'button' as const,
      'data-value': option,
      'aria-checked': option === value,
      tabIndex: option === tabbable ? 0 : -1,
      ref: register(option),
      onKeyDown,
      onClick: () => onValueChange(option),
    }),
    [onKeyDown, onValueChange, register, tabbable, value],
  );

  return { getItemProps };
}

export { useRovingRadio };
