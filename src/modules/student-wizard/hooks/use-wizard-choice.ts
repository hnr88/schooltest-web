'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

import type { WizardChoiceItemProps } from '@/modules/student-wizard/types/student-wizard.types';

const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];

// WAI-ARIA radiogroup keyboard contract for the portal chip row (spec 03 §1.4).
// A radiogroup is ONE tab stop: arrows move AND select, Home/End jump to the ends,
// and both wrap. `053-wizard-controls.spec.ts` asserts every clause of this.
export function useWizardChoice(
  values: readonly string[],
  value: string,
  onValueChange: (next: string) => void,
) {
  const nodes = useRef(new Map<string, HTMLButtonElement>());

  const register = useCallback(
    (option: string) => (node: HTMLButtonElement | null) => {
      if (node) nodes.current.set(option, node);
      else nodes.current.delete(option);
    },
    [],
  );

  const activeIndex = values.indexOf(value);
  // Nothing selected yet → the FIRST option carries the group's tab stop, so the
  // control is always reachable with a single Tab.
  const tabbable = activeIndex >= 0 ? value : values[0];

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
      if (values.length === 0) return;
      const from = activeIndex >= 0 ? activeIndex : 0;
      if (PREV_KEYS.includes(event.key)) {
        event.preventDefault();
        select(values[(from - 1 + values.length) % values.length]);
      } else if (NEXT_KEYS.includes(event.key)) {
        event.preventDefault();
        select(values[(from + 1) % values.length]);
      } else if (event.key === 'Home') {
        event.preventDefault();
        select(values[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        select(values[values.length - 1]);
      } else if (event.key === ' ') {
        event.preventDefault();
        select(event.currentTarget.dataset.value);
      }
    },
    [activeIndex, select, values],
  );

  return useCallback(
    (option: string): WizardChoiceItemProps => ({
      role: 'radio',
      type: 'button',
      'data-value': option,
      'aria-checked': option === value,
      tabIndex: option === tabbable ? 0 : -1,
      ref: register(option),
      onKeyDown,
      onClick: () => onValueChange(option),
    }),
    [onKeyDown, onValueChange, register, tabbable, value],
  );
}
