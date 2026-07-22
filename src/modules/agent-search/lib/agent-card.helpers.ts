// Agent-card presentation helpers (kept out of the components per module-pattern).

import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';

const MAX_VISIBLE_SERVICES = 2;

// Single muted subtitle line (spec: role/headline, line-clamp-2). Prefer the
// descriptive headline, fall back to the role title, null when neither exists.
export function getAgentSubtitle(hit: AgentHit): string | null {
  return hit.headline ?? hit.roleTitle ?? null;
}

// Optional services row = the first two seeded specialty strings (real hit data,
// not the enum filter values), joined by the caller with a dot separator.
export function getAgentServices(hit: AgentHit): string[] {
  return hit.specialties.slice(0, MAX_VISIBLE_SERVICES);
}
