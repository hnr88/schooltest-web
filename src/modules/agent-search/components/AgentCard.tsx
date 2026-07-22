'use client';

import { useTranslations } from 'next-intl';

import { AgentCardMeta } from '@/modules/agent-search/components/AgentCardMeta';
import { getAgentSubtitle } from '@/modules/agent-search/lib/agent-card.helpers';
import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarTint,
  StatusPill,
  getAvatarTone,
  getInitials,
} from '@/modules/design-system';

// `photoUrl` is a REAL API field, so a populated one still renders the photo through
// the Base UI Avatar. 0 of the 8 live agents carry one, so what actually renders is
// the canonical AvatarTint identity disc — never a stock portrait, never a service.
function AgentCard({ hit }: { hit: AgentHit }) {
  const t = useTranslations('AgentSearch');
  const subtitle = getAgentSubtitle(hit);

  return (
    <article
      data-slot="agent-card"
      className="flex flex-col gap-4 rounded-result border border-transparent bg-card p-5.5 shadow-sm transition duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div data-slot="agent-card-profile" className="flex items-start gap-3">
        {hit.photoUrl ? (
          <Avatar size="lg" className="size-11">
            <AvatarImage src={hit.photoUrl} alt="" />
            <AvatarFallback>{getInitials(hit.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <AvatarTint
            size="md"
            initials={getInitials(hit.name)}
            tone={getAvatarTone(hit.name)}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-panel-title font-bold text-foreground">{hit.name}</h3>
            {hit.verified ? <StatusPill tone="success">{t('verified')}</StatusPill> : null}
          </div>
          {subtitle ? (
            <p className="line-clamp-2 text-body-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <AgentCardMeta hit={hit} />
    </article>
  );
}

export { AgentCard };
