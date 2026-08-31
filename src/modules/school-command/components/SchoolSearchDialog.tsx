'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useRouter } from '@/i18n/navigation';
import { useDebouncedValue } from '@/modules/school-command/hooks/use-debounced-value';
import { useSchoolCommandResults } from '@/modules/school-command/hooks/use-school-command-results';
import type { SchoolCommandItem } from '@/modules/school-command/types/school-command.types';

// School Admin Portal artboard, "global Search dialog and result groups": the
// ⌘K palette. Blank state = CommandEmpty; results arrive grouped (Classes /
// Teachers / Students) with the group count beside each heading — classes and
// teachers counts are the filtered array lengths over the C-CLS-01/C-TCH-01
// lists, the students count is the C-CHD-01 payload's meta.pagination.total
// (the q filter is applied server-side before pagination). Every result row
// opens the entity's own page.
export function SchoolSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useTranslations('SchoolCommand');
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const debounced = useDebouncedValue(raw, 250);
  const results = useSchoolCommandResults(debounced);

  const open_ = (item: SchoolCommandItem) => {
    onOpenChange(false);
    setRaw('');
    router.push(item.href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      {/* This repo's CommandDialog is the Dialog shell only — the cmdk
          Command root is the consumer's job (see components/ui/command.tsx). */}
      <Command>
        <CommandInput
          value={raw}
          onValueChange={setRaw}
          placeholder={t('placeholder')}
        />
        <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>
        {results.classes.length > 0 ? (
          <CommandGroup
            heading={t('groups.classes', { count: results.classesTotal })}
          >
            {results.classes.map((item) => (
              <CommandItem
                key={`class-${item.id}`}
                value={`${item.label} class`}
                onSelect={() => open_(item)}
              >
                <span className="min-w-0 truncate">{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {results.teachers.length > 0 ? (
          <CommandGroup
            heading={t('groups.teachers', { count: results.teachersTotal })}
          >
            {results.teachers.map((item) => (
              <CommandItem
                key={`teacher-${item.id}`}
                value={`${item.label} ${item.meta ?? ''} teacher`}
                onSelect={() => open_(item)}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.meta ? (
                    <span className="truncate text-meta text-muted-foreground">
                      {item.meta}
                    </span>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {results.students.length > 0 ? (
          <CommandGroup
            heading={
              results.studentsTotal === null
                ? t('groups.students', { count: results.students.length })
                : t('groups.studentsTotal', { count: results.studentsTotal })
            }
          >
            {results.students.map((item) => (
              <CommandItem
                key={`student-${item.id}`}
                value={`${item.label} ${item.meta ?? ''} student`}
                onSelect={() => open_(item)}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.meta ? (
                    <span className="truncate text-meta text-muted-foreground">
                      {item.meta}
                    </span>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
