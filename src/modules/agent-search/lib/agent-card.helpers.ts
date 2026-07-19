// Agent-card presentation helpers (kept out of the components per module-pattern).

import type { AgentHit } from '@/modules/agent-search/types/agent-search.types';

const MAX_VISIBLE_COUNTRIES = 3;
const MAX_VISIBLE_SERVICES = 2;

export function getAgentInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

// Single muted subtitle line (spec: role/headline, line-clamp-2). Prefer the
// descriptive headline, fall back to the role title, null when neither exists.
export function getAgentSubtitle(hit: AgentHit): string | null {
  return hit.headline ?? hit.roleTitle ?? null;
}

// First N country pills + the overflow count for the "+N" chip (spec §13 card).
export function splitCountries(countries: string[]): {
  visible: string[];
  overflow: number;
} {
  return {
    visible: countries.slice(0, MAX_VISIBLE_COUNTRIES),
    overflow: Math.max(0, countries.length - MAX_VISIBLE_COUNTRIES),
  };
}

// Optional services row = the first two seeded specialty strings (real hit data,
// not the enum filter values), joined by the caller with a dot separator.
export function getAgentServices(hit: AgentHit): string[] {
  return hit.specialties.slice(0, MAX_VISIBLE_SERVICES);
}
