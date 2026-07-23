'use client';

import { useTranslations } from 'next-intl';

import { UserRoundX } from 'lucide-react';

import { Button, Skeleton } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { WizardScreen } from '@/modules/student-wizard';
import { useEditStudent } from '@/modules/children/hooks/use-edit-student';

interface EditStudentScreenProps {
  documentId: string;
}

// C-UI-MYCHILDREN edit: mounts the C-UI-STUDENT-WIZARD in edit mode once the
// detail read resolves (prefilled from it; passport_number stays empty). The read
// failure is classified (gone / forbidden / broken) rather than collapsed into one
// alert; loading → skeleton.
export function EditStudentScreen({ documentId }: EditStudentScreenProps) {
  const t = useTranslations('Children');
  const { initialValues, error, isFetching, isLoading, isError, refetch, handleSubmit } =
    useEditStudent(documentId);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7">
        <div className="flex w-full max-w-160 flex-col gap-6" aria-hidden="true">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      </main>
    );
  }

  if (isError || !initialValues) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7">
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            goneIcon={UserRoundX}
            goneTitle={t('editGoneTitle')}
            goneDescription={t('editGoneDescription')}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button href="/dashboard/children" variant="outline" size="sm" className="h-11 px-4">
                {t('backToList')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <WizardScreen
      mode="edit"
      documentId={documentId}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
}
