'use client';

import { Checkbox } from '@/modules/design-system';

import type { ClassMemberChecklistProps, ClassMemberOption } from '@/modules/classes/types/components.types';

// Checkbox list backing the teacher/student pickers (documentId arrays). The
// Base UI checkbox is a button, so each row wires the label span by id.
export function ClassMemberChecklist({
  idPrefix,
  options,
  value,
  onChange,
  emptyText,
}: ClassMemberChecklistProps) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const toggle = (option: string, checked: boolean) => {
    onChange(checked ? [...value, option] : value.filter((entry) => entry !== option));
  };

  return (
    <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
      {options.map((option) => {
        const labelId = `${idPrefix}-${option.value}-label`;
        return (
          <li key={option.value} className="flex min-h-11 items-center gap-3 px-2">
            <Checkbox
              id={`${idPrefix}-${option.value}`}
              aria-labelledby={labelId}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
            />
            <span id={labelId} className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              {option.hint ? (
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
