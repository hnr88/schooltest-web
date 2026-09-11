'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogTitle,
} from '@/modules/design-system';
import { useRouter } from '@/i18n/navigation';
import { useDebouncedValue } from '@/modules/school-command/hooks/use-debounced-value';
import { useSchoolCommandResults } from '@/modules/school-command/hooks/use-school-command-results';
import type { SchoolCommandItem } from '@/modules/school-command/types/school-command.types';

// School Admin Portal artboard, "global Search dialog and result groups": the
// ⌘K palette, rebuilt on the OpsDialog chrome (560px, radius 20, top-anchored).
// Blank state = cmdk Empty; results arrive grouped (Classes / Teachers /
// Students) with the group count beside each heading — classes and teachers
// counts are the filtered array lengths over the C-CLS-01/C-TCH-01 lists, the
// students count is the C-CHD-01 payload's meta.pagination.total (the q filter
// is applied server-side before pagination). Every result row opens the
// entity's own page.
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

  const badge = (label: string) => label.trim().charAt(0).toUpperCase() || '•';

  return (
    <OpsDialog open={open} onOpenChange={onOpenChange}>
      <OpsDialogContent
        data-slot="school-search-dialog"
        className="top-[120px] left-1/2 translate-y-0 -translate-x-1/2 overflow-hidden rounded-[20px] sm:max-w-[560px]"
      >
        <OpsDialogTitle className="sr-only">{t('triggerLabel')}</OpsDialogTitle>
        <OpsDialogDescription className="sr-only">{t('placeholder')}</OpsDialogDescription>
        <CommandPrimitive className="flex size-full flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[#EEF1F6] px-5 py-4">
            <Search aria-hidden="true" className="size-[17px] shrink-0 text-[#7C8698]" />
            <CommandPrimitive.Input
              value={raw}
              onValueChange={setRaw}
              placeholder={t('placeholder')}
              className="h-6 w-full flex-1 border-none bg-transparent text-[15px] text-[#0E2350] outline-none placeholder:text-[#7C8698]"
            />
          </div>
          <CommandPrimitive.List className="max-h-[340px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-9 text-center text-[13.5px] text-[#7C8698]">
              {t('empty')}
            </CommandPrimitive.Empty>
            {results.classes.length > 0 ? (
              <CommandPrimitive.Group
                heading={t('groups.classes', { count: results.classesTotal })}
                className="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {results.classes.map((item) => (
                  <CommandPrimitive.Item
                    key={`class-${item.id}`}
                    value={`${item.label} class`}
                    onSelect={() => open_(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-[11px] text-sm outline-none data-[selected=true]:bg-[#F4F6FA]"
                  >
                    <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[#EEF1F6] text-xs font-semibold text-[#0E2350]">
                      {badge(item.label)}
                    </span>
                    <span className="min-w-0 truncate font-semibold text-[#0E2350]">{item.label}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}
            {results.teachers.length > 0 ? (
              <CommandPrimitive.Group
                heading={t('groups.teachers', { count: results.teachersTotal })}
                className="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {results.teachers.map((item) => (
                  <CommandPrimitive.Item
                    key={`teacher-${item.id}`}
                    value={`${item.label} ${item.meta ?? ''} teacher`}
                    onSelect={() => open_(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-[11px] text-sm outline-none data-[selected=true]:bg-[#F4F6FA]"
                  >
                    <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[#EEF1F6] text-xs font-semibold text-[#0E2350]">
                      {badge(item.label)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-[#0E2350]">{item.label}</span>
                      {item.meta ? (
                        <span className="truncate text-[12.5px] text-[#7C8698]">{item.meta}</span>
                      ) : null}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}
            {results.students.length > 0 ? (
              <CommandPrimitive.Group
                heading={
                  results.studentsTotal === null
                    ? t('groups.students', { count: results.students.length })
                    : t('groups.studentsTotal', { count: results.studentsTotal })
                }
                className="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {results.students.map((item) => (
                  <CommandPrimitive.Item
                    key={`student-${item.id}`}
                    value={`${item.label} ${item.meta ?? ''} student`}
                    onSelect={() => open_(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-[11px] text-sm outline-none data-[selected=true]:bg-[#F4F6FA]"
                  >
                    <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-[#EEF1F6] text-xs font-semibold text-[#0E2350]">
                      {badge(item.label)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-[#0E2350]">{item.label}</span>
                      {item.meta ? (
                        <span className="truncate text-[12.5px] text-[#7C8698]">{item.meta}</span>
                      ) : null}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </OpsDialogContent>
    </OpsDialog>
  );
}
