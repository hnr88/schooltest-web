/**
 * `modules/results` — the data layer behind the result screens (spec v2 §6.3,
 * §7; task 29). Everything here speaks the SHARED ResultView v2 /
 * diagnostic-export v2 contract parsed strictly at the Axios boundary; the
 * legacy v1 view keeps its own path in `modules/report` until task 23 deletes
 * it.
 */
export { DISPLAY_SKILL_ORDER, displaySkills } from './lib/display-skills';
export type { DisplaySkillReading } from './lib/display-skills';
export { displaySkillOfAttribute } from './lib/display-skills';
export { ConfidenceStrip } from './components/ConfidenceStrip';
export { ConsolidatingChecklist } from './components/ConsolidatingChecklist';
export { ErrorPatternsPanel } from './components/ErrorPatternsPanel';
export { PrintReportButton } from './components/PrintReportButton';
export { ProgressTrendChart } from './components/ProgressTrendChart';
export { AskAiPanel } from './components/AskAiPanel';
export { SkillMovementSparklines, sparklineRows } from './components/SkillMovementSparklines';
export { StudentCommentary } from './components/StudentCommentary';
export { StudentResultHeader } from './components/StudentResultHeader';
export { deidentify } from './lib/deidentify';
export { fallbackParagraphs } from './lib/commentary-fallback';
export { LLM_ENDPOINT, askClaude, buildAskPrompt, buildCommentaryPrompt, llmPayload } from './lib/llm-client';
export { renderStudentMarkdown } from './lib/llm-export';
export type { StudentIdentity } from './components/StudentResultHeader';
export { StudentResultScreen } from './components/StudentResultScreen';
export { SubskillCard } from './components/SubskillCard';
export { SubskillCardGrid } from './components/SubskillCardGrid';
export { useClassResultsQuery } from './queries/use-class-results.query';
export { useStudentResultQuery } from './queries/use-student-result.query';
export { useResultExportQuery } from './queries/use-result-export.query';
// scoring/05 — C-CLASS-EXPORT's first client consumer, beside the single-result
// export it sits next to on the wire.
export { useClassExportQuery, fetchClassExport } from './queries/use-class-export.query';
export { classExportSchema, classExportStudentSchema } from './schemas/class-export.schema';
export type { ClassExport, ClassExportStudent } from './schemas/class-export.schema';
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
export { classAverage, resultViewsOf, scoredCount, strongestSkill, weakestSkill } from './lib/class-aggregation';
export {
  needsSupport,
  progressDelta,
  secureCounts,
  subskillAverages,
  topGains,
  vocabStrandMeans,
} from './lib/class-analytics';
export { classRosterResponseSchema } from './schemas/roster.schema';
export type { RosterReleaseState, RosterRow, RosterStudent } from './types/roster.types';
// Teacher v2 Classes list — the PDF export reads the roster imperatively and
// ranks the class's weakest/strongest subskill on the same analytics layer.
export { classResultsQueryOptions } from './queries/use-class-results.query';
export { weakestFirstAverages } from './lib/class-analytics';
export { useReleaseHeldResultsMutation, useReleaseResultMutation } from './queries/use-release-result.mutation';
export { useRecallResultMutation } from './queries/use-recall-result.mutation';
export { resultRecallBodySchema, resultReleaseOutcomeSchema } from './schemas/result-release.schema';
export type {
  RecallResultInput,
  ReleaseBatchOutcome,
  ReleaseFailure,
  ResultReleaseOutcome,
} from './types/result-release.types';
// Teacher v2 Students tab — the student PDF report reads the result imperatively.
export { studentResultQueryOptions } from './queries/use-student-result.query';
