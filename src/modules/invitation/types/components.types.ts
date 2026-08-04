import type { InviteLinkState } from '@/modules/invitation/types/invitation.types';

export interface InviteAcceptFormProps {
  token: string;
  defaultValues: { first_name: string; last_name: string };
}

export interface InviteAcceptScreenProps {
  token: string;
}

export interface InviteStatusScreenProps {
  state: InviteLinkState;
}
