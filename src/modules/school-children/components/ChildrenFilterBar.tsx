'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import {
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import type { SchoolChildStatusFilter } from '@/modules/school-children/types/school-children.types';

interface ChildrenFilterBarProps {
  search: string;
  status: SchoolChildStatusFilter;
  classId: string;
  classes: SchoolClass[];
  onSearch: (value: string) => void;
  onStatus: (value: SchoolChildStatusFilter) => void;
  onClass: (value: string) => void;
}

// The C-CHD-01 filter controls: debounced name search (q), status and class.
// Values map 1:1 onto the contract query params; 'all' omits the param.
export function ChildrenFilterBar({
  search,
  status,
  classId,
  classes,
  onSearch,
  onStatus,
  onClass,
}: ChildrenFilterBarProps) {
  const t = useTranslations('SchoolChildren.filters');

  return (
    <div className="flex flex-wrap items-end gap-4">
      <FieldShell id="children-search" label={t('searchLabel')} className="min-w-56 flex-1">
        <Input
          id="children-search"
          type="search"
          autoComplete="off"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </FieldShell>
      <FieldShell id="children-status" label={t('statusLabel')} className="w-44">
        <NativeSelect
          id="children-status"
          className="w-full"
          value={status}
          onChange={(event) => onStatus(event.target.value as SchoolChildStatusFilter)}
        >
          <NativeSelectOption value="all">{t('statusAll')}</NativeSelectOption>
          <NativeSelectOption value="active">{t('statusActive')}</NativeSelectOption>
          <NativeSelectOption value="archived">{t('statusArchived')}</NativeSelectOption>
        </NativeSelect>
      </FieldShell>
      <FieldShell id="children-class" label={t('classLabel')} className="w-56">
        <NativeSelect
          id="children-class"
          className="w-full"
          value={classId}
          onChange={(event) => onClass(event.target.value)}
        >
          <NativeSelectOption value="all">{t('classAll')}</NativeSelectOption>
          {classes.map((schoolClass) => (
            <NativeSelectOption key={schoolClass.documentId} value={schoolClass.documentId}>
              {schoolClass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldShell>
    </div>
  );
}
