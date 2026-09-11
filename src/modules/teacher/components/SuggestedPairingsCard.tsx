'use client';

import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import type { SuggestedPairingsCardProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights · Suggested pairings (`:832–851`), from `peerPairings()` on the class
// focus: the strongest scorer beside the weakest while the gap is at least 12 points,
// walking in from both ends, at most four pairs. No pair clearing the gap is said in words.
function SuggestedPairingsCard({ pairings }: SuggestedPairingsCardProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  const locale = useLocale();

  if (pairings.skill === null) return null;
  const skill = tv(pairings.skill.labelKey).toLocaleLowerCase(locale);
  const hasPairs = pairings.pairs.length > 0;

  return (
    <SectionCard
      data-insights-section="pairings"
      data-skill={pairings.skill.skill}
      data-pairs={pairings.pairs.length}
      title={t('pairings.title')}
      description={t(hasPairs ? 'pairings.intro' : 'pairings.none', { skill })}
    >
      {hasPairs ? (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          {pairings.pairs.map((pair) => (
            <li
              key={`${pair.strong.studentDocumentId}-${pair.support.studentDocumentId}`}
              data-slot="insights-pair"
              className="flex items-center gap-3 rounded-[10px] border border-[#ECEEF2] px-[18px] py-4"
            >
              <PairSide name={pair.strong.firstName} label={t('pairings.strong', { score: pair.strong.score })} tone="text-[#1F7A4D]" />
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                <path d="M8 7h11M8 7l3-3M8 7l3 3M16 17H5M16 17l-3-3M16 17l-3 3" />
              </svg>
              <PairSide name={pair.support.firstName} label={t('pairings.support', { score: pair.support.score })} tone="text-[#92610B]" />
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}

function PairSide({ name, label, tone }: { name: string; label: string; tone: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="text-[14px] font-semibold text-navy-900">{name}</div>
      <div className={cn('mt-0.5 text-[11.5px] font-semibold', tone)}>{label}</div>
    </div>
  );
}

export { SuggestedPairingsCard };
