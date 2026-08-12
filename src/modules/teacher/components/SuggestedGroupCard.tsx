'use client';

import { useTranslations } from 'next-intl';

import type { SuggestedGroupCardProps } from '@/modules/teacher/types/teaching-insights.types';

// One "Suggested groups" card (.qa/DESIGN.md §Teaching insights 2): title, count,
// the member NAMES and the one-line teaching note.
//
// `label` and `hint` are C-TR-3 fields — the active crosswalk's descriptor name
// and descriptor text (and, for the `no_gaps` bucket, the server's own reference
// copy). This component writes NO teaching advice of its own and maps NO key to a
// phrase: a client-side label table would be a second, drifting codebook.
function SuggestedGroupCard({ group }: SuggestedGroupCardProps) {
  const t = useTranslations('Teacher.results.insights');

  return (
    <article
      data-slot="suggested-group"
      data-group-key={group.key}
      className="flex flex-col gap-3 rounded-panel border border-border bg-card px-5 py-5"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-base font-semibold break-words text-foreground">{group.label}</h3>
        <p className="text-meta font-medium text-muted-foreground">
          {t('groupStudents', { count: group.students.length })}
        </p>
      </div>

      <ul className="flex flex-col gap-1">
        {group.students.map((student) => (
          <li key={student.student_document_id} className="text-body-sm text-body">
            {student.display_name}
          </li>
        ))}
      </ul>

      <p className="text-meta text-balance text-muted-foreground">{group.hint}</p>
    </article>
  );
}

export { SuggestedGroupCard };
