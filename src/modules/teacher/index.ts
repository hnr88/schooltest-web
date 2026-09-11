export { TestSessionsScreen } from './components/TestSessionsScreen';
export { ResultsScreen } from './components/ResultsScreen';
export { ClassResultsScreen } from './components/ClassResultsScreen';
export { ClassResultsTabs } from './components/ClassResultsTabs';
export { ExitPredictionsPanel } from './components/ExitPredictionsPanel';
export { TeachingInsightsPanel } from './components/TeachingInsightsPanel';
export { StudentsTabPanel } from './components/StudentsTabPanel';
export { StudentsResultsTable } from './components/StudentsResultsTable';
export { StudentDrillDownScreen } from './components/StudentDrillDownScreen';
export { SessionMissingValue } from './components/SessionMissingValue';

export { useTeacherDashboardQuery } from './queries/use-teacher-dashboard.query';
export { useTeacherTestsQuery } from './queries/use-teacher-tests.query';
export { useTestSessionsQuery } from './queries/use-test-sessions.query';
export { useTestSessionMonitorQuery } from './queries/use-test-session-monitor.query';
export { useCreateTestSessionMutation } from './queries/use-create-test-session.mutation';
export { useCloseTestSessionMutation } from './queries/use-close-test-session.mutation';
export { useRescoreResultMutation } from './queries/use-rescore-result.mutation';
export { useStudentDrillDownQuery } from './queries/use-student-drill-down.query';
export { useTeacherExportMutation } from './queries/use-teacher-export.mutation';
export { useUpdateTestSessionMutation } from './queries/use-update-test-session.mutation';
export { useCancelTestSessionMutation } from './queries/use-cancel-test-session.mutation';
export { useStartTestSessionMutation } from './queries/use-start-test-session.mutation';

export { teacherExportPath, parseTeacherExportFilename } from './lib/teacher-export';
export { resolveJoinCodeView, testSessionMonitorHref, findTestLabel } from './lib/join-code';
export {
  classResultsHref,
  studentResultsHref,
  deriveResultsStatus,
  isResultsTabValue,
} from './lib/results-shell';
export { MASTERY_BAND_TONE } from './constants/mastery.constants';
export { TEST_SESSIONS_PATH } from './constants/join-code.constants';
export {
  RESULTS_PATH,
  RESULTS_TAB_ORDER,
  DEFAULT_RESULTS_TAB,
} from './constants/results.constants';

export {
  connectionStateSchema,
  masteryBandSchema,
  monitorStateSchema,
  testVariantSchema,
  testProgressStateSchema,
  teacherMasteryBandsSchema,
  teacherErrorSchema,
  teacherDashboardResponseSchema,
  teacherTestsResponseSchema,
} from './schemas/teacher.schema';
export {
  createTestSessionBodySchema,
  createTestSessionResponseSchema,
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
  closeTestSessionResponseSchema,
} from './schemas/teacher-session.schema';
export {
  classStudentsResponseSchema,
  studentDrillDownResponseSchema,
} from './schemas/teacher-result.schema';
export { startTestSessionFormSchema } from './schemas/session-setup.schema';
export {
  teacherExportKindSchema,
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
  TEACHER_EXPORT_CONTENT_TYPE,
  TEACHER_EXPORT_PROMPT_HEADING,
  TEACHER_EXPORT_DISPOSITION_PATTERN,
} from './schemas/teacher-export.schema';

export type {
  ReadingAttribute,
  MasteryBand,
  MonitorState,
  TestVariant,
  TestProgressState,
  TeacherMasteryBands,
  TestCompletion,
  TeacherClassRef,
  TeacherStudentRef,
  NamedAttribute,
  TopGap,
  TeacherError,
  DashboardClass,
  DashboardLiveSession,
  TeacherDashboardResponse,
  TeacherTest,
  TeacherTestsResponse,
} from './types/teacher.types';
export type {
  SittingStatus,
  Stage,
  CreateTestSessionBody,
  CreateTestSessionResponse,
  TeacherTestSession,
  TeacherTestSessionsResponse,
  MonitorSitting,
  MonitorSummary,
  MonitorStudent,
  TestSessionMonitorResponse,
  CloseTestSessionResponse,
  TestSessionWindow,
  TestSessionBookedWindow,
  BookingScheduleReason,
  BookingScheduleError,
  BookingScheduleErrorDetails,
  TestSessionClash,
  TestSessionClashDetails,
  TestSessionBooking,
  CreateTestSessionResult,
  UpdateTestSessionBody,
  UpdateTestSessionInput,
  CancelTestSessionResponse,
  StartTestSessionResponse,
  TestSessionNotScheduledDetails,
} from './types/teacher-session.types';
export type {
  StudentTestCell,
  ClassStudentRow,
  ClassStudentsSummary,
  ClassStudentsResponse,
  StudentSubskill,
  StudentTestResult,
  StudentProgress,
  StudentDrillDownResponse,
} from './types/teacher-result.types';
// Scoring task 24: the progress/insights barrel re-exports are gone with their
// surfaces. The schema/type FILES stay — the export-derivation test cluster
// still reads them until 70459cff's re-point settles.
export type { StartTestSessionFormValues } from './types/session-setup.types';
export type {
  JoinCodeReady,
  JoinCodeUnavailable,
  JoinCodeAbsent,
  JoinCodeView,
} from './types/join-code.types';
export type { SessionMissingValueProps } from './types/past-sessions.types';

export type {
  TeacherExportKind,
  TeacherExportDocument,
  TeacherExportHeaders,
  TeacherExportRequest,
  TeacherExportFile,
} from './types/teacher-export.types';
export type {
  ResultsTabValue,
  SkillScopeValue,
  ResultsReadStatus,
  ResultsReadCounts,
  ClassResultsHeaderProps,
  ComingSoonPanelProps,
  ClassResultsScreenProps,
} from './types/results-shell.types';
export type {
  StudentsTabPanelProps,
  StudentsResultsTableProps,
  RosterStudentCellsProps,
} from './types/students-table.types';
export type {
  TeachingInsightsPanelProps,
  SubskillMasteryListProps,
  SubskillMasteryRowProps,
  VocabStrandMeanProps,
} from './types/class-analytics.types';

// Progress tab (task 34, dashboard §3) — ranked lists, phase spread, deferred chart.
export { ProgressTabPanel } from './components/ProgressTabPanel';
export { ProgressAcaraSection } from './components/ProgressAcaraSection';
export { ProgressDeltaPill } from './components/ProgressDeltaPill';
export { progressDelta } from '@/modules/results/lib/class-analytics';
export type {
  ProgressTabPanelProps,
  ProgressAcaraSectionProps,
  ProgressMoverRowProps,
  ProgressWatchListProps,
  ProgressWatchVariant,
} from './types/class-analytics.types';

// Live monitoring grid (task 037, C-TS-3).
export { LiveMonitorScreen } from './components/LiveMonitorScreen';
export { LiveMonitorHeader } from './components/LiveMonitorHeader';
export { LiveMonitorSummary } from './components/LiveMonitorSummary';
export { LiveMonitorGrid } from './components/LiveMonitorGrid';
export { LiveMonitorTile } from './components/LiveMonitorTile';
export { LiveMonitorLegend } from './components/LiveMonitorLegend';
export { useLiveMonitor } from './hooks/useLiveMonitor';
export {
  deriveLiveMonitorStatus,
  monitorSummaryItems,
  monitorTileDetail,
  sortMonitorStudents,
  sessionElapsedMinutes,
} from './lib/live-monitor';
export {
  MONITOR_POLL_INTERVAL_MS,
  MONITOR_STATE_ORDER,
  MONITOR_SUMMARY_ORDER,
  MONITOR_STATE_THEME,
  MONITOR_STATE_LABEL_KEY,
  MONITOR_SUMMARY_LABEL_KEY,
} from './constants/live-monitor.constants';
export type {
  MonitorSummaryKey,
  MonitorTileTheme,
  MonitorSummaryItem,
  MonitorTileDetail,
  LiveMonitorReadStatus,
  LiveMonitorReadCounts,
  LiveMonitorState,
  LiveMonitorScreenProps,
  LiveMonitorHeaderProps,
  LiveMonitorSummaryProps,
  LiveMonitorGridProps,
  LiveMonitorTileProps,
  LiveMonitorLegendProps,
} from './types/live-monitor.types';

// Start a new session (Teacher Portal v2 S25–S28): the ONE modal, mounted once in the
// dashboard frame; a screen in any module opens it through the store.
export { StartSessionHost } from './components/start-session/StartSessionHost';
export { useStartSessionStore } from './stores/use-start-session-store';
export type {
  StartSessionMode,
  StartSessionTab,
  StartSessionOptions,
} from './types/start-session.types';
