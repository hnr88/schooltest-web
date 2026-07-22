'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { getAgentServices } from '@/modules/agent-search/lib/agent-card.helpers';
import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';
import { KeyValueList, KeyValueRow } from '@/modules/design-system';

function bold(chunks: ReactNode) {
  return <strong className="font-bold">{chunks}</strong>;
}

// Countries and languages are the facts that actually DIFFER between the seeded
// agents, so they belong in the canonical KeyValueRow (Inventory §02.15) rather than
// in yet another wall of pills — the audit counted 16 Badges rendering two repeated
// strings across 8 cards. Empty arrays render nothing at all: an agent with no
// declared language shows no Languages row rather than an invented one.
function AgentCardMeta({ hit }: { hit: AgentHit }) {
  const t = useTranslations('AgentSearch');
  const services = getAgentServices(hit);

  return (
    <div className="flex flex-col gap-3">
      {services.length > 0 ? (
        <p className="line-clamp-1 text-meta text-muted-foreground">{services.join(' · ')}</p>
      ) : null}
      <KeyValueList>
        {hit.countriesServed.length > 0 ? (
          <KeyValueRow label={t('card.countries')}>{hit.countriesServed.join(', ')}</KeyValueRow>
        ) : null}
        {hit.languages.length > 0 ? (
          <KeyValueRow label={t('card.languages')}>{hit.languages.join(', ')}</KeyValueRow>
        ) : null}
      </KeyValueList>
      <p className="flex flex-wrap items-center gap-x-1.5 text-meta text-muted-foreground">
        {hit.yearsExperience !== null ? (
          <span>{t.rich('footer.yearsExperience', { years: hit.yearsExperience, b: bold })}</span>
        ) : null}
        {hit.yearsExperience !== null ? <span aria-hidden="true">·</span> : null}
        <span>{t.rich('footer.partnerSchools', { count: hit.partnerSchoolsCount, b: bold })}</span>
      </p>
    </div>
  );
}

export { AgentCardMeta };
