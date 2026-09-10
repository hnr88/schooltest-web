'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { SchoolClass } from '@/modules/classes';
import {
  Alert,
  Button,
  DataPanel,
  NativeSelect,
  NativeSelectOption,
} from '@/modules/design-system';
import { classAssignOptions } from '@/modules/school-students/lib/class-options';
import { useUpdateStudentMutation } from '@/modules/school-students/queries/use-update-student.mutation';

import type { SchoolStudentRecord } from '@/modules/school-students/types/school-students.types';

interface StudentClassPanelProps {
  student: SchoolStudentRecord;
  classes: readonly SchoolClass[];
}

export function StudentClassPanel({ student, classes }: StudentClassPanelProps) {
  const t = useTranslations('SchoolStudents.detail.classPanel');
  const [selected, setSelected] = useState('');
  const update = useUpdateStudentMutation();
  const pending = update.isPending;
  const current = student.class;
  const options = classAssignOptions(classes, current?.documentId ?? null);

  const mutateClass = (class_documentId: string | null) => {
    update.mutate(
      { documentId: student.documentId, body: { class_documentId } },
      { onSuccess: () => setSelected('') },
    );
  };

  return (
    <DataPanel data-slot="student-class-panel" className="max-w-2xl">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      </div>
      {update.isError ? (
        <div className="border-t border-border px-4 py-3">
          <Alert variant="error" title={t('errorTitle')}>
            {t('errorDescription')}
          </Alert>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-3">
        <span className="text-meta text-body">{t('currentLabel')}</span>
        <span data-slot="student-class-current" className="truncate text-sm font-medium text-foreground">
          {current === null || current.name === null ? (
            t('none')
          ) : (
            <Link
              href={`/dashboard/school/classes/${current.documentId}`}
              className="underline-offset-2 hover:underline"
            >
              {current.name}
            </Link>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border px-4 py-4">
        {options.length === 0 ? (
          <p className="text-sm text-body">{t('noClasses')}</p>
        ) : (
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="student-class-assign" className="text-meta text-body">
              {t('assignLabel')}
            </label>
            <NativeSelect
              id="student-class-assign"
              className="w-full min-w-56"
              value={selected}
              disabled={pending}
              onChange={(event) => setSelected(event.target.value)}
            >
              <NativeSelectOption value="">{t('assignPlaceholder')}</NativeSelectOption>
              {options.map((option) => (
                <NativeSelectOption key={option.documentId} value={option.documentId}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
        <div className="flex items-center gap-2">
          {options.length > 0 ? (
            <Button
              type="button"
              size="sm"
              loading={pending}
              disabled={selected === ''}
              onClick={() => void mutateClass(selected)}
            >
              {t('assignAction')}
            </Button>
          ) : null}
          {current !== null ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={pending}
              onClick={() => void mutateClass(null)}
            >
              {t('removeAction')}
            </Button>
          ) : null}
        </div>
      </div>
    </DataPanel>
  );
}
