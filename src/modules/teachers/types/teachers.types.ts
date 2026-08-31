// C-TCH-01 / C-INV-02 payload shapes (school admin Teachers screen).

import type { EditTeacherValues } from '@/modules/teachers/schemas/edit-teacher.schema';
import type { InviteTeacherValues } from '@/modules/teachers/schemas/invite-teacher.schema';

// The two staff roles C-INV-01 accepts on an invitation.
export type SchoolStaffRole = 'teacher' | 'school_admin';

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

export type InvitationStatus = 'invited' | 'expired' | 'accepted' | 'revoked';

export interface SchoolInvitation {
  documentId: string;
  email: string;
  first_name: string;
  last_name: string;
  role: SchoolStaffRole;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

// One merged table row: a live staff account (C-TCH-01) or an open invitation
// (C-INV-02 invited/expired). Accepted invitations are covered by the staff
// account itself, and REVOKED ones are withdrawn access, so neither renders as
// a separate row.
export type StaffRowStatus = 'active' | 'deactivated' | 'invited' | 'expired';

export interface StaffRow {
  kind: 'teacher' | 'invitation';
  documentId: string;
  email: string;
  first_name: string;
  last_name: string;
  status: StaffRowStatus;
  // The teacher's COMPLETE assignment set: the C-TCH-01 `classes` grouping (the
  // singular `class.teacher` owner) unioned with the C-CLS-01 `teachers` m2m.
  classes: SchoolTeacherClass[];
  // How many of those classes carry sittings or results (C-RPT-04), driving the
  // spec section 3 removal warning. `null` = participation could not be read, so
  // the fact is UNKNOWN and no warning is claimed. Always null for invitations.
  reportingClassCount: number | null;
  expires_at: string | null;
}

// C-INV-01 request: the spec's three form fields plus the role the endpoint
// requires, which the dialog owns rather than the admin.
export interface InviteTeacherInput {
  values: InviteTeacherValues;
  role: SchoolStaffRole;
}

// C-TCH-04 request: the three editable staff fields plus the target account.
export interface UpdateTeacherInput {
  documentId: string;
  values: EditTeacherValues;
}

// C-TCH-03 response: the account is blocked and unlinked, never deleted, so the
// counts describe what was severed.
export interface RemoveTeacherResult {
  documentId: string;
  removed: true;
  classes_unassigned: number;
  invitations_revoked: number;
}

// GAP-01 (task 019): parsed shape of the needs-attention response.
export type { NeedsAttentionStudent, TeacherNeedsAttention } from '../schemas/teachers.schema';
