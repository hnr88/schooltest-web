import type { ExitRequestDecision, PendingExitRequest } from '@/modules/teacher/schemas/exit-request.schema';

export type { ExitRequestDecision, ExitRequestDecisionResponse, PendingExitRequest } from '@/modules/teacher/schemas/exit-request.schema';

/** Props of the live tab's pending-exit-requests panel. */
export interface PendingExitRequestsPanelProps {
  /** The open sitting whose queue the panel polls. */
  sittingDocumentId: string;
}
