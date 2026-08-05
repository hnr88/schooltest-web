'use client';

import { useMemo } from 'react';

import type { SchoolClass } from '@/modules/classes';
import { mergeTeacherClasses } from '@/modules/teachers/lib/staff-classes';
import { countReportingClasses, reportingClassIds } from '@/modules/teachers/lib/staff-reporting';
import type {
  SchoolInvitation,
  SchoolTeacher,
  StaffRow,
  StaffRowStatus,
} from '@/modules/teachers/types/teachers.types';
import { STATUS_ORDER } from '@/modules/teachers/constants/hooks.constants';

import type { StaffRowsInput } from '@/modules/teachers/types/hooks.types';

function teacherRow(
  teacher: SchoolTeacher,
  schoolClasses: SchoolClass[] | undefined,
  reportingIds: Set<string> | null,
): StaffRow {
  const classes = mergeTeacherClasses(teacher.classes, schoolClasses, teacher.documentId);
  return {
    kind: 'teacher',
    documentId: teacher.documentId,
    email: teacher.email,
    first_name: teacher.first_name ?? '',
    last_name: teacher.last_name ?? '',
    status: teacher.blocked ? 'deactivated' : 'active',
    classes,
    reportingClassCount: countReportingClasses(classes, reportingIds),
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
    // No account, so no class links and nothing reporting can be attached to.
    reportingClassCount: null,
    expires_at: invitation.expires_at,
  };
}

// Merges C-TCH-01 staff with C-INV-02 open invitations into one sorted table
// model: pending invitations first, then active and deactivated accounts,
// alphabetical inside each group. Accepted invitations are represented by the
// staff account itself and drop out. C-CLS-01 completes each account's class
// list (C-TCH-01 only sees the singular owner) and C-RPT-04 says how many of
// those classes carry sittings or results.
export function useStaffRows({
  teachers,
  invitations,
  classes,
  participation,
}: StaffRowsInput): StaffRow[] {
  return useMemo(() => {
    const reportingIds = reportingClassIds(participation);
    const rows: StaffRow[] = [
      ...(teachers ?? []).map((teacher) => teacherRow(teacher, classes, reportingIds)),
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
  }, [teachers, invitations, classes, participation]);
}
