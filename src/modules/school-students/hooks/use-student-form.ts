'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { showOpsToast } from '@/modules/ops/actions';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import {
  buildStudentCreateBody,
  buildStudentUpdateBody,
} from '@/modules/school-students/lib/student-request';
import { useCreateStudentMutation } from '@/modules/school-students/queries/use-create-student.mutation';
import { useUpdateStudentMutation } from '@/modules/school-students/queries/use-update-student.mutation';
import {
  createSchoolStudentFormSchema,
  type SchoolStudentFormValues,
} from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

import type { StudentFormTarget } from '@/modules/school-students/types/hooks.types';
import { BLANK_VALUES } from '@/modules/school-students/constants/hooks.constants';

function initialValues(target: StudentFormTarget): SchoolStudentFormValues {
  if (target.mode === 'create') {
    return BLANK_VALUES;
  }
  const { student } = target;
  // NIGHT-2 (W-R3, SA-007 / IMP-1): every field the record carries is shown AS
  // STORED — the edit dialog used to blank first_language (and email, DOB,
  // year level, ACARA phase) even for a student who had one, so the form
  // contradicted the record it was editing (the IMP-1 import-vs-edit
  // disagreement alive in the dialog). The list row carries
  // first_language/acara_phase; the detail read adds email, date_of_birth and
  // year_level — absent fields stay blank. buildStudentUpdateBody diffs
  // against THESE same defaults, so an untouched edit still sends nothing for
  // an unchanged field (see lib/student-request).
  return {
    ...BLANK_VALUES,
    given_name: student.given_name ?? '',
    family_name: student.family_name ?? '',
    class_documentId: student.class?.documentId ?? '',
    first_language: student.first_language ?? '',
    acara_phase: student.acara_phase ?? '',
    email: student.email ?? '',
    date_of_birth: student.date_of_birth ?? '',
    year_level:
      student.year_level === null || student.year_level === undefined
        ? ''
        : String(student.year_level),
  };
}

function displayName(values: SchoolStudentFormValues): string {
  return `${values.given_name} ${values.family_name}`.trim();
}

// Form wiring for SchoolStudentForm (C-CHD-02 create / C-CHD-03 edit): schema,
// defaults, body building, mutation dispatch and toast/error classification.
// onDone fires after a successful save (page navigates back, dialog closes).
export function useStudentForm(target: StudentFormTarget, onDone: () => void) {
  const t = useTranslations('SchoolStudents.form');
  const tv = useTranslations('SchoolStudents.validation');
  const schema = useMemo(() => createSchoolStudentFormSchema(tv), [tv]);
  const create = useCreateStudentMutation();
  const update = useUpdateStudentMutation();
  const form = useForm<SchoolStudentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(target),
  });

  const pending = create.isPending || update.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      if (target.mode === 'create') {
        await create.mutateAsync(buildStudentCreateBody(values));
        showOpsToast({ tone: 'ok', message: t('createdToast', { name: displayName(values) }) });
      } else {
        const body = buildStudentUpdateBody(values, initialValues(target));
        if (Object.keys(body).length > 0) {
          await update.mutateAsync({ documentId: target.student.documentId, body });
          showOpsToast({ tone: 'ok', message: t('updatedToast', { name: displayName(values) }) });
        }
      }
      onDone();
    } catch (error) {
      showOpsToast({ tone: 'error', message: t(`${classifyStudentError(error)}Toast`) });
    }
  });

  return { form, submit, pending };
}
