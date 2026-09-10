export { TeacherLiveSessionBanner } from './components/TeacherLiveSessionBanner';
export { TeacherClassCompletionRow } from './components/TeacherClassCompletionRow';
export { TestSessionsScreen } from './components/TestSessionsScreen';
export { ResultsScreen } from './components/ResultsScreen';
export { ClassResultsScreen } from './components/ClassResultsScreen';
export { ClassResultsTabs } from './components/ClassResultsTabs';
export { ExitPredictionsPanel } from './components/ExitPredictionsPanel';
export { TeachingInsightsPanel } from './components/TeachingInsightsPanel';
export { StudentsTabPanel } from './components/StudentsTabPanel';
export { StudentsResultsTable } from './components/StudentsResultsTable';
export { StudentDrillDownScreen } from './components/StudentDrillDownScreen';
export { StartTestSessionPanel } from './components/StartTestSessionPanel';
export { StartTestSessionForm } from './components/StartTestSessionForm';
export { TestSessionSelect } from './components/TestSessionSelect';
export { JoinCodePanel } from './components/JoinCodePanel';
export { JoinCodeDisplay } from './components/JoinCodeDisplay';
export { PastSessionsPanel } from './components/PastSessionsPanel';
export { PastSessionsTable } from './components/PastSessionsTable';
export { SessionMissingValue } from './components/SessionMissingValue';

export { useStartTestSessionForm } from './hooks/useStartTestSessionForm';
export { useJoinCodePanel } from './hooks/useJoinCodePanel';
export { usePastSessions } from './hooks/usePastSessions';
export { usePastSessionsColumns } from './hooks/usePastSessionsColumns';

export { useTeacherDashboardQuery } from './queries/use-teacher-dashboard.query';
export { useTeacherTestsQuery } from './queries/use-teacher-tests.query';
export { useTestSessionsQuery } from './queries/use-test-sessions.query';
export { useTestSessionMonitorQuery } from './queries/use-test-session-monitor.query';
export { useCreateTestSessionMutation } from './queries/use-create-test-session.mutation';
export { useCloseTestSessionMutation } from './queries/use-close-test-session.mutation';
export { useRescoreResultMutation } from './queries/use-rescore-result.mutation';
export { useStudentDrillDownQuery } from './queries/use-student-drill-down.query';
export { useTeacherExportMutation } from './queries/use-teacher-export.mutation';

export { teacherExportPath, parseTeacherExportFilename } from './lib/teacher-export';
export { toClassOptions, toTestOptions, deriveSetupStatus } from './lib/session-setup';
export { completionPercent, deriveDashboardStatus } from './lib/dashboard-cards';
export { resolveJoinCodeView, testSessionMonitorHref, findTestLabel } from './lib/join-code';
export { derivePastSessionsStatus, sessionCompletionPercent } from './lib/past-sessions';
export {
  PAST_SESSIONS_DEFAULT_SORT,
  pastSessionsClientConfig,
} from './lib/past-sessions-directory';
export {
  STUDENTS_RESULTS_DEFAULT_SORT,
  studentsResultsClientConfig,
} from './lib/students-results-directory';
export {
  classResultsHref,
  studentResultsHref,
  deriveResultsStatus,
  isResultsTabValue,
} from './lib/results-shell';
export { MASTERY_BAND_TONE } from './constants/mastery.constants';
export {
  TEST_SESSION_SELECT_TRIGGER_CLASS,
  START_TEST_SESSION_DEFAULTS,
} from './constants/test-session-setup.constants';
export { TEST_SESSIONS_PATH } from './constants/join-code.constants';
export {
  PAST_SESSION_STATUS_TONE,
  PAST_SESSION_STATUS_LABEL_KEY,
  PAST_SESSIONS_ROW_CLASS,
  PAST_SESSIONS_SCROLL_CLASS,
} from './constants/past-sessions.constants';
export {
  RESULTS_PATH,
  RESULTS_TAB_ORDER,
  DEFAULT_RESULTS_TAB,
} from './constants/results.constants';

export {
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
export type {
  StartTestSessionFormValues,
  TestSessionSetupStatus,
  TestSessionSetupCounts,
  TestSessionSelectProps,
  StartTestSessionFormProps,
} from './types/session-setup.types';
export type {
  JoinCodeReady,
  JoinCodeUnavailable,
  JoinCodeAbsent,
  JoinCodeView,
  JoinCodeDisplayProps,
} from './types/join-code.types';
export type {
  PastSessionsStatus,
  PastSessionsReadCounts,
  PastSessionsTableProps,
  SessionMissingValueProps,
} from './types/past-sessions.types';

export type {
  TeacherDashboardStatus,
  TeacherDashboardCounts,
  TeacherClassCompletionRowProps,
} from './types/teacher-dashboard.types';
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
  ResultsClassRowProps,
  ClassResultsHeaderProps,
  ClassResultsStatItem,
  ClassResultsStatProps,
  ClassResultsTabsProps,
  ComingSoonPanelProps,
  ClassSwitcherProps,
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
