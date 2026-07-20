'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';

// C-STUDENT-UPDATE archive/unarchive (no separate C-STUDENT-ARCHIVE entry):
// POST /api/students/:documentId/archive | /unarchive — no body, owner asserted
// server-side, idempotent. Optimistic-free: both invalidate the
// ['dashboard','students'] prefix on success so the default list (which excludes
// archived rows) and the include-archived view refetch.
async function archiveRequest(documentId: string): Promise<void> {
  await strapi.post(`/api/students/${documentId}/archive`);
}

async function unarchiveRequest(documentId: string): Promise<void> {
  await strapi.post(`/api/students/${documentId}/unarchive`);
}

function useInvalidateStudents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['dashboard', 'students'] });
}

export function useArchiveStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({ mutationFn: archiveRequest, onSuccess: invalidate });
}

export function useUnarchiveStudentMutation() {
  const invalidate = useInvalidateStudents();
  return useMutation({ mutationFn: unarchiveRequest, onSuccess: invalidate });
}
