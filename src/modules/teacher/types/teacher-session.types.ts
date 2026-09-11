import type { z } from 'zod';

import type {
  bookingScheduleErrorDetailsSchema,
  bookingScheduleErrorSchema,
  bookingScheduleReasonSchema,
  cancelTestSessionResponseSchema,
  closeTestSessionResponseSchema,
  createTestSessionBodySchema,
  createTestSessionResponseSchema,
  createTestSessionResultSchema,
  monitorSittingSchema,
  monitorStudentSchema,
  monitorSummarySchema,
  sittingStatusSchema,
  stageSchema,
  teacherTestSessionSchema,
  teacherTestSessionsResponseSchema,
  testSessionBookedWindowSchema,
  testSessionBookingSchema,
  testSessionClashDetailsSchema,
  testSessionClashSchema,
  testSessionMonitorResponseSchema,
  testSessionNotScheduledDetailsSchema,
  testSessionWindowSchema,
  updateTestSessionBodySchema,
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
export type TestSessionWindow = z.infer<typeof testSessionWindowSchema>;
export type TestSessionBookedWindow = z.infer<typeof testSessionBookedWindowSchema>;
export type BookingScheduleReason = z.infer<typeof bookingScheduleReasonSchema>;
export type BookingScheduleError = z.infer<typeof bookingScheduleErrorSchema>;
export type BookingScheduleErrorDetails = z.infer<typeof bookingScheduleErrorDetailsSchema>;
export type TestSessionClash = z.infer<typeof testSessionClashSchema>;
export type TestSessionClashDetails = z.infer<typeof testSessionClashDetailsSchema>;
export type TestSessionBooking = z.infer<typeof testSessionBookingSchema>;
export type CreateTestSessionResult = z.infer<typeof createTestSessionResultSchema>;
export type UpdateTestSessionBody = z.infer<typeof updateTestSessionBodySchema>;
export type CancelTestSessionResponse = z.infer<typeof cancelTestSessionResponseSchema>;
export type StartTestSessionResponse = CreateTestSessionResponse;
export type TestSessionNotScheduledDetails = z.infer<typeof testSessionNotScheduledDetailsSchema>;

export interface UpdateTestSessionInput {
  documentId: string;
  body: UpdateTestSessionBody;
}
