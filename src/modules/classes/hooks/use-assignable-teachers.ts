'use client';

import { isEligibleClassTeacher } from '@/modules/classes/lib/class-form.helpers';
import { isAssignableInvitation } from '@/modules/classes/lib/class-teacher-picker';
import { useInvitationsQuery, useTeachersQuery } from '@/modules/teachers';

// BUG-006: who can be put on a class — eligible ACTIVE teachers (C-TCH-01) and
// INVITED teachers still pending activation (C-INV-02). Both lists must load
// before eligibility is claimed either way.
export function useAssignableTeachers(enabled: boolean) {
  const teachersQuery = useTeachersQuery(enabled);
  const invitationsQuery = useInvitationsQuery(enabled);

  const allTeachers = teachersQuery.data ?? [];
  const teachers = allTeachers.filter(isEligibleClassTeacher);
  const invitations = (invitationsQuery.data ?? []).filter((row) => isAssignableInvitation(row));

  return {
    allTeachers,
    teachers,
    invitations,
    isPending: teachersQuery.isPending || invitationsQuery.isPending,
    isError: teachersQuery.isError || invitationsQuery.isError,
    isSuccess: teachersQuery.isSuccess && invitationsQuery.isSuccess,
    isFetching: teachersQuery.isFetching || invitationsQuery.isFetching,
    hasAssignable: teachers.length + invitations.length > 0,
    refetch: () => {
      void teachersQuery.refetch();
      void invitationsQuery.refetch();
    },
  };
}
