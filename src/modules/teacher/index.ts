export { TestSessionsScreen } from './components/TestSessionsScreen';
export { ResultsScreen } from './components/ResultsScreen';
export { StartTestSessionPanel } from './components/StartTestSessionPanel';
export { StartTestSessionForm } from './components/StartTestSessionForm';
export { TestSessionSelect } from './components/TestSessionSelect';

export { useStartTestSessionForm } from './hooks/useStartTestSessionForm';

export { useTeacherDashboardQuery } from './queries/use-teacher-dashboard.query';
export { useTeacherTestsQuery } from './queries/use-teacher-tests.query';
export { useTestSessionsQuery } from './queries/use-test-sessions.query';
export { useTestSessionMonitorQuery } from './queries/use-test-session-monitor.query';
export { useCreateTestSessionMutation } from './queries/use-create-test-session.mutation';
export { useCloseTestSessionMutation } from './queries/use-close-test-session.mutation';
export { useClassStudentsQuery } from './queries/use-class-students.query';
export { useStudentDrillDownQuery } from './queries/use-student-drill-down.query';
export { useClassInsightsQuery } from './queries/use-class-insights.query';
export { useClassProgressQuery } from './queries/use-class-progress.query';
export { useTeacherExportMutation } from './queries/use-teacher-export.mutation';

export { teacherExportPath, parseTeacherExportFilename } from './lib/teacher-export';
export { toClassOptions, toTestOptions, deriveSetupStatus } from './lib/session-setup';

export { MASTERY_BAND_TONE } from './constants/mastery.constants';
export {
  TEST_SESSION_SELECT_TRIGGER_CLASS,
  START_TEST_SESSION_DEFAULTS,
} from './constants/test-session-setup.constants';

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
  classInsightsResponseSchema,
} from './schemas/teacher-result.schema';
export { classProgressResponseSchema } from './schemas/teacher-progress.schema';
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
  InsightMastery,
  InsightGroupKey,
  InsightGroup,
  ClassInsightsResponse,
} from './types/teacher-result.types';
export type {
  ProgressCohort,
  ProgressSummary,
  ProgressSubskillShift,
  AcaraMovementDetail,
  AcaraMovement,
  ProgressMover,
  ClassProgressResponse,
} from './types/teacher-progress.types';
export type {
  StartTestSessionFormValues,
  TestSessionSetupStatus,
  TestSessionSetupCounts,
  TestSessionSelectProps,
  StartTestSessionFormProps,
} from './types/session-setup.types';
export type {
  TeacherExportKind,
  TeacherExportDocument,
  TeacherExportHeaders,
  TeacherExportRequest,
  TeacherExportFile,
} from './types/teacher-export.types';
