'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, SelectField } from '@/modules/design-system';
import { OpsViewAsTeacherData } from '@/modules/ops/components/OpsViewAsTeacherData';
import { useOpsSchoolsQuery } from '@/modules/ops/queries/use-ops-schools.query';
import { useSchoolStaffQuery } from '@/modules/ops/queries/use-school-staff.query';
import { useViewAsTeacherQuery } from '@/modules/ops/queries/use-view-as-teacher.query';
import { isNotFound } from '@/modules/ops/lib/ops-view-as-teacher.helpers';

// Ops view-as-teacher panel (task 70, C-OPS-04, mvp-updates 4.2): pick the
// school (C-OPS-01) then the teacher (the school's staff from the C-OPS-01
// detail relations); the read-only result is the teacher's exact scoped
// payload set. Every call is audit-logged server-side.
export function OpsViewAsTeacher() {
  const t = useTranslations('Ops.tools.viewAs');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const authed = hydrated && Boolean(token);
  const schoolsQuery = useOpsSchoolsQuery(authed);
  const [schoolId, setSchoolId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const staffQuery = useSchoolStaffQuery(schoolId, authed);
  const viewQuery = useViewAsTeacherQuery(teacherId, authed);

  const schoolOptions = (schoolsQuery.data ?? []).map((school) => ({
    value: school.documentId,
    label: school.name,
  }));
  const teacherOptions = (staffQuery.data ?? []).map((user) => ({
    value: user.documentId,
    label:
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.email ||
      user.documentId,
  }));

  const pickSchool = (value: string) => {
    setSchoolId(value);
    setTeacherId('');
  };

  return (
    <section
      data-slot="ops-view-as-teacher"
      data-surface="ops-view-as-teacher"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="ops-view-as-school-picker"
          label={t('schoolLabel')}
          placeholder={t('schoolPlaceholder')}
          options={schoolOptions}
          value={schoolId}
          onValueChange={pickSchool}
          disabled={!schoolsQuery.isSuccess || schoolOptions.length === 0}
        />
        <SelectField
          id="ops-view-as-teacher-picker"
          label={t('teacherLabel')}
          placeholder={t('teacherPlaceholder')}
          options={teacherOptions}
          value={teacherId}
          onValueChange={setTeacherId}
          disabled={!staffQuery.isSuccess || teacherOptions.length === 0}
        />
      </div>
      {viewQuery.isError ? (
        <Alert
          variant="error"
          title={isNotFound(viewQuery.error) ? t('notFoundTitle') : t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={viewQuery.isFetching}
              onClick={() => viewQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {isNotFound(viewQuery.error) ? t('notFoundDescription') : t('errorDescription')}
        </Alert>
      ) : null}
      {viewQuery.data ? <OpsViewAsTeacherData view={viewQuery.data} /> : null}
    </section>
  );
}
