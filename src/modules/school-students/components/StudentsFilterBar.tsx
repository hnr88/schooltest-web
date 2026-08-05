'use client';

import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import {
  FieldShell,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import { ACARA_PHASE_OPTIONS } from '@/modules/school-students/constants/student-picklists.constants';
import type { SchoolStudentLevelFilter } from '@/modules/school-students/types/school-students.types';

import type { StudentsFilterBarProps } from '@/modules/school-students/types/components.types';

// Spec §4 controls: a full-width name search above two dropdowns. Search and
// class map 1:1 onto the C-CHD-01 query params ('all' omits the param); level
// narrows the rows those params returned. All three are additive.
export function StudentsFilterBar({
  search,
  classId,
  level,
  classes,
  onSearch,
  onClass,
  onLevel,
}: StudentsFilterBarProps) {
  const t = useTranslations('SchoolStudents.filters');
  const tf = useTranslations('SchoolStudents.form');

  return (
    <div className="flex flex-col gap-3">
      <FieldShell id="students-search" label={t('searchLabel')} className="w-full">
        <Input
          id="students-search"
          type="search"
          autoComplete="off"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </FieldShell>
      <div className="flex flex-wrap items-end gap-4">
        <FieldShell id="students-class" label={t('classLabel')} className="w-56">
          <NativeSelect
            id="students-class"
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
        <FieldShell id="students-level" label={t('levelLabel')} className="w-56">
          <NativeSelect
            id="students-level"
            className="w-full"
            value={level}
            onChange={(event) => onLevel(event.target.value as SchoolStudentLevelFilter)}
          >
            <NativeSelectOption value="all">{t('levelAll')}</NativeSelectOption>
            {ACARA_PHASE_OPTIONS.map((phase) => (
              <NativeSelectOption key={phase} value={phase}>
                {tf(`acaraPhaseOption.${phase}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FieldShell>
      </div>
    </div>
  );
}
