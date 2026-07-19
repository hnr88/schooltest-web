'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { agentSearchResponseSchema } from '@/modules/agent-search/schemas/agent-search.schema';
import type {
  AgentSearchRequest,
  AgentSearchResult,
} from '@/modules/agent-search/types/agent-search.types';

async function fetchAgentSearch(
  request: AgentSearchRequest
): Promise<AgentSearchResult> {
  const res = await strapi.post<unknown>('/api/search/agents', request);
  return agentSearchResponseSchema.parse(res.data);
}

export function useAgentSearchQuery(request: AgentSearchRequest) {
  return useQuery({
    queryKey: ['agent-search', request],
    queryFn: () => fetchAgentSearch(request),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
