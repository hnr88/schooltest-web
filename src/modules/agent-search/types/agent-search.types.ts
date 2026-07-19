import { z } from 'zod';

import {
  agentServiceSchema,
  agentSortSchema,
  qeacValidationStatusSchema,
  type AgentHit,
  type AgentSearchPagination,
  type AgentSearchResult,
} from '@/modules/agent-search/schemas/agent-search.schema';

export type AgentServiceValue = z.infer<typeof agentServiceSchema>;
export type AgentSortBy = z.infer<typeof agentSortSchema>;
export type QeacValidationStatus = z.infer<typeof qeacValidationStatusSchema>;

// Server request shape (C-SEARCH-AGENTS) — note `sortBy`, pageSize present.
export interface AgentSearchRequest {
  q?: string;
  countriesServed?: string[];
  languages?: string[];
  services?: AgentServiceValue[];
  sortBy?: AgentSortBy;
  page: number;
  pageSize: number;
}

// Store shape (C-UI-SEARCH-AGENTS) — note `sort`, fixed pageSize (not stored).
export interface AgentSearchFilters {
  q: string;
  countriesServed: string[];
  languages: string[];
  services: AgentServiceValue[];
  sort: AgentSortBy;
  page: number;
}

export type { AgentHit, AgentSearchPagination, AgentSearchResult };
