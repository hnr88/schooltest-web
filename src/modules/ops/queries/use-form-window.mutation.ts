'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { formWindowQueryKey } from '@/modules/ops/queries/use-form-window.query';
import { formWindowSchema, type FormWindow } from '@/modules/ops/schemas/form-window.schema';

export interface PutFormWindowInput {
  schoolDocumentId: string;
  form_documentId: string;
  opens_at: string;
  closes_at: string;
}

// C-WIN-01 (ops only): replace the school's one active form window. The 400s
// (FORM_LOCKED, inverted range, non-reading form) are surfaced by the caller.
async function putFormWindow(input: PutFormWindowInput): Promise<FormWindow> {
  const res = await strapi.put<{ data: unknown }>(
    `/api/schools/${input.schoolDocumentId}/form-window`,
    {
      form_documentId: input.form_documentId,
      opens_at: input.opens_at,
      closes_at: input.closes_at,
    },
  );
  return formWindowSchema.parse(res.data.data);
}

export function useFormWindowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putFormWindow,
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({ queryKey: formWindowQueryKey(input.schoolDocumentId) }),
  });
}
