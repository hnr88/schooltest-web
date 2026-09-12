'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { RecallReportDialog } from '@/modules/teacher/components/RecallReportDialog';
import type { FamilyReportDialogsProps } from '@/modules/teacher/types/v2-family.types';

function FamilyReportDialogs({ actions, counts, heldCount, className }: FamilyReportDialogsProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const { confirm } = actions;
  if (confirm === null) return null;
  if (confirm.kind === 'recall') return <RecallReportDialog actions={actions} name={confirm.row.name} />;

  const copy =
    confirm.kind === 'release'
      ? {
          title: t('release.title', { name: confirm.row.name }),
          body: t(confirm.row.status.kind === 'recalled' ? 'release.bodyRecalled' : 'release.body'),
          cta: t('release.cta'),
        }
      : confirm.kind === 'releaseAll'
        ? {
            title: t('releaseAll.title', { count: heldCount }),
            body: [
              t('releaseAll.body', { count: heldCount }),
              counts.open > 0 ? t('releaseAll.open', { count: counts.open }) : null,
              counts.unscored > 0 ? t('releaseAll.unscored', { count: counts.unscored }) : null,
              counts.blocked > 0 ? t('releaseAll.blocked', { count: counts.blocked }) : null,
              t('releaseAll.tail'),
            ]
              .filter((part) => part !== null)
              .join(' '),
            cta: t('releaseAll.cta', { count: heldCount }),
          }
        : {
            title: t('nothingHeld.title'),
            body: t('nothingHeld.body', { className, count: counts.noResult }),
            cta: t('nothingHeld.cta'),
          };

  return (
    <OpsConfirmDialog
      open
      onOpenChange={(open) => (open ? undefined : actions.close())}
      title={copy.title}
      description={copy.body}
      confirmLabel={copy.cta}
      cancelLabel={t('cancel')}
      pending={actions.pending}
      error={actions.error}
      skin="teacher"
      onConfirm={actions.run}
    />
  );
}

export { FamilyReportDialogs };
