'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { CLASS_CHILDREN_QUERY_KEY } from '@/modules/classes/queries/use-class-children.query';
import { CLASSES_QUERY_KEY } from '@/modules/classes/queries/use-school-classes.query';

// C-CLS-04: delete the class. Students are unlinked server-side, never
// deleted — the confirm dialog copy says exactly that.
async function deleteClassRequest(documentId: string): Promise<void> {
  await strapi.delete(`/api/schools/me/classes/${documentId}`);
}

export function useDeleteClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClassRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CLASS_CHILDREN_QUERY_KEY });
    },
  });
}
