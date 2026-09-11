export { TeacherReportScreen } from './components/TeacherReportScreen';
export { TeacherReportBody } from './components/TeacherReportBody';
export { CrosswalkFactPanel } from './components/CrosswalkFactPanel';
export { ViewToggle } from './components/ViewToggle';
export { ParentReportView } from './components/ParentReportView';
export { ParentSubskillList } from './components/ParentSubskillList';
export { ReportListScreen } from './components/ReportListScreen';
export { DisplayLabelPanel } from './components/DisplayLabelPanel';
export { AttributePanel } from './components/AttributePanel';
export { AttributeMasteryRow } from './components/AttributeMasteryRow';
export { AttributeTrack } from './components/AttributeTrack';
export { EvidenceCount } from './components/EvidenceCount';
export { EvidenceSummary } from './components/EvidenceSummary';
export { SupplementaryStrand } from './components/SupplementaryStrand';
export { SupplementaryBandRow } from './components/SupplementaryBandRow';
export { ObservationList } from './components/ObservationList';
export { ErrorPatternNotes } from './components/ErrorPatternNotes';
export { ErrorPatternHeading, ErrorPatternNotice } from './components/ErrorPatternNotice';
export { ReportSkeleton } from './components/ReportSkeleton';
export { useStudentResultQuery as useResultQuery } from '@/modules/results/queries/use-student-result.query';
export { useDiagnosticBundleQuery } from './queries/use-diagnostic-bundle.query';
export { useMyStudentResultsQuery } from './queries/use-my-student-results.query';
export {
  getDisplayLabelState,
  getCrosswalkFieldState,
  resolveDisplayLabel,
} from './lib/display-label';
export { getResultStatusTone } from './lib/report-status';
export {
  buildAttributePanel,
  resolveAttributeRow,
  orderAttributeNames,
} from './lib/attribute-view-model';
export { buildSupplementaryStrand } from './lib/supplementary-view-model';
export { buildFamilyPreview } from './lib/parent-view-model';
export { PARENT_SUBSKILL_ORDER, PARENT_TONE_FILL, PARENT_TONE_SURFACE } from '@/modules/report/constants/lib.constants';
export { buildObservations } from './lib/observations';
export { observationValues } from './lib/observation-message';
export { buildErrorPatterns, hasDiagnosticBundle } from './lib/error-patterns-view-model';
export { useBarReveal } from './hooks/useBarReveal';
export {
  resultViewSchema,
  myStudentsResultsResponseSchema,
  diagnosticExportSchema,
  DIAGNOSTIC_JSON_FORMAT,
} from './schemas/result-view.schema';
export type {
  ResultView,
  ResultStatus,
  ReportSkill,
  CefrBand,
  Readiness,
} from './types/report.types';
export type { AssessedBand, AttributeName } from './schemas/result-view.schema';
export type {
  AttributeRowView,
  AttributeEvidence,
  AttributePanelView,
} from './types/attribute.types';
export type {
  SupplementaryBandCode,
  SupplementaryBandView,
  SupplementaryStrandView,
} from './types/supplementary.types';
export type { Observation, ObservationsView } from './types/observation.types';
export type {
  ReportViewMode,
  ParentSubskillState,
  ParentSubskillGroup,
  ParentSubskillsView,
} from './types/report-view.types';
export type {
  FamilyPreviewView,
  FamilyNextStep,
  FamilyStrength,
  FamilySubskillGroup,
} from './lib/parent-view-model';
export type {
  DiagnosticExport,
  ErrorPattern,
  ErrorPatternsView,
} from './types/error-pattern.types';
export { ReviewDrawer } from '@/modules/report/components/ReviewDrawer';
export {
  fetchResultReview,
  useResultReviewQuery,
} from '@/modules/report/queries/use-result-review.query';
export {
  reviewMarkDecision,
  reviewMarkPayload,
  reviewResetPayload,
  reviewSourceForValue,
  saveResultReview,
  useResultReviewMutation,
} from '@/modules/report/queries/use-result-review.mutation';
export { useReviewMarking } from '@/modules/report/components/ReviewDrawerWriteHalf';
export { ReviewSubmissionLauncher } from '@/modules/report/components/ReviewSubmissionLauncher';
export { reviewSavePayload } from '@/modules/report/queries/use-result-review.mutation';
export type { ReviewDrawerProps, ReviewHeaderContext } from '@/modules/report/types/review.types';
export { resolveAttributeDelta } from './lib/attribute-view-model';
export type { AttributeDeltaView } from './types/attribute.types';
