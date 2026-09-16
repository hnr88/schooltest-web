'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  SITTING_ACTIVITY_QUERY_KEY,
  SITTING_MONITOR_QUERY_KEY,
} from '@/modules/test-day/constants/queries.constants';
import {
  parseRoomControlResponse,
  roomControlRequestSchema,
  type RoomControlRequest,
  type RoomControlResult,
} from '@/modules/test-day/schemas/test-day.schema';

// Teacher Portal v2 B2 room controls: POST /api/sittings/:documentId/pause |
// /resume | /extend {minutes} -> 200 { data }. A 409 carries details.reason
// (not_running | already_paused | not_paused) and details.phase.
// C-SITTING-START (POST /start) is the lobby's release and answers a BARE
// `{ sitting }` instead, so the reply is parsed per action — see
// `parseRoomControlResponse`.
async function roomControlRequest(input: RoomControlRequest): Promise<RoomControlResult> {
  const request = roomControlRequestSchema.parse(input);
  const body = request.action === 'extend' ? { minutes: request.minutes } : {};
  const res = await strapi.post<unknown>(
    `/api/sittings/${request.sittingDocumentId}/${request.action}`,
    body,
  );
  return parseRoomControlResponse(request.action, res.data);
}

export function useRoomControlMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomControlRequest,
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({
        queryKey: [...SITTING_MONITOR_QUERY_KEY, input.sittingDocumentId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...SITTING_ACTIVITY_QUERY_KEY, input.sittingDocumentId],
      });
    },
  });
}
