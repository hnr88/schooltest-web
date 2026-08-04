'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import type { ClassFormTarget } from '@/modules/classes/types/hooks.types';
import { ClassFormDialog } from '@/modules/classes/components/ClassFormDialog';
import { ClassesTable } from '@/modules/classes/components/ClassesTable';
import { useSchoolClassesQuery } from '@/modules/classes/queries/use-school-classes.query';
import { Alert, Button, Skeleton } from '@/modules/design-system';

// School admin Classes screen (task 29, st-mvp-pivot): the C-CLS-01 roster
// with create (C-CLS-02), edit (C-CLS-03) and delete (C-CLS-04). The form
// dialog mounts fresh per target so its default values always match.
export function ClassesScreen() {
  const t = useTranslations('Classes');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const classesQuery = useSchoolClassesQuery(enabled);
  const [formTarget, setFormTarget] = useState<ClassFormTarget | null>(null);

  const isPending = !enabled || classesQuery.isPending;

  return (
    <main
      data-slot="school-classes"
      data-surface="school-admin-classes"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-body">{t('description')}</p>
        </div>
        <Button size="lg" onClick={() => setFormTarget({ mode: 'create' })}>
          <Plus className="size-4" aria-hidden />
          {t('addButton')}
        </Button>
      </div>
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : classesQuery.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={classesQuery.isFetching}
              onClick={() => void classesQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : (
        <ClassesTable
          rows={classesQuery.data ?? []}
          onEdit={(schoolClass) => setFormTarget({ mode: 'edit', schoolClass })}
        />
      )}
      {formTarget ? (
        <ClassFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
      ) : null}
    </main>
  );
}
