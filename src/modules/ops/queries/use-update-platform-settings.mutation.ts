'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formatResourceVersion,
  opsActorSchema,
  type OpsActor,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { OPS_CAPABILITIES_QUERY_KEY } from '@/modules/ops/constants/capabilities.constants';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';
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
// client hoped it sent. `If-Match` carries the version of the row the operator
// is looking at; a concurrent edit since then is a 412, not a lost update.
async function updatePlatformSettings(
  patch: Record<string, unknown>,
  ifMatch?: string,
): Promise<PlatformSettings> {
  const res = await strapi.put<{ data: unknown }>(
    '/api/platform-settings',
    patch,
    ifMatch ? { headers: { 'If-Match': formatResourceVersion(ifMatch) } } : undefined,
  );
  return platformSettingsSchema.parse(res.data.data);
}

export function useUpdatePlatformSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      // Read at CALL time: the version the open form was hydrated from, not the
      // version cached when the hook mounted.
      updatePlatformSettings(
        patch,
        queryClient.getQueryData<PlatformSettings>(PLATFORM_SETTINGS_QUERY_KEY)?.updatedAt,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
  });
}

// C-OPS-PORTAL-031 — the one write a read-only support account may perform:
// renaming ITSELF. The server resolves the user from the JWT alone and keeps
// email read-only; the body is only ever { first_name, last_name }.
async function updateOpsProfile(patch: {
  first_name?: string;
  last_name?: string;
}): Promise<OpsActor> {
  const res = await strapi.patch<{ data?: { actor?: unknown } }>('/api/ops/profile', patch, {
    opsPortalVersioned: true,
  });
  // `{ data: { actor } }` — the shared package exports the actor schema but no
  // profile envelope, so unwrap in plain TS and let the schema be the guard.
  return opsActorSchema.parse(res.data?.data?.actor);
}

export function useUpdateOpsProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpsProfile,
    onSuccess: () => {
      // Actor, capabilities and the auth profile all carry the name.
      void queryClient.invalidateQueries({ queryKey: OPS_CAPABILITIES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
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
