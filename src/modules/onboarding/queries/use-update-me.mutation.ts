'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { strapi } from '@/lib/axios/strapi';
import type { AuthUser } from '@/modules/auth';
import { updateMeResponseSchema } from '@/modules/onboarding/schemas/parent-profile.schema';
import type {
  ParentProfileOutput,
  UpdateMeErrorPayload,
} from '@/modules/onboarding/types/parent-profile.types';

import type { UseUpdateMeMutationOptions } from '@/modules/onboarding/types/queries.types';

// C-PAR-UPDATE-ME: bare JSON body (NO {data} envelope); the response is the
// bare sanitized user + `profileCompleted` for parents.
async function updateMeRequest(input: ParentProfileOutput) {
  const res = await strapi.put('/api/users/me', input);
  return updateMeResponseSchema.parse(res.data);
}

export function useUpdateMeMutation(options?: UseUpdateMeMutationOptions) {
  const t = useTranslations('Onboarding');
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateMeRequest,
    onSuccess: (data) => {
      // Merge into the me cache (the PUT response carries no role — a replace
      // would drop it) so the finish step's profileCompleted gate opens
      // without depending on a refetch.
      qc.setQueryData<AuthUser | null>(['auth', 'me'], (old) =>
        old ? { ...old, ...data } : old,
      );
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success(t('profileSaved'));
    },
    onError: (error) => {
      if (isAxiosError<UpdateMeErrorPayload>(error) && error.response?.status === 400) {
        const fields = error.response.data?.error?.details?.fields;
        if (fields && fields.length > 0) {
          options?.onInvalidFields?.(fields);
        }
        toast.error(t('profileInvalid'));
        return;
      }
      toast.error(t('profileSaveError'));
    },
  });
}
