'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/modules/design-system';
import { ChildSettingsRow } from '@/modules/settings/components/ChildSettingsRow';
import { useStudentsQuery } from '@/modules/dashboard';

export function ChildrenSettingsPanel() {
  const t = useTranslations('Settings');
  const query = useStudentsQuery();
  const students = query.data?.data ?? [];

  return (
    <section aria-labelledby="settings-children-title">
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle id="settings-children-title" className="font-semibold">
                {t('childrenSettingsTitle')}
              </CardTitle>
              <CardDescription>{t('childrenSettingsDescription')}</CardDescription>
            </div>
            <Button href="/dashboard/children" variant="outline" className="h-11 px-4">
              {t('manageChildren')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                  className="h-11 px-4"
                  onClick={() => query.refetch()}
                >
                  {t('retry')}
                </Button>
              }
            >
              {t('childrenSettingsLoadErrorDescription')}
            </Alert>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-xl bg-muted p-4">
              <p className="text-sm text-foreground">{t('childrenSettingsEmpty')}</p>
              <Button href="/dashboard/children/new" className="h-11 px-4">
                <Plus aria-hidden="true" className="size-4" />
                {t('addChild')}
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3">
              {students.map((student) => (
                <ChildSettingsRow key={student.documentId} student={student} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
