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
export { useResultQuery } from './queries/use-result.query';
export { useDiagnosticBundleQuery } from './queries/use-diagnostic-bundle.query';
export { useMyStudentResultsQuery } from './queries/use-my-student-results.query';
export {
  splitDisplayLabel,
  getDisplayLabelState,
  getCrosswalkFieldState,
  resolveDisplayLabel,
} from './lib/display-label';
export { getResultStatusTone } from './lib/report-status';
export {
  buildAttributePanel,
  resolveAttributeRow,
  orderAttributeCodes,
} from './lib/attribute-view-model';
export { buildSupplementaryStrand } from './lib/supplementary-view-model';
export { buildParentReport } from './lib/parent-view-model';
export {
  PARENT_SUBSKILL_ORDER,
  PARENT_TONE_BY_STATUS,
  PARENT_TONE_SURFACE,
  PARENT_TONE_FILL,
} from './lib/parent-tone';
export { buildObservations } from './lib/observations';
export { observationValues } from './lib/observation-message';
export { buildErrorPatterns, hasDiagnosticBundle } from './lib/error-patterns-view-model';
export { useBarReveal } from './hooks/useBarReveal';
export {
  resultViewSchema,
  resultViewBaseSchema,
  myStudentsResultsResponseSchema,
} from './schemas/result-view.schema';
export {
  diagnosticBundleSchema,
  diagnosticSkillEntrySchema,
  DIAGNOSTIC_JSON_FORMAT,
} from './schemas/diagnostic-bundle.schema';
export type {
  ResultView,
  ResultViewBase,
  ResultAttributeEntry,
  ResultSupplementary,
  ResultStatus,
  ReportSkill,
  CefrBand,
  Readiness,
  AttributeStatus,
  DisplayLabelParts,
  DisplayLabelState,
  ResolvedDisplayLabel,
} from './types/report.types';
export type {
  AssessedAttributeStatus,
  AttributeConfidence,
  AttributeRowView,
  AttributeEvidence,
  AttributePanelView,
} from './types/attribute.types';
export type {
  SupplementaryBandCode,
  SupplementaryBandView,
  SupplementaryStrandView,
} from './types/supplementary.types';
export type { Observation, ObservationKey, ObservationsView } from './types/observation.types';
export type {
  ReportViewMode,
  ParentSubskillState,
  ParentSubskillGroup,
  ParentHeadline,
  ParentSubskillsView,
  ParentReportView as ParentReportViewModel,
} from './types/report-view.types';
export type {
  DiagnosticBundle,
  DiagnosticSkillEntry,
  ErrorPatternsView,
} from './types/error-pattern.types';
