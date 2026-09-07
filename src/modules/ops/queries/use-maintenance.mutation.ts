'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OpsMaintenanceOperation,
  RestContractViolation,
  maintenanceResponseSchema,
  type MaintenanceBody,
  type MaintenanceResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { PLATFORM_SETTINGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSF-03 — maintenance mode.
//
// The highest-consequence control on the console: enabling it closes the site
// to everyone, so the editor confirm-gates the PUT and names that consequence
// in the dialog rather than saying "are you sure?".
//
// A note on scope, since it is the obvious next question: maintenance also
// feeds the cached public banner, so the same cache-tag argument that moved the
// announcement save to a server action applies here too. The brief scoped the
// revalidation to the announcement, so this stays a plain client PUT and the
// gap is reported rather than silently widened.
async function setMaintenance(body: MaintenanceBody): Promise<MaintenanceResponse['data']> {
  const res = await strapi.put<unknown>(OpsMaintenanceOperation.path, body);
  const parsed = maintenanceResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useMaintenanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setMaintenance,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PLATFORM_SETTINGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
