'use client';

import { useMemo } from 'react';

import type {
  SchoolInvitation,
  SchoolTeacher,
  StaffRow,
  StaffRowStatus,
} from '@/modules/teachers/types/teachers.types';

const STATUS_ORDER: Record<StaffRowStatus, number> = {
  invited: 0,
  expired: 1,
  active: 2,
  deactivated: 3,
};

function teacherRow(teacher: SchoolTeacher): StaffRow {
  return {
    kind: 'teacher',
    documentId: teacher.documentId,
    email: teacher.email,
    first_name: teacher.first_name ?? '',
    last_name: teacher.last_name ?? '',
    status: teacher.blocked ? 'deactivated' : 'active',
    classes: teacher.classes,
    expires_at: null,
  };
}

function invitationRow(invitation: SchoolInvitation): StaffRow | null {
  // Accepted invitations are represented by the staff account itself; revoked
  // ones are withdrawn access kept only for the audit trail (C-INV-07).
  if (invitation.status === 'accepted' || invitation.status === 'revoked') return null;
  return {
    kind: 'invitation',
    documentId: invitation.documentId,
    email: invitation.email,
    first_name: invitation.first_name,
    last_name: invitation.last_name,
    status: invitation.status,
    classes: [],
    expires_at: invitation.expires_at,
  };
}

// Merges C-TCH-01 staff with C-INV-02 open invitations into one sorted table
// model: pending invitations first, then active and deactivated accounts,
// alphabetical inside each group. Accepted invitations are represented by the
// staff account itself and drop out.
export function useStaffRows(
  teachers: SchoolTeacher[] | undefined,
  invitations: SchoolInvitation[] | undefined,
): StaffRow[] {
  return useMemo(() => {
    const rows: StaffRow[] = [
      ...(teachers ?? []).map(teacherRow),
      ...(invitations ?? [])
        .map(invitationRow)
        .filter((row): row is StaffRow => row !== null),
    ];
    return rows.sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [teachers, invitations]);
}
