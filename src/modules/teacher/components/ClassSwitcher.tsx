'use client';

import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import type { ClassSwitcherProps } from '@/modules/teacher/types/results-shell.types';

/**
 * The class-detail header select (`Teacher Portal v2:531–540`) over the SAME
 * cached C-TD-1 `classes[]` the screen already reads — no second query, no
 * second source of the class list. `TestSessionSelect`'s shape (Base UI Select
 * with `items`, so `SelectValue` resolves labels instead of printing raw
 * documentIds), minus the `FieldShell`: the design shows a bare select, so its
 * accessible name is a label, not visible text.
 */
function ClassSwitcher({ options, value, onValueChange }: ClassSwitcherProps) {
  const t = useTranslations('Teacher.results.classSwitcher');

  return (
    <Select<string, false>
      items={options}
      value={value}
      onValueChange={(next) => {
        // Base UI hands the change handler a NULLABLE value: a dismissed or
        // cleared select must keep the CURRENT class, never navigate to an
        // undefined one (TestSessionSelect adapts the same signature).
        if (next !== null) onValueChange(next);
      }}
    >
      <SelectTrigger
        data-slot="class-switcher"
        aria-label={t('label')}
        className="h-10 w-auto max-w-56 flex-none rounded-lg border-border bg-card px-3 text-body-sm font-semibold text-foreground"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { ClassSwitcher };
