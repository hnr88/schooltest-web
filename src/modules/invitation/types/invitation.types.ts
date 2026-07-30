// C-INV-05/06 payload shapes (guest invitation flow).

export type InvitationRole = 'teacher' | 'school_admin';

export interface InvitationDetails {
  email: string;
  first_name: string;
  last_name: string;
  role: InvitationRole;
  school_name: string;
  expires_at: string;
}

export interface AcceptInvitationResult {
  jwt: string;
  user: {
    documentId: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

// Terminal link states for the /invite/<token> page (C-INV-05 404/410/409 plus
// a generic network/5xx fallback).
export type InviteLinkState = 'invalid' | 'expired' | 'used' | 'unavailable';
