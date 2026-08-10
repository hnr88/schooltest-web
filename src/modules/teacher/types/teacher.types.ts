import type { z } from 'zod';

import type {
  dashboardClassSchema,
  dashboardLiveSessionSchema,
  masteryBandSchema,
  monitorStateSchema,
  namedAttributeSchema,
  readingAttributeSchema,
  teacherClassRefSchema,
  teacherDashboardResponseSchema,
  teacherErrorSchema,
  teacherMasteryBandsSchema,
  teacherStudentRefSchema,
  teacherTestSchema,
  teacherTestsResponseSchema,
  testCompletionSchema,
  testProgressStateSchema,
  testVariantSchema,
  topGapSchema,
} from '@/modules/teacher/schemas/teacher.schema';

export type ReadingAttribute = z.infer<typeof readingAttributeSchema>;
export type MasteryBand = z.infer<typeof masteryBandSchema>;
export type MonitorState = z.infer<typeof monitorStateSchema>;
export type TestVariant = z.infer<typeof testVariantSchema>;
export type TestProgressState = z.infer<typeof testProgressStateSchema>;
export type TeacherMasteryBands = z.infer<typeof teacherMasteryBandsSchema>;
export type TestCompletion = z.infer<typeof testCompletionSchema>;
export type TeacherClassRef = z.infer<typeof teacherClassRefSchema>;
export type TeacherStudentRef = z.infer<typeof teacherStudentRefSchema>;
export type NamedAttribute = z.infer<typeof namedAttributeSchema>;
export type TopGap = z.infer<typeof topGapSchema>;
export type TeacherError = z.infer<typeof teacherErrorSchema>;
export type DashboardClass = z.infer<typeof dashboardClassSchema>;
export type DashboardLiveSession = z.infer<typeof dashboardLiveSessionSchema>;
export type TeacherDashboardResponse = z.infer<typeof teacherDashboardResponseSchema>;
export type TeacherTest = z.infer<typeof teacherTestSchema>;
export type TeacherTestsResponse = z.infer<typeof teacherTestsResponseSchema>;
