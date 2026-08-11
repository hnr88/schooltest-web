'use client';

import { useTranslations } from 'next-intl';

import { SuggestedGroupCard } from '@/modules/teacher/components/SuggestedGroupCard';
import type { SuggestedGroupsSectionProps } from '@/modules/teacher/types/teaching-insights.types';

// .qa/DESIGN.md §Teaching insights (2): "Suggested groups" — "Students grouped by
// their primary gap for targeted instruction", one card per group.
//
// C-TR-3 partitions the class server-side by each student's PRIMARY gap and omits
// an empty group, so the cards are rendered exactly as sent: this component
// assigns nobody, merges nothing and adds no "everyone else" bucket. A student
// whose latest result carries no complete profile is not in any group because the
// endpoint did not put them in one.
function SuggestedGroupsSection({ groups }: SuggestedGroupsSectionProps) {
  const t = useTranslations('Teacher.results.insights');

  return (
    <section
      data-slot="suggested-groups"
      aria-labelledby="suggested-groups-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="suggested-groups-heading" className="text-panel-title font-bold text-foreground">
          {t('groupsTitle')}
        </h2>
        <p className="text-meta text-muted-foreground">{t('groupsCaption')}</p>
      </div>

      {groups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <SuggestedGroupCard key={group.key} group={group} />
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-balance text-body">{t('groupsNone')}</p>
      )}
    </section>
  );
}

export { SuggestedGroupsSection };
