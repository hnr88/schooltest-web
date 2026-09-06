'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  opsWindowActionResponseSchema,
  opsWindowShareResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * Task 30 — C-OPS-PORTAL-057/058/059: share, cancel and reopen for one
 * assessment window. Three hooks, one file, because the three writes form ONE
 * action surface on the same window row.
 *
 *  - shareWindow: the Idempotency-Key is minted per attempt so the operator's
 *    retry cannot double-send; recipients are resolved server-side and the
 *    body is empty by contract.
 *  - cancelWindow: scheduled or not-started windows only (409 otherwise).
 *  - reopenWindow: extends missed students by seven calendar days (409 outside
 *    the limit). A rejected write changes nothing — the list refetches.
 *
 * Every response is PARSED through the shared contract schema: a drifted
 * server shape fails here, loudly, instead of rendering invented cells.
 */
export interface WindowActionInput {
  schoolDocumentId: string;
  windowDocumentId: string;
}

export function windowActionPath(
  schoolDocumentId: string,
  windowDocumentId: string,
  action: 'share' | 'cancel' | 'reopen'
): string {
  return `/api/ops/schools/${schoolDocumentId}/result-windows/${windowDocumentId}/${action}`;
}

export function useWindowShareMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WindowActionInput) => {
      const key = `ops-share-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36).padEnd(24, '0')}`;
      const res = await strapi.post<unknown>(
        windowActionPath(input.schoolDocumentId, input.windowDocumentId, 'share'),
        {},
        { opsPortalVersioned: true, headers: { 'Idempotency-Key': key } }
      );
      return opsWindowShareResponseSchema.parse(res.data).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['ops', 'schools', schoolDocumentId, 'result-windows'],
      });
    },
  });
}

export function useWindowCancelMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WindowActionInput) => {
      const res = await strapi.post<unknown>(
        windowActionPath(input.schoolDocumentId, input.windowDocumentId, 'cancel'),
        {},
        { opsPortalVersioned: true }
      );
      return opsWindowActionResponseSchema.parse(res.data).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['ops', 'schools', schoolDocumentId, 'result-windows'],
      });
    },
  });
}

export function useWindowReopenMutation(schoolDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WindowActionInput) => {
      const res = await strapi.post<unknown>(
        windowActionPath(input.schoolDocumentId, input.windowDocumentId, 'reopen'),
        {},
        { opsPortalVersioned: true }
      );
      return opsWindowActionResponseSchema.parse(res.data).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['ops', 'schools', schoolDocumentId, 'result-windows'],
      });
    },
  });
}
