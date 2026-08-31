'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers';

// Task 025 multi-picker write: set the class's teacher list wholesale through
// the existing C-CLS-03 PATCH (body key `teacher_documentIds`, the plural the
// api's class-write parser asserts against the school's own staff). One
// request per selected class; rows settle independently (the student-import
// precedent) so one rejection never discards the rest.
export interface AssignTeachersInput {
  classDocumentIds: string[];
  teacherDocumentIds: string[];
}

async function assignTeachersRequest({
  classDocumentIds,
  teacherDocumentIds,
}: AssignTeachersInput): Promise<{ assigned: number; total: number }> {
  const settled = await Promise.allSettled(
    classDocumentIds.map((classDocumentId) =>
      strapi.patch(`/api/schools/me/classes/${classDocumentId}`, {
        teacher_documentIds: teacherDocumentIds,
      }),
    ),
  );
  return {
    assigned: settled.filter((entry) => entry.status === 'fulfilled').length,
    total: classDocumentIds.length,
  };
}

export function useAssignTeachersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignTeachersRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
}
