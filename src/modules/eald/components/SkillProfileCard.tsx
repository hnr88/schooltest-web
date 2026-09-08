import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { PHASE_BAR_COLORS } from '@/modules/eald/constants/components.constants';
import { DIAGNOSE_COMPARISON, DIAGNOSE_SUBSKILLS } from '@/modules/eald/constants/eald.constants';

import { FigureCard } from './FigureCard';

async function SkillProfileCard() {
  const t = await getTranslations('Eald');
  return (
    <FigureCard
      title={t('diagnose.profile.figureTitle')}
      context={t('diagnose.profile.figureContext')}
      footnote={t('diagnose.profile.footnote')}
    >
      {/* No min-width floor here: the figure-card body scrolls this content
          inside its own overflow-x-auto container, and a 480px floor on this
          div leaks past the scroller to the document at 375px (measured
          deScroll 517 vs 375). The card's own min-content keeps the scroll. */}
      <div role="group" aria-label={t('diagnose.profile.ariaLabel')} className="pb-4">
        <ul className="flex flex-col gap-3">
          {DIAGNOSE_SUBSKILLS.map((skill) => (
            <li key={skill.labelKey} className="grid grid-cols-subskill-row items-center gap-3.5">
              <span className="text-right text-meta font-semibold text-foreground">
                {t(skill.labelKey)}
              </span>
              <span aria-hidden="true" className="block h-3.5 rounded-sm bg-muted">
                <span
                  className={cn('block h-full rounded-sm', PHASE_BAR_COLORS[skill.phase])}
                  style={{ width: `${skill.percent}%` }}
                />
              </span>
              <span className="text-meta font-semibold text-muted-foreground">
                {t(skill.phaseKey)}
                <span className="sr-only">: {skill.percent}%</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4.5 flex gap-3.5 border-t border-divider pt-3 pl-24.5">
          {DIAGNOSE_COMPARISON.bandKeys.map((key) => (
            <span
              key={key}
              className="flex-1 text-micro font-semibold text-muted-foreground uppercase"
            >
              {t(key)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-meta text-muted-foreground">
          {t('diagnose.profile.moreSubskills')}
        </p>
      </div>
    </FigureCard>
  );
}

export { SkillProfileCard };
