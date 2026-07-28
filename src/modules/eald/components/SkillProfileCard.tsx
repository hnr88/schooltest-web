import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { DIAGNOSE_SUBSKILLS } from '@/modules/eald/constants/eald.constants';
import type { SubskillPhase } from '@/modules/eald/types/eald.types';

const PHASE_BAR_COLORS: Record<SubskillPhase, string> = {
  consolidating: 'bg-teal-600',
  developing: 'bg-blue-700',
  emerging: 'bg-blue-500',
  beginning: 'bg-chart-4',
};

async function SkillProfileCard() {
  const t = await getTranslations('Eald');

  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-divider pb-4">
        <span className="text-button font-bold text-foreground">
          {t('diagnose.profile.domain')}
        </span>
        <span className="rounded-full bg-navy-900 px-3 py-1 text-meta font-bold text-white">
          {t('diagnose.profile.score')}
        </span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-meta font-bold text-navy-800">
          {t('diagnose.profile.cefrBand')}
        </span>
        <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-meta font-bold text-teal-600">
          {t('diagnose.profile.phase')}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {DIAGNOSE_SUBSKILLS.map((skill) => (
          <div
            key={skill.labelKey}
            className="grid grid-cols-subskill-row items-center gap-3"
          >
            <span className="text-right text-meta font-semibold text-body">
              {t(skill.labelKey)}
            </span>
            <span className="block h-2 rounded-full bg-divider">
              <span
                className={cn(
                  'block h-full rounded-full',
                  PHASE_BAR_COLORS[skill.phase],
                )}
                style={{ width: `${skill.percent}%` }}
              />
            </span>
            <span className="text-micro text-slate-400">
              {t(skill.phaseKey)}
            </span>
          </div>
        ))}

        <p className="mt-1 text-center text-xs text-slate-400 sm:pl-24 sm:text-left">
          {t('diagnose.profile.moreSubskills')}
        </p>
      </div>
    </div>
  );
}

export { SkillProfileCard };
