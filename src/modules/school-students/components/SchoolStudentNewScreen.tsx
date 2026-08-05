'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth';
import { useMeQuery } from '@/modules/auth';
import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Skeleton } from '@/modules/design-system';
import { SchoolStudentForm } from '@/modules/school-students/components/SchoolStudentForm';
import { BACK_CLASSES } from '@/modules/school-students/constants/components.constants';

// Add-student page (task 30, st-mvp-pivot): the single-purpose C-CHD-02 v2 form
// — name, email, year level, class, first-language picklist and the optional
// ACARA phase (school_admin only, D-10). Guardian and media steps from the
// parent wizard are not present in the school flow.
export function SchoolStudentNewScreen() {
  const t = useTranslations('SchoolStudents.form');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const classesQuery = useSchoolClassesQuery(enabled);
  const meQuery = useMeQuery(enabled);
  const showAcaraPhase = meQuery.data?.role?.type === SCHOOL_ADMIN_ROLE_TYPE;
  const backToRoster = () => router.push('/dashboard/school/students');

  return (
    <main
      data-slot="school-student-new"
      data-surface="school-admin-student-new"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <Link href="/dashboard/school/students" className={BACK_CLASSES}>
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('createTitle')}</h1>
        <p className="text-sm text-body">{t('createDescription')}</p>
      </div>
      {classesQuery.isPending ? (
        <div className="flex max-w-2xl flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
          <SchoolStudentForm
            target={{ mode: 'create' }}
            classes={classesQuery.data ?? []}
            showAcaraPhase={showAcaraPhase}
            onCancel={backToRoster}
            onDone={backToRoster}
          />
        </div>
      )}
    </main>
  );
}
