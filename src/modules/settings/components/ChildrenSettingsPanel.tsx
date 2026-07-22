'use client';

import { Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, Button, EmptyState, SkeletonCard } from '@/modules/design-system';
import { ChildSettingsRow } from '@/modules/settings/components/ChildSettingsRow';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import { PORTAL_GHOST_BUTTON_CLASS } from '@/modules/settings/constants/settings.constants';
import { useStudentsQuery } from '@/modules/dashboard';

// Canonical roster panel (App Screens 3f "Team", L3417-3422): a PanelHeaderRow with
// its action on the right, then flush rows on #F1F5F9 hairlines inside the one
// panel — never a card per person.
// The empty case is the canonical §03 EmptyState medallion rather than the module's
// own tinted block, and the loading case is the canonical SkeletonCard.
export function ChildrenSettingsPanel() {
  const t = useTranslations('Settings');
  const query = useStudentsQuery();
  const students = query.data?.data ?? [];

  if (query.isLoading) {
    return <SkeletonCard rows={4} className="rounded-card border-0" />;
  }

  return (
    <SettingsPanel
      id="settings-children"
      title={t('childrenSettingsTitle')}
      description={t('childrenSettingsDescription')}
      action={
        <Button
          href="/dashboard/children"
          variant="outline"
          className={PORTAL_GHOST_BUTTON_CLASS}
        >
          {t('manageChildren')}
        </Button>
      }
    >
      {query.isError ? (
        <Alert
          variant="error"
          title={t('childrenSettingsLoadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              className={PORTAL_GHOST_BUTTON_CLASS}
              onClick={() => query.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('childrenSettingsLoadErrorDescription')}
        </Alert>
      ) : students.length === 0 ? (
        <EmptyState
          tone="brand"
          icon={Users}
          title={t('childrenSettingsTitle')}
          description={t('childrenSettingsEmpty')}
          // EmptyState inks its description with --muted-foreground (#64748B),
          // which the tab-panel fade composites below AA. Re-inked to --color-body
          // (7.58:1); the design system is out of scope this round.
          className="border-divider [&>p+p]:text-body"
          action={
            <Button href="/dashboard/children/new" className="min-h-11 rounded-full px-5">
              <Plus aria-hidden="true" className="size-4" />
              {t('addChild')}
            </Button>
          }
        />
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
