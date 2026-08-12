import type { z } from 'zod';

import type {
  closeTestSessionResponseSchema,
  createTestSessionBodySchema,
  createTestSessionResponseSchema,
  monitorSittingSchema,
  monitorStudentSchema,
  monitorSummarySchema,
  sittingStatusSchema,
  stageSchema,
  teacherTestSessionSchema,
  teacherTestSessionsResponseSchema,
  testSessionMonitorResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';

export type SittingStatus = z.infer<typeof sittingStatusSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type CreateTestSessionBody = z.infer<typeof createTestSessionBodySchema>;
export type CreateTestSessionResponse = z.infer<typeof createTestSessionResponseSchema>;
export type TeacherTestSession = z.infer<typeof teacherTestSessionSchema>;
export type TeacherTestSessionsResponse = z.infer<typeof teacherTestSessionsResponseSchema>;
export type MonitorSitting = z.infer<typeof monitorSittingSchema>;
export type MonitorSummary = z.infer<typeof monitorSummarySchema>;
export type MonitorStudent = z.infer<typeof monitorStudentSchema>;
export type TestSessionMonitorResponse = z.infer<typeof testSessionMonitorResponseSchema>;
export type CloseTestSessionResponse = z.infer<typeof closeTestSessionResponseSchema>;
