'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CommsTemplatesOperation,
  RestContractViolation,
  commsTemplatesResponseSchema,
  type CommsTemplatesResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { COMMS_TEMPLATES_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSM-05 — the notification event registry behind the Comms console.
//
// These are the app's REAL dispatch events (EVENT_META), not editable mail
// templates: there is no create/update/delete route, so the console lists them
// read-only. The row's `description` already states whether an event sends
// email or is in-app only, which is the operationally useful part.
//
// The registry only changes when the API ships, so this read is cached rather
// than refetched on every mount.
async function fetchCommsTemplates(signal: AbortSignal): Promise<CommsTemplatesResponse> {
  const res = await strapi.get<unknown>(CommsTemplatesOperation.path, { signal });
  const parsed = commsTemplatesResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useCommsTemplatesQuery(enabled: boolean) {
  return useQuery({
    queryKey: COMMS_TEMPLATES_QUERY_KEY,
    queryFn: ({ signal }) => fetchCommsTemplates(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
