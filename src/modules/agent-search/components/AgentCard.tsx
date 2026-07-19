'use client';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/modules/design-system';
import { AgentCardMeta } from '@/modules/agent-search/components/AgentCardMeta';
import { getAgentInitials, getAgentSubtitle } from '@/modules/agent-search/lib/agent-card.helpers';
import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';

// Informational agent card (spec §13 card). No contact/"Talk" dialog. The Base UI
// Avatar swaps to the initials fallback automatically when photoUrl is absent or
// its image errors (§8 avatar pairs). Hover lifts the border + shadow (motion baseline).
function AgentCard({ hit }: { hit: AgentHit }) {
  const t = useTranslations('AgentSearch');
  const subtitle = getAgentSubtitle(hit);

  return (
    <article
      data-slot="agent-card"
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition duration-150 ease-out hover:border-input hover:shadow-md motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="size-13">
          {hit.photoUrl ? <AvatarImage src={hit.photoUrl} alt="" /> : null}
          <AvatarFallback className="bg-blue-100 text-base font-bold text-navy-900">
            {getAgentInitials(hit.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-navy-950">{hit.name}</h3>
            {hit.verified ? (
              <Badge variant="success" className="shrink-0">
                {t('verified')}
              </Badge>
            ) : null}
          </div>
          {subtitle ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <AgentCardMeta hit={hit} />
    </article>
  );
}

export { AgentCard };
