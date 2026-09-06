import type { OpsStudentsListQuery } from '@schooltest/ops-contracts';

// Component props for the ops Students tab (OPS-045). Wire shapes are NEVER
// redeclared here — every row/query/response type is imported from
// @schooltest/ops-contracts, the one source both applications share.

export interface OpsStudentsTabProps {
  schoolDocumentId: string;
}

export interface OpsStudentsClassOption {
  value: string;
  label: string;
}

