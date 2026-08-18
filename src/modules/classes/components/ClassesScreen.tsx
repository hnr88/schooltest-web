'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { AddClassDialog } from '@/modules/classes/components/AddClassDialog';
import { EditClassDialog } from '@/modules/classes/components/EditClassDialog';
import { ClassesTable } from '@/modules/classes/components/ClassesTable';
import { testsCompletedByClass } from '@/modules/classes/lib/classes-table.helpers';
import { useSchoolClassesQuery } from '@/modules/classes/queries/use-school-classes.query';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { useParticipationQuery } from '@/modules/school-admin';

// School admin Classes screen (spec §2): the C-CLS-01 roster joined with the
// C-RPT-04 per-test completion, plus create (the add-class modal), edit
// (C-CLS-03) and delete (C-CLS-04). Participation failing is NOT fatal — the
// roster still renders and the completion column falls back to the empty value.
export function ClassesScreen() {
  const t = useTranslations('Classes');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const classesQuery = useSchoolClassesQuery(enabled);
  const participationQuery = useParticipationQuery(enabled);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolClass | null>(null);

  const isPending = !enabled || classesQuery.isPending || participationQuery.isPending;

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
        <Button variant="accent" size="lg" onClick={() => setAddOpen(true)}>
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
          completions={
            participationQuery.isError ? null : testsCompletedByClass(participationQuery.data)
          }
          onEdit={(schoolClass) => setEditTarget(schoolClass)}
        />
      )}
      {addOpen ? <AddClassDialog onClose={() => setAddOpen(false)} /> : null}
      {editTarget ? (
        <EditClassDialog
          schoolClass={{
            documentId: editTarget.documentId,
            name: editTarget.name,
            // One teacher per class (spec §1): the list row's first assigned
            // teacher seeds the single dropdown.
            teacher: editTarget.teachers[0] ?? null,
          }}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
    </main>
  );
}
