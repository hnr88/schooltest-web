'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildSettingsRow } from '@/modules/settings/components/ChildSettingsRow';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import { useStudentsQuery } from '@/modules/dashboard';

export function ChildrenSettingsPanel() {
  const t = useTranslations('Settings');
  const query = useStudentsQuery();
  const students = query.data?.data ?? [];

  return (
    <SettingsPanel
      id="settings-children"
      title={t('childrenSettingsTitle')}
      description={t('childrenSettingsDescription')}
      action={
        <Button href="/dashboard/children" variant="outline" className="min-h-11 px-4">
          {t('manageChildren')}
        </Button>
      }
    >
      {query.isLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : query.isError ? (
        <Alert
          variant="error"
          title={t('childrenSettingsLoadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-4"
              onClick={() => query.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('childrenSettingsLoadErrorDescription')}
        </Alert>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-tile bg-muted p-4">
          <p className="text-sm text-foreground">{t('childrenSettingsEmpty')}</p>
          <Button href="/dashboard/children/new" className="min-h-11 px-4">
            <Plus aria-hidden="true" className="size-4" />
            {t('addChild')}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col">
          {students.map((student) => (
            <ChildSettingsRow key={student.documentId} student={student} />
          ))}
        </ul>
      )}
    </SettingsPanel>
  );
}
