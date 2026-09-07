import type { z } from 'zod';

import type { schoolVersionSchema } from '@/modules/ops/schemas/school-suspend.schema';
import type { OpsSchool } from '@/modules/ops/types/ops.types';

// The C-OPS-PORTAL-005 result type is the SHARED one — re-exported, never
// redeclared, so the parse path and the type cannot drift from the server's.
export type { SchoolSuspendResult } from '@schooltest/ops-contracts';
export type SchoolVersion = z.infer<typeof schoolVersionSchema>;

/** What the mutation needs: which school, and the version the operator saw. */
export interface SchoolSuspendInput {
  schoolDocumentId: string;
  /** The quoted `updatedAt` of the fetched school — never a current-time token. */
  version: string;
}

export interface UseSchoolSuspendActionInput {
  documentId: string;
  schoolName: string;
  enabled: boolean;
}

export interface OpsSchoolSuspendPanelProps {
  /** The C-OPS-01 row already on screen — name and status come from it. */
  school: OpsSchool;
  enabled: boolean;
}
