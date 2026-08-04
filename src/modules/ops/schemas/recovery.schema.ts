import { z } from 'zod';

import type { RecoveryMonitorStudent } from '@/modules/ops/types/schemas.types';

// C-OPS-02 (task 69, st-mvp-pivot): the ops sitting-recovery boundary schemas.
// The sitting picker reads the EXISTING core GET /api/sittings (ops holds full
// visibility) filtered to the school's classes; the student list reuses the
// C-SIT-02 monitor read (ops is allowed alongside the owning teacher). No new
// GETs.

export const recoverySittingSchema = z.object({
  documentId: z.string(),
  code: z.string().nullable(),
  status: z.enum(['open', 'closed']),
  skill: z.string(),
  createdAt: z.string(),
  class: z.object({ documentId: z.string(), name: z.string() }).nullable(),
});

export type RecoverySitting = z.infer<typeof recoverySittingSchema>;

// C-SIT-02 monitor payload (same wire shape the teacher board consumes).
export const recoveryMonitorSchema = z.object({
  sitting: z.object({
    documentId: z.string(),
    code: z.string().nullable(),
    status: z.enum(['open', 'closed']),
  }),
  students: z.array(
    z.object({
      documentId: z.string(),
      given_name: z.string(),
      family_name: z.string(),
      email: z.string().nullable(),
      state: z.enum(['not_joined', 'joined', 'in_progress', 'submitted', 'stalled']),
      session_documentId: z.string().nullable(),
    }),
  ),
});

export type RecoveryMonitor = z.infer<typeof recoveryMonitorSchema>;

// C-OPS-02 invalidate response (`{ data: { documentId, status: "closed" } }`).
export const invalidateResultSchema = z.object({
  documentId: z.string(),
  status: z.literal('closed'),
});
