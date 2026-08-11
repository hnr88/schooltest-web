'use client';

import { useTranslations } from 'next-intl';

import { ProgressAcaraCard } from '@/modules/teacher/components/ProgressAcaraCard';
import { acaraMovementCards } from '@/modules/teacher/lib/class-progress';
import type { ProgressAcaraSectionProps } from '@/modules/teacher/types/class-progress.types';

// .qa/DESIGN.md §Progress tab: "ACARA phase movement" — three cards, `7 Moved up
// a phase` with its `3 Beginning → Emerging` breakdown, `11 Same phase` with
// "Score improved within phase for 8 of these", `1 Moved down`.
//
// All three counts and both breakdowns are C-TR-4's `acara_movement`, computed
// over the both-tests cohort. The card list is built by `acaraMovementCards` and
// the phase names are echoed from the wire: no client-side phase ladder exists
// here, so a crosswalk change cannot leave this tab stale.
function ProgressAcaraSection({ movement }: ProgressAcaraSectionProps) {
  const t = useTranslations('Teacher.results.progress');
  const cards = acaraMovementCards(movement);

  return (
    <section
      data-slot="progress-acara"
      aria-labelledby="progress-acara-heading"
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <h2 id="progress-acara-heading" className="text-panel-title font-bold text-foreground">
        {t('acaraTitle')}
      </h2>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <ProgressAcaraCard key={card.key} card={card} />
        ))}
      </ul>
    </section>
  );
}

export { ProgressAcaraSection };
