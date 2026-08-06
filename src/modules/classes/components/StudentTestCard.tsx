'use client';

import { useTranslations } from 'next-intl';

import { SubskillTile } from '@/modules/classes/components/SubskillTile';
import { SUBSKILL_ORDER } from '@/modules/classes/constants/subskills.constants';
import { EMPTY_VALUE } from '@/modules/classes/lib/class-detail.helpers';

import type { StudentTestCardProps } from '@/modules/classes/types/components.types';

// Spec §2 test card: the title on the left, overall score and ACARA phase on
// the right, and the seven subskill tiles below in the spec's FIXED order
// (decoding … critical, read from SUBSKILL_ORDER — never re-typed inline).
// The phase is printed exactly as the backend returned it.
export function StudentTestCard({ test }: StudentTestCardProps) {
  const t = useTranslations('Classes.studentDetail');
  const { subskills } = test;

  return (
    <section
      aria-labelledby={`test-${test.test_id}-heading`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 id={`test-${test.test_id}-heading`} className="text-base font-medium text-foreground">
          {t('cardTitle', { slot: test.test_id })}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
          <span>
            {t('overallLabel')}{' '}
            <span className="font-medium text-foreground">
              {test.overall_score === null
                ? EMPTY_VALUE
                : t('overallValue', { score: test.overall_score })}
            </span>
          </span>
          <span>
            {t('acaraLabel')}{' '}
            <span className="font-medium text-foreground">
              {test.acara_phase ?? EMPTY_VALUE}
            </span>
          </span>
        </div>
      </div>
      {subskills === null ? (
        <p className="text-sm text-muted-foreground">{t('noSubskills')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {SUBSKILL_ORDER.map((subskill) => (
            <SubskillTile
              key={subskill}
              subskill={subskill}
              verdict={subskills[subskill]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
