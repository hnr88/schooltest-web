/**
 * `modules/results` — the data layer behind the result screens (spec v2 §6.3,
 * §7; task 29). Everything here speaks the SHARED ResultView v2 /
 * diagnostic-export v2 contract parsed strictly at the Axios boundary; the
 * legacy v1 view keeps its own path in `modules/report` until task 23 deletes
 * it.
 */
export { DISPLAY_SKILL_ORDER, displaySkills } from './lib/display-skills';
export type { DisplaySkillReading } from './lib/display-skills';
export { ConfidenceStrip } from './components/ConfidenceStrip';
export { ConsolidatingChecklist } from './components/ConsolidatingChecklist';
export { ErrorPatternsPanel, ERROR_PATTERN_COPY } from './components/ErrorPatternsPanel';
export { PrintReportButton } from './components/PrintReportButton';
export { ProgressTrendChart } from './components/ProgressTrendChart';
export { SkillMovementSparklines, sparklineRows } from './components/SkillMovementSparklines';
export { StudentResultHeader } from './components/StudentResultHeader';
export type { StudentIdentity } from './components/StudentResultHeader';
export { StudentResultScreen } from './components/StudentResultScreen';
export { SubskillCard } from './components/SubskillCard';
export { SubskillCardGrid } from './components/SubskillCardGrid';
export { useClassResultsQuery } from './queries/use-class-results.query';
export { useStudentResultQuery } from './queries/use-student-result.query';
export { useResultExportQuery } from './queries/use-result-export.query';
export type {
  DiagnosticExport,
  ResultHistoryPoint,
  ResultView,
  ResultViewAttribute,
  ResultViewAttributeScored,
  ResultViewGate,
  ResultViewOverall,
  ResultViewVocab,
} from './types/result.types';
