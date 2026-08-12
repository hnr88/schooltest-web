import type { z } from 'zod';

import type {
  classInsightsResponseSchema,
  classStudentRowSchema,
  classStudentsResponseSchema,
  classStudentsSummarySchema,
  insightGroupKeySchema,
  insightGroupSchema,
  insightMasterySchema,
  studentDrillDownResponseSchema,
  studentProgressSchema,
  studentSubskillSchema,
  studentTestCellSchema,
  studentTestResultSchema,
} from '@/modules/teacher/schemas/teacher-result.schema';

export type StudentTestCell = z.infer<typeof studentTestCellSchema>;
export type ClassStudentRow = z.infer<typeof classStudentRowSchema>;
export type ClassStudentsSummary = z.infer<typeof classStudentsSummarySchema>;
export type ClassStudentsResponse = z.infer<typeof classStudentsResponseSchema>;
export type StudentSubskill = z.infer<typeof studentSubskillSchema>;
export type StudentTestResult = z.infer<typeof studentTestResultSchema>;
export type StudentProgress = z.infer<typeof studentProgressSchema>;
export type StudentDrillDownResponse = z.infer<typeof studentDrillDownResponseSchema>;
export type InsightMastery = z.infer<typeof insightMasterySchema>;
export type InsightGroupKey = z.infer<typeof insightGroupKeySchema>;
export type InsightGroup = z.infer<typeof insightGroupSchema>;
export type ClassInsightsResponse = z.infer<typeof classInsightsResponseSchema>;
