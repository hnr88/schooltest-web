import type { SchoolClass } from '@/modules/classes';
import type { SchoolParticipation } from '@/modules/school-admin';
import type { SchoolInvitation, SchoolTeacher } from '@/modules/teachers/types/teachers.types';

export type StaffConfirmAction = 'deactivate' | 'reactivate' | 'revoke' | 'remove';

// The four reads the merged staff table is built from. Only the first two make
// rows; `classes` completes the co-teaching assignments C-TCH-01 cannot see and
// `participation` answers whether removal touches reporting. Either of those
// two may be undefined — the table then degrades rather than guessing.
export interface StaffRowsInput {
  teachers: SchoolTeacher[] | undefined;
  invitations: SchoolInvitation[] | undefined;
  classes: SchoolClass[] | undefined;
  participation: SchoolParticipation | undefined;
}
