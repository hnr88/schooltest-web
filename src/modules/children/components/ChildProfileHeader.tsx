'use client';

import { Pencil } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { getStudentInitials } from '@/lib/student-name';
import { AvatarTint, Button, getAvatarTone, StatusPill } from '@/modules/design-system';
import { getChildProfileName } from '@/modules/children/lib/child-profile-display';
import { getHeroMetaFacts } from '@/modules/children/lib/child-profile-facts';
import { getStatusMeta, getStatusTone } from '@/modules/children/lib/student-display';
import type {
  ChildProgressMetrics,
  ChildProgressStudent,
  StudentDetail,
} from '@/modules/children/types/children.types';

interface ChildProfileHeaderProps {
  student: ChildProgressStudent;
  metrics: ChildProgressMetrics;
  detail?: StudentDetail;
}

// Canonical record hero (Child profile 2b): WHITE, radius 18, 72px tinted avatar,
// 24px name, then the meta line of REAL enrolment facts and the pill row. The
// canonical hero carries "Grade 4B · School · Born …" — facts, never a tagline —
// so a fact the API did not record is dropped rather than shown as an em dash.
export function ChildProfileHeader({ student, metrics, detail }: ChildProfileHeaderProps) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const format = useFormatter();
  const name = getChildProfileName(student, t('unknownStudent'));
  const status = getStatusMeta(student.status);

  const facts = getHeroMetaFacts(student, {
    formatYear: (year) => tWizard('education.yearOption', { n: year }),
    school: detail?.current_school ?? null,
    born: detail?.date_of_birth
      ? format.dateTime(new Date(`${detail.date_of_birth}T00:00:00`), { dateStyle: 'long' })
      : null,
  });

  return (
    <header
      data-slot="child-learning-hero"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:gap-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <AvatarTint
          initials={getStudentInitials(student)}
          tone={getAvatarTone(student.documentId)}
          size="lg"
          className="size-16 text-h3 sm:size-18"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="truncate text-h3 font-bold tracking-tight text-foreground">{name}</h1>
          <p className="text-body-sm text-muted-foreground">
            {facts.length > 0 ? facts.join(' · ') : t('heroNoDetails')}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <StatusPill tone={getStatusTone(student.status)}>{t(status.labelKey)}</StatusPill>
            {metrics.totalSessions > 0 ? (
              <StatusPill tone="info">
                {t('heroSessionsPill', { count: metrics.totalSessions })}
              </StatusPill>
            ) : null}
          </div>
        </div>
      </div>

      <Button
        href={`/dashboard/children/${student.documentId}/edit`}
        variant="outline"
        className="h-11 shrink-0 rounded-lg"
      >
        <Pencil aria-hidden="true" className="size-4" />
        {t('edit')}
      </Button>
    </header>
  );
}
