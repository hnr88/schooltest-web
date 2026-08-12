'use client';

import { CircleSlash, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { StartTestSessionForm } from '@/modules/teacher/components/StartTestSessionForm';
import { useStartTestSessionForm } from '@/modules/teacher/hooks/useStartTestSessionForm';

// .qa/DESIGN.md §Test sessions (view 1): the "Start a test session" panel —
// Class picker, Test picker, "Generate join code". Both option lists come from
// live reads; there is no literal fallback list anywhere below, so a failed
// read renders the error branch rather than a picker that looks populated.
function StartTestSessionPanel() {
  const t = useTranslations('Teacher.testSessions.setup');
  const { form, onSubmit, classOptions, testOptions, status, isGenerating, retry } =
    useStartTestSessionForm();

  return (
    <section
      data-slot="test-session-setup"
      data-status={status}
      className="flex flex-col gap-5 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-panel-title font-bold text-foreground">{t('panelTitle')}</h2>
        <p className="text-body-sm text-muted-foreground">{t('panelDescription')}</p>
      </div>

      {status === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : null}

      {status === 'error' ? (
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button variant="outline" size="sm" onClick={retry}>
              {t('retry')}
            </Button>
          }
        >
          {t('loadErrorBody')}
        </Alert>
      ) : null}

      {status === 'no-classes' ? (
        <EmptyState
          icon={Users}
          title={t('noClassesTitle')}
          description={t('noClassesDescription')}
          className="border-none px-0 py-2"
        />
      ) : null}

      {status === 'no-tests' ? (
        <EmptyState
          icon={CircleSlash}
          title={t('noTestsTitle')}
          description={t('noTestsDescription')}
          className="border-none px-0 py-2"
        />
      ) : null}

      {status === 'ready' ? (
        <StartTestSessionForm
          form={form}
          onSubmit={onSubmit}
          classOptions={classOptions}
          testOptions={testOptions}
          isGenerating={isGenerating}
        />
      ) : null}
    </section>
  );
}

export { StartTestSessionPanel };
