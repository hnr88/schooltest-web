'use client';

import { Fragment } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { formatRelativeTime } from '@/modules/ops/lib/relative-time';

import type { OpsSchoolCountCardsProps } from '@/modules/ops/types/components.types';

// The summary cards on the ops school detail page. Split out of
// OpsSchoolDetail so that component stays under the 120-line cap.
//
// ops/12 — rebuilt to the design's FOUR cards (`Ops Portal.dc.html:281-289`):
// Students, Teachers, Tests this term and Last activity, separated by
// hairline dividers inside one panel.
//  - the classes count moved onto the Classes tab badge and the admins count
//    onto the Admins tab badge, where the design puts them — a number shown
//    twice on one screen reads as two different facts;
//  - "Tests this term" is a stat, not a link (D-17);
//  - Last activity reads `last_active_at` through ops/07's relative-time
//    helper ("Never" for null, rendered from the catalogue so it translates);
//  - the Teachers card keeps `portal_teacher_count` — teacher-role accounts
//    ONLY; the legacy `teacher_count` still means teachers plus school admins
//    for its existing callers, and showing it under a label reading
//    "Teachers" was counting admins twice on one screen.
//
// ops/43 (R-23): the Teachers card is no longer a click-through — teachers
// live in the drawn Teachers tab (`OpsSchoolTables.tsx`), not behind a stat
// card (`Ops Portal.dc.html:280-290` draws four plain figures, never links).
export function OpsSchoolCountCards({ school }: OpsSchoolCountCardsProps) {
  const t = useTranslations('Ops.detail');
  const locale = useLocale();

  const lastActivity =
    school.last_active_at === null
      ? t('neverValue')
      : formatRelativeTime(school.last_active_at, new Date(), locale);

  const cards = [
    { label: t('studentsLabel'), value: String(school.student_count) },
    { label: t('teachersLabel'), value: String(school.portal_teacher_count) },
    { label: t('testsTermLabel'), value: String(school.results_count) },
    { label: t('lastActivityLabel'), value: lastActivity },
  ];

  return (
    <div data-slot="ops-count-cards" className="flex flex-wrap rounded-card bg-card p-6 shadow-sm">
      {cards.map((card, index) => (
        <Fragment key={card.label}>
          {index > 0 ? (
            <div
              aria-hidden="true"
              className="mx-6 hidden w-px self-stretch bg-divider sm:block"
            />
          ) : null}
          <div
            data-slot="ops-count-card"
            data-count-label={card.label}
            className="flex min-w-[140px] flex-1 flex-col gap-1.5 py-1"
          >
            <span className="text-caption text-muted-foreground">{card.label}</span>
            <span
              data-slot="ops-count-value"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {card.value}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
