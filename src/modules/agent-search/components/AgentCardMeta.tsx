'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { getAgentServices, splitCountries } from '@/modules/agent-search/lib/agent-card.helpers';
import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';

// Neutral pill (spec §6): slate-100 surface, slate-600 label.
const NEUTRAL_PILL =
  'inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-600 dark:bg-slate-800 dark:text-slate-300';

function bold(chunks: ReactNode) {
  return <strong className="font-bold text-slate-500">{chunks}</strong>;
}

// Country pills + optional services row + dot-separated meta footer for AgentCard.
function AgentCardMeta({ hit }: { hit: AgentHit }) {
  const t = useTranslations('AgentSearch');
  const { visible, overflow } = splitCountries(hit.countriesServed);
  const services = getAgentServices(hit);

  return (
    <>
      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((country) => (
            <span key={country} className={NEUTRAL_PILL}>
              {country}
            </span>
          ))}
          {overflow > 0 ? <span className={cn(NEUTRAL_PILL, 'text-slate-500')}>+{overflow}</span> : null}
        </div>
      ) : null}

      {services.length > 0 ? (
        <p className="line-clamp-1 text-xs text-muted-foreground">{services.join(' · ')}</p>
      ) : null}

      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        {hit.yearsExperience !== null ? (
          <span>{t.rich('footer.yearsExperience', { years: hit.yearsExperience, b: bold })}</span>
        ) : null}
        {hit.yearsExperience !== null ? (
          <span aria-hidden="true">·</span>
        ) : null}
        <span>{t.rich('footer.partnerSchools', { count: hit.partnerSchoolsCount, b: bold })}</span>
      </p>
    </>
  );
}

export { AgentCardMeta };
