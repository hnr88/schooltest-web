/**
 * The ops action kit — the one path every ops action and bulk action takes.
 *
 * Consumers import from `@/modules/ops/actions`. Tasks 12, 15, 16, 21, 24, 25,
 * 27 and 30 are consumers of the runner here, not runners of their own: there
 * is no bulk-jobs API, so a bulk action is this runner over the single-item
 * endpoints that already exist.
 */
export { useOpsActionRunner } from './hooks/use-ops-action-runner';
export { useOpsConfirmAction } from './hooks/use-ops-confirm-action';
export type { OpsConfirmActionOptions } from './hooks/use-ops-confirm-action';
export { useOpsSelection } from './hooks/use-ops-selection';
export type { OpsSelectionApi, OpsSelectionOptions } from './hooks/use-ops-selection';

export { OpsBulkBar } from './components/OpsBulkBar';
export type { OpsBulkBarAction, OpsBulkBarProps } from './components/OpsBulkBar';
export { OpsTypedNameConfirm } from './components/OpsTypedNameConfirm';
export type { OpsTypedNameConfirmProps } from './components/OpsTypedNameConfirm';

export { describeRunOutcome } from './lib/ops-action-feedback';
export type { OpsActionFeedback, OpsActionFeedbackTone } from './lib/ops-action-feedback';
export {
  downloadOpsFile,
  downloadOpsFiles,
  filenameFromDisposition,
  OpsDownloadError,
} from './lib/ops-download';
export type { OpsDownloadRequest, OpsDownloadedFile } from './lib/ops-download';
export { normaliseTypedName, typedNameMatches } from './lib/ops-typed-name';
export {
  headerCheckboxState,
  selectionKey,
  selectedTargets,
  targetFromKey,
} from './lib/ops-selection';
export type { OpsHeaderCheckboxState } from './lib/ops-selection';
export {
  dispositionOfFailure,
  envelopeOfDisposition,
  statusOfDisposition,
} from './lib/ops-action-disposition';
export type { OpsActionDisposition } from './lib/ops-action-disposition';

export {
  OPS_ACTION_MAX_IN_FLIGHT,
  OPS_DOWNLOAD_FALLBACK_FILENAME,
  OPS_SELECTION_MAX,
} from './constants/ops-action.constants';

export type {
  OpsActionDefinition,
  OpsActionOutcome,
  OpsActionResultItem,
  OpsActionRunState,
  OpsActionRunStatus,
  OpsActionSummary,
  OpsActionTarget,
} from './types/ops-action.types';
