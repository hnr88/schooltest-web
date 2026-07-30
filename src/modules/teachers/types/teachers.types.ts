// C-TCH-01 / C-INV-02 payload shapes (school admin Teachers screen).

export interface SchoolTeacherClass {
  documentId: string;
  name: string;
}

export interface SchoolTeacher {
  documentId: string;
  email: string;
  // Null for accounts created outside the invitation flow (e.g. seeds).
  first_name: string | null;
  last_name: string | null;
  blocked: boolean;
  classes: SchoolTeacherClass[];
}

export type InvitationStatus = 'invited' | 'expired' | 'accepted';

export interface SchoolInvitation {
  documentId: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'school_admin';
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

// One merged table row: a live staff account (C-TCH-01) or an open invitation
// (C-INV-02 invited/expired). Accepted invitations are covered by the staff
// account itself, so they never render as separate rows.
export type StaffRowStatus = 'active' | 'deactivated' | 'invited' | 'expired';

export interface StaffRow {
  kind: 'teacher' | 'invitation';
  documentId: string;
  email: string;
  first_name: string;
  last_name: string;
  status: StaffRowStatus;
  classes: SchoolTeacherClass[];
  expires_at: string | null;
}
