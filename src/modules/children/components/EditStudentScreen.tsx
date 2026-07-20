'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { WizardScreen } from '@/modules/student-wizard';
import { useEditStudent } from '@/modules/children/hooks/use-edit-student';

interface EditStudentScreenProps {
  documentId: string;
}

// C-UI-MYCHILDREN edit: mounts the C-UI-STUDENT-WIZARD in edit mode once the
// detail read resolves (prefilled from it; passport_number stays empty). 403/404
// → error state with a back-to-list CTA; loading → skeleton.
export function EditStudentScreen({ documentId }: EditStudentScreenProps) {
  const t = useTranslations('Children');
  const { initialValues, isLoading, isError, handleSubmit } = useEditStudent(documentId);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7">
        <div className="mx-auto flex w-full max-w-160 flex-col gap-6" aria-hidden="true">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      </main>
    );
  }

  if (isError || !initialValues) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
        <div className="mx-auto w-full max-w-160">
          <Alert
            variant="error"
            title={t('editErrorTitle')}
            action={
              <Button href="/dashboard/children" variant="outline" size="sm">
                {t('backToList')}
              </Button>
            }
          >
            {t('editErrorDescription')}
          </Alert>
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
