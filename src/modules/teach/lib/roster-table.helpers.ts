import type { RosterChild } from '@/modules/teach/types/roster.types';

export function rosterDisplayName(row: RosterChild): string {
  return [row.given_name, row.family_name].filter(Boolean).join(' ');
}
