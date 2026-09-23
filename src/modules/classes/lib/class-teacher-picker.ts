import { INVITED_TEACHER_VALUE_PREFIX } from '@/modules/classes/constants/teacher-picker.constants';
import { teacherOption } from '@/modules/classes/lib/class-form.helpers';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type {
  ClassPendingTeacher,
  ClassTeacherAssignment,
} from '@/modules/classes/types/classes.types';
import type { UpdateClassInput } from '@/modules/classes/types/queries.types';
import type { SchoolInvitation, SchoolTeacher } from '@/modules/teachers';

// BUG-006: an invitation is assignable while it is a TEACHER invitation that is
// still `invited` and inside its expiry — the same rule the server enforces,
// so the picker never offers what the API would refuse.
export function isAssignableInvitation(invitation: SchoolInvitation, now: number = Date.now()): boolean {
  return (
    invitation.role === 'teacher' &&
    invitation.status === 'invited' &&
    Date.parse(invitation.expires_at) > now
  );
}

export function invitedTeacherValue(invitationDocumentId: string): string {
  return `${INVITED_TEACHER_VALUE_PREFIX}${invitationDocumentId}`;
}

export function invitedTeacherName(person: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}): string {
  const name = `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim();
  return name || person.email || '';
}

// Active teachers first, then invited ones labelled "Invited — pending".
export function teacherPickOptions(
  teachers: readonly SchoolTeacher[],
  invitations: readonly SchoolInvitation[],
  pendingLabel: (name: string) => string,
): ClassMemberOption[] {
  return [
    ...teachers.map(teacherOption),
    ...invitations.map((invitation) => ({
      value: invitedTeacherValue(invitation.documentId),
      label: pendingLabel(invitedTeacherName(invitation)),
    })),
  ];
}

export function isInvitedTeacherValue(value: string): boolean {
  return value.startsWith(INVITED_TEACHER_VALUE_PREFIX);
}

// The documentId behind a pick — a user's, or the invitation's.
export function pickDocumentId(value: string): string {
  return isInvitedTeacherValue(value) ? value.slice(INVITED_TEACHER_VALUE_PREFIX.length) : value;
}

// Picks -> wire. Several active teachers may be picked; a class waits on at
// most ONE invitation, so only the first invited pick is kept. (togglePick
// never produces both kinds; the server refuses a body that names both.)
export function assignmentFromPicks(picks: readonly string[]): ClassTeacherAssignment {
  const invited = picks.find(isInvitedTeacherValue);
  return {
    teacher_documentIds: picks.filter((value) => value !== '' && !isInvitedTeacherValue(value)),
    pending_teacher_documentId: invited ? pickDocumentId(invited) : null,
  };
}

// The single-select value a class currently holds: its teacher, else the
// invitation it is still waiting on, else unassigned. A lapsed invitation is
// NOT preselected — that class needs a teacher reassigned.
export function currentTeacherPick(
  teacherDocumentId: string | null | undefined,
  pending: ClassPendingTeacher | null | undefined,
): string {
  if (teacherDocumentId) return teacherDocumentId;
  if (pending?.state === 'pending') return invitedTeacherValue(pending.documentId);
  return '';
}

// Toggling within a multi-pick keeps the server's invariant — a class holds
// real teachers OR one invited teacher, never both: checking an invitation
// replaces every other pick, and checking a teacher drops an invited pick.
export function togglePick(picks: readonly string[], value: string, checked: boolean): string[] {
  if (!checked) return picks.filter((entry) => entry !== value);
  if (isInvitedTeacherValue(value)) return [value];
  const kept = picks.filter((entry) => !isInvitedTeacherValue(entry));
  return kept.includes(value) ? kept : [...kept, value];
}

// BUG-005 a11y: the picks a toggle took away besides the toggled one itself —
// what the picker must announce instead of unticking them silently.
export function droppedByToggle(before: readonly string[], after: readonly string[], value: string): string[] {
  return before.filter((entry) => entry !== value && !after.includes(entry));
}

// BUG-006 follow-up: what the Edit class PATCH says about the teacher — NOTHING
// unless the pick changed, so a rename never touches a lapsed invitation's
// "reassign teacher" state (or a co-teacher the single select does not show).
// An invited pick on a class that has a teacher is the explicit replace the
// server requires; any other pick clears a pending teacher the class holds.
export function editTeacherChange(
  pick: string,
  initialPick: string,
  target: { teacher?: { documentId: string } | null; pending_teacher?: ClassPendingTeacher | null },
): Pick<UpdateClassInput, 'teacher_documentIds' | 'pending_teacher_documentId' | 'replace_teachers'> {
  if (pick === initialPick) return {};
  const assignment = assignmentFromPicks([pick]);
  const invited = assignment.pending_teacher_documentId !== null;
  return {
    teacher_documentIds: assignment.teacher_documentIds,
    ...(invited || target.pending_teacher ? { pending_teacher_documentId: assignment.pending_teacher_documentId } : {}),
    ...(invited && target.teacher ? { replace_teachers: true } : {}),
  };
}

// BUG-006 follow-up: the bulk assign never takes a class's teachers away. With
// an invited pick, a selected class that already has a teacher is SKIPPED (and
// named to the admin) — an invited teacher only waits on a class with none.
export function classesForInvitedAssign<Row extends { documentId: string; hasTeacher: boolean }>(
  classes: readonly Row[],
  selected: readonly string[],
): { eligible: string[]; skipped: Row[] } {
  const picked = classes.filter((row) => selected.includes(row.documentId));
  return {
    eligible: picked.filter((row) => !row.hasTeacher).map((row) => row.documentId),
    skipped: picked.filter((row) => row.hasTeacher),
  };
}
