'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  sittingSettingsSchema,
  type SittingSettings,
  type SittingSettingsPatch,
} from '@/modules/teacher/schemas/teacher-session.schema';

// C-SIT-SETTINGS (teacher task 11) — the ONE writer of the per-sitting
// settings: PATCH /api/sittings/:documentId/settings. The server merges the
// partial body onto the stored settings (or the design defaults) and answers
// the WHOLE object, which is parsed through the FULL strict mirror here so a
// drifted answer fails at the boundary instead of rendering. Task 22's
// composer writes through this hook; S18 (the read-only modal) never calls it.
async function updateSettings(input: {
  sittingDocumentId: string;
  patch: SittingSettingsPatch;
}): Promise<SittingSettings> {
  const response = await strapi.patch<{ data: unknown }>(
    `/api/sittings/${input.sittingDocumentId}/settings`,
    { data: input.patch },
  );
  return sittingSettingsSchema.parse(response.data.data);
}

export function useSittingSettingsMutation(sittingDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: SittingSettingsPatch) =>
      updateSettings({ sittingDocumentId, patch }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sittings', sittingDocumentId] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'monitor', sittingDocumentId] });
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
    },
  });
}
