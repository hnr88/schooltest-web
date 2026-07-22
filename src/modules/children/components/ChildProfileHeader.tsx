'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentInitials } from '@/lib/student-name';
import { Button } from '@/modules/design-system';
import { getChildProfileName } from '@/modules/children/lib/child-profile-display';
import { getHeroMetaFacts } from '@/modules/children/lib/child-profile-facts';
import type { ChildProgressStudent, StudentDetail } from '@/modules/children/types/children.types';

interface ChildProfileHeaderProps {
  student: ChildProgressStudent;
  detail?: StudentDetail;
}

// §B.1 DetailHeader — the back link, then the identity row: a 60px NAVY avatar
// (inverted against the list card's neutral one), the 28/500 name and the meta
// line, with the actions trailing.
//
// The design's two buttons are "Share with teacher" and "Assign practice"; both
// are unbound in the slice and both are BLOCKED here — no share/assign endpoint
// exists (G18, `POST /api/sessions` is not granted to a parent). The one real
// action on this record is the edit wizard, so that is the only one drawn.
export function ChildProfileHeader({ student, detail }: ChildProfileHeaderProps) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const format = useFormatter();
  const name = getChildProfileName(student, t('unknownStudent'));

  const facts = getHeroMetaFacts(student, {
    formatYear: (year) => tWizard('education.yearOption', { n: year }),
    school: detail?.current_school ?? null,
    born: detail?.date_of_birth
      ? format.dateTime(new Date(`${detail.date_of_birth}T00:00:00`), { dateStyle: 'long' })
      : null,
  });

  return (
    <div className="flex flex-col gap-3.5">
      <Link
        href="/dashboard/children"
        className="inline-flex w-fit items-center gap-1.5 rounded-full text-body-sm font-medium text-body transition-colors duration-200 ease-out-expo hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-well focus-visible:outline-none motion-reduce:transition-none"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        {t('backToList')}
      </Link>

      <div className="flex flex-wrap items-center gap-4 sm:gap-4.5">
        <span
          aria-hidden="true"
          className="grid size-15 shrink-0 place-items-center rounded-full bg-foreground text-h3 font-semibold text-card"
        >
          {getStudentInitials(student)}
        </span>
        <div className="flex min-w-50 flex-1 flex-col gap-1">
          <h1 className="text-portal-heading font-medium text-foreground">{name}</h1>
          <p className="text-body-md text-body">
            {facts.length > 0 ? facts.join(' · ') : t('heroNoDetails')}
          </p>
        </div>
        <Button
          href={`/dashboard/children/${student.documentId}/edit`}
          variant="outline"
          className="h-11 shrink-0 rounded-full border-portal-input bg-card px-5 font-semibold text-foreground hover:border-foreground hover:bg-card"
        >
          <Pencil aria-hidden="true" className="size-4" />
          {t('edit')}
        </Button>
      </div>
    </div>
  );
}
