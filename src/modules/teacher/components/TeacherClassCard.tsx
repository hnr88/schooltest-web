'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import { TeacherClassCompletionRow } from '@/modules/teacher/components/TeacherClassCompletionRow';
import type { TeacherClassCardProps } from '@/modules/teacher/types/teacher-dashboard.types';

// .qa/DESIGN.md §Dashboard — one card per class the teacher owns: class name,
// roster size, Test A / Test B completion counts, top subskill gap. Every value
// is C-TD-1's, rendered verbatim.
//
// `top_gap` is `null` in two truthful server-side cases — the class has no
// completed result at all, or no student bands `not_yet` on any attribute. The
// card cannot tell them apart and does not pretend to: it says there is no gap
// to report and explains why, and it NEVER invents an attribute, a name or a
// zero count to fill the slot. The subskill name itself is the crosswalk's
// (`top_gap.name`); there is no client-side codebook and no fallback to the bare
// R-code. The band is spelled out in words next to the tint, never colour alone.
function TeacherClassCard({ classCard }: TeacherClassCardProps) {
  const t = useTranslations('Teacher.dashboard');
  const topGap = classCard.top_gap;

  return (
    <article
      data-slot="teacher-class-card"
      data-class-id={classCard.class_document_id}
      data-top-gap={topGap ? topGap.attribute : 'none'}
      className="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex min-w-0 flex-col gap-1">
        <h2 className="text-panel-title font-semibold break-words text-foreground">
          {classCard.name}
        </h2>
        <p className="text-meta text-muted-foreground">
          {t('students', { count: classCard.student_count })}
        </p>
      </header>

      <dl className="flex flex-col gap-3">
        <TeacherClassCompletionRow label={t('testA')} completion={classCard.test_a} />
        <TeacherClassCompletionRow label={t('testB')} completion={classCard.test_b} />
      </dl>

      <div className="flex min-w-0 flex-col gap-2 rounded-tile bg-surface-inset p-3.5">
        <span className="text-meta font-semibold tracking-wide text-body uppercase">
          {t('topGap')}
        </span>
        {topGap ? (
          <>
            <span className="text-body-sm font-semibold break-words text-foreground">
              {topGap.name}
            </span>
            <StatusPill tone="danger">
              {t('notYetCount', { count: topGap.not_yet_count })}
            </StatusPill>
          </>
        ) : (
          <>
            <span className="text-body-sm font-semibold text-foreground">{t('noGap')}</span>
            <span className="text-meta text-balance text-body">{t('noGapHint')}</span>
          </>
        )}
      </div>
    </article>
  );
}

export { TeacherClassCard };
