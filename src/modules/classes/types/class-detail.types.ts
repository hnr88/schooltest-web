import type { z } from 'zod';

import type {
  classDetailSchema,
  classDetailStudentSchema,
  classDetailSummarySchema,
  classDetailTeacherSchema,
  classStudentDetailSchema,
  studentTestResultSchema,
  subskillsSchema,
  subskillVerdictSchema,
  SUBSKILL_KEYS,
} from '@/modules/classes/schemas/class-detail.schema';

// Every type is INFERRED from the C-CLS-05/06 schemas — one definition of the
// contract on the client, never a hand-written second copy that can drift.

export type SubskillKey = (typeof SUBSKILL_KEYS)[number];

export type SubskillVerdict = z.infer<typeof subskillVerdictSchema>;

export type Subskills = z.infer<typeof subskillsSchema>;

export type StudentTestResult = z.infer<typeof studentTestResultSchema>;

export type TestSlot = StudentTestResult['test_id'];

export type TestStatus = StudentTestResult['status'];

export type AcaraPhase = NonNullable<StudentTestResult['acara_phase']>;

export type ClassDetailTeacher = z.infer<typeof classDetailTeacherSchema>;

export type ClassDetailStudent = z.infer<typeof classDetailStudentSchema>;

export type ClassDetailSummary = z.infer<typeof classDetailSummarySchema>;

export type ClassDetail = z.infer<typeof classDetailSchema>;

export type ClassStudentDetail = z.infer<typeof classStudentDetailSchema>;
