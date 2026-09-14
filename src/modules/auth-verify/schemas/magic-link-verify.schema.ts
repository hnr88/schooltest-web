import { z } from 'zod';

/**
 * Web-side slice of the two public magic-link verify bodies, mirroring the API
 * contracts: the student C-ML-VERIFY DTO (schooltest-api
 * api/student-magic-link, `toStudentDto`) and the teacher C-TT-VERIFY
 * strictObject response (schooltest-api contracts/teacher-trial,
 * teacherMagicLinkVerifyResponseSchema). Only the fields the verify SCREENS
 * render are named; the `jwt` is parsed but intentionally never persisted —
 * the single-use claim itself is the point of the browser fallback.
 */
export const studentMagicLinkVerifyResponseSchema = z.object({
  jwt: z.string(),
  student: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string().nullable(),
    gradeYear: z.number().nullable(),
    classLabel: z.string().optional(),
    schoolName: z.string().optional(),
  }),
});

export const teacherMagicLinkVerifyResponseSchema = z.object({
  jwt: z.string(),
  teacher: z.object({
    documentId: z.string(),
    username: z.string(),
    email: z.string(),
  }),
});

export type StudentMagicLinkVerifyResponse = z.infer<typeof studentMagicLinkVerifyResponseSchema>;
export type TeacherMagicLinkVerifyResponse = z.infer<typeof teacherMagicLinkVerifyResponseSchema>;
