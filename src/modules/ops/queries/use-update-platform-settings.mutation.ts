'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/queries/use-platform-settings.query';
import {
  platformSettingsSchema,
  testEmailResultSchema,
} from '@/modules/ops/schemas/platform-settings.schema';
import type {
  PlatformSettings,
  ServerFieldError,
  TestEmailResult,
} from '@/modules/ops/types/platform-settings.types';

// C-SET-03 — the write. The response is parsed, never assumed, and the query is
// invalidated so the form re-hydrates from the server rather than from what the
// client hoped it sent.
async function updatePlatformSettings(patch: Record<string, unknown>): Promise<PlatformSettings> {
  const res = await strapi.put<{ data: unknown }>('/api/platform-settings', patch);
  return platformSettingsSchema.parse(res.data.data);
}

export function useUpdatePlatformSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
  });
}

// C-SET-04 — send a real message through the configured provider. A provider
// failure is a 502 and must reach the operator, never a silent success.
async function sendTestEmail(to: string): Promise<TestEmailResult> {
  const res = await strapi.post<{ data: unknown }>('/api/ops/system/test-email', { to });
  return testEmailResultSchema.parse(res.data.data);
}

export function useTestEmailMutation() {
  return useMutation({ mutationFn: sendTestEmail });
}

/**
 * Pull the server's per-field errors out of a 400 so the form can mark the
 * exact inputs. The server is the authority on validity; the client schema only
 * saves a round-trip.
 */
export function serverFieldErrors(error: unknown): ServerFieldError[] {
  const details = (
    error as { response?: { data?: { error?: { details?: { errors?: unknown } } } } }
  )?.response?.data?.error?.details?.errors;
  if (!Array.isArray(details)) return [];
  return details.filter(
    (entry): entry is ServerFieldError =>
      typeof (entry as ServerFieldError)?.path === 'string' &&
      typeof (entry as ServerFieldError)?.message === 'string',
  );
}
