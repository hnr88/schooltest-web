'use client';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import type { SettingsSelectFieldProps } from '@/modules/settings/types/settings.types';

export function SettingsSelectField<T extends string | number>({
  id,
  label,
  options,
  value,
  onValueChange,
}: SettingsSelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select<T, false>
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <SelectTrigger id={id} className="min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={option.value}
              className="focus:bg-muted focus:text-foreground data-highlighted:bg-muted data-highlighted:text-foreground data-selected:bg-muted data-selected:text-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
