import { CircleCheck, Clock, Link2Off, TriangleAlert } from 'lucide-react';
import type { InviteLinkState } from '@/modules/invitation/types/invitation.types';
import type { LucideIcon } from 'lucide-react';

export const STATE_ICONS: Record<InviteLinkState, LucideIcon> = {
  invalid: Link2Off,
  expired: Clock,
  used: CircleCheck,
  unavailable: TriangleAlert,
};
